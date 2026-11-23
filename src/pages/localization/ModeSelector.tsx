/**
 * [INPUT]: depends on Layer/LocalizationMode types, effectiveLocalizationMode from @/utils/locale, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ModeSelector per-layer auto/manual/skip mode toggle localized across EN/ZH/JA/KO
 * [POS]: layer localization mode control inside SlideGroupSection within src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Layer, LocalizationMode } from '@/types'
import { effectiveLocalizationMode } from '@/utils/locale'
import { useStudioLocale } from '@/i18n'

export interface ModeSelectorProps {
  layer: Layer
  onUpdate: (mode: LocalizationMode | undefined) => void
}

export function ModeSelector({ layer, onUpdate }: ModeSelectorProps) {
  const { t } = useStudioLocale()
  const tl = t.modals.localization
  const effective = effectiveLocalizationMode(layer)
  const isImageType = layer.type === 'image' || layer.type === 'phone'

  const modeOptions: { value: LocalizationMode; label: string; title: string }[] = [
    { value: 'auto',   label: tl.modeAuto,   title: tl.modeAutoTitle },
    { value: 'manual', label: tl.modeManual, title: tl.modeManualTitle },
    { value: 'skip',   label: tl.modeSkip,   title: tl.modeSkipTitle },
  ]

  return (
    <div className="flex gap-0.5 mt-1.5">
      {modeOptions.map((opt) => {
        const active = effective === opt.value
        const disabled = isImageType && opt.value === 'auto'
        return (
          <button
            key={opt.value}
            type="button"
            title={disabled ? tl.modeImageAutoDisabledTitle : opt.title}
            disabled={disabled}
            onClick={() => onUpdate(opt.value === 'auto' ? undefined : opt.value)}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide transition ${
              disabled
                ? 'cursor-not-allowed text-[#3a3a4a] border border-[rgba(255,255,255,0.04)]'
                : active
                  ? opt.value === 'skip'
                    ? 'bg-[rgba(239,68,68,0.18)] border border-[rgba(239,68,68,0.4)] text-[#fca5a5]'
                    : opt.value === 'manual'
                      ? 'bg-[rgba(245,158,11,0.18)] border border-[rgba(245,158,11,0.4)] text-[#fbbf24]'
                      : 'bg-[rgba(124,110,246,0.2)] border border-[rgba(124,110,246,0.5)] text-[#c4b5fd]'
                  : 'border border-[rgba(255,255,255,0.08)] text-[#555665] hover:text-[#9a9ab0] hover:border-[rgba(255,255,255,0.14)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
