import { describe, expect, it } from 'vitest'
import type { Template } from '@/types'
import { makeQuickLayers } from '@/utils/quickDesign'
import { applyTemplateToCanvas, findScreenshotTarget } from './templateSlots'

const sourceCanvas = () => {
  const layers = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
  if (layers[1].type !== 'phone') throw new Error('missing mockup')
  layers[1].screenshotPath = 'screenshot-A.png'
  layers[1].screenshotDataUrl = 'data:image/png;base64,ZmFrZQ=='
  return {
    id: 'canvas-1', name: 'Current', numSlides: 1, slideWidth: 1600,
    slideHeight: 900, slideNames: ['moklu'], layers,
  } as import('@/types').SlideGroup
}

const sampleTemplate = (source: import('@/types').SlideGroup): Template => ({
  id: 't1', name: 'Test', description: 'Test style', kind: 'template',
  schemaVersion: 1, slideGroups: [{
    name: 'Demo', numSlides: 1, slideWidth: 1080, slideHeight: 1920,
    slideNames: ['slide-01'], layers: makeQuickLayers([], 'portrait', 'warm', 'iphone-16-pro'),
  }],
})

describe('template slots', () => {
  it('uses the explicit primary screenshot slot', () => {
    const layers = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    expect(findScreenshotTarget(layers)?.type).toBe('phone')
  })
  it('maps a template to current dimensions, retaining screenshot reference', () => {
    const original = sourceCanvas()
    const oldPhone = findScreenshotTarget(original.layers)
    const template = sampleTemplate(original)
    const result = applyTemplateToCanvas(template, original)
    const target = findScreenshotTarget(result.layers)
    expect(target?.screenshotPath).toBe('screenshot-A.png')
    expect(target?.screenshotDataUrl).toBe('data:image/png;base64,ZmFrZQ==')
    expect(target?.model).toBe('iphone-16-pro')
    expect(target?.templateSlot).toBe('primary-screenshot')
    expect(target?.id).not.toBe(oldPhone?.id)
    expect(original.slideWidth).toBe(1600)
    expect(oldPhone?.model).toBe('browser-chrome')
    expect(target?.x).toBeGreaterThanOrEqual(0)
  })
  it('rejects panoramic targets without mutating them', () => {
    const original = { ...sourceCanvas(), numSlides: 2 }
    expect(() => applyTemplateToCanvas(sampleTemplate(original), original)).toThrow('single-slide')
  })
})
