/**
 * [INPUT]: depends on resolveGroupView from @/utils/canvasFormats; depends on CanvasFormatId, GroupLayer, Layer, and Project from @/types
 * [OUTPUT]: exports MultiDragStartEntry type and resolveMultiDragStartPositions pure helper
 * [POS]: multi-selection drag coordinate resolver inside src/components/canvas/stage used by StageCanvas
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { resolveGroupView } from '@/utils/canvasFormats'
import type { CanvasFormatId, GroupLayer, Layer as AppLayer, Project } from '@/types'

export interface MultiDragStartEntry {
  nodeX: number
  nodeY: number
  layerX: number
  layerY: number
}

/**
 * Resolves secondary layer start coordinates for multi-selection drag from the
 * active format/locale view (`resolveGroupView`), preventing non-base format or
 * non-default locale drags from snapping secondary layers back to raw Base coords.
 */
export function resolveMultiDragStartPositions(params: {
  project: Project
  activeSlideGroupId: string | null
  activeLocale: string
  activeCanvasFormat: CanvasFormatId
  editingGroupId: string | null
  selectedLayerIds: readonly string[]
  draggingLayerId: string
  findNodePos: (layerId: string) => { x: number; y: number } | null
}): Map<string, MultiDragStartEntry> {
  const startPositions = new Map<string, MultiDragStartEntry>()
  const rawGroup = params.project.slideGroups.find((item) => item.id === params.activeSlideGroupId)
  if (!rawGroup) return startPositions

  const resolvedGroup = resolveGroupView(
    rawGroup,
    params.project.settings,
    params.activeLocale,
    params.activeCanvasFormat,
  )
  const candidateLayers: readonly AppLayer[] = params.editingGroupId
    ? ((resolvedGroup.layers.find((l) => l.id === params.editingGroupId && l.type === 'group') as GroupLayer | undefined)?.children ?? [])
    : resolvedGroup.layers

  for (const id of params.selectedLayerIds) {
    if (id === params.draggingLayerId) continue
    const layer = candidateLayers.find((item) => item.id === id)
    if (!layer || layer.locked) continue
    const nodePos = params.findNodePos(id)
    if (nodePos) {
      startPositions.set(id, {
        nodeX: nodePos.x,
        nodeY: nodePos.y,
        layerX: layer.x,
        layerY: layer.y,
      })
    }
  }
  return startPositions
}
