/**
 * [INPUT]: depends on Layer from @/types and scaleLayerToCanvas from @/utils/canvasFormats
 * [OUTPUT]: exports CanvasResizeMode, CANVAS_PRESETS, validateCanvasDimensions, and resizeCanvasLayers
 * [POS]: authoring canvas dimension presets, validation, and layer recenter/fit resizer in src/utils; consumed by store resize actions and canvas settings UI
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Layer } from '@/types'
import { scaleLayerToCanvas } from '@/utils/canvasFormats'

export type CanvasResizeMode = 'center' | 'fit'

/** Separate from multi-format export presets; an authoring canvas can be any ratio. */
export const CANVAS_PRESETS = [
  { id: '16:9', label: 'Widescreen', width: 1600, height: 900 },
  { id: '16:10', label: 'Landscape', width: 1600, height: 1000 },
  { id: '1:1', label: 'Square', width: 1200, height: 1200 },
  { id: '4:5', label: 'Portrait', width: 1080, height: 1350 },
  { id: '9:16', label: 'Story', width: 1080, height: 1920 },
] as const

export function validateCanvasDimensions(width: number, height: number): string | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 240 || height < 240 || width > 4096 || height > 4096 ||
      width * height > 16_777_216) {
    return 'Width and height must be whole numbers from 240 to 4096 (16 MP maximum).'
  }
  return null
}

/**
 * Resize a single authored canvas WITHOUT replacing or flattening any layer.
 * Backgrounds stretch with the artboard; all other layers keep their identities,
 * content, screenshots, locale data and visibility.
 *
 * center: preserve object dimensions and move their anchors by half the delta.
 * fit: uniformly scale content into the new canvas with centre anchoring.
 */
export function resizeCanvasLayers(
  layers: Layer[],
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
  mode: CanvasResizeMode = 'center',
): Layer[] {
  const dx = (toWidth - fromWidth) / 2
  const dy = (toHeight - fromHeight) / 2
  const s = Math.min(toWidth / fromWidth, toHeight / fromHeight)

  return layers.map((layer) => {
    if (layer.type === 'background') {
      return {
        ...layer,
        x: 0,
        y: 0,
        accents: layer.accents.map((accent) => ({
          ...accent,
          rx: accent.rx * toWidth / fromWidth,
          ry: accent.ry * toHeight / fromHeight,
        })),
      }
    }

    if (mode === 'fit') {
      return scaleLayerToCanvas(layer, fromWidth, fromHeight, toWidth, toHeight, s)
    }

    // Group children use coordinates relative to their parent. Move the parent
    // without changing its descendants to preserve all local editing geometry.
    return { ...layer, x: layer.x + dx, y: layer.y + dy }
  })
}
