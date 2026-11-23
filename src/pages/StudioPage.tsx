/**
 * [INPUT]: depends on react, konva, zustand useShallow, Toolbar, LayersPanel, PreviewModal, PropertiesPanel, SlideNavigator, StageCanvas, EditingContext, AppLoadingScreen, ConfirmDialog, ChunkErrorBoundary, useThumbnails, useImageCacheWarmer, useEditorStore/useUndoRedo, ensureProjectsBootstrapped/useProjectsStore, applyCanvasFormat/resolveGroupView, registerStage, getScopedEditingIndicator, studioShortcuts, applyDocumentTheme from @/theme/themeStore, buildLocalizedPath/LocaleCode from @/seo, and StudioLocaleProvider/getStudioDictionary from @/i18n
 * [OUTPUT]: exports StudioPage component containing the full Konva multi-layer editor wrapped in StudioLocaleProvider, localization mode with Suspense skeleton, keyboard shortcuts, mobile drawers, and Home/Tools navigation link
 * [POS]: lazy-loaded full Studio editor page mounted by src/App.tsx on /studio and /<locale>/studio routes
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import type Konva from 'konva'
import { useShallow } from 'zustand/react/shallow'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { PreviewModal } from '@/components/panels/PreviewModal'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { SlideNavigator } from '@/components/panels/SlideNavigator'
import { StageCanvas } from '@/components/canvas/StageCanvas'
import { EditingContextAlert, EditingContextBar } from '@/components/canvas/EditingContext'
import { AppLoadingScreen } from '@/components/AppLoadingScreen'
import { useThumbnails } from '@/hooks/useThumbnails'
import { useImageCacheWarmer } from '@/hooks/useImageCacheWarmer'
import { useEditorStore, useUndoRedo } from '@/store'
import { applyCanvasFormat, resolveGroupView } from '@/utils/canvasFormats'
import { registerStage } from '@/utils/stageRegistry'
import { getScopedEditingIndicator } from '@/utils/scopedEditingIndicator'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary'
import { ensureProjectsBootstrapped, useProjectsStore } from '@/store/projects'
import { applyDocumentTheme } from '@/theme/themeStore'
import { buildLocalizedPath, type LocaleCode } from '@/seo'
import { StudioLocaleProvider, getStudioDictionary } from '@/i18n'
import {
  resolveDeletableLayerIds,
  resolveNudgeTarget,
  resolveStudioShortcut,
} from './studioShortcuts'

// Lazy-load the localization view — it's a separate mode and not needed on initial load.
const LocalizationView = lazy(() =>
  import('@/pages/LocalizationView').then((m) => ({ default: m.LocalizationView })),
)

const INITIAL_SPLASH_MIN_MS = 450

export interface StudioPageProps {
  locale?: LocaleCode
  onNavigate?: (path: string) => void
}

export function StudioPage({ locale = 'en', onNavigate }: StudioPageProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const conflictNotice = useProjectsStore((s) => s.conflictNotice)
  const homeHref = buildLocalizedPath(locale, '')

  // Studio always renders on its calibrated dark canvas surface with locked viewport overflow.
  useEffect(() => {
    applyDocumentTheme('dark', 'studio')
    document.documentElement.dataset.surface = 'studio'
    return () => {
      if (document.documentElement.dataset.surface === 'studio') {
        delete document.documentElement.dataset.surface
      }
    }
  }, [])

  // Register the stage in the singleton registry so PropertiesPanel and other
  // non-canvas components can access it for bounding-box queries (alignment).
  useEffect(() => {
    registerStage(stageRef.current)
    return () => registerStage(null)
  })

  const {
    project,
    activeSlideGroupId,
    activeCanvasFormat,
    activeLocale,
    setActiveSlideGroup,
    exitGroupEdit,
    editingGroupId,
  } = useEditorStore(useShallow((s) => ({
    project: s.project,
    activeSlideGroupId: s.activeSlideGroupId,
    activeCanvasFormat: s.activeCanvasFormat,
    activeLocale: s.activeLocale,
    setActiveSlideGroup: s.setActiveSlideGroup,
    exitGroupEdit: s.exitGroupEdit,
    editingGroupId: s.editingGroupId,
  })))

  const scopedEditingIndicator = getScopedEditingIndicator(project, activeLocale, activeCanvasFormat)
  const { undo, redo } = useUndoRedo()
  const [view, setView] = useState<'editor' | 'localization'>('editor')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'layers' | 'properties' | null>(null)
  // Locale the preview opens in + the view to return to when it closes.
  const [previewLocale, setPreviewLocale] = useState<string | undefined>(undefined)
  const [previewReturnTo, setPreviewReturnTo] = useState<'localization' | null>(null)
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false)
  const [hasMetMinimumSplashTime, setHasMetMinimumSplashTime] = useState(false)
  const [projectsReady, setProjectsReady] = useState(() => useProjectsStore.getState().initialized)

  useEffect(() => {
    if (projectsReady) return
    let active = true
    void ensureProjectsBootstrapped().finally(() => {
      if (active) setProjectsReady(true)
    })
    return () => {
      active = false
    }
  }, [projectsReady])

  const {
    thumbnails,
    staleGroupIds,
    previewThumbs,
    isCapturingPreview,
    previewProgress,
    captureNow,
    captureAllHighRes,
    cancelPreviewCapture,
    offscreenThumbnailElement,
  } = useThumbnails(stageRef, hasCompletedInitialLoad)
  useImageCacheWarmer(hasCompletedInitialLoad)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasMetMinimumSplashTime(true), INITIAL_SPLASH_MIN_MS)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasCompletedInitialLoad(true), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (hasCompletedInitialLoad) return
    if (!hasMetMinimumSplashTime || !projectsReady) return

    // Only the visible group gates first paint; background thumbnails precache at idle.
    if (project.slideGroups.length > 0) {
      if (!activeSlideGroupId || !thumbnails[activeSlideGroupId]) return
    }

    const timeoutId = window.setTimeout(() => setHasCompletedInitialLoad(true), 0)
    return () => window.clearTimeout(timeoutId)
  }, [hasCompletedInitialLoad, hasMetMinimumSplashTime, projectsReady, project.slideGroups.length, activeSlideGroupId, thumbnails])

  useEffect(() => {
    if (project.slideGroups.length === 0) return
    const groupExists = project.slideGroups.some((g) => g.id === activeSlideGroupId)
    if (!activeSlideGroupId || !groupExists) {
      setActiveSlideGroup(project.slideGroups[0].id)
    }
  }, [project.slideGroups, activeSlideGroupId, setActiveSlideGroup])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'editor') return

      // Don't fire when user is typing in an input or rich text editor
      const active = document.activeElement as HTMLElement | null
      if (
        active &&
        (active.closest('[role="dialog"], [aria-modal="true"]') ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        if (
          e.key === 'Backspace' &&
          active.tagName !== 'INPUT' &&
          active.tagName !== 'TEXTAREA' &&
          !active.isContentEditable
        ) {
          e.preventDefault()
        }
        return
      }

      const state = useEditorStore.getState()
      const command = resolveStudioShortcut(
        {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        },
        {
          view,
          hasOpenMobilePanel: mobilePanel !== null,
          editingGroupId,
          hasSelection: Boolean(state.selection?.layerId || state.selectedLayerIds.length > 0),
        },
      )

      if (!command) return
      e.preventDefault()

      switch (command.type) {
        case 'close-mobile-panel':
          setMobilePanel(null)
          return
        case 'exit-group-edit':
          exitGroupEdit()
          return
        case 'group':
          if (state.selectedLayerIds.length >= 2) state.createGroup(state.selectedLayerIds)
          return
        case 'ungroup':
          // Only dissolve when a top-level group is selected (not when inside group edit mode)
          if (state.selection?.layerId && !state.editingGroupId) {
            state.dissolveGroup(state.selection.layerId)
          }
          return
        case 'undo':
          undo()
          return
        case 'redo':
          redo()
          return
        case 'copy':
          state.copyLayers()
          return
        case 'cut':
          state.cutLayers()
          return
        case 'paste':
          state.pasteLayers()
          return
        case 'copy-style':
          if (state.selection?.layerId) state.copyLayerStyle(state.selection.layerId)
          return
        case 'paste-style':
          if (state.selection?.layerId) state.pasteLayerStyle(state.selection.layerId)
          return
        case 'duplicate':
          if (state.selection?.layerId) state.duplicateLayer(state.selection.layerId)
          return
        case 'zoom-fit': {
          const viewProject = applyCanvasFormat(state.project, state.activeCanvasFormat)
          const grp = viewProject.slideGroups.find((g) => g.id === state.activeSlideGroupId)
          if (grp) {
            const availW = window.innerWidth - 224 - 288 - 64
            const availH = window.innerHeight - 140
            const totalW = grp.slideWidth * grp.numSlides
            const fitScale = Math.max(0.05, Math.min(4, Math.min(availW / totalW, availH / grp.slideHeight)))
            state.setZoom(fitScale)
            state.setViewportPosition(
              (availW + 64 - totalW * fitScale) / 2,
              (availH - grp.slideHeight * fitScale) / 2 + 16,
            )
          }
          return
        }
        case 'zoom-reset':
          state.setZoom(1)
          return
        case 'nudge': {
          const rawGroup = state.project.slideGroups.find((group) => group.id === state.activeSlideGroupId)
          if (!rawGroup) return
          const grp = resolveGroupView(rawGroup, state.project.settings, state.activeLocale, state.activeCanvasFormat)
          const target = resolveNudgeTarget(grp.layers, state.selection?.layerId, state.editingGroupId)
          if (!target) return
          const nextPos = { x: target.layer.x + command.dx, y: target.layer.y + command.dy } as Parameters<typeof state.updateLayer>[1]
          if (target.kind === 'child') {
            state.updateChildLayer(target.groupId, target.layer.id, nextPos)
          } else {
            state.updateLayer(target.layer.id, nextPos)
          }
          return
        }
        case 'delete': {
          const rawGroup = state.project.slideGroups.find((group) => group.id === state.activeSlideGroupId)
          if (!rawGroup) return
          const grp = resolveGroupView(rawGroup, state.project.settings, state.activeLocale, state.activeCanvasFormat)
          const deletableIds = resolveDeletableLayerIds(
            grp.layers,
            state.selectedLayerIds,
            state.selection?.layerId,
            state.editingGroupId,
          )
          deletableIds.forEach((id) => state.removeLayer(id))
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, exitGroupEdit, editingGroupId, view, mobilePanel])

  // Returning from localization starts the editor on the default locale.
  const handleSetMode = (mode: 'editor' | 'localization') => {
    if (mode === 'editor') {
      const s = useEditorStore.getState()
      s.setActiveLocale(s.project.settings.defaultLocale ?? 'en')
    } else {
      setMobilePanel(null)
    }
    setView(mode)
  }

  // Preview from the Localization view: the Konva stage only exists in editor
  // view, so switch to it underneath the fullscreen modal and return on close.
  const handlePreviewLocale = (previewLoc: string) => {
    setPreviewLocale(previewLoc)
    setPreviewReturnTo('localization')
    setView('editor')
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    if (previewReturnTo === 'localization') setView('localization')
    setPreviewReturnTo(null)
    setPreviewLocale(undefined)
  }

  const t = getStudioDictionary(locale)

  return (
    <StudioLocaleProvider
      locale={locale}
      onChangeLocale={(next) => onNavigate?.(buildLocalizedPath(next, 'studio'))}
    >
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-surface">
        <ConfirmDialog
          open={conflictNotice !== null}
          title={t.studio.conflictTitle}
          message={t.studio.conflictMessage}
          confirmLabel={t.studio.conflictConfirm}
          onConfirm={() => { void useProjectsStore.getState().saveConflictedProjectAsCopy() }}
          onCancel={() => useProjectsStore.setState({ conflictNotice: null })}
        />
        <Toolbar
          mode={view}
          onSetMode={handleSetMode}
          homeHref={homeHref}
          onNavigateHome={onNavigate ? () => onNavigate(homeHref) : undefined}
        />
        <div className="relative flex flex-1 overflow-hidden">
          {/* Localization view — absolutely covers the editor when active */}
          {view === 'localization' && (
            <main className="absolute inset-0 z-10 overflow-hidden bg-surface">
              <ChunkErrorBoundary
                locale={locale}
                variant="inline"
                onReset={() => handleSetMode('editor')}
              >
                <Suspense
                  fallback={
                    <div
                      role="status"
                      aria-live="polite"
                      aria-busy="true"
                      className="flex h-full w-full flex-col gap-4 bg-surface p-6 text-muted"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
                          />
                          <span className="text-sm font-medium text-zinc-100">{t.toolbar.localization}</span>
                        </div>
                        <div aria-hidden="true" className="h-7 w-40 animate-pulse rounded-md bg-white/[0.06]" />
                      </div>
                      <div aria-hidden="true" className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="animate-pulse rounded-xl border border-border bg-panel" />
                        <div className="animate-pulse rounded-xl border border-border bg-panel md:col-span-2" />
                      </div>
                    </div>
                  }
                >
                  <LocalizationView embedded onBack={() => handleSetMode('editor')} onPreview={handlePreviewLocale} />
                </Suspense>
              </ChunkErrorBoundary>
            </main>
          )}

          {/* Editor view — always mounted so the Konva stage + ResizeObserver are always alive.
              Hidden (pointer-events-none, invisible, aria-hidden, inert) when the localization view is on top. */}
          <div
            className="flex min-w-0 flex-1 overflow-hidden"
            aria-hidden={view === 'localization' || undefined}
            inert={view === 'localization' ? true : undefined}
            style={view === 'localization' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
          >
            {/* Mobile drawer backdrop — tap outside to dismiss Layers/Properties on narrow screens */}
            {mobilePanel !== null && (
              <div
                data-testid="mobile-panel-backdrop"
                aria-hidden="true"
                onClick={() => setMobilePanel(null)}
                className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] lg:hidden"
              />
            )}

            {/* Layers panel — always visible on desktop, slide-over drawer on mobile */}
            <aside aria-label={t.studio.layersSidebarAria} className={`z-20 h-full shrink-0 lg:static lg:block ${mobilePanel === 'layers' ? 'absolute inset-y-0 left-0 block shadow-2xl' : 'hidden'}`}>
              <LayersPanel />
            </aside>

            {/* Canvas area — fills remaining space */}
            <main
              className="flex-1 overflow-hidden bg-surface flex flex-col"
              style={{ minWidth: 0 }}
            >
              <nav aria-label={t.studio.editorPanelsAria} className="relative z-30 flex shrink-0 justify-end gap-2 border-b border-border bg-panel px-3 py-2 lg:hidden">
                <button
                  type="button"
                  aria-label={t.studio.toggleLayersAria}
                  aria-expanded={mobilePanel === 'layers'}
                  aria-pressed={mobilePanel === 'layers'}
                  onClick={() => setMobilePanel((panel) => panel === 'layers' ? null : 'layers')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    mobilePanel === 'layers'
                      ? 'border-accent bg-accent-soft text-accent-text'
                      : 'border-border bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  {t.studio.layersButton}
                </button>
                <button
                  type="button"
                  aria-label={t.studio.togglePropertiesAria}
                  aria-expanded={mobilePanel === 'properties'}
                  aria-pressed={mobilePanel === 'properties'}
                  onClick={() => setMobilePanel((panel) => panel === 'properties' ? null : 'properties')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    mobilePanel === 'properties'
                      ? 'border-accent bg-accent-soft text-accent-text'
                      : 'border-border bg-zinc-800 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  {t.studio.propertiesButton}
                </button>
              </nav>
              {/* Both editing axes share one compact top bar. */}
              <EditingContextBar />
              <EditingContextAlert />

              {/* Canvas fills remaining height — StageCanvas takes full space */}
              <div style={{ flex: 1, position: 'relative', zIndex: 0, overflow: 'hidden' }}>
                <StageCanvas stageRef={stageRef} />
                {(scopedEditingIndicator.isFormatScoped || scopedEditingIndicator.isLocaleScoped) && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 2, pointerEvents: 'none', background: scopedEditingIndicator.horizontalFrameBackground }} />
                    <div style={{ position: 'absolute', right: 0, bottom: 0, left: 0, height: 2, pointerEvents: 'none', background: scopedEditingIndicator.horizontalFrameBackground }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, pointerEvents: 'none', background: scopedEditingIndicator.leftFrameBackground }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 2, pointerEvents: 'none', background: scopedEditingIndicator.rightFrameBackground }} />
                  </div>
                )}
              </div>
            </main>

            {/* Properties panel — always visible */}
            <aside aria-label={t.studio.propertiesSidebarAria} className={`z-20 h-full shrink-0 lg:static lg:block ${mobilePanel === 'properties' ? 'absolute inset-y-0 right-0 block shadow-2xl' : 'hidden'}`}>
              <PropertiesPanel />
            </aside>
          </div>
        </div>
        <SlideNavigator
          thumbnails={thumbnails}
          staleGroupIds={staleGroupIds}
          stageRef={stageRef}
          onCaptureThumbnail={(groupId) => { void captureNow(groupId) }}
          onOpenPreview={() => setPreviewOpen(true)}
        />

        <PreviewModal
          open={previewOpen}
          onClose={handleClosePreview}
          thumbnails={thumbnails}
          previewThumbs={previewThumbs}
          isCapturingPreview={isCapturingPreview}
          previewProgress={previewProgress}
          captureAllHighRes={captureAllHighRes}
          cancelCapture={cancelPreviewCapture}
          initialLocale={previewLocale}
        />
        <AppLoadingScreen visible={!hasCompletedInitialLoad} />
        {offscreenThumbnailElement}
      </div>
    </StudioLocaleProvider>
  )
}
