/**
 * [INPUT]: depends on react, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, and WorkspaceImageInput/WorkspaceLocale/WorkspaceTheme from ./types
 * [OUTPUT]: exports ExifPrivacyBannerProps and ExifPrivacyBanner rendering an expandable amber EXIF & GPS privacy notice for uploaded user images
 * [POS]: shared EXIF privacy trust badge in src/workspace; wired into MockupQuickTool, IdCardQuickTool, and ResizeQuickTool
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState } from 'react'
import { getWorkspaceStrings } from './i18n'
import { getWorkspaceThemeTokens } from './themeTokens'
import type {
  WorkspaceExifSummary,
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceTheme,
} from './types'

export interface ExifPrivacyBannerProps {
  theme: WorkspaceTheme
  locale: WorkspaceLocale
  images: readonly WorkspaceImageInput[]
  defaultExpanded?: boolean
  className?: string
}

function formatGps(exif: WorkspaceExifSummary): string | null {
  if (!exif.gps) return null
  const latDir = exif.gps.latitude >= 0 ? 'N' : 'S'
  const lngDir = exif.gps.longitude >= 0 ? 'E' : 'W'
  return `${Math.abs(exif.gps.latitude).toFixed(5)}° ${latDir}, ${Math.abs(exif.gps.longitude).toFixed(5)}° ${lngDir}`
}

function formatCamera(exif: WorkspaceExifSummary): string | null {
  const parts = [exif.make?.trim(), exif.model?.trim()].filter((v): v is string => Boolean(v))
  if (parts.length === 0) return null
  // Avoid duplicating make when model already starts with make (e.g. "Apple" + "Apple iPhone 15").
  if (parts.length === 2 && parts[1].toLowerCase().startsWith(parts[0].toLowerCase())) {
    return parts[1]
  }
  return parts.join(' ')
}

function formatExposure(exif: WorkspaceExifSummary): string | null {
  const parts: string[] = []
  if (exif.exposureTime) parts.push(exif.exposureTime)
  if (exif.fNumber) parts.push(exif.fNumber)
  if (typeof exif.iso === 'number' && Number.isFinite(exif.iso)) parts.push(`ISO ${exif.iso}`)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function ExifPrivacyBanner({
  theme,
  locale,
  images,
  defaultExpanded = false,
  className = '',
}: ExifPrivacyBannerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const flagged = images.filter(
    (img): img is WorkspaceImageInput & { exif: WorkspaceExifSummary } =>
      !img.isDemo && Boolean(img.exif?.hasExif),
  )

  if (flagged.length === 0) return null

  const hasGps = flagged.some((img) => Boolean(img.exif.gps))
  const totalTags = flagged.reduce((sum, img) => sum + Math.max(1, img.exif.tagCount), 0)
  const headlineTemplate = hasGps ? s.exif.badgeWithGps : s.exif.badgeGeneric
  const headline = headlineTemplate.replace('{count}', String(totalTags))

  return (
    <div
      role="status"
      data-testid="exif-privacy-banner"
      className={`rounded-xl border border-warning/35 px-3 py-2 text-xs ${tokens.badgeWarning} ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M10 2.5 3.5 5.2v4.3c0 4 2.7 6.9 6.5 8 3.8-1.1 6.5-4 6.5-8V5.2L10 2.5Z" strokeLinejoin="round" />
            <path d="M10 6.8v3.6M10 13h.01" strokeLinecap="round" />
          </svg>
          <span className="font-semibold leading-snug">{headline}</span>
        </div>
        <button
          type="button"
          data-testid="exif-privacy-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className={`inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md border border-warning/35 px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-warning/10 ${tokens.focusRing}`}
        >
          <span>{expanded ? s.exif.toggleCollapse : s.exif.toggleExpand}</span>
          <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
        </button>
      </div>

      {expanded && (
        <div
          data-testid="exif-privacy-details"
          className={`mt-2 space-y-2 border-t border-warning/25 pt-2 text-[11px] ${tokens.text}`}
        >
          {flagged.map((img) => {
            const gps = formatGps(img.exif)
            const camera = formatCamera(img.exif)
            const exposure = formatExposure(img.exif)
            return (
              <div key={img.id} className="space-y-1">
                {flagged.length > 1 && (
                  <p className={`truncate font-semibold ${tokens.text}`}>{img.name}</p>
                )}
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  {gps && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.exif.gpsLabel}:</dt>
                      <dd className="font-mono tabular-nums">{gps}</dd>
                    </div>
                  )}
                  {camera && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.exif.cameraLabel}:</dt>
                      <dd className="truncate">{camera}</dd>
                    </div>
                  )}
                  {img.exif.dateTimeOriginal && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.exif.dateLabel}:</dt>
                      <dd className="font-mono tabular-nums">{img.exif.dateTimeOriginal}</dd>
                    </div>
                  )}
                  {exposure && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.exif.exposureLabel}:</dt>
                      <dd className="font-mono tabular-nums">{exposure}</dd>
                    </div>
                  )}
                  {img.exif.software && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className={`shrink-0 font-semibold ${tokens.textMuted}`}>{s.exif.softwareLabel}:</dt>
                      <dd className="truncate">{img.exif.software}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )
          })}
          <p className={`text-[11px] ${tokens.textMuted}`}>{s.exif.strippedHint}</p>
        </div>
      )}
    </div>
  )
}
