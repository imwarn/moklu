/**
 * [INPUT]: depends on AiProviderSettings, ModalShell, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ApiKeysModal standalone AI configuration modal localized across EN/ZH/JA/KO
 * [POS]: modal wrapper for AI provider settings inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { AiProviderSettings } from '@/components/ai/AiProviderSettings'
import { ModalShell } from '@/components/ui/ModalShell'
import { useStudioLocale } from '@/i18n'

interface ApiKeysModalProps {
  open: boolean
  onClose: () => void
}

export function ApiKeysModal({ open, onClose }: ApiKeysModalProps) {
  const { t } = useStudioLocale()

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      backdropStyle={{ background: 'rgba(0,0,0,0.6)' }}
      panelClassName="rounded-2xl border shadow-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
      showCloseButton={false}
    >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#e8e8f0]">{t.modals.settings.aiTitle}</h2>
          <button type="button" aria-label={t.common.close} onClick={onClose} className="text-[#6b6b7a] hover:text-[#e8e8f0] transition-colors text-lg">✕</button>
        </div>

        <p className="text-[12px] text-[#6b6b7a] mb-4 leading-relaxed">
          {t.modals.settings.aiDesc}
        </p>

        <AiProviderSettings />

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full rounded-lg bg-accent-strong hover:bg-accent-strong/90 py-2 text-sm font-medium text-accent-fg transition-colors"
        >
          {t.common.save}
        </button>
    </ModalShell>
  )
}
