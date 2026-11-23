/**
 * [INPUT]: depends on CanvasFormatId, CustomCanvasFormat, GroupLayer, Layer, LayoutDelta, Project, and SlideGroup from @/types; depends on findLayerInTree, forEachLayerTree, and mapLayerTree from @/utils/layerTree; depends on applyLocaleToGroup from ./locale; depends on BASE_CANVAS_FORMAT, getProjectBaseFormat, and LOCALE_DELTA_FIELDS from ./canvasFormatRegistry; depends on applyCanvasFormatToGroup, getFormatScaleFactor, and mapLayerToAuthoringSpace from ./canvasFormatProjection
 * [OUTPUT]: exports locale-adjust composition, combined view resolution, and layer-tree format mutation/counting helpers (applyLayoutDelta, applyLocaleAdjust, applyLocaleAdjustToGroup, resolveLayerLocaleAdjustBaseOnly, resolveGroupView, resolveProjectView, resetFormatOverridesInLayerTree, resetFormatVisibilityInLayerTree, promoteFormatOverridesToSharedInLayerTree, makeOwnedFormatLayersSharedInLayerTree, countFormatAdjustments, countLocaleAdjustments)
 * [POS]: locale-layout composition, full view resolution, and per-format override lifecycle helpers in src/utils; re-exported by canvasFormats.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  CanvasFormatId,
  CustomCanvasFormat,
  GroupLayer,
  Layer,
  LayoutDelta,
  Project,
  SlideGroup,
} from '@/types'
import { findLayerInTree, forEachLayerTree, mapLayerTree } from '@/utils/layerTree'
import { applyLocaleToGroup } from './locale'
import {
  BASE_CANVAS_FORMAT,
  getProjectBaseFormat,
  LOCALE_DELTA_FIELDS,
} from './canvasFormatRegistry'
import {
  applyCanvasFormatToGroup,
  getFormatScaleFactor,
  mapLayerToAuthoringSpace,
} from './canvasFormatProjection'

/**
 * Apply one per-key `LayoutDelta` to an already format-resolved layer.
 * Shared math for the `localeAdjust` model — NOT legacy despite the deltas
 * it was originally built for: `applyLocaleAdjust` calls this TWICE (once at
 * the group's format scale factor `f` for the base-scoped cell, once at
 * factor `1` for the format-scoped cell, since that one is already authored
 * in format-space). Additive keys (x/y) are scaled by `f`; rotation is not;
 * multiplicative keys (width/height/fontSize/scale) multiply the
 * already-resolved value directly and are never scaled by `f` themselves.
 */
export function applyLayoutDelta(layer: Layer, delta: LayoutDelta | undefined, f: number): Layer {
  if (!delta) return layer
  const next = { ...layer } as Layer & Record<string, unknown>
  const add = (property: 'x' | 'y' | 'rotation', deltaKey: 'dx' | 'dy' | 'dRotation') => {
    const value = delta[deltaKey]
    if (typeof value === 'number' && typeof layer[property] === 'number') {
      next[property] = layer[property] + value * (property === 'rotation' ? 1 : f)
    }
  }
  add('x', LOCALE_DELTA_FIELDS.x)
  add('y', LOCALE_DELTA_FIELDS.y)
  add('rotation', LOCALE_DELTA_FIELDS.rotation)

  const multiply = (property: 'width' | 'height' | 'fontSize' | 'scale', multiplier: number | undefined) => {
    const value = next[property]
    if (typeof multiplier === 'number' && typeof value === 'number' && value !== 0) {
      next[property] = value * multiplier
    }
  }
  multiply('width', delta[LOCALE_DELTA_FIELDS.width])
  multiply('height', delta[LOCALE_DELTA_FIELDS.height])
  multiply('fontSize', delta[LOCALE_DELTA_FIELDS.fontSize])
  if (layer.type !== 'group') multiply('scale', delta[LOCALE_DELTA_FIELDS.scale])
  return next as Layer
}

