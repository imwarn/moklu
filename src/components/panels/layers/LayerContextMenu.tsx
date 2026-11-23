/**
 * [INPUT]: depends on useCallback and useRef from react; Layer type from @/types; ContextMenu from ./constants; contextMenu helpers and STUDIO_COLORS from @/components/ui; useStudioLocale from @/i18n
 * [OUTPUT]: exports LayerContextMenu component with WAI-ARIA menu roles, viewport clamping, and Escape/keyboard navigation
 * [POS]: floating right-click layer menu inside src/components/panels/layers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useRef } from 'react'
import type { Layer } from '@/types'
import { useClampedMenuPosition, useContextMenuKeyboard } from '@/components/ui/contextMenu'
import { STUDIO_COLORS } from '@/components/ui/studioTokens'
import { useStudioLocale } from '@/i18n'
import type { ContextMenu } from './constants'

const ESTIMATED_MENU_WIDTH = 160
const ESTIMATED_ITEM_HEIGHT = 32

interface LayerContextMenuProps {
  contextMenu: ContextMenu
  layers: Layer[]
  clipboard: Layer[] | null
  onMenuAction: (action: string, layerId: string) => void
  onClose?: () => void
}

export function LayerContextMenu({
  contextMenu,
  layers,
  clipboard,
  onMenuAction,
  onClose,
}: LayerContextMenuProps) {
  const { t } = useStudioLocale()
  const menuRef = useRef<HTMLDivElement>(null)
  const ctxLayer = layers.find((l) => l.id === contextMenu.layerId)
  const menuItems = [
    { action: 'copy', label: t.layers.contextMenu.copy },
    { action: 'cut', label: t.layers.contextMenu.cut },
    ...(clipboard ? [{ action: 'paste', label: t.layers.contextMenu.paste }] : []),
    { action: 'duplicate', label: t.layers.contextMenu.duplicate },
    { action: 'up', label: t.layers.contextMenu.moveUp },
    { action: 'down', label: t.layers.contextMenu.moveDown },
    ...(ctxLayer?.type === 'group' ? [{ action: 'dissolve', label: t.layers.contextMenu.dissolveGroup }] : []),
    { action: 'delete', label: t.layers.contextMenu.delete },
  ]

  const dismiss = useCallback(() => {
    if (onClose) onClose()
    else onMenuAction('dismiss', contextMenu.layerId)
  }, [onClose, onMenuAction, contextMenu.layerId])

  const estimatedHeight = menuItems.length * ESTIMATED_ITEM_HEIGHT + 8
  const position = useClampedMenuPosition(
    menuRef,
    contextMenu.x,
    contextMenu.y,
    ESTIMATED_MENU_WIDTH,
    estimatedHeight,
  )

  useContextMenuKeyboard(menuRef, true, dismiss)

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={ctxLayer ? `${ctxLayer.name} ${t.layers.layers}` : t.layers.layers}
      className="fixed z-50 py-1 rounded shadow-2xl border focus:outline-none"
      style={{
        left: position.left,
        top: position.top,
        background: STUDIO_COLORS.surfacePanel,
        borderColor: STUDIO_COLORS.borderSubtle,
        minWidth: 140,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map(({ action, label }) => (
        <button
          key={action}
          type="button"
          role="menuitem"
          className="w-full text-left px-3 py-2 text-xs text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:bg-[rgba(255,255,255,0.1)] transition-colors"
          style={action === 'delete' ? { color: STUDIO_COLORS.textDanger } : undefined}
          onClick={() => onMenuAction(action, contextMenu.layerId)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
