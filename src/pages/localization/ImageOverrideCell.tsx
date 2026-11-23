/**
 * [INPUT]: depends on effectiveLocalizationMode from @/utils/locale, LocalizableRow from ./types, getFileLabel from ./helpers, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ImageOverrideCell localized screenshot/image cell editor across EN/ZH/JA/KO
 * [POS]: image override cell component inside SlideGroupSection within src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { effectiveLocalizationMode } from '@/utils/locale'
import { useStudioLocale } from '@/i18n'
import type { LocalizableRow } from './types'
import { getFileLabel } from './helpers'

export interface ImageOverrideCellProps {
  row: LocalizableRow
  locale: string
  defaultLocale: string
  activeLocale: string
  getAsset: (key: string) => string | undefined
  onUpload: () => void
  onClear: () => void
}

export function ImageOverrideCell({
  row,
  locale,
  defaultLocale,
  activeLocale,
  getAsset,
  onUpload,
  onClear,
}: ImageOverrideCellProps) {
  const { t } = useStudioLocale()
  const tl = t.modals.localization
  const fileLabels = { noImage: tl.noImage, embeddedImage: tl.embeddedImage }
  const override = row.layer.localeContent?.[locale]
  const isDefaultLocale = locale === defaultLocale
  const isActiveColumn = locale === activeLocale
  const mode = effectiveLocalizationMode(row.layer)
  const isSkipped = mode === 'skip'
  const basePreviewSrc = row.defaultImageRef
    ? (getAsset(row.defaultImageRef) ?? row.defaultImageRef)
    : row.defaultImageRef

  const previewSrc =
    isDefaultLocale
      ? basePreviewSrc
      : row.layerType === 'phone'
      ? (override?.screenshotPath ? getAsset(override.screenshotPath) : undefined) ?? override?.screenshotDataUrl
      : (override?.src ? getAsset(override.src) : undefined) ?? override?.src

  if (isDefaultLocale) {
    return (
      <div
        className="min-h-[80px] h-full rounded-xl border px-3 py-3 mb-3"
        style={{
          borderColor: isActiveColumn ? 'color-mix(in srgb, var(--color-accent) 45%, transparent)' : 'rgba(255,255,255,0.08)',
          background: isActiveColumn ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'rgba(255,255,255,0.02)',
        }}
      >
        {previewSrc ? (
          <div className="flex items-center gap-3">
            <img src={previewSrc} alt={tl.baseImageAlt} className="h-12 w-9 rounded-lg border border-white/10 object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-[#f4f4f5]">{getFileLabel(row.defaultImageRef, fileLabels)}</div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <button type="button" onClick={onUpload} className="text-[10px] text-accent-text hover:text-white transition">
                  {tl.change}
                </button>
                <span className="text-[10px] text-[#6b6b7a]">{tl.baseImage}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={onUpload}
              className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-text transition hover:bg-accent/20"
            >
              {tl.upload}
            </button>
            <span className="text-[10px] text-[#6b6b7a]">{tl.baseImage}</span>
          </div>
        )}
      </div>
    )
  }

  if (isSkipped) {
    return (
      <div className="min-h-[80px] rounded-xl border border-dashed border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)] px-4 py-3 flex items-center justify-center mb-3">
        <span className="text-xs text-[#f87171]">{tl.skippedCell}</span>
      </div>
    )
  }

  return (
    <div
      className="min-h-[128px] h-full rounded-xl border px-3 py-3 mb-3"
      style={{
        borderColor: previewSrc
          ? isActiveColumn ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-accent) 45%, transparent)'
          : isActiveColumn ? 'color-mix(in srgb, var(--color-accent) 40%, transparent)' : 'rgba(255,255,255,0.14)',
        background: previewSrc
          ? isActiveColumn ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'color-mix(in srgb, var(--color-accent) 6%, transparent)'
          : isActiveColumn ? 'color-mix(in srgb, var(--color-accent) 6%, transparent)' : 'rgba(255,255,255,0.015)',
      }}
    >
      {previewSrc ? (
        <div className="flex items-center gap-3">
          <img
            src={previewSrc}
            alt={`${row.layerName} ${locale}`}
            className="h-12 w-9 rounded-lg border border-white/10 object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-[#f4f4f5]">
              {row.layerType === 'phone'
                ? getFileLabel(override?.screenshotPath ?? override?.screenshotDataUrl, fileLabels)
                : getFileLabel(override?.src, fileLabels)}
            </div>
            <div className="flex gap-2 mt-1.5">
              <button type="button" onClick={onUpload} className="text-[10px] text-accent-text hover:text-white transition">
                {tl.change}
              </button>
              <button type="button" onClick={onClear} className="text-[10px] text-[#f87171] hover:text-white transition">
                {tl.clearCell}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onUpload}
            className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-text transition hover:bg-accent/20"
          >
            {tl.upload}
          </button>
          <span className="text-xs text-amber-400/70">{tl.missingBadge}</span>
        </div>
      )}
    </div>
  )
}
