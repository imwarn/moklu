/**
 * [INPUT]: depends on nanoid from nanoid; depends on BackgroundLayer, BrowserChromeOptions, FillValue, GradientStop, ImageLayer, Layer, PhoneLayer, PhoneModel, ShapeLayer, and SlideGroup from @/types; depends on getPhoneSpec from @/assets/mockups/specs; depends on calcScreenshotLayout from @/components/canvas/PhoneNode.geometry; depends on useEditorStore from @/store; depends on useAssetStore from @/store/assets; depends on ensureProjectsBootstrapped from @/store/projects; depends on createBackgroundLayer, newId, newSlideGroup, and seedLocaleContent from @/store/helpers; depends on BASE_CANVAS_FORMAT from @/utils/canvasFormats; depends on QUICK_SIZES, QuickScreenshotFit, QuickSize, QuickTheme, getQuickMockupPlacement, and makeQuickLayers from @/utils/quickDesign
 * [OUTPUT]: exports StudioHandoffImage, StudioHandoffLayer, StudioHandoffMode, StudioRedactionRegion, StudioHandoffPayload, CanvasLike, renderRedactionCropOnCanvas(), stageImagesIntoStudio(), and stageImagesIntoStudioAfterBootstrap()
 * [POS]: Quick-Workspace-to-Studio handoff bridge; registers browser-generated images in useAssetStore and stages editable SlideGroup layouts (including non-destructive Blur, Pixelate, and Spotlight overlay layers) in useEditorStore
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import type {
  BackgroundLayer, BrowserChromeOptions, FillValue, GradientStop, ImageLayer,
  Layer, PhoneLayer, PhoneModel, ShapeLayer, SlideGroup,
} from '@/types'
import { getPhoneSpec } from '@/assets/mockups/specs'
import { calcScreenshotLayout } from '@/components/canvas/PhoneNode.geometry'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { ensureProjectsBootstrapped } from '@/store/projects'
import { createBackgroundLayer, newId, newSlideGroup, seedLocaleContent } from '@/store/helpers'
import { BASE_CANVAS_FORMAT } from '@/utils/canvasFormats'
import {
  QUICK_SIZES, getQuickMockupPlacement, makeQuickLayers,
  type QuickScreenshotFit, type QuickSize, type QuickTheme,
} from '@/utils/quickDesign'

export interface StudioHandoffImage { dataUrl: string; name: string; width: number; height: number }
export interface StudioHandoffLayer extends StudioHandoffImage { x: number; y: number; rotation?: number; cornerRadius?: number }

export interface StudioRedactionRegion {
  id: string
  kind: 'blur' | 'pixelate' | 'spotlight'
  /** Normalized 0..1 coordinates relative to the screenshot image. */
  x: number
  y: number
  width: number
  height: number
  intensity: number
}

export type StudioHandoffMode = 'mockup' | 'canvas' | 'carousel' | 'layers'

export interface StudioHandoffPayload {
  images: Array<StudioHandoffImage>
  mode?: StudioHandoffMode
  mockupModel?: PhoneModel
  slideWidth?: number
  slideHeight?: number
  theme?: QuickTheme
  screenshotFit?: QuickScreenshotFit
  scaleFactor?: number
  browserChrome?: BrowserChromeOptions
  layers?: Array<StudioHandoffLayer>
  background?: string
  redactions?: StudioRedactionRegion[]
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
  toDataURL(type?: string): string
}

interface RegisteredImage extends StudioHandoffImage { key: string }
interface RegisteredLayer extends StudioHandoffLayer { key: string }
interface RectBox { x: number; y: number; width: number; height: number }
interface ProjectedRedaction { region: StudioRedactionRegion; canvasRect: RectBox; cropNorm: RectBox }
interface StagedGroupSpec {
  name: string; numSlides: number; slideWidth: number; slideHeight: number
  slideNames: string[]; layers: Layer[]; primaryLayerId: string
}

const MIN_SLIDE_DIM = 240
const MAX_SLIDE_DIM = 4096
const DEFAULT_CANVAS_MIN = 480
const DEFAULT_CANVAS_MAX = 2400

