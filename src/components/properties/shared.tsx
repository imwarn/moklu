/**
 * [INPUT]: depends on useEditorStore, ColorField/SliderField from ./PropertyControls, Layer type, panelConstants, ToggleSwitch, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ShadowControls shared drop-shadow property section with localized labels
 * [POS]: shared style inspector sub-component inside src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEditorStore } from '@/store'
import { ColorField, SliderField } from '@/components/properties/PropertyControls'
import type { Layer } from '@/types'
import { labelCls, pauseTemporal, resumeTemporal } from '@/components/properties/panelConstants'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useStudioLocale } from '@/i18n'

export function ShadowControls({ layer }: { layer: Layer }) {
  const { t } = useStudioLocale()
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<Layer>) => updateLayer(layer.id, patch)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={labelCls + ' !mb-0'}>{t.properties.shadow}</label>
        <ToggleSwitch
          checked={Boolean(layer.shadow)}
          ariaLabel={t.properties.shadow}
          onChange={() => {
            if (layer.shadow) {
              upd({ shadow: undefined })
            } else {
              upd({ shadow: { color: '#000000', blur: 20, offsetX: 0, offsetY: 4, opacity: 0.5 } })
            }
          }}
          className="relative h-6 w-11 rounded-full border transition-colors"
          knobClassName="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all"
          checkedClassName="border-[#7c6ef6] bg-[#7c6ef6]"
          uncheckedClassName="border-[rgba(255,255,255,0.12)] bg-[#0f0f13]"
          checkedKnobClassName="left-[22px]"
          uncheckedKnobClassName="left-0.5"
        />
      </div>

      {layer.shadow && (
        <div className="space-y-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-3">
          <div>
            <label className={labelCls}>{t.properties.color}</label>
            <ColorField value={layer.shadow.color} onChange={(value) => upd({ shadow: { ...layer.shadow!, color: value } })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
          </div>
          <SliderField label={t.properties.blur} value={layer.shadow.blur} min={0} max={100} unit="px" onChange={(v) => upd({ shadow: { ...layer.shadow!, blur: v } })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
          <SliderField label={t.properties.opacity} value={Math.round(layer.shadow.opacity * 100)} min={0} max={100} unit="%" onChange={(v) => upd({ shadow: { ...layer.shadow!, opacity: v / 100 } })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
          <SliderField label={t.properties.offsetX} value={layer.shadow.offsetX} min={-100} max={100} unit="px" onChange={(v) => upd({ shadow: { ...layer.shadow!, offsetX: v } })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
          <SliderField label={t.properties.offsetY} value={layer.shadow.offsetY} min={-100} max={100} unit="px" onChange={(v) => upd({ shadow: { ...layer.shadow!, offsetY: v } })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
        </div>
      )}
    </div>
  )
}
