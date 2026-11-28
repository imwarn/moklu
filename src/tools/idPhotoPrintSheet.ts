/**
 * [INPUT]: depends on canvasHelpers for Canvas 2D creation/encoding, createSinglePagePdfFromJpeg from ./pdfHelper, and print sheet types from ./types
 * [OUTPUT]: exports computeIdPhotoSheetLayout and composeIdPhotoPrintSheet for 300 DPI 4R 6-inch and A4 PNG / PDF 1.4 print sheets
 * [POS]: 300 DPI ID photo print sheet layout solver & exterior-cut-mark renderer in src/tools; re-exported through ./idPhotoEngine and ./index
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  createCanvas,
  fillBackground,
  get2dContext,
  sanitizeFilenameStem,
} from './canvasHelpers'
import { createSinglePagePdfFromJpeg } from './pdfHelper'
import type {
  CanvasContextLike,
  IdPhotoPrintSheetLayout,
  IdPhotoPrintSheetOptions,
  IdPhotoPrintSheetResult,
  IdPhotoSheetPaper,
  Rect,
} from './types'

function solveSheetGrid(
  paperW: number,
  paperH: number,
  photoW: number,
  photoH: number,
  marginPx: number,
  gapPx: number,
): IdPhotoPrintSheetLayout {
  const usableW = Math.max(1, paperW - marginPx * 2)
  const usableH = Math.max(1, paperH - marginPx * 2)

  const columns = Math.max(1, Math.floor((usableW + gapPx) / (photoW + gapPx)))
  const rows = Math.max(1, Math.floor((usableH + gapPx) / (photoH + gapPx)))

  const cellW = columns === 1 && photoW > usableW ? usableW : photoW
  const cellH = rows === 1 && photoH > usableH ? usableH : photoH

  const totalW = columns * cellW + (columns - 1) * gapPx
  const totalH = rows * cellH + (rows - 1) * gapPx
  const startX = Math.round((paperW - totalW) / 2)
  const startY = Math.round((paperH - totalH) / 2)

  const slots: Rect[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      slots.push({
        x: startX + col * (cellW + gapPx),
        y: startY + row * (cellH + gapPx),
        width: cellW,
        height: cellH,
      })
    }
  }

  return {
    paperWidthPx: paperW,
    paperHeightPx: paperH,
    columns,
    rows,
    count: slots.length,
    slots,
  }
}

/**
 * Pure 300 DPI print sheet layout solver for 4R 6-inch photo paper (auto-selecting portrait vs landscape
 * for maximum photo yield) and ISO A4 paper (2480 x 3508 px).
 */
export function computeIdPhotoSheetLayout(
  photoWidthPx: number,
  photoHeightPx: number,
  paper: IdPhotoSheetPaper,
  options?: { gapPx?: number; marginPx?: number },
): IdPhotoPrintSheetLayout {
  const photoW = Math.max(1, Math.round(photoWidthPx))
  const photoH = Math.max(1, Math.round(photoHeightPx))

  if (paper === 'a4') {
    const marginPx = Math.max(0, Math.round(options?.marginPx ?? 90))
    const gapPx = Math.max(0, Math.round(options?.gapPx ?? 36))
    return solveSheetGrid(2480, 3508, photoW, photoH, marginPx, gapPx)
  }

  const marginPx = Math.max(0, Math.round(options?.marginPx ?? 48))
  const gapPx = Math.max(0, Math.round(options?.gapPx ?? 28))
  const landscape = solveSheetGrid(1800, 1200, photoW, photoH, marginPx, gapPx)
  const portrait = solveSheetGrid(1200, 1800, photoW, photoH, marginPx, gapPx)
  return portrait.count > landscape.count ? portrait : landscape
}

function drawExteriorCropMarks(ctx: CanvasContextLike, slot: Rect, gapPx: number): void {
  const offset = 3
  const len = Math.max(6, Math.min(12, Math.floor(Math.max(gapPx, 12) / 2)))
  const left = slot.x
  const right = slot.x + slot.width
  const top = slot.y
  const bottom = slot.y + slot.height

  ctx.save()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1.5
  ctx.beginPath()

  // Top-left exterior corner
  ctx.moveTo(left - offset - len, top)
  ctx.lineTo(left - offset, top)
  ctx.moveTo(left, top - offset - len)
  ctx.lineTo(left, top - offset)

  // Top-right exterior corner
  ctx.moveTo(right + offset, top)
  ctx.lineTo(right + offset + len, top)
  ctx.moveTo(right, top - offset - len)
  ctx.lineTo(right, top - offset)

  // Bottom-left exterior corner
  ctx.moveTo(left - offset - len, bottom)
  ctx.lineTo(left - offset, bottom)
  ctx.moveTo(left, bottom + offset)
  ctx.lineTo(left, bottom + offset + len)

  // Bottom-right exterior corner
  ctx.moveTo(right + offset, bottom)
  ctx.lineTo(right + offset + len, bottom)
  ctx.moveTo(right, bottom + offset)
  ctx.lineTo(right, bottom + offset + len)

  ctx.stroke()
  ctx.restore()
}

/**
 * Tile a rendered ID photo onto a 300 DPI 6-inch (4R) or A4 print sheet with optional exterior
 * L-shaped cut marks, exporting either lossless PNG or a zero-dependency single-page PDF 1.4 Blob.
 */
export async function composeIdPhotoPrintSheet(
  options: IdPhotoPrintSheetOptions,
): Promise<IdPhotoPrintSheetResult> {
  const dpi = options.dpi ?? 300
  const format = options.format ?? 'image/png'
  const defaultGap = options.paper === 'a4' ? 36 : 28
  const gapPx = Math.max(0, Math.round(options.gapPx ?? defaultGap))
  const layout = computeIdPhotoSheetLayout(options.photoWidthPx, options.photoHeightPx, options.paper, {
    gapPx,
    marginPx: options.marginPx,
  })

  const canvas = createCanvas(layout.paperWidthPx, layout.paperHeightPx, options.createCanvas)
  const ctx = get2dContext(canvas)
  fillBackground(ctx, layout.paperWidthPx, layout.paperHeightPx, '#ffffff')

  const srcW = Math.max(1, Math.round(options.photoWidthPx))
  const srcH = Math.max(1, Math.round(options.photoHeightPx))
  const drawCropMarks = options.cropMarks !== false

  for (const slot of layout.slots) {
    ctx.drawImage(options.photoDrawable, 0, 0, srcW, srcH, slot.x, slot.y, slot.width, slot.height)
    if (drawCropMarks) {
      drawExteriorCropMarks(ctx, slot, gapPx)
    }
  }

  let blob: Blob
  let ext: string
  if (format === 'application/pdf') {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
    blob = createSinglePagePdfFromJpeg(jpegBytes, layout.paperWidthPx, layout.paperHeightPx, { dpi })
    ext = 'pdf'
  } else {
    blob = await canvasToBlob(canvas, 'image/png')
    ext = 'png'
  }

  const stem = sanitizeFilenameStem(options.filenameStem ?? `id-photo-sheet-${options.paper}`, 'id-photo-sheet')
  return {
    blob,
    width: layout.paperWidthPx,
    height: layout.paperHeightPx,
    count: layout.count,
    columns: layout.columns,
    rows: layout.rows,
    format,
    filename: `${stem}.${ext}`,
  }
}
