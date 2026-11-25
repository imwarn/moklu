/**
 * [INPUT]: depends on react, zustand useShallow, useEditorStore, PropertyControls, OverrideDot, ShadowControls, panelConstants contrast tokens, per-layer property editors, canvasFormats, alignLayers, locale, and useStudioLocale from @/i18n
 * [OUTPUT]: exports PropertiesPanel component with WCAG AA contrast, ARIA-labeled controls, localized Layout/Style/Content tabs, alignment controls, copy/paste style, and empty selection hint
 * [POS]: right inspector panel of StudioPage inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useMemo, useState } from 'react'
import type { FocusEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store'
import type {
  Layer,
  BackgroundLayer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  EmojiLayer,
  BrandLayer,
  GroupLayer,
  PhoneLayer,
  SlideGroup,
  FillValue,
} from '@/types'
import { ColorField, FillControl, SliderField } from '@/components/properties/PropertyControls'
import { OverrideDot } from '@/components/properties/OverrideDot'
import { DEFAULT_TEXT_WIDTH } from '@/utils/textRendering'
import {
  inputCls,
  labelCls,
  rowCls,
  fieldCls,
  panelSectionCls,
  pauseTemporal,
  resumeTemporal,
  STUDIO_TEXT_MUTED_CLS,
  STUDIO_TEXT_SUBTLE_CLS,
  type PanelTab,
} from '@/components/properties/panelConstants'
import { ShadowControls } from '@/components/properties/shared'
import { BackgroundProperties } from '@/components/properties/BackgroundProperties'
import { PhoneProperties } from '@/components/properties/PhoneProperties'
import { TextProperties } from '@/components/properties/TextProperties'
import { ImageProperties } from '@/components/properties/ImageProperties'
import { EmojiProperties } from '@/components/properties/EmojiProperties'
import { BrandProperties } from '@/components/properties/BrandProperties'
import { ShapeProperties } from '@/components/properties/ShapeProperties'
import { GroupProperties } from '@/components/properties/GroupProperties'
import { getCanvasFormat, getFormatCanvasDims, getFormatLabel, getProjectActiveFormats, getProjectBaseFormat, resolveGroupView } from '@/utils/canvasFormats'
import type { CanvasFormatId } from '@/types'
import { getLayerBBox, getUnionBBox, computeAlignPatch, type AlignAxis } from '@/utils/alignLayers'
import { getLanguageName } from '@/utils/locale'
import { useStudioLocale } from '@/i18n'

// ─── Alignment Section ────────────────────────────────────────────────────────

/**
 * Align-to-slide and align-to-selection controls.
 * Shown in the Layout tab for all non-background layers.
 *
 * Single layer selected → align to the current slide's bbox.
 * Multiple layers selected (selectedLayerIds) → align each to the union bbox
 * of the selection (align-to-selection mode).
 */
