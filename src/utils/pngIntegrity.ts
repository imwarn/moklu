/** Validate the PNG signature and its IHDR dimensions without image decoding. */
export function readPngDataUrlDimensions(dataUrl: string): { width: number; height: number } {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl)
  if (!match) throw new Error('Export did not produce a PNG data URL.')
  const start = atob(match[1].slice(0, 36))
  if (start.length < 24 ||
      start.slice(0, 8) !== '\x89PNG\r\n\x1a\n' ||
      start.slice(12, 16) !== 'IHDR') {
    throw new Error('Exported PNG is missing a valid signature or IHDR.')
  }
  const u32 = (offset: number) => (
    ((start.charCodeAt(offset) * 0x1000000) +
     (start.charCodeAt(offset + 1) << 16) +
     (start.charCodeAt(offset + 2) << 8) +
     start.charCodeAt(offset + 3)) >>> 0
  )
  const width = u32(16), height = u32(20)
  if (width === 0 || height === 0) throw new Error('Exported PNG has invalid dimensions.')
  return { width, height }
}

/** Explicit integrity check before giving user a successful PNG export. */
export function assertPngExportDimensions(dataUrl: string, width: number, height: number): void {
  const actual = readPngDataUrlDimensions(dataUrl)
  if (actual.width !== width || actual.height !== height) {
    throw new Error(`PNG export dimensions mismatch: expected ${width}×${height}, got ${actual.width}×${actual.height}.`)
  }
}
