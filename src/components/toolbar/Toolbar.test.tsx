/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, @/store (mocked selector for SSR subscription verification), StudioLocaleProvider from @/i18n, ./Toolbar, ./BrandKitButton, and @/components/panels/LayersPanel
 * [OUTPUT]: Vitest unit tests verifying Toolbar store subscription, SVG icon accessibility, absence of overflow-x-auto clipping on toolbar-left, keyboard-accessible More menu trigger, BrandKitButton dialog popover rendering, and Emoji-free Insert/Toolbar icons
 * [POS]: automated unit and regression test suite for src/components/toolbar/Toolbar.tsx and BrandKitButton.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { StudioLocaleProvider } from '@/i18n'

const mockStore = vi.hoisted(() => {
  const groupA = {
    id: 'group-a',
    name: 'Hero',
    numSlides: 1,
    slideWidth: 1290,
    slideHeight: 2796,
    layers: [],
  }
  const groupB = {
    id: 'group-b',
    name: 'Tablet',
    numSlides: 1,
    slideWidth: 2048,
    slideHeight: 1536,
    layers: [],
  }
  const project = {
    id: 'proj-1',
    name: 'Demo App',
    slideGroups: [groupA, groupB],
    settings: {
      defaultLocale: 'en',
      locales: ['en'],
      brandColors: [],
      pano: { gapPx: 24, compensate: false },
    },
  }
  const state = {
    project,
    activeSlideGroupId: 'group-a',
    selectedLayerIds: [] as string[],
    createGroup: vi.fn(),
    activeCanvasFormat: 'base',
    activeLocale: 'en',
    selection: null,
    editingGroupId: null,
    select: vi.fn(),
    addPhone: vi.fn(),
    addText: vi.fn(),
    addShape: vi.fn(),
    addEmoji: vi.fn(),
    addChipGroup: vi.fn(),
    addBrand: vi.fn(),
    addImage: vi.fn(),
    removeLayer: vi.fn(),
    duplicateLayer: vi.fn(),
    moveLayerUp: vi.fn(),
    moveLayerDown: vi.fn(),
    setLayerVisibility: vi.fn(),
    setLayerLocked: vi.fn(),
    reorderLayers: vi.fn(),
    dissolveGroup: vi.fn(),
    toggleLayerSelection: vi.fn(),
    setMultiSelection: vi.fn(),
    clearMultiSelection: vi.fn(),
    copyLayers: vi.fn(),
    cutLayers: vi.fn(),
    pasteLayers: vi.fn(),
    clipboard: null,
    reorderGroupChildren: vi.fn(),
    moveLayerIntoGroup: vi.fn(),
    moveChildToTopLevel: vi.fn(),
    moveChildBetweenGroups: vi.fn(),
    updateChildLayer: vi.fn(),
    addBrandColor: vi.fn(),
    updateBrandColor: vi.fn(),
    removeBrandColor: vi.fn(),
    addSlideGroup: vi.fn(),
    updateSlideGroup: vi.fn(),
    updateLayer: vi.fn(),
  }
  const getState = vi.fn(() => ({ ...state, activeSlideGroupId: 'stale-group-id' }))
  const useEditorStore = Object.assign(
    <T,>(selector?: (s: typeof state) => T) => (selector ? selector(state) : state),
    { getState, subscribe: vi.fn(() => () => {}) },
  )
  return { state, getState, useEditorStore }
})

vi.mock('@/store', () => ({
  useEditorStore: mockStore.useEditorStore,
  useUndoRedo: () => ({
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
  }),
}))

import { Toolbar } from './Toolbar'
import { BrandKitButton } from './BrandKitButton'
import { LayersPanel } from '@/components/panels/LayersPanel'

describe('Toolbar', () => {
  it('subscribes to activeSlideGroupId through the store selector rather than reading getState()', () => {
    mockStore.state.activeSlideGroupId = 'group-a'
    const htmlA = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="editor" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )
    expect(htmlA).toContain('1290×2796')
    expect(htmlA).not.toContain('2048×1536')

    mockStore.state.activeSlideGroupId = 'group-b'
    const htmlB = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="editor" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )
    expect(htmlB).toContain('2048×1536')
    expect(htmlB).not.toContain('1290×2796')
  })

  it('provides aria-labels, SVG icons without emojis, and a keyboard-accessible More menu trigger', () => {
    const editorHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="editor" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(editorHtml).toContain('aria-label="Back to Home &amp; Quick Tools"')
    expect(editorHtml).toContain('aria-label="Projects"')
    expect(editorHtml).toContain('aria-label="Templates"')
    expect(editorHtml).toContain('aria-label="Brand Kit"')
    expect(editorHtml).toContain('aria-label="Undo (Ctrl+Z)"')
    expect(editorHtml).toContain('aria-label="Redo (Ctrl+Shift+Z)"')
    expect(editorHtml).toContain('aria-label="Settings"')
    expect(editorHtml).toContain('aria-label="Localization"')
    expect(editorHtml).toContain('aria-pressed="false"')
    expect(editorHtml).toContain('aria-label="Help"')
    expect(editorHtml).toContain('aria-label="View on GitHub"')
    expect(editorHtml).toContain('aria-busy="false"')
    expect(editorHtml).toContain('data-testid="toolbar-more-btn"')
    expect(editorHtml).toContain('aria-haspopup="menu"')
    expect(editorHtml).toContain('aria-label="More actions"')

    // Regression guard: toolbar-left must never use overflow-x-auto (which forces overflow-y:auto and clips popovers).
    expect(editorHtml).not.toContain('overflow-x-auto')

    // Regression guard: no Emoji icons remain in Toolbar chrome.
    for (const emoji of ['🎨', '🗂', '🌐', '⏳']) {
      expect(editorHtml).not.toContain(emoji)
    }

    const locHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="localization" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )
    expect(locHtml).toContain('aria-label="Back to Design"')
    expect(locHtml).toContain('aria-pressed="true"')

    const zhHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <Toolbar mode="editor" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )
    expect(zhHtml).toContain('aria-label="更多操作"')
    expect(zhHtml).toContain('aria-label="品牌色板"')
  })

  it('renders BrandKitButton dialog popover as a fixed floating layer with ARIA attributes', () => {
    const closedHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <BrandKitButton />
      </StudioLocaleProvider>,
    )
    expect(closedHtml).toContain('data-testid="brand-kit-btn"')
    expect(closedHtml).toContain('aria-expanded="false"')
    expect(closedHtml).toContain('aria-haspopup="dialog"')
    expect(closedHtml).not.toContain('data-testid="brand-kit-popover"')
    expect(closedHtml).not.toContain('🎨')

    const openHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <BrandKitButton defaultOpen />
      </StudioLocaleProvider>,
    )
    expect(openHtml).toContain('aria-expanded="true"')
    expect(openHtml).toContain('data-testid="brand-kit-popover"')
    expect(openHtml).toContain('role="dialog"')
    expect(openHtml).toContain('fixed z-[70]')
    expect(openHtml).toContain('No colors yet.')
  })

  it('renders Insert panel tools in LayersPanel with SVG icons instead of Emoji glyphs', () => {
    const layersHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <LayersPanel />
      </StudioLocaleProvider>,
    )
    expect(layersHtml).toContain('<svg')
    for (const emoji of ['😀', '🏷', '🖼', '🎨', '🔒', '🔓']) {
      expect(layersHtml).not.toContain(emoji)
    }
  })
})
