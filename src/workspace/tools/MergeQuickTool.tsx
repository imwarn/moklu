/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports MergeQuickTool component for horizontal, vertical, and grid multi-image stitching with reorderable strip and debounced preview
 * [POS]: merge and collage tool panel inside src/workspace/tools; delegates canvas composition to injected engines.merge
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceBlobOutput,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceMergeOptions,
  WorkspaceToolPanelProps,
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

export function MergeQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const bgSwatches = useMemo(
    () => [
      { label: s.swatches.white, value: '#ffffff' },
      { label: s.swatches.softGray, value: '#f1f5f9' },
      { label: s.swatches.slateDark, value: '#0f172a' },
      { label: s.swatches.aurora, value: 'linear-gradient(135deg, #b5b0f2, #e5efff)' },
      { label: s.swatches.sunset, value: 'linear-gradient(135deg, #f97316, #f43f5e)' },
      { label: s.swatches.transparent, value: 'transparent' },
    ],
    [s.swatches],
  )

  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [direction, setDirection] = useState<WorkspaceMergeOptions['direction']>(
    preset.mergeDirection ?? 'horizontal',
  )
  const [normalize, setNormalize] = useState<WorkspaceMergeOptions['normalize']>('match-min')
  const [columns, setColumns] = useState<number>(2)
  const [aspectCell, setAspectCell] = useState<WorkspaceMergeOptions['aspectCell']>('1:1')
  const [gap, setGap] = useState<number>(16)
  const [padding, setPadding] = useState<number>(24)
  const [borderRadius, setBorderRadius] = useState<number>(12)
  const [background, setBackground] = useState<string>('#ffffff')
  const [format, setFormat] = useState<WorkspaceImageFormat>('image/png')
  const [result, setResult] = useState<WorkspaceBlobOutput | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedColumns = useDebouncedValue(columns)
  const debouncedGap = useDebouncedValue(gap)
  const debouncedPadding = useDebouncedValue(padding)
  const debouncedBorderRadius = useDebouncedValue(borderRadius)

  const hasPendingParams =
    images.length > 0 &&
    (debouncedColumns !== columns ||
      debouncedGap !== gap ||
      debouncedPadding !== padding ||
      debouncedBorderRadius !== borderRadius)
  const isBusy = rendering || hasPendingParams

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null)
    try {
      const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
      setImages((prev) => [...prev, ...loaded])
    } catch {
      setError(s.common.decodeError)
    }
  }, [s.common.decodeError])

  const handleLoadDemo = () => {
    setError(null)
    setImages([
      createDemoImageInput('photo-1', 'slide-1.svg'),
      createDemoImageInput('photo-2', 'slide-2.svg'),
      createDemoImageInput('photo-3', 'slide-3.svg'),
    ])
  }

  const moveImage = (index: number, delta: -1 | 1) => {
    setImages((prev) => {
      const nextIndex = index + delta
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const copy = [...prev]
      const [moved] = copy.splice(index, 1)
      copy.splice(nextIndex, 0, moved)
      return copy
    })
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    const run = async () => {
      setRendering(true)
      setError(null)
      try {
        const merged = await engines.merge(images, {
          direction,
          normalize,
          columns: debouncedColumns,
          aspectCell,
          fit: 'cover',
          gap: debouncedGap,
          padding: debouncedPadding,
          borderRadius: debouncedBorderRadius,
          background,
          format,
          quality: 0.92,
        })
        if (!cancelled) setResult(merged)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.merge.mergeError)
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    images,
    direction,
    normalize,
    debouncedColumns,
    aspectCell,
    debouncedGap,
    debouncedPadding,
    debouncedBorderRadius,
    background,
    format,
    engines,
    s.merge.mergeError,
  ])

  const activeResult = images.length > 0 ? result : null

  const handleOpenInStudio = () => {
    if (!activeResult) return
    onOpenInStudio({
      images: [
        {
          dataUrl: activeResult.dataUrl,
          name: activeResult.filename,
          width: activeResult.width,
          height: activeResult.height,
        },
      ],
      mode: 'canvas',
      slideWidth: activeResult.width,
      slideHeight: activeResult.height,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Reorderable Strip + Live Merged Preview */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.common.preview}
              </span>
              {activeResult && (
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                  {activeResult.width} × {activeResult.height} · {formatBytes(activeResult.sizeBytes)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
              >
                {s.merge.loadDemoSet}
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setImages([])
                    setResult(null)
                  }}
                  className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.focusRing} ${tokens.textMuted} hover:text-danger`}
                >
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          <div
            aria-busy={isBusy}
            className={`relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border p-3 ${tokens.cardMuted}`}
          >
            {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
            {activeResult ? (
              <img
                src={activeResult.dataUrl}
                alt={s.merge.previewAlt}
                className="max-h-[340px] max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : (
              <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={`font-semibold ${tokens.textMuted}`}>
                  {images.length} {s.merge.itemsCount}
                </span>
              </div>
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {images.map((item, idx) => (
                  <li
                    key={item.id}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 ${tokens.card}`}
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex flex-col gap-1">
                      <span className={`max-w-[110px] truncate text-[11px] font-medium ${tokens.text}`}>
                        {idx + 1}. {item.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`${s.common.moveLeft}: ${item.name}`}
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          aria-label={`${s.common.moveRight}: ${item.name}`}
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
                        >
                          →
                        </button>
                        <button
                          type="button"
                          aria-label={`${s.common.remove}: ${item.name}`}
                          onClick={() => removeImage(item.id)}
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-semibold ${tokens.focusRing} ${tokens.dangerGhost}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
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
              buttonLabel={s.merge.addMore}
              invalidFileMessage={s.common.invalidFileError}
              onFiles={handleFiles}
            />
          </div>
        </div>
      </div>

      {/* Right: Stitch Settings */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.merge.directionLabel}
            value={direction}
            options={[
              { value: 'horizontal', label: s.merge.horizontal },
              { value: 'vertical', label: s.merge.vertical },
              { value: 'grid', label: s.merge.grid },
            ]}
            onChange={setDirection}
          />

          {direction !== 'grid' ? (
            <SegmentedControl
              theme={theme}
              label={s.merge.normalizeLabel}
              value={normalize}
              options={[
                { value: 'match-min', label: s.merge.matchMin },
                { value: 'match-max', label: s.merge.matchMax },
                { value: 'original', label: s.merge.original },
              ]}
              onChange={setNormalize}
            />
          ) : (
            <div className="space-y-3">
              <SliderField
                theme={theme}
                label={s.merge.columns}
                value={columns}
                min={2}
                max={4}
                onChange={setColumns}
              />
              <SegmentedControl
                theme={theme}
                label={s.merge.cellAspect}
                value={aspectCell}
                options={[
                  { value: '1:1', label: '1:1' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' },
                  { value: 'auto', label: s.common.auto },
                ]}
                onChange={setAspectCell}
              />
            </div>
          )}

          <SliderField theme={theme} label={s.common.gap} value={gap} min={0} max={64} unit="px" onChange={setGap} />
          <SliderField theme={theme} label={s.common.padding} value={padding} min={0} max={80} unit="px" onChange={setPadding} />
          <SliderField theme={theme} label={s.common.radius} value={borderRadius} min={0} max={48} unit="px" onChange={setBorderRadius} />

          <ColorSwatchRow
            theme={theme}
            label={s.common.background}
            value={background}
            options={bgSwatches}
            onChange={setBackground}
          />

          <SegmentedControl
            theme={theme}
            label={s.common.format}
            value={format}
            options={[
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
              { value: 'image/jpeg', label: 'JPEG' },
            ]}
            onChange={setFormat}
          />
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
              disabled={!activeResult || isBusy}
              onClick={() => activeResult && triggerBlobDownload(activeResult.blob, activeResult.filename)}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {isBusy ? s.common.processing : s.common.downloadImage}
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
