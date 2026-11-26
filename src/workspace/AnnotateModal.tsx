/**
 * [INPUT]: depends on react, ModalShell from @/components/ui/ModalShell, annotation history and renderAnnotatedImageToBlob from @/tools/annotateEngine, AnnotateCanvas/AnnotateToolbar/useAnnotateShortcuts from ./AnnotateOverlay, loadHtmlImage from ./canvasUtils, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, and workspace types from ./types
 * [OUTPUT]: exports AnnotateModal and AnnotateModalProps providing an accessible inline annotation dialog over any WorkspaceImageInput
 * [POS]: inline annotation modal inside src/workspace; invoked from MockupQuickTool, ResizeQuickTool, and MergeQuickTool to annotate images without leaving the current tool
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useMemo, useState } from 'react'
import { ModalShell } from '@/components/ui/ModalShell'
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
import { AnnotateCanvas, AnnotateToolbar, useAnnotateShortcuts } from './AnnotateOverlay'
import { loadHtmlImage } from './canvasUtils'
import { getWorkspaceStrings } from './i18n'
import { getWorkspaceThemeTokens } from './themeTokens'
import type { WorkspaceImageInput, WorkspaceLocale, WorkspaceTheme } from './types'

export interface AnnotateModalProps {
  image: WorkspaceImageInput
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  initialTool?: AnnotationToolMode
  onClose: () => void
  onSave: (bakedImage: WorkspaceImageInput) => void
}

export function AnnotateModal({
  image,
  locale,
  theme,
  initialTool = 'rect',
  onClose,
  onSave,
}: AnnotateModalProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const [history, setHistory] = useState<AnnotationHistoryState>(() => createAnnotationHistory())
  const [activeTool, setActiveTool] = useState<AnnotationToolMode>(initialTool)
  const [color, setColor] = useState<string>(DEFAULT_ANNOTATION_COLOR)
  const [strokeWidth, setStrokeWidth] = useState<number>(DEFAULT_ANNOTATION_STROKE_WIDTH)
  const [fontSize, setFontSize] = useState<number>(DEFAULT_ANNOTATION_FONT_SIZE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false)
  const [previewSizeOverride, setPreviewSizeOverride] = useState<{
    id: string
    kind: 'stroke' | 'font'
    value: number
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (colorPopoverOpen || editingTextId !== null) return
    if (selectedId) {
      setSelectedId(null)
      return
    }
    onClose()
  }, [colorPopoverOpen, editingTextId, onClose, selectedId])

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

  const handleSave = async () => {
    if (saving) return
    setError(null)
    if (displayLayers.length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      const img = await loadHtmlImage(image.dataUrl)
      const naturalW = img.naturalWidth || image.width
      const naturalH = img.naturalHeight || image.height
      const rendered = await renderAnnotatedImageToBlob(img, naturalW, naturalH, displayLayers, {
        format: 'image/png',
      })
      const bakedFile =
        typeof File !== 'undefined'
          ? new File([rendered.blob], image.name || 'annotated.png', { type: rendered.mimeType })
          : undefined
      onSave({
        ...image,
        dataUrl: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        sizeBytes: rendered.blob.size,
        mimeType: rendered.mimeType,
        isDemo: false,
        ...(bakedFile ? { file: bakedFile } : { file: undefined }),
      })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : s.common.exportError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={s.annotate.title}
      showCloseButton={false}
      closeOnEscape={false}
      closeOnBackdrop={false}
      maxWidth="max-w-5xl"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-2.5 sm:p-5 backdrop-blur-xs overscroll-contain"
      backdropStyle={{}}
      panelClassName={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-2xl border p-3 sm:p-4 shadow-2xl overscroll-contain ${tokens.card}`}
      panelStyle={{}}
      header={
        <div className="relative z-30 mb-3 flex flex-col items-center gap-2">
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
            saving={saving}
            onToolChange={handleToolChange}
            onColorChange={handleColorChange}
            onSizePreview={handleSizePreview}
            onSizeCommit={handleSizeCommit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClose={onClose}
            onSave={() => void handleSave()}
            onColorPopoverOpenChange={setColorPopoverOpen}
          />
        </div>
      }
    >
      <div data-testid="annotate-modal" className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
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
          maxHeightClass="max-h-[70dvh]"
          onSelect={setSelectedId}
          onEditingTextIdChange={setEditingTextId}
          onCommitLayers={commitLayers}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
          <span className={tokens.textSubtle}>{s.annotate.shortcutsHint}</span>
          <div className="flex items-center gap-2">
            {displayLayers.length > 0 && (
              <span className={`rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${tokens.accentChip}`}>
                {displayLayers.length} {s.annotate.layersCount}
              </span>
            )}
            {selectedId && (
              <button
                type="button"
                data-testid="annotate-modal-delete"
                onClick={handleDeleteSelected}
                className={`min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${tokens.focusRing} ${tokens.dangerGhost}`}
              >
                {s.annotate.deleteLayer}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className={`px-1 text-xs font-medium ${tokens.errorText}`}>
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}
