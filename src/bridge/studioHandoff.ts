/**
 * [INPUT]: depends on nanoid from nanoid; depends on BackgroundLayer, ImageLayer, Layer, PhoneLayer, PhoneModel, and SlideGroup from @/types; depends on getPhoneSpec from @/assets/mockups/specs; depends on useEditorStore from @/store; depends on useAssetStore from @/store/assets; depends on ensureProjectsBootstrapped from @/store/projects; depends on createBackgroundLayer, newId, newSlideGroup, and seedLocaleContent from @/store/helpers; depends on BASE_CANVAS_FORMAT from @/utils/canvasFormats; depends on QUICK_MOCKUPS, QUICK_SIZES, QuickMockup, QuickSize, and makeQuickLayers from @/utils/quickDesign
 * [OUTPUT]: exports StudioHandoffImage, StudioHandoffMode, StudioHandoffPayload, stageImagesIntoStudio(), and stageImagesIntoStudioAfterBootstrap()
 * [POS]: Quick-Workspace-to-Studio handoff bridge; registers browser-generated images in useAssetStore and stages an editable SlideGroup in useEditorStore with the primary layer selected
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { nanoid } from 'nanoid'
import type {
  BackgroundLayer,
  ImageLayer,
  Layer,
  PhoneLayer,
  PhoneModel,
  SlideGroup,
} from '@/types'
import { getPhoneSpec } from '@/assets/mockups/specs'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { ensureProjectsBootstrapped } from '@/store/projects'
import {
  createBackgroundLayer,
  newId,
  newSlideGroup,
  seedLocaleContent,
} from '@/store/helpers'
import { BASE_CANVAS_FORMAT } from '@/utils/canvasFormats'
import {
  QUICK_MOCKUPS,
  QUICK_SIZES,
  makeQuickLayers,
  type QuickMockup,
  type QuickSize,
} from '@/utils/quickDesign'

export interface StudioHandoffImage {
  dataUrl: string
  name: string
  width: number
  height: number
}

export type StudioHandoffMode = 'mockup' | 'canvas' | 'carousel'

export interface StudioHandoffPayload {
  images: Array<StudioHandoffImage>
  mode?: StudioHandoffMode
  mockupModel?: PhoneModel
  slideWidth?: number
  slideHeight?: number
}

interface RegisteredImage extends StudioHandoffImage {
  key: string
}

const MIN_SLIDE_DIM = 240
const MAX_SLIDE_DIM = 4096
const DEFAULT_CANVAS_MIN = 480
const DEFAULT_CANVAS_MAX = 2400
const QUICK_MOCKUP_IDS = new Set<string>(QUICK_MOCKUPS.map((item) => item.id))

function clampSlideDimension(value: number): number {
  return Math.max(MIN_SLIDE_DIM, Math.min(MAX_SLIDE_DIM, Math.round(value)))
}

function sanitizeImageDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.max(1, Math.round(value))
}

function sanitizeSlug(name: string, index: number): string {
  const base = name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  return base || `slide-${String(index + 1).padStart(2, '0')}`
}

function deriveCanvasDimensions(
  primary: RegisteredImage,
  requestedWidth?: number,
  requestedHeight?: number,
): { width: number; height: number } {
  if (
    typeof requestedWidth === 'number' && Number.isFinite(requestedWidth) && requestedWidth > 0 &&
    typeof requestedHeight === 'number' && Number.isFinite(requestedHeight) && requestedHeight > 0
  ) {
    return {
      width: clampSlideDimension(requestedWidth),
      height: clampSlideDimension(requestedHeight),
    }
  }

  let width = primary.width
  let height = primary.height
  const maxEdge = Math.max(width, height)
  if (maxEdge > DEFAULT_CANVAS_MAX) {
    const scale = DEFAULT_CANVAS_MAX / maxEdge
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const minEdge = Math.min(width, height)
  if (minEdge < DEFAULT_CANVAS_MIN) {
    width = Math.max(width, DEFAULT_CANVAS_MIN)
    height = Math.max(height, DEFAULT_CANVAS_MIN)
  }
  return {
    width: clampSlideDimension(width),
    height: clampSlideDimension(height),
  }
}

function fitImageCentered(
  imgWidth: number,
  imgHeight: number,
  boxWidth: number,
  boxHeight: number,
  offsetX = 0,
  paddingFraction = 0.06,
): { x: number; y: number; width: number; height: number } {
  const safePad = Math.max(0, Math.min(0.25, paddingFraction))
  const availW = Math.max(1, boxWidth * (1 - safePad * 2))
  const availH = Math.max(1, boxHeight * (1 - safePad * 2))
  const scale = Math.min(availW / imgWidth, availH / imgHeight)
  const width = Math.max(1, Math.round(imgWidth * scale))
  const height = Math.max(1, Math.round(imgHeight * scale))
  return {
    x: offsetX + Math.round((boxWidth - width) / 2),
    y: Math.round((boxHeight - height) / 2),
    width,
    height,
  }
}

function isQuickMockup(model: PhoneModel): model is QuickMockup {
  return QUICK_MOCKUP_IDS.has(model)
}

function pickQuickSizeForModel(model: PhoneModel): QuickSize {
  if (model.startsWith('browser-') || model.startsWith('screen-')) return 'wide'
  if (model === 'apple-watch' || model === 'wear-os') return 'square'
  return 'portrait'
}

function computeModelPlacement(model: PhoneModel, width: number, height: number) {
  const spec = getPhoneSpec(model)
  const isLandscapeFrame = model.startsWith('browser-') || model.startsWith('screen-')
  const fitWidth = isLandscapeFrame ? 0.85 : 0.66
  const fitHeight = isLandscapeFrame ? 0.75 : 0.78
  const scale = Math.min((width * fitWidth) / spec.frameWidth, (height * fitHeight) / spec.frameHeight, 1.5)
  return {
    scale,
    x: Math.round((width - spec.frameWidth * scale) / 2),
    y: Math.round((height - spec.frameHeight * scale) / 2),
  }
}

function buildMockupGroupSpec(
  registered: RegisteredImage[],
  defaultLocale: string,
  payload: StudioHandoffPayload,
): {
  name: string
  numSlides: number
  slideWidth: number
  slideHeight: number
  slideNames: string[]
  layers: Layer[]
  primaryLayerId: string
} {
  const targetModel: PhoneModel = payload.mockupModel ?? 'browser-chrome'
  const baseSize = pickQuickSizeForModel(targetModel)
  const presetDims = QUICK_SIZES[baseSize]
  const hasCustomDims =
    typeof payload.slideWidth === 'number' && Number.isFinite(payload.slideWidth) && payload.slideWidth > 0 &&
    typeof payload.slideHeight === 'number' && Number.isFinite(payload.slideHeight) && payload.slideHeight > 0
  const slideWidth = hasCustomDims ? clampSlideDimension(payload.slideWidth!) : presetDims.width
  const slideHeight = hasCustomDims ? clampSlideDimension(payload.slideHeight!) : presetDims.height

  const quickModel: QuickMockup = isQuickMockup(targetModel)
    ? targetModel
    : (targetModel.startsWith('screen-') ? 'browser-chrome' : 'iphone-16-pro')

  const quickLayers = makeQuickLayers([], baseSize, 'aurora', quickModel, 'cover')
  const bgLayer = quickLayers[0] as BackgroundLayer
  const phoneLayer = quickLayers[1] as PhoneLayer

  if (hasCustomDims) {
    const sx = slideWidth / presetDims.width
    const sy = slideHeight / presetDims.height
    bgLayer.accents = bgLayer.accents.map((accent) => ({
      ...accent,
      rx: accent.rx * sx,
      ry: accent.ry * sy,
    }))
  }

  const spec = getPhoneSpec(targetModel)
  const placement = computeModelPlacement(targetModel, slideWidth, slideHeight)
  const primary = registered[0]

  const configuredPhone: PhoneLayer = {
    ...phoneLayer,
    ...placement,
    model: targetModel,
    name: targetModel.startsWith('browser-') ? 'Browser Mockup' : spec.label,
    screenshotPath: primary.key,
    screenshotDataUrl: undefined,
    showStatusBar: spec.statusBar.height > 0 && !targetModel.startsWith('browser-'),
  }
  const seededPhone = seedLocaleContent(configuredPhone, defaultLocale)

  return {
    name: 'Moklu Canvas',
    numSlides: 1,
    slideWidth,
    slideHeight,
    slideNames: [sanitizeSlug(primary.name, 0)],
    layers: [bgLayer, seededPhone],
    primaryLayerId: seededPhone.id,
  }
}

function buildImageLayersGroupSpec(
  registered: RegisteredImage[],
  defaultLocale: string,
  mode: 'canvas' | 'carousel',
  payload: StudioHandoffPayload,
): {
  name: string
  numSlides: number
  slideWidth: number
  slideHeight: number
  slideNames: string[]
  layers: Layer[]
  primaryLayerId: string
} {
  const { width: slideWidth, height: slideHeight } = deriveCanvasDimensions(
    registered[0],
    payload.slideWidth,
    payload.slideHeight,
  )
  const bgLayer = createBackgroundLayer()
  const isCarousel = mode === 'carousel'
  const numSlides = isCarousel ? registered.length : 1

  const imageLayers: Layer[] = registered.map((img, index) => {
    const slideOffsetX = isCarousel ? index * slideWidth : 0
    const cascade = !isCarousel && registered.length > 1 ? index * 24 : 0
    const padding = isCarousel ? 0.04 : 0.06
    const box = fitImageCentered(
      img.width,
      img.height,
      slideWidth,
      slideHeight,
      slideOffsetX,
      padding,
    )
    const imageLayer: ImageLayer = {
      id: newId(),
      name: img.name || `Image ${index + 1}`,
      type: 'image',
      src: img.key,
      x: box.x + cascade,
      y: box.y + cascade,
      width: box.width,
      height: box.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
    }
    return seedLocaleContent(imageLayer, defaultLocale)
  })

  const slideNames = isCarousel
    ? registered.map((img, index) => sanitizeSlug(img.name, index))
    : [sanitizeSlug(registered[0].name, 0)]

  return {
    name: isCarousel ? 'Moklu Carousel' : 'Moklu Canvas',
    numSlides,
    slideWidth,
    slideHeight,
    slideNames,
    layers: [bgLayer, ...imageLayers],
    primaryLayerId: imageLayers[0].id,
  }
}

/**
 * Registers browser-generated images in `useAssetStore` and stages an editable
 * `SlideGroup` in `useEditorStore` with the primary layer selected so opening
 * `/studio` immediately exposes the user's work for multi-layer editing.
 */
