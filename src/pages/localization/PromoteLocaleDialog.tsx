/**
 * [INPUT]: depends on react Fragment, ModalShell, getLanguageName from @/utils/locale, and useStudioLocale/formatMessage/splitMessageTemplate from @/i18n
 * [OUTPUT]: exports PromoteLocaleDialog default-language promotion confirmation dialog localized across EN/ZH/JA/KO
 * [POS]: default-locale promotion modal within src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Fragment } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
import { getLanguageName } from '@/utils/locale'
import { formatMessage, splitMessageTemplate, useStudioLocale } from '@/i18n'

interface PromoteLocaleDialogProps {
  open: boolean
  locale: string | null
  currentDefaultLocale: string
  complete: number
  total: number
  incompleteLabels: string[]
  remainingCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function PromoteLocaleDialog({
  open,
  locale,
  currentDefaultLocale,
  complete,
  total,
  incompleteLabels,
  remainingCount,
  onCancel,
  onConfirm,
}: PromoteLocaleDialogProps) {
  const { t } = useStudioLocale()
  const tl = t.modals.localization
  const targetName = locale ? getLanguageName(locale) : ''
  const currentDefaultName = getLanguageName(currentDefaultLocale)
  const ratio = total === 0 ? 1 : complete / total
  const isComplete = complete >= total
  const incompleteCount = total - complete

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      title={tl.promoteTitle}
      maxWidth="max-w-2xl"
      bodyClassName="px-6 py-5"
      footerClassName="flex items-center justify-end gap-3 border-t border-white/8 bg-[#14141b] px-6 py-4"
      footer={(
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-[#c9c9d5] transition hover:border-white/20 hover:text-white"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-[#7c6ef6]/45 bg-[#7c6ef6]/16 px-4 py-2 text-sm font-medium text-[#f3f1ff] transition hover:border-[#7c6ef6]/70 hover:bg-[#7c6ef6]/24"
          >
            {tl.promoteConfirm}
          </button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-[#7c6ef6]/25 bg-[#7c6ef6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
            {targetName} · {locale}
          </div>
          <p className="text-sm leading-relaxed text-[#d6d6e2]">
            {splitMessageTemplate(tl.promoteLead).map((part, idx) => (
              <Fragment key={idx}>
                {part.type === 'token' && part.key === 'language' ? (
                  <span className="font-semibold text-white">{targetName}</span>
                ) : (
                  part.type === 'text' ? part.value : ''
                )}
              </Fragment>
            ))}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#13131a] p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b7a]">{tl.translationCoverage}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{complete}/{total}</div>
            </div>
            <div className="text-right text-xs text-[#8d8ea0]">
              {isComplete
                ? tl.everythingTranslated
                : formatMessage(incompleteCount === 1 ? tl.layersNeedReviewOne : tl.layersNeedReviewOther, {
                    count: incompleteCount,
                  })}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${ratio === 0 ? 0 : Math.max(6, Math.round(ratio * 100))}%`,
                background: isComplete ? '#7c6ef6' : '#f59e0b',
              }}
            />
          </div>
        </div>

        {!isComplete && (
          <div className="rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-sm text-[#f59e0b]">⚠</div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-[#fde68a]">{tl.someIncompleteTitle}</div>
                  <p className="mt-1 text-sm leading-relaxed text-[#e7dbc0]">
                    {splitMessageTemplate(tl.someIncompleteBody).map((part, idx) => (
                      <Fragment key={idx}>
                        {part.type === 'token' && part.key === 'language' ? (
                          <span className="font-medium text-white">{currentDefaultName}</span>
                        ) : (
                          part.type === 'text' ? part.value : ''
                        )}
                      </Fragment>
                    ))}
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#111118] px-3 py-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d8ea0]">{tl.affectedLayers}</div>
                  <ul className="space-y-2 text-sm text-[#d9d9e6]">
                    {incompleteLabels.map((label) => (
                      <li key={label} className="flex gap-2">
                        <span className="text-[#f59e0b]">•</span>
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                  {remainingCount > 0 && (
                    <div className="mt-3 text-xs text-[#8d8ea0]">
                      {formatMessage(tl.moreCount, { count: remainingCount })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
