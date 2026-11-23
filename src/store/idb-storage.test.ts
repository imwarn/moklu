/**
 * [INPUT]: depends on vitest and idbStorage from ./idb-storage
 * [OUTPUT]: unit tests verifying IndexedDB storage round-trip and non-hanging rejection/fallback on tx.onabort
 * [POS]: unit test suite for src/store/idb-storage.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

function createAbortingIndexedDb(abortError: Error | null) {
  const makeTx = () => {
    const tx: {
      error: Error | null
      oncomplete: (() => void) | null
      onerror: (() => void) | null
      onabort: (() => void) | null
      objectStore: () => {
        get: () => { result: undefined; onsuccess: (() => void) | null; onerror: (() => void) | null }
        put: () => void
        delete: () => void
      }
    } = {
      error: abortError,
      oncomplete: null,
      onerror: null,
      onabort: null,
      objectStore: () => ({
        get: () => {
          const req = { result: undefined, onsuccess: null, onerror: null }
          queueMicrotask(() => {
            tx.onabort?.()
          })
          return req
        },
        put: () => {
          queueMicrotask(() => {
            tx.onabort?.()
          })
        },
        delete: () => {
          queueMicrotask(() => {
            tx.onabort?.()
          })
        },
      }),
    }
    return tx
  }

  return {
    open: () => {
      const req: {
        result: { objectStoreNames: { contains: () => boolean }; transaction: () => ReturnType<typeof makeTx> }
        onupgradeneeded: (() => void) | null
        onsuccess: (() => void) | null
        onerror: (() => void) | null
        error: Error | null
      } = {
        result: {
          objectStoreNames: { contains: () => true },
          transaction: () => makeTx(),
        },
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        error: null,
      }
      queueMicrotask(() => {
        req.onsuccess?.()
      })
      return req
    },
  }
}

describe('idbStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('persists, reads, and removes values via IndexedDB', async () => {
    const { idbStorage } = await import('./idb-storage')
    await idbStorage.setItem('test-key', 'hello')
    expect(await idbStorage.getItem('test-key')).toBe('hello')

    await idbStorage.removeItem('test-key')
    expect(await idbStorage.getItem('test-key')).toBeNull()
  })

  it('settles getItem, setItem, and removeItem without hanging when transactions abort', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const quotaErr = new DOMException('Quota exceeded', 'QuotaExceededError')
    vi.stubGlobal('indexedDB', createAbortingIndexedDb(quotaErr))
    vi.resetModules()

    const { idbStorage } = await import('./idb-storage')

    await expect(idbStorage.setItem('quota-key', 'payload')).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith('[idbStorage] setItem failed:', quotaErr)

    await expect(idbStorage.getItem('quota-key')).resolves.toBeNull()
    await expect(idbStorage.removeItem('quota-key')).resolves.toBeUndefined()
  })

  it('synthesizes an error when tx.onabort fires with tx.error === null', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('indexedDB', createAbortingIndexedDb(null))
    vi.resetModules()

    const { idbStorage } = await import('./idb-storage')

    await expect(idbStorage.setItem('abort-null', 'payload')).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(
      '[idbStorage] setItem failed:',
      expect.objectContaining({ message: expect.stringMatching(/aborted/i) }),
    )
  })
})