export function stageImagesIntoStudio(payload: StudioHandoffPayload): void {
  const validImages = payload.images.filter(
    (img) => typeof img?.dataUrl === 'string' && img.dataUrl.trim().length > 0,
  )
  if (validImages.length === 0) return

  const assetStore = useAssetStore.getState()
  const registered: RegisteredImage[] = validImages.map((img, index) => {
    const slug = sanitizeSlug(img.name, index)
    const key = `handoff-${nanoid(10)}-${slug}`
    assetStore.addAsset(key, img.dataUrl)
    return {
      key,
      dataUrl: img.dataUrl,
      name: img.name || `Image ${index + 1}`,
      width: sanitizeImageDimension(img.width, payload.slideWidth ?? 1200),
      height: sanitizeImageDimension(img.height, payload.slideHeight ?? 900),
    }
  })

  const editor = useEditorStore.getState()
  const defaultLocale = editor.project.settings.defaultLocale || 'en'
  const resolvedMode: StudioHandoffMode =
    payload.mode ?? (payload.mockupModel ? 'mockup' : registered.length > 1 ? 'carousel' : 'canvas')

  const staged = resolvedMode === 'mockup'
    ? buildMockupGroupSpec(registered, defaultLocale, payload)
    : buildImageLayersGroupSpec(registered, defaultLocale, resolvedMode, payload)

  const activeGroup = editor.project.slideGroups.find(
    (group) => group.id === editor.activeSlideGroupId,
  )
  const canReuseEmptyActiveGroup =
    Boolean(activeGroup) &&
    activeGroup!.layers.every((layer) => layer.type === 'background')

  let targetGroupId: string
  if (canReuseEmptyActiveGroup && activeGroup) {
    targetGroupId = activeGroup.id
    editor.updateSlideGroup(activeGroup.id, {
      name: staged.name,
      numSlides: staged.numSlides,
      slideWidth: staged.slideWidth,
      slideHeight: staged.slideHeight,
      slideNames: staged.slideNames,
      formats: undefined,
      layers: staged.layers,
    })
  } else {
    const nextGroup: SlideGroup = newSlideGroup({
      name: staged.name,
      numSlides: staged.numSlides,
      slideWidth: staged.slideWidth,
      slideHeight: staged.slideHeight,
      slideNames: staged.slideNames,
      formats: undefined,
      layers: staged.layers,
    })
    targetGroupId = nextGroup.id
    editor.updateProject({
      slideGroups: [...editor.project.slideGroups, nextGroup],
    })
  }

  useEditorStore.getState().setActiveSlideGroup(targetGroupId)
  useEditorStore.getState().setActiveCanvasFormat(BASE_CANVAS_FORMAT)
  useEditorStore.getState().select(staged.primaryLayerId)
}

/**
 * Awaits shared IndexedDB project hydration before staging handoff images so
 * fast Quick-Workspace -> Studio transitions never race initial project load.
 */
export async function stageImagesIntoStudioAfterBootstrap(
  payload: StudioHandoffPayload,
): Promise<void> {
  await ensureProjectsBootstrapped()
  stageImagesIntoStudio(payload)
}
