/**
 * [INPUT]: depends on getPanoGapPx and getPanoTotalWidth from @/utils/panoGeometry, and SlideGroup type from @/types
 * [OUTPUT]: exports useStageGeometry helper computing panoramic compensation, gap width, total logical canvas dimensions, and zoom-scaled display dimensions
 * [POS]: stage-sizing calculation helper in src/components/canvas/stage; consumed by StageCanvas to synchronize viewport fit, canvas clipping, and slide divider overlays
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { getPanoGapPx, getPanoTotalWidth } from '@/utils/panoGeometry'
import type { SlideGroup } from '@/types'

export function useStageGeometry(
  group: SlideGroup | undefined,
  panoCompensate: boolean,
  panoCompensationPx: number,
  zoom: number,
) {
  // The gap is real canvas geometry only while compensation is active.
  const effectiveCompensationPx = group && panoCompensate ? panoCompensationPx : 0
  const visualGapPx = group ? getPanoGapPx(group, effectiveCompensationPx) : 0
  const totalWidth = group ? getPanoTotalWidth(group, effectiveCompensationPx) : 0
  const totalHeight = group ? group.slideHeight : 0

  return {
    effectiveCompensationPx,
    visualGapPx,
    totalWidth,
    totalHeight,
    displayWidth: totalWidth * zoom,
    displayHeight: totalHeight * zoom,
  }
}
