/**
 * [INPUT]: depends on react, ModalShell from @/components/ui/ModalShell, LocaleContentBatchEntry from @/types, formatMessage and useStudioLocale from @/i18n, keylessTranslate helpers, and CellKey/LocalizableRow from ./types
 * [OUTPUT]: exports KeylessTranslateModal dual-track AI bulk translation dialog (BYOK Auto Mode + Zero-Key Copy/Paste Mode)
 * [POS]: zero-key and BYOK bulk translation modal inside src/pages/localization; invoked from LocalizationView via BulkTranslateBar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useMemo, useState } from 'react'
import type { LocaleContentBatchEntry } from '@/types'
import { ModalShell } from '@/components/ui/ModalShell'
import { formatMessage, useStudioLocale } from '@/i18n'
import {
  buildKeylessTranslationPrompt,
  collectKeylessTranslationItems,
  parseKeylessTranslationResponse,
} from './keylessTranslate'
import type { CellKey, LocalizableRow } from './types'

export interface KeylessTranslateModalProps {
  open: boolean
  onClose: () => void
  rows: LocalizableRow[]
  defaultLocale: string
  nonDefaultLocales: string[]
  overwriteExisting: boolean
  hasApiKey: boolean
  onOpenAiSettings: () => void
  onRunDirectBulkTranslate: () => void
  onCommitBatch: (entries: LocaleContentBatchEntry[], formattingLostKeys: CellKey[]) => void
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback below
  }
  if (typeof document === 'undefined') return false
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  } catch {
    return false
  }
}

export function KeylessTranslateModal(props: KeylessTranslateModalProps) {
  if (!props.open) return null
  return <KeylessTranslateDialog {...props} />
}

function KeylessTranslateDialog({
  open,
  onClose,
  rows,
  defaultLocale,
  nonDefaultLocales,
  overwriteExisting,
  hasApiKey,
  onOpenAiSettings,
  onRunDirectBulkTranslate,
  onCommitBatch,
}: KeylessTranslateModalProps) {
  const { t } = useStudioLocale()
  const lm = t.modals.localization

  const [copied, setCopied] = useState(false)
  const [pastedJson, setPastedJson] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const items = useMemo(
    () => collectKeylessTranslationItems(rows, nonDefaultLocales, overwriteExisting),
    [rows, nonDefaultLocales, overwriteExisting],
  )

  const promptBundle = useMemo(
    () => buildKeylessTranslationPrompt(items, defaultLocale, nonDefaultLocales),
    [items, defaultLocale, nonDefaultLocales],
  )

  const parsedPreview = useMemo(() => {
    if (!pastedJson.trim()) return null
    return parseKeylessTranslationResponse(pastedJson, items, nonDefaultLocales)
  }, [pastedJson, items, nonDefaultLocales])

  const handleCopyPrompt = async () => {
    if (promptBundle.cellCount === 0) return
    const ok = await copyTextToClipboard(promptBundle.prompt)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleApply = () => {
    const result = parseKeylessTranslationResponse(pastedJson, items, nonDefaultLocales)
    if (!result.ok || result.entries.length === 0) {
      setSubmitError(lm.keylessParseError)
      return
    }
    setSubmitError(null)
    onCommitBatch(result.entries, result.formattingLostKeys)
    onClose()
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={lm.keylessModalTitle}
      maxWidth="max-w-4xl"
      backdropStyle={{ background: 'rgba(0, 0, 0, 0.72)' }}
      panelStyle={{
        background: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
        maxHeight: '88dvh',
      }}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-5 md:grid-cols-2">
        {/* Left Track: BYOK Auto Mode */}
        <section
          data-testid="keyless-track-byok"
          className="flex min-w-0 flex-col justify-between rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
        >
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{lm.keylessByokHeading}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  hasApiKey
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-200'
                }`}
              >
                {hasApiKey ? 'API Key Ready' : 'BYOK'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#a6a8bc]">{lm.keylessByokDesc}</p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {hasApiKey && promptBundle.cellCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onRunDirectBulkTranslate()
                }}
                className="w-full rounded-lg bg-accent-strong px-4 py-2 text-xs font-semibold text-accent-fg transition hover:bg-accent-strong/90"
              >
                {lm.keylessByokRunNowBtn}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenAiSettings()
              }}
              className={`w-full rounded-lg border px-4 py-2 text-xs font-medium transition ${
                hasApiKey
                  ? 'border-white/15 bg-white/[0.04] text-[#d6d6e4] hover:border-white/30 hover:text-white'
                  : 'border-accent/50 bg-accent-soft text-accent-text hover:bg-accent/20 hover:text-white'
              }`}
            >
              {lm.keylessByokConfigureBtn}
            </button>
          </div>
        </section>

        {/* Right Track: Zero-Key Web AI Copy/Paste Mode */}
        <section
          data-testid="keyless-track-zero-key"
          className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-accent/35 bg-accent/[0.05] p-4 sm:p-5"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">{lm.keylessZeroKeyHeading}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#b2b4c8]">{lm.keylessZeroKeyDesc}</p>
          </div>

          {promptBundle.cellCount === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-[#a6a8bc]">
              {lm.keylessNoPending}
            </p>
          ) : (
            <>
              <div>
                <button
                  type="button"
                  data-testid="keyless-copy-prompt-btn"
                  onClick={() => { void handleCopyPrompt() }}
                  className="w-full rounded-lg border border-accent/50 bg-accent-strong px-4 py-2 text-xs font-semibold text-accent-fg transition hover:bg-accent-strong/90"
                >
                  {copied
                    ? formatMessage(lm.keylessCopiedBadge, {
                        count: promptBundle.cellCount,
                        langs: promptBundle.activeLocales.length,
                      })
                    : lm.keylessStep1Btn}
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#e4e4f0]">
                  {lm.keylessStep2Label}
                </span>
                <textarea
                  data-testid="keyless-paste-textarea"
                  rows={7}
                  value={pastedJson}
                  onChange={(e) => {
                    setPastedJson(e.target.value)
                    if (submitError) setSubmitError(null)
                  }}
                  placeholder={lm.keylessTextareaPlaceholder}
                  className="w-full resize-y rounded-lg border border-white/15 bg-[#111119] p-3 font-mono text-xs text-[#ececf4] placeholder:text-[#66687c] focus:border-accent focus:outline-none"
                />
              </label>

              {parsedPreview?.ok && (
                <div className="space-y-1 text-xs">
                  <p className="text-emerald-300">
                    {formatMessage(lm.keylessPreviewReady, { count: parsedPreview.appliedCount })}
                  </p>
                  {parsedPreview.formattingLostKeys.length > 0 && (
                    <p className="text-amber-300">
                      {formatMessage(lm.keylessFormattingWarn, {
                        count: parsedPreview.formattingLostKeys.length,
                      })}
                    </p>
                  )}
                </div>
              )}

              {(submitError || (parsedPreview && !parsedPreview.ok)) && (
                <p role="alert" className="text-xs text-red-400">
                  {submitError ?? lm.keylessParseError}
                </p>
              )}

              <button
                type="button"
                data-testid="keyless-apply-btn"
                disabled={!parsedPreview?.ok}
                onClick={handleApply}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#6b6d80]"
              >
                {parsedPreview?.ok
                  ? formatMessage(lm.keylessApplyBtn, { count: parsedPreview.appliedCount })
                  : lm.keylessApplyIdleBtn}
              </button>
            </>
          )}
        </section>
      </div>
    </ModalShell>
  )
}
