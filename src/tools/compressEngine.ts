/**
 * [INPUT]: depends on canvas & ZIP helpers from ./canvasHelpers and Compress* types from ./types
 * [OUTPUT]: exports computeCompressedDimensions, compressImage, and compressImages for batch offline compression, format conversion, and target-KB binary-search compression with optional auto-downscale
 * [POS]: local image compression and format conversion engine within src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampCanvasDimensions,
  clampQuality,
  createCanvas,
  fillBackground,
  get2dContext,
  packBlobsToZip,
  replaceFileExtension,
} from './canvasHelpers'
import type {
  CanvasLike,
  ClampedDimensions,
  CompressBatchResult,
  CompressOptions,
  CompressResultItem,
  Dimensions,
  LoadedImageItem,
} from './types'

const TARGET_SEARCH_MIN_QUALITY = 0.05
const TARGET_SEARCH_MAX_QUALITY = 0.98
const TARGET_SEARCH_ITERATIONS = 7
const AUTO_DOWNSCALE_MAX_STEPS = 4
const AUTO_DOWNSCALE_MIN_WIDTH = 320

/**
 * Compute target output dimensions when optional maxWidth/maxHeight caps are provided.
 * Never upscales an image beyond its original pixel dimensions.
 */
export function computeCompressedDimensions(
  source: Dimensions,
  maxWidth?: number,
  maxHeight?: number,
): ClampedDimensions {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)
  let scale = 1

  if (maxWidth !== undefined && Number.isFinite(maxWidth) && maxWidth > 0 && srcW > maxWidth) {
    scale = Math.min(scale, maxWidth / srcW)
  }
  if (maxHeight !== undefined && Number.isFinite(maxHeight) && maxHeight > 0 && srcH > maxHeight) {
    scale = Math.min(scale, maxHeight / srcH)
  }

  const targetW = Math.max(1, Math.round(srcW * scale))
  const targetH = Math.max(1, Math.round(srcH * scale))
  const clamped = clampCanvasDimensions(targetW, targetH)

  return {
    width: clamped.width,
    height: clamped.height,
    scaleFactor: scale * clamped.scaleFactor,
    clamped: scale < 1 || clamped.clamped,
  }
}

function renderItemToCanvas(
  item: LoadedImageItem,
  width: number,
  height: number,
  options: CompressOptions,
): CanvasLike {
  const canvas = createCanvas(width, height, options.createCanvas)
  const ctx = get2dContext(canvas)

  if (options.format === 'image/jpeg') {
    fillBackground(ctx, width, height, options.background ?? '#ffffff')
  }

  ctx.drawImage(item.source, 0, 0, item.width, item.height, 0, 0, width, height)
  return canvas
}

async function binarySearchQualityForTarget(
  canvas: CanvasLike,
  format: 'image/webp' | 'image/jpeg',
  targetBytes: number,
): Promise<{ blob: Blob; quality: number; met: boolean }> {
  let low = TARGET_SEARCH_MIN_QUALITY
  let high = TARGET_SEARCH_MAX_QUALITY
  let bestUnder: { blob: Blob; quality: number } | null = null
  let smallest: { blob: Blob; quality: number } | null = null

  for (let i = 0; i < TARGET_SEARCH_ITERATIONS; i += 1) {
    const mid = (low + high) / 2
    const blob = await canvasToBlob(canvas, format, mid)
    if (!smallest || blob.size < smallest.blob.size) {
      smallest = { blob, quality: mid }
    }
    if (blob.size <= targetBytes) {
      bestUnder = { blob, quality: mid }
      low = mid
    } else {
      high = mid
    }
  }

  if (bestUnder) {
    return { blob: bestUnder.blob, quality: bestUnder.quality, met: true }
  }

  // Probe the 0.05 quality floor directly before deciding to auto-downscale
  const floorBlob = await canvasToBlob(canvas, format, TARGET_SEARCH_MIN_QUALITY)
  if (floorBlob.size <= targetBytes) {
    return { blob: floorBlob, quality: TARGET_SEARCH_MIN_QUALITY, met: true }
  }
  if (!smallest || floorBlob.size <= smallest.blob.size) {
    return { blob: floorBlob, quality: TARGET_SEARCH_MIN_QUALITY, met: false }
  }
  return { blob: smallest.blob, quality: smallest.quality, met: false }
}

/**
 * Compress and/or convert a single loaded image locally via HTML5 Canvas.
 * When options.targetBytes > 0 for JPEG/WebP, executes a 7-iteration quality binary search
 * with optional iterative width downscaling (up to 4 steps, 320px floor) to meet the size cap.
 */