const clampSlideDimension = (v: number) => Math.max(MIN_SLIDE_DIM, Math.min(MAX_SLIDE_DIM, Math.round(v)))
const sanitizeImageDimension = (v: number, fallback: number) => (!Number.isFinite(v) || v <= 0 ? fallback : Math.max(1, Math.round(v)))
const sanitizeLayerDimension = (v: number, fallback: number) => (!Number.isFinite(v) || v <= 0 ? fallback : Math.max(1, v))
const roundCoord = (v: number) => Math.round(v * 100) / 100

function sanitizeSlug(name: string, index: number): string {
  const base = name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
  return base || `slide-${String(index + 1).padStart(2, '0')}`
}

function makeSeededImageLayer(
  defaultLocale: string,
  opts: Pick<ImageLayer, 'name' | 'src' | 'x' | 'y' | 'width' | 'height'> &
    Partial<Pick<ImageLayer, 'rotation' | 'cornerRadius' | 'blur' | 'shadow'>>,
): Layer {
  const layer: ImageLayer = {
    id: newId(),
    type: 'image',
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    cornerRadius: 0,
    ...opts,
  }
  return seedLocaleContent(layer, defaultLocale)
}

function deriveCanvasDimensions(
  primary: Pick<StudioHandoffImage, 'width' | 'height'>,
  requestedWidth?: number,
  requestedHeight?: number,
): { width: number; height: number } {
  if (
    typeof requestedWidth === 'number' && Number.isFinite(requestedWidth) && requestedWidth > 0 &&
    typeof requestedHeight === 'number' && Number.isFinite(requestedHeight) && requestedHeight > 0
  ) {
    return { width: clampSlideDimension(requestedWidth), height: clampSlideDimension(requestedHeight) }
  }
  let { width, height } = primary
  const maxEdge = Math.max(width, height)
  if (maxEdge > DEFAULT_CANVAS_MAX) {
    const scale = DEFAULT_CANVAS_MAX / maxEdge
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  if (Math.min(width, height) < DEFAULT_CANVAS_MIN) {
    width = Math.max(width, DEFAULT_CANVAS_MIN)
    height = Math.max(height, DEFAULT_CANVAS_MIN)
  }
  return { width: clampSlideDimension(width), height: clampSlideDimension(height) }
}

function fitImageCentered(
  imgWidth: number, imgHeight: number, boxWidth: number, boxHeight: number,
  offsetX = 0, paddingFraction = 0.06,
): RectBox {
  const safePad = Math.max(0, Math.min(0.25, paddingFraction))
  const availW = Math.max(1, boxWidth * (1 - safePad * 2))
  const availH = Math.max(1, boxHeight * (1 - safePad * 2))
  const scale = Math.min(availW / imgWidth, availH / imgHeight)
  const width = Math.max(1, Math.round(imgWidth * scale))
  const height = Math.max(1, Math.round(imgHeight * scale))
  return { x: offsetX + Math.round((boxWidth - width) / 2), y: Math.round((boxHeight - height) / 2), width, height }
}

function pickQuickSizeForModel(model: PhoneModel): QuickSize {
  if (model.startsWith('browser-') || model.startsWith('screen-')) return 'wide'
  if (model === 'apple-watch' || model === 'wear-os') return 'square'
  return 'portrait'
}

function computeModelPlacement(model: PhoneModel, width: number, height: number, scaleFactor = 1) {
  const spec = getPhoneSpec(model)
  const base = getQuickMockupPlacement(model, width, height)
  const clampedFactor = Number.isFinite(scaleFactor) ? Math.max(0.65, Math.min(1.15, scaleFactor)) : 1
  if (clampedFactor === 1) return base
  const scale = base.scale * clampedFactor
  return { scale, x: Math.round((width - spec.frameWidth * scale) / 2), y: Math.round((height - spec.frameHeight * scale) / 2) }
}

function projectRedactionRegion(region: StudioRedactionRegion, screenRect: RectBox, imageRect: RectBox): ProjectedRedaction | null {
  if (!Number.isFinite(region.x) || !Number.isFinite(region.y) || !Number.isFinite(region.width) || !Number.isFinite(region.height)) {
    return null
  }
  const rx = Math.max(0, Math.min(1, region.x))
  const ry = Math.max(0, Math.min(1, region.y))
  const rw = Math.max(0, Math.min(1 - rx, region.width))
  const rh = Math.max(0, Math.min(1 - ry, region.height))
  if (rw <= 0 || rh <= 0 || imageRect.width <= 0 || imageRect.height <= 0) return null

  const rawLeft = imageRect.x + rx * imageRect.width
  const rawTop = imageRect.y + ry * imageRect.height
  const left = Math.max(screenRect.x, rawLeft)
  const top = Math.max(screenRect.y, rawTop)
  const right = Math.min(screenRect.x + screenRect.width, rawLeft + rw * imageRect.width)
  const bottom = Math.min(screenRect.y + screenRect.height, rawTop + rh * imageRect.height)
  if (right - left < 1 || bottom - top < 1) return null

  const cropX = Math.max(0, Math.min(1, (left - imageRect.x) / imageRect.width))
  const cropY = Math.max(0, Math.min(1, (top - imageRect.y) / imageRect.height))
  const cropW = Math.max(0, Math.min(1 - cropX, (right - left) / imageRect.width))
  const cropH = Math.max(0, Math.min(1 - cropY, (bottom - top) / imageRect.height))
  if (cropW <= 0 || cropH <= 0) return null

  return {
    region,
    canvasRect: { x: left, y: top, width: right - left, height: bottom - top },
    cropNorm: { x: cropX, y: cropY, width: cropW, height: cropH },
  }
}

/** Crops (and optionally pixelates with nearest-neighbor smoothing disabled) a normalized image region onto an offscreen canvas. */
export function renderRedactionCropOnCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  cropNorm: RectBox,
  kind: StudioRedactionRegion['kind'],
  intensity: number,
  createCanvas?: (width: number, height: number) => CanvasLike,
): string | null {
  const makeCanvas: ((w: number, h: number) => CanvasLike) | null = createCanvas
    ?? (typeof document !== 'undefined'
      ? (w, h) => { const el = document.createElement('canvas'); el.width = w; el.height = h; return el }
      : null)
  if (!makeCanvas || sourceWidth <= 0 || sourceHeight <= 0) return null

  const sx = Math.max(0, Math.min(sourceWidth - 1, Math.round(cropNorm.x * sourceWidth)))
  const sy = Math.max(0, Math.min(sourceHeight - 1, Math.round(cropNorm.y * sourceHeight)))
  const sw = Math.max(1, Math.min(sourceWidth - sx, Math.round(cropNorm.width * sourceWidth)))
  const sh = Math.max(1, Math.min(sourceHeight - sy, Math.round(cropNorm.height * sourceHeight)))

  const outCanvas = makeCanvas(sw, sh)
  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) return null

  if (kind === 'pixelate') {
    const blockSize = Math.max(4, Math.round(Number.isFinite(intensity) ? intensity : 12))
    const tinyW = Math.max(1, Math.round(sw / blockSize))
    const tinyH = Math.max(1, Math.round(sh / blockSize))
    const tinyCanvas = makeCanvas(tinyW, tinyH)
    const tinyCtx = tinyCanvas.getContext('2d')
    if (!tinyCtx) return null
    tinyCtx.drawImage(source, sx, sy, sw, sh, 0, 0, tinyW, tinyH)
    outCtx.imageSmoothingEnabled = false
    outCtx.drawImage(tinyCanvas as unknown as CanvasImageSource, 0, 0, tinyW, tinyH, 0, 0, sw, sh)
  } else {
    outCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
  }
  return outCanvas.toDataURL('image/png')
}