function AlignmentSection({
  layer,
  slideWidth,
  slideHeight,
  slideOffsetX,
}: {
  layer: Layer
  slideWidth: number
  slideHeight: number
  slideOffsetX: number
}) {
  const { t } = useStudioLocale()
  const { updateLayer, selectedLayerIds, project, activeSlideGroupId, editingGroupId } = useEditorStore(
    useShallow((s) => ({
      updateLayer: s.updateLayer,
      selectedLayerIds: s.selectedLayerIds,
      project: s.project,
      activeSlideGroupId: s.activeSlideGroupId,
      editingGroupId: s.editingGroupId,
    }))
  )

  // Determine which layer IDs are in the current selection
  const isMulti = selectedLayerIds.length >= 2
  const activeGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)

  // Resolve the full layer list (handles group-edit mode)
  const layerList: Layer[] = (() => {
    if (!activeGroup) return []
    if (editingGroupId) {
      const grp = activeGroup.layers.find((l) => l.id === editingGroupId && l.type === 'group') as GroupLayer | undefined
      return grp?.children ?? []
    }
    return activeGroup.layers
  })()

  const align = (axis: AlignAxis) => {
    if (isMulti) {
      // Align each selected layer to the union bbox of the selection
      const unionBBox = getUnionBBox(selectedLayerIds)
      if (!unionBBox) return
      for (const id of selectedLayerIds) {
        const l = layerList.find((x) => x.id === id)
        if (!l) continue
        const bbox = getLayerBBox(id)
        if (!bbox) continue
        const patch = computeAlignPatch(l, bbox, unionBBox, axis)
        if (Object.keys(patch).length > 0) updateLayer(id, patch)
      }
    } else {
      // Align the single selected layer to the slide
      const slideBBox = { x: slideOffsetX, y: 0, width: slideWidth, height: slideHeight }
      const bbox = getLayerBBox(layer.id)
      if (!bbox) return
      const patch = computeAlignPatch(layer, bbox, slideBBox, axis)
      if (Object.keys(patch).length > 0) updateLayer(layer.id, patch)
    }
  }

  const btnCls = `flex items-center justify-center rounded border border-[rgba(255,255,255,0.1)] p-1.5 ${STUDIO_TEXT_MUTED_CLS} hover:border-accent/50 hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 transition-colors`

  // SVG icons for alignment axes
  const icons: Record<AlignAxis, React.ReactNode> = {
    'left':     <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="1" y="2" width="2" height="12" rx="0.5"/><rect x="4" y="4" width="8" height="3" rx="0.5"/><rect x="4" y="9" width="11" height="3" rx="0.5"/></svg>,
    'center-h': <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="7" y="1" width="2" height="14" rx="0.5"/><rect x="3" y="4" width="10" height="3" rx="0.5"/><rect x="1" y="9" width="14" height="3" rx="0.5"/></svg>,
    'right':    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="13" y="2" width="2" height="12" rx="0.5"/><rect x="4" y="4" width="8" height="3" rx="0.5"/><rect x="1" y="9" width="11" height="3" rx="0.5"/></svg>,
    'top':      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="2" y="1" width="12" height="2" rx="0.5"/><rect x="4" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="4" width="3" height="11" rx="0.5"/></svg>,
    'center-v': <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="1" y="7" width="14" height="2" rx="0.5"/><rect x="4" y="3" width="3" height="10" rx="0.5"/><rect x="9" y="1" width="3" height="14" rx="0.5"/></svg>,
    'bottom':   <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><rect x="2" y="13" width="12" height="2" rx="0.5"/><rect x="4" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="1" width="3" height="11" rx="0.5"/></svg>,
  }

  const titles: Record<AlignAxis, string> = {
    'left':     isMulti ? t.properties.align.multiLeft : t.properties.align.left,
    'center-h': isMulti ? t.properties.align.multiCenterH : t.properties.align.centerH,
    'right':    isMulti ? t.properties.align.multiRight : t.properties.align.right,
    'top':      isMulti ? t.properties.align.multiTop : t.properties.align.top,
    'center-v': isMulti ? t.properties.align.multiCenterV : t.properties.align.centerV,
    'bottom':   isMulti ? t.properties.align.multiBottom : t.properties.align.bottom,
  }

  return (
    <div className={panelSectionCls}>
      <label className={labelCls}>
        {isMulti ? `${t.properties.alignSelection} (${selectedLayerIds.length})` : t.properties.alignToSlide}
      </label>
      <div className="grid grid-cols-6 gap-1">
        {(['left', 'center-h', 'right', 'top', 'center-v', 'bottom'] as AlignAxis[]).map((axis) => (
          <button
            key={axis}
            type="button"
            aria-label={titles[axis]}
            title={titles[axis]}
            onClick={() => align(axis)}
            className={btnCls}
          >
            <span aria-hidden="true">{icons[axis]}</span>
          </button>
        ))}
      </div>
      {isMulti && (
        <p className={`mt-1.5 text-[10px] ${STUDIO_TEXT_SUBTLE_CLS}`}>{t.properties.alignSelectionHint}</p>
      )}
    </div>
  )
}

