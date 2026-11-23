/**
 * [INPUT]: depends on vitest, resolveMultiDragStartPositions from ./multiDrag, computeViewportTransition and shouldIgnoreSpacePanTarget from ./useStageViewport, and Project/SlideGroup/TextLayer types
 * [OUTPUT]: Vitest suite verifying view-resolved multi-select drag coordinates, unified viewport fit vs same-family relative zoom transitions, and Space pan interactive target filtering
 * [POS]: automated canvas interaction regression suite inside src/components/canvas/stage
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { describe, expect, it } from 'vitest'
import type { GroupLayer, Project, SlideGroup, TextLayer } from '@/types'
import { resolveMultiDragStartPositions } from './multiDrag'
import {
  computeFitViewport,
  computeViewportTransition,
  shouldIgnoreSpacePanTarget,
  type ViewportSnapshot,
} from './useStageViewport'

function makeText(id: string, x: number, y: number, extra: Partial<TextLayer> = {}): TextLayer {
  return {
    id,
    type: 'text',
    name: id,
    x,
    y,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: id,
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: 600,
    fill: '#ffffff',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    ...extra,
  }
}

function makeProject(group: SlideGroup): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    createdAt: '',
    updatedAt: '',
    settings: {
      defaultSlideWidth: 1320,
      defaultSlideHeight: 2868,
      defaultLocale: 'en',
      locales: ['en', 'ja'],
      brandName: 'Moklu',
      activeFormats: ['iphone-69', 'ipad-13'],
    },
    slideGroups: [group],
  }
}

describe('resolveMultiDragStartPositions', () => {
  it('uses resolved format-override coordinates instead of raw Base coordinates for secondary layers', () => {
    const primary = makeText('l1', 100, 100)
    const secondary = makeText('l2', 200, 300, {
      formatOverrides: {
        'ipad-13': { x: 640, y: 820 },
      },
    })
    const group: SlideGroup = {
      id: 'g1',
      name: 'Slide 1',
      numSlides: 1,
      slideWidth: 1320,
      slideHeight: 2868,
      slideNames: ['s1'],
      layers: [primary, secondary],
    }
    const project = makeProject(group)

    const positions = resolveMultiDragStartPositions({
      project,
      activeSlideGroupId: 'g1',
      activeLocale: 'en',
      activeCanvasFormat: 'ipad-13',
      editingGroupId: null,
      selectedLayerIds: ['l1', 'l2'],
      draggingLayerId: 'l1',
      findNodePos: () => ({ x: 640, y: 820 }),
    })

    expect(positions.get('l2')).toEqual({
      nodeX: 640,
      nodeY: 820,
      layerX: 640,
      layerY: 820,
    })
  })

  it('uses resolved localeAdjust coordinates in non-default locale views and skips locked layers', () => {
    const primary = makeText('l1', 100, 100)
    const secondary = makeText('l2', 200, 300, {
      localeAdjust: {
        ja: {
          'iphone-69': { dx: 40, dy: 80 },
        },
      },
    })
    const lockedLayer = makeText('l3', 400, 500, { locked: true })
    const group: SlideGroup = {
      id: 'g1',
      name: 'Slide 1',
      numSlides: 1,
      slideWidth: 1320,
      slideHeight: 2868,
      slideNames: ['s1'],
      layers: [primary, secondary, lockedLayer],
    }
    const project = makeProject(group)

    const positions = resolveMultiDragStartPositions({
      project,
      activeSlideGroupId: 'g1',
      activeLocale: 'ja',
      activeCanvasFormat: 'iphone-69',
      editingGroupId: null,
      selectedLayerIds: ['l1', 'l2', 'l3'],
      draggingLayerId: 'l1',
      findNodePos: (id) => (id === 'l2' ? { x: 240, y: 380 } : { x: 400, y: 500 }),
    })

    expect(positions.get('l2')).toEqual({
      nodeX: 240,
      nodeY: 380,
      layerX: 240,
      layerY: 380,
    })
    expect(positions.has('l3')).toBe(false)
  })

  it('resolves child coordinates when editing inside a group', () => {
    const childA = makeText('c1', 10, 20)
    const childB = makeText('c2', 30, 40, {
      localeAdjust: {
        ja: {
          'iphone-69': { dx: 45, dy: 55 },
        },
      },
    })
    const groupLayer: GroupLayer = {
      id: 'grp',
      type: 'group',
      name: 'Group',
      x: 100,
      y: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      children: [childA, childB],
    }
    const group: SlideGroup = {
      id: 'g1',
      name: 'Slide 1',
      numSlides: 1,
      slideWidth: 1320,
      slideHeight: 2868,
      slideNames: ['s1'],
      layers: [groupLayer],
    }
    const project = makeProject(group)

    const positions = resolveMultiDragStartPositions({
      project,
      activeSlideGroupId: 'g1',
      activeLocale: 'ja',
      activeCanvasFormat: 'iphone-69',
      editingGroupId: 'grp',
      selectedLayerIds: ['c1', 'c2'],
      draggingLayerId: 'c1',
      findNodePos: () => ({ x: 75, y: 95 }),
    })

    expect(positions.get('c2')).toEqual({
      nodeX: 75,
      nodeY: 95,
      layerX: 75,
      layerY: 95,
    })
  })
})

describe('computeViewportTransition', () => {
  const baseSnapshot: ViewportSnapshot = {
    groupId: 'g1',
    family: 'phone',
    format: 'iphone-69',
    totalW: 1320,
    totalH: 2868,
    containerW: 1000,
  }

  it('fits the canvas on initial mount', () => {
    const next = computeViewportTransition({
      prev: null,
      next: baseSnapshot,
      containerH: 800,
      current: { zoom: 1, viewportX: 0, viewportY: 0 },
    })

    expect(next).toEqual(computeFitViewport(1320, 2868, 1000, 800, 32))
  })

  it('preserves user zoom (rescaled by diagonal ratio) and relative pan when switching format within the same family', () => {
    const userZoom = 1.5
    // User panned so relative canvas point (fx=0.25, fy=0.3) is at viewport center (500, 400).
    const startVpX = 500 - 0.25 * 1320 * userZoom
    const startVpY = 400 - 0.3 * 2868 * userZoom

    const next = computeViewportTransition({
      prev: baseSnapshot,
      next: {
        ...baseSnapshot,
        format: 'android-phone',
        totalW: 1080,
        totalH: 1920,
      },
      containerH: 800,
      current: { zoom: userZoom, viewportX: startVpX, viewportY: startVpY },
    })

    expect(next).not.toBeNull()
    const expectedRatio = Math.hypot(1320, 2868) / Math.hypot(1080, 1920)
    const expectedZoom = userZoom * expectedRatio
    expect(next!.zoom).toBeCloseTo(expectedZoom, 6)
    // Verify the exact same relative point (0.25, 0.3) stays centered on screen.
    const nextCenterX = (500 - next!.viewportX) / next!.zoom
    const nextCenterY = (400 - next!.viewportY) / next!.zoom
    expect(nextCenterX / 1080).toBeCloseTo(0.25, 6)
    expect(nextCenterY / 1920).toBeCloseTo(0.3, 6)
  })

  it('performs a full fit with manual padding when switching device families', () => {
    const next = computeViewportTransition({
      prev: baseSnapshot,
      next: {
        groupId: 'g-watch',
        family: 'watch',
        format: 'apple-watch',
        totalW: 410,
        totalH: 502,
        containerW: 1000,
      },
      containerH: 800,
      current: { zoom: 1.5, viewportX: 100, viewportY: 100 },
    })

    expect(next).toEqual(computeFitViewport(410, 502, 1000, 800, 80))
  })

  it('fits when canvas geometry changes within the same format (e.g. Single -> Pano)', () => {
    const next = computeViewportTransition({
      prev: baseSnapshot,
      next: {
        ...baseSnapshot,
        totalW: 2664,
      },
      containerH: 800,
      current: { zoom: 1.2, viewportX: 0, viewportY: 0 },
    })

    expect(next).toEqual(computeFitViewport(2664, 2868, 1000, 800, 32))
  })

  it('keeps user zoom on container resize when canvas still fits, and returns null on no-op', () => {
    const resized = computeViewportTransition({
      prev: baseSnapshot,
      next: { ...baseSnapshot, containerW: 900 },
      containerH: 800,
      current: { zoom: 0.2, viewportX: 50, viewportY: 50 },
    })
    expect(resized).toEqual({
      zoom: 0.2,
      viewportX: (900 - 1320 * 0.2) / 2,
      viewportY: (800 - 2868 * 0.2) / 2,
    })

    const noop = computeViewportTransition({
      prev: baseSnapshot,
      next: baseSnapshot,
      containerH: 800,
      current: { zoom: 0.2, viewportX: 50, viewportY: 50 },
    })
    expect(noop).toBeNull()
  })
})

describe('shouldIgnoreSpacePanTarget', () => {
  const fakeEl = (tagName: string, opts?: { isContentEditable?: boolean; matchesSelector?: boolean }) =>
    ({
      tagName,
      isContentEditable: Boolean(opts?.isContentEditable),
      closest: () => (opts?.matchesSelector ? {} : null),
    }) as unknown as Element

  it('ignores interactive form controls, buttons, links, contenteditable, and ARIA interactive/dialog targets', () => {
    expect(shouldIgnoreSpacePanTarget(fakeEl('INPUT'))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('TEXTAREA'))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('SELECT'))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('BUTTON'))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('A'))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('DIV', { isContentEditable: true }))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('SPAN', { matchesSelector: true }))).toBe(true)
    expect(shouldIgnoreSpacePanTarget(fakeEl('DIV'), fakeEl('BUTTON'))).toBe(true)
  })

  it('allows Space panning when focus/target is on non-interactive canvas container or body', () => {
    expect(shouldIgnoreSpacePanTarget(fakeEl('DIV'), fakeEl('BODY'))).toBe(false)
    expect(shouldIgnoreSpacePanTarget(null, null)).toBe(false)
  })
})
