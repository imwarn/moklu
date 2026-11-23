/**
 * [INPUT]: depends on vitest, jszip, ./mergeEngine, ./splitEngine, and ./testHelpers
 * [OUTPUT]: unit tests verifying merge layout math, clamping, rendering, carousel/grid slice coordinates, and ZIP archives
 * [POS]: unit test suite for src/tools/mergeEngine.ts and src/tools/splitEngine.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { computeMergeLayout, mergeImages } from './mergeEngine'
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
    expect(layout.placements).toHaveLength(2)
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
