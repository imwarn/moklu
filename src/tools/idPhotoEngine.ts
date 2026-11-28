/**
 * [INPUT]: depends on canvasHelpers for Canvas 2D creation/encoding/ZIP packing, decontaminatePixelRgb & detectPortraitFramingFromAlpha from ./portraitMatting, print sheet helpers from ./idPhotoPrintSheet, and ID photo types from ./types
 * [OUTPUT]: exports detectPortraitFramingFromAlpha, computeIdPhotoCropSourceRect, renderIdPhoto, composeIdPhotoTrioZip, computeIdPhotoSheetLayout, and composeIdPhotoPrintSheet
 * [POS]: zero-halo ID photo compositor, exact-dimension exam KB binary-search encoder, and multi-color trio ZIP builder in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampNumber,
  clampQuality,
  createCanvas,
  extensionForFormat,
  fillBackground,
  get2dContext,
  packBlobsToZip,
  sanitizeFilenameStem,
} from './canvasHelpers'
import { composeIdPhotoPrintSheet, computeIdPhotoSheetLayout } from './idPhotoPrintSheet'
import { decontaminatePixelRgb, detectPortraitFramingFromAlpha } from './portraitMatting'
import type {
  CanvasContextLike,
  CanvasLike,
  IdPhotoOutputFormat,
  IdPhotoRenderResult,
  ImageDataLike,
  Rect,
  RefineAndCompositeIdPhotoOptions,
} from './types'

export { composeIdPhotoPrintSheet, computeIdPhotoSheetLayout, detectPortraitFramingFromAlpha }

const TARGET_KB_MIN_QUALITY = 0.12
const TARGET_KB_MAX_QUALITY = 0.96
const TARGET_KB_ITERATIONS = 7

const DEFAULT_TRIO_COLORS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'white', hex: '#FFFFFF' },
  { name: 'blue', hex: '#438EDB' },
  { name: 'red', hex: '#D92B2B' },
]

// ============================================================================
// Aspect-Locked Pan/Zoom Crop Solver
// ============================================================================

/**
 * Compute an aspect-locked source crop rectangle for the target ID photo pixel ratio.
 * Clamps within source image bounds when zoom >= 1, and centers smoothly when zoomed out (< 1).
 */
export function computeIdPhotoCropSourceRect(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  framing: { centerX: number; centerY: number; zoom: number },
): Rect {
  const safeSrcW = Math.max(1, srcW)
  const safeSrcH = Math.max(1, srcH)
  const safeTargetW = Math.max(1, targetW)
  const safeTargetH = Math.max(1, targetH)

  const srcAspect = safeSrcW / safeSrcH
  const targetAspect = safeTargetW / safeTargetH

  let baseW: number
  let baseH: number
  if (srcAspect > targetAspect) {
    baseH = safeSrcH
    baseW = safeSrcH * targetAspect
  } else {
    baseW = safeSrcW
    baseH = safeSrcW / targetAspect
  }

  const zoom = clampNumber(framing.zoom, 0.5, 4)
  const cropW = baseW / zoom
  const cropH = baseH / zoom

  const cx = clampNumber(framing.centerX, 0, 1) * safeSrcW
  const cy = clampNumber(framing.centerY, 0, 1) * safeSrcH

  const rawX = cx - cropW / 2
  const rawY = cy - cropH / 2

  const x =
    cropW <= safeSrcW
      ? clampNumber(rawX, 0, safeSrcW - cropW)
      : clampNumber(rawX, safeSrcW - cropW, 0)
  const y =
    cropH <= safeSrcH
      ? clampNumber(rawY, 0, safeSrcH - cropH)
      : clampNumber(rawY, safeSrcH - cropH, 0)

  return { x, y, width: cropW, height: cropH }
}

// ============================================================================
// Alpha Edge Shift, Feathering & Decontaminated Compositing
// ============================================================================

