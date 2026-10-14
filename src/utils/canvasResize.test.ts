import { describe, expect, it } from 'vitest'
import { makeQuickLayers } from './quickDesign'
import { resizeCanvasLayers, validateCanvasDimensions } from './canvasResize'

describe('authoring canvas resize', () => {
  it('rejects invalid dimensions', () => {
    expect(validateCanvasDimensions(0, 900)).not.toBeNull()
    expect(validateCanvasDimensions(1024.5, 1024)).not.toBeNull()
    expect(validateCanvasDimensions(9000, 9000)).not.toBeNull()
    expect(validateCanvasDimensions(1200, 1200)).toBeNull()
  })

  it('preserves screenshot, model, ids and size in center mode', () => {
    const layers = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    const original = layers[1]
    if (original.type !== 'phone') throw new Error('Expected phone layer')
    original.screenshotPath = 'my-screenshot.webp'
    const result = resizeCanvasLayers(layers, 1600, 900, 1200, 1200)
    const resized = result[1]
    if (resized.type !== 'phone') throw new Error('Expected phone layer')
    expect(resized.id).toBe(original.id)
    expect(resized.model).toBe(original.model)
    expect(resized.screenshotPath).toBe('my-screenshot.webp'
    )
    expect(resized.x).toBe(original.x - 200)
    expect(resized.y).toBe(original.y + 150)
    expect(resized.scale).toBe(original.scale)
    expect(original.x).not.toBe(resized.x)
    expect(result[0].type).toBe('background')
  })

  it('fits layers uniformly and does not mutate the originals', () => {
    const layers = makeQuickLayers([], 'landscape', 'warm', 'browser-safari')
    const phone = layers[1]
    if (phone.type !== 'phone') throw new Error('Expected phone')
    const originalScale = phone.scale
    const resized = resizeCanvasLayers(layers, 1600, 1000, 1200, 1200, 'fit')
    if (resized[1].type !== 'phone') throw new Error('Expected resized phone')
    expect(resized[1].scale).toBeCloseTo(originalScale * 0.75)
    expect(phone.scale).toBe(originalScale)
    expect(resized[1].id).toBe(phone.id)
  })
})
