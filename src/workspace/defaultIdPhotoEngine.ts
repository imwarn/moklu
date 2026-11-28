/**
 * [INPUT]: depends on dynamic jszip import, createSinglePagePdfFromJpeg from @/tools, canvas helpers from ./canvasUtils, and ID photo types from ./types
 * [OUTPUT]: exports idPhotoMatteFallback, idPhotoRenderFallback, idPhotoTrioZipFallback, and idPhotoSheetFallback providing zero-ONNX pure-Canvas ID photo processing for standalone QuickWorkspace and unit tests
 * [POS]: standalone DIP fallback helper paired with src/workspace/defaultEngines.ts; executes without onnxruntime-web or network requests
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createSinglePagePdfFromJpeg } from '@/tools'
import {
  clampDimensions,
  extensionForMime,
  fillBackground,
  finalizeCanvasOutput,
  loadHtmlImage,
  stripExtension,
} from './canvasUtils'
import type {
  WorkspaceIdPhotoMatteHandle,
  WorkspaceIdPhotoMatteOptions,
  WorkspaceIdPhotoRenderOptions,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceIdPhotoSheetOptions,
  WorkspaceIdPhotoSheetOutput,
  WorkspaceIdPhotoTrioResult,
  WorkspaceImageInput,
} from './types'

interface FallbackMattePayload {
  dataUrl: string
  name: string
}

const DEFAULT_TRIO_COLORS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'white', hex: '#FFFFFF' },
  { name: 'blue', hex: '#438EDB' },
  { name: 'red', hex: '#D92B2B' },
]

function createCanvas2d(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

function computeCropRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  crop?: { centerX: number; centerY: number; zoom: number },
): { sx: number; sy: number; sw: number; sh: number } {
  const zoom = Math.max(0.5, Math.min(3, crop?.zoom ?? 1))
  const dstRatio = dstW / Math.max(1, dstH)
  const srcRatio = srcW / Math.max(1, srcH)
  const baseW = srcRatio > dstRatio ? srcH * dstRatio : srcW
  const baseH = srcRatio > dstRatio ? srcH : srcW / dstRatio
  const sw = Math.min(srcW, Math.max(1, baseW / zoom))
  const sh = Math.min(srcH, Math.max(1, baseH / zoom))
  const cx = Math.max(0, Math.min(1, crop?.centerX ?? 0.5)) * srcW
  const cy = Math.max(0, Math.min(1, crop?.centerY ?? 0.44)) * srcH
  const sx = Math.max(0, Math.min(srcW - sw, cx - sw / 2))
  const sy = Math.max(0, Math.min(srcH - sh, cy - sh / 2))
  return { sx, sy, sw, sh }
}

/**
 * Simple border-keyed foreground extraction for standalone fallback previews so
 * solid-backdrop portraits (including the built-in demo portrait) visibly swap colors.
 */
