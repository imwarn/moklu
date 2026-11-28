/**
 * [INPUT]: depends on IdPhotoBackgroundPreset and IdPhotoSpecPreset types from ./idPhotoTypes
 * [OUTPUT]: exports ID_PHOTO_SPECS, ID_PHOTO_BACKGROUNDS, getOrderedIdPhotoSpecs, findIdPhotoSpec, and mmToPixels
 * [POS]: pure specification registry & physical-to-pixel dimension table for global passport, visa, exam, and resume ID photos in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { IdPhotoBackgroundPreset, IdPhotoSpecPreset } from './idPhotoTypes'

const MM_PER_INCH = 25.4

/**
 * Convert physical millimeter dimensions to integer pixels at the given DPI (defaults to 300 DPI).
 */
export function mmToPixels(mm: number, dpi = 300): number {
  const safeMm = Number.isFinite(mm) && mm > 0 ? mm : 1
  const safeDpi = Number.isFinite(dpi) && dpi > 0 ? dpi : 300
  return Math.max(1, Math.round((safeMm / MM_PER_INCH) * safeDpi))
}

/**
 * Standard official ID photo backdrop swatches plus a subtle studio resume gradient.
 */
export const ID_PHOTO_BACKGROUNDS: readonly IdPhotoBackgroundPreset[] = [
  { id: 'white', hex: '#FFFFFF', fill: '#FFFFFF' },
  { id: 'civil-blue', hex: '#438EDB', fill: '#438EDB' },
  { id: 'deep-blue', hex: '#2B6CB0', fill: '#2B6CB0' },
  { id: 'official-red', hex: '#D92B2B', fill: '#D92B2B' },
  { id: 'light-gray', hex: '#F3F4F6', fill: '#F3F4F6' },
  { id: 'studio-gray', hex: '#E5E7EB', fill: '#E5E7EB' },
  {
    id: 'resume-gradient',
    fill: {
      type: 'linear',
      angle: 180,
      stops: [
        { offset: 0, color: '#DBEAFE' },
        { offset: 1, color: '#EFF6FF' },
      ],
    },
  },
] as const

/**
 * Canonical 300 DPI ID photo preset catalog covering China, US, Schengen, UK, Japan, South Korea, and resume headshots.
 */
