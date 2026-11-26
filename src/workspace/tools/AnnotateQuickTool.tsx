/**
 * [INPUT]: depends on react, isHeicFile from @/tools, annotation engine helpers from @/tools/annotateEngine, trackFunnelEvent from @/utils/telemetry, AnnotateCanvas/AnnotateToolbar/useAnnotateShortcuts from ../AnnotateOverlay, canvasUtils from ../canvasUtils, draftStorage from ../draftStorage, ExifPrivacyBanner from ../ExifPrivacyBanner, i18n from ../i18n, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useToolDraft from ../useToolDraft, and workspace types from ../types
 * [OUTPUT]: exports AnnotateQuickTool component providing the standalone 7th QuickWorkspace panel for local-first vector image markup (brush, rectangle, arrow, text, 8-handle resize, undo/redo, draft persistence, copy, download, and Studio handoff)
 * [POS]: standalone annotation tool panel inside src/workspace/tools; dynamically loaded by QuickWorkspace for /annotate-image and /draw-on-image routes
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useMemo, useState } from 'react'
import { isHeicFile } from '@/tools'
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_FONT_SIZE,
  DEFAULT_ANNOTATION_STROKE_WIDTH,
  canRedoAnnotation,
  canUndoAnnotation,
  createAnnotationHistory,
  pushAnnotationHistory,
  redoAnnotationHistory,
  renderAnnotatedImageToBlob,
  undoAnnotationHistory,
  type AnnotationHistoryState,
  type AnnotationLayer,
  type AnnotationToolMode,
} from '@/tools/annotateEngine'
import { trackFunnelEvent } from '@/utils/telemetry'
import { AnnotateCanvas, AnnotateToolbar, useAnnotateShortcuts } from '../AnnotateOverlay'
import {
  createDemoImageInput,
  extensionForMime,
  loadHtmlImage,
  readFileAsImageInput,
  stripExtension,
  triggerBlobDownload,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { ExifPrivacyBanner } from '../ExifPrivacyBanner'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceToolPanelProps,
} from '../types'
import {
  CopyImageButton,
  DraftStatusBar,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useToolDraft } from '../useToolDraft'

interface AnnotateDraftSettings {
  layers: AnnotationLayer[]
  color: string
  strokeWidth: number
  fontSize: number
  format: WorkspaceImageFormat
  qualityPercent: number
}

function isValidAnnotationLayer(item: unknown): item is AnnotationLayer {
  if (!item || typeof item !== 'object') return false
  const rec = item as Record<string, unknown>
  if (typeof rec.id !== 'string' || typeof rec.color !== 'string' || typeof rec.strokeWidth !== 'number') {
    return false
  }
  return rec.type === 'brush' || rec.type === 'rect' || rec.type === 'arrow' || rec.type === 'text'
}

export function AnnotateQuickTool({
  preset,
  locale,
  theme,
  onOpenInStudio,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [image, setImage] = useState<WorkspaceImageInput>(() =>
    createDemoImageInput('saas', 'moklu-annotate-demo.svg'),
  )
  const [history, setHistory] = useState<AnnotationHistoryState>(() => createAnnotationHistory())
  const [activeTool, setActiveTool] = useState<AnnotationToolMode>(preset.annotateTool ?? 'rect')
  const [color, setColor] = useState<string>(DEFAULT_ANNOTATION_COLOR)
  const [strokeWidth, setStrokeWidth] = useState<number>(DEFAULT_ANNOTATION_STROKE_WIDTH)
  const [fontSize, setFontSize] = useState<number>(DEFAULT_ANNOTATION_FONT_SIZE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [previewSizeOverride, setPreviewSizeOverride] = useState<{
    id: string
    kind: 'stroke' | 'font'
    value: number
  } | null>(null)
  const [format, setFormat] = useState<WorkspaceImageFormat>(preset.targetFormat ?? 'image/png')
  const [qualityPercent, setQualityPercent] = useState<number>(92)
  const [heicDecoding, setHeicDecoding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const displayLayers = useMemo(() => {
    if (!previewSizeOverride) return history.present
    return history.present.map((layer) => {
      if (layer.id !== previewSizeOverride.id) return layer
      if (previewSizeOverride.kind === 'font' && layer.type === 'text') {
        return { ...layer, fontSize: previewSizeOverride.value }
      }
      return { ...layer, strokeWidth: previewSizeOverride.value }
    })
  }, [history.present, previewSizeOverride])

  const selectedLayer = useMemo(
    () => (selectedId ? displayLayers.find((l) => l.id === selectedId) ?? null : null),
    [displayLayers, selectedId],
  )

  const draftImages = useMemo(() => [image], [image])
  const draftSettings = useMemo<AnnotateDraftSettings>(
    () => ({
      layers: history.present,
      color,
      strokeWidth,
      fontSize,
      format,
      qualityPercent,
    }),
    [history.present, color, strokeWidth, fontSize, format, qualityPercent],
  )

  const handleRestoreDraft = useCallback((draft: WorkspaceToolDraft<AnnotateDraftSettings>) => {
    const restored = deserializeDraftImages(draft.images)
    if (restored[0]) setImage(restored[0])
    const cfg = draft.settings
    if (Array.isArray(cfg.layers)) {
      const cleanLayers = cfg.layers.filter(isValidAnnotationLayer)
      setHistory(createAnnotationHistory(cleanLayers))
    }
    if (typeof cfg.color === 'string' && cfg.color) setColor(cfg.color)
    if (typeof cfg.strokeWidth === 'number' && Number.isFinite(cfg.strokeWidth)) {
      setStrokeWidth(cfg.strokeWidth)
    }
    if (typeof cfg.fontSize === 'number' && Number.isFinite(cfg.fontSize)) {
      setFontSize(cfg.fontSize)
    }
    if (cfg.format === 'image/png' || cfg.format === 'image/jpeg' || cfg.format === 'image/webp') {
      setFormat(cfg.format)
    }
    if (typeof cfg.qualityPercent === 'number' && Number.isFinite(cfg.qualityPercent)) {
      setQualityPercent(Math.max(50, Math.min(100, Math.round(cfg.qualityPercent))))
    }
  }, [])

  const { hasDraft, clearDraft } = useToolDraft<AnnotateDraftSettings>({
    toolId: 'annotate',
    images: draftImages,
    settings: draftSettings,
    onRestore: handleRestoreDraft,
  })

  const commitLayers = useCallback((next: AnnotationLayer[]) => {
    setPreviewSizeOverride(null)
    setHistory((prev) => pushAnnotationHistory(prev, next))
  }, [])

  const handleUndo = useCallback(() => {
    setPreviewSizeOverride(null)
    setEditingTextId(null)
    setHistory((prev) => {
      const next = undoAnnotationHistory(prev)
      if (selectedId && !next.present.some((l) => l.id === selectedId)) {
        setSelectedId(null)
      }
      return next
    })
  }, [selectedId])

  const handleRedo = useCallback(() => {
    setPreviewSizeOverride(null)
    setEditingTextId(null)
    setHistory((prev) => redoAnnotationHistory(prev))
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return
    commitLayers(history.present.filter((l) => l.id !== selectedId))
    setSelectedId(null)
    setEditingTextId(null)
  }, [commitLayers, history.present, selectedId])

  const handleClearAllLayers = useCallback(() => {
    if (history.present.length === 0) return
    commitLayers([])
    setSelectedId(null)
    setEditingTextId(null)
  }, [commitLayers, history.present.length])

  const handleColorChange = useCallback(
    (nextColor: string) => {
      setColor(nextColor)
      if (selectedId) {
        commitLayers(
          history.present.map((layer) => (layer.id === selectedId ? { ...layer, color: nextColor } : layer)),
        )
      }
    },
    [commitLayers, history.present, selectedId],
  )

  const handleSizePreview = useCallback(
    (nextValue: number, kind: 'stroke' | 'font') => {
      if (kind === 'font') setFontSize(nextValue)
      else setStrokeWidth(nextValue)
      if (selectedId) {
        setPreviewSizeOverride({ id: selectedId, kind, value: nextValue })
      }
    },
    [selectedId],
  )

  const handleSizeCommit = useCallback(
    (nextValue: number, kind: 'stroke' | 'font') => {
      if (kind === 'font') setFontSize(nextValue)
      else setStrokeWidth(nextValue)
      setPreviewSizeOverride(null)
      if (!selectedId) return
      const target = history.present.find((l) => l.id === selectedId)
      if (!target) return
      const unchanged =
        kind === 'font' && target.type === 'text'
          ? Math.abs(target.fontSize - nextValue) < 0.0005
          : Math.abs(target.strokeWidth - nextValue) < 0.0005
      if (unchanged) return
      commitLayers(
        history.present.map((layer) => {
          if (layer.id !== selectedId) return layer
          if (kind === 'font' && layer.type === 'text') {
            return { ...layer, fontSize: nextValue }
          }
          return { ...layer, strokeWidth: nextValue }
        }),
      )
    },
    [commitLayers, history.present, selectedId],
  )

  const handleToolChange = useCallback((nextTool: AnnotationToolMode) => {
    setActiveTool(nextTool)
    if (nextTool !== 'select') {
      setSelectedId(null)
      setEditingTextId(null)
    }
  }, [])

  const handleEscape = useCallback(() => {
    if (editingTextId !== null) return
    setSelectedId(null)
  }, [editingTextId])

  useAnnotateShortcuts({
    enabled: true,
    editingTextId,
    selectedId,
    canUndo: canUndoAnnotation(history),
    canRedo: canRedoAnnotation(history),
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeleteSelected: handleDeleteSelected,
    onSelectTool: handleToolChange,
    onEscape: handleEscape,
  })

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      setExportError(null)
      const heic = isHeicFile(file)
      if (heic) setHeicDecoding(true)
      try {
        const loaded = await readFileAsImageInput(file, 'annotated.png', {
          onHeicStage: (stage) => {
            setHeicDecoding(stage !== 'done')
          },
        })
        setImage(loaded)
        setHistory(createAnnotationHistory())
        setSelectedId(null)
        setEditingTextId(null)
      } catch {
        setExportError(s.common.decodeError)
      } finally {
        setHeicDecoding(false)
      }
    },
    [s.common.decodeError],
  )

  const handleLoadDemo = () => {
    setExportError(null)
    setImage(createDemoImageInput('saas', 'moklu-annotate-demo.svg'))
    setHistory(createAnnotationHistory())
    setSelectedId(null)
    setEditingTextId(null)
  }

  const handleClearDraft = () => {
    void clearDraft()
    handleLoadDemo()
  }

  const renderFlattened = useCallback(
    async (targetFormat: WorkspaceImageFormat = format) => {
      const img = await loadHtmlImage(image.dataUrl)
      const naturalW = img.naturalWidth || image.width
      const naturalH = img.naturalHeight || image.height
      return renderAnnotatedImageToBlob(img, naturalW, naturalH, displayLayers, {
        format: targetFormat,
        quality: targetFormat === 'image/png' ? 1 : qualityPercent / 100,
      })
    },
    [displayLayers, format, image.dataUrl, image.height, image.width, qualityPercent],
  )

  const handleDownload = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const rendered = await renderFlattened(format)
      const ext = extensionForMime(
        rendered.mimeType === 'image/jpeg' || rendered.mimeType === 'image/webp' ? rendered.mimeType : 'image/png',
      )
      const stem = stripExtension(image.name) || 'moklu-annotated'
      triggerBlobDownload(rendered.blob, `${stem}-annotated.${ext}`)
      setStatusMessage(s.annotate.savedToast)
      trackFunnelEvent('export_completed', {
        tool: 'annotate',
        layers: displayLayers.length,
        mime: rendered.mimeType,
      })
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : s.common.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const getCopyTarget = useCallback(async () => {
    const rendered = await renderFlattened('image/png')
    return { blob: rendered.blob, previewDataUrl: rendered.dataUrl }
  }, [renderFlattened])

  const handleOpenInStudio = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      let handoffSrc = image.dataUrl
      let handoffW = image.width
      let handoffH = image.height
      if (displayLayers.length > 0) {
        const rendered = await renderFlattened('image/png')
        handoffSrc = rendered.dataUrl
        handoffW = rendered.width
        handoffH = rendered.height
      }
      onOpenInStudio({
        images: [
          {
            dataUrl: handoffSrc,
            name: `${stripExtension(image.name) || 'annotated'}.png`,
            width: handoffW,
            height: handoffH,
          },
        ],
        mode: 'canvas',
        slideWidth: handoffW,
        slideHeight: handoffH,
      })
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : s.common.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const isBusy = isExporting || isCopying

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-testid="annotate-quick-tool">
      {/* Left: Floating Toolbar + Interactive Vector Annotation Stage */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-3.5 sm:p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.common.preview}
              </span>
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                {image.width} × {image.height}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              {s.common.tryDemo}
            </button>
          </div>

          <div className="relative z-30 mb-3 flex justify-center">
            <AnnotateToolbar
              theme={theme}
              locale={locale}
              activeTool={activeTool}
              color={color}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              selectedLayer={selectedLayer}
              canUndo={canUndoAnnotation(history)}
              canRedo={canRedoAnnotation(history)}
              onToolChange={handleToolChange}
              onColorChange={handleColorChange}
              onSizePreview={handleSizePreview}
              onSizeCommit={handleSizeCommit}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>

          <div aria-busy={isBusy} className="relative">
            {isBusy && <PreviewBusyOverlay theme={theme} label={s.common.downloading} />}
            <AnnotateCanvas
              image={image}
              theme={theme}
              locale={locale}
              activeTool={activeTool}
              color={color}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              layers={displayLayers}
              selectedId={selectedId}
              editingTextId={editingTextId}
              onSelect={setSelectedId}
              onEditingTextIdChange={setEditingTextId}
              onCommitLayers={commitLayers}
            />
          </div>

          <div className="mt-4">
            <DropZone
              theme={theme}
              compact
              title={s.common.dropTitle}
              hint={`${image.name} (${image.width}×${image.height})`}
              buttonLabel={s.annotate.replaceImage}
              invalidFileMessage={s.common.invalidFileError}
              decodingLabel={heicDecoding ? s.common.heicDecoding : null}
              onFiles={handleFiles}
            />
          </div>

          <ExifPrivacyBanner theme={theme} locale={locale} images={draftImages} className="mt-3" />

          {hasDraft && (
            <DraftStatusBar
              theme={theme}
              toolId="annotate"
              savedLabel={s.common.draftSaved}
              clearLabel={s.common.clearDraft}
              onClear={handleClearDraft}
            />
          )}
        </div>
      </div>

      {/* Right: Layer Controls & Export Inspector */}
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-4 sm:p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <div className={`rounded-xl border p-3.5 ${tokens.cardMuted}`}>
            <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${tokens.text}`}>{s.annotate.title}</span>
                <span
                  data-testid="annotate-layers-count"
                  className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold tabular-nums ${tokens.accentChip}`}
                >
                  {displayLayers.length} {s.annotate.layersCount}
                </span>
              </div>
              <div className="flex min-h-7 items-center gap-1.5">
                {selectedId && (
                  <button
                    type="button"
                    data-testid="annotate-delete-selected"
                    onClick={handleDeleteSelected}
                    className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
                  >
                    {s.annotate.deleteLayer}
                  </button>
                )}
                {displayLayers.length > 0 && (
                  <button
                    type="button"
                    data-testid="annotate-clear-all"
                    onClick={handleClearAllLayers}
                    className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
                  >
                    {s.annotate.clearAll}
                  </button>
                )}
              </div>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${tokens.textSubtle}`}>
              {displayLayers.length === 0 ? s.annotate.emptyHint : s.annotate.shortcutsHint}
            </p>
          </div>

          <SegmentedControl
            theme={theme}
            label={s.common.format}
            value={format}
            options={[
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
              { value: 'image/jpeg', label: 'JPEG' },
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

        {/* Export Actions */}
        <div className="space-y-2.5 border-t pt-4 border-current/10">
          {exportError && (
            <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
              {exportError}
            </p>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {statusMessage}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              data-testid="annotate-download-btn"
              disabled={isBusy}
              onClick={() => void handleDownload()}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {isExporting ? s.common.downloading : s.common.downloadImage}
            </button>
            <CopyImageButton
              theme={theme}
              tool="annotate"
              testId="annotate-copy-image"
              label={s.common.copyImage}
              copiedLabel={s.common.copiedToChat}
              copyErrorMessage={s.common.copyError}
              disabled={isExporting}
              getImage={getCopyTarget}
              onError={setExportError}
              onBusyChange={setIsCopying}
            />
          </div>
          <p className={`text-center text-[11px] font-medium ${tokens.textSubtle}`}>
            {s.common.exportTrustNote}
          </p>
          <div className="grid grid-cols-1">
            <StudioHandoffButton
              theme={theme}
              label={s.common.openInStudio}
              disabled={isBusy}
              onClick={() => void handleOpenInStudio()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
