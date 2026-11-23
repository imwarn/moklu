/**
 * [INPUT]: depends on jszip for ZIP archiving and shared canvas/image types from ./types
 * [OUTPUT]: exports canvas creation, safe clamping, image loading/disposal, rounded-rect clipping, background fill, object-fit math, canvas-to-Blob, byte formatting, and ZIP packing helpers
 * [POS]: shared low-level canvas & binary utility module of src/tools; consumed by all five image processing engines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type {
  BackgroundFill,
  CanvasContextLike,
  CanvasFactory,
  CanvasLike,
  ClampedDimensions,
  ImageFormat,
  ImageInputSource,
  LoadedImageItem,
  ObjectFitMode,
  Rect,
  ZipFileEntry,
} from './types'

export const MAX_CANVAS_DIMENSION = 8192
export const MAX_CANVAS_PIXELS = 64_000_000

const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

let loadedItemCounter = 0

// ============================================================================
// Pure Numeric & Naming Helpers
// ============================================================================

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function clampQuality(quality?: number, fallback = 0.92): number {
  return clampNumber(quality ?? fallback, 0.05, 1)
}

/**
 * Clamp target canvas dimensions uniformly so neither side exceeds maxDimension
 * (default 8192px) and total area never exceeds maxPixels (default 64MP).
 */
export function clampCanvasDimensions(
  width: number,
  height: number,
  maxDimension = MAX_CANVAS_DIMENSION,
  maxPixels = MAX_CANVAS_PIXELS,
): ClampedDimensions {
  const safeW = Math.max(1, Number.isFinite(width) ? width : 1)
  const safeH = Math.max(1, Number.isFinite(height) ? height : 1)
  const dimLimit = clampNumber(maxDimension, 1, MAX_CANVAS_DIMENSION)
  const pixelLimit = clampNumber(maxPixels, 1, MAX_CANVAS_PIXELS)

  let scale = 1
  if (safeW > dimLimit || safeH > dimLimit) {
    scale = Math.min(scale, dimLimit / safeW, dimLimit / safeH)
  }

  const scaledArea = safeW * scale * (safeH * scale)
  if (scaledArea > pixelLimit) {
    scale *= Math.sqrt(pixelLimit / scaledArea)
  }

  const outW = Math.max(1, Math.floor(safeW * scale))
  const outH = Math.max(1, Math.floor(safeH * scale))
  const clamped = outW < Math.round(safeW) || outH < Math.round(safeH)

  return {
    width: outW,
    height: outH,
    scaleFactor: scale,
    clamped,
  }
}

export function extensionForFormat(format: ImageFormat): string {
  return FORMAT_EXTENSIONS[format]
}

export function sanitizeFilenameStem(name: string, fallback = 'image'): string {
  const stripped = name.replace(/\.[^./\\]+$/, '')
  const cleaned = stripped
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
  return cleaned || fallback
}

export function replaceFileExtension(filename: string, format: ImageFormat, fallback = 'image'): string {
  const stem = sanitizeFilenameStem(filename, fallback)
  return `${stem}.${extensionForFormat(format)}`
}

