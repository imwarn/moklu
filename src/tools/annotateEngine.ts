/**
 * [INPUT]: depends on canvas creation, dimension clamping, rounded-rect path tracing, background fill, and Blob encoding helpers from ./canvasHelpers, plus CanvasFactory, ImageDrawable, and ImageFormat from ./types
 * [OUTPUT]: exports vector annotation types, preset color/stroke/font constants, immutable undo/redo history reducers, RDP brush thinning, quadratic SVG path builder, bounds/move/8-handle resize geometry, z-order hit testing, Canvas 2D vector renderer, and full-res annotated image Blob/dataUrl compositor
 * [POS]: pure client-side vector image annotation engine within src/tools; zero external dependencies; consumed by AnnotateCanvas, AnnotateModal, and AnnotateQuickTool in src/workspace
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampCanvasDimensions,
  clampNumber,
  createCanvas,
  fillBackground,
  get2dContext,
  resolveEncodedImageFormat,
  traceRoundedRectPath,
} from './canvasHelpers'
import type { CanvasFactory, ImageDrawable, ImageFormat } from './types'

// ============================================================================
// Public Types & Constants
// ============================================================================

export type AnnotationToolMode = 'select' | 'brush' | 'rect' | 'arrow' | 'text'
export type AnnotationResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface AnnotationPoint {
  x: number // normalized 0..1 relative to image width
  y: number // normalized 0..1 relative to image height
}

export interface AnnotationBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface BaseAnnotationLayer {
  id: string
  color: string
  strokeWidth: number // normalized fraction of min(imgW, imgH), e.g. 0.004..0.06
}

export interface BrushAnnotationLayer extends BaseAnnotationLayer {
  type: 'brush'
  points: AnnotationPoint[]
}

export interface RectAnnotationLayer extends BaseAnnotationLayer {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
  cornerRadius?: number // normalized fraction of min(imgW, imgH), default 0.008
}

export interface ArrowAnnotationLayer extends BaseAnnotationLayer {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface TextAnnotationLayer extends BaseAnnotationLayer {
  type: 'text'
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number // normalized fraction of min(imgW, imgH), e.g. 0.02..0.14
}

export type AnnotationLayer = BrushAnnotationLayer | RectAnnotationLayer | ArrowAnnotationLayer | TextAnnotationLayer

export interface AnnotationHistoryState {
  past: AnnotationLayer[][]
  present: AnnotationLayer[]
  future: AnnotationLayer[][]
}

export interface RenderAnnotatedImageOptions {
  format?: ImageFormat
  quality?: number
  createCanvas?: CanvasFactory
}

export interface RenderAnnotatedImageResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  mimeType: string
}

/** Minimal structural subset of CanvasRenderingContext2D required by renderAnnotationsToCanvas. */
export type AnnotationCanvasContext = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'font' | 'textAlign' | 'textBaseline'
  | 'shadowColor' | 'shadowBlur' | 'shadowOffsetX' | 'shadowOffsetY'
  | 'save' | 'restore' | 'beginPath' | 'closePath' | 'moveTo' | 'lineTo' | 'arcTo' | 'rect' | 'fill' | 'stroke' | 'fillText'
> &
  Partial<Pick<CanvasRenderingContext2D, 'lineCap' | 'lineJoin' | 'miterLimit' | 'quadraticCurveTo' | 'arc' | 'strokeText'>> & {
    measureText?(text: string): { readonly width: number }
  }

export const ANNOTATION_PRESET_COLORS: readonly string[] = [
  '#ffcc00', '#ff7a00', '#ff2d55', '#ff0000',
  '#8e5cff', '#3a86ff', '#ffffff', '#111827',
] as const

export const DEFAULT_ANNOTATION_COLOR = '#ff0000'
export const DEFAULT_ANNOTATION_STROKE_WIDTH = 0.012
export const DEFAULT_ANNOTATION_FONT_SIZE = 0.055

