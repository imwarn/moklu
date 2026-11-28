/**
 * [INPUT]: depends on vitest, formatSuffixedFilename, parseBackgroundFill, and createToolsWorkspaceEngines from ./engineAdapter, and mocked @/tools canvas engines
 * [OUTPUT]: unit tests verifying free-aspect crop preservation, merge alignment/border/rotation/PDF preview forwarding, safe filename suffix/fallback formatting, linear-gradient parsing, and guaranteed LoadedImageItem disposal
 * [POS]: automated verification suite for src/workspace/engineAdapter
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockTools = vi.hoisted(() => ({
  loadImageItem: vi.fn(),
  disposeImageItems: vi.fn(),
  transformImages: vi.fn(),
  compressImages: vi.fn(),
  mergeImages: vi.fn(),
  splitImage: vi.fn(),
  composeIdCardSheet: vi.fn(),
  extractPortraitMatte: vi.fn(),
  renderIdPhoto: vi.fn(),
  composeIdPhotoTrioZip: vi.fn(),
  composeIdPhotoPrintSheet: vi.fn(),
  packBlobsToZip: vi.fn(),
}))

vi.mock('@/tools', async () => {
  const actual = await vi.importActual<typeof import('@/tools')>('@/tools')
  return {
    ...actual,
    loadImageItem: mockTools.loadImageItem,
    disposeImageItems: mockTools.disposeImageItems,
    transformImages: mockTools.transformImages,
    compressImages: mockTools.compressImages,
    mergeImages: mockTools.mergeImages,
    splitImage: mockTools.splitImage,
    composeIdCardSheet: mockTools.composeIdCardSheet,
    extractPortraitMatte: mockTools.extractPortraitMatte,
    renderIdPhoto: mockTools.renderIdPhoto,
    composeIdPhotoTrioZip: mockTools.composeIdPhotoTrioZip,
    composeIdPhotoPrintSheet: mockTools.composeIdPhotoPrintSheet,
    packBlobsToZip: mockTools.packBlobsToZip,
  }
})

import {
  createToolsWorkspaceEngines,
  formatSuffixedFilename,
  parseBackgroundFill,
} from './engineAdapter'
import type { WorkspaceImageInput } from './types'

class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  readAsDataURL(blob: Blob) {
    this.result = `data:${blob.type || 'application/octet-stream'};base64,bW9jaw==`
    this.onload?.()
  }
}

const SAMPLE_INPUT: WorkspaceImageInput = {
  id: 'img-1',
  name: 'hero.png',
  width: 1600,
  height: 900,
  dataUrl: 'data:image/png;base64,AAAA',
  sizeBytes: 1024,
  mimeType: 'image/png',
}

describe('engineAdapter helpers', () => {
  it('formats suffixed filenames cleanly and never produces leading-dash names for empty stems', () => {
    expect(formatSuffixedFilename('hero.png', 'compressed', 'image/webp')).toBe('hero-compressed.webp')
    expect(formatSuffixedFilename('', 'compressed', 'image/webp')).toBe('image-compressed.webp')
    expect(formatSuffixedFilename('...', 'crop', 'image/png')).toBe('image-crop.png')
    expect(formatSuffixedFilename('   ', '-resize', 'image/jpeg')).toBe('image-resize.jpg')
    expect(formatSuffixedFilename('my/shot:01?.png', 'pad', 'image/png')).toBe('my-shot-01-pad.png')
  })

  it('parses solid colors and CSS linear-gradient strings into BackgroundFill', () => {
    expect(parseBackgroundFill('#ffffff')).toBe('#ffffff')
    expect(parseBackgroundFill('transparent')).toBe('transparent')
    expect(parseBackgroundFill('linear-gradient(135deg, #b5b0f2, #e5efff)')).toEqual({
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#b5b0f2', offset: 0 },
        { color: '#e5efff', offset: 1 },
      ],
    })
  })
})

describe('createToolsWorkspaceEngines', () => {
  const originalFileReader = globalThis.FileReader

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader
    mockTools.loadImageItem.mockImplementation(async (_src: unknown, opts?: { name?: string }) => ({
      id: 'loaded-1',
      name: opts?.name ?? 'image.png',
      width: 1600,
      height: 900,
      source: {},
      sizeBytes: 1024,
      mimeType: 'image/png',
      dispose: vi.fn(),
    }))
  })

  afterEach(() => {
    globalThis.FileReader = originalFileReader
  })

  it('preserves free aspect ratio in crop mode instead of forcing 1:1', async () => {
    mockTools.transformImages.mockResolvedValue({
      items: [
        {
          id: 't1',
          blob: new Blob(['ok'], { type: 'image/png' }),
          width: 1600,
          height: 900,
          filename: 'hero.png',
          format: 'image/png',
        },
      ],
    })

    const engines = createToolsWorkspaceEngines()
    const outputs = await engines.transform([SAMPLE_INPUT], {
      mode: 'crop',
      lockAspect: true,
      aspectRatio: 'free',
      borderPx: 0,
      background: '#ffffff',
      borderRadius: 0,
      shadow: false,
      format: 'image/png',
      quality: 0.94,
    })

    expect(mockTools.transformImages).toHaveBeenCalledTimes(1)
    const passedOptions = mockTools.transformImages.mock.calls[0][1]
    expect(passedOptions.crop).toEqual({ aspect: undefined })
    expect(outputs[0].filename).toBe('hero-crop.png')
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(1)
  })

  it('forwards explicit aspect ratios in crop mode and uses safe fallback stems when name is empty', async () => {
    mockTools.transformImages.mockResolvedValue({
      items: [
        {
          id: 't2',
          blob: new Blob(['ok'], { type: 'image/png' }),
          width: 1600,
          height: 900,
          filename: 'fallback.png',
          format: 'image/png',
        },
      ],
    })

    const engines = createToolsWorkspaceEngines()
    const outputs = await engines.transform(
      [{ ...SAMPLE_INPUT, name: '' }],
      {
        mode: 'crop',
        lockAspect: true,
        aspectRatio: '16:9',
        borderPx: 0,
        background: '#ffffff',
        borderRadius: 0,
        shadow: false,
        format: 'image/png',
        quality: 0.94,
      },
    )

    expect(mockTools.transformImages.mock.calls[0][1].crop).toEqual({ aspect: '16:9' })
    expect(outputs[0].filename).toBe('image-crop.png')
  })

  it('uses safe fallback stem for compress output when input filename is empty and disposes items on error', async () => {
    mockTools.compressImages.mockResolvedValue({
      items: [
        {
          id: 'c1',
          originalName: '',
          originalBytes: 2000,
          outputBytes: 1000,
          blob: new Blob(['ok'], { type: 'image/webp' }),
          width: 800,
          height: 450,
          format: 'image/webp',
        },
      ],
    })

    const engines = createToolsWorkspaceEngines()
    const compressed = await engines.compress([{ ...SAMPLE_INPUT, name: '' }], {
      format: 'image/webp',
      quality: 0.8,
    })
    expect(compressed[0].filename).toBe('image-compressed.webp')
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(1)

    mockTools.compressImages.mockRejectedValueOnce(new Error('encode failed'))
    await expect(
      engines.compress([SAMPLE_INPUT], { format: 'image/webp', quality: 0.8 }),
    ).rejects.toThrow('encode failed')
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(2)
  })

  it('forwards merge align, border, itemRotations, scaleFactor, and uses JPEG previewBlob for PDF output', async () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const jpegPreview = new Blob(['jpeg-preview'], { type: 'image/jpeg' })
    mockTools.mergeImages.mockResolvedValue({
      blob: pdfBlob,
      previewBlob: jpegPreview,
      width: 2000,
      height: 1500,
      format: 'application/pdf',
      bytes: pdfBlob.size,
      filename: 'moklu-merged.pdf',
      layout: {
        width: 2000,
        height: 1500,
        scaleFactor: 0.5,
        overlapRemovedPx: 180,
        placements: [
          {
            index: 0,
            sourceRect: { x: 0, y: 0, width: 1600, height: 900 },
            destRect: { x: 10, y: 10, width: 450, height: 800 },
            radius: 4,
            rotation: 90,
            borderWidth: 2,
          },
        ],
      },
    })

    const engines = createToolsWorkspaceEngines()
    const out = await engines.merge(
      [
        { ...SAMPLE_INPUT, id: 'a', rotation: 90 },
        { ...SAMPLE_INPUT, id: 'b', rotation: 270 },
      ],
      {
        direction: 'vertical',
        normalize: 'original',
        align: 'end',
        columns: 4,
        aspectCell: '1:1',
        fit: 'contain',
        gap: 12,
        padding: 20,
        borderRadius: 8,
        borderWidth: 4,
        borderColor: '#111827',
        background: '#f8fafc',
        format: 'application/pdf',
        quality: 0.88,
        removeOverlap: true,
      },
    )

    expect(mockTools.mergeImages).toHaveBeenCalledTimes(1)
    const passed = mockTools.mergeImages.mock.calls[0][1]
    expect(passed.align).toBe('end')
    expect(passed.fit).toBe('contain')
    expect(passed.borderWidth).toBe(4)
    expect(passed.borderColor).toBe('#111827')
    expect(passed.itemRotations).toEqual([90, 270])
    expect(passed.format).toBe('application/pdf')
    expect(passed.removeOverlap).toBe(true)
    expect(passed.filename).toBe('moklu-merged.pdf')

    expect(out.mimeType).toBe('application/pdf')
    expect(out.blob).toBe(pdfBlob)
    expect(out.dataUrl).toContain('data:image/jpeg;base64,')
    expect(out.scaleFactor).toBe(0.5)
    expect(out.layout).toEqual({
      width: 2000,
      height: 1500,
      scaleFactor: 0.5,
      overlapRemovedPx: 180,
      placements: [
        {
          index: 0,
          sourceRect: { x: 0, y: 0, width: 1600, height: 900 },
          destRect: { x: 10, y: 10, width: 450, height: 800 },
          radius: 4,
          rotation: 90,
          borderWidth: 2,
        },
      ],
    })
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(1)
  })

  it('forwards seamOverlapOverrides and multipage PDF options to mergeImages and maps layout.seams', async () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const previewBlob = new Blob(['page-1'], { type: 'image/jpeg' })
    mockTools.mergeImages.mockResolvedValue({
      blob: pdfBlob,
      previewBlob,
      width: 1200,
      height: 1800,
      format: 'application/pdf',
      bytes: pdfBlob.size,
      filename: 'moklu-merged.pdf',
      layout: {
        width: 1200,
        height: 1800,
        scaleFactor: 1,
        overlapRemovedPx: 240,
        seams: [
          { index: 0, autoOverlapPx: 220, appliedOverlapPx: 240, fixedTopPx: 44, fixedBottomPx: 32 },
        ],
        placements: [],
      },
    })

    const engines = createToolsWorkspaceEngines()
    const out = await engines.merge([SAMPLE_INPUT, { ...SAMPLE_INPUT, id: 'img-2' }], {
      direction: 'vertical',
      normalize: 'match-min',
      columns: 2,
      aspectCell: '1:1',
      fit: 'cover',
      gap: 0,
      padding: 0,
      borderRadius: 0,
      background: '#ffffff',
      format: 'application/pdf',
      quality: 0.92,
      removeOverlap: true,
      seamOverlapOverrides: { 0: 240 },
      pdfMode: 'multipage',
      pdfPageSize: 'a4',
      pdfOrientation: 'landscape',
      pdfMargin: 'none',
    })

    const passed = mockTools.mergeImages.mock.calls[0][1]
    expect(passed.seamOverlapOverrides).toEqual({ 0: 240 })
    expect(passed.pdfMode).toBe('multipage')
    expect(passed.pdfPageSize).toBe('a4')
    expect(passed.pdfOrientation).toBe('landscape')
    expect(passed.pdfMargin).toBe('none')
    expect(out.layout?.seams).toEqual([
      { index: 0, autoOverlapPx: 220, appliedOverlapPx: 240, fixedTopPx: 44, fixedBottomPx: 32 },
    ])
  })

  it('forwards targetBytes and preserveOriginalDimensions to compressImages and maps original/target/EXIF metadata', async () => {
    const sampleExif = {
      hasExif: true,
      hasSensitiveData: true,
      tagCount: 5,
      make: 'Apple',
      model: 'iPhone 16 Pro',
      gps: { latitude: 37.7749, longitude: -122.4194 },
    }
    mockTools.compressImages.mockResolvedValue({
      items: [
        {
          id: 'c-target',
          originalName: 'photo.jpg',
          originalBytes: 4_200_000,
          outputBytes: 186_000,
          originalWidth: 4032,
          originalHeight: 3024,
          width: 1920,
          height: 1440,
          blob: new Blob(['compressed'], { type: 'image/webp' }),
          format: 'image/webp',
          targetBytesMet: true,
          autoDownscaled: true,
          appliedQuality: 0.72,
        },
      ],
    })

    const engines = createToolsWorkspaceEngines()
    const items = await engines.compress(
      [{ ...SAMPLE_INPUT, name: 'photo.jpg', sizeBytes: 4_200_000, exif: sampleExif }],
      {
        format: 'image/webp',
        quality: 0.82,
        targetBytes: 204_800,
        preserveOriginalDimensions: false,
      },
    )

    const passed = mockTools.compressImages.mock.calls[0][1]
    expect(passed.targetBytes).toBe(204_800)
    expect(passed.preserveOriginalDimensions).toBe(false)
    expect(items[0].originalDataUrl).toBe(SAMPLE_INPUT.dataUrl)
    expect(items[0].originalWidth).toBe(4032)
    expect(items[0].originalHeight).toBe(3024)
    expect(items[0].targetBytesMet).toBe(true)
    expect(items[0].autoDownscaled).toBe(true)
    expect(items[0].appliedQuality).toBe(0.72)
    expect(items[0].exif).toEqual(sampleExif)
  })

  it('syncs output filename extension and mimeType to image/jpeg when Safari falls back from image/webp', async () => {
    mockTools.compressImages.mockResolvedValue({
      items: [
        {
          id: 'c-safari',
          originalName: 'IMG_7220.HEIC',
          originalBytes: 2_150_000,
          outputBytes: 390_000,
          originalWidth: 2316,
          originalHeight: 3088,
          width: 2316,
          height: 3088,
          blob: new Blob(['jpeg-bytes'], { type: 'image/jpeg' }),
          format: 'image/jpeg',
          appliedQuality: 0.82,
        },
      ],
    })

    const engines = createToolsWorkspaceEngines()
    const items = await engines.compress(
      [{ ...SAMPLE_INPUT, name: 'IMG_7220.HEIC', sizeBytes: 2_150_000 }],
      { format: 'image/webp', quality: 0.82 },
    )

    expect(items[0].filename).toBe('IMG_7220-compressed.jpg')
    expect(items[0].mimeType).toBe('image/jpeg')
    expect(items[0].originalBytes).toBe(2_150_000)
  })

  it('adapts idPhotoMatte, idPhotoRender, idPhotoTrioZip, and idPhotoSheet with disposal and gradient parsing', async () => {
    const fakeMattePayload = {
      width: 720,
      height: 960,
      sourceRgba: new Uint8ClampedArray(4),
      guidedAlpha: new Float32Array(1),
      estimatedBgRgb: [244, 246, 250] as const,
      modeUsed: 'ai' as const,
      framing: { centerX: 0.5, centerY: 0.42, zoom: 1.05, headTopRatio: 0.1, headHeightRatio: 0.6 },
    }
    mockTools.extractPortraitMatte.mockResolvedValue(fakeMattePayload)
    mockTools.renderIdPhoto.mockResolvedValue({
      blob: new Blob(['id-jpg'], { type: 'image/jpeg' }),
      width: 295,
      height: 413,
      format: 'image/jpeg',
      filename: 'portrait-cn-1inch.jpg',
      outputBytes: 22_400,
      targetBytesMet: true,
      appliedQuality: 0.84,
      foregroundPngBlob: new Blob(['fg-png'], { type: 'image/png' }),
    })
    mockTools.composeIdPhotoTrioZip.mockResolvedValue({
      zipBlob: new Blob(['zip-bytes'], { type: 'application/zip' }),
      items: [
        {
          blob: new Blob(['white'], { type: 'image/jpeg' }),
          width: 295,
          height: 413,
          format: 'image/jpeg',
          filename: 'portrait-white.jpg',
          outputBytes: 21_000,
        },
      ],
    })
    mockTools.composeIdPhotoPrintSheet.mockResolvedValue({
      blob: new Blob(['sheet-png'], { type: 'image/png' }),
      width: 1800,
      height: 1200,
      count: 8,
      columns: 4,
      rows: 2,
      format: 'image/png',
      filename: 'portrait-sheet-4r-6inch.png',
    })

    const engines = createToolsWorkspaceEngines()
    const onProgress = vi.fn()
    const handle = await engines.idPhotoMatte(SAMPLE_INPUT, { mode: 'ai', onProgress })
    expect(handle.width).toBe(720)
    expect(handle.framing.centerY).toBe(0.42)
    expect(mockTools.extractPortraitMatte).toHaveBeenCalledTimes(1)
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(1)

    const rendered = await engines.idPhotoRender(handle, {
      widthPx: 295,
      heightPx: 413,
      background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)',
      targetSizeKb: 30,
      includeForegroundPng: true,
    })
    expect(mockTools.renderIdPhoto.mock.calls[0][0].background).toEqual({
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#dbeafe', offset: 0 },
        { color: '#eff6ff', offset: 1 },
      ],
    })
    expect(rendered.targetBytesMet).toBe(true)
    expect(rendered.appliedQuality).toBe(0.84)
    expect(rendered.foregroundDataUrl).toContain('data:image/png;base64,')

    const trio = await engines.idPhotoTrioZip(handle, { widthPx: 295, heightPx: 413 })
    expect(trio.zipBlob.type).toBe('application/zip')
    expect(trio.items).toHaveLength(1)

    const sheet = await engines.idPhotoSheet({
      photoDataUrl: rendered.dataUrl,
      photoWidthPx: 295,
      photoHeightPx: 413,
      paper: '4r-6inch',
      cropMarks: true,
      format: 'image/png',
    })
    expect(sheet.count).toBe(8)
    expect(sheet.columns).toBe(4)
    expect(sheet.rows).toBe(2)
    expect(mockTools.disposeImageItems).toHaveBeenCalledTimes(2)
  })
})
