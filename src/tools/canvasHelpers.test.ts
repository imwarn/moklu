/**
 * [INPUT]: depends on vitest, jszip, ./canvasHelpers, and ./testHelpers
 * [OUTPUT]: unit tests covering canvas clamping, object-fit math, background fills, offline image loader disposal, and ZIP archiving
 * [POS]: unit test suite for src/tools/canvasHelpers.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
  canvasToBlob,
  clampCanvasDimensions,
  computeObjectFitRects,
  dataUrlToBlob,
  disposeImageItems,
  fillBackground,
  formatBytes,
  loadImageItem,
  loadImageItems,
  packBlobsToZip,
  replaceFileExtension,
} from './canvasHelpers'
import { createRecordingCanvasFactory } from './testHelpers'

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('canvasHelpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('clamps dimensions exceeding 8192px or 64MP uniformly', () => {
    const wide = clampCanvasDimensions(16384, 4096)
    expect(wide.width).toBe(MAX_CANVAS_DIMENSION)
    expect(wide.height).toBe(2048)
    expect(wide.clamped).toBe(true)
    expect(wide.scaleFactor).toBeCloseTo(0.5, 5)

    const hugeSquare = clampCanvasDimensions(8192, 8192)
    expect(hugeSquare.width * hugeSquare.height).toBeLessThanOrEqual(MAX_CANVAS_PIXELS)
    expect(hugeSquare.width).toBe(8000)
    expect(hugeSquare.height).toBe(8000)
    expect(hugeSquare.clamped).toBe(true)

    const normal = clampCanvasDimensions(1920, 1080)
    expect(normal).toEqual({ width: 1920, height: 1080, scaleFactor: 1, clamped: false })
  })

  it('computes cover and contain object-fit rectangles accurately', () => {
    const box = { x: 10, y: 20, width: 200, height: 200 }
    const cover = computeObjectFitRects(400, 200, box, 'cover')
    expect(cover.sourceRect).toEqual({ x: 100, y: 0, width: 200, height: 200 })
    expect(cover.destRect).toEqual(box)

    const contain = computeObjectFitRects(400, 200, box, 'contain')
    expect(contain.sourceRect).toEqual({ x: 0, y: 0, width: 400, height: 200 })
    expect(contain.destRect).toEqual({ x: 10, y: 70, width: 200, height: 100 })
  })

  it('formats byte sizes and replaces output extensions cleanly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(25 * 1024)).toBe('25.0 KB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB')

    expect(replaceFileExtension('Vacation Photo.PNG', 'image/webp')).toBe('Vacation-Photo.webp')
    expect(replaceFileExtension('screenshot.png', 'image/jpeg')).toBe('screenshot.jpg')
    expect(replaceFileExtension('.../', 'image/png', 'fallback')).toBe('fallback.png')
  })

  it('fills solid and linear-gradient backgrounds without touching transparent when optional', () => {
    const { createCanvas, canvases } = createRecordingCanvasFactory()
    const canvas = createCanvas(400, 200)
    const ctx = canvas.getContext('2d')!

    fillBackground(ctx, 400, 200, 'transparent')
    expect(canvases[0].fillRects).toHaveLength(0)

    fillBackground(ctx, 400, 200, 'transparent', '#ffffff')
    expect(canvases[0].fillRects).toHaveLength(1)
    expect(canvases[0].fillRects[0].fillStyle).toBe('#ffffff')

    fillBackground(ctx, 400, 200, {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 1, color: '#0f172a' },
        { offset: 0, color: '#38bdf8' },
      ],
    })
    expect(canvases[0].gradients).toHaveLength(1)
    expect(canvases[0].gradients[0].stops).toEqual([
      { offset: 0, color: '#38bdf8' },
      { offset: 1, color: '#0f172a' },
    ])
  })

  it('converts data URLs and canvas fallback toDataURL cleanly without fetch()', async () => {
    const decoded = dataUrlToBlob(TINY_PNG_DATA_URL)
    expect(decoded.type).toBe('image/png')
    expect(decoded.size).toBeGreaterThan(20)

    const blob = await canvasToBlob(
      {
        width: 1,
        height: 1,
        getContext: () => null,
        toDataURL: () => TINY_PNG_DATA_URL,
      },
      'image/png',
    )
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(decoded.size)
  })

  it('packs Blobs and Uint8Arrays into a valid JSZip archive with deduplicated safe filenames', async () => {
    const zipBlob = await packBlobsToZip([
      { filename: '../secret/slide.png', blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) },
      { filename: 'secret/slide.png', blob: new Uint8Array([4, 5, 6, 7]) },
      { filename: 'ok.webp', blob: new Blob([new Uint8Array([8, 9])], { type: 'image/webp' }) },
    ])

    const archive = await JSZip.loadAsync(await zipBlob.arrayBuffer())
    const names = Object.keys(archive.files).filter((k) => !archive.files[k].dir)
    expect(names).toEqual(['secret/slide.png', 'secret/slide-2.png', 'ok.webp'])

    const firstBytes = await archive.files['secret/slide.png'].async('uint8array')
    const secondBytes = await archive.files['secret/slide-2.png'].async('uint8array')
    expect(Array.from(firstBytes)).toEqual([1, 2, 3])
    expect(Array.from(secondBytes)).toEqual([4, 5, 6, 7])
  })

  it('loads Blob inputs with object URL cleanup on dispose and error, and blocks remote URLs', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-1')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    let shouldFail = false
    class MockImage {
      decoding = ''
      naturalWidth = 640
      naturalHeight = 480
      width = 640
      height = 480
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => {
          if (shouldFail) {
            this.onerror?.()
          } else {
            this.onload?.()
          }
        })
      }
    }
    vi.stubGlobal('Image', MockImage)

    await expect(loadImageItem('https://example.com/leak.png')).rejects.toThrow(/offline/i)

    const blob = new Blob([new Uint8Array(128)], { type: 'image/jpeg' })
    const item = await loadImageItem(blob, { name: 'front.jpg' })
    expect(item.width).toBe(640)
    expect(item.height).toBe(480)
    expect(item.originalBytes).toBe(128)
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    // Calling dispose twice revokes object URL exactly once.
    disposeImageItems([item])
    item.dispose()
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')

    // On decode error, object URL is revoked automatically.
    shouldFail = true
    await expect(loadImageItems([blob])).rejects.toThrow(/Failed to decode/)
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })
})