function buildFallbackForegroundCanvas(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas2d(width, height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
  if (typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') {
    return canvas
  }
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const bgR = data[0]
  const bgG = data[1]
  const bgB = data[2]
  const total = width * height
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const isBg = (idx: number): boolean => {
    const off = idx * 4
    const dr = data[off] - bgR
    const dg = data[off + 1] - bgG
    const db = data[off + 2] - bgB
    return dr * dr + dg * dg + db * db < 1600
  }

  const enqueue = (idx: number) => {
    if (visited[idx] || !isBg(idx)) return
    visited[idx] = 1
    queue[tail++] = idx
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width)
    enqueue(y * width + (width - 1))
  }

  while (head < tail) {
    const idx = queue[head++]
    data[idx * 4 + 3] = 0
    const x = idx % width
    const y = (idx - x) / width
    if (x > 0) enqueue(idx - 1)
    if (x + 1 < width) enqueue(idx + 1)
    if (y > 0) enqueue(idx - width)
    if (y + 1 < height) enqueue(idx + width)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export async function idPhotoMatteFallback(
  image: WorkspaceImageInput,
  options?: WorkspaceIdPhotoMatteOptions,
): Promise<WorkspaceIdPhotoMatteHandle> {
  options?.onProgress?.('refining', 1)
  return {
    width: Math.max(1, image.width),
    height: Math.max(1, image.height),
    modeUsed: options?.mode ?? 'pure-backdrop',
    framing: {
      centerX: 0.5,
      centerY: 0.44,
      zoom: 1,
      headTopRatio: 0.1,
      headHeightRatio: 0.58,
    },
    _payload: {
      dataUrl: image.dataUrl,
      name: image.name,
    } satisfies FallbackMattePayload,
  }
}

export async function idPhotoRenderFallback(
  matte: WorkspaceIdPhotoMatteHandle,
  options: WorkspaceIdPhotoRenderOptions,
): Promise<WorkspaceIdPhotoRenderOutput> {
  const payload = matte._payload as FallbackMattePayload
  const img = await loadHtmlImage(payload.dataUrl)
  const srcW = img.naturalWidth || img.width || matte.width
  const srcH = img.naturalHeight || img.height || matte.height
  const clamped = clampDimensions(options.widthPx, options.heightPx)
  const crop = computeCropRect(srcW, srcH, clamped.width, clamped.height, options.crop)
  const fgCanvas = buildFallbackForegroundCanvas(img, crop.sx, crop.sy, crop.sw, crop.sh, clamped.width, clamped.height)

  const { canvas, ctx } = createCanvas2d(clamped.width, clamped.height)
  fillBackground(ctx, clamped.width, clamped.height, options.background)
  ctx.drawImage(fgCanvas, 0, 0)

  const format = options.targetSizeKb && options.targetSizeKb > 0 ? 'image/jpeg' : (options.format ?? 'image/jpeg')
  const ext = extensionForMime(format)
  const stem = options.filenameStem || stripExtension(payload.name) || 'id-photo'
  const filename = `${stem}-${clamped.width}x${clamped.height}.${ext}`

  let out = await finalizeCanvasOutput(canvas, filename, format, options.quality ?? 0.92)
  let targetBytesMet: boolean | undefined
  let appliedQuality: number | undefined = format === 'image/jpeg' ? (options.quality ?? 0.92) : undefined

  if (options.targetSizeKb && options.targetSizeKb > 0 && format === 'image/jpeg') {
    const targetBytes = Math.round(options.targetSizeKb * 1024)
    let lo = 0.12
    let hi = 0.96
    let best = out
    let bestQ = appliedQuality ?? 0.92
    let met = out.sizeBytes <= targetBytes
    for (let i = 0; i < 7; i += 1) {
      const mid = (lo + hi) / 2
      const candidate = await finalizeCanvasOutput(canvas, filename, 'image/jpeg', mid)
      if (candidate.sizeBytes <= targetBytes) {
        best = candidate
        bestQ = mid
        met = true
        lo = mid
      } else {
        if (!met && candidate.sizeBytes < best.sizeBytes) {
          best = candidate
          bestQ = mid
        }
        hi = mid
      }
    }
    out = best
    targetBytesMet = met
    appliedQuality = Math.round(bestQ * 1000) / 1000
  }

  let foregroundDataUrl: string | undefined
  if (options.includeForegroundPng) {
    const fgOut = await finalizeCanvasOutput(fgCanvas, `${stem}-cutout.png`, 'image/png', 1)
    foregroundDataUrl = fgOut.dataUrl
  }

  return {
    ...out,
    ...(targetBytesMet !== undefined ? { targetBytesMet } : {}),
    ...(appliedQuality !== undefined ? { appliedQuality } : {}),
    ...(foregroundDataUrl ? { foregroundDataUrl } : {}),
  }
}

export async function idPhotoTrioZipFallback(
  matte: WorkspaceIdPhotoMatteHandle,
  options: Omit<WorkspaceIdPhotoRenderOptions, 'background'>,
  colors: ReadonlyArray<{ name: string; hex: string }> = DEFAULT_TRIO_COLORS,
): Promise<WorkspaceIdPhotoTrioResult> {
  const items: WorkspaceIdPhotoRenderOutput[] = []
  const stem = options.filenameStem || 'id-photo'
  for (const color of colors) {
    items.push(
      await idPhotoRenderFallback(matte, {
        ...options,
        background: color.hex,
        filenameStem: `${stem}-${color.name}`,
      }),
    )
  }
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const item of items) {
    zip.file(item.filename, new Uint8Array(await item.blob.arrayBuffer()))
  }
  const archive = await zip.generateAsync({ type: 'uint8array' })
  return {
    zipBlob: new Blob([new Uint8Array(archive)], { type: 'application/zip' }),
    items,
  }
}

export async function idPhotoSheetFallback(
  options: WorkspaceIdPhotoSheetOptions,
): Promise<WorkspaceIdPhotoSheetOutput> {
  const photo = await loadHtmlImage(options.photoDataUrl)
  const pw = Math.max(1, Math.round(options.photoWidthPx))
  const ph = Math.max(1, Math.round(options.photoHeightPx))
  const margin = options.paper === 'a4' ? 90 : 48
  const gap = options.paper === 'a4' ? 36 : 28

  const candidates =
    options.paper === 'a4'
      ? [{ w: 2480, h: 3508 }]
      : [
          { w: 1800, h: 1200 },
          { w: 1200, h: 1800 },
        ]

  let best = { w: candidates[0].w, h: candidates[0].h, cols: 1, rows: 1, count: 1 }
  for (const c of candidates) {
    const cols = Math.max(1, Math.floor((c.w - margin * 2 + gap) / (pw + gap)))
    const rows = Math.max(1, Math.floor((c.h - margin * 2 + gap) / (ph + gap)))
    const count = cols * rows
    if (count > best.count) {
      best = { w: c.w, h: c.h, cols, rows, count }
    }
  }

  const { canvas, ctx } = createCanvas2d(best.w, best.h)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, best.w, best.h)

  const gridW = best.cols * pw + (best.cols - 1) * gap
  const gridH = best.rows * ph + (best.rows - 1) * gap
  const startX = Math.round((best.w - gridW) / 2)
  const startY = Math.round((best.h - gridH) / 2)
  const drawMarks = options.cropMarks !== false

  for (let r = 0; r < best.rows; r += 1) {
    for (let c = 0; c < best.cols; c += 1) {
      const x = startX + c * (pw + gap)
      const y = startY + r * (ph + gap)
      ctx.drawImage(photo, x, y, pw, ph)
      if (drawMarks) {
        ctx.save()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5
        const tick = 10
        const pad = 4
        ctx.beginPath()
        ctx.moveTo(x - pad - tick, y)
        ctx.lineTo(x - pad, y)
        ctx.moveTo(x, y - pad - tick)
        ctx.lineTo(x, y - pad)
        ctx.moveTo(x + pw + pad, y)
        ctx.lineTo(x + pw + pad + tick, y)
        ctx.moveTo(x + pw, y - pad - tick)
        ctx.lineTo(x + pw, y - pad)
        ctx.moveTo(x - pad - tick, y + ph)
        ctx.lineTo(x - pad, y + ph)
        ctx.moveTo(x, y + ph + pad)
        ctx.lineTo(x, y + ph + pad + tick)
        ctx.moveTo(x + pw + pad, y + ph)
        ctx.lineTo(x + pw + pad + tick, y + ph)
        ctx.moveTo(x + pw, y + ph + pad)
        ctx.lineTo(x + pw, y + ph + pad + tick)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  const stem = options.filenameStem || 'moklu-id-photo-sheet'
  if (options.format === 'application/pdf') {
    const jpegOut = await finalizeCanvasOutput(canvas, `${stem}.jpg`, 'image/jpeg', 0.94)
    const pdfBlob = createSinglePagePdfFromJpeg(new Uint8Array(await jpegOut.blob.arrayBuffer()), best.w, best.h)
    return {
      blob: pdfBlob,
      dataUrl: jpegOut.dataUrl,
      width: best.w,
      height: best.h,
      filename: `${stem}-${options.paper}.pdf`,
      sizeBytes: pdfBlob.size,
      mimeType: 'application/pdf',
      count: best.count,
      columns: best.cols,
      rows: best.rows,
    }
  }

  const pngOut = await finalizeCanvasOutput(canvas, `${stem}-${options.paper}.png`, 'image/png', 1)
  return {
    ...pngOut,
    count: best.count,
    columns: best.cols,
    rows: best.rows,
  }
}
