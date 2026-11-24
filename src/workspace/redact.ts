/**
 * [INPUT]: depends on getPhoneSpec from @/assets/mockups/specs, calcScreenshotLayout from @/components/canvas/PhoneNode.geometry, QuickMockup and QuickScreenshotFit from @/utils/quickDesign, getQuickPreviewGeometry from @/utils/quickPreview, and WorkspaceRedactionRegion from ./types
 * [OUTPUT]: exports NormalizedRect, RedactResizeCorner, MockupStageMetrics, clampNormalizedRegion, normalizeDragBox, resizeRegionByCorner, moveRegionByDelta, computeMockupStageMetrics, stagePointToImageNorm, imageNormRectToStageNorm, applyRedactionsToCanvas, and renderRedactedImageDataUrl
 * [POS]: pure math and 2D canvas redaction/spotlight engine for Quick Workspace MockupQuickTool and canvasUtils; produces coordinates matching Studio handoff in src/bridge/studioHandoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { getPhoneSpec } from '@/assets/mockups/specs'
import { calcScreenshotLayout } from '@/components/canvas/PhoneNode.geometry'
import type { QuickMockup, QuickScreenshotFit } from '@/utils/quickDesign'
import { getQuickPreviewGeometry } from '@/utils/quickPreview'
import type { WorkspaceRedactionRegion } from './types'

export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

export type RedactResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

export interface MockupStageMetrics {
  canvasWidth: number
  canvasHeight: number
  /** Screen rect normalized 0..1 relative to the full SVG viewBox. */
  screenNorm: NormalizedRect
  /** Fitted screenshot image rect normalized 0..1 relative to the full SVG viewBox. */
  imageNorm: NormalizedRect
}

export interface RedactCanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
}

export interface ApplyRedactionsOptions {
  createCanvas?: (width: number, height: number) => RedactCanvasLike
}

const MIN_REGION_SIZE = 0.02

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function roundNorm(value: number): number {
  return Math.round(value * 10000) / 10000
}

export function defaultIntensityForKind(kind: WorkspaceRedactionRegion['kind']): number {
  if (kind === 'spotlight') return 1.25
  if (kind === 'pixelate') return 14
  return 14
}

export function clampNormalizedRegion(region: WorkspaceRedactionRegion): WorkspaceRedactionRegion {
  const x = clamp01(region.x)
  const y = clamp01(region.y)
  const maxW = Math.max(0.01, 1 - x)
  const maxH = Math.max(0.01, 1 - y)
  const width = Math.max(0.01, Math.min(maxW, Number.isFinite(region.width) ? region.width : 0.1))
  const height = Math.max(0.01, Math.min(maxH, Number.isFinite(region.height) ? region.height : 0.1))
  const intensity =
    region.kind === 'spotlight'
      ? Number.isFinite(region.intensity) && region.intensity > 1
        ? 1.25
        : 1
      : Math.max(4, Math.min(48, Math.round(Number.isFinite(region.intensity) ? region.intensity : 14)))

  return {
    ...region,
    x: roundNorm(x),
    y: roundNorm(y),
    width: roundNorm(width),
    height: roundNorm(height),
    intensity,
  }
}

export function normalizeDragBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minSize = MIN_REGION_SIZE,
): NormalizedRect | null {
  const x1 = clamp01(startX)
  const y1 = clamp01(startY)
  const x2 = clamp01(endX)
  const y2 = clamp01(endY)
  const left = Math.min(x1, x2)
  const top = Math.min(y1, y2)
  const width = Math.abs(x2 - x1)
  const height = Math.abs(y2 - y1)
  if (width < minSize || height < minSize) return null
  return {
    x: roundNorm(left),
    y: roundNorm(top),
    width: roundNorm(Math.min(1 - left, width)),
    height: roundNorm(Math.min(1 - top, height)),
  }
}