export const ID_PHOTO_SPECS: readonly IdPhotoSpecPreset[] = [
  {
    id: 'cn-1inch',
    category: 'china',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    recommendedBg: '#438EDB',
    allowedBgs: ['#438EDB', '#FFFFFF', '#D92B2B'],
    headRatioRange: [0.55, 0.68],
    topMarginRatio: 0.09,
    primaryLocales: ['zh'],
  },
  {
    id: 'cn-2inch',
    category: 'china',
    widthMm: 35,
    heightMm: 49,
    widthPx: 413,
    heightPx: 579,
    dpi: 300,
    recommendedBg: '#438EDB',
    allowedBgs: ['#438EDB', '#FFFFFF', '#D92B2B'],
    headRatioRange: [0.55, 0.68],
    topMarginRatio: 0.09,
    primaryLocales: ['zh'],
  },
  {
    id: 'cn-small-1inch',
    category: 'china',
    widthMm: 22,
    heightMm: 32,
    widthPx: 260,
    heightPx: 378,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF', '#438EDB'],
    headRatioRange: [0.55, 0.68],
    topMarginRatio: 0.09,
    primaryLocales: ['zh'],
  },
  {
    id: 'cn-exam',
    category: 'china',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    recommendedBg: '#438EDB',
    allowedBgs: ['#438EDB', '#FFFFFF', '#D92B2B'],
    recommendedMaxKb: 30,
    headRatioRange: [0.55, 0.68],
    topMarginRatio: 0.09,
    primaryLocales: ['zh'],
  },
  {
    id: 'cn-passport',
    category: 'passport-visa',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF'],
    headRatioRange: [0.58, 0.69],
    topMarginRatio: 0.08,
    primaryLocales: ['zh'],
  },
  {
    id: 'us-passport',
    category: 'passport-visa',
    widthMm: 51,
    heightMm: 51,
    widthPx: 600,
    heightPx: 600,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF'],
    recommendedMaxKb: 240,
    headRatioRange: [0.5, 0.69],
    topMarginRatio: 0.09,
    primaryLocales: ['en', 'zh', 'ja', 'ko'],
  },
  {
    id: 'schengen-visa',
    category: 'passport-visa',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF', '#F3F4F6'],
    headRatioRange: [0.7, 0.8],
    topMarginRatio: 0.08,
    primaryLocales: ['en', 'zh'],
  },
  {
    id: 'uk-passport',
    category: 'passport-visa',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    recommendedBg: '#F3F4F6',
    allowedBgs: ['#F3F4F6', '#E5E7EB'],
    headRatioRange: [0.64, 0.76],
    topMarginRatio: 0.09,
    primaryLocales: ['en'],
  },
  {
    id: 'jp-rirekisho',
    category: 'japan-korea',
    widthMm: 30,
    heightMm: 40,
    widthPx: 354,
    heightPx: 472,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF', '#438EDB', '#E5E7EB'],
    headRatioRange: [0.55, 0.68],
    topMarginRatio: 0.1,
    primaryLocales: ['ja'],
  },
  {
    id: 'jp-mynumber',
    category: 'japan-korea',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF', '#438EDB', '#F3F4F6'],
    headRatioRange: [0.7, 0.78],
    topMarginRatio: 0.09,
    primaryLocales: ['ja'],
  },
  {
    id: 'kr-passport',
    category: 'japan-korea',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF'],
    headRatioRange: [0.71, 0.8],
    topMarginRatio: 0.08,
    primaryLocales: ['ko'],
  },
  {
    id: 'kr-resume',
    category: 'japan-korea',
    widthMm: 30,
    heightMm: 40,
    widthPx: 354,
    heightPx: 472,
    dpi: 300,
    recommendedBg: '#FFFFFF',
    allowedBgs: ['#FFFFFF', '#E5E7EB', '#438EDB'],
    headRatioRange: [0.58, 0.7],
    topMarginRatio: 0.09,
    primaryLocales: ['ko'],
  },
  {
    id: 'resume-headshot',
    category: 'resume-custom',
    widthMm: 35,
    heightMm: 49,
    widthPx: 500,
    heightPx: 700,
    dpi: 300,
    recommendedBg: '#E5E7EB',
    allowedBgs: ['#E5E7EB', '#FFFFFF', '#438EDB', '#2B6CB0'],
    headRatioRange: [0.48, 0.62],
    topMarginRatio: 0.11,
    primaryLocales: ['en', 'zh', 'ja', 'ko'],
  },
] as const

/**
 * Return all ID photo presets ordered for the active UI locale:
 * presets whose primary target is `locale` appear first, followed by secondary matches, then global entries.
 */
export function getOrderedIdPhotoSpecs(locale: 'en' | 'zh' | 'ja' | 'ko'): IdPhotoSpecPreset[] {
  const primary: IdPhotoSpecPreset[] = []
  const secondary: IdPhotoSpecPreset[] = []
  const rest: IdPhotoSpecPreset[] = []

  for (const spec of ID_PHOTO_SPECS) {
    if (spec.primaryLocales[0] === locale) {
      primary.push(spec)
    } else if (spec.primaryLocales.includes(locale)) {
      secondary.push(spec)
    } else {
      rest.push(spec)
    }
  }

  return [...primary, ...secondary, ...rest]
}

/**
 * Look up a canonical ID photo specification by its stable preset ID.
 */
export function findIdPhotoSpec(id: string): IdPhotoSpecPreset | undefined {
  return ID_PHOTO_SPECS.find((spec) => spec.id === id)
}
