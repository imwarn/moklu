/**
 * [INPUT]: depends on dynamic jszip import, createSinglePagePdfFromJpeg from @/tools/pdfHelper, canvas helpers from ./canvasUtils, and workspace engine types from ./types
 * [OUTPUT]: exports createDefaultWorkspaceEngines providing standalone browser-native merge (PNG/JPEG/WebP/PDF, rotation, borders, cross-axis alignment), split, compress, transform, idCard, and on-demand packZip implementations
 * [POS]: default DIP fallback implementation for QuickWorkspace when concrete src/tools engines are not injected
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createSinglePagePdfFromJpeg } from '@/tools/pdfHelper'
import {
  clampDimensions,
  drawFittedImage,
  drawRoundedRectPath,
  extensionForMime,
  fillBackground,
  finalizeCanvasOutput,
  loadHtmlImage,
  stripExtension,
} from './canvasUtils'
import type {
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceCompressItem,
  WorkspaceCompressOptions,
  WorkspaceEngines,
  WorkspaceIdCardOptions,
  WorkspaceImageInput,
  WorkspaceMergeAlign,
  WorkspaceMergeLayout,
  WorkspaceMergeOptions,
  WorkspaceMergeOutput,
  WorkspaceMergePlacement,
  WorkspaceMergeRotation,
  WorkspaceRect,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceSplitSlice,
  WorkspaceTransformOptions,
} from './types'

interface MergePlacement {
  index: number
  img: HTMLImageElement
  x: number
  y: number
  w: number
  h: number
  fit: 'cover' | 'contain'
  rotation: WorkspaceMergeRotation
  sourceRect: WorkspaceRect
  destRect: WorkspaceRect
}

function mapRotatedSourceRect(
  rotatedRect: WorkspaceRect,
  origWidth: number,
  origHeight: number,
  rotation: WorkspaceMergeRotation,
): WorkspaceRect {
  const { x: rx, y: ry, width: rw, height: rh } = rotatedRect
  switch (rotation) {
    case 90:
      return { x: ry, y: origHeight - (rx + rw), width: rh, height: rw }
    case 180:
      return { x: origWidth - (rx + rw), y: origHeight - (ry + rh), width: rw, height: rh }
    case 270:
      return { x: origWidth - (ry + rh), y: rx, width: rh, height: rw }
    case 0:
    default:
      return rotatedRect
  }
}

function computeCellFitRects(
  effW: number,
  effH: number,
  box: WorkspaceRect,
  fit: 'cover' | 'contain',
): { rotatedSourceRect: WorkspaceRect; destRect: WorkspaceRect } {
  const srcRatio = effW / Math.max(1, effH)
  const dstRatio = box.width / Math.max(1, box.height)
  if (fit === 'cover') {
    let sx = 0
    let sy = 0
    let cropW = effW
    let cropH = effH
    if (srcRatio > dstRatio) {
      cropW = effH * dstRatio
      sx = (effW - cropW) / 2
    } else {
      cropH = effW / dstRatio
      sy = (effH - cropH) / 2
    }
    return {
      rotatedSourceRect: { x: sx, y: sy, width: cropW, height: cropH },
      destRect: box,
    }
  }
  let rw = box.width
  let rh = box.height
  if (srcRatio > dstRatio) {
    rh = box.width / srcRatio
  } else {
    rw = box.height * srcRatio
  }
  return {
    rotatedSourceRect: { x: 0, y: 0, width: effW, height: effH },
    destRect: {
      x: box.x + (box.width - rw) / 2,
      y: box.y + (box.height - rh) / 2,
      width: rw,
      height: rh,
    },
  }
}

function resolveCrossOffset(containerSpan: number, itemSpan: number, align: WorkspaceMergeAlign): number {
  const slack = containerSpan - itemSpan
  if (align === 'start') return 0
  if (align === 'end') return slack
  return slack / 2
}

function aspectRatioValue(aspect: WorkspaceAspectPreset): number | null {
  switch (aspect) {
    case '1:1': return 1
    case '4:5': return 4 / 5
    case '3:4': return 3 / 4
    case '16:9': return 16 / 9
    case '9:16': return 9 / 16
    case '3:2': return 3 / 2
    case 'free': return null
  }
}

async function packZipFallback(files: Array<{ filename: string; blob: Blob }>): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const file of files) {
    const bytes = new Uint8Array(await file.blob.arrayBuffer())
    zip.file(file.filename, bytes)
  }
  const archive = await zip.generateAsync({ type: 'uint8array' })
  return new Blob([new Uint8Array(archive)], { type: 'application/zip' })
}

function computeMergeLayout(
  loaded: Array<{ img: HTMLImageElement; rotation: WorkspaceMergeRotation }>,
  options: WorkspaceMergeOptions,
): { placements: MergePlacement[]; totalW: number; totalH: number } {
  const pad = Math.max(0, options.padding)
  const gap = Math.max(0, options.gap)
  const align: WorkspaceMergeAlign = options.align ?? 'center'
  const dims = loaded.map(({ img, rotation }, index) => {
    const nw = img.naturalWidth || img.width
    const nh = img.naturalHeight || img.height
    return rotation === 90 || rotation === 270
      ? { index, img, rotation, origW: nw, origH: nh, w: nh, h: nw }
      : { index, img, rotation, origW: nw, origH: nh, w: nw, h: nh }
  })

  if (options.direction === 'horizontal') {
    const targetH = options.normalize === 'match-min'
      ? Math.min(...dims.map((d) => d.h))
      : Math.max(...dims.map((d) => d.h))
    let cursorX = pad
    const placements = dims.map((d) => {
      const h = options.normalize === 'original' ? d.h : targetH
      const w = options.normalize === 'original' ? d.w : Math.max(1, Math.round((d.w / d.h) * targetH))
      const y = pad + resolveCrossOffset(targetH, h, align)
      const destRect: WorkspaceRect = { x: cursorX, y, width: w, height: h }
      const item: MergePlacement = {
        index: d.index,
        img: d.img,
        x: cursorX,
        y,
        w,
        h,
        fit: 'cover',
        rotation: d.rotation,
        sourceRect: { x: 0, y: 0, width: d.origW, height: d.origH },
        destRect,
      }
      cursorX += w + gap
      return item
    })
    return { placements, totalW: cursorX - gap + pad, totalH: targetH + pad * 2 }
  }

  if (options.direction === 'vertical') {
    const targetW = options.normalize === 'match-min'
      ? Math.min(...dims.map((d) => d.w))
      : Math.max(...dims.map((d) => d.w))
    let cursorY = pad
    const placements = dims.map((d) => {
      const w = options.normalize === 'original' ? d.w : targetW
      const h = options.normalize === 'original' ? d.h : Math.max(1, Math.round((d.h / d.w) * targetW))
      const x = pad + resolveCrossOffset(targetW, w, align)
      const destRect: WorkspaceRect = { x, y: cursorY, width: w, height: h }
      const item: MergePlacement = {
        index: d.index,
        img: d.img,
        x,
        y: cursorY,
        w,
        h,
        fit: 'cover',
        rotation: d.rotation,
        sourceRect: { x: 0, y: 0, width: d.origW, height: d.origH },
        destRect,
      }
      cursorY += h + gap
      return item
    })
    return { placements, totalW: targetW + pad * 2, totalH: cursorY - gap + pad }
  }

  const cols = Math.max(1, Math.min(6, options.columns, dims.length))
  const rows = Math.ceil(dims.length / cols)
  const cellW = Math.max(1, ...dims.map((d) => Math.round(d.w)))
  const cellRatio = options.aspectCell === '1:1'
    ? 1
    : options.aspectCell === '4:3'
      ? 4 / 3
      : options.aspectCell === '3:4'
        ? 3 / 4
        : dims.reduce((sum, d) => sum + d.w / d.h, 0) / dims.length
  const cellH = Math.max(1, Math.round(cellW / cellRatio))
  const placements: MergePlacement[] = dims.map((d, idx) => {
    const cellBox: WorkspaceRect = {
      x: pad + (idx % cols) * (cellW + gap),
      y: pad + Math.floor(idx / cols) * (cellH + gap),
      width: cellW,
      height: cellH,
    }
    const { rotatedSourceRect, destRect } = computeCellFitRects(d.w, d.h, cellBox, options.fit)
    const sourceRect = mapRotatedSourceRect(rotatedSourceRect, d.origW, d.origH, d.rotation)
    return {
      index: d.index,
      img: d.img,
      x: cellBox.x,
      y: cellBox.y,
      w: cellW,
      h: cellH,
      fit: options.fit,
      rotation: d.rotation,
      sourceRect,
      destRect,
    }
  })
  return {
    placements,
    totalW: pad * 2 + cols * cellW + (cols - 1) * gap,
    totalH: pad * 2 + rows * cellH + (rows - 1) * gap,
  }
}

async function mergeFallback(
  images: WorkspaceImageInput[],
  options: WorkspaceMergeOptions,
): Promise<WorkspaceMergeOutput> {
  if (images.length === 0) throw new Error('At least one image is required to merge')
  const loaded = await Promise.all(
    images.map(async (item) => ({
      img: await loadHtmlImage(item.dataUrl),
      rotation: (item.rotation ?? 0) as WorkspaceMergeRotation,
    })),
  )
  const radius = Math.max(0, options.borderRadius)
  const borderWidth = Math.max(0, options.borderWidth ?? 0)
  const borderColor = options.borderColor ?? '#ffffff'
  const { placements, totalW, totalH } = computeMergeLayout(loaded, options)

  const clamped = clampDimensions(totalW, totalH)
  const scale = Math.min(clamped.width / Math.max(1, totalW), clamped.height / Math.max(1, totalH), 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(totalW * scale))
  canvas.height = Math.max(1, Math.round(totalH * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  const isPdf = options.format === 'application/pdf'
  const bg = (options.format === 'image/jpeg' || isPdf) && options.background === 'transparent'
    ? '#ffffff'
    : options.background
  fillBackground(ctx, canvas.width, canvas.height, bg)
  ctx.scale(scale, scale)

  for (const item of placements) {
    ctx.save()
    drawRoundedRectPath(ctx, item.x, item.y, item.w, item.h, radius)
    ctx.clip()
    if (item.rotation === 0) {
      drawFittedImage(ctx, item.img, item.x, item.y, item.w, item.h, item.fit)
    } else {
      const cx = item.x + item.w / 2
      const cy = item.y + item.h / 2
      const swapped = item.rotation === 90 || item.rotation === 270
      const dw = swapped ? item.h : item.w
      const dh = swapped ? item.w : item.h
      ctx.translate(cx, cy)
      ctx.rotate((item.rotation * Math.PI) / 180)
      drawFittedImage(ctx, item.img, -dw / 2, -dh / 2, dw, dh, item.fit)
    }
    ctx.restore()

    if (borderWidth > 0) {
      const lw = Math.min(borderWidth, item.w / 2, item.h / 2)
      const inset = lw / 2
      if (item.w - lw > 0 && item.h - lw > 0) {
        ctx.save()
        drawRoundedRectPath(ctx, item.x + inset, item.y + inset, item.w - lw, item.h - lw, Math.max(0, radius - inset))
        ctx.strokeStyle = borderColor
        ctx.lineWidth = lw
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  const scaledPlacements: WorkspaceMergePlacement[] = placements.map((item) => ({
    index: item.index,
    sourceRect: item.sourceRect,
    destRect: {
      x: item.destRect.x * scale,
      y: item.destRect.y * scale,
      width: item.destRect.width * scale,
      height: item.destRect.height * scale,
    },
    radius: radius * scale,
    rotation: item.rotation,
    borderWidth: borderWidth * scale,
  }))
  const layout: WorkspaceMergeLayout = {
    width: canvas.width,
    height: canvas.height,
    scaleFactor: scale,
    placements: scaledPlacements,
    overlapRemovedPx: 0,
  }

  const ext = extensionForMime(options.format)
  if (options.format === 'application/pdf') {
    const jpegOut = await finalizeCanvasOutput(
      canvas,
      `moklu-merge-${options.direction}.jpg`,
      'image/jpeg',
      options.quality,
    )
    const jpegBytes = new Uint8Array(await jpegOut.blob.arrayBuffer())
    const pdfBlob = createSinglePagePdfFromJpeg(jpegBytes, canvas.width, canvas.height)
    return {
      blob: pdfBlob,
      dataUrl: jpegOut.dataUrl,
      width: canvas.width,
      height: canvas.height,
      filename: `moklu-merge-${options.direction}.${ext}`,
      sizeBytes: pdfBlob.size,
      mimeType: 'application/pdf',
      scaleFactor: scale,
      layout,
    }
  }

  const out = await finalizeCanvasOutput(canvas, `moklu-merge-${options.direction}.${ext}`, options.format, options.quality)
  return { ...out, scaleFactor: scale, layout }
}

async function splitFallback(
  image: WorkspaceImageInput,
  options: WorkspaceSplitOptions,
): Promise<WorkspaceSplitResult> {
  const img = await loadHtmlImage(image.dataUrl)
  const sw = img.naturalWidth || img.width
  const sh = img.naturalHeight || img.height
  const ext = extensionForMime(options.format)
  const base = stripExtension(image.name) || 'moklu-slice'
  const slices: WorkspaceSplitSlice[] = []

  if (options.mode === 'carousel') {
    const count = Math.max(2, Math.min(10, options.carouselCount))
    const slideDims = options.carouselAspect === '4:5'
      ? { w: 1080, h: 1350 }
      : options.carouselAspect === '3:4'
        ? { w: 1080, h: 1440 }
        : options.carouselAspect === '1:1'
          ? { w: 1080, h: 1080 }
          : { w: Math.max(1, Math.round(sw / count)), h: sh }

    const panoCanvas = document.createElement('canvas')
    const panoClamped = clampDimensions(slideDims.w * count, slideDims.h)
    const finalSlideW = Math.max(1, Math.floor(panoClamped.width / count))
    const finalSlideH = panoClamped.height
    panoCanvas.width = finalSlideW * count
    panoCanvas.height = finalSlideH
    const panoCtx = panoCanvas.getContext('2d')
    if (!panoCtx) throw new Error('2D canvas context unavailable')
    drawFittedImage(panoCtx, img, 0, 0, panoCanvas.width, panoCanvas.height, 'cover')

    for (let i = 0; i < count; i += 1) {
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = finalSlideW
      sliceCanvas.height = finalSlideH
      const sctx = sliceCanvas.getContext('2d')
      if (!sctx) throw new Error('2D canvas context unavailable')
      sctx.drawImage(panoCanvas, i * finalSlideW, 0, finalSlideW, finalSlideH, 0, 0, finalSlideW, finalSlideH)
      const out = await finalizeCanvasOutput(
        sliceCanvas,
        `${base}-slide-${String(i + 1).padStart(2, '0')}.${ext}`,
        options.format,
        options.quality,
      )
      slices.push({ ...out, index: i, row: 0, col: i })
    }
  } else {
    const rows = Math.max(1, Math.min(6, options.rows))
    const cols = Math.max(1, Math.min(6, options.cols))
    const cellW = Math.max(1, Math.floor(sw / cols))
    const cellH = Math.max(1, Math.floor(sh / rows))
    let index = 0
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = cellW
        sliceCanvas.height = cellH
        const sctx = sliceCanvas.getContext('2d')
        if (!sctx) throw new Error('2D canvas context unavailable')
        sctx.drawImage(img, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH)
        const out = await finalizeCanvasOutput(
          sliceCanvas,
          `${base}-r${r + 1}-c${c + 1}.${ext}`,
          options.format,
          options.quality,
        )
        slices.push({ ...out, index, row: r, col: c })
        index += 1
      }
    }
  }

  const zipBlob = await packZipFallback(slices.map((s) => ({ filename: s.filename, blob: s.blob })))
  return { slices, zipBlob }
}

async function compressFallback(
  images: WorkspaceImageInput[],
  options: WorkspaceCompressOptions,
): Promise<WorkspaceCompressItem[]> {
  const ext = extensionForMime(options.format)
  const results: WorkspaceCompressItem[] = []
  for (const item of images) {
    const img = await loadHtmlImage(item.dataUrl)
    let w = img.naturalWidth || img.width
    let h = img.naturalHeight || img.height
    if (options.maxWidth && options.maxWidth > 0 && w > options.maxWidth) {
      const ratio = options.maxWidth / w
      w = Math.round(w * ratio)
      h = Math.max(1, Math.round(h * ratio))
    }
    if (options.maxHeight && options.maxHeight > 0 && h > options.maxHeight) {
      const ratio = options.maxHeight / h
      h = Math.round(h * ratio)
      w = Math.max(1, Math.round(w * ratio))
    }
    const clamped = clampDimensions(w, h)
    const canvas = document.createElement('canvas')
    canvas.width = clamped.width
    canvas.height = clamped.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const filename = `${stripExtension(item.name) || 'image'}-compressed.${ext}`
    const out = await finalizeCanvasOutput(canvas, filename, options.format, options.quality)
    const savedRatio = item.sizeBytes > 0 ? (item.sizeBytes - out.sizeBytes) / item.sizeBytes : 0
    results.push({
      ...out,
      id: item.id,
      originalName: item.name,
      originalBytes: item.sizeBytes,
      outputBytes: out.sizeBytes,
      savedRatio,
    })
  }
  return results
}

async function transformFallback(
  images: WorkspaceImageInput[],
  options: WorkspaceTransformOptions,
): Promise<WorkspaceBlobOutput[]> {
  const ext = extensionForMime(options.format)
  const outputs: WorkspaceBlobOutput[] = []

  for (const item of images) {
    const img = await loadHtmlImage(item.dataUrl)
    const sw = img.naturalWidth || img.width
    const sh = img.naturalHeight || img.height
    const targetAspect = aspectRatioValue(options.aspectRatio)

    if (options.mode === 'resize') {
      const targetW = options.scale && options.scale > 0
        ? Math.max(1, Math.round(sw * options.scale))
        : options.width && options.width > 0
          ? options.width
          : sw
      const targetH = options.scale && options.scale > 0
        ? Math.max(1, Math.round(sh * options.scale))
        : options.height && options.height > 0
          ? options.height
          : Math.max(1, Math.round((sh / sw) * targetW))
      const clamped = clampDimensions(targetW, targetH)
      const canvas = document.createElement('canvas')
      canvas.width = clamped.width
      canvas.height = clamped.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D canvas context unavailable')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      outputs.push(
        await finalizeCanvasOutput(
          canvas,
          `${stripExtension(item.name) || 'image'}-${canvas.width}x${canvas.height}.${ext}`,
          options.format,
          options.quality,
        ),
      )
      continue
    }

    if (options.mode === 'crop') {
      const ratio = targetAspect ?? sw / sh
      let cropW = sw
      let cropH = sh
      if (sw / sh > ratio) {
        cropW = Math.max(1, Math.round(sh * ratio))
      } else {
        cropH = Math.max(1, Math.round(sw / ratio))
      }
      const sx = Math.round((sw - cropW) / 2)
      const sy = Math.round((sh - cropH) / 2)
      const clamped = clampDimensions(cropW, cropH)
      const canvas = document.createElement('canvas')
      canvas.width = clamped.width
      canvas.height = clamped.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D canvas context unavailable')
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height)
      outputs.push(
        await finalizeCanvasOutput(
          canvas,
          `${stripExtension(item.name) || 'image'}-crop.${ext}`,
          options.format,
          options.quality,
        ),
      )
      continue
    }

    const border = Math.max(0, options.borderPx)
    let outW = sw + border * 2
    let outH = sh + border * 2
    if (targetAspect) {
      if (outW / outH > targetAspect) {
        outH = Math.round(outW / targetAspect)
      } else {
        outW = Math.round(outH * targetAspect)
      }
    }
    const clamped = clampDimensions(outW, outH)
    const scale = Math.min(clamped.width / outW, clamped.height / outH, 1)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(outW * scale))
    canvas.height = Math.max(1, Math.round(outH * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    fillBackground(ctx, canvas.width, canvas.height, options.background)

    const drawW = Math.round(sw * scale)
    const drawH = Math.round(sh * scale)
    const dx = Math.round((canvas.width - drawW) / 2)
    const dy = Math.round((canvas.height - drawH) / 2)
    const radius = Math.round(options.borderRadius * scale)

    if (options.shadow) {
      ctx.save()
      ctx.shadowColor = 'rgba(15, 23, 42, 0.25)'
      ctx.shadowBlur = Math.max(12, Math.round(28 * scale))
      ctx.shadowOffsetY = Math.max(4, Math.round(12 * scale))
      drawRoundedRectPath(ctx, dx, dy, drawW, drawH, radius)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    drawRoundedRectPath(ctx, dx, dy, drawW, drawH, radius)
    ctx.clip()
    ctx.drawImage(img, dx, dy, drawW, drawH)
    ctx.restore()

    outputs.push(
      await finalizeCanvasOutput(
        canvas,
        `${stripExtension(item.name) || 'image'}-framed.${ext}`,
        options.format,
        options.quality,
      ),
    )
  }
  return outputs
}

async function idCardFallback(
  front: WorkspaceImageInput | null,
  back: WorkspaceImageInput | null,
  options: WorkspaceIdCardOptions,
): Promise<WorkspaceBlobOutput> {
  const is300 = options.dpi === 300
  const width = is300 ? 2480 : 1240
  const height = is300 ? 3508 : 1754
  const cardW = is300 ? 1011 : 506
  const cardH = is300 ? 638 : 319
  const cardRadius = is300 ? 32 : 16
  const cardGap = is300 ? 220 : 110
  const cardX = Math.round((width - cardW) / 2)
  const firstY = Math.round((height - (cardH * 2 + cardGap)) / 2)
  const secondY = firstY + cardH + cardGap

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const slots: Array<{ item: WorkspaceImageInput | null; y: number }> = [
    { item: front, y: firstY },
    { item: back, y: secondY },
  ]

  for (const slot of slots) {
    if (!slot.item) continue
    const img = await loadHtmlImage(slot.item.dataUrl)
    ctx.save()
    drawRoundedRectPath(ctx, cardX, slot.y, cardW, cardH, cardRadius)
    ctx.clip()
    if (options.grayscale) {
      ctx.filter = 'grayscale(100%) contrast(112%)'
    }
    drawFittedImage(ctx, img, cardX, slot.y, cardW, cardH, 'cover')
    ctx.restore()

    ctx.save()
    drawRoundedRectPath(ctx, cardX, slot.y, cardW, cardH, cardRadius)
    ctx.strokeStyle = 'rgba(15,23,42,0.16)'
    ctx.lineWidth = is300 ? 3 : 2
    ctx.stroke()
    ctx.restore()
  }

  const watermark = options.watermarkText.trim()
  if (watermark) {
    const scale = is300 ? 2 : 1
    const fontPx = Math.max(14, Math.round(options.watermarkFontSize * scale))
    const angleRad = (options.watermarkAngle * Math.PI) / 180

    const drawPattern = (x: number, y: number, w: number, h: number) => {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      ctx.globalAlpha = Math.max(0.05, Math.min(0.85, options.watermarkOpacity))
      ctx.fillStyle = options.watermarkColor || '#334155'
      ctx.font = `600 ${fontPx}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const stepX = Math.max(fontPx * 7, ctx.measureText(watermark).width + fontPx * 2.4)
      const stepY = Math.max(fontPx * 3.6, 120 * scale)
      const diag = Math.hypot(w, h)
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate(angleRad)
      for (let py = -diag; py <= diag; py += stepY) {
        for (let px = -diag; px <= diag; px += stepX) {
          ctx.fillText(watermark, px, py)
        }
      }
      ctx.restore()
    }

    if (options.watermarkMode === 'across-card') {
      for (const slot of slots) {
        if (slot.item) drawPattern(cardX, slot.y, cardW, cardH)
      }
    } else {
      drawPattern(0, 0, width, height)
    }
  }

  return finalizeCanvasOutput(canvas, `moklu-id-card-a4-${options.dpi}dpi.png`, 'image/png', 1)
}

export function createDefaultWorkspaceEngines(): WorkspaceEngines {
  return {
    merge: mergeFallback,
    split: splitFallback,
    compress: compressFallback,
    transform: transformFallback,
    idCard: idCardFallback,
    packZip: packZipFallback,
  }
}
