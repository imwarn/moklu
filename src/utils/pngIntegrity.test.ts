import { describe, expect, it } from 'vitest'
import { assertPngExportDimensions, readPngDataUrlDimensions } from './pngIntegrity'

function png(width: number, height: number) {
  const bytes = new Uint8Array(24)
  bytes.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82])
  new DataView(bytes.buffer).setUint32(16, width)
  new DataView(bytes.buffer).setUint32(20, height)
  return 'data:image/png;base64,' + btoa(String.fromCharCode(...bytes))
}

describe('PNG export integrity', () => {
  it('reads exact IHDR dimensions (independent of browser image decoding)', () => {
    expect(readPngDataUrlDimensions(png(1600, 900))).toEqual({ width: 1600, height: 900 })
    expect(readPngDataUrlDimensions(png(1080, 1920))).toEqual({ width: 1080, height: 1920 })
    expect(readPngDataUrlDimensions(png(3840, 2160))).toEqual({ width: 3840, height: 2160 })
  })
  it('rejects invalid image headers and mismatch instead of reporting a successful export', () => {
    expect(() => readPngDataUrlDimensions('data:image/png;base64,AAAA')).toThrow(/signature|IHDR/)
    expect(() => readPngDataUrlDimensions('data:text/html;base64,AAAA')).toThrow(/PNG/)
    expect(() => assertPngExportDimensions(png(1200, 900), 1600, 900)).toThrow(/mismatch/)
    expect(() => assertPngExportDimensions(png(0, 900), 0, 900)).toThrow(/invalid/)
    expect(() => assertPngExportDimensions(png(1600, 900), 1600, 900)).not.toThrow()
  })
})
