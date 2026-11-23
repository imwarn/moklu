/**
 * [INPUT]: depends on canvas & ZIP helpers from ./canvasHelpers and Split* types from ./types
 * [OUTPUT]: exports CAROUSEL_PRESET_SIZES, computeCarouselSlices, computeGridSlices, computeSplitPlan, and splitImage
 * [POS]: seamless social panorama carousel and matrix grid image splitter within src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampCanvasDimensions,
  clampNumber,
  createCanvas,
  extensionForFormat,
  fillBackground,
  get2dContext,
  packBlobsToZip,
  sanitizeFilenameStem,
} from './canvasHelpers'
import type {
  CarouselAspect,
  Dimensions,
  LoadedImageItem,
  SplitOptions,
  SplitResult,
  SplitSlice,
  SplitSlicePlan,
} from './types'

export const CAROUSEL_PRESET_SIZES: Record<Exclude<CarouselAspect, 'auto'>, Dimensions> = {
  '4:5': { width: 1080, height: 1350 },
  '3:4': { width: 1080, height: 1440 },
  '1:1': { width: 1080, height: 1080 },
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Compute exact seamless adjacent slice coordinates for social carousel panoramas (2..10 slides).
 */
export function computeCarouselSlices(
  source: Dimensions,
  count = 3,
  carouselAspect: CarouselAspect = '4:5',
): SplitSlicePlan[] {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)
  const slideCount = Math.round(clampNumber(count, 2, 10))

  if (carouselAspect === 'auto') {
    const slices: SplitSlicePlan[] = []
    for (let i = 0; i < slideCount; i += 1) {
      const xStart = Math.round((i * srcW) / slideCount)
      const xEnd = Math.round(((i + 1) * srcW) / slideCount)
      const sliceW = Math.max(1, xEnd - xStart)
      const clamped = clampCanvasDimensions(sliceW, srcH)
      slices.push({
        index: i,
        row: 0,
        col: i,
        sourceRect: { x: xStart, y: 0, width: sliceW, height: srcH },
        outputWidth: clamped.width,
        outputHeight: clamped.height,
      })
    }
    return slices
  }

  const preset = CAROUSEL_PRESET_SIZES[carouselAspect]
  const totalTargetAspect = (slideCount * preset.width) / preset.height
  const srcAspect = srcW / srcH

  let cropX: number
  let cropY: number
  let cropW: number
  let cropH: number

  if (srcAspect > totalTargetAspect) {
    cropH = srcH
    cropW = srcH * totalTargetAspect
    cropX = (srcW - cropW) / 2
    cropY = 0
  } else {
    cropW = srcW
    cropH = srcW / totalTargetAspect
    cropX = 0
    cropY = (srcH - cropH) / 2
  }

  const sliceSourceWidth = cropW / slideCount
  const slices: SplitSlicePlan[] = []

  for (let i = 0; i < slideCount; i += 1) {
    slices.push({
      index: i,
      row: 0,
      col: i,
      sourceRect: {
        x: cropX + i * sliceSourceWidth,
        y: cropY,
        width: sliceSourceWidth,
        height: cropH,
      },
      outputWidth: preset.width,
      outputHeight: preset.height,
    })
  }

  return slices
}

/**
 * Compute row-major grid slice coordinates covering 100% of the source image without edge loss.
 */
export function computeGridSlices(
  source: Dimensions,
  rows = 3,
  cols = 3,
): SplitSlicePlan[] {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)
  const clampedRows = Math.round(clampNumber(rows, 1, 6))
  const clampedCols = Math.round(clampNumber(cols, 1, 6))

  const slices: SplitSlicePlan[] = []
  for (let r = 0; r < clampedRows; r += 1) {
    const yStart = Math.round((r * srcH) / clampedRows)
    const yEnd = Math.round(((r + 1) * srcH) / clampedRows)
    const sliceH = Math.max(1, yEnd - yStart)

    for (let c = 0; c < clampedCols; c += 1) {
      const xStart = Math.round((c * srcW) / clampedCols)
      const xEnd = Math.round(((c + 1) * srcW) / clampedCols)
      const sliceW = Math.max(1, xEnd - xStart)
      const clamped = clampCanvasDimensions(sliceW, sliceH)

      slices.push({
        index: r * clampedCols + c,
        row: r,
        col: c,
        sourceRect: { x: xStart, y: yStart, width: sliceW, height: sliceH },
        outputWidth: clamped.width,
        outputHeight: clamped.height,
      })
    }
  }

  return slices
}

export function computeSplitPlan(source: Dimensions, options: SplitOptions): SplitSlicePlan[] {
  if (options.mode === 'carousel') {
    return computeCarouselSlices(source, options.count ?? 3, options.carouselAspect ?? '4:5')
  }
  return computeGridSlices(source, options.rows ?? 3, options.cols ?? 3)
}

/**
 * Split one loaded image into seamless carousel slides or a custom row x col grid,
 * returning ordered slice Blobs and an optional ready-to-download ZIP archive.
 */
export async function splitImage(
  item: LoadedImageItem,
  options: SplitOptions,
): Promise<SplitResult> {
  const format = options.format ?? 'image/png'
  const ext = extensionForFormat(format)
  const prefix = sanitizeFilenameStem(
    options.filenamePrefix ?? item.name,
    options.mode === 'carousel' ? 'carousel' : 'grid',
  )
  const plans = computeSplitPlan({ width: item.width, height: item.height }, options)
  const slices: SplitSlice[] = []

  for (const plan of plans) {
    const canvas = createCanvas(plan.outputWidth, plan.outputHeight, options.createCanvas)
    const ctx = get2dContext(canvas)

    if (format === 'image/jpeg') {
      fillBackground(ctx, plan.outputWidth, plan.outputHeight, '#ffffff')
    }

    ctx.drawImage(
      item.source,
      plan.sourceRect.x,
      plan.sourceRect.y,
      plan.sourceRect.width,
      plan.sourceRect.height,
      0,
      0,
      plan.outputWidth,
      plan.outputHeight,
    )

    const blob = await canvasToBlob(canvas, format, options.quality)
    const filename =
      options.mode === 'carousel'
        ? `${prefix}-slide-${padTwo(plan.index + 1)}.${ext}`
        : `${prefix}-${padTwo(plan.index + 1)}-r${plan.row + 1}c${plan.col + 1}.${ext}`

    slices.push({
      index: plan.index,
      row: plan.row,
      col: plan.col,
      width: plan.outputWidth,
      height: plan.outputHeight,
      blob,
      bytes: blob.size,
      filename,
      sourceRect: plan.sourceRect,
    })
  }

  const zipFilename = `${prefix}-${options.mode}.zip`
  const includeZip = options.includeZip ?? true
  const zipBlob = includeZip
    ? await packBlobsToZip(slices.map((slice) => ({ filename: slice.filename, blob: slice.blob })))
    : undefined

  return {
    mode: options.mode,
    slices,
    zipBlob,
    zipFilename,
    totalWidth: item.width,
    totalHeight: item.height,
  }
}