const DEFAULT_RECT_CORNER_RADIUS = 0.008
const DEFAULT_MAX_HISTORY_ENTRIES = 50
const DEFAULT_SIMPLIFY_EPSILON = 0.002
const DEFAULT_RESIZE_MIN_SIZE = 0.02
const DEFAULT_HIT_TOLERANCE = 0.02
const MIN_SAFE_BOX_SIZE = 0.01
const MIN_FONT_SIZE_NORM = 0.015
const MAX_FONT_SIZE_NORM = 0.25
const ANNOTATION_FONT_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

// ============================================================================
// Internal Helpers
// ============================================================================

function cloneLayer(layer: AnnotationLayer): AnnotationLayer {
  return layer.type === 'brush'
    ? { ...layer, points: layer.points.map((pt) => ({ x: pt.x, y: pt.y })) }
    : { ...layer }
}

const cloneLayers = (layers: readonly AnnotationLayer[]): AnnotationLayer[] => layers.map(cloneLayer)

function formatSvgCoord(value: number): string {
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function getBrushStrokePad(strokeWidth: number): number {
  return Math.max(0.004, (Number.isFinite(strokeWidth) ? Math.max(0, strokeWidth) : DEFAULT_ANNOTATION_STROKE_WIDTH) * 0.5)
}

function normalizeBox(rawX: number, rawY: number, rawW: number, rawH: number, minSize: number): AnnotationBounds {
  const x0 = Number.isFinite(rawX) ? rawX : 0
  const y0 = Number.isFinite(rawY) ? rawY : 0
  const w0 = Number.isFinite(rawW) ? rawW : 0
  const h0 = Number.isFinite(rawH) ? rawH : 0
  const safeMin = clampNumber(minSize, 0.001, 1)
  const width = clampNumber(Math.abs(w0), safeMin, 1)
  const height = clampNumber(Math.abs(h0), safeMin, 1)
  return {
    x: clampNumber(w0 < 0 ? x0 + w0 : x0, 0, Math.max(0, 1 - width)),
    y: clampNumber(h0 < 0 ? y0 + h0 : y0, 0, Math.max(0, 1 - height)),
    width,
    height,
  }
}

function expandSpanToMin(minVal: number, maxVal: number, minSpan: number): [number, number] {
  if (maxVal - minVal >= minSpan) {
    const start = clampNumber(minVal, 0, 1)
    const end = clampNumber(maxVal, start, 1)
    if (end - start >= minSpan) return [start, end]
  }
  const center = clampNumber((minVal + maxVal) / 2, 0, 1)
  const start = clampNumber(center - minSpan / 2, 0, Math.max(0, 1 - minSpan))
  return [start, Math.min(1, start + minSpan)]
}

function resizeAxis(
  start: number,
  end: number,
  moveStart: boolean,
  moveEnd: boolean,
  delta: number,
  minSize: number,
): [number, number] {
  let a = start
  let b = end
  if (moveStart) {
    a = clampNumber(a + delta, 0, Math.max(0, b - minSize))
    if (b - a < minSize) b = Math.min(1, a + minSize)
  } else if (moveEnd) {
    b = clampNumber(b + delta, Math.min(1, a + minSize), 1)
    if (b - a < minSize) a = Math.max(0, b - minSize)
  }
  return [a, b]
}

function distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax
  const aby = by - ay
  const lenSq = abx * abx + aby * aby
  if (lenSq <= 1e-12) return Math.hypot(px - ax, py - ay)
  const t = clampNumber(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1)
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby))
}

function getRawGeometryExtents(
  layer: AnnotationLayer,
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (layer.type === 'rect' || layer.type === 'text') {
    return {
      minX: Math.min(layer.x, layer.x + layer.width),
      maxX: Math.max(layer.x, layer.x + layer.width),
      minY: Math.min(layer.y, layer.y + layer.height),
      maxY: Math.max(layer.y, layer.y + layer.height),
    }
  }
  if (layer.type === 'arrow') {
    return {
      minX: Math.min(layer.x1, layer.x2),
      maxX: Math.max(layer.x1, layer.x2),
      minY: Math.min(layer.y1, layer.y2),
      maxY: Math.max(layer.y1, layer.y2),
    }
  }
  if (layer.points.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const pt of layer.points) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
    if (pt.y < minY) minY = pt.y
    if (pt.y > maxY) maxY = pt.y
  }
  return { minX, maxX, minY, maxY }
}

