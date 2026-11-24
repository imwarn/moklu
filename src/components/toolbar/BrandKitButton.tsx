/**
 * [INPUT]: depends on react, react-dom createPortal, useBrandColors from @/hooks/useBrandColors, BrandColorList, PaletteIcon from @/components/ui/StudioIcons, clampMenuPosition from @/components/ui/contextMenu, BrandColor type, and useStudioLocale from @/i18n
 * [OUTPUT]: exports BrandKitButton toolbar popover trigger rendering a viewport-clamped portal dialog so ancestor overflow rules cannot clip it
 * [POS]: reusable brand-color popover button inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { useBrandColors } from '@/hooks/useBrandColors'
import { BrandColorList } from '@/components/common/BrandColorList'
import { PaletteIcon } from '@/components/ui/StudioIcons'
import { clampMenuPosition, type MenuPosition } from '@/components/ui/contextMenu'
import type { BrandColor } from '@/types'
import { useStudioLocale } from '@/i18n'

const POPOVER_WIDTH = 288
const POPOVER_ESTIMATED_HEIGHT = 240
const POPOVER_GAP = 6

export interface BrandKitButtonProps {
  /** Optional initial open state (defaults to false; useful for deterministic regression tests). */
  defaultOpen?: boolean
}

export function BrandKitButton({ defaultOpen = false }: BrandKitButtonProps = {}) {
  const { t } = useStudioLocale()
  const popoverId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const [position, setPosition] = useState<MenuPosition>({ left: 8, top: 54 })
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const brandColors = useBrandColors()

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button || typeof window === 'undefined') return
    const rect = button.getBoundingClientRect()
    const measured = popoverRef.current?.getBoundingClientRect()
    const width = measured && measured.width > 0 ? measured.width : POPOVER_WIDTH
    const height = measured && measured.height > 0 ? measured.height : POPOVER_ESTIMATED_HEIGHT
    setPosition(
      clampMenuPosition(
        rect.left,
        rect.bottom + POPOVER_GAP,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      ),
    )
  }, [])

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) updatePosition()
      return next
    })
  }

  // Close on click outside or Escape, and keep anchored on viewport resize/scroll.
  useEffect(() => {
    if (!open) return
    const rafId = window.requestAnimationFrame(updatePosition)

    const handlePointerDown = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus({ preventScroll: true })
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  const popoverNode = open ? (
    <div
      id={popoverId}
      ref={popoverRef}
      role="dialog"
      aria-label={t.toolbar.brandKit}
      data-testid="brand-kit-popover"
      className="fixed z-[70] w-72 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#18181f] p-3 shadow-2xl"
      style={{
        left: position.left,
        top: position.top,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      <div className="mb-2">
        <p className="text-[11px] leading-relaxed text-[#a0a0b0]">
          {t.toolbar.brandKitDesc}
        </p>
      </div>
      <BrandColorList compact />
    </div>
  ) : null

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        data-testid="brand-kit-btn"
        onClick={handleToggle}
        title={t.toolbar.brandKitTitle}
        aria-label={t.toolbar.brandKit}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? popoverId : undefined}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-md border px-2 py-1 text-xs transition-colors min-[1440px]:px-2.5 ${
          open
            ? 'border-accent/50 bg-accent-soft text-accent-text'
            : 'border-white/10 bg-transparent text-muted hover:border-white/25 hover:text-[#e8e8f0]'
        }`}
      >
        {/* Palette indicator — up to 3 color dots */}
        {brandColors.length > 0 ? (
          <span className="flex gap-0.5" aria-hidden="true">
            {brandColors.slice(0, 3).map((c: BrandColor) => (
              <span
                key={c.id}
                className="h-3 w-3 rounded-full border border-[rgba(255,255,255,0.2)]"
                style={{ background: c.value }}
              />
            ))}
          </span>
        ) : (
          <PaletteIcon size={14} />
        )}
        <span className="max-[1439px]:hidden">{t.toolbar.brandKit}</span>
      </button>

      {popoverNode && (typeof document !== 'undefined' ? createPortal(popoverNode, document.body) : popoverNode)}
    </div>
  )
}
