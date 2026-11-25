/**
 * [INPUT]: depends on canvas & geometry helpers from ./canvasHelpers, single- and multi-page PDF builders from ./pdfHelper, async main-thread-yielding vertical overlap detector & seam override resolver from ./stitchOverlap, and Merge* types from ./types
 * [OUTPUT]: exports computeMergeLayout and mergeImages for horizontal, vertical (with automatic overlap removal and per-seam manual overrides), and grid collages with cross-axis alignment, per-item 90deg rotation, per-image border strokes, and PNG/JPEG/WebP/single-or-multipage PDF export
 * [POS]: image stitching and collage composition engine within src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampCanvasDimensions,
  clampNumber,
  clipRoundedRect,
  computeObjectFitRects,
  createCanvas,
  extensionForFormat,
  fillBackground,
  get2dContext,
  sanitizeFilenameStem,
  traceRoundedRectPath,
} from './canvasHelpers'
import {
  createMultiPagePdfFromJpegs,
  createSinglePagePdfFromJpeg,
  type MultiPagePdfPageInput,
} from './pdfHelper'
import { applySeamOverlapOverrides, detectVerticalStitchOverlapsAsync } from './stitchOverlap'
import type {
  CanvasContextLike,
  GridCellAspect,
  LoadedImageItem,
  MergeAlign,
  MergeLayout,
  MergeLayoutItem,
  MergeOptions,
  MergeOutputFormat,
  MergePlacement,
  MergeResult,
  MergeRotation,
  MergeSeamInfo,
  Rect,
  VerticalItemTrim,
} from './types'

const GRID_ASPECT_RATIOS: Record<Exclude<GridCellAspect, 'auto'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
}

function normalizeRotation(raw?: number): MergeRotation {
  if (!raw) return 0
  const mod = ((Math.round(raw / 90) * 90) % 360 + 360) % 360
  if (mod === 90 || mod === 180 || mod === 270) return mod
  return 0
}

function getEffectiveDimensions(srcW: number, srcH: number, rotation: MergeRotation): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: srcH, height: srcW }
    : { width: srcW, height: srcH }
}

/**
 * Map a source crop rect computed in rotated visual image coordinates back into
 * the original unrotated source image coordinate space.
 */
function mapRotatedSourceRect(
  rotatedRect: Rect,
  origWidth: number,
  origHeight: number,
  rotation: MergeRotation,
): Rect {
  const { x: rx, y: ry, width: rw, height: rh } = rotatedRect
  switch (rotation) {
    case 90:
      return { x: ry, y: origHeight - (rx + rw), width: rh, height: rw }
    case 180:
      return { x: origWidth - (rx + rw), y: origHeight - (ry + rh), width: rw, height: rh }
    case 270:
      return { x: origWidth - (ry + rh), y: rx, width: rh, height: rw }
    case 0:
    default:
      return rotatedRect
  }
}

function resolveCrossOffset(containerSpan: number, itemSpan: number, align: MergeAlign): number {
  const slack = containerSpan - itemSpan
  if (align === 'start') return 0
  if (align === 'end') return slack
  return slack / 2
}

function scaleRect(rect: Rect, factor: number): Rect {
  return {
    x: rect.x * factor,
    y: rect.y * factor,
    width: rect.width * factor,
    height: rect.height * factor,
  }
}

function resolveItemMetrics(
  items: ReadonlyArray<MergeLayoutItem>,
  itemRotations?: ReadonlyArray<MergeRotation>,
): Array<{ origW: number; origH: number; effW: number; effH: number; rotation: MergeRotation }> {
  return items.map((item, idx) => {
    const origW = Math.max(1, item.width)
    const origH = Math.max(1, item.height)
    const rotation = normalizeRotation(itemRotations?.[idx] ?? item.rotation)
    const eff = getEffectiveDimensions(origW, origH, rotation)
    return { origW, origH, effW: eff.width, effH: eff.height, rotation }
  })
}

function computeHorizontalRawLayout(
  metrics: ReadonlyArray<{ origW: number; origH: number; effW: number; effH: number; rotation: MergeRotation }>,
  normalize: 'match-min' | 'match-max' | 'original',
  align: MergeAlign,
  gap: number,
  padding: number,
  borderRadius: number,
  borderWidth: number,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[] } {
  const heights = metrics.map((m) => m.effH)
  const targetHeight = normalize === 'match-min' ? Math.min(...heights) : Math.max(...heights)

  const placements: MergePlacement[] = []
  let cursorX = padding

  for (let i = 0; i < metrics.length; i += 1) {
    const { origW, origH, effW, effH, rotation } = metrics[i]
    const drawH = normalize === 'original' ? effH : targetHeight
    const drawW = normalize === 'original' ? effW : Math.max(1, Math.round(effW * (drawH / effH)))
    const drawY = padding + resolveCrossOffset(targetHeight, drawH, align)

    placements.push({
      index: i,
      sourceRect: { x: 0, y: 0, width: origW, height: origH },
      destRect: { x: cursorX, y: drawY, width: drawW, height: drawH },
      radius: borderRadius,
      rotation,
      borderWidth,
    })

    cursorX += drawW + (i < metrics.length - 1 ? gap : 0)
  }

  return {
    rawWidth: cursorX + padding,
    rawHeight: targetHeight + padding * 2,
    placements,
  }
}

