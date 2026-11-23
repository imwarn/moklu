/**
 * [INPUT]: depends on canvas & ZIP helpers from ./canvasHelpers and Compress* types from ./types
 * [OUTPUT]: exports computeCompressedDimensions, compressImage, and compressImages for batch offline compression & format conversion
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
  ClampedDimensions,
  CompressBatchResult,
  CompressOptions,
  CompressResultItem,
  Dimensions,
  LoadedImageItem,
} from './types'

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

/**
 * Compress and/or convert a single loaded image locally via HTML5 Canvas.
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

  const canvas = createCanvas(dims.width, dims.height, options.createCanvas)
  const ctx = get2dContext(canvas)

  if (format === 'image/jpeg') {
    fillBackground(ctx, dims.width, dims.height, options.background ?? '#ffffff')
  }

  ctx.drawImage(item.source, 0, 0, item.width, item.height, 0, 0, dims.width, dims.height)

  const blob = await canvasToBlob(canvas, format, quality)
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
    width: dims.width,
    height: dims.height,
    originalBytes,
    outputBytes,
    savedBytes,
    savedRatio,
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