/**
 * P1 of the 3-tier `localeAdjust` unification. Merges a layer's per-locale
 * adjustment deltas onto an already format-resolved layer, per the deepwork
 * spec's composition precedence:
 *
 *   base (authored) -> auto-scaled per format -> formatOverrides[F] (pinned)
 *     -> + localeAdjust[L][BASE] * f   (composes, every format)
 *       -> + localeAdjust[L][F] * 1    (composes, this format only, format-space)
 *
 * Both cells COMPOSE — there is no "wins"/shadowing here. Reuses
 * `applyLayoutDelta` for the actual per-key math (same additive/
 * multiplicative rules), called twice: once with the group's format scale
 * factor for the base-scoped cell, once with factor 1 for the format-scoped
 * cell (already authored in format space).
 */
export function applyLocaleAdjust(layer: Layer, locale: string, format: CanvasFormatId, f: number): Layer {
  const baseScoped = layer.localeAdjust?.[locale]?.[BASE_CANVAS_FORMAT]
  // `localeAdjust[locale][BASE_CANVAS_FORMAT]` and `localeAdjust[locale][format]`
  // are the LITERAL SAME map cell when format === BASE_CANVAS_FORMAT — guard so
  // the base-scoped cell is never composed twice at the base format view.
  const formatScoped = format === BASE_CANVAS_FORMAT ? undefined : layer.localeAdjust?.[locale]?.[format]
  const withBaseScoped = applyLayoutDelta(layer, baseScoped, f)
  return applyLayoutDelta(withBaseScoped, formatScoped, 1)
}

/** Group-scoped `localeAdjust` resolver, mirroring `applyCanvasFormatToGroup`. */
export function applyLocaleAdjustToGroup(
  group: SlideGroup,
  locale: string,
  format: CanvasFormatId,
  defaultLocale: string,
  scaleFactor: number,
): SlideGroup {
  if (locale === defaultLocale) return group
  // Mirror the same base/format collapse guard as applyLocaleAdjust: at the
  // base format, localeAdjust[locale][format] IS localeAdjust[locale][BASE],
  // so only probe it separately when format is a distinct, non-base cell.
  const checkFormatScoped = format !== BASE_CANVAS_FORMAT
  let hasApplicableAdjust = false
  forEachLayerTree(group.layers, (layer) => {
    if (layer.localeAdjust?.[locale]?.[BASE_CANVAS_FORMAT] || (checkFormatScoped && layer.localeAdjust?.[locale]?.[format])) {
      hasApplicableAdjust = true
    }
  })
  if (!hasApplicableAdjust) return group
  return {
    ...group,
    layers: mapLayerTree(group.layers, (layer) => applyLocaleAdjust(layer, locale, format, scaleFactor)),
  }
}

/**
 * Resolve a single layer's value for (locale, format), including the
 * base-scoped `localeAdjust[locale][BASE]` cell but EXCLUDING the
 * format-scoped `localeAdjust[locale][format]` cell. Used by the migration
 * to compute `R` (the "resolved value before this cell") when deriving a
 * delta from a legacy absolute `localeLayoutOverrides` cell, and by the
 * write path to pre-resolve the format-scoped write's anchor — reuses the
 * real render path instead of hand-rolling the scale/override arithmetic a
 * second time.
 */
export function resolveLayerLocaleAdjustBaseOnly(
  group: SlideGroup,
  layerId: string,
  locale: string,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  customFormats?: CustomCanvasFormat[],
): Layer | undefined {
  const scaleFactor = getFormatScaleFactor(group, format, baseFormat, customFormats)
  const formatResolvedGroup = applyCanvasFormatToGroup(group, format, baseFormat, customFormats)
  const resolvedLayer = findLayerInTree(formatResolvedGroup.layers, layerId)
  if (!resolvedLayer) return undefined
  const originalLayer = findLayerInTree(group.layers, layerId)
  const baseScoped = originalLayer?.localeAdjust?.[locale]?.[BASE_CANVAS_FORMAT]
  return applyLayoutDelta(resolvedLayer, baseScoped, scaleFactor)
}

