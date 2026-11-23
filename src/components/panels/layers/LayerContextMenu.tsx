/**
 * [INPUT]: depends on Layer type from @/types, ContextMenu from ./constants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports LayerContextMenu component with localized layer actions
 * [POS]: floating right-click layer menu inside src/components/panels/layers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { Layer } from '@/types'
import type { ContextMenu } from './constants'
import { useStudioLocale } from '@/i18n'

interface LayerContextMenuProps {
  contextMenu: ContextMenu
  layers: Layer[]
  clipboard: Layer[] | null
  onMenuAction: (action: string, layerId: string) => void
}

export function LayerContextMenu({ contextMenu, layers, clipboard, onMenuAction }: LayerContextMenuProps) {
  const { t } = useStudioLocale()
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

  return (
    <div
      className="fixed z-50 py-1 rounded shadow-2xl border"
      style={{ left: contextMenu.x, top: contextMenu.y, background: '#18181f', borderColor: 'rgba(255,255,255,0.08)', minWidth: 140 }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map(({ action, label }) => (
        <button
          key={action}
          className="w-full text-left px-3 py-2 text-xs text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          style={action === 'delete' ? { color: '#f87171' } : undefined}
          onClick={() => onMenuAction(action, contextMenu.layerId)}
        >{label}</button>
      ))}
    </div>
  )
}
