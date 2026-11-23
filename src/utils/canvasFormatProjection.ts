/**
 * [INPUT]: depends on CanvasFormatId, CustomCanvasFormat, GroupLayer, Layer, PhoneLayer, Project, and SlideGroup from @/types; depends on getModelForPlatform and getPhoneSpec from @/assets/mockups/specs; depends on format metadata from ./canvasFormatRegistry and getGroupFamilyKey from ./canvasFormatSelectors
 * [OUTPUT]: exports rebasePhoneModelSwap, getFormatScaleFactor, scaleLayerToCanvas, resolveLayerFormat, applyCanvasFormatToGroup, applyCanvasFormat, and mapLayerToAuthoringSpace
 * [POS]: geometric canvas-format projection and inverse authoring-space mapping engine in src/utils; consumed by canvasFormatLayout and re-exported by canvasFormats.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  CanvasFormatId,
  CustomCanvasFormat,
  GroupLayer,
  Layer,
  PhoneLayer,
  Project,
  SlideGroup,
} from '@/types'
import { getModelForPlatform, getPhoneSpec } from '@/assets/mockups/specs'
import {
  FAMILY_SURFACE,
  getCanvasFormat,
  getFamilyDefaultPhoneModel,
  getFormatCanvasDims,
  getFormatFamilyKey,
  getFormatPlatform,
  getProjectBaseFormat,
  type FormatFamilyKey,
} from './canvasFormatRegistry'
import { getGroupFamilyKey } from './canvasFormatSelectors'

/**
 * Preserve a phone layer's visual area and centre when its intrinsic device
 * surface changes during format projection.
 */
export function rebasePhoneModelSwap(
  layer: PhoneLayer,
  nextModel: PhoneLayer['model'],
  canvasW: number,
  canvasH: number,
): PhoneLayer {
  if (nextModel === layer.model || layer.scale <= 0) return layer

  const oldSpec = getPhoneSpec(layer.model)
  const newSpec = getPhoneSpec(nextModel)
  const oldW = oldSpec.frameWidth * layer.scale
  const oldH = oldSpec.frameHeight * layer.scale
  const areaScale = layer.scale * Math.sqrt(
    (oldSpec.frameWidth * oldSpec.frameHeight) / (newSpec.frameWidth * newSpec.frameHeight),
  )
  const containScale = Math.min(canvasW / newSpec.frameWidth, canvasH / newSpec.frameHeight)
  const nextScale = Math.min(areaScale, containScale)
  const nextW = newSpec.frameWidth * nextScale
  const nextH = newSpec.frameHeight * nextScale

  const next: PhoneLayer = {
    ...layer,
    model: nextModel,
    scale: nextScale,
    x: layer.x + (oldW - nextW) / 2,
    y: layer.y + (oldH - nextH) / 2,
  }
  if (newSpec.statusBar.height === 0) {
    delete next.showStatusBar
    delete next.statusBarBg
    delete next.statusBarTheme
    delete next.statusBarColor
  }
  return next
}

/**
 * Compute the uniform fit-center scale factor when mapping from one canvas size
 * to another. Uses min(sx, sy) so the content fits inside the target canvas
 * without clipping, with symmetric letterbox margins when aspect ratios differ.
 */
function fitCenterScale(fromW: number, fromH: number, toW: number, toH: number): number {
  return Math.min(toW / fromW, toH / fromH)
}

/**
 * Return the fit-centre scale used by applyCanvasFormatToGroup for this group.
 * Kept parallel to that engine deliberately; tests guard against math drift.
 */
export function getFormatScaleFactor(
  group: SlideGroup,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  customFormats?: CustomCanvasFormat[],
): number {
  if (format === baseFormat) return 1
  const target = getFormatCanvasDims(group, format, baseFormat, customFormats)
  return fitCenterScale(group.slideWidth, group.slideHeight, target.width, target.height)
}

