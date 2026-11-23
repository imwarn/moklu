/**
 * [INPUT]: depends on BRAND from @/theme/brand for dark Studio surface and Signal Orange accent values
 * [OUTPUT]: exports STUDIO_COLORS and static Tailwind class tokens (STUDIO_TEXT_MUTED_CLS, STUDIO_TEXT_SUBTLE_CLS, STUDIO_LABEL_CLS, STUDIO_SECTION_LABEL_CLS, STUDIO_SUBTLE_SECTION_LABEL_CLS) meeting WCAG AA contrast on Studio dark surfaces
 * [POS]: shared dark-theme text contrast source of truth inside src/components/ui, safe for both Studio and landing bundles
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { BRAND } from '@/theme/brand'

// ─── Studio dark surface color tokens (WCAG AA on BRAND.panel #141417) ────────

export const STUDIO_COLORS = {
  /** Primary foreground text (16.73:1 on #141417). */
  textPrimary: BRAND.ink,
  /** Muted labels, inactive controls, and metadata (7.17:1 on #141417). */
  textMuted: BRAND.muted,
  /** Secondary hints, captions, and subdued states (7.17:1 on #141417). */
  textSubtle: BRAND.muted,
  /** Active Signal Orange accent label text (6.75:1 on #141417). */
  textAccent: BRAND.accentText,
  /** Destructive action text (5.67:1 on #141417). */
  textDanger: BRAND.danger,
  /** Primary dark Studio panel surface. */
  surfacePanel: BRAND.panel,
  /** Subtle dark panel divider border. */
  borderSubtle: BRAND.border,
} as const

// ─── Static Tailwind utility classes (literal strings for Tailwind scanner) ──

export const STUDIO_TEXT_MUTED_CLS = 'text-muted'
export const STUDIO_TEXT_SUBTLE_CLS = 'text-muted'
export const STUDIO_LABEL_CLS = 'text-[11px] text-muted mb-1 block uppercase tracking-[0.08em]'
export const STUDIO_SECTION_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'
export const STUDIO_SUBTLE_SECTION_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'
