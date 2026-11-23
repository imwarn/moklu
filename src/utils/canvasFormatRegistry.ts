/**
 * [INPUT]: depends on BuiltInFormatId, CanvasFormatId, CustomCanvasFormat, CustomFormatId, LayoutDelta, PhoneLayer, Project, and SlideGroup from @/types
 * [OUTPUT]: exports canvas format preset tables, family/platform/delta constants, FormatFamilyKey type, and pure metadata lookup helpers (getFamilyDefaultPhoneModel, isCustomFormatId, getCanvasFormat, getFormatPlatform, getFormatLabel, getProjectBaseFormat, getFormatFamilyKey, getFormatCanvasDims)
 * [POS]: foundational format registry and metadata layer in src/utils; consumed by canvasFormatSelectors, canvasFormatProjection, canvasFormatLayout, and re-exported by canvasFormats.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  BuiltInFormatId,
  CanvasFormatId,
  CustomCanvasFormat,
  CustomFormatId,
  LayoutDelta,
  PhoneLayer,
  Project,
  SlideGroup,
} from '@/types'

export const CANVAS_FORMAT_PRESETS = [
  { id: 'iphone-69', label: 'iPhone 6.9"', width: 1320, height: 2868 },
  { id: 'android-phone', label: 'Android Phone', width: 1080, height: 1920 },
  { id: 'ipad-13', label: 'iPad 13"', width: 2064, height: 2752 },
  { id: 'android-tablet', label: 'Android Tablet 10"', width: 1600, height: 2560 },
  { id: 'ipad-11', label: 'iPad 11"', width: 1668, height: 2420 },
  { id: 'apple-watch', label: 'Apple Watch', width: 422, height: 514 },
  { id: 'wear-os', label: 'Wear OS', width: 480, height: 480 },
  { id: 'mac', label: 'Mac', width: 2880, height: 1800 },
  { id: 'appletv', label: 'Apple TV', width: 3840, height: 2160 },
  { id: 'visionpro', label: 'Vision Pro', width: 3840, height: 2160 },
  { id: 'steam', label: 'Steam', width: 1920, height: 1080 },
  { id: 'meta-quest', label: 'Meta Quest', width: 2560, height: 1440 },
] as const satisfies readonly { id: CanvasFormatId; label: string; width: number; height: number }[]

export const BASE_CANVAS_FORMAT: CanvasFormatId = 'base'

export const DEFAULT_ACTIVE_CANVAS_FORMATS: CanvasFormatId[] = ['iphone-69', 'android-phone']

/**
 * Layer properties that are stored per-format when edited in a non-base format.
 * Everything else (text, fills, images, models…) is always shared across formats.
 */
export const FORMAT_LAYOUT_KEYS = ['x', 'y', 'width', 'height', 'fontSize', 'scale', 'rotation'] as const

/** Which platform each format targets — drives phone model auto-swap. */
export const FORMAT_PLATFORM: Record<BuiltInFormatId, 'ios' | 'android' | null> = {
  'base': 'ios',
  'iphone-69': 'ios',
  'ipad-13': 'ios',
  'android-phone': 'android',
  'android-tablet': 'android',
  'ipad-11': 'ios',
  'apple-watch': 'ios',
  'wear-os': 'android',
  mac: 'ios',
  appletv: 'ios',
  visionpro: 'ios',
  steam: null,
  'meta-quest': null,
}

/**
 * Presentation-only format family lookup. `base` is the authoring sentinel,
 * not an independently exportable preset; it is labelled phone solely to keep
 * this exhaustive built-in map straightforward until family-specific bases are
 * introduced in a later phase.
 */
export const FORMAT_FAMILY: Record<BuiltInFormatId, FormatFamilyKey> = {
  base: 'phone',
  'iphone-69': 'phone',
  'android-phone': 'phone',
  'ipad-13': 'tablet',
  'android-tablet': 'tablet',
  'ipad-11': 'tablet',
  'apple-watch': 'watch',
  'wear-os': 'watch',
  mac: 'desktop',
  appletv: 'tv',
  visionpro: 'vr',
  steam: 'game',
  'meta-quest': 'vr',
}

export type FormatFamilyKey = 'phone' | 'tablet' | 'watch' | 'desktop' | 'tv' | 'vr' | 'game'

export const FORMAT_FAMILY_ORDER: readonly FormatFamilyKey[] = ['phone', 'tablet', 'watch', 'desktop', 'tv', 'vr', 'game']

export const FORMAT_FAMILY_LABELS: Record<FormatFamilyKey, string> = {
  phone: 'Phone', tablet: 'Tablet', watch: 'Watch', desktop: 'Desktop', tv: 'TV', vr: 'VR', game: 'Game',
}

