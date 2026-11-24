/**
 * [INPUT]: depends on browser/Node standard TextEncoder, Uint8Array, and Blob APIs
 * [OUTPUT]: exports PdfPageOptions, buildSinglePagePdfBytes, and createSinglePagePdfFromJpeg for zero-dependency client-side single-page PDF 1.4 export
 * [POS]: pure binary PDF 1.4 wrapper inside src/tools; embeds JPEG bytes via /DCTDecode for mergeEngine PDF export with zero external libraries
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export interface PdfPageOptions {
  /** Target DPI used to convert pixels into PDF points (1 pt = 1/72 in). Defaults to 72 (1 px = 1 pt). */
  dpi?: number
}

const MAX_PDF_PAGE_POINTS = 14_400

function formatPdfNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

function concatChunks(chunks: ReadonlyArray<Uint8Array>): Uint8Array {
  let total = 0
  for (const chunk of chunks) {
    total += chunk.byteLength
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

/**
 * Compute PDF MediaBox dimensions in points (1/72 inch) while respecting the PDF 1.4 14400pt limit.
 */
function resolvePagePoints(pixelWidth: number, pixelHeight: number, dpi = 72): { widthPt: number; heightPt: number } {
  const safeDpi = Number.isFinite(dpi) && dpi > 0 ? dpi : 72
  let widthPt = (pixelWidth * 72) / safeDpi
  let heightPt = (pixelHeight * 72) / safeDpi

  if (widthPt > MAX_PDF_PAGE_POINTS || heightPt > MAX_PDF_PAGE_POINTS) {
    const scale = Math.min(MAX_PDF_PAGE_POINTS / widthPt, MAX_PDF_PAGE_POINTS / heightPt)
    widthPt *= scale
    heightPt *= scale
  }

  return {
    widthPt: Math.max(1, widthPt),
    heightPt: Math.max(1, heightPt),
  }
}

/**
 * Wrap raw JPEG bytes into a standards-compliant single-page PDF 1.4 byte buffer using /DCTDecode.
 */
export function buildSinglePagePdfBytes(
  jpegBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number,
  options?: PdfPageOptions,
): Uint8Array {
  if (jpegBytes.byteLength === 0) {
    throw new Error('Cannot build PDF from empty JPEG data.')
  }
  const safeW = Math.max(1, Math.round(pixelWidth))
  const safeH = Math.max(1, Math.round(pixelHeight))
  const { widthPt, heightPt } = resolvePagePoints(safeW, safeH, options?.dpi)
  const wStr = formatPdfNumber(widthPt)
  const hStr = formatPdfNumber(heightPt)

  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  let byteOffset = 0

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes)
    byteOffset += bytes.byteLength
  }
  const pushAscii = (text: string) => {
    pushBytes(encoder.encode(text))
  }

  // PDF 1.4 header + binary comment marker (>127 bytes signals binary streams to parsers)
  pushAscii('%PDF-1.4\n%')
  pushBytes(new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  const offsets: number[] = [0]

  // 1 0 obj: Document Catalog
  offsets.push(byteOffset)
  pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  // 2 0 obj: Pages Tree
  offsets.push(byteOffset)
  pushAscii('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  // 3 0 obj: Single Page referencing /Im0 and content stream 5 0 R
  offsets.push(byteOffset)
  pushAscii(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wStr} ${hStr}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  )

  // 4 0 obj: Embedded JPEG Image XObject (/DCTDecode)
  offsets.push(byteOffset)
  pushAscii(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${safeW} /Height ${safeH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`,
  )
  pushBytes(jpegBytes)
  pushAscii('\nendstream\nendobj\n')

  // 5 0 obj: Page Content Stream drawing /Im0 across full MediaBox
  const contentStream = `q\n${wStr} 0 0 ${hStr} 0 0 cm\n/Im0 Do\nQ\n`
  const contentBytes = encoder.encode(contentStream)
  offsets.push(byteOffset)
  pushAscii(`5 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`)
  pushBytes(contentBytes)
  pushAscii('endstream\nendobj\n')

  // Cross-reference table (each entry strictly 20 bytes: 10-digit offset + ' 00000 n \n')
  const xrefOffset = byteOffset
  pushAscii(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`)
  for (let i = 1; i < offsets.length; i += 1) {
    pushAscii(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }

  // Trailer & EOF
  pushAscii(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  return concatChunks(chunks)
}

/**
 * Wrap raw JPEG bytes into a single-page application/pdf Blob.
 */
export function createSinglePagePdfFromJpeg(
  jpegBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number,
  options?: PdfPageOptions,
): Blob {
  const bytes = buildSinglePagePdfBytes(jpegBytes, pixelWidth, pixelHeight, options)
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
