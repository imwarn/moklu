/**
 * [INPUT]: depends on react RefObject and useStudioLocale/formatMessage from @/i18n
 * [OUTPUT]: exports BulkTranslateBar bulk AI translation toolbar localized across EN/ZH/JA/KO
 * [POS]: bulk translation control bar within src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { RefObject } from 'react'
import { formatMessage, useStudioLocale } from '@/i18n'

export interface BulkTranslateBarProps {
  nonDefaultLocales: string[]
  bulkEligibleCount: number
  hasApiKey: boolean
  isBulkRunning: boolean
  overwriteExisting: boolean
  setOverwriteExisting: (value: boolean) => void
  onBulkTranslate: () => void
  bulkCancelRef: RefObject<boolean>
  onOpenAiSettings: () => void
}

export function BulkTranslateBar({
  nonDefaultLocales,
  bulkEligibleCount,
  hasApiKey,
  isBulkRunning,
  overwriteExisting,
  setOverwriteExisting,
  onBulkTranslate,
  bulkCancelRef,
  onOpenAiSettings,
}: BulkTranslateBarProps) {
  const { t } = useStudioLocale()
  const tl = t.modals.localization

  if (nonDefaultLocales.length === 0) return null

  return (
    <section className="border-b border-white/6 bg-[#111118]/70 px-8 py-3 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b6b7a]">{tl.bulkTranslateLabel}</span>
          <span className="text-xs text-[#9d90f8]">
            {formatMessage(bulkEligibleCount === 1 ? tl.cellsCountOne : tl.cellsCountOther, { count: bulkEligibleCount })}
          </span>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={overwriteExisting}
            onChange={(e) => setOverwriteExisting(e.target.checked)}
            className="accent-[#7c6ef6] w-3 h-3"
          />
          <span className="text-xs text-[#8f90a3]">{tl.overwriteExisting}</span>
        </label>

        <button
          type="button"
          onClick={onBulkTranslate}
          disabled={!hasApiKey || isBulkRunning || bulkEligibleCount === 0}
          className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition ${
            !hasApiKey
              ? 'border-white/8 text-[#4a4a5a] cursor-not-allowed'
              : isBulkRunning
                ? 'border-[rgba(124,110,246,0.3)] text-[#9d90f8] cursor-wait'
                : bulkEligibleCount === 0
                  ? 'border-white/8 text-[#4a4a5a] cursor-not-allowed'
                  : 'border-[rgba(124,110,246,0.5)] bg-[rgba(124,110,246,0.12)] text-[#c5befd] hover:bg-[rgba(124,110,246,0.22)] hover:text-white'
          }`}
          title={!hasApiKey ? tl.configureApiKeyTitle : undefined}
        >
          {isBulkRunning
            ? tl.translatingStatus
            : formatMessage(nonDefaultLocales.length === 1 ? tl.translateAllOne : tl.translateAllOther, {
                count: nonDefaultLocales.length,
              })}
        </button>

        {!hasApiKey && (
          <button
            type="button"
            onClick={onOpenAiSettings}
            className="text-xs text-[#f59e0b] hover:text-white underline underline-offset-2 transition"
          >
            {tl.noApiKeyCta}
          </button>
        )}

        {isBulkRunning && (
          <button
            type="button"
            onClick={() => { bulkCancelRef.current = true }}
            className="text-xs text-[#f87171] hover:text-white transition"
          >
            {tl.stop}
          </button>
        )}
      </div>
    </section>
  )
}
