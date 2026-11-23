/**
 * [INPUT]: depends on getPixelDeckConfig from @/config, localStorageAdapter from ./localStorageAdapter, and ProjectStorageAdapter from ./types
 * [OUTPUT]: exports getProjectStorage resolver and re-exports all types/classes from ./types
 * [POS]: storage backend facade in src/store/storage/; resolves host-injected ProjectStorageAdapter or falls back to browser localStorageAdapter
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { getPixelDeckConfig } from '@/config'
import { localStorageAdapter } from './localStorageAdapter'
import type { ProjectStorageAdapter } from './types'

export function getProjectStorage(): ProjectStorageAdapter {
  return getPixelDeckConfig().projectStorage ?? localStorageAdapter
}

export * from './types'
