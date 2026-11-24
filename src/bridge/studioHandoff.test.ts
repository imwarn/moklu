/**
 * [INPUT]: depends on vitest; depends on stageImagesIntoStudio from ./studioHandoff; depends on useEditorStore from @/store; depends on useAssetStore from @/store/assets; depends on BASE_CANVAS_FORMAT from @/utils/canvasFormats; depends on QUICK_THEMES from @/utils/quickDesign; depends on BackgroundLayer, ImageLayer, and PhoneLayer from @/types
 * [OUTPUT]: verifies mockup, canvas, carousel, and multi-layer collage handoffs (including >4096px uniform scaling, rotation, cornerRadius, solid/gradient/transparent backgrounds), user style/fit/scale/chrome preservation, asset registration, non-destructive preservation of existing Studio slides, and empty-payload safety
 * [POS]: Unit test suite for src/bridge/studioHandoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { BackgroundLayer, ImageLayer, PhoneLayer } from '@/types'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { BASE_CANVAS_FORMAT } from '@/utils/canvasFormats'
import { QUICK_THEMES } from '@/utils/quickDesign'
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

  it('preserves user mockup theme, screenshotFit, scaleFactor, and browserChrome on Studio handoff', () => {
    stageImagesIntoStudio({
      mode: 'mockup',
      mockupModel: 'browser-chrome',
      slideWidth: 1600,
      slideHeight: 900,
      images: [{ dataUrl: TINY_PNG, name: 'baseline.png', width: 1440, height: 900 }],
    })
    const baselineGroup = useEditorStore.getState().project.slideGroups[0]
    const baselinePhone = baselineGroup.layers[1] as PhoneLayer

    useEditorStore.getState().resetProject()

    stageImagesIntoStudio({
      mode: 'mockup',
      mockupModel: 'browser-chrome',
      slideWidth: 1600,
      slideHeight: 900,
      theme: 'midnight',
      screenshotFit: 'contain',
      scaleFactor: 0.8,
      browserChrome: {
        title: 'Moklu Dashboard',
        address: 'https://moklu.app/demo',
        theme: 'dark',
        showAddressBar: true,
      },
      images: [{ dataUrl: TINY_PNG, name: 'styled.png', width: 1440, height: 900 }],
    })

    const state = useEditorStore.getState()
    const styledGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    const bg = styledGroup.layers[0] as BackgroundLayer
    const phone = styledGroup.layers[1] as PhoneLayer

    expect(bg.fill).toEqual({
      type: 'linear',
      angle: 135,
      stops: [
        { offset: 0, color: QUICK_THEMES.midnight.top },
        { offset: 1, color: QUICK_THEMES.midnight.bottom },
      ],
    })
    expect(phone.screenshotFit).toBe('contain')
    expect(phone.scale).toBeCloseTo(baselinePhone.scale * 0.8, 5)
    expect(phone.browserChrome).toEqual({
      title: 'Moklu Dashboard',
      address: 'https://moklu.app/demo',
      theme: 'dark',
      showAddressBar: true,
    })
  })

  it('stages layers mode with matched BackgroundLayer and N independently editable ImageLayers without duplicating assets', () => {
    const secondPng = 'data:image/png;base64,BBBB'
    stageImagesIntoStudio({
      mode: 'layers',
      slideWidth: 1600,
      slideHeight: 900,
      background: 'linear-gradient(135deg, #b5b0f2, #e5efff)',
      images: [
        { dataUrl: TINY_PNG, name: 'panel-1.png', width: 760, height: 852 },
        { dataUrl: secondPng, name: 'panel-2.png', width: 760, height: 852 },
      ],
      layers: [
        {
          dataUrl: TINY_PNG,
          name: 'panel-1.png',
          x: 24,
          y: 24,
          width: 760,
          height: 852,
          rotation: 0,
          cornerRadius: 16,
        },
        {
          dataUrl: secondPng,
          name: 'panel-2.png',
          x: 816,
          y: 24,
          width: 760,
          height: 852,
          rotation: 90,
          cornerRadius: 16,
        },
      ],
    })

    const state = useEditorStore.getState()
    const activeGroup = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    expect(activeGroup.numSlides).toBe(1)
    expect(activeGroup.slideWidth).toBe(1600)
    expect(activeGroup.slideHeight).toBe(900)
    expect(activeGroup.layers).toHaveLength(3)

    const bg = activeGroup.layers[0] as BackgroundLayer
    expect(bg.fill).toEqual({
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#b5b0f2', offset: 0 },
        { color: '#e5efff', offset: 1 },
      ],
    })

    const [layer1, layer2] = activeGroup.layers.slice(1) as ImageLayer[]
    expect(layer1).toMatchObject({
      type: 'image',
      name: 'panel-1.png',
      x: 24,
      y: 24,
      width: 760,
      height: 852,
      rotation: 0,
      cornerRadius: 16,
    })
    expect(layer2).toMatchObject({
      type: 'image',
      name: 'panel-2.png',
      x: 816,
      y: 24,
      width: 760,
      height: 852,
      rotation: 90,
      cornerRadius: 16,
    })
    expect(useAssetStore.getState().listAssets()).toHaveLength(2)
    expect(useAssetStore.getState().getAsset(layer1.src)).toBe(TINY_PNG)
    expect(useAssetStore.getState().getAsset(layer2.src)).toBe(secondPng)
    expect(layer1.localeContent?.en?.src).toBe(layer1.src)
    expect(state.selection).toEqual({ slideGroupId: activeGroup.id, layerId: layer1.id })
  })

  it('uniformly downscales canvas and all layer coordinates, dimensions, and cornerRadius when layers exceed MAX_SLIDE_DIM (4096)', () => {
    stageImagesIntoStudio({
      mode: 'layers',
      slideWidth: 2000,
      slideHeight: 8192,
      background: '#0f172a',
      images: [],
      layers: [
        {
          dataUrl: TINY_PNG,
          name: 'top.png',
          x: 40,
          y: 40,
          width: 1920,
          height: 4000,
          rotation: 0,
          cornerRadius: 24,
        },
        {
          dataUrl: TINY_PNG,
          name: 'bottom.png',
          x: 40,
          y: 4100,
          width: 1920,
          height: 4052,
          rotation: 180,
          cornerRadius: 24,
        },
      ],
    })

    const state = useEditorStore.getState()
    const group = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    expect(group.slideWidth).toBe(1000)
    expect(group.slideHeight).toBe(4096)

    const bg = group.layers[0] as BackgroundLayer
    expect(bg.fill).toBe('#0f172a')

    const [top, bottom] = group.layers.slice(1) as ImageLayer[]
    expect(top.x).toBe(20)
    expect(top.y).toBe(20)
    expect(top.width).toBe(960)
    expect(top.height).toBe(2000)
    expect(top.cornerRadius).toBe(12)

    expect(bottom.x).toBe(20)
    expect(bottom.y).toBe(2050)
    expect(bottom.width).toBe(960)
    expect(bottom.height).toBe(2026)
    expect(bottom.rotation).toBe(180)
    expect(bottom.cornerRadius).toBe(12)
  })

  it('handles transparent background and narrow tall (>4096px) centering cleanly in layers mode', () => {
    stageImagesIntoStudio({
      mode: 'layers',
      slideWidth: 300,
      slideHeight: 8192,
      background: 'transparent',
      images: [],
      layers: [
        {
          dataUrl: TINY_PNG,
          name: 'strip.png',
          x: 0,
          y: 0,
          width: 300,
          height: 8192,
          cornerRadius: 10,
        },
      ],
    })

    const state = useEditorStore.getState()
    const group = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    const bg = group.layers[0] as BackgroundLayer
    const img = group.layers[1] as ImageLayer

    expect(bg.opacity).toBe(0)
    // 300 * 0.5 = 150 < MIN_SLIDE_DIM (240) -> clamped to 240 with (240 - 150) / 2 = 45 horizontal offset
    expect(group.slideWidth).toBe(240)
    expect(group.slideHeight).toBe(4096)
    expect(img.x).toBe(45)
    expect(img.y).toBe(0)
    expect(img.width).toBe(150)
    expect(img.height).toBe(4096)
    expect(img.cornerRadius).toBe(5)
  })

  it('falls back to canvas mode when mode is layers but layers array is empty', () => {
    stageImagesIntoStudio({
      mode: 'layers',
      layers: [],
      slideWidth: 800,
      slideHeight: 600,
      images: [{ dataUrl: TINY_PNG, name: 'fallback.png', width: 800, height: 600 }],
    })

    const state = useEditorStore.getState()
    const group = state.project.slideGroups.find((g) => g.id === state.activeSlideGroupId)!
    expect(group.layers).toHaveLength(2)
    expect(group.layers[1].type).toBe('image')
  })
})
