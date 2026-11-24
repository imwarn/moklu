/**
 * [INPUT]: depends on react, ModalShell from @/components/ui/ModalShell, getP1ToolsStrings from ../locales/p1ToolsLocale, getWorkspaceThemeTokens from ../themeTokens, and workspace types from ../types
 * [OUTPUT]: exports SeamOverlapPills and OverlapTunerModal components for 50% ghost-overlay vertical seam fine-tuning
 * [POS]: interactive seam overlap fine-tuner dialog and per-seam pill strip inside src/workspace/tools; paired with MergeQuickTool
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { getP1ToolsStrings } from '../locales/p1ToolsLocale'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceMergeSeamInfo,
  WorkspaceTheme,
} from '../types'

const MIN_REMAINING_PX = 16
const VIEWPORT_HEIGHT_PX = 320
const DEFAULT_VIEWPORT_WIDTH_PX = 440

function computeEffectiveWidth(img: Pick<WorkspaceImageInput, 'width' | 'height' | 'rotation'>): number {
  const rot = img.rotation ?? 0
  return Math.max(1, rot === 90 || rot === 270 ? img.height : img.width)
}

function computeEffectiveHeight(img: Pick<WorkspaceImageInput, 'width' | 'height' | 'rotation'>): number {
  const rot = img.rotation ?? 0
  return Math.max(1, rot === 90 || rot === 270 ? img.width : img.height)
}

function clampOverlapPx(value: number, bottomEffHeight: number): number {
  const safeH = Math.max(1, Math.round(bottomEffHeight))
  const maxOverlap = Math.max(0, safeH - Math.min(MIN_REMAINING_PX, safeH))
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(Math.round(value), maxOverlap))
}

function stepOverlapByKey(
  current: number,
  key: string,
  shiftKey: boolean,
  maxOverlap: number,
): number | null {
  const delta = shiftKey ? 10 : 1
  if (key === 'ArrowUp') return Math.min(maxOverlap, current + delta)
  if (key === 'ArrowDown') return Math.max(0, current - delta)
  if (key === 'Home') return 0
  if (key === 'End') return maxOverlap
  return null
}

export interface SeamOverlapPillsProps {
  seams: WorkspaceMergeSeamInfo[]
  overrides: Record<number, number>
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  onTuneSeam: (seamIndex: number) => void
}

export function SeamOverlapPills({
  seams,
  overrides,
  locale,
  theme,
  onTuneSeam,
}: SeamOverlapPillsProps) {
  const p1 = getP1ToolsStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  if (seams.length === 0) return null

  return (
    <div data-testid="merge-seam-pills" className="mt-2.5 flex flex-wrap items-center gap-2">
      {seams.map((seam) => {
        const isManual = overrides[seam.index] !== undefined
        const px = Math.round(seam.appliedOverlapPx)
        const label = isManual ? p1.merge.seamCustomFolded(px) : p1.merge.seamAutoFolded(px)
        return (
          <div
            key={seam.index}
            data-testid={`merge-seam-pill-${seam.index}`}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${
              isManual ? tokens.accentChip : `${tokens.card} ${tokens.text}`
            }`}
          >
            {seams.length > 1 && (
              <span className={`font-semibold ${tokens.textSubtle}`}>
                {p1.merge.seamBadgePrefix} #{seam.index + 1}
              </span>
            )}
            <span>{label}</span>
            <button
              type="button"
              data-testid={`merge-seam-tune-${seam.index}`}
              onClick={() => onTuneSeam(seam.index)}
              className={`rounded-md border px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              {p1.merge.fineTune}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export interface OverlapTunerModalProps {
  open: boolean
  seamIndex: number
  topImage: WorkspaceImageInput
  bottomImage: WorkspaceImageInput
  autoOverlapPx: number
  initialOverlapPx: number
  fixedBottomPx?: number
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  onConfirm: (seamIndex: number, overlapPx: number) => void
  onResetAuto: (seamIndex: number) => void
  onClose: () => void
}

export function OverlapTunerModal({
  open,
  seamIndex,
  topImage,
  bottomImage,
  autoOverlapPx,
  initialOverlapPx,
  fixedBottomPx = 0,
  locale,
  theme,
  onConfirm,
  onResetAuto,
  onClose,
}: OverlapTunerModalProps) {
  const p1 = getP1ToolsStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const rangeId = useId()
  const numberId = useId()
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startY: number; startOverlap: number } | null>(null)

  const topEffW = computeEffectiveWidth(topImage)
  const topEffH = computeEffectiveHeight(topImage)
  const botEffW = computeEffectiveWidth(bottomImage)
  const botEffH = computeEffectiveHeight(bottomImage)
  const maxOverlap = Math.max(0, Math.round(botEffH) - Math.min(MIN_REMAINING_PX, Math.round(botEffH)))
  const safeAuto = clampOverlapPx(autoOverlapPx, botEffH)

  const [overlapPx, setOverlapPx] = useState<number>(() => clampOverlapPx(initialOverlapPx, botEffH))
  const [stageWidth, setStageWidth] = useState<number>(DEFAULT_VIEWPORT_WIDTH_PX)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof window === 'undefined') return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 40) setStageWidth(rect.width)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [open])

  const displayW = Math.max(120, stageWidth)
  const topScale = displayW / topEffW
  const botScale = displayW / botEffW
  const seamLineY = VIEWPORT_HEIGHT_PX / 2
  const topVisibleBottomPx = Math.max(1, topEffH - Math.max(0, fixedBottomPx))
  const topImgTop = seamLineY - topVisibleBottomPx * topScale
  const botImgTop = seamLineY - overlapPx * botScale

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startOverlap: overlapPx }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state || state.pointerId !== event.pointerId) return
    const deltaClientY = event.clientY - state.startY
    const deltaSrcPx = Math.round(-deltaClientY / Math.max(0.05, botScale))
    setOverlapPx(clampOverlapPx(state.startOverlap + deltaSrcPx, botEffH))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state || state.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const handleViewportKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepOverlapByKey(overlapPx, event.key, event.shiftKey, maxOverlap)
    if (next === null) return
    event.preventDefault()
    setOverlapPx(next)
  }

  const handleReset = () => {
    setOverlapPx(safeAuto)
    onResetAuto(seamIndex)
  }

  const handleApply = () => {
    onConfirm(seamIndex, overlapPx)
    onClose()
  }

  const header = (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className={`text-sm font-bold ${tokens.text}`}>{p1.overlapModal.title}</h2>
        <p className={`mt-0.5 text-xs ${tokens.textSubtle}`}>
          {p1.overlapModal.seamLabel(seamIndex + 1, seamIndex + 1, seamIndex + 2)}
        </p>
      </div>
      <button
        type="button"
        data-testid="overlap-tuner-close"
        aria-label={p1.overlapModal.cancel}
        onClick={onClose}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
      >
        ×
      </button>
    </div>
  )

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={p1.overlapModal.title}
      header={header}
      showCloseButton={false}
      maxWidth="max-w-2xl"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-3 sm:p-4 backdrop-blur-xs"
      backdropStyle={{}}
      panelClassName={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border p-3.5 sm:p-5 shadow-2xl ${tokens.card}`}
      panelStyle={{}}
    >
      <div data-testid="overlap-tuner-modal" className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <p className={`text-xs leading-relaxed ${tokens.textMuted}`}>{p1.overlapModal.hint}</p>

        {/* 50% Ghost-Overlay Interactive Alignment Viewport */}
        <div
          ref={stageRef}
          role="slider"
          tabIndex={0}
          data-testid="overlap-ghost-viewport"
          aria-label={p1.overlapModal.viewportAriaLabel}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={maxOverlap}
          aria-valuenow={overlapPx}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleViewportKeyDown}
          style={{ height: `${VIEWPORT_HEIGHT_PX}px` }}
          className={`relative w-full touch-none select-none overflow-hidden rounded-xl border bg-zinc-950 ${
            dragging ? 'cursor-grabbing ring-2 ring-accent' : 'cursor-ns-resize'
          } ${tokens.focusRing} ${tokens.border}`}
        >
          {/* Top image anchored to the seam line */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: `${seamLineY}px` }}
          >
            <img
              src={topImage.dataUrl}
              alt={topImage.name}
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: `${topImgTop}px`,
                width: `${displayW}px`,
                height: `${topEffH * topScale}px`,
                maxWidth: 'none',
              }}
            />
          </div>

          {/* Bottom image 50% ghost overlay shifted by overlapPx */}
          <img
            src={bottomImage.dataUrl}
            alt={bottomImage.name}
            data-testid="overlap-ghost-image"
            draggable={false}
            style={{
              position: 'absolute',
              left: 0,
              top: `${botImgTop}px`,
              width: `${displayW}px`,
              height: `${botEffH * botScale}px`,
              maxWidth: 'none',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />

          {/* Horizontal seam reference guide */}
          <div
            aria-hidden="true"
            style={{ top: `${seamLineY}px` }}
            className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-accent shadow-[0_0_8px_rgba(249,115,22,0.5)]"
          />

          <span className="pointer-events-none absolute left-2.5 top-2 z-20 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-100">
            {p1.overlapModal.topEdgeBadge}
          </span>
          <span className="pointer-events-none absolute bottom-2 left-2.5 z-20 rounded-md bg-accent-strong/90 px-2 py-0.5 text-[10px] font-semibold text-accent-fg">
            {p1.overlapModal.bottomGhostBadge}
          </span>
          <span className="pointer-events-none absolute right-2.5 top-2 z-20 rounded-md bg-zinc-950/80 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-zinc-100">
            {overlapPx} px
          </span>
        </div>

        {/* Precision Controls: Range + Numeric Input + Step Buttons */}
        <div className={`space-y-3 rounded-xl border p-3.5 ${tokens.cardMuted}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={rangeId} className={`text-xs font-semibold ${tokens.textMuted}`}>
              {p1.overlapModal.overlapHeightLabel}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {([-10, -1, 1, 10] as const).map((delta) => (
                <button
                  key={delta}
                  type="button"
                  data-testid={`overlap-step-${delta > 0 ? `plus-${delta}` : `minus-${Math.abs(delta)}`}`}
                  onClick={() => setOverlapPx((prev) => clampOverlapPx(prev + delta, botEffH))}
                  className={`min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tokens.focusRing} ${tokens.pillIdle}`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
              <input
                id={numberId}
                type="number"
                data-testid="overlap-tuner-number"
                aria-label={p1.overlapModal.overlapHeightLabel}
                min={0}
                max={maxOverlap}
                value={overlapPx}
                onChange={(e) => setOverlapPx(clampOverlapPx(Number(e.target.value), botEffH))}
                className={`h-7 w-20 rounded-md border px-2 text-right text-xs font-semibold tabular-nums ${tokens.input}`}
              />
            </div>
          </div>

          <input
            id={rangeId}
            type="range"
            data-testid="overlap-tuner-range"
            min={0}
            max={maxOverlap}
            step={1}
            value={overlapPx}
            onChange={(e) => setOverlapPx(clampOverlapPx(Number(e.target.value), botEffH))}
            className={`h-1.5 w-full cursor-pointer accent-accent ${tokens.focusRing}`}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 border-current/10">
          <button
            type="button"
            data-testid="overlap-tuner-reset"
            onClick={handleReset}
            className={`min-h-9 rounded-xl px-3.5 py-2 text-xs font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
          >
            {p1.overlapModal.resetToAuto(safeAuto)}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-9 rounded-xl px-3.5 py-2 text-xs font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              {p1.overlapModal.cancel}
            </button>
            <button
              type="button"
              data-testid="overlap-tuner-confirm"
              onClick={handleApply}
              className={`min-h-9 rounded-xl px-4 py-2 text-xs font-semibold ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {p1.overlapModal.confirm}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
