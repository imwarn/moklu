/**
 * [INPUT]: depends on StudioHandoffPayload and WorkspaceBlobOutput from ./types
 * [OUTPUT]: exports clampBatchIndex, stepBatchIndex, removeBatchEntry, and buildBatchStudioHandoff for multi-image batch navigation and Studio handoff
 * [POS]: pure state-transition helpers for batch preview filmstrips in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { StudioHandoffPayload, WorkspaceBlobOutput } from './types'

export function clampBatchIndex(index: number, length: number): number {
  if (length <= 0) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export function stepBatchIndex(current: number, delta: -1 | 1, length: number): number {
  if (length <= 1) return 0
  const safe = clampBatchIndex(current, length)
  return (safe + delta + length) % length
}

export function removeBatchEntry<T>(
  items: readonly T[],
  removeIndex: number,
  selectedIndex: number,
): { items: T[]; nextIndex: number } {
  if (removeIndex < 0 || removeIndex >= items.length) {
    return { items: [...items], nextIndex: clampBatchIndex(selectedIndex, items.length) }
  }
  const nextItems = items.filter((_, idx) => idx !== removeIndex)
  if (nextItems.length === 0) {
    return { items: nextItems, nextIndex: 0 }
  }
  const adjusted = removeIndex < selectedIndex ? selectedIndex - 1 : selectedIndex
  return {
    items: nextItems,
    nextIndex: clampBatchIndex(adjusted, nextItems.length),
  }
}

export function buildBatchStudioHandoff(
  outputs: readonly WorkspaceBlobOutput[],
  activeIndex: number,
): StudioHandoffPayload | null {
  if (outputs.length === 0) return null
  const safeIndex = clampBatchIndex(activeIndex, outputs.length)
  const active = outputs[safeIndex]
  return {
    images: outputs.map((item) => ({
      dataUrl: item.dataUrl,
      name: item.filename,
      width: item.width,
      height: item.height,
    })),
    mode: outputs.length > 1 ? 'carousel' : 'canvas',
    slideWidth: active.width,
    slideHeight: active.height,
  }
}
