import type { Layer, PhoneLayer, ProjectSettings, SlideGroup, Template, TextLayer } from '@/types'
import { forEachLayerTree, mapLayerTree } from '@/utils/layerTree'
import { applyTemplate } from '@/utils/templates'
import { findScreenshotTarget } from '@/utils/templateSlots'

export type TemplateApplyMode = 'layout' | 'appearance'

/** Each style family can be opted into independently without touching content. */
export interface TemplateAppearanceParts {
  background: boolean
  frame: boolean
  typography: boolean
}

export const DEFAULT_APPEARANCE_PARTS: Readonly<TemplateAppearanceParts> = {
  background: true,
  frame: true,
  typography: true,
}


/**
 * Apply only a template's appearance, not its layout.
 *
 * We keep the destination artboard, all layer IDs, transforms, screenshots,
 * localized content, overlay text and inserted images exactly as authored.
 * Template styling affects backdrop, frame shadow/border and text typography.
 */
export function applyTemplateAppearance(
  template: Template,
  destination: SlideGroup,
  parts: TemplateAppearanceParts = DEFAULT_APPEARANCE_PARTS,
): {
  layers: Layer[]
  settings?: Partial<ProjectSettings>
  selectedLayerId: string | null
} {
  if (destination.numSlides !== 1) throw new Error('Style only supports single-slide artboards.')
  if (!parts.background && !parts.frame && !parts.typography) {
    throw new Error('Select at least one appearance option.')
  }

  const { slideGroups, settings } = applyTemplate(template)
  const source = slideGroups.find((g) => g.layers.some((l) => l.type === 'background')) ?? slideGroups[0]
  if (!source) throw new Error('This template does not contain a slide.')
  if (source.numSlides !== 1) throw new Error('Panoramic templates cannot be applied as a single-canvas style.')

  const templateBackgrounds: Extract<Layer, { type: 'background' }>[] = []
  const templatePhones: PhoneLayer[] = []
  const templateTexts: TextLayer[] = []
  forEachLayerTree(source.layers, (layer) => {
    if (layer.type === 'background') templateBackgrounds.push(layer)
    if (layer.type === 'phone') templatePhones.push(layer)
    if (layer.type === 'text') templateTexts.push(layer)
  })
  const templateBackground = templateBackgrounds[0]
  const templatePrimaryPhone = findScreenshotTarget(source.layers) ?? templatePhones[0]
  let textIndex = 0
  const sx = destination.slideWidth / source.slideWidth
  const sy = destination.slideHeight / source.slideHeight

  const layers = mapLayerTree(destination.layers, (layer): Layer => {
    if (parts.background && layer.type === 'background' && templateBackground) {
      return {
        ...layer,
        fill: structuredClone(templateBackground.fill),
        accents: templateBackground.accents.map((accent) => ({
          ...accent, rx: accent.rx * sx, ry: accent.ry * sy,
        })),
        noise: templateBackground.noise,
        // Preserve any existing user-uploaded background image.
        // Such an image may obscure the new fill until removed by the user.
      }
    }
    if (parts.frame && layer.type === 'phone' && templatePrimaryPhone) {
      return {
        ...layer,
        shadow: templatePrimaryPhone.shadow ? structuredClone(templatePrimaryPhone.shadow) : layer.shadow,
        border: templatePrimaryPhone.border ? structuredClone(templatePrimaryPhone.border) : layer.border,
      }
    }
    if (parts.typography && layer.type === 'text' && templateTexts.length) {
      // Adopt typography without replacing content, rich-text ranges or geometry.
      const sample = templateTexts[Math.min(textIndex++, templateTexts.length - 1)]
      return {
        ...layer,
        fill: structuredClone(sample.fill),
        fontFamily: sample.fontFamily,
        fontWeight: sample.fontWeight,
        italic: sample.italic,
      }
    }
    return layer
  })

  return { layers, settings, selectedLayerId: null }
}
