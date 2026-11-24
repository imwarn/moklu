/**
 * [INPUT]: depends on react, formatBytes from ../canvasUtils, getP1ToolsStrings from ../locales/p1ToolsLocale, getWorkspaceThemeTokens from ../themeTokens, and workspace types from ../types
 * [OUTPUT]: exports BeforeAfterSliderProps and BeforeAfterSlider component with draggable/keyboard vertical split divider, 100%/150%/200% zoom pills, mouse wheel zoom, and Copy/Download actions
 * [POS]: interactive before/after compression quality comparison widget inside src/workspace/tools; rendered inside CompressPreviewModal and inline in CompressQuickTool
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { formatBytes } from '../canvasUtils'
import { getP1ToolsStrings } from '../locales/p1ToolsLocale'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type { WorkspaceLocale, WorkspaceTheme } from '../types'

const ZOOM_PRESETS = [100, 150, 200] as const

function clampSplitPercent(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.max(0, Math.min(100, value))
}

function stepSplitByKey(current: number, key: string, shiftKey: boolean): number | null {
  const delta = shiftKey ? 10 : 2
  if (key === 'ArrowLeft') return clampSplitPercent(current - delta)
  if (key === 'ArrowRight') return clampSplitPercent(current + delta)
  if (key === 'Home') return 0
  if (key === 'End') return 100
  return null
}

function clampZoomPercent(value: number): number {
  if (!Number.isFinite(value)) return 100
  return Math.max(100, Math.min(200, Math.round(value)))
}

function stepZoomFromWheel(currentZoom: number, deltaY: number): number {
  const step = deltaY < 0 ? 25 : -25
  return clampZoomPercent(currentZoom + step)
}

function formatSavingsPercent(originalBytes: number, outputBytes: number): { isSaved: boolean; text: string } {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) {
    return { isSaved: true, text: '0.0%' }
  }
  const ratio = ((originalBytes - outputBytes) / originalBytes) * 100
  if (ratio >= 0) {
    return { isSaved: true, text: `${ratio.toFixed(1)}%` }
  }
  return { isSaved: false, text: `${Math.abs(ratio).toFixed(1)}%` }
}

export interface BeforeAfterSliderProps {
  originalSrc: string
  compressedSrc: string
  originalBytes: number
  outputBytes: number
  filename: string
  width: number
  height: number
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  compact?: boolean
  copied?: boolean
  onCopy?: () => void
  onDownload?: () => void
}

export function BeforeAfterSlider({
  originalSrc,
  compressedSrc,
  originalBytes,
  outputBytes,
  filename,
  width,
  height,
  locale,
  theme,
  compact = false,
  copied = false,
  onCopy,
  onDownload,
}: BeforeAfterSliderProps) {
  const p1 = getP1ToolsStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const viewportRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<number | null>(null)
  const [splitPercent, setSplitPercent] = useState<number>(50)
  const [zoomPercent, setZoomPercent] = useState<number>(100)
  const [dragging, setDragging] = useState<boolean>(false)

  const savings = formatSavingsPercent(originalBytes, outputBytes)
  const leftPillText = `${p1.slider.original} (${formatBytes(originalBytes)})`
  const rightPillText = `${p1.slider.compressed} (${formatBytes(outputBytes)} · ${
    savings.isSaved ? `${p1.slider.saved} ${savings.text}` : `${p1.slider.larger} +${savings.text}`
  })`

  const updateFromClientX = (clientX: number) => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const next = ((clientX - rect.left) / rect.width) * 100
    setSplitPercent(clampSplitPercent(next))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    draggingRef.current = event.pointerId
    setDragging(true)
    updateFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return
    updateFromClientX(event.clientX)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    draggingRef.current = null
    setDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepSplitByKey(splitPercent, event.key, event.shiftKey)
    if (next === null) return
    event.preventDefault()
    setSplitPercent(next)
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (event.deltaY === 0) return
    event.preventDefault()
    setZoomPercent((prev) => stepZoomFromWheel(prev, event.deltaY))
  }

  const zoomScale = zoomPercent / 100
  const viewportHeightClass = compact ? 'h-[240px]' : 'h-[52vh] min-h-[280px] max-h-[540px]'

  return (
    <div data-testid="before-after-slider" className="flex w-full flex-col gap-2.5">
      {/* Toolbar: Zoom pills + Copy / Download actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-semibold ${tokens.textMuted}`}>{p1.slider.zoomLabel}</span>
          <div role="group" aria-label={p1.slider.zoomLabel} className="inline-flex items-center gap-1">
            {ZOOM_PRESETS.map((presetZoom) => {
              const active = zoomPercent === presetZoom
              return (
                <button
                  key={presetZoom}
                  type="button"
                  data-testid={`ba-zoom-${presetZoom}`}
                  aria-pressed={active}
                  onClick={() => setZoomPercent(presetZoom)}
                  className={`min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${tokens.focusRing} ${
                    active ? tokens.pillActive : tokens.pillIdle
                  }`}
                >
                  {presetZoom}%
                </button>
              )
            })}
            {!ZOOM_PRESETS.includes(zoomPercent as 100 | 150 | 200) && (
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tokens.accentChip}`}>
                {zoomPercent}%
              </span>
            )}
          </div>
        </div>

        {(onCopy || onDownload) && (
          <div className="flex items-center gap-1.5">
            {onCopy && (
              <button
                type="button"
                data-testid="ba-copy-image"
                onClick={onCopy}
                className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${
                  copied ? tokens.privacyBadge : tokens.buttonSecondary
                }`}
              >
                {copied ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-success" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="5" y="5" width="8" height="8" rx="1.5" />
                    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
                  </svg>
                )}
                <span>{copied ? p1.slider.copied : p1.slider.copyImage}</span>
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                data-testid="ba-download-image"
                onClick={onDownload}
                className={`min-h-8 rounded-lg px-3 py-1 text-xs font-semibold ${tokens.focusRing} ${tokens.buttonPrimary}`}
              >
                {p1.slider.download}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive Split Comparison Stage */}
      <div
        ref={viewportRef}
        role="slider"
        tabIndex={0}
        data-testid="ba-split-viewport"
        aria-label={p1.slider.dividerAriaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(splitPercent)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className={`@container relative w-full touch-none select-none overflow-hidden rounded-xl border bg-zinc-950/90 ${viewportHeightClass} ${
          dragging ? 'cursor-grabbing ring-2 ring-accent' : 'cursor-ew-resize'
        } ${tokens.focusRing} ${tokens.border}`}
      >
        {/* Right / Base Layer: Compressed */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <img
            src={compressedSrc}
            alt={`${p1.slider.compressed}: ${filename}`}
            data-testid="ba-compressed-img"
            width={width}
            height={height}
            draggable={false}
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'center center',
            }}
            className="max-h-full max-w-full object-contain transition-transform duration-75"
          />
        </div>

        {/* Left / Clipped Layer: Original */}
        <div
          data-testid="ba-original-layer"
          style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <img
            src={originalSrc}
            alt={`${p1.slider.original}: ${filename}`}
            data-testid="ba-original-img"
            width={width}
            height={height}
            draggable={false}
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'center center',
            }}
            className="max-h-full max-w-full object-contain transition-transform duration-75"
          />
        </div>

        {/* Vertical Split Line & Handle */}
        <div
          aria-hidden="true"
          data-testid="ba-divider-line"
          style={{ left: `${splitPercent}%` }}
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.65)]"
        >
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent-strong text-accent-fg shadow-md">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 pointer-coarse:h-4 pointer-coarse:w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5.5 4.5 2.5 8l3 3.5M10.5 4.5 13.5 8l-3 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Floating Left & Right Metadata Labels (opposite corners on narrow mobile containers to prevent overlap) */}
        <span
          data-testid="ba-left-label"
          className="pointer-events-none absolute left-2 top-2 z-20 max-w-[calc(100%-1rem)] truncate rounded-md bg-zinc-950/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-100 backdrop-blur-xs @sm:left-2.5 @sm:top-2.5 @sm:max-w-[46%]"
        >
          {leftPillText}
        </span>
        <span
          data-testid="ba-right-label"
          className="pointer-events-none absolute bottom-2 right-2 z-20 max-w-[calc(100%-1rem)] truncate rounded-md bg-zinc-950/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-100 backdrop-blur-xs @sm:bottom-auto @sm:right-2.5 @sm:top-2.5 @sm:max-w-[50%]"
        >
          {rightPillText}
        </span>
      </div>

      <p className={`text-[11px] ${tokens.textSubtle}`}>
        <span className="pointer-coarse:hidden">{p1.slider.keyboardHint}</span>
        <span className="hidden pointer-coarse:inline">{p1.slider.touchHint}</span>
      </p>
    </div>
  )
}
