/**
 * [INPUT]: depends on browser global indexedDB (gracefully degrades when unavailable) and workspace types from ./types
 * [OUTPUT]: exports DRAFT_DB_NAME, DRAFT_STORE_NAME, DRAFT_SCHEMA_VERSION, SerializedDraftImage, WorkspaceToolDraft, isDraftStorageSupported, serializeDraftImages, deserializeDraftImages, loadToolDraft, saveToolDraft, deleteToolDraft, clearAllToolDrafts, and resetDraftDbCache
 * [POS]: zero-dependency IndexedDB persistence layer for Quick Workspace local drafts inside src/workspace; strips File handles and demo assets while settling all transaction abort/error paths without hanging
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  WorkspaceImageInput,
  WorkspaceMergeRotation,
  WorkspaceToolId,
} from './types'

export const DRAFT_DB_NAME = 'moklu-workspace-drafts'
export const DRAFT_STORE_NAME = 'drafts'
export const DRAFT_SCHEMA_VERSION = 1

export interface SerializedDraftImage {
  id: string
  name: string
  width: number
  height: number
  dataUrl: string
  sizeBytes: number
  mimeType?: string
  rotation?: WorkspaceMergeRotation
}

export interface WorkspaceToolDraft<TSettings = Record<string, unknown>> {
  version: typeof DRAFT_SCHEMA_VERSION
  toolId: WorkspaceToolId
  updatedAt: number
  images: SerializedDraftImage[]
  settings: TSettings
}

let cachedDbPromise: Promise<IDBDatabase> | null = null

export function isDraftStorageSupported(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof indexedDB.open === 'function'
  } catch {
    return false
  }
}

export function resetDraftDbCache(): void {
  cachedDbPromise = null
}

function transactionError(tx: IDBTransaction, fallback: string): Error {
  return tx.error ?? new Error(fallback)
}

function openDraftDb(): Promise<IDBDatabase> {
  if (!isDraftStorageSupported()) {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }
  if (cachedDbPromise) return cachedDbPromise

  cachedDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false
    const fail = (err: unknown) => {
      if (settled) return
      settled = true
      cachedDbPromise = null
      reject(err instanceof Error ? err : new Error(String(err)))
    }
    try {
      const req = indexedDB.open(DRAFT_DB_NAME, DRAFT_SCHEMA_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
          db.createObjectStore(DRAFT_STORE_NAME)
        }
      }
      req.onsuccess = () => {
        if (settled) return
        settled = true
        const db = req.result
        db.onversionchange = () => {
          cachedDbPromise = null
          try {
            db.close()
          } catch {
            // ignore close errors during version change
          }
        }
        db.onclose = () => {
          cachedDbPromise = null
        }
        resolve(db)
      }
      req.onerror = () => fail(req.error ?? new Error('Failed to open workspace drafts DB'))
      req.onblocked = () => fail(new Error('Workspace drafts DB open blocked'))
    } catch (err) {
      fail(err)
    }
  })

  return cachedDbPromise
}

function isValidRotation(value: unknown): value is WorkspaceMergeRotation {
  return value === 0 || value === 90 || value === 180 || value === 270
}

function isValidSerializedImage(value: unknown): value is SerializedDraftImage {
  if (!value || typeof value !== 'object') return false
  const img = value as Record<string, unknown>
  return (
    typeof img.id === 'string' &&
    img.id.length > 0 &&
    typeof img.name === 'string' &&
    typeof img.dataUrl === 'string' &&
    img.dataUrl.length > 0 &&
    typeof img.width === 'number' &&
    Number.isFinite(img.width) &&
    img.width > 0 &&
    typeof img.height === 'number' &&
    Number.isFinite(img.height) &&
    img.height > 0 &&
    typeof img.sizeBytes === 'number' &&
    Number.isFinite(img.sizeBytes) &&
    img.sizeBytes >= 0
  )
}

/**
 * Converts WorkspaceImageInput items into IndexedDB-safe records, strictly excluding
 * built-in demo images (`isDemo === true`) and stripping non-persistent File handles.
 */
export function serializeDraftImages(images: readonly WorkspaceImageInput[]): SerializedDraftImage[] {
  const result: SerializedDraftImage[] = []
  for (const img of images) {
    if (img.isDemo) continue
    if (!img.dataUrl || !Number.isFinite(img.width) || !Number.isFinite(img.height)) continue
    result.push({
      id: img.id,
      name: img.name,
      width: img.width,
      height: img.height,
      dataUrl: img.dataUrl,
      sizeBytes: Math.max(0, img.sizeBytes),
      ...(img.mimeType ? { mimeType: img.mimeType } : {}),
      ...(isValidRotation(img.rotation) ? { rotation: img.rotation } : {}),
    })
  }
  return result
}

