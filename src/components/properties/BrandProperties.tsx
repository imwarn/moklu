/**
 * [INPUT]: depends on useEditorStore, fileToDataUrl, ColorField/SliderField, FileUploadButton, SegmentedControl, panelConstants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports BrandProperties inspector panel localized across EN/ZH/JA/KO
 * [POS]: brand layer property editor within src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEditorStore } from '@/store'
import type { BrandLayer, Layer } from '@/types'
import { fileToDataUrl } from '@/utils/files'
import { ColorField, SliderField } from '@/components/properties/PropertyControls'
import { FileUploadButton } from '@/components/ui/FileUploadButton'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  inputCls,
  labelCls,
  fieldCls,
  panelSectionCls,
  subtleButtonCls,
  pauseTemporal,
  resumeTemporal,
} from '@/components/properties/panelConstants'
import { useStudioLocale } from '@/i18n'

export function BrandProperties({ layer }: { layer: BrandLayer }) {
  const { t } = useStudioLocale()
  const tp = t.properties
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<BrandLayer>) => updateLayer(layer.id, patch as Partial<Layer>)

  return (
    <div className="space-y-4">
      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.appName}</label>
        <input type="text" value={layer.appName} onChange={(e) => upd({ appName: e.target.value })} className={inputCls} />
      </div>

      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.logo}</label>
        <div className="flex items-center gap-3">
          {layer.logoDataUrl && <img src={layer.logoDataUrl} alt={tp.logo} className="h-10 w-10 rounded-lg object-contain bg-[#0f0f13]" />}
          <FileUploadButton
            accept="image/*"
            className={subtleButtonCls}
            onFiles={async (files) => {
              const file = files[0]
              if (!file) return
              const dataUrl = await fileToDataUrl(file)
              upd({ logoDataUrl: dataUrl })
            }}
          >
            {layer.logoDataUrl ? tp.changeLogo : tp.uploadLogo}
          </FileUploadButton>
        </div>
      </div>

      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.nameColor}</label>
        <ColorField value={layer.nameColor} onChange={(value) => upd({ nameColor: value })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />

        <div className="mt-3">
          <SliderField label={tp.fontSize} value={layer.nameFontSize} min={6} max={200} unit="px" onChange={(v) => upd({ nameFontSize: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
          <div className={fieldCls}>
            <label className={labelCls}>{tp.fontWeight}</label>
            <select value={layer.nameFontWeight} onChange={(e) => upd({ nameFontWeight: Number(e.target.value) })} className={inputCls}>
              <option value={400}>400</option>
              <option value={600}>600</option>
              <option value={700}>700</option>
              <option value={800}>800</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <div className={fieldCls}>
            <label className={labelCls}>{tp.fontFamily}</label>
            <select value={layer.nameFontFamily} onChange={(e) => upd({ nameFontFamily: e.target.value })} className={inputCls}>
              <option value="Sora">Sora</option>
              <option value="Inter">Inter</option>
              <option value="system-ui">system-ui</option>
            </select>
          </div>
          <SliderField label={tp.logoSize} value={layer.logoSize} min={8} max={300} unit="px" onChange={(v) => upd({ logoSize: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="mt-3" />
        </div>
      </div>

      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.direction}</label>
        <SegmentedControl
          value={layer.direction}
          options={[
            { value: 'row', label: tp.horizontal },
            { value: 'column', label: tp.vertical },
          ]}
          onChange={(dir) => upd({ direction: dir })}
          className="grid grid-cols-2 gap-2 mb-3"
          optionClassName="rounded-lg border px-3 py-2 text-xs transition-colors"
        />
        <SliderField label={tp.gap} value={layer.gap} min={0} max={200} unit="px" onChange={(v) => upd({ gap: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
      </div>
    </div>
  )
}
