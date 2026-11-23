/**
 * [INPUT]: depends on useEffect, useLayoutEffect, useState, and RefObject from react
 * [OUTPUT]: exports CONTEXT_MENU_MARGIN, MenuPosition, clampMenuPosition, placeContextMenu, useClampedMenuPosition, and useContextMenuKeyboard
 * [POS]: shared viewport clamping and WAI-ARIA keyboard helper for floating Studio context menus inside src/components/ui
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'

export const CONTEXT_MENU_MARGIN = 8

export interface MenuPosition {
  left: number
  top: number
}

// ─── Pure viewport clamping ──────────────────────────────────────────────────

/**
 * Clamps a menu's top-left coordinate so its entire bounding box remains
 * inside `[margin, viewport - size - margin]` on both axes.
 */
export function clampMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = CONTEXT_MENU_MARGIN,
): MenuPosition {
  const maxLeft = Math.max(margin, viewportWidth - menuWidth - margin)
  const maxTop = Math.max(margin, viewportHeight - menuHeight - margin)
  return {
    left: Math.min(Math.max(margin, x), maxLeft),
    top: Math.min(Math.max(margin, y), maxTop),
  }
}

/**
 * Places a context menu at an anchor point, optionally flipping upward when it
 * would overflow the bottom edge, then clamps both axes into the viewport.
 */
export function placeContextMenu(
  anchorX: number,
  anchorY: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  options?: { margin?: number; flipY?: boolean },
): MenuPosition {
  const margin = options?.margin ?? CONTEXT_MENU_MARGIN
  const flipY = options?.flipY ?? false
  const preferredY =
    flipY && anchorY + menuHeight + margin > viewportHeight
      ? anchorY - menuHeight
      : anchorY
  return clampMenuPosition(anchorX, preferredY, menuWidth, menuHeight, viewportWidth, viewportHeight, margin)
}

// ─── Layout measurement hook ─────────────────────────────────────────────────

export function useClampedMenuPosition(
  menuRef: RefObject<HTMLDivElement | null>,
  anchorX: number,
  anchorY: number,
  estimatedWidth: number,
  estimatedHeight: number,
  options?: { flipY?: boolean },
): MenuPosition {
  const flipY = options?.flipY ?? false
  const compute = (width: number, height: number): MenuPosition => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720
    return placeContextMenu(anchorX, anchorY, width, height, vw, vh, { flipY })
  }

  const [measured, setMeasured] = useState<{
    anchorX: number
    anchorY: number
    position: MenuPosition
  } | null>(null)

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const next = placeContextMenu(anchorX, anchorY, rect.width, rect.height, vw, vh, { flipY })
    setMeasured({ anchorX, anchorY, position: next })
  }, [menuRef, anchorX, anchorY, estimatedWidth, estimatedHeight, flipY])

  if (measured && measured.anchorX === anchorX && measured.anchorY === anchorY) {
    return measured.position
  }
  return compute(estimatedWidth, estimatedHeight)
}

// ─── WAI-ARIA menu keyboard navigation & Escape close ────────────────────────

export function useContextMenuKeyboard(
  menuRef: RefObject<HTMLDivElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return

    const getItems = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [],
      )

    const initialItems = getItems()
    if (initialItems.length > 0) {
      initialItems[0].focus({ preventScroll: true })
    } else {
      menuRef.current?.focus({ preventScroll: true })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
        return
      }

      const items = getItems()
      if (items.length === 0) return
      event.preventDefault()

      const currentIndex = items.findIndex((item) => item === document.activeElement)
      if (event.key === 'Home') {
        items[0].focus({ preventScroll: true })
      } else if (event.key === 'End') {
        items[items.length - 1].focus({ preventScroll: true })
      } else if (event.key === 'ArrowDown') {
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0
        items[nextIndex].focus({ preventScroll: true })
      } else if (event.key === 'ArrowUp') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        items[prevIndex].focus({ preventScroll: true })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [menuRef, open, onClose])
}