export function deserializeDraftImages(images: readonly SerializedDraftImage[]): WorkspaceImageInput[] {
  const result: WorkspaceImageInput[] = []
  for (const img of images) {
    if (!isValidSerializedImage(img)) continue
    result.push({
      id: img.id,
      name: img.name,
      width: img.width,
      height: img.height,
      dataUrl: img.dataUrl,
      sizeBytes: img.sizeBytes,
      ...(img.mimeType ? { mimeType: img.mimeType } : {}),
      ...(isValidRotation(img.rotation) ? { rotation: img.rotation } : {}),
    })
  }
  return result
}

export async function loadToolDraft<TSettings = Record<string, unknown>>(
  toolId: WorkspaceToolId,
): Promise<WorkspaceToolDraft<TSettings> | null> {
  if (!isDraftStorageSupported()) return null
  try {
    const db = await openDraftDb()
    const raw = await new Promise<unknown>((resolve, reject) => {
      let settled = false
      const done = (val: unknown) => {
        if (settled) return
        settled = true
        resolve(val)
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        reject(err)
      }
      const tx = db.transaction(DRAFT_STORE_NAME, 'readonly')
      const req = tx.objectStore(DRAFT_STORE_NAME).get(toolId)
      req.onsuccess = () => done(req.result)
      req.onerror = () => fail(req.error ?? new Error('IndexedDB draft load failed'))
      tx.onerror = () => fail(transactionError(tx, 'IndexedDB draft load transaction failed'))
      tx.onabort = () => fail(transactionError(tx, 'IndexedDB draft load transaction aborted'))
    })

    if (!raw || typeof raw !== 'object') return null
    const record = raw as Record<string, unknown>
    if (
      record.version !== DRAFT_SCHEMA_VERSION ||
      record.toolId !== toolId ||
      !Array.isArray(record.images) ||
      !record.settings ||
      typeof record.settings !== 'object'
    ) {
      return null
    }
    const validImages = record.images.filter(isValidSerializedImage)
    const updatedAt = typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now()
    return {
      version: DRAFT_SCHEMA_VERSION,
      toolId,
      updatedAt,
      images: validImages,
      settings: record.settings as TSettings,
    }
  } catch {
    return null
  }
}

export async function saveToolDraft<TSettings = Record<string, unknown>>(
  toolId: WorkspaceToolId,
  payload: {
    images: readonly WorkspaceImageInput[]
    settings: TSettings
  },
): Promise<number | null> {
  if (!isDraftStorageSupported()) return null
  try {
    const db = await openDraftDb()
    const updatedAt = Date.now()
    const record: WorkspaceToolDraft<TSettings> = {
      version: DRAFT_SCHEMA_VERSION,
      toolId,
      updatedAt,
      images: serializeDraftImages(payload.images),
      settings: payload.settings,
    }
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        reject(err)
      }
      const tx = db.transaction(DRAFT_STORE_NAME, 'readwrite')
      tx.objectStore(DRAFT_STORE_NAME).put(record, toolId)
      tx.oncomplete = () => done()
      tx.onerror = () => fail(transactionError(tx, 'IndexedDB draft save transaction failed'))
      tx.onabort = () => fail(transactionError(tx, 'IndexedDB draft save transaction aborted'))
    })
    return updatedAt
  } catch {
    return null
  }
}

export async function deleteToolDraft(toolId: WorkspaceToolId): Promise<void> {
  if (!isDraftStorageSupported()) return
  try {
    const db = await openDraftDb()
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        reject(err)
      }
      const tx = db.transaction(DRAFT_STORE_NAME, 'readwrite')
      tx.objectStore(DRAFT_STORE_NAME).delete(toolId)
      tx.oncomplete = () => done()
      tx.onerror = () => fail(transactionError(tx, 'IndexedDB draft delete transaction failed'))
      tx.onabort = () => fail(transactionError(tx, 'IndexedDB draft delete transaction aborted'))
    })
  } catch {
    // silent fallback when IndexedDB is unavailable or aborted
  }
}

export async function clearAllToolDrafts(): Promise<void> {
  if (!isDraftStorageSupported()) return
  try {
    const db = await openDraftDb()
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        reject(err)
      }
      const tx = db.transaction(DRAFT_STORE_NAME, 'readwrite')
      tx.objectStore(DRAFT_STORE_NAME).clear()
      tx.oncomplete = () => done()
      tx.onerror = () => fail(transactionError(tx, 'IndexedDB draft clear transaction failed'))
      tx.onabort = () => fail(transactionError(tx, 'IndexedDB draft clear transaction aborted'))
    })
  } catch {
    // silent fallback when IndexedDB is unavailable or aborted
  }
}
