/**
 * [INPUT]: depends on vitest, jszip, ./mergeEngine, ./pdfHelper, ./splitEngine, and ./testHelpers
 * [OUTPUT]: unit tests verifying merge layout math, cross-axis alignment, rotation, borders, PDF 1.4 export, clamping, rendering, carousel/grid slice coordinates, and ZIP archives
 * [POS]: unit test suite for src/tools/mergeEngine.ts, src/tools/pdfHelper.ts, and src/tools/splitEngine.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { computeMergeLayout, mergeImages } from './mergeEngine'
import { buildSinglePagePdfBytes, createSinglePagePdfFromJpeg } from './pdfHelper'
import {
  CAROUSEL_PRESET_SIZES,
  computeCarouselSlices,
  computeGridSlices,
  splitImage,
} from './splitEngine'
import { createRecordingCanvasFactory, makeMockImageItem } from './testHelpers'

describe('mergeEngine', () => {
  it('computes horizontal layouts across match-min, match-max, and original modes', () => {
    const items = [
      { width: 400, height: 200 },
      { width: 600, height: 600 },
    ]

    const minLayout = computeMergeLayout(items, {
      mode: 'horizontal',
      normalize: 'match-min',
      gap: 20,
      padding: 10,
    })
    // Both normalized to height 200 -> widths 400 and 200
    expect(minLayout.width).toBe(10 * 2 + 400 + 20 + 200)
    expect(minLayout.height).toBe(10 * 2 + 200)
    expect(minLayout.placements[1].destRect).toEqual({ x: 430, y: 10, width: 200, height: 200 })

    const maxLayout = computeMergeLayout(items, {
      mode: 'horizontal',
      normalize: 'match-max',
      gap: 0,
      padding: 0,
    })
    // Both normalized to height 600 -> widths 1200 and 600
    expect(maxLayout.width).toBe(1800)
    expect(maxLayout.height).toBe(600)

    const origLayout = computeMergeLayout(items, {
      mode: 'horizontal',
      normalize: 'original',
      gap: 10,
      padding: 20,
    })
    expect(origLayout.width).toBe(20 * 2 + 400 + 10 + 600)
    expect(origLayout.height).toBe(20 * 2 + 600)
    // First image vertically centered inside 600px inner height
    expect(origLayout.placements[0].destRect.y).toBe(20 + 200)
  })

  it('computes vertical stitch layout and enforces 8192px/64MP safe clamping', () => {
    const tallItems = [
      { width: 1000, height: 5000 },
      { width: 2000, height: 10000 },
    ]
    const layout = computeMergeLayout(tallItems, {
      mode: 'vertical',
      normalize: 'match-min',
      gap: 100,
      padding: 50,
    })
    // Raw width = 1100, raw height = 50*2 + 5000 + 100 + 5000 = 10200 -> clamped to height 8192
    expect(layout.height).toBeLessThanOrEqual(8192)
    expect(layout.scaleFactor).toBeCloseTo(8192 / 10200, 4)
    expect(layout.overlapRemovedPx).toBe(0)
    expect(layout.placements).toHaveLength(2)
  })

  it('applies vertical overlap trims to sourceRect, destRect, total height, and overlapRemovedPx', async () => {
    const items = [
      { width: 400, height: 800 },
      { width: 400, height: 800 },
    ]

    const trimmed = computeMergeLayout(
      items,
      { mode: 'vertical', gap: 0, padding: 0, removeOverlap: true },
      [
        { trimTop: 0, trimBottom: 40 },
        { trimTop: 160, trimBottom: 0 },
      ],
    )
    expect(trimmed.width).toBe(400)
    expect(trimmed.height).toBe(1400)
    expect(trimmed.overlapRemovedPx).toBe(200)
    expect(trimmed.placements[0].sourceRect).toEqual({ x: 0, y: 0, width: 400, height: 760 })
    expect(trimmed.placements[0].destRect).toEqual({ x: 0, y: 0, width: 400, height: 760 })
    expect(trimmed.placements[1].sourceRect).toEqual({ x: 0, y: 160, width: 400, height: 640 })
    expect(trimmed.placements[1].destRect).toEqual({ x: 0, y: 760, width: 400, height: 640 })

    // Horizontal/grid modes ignore removeOverlap and keep overlapRemovedPx = 0
    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const horizontalResult = await mergeImages(
      [
        makeMockImageItem({ id: 'h1', width: 400, height: 300 }),
        makeMockImageItem({ id: 'h2', width: 400, height: 300 }),
      ],
      { mode: 'horizontal', gap: 0, padding: 0, removeOverlap: true, createCanvas },
    )
    expect(horizontalResult.layout.overlapRemovedPx).toBe(0)
    expect(canvases).toHaveLength(1)
  })

  it('computes grid collage with 2..6 columns, aspectCell, fit, rounded corners, and gradient bg', async () => {
    const items = [
      makeMockImageItem({ id: 'a', width: 800, height: 400 }),
      makeMockImageItem({ id: 'b', width: 400, height: 800 }),
      makeMockImageItem({ id: 'c', width: 600, height: 600 }),
      makeMockImageItem({ id: 'd', width: 800, height: 600 }),
    ]

    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const result = await mergeImages(items, {
      mode: 'grid',
      columns: 2,
      aspectCell: '1:1',
      fit: 'cover',
      gap: 20,
      padding: 30,
      borderRadius: 16,
      background: {
        type: 'linear',
        angle: 135,
        stops: [
          { offset: 0, color: '#f8fafc' },
          { offset: 1, color: '#e2e8f0' },
        ],
      },
      format: 'image/webp',
      quality: 0.9,
      createCanvas,
    })

    // Cell is 800x800; 2x2 grid + 20 gap + 30*2 padding = 1680x1680
    expect(result.width).toBe(1680)
    expect(result.height).toBe(1680)
    expect(result.format).toBe('image/webp')
    expect(result.filename).toBe('merged-grid.webp')

    expect(canvases).toHaveLength(1)
    expect(canvases[0].gradients).toHaveLength(1)
    expect(canvases[0].clipCount).toBe(4)
    expect(canvases[0].draws).toHaveLength(4)
    // First item (800x400) cover-cropped to 1:1 center square -> sx=200, sw=400
    expect(canvases[0].draws[0].sx).toBe(200)
    expect(canvases[0].draws[0].sw).toBe(400)
  })

  it('supports start, center, and end cross-axis alignment in original horizontal and vertical modes', () => {
    const items = [
      { width: 300, height: 200 },
      { width: 600, height: 500 },
    ]

    const hStart = computeMergeLayout(items, { mode: 'horizontal', normalize: 'original', align: 'start', gap: 10, padding: 20 })
    const hCenter = computeMergeLayout(items, { mode: 'horizontal', normalize: 'original', align: 'center', gap: 10, padding: 20 })
    const hEnd = computeMergeLayout(items, { mode: 'horizontal', normalize: 'original', align: 'end', gap: 10, padding: 20 })
    expect(hStart.placements[0].destRect.y).toBe(20)
    expect(hCenter.placements[0].destRect.y).toBe(20 + 150)
    expect(hEnd.placements[0].destRect.y).toBe(20 + 300)

    const vStart = computeMergeLayout(items, { mode: 'vertical', normalize: 'original', align: 'start', gap: 10, padding: 15 })
    const vCenter = computeMergeLayout(items, { mode: 'vertical', normalize: 'original', align: 'center', gap: 10, padding: 15 })
    const vEnd = computeMergeLayout(items, { mode: 'vertical', normalize: 'original', align: 'end', gap: 10, padding: 15 })
    expect(vStart.placements[0].destRect.x).toBe(15)
    expect(vCenter.placements[0].destRect.x).toBe(15 + 150)
    expect(vEnd.placements[0].destRect.x).toBe(15 + 300)
  })

  it('supports grid up to 6 columns and contain fit without cropping', () => {
    const items = Array.from({ length: 6 }, () => ({ width: 800, height: 400 }))
    const layout = computeMergeLayout(items, {
      mode: 'grid',
      columns: 6,
      aspectCell: '1:1',
      fit: 'contain',
      gap: 10,
      padding: 20,
    })

    // 6 cols of 800x800 + 5*10 gap + 2*20 padding = 4890 x 840
    expect(layout.width).toBe(4890)
    expect(layout.height).toBe(840)
    // Contain preserves full 800x400 source rect and letterboxes vertically inside 800x800 cell
    expect(layout.placements[0].sourceRect).toEqual({ x: 0, y: 0, width: 800, height: 400 })
    expect(layout.placements[0].destRect).toEqual({ x: 20, y: 20 + 200, width: 800, height: 400 })
  })

  it('applies per-item 90/180/270deg rotation to layout dimensions, grid source crop mapping, and canvas transforms', async () => {
    const items = [
      makeMockImageItem({ id: 'r0', width: 800, height: 400 }),
      makeMockImageItem({ id: 'r1', width: 800, height: 400 }),
    ]

    // Horizontal original: item 0 rotated 90deg becomes 400x800; item 1 stays 800x400
    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const result = await mergeImages(items, {
      mode: 'horizontal',
      normalize: 'original',
      align: 'center',
      gap: 20,
      padding: 10,
      itemRotations: [90, 270],
      borderWidth: 8,
      borderColor: '#ff5500',
      createCanvas,
    })

    // Both rotated 90/270 -> each effective 400x800; total = 10*2 + 400 + 20 + 400 = 840 x 820
    expect(result.width).toBe(840)
    expect(result.height).toBe(820)
    expect(result.layout.placements[0].rotation).toBe(90)
    expect(result.layout.placements[1].rotation).toBe(270)

    expect(canvases[0].draws).toHaveLength(2)
    expect(canvases[0].draws[0].rotation).toBeCloseTo(Math.PI / 2, 5)
    expect(canvases[0].draws[0].dw).toBe(800)
    expect(canvases[0].draws[0].dh).toBe(400)
    expect(canvases[0].draws[1].rotation).toBeCloseTo((3 * Math.PI) / 2, 5)

    // Per-image borders stroked with exact color and lineWidth
    expect(canvases[0].strokeCount).toBe(2)
    expect(canvases[0].strokes[0]).toEqual({ strokeStyle: '#ff5500', lineWidth: 8 })

    // Grid cover with 90deg rotation maps center square crop back into unrotated source coords
    const gridLayout = computeMergeLayout(
      [{ width: 800, height: 400, rotation: 90 }],
      { mode: 'grid', columns: 2, aspectCell: '1:1', fit: 'cover', gap: 0, padding: 0 },
    )
    // Rotated 90deg effW=400, effH=800 -> center 400x400 crop is ry=200..600 -> unrotated ux=200, uy=0, uw=400, uh=400
    expect(gridLayout.placements[0].sourceRect).toEqual({ x: 200, y: 0, width: 400, height: 400 })
  })

  it('exports a valid zero-dependency single-page PDF 1.4 with accurate xref offsets and JPEG previewBlob', async () => {
    const items = [
      makeMockImageItem({ id: 'p1', width: 600, height: 400 }),
      makeMockImageItem({ id: 'p2', width: 600, height: 400 }),
    ]
    const { createCanvas, canvases } = createRecordingCanvasFactory()

    const result = await mergeImages(items, {
      mode: 'vertical',
      gap: 0,
      padding: 0,
      background: 'transparent',
      format: 'application/pdf',
      quality: 0.85,
      filename: 'receipts',
      createCanvas,
    })

    expect(result.format).toBe('application/pdf')
    expect(result.filename).toBe('receipts.pdf')
    expect(result.blob.type).toBe('application/pdf')
    expect(result.previewBlob).toBeDefined()
    expect(result.previewBlob?.type).toBe('image/jpeg')
    // PDF forces opaque white fallback when background is transparent
    expect(canvases[0].fillRects[0]?.fillStyle).toBe('#ffffff')
    expect(canvases[0].encodedFormat).toBe('image/jpeg')
    expect(canvases[0].encodedQuality).toBe(0.85)

    const pdfBytes = new Uint8Array(await result.blob.arrayBuffer())
    const pdfText = new TextDecoder('latin1').decode(pdfBytes)
    expect(pdfText.startsWith('%PDF-1.4\n')).toBe(true)
    expect(pdfText).toContain('/MediaBox [0 0 600 800]')
    expect(pdfText).toContain('/Filter /DCTDecode')
    expect(pdfText).toContain('/Width 600 /Height 800')
    expect(pdfText.trimEnd().endsWith('%%EOF')).toBe(true)

    // Verify startxref points directly to "xref" and each object offset points to "<n> 0 obj"
    const startXrefMatch = /startxref\n(\d+)\n%%EOF/.exec(pdfText)
    expect(startXrefMatch).not.toBeNull()
    const xrefPos = Number(startXrefMatch![1])
    expect(pdfText.slice(xrefPos, xrefPos + 4)).toBe('xref')

    const entryMatches = [...pdfText.slice(xrefPos).matchAll(/^(\d{10}) 00000 n $/gm)]
    expect(entryMatches).toHaveLength(5)
    entryMatches.forEach((match, idx) => {
      const objOffset = Number(match[1])
      expect(pdfText.slice(objOffset, objOffset + 7)).toBe(`${idx + 1} 0 obj`)
    })
  })

  it('rejects empty JPEG bytes in pdfHelper and respects DPI point conversion', () => {
    expect(() => buildSinglePagePdfBytes(new Uint8Array(0), 100, 100)).toThrow()
    const blob = createSinglePagePdfFromJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 2480, 3508, { dpi: 300 })
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(200)
  })
})

describe('splitEngine', () => {
  it('computes seamless adjacent carousel slices for 4:5, 3:4, 1:1, and auto presets', () => {
    const slices45 = computeCarouselSlices({ width: 4000, height: 1500 }, 3, '4:5')
    expect(slices45).toHaveLength(3)
    expect(slices45[0].outputWidth).toBe(CAROUSEL_PRESET_SIZES['4:5'].width)
    expect(slices45[0].outputHeight).toBe(CAROUSEL_PRESET_SIZES['4:5'].height)

    // Seamless check: slice i right edge equals slice i+1 left edge exactly
    for (let i = 0; i < slices45.length - 1; i += 1) {
      expect(slices45[i].sourceRect.x + slices45[i].sourceRect.width).toBeCloseTo(
        slices45[i + 1].sourceRect.x,
        6,
      )
      expect(slices45[i].sourceRect.y).toBe(slices45[i + 1].sourceRect.y)
      expect(slices45[i].sourceRect.height).toBe(slices45[i + 1].sourceRect.height)
    }

    const slicesAuto = computeCarouselSlices({ width: 1001, height: 500 }, 3, 'auto')
    const sumW = slicesAuto.reduce((acc, s) => acc + s.sourceRect.width, 0)
    expect(sumW).toBe(1001)
  })

  it('computes 3x3 grid slices covering 100% of source pixels and packs ordered ZIP archive', async () => {
    const slices = computeGridSlices({ width: 1000, height: 1000 }, 3, 3)
    expect(slices).toHaveLength(9)
    expect(slices[0].row).toBe(0)
    expect(slices[0].col).toBe(0)
    expect(slices[8].row).toBe(2)
    expect(slices[8].col).toBe(2)
    // Last column right edge reaches exact width 1000; last row bottom reaches 1000
    expect(slices[2].sourceRect.x + slices[2].sourceRect.width).toBe(1000)
    expect(slices[8].sourceRect.y + slices[8].sourceRect.height).toBe(1000)

    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const item = makeMockImageItem({ id: 'pano', name: 'sunset.png', width: 900, height: 900 })
    const result = await splitImage(item, {
      mode: 'grid',
      rows: 3,
      cols: 3,
      format: 'image/png',
      includeZip: true,
      createCanvas,
    })

    expect(result.slices).toHaveLength(9)
    expect(canvases).toHaveLength(9)
    expect(result.zipBlob).toBeDefined()

    const archive = await JSZip.loadAsync(await result.zipBlob!.arrayBuffer())
    const entries = Object.keys(archive.files).filter((k) => !archive.files[k].dir)
    expect(entries).toHaveLength(9)
    expect(entries[0]).toBe('sunset-01-r1c1.png')
    expect(entries[8]).toBe('sunset-09-r3c3.png')
  })

  it('splits carousel into 4 slides of 3:4 (1080x1440) with ZIP packaging', async () => {
    const { createCanvas } = createRecordingCanvasFactory()
    const item = makeMockImageItem({ id: 'wide', name: 'panorama.jpg', width: 4320, height: 1440 })
    const result = await splitImage(item, {
      mode: 'carousel',
      count: 4,
      carouselAspect: '3:4',
      format: 'image/jpeg',
      quality: 0.9,
      createCanvas,
    })

    expect(result.slices).toHaveLength(4)
    expect(result.slices.map((s) => s.filename)).toEqual([
      'panorama-slide-01.jpg',
      'panorama-slide-02.jpg',
      'panorama-slide-03.jpg',
      'panorama-slide-04.jpg',
    ])
    expect(result.slices[0].width).toBe(1080)
    expect(result.slices[0].height).toBe(1440)
    expect(result.zipBlob).toBeDefined()
  })
})
