import { describe, it, expect, vi } from 'vitest'
import type Konva from 'konva'
import type { SlideGroup } from '@/types'
import { exportSlide, exportWholeGroup, exportAllSlides, exportGroupImages } from './export'

function fakePng(width: number, height: number): string {
  const header = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 0, 0, 0, 0, 0])
  const view = new DataView(header.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return 'data:image/png;base64,' + btoa(String.fromCharCode(...header))
}

function makeFakeStage() {
  return {
    x: () => 0, y: () => 0, scaleX: () => 1, scaleY: () => 1,
    toDataURL: vi.fn((opts: unknown) => {
      const { width, height } = opts as { width: number; height: number }
      return fakePng(width, height)
    }),
    find: vi.fn(() => []),
    draw: vi.fn(),
    batchDraw: vi.fn(),
  } as unknown as Konva.Stage
}

function makeGroup(partial?: Partial<SlideGroup>): SlideGroup {
  return {
    id: 'group',
    name: 'Group',
    slideWidth: 1000,
    slideHeight: 2000,
    numSlides: 2,
    slideNames: ['a', 'b'],
    layers: [],
    ...partial,
  }
}

describe('exportSlide', () => {
  it('exports a single slide using the pano gap offset', async () => {
    const stage = makeFakeStage()
    const result = await exportSlide(stage, 1, makeGroup(), 24)

    expect(result).toBeTypeOf('string')
    expect(stage.toDataURL).toHaveBeenCalledOnce()
    expect(stage.toDataURL).toHaveBeenCalledWith({
      x: 1024,
      y: 0,
      width: 1000,
      height: 2000,
      pixelRatio: 1,
      mimeType: 'image/png',
    })
  })
})

describe('selection-safe PNG export', () => {
  it('excludes editor-only overlays from regular PNG captures and restores visibility', async () => {
    const stage = makeFakeStage()
    let isVisible = true
    const selection = {
      visible: vi.fn((next?: boolean) => {
        if (next !== undefined) isVisible = next
        return isVisible
      }),
    }
    vi.mocked(stage.find).mockReturnValue([selection] as unknown as ReturnType<Konva.Stage['find']>)
    vi.mocked(stage.toDataURL).mockImplementation(() => {
      expect(selection.visible()).toBe(false)
      return fakePng(1000, 2000)
    })
    const result = await exportSlide(stage, 0, makeGroup())
    expect(result).toContain('data:image/png')
    expect(selection.visible()).toBe(true)
  })
  it('validates the single slide dimensions, not the full panorama', async () => {
    const stage = makeFakeStage()
    vi.mocked(stage.toDataURL).mockReturnValue(fakePng(1000, 2000))
    await expect(exportSlide(stage, 1, makeGroup(), 24)).resolves.toContain('data:image/png')
  })

  it('rejects corrupt PNG data while restoring overlays and stage transform', async () => {
    const stage = makeFakeStage()
    let visible = true
    const selection = {
      visible: vi.fn((next?: boolean) => {
        if (next !== undefined) visible = next
        return visible
      }),
    }
    vi.mocked(stage.find).mockReturnValue([selection] as unknown as ReturnType<Konva.Stage['find']>)
    vi.mocked(stage.toDataURL).mockReturnValue('data:image/png;base64,AAAA')
    await expect(exportSlide(stage, 0, makeGroup())).rejects.toThrow(/signature|IHDR/)
    expect(selection.visible()).toBe(true)
    expect(stage.batchDraw).toHaveBeenCalled()
  })

  it('rejects a non-PNG response rather than silently offering an invalid download', async () => {
    const stage = makeFakeStage()
    vi.mocked(stage.toDataURL).mockReturnValue('data:text/plain;base64,AAAA')
    await expect(exportSlide(stage, 0, makeGroup())).rejects.toThrow(/PNG/)
  })

  it('validates whole panorama width and rejects mismatches', async () => {
    const stage = makeFakeStage()
    vi.mocked(stage.toDataURL).mockReturnValue(fakePng(2024, 2000))
    await expect(exportWholeGroup(stage, makeGroup(), 24)).resolves.toContain('data:image/png')
    expect(stage.toDataURL).toHaveBeenCalledWith(expect.objectContaining({ width: 2024, height: 2000 }))
    vi.mocked(stage.toDataURL).mockReturnValue(fakePng(1000, 2000))
    await expect(exportWholeGroup(stage, makeGroup(), 24)).rejects.toThrow(/mismatch/)
  })

})

describe('exportAllSlides', () => {
  it('exports all slides with their configured names', async () => {
    const stage = makeFakeStage()
    const result = await exportAllSlides(stage, makeGroup())

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('a')
    expect(result[1].name).toBe('b')
    expect(stage.toDataURL).toHaveBeenCalledTimes(2)
  })

  it('falls back to slide names without dropping slides', async () => {
    const stage = makeFakeStage()
    const result = await exportAllSlides(stage, makeGroup({ slideNames: [] }))

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('slide-1')
    expect(result[1].name).toBe('slide-2')
  })

  it('reports each captured image when a callback is provided', async () => {
    const onImageCaptured = vi.fn()

    await exportAllSlides(makeFakeStage(), makeGroup(), 0, onImageCaptured)

    expect(onImageCaptured).toHaveBeenNthCalledWith(1, 1, 2)
    expect(onImageCaptured).toHaveBeenNthCalledWith(2, 2, 2)
  })

  it('does not report captures without a callback', async () => {
    await expect(exportAllSlides(makeFakeStage(), makeGroup())).resolves.toHaveLength(2)
  })

  it('returns no slides when cancelled before capture begins', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await exportAllSlides(makeFakeStage(), makeGroup(), 0, undefined, controller.signal)

    expect(result).toHaveLength(0)
  })
})

describe('exportGroupImages', () => {
  it('exports a whole pano group using the group name', async () => {
    const stage = makeFakeStage()
    const result = await exportGroupImages(stage, makeGroup({ name: 'Hero' }), 'whole', 24)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Hero')
  })

  it('falls back to pano for whole-group exports with a falsy group name', async () => {
    const stage = makeFakeStage()
    const result = await exportGroupImages(stage, makeGroup({ name: '' }), 'whole', 24)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('pano')
  })

  it('falls through to per-slide export in whole mode for single-slide groups', async () => {
    const stage = makeFakeStage()
    const result = await exportGroupImages(stage, makeGroup({ numSlides: 1, slideNames: ['a'] }), 'whole', 24)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('a')
  })

  it('exports per-slide in split mode and applies the pano gap', async () => {
    const stage = makeFakeStage()
    const result = await exportGroupImages(stage, makeGroup(), 'split', 24)

    expect(result).toHaveLength(2)
    expect(stage.toDataURL).toHaveBeenCalledTimes(2)
    expect(stage.toDataURL).toHaveBeenNthCalledWith(1, expect.objectContaining({ x: 0 }))
    expect(stage.toDataURL).toHaveBeenNthCalledWith(2, expect.objectContaining({ x: 1024 }))
  })

  it('reports one completed image for whole-pano exports', async () => {
    const onImageCaptured = vi.fn()

    await exportGroupImages(makeFakeStage(), makeGroup(), 'whole', 24, onImageCaptured)

    expect(onImageCaptured).toHaveBeenCalledOnce()
    expect(onImageCaptured).toHaveBeenCalledWith(1, 1)
  })
})
