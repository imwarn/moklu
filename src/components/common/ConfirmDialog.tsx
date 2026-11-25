/**
 * [INPUT]: depends on ModalShell from @/components/ui/ModalShell and useStudioLocale from @/i18n
 * [OUTPUT]: exports ConfirmDialog and ConfirmDialogProps accessible confirmation modal with focus trapping, AA danger styling, disabled states, and localized defaults
 * [POS]: reusable confirmation modal within src/components/common, invoked by StudioPage, ProjectsModal, and EditingContext
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { ModalShell } from '@/components/ui/ModalShell'
import { useStudioLocale } from '@/i18n'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busyLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busyLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useStudioLocale()
  const resolvedConfirmLabel = confirmLabel ?? t.common.apply
  const resolvedCancelLabel = cancelLabel ?? t.common.cancel
  const resolvedBusyLabel = busyLabel ?? `${resolvedConfirmLabel}…`

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      title={title}
      showCloseButton={false}
      closeOnEscape={!busy}
      closeOnBackdrop={!busy}
      maxWidth="max-w-[400px]"
      backdropClassName="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-4 backdrop-blur-[1px]"
      backdropStyle={{ background: 'rgba(0,0,0,0.6)' }}
      panelClassName="relative flex max-h-[90dvh] w-full flex-col overflow-y-auto rounded-[10px] border p-4 sm:p-6 shadow-2xl"
      panelStyle={{
        background: '#1c1c27',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}
      header={
        <h3 className="m-0 mb-2.5 text-[15px] font-semibold text-[#e8e8f0]">
          {title}
        </h3>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-md border border-white/12 bg-transparent px-3.5 py-[5px] text-xs font-semibold text-[#b8b8c8] transition-colors hover:border-white/25 hover:bg-white/5 hover:text-[#e8e8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`cursor-pointer rounded-md border-none px-3.5 py-[5px] text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1c1c27] disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] focus-visible:ring-[#ef4444]'
                : 'bg-accent-strong hover:bg-accent-strong/90 focus-visible:ring-accent'
            }`}
          >
            {busy ? resolvedBusyLabel : resolvedConfirmLabel}
          </button>
        </div>
      }
    >
      <p className="m-0 mb-5 text-[13px] leading-relaxed text-[#a0a0b0]">
        {message}
      </p>
    </ModalShell>
  )
}
