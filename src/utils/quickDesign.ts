/**
 * [INPUT]: depends on nanoid from nanoid; depends on BackgroundLayer, Layer, PhoneLayer, and PhoneModel from @/types; depends on getPhoneSpec from @/assets/mockups/specs; depends on getMockupCategory and MockupCategory from @/assets/mockups/registry
 * [OUTPUT]: exports QuickSize, QuickScreenshotFit, QuickTheme, QuickMockup, MockupCategory, QuickMockupOption, QUICK_SIZES, QUICK_THEMES, QUICK_MOCKUP_CATEGORIES, QUICK_MOCKUPS, getQuickMockupsByCategory, getQuickMockupPlacement, and makeQuickLayers
 * [POS]: Quick Workspace mockup size/theme/device preset registry (all 13 device & browser models) and layer builder in src/utils; consumed by quickPreview, QuickDesignModal, MockupQuickTool, and Studio handoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import type { BackgroundLayer, Layer, PhoneLayer, PhoneModel } from '@/types'
import { getPhoneSpec } from '@/assets/mockups/specs'
import { getMockupCategory, type MockupCategory } from '@/assets/mockups/registry'

export type { MockupCategory }

export type QuickSize = 'wide' | 'landscape' | 'square' | 'portrait' | 'story'
export type QuickScreenshotFit = PhoneLayer['screenshotFit']
export type QuickTheme = 'aurora' | 'midnight' | 'warm'
export type QuickMockup = PhoneModel

export interface QuickMockupOption {
  id: QuickMockup
  label: string
  category: MockupCategory
}

export const QUICK_SIZES: Record<QuickSize, { label: string; width: number; height: number }> = {
  wide: { label: '16:9 · Widescreen', width: 1600, height: 900 },
  landscape: { label: '16:10 · Landscape', width: 1600, height: 1000 },
  square: { label: '1:1 · Square', width: 1200, height: 1200 },
  portrait: { label: '4:5 · Portrait', width: 1080, height: 1350 },
  story: { label: '9:16 · Story', width: 1080, height: 1920 },
}

export const QUICK_THEMES: Record<QuickTheme, { label: string; top: string; bottom: string; glow: string }> = {
  aurora: { label: 'Soft Aurora', top: '#b5b0f2', bottom: '#e5efff', glow: '#f8d5e7' },
  midnight: { label: 'Midnight', top: '#101525', bottom: '#343b63', glow: '#9872c4' },
  warm: { label: 'Warm Paper', top: '#f9e7da', bottom: '#e9c9ad', glow: '#fff4d5' },
}

export const QUICK_MOCKUP_CATEGORIES: readonly MockupCategory[] = [
  'browser',
  'phone',
  'tablet',
  'watch',
  'screen',
]

export const QUICK_MOCKUPS: QuickMockupOption[] = [
  { id: 'browser-chrome', label: 'Chrome Browser', category: 'browser' },
  { id: 'browser-safari', label: 'Safari Browser', category: 'browser' },
  { id: 'browser-minimal', label: 'Minimal Window', category: 'browser' },
  { id: 'iphone-16-pro', label: 'iPhone 16 Pro', category: 'phone' },
  { id: 'iphone-16-pro-plain', label: 'iPhone 16 Pro (No Island)', category: 'phone' },
  { id: 'pixel-9', label: 'Google Pixel 9', category: 'phone' },
  { id: 'pixel-9-plain', label: 'Pixel 9 (No Camera)', category: 'phone' },
  { id: 'ipad-13', label: 'iPad', category: 'tablet' },
  { id: 'android-tablet', label: 'Android Tablet', category: 'tablet' },
  { id: 'apple-watch', label: 'Apple Watch', category: 'watch' },
  { id: 'wear-os', label: 'Wear OS', category: 'watch' },
  { id: 'screen-16-9', label: 'Frameless 16:9', category: 'screen' },
  { id: 'screen-16-10', label: 'Frameless 16:10', category: 'screen' },
]

export function getQuickMockupsByCategory(category: MockupCategory): QuickMockupOption[] {
  return QUICK_MOCKUPS.filter((item) => item.category === category)
}

const CATEGORY_FIT_POLICY: Record<MockupCategory, { fitWidth: number; fitHeight: number; maxScale: number }> = {
  browser: { fitWidth: 0.85, fitHeight: 0.75, maxScale: 1.5 },
  phone: { fitWidth: 0.66, fitHeight: 0.78, maxScale: 1.5 },
  tablet: { fitWidth: 0.76, fitHeight: 0.8, maxScale: 1.8 },
  watch: { fitWidth: 0.56, fitHeight: 0.64, maxScale: 1.4 },
  screen: { fitWidth: 0.86, fitHeight: 0.8, maxScale: 1.5 },
}

/** Fit any device or browser mockup cleanly inside an arbitrary canvas without platform-format projection. */
export function getQuickMockupPlacement(model: QuickMockup, width: number, height: number) {
  const spec = getPhoneSpec(model)
  const category = getMockupCategory(model)
  const { fitWidth, fitHeight, maxScale } = CATEGORY_FIT_POLICY[category]
  const scale = Math.min((width * fitWidth) / spec.frameWidth, (height * fitHeight) / spec.frameHeight, maxScale)
  return {
    scale,
    x: Math.round((width - spec.frameWidth * scale) / 2),
    y: Math.round((height - spec.frameHeight * scale) / 2),
  }
}

