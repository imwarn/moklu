/**
 * [INPUT]: depends on canvasHelpers for offline image loading and canvas creation, ./portraitMattingMath for Guided Filter/CIELAB/decontamination/framing, lazy onnxruntime-web/wasm plus local .wasm/.mjs?url assets, and ID photo types from ./types
 * [OUTPUT]: exports extractPortraitMatte, setPortraitMattingOverride, resetPortraitMattingCache, and re-exports guidedFilterAlpha, computePureBackdropAlpha, estimateOuterBackgroundRgb, decontaminatePixelRgb, and detectPortraitFramingFromAlpha
 * [POS]: 100% browser-local MODNet FP16 portrait matting runtime & Cache API loader in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { clampNumber, createCanvas, get2dContext, loadImageItem } from './canvasHelpers'
import {
  computePureBackdropAlpha,
  decontaminatePixelRgb,
  detectPortraitFramingFromAlpha,
  estimateOuterBackgroundRgb,
  guidedFilterAlpha,
} from './portraitMattingMath'
import type {
  ExtractPortraitMatteOptions,
  ImageInputSource,
  LoadedImageItem,
  PortraitMatteData,
} from './types'

export {
  computePureBackdropAlpha,
  decontaminatePixelRgb,
  detectPortraitFramingFromAlpha,
  estimateOuterBackgroundRgb,
  guidedFilterAlpha,
}

export type PortraitMattingInferenceFn = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
) => Promise<Float32Array>

const DEFAULT_MODEL_URL = '/models/modnet-fp16.onnx'
const MODEL_CACHE_NAME = 'moklu-ai-models-v1'
const MAX_WORKING_DIMENSION = 2048
const MODNET_SHORT_EDGE = 512
const MODNET_MAX_LONG_EDGE = 1024

interface OrtSessionLike {
  run(feeds: Record<string, unknown>): Promise<Record<string, { data: ArrayLike<number> }>>
}

interface OrtTensorCtor {
  new (type: 'float32', data: Float32Array, dims: readonly number[]): unknown
}

interface OrtRuntimeBundle {
  Tensor: OrtTensorCtor
  session: OrtSessionLike
}

let cachedOrtUrl: string | null = null
let cachedOrtPromise: Promise<OrtRuntimeBundle> | null = null
let testMattingOverride: PortraitMattingInferenceFn | null = null

/**
 * Override neural portrait matting inference for deterministic unit tests without loading ONNX WASM.
 * Pass null to restore the lazy onnxruntime-web/wasm MODNet FP16 pipeline.
 */
export function setPortraitMattingOverride(fn: PortraitMattingInferenceFn | null): void {
  testMattingOverride = fn
}

/**
 * Clear cached ONNX Runtime session promises and any active test override.
 */
export function resetPortraitMattingCache(): void {
  cachedOrtUrl = null
  cachedOrtPromise = null
  testMattingOverride = null
}

async function fetchModelBytesWithCache(
  modelUrl: string,
  onProgress?: ExtractPortraitMatteOptions['onProgress'],
): Promise<Uint8Array> {
  onProgress?.('downloading', 0)

  const canCache = typeof caches !== 'undefined' && typeof caches.open === 'function'
  if (canCache) {
    try {
      const cache = await caches.open(MODEL_CACHE_NAME)
      const cached = await cache.match(modelUrl)
      if (cached) {
        const buffer = await cached.arrayBuffer()
        onProgress?.('downloading', 1)
        return new Uint8Array(buffer)
      }
    } catch {
      // Ignore Cache API restrictions (e.g. private browsing) and fall back to same-origin fetch.
    }
  }

  const response = await fetch(modelUrl, { credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error(`Failed to fetch portrait matting model (${response.status} ${response.statusText}).`)
  }

  const cacheClone = canCache ? response.clone() : null
  const contentLength = Number(response.headers.get('content-length') ?? '0')
  let bytes: Uint8Array

  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength > 0) {
        chunks.push(value)
        received += value.byteLength
        if (contentLength > 0) {
          onProgress?.('downloading', clampNumber(received / contentLength, 0, 0.99))
        }
      }
    }

    bytes = new Uint8Array(received)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
  } else {
    bytes = new Uint8Array(await response.arrayBuffer())
  }

  if (cacheClone && canCache) {
    try {
      const cache = await caches.open(MODEL_CACHE_NAME)
      await cache.put(modelUrl, cacheClone)
    } catch {
      // Non-fatal if browser storage quota is exceeded.
    }
  }

  onProgress?.('downloading', 1)
  return bytes
}

