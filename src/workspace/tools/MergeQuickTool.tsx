/**
 * [INPUT]: depends on react, @dnd-kit/core, @dnd-kit/sortable, SortableMergeThumb from ./SortableMergeThumb, canvasUtils from ../canvasUtils, deserializeDraftImages from ../draftStorage, buildMergeStudioHandoff from ../mergeHandoff, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, useToolDraft from ../useToolDraft, and workspace types from ../types
 * [OUTPUT]: exports MergeQuickTool component for horizontal, vertical (with optional smart long-screenshot overlap removal), and 2..6-col grid multi-image stitching with drag-and-drop reordering, 90deg per-item rotation, borders, clipboard copy, PDF export, local IndexedDB draft auto-save, and multi-layer Studio handoff
 * [POS]: merge and collage tool panel inside src/workspace/tools; delegates canvas composition to injected engines.merge and multi-layer Studio handoff to buildMergeStudioHandoff
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  copyImageToClipboard,
  createDemoImageInput,
  formatBytes,
  readFileAsImageInput,
  triggerBlobDownload,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { getWorkspaceStrings } from '../i18n'
import { buildMergeStudioHandoff } from '../mergeHandoff'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceImageInput,
  WorkspaceMergeAlign,
  WorkspaceMergeFormat,
  WorkspaceMergeOptions,
  WorkspaceMergeOutput,
  WorkspaceMergeRotation,
  WorkspaceToolPanelProps,
} from '../types'
import {
  ColorSwatchRow,
  DraftStatusBar,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'
import { useToolDraft } from '../useToolDraft'
import { SortableMergeThumb } from './SortableMergeThumb'

interface MergeDraftSettings {
  direction: WorkspaceMergeOptions['direction']
  normalize: WorkspaceMergeOptions['normalize']
  align: WorkspaceMergeAlign
  columns: number
  aspectCell: WorkspaceMergeOptions['aspectCell']
  fit: WorkspaceMergeOptions['fit']
  gap: number
  padding: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  background: string
  format: WorkspaceMergeFormat
  qualityPercent: number
  removeOverlap: boolean
}

function nextQuarterTurn(current?: WorkspaceMergeRotation): WorkspaceMergeRotation {
  switch (current ?? 0) {
    case 0: return 90
    case 90: return 180
    case 180: return 270
    case 270: return 0
  }
}

export function MergeQuickTool({
  preset,
  locale,
  theme,
  engines,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const bgSwatches = useMemo(
    () => [
      { label: s.swatches.white, value: '#ffffff' },
      { label: s.swatches.softGray, value: '#f1f5f9' },
      { label: s.swatches.slateDark, value: '#0f172a' },
      { label: s.swatches.aurora, value: 'linear-gradient(135deg, #b5b0f2, #e5efff)' },
      { label: s.swatches.sunset, value: 'linear-gradient(135deg, #f97316, #f43f5e)' },
      { label: s.swatches.transparent, value: 'transparent' },
    ],
    [s.swatches],
  )

  const borderSwatches = useMemo(
    () => [
      { label: s.swatches.white, value: '#ffffff' },
      { label: s.swatches.softGray, value: '#e4e4e7' },
      { label: s.swatches.slateDark, value: '#0f172a' },
      { label: s.swatches.sunset, value: '#f97316' },
    ],
    [s.swatches],
  )

  const [images, setImages] = useState<WorkspaceImageInput[]>([])
  const [direction, setDirection] = useState<WorkspaceMergeOptions['direction']>(
    preset.mergeDirection ?? 'horizontal',
  )
  const [normalize, setNormalize] = useState<WorkspaceMergeOptions['normalize']>('match-min')
  const [align, setAlign] = useState<WorkspaceMergeAlign>('center')
  const [columns, setColumns] = useState<number>(2)
  const [aspectCell, setAspectCell] = useState<WorkspaceMergeOptions['aspectCell']>('1:1')
  const [fit, setFit] = useState<WorkspaceMergeOptions['fit']>('cover')
  const [gap, setGap] = useState<number>(16)
  const [padding, setPadding] = useState<number>(24)
  const [borderRadius, setBorderRadius] = useState<number>(12)
  const [borderWidth, setBorderWidth] = useState<number>(0)
  const [borderColor, setBorderColor] = useState<string>('#ffffff')
  const [background, setBackground] = useState<string>('#ffffff')
  const [format, setFormat] = useState<WorkspaceMergeFormat>(
    preset.mergeFormat ?? preset.targetFormat ?? 'image/png',
  )
  const [qualityPercent, setQualityPercent] = useState<number>(92)
  const [removeOverlap, setRemoveOverlap] = useState<boolean>(false)
  const [result, setResult] = useState<WorkspaceMergeOutput | null>(null)
  const [rendering, setRendering] = useState(false)
  const [handingOff, setHandingOff] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copyTimerRef = useRef<number | null>(null)

  const draftSettings = useMemo<MergeDraftSettings>(
    () => ({
      direction,
      normalize,
      align,
      columns,
      aspectCell,
      fit,
      gap,
      padding,
      borderRadius,
      borderWidth,
      borderColor,
      background,
      format,
      qualityPercent,
      removeOverlap,
    }),
    [
      direction,
      normalize,
      align,
      columns,
      aspectCell,
      fit,
      gap,
      padding,
      borderRadius,
      borderWidth,
      borderColor,
      background,
      format,
      qualityPercent,
      removeOverlap,
    ],
  )

  const handleRestoreDraft = useCallback((draft: WorkspaceToolDraft<MergeDraftSettings>) => {
    const restoredImages = deserializeDraftImages(draft.images)
    if (restoredImages.length > 0) {
      setImages(restoredImages)
    }
    const cfg = draft.settings
    if (cfg.direction === 'horizontal' || cfg.direction === 'vertical' || cfg.direction === 'grid') {
      setDirection(cfg.direction)
    }
    if (cfg.normalize === 'match-min' || cfg.normalize === 'match-max' || cfg.normalize === 'original') {
      setNormalize(cfg.normalize)
    }
    if (cfg.align === 'start' || cfg.align === 'center' || cfg.align === 'end') {
      setAlign(cfg.align)
    }
    if (typeof cfg.columns === 'number' && Number.isFinite(cfg.columns)) {
      setColumns(Math.max(2, Math.min(6, Math.round(cfg.columns))))
    }
    if (cfg.aspectCell === 'auto' || cfg.aspectCell === '1:1' || cfg.aspectCell === '4:3' || cfg.aspectCell === '3:4') {
      setAspectCell(cfg.aspectCell)
    }
    if (cfg.fit === 'cover' || cfg.fit === 'contain') {
      setFit(cfg.fit)
    }
    if (typeof cfg.gap === 'number' && Number.isFinite(cfg.gap)) setGap(cfg.gap)
    if (typeof cfg.padding === 'number' && Number.isFinite(cfg.padding)) setPadding(cfg.padding)
    if (typeof cfg.borderRadius === 'number' && Number.isFinite(cfg.borderRadius)) setBorderRadius(cfg.borderRadius)
    if (typeof cfg.borderWidth === 'number' && Number.isFinite(cfg.borderWidth)) setBorderWidth(cfg.borderWidth)
    if (typeof cfg.borderColor === 'string' && cfg.borderColor) setBorderColor(cfg.borderColor)
    if (typeof cfg.background === 'string' && cfg.background) setBackground(cfg.background)
    if (
      cfg.format === 'image/png' ||
      cfg.format === 'image/jpeg' ||
      cfg.format === 'image/webp' ||
      cfg.format === 'application/pdf'
    ) {
      setFormat(cfg.format)
    }
    if (typeof cfg.qualityPercent === 'number' && Number.isFinite(cfg.qualityPercent)) {
      setQualityPercent(Math.max(50, Math.min(100, Math.round(cfg.qualityPercent))))
    }
    if (typeof cfg.removeOverlap === 'boolean') {
      setRemoveOverlap(cfg.removeOverlap)
    }
  }, [])

  const { hasDraft, clearDraft } = useToolDraft<MergeDraftSettings>({
    toolId: 'merge',
    images,
    settings: draftSettings,
    onRestore: handleRestoreDraft,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const debouncedColumns = useDebouncedValue(columns)
  const debouncedGap = useDebouncedValue(gap)
  const debouncedPadding = useDebouncedValue(padding)
  const debouncedBorderRadius = useDebouncedValue(borderRadius)
  const debouncedBorderWidth = useDebouncedValue(borderWidth)
  const debouncedQuality = useDebouncedValue(qualityPercent)

  const hasPendingParams =
    images.length > 0 &&
    (debouncedColumns !== columns ||
      debouncedGap !== gap ||
      debouncedPadding !== padding ||
      debouncedBorderRadius !== borderRadius ||
      debouncedBorderWidth !== borderWidth ||
      debouncedQuality !== qualityPercent)
  const isBusy = rendering || hasPendingParams

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null)
      try {
        const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
        setImages((prev) => [...prev, ...loaded])
      } catch {
        setError(s.common.decodeError)
      }
    },
    [s.common.decodeError],
  )

  const handleLoadDemo = () => {
    setError(null)
    setImages([
      createDemoImageInput('photo-1', 'slide-1.svg'),
      createDemoImageInput('photo-2', 'slide-2.svg'),
      createDemoImageInput('photo-3', 'slide-3.svg'),
    ])
  }

  const handleClearAll = () => {
    setImages([])
    setResult(null)
    setCopied(false)
    void clearDraft()
  }

  const moveImage = (index: number, delta: -1 | 1) => {
    setImages((prev) => {
      const nextIndex = index + delta
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      return arrayMove(prev, index, nextIndex)
    })
  }

  const reverseImages = () => {
    setImages((prev) => [...prev].reverse())
  }

  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: nextQuarterTurn(img.rotation) } : img,
      ),
    )
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setImages((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    const run = async () => {
      setRendering(true)
      setError(null)
      try {
        const merged = await engines.merge(images, {
          direction,
          normalize,
          align,
          columns: debouncedColumns,
          aspectCell,
          fit,
          gap: debouncedGap,
          padding: debouncedPadding,
          borderRadius: debouncedBorderRadius,
          borderWidth: debouncedBorderWidth,
          borderColor,
          background,
          format,
          quality: debouncedQuality / 100,
          removeOverlap: direction === 'vertical' ? removeOverlap : false,
        })
        if (!cancelled) setResult(merged)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : s.merge.mergeError)
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    images,
    direction,
    normalize,
    align,
    debouncedColumns,
    aspectCell,
    fit,
    debouncedGap,
    debouncedPadding,
    debouncedBorderRadius,
    debouncedBorderWidth,
    borderColor,
    background,
    format,
    debouncedQuality,
    removeOverlap,
    engines,
    s.merge.mergeError,
  ])

  const activeResult = images.length > 0 ? result : null
  const isScaledDown =
    activeResult?.scaleFactor !== undefined && activeResult.scaleFactor < 0.999
  const overlapRemovedPx =
    direction === 'vertical' && removeOverlap
      ? Math.round(activeResult?.layout?.overlapRemovedPx ?? 0)
      : 0

  const handleCopy = async () => {
    if (!activeResult) return
    setError(null)
    try {
      await copyImageToClipboard(activeResult.blob, activeResult.dataUrl)
      setCopied(true)
      if (copyTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(copyTimerRef.current)
      }
      if (typeof window !== 'undefined') {
        copyTimerRef.current = window.setTimeout(() => {
          setCopied(false)
          copyTimerRef.current = null
        }, 2000)
      }
    } catch {
      setError(s.common.copyError)
    }
  }

  const handleOpenInStudio = async () => {
    if (!activeResult || handingOff) return
    setHandingOff(true)
    try {
      const payload = await buildMergeStudioHandoff(images, activeResult, background)
      onOpenInStudio(payload)
    } finally {
      setHandingOff(false)
    }
  }

  const alignOptions =
    direction === 'horizontal'
      ? [
          { value: 'start' as const, label: s.merge.alignTop },
          { value: 'center' as const, label: s.merge.alignMiddle },
          { value: 'end' as const, label: s.merge.alignBottom },
        ]
      : [
          { value: 'start' as const, label: s.merge.alignLeft },
          { value: 'center' as const, label: s.merge.alignCenter },
          { value: 'end' as const, label: s.merge.alignRight },
        ]

  const downloadLabel = format === 'application/pdf' ? s.common.downloadPdf : s.common.downloadImage

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Reorderable Strip + Live Merged Preview */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.common.preview}
              </span>
              {activeResult && (
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                  {activeResult.width} × {activeResult.height} · {formatBytes(activeResult.sizeBytes)}
                </span>
              )}
              {overlapRemovedPx > 0 && (
                <span
                  data-testid="merge-overlap-removed-badge"
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tokens.badgePositive}`}
                >
                  {s.merge.overlapTrimmedLabel}: {overlapRemovedPx} px
                </span>
              )}
              {isScaledDown && (
                <span
                  data-testid="merge-scaled-notice"
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${tokens.badgeWarning}`}
                >
                  {s.merge.scaledNotice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
              >
                {s.merge.loadDemoSet}
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${tokens.focusRing} ${tokens.textMuted} hover:text-danger`}
                >
                  {s.common.clearAll}
                </button>
              )}
            </div>
          </div>

          <div
            aria-busy={isBusy}
            className={`relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border p-3 ${tokens.cardMuted}`}
          >
            {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.processing} />}
            {activeResult ? (
              <img
                src={activeResult.dataUrl}
                alt={s.merge.previewAlt}
                className="max-h-[340px] max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : (
              <p className={`text-xs ${tokens.textSubtle}`}>{s.common.emptyPreview}</p>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${tokens.textMuted}`}>
                    {images.length} {s.merge.itemsCount}
                  </span>
                  {images.length >= 2 && (
                    <span className={`text-[11px] ${tokens.textSubtle}`}>
                      · {s.merge.dragToReorder}
                    </span>
                  )}
                </div>
                {images.length >= 2 && (
                  <button
                    type="button"
                    data-testid="merge-reverse-order"
                    onClick={reverseImages}
                    className={`inline-flex min-h-7 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
                  >
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M3 5.5h10M10.5 3 13 5.5 10.5 8M13 10.5H3M5.5 8 3 10.5 5.5 13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{s.merge.reverseOrder}</span>
                  </button>
                )}
              </div>
              <DndContext
                id="moklu-merge-dnd"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <ul className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((item, idx) => (
                      <SortableMergeThumb
                        key={item.id}
                        item={item}
                        index={idx}
                        total={images.length}
                        tokens={tokens}
                        labels={{
                          moveLeft: s.common.moveLeft,
                          moveRight: s.common.moveRight,
                          rotate90: s.merge.rotate90,
                          remove: s.common.remove,
                        }}
                        onMove={moveImage}
                        onRotate={rotateImage}
                        onRemove={removeImage}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          )}

          <div className="mt-3">
            <DropZone
              theme={theme}
              compact
              multiple
              title={s.common.dropMultipleTitle}
              hint={s.common.dropHint}
              buttonLabel={s.merge.addMore}
              invalidFileMessage={s.common.invalidFileError}
              onFiles={handleFiles}
            />
          </div>

          {hasDraft && (
            <DraftStatusBar
              theme={theme}
              toolId="merge"
              savedLabel={s.common.draftSaved}
              clearLabel={s.common.clearDraft}
              onClear={handleClearAll}
            />
          )}
        </div>
      </div>

      {/* Right: Stitch Settings */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.merge.directionLabel}
            value={direction}
            options={[
              { value: 'horizontal', label: s.merge.horizontal },
              { value: 'vertical', label: s.merge.vertical },
              { value: 'grid', label: s.merge.grid },
            ]}
            onChange={setDirection}
          />

          {direction === 'vertical' && (
            <label
              data-testid="merge-remove-overlap-field"
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${tokens.cardMuted}`}
            >
              <input
                type="checkbox"
                data-testid="merge-remove-overlap-toggle"
                checked={removeOverlap}
                onChange={(e) => setRemoveOverlap(e.target.checked)}
                className={`mt-0.5 h-4 w-4 shrink-0 accent-accent ${tokens.focusRing}`}
              />
              <span className="flex flex-col gap-0.5">
                <span className={`text-xs font-semibold ${tokens.text}`}>
                  {s.merge.removeOverlapLabel}
                </span>
                <span className={`text-[11px] leading-snug ${tokens.textSubtle}`}>
                  {s.merge.removeOverlapHint}
                </span>
              </span>
            </label>
          )}

          {direction !== 'grid' ? (
            <div className="space-y-3">
              <SegmentedControl
                theme={theme}
                label={s.merge.normalizeLabel}
                value={normalize}
                options={[
                  { value: 'match-min', label: s.merge.matchMin },
                  { value: 'match-max', label: s.merge.matchMax },
                  { value: 'original', label: s.merge.original },
                ]}
                onChange={setNormalize}
              />
              {normalize === 'original' && (
                <SegmentedControl
                  theme={theme}
                  label={s.merge.alignLabel}
                  value={align}
                  options={alignOptions}
                  onChange={setAlign}
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <SliderField
                theme={theme}
                label={s.merge.columns}
                value={columns}
                min={2}
                max={6}
                onChange={setColumns}
              />
              <SegmentedControl
                theme={theme}
                label={s.merge.cellAspect}
                value={aspectCell}
                options={[
                  { value: '1:1', label: '1:1' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' },
                  { value: 'auto', label: s.common.auto },
                ]}
                onChange={setAspectCell}
              />
              <SegmentedControl
                theme={theme}
                label={s.merge.fitLabel}
                value={fit}
                options={[
                  { value: 'cover', label: s.merge.fitCover },
                  { value: 'contain', label: s.merge.fitContain },
                ]}
                onChange={setFit}
              />
            </div>
          )}

          <SliderField theme={theme} label={s.common.gap} value={gap} min={0} max={64} unit="px" onChange={setGap} />
          <SliderField theme={theme} label={s.common.padding} value={padding} min={0} max={80} unit="px" onChange={setPadding} />
          <SliderField theme={theme} label={s.common.radius} value={borderRadius} min={0} max={48} unit="px" onChange={setBorderRadius} />
          <SliderField theme={theme} label={s.merge.borderWidth} value={borderWidth} min={0} max={24} unit="px" onChange={setBorderWidth} />

          {borderWidth > 0 && (
            <ColorSwatchRow
              theme={theme}
              label={s.merge.borderColor}
              value={borderColor}
              options={borderSwatches}
              allowCustom
              customLabel={s.common.customColor}
              onChange={setBorderColor}
            />
          )}

          <ColorSwatchRow
            theme={theme}
            label={s.common.background}
            value={background}
            options={bgSwatches}
            allowCustom
            customLabel={s.common.customColor}
            onChange={setBackground}
          />

          <SegmentedControl
            theme={theme}
            label={s.common.format}
            value={format}
            options={[
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'application/pdf', label: 'PDF' },
            ]}
            onChange={setFormat}
          />

          {format !== 'image/png' && (
            <SliderField
              theme={theme}
              label={s.common.quality}
              value={qualityPercent}
              min={50}
              max={100}
              unit="%"
              onChange={setQualityPercent}
            />
          )}
        </div>

        <div className="space-y-2 border-t pt-4 border-current/10">
          {error && (
            <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!activeResult || isBusy}
              onClick={() => activeResult && triggerBlobDownload(activeResult.blob, activeResult.filename)}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {isBusy ? s.common.processing : downloadLabel}
            </button>
            <button
              type="button"
              data-testid="merge-copy-image"
              disabled={!activeResult || isBusy}
              onClick={() => void handleCopy()}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="5" y="5" width="8" height="8" rx="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
              </svg>
              <span>{copied ? s.common.copied : s.common.copyImage}</span>
            </button>
          </div>
          <div className="grid grid-cols-1">
            <StudioHandoffButton
              theme={theme}
              label={s.common.openInStudio}
              disabled={!activeResult || handingOff}
              onClick={() => void handleOpenInStudio()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
