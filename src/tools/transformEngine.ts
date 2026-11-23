/**
 * [INPUT]: depends on canvas & ZIP helpers from ./canvasHelpers and Transform* types from ./types
 * [OUTPUT]: exports ASPECT_RATIOS, computeResizeGeometry, computeCropGeometry, computePadGeometry, computeTransformGeometry, transformImage, and transformImages
 * [POS]: batch resize, normalized/preset crop, and non-cropping border/pad engine within src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampCanvasDimensions,
  clampNumber,
  clipRoundedRect,
  createCanvas,
  fillBackground,
  get2dContext,
  packBlobsToZip,
  replaceFileExtension,
  traceRoundedRectPath,
} from './canvasHelpers'
import type {
  AspectPreset,
  Dimensions,
  LoadedImageItem,
  TransformBatchResult,
  TransformCropOptions,
  TransformGeometry,
  TransformOptions,
  TransformPadOptions,
  TransformResizeOptions,
  TransformResultItem,
} from './types'

export const ASPECT_RATIOS: Record<Exclude<AspectPreset, 'original'>, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
  '4:3': 4 / 3,
}

/**
 * Compute output dimensions for resize mode supporting exact px, uniform scale, and aspect lock.
 */
export function computeResizeGeometry(
  source: Dimensions,
  options?: TransformResizeOptions,
): TransformGeometry {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)
  const lockAspect = options?.lockAspect ?? true

  let rawW = srcW
  let rawH = srcH

  const hasWidth = options?.width !== undefined && Number.isFinite(options.width) && options.width > 0
  const hasHeight = options?.height !== undefined && Number.isFinite(options.height) && options.height > 0
  const hasScale = options?.scale !== undefined && Number.isFinite(options.scale) && options.scale > 0

  if (hasWidth && hasHeight) {
    if (lockAspect) {
      const fitScale = Math.min(options.width! / srcW, options.height! / srcH)
      rawW = Math.max(1, Math.round(srcW * fitScale))
      rawH = Math.max(1, Math.round(srcH * fitScale))
    } else {
      rawW = Math.max(1, Math.round(options.width!))
      rawH = Math.max(1, Math.round(options.height!))
    }
  } else if (hasWidth) {
    rawW = Math.max(1, Math.round(options.width!))
    rawH = lockAspect ? Math.max(1, Math.round(rawW * (srcH / srcW))) : srcH
  } else if (hasHeight) {
    rawH = Math.max(1, Math.round(options.height!))
    rawW = lockAspect ? Math.max(1, Math.round(rawH * (srcW / srcH))) : srcW
  } else if (hasScale) {
    rawW = Math.max(1, Math.round(srcW * options.scale!))
    rawH = Math.max(1, Math.round(srcH * options.scale!))
  }

  const clamped = clampCanvasDimensions(rawW, rawH)
  return {
    outputWidth: clamped.width,
    outputHeight: clamped.height,
    sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
    destRect: { x: 0, y: 0, width: clamped.width, height: clamped.height },
    radius: 0,
    shadow: false,
    scaleFactor: clamped.scaleFactor,
  }
}

/**
 * Compute crop source rect and output dimensions from a normalized [0..1] rect or centered aspect preset.
 */
export function computeCropGeometry(
  source: Dimensions,
  options?: TransformCropOptions,
): TransformGeometry {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)

  let sx = 0
  let sy = 0
  let sw = srcW
  let sh = srcH

  if (options?.rect) {
    const nx = clampNumber(options.rect.x, 0, 0.999)
    const ny = clampNumber(options.rect.y, 0, 0.999)
    const nw = clampNumber(options.rect.width, 0.001, 1 - nx)
    const nh = clampNumber(options.rect.height, 0.001, 1 - ny)
    sx = nx * srcW
    sy = ny * srcH
    sw = Math.max(1, nw * srcW)
    sh = Math.max(1, nh * srcH)
  } else if (options?.aspect) {
    const targetAspect = ASPECT_RATIOS[options.aspect]
    const srcAspect = srcW / srcH
    if (srcAspect > targetAspect) {
      sh = srcH
      sw = srcH * targetAspect
      sx = (srcW - sw) / 2
      sy = 0
    } else {
      sw = srcW
      sh = srcW / targetAspect
      sx = 0
      sy = (srcH - sh) / 2
    }
  }

  const rawOutW = options?.outputWidth && options.outputWidth > 0 ? options.outputWidth : Math.round(sw)
  const rawOutH = options?.outputHeight && options.outputHeight > 0 ? options.outputHeight : Math.round(sh)
  const clamped = clampCanvasDimensions(rawOutW, rawOutH)

  return {
    outputWidth: clamped.width,
    outputHeight: clamped.height,
    sourceRect: { x: sx, y: sy, width: sw, height: sh },
    destRect: { x: 0, y: 0, width: clamped.width, height: clamped.height },
    radius: 0,
    shadow: false,
    scaleFactor: clamped.scaleFactor,
  }
}

/**
 * Compute non-cropping border/pad canvas geometry that preserves 100% of the source image
 * inside a configurable border and target aspect ratio.
 */