async function renderRedactionCropDataUrl(
  sourceDataUrl: string, cropNorm: RectBox, kind: StudioRedactionRegion['kind'], intensity: number,
): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => resolve(null)
    el.src = sourceDataUrl
  })
  if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return null
  return renderRedactionCropOnCanvas(img, img.naturalWidth, img.naturalHeight, cropNorm, kind, intensity)
}

function createSpotlightMaskShape(name: string, rect: RectBox): ShapeLayer {
  return {
    id: newId(), name, type: 'shape', shapeType: 'rect',
    x: roundCoord(rect.x), y: roundCoord(rect.y), width: roundCoord(rect.width), height: roundCoord(rect.height),
    fill: '#000000', opacity: 0.42, cornerRadius: 0, rotation: 0, visible: true, locked: false,
  }
}

function buildRedactionLayers(
  redactions: StudioRedactionRegion[] | undefined,
  primary: RegisteredImage,
  screenRect: RectBox,
  imageRect: RectBox,
  defaultLocale: string,
  precomputedCrops?: Map<string, string>,
): Layer[] {
  if (!redactions?.length) return []

  const assetStore = useAssetStore.getState()
  const spotlightMasks: Layer[] = []
  const redactOverlays: Layer[] = []
  const spotlightFocuses: Layer[] = []

  for (const region of redactions) {
    const projected = projectRedactionRegion(region, screenRect, imageRect)
    if (!projected) continue

    const { canvasRect, cropNorm } = projected
    const assetKey = `handoff-redact-${nanoid(8)}-${region.kind}`
    const precomputed = precomputedCrops?.get(region.id)
    assetStore.addAsset(assetKey, precomputed ?? primary.dataUrl)

    if (!precomputed && typeof document !== 'undefined' && typeof Image !== 'undefined') {
      void renderRedactionCropDataUrl(primary.dataUrl, cropNorm, region.kind, region.intensity).then((url) => {
        if (url) useAssetStore.getState().addAsset(assetKey, url)
      })
    }

    if (region.kind === 'blur') {
      const blur = Math.max(4, Math.round(Number.isFinite(region.intensity) ? region.intensity : 12))
      redactOverlays.push(makeSeededImageLayer(defaultLocale, {
        name: 'Blur Redaction', src: assetKey,
        x: roundCoord(canvasRect.x), y: roundCoord(canvasRect.y),
        width: Math.max(1, roundCoord(canvasRect.width)), height: Math.max(1, roundCoord(canvasRect.height)),
        blur, cornerRadius: 8,
      }))
      continue
    }

    if (region.kind === 'pixelate') {
      redactOverlays.push(makeSeededImageLayer(defaultLocale, {
        name: 'Pixelate Redaction', src: assetKey,
        x: roundCoord(canvasRect.x), y: roundCoord(canvasRect.y),
        width: Math.max(1, roundCoord(canvasRect.width)), height: Math.max(1, roundCoord(canvasRect.height)),
        cornerRadius: 6,
      }))
      continue
    }

    // Spotlight: 4 surrounding semi-transparent dark masks + crisp/1.25x zoomed focus cutout
    const masks: Array<[string, RectBox]> = [
      ['Spotlight Mask Top', { x: screenRect.x, y: screenRect.y, width: screenRect.width, height: canvasRect.y - screenRect.y }],
      ['Spotlight Mask Bottom', {
        x: screenRect.x, y: canvasRect.y + canvasRect.height, width: screenRect.width,
        height: screenRect.y + screenRect.height - (canvasRect.y + canvasRect.height),
      }],
      ['Spotlight Mask Left', { x: screenRect.x, y: canvasRect.y, width: canvasRect.x - screenRect.x, height: canvasRect.height }],
      ['Spotlight Mask Right', {
        x: canvasRect.x + canvasRect.width, y: canvasRect.y,
        width: screenRect.x + screenRect.width - (canvasRect.x + canvasRect.width), height: canvasRect.height,
      }],
    ]
    for (const [maskName, rect] of masks) {
      if (rect.width >= 0.5 && rect.height >= 0.5) spotlightMasks.push(createSpotlightMaskShape(maskName, rect))
    }

    const zoom = Number.isFinite(region.intensity) && region.intensity > 1 ? 1.25 : 1
    const focusW = canvasRect.width * zoom
    const focusH = canvasRect.height * zoom
    spotlightFocuses.push(makeSeededImageLayer(defaultLocale, {
      name: 'Spotlight Focus', src: assetKey,
      x: roundCoord(canvasRect.x - (focusW - canvasRect.width) / 2),
      y: roundCoord(canvasRect.y - (focusH - canvasRect.height) / 2),
      width: Math.max(1, roundCoord(focusW)), height: Math.max(1, roundCoord(focusH)),
      cornerRadius: 12,
      shadow: { color: '#000000', blur: 24, opacity: 0.38, offsetX: 0, offsetY: 8 },
    }))
  }

  return [...spotlightMasks, ...redactOverlays, ...spotlightFocuses]
}

