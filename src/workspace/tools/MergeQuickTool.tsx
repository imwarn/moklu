/**
 * [INPUT]: depends on react, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, canvasUtils from ../canvasUtils, strings from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useDebouncedValue from ../useDebouncedValue, and workspace types from ../types
 * [OUTPUT]: exports MergeQuickTool component for horizontal, vertical, and 2..6-col grid multi-image stitching with drag-and-drop reordering, reverse order, 90deg per-item rotation, cross-axis alignment, per-image border, custom color picker, quality slider, clipboard copy, and single-page PDF export
 * [POS]: merge and collage tool panel inside src/workspace/tools; delegates canvas composition to injected engines.merge
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
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  copyImageToClipboard,
  createDemoImageInput,
  formatBytes,
  readFileAsImageInput,
  triggerBlobDownload,
} from '../canvasUtils'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens, type WorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceBlobOutput,
  WorkspaceImageInput,
  WorkspaceMergeAlign,
  WorkspaceMergeFormat,
  WorkspaceMergeOptions,
  WorkspaceMergeRotation,
  WorkspaceToolPanelProps,
} from '../types'
import {
  ColorSwatchRow,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useDebouncedValue } from '../useDebouncedValue'

function nextQuarterTurn(current?: WorkspaceMergeRotation): WorkspaceMergeRotation {
  switch (current ?? 0) {
    case 0: return 90
    case 90: return 180
    case 180: return 270
    case 270: return 0
  }
}

interface SortableMergeThumbProps {
  item: WorkspaceImageInput
  index: number
  total: number
  tokens: WorkspaceThemeTokens
  labels: {
    moveLeft: string
    moveRight: string
    rotate90: string
    remove: string
  }
  onMove: (index: number, delta: -1 | 1) => void
  onRotate: (id: string) => void
  onRemove: (id: string) => void
}

function SortableMergeThumb({
  item,
  index,
  total,
  tokens,
  labels,
  onMove,
  onRotate,
  onRemove,
}: SortableMergeThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const rotation = item.rotation ?? 0

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-testid={`merge-thumb-${index}`}
      className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 ${tokens.card} ${
        isDragging ? 'z-20 opacity-85 shadow-md ring-2 ring-accent/40' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative flex cursor-grab touch-none items-center gap-1.5 active:cursor-grabbing"
      >
        <svg
          viewBox="0 0 12 20"
          className={`h-4 w-2.5 shrink-0 opacity-50 ${tokens.textSubtle}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="3" cy="5" r="1.2" />
          <circle cx="9" cy="5" r="1.2" />
          <circle cx="3" cy="10" r="1.2" />
          <circle cx="9" cy="10" r="1.2" />
          <circle cx="3" cy="15" r="1.2" />
          <circle cx="9" cy="15" r="1.2" />
        </svg>
        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-black/5">
          <img
            src={item.dataUrl}
            alt={item.name}
            style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
            className="h-full w-full object-cover transition-transform"
          />
          {rotation !== 0 && (
            <span className="absolute bottom-0.5 right-0.5 rounded bg-zinc-900/80 px-1 text-[9px] font-bold tabular-nums text-white">
              {rotation}°
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className={`max-w-[120px] truncate text-[11px] font-medium ${tokens.text}`}>
          {index + 1}. {item.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`${labels.moveLeft}: ${item.name}`}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`${labels.moveRight}: ${item.name}`}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors disabled:opacity-30 ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            →
          </button>
          <button
            type="button"
            title={labels.rotate90}
            aria-label={`${labels.rotate90}: ${item.name}`}
            data-testid={`merge-rotate-${index}`}
            onClick={() => onRotate(item.id)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" strokeLinecap="round" />
              <path d="M12.5 2.8v2.6H9.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`${labels.remove}: ${item.name}`}
            onClick={() => onRemove(item.id)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
          >
            ×
          </button>
        </div>
      </div>
    </li>
  )
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
  const [result, setResult] = useState<WorkspaceBlobOutput | null>(null)
  const [rendering, setRendering] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copyTimerRef = useRef<number | null>(null)

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
    engines,
    s.merge.mergeError,
  ])

  const activeResult = images.length > 0 ? result : null
  const isScaledDown =
    activeResult?.scaleFactor !== undefined && activeResult.scaleFactor < 0.999

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

  const handleOpenInStudio = () => {
    if (!activeResult) return
    onOpenInStudio({
      images: [
        {
          dataUrl: activeResult.dataUrl,
          name: activeResult.filename,
          width: activeResult.width,
          height: activeResult.height,
        },
      ],
      mode: 'canvas',
      slideWidth: activeResult.width,
      slideHeight: activeResult.height,
    })
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
                  onClick={() => {
                    setImages([])
                    setResult(null)
                    setCopied(false)
                  }}
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
              disabled={!activeResult}
              onClick={handleOpenInStudio}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