export function resizeRegionByCorner(
  region: WorkspaceRedactionRegion,
  corner: RedactResizeCorner,
  pointerX: number,
  pointerY: number,
  minSize = 0.03,
): WorkspaceRedactionRegion {
  const px = clamp01(pointerX)
  const py = clamp01(pointerY)
  const left0 = clamp01(region.x)
  const top0 = clamp01(region.y)
  const right0 = clamp01(region.x + region.width)
  const bottom0 = clamp01(region.y + region.height)

  let left = left0
  let top = top0
  let right = right0
  let bottom = bottom0

  if (corner === 'nw' || corner === 'sw') {
    left = Math.min(px, right0 - minSize)
  }
  if (corner === 'ne' || corner === 'se') {
    right = Math.max(px, left0 + minSize)
  }
  if (corner === 'nw' || corner === 'ne') {
    top = Math.min(py, bottom0 - minSize)
  }
  if (corner === 'sw' || corner === 'se') {
    bottom = Math.max(py, top0 + minSize)
  }

  return clampNormalizedRegion({
    ...region,
    x: clamp01(left),
    y: clamp01(top),
    width: Math.max(minSize, clamp01(right) - clamp01(left)),
    height: Math.max(minSize, clamp01(bottom) - clamp01(top)),
  })
}

export function moveRegionByDelta(
  region: WorkspaceRedactionRegion,
  dx: number,
  dy: number,
): WorkspaceRedactionRegion {
  const width = Math.max(0.01, Math.min(1, region.width))
  const height = Math.max(0.01, Math.min(1, region.height))
  const nextX = Math.max(0, Math.min(1 - width, region.x + dx))
  const nextY = Math.max(0, Math.min(1 - height, region.y + dy))
  return clampNormalizedRegion({
    ...region,
    x: nextX,
    y: nextY,
    width,
    height,
  })
}

/**
 * Compute exact normalized viewBox coordinates for the device screen and fitted screenshot image.
 * Uses the same geometry math as QuickDesignPreview and Studio handoff so redactions align 1:1.
 */
export function computeMockupStageMetrics(params: {
  canvasWidth: number
  canvasHeight: number
  mockup: QuickMockup
  scaleFactor?: number
  screenshotWidth: number
  screenshotHeight: number
  screenshotFit: QuickScreenshotFit
}): MockupStageMetrics {
  const safeW = Number.isFinite(params.canvasWidth) && params.canvasWidth > 0 ? params.canvasWidth : 1600
  const safeH = Number.isFinite(params.canvasHeight) && params.canvasHeight > 0 ? params.canvasHeight : 900
  const shotW = Number.isFinite(params.screenshotWidth) && params.screenshotWidth > 0 ? params.screenshotWidth : 1200
  const shotH = Number.isFinite(params.screenshotHeight) && params.screenshotHeight > 0 ? params.screenshotHeight : 800
  const spec = getPhoneSpec(params.mockup)
  const baseGeom = getQuickPreviewGeometry(params.mockup, safeW, safeH)
  const clampedFactor = Number.isFinite(params.scaleFactor)
    ? Math.max(0.65, Math.min(1.15, params.scaleFactor!))
    : 1
  const scale = baseGeom.scale * clampedFactor
  const frameX = clampedFactor === 1 ? baseGeom.frameX : Math.round((safeW - spec.frameWidth * scale) / 2)
  const frameY = clampedFactor === 1 ? baseGeom.frameY : Math.round((safeH - spec.frameHeight * scale) / 2)

  const screenX = frameX + spec.screen.x * scale
  const screenY = frameY + spec.screen.y * scale
  const screenW = spec.screen.width * scale
  const screenH = spec.screen.height * scale

  const shotLayout = calcScreenshotLayout(shotW, shotH, spec.screen.width, spec.screen.height, params.screenshotFit, 0, 0)
  const imgX = screenX + shotLayout.x * scale
  const imgY = screenY + shotLayout.y * scale
  const imgW = shotLayout.width * scale
  const imgH = shotLayout.height * scale

  return {
    canvasWidth: safeW,
    canvasHeight: safeH,
    screenNorm: {
      x: screenX / safeW,
      y: screenY / safeH,
      width: screenW / safeW,
      height: screenH / safeH,
    },
    imageNorm: {
      x: imgX / safeW,
      y: imgY / safeH,
      width: imgW / safeW,
      height: imgH / safeH,
    },
  }
}