function resolveMockupGeometry(primary: Pick<StudioHandoffImage, 'width' | 'height'>, payload: StudioHandoffPayload) {
  const targetModel: PhoneModel = payload.mockupModel ?? 'browser-chrome'
  const baseSize = pickQuickSizeForModel(targetModel)
  const presetDims = QUICK_SIZES[baseSize]
  const hasCustomDims =
    typeof payload.slideWidth === 'number' && Number.isFinite(payload.slideWidth) && payload.slideWidth > 0 &&
    typeof payload.slideHeight === 'number' && Number.isFinite(payload.slideHeight) && payload.slideHeight > 0
  const slideWidth = hasCustomDims ? clampSlideDimension(payload.slideWidth!) : presetDims.width
  const slideHeight = hasCustomDims ? clampSlideDimension(payload.slideHeight!) : presetDims.height
  const resolvedFit: QuickScreenshotFit = payload.screenshotFit ?? 'cover'
  const spec = getPhoneSpec(targetModel)
  const placement = computeModelPlacement(targetModel, slideWidth, slideHeight, payload.scaleFactor)
  const screenRect: RectBox = {
    x: placement.x + spec.screen.x * placement.scale,
    y: placement.y + spec.screen.y * placement.scale,
    width: spec.screen.width * placement.scale,
    height: spec.screen.height * placement.scale,
  }
  const shotLayout = calcScreenshotLayout(primary.width, primary.height, spec.screen.width, spec.screen.height, resolvedFit, 0, 0)
  const imageRect: RectBox = {
    x: screenRect.x + shotLayout.x * placement.scale,
    y: screenRect.y + shotLayout.y * placement.scale,
    width: shotLayout.width * placement.scale,
    height: shotLayout.height * placement.scale,
  }
  return { targetModel, baseSize, presetDims, hasCustomDims, slideWidth, slideHeight, resolvedFit, spec, placement, screenRect, imageRect }
}

