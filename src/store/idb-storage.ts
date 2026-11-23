/**
 * [INPUT]: depends on browser global indexedDB (or fake-indexeddb in tests)
 * [OUTPUT]: exports idbStorage async key-value adapter (getItem, setItem, removeItem) compatible with Zustand persist
 * [POS]: low-level IndexedDB persistence adapter in src/store/; falls back safely on errors or transaction aborts without hanging callers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

const DB_NAME = 'pixeldeck'
const STORE_NAME = 'kv'

// Singleton DB promise — opened once, reused for every read/write.
let _db: Promise<IDBDatabase> | null = null
let storageWarningShown = false

function transactionError(tx: IDBTransaction, fallbackMessage: string): Error {
  return tx.error ?? new Error(fallbackMessage)
}

function getDB(): Promise<IDBDatabase> {
  if (_db) return _db
  _db = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      _db = null   // allow retry on next call
      reject(req.error)
    }
  })
  return _db
}

export const idbStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const db = await getDB()
      return await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
        req.onerror = () => reject(req.error ?? new Error('IndexedDB getItem request failed'))
        tx.onerror = () => reject(transactionError(tx, 'IndexedDB getItem transaction failed'))
        tx.onabort = () => reject(transactionError(tx, 'IndexedDB getItem transaction aborted'))
      })
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await getDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(value, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(transactionError(tx, 'IndexedDB setItem transaction failed'))
        tx.onabort = () => reject(transactionError(tx, 'IndexedDB setItem transaction aborted'))
      })
    } catch (e) {
      console.warn('[idbStorage] setItem failed:', e)
      if (!storageWarningShown && typeof window !== 'undefined') {
        storageWarningShown = true
        window.setTimeout(() => {
          alert('Image autosave failed. Screenshots are embedded as fallback, but export your project to avoid losing assets.')
        }, 0)
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const db = await getDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(transactionError(tx, 'IndexedDB removeItem transaction failed'))
        tx.onabort = () => reject(transactionError(tx, 'IndexedDB removeItem transaction aborted'))
      })
    } catch {
      // best-effort
    }
  },
}
