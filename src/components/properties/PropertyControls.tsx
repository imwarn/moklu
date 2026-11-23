/**
 * [INPUT]: depends on react, FillValue/GradientStop/LinearGradient/RadialGradient from @/types, useEditorStore, useBrandColors, brandColors utils, fillToCss, SegmentedControl, colorUtils, and useStudioLocale from @/i18n
 * [OUTPUT]: exports ColorField, GradientEditor, GradientEditorProps, FillControl, and SliderField with localized Solid/Linear/Radial/Stops/Presets/Brand labels
 * [POS]: core reusable property form controls inside src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import type { FillValue, GradientStop, LinearGradient, RadialGradient } from '@/types'
import { useEditorStore } from '@/store'
import { useBrandColors } from '@/hooks/useBrandColors'
import { isBrandToken, parseBrandToken, resolveBrandColor, toBrandToken } from '@/utils/brandColors'
import { fillToCss } from '@/utils/gradients'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useStudioLocale } from '@/i18n'
import {
  GRADIENT_PRESETS,
  SOLID_PRESETS,
  clamp,
  colorAtOffset,
  createLinearGradient,
  createRadialGradient,
  ensureEndStops,
  isEndStop,
  normalizeHexColor,
  setStopOffset,
  updateStopColor,
} from './colorUtils'

const inputCls =
  'bg-[#0f0f13] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-sm text-[#e8e8f0] w-full focus:outline-none focus:border-[rgba(124,110,246,0.5)]'
const labelCls = 'text-[11px] text-[#6b6b7a] mb-1 block uppercase tracking-[0.08em]'
const rowCls = 'flex gap-2 mb-3'
const fieldCls = 'flex-1 min-w-0'

export function ColorField({
  value,
  onChange,
  placeholder = '#FFFFFF',
  onInteractionStart,
  onInteractionEnd,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}) {
  const { t } = useStudioLocale()
  const brandColors = useBrandColors()
  const resolvedValue = resolveBrandColor(value, brandColors)
  const safeValue = normalizeHexColor(resolvedValue)
  const activeBrand = isBrandToken(value) ? brandColors.find((c) => c.id === (parseBrandToken(value) ?? '')) : undefined
  const activeRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const beginInteraction = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!activeRef.current) {
      activeRef.current = true
      onInteractionStart?.()
    }
  }

  const scheduleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      activeRef.current = false
      onInteractionEnd?.()
    }, 600)
  }

  return (
    <div>
      {/* Brand colors row — always visible */}
      <div className="flex flex-wrap gap-1.5 mb-2 items-center">
        {brandColors.map((bc) => (
          <button
            key={bc.id}
            type="button"
            title={bc.name}
            onClick={() => onChange(toBrandToken(bc.id))}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              activeBrand?.id === bc.id
                ? 'border-[#7c6ef6] scale-110'
                : 'border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.5)]'
            }`}
            style={{ background: bc.value }}
          />
        ))}
        {activeBrand && (
          <button
            type="button"
            title={t.properties.clearBrandBinding}
            onClick={() => onChange(safeValue)}
            className="text-[10px] px-1.5 py-0.5 rounded border border-[rgba(124,110,246,0.4)] text-[#9d90f8] hover:text-white hover:border-[#7c6ef6] transition-colors"
          >
            ✕ {activeBrand.name}
          </button>
        )}
        <AddBrandColorButton currentColor={safeValue} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeValue}
          onPointerDown={beginInteraction}
          onChange={(e) => {
            beginInteraction()
            onChange(e.target.value)
            scheduleEnd()
          }}
          className="h-8 w-8 rounded-md cursor-pointer border border-[rgba(255,255,255,0.1)] bg-transparent"
        />
        <input
          type="text"
          value={activeBrand ? safeValue : value}
          onFocus={beginInteraction}
          onBlur={scheduleEnd}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} flex-1`}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export interface GradientEditorProps {
  fill: FillValue
  onChange: (f: FillValue) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

function AddBrandColorButton({ currentColor }: { currentColor: string }) {
  const { t } = useStudioLocale()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const addBrandColor = useEditorStore((s) => s.addBrandColor)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  if (!adding) {
    return (
      <button
        type="button"
        title={t.properties.addBrand}
        onClick={() => { setAdding(true); setName('') }}
        className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-[rgba(255,255,255,0.2)] text-[#6b6b7a] hover:text-[#e8e8f0] hover:border-[rgba(255,255,255,0.4)] transition-colors"
      >
        {t.properties.addBrand}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            addBrandColor(name.trim(), currentColor)
            setAdding(false)
          }
          if (e.key === 'Escape') setAdding(false)
          e.stopPropagation()
        }}
        placeholder={t.properties.namePlaceholder}
        className="w-20 rounded border border-[rgba(124,110,246,0.5)] bg-[#0f0f13] px-1.5 py-0.5 text-[10px] text-[#e8e8f0] outline-none"
      />
      <button
        type="button"
        onClick={() => { if (name.trim()) { addBrandColor(name.trim(), currentColor); setAdding(false) } }}
        disabled={!name.trim()}
        className="text-[10px] px-1.5 py-0.5 rounded bg-[#7c6ef6] text-white disabled:opacity-40"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={() => setAdding(false)}
        className="text-[10px] text-[#6b6b7a] hover:text-[#e8e8f0]"
      >
        ✕
      </button>
    </div>
  )
}

export function GradientEditor({ fill, onChange, onInteractionStart = () => {}, onInteractionEnd = () => {} }: GradientEditorProps) {
  const { t } = useStudioLocale()
  const brandColors = useBrandColors()
  const savedGradients = useEditorStore((s) => s.project.savedGradients) ?? []
  const updateProject = useEditorStore((s) => s.updateProject)
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const mode: 'solid' | 'linear' | 'radial' =
    typeof fill === 'string' ? 'solid' : fill.type === 'radial' ? 'radial' : 'linear'
  const gradient = typeof fill === 'string' ? null : fill

  const stops = gradient ? ensureEndStops(gradient.stops) : []
  const safeSelectedIndex = clamp(selectedStopIndex, 0, Math.max(stops.length - 1, 0))
  const selectedStop = stops[safeSelectedIndex]

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedStopIndex((cur) => clamp(cur, 0, Math.max(stops.length - 1, 0)))
  }, [mode, stops.length])

  const commitGradient = (next: LinearGradient | RadialGradient, nextIdx = safeSelectedIndex) => {
    onChange({ ...next, stops: ensureEndStops(next.stops) })
    setSelectedStopIndex(nextIdx)
  }

  const switchMode = (nextMode: 'solid' | 'linear' | 'radial') => {
    if (nextMode === 'solid') {
      // Preserve brand tokens; only normalize plain hex strings
      const stopColor = typeof fill === 'string' ? fill : fill.stops[0]?.color ?? '#FFFFFF'
      onChange(isBrandToken(stopColor) ? stopColor : normalizeHexColor(stopColor))
      return
    }
    if (typeof fill === 'string') {
      onChange(nextMode === 'linear' ? createLinearGradient(fill) : createRadialGradient(fill))
      setSelectedStopIndex(0)
      return
    }
    if (fill.type === nextMode) return
    onChange(
      nextMode === 'linear'
        ? { type: 'linear', angle: 135, stops: ensureEndStops(fill.stops) }
        : { type: 'radial', cx: 0.5, cy: 0.5, radius: 1, stops: ensureEndStops(fill.stops) },
    )
    setSelectedStopIndex(0)
  }

  const addStop = () => {
    if (!gradient) return
    const offset = 0.5
    const newStop: GradientStop = { offset, color: colorAtOffset(stops, offset) }
    const nextStops = ensureEndStops([...stops, newStop])
    const newIdx = nextStops.findIndex((s) => s === newStop || (s.offset === offset && s.color === newStop.color))
    commitGradient({ ...gradient, stops: nextStops }, Math.max(0, newIdx))
  }

  const deleteStop = () => {
    if (!gradient) return
    const stop = stops[safeSelectedIndex]
    if (!stop || isEndStop(stop)) return
    const nextStops = stops.filter((_, i) => i !== safeSelectedIndex)
    commitGradient({ ...gradient, stops: nextStops }, clamp(safeSelectedIndex - 1, 0, nextStops.length - 1))
  }

  const handleMarkerPointerDown = (e: PointerEvent<HTMLDivElement>, index: number) => {
    const stop = stops[index]
    if (!stop || isEndStop(stop)) {
      setSelectedStopIndex(index)
      return
    }
    e.preventDefault()
    e.stopPropagation()
    containerRef.current?.setPointerCapture(e.pointerId)
    setSelectedStopIndex(index)
    draggingRef.current = index
    setIsDragging(true)
    onInteractionStart()
  }

  const handleContainerPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const di = draggingRef.current
    if (di === null || !barRef.current || !gradient) return
    const rect = barRef.current.getBoundingClientRect()
    const offset = clamp((e.clientX - rect.left) / rect.width, 0.005, 0.995)
    const result = setStopOffset(stops, di, offset)
    draggingRef.current = result.index
    commitGradient({ ...gradient, stops: result.stops }, result.index)
  }

  const handleContainerPointerUp = () => {
    if (draggingRef.current !== null) {
      draggingRef.current = null
      setIsDragging(false)
      onInteractionEnd()
    }
  }

  return (
    <div className="space-y-3">
      <SegmentedControl
        value={mode}
        options={[
          { value: 'solid', label: t.properties.solid },
          { value: 'linear', label: t.properties.linear },
          { value: 'radial', label: t.properties.radial },
        ]}
        onChange={switchMode}
        className="grid grid-cols-3 gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#121219] p-1"
        optionClassName="rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors"
        activeClassName="bg-[#7c6ef6] text-white shadow-[0_8px_24px_rgba(124,110,246,0.35)]"
        inactiveClassName="text-[#6b6b7a] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e8e8f0]"
      />

      {/* ── Swatches tray (all modes) ── */}
      {(() => {
        const savedSolids = savedGradients.filter((g): g is string => typeof g === 'string')
        const hasBrand = brandColors.length > 0
        const hasSaved = savedSolids.length > 0
        if (!hasBrand && !hasSaved) return null
        return (
          <div className="space-y-1.5">
            {hasBrand && (
              <div>
                <span className={labelCls}>{t.properties.brand}</span>
                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                  {brandColors.map((bc) => {
                    const isActive = typeof fill === 'string' && isBrandToken(fill) && parseBrandToken(fill) === bc.id
                    return (
                      <button
                        key={bc.id}
                        type="button"
                        title={bc.name}
                        onClick={() => onChange(toBrandToken(bc.id))}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          isActive ? 'border-[#7c6ef6] scale-110' : 'border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.5)]'
                        }`}
                        style={{ background: resolveBrandColor(bc.value, brandColors) }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            {hasSaved && (
              <div>
                <span className={labelCls}>{t.properties.saved}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {savedSolids.map((color, i) => (
                    <div key={i} className="relative group">
                      <button
                        type="button"
                        title={color}
                        onClick={() => onChange(color)}
                        className="h-5 w-5 rounded border border-[rgba(255,255,255,0.12)] hover:border-[rgba(124,110,246,0.6)] transition-all hover:scale-105"
                        style={{ background: color }}
                      />
                      <button
                        type="button"
                        title={t.common.delete}
                        onClick={() => updateProject({ savedGradients: savedGradients.filter((g) => g !== color) })}
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.2)] text-[8px] text-[#f87171] hover:text-white leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {mode !== 'solid' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={labelCls}>{t.properties.presets}</span>
            <button
              type="button"
              title={t.properties.saveGradient}
              onClick={() => {
                if (typeof fill === 'string') return
                updateProject({ savedGradients: [...savedGradients, fill] })
              }}
              className="text-[10px] text-[#7c6ef6] hover:text-[#9d90f8] transition-colors px-1.5 py-0.5 rounded border border-[rgba(124,110,246,0.3)] hover:border-[rgba(124,110,246,0.6)]"
            >
              {t.properties.saveGradient}
            </button>
          </div>
          {/* Built-in presets */}
          <div className="flex flex-wrap gap-1">
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={p.label}
                onClick={() => onChange(p.fill)}
                className="h-5 w-9 rounded border border-[rgba(255,255,255,0.12)] hover:border-[rgba(124,110,246,0.6)] transition-all hover:scale-105"
                style={{ background: fillToCss(p.fill) }}
              />
            ))}
          </div>
          {/* Saved gradients (non-string only — strings live in Swatches tray) */}
          {savedGradients.filter((g) => typeof g !== 'string').length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-[#4a4a5a] uppercase tracking-wider">{t.common.custom}</span>
            </div>
          )}
          {savedGradients.filter((g) => typeof g !== 'string').length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {savedGradients.filter((g) => typeof g !== 'string').map((g, i) => (
                <div key={i} className="relative group">
                  <button
                    type="button"
                    title={t.properties.saved}
                    onClick={() => onChange(g)}
                    className="h-5 w-9 rounded border border-[rgba(255,255,255,0.12)] hover:border-[rgba(124,110,246,0.6)] transition-all hover:scale-105"
                    style={{ background: fillToCss(g) }}
                  />
                  <button
                    type="button"
                    title={t.common.delete}
                    onClick={() => updateProject({ savedGradients: savedGradients.filter((sg) => sg !== g) })}
                    className="absolute -top-1 -right-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.2)] text-[8px] text-[#f87171] hover:text-white leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'solid' && (
        <div>
          <span className={labelCls}>{t.properties.presets}</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {SOLID_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={p.label}
                onClick={() => onChange(p.color)}
                className="h-5 w-5 rounded border border-[rgba(255,255,255,0.12)] hover:border-[rgba(124,110,246,0.6)] transition-all hover:scale-105"
                style={{ background: p.color }}
              />
            ))}
          </div>
        </div>
      )}

      {mode === 'solid' ? (
        <>
          <ColorField
            value={typeof fill === 'string' ? fill : fill.stops[0]?.color ?? '#FFFFFF'}
            onChange={(v) => onChange(v)}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
          />
          {typeof fill === 'string' && !isBrandToken(fill) && (
            <button
              type="button"
              onClick={() => {
                if (savedGradients.includes(fill)) return
                updateProject({ savedGradients: [...savedGradients, fill] })
              }}
              className="text-[10px] text-[#7c6ef6] hover:text-[#9d90f8] transition-colors px-1.5 py-0.5 rounded border border-[rgba(124,110,246,0.3)] hover:border-[rgba(124,110,246,0.6)]"
            >
              {t.properties.saveColor}
            </button>
          )}
        </>
      ) : gradient && selectedStop ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6b6b7a] uppercase tracking-[0.08em]">{t.properties.position}</span>
            <button
              type="button"
              onClick={addStop}
              className="text-[11px] text-[#7c6ef6] hover:text-[#9d90f8] transition-colors px-1.5 py-0.5 rounded border border-[rgba(124,110,246,0.3)] hover:border-[rgba(124,110,246,0.6)]"
            >
              {t.properties.addStop}
            </button>
          </div>

          <div
            ref={containerRef}
            className="relative select-none"
            style={{ height: 32, cursor: isDragging ? 'grabbing' : 'default' }}
            onPointerMove={handleContainerPointerMove}
            onPointerUp={handleContainerPointerUp}
            onPointerCancel={handleContainerPointerUp}
          >
            {stops.map((stop, index) => {
              const isSelected = index === safeSelectedIndex
              const fixed = isEndStop(stop)
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    // Inset 7px each side (half of 14px marker width) so end markers
                    // stay fully within the container and aren't clipped by parent overflow.
                    left: `calc(7px + ${stop.offset} * (100% - 14px))`,
                    transform: 'translateX(-50%)',
                    width: 14,
                    height: 10,
                    clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                    // Always show the actual stop color — selection is communicated
                    // via drop-shadow only, never by overriding the fill color.
                    background: normalizeHexColor(resolveBrandColor(stop.color, brandColors)),
                    // drop-shadow follows clip-path shape, so it acts as a border.
                    // Unselected: dark outline so the triangle is visible on any bg.
                    // Selected:   white ring + purple glow without touching the fill.
                    filter: isSelected
                      ? 'drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 5px rgba(124,110,246,1))'
                      : 'drop-shadow(0 0 1.5px rgba(0,0,0,0.95)) drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
                    cursor: fixed ? 'pointer' : isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    zIndex: isSelected ? 3 : fixed ? 2 : 1,
                  }}
                  onPointerDown={(e) => handleMarkerPointerDown(e, index)}
                />
              )
            })}

            {/* Bar is inset 7px each side to match marker range — barRef drives offset calculation */}
            <div
              ref={barRef}
              className="absolute bottom-0 h-4 rounded-full border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              style={{ left: 7, right: 7, background: fillToCss({
                ...gradient,
                stops: gradient.stops.map((s) => ({ ...s, color: resolveBrandColor(s.color, brandColors) })),
              }) }}
            />
          </div>

          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101017] p-3 space-y-3">
            <div>
              <label className={labelCls}>{t.properties.color}</label>
              <ColorField
                value={selectedStop.color}
                onChange={(value) => {
                  const result = updateStopColor(stops, safeSelectedIndex, value)
                  commitGradient({ ...gradient, stops: result.stops }, result.index)
                }}
                onInteractionStart={onInteractionStart}
                onInteractionEnd={onInteractionEnd}
              />
            </div>

            {!isEndStop(selectedStop) && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={labelCls + ' !mb-0'}>{t.properties.position}</label>
                  <span className="text-xs text-[#e8e8f0]">{Math.round(selectedStop.offset * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={Math.round(selectedStop.offset * 100)}
                  onChange={(e) => {
                    const result = setStopOffset(stops, safeSelectedIndex, Number(e.target.value) / 100)
                    commitGradient({ ...gradient, stops: result.stops }, result.index)
                  }}
                  onMouseDown={onInteractionStart}
                  onMouseUp={onInteractionEnd}
                  className="w-full accent-[#7c6ef6]"
                />
              </div>
            )}

            {!isEndStop(selectedStop) && (
              <button
                type="button"
                onClick={deleteStop}
                className="text-xs text-[#f0b4b4] hover:text-[#ffd0d0] transition-colors"
              >
                {t.properties.deleteStop}
              </button>
            )}

            {isEndStop(selectedStop) && (
              <p className="text-[10px] text-[#525261]">{t.properties.fixedStopHint}</p>
            )}
          </div>

          {gradient.type === 'linear' && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={labelCls + ' !mb-0'}>{t.properties.angle}</label>
                <span className="text-xs text-[#e8e8f0]">{Math.round(gradient.angle)}°</span>
              </div>
              <input
                type="range" min={0} max={360} value={gradient.angle}
                onChange={(e) => commitGradient({ ...gradient, angle: Number(e.target.value) })}
                onMouseDown={onInteractionStart} onMouseUp={onInteractionEnd}
                className="w-full accent-[#7c6ef6]"
              />
            </div>
          )}

          {gradient.type === 'radial' && (
            <div className="space-y-3">
              <div className={rowCls}>
                <div className={fieldCls}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className={labelCls + ' !mb-0'}>{t.properties.centerX}</label>
                    <span className="text-xs text-[#e8e8f0]">{Math.round(gradient.cx * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={Math.round(gradient.cx * 100)}
                    onChange={(e) => commitGradient({ ...gradient, cx: Number(e.target.value) / 100 })}
                    onMouseDown={onInteractionStart} onMouseUp={onInteractionEnd}
                    className="w-full accent-[#7c6ef6]" />
                </div>
                <div className={fieldCls}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className={labelCls + ' !mb-0'}>{t.properties.centerY}</label>
                    <span className="text-xs text-[#e8e8f0]">{Math.round(gradient.cy * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={Math.round(gradient.cy * 100)}
                    onChange={(e) => commitGradient({ ...gradient, cy: Number(e.target.value) / 100 })}
                    onMouseDown={onInteractionStart} onMouseUp={onInteractionEnd}
                    className="w-full accent-[#7c6ef6]" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={labelCls + ' !mb-0'}>{t.properties.radius}</label>
                  <span className="text-xs text-[#e8e8f0]">{Math.round(gradient.radius * 100)}%</span>
                </div>
                <input type="range" min={0} max={200} value={Math.round(gradient.radius * 100)}
                  onChange={(e) => commitGradient({ ...gradient, radius: Number(e.target.value) / 100 })}
                  onMouseDown={onInteractionStart} onMouseUp={onInteractionEnd}
                  className="w-full accent-[#7c6ef6]" />
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export function FillControl(props: GradientEditorProps) {
  return <GradientEditor {...props} />
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onInteractionStart,
  onInteractionEnd,
  formatDisplay,
  className = '',
  labelAddon,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  formatDisplay?: (v: number) => string
  className?: string
  labelAddon?: ReactNode
}) {
  const display = formatDisplay
    ? formatDisplay(value)
    : step >= 1
      ? String(Math.round(value))
      : value.toFixed(2)

  return (
    <div className={`mb-3 ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center">
          <label className="text-[11px] text-[#6b6b7a] uppercase tracking-[0.08em]">{label}</label>
          {labelAddon}
        </div>
        <span className="text-xs text-[#e8e8f0]">{display}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamp(value, min, max)}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={onInteractionStart}
          onMouseUp={onInteractionEnd}
          className="flex-1 min-w-0 accent-[#7c6ef6]"
        />
        <input
          type="number"
          value={step >= 1 ? Math.round(value) : value}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
          className="w-14 shrink-0 bg-[#0f0f13] border border-[rgba(255,255,255,0.1)] rounded px-1.5 py-1 text-xs text-[#e8e8f0] text-right focus:outline-none focus:border-[rgba(124,110,246,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}