function buildMockupGroupSpec(
  registered: RegisteredImage[], defaultLocale: string, payload: StudioHandoffPayload, precomputedCrops?: Map<string, string>,
): StagedGroupSpec {
  const primary = registered[0]
  const geo = resolveMockupGeometry(primary, payload)
  const resolvedTheme: QuickTheme = payload.theme ?? 'aurora'
  const quickLayers = makeQuickLayers([], geo.baseSize, resolvedTheme, geo.targetModel, geo.resolvedFit)
  const bgLayer = quickLayers[0] as BackgroundLayer
  const phoneLayer = quickLayers[1] as PhoneLayer

  if (geo.hasCustomDims) {
    const sx = geo.slideWidth / geo.presetDims.width
    const sy = geo.slideHeight / geo.presetDims.height
    bgLayer.accents = bgLayer.accents.map((accent) => ({ ...accent, rx: accent.rx * sx, ry: accent.ry * sy }))
  }

  const configuredPhone: PhoneLayer = {
    ...phoneLayer, ...geo.placement,
    model: geo.targetModel,
    name: geo.targetModel.startsWith('browser-') ? 'Browser Mockup' : geo.spec.label,
    screenshotPath: primary.key,
    screenshotDataUrl: undefined,
    screenshotFit: geo.resolvedFit,
    showStatusBar: geo.spec.statusBar.height > 0 && !geo.targetModel.startsWith('browser-'),
    ...(payload.browserChrome ? { browserChrome: { ...payload.browserChrome } } : {}),
  }
  const seededPhone = seedLocaleContent(configuredPhone, defaultLocale)
  const redactionLayers = buildRedactionLayers(payload.redactions, primary, geo.screenRect, geo.imageRect, defaultLocale, precomputedCrops)

  return {
    name: 'Moklu Canvas', numSlides: 1, slideWidth: geo.slideWidth, slideHeight: geo.slideHeight,
    slideNames: [sanitizeSlug(primary.name, 0)],
    layers: [bgLayer, seededPhone, ...redactionLayers],
    primaryLayerId: seededPhone.id,
  }
}

