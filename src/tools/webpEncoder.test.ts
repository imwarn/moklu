/**
 * [INPUT]: depends on vitest, ./webpEncoder, and ImageDataLike from ./types
 * [OUTPUT]: unit tests covering quality mapping/clamping, RGBA validation, injectable and override WASM WebP encoding, ArrayBuffer/Uint8Array Blob conversion, and cache reset behavior
 * [POS]: unit test suite for src/tools/webpEncoder.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImageDataLike } from './types'
import {
  encodeWebpWithWasm,
  resetWebpWasmEncoderCache,
  setWebpWasmEncoderOverride,
} from './webpEncoder'

// Minimal synthetic RIFF/WEBP header bytes for deterministic unit assertions.
const FAKE_WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
])

function makeImageData(width: number, height: number): ImageDataLike {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  }
}

describe('webpEncoder', () => {
  afterEach(() => {
    resetWebpWasmEncoderCache()
    vi.restoreAllMocks()
  })

  it('maps 0..1 quality to 5..100 libwebp scale with 0.82 default and returns an image/webp Blob', async () => {
    const receivedQualities: number[] = []
    const wasmEncoder = vi.fn(async (_img: ImageDataLike, opts: { quality: number }) => {
      receivedQualities.push(opts.quality)
      return FAKE_WEBP_BYTES.buffer.slice(0)
    })

    const img = makeImageData(4, 3)

    const defaultBlob = await encodeWebpWithWasm(img, { wasmEncoder })
    expect(defaultBlob.type).toBe('image/webp')
    expect(defaultBlob.size).toBe(FAKE_WEBP_BYTES.byteLength)

    await encodeWebpWithWasm(img, { quality: 0.5, wasmEncoder })
    await encodeWebpWithWasm(img, { quality: 0, wasmEncoder })
    await encodeWebpWithWasm(img, { quality: 1.5, wasmEncoder })
    await encodeWebpWithWasm(img, { quality: Number.NaN, wasmEncoder })

    expect(receivedQualities).toEqual([82, 50, 5, 100, 82])
    expect(wasmEncoder).toHaveBeenCalledTimes(5)
  })

  it('accepts Uint8Array slices returned from custom WASM encoders without leaking full backing buffers', async () => {
    const oversized = new Uint8Array(64)
    oversized.set(FAKE_WEBP_BYTES, 12)
    const slice = oversized.subarray(12, 12 + FAKE_WEBP_BYTES.byteLength)

    const blob = await encodeWebpWithWasm(makeImageData(2, 2), {
      quality: 0.75,
      wasmEncoder: async () => slice,
    })

    expect(blob.type).toBe('image/webp')
    expect(blob.size).toBe(FAKE_WEBP_BYTES.byteLength)
    const outBytes = new Uint8Array(await blob.arrayBuffer())
    expect(Array.from(outBytes)).toEqual(Array.from(FAKE_WEBP_BYTES))
  })

  it('uses setWebpWasmEncoderOverride when options.wasmEncoder is omitted and clears it on reset', async () => {
    const overrideSpy = vi.fn(async () => FAKE_WEBP_BYTES.buffer.slice(0))
    const directSpy = vi.fn(async () => FAKE_WEBP_BYTES.buffer.slice(0))

    setWebpWasmEncoderOverride(overrideSpy)

    const viaOverride = await encodeWebpWithWasm(makeImageData(2, 2), { quality: 0.6 })
    expect(viaOverride.type).toBe('image/webp')
    expect(overrideSpy).toHaveBeenCalledTimes(1)
    expect(overrideSpy).toHaveBeenCalledWith(expect.objectContaining({ width: 2, height: 2 }), {
      quality: 60,
    })

    // Explicit options.wasmEncoder takes priority over global override.
    await encodeWebpWithWasm(makeImageData(2, 2), { quality: 0.9, wasmEncoder: directSpy })
    expect(directSpy).toHaveBeenCalledTimes(1)
    expect(overrideSpy).toHaveBeenCalledTimes(1)

    resetWebpWasmEncoderCache()
  })

  it('rejects invalid ImageData dimensions, undersized buffers, and empty encoder output', async () => {
    const noopEncoder = async () => FAKE_WEBP_BYTES.buffer.slice(0)

    await expect(
      encodeWebpWithWasm({ width: 0, height: 4, data: new Uint8ClampedArray(0) }, { wasmEncoder: noopEncoder }),
    ).rejects.toThrow(/Invalid ImageData dimensions/)

    await expect(
      encodeWebpWithWasm({ width: 4, height: 4, data: new Uint8ClampedArray(8) }, { wasmEncoder: noopEncoder }),
    ).rejects.toThrow(/buffer too small/)

    await expect(
      encodeWebpWithWasm(makeImageData(2, 2), { wasmEncoder: async () => new ArrayBuffer(0) }),
    ).rejects.toThrow(/empty buffer/)

    await expect(
      encodeWebpWithWasm(makeImageData(2, 2), { wasmEncoder: async () => new Uint8Array(0) }),
    ).rejects.toThrow(/empty buffer/)
  })
})
