/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports CompressPreviewModal and CompressQuickTool for batch offline PNG/JPEG/WebP compression with per-item remove, click-to-preview lightbox, and ZIP export
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
  WorkspaceLocale,
  WorkspaceTheme,
  WorkspaceToolPanelProps,
} from '../types'
import { DropZone, SegmentedControl, SliderField } from '../uiPrimitives'

const MAX_WIDTH_OPTIONS = [
  { value: '0', label: 'Original' },
  { value: '1920', label: '1920px' },
  { value: '1280', label: '1280px' },
  { value: '800', label: '800px' },
]

export interface CompressPreviewModalProps {
  item: WorkspaceCompressItem
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  onClose: () => void
  onDownload: (item: WorkspaceCompressItem) => void
}

export function CompressPreviewModal({
  item,
  theme,
  locale,
  onClose,
  onDownload,
}: CompressPreviewModalProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const pct = Math.round(item.savedRatio * 100)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.filename}
      data-testid="compress-preview-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border p-4 shadow-2xl ${tokens.card}`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${tokens.text}`}>{item.filename}</p>
            <p className={`text-xs tabular-nums ${tokens.textSubtle}`}>
              {item.width} × {item.height} · {formatBytes(item.originalBytes)} → {formatBytes(item.outputBytes)} (
              {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tokens.buttonPrimary}`}
            >
              {s.common.downloadImage}
            </button>
            <button
              type="button"
              data-testid="compress-preview-close"
              aria-label={s.common.closePreview}
              onClick={onClose}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${tokens.buttonSecondary}`}
            >
              ×
            </button>
          </div>
        </div>

        <div className={`flex flex-1 items-center justify-center overflow-auto rounded-xl border p-3 ${tokens.cardMuted}`}>
          <img
            src={item.dataUrl}
            alt={item.filename}
            className="max-h-[68vh] max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  )
}

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
  const [previewId, setPreviewId] = useState<string | null>(null)
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

  const handleRemoveById = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id))
    setResults((prev) => prev.filter((item) => item.id !== id))
    if (previewId === id) setPreviewId(null)
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
  const previewItem = previewId ? activeResults.find((item) => item.id === previewId) ?? null : null
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
                    setPreviewId(null)
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.textMuted} hover:text-rose-500`}
                >
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          {activeResults.length > 0 ? (
            <>
              <p className={`mb-2 text-[11px] ${tokens.textSubtle}`}>{s.compress.clickToPreview}</p>
              <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {activeResults.map((item, idx) => {
                  const pct = Math.round(item.savedRatio * 100)
                  return (
                    <li
                      key={item.id}
                      data-testid={`compress-item-${idx}`}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-2.5 ${tokens.card}`}
                    >
                      <button
                        type="button"
                        data-testid={`compress-preview-btn-${idx}`}
                        title={s.compress.clickToPreview}
                        aria-label={`${s.common.inspectPreview}: ${item.filename}`}
                        onClick={() => setPreviewId(item.id)}
                        className="group flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.filename}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10 transition-transform group-hover:scale-105"
                        />
                        <div className="min-w-0">
                          <p className={`truncate text-xs font-semibold group-hover:text-indigo-500 ${tokens.text}`}>
                            {item.filename}
                          </p>
                          <p className={`mt-0.5 text-[11px] tabular-nums ${tokens.textSubtle}`}>
                            {formatBytes(item.originalBytes)} → {formatBytes(item.outputBytes)} · {item.width}×{item.height}
                          </p>
                        </div>
                      </button>
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
                        <button
                          type="button"
                          data-testid={`compress-remove-${idx}`}
                          title={s.common.remove}
                          aria-label={`${s.common.remove}: ${item.filename}`}
                          onClick={() => handleRemoveById(item.id)}
                          className="rounded-lg border border-rose-300/60 px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
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

      {previewItem && (
        <CompressPreviewModal
          item={previewItem}
          theme={theme}
          locale={locale}
          onClose={() => setPreviewId(null)}
          onDownload={(item) => triggerBlobDownload(item.blob, item.filename)}
        />
      )}
    </div>
  )
}