// ─── Layout Tab ───────────────────────────────────────────────────────────────

function LayoutTab({ layer }: { layer: Layer }) {
  const { t } = useStudioLocale()
  const { updateLayer, project, activeSlideGroupId, activeCanvasFormat, editingGroupId, setLayerFormatVisibility } = useEditorStore(
    useShallow((s) => ({
      updateLayer: s.updateLayer,
      project: s.project,
      activeSlideGroupId: s.activeSlideGroupId,
      activeCanvasFormat: s.activeCanvasFormat,
      editingGroupId: s.editingGroupId,
      setLayerFormatVisibility: s.setLayerFormatVisibility,
    }))
  )
  const upd = (patch: Partial<Layer>) => updateLayer(layer.id, patch)
  const isBackground = layer.type === 'background'
  const sizeLayer = layer.type === 'shape' || layer.type === 'image' ? layer : null

  // Dynamic ranges based on the active format's canvas dimensions
  const activeGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)
  const formatDims = activeGroup
    ? getFormatCanvasDims(activeGroup, activeCanvasFormat, getProjectBaseFormat(project), project.settings.customFormats)
    : { width: 1080, height: 1920 }
  const slideW = formatDims.width
  const slideH = formatDims.height
  const canvasW = slideW * (activeGroup?.numSlides ?? 1)
  const canvasH = slideH
  const xMin = -Math.round(canvasW * 0.25)
  const xMax = Math.round(canvasW * 1.25)
  const yMin = -Math.round(canvasH * 0.25)
  const yMax = Math.round(canvasH * 1.25)

  // Which slide is this layer on? (for pano groups)
  const layerCenterX = layer.x + (('width' in layer && typeof layer.width === 'number' ? layer.width : 0)) / 2
  const slideIndex = activeGroup
    ? Math.min(Math.max(Math.floor(layerCenterX / slideW), 0), (activeGroup.numSlides ?? 1) - 1)
    : 0
  const slideOffsetX = slideIndex * slideW

  // Raw layer (unresolved) for format overrides and visibility
  const rawGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)
  let rawLayer: Layer | null = null
  if (rawGroup) {
    if (editingGroupId) {
      const parentGroup = rawGroup.layers.find((l) => l.id === editingGroupId && l.type === 'group') as GroupLayer | undefined
      rawLayer = parentGroup?.children.find((c) => c.id === layer.id) ?? null
    } else {
      rawLayer = rawGroup.layers.find((l) => l.id === layer.id) ?? null
    }
  }

  // Active formats for platform visibility chips
  const activeFormats: CanvasFormatId[] = rawGroup?.formats?.filter((format) => getProjectActiveFormats(project).includes(format))
    ?? getProjectActiveFormats(project)

  return (
    <div className="space-y-4">
      {/* Name + visibility/lock */}
      <div className={panelSectionCls}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <label htmlFor="layer-name-input" className={labelCls}>{t.properties.name}</label>
            <input
              id="layer-name-input"
              type="text"
              value={layer.name}
              onChange={(e) => upd({ name: e.target.value })}
              className={inputCls}
            />
          </div>
          {!isBackground && (
            <div className="flex gap-1 pt-[18px]">
              <button
                type="button"
                aria-label={layer.visible ? t.properties.hideLayer : t.properties.showLayer}
                aria-pressed={layer.visible}
                title={layer.visible ? t.properties.hideLayer : t.properties.showLayer}
                onClick={() => upd({ visible: !layer.visible })}
                className={`h-[30px] w-[30px] flex items-center justify-center rounded border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                  layer.visible
                    ? 'border-[rgba(255,255,255,0.12)] text-[#e8e8f0]'
                    : `border-[rgba(255,255,255,0.06)] ${STUDIO_TEXT_SUBTLE_CLS}`
                } hover:border-[rgba(255,255,255,0.22)]`}
              >
                <span aria-hidden="true">{layer.visible ? '●' : '○'}</span>
              </button>
              <button
                type="button"
                aria-label={layer.locked ? t.properties.unlockLayer : t.properties.lockLayer}
                aria-pressed={layer.locked}
                title={layer.locked ? t.properties.unlockLayer : t.properties.lockLayer}
                onClick={() => upd({ locked: !layer.locked })}
                className={`h-[30px] w-[30px] flex items-center justify-center rounded border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                  layer.locked
                    ? 'border-accent text-accent-text bg-accent-soft'
                    : `border-[rgba(255,255,255,0.1)] ${STUDIO_TEXT_MUTED_CLS}`
                } hover:border-[rgba(255,255,255,0.22)]`}
              >
                <span aria-hidden="true">{layer.locked ? '⚿' : '⚷'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Platform visibility — only shown when multiple formats are active and layer is not format-owned */}
      {!isBackground && activeFormats.length > 1 && !rawLayer?.ownerFormat && (
        <div className={panelSectionCls}>
          <label className={labelCls}>{t.properties.visibleIn}</label>
          <div className="flex flex-wrap gap-1.5">
            {activeFormats.map((fmtId) => {
              const vis = rawLayer?.formatVisibility?.[fmtId]
              // undefined = visible (default), true = explicitly visible, false = hidden
              const isVisible = vis !== false
              return (
                <button
                  key={fmtId}
                  type="button"
                  aria-pressed={isVisible}
                  onClick={() => setLayerFormatVisibility(layer.id, fmtId, isVisible ? false : undefined)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    isVisible
                      ? 'border-[rgba(255,255,255,0.15)] text-[#e8e8f0] bg-[rgba(255,255,255,0.06)]'
                      : `border-[rgba(255,255,255,0.06)] ${STUDIO_TEXT_SUBTLE_CLS} line-through`
                  }`}
                >
                  {getFormatLabel(fmtId, project.settings.customFormats)}
                </button>
              )
            })}
          </div>
          <p className={`mt-1.5 text-[10px] ${STUDIO_TEXT_MUTED_CLS}`}>{t.properties.visibleInHint}</p>
        </div>
      )}

      {/* Position / Size / Rotation — not applicable for background */}
      <div className={panelSectionCls}>
        {!isBackground && (
          <>
            <SliderField label="X" value={layer.x} min={xMin} max={xMax} unit="px" onChange={(v) => upd({ x: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="x" />} />
            <SliderField label="Y" value={layer.y} min={yMin} max={yMax} unit="px" onChange={(v) => upd({ y: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="y" />} />
            {sizeLayer && (
              <>
                <SliderField label="W" value={(sizeLayer as ImageLayer | ShapeLayer).width} min={1} max={canvasW} unit="px" onChange={(v) => upd({ width: v } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="width" />} />
                <SliderField label="H" value={(sizeLayer as ImageLayer | ShapeLayer).height} min={1} max={canvasH} unit="px" onChange={(v) => upd({ height: v } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="height" />} />
              </>
            )}
            {layer.type === 'text' && (
              <>
                <SliderField label="W" value={Math.round((layer as TextLayer).width ?? DEFAULT_TEXT_WIDTH)} min={40} max={canvasW} unit="px" onChange={(v) => upd({ width: v } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="width" />} />
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + ' !mb-0'}>H</label>
                    <button
                      type="button"
                      aria-pressed={(layer as TextLayer).height == null}
                      title={(layer as TextLayer).height != null ? t.properties.autoHeightTitle : t.properties.autoHeightActiveTitle}
                      onClick={() => upd({ height: undefined } as Partial<Layer>)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        (layer as TextLayer).height == null
                          ? 'border-accent text-accent-text bg-accent-soft cursor-default'
                          : `border-[rgba(255,255,255,0.1)] ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0]`
                      }`}
                    >
                      {(layer as TextLayer).height == null ? `✓ ${t.common.auto}` : t.common.auto}
                    </button>
                  </div>
                  {(layer as TextLayer).height != null && (
                    <SliderField label="" value={Math.round((layer as TextLayer).height!)} min={Math.round((layer as TextLayer).fontSize * (layer as TextLayer).lineHeight)} max={canvasH} unit="px" onChange={(v) => upd({ height: v } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0 mt-1" />
                  )}
                </div>
              </>
            )}
            <SliderField label={t.properties.rotation} value={layer.rotation} min={-180} max={180} unit="°" onChange={(v) => upd({ rotation: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} labelAddon={<OverrideDot layerId={layer.id} propKey="rotation" />} />
          </>
        )}
        <SliderField label={t.properties.opacity} value={Math.round(layer.opacity * 100)} min={0} max={100} unit="%" onChange={(v) => upd({ opacity: v / 100 })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
      </div>

      {/* Alignment — all non-background layers */}
      {!isBackground && (
        <AlignmentSection
          layer={layer}
          slideWidth={slideW}
          slideHeight={slideH}
          slideOffsetX={slideOffsetX}
        />
      )}
    </div>
  )
}

// ─── Style Tab ────────────────────────────────────────────────────────────────

function StyleTab({ layer }: { layer: Layer }) {
  const { t } = useStudioLocale()
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<Layer>) => updateLayer(layer.id, patch)

  // Fill value for layers that have one.
  // Text fill is intentionally excluded here — it's managed via the RichTextToolbar
  // in the Content tab (which supports per-span gradient fills and rich text marks).
  const fillValue: FillValue | null =
    layer.type === 'shape' ? (layer as ShapeLayer).fill
    : layer.type === 'background' ? (layer as BackgroundLayer).fill
    : null

  return (
    <div className="space-y-4">
      {/* Fill — background, text, shape */}
      {fillValue !== null && (
        <div className={panelSectionCls}>
          <label className={labelCls}>{t.properties.fill}</label>
          {/* key=layer.id resets editor state (selected stop, drag) when switching layers */}
          <FillControl
            key={layer.id}
            fill={fillValue}
            onChange={(fill) => upd({ fill } as Partial<Layer>)}
            onInteractionStart={pauseTemporal}
            onInteractionEnd={resumeTemporal}
          />
        </div>
      )}

      {/* Shape: stroke */}
      {layer.type === 'shape' && (
        <div className={panelSectionCls}>
          <div className={rowCls + ' !mb-0'}>
            <div className={fieldCls}>
              <label className={labelCls}>{t.properties.stroke}</label>
              <ColorField value={(layer as ShapeLayer).stroke ?? '#FFFFFF'} onChange={(value) => upd({ stroke: value } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
            </div>
            <div className={fieldCls}>
              <SliderField label={t.properties.width} value={(layer as ShapeLayer).strokeWidth ?? 0} min={0} max={50} unit="px" onChange={(v) => upd({ strokeWidth: v } as Partial<Layer>)} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
            </div>
          </div>
        </div>
      )}

      {/* Blur + Shadow — all layers */}
      <div className={panelSectionCls}>
        <SliderField label={t.properties.blur} value={layer.blur ?? 0} min={0} max={100} unit="px" onChange={(v) => upd({ blur: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
        <ShadowControls layer={layer} />
      </div>
    </div>
  )
}

// ─── Content Tab (per-type router) ────────────────────────────────────────────

function ContentTab({ layer }: { layer: Layer }) {
  const { t } = useStudioLocale()
  if (layer.type === 'background') return (
    <div className={panelSectionCls}>
      <p className="text-sm text-[#e8e8f0]">{t.properties.background}</p>
      <p className={`mt-1 text-xs ${STUDIO_TEXT_MUTED_CLS}`}>{t.properties.backgroundContentHint}</p>
    </div>
  )
  if (layer.type === 'phone') return <PhoneProperties layer={layer as PhoneLayer} />
  if (layer.type === 'text') return <TextProperties layer={layer as TextLayer} />
  if (layer.type === 'image') return <ImageProperties layer={layer as ImageLayer} />
  if (layer.type === 'emoji') return <EmojiProperties layer={layer as EmojiLayer} />
  if (layer.type === 'brand') return <BrandProperties layer={layer as BrandLayer} />
  if (layer.type === 'shape') return <ShapeProperties layer={layer as ShapeLayer} />
  if (layer.type === 'group') return <GroupProperties layer={layer as GroupLayer} />
  return <div className={panelSectionCls}><p className={`text-xs ${STUDIO_TEXT_MUTED_CLS}`}>{t.properties.unknownLayerType}</p></div>
}

// ─── PropertiesPanel shell ────────────────────────────────────────────────────

export function PropertiesPanel() {
  const { t } = useStudioLocale()
  const {
    project,
    activeSlideGroupId,
    selection,
    editingGroupId,
    activeCanvasFormat,
    activeLocale,
    clearLayerFormatOverride,
    clearLayerLocaleAdjust,
    syncLayerFormatToShared,
    makeLayerShared,
    copyLayerStyle,
    pasteLayerStyle,
    styleClipboard,
    pendingContentFocusLayerId,
    setPendingContentFocus,
  } = useEditorStore(
    useShallow((s) => ({
      project: s.project,
      activeSlideGroupId: s.activeSlideGroupId,
      selection: s.selection,
      editingGroupId: s.editingGroupId,
      activeCanvasFormat: s.activeCanvasFormat,
      activeLocale: s.activeLocale,
      clearLayerFormatOverride: s.clearLayerFormatOverride,
      clearLayerLocaleAdjust: s.clearLayerLocaleAdjust,
      syncLayerFormatToShared: s.syncLayerFormatToShared,
      makeLayerShared: s.makeLayerShared,
      copyLayerStyle: s.copyLayerStyle,
      pasteLayerStyle: s.pasteLayerStyle,
      styleClipboard: s.styleClipboard,
      pendingContentFocusLayerId: s.pendingContentFocusLayerId,
      setPendingContentFocus: s.setPendingContentFocus,
    }))
  )
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const [activeTab, setActiveTab] = useState<PanelTab>('layout')

  const rawActiveGroup: SlideGroup | undefined = project.slideGroups.find((group) => group.id === activeSlideGroupId)
  const activeGroup = useMemo(
    () => rawActiveGroup && resolveGroupView(rawActiveGroup, project.settings, activeLocale, activeCanvasFormat),
    [rawActiveGroup, project.settings, activeLocale, activeCanvasFormat],
  )

  let selectedLayer: Layer | null = null
  let rawSelectedLayer: Layer | null = null
  if (selection?.layerId && activeGroup) {
    if (editingGroupId) {
      // selection.layerId IS the child id in group edit mode
      const parentGroup = activeGroup.layers.find((l) => l.id === editingGroupId && l.type === 'group') as GroupLayer | undefined
      selectedLayer = parentGroup?.children.find((child) => child.id === selection.layerId) ?? null
      const rawParentGroup = rawActiveGroup?.layers.find((l) => l.id === editingGroupId && l.type === 'group') as GroupLayer | undefined
      rawSelectedLayer = rawParentGroup?.children.find((child) => child.id === selection.layerId) ?? null
    } else {
      selectedLayer = activeGroup.layers.find((layer) => layer.id === selection.layerId) ?? null
      rawSelectedLayer = rawActiveGroup?.layers.find((layer) => layer.id === selection.layerId) ?? null
    }
  }
  if (!selectedLayer && rawSelectedLayer) selectedLayer = rawSelectedLayer

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab('layout')
  }, [selectedLayer?.id])

  // In-canvas text editing started → jump to the Content tab so the docked
  // styling toolbar and font/size controls are at hand.
  useEffect(() => {
    if (!editingTextId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab('content')
  }, [editingTextId])

  // Shape/Emoji just inserted → open the Content tab so the shape/emoji picker
  // is visible immediately. Declared AFTER the layout-reset effect so it wins
  // on the same insert commit. Clears the flag after consuming it.
  useEffect(() => {
    if (!pendingContentFocusLayerId) return
    if (selectedLayer?.id !== pendingContentFocusLayerId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab('content')
    setPendingContentFocus(null)
  }, [pendingContentFocusLayerId, selectedLayer?.id, setPendingContentFocus])

  const handlePanelFocus = (e: FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return
    const type = (el as HTMLInputElement).type
    if (type === 'range' || type === 'color' || type === 'checkbox' || type === 'radio' || type === 'file') return
    pauseTemporal()
  }

  const handlePanelBlur = (e: FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return
    const type = (el as HTMLInputElement).type
    if (type === 'range' || type === 'color' || type === 'checkbox' || type === 'radio' || type === 'file') return
    resumeTemporal()
  }

  const baseCanvasFormat = getProjectBaseFormat(project)
  const activeFormatInfo = getCanvasFormat(activeCanvasFormat, project.settings.customFormats)
  const isBaseFormat = activeCanvasFormat === baseCanvasFormat
  const selectedHasFormatOverride = Boolean(rawSelectedLayer?.formatOverrides?.[activeCanvasFormat])
  // P3: `activeCanvasFormat` doubles as the `localeAdjust` scope key — at the
  // Base tab it already equals `BASE_CANVAS_FORMAT`, so this one read covers
  // both the base-scoped and format-scoped cell via the same code path (the
  // "2 near-duplicate banners" this replaces used to read 2 different legacy
  // fields for exactly this base-vs-format split).
  const activeLocaleAdjust = rawSelectedLayer?.localeAdjust?.[activeLocale]?.[activeCanvasFormat]
  const localeAdjustCount = Object.keys(activeLocaleAdjust ?? {}).length
  const isDefaultLocale = activeLocale === project.settings.defaultLocale
  const activeLocaleLabel = getLanguageName(activeLocale)
  const isBackgroundSelected = selectedLayer?.type === 'background'

  const borderColor = 'rgba(255,255,255,0.06)'

  return (
    <aside data-properties-panel className="h-full w-64 max-w-[calc(100vw-2.5rem)] shrink-0 flex flex-col overflow-hidden lg:max-w-none min-[1440px]:w-72" style={{ background: '#18181f', borderLeft: `1px solid ${borderColor}` }}>
      <div className="shrink-0 border-b px-3 py-2" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${STUDIO_TEXT_MUTED_CLS}`}>{t.properties.title}</span>
          {selectedLayer && (
            <div className="flex gap-1">
              <button
                type="button"
                title={t.properties.copyStyleTitle}
                onClick={() => copyLayerStyle(selectedLayer!.id)}
                className={`text-[10px] px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0] hover:border-[rgba(255,255,255,0.2)] transition-colors`}
              >
                {t.properties.copyStyle}
              </button>
              {styleClipboard && (
                <button
                  type="button"
                  title={
                    styleClipboard.layerType === selectedLayer.type
                      ? t.properties.pasteStyleTitle
                      : `${t.properties.pasteStyle} (${styleClipboard.layerType})`
                  }
                  onClick={() => {
                    if (styleClipboard.layerType === selectedLayer!.type) pasteLayerStyle(selectedLayer!.id)
                  }}
                  disabled={styleClipboard.layerType !== selectedLayer.type}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                    styleClipboard.layerType === selectedLayer.type
                      ? 'border-accent/40 text-accent-text hover:text-white hover:border-accent hover:bg-accent/15'
                      : `border-[rgba(255,255,255,0.06)] ${STUDIO_TEXT_SUBTLE_CLS} opacity-60 cursor-not-allowed`
                  }`}
                >
                  {t.properties.pasteStyle}
                </button>
              )}
            </div>
          )}
        </div>

        {selectedLayer && !isBackgroundSelected && (
          <div role="tablist" aria-label={t.properties.title} className="mt-3 flex gap-4 border-b border-[rgba(255,255,255,0.06)]">
            {([
              ['layout', t.properties.tabs.layout],
              ['style', t.properties.tabs.style],
              ['content', t.properties.tabs.content],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={activeTab === value}
                onClick={() => setActiveTab(value)}
                className={`h-7 border-b-2 text-[11px] font-medium transition-colors ${activeTab === value ? 'border-accent text-white' : `border-transparent ${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0]`}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3" onFocusCapture={handlePanelFocus} onBlurCapture={handlePanelBlur}>
        {!selectedLayer ? (
          <p className={`px-2 py-6 text-center text-xs leading-relaxed ${STUDIO_TEXT_MUTED_CLS}`}>
            {t.properties.emptySelectionHint}
          </p>
        ) : (
          <>
            {editingGroupId && selection?.layerId && (
              <div className="mb-4 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent-text">
                {t.properties.editingInsideGroup}
              </div>
            )}

            {rawSelectedLayer && !isBaseFormat && rawSelectedLayer.ownerFormat === activeCanvasFormat && (
              <div className="mb-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-accent-text">
                    {activeFormatInfo.label}
                  </span>
                  <button
                    onClick={() => makeLayerShared(rawSelectedLayer!.id)}
                    className="text-[10px] text-accent-text hover:text-white underline shrink-0"
                  >
                    {t.properties.makeShared}
                  </button>
                </div>
              </div>
            )}

            {rawSelectedLayer && !isBaseFormat && !rawSelectedLayer.ownerFormat && selectedHasFormatOverride && (
              <div className="mb-3 rounded-lg border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#fbbf24]">
                    {activeFormatInfo.label} ({Object.keys(rawSelectedLayer.formatOverrides?.[activeCanvasFormat] ?? {}).length})
                  </span>
                  <div className="flex gap-1.5">
                    <button onClick={() => clearLayerFormatOverride(rawSelectedLayer!.id)} className="text-[10px] text-[#fbbf24] hover:text-white underline">{t.common.reset}</button>
                    <button onClick={() => syncLayerFormatToShared(rawSelectedLayer!.id)} className="text-[10px] text-[#fbbf24] hover:text-white underline">{t.common.share}</button>
                  </div>
                </div>
              </div>
            )}

            {rawSelectedLayer && !isDefaultLocale && localeAdjustCount > 0 && (
              <div
                className="mb-3 rounded-lg border px-3 py-2"
                style={{
                  borderColor: isBaseFormat ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'rgba(34,211,238,0.25)',
                  background: isBaseFormat ? 'var(--color-accent-soft)' : 'rgba(34,211,238,0.08)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px]" style={{ color: isBaseFormat ? 'var(--color-accent-text)' : '#22d3ee' }}>
                    {activeLocaleLabel} · {isBaseFormat ? t.context.base : activeFormatInfo.label} ({localeAdjustCount})
                  </span>
                  <button
                    onClick={() => clearLayerLocaleAdjust(rawSelectedLayer!.id, activeLocale, activeCanvasFormat)}
                    className="shrink-0 text-[10px] underline hover:text-white"
                    style={{ color: isBaseFormat ? 'var(--color-accent-text)' : '#22d3ee' }}
                  >
                    {t.common.reset}
                  </button>
                </div>
              </div>
            )}

            {isBackgroundSelected ? (
              <div className={panelSectionCls}>
                <div className={`mb-3 text-xs font-semibold uppercase tracking-wider ${STUDIO_TEXT_MUTED_CLS}`}>{t.properties.background}</div>
                <BackgroundProperties layer={selectedLayer as BackgroundLayer} />
              </div>
            ) : (
              <>
                {activeTab === 'layout' && <LayoutTab layer={selectedLayer} />}
                {activeTab === 'style' && <StyleTab layer={selectedLayer} />}
                {activeTab === 'content' && <ContentTab layer={selectedLayer} />}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