function applyEdgeMorphShift(
  alpha: Float32Array,
  width: number,
  height: number,
  edgeShift: number,
): Float32Array {
  const shift = clampNumber(edgeShift, -2, 2)
  if (Math.abs(shift) < 0.01 || width < 2 || height < 2) {
    return alpha
  }

  const erode = shift < 0
  const strength = Math.min(1, Math.abs(shift) / 2)
  const thresholdBias = shift * 0.08
  const out = new Float32Array(width * height)

  for (let y = 0; y < height; y += 1) {
    const yPrev = Math.max(0, y - 1)
    const yNext = Math.min(height - 1, y + 1)

    for (let x = 0; x < width; x += 1) {
      const xPrev = Math.max(0, x - 1)
      const xNext = Math.min(width - 1, x + 1)

      const idx = y * width + x
      const center = alpha[idx]
      const up = alpha[yPrev * width + x]
      const down = alpha[yNext * width + x]
      const left = alpha[y * width + xPrev]
      const right = alpha[y * width + xNext]

      const morph = erode
        ? Math.min(center, up, down, left, right)
        : Math.max(center, up, down, left, right)

      let shifted = center * (1 - strength) + morph * strength
      if (shifted > 0.005 && shifted < 0.995) {
        shifted = clampNumber(shifted + thresholdBias, 0, 1)
      }
      out[idx] = shifted
    }
  }

  return out
}

function applyAlphaFeather(
  alpha: Float32Array,
  width: number,
  height: number,
  feather: number,
): Float32Array {
  const amount = clampNumber(feather, 0, 3)
  if (amount < 0.05 || width < 2 || height < 2) {
    return alpha
  }

  const r = Math.max(1, Math.round(amount))
  const blend = Math.min(1, amount)
  const temp = new Float32Array(width * height)
  const out = new Float32Array(width * height)

  for (let y = 0; y < height; y += 1) {
    const row = y * width
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - r)
      const right = Math.min(width - 1, x + r)
      let sum = 0
      for (let k = left; k <= right; k += 1) sum += alpha[row + k]
      temp[row + x] = sum / (right - left + 1)
    }
  }

  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - r)
    const bottom = Math.min(height - 1, y + r)
    const invCount = 1 / (bottom - top + 1)
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let k = top; k <= bottom; k += 1) sum += temp[k * width + x]
      const idx = y * width + x
      out[idx] = clampNumber(alpha[idx] * (1 - blend) + sum * invCount * blend, 0, 1)
    }
  }

  return out
}

function sampleCroppedPortrait(
  matte: RefineAndCompositeIdPhotoOptions['matte'],
  cropRect: Rect,
  targetW: number,
  targetH: number,
): { rgb: Uint8ClampedArray; alpha: Float32Array } {
  const n = targetW * targetH
  const rgb = new Uint8ClampedArray(n * 3)
  const alpha = new Float32Array(n)
  const { width: srcW, height: srcH, sourceRgba, guidedAlpha } = matte

  for (let y = 0; y < targetH; y += 1) {
    const v = targetH > 1 ? (y + 0.5) / targetH : 0.5
    const sy = cropRect.y + v * cropRect.height - 0.5

    for (let x = 0; x < targetW; x += 1) {
      const u = targetW > 1 ? (x + 0.5) / targetW : 0.5
      const sx = cropRect.x + u * cropRect.width - 0.5

      const dstIdx = y * targetW + x
      if (sx < -0.5 || sx > srcW - 0.5 || sy < -0.5 || sy > srcH - 0.5) {
        alpha[dstIdx] = 0
        continue
      }

      const clampedX = clampNumber(sx, 0, srcW - 1)
      const clampedY = clampNumber(sy, 0, srcH - 1)
      const x0 = Math.floor(clampedX)
      const y0 = Math.floor(clampedY)
      const x1 = Math.min(srcW - 1, x0 + 1)
      const y1 = Math.min(srcH - 1, y0 + 1)
      const fx = clampedX - x0
      const fy = clampedY - y0

      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy

      const p00 = y0 * srcW + x0
      const p10 = y0 * srcW + x1
      const p01 = y1 * srcW + x0
      const p11 = y1 * srcW + x1

      const c00 = p00 * 4
      const c10 = p10 * 4
      const c01 = p01 * 4
      const c11 = p11 * 4

      const rgbIdx = dstIdx * 3
      rgb[rgbIdx] = Math.round(
        sourceRgba[c00] * w00 + sourceRgba[c10] * w10 + sourceRgba[c01] * w01 + sourceRgba[c11] * w11,
      )
      rgb[rgbIdx + 1] = Math.round(
        sourceRgba[c00 + 1] * w00 +
          sourceRgba[c10 + 1] * w10 +
          sourceRgba[c01 + 1] * w01 +
          sourceRgba[c11 + 1] * w11,
      )
      rgb[rgbIdx + 2] = Math.round(
        sourceRgba[c00 + 2] * w00 +
          sourceRgba[c10 + 2] * w10 +
          sourceRgba[c01 + 2] * w01 +
          sourceRgba[c11 + 2] * w11,
      )

      alpha[dstIdx] = clampNumber(
        guidedAlpha[p00] * w00 + guidedAlpha[p10] * w10 + guidedAlpha[p01] * w01 + guidedAlpha[p11] * w11,
        0,
        1,
      )
    }
  }

  return { rgb, alpha }
}

