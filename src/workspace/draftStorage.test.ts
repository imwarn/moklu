/**
 * [INPUT]: depends on vitest, createDemoImageInput from ./demoAssets, and draftStorage APIs from ./draftStorage
 * [OUTPUT]: unit tests verifying IndexedDB draft persistence round-trip, strict demo-image exclusion, tx.onabort/tx.onerror non-hanging fallback, SSR/missing-IDB silent degradation, and corrupted-record resilience
 * [POS]: automated verification suite for src/workspace/draftStorage.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDemoImageInput } from './demoAssets'
import type { WorkspaceImageInput } from './types'

function createFailingIndexedDb(mode: 'abort' | 'error', errorObj: Error | null) {
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
        clear: () => void
      }
    } = {
      error: errorObj,
      oncomplete: null,
      onerror: null,
      onabort: null,
      objectStore: () => {
        const triggerFailure = () => {
          queueMicrotask(() => {
            if (mode === 'abort') tx.onabort?.()
            else tx.onerror?.()
          })
        }
        return {
          get: () => {
            const req = { result: undefined, onsuccess: null, onerror: null }
            triggerFailure()
            return req
          },
          put: () => triggerFailure(),
          delete: () => triggerFailure(),
          clear: () => triggerFailure(),
        }
      },
    }
    return tx
  }

  return {
    open: () => {
      const req: {
        result: {
          objectStoreNames: { contains: () => boolean }
          transaction: () => ReturnType<typeof makeTx>
          onversionchange: (() => void) | null
          onclose: (() => void) | null
        }
        onupgradeneeded: (() => void) | null
        onsuccess: (() => void) | null
        onerror: (() => void) | null
        onblocked: (() => void) | null
        error: Error | null
      } = {
        result: {
          objectStoreNames: { contains: () => true },
          transaction: () => makeTx(),
          onversionchange: null,
          onclose: null,
        },
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
        error: null,
      }
      queueMicrotask(() => {
        req.onsuccess?.()
      })
      return req
    },
  }
}

const USER_IMAGE: WorkspaceImageInput = {
  id: 'user-img-1',
  name: 'screenshot.png',
  width: 1200,
  height: 800,
  dataUrl: 'data:image/png;base64,AAAA',
  sizeBytes: 2048,
  mimeType: 'image/png',
  rotation: 90,
}

describe('draftStorage', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    const mod = await import('./draftStorage')
    mod.resetDraftDbCache()
    await mod.clearAllToolDrafts()
    vi.resetModules()
  })

  it('persists, restores, deletes, and clears tool drafts in moklu-workspace-drafts', async () => {
    const {
      DRAFT_DB_NAME,
      clearAllToolDrafts,
      deleteToolDraft,
      deserializeDraftImages,
      loadToolDraft,
      saveToolDraft,
    } = await import('./draftStorage')

    expect(DRAFT_DB_NAME).toBe('moklu-workspace-drafts')
    expect(await loadToolDraft('merge')).toBeNull()

    const savedAt = await saveToolDraft('merge', {
      images: [USER_IMAGE],
      settings: { direction: 'vertical', removeOverlap: true, gap: 0 },
    })
    expect(typeof savedAt).toBe('number')

    const loaded = await loadToolDraft<{ direction: string; removeOverlap: boolean; gap: number }>('merge')
    expect(loaded).not.toBeNull()
    expect(loaded!.toolId).toBe('merge')
    expect(loaded!.settings).toEqual({ direction: 'vertical', removeOverlap: true, gap: 0 })
    expect(loaded!.images).toHaveLength(1)
    expect(loaded!.images[0]).toMatchObject({
      id: 'user-img-1',
      name: 'screenshot.png',
      width: 1200,
      height: 800,
      rotation: 90,
    })

    const restored = deserializeDraftImages(loaded!.images)
    expect(restored[0].file).toBeUndefined()
    expect(restored[0].isDemo).toBeUndefined()

    await deleteToolDraft('merge')
    expect(await loadToolDraft('merge')).toBeNull()

    await saveToolDraft('split', { images: [USER_IMAGE], settings: { mode: 'grid' } })
    await clearAllToolDrafts()
    expect(await loadToolDraft('split')).toBeNull()
  })

  it('never writes built-in demo images into serialized drafts', async () => {
    const { loadToolDraft, saveToolDraft, serializeDraftImages } = await import('./draftStorage')
    const demoA = createDemoImageInput('photo-1', 'slide-1.svg')
    const demoB = createDemoImageInput('saas', 'demo.svg')

    expect(demoA.isDemo).toBe(true)
    expect(serializeDraftImages([demoA, USER_IMAGE, demoB])).toHaveLength(1)
    expect(serializeDraftImages([demoA, demoB])).toEqual([])

    await saveToolDraft('merge', {
      images: [demoA, USER_IMAGE, demoB],
      settings: { direction: 'horizontal' },
    })
    const loaded = await loadToolDraft('merge')
    expect(loaded!.images).toHaveLength(1)
    expect(loaded!.images[0].id).toBe(USER_IMAGE.id)
  })

  it('settles cleanly without hanging when IndexedDB transactions abort or error', async () => {
    const quotaErr = new DOMException('Quota exceeded', 'QuotaExceededError')
    vi.stubGlobal('indexedDB', createFailingIndexedDb('abort', quotaErr))
    vi.resetModules()

    const modAbort = await import('./draftStorage')
    await expect(
      modAbort.saveToolDraft('merge', { images: [USER_IMAGE], settings: {} }),
    ).resolves.toBeNull()
    await expect(modAbort.loadToolDraft('merge')).resolves.toBeNull()
    await expect(modAbort.deleteToolDraft('merge')).resolves.toBeUndefined()
    await expect(modAbort.clearAllToolDrafts()).resolves.toBeUndefined()

    vi.stubGlobal('indexedDB', createFailingIndexedDb('error', null))
    vi.resetModules()

    const modErr = await import('./draftStorage')
    await expect(
      modErr.saveToolDraft('compress', { images: [USER_IMAGE], settings: {} }),
    ).resolves.toBeNull()
    await expect(modErr.loadToolDraft('compress')).resolves.toBeNull()
  })

  it('silently degrades in SSR or environments without indexedDB', async () => {
    vi.stubGlobal('indexedDB', undefined)
    vi.resetModules()

    const mod = await import('./draftStorage')
    expect(mod.isDraftStorageSupported()).toBe(false)
    await expect(mod.loadToolDraft('merge')).resolves.toBeNull()
    await expect(mod.saveToolDraft('merge', { images: [USER_IMAGE], settings: {} })).resolves.toBeNull()
    await expect(mod.deleteToolDraft('merge')).resolves.toBeUndefined()
    await expect(mod.clearAllToolDrafts()).resolves.toBeUndefined()
  })
})
