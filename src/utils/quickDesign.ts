import { nanoid } from 'nanoid'
import type { BackgroundLayer, Layer, PhoneLayer, PhoneModel } from '@/types'
import { getPhoneSpec } from '@/assets/mockups/specs'

export type QuickSize = 'wide' | 'landscape' | 'square' | 'portrait'
export type QuickTheme = 'aurora' | 'midnight' | 'warm'
export type QuickMockup = Extract<PhoneModel, 'browser-chrome' | 'browser-safari' | 'browser-minimal' | 'iphone-16-pro' | 'pixel-9'>

export const QUICK_SIZES: Record<QuickSize, { label: string; width: number; height: number }> = {
  wide: { label: '16:9 · Widescreen', width: 1600, height: 900 },
  landscape: { label: '16:10 · Landscape', width: 1600, height: 1000 },
  square: { label: '1:1 · Square', width: 1200, height: 1200 },
  portrait: { label: '4:5 · Portrait', width: 1080, height: 1350 },
}

export const QUICK_THEMES: Record<QuickTheme, { label: string; top: string; bottom: string; glow: string }> = {
  aurora: { label: 'Soft Aurora', top: '#b5b0f2', bottom: '#e5efff', glow: '#f8d5e7' },
  midnight: { label: 'Midnight', top: '#101525', bottom: '#343b63', glow: '#9872c4' },
  warm: { label: 'Warm Paper', top: '#f9e7da', bottom: '#e9c9ad', glow: '#fff4d5' },
}

export const QUICK_MOCKUPS: { id: QuickMockup; label: string }[] = [
  { id: 'browser-chrome', label: 'Chrome Browser' },
  { id: 'browser-safari', label: 'Safari Browser' },
  { id: 'browser-minimal', label: 'Minimal Window' },
  { id: 'iphone-16-pro', label: 'iPhone 16 Pro' },
  { id: 'pixel-9', label: 'Google Pixel 9' },
]

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
): Layer[] {
  const { width, height } = QUICK_SIZES[size]
  const palette = QUICK_THEMES[theme]
  const previousBackground = oldLayers.find((layer): layer is BackgroundLayer => layer.type === 'background')
  const oldMockup = oldLayers.find((layer): layer is PhoneLayer => layer.type === 'phone')
  const oldImage = oldLayers.find((layer) => layer.type === 'image')
  const spec = getPhoneSpec(mockup)
  const isBrowser = mockup.startsWith('browser-')
  const fitWidth = isBrowser ? 0.85 : 0.66
  const fitHeight = isBrowser ? 0.75 : 0.78
  const scale = Math.min(width * fitWidth / spec.frameWidth, height * fitHeight / spec.frameHeight, 1.5)
  const frameWidth = spec.frameWidth * scale
  const frameHeight = spec.frameHeight * scale

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
    x: Math.round((width - frameWidth) / 2),
    y: Math.round((height - frameHeight) / 2),
    scale,
    model: mockup,
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    screenshotPath: oldMockup?.screenshotPath ?? (oldImage?.type === 'image' ? oldImage.src : undefined),
    screenshotDataUrl: oldMockup?.screenshotDataUrl,
    screenshotFit: 'cover',
    screenshotOffsetX: 0,
    screenshotOffsetY: 0,
    showStatusBar: !isBrowser,
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