function buildImageLayersGroupSpec(
  registered: RegisteredImage[], defaultLocale: string, mode: 'canvas' | 'carousel',
  payload: StudioHandoffPayload, precomputedCrops?: Map<string, string>,
): StagedGroupSpec {
  const { width: slideWidth, height: slideHeight } = deriveCanvasDimensions(registered[0], payload.slideWidth, payload.slideHeight)
  const bgLayer = createBackgroundLayer()
  const isCarousel = mode === 'carousel'

  let primaryBox: RectBox | null = null
  const imageLayers: Layer[] = registered.map((img, index) => {
    const slideOffsetX = isCarousel ? index * slideWidth : 0
    const cascade = !isCarousel && registered.length > 1 ? index * 24 : 0
    const box = fitImageCentered(img.width, img.height, slideWidth, slideHeight, slideOffsetX, isCarousel ? 0.04 : 0.06)
    const rect: RectBox = { x: box.x + cascade, y: box.y + cascade, width: box.width, height: box.height }
    if (index === 0) primaryBox = rect
    return makeSeededImageLayer(defaultLocale, { name: img.name || `Image ${index + 1}`, src: img.key, ...rect })
  })

  const redactionLayers = !isCarousel && primaryBox
    ? buildRedactionLayers(payload.redactions, registered[0], primaryBox, primaryBox, defaultLocale, precomputedCrops)
    : []
  const slideNames = isCarousel ? registered.map((img, i) => sanitizeSlug(img.name, i)) : [sanitizeSlug(registered[0].name, 0)]

  return {
    name: isCarousel ? 'Moklu Carousel' : 'Moklu Canvas',
    numSlides: isCarousel ? registered.length : 1,
    slideWidth, slideHeight, slideNames,
    layers: [bgLayer, ...imageLayers, ...redactionLayers],
    primaryLayerId: imageLayers[0].id,
  }
}

function parseCssBackgroundToFill(background: string): FillValue {
  const trimmed = background.trim()
  if (!trimmed.toLowerCase().startsWith('linear-gradient(') || !trimmed.endsWith(')')) return trimmed
  const parts = trimmed.slice('linear-gradient('.length, -1).split(',').map((p) => p.trim()).filter(Boolean)

  let angle = 135
  let colorTokens = parts
  if (parts.length > 0 && /deg$/i.test(parts[0])) {
    const parsedAngle = Number.parseFloat(parts[0])
    if (Number.isFinite(parsedAngle)) { angle = parsedAngle; colorTokens = parts.slice(1) }
  }
  if (colorTokens.length < 2) return colorTokens[0] ?? '#ffffff'

  const stops: GradientStop[] = colorTokens.map((token, idx) => {
    const percentMatch = /^(.*?)\s+(\d+(?:\.\d+)?)%$/.exec(token)
    return percentMatch
      ? { color: percentMatch[1].trim(), offset: Number.parseFloat(percentMatch[2]) / 100 }
      : { color: token, offset: idx / Math.max(1, colorTokens.length - 1) }
  })
  return { type: 'linear', angle, stops }
}

function buildBackgroundLayerFromCss(background?: string): BackgroundLayer {
  const trimmed = background?.trim()
  if (!trimmed) return createBackgroundLayer()
  if (trimmed.toLowerCase() === 'transparent') return createBackgroundLayer({ fill: '#ffffff', opacity: 0, accents: [] })
  return createBackgroundLayer({ fill: parseCssBackgroundToFill(trimmed), accents: [] })
}

