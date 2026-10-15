import { describe, expect, it } from 'vitest'
import { getPhoneSpec } from '@/assets/mockups/specs'
import { getQuickMockupPlacement } from './quickDesign'
import { getQuickPreviewGeometry, makeSvgImageDataUrl, screenshotPreserveAspectRatio } from './quickPreview'

describe('Quick Design live preview geometry', () => {
  it.each([
    ['browser-chrome', 1600, 900],
    ['browser-safari', 1200, 1200],
    ['browser-minimal', 1080, 1350],
    ['iphone-16-pro', 1080, 1350],
    ['pixel-9', 1600, 1000],
  ] as const)('uses exact Quick Design placement for %s at %dx%d', (model, width, height) => {
    const p = getQuickMockupPlacement(model, width, height)
    const spec = getPhoneSpec(model)
    const preview = getQuickPreviewGeometry(model, width, height)
    expect(preview.frameX).toBe(p.x)
    expect(preview.frameY).toBe(p.y)
    expect(preview.scale).toBe(p.scale)
    expect(preview.frameWidth).toBeCloseTo(spec.frameWidth * p.scale)
    expect(preview.frameHeight).toBeCloseTo(spec.frameHeight * p.scale)
    expect(preview.screenX).toBeCloseTo(p.x + spec.screen.x * p.scale)
    expect(preview.screenY).toBeCloseTo(p.y + spec.screen.y * p.scale)
    expect(preview.screenWidth).toBeCloseTo(spec.screen.width * p.scale)
    expect(preview.screenHeight).toBeCloseTo(spec.screen.height * p.scale)
    expect(preview.frameX).toBeGreaterThanOrEqual(0)
    expect(preview.frameY).toBeGreaterThanOrEqual(0)
  })

  it('keeps cover/contain/stretch consistent with the Konva editor', () => {
    expect(screenshotPreserveAspectRatio('cover')).toBe('xMidYMid slice')
    expect(screenshotPreserveAspectRatio('contain')).toBe('xMidYMid meet')
    expect(screenshotPreserveAspectRatio('fill')).toBe('none')
  })

  it('embeds the registered SVG as a local encoded image, not an HTTP request', () => {
    const data = makeSvgImageDataUrl('<svg><text>A & B</text></svg>')
    expect(data.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(data).toContain('%26')
    expect(data).not.toContain('<text>')
  })
})
