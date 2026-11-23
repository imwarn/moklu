/**
 * [INPUT]: depends on canvas & geometry helpers from ./canvasHelpers and IdCard* types from ./types
 * [OUTPUT]: exports A4_DIMENSIONS, ID1_CARD_DIMENSIONS, computeIdCardSheetLayout, and composeIdCardSheet
 * [POS]: privacy-first offline A4 ID card print sheet & anti-fraud security watermark engine within src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  canvasToBlob,
  clampNumber,
  clipRoundedRect,
  computeObjectFitRects,
  createCanvas,
  extensionForFormat,
  fillBackground,
  get2dContext,
  sanitizeFilenameStem,
  traceRoundedRectPath,
} from './canvasHelpers'
import type {
  Dimensions,
  IdCardDpi,
  IdCardSheetLayout,
  IdCardSheetOptions,
  IdCardSheetResult,
  IdCardSlotLayout,
  IdCardWatermarkOptions,
  IdCardWatermarkPlacement,
  LoadedImageItem,
} from './types'

/** Standard ISO 216 A4 canvas pixel dimensions (210mm x 297mm). */
export const A4_DIMENSIONS: Record<IdCardDpi, Dimensions> = {
  300: { width: 2480, height: 3508 },
  150: { width: 1240, height: 1754 },
}

/** Standard ISO/IEC 7810 ID-1 physical card pixel dimensions (85.6mm x 54mm). */
export const ID1_CARD_DIMENSIONS: Record<IdCardDpi, Dimensions> = {
  300: { width: 1011, height: 638 },
  150: { width: 506, height: 319 },
}

function buildWatermarkPlacements(
  pageWidth: number,
  pageHeight: number,
  slots: ReadonlyArray<IdCardSlotLayout>,
  dpiScale: number,
  watermark?: IdCardWatermarkOptions,
): IdCardWatermarkPlacement[] {
  const text = watermark?.text.trim()
  if (!text) return []

  const opacity = clampNumber(watermark?.opacity ?? 0.22, 0.05, 0.8)
  const color = watermark?.color ?? '#334155'
  const fontSize = Math.max(8, Math.round((watermark?.fontSize ?? 36) * dpiScale))
  const angleDeg = clampNumber(watermark?.angle ?? -30, -90, 90)
  const mode = watermark?.mode ?? 'tiled'

  const placements: IdCardWatermarkPlacement[] = []

  if (mode === 'across-card') {
    for (const slot of slots) {
      const { x, y, width, height } = slot.cardRect
      const rowFractions = [0.24, 0.5, 0.76]
      for (const fraction of rowFractions) {
        placements.push({
          text,
          x: x + width / 2,
          y: y + height * fraction,
          angleDeg,
          fontSize,
          opacity,
          color,
          slotIndex: slot.index,
        })
      }
    }
    return placements
  }

  // Full A4 tiled diagonal lattice with alternating row stagger.
  const defaultSpacingX = Math.max(fontSize * Math.max(6, text.length * 0.78), 460 * dpiScale)
  const defaultSpacingY = Math.max(fontSize * 4.5, 240 * dpiScale)
  const spacingX = Math.max(120 * dpiScale, (watermark?.spacingX ?? defaultSpacingX / dpiScale) * dpiScale)
  const spacingY = Math.max(80 * dpiScale, (watermark?.spacingY ?? defaultSpacingY / dpiScale) * dpiScale)

  let rowIndex = 0
  for (let y = spacingY * 0.5; y <= pageHeight + spacingY * 0.5; y += spacingY) {
    const xOffset = rowIndex % 2 === 1 ? spacingX / 2 : 0
    for (let x = -spacingX * 0.25 + xOffset; x <= pageWidth + spacingX * 0.25; x += spacingX) {
      placements.push({
        text,
        x: Math.round(x),
        y: Math.round(y),
        angleDeg,
        fontSize,
        opacity,
        color,
      })
    }
    rowIndex += 1
  }

  return placements
}

/**
 * Pure A4 layout solver placing 1 or 2 ID-1 cards in a centered vertical stack
 * with optional anti-fraud security watermark coordinates.
 */
