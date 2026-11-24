/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, quickDesign exports, PHONE_MODELS and getPhoneSpec from @/assets/mockups/specs, QuickDesignPreview from @/components/panels/QuickDesignPreview, and PhoneLayer from @/types
 * [OUTPUT]: verifies all 13 device & browser quick mockups, category grouping, placement centering across all QuickSizes, screenshot preservation, and QuickDesignPreview modal vs workspace variants
 * [POS]: Unit test suite for src/utils/quickDesign.ts and QuickDesignPreview variant behavior
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { PHONE_MODELS, getPhoneSpec } from '@/assets/mockups/specs'
import { QuickDesignPreview } from '@/components/panels/QuickDesignPreview'
import {
  getQuickMockupPlacement,
  getQuickMockupsByCategory,
  makeQuickLayers,
  QUICK_MOCKUP_CATEGORIES,
  QUICK_MOCKUPS,
  QUICK_SIZES,
  type QuickSize,
} from './quickDesign'
import type { PhoneLayer } from '@/types'

describe('Moklu quick design', () => {
  it('offers independent landscape, square and portrait canvas presets', () => {
    expect(QUICK_SIZES.wide.width).toBe(1600)
    expect(QUICK_SIZES.square.width).toBe(QUICK_SIZES.square.height)
    expect(QUICK_SIZES.portrait.height).toBeGreaterThan(QUICK_SIZES.portrait.width)
    expect(QUICK_SIZES.story.width).toBe(1080)
    expect(QUICK_SIZES.story.height).toBe(1920)
  })

  it('exposes all 13 device and browser mockups grouped into 5 categories', () => {
    expect(QUICK_MOCKUPS).toHaveLength(13)
    expect(QUICK_MOCKUP_CATEGORIES).toEqual(['browser', 'phone', 'tablet', 'watch', 'screen'])

    const allQuickIds = new Set(QUICK_MOCKUPS.map((item) => item.id))
    const allPhoneModelIds = new Set(PHONE_MODELS.map((spec) => spec.id))
    expect(allQuickIds).toEqual(allPhoneModelIds)

    const byCategoryTotal = QUICK_MOCKUP_CATEGORIES.reduce(
      (sum, category) => sum + getQuickMockupsByCategory(category).length,
      0,
    )
    expect(byCategoryTotal).toBe(13)
    expect(getQuickMockupsByCategory('browser').map((m) => m.id)).toEqual([
      'browser-chrome',
      'browser-safari',
      'browser-minimal',
    ])
    expect(getQuickMockupsByCategory('phone').map((m) => m.id)).toEqual([
      'iphone-16-pro',
      'iphone-16-pro-plain',
      'pixel-9',
      'pixel-9-plain',
    ])
    expect(getQuickMockupsByCategory('tablet').map((m) => m.id)).toEqual([
      'ipad-13',
      'android-tablet',
    ])
    expect(getQuickMockupsByCategory('watch').map((m) => m.id)).toEqual([
      'apple-watch',
      'wear-os',
    ])
    expect(getQuickMockupsByCategory('screen').map((m) => m.id)).toEqual([
      'screen-16-9',
      'screen-16-10',
    ])
  })

  it('centers and scales all 13 mockups cleanly across every QuickSize without clipping', () => {
    const sizes = Object.entries(QUICK_SIZES) as Array<[QuickSize, { width: number; height: number }]>
    for (const mockup of QUICK_MOCKUPS) {
      const spec = getPhoneSpec(mockup.id)
      for (const [, dims] of sizes) {
        const placement = getQuickMockupPlacement(mockup.id, dims.width, dims.height)
        const renderedW = spec.frameWidth * placement.scale
        const renderedH = spec.frameHeight * placement.scale
        expect(placement.scale).toBeGreaterThan(0)
        expect(placement.x).toBeGreaterThan(0)
        expect(placement.y).toBeGreaterThan(0)
        expect(placement.x + renderedW).toBeLessThanOrEqual(dims.width + 1)
        expect(placement.y + renderedH).toBeLessThanOrEqual(dims.height + 1)
        // Symmetrically centered within 1px rounding tolerance
        expect(Math.abs(placement.x - (dims.width - (placement.x + renderedW)))).toBeLessThanOrEqual(2)
        expect(Math.abs(placement.y - (dims.height - (placement.y + renderedH)))).toBeLessThanOrEqual(2)
      }
    }
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

    const frameless = makeQuickLayers(next, 'wide', 'midnight', 'screen-16-9', 'cover')
    expect(frameless[1].type === 'phone' && frameless[1].showStatusBar).toBe(false)
    const watch = makeQuickLayers(next, 'square', 'aurora', 'apple-watch', 'cover')
    expect(watch[1].type === 'phone' && watch[1].showStatusBar).toBe(false)
  })

  it('preserves uploaded screenshots when switching templates and devices', () => {
    const initial = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
    const browser = initial[1] as PhoneLayer
    browser.screenshotPath = 'user-screenshot.png'
    browser.browserChrome = { title: 'My portfolio', address: 'https://moklu.app', theme: 'dark', showAddressBar: true }
    const changed = makeQuickLayers(initial, 'square', 'midnight', 'ipad-13')
    expect((changed[1] as PhoneLayer).screenshotPath).toBe('user-screenshot.png')
    expect((changed[1] as PhoneLayer).model).toBe('ipad-13')
    expect(changed[1].id).toBe(browser.id)
    expect((changed[1] as PhoneLayer).browserChrome?.title).toBe('My portfolio')
    expect((changed[1] as PhoneLayer).browserChrome?.address).toBe('https://moklu.app')
  })

  it('renders QuickDesignPreview modal variant by default and strips misleading copy in workspace variant', () => {
    const modalHtml = renderToStaticMarkup(
      createElement(QuickDesignPreview, {
        width: 1600,
        height: 900,
        theme: 'aurora',
        mockup: 'screen-16-9',
      }),
    )
    expect(modalHtml).toContain('4. Live preview')
    expect(modalHtml).toContain('lightweight preview')
    expect(modalHtml).toContain('h-[225px]')

    const workspaceHtml = renderToStaticMarkup(
      createElement(QuickDesignPreview, {
        width: 1600,
        height: 900,
        theme: 'aurora',
        mockup: 'apple-watch',
        variant: 'workspace',
      }),
    )
    expect(workspaceHtml).not.toContain('4. Live preview')
    expect(workspaceHtml).not.toContain('lightweight preview')
    expect(workspaceHtml).not.toContain('Updates as you choose a frame')
    expect(workspaceHtml).toContain('h-[280px] sm:h-[340px]')
    expect(workspaceHtml).toContain('<svg')
  })
})
