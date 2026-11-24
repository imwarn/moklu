/**
 * [INPUT]: depends on react, isHeicFile from @/tools, trackFunnelEvent from @/utils/telemetry, canvasUtils from ../canvasUtils, draftStorage from ../draftStorage, ExifPrivacyBanner from ../ExifPrivacyBanner, useToolDraft from ../useToolDraft, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports IdCardQuickTool component for offline A4 front+back ID card sheet layout, HEIC decoding progress, EXIF privacy banner, clipboard Copy Image loop, local IndexedDB draft auto-save (excluding sample mock IDs), and debounced anti-fraud watermarking
 * [POS]: privacy-first ID card watermark tool panel inside src/workspace/tools; delegates A4 rendering to injected engines.idCard
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { isHeicFile } from '@/tools'
import { trackFunnelEvent } from '@/utils/telemetry'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { ExifPrivacyBanner } from '../ExifPrivacyBanner'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceBlobOutput,
  WorkspaceIdCardOptions,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
} from '../types'
import {
  ColorSwatchRow,
  CopyImageButton,
  DraftStatusBar,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
} from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'
import { useToolDraft } from '../useToolDraft'

interface IdCardDraftSettings {
  frontId: string | null
  backId: string | null
  customWatermark: string | null
  watermarkMode: WorkspaceIdCardOptions['watermarkMode']
  opacityPercent: number
  angle: number
  fontSize: number
  color: string
  dpi: '150' | '300'
  grayscale: boolean
}

export function IdCardQuickTool({
  locale,
  theme,
  engines,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)
  const watermarkInputId = useId()

  const inkSwatches = useMemo(
    () => [
      { label: s.swatches.slateGray, value: '#334155' },
      { label: s.swatches.securityRed, value: '#b91c1c' },
      { label: s.swatches.navyBlue, value: '#1d4ed8' },
      { label: s.swatches.charcoal, value: '#0f172a' },
    ],
    [s.swatches],
  )

  const [front, setFront] = useState<WorkspaceImageInput | null>(null)
  const [back, setBack] = useState<WorkspaceImageInput | null>(null)
  // Keep null until manually edited so switching UI locale updates the default watermark without remounting.
  const [customWatermark, setCustomWatermark] = useState<string | null>(null)
  const [watermarkMode, setWatermarkMode] = useState<WorkspaceIdCardOptions['watermarkMode']>('tiled')
  const [opacityPercent, setOpacityPercent] = useState<number>(28)
  const [angle, setAngle] = useState<number>(-30)
  const [fontSize, setFontSize] = useState<number>(28)
  const [color, setColor] = useState<string>('#334155')
  const [dpi, setDpi] = useState<'150' | '300'>('300')
  const [grayscale, setGrayscale] = useState<boolean>(false)
  const [sheet, setSheet] = useState<WorkspaceBlobOutput | null>(null)
  const [frontHeicDecoding, setFrontHeicDecoding] = useState(false)
  const [backHeicDecoding, setBackHeicDecoding] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draftImages = useMemo(() => {
    const list: WorkspaceImageInput[] = []
    if (front) list.push(front)
    if (back) list.push(back)
    return list
  }, [front, back])

  const draftSettings = useMemo<IdCardDraftSettings>(
    () => ({
      frontId: front && !front.isDemo ? front.id : null,
      backId: back && !back.isDemo ? back.id : null,
      customWatermark,
      watermarkMode,
      opacityPercent,
      angle,
      fontSize,
      color,
      dpi,
      grayscale,
    }),
    [front, back, customWatermark, watermarkMode, opacityPercent, angle, fontSize, color, dpi, grayscale],
  )

  const handleRestoreDraft = useCallback((draft: WorkspaceToolDraft<IdCardDraftSettings>) => {
    const restored = deserializeDraftImages(draft.images)
    const cfg = draft.settings
    if (cfg.frontId) {
      const matchedFront = restored.find((img) => img.id === cfg.frontId) ?? null
      if (matchedFront) setFront(matchedFront)
    }
    if (cfg.backId) {
      const matchedBack = restored.find((img) => img.id === cfg.backId) ?? null
      if (matchedBack) setBack(matchedBack)
    }
    if (typeof cfg.customWatermark === 'string' || cfg.customWatermark === null) {
      setCustomWatermark(cfg.customWatermark)
    }
    if (cfg.watermarkMode === 'tiled' || cfg.watermarkMode === 'across-card') {
      setWatermarkMode(cfg.watermarkMode)
    }
    if (typeof cfg.opacityPercent === 'number' && Number.isFinite(cfg.opacityPercent)) {
      setOpacityPercent(Math.max(8, Math.min(75, Math.round(cfg.opacityPercent))))
    }
    if (typeof cfg.angle === 'number' && Number.isFinite(cfg.angle)) {
      setAngle(Math.max(-60, Math.min(60, Math.round(cfg.angle))))
    }
    if (typeof cfg.fontSize === 'number' && Number.isFinite(cfg.fontSize)) {
      setFontSize(Math.max(16, Math.min(56, Math.round(cfg.fontSize))))
    }
    if (typeof cfg.color === 'string' && cfg.color) setColor(cfg.color)
    if (cfg.dpi === '150' || cfg.dpi === '300') setDpi(cfg.dpi)
    if (typeof cfg.grayscale === 'boolean') setGrayscale(cfg.grayscale)
  }, [])

  const { hasDraft, clearDraft } = useToolDraft<IdCardDraftSettings>({
    toolId: 'id-card',
    images: draftImages,
    settings: draftSettings,
    onRestore: handleRestoreDraft,
  })

  const handleClearDraft = () => {
    setFront(null)
    setBack(null)
    setSheet(null)
    void clearDraft()
  }

  const watermarkText = customWatermark ?? s.idCard.defaultWatermark

  const debouncedWatermarkText = useDebouncedValue(watermarkText)
  const debouncedOpacityPercent = useDebouncedValue(opacityPercent)
  const debouncedAngle = useDebouncedValue(angle)
  const debouncedFontSize = useDebouncedValue(fontSize)

  const hasCards = Boolean(front || back)
  const hasPendingParams =
    hasCards &&
    (debouncedWatermarkText !== watermarkText ||
      debouncedOpacityPercent !== opacityPercent ||
      debouncedAngle !== angle ||
      debouncedFontSize !== fontSize)
  const isBusy = rendering || hasPendingParams

  const handleFrontFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    if (isHeicFile(file)) setFrontHeicDecoding(true)
    try {
      setFront(
        await readFileAsImageInput(file, 'id-front.png', {
          onHeicStage: (stage) => setFrontHeicDecoding(stage !== 'done'),
        }),
      )
    } catch {
      setError(s.idCard.frontDecodeError)
    } finally {
      setFrontHeicDecoding(false)
    }
  }, [s.idCard.frontDecodeError])

  const handleBackFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    if (isHeicFile(file)) setBackHeicDecoding(true)
    try {
      setBack(
        await readFileAsImageInput(file, 'id-back.png', {
          onHeicStage: (stage) => setBackHeicDecoding(stage !== 'done'),
        }),
      )
    } catch {
      setError(s.idCard.backDecodeError)
    } finally {
      setBackHeicDecoding(false)
    }
  }, [s.idCard.backDecodeError])

  const handleLoadSample = () => {
    setError(null)
    setFront(createDemoImageInput('id-front', 'sample-id-front.svg'))
    setBack(createDemoImageInput('id-back', 'sample-id-back.svg'))
  }

  useEffect(() => {
    if (!front && !back) return
    let cancelled = false
    const run = async () => {
      setRendering(true)
      setError(null)
      try {
        const output = await engines.idCard(front, back, {
          dpi: dpi === '300' ? 300 : 150,
          grayscale,
          watermarkText: debouncedWatermarkText,
          watermarkOpacity: debouncedOpacityPercent / 100,
          watermarkColor: color,
          watermarkFontSize: debouncedFontSize,
          watermarkAngle: debouncedAngle,
          watermarkMode,
        })
        if (!cancelled) setSheet(output)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.idCard.renderError)
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    front,
    back,
    dpi,
    grayscale,
    debouncedWatermarkText,
    debouncedOpacityPercent,
    color,
    debouncedFontSize,
    debouncedAngle,
    watermarkMode,
    engines,
    s.idCard.renderError,
  ])

  const activeSheet = hasCards ? sheet : null

  const getCopyTarget = useCallback(
    async () => (activeSheet ? { blob: activeSheet.blob, previewDataUrl: activeSheet.dataUrl } : null),
    [activeSheet],
  )

  return (
    <div className="space-y-4">
      {/* Prominent 100% Offline Trust Banner */}
      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tokens.privacyBanner}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-white" aria-hidden="true">
            ✓
          </span>
          <div>
            <p className="text-xs font-bold sm:text-sm">{s.idCard.privacyTitle}</p>
            <p className="text-[11px] opacity-85">{s.idCard.privacyDesc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className={`min-h-8 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
        >
          {s.idCard.loadSampleId}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Front + Back Slots & Live A4 Sheet Preview */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border p-3 ${tokens.card}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${tokens.text}`}>{s.idCard.frontSlot}</span>
                {front && (
                  <button
                    type="button"
                    onClick={() => setFront(null)}
                    className={`inline-flex min-h-7 items-center rounded-md px-2 text-xs font-medium hover:underline ${tokens.focusRing} ${tokens.errorText}`}
                  >
                    {s.common.remove}
                  </button>
                )}
              </div>
              {front ? (
                <img
                  src={front.dataUrl}
                  alt={s.idCard.frontSlot}
                  className="mb-2 h-28 w-full rounded-lg border border-black/10 object-cover"
                />
              ) : null}
              <DropZone
                theme={theme}
                compact
                enablePaste={false}
                title={s.idCard.uploadFront}
                hint={front ? front.name : s.idCard.cardSizeHint}
                buttonLabel={s.idCard.uploadFront}
                invalidFileMessage={s.common.invalidFileError}
                decodingLabel={frontHeicDecoding ? s.common.heicDecoding : null}
                onFiles={handleFrontFiles}
              />
            </div>

            <div className={`rounded-2xl border p-3 ${tokens.card}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${tokens.text}`}>{s.idCard.backSlot}</span>
                {back && (
                  <button
                    type="button"
                    onClick={() => setBack(null)}
                    className={`inline-flex min-h-7 items-center rounded-md px-2 text-xs font-medium hover:underline ${tokens.focusRing} ${tokens.errorText}`}
                  >
                    {s.common.remove}
                  </button>
                )}
              </div>
              {back ? (
                <img
                  src={back.dataUrl}
                  alt={s.idCard.backSlot}
                  className="mb-2 h-28 w-full rounded-lg border border-black/10 object-cover"
                />
              ) : null}
              <DropZone
                theme={theme}
                compact
                enablePaste={false}
                title={s.idCard.uploadBack}
                hint={back ? back.name : s.idCard.cardSizeHint}
                buttonLabel={s.idCard.uploadBack}
                invalidFileMessage={s.common.invalidFileError}
                decodingLabel={backHeicDecoding ? s.common.heicDecoding : null}
                onFiles={handleBackFiles}
              />
            </div>
          </div>

          <ExifPrivacyBanner theme={theme} locale={locale} images={draftImages} />

          <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                A4 {dpi} DPI · {s.common.preview}
              </span>
              {activeSheet && (
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                  {activeSheet.width} × {activeSheet.height} · {formatBytes(activeSheet.sizeBytes)}
                </span>
              )}
            </div>
            <div
              aria-busy={isBusy}
              className={`relative flex min-h-[260px] items-center justify-center rounded-xl border p-3 ${tokens.cardMuted}`}
            >
              {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
              {activeSheet ? (
                <img
                  src={activeSheet.dataUrl}
                  alt={s.idCard.previewAlt}
                  className="max-h-[380px] rounded border border-zinc-300 bg-white object-contain shadow-md"
                />
              ) : (
                <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
              )}
            </div>
            {hasDraft && (
              <DraftStatusBar
                theme={theme}
                toolId="id-card"
                savedLabel={s.common.draftSaved}
                clearLabel={s.common.clearDraft}
                onClear={handleClearDraft}
              />
            )}
          </div>
        </div>

        {/* Right: Watermark & Print Controls */}
        <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
          <div className="space-y-4">
            <div>
              <label htmlFor={watermarkInputId} className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>
                {s.idCard.watermarkLabel}
              </label>
              <input
                id={watermarkInputId}
                type="text"
                value={watermarkText}
                onChange={(e) => setCustomWatermark(e.target.value)}
                placeholder={s.idCard.defaultWatermark}
                className={`min-h-8 w-full rounded-lg border px-3 py-2 text-xs outline-none ${tokens.input}`}
              />
            </div>

            <SegmentedControl
              theme={theme}
              label={s.idCard.watermarkMode}
              value={watermarkMode}
              options={[
                { value: 'tiled', label: s.idCard.modeTiled },
                { value: 'across-card', label: s.idCard.modeAcross },
              ]}
              onChange={setWatermarkMode}
            />

            <SliderField
              theme={theme}
              label={s.idCard.opacity}
              value={opacityPercent}
              min={8}
              max={75}
              unit="%"
              onChange={setOpacityPercent}
            />
            <SliderField
              theme={theme}
              label={s.idCard.angle}
              value={angle}
              min={-60}
              max={60}
              unit="°"
              onChange={setAngle}
            />
            <SliderField
              theme={theme}
              label={s.idCard.fontSize}
              value={fontSize}
              min={16}
              max={56}
              unit="px"
              onChange={setFontSize}
            />

            <ColorSwatchRow
              theme={theme}
              label={s.idCard.color}
              value={color}
              options={inkSwatches}
              onChange={setColor}
            />

            <SegmentedControl
              theme={theme}
              label={s.idCard.dpiLabel}
              value={dpi}
              options={[
                { value: '300', label: s.idCard.dpi300 },
                { value: '150', label: s.idCard.dpi150 },
              ]}
              onChange={setDpi}
            />

            <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className={`h-4 w-4 accent-accent ${tokens.focusRing}`}
              />
              {s.idCard.grayscaleLabel}
            </label>
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
                disabled={!activeSheet || isBusy}
                onClick={() => {
                  if (!activeSheet) return
                  triggerBlobDownload(activeSheet.blob, activeSheet.filename)
                  trackFunnelEvent('export_completed', { tool: 'id-card', dpi })
                }}
                className={`inline-flex min-h-9 w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
              >
                {isBusy ? s.common.processing : s.idCard.downloadA4}
              </button>
              <CopyImageButton
                theme={theme}
                tool="id-card"
                testId="id-card-copy-image"
                label={s.common.copyImage}
                copiedLabel={s.common.copiedToChat}
                copyErrorMessage={s.common.copyError}
                disabled={!activeSheet || isBusy}
                getImage={getCopyTarget}
                onError={setError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