function getContrastHaloColor(textColor: string): string {
  const trimmed = textColor.trim().toLowerCase()
  let rgb: [number, number, number] = [128, 128, 128]
  const hex3 = /^#([0-9a-f]{3})$/i.exec(trimmed)
  const hex6 = /^#([0-9a-f]{6})$/i.exec(trimmed)
  const rgbMatch = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/.exec(trimmed)

  if (hex3) {
    const h = hex3[1]
    rgb = [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  } else if (hex6) {
    const h = hex6[1]
    rgb = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  } else if (rgbMatch) {
    rgb = [
      clampNumber(Number(rgbMatch[1]), 0, 255),
      clampNumber(Number(rgbMatch[2]), 0, 255),
      clampNumber(Number(rgbMatch[3]), 0, 255),
    ]
  }

  const lin = (c: number): number => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const lum = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
  if (lum < 0.12) return 'rgba(255, 255, 255, 0.88)'
  return lum > 0.6 ? 'rgba(17, 24, 39, 0.78)' : 'rgba(17, 24, 39, 0.65)'
}

function measureTextWidth(ctx: AnnotationCanvasContext, text: string, fontPx: number): number {
  const measured = typeof ctx.measureText === 'function' ? ctx.measureText(text).width : NaN
  return Number.isFinite(measured) && measured >= 0 ? measured : text.length * fontPx * 0.6
}

function splitLongToken(
  ctx: AnnotationCanvasContext,
  token: string,
  maxWidth: number,
  fontPx: number,
  outLines: string[],
): string {
  let chunk = ''
  for (const ch of token) {
    if (chunk.length > 0 && measureTextWidth(ctx, chunk + ch, fontPx) > maxWidth) {
      outLines.push(chunk)
      chunk = ch
    } else {
      chunk += ch
    }
  }
  return chunk
}

function wrapTextLines(ctx: AnnotationCanvasContext, text: string, maxWidth: number, fontPx: number): string[] {
  const safeMaxWidth = Math.max(fontPx, maxWidth)
  const lines: string[] = []

  for (const paragraph of text.replace(/\r\n/g, '\n').split('\n')) {
    if (paragraph.length === 0 || measureTextWidth(ctx, paragraph, fontPx) <= safeMaxWidth) {
      lines.push(paragraph)
      continue
    }
    let currentLine = ''
    for (const token of paragraph.match(/\S+|\s+/g) ?? [paragraph]) {
      const candidate = currentLine + token
      if (currentLine.length > 0 && measureTextWidth(ctx, candidate, fontPx) > safeMaxWidth) {
        lines.push(currentLine.trimEnd())
        const nextToken = token.trimStart()
        currentLine =
          nextToken.length > 0 && measureTextWidth(ctx, nextToken, fontPx) > safeMaxWidth
            ? splitLongToken(ctx, nextToken, safeMaxWidth, fontPx, lines)
            : nextToken
      } else if (currentLine.length === 0 && measureTextWidth(ctx, token, fontPx) > safeMaxWidth) {
        currentLine = splitLongToken(ctx, token, safeMaxWidth, fontPx, lines)
      } else {
        currentLine = candidate
      }
    }
    if (currentLine.length > 0) lines.push(currentLine)
  }
  return lines
}

async function encodeBlobToDataUrl(blob: Blob, fallbackMimeType: string): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Failed to encode annotated blob as data URL.'))
      reader.onerror = () => reject(new Error('FileReader failed while reading annotated blob.'))
      reader.readAsDataURL(blob)
    })
  }
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const mime = blob.type || fallbackMimeType
  if (typeof Buffer !== 'undefined') return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

