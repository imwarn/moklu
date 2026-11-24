/**
 * [INPUT]: depends on canvasHelpers (canvasToBlob, clampQuality, createCanvas, fillBackground, get2dContext), CanvasFactory from ./types, and lazy dynamic import('heic-to/csp')
 * [OUTPUT]: exports isHeicFile, decodeHeicToBlob, DecodeHeicOptions, DecodeHeicOutputType, DecodeHeicStage, HeicNativeDecoder, and HeicWasmDecoder
 * [POS]: zero-upload client-side HEIC/HEIF decoder in src/tools; attempts native browser decode first and dynamically loads CSP-safe LGPL-3.0 heic-to/csp only on fallback
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampQuality,
  createCanvas,
  fillBackground,
  get2dContext,
} from './canvasHelpers'
import type { CanvasFactory, ImageDrawable } from './types'

export type DecodeHeicOutputType = 'image/jpeg' | 'image/png'
export type DecodeHeicStage = 'native' | 'wasm' | 'done'

export type HeicNativeDecoder = (
  file: Blob,
  outputType: DecodeHeicOutputType,
  quality: number,
) => Promise<Blob | null>

export type HeicWasmDecoder = (args: {
  blob: Blob
  type: DecodeHeicOutputType
  quality: number
}) => Promise<Blob>

export interface DecodeHeicOptions {
  /** Target raster MIME type after decoding. Defaults to 'image/jpeg'. */
  outputType?: DecodeHeicOutputType
  /** Output JPEG quality in [0.05, 1]. Ignored for PNG. Defaults to 0.92. */
  quality?: number
  /** Lifecycle callback reporting 'native' -> ('wasm') -> 'done' transitions. */
  onStage?: (stage: DecodeHeicStage) => void
  /** Injectable native browser decoder hook for deterministic unit tests. */
  nativeDecode?: HeicNativeDecoder
  /** Injectable WASM decoder hook for deterministic unit tests. */
  wasmDecoder?: HeicWasmDecoder
  /** Optional canvas factory used when re-encoding natively decoded images. */
  createCanvas?: CanvasFactory
}

const HEIC_MIME_RE = /image\/hei[cf]/i
const HEIC_EXT_RE = /\.hei[cf]$/i

/**
 * Detect whether a file-like descriptor represents a HEIC/HEIF image by MIME type or extension.
 */
export function isHeicFile(file: { name?: string; type?: string }): boolean {
  const mime = file.type?.trim() ?? ''
  if (mime && HEIC_MIME_RE.test(mime)) return true
  const name = file.name?.trim() ?? ''
  if (name && HEIC_EXT_RE.test(name)) return true
  return false
}

async function encodeDrawableToBlob(
  drawable: ImageDrawable,
  width: number,
  height: number,
  outputType: DecodeHeicOutputType,
  quality: number,
  createCanvasFn?: CanvasFactory,
): Promise<Blob> {
  const safeW = Math.max(1, Math.round(width))
  const safeH = Math.max(1, Math.round(height))
  const canvas = createCanvas(safeW, safeH, createCanvasFn)
  const ctx = get2dContext(canvas)
  if (outputType === 'image/jpeg') {
    fillBackground(ctx, safeW, safeH, '#ffffff')
  }
  ctx.drawImage(drawable, 0, 0, safeW, safeH, 0, 0, safeW, safeH)
  return canvasToBlob(canvas, outputType, quality)
}

async function tryBrowserNativeDecode(
  file: Blob,
  outputType: DecodeHeicOutputType,
  quality: number,
  createCanvasFn?: CanvasFactory,
): Promise<Blob | null> {
  if (typeof createImageBitmap === 'function') {
    let bitmap: ImageBitmap | null = null
    try {
      bitmap = await createImageBitmap(file)
      if (bitmap.width > 0 && bitmap.height > 0) {
        const blob = await encodeDrawableToBlob(
          bitmap,
          bitmap.width,
          bitmap.height,
          outputType,
          quality,
          createCanvasFn,
        )
        if (blob.size > 0) return blob
      }
    } catch {
      // Browser lacks native createImageBitmap HEIC support; try HTMLImageElement next.
    } finally {
      bitmap?.close?.()
    }
  }

  if (
    typeof Image !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  ) {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image()
        element.decoding = 'async'
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('Native HTMLImageElement HEIC decode failed.'))
        element.src = objectUrl
      })
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (width > 0 && height > 0) {
        const blob = await encodeDrawableToBlob(
          img,
          width,
          height,
          outputType,
          quality,
          createCanvasFn,
        )
        if (blob.size > 0) return blob
      }
    } catch {
      // Fall through to dynamic WASM decoder.
    } finally {
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }

  return null
}

async function runDynamicHeicToDecoder(args: {
  blob: Blob
  type: DecodeHeicOutputType
  quality: number
}): Promise<Blob> {
  // Use the CSP-safe build (`heic-to/csp`) which contains zero eval/new Function calls
  // and loads on demand so the main application bundle remains 0 KB heavier.
  const { heicTo } = await import('heic-to/csp')
  return heicTo({
    blob: args.blob,
    type: args.type,
    quality: args.type === 'image/png' ? undefined : args.quality,
  })
}

/**
 * Decode a HEIC/HEIF Blob locally to JPEG or PNG.
 * Attempts zero-overhead native browser decode first (e.g. Safari) before
 * dynamically importing the CSP-safe local HEIC decoder chunk.
 */
export async function decodeHeicToBlob(
  file: Blob,
  options?: DecodeHeicOptions,
): Promise<Blob> {
  const outputType: DecodeHeicOutputType = options?.outputType ?? 'image/jpeg'
  const quality = clampQuality(options?.quality, 0.92)

  options?.onStage?.('native')
  try {
    const nativeBlob = options?.nativeDecode
      ? await options.nativeDecode(file, outputType, quality)
      : await tryBrowserNativeDecode(file, outputType, quality, options?.createCanvas)
    if (nativeBlob && nativeBlob.size > 0) {
      options?.onStage?.('done')
      return nativeBlob
    }
  } catch {
    // Native decode unavailable or rejected; continue to WASM fallback.
  }

  options?.onStage?.('wasm')
  const decoder = options?.wasmDecoder ?? runDynamicHeicToDecoder
  const decoded = await decoder({ blob: file, type: outputType, quality })
  options?.onStage?.('done')
  return decoded
}
