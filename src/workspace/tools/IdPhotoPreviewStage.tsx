/**
 * [INPUT]: depends on react, formatBytes from ../canvasUtils, getWorkspaceStrings from ../i18n, ID_PHOTO_COMPARE_COLORS from ../locales/idPhotoLocale, getWorkspaceThemeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and ID photo workspace types from ../types
 * [OUTPUT]: exports IdPhotoPreviewStage providing the 3-tab interactive ID photo preview stage (Single Photo with drag-to-pan and compliance guide SVG overlay, 2x2 Multi-Color Compare with 1-click Trio ZIP CTA, and 6-Inch/A4 300 DPI Print Sheet with PNG/PDF download)
 * [POS]: modular preview stage subcomponent extracted from src/workspace/tools/IdPhotoQuickTool.tsx to keep both files under 550 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef, useState, type PointerEvent } from 'react'
import { formatBytes } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { ID_PHOTO_COMPARE_COLORS } from '../locales/idPhotoLocale'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceIdPhotoMattingStage,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceIdPhotoSheetOutput,
  WorkspaceIdPhotoSheetPaper,
  WorkspaceIdPhotoTab,
  WorkspaceLocale,
  WorkspaceTheme,
} from '../types'
import { DraftStatusBar, DropZone, PreviewBusyOverlay, SegmentedControl } from '../uiPrimitives'

export interface IdPhotoPreviewStageProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  activeTab: WorkspaceIdPhotoTab
  onTabChange: (next: WorkspaceIdPhotoTab) => void
  hasImage: boolean
  isBusy: boolean
  heicDecoding: boolean
  mattingStage: WorkspaceIdPhotoMattingStage | null
  mattingProgress: number
  renderedPhoto: WorkspaceIdPhotoRenderOutput | null
  comparePreviews: Record<string, WorkspaceIdPhotoRenderOutput | undefined>
  activeBackground: string
  targetWidthPx: number
  targetHeightPx: number
  targetSizeKb: number
  showGuides: boolean
  onToggleGuides: (next: boolean) => void
  onPanDelta: (deltaCenterX: number, deltaCenterY: number) => void
  onAutoCenter: () => void
  onSelectBackground: (hex: string) => void
  onDownloadTrioZip: () => void
  trioZipBusy: boolean
  sheetPaper: WorkspaceIdPhotoSheetPaper
  onSheetPaperChange: (next: WorkspaceIdPhotoSheetPaper) => void
  cropMarks: boolean
  onCropMarksChange: (next: boolean) => void
  sheetOutput: WorkspaceIdPhotoSheetOutput | null
  sheetBusy: boolean
  sheetPdfBusy: boolean
  onDownloadSheetPng: () => void
  onDownloadSheetPdf: () => void
  onFiles: (files: File[]) => void
  onTryDemo: () => void
  hasDraft: boolean
  onClearDraft: () => void
}

function ComplianceGuideOverlay({
  headTopLabel,
  eyeLineLabel,
  chinLabel,
}: {
  headTopLabel: string
  eyeLineLabel: string
  chinLabel: string
}) {
  return (
    <svg
      viewBox="0 0 100 133"
      preserveAspectRatio="none"
      data-testid="id-photo-compliance-guides"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* Head-top safe zone band (8% to 12%) */}
      <rect x="0" y="10.6" width="100" height="5.4" fill="rgba(249,115,22,0.14)" />
      <line x1="0" y1="10.6" x2="100" y2="10.6" stroke="#f97316" strokeWidth="0.6" strokeDasharray="3 2" />
      <line x1="0" y1="16" x2="100" y2="16" stroke="#f97316" strokeWidth="0.6" strokeDasharray="3 2" />
      {/* Vertical center axis */}
      <line x1="50" y1="0" x2="50" y2="133" stroke="rgba(15,23,42,0.28)" strokeWidth="0.45" strokeDasharray="2 3" />
      {/* Eye horizontal level (~44%) */}
      <line x1="12" y1="58.5" x2="88" y2="58.5" stroke="#0ea5e9" strokeWidth="0.65" strokeDasharray="3 2" />
      {/* Chin target line (~72%) */}
      <line x1="22" y1="95.5" x2="78" y2="95.5" stroke="#10b981" strokeWidth="0.65" strokeDasharray="3 2" />
      {/* Head oval and shoulder contour guide */}
      <ellipse cx="50" cy="54" rx="22" ry="30" fill="none" stroke="rgba(249,115,22,0.55)" strokeWidth="0.65" strokeDasharray="3 2" />
      <path d="M 10 133 C 16 108 32 100 50 100 C 68 100 84 108 90 133" fill="none" stroke="rgba(15,23,42,0.45)" strokeWidth="0.65" strokeDasharray="3 2" />
      <text x="4" y="9.2" fill="#ea580c" fontSize="3.8" fontWeight="600">{headTopLabel}</text>
      <text x="4" y="56.8" fill="#0284c7" fontSize="3.6" fontWeight="600">{eyeLineLabel}</text>
      <text x="4" y="93.8" fill="#059669" fontSize="3.6" fontWeight="600">{chinLabel}</text>
    </svg>
  )
}