async function loadModnetSession(
  modelUrl: string,
  onProgress?: ExtractPortraitMatteOptions['onProgress'],
): Promise<OrtRuntimeBundle> {
  if (cachedOrtPromise && cachedOrtUrl === modelUrl) {
    onProgress?.('downloading', 1)
    return cachedOrtPromise
  }

  const pending: Promise<OrtRuntimeBundle> = (async () => {
    const [ort, wasmUrlMod, mjsUrlMod, modelBytes] = await Promise.all([
      import('onnxruntime-web/wasm'),
      import('onnxruntime-web/ort-wasm-simd-threaded.wasm?url'),
      import('onnxruntime-web/ort-wasm-simd-threaded.mjs?url'),
      fetchModelBytesWithCache(modelUrl, onProgress),
    ])

    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = {
      mjs: mjsUrlMod.default,
      wasm: wasmUrlMod.default,
    }

    const session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })

    return {
      Tensor: ort.Tensor as unknown as OrtTensorCtor,
      session: session as unknown as OrtSessionLike,
    }
  })().catch((err) => {
    cachedOrtUrl = null
    cachedOrtPromise = null
    throw err
  })

  cachedOrtUrl = modelUrl
  cachedOrtPromise = pending
  return pending
}

function computeModnetInputSize(width: number, height: number): { inW: number; inH: number } {
  const shortSide = Math.min(width, height)
  let scale = shortSide > 0 ? MODNET_SHORT_EDGE / shortSide : 1
  const scaledLong = Math.max(width, height) * scale
  if (scaledLong > MODNET_MAX_LONG_EDGE) {
    scale = MODNET_MAX_LONG_EDGE / Math.max(width, height)
  }

  const inW = Math.max(32, Math.round((width * scale) / 32) * 32)
  const inH = Math.max(32, Math.round((height * scale) / 32) * 32)
  return { inW, inH }
}

function sampleRgbaToModnetTensor(
  rgba: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  inW: number,
  inH: number,
): Float32Array {
  const planeSize = inW * inH
  const tensor = new Float32Array(3 * planeSize)

  for (let y = 0; y < inH; y += 1) {
    const sy = inH > 1 ? (y * (srcH - 1)) / (inH - 1) : 0
    const y0 = Math.floor(sy)
    const y1 = Math.min(srcH - 1, y0 + 1)
    const fy = sy - y0

    for (let x = 0; x < inW; x += 1) {
      const sx = inW > 1 ? (x * (srcW - 1)) / (inW - 1) : 0
      const x0 = Math.floor(sx)
      const x1 = Math.min(srcW - 1, x0 + 1)
      const fx = sx - x0

      const i00 = (y0 * srcW + x0) * 4
      const i10 = (y0 * srcW + x1) * 4
      const i01 = (y1 * srcW + x0) * 4
      const i11 = (y1 * srcW + x1) * 4

      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy

      const r = rgba[i00] * w00 + rgba[i10] * w10 + rgba[i01] * w01 + rgba[i11] * w11
      const g = rgba[i00 + 1] * w00 + rgba[i10 + 1] * w10 + rgba[i01 + 1] * w01 + rgba[i11 + 1] * w11
      const b = rgba[i00 + 2] * w00 + rgba[i10 + 2] * w10 + rgba[i01 + 2] * w01 + rgba[i11 + 2] * w11

      const dst = y * inW + x
      tensor[dst] = r / 127.5 - 1
      tensor[planeSize + dst] = g / 127.5 - 1
      tensor[2 * planeSize + dst] = b / 127.5 - 1
    }
  }

  return tensor
}

