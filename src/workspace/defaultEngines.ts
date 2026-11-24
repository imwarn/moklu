/**
 * [INPUT]: depends on dynamic jszip import, applySeamOverlapOverrides, createMultiPagePdfFromJpegs, and createSinglePagePdfFromJpeg from @/tools, canvas helpers from ./canvasUtils, and workspace engine types from ./types
 * [OUTPUT]: exports createDefaultWorkspaceEngines providing standalone browser-native merge (PNG/JPEG/WebP/single-or-multipage PDF, seam overrides, rotation, borders, cross-axis alignment), split, compress (quality slider & target-KB binary search with auto-downscale and EXIF/original passthrough), transform, idCard, and on-demand packZip implementations
 * [POS]: default DIP fallback implementation for QuickWorkspace when concrete src/tools engines are not injected
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import {
  applySeamOverlapOverrides,
  canEncodeCanvasFormat,
  createMultiPagePdfFromJpegs,
  createSinglePagePdfFromJpeg,
  type MultiPagePdfPageInput,
} from '@/tools'
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
  WorkspaceMergeSeamInfo,
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

function mapRotatedSourceRect(r: WorkspaceRect, origW: number, origH: number, rotation: WorkspaceMergeRotation): WorkspaceRect {
  if (rotation === 90) return { x: r.y, y: origH - (r.x + r.width), width: r.height, height: r.width }
  if (rotation === 180) return { x: origW - (r.x + r.width), y: origH - (r.y + r.height), width: r.width, height: r.height }
  if (rotation === 270) return { x: origW - (r.y + r.height), y: r.x, width: r.height, height: r.width }
  return r
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
    const cropW = srcRatio > dstRatio ? effH * dstRatio : effW
    const cropH = srcRatio > dstRatio ? effH : effW / dstRatio
    return {
      rotatedSourceRect: { x: (effW - cropW) / 2, y: (effH - cropH) / 2, width: cropW, height: cropH },
      destRect: box,
    }
  }
  const rw = srcRatio > dstRatio ? box.width : box.height * srcRatio
  const rh = srcRatio > dstRatio ? box.width / srcRatio : box.height
  return {
    rotatedSourceRect: { x: 0, y: 0, width: effW, height: effH },
    destRect: { x: box.x + (box.width - rw) / 2, y: box.y + (box.height - rh) / 2, width: rw, height: rh },
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

function createCanvas2d(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
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
): {
  placements: MergePlacement[]
  totalW: number
  totalH: number
  rawOverlapRemovedPx: number
  seams?: WorkspaceMergeSeamInfo[]
} {
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
    return { placements, totalW: cursorX - gap + pad, totalH: targetH + pad * 2, rawOverlapRemovedPx: 0 }
  }

  if (options.direction === 'vertical') {
    const targetW = options.normalize === 'match-min'
      ? Math.min(...dims.map((d) => d.w))
      : Math.max(...dims.map((d) => d.w))
    const seamPlan =
      dims.length >= 2
        ? applySeamOverlapOverrides(
            dims.map((d) => d.h),
            undefined,
            undefined,
            options.seamOverlapOverrides,
          )
        : undefined
    let cursorY = pad
    let rawOverlapRemovedPx = 0
    const placements = dims.map((d, idx) => {
      const trimTop = seamPlan?.trims[idx]?.trimTop ?? 0
      const trimBottom = seamPlan?.trims[idx]?.trimBottom ?? 0
      const keptH = Math.max(1, d.h - trimTop - trimBottom)
      const w = options.normalize === 'original' ? d.w : targetW
      const fullH = options.normalize === 'original' ? d.h : Math.max(1, Math.round((d.h / d.w) * targetW))
      const h = trimTop === 0 && trimBottom === 0 ? fullH : Math.max(1, Math.round((keptH / d.w) * w))
      rawOverlapRemovedPx += Math.max(0, fullH - h)
      const x = pad + resolveCrossOffset(targetW, w, align)
      const destRect: WorkspaceRect = { x, y: cursorY, width: w, height: h }
      const sourceRect =
        trimTop === 0 && trimBottom === 0
          ? { x: 0, y: 0, width: d.origW, height: d.origH }
          : mapRotatedSourceRect({ x: 0, y: trimTop, width: d.w, height: keptH }, d.origW, d.origH, d.rotation)
      const item: MergePlacement = {
        index: d.index,
        img: d.img,
        x,
        y: cursorY,
        w,
        h,
        fit: 'cover',
        rotation: d.rotation,
        sourceRect,
        destRect,
      }
      cursorY += h + gap
      return item
    })
    return {
      placements,
      totalW: targetW + pad * 2,
      totalH: cursorY - gap + pad,
      rawOverlapRemovedPx,
      seams: seamPlan?.seams,
    }
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
    rawOverlapRemovedPx: 0,
  }
}

function drawMergePlacement(ctx: CanvasRenderingContext2D, item: MergePlacement): void {
  const { sourceRect: sr, rotation } = item
  if (rotation === 0) {
    ctx.drawImage(item.img, sr.x, sr.y, sr.width, sr.height, item.x, item.y, item.w, item.h)
    return
  }
  const cx = item.x + item.w / 2
  const cy = item.y + item.h / 2
  const swapped = rotation === 90 || rotation === 270
  const dw = swapped ? item.h : item.w
  const dh = swapped ? item.w : item.h
  ctx.translate(cx, cy)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(item.img, sr.x, sr.y, sr.width, sr.height, -dw / 2, -dh / 2, dw, dh)
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
  const { placements, totalW, totalH, rawOverlapRemovedPx, seams } = computeMergeLayout(loaded, options)

  const clamped = clampDimensions(totalW, totalH)
  const scale = Math.min(clamped.width / Math.max(1, totalW), clamped.height / Math.max(1, totalH), 1)
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
    width: Math.max(1, Math.round(totalW * scale)),
    height: Math.max(1, Math.round(totalH * scale)),
    scaleFactor: scale,
    placements: scaledPlacements,
    overlapRemovedPx: rawOverlapRemovedPx > 0 ? Math.max(1, Math.round(rawOverlapRemovedPx * scale)) : 0,
    ...(seams ? { seams } : {}),
  }

  const ext = extensionForMime(options.format)
  const isPdf = options.format === 'application/pdf'
  const bg = (options.format === 'image/jpeg' || isPdf) && options.background === 'transparent'
    ? '#ffffff'
    : options.background

  if (isPdf && options.pdfMode === 'multipage') {
    const pages: MultiPagePdfPageInput[] = []
    let previewDataUrl = ''
    for (let i = 0; i < loaded.length; i += 1) {
      const { img, rotation } = loaded[i]
      const nw = img.naturalWidth || img.width
      const nh = img.naturalHeight || img.height
      const effW = rotation === 90 || rotation === 270 ? nh : nw
      const effH = rotation === 90 || rotation === 270 ? nw : nh
      const pageDims = clampDimensions(effW, effH)
      const { canvas: pageCanvas, ctx: pctx } = createCanvas2d(pageDims.width, pageDims.height)
      fillBackground(pctx, pageCanvas.width, pageCanvas.height, bg)
      pctx.save()
      drawMergePlacement(pctx, {
        index: i,
        img,
        x: 0,
        y: 0,
        w: pageCanvas.width,
        h: pageCanvas.height,
        fit: 'contain',
        rotation,
        sourceRect: { x: 0, y: 0, width: nw, height: nh },
        destRect: { x: 0, y: 0, width: pageCanvas.width, height: pageCanvas.height },
      })
      pctx.restore()
      const jpegOut = await finalizeCanvasOutput(pageCanvas, `page-${i + 1}.jpg`, 'image/jpeg', options.quality)
      if (!previewDataUrl) previewDataUrl = jpegOut.dataUrl
      pages.push({
        jpegBytes: new Uint8Array(await jpegOut.blob.arrayBuffer()),
        pixelWidth: pageCanvas.width,
        pixelHeight: pageCanvas.height,
      })
    }
    const pdfBlob = createMultiPagePdfFromJpegs(pages, {
      pageSize: options.pdfPageSize,
      orientation: options.pdfOrientation,
      margin: options.pdfMargin,
    })
    return {
      blob: pdfBlob,
      dataUrl: previewDataUrl,
      width: layout.width,
      height: layout.height,
      filename: `moklu-merge-${options.direction}.${ext}`,
      sizeBytes: pdfBlob.size,
      mimeType: 'application/pdf',
      scaleFactor: scale,
      layout,
    }
  }

  const { canvas, ctx } = createCanvas2d(layout.width, layout.height)
  fillBackground(ctx, canvas.width, canvas.height, bg)
  ctx.scale(scale, scale)

  for (const item of placements) {
    ctx.save()
    drawRoundedRectPath(ctx, item.x, item.y, item.w, item.h, radius)
    ctx.clip()
    drawMergePlacement(ctx, item)
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

  if (options.format === 'application/pdf') {
    const jpegOut = await finalizeCanvasOutput(canvas, `moklu-merge-${options.direction}.jpg`, 'image/jpeg', options.quality)
    const pdfBlob = createSinglePagePdfFromJpeg(new Uint8Array(await jpegOut.blob.arrayBuffer()), canvas.width, canvas.height)
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

    const panoClamped = clampDimensions(slideDims.w * count, slideDims.h)
    const finalSlideW = Math.max(1, Math.floor(panoClamped.width / count))
    const finalSlideH = panoClamped.height
    const { canvas: panoCanvas, ctx: panoCtx } = createCanvas2d(finalSlideW * count, finalSlideH)
    drawFittedImage(panoCtx, img, 0, 0, panoCanvas.width, panoCanvas.height, 'cover')

    for (let i = 0; i < count; i += 1) {
      const { canvas: sliceCanvas, ctx: sctx } = createCanvas2d(finalSlideW, finalSlideH)
      sctx.drawImage(panoCanvas, i * finalSlideW, 0, finalSlideW, finalSlideH, 0, 0, finalSlideW, finalSlideH)
      const out = await finalizeCanvasOutput(sliceCanvas, `${base}-slide-${String(i + 1).padStart(2, '0')}.${ext}`, options.format, options.quality)
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
        const { canvas: sliceCanvas, ctx: sctx } = createCanvas2d(cellW, cellH)
        sctx.drawImage(img, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH)
        const out = await finalizeCanvasOutput(sliceCanvas, `${base}-r${r + 1}-c${c + 1}.${ext}`, options.format, options.quality)
        slices.push({ ...out, index, row: r, col: c })
        index += 1
      }
    }
  }

  const zipBlob = await packZipFallback(slices.map((s) => ({ filename: s.filename, blob: s.blob })))
  return { slices, zipBlob }
}

function renderCompressedCanvas(img: HTMLImageElement, w: number, h: number, format: WorkspaceCompressOptions['format']): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas2d(w, h)
  if (format === 'image/jpeg' || (format === 'image/webp' && !canEncodeCanvasFormat('image/webp'))) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

async function compressFallback(
  images: WorkspaceImageInput[],
  options: WorkspaceCompressOptions,
): Promise<WorkspaceCompressItem[]> {
  const ext = extensionForMime(options.format)
  const targetBytes = options.targetBytes && options.targetBytes > 0 ? Math.floor(options.targetBytes) : undefined
  const isLossy = options.format === 'image/webp' || options.format === 'image/jpeg'
  const results: WorkspaceCompressItem[] = []
  for (const item of images) {
    const img = await loadHtmlImage(item.dataUrl)
    const origW = img.naturalWidth || img.width
    const origH = img.naturalHeight || img.height
    let w = origW
    let h = origH
    if (options.maxWidth && options.maxWidth > 0 && w > options.maxWidth) {
      h = Math.max(1, Math.round(h * (options.maxWidth / w)))
      w = options.maxWidth
    }
    if (options.maxHeight && options.maxHeight > 0 && h > options.maxHeight) {
      w = Math.max(1, Math.round(w * (options.maxHeight / h)))
      h = options.maxHeight
    }
    const baseDims = clampDimensions(w, h)
    const filename = `${stripExtension(item.name) || 'image'}-compressed.${ext}`
    let out: WorkspaceBlobOutput
    let targetBytesMet: boolean | undefined
    let autoDownscaled: boolean | undefined
    let appliedQuality: number | undefined

    if (targetBytes !== undefined && isLossy) {
      let curW = baseDims.width
      let curH = baseDims.height
      let scale = 1
      autoDownscaled = false
      const searchQuality = async (cw: number, ch: number) => {
        const canvas = renderCompressedCanvas(img, cw, ch, options.format)
        let lo = 0.05
        let hi = 0.98
        let bestUnder: { out: WorkspaceBlobOutput; q: number } | null = null
        let smallest: { out: WorkspaceBlobOutput; q: number } | null = null
        for (let i = 0; i < 7; i += 1) {
          const mid = (lo + hi) / 2
          const candidate = await finalizeCanvasOutput(canvas, filename, options.format, mid)
          if (!smallest || candidate.sizeBytes < smallest.out.sizeBytes) smallest = { out: candidate, q: mid }
          if (candidate.sizeBytes <= targetBytes) {
            bestUnder = { out: candidate, q: mid }
            lo = mid
          } else {
            hi = mid
          }
        }
        return bestUnder ? { ...bestUnder, met: true } : { ...(smallest as { out: WorkspaceBlobOutput; q: number }), met: false }
      }
      let attempt = await searchQuality(curW, curH)
      if (!attempt.met && !options.preserveOriginalDimensions && curW > 320) {
        for (let step = 0; step < 4 && !attempt.met; step += 1) {
          const ratio = attempt.out.sizeBytes > 0 ? Math.sqrt(targetBytes / attempt.out.sizeBytes) * 0.92 : 0.8
          scale *= Math.min(0.8, ratio)
          const nextW = Math.max(320, Math.round(baseDims.width * scale))
          if (nextW >= curW) break
          curW = nextW
          curH = Math.max(1, Math.round(baseDims.height * (nextW / baseDims.width)))
          autoDownscaled = true
          attempt = await searchQuality(curW, curH)
          if (curW <= 320) break
        }
      }
      out = attempt.out
      targetBytesMet = attempt.met
      appliedQuality = Math.round(attempt.q * 1000) / 1000
    } else {
      const canvas = renderCompressedCanvas(img, baseDims.width, baseDims.height, options.format)
      out = await finalizeCanvasOutput(canvas, filename, options.format, options.quality)
      appliedQuality = isLossy ? options.quality : undefined
      if (targetBytes !== undefined) {
        targetBytesMet = out.sizeBytes <= targetBytes
        autoDownscaled = false
      }
    }

    const savedRatio = item.sizeBytes > 0 ? (item.sizeBytes - out.sizeBytes) / item.sizeBytes : 0
    results.push({
      ...out,
      id: item.id,
      originalName: item.name,
      originalBytes: item.sizeBytes,
      outputBytes: out.sizeBytes,
      savedRatio,
      originalDataUrl: item.dataUrl,
      originalWidth: origW,
      originalHeight: origH,
      ...(targetBytesMet !== undefined ? { targetBytesMet } : {}),
      ...(autoDownscaled !== undefined ? { autoDownscaled } : {}),
      ...(appliedQuality !== undefined ? { appliedQuality } : {}),
      ...(item.exif !== undefined ? { exif: item.exif } : {}),
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
        : options.width && options.width > 0 ? options.width : sw
      const targetH = options.scale && options.scale > 0
        ? Math.max(1, Math.round(sh * options.scale))
        : options.height && options.height > 0 ? options.height : Math.max(1, Math.round((sh / sw) * targetW))
      const clamped = clampDimensions(targetW, targetH)
      const { canvas, ctx } = createCanvas2d(clamped.width, clamped.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      outputs.push(await finalizeCanvasOutput(canvas, `${stripExtension(item.name) || 'image'}-${canvas.width}x${canvas.height}.${ext}`, options.format, options.quality))
      continue
    }

    if (options.mode === 'crop') {
      const ratio = targetAspect ?? sw / sh
      const cropW = sw / sh > ratio ? Math.max(1, Math.round(sh * ratio)) : sw
      const cropH = sw / sh > ratio ? sh : Math.max(1, Math.round(sw / ratio))
      const clamped = clampDimensions(cropW, cropH)
      const { canvas, ctx } = createCanvas2d(clamped.width, clamped.height)
      ctx.drawImage(img, Math.round((sw - cropW) / 2), Math.round((sh - cropH) / 2), cropW, cropH, 0, 0, canvas.width, canvas.height)
      outputs.push(await finalizeCanvasOutput(canvas, `${stripExtension(item.name) || 'image'}-crop.${ext}`, options.format, options.quality))
      continue
    }

    const border = Math.max(0, options.borderPx)
    let outW = sw + border * 2
    let outH = sh + border * 2
    if (targetAspect) {
      if (outW / outH > targetAspect) outH = Math.round(outW / targetAspect)
      else outW = Math.round(outH * targetAspect)
    }
    const clamped = clampDimensions(outW, outH)
    const scale = Math.min(clamped.width / outW, clamped.height / outH, 1)
    const { canvas, ctx } = createCanvas2d(Math.max(1, Math.round(outW * scale)), Math.max(1, Math.round(outH * scale)))
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

    outputs.push(await finalizeCanvasOutput(canvas, `${stripExtension(item.name) || 'image'}-framed.${ext}`, options.format, options.quality))
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
  const { canvas, ctx } = createCanvas2d(width, height)
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
