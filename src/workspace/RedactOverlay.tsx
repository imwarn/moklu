/**
 * [INPUT]: depends on react, nanoid, QuickMockup and QuickScreenshotFit from @/utils/quickDesign, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, coordinate helpers from ./redact, and workspace types from ./types
 * [OUTPUT]: exports RedactToolMode, RedactToolbar, RedactOverlay, RedactToolbarProps, and RedactOverlayProps for interactive 3-second Blur/Pixelate/Spotlight drawing, 4-corner resizing, and Delete/Backspace removal
 * [POS]: interactive redaction and spotlight overlay UI in src/workspace; layered above QuickDesignPreview inside MockupQuickTool while preserving unredacted source data for Studio handoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { QuickMockup, QuickScreenshotFit } from '@/utils/quickDesign'
import { getWorkspaceStrings } from './i18n'
import {
  computeMockupStageMetrics,
  defaultIntensityForKind,
  imageNormRectToStageNorm,
  moveRegionByDelta,
  normalizeDragBox,
  resizeRegionByCorner,
  stagePointToImageNorm,
  type NormalizedRect,
  type RedactResizeCorner,
} from './redact'
import { getWorkspaceThemeTokens } from './themeTokens'
import type {
  WorkspaceLocale,
  WorkspaceRedactionRegion,
  WorkspaceTheme,
} from './types'

export type RedactToolMode = WorkspaceRedactionRegion['kind'] | null

export interface RedactToolbarProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  activeMode: RedactToolMode
  intensity: number
  spotlightZoom: boolean
  regions: readonly WorkspaceRedactionRegion[]
  selectedId: string | null
  onModeChange: (next: RedactToolMode) => void
  onIntensityChange: (next: number) => void
  onSpotlightZoomChange: (zoomed: boolean) => void
  onDeleteSelected: () => void
  onClearAll: () => void
}

const CORNERS: readonly { id: RedactResizeCorner; posClass: string; cursor: string }[] = [
  { id: 'nw', posClass: '-left-1.5 -top-1.5', cursor: 'cursor-nwse-resize' },
  { id: 'ne', posClass: '-right-1.5 -top-1.5', cursor: 'cursor-nesw-resize' },
  { id: 'sw', posClass: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize' },
  { id: 'se', posClass: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize' },
]

export function RedactToolbar({
  theme,
  locale,
  activeMode,
  intensity,
  spotlightZoom,
  regions,
  selectedId,
  onModeChange,
  onIntensityChange,
  onSpotlightZoomChange,
  onDeleteSelected,
  onClearAll,
}: RedactToolbarProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const selectedRegion = regions.find((r) => r.id === selectedId) ?? null
  const displayKind = selectedRegion?.kind ?? activeMode
  const showIntensitySlider = displayKind === 'blur' || displayKind === 'pixelate'
  const showSpotlightToggle = displayKind === 'spotlight'
  const effectiveIntensity = selectedRegion && selectedRegion.kind !== 'spotlight'
    ? selectedRegion.intensity
    : intensity
  const effectiveZoom = selectedRegion && selectedRegion.kind === 'spotlight'
    ? selectedRegion.intensity > 1
    : spotlightZoom

  const modes: Array<{ id: WorkspaceRedactionRegion['kind']; label: string }> = [
    { id: 'blur', label: s.redact.blur },
    { id: 'pixelate', label: s.redact.pixelate },
    { id: 'spotlight', label: s.redact.spotlight },
  ]

  return (
    <div
      data-testid="redact-micro-toolbar"
      aria-label={s.redact.toolbarLabel}
      className={`mb-3 space-y-2 rounded-xl border px-3 py-2 ${tokens.card}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-semibold ${tokens.textMuted}`}>
            {s.redact.toolbarLabel}
          </span>
          {modes.map((item) => {
            const active = activeMode === item.id
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`redact-mode-${item.id}`}
                aria-pressed={active}
                onClick={() => onModeChange(active ? null : item.id)}
                className={`min-h-7 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${
                  active ? tokens.pillActive : tokens.pillIdle
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {regions.length > 0 && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${tokens.accentChip}`}>
              {regions.length} {s.redact.regionsCount}
            </span>
          )}
          {selectedId && (
            <button
              type="button"
              data-testid="redact-delete-selected"
              onClick={onDeleteSelected}
              className={`min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
            >
              {s.redact.deleteSelected}
            </button>
          )}
          {regions.length > 0 && (
            <button
              type="button"
              data-testid="redact-clear-all"
              onClick={onClearAll}
              className={`min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
            >
              {s.redact.clearAll}
            </button>
          )}
        </div>
      </div>

      {(showIntensitySlider || showSpotlightToggle || activeMode !== null) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-2">
          {showIntensitySlider && (
            <label className="flex min-w-[180px] flex-1 items-center gap-2 text-[11px]">
              <span className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.redact.intensity}</span>
              <input
                type="range"
                data-testid="redact-intensity-slider"
                min={4}
                max={36}
                step={2}
                value={effectiveIntensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
                className={`h-1.5 w-full cursor-pointer accent-accent ${tokens.focusRing}`}
              />
              <span className={`w-8 text-right font-mono tabular-nums ${tokens.text}`}>{effectiveIntensity}px</span>
            </label>
          )}
          {showSpotlightToggle && (
            <label className={`flex cursor-pointer items-center gap-1.5 text-[11px] font-medium ${tokens.textMuted}`}>
              <input
                type="checkbox"
                data-testid="redact-spotlight-zoom"
                checked={effectiveZoom}
                onChange={(e) => onSpotlightZoomChange(e.target.checked)}
                className={`h-3.5 w-3.5 accent-accent ${tokens.focusRing}`}
              />
              <span>{s.redact.spotlightZoom}</span>
            </label>
          )}
          <span className={`text-[11px] ${tokens.textSubtle}`}>{s.redact.drawHint}</span>
        </div>
      )}
    </div>
  )
}

export interface RedactOverlayProps {
  canvasWidth: number
  canvasHeight: number
  mockup: QuickMockup
  scaleFactor: number
  screenshotWidth: number
  screenshotHeight: number
  screenshotFit: QuickScreenshotFit
  activeMode: RedactToolMode
  intensity: number
  spotlightZoom: boolean
  regions: readonly WorkspaceRedactionRegion[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChangeRegions: (next: WorkspaceRedactionRegion[]) => void
}

interface ViewBoxBounds {
  left: number
  top: number
  width: number
  height: number
}

type DragSession =
  | { kind: 'draw'; startX: number; startY: number; currentX: number; currentY: number }
  | { kind: 'move'; id: string; startX: number; startY: number; origin: WorkspaceRedactionRegion }
  | { kind: 'resize'; id: string; corner: RedactResizeCorner; origin: WorkspaceRedactionRegion }

const STAGE_INNER_PADDING_PX = 12

function computeFittedViewBox(containerW: number, containerH: number, vbW: number, vbH: number): ViewBoxBounds {
  const innerW = Math.max(1, containerW - STAGE_INNER_PADDING_PX * 2)
  const innerH = Math.max(1, containerH - STAGE_INNER_PADDING_PX * 2)
  const scale = Math.min(innerW / vbW, innerH / vbH)
  const width = vbW * scale
  const height = vbH * scale
  return {
    left: STAGE_INNER_PADDING_PX + (innerW - width) / 2,
    top: STAGE_INNER_PADDING_PX + (innerH - height) / 2,
    width,
    height,
  }
}

export function RedactOverlay({
  canvasWidth,
  canvasHeight,
  mockup,
  scaleFactor,
  screenshotWidth,
  screenshotHeight,
  screenshotFit,
  activeMode,
  intensity,
  spotlightZoom,
  regions,
  selectedId,
  onSelect,
  onChangeRegions,
}: RedactOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const [drag, setDrag] = useState<DragSession | null>(null)

  const metrics = useMemo(
    () =>
      computeMockupStageMetrics({
        canvasWidth,
        canvasHeight,
        mockup,
        scaleFactor,
        screenshotWidth,
        screenshotHeight,
        screenshotFit,
      }),
    [canvasWidth, canvasHeight, mockup, scaleFactor, screenshotWidth, screenshotHeight, screenshotFit],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof window === 'undefined') return
    const sync = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    sync()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Delete or Backspace removes the currently selected redaction region.
  useEffect(() => {
    if (!selectedId || typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      event.preventDefault()
      onChangeRegions(regions.filter((r) => r.id !== selectedId))
      onSelect(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onChangeRegions, onSelect, regions, selectedId])

  const vbBounds = useMemo(() => {
    if (!containerSize) return null
    return computeFittedViewBox(containerSize.width, containerSize.height, metrics.canvasWidth, metrics.canvasHeight)
  }, [containerSize, metrics.canvasWidth, metrics.canvasHeight])

  const clientToImageNorm = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const bounds = computeFittedViewBox(rect.width, rect.height, metrics.canvasWidth, metrics.canvasHeight)
    const stageX = (clientX - rect.left - bounds.left) / Math.max(1, bounds.width)
    const stageY = (clientY - rect.top - bounds.top) / Math.max(1, bounds.height)
    return stagePointToImageNorm(stageX, stageY, metrics.imageNorm)
  }

  const handleSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (!activeMode) {
      onSelect(null)
      return
    }
    const pt = clientToImageNorm(event.clientX, event.clientY)
    if (!pt) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ kind: 'draw', startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y })
  }

  const handleSurfacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const pt = clientToImageNorm(event.clientX, event.clientY)
    if (!pt) return

    if (drag.kind === 'draw') {
      setDrag({ ...drag, currentX: pt.x, currentY: pt.y })
      return
    }
    if (drag.kind === 'move') {
      const updated = moveRegionByDelta(drag.origin, pt.x - drag.startX, pt.y - drag.startY)
      onChangeRegions(regions.map((r) => (r.id === drag.id ? updated : r)))
      return
    }
    if (drag.kind === 'resize') {
      const updated = resizeRegionByCorner(drag.origin, drag.corner, pt.x, pt.y)
      onChangeRegions(regions.map((r) => (r.id === drag.id ? updated : r)))
    }
  }

  const finishDrag = () => {
    if (!drag) return
    if (drag.kind === 'draw' && activeMode) {
      const box = normalizeDragBox(drag.startX, drag.startY, drag.currentX, drag.currentY)
      if (box) {
        const nextRegion: WorkspaceRedactionRegion = {
          id: nanoid(8),
          kind: activeMode,
          ...box,
          intensity:
            activeMode === 'spotlight'
              ? spotlightZoom
                ? 1.25
                : 1
              : intensity || defaultIntensityForKind(activeMode),
        }
        onChangeRegions([...regions, nextRegion])
        onSelect(nextRegion.id)
      }
    }
    setDrag(null)
  }

  const draftStageRect: NormalizedRect | null = useMemo(() => {
    if (!drag || drag.kind !== 'draw') return null
    const raw = normalizeDragBox(drag.startX, drag.startY, drag.currentX, drag.currentY, 0.004)
    if (!raw) return null
    return imageNormRectToStageNorm(raw, metrics.imageNorm, metrics.screenNorm)
  }, [drag, metrics.imageNorm, metrics.screenNorm])

  const interactive = activeMode !== null || regions.length > 0
  if (!interactive) return null

  return (
    <div
      ref={containerRef}
      data-testid="redact-overlay"
      className={`absolute inset-1 z-10 select-none ${
        activeMode || drag ? 'touch-none' : ''
      } ${activeMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={handleSurfacePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div
        style={
          vbBounds
            ? {
                position: 'absolute',
                left: `${vbBounds.left}px`,
                top: `${vbBounds.top}px`,
                width: `${vbBounds.width}px`,
                height: `${vbBounds.height}px`,
              }
            : { position: 'absolute', inset: `${STAGE_INNER_PADDING_PX}px` }
        }
      >
        {/* Subtle screen outline hint while a drawing tool is active */}
        {activeMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-sm border border-dashed border-accent/65"
            style={{
              left: `${metrics.screenNorm.x * 100}%`,
              top: `${metrics.screenNorm.y * 100}%`,
              width: `${metrics.screenNorm.width * 100}%`,
              height: `${metrics.screenNorm.height * 100}%`,
            }}
          />
        )}

        {/* Existing redaction / spotlight regions */}
        {regions.map((region) => {
          const rect = imageNormRectToStageNorm(region, metrics.imageNorm, metrics.screenNorm)
          if (!rect) return null
          const selected = region.id === selectedId
          const borderClass =
            region.kind === 'spotlight'
              ? 'border-amber-300 bg-amber-300/10'
              : 'border-accent bg-accent/15'
          return (
            <div
              key={region.id}
              data-testid={`redact-region-${region.id}`}
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                onSelect(region.id)
                const pt = clientToImageNorm(e.clientX, e.clientY)
                if (!pt) return
                containerRef.current?.setPointerCapture?.(e.pointerId)
                setDrag({ kind: 'move', id: region.id, startX: pt.x, startY: pt.y, origin: region })
              }}
              className={`pointer-events-auto absolute cursor-move touch-none rounded border-2 transition-shadow ${borderClass} ${
                selected ? 'ring-2 ring-white/90 shadow-md' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {selected &&
                CORNERS.map((corner) => (
                  <button
                    key={corner.id}
                    type="button"
                    aria-label={`Resize ${corner.id}`}
                    data-testid={`redact-handle-${corner.id}`}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      containerRef.current?.setPointerCapture?.(e.pointerId)
                      setDrag({ kind: 'resize', id: region.id, corner: corner.id, origin: region })
                    }}
                    className={`absolute h-3 w-3 touch-none rounded-full border-2 border-white bg-accent shadow after:absolute after:-inset-4 after:content-[''] ${corner.posClass} ${corner.cursor}`}
                  />
                ))}
            </div>
          )
        })}

        {/* Active drag preview rectangle */}
        {draftStageRect && (
          <div
            data-testid="redact-draft-box"
            style={{
              left: `${draftStageRect.x * 100}%`,
              top: `${draftStageRect.y * 100}%`,
              width: `${draftStageRect.width * 100}%`,
              height: `${draftStageRect.height * 100}%`,
            }}
            className="pointer-events-none absolute rounded border-2 border-dashed border-accent bg-accent/20"
          />
        )}
      </div>
    </div>
  )
}