function buildExplicitLayersGroupSpec(
  registered: RegisteredLayer[], defaultLocale: string, payload: StudioHandoffPayload,
): StagedGroupSpec {
  const inferredWidth = Math.max(1, ...registered.map((item) => item.x + item.width))
  const inferredHeight = Math.max(1, ...registered.map((item) => item.y + item.height))
  const rawWidth = typeof payload.slideWidth === 'number' && Number.isFinite(payload.slideWidth) && payload.slideWidth > 0 ? payload.slideWidth : inferredWidth
  const rawHeight = typeof payload.slideHeight === 'number' && Number.isFinite(payload.slideHeight) && payload.slideHeight > 0 ? payload.slideHeight : inferredHeight

  const maxDim = Math.max(rawWidth, rawHeight)
  const scale = maxDim > MAX_SLIDE_DIM ? MAX_SLIDE_DIM / maxDim : 1
  const scaledW = rawWidth * scale
  const scaledH = rawHeight * scale
  const slideWidth = clampSlideDimension(scaledW)
  const slideHeight = clampSlideDimension(scaledH)
  const offsetX = (slideWidth - scaledW) / 2
  const offsetY = (slideHeight - scaledH) / 2

  const bgLayer = buildBackgroundLayerFromCss(payload.background)
  const imageLayers: Layer[] = registered.map((item, index) => {
    const rotation = typeof item.rotation === 'number' && Number.isFinite(item.rotation) ? item.rotation : 0
    const rawRadius = typeof item.cornerRadius === 'number' && Number.isFinite(item.cornerRadius) ? Math.max(0, item.cornerRadius) : 0
    return makeSeededImageLayer(defaultLocale, {
      name: item.name || `Image ${index + 1}`, src: item.key,
      x: roundCoord(item.x * scale + offsetX), y: roundCoord(item.y * scale + offsetY),
      width: Math.max(1, roundCoord(item.width * scale)), height: Math.max(1, roundCoord(item.height * scale)),
      rotation, cornerRadius: roundCoord(rawRadius * scale),
    })
  })

  return {
    name: 'Moklu Collage', numSlides: 1, slideWidth, slideHeight,
    slideNames: [sanitizeSlug(registered[0].name, 0)],
    layers: [bgLayer, ...imageLayers],
    primaryLayerId: imageLayers[0].id,
  }
}

function commitStagedGroupSpec(staged: StagedGroupSpec): void {
  const editor = useEditorStore.getState()
  const activeGroup = editor.project.slideGroups.find((g) => g.id === editor.activeSlideGroupId)
  const canReuseEmptyActiveGroup = Boolean(activeGroup) && activeGroup!.layers.every((l) => l.type === 'background')

  let targetGroupId: string
  const groupFields = {
    name: staged.name, numSlides: staged.numSlides,
    slideWidth: staged.slideWidth, slideHeight: staged.slideHeight,
    slideNames: staged.slideNames, formats: undefined, layers: staged.layers,
  }
  if (canReuseEmptyActiveGroup && activeGroup) {
    targetGroupId = activeGroup.id
    editor.updateSlideGroup(activeGroup.id, groupFields)
  } else {
    const nextGroup: SlideGroup = newSlideGroup(groupFields)
    targetGroupId = nextGroup.id
    editor.updateProject({ slideGroups: [...editor.project.slideGroups, nextGroup] })
  }

  useEditorStore.getState().setActiveSlideGroup(targetGroupId)
  useEditorStore.getState().setActiveCanvasFormat(BASE_CANVAS_FORMAT)
  useEditorStore.getState().select(staged.primaryLayerId)
}

function resolvePayloadMode(payload: StudioHandoffPayload, imageCount: number): Exclude<StudioHandoffMode, 'layers'> {
  if (payload.mode && payload.mode !== 'layers') return payload.mode
  if (payload.mockupModel) return 'mockup'
  return imageCount > 1 ? 'carousel' : 'canvas'
}

