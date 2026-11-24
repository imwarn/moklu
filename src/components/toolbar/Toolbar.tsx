/**
 * [INPUT]: depends on react, zustand useShallow, useEditorStore/useUndoRedo from @/store, useProjectsStore from @/store/projects, toolbar buttons (BrandKitButton, Logo, ReplaceScreenshotButton, ToolbarMoreMenu) and useReplaceScreenshot, StudioIcons, useContextMenuKeyboard from @/components/ui/contextMenu, lightweight modals, lazy HelpModal wrapped in ChunkErrorBoundary, stageRegistry, export helpers, buildLocalizedPath from @/seo, and STUDIO_UI_LOCALES/useStudioLocale from @/i18n
 * [OUTPUT]: exports Toolbar component providing localized project controls, Quick Design, Canvas Size, undo/redo, PNG export, localization toggle, Studio UI language switcher, responsive ToolbarMoreMenu, and Home/Tools navigation back link
 * [POS]: top chrome bar of StudioPage inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useRef, useEffect, useCallback, lazy, Suspense, type MouseEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore, useUndoRedo } from '@/store'
import { notifyProjectConflict, useProjectsStore } from '@/store/projects'
import { ProjectConflictError } from '@/store/storage/types'
import { BrandKitButton } from '@/components/toolbar/BrandKitButton'
import { Logo } from '@/components/toolbar/Logo'
import { QuickDesignModal } from '@/components/panels/QuickDesignModal'
import { CanvasSizeModal } from '@/components/panels/CanvasSizeModal'
import { ProjectsModal } from '@/components/panels/ProjectsModal'
import { TemplatesModal } from '@/components/panels/TemplatesModal'
import { SettingsModal } from '@/components/panels/SettingsModal'
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary'
import { ReplaceScreenshotButton } from '@/components/toolbar/ReplaceScreenshotButton'
import { useReplaceScreenshot } from '@/components/toolbar/useReplaceScreenshot'
import { ToolbarMoreMenu } from '@/components/toolbar/ToolbarMoreMenu'
import {
  ArrowLeftIcon,
  CanvasSizeIcon,
  DownloadIcon,
  GitHubIcon,
  GlobeIcon,
  GroupIcon,
  HelpCircleIcon,
  LanguagesIcon,
  LoaderIcon,
  ProjectsIcon,
  RedoIcon,
  SettingsIcon,
  SparklesIcon,
  TemplatesIcon,
  UndoIcon,
} from '@/components/ui/StudioIcons'
import { useContextMenuKeyboard } from '@/components/ui/contextMenu'
import { getStage } from '@/utils/stageRegistry'
import { exportSlide, downloadDataUrl } from '@/utils/export'
import { runExclusiveCapture, waitForStageSettled } from '@/utils/stageCapture'
import { buildLocalizedPath } from '@/seo'
import { STUDIO_UI_LOCALES, useStudioLocale } from '@/i18n'

// Keep heavyweight markdown-backed HelpModal lazy and strictly mounted only when open.
const HelpModal = lazy(() =>
  import('@/components/panels/HelpModal').then((m) => ({ default: m.HelpModal })),
)

interface ToolbarProps {
  mode: 'editor' | 'localization'
  onSetMode: (mode: 'editor' | 'localization') => void
  homeHref?: string
  onNavigateHome?: () => void
}

export function Toolbar({ mode, onSetMode, homeHref = '/', onNavigateHome }: ToolbarProps) {
  const { uiLocale, t, onChangeLocale } = useStudioLocale()
  const {
    project,
    activeSlideGroupId,
    selectedLayerIds,
    createGroup,
  } = useEditorStore(useShallow((s) => ({
    project: s.project,
    activeSlideGroupId: s.activeSlideGroupId,
    selectedLayerIds: s.selectedLayerIds,
    createGroup: s.createGroup,
  })))

  const { undo, redo, canUndo, canRedo } = useUndoRedo()
  const replaceScreenshot = useReplaceScreenshot()
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const triggerReplaceScreenshot = useCallback(() => {
    replaceInputRef.current?.click()
  }, [])

  // Projects store — for save indicator + rename
  const { projects, renameProject } = useProjectsStore(
    useShallow((s) => ({
      projects: s.projects,
      renameProject: s.renameProject,
    })),
  )
  const activeProjectMeta = projects.find((p) => p.id === project.id)

  // Inline project name editing
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const displayProjectName =
    !project.name || project.name === 'Untitled Project'
      ? t.common.untitledProject
      : project.name

  function startEditingName() {
    setTempName(project.name)
    setEditingName(true)
  }

  function commitName() {
    const trimmed = tempName.trim()
    if (trimmed && trimmed !== project.name) {
      renameProject(project.id, trimmed).catch((err) => {
        if (err instanceof ProjectConflictError) notifyProjectConflict(err.projectId)
        else console.error('[Moklu] Failed to rename project', err)
      })
    }
    setEditingName(false)
  }

  function cancelName() {
    setEditingName(false)
  }

  useEffect(() => {
    if (editingName) nameInputRef.current?.select()
  }, [editingName])

  const [projectsOpen, setProjectsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [canvasSizeOpen, setCanvasSizeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [isQuickExporting, setIsQuickExporting] = useState(false)
  const [quickExportError, setQuickExportError] = useState<string | null>(null)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const langTriggerRef = useRef<HTMLButtonElement>(null)
  const langPopoverRef = useRef<HTMLDivElement>(null)

  const closeLangMenu = useCallback(() => {
    setLangMenuOpen(false)
    langTriggerRef.current?.focus({ preventScroll: true })
  }, [])

  useContextMenuKeyboard(langPopoverRef, langMenuOpen, closeLangMenu)

  useEffect(() => {
    if (!langMenuOpen) return
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [langMenuOpen])

  const activeLocaleOption =
    STUDIO_UI_LOCALES.find((item) => item.code === uiLocale) ?? STUDIO_UI_LOCALES[0]
  const activeSlideGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)

  const exportQuickPng = async () => {
    if (isQuickExporting) return
    const stage = getStage()
    if (!stage || !activeSlideGroup) return
    try {
      setIsQuickExporting(true)
      setQuickExportError(null)
      await runExclusiveCapture(async () => {
        await waitForStageSettled(stage, { timeoutMs: 1800 })
        const png = await exportSlide(stage, 0, activeSlideGroup)
        downloadDataUrl(png, 'moklu.png')
      })
    } catch (error) {
      setQuickExportError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsQuickExporting(false)
    }
  }

  // Saved indicator — flashes "Saving…" then "Saved" briefly
  const [saveLabel, setSaveLabel] = useState<'saved' | 'saving' | null>(null)
  const saveLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Show "Saved" for 2s whenever the meta updatedAt changes
    if (!activeProjectMeta) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveLabel('saved')
    if (saveLabelTimer.current) clearTimeout(saveLabelTimer.current)
    saveLabelTimer.current = setTimeout(() => setSaveLabel(null), 2000)
    return () => {
      if (saveLabelTimer.current) clearTimeout(saveLabelTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectMeta?.updatedAt])

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-1.5 border-b px-2.5 min-[1536px]:gap-2 min-[1536px]:px-3 max-[1099px]:px-2"
      style={{
        background: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Always-mounted file input shared between inline ReplaceScreenshotButton and More menu item */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-label={t.toolbar.replaceScreenshotInputAria}
        onChange={(e) => {
          void replaceScreenshot.onUpload(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />

      {/* Lightweight Studio modals are bundled inside lazy StudioPage; HelpModal stays gated & resilient */}
      <QuickDesignModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <CanvasSizeModal open={canvasSizeOpen} onClose={() => setCanvasSizeOpen(false)} />
      <ProjectsModal open={projectsOpen} onClose={() => setProjectsOpen(false)} />
      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {helpOpen && (
        <ChunkErrorBoundary
          locale={uiLocale}
          variant="inline"
          onReset={() => setHelpOpen(false)}
        >
          <Suspense fallback={null}>
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
          </Suspense>
        </ChunkErrorBoundary>
      )}

      {/* Left section — no overflow-x-auto so floating popovers are never clipped and no scrollbar appears */}
      <div
        data-testid="toolbar-left"
        className="flex min-w-0 flex-1 items-center gap-1.5 min-[1536px]:gap-2"
      >
        {/* Back to Quick Tools hub */}
        <a
          href={homeHref}
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            if (
              onNavigateHome &&
              e.button === 0 &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.shiftKey &&
              !e.altKey
            ) {
              e.preventDefault()
              onNavigateHome()
            }
          }}
          title={t.toolbar.backToToolsTitle}
          aria-label={t.toolbar.backToToolsTitle}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-[#b8b8c8] transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeftIcon size={13} />
          <span className="max-[1439px]:hidden">{t.toolbar.tools}</span>
        </a>

        {/* Logo */}
        <Logo compactOnMobile />

        {/* Current project name — click to rename inline */}
        {editingName ? (
          <input
            ref={nameInputRef}
            aria-label={t.toolbar.renameProjectTitle}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') cancelName()
            }}
            className="w-36 shrink-0 rounded-[5px] border border-accent/60 bg-white/[0.07] px-2 py-[3px] text-xs text-[#e8e8f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        ) : (
          <button
            type="button"
            onClick={startEditingName}
            title={t.toolbar.renameProjectTitle}
            className="hidden min-w-0 max-w-[clamp(72px,8vw,136px)] shrink cursor-text truncate whitespace-nowrap rounded-[5px] bg-transparent px-1.5 py-[3px] text-xs text-[#a0a0b0] transition-colors hover:bg-white/[0.05] hover:text-[#e8e8f0] min-[860px]:inline-block"
          >
            {displayProjectName}
          </button>
        )}

        {/* Projects button (inline >= 1280px; inside More menu < 1280px) */}
        <button
          type="button"
          onClick={() => setProjectsOpen(true)}
          title={t.toolbar.projectsTitle}
          aria-label={t.toolbar.projects}
          className="hidden shrink-0 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-[#a0a0b0] transition-colors hover:border-white/25 hover:text-[#e8e8f0] min-[1280px]:inline-flex min-[1536px]:px-2.5"
        >
          <ProjectsIcon size={13} />
          <span>{t.toolbar.projects}</span>
        </button>

        {/* Primary CTA: Quick Design */}
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          title={t.toolbar.quickDesignTitle}
          aria-label={t.toolbar.quickDesignAria}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-accent/50 bg-accent-soft px-2 py-1.5 text-xs font-semibold text-accent-text transition-colors hover:bg-accent/20 min-[640px]:px-2.5 min-[1536px]:px-3"
        >
          <SparklesIcon size={13} />
          <span>{t.toolbar.quickDesign}</span>
        </button>

        {/* Canvas Size (inline >= 640px; inside More menu on mobile < 640px) */}
        <button
          type="button"
          onClick={() => setCanvasSizeOpen(true)}
          title={t.toolbar.canvasSizeTitle}
          className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-[#d6d6e4] transition-colors hover:border-white/30 hover:bg-white/5 min-[640px]:inline-flex min-[1536px]:px-3"
        >
          <CanvasSizeIcon size={13} />
          <span>{t.toolbar.canvasSize}</span>
          {activeSlideGroup && (
            <span className="ml-0.5 hidden text-[#9494a8] min-[1600px]:inline">
              {activeSlideGroup.slideWidth}×{activeSlideGroup.slideHeight}
            </span>
          )}
        </button>

        {/* Replace Screenshot (inline >= 1440px; inside More menu < 1440px) */}
        <ReplaceScreenshotButton
          state={replaceScreenshot}
          onTrigger={triggerReplaceScreenshot}
          className="max-[1439px]:hidden"
        />

        {/* Templates button (inline >= 1280px; inside More menu < 1280px) */}
        <button
          type="button"
          onClick={() => setTemplatesOpen(true)}
          title={t.toolbar.templatesTitle}
          aria-label={t.toolbar.templates}
          className="hidden shrink-0 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-[#a0a0b0] transition-colors hover:border-white/25 hover:text-[#e8e8f0] min-[1280px]:inline-flex min-[1536px]:px-2.5"
        >
          <TemplatesIcon size={13} />
          <span>{t.toolbar.templates}</span>
        </button>

        {/* Brand Kit — portal popover ensures click always opens visibly at every width */}
        <BrandKitButton className="max-[639px]:hidden" />

        {quickExportError && (
          <div
            role="alert"
            title={quickExportError}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-red-400/35 bg-red-500/10 px-2 py-0.5 text-xs text-red-300"
          >
            <span className="max-w-32 truncate">{t.toolbar.exportError}</span>
            <button
              type="button"
              onClick={() => setQuickExportError(null)}
              aria-label={t.common.close}
              title={t.common.close}
              className="rounded px-0.5 text-red-200 transition-colors hover:bg-red-400/20 hover:text-white"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}

        {/* Save indicator */}
        {saveLabel && (
          <span
            role="status"
            aria-live="polite"
            className="hidden shrink-0 whitespace-nowrap text-[11px] text-[#6ee7b7]/80 min-[1180px]:inline"
          >
            {saveLabel === 'saving' ? t.toolbar.saving : t.toolbar.saved}
          </span>
        )}

        <div className="hidden h-5 w-px shrink-0 bg-[rgba(255,255,255,0.1)] min-[640px]:block" />

        {/* Undo / Redo (inline >= 640px; inside More menu on mobile < 640px) */}
        <div className="hidden shrink-0 items-center gap-0.5 min-[640px]:flex">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo}
            title={t.toolbar.undoTitle}
            aria-label={t.toolbar.undoTitle}
            className="flex h-7 w-7 items-center justify-center rounded text-[#e8e8f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:text-[#3a3a4a] disabled:opacity-40"
          >
            <UndoIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={!canRedo}
            title={t.toolbar.redoTitle}
            aria-label={t.toolbar.redoTitle}
            className="flex h-7 w-7 items-center justify-center rounded text-[#e8e8f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:text-[#3a3a4a] disabled:opacity-40"
          >
            <RedoIcon size={14} />
          </button>
        </div>

        {/* Group actions */}
        {selectedLayerIds.length >= 2 && (
          <>
            <div className="h-5 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" />
            <button
              type="button"
              onClick={() => createGroup(selectedLayerIds)}
              title={t.toolbar.groupLayersTitle}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-accent/50 bg-accent/15 px-2 py-1 text-xs text-[#e8e8f0] transition-colors hover:bg-accent/25"
            >
              <GroupIcon size={13} />
              <span>{t.toolbar.groupLayers} ({selectedLayerIds.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Right section — pinned so export, locale, and overflow menu stay reachable */}
      <div data-testid="toolbar-right" className="flex shrink-0 items-center gap-1.5 min-[1536px]:gap-2 max-[1099px]:gap-1">
        <button
          type="button"
          disabled={isQuickExporting}
          aria-busy={isQuickExporting}
          onClick={() => { void exportQuickPng() }}
          title={t.toolbar.quickPngTitle}
          aria-label={t.toolbar.quickPngTitle}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 min-[640px]:px-2.5 min-[1536px]:px-3"
        >
          {isQuickExporting ? <LoaderIcon size={13} /> : <DownloadIcon size={13} />}
          <span>PNG</span>
        </button>

        {/* Compact Studio UI Language Switcher */}
        <div ref={langMenuRef} className="relative">
          <button
            ref={langTriggerRef}
            type="button"
            data-testid="toolbar-lang-btn"
            onClick={() => setLangMenuOpen((open) => !open)}
            aria-expanded={langMenuOpen}
            aria-haspopup="menu"
            aria-label={t.toolbar.uiLanguageAria}
            title={t.toolbar.uiLanguageTitle}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-[rgba(255,255,255,0.1)] px-1.5 py-1.5 text-xs text-[#e8e8f0] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] min-[640px]:gap-1.5 min-[640px]:px-2 min-[1536px]:px-2.5"
          >
            <GlobeIcon size={13} className="text-muted" />
            <span>{activeLocaleOption.shortLabel}</span>
          </button>
          {langMenuOpen && (
            <div
              ref={langPopoverRef}
              role="menu"
              aria-label={t.toolbar.uiLanguageAria}
              tabIndex={-1}
              className="absolute right-0 top-full z-[70] mt-1.5 w-36 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b24] p-1 shadow-2xl"
            >
              {STUDIO_UI_LOCALES.map((item) => {
                const href = buildLocalizedPath(item.code, 'studio')
                const active = item.code === uiLocale
                return (
                  <a
                    key={item.code}
                    href={href}
                    hrefLang={item.code}
                    role="menuitem"
                    aria-current={active ? 'true' : undefined}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                      setLangMenuOpen(false)
                      if (
                        onChangeLocale &&
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        event.preventDefault()
                        onChangeLocale(item.code)
                      }
                    }}
                    className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                      active
                        ? 'bg-accent-soft font-medium text-accent-text'
                        : 'text-[#c2c2d0] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{item.nativeName}</span>
                    <span className="text-[10px] uppercase opacity-60">{item.code}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Settings (inline >= 1440px; inside More menu < 1440px) */}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title={t.toolbar.settingsTitle}
          aria-label={t.toolbar.settings}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 text-xs text-[#e8e8f0] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] min-[1440px]:inline-flex min-[1536px]:px-3"
        >
          <SettingsIcon size={13} />
          <span>{t.toolbar.settings}</span>
        </button>

        {/* Localization mode toggle (inline >= 768px; inside More menu < 768px) */}
        <button
          type="button"
          onClick={() => onSetMode(mode === 'localization' ? 'editor' : 'localization')}
          title={t.toolbar.localizationTitle}
          aria-label={mode === 'localization' ? t.toolbar.backToDesign : t.toolbar.localization}
          aria-pressed={mode === 'localization'}
          className={`hidden items-center gap-1.5 whitespace-nowrap rounded border px-2.5 py-1.5 text-xs transition-colors min-[768px]:inline-flex min-[1536px]:px-3 ${
            mode === 'localization'
              ? 'border-accent/50 bg-accent-soft text-white'
              : 'border-[rgba(255,255,255,0.1)] text-[#e8e8f0] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <LanguagesIcon size={13} className="min-[1024px]:hidden" />
          <span className="max-[1023px]:hidden">
            {mode === 'localization' ? t.toolbar.backToDesign : t.toolbar.localization}
          </span>
        </button>

        {/* Help (inline >= 1440px; inside More menu < 1440px) */}
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          title={t.toolbar.helpTitle}
          aria-label={t.toolbar.help}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded border border-[rgba(255,255,255,0.1)] px-2 py-1.5 text-xs text-[#a0a0b0] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8e8f0] min-[1440px]:flex min-[1720px]:px-3"
        >
          <HelpCircleIcon size={13} />
          <span className="max-[1719px]:hidden">{t.toolbar.help}</span>
        </button>

        {/* GitHub link (inline >= 1600px; inside More menu < 1600px) */}
        <a
          href="https://github.com/imwarn/moklu"
          target="_blank"
          rel="noopener noreferrer"
          title={t.toolbar.githubTitle}
          aria-label={t.toolbar.githubTitle}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded border border-[rgba(255,255,255,0.1)] px-2 py-1.5 text-xs text-[#a0a0b0] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8e8f0] min-[1600px]:flex min-[1720px]:px-3"
        >
          <GitHubIcon size={14} />
          <span className="max-[1719px]:hidden">GitHub</span>
        </a>

        {/* Responsive keyboard-accessible overflow menu (< 1600px) */}
        <ToolbarMoreMenu
          mode={mode}
          canUndo={canUndo}
          canRedo={canRedo}
          replaceScreenshot={replaceScreenshot}
          onUndo={() => undo()}
          onRedo={() => redo()}
          onOpenCanvasSize={() => setCanvasSizeOpen(true)}
          onOpenProjects={() => setProjectsOpen(true)}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onTriggerReplaceScreenshot={triggerReplaceScreenshot}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleLocalization={() => onSetMode(mode === 'localization' ? 'editor' : 'localization')}
          onOpenHelp={() => setHelpOpen(true)}
        />
      </div>
    </header>
  )
}