export function formatBytes(bytes: number): string {
  const safe = Math.max(0, Number.isFinite(bytes) ? bytes : 0)
  if (safe < 1024) return `${Math.round(safe)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = safe / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

/**
 * Compute source and destination rects for drawing an image into a box
 * using either 'cover' (center-cropped full bleed) or 'contain' (letterboxed).
 */
export function computeObjectFitRects(
  sourceWidth: number,
  sourceHeight: number,
  targetBox: Rect,
  fit: ObjectFitMode,
): { sourceRect: Rect; destRect: Rect } {
  const srcW = Math.max(1, sourceWidth)
  const srcH = Math.max(1, sourceHeight)
  const boxW = Math.max(1, targetBox.width)
  const boxH = Math.max(1, targetBox.height)

  const srcAspect = srcW / srcH
  const boxAspect = boxW / boxH

  if (fit === 'cover') {
    if (srcAspect > boxAspect) {
      const cropW = srcH * boxAspect
      return {
        sourceRect: { x: (srcW - cropW) / 2, y: 0, width: cropW, height: srcH },
        destRect: { ...targetBox },
      }
    }
    const cropH = srcW / boxAspect
    return {
      sourceRect: { x: 0, y: (srcH - cropH) / 2, width: srcW, height: cropH },
      destRect: { ...targetBox },
    }
  }

  // contain
  if (srcAspect > boxAspect) {
    const drawH = boxW / srcAspect
    return {
      sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
      destRect: {
        x: targetBox.x,
        y: targetBox.y + (boxH - drawH) / 2,
        width: boxW,
        height: drawH,
      },
    }
  }

  const drawW = boxH * srcAspect
  return {
    sourceRect: { x: 0, y: 0, width: srcW, height: srcH },
    destRect: {
      x: targetBox.x + (boxW - drawW) / 2,
      y: targetBox.y,
      width: drawW,
      height: boxH,
    },
  }
}

// ============================================================================
// Canvas Creation & Drawing Primitives
// ============================================================================

export function createCanvas(
  width: number,
  height: number,
  customFactory?: CanvasFactory,
): CanvasLike {
  const clamped = clampCanvasDimensions(width, height)
  if (customFactory) {
    return customFactory(clamped.width, clamped.height)
  }

  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas')
    canvas.width = clamped.width
    canvas.height = clamped.height
    return canvas as unknown as CanvasLike
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(clamped.width, clamped.height) as unknown as CanvasLike
  }

  throw new Error('Canvas 2D API is unavailable in this runtime; supply options.createCanvas.')
}

export function get2dContext(canvas: CanvasLike): CanvasContextLike {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas rendering context.')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

/**
 * Trace a rounded rectangle path onto ctx without relying on newer roundRect().
 */
export function traceRoundedRectPath(
  ctx: CanvasContextLike,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  if (r <= 0) {
    ctx.rect(x, y, width, height)
    ctx.closePath()
    return
  }

  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.arcTo(x + width, y, x + width, y + r, r)
  ctx.lineTo(x + width, y + height - r)
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
  ctx.lineTo(x + r, y + height)
  ctx.arcTo(x, y + height, x, y + height - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export function clipRoundedRect(
  ctx: CanvasContextLike,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  traceRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.clip()
}

/**
 * Fill a canvas area with a solid color or CSS-angle linear gradient.
 * Skips fill when background is 'transparent' unless forceOpaqueFallback is set (e.g. JPEG).
 */
export function fillBackground(
  ctx: CanvasContextLike,
  width: number,
  height: number,
  background?: BackgroundFill,
  forceOpaqueFallback?: string,
): void {
  const resolved = background ?? forceOpaqueFallback
  if (!resolved) return

  if (typeof resolved === 'string') {
    if (resolved.trim().toLowerCase() === 'transparent') {
      if (forceOpaqueFallback) {
        ctx.fillStyle = forceOpaqueFallback
        ctx.fillRect(0, 0, width, height)
      }
      return
    }
    ctx.fillStyle = resolved
    ctx.fillRect(0, 0, width, height)
    return
  }

  if (resolved.stops.length === 0) {
    if (forceOpaqueFallback) {
      ctx.fillStyle = forceOpaqueFallback
      ctx.fillRect(0, 0, width, height)
    }
    return
  }

  const angleDeg = resolved.angle ?? 135
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  const halfLen = (Math.abs(width * Math.cos(angleRad)) + Math.abs(height * Math.sin(angleRad))) / 2
  const cx = width / 2
  const cy = height / 2
  const dx = Math.cos(angleRad) * halfLen
  const dy = Math.sin(angleRad) * halfLen

  const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
  const sortedStops = [...resolved.stops].sort((a, b) => a.offset - b.offset)
  for (const stop of sortedStops) {
    gradient.addColorStop(clampNumber(stop.offset, 0, 1), stop.color)
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// ============================================================================
// Pure Offline Data URL & Blob Conversion
// ============================================================================

export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx < 0) {
    throw new Error('Invalid data URL format.')
  }
  const header = dataUrl.slice(0, commaIdx)
  const payload = dataUrl.slice(commaIdx + 1)
  const mimeMatch = /^data:([^;,]+)/i.exec(header)
  const mimeType = mimeMatch?.[1] || 'application/octet-stream'

  if (/;base64$/i.test(header)) {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  const decoded = decodeURIComponent(payload)
  return new Blob([decoded], { type: mimeType })
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx < 0) return 0
  const header = dataUrl.slice(0, commaIdx)
  const payload = dataUrl.slice(commaIdx + 1)
  if (/;base64$/i.test(header)) {
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
    return Math.max(0, Math.floor((payload.length * 3) / 4) - padding)
  }
  return new TextEncoder().encode(decodeURIComponent(payload)).byteLength
}

export async function canvasToBlob(
  canvas: CanvasLike,
  format: ImageFormat = 'image/png',
  quality?: number,
): Promise<Blob> {
  const effectiveQuality = format === 'image/png' ? undefined : clampQuality(quality)

  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: format, quality: effectiveQuality })
  }

  if (typeof canvas.toBlob === 'function') {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob!(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error(`Canvas failed to encode ${format} blob.`))
          }
        },
        format,
        effectiveQuality,
      )
    })
  }

  if (typeof canvas.toDataURL === 'function') {
    const dataUrl = canvas.toDataURL(format, effectiveQuality)
    return dataUrlToBlob(dataUrl)
  }

  throw new Error('Canvas implementation provides neither convertToBlob, toBlob, nor toDataURL.')
}

// ============================================================================
// Client-Side Image Loading (Zero External Network Requests)
// ============================================================================

function assertOfflineSafeImageUrl(url: string): void {
  if (/^(data:|blob:)/i.test(url)) return
  if (url.startsWith('/')) return
  if (/^https?:\/\//i.test(url)) {
    if (typeof location !== 'undefined') {
      const parsed = new URL(url)
      if (parsed.origin === location.origin) return
    }
    throw new Error('Remote cross-origin image URLs are blocked to guarantee 100% offline local processing.')
  }
}

export async function loadImageItem(
  input: ImageInputSource,
  options?: { name?: string },
): Promise<LoadedImageItem> {
  if (typeof Image === 'undefined') {
    throw new Error('Browser Image constructor is unavailable in this runtime.')
  }

  let src: string
  let objectUrl: string | undefined
  let name = options?.name ?? ''
  let originalBytes = 0
  let mimeType = 'image/png'

  if (typeof input === 'string') {
    assertOfflineSafeImageUrl(input)
    src = input
    if (input.startsWith('data:')) {
      const mimeMatch = /^data:([^;,]+)/i.exec(input)
      mimeType = mimeMatch?.[1] || 'image/png'
      originalBytes = estimateDataUrlBytes(input)
    }
    if (!name) name = 'image.png'
  } else {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('URL.createObjectURL is unavailable in this runtime.')
    }
    objectUrl = URL.createObjectURL(input)
    src = objectUrl
    originalBytes = input.size
    mimeType = input.type || 'image/png'
    if (!name) {
      name = input instanceof File && input.name ? input.name : 'image.png'
    }
  }

  let disposed = false
  const dispose = (): void => {
    if (disposed) return
    disposed = true
    if (objectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl)
    }
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.decoding = 'async'
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error(`Failed to decode image "${name}".`))
      element.src = src
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (width <= 0 || height <= 0) {
      throw new Error(`Decoded image "${name}" has invalid dimensions (${width}x${height}).`)
    }

    loadedItemCounter += 1
    return {
      id: `img-${loadedItemCounter}`,
      name,
      width,
      height,
      source: img,
      originalBytes,
      mimeType,
      objectUrl,
      dispose,
    }
  } catch (err) {
    dispose()
    throw err
  }
}

export async function loadImageItems(inputs: ImageInputSource[]): Promise<LoadedImageItem[]> {
  const loaded: LoadedImageItem[] = []
  try {
    for (const input of inputs) {
      loaded.push(await loadImageItem(input))
    }
    return loaded
  } catch (err) {
    for (const item of loaded) {
      item.dispose()
    }
    throw err
  }
}

export function disposeImageItems(items: ReadonlyArray<Pick<LoadedImageItem, 'dispose'>>): void {
  for (const item of items) {
    item.dispose()
  }
}

// ============================================================================
// ZIP Packaging via JSZip
// ============================================================================

function sanitizeZipPath(rawFilename: string, fallbackIndex: number): string {
  const segments = rawFilename
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg.length > 0 && seg !== '.' && seg !== '..')
    .map((seg) => seg.replace(/[<>:"|?*]/g, '-'))
  if (segments.length === 0) {
    return `file-${fallbackIndex + 1}.bin`
  }
  return segments.join('/')
}

function deduplicateZipPath(path: string, seen: Set<string>): string {
  if (!seen.has(path)) {
    seen.add(path)
    return path
  }
  const dotIdx = path.lastIndexOf('.')
  const slashIdx = path.lastIndexOf('/')
  const hasExt = dotIdx > slashIdx
  const base = hasExt ? path.slice(0, dotIdx) : path
  const ext = hasExt ? path.slice(dotIdx) : ''
  let counter = 2
  let candidate = `${base}-${counter}${ext}`
  while (seen.has(candidate)) {
    counter += 1
    candidate = `${base}-${counter}${ext}`
  }
  seen.add(candidate)
  return candidate
}

/**
 * Pack named Blob or Uint8Array files into a standard client-side ZIP Blob using JSZip.
 * Converts Blobs to ArrayBuffer so JSZip works identically in browsers and Node/Vitest.
 */
export async function packBlobsToZip(files: ZipFileEntry[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const usedPaths = new Set<string>()

  for (let i = 0; i < files.length; i += 1) {
    const entry = files[i]
    const safePath = deduplicateZipPath(sanitizeZipPath(entry.filename, i), usedPaths)
    const data = entry.blob instanceof Uint8Array ? entry.blob : await entry.blob.arrayBuffer()
    zip.file(safePath, data)
  }

  return zip.generateAsync({ type: 'blob', compression: 'STORE' })
}
