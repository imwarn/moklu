/**
 * [INPUT]: depends on react (useCallback, useEffect, useRef, useState), draftStorage helpers from ./draftStorage, and workspace types from ./types
 * [OUTPUT]: exports WORKSPACE_DRAFT_DEBOUNCE_MS, UseToolDraftOptions, UseToolDraftResult, and useToolDraft hook for debounced IndexedDB auto-save and mount-time draft hydration
 * [POS]: React lifecycle hook in src/workspace connecting Quick Tool panels to IndexedDB draft persistence while guaranteeing demo images are never persisted
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteToolDraft,
  isDraftStorageSupported,
  loadToolDraft,
  saveToolDraft,
  type WorkspaceToolDraft,
} from './draftStorage'
import type { WorkspaceImageInput, WorkspaceToolId } from './types'

export const WORKSPACE_DRAFT_DEBOUNCE_MS = 450

export interface UseToolDraftOptions<TSettings> {
  toolId: WorkspaceToolId
  images: readonly WorkspaceImageInput[]
  settings: TSettings
  /** Allow persisting settings-only edits (without uploaded user images) once markDirty() is called. */
  allowSettingsOnly?: boolean
  debounceMs?: number
  onRestore: (draft: WorkspaceToolDraft<TSettings>) => void
}

export interface UseToolDraftResult {
  hydrated: boolean
  hasDraft: boolean
  savedAt: number | null
  markDirty: () => void
  clearDraft: () => Promise<void>
}

export function useToolDraft<TSettings>({
  toolId,
  images,
  settings,
  allowSettingsOnly = false,
  debounceMs = WORKSPACE_DRAFT_DEBOUNCE_MS,
  onRestore,
}: UseToolDraftOptions<TSettings>): UseToolDraftResult {
  const [hydrated, setHydrated] = useState(() => !isDraftStorageSupported())
  const [hasDraft, setHasDraft] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirtyRef = useRef(false)
  const hadPersistedDraftRef = useRef(false)
  const skipNextSaveRef = useRef(false)
  const onRestoreRef = useRef(onRestore)

  useEffect(() => {
    onRestoreRef.current = onRestore
  }, [onRestore])

  // Hydrate persisted draft once on mount (silently skipped in SSR or environments without IDB).
  useEffect(() => {
    if (!isDraftStorageSupported()) return
    let cancelled = false
    void loadToolDraft<TSettings>(toolId).then((draft) => {
      if (cancelled) return
      if (draft && !dirtyRef.current) {
        skipNextSaveRef.current = true
        hadPersistedDraftRef.current = true
        onRestoreRef.current(draft)
        setHasDraft(true)
        setSavedAt(draft.updatedAt)
      }
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [toolId])

  const markDirty = useCallback(() => {
    dirtyRef.current = true
  }, [])

  const clearDraft = useCallback(async () => {
    dirtyRef.current = false
    hadPersistedDraftRef.current = false
    skipNextSaveRef.current = false
    setHasDraft(false)
    setSavedAt(null)
    await deleteToolDraft(toolId)
  }, [toolId])

  // Debounced auto-save: strictly excludes demo images and never writes on first-visit defaults.
  useEffect(() => {
    if (!hydrated || !isDraftStorageSupported()) return

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }

    const realImages = images.filter((img) => !img.isDemo)
    if (realImages.length > 0) {
      dirtyRef.current = true
    }

    if (!dirtyRef.current) return

    let cancelled = false

    // If all real images were removed and settings-only drafts are disabled, clean up any stale draft.
    if (realImages.length === 0 && !allowSettingsOnly) {
      if (hadPersistedDraftRef.current) {
        hadPersistedDraftRef.current = false
        dirtyRef.current = false
        void deleteToolDraft(toolId).then(() => {
          if (cancelled) return
          setHasDraft(false)
          setSavedAt(null)
        })
      }
      return () => {
        cancelled = true
      }
    }

    const timer = window.setTimeout(() => {
      void saveToolDraft(toolId, { images: realImages, settings }).then((timestamp) => {
        if (cancelled || timestamp === null) return
        hadPersistedDraftRef.current = true
        setHasDraft(true)
        setSavedAt(timestamp)
      })
    }, debounceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [hydrated, toolId, images, settings, allowSettingsOnly, debounceMs])

  return {
    hydrated,
    hasDraft,
    savedAt,
    markDirty,
    clearDraft,
  }
}