function computeVerticalRawLayout(
  metrics: ReadonlyArray<{ origW: number; origH: number; effW: number; effH: number; rotation: MergeRotation }>,
  normalize: 'match-min' | 'match-max' | 'original',
  align: MergeAlign,
  gap: number,
  padding: number,
  borderRadius: number,
  borderWidth: number,
  verticalTrims?: ReadonlyArray<VerticalItemTrim>,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[]; rawOverlapRemovedPx: number } {
  const widths = metrics.map((m) => m.effW)
  const targetWidth = normalize === 'match-min' ? Math.min(...widths) : Math.max(...widths)

  const placements: MergePlacement[] = []
  let cursorY = padding
  let rawOverlapRemovedPx = 0

  for (let i = 0; i < metrics.length; i += 1) {
    const { origW, origH, effW, effH, rotation } = metrics[i]
    const trim = verticalTrims?.[i]
    const trimTop = trim ? Math.max(0, Math.min(Math.round(trim.trimTop), effH - 1)) : 0
    const trimBottom = trim ? Math.max(0, Math.min(Math.round(trim.trimBottom), effH - trimTop - 1)) : 0
    const keptEffH = Math.max(1, effH - trimTop - trimBottom)

    const drawW = normalize === 'original' ? effW : targetWidth
    const fullDrawH = normalize === 'original' ? effH : Math.max(1, Math.round(effH * (drawW / effW)))
    const drawH =
      trimTop === 0 && trimBottom === 0
        ? fullDrawH
        : Math.max(1, Math.round(keptEffH * (drawW / effW)))
    rawOverlapRemovedPx += Math.max(0, fullDrawH - drawH)

    const drawX = padding + resolveCrossOffset(targetWidth, drawW, align)
    const rotatedSourceRect: Rect = { x: 0, y: trimTop, width: effW, height: keptEffH }
    const sourceRect =
      trimTop === 0 && trimBottom === 0
        ? { x: 0, y: 0, width: origW, height: origH }
        : mapRotatedSourceRect(rotatedSourceRect, origW, origH, rotation)

    placements.push({
      index: i,
      sourceRect,
      destRect: { x: drawX, y: cursorY, width: drawW, height: drawH },
      radius: borderRadius,
      rotation,
      borderWidth,
    })

    cursorY += drawH + (i < metrics.length - 1 ? gap : 0)
  }

  return {
    rawWidth: targetWidth + padding * 2,
    rawHeight: cursorY + padding,
    placements,
    rawOverlapRemovedPx,
  }
}

function computeGridRawLayout(
  metrics: ReadonlyArray<{ origW: number; origH: number; effW: number; effH: number; rotation: MergeRotation }>,
  columns: number,
  aspectCell: GridCellAspect,
  fit: 'cover' | 'contain',
  gap: number,
  padding: number,
  borderRadius: number,
  borderWidth: number,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[] } {
  const clampedCols = Math.round(clampNumber(columns, 2, 6))
  const effectiveCols = Math.max(1, Math.min(clampedCols, metrics.length))
  const rows = Math.ceil(metrics.length / effectiveCols)

  const cellWidth = Math.max(1, ...metrics.map((m) => Math.round(m.effW)))
  let cellHeight: number
  if (aspectCell === 'auto') {
    const avgAspect =
      metrics.reduce((sum, m) => sum + m.effW / m.effH, 0) / metrics.length
    cellHeight = Math.max(1, Math.round(cellWidth / avgAspect))
  } else {
    cellHeight = Math.max(1, Math.round(cellWidth / GRID_ASPECT_RATIOS[aspectCell]))
  }

  const placements: MergePlacement[] = []
  for (let i = 0; i < metrics.length; i += 1) {
    const { origW, origH, effW, effH, rotation } = metrics[i]
    const row = Math.floor(i / effectiveCols)
    const col = i % effectiveCols
    const cellBox = {
      x: padding + col * (cellWidth + gap),
      y: padding + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    }

    const { sourceRect: rotatedSourceRect, destRect } = computeObjectFitRects(effW, effH, cellBox, fit)
    const sourceRect = mapRotatedSourceRect(rotatedSourceRect, origW, origH, rotation)

    placements.push({
      index: i,
      sourceRect,
      destRect,
      radius: borderRadius,
      rotation,
      borderWidth,
    })
  }

  const rawWidth = padding * 2 + effectiveCols * cellWidth + (effectiveCols - 1) * gap
  const rawHeight = padding * 2 + rows * cellHeight + (rows - 1) * gap

  return { rawWidth, rawHeight, placements }
}

