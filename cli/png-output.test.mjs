import { describe, expect, it } from 'vitest'
import { deflateSync } from 'node:zlib'
import { decodeValidatedPng } from './png-output.mjs'

// Produce a standards-compliant PNG in memory so the CLI integrity contract
// does not depend on an externally generated or potentially corrupt fixture.
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii')
  const size = Buffer.alloc(4)
  size.writeUInt32BE(data.length)
  const payload = Buffer.concat([name, data])
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(payload))
  return Buffer.concat([size, payload, checksum])
}

function transparentPng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // 8-bit per channel
  ihdr[9] = 6 // RGBA
  const rows = Buffer.alloc(height * (1 + width * 4)) // filter byte + transparent pixels
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}

const golden = transparentPng(240, 240)
const asDataUrl = 'data:image/png;base64,' + golden.toString('base64')

describe('CLI PNG output', () => {
  it('decodes a real transparent PNG only at the exact dimensions', () => {
    expect(decodeValidatedPng(asDataUrl, 240, 240).equals(golden)).toBe(true)
    expect(() => decodeValidatedPng(asDataUrl, 239, 240)).toThrow(/dimensions mismatch/)
    expect(() => decodeValidatedPng(asDataUrl, 240, 241)).toThrow(/dimensions mismatch/)
  })
  it('rejects malformed output, bad MIME type, and absent dimension metadata', () => {
    expect(() => decodeValidatedPng('data:image/png;base64,AAAA', 240, 240)).toThrow(/signature|IHDR/)
    expect(() => decodeValidatedPng('data:text/html;base64,AAAA', 240, 240)).toThrow(/not a PNG/)
    expect(() => decodeValidatedPng(asDataUrl, undefined, 240)).toThrow(/expected dimensions/)
  })
})
