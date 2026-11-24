/**
 * [INPUT]: depends on loadHtmlImage from ./canvasUtils and workspace merge/handoff contracts from ./types
 * [OUTPUT]: exports isPartialSourceCrop, placementToStudioLayer, cropSourceRectToDataUrl, and buildMergeStudioHandoff for pixel-accurate multi-layer Studio handoff
 * [POS]: merge-to-Studio handoff builder in src/workspace; slices cropped sourceRect fragments offscreen and converts rotated destRect placements into Konva ImageLayer coordinates
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { loadHtmlImage } from './canvasUtils'
import type {
  StudioHandoffLayer,
  StudioHandoffPayload,
  WorkspaceImageInput,
  WorkspaceMergeOutput,
  WorkspaceMergePlacement,
  WorkspaceRect,
} from './types'

const CROP_EPSILON_PX = 0.5

/**
 * Returns true when a merge placement draws only a sub-rectangle of its original source image
 * (for example after grid cover-cropping or vertical long-screenshot overlap removal).
 */
export function isPartialSourceCrop(
  sourceRect: WorkspaceRect,
  imageWidth: number,
  imageHeight: number,
): boolean {
  if (imageWidth <= 0 || imageHeight <= 0) return false
  if (sourceRect.width <= 0 || sourceRect.height <= 0) return false
  return (
    sourceRect.x > CROP_EPSILON_PX ||
    sourceRect.y > CROP_EPSILON_PX ||
    Math.abs(sourceRect.width - imageWidth) > CROP_EPSILON_PX ||
    Math.abs(sourceRect.height - imageHeight) > CROP_EPSILON_PX
  )
}

/**
 * Maps a merge engine placement (where destRect is the post-rotation visual bounding box)
 * into Konva ImageLayer coordinates (which rotate around the layer's geometric center).
 */
export function placementToStudioLayer(
  image: Pick<WorkspaceImageInput, 'name'>,
  placement: WorkspaceMergePlacement,
  dataUrl: string,
): StudioHandoffLayer {
  const { destRect, radius, rotation } = placement
  const swapped = rotation === 90 || rotation === 270
  const width = Math.max(1, swapped ? destRect.height : destRect.width)
  const height = Math.max(1, swapped ? destRect.width : destRect.height)
  const x = destRect.x + (destRect.width - width) / 2
  const y = destRect.y + (destRect.height - height) / 2

  return {
    dataUrl,
    name: image.name,
    x,
    y,
    width,
    height,
    rotation,
    cornerRadius: Math.max(0, radius),
  }
}

/**
 * Crops the requested sourceRect from an image into a standalone PNG data URL via an
 * offscreen canvas so Studio ImageLayers match grid-cover and overlap-trimmed merges pixel-for-pixel.
 */
export async function cropSourceRectToDataUrl(
  image: WorkspaceImageInput,
  sourceRect: WorkspaceRect,
): Promise<string> {
  if (typeof document === 'undefined') return image.dataUrl
  try {
    const htmlImg = await loadHtmlImage(image.dataUrl)
    const natW = htmlImg.naturalWidth || htmlImg.width || image.width
    const natH = htmlImg.naturalHeight || htmlImg.height || image.height
    if (natW <= 0 || natH <= 0) return image.dataUrl

    const sx = Math.max(0, Math.min(natW - 1, sourceRect.x))
    const sy = Math.max(0, Math.min(natH - 1, sourceRect.y))
    const sw = Math.max(1, Math.min(natW - sx, sourceRect.width))
    const sh = Math.max(1, Math.min(natH - sy, sourceRect.height))
    const outW = Math.max(1, Math.round(sw))
    const outH = Math.max(1, Math.round(sh))

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return image.dataUrl

    ctx.drawImage(htmlImg, sx, sy, sw, sh, 0, 0, outW, outH)
    return canvas.toDataURL('image/png')
  } catch {
    return image.dataUrl
  }
}

export interface BuildMergeHandoffOptions {
  cropSource?: (image: WorkspaceImageInput, sourceRect: WorkspaceRect) => Promise<string>
}

/**
 * Builds a multi-layer `mode: 'layers'` Studio handoff payload when merge layout placements
 * are available, or falls back to a flattened single-layer `mode: 'canvas'` handoff.
 */
export async function buildMergeStudioHandoff(
  images: readonly WorkspaceImageInput[],
  result: WorkspaceMergeOutput,
  background: string,
  options?: BuildMergeHandoffOptions,
): Promise<StudioHandoffPayload> {
  const placements = result.layout?.placements
  if (!placements || placements.length === 0) {
    return {
      images: [
        {
          dataUrl: result.dataUrl,
          name: result.filename,
          width: result.width,
          height: result.height,
        },
      ],
      mode: 'canvas',
      slideWidth: result.width,
      slideHeight: result.height,
      background,
    }
  }

  const cropFn = options?.cropSource ?? cropSourceRectToDataUrl
  const layers: StudioHandoffLayer[] = []

  const resolved = await Promise.all(
    placements.map(async (placement) => {
      const sourceImg = images[placement.index]
      if (!sourceImg) return null
      const needsCrop = isPartialSourceCrop(placement.sourceRect, sourceImg.width, sourceImg.height)
      const dataUrl = needsCrop
        ? await cropFn(sourceImg, placement.sourceRect)
        : sourceImg.dataUrl
      return placementToStudioLayer(sourceImg, placement, dataUrl)
    }),
  )

  for (const item of resolved) {
    if (item) layers.push(item)
  }

  if (layers.length === 0) {
    return {
      images: [
        {
          dataUrl: result.dataUrl,
          name: result.filename,
          width: result.width,
          height: result.height,
        },
      ],
      mode: 'canvas',
      slideWidth: result.width,
      slideHeight: result.height,
      background,
    }
  }

  return {
    mode: 'layers',
    slideWidth: result.width,
    slideHeight: result.height,
    background,
    layers,
    images: layers.map(({ dataUrl, name, width, height }) => ({
      dataUrl,
      name,
      width,
      height,
    })),
  }
}
