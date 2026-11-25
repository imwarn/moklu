/**
 * [INPUT]: depends on useEffect, useRef, CSSProperties, and ReactNode from react; depends on STUDIO_TEXT_MUTED_CLS from ./studioTokens
 * [OUTPUT]: exports accessible ModalShell dialog component with focus trapping, Escape dismissal, and AA-compliant close button contrast
 * [POS]: foundational modal shell inside src/components/ui used by Studio modals and landing PricingModal
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { STUDIO_TEXT_MUTED_CLS } from './studioTokens'

function shouldCloseModalForKey(key: string): boolean {
  return key === 'Escape'
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Modal dialogs must keep keyboard focus inside their own subtree and hand
 * focus back to whatever opened them once they close. Both behaviours are
 * required by the v0.12 accessibility acceptance pass, and both were missing
 * while every dialog routed through this shell.
 */
function useDialogFocusTrap(open: boolean) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    restoreRef.current = previouslyFocused instanceof HTMLElement ? previouslyFocused : null

    const panel = panelRef.current
    if (!panel) return
    // Move focus into the dialog without stealing it from an autofocused child.
    if (!panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(first ?? panel).focus({ preventScroll: true })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const current = panelRef.current
      if (!current) return
      const focusable = Array.from(current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.offsetParent !== null || element === current)
      if (focusable.length === 0) {
        event.preventDefault()
        current.focus({ preventScroll: true })
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey) {
        if (active === first || active === current || !current.contains(active)) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
        return
      }
      if (active === last || !current.contains(active)) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      const target = restoreRef.current
      restoreRef.current = null
      if (target && document.contains(target)) target.focus({ preventScroll: true })
    }
  }, [open])

  return panelRef
}

interface ModalShellProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  maxWidth?: string
  backdropClassName?: string
  panelClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  backdropStyle?: CSSProperties
  panelStyle?: CSSProperties
  closeButtonClassName?: string
  closeButtonStyle?: CSSProperties
  closeLabel?: string
  closeGlyph?: ReactNode
  showCloseButton?: boolean
  closeOnEscape?: boolean
  onEscape?: () => void
  closeOnBackdrop?: boolean
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  header,
  maxWidth = 'max-w-2xl',
  backdropClassName = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm',
  panelClassName = 'relative rounded-2xl border shadow-2xl w-full max-h-[90dvh] flex flex-col overflow-hidden',
  headerClassName = 'px-4 sm:px-5 py-3.5 sm:py-4 pr-12 border-b border-[rgba(255,255,255,0.06)] shrink-0',
  bodyClassName,
  footerClassName,
  backdropStyle = { background: 'rgba(0,0,0,0.65)' },
  panelStyle = { background: 'var(--color-panel)', borderColor: 'var(--color-border)' },
  closeButtonClassName = `absolute top-4 right-4 z-10 ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0] transition-colors text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`,
  closeButtonStyle,
  closeLabel = 'Close modal',
  closeGlyph = '✕',
  showCloseButton = true,
  closeOnEscape = true,
  onEscape,
  closeOnBackdrop = true,
}: ModalShellProps) {
  const panelRef = useDialogFocusTrap(open)

  useEffect(() => {
    if (!open || !closeOnEscape) return
    const handler = (event: KeyboardEvent) => {
      if (shouldCloseModalForKey(event.key)) (onEscape ?? onClose)()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeOnEscape, onClose, onEscape, open])

  if (!open) return null

  return (
    <div
      className={backdropClassName}
      style={backdropStyle}
      onClick={closeOnBackdrop ? onClose : undefined}
      data-testid="modal-backdrop"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={typeof title === 'string' ? title : undefined}
        className={`${panelClassName} ${maxWidth}`.trim()}
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        {header ?? (title !== undefined && (
          <div className={headerClassName}>
            <h2 className="text-base font-semibold text-[#e8e8f0]">{title}</h2>
          </div>
        ))}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className={closeButtonClassName}
            style={closeButtonStyle}
            aria-label={closeLabel}
          >
            {closeGlyph}
          </button>
        )}
        {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
        {footer !== undefined && (
          <div className={footerClassName}>{footer}</div>
        )}
      </div>
    </div>
  )
}