export function stagePointToImageNorm(
  stageX: number,
  stageY: number,
  imageNorm: NormalizedRect,
): { x: number; y: number } {
  const safeW = imageNorm.width > 0 ? imageNorm.width : 1
  const safeH = imageNorm.height > 0 ? imageNorm.height : 1
  return {
    x: clamp01((stageX - imageNorm.x) / safeW),
    y: clamp01((stageY - imageNorm.y) / safeH),
  }
}

export function imageNormRectToStageNorm(
  region: NormalizedRect,
  imageNorm: NormalizedRect,
  screenNorm: NormalizedRect,
): NormalizedRect | null {
  const rawLeft = imageNorm.x + clamp01(region.x) * imageNorm.width
  const rawTop = imageNorm.y + clamp01(region.y) * imageNorm.height
  const rawRight = rawLeft + clamp01(region.width) * imageNorm.width
  const rawBottom = rawTop + clamp01(region.height) * imageNorm.height

  const left = Math.max(screenNorm.x, rawLeft)
  const top = Math.max(screenNorm.y, rawTop)
  const right = Math.min(screenNorm.x + screenNorm.width, rawRight)
  const bottom = Math.min(screenNorm.y + screenNorm.height, rawBottom)

  if (right - left <= 0.0005 || bottom - top <= 0.0005) return null
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

function traceRoundedRect(
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

function defaultCreateCanvas(width: number, height: number): RedactCanvasLike {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return el
}

/**
 * Draw source image onto ctx and apply blur, pixelate, and spotlight redactions in order.
 * Pure against injected createCanvas so Node Vitest suites can test every branch deterministically.
 */
export function applyRedactionsToCanvas(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  regions: readonly WorkspaceRedactionRegion[],
  options?: ApplyRedactionsOptions,
): void {
  const safeW = Math.max(1, Math.round(width))
  const safeH = Math.max(1, Math.round(height))
  ctx.drawImage(source, 0, 0, safeW, safeH)
  if (!regions.length) return

  const makeCanvas = options?.createCanvas ?? defaultCreateCanvas
  const clamped = regions.map(clampNormalizedRegion)
  const blurAndPixelate = clamped.filter((r) => r.kind === 'blur' || r.kind === 'pixelate')
  const spotlights = clamped.filter((r) => r.kind === 'spotlight')

  // Pass 1: apply blur and pixelate redactions directly over the base image.
  for (const region of blurAndPixelate) {
    const rx = Math.round(region.x * safeW)
    const ry = Math.round(region.y * safeH)
    const rw = Math.max(1, Math.min(safeW - rx, Math.round(region.width * safeW)))
    const rh = Math.max(1, Math.min(safeH - ry, Math.round(region.height * safeH)))

    if (region.kind === 'blur') {
      const blurPx = Math.max(4, Math.min(48, Math.round(region.intensity || 14)))
      const radius = Math.min(8, rw * 0.12, rh * 0.12)
      ctx.save()
      traceRoundedRect(ctx, rx, ry, rw, rh, radius)
      ctx.clip()
      ctx.filter = `blur(${blurPx}px)`
      ctx.drawImage(source, 0, 0, safeW, safeH)
      ctx.filter = 'none'
      ctx.restore()
      continue
    }

    // Pixelate: nearest-neighbor downscale then upscale with imageSmoothingEnabled = false.
    const blockSize = Math.max(4, Math.min(48, Math.round(region.intensity || 14)))
    const tinyW = Math.max(1, Math.round(rw / blockSize))
    const tinyH = Math.max(1, Math.round(rh / blockSize))
    const tinyCanvas = makeCanvas(tinyW, tinyH)
    const tinyCtx = tinyCanvas.getContext('2d')
    if (!tinyCtx) continue
    tinyCtx.drawImage(source, rx, ry, rw, rh, 0, 0, tinyW, tinyH)

    const radius = Math.min(6, rw * 0.1, rh * 0.1)
    ctx.save()
    traceRoundedRect(ctx, rx, ry, rw, rh, radius)
    ctx.clip()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tinyCanvas as unknown as CanvasImageSource, 0, 0, tinyW, tinyH, rx, ry, rw, rh)
    ctx.restore()
  }

  if (!spotlights.length) return

  // Pass 2: snapshot redacted base, dim 40%, then punch crisp/1.25x rounded shadow cutouts.
  const snapshot = makeCanvas(safeW, safeH)
  const snapCtx = snapshot.getContext('2d')
  if (snapCtx) {
    snapCtx.drawImage(source, 0, 0, safeW, safeH)
    // Re-apply blur/pixelate onto snapshot if base had them so spotlight cutouts respect redactions.
    if (blurAndPixelate.length > 0 && ctx.canvas) {
      snapCtx.drawImage(ctx.canvas as unknown as CanvasImageSource, 0, 0, safeW, safeH)
    }
  }
  const cutoutSource = snapCtx ? (snapshot as unknown as CanvasImageSource) : source

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillRect(0, 0, safeW, safeH)
  ctx.restore()

  for (const region of spotlights) {
    const rx = Math.round(region.x * safeW)
    const ry = Math.round(region.y * safeH)
    const rw = Math.max(1, Math.min(safeW - rx, Math.round(region.width * safeW)))
    const rh = Math.max(1, Math.min(safeH - ry, Math.round(region.height * safeH)))
    const zoom = Number.isFinite(region.intensity) && region.intensity > 1 ? 1.25 : 1
    const focusW = Math.min(safeW, Math.round(rw * zoom))
    const focusH = Math.min(safeH, Math.round(rh * zoom))
    const focusX = Math.max(0, Math.min(safeW - focusW, Math.round(rx - (focusW - rw) / 2)))
    const focusY = Math.max(0, Math.min(safeH - focusH, Math.round(ry - (focusH - rh) / 2)))
    const radius = Math.min(12, focusW * 0.12, focusH * 0.12)

    // Rounded drop shadow behind the spotlight cutout.
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)'
    ctx.shadowBlur = Math.max(16, Math.round(Math.min(safeW, safeH) * 0.024))
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 6
    traceRoundedRect(ctx, focusX, focusY, focusW, focusH, radius)
    ctx.fillStyle = '#0f172a'
    ctx.fill()
    ctx.restore()

    // Crisp zoomed or 1x cutout clipped to rounded rectangle.
    ctx.save()
    traceRoundedRect(ctx, focusX, focusY, focusW, focusH, radius)
    ctx.clip()
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(cutoutSource, rx, ry, rw, rh, focusX, focusY, focusW, focusH)
    ctx.restore()

    // Subtle crisp frame ring around the spotlight cutout.
    ctx.save()
    traceRoundedRect(ctx, focusX, focusY, focusW, focusH, radius)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = Math.max(1.5, Math.round(Math.min(safeW, safeH) * 0.0022))
    ctx.stroke()
    ctx.restore()
  }
}

/**
 * Render a redacted screenshot data URL for live preview without mutating the original source.
 */
export async function renderRedactedImageDataUrl(
  sourceDataUrl: string,
  regions: readonly WorkspaceRedactionRegion[],
  maxPreviewEdge = 1600,
): Promise<string> {
  if (!regions.length || typeof document === 'undefined' || typeof Image === 'undefined') {
    return sourceDataUrl
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.decoding = 'async'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Failed to load screenshot for redaction preview'))
    el.src = sourceDataUrl
  })
  const natW = Math.max(1, img.naturalWidth || img.width)
  const natH = Math.max(1, img.naturalHeight || img.height)
  const scale = Math.min(1, maxPreviewEdge / Math.max(natW, natH))
  const width = Math.max(1, Math.round(natW * scale))
  const height = Math.max(1, Math.round(natH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return sourceDataUrl
  applyRedactionsToCanvas(ctx, img, width, height, regions)
  return canvas.toDataURL('image/png')
}
