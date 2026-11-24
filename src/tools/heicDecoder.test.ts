/**
 * [INPUT]: depends on vitest and ./heicDecoder
 * [OUTPUT]: unit tests covering isHeicFile detection, native-first decode fast path, WASM fallback stage transitions, quality clamping, and error propagation
 * [POS]: deterministic Node unit test suite for src/tools/heicDecoder.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { describe, expect, it, vi } from 'vitest'
import { decodeHeicToBlob, isHeicFile, type DecodeHeicStage } from './heicDecoder'

describe('heicDecoder', () => {
  it('detects HEIC and HEIF files by MIME type or filename extension case-insensitively', () => {
    expect(isHeicFile({ name: 'IMG_1234.HEIC', type: '' })).toBe(true)
    expect(isHeicFile({ name: 'photo.heif' })).toBe(true)
    expect(isHeicFile({ name: 'unknown.bin', type: 'image/heic' })).toBe(true)
    expect(isHeicFile({ name: 'unknown.bin', type: 'image/heif' })).toBe(true)
    expect(isHeicFile({ name: 'burst.bin', type: 'image/heic-sequence' })).toBe(true)

    expect(isHeicFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false)
    expect(isHeicFile({ name: 'shot.png', type: 'image/png' })).toBe(false)
    expect(isHeicFile({ name: 'image.webp', type: 'image/webp' })).toBe(false)
    expect(isHeicFile({})).toBe(false)
  })

  it('uses native decode fast path without invoking WASM when native decoding succeeds', async () => {
    const input = new Blob([new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70])], {
      type: 'image/heic',
    })
    const expectedOut = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
      type: 'image/jpeg',
    })
    const stages: DecodeHeicStage[] = []

    const nativeDecode = vi.fn(async () => expectedOut)
    const wasmDecoder = vi.fn(async () => new Blob([new Uint8Array([1])], { type: 'image/jpeg' }))

    const result = await decodeHeicToBlob(input, {
      outputType: 'image/jpeg',
      quality: 0.88,
      onStage: (s) => stages.push(s),
      nativeDecode,
      wasmDecoder,
    })

    expect(result).toBe(expectedOut)
    expect(stages).toEqual(['native', 'done'])
    expect(nativeDecode).toHaveBeenCalledWith(input, 'image/jpeg', 0.88)
    expect(wasmDecoder).not.toHaveBeenCalled()
  })

  it('falls back cleanly to injectable WASM decoder when native decode fails or returns null', async () => {
    const input = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/heic' })
    const wasmOut = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
    const stages: DecodeHeicStage[] = []

    const nativeDecode = vi.fn(async () => {
      throw new Error('Unsupported native HEIC codec')
    })
    const wasmDecoder = vi.fn(async () => wasmOut)

    const result = await decodeHeicToBlob(input, {
      outputType: 'image/png',
      quality: 1.5, // clamped to 1
      onStage: (s) => stages.push(s),
      nativeDecode,
      wasmDecoder,
    })

    expect(result).toBe(wasmOut)
    expect(stages).toEqual(['native', 'wasm', 'done'])
    expect(wasmDecoder).toHaveBeenCalledWith({
      blob: input,
      type: 'image/png',
      quality: 1,
    })
  })

  it('falls back to WASM decoder in Node when no native browser Image/createImageBitmap exists', async () => {
    const input = new Blob([new Uint8Array([9, 8, 7])], { type: 'image/heif' })
    const wasmOut = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
    const stages: DecodeHeicStage[] = []
    const wasmDecoder = vi.fn(async () => wasmOut)

    const result = await decodeHeicToBlob(input, {
      onStage: (s) => stages.push(s),
      wasmDecoder,
    })

    expect(result).toBe(wasmOut)
    expect(stages).toEqual(['native', 'wasm', 'done'])
    expect(wasmDecoder).toHaveBeenCalledWith({
      blob: input,
      type: 'image/jpeg',
      quality: 0.92,
    })
  })
})
