/**
 * [INPUT]: depends on browser window, sessionStorage, and fetch globals (all injectable for unit testing)
 * [OUTPUT]: exports CHUNK_RELOAD_STORAGE_KEY, CHUNK_RELOAD_COOLDOWN_MS, isChunkLoadError, canAttemptChunkReload, recordChunkReloadAttempt, clearChunkReloadGuard, triggerFreshReload, handleVitePreloadError, and installChunkRecoveryListener
 * [POS]: deploy-rollover dynamic-import recovery utility in src/utils; installed by src/main.tsx and invoked by ChunkErrorBoundary
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export const CHUNK_RELOAD_STORAGE_KEY = 'moklu:chunk-reload'
export const CHUNK_RELOAD_COOLDOWN_MS = 15_000

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface ReloadRecord {
  pathname: string
  timestamp: number
}

export interface ChunkRecoveryRuntime {
  pathname?: string
  href?: string
  now?: number
  cooldownMs?: number
  storage?: StorageLike | null
  fetchFn?: (input: string, init?: RequestInit) => Promise<unknown>
  reloadFn?: () => void
}

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /loading (?:css )?chunk/i,
  /chunkloaderror/i,
  /unable to preload css/i,
]

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : ''
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function readReloadRecord(storage: StorageLike | null): ReloadRecord | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(CHUNK_RELOAD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ReloadRecord>
    if (
      typeof parsed.pathname === 'string' &&
      typeof parsed.timestamp === 'number' &&
      Number.isFinite(parsed.timestamp)
    ) {
      return { pathname: parsed.pathname, timestamp: parsed.timestamp }
    }
    return null
  } catch {
    return null
  }
}

export function canAttemptChunkReload(
  pathname: string,
  now: number = Date.now(),
  storage: StorageLike | null = getDefaultStorage(),
  cooldownMs: number = CHUNK_RELOAD_COOLDOWN_MS,
): boolean {
  const record = readReloadRecord(storage)
  if (!record) return true
  if (record.pathname !== pathname) return true
  return now - record.timestamp >= cooldownMs
}

export function recordChunkReloadAttempt(
  pathname: string,
  now: number = Date.now(),
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return
  try {
    const payload: ReloadRecord = { pathname, timestamp: now }
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore restricted/private-browsing storage errors.
  }
}

export function clearChunkReloadGuard(
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return
  try {
    storage.removeItem(CHUNK_RELOAD_STORAGE_KEY)
  } catch {
    // Ignore storage removal restrictions.
  }
}

export function triggerFreshReload(runtime: ChunkRecoveryRuntime = {}): Promise<void> {
  const href =
    runtime.href ?? (typeof window !== 'undefined' ? window.location.href : '')
  const fetchFn =
    runtime.fetchFn ?? (typeof fetch === 'function' ? (input, init) => fetch(input, init) : null)
  const reloadFn =
    runtime.reloadFn ??
    (typeof window !== 'undefined' ? () => window.location.reload() : () => {})

  if (!href || !fetchFn) {
    reloadFn()
    return Promise.resolve()
  }

  return Promise.resolve()
    .then(() => fetchFn(href, { cache: 'reload' }))
    .then(() => undefined, () => undefined)
    .finally(() => {
      reloadFn()
    })
}

export function handleVitePreloadError(
  event: { preventDefault: () => void },
  runtime: ChunkRecoveryRuntime = {},
): boolean {
  const pathname =
    runtime.pathname ?? (typeof window !== 'undefined' ? window.location.pathname || '/' : '/')
  const now = runtime.now ?? Date.now()
  const storage = runtime.storage === undefined ? getDefaultStorage() : runtime.storage
  const cooldownMs = runtime.cooldownMs ?? CHUNK_RELOAD_COOLDOWN_MS

  if (!canAttemptChunkReload(pathname, now, storage, cooldownMs)) {
    return false
  }

  recordChunkReloadAttempt(pathname, now, storage)
  event.preventDefault()
  void triggerFreshReload(runtime)
  return true
}

export function installChunkRecoveryListener(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined =
    typeof window !== 'undefined' ? window : undefined,
  runtime: ChunkRecoveryRuntime = {},
): () => void {
  if (!target) return () => {}
  const listener = (event: Event) => {
    handleVitePreloadError(event, runtime)
  }
  target.addEventListener('vite:preloadError', listener)
  return () => target.removeEventListener('vite:preloadError', listener)
}
