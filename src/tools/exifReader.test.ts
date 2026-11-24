/**
 * [INPUT]: depends on vitest and ./exifReader
 * [OUTPUT]: unit tests verifying binary EXIF & GPS extraction across JPEG (LE/BE), PNG eXIf, WebP EXIF, ISOBMFF/HEIC Exif boxes, sensitive-data flags, and malformed buffer safety
 * [POS]: deterministic unit test suite for src/tools/exifReader.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { describe, expect, it } from 'vitest'
import { parseExifFromBuffer, readExifSummary } from './exifReader'

interface TiffEntrySpec {
  tag: number
  type: number
  count: number
  bytes: Uint8Array
}

function asciiBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length + 1)
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i)
  bytes[text.length] = 0
  return bytes
}

function uint16Bytes(val: number, le: boolean): Uint8Array {
  const buf = new ArrayBuffer(2)
  new DataView(buf).setUint16(0, val, le)
  return new Uint8Array(buf)
}

function uint32Bytes(val: number, le: boolean): Uint8Array {
  const buf = new ArrayBuffer(4)
  new DataView(buf).setUint32(0, val, le)
  return new Uint8Array(buf)
}

function rationalsBytes(pairs: Array<[number, number]>, le: boolean): Uint8Array {
  const buf = new ArrayBuffer(pairs.length * 8)
  const view = new DataView(buf)
  pairs.forEach(([num, den], idx) => {
    view.setUint32(idx * 8, num, le)
    view.setUint32(idx * 8 + 4, den, le)
  })
  return new Uint8Array(buf)
}

function buildIfdSection(entries: TiffEntrySpec[], baseOffset: number, le: boolean): Uint8Array {
  const headerSize = 2 + entries.length * 12 + 4
  let dataCursor = baseOffset + headerSize
  const extraBlobs: Uint8Array[] = []

  const header = new Uint8Array(headerSize)
  const view = new DataView(header.buffer)
  view.setUint16(0, entries.length, le)

  entries.forEach((entry, idx) => {
    const off = 2 + idx * 12
    view.setUint16(off, entry.tag, le)
    view.setUint16(off + 2, entry.type, le)
    view.setUint32(off + 4, entry.count, le)
    if (entry.bytes.byteLength <= 4) {
      header.set(entry.bytes, off + 8)
    } else {
      view.setUint32(off + 8, dataCursor, le)
      extraBlobs.push(entry.bytes)
      dataCursor += entry.bytes.byteLength
    }
  })
  view.setUint32(2 + entries.length * 12, 0, le) // next IFD = 0

  const total = headerSize + extraBlobs.reduce((s, b) => s + b.byteLength, 0)
  const out = new Uint8Array(total)
  out.set(header, 0)
  let pos = headerSize
  for (const blob of extraBlobs) {
    out.set(blob, pos)
    pos += blob.byteLength
  }
  return out
}

function buildSyntheticTiff(options: {
  le: boolean
  make?: string
  model?: string
  software?: string
  orientation?: number
  dateTimeOriginal?: string
  exposure?: [number, number]
  fNumber?: [number, number]
  iso?: number
  gps?: {
    latRef: 'N' | 'S'
    latDms: Array<[number, number]>
    lonRef: 'E' | 'W'
    lonDms: Array<[number, number]>
  }
}): Uint8Array {
  const { le } = options
  const ifd0Base: TiffEntrySpec[] = []
  if (options.make) ifd0Base.push({ tag: 0x010f, type: 2, count: options.make.length + 1, bytes: asciiBytes(options.make) })
  if (options.model) ifd0Base.push({ tag: 0x0110, type: 2, count: options.model.length + 1, bytes: asciiBytes(options.model) })
  if (options.orientation !== undefined) {
    ifd0Base.push({ tag: 0x0112, type: 3, count: 1, bytes: uint16Bytes(options.orientation, le) })
  }
  if (options.software) {
    ifd0Base.push({ tag: 0x0131, type: 2, count: options.software.length + 1, bytes: asciiBytes(options.software) })
  }

  const exifEntries: TiffEntrySpec[] = []
  if (options.exposure) exifEntries.push({ tag: 0x829a, type: 5, count: 1, bytes: rationalsBytes([options.exposure], le) })
  if (options.fNumber) exifEntries.push({ tag: 0x829d, type: 5, count: 1, bytes: rationalsBytes([options.fNumber], le) })
  if (options.iso !== undefined) exifEntries.push({ tag: 0x8827, type: 3, count: 1, bytes: uint16Bytes(options.iso, le) })
  if (options.dateTimeOriginal) {
    exifEntries.push({
      tag: 0x9003,
      type: 2,
      count: options.dateTimeOriginal.length + 1,
      bytes: asciiBytes(options.dateTimeOriginal),
    })
  }

  const gpsEntries: TiffEntrySpec[] = []
  if (options.gps) {
    gpsEntries.push({ tag: 0x0001, type: 2, count: 2, bytes: asciiBytes(options.gps.latRef) })
    gpsEntries.push({ tag: 0x0002, type: 5, count: 3, bytes: rationalsBytes(options.gps.latDms, le) })
    gpsEntries.push({ tag: 0x0003, type: 2, count: 2, bytes: asciiBytes(options.gps.lonRef) })
    gpsEntries.push({ tag: 0x0004, type: 5, count: 3, bytes: rationalsBytes(options.gps.lonDms, le) })
  }

  // Compute IFD0 size with pointer placeholders
  const pointerCount = (exifEntries.length > 0 ? 1 : 0) + (gpsEntries.length > 0 ? 1 : 0)
  const dummyIfd0 = buildIfdSection(
    [
      ...ifd0Base,
      ...Array.from({ length: pointerCount }, () => ({ tag: 0x8769, type: 4, count: 1, bytes: uint32Bytes(0, le) })),
    ],
    8,
    le,
  )
  const exifOffset = 8 + dummyIfd0.byteLength
  const exifSection = exifEntries.length > 0 ? buildIfdSection(exifEntries, exifOffset, le) : new Uint8Array(0)
  const gpsOffset = exifOffset + exifSection.byteLength
  const gpsSection = gpsEntries.length > 0 ? buildIfdSection(gpsEntries, gpsOffset, le) : new Uint8Array(0)

  const finalIfd0Entries: TiffEntrySpec[] = [...ifd0Base]
  if (exifEntries.length > 0) {
    finalIfd0Entries.push({ tag: 0x8769, type: 4, count: 1, bytes: uint32Bytes(exifOffset, le) })
  }
  if (gpsEntries.length > 0) {
    finalIfd0Entries.push({ tag: 0x8825, type: 4, count: 1, bytes: uint32Bytes(gpsOffset, le) })
  }
  const ifd0Section = buildIfdSection(finalIfd0Entries, 8, le)

  const out = new Uint8Array(8 + ifd0Section.byteLength + exifSection.byteLength + gpsSection.byteLength)
  const view = new DataView(out.buffer)
  view.setUint16(0, le ? 0x4949 : 0x4d4d, false)
  view.setUint16(2, 42, le)
  view.setUint32(4, 8, le)
  out.set(ifd0Section, 8)
  out.set(exifSection, exifOffset)
  out.set(gpsSection, gpsOffset)
  return out
}

function wrapInJpeg(tiff: Uint8Array): ArrayBuffer {
  const segLen = 2 + 6 + tiff.byteLength
  const out = new Uint8Array(2 + 2 + segLen + 2)
  const view = new DataView(out.buffer)
  out[0] = 0xff
  out[1] = 0xd8
  out[2] = 0xff
  out[3] = 0xe1
  view.setUint16(4, segLen, false)
  out.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 6) // Exif\0\0
  out.set(tiff, 12)
  out[out.length - 2] = 0xff
  out[out.length - 1] = 0xd9
  return out.buffer
}

function wrapInPng(tiff: Uint8Array): ArrayBuffer {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const chunk = new Uint8Array(12 + tiff.byteLength)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, tiff.byteLength, false)
  chunk.set([0x65, 0x58, 0x49, 0x66], 4) // eXIf
  chunk.set(tiff, 8)
  const iend = new Uint8Array([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0])

  const out = new Uint8Array(sig.length + chunk.length + iend.length)
  out.set(sig, 0)
  out.set(chunk, sig.length)
  out.set(iend, sig.length + chunk.length)
  return out.buffer
}

function wrapInWebp(tiff: Uint8Array): ArrayBuffer {
  const paddedLen = tiff.byteLength + (tiff.byteLength & 1)
  const totalPayload = 4 + 8 + paddedLen
  const out = new Uint8Array(8 + totalPayload)
  const view = new DataView(out.buffer)
  out.set([0x52, 0x49, 0x46, 0x46], 0) // RIFF
  view.setUint32(4, totalPayload, true)
  out.set([0x57, 0x45, 0x42, 0x50], 8) // WEBP
  out.set([0x45, 0x58, 0x49, 0x46], 12) // EXIF
  view.setUint32(16, tiff.byteLength, true)
  out.set(tiff, 20)
  return out.buffer
}

function wrapInHeicIsobmff(tiff: Uint8Array): ArrayBuffer {
  // ftyp box (20 bytes) + Exif payload (4-byte tiff offset + Exif\0\0 + TIFF)
  const ftyp = new Uint8Array(20)
  const ftypView = new DataView(ftyp.buffer)
  ftypView.setUint32(0, 20, false)
  ftyp.set([0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 4) // ftypheic

  const exifPrefix = new Uint8Array([0x00, 0x00, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
  const out = new Uint8Array(ftyp.length + exifPrefix.length + tiff.length)
  out.set(ftyp, 0)
  out.set(exifPrefix, ftyp.length)
  out.set(tiff, ftyp.length + exifPrefix.length)
  return out.buffer
}

describe('exifReader', () => {
  it('parses little-endian JPEG APP1 EXIF with camera, exposure, and South/West GPS coordinates', async () => {
    const tiff = buildSyntheticTiff({
      le: true,
      make: 'Apple',
      model: 'iPhone 16 Pro',
      software: '18.1',
      orientation: 6,
      dateTimeOriginal: '2026:03:15 14:22:10',
      exposure: [1, 250],
      fNumber: [18, 10],
      iso: 100,
      gps: {
        latRef: 'S',
        latDms: [[33, 1], [52, 1], [768, 100]], // -33.8688
        lonRef: 'W',
        lonDms: [[151, 1], [12, 1], [3348, 100]], // -151.2093
      },
    })
    const jpegBuf = wrapInJpeg(tiff)

    const summary = parseExifFromBuffer(jpegBuf)
    expect(summary.hasExif).toBe(true)
    expect(summary.hasSensitiveData).toBe(true)
    expect(summary.tagCount).toBe(14)
    expect(summary.make).toBe('Apple')
    expect(summary.model).toBe('iPhone 16 Pro')
    expect(summary.software).toBe('18.1')
    expect(summary.orientation).toBe(6)
    expect(summary.dateTimeOriginal).toBe('2026:03:15 14:22:10')
    expect(summary.exposureTime).toBe('1/250s')
    expect(summary.fNumber).toBe('f/1.8')
    expect(summary.iso).toBe(100)
    expect(summary.gps?.latitude).toBeCloseTo(-33.8688, 4)
    expect(summary.gps?.longitude).toBeCloseTo(-151.2093, 4)

    const blobSummary = await readExifSummary(new Blob([jpegBuf], { type: 'image/jpeg' }))
    expect(blobSummary).toEqual(summary)
  })

  it('parses big-endian TIFF inside PNG eXIf, WebP EXIF, and ISOBMFF/HEIC containers', () => {
    const tiffBe = buildSyntheticTiff({
      le: false,
      make: 'SONY',
      model: 'ILCE-7M4',
      dateTimeOriginal: '2026:05:01 09:00:00',
      exposure: [2, 1],
      fNumber: [28, 10],
      iso: 800,
      gps: {
        latRef: 'N',
        latDms: [[35, 1], [40, 1], [3432, 100]],
        lonRef: 'E',
        lonDms: [[139, 1], [45, 1], [108, 10]],
      },
    })

    for (const buf of [wrapInPng(tiffBe), wrapInWebp(tiffBe), wrapInHeicIsobmff(tiffBe)]) {
      const summary = parseExifFromBuffer(buf)
      expect(summary.hasExif).toBe(true)
      expect(summary.hasSensitiveData).toBe(true)
      expect(summary.make).toBe('SONY')
      expect(summary.model).toBe('ILCE-7M4')
      expect(summary.exposureTime).toBe('2s')
      expect(summary.fNumber).toBe('f/2.8')
      expect(summary.iso).toBe(800)
      expect(summary.gps?.latitude).toBeCloseTo(35.6762, 3)
      expect(summary.gps?.longitude).toBeCloseTo(139.753, 3)
    }
  })

  it('marks hasSensitiveData false when only non-sensitive orientation tag is present', () => {
    const tiff = buildSyntheticTiff({ le: true, orientation: 1 })
    const summary = parseExifFromBuffer(wrapInJpeg(tiff))
    expect(summary.hasExif).toBe(true)
    expect(summary.hasSensitiveData).toBe(false)
    expect(summary.orientation).toBe(1)
    expect(summary.tagCount).toBe(1)
  })

  it('never throws on empty, truncated, cyclic, or random bytes', () => {
    const empty = { hasExif: false, hasSensitiveData: false, tagCount: 0 }
    expect(parseExifFromBuffer(new ArrayBuffer(0))).toEqual(empty)
    expect(parseExifFromBuffer(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04]).buffer)).toEqual(empty)
    expect(parseExifFromBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer)).toEqual(empty)

    // Truncated PNG eXIf claiming huge chunk length
    const badPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x7f, 0xff, 0xff, 0xff, 0x65, 0x58, 0x49, 0x66,
      0x49, 0x49, 0x2a, 0x00,
    ])
    expect(parseExifFromBuffer(badPng.buffer)).toEqual(empty)

    // Malformed JPEG with huge IFD count and self-pointing ExifIFD
    const cyclicTiff = new Uint8Array(32)
    const view = new DataView(cyclicTiff.buffer)
    view.setUint16(0, 0x4949, false)
    view.setUint16(2, 42, true)
    view.setUint32(4, 8, true)
    view.setUint16(8, 1, true)
    view.setUint16(10, 0x8769, true)
    view.setUint16(12, 4, true)
    view.setUint32(14, 1, true)
    view.setUint32(18, 8, true) // cycle back to IFD0
    const res = parseExifFromBuffer(wrapInJpeg(cyclicTiff))
    expect(res.hasExif).toBe(true)
    expect(res.tagCount).toBe(1)
  })
})
