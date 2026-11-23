/**
 * [INPUT]: depends on BrandColor and FillValue from @/types, resolveFill from ./brandColors, and fillToKonvaProps from ./gradients
 * [OUTPUT]: exports layerFillToKonvaProps
 * [POS]: thin brand-token-aware fill adapter in src/utils; resolves FillValue into Konva shape fill properties for canvas layer nodes
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { BrandColor, FillValue } from '@/types'
import { resolveFill } from './brandColors'
import { fillToKonvaProps } from './gradients'

interface FillBounds {
  width: number
  height: number
}

/** Resolve brand tokens and convert a fill into the corresponding Konva props. */
export function layerFillToKonvaProps(
  fill: FillValue | undefined,
  brandColors: BrandColor[],
  bounds: FillBounds,
): Record<string, unknown> {
  if (fill === undefined) return {}
  return fillToKonvaProps(resolveFill(fill, brandColors), bounds.width, bounds.height)
}