/**
 * Scale a layer using a uniform factor `s` anchored to the canvas centre.
 *
 * `anchor` controls how x/y are treated:
 *  - 'canvas'  (default): x/y are absolute canvas coordinates → apply the
 *    letterbox translation so the visual centre of the canvas stays centred.
 *  - 'origin': x/y are relative to a parent (group children) → pure multiply,
 *    no translation.
 *
 * width/height scale by `s` uniformly; fontSize and scale (phone) also use `s`.
 */
function scaleLayer(
  layer: Layer,
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
  s?: number,
  anchor: 'canvas' | 'origin' = 'canvas',
): Layer {
  const factor = s ?? fitCenterScale(fromW, fromH, toW, toH)

  let newX: number
  let newY: number
  if (anchor === 'canvas') {
    // Anchor to canvas centre: translate so the midpoint maps to the new midpoint.
    newX = toW / 2 + (layer.x - fromW / 2) * factor
    newY = toH / 2 + (layer.y - fromH / 2) * factor
  } else {
    // Relative coordinates (group children): pure scale from origin.
    newX = layer.x * factor
    newY = layer.y * factor
  }

  const scaled = { ...layer, x: newX, y: newY } as Layer

  const l = scaled as Layer & { width?: number; height?: number; fontSize?: number; scale?: number }
  if (typeof l.width === 'number') l.width *= factor
  if (typeof l.height === 'number') l.height *= factor
  if (typeof l.fontSize === 'number') l.fontSize *= factor
  if (typeof l.scale === 'number' && scaled.type !== 'group') l.scale *= factor

  if (scaled.type === 'group') {
    const group = scaled as GroupLayer
    // Group children use 'origin' anchor — their x/y are relative to the group.
    return {
      ...group,
      children: group.children.map((child) =>
        scaleLayer(child, fromW, fromH, toW, toH, factor, 'origin'),
      ),
    }
  }

  return scaled
}

/**
 * Bake the same fit-centre projection used by format resolution into a layer.
 * Callers that fork an independently authored group use this once; normal
 * resolution continues to use the private `scaleLayer` path above.
 */
export function scaleLayerToCanvas<T extends Layer>(
  layer: T,
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
  scaleFactor?: number,
): T {
  return scaleLayer(layer, fromW, fromH, toW, toH, scaleFactor) as T
}

/**
 * Resolve a single layer for a format view.
 * - Filters out layers hidden in this format.
 * - Base format: layers stay in authoring space, with an active family's
 *   default device surface projected for PhoneLayers when available.
 * - Other formats: auto-scale from the group's authoring dims, then apply the
 *   format's stored layout overrides on top.
 */
export function resolveLayerFormat(
  layer: Layer,
  format: CanvasFormatId,
  isBase: boolean,
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
  customFormats?: CustomCanvasFormat[],
  anchor: 'canvas' | 'origin' = 'canvas',
  family: FormatFamilyKey | null = null,
): Layer | null {
  // If layer is owned by a specific format, only show it in that format
  if (layer.ownerFormat !== undefined && layer.ownerFormat !== format) return null

  if (layer.formatVisibility?.[format] === false) return null

  let resolved: Layer
  if (isBase) {
    const familyDefault = family ? getFamilyDefaultPhoneModel(family) : undefined
    const familyModels = family ? Object.values(FAMILY_SURFACE[family]) : []
    const needsRebase = layer.type === 'phone' && familyDefault !== undefined
      && !familyModels.includes((layer as PhoneLayer).model)
    resolved = needsRebase
      ? rebasePhoneModelSwap(layer as PhoneLayer, familyDefault, fromW, fromH)
      : layer
  } else {
    // Phone model auto-swap: a format family's surface takes precedence; phone
    // and tablet retain the established platform-keyed iOS/Android behavior.
    let effectiveLayer: Layer = layer
    if (layer.type === 'phone') {
      const targetPlatform = getFormatPlatform(format)
      const phoneLayer = layer as PhoneLayer
      if ((layer.formatOverrides?.[format] as Record<string, unknown> | undefined)?.model === undefined) {
        const family = getFormatFamilyKey(format)
        const surface = family ? FAMILY_SURFACE[family] : undefined
        const swappedModel = surface?.default
          ?? (targetPlatform ? surface?.[targetPlatform] : undefined)
          ?? (targetPlatform ? getModelForPlatform(phoneLayer.model, targetPlatform) : phoneLayer.model)
        if (swappedModel !== phoneLayer.model) {
          effectiveLayer = rebasePhoneModelSwap(phoneLayer, swappedModel, fromW, fromH)
        }
      }
    }
    const scaled = scaleLayer(effectiveLayer, fromW, fromH, toW, toH, undefined, anchor)
    const patch = layer.formatOverrides?.[format]
    resolved = patch ? ({ ...scaled, ...patch, id: layer.id, type: layer.type } as Layer) : scaled
  }

  if (resolved.type === 'group') {
    const original = layer as GroupLayer
    return {
      ...(resolved as GroupLayer),
      children: original.children
        .map((child) => resolveLayerFormat(child, format, isBase, fromW, fromH, toW, toH, customFormats, 'origin', family))
        .filter((child): child is Layer => Boolean(child)),
    }
  }

  return resolved
}

