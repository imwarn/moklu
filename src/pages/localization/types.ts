/**
 * [INPUT]: depends on ImageLayer, PhoneLayer, and TextLayer from @/types
 * [OUTPUT]: exports LocalizableDisplayLayer, LocalizableRow, UploadTarget, CellStatus, CellKey, and cellKey helper
 * [POS]: leaf type definitions within src/pages/localization shared across localization matrix components
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { ImageLayer, PhoneLayer, TextLayer } from '@/types'

export type LocalizableDisplayLayer = TextLayer | PhoneLayer | ImageLayer

export interface LocalizableRow {
  slideGroupId: string
  slideGroupName: string
  layerId: string
  layerName: string
  layerType: 'text' | 'phone' | 'image'
  depth: number
  containerGroupId: string | null
  defaultText?: string
  defaultImageRef?: string
  layer: LocalizableDisplayLayer
}

export interface UploadTarget {
  slideGroupId: string
  layerId: string
  locale: string
  layerType: 'phone' | 'image'
}

export type CellStatus = 'idle' | 'queued' | 'translating' | 'done' | 'error'
export type CellKey = string // `${layerId}:${locale}`

export function cellKey(layerId: string, locale: string): CellKey {
  return `${layerId}:${locale}`
}
