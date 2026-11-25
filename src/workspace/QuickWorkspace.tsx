/**
 * [INPUT]: depends on react, useThemeStore from @/theme/themeStore, saveToolDraft and serializeDraftImages from ./draftStorage, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, PrivacyBadge from ./uiPrimitives, on-demand dynamic imports of the 6 tool panels in ./tools/*, ./defaultEngines, and ./canvasUtils, and types from ./types
 * [OUTPUT]: exports QuickWorkspace component and tool preloader helpers (hasWorkspaceTool, preloadWorkspaceTool, preloadAllWorkspaceTools) rendering the above-the-fold 6-tool instant workspace with on-demand panel code-splitting, hover/focus chunk prefetching, global paste pulse highlight, multi-image paste switch-to-Merge banner, keyboard-navigable tablist, locale-preserving panel state, Light/Dark theming, 4-locale UI, and Studio handoff
 * [POS]: top-level UI entry point of src/workspace; mounted by ToolLandingPage and testable standalone via injected WorkspaceEngines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useThemeStore } from '@/theme/themeStore'
import { saveToolDraft, serializeDraftImages } from './draftStorage'
import { getWorkspaceStrings } from './i18n'
import { getWorkspaceThemeTokens } from './themeTokens'
import type {
  QuickWorkspaceProps,
  WorkspaceEngines,
  WorkspacePreset,
  WorkspaceToolId,
  WorkspaceToolPanelProps,
} from './types'
import { PrivacyBadge } from './uiPrimitives'

const TOOL_ORDER: WorkspaceToolId[] = ['mockup', 'merge', 'split', 'compress', 'resize', 'id-card']
const SINGLE_IMAGE_TOOLS = new Set<WorkspaceToolId>(['mockup', 'split', 'id-card'])
const SUPPORTED_IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|gif|bmp|avif|svg|heic|heif)$/i

const DEFAULT_PRESET: WorkspacePreset = { tool: 'mockup' }

type WorkspaceToolComponent = ComponentType<WorkspaceToolPanelProps>

const toolComponentRegistry = new Map<WorkspaceToolId, WorkspaceToolComponent>()
const pendingToolLoads = new Map<WorkspaceToolId, Promise<WorkspaceToolComponent>>()

function isSupportedClipboardImageFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith('image/')) return true
  return SUPPORTED_IMAGE_EXT_RE.test(file.name)
}

function importToolComponent(toolId: WorkspaceToolId): Promise<WorkspaceToolComponent> {
  switch (toolId) {
    case 'mockup':
      return import('./tools/MockupQuickTool').then((m) => m.MockupQuickTool)
    case 'merge':
      return import('./tools/MergeQuickTool').then((m) => m.MergeQuickTool)
    case 'split':
      return import('./tools/SplitQuickTool').then((m) => m.SplitQuickTool)
    case 'compress':
      return import('./tools/CompressQuickTool').then((m) => m.CompressQuickTool)
    case 'resize':
      return import('./tools/ResizeQuickTool').then((m) => m.ResizeQuickTool)
    case 'id-card':
      return import('./tools/IdCardQuickTool').then((m) => m.IdCardQuickTool)
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function hasWorkspaceTool(toolId: WorkspaceToolId): boolean {
  return toolComponentRegistry.has(toolId)
}

// eslint-disable-next-line react-refresh/only-export-components
export function preloadWorkspaceTool(toolId: WorkspaceToolId): Promise<WorkspaceToolComponent> {
  const cached = toolComponentRegistry.get(toolId)
  if (cached) return Promise.resolve(cached)

  const pending = pendingToolLoads.get(toolId)
  if (pending) return pending

  const promise = importToolComponent(toolId)
    .then((Component) => {
      toolComponentRegistry.set(toolId, Component)
      return Component
    })
    .finally(() => {
      pendingToolLoads.delete(toolId)
    })

  pendingToolLoads.set(toolId, promise)
  return promise
}

// eslint-disable-next-line react-refresh/only-export-components
export async function preloadAllWorkspaceTools(): Promise<void> {
  await Promise.all(TOOL_ORDER.map((toolId) => preloadWorkspaceTool(toolId)))
}

// Eagerly register all 6 tool panels in Node, Vite SSR, and Vitest; Rolldown
// dead-code-eliminates this branch (and its top-level await) in client builds.
if (typeof import.meta.env === 'undefined' || import.meta.env.SSR || import.meta.env.MODE === 'test') {
  await preloadAllWorkspaceTools()
}

function renderRegisteredToolPanel(
  toolId: WorkspaceToolId,
  panelKey: string,
  props: WorkspaceToolPanelProps,
): ReactNode {
  const Component = toolComponentRegistry.get(toolId)
  if (!Component) return null
  return createElement(Component, { ...props, key: panelKey })
}

let defaultEnginesPromise: Promise<WorkspaceEngines> | null = null

function loadDefaultWorkspaceEngines(): Promise<WorkspaceEngines> {
  if (!defaultEnginesPromise) {
    defaultEnginesPromise = import('./defaultEngines').then((m) => m.createDefaultWorkspaceEngines())
  }
  return defaultEnginesPromise
}

function createLazyDefaultWorkspaceEngines(): WorkspaceEngines {
  return {
    merge: async (images, options) => (await loadDefaultWorkspaceEngines()).merge(images, options),
    split: async (image, options) => (await loadDefaultWorkspaceEngines()).split(image, options),
    compress: async (images, options) => (await loadDefaultWorkspaceEngines()).compress(images, options),
    transform: async (images, options) => (await loadDefaultWorkspaceEngines()).transform(images, options),
    idCard: async (front, back, options) => (await loadDefaultWorkspaceEngines()).idCard(front, back, options),
    packZip: async (files) => (await loadDefaultWorkspaceEngines()).packZip(files),
  }
}

function ToolIcon({ tool }: { tool: WorkspaceToolId }): ReactNode {
  switch (tool) {
    case 'mockup':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2.5" y="3.5" width="15" height="11" rx="2" />
          <path d="M6.5 17h7" strokeLinecap="round" />
        </svg>
      )
    case 'merge':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2.5" y="3.5" width="6.5" height="13" rx="1.5" />
          <rect x="11" y="3.5" width="6.5" height="13" rx="1.5" />
        </svg>
      )
    case 'split':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M8 3v14M12 3v14M3 8h14M3 12h14" />
        </svg>
      )
    case 'compress':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 3v5m0 0-2.5-2.5M10 8l2.5-2.5M10 17v-5m0 0-2.5 2.5M10 12l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10h14" strokeLinecap="round" />
        </svg>
      )
    case 'resize':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 9V4h5M16 11v5h-5M4 4l5 5M16 16l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'id-card':
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <circle cx="7" cy="9.5" r="1.5" />
          <path d="M5 13c.5-1 1.2-1.4 2-1.4s1.5.4 2 1.4M11.5 8.5h3.5M11.5 11.5h2.5" strokeLinecap="round" />
        </svg>
      )
  }
}

export function QuickWorkspace({
  preset = DEFAULT_PRESET,
  locale = 'en',
  theme,
  engines,
  onOpenInStudio,
  onOpenProModal,
  onToolChange,
  className = '',
}: QuickWorkspaceProps) {
  const storeTheme = useThemeStore((state) => state.resolvedTheme)
  const resolvedTheme = theme ?? storeTheme
  const tokens = getWorkspaceThemeTokens(resolvedTheme)
  const s = getWorkspaceStrings(locale)

  const presetTool = preset.tool
  const [tabOverride, setTabOverride] = useState<{ base: WorkspaceToolId; tool: WorkspaceToolId } | null>(null)
  const activeTool = tabOverride && tabOverride.base === presetTool ? tabOverride.tool : presetTool
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [pastePulse, setPastePulse] = useState(false)
  const pastePulseTimerRef = useRef<number | null>(null)
  const [pendingMergeFiles, setPendingMergeFiles] = useState<File[] | null>(null)
  const [switchingToMerge, setSwitchingToMerge] = useState(false)
  const [mergeHydrateNonce, setMergeHydrateNonce] = useState(0)
  const [, setToolRegistryTick] = useState(0)
  const [failedTool, setFailedTool] = useState<WorkspaceToolId | null>(null)

  useEffect(() => {
    if (toolComponentRegistry.has(activeTool)) return
    let cancelled = false
    void preloadWorkspaceTool(activeTool)
      .then(() => {
        if (!cancelled) {
          setFailedTool((prev) => (prev === activeTool ? null : prev))
          setToolRegistryTick((n) => n + 1)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[Moklu] Failed to load workspace tool "${activeTool}":`, err)
          setFailedTool(activeTool)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeTool])

  const resolvedEngines = useMemo<WorkspaceEngines>(() => {
    if (
      engines?.merge &&
      engines.split &&
      engines.compress &&
      engines.transform &&
      engines.idCard &&
      engines.packZip
    ) {
      return engines as WorkspaceEngines
    }
    const defaults = createLazyDefaultWorkspaceEngines()
    return {
      merge: engines?.merge ?? defaults.merge,
      split: engines?.split ?? defaults.split,
      compress: engines?.compress ?? defaults.compress,
      transform: engines?.transform ?? defaults.transform,
      idCard: engines?.idCard ?? defaults.idCard,
      packZip: engines?.packZip ?? defaults.packZip,
    }
  }, [engines])

  const selectTool = useCallback((nextTool: WorkspaceToolId) => {
    void preloadWorkspaceTool(nextTool)
    setFailedTool((prev) => (prev === nextTool ? null : prev))
    setTabOverride({ base: presetTool, tool: nextTool })
    setPendingMergeFiles(null)
    onToolChange?.(nextTool)
  }, [onToolChange, presetTool])

  const handleRetryToolLoad = useCallback((toolId: WorkspaceToolId) => {
    setFailedTool(null)
    void preloadWorkspaceTool(toolId)
      .then(() => {
        setToolRegistryTick((n) => n + 1)
      })
      .catch((err) => {
        console.error(`[Moklu] Retry failed for workspace tool "${toolId}":`, err)
        setFailedTool(toolId)
      })
  }, [])

  // Global Cmd/Ctrl+V paste highlight pulse + multi-image switch-to-Merge prompt.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleWindowPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      setPastePulse(true)
      if (pastePulseTimerRef.current !== null) {
        window.clearTimeout(pastePulseTimerRef.current)
      }
      pastePulseTimerRef.current = window.setTimeout(() => {
        setPastePulse(false)
        pastePulseTimerRef.current = null
      }, 650)

      const items = event.clipboardData?.items
      if (!items) return
      const validFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind !== 'file') continue
        const file = item.getAsFile()
        if (file && isSupportedClipboardImageFile(file)) {
          validFiles.push(file)
        }
      }
      if (validFiles.length >= 2 && SINGLE_IMAGE_TOOLS.has(activeTool)) {
        setPendingMergeFiles(validFiles)
      }
    }
    window.addEventListener('paste', handleWindowPaste)
    return () => {
      window.removeEventListener('paste', handleWindowPaste)
      if (pastePulseTimerRef.current !== null) {
        window.clearTimeout(pastePulseTimerRef.current)
      }
    }
  }, [activeTool])

  const handleSwitchToolWithFiles = useCallback(async (targetTool: WorkspaceToolId, files: File[]) => {
    if (files.length === 0) return
    if (targetTool === 'merge') {
      setSwitchingToMerge(true)
      try {
        const [{ readFileAsImageInput }] = await Promise.all([
          import('./canvasUtils'),
          preloadWorkspaceTool('merge'),
        ])
        const loaded = await Promise.all(files.map((file) => readFileAsImageInput(file)))
        await saveToolDraft('merge', {
          images: serializeDraftImages(loaded),
          settings: {
            direction: 'vertical',
            removeOverlap: true,
            normalize: 'match-min',
            align: 'center',
            columns: 2,
            aspectCell: '1:1',
            fit: 'cover',
            gap: 0,
            padding: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#ffffff',
            background: '#ffffff',
            format: 'image/png',
            qualityPercent: 92,
          },
        })
        setPendingMergeFiles(null)
        setMergeHydrateNonce((n) => n + 1)
        selectTool('merge')
      } finally {
        setSwitchingToMerge(false)
      }
      return
    }
    selectTool(targetTool)
  }, [selectTool])

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % TOOL_ORDER.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + TOOL_ORDER.length) % TOOL_ORDER.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = TOOL_ORDER.length - 1
    }
    if (nextIndex === null) return
    event.preventDefault()
    selectTool(TOOL_ORDER[nextIndex])
    tabRefs.current[nextIndex]?.focus()
  }

  const panelKey = [
    activeTool,
    preset.mockupModel ?? '',
    preset.canvasSize ?? '',
    preset.mergeDirection ?? '',
    preset.mergeFormat ?? '',
    preset.removeOverlap ? '1' : '0',
    preset.pdfMode ?? '',
    preset.splitMode ?? '',
    preset.targetFormat ?? '',
    preset.targetSizeKb ?? '',
    preset.inspectExif ? '1' : '0',
    preset.enableRedact ? '1' : '0',
    preset.resizeMode ?? '',
    activeTool === 'merge' ? String(mergeHydrateNonce) : '',
  ].join(':')

  const panelProps: WorkspaceToolPanelProps = {
    preset: { ...preset, tool: activeTool },
    locale,
    theme: resolvedTheme,
    engines: resolvedEngines,
    onOpenInStudio,
    onOpenProModal,
    onSwitchToolWithFiles: (tool: WorkspaceToolId, files: File[]) => {
      void handleSwitchToolWithFiles(tool, files)
    },
  }

  return (
    <section
      data-testid="quick-workspace"
      data-theme={resolvedTheme}
      data-active-tool={activeTool}
      data-paste-pulse={pastePulse ? 'true' : undefined}
      aria-label={s.tabs[activeTool].label}
      className={`w-full rounded-2xl border p-3 transition-[color,background-color,box-shadow] duration-300 sm:rounded-3xl sm:p-6 ${tokens.shell} ${
        pastePulse ? 'ring-2 ring-accent/50' : ''
      } ${className}`}
    >
      {/* Multi-image paste prompt banner */}
      {pendingMergeFiles && pendingMergeFiles.length >= 2 && (
        <div
          role="status"
          data-testid="multi-paste-banner"
          className={`mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-accent/35 bg-accent-soft px-3.5 py-2.5 text-xs ${tokens.text}`}
        >
          <span className="font-semibold">
            {s.common.multiPastePrompt} ({pendingMergeFiles.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="multi-paste-switch-btn"
              disabled={switchingToMerge}
              onClick={() => void handleSwitchToolWithFiles('merge', pendingMergeFiles)}
              className={`inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {switchingToMerge ? s.common.processing : s.common.multiPasteSwitch}
            </button>
            <button
              type="button"
              data-testid="multi-paste-dismiss-btn"
              onClick={() => setPendingMergeFiles(null)}
              className={`inline-flex min-h-7 items-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${tokens.focusRing} ${tokens.pillIdle}`}
            >
              {s.common.multiPasteDismiss}
            </button>
          </div>
        </div>
      )}
      {/* Top Bar: Tool Tabs + Privacy Trust Pill */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={s.common.toolsTablistLabel}
          className={`flex items-center gap-1 overflow-x-auto rounded-2xl border p-1 ${tokens.tabBar}`}
        >
          {TOOL_ORDER.map((toolId, idx) => {
            const selected = toolId === activeTool
            return (
              <button
                key={toolId}
                ref={(el) => {
                  tabRefs.current[idx] = el
                }}
                id={`moklu-tab-${toolId}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`moklu-panel-${toolId}`}
                tabIndex={selected ? 0 : -1}
                onPointerEnter={() => {
                  void preloadWorkspaceTool(toolId)
                }}
                onFocus={() => {
                  void preloadWorkspaceTool(toolId)
                }}
                onClick={() => selectTool(toolId)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-[color,background-color,box-shadow] ${tokens.focusRing} ${
                  selected ? tokens.tabActive : tokens.tabIdle
                }`}
              >
                <ToolIcon tool={toolId} />
                <span>{s.tabs[toolId].short}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PrivacyBadge theme={resolvedTheme} label={s.common.privacyBadge} />
        </div>
      </div>

      {/* Active Tool Subheader */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={`text-base font-bold tracking-tight sm:text-lg ${tokens.text}`}>
            {s.tabs[activeTool].label}
          </h2>
          <p className={`text-xs ${tokens.textMuted}`}>{s.tabs[activeTool].description}</p>
        </div>
        <span className={`hidden text-[11px] sm:inline ${tokens.textSubtle}`}>
          {s.common.privacySubline}
        </span>
      </div>

      {/* Active Tool Panel */}
      <div
        id={`moklu-panel-${activeTool}`}
        role="tabpanel"
        aria-labelledby={`moklu-tab-${activeTool}`}
      >
        {renderRegisteredToolPanel(activeTool, panelKey, panelProps) ?? (
          <div
            role="status"
            aria-live="polite"
            data-testid="workspace-tool-loading"
            className={`flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-xs ${tokens.card} ${tokens.textMuted}`}
          >
            {failedTool === activeTool ? (
              <>
                <span>{s.common.exportError}</span>
                <button
                  type="button"
                  onClick={() => handleRetryToolLoad(activeTool)}
                  className={`inline-flex min-h-8 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonPrimary}`}
                >
                  {s.tabs[activeTool].short}
                </button>
              </>
            ) : (
              <span className="animate-pulse">{s.common.processing}</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
