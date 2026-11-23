/**
 * [INPUT]: depends on Layer/LocaleContent/CanvasFormatId/FormatLayerPatch/LayoutDelta types from @/types, mapLayerTree from @/utils/layerTree, and FORMAT_FORK_KEYS/LOCALE_DELTA_FIELDS/LOCALE_LAYOUT_FORK_KEYS from @/utils/canvasFormats
 * [OUTPUT]: exports LOCALE_CONTENT_KEYS, deriveLocaleAdjustDelta, splitFormatPatch, splitLocaleFormatLayoutPatch, splitLocalePatch, patchLayerForLocale, withFormatOverride, patchLayerForLocaleAdjust, withoutLocaleAdjust, withoutLocaleAdjustKey, resetLocaleAdjustsInLayerTree, withoutFormatOverride, and patchLayerForFormat
 * [POS]: pure layer-patching and override-routing module in src/store/; handles format overrides, symmetric locale content, and 3-tier localeAdjust deltas for slices and migrations
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  Layer,
  LocaleContent,
  CanvasFormatId,
  FormatLayerPatch,
  LayoutDelta,
} from '@/types'
import { mapLayerTree } from '@/utils/layerTree'
import {
  FORMAT_FORK_KEYS,
  LOCALE_DELTA_FIELDS,
  LOCALE_LAYOUT_FORK_KEYS,
} from '@/utils/canvasFormats'

// ─── Locale Adjust Delta Derivation ───────────────────────────────────────────

/**
 * Derive a `LayoutDelta` from one legacy absolute `localeLayoutOverrides`
 * patch cell, given `R` (the resolved value excluding that cell). Additive
 * for x/y/rotation (`d = V - R`), multiplicative for width/height/fontSize/
 * scale (`m = V / R`). Prunes no-ops (0/1). Drops (and counts) keys outside
 * the 7 fork keys, and multiplicative keys where `R === 0` (inexpressible as
 * a ratio).
 */
export function deriveLocaleAdjustDelta(patch: FormatLayerPatch, R: Layer): { delta: LayoutDelta; dropped: number } {
  const delta: LayoutDelta = {}
  let localDropped = 0
  const rSource = R as unknown as Record<string, unknown>
  const additiveKeys = new Set(['x', 'y', 'rotation'])
  for (const [key, value] of Object.entries(patch)) {
    const deltaKey = (LOCALE_DELTA_FIELDS as Record<string, keyof LayoutDelta>)[key]
    if (!deltaKey) {
      localDropped++ // key outside the 7 fork keys — no legit writer produced it
      continue
    }
    const rValue = rSource[key]
    if (typeof value !== 'number' || typeof rValue !== 'number') {
      localDropped++
      continue
    }
    if (additiveKeys.has(key)) {
      const derived = value - rValue
      if (derived !== 0) (delta as Record<string, number>)[deltaKey] = derived
    } else {
      if (rValue === 0) {
        localDropped++ // inexpressible as a ratio
        continue
      }
      const derived = value / rValue
      if (derived !== 1) (delta as Record<string, number>)[deltaKey] = derived
    }
  }
  return { delta, dropped: localDropped }
}

// ─── Patch Splitting ──────────────────────────────────────────────────────────

/**
 * Split a layer patch into layout keys (stored per-format) and content keys
 * (always written to the shared base layer). Content stays shared across
 * formats by design — only positioning/sizing forks.
 */
export const splitFormatPatch = (patch: Partial<Layer>): { layout: FormatLayerPatch; content: Partial<Layer> } => {
  const layout: Record<string, unknown> = {}
  const content: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if ((FORMAT_FORK_KEYS as readonly string[]).includes(key)) layout[key] = value
    else content[key] = value
  }
  return { layout: layout as FormatLayerPatch, content: content as Partial<Layer> }
}

/** Split a patch into per-locale, per-format layout keys and everything else. */
export const splitLocaleFormatLayoutPatch = (patch: Partial<Layer>): { layout: FormatLayerPatch; rest: Partial<Layer> } => {
  const layout: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if ((LOCALE_LAYOUT_FORK_KEYS as readonly string[]).includes(key)) layout[key] = value
    else rest[key] = value
  }
  return { layout: layout as FormatLayerPatch, rest: rest as Partial<Layer> }
}

/** Keys whose values are per-locale content (v0.6.0 symmetric locale model). */
export const LOCALE_CONTENT_KEYS = ['text', 'marks', 'screenshotPath', 'screenshotDataUrl', 'src'] as const

