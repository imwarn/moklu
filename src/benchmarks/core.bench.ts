import { bench, describe } from 'vitest'
import type { Layer, SlideGroup, Template } from '@/types'
import { makeQuickLayers, getQuickMockupPlacement } from '@/utils/quickDesign'
import { getQuickPreviewGeometry } from '@/utils/quickPreview'
import { resizeCanvasLayers } from '@/utils/canvasResize'
import { renderBrowserFrame } from '@/assets/mockups/browser'
import { applyTemplateAppearance } from '@/utils/templateAppearance'
import { applyTemplateToCanvas } from '@/utils/templateSlots'

// Synthetic deterministic fixtures. No network, image decode, fonts or GPU.
// These microbenchmarks are useful for regression trends, not browser UX latency.
const makeScene = (): SlideGroup => {
  const base = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
  const phones: Layer[] = Array.from({ length: 48 }, (_, index) => ({
    ...base[1], id: `device-${index}`, name: `Device ${index}`,
    x: 20 + index * 4, y: 20 + index * 3,
  }))
  return {
    id: 'bench-scene', name: 'Benchmark Canvas',
    slideWidth: 1600, slideHeight: 900, numSlides: 1,
    slideNames: ['canvas'], layers: [base[0], ...phones],
  }
}
const source = makeScene()
const template: Template = {
  kind: 'template', schemaVersion: 1, id: 'bench-template',
  name: 'Benchmark appearance', description: 'Synthetic benchmark',
  slideGroups: [{
    name: 'Template',
    slideWidth: 1080, slideHeight: 1350,
    numSlides: 1, slideNames: ['style'],
    layers: makeQuickLayers([], 'portrait', 'midnight', 'iphone-16-pro'),
  }],
}

describe('Moklu core microbenchmarks (Node / CPU, non-gating)', () => {
  bench('Quick Design: generate editable layers', () => {
    makeQuickLayers(source.layers, 'square', 'warm', 'browser-safari', 'contain')
  })

  bench('Preview: calculate browser geometry', () => {
    getQuickPreviewGeometry('browser-chrome', 1600, 900)
    getQuickMockupPlacement('browser-chrome', 1600, 900)
  })

  bench('Browser frame: render escaped SVG chrome', () => {
    renderBrowserFrame('browser-chrome', {
      title: 'Moklu benchmark', address: 'https://moklu.app/?x=1&y=2',
      theme: 'dark', showAddressBar: true,
    })
  })

  bench('Canvas: uniformly fit 49 layers', () => {
    resizeCanvasLayers(source.layers, 1600, 900, 1080, 1920, 'fit')
  })

  bench('Template: appearance transfer across 49 layers', () => {
    applyTemplateAppearance(template, source, {
      background: true, frame: true, typography: true,
    })
  })

  bench('Template: rebind screenshot and preserve artboard', () => {
    applyTemplateToCanvas(template, source)
  })
})
