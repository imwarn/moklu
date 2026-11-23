/**
 * [INPUT]: depends on react, zustand useShallow, useEditorStore/useUndoRedo from @/store, useProjectsStore from @/store/projects, toolbar buttons, statically imported lightweight modals (QuickDesignModal, CanvasSizeModal, ProjectsModal, TemplatesModal, SettingsModal), lazy HelpModal wrapped in ChunkErrorBoundary, stageRegistry, export helpers, buildLocalizedPath from @/seo, and STUDIO_UI_LOCALES/useStudioLocale from @/i18n
 * [OUTPUT]: exports Toolbar component providing localized project controls, Quick Design, Canvas Size, undo/redo, PNG export, localization toggle, Studio UI language switcher, and Home/Tools navigation back link
 * [POS]: top chrome bar of StudioPage inside src/components/toolbar
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState, useRef, useEffect, lazy, Suspense, type MouseEvent } from 'react'
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
    selectedLayerIds,
    createGroup,
  } = useEditorStore(useShallow((s) => ({
    project: s.project,
    selectedLayerIds: s.selectedLayerIds,
    createGroup: s.createGroup,
  })))

  const { undo, redo, canUndo, canRedo } = useUndoRedo()

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
  const [quickExportError, setQuickExportError] = useState<string | null>(null)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!langMenuOpen) return
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLangMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [langMenuOpen])

  const activeLocaleOption =
    STUDIO_UI_LOCALES.find((item) => item.code === uiLocale) ?? STUDIO_UI_LOCALES[0]

  const exportQuickPng = async () => {
    const stage = getStage()
    const group = project.slideGroups.find((g) => g.id === useEditorStore.getState().activeSlideGroupId)
    if (!stage || !group) return
    try {
      setQuickExportError(null)
      await runExclusiveCapture(async () => {
        await waitForStageSettled(stage, { timeoutMs: 1800 })
        const png = await exportSlide(stage, 0, group)
        downloadDataUrl(png, 'moklu.png')
      })
    } catch (error) {
      setQuickExportError(error instanceof Error ? error.message : String(error))
    }
  }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

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

  const activeSlideGroup = project.slideGroups.find(
    (g) => g.id === useEditorStore.getState().activeSlideGroupId,
  )

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-2 border-b px-3 max-[1099px]:gap-2 max-[1099px]:px-2"
      style={{
        background: '#18181f',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
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

      <div
        data-testid="toolbar-left"
        className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto max-[1099px]:gap-2"
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
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-[#b8b8c8] transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          <span className="max-[1099px]:hidden">{t.toolbar.tools}</span>
        </a>

        {/* Logo */}
        <Logo />

        {/* Current project name — click to rename inline */}
        {editingName ? (
          <input
            ref={nameInputRef}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') cancelName()
            }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(124,110,246,0.6)',
              borderRadius: 5,
              color: '#e8e8f0',
              fontSize: 12,
              padding: '3px 8px',
              width: 160,
              outline: 'none',
              flexShrink: 0,
            }}
          />
        ) : (
          <button
            onClick={startEditingName}
            title={t.toolbar.renameProjectTitle}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0b0',
              cursor: 'text',
              fontSize: 12,
              padding: '3px 6px',
              borderRadius: 5,
              maxWidth: 'clamp(96px, 14vw, 180px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#a0a0b0'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
            }}
          >
            {displayProjectName}
          </button>
        )}

        {/* Projects button */}
        <button
          onClick={() => setProjectsOpen(true)}
          title={t.toolbar.projectsTitle}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#a0a0b0',
            cursor: 'pointer',
            fontSize: 12,
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a0a0b0'
          }}
        >
          <span className="min-[1100px]:hidden">▦</span>
          <span className="max-[1099px]:hidden">{t.toolbar.projects}</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          title={t.toolbar.quickDesignTitle}
          aria-label={t.toolbar.quickDesignAria}
          className="shrink-0 rounded-lg border border-[#8276e8]/60 bg-[#8276e8]/20 px-3 py-1.5 text-xs font-semibold text-[#d6d1ff] hover:bg-[#8276e8]/30"
        >
          ✦ {t.toolbar.quickDesign}
        </button>

        <button
          type="button"
          onClick={() => setCanvasSizeOpen(true)}
          title={t.toolbar.canvasSizeTitle}
          className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#d6d6e4] hover:border-white/30 hover:bg-white/5"
        >
          ▣ {t.toolbar.canvasSize}
          {activeSlideGroup && (
            <span className="ml-1 hidden text-[#888a9d] min-[1350px]:inline">
              {activeSlideGroup.slideWidth}×{activeSlideGroup.slideHeight}
            </span>
          )}
        </button>

        <ReplaceScreenshotButton />

        {/* Templates button */}
        <button
          onClick={() => setTemplatesOpen(true)}
          title={t.toolbar.templatesTitle}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#a0a0b0',
            cursor: 'pointer',
            fontSize: 12,
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a0a0b0'
          }}
        >
          <span>🗂</span>
          <span className="max-[1099px]:hidden">{t.toolbar.templates}</span>
        </button>

        <BrandKitButton />

        {quickExportError && (
          <span title={quickExportError} className="max-w-32 truncate text-xs text-red-400">
            {t.toolbar.exportError}
          </span>
        )}

        {/* Save indicator */}
        {saveLabel && (
          <span style={{ fontSize: 11, color: '#6ee7b7', opacity: 0.8, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {saveLabel === 'saving' ? t.toolbar.saving : t.toolbar.saved}
          </span>
        )}

        <div className="h-6 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            title={t.toolbar.undoTitle}
            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: canUndo ? '#e8e8f0' : '#3a3a4a' }}
          >
            ↩
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            title={t.toolbar.redoTitle}
            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: canRedo ? '#e8e8f0' : '#3a3a4a' }}
          >
            ↪
          </button>
        </div>

        <div className="h-6 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" />

        {/* Group actions */}
        <div className="flex items-center gap-1.5">
          {selectedLayerIds.length >= 2 && (
            <button
              onClick={() => createGroup(selectedLayerIds)}
              title={t.toolbar.groupLayersTitle}
              className="text-xs text-[#e8e8f0] px-2.5 py-1 rounded border border-[rgba(124,110,246,0.5)] bg-[rgba(124,110,246,0.15)] hover:bg-[rgba(124,110,246,0.25)] transition-colors"
            >
              ⊞ {t.toolbar.groupLayers} ({selectedLayerIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Right section — pinned so Settings/Help/Language/GitHub never scroll out of reach */}
      <button
        type="button"
        onClick={() => { void exportQuickPng() }}
        title={t.toolbar.quickPngTitle}
        className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10"
      >
        ↓ PNG
      </button>
      <div data-testid="toolbar-right" className="flex shrink-0 items-center gap-2 max-[1099px]:gap-1">
        {/* Compact Studio UI Language Switcher */}
        <div ref={langMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setLangMenuOpen((open) => !open)}
            aria-expanded={langMenuOpen}
            aria-haspopup="menu"
            aria-label={t.toolbar.uiLanguageAria}
            title={t.toolbar.uiLanguageTitle}
            className="inline-flex items-center gap-1 rounded border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 text-xs text-[#e8e8f0] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <span aria-hidden="true">🌐</span>
            <span>{activeLocaleOption.shortLabel}</span>
          </button>
          {langMenuOpen && (
            <div
              role="menu"
              aria-label={t.toolbar.uiLanguageAria}
              className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-lg border border-white/15 bg-[#1b1b24] p-1 shadow-2xl"
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
                    className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      active
                        ? 'bg-[rgba(124,110,246,0.24)] font-medium text-[#d8d1ff]'
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

        <button
          onClick={() => setSettingsOpen(true)}
          title={t.toolbar.settingsTitle}
          className="inline-flex items-center gap-1.5 text-xs text-[#e8e8f0] px-3 py-1.5 rounded border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <span aria-hidden="true">⚙</span>
          <span className="max-[1099px]:hidden">{t.toolbar.settings}</span>
        </button>

        <button
          onClick={() => onSetMode(mode === 'localization' ? 'editor' : 'localization')}
          title={t.toolbar.localizationTitle}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            mode === 'localization'
              ? 'text-white bg-[rgba(124,110,246,0.22)] border-[rgba(124,110,246,0.45)]'
              : 'text-[#e8e8f0] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <span className="max-[1099px]:hidden">
            {mode === 'localization' ? t.toolbar.backToDesign : t.toolbar.localization}
          </span>
          <span className="min-[1100px]:hidden">◉</span>
        </button>

        <button
          onClick={() => setHelpOpen(true)}
          title={t.toolbar.helpTitle}
          className="flex items-center gap-1.5 text-xs text-[#a0a0b0] px-3 py-1.5 rounded border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8e8f0] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="max-[1099px]:hidden">{t.toolbar.help}</span>
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/imwarn/moklu"
          target="_blank"
          rel="noopener noreferrer"
          title={t.toolbar.githubTitle}
          className="flex items-center gap-1.5 text-xs text-[#a0a0b0] px-3 py-1.5 rounded border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8e8f0] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          <span className="max-[1099px]:hidden">GitHub</span>
        </a>
      </div>
    </header>
  )
}
