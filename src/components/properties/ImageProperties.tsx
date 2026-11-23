/**
 * [INPUT]: depends on useEditorStore, SliderField, panelConstants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ImageProperties inspector panel localized across EN/ZH/JA/KO
 * [POS]: image layer property editor within src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEditorStore } from '@/store'
import type { ImageLayer, Layer } from '@/types'
import { SliderField } from '@/components/properties/PropertyControls'
import { panelSectionCls, pauseTemporal, resumeTemporal } from '@/components/properties/panelConstants'
import { useStudioLocale } from '@/i18n'

export function ImageProperties({ layer }: { layer: ImageLayer }) {
  const { t } = useStudioLocale()
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<ImageLayer>) => updateLayer(layer.id, patch as Partial<Layer>)

  return (
    <div className="space-y-4">
      <div className={panelSectionCls}>
        <SliderField label={t.properties.cornerRadius} value={layer.cornerRadius} min={0} max={500} unit="px" onChange={(v) => upd({ cornerRadius: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
      </div>
    </div>
  )
}