export function applyCanvasFormatToGroup(
  group: SlideGroup,
  format: CanvasFormatId,
  baseFormat: CanvasFormatId,
  customFormats?: CustomCanvasFormat[],
): SlideGroup {
  const isBase = format === baseFormat
  const target = getFormatCanvasDims(group, format, baseFormat, customFormats)
  // For pano groups (numSlides > 1) the authoring canvas is slideWidth × numSlides wide.
  // Pass the full pano width as fromW/toW so scaleLayer anchors to the true canvas
  // centre instead of the single-slide centre — otherwise slide 2+ layers are
  // projected outside the per-slide capture window and export as blank.
  const n = group.numSlides ?? 1
  const fromW = group.slideWidth * n
  const toW = target.width * n
  const family = getGroupFamilyKey(group)
  return {
    ...group,
    slideWidth: target.width,
    slideHeight: target.height,
    layers: group.layers
      .map((layer) => resolveLayerFormat(layer, format, isBase, fromW, group.slideHeight, toW, target.height, customFormats, 'canvas', family))
      .filter((layer): layer is Layer => Boolean(layer)),
  }
}

/** Project-wide format projection. Used by canvas render, panels, and exports. */
export function applyCanvasFormat(project: Project, format: CanvasFormatId): Project {
  const baseFormat = getProjectBaseFormat(project)
  return {
    ...project,
    slideGroups: project.slideGroups.map((group) =>
      applyCanvasFormatToGroup(group, format, baseFormat, project.settings.customFormats),
    ),
  }
}

/**
 * Map a layer expressed in a format's coordinate space back into the group's
 * authoring (base) space. Used when adding layers while previewing a non-base
 * format, and when promoting a format adjustment to the shared base.
 *
 * Uses the exact reciprocal of the forward fit-center scale factor so that
 * base → format → base is a lossless round-trip.
 */
export function mapLayerToAuthoringSpace<T extends Layer>(
  layer: T,
  activeFormat: CanvasFormatId,
  baseFormat: CanvasFormatId,
  groupW: number,
  groupH: number,
  customFormats?: CustomCanvasFormat[],
  anchor: 'canvas' | 'origin' = 'canvas',
): T {
  if (activeFormat === baseFormat) return layer
  const active = getCanvasFormat(activeFormat, customFormats)
  // Forward factor: s_fwd = min(active.width/groupW, active.height/groupH)
  // Inverse factor: 1/s_fwd — do NOT recompute min() in the reverse direction.
  const sFwd = fitCenterScale(groupW, groupH, active.width, active.height)
  const sInv = 1 / sFwd
  return scaleLayer(layer, active.width, active.height, groupW, groupH, sInv, anchor) as T
}