function upsampleAlphaBilinear(
  src: ArrayLike<number>,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Float32Array {
  const out = new Float32Array(dstW * dstH)
  for (let y = 0; y < dstH; y += 1) {
    const sy = dstH > 1 ? (y * (srcH - 1)) / (dstH - 1) : 0
    const y0 = Math.floor(sy)
    const y1 = Math.min(srcH - 1, y0 + 1)
    const fy = sy - y0

    for (let x = 0; x < dstW; x += 1) {
      const sx = dstW > 1 ? (x * (srcW - 1)) / (dstW - 1) : 0
      const x0 = Math.floor(sx)
      const x1 = Math.min(srcW - 1, x0 + 1)
      const fx = sx - x0

      const v00 = src[y0 * srcW + x0] ?? 0
      const v10 = src[y0 * srcW + x1] ?? 0
      const v01 = src[y1 * srcW + x0] ?? 0
      const v11 = src[y1 * srcW + x1] ?? 0

      const val =
        v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy
      out[y * dstW + x] = clampNumber(val, 0, 1)
    }
  }
  return out
}

async function runModnetInference(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  modelUrl: string,
  onProgress?: ExtractPortraitMatteOptions['onProgress'],
): Promise<Float32Array> {
  if (testMattingOverride) {
    onProgress?.('inferring', 0.5)
    const alpha = await testMattingOverride(rgba, width, height)
    onProgress?.('inferring', 1)
    return alpha
  }

  const { Tensor, session } = await loadModnetSession(modelUrl, onProgress)
  onProgress?.('inferring', 0.25)

  const { inW, inH } = computeModnetInputSize(width, height)
  const inputData = sampleRgbaToModnetTensor(rgba, width, height, inW, inH)
  const inputTensor = new Tensor('float32', inputData, [1, 3, inH, inW])

  const outputs = await session.run({ input: inputTensor })
  const outputTensor = outputs.output
  if (!outputTensor) {
    throw new Error('MODNet session did not return the expected "output" tensor.')
  }

  onProgress?.('inferring', 1)
  return upsampleAlphaBilinear(outputTensor.data, inW, inH, width, height)
}

function isLoadedImageItem(input: LoadedImageItem | ImageInputSource): input is LoadedImageItem {
  return (
    typeof input === 'object' &&
    input !== null &&
    'source' in input &&
    'width' in input &&
    'height' in input &&
    'dispose' in input
  )
}

/**
 * Extract a reusable full-resolution portrait alpha matte locally via MODNet FP16 (WASM)
 * with O(N) Guided Filter refinement or 0 MB CIELAB border-connected studio backdrop separation.
 */
export async function extractPortraitMatte(
  image: LoadedImageItem | ImageInputSource,
  options: ExtractPortraitMatteOptions = {},
): Promise<PortraitMatteData> {
  const ownsItem = !isLoadedImageItem(image)
  const item = ownsItem ? await loadImageItem(image) : image

  try {
    const scale = Math.min(1, MAX_WORKING_DIMENSION / Math.max(1, item.width, item.height))
    const width = Math.max(1, Math.round(item.width * scale))
    const height = Math.max(1, Math.round(item.height * scale))

    const canvas = createCanvas(width, height, options.createCanvas)
    const ctx = get2dContext(canvas)
    ctx.drawImage(item.source, 0, 0, item.width, item.height, 0, 0, width, height)

    let sourceRgba: Uint8ClampedArray
    if (typeof ctx.getImageData === 'function') {
      const imageData = ctx.getImageData(0, 0, width, height)
      sourceRgba = new Uint8ClampedArray(imageData.data)
    } else {
      sourceRgba = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < sourceRgba.length; i += 4) {
        sourceRgba[i] = 180
        sourceRgba[i + 1] = 180
        sourceRgba[i + 2] = 180
        sourceRgba[i + 3] = 255
      }
    }

    const modeUsed = options.mode ?? 'ai'
    let guidedAlpha: Float32Array

    if (modeUsed === 'pure-backdrop') {
      options.onProgress?.('refining', 0.25)
      guidedAlpha = computePureBackdropAlpha(sourceRgba, width, height)
      options.onProgress?.('refining', 1)
    } else {
      const rawAlpha = await runModnetInference(
        sourceRgba,
        width,
        height,
        options.modelUrl ?? DEFAULT_MODEL_URL,
        options.onProgress,
      )
      options.onProgress?.('refining', 0.35)
      guidedAlpha = guidedFilterAlpha(sourceRgba, rawAlpha, width, height, 4, 1e-3)
      options.onProgress?.('refining', 1)
    }

    const estimatedBgRgb = estimateOuterBackgroundRgb(sourceRgba, width, height, guidedAlpha)
    const framing = detectPortraitFramingFromAlpha(guidedAlpha, width, height)

    return {
      width,
      height,
      sourceRgba,
      guidedAlpha,
      estimatedBgRgb,
      modeUsed,
      framing,
    }
  } finally {
    if (ownsItem) {
      item.dispose()
    }
  }
}
