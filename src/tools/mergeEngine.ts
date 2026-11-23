/**
 * [INPUT]: depends on canvas & geometry helpers from ./canvasHelpers and Merge* types from ./types
 * [OUTPUT]: exports computeMergeLayout and mergeImages for horizontal, vertical, and grid collages
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
} from './canvasHelpers'
import type {
  Dimensions,
  GridCellAspect,
  LoadedImageItem,
  MergeLayout,
  MergeOptions,
  MergePlacement,
  MergeResult,
} from './types'

const GRID_ASPECT_RATIOS: Record<Exclude<GridCellAspect, 'auto'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
}

function scaleRect(rect: { x: number; y: number; width: number; height: number }, factor: number) {
  return {
    x: rect.x * factor,
    y: rect.y * factor,
    width: rect.width * factor,
    height: rect.height * factor,
  }
}

function computeHorizontalRawLayout(
  items: ReadonlyArray<Dimensions>,
  normalize: 'match-min' | 'match-max' | 'original',
  gap: number,
  padding: number,
  borderRadius: number,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[] } {
  const heights = items.map((item) => Math.max(1, item.height))
  const targetHeight =
    normalize === 'match-min'
      ? Math.min(...heights)
      : normalize === 'match-max'
        ? Math.max(...heights)
        : Math.max(...heights)

  const placements: MergePlacement[] = []
  let cursorX = padding

  for (let i = 0; i < items.length; i += 1) {
    const srcW = Math.max(1, items[i].width)
    const srcH = Math.max(1, items[i].height)
    const drawH = normalize === 'original' ? srcH : targetHeight
    const drawW = normalize === 'original' ? srcW : Math.max(1, Math.round(srcW * (drawH / srcH)))
    const drawY = padding + (targetHeight - drawH) / 2

    placements.push({
      index: i,
      sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
      destRect: { x: cursorX, y: drawY, width: drawW, height: drawH },
      radius: borderRadius,
    })

    cursorX += drawW + (i < items.length - 1 ? gap : 0)
  }

  return {
    rawWidth: cursorX + padding,
    rawHeight: targetHeight + padding * 2,
    placements,
  }
}

function computeVerticalRawLayout(
  items: ReadonlyArray<Dimensions>,
  normalize: 'match-min' | 'match-max' | 'original',
  gap: number,
  padding: number,
  borderRadius: number,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[] } {
  const widths = items.map((item) => Math.max(1, item.width))
  const targetWidth =
    normalize === 'match-min'
      ? Math.min(...widths)
      : normalize === 'match-max'
        ? Math.max(...widths)
        : Math.max(...widths)

  const placements: MergePlacement[] = []
  let cursorY = padding

  for (let i = 0; i < items.length; i += 1) {
    const srcW = Math.max(1, items[i].width)
    const srcH = Math.max(1, items[i].height)
    const drawW = normalize === 'original' ? srcW : targetWidth
    const drawH = normalize === 'original' ? srcH : Math.max(1, Math.round(srcH * (drawW / srcW)))
    const drawX = padding + (targetWidth - drawW) / 2

    placements.push({
      index: i,
      sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
      destRect: { x: drawX, y: cursorY, width: drawW, height: drawH },
      radius: borderRadius,
    })

    cursorY += drawH + (i < items.length - 1 ? gap : 0)
  }

  return {
    rawWidth: targetWidth + padding * 2,
    rawHeight: cursorY + padding,
    placements,
  }
}

function computeGridRawLayout(
  items: ReadonlyArray<Dimensions>,
  columns: number,
  aspectCell: GridCellAspect,
  fit: 'cover' | 'contain',
  gap: number,
  padding: number,
  borderRadius: number,
): { rawWidth: number; rawHeight: number; placements: MergePlacement[] } {
  const clampedCols = Math.round(clampNumber(columns, 2, 6))
  const effectiveCols = Math.max(1, Math.min(clampedCols, items.length))
  const rows = Math.ceil(items.length / effectiveCols)

  const cellWidth = Math.max(1, ...items.map((item) => Math.round(item.width)))
  let cellHeight: number
  if (aspectCell === 'auto') {
    const avgAspect =
      items.reduce((sum, item) => sum + Math.max(1, item.width) / Math.max(1, item.height), 0) /
      items.length
    cellHeight = Math.max(1, Math.round(cellWidth / avgAspect))
  } else {
    cellHeight = Math.max(1, Math.round(cellWidth / GRID_ASPECT_RATIOS[aspectCell]))
  }

  const placements: MergePlacement[] = []
  for (let i = 0; i < items.length; i += 1) {
    const row = Math.floor(i / effectiveCols)
    const col = i % effectiveCols
    const cellBox = {
      x: padding + col * (cellWidth + gap),
      y: padding + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    }

    const { sourceRect, destRect } = computeObjectFitRects(
      items[i].width,
      items[i].height,
      cellBox,
      fit,
    )

    placements.push({
      index: i,
      sourceRect,
      destRect,
      radius: borderRadius,
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
  items: ReadonlyArray<Dimensions>,
  options: MergeOptions,
): MergeLayout {
  if (items.length === 0) {
    throw new Error('At least one image is required to compute a merge layout.')
  }

  const gap = Math.max(0, options.gap ?? 16)
  const padding = Math.max(0, options.padding ?? 24)
  const borderRadius = Math.max(0, options.borderRadius ?? 0)
  const normalize = options.normalize ?? 'match-max'

  let raw: { rawWidth: number; rawHeight: number; placements: MergePlacement[] }
  switch (options.mode) {
    case 'horizontal':
      raw = computeHorizontalRawLayout(items, normalize, gap, padding, borderRadius)
      break
    case 'vertical':
      raw = computeVerticalRawLayout(items, normalize, gap, padding, borderRadius)
      break
    case 'grid':
      raw = computeGridRawLayout(
        items,
        options.columns ?? 2,
        options.aspectCell ?? 'auto',
        options.fit ?? 'cover',
        gap,
        padding,
        borderRadius,
      )
      break
  }

  const clamped = clampCanvasDimensions(raw.rawWidth, raw.rawHeight, options.maxDimension)
  const scale = clamped.scaleFactor

  return {
    width: clamped.width,
    height: clamped.height,
    scaleFactor: scale,
    placements: raw.placements.map((placement) => ({
      index: placement.index,
      sourceRect: placement.sourceRect,
      destRect: scaleRect(placement.destRect, scale),
      radius: placement.radius * scale,
    })),
  }
}

/**
 * Compose multiple loaded images onto a single client-side HTML5 Canvas and export as Blob.
 */
