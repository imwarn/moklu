/**
 * [INPUT]: depends on Layer type from @/types
 * [OUTPUT]: exports LayerTypeKey, LAYER_ICON map, ContextMenu interface, and ItemData discriminated union for dnd-kit sortable containers
 * [POS]: shared type and icon contract in src/components/panels/layers; coordinates LayersPanel, SortableLayerRow, and LayerContextMenu
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Layer } from '@/types'

export type LayerTypeKey = Layer['type']

export const LAYER_ICON: Record<LayerTypeKey, string> = {
  background: '🎨',
  phone: '📱',
  text: 'T',
  image: '🖼',
  shape: '▭',
  emoji: '😀',
  brand: '🏷',
  group: '▥',
}

export interface ContextMenu { layerId: string; x: number; y: number }

/** Data attached to every useSortable item so handleDragEnd knows the source/dest container */
export type ItemData =
  | { container: 'root'; isGroup?: boolean }
  | { container: 'group'; groupId: string }
