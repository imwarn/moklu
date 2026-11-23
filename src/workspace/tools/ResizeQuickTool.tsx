/**
 * [INPUT]: depends on react, batchHelpers from ../batchHelpers, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports ResizePreviewStage and ResizeQuickTool for multi-image Resize (px or scale %), Crop, and non-crop Border & Pad workflows with filmstrip preview switcher, debounced transforms, error-handled ZIP export, and full-batch Studio handoff
 * [POS]: resize, crop, and border-pad panel inside src/workspace/tools; delegates rendering to injected engines.transform
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  buildBatchStudioHandoff,
  clampBatchIndex,
  removeBatchEntry,
  stepBatchIndex,
} from '../batchHelpers'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceTheme,
  WorkspaceToolPanelProps,
  WorkspaceTransformOptions,
} from '../types'
import {
  ColorSwatchRow,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'

const MIN_RESIZE_PX = 16
const MAX_RESIZE_PX = 8192
const SCALE_PRESETS = [25, 50, 75, 150, 200] as const

function clampResizePx(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(MIN_RESIZE_PX, Math.min(MAX_RESIZE_PX, Math.round(value)))
}

export interface ResizePreviewStageProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  outputs: readonly WorkspaceBlobOutput[]
  selectedIndex: number
  hasSourceImages: boolean
  busy?: boolean
  onSelectIndex: (index: number) => void
  onDownloadAt: (index: number) => void
  onRemoveAt: (index: number) => void
  onClearAll: () => void
  onLoadDemo: () => void
  onFiles: (files: File[]) => void
}

export function ResizePreviewStage({
  theme,
  locale,
  outputs,
  selectedIndex,
  hasSourceImages,
  busy = false,
  onSelectIndex,
  onDownloadAt,
  onRemoveAt,
  onClearAll,
  onLoadDemo,
  onFiles,
}: ResizePreviewStageProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const safeIndex = clampBatchIndex(selectedIndex, outputs.length)
  const current = outputs[safeIndex] ?? null

  return (
    <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
            {s.common.preview}
          </span>
          {current && (
            <span
              data-testid="resize-preview-meta"
              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}
            >
              {outputs.length > 1 ? `${safeIndex + 1}/${outputs.length} · ` : ''}
              {current.width} × {current.height} · {formatBytes(current.sizeBytes)}
            </span>
          )}
          {outputs.length > 1 && (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                data-testid="resize-prev-btn"
                aria-label={s.common.previousImage}
                onClick={() => onSelectIndex(stepBatchIndex(safeIndex, -1, outputs.length))}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
              >
                ‹
              </button>
              <button
                type="button"
                data-testid="resize-next-btn"
                aria-label={s.common.nextImage}
                onClick={() => onSelectIndex(stepBatchIndex(safeIndex, 1, outputs.length))}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
              >
                ›
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadDemo}
            className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
          >
            {s.common.tryDemo}
          </button>
          {hasSourceImages && (
            <button
              type="button"
              onClick={onClearAll}
              className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.focusRing} ${tokens.textMuted} hover:text-danger`}
            >
              {s.common.clearAll}
            </button>
          )}
        </div>
      </div>

      <div
        aria-busy={busy}
        className={`relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl border p-4 ${tokens.cardMuted}`}
      >
        {busy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
        {current ? (
          <>
            <img
              data-testid="resize-preview-image"
              src={current.dataUrl}
              alt={current.filename}
              className="max-h-[300px] max-w-full rounded-lg object-contain shadow-sm"
            />
            <p className={`mt-2 max-w-full truncate text-[11px] font-medium ${tokens.textSubtle}`}>
              {current.filename}
            </p>
          </>
        ) : (
          <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
        )}
      </div>

      {outputs.length > 0 && (
        <div className="mt-3" data-testid="resize-thumbnail-strip" aria-label={s.resize.batchStripLabel}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={`font-semibold ${tokens.textMuted}`}>
              {outputs.length} {s.resize.batchReady}
            </span>
          </div>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {outputs.map((item, idx) => {
              const selected = idx === safeIndex
              return (
                <li
                  key={`${item.filename}-${idx}`}
                  data-testid={`resize-thumb-${idx}`}
                  className={`flex w-[148px] shrink-0 flex-col rounded-xl border p-1.5 transition-all ${
                    selected ? `${tokens.accentRing} ${tokens.card}` : tokens.card
                  }`}
                >
                  <button
                    type="button"
                    data-testid={`resize-thumb-select-${idx}`}
                    aria-pressed={selected}
                    onClick={() => onSelectIndex(idx)}
                    className={`group flex flex-col rounded-lg text-left ${tokens.focusRing}`}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-black/5">
                      <img
                        src={item.dataUrl}
                        alt={item.filename}
                        className="h-16 w-full object-cover"
                      />
                      <span className="absolute left-1 top-1 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                        #{idx + 1}
                      </span>
                    </div>
                    <span className={`mt-1.5 truncate text-[11px] font-semibold ${tokens.text}`}>
                      {item.filename}
                    </span>
                    <span className={`text-[10px] tabular-nums ${tokens.textSubtle}`}>
                      {item.width}×{item.height}
                    </span>
                  </button>
                  <div className="mt-1.5 flex items-center justify-end gap-1 border-t pt-1.5 border-current/10">
                    <button
                      type="button"
                      data-testid={`resize-thumb-download-${idx}`}
                      title={s.common.downloadSingle}
                      aria-label={`${s.common.downloadSingle}: ${item.filename}`}
                      onClick={() => onDownloadAt(idx)}
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-semibold ${tokens.focusRing} ${tokens.pillIdle}`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      data-testid={`resize-thumb-remove-${idx}`}
                      title={s.common.remove}
                      aria-label={`${s.common.remove}: ${item.filename}`}
                      onClick={() => onRemoveAt(idx)}
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-semibold ${tokens.focusRing} ${tokens.dangerGhost}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <DropZone
          theme={theme}
          compact
          multiple
          title={s.common.dropMultipleTitle}
          hint={s.common.dropHint}
          buttonLabel={s.common.chooseFiles}
          invalidFileMessage={s.common.invalidFileError}
          onFiles={onFiles}
        />
      </div>
    </div>
  )
}

export function ResizeQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const widthInputId = useId()
  const heightInputId = useId()

  const padSwatches = useMemo(
    () => [
      { label: s.swatches.pureWhite, value: '#ffffff' },
      { label: s.swatches.warmCream, value: '#faf7f2' },
      { label: s.swatches.charcoal, value: '#111827' },
      { label: s.swatches.softAurora, value: 'linear-gradient(135deg, #b5b0f2, #e5efff)' },
      { label: s.swatches.peachGlow, value: 'linear-gradient(135deg, #fde68a, #f9a8d4)' },
    ],
    [s.swatches],
  )

  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [mode, setMode] = useState<WorkspaceTransformOptions['mode']>(preset.resizeMode ?? 'resize')
  const [resizeBy, setResizeBy] = useState<'pixels' | 'scale'>('pixels')
  const [scalePercent, setScalePercent] = useState<number>(50)
  const [aspectRatio, setAspectRatio] = useState<WorkspaceAspectPreset>('1:1')
  const [widthPx, setWidthPx] = useState<number>(1200)
  const [heightPx, setHeightPx] = useState<number>(1200)
  const [widthDraft, setWidthDraft] = useState<string>('1200')
  const [heightDraft, setHeightDraft] = useState<string>('1200')
  const [lockAspect, setLockAspect] = useState<boolean>(true)
  const [borderPx, setBorderPx] = useState<number>(48)
  const [borderRadius, setBorderRadius] = useState<number>(16)
  const [background, setBackground] = useState<string>('#ffffff')
  const [shadow, setShadow] = useState<boolean>(true)
  const [outputs, setOutputs] = useState<WorkspaceBlobOutput[]>([])
  const [processing, setProcessing] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedScalePercent = useDebouncedValue(scalePercent)
  const debouncedWidthPx = useDebouncedValue(widthPx)
  const debouncedHeightPx = useDebouncedValue(heightPx)
  const debouncedBorderPx = useDebouncedValue(borderPx)
  const debouncedBorderRadius = useDebouncedValue(borderRadius)

  const hasPendingParams =
    images.length > 0 &&
    (debouncedScalePercent !== scalePercent ||
      debouncedWidthPx !== widthPx ||
      debouncedHeightPx !== heightPx ||
      debouncedBorderPx !== borderPx ||
      debouncedBorderRadius !== borderRadius)
  const isBusy = processing || hasPendingParams

  const hasImages = images.length > 0

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null)
    try {
      const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
      setImages((prev) => [...prev, ...loaded])
      if (!hasImages && loaded[0]) {
        setWidthPx(loaded[0].width)
        setHeightPx(loaded[0].height)
        setWidthDraft(String(loaded[0].width))
        setHeightDraft(String(loaded[0].height))
        setSelectedIndex(0)
      }
    } catch {
      setError(s.common.decodeError)
    }
  }, [hasImages, s.common.decodeError])

  const handleLoadDemo = () => {
    setError(null)
    const demo = createDemoImageInput('photo-2', 'social-photo.svg')
    setImages([demo])
    setSelectedIndex(0)
    setWidthPx(demo.width)
    setHeightPx(demo.height)
    setWidthDraft(String(demo.width))
    setHeightDraft(String(demo.height))
  }

  const activeSource = images[clampBatchIndex(selectedIndex, images.length)] ?? images[0]

  const commitWidth = (safeW: number) => {
    setWidthPx(safeW)
    if (lockAspect && activeSource && activeSource.width > 0) {
      const nextH = clampResizePx((activeSource.height / activeSource.width) * safeW, heightPx)
      setHeightPx(nextH)
      setHeightDraft(String(nextH))
    }
  }

  const commitHeight = (safeH: number) => {
    setHeightPx(safeH)
    if (lockAspect && activeSource && activeSource.height > 0) {
      const nextW = clampResizePx((activeSource.width / activeSource.height) * safeH, widthPx)
      setWidthPx(nextW)
      setWidthDraft(String(nextW))
    }
  }

  const handleWidthDraftChange = (raw: string) => {
    setWidthDraft(raw)
    if (raw.trim() === '') return
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= MIN_RESIZE_PX && parsed <= MAX_RESIZE_PX) {
      commitWidth(Math.round(parsed))
    }
  }

  const handleWidthBlur = () => {
    const parsed = widthDraft.trim() === '' ? Number.NaN : Number(widthDraft)
    const safeW = clampResizePx(parsed, widthPx)
    setWidthDraft(String(safeW))
    commitWidth(safeW)
  }

  const handleHeightDraftChange = (raw: string) => {
    setHeightDraft(raw)
    if (raw.trim() === '') return
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= MIN_RESIZE_PX && parsed <= MAX_RESIZE_PX) {
      commitHeight(Math.round(parsed))
    }
  }

  const handleHeightBlur = () => {
    const parsed = heightDraft.trim() === '' ? Number.NaN : Number(heightDraft)
    const safeH = clampResizePx(parsed, heightPx)
    setHeightDraft(String(safeH))
    commitHeight(safeH)
  }

  const handleRemoveAt = (removeIndex: number) => {
    const { items: nextImages, nextIndex } = removeBatchEntry(images, removeIndex, selectedIndex)
    setImages(nextImages)
    setOutputs((prev) => prev.filter((_, idx) => idx !== removeIndex))
    setSelectedIndex(nextIndex)
  }

  const handleClearAll = () => {
    setImages([])
    setOutputs([])
    setSelectedIndex(0)
  }

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    const run = async () => {
      setProcessing(true)
      setError(null)
      try {
        const transformed = await engines.transform(images, {
          mode,
          width: mode === 'resize' && resizeBy === 'pixels' ? debouncedWidthPx : undefined,
          height: mode === 'resize' && resizeBy === 'pixels' ? debouncedHeightPx : undefined,
          scale: mode === 'resize' && resizeBy === 'scale' ? debouncedScalePercent / 100 : undefined,
          lockAspect,
          aspectRatio,
          borderPx: debouncedBorderPx,
          background,
          borderRadius: debouncedBorderRadius,
          shadow,
          format: 'image/png',
          quality: 0.94,
        })
        if (!cancelled) setOutputs(transformed)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.resize.transformError)
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    images,
    mode,
    resizeBy,
    debouncedScalePercent,
    debouncedWidthPx,
    debouncedHeightPx,
    lockAspect,
    aspectRatio,
    debouncedBorderPx,
    background,
    debouncedBorderRadius,
    shadow,
    engines,
    s.resize.transformError,
  ])

  const activeOutputs = images.length > 0 ? outputs : []
  const safeIndex = clampBatchIndex(selectedIndex, activeOutputs.length)
  const current = activeOutputs[safeIndex] ?? null

  const handleDownloadAt = (idx: number) => {
    const item = activeOutputs[idx]
    if (item) triggerBlobDownload(item.blob, item.filename)
  }

  const handleDownloadPrimaryOrZip = async () => {
    if (activeOutputs.length === 0 || zipping) return
    if (activeOutputs.length === 1) {
      triggerBlobDownload(activeOutputs[0].blob, activeOutputs[0].filename)
      return
    }
    setZipping(true)
    setError(null)
    try {
      const zipBlob = await engines.packZip(
        activeOutputs.map((out) => ({ filename: out.filename, blob: out.blob })),
      )
      triggerBlobDownload(zipBlob, `moklu-${mode}-${activeOutputs.length}.zip`)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : s.common.zipError)
    } finally {
      setZipping(false)
    }
  }

  const handleOpenInStudio = () => {
    const payload = buildBatchStudioHandoff(activeOutputs, safeIndex)
    if (payload) onOpenInStudio(payload)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Live Transform Preview & Multi-Image Filmstrip */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <ResizePreviewStage
          theme={theme}
          locale={locale}
          outputs={activeOutputs}
          selectedIndex={safeIndex}
          hasSourceImages={images.length > 0}
          busy={isBusy}
          onSelectIndex={setSelectedIndex}
          onDownloadAt={handleDownloadAt}
          onRemoveAt={handleRemoveAt}
          onClearAll={handleClearAll}
          onLoadDemo={handleLoadDemo}
          onFiles={handleFiles}
        />
      </div>

      {/* Right: Resize / Crop / Border Controls */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.resize.modeLabel}
            value={mode}
            options={[
              { value: 'resize', label: s.resize.resizeMode },
              { value: 'crop', label: s.resize.cropMode },
              { value: 'pad', label: s.resize.padMode },
            ]}
            onChange={setMode}
          />

          {mode === 'resize' ? (
            <div className="space-y-3.5">
              <SegmentedControl
                theme={theme}
                label={s.resize.resizeByLabel}
                value={resizeBy}
                options={[
                  { value: 'pixels', label: s.resize.byPixels },
                  { value: 'scale', label: s.resize.byScale },
                ]}
                onChange={setResizeBy}
              />

              {resizeBy === 'scale' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {SCALE_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        aria-pressed={scalePercent === pct}
                        onClick={() => setScalePercent(pct)}
                        className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${tokens.focusRing} ${
                          scalePercent === pct ? tokens.pillActive : tokens.pillIdle
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <SliderField
                    theme={theme}
                    label={s.resize.scaleLabel}
                    value={scalePercent}
                    min={10}
                    max={200}
                    step={5}
                    unit="%"
                    onChange={setScalePercent}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={widthInputId} className={`mb-1 block text-xs font-semibold ${tokens.textMuted}`}>
                        {s.resize.widthLabel}
                      </label>
                      <input
                        id={widthInputId}
                        type="number"
                        min={MIN_RESIZE_PX}
                        max={MAX_RESIZE_PX}
                        value={widthDraft}
                        onChange={(e) => handleWidthDraftChange(e.target.value)}
                        onBlur={handleWidthBlur}
                        className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={heightInputId} className={`mb-1 block text-xs font-semibold ${tokens.textMuted}`}>
                        {s.resize.heightLabel}
                      </label>
                      <input
                        id={heightInputId}
                        type="number"
                        min={MIN_RESIZE_PX}
                        max={MAX_RESIZE_PX}
                        value={heightDraft}
                        onChange={(e) => handleHeightDraftChange(e.target.value)}
                        onBlur={handleHeightBlur}
                        className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                      />
                    </div>
                  </div>
                  <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={lockAspect}
                      onChange={(e) => setLockAspect(e.target.checked)}
                      className={`h-4 w-4 accent-accent ${tokens.focusRing}`}
                    />
                    {s.resize.lockAspect}
                  </label>
                </div>
              )}
            </div>
          ) : (
            <SegmentedControl
              theme={theme}
              label={s.resize.aspectLabel}
              value={aspectRatio}
              options={[
                { value: '1:1', label: '1:1' },
                { value: '4:5', label: '4:5' },
                { value: '3:4', label: '3:4' },
                { value: '16:9', label: '16:9' },
                { value: '9:16', label: '9:16' },
                { value: '3:2', label: '3:2' },
                { value: 'free', label: s.resize.freeAspect },
              ]}
              onChange={setAspectRatio}
            />
          )}

          {mode === 'pad' && (
            <div className="space-y-3.5">
              <SliderField
                theme={theme}
                label={s.resize.borderLabel}
                value={borderPx}
                min={0}
                max={160}
                unit="px"
                onChange={setBorderPx}
              />
              <SliderField
                theme={theme}
                label={s.common.radius}
                value={borderRadius}
                min={0}
                max={64}
                unit="px"
                onChange={setBorderRadius}
              />
              <ColorSwatchRow
                theme={theme}
                label={s.common.background}
                value={background}
                options={padSwatches}
                onChange={setBackground}
              />
              <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) => setShadow(e.target.checked)}
                  className={`h-4 w-4 accent-accent ${tokens.focusRing}`}
                />
                {s.resize.shadowLabel}
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t pt-4 border-current/10">
          {error && (
            <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!current || isBusy || zipping}
              onClick={handleDownloadPrimaryOrZip}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {zipping
                ? s.common.downloading
                : isBusy
                  ? s.common.processing
                  : activeOutputs.length > 1
                    ? s.common.downloadZip
                    : s.common.downloadImage}
            </button>
            <StudioHandoffButton
              theme={theme}
              label={s.common.openInStudio}
              disabled={!current}
              onClick={handleOpenInStudio}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