/**
 * Pure layout solver for horizontal stitch, vertical stitch, and grid collage modes.
 * Uniformly scales output and all placements when exceeding safe 8192px / 64MP canvas bounds.
 */
export function computeMergeLayout(
  items: ReadonlyArray<MergeLayoutItem>,
  options: MergeOptions,
  verticalTrims?: ReadonlyArray<VerticalItemTrim>,
  baseSeamInfos?: ReadonlyArray<MergeSeamInfo>,
): MergeLayout {
  if (items.length === 0) {
    throw new Error('At least one image is required to compute a merge layout.')
  }

  const gap = Math.max(0, options.gap ?? 16)
  const padding = Math.max(0, options.padding ?? 24)
  const borderRadius = Math.max(0, options.borderRadius ?? 0)
  const borderWidth = Math.max(0, options.borderWidth ?? 0)
  const normalize = options.normalize ?? 'match-max'
  const align: MergeAlign = options.align ?? 'center'
  const metrics = resolveItemMetrics(items, options.itemRotations)

  let resolvedTrims = verticalTrims
  let seams: MergeSeamInfo[] | undefined
  if (options.mode === 'vertical' && metrics.length >= 2) {
    const applied = applySeamOverlapOverrides(
      metrics.map((m) => m.effH),
      verticalTrims,
      baseSeamInfos,
      options.seamOverlapOverrides,
    )
    resolvedTrims = applied.trims
    seams = applied.seams
  }

  let raw: { rawWidth: number; rawHeight: number; placements: MergePlacement[]; rawOverlapRemovedPx?: number }
  switch (options.mode) {
    case 'horizontal':
      raw = computeHorizontalRawLayout(metrics, normalize, align, gap, padding, borderRadius, borderWidth)
      break
    case 'vertical':
      raw = computeVerticalRawLayout(
        metrics,
        normalize,
        align,
        gap,
        padding,
        borderRadius,
        borderWidth,
        resolvedTrims,
      )
      break
    case 'grid':
      raw = computeGridRawLayout(
        metrics,
        options.columns ?? 2,
        options.aspectCell ?? 'auto',
        options.fit ?? 'cover',
        gap,
        padding,
        borderRadius,
        borderWidth,
      )
      break
  }

  const clamped = clampCanvasDimensions(raw.rawWidth, raw.rawHeight, options.maxDimension)
  const scale = clamped.scaleFactor
  const rawRemoved = raw.rawOverlapRemovedPx ?? 0
  const overlapRemovedPx = rawRemoved > 0 ? Math.max(1, Math.round(rawRemoved * scale)) : 0

  return {
    width: clamped.width,
    height: clamped.height,
    scaleFactor: scale,
    overlapRemovedPx,
    ...(seams ? { seams } : {}),
    placements: raw.placements.map((placement) => ({
      index: placement.index,
      sourceRect: placement.sourceRect,
      destRect: scaleRect(placement.destRect, scale),
      radius: placement.radius * scale,
      rotation: placement.rotation,
      borderWidth: placement.borderWidth * scale,
    })),
  }
}

function extensionForMergeFormat(format: MergeOutputFormat): string {
  return format === 'application/pdf' ? 'pdf' : extensionForFormat(format)
}

function drawRotatedItem(
  ctx: CanvasContextLike,
  item: LoadedImageItem,
  sourceRect: Rect,
  destRect: Rect,
  rotation: MergeRotation,
): void {
  if (rotation === 0) {
    ctx.drawImage(
      item.source,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      destRect.x,
      destRect.y,
      destRect.width,
      destRect.height,
    )
    return
  }

  const cx = destRect.x + destRect.width / 2
  const cy = destRect.y + destRect.height / 2
  const swapped = rotation === 90 || rotation === 270
  const drawW = swapped ? destRect.height : destRect.width
  const drawH = swapped ? destRect.width : destRect.height
  ctx.translate(cx, cy)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(
    item.source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH,
  )
}

/**
 * Compose multiple loaded images onto a single client-side HTML5 Canvas and export as PNG, JPEG, WebP, or single-/multi-page PDF.
 */
