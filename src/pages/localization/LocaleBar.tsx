/**
 * [INPUT]: depends on react RefObject, getLanguageName, LanguagePopover, and useStudioLocale/formatMessage from @/i18n
 * [OUTPUT]: exports LocaleBar project language switcher and action bar localized across EN/ZH/JA/KO
 * [POS]: top locale management bar within src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { RefObject } from 'react'
import { getLanguageName } from '@/utils/locale'
import { formatMessage, useStudioLocale } from '@/i18n'
import { LanguagePopover } from './LanguagePopover'

export interface LocaleBarProps {
  locales: string[]
  defaultLocale: string
  activeLocale: string
  progressByLocale: Map<string, { complete: number; total: number }>
  showDefaultLocalePicker: boolean
  showAddLocale: boolean
  defaultLocaleAnchorRef: RefObject<HTMLDivElement | null>
  addLocaleAnchorRef: RefObject<HTMLDivElement | null>
  onPreview?: (locale: string) => void
  onBack: () => void
  setActiveLocale: (locale: string) => void
  setShowDefaultLocalePicker: (open: boolean | ((prev: boolean) => boolean)) => void
  setShowAddLocale: (open: boolean | ((prev: boolean) => boolean)) => void
  handleRemoveLocale: (locale: string) => void
  handleDefaultLocaleChange: (locale: string) => void
  addLocale: (code: string) => void
  setAddLocaleOpen: (open: boolean) => void
}

export function LocaleBar({
  locales,
  defaultLocale,
  activeLocale,
  progressByLocale,
  showDefaultLocalePicker,
  showAddLocale,
  defaultLocaleAnchorRef,
  addLocaleAnchorRef,
  onPreview,
  onBack,
  setActiveLocale,
  setShowDefaultLocalePicker,
  setShowAddLocale,
  handleRemoveLocale,
  handleDefaultLocaleChange,
  addLocale,
  setAddLocaleOpen,
}: LocaleBarProps) {
  const { t } = useStudioLocale()
  const tl = t.modals.localization

  return (
    <section className="border-b border-border bg-panel/90 px-4 py-3 sm:px-8 sm:py-4 backdrop-blur-xl shrink-0">
      <div className="flex flex-wrap items-start gap-3">
        <div className="pt-2 text-xs font-medium uppercase tracking-[0.22em] text-muted shrink-0">{tl.languagesLabel}</div>
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          {locales.map((locale) => {
            const progress = progressByLocale.get(locale) ?? { complete: 0, total: 0 }
            const ratio = progress.total === 0 ? 1 : progress.complete / progress.total
            const selected = locale === activeLocale
            const isDefault = locale === defaultLocale
            return (
              <div key={locale} ref={isDefault ? defaultLocaleAnchorRef : undefined} className="relative group flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className="rounded-full border px-4 py-2 text-sm transition"
                  style={{
                    borderColor: selected ? 'color-mix(in srgb, var(--color-accent) 70%, transparent)' : 'rgba(255,255,255,0.08)',
                    background: selected ? 'var(--color-accent-soft)' : 'rgba(255,255,255,0.03)',
                    color: selected ? '#f4f4f5' : '#c6c6d2',
                  }}
                >
                  <span className="font-semibold">{getLanguageName(locale)}</span>
                  <span className="ml-1.5 text-xs font-mono opacity-60">{locale}</span>
                  {isDefault ? (
                    <span className="ml-2 text-xs text-accent-text">{tl.defaultBadge}</span>
                  ) : (
                    <span className="ml-2 text-xs" style={{ color: ratio >= 0.5 ? 'var(--color-accent-text)' : 'var(--color-warning)' }}>
                      {progress.complete}/{progress.total}
                    </span>
                  )}
                </button>
                {isDefault ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLocale(false)
                      setShowDefaultLocalePicker((open) => !open)
                    }}
                    className="rounded-full border border-accent/35 bg-accent-soft px-3 py-2 text-xs font-medium text-accent-text transition hover:border-accent/60 hover:bg-accent/20 hover:text-white"
                    title={tl.changeDefaultTitle}
                  >
                    {tl.changeDefault}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemoveLocale(locale)}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#1a1a24] border border-white/10 text-[9px] text-[#6b6b7a] hover:text-[#f87171] hover:border-[rgba(239,68,68,0.4)] opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    title={formatMessage(tl.removeLanguageTitle, { language: getLanguageName(locale) })}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}

          {/* Add locale */}
          <div ref={addLocaleAnchorRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDefaultLocalePicker(false)
                setShowAddLocale((open) => !open)
              }}
              className="rounded-full border border-dashed border-white/12 bg-white/2 px-4 py-2 text-sm font-medium text-[#b7b7c7] transition hover:border-accent/50 hover:bg-accent/10 hover:text-white"
            >
              {tl.addLanguage}
            </button>
          </div>

          <div className="ml-auto flex flex-wrap shrink-0 items-center gap-2">
            {/* Preview the selected language (opens the shared preview modal) */}
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(activeLocale)}
                title={formatMessage(tl.previewLanguageTitle, { language: getLanguageName(activeLocale) })}
                className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-accent-text transition hover:border-accent/70 hover:bg-accent/20 hover:text-white"
              >
                {tl.previewButton}
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-white/10 bg-white/4 px-3.5 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-medium text-[#d7d7e3] transition hover:border-accent/50 hover:bg-accent/10 hover:text-white"
            >
              {tl.backToEditor}
            </button>
          </div>
        </div>
      </div>

      <LanguagePopover
        open={showDefaultLocalePicker}
        anchorRef={defaultLocaleAnchorRef}
        existingLocales={locales.filter((l) => l !== defaultLocale)}
        allowSelectingExisting
        note={tl.defaultPickerNote}
        onAdd={handleDefaultLocaleChange}
        onCancel={() => setShowDefaultLocalePicker(false)}
      />

      <LanguagePopover
        open={showAddLocale}
        anchorRef={addLocaleAnchorRef}
        existingLocales={locales}
        onAdd={(code) => {
          addLocale(code)
          setActiveLocale(code)
          setAddLocaleOpen(false)
        }}
        onCancel={() => setAddLocaleOpen(false)}
      />
    </section>
  )
}