export function IdPhotoPreviewStage({
  theme,
  locale,
  activeTab,
  onTabChange,
  hasImage,
  isBusy,
  heicDecoding,
  mattingStage,
  mattingProgress,
  renderedPhoto,
  comparePreviews,
  activeBackground,
  targetWidthPx,
  targetHeightPx,
  targetSizeKb,
  showGuides,
  onToggleGuides,
  onPanDelta,
  onAutoCenter,
  onSelectBackground,
  onDownloadTrioZip,
  trioZipBusy,
  sheetPaper,
  onSheetPaperChange,
  cropMarks,
  onCropMarksChange,
  sheetOutput,
  sheetBusy,
  sheetPdfBusy,
  onDownloadSheetPng,
  onDownloadSheetPdf,
  onFiles,
  onTryDemo,
  hasDraft,
  onClearDraft,
}: IdPhotoPreviewStageProps) {
  const s = getWorkspaceStrings(locale)
  const ip = s.idPhoto
  const tokens = getWorkspaceThemeTokens(theme)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasImage || activeTab !== 'single') return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragOriginRef.current || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dx = event.clientX - dragOriginRef.current.x
    const dy = event.clientY - dragOriginRef.current.y
    dragOriginRef.current = { x: event.clientX, y: event.clientY }
    // Dragging the portrait right moves the crop window left.
    onPanDelta(-dx / rect.width, -dy / rect.height)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragOriginRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragOriginRef.current = null
    setDragging(false)
  }

  const stageLabel =
    mattingStage === 'downloading'
      ? `${ip.stageDownloading} (${Math.round(mattingProgress * 100)}%)`
      : mattingStage === 'inferring'
        ? ip.stageInferring
        : mattingStage === 'refining'
          ? ip.stageRefining
          : null

  const compareLabels: Record<'white' | 'blue' | 'red' | 'gray', string> = {
    white: ip.trioCardWhite,
    blue: ip.trioCardBlue,
    red: ip.trioCardRed,
    gray: ip.trioCardGray,
  }

  const tabOptions: Array<{ id: WorkspaceIdPhotoTab; label: string }> = [
    { id: 'single', label: ip.tabSingle },
    { id: 'trio', label: ip.tabTrio },
    { id: 'sheet', label: ip.tabSheet },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Top 3-Tab View Switcher */}
      <div
        role="tablist"
        aria-label={s.common.preview}
        className={`flex flex-wrap items-center gap-1 rounded-2xl border p-1 ${tokens.tabBar}`}
      >
        {tabOptions.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-testid={`id-photo-tab-${tab.id}`}
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-8 flex-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${
                selected ? tokens.tabActive : tokens.tabIdle
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Live AI Matting Download / Inference Progress Bar */}
      {stageLabel && (
        <div
          role="status"
          aria-live="polite"
          data-testid="id-photo-matting-progress"
          className={`rounded-2xl border px-3.5 py-2.5 text-xs ${tokens.card}`}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className={`font-semibold ${tokens.text}`}>{stageLabel}</span>
            <span className={`font-mono text-[11px] tabular-nums ${tokens.textSubtle}`}>
              {Math.round(Math.max(0.05, Math.min(1, mattingProgress)) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-150"
              style={{ width: `${Math.round(Math.max(0.08, Math.min(1, mattingProgress)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Stage Surface */}
      <div className={`rounded-2xl border p-3.5 sm:p-4 ${tokens.stage}`}>
        {!hasImage ? (
          <div className="space-y-3">
            <DropZone
              theme={theme}
              title={ip.dropTitle}
              hint={ip.dropHint}
              buttonLabel={s.common.chooseFiles}
              invalidFileMessage={s.common.invalidFileError}
              decodingLabel={heicDecoding ? s.common.heicDecoding : null}
              onFiles={onFiles}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                data-testid="id-photo-try-demo"
                onClick={onTryDemo}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
              >
                <span>{ip.tryDemoPortrait}</span>
              </button>
              <span className={`text-[11px] ${tokens.textSubtle}`}>
                {targetWidthPx} × {targetHeightPx} px · 300 DPI
              </span>
            </div>
          </div>
        ) : activeTab === 'single' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                  {targetWidthPx} × {targetHeightPx} px
                  {renderedPhoto ? ` · ${formatBytes(renderedPhoto.sizeBytes)}` : ''}
                </span>
                {targetSizeKb > 0 && renderedPhoto && (
                  <span
                    data-testid="id-photo-kb-status"
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      renderedPhoto.targetBytesMet !== false ? tokens.badgePositive : tokens.badgeWarning
                    }`}
                  >
                    {renderedPhoto.targetBytesMet !== false ? `✓ ${ip.targetKbMet} <=${targetSizeKb}KB` : ip.targetKbUnmet}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className={`inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium ${tokens.textMuted}`}>
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(e) => onToggleGuides(e.target.checked)}
                    className={`h-3.5 w-3.5 accent-accent ${tokens.focusRing}`}
                  />
                  {ip.showGuidesLabel}
                </label>
                <button
                  type="button"
                  onClick={onAutoCenter}
                  className={`min-h-7 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
                >
                  {ip.autoCenterBtn}
                </button>
              </div>
            </div>

            <div
              aria-busy={isBusy}
              className={`relative flex min-h-[340px] flex-col items-center justify-center rounded-xl border p-4 ${tokens.cardMuted}`}
            >
              {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
              <div
                ref={frameRef}
                data-testid="id-photo-single-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ aspectRatio: `${targetWidthPx} / ${targetHeightPx}` }}
                className={`relative max-h-[380px] w-auto select-none overflow-hidden rounded-lg border border-black/15 shadow-md touch-none ${
                  dragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                {renderedPhoto ? (
                  <img
                    src={renderedPhoto.dataUrl}
                    alt={ip.previewAlt}
                    draggable={false}
                    className="block h-full max-h-[380px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] w-[240px] items-center justify-center text-xs text-muted">
                    {s.common.processing}
                  </div>
                )}
                {showGuides && (
                  <ComplianceGuideOverlay
                    headTopLabel={ip.guideHeadTop}
                    eyeLineLabel={ip.guideEyeLine}
                    chinLabel={ip.guideChin}
                  />
                )}
              </div>
              <p className={`mt-2.5 text-[11px] ${tokens.textSubtle}`}>{ip.dragPanHint}</p>
            </div>
          </div>
        ) : activeTab === 'trio' ? (
          <div className="space-y-3" data-testid="id-photo-trio-view">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className={`text-xs font-bold sm:text-sm ${tokens.text}`}>{ip.trioHeading}</h3>
                <p className={`text-[11px] ${tokens.textMuted}`}>{ip.trioSubtitle}</p>
              </div>
              <button
                type="button"
                data-testid="id-photo-trio-cta"
                disabled={trioZipBusy || isBusy}
                onClick={onDownloadTrioZip}
                className={`inline-flex min-h-8 items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
              >
                {trioZipBusy ? s.common.downloading : ip.trioDownloadZip}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ID_PHOTO_COMPARE_COLORS.map((item) => {
                const selected = activeBackground.trim().toLowerCase() === item.hex.toLowerCase()
                const preview = comparePreviews[item.hex]
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`id-photo-trio-card-${item.id}`}
                    aria-pressed={selected}
                    onClick={() => onSelectBackground(item.hex)}
                    className={`group flex flex-col items-center rounded-xl border p-2.5 text-left transition-all ${tokens.focusRing} ${
                      selected ? `${tokens.card} ${tokens.accentRing}` : `${tokens.card} hover:border-accent/50`
                    }`}
                  >
                    <div
                      style={{ aspectRatio: `${targetWidthPx} / ${targetHeightPx}`, backgroundColor: item.hex }}
                      className="relative mb-2 w-full max-w-[148px] overflow-hidden rounded-md border border-black/10 shadow-xs"
                    >
                      {preview ? (
                        <img src={preview.dataUrl} alt={compareLabels[item.id]} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full min-h-[140px] w-full items-center justify-center text-[11px] text-zinc-500">
                          {s.common.processing}
                        </div>
                      )}
                    </div>
                    <div className="flex w-full items-center justify-between gap-1 text-[11px]">
                      <span className={`truncate font-semibold ${tokens.text}`}>{compareLabels[item.id]}</span>
                      {selected && (
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${tokens.accentChip}`}>
                          {ip.trioSelectedBadge}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3" data-testid="id-photo-sheet-view">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SegmentedControl
                theme={theme}
                label={ip.sheetPaperLabel}
                value={sheetPaper}
                options={[
                  { value: '4r-6inch', label: ip.paper4r },
                  { value: 'a4', label: ip.paperA4 },
                ]}
                onChange={onSheetPaperChange}
              />
              {sheetOutput && (
                <span
                  data-testid="id-photo-sheet-count"
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums ${tokens.card} ${tokens.text}`}
                >
                  {sheetOutput.count} {ip.sheetPhotosCount} ({sheetOutput.columns}×{sheetOutput.rows})
                </span>
              )}
            </div>

            <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
              <input
                type="checkbox"
                checked={cropMarks}
                onChange={(e) => onCropMarksChange(e.target.checked)}
                className={`h-4 w-4 accent-accent ${tokens.focusRing}`}
              />
              {ip.cropMarksLabel}
            </label>

            <div
              aria-busy={sheetBusy}
              className={`relative flex min-h-[280px] items-center justify-center rounded-xl border p-3 ${tokens.cardMuted}`}
            >
              {sheetBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
              {sheetOutput ? (
                <img
                  src={sheetOutput.dataUrl}
                  alt={ip.sheetPreviewAlt}
                  data-testid="id-photo-sheet-preview"
                  className="max-h-[340px] max-w-full rounded border border-zinc-300 bg-white object-contain shadow-md"
                />
              ) : (
                <p className={`text-xs ${tokens.textSubtle}`}>{s.common.processing}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                data-testid="id-photo-sheet-png"
                disabled={!sheetOutput || sheetBusy}
                onClick={onDownloadSheetPng}
                className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
              >
                {ip.downloadSheetPng}
              </button>
              <button
                type="button"
                data-testid="id-photo-sheet-pdf"
                disabled={!renderedPhoto || sheetPdfBusy}
                onClick={onDownloadSheetPdf}
                className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonSecondary}`}
              >
                {sheetPdfBusy ? s.common.downloading : ip.downloadSheetPdf}
              </button>
            </div>
          </div>
        )}

        {hasDraft && (
          <DraftStatusBar
            theme={theme}
            toolId="id-photo"
            savedLabel={s.common.draftSaved}
            clearLabel={s.common.clearDraft}
            onClear={onClearDraft}
          />
        )}
      </div>
    </div>
  )
}