export function computeIdCardSheetLayout(
  items: ReadonlyArray<Dimensions>,
  options: IdCardSheetOptions = {},
): IdCardSheetLayout {
  if (items.length < 1 || items.length > 2) {
    throw new Error(`ID card sheet requires 1 or 2 images; received ${items.length}.`)
  }

  const dpi: IdCardDpi = options.dpi ?? 300
  const dpiScale = dpi / 300
  const page = A4_DIMENSIONS[dpi]
  const card = ID1_CARD_DIMENSIONS[dpi]
  const cardGap = Math.max(0, Math.round((options.cardGap ?? 180) * dpiScale))
  const radius = Math.max(0, Math.round((options.cardBorderRadius ?? 36) * dpiScale))
  const fit = options.fit ?? 'contain'

  const totalStackHeight = items.length * card.height + (items.length - 1) * cardGap
  const cardX = Math.round((page.width - card.width) / 2)
  const startY = Math.round((page.height - totalStackHeight) / 2)

  const slots: IdCardSlotLayout[] = items.map((item, index) => {
    const cardRect = {
      x: cardX,
      y: startY + index * (card.height + cardGap),
      width: card.width,
      height: card.height,
    }
    const { sourceRect, destRect } = computeObjectFitRects(item.width, item.height, cardRect, fit)
    return {
      index,
      cardRect,
      imageSourceRect: sourceRect,
      imageDestRect: destRect,
      radius,
    }
  })

  const watermarks = buildWatermarkPlacements(
    page.width,
    page.height,
    slots,
    dpiScale,
    options.watermark,
  )

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    dpi,
    cardWidth: card.width,
    cardHeight: card.height,
    slots,
    watermarks,
  }
}

/**
 * Render 1 or 2 ID card / certificate images onto a print-ready A4 canvas 100% locally
 * with physical ID-1 proportions, optional photocopy B&W filter, and security watermark.
 */
export async function composeIdCardSheet(
  items: ReadonlyArray<LoadedImageItem>,
  options: IdCardSheetOptions = {},
): Promise<IdCardSheetResult> {
  if (items.length < 1 || items.length > 2) {
    throw new Error(`ID card sheet requires 1 or 2 images; received ${items.length}.`)
  }

  const format = options.format ?? 'image/png'
  const layout = computeIdCardSheetLayout(items, options)
  const dpiScale = layout.dpi / 300
  const canvas = createCanvas(layout.pageWidth, layout.pageHeight, options.createCanvas)
  const ctx = get2dContext(canvas)

  fillBackground(ctx, layout.pageWidth, layout.pageHeight, options.pageBackground ?? '#ffffff')

  const borderColor = options.cardBorderColor ?? '#cbd5e1'
  const borderWidth = Math.max(0, (options.cardBorderWidth ?? 2) * dpiScale)
  const grayscale = options.grayscale ?? false

  for (const slot of layout.slots) {
    const item = items[slot.index]
    const { cardRect, imageSourceRect, imageDestRect, radius } = slot

    // Draw clipped card image (with optional photocopy B&W high-contrast filter).
    ctx.save()
    clipRoundedRect(ctx, cardRect.x, cardRect.y, cardRect.width, cardRect.height, radius)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cardRect.x, cardRect.y, cardRect.width, cardRect.height)
    if (grayscale) {
      ctx.filter = 'grayscale(100%) contrast(115%)'
    }
    ctx.drawImage(
      item.source,
      imageSourceRect.x,
      imageSourceRect.y,
      imageSourceRect.width,
      imageSourceRect.height,
      imageDestRect.x,
      imageDestRect.y,
      imageDestRect.width,
      imageDestRect.height,
    )
    ctx.restore()

    // Subtle crisp card boundary stroke.
    if (borderWidth > 0) {
      ctx.save()
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      traceRoundedRectPath(ctx, cardRect.x, cardRect.y, cardRect.width, cardRect.height, radius)
      ctx.stroke()
      ctx.restore()
    }
  }

  // Render anti-fraud security watermark placements strictly client-side.
  for (const wm of layout.watermarks) {
    ctx.save()
    if (wm.slotIndex !== undefined) {
      const slot = layout.slots[wm.slotIndex]
      if (slot) {
        clipRoundedRect(
          ctx,
          slot.cardRect.x,
          slot.cardRect.y,
          slot.cardRect.width,
          slot.cardRect.height,
          slot.radius,
        )
      }
    }
    ctx.globalAlpha = wm.opacity
    ctx.fillStyle = wm.color
    ctx.font = `600 ${wm.fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.translate(wm.x, wm.y)
    ctx.rotate((wm.angleDeg * Math.PI) / 180)
    ctx.fillText(wm.text, 0, 0)
    ctx.restore()
  }

  const blob = await canvasToBlob(canvas, format, options.quality ?? 0.95)
  const stem = sanitizeFilenameStem(options.filename ?? `id-card-a4-${layout.dpi}dpi`, 'id-card-a4')
  const filename = `${stem}.${extensionForFormat(format)}`

  return {
    blob,
    width: layout.pageWidth,
    height: layout.pageHeight,
    dpi: layout.dpi,
    format,
    bytes: blob.size,
    filename,
    layout,
  }
}
