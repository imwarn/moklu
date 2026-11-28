/**
 * [INPUT]: depends on react, IdPhotoSpecPreset from @/tools/types, getWorkspaceStrings from ../i18n, getWorkspaceThemeTokens from ../themeTokens, UI primitives from ../uiPrimitives, and ID photo types from ../types
 * [OUTPUT]: exports IdPhotoControlsSidebar and ID_PHOTO_CUSTOM_PRESET_ID rendering the upload/demo bar, locale-ordered preset picker, custom mm/px dimensions, official compliance card, backdrop swatches, matting engine toggle, anti-halo sliders, format/KB cap pills, and export action bar
 * [POS]: modular right-hand controls sidebar extracted from src/workspace/tools/IdPhotoQuickTool.tsx to keep every UI module crisp and well under 550 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useId, useMemo, useRef } from 'react'
import type { IdPhotoSpecPreset } from '@/tools/types'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceIdPhotoFormat,
  WorkspaceIdPhotoMattingMode,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceLocale,
  WorkspaceTheme,
} from '../types'
import {
  ColorSwatchRow,
  CopyImageButton,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'

export const ID_PHOTO_CUSTOM_PRESET_ID = 'custom'
const RESUME_GRADIENT = 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)'
const KB_CAP_OPTIONS = [0, 200, 100, 50, 30] as const

export interface IdPhotoControlsSidebarProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  hasImage: boolean
  hasMatte: boolean
  isBusy: boolean
  trioZipBusy: boolean
  orderedSpecs: readonly IdPhotoSpecPreset[]
  activeSpec: IdPhotoSpecPreset | null
  presetId: string
  onSelectPreset: (nextId: string) => void
  customUnit: 'mm' | 'px'
  onCustomUnitChange: (next: 'mm' | 'px') => void
  customWidthMm: number
  customHeightMm: number
  customWidthPx: number
  customHeightPx: number
  onCustomWidthMmChange: (next: number) => void
  onCustomHeightMmChange: (next: number) => void
  onCustomWidthPxChange: (next: number) => void
  onCustomHeightPxChange: (next: number) => void
  displayMm: string
  targetWidthPx: number
  targetHeightPx: number
  background: string
  onBackgroundChange: (next: string) => void
  mattingMode: WorkspaceIdPhotoMattingMode
  onMattingModeChange: (next: WorkspaceIdPhotoMattingMode) => void
  edgeShift: number
  onEdgeShiftChange: (next: number) => void
  edgeFeather: number
  onEdgeFeatherChange: (next: number) => void
  zoom: number
  onZoomChange: (next: number) => void
  format: WorkspaceIdPhotoFormat
  onFormatChange: (next: WorkspaceIdPhotoFormat) => void
  targetSizeKb: number
  onTargetSizeKbChange: (next: number) => void
  renderedPhoto: WorkspaceIdPhotoRenderOutput | null
  error: string | null
  onError: (msg: string | null) => void
  onFiles: (files: File[]) => void
  onTryDemo: () => void
  onDownloadPhoto: () => void
  onDownloadTrioZip: () => void
  getCopyTarget: () => Promise<{ blob: Blob; previewDataUrl?: string } | null>
  onOpenInStudio: () => void
}

export function IdPhotoControlsSidebar({
  theme,
  locale,
  hasImage,
  hasMatte,
  isBusy,
  trioZipBusy,
  orderedSpecs,
  activeSpec,
  presetId,
  onSelectPreset,
  customUnit,
  onCustomUnitChange,
  customWidthMm,
  customHeightMm,
  customWidthPx,
  customHeightPx,
  onCustomWidthMmChange,
  onCustomHeightMmChange,
  onCustomWidthPxChange,
  onCustomHeightPxChange,
  displayMm,
  targetWidthPx,
  targetHeightPx,
  background,
  onBackgroundChange,
  mattingMode,
  onMattingModeChange,
  edgeShift,
  onEdgeShiftChange,
  edgeFeather,
  onEdgeFeatherChange,
  zoom,
  onZoomChange,
  format,
  onFormatChange,
  targetSizeKb,
  onTargetSizeKbChange,
  renderedPhoto,
  error,
  onError,
  onFiles,
  onTryDemo,
  onDownloadPhoto,
  onDownloadTrioZip,
  getCopyTarget,
  onOpenInStudio,
}: IdPhotoControlsSidebarProps) {
  const s = getWorkspaceStrings(locale)
  const ip = s.idPhoto
  const tokens = getWorkspaceThemeTokens(theme)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const customWidthId = useId()
  const customHeightId = useId()

  const bgSwatches = useMemo(
    () => [
      { label: ip.bgPureWhite, value: '#FFFFFF' },
      { label: ip.bgCivilBlue, value: '#438EDB' },
      { label: ip.bgDeepBlue, value: '#2B6CB0' },
      { label: ip.bgOfficialRed, value: '#D92B2B' },
      { label: ip.bgNeutralGray, value: '#E5E7EB' },
      { label: ip.bgResumeGradient, value: RESUME_GRADIENT },
    ],
    [ip],
  )

  const activePresetCopy = activeSpec ? ip.presets[activeSpec.id] : undefined

  return (
    <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-4 sm:p-5 lg:col-span-5 ${tokens.card}`}>
      <div className="space-y-4">
        {/* Quick Upload / Demo Portrait Header */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*,.heic,.heif,.avif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) onFiles(Array.from(e.target.files))
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className={`min-h-8 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
          >
            {hasImage ? ip.replacePortrait : s.common.chooseFiles}
          </button>
          <button
            type="button"
            onClick={onTryDemo}
            className={`min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            {ip.tryDemoPortrait}
          </button>
        </div>

        {/* Use-Case & Size Preset Picker */}
        <div>
          <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{ip.presetLabel}</span>
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
            {orderedSpecs.map((spec) => {
              const active = presetId === spec.id
              const copy = ip.presets[spec.id]
              return (
                <button
                  key={spec.id}
                  type="button"
                  data-testid={`id-photo-preset-${spec.id}`}
                  aria-pressed={active}
                  onClick={() => onSelectPreset(spec.id)}
                  className={`flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition-colors ${tokens.focusRing} ${
                    active ? tokens.pillActive : tokens.pillIdle
                  }`}
                >
                  <span className="line-clamp-1 text-xs font-semibold">{copy?.name ?? spec.id}</span>
                  <span className="text-[10px] opacity-80 tabular-nums">{copy?.sub ?? `${spec.widthPx}×${spec.heightPx}px`}</span>
                </button>
              )
            })}
            <button
              type="button"
              data-testid="id-photo-preset-custom"
              aria-pressed={presetId === ID_PHOTO_CUSTOM_PRESET_ID}
              onClick={() => onSelectPreset(ID_PHOTO_CUSTOM_PRESET_ID)}
              className={`flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition-colors ${tokens.focusRing} ${
                presetId === ID_PHOTO_CUSTOM_PRESET_ID ? tokens.pillActive : tokens.pillIdle
              }`}
            >
              <span className="text-xs font-semibold">{ip.customPreset}</span>
              <span className="text-[10px] opacity-80">mm / px</span>
            </button>
          </div>
        </div>

        {/* Custom Dimension Inputs */}
        {presetId === ID_PHOTO_CUSTOM_PRESET_ID && (
          <div className={`space-y-2.5 rounded-xl border p-3 ${tokens.cardMuted}`}>
            <SegmentedControl
              theme={theme}
              label={ip.customUnitLabel}
              value={customUnit}
              options={[
                { value: 'mm', label: ip.unitMm },
                { value: 'px', label: ip.unitPx },
              ]}
              onChange={onCustomUnitChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={customWidthId} className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                  {customUnit === 'mm' ? ip.customWidthMm : ip.customWidthPx}
                </label>
                <input
                  id={customWidthId}
                  type="number"
                  min={customUnit === 'mm' ? 15 : 80}
                  max={customUnit === 'mm' ? 150 : 2400}
                  value={customUnit === 'mm' ? customWidthMm : customWidthPx}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!Number.isFinite(val)) return
                    if (customUnit === 'mm') onCustomWidthMmChange(Math.max(15, Math.min(150, val)))
                    else onCustomWidthPxChange(Math.max(80, Math.min(2400, val)))
                  }}
                  className={`min-h-8 w-full rounded-lg border px-2.5 py-1 text-xs tabular-nums outline-none ${tokens.input}`}
                />
              </div>
              <div>
                <label htmlFor={customHeightId} className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                  {customUnit === 'mm' ? ip.customHeightMm : ip.customHeightPx}
                </label>
                <input
                  id={customHeightId}
                  type="number"
                  min={customUnit === 'mm' ? 15 : 80}
                  max={customUnit === 'mm' ? 150 : 2400}
                  value={customUnit === 'mm' ? customHeightMm : customHeightPx}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!Number.isFinite(val)) return
                    if (customUnit === 'mm') onCustomHeightMmChange(Math.max(15, Math.min(150, val)))
                    else onCustomHeightPxChange(Math.max(80, Math.min(2400, val)))
                  }}
                  className={`min-h-8 w-full rounded-lg border px-2.5 py-1 text-xs tabular-nums outline-none ${tokens.input}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Compliance & Spec Guidance Card */}
        <div data-testid="id-photo-spec-card" className={`rounded-xl border px-3 py-2.5 text-[11px] ${tokens.cardMuted}`}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className={`font-bold ${tokens.text}`}>{ip.specCardTitle}</span>
            <span className={`font-mono tabular-nums ${tokens.textSubtle}`}>
              {displayMm} · {targetWidthPx}×{targetHeightPx}px
            </span>
          </div>
          {activePresetCopy?.tip && <p className={`font-medium ${tokens.text}`}>{activePresetCopy.tip}</p>}
          {activeSpec && (
            <p className={`mt-1 ${tokens.textMuted}`}>
              {ip.specComplianceHead}: {Math.round(activeSpec.headRatioRange[0] * 100)}%-
              {Math.round(activeSpec.headRatioRange[1] * 100)}%. {ip.specComplianceRule}
            </p>
          )}
          <p className={`mt-1 ${tokens.textSubtle}`}>{ip.specAuthenticNote}</p>
        </div>

        {/* Background Swatches */}
        <ColorSwatchRow
          theme={theme}
          label={ip.backgroundLabel}
          value={background}
          options={bgSwatches}
          allowCustom
          customLabel={s.common.customColor}
          onChange={onBackgroundChange}
        />

        {/* Matting Engine Toggle */}
        <SegmentedControl
          theme={theme}
          label={ip.engineLabel}
          value={mattingMode}
          options={[
            { value: 'ai', label: ip.engineAi },
            { value: 'pure-backdrop', label: ip.enginePure },
          ]}
          onChange={onMattingModeChange}
        />

        {/* Anti-Halo Edge Refinement & Zoom Sliders */}
        <div className={`space-y-3 rounded-xl border p-3 ${tokens.cardMuted}`}>
          <span className={`block text-[11px] font-bold uppercase tracking-wide ${tokens.textMuted}`}>
            {ip.edgeRefineTitle}
          </span>
          <SliderField theme={theme} label={ip.defringeLabel} value={edgeShift} min={-2} max={1.5} step={0.1} onChange={onEdgeShiftChange} />
          <SliderField theme={theme} label={ip.featherLabel} value={edgeFeather} min={0} max={2.5} step={0.1} unit="px" onChange={onEdgeFeatherChange} />
          <SliderField theme={theme} label={ip.zoomLabel} value={zoom} min={0.7} max={2} step={0.02} unit="x" onChange={onZoomChange} />
        </div>

        {/* Format & Portal Target KB Cap */}
        <SegmentedControl
          theme={theme}
          label={ip.formatLabel}
          value={targetSizeKb > 0 ? 'image/jpeg' : format}
          options={[
            { value: 'image/jpeg', label: ip.formatJpgExam },
            { value: 'image/png', label: ip.formatPngLossless },
          ]}
          onChange={(next) => {
            onFormatChange(next)
            if (next === 'image/png') onTargetSizeKbChange(0)
          }}
        />

        <SegmentedControl
          theme={theme}
          label={ip.targetKbLabel}
          value={String(targetSizeKb)}
          options={KB_CAP_OPTIONS.map((kb) => ({
            value: String(kb),
            label: kb === 0 ? ip.targetKbUnlimited : `<=${kb}KB`,
          }))}
          onChange={(next) => {
            const kb = Number(next)
            onTargetSizeKbChange(kb)
            if (kb > 0) onFormatChange('image/jpeg')
          }}
        />
      </div>

      {/* Action Bar */}
      <div className="space-y-2 border-t border-current/10 pt-4">
        {error && (
          <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            data-testid="id-photo-download"
            disabled={!renderedPhoto || isBusy}
            onClick={onDownloadPhoto}
            className={`inline-flex min-h-9 w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
          >
            {isBusy ? s.common.processing : ip.downloadPhoto}
          </button>
          <button
            type="button"
            data-testid="id-photo-trio-zip"
            disabled={!hasMatte || trioZipBusy || isBusy}
            onClick={onDownloadTrioZip}
            className={`inline-flex min-h-9 w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonSecondary}`}
          >
            {trioZipBusy ? s.common.downloading : ip.downloadTrioShort}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CopyImageButton
            theme={theme}
            tool="id-photo"
            testId="id-photo-copy-image"
            label={s.common.copyImage}
            copiedLabel={s.common.copiedToChat}
            copyErrorMessage={s.common.copyError}
            disabled={!renderedPhoto || isBusy}
            getImage={getCopyTarget}
            onError={onError}
          />
          <StudioHandoffButton
            theme={theme}
            label={s.common.openInStudio}
            disabled={!renderedPhoto || isBusy}
            onClick={onOpenInStudio}
          />
        </div>
      </div>
    </div>
  )
}
