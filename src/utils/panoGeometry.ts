/**
 * [INPUT]: depends on SlideGroup and PanoSettings from @/types
 * [OUTPUT]: exports DEFAULT_PANO_COMPENSATION_PX, MAX_PANO_COMPENSATION_PX, normalizePanoCompensationPx, getPanoGapPx, getPanoTotalWidth, getPanoSlideX, and getEffectivePano
 * [POS]: panoramic multi-slide width, gap-compensation, and slide offset geometry in src/utils; shared by StageCanvas, export, multiFormatExport, and thumbnailRender
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { SlideGroup, PanoSettings } from '@/types'

export const DEFAULT_PANO_COMPENSATION_PX = 24
export const MAX_PANO_COMPENSATION_PX = 300

export function normalizePanoCompensationPx(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(MAX_PANO_COMPENSATION_PX, Math.round(value)))
}

export function getPanoGapPx(group: Pick<SlideGroup, 'numSlides'>, compensationPx = 0): number {
  if (group.numSlides <= 1) return 0
  return normalizePanoCompensationPx(compensationPx)
}

export function getPanoTotalWidth(
  group: Pick<SlideGroup, 'slideWidth' | 'numSlides'>,
  compensationPx = 0,
): number {
  const gapPx = getPanoGapPx(group, compensationPx)
  return group.slideWidth * group.numSlides + gapPx * Math.max(0, group.numSlides - 1)
}

export function getPanoSlideX(
  group: Pick<SlideGroup, 'slideWidth' | 'numSlides'>,
  slideIndex: number,
  compensationPx = 0,
): number {
  const gapPx = getPanoGapPx(group, compensationPx)
  return slideIndex * (group.slideWidth + gapPx)
}

/** Returns the effective pano settings, preferring the render override over project settings. */
export function getEffectivePano(
  projectPano: PanoSettings | undefined,
  renderOverride: { gapPx: number; compensate: boolean } | null,
): { gapPx: number; compensate: boolean } {
  if (renderOverride !== null) return renderOverride
  return projectPano ?? { gapPx: DEFAULT_PANO_COMPENSATION_PX, compensate: false }
}
