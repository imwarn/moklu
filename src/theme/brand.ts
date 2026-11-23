/**
 * [INPUT]: none (standalone hex token registry synchronized with CSS custom properties in src/index.css)
 * [OUTPUT]: exports BrandPalette, BrandThemeMode, BRAND_LIGHT, BRAND_DARK, BRAND, and getBrandPalette
 * [POS]: single JavaScript/Canvas color source of truth in src/theme; consumed by Konva Stage/Transformer overlays and inline JS styles where CSS custom properties cannot be read
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type BrandThemeMode = 'light' | 'dark'

export interface BrandPalette {
  /** Page canvas background */
  readonly surface: string
  /** Elevated card, sidebar, or toolbar surface */
  readonly panel: string
  /** 1px structural divider and hairline border */
  readonly border: string
  /** Primary body ink */
  readonly ink: string
  /** Secondary body and metadata text (WCAG AA >= 4.5:1 on surface & panel) */
  readonly muted: string
  /** Signal Orange brand mark, large display accents, icons, and dark focus/selection strokes */
  readonly accent: string
  /** High-contrast Signal Orange fill paired with accentFg white text (>= 4.5:1) */
  readonly accentStrong: string
  /** Subtle Signal Orange surface wash for active chips and dropzone highlights */
  readonly accentSoft: string
  /** Signal Orange text on surface, panel, and accentSoft (>= 4.5:1) */
  readonly accentText: string
  /** Foreground text placed on accentStrong fills */
  readonly accentFg: string
  /** Semantic positive / ready status */
  readonly success: string
  /** Semantic caution / Pro status (distinct hue from Signal Orange) */
  readonly warning: string
  /** Semantic destructive / error status (distinct hue from Signal Orange) */
  readonly danger: string
}

/**
 * Light-mode Neutral Zinc + Signal Orange palette.
 * Synchronized 1:1 with `:root` (`@theme static`) in `src/index.css`.
 */
export const BRAND_LIGHT: BrandPalette = {
  surface: '#FAFAFA',
  panel: '#FFFFFF',
  border: '#E4E4E7',
  ink: '#18181B',
  muted: '#52525B',
  accent: '#E5541F',
  accentStrong: '#C24217',
  accentSoft: '#FCF2ED',
  accentText: '#AF3B14',
  accentFg: '#FFFFFF',
  success: '#15803D',
  warning: '#9A6312',
  danger: '#B91C3C',
} as const

/**
 * Dark-mode / Studio Neutral Zinc + Signal Orange palette.
 * Synchronized 1:1 with `html[data-theme="dark"], html[data-surface="studio"]` in `src/index.css`.
 */
export const BRAND_DARK: BrandPalette = {
  surface: '#09090B',
  panel: '#141417',
  border: '#27272A',
  ink: '#F4F4F5',
  muted: '#A1A1AA',
  accent: '#E76536',
  accentStrong: '#C64519',
  accentSoft: '#2C1811',
  accentText: '#EB7F59',
  accentFg: '#FFFFFF',
  success: '#34D399',
  warning: '#E8B339',
  danger: '#EB6079',
} as const

/**
 * Canonical brand & Studio canvas token registry (hex + Konva-ready alpha helpers).
 * Top-level color properties mirror the always-dark Studio surface (`BRAND_DARK`);
 * use `BRAND.light`, `BRAND.dark`, or `getBrandPalette(mode)` for theme-aware consumers.
 */
export const BRAND = {
  ...BRAND_DARK,
  /** Canonical Signal Orange mark hex (passes >=3.7:1 on light and >=4.9:1 on dark) */
  mark: BRAND_LIGHT.accent,
  /** Konva Transformer / selection box stroke */
  selectionStroke: 'rgba(231, 101, 54, 0.92)',
  /** Konva marquee / drop highlight fill */
  selectionFill: 'rgba(231, 101, 54, 0.14)',
  /** Konva smart-snap alignment guide stroke */
  snapGuide: '#E76536',
  /** Anchor handle stroke on Konva Transformers */
  anchorStroke: '#FFFFFF',
  /** Complete theme palettes */
  light: BRAND_LIGHT,
  dark: BRAND_DARK,
  studio: BRAND_DARK,
} as const

export function getBrandPalette(mode: BrandThemeMode): BrandPalette {
  return mode === 'dark' ? BRAND_DARK : BRAND_LIGHT
}
