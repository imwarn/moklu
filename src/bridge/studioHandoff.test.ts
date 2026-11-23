/**
 * [INPUT]: depends on vitest; depends on stageImagesIntoStudio from ./studioHandoff; depends on useEditorStore from @/store; depends on useAssetStore from @/store/assets; depends on BASE_CANVAS_FORMAT from @/utils/canvasFormats; depends on ImageLayer and PhoneLayer from @/types
 * [OUTPUT]: verifies mockup, canvas, and carousel handoffs, asset registration, non-destructive preservation of existing Studio slides, and empty-payload safety
 * [POS]: Unit test suite for src/bridge/studioHandoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { ImageLayer, PhoneLayer } from '@/types'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { BASE_CANVAS_FORMAT } from '@/utils/canvasFormats'
import { stageImagesIntoStudio } from './studioHandoff'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

describe('stageImagesIntoStudio', () => {
  beforeEach(() => {
    useAssetStore.getState().clearAssets()
    useEditorStore.getState().resetProject()
  })

  it('ignores empty payloads without mutating stores', () => {
    const beforeGroups = useEditorStore.getState().project.slideGroups
    stageImagesIntoStudio({ images: [] })
    expect(useEditorStore.getState().project.slideGroups).toEqual(beforeGroups)
    expect(useAssetStore.getState().listAssets()).toHaveLength(0)
  })

  it('stages mockup mode using makeQuickLayers, registers asset, and selects the mockup layer', () => {
    stageImagesIntoStudio({
      mode: 'mockup',
      mockupModel: 'iphone-16-pro',
      slideWidth: 1080,
      slideHeight: 1920,
      images: [
        { dataUrl: TINY_PNG, name: 'App Home.png', width: 1179, height: 2556 },
      ],
    })

    const state = useEditorStore.getState()
    const activeGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)
    expect(activeGroup).toBeDefined()
    expect(activeGroup!.numSlides).toBe(1)
    expect(activeGroup!.slideWidth).toBe(1080)
    expect(activeGroup!.slideHeight).toBe(1920)
    expect(activeGroup!.layers[0].type).toBe('background')
    expect(activeGroup!.layers[1].type).toBe('phone')

    const phone = activeGroup!.layers[1] as PhoneLayer
    expect(phone.model).toBe('iphone-16-pro')
    expect(phone.screenshotPath).toBeTruthy()
    expect(phone.screenshotDataUrl).toBeUndefined()
    expect(useAssetStore.getState().getAsset(phone.screenshotPath!)).toBe(TINY_PNG)
    expect(phone.localeContent?.en?.screenshotPath).toBe(phone.screenshotPath)
    expect(phone.localeContent?.en?.screenshotDataUrl).toBeUndefined()

    expect(state.activeCanvasFormat).toBe(BASE_CANVAS_FORMAT)
    expect(state.selection).toEqual({
      slideGroupId: activeGroup!.id,
      layerId: phone.id,
    })
  })

  it('supports non-QuickMockup PhoneModels such as ipad-13 cleanly', () => {
    stageImagesIntoStudio({
      mode: 'mockup',
      mockupModel: 'ipad-13',
      images: [{ dataUrl: TINY_PNG, name: 'tablet.png', width: 2048, height: 2732 }],
    })

    const state = useEditorStore.getState()
    const activeGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    const phone = activeGroup.layers[1] as PhoneLayer
    expect(phone.model).toBe('ipad-13')
    expect(phone.scale).toBeGreaterThan(0)
    expect(state.selection?.layerId).toBe(phone.id)
  })

  it('stages canvas mode with a BackgroundLayer and centered ImageLayer', () => {
    stageImagesIntoStudio({
      mode: 'canvas',
      slideWidth: 1200,
      slideHeight: 900,
      images: [{ dataUrl: TINY_PNG, name: 'merged-shot.png', width: 800, height: 400 }],
    })

    const state = useEditorStore.getState()
    const activeGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    expect(activeGroup.numSlides).toBe(1)
    expect(activeGroup.slideWidth).toBe(1200)
    expect(activeGroup.slideHeight).toBe(900)
    expect(activeGroup.layers).toHaveLength(2)
    expect(activeGroup.layers[0].type).toBe('background')

    const img = activeGroup.layers[1] as ImageLayer
    expect(img.type).toBe('image')
    expect(useAssetStore.getState().getAsset(img.src)).toBe(TINY_PNG)
    expect(img.localeContent?.en?.src).toBe(img.src)
    expect(img.x).toBeGreaterThanOrEqual(0)
    expect(img.y).toBeGreaterThanOrEqual(0)
    expect(img.x + img.width).toBeLessThanOrEqual(1200)
    expect(img.y + img.height).toBeLessThanOrEqual(900)
    expect(state.selection).toEqual({ slideGroupId: activeGroup.id, layerId: img.id })
  })

  it('stages carousel mode as a multi-slide panoramic SlideGroup with one centered image per slide', () => {
    stageImagesIntoStudio({
      mode: 'carousel',
      slideWidth: 1080,
      slideHeight: 1080,
      images: [
        { dataUrl: TINY_PNG, name: 'tile-1.png', width: 1080, height: 1080 },
        { dataUrl: TINY_PNG, name: 'tile-2.png', width: 1080, height: 1080 },
        { dataUrl: TINY_PNG, name: 'tile-3.png', width: 1080, height: 1080 },
      ],
    })

    const state = useEditorStore.getState()
    const activeGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    expect(activeGroup.numSlides).toBe(3)
    expect(activeGroup.slideNames).toEqual(['tile-1', 'tile-2', 'tile-3'])
    expect(activeGroup.layers).toHaveLength(4)

    const [first, second, third] = activeGroup.layers.slice(1) as ImageLayer[]
    expect(first.x).toBeLessThan(1080)
    expect(second.x).toBeGreaterThanOrEqual(1080)
    expect(second.x).toBeLessThan(2160)
    expect(third.x).toBeGreaterThanOrEqual(2160)
    expect(useAssetStore.getState().listAssets()).toHaveLength(3)
    expect(state.selection?.layerId).toBe(first.id)
  })

  it('appends a new SlideGroup instead of overwriting an already populated Studio slide', () => {
    stageImagesIntoStudio({
      mode: 'canvas',
      images: [{ dataUrl: TINY_PNG, name: 'first.png', width: 1000, height: 1000 }],
    })
    const firstGroupId = useEditorStore.getState().activeSlideGroupId

    stageImagesIntoStudio({
      mode: 'mockup',
      mockupModel: 'browser-chrome',
      images: [{ dataUrl: TINY_PNG, name: 'second.png', width: 1440, height: 900 }],
    })

    const state = useEditorStore.getState()
    expect(state.project.slideGroups).toHaveLength(2)
    expect(state.activeSlideGroupId).not.toBe(firstGroupId)
    expect(state.project.slideGroups[0].id).toBe(firstGroupId)
  })
})