// ============================================================================
// Immutable Undo / Redo History
// ============================================================================

export function createAnnotationHistory(initial: AnnotationLayer[] = []): AnnotationHistoryState {
  return { past: [], present: cloneLayers(initial), future: [] }
}

export function pushAnnotationHistory(
  state: AnnotationHistoryState,
  next: AnnotationLayer[],
  maxEntries = DEFAULT_MAX_HISTORY_ENTRIES,
): AnnotationHistoryState {
  const limit = Math.max(1, Math.floor(Number.isFinite(maxEntries) ? maxEntries : DEFAULT_MAX_HISTORY_ENTRIES))
  const nextPast = [...state.past, cloneLayers(state.present)]
  return { past: nextPast.length > limit ? nextPast.slice(nextPast.length - limit) : nextPast, present: cloneLayers(next), future: [] }
}

export function undoAnnotationHistory(state: AnnotationHistoryState): AnnotationHistoryState {
  if (state.past.length === 0) return state
  return { past: state.past.slice(0, -1), present: cloneLayers(state.past[state.past.length - 1]), future: [cloneLayers(state.present), ...state.future] }
}

export function redoAnnotationHistory(state: AnnotationHistoryState): AnnotationHistoryState {
  if (state.future.length === 0) return state
  const [next, ...restFuture] = state.future
  return { past: [...state.past, cloneLayers(state.present)], present: cloneLayers(next), future: restFuture }
}

export const canUndoAnnotation = (state: AnnotationHistoryState): boolean => state.past.length > 0
export const canRedoAnnotation = (state: AnnotationHistoryState): boolean => state.future.length > 0

// ============================================================================
// Brush Point Simplification & Smooth SVG Path
// ============================================================================

/**
 * Iterative Ramer-Douglas-Peucker thinning for freehand brush strokes.
 * Preserves single-point dots and guarantees at least 2 points when given >= 2 inputs.
 */
export function simplifyBrushPoints(
  points: readonly AnnotationPoint[],
  epsilon = DEFAULT_SIMPLIFY_EPSILON,
): AnnotationPoint[] {
  const count = points.length
  if (count === 0) return []
  if (count <= 2 || !Number.isFinite(epsilon) || epsilon <= 0) {
    return points.map((pt) => ({ x: pt.x, y: pt.y }))
  }

  const keep = new Uint8Array(count)
  keep[0] = 1
  keep[count - 1] = 1

  const stack: Array<[number, number]> = [[0, count - 1]]
  while (stack.length > 0) {
    const [startIdx, endIdx] = stack.pop()!
    if (endIdx - startIdx <= 1) continue
    const a = points[startIdx]
    const b = points[endIdx]
    let maxDist = -1
    let splitIdx = -1

    for (let i = startIdx + 1; i < endIdx; i += 1) {
      const dist = distancePointToSegment(points[i].x, points[i].y, a.x, a.y, b.x, b.y)
      if (dist > maxDist) {
        maxDist = dist
        splitIdx = i
      }
    }
    if (maxDist > epsilon && splitIdx > startIdx && splitIdx < endIdx) {
      keep[splitIdx] = 1
      stack.push([startIdx, splitIdx], [splitIdx, endIdx])
    }
  }

  const result: AnnotationPoint[] = []
  for (let i = 0; i < count; i += 1) {
    if (keep[i] === 1) result.push({ x: points[i].x, y: points[i].y })
  }
  return result
}

/**
 * Build a C1-smooth quadratic Bezier midpoint SVG path string in pixel coordinates.
 * Mirrors renderBrushLayer in renderAnnotationsToCanvas for exact SVG/Canvas parity.
 */