/**
 * Create an editable, single-canvas quick mockup from existing layers.
 * The primary screenshot stays attached when switching visual themes or frames.
 * The result intentionally contains no immutable flattened preview.
 */
export function makeQuickLayers(
  oldLayers: Layer[],
  size: QuickSize,
  theme: QuickTheme,
  mockup: QuickMockup,
  screenshotFit: QuickScreenshotFit = 'cover',
): Layer[] {
  const { width, height } = QUICK_SIZES[size]
  const palette = QUICK_THEMES[theme]
  const previousBackground = oldLayers.find((layer): layer is BackgroundLayer => layer.type === 'background')
  const oldMockup = oldLayers.find((layer): layer is PhoneLayer => layer.type === 'phone')
  const oldImage = oldLayers.find((layer) => layer.type === 'image')
  const isBrowser = mockup.startsWith('browser-')
  const spec = getPhoneSpec(mockup)
  const placement = getQuickMockupPlacement(mockup, width, height)

  const background: BackgroundLayer = {
    id: previousBackground?.id ?? nanoid(10),
    name: 'Background',
    type: 'background',
    x: 0, y: 0, rotation: 0, visible: true, locked: true, opacity: 1,
    fill: {
      type: 'linear',
      angle: 135,
      stops: [
        { offset: 0, color: palette.top },
        { offset: 1, color: palette.bottom },
      ],
    },
    accents: [{ color: palette.glow, opacity: 0.46, cx: 60, cy: 38, rx: width * 0.46, ry: height * 0.48, blur: 70 }],
    noise: theme === 'warm' ? 0.045 : 0.015,
  }

  const model: PhoneLayer = {
    id: oldMockup?.id ?? nanoid(10),
    name: isBrowser ? 'Browser Mockup' : 'Device Mockup',
    type: 'phone',
    ...placement,
    model: mockup,
    templateSlot: 'primary-screenshot',
    ...(oldMockup?.browserChrome ? { browserChrome: { ...oldMockup.browserChrome } } : {}),
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    screenshotPath: oldMockup?.screenshotPath ?? (oldImage?.type === 'image' ? oldImage.src : undefined),
    screenshotDataUrl: oldMockup?.screenshotDataUrl,
    screenshotFit,
    screenshotOffsetX: 0,
    screenshotOffsetY: 0,
    showStatusBar: spec.statusBar.height > 0 && !isBrowser,
    ...(oldMockup?.localeContent ? { localeContent: oldMockup.localeContent } : {}),
    shadow: {
      color: '#111827',
      opacity: theme === 'midnight' ? 0.5 : 0.24,
      blur: 44,
      offsetX: 0,
      offsetY: 28,
    },
  }

  return [background, model]
}
