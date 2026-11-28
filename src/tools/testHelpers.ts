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
  rotation: number
  translation: { x: number; y: number }
}

export interface RecordedStrokeCall {
  strokeStyle: string | CanvasGradientLike
  lineWidth: number
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
  strokes: RecordedStrokeCall[]
  shadowFills: number
  pixels?: Uint8ClampedArray
  encodedFormat?: string
  encodedQuality?: number
}

function parseHexColor(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ]
  }
  return null
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
  pixelBacked?: boolean
}): {
  createCanvas: CanvasFactory
  canvases: RecordedCanvas[]
} {
  const canvases: RecordedCanvas[] = []

  const createCanvas: CanvasFactory = (width, height): CanvasLike => {
    const pixelBuffer = options?.pixelBacked ? new Uint8ClampedArray(width * height * 4) : undefined
    const record: RecordedCanvas = {
      width,
      height,
      draws: [],
      texts: [],
      fillRects: [],
      gradients: [],
      clipCount: 0,
      strokeCount: 0,
      strokes: [],
      shadowFills: 0,
      pixels: pixelBuffer,
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
        if (pixelBuffer && typeof state.fillStyle === 'string') {
          const rgb = parseHexColor(state.fillStyle)
          if (rgb) {
            const x0 = Math.max(0, Math.floor(x))
            const y0 = Math.max(0, Math.floor(y))
            const x1 = Math.min(width, Math.ceil(x + w))
            const y1 = Math.min(height, Math.ceil(y + h))
            for (let py = y0; py < y1; py += 1) {
              for (let px = x0; px < x1; px += 1) {
                const idx = (py * width + px) * 4
                pixelBuffer[idx] = rgb[0]
                pixelBuffer[idx + 1] = rgb[1]
                pixelBuffer[idx + 2] = rgb[2]
                pixelBuffer[idx + 3] = 255
              }
            }
          }
        }
      },
      strokeRect() {
        record.strokeCount += 1
        record.strokes.push({ strokeStyle: state.strokeStyle, lineWidth: state.lineWidth })
      },
      fill() {
        if (state.shadowBlur > 0) {
          record.shadowFills += 1
        }
      },
      stroke() {
        record.strokeCount += 1
        record.strokes.push({ strokeStyle: state.strokeStyle, lineWidth: state.lineWidth })
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
        record.draws.push({
          image,
          sx,
          sy,
          sw,
          sh,
          dx,
          dy,
          dw,
          dh,
          filter: state.filter,
          rotation: state.rotation,
          translation: { x: state.tx, y: state.ty },
        })
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
      ...(pixelBuffer
        ? {
            createImageData(sw: number, sh: number) {
              return { width: sw, height: sh, data: new Uint8ClampedArray(sw * sh * 4) }
            },
            getImageData(sx: number, sy: number, sw: number, sh: number) {
              const out = new Uint8ClampedArray(sw * sh * 4)
              for (let row = 0; row < sh; row += 1) {
                const srcY = sy + row
                if (srcY < 0 || srcY >= height) continue
                for (let col = 0; col < sw; col += 1) {
                  const srcX = sx + col
                  if (srcX < 0 || srcX >= width) continue
                  const srcIdx = (srcY * width + srcX) * 4
                  const dstIdx = (row * sw + col) * 4
                  out[dstIdx] = pixelBuffer[srcIdx]
                  out[dstIdx + 1] = pixelBuffer[srcIdx + 1]
                  out[dstIdx + 2] = pixelBuffer[srcIdx + 2]
                  out[dstIdx + 3] = pixelBuffer[srcIdx + 3]
                }
              }
              return { width: sw, height: sh, data: out }
            },
            putImageData(imageData, dx: number, dy: number) {
              for (let row = 0; row < imageData.height; row += 1) {
                const dstY = dy + row
                if (dstY < 0 || dstY >= height) continue
                for (let col = 0; col < imageData.width; col += 1) {
                  const dstX = dx + col
                  if (dstX < 0 || dstX >= width) continue
                  const srcIdx = (row * imageData.width + col) * 4
                  const dstIdx = (dstY * width + dstX) * 4
                  pixelBuffer[dstIdx] = imageData.data[srcIdx]
                  pixelBuffer[dstIdx + 1] = imageData.data[srcIdx + 1]
                  pixelBuffer[dstIdx + 2] = imageData.data[srcIdx + 2]
                  pixelBuffer[dstIdx + 3] = imageData.data[srcIdx + 3]
                }
              }
            },
          }
        : {}),
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
