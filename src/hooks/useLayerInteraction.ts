/**
 * [INPUT]: depends on Konva types from konva; RefObject from react
 * [OUTPUT]: exports useLayerInteraction
 * [POS]: shared canvas pointer interaction hook of src/hooks/; normalizes unlocked click/tap/drag selection and drag-end position reporting for Konva layer nodes
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type Konva from 'konva'
import type { RefObject } from 'react'

interface LayerInteractionOptions<TNode extends Konva.Node> {
  nodeRef: RefObject<TNode | null>
  locked: boolean
  onSelect: () => void
  onDragEnd: (x: number, y: number) => void
  getDragPosition: (node: TNode) => { x: number; y: number }
}

/** Common click/tap/drag selection behavior for canvas layers. */
export function useLayerInteraction<TNode extends Konva.Node>({
  nodeRef,
  locked,
  onSelect,
  onDragEnd,
  getDragPosition,
}: LayerInteractionOptions<TNode>) {
  const selectIfUnlocked = () => {
    if (!locked) onSelect()
  }

  return {
    onClick: selectIfUnlocked,
    onTap: selectIfUnlocked,
    onDragStart: selectIfUnlocked,
    onDragEnd: () => {
      const node = nodeRef.current
      if (!node) return
      const position = getDragPosition(node)
      onDragEnd(position.x, position.y)
    },
  }
}
