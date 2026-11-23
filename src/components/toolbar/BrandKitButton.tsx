/**
 * [INPUT]: depends on react, useBrandColors from @/hooks/useBrandColors, BrandColorList, BrandColor type, and useStudioLocale from @/i18n
 * [OUTPUT]: exports BrandKitButton toolbar popover trigger with localized labels and description
 * [POS]: reusable brand-color popover button inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useRef, useEffect } from 'react'
import { useBrandColors } from '@/hooks/useBrandColors'
import { BrandColorList } from '@/components/common/BrandColorList'
import type { BrandColor } from '@/types'
import { useStudioLocale } from '@/i18n'

export function BrandKitButton() {
  const { t } = useStudioLocale()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const brandColors = useBrandColors()

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t.toolbar.brandKitTitle}
        aria-label={t.toolbar.brandKit}
        className="max-[1535px]:!px-2"
        style={{
          background: open ? 'var(--color-accent-soft)' : 'none',
          border: open ? '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          color: open ? 'var(--color-accent-text)' : 'var(--color-muted)',
          cursor: 'pointer',
          fontSize: 12,
          padding: '3px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          if (open) return
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
        }}
        onMouseLeave={(e) => {
          if (open) return
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#a0a0b0'
        }}
      >
        {/* Palette indicator — up to 3 color dots */}
        {brandColors.length > 0 ? (
          <span className="flex gap-0.5">
            {brandColors.slice(0, 3).map((c: BrandColor) => (
              <span
                key={c.id}
                className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.2)]"
                style={{ background: c.value }}
              />
            ))}
          </span>
        ) : (
          <span>🎨</span>
        )}
        <span className="max-[1535px]:hidden">{t.toolbar.brandKit}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#18181f] shadow-2xl p-3"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
        >
          <div className="mb-2">
            <p className="text-[11px] text-[#6b6b7a] leading-relaxed">
              {t.toolbar.brandKitDesc}
            </p>
          </div>
          <BrandColorList compact />
        </div>
      )}
    </div>
  )
}