export async function compressImage(
  item: LoadedImageItem,
  options: CompressOptions,
): Promise<CompressResultItem> {
  const format = options.format
  const quality = clampQuality(options.quality, 0.82)
  const dims = computeCompressedDimensions(
    { width: item.width, height: item.height },
    options.maxWidth,
    options.maxHeight,
  )

  const targetBytes =
    options.targetBytes !== undefined && Number.isFinite(options.targetBytes) && options.targetBytes > 0
      ? Math.floor(options.targetBytes)
      : undefined
  const isLossy = format === 'image/webp' || format === 'image/jpeg'

  let finalWidth = dims.width
  let finalHeight = dims.height
  let blob: Blob
  let targetBytesMet: boolean | undefined
  let autoDownscaled: boolean | undefined
  let appliedQuality: number | undefined

  if (targetBytes !== undefined && isLossy) {
    let scale = 1
    let canvas = renderItemToCanvas(item, finalWidth, finalHeight, options)
    let attempt = await binarySearchQualityForTarget(canvas, format, targetBytes)
    autoDownscaled = false

    if (!attempt.met && !options.preserveOriginalDimensions && finalWidth > AUTO_DOWNSCALE_MIN_WIDTH) {
      for (let step = 0; step < AUTO_DOWNSCALE_MAX_STEPS && !attempt.met; step += 1) {
        const ratio =
          attempt.blob.size > 0 ? Math.sqrt(targetBytes / attempt.blob.size) * 0.92 : 0.8
        scale *= Math.min(0.8, ratio)
        const nextWidth = Math.max(AUTO_DOWNSCALE_MIN_WIDTH, Math.round(dims.width * scale))
        if (nextWidth >= finalWidth) break
        const nextHeight = Math.max(1, Math.round(dims.height * (nextWidth / dims.width)))

        finalWidth = nextWidth
        finalHeight = nextHeight
        autoDownscaled = true

        canvas = renderItemToCanvas(item, finalWidth, finalHeight, options)
        attempt = await binarySearchQualityForTarget(canvas, format, targetBytes)
        if (finalWidth <= AUTO_DOWNSCALE_MIN_WIDTH) break
      }
    }

    blob = attempt.blob
    targetBytesMet = attempt.met
    appliedQuality = Math.round(attempt.quality * 1000) / 1000
  } else {
    const canvas = renderItemToCanvas(item, finalWidth, finalHeight, options)
    blob = await canvasToBlob(canvas, format, quality)
    appliedQuality = isLossy ? quality : undefined
    if (targetBytes !== undefined) {
      targetBytesMet = blob.size <= targetBytes
      autoDownscaled = false
    }
  }

  const originalBytes = Math.max(0, item.originalBytes)
  const outputBytes = blob.size
  const savedBytes = originalBytes - outputBytes
  const savedRatio = originalBytes > 0 ? savedBytes / originalBytes : 0
  const filename = replaceFileExtension(item.name, format, `compressed-${item.id}`)

  return {
    id: item.id,
    originalName: item.name,
    filename,
    format,
    originalWidth: item.width,
    originalHeight: item.height,
    width: finalWidth,
    height: finalHeight,
    originalBytes,
    outputBytes,
    savedBytes,
    savedRatio,
    targetBytesMet,
    autoDownscaled,
    appliedQuality,
    blob,
  }
}

/**
 * Batch compress and convert multiple loaded images, computing aggregate byte savings
 * and packaging all outputs into an optional ZIP archive.
 */
export async function compressImages(
  items: ReadonlyArray<LoadedImageItem>,
  options: CompressOptions,
): Promise<CompressBatchResult> {
  const results: CompressResultItem[] = []
  let totalOriginalBytes = 0
  let totalOutputBytes = 0

  for (const item of items) {
    const result = await compressImage(item, options)
    results.push(result)
    totalOriginalBytes += result.originalBytes
    totalOutputBytes += result.outputBytes
  }

  const totalSavedRatio =
    totalOriginalBytes > 0 ? (totalOriginalBytes - totalOutputBytes) / totalOriginalBytes : 0

  const zipFilename = options.zipFilename ?? 'compressed-images.zip'
  const includeZip = options.includeZip ?? true
  const zipBlob =
    includeZip && results.length > 0
      ? await packBlobsToZip(results.map((entry) => ({ filename: entry.filename, blob: entry.blob })))
      : undefined

  return {
    items: results,
    totalOriginalBytes,
    totalOutputBytes,
    totalSavedRatio,
    zipBlob,
    zipFilename,
  }
}
