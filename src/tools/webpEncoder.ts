/**
 * [INPUT]: depends on ImageDataLike from ./types and lazy dynamic imports of @jsquash/webp/encode plus local .wasm?url binaries
 * [OUTPUT]: exports encodeWebpWithWasm, resetWebpWasmEncoderCache, setWebpWasmEncoderOverride, EncodeWebpWasmOptions, and WebpWasmEncoder
 * [POS]: zero-upload lazy WASM WebP encoder in src/tools; loaded on demand only when browser Canvas 2D lacks native image/webp encoding (e.g. iOS Safari / WebKit)
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ImageDataLike } from './types'

export type WebpWasmEncoder = (
  imageData: ImageDataLike,
  options: { quality: number },
) => Promise<ArrayBuffer | Uint8Array>

export interface EncodeWebpWasmOptions {
  /** Lossy WebP quality in [0.05, 1]. Mapped to 5..100 for libwebp. Defaults to 0.82. */
  quality?: number
  /** Injectable WASM encoder hook for deterministic unit tests. */
  wasmEncoder?: WebpWasmEncoder
}

type DynamicWebpEncodeFn = (
  data: ImageData,
  options?: { quality?: number },
) => Promise<ArrayBuffer>

let cachedEncoderPromise: Promise<DynamicWebpEncodeFn> | null = null
let testEncoderOverride: WebpWasmEncoder | null = null

function clampWebpQuality(quality?: number, fallback = 0.82): number {
  const value = quality ?? fallback
  if (!Number.isFinite(value)) return fallback
  return Math.min(1, Math.max(0.05, value))
}

function toLibwebpQuality(quality?: number): number {
  return Math.round(clampWebpQuality(quality, 0.82) * 100)
}

function assertValidImageData(imageData: ImageDataLike): void {
  const width = Math.floor(imageData.width)
  const height = Math.floor(imageData.height)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid ImageData dimensions (${imageData.width}x${imageData.height}) for WebP encoding.`)
  }
  const requiredBytes = width * height * 4
  if (imageData.data.byteLength < requiredBytes) {
    throw new Error(
      `ImageData buffer too small for ${width}x${height} RGBA pixels (${imageData.data.byteLength} < ${requiredBytes}).`,
    )
  }
}

function toWebpBlob(encoded: ArrayBuffer | Uint8Array): Blob {
  if (encoded instanceof ArrayBuffer) {
    if (encoded.byteLength === 0) {
      throw new Error('WASM WebP encoder returned an empty buffer.')
    }
    return new Blob([encoded], { type: 'image/webp' })
  }
  if (encoded.byteLength === 0) {
    throw new Error('WASM WebP encoder returned an empty buffer.')
  }
  const copy = new Uint8Array(encoded.byteLength)
  copy.set(encoded)
  return new Blob([copy.buffer], { type: 'image/webp' })
}

async function loadDynamicWebpEncoder(): Promise<DynamicWebpEncodeFn> {
  if (!cachedEncoderPromise) {
    cachedEncoderPromise = (async () => {
      const [{ default: encode, init }, { default: webpEncUrl }, { default: webpEncSimdUrl }] =
        await Promise.all([
          import('@jsquash/webp/encode'),
          import('@jsquash/webp/codec/enc/webp_enc.wasm?url'),
          import('@jsquash/webp/codec/enc/webp_enc_simd.wasm?url'),
        ])

      await init({
        locateFile: (path: string) =>
          path.endsWith('webp_enc_simd.wasm') ? webpEncSimdUrl : webpEncUrl,
      })

      return encode
    })().catch((err) => {
      cachedEncoderPromise = null
      throw err
    })
  }
  return cachedEncoderPromise
}

async function runDynamicWebpEncoder(
  imageData: ImageDataLike,
  options: { quality: number },
): Promise<ArrayBuffer> {
  const encode = await loadDynamicWebpEncoder()
  return encode(imageData as unknown as ImageData, { quality: options.quality })
}

/**
 * Reset the cached dynamic WASM encoder promise and any test encoder override.
 * Intended for deterministic test isolation and recovery after transient load failures.
 */
export function resetWebpWasmEncoderCache(): void {
  cachedEncoderPromise = null
  testEncoderOverride = null
}

/**
 * Override the default WASM encoder for deterministic Node unit tests without
 * loading real .wasm binaries over HTTP. Pass null to restore the lazy @jsquash/webp loader.
 */
export function setWebpWasmEncoderOverride(encoder: WebpWasmEncoder | null): void {
  testEncoderOverride = encoder
}

/**
 * Encode RGBA pixel data into a real image/webp Blob using lazy client-side libwebp WASM.
 * Main bundle impact is 0 KB; native-WebP browsers never trigger the dynamic import.
 */
export async function encodeWebpWithWasm(
  imageData: ImageDataLike,
  options?: EncodeWebpWasmOptions,
): Promise<Blob> {
  assertValidImageData(imageData)
  const libwebpQuality = toLibwebpQuality(options?.quality)
  const encoder = options?.wasmEncoder ?? testEncoderOverride ?? runDynamicWebpEncoder
  const encoded = await encoder(imageData, { quality: libwebpQuality })
  return toWebpBlob(encoded)
}
