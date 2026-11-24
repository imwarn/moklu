/**
 * [INPUT]: depends on react, useThemeStore from @/theme/themeStore, createDefaultWorkspaceEngines from ./defaultEngines, getWorkspaceStrings from ./i18n, getWorkspaceThemeTokens from ./themeTokens, PrivacyBadge from ./uiPrimitives, all 6 tool panels from ./tools/*, and types from ./types
 * [OUTPUT]: exports QuickWorkspace component rendering the above-the-fold 6-tool instant workspace with keyboard-navigable tablist, locale-preserving panel state, Light/Dark theming, 4-locale UI, and Studio handoff
 * [POS]: top-level UI entry point of src/workspace; mounted by ToolLandingPage and testable standalone via injected WorkspaceEngines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useThemeStore } from '@/theme/themeStore'
import { createDefaultWorkspaceEngines } from './defaultEngines'
import { getWorkspaceStrings } from './i18n'
import { getWorkspaceThemeTokens } from './themeTokens'
import { CompressQuickTool } from './tools/CompressQuickTool'
import { IdCardQuickTool } from './tools/IdCardQuickTool'
import { MergeQuickTool } from './tools/MergeQuickTool'
import { MockupQuickTool } from './tools/MockupQuickTool'
import { ResizeQuickTool } from './tools/ResizeQuickTool'
import { SplitQuickTool } from './tools/SplitQuickTool'
import type {
  QuickWorkspaceProps,
  WorkspaceEngines,
  WorkspacePreset,
  WorkspaceToolId,
} from './types'
import { PrivacyBadge } from './uiPrimitives'

const TOOL_ORDER: WorkspaceToolId[] = ['mockup', 'merge', 'split', 'compress', 'resize', 'id-card']

const DEFAULT_PRESET: WorkspacePreset = { tool: 'mockup' }

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
    const defaults = createDefaultWorkspaceEngines()
    return {
      merge: engines?.merge ?? defaults.merge,
      split: engines?.split ?? defaults.split,
      compress: engines?.compress ?? defaults.compress,
      transform: engines?.transform ?? defaults.transform,
      idCard: engines?.idCard ?? defaults.idCard,
      packZip: engines?.packZip ?? defaults.packZip,
    }
  }, [engines])

  const selectTool = (nextTool: WorkspaceToolId) => {
    setTabOverride({ base: presetTool, tool: nextTool })
    onToolChange?.(nextTool)
  }

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
    preset.splitMode ?? '',
    preset.targetFormat ?? '',
    preset.resizeMode ?? '',
  ].join(':')

  const panelProps = {
    preset: { ...preset, tool: activeTool },
    locale,
    theme: resolvedTheme,
    engines: resolvedEngines,
    onOpenInStudio,
    onOpenProModal,
  }

  return (
    <section
      data-testid="quick-workspace"
      data-theme={resolvedTheme}
      data-active-tool={activeTool}
      aria-label={s.tabs[activeTool].label}
      className={`w-full rounded-3xl border p-4 sm:p-6 transition-colors ${tokens.shell} ${className}`}
    >
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
        {activeTool === 'mockup' && <MockupQuickTool key={panelKey} {...panelProps} />}
        {activeTool === 'merge' && <MergeQuickTool key={panelKey} {...panelProps} />}
        {activeTool === 'split' && <SplitQuickTool key={panelKey} {...panelProps} />}
        {activeTool === 'compress' && <CompressQuickTool key={panelKey} {...panelProps} />}
        {activeTool === 'resize' && <ResizeQuickTool key={panelKey} {...panelProps} />}
        {activeTool === 'id-card' && <IdCardQuickTool key={panelKey} {...panelProps} />}
      </div>
    </section>
  )
}
