/**
 * [INPUT]: depends on Layer, PhoneLayer, SlideGroup, Template, and ProjectSettings from @/types; depends on forEachLayerTree and mapLayerTree from @/utils/layerTree, scaleLayerToCanvas from @/utils/canvasFormats, and applyTemplate from @/utils/templates
 * [OUTPUT]: exports ScreenshotBinding, findScreenshotTarget, and applyTemplateToCanvas
 * [POS]: slot-preserving template application helper in src/utils; maps template layers onto the active canvas size while rebinding existing user screenshots
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Layer, PhoneLayer, SlideGroup, Template, ProjectSettings } from '@/types'
import { forEachLayerTree, mapLayerTree } from '@/utils/layerTree'
import { scaleLayerToCanvas } from '@/utils/canvasFormats'
import { applyTemplate } from '@/utils/templates'

export type ScreenshotBinding = Pick<PhoneLayer, 'screenshotPath' | 'screenshotDataUrl' | 'localeContent'>

export function findScreenshotTarget(layers: Layer[]): PhoneLayer | undefined {
  let primary: PhoneLayer | undefined
  let fallback: PhoneLayer | undefined
  forEachLayerTree(layers, (layer) => {
    if (layer.type !== 'phone') return
    if (layer.templateSlot === 'primary-screenshot') primary ??= layer
    fallback ??= layer
  })
  return primary ?? fallback
}

function findSourceScreenshot(layers: Layer[]): PhoneLayer | undefined {
  const candidates: PhoneLayer[] = []
  forEachLayerTree(layers, (layer) => {
    if (layer.type === 'phone' && (layer.screenshotPath || layer.screenshotDataUrl)) candidates.push(layer)
  })
  return candidates.find((l) => l.templateSlot === 'primary-screenshot') ?? candidates[0]
}

/**
 * Bake a template's first slide into an existing independent artboard.
 * Preserve its own size, id, source image asset reference and locale payload.
 * The returned layers are new, editable objects; source and template are unchanged.
 */
export function applyTemplateToCanvas(template: Template, destination: SlideGroup): {
  layers: Layer[]
  settings?: Partial<ProjectSettings>
  selectedLayerId: string | null
} {
  if (destination.numSlides !== 1) {
    throw new Error('Apply to current canvas supports only single-slide artboards.')
  }
  const { slideGroups, settings } = applyTemplate(template)
  const source = slideGroups.find((group) => group.layers.some((l) => l.type === 'phone' || (l.type === 'group' && l.children.length > 0))) ?? slideGroups[0]
  if (!source) throw new Error('This template does not contain a slide.')
  if (source.numSlides !== 1) throw new Error('This template uses a panoramic slide; please add it as slides instead.')

  const sx = destination.slideWidth / source.slideWidth
  const sy = destination.slideHeight / source.slideHeight
  const layers = source.layers.map((layer) => {
    if (layer.type === 'background') {
      return { ...layer, x: 0, y: 0, accents: layer.accents.map((accent) => ({
        ...accent, rx: accent.rx * sx, ry: accent.ry * sy,
      })) }
    }
    return scaleLayerToCanvas(layer, source.slideWidth, source.slideHeight,
      destination.slideWidth, destination.slideHeight)
  })

  const previousScreenshot = findSourceScreenshot(destination.layers)
  // Explicit primary slot wins; legacy templates map to the first device.
  const target = findScreenshotTarget(layers)
  const rebound = target ? mapLayerTree(layers, (layer): Layer => {
    if (layer.type !== 'phone' || layer.id !== target.id) return layer
    return {
      ...layer,
      templateSlot: 'primary-screenshot',
      ...(previousScreenshot ? {
        screenshotPath: previousScreenshot.screenshotPath,
        screenshotDataUrl: previousScreenshot.screenshotDataUrl,
        screenshotFit: previousScreenshot.screenshotFit,
        // User-authored browser labels survive layout/style switches.
        browserChrome: previousScreenshot.browserChrome
          ? { ...previousScreenshot.browserChrome }
          : layer.browserChrome,
        localeContent: previousScreenshot.localeContent
          ? structuredClone(previousScreenshot.localeContent)
          : layer.localeContent,
      } : {}),
    }
  }) : layers

  return { layers: rebound, settings, selectedLayerId: target?.id ?? null }
}
