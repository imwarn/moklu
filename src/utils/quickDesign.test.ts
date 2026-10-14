import { describe, it, expect } from 'vitest'
import { makeQuickLayers, QUICK_SIZES } from './quickDesign'
import type { PhoneLayer } from '@/types'

describe('Moklu quick design', () => {
  it('offers independent landscape, square and portrait canvas presets', () => {
    expect(QUICK_SIZES.wide.width).toBe(1600)
    expect(QUICK_SIZES.square.width).toBe(QUICK_SIZES.square.height)
    expect(QUICK_SIZES.portrait.height).toBeGreaterThan(QUICK_SIZES.portrait.width)
  })

  it('preserves uploaded screenshots when switching templates and devices', () => {
    const initial = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    const browser = initial[1] as PhoneLayer
    browser.screenshotPath = 'user-screenshot.png'
    const changed = makeQuickLayers(initial, 'square', 'midnight', 'iphone-16-pro')
    expect((changed[1] as PhoneLayer).screenshotPath).toBe('user-screenshot.png')
    expect((changed[1] as PhoneLayer).model).toBe('iphone-16-pro')
    expect(changed[1].id).toBe(browser.id)
  })
})
