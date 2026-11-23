/**
 * [INPUT]: none (pure zero-dependency Studio UI color & typography token definitions)
 * [OUTPUT]: exports STUDIO_COLORS and static Tailwind class tokens (STUDIO_TEXT_MUTED_CLS, STUDIO_TEXT_SUBTLE_CLS, STUDIO_LABEL_CLS, STUDIO_SECTION_LABEL_CLS, STUDIO_SUBTLE_SECTION_LABEL_CLS) meeting WCAG AA contrast on Studio dark surfaces
 * [POS]: shared dark-theme text contrast source of truth inside src/components/ui, safe for both Studio and landing bundles
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

// ─── Studio dark surface color tokens (WCAG AA on #18181f) ───────────────────

export const STUDIO_COLORS = {
  /** Primary foreground text (~14.6:1 on #18181f). */
  textPrimary: '#e8e8f0',
  /** Muted labels, inactive controls, and metadata (~5.9:1 on #18181f). */
  textMuted: '#9494a8',
  /** Secondary hints, captions, and subdued states (~4.9:1 on #18181f). */
  textSubtle: '#858599',
  /** Active accent label text (~6.4:1 on #18181f). */
  textAccent: '#9b8fff',
  /** Destructive action text (~6.7:1 on #18181f). */
  textDanger: '#f87171',
  /** Primary dark Studio panel surface. */
  surfacePanel: '#18181f',
  /** Subtle dark panel divider border. */
  borderSubtle: 'rgba(255,255,255,0.08)',
} as const

// ─── Static Tailwind utility classes (literal strings for Tailwind scanner) ──

export const STUDIO_TEXT_MUTED_CLS = 'text-[#9494a8]'
export const STUDIO_TEXT_SUBTLE_CLS = 'text-[#858599]'
export const STUDIO_LABEL_CLS = 'text-[11px] text-[#9494a8] mb-1 block uppercase tracking-[0.08em]'
export const STUDIO_SECTION_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9494a8]'
export const STUDIO_SUBTLE_SECTION_LABEL_CLS = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858599]'
