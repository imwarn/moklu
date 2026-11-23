/**
 * [INPUT]: depends on GradientStop, LinearGradient, RadialGradient from @/types and isBrandToken from @/utils/brandColors
 * [OUTPUT]: exports color normalization, gradient stop math helpers, GRADIENT_PRESETS, and SOLID_PRESETS
 * [POS]: pure color and gradient utility module extracted from PropertyControls.tsx inside src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { GradientStop, LinearGradient, RadialGradient } from '@/types'
import { isBrandToken } from '@/utils/brandColors'

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

export function normalizeHexColor(value: string, fallback = '#ffffff') {
  const raw = value.trim()
  const withHash = raw.startsWith('#') ? raw : `#${raw}`
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  const rgbMatch = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (rgbMatch) {
    return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]))
  }
  return fallback.toUpperCase()
}

function hexToRgb(hex: string) {
  const safe = normalizeHexColor(hex)
  return {
    r: Number.parseInt(safe.slice(1, 3), 16),
    g: Number.parseInt(safe.slice(3, 5), 16),
    b: Number.parseInt(safe.slice(5, 7), 16),
  }
}

function interpolateHex(from: string, to: string, t: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  )
}

export function sortStops(stops: GradientStop[]) {
  return [...stops].sort((a, b) => a.offset - b.offset)
}

export function colorAtOffset(stops: GradientStop[], offset: number) {
  const sorted = sortStops(stops)
  const safeOffset = clamp(offset, 0, 1)
  if (safeOffset <= sorted[0].offset) return normalizeHexColor(sorted[0].color)
  if (safeOffset >= sorted[sorted.length - 1].offset) return normalizeHexColor(sorted[sorted.length - 1].color)

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const left = sorted[i]
    const right = sorted[i + 1]
    if (safeOffset >= left.offset && safeOffset <= right.offset) {
      const span = right.offset - left.offset || 1
      const t = (safeOffset - left.offset) / span
      return interpolateHex(left.color, right.color, t)
    }
  }

  return normalizeHexColor(sorted[0].color)
}

export function createLinearGradient(base = '#FFFFFF'): LinearGradient {
  return {
    type: 'linear',
    angle: 135,
    stops: [
      { offset: 0, color: normalizeHexColor(base) },
      { offset: 1, color: '#0F0F13' },
    ],
  }
}

export function createRadialGradient(base = '#FFFFFF'): RadialGradient {
  return {
    type: 'radial',
    cx: 0.5,
    cy: 0.5,
    radius: 1,
    stops: [
      { offset: 0, color: normalizeHexColor(base) },
      { offset: 1, color: '#0F0F13' },
    ],
  }
}

export function setStopOffset(stops: GradientStop[], index: number, nextOffset: number) {
  const target = { ...stops[index], offset: clamp(nextOffset, 0, 1) }
  const nextStops = stops.map((stop, stopIndex) => (stopIndex === index ? target : stop))
  const sorted = sortStops(nextStops)
  return { stops: sorted, index: sorted.indexOf(target) }
}

export function updateStopColor(stops: GradientStop[], index: number, color: string) {
  const resolved = isBrandToken(color) ? color : normalizeHexColor(color, stops[index].color)
  const target = { ...stops[index], color: resolved }
  const nextStops = stops.map((stop, stopIndex) => (stopIndex === index ? target : stop))
  const sorted = sortStops(nextStops)
  return { stops: sorted, index: sorted.indexOf(target) }
}

export function isEndStop(stop: GradientStop) {
  return stop.offset === 0 || stop.offset === 1
}

export function ensureEndStops(stops: GradientStop[]): GradientStop[] {
  const sorted = sortStops(stops)
  const result = [...sorted]
  if (!result.some((s) => s.offset === 0)) {
    result.unshift({ offset: 0, color: sorted[0]?.color ?? '#ffffff' })
  }
  if (!result.some((s) => s.offset === 1)) {
    result.push({ offset: 1, color: sorted[sorted.length - 1]?.color ?? '#000000' })
  }
  return sortStops(result)
}

export const GRADIENT_PRESETS: Array<{ label: string; fill: LinearGradient }> = [
  { label: 'Midnight', fill: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#12101E' }, { offset: 1, color: '#1a1240' }] } },
  { label: 'Nordic',   fill: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#1c1c2e' }, { offset: 0.5, color: '#2d3561' }, { offset: 1, color: '#0d0d1a' }] } },
  { label: 'Ocean',    fill: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#0052D4' }, { offset: 1, color: '#0D324D' }] } },
  { label: 'Aurora',   fill: { type: 'linear', angle: 130, stops: [{ offset: 0, color: '#00C9FF' }, { offset: 0.5, color: '#005A8E' }, { offset: 1, color: '#7B2FBE' }] } },
  { label: 'Candy',    fill: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#FF9A9E' }, { offset: 1, color: '#A18CD1' }] } },
  { label: 'Sunset',   fill: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#FF6B6B' }, { offset: 0.5, color: '#FF8E53' }, { offset: 1, color: '#C850C0' }] } },
  { label: 'Fire',     fill: { type: 'linear', angle: 45,  stops: [{ offset: 0, color: '#F83600' }, { offset: 1, color: '#F9D423' }] } },
  { label: 'Forest',   fill: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#093028' }, { offset: 1, color: '#237A57' }] } },
  { label: 'Peach',    fill: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#FFECD2' }, { offset: 1, color: '#FCB69F' }] } },
  { label: 'Royal',    fill: { type: 'linear', angle: 160, stops: [{ offset: 0, color: '#141E30' }, { offset: 1, color: '#243B55' }] } },
  { label: 'Lavender', fill: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#E0C3FC' }, { offset: 1, color: '#8EC5FC' }] } },
  { label: 'Neon',     fill: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#00DBDE' }, { offset: 1, color: '#FC00FF' }] } },
]

export const SOLID_PRESETS: Array<{ label: string; color: string }> = [
  { label: 'Black',      color: '#000000' },
  { label: 'Near Black', color: '#0f0f13' },
  { label: 'Dark Gray',  color: '#1c1c2e' },
  { label: 'Gray',       color: '#6b7280' },
  { label: 'Light Gray', color: '#d1d5db' },
  { label: 'White',      color: '#ffffff' },
  { label: 'iOS Blue',   color: '#007AFF' },
  { label: 'iOS Green',  color: '#34C759' },
  { label: 'iOS Red',    color: '#FF3B30' },
  { label: 'iOS Orange', color: '#FF9500' },
  { label: 'iOS Purple', color: '#AF52DE' },
  { label: 'iOS Teal',   color: '#5AC8FA' },
]
