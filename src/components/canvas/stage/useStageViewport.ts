/**
 * [INPUT]: depends on react hooks, useEditorStore from @/store, getPanoTotalWidth from @/utils/panoGeometry, and CanvasFormatId/SlideGroup types
 * [OUTPUT]: exports useStageViewport hook plus pure helpers computeViewportTransition and shouldIgnoreSpacePanTarget
 * [POS]: viewport zoom, pan, fit, and resize controller for StageCanvas inside src/components/canvas/stage
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store'
import { getPanoTotalWidth } from '@/utils/panoGeometry'
import type { CanvasFormatId, SlideGroup } from '@/types'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 4
const AUTO_FIT_PADDING = 32
const MANUAL_FIT_PADDING = 80
const RESIZE_OVERFLOW_MARGIN = 24

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY'])
const INTERACTIVE_ROLE_SELECTOR = [
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="textbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
].join(',')

// ─── Pure viewport & keyboard helpers ────────────────────────────────────────

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export interface ViewportSnapshot {
  groupId: string
  family: string
  format: CanvasFormatId
  totalW: number
  totalH: number
  containerW: number
}

export interface ViewportState {
  zoom: number
  viewportX: number
  viewportY: number
}

export interface ViewportTransitionInput {
  prev: ViewportSnapshot | null
  next: ViewportSnapshot
  containerH: number
  current: ViewportState
}

export function computeFitViewport(
  totalW: number,
  totalH: number,
  containerW: number,
  containerH: number,
  padding: number,
): ViewportState {
  const zoom = clampZoom(Math.min(
    (containerW - padding) / totalW,
    (containerH - padding) / totalH,
  ))
  return {
    zoom,
    viewportX: (containerW - totalW * zoom) / 2,
    viewportY: (containerH - totalH * zoom) / 2,
  }
}

/**
 * Resolves viewport zoom and pan across mount, device-family switch,
 * same-family format switch, canvas geometry changes, and container resize.
 *
 * Returning `null` leaves the user's current zoom and pan untouched.
 */
export function computeViewportTransition({
  prev,
  next,
  containerH,
  current,
}: ViewportTransitionInput): ViewportState | null {
  if (next.containerW <= 0 || containerH <= 0 || next.totalW <= 0 || next.totalH <= 0) {
    return null
  }

  // 1. Initial mount: fit the canvas into the viewport.
  if (!prev) {
    return computeFitViewport(next.totalW, next.totalH, next.containerW, containerH, AUTO_FIT_PADDING)
  }

  // 2. Switching device family (e.g. phone -> watch/vr): full fit so drastically
  //    different dimensions never appear tiny or oversized.
  if (prev.family !== next.family) {
    return computeFitViewport(next.totalW, next.totalH, next.containerW, containerH, MANUAL_FIT_PADDING)
  }

  // 3. Switching format within the same family & group: preserve visual scale
  //    (diagonal-rescaled zoom) and re-anchor pan around the same relative point.
  if (prev.format !== next.format && prev.groupId === next.groupId) {
    const oldCenterX = (next.containerW / 2 - current.viewportX) / current.zoom
    const oldCenterY = (containerH / 2 - current.viewportY) / current.zoom
    const fx = prev.totalW > 0 ? oldCenterX / prev.totalW : 0.5
    const fy = prev.totalH > 0 ? oldCenterY / prev.totalH : 0.5
    const prevDiag = Math.hypot(prev.totalW, prev.totalH)
    const newDiag = Math.hypot(next.totalW, next.totalH)
    const sizeRatio = prevDiag > 0 && newDiag > 0 ? prevDiag / newDiag : 1
    const zoom = clampZoom(current.zoom * sizeRatio)
    return {
      zoom,
      viewportX: next.containerW / 2 - fx * next.totalW * zoom,
      viewportY: containerH / 2 - fy * next.totalH * zoom,
    }
  }

  // 4. Slide group switched or canvas geometry changed (e.g. Single -> Pano,
  //    gap compensation toggled, custom format resized): fit to viewport.
  const geometryChanged =
    prev.groupId !== next.groupId ||
    prev.totalW !== next.totalW ||
    prev.totalH !== next.totalH
  if (geometryChanged) {
    return computeFitViewport(next.totalW, next.totalH, next.containerW, containerH, AUTO_FIT_PADDING)
  }

  // 5. Container width changed (e.g. sidebar toggled / window resized):
  //    fit only when the canvas would overflow; otherwise keep user zoom and re-center.
  if (prev.containerW !== next.containerW) {
    const shouldFit = next.totalW * current.zoom > next.containerW - RESIZE_OVERFLOW_MARGIN
    const zoom = shouldFit
      ? clampZoom(Math.min(
          (next.containerW - AUTO_FIT_PADDING) / next.totalW,
          (containerH - AUTO_FIT_PADDING) / next.totalH,
        ))
      : current.zoom
    return {
      zoom,
      viewportX: (next.containerW - next.totalW * zoom) / 2,
      viewportY: (containerH - next.totalH * zoom) / 2,
    }
  }

  return null
}

function isInteractiveOrEditableElement(node: EventTarget | Element | null | undefined): boolean {
  if (!node || typeof node !== 'object') return false
  const el = node as Partial<HTMLElement>
  const tag = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : ''
  if (INTERACTIVE_TAGS.has(tag)) return true
  if (el.isContentEditable) return true
  if (typeof el.closest === 'function' && el.closest(INTERACTIVE_ROLE_SELECTOR)) return true
  return false
}