export function computePadGeometry(
  source: Dimensions,
  options?: TransformPadOptions,
): TransformGeometry {
  const srcW = Math.max(1, source.width)
  const srcH = Math.max(1, source.height)
  const border = Math.max(0, options?.border ?? 32)
  const radius = Math.max(0, options?.borderRadius ?? 0)
  const shadow = options?.shadow ?? false

  const minCanvasW = srcW + border * 2
  const minCanvasH = srcH + border * 2
  let rawW = minCanvasW
  let rawH = minCanvasH

  const aspect = options?.aspect ?? 'original'
  if (aspect !== 'original') {
    const targetRatio = ASPECT_RATIOS[aspect]
    if (minCanvasW / minCanvasH < targetRatio) {
      rawW = Math.max(minCanvasW, Math.round(minCanvasH * targetRatio))
      rawH = minCanvasH
    } else {
      rawW = minCanvasW
      rawH = Math.max(minCanvasH, Math.round(minCanvasW / targetRatio))
    }
  }

  let scale = 1
  if (options?.outputWidth && options.outputWidth > 0 && options?.outputHeight && options.outputHeight > 0) {
    scale = Math.min(options.outputWidth / rawW, options.outputHeight / rawH)
  } else if (options?.outputWidth && options.outputWidth > 0) {
    scale = options.outputWidth / rawW
  } else if (options?.outputHeight && options.outputHeight > 0) {
    scale = options.outputHeight / rawH
  }

  const scaledW = Math.max(1, rawW * scale)
  const scaledH = Math.max(1, rawH * scale)
  const clamped = clampCanvasDimensions(scaledW, scaledH)
  const totalScale = scale * clamped.scaleFactor

  const destW = srcW * totalScale
  const destH = srcH * totalScale
  const destX = (clamped.width - destW) / 2
  const destY = (clamped.height - destH) / 2

  return {
    outputWidth: clamped.width,
    outputHeight: clamped.height,
    sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
    destRect: { x: destX, y: destY, width: destW, height: destH },
    radius: radius * totalScale,
    shadow,
    scaleFactor: totalScale,
  }
}

export function computeTransformGeometry(
  source: Dimensions,
  options: TransformOptions,
): TransformGeometry {
  switch (options.mode) {
    case 'resize':
      return computeResizeGeometry(source, options.resize)
    case 'crop':
      return computeCropGeometry(source, options.crop)
    case 'pad':
      return computePadGeometry(source, options.pad)
  }
}

/**
 * Execute resize, crop, or border/pad transformation on a single loaded image locally.
 */
export async function transformImage(
  item: LoadedImageItem,
  options: TransformOptions,
): Promise<TransformResultItem> {
  const format = options.format ?? 'image/png'
  const geometry = computeTransformGeometry({ width: item.width, height: item.height }, options)
  const canvas = createCanvas(geometry.outputWidth, geometry.outputHeight, options.createCanvas)
  const ctx = get2dContext(canvas)

  const opaqueFallback = format === 'image/jpeg' ? '#ffffff' : undefined
  if (options.mode === 'pad') {
    fillBackground(
      ctx,
      geometry.outputWidth,
      geometry.outputHeight,
      options.pad?.background ?? '#ffffff',
      opaqueFallback,
    )
  } else if (opaqueFallback) {
    fillBackground(ctx, geometry.outputWidth, geometry.outputHeight, opaqueFallback)
  }

  const { sourceRect, destRect, radius, shadow, scaleFactor } = geometry

  // Draw unclipped shadow backing before clipped image so rounded corners keep a soft drop shadow.
  if (options.mode === 'pad' && shadow) {
    ctx.save()
    ctx.shadowColor = options.pad?.shadowColor ?? 'rgba(15, 23, 42, 0.22)'
    ctx.shadowBlur = Math.max(0, (options.pad?.shadowBlur ?? 28) * scaleFactor)
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = (options.pad?.shadowOffsetY ?? 10) * scaleFactor
    ctx.fillStyle = '#ffffff'
    traceRoundedRectPath(ctx, destRect.x, destRect.y, destRect.width, destRect.height, radius)
    ctx.fill()
    ctx.restore()
  }

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

  const blob = await canvasToBlob(canvas, format, options.quality)
  const filename = replaceFileExtension(item.name, format, `${options.mode}-${item.id}`)

  return {
    id: item.id,
    originalName: item.name,
    filename,
    mode: options.mode,
    format,
    originalWidth: item.width,
    originalHeight: item.height,
    width: geometry.outputWidth,
    height: geometry.outputHeight,
    bytes: blob.size,
    blob,
    geometry,
  }
}

/**
 * Batch transform multiple loaded images and optionally package outputs into a ZIP archive.
 */
export async function transformImages(
  items: ReadonlyArray<LoadedImageItem>,
  options: TransformOptions,
): Promise<TransformBatchResult> {
  const results: TransformResultItem[] = []
  for (const item of items) {
    results.push(await transformImage(item, options))
  }

  const zipFilename = options.zipFilename ?? `transformed-${options.mode}.zip`
  const includeZip = options.includeZip ?? true
  const zipBlob =
    includeZip && results.length > 0
      ? await packBlobsToZip(results.map((entry) => ({ filename: entry.filename, blob: entry.blob })))
      : undefined

  return {
    items: results,
    zipBlob,
    zipFilename,
  }
}
