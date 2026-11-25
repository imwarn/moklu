/**
 * [INPUT]: depends on useSyncExternalStore from react
 * [OUTPUT]: exports CanvasBackdropTone, STUDIO_BACKDROP_STORAGE_KEY, CANVAS_BACKDROP_PRESETS, loadStoredCanvasBackdrop, persistCanvasBackdrop, subscribeCanvasBackdrop, and useCanvasBackdrop
 * [POS]: pure non-destructive canvas and preview-filmstrip surround preset registry + cross-component reactive store inside src/components/canvas/stage consumed by StageCanvas, StageOverlays, and PreviewModal
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useSyncExternalStore } from 'react'

export type CanvasBackdropTone = 'dark' | 'gray' | 'light'

export const STUDIO_BACKDROP_STORAGE_KEY = 'moklu:studio-backdrop'

export interface CanvasBackdropPreset {
  bg: string
  swatch: string
  gridStroke: string
  groupOutline: string
  cardShadow: string
  seamLine: string
  slideLabelColor: string
  previewDivider: string
  previewInactiveLabel: string
  previewActiveBadgeBg: string
  previewActiveBadgeBorder: string
  previewCardBorder: string
  previewActiveBorder: string
  previewCardShadow: string
  previewActiveShadow: string
}

export const CANVAS_BACKDROP_PRESETS: Record<CanvasBackdropTone, CanvasBackdropPreset> = {
  dark: {
    bg: 'var(--color-surface)',
    swatch: '#09090b',
    gridStroke: 'rgba(255,255,255,0.06)',
    groupOutline: 'rgba(255,255,255,0.65)',
    cardShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
    seamLine: 'rgba(255,255,255,0.16)',
    slideLabelColor: 'var(--color-accent-text)',
    previewDivider: 'rgba(255,255,255,0.09)',
    previewInactiveLabel: 'var(--color-muted)',
    previewActiveBadgeBg: 'transparent',
    previewActiveBadgeBorder: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
    previewCardBorder: 'rgba(255,255,255,0.1)',
    previewActiveBorder: 'color-mix(in srgb, var(--color-accent) 65%, transparent)',
    previewCardShadow: '0 8px 32px rgba(0,0,0,0.4)',
    previewActiveShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent), 0 12px 48px rgba(0,0,0,0.55)',
  },
  gray: {
    bg: '#52525b',
    swatch: '#71717a',
    gridStroke: 'rgba(255,255,255,0.12)',
    groupOutline: 'rgba(255,255,255,0.8)',
    cardShadow: '0 24px 56px rgba(9,9,11,0.38), 0 0 0 1px rgba(255,255,255,0.14)',
    seamLine: 'rgba(255,255,255,0.28)',
    slideLabelColor: '#fafafa',
    previewDivider: 'rgba(255,255,255,0.22)',
    previewInactiveLabel: '#f4f4f5',
    previewActiveBadgeBg: 'rgba(229,83,34,0.32)',
    previewActiveBadgeBorder: 'rgba(255,255,255,0.45)',
    previewCardBorder: 'rgba(255,255,255,0.22)',
    previewActiveBorder: 'var(--color-accent)',
    previewCardShadow: '0 8px 28px rgba(9,9,11,0.28)',
    previewActiveShadow: '0 0 0 1px rgba(255,255,255,0.35), 0 12px 40px rgba(9,9,11,0.38)',
  },
  light: {
    bg: '#f4f4f5',
    swatch: '#f4f4f5',
    gridStroke: 'rgba(24,24,27,0.08)',
    groupOutline: 'rgba(24,24,27,0.65)',
    cardShadow: '0 20px 52px rgba(24,24,27,0.16), 0 0 0 1px rgba(24,24,27,0.09)',
    seamLine: 'rgba(24,24,27,0.2)',
    slideLabelColor: '#af3b14',
    previewDivider: 'rgba(24,24,27,0.14)',
    previewInactiveLabel: '#52525b',
    previewActiveBadgeBg: 'rgba(229,83,34,0.10)',
    previewActiveBadgeBorder: 'rgba(175,59,20,0.35)',
    previewCardBorder: 'rgba(24,24,27,0.10)',
    previewActiveBorder: '#d94e1f',
    previewCardShadow: '0 10px 28px rgba(24,24,27,0.11)',
    previewActiveShadow: '0 0 0 1px rgba(217,78,31,0.25), 0 14px 36px rgba(24,24,27,0.16)',
  },
}

const listeners = new Set<() => void>()
let memoryFallbackTone: CanvasBackdropTone = 'dark'

function isValidTone(value: string | null): value is CanvasBackdropTone {
  return value === 'dark' || value === 'gray' || value === 'light'
}

export function loadStoredCanvasBackdrop(): CanvasBackdropTone {
  if (typeof window === 'undefined') return 'dark'
  try {
    const raw = window.localStorage.getItem(STUDIO_BACKDROP_STORAGE_KEY)
    if (isValidTone(raw)) {
      memoryFallbackTone = raw
      return raw
    }
  } catch {
    return memoryFallbackTone
  }
  return 'dark'
}

export function persistCanvasBackdrop(tone: CanvasBackdropTone): void {
  if (typeof window === 'undefined') return
  memoryFallbackTone = tone
  try {
    window.localStorage.setItem(STUDIO_BACKDROP_STORAGE_KEY, tone)
  } catch {
    // Keep in-memory fallback when storage writes are restricted.
  }
  for (const listener of listeners) listener()
}

export function subscribeCanvasBackdrop(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STUDIO_BACKDROP_STORAGE_KEY) listener()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

const getServerSnapshot = (): CanvasBackdropTone => 'dark'

export function useCanvasBackdrop(): readonly [CanvasBackdropTone, (next: CanvasBackdropTone) => void] {
  const tone = useSyncExternalStore(subscribeCanvasBackdrop, loadStoredCanvasBackdrop, getServerSnapshot)
  return [tone, persistCanvasBackdrop] as const
}
