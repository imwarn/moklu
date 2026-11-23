/**
 * [INPUT]: depends on react, SlideGroup type, useEditorStore, stageRegistry, canvasResize helpers, and useStudioLocale from @/i18n
 * [OUTPUT]: exports CanvasSizeModal non-destructive artboard resize dialog localized across EN/ZH/JA/KO
 * [POS]: canvas dimension modal launched from Studio Toolbar inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState } from 'react'
import type { SlideGroup } from '@/types'
import { useEditorStore } from '@/store'
import { getStage } from '@/utils/stageRegistry'
import {
  CANVAS_PRESETS, resizeCanvasLayers, validateCanvasDimensions,
  type CanvasResizeMode,
} from '@/utils/canvasResize'
import { useStudioLocale } from '@/i18n'

interface CanvasSizeModalProps {
  open: boolean
  onClose: () => void
}

/** Non-destructive authoring artboard settings, independent of device/format. */
export function CanvasSizeModal({ open, onClose }: CanvasSizeModalProps) {
  const project = useEditorStore((s) => s.project)
  const activeId = useEditorStore((s) => s.activeSlideGroupId)
  const group = project.slideGroups.find((item) => item.id === activeId)
  if (!open) return null
  // Unmounting the dialog when closed naturally resets dimensions on reopen,
  // without a setState-in-effect render cascade.
  return <CanvasSizeDialog key={group?.id ?? 'none'} group={group} onClose={onClose} />
}

function CanvasSizeDialog({ group, onClose }: { group: SlideGroup | undefined; onClose: () => void }) {
  const { t } = useStudioLocale()
  const c = t.modals.canvasSize
  const [width, setWidth] = useState(String(group?.slideWidth ?? 1600))
  const [height, setHeight] = useState(String(group?.slideHeight ?? 900))
  const [mode, setMode] = useState<CanvasResizeMode>('center')
  const [error, setError] = useState<string | null>(null)

  const newWidth = Number(width)
  const newHeight = Number(height)
  const selectedPreset = CANVAS_PRESETS.find((p) => p.width === newWidth && p.height === newHeight)
  const resize = () => {
    if (!group) return
    if (group.numSlides !== 1) {
      setError(c.singleSlideError)
      return
    }
    const validationError = validateCanvasDimensions(newWidth, newHeight)
    if (validationError) {
      setError(validationError)
      return
    }
    if (newWidth !== group.slideWidth || newHeight !== group.slideHeight) {
      const state = useEditorStore.getState()
      // Base is the authoring space. Platform preview formats deliberately
      // keep their own preset size, unchanged by this operation.
      state.setActiveCanvasFormat('base')
      state.updateSlideGroup(group.id, {
        slideWidth: newWidth,
        slideHeight: newHeight,
        layers: resizeCanvasLayers(group.layers, group.slideWidth, group.slideHeight, newWidth, newHeight, mode),
      })
      // Fit the edited canvas into the stage immediately (the viewport hook
      // does not automatically refit for in-place dimension changes).
      const stage = getStage()
      if (stage && stage.width() > 100 && stage.height() > 100) {
        const zoom = Math.min(4, Math.max(0.05,
          Math.min((stage.width() - 90) / newWidth, (stage.height() - 90) / newHeight),
        ))
        state.setZoom(zoom)
        state.setViewportPosition(
          (stage.width() - newWidth * zoom) / 2,
          (stage.height() - newHeight * zoom) / 2,
        )
      }
    }
    onClose()
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-white/15 bg-[#222330] px-3 py-2 text-sm text-white focus:border-[#b6b1ef] focus:outline-none'
  return (
    <div className="fixed inset-0 z-[9001] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="canvas-size-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#18181f] p-6 text-[#f5f5f8] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="canvas-size-title" className="text-xl font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-[#aeb0c3]">{c.description}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-[#aaaabc]" aria-label={c.closeAria}>×</button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CANVAS_PRESETS.map((preset) => (
            <button type="button" key={preset.id} onClick={() => { setWidth(String(preset.width)); setHeight(String(preset.height)); setError(null) }}
              aria-pressed={preset.id === selectedPreset?.id}
              className={`rounded-lg border px-2 py-3 text-center transition-colors ${preset.id === selectedPreset?.id ? 'border-[#a79bed] bg-[#8276e8]/20' : 'border-white/10 bg-white/[0.025] hover:border-white/30'}`}>
              <span className="block text-sm font-semibold">{preset.id}</span>
              <span className="mt-1 block text-[10px] text-[#aeb0c3]">{preset.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-xs text-[#aeb0c3]">{c.widthPx}
            <input aria-label={c.widthPx} type="number" inputMode="numeric" min={240} max={4096} value={width} onChange={(e) => { setWidth(e.target.value); setError(null) }} className={inputCls} />
          </label>
          <label className="text-xs text-[#aeb0c3]">{c.heightPx}
            <input aria-label={c.heightPx} type="number" inputMode="numeric" min={240} max={4096} value={height} onChange={(e) => { setHeight(e.target.value); setError(null) }} className={inputCls} />
          </label>
        </div>
        <fieldset className="mt-5 space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#aeb0c3]">{c.adjustLegend}</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 p-3 text-xs">
            <input type="radio" name="moklu-resize-mode" value="center" checked={mode === 'center'} onChange={() => setMode('center')} />
            <span><strong className="block text-white">{c.keepCenterTitle}</strong><span className="mt-1 block text-[#aeb0c3]">{c.keepCenterDesc}</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 p-3 text-xs">
            <input type="radio" name="moklu-resize-mode" value="fit" checked={mode === 'fit'} onChange={() => setMode('fit')} />
            <span><strong className="block text-white">{c.scaleFitTitle}</strong><span className="mt-1 block text-[#aeb0c3]">{c.scaleFitDesc}</span></span>
          </label>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm">{t.common.cancel}</button>
          <button type="button" onClick={resize} disabled={!group} className="rounded-lg bg-[#8276e8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{c.applySize}</button>
        </div>
      </section>
    </div>
  )
}
