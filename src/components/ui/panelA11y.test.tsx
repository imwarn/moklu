/**
 * [INPUT]: depends on vitest, react, react-dom/server, @dnd-kit/core, @dnd-kit/sortable, useEditorStore, StudioLocaleProvider, studioTokens, contextMenu, ModalShell, SegmentedControl, SortableLayerRow, LayerContextMenu, SlideNavigator, LayersPanel, PreviewModal, PropertiesPanel, SettingsModal, AiProviderSettings, HelpModal, TemplatesModal, QuickDesignModal, backdropPresets, and StageOverlays
 * [OUTPUT]: Vitest suite verifying Studio dark WCAG AA contrast, Neutral Zinc surface convergence, non-destructive canvas & PreviewModal backdrop switcher, context menu viewport clamping and ARIA roles, layer row keyboard/touch action visibility, panel ARIA attributes, and narrow-screen mobile modal/drawer responsive classes
 * [POS]: automated UI accessibility, contrast, and mobile responsiveness regression suite inside src/components/ui
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { describe, expect, it, vi } from 'vitest'
import { StudioLocaleProvider } from '@/i18n'
import { useEditorStore, type EditorStore } from '@/store'

// In Vitest's node environment, React 19's renderToStaticMarkup reads Zustand's
// frozen getInitialState() snapshot instead of live store mutations. Routing
// hook reads through getState() lets SSR markup assertions reflect active
// slide-group and layer selections set by each test.
vi.mock('@/store', async () => {
  const actual = await vi.importActual<typeof import('@/store')>('@/store')
  const liveHook = Object.assign(
    <T,>(selector?: (state: EditorStore) => T) =>
      selector ? selector(actual.useEditorStore.getState()) : actual.useEditorStore.getState(),
    actual.useEditorStore,
  )
  return { ...actual, useEditorStore: liveHook }
})
import type { GroupLayer, Layer, TextLayer } from '@/types'
import { labelCls } from '@/components/properties/panelConstants'
import { AiProviderSettings } from '@/components/ai/AiProviderSettings'
import { HelpModal } from '@/components/panels/HelpModal'
import { LayerContextMenu } from '@/components/panels/layers/LayerContextMenu'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { PreviewModal } from '@/components/panels/PreviewModal'
import { SortableChild, SortableGroup, SortableLayer } from '@/components/panels/layers/SortableLayerRow'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { QuickDesignModal } from '@/components/panels/QuickDesignModal'
import { SettingsModal } from '@/components/panels/SettingsModal'
import { SlideNavigator } from '@/components/panels/SlideNavigator'
import { TemplatesModal } from '@/components/panels/TemplatesModal'
import {
  CANVAS_BACKDROP_PRESETS,
  STUDIO_BACKDROP_STORAGE_KEY,
  loadStoredCanvasBackdrop,
  persistCanvasBackdrop,
} from '@/components/canvas/stage/backdropPresets'
import { StageChrome } from '@/components/canvas/stage/StageOverlays'
import { clampMenuPosition, placeContextMenu } from './contextMenu'
import { ModalShell } from './ModalShell'
import { SegmentedControl } from './SegmentedControl'
import { STUDIO_COLORS } from './studioTokens'

function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const srgb = parseInt(clean.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = hexToRelativeLuminance(fgHex)
  const l2 = hexToRelativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function makeTextLayer(id: string, name: string, overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id,
    type: 'text',
    name,
    x: 100,
    y: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Hello',
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 600,
    fill: '#ffffff',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    ...overrides,
  }
}

describe('Studio dark text contrast tokens (WCAG AA >= 4.5:1)', () => {
  it('meets WCAG AA 4.5:1 contrast for all Studio foreground tokens on BRAND.panel', () => {
    const bg = STUDIO_COLORS.surfacePanel
    expect(contrastRatio(STUDIO_COLORS.textPrimary, bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(STUDIO_COLORS.textMuted, bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(STUDIO_COLORS.textSubtle, bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(STUDIO_COLORS.textAccent, bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(STUDIO_COLORS.textDanger, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('converges shared labelCls, ModalShell, SegmentedControl, and SettingsModal shell onto AA tokens', () => {
    expect(labelCls).toContain('text-muted')
    expect(labelCls).not.toContain('#6b6b7a')

    const primitivesHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <ModalShell open onClose={() => {}} title="Dialog">
          <SegmentedControl
            value="a"
            options={[
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ]}
            onChange={() => {}}
          />
        </ModalShell>
      </StudioLocaleProvider>,
    )

    expect(primitivesHtml).toContain('text-muted')
    expect(primitivesHtml).not.toContain('#6b6b7a')
    expect(primitivesHtml).not.toContain('#4a4a5a')

    const settingsHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <SettingsModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    // Verify SettingsModal's own chrome (nav sidebar, headings, footer) uses AA contrast tokens.
    expect(settingsHtml).toContain('text-muted')
    expect(settingsHtml).toContain('aria-current="page"')
    expect(settingsHtml).toContain('aria-label="Settings"')
    expect(settingsHtml).toContain('class="text-[11px] text-muted hover:text-accent-text transition-colors">github.com/imwarn/moklu</a>')
  })
})

describe('Context menu viewport clamping and ARIA semantics', () => {
  it('clamps x and y inside viewport bounds with margin', () => {
    expect(clampMenuPosition(1250, 700, 160, 260, 1280, 720, 8)).toEqual({
      left: 1112,
      top: 452,
    })
    expect(clampMenuPosition(-40, -120, 160, 260, 1280, 720, 8)).toEqual({
      left: 8,
      top: 8,
    })
  })

  it('flips upward near the bottom edge and clamps horizontally when requested', () => {
    expect(placeContextMenu(1260, 690, 152, 112, 1280, 720, { flipY: true, margin: 8 })).toEqual({
      left: 1120,
      top: 578,
    })
    // Even if flipping above would push top negative on a tiny viewport, clamp keeps top >= margin.
    expect(placeContextMenu(20, 60, 152, 112, 320, 140, { flipY: true, margin: 8 })).toEqual({
      left: 20,
      top: 8,
    })
  })

  it('renders LayerContextMenu with role="menu", role="menuitem", and clamped coordinates', () => {
    const layers: Layer[] = [makeTextLayer('l1', 'Headline')]
    const html = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <LayerContextMenu
          contextMenu={{ layerId: 'l1', x: 5000, y: 5000 }}
          layers={layers}
          clipboard={null}
          onMenuAction={() => {}}
        />
      </StudioLocaleProvider>,
    )

    expect(html).toContain('role="menu"')
    expect(html).toContain('role="menuitem"')
    // Default SSR viewport fallback is 1280x720, so left/top are clamped well below 5000.
    expect(html).not.toContain('left:5000')
    expect(html).not.toContain('top:5000')
  })
})

describe('SortableLayerRow keyboard focus-within, touch visibility, and ARIA state', () => {
  it('exposes focus-within/touch visibility classes and ARIA attributes on unselected and selected rows', () => {
    const layer = makeTextLayer('layer-1', 'Title')
    const child = makeTextLayer('child-1', 'Badge')
    const group: GroupLayer = {
      id: 'group-1',
      type: 'group',
      name: 'Hero Group',
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      children: [child],
    }

    const unselectedHtml = renderToStaticMarkup(
      <DndContext>
        <SortableContext items={[layer.id, group.id]} strategy={verticalListSortingStrategy}>
          <SortableLayer
            layer={layer}
            isSelected={false}
            isMultiSelected={false}
            onSelect={() => {}}
            onCtrlSelect={() => {}}
            onContextMenu={() => {}}
            onVisibilityToggle={() => {}}
            onLockToggle={() => {}}
            onMenuOpen={() => {}}
            onRename={() => {}}
          />
          <SortableGroup
            layer={group}
            isSelected={false}
            isMultiSelected={false}
            isCollapsed={false}
            isEditingThisGroup={false}
            selectedChildId={null}
            onToggleCollapse={() => {}}
            onSelect={() => {}}
            onCtrlSelect={() => {}}
            onContextMenu={() => {}}
            onVisibilityToggle={() => {}}
            onLockToggle={() => {}}
            onMenuOpen={() => {}}
            onSelectChild={() => {}}
            onRename={() => {}}
            onRenameChild={() => {}}
          />
        </SortableContext>
      </DndContext>,
    )

    expect(unselectedHtml).toContain('group-focus-within:opacity-100')
    expect(unselectedHtml).toContain('focus-visible:opacity-100')
    expect(unselectedHtml).toContain('[@media(hover:none)]:opacity-100')
    expect(unselectedHtml).toContain('group-focus-within/child:opacity-100')
    expect(unselectedHtml).toContain('aria-pressed="true"')
    expect(unselectedHtml).toContain('aria-pressed="false"')
    expect(unselectedHtml).toContain('aria-expanded="true"')
    expect(unselectedHtml).toContain('aria-haspopup="menu"')
    expect(unselectedHtml).not.toContain('#6b6b7a')
    expect(unselectedHtml).not.toContain('#3a3a4a')

    const selectedHtml = renderToStaticMarkup(
      <DndContext>
        <SortableContext items={[layer.id, child.id]} strategy={verticalListSortingStrategy}>
          <SortableLayer
            layer={layer}
            isSelected
            isMultiSelected={false}
            onSelect={() => {}}
            onCtrlSelect={() => {}}
            onContextMenu={() => {}}
            onVisibilityToggle={() => {}}
            onLockToggle={() => {}}
            onMenuOpen={() => {}}
            onRename={() => {}}
          />
          <SortableChild
            child={child}
            groupId={group.id}
            isSelected
            onSelect={() => {}}
            onRename={() => {}}
          />
        </SortableContext>
      </DndContext>,
    )

    expect(selectedHtml).not.toContain('opacity-0')
  })
})

describe('SlideNavigator and PropertiesPanel ARIA labels and pressed states', () => {
  it('renders SlideNavigator add button with aria-label and mode buttons with aria-pressed', () => {
    const store = useEditorStore.getState()
    const prevActiveGroupId = store.activeSlideGroupId
    const firstGroupId = store.project.slideGroups[0]?.id ?? ''
    const stageRef = createRef<null>()

    try {
      if (firstGroupId) useEditorStore.setState({ activeSlideGroupId: firstGroupId })
      const html = renderToStaticMarkup(
        <StudioLocaleProvider locale="en">
          <SlideNavigator
            thumbnails={{}}
            staleGroupIds={new Set()}
            stageRef={stageRef}
            onCaptureThumbnail={() => {}}
            onOpenPreview={() => {}}
          />
        </StudioLocaleProvider>,
      )

      expect(html).toContain('aria-label="Add slide group"')
      expect(html).toContain('aria-pressed="true"')
      expect(html).toContain('aria-pressed="false"')
      expect(html).not.toContain('#6b6b7a')
      expect(html).not.toContain('#4a4a57')
    } finally {
      useEditorStore.setState({ activeSlideGroupId: prevActiveGroupId })
    }
  })

  it('renders PropertiesPanel visibility, lock, alignment, and tab ARIA attributes for a selected layer', () => {
    const prevState = useEditorStore.getState()
    const prevProject = prevState.project
    const prevSelection = prevState.selection
    const prevActiveGroupId = prevState.activeSlideGroupId
    const textLayer = makeTextLayer('prop-test-text', 'Test Headline')
    const baseGroup = prevProject.slideGroups[0]
    const patchedProject = {
      ...prevProject,
      slideGroups: prevProject.slideGroups.map((g, idx) => (
        idx === 0 ? { ...g, layers: [...g.layers, textLayer] } : g
      )),
    }

    try {
      useEditorStore.setState({
        project: patchedProject,
        activeSlideGroupId: baseGroup.id,
        selection: { slideGroupId: baseGroup.id, layerId: textLayer.id },
      })
      const html = renderToStaticMarkup(
        <StudioLocaleProvider locale="en">
          <PropertiesPanel />
        </StudioLocaleProvider>,
      )

      expect(html).toContain('role="tablist"')
      expect(html).toContain('role="tab"')
      expect(html).toContain('aria-selected="true"')
      expect(html).toContain('aria-pressed="true"')
      expect(html).toContain('aria-pressed="false"')
      expect(html).toContain('aria-label="Hide layer"')
      expect(html).toContain('aria-label="Lock layer"')
      expect(html).toContain('aria-label="Align to slide left"')
      expect(html).toContain('text-muted')
      expect(html).not.toContain('#3a3a4a')
      expect(html).not.toContain('#525261')
    } finally {
      useEditorStore.setState({
        project: prevProject,
        activeSlideGroupId: prevActiveGroupId,
        selection: prevSelection,
      })
    }
  })
})

describe('Studio mobile narrow-screen responsive layout and accessibility', () => {
  it('stacks SettingsModal navigation horizontally on mobile and uses container-query provider cards in AiProviderSettings', () => {
    const settingsHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <SettingsModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(settingsHtml).toContain('role="dialog"')
    expect(settingsHtml).toContain('aria-modal="true"')
    expect(settingsHtml).toContain('p-3 sm:p-4')
    expect(settingsHtml).toContain('h-[88dvh]')
    expect(settingsHtml).toContain('flex-col md:flex-row')
    expect(settingsHtml).toContain('w-full md:w-44')
    expect(settingsHtml).toContain('overflow-x-auto md:overflow-y-auto')
    expect(settingsHtml).toContain('hidden md:block')
    expect(settingsHtml).toContain('p-4 md:p-6')
    expect(settingsHtml).toContain('flex-wrap')
    expect(settingsHtml).not.toContain('>unknown<')

    const aiHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <AiProviderSettings />
      </StudioLocaleProvider>,
    )

    expect(aiHtml).toContain('@container')
    expect(aiHtml).toContain('grid-cols-1 @[300px]:grid-cols-2 md:grid-cols-4')
    expect(aiHtml).toContain('min-w-0 break-words')
    expect(aiHtml).toContain('OpenRouter')
  })

  it('renders HelpModal, TemplatesModal, QuickDesignModal, and side panels with dvh and narrow-screen clamping', () => {
    const helpHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <HelpModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(helpHtml).toContain('role="dialog"')
    expect(helpHtml).toContain('aria-modal="true"')
    expect(helpHtml).toContain('h-[90dvh]')
    expect(helpHtml).toContain('flex-col md:flex-row')
    expect(helpHtml).toContain('md:hidden')
    expect(helpHtml).toContain('<select')

    const templatesHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <TemplatesModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(templatesHtml).toContain('max-w-[680px]')
    expect(templatesHtml).toContain('max-h-[88dvh]')
    expect(templatesHtml).not.toContain('width:680px')

    const quickHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <QuickDesignModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(quickHtml).toContain('role="dialog"')
    expect(quickHtml).toContain('max-h-[90dvh]')

    const panelsHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <LayersPanel />
        <PropertiesPanel />
      </StudioLocaleProvider>,
    )

    expect(panelsHtml).toContain('max-w-[calc(100vw-2.5rem)]')
    expect(panelsHtml).toContain('var(--color-panel)')
    expect(panelsHtml).not.toContain('#18181f')
    expect(panelsHtml).not.toContain('#6b6b7a')
  })

  it('converges AiProviderSettings onto AA contrast tokens and renders accessible 3-tone canvas backdrop switcher', () => {
    const aiHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <AiProviderSettings />
      </StudioLocaleProvider>,
    )
    expect(aiHtml).not.toContain('#6b6b7a')
    expect(aiHtml).not.toContain('#4a4a5a')

    const baseGroup = useEditorStore.getState().project.slideGroups[0]
    const onChangeBackdrop = vi.fn()
    const chromeHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <StageChrome
          group={baseGroup}
          effectiveCompensationPx={0}
          displayHeight={600}
          zoom={0.5}
          viewportX={40}
          viewportY={40}
          editingGroupId={null}
          exitGroupEdit={() => {}}
          setZoom={() => {}}
          zoomInput={null}
          setZoomInput={() => {}}
          handleFit={() => {}}
          assetDropHighlight={null}
          spaceDown={false}
          backdropTone="light"
          onChangeBackdrop={onChangeBackdrop}
        />
      </StudioLocaleProvider>,
    )

    expect(chromeHtml).toContain('data-testid="canvas-backdrop-switcher"')
    expect(chromeHtml).toContain('role="radiogroup"')
    expect(chromeHtml).toContain('data-testid="canvas-backdrop-dark"')
    expect(chromeHtml).toContain('data-testid="canvas-backdrop-gray"')
    expect(chromeHtml).toContain('data-testid="canvas-backdrop-light"')
    expect(chromeHtml).toContain('aria-checked="true"')
    expect(chromeHtml).toContain('画布底板预览: 商店白')
    expect(CANVAS_BACKDROP_PRESETS.light.bg).toBe('#f4f4f5')
    expect(contrastRatio(CANVAS_BACKDROP_PRESETS.light.slideLabelColor, '#f4f4f5')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(CANVAS_BACKDROP_PRESETS.light.previewInactiveLabel, '#f4f4f5')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(CANVAS_BACKDROP_PRESETS.gray.slideLabelColor, '#52525b')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(CANVAS_BACKDROP_PRESETS.gray.previewInactiveLabel, '#52525b')).toBeGreaterThanOrEqual(4.5)
    expect(STUDIO_BACKDROP_STORAGE_KEY).toBe('moklu:studio-backdrop')
    expect(loadStoredCanvasBackdrop()).toBe('dark')
    expect(() => persistCanvasBackdrop('gray')).not.toThrow()

    const previewHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <PreviewModal
          open
          onClose={() => {}}
          thumbnails={{}}
          previewThumbs={{}}
          isCapturingPreview={false}
          previewProgress={{ status: 'idle', completedSlides: 0, totalSlides: 1, currentGroupName: null, source: 'cache' }}
          captureAllHighRes={() => {}}
          cancelCapture={() => {}}
          backdropTone="light"
        />
      </StudioLocaleProvider>,
    )

    expect(previewHtml).toContain('data-testid="preview-backdrop-switcher"')
    expect(previewHtml).toContain('data-testid="preview-backdrop-light"')
    expect(previewHtml).toContain('data-testid="preview-filmstrip-stage"')
    expect(previewHtml).toContain('background:#f4f4f5')
    expect(previewHtml).toContain('color:#af3b14')
    expect(previewHtml).not.toContain('#7d7a90')
    expect(previewHtml).not.toContain('#18181f')
  })
})
