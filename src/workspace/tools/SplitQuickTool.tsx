/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports SplitQuickTool component for carousel panorama splitting and grid matrix slicing with interactive cut-line overlays, debounced slicing, and error-handled ZIP export
 * [POS]: carousel and grid splitter panel inside src/workspace/tools; delegates slice rendering and ZIP export to injected engines.split
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useState } from 'react'
import { createDemoImageInput, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceImageInput,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceToolPanelProps,
} from '../types'
import {
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'

export function SplitQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [source, setSource] = useState<WorkspaceImageInput | null>(null)
  const [mode, setMode] = useState<WorkspaceSplitOptions['mode']>(preset.splitMode ?? 'carousel')
  const [carouselCount, setCarouselCount] = useState<number>(3)
  const [carouselAspect, setCarouselAspect] = useState<WorkspaceSplitOptions['carouselAspect']>('4:5')
  const [rows, setRows] = useState<number>(3)
  const [cols, setCols] = useState<number>(3)
  const [result, setResult] = useState<WorkspaceSplitResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedCarouselCount = useDebouncedValue(carouselCount)
  const debouncedRows = useDebouncedValue(rows)
  const debouncedCols = useDebouncedValue(cols)

  const hasPendingParams =
    Boolean(source) &&
    (debouncedCarouselCount !== carouselCount || debouncedRows !== rows || debouncedCols !== cols)
  const isBusy = processing || hasPendingParams

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    try {
      const loaded = await readFileAsImageInput(file)
      setSource(loaded)
    } catch {
      setError(s.common.decodeError)
    }
  }, [s.common.decodeError])

  const handleLoadDemo = () => {
    setError(null)
    setSource(createDemoImageInput('panorama', 'moklu-panorama-demo.svg'))
  }

  useEffect(() => {
    if (!source) return
    let cancelled = false
    const run = async () => {
      setProcessing(true)
      setError(null)
      try {
        const splitRes = await engines.split(source, {
          mode,
          carouselCount: debouncedCarouselCount,
          carouselAspect,
          rows: debouncedRows,
          cols: debouncedCols,
          format: 'image/png',
          quality: 0.94,
        })
        if (!cancelled) setResult(splitRes)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.split.splitError)
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [source, mode, debouncedCarouselCount, carouselAspect, debouncedRows, debouncedCols, engines, s.split.splitError])

  const activeResult = source ? result : null
  const guideCols = mode === 'carousel' ? carouselCount : cols
  const guideRows = mode === 'carousel' ? 1 : rows

  const handleDownloadZip = async () => {
    if (!activeResult || zipping) return
    setZipping(true)
    setError(null)
    try {
      const zipBlob = activeResult.zipBlob
        ?? (await engines.packZip(activeResult.slices.map((sl) => ({ filename: sl.filename, blob: sl.blob }))))
      triggerBlobDownload(zipBlob, `moklu-split-${mode}-${activeResult.slices.length}.zip`)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : s.common.zipError)
    } finally {
      setZipping(false)
    }
  }

  const handleOpenInStudio = () => {
    if (!activeResult || activeResult.slices.length === 0) return
    const first = activeResult.slices[0]
    onOpenInStudio({
      images: activeResult.slices.map((sl) => ({
        dataUrl: sl.dataUrl,
        name: sl.filename,
        width: sl.width,
        height: sl.height,
      })),
      mode: 'carousel',
      slideWidth: first.width,
      slideHeight: first.height,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Cut-line Overlay Preview & Slices */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
              {s.common.preview}
            </span>
            <button
              type="button"
              onClick={handleLoadDemo}
              className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              {s.common.tryDemo}
            </button>
          </div>

          <div
            aria-busy={isBusy}
            className={`relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-xl border p-3 ${tokens.cardMuted}`}
          >
            {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
            {source ? (
              <div className="relative inline-block max-w-full overflow-hidden rounded-lg shadow-sm">
                <img
                  src={source.dataUrl}
                  alt={s.split.previewAlt}
                  className="block max-h-[260px] max-w-full object-contain"
                />
                {/* Interactive cut-line overlay */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${guideCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${guideRows}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: guideCols * guideRows }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-start border border-dashed border-white/85 bg-accent/10 p-1"
                    >
                      <span className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
            )}
            {source && (
              <p className={`mt-2 text-[11px] ${tokens.textSubtle}`}>{s.split.cutPreviewHint}</p>
            )}
          </div>

          {activeResult && activeResult.slices.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${tokens.textMuted}`}>
                  {activeResult.slices.length} {s.split.slicesReady}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {activeResult.slices.map((slice) => (
                  <div
                    key={slice.filename}
                    className={`group flex flex-col overflow-hidden rounded-xl border p-1.5 ${tokens.card}`}
                  >
                    <img
                      src={slice.dataUrl}
                      alt={slice.filename}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-semibold tabular-nums ${tokens.textSubtle}`}>
                        #{slice.index + 1}
                      </span>
                      <button
                        type="button"
                        aria-label={`${s.split.downloadSlice}: ${slice.filename}`}
                        onClick={() => triggerBlobDownload(slice.blob, slice.filename)}
                        className={`inline-flex min-h-7 items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.accentChip}`}
                      >
                        {s.split.downloadSlice}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <DropZone
              theme={theme}
              compact
              title={s.common.dropTitle}
              hint={s.common.dropHint}
              buttonLabel={s.common.chooseFiles}
              invalidFileMessage={s.common.invalidFileError}
              onFiles={handleFiles}
            />
          </div>
        </div>
      </div>

      {/* Right: Split Controls */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.split.modeLabel}
            value={mode}
            options={[
              { value: 'carousel', label: s.split.carousel },
              { value: 'grid', label: s.split.grid },
            ]}
            onChange={setMode}
          />

          {mode === 'carousel' ? (
            <>
              <SliderField
                theme={theme}
                label={s.split.slidesCount}
                value={carouselCount}
                min={2}
                max={10}
                onChange={setCarouselCount}
              />
              <SegmentedControl
                theme={theme}
                label={s.split.slideAspect}
                value={carouselAspect}
                options={[
                  { value: '4:5', label: '4:5' },
                  { value: '3:4', label: '3:4' },
                  { value: '1:1', label: '1:1' },
                  { value: 'auto', label: s.common.auto },
                ]}
                onChange={setCarouselAspect}
              />
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={rows === 3 && cols === 3}
                  onClick={() => {
                    setRows(3)
                    setCols(3)
                  }}
                  className={`min-h-8 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${tokens.focusRing} ${
                    rows === 3 && cols === 3 ? tokens.pillActive : tokens.pillIdle
                  }`}
                >
                  {s.split.nineGridPreset}
                </button>
                <button
                  type="button"
                  aria-pressed={rows === 2 && cols === 2}
                  onClick={() => {
                    setRows(2)
                    setCols(2)
                  }}
                  className={`min-h-8 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${tokens.focusRing} ${
                    rows === 2 && cols === 2 ? tokens.pillActive : tokens.pillIdle
                  }`}
                >
                  {s.split.twoByTwoPreset}
                </button>
              </div>
              <SliderField theme={theme} label={s.split.rows} value={rows} min={1} max={6} onChange={setRows} />
              <SliderField theme={theme} label={s.split.cols} value={cols} min={1} max={6} onChange={setCols} />
            </>
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
              disabled={!activeResult || isBusy || zipping}
              onClick={handleDownloadZip}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {zipping ? s.common.downloading : isBusy ? s.common.processing : s.common.downloadZip}
            </button>
            <StudioHandoffButton
              theme={theme}
              label={s.common.openInStudio}
              disabled={!activeResult}
              onClick={handleOpenInStudio}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
