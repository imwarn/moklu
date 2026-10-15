import { describe, it, expect } from 'vitest'
import { getQuickMockupPlacement, makeQuickLayers, QUICK_SIZES } from './quickDesign'
import type { PhoneLayer } from '@/types'

describe('Moklu quick design', () => {
  it('offers independent landscape, square and portrait canvas presets', () => {
    expect(QUICK_SIZES.wide.width).toBe(1600)
    expect(QUICK_SIZES.square.width).toBe(QUICK_SIZES.square.height)
    expect(QUICK_SIZES.portrait.height).toBeGreaterThan(QUICK_SIZES.portrait.width)
    expect(QUICK_SIZES.story.width).toBe(1080)
    expect(QUICK_SIZES.story.height).toBe(1920)
  })

  it('keeps arbitrary canvas mockups centered without exceeding safe dimensions', () => {
    const custom = getQuickMockupPlacement('browser-chrome', 1440, 900)
    expect(custom.x).toBeGreaterThan(0)
    expect(custom.y).toBeGreaterThan(0)
    expect(custom.scale * 1200).toBeLessThanOrEqual(1440 * 0.85 + 1)
  })

  it('saves the chosen screenshot fit without mutating existing data', () => {
    const original = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    const next = makeQuickLayers(original, 'story', 'warm', 'iphone-16-pro', 'contain')
    expect(next[1].type === 'phone' && next[1].screenshotFit).toBe('contain')
    expect(original[1].type === 'phone' && original[1].screenshotFit).toBe('cover')
    const stretch = makeQuickLayers(next, 'square', 'warm', 'browser-safari', 'fill')
    expect(stretch[1].type === 'phone' && stretch[1].screenshotFit).toBe('fill')
  })

  it('preserves uploaded screenshots when switching templates and devices', () => {
    const initial = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    const browser = initial[1] as PhoneLayer
    browser.screenshotPath = 'user-screenshot.png'
    browser.browserChrome = { title: 'My portfolio', address: 'https://moklu.app', theme: 'dark', showAddressBar: true }
    const changed = makeQuickLayers(initial, 'square', 'midnight', 'iphone-16-pro')
    expect((changed[1] as PhoneLayer).screenshotPath).toBe('user-screenshot.png')
    expect((changed[1] as PhoneLayer).model).toBe('iphone-16-pro')
    expect(changed[1].id).toBe(browser.id)
    expect((changed[1] as PhoneLayer).browserChrome?.title).toBe('My portfolio')
    expect((changed[1] as PhoneLayer).browserChrome?.address).toBe('https://moklu.app')
  })
})
