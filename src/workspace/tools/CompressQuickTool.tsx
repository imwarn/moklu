/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports CompressQuickTool component for batch offline PNG/JPEG/WebP compression and format conversion
 * [POS]: local batch image compressor panel inside src/workspace/tools; delegates compression and ZIP packaging to injected engines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useState } from 'react'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceCompressItem,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
} from '../types'
import { DropZone, SegmentedControl, SliderField } from '../uiPrimitives'

const MAX_WIDTH_OPTIONS = [
  { value: '0', label: 'Original' },
  { value: '1920', label: '1920px' },
  { value: '1280', label: '1280px' },
  { value: '800', label: '800px' },
]

export function CompressQuickTool({
  preset,
  locale,
  theme,
  engines,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [format, setFormat] = useState<WorkspaceImageFormat>(preset.targetFormat ?? 'image/webp')
  const [qualityPercent, setQualityPercent] = useState<number>(82)
  const [maxWidthKey, setMaxWidthKey] = useState<string>('0')
  const [results, setResults] = useState<WorkspaceCompressItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null)
    try {
      const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
      setImages((prev) => [...prev, ...loaded])
    } catch {
      setError('Unable to decode one or more images.')
    }
  }, [])

  const handleLoadDemo = () => {
    setError(null)
    setImages([
      createDemoImageInput('saas', 'landing-hero.svg'),
      createDemoImageInput('photo-1', 'feature-banner.svg'),
    ])
  }

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    const run = async () => {
      setProcessing(true)
      setError(null)
      try {
        const parsedMaxWidth = Number(maxWidthKey)
        const compressed = await engines.compress(images, {
          format,
          quality: qualityPercent / 100,
          ...(parsedMaxWidth > 0 ? { maxWidth: parsedMaxWidth } : {}),
        })
        if (!cancelled) setResults(compressed)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Compression failed')
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [images, format, qualityPercent, maxWidthKey, engines])

  const activeResults = images.length > 0 ? results : []
  const totalOriginal = activeResults.reduce((acc, item) => acc + item.originalBytes, 0)
  const totalOutput = activeResults.reduce((acc, item) => acc + item.outputBytes, 0)
  const totalSavedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalOutput) / totalOriginal) * 100) : 0

  const handleDownloadAllZip = async () => {
    if (activeResults.length === 0) return
    const zipBlob = await engines.packZip(
      activeResults.map((item) => ({ filename: item.filename, blob: item.blob })),
    )
    triggerBlobDownload(zipBlob, `moklu-compressed-${activeResults.length}.zip`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: File List & Savings Readout */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.compress.beforeAfter}
              </span>
              {activeResults.length > 0 && (
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${tokens.privacyBadge}`}>
                  {s.compress.totalSaved}: {totalSavedPct >= 0 ? `-${totalSavedPct}%` : `+${Math.abs(totalSavedPct)}%`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.buttonSecondary}`}
              >
                {s.common.tryDemo}
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setImages([])
                    setResults([])
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.textMuted} hover:text-rose-500`}
                >
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          {activeResults.length > 0 ? (
            <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {activeResults.map((item) => {
                const pct = Math.round(item.savedRatio * 100)
                return (
                  <li
                    key={item.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-2.5 ${tokens.card}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.dataUrl}
                        alt={item.filename}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-semibold ${tokens.text}`}>{item.filename}</p>
                        <p className={`mt-0.5 text-[11px] tabular-nums ${tokens.textSubtle}`}>
                          {formatBytes(item.originalBytes)} → {formatBytes(item.outputBytes)} · {item.width}×{item.height}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                          pct >= 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-600'
                        }`}
                      >
                        {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
                      </span>
                      <button
                        type="button"
                        onClick={() => triggerBlobDownload(item.blob, item.filename)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${tokens.buttonSecondary}`}
                      >
                        {s.common.downloadImage}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className={`flex min-h-[200px] items-center justify-center rounded-xl border p-4 ${tokens.cardMuted}`}>
              <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
            </div>
          )}

          <div className="mt-3">
            <DropZone
              theme={theme}
              compact
              multiple
              title={s.common.dropMultipleTitle}
              hint={s.common.dropHint}
              buttonLabel={s.compress.addImages}
              onFiles={handleFiles}
            />
          </div>
        </div>
      </div>

      {/* Right: Format & Quality Controls */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.common.format}
            value={format}
            options={[
              { value: 'image/webp', label: 'WebP' },
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'image/png', label: 'PNG' },
            ]}
            onChange={setFormat}
          />

          <SliderField
            theme={theme}
            label={s.common.quality}
            value={qualityPercent}
            min={10}
            max={100}
            unit="%"
            onChange={setQualityPercent}
          />

          <SegmentedControl
            theme={theme}
            label={s.compress.maxWidthLabel}
            value={maxWidthKey}
            options={MAX_WIDTH_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.value === '0' ? s.compress.keepOriginalWidth : opt.label,
            }))}
            onChange={setMaxWidthKey}
          />
        </div>

        <div className="space-y-2 border-t pt-4 border-current/10">
          {error && (
            <p role="alert" className="text-xs font-medium text-rose-500">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={activeResults.length === 0 || processing}
            onClick={handleDownloadAllZip}
            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.buttonPrimary}`}
          >
            {processing ? s.compress.compressing : s.common.downloadZip}
          </button>
        </div>
      </div>
    </div>
  )
}