/**
 * Resolve content, format projection, then locale/format layout in precedence order.
 *
 * Reads the `localeAdjust` tier exclusively via `applyLocaleAdjustToGroup`.
 * The legacy 4-tier engine (`localeBaseDelta`/`localeLayoutOverrides`) was
 * fully retired in P4 (fields deleted, functions deleted) — do not re-add a
 * second read pass here: composing two read paths over the same data would
 * double-count every delta (see git history / deepwork doc for the P1
 * double-apply investigation this guarded against before the read-path
 * flip).
 */
function resolveSlideGroupView(
  settings: Project['settings'],
  group: SlideGroup,
  locale: string,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
): SlideGroup {
  const scaleFactor = getFormatScaleFactor(group, format, baseFormat, settings.customFormats)
  const localeResolvedGroup = applyLocaleToGroup(group, locale, settings.defaultLocale)
  const formatResolvedGroup = applyCanvasFormatToGroup(
    localeResolvedGroup,
    format,
    baseFormat,
    settings.customFormats,
  )
  return applyLocaleAdjustToGroup(
    formatResolvedGroup,
    locale,
    format,
    settings.defaultLocale,
    scaleFactor,
  )
}

/**
 * Resolve one group's content, format projection, and locale layout adjustment.
 * This is the shared per-group engine used by both full-project and hot-path views.
 */
export function resolveGroupView(
  group: SlideGroup,
  settings: Project['settings'],
  locale: string,
  format: CanvasFormatId,
): SlideGroup {
  const baseFormat = getProjectBaseFormat({ settings })
  return resolveSlideGroupView(settings, group, locale, format, baseFormat)
}

export function resolveProjectView(
  project: Project,
  locale: string,
  format: CanvasFormatId,
): Project {
  const baseFormat = getProjectBaseFormat(project)
  return {
    ...project,
    slideGroups: project.slideGroups.map((group) =>
      resolveSlideGroupView(project.settings, group, locale, format, baseFormat),
    ),
  }
}

function withoutFormatOverride(layer: Layer, format: CanvasFormatId): Layer {
  if (!layer.formatOverrides?.[format]) return layer
  const { [format]: _removed, ...rest } = layer.formatOverrides
  void _removed
  return { ...layer, formatOverrides: Object.keys(rest).length ? rest : undefined } as Layer
}

function withoutFormatVisibility(layer: Layer, format: CanvasFormatId): Layer {
  if (layer.formatVisibility?.[format] === undefined) return layer
  const { [format]: _removed, ...rest } = layer.formatVisibility
  void _removed
  return { ...layer, formatVisibility: Object.keys(rest).length ? rest : undefined } as Layer
}

/** Remove every layout/model override for a format in one slide group. */
export function resetFormatOverridesInLayerTree(layers: Layer[], format: CanvasFormatId): Layer[] {
  return mapLayerTree(layers, (layer) => withoutFormatOverride(layer, format))
}

/** Remove every explicit visibility entry for a format in one slide group. */
export function resetFormatVisibilityInLayerTree(layers: Layer[], format: CanvasFormatId): Layer[] {
  return mapLayerTree(layers, (layer) => withoutFormatVisibility(layer, format))
}

/**
 * Promote all per-format override keys in a slide group back to the shared
 * authoring layer, then remove those overrides. Content remains shared by
 * design; this only consumes values already present in formatOverrides.
 */
