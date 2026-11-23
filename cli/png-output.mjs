/**
 * [INPUT]: depends on Node.js Buffer binary readers (no external module imports)
 * [OUTPUT]: exports decodeValidatedPng
 * [POS]: PNG data-URL decoder and IHDR dimension integrity gate in cli/, called by cli/export.mjs before writing exported files
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
/** Decode the headless browser's PNG and reject any incorrect output before disk writes. */
export function decodeValidatedPng(dataUrl, width, height) {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error('CLI export result has missing or invalid expected dimensions')
  }
  const match = typeof dataUrl === 'string'
    ? /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl)
    : null
  if (!match) throw new Error('CLI export result is not a PNG data URL')
  const bytes = Buffer.from(match[1], 'base64')
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature) ||
      bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('CLI export PNG is missing a valid signature or IHDR')
  }
  const actualWidth = bytes.readUInt32BE(16)
  const actualHeight = bytes.readUInt32BE(20)
  if (actualWidth !== width || actualHeight !== height) {
    throw new Error(`CLI PNG dimensions mismatch: expected ${width}×${height}, got ${actualWidth}×${actualHeight}`)
  }
  return bytes
}
