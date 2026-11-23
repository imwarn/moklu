/**
 * [INPUT]: depends on CanvasContextLike, CanvasFactory, CanvasLike, and LoadedImageItem from ./types
 * [OUTPUT]: exports createRecordingCanvasFactory, makeMockImageItem, and RecordedCanvasCall types
 * [POS]: deterministic Node-environment Canvas 2D spy and mock image fixture shared by src/tools tests
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type {
  CanvasContextLike,
  CanvasFactory,
  CanvasGradientLike,
  CanvasLike,
  ImageDrawable,
  LoadedImageItem,
} from './types'

export interface RecordedDrawImageCall {
  image: ImageDrawable
  sx: number
  sy: number
  sw: number
  sh: number
  dx: number
  dy: number
  dw: number
  dh: number
  filter: string
}

export interface RecordedFillTextCall {
  text: string
  x: number
  y: number
  alpha: number
  fillStyle: string | CanvasGradientLike
  font: string
  rotation: number
  translation: { x: number; y: number }
}

export interface RecordedGradient {
  x0: number
  y0: number
  x1: number
  y1: number
  stops: Array<{ offset: number; color: string }>
}

export interface RecordedCanvas {
  width: number
  height: number
  draws: RecordedDrawImageCall[]
  texts: RecordedFillTextCall[]
  fillRects: Array<{ x: number; y: number; w: number; h: number; fillStyle: string | CanvasGradientLike }>
  gradients: RecordedGradient[]
  clipCount: number
  strokeCount: number
  shadowFills: number
  encodedFormat?: string
  encodedQuality?: number
}

interface TransformState {
  tx: number
  ty: number
  rotation: number
  filter: string
  globalAlpha: number
  fillStyle: string | CanvasGradientLike
  strokeStyle: string | CanvasGradientLike
  lineWidth: number
  font: string
  shadowBlur: number
}

export function createRecordingCanvasFactory(options?: {
  blobSizeFor?: (format: string, quality?: number, width?: number, height?: number) => number
}): {
  createCanvas: CanvasFactory
  canvases: RecordedCanvas[]
} {
  const canvases: RecordedCanvas[] = []

  const createCanvas: CanvasFactory = (width, height): CanvasLike => {
    const record: RecordedCanvas = {
      width,
      height,
      draws: [],
      texts: [],
      fillRects: [],
      gradients: [],
      clipCount: 0,
      strokeCount: 0,
      shadowFills: 0,
    }
    canvases.push(record)

    let state: TransformState = {
      tx: 0,
      ty: 0,
      rotation: 0,
      filter: 'none',
      globalAlpha: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
      shadowBlur: 0,
    }
    const stack: TransformState[] = []

    const ctx: CanvasContextLike = {
      get fillStyle() {
        return state.fillStyle
      },
      set fillStyle(val) {
        state.fillStyle = val
      },
      get strokeStyle() {
        return state.strokeStyle
      },
      set strokeStyle(val) {
        state.strokeStyle = val
      },
      get lineWidth() {
        return state.lineWidth
      },
      set lineWidth(val) {
        state.lineWidth = val
      },
      get globalAlpha() {
        return state.globalAlpha
      },
      set globalAlpha(val) {
        state.globalAlpha = val
      },
      get font() {
        return state.font
      },
      set font(val) {
        state.font = val
      },
      textAlign: 'start',
      textBaseline: 'alphabetic',
      get filter() {
        return state.filter
      },
      set filter(val) {
        state.filter = val
      },
      shadowColor: 'rgba(0, 0, 0, 0)',
      get shadowBlur() {
        return state.shadowBlur
      },
      set shadowBlur(val) {
        state.shadowBlur = val
      },
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      save() {
        stack.push({ ...state })
      },
      restore() {
        const prev = stack.pop()
        if (prev) state = prev
      },
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arcTo() {},
      rect() {},
      clip() {
        record.clipCount += 1
      },
      clearRect() {},
      fillRect(x, y, w, h) {
        record.fillRects.push({ x, y, w, h, fillStyle: state.fillStyle })
      },
      strokeRect() {
        record.strokeCount += 1
      },
      fill() {
        if (state.shadowBlur > 0) {
          record.shadowFills += 1
        }
      },
      stroke() {
        record.strokeCount += 1
      },
      translate(x, y) {
        state.tx += x
        state.ty += y
      },
      rotate(angle) {
        state.rotation += angle
      },
      scale() {},
      createLinearGradient(x0, y0, x1, y1) {
        const grad: RecordedGradient = { x0, y0, x1, y1, stops: [] }
        record.gradients.push(grad)
        return {
          addColorStop(offset: number, color: string) {
            grad.stops.push({ offset, color })
          },
        }
      },
      drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        record.draws.push({ image, sx, sy, sw, sh, dx, dy, dw, dh, filter: state.filter })
      },
      fillText(text, x, y) {
        record.texts.push({
          text,
          x,
          y,
          alpha: state.globalAlpha,
          fillStyle: state.fillStyle,
          font: state.font,
          rotation: state.rotation,
          translation: { x: state.tx, y: state.ty },
        })
      },
    }

    return {
      width,
      height,
      getContext(contextId: '2d') {
        return contextId === '2d' ? ctx : null
      },
      async convertToBlob(blobOpts) {
        const format = blobOpts?.type ?? 'image/png'
        const quality = blobOpts?.quality
        record.encodedFormat = format
        record.encodedQuality = quality
        const size = options?.blobSizeFor
          ? options.blobSizeFor(format, quality, width, height)
          : Math.max(64, Math.round((width * height) / 100))
        return new Blob([new Uint8Array(size)], { type: format })
      },
    }
  }

  return { createCanvas, canvases }
}

export function makeMockImageItem(
  overrides: Partial<LoadedImageItem> & { width: number; height: number },
): LoadedImageItem {
  const id = overrides.id ?? `mock-${overrides.width}x${overrides.height}`
  const name = overrides.name ?? `${id}.png`
  return {
    id,
    name,
    width: overrides.width,
    height: overrides.height,
    source: overrides.source ?? { width: overrides.width, height: overrides.height, label: name },
    originalBytes: overrides.originalBytes ?? overrides.width * overrides.height,
    mimeType: overrides.mimeType ?? 'image/png',
    dispose: overrides.dispose ?? (() => {}),
  }
}