export async function mergeImages(
  items: ReadonlyArray<LoadedImageItem>,
  options: MergeOptions,
): Promise<MergeResult> {
  if (items.length === 0) {
    throw new Error('At least one image is required to merge.')
  }

  const format = options.format ?? 'image/png'
  const layout = computeMergeLayout(items, options)
  const canvas = createCanvas(layout.width, layout.height, options.createCanvas)
  const ctx = get2dContext(canvas)

  const opaqueFallback = format === 'image/jpeg' ? '#ffffff' : undefined
  fillBackground(ctx, layout.width, layout.height, options.background ?? '#ffffff', opaqueFallback)

  for (const placement of layout.placements) {
    const item = items[placement.index]
    const { sourceRect, destRect, radius } = placement
    ctx.save()
    if (radius > 0) {
      clipRoundedRect(ctx, destRect.x, destRect.y, destRect.width, destRect.height, radius)
    }
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
    ctx.restore()
  }

  const blob = await canvasToBlob(canvas, format, options.quality)
  const stem = sanitizeFilenameStem(options.filename ?? `merged-${options.mode}`, 'merged')
  const filename = `${stem}.${extensionForFormat(format)}`

  return {
    blob,
    width: layout.width,
    height: layout.height,
    format,
    bytes: blob.size,
    filename,
    layout,
  }
}
