/**
 * [INPUT]: depends on react, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and WorkspaceToolPanelProps from ../types
 * [OUTPUT]: exports ResizeQuickTool component for Resize, Crop, and non-crop Border & Pad workflows with batch ZIP and Studio handoff
 * [POS]: resize, crop, and border-pad panel inside src/workspace/tools; delegates rendering to injected engines.transform
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useState } from 'react'
import { createDemoImageInput, formatBytes, readFileAsImageInput, triggerBlobDownload } from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
  WorkspaceTransformOptions,
} from '../types'
import {
  ColorSwatchRow,
  DropZone,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'

const PAD_SWATCHES = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Warm Cream', value: '#faf7f2' },
  { label: 'Charcoal', value: '#111827' },
  { label: 'Soft Aurora', value: 'linear-gradient(135deg, #b5b0f2, #e5efff)' },
  { label: 'Peach Glow', value: 'linear-gradient(135deg, #fde68a, #f9a8d4)' },
]

export function ResizeQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [mode, setMode] = useState<WorkspaceTransformOptions['mode']>(preset.resizeMode ?? 'resize')
  const [aspectRatio, setAspectRatio] = useState<WorkspaceAspectPreset>('1:1')
  const [widthPx, setWidthPx] = useState<number>(1200)
  const [heightPx, setHeightPx] = useState<number>(1200)
  const [lockAspect, setLockAspect] = useState<boolean>(true)
  const [borderPx, setBorderPx] = useState<number>(48)
  const [borderRadius, setBorderRadius] = useState<number>(16)
  const [background, setBackground] = useState<string>('#ffffff')
  const [shadow, setShadow] = useState<boolean>(true)
  const [outputs, setOutputs] = useState<WorkspaceBlobOutput[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null)
    try {
      const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
      setImages((prev) => {
        const next = [...prev, ...loaded]
        if (prev.length === 0 && loaded[0]) {
          setWidthPx(loaded[0].width)
          setHeightPx(loaded[0].height)
        }
        return next
      })
    } catch {
      setError('Unable to decode one or more images.')
    }
  }, [])

  const handleLoadDemo = () => {
    setError(null)
    const demo = createDemoImageInput('photo-2', 'social-photo.svg')
    setImages([demo])
    setWidthPx(demo.width)
    setHeightPx(demo.height)
  }

  const handleWidthChange = (nextWidth: number) => {
    const safeW = Math.max(16, Math.min(8192, nextWidth || 16))
    setWidthPx(safeW)
    const first = images[0]
    if (lockAspect && first && first.width > 0) {
      setHeightPx(Math.max(16, Math.round((first.height / first.width) * safeW)))
    }
  }

  const handleHeightChange = (nextHeight: number) => {
    const safeH = Math.max(16, Math.min(8192, nextHeight || 16))
    setHeightPx(safeH)
    const first = images[0]
    if (lockAspect && first && first.height > 0) {
      setWidthPx(Math.max(16, Math.round((first.width / first.height) * safeH)))
    }
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
          width: widthPx,
          height: heightPx,
          lockAspect,
          aspectRatio,
          borderPx,
          background,
          borderRadius,
          shadow,
          format: 'image/png',
          quality: 0.94,
        })
        if (!cancelled) setOutputs(transformed)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Transform failed')
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [images, mode, widthPx, heightPx, lockAspect, aspectRatio, borderPx, background, borderRadius, shadow, engines])

  const activeOutputs = images.length > 0 ? outputs : []
  const primary = activeOutputs[0] ?? null

  const handleDownloadPrimaryOrZip = async () => {
    if (activeOutputs.length === 0) return
    if (activeOutputs.length === 1) {
      triggerBlobDownload(activeOutputs[0].blob, activeOutputs[0].filename)
      return
    }
    const zipBlob = await engines.packZip(
      activeOutputs.map((out) => ({ filename: out.filename, blob: out.blob })),
    )
    triggerBlobDownload(zipBlob, `moklu-${mode}-${activeOutputs.length}.zip`)
  }

  const handleOpenInStudio = () => {
    if (!primary) return
    onOpenInStudio({
      images: [
        {
          dataUrl: primary.dataUrl,
          name: primary.filename,
          width: primary.width,
          height: primary.height,
        },
      ],
      mode: 'canvas',
      slideWidth: primary.width,
      slideHeight: primary.height,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Live Transform Preview */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.common.preview}
              </span>
              {primary && (
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                  {primary.width} × {primary.height} · {formatBytes(primary.sizeBytes)}
                  {activeOutputs.length > 1 ? ` · ${activeOutputs.length} ${s.resize.batchReady}` : ''}
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
                    setOutputs([])
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.textMuted} hover:text-rose-500`}
                >
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          <div className={`flex min-h-[250px] items-center justify-center overflow-hidden rounded-xl border p-4 ${tokens.cardMuted}`}>
            {primary ? (
              <img
                src={primary.dataUrl}
                alt="Transformed image preview"
                className="max-h-[320px] max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : (
              <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
            )}
          </div>

          <div className="mt-3">
            <DropZone
              theme={theme}
              compact
              multiple
              title={s.common.dropMultipleTitle}
              hint={s.common.dropHint}
              buttonLabel={s.common.chooseFiles}
              onFiles={handleFiles}
            />
          </div>
        </div>
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${tokens.textMuted}`}>
                    {s.resize.widthLabel}
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={8192}
                    value={widthPx}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                  />
                </div>
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${tokens.textMuted}`}>
                    {s.resize.heightLabel}
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={8192}
                    value={heightPx}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                  />
                </div>
              </div>
              <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(e) => setLockAspect(e.target.checked)}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                {s.resize.lockAspect}
              </label>
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
                options={PAD_SWATCHES}
                onChange={setBackground}
              />
              <label className={`flex cursor-pointer items-center gap-2 text-xs font-medium ${tokens.textMuted}`}>
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) => setShadow(e.target.checked)}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                {s.resize.shadowLabel}
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t pt-4 border-current/10">
          {error && (
            <p role="alert" className="text-xs font-medium text-rose-500">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!primary || processing}
              onClick={handleDownloadPrimaryOrZip}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.buttonPrimary}`}
            >
              {processing
                ? s.common.processing
                : activeOutputs.length > 1
                  ? s.common.downloadZip
                  : s.common.downloadImage}
            </button>
            <StudioHandoffButton
              theme={theme}
              label={s.common.openInStudio}
              disabled={!primary}
              onClick={handleOpenInStudio}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
