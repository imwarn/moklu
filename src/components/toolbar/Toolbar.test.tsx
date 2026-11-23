/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, @/store (mocked selector for SSR subscription verification), StudioLocaleProvider from @/i18n, and ./Toolbar
 * [OUTPUT]: Vitest unit tests verifying Toolbar subscribes to activeSlideGroupId via Zustand selector, renders aria-labels and aria-hidden glyphs, and reflects mode toggle semantics
 * [POS]: automated unit test suite for src/components/toolbar/Toolbar.tsx
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

  it('provides aria-labels and aria-hidden decorative glyphs for compact icon buttons and mode toggle', () => {
    const editorHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="editor" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(editorHtml).toContain('aria-label="Back to Home &amp; Quick Tools"')
    expect(editorHtml).toContain('aria-label="Projects"')
    expect(editorHtml).toContain('aria-hidden="true" class="min-[1100px]:hidden">▦</span>')
    expect(editorHtml).toContain('aria-label="Templates"')
    expect(editorHtml).toContain('<span aria-hidden="true">🗂</span>')
    expect(editorHtml).toContain('aria-label="Undo (Ctrl+Z)"')
    expect(editorHtml).toContain('<span aria-hidden="true">↩</span>')
    expect(editorHtml).toContain('aria-label="Redo (Ctrl+Shift+Z)"')
    expect(editorHtml).toContain('<span aria-hidden="true">↪</span>')
    expect(editorHtml).toContain('aria-label="Settings"')
    expect(editorHtml).toContain('aria-label="Localization"')
    expect(editorHtml).toContain('aria-pressed="false"')
    expect(editorHtml).toContain('aria-hidden="true" class="min-[1100px]:hidden">◉</span>')
    expect(editorHtml).toContain('aria-label="Help"')
    expect(editorHtml).toContain('aria-label="View on GitHub"')
    expect(editorHtml).toContain('aria-busy="false"')

    const locHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <Toolbar mode="localization" onSetMode={() => {}} />
      </StudioLocaleProvider>,
    )
    expect(locHtml).toContain('aria-label="Back to Design"')
    expect(locHtml).toContain('aria-pressed="true"')
  })
})
