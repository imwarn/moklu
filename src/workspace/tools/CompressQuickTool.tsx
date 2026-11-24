/**
 * [INPUT]: depends on react, ModalShell from @/components/ui/ModalShell, canEncodeCanvasFormat/isHeicFile from @/tools, trackFunnelEvent from @/utils/telemetry, BeforeAfterSlider from ./BeforeAfterSlider, p1ToolsLocale from ../locales/p1ToolsLocale, canvasUtils, draftStorage, i18n, themeTokens, uiPrimitives, useDebouncedValue, useToolDraft, and workspace types
 * [OUTPUT]: exports ExifPrivacyBanner, CompressPreviewModal, and CompressQuickTool supporting quality-slider vs target-KB binary-search compression, Safari WebP-to-JPEG capability fallback, container-query responsive item cards, auto-downscale fallback toggle, HEIC/EXIF ingestion & inspector banner, interactive Before/After split slider with 200% zoom, clipboard copy, telemetry, draft auto-save, and ZIP download
 * [POS]: local batch image compressor, target-KB optimizer, and EXIF stripper panel inside src/workspace/tools; delegates encoding to injected engines.compress
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { canEncodeCanvasFormat, isHeicFile } from '@/tools'
import { trackFunnelEvent } from '@/utils/telemetry'
import {
  copyImageToClipboard, createDemoImageInput, formatBytes, loadHtmlImage,
  readFileAsImageInput, triggerBlobDownload, type DemoVariant,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { getWorkspaceStrings } from '../i18n'
import { getP1ToolsStrings } from '../locales/p1ToolsLocale'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceCompressItem, WorkspaceExifSummary, WorkspaceImageFormat,
  WorkspaceImageInput, WorkspaceLocale, WorkspaceTheme, WorkspaceToolPanelProps,
} from '../types'
import { DraftStatusBar, DropZone, PreviewBusyOverlay, SegmentedControl, SliderField } from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'
import { useToolDraft } from '../useToolDraft'
import { BeforeAfterSlider } from './BeforeAfterSlider'

type CompressMode = 'quality' | 'target-kb'

interface CompressDraftSettings {
  format: WorkspaceImageFormat
  qualityPercent: number
  maxWidthKey: string
  compressMode: CompressMode
  targetKb: number
  preserveOriginalDimensions: boolean
}

const MAX_WIDTH_OPTIONS = [
  { value: '0', label: 'Original' },
  { value: '1920', label: '1920px' },
  { value: '1280', label: '1280px' },
  { value: '800', label: '800px' },
]

const TARGET_KB_PRESETS = [
  { value: 100, label: '100 KB' },
  { value: 200, label: '200 KB' },
  { value: 500, label: '500 KB' },
  { value: 1024, label: '1 MB' },
] as const

function clampTargetKb(raw: number): number {
  if (!Number.isFinite(raw)) return 200
  return Math.max(10, Math.min(10240, Math.round(raw)))
}

function preferredLossyFormat(): WorkspaceImageFormat {
  return canEncodeCanvasFormat('image/webp') ? 'image/webp' : 'image/jpeg'
}

async function createRasterCompressDemoInput(variant: DemoVariant, filename: string): Promise<WorkspaceImageInput> {
  const base = createDemoImageInput(variant, filename)
  if (typeof document === 'undefined') return base
  try {
    const img = await loadHtmlImage(base.dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = base.width
    canvas.height = base.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return base
    ctx.drawImage(img, 0, 0, base.width, base.height)
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!pngBlob) return base
    const pngFile = new File([pngBlob], filename, { type: 'image/png' })
    const loaded = await readFileAsImageInput(pngFile, filename)
    return { ...loaded, isDemo: true }
  } catch {
    return base
  }
}

function formatExposureSummary(exif: WorkspaceExifSummary): string | null {
  const parts = [exif.exposureTime, exif.fNumber, exif.iso !== undefined ? `ISO ${exif.iso}` : undefined].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

function formatCameraSummary(exif: WorkspaceExifSummary): string | null {
  const parts = [exif.make, exif.model].filter((part): part is string => Boolean(part && part.trim()))
  return parts.length > 0 ? parts.join(' ') : null
}

export interface ExifPrivacyBannerProps {
  items: Array<{ id: string; name: string; exif?: WorkspaceExifSummary }>
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  defaultExpanded?: boolean
}

export function ExifPrivacyBanner({ items, locale, theme, defaultExpanded = false }: ExifPrivacyBannerProps) {
  const p1 = getP1ToolsStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

  const exifItems = items.filter((item): item is { id: string; name: string; exif: WorkspaceExifSummary } =>
    Boolean(item.exif?.hasExif),
  )
  if (exifItems.length === 0) return null

  const totalTags = exifItems.reduce((sum, item) => sum + Math.max(1, item.exif.tagCount), 0)
  const hasGps = exifItems.some((item) => Boolean(item.exif.gps))
  const bannerLabel = hasGps ? p1.compress.exifBannerWithGps(totalTags) : p1.compress.exifBannerNoGps(totalTags)

  return (
    <div
      data-testid="compress-exif-banner"
      className={`mb-3 rounded-xl border p-3 ${
        theme === 'dark' ? 'border-warning/40 bg-warning/10 text-zinc-100' : 'border-warning/35 bg-warning/[0.08] text-zinc-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span aria-hidden="true" className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-zinc-950">
            !
          </span>
          <p className="text-xs font-semibold leading-snug text-warning">{bannerLabel}</p>
        </div>
        <button
          type="button"
          data-testid="compress-exif-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className={`min-h-7 shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
        >
          {expanded ? p1.compress.exifHide : p1.compress.exifInspect}
        </button>
      </div>

      {expanded && (
        <div data-testid="compress-exif-details" className="mt-2.5 space-y-2 border-t border-warning/25 pt-2.5 text-[11px]">
          {exifItems.map((entry) => {
            const camera = formatCameraSummary(entry.exif)
            const exposure = formatExposureSummary(entry.exif)
            return (
              <div key={entry.id} className={`rounded-lg border p-2.5 ${tokens.card}`}>
                <p className={`truncate font-semibold ${tokens.text}`}>{entry.name}</p>
                <dl className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {entry.exif.gps && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifGpsLabel}:</dt>
                      <dd className="font-mono font-semibold text-warning tabular-nums">
                        {entry.exif.gps.latitude.toFixed(5)}, {entry.exif.gps.longitude.toFixed(5)}
                      </dd>
                    </div>
                  )}
                  {camera && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifCameraLabel}:</dt>
                      <dd className={`truncate font-medium ${tokens.text}`}>{camera}</dd>
                    </div>
                  )}
                  {entry.exif.dateTimeOriginal && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifDateLabel}:</dt>
                      <dd className={`font-mono tabular-nums ${tokens.text}`}>{entry.exif.dateTimeOriginal}</dd>
                    </div>
                  )}
                  {exposure && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifExposureLabel}:</dt>
                      <dd className={`font-mono tabular-nums ${tokens.text}`}>{exposure}</dd>
                    </div>
                  )}
                  {entry.exif.software && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifSoftwareLabel}:</dt>
                      <dd className={`truncate ${tokens.text}`}>{entry.exif.software}</dd>
                    </div>
                  )}
                  {entry.exif.orientation !== undefined && (
                    <div className="flex gap-1.5">
                      <dt className={`shrink-0 font-medium ${tokens.textSubtle}`}>{p1.compress.exifOrientationLabel}:</dt>
                      <dd className={`font-mono tabular-nums ${tokens.text}`}>#{entry.exif.orientation}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )
          })}
          <p className={`text-[11px] font-medium ${tokens.textMuted}`}>{p1.compress.exifStripGuarantee}</p>
        </div>
      )}
    </div>
  )
}

export interface CompressPreviewModalProps {
  item: WorkspaceCompressItem
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  onClose: () => void
  onDownload: (item: WorkspaceCompressItem) => void
  onCopy?: (item: WorkspaceCompressItem) => void
  copied?: boolean
}

export function CompressPreviewModal({
  item, theme, locale, onClose, onDownload, onCopy, copied = false,
}: CompressPreviewModalProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const pct = Math.round(item.savedRatio * 100)

  const header = (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${tokens.text}`}>{item.filename}</p>
        <p className={`text-xs tabular-nums ${tokens.textSubtle}`}>
          {item.width} × {item.height} · {formatBytes(item.originalBytes)} → {formatBytes(item.outputBytes)} ({pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`})
        </p>
      </div>
      <button
        type="button"
        data-testid="compress-preview-close"
        aria-label={s.common.closePreview}
        onClick={onClose}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
      >
        ×
      </button>
    </div>
  )

  return (
    <ModalShell
      open
      onClose={onClose}
      title={item.filename}
      header={header}
      showCloseButton={false}
      maxWidth="max-w-4xl"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-3 sm:p-4 backdrop-blur-xs"
      backdropStyle={{}}
      panelClassName={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-2xl ${tokens.card}`}
      panelStyle={{}}
    >
      <div data-testid="compress-preview-modal" className="flex flex-1 flex-col overflow-y-auto">
        <BeforeAfterSlider
          originalSrc={item.originalDataUrl ?? item.dataUrl}
          compressedSrc={item.dataUrl}
          originalBytes={item.originalBytes}
          outputBytes={item.outputBytes}
          filename={item.filename}
          width={item.width}
          height={item.height}
          locale={locale}
          theme={theme}
          copied={copied}
          onCopy={onCopy ? () => onCopy(item) : undefined}
          onDownload={() => onDownload(item)}
        />
      </div>
    </ModalShell>
  )
}

export function CompressQuickTool({ preset, locale, theme, engines }: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const p1 = getP1ToolsStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const targetKbInputId = useId()
  const initialTargetMode = Boolean(preset.targetSizeKb && preset.targetSizeKb > 0)
  const initialPngSwitched = initialTargetMode && preset.targetFormat === 'image/png'

  const rawInitialFormat: WorkspaceImageFormat = initialPngSwitched ? 'image/webp' : (preset.targetFormat ?? 'image/webp')
  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [compressMode, setCompressMode] = useState<CompressMode>(initialTargetMode ? 'target-kb' : 'quality')
  const [targetKb, setTargetKb] = useState<number>(() => clampTargetKb(preset.targetSizeKb ?? 200))
  const [preserveOriginalDimensions, setPreserveOriginalDimensions] = useState<boolean>(false)
  const [format, setFormat] = useState<WorkspaceImageFormat>(() =>
    rawInitialFormat === 'image/webp' && !canEncodeCanvasFormat('image/webp') ? 'image/jpeg' : rawInitialFormat,
  )
  const [pngAutoSwitched, setPngAutoSwitched] = useState<boolean>(initialPngSwitched)
  const [webpFallbackNote, setWebpFallbackNote] = useState<boolean>(
    () => rawInitialFormat === 'image/webp' && !canEncodeCanvasFormat('image/webp'),
  )
  const [qualityPercent, setQualityPercent] = useState<number>(82)
  const [maxWidthKey, setMaxWidthKey] = useState<string>('0')
  const [results, setResults] = useState<WorkspaceCompressItem[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [decodingHeic, setDecodingHeic] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const copyTimerRef = useRef<number | null>(null)

  const draftSettings = useMemo<CompressDraftSettings>(
    () => ({ format, qualityPercent, maxWidthKey, compressMode, targetKb, preserveOriginalDimensions }),
    [format, qualityPercent, maxWidthKey, compressMode, targetKb, preserveOriginalDimensions],
  )

  const handleRestoreDraft = (draft: WorkspaceToolDraft<CompressDraftSettings>) => {
    const restored = deserializeDraftImages(draft.images)
    if (restored.length > 0) setImages(restored)
    const cfg = draft.settings
    if (cfg.compressMode === 'quality' || cfg.compressMode === 'target-kb') setCompressMode(cfg.compressMode)
    if (typeof cfg.targetKb === 'number' && Number.isFinite(cfg.targetKb)) setTargetKb(clampTargetKb(cfg.targetKb))
    if (typeof cfg.preserveOriginalDimensions === 'boolean') setPreserveOriginalDimensions(cfg.preserveOriginalDimensions)
    if (cfg.format === 'image/png' || cfg.format === 'image/jpeg' || cfg.format === 'image/webp') {
      if (cfg.compressMode === 'target-kb' && cfg.format === 'image/png') {
        setFormat(preferredLossyFormat())
        setPngAutoSwitched(true)
      } else if (cfg.format === 'image/webp' && !canEncodeCanvasFormat('image/webp')) {
        setFormat('image/jpeg')
        setWebpFallbackNote(true)
      } else {
        setFormat(cfg.format)
      }
    }
    if (typeof cfg.qualityPercent === 'number' && Number.isFinite(cfg.qualityPercent)) setQualityPercent(Math.max(10, Math.min(100, Math.round(cfg.qualityPercent))))
    if (typeof cfg.maxWidthKey === 'string' && MAX_WIDTH_OPTIONS.some((o) => o.value === cfg.maxWidthKey)) setMaxWidthKey(cfg.maxWidthKey)
  }

  const { hasDraft, clearDraft } = useToolDraft<CompressDraftSettings>({
    toolId: 'compress', images, settings: draftSettings, onRestore: handleRestoreDraft,
  })

  useEffect(() => () => {
    if (copyTimerRef.current !== null && typeof window !== 'undefined') window.clearTimeout(copyTimerRef.current)
  }, [])

  const handleModeChange = (nextMode: CompressMode) => {
    setCompressMode(nextMode)
    if (nextMode === 'target-kb' && format === 'image/png') {
      const lossy = preferredLossyFormat()
      setFormat(lossy)
      setPngAutoSwitched(true)
      if (lossy === 'image/jpeg') setWebpFallbackNote(true)
    } else if (nextMode === 'quality') {
      setPngAutoSwitched(false)
    }
  }

  const handleFormatChange = (nextFormat: WorkspaceImageFormat) => {
    if (compressMode === 'target-kb' && nextFormat === 'image/png') {
      const lossy = preferredLossyFormat()
      setFormat(lossy)
      setPngAutoSwitched(true)
      if (lossy === 'image/jpeg') setWebpFallbackNote(true)
      return
    }
    if (nextFormat === 'image/webp' && !canEncodeCanvasFormat('image/webp')) {
      setPngAutoSwitched(false)
      setFormat('image/jpeg')
      setWebpFallbackNote(true)
      return
    }
    setPngAutoSwitched(false)
    setWebpFallbackNote(false)
    setFormat(nextFormat)
  }

  const handleClearAll = () => {
    setImages([]); setResults([]); setPreviewId(null); setCopiedId(null); void clearDraft()
  }

  const debouncedQualityPercent = useDebouncedValue(qualityPercent)
  const debouncedTargetKb = useDebouncedValue(targetKb)
  const hasPendingParams = images.length > 0 && (compressMode === 'target-kb' ? debouncedTargetKb !== targetKb : debouncedQualityPercent !== qualityPercent)
  const isBusy = processing || decodingHeic || hasPendingParams

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null)
      const hasHeic = files.some((file) => isHeicFile(file))
      if (hasHeic) setDecodingHeic(true)
      try {
        const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
        setImages((prev) => [...prev, ...loaded])
        trackFunnelEvent('image_loaded', { tool: 'compress', count: loaded.length, hasHeic, hasExif: loaded.some((item) => Boolean(item.exif?.hasExif)) })
      } catch {
        setError(s.common.decodeError)
      } finally {
        if (hasHeic) setDecodingHeic(false)
      }
    },
    [s.common.decodeError],
  )

  const handleLoadDemo = async () => {
    setError(null)
    const [first, second] = await Promise.all([
      createRasterCompressDemoInput('saas', 'landing-hero.png'),
      createRasterCompressDemoInput('photo-1', 'feature-banner.png'),
    ])
    setImages([first, second])
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
          quality: debouncedQualityPercent / 100,
          ...(parsedMaxWidth > 0 ? { maxWidth: parsedMaxWidth } : {}),
          ...(compressMode === 'target-kb' ? { targetBytes: debouncedTargetKb * 1024, preserveOriginalDimensions } : {}),
        })
        if (!cancelled) setResults(compressed)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.compress.compressError)
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [images, format, debouncedQualityPercent, maxWidthKey, compressMode, debouncedTargetKb, preserveOriginalDimensions, engines, s.compress.compressError])

  const activeResults = images.length > 0 ? results : []
  const previewItem = previewId ? activeResults.find((item) => item.id === previewId) ?? null : null
  const totalOriginal = activeResults.reduce((acc, item) => acc + item.originalBytes, 0)
  const totalOutput = activeResults.reduce((acc, item) => acc + item.outputBytes, 0)
  const totalSavedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalOutput) / totalOriginal) * 100) : 0
  const downscaledItem = compressMode === 'target-kb' ? activeResults.find((item) => item.autoDownscaled === true) : undefined
  const preservedUnmetItem = compressMode === 'target-kb' && preserveOriginalDimensions ? activeResults.find((item) => item.targetBytesMet === false) : undefined
  const anyExif = images.some((item) => Boolean(item.exif?.hasExif))
  const singleResult = activeResults.length === 1 ? activeResults[0] : null
  const singleOriginalSrc = singleResult?.originalDataUrl ?? images[0]?.dataUrl ?? singleResult?.dataUrl

  const handleDownloadItem = (item: WorkspaceCompressItem) => {
    triggerBlobDownload(item.blob, item.filename)
    trackFunnelEvent('export_completed', { tool: 'compress', mime: item.mimeType, mode: compressMode, count: 1 })
  }

  const handleCopyItem = async (item: WorkspaceCompressItem) => {
    setError(null)
    try {
      await copyImageToClipboard(item.blob, item.dataUrl)
      setCopiedId(item.id)
      trackFunnelEvent('copy_completed', { tool: 'compress', mime: item.mimeType })
      if (copyTimerRef.current !== null && typeof window !== 'undefined') window.clearTimeout(copyTimerRef.current)
      if (typeof window !== 'undefined') {
        copyTimerRef.current = window.setTimeout(() => { setCopiedId(null); copyTimerRef.current = null }, 1500)
      }
    } catch {
      setError(s.common.copyError)
    }
  }

  const handleDownloadAllZip = async () => {
    if (activeResults.length === 0 || zipping) return
    setZipping(true)
    setError(null)
    try {
      const zipBlob = await engines.packZip(activeResults.map((item) => ({ filename: item.filename, blob: item.blob })))
      triggerBlobDownload(zipBlob, `moklu-compressed-${activeResults.length}.zip`)
      trackFunnelEvent('export_completed', { tool: 'compress', mime: 'application/zip', mode: compressMode, count: activeResults.length })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : s.common.zipError)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: EXIF Inspector, Split Comparison & File List */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-3.5 sm:p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>{s.compress.beforeAfter}</span>
              {activeResults.length > 0 && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    totalSavedPct >= 0 ? tokens.privacyBadge : tokens.badgeWarning
                  }`}
                >
                  {s.compress.totalSaved}: {totalSavedPct >= 0 ? `-${totalSavedPct}%` : `+${Math.abs(totalSavedPct)}%`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleLoadDemo} className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}>
                {s.common.tryDemo}
              </button>
              {images.length > 0 && (
                <button type="button" onClick={handleClearAll} className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.focusRing} ${tokens.textMuted} hover:text-danger`}>
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          <ExifPrivacyBanner items={images} locale={locale} theme={theme} defaultExpanded={Boolean(preset.inspectExif)} />

          {preset.inspectExif && images.length === 0 && (
            <div data-testid="compress-exif-intro" className={`mb-3 rounded-xl border px-3 py-2 text-xs ${tokens.privacyBanner}`}>
              {p1.compress.exifRouteIntro}
            </div>
          )}
          {preset.inspectExif && images.length > 0 && !anyExif && (
            <div data-testid="compress-exif-clean" className={`mb-3 rounded-xl border px-3 py-2 text-xs font-medium ${tokens.privacyBanner}`}>
              {p1.compress.exifCleanNotice}
            </div>
          )}

          {(downscaledItem || preservedUnmetItem) && (
            <div
              data-testid="compress-auto-downscale-banner"
              className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs ${
                theme === 'dark' ? 'border-warning/40 bg-warning/10 text-zinc-100' : 'border-warning/35 bg-warning/[0.08] text-zinc-900'
              }`}
            >
              <p className="min-w-0 flex-1 leading-snug text-warning">
                {downscaledItem ? p1.compress.autoDownscaleNotice(downscaledItem.width, targetKb) : p1.compress.preserveUnmetNotice(targetKb)}
              </p>
              <button
                type="button"
                data-testid="compress-preserve-dims-toggle"
                onClick={() => setPreserveOriginalDimensions((prev) => !prev)}
                className={`min-h-7 shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}
              >
                {preserveOriginalDimensions ? p1.compress.allowAutoScale : p1.compress.keepOriginalRetry}
              </button>
            </div>
          )}

          <div aria-busy={isBusy} className="relative">
            {isBusy && <PreviewBusyOverlay theme={theme} label={decodingHeic ? p1.compress.heicDecoding : s.compress.compressing} />}

            {singleResult && singleOriginalSrc && (
              <div className="mb-3">
                <BeforeAfterSlider
                  compact
                  originalSrc={singleOriginalSrc}
                  compressedSrc={singleResult.dataUrl}
                  originalBytes={singleResult.originalBytes}
                  outputBytes={singleResult.outputBytes}
                  filename={singleResult.filename}
                  width={singleResult.width}
                  height={singleResult.height}
                  locale={locale}
                  theme={theme}
                  copied={copiedId === singleResult.id}
                  onCopy={() => void handleCopyItem(singleResult)}
                  onDownload={() => handleDownloadItem(singleResult)}
                />
              </div>
            )}

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
                        className={`@container flex flex-col gap-2.5 rounded-xl border p-2.5 @md:flex-row @md:items-center @md:justify-between ${tokens.card}`}
                      >
                        <button
                          type="button"
                          data-testid={`compress-preview-btn-${idx}`}
                          title={s.compress.clickToPreview}
                          aria-label={`${s.common.inspectPreview}: ${item.filename}`}
                          onClick={() => setPreviewId(item.id)}
                          className={`group flex w-full min-w-0 items-center gap-3 rounded-lg text-left @md:w-auto @md:flex-1 ${tokens.focusRing}`}
                        >
                          <img src={item.dataUrl} alt={item.filename} className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10 transition-transform group-hover:scale-105" />
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-semibold group-hover:text-accent-text ${tokens.text}`}>{item.filename}</p>
                            <p className={`mt-0.5 text-[11px] leading-snug tabular-nums ${tokens.textSubtle}`}>
                              {formatBytes(item.originalBytes)} → {formatBytes(item.outputBytes)} · {item.width}×{item.height}
                              {compressMode === 'target-kb' && item.appliedQuality !== undefined
                                ? ` · ${p1.compress.appliedQualityLabel} ${Math.round(item.appliedQuality * 100)}%`
                                : ''}
                            </p>
                          </div>
                        </button>
                        <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-current/10 pt-2 @md:shrink-0 @md:border-t-0 @md:pt-0">
                          {compressMode === 'target-kb' && item.targetBytesMet && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tokens.badgePositive}`}>{p1.compress.targetMetBadge}</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${pct >= 0 ? tokens.badgePositive : tokens.badgeWarning}`}>
                            {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
                          </span>
                          <button type="button" data-testid={`compress-compare-btn-${idx}`} onClick={() => setPreviewId(item.id)} className={`min-h-8 rounded-lg px-2 py-1 text-[11px] font-semibold ${tokens.focusRing} ${tokens.accentChip}`}>
                            {p1.compress.compareAction}
                          </button>
                          <button type="button" onClick={() => handleDownloadItem(item)} className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold ${tokens.focusRing} ${tokens.buttonSecondary}`}>
                            {s.common.downloadImage}
                          </button>
                          <button
                            type="button"
                            data-testid={`compress-remove-${idx}`}
                            title={s.common.remove}
                            aria-label={`${s.common.remove}: ${item.filename}`}
                            onClick={() => handleRemoveById(item.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${tokens.focusRing} ${tokens.dangerGhost}`}
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
          </div>

          <div className="mt-3">
            <DropZone
              theme={theme}
              compact
              multiple
              title={s.common.dropMultipleTitle}
              hint={s.common.dropHint}
              buttonLabel={s.compress.addImages}
              invalidFileMessage={s.common.invalidFileError}
              onFiles={handleFiles}
            />
          </div>
          {hasDraft && (
            <DraftStatusBar theme={theme} toolId="compress" savedLabel={s.common.draftSaved} clearLabel={s.common.clearDraft} onClear={handleClearAll} />
          )}
        </div>
      </div>

      {/* Right: Compression Mode, Target-KB / Quality & Format Controls */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-4 sm:p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={p1.compress.modeLabel}
            value={compressMode}
            options={[{ value: 'quality', label: p1.compress.modeQuality }, { value: 'target-kb', label: p1.compress.modeTargetKb }]}
            onChange={handleModeChange}
          />
          <SegmentedControl
            theme={theme}
            label={s.common.format}
            value={format}
            options={[{ value: 'image/webp', label: 'WebP' }, { value: 'image/jpeg', label: 'JPEG' }, { value: 'image/png', label: 'PNG' }]}
            onChange={handleFormatChange}
          />
          {pngAutoSwitched && (
            <p data-testid="compress-png-autoswitch-note" className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${tokens.cardMuted} ${tokens.textMuted}`}>
              {p1.compress.pngAutoSwitchedNote}
            </p>
          )}
          {webpFallbackNote && (
            <p data-testid="compress-webp-fallback-note" className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${tokens.cardMuted} ${tokens.textMuted}`}>
              {p1.compress.webpFallbackNote}
            </p>
          )}
          {compressMode === 'target-kb' ? (
            <div data-testid="compress-target-kb-controls" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={targetKbInputId} className={`text-xs font-semibold ${tokens.textMuted}`}>{p1.compress.targetKbLabel}</label>
                <span className={`text-xs font-semibold tabular-nums ${tokens.text}`}>{targetKb} KB</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TARGET_KB_PRESETS.map((opt) => {
                  const active = targetKb === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={`compress-target-preset-${opt.value}`}
                      aria-pressed={active}
                      onClick={() => setTargetKb(opt.value)}
                      className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors ${tokens.focusRing} ${active ? tokens.pillActive : tokens.pillIdle}`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id={targetKbInputId}
                  type="number"
                  data-testid="compress-target-kb-input"
                  aria-label={p1.compress.customKbLabel}
                  min={10}
                  max={10240}
                  step={10}
                  value={targetKb}
                  onChange={(e) => setTargetKb(clampTargetKb(Number(e.target.value)))}
                  className={`h-9 w-full rounded-lg border px-3 text-xs font-semibold tabular-nums ${tokens.input}`}
                />
                <span className={`shrink-0 text-xs font-semibold ${tokens.textMuted}`}>KB</span>
              </div>
            </div>
          ) : (
            <SliderField theme={theme} label={s.common.quality} value={qualityPercent} min={10} max={100} unit="%" onChange={setQualityPercent} />
          )}
          <SegmentedControl
            theme={theme}
            label={s.compress.maxWidthLabel}
            value={maxWidthKey}
            options={MAX_WIDTH_OPTIONS.map((opt) => ({ value: opt.value, label: opt.value === '0' ? s.compress.keepOriginalWidth : opt.label }))}
            onChange={setMaxWidthKey}
          />
        </div>

        <div className="space-y-2 border-t pt-4 border-current/10">
          {error && <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>{error}</p>}
          <button
            type="button"
            disabled={activeResults.length === 0 || isBusy || zipping}
            onClick={handleDownloadAllZip}
            className={`inline-flex min-h-9 w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
          >
            {zipping ? s.common.downloading : isBusy ? s.compress.compressing : s.common.downloadZip}
          </button>
        </div>
      </div>

      {previewItem && (
        <CompressPreviewModal
          item={previewItem}
          theme={theme}
          locale={locale}
          copied={copiedId === previewItem.id}
          onCopy={(item) => void handleCopyItem(item)}
          onClose={() => setPreviewId(null)}
          onDownload={handleDownloadItem}
        />
      )}
    </div>
  )
}
