/**
 * [INPUT]: depends on vitest, jszip, ./compressEngine, ./transformEngine, ./idCardEngine, and ./testHelpers
 * [OUTPUT]: unit tests verifying batch compression savings, resize/crop/pad geometry, A4 ID-1 card scaling, watermarks, and ZIP output
 * [POS]: unit test suite for compressEngine.ts, transformEngine.ts, and idCardEngine.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { compressImages, computeCompressedDimensions } from './compressEngine'
import {
  A4_DIMENSIONS,
  ID1_CARD_DIMENSIONS,
  composeIdCardSheet,
  computeIdCardSheetLayout,
} from './idCardEngine'
import { createRecordingCanvasFactory, makeMockImageItem } from './testHelpers'
import {
  computeCropGeometry,
  computePadGeometry,
  computeResizeGeometry,
  transformImages,
} from './transformEngine'

describe('compressEngine', () => {
  it('downscales only when exceeding maxWidth/maxHeight and never upscales', () => {
    const down = computeCompressedDimensions({ width: 4000, height: 2000 }, 1600, 1200)
    expect(down.width).toBe(1600)
    expect(down.height).toBe(800)

    const small = computeCompressedDimensions({ width: 800, height: 600 }, 1920, 1080)
    expect(small.width).toBe(800)
    expect(small.height).toBe(600)
    expect(small.clamped).toBe(false)
  })

  it('batch compresses images, fills JPEG opaque background, computes savedRatio, and builds ZIP', async () => {
    const { createCanvas, canvases } = createRecordingCanvasFactory({
      blobSizeFor: (format) => (format === 'image/jpeg' ? 40_000 : 50_000),
    })

    const items = [
      makeMockImageItem({ id: '1', name: 'hero.png', width: 2000, height: 1000, originalBytes: 100_000 }),
      makeMockImageItem({ id: '2', name: 'detail.png', width: 1000, height: 1000, originalBytes: 100_000 }),
    ]

    const result = await compressImages(items, {
      format: 'image/jpeg',
      quality: 0.75,
      maxWidth: 1000,
      background: '#ffffff',
      includeZip: true,
      createCanvas,
    })

    expect(result.items).toHaveLength(2)
    expect(result.items[0].width).toBe(1000)
    expect(result.items[0].height).toBe(500)
    expect(result.items[0].filename).toBe('hero.jpg')
    expect(result.items[0].savedBytes).toBe(60_000)
    expect(result.items[0].savedRatio).toBeCloseTo(0.6, 5)
    expect(result.totalOriginalBytes).toBe(200_000)
    expect(result.totalOutputBytes).toBe(80_000)
    expect(result.totalSavedRatio).toBeCloseTo(0.6, 5)

    // JPEG opaque backdrop filled before drawing image
    expect(canvases[0].fillRects).toHaveLength(1)
    expect(canvases[0].fillRects[0].fillStyle).toBe('#ffffff')
    expect(canvases[0].encodedQuality).toBe(0.75)

    expect(result.zipBlob).toBeDefined()
    const archive = await JSZip.loadAsync(await result.zipBlob!.arrayBuffer())
    expect(Object.keys(archive.files)).toEqual(['hero.jpg', 'detail.jpg'])
  })
})

describe('transformEngine', () => {
  it('computes resize geometry for px, scale factor, and aspect lock', () => {
    const lockedW = computeResizeGeometry({ width: 1600, height: 800 }, { width: 800, lockAspect: true })
    expect(lockedW.outputWidth).toBe(800)
    expect(lockedW.outputHeight).toBe(400)

    const unlocked = computeResizeGeometry(
      { width: 1600, height: 800 },
      { width: 500, height: 500, lockAspect: false },
    )
    expect(unlocked.outputWidth).toBe(500)
    expect(unlocked.outputHeight).toBe(500)

    const scaled = computeResizeGeometry({ width: 1000, height: 500 }, { scale: 0.5 })
    expect(scaled.outputWidth).toBe(500)
    expect(scaled.outputHeight).toBe(250)
  })

  it('computes normalized crop rects and centered aspect presets', () => {
    const norm = computeCropGeometry(
      { width: 1000, height: 800 },
      { rect: { x: 0.1, y: 0.25, width: 0.5, height: 0.5 } },
    )
    expect(norm.sourceRect).toEqual({ x: 100, y: 200, width: 500, height: 400 })
    expect(norm.outputWidth).toBe(500)
    expect(norm.outputHeight).toBe(400)

    const preset = computeCropGeometry({ width: 1600, height: 900 }, { aspect: '1:1' })
    expect(preset.sourceRect).toEqual({ x: 350, y: 0, width: 900, height: 900 })
    expect(preset.outputWidth).toBe(900)
    expect(preset.outputHeight).toBe(900)
  })

  it('pads images into target aspect ratios without cropping, with rounded corners and shadow', async () => {
    const geom = computePadGeometry(
      { width: 1000, height: 500 },
      { aspect: '1:1', border: 50, borderRadius: 24, shadow: true },
    )
    // Minimum square containing 1000x500 + 50px border on each side -> 1100x1100
    expect(geom.outputWidth).toBe(1100)
    expect(geom.outputHeight).toBe(1100)
    expect(geom.sourceRect).toEqual({ x: 0, y: 0, width: 1000, height: 500 })
    expect(geom.destRect).toEqual({ x: 50, y: 300, width: 1000, height: 500 })

    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const item = makeMockImageItem({ id: 'card', name: 'shot.png', width: 1000, height: 500 })
    const batch = await transformImages([item], {
      mode: 'pad',
      pad: {
        aspect: '4:5',
        border: 40,
        borderRadius: 20,
        shadow: true,
        background: {
          type: 'linear',
          angle: 120,
          stops: [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#ec4899' },
          ],
        },
      },
      format: 'image/png',
      createCanvas,
    })

    expect(batch.items).toHaveLength(1)
    expect(canvases[0].gradients).toHaveLength(1)
    expect(canvases[0].shadowFills).toBe(1)
    expect(canvases[0].clipCount).toBe(1)
    expect(batch.zipBlob).toBeDefined()
  })
})

describe('idCardEngine', () => {
  it('enforces exact A4 and ISO/IEC 7810 ID-1 physical proportions at 300 DPI and 150 DPI', () => {
    expect(A4_DIMENSIONS[300]).toEqual({ width: 2480, height: 3508 })
    expect(A4_DIMENSIONS[150]).toEqual({ width: 1240, height: 1754 })
    expect(ID1_CARD_DIMENSIONS[300]).toEqual({ width: 1011, height: 638 })
    expect(ID1_CARD_DIMENSIONS[150]).toEqual({ width: 506, height: 319 })

    const layout300 = computeIdCardSheetLayout(
      [
        { width: 1600, height: 1000 },
        { width: 1600, height: 1000 },
      ],
      { dpi: 300, cardGap: 180 },
    )
    expect(layout300.pageWidth).toBe(2480)
    expect(layout300.pageHeight).toBe(3508)
    expect(layout300.slots).toHaveLength(2)

    const [front, back] = layout300.slots
    // Horizontally centered on A4
    expect(front.cardRect.x).toBe(Math.round((2480 - 1011) / 2))
    expect(back.cardRect.x).toBe(front.cardRect.x)
    // Exact 180px gap between front bottom and back top
    expect(back.cardRect.y - (front.cardRect.y + front.cardRect.height)).toBe(180)
    // Vertically centered stack on A4
    const topMargin = front.cardRect.y
    const bottomMargin = layout300.pageHeight - (back.cardRect.y + back.cardRect.height)
    expect(Math.abs(topMargin - bottomMargin)).toBeLessThanOrEqual(1)
  })

  it('rejects 0 or >2 images cleanly', () => {
    expect(() => computeIdCardSheetLayout([])).toThrow(/1 or 2/)
    expect(() =>
      computeIdCardSheetLayout([
        { width: 100, height: 60 },
        { width: 100, height: 60 },
        { width: 100, height: 60 },
      ]),
    ).toThrow(/1 or 2/)
  })

  it('renders photocopy grayscale filter and tiled anti-fraud watermark 100% locally', async () => {
    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const front = makeMockImageItem({ id: 'front', name: 'id-front.jpg', width: 1500, height: 950 })
    const back = makeMockImageItem({ id: 'back', name: 'id-back.jpg', width: 1500, height: 950 })

    const result = await composeIdCardSheet([front, back], {
      dpi: 300,
      grayscale: true,
      watermark: {
        text: '仅供办理银行开户使用 他用无效',
        opacity: 0.25,
        color: '#1e293b',
        fontSize: 38,
        angle: -30,
        mode: 'tiled',
      },
      createCanvas,
    })

    expect(result.width).toBe(2480)
    expect(result.height).toBe(3508)
    expect(result.dpi).toBe(300)
    expect(result.filename).toBe('id-card-a4-300dpi.png')
    expect(result.layout.watermarks.length).toBeGreaterThan(10)

    const canvas = canvases[0]
    expect(canvas.draws).toHaveLength(2)
    expect(canvas.draws[0].filter).toContain('grayscale(100%)')
    expect(canvas.strokeCount).toBe(2)
    expect(canvas.texts.length).toBe(result.layout.watermarks.length)
    expect(canvas.texts[0].text).toBe('仅供办理银行开户使用 他用无效')
    expect(canvas.texts[0].alpha).toBeCloseTo(0.25, 5)
    expect(canvas.texts[0].rotation).toBeCloseTo((-30 * Math.PI) / 180, 5)
  })

  it('supports across-card watermark mode clipped strictly to each card slot at 150 DPI', async () => {
    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const single = makeMockImageItem({ id: 'passport', width: 1000, height: 630 })

    const result = await composeIdCardSheet([single], {
      dpi: 150,
      watermark: {
        text: 'FOR VERIFICATION ONLY',
        mode: 'across-card',
        opacity: 0.3,
        angle: -25,
      },
      createCanvas,
    })

    expect(result.width).toBe(1240)
    expect(result.height).toBe(1754)
    expect(result.layout.slots).toHaveLength(1)
    expect(result.layout.watermarks).toHaveLength(3)
    expect(result.layout.watermarks.every((w) => w.slotIndex === 0)).toBe(true)
    // 1 card clip + 3 watermark slot clips = 4 clips total
    expect(canvases[0].clipCount).toBe(4)
    expect(canvases[0].texts).toHaveLength(3)
  })
})
