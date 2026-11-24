/**
 * [INPUT]: depends on react, react-dom createPortal, StudioIcons from @/components/ui/StudioIcons, clampMenuPosition/useContextMenuKeyboard from @/components/ui/contextMenu, ReplaceScreenshotState from ./useReplaceScreenshot, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ToolbarMoreMenu responsive keyboard-accessible overflow trigger and portal menu for Studio Toolbar actions
 * [POS]: responsive overflow menu component inside src/components/toolbar; mounted by Toolbar for viewports below 1600px
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CanvasSizeIcon,
  GitHubIcon,
  HelpCircleIcon,
  LanguagesIcon,
  MoreHorizontalIcon,
  ProjectsIcon,
  RedoIcon,
  ReplaceImageIcon,
  SettingsIcon,
  TemplatesIcon,
  UndoIcon,
} from '@/components/ui/StudioIcons'
import { clampMenuPosition, useContextMenuKeyboard, type MenuPosition } from '@/components/ui/contextMenu'
import { useStudioLocale } from '@/i18n'
import type { ReplaceScreenshotState } from './useReplaceScreenshot'

const MORE_ACTIONS_LABEL: Record<string, string> = {
  en: 'More actions',
  zh: '更多操作',
  ja: 'その他の操作',
  ko: '더 보기',
}

const MORE_MENU_WIDTH = 208
const MORE_MENU_ESTIMATED_HEIGHT = 232
const MORE_MENU_GAP = 6

const MENU_ITEM_CLS =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs text-[#d6d6e4] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.08] focus-visible:text-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40'

export interface ToolbarMoreMenuProps {
  mode: 'editor' | 'localization'
  canUndo: boolean
  canRedo: boolean
  replaceScreenshot: ReplaceScreenshotState
  onUndo: () => void
  onRedo: () => void
  onOpenCanvasSize: () => void
  onOpenProjects: () => void
  onOpenTemplates: () => void
  onTriggerReplaceScreenshot: () => void
  onOpenSettings: () => void
  onToggleLocalization: () => void
  onOpenHelp: () => void
}

export function ToolbarMoreMenu({
  mode,
  canUndo,
  canRedo,
  replaceScreenshot,
  onUndo,
  onRedo,
  onOpenCanvasSize,
  onOpenProjects,
  onOpenTemplates,
  onTriggerReplaceScreenshot,
  onOpenSettings,
  onToggleLocalization,
  onOpenHelp,
}: ToolbarMoreMenuProps) {
  const { uiLocale, t } = useStudioLocale()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPosition>({ left: 8, top: 54 })
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const moreLabel = MORE_ACTIONS_LABEL[uiLocale] ?? MORE_ACTIONS_LABEL.en

  const closeAndFocusTrigger = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus({ preventScroll: true })
  }, [])

  useContextMenuKeyboard(menuRef, open, closeAndFocusTrigger)

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button || typeof window === 'undefined') return
    const vw = window.innerWidth
    setViewportWidth(vw)
    if (vw >= 1600) {
      setOpen(false)
      return
    }
    const rect = button.getBoundingClientRect()
    const measured = menuRef.current?.getBoundingClientRect()
    const width = measured && measured.width > 0 ? measured.width : MORE_MENU_WIDTH
    const height = measured && measured.height > 0 ? measured.height : MORE_MENU_ESTIMATED_HEIGHT
    setMenuPos(
      clampMenuPosition(
        rect.right - width,
        rect.bottom + MORE_MENU_GAP,
        width,
        height,
        vw,
        window.innerHeight,
      ),
    )
  }, [])

  useEffect(() => {
    if (!open) return
    const rafId = window.requestAnimationFrame(updatePosition)
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) updatePosition()
      return next
    })
  }

  const menuPortal = open ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label={moreLabel}
      data-testid="toolbar-more-menu"
      tabIndex={-1}
      className="fixed z-[70] w-52 overflow-hidden rounded-xl border border-white/15 bg-[#1b1b24] p-1.5 shadow-2xl"
      style={{
        left: menuPos.left,
        top: menuPos.top,
        boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
      }}
    >
      {viewportWidth < 640 && (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenCanvasSize() }}
            className={MENU_ITEM_CLS}
          >
            <CanvasSizeIcon size={14} className="text-muted" />
            <span>{t.toolbar.canvasSize}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canUndo}
            onClick={() => { setOpen(false); onUndo() }}
            className={MENU_ITEM_CLS}
          >
            <UndoIcon size={14} className="text-muted" />
            <span>{t.toolbar.undoTitle}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canRedo}
            onClick={() => { setOpen(false); onRedo() }}
            className={MENU_ITEM_CLS}
          >
            <RedoIcon size={14} className="text-muted" />
            <span>{t.toolbar.redoTitle}</span>
          </button>
          <div role="separator" className="my-1 h-px bg-white/10" />
        </>
      )}

      {viewportWidth < 768 && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { setOpen(false); onToggleLocalization() }}
          className={MENU_ITEM_CLS}
        >
          <LanguagesIcon size={14} className="text-muted" />
          <span>{mode === 'localization' ? t.toolbar.backToDesign : t.toolbar.localization}</span>
        </button>
      )}

      {viewportWidth < 1280 && (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenProjects() }}
            className={MENU_ITEM_CLS}
          >
            <ProjectsIcon size={14} className="text-muted" />
            <span>{t.toolbar.projects}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenTemplates() }}
            className={MENU_ITEM_CLS}
          >
            <TemplatesIcon size={14} className="text-muted" />
            <span>{t.toolbar.templates}</span>
          </button>
        </>
      )}

      {viewportWidth < 1440 && (
        <>
          <button
            type="button"
            role="menuitem"
            disabled={replaceScreenshot.disabled}
            title={replaceScreenshot.title}
            onClick={() => { setOpen(false); onTriggerReplaceScreenshot() }}
            className={MENU_ITEM_CLS}
          >
            <ReplaceImageIcon size={14} className="text-muted" />
            <span>{replaceScreenshot.label}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenSettings() }}
            className={MENU_ITEM_CLS}
          >
            <SettingsIcon size={14} className="text-muted" />
            <span>{t.toolbar.settings}</span>
          </button>
          <div role="separator" className="my-1 h-px bg-white/10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenHelp() }}
            className={MENU_ITEM_CLS}
          >
            <HelpCircleIcon size={14} className="text-muted" />
            <span>{t.toolbar.help}</span>
          </button>
        </>
      )}

      <a
        href="https://github.com/imwarn/moklu"
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={() => setOpen(false)}
        className={MENU_ITEM_CLS}
      >
        <GitHubIcon size={14} className="text-muted" />
        <span>GitHub</span>
      </a>
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-testid="toolbar-more-btn"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={moreLabel}
        title={moreLabel}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors min-[1600px]:hidden ${
          open
            ? 'border-accent/50 bg-accent-soft text-accent-text'
            : 'border-[rgba(255,255,255,0.1)] text-[#a0a0b0] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8e8f0]'
        }`}
      >
        <MoreHorizontalIcon size={15} />
      </button>

      {menuPortal && (typeof document !== 'undefined' ? createPortal(menuPortal, document.body) : menuPortal)}
    </>
  )
}
