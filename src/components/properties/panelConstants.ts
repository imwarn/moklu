/**
 * [INPUT]: depends on useEditorStore from @/store; depends on studioTokens from @/components/ui/studioTokens
 * [OUTPUT]: exports pauseTemporal, resumeTemporal, shared panel CSS class constants, re-exported Studio contrast tokens, and PanelTab type
 * [POS]: shared styling and temporal helper module for src/components/properties and Studio panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEditorStore } from '@/store'
import {
  STUDIO_COLORS,
  STUDIO_LABEL_CLS,
  STUDIO_SECTION_LABEL_CLS,
  STUDIO_SUBTLE_SECTION_LABEL_CLS,
  STUDIO_TEXT_MUTED_CLS,
  STUDIO_TEXT_SUBTLE_CLS,
} from '@/components/ui/studioTokens'

export {
  STUDIO_COLORS,
  STUDIO_SECTION_LABEL_CLS,
  STUDIO_SUBTLE_SECTION_LABEL_CLS,
  STUDIO_TEXT_MUTED_CLS,
  STUDIO_TEXT_SUBTLE_CLS,
}

// ─── Temporal pause/resume helpers ───────────────────────────────────────────
export const pauseTemporal = () => useEditorStore.temporal.getState().pause()
export const resumeTemporal = () => useEditorStore.temporal.getState().resume()

// ─── Panel CSS class constants ─────────────────────────────────────────────
export const inputCls =
  'bg-[#0f0f13] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-sm text-[#e8e8f0] w-full focus:outline-none focus:border-[rgba(124,110,246,0.5)]'
export const labelCls = STUDIO_LABEL_CLS
export const rowCls = 'flex gap-2 mb-3'
export const fieldCls = 'flex-1 min-w-0'
export const panelSectionCls = 'mb-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3'
export const subtleButtonCls =
  'text-xs text-[#e8e8f0] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.06)] transition-colors'

// ─── Panel tab type ───────────────────────────────────────────────────────
export type PanelTab = 'layout' | 'style' | 'content'