function stageImagesIntoStudioInternal(payload: StudioHandoffPayload, precomputedCrops?: Map<string, string>): void {
  const assetStore = useAssetStore.getState()
  const editor = useEditorStore.getState()
  const defaultLocale = editor.project.settings.defaultLocale || 'en'

  if (payload.mode === 'layers') {
    const validLayers = (payload.layers ?? []).filter((l) => typeof l?.dataUrl === 'string' && l.dataUrl.trim().length > 0)
    if (validLayers.length > 0) {
      const registeredLayers: RegisteredLayer[] = validLayers.map((layer, index) => {
        const key = `handoff-${nanoid(10)}-${sanitizeSlug(layer.name, index)}`
        assetStore.addAsset(key, layer.dataUrl)
        return {
          key, dataUrl: layer.dataUrl, name: layer.name || `Image ${index + 1}`,
          x: Number.isFinite(layer.x) ? layer.x : 0, y: Number.isFinite(layer.y) ? layer.y : 0,
          width: sanitizeLayerDimension(layer.width, payload.slideWidth ?? 1200),
          height: sanitizeLayerDimension(layer.height, payload.slideHeight ?? 900),
          rotation: layer.rotation, cornerRadius: layer.cornerRadius,
        }
      })
      commitStagedGroupSpec(buildExplicitLayersGroupSpec(registeredLayers, defaultLocale, payload))
      return
    }
  }

  const validImages = payload.images.filter((img) => typeof img?.dataUrl === 'string' && img.dataUrl.trim().length > 0)
  if (validImages.length === 0) return

  const registered: RegisteredImage[] = validImages.map((img, index) => {
    const key = `handoff-${nanoid(10)}-${sanitizeSlug(img.name, index)}`
    assetStore.addAsset(key, img.dataUrl)
    return {
      key, dataUrl: img.dataUrl, name: img.name || `Image ${index + 1}`,
      width: sanitizeImageDimension(img.width, payload.slideWidth ?? 1200),
      height: sanitizeImageDimension(img.height, payload.slideHeight ?? 900),
    }
  })

  const resolvedMode = resolvePayloadMode(payload, registered.length)
  const staged = resolvedMode === 'mockup'
    ? buildMockupGroupSpec(registered, defaultLocale, payload, precomputedCrops)
    : buildImageLayersGroupSpec(registered, defaultLocale, resolvedMode, payload, precomputedCrops)
  commitStagedGroupSpec(staged)
}

/** Registers browser-generated images in `useAssetStore` and stages an editable `SlideGroup` in `useEditorStore`. */
export function stageImagesIntoStudio(payload: StudioHandoffPayload): void {
  stageImagesIntoStudioInternal(payload)
}

async function precomputeRedactionCrops(payload: StudioHandoffPayload): Promise<Map<string, string> | undefined> {
  if (!payload.redactions?.length || typeof document === 'undefined' || typeof Image === 'undefined') return undefined
  const validImages = payload.images.filter((img) => typeof img?.dataUrl === 'string' && img.dataUrl.trim().length > 0)
  if (validImages.length === 0) return undefined

  const mode = resolvePayloadMode(payload, validImages.length)
  if (mode === 'carousel') return undefined

  const primary = {
    dataUrl: validImages[0].dataUrl,
    width: sanitizeImageDimension(validImages[0].width, payload.slideWidth ?? 1200),
    height: sanitizeImageDimension(validImages[0].height, payload.slideHeight ?? 900),
  }

  let screenRect: RectBox
  let imageRect: RectBox
  if (mode === 'mockup') {
    const geo = resolveMockupGeometry(primary, payload)
    screenRect = geo.screenRect
    imageRect = geo.imageRect
  } else {
    const { width: slideWidth, height: slideHeight } = deriveCanvasDimensions(primary, payload.slideWidth, payload.slideHeight)
    const box = fitImageCentered(primary.width, primary.height, slideWidth, slideHeight, 0, 0.06)
    screenRect = box
    imageRect = box
  }

  const crops = new Map<string, string>()
  await Promise.all(
    payload.redactions.map(async (region) => {
      const projected = projectRedactionRegion(region, screenRect, imageRect)
      if (!projected) return
      const rendered = await renderRedactionCropDataUrl(primary.dataUrl, projected.cropNorm, region.kind, region.intensity)
      if (rendered) crops.set(region.id, rendered)
    }),
  )
  return crops
}

/** Awaits shared IndexedDB project hydration (and offscreen redaction crop rendering) before staging handoff images. */
export async function stageImagesIntoStudioAfterBootstrap(payload: StudioHandoffPayload): Promise<void> {
  const [, precomputedCrops] = await Promise.all([
    ensureProjectsBootstrapped(),
    precomputeRedactionCrops(payload),
  ])
  stageImagesIntoStudioInternal(payload, precomputedCrops)
}