/**
 * Returns true when a Space keydown event originated in or targets an
 * interactive control, editable surface, or modal dialog so Space is passed
 * through instead of hijacked for canvas panning.
 */
export function shouldIgnoreSpacePanTarget(
  target: EventTarget | null,
  activeElement?: Element | null,
): boolean {
  return isInteractiveOrEditableElement(target) || isInteractiveOrEditableElement(activeElement)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseStageViewportOptions {
  group: SlideGroup | undefined
  panoCompensate: boolean
  panoCompensationPx: number
  setZoom: (zoom: number) => void
  setViewportPosition: (x: number, y: number) => void
  /** Format family key (e.g. 'phone', 'watch', 'vr') — switching families triggers a full fit-to-view. */
  activeFamily: string
  /** Active canvas format id — switching formats within the same family re-anchors pan by relative position, rescaling zoom by diagonal ratio. */
  activeCanvasFormat: CanvasFormatId
}

export function useStageViewport({
  group,
  panoCompensate,
  panoCompensationPx,
  setZoom,
  setViewportPosition,
  activeFamily,
  activeCanvasFormat,
}: UseStageViewportOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const spaceRef = useRef(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ clientX: number; clientY: number; vpX: number; vpY: number } | null>(null)
  const prevSnapshotRef = useRef<ViewportSnapshot | null>(null)

  const groupId = group?.id ?? null
  const slideWidth = group?.slideWidth ?? 0
  const slideHeight = group?.slideHeight ?? 0
  const numSlides = group?.numSlides ?? 0
  const totalW = groupId
    ? getPanoTotalWidth({ slideWidth, numSlides }, panoCompensate ? panoCompensationPx : 0)
    : 0
  const totalH = groupId ? slideHeight : 0

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Unified viewport synchronization: avoids Effect 1 clobbering user zoom/pan
  // before same-family relative format scaling can read it.
  useEffect(() => {
    if (!containerSize.w || !containerSize.h || !groupId || totalW <= 0 || totalH <= 0) return

    const nextSnapshot: ViewportSnapshot = {
      groupId,
      family: activeFamily,
      format: activeCanvasFormat,
      totalW,
      totalH,
      containerW: containerSize.w,
    }
    const { zoom, viewportX, viewportY } = useEditorStore.getState()
    const transition = computeViewportTransition({
      prev: prevSnapshotRef.current,
      next: nextSnapshot,
      containerH: containerSize.h,
      current: { zoom, viewportX, viewportY },
    })
    prevSnapshotRef.current = nextSnapshot

    if (!transition) return
    if (transition.zoom !== zoom) setZoom(transition.zoom)
    setViewportPosition(transition.viewportX, transition.viewportY)
  }, [
    containerSize.w,
    containerSize.h,
    groupId,
    totalW,
    totalH,
    activeFamily,
    activeCanvasFormat,
    setZoom,
    setViewportPosition,
  ])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const { zoom: cz, viewportX: vpX, viewportY: vpY, setZoom: sz, setViewportPosition: svp } =
          useEditorStore.getState()
        const rect = el.getBoundingClientRect()
        const px = e.clientX - rect.left
        const py = e.clientY - rect.top
        const factor = e.deltaY < 0 ? 1.08 : 0.93
        const newZoom = clampZoom(cz * factor)
        const canvasX = (px - vpX) / cz
        const canvasY = (py - vpY) / cz
        sz(newZoom)
        svp(px - canvasX * newZoom, py - canvasY * newZoom)
      } else {
        const { viewportX: vpX, viewportY: vpY, setViewportPosition: svp } =
          useEditorStore.getState()
        svp(vpX - e.deltaX, vpY - e.deltaY)
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => {
    const resetSpacePan = () => {
      spaceRef.current = false
      setSpaceDown(false)
      panStartRef.current = null
      setIsPanning(false)
    }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (shouldIgnoreSpacePanTarget(e.target, document.activeElement)) return
        e.preventDefault()
        spaceRef.current = true
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') resetSpacePan()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', resetSpacePan)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', resetSpacePan)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return
      const { clientX: sx, clientY: sy, vpX, vpY } = panStartRef.current
      const { setViewportPosition: svp } = useEditorStore.getState()
      svp(vpX + e.clientX - sx, vpY + e.clientY - sy)
    }
    const handleMouseUp = () => { panStartRef.current = null; setIsPanning(false) }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!spaceRef.current) return
    const { viewportX: vpX, viewportY: vpY } = useEditorStore.getState()
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, vpX, vpY }
    setIsPanning(true)
  }

  const handleFit = useCallback(() => {
    if (!groupId || totalW <= 0 || totalH <= 0 || !containerSize.w || !containerSize.h) return
    const fit = computeFitViewport(totalW, totalH, containerSize.w, containerSize.h, MANUAL_FIT_PADDING)
    setZoom(fit.zoom)
    setViewportPosition(fit.viewportX, fit.viewportY)
  }, [groupId, totalW, totalH, containerSize.w, containerSize.h, setZoom, setViewportPosition])

  return {
    containerRef,
    containerSize,
    spaceRef,
    spaceDown,
    isPanning,
    handleContainerMouseDown,
    handleFit,
  }
}
