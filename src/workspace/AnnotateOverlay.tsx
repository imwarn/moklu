/**
 * [INPUT]: depends on react, nanoid, annotation types/constants/geometry helpers from @/tools/annotateEngine, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, and workspace types from ./types
 * [OUTPUT]: exports AnnotateToolbar, AnnotateCanvas, useAnnotateShortcuts, AnnotateToolbarProps, AnnotateCanvasProps, and UseAnnotateShortcutsOptions for floating pill toolbar and interactive vector annotation stage with 8-handle resizing and inline text editing
 * [POS]: reusable vector annotation UI primitives in src/workspace; shared by AnnotateModal (inline mode) and AnnotateQuickTool (standalone 7th QuickWorkspace panel)
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react'
import {
  ANNOTATION_PRESET_COLORS, buildSmoothSvgPath, computeResizedBounds,
  getAnnotationBounds, hitTestAnnotationLayers, moveAnnotationLayer,
  resizeAnnotationLayer, simplifyBrushPoints,
  type AnnotationBounds, type AnnotationLayer, type AnnotationPoint,
  type AnnotationResizeHandle, type AnnotationToolMode,
  type ArrowAnnotationLayer, type BrushAnnotationLayer,
  type RectAnnotationLayer, type TextAnnotationLayer,
} from '@/tools/annotateEngine'
import { getWorkspaceStrings } from './i18n'
import { getWorkspaceThemeTokens } from './themeTokens'
import type { WorkspaceImageInput, WorkspaceLocale, WorkspaceTheme } from './types'

const MIN_STROKE_WIDTH = 0.004
const MAX_STROKE_WIDTH = 0.06
const MIN_FONT_SIZE = 0.025
const MAX_FONT_SIZE = 0.14
const DEFAULT_CORNER_RADIUS = 0.008

const RESIZE_HANDLES: readonly { id: AnnotationResizeHandle; posClass: string; cursor: string; label: string }[] = [
  { id: 'nw', posClass: '-left-1.5 -top-1.5', cursor: 'cursor-nwse-resize', label: 'Resize top-left' },
  { id: 'n', posClass: 'left-1/2 -top-1.5 -translate-x-1/2', cursor: 'cursor-ns-resize', label: 'Resize top' },
  { id: 'ne', posClass: '-right-1.5 -top-1.5', cursor: 'cursor-nesw-resize', label: 'Resize top-right' },
  { id: 'e', posClass: '-right-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize', label: 'Resize right' },
  { id: 'se', posClass: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize', label: 'Resize bottom-right' },
  { id: 's', posClass: 'left-1/2 -bottom-1.5 -translate-x-1/2', cursor: 'cursor-ns-resize', label: 'Resize bottom' },
  { id: 'sw', posClass: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize', label: 'Resize bottom-left' },
  { id: 'w', posClass: '-left-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize', label: 'Resize left' },
]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
}

function getTextContrastHalo(hex: string): string {
  const clean = hex.trim().replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  if (!/^[0-9a-f]{6}$/i.test(full)) return '0 1px 2px rgba(0,0,0,0.65)'
  const lum = 0.299 * parseInt(full.slice(0, 2), 16) + 0.587 * parseInt(full.slice(2, 4), 16) + 0.114 * parseInt(full.slice(4, 6), 16)
  if (lum > 155) return '0 1px 3px rgba(17,24,39,0.9), 0 0 2px rgba(17,24,39,0.95)'
  if (lum < 55) return '0 1px 3px rgba(255,255,255,0.92), 0 0 2px rgba(255,255,255,0.95)'
  return '0 1px 2px rgba(0,0,0,0.65), 0 0 1px rgba(0,0,0,0.75)'
}

function ToolModeIcon({ mode }: { mode: AnnotationToolMode }): ReactNode {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {mode === 'select' && <path d="M5 3.5 15 10l-4.5 1.1L8.4 15.8 5 3.5Z" strokeLinejoin="round" />}
      {mode === 'brush' && (
        <>
          <path d="M13.8 3.6a1.9 1.9 0 0 1 2.7 2.7l-7.2 7.2-3.4.8.8-3.4 7.1-7.3Z" strokeLinejoin="round" />
          <path d="M11.8 5.6 14.5 8.3" strokeLinecap="round" />
        </>
      )}
      {mode === 'rect' && <rect x="3.5" y="4.5" width="13" height="11" rx="2.2" />}
      {mode === 'arrow' && <path d="M4.5 15.5 15 5M15 5H8.5M15 5v6.5" strokeLinecap="round" strokeLinejoin="round" />}
      {mode === 'text' && <path d="M4.5 5.5V4h11v1.5M10 4v12M7.5 16h5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

export interface AnnotateToolbarProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  activeTool: AnnotationToolMode
  color: string
  strokeWidth: number
  fontSize: number
  selectedLayer: AnnotationLayer | null
  canUndo: boolean
  canRedo: boolean
  saving?: boolean
  onToolChange: (tool: AnnotationToolMode) => void
  onColorChange: (color: string) => void
  onSizePreview: (nextValue: number, kind: 'stroke' | 'font') => void
  onSizeCommit: (nextValue: number, kind: 'stroke' | 'font') => void
  onUndo: () => void
  onRedo: () => void
  onClose?: () => void
  onSave?: () => void
  onColorPopoverOpenChange?: (open: boolean) => void
  className?: string
}

export function AnnotateToolbar({
  theme, locale, activeTool, color, strokeWidth, fontSize, selectedLayer,
  canUndo, canRedo, saving = false, onToolChange, onColorChange,
  onSizePreview, onSizeCommit, onUndo, onRedo, onClose, onSave,
  onColorPopoverOpenChange, className = '',
}: AnnotateToolbarProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const colorGroupRef = useRef<HTMLDivElement>(null)
  const [colorOpen, setColorOpen] = useState(false)

  const setColorPopover = useCallback(
    (next: boolean) => { setColorOpen(next); onColorPopoverOpenChange?.(next) },
    [onColorPopoverOpenChange],
  )

  useEffect(() => {
    if (!colorOpen || typeof document === 'undefined') return
    const onDown = (e: PointerEvent) => {
      if (colorGroupRef.current && !colorGroupRef.current.contains(e.target as Node)) setColorPopover(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setColorPopover(false) }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [colorOpen, setColorPopover])

  // Roving-tabindex fallback when native HTML focusgroup is unavailable.
  useEffect(() => {
    const bar = toolbarRef.current
    if (!bar || typeof HTMLElement === 'undefined' || 'focusGroup' in HTMLElement.prototype) return
    const getItems = () => Array.from(bar.querySelectorAll<HTMLElement>('[data-toolbar-item="true"]'))
    const items = getItems()
    if (items.length > 0 && !items.some((el) => el.tabIndex === 0)) {
      items.forEach((el, idx) => { el.tabIndex = idx === 0 ? 0 : -1 })
    }
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      const list = getItems()
      if (!target || !list.includes(target)) return
      list.forEach((el) => { el.tabIndex = el === target ? 0 : -1 })
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || target.tagName === 'INPUT') return
      const list = getItems()
      const idx = list.indexOf(target)
      if (idx < 0) return
      const rtl = getComputedStyle(bar).direction === 'rtl'
      let nextIdx: number | null = null
      if (e.key === 'ArrowRight') nextIdx = (idx + (rtl ? -1 : 1) + list.length) % list.length
      else if (e.key === 'ArrowLeft') nextIdx = (idx + (rtl ? 1 : -1) + list.length) % list.length
      else if (e.key === 'Home') nextIdx = 0
      else if (e.key === 'End') nextIdx = list.length - 1
      if (nextIdx === null) return
      e.preventDefault()
      list[nextIdx]?.focus()
    }
    bar.addEventListener('focusin', onFocusIn)
    bar.addEventListener('keydown', onKeyDown)
    return () => {
      bar.removeEventListener('focusin', onFocusIn)
      bar.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, onSave])

  const isTextSizeMode = selectedLayer?.type === 'text' || (!selectedLayer && activeTool === 'text')
  const effectiveColor = selectedLayer?.color ?? color
  const effectiveSliderValue = isTextSizeMode
    ? selectedLayer?.type === 'text' ? selectedLayer.fontSize : fontSize
    : selectedLayer ? selectedLayer.strokeWidth : strokeWidth

  const sliderKind: 'stroke' | 'font' = isTextSizeMode ? 'font' : 'stroke'
  const sliderAriaLabel = isTextSizeMode ? s.annotate.fontSizeLabel : s.annotate.strokeWidthLabel

  const toolItems: readonly { id: AnnotationToolMode; label: string; keyHint: string }[] = [
    { id: 'select', label: s.annotate.toolSelect, keyHint: 'V' },
    { id: 'brush', label: s.annotate.toolBrush, keyHint: 'B' },
    { id: 'rect', label: s.annotate.toolRect, keyHint: 'R' },
    { id: 'arrow', label: s.annotate.toolArrow, keyHint: 'A' },
    { id: 'text', label: s.annotate.toolText, keyHint: 'T' },
  ]

  const pillSurface = theme === 'dark'
    ? 'bg-zinc-900/95 border-zinc-700/80 text-zinc-100 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)]'
    : 'bg-panel/95 border-border text-zinc-900 shadow-[0_10px_28px_-10px_rgba(24,24,27,0.16),0_1px_3px_rgba(24,24,27,0.06)]'
  const sepCls = theme === 'dark' ? 'h-5 w-px shrink-0 border-l border-zinc-700/80' : 'h-5 w-px shrink-0 border-l border-zinc-200'
  const idleCls = theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
  const toolBtnBase = `inline-flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 transition-colors ${tokens.focusRing} aria-pressed:bg-accent-strong aria-pressed:text-accent-fg aria-pressed:shadow-xs`
  const actionBtnCls = `inline-flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 transition-colors ${tokens.focusRing} ${idleCls} aria-disabled:opacity-35 aria-disabled:cursor-not-allowed`

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label={s.annotate.toolbarLabel}
      data-testid="annotate-toolbar"
      {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
      className={`relative z-30 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border px-2.5 py-1.5 backdrop-blur-md sm:rounded-full sm:px-3 ${pillSurface} ${className}`}
    >
      {onClose && (
        <>
          <button
            type="button"
            data-toolbar-item="true"
            data-testid="annotate-close-btn"
            aria-label={s.annotate.closeLabel}
            onClick={onClose}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${idleCls}`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
            <span>{s.annotate.closeLabel}</span>
          </button>
          <span role="separator" aria-orientation="vertical" className={sepCls} />
        </>
      )}

      <div role="group" aria-label={s.annotate.toolbarLabel} className="inline-flex items-center gap-1">
        {toolItems.map((item) => {
          const active = activeTool === item.id
          return (
            <button
              key={item.id}
              type="button"
              data-toolbar-item="true"
              data-testid={`annotate-tool-${item.id}`}
              aria-label={item.label}
              aria-pressed={active}
              title={`${item.label} (${item.keyHint})`}
              onClick={() => onToolChange(item.id)}
              className={`${toolBtnBase} ${active ? '' : idleCls}`}
            >
              <ToolModeIcon mode={item.id} />
            </button>
          )
        })}
      </div>

      <span role="separator" aria-orientation="vertical" className={sepCls} />

      <div ref={colorGroupRef} role="group" aria-label={s.annotate.colorLabel} className="relative inline-flex items-center">
        <button
          type="button"
          data-toolbar-item="true"
          data-testid="annotate-color-trigger"
          aria-label={s.annotate.colorLabel}
          aria-haspopup="true"
          aria-expanded={colorOpen}
          title={s.annotate.colorLabel}
          onClick={() => setColorPopover(!colorOpen)}
          className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-full transition-colors ${tokens.focusRing} ${idleCls}`}
        >
          <span
            aria-hidden="true"
            style={{ backgroundColor: effectiveColor }}
            className="h-5 w-5 rounded-full border border-zinc-400/80 shadow-xs"
          />
        </button>

        {colorOpen && (
          <div
            role="group"
            aria-label={s.annotate.colorLabel}
            data-testid="annotate-color-popover"
            className={`absolute left-1/2 top-full z-40 mt-2.5 -translate-x-1/2 rounded-2xl border p-2 shadow-xl ${pillSurface}`}
          >
            <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-1.5">
              {ANNOTATION_PRESET_COLORS.map((swatch) => {
                const selected = swatch.toLowerCase() === effectiveColor.toLowerCase()
                return (
                  <button
                    key={swatch}
                    type="button"
                    data-testid={`annotate-swatch-${swatch.replace('#', '')}`}
                    aria-label={`${s.annotate.colorLabel} ${swatch}`}
                    aria-pressed={selected}
                    onClick={() => { onColorChange(swatch); setColorPopover(false) }}
                    style={{ backgroundColor: swatch }}
                    className={`h-6 w-6 rounded-full border transition-transform ${tokens.focusRing} ${
                      selected ? 'scale-110 ring-2 ring-accent ring-offset-1 ring-offset-panel border-zinc-400' : 'border-zinc-400/70 hover:scale-105'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div role="group" aria-label={sliderAriaLabel} className="inline-flex items-center gap-1.5 px-1">
        <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 ${tokens.textMuted}`} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M3 13c2.5-5 5-5 7 0s4.5 5 7 0" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          data-toolbar-item="true"
          data-testid="annotate-size-slider"
          aria-label={sliderAriaLabel}
          min={isTextSizeMode ? MIN_FONT_SIZE : MIN_STROKE_WIDTH}
          max={isTextSizeMode ? MAX_FONT_SIZE : MAX_STROKE_WIDTH}
          step={isTextSizeMode ? 0.005 : 0.002}
          value={effectiveSliderValue}
          onChange={(e) => onSizePreview(Number(e.target.value), sliderKind)}
          onPointerUp={(e) => onSizeCommit(Number(e.currentTarget.value), sliderKind)}
          onKeyUp={(e) => onSizeCommit(Number(e.currentTarget.value), sliderKind)}
          onBlur={(e) => onSizeCommit(Number(e.currentTarget.value), sliderKind)}
          className={`h-1.5 w-16 cursor-pointer accent-accent sm:w-20 ${tokens.focusRing}`}
        />
      </div>

      <span role="separator" aria-orientation="vertical" className={sepCls} />

      <div role="group" aria-label={`${s.annotate.undo} / ${s.annotate.redo}`} className="inline-flex items-center gap-0.5">
        <button type="button" data-toolbar-item="true" data-testid="annotate-undo-btn" aria-label={s.annotate.undo} aria-disabled={!canUndo} title={`${s.annotate.undo} (Cmd/Ctrl+Z)`} onClick={() => { if (canUndo) onUndo() }} className={actionBtnCls}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M6.5 8H13a3.5 3.5 0 1 1 0 7H9.5M9 5.5 6.5 8 9 10.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" data-toolbar-item="true" data-testid="annotate-redo-btn" aria-label={s.annotate.redo} aria-disabled={!canRedo} title={`${s.annotate.redo} (Cmd/Ctrl+Shift+Z)`} onClick={() => { if (canRedo) onRedo() }} className={actionBtnCls}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M13.5 8H7a3.5 3.5 0 1 0 0 7h3.5M11 5.5 13.5 8 11 10.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {onSave && (
        <>
          <span role="separator" aria-orientation="vertical" className={sepCls} />
          <button type="button" data-toolbar-item="true" data-testid="annotate-save-btn" aria-disabled={saving} onClick={() => { if (!saving) onSave() }} className={`inline-flex min-h-8 items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors aria-disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}>
            {saving ? s.common.processing : s.annotate.saveLabel}
          </button>
        </>
      )}
    </div>
  )
}

export interface UseAnnotateShortcutsOptions {
  enabled?: boolean
  editingTextId: string | null
  selectedId: string | null
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  onSelectTool: (tool: AnnotationToolMode) => void
  onEscape: () => void
}

const TOOL_KEY_MAP: Record<string, AnnotationToolMode> = {
  v: 'select', b: 'brush', r: 'rect', a: 'arrow', t: 'text',
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnnotateShortcuts({
  enabled = true, editingTextId, selectedId, canUndo, canRedo,
  onUndo, onRedo, onDeleteSelected, onSelectTool, onEscape,
}: UseAnnotateShortcutsOptions): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onEscape(); return }
      if (editingTextId !== null || isEditableElement(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      const lower = event.key.toLowerCase()
      if (mod && lower === 'z') {
        event.preventDefault()
        if (event.shiftKey) { if (canRedo) onRedo() } else if (canUndo) { onUndo() }
        return
      }
      if (mod && lower === 'y') { event.preventDefault(); if (canRedo) onRedo(); return }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault(); onDeleteSelected(); return
      }
      if (mod || event.altKey) return
      const nextTool = TOOL_KEY_MAP[lower]
      if (nextTool) { event.preventDefault(); onSelectTool(nextTool) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, editingTextId, selectedId, canUndo, canRedo, onUndo, onRedo, onDeleteSelected, onSelectTool, onEscape])
}

export interface AnnotateCanvasProps {
  image: WorkspaceImageInput
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  activeTool: AnnotationToolMode
  color: string
  strokeWidth: number
  fontSize: number
  layers: readonly AnnotationLayer[]
  selectedId: string | null
  editingTextId: string | null
  maxHeightClass?: string
  onSelect: (id: string | null) => void
  onEditingTextIdChange: (id: string | null) => void
  onCommitLayers: (next: AnnotationLayer[]) => void
}

type PointerSession =
  | { kind: 'draw-brush'; id: string; points: AnnotationPoint[] }
  | { kind: 'draw-rect'; id: string; start: AnnotationPoint }
  | { kind: 'draw-arrow'; id: string; start: AnnotationPoint }
  | { kind: 'move'; id: string; start: AnnotationPoint; origin: AnnotationLayer; dirty: boolean }
  | { kind: 'resize'; id: string; handle: AnnotationResizeHandle; start: AnnotationPoint; startBounds: AnnotationBounds; origin: AnnotationLayer; dirty: boolean }

function renderArrowSvg(layer: ArrowAnnotationLayer, imgW: number, imgH: number, minDim: number): ReactNode {
  const x1 = layer.x1 * imgW
  const y1 = layer.y1 * imgH
  const x2 = layer.x2 * imgW
  const y2 = layer.y2 * imgH
  const strokePx = Math.max(1.5, layer.strokeWidth * minDim)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const headLen = Math.min(dist * 0.6, Math.max(strokePx * 3.4, 12))
  const headHalfW = headLen * 0.44
  const backX = x2 - Math.cos(angle) * headLen
  const backY = y2 - Math.sin(angle) * headLen
  const perpX = -Math.sin(angle) * headHalfW
  const perpY = Math.cos(angle) * headHalfW
  const headPoints = `${x2},${y2} ${backX + perpX},${backY + perpY} ${backX - perpX},${backY - perpY}`

  return (
    <g key={layer.id} data-testid={`annotate-layer-${layer.id}`}>
      <line
        x1={x1}
        y1={y1}
        x2={dist > headLen * 0.75 ? x2 - Math.cos(angle) * headLen * 0.72 : x2}
        y2={dist > headLen * 0.75 ? y2 - Math.sin(angle) * headLen * 0.72 : y2}
        stroke={layer.color}
        strokeWidth={strokePx}
        strokeLinecap="round"
      />
      {dist >= 2 && <polygon points={headPoints} fill={layer.color} />}
    </g>
  )
}

function renderLayerSvg(
  layer: AnnotationLayer,
  imgW: number,
  imgH: number,
  minDim: number,
  editingTextId: string | null,
): ReactNode {
  const strokePx = Math.max(1.5, layer.strokeWidth * minDim)
  if (layer.type === 'brush') {
    const d = buildSmoothSvgPath(layer.points, imgW, imgH)
    return d ? (
      <path key={layer.id} data-testid={`annotate-layer-${layer.id}`} d={d} fill="none" stroke={layer.color} strokeWidth={strokePx} strokeLinecap="round" strokeLinejoin="round" />
    ) : null
  }
  if (layer.type === 'rect') {
    const rx = Math.max(0, (layer.cornerRadius ?? DEFAULT_CORNER_RADIUS) * minDim)
    return (
      <rect key={layer.id} data-testid={`annotate-layer-${layer.id}`} x={layer.x * imgW} y={layer.y * imgH} width={Math.max(1, layer.width * imgW)} height={Math.max(1, layer.height * imgH)} rx={rx} ry={rx} fill="none" stroke={layer.color} strokeWidth={strokePx} />
    )
  }
  if (layer.type === 'arrow') return renderArrowSvg(layer, imgW, imgH, minDim)
  if (layer.id === editingTextId) return null
  const fontPx = Math.max(10, layer.fontSize * minDim)
  return (
    <foreignObject key={layer.id} data-testid={`annotate-layer-${layer.id}`} x={layer.x * imgW} y={layer.y * imgH} width={Math.max(fontPx * 2, layer.width * imgW)} height={Math.max(fontPx * 1.6, layer.height * imgH)} style={{ overflow: 'visible' }}>
      <div style={{ color: layer.color, fontSize: `${fontPx}px`, lineHeight: 1.25, fontWeight: 700, fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textShadow: getTextContrastHalo(layer.color), padding: `${Math.max(2, fontPx * 0.1)}px` }}>
        {layer.text}
      </div>
    </foreignObject>
  )
}

export function AnnotateCanvas({
  image, theme, locale, activeTool, color, strokeWidth, fontSize,
  layers, selectedId, editingTextId, maxHeightClass = 'max-h-[460px]',
  onSelect, onEditingTextIdChange, onCommitLayers,
}: AnnotateCanvasProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const frameRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const sessionRef = useRef<PointerSession | null>(null)

  const [frameSize, setFrameSize] = useState({ width: Math.max(1, image.width), height: Math.max(1, image.height) })
  const [draftLayer, setDraftLayer] = useState<AnnotationLayer | null>(null)
  const [liveOverride, setLiveOverride] = useState<AnnotationLayer | null>(null)
  const [textDraftState, setTextDraftState] = useState<{ id: string; text: string } | null>(null)

  const imgW = Math.max(1, image.width)
  const imgH = Math.max(1, image.height)
  const minDim = Math.min(imgW, imgH)

  useEffect(() => {
    const el = frameRef.current
    if (!el || typeof window === 'undefined') return
    const sync = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setFrameSize({ width: rect.width, height: rect.height })
    }
    sync()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [image.width, image.height])

  const editingLayer = useMemo(
    () => (editingTextId ? layers.find((l): l is TextAnnotationLayer => l.id === editingTextId && l.type === 'text') ?? null : null),
    [editingTextId, layers],
  )
  const textDraft = editingLayer
    ? (textDraftState?.id === editingLayer.id ? textDraftState.text : editingLayer.text)
    : ''

  useEffect(() => {
    if (!editingTextId) return
    const ta = textAreaRef.current
    if (ta) { ta.focus(); ta.select() }
  }, [editingTextId])

  const commitInlineText = (rawValue: string) => {
    if (!editingTextId) return
    const target = layers.find((l): l is TextAnnotationLayer => l.id === editingTextId && l.type === 'text')
    setTextDraftState(null)
    onEditingTextIdChange(null)
    if (!target) return
    if (!rawValue.trim()) {
      onCommitLayers(layers.filter((l) => l.id !== target.id))
      onSelect(null)
      return
    }
    const lineCount = Math.max(1, rawValue.split('\n').length)
    const minHeight = Math.min(1 - target.y, Math.max(target.height, target.fontSize * 1.35 * lineCount))
    if (rawValue !== target.text || Math.abs(minHeight - target.height) > 0.002) {
      onCommitLayers(layers.map((l) => (l.id === target.id ? { ...target, text: rawValue, height: minHeight } : l)))
    }
  }

  const clientToNorm = (clientX: number, clientY: number): AnnotationPoint | null => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return null
    return { x: clamp01((clientX - rect.left) / rect.width), y: clamp01((clientY - rect.top) / rect.height) }
  }

  const renderedLayers = useMemo(() => {
    const base = liveOverride ? layers.map((l) => (l.id === liveOverride.id ? liveOverride : l)) : [...layers]
    if (draftLayer) base.push(draftLayer)
    return base
  }, [draftLayer, layers, liveOverride])

  const selectedLayer = useMemo(
    () => (selectedId ? renderedLayers.find((l) => l.id === selectedId) ?? null : null),
    [renderedLayers, selectedId],
  )
  const selectedBounds = useMemo(
    () => (selectedLayer && selectedLayer.id !== editingTextId ? getAnnotationBounds(selectedLayer) : null),
    [editingTextId, selectedLayer],
  )

  const handleSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (editingTextId) { commitInlineText(textDraft); return }
    const pt = clientToNorm(event.clientX, event.clientY)
    if (!pt) return

    if (activeTool === 'brush') {
      onSelect(null)
      const id = nanoid(8)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      sessionRef.current = { kind: 'draw-brush', id, points: [pt] }
      setDraftLayer({ id, type: 'brush', color, strokeWidth, points: [pt] })
      return
    }

    const hit = hitTestAnnotationLayers(layers, pt)
    if (hit) {
      onSelect(hit.id)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      sessionRef.current = { kind: 'move', id: hit.id, start: pt, origin: hit, dirty: false }
      return
    }
    if (activeTool === 'select') { onSelect(null); return }

    if (activeTool === 'rect') {
      onSelect(null)
      const id = nanoid(8)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      sessionRef.current = { kind: 'draw-rect', id, start: pt }
      setDraftLayer({ id, type: 'rect', color, strokeWidth, x: pt.x, y: pt.y, width: 0.001, height: 0.001, cornerRadius: DEFAULT_CORNER_RADIUS })
      return
    }
    if (activeTool === 'arrow') {
      onSelect(null)
      const id = nanoid(8)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      sessionRef.current = { kind: 'draw-arrow', id, start: pt }
      setDraftLayer({ id, type: 'arrow', color, strokeWidth, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y })
      return
    }
    if (activeTool === 'text') {
      event.preventDefault()
      const id = nanoid(8)
      const boxW = 0.28
      const boxH = Math.max(fontSize * 1.45, 0.08)
      const created: TextAnnotationLayer = {
        id, type: 'text', color, strokeWidth, fontSize, text: s.annotate.defaultText,
        x: Math.max(0.02, Math.min(1 - boxW - 0.02, pt.x - boxW * 0.2)),
        y: Math.max(0.02, Math.min(1 - boxH - 0.02, pt.y - boxH * 0.5)),
        width: boxW, height: boxH,
      }
      onCommitLayers([...layers, created])
      onSelect(id)
      setTextDraftState({ id, text: created.text })
      onEditingTextIdChange(id)
    }
  }

  const handleSurfaceDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (activeTool === 'brush') return
    const pt = clientToNorm(event.clientX, event.clientY)
    const hit = pt ? hitTestAnnotationLayers(layers, pt) : null
    if (hit && hit.type === 'text') { event.preventDefault(); onSelect(hit.id); setTextDraftState({ id: hit.id, text: hit.text }); onEditingTextIdChange(hit.id) }
  }

  const handleSurfacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session) return
    const pt = clientToNorm(event.clientX, event.clientY)
    if (!pt) return
    if (session.kind === 'draw-brush') {
      const prev = session.points[session.points.length - 1]
      if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.002) return
      const nextPoints = [...session.points, pt]
      session.points = nextPoints
      setDraftLayer({ id: session.id, type: 'brush', color, strokeWidth, points: nextPoints })
      return
    }
    if (session.kind === 'draw-rect') {
      setDraftLayer({
        id: session.id, type: 'rect', color, strokeWidth, cornerRadius: DEFAULT_CORNER_RADIUS,
        x: Math.min(session.start.x, pt.x), y: Math.min(session.start.y, pt.y),
        width: Math.abs(pt.x - session.start.x), height: Math.abs(pt.y - session.start.y),
      })
      return
    }
    if (session.kind === 'draw-arrow') {
      setDraftLayer({ id: session.id, type: 'arrow', color, strokeWidth, x1: session.start.x, y1: session.start.y, x2: pt.x, y2: pt.y })
      return
    }
    if (session.kind === 'move') {
      const dx = pt.x - session.start.x
      const dy = pt.y - session.start.y
      if (!session.dirty && Math.hypot(dx, dy) < 0.002) return
      session.dirty = true
      setLiveOverride(moveAnnotationLayer(session.origin, dx, dy))
      return
    }
    session.dirty = true
    const nextBounds = computeResizedBounds(session.startBounds, session.handle, pt.x - session.start.x, pt.y - session.start.y)
    setLiveOverride(resizeAnnotationLayer(session.origin, session.handle, nextBounds))
  }

  const finishPointerSession = () => {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null
    if (session.kind === 'draw-brush') {
      const simplified = simplifyBrushPoints(session.points)
      if (simplified.length > 0) {
        const created: BrushAnnotationLayer = { id: session.id, type: 'brush', color, strokeWidth, points: simplified }
        onCommitLayers([...layers, created])
      }
      setDraftLayer(null)
      return
    }
    if (session.kind === 'draw-rect') {
      if (draftLayer?.type === 'rect' && draftLayer.width >= 0.01 && draftLayer.height >= 0.01) {
        const created: RectAnnotationLayer = draftLayer
        onCommitLayers([...layers, created])
        onSelect(created.id)
      }
      setDraftLayer(null)
      return
    }
    if (session.kind === 'draw-arrow') {
      if (draftLayer?.type === 'arrow' && Math.hypot(draftLayer.x2 - draftLayer.x1, draftLayer.y2 - draftLayer.y1) >= 0.015) {
        const created: ArrowAnnotationLayer = draftLayer
        onCommitLayers([...layers, created])
        onSelect(created.id)
      }
      setDraftLayer(null)
      return
    }
    if (session.dirty && liveOverride) {
      onCommitLayers(layers.map((l) => (l.id === liveOverride.id ? liveOverride : l)))
    }
    setLiveOverride(null)
  }

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, handle: AnnotationResizeHandle) => {
    event.stopPropagation()
    if (event.button !== 0 || !selectedLayer) return
    const pt = clientToNorm(event.clientX, event.clientY)
    if (!pt) return
    frameRef.current?.setPointerCapture?.(event.pointerId)
    sessionRef.current = {
      kind: 'resize', id: selectedLayer.id, handle, start: pt,
      startBounds: getAnnotationBounds(selectedLayer), origin: selectedLayer, dirty: false,
    }
  }

  const handleTextAreaKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); commitInlineText(textDraft); return }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); commitInlineText(textDraft) }
  }

  const stageBgStyle = {
    backgroundImage: theme === 'dark'
      ? 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)'
      : 'radial-gradient(rgba(24,24,27,0.1) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
  }
  const cursorClass = activeTool === 'select' ? 'cursor-default' : activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
  const renderScale = frameSize.width / imgW

  return (
    <div
      data-testid="annotate-stage"
      style={stageBgStyle}
      className={`relative flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-xl border p-3 sm:p-4 ${tokens.cardMuted}`}
    >
      <div
        ref={frameRef}
        data-testid="annotate-canvas-surface"
        onPointerDown={handleSurfacePointerDown}
        onPointerMove={handleSurfacePointerMove}
        onPointerUp={finishPointerSession}
        onPointerCancel={finishPointerSession}
        onDoubleClick={handleSurfaceDoubleClick}
        style={{ aspectRatio: `${imgW} / ${imgH}` }}
        className={`relative max-w-full touch-none select-none overflow-visible rounded-lg shadow-md ${maxHeightClass} ${cursorClass}`}
      >
        <img src={image.dataUrl} alt={image.name} draggable={false} className={`block h-full w-full rounded-lg object-contain ${maxHeightClass}`} />

        <svg data-testid="annotate-svg-overlay" viewBox={`0 0 ${imgW} ${imgH}`} preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {renderedLayers.map((layer) => renderLayerSvg(layer, imgW, imgH, minDim, editingTextId))}
        </svg>

        {selectedBounds && (
          <div
            data-testid="annotate-selection-box"
            style={{ left: `${selectedBounds.x * 100}%`, top: `${selectedBounds.y * 100}%`, width: `${selectedBounds.width * 100}%`, height: `${selectedBounds.height * 100}%` }}
            className="pointer-events-none absolute rounded-xs border-2 border-dashed border-[#3b82f6]"
          >
            {RESIZE_HANDLES.map((handle) => (
              <button
                key={handle.id}
                type="button"
                aria-label={handle.label}
                data-testid={`annotate-handle-${handle.id}`}
                onPointerDown={(e) => handleResizePointerDown(e, handle.id)}
                className={`pointer-events-auto absolute h-3 w-3 touch-none rounded-full border-2 border-[#3b82f6] bg-white shadow-sm transition-transform hover:scale-125 after:absolute after:-inset-2.5 after:content-[''] ${tokens.focusRing} ${handle.posClass} ${handle.cursor}`}
              />
            ))}
          </div>
        )}

        {editingLayer && (
          <textarea
            ref={textAreaRef}
            data-testid="annotate-inline-textarea"
            aria-label={s.annotate.editTextHint}
            value={textDraft}
            onChange={(e) => setTextDraftState({ id: editingLayer.id, text: e.target.value })}
            onBlur={() => commitInlineText(textDraft)}
            onKeyDown={handleTextAreaKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              left: `${editingLayer.x * 100}%`, top: `${editingLayer.y * 100}%`,
              width: `${Math.max(18, editingLayer.width * 100)}%`, minHeight: `${Math.max(8, editingLayer.height * 100)}%`,
              color: editingLayer.color, fontSize: `${Math.max(12, editingLayer.fontSize * minDim * renderScale)}px`,
              lineHeight: 1.25, textShadow: getTextContrastHalo(editingLayer.color),
            }}
            className="absolute z-20 resize-none overflow-hidden rounded border-2 border-[#3b82f6] bg-black/25 p-1 font-bold outline-none backdrop-blur-[1px]"
          />
        )}
      </div>
    </div>
  )
}