export async function mergeImages(
  items: ReadonlyArray<LoadedImageItem>,
  options: MergeOptions,
): Promise<MergeResult> {
  if (items.length === 0) {
    throw new Error('At least one image is required to merge.')
  }

  const format: MergeOutputFormat = options.format ?? 'image/png'
  const isPdf = format === 'application/pdf'
  const overlapPlan =
    options.mode === 'vertical' && options.removeOverlap && items.length >= 2
      ? await detectVerticalStitchOverlapsAsync(items, {
          itemRotations: options.itemRotations,
          createCanvas: options.createCanvas,
        })
      : undefined
  const layout = computeMergeLayout(items, options, overlapPlan?.trims, overlapPlan?.seamInfos)
  const stem = sanitizeFilenameStem(options.filename ?? `merged-${options.mode}`, 'merged')
  const filename = `${stem}.${extensionForMergeFormat(format)}`

  if (isPdf && options.pdfMode === 'multipage') {
    const pages: MultiPagePdfPageInput[] = []
    let previewBlob: Blob | undefined

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      const rotation = normalizeRotation(options.itemRotations?.[i])
      const eff = getEffectiveDimensions(Math.max(1, item.width), Math.max(1, item.height), rotation)
      const clamped = clampCanvasDimensions(eff.width, eff.height, options.maxDimension)

      const pageCanvas = createCanvas(clamped.width, clamped.height, options.createCanvas)
      const pageCtx = get2dContext(pageCanvas)
      fillBackground(pageCtx, clamped.width, clamped.height, options.background ?? '#ffffff', '#ffffff')

      pageCtx.save()
      drawRotatedItem(
        pageCtx,
        item,
        { x: 0, y: 0, width: item.width, height: item.height },
        { x: 0, y: 0, width: clamped.width, height: clamped.height },
        rotation,
      )
      pageCtx.restore()

      const jpegBlob = await canvasToBlob(pageCanvas, 'image/jpeg', options.quality)
      if (!previewBlob) previewBlob = jpegBlob
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
      pages.push({ jpegBytes, pixelWidth: clamped.width, pixelHeight: clamped.height })
    }

    const pdfBlob = createMultiPagePdfFromJpegs(pages, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
      margin: options.pdfMargin,
    })

    return {
      blob: pdfBlob,
      previewBlob,
      width: layout.width,
      height: layout.height,
      format,
      bytes: pdfBlob.size,
      filename,
      layout,
      ...(layout.seams ? { seams: layout.seams } : {}),
    }
  }

  const canvas = createCanvas(layout.width, layout.height, options.createCanvas)
  const ctx = get2dContext(canvas)

  const opaqueFallback = format === 'image/jpeg' || isPdf ? '#ffffff' : undefined
  fillBackground(ctx, layout.width, layout.height, options.background ?? '#ffffff', opaqueFallback)

  const borderColor = options.borderColor ?? '#ffffff'

  for (const placement of layout.placements) {
    const item = items[placement.index]
    const { sourceRect, destRect, radius, rotation, borderWidth } = placement
    ctx.save()
    if (radius > 0) {
      clipRoundedRect(ctx, destRect.x, destRect.y, destRect.width, destRect.height, radius)
    }
    drawRotatedItem(ctx, item, sourceRect, destRect, rotation)
    ctx.restore()

    if (borderWidth > 0) {
      const lw = Math.min(borderWidth, destRect.width / 2, destRect.height / 2)
      const inset = lw / 2
      const innerW = destRect.width - lw
      const innerH = destRect.height - lw
      if (innerW > 0 && innerH > 0) {
        ctx.save()
        traceRoundedRectPath(
          ctx,
          destRect.x + inset,
          destRect.y + inset,
          innerW,
          innerH,
          Math.max(0, radius - inset),
        )
        ctx.strokeStyle = borderColor
        ctx.lineWidth = lw
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  if (isPdf) {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', options.quality)
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
    const pdfBlob = createSinglePagePdfFromJpeg(jpegBytes, layout.width, layout.height)
    return {
      blob: pdfBlob,
      previewBlob: jpegBlob,
      width: layout.width,
      height: layout.height,
      format,
      bytes: pdfBlob.size,
      filename,
      layout,
      ...(layout.seams ? { seams: layout.seams } : {}),
    }
  }

  const blob = await canvasToBlob(canvas, format, options.quality)
  return {
    blob,
    width: layout.width,
    height: layout.height,
    format,
    bytes: blob.size,
    filename,
    layout,
    ...(layout.seams ? { seams: layout.seams } : {}),
  }
}