/**
 * Split a layer patch into locale-content keys (text/marks/screenshotPath/
 * screenshotDataUrl/src) and everything else. Mirrors splitFormatPatch for
 * the orthogonal locale axis.
 */
export const splitLocalePatch = (patch: Partial<Layer>): { locale: LocaleContent; rest: Partial<Layer> } => {
  const locale: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if ((LOCALE_CONTENT_KEYS as readonly string[]).includes(key)) locale[key] = value
    else rest[key] = value
  }
  return { locale: locale as LocaleContent, rest: rest as Partial<Layer> }
}

// ─── Locale Content & Override Application ────────────────────────────────────

/**
 * Route a layer patch's locale-content keys into localeContent[activeLocale].
 * When editing the default locale, keep the layer's flat default-locale fields
 * in sync as well.
 * Returns the updated layer plus the non-locale `rest` of the patch for the
 * caller to apply via the existing format-patch pipeline. If the patch has
 * no locale-content keys, returns the layer unchanged and the full patch as
 * `rest` (zero-cost passthrough).
 */
export const patchLayerForLocale = (
  layer: Layer,
  patch: Partial<Layer>,
  activeLocale: string,
  defaultLocale: string,
): { layer: Layer; rest: Partial<Layer> } => {
  const { locale: localePatch, rest } = splitLocalePatch(patch)
  if (Object.keys(localePatch).length === 0) return { layer, rest }

  const localeContent = { ...(layer.localeContent ?? {}) }
  localeContent[activeLocale] = { ...(localeContent[activeLocale] ?? {}), ...localePatch }
  let next = { ...layer, localeContent } as Layer

  if (activeLocale === defaultLocale) {
    next = { ...next, ...localePatch } as Layer
  }
  return { layer: next, rest }
}

export const withFormatOverride = (layer: Layer, format: CanvasFormatId, patch: FormatLayerPatch): Layer => ({
  ...layer,
  formatOverrides: {
    ...(layer.formatOverrides ?? {}),
    [format]: {
      ...(layer.formatOverrides?.[format] ?? {}),
      ...patch,
    },
  },
} as Layer)

/**
 * Derive+merge a `LayoutDelta` for one `localeAdjust[locale][scope]` cell —
 * the single write path for non-default-locale layout edits. `scope` is
 * `BASE_CANVAS_FORMAT` for the base-authoring-context write, or the active
 * (non-base) format id for the format-scoped write.
 *
 * `resolved` is the format-resolved value the incoming patch is relative to,
 * EXCLUDING this cell:
 *  - base-scoped (`scope === BASE_CANVAS_FORMAT`): raw === resolved there, so
 *    callers can just pass the (pre-patch) layer itself — free, no extra
 *    resolution needed.
 *  - format-scoped: callers MUST pre-resolve this via
 *    `resolveLayerLocaleAdjustBaseOnly` (or equivalent) BEFORE calling, since
 *    it needs `formatOverrides[F]` + the already-composed base-scoped delta
 *    factored in — this is the one non-trivial cost this write path carries
 *    (measured comfortably under budget, see the deepwork doc's perf writeup).
 *
 * Reuses `deriveLocaleAdjustDelta` (the exact derive/prune math shared with
 * the migration) rather than re-deriving a second time. Replace-not-
 * accumulate semantics per key: each written key's delta is recomputed fresh
 * against `resolved`, not accumulated onto any prior stored delta. Prunes
 * no-op keys (0/1) and empty parent maps.
 */
export const patchLayerForLocaleAdjust = (
  layer: Layer,
  patch: Partial<Layer>,
  locale: string,
  defaultLocale: string,
  scope: CanvasFormatId,
  resolved: Layer,
): { layer: Layer; rest: Partial<Layer> } => {
  const { layout, rest } = splitLocaleFormatLayoutPatch(patch)
  if (locale === defaultLocale || !Object.keys(layout).length) return { layer, rest }

  const { delta: derivedDelta } = deriveLocaleAdjustDelta(layout as FormatLayerPatch, resolved)
  const existing = layer.localeAdjust?.[locale]?.[scope] ?? {}
  const merged: Record<string, number> = { ...(existing as Record<string, number>) }
  for (const layoutKey of Object.keys(layout)) {
    const deltaKey = (LOCALE_DELTA_FIELDS as Record<string, keyof LayoutDelta>)[layoutKey]
    if (!deltaKey) continue
    if (deltaKey in derivedDelta) merged[deltaKey] = (derivedDelta as Record<string, number>)[deltaKey]
    else delete merged[deltaKey]
  }

  if (!Object.keys(merged).length) {
    if (!layer.localeAdjust?.[locale]?.[scope]) return { layer, rest }
    const { [scope]: _removedScope, ...remainingScopes } = layer.localeAdjust[locale]
    void _removedScope
    const { [locale]: _removedLocale, ...remainingLocales } = layer.localeAdjust
    void _removedLocale
    const localeAdjust = Object.keys(remainingScopes).length
      ? { ...remainingLocales, [locale]: remainingScopes }
      : remainingLocales
    return {
      layer: { ...layer, localeAdjust: Object.keys(localeAdjust).length ? localeAdjust : undefined } as Layer,
      rest,
    }
  }

  return {
    layer: {
      ...layer,
      localeAdjust: {
        ...(layer.localeAdjust ?? {}),
        [locale]: {
          ...(layer.localeAdjust?.[locale] ?? {}),
          [scope]: merged as LayoutDelta,
        },
      },
    } as Layer,
    rest,
  }
}

