/**
 * [INPUT]: depends on vitest, jszip, ./idPhotoSpecs, ./portraitMatting, ./idPhotoEngine, and ./testHelpers
 * [OUTPUT]: verifies ID photo presets, O(N) Guided Filter, border-connected studio backdrop matting, white-to-red anti-halo decontamination, portrait framing/cropping, exact-dimension exam target-KB binary search, trio ZIP, and 300 DPI 4R/A4 PNG & PDF 1.4 print sheets
 * [POS]: unit test suite for the ID photo & portrait matting engine in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import JSZip from 'jszip'
import { afterEach, describe, expect, it } from 'vitest'
import {
  composeIdPhotoPrintSheet,
  composeIdPhotoTrioZip,
  computeIdPhotoCropSourceRect,
  computeIdPhotoSheetLayout,
  detectPortraitFramingFromAlpha,
  renderIdPhoto,
} from './idPhotoEngine'
import {
  ID_PHOTO_BACKGROUNDS,
  ID_PHOTO_SPECS,
  findIdPhotoSpec,
  getOrderedIdPhotoSpecs,
  mmToPixels,
} from './idPhotoSpecs'
import {
  computePureBackdropAlpha,
  decontaminatePixelRgb,
  estimateOuterBackgroundRgb,
  extractPortraitMatte,
  guidedFilterAlpha,
  resetPortraitMattingCache,
  setPortraitMattingOverride,
} from './portraitMatting'
import { createRecordingCanvasFactory, makeMockImageItem } from './testHelpers'
import type { PortraitMatteData } from './types'

afterEach(() => {
  resetPortraitMattingCache()
})

function buildSyntheticStudioPortrait(width: number, height: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4)

  // Fill pure white studio backdrop (#FFFFFF)
  for (let i = 0; i < width * height; i += 4 / 4) {
    const idx = i * 4
    rgba[idx] = 255
    rgba[idx + 1] = 255
    rgba[idx + 2] = 255
    rgba[idx + 3] = 255
  }

  const cx = width * 0.5
  const headCy = height * 0.34
  const headRx = width * 0.16
  const headRy = height * 0.17

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4

      // Dark shoulders touching bottom edge (middle 60%)
      const inShoulders = y >= height * 0.62 && Math.abs(x - cx) <= width * 0.32
      // Head ellipse (skin tone)
      const dx = (x - cx) / headRx
      const dy = (y - headCy) / headRy
      const inHead = dx * dx + dy * dy <= 1

      if (inShoulders) {
        rgba[idx] = 35
        rgba[idx + 1] = 42
        rgba[idx + 2] = 56
      }
      if (inHead) {
        rgba[idx] = 215
        rgba[idx + 1] = 168
        rgba[idx + 2] = 142
      }

      // Interior white shirt collar surrounded by dark blazer (must stay opaque!)
      const inCollar =
        y >= Math.round(height * 0.72) &&
        y <= Math.round(height * 0.84) &&
        Math.abs(x - cx) <= Math.round(width * 0.06)
      if (inCollar) {
        rgba[idx] = 255
        rgba[idx + 1] = 255
        rgba[idx + 2] = 255
      }

      // Interior white sclera inside face (must stay opaque!)
      const inLeftEye =
        Math.abs(y - Math.round(headCy - height * 0.02)) <= 2 &&
        Math.abs(x - Math.round(cx - width * 0.05)) <= 3
      if (inLeftEye) {
        rgba[idx] = 254
        rgba[idx + 1] = 254
        rgba[idx + 2] = 254
      }
    }
  }

  return rgba
}

describe('idPhotoSpecs', () => {
  it('converts millimeters to 300 DPI pixels accurately', () => {
    expect(mmToPixels(25, 300)).toBe(295)
    expect(mmToPixels(35, 300)).toBe(413)
    expect(mmToPixels(49, 300)).toBe(579)
    expect(mmToPixels(30, 300)).toBe(354)
    expect(mmToPixels(40, 300)).toBe(472)
  })

  it('exposes all 13 canonical presets and orders them by locale', () => {
    const expectedIds = [
      'cn-1inch',
      'cn-2inch',
      'cn-small-1inch',
      'cn-exam',
      'cn-passport',
      'us-passport',
      'schengen-visa',
      'uk-passport',
      'jp-rirekisho',
      'jp-mynumber',
      'kr-passport',
      'kr-resume',
      'resume-headshot',
    ]

    expect(ID_PHOTO_SPECS.length).toBe(expectedIds.length)
    for (const id of expectedIds) {
      expect(findIdPhotoSpec(id)?.id).toBe(id)
    }
    expect(findIdPhotoSpec('cn-exam')?.recommendedMaxKb).toBe(30)
    expect(findIdPhotoSpec('us-passport')?.widthPx).toBe(600)
    expect(findIdPhotoSpec('us-passport')?.heightPx).toBe(600)

    expect(getOrderedIdPhotoSpecs('zh')[0].id).toBe('cn-1inch')
    expect(getOrderedIdPhotoSpecs('en')[0].id).toBe('us-passport')
    expect(getOrderedIdPhotoSpecs('ja')[0].id).toBe('jp-rirekisho')
    expect(getOrderedIdPhotoSpecs('ko')[0].id).toBe('kr-passport')
    expect(ID_PHOTO_BACKGROUNDS.length).toBeGreaterThanOrEqual(6)
  })
})

describe('portraitMatting', () => {
  it('guidedFilterAlpha snaps blurred boundary alpha cleanly to sharp luminance edges in O(N) time', () => {
    const w = 128
    const h = 128
    const guide = new Uint8ClampedArray(w * h * 4)
    const noisyAlpha = new Float32Array(w * h)

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const idx = (y * w + x) * 4
        const isHair = x >= 64
        guide[idx] = isHair ? 30 : 250
        guide[idx + 1] = isHair ? 28 : 250
        guide[idx + 2] = isHair ? 26 : 250
        guide[idx + 3] = 255

        // Soft blurry raw alpha spanning 10px around x=64
        const t = Math.max(0, Math.min(1, (x - 59) / 10))
        noisyAlpha[y * w + x] = t
      }
    }

    const startMs = performance.now()
    const refined = guidedFilterAlpha(guide, noisyAlpha, w, h, 4, 1e-3)
    const elapsedMs = performance.now() - startMs

    expect(elapsedMs).toBeLessThan(150)
    // Sharp edge snapping directly across the luminance jump at x=63 (backdrop) -> x=64 (hair)
    expect(refined[64 * w + 63]).toBeLessThan(noisyAlpha[64 * w + 63] - 0.15)
    expect(refined[64 * w + 64]).toBeGreaterThan(noisyAlpha[64 * w + 64] + 0.15)
    expect(refined[64 * w + 64] - refined[64 * w + 63]).toBeGreaterThan(0.4)
    // Pure regions stay clean
    expect(refined[64 * w + 10]).toBeLessThan(0.01)
    expect(refined[64 * w + 110]).toBeGreaterThan(0.99)
  })

  it('computePureBackdropAlpha removes outer white backdrop while preserving interior white eyes and collar', () => {
    const w = 120
    const h = 160
    const rgba = buildSyntheticStudioPortrait(w, h)

    const bgRgb = estimateOuterBackgroundRgb(rgba, w, h)
    expect(bgRgb[0]).toBeGreaterThanOrEqual(250)
    expect(bgRgb[1]).toBeGreaterThanOrEqual(250)
    expect(bgRgb[2]).toBeGreaterThanOrEqual(250)

    const alpha = computePureBackdropAlpha(rgba, w, h)

    // Top-left corner backdrop must be transparent
    expect(alpha[4 * w + 4]).toBeLessThan(0.05)
    // Top-right corner backdrop must be transparent
    expect(alpha[4 * w + (w - 5)]).toBeLessThan(0.05)
    // Interior white shirt collar surrounded by dark shoulders must stay opaque
    const collarY = Math.round(h * 0.78)
    const collarX = Math.round(w * 0.5)
    expect(alpha[collarY * w + collarX]).toBeGreaterThan(0.92)
    // Interior white sclera inside skin face must stay opaque
    const eyeY = Math.round(h * 0.34 - h * 0.02)
    const eyeX = Math.round(w * 0.5 - w * 0.05)
    expect(alpha[eyeY * w + eyeX]).toBeGreaterThan(0.92)
  })

  it('decontaminates white halo fringe so dark hair composited onto red (#D92B2B) has zero bright white border', async () => {
    const w = 40
    const h = 40
    const sourceRgba = new Uint8ClampedArray(w * h * 4)
    const guidedAlpha = new Float32Array(w * h)

    // Left half: white backdrop [255,255,255] (alpha 0)
    // Column x=20: 50% hair fringe blended with white backdrop: 0.5*[36,30,28] + 0.5*[255,255,255] = [146,143,142]
    // Right half: dark hair [36,30,28] (alpha 1)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = y * w + x
        const idx = i * 4
        if (x < 20) {
          sourceRgba[idx] = 255
          sourceRgba[idx + 1] = 255
          sourceRgba[idx + 2] = 255
          guidedAlpha[i] = 0
        } else if (x === 20) {
          sourceRgba[idx] = 146
          sourceRgba[idx + 1] = 143
          sourceRgba[idx + 2] = 142
          guidedAlpha[i] = 0.5
        } else {
          sourceRgba[idx] = 36
          sourceRgba[idx + 1] = 30
          sourceRgba[idx + 2] = 28
          guidedAlpha[i] = 1
        }
        sourceRgba[idx + 3] = 255
      }
    }

    const [dr, dg, db] = decontaminatePixelRgb(146, 143, 142, 0.5, [255, 255, 255], 0.9)
    expect(dr).toBeLessThan(60)
    expect(dg).toBeLessThan(55)
    expect(db).toBeLessThan(55)

    const matte: PortraitMatteData = {
      width: w,
      height: h,
      sourceRgba,
      guidedAlpha,
      estimatedBgRgb: [255, 255, 255],
      modeUsed: 'ai',
      framing: { centerX: 0.5, centerY: 0.5, zoom: 1, headTopRatio: 0.1, headHeightRatio: 0.6 },
    }

    const decontamFactory = createRecordingCanvasFactory({ pixelBacked: true })
    await renderIdPhoto({
      matte,
      widthPx: w,
      heightPx: h,
      background: '#D92B2B',
      crop: { centerX: 0.5, centerY: 0.5, zoom: 1 },
      decontaminate: 0.92,
      createCanvas: decontamFactory.createCanvas,
    })

    const rawFactory = createRecordingCanvasFactory({ pixelBacked: true })
    await renderIdPhoto({
      matte,
      widthPx: w,
      heightPx: h,
      background: '#D92B2B',
      crop: { centerX: 0.5, centerY: 0.5, zoom: 1 },
      decontaminate: 0,
      createCanvas: rawFactory.createCanvas,
    })

    const edgeIdx = (20 * w + 20) * 4
    const cleanPixels = decontamFactory.canvases[0].pixels!
    const haloPixels = rawFactory.canvases[0].pixels!

    // Without decontamination, green/blue channels spike into a visible pink-white halo (~93)
    expect(haloPixels[edgeIdx + 1]).toBeGreaterThan(85)
    expect(haloPixels[edgeIdx + 2]).toBeGreaterThan(85)
    // With decontamination, green/blue channels stay dark & clean right on the red backdrop (<52)
    expect(cleanPixels[edgeIdx + 1]).toBeLessThan(52)
    expect(cleanPixels[edgeIdx + 2]).toBeLessThan(52)
  })
})

describe('idPhotoEngine', () => {
  it('detects portrait framing from alpha and clamps aspect-locked crop rects', () => {
    const w = 200
    const h = 250
    const alpha = new Float32Array(w * h)

    // Head ellipse centered at (110, 88) with width ~60px, height ~76px, plus wider shoulders below y=145
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = (x - 110) / 30
        const dy = (y - 88) / 38
        const inHead = dx * dx + dy * dy <= 1
        const inNeck = y >= 124 && y < 145 && Math.abs(x - 110) <= 14
        const inShoulders = y >= 145 && Math.abs(x - 110) <= 68
        if (inHead || inNeck || inShoulders) {
          alpha[y * w + x] = 1
        }
      }
    }

    const framing = detectPortraitFramingFromAlpha(alpha, w, h)
    expect(framing.centerX).toBeGreaterThan(0.5)
    expect(framing.centerX).toBeLessThan(0.6)
    expect(framing.headTopRatio).toBeCloseTo(50 / 250, 1)
    expect(framing.zoom).toBeGreaterThan(1.2)

    // Uniform fallback
    const fallback = detectPortraitFramingFromAlpha(new Float32Array(w * h).fill(1), w, h)
    expect(fallback.centerX).toBe(0.5)
    expect(fallback.zoom).toBe(1)

    // Aspect-locked clamped crop rect
    const crop = computeIdPhotoCropSourceRect(800, 1000, 295, 413, {
      centerX: 0.99,
      centerY: 0.01,
      zoom: 1.5,
    })
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(800.01)
    expect(crop.y + crop.height).toBeLessThanOrEqual(1000.01)
    expect(crop.width / crop.height).toBeCloseTo(295 / 413, 4)
  })

  it('extracts matte with override, hits targetSizeKb without changing pixel dimensions, and exports trio ZIP', async () => {
    const stages: string[] = []
    setPortraitMattingOverride(async (_rgba, width, height) => {
      const out = new Float32Array(width * height)
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          out[y * width + x] = x > width * 0.25 && x < width * 0.75 && y > height * 0.15 ? 1 : 0
        }
      }
      return out
    })

    const factory = createRecordingCanvasFactory({
      blobSizeFor: (format, quality) => {
        if (format === 'image/jpeg') {
          return Math.round(8_000 + (quality ?? 0.92) * 52_000)
        }
        return 90_000
      },
    })

    const mockImage = makeMockImageItem({ width: 120, height: 160, name: 'portrait.jpg' })
    const matte = await extractPortraitMatte(mockImage, {
      mode: 'ai',
      createCanvas: factory.createCanvas,
      onProgress: (stage) => stages.push(stage),
    })

    expect(matte.modeUsed).toBe('ai')
    expect(matte.width).toBe(120)
    expect(matte.height).toBe(160)
    expect(stages).toContain('inferring')
    expect(stages).toContain('refining')

    const rendered = await renderIdPhoto({
      matte,
      widthPx: 295,
      heightPx: 413,
      background: '#438EDB',
      targetSizeKb: 30,
      includeForegroundPng: true,
      filenameStem: 'exam-photo',
      createCanvas: factory.createCanvas,
    })

    expect(rendered.width).toBe(295)
    expect(rendered.height).toBe(413)
    expect(rendered.format).toBe('image/jpeg')
    expect(rendered.filename).toBe('exam-photo.jpg')
    expect(rendered.targetBytesMet).toBe(true)
    expect(rendered.outputBytes).toBeLessThanOrEqual(30 * 1024)
    expect(rendered.appliedQuality).toBeDefined()
    expect(rendered.foregroundPngBlob?.type).toBe('image/png')

    const trio = await composeIdPhotoTrioZip({
      matte,
      widthPx: 295,
      heightPx: 413,
      filenameStem: 'cn-1inch',
      createCanvas: factory.createCanvas,
    })

    expect(trio.items).toHaveLength(3)
    expect(trio.items.map((item) => item.filename)).toEqual([
      'cn-1inch-white.jpg',
      'cn-1inch-blue.jpg',
      'cn-1inch-red.jpg',
    ])

    const zip = await JSZip.loadAsync(await trio.zipBlob.arrayBuffer())
    expect(Object.keys(zip.files).sort()).toEqual([
      'cn-1inch-blue.jpg',
      'cn-1inch-red.jpg',
      'cn-1inch-white.jpg',
    ])
  })

  it('computes 6-inch (4R) and A4 300 DPI print sheets and exports PNG and PDF 1.4', async () => {
    const layout4r = computeIdPhotoSheetLayout(295, 413, '4r-6inch')
    expect(layout4r.paperWidthPx).toBe(1800)
    expect(layout4r.paperHeightPx).toBe(1200)
    expect(layout4r.count).toBeGreaterThanOrEqual(8)
    expect(layout4r.slots).toHaveLength(layout4r.count)

    const layoutA4 = computeIdPhotoSheetLayout(295, 413, 'a4')
    expect(layoutA4.paperWidthPx).toBe(2480)
    expect(layoutA4.paperHeightPx).toBe(3508)
    expect(layoutA4.count).toBe(49)

    const factory = createRecordingCanvasFactory()
    const photoDrawable = { width: 295, height: 413, label: 'id-photo' }

    const pngSheet = await composeIdPhotoPrintSheet({
      photoDrawable,
      photoWidthPx: 295,
      photoHeightPx: 413,
      paper: '4r-6inch',
      cropMarks: true,
      format: 'image/png',
      filenameStem: 'sheet-4r',
      createCanvas: factory.createCanvas,
    })

    expect(pngSheet.format).toBe('image/png')
    expect(pngSheet.filename).toBe('sheet-4r.png')
    expect(pngSheet.count).toBe(layout4r.count)
    expect(factory.canvases[0].draws).toHaveLength(layout4r.count)
    expect(factory.canvases[0].strokeCount).toBe(layout4r.count)

    const pdfSheet = await composeIdPhotoPrintSheet({
      photoDrawable,
      photoWidthPx: 295,
      photoHeightPx: 413,
      paper: 'a4',
      cropMarks: true,
      format: 'application/pdf',
      filenameStem: 'sheet-a4',
      createCanvas: factory.createCanvas,
    })

    expect(pdfSheet.format).toBe('application/pdf')
    expect(pdfSheet.filename).toBe('sheet-a4.pdf')
    expect(pdfSheet.width).toBe(2480)
    expect(pdfSheet.height).toBe(3508)
    expect(pdfSheet.count).toBe(49)

    const pdfText = new TextDecoder().decode(new Uint8Array(await pdfSheet.blob.arrayBuffer()))
    expect(pdfText.startsWith('%PDF-1.4\n')).toBe(true)
    expect(pdfText.trimEnd().endsWith('%%EOF')).toBe(true)
  })
})
