/**
 * [INPUT]: depends on vitest and ./chunkRecovery
 * [OUTPUT]: unit tests verifying vite:preloadError and unhandledrejection leaf-chunk auto-reload, attemptChunkErrorRecovery, 15s sessionStorage cooldown anti-loop guard, per-path isolation, error detection, and listener cleanup
 * [POS]: unit test suite for src/utils/chunkRecovery.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { describe, expect, it, vi } from 'vitest'
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_STORAGE_KEY,
  attemptChunkErrorRecovery,
  canAttemptChunkReload,
  clearChunkReloadGuard,
  handleVitePreloadError,
  installChunkRecoveryListener,
  isChunkLoadError,
  triggerFreshReload,
} from './chunkRecovery'

function makeMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('chunkRecovery', () => {
  it('identifies Vite and browser dynamic import chunk errors accurately', () => {
    expect(
      isChunkLoadError(
        new TypeError('Failed to fetch dynamically imported module: https://moklu.app/assets/ProjectsModal-CMUH2nSZ.js'),
      ),
    ).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError('ChunkLoadError: Loading chunk 12 failed')).toBe(true)
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
  })

  it('prevents default and triggers a cache-busting reload once per cooldown window', async () => {
    const storage = makeMemoryStorage()
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const reloadFn = vi.fn()
    const preventDefault1 = vi.fn()
    const preventDefault2 = vi.fn()

    const first = handleVitePreloadError(
      { preventDefault: preventDefault1 },
      {
        pathname: '/zh/studio',
        href: 'https://moklu.app/zh/studio',
        now: 100_000,
        storage,
        fetchFn,
        reloadFn,
      },
    )

    expect(first).toBe(true)
    expect(preventDefault1).toHaveBeenCalledTimes(1)
    expect(storage.getItem(CHUNK_RELOAD_STORAGE_KEY)).toContain('/zh/studio')

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fetchFn).toHaveBeenCalledWith('https://moklu.app/zh/studio', { cache: 'reload' })
    expect(reloadFn).toHaveBeenCalledTimes(1)

    // Second error within 15s cooldown on same pathname must NOT reload again
    const second = handleVitePreloadError(
      { preventDefault: preventDefault2 },
      {
        pathname: '/zh/studio',
        href: 'https://moklu.app/zh/studio',
        now: 100_000 + CHUNK_RELOAD_COOLDOWN_MS - 1,
        storage,
        fetchFn,
        reloadFn,
      },
    )
    expect(second).toBe(false)
    expect(preventDefault2).not.toHaveBeenCalled()

    // After cooldown expires (or on a different pathname), recovery is allowed again
    expect(canAttemptChunkReload('/zh/studio', 100_000 + CHUNK_RELOAD_COOLDOWN_MS, storage)).toBe(true)
    expect(canAttemptChunkReload('/studio', 100_500, storage)).toBe(true)

    clearChunkReloadGuard(storage)
    expect(canAttemptChunkReload('/zh/studio', 100_500, storage)).toBe(true)
  })

  it('still reloads even when cache-revalidation fetch rejects', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'))
    const reloadFn = vi.fn()
    await triggerFreshReload({
      href: 'https://moklu.app/zh/studio',
      fetchFn,
      reloadFn,
    })
    expect(reloadFn).toHaveBeenCalledTimes(1)
  })

  it('recovers leaf dynamic-import errors via attemptChunkErrorRecovery with 15s cooldown guard', async () => {
    const storage = makeMemoryStorage()
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const reloadFn = vi.fn()

    // Non-chunk errors must never trigger reload
    expect(
      attemptChunkErrorRecovery(new Error('Normal runtime bug'), {
        pathname: '/zh/carousel-splitter/',
        href: 'https://moklu.app/zh/carousel-splitter/',
        now: 200_000,
        storage,
        fetchFn,
        reloadFn,
      }),
    ).toBe(false)
    expect(reloadFn).not.toHaveBeenCalled()

    const leafChunkErr = new TypeError(
      'Failed to fetch dynamically imported module: https://moklu.app/assets/SplitQuickTool-Tscs8uh7.js',
    )
    expect(
      attemptChunkErrorRecovery(leafChunkErr, {
        pathname: '/zh/carousel-splitter/',
        href: 'https://moklu.app/zh/carousel-splitter/',
        now: 200_000,
        storage,
        fetchFn,
        reloadFn,
      }),
    ).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fetchFn).toHaveBeenCalledWith('https://moklu.app/zh/carousel-splitter/', { cache: 'reload' })
    expect(reloadFn).toHaveBeenCalledTimes(1)

    // Repeated chunk error within 15s cooldown must be suppressed
    expect(
      attemptChunkErrorRecovery(leafChunkErr, {
        pathname: '/zh/carousel-splitter/',
        href: 'https://moklu.app/zh/carousel-splitter/',
        now: 200_000 + CHUNK_RELOAD_COOLDOWN_MS - 1,
        storage,
        fetchFn,
        reloadFn,
      }),
    ).toBe(false)
    expect(reloadFn).toHaveBeenCalledTimes(1)

    // Once cooldown expires, recovery is permitted again
    expect(
      attemptChunkErrorRecovery(leafChunkErr, {
        pathname: '/zh/carousel-splitter/',
        href: 'https://moklu.app/zh/carousel-splitter/',
        now: 200_000 + CHUNK_RELOAD_COOLDOWN_MS,
        storage,
        fetchFn,
        reloadFn,
      }),
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(reloadFn).toHaveBeenCalledTimes(2)
  })

  it('installs and cleans up both vite:preloadError and unhandledrejection listeners cleanly', async () => {
    const listeners = new Map<string, EventListenerOrEventListenerObject>()
    const target = {
      addEventListener: vi.fn((type: string, fn: EventListenerOrEventListenerObject) => {
        listeners.set(type, fn)
      }),
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type)
      }),
    }

    const storage = makeMemoryStorage()
    const reloadFn = vi.fn()
    const fetchFn = vi.fn().mockResolvedValue({ ok: true })
    const cleanup = installChunkRecoveryListener(target as unknown as Window, {
      pathname: '/zh/studio',
      href: 'https://moklu.app/zh/studio',
      now: 300_000,
      storage,
      fetchFn,
      reloadFn,
    })

    expect(target.addEventListener).toHaveBeenCalledWith('vite:preloadError', expect.any(Function))
    expect(target.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))

    const rejectionFn = listeners.get('unhandledrejection') as (e: Event) => void
    const nonChunkPreventDefault = vi.fn()
    rejectionFn({
      reason: new Error('Regular rejected promise'),
      preventDefault: nonChunkPreventDefault,
    } as unknown as Event)
    expect(nonChunkPreventDefault).not.toHaveBeenCalled()

    const chunkPreventDefault = vi.fn()
    rejectionFn({
      reason: new TypeError(
        'Failed to fetch dynamically imported module: https://moklu.app/assets/zh-abc12345.js',
      ),
      preventDefault: chunkPreventDefault,
    } as unknown as Event)
    expect(chunkPreventDefault).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(reloadFn).toHaveBeenCalledTimes(1)

    // Second rejection within 15s cooldown is blocked from looping
    const throttledPreventDefault = vi.fn()
    rejectionFn({
      reason: new TypeError('Importing a module script failed.'),
      preventDefault: throttledPreventDefault,
    } as unknown as Event)
    expect(throttledPreventDefault).not.toHaveBeenCalled()

    // Clear guard and verify vite:preloadError still works as expected
    clearChunkReloadGuard(storage)
    const preloadFn = listeners.get('vite:preloadError') as (e: Event) => void
    const preventDefault = vi.fn()
    preloadFn({ preventDefault } as unknown as Event)
    expect(preventDefault).toHaveBeenCalledTimes(1)

    cleanup()
    expect(target.removeEventListener).toHaveBeenCalledWith('vite:preloadError', expect.any(Function))
    expect(target.removeEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
  })
})
