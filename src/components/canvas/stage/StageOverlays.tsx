/**
 * [INPUT]: depends on getPanoSlideX from @/utils/panoGeometry, SlideGroup type, AssetDropHighlight, STUDIO_COLORS from @/components/ui/studioTokens, CANVAS_BACKDROP_PRESETS/CanvasBackdropTone from ./backdropPresets, and useStudioLocale from @/i18n
 * [OUTPUT]: exports BackdropSwitcher, CanvasShadow, SeamGuides, and StageChrome canvas overlay components with AA contrast, non-destructive backdrop switcher, and accessible zoom/Fit/group-edit controls
 * [POS]: viewport chrome overlays rendered over StageCanvas and shared backdrop pill used by PreviewModal inside src/components/canvas/stage
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { getPanoSlideX } from '@/utils/panoGeometry'
import type { SlideGroup } from '@/types'
import { STUDIO_COLORS } from '@/components/ui/studioTokens'
import type { AssetDropHighlight } from './useAssetDropTarget'
import { CANVAS_BACKDROP_PRESETS, type CanvasBackdropTone } from './backdropPresets'
import { useStudioLocale } from '@/i18n'

export function BackdropSwitcher({
  value,
  onChange,
  testIdPrefix = 'canvas-backdrop',
  variant = 'inline',
}: {
  value: CanvasBackdropTone
  onChange: (tone: CanvasBackdropTone) => void
  testIdPrefix?: string
  variant?: 'inline' | 'pill'
}) {
  const { t } = useStudioLocale()
  const options: Array<{ id: CanvasBackdropTone; label: string }> = [
    { id: 'dark', label: t.slides.backdropDark },
    { id: 'gray', label: t.slides.backdropGray },
    { id: 'light', label: t.slides.backdropLight },
  ]
  return (
    <div
      role="radiogroup"
      aria-label={t.slides.backdropLabel}
      data-testid={`${testIdPrefix}-switcher`}
      className={variant === 'pill' ? 'flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5' : undefined}
      style={variant === 'inline' ? { display: 'flex', alignItems: 'center', gap: 5, padding: '0 2px' } : undefined}
    >
      {variant === 'pill' && (
        <span className="mr-0.5 hidden text-[11px] text-muted sm:inline">{t.slides.backdropLabel}</span>
      )}
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${t.slides.backdropLabel}: ${opt.label}`}
            title={`${t.slides.backdropLabel}: ${opt.label}`}
            data-testid={`${testIdPrefix}-${opt.id}`}
            onClick={(e) => {
              e.stopPropagation()
              onChange(opt.id)
            }}
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              padding: 0,
              cursor: 'pointer',
              background: CANVAS_BACKDROP_PRESETS[opt.id].swatch,
              border: active ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.32)',
              boxShadow: active ? '0 0 0 1px rgba(0,0,0,0.5)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

interface StageOverlaysProps {
  group: SlideGroup
  showSeamGuides: boolean
  panoCompensate: boolean
  visualGapPx: number
  effectiveCompensationPx: number
  totalHeight: number
  displayWidth: number
  displayHeight: number
  zoom: number
  viewportX: number
  viewportY: number
  editingGroupId: string | null
  exitGroupEdit: () => void
  setZoom: (zoom: number) => void
  zoomInput: string | null
  setZoomInput: (value: string | null) => void
  handleFit: () => void
  assetDropHighlight: AssetDropHighlight | null
  spaceDown: boolean
  backdropTone?: CanvasBackdropTone
  onChangeBackdrop?: (tone: CanvasBackdropTone) => void
}

export function CanvasShadow({
  group,
  viewportX,
  viewportY,
  displayWidth,
  displayHeight,
  backdropTone = 'dark',
}: Pick<StageOverlaysProps, 'group' | 'viewportX' | 'viewportY' | 'displayWidth' | 'displayHeight' | 'backdropTone'>) {
  const preset = CANVAS_BACKDROP_PRESETS[backdropTone]
  return group.numSlides === 1
    ? <div style={{ position: 'absolute', left: viewportX, top: viewportY, width: displayWidth, height: displayHeight, borderRadius: 10, boxShadow: preset.cardShadow, pointerEvents: 'none', zIndex: 1 }} />
    : null
}

export function SeamGuides({
  group,
  showSeamGuides,
  panoCompensate,
  visualGapPx,
  effectiveCompensationPx,
  totalHeight,
  zoom,
  viewportX,
  viewportY,
  backdropTone = 'dark',
}: Pick<StageOverlaysProps, 'group' | 'showSeamGuides' | 'panoCompensate' | 'visualGapPx' | 'effectiveCompensationPx' | 'totalHeight' | 'zoom' | 'viewportX' | 'viewportY' | 'backdropTone'>) {
  if (!showSeamGuides || group.numSlides <= 1) return null
  const preset = CANVAS_BACKDROP_PRESETS[backdropTone]
  return <>{Array.from({ length: group.numSlides - 1 }, (_, i) => {
    const screenH = Math.round(totalHeight * zoom)
    if (panoCompensate && visualGapPx > 0) {
      const seamX = getPanoSlideX(group, i + 1, effectiveCompensationPx)
      const bandScreenX = Math.round(viewportX + (seamX - visualGapPx) * zoom)
      const bandW = Math.max(2, Math.round(visualGapPx * zoom))
      return <div key={`seam-${i}`} style={{ position: 'absolute', left: bandScreenX, top: Math.round(viewportY), width: bandW, height: screenH, background: backdropTone === 'light' ? 'rgba(244,244,245,0.88)' : 'rgba(20,20,23,0.86)', borderLeft: '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)', borderRight: '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)', pointerEvents: 'none', zIndex: 6 }} />
    }
    const seamX = getPanoSlideX(group, i + 1, 0)
    const screenX = Math.round(viewportX + seamX * zoom)
    return <div key={`seam-${i}`} style={{ position: 'absolute', left: screenX - 1, top: Math.round(viewportY), width: 2, height: screenH, background: preset.seamLine, pointerEvents: 'none', zIndex: 6 }} />
  })}</>
}

export function StageChrome({
  group,
  effectiveCompensationPx,
  displayHeight,
  zoom,
  viewportX,
  viewportY,
  editingGroupId,
  exitGroupEdit,
  setZoom,
  zoomInput,
  setZoomInput,
  handleFit,
  assetDropHighlight,
  spaceDown,
  backdropTone = 'dark',
  onChangeBackdrop,
}: Pick<StageOverlaysProps, 'group' | 'effectiveCompensationPx' | 'displayHeight' | 'zoom' | 'viewportX' | 'viewportY' | 'editingGroupId' | 'exitGroupEdit' | 'setZoom' | 'zoomInput' | 'setZoomInput' | 'handleFit' | 'assetDropHighlight' | 'spaceDown' | 'backdropTone' | 'onChangeBackdrop'>) {
  const { t } = useStudioLocale()
  const preset = CANVAS_BACKDROP_PRESETS[backdropTone]
  return <>
    {group.numSlides > 1 && Array.from({ length: group.numSlides }, (_, i) => {
      const slideScreenW = Math.round(group.slideWidth * zoom)
      const slideScreenX = Math.round(viewportX + getPanoSlideX(group, i, effectiveCompensationPx) * zoom)
      const isFirst = i === 0
      const isLast = i === group.numSlides - 1
      const R = 10
      return <div key={`card-frame-${i}`} style={{ position: 'absolute', left: slideScreenX, top: Math.round(viewportY), width: slideScreenW, height: Math.round(displayHeight), borderTopLeftRadius: isFirst ? R : 0, borderBottomLeftRadius: isFirst ? R : 0, borderTopRightRadius: isLast ? R : 0, borderBottomRightRadius: isLast ? R : 0, boxShadow: preset.cardShadow, pointerEvents: 'none', zIndex: 5 }} />
    })}
    {editingGroupId && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-accent-strong)', borderRadius: 8, padding: '6px 14px', zIndex: 100, pointerEvents: 'all', boxShadow: '0 4px 20px color-mix(in srgb, var(--color-accent-strong) 40%, transparent)' }}>
      <span style={{ color: 'var(--color-accent-fg)', fontSize: 12, fontWeight: 600 }}>{t.slides.editingGroup}</span>
      <button type="button" onClick={(e) => { e.stopPropagation(); exitGroupEdit() }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, color: 'var(--color-accent-fg)', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>{t.common.exit}</button>
    </div>}
    <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(20,20,23,0.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 8px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.28)', zIndex: 100, pointerEvents: 'all' }}>
      {onChangeBackdrop && (
        <>
          <BackdropSwitcher value={backdropTone} onChange={onChangeBackdrop} testIdPrefix="canvas-backdrop" variant="inline" />
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />
        </>
      )}
      <button type="button" aria-label={t.slides.zoomOut} onClick={(e) => { e.stopPropagation(); setZoom(Math.max(0.05, zoom - 0.02)) }} title={t.slides.zoomOut} style={{ background: 'none', border: 'none', color: STUDIO_COLORS.textPrimary, cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}><span aria-hidden="true">−</span></button>
      <input type="text" aria-label={t.slides.zoomLevelTitle} value={zoomInput ?? `${Math.round(zoom * 100)}`} onChange={(e) => setZoomInput(e.target.value)} onFocus={(e) => { setZoomInput(`${Math.round(zoom * 100)}`); e.target.select() }} onBlur={() => { const parsed = parseInt(zoomInput ?? '', 10); if (!isNaN(parsed) && parsed > 0) setZoom(Math.max(0.05, Math.min(4, parsed / 100))); setZoomInput(null) }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setZoomInput(null); (e.target as HTMLInputElement).blur() }; e.stopPropagation() }} onClick={(e) => e.stopPropagation()} title={t.slides.zoomLevelTitle} style={{ background: 'none', border: 'none', color: STUDIO_COLORS.textMuted, fontSize: 11, width: 36, textAlign: 'center', cursor: 'text', outline: 'none', padding: 0 }} />
      <span style={{ color: STUDIO_COLORS.textMuted, fontSize: 11, marginLeft: -2 }} aria-hidden="true">%</span>
      <button type="button" aria-label={t.slides.zoomIn} onClick={(e) => { e.stopPropagation(); setZoom(Math.min(4, zoom + 0.02)) }} title={t.slides.zoomIn} style={{ background: 'none', border: 'none', color: STUDIO_COLORS.textPrimary, cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}><span aria-hidden="true">＋</span></button>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />
      <button type="button" aria-label={t.slides.fitTitle} onClick={(e) => { e.stopPropagation(); handleFit() }} title={t.slides.fitTitle} style={{ background: 'none', border: 'none', color: STUDIO_COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: '0 4px', lineHeight: 1 }}>{t.slides.fit}</button>
    </div>
    {assetDropHighlight && <div style={{ position: 'absolute', left: assetDropHighlight.x, top: assetDropHighlight.y, width: assetDropHighlight.w, height: assetDropHighlight.h, borderRadius: 10, border: `2px solid ${assetDropHighlight.mode === 'replace' ? 'var(--color-accent)' : '#38bdf8'}`, background: assetDropHighlight.mode === 'replace' ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'rgba(56,189,248,0.10)', boxShadow: assetDropHighlight.mode === 'replace' ? '0 0 0 1px color-mix(in srgb, var(--color-accent) 22%, transparent), 0 0 32px color-mix(in srgb, var(--color-accent) 28%, transparent)' : '0 0 0 1px rgba(56,189,248,0.18), 0 0 28px rgba(56,189,248,0.22)', pointerEvents: 'none', zIndex: 90 }}>
      <div style={{ position: 'absolute', left: 8, top: -28, borderRadius: 999, padding: '4px 9px', background: assetDropHighlight.mode === 'replace' ? 'var(--color-accent-strong)' : 'rgba(14,116,144,0.94)', color: 'var(--color-accent-fg)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 10px 24px rgba(0,0,0,0.35)' }}>{assetDropHighlight.label}</div>
    </div>}
    {spaceDown && <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,23,0.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 12px', border: '1px solid rgba(255,255,255,0.12)', color: STUDIO_COLORS.textMuted, fontSize: 11, zIndex: 100, pointerEvents: 'none' }}>{t.slides.panModeHint}</div>}
    {group.numSlides > 1 && Array.from({ length: group.numSlides }, (_, i) => <div key={i} style={{ position: 'absolute', top: Math.round(viewportY + displayHeight) + 8, left: Math.round(viewportX + (getPanoSlideX(group, i, effectiveCompensationPx) + group.slideWidth / 2) * zoom) - 20, color: preset.slideLabelColor, fontSize: 10, fontWeight: 600, pointerEvents: 'none', zIndex: 5 }}>{group.slideNames[i] ?? `slide ${i + 1}`}</div>)}
  </>
}
