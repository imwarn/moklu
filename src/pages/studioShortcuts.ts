/**
 * [INPUT]: depends on Layer and GroupLayer types from @/types
 * [OUTPUT]: exports resolveStudioShortcut, isLayerEditableByShortcut, resolveNudgeTarget, and resolveDeletableLayerIds pure helpers
 * [POS]: pure keyboard-command resolver and layer mutability guard within src/pages, consumed by StudioPage.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { GroupLayer, Layer } from '@/types'

export type StudioViewMode = 'editor' | 'localization'

export interface StudioKeyInput {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export interface StudioShortcutContext {
  view: StudioViewMode
  hasOpenMobilePanel: boolean
  editingGroupId: string | null
  hasSelection: boolean
}

export type StudioShortcutCommand =
  | { type: 'close-mobile-panel' }
  | { type: 'exit-group-edit' }
  | { type: 'group' }
  | { type: 'ungroup' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'copy' }
  | { type: 'cut' }
  | { type: 'paste' }
  | { type: 'copy-style' }
  | { type: 'paste-style' }
  | { type: 'duplicate' }
  | { type: 'zoom-fit' }
  | { type: 'zoom-reset' }
  | { type: 'nudge'; dx: number; dy: number }
  | { type: 'delete' }

export type NudgeTarget =
  | { kind: 'child'; groupId: string; layer: Layer }
  | { kind: 'top'; layer: Layer }

/** Resolve a keyboard event into a normalized Studio editor command, or null when inactive. */
export function resolveStudioShortcut(
  input: StudioKeyInput,
  ctx: StudioShortcutContext,
): StudioShortcutCommand | null {
  if (ctx.view !== 'editor') return null

  const key = input.key.toLowerCase()

  if (key === 'escape') {
    if (ctx.hasOpenMobilePanel) return { type: 'close-mobile-panel' }
    if (ctx.editingGroupId) return { type: 'exit-group-edit' }
    return null
  }

  if (input.ctrlKey || input.metaKey) {
    if (key === 'g' && !input.shiftKey) return { type: 'group' }
    if (key === 'g' && input.shiftKey) return { type: 'ungroup' }
    if (key === 'z' && !input.shiftKey) return { type: 'undo' }
    if ((key === 'z' && input.shiftKey) || key === 'y') return { type: 'redo' }
    if (key === 'c' && !input.altKey) return { type: 'copy' }
    if (key === 'x') return { type: 'cut' }
    if (key === 'v' && !input.altKey) return { type: 'paste' }
    if (key === 'c' && input.altKey) return { type: 'copy-style' }
    if (key === 'v' && input.altKey) return { type: 'paste-style' }
    if (key === 'd') return { type: 'duplicate' }
    if (key === '0') return { type: 'zoom-fit' }
    if (key === '1') return { type: 'zoom-reset' }
    return null
  }

  if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') {
    const step = input.shiftKey ? 10 : 1
    const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0
    const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0
    return { type: 'nudge', dx, dy }
  }

  if ((key === 'delete' || key === 'backspace') && ctx.hasSelection) {
    return { type: 'delete' }
  }

  return null
}

/** Return true only when a layer may be moved or deleted via keyboard shortcuts. */
export function isLayerEditableByShortcut(
  layer: Pick<Layer, 'type' | 'locked'> | null | undefined,
): boolean {
  return Boolean(layer && !layer.locked && layer.type !== 'background')
}

function findEditingGroup(layers: readonly Layer[], editingGroupId: string): GroupLayer | undefined {
  const found = layers.find((layer) => layer.id === editingGroupId)
  return found?.type === 'group' ? found : undefined
}

/** Locate the layer eligible for arrow-key nudging, skipping locked and background layers. */
export function resolveNudgeTarget(
  layers: readonly Layer[],
  selectionLayerId: string | null | undefined,
  editingGroupId: string | null,
): NudgeTarget | null {
  if (!selectionLayerId) return null

  if (editingGroupId) {
    const groupLayer = findEditingGroup(layers, editingGroupId)
    if (!groupLayer || groupLayer.locked) return null
    const child = groupLayer.children.find((item) => item.id === selectionLayerId)
    return isLayerEditableByShortcut(child) ? { kind: 'child', groupId: editingGroupId, layer: child! } : null
  }

  const layer = layers.find((item) => item.id === selectionLayerId)
  return isLayerEditableByShortcut(layer) ? { kind: 'top', layer: layer! } : null
}

/** Filter selected layer IDs down to those allowed to be deleted by keyboard shortcuts. */
export function resolveDeletableLayerIds(
  layers: readonly Layer[],
  selectedLayerIds: readonly string[],
  selectionLayerId: string | null | undefined,
  editingGroupId: string | null,
): string[] {
  const candidates = selectedLayerIds.length > 0
    ? selectedLayerIds
    : selectionLayerId
      ? [selectionLayerId]
      : []

  if (candidates.length === 0) return []

  if (editingGroupId) {
    const groupLayer = findEditingGroup(layers, editingGroupId)
    if (groupLayer) {
      if (groupLayer.locked) return []
      return candidates.filter((id) => {
        const child = groupLayer.children.find((item) => item.id === id)
        if (child) return isLayerEditableByShortcut(child)
        const top = layers.find((item) => item.id === id)
        return isLayerEditableByShortcut(top)
      })
    }
  }

  return candidates.filter((id) => {
    const layer = layers.find((item) => item.id === id)
    return isLayerEditableByShortcut(layer)
  })
}
