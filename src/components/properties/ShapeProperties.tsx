/**
 * [INPUT]: depends on useEditorStore, SliderField, SegmentedControl, panelConstants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ShapeProperties inspector panel localized across EN/ZH/JA/KO
 * [POS]: shape layer property editor within src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEditorStore } from '@/store'
import type { ShapeLayer, Layer } from '@/types'
import { SliderField } from '@/components/properties/PropertyControls'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { labelCls, panelSectionCls, pauseTemporal, resumeTemporal } from '@/components/properties/panelConstants'
import { useStudioLocale } from '@/i18n'

// Shapes that look best starting square
const SQUARE_SHAPES = new Set<ShapeLayer['shapeType']>(['triangle', 'diamond', 'star', 'pentagon', 'hexagon', 'cross', 'check'])

const SHAPE_OPTIONS: { type: ShapeLayer['shapeType']; icon: string }[] = [
  { type: 'rect',     icon: '▭' },
  { type: 'ellipse',  icon: '⬭' },
  { type: 'triangle', icon: '△' },
  { type: 'diamond',  icon: '◇' },
  { type: 'star',     icon: '☆' },
  { type: 'pentagon', icon: '⬠' },
  { type: 'hexagon',  icon: '⬡' },
  { type: 'arrow',    icon: '→' },
  { type: 'cross',    icon: '+' },
  { type: 'check',    icon: '✓' },
]

const ARROW_DIRECTIONS: { dir: NonNullable<ShapeLayer['arrowDirection']>; label: string }[] = [
  { dir: 'right', label: '→' },
  { dir: 'up',    label: '↑' },
  { dir: 'down',  label: '↓' },
  { dir: 'left',  label: '←' },
]

export function ShapeProperties({ layer }: { layer: ShapeLayer }) {
  const { t } = useStudioLocale()
  const tp = t.properties
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<ShapeLayer>) => updateLayer(layer.id, patch as Partial<Layer>)

  return (
    <div className="space-y-4">
      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.shapeType}</label>
        <SegmentedControl
          value={layer.shapeType}
          options={SHAPE_OPTIONS.map(({ type, icon }) => ({
            value: type,
            label: (
              <>
                <span className="text-base leading-none">{icon}</span>
                <span>{tp.shapes[type]}</span>
              </>
            ),
          }))}
          onChange={(type) => {
            const patch: Partial<ShapeLayer> = { shapeType: type }
            if (SQUARE_SHAPES.has(type)) {
              const side = Math.min(layer.width, layer.height)
              patch.width = side
              patch.height = side
            }
            upd(patch)
          }}
          optionClassName="rounded-lg border px-2 py-2 text-xs transition-colors flex flex-col items-center gap-0.5"
        />
      </div>

      {layer.shapeType === 'rect' && (
        <div className={panelSectionCls}>
          <SliderField
            label={tp.cornerRadius}
            value={layer.cornerRadius}
            min={0}
            max={500}
            unit="px"
            onChange={(v) => upd({ cornerRadius: v })}
            onInteractionStart={pauseTemporal}
            onInteractionEnd={resumeTemporal}
            className="!mb-0"
          />
        </div>
      )}

      {layer.shapeType === 'star' && (
        <div className={panelSectionCls}>
          <SliderField
            label={tp.starPoints}
            value={layer.starPoints ?? 5}
            min={3}
            max={12}
            onChange={(v) => upd({ starPoints: v })}
            onInteractionStart={pauseTemporal}
            onInteractionEnd={resumeTemporal}
          />
          <SliderField
            label={tp.starInnerRatio}
            value={Math.round((layer.starInnerRatio ?? 0.4) * 100)}
            min={10}
            max={90}
            unit="%"
            onChange={(v) => upd({ starInnerRatio: v / 100 })}
            onInteractionStart={pauseTemporal}
            onInteractionEnd={resumeTemporal}
            className="!mb-0"
          />
        </div>
      )}

      {layer.shapeType === 'arrow' && (
        <div className={panelSectionCls}>
          <label className={labelCls}>{tp.direction}</label>
          <SegmentedControl
            value={layer.arrowDirection ?? 'right'}
            options={ARROW_DIRECTIONS.map(({ dir, label }) => ({ value: dir, label }))}
            onChange={(dir) => upd({ arrowDirection: dir })}
            className="grid grid-cols-4 gap-2"
            optionClassName="rounded-lg border py-2 text-base transition-colors"
          />
        </div>
      )}
    </div>
  )
}