export function buildSmoothSvgPath(points: readonly AnnotationPoint[], width: number, height: number): string {
  const count = points.length
  if (count === 0 || width <= 0 || height <= 0) return ''

  const x0 = formatSvgCoord(points[0].x * width)
  const y0 = formatSvgCoord(points[0].y * height)
  if (count === 1) return `M ${x0} ${y0} L ${x0} ${y0}`
  if (count === 2) {
    return `M ${x0} ${y0} L ${formatSvgCoord(points[1].x * width)} ${formatSvgCoord(points[1].y * height)}`
  }

  const parts: string[] = [`M ${x0} ${y0}`]
  for (let i = 1; i < count - 1; i += 1) {
    const cx = formatSvgCoord(points[i].x * width)
    const cy = formatSvgCoord(points[i].y * height)
    const mx = formatSvgCoord(((points[i].x + points[i + 1].x) / 2) * width)
    const my = formatSvgCoord(((points[i].y + points[i + 1].y) / 2) * height)
    parts.push(`Q ${cx} ${cy} ${mx} ${my}`)
  }
  const last = points[count - 1]
  parts.push(`L ${formatSvgCoord(last.x * width)} ${formatSvgCoord(last.y * height)}`)
  return parts.join(' ')
}

// ============================================================================
// Bounds, Translation, 8-Handle Resize, and Z-Order Hit Testing
// ============================================================================