function makeImageData(
  ctx: CanvasContextLike,
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): ImageDataLike {
  if (typeof ctx.createImageData === 'function') {
    const imgData = ctx.createImageData(width, height)
    imgData.data.set(rgba)
    return imgData
  }
  if (typeof ImageData !== 'undefined') {
    const copy = new Uint8ClampedArray(rgba.length)
    copy.set(rgba)
    return new ImageData(copy, width, height)
  }
  return { width, height, data: rgba }
}

async function binarySearchJpegForTargetKb(
  canvas: CanvasLike,
  targetBytes: number,
): Promise<{ blob: Blob; quality: number; met: boolean }> {
  let low = TARGET_KB_MIN_QUALITY
  let high = TARGET_KB_MAX_QUALITY
  let bestUnder: { blob: Blob; quality: number } | null = null
  let smallest: { blob: Blob; quality: number } | null = null

  for (let i = 0; i < TARGET_KB_ITERATIONS; i += 1) {
    const mid = (low + high) / 2
    const blob = await canvasToBlob(canvas, 'image/jpeg', mid)
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

  const floorBlob = await canvasToBlob(canvas, 'image/jpeg', TARGET_KB_MIN_QUALITY)
  if (floorBlob.size <= targetBytes) {
    return { blob: floorBlob, quality: TARGET_KB_MIN_QUALITY, met: true }
  }
  if (!smallest || floorBlob.size <= smallest.blob.size) {
    return { blob: floorBlob, quality: TARGET_KB_MIN_QUALITY, met: false }
  }
  return { blob: smallest.blob, quality: smallest.quality, met: false }
}

/**
 * Render an anti-halo, color-decontaminated ID photo at exact pixel dimensions with optional
 * exam target-KB JPEG binary search (preserving exact widthPx x heightPx) and transparent foreground PNG export.
 */
export async function renderIdPhoto(
  options: RefineAndCompositeIdPhotoOptions,
): Promise<IdPhotoRenderResult> {
  const widthPx = Math.max(1, Math.round(options.widthPx))
  const heightPx = Math.max(1, Math.round(options.heightPx))
  const { matte } = options

  const cropParams = options.crop ?? {
    centerX: matte.framing.centerX,
    centerY: matte.framing.centerY,
    zoom: matte.framing.zoom,
  }
  const cropRect = computeIdPhotoCropSourceRect(matte.width, matte.height, widthPx, heightPx, cropParams)

  const sampled = sampleCroppedPortrait(matte, cropRect, widthPx, heightPx)
  let refinedAlpha = applyEdgeMorphShift(sampled.alpha, widthPx, heightPx, options.edgeShift ?? 0)
  refinedAlpha = applyAlphaFeather(refinedAlpha, widthPx, heightPx, options.edgeFeather ?? 0)

  const decontaminate = clampNumber(options.decontaminate ?? 0.88, 0, 1)
  const pixelCount = widthPx * heightPx
  const fgRgba = new Uint8ClampedArray(pixelCount * 4)

  for (let i = 0; i < pixelCount; i += 1) {
    const a = refinedAlpha[i]
    const rgbIdx = i * 3
    const [fr, fg, fb] = decontaminatePixelRgb(
      sampled.rgb[rgbIdx],
      sampled.rgb[rgbIdx + 1],
      sampled.rgb[rgbIdx + 2],
      a,
      matte.estimatedBgRgb,
      decontaminate,
    )
    const dst = i * 4
    fgRgba[dst] = Math.round(fr)
    fgRgba[dst + 1] = Math.round(fg)
    fgRgba[dst + 2] = Math.round(fb)
    fgRgba[dst + 3] = Math.round(clampNumber(a, 0, 1) * 255)
  }

  const outCanvas = createCanvas(widthPx, heightPx, options.createCanvas)
  const outCtx = get2dContext(outCanvas)
  fillBackground(outCtx, widthPx, heightPx, options.background, '#ffffff')

  if (typeof outCtx.getImageData === 'function' && typeof outCtx.putImageData === 'function') {
    const bgData = outCtx.getImageData(0, 0, widthPx, heightPx)
    const composed = new Uint8ClampedArray(bgData.data.length)
    for (let i = 0; i < pixelCount; i += 1) {
      const idx = i * 4
      const a = fgRgba[idx + 3] / 255
      const invA = 1 - a
      composed[idx] = Math.round(fgRgba[idx] * a + bgData.data[idx] * invA)
      composed[idx + 1] = Math.round(fgRgba[idx + 1] * a + bgData.data[idx + 1] * invA)
      composed[idx + 2] = Math.round(fgRgba[idx + 2] * a + bgData.data[idx + 2] * invA)
      composed[idx + 3] = 255
    }
    outCtx.putImageData(makeImageData(outCtx, widthPx, heightPx, composed), 0, 0)
  } else {
    const fgCanvas = createCanvas(widthPx, heightPx, options.createCanvas)
    const fgCtx = get2dContext(fgCanvas)
    if (typeof fgCtx.putImageData === 'function') {
      fgCtx.putImageData(makeImageData(fgCtx, widthPx, heightPx, fgRgba), 0, 0)
    }
    outCtx.drawImage(
      fgCanvas as unknown as CanvasImageSource,
      0,
      0,
      widthPx,
      heightPx,
      0,
      0,
      widthPx,
      heightPx,
    )
  }

  let foregroundPngBlob: Blob | undefined
  if (options.includeForegroundPng) {
    const fgOnlyCanvas = createCanvas(widthPx, heightPx, options.createCanvas)
    const fgOnlyCtx = get2dContext(fgOnlyCanvas)
    if (typeof fgOnlyCtx.putImageData === 'function') {
      fgOnlyCtx.putImageData(makeImageData(fgOnlyCtx, widthPx, heightPx, fgRgba), 0, 0)
    }
    foregroundPngBlob = await canvasToBlob(fgOnlyCanvas, 'image/png')
  }

  const targetBytes =
    options.targetSizeKb !== undefined && Number.isFinite(options.targetSizeKb) && options.targetSizeKb > 0
      ? Math.floor(options.targetSizeKb * 1024)
      : undefined

  let format: IdPhotoOutputFormat = options.format ?? 'image/jpeg'
  let blob: Blob
  let targetBytesMet: boolean | undefined
  let appliedQuality: number | undefined

  if (targetBytes !== undefined) {
    format = 'image/jpeg'
    const attempt = await binarySearchJpegForTargetKb(outCanvas, targetBytes)
    blob = attempt.blob
    targetBytesMet = attempt.met
    appliedQuality = Math.round(attempt.quality * 1000) / 1000
  } else {
    const quality = clampQuality(options.quality, 0.92)
    blob = await canvasToBlob(outCanvas, format, quality)
    appliedQuality = format === 'image/jpeg' ? quality : undefined
  }

  const stem = sanitizeFilenameStem(options.filenameStem ?? 'id-photo', 'id-photo')
  const filename = `${stem}.${extensionForFormat(format)}`

  return {
    blob,
    width: widthPx,
    height: heightPx,
    format,
    filename,
    outputBytes: blob.size,
    targetBytesMet,
    appliedQuality,
    foregroundPngBlob,
  }
}

/**
 * Render a multi-color ID photo pack (default White, Civil Blue, Official Red) from a single matte
 * and bundle all rendered files into one offline ZIP archive.
 */
export async function composeIdPhotoTrioZip(
  baseOptions: Omit<RefineAndCompositeIdPhotoOptions, 'background'>,
  colors: ReadonlyArray<{ name: string; hex: string }> = DEFAULT_TRIO_COLORS,
): Promise<{ zipBlob: Blob; items: IdPhotoRenderResult[] }> {
  const palette = colors.length > 0 ? colors : DEFAULT_TRIO_COLORS
  const baseStem = sanitizeFilenameStem(baseOptions.filenameStem ?? 'id-photo', 'id-photo')
  const items: IdPhotoRenderResult[] = []

  for (const color of palette) {
    const suffix = sanitizeFilenameStem(color.name, 'bg')
    const rendered = await renderIdPhoto({
      ...baseOptions,
      background: color.hex,
      filenameStem: `${baseStem}-${suffix}`,
    })
    items.push(rendered)
  }

  const zipBlob = await packBlobsToZip(
    items.map((item) => ({
      filename: item.filename,
      blob: item.blob,
    })),
  )

  return { zipBlob, items }
}
