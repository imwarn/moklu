/**
 * [INPUT]: depends on Konva types from konva; RefObject from react; BaseLayer from @/types; getShadowProps and useKonvaBlur from @/components/canvas/effects
 * [OUTPUT]: exports useLayerEffects
 * [POS]: shared canvas layer effect hook of src/hooks/; binds Konva blur caching and returns shadow props for layer renderers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type Konva from 'konva'
import type { RefObject } from 'react'
import type { BaseLayer } from '@/types'
import { getShadowProps, useKonvaBlur } from '@/components/canvas/effects'

/** Apply a layer's blur and expose its matching Konva shadow props. */
export function useLayerEffects(
  nodeRef: RefObject<Konva.Node | null>,
  layer: Pick<BaseLayer, 'blur' | 'shadow'>,
  cacheKey?: string | number | boolean | null,
  blur = layer.blur,
) {
  useKonvaBlur(nodeRef, blur, cacheKey)
  return getShadowProps(layer.shadow)
}
