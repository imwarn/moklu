/**
 * [INPUT]: depends on zustand
 * [OUTPUT]: exports PreviewCacheEntry type and usePreviewCache transient Zustand store
 * [POS]: ephemeral in-memory slide-group JPEG thumbnail cache in src/store/; keyed by slide group ID and content hash to avoid redundant offscreen renders
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { create } from 'zustand'

export type PreviewCacheEntry = {
  key: string      // content hash (from getGroupPreviewKey)
  dataUrl: string  // JPEG data URL
}

type PreviewCacheStore = {
  // groupId → array of entries per slide
  cache: Record<string, PreviewCacheEntry[]>
  get: (groupId: string, slideIdx: number, key: string) => string | null
  set: (groupId: string, entries: PreviewCacheEntry[]) => void
  invalidate: (groupId: string) => void
  clear: () => void
}

export const usePreviewCache = create<PreviewCacheStore>((set, get) => ({
  cache: {},
  get: (groupId, slideIdx, key) => {
    const entry = get().cache[groupId]?.[slideIdx]
    return entry?.key === key ? entry.dataUrl : null
  },
  set: (groupId, entries) => set((state) => ({
    cache: { ...state.cache, [groupId]: entries }
  })),
  invalidate: (groupId) => set((state) => {
    const next = { ...state.cache }
    delete next[groupId]
    return { cache: next }
  }),
  clear: () => set({ cache: {} }),
}))
