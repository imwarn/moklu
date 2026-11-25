/**
 * [INPUT]: none (pure browser localStorage helpers and Neutral Zinc / Store Light surround tokens)
 * [OUTPUT]: exports CanvasBackdropTone, STUDIO_BACKDROP_STORAGE_KEY, CANVAS_BACKDROP_PRESETS, loadStoredCanvasBackdrop, and persistCanvasBackdrop
 * [POS]: pure non-destructive canvas surround preset registry inside src/components/canvas/stage consumed by StageCanvas and StageOverlays
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type CanvasBackdropTone = 'dark' | 'gray' | 'light'

export const STUDIO_BACKDROP_STORAGE_KEY = 'moklu:studio-backdrop'

export const CANVAS_BACKDROP_PRESETS: Record<
  CanvasBackdropTone,
  {
    bg: string
    swatch: string
    gridStroke: string
    groupOutline: string
    cardShadow: string
    seamLine: string
    slideLabelColor: string
  }
> = {
  dark: {
    bg: 'var(--color-surface)',
    swatch: '#09090b',
    gridStroke: 'rgba(255,255,255,0.06)',
    groupOutline: 'rgba(255,255,255,0.65)',
    cardShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
    seamLine: 'rgba(255,255,255,0.16)',
    slideLabelColor: 'var(--color-accent-text)',
  },
  gray: {
    bg: '#52525b',
    swatch: '#71717a',
    gridStroke: 'rgba(255,255,255,0.12)',
    groupOutline: 'rgba(255,255,255,0.8)',
    cardShadow: '0 24px 56px rgba(9,9,11,0.38), 0 0 0 1px rgba(255,255,255,0.14)',
    seamLine: 'rgba(255,255,255,0.28)',
    slideLabelColor: '#fafafa',
  },
  light: {
    bg: '#f4f4f5',
    swatch: '#f4f4f5',
    gridStroke: 'rgba(24,24,27,0.08)',
    groupOutline: 'rgba(24,24,27,0.65)',
    cardShadow: '0 20px 52px rgba(24,24,27,0.16), 0 0 0 1px rgba(24,24,27,0.09)',
    seamLine: 'rgba(24,24,27,0.2)',
    slideLabelColor: '#af3b14',
  },
}

export function loadStoredCanvasBackdrop(): CanvasBackdropTone {
  if (typeof window === 'undefined') return 'dark'
  try {
    const raw = window.localStorage.getItem(STUDIO_BACKDROP_STORAGE_KEY)
    if (raw === 'dark' || raw === 'gray' || raw === 'light') return raw
  } catch {
    // Ignore storage read restrictions.
  }
  return 'dark'
}

export function persistCanvasBackdrop(tone: CanvasBackdropTone): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STUDIO_BACKDROP_STORAGE_KEY, tone)
  } catch {
    // Ignore storage write restrictions.
  }
}
