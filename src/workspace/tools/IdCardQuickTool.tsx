/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports IdCardQuickTool component for offline A4 front+back ID card sheet layout and anti-fraud watermarking
 * [POS]: privacy-first ID card watermark tool panel inside src/workspace/tools; delegates A4 rendering to injected engines.idCard
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useState } from 'react'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceBlobOutput,
  WorkspaceIdCardOptions,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
} from '../types'
import { ColorSwatchRow, DropZone, SegmentedControl, SliderField } from '../uiPrimitives'

const INK_SWATCHES = [
  { label: 'Slate Gray', value: '#334155' },
  { label: 'Security Red', value: '#b91c1c' },
  { label: 'Navy Blue', value: '#1d4ed8' },
  { label: 'Charcoal', value: '#0f172a' },
]

export function IdCardQuickTool({
  locale,
  theme,
  engines,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [front, setFront] = useState<WorkspaceImageInput | null>(null)
  const [back, setBack] = useState<WorkspaceImageInput | null>(null)
  const [watermarkText, setWatermarkText] = useState<string>(s.idCard.defaultWatermark)
  const [watermarkMode, setWatermarkMode] = useState<WorkspaceIdCardOptions['watermarkMode']>('tiled')
  const [opacityPercent, setOpacityPercent] = useState<number>(28)
  const [angle, setAngle] = useState<number>(-30)
  const [fontSize, setFontSize] = useState<number>(28)
  const [color, setColor] = useState<string>('#334155')
  const [dpi, setDpi] = useState<'150' | '300'>('300')
  const [grayscale, setGrayscale] = useState<boolean>(false)
  const [sheet, setSheet] = useState<WorkspaceBlobOutput | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFrontFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    try {
      setFront(await readFileAsImageInput(file))
    } catch {
      setError('Unable to decode front ID image.')
    }
  }, [])

  const handleBackFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    try {
      setBack(await readFileAsImageInput(file))
    } catch {
      setError('Unable to decode back ID image.')
    }
  }, [])

  const handleLoadSample = () => {
    setError(null)
    setFront(createDemoImageInput('id-front', 'sample-id-front.svg'))
    setBack(createDemoImageInput('id-back', 'sample-id-back.svg'))
  }

  const hasCards = Boolean(front || back)

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
          watermarkText,
          watermarkOpacity: opacityPercent / 100,
          watermarkColor: color,
          watermarkFontSize: fontSize,
          watermarkAngle: angle,
          watermarkMode,
        })
        if (!cancelled) setSheet(output)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'A4 sheet rendering failed')
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [front, back, dpi, grayscale, watermarkText, opacityPercent, color, fontSize, angle, watermarkMode, engines])

  const activeSheet = hasCards ? sheet : null

  return (
    <div className="space-y-4">
      {/* Prominent 100% Offline Trust Banner */}
      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tokens.privacyBanner}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white" aria-hidden="true">
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
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tokens.buttonSecondary}`}
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
                    className="text-[11px] font-medium text-rose-500 hover:underline"
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
                hint={front ? front.name : 'ID-1 · 85.6 × 54 mm'}
                buttonLabel={s.idCard.uploadFront}
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
                    className="text-[11px] font-medium text-rose-500 hover:underline"
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
                hint={back ? back.name : 'ID-1 · 85.6 × 54 mm'}
                buttonLabel={s.idCard.uploadBack}
                onFiles={handleBackFiles}
              />
            </div>
          </div>

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
            <div className={`flex min-h-[260px] items-center justify-center rounded-xl border p-3 ${tokens.cardMuted}`}>
              {activeSheet ? (
                <img
                  src={activeSheet.dataUrl}
                  alt="A4 ID card print preview"
                  className="max-h-[380px] rounded border border-slate-300 bg-white object-contain shadow-md"
                />
              ) : (
                <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Watermark & Print Controls */}
        <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
          <div className="space-y-4">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>
                {s.idCard.watermarkLabel}
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder={s.idCard.defaultWatermark}
                className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${tokens.input}`}
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
              options={INK_SWATCHES}
              onChange={setColor}
            />

            <SegmentedControl
              theme={theme}
              label={s.idCard.dpiLabel}
              value={dpi}
              options={[
                { value: '300', label: '300 DPI · Print' },
                { value: '150', label: '150 DPI · Fast' },
              ]}
              onChange={setDpi}
            />

            <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              {s.idCard.grayscaleLabel}
            </label>
          </div>

          <div className="space-y-2 border-t pt-4 border-current/10">
            {error && (
              <p role="alert" className="text-xs font-medium text-rose-500">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={!activeSheet || rendering}
              onClick={() => activeSheet && triggerBlobDownload(activeSheet.blob, activeSheet.filename)}
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.buttonPrimary}`}
            >
              {rendering ? s.common.processing : s.idCard.downloadA4}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