/** Stable authoring canvas for every derived format family. */
export const FORMAT_FAMILY_ANCHOR: Record<FormatFamilyKey, BuiltInFormatId> = {
  phone: 'iphone-69',
  tablet: 'ipad-13',
  watch: 'apple-watch',
  desktop: 'mac',
  tv: 'appletv',
  vr: 'visionpro',
  game: 'steam',
}

/** Family-specific device surfaces, kept here to avoid a canvas/spec import cycle. */
export const FAMILY_SURFACE: Record<FormatFamilyKey, Partial<Record<'ios' | 'android' | 'default', PhoneLayer['model']>>> = {
  phone: {},
  tablet: { ios: 'ipad-13', android: 'android-tablet' },
  watch: { ios: 'apple-watch', android: 'wear-os' },
  desktop: { ios: 'screen-16-10' },
  tv: { ios: 'screen-16-9' },
  vr: { default: 'screen-16-9' },
  game: { default: 'screen-16-9' },
}

/** Default device surface for a family's Base view, when the family defines one. */
export function getFamilyDefaultPhoneModel(family: FormatFamilyKey): PhoneLayer['model'] | undefined {
  const surface = FAMILY_SURFACE[family]
  return surface.default ?? surface.ios ?? surface.android
}

/** Layout keys + model — model forks per format (auto-swap + manual override). */
export const FORMAT_FORK_KEYS = [...FORMAT_LAYOUT_KEYS, 'model'] as const

/** Locale layout forks spatial keys only; it never swaps a device model. */
export const LOCALE_LAYOUT_FORK_KEYS = FORMAT_LAYOUT_KEYS

/** Maps locale layout properties to their base-coordinate delta fields. */
export const LOCALE_DELTA_FIELDS = {
  x: 'dx',
  y: 'dy',
  rotation: 'dRotation',
  width: 'mWidth',
  height: 'mHeight',
  fontSize: 'mFontSize',
  scale: 'mScale',
} as const satisfies Record<typeof LOCALE_LAYOUT_FORK_KEYS[number], keyof LayoutDelta>

export function isCustomFormatId(id: CanvasFormatId): id is CustomFormatId {
  return id.startsWith('custom:')
}

export function getCanvasFormat(id: CanvasFormatId, customFormats?: CustomCanvasFormat[]) {
  if (id === 'base') return CANVAS_FORMAT_PRESETS.find((f) => f.id === 'iphone-69')!
  const format = isCustomFormatId(id)
    ? customFormats?.find((customFormat) => customFormat.id === id)
    : CANVAS_FORMAT_PRESETS.find((preset) => preset.id === id)
  if (!format) throw new Error(`Unknown canvas format: ${id}`)
  return format
}

export function getFormatPlatform(id: CanvasFormatId): 'ios' | 'android' | null {
  return isCustomFormatId(id) ? null : FORMAT_PLATFORM[id]
}

export function getFormatLabel(id: CanvasFormatId, customFormats?: CustomCanvasFormat[]): string {
  if (isCustomFormatId(id)) return customFormats?.find((format) => format.id === id)?.label ?? id
  const labels: Record<BuiltInFormatId, string> = {
    base: 'Base',
    'iphone-69': 'iPhone',
    'android-phone': 'Android',
    'ipad-13': 'iPad',
    'android-tablet': 'Android Tab',
    'ipad-11': 'iPad 11"',
    'apple-watch': 'Apple Watch',
    'wear-os': 'Wear OS',
    mac: 'Mac',
    appletv: 'Apple TV',
    visionpro: 'Vision Pro',
    steam: 'Steam',
    'meta-quest': 'Meta Quest',
  }
  return labels[id]
}

export function getProjectBaseFormat(project: Pick<Project, 'settings'>): CanvasFormatId {
  void project
  return BASE_CANVAS_FORMAT
}

/** Return a built-in format's family. Custom formats are adopted by groups. */
export function getFormatFamilyKey(formatId: CanvasFormatId): FormatFamilyKey | null {
  return isCustomFormatId(formatId) ? null : FORMAT_FAMILY[formatId]
}

/**
 * Canvas dimensions for a group in a given format.
 * Base format = the group's own stored (authoring) dimensions — including custom sizes.
 * Other formats = the preset dimensions.
 */
export function getFormatCanvasDims(
  group: SlideGroup,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  customFormats?: CustomCanvasFormat[],
): { width: number; height: number } {
  if (format === baseFormat || format === 'base') return { width: group.slideWidth, height: group.slideHeight }
  const preset = getCanvasFormat(format, customFormats)
  return { width: preset.width, height: preset.height }
}
