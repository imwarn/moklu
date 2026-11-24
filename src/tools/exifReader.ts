/**
 * [INPUT]: depends on browser/Node standard ArrayBuffer, DataView, Uint8Array, and Blob APIs
 * [OUTPUT]: exports ExifGpsCoordinates, ExifSummary, parseExifFromBuffer, and readExifSummary for zero-dependency binary EXIF & GPS inspection
 * [POS]: pure binary EXIF metadata inspector in src/tools; parses JPEG APP1, PNG eXIf, WebP EXIF, and ISOBMFF/HEIC Exif payloads safely without ever throwing
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export interface ExifGpsCoordinates {
  latitude: number
  longitude: number
}

export interface ExifSummary {
  hasExif: boolean
  hasSensitiveData: boolean
  tagCount: number
  gps?: ExifGpsCoordinates
  make?: string
  model?: string
  software?: string
  dateTimeOriginal?: string
  exposureTime?: string
  fNumber?: string
  iso?: number
  orientation?: number
}

interface ByteSlice {
  start: number
  end: number
}

const EMPTY_SUMMARY: ExifSummary = {
  hasExif: false,
  hasSensitiveData: false,
  tagCount: 0,
}

const TIFF_TYPE_SIZES: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  7: 1, // UNDEFINED
  9: 4, // SLONG
  10: 8, // SRATIONAL
}

const MAX_IFD_ENTRIES = 512

// IFD0 tags
const TAG_MAKE = 0x010f
const TAG_MODEL = 0x0110
const TAG_ORIENTATION = 0x0112
const TAG_SOFTWARE = 0x0131
const TAG_EXIF_IFD_POINTER = 0x8769
const TAG_GPS_IFD_POINTER = 0x8825

// ExifIFD tags
const TAG_EXPOSURE_TIME = 0x829a
const TAG_F_NUMBER = 0x829d
const TAG_ISO_SPEED = 0x8827
const TAG_DATE_TIME_ORIGINAL = 0x9003

// GPSIFD tags
const TAG_GPS_LAT_REF = 0x0001
const TAG_GPS_LAT = 0x0002
const TAG_GPS_LON_REF = 0x0003
const TAG_GPS_LON = 0x0004

// ============================================================================
// Container Magic & EXIF Payload Locators
// ============================================================================

function matchesAscii(view: DataView, offset: number, text: string): boolean {
  if (offset < 0 || offset + text.length > view.byteLength) return false
  for (let i = 0; i < text.length; i += 1) {
    if (view.getUint8(offset + i) !== text.charCodeAt(i)) return false
  }
  return true
}

function hasExifHeader(view: DataView, offset: number): boolean {
  return (
    offset + 6 <= view.byteLength &&
    view.getUint8(offset) === 0x45 && // 'E'
    view.getUint8(offset + 1) === 0x78 && // 'x'
    view.getUint8(offset + 2) === 0x69 && // 'i'
    view.getUint8(offset + 3) === 0x66 && // 'f'
    view.getUint8(offset + 4) === 0x00 &&
    view.getUint8(offset + 5) === 0x00
  )
}

function isValidTiffHeader(view: DataView, offset: number, end: number): boolean {
  if (offset < 0 || offset + 8 > end) return false
  const order = view.getUint16(offset, false)
  if (order !== 0x4949 && order !== 0x4d4d) return false
  const le = order === 0x4949
  if (view.getUint16(offset + 2, le) !== 42) return false
  const ifd0Offset = view.getUint32(offset + 4, le)
  return ifd0Offset >= 8 && offset + ifd0Offset + 2 <= end
}

function stripOptionalExifPrefix(view: DataView, start: number, end: number): ByteSlice | null {
  if (start + 6 <= end && hasExifHeader(view, start)) {
    const candidate = start + 6
    if (isValidTiffHeader(view, candidate, end)) return { start: candidate, end }
  }
  if (isValidTiffHeader(view, start, end)) return { start, end }
  return null
}

function findJpegExifSlice(view: DataView): ByteSlice | null {
  let offset = 2
  const len = view.byteLength

  while (offset + 2 <= len) {
    if (view.getUint8(offset) !== 0xff) break
    while (offset < len && view.getUint8(offset) === 0xff) {
      offset += 1
    }
    if (offset >= len) break
    const marker = view.getUint8(offset)
    offset += 1

    // EOI or Start of Scan: no more APP metadata ahead
    if (marker === 0xd9 || marker === 0xda) break
    // Standalone markers without length
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue

    if (offset + 2 > len) break
    const segLen = view.getUint16(offset, false)
    if (segLen < 2) break

    const payloadStart = offset + 2
    const payloadEnd = Math.min(len, offset + segLen)
    if (marker === 0xe1 && payloadStart + 6 <= payloadEnd && hasExifHeader(view, payloadStart)) {
      const tiffStart = payloadStart + 6
      if (isValidTiffHeader(view, tiffStart, payloadEnd)) {
        return { start: tiffStart, end: payloadEnd }
      }
    }
    offset += segLen
  }

  return null
}

function findPngExifSlice(view: DataView): ByteSlice | null {
  let offset = 8
  const len = view.byteLength

  while (offset + 12 <= len) {
    const chunkLen = view.getUint32(offset, false)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkLen
    if (dataEnd + 4 > len) break

    if (matchesAscii(view, offset + 4, 'eXIf')) {
      const slice = stripOptionalExifPrefix(view, dataStart, dataEnd)
      if (slice) return slice
    }
    if (matchesAscii(view, offset + 4, 'IEND')) break

    offset = dataEnd + 4
  }

  return null
}

function findWebpExifSlice(view: DataView): ByteSlice | null {
  let offset = 12
  const len = view.byteLength

  while (offset + 8 <= len) {
    const chunkSize = view.getUint32(offset + 4, true)
    const dataStart = offset + 8
    const dataEnd = Math.min(len, dataStart + chunkSize)

    if (matchesAscii(view, offset, 'EXIF')) {
      const slice = stripOptionalExifPrefix(view, dataStart, dataEnd)
      if (slice) return slice
    }

    const paddedSize = chunkSize + (chunkSize & 1)
    const nextOffset = dataStart + paddedSize
    if (nextOffset <= offset) break
    offset = nextOffset
  }

  return null
}

function findIsobmffExifSlice(view: DataView): ByteSlice | null {
  const len = view.byteLength

  // Scan for 'Exif' marker / box followed by either Exif\0\0 + TIFF or 4-byte offset + TIFF
  for (let i = 4; i + 14 <= len; i += 1) {
    if (
      view.getUint8(i) === 0x45 &&
      view.getUint8(i + 1) === 0x78 &&
      view.getUint8(i + 2) === 0x69 &&
      view.getUint8(i + 3) === 0x66
    ) {
      // Case 1: 'Exif\0\0' immediately followed by TIFF header
      if (view.getUint8(i + 4) === 0x00 && view.getUint8(i + 5) === 0x00) {
        if (isValidTiffHeader(view, i + 6, len)) {
          return { start: i + 6, end: len }
        }
      }

      // Case 2: ISOBMFF Exif box ([4-byte size]['Exif'][4-byte tiffHeaderOffset][...][TIFF])
      const boxOffset = i >= 4 ? i - 4 : 0
      const boxSize = view.getUint32(boxOffset, false)
      const boxEnd = boxSize >= 12 && boxOffset + boxSize <= len ? boxOffset + boxSize : len
      if (i + 8 <= boxEnd) {
        const relTiffOffset = view.getUint32(i + 4, false)
        const candidate = i + 8 + relTiffOffset
        if (relTiffOffset < 64 && isValidTiffHeader(view, candidate, boxEnd)) {
          return { start: candidate, end: boxEnd }
        }
      }

      // Case 3: direct TIFF header right after 'Exif' or within 12 bytes
      for (let shift = 4; shift <= 12 && i + shift + 8 <= len; shift += 1) {
        if (isValidTiffHeader(view, i + shift, len)) {
          return { start: i + shift, end: len }
        }
      }
    }
  }

  return null
}

function locateTiffSlice(view: DataView): ByteSlice | null {
  const len = view.byteLength
  if (len < 8) return null

  // JPEG: FF D8
  if (view.getUint16(0, false) === 0xffd8) {
    return findJpegExifSlice(view)
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    len >= 8 &&
    view.getUint32(0, false) === 0x89504e47 &&
    view.getUint32(4, false) === 0x0d0a1a0a
  ) {
    return findPngExifSlice(view)
  }

  // WebP: RIFF....WEBP
  if (len >= 12 && matchesAscii(view, 0, 'RIFF') && matchesAscii(view, 8, 'WEBP')) {
    return findWebpExifSlice(view)
  }

  // ISOBMFF / HEIC / HEIF / AVIF: ....ftyp
  if (len >= 12 && matchesAscii(view, 4, 'ftyp')) {
    return findIsobmffExifSlice(view)
  }

  // Raw TIFF fallback
  if (isValidTiffHeader(view, 0, len)) {
    return { start: 0, end: len }
  }

  return null
}

// ============================================================================
// TIFF IFD Tag Readers & Formatting
// ============================================================================

interface TiffContext {
  view: DataView
  tiffStart: number
  tiffEnd: number
  le: boolean
}

function resolveValueOffset(
  ctx: TiffContext,
  entryOffset: number,
  type: number,
  count: number,
): { offset: number; byteLength: number } | null {
  const unitSize = TIFF_TYPE_SIZES[type]
  if (!unitSize || count <= 0) return null
  const byteLength = unitSize * count
  if (byteLength <= 4) {
    const inlineOffset = entryOffset + 8
    return inlineOffset + byteLength <= ctx.tiffEnd ? { offset: inlineOffset, byteLength } : null
  }
  const relOffset = ctx.view.getUint32(entryOffset + 8, ctx.le)
  const absOffset = ctx.tiffStart + relOffset
  if (absOffset < ctx.tiffStart || absOffset + byteLength > ctx.tiffEnd) return null
  return { offset: absOffset, byteLength }
}

function readAsciiTag(ctx: TiffContext, entryOffset: number, type: number, count: number): string | undefined {
  if (type !== 2) return undefined
  const loc = resolveValueOffset(ctx, entryOffset, type, count)
  if (!loc) return undefined
  let out = ''
  for (let i = 0; i < loc.byteLength; i += 1) {
    const code = ctx.view.getUint8(loc.offset + i)
    if (code === 0) break
    out += String.fromCharCode(code)
  }
  const trimmed = out.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readUintTag(ctx: TiffContext, entryOffset: number, type: number, count: number): number | undefined {
  if (count < 1) return undefined
  const loc = resolveValueOffset(ctx, entryOffset, type, count)
  if (!loc) return undefined
  if (type === 3) return ctx.view.getUint16(loc.offset, ctx.le)
  if (type === 4) return ctx.view.getUint32(loc.offset, ctx.le)
  if (type === 1) return ctx.view.getUint8(loc.offset)
  return undefined
}

function readRational(
  ctx: TiffContext,
  offset: number,
  signed: boolean,
): { num: number; den: number; value: number } | null {
  if (offset + 8 > ctx.tiffEnd) return null
  const num = signed ? ctx.view.getInt32(offset, ctx.le) : ctx.view.getUint32(offset, ctx.le)
  const den = signed ? ctx.view.getInt32(offset + 4, ctx.le) : ctx.view.getUint32(offset + 4, ctx.le)
  if (den === 0) return null
  const value = num / den
  if (!Number.isFinite(value)) return null
  return { num, den, value }
}

function readSingleRationalTag(
  ctx: TiffContext,
  entryOffset: number,
  type: number,
  count: number,
): { num: number; den: number; value: number } | null {
  if ((type !== 5 && type !== 10) || count < 1) return null
  const loc = resolveValueOffset(ctx, entryOffset, type, count)
  if (!loc) return null
  return readRational(ctx, loc.offset, type === 10)
}

function readGpsDms(ctx: TiffContext, entryOffset: number, type: number, count: number): number | undefined {
  if ((type !== 5 && type !== 10) || count < 3) return undefined
  const loc = resolveValueOffset(ctx, entryOffset, type, count)
  if (!loc) return undefined
  const signed = type === 10
  const deg = readRational(ctx, loc.offset, signed)
  const min = readRational(ctx, loc.offset + 8, signed)
  const sec = readRational(ctx, loc.offset + 16, signed)
  if (!deg || !min || !sec) return undefined
  const decimal = deg.value + min.value / 60 + sec.value / 3600
  return Number.isFinite(decimal) ? decimal : undefined
}

function formatExposureTime(rat: { num: number; den: number; value: number }): string | undefined {
  if (rat.value <= 0) return undefined
  if (rat.value < 0.5) {
    const reciprocal = Math.round(1 / rat.value)
    return reciprocal >= 1 ? `1/${reciprocal}s` : undefined
  }
  const rounded = Number(rat.value.toFixed(2))
  return `${rounded}s`
}

function formatFNumber(rat: { value: number }): string | undefined {
  if (rat.value <= 0) return undefined
  const rounded = Number(rat.value.toFixed(1))
  return `f/${rounded}`
}

function visitIfd(
  ctx: TiffContext,
  relOffset: number,
  visited: Set<number>,
  onEntry: (tag: number, type: number, count: number, entryOffset: number) => void,
): number {
  if (visited.has(relOffset)) return 0
  const absOffset = ctx.tiffStart + relOffset
  if (absOffset < ctx.tiffStart || absOffset + 2 > ctx.tiffEnd) return 0
  visited.add(relOffset)

  const rawCount = ctx.view.getUint16(absOffset, ctx.le)
  const count = Math.min(rawCount, MAX_IFD_ENTRIES)
  let parsed = 0

  for (let i = 0; i < count; i += 1) {
    const entryOffset = absOffset + 2 + i * 12
    if (entryOffset + 12 > ctx.tiffEnd) break
    const tag = ctx.view.getUint16(entryOffset, ctx.le)
    const type = ctx.view.getUint16(entryOffset + 2, ctx.le)
    const valueCount = ctx.view.getUint32(entryOffset + 4, ctx.le)
    parsed += 1
    onEntry(tag, type, valueCount, entryOffset)
  }

  return parsed
}

function parseTiffExif(view: DataView, slice: ByteSlice): ExifSummary {
  const order = view.getUint16(slice.start, false)
  const le = order === 0x4949
  const ctx: TiffContext = { view, tiffStart: slice.start, tiffEnd: slice.end, le }
  const ifd0Offset = view.getUint32(slice.start + 4, le)
  const visited = new Set<number>()

  const summary: ExifSummary = {
    hasExif: false,
    hasSensitiveData: false,
    tagCount: 0,
  }

  let exifIfdPtr: number | undefined
  let gpsIfdPtr: number | undefined

  summary.tagCount += visitIfd(ctx, ifd0Offset, visited, (tag, type, count, entryOffset) => {
    switch (tag) {
      case TAG_MAKE:
        summary.make = readAsciiTag(ctx, entryOffset, type, count)
        break
      case TAG_MODEL:
        summary.model = readAsciiTag(ctx, entryOffset, type, count)
        break
      case TAG_SOFTWARE:
        summary.software = readAsciiTag(ctx, entryOffset, type, count)
        break
      case TAG_ORIENTATION: {
        const val = readUintTag(ctx, entryOffset, type, count)
        if (val !== undefined && val >= 1 && val <= 8) summary.orientation = val
        break
      }
      case TAG_EXIF_IFD_POINTER:
        exifIfdPtr = readUintTag(ctx, entryOffset, type, count)
        break
      case TAG_GPS_IFD_POINTER:
        gpsIfdPtr = readUintTag(ctx, entryOffset, type, count)
        break
    }
  })

  if (exifIfdPtr !== undefined && exifIfdPtr > 0) {
    summary.tagCount += visitIfd(ctx, exifIfdPtr, visited, (tag, type, count, entryOffset) => {
      switch (tag) {
        case TAG_DATE_TIME_ORIGINAL:
          summary.dateTimeOriginal = readAsciiTag(ctx, entryOffset, type, count)
          break
        case TAG_EXPOSURE_TIME: {
          const rat = readSingleRationalTag(ctx, entryOffset, type, count)
          if (rat) summary.exposureTime = formatExposureTime(rat)
          break
        }
        case TAG_F_NUMBER: {
          const rat = readSingleRationalTag(ctx, entryOffset, type, count)
          if (rat) summary.fNumber = formatFNumber(rat)
          break
        }
        case TAG_ISO_SPEED: {
          const iso = readUintTag(ctx, entryOffset, type, count)
          if (iso !== undefined && iso > 0) summary.iso = iso
          break
        }
      }
    })
  }

  if (gpsIfdPtr !== undefined && gpsIfdPtr > 0) {
    let latRef: string | undefined
    let lonRef: string | undefined
    let latVal: number | undefined
    let lonVal: number | undefined

    summary.tagCount += visitIfd(ctx, gpsIfdPtr, visited, (tag, type, count, entryOffset) => {
      switch (tag) {
        case TAG_GPS_LAT_REF:
          latRef = readAsciiTag(ctx, entryOffset, type, count)
          break
        case TAG_GPS_LAT:
          latVal = readGpsDms(ctx, entryOffset, type, count)
          break
        case TAG_GPS_LON_REF:
          lonRef = readAsciiTag(ctx, entryOffset, type, count)
          break
        case TAG_GPS_LON:
          lonVal = readGpsDms(ctx, entryOffset, type, count)
          break
      }
    })

    if (latVal !== undefined && lonVal !== undefined) {
      const signedLat = latRef?.toUpperCase().startsWith('S') ? -Math.abs(latVal) : latVal
      const signedLon = lonRef?.toUpperCase().startsWith('W') ? -Math.abs(lonVal) : lonVal
      if (Math.abs(signedLat) <= 90 && Math.abs(signedLon) <= 180) {
        summary.gps = {
          latitude: Math.round(signedLat * 1_000_000) / 1_000_000,
          longitude: Math.round(signedLon * 1_000_000) / 1_000_000,
        }
      }
    }
  }

  summary.hasExif = summary.tagCount > 0
  summary.hasSensitiveData = Boolean(
    summary.gps || summary.make || summary.model || summary.dateTimeOriginal || summary.software,
  )

  return summary
}

/**
 * Inspect EXIF & GPS metadata directly from an ArrayBuffer without external dependencies.
 * Never throws on malformed, truncated, or unsupported binary inputs.
 */
export function parseExifFromBuffer(buffer: ArrayBuffer): ExifSummary {
  try {
    if (!buffer || buffer.byteLength < 8) return { ...EMPTY_SUMMARY }
    const view = new DataView(buffer)
    const slice = locateTiffSlice(view)
    if (!slice) return { ...EMPTY_SUMMARY }
    return parseTiffExif(view, slice)
  } catch {
    return { ...EMPTY_SUMMARY }
  }
}

/**
 * Inspect EXIF & GPS metadata from a local Blob or File without uploading or decoding pixels.
 */
export async function readExifSummary(file: Blob): Promise<ExifSummary> {
  try {
    const buffer = await file.arrayBuffer()
    return parseExifFromBuffer(buffer)
  } catch {
    return { ...EMPTY_SUMMARY }
  }
}