/**
 * Remove one `localeAdjust[locale][scope]` cell and prune empty parent
 * maps. `scope` is `BASE_CANVAS_FORMAT` for the base-scoped cell or an
 * active (non-base) format id for the format-scoped cell — both cells
 * compose rather than shadow, so this only ever clears its own scope.
 */
export const withoutLocaleAdjust = (layer: Layer, locale: string, scope: CanvasFormatId): Layer => {
  if (!layer.localeAdjust?.[locale]?.[scope]) return layer
  const { [scope]: _removedScope, ...remainingScopes } = layer.localeAdjust[locale]
  void _removedScope
  const { [locale]: _removedLocale, ...remainingLocales } = layer.localeAdjust
  void _removedLocale
  const localeAdjust = Object.keys(remainingScopes).length
    ? { ...remainingLocales, [locale]: remainingScopes }
    : remainingLocales
  return { ...layer, localeAdjust: Object.keys(localeAdjust).length ? localeAdjust : undefined } as Layer
}

/**
 * Remove one key from a `localeAdjust[locale][scope]` cell and prune empty
 * maps. Accepts a LAYOUT key (e.g. `'x'`), translating internally via
 * `LOCALE_DELTA_FIELDS` (`OverrideDot` always passes layout keys).
 */
export const withoutLocaleAdjustKey = (
  layer: Layer,
  locale: string,
  scope: CanvasFormatId,
  layoutKey: string,
): Layer => {
  const deltaKey = (LOCALE_DELTA_FIELDS as Record<string, keyof LayoutDelta>)[layoutKey]
  if (!deltaKey) return layer
  const delta = layer.localeAdjust?.[locale]?.[scope]
  if (!delta || !(deltaKey in delta)) return layer
  const { [deltaKey]: _removed, ...remainingDelta } = delta as Record<string, unknown>
  void _removed
  if (!Object.keys(remainingDelta).length) return withoutLocaleAdjust(layer, locale, scope)
  return {
    ...layer,
    localeAdjust: {
      ...layer.localeAdjust,
      [locale]: {
        ...layer.localeAdjust![locale],
        [scope]: remainingDelta as LayoutDelta,
      },
    },
  } as Layer
}

/** Remove one `localeAdjust[locale][scope]` cell across a complete layer tree. */
export const resetLocaleAdjustsInLayerTree = (
  layers: Layer[],
  locale: string,
  scope: CanvasFormatId,
): Layer[] => mapLayerTree(layers, (layer) => withoutLocaleAdjust(layer, locale, scope))

export const withoutFormatOverride = (layer: Layer, format: CanvasFormatId): Layer => {
  if (!layer.formatOverrides?.[format]) return layer
  const { [format]: _removed, ...rest } = layer.formatOverrides
  void _removed
  return { ...layer, formatOverrides: Object.keys(rest).length ? rest : undefined } as Layer
}

/** Apply a patch to a layer respecting the active format: content → base, layout → override. */
export const patchLayerForFormat = (
  layer: Layer,
  patch: Partial<Layer>,
  activeFormat: CanvasFormatId,
  baseFormat: CanvasFormatId,
): Layer => {
  if (activeFormat === baseFormat) return { ...layer, ...patch } as Layer
  const { layout, content } = splitFormatPatch(patch)
  let next = Object.keys(content).length ? ({ ...layer, ...content } as Layer) : layer
  if (Object.keys(layout).length) next = withFormatOverride(next, activeFormat, layout)
  return next
}
