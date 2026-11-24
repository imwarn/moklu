/**
 * [INPUT]: depends on react, useReplaceScreenshot/ReplaceScreenshotState from ./useReplaceScreenshot, ReplaceImageIcon from @/components/ui/StudioIcons, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ReplaceScreenshotButton toolbar action with localized labels, titles, and SVG icon
 * [POS]: primary screenshot swap button inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef } from 'react'
import { ReplaceImageIcon } from '@/components/ui/StudioIcons'
import { useStudioLocale } from '@/i18n'
import { useReplaceScreenshot, type ReplaceScreenshotState } from './useReplaceScreenshot'

interface ReplaceScreenshotButtonProps {
  state?: ReplaceScreenshotState
  onTrigger?: () => void
  className?: string
}

/** Replace the primary screenshot without disturbing its frame, artwork or canvas size. */
export function ReplaceScreenshotButton({ state, onTrigger, className = '' }: ReplaceScreenshotButtonProps = {}) {
  const { t } = useStudioLocale()
  const ownInputRef = useRef<HTMLInputElement>(null)
  const ownState = useReplaceScreenshot()
  const ctrl = state ?? ownState
  const handleTrigger = onTrigger ?? (() => ownInputRef.current?.click())

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
      {!state && (
        <input
          ref={ownInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          aria-label={t.toolbar.replaceScreenshotInputAria}
          onChange={(e) => {
            void ctrl.onUpload(e.target.files?.[0])
            e.currentTarget.value = ''
          }}
        />
      )}
      <button
        type="button"
        onClick={handleTrigger}
        disabled={ctrl.disabled}
        title={ctrl.title}
        aria-label={ctrl.label}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/15 px-2 py-1.5 text-xs text-[#d6d6e4] transition-colors hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 min-[1680px]:px-3"
      >
        <ReplaceImageIcon size={13} />
        <span className="max-[1679px]:hidden">{ctrl.label}</span>
      </button>
      {ctrl.error && (
        <span role="alert" title={ctrl.error} className="max-w-28 truncate text-[10px] text-red-400">
          {t.toolbar.uploadFailed}
        </span>
      )}
    </span>
  )
}
