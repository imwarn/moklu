/**
 * [INPUT]: depends on vitest, formatSuffixedFilename, parseBackgroundFill, and createToolsWorkspaceEngines from ./engineAdapter, and mocked @/tools canvas engines
 * [OUTPUT]: unit tests verifying free-aspect crop preservation, safe filename suffix/fallback formatting, linear-gradient parsing, and guaranteed LoadedImageItem disposal
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
})