export function promoteFormatOverridesToSharedInLayerTree(
  layers: Layer[],
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  groupW: number,
  groupH: number,
  customFormats?: CustomCanvasFormat[],
): Layer[] {
  if (format === baseFormat) return layers

  const childIds = new Set<string>()
  forEachLayerTree(layers, (layer) => {
    if (layer.type === 'group') layer.children.forEach((child) => childIds.add(child.id))
  })

  return mapLayerTree(layers, (layer) => {
    const patch = layer.formatOverrides?.[format]
    if (!patch) return layer

    // Override values are stored in the target format's coordinate space.
    // Map a temporary layer back to authoring space, then copy only the keys
    // that were actually overridden. Group children may be scaled in the temp
    // value, but they are intentionally not copied unless they are patch keys.
    const inTargetSpace = { ...layer, ...patch, id: layer.id, type: layer.type } as Layer
    const mapped = mapLayerToAuthoringSpace(
      inTargetSpace,
      format,
      baseFormat,
      groupW,
      groupH,
      customFormats,
      childIds.has(layer.id) ? 'origin' : 'canvas',
    ) as unknown as Record<string, unknown>
    const sharedPatch: Record<string, unknown> = {}
    for (const key of Object.keys(patch)) sharedPatch[key] = mapped[key]

    return withoutFormatOverride({ ...layer, ...sharedPatch } as Layer, format)
  })
}

/**
 * Convert all layers owned by `format` into shared layers for the active slide.
 * Owned subtrees are mapped back to authoring coordinates as a whole so their
 * appearance in the source platform stays as close as possible after sharing.
 */
export function makeOwnedFormatLayersSharedInLayerTree(
  layers: Layer[],
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  groupW: number,
  groupH: number,
  customFormats?: CustomCanvasFormat[],
): Layer[] {
  function makeShared(layer: Layer, anchor: 'canvas' | 'origin'): Layer {
    const mapped = format === baseFormat
      ? layer
      : mapLayerToAuthoringSpace(layer, format, baseFormat, groupW, groupH, customFormats, anchor)
    return withoutFormatVisibility({ ...mapped, ownerFormat: undefined } as Layer, format)
  }

  function visit(layer: Layer, anchor: 'canvas' | 'origin' = 'canvas'): Layer {
    if (layer.ownerFormat === format) return makeShared(layer, anchor)
    if (layer.type === 'group') {
      return { ...layer, children: (layer as GroupLayer).children.map((child) => visit(child, 'origin')) } as Layer
    }
    return layer
  }

  return layers.map((layer) => visit(layer))
}

/**
 * Count how many layers (including group children) in a slide group have
 * format-specific customisations for the given format:
 * - at least one key in `formatOverrides[format]`, OR
 * - an explicit `formatVisibility[format]` entry.
 */
export function countFormatAdjustments(
  group: SlideGroup,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
): number {
  if (format === baseFormat) return 0

  function countLayer(layer: Layer): number {
    let count = 0
    const overrides = layer.formatOverrides?.[format]
    const hasOverrides = overrides !== undefined && Object.keys(overrides).length > 0
    const hasVisibility = layer.formatVisibility?.[format] !== undefined
    const isOwned = layer.ownerFormat === format
    if (hasOverrides || hasVisibility || isOwned) count++
    if (layer.type === 'group') {
      for (const child of (layer as GroupLayer).children) {
        count += countLayer(child)
      }
    }
    return count
  }

  return group.layers.reduce((sum, layer) => sum + countLayer(layer), 0)
}

/**
 * Unified `localeAdjust[locale][scope]` counter — `scope` is
 * `BASE_CANVAS_FORMAT` for the base-scoped count or an active (non-base)
 * format id for the format-scoped count. Both scopes read through this same
 * code path, closing the old "no indicator on a non-base tab for a
 * base-scoped-only adjustment" visibility gap for any caller that queries
 * the base scope regardless of the active tab.
 */
export function countLocaleAdjustments(group: SlideGroup, locale: string, scope: CanvasFormatId): number {
  let count = 0
  mapLayerTree(group.layers, (layer) => {
    const delta = layer.localeAdjust?.[locale]?.[scope]
    if (delta && Object.keys(delta).length > 0) count++
    return layer
  })
  return count
}
