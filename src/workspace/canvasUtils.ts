/**
 * [INPUT]: depends on nanoid, getMockupSvg from @/assets/mockups/registry, getPhoneSpec from @/assets/mockups/specs, BRAND from @/theme/brand, canEncodeCanvasFormat/decodeHeicToBlob/encodeWebpWithWasm/isHeicFile/readExifSummary from @/tools, QUICK_THEMES from @/utils/quickDesign, getQuickPreviewGeometry and makeSvgImageDataUrl from @/utils/quickPreview, trackFunnelEvent from @/utils/telemetry, applyRedactionsToCanvas from ./redact, demoAssets, and workspace types from ./types
 * [OUTPUT]: exports low-level canvas primitives, isSupportedImageFile, ReadImageInputOptions, readFileAsImageInput (with local HEIC decode and EXIF extraction), finalizeCanvasOutput (with lazy WASM WebP fallback before JPEG fallback), triggerBlobDownload, copyImageToClipboard, isClipboardImageSupported, formatBytes, renderMockupCanvasToPng (with redactions), and re-exports demoAssets helpers
 * [POS]: memory-safe browser image I/O, HEIC/EXIF preprocessing, clipboard export, and offscreen mockup PNG renderer for src/workspace
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import { getMockupSvg } from '@/assets/mockups/registry'
import { getPhoneSpec } from '@/assets/mockups/specs'
import { BRAND } from '@/theme/brand'
import {
  canEncodeCanvasFormat,
  decodeHeicToBlob,
  encodeWebpWithWasm,
  isHeicFile,
  readExifSummary,
  type DecodeHeicStage,
} from '@/tools'
import type { BrowserChromeOptions } from '@/types'
import {
  QUICK_THEMES,
  type QuickMockup,
  type QuickScreenshotFit,
  type QuickTheme,
} from '@/utils/quickDesign'
import { getQuickPreviewGeometry, makeSvgImageDataUrl } from '@/utils/quickPreview'
import { trackFunnelEvent } from '@/utils/telemetry'
import { applyRedactionsToCanvas } from './redact'
import type {
  WorkspaceBlobOutput,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceMergeFormat,
  WorkspaceRedactionRegion,
} from './types'

export { createDemoImageInput, createDemoScreenshotDataUrl, type DemoVariant } from './demoAssets'

const MAX_CANVAS_EDGE = 8192
const MAX_CANVAS_PIXELS = 67_108_864
const SUPPORTED_IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|avif|heic|heif|svg|gif)$/i

export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith('image/') || SUPPORTED_IMAGE_FILE_PATTERN.test(file.name)
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function extensionForMime(mime: WorkspaceMergeFormat): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg'
    case 'image/webp': return 'webp'
    case 'application/pdf': return 'pdf'
    case 'image/png': return 'png'
  }
}

export function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

export function clampDimensions(width: number, height: number): { width: number; height: number } {
  let w = Math.max(1, Math.min(Math.round(width), MAX_CANVAS_EDGE))
  let h = Math.max(1, Math.min(Math.round(height), MAX_CANVAS_EDGE))
  if (w * h > MAX_CANVAS_PIXELS) {
    const ratio = Math.sqrt(MAX_CANVAS_PIXELS / (w * h))
    w = Math.max(1, Math.floor(w * ratio))
    h = Math.max(1, Math.floor(h * ratio))
  }
  return { width: w, height: h }
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode image in browser canvas'))
    img.src = src
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob as data URL'))
      }
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}

function encodeHtmlCanvasOnce(
  canvas: HTMLCanvasElement,
  format: WorkspaceImageFormat,
  effectiveQuality: number | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error(`Canvas export failed for ${format}`))
      },
      format,
      effectiveQuality,
    )
  })
}

async function tryEncodeHtmlCanvasWebpWithWasm(
  canvas: HTMLCanvasElement,
  effectiveQuality: number | undefined,
): Promise<Blob | null> {
  if (canvas.width <= 0 || canvas.height <= 0) return null
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx || typeof ctx.getImageData !== 'function') return null
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const blob = await encodeWebpWithWasm(imageData, { quality: effectiveQuality })
    return blob.size > 0 && blob.type === 'image/webp' ? blob : null
  } catch {
    return null
  }
}

async function encodeHtmlCanvasJpegFallback(
  canvas: HTMLCanvasElement,
  effectiveQuality: number | undefined,
): Promise<Blob> {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const flat = document.createElement('canvas')
      flat.width = canvas.width
      flat.height = canvas.height
      const flatCtx = flat.getContext('2d')
      if (flatCtx) {
        flatCtx.fillStyle = '#ffffff'
        flatCtx.fillRect(0, 0, flat.width, flat.height)
        flatCtx.drawImage(canvas, 0, 0)
        return encodeHtmlCanvasOnce(flat, 'image/jpeg', effectiveQuality)
      }
    } catch {
      // Fall through to encoding the original canvas directly.
    }
  }
  return encodeHtmlCanvasOnce(canvas, 'image/jpeg', effectiveQuality)
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: WorkspaceImageFormat,
  quality: number,
): Promise<Blob> {
  const effectiveQuality = format === 'image/png' ? undefined : Math.max(0.05, Math.min(1, quality))
  if (format === 'image/webp') {
    if (!canEncodeCanvasFormat('image/webp')) {
      const wasmBlob = await tryEncodeHtmlCanvasWebpWithWasm(canvas, effectiveQuality)
      if (wasmBlob) return wasmBlob
      return encodeHtmlCanvasJpegFallback(canvas, effectiveQuality)
    }
    const blob = await encodeHtmlCanvasOnce(canvas, format, effectiveQuality)
    if (blob.type !== 'image/png') {
      return blob
    }
    const wasmBlob = await tryEncodeHtmlCanvasWebpWithWasm(canvas, effectiveQuality)
    if (wasmBlob) return wasmBlob
    return encodeHtmlCanvasJpegFallback(canvas, effectiveQuality)
  }
  return encodeHtmlCanvasOnce(canvas, format, effectiveQuality)
}

export async function finalizeCanvasOutput(
  canvas: HTMLCanvasElement,
  filename: string,
  format: WorkspaceImageFormat,
  quality: number,
): Promise<WorkspaceBlobOutput> {
  const blob = await canvasToBlob(canvas, format, quality)
  const actualFormat: WorkspaceImageFormat =
    blob.type === 'image/jpeg' || blob.type === 'image/webp' || blob.type === 'image/png'
      ? blob.type
      : format
  const resolvedFilename =
    actualFormat !== format
      ? `${stripExtension(filename) || 'image'}.${extensionForMime(actualFormat)}`
      : filename
  const dataUrl = await blobToDataUrl(blob)
  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    filename: resolvedFilename,
    sizeBytes: blob.size,
    mimeType: actualFormat,
  }
}

export function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string,
): void {
  if (background === 'transparent') {
    ctx.clearRect(0, 0, width, height)
    return
  }
  if (background.startsWith('linear-gradient(')) {
    const colors = background.match(/#[0-9a-fA-F]{3,8}/g) ?? [BRAND.panel, BRAND.accentStrong]
    const grad = ctx.createLinearGradient(0, 0, width, height)
    colors.forEach((c, idx) => {
      grad.addColorStop(colors.length === 1 ? 0 : idx / (colors.length - 1), c)
    })
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    return
  }
  ctx.fillStyle = background || '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  fit: 'cover' | 'contain' | 'fill',
): void {
  const sw = ('naturalWidth' in img ? img.naturalWidth : 0) || img.width || 1
  const sh = ('naturalHeight' in img ? img.naturalHeight : 0) || img.height || 1
  if (fit === 'fill') {
    ctx.drawImage(img, dx, dy, dw, dh)
    return
  }
  const srcRatio = sw / sh
  const dstRatio = dw / dh
  if (fit === 'cover') {
    let sx = 0
    let sy = 0
    let cropW = sw
    let cropH = sh
    if (srcRatio > dstRatio) {
      cropW = sh * dstRatio
      sx = (sw - cropW) / 2
    } else {
      cropH = sw / dstRatio
      sy = (sh - cropH) / 2
    }
    ctx.drawImage(img, sx, sy, cropW, cropH, dx, dy, dw, dh)
    return
  }
  let rw = dw
  let rh = dh
  if (srcRatio > dstRatio) {
    rh = dw / srcRatio
  } else {
    rw = dh * srcRatio
  }
  ctx.drawImage(img, dx + (dw - rw) / 2, dy + (dh - rh) / 2, rw, rh)
}

export interface ReadImageInputOptions {
  onHeicStage?: (stage: DecodeHeicStage) => void
}

function inferImageExtension(name: string, mimeType: string): string {
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx > 0 && dotIdx < name.length - 1) {
    return name.slice(dotIdx + 1).toLowerCase().slice(0, 12)
  }
  const slashIdx = mimeType.indexOf('/')
  if (slashIdx >= 0 && slashIdx < mimeType.length - 1) {
    return mimeType.slice(slashIdx + 1).toLowerCase().replace(/\+.*$/, '').slice(0, 12)
  }
  return 'unknown'
}

export async function readFileAsImageInput(
  file: File | Blob,
  fallbackName = 'image.png',
  options?: ReadImageInputOptions,
): Promise<WorkspaceImageInput> {
  const name = file instanceof File && file.name ? file.name : fallbackName
  // Inspect binary EXIF headers before any HEIC or canvas re-encoding strips them.
  const exif = await readExifSummary(file)
  const heicSource = isHeicFile({ name, type: file.type })
  const workingBlob = heicSource
    ? await decodeHeicToBlob(file, {
        outputType: 'image/jpeg',
        quality: 0.92,
        onStage: options?.onHeicStage,
      })
    : file

  const objectUrl = URL.createObjectURL(workingBlob)
  try {
    const img = await loadHtmlImage(objectUrl)
    const dataUrl = await blobToDataUrl(workingBlob)
    const ext = inferImageExtension(name, file.type)
    const originalSizeBytes = file.size > 0 ? file.size : workingBlob.size
    const decodedFile =
      heicSource && typeof File !== 'undefined'
        ? new File([workingBlob], `${stripExtension(name) || 'photo'}.jpg`, {
            type: workingBlob.type || 'image/jpeg',
          })
        : file instanceof File
          ? file
          : undefined
    trackFunnelEvent('image_loaded', { ext })
    return {
      id: nanoid(10),
      name,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      dataUrl,
      sizeBytes: originalSizeBytes,
      mimeType: workingBlob.type || file.type || 'image/png',
      exif,
      ...(decodedFile ? { file: decodedFile } : {}),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1500)
}

export function isClipboardImageSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  )
}

/**
 * Copy a rendered image result to the system clipboard as image/png.
 * Re-encodes non-PNG outputs (JPEG, WebP, or PDF preview dataUrl) onto an offscreen canvas.
 */