export function getAnnotationBounds(layer: AnnotationLayer): AnnotationBounds {
  if (layer.type === 'rect' || layer.type === 'text') {
    return normalizeBox(layer.x, layer.y, layer.width, layer.height, MIN_SAFE_BOX_SIZE)
  }
  const extents = getRawGeometryExtents(layer)
  if (!extents) return { x: 0, y: 0, width: MIN_SAFE_BOX_SIZE, height: MIN_SAFE_BOX_SIZE }

  const pad = layer.type === 'brush' ? getBrushStrokePad(layer.strokeWidth) : 0
  const [x0, x1] = expandSpanToMin(extents.minX - pad, extents.maxX + pad, MIN_SAFE_BOX_SIZE)
  const [y0, y1] = expandSpanToMin(extents.minY - pad, extents.maxY + pad, MIN_SAFE_BOX_SIZE)
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

export function computeResizedBounds(
  startBounds: AnnotationBounds,
  handle: AnnotationResizeHandle,
  dx: number,
  dy: number,
  minSize = DEFAULT_RESIZE_MIN_SIZE,
): AnnotationBounds {
  const safeMin = clampNumber(minSize, 0.005, 1)
  const startL = clampNumber(startBounds.x, 0, 1)
  const startT = clampNumber(startBounds.y, 0, 1)
  const startR = clampNumber(startBounds.x + startBounds.width, startL, 1)
  const startB = clampNumber(startBounds.y + startBounds.height, startT, 1)

  const [left, right] = resizeAxis(startL, startR, handle.includes('w'), handle.includes('e'), Number.isFinite(dx) ? dx : 0, safeMin)
  const [top, bottom] = resizeAxis(startT, startB, handle.includes('n'), handle.includes('s'), Number.isFinite(dy) ? dy : 0, safeMin)
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

export function moveAnnotationLayer(layer: AnnotationLayer, dx: number, dy: number): AnnotationLayer {
  const extents = getRawGeometryExtents(layer)
  if (!extents) return cloneLayer(layer)

  const clampedDx = -extents.minX <= 1 - extents.maxX ? clampNumber(Number.isFinite(dx) ? dx : 0, -extents.minX, 1 - extents.maxX) : 0
  const clampedDy = -extents.minY <= 1 - extents.maxY ? clampNumber(Number.isFinite(dy) ? dy : 0, -extents.minY, 1 - extents.maxY) : 0

  if (layer.type === 'rect' || layer.type === 'text') {
    return { ...layer, x: layer.x + clampedDx, y: layer.y + clampedDy }
  }
  if (layer.type === 'arrow') {
    return { ...layer, x1: layer.x1 + clampedDx, y1: layer.y1 + clampedDy, x2: layer.x2 + clampedDx, y2: layer.y2 + clampedDy }
  }
  return { ...layer, points: layer.points.map((pt) => ({ x: pt.x + clampedDx, y: pt.y + clampedDy })) }
}

export function resizeAnnotationLayer(
  layer: AnnotationLayer,
  _handle: AnnotationResizeHandle,
  nextBounds: AnnotationBounds,
): AnnotationLayer {
  const target = normalizeBox(nextBounds.x, nextBounds.y, nextBounds.width, nextBounds.height, 0.005)

  if (layer.type === 'rect') return { ...layer, ...target }

  if (layer.type === 'text') {
    const oldBounds = getAnnotationBounds(layer)
    const scaleY = oldBounds.height > 1e-6 ? target.height / oldBounds.height : 1
    return { ...layer, ...target, fontSize: clampNumber(layer.fontSize * scaleY, MIN_FONT_SIZE_NORM, MAX_FONT_SIZE_NORM) }
  }

  const extents = getRawGeometryExtents(layer)
  if (!extents) return layer.type === 'brush' ? { ...layer, points: [] } : { ...layer }
  const spanX = extents.maxX - extents.minX
  const spanY = extents.maxY - extents.minY

  if (layer.type === 'arrow') {
    const mapX = (v: number): number =>
      clampNumber(spanX > 1e-6 ? target.x + ((v - extents.minX) / spanX) * target.width : target.x + target.width / 2, 0, 1)
    const mapY = (v: number): number =>
      clampNumber(spanY > 1e-6 ? target.y + ((v - extents.minY) / spanY) * target.height : target.y + target.height / 2, 0, 1)
    return { ...layer, x1: mapX(layer.x1), y1: mapY(layer.y1), x2: mapX(layer.x2), y2: mapY(layer.y2) }
  }

  const pad = getBrushStrokePad(layer.strokeWidth)
  const innerX = target.width > pad * 2 ? target.x + pad : target.x
  const innerW = target.width > pad * 2 ? target.width - pad * 2 : target.width
  const innerY = target.height > pad * 2 ? target.y + pad : target.y
  const innerH = target.height > pad * 2 ? target.height - pad * 2 : target.height

  return {
    ...layer,
    points: layer.points.map((pt) => ({
      x: clampNumber(spanX > 1e-6 ? innerX + ((pt.x - extents.minX) / spanX) * innerW : innerX + innerW / 2, 0, 1),
      y: clampNumber(spanY > 1e-6 ? innerY + ((pt.y - extents.minY) / spanY) * innerH : innerY + innerH / 2, 0, 1),
    })),
  }
}

function pointInExpandedBounds(point: AnnotationPoint, b: AnnotationBounds, margin: number): boolean {
  return point.x >= b.x - margin && point.x <= b.x + b.width + margin && point.y >= b.y - margin && point.y <= b.y + b.height + margin
}

function hitTestLayer(layer: AnnotationLayer, point: AnnotationPoint, tolerance: number): boolean {
  if (layer.type === 'text') return pointInExpandedBounds(point, getAnnotationBounds(layer), tolerance * 0.5)
  if (layer.type === 'rect') {
    return pointInExpandedBounds(point, getAnnotationBounds(layer), Math.max(tolerance, layer.strokeWidth * 0.5))
  }
  if (layer.type === 'arrow') {
    return distancePointToSegment(point.x, point.y, layer.x1, layer.y1, layer.x2, layer.y2) <= Math.max(tolerance, layer.strokeWidth * 1.25)
  }
  const count = layer.points.length
  if (count === 0) return false
  const threshold = Math.max(tolerance, layer.strokeWidth * 0.6)
  if (count === 1) return Math.hypot(point.x - layer.points[0].x, point.y - layer.points[0].y) <= threshold
  for (let i = 0; i < count - 1; i += 1) {
    const a = layer.points[i]
    const b = layer.points[i + 1]
    if (distancePointToSegment(point.x, point.y, a.x, a.y, b.x, b.y) <= threshold) return true
  }
  return false
}

export function hitTestAnnotationLayers(
  layers: readonly AnnotationLayer[],
  point: AnnotationPoint,
  tolerance = DEFAULT_HIT_TOLERANCE,
): AnnotationLayer | null {
  const safeTol = Math.max(0.004, Number.isFinite(tolerance) ? tolerance : DEFAULT_HIT_TOLERANCE)
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    if (hitTestLayer(layers[i], point, safeTol)) return layers[i]
  }
  return null
}

// ============================================================================
// Canvas 2D Vector Renderer & Image Compositor
// ============================================================================

function renderBrushLayer(ctx: AnnotationCanvasContext, width: number, height: number, layer: BrushAnnotationLayer, strokePx: number): void {
  const count = layer.points.length
  if (count === 0) return

  ctx.strokeStyle = layer.color
  ctx.fillStyle = layer.color
  ctx.lineWidth = strokePx
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (count === 1) {
    const x = layer.points[0].x * width
    const y = layer.points[0].y * height
    ctx.beginPath()
    if (typeof ctx.arc === 'function') {
      ctx.arc(x, y, Math.max(0.5, strokePx / 2), 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.moveTo(x, y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    return
  }

  ctx.beginPath()
  ctx.moveTo(layer.points[0].x * width, layer.points[0].y * height)
  if (count === 2) {
    ctx.lineTo(layer.points[1].x * width, layer.points[1].y * height)
  } else {
    for (let i = 1; i < count - 1; i += 1) {
      const cx = layer.points[i].x * width
      const cy = layer.points[i].y * height
      const mx = ((layer.points[i].x + layer.points[i + 1].x) / 2) * width
      const my = ((layer.points[i].y + layer.points[i + 1].y) / 2) * height
      if (typeof ctx.quadraticCurveTo === 'function') ctx.quadraticCurveTo(cx, cy, mx, my)
      else ctx.lineTo(mx, my)
    }
    ctx.lineTo(layer.points[count - 1].x * width, layer.points[count - 1].y * height)
  }
  ctx.stroke()
}

function renderRectLayer(ctx: AnnotationCanvasContext, width: number, height: number, minDim: number, layer: RectAnnotationLayer, strokePx: number): void {
  const rw = Math.abs(layer.width) * width
  const rh = Math.abs(layer.height) * height
  if (rw <= 0 || rh <= 0) return
  const rx = layer.width < 0 ? (layer.x + layer.width) * width : layer.x * width
  const ry = layer.height < 0 ? (layer.y + layer.height) * height : layer.y * height
  const radius = Math.max(0, (layer.cornerRadius ?? DEFAULT_RECT_CORNER_RADIUS) * minDim)
  ctx.strokeStyle = layer.color
  ctx.lineWidth = strokePx
  ctx.lineJoin = 'round'
  traceRoundedRectPath(ctx as Parameters<typeof traceRoundedRectPath>[0], rx, ry, rw, rh, radius)
  ctx.stroke()
}

function renderArrowLayer(ctx: AnnotationCanvasContext, width: number, height: number, layer: ArrowAnnotationLayer, strokePx: number): void {
  const x1 = layer.x1 * width
  const y1 = layer.y1 * height
  const x2 = layer.x2 * width
  const y2 = layer.y2 * height
  const len = Math.hypot(x2 - x1, y2 - y1)

  if (len < 0.5) {
    if (typeof ctx.arc === 'function') {
      ctx.fillStyle = layer.color
      ctx.beginPath()
      ctx.arc(x1, y1, Math.max(0.5, strokePx / 2), 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLength = Math.min(len * 0.65, Math.max(strokePx * 3.4, 12))
  const halfW = (headLength * 0.72) / 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  ctx.strokeStyle = layer.color
  ctx.lineWidth = strokePx
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 - cos * headLength * 0.65, y2 - sin * headLength * 0.65)
  ctx.stroke()

  const baseX = x2 - cos * headLength
  const baseY = y2 - sin * headLength
  ctx.fillStyle = layer.color
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(baseX + sin * halfW, baseY - cos * halfW)
  ctx.lineTo(baseX - sin * halfW, baseY + cos * halfW)
  ctx.closePath()
  ctx.fill()
}

function renderTextLayer(ctx: AnnotationCanvasContext, width: number, height: number, minDim: number, layer: TextAnnotationLayer): void {
  if (!layer.text) return
  const tx = layer.x * width
  const ty = layer.y * height
  const fontPx = Math.max(10, Math.round(layer.fontSize * minDim))
  const lineHeight = Math.round(fontPx * 1.25)

  ctx.font = `700 ${fontPx}px ${ANNOTATION_FONT_STACK}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const lines = wrapTextLines(ctx, layer.text, Math.max(1, Math.abs(layer.width) * width), fontPx)
  const haloColor = getContrastHaloColor(layer.color)
  const outlineWidth = Math.max(2, Math.round(fontPx * 0.12))

  ctx.shadowColor = haloColor
  ctx.shadowBlur = Math.max(2, Math.round(fontPx * 0.14))
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = Math.max(1, Math.round(fontPx * 0.04))

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line) continue
    const lineY = ty + i * lineHeight
    if (typeof ctx.strokeText === 'function') {
      ctx.strokeStyle = haloColor
      ctx.lineWidth = outlineWidth
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.strokeText(line, tx, lineY)
    }
    ctx.fillStyle = layer.color
    ctx.fillText(line, tx, lineY)
  }
}

export function renderAnnotationsToCanvas(
  ctx: AnnotationCanvasContext,
  width: number,
  height: number,
  layers: readonly AnnotationLayer[],
): void {
  if (width <= 0 || height <= 0 || layers.length === 0) return
  const minDim = Math.min(width, height)
  for (const layer of layers) {
    const strokePx = Math.max(1, layer.strokeWidth * minDim)
    ctx.save()
    try {
      if (layer.type === 'brush') renderBrushLayer(ctx, width, height, layer, strokePx)
      else if (layer.type === 'rect') renderRectLayer(ctx, width, height, minDim, layer, strokePx)
      else if (layer.type === 'arrow') renderArrowLayer(ctx, width, height, layer, strokePx)
      else renderTextLayer(ctx, width, height, minDim, layer)
    } finally {
      ctx.restore()
    }
  }
}

export async function renderAnnotatedImageToBlob(
  source: ImageDrawable,
  width: number,
  height: number,
  layers: readonly AnnotationLayer[],
  options?: RenderAnnotatedImageOptions,
): Promise<RenderAnnotatedImageResult> {
  const safeSrcW = Math.max(1, Math.round(Number.isFinite(width) ? width : 1))
  const safeSrcH = Math.max(1, Math.round(Number.isFinite(height) ? height : 1))
  const clamped = clampCanvasDimensions(safeSrcW, safeSrcH)
  const format: ImageFormat = options?.format ?? 'image/png'

  const canvas = createCanvas(clamped.width, clamped.height, options?.createCanvas)
  const ctx = get2dContext(canvas)
  if (format === 'image/jpeg') fillBackground(ctx, clamped.width, clamped.height, '#ffffff')

  const naturalSrc = source as { naturalWidth?: number; naturalHeight?: number }
  const drawSrcW = naturalSrc.naturalWidth && naturalSrc.naturalWidth > 0 ? naturalSrc.naturalWidth : safeSrcW
  const drawSrcH = naturalSrc.naturalHeight && naturalSrc.naturalHeight > 0 ? naturalSrc.naturalHeight : safeSrcH
  ctx.drawImage(source, 0, 0, drawSrcW, drawSrcH, 0, 0, clamped.width, clamped.height)

  renderAnnotationsToCanvas(ctx as unknown as AnnotationCanvasContext, clamped.width, clamped.height, layers)

  const blob = await canvasToBlob(canvas, format, options?.quality)
  const mimeType = resolveEncodedImageFormat(format, blob)
  const dataUrl = await encodeBlobToDataUrl(blob, mimeType)

  return { blob, dataUrl, width: clamped.width, height: clamped.height, mimeType }
}
