/**
 * [INPUT]: depends on useEditorStore, panelConstants, and useStudioLocale/formatMessage/splitMessageTemplate from @/i18n
 * [OUTPUT]: exports GroupProperties inspector panel localized across EN/ZH/JA/KO
 * [POS]: group layer property editor within src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Fragment } from 'react'
import { useEditorStore } from '@/store'
import type { GroupLayer, Layer } from '@/types'
import { labelCls, panelSectionCls, pauseTemporal, resumeTemporal } from '@/components/properties/panelConstants'
import { formatMessage, splitMessageTemplate, useStudioLocale } from '@/i18n'

const LAYER_TYPE_ICON: Record<string, string> = {
  text: 'T',
  phone: '📱',
  image: '🖼',
  shape: '■',
  emoji: '😀',
  brand: '★',
  group: '▣',
  background: '▧',
}

export function GroupProperties({ layer }: { layer: GroupLayer }) {
  const { t } = useStudioLocale()
  const tp = t.properties
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<GroupLayer>) => updateLayer(layer.id, patch as Partial<Layer>)
  const scale = layer.scale ?? 1

  return (
    <div className="space-y-4">
      {/* Enter hint */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft p-3">
        <p className="text-xs font-semibold text-accent-text mb-1">{tp.groupSelected}</p>
        <p className="text-xs text-accent-text/90">
          {splitMessageTemplate(tp.groupEnterHint).map((part, idx) => (
            <Fragment key={idx}>
              {part.type === 'token' && part.key === 'action' ? (
                <strong>{tp.groupEnterAction}</strong>
              ) : (
                part.type === 'text' ? part.value : ''
              )}
            </Fragment>
          ))}
        </p>
      </div>

      {/* Scale */}
      <div className={panelSectionCls}>
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls + ' !mb-0'}>{tp.scale}</label>
          <span className="text-xs text-[#e8e8f0]">{scale.toFixed(2)}×</span>
        </div>
        <input type="range" min={0.1} max={4} step={0.05} value={scale} onChange={(e) => upd({ scale: Number(e.target.value) })} onMouseDown={pauseTemporal} onMouseUp={resumeTemporal} className="w-full accent-accent" />
      </div>

      {/* Children list */}
      {layer.children.length > 0 && (
        <div className={panelSectionCls}>
          <label className={labelCls}>
            {formatMessage(tp.innerLayersCount, { count: layer.children.length })}
          </label>
          <div className="space-y-1">
            {layer.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#101017] px-2 py-1.5"
              >
                <span className="text-xs text-[#6b6b7a] w-4 text-center shrink-0">
                  {LAYER_TYPE_ICON[child.type] ?? '?'}
                </span>
                <span className="text-xs text-[#a0a0b0] flex-1 truncate">{child.name}</span>
                <span className="text-[10px] text-[#4a4a5a] shrink-0 uppercase tracking-wide">
                  {tp.layerTypes[child.type as keyof typeof tp.layerTypes] ?? child.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