export async function copyImageToClipboard(blob: Blob, previewDataUrl?: string): Promise<void> {
  if (!isClipboardImageSupported()) {
    throw new Error('Clipboard image copy is not supported in this browser.')
  }

  let pngBlob: Blob
  if (blob.type === 'image/png') {
    pngBlob = blob
  } else {
    const objectUrl = !previewDataUrl && typeof URL !== 'undefined' ? URL.createObjectURL(blob) : null
    try {
      const src = previewDataUrl ?? objectUrl
      if (!src) throw new Error('No raster image source available for clipboard copy.')
      const img = await loadHtmlImage(src)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, img.naturalWidth || img.width)
      canvas.height = Math.max(1, img.naturalHeight || img.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D canvas context unavailable')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      pngBlob = await canvasToBlob(canvas, 'image/png', 1)
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }

  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
}

export interface MockupRenderParams {
  width: number
  height: number
  theme: QuickTheme
  mockup: QuickMockup
  screenshotSrc?: string
  screenshotFit: QuickScreenshotFit
  scaleFactor?: number
  browserChrome?: BrowserChromeOptions
  redactions?: WorkspaceRedactionRegion[]
}

export async function renderMockupCanvasToPng(params: MockupRenderParams): Promise<WorkspaceBlobOutput> {
  const { width, height } = clampDimensions(params.width, params.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  const palette = QUICK_THEMES[params.theme]
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, palette.top)
  bgGrad.addColorStop(1, palette.bottom)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  const glowRadius = Math.max(width * 0.46, height * 0.48)
  const glowGrad = ctx.createRadialGradient(
    width * 0.6,
    height * 0.38,
    0,
    width * 0.6,
    height * 0.38,
    glowRadius,
  )
  glowGrad.addColorStop(0, palette.glow)
  glowGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  const baseGeom = getQuickPreviewGeometry(params.mockup, width, height)
  const spec = getPhoneSpec(params.mockup)
  const scaleFactor = Math.max(0.65, Math.min(1.15, params.scaleFactor ?? 1))
  const scale = baseGeom.scale * scaleFactor
  const frameW = spec.frameWidth * scale
  const frameH = spec.frameHeight * scale
  const frameX = (width - frameW) / 2
  const frameY = (height - frameH) / 2

  ctx.save()
  ctx.translate(frameX, frameY)
  ctx.scale(scale, scale)

  ctx.save()
  ctx.shadowColor = params.theme === 'midnight' ? 'rgba(15,18,36,0.52)' : 'rgba(19,21,38,0.24)'
  ctx.shadowBlur = 44
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 22
  drawRoundedRectPath(
    ctx,
    spec.screen.x,
    spec.screen.y,
    spec.screen.width,
    spec.screen.height,
    spec.screen.cornerRadius,
  )
  ctx.fillStyle = '#151923'
  ctx.fill()
  ctx.restore()

  ctx.save()
  drawRoundedRectPath(
    ctx,
    spec.screen.x,
    spec.screen.y,
    spec.screen.width,
    spec.screen.height,
    spec.screen.cornerRadius,
  )
  ctx.clip()
  ctx.fillStyle = '#151923'
  ctx.fillRect(spec.screen.x, spec.screen.y, spec.screen.width, spec.screen.height)

  if (params.screenshotSrc) {
    const shotImg = await loadHtmlImage(params.screenshotSrc)
    let drawable: HTMLImageElement | HTMLCanvasElement = shotImg
    if (params.redactions && params.redactions.length > 0) {
      const shotDims = clampDimensions(shotImg.naturalWidth || shotImg.width, shotImg.naturalHeight || shotImg.height)
      const redactedCanvas = document.createElement('canvas')
      redactedCanvas.width = shotDims.width
      redactedCanvas.height = shotDims.height
      const redactedCtx = redactedCanvas.getContext('2d')
      if (redactedCtx) {
        applyRedactionsToCanvas(redactedCtx, shotImg, shotDims.width, shotDims.height, params.redactions)
        drawable = redactedCanvas
      }
    }
    drawFittedImage(
      ctx,
      drawable,
      spec.screen.x,
      spec.screen.y,
      spec.screen.width,
      spec.screen.height,
      params.screenshotFit,
    )
  }
  ctx.restore()

  const frameSvgUrl = makeSvgImageDataUrl(getMockupSvg(params.mockup, params.browserChrome))
  const frameImg = await loadHtmlImage(frameSvgUrl)
  ctx.drawImage(frameImg, 0, 0, spec.frameWidth, spec.frameHeight)
  ctx.restore()

  return finalizeCanvasOutput(canvas, `moklu-${params.mockup}-${width}x${height}.png`, 'image/png', 1)
}
