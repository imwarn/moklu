/**
 * [INPUT]: depends on vitest, redact helpers from ./redact, and WorkspaceRedactionRegion from ./types
 * [OUTPUT]: Vitest suite verifying normalized coordinate clamping, drag/resize/move math, mockup stage projection, and blur/pixelate/spotlight canvas rendering
 * [POS]: dedicated unit test suite for src/workspace/redact.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { describe, expect, it, vi } from 'vitest'
import {
  applyRedactionsToCanvas,
  clampNormalizedRegion,
  computeMockupStageMetrics,
  imageNormRectToStageNorm,
  moveRegionByDelta,
  normalizeDragBox,
  resizeRegionByCorner,
  stagePointToImageNorm,
  type RedactCanvasLike,
} from './redact'
import type { WorkspaceRedactionRegion } from './types'

interface MockCtxRecord {
  filterHistory: string[]
  smoothingHistory: boolean[]
  fillStyles: string[]
  strokeStyles: string[]
  shadowBlurs: number[]
  drawImageCalls: unknown[][]
  fillRectCalls: number[][]
}

function createMockCanvas(width: number, height: number): { canvas: RedactCanvasLike; record: MockCtxRecord } {
  const record: MockCtxRecord = {
    filterHistory: [],
    smoothingHistory: [],
    fillStyles: [],
    strokeStyles: [],
    shadowBlurs: [],
    drawImageCalls: [],
    fillRectCalls: [],
  }
  let currentFilter = 'none'
  let currentSmoothing = true
  let currentFill = ''
  let currentStroke = ''
  let currentShadowBlur = 0

  const ctx = {
    canvas: null as unknown as HTMLCanvasElement,
    get filter() {
      return currentFilter
    },
    set filter(val: string) {
      currentFilter = val
      record.filterHistory.push(val)
    },
    get imageSmoothingEnabled() {
      return currentSmoothing
    },
    set imageSmoothingEnabled(val: boolean) {
      currentSmoothing = val
      record.smoothingHistory.push(val)
    },
    get fillStyle() {
      return currentFill
    },
    set fillStyle(val: string) {
      currentFill = val
      record.fillStyles.push(val)
    },
    get strokeStyle() {
      return currentStroke
    },
    set strokeStyle(val: string) {
      currentStroke = val
      record.strokeStyles.push(val)
    },
    get shadowBlur() {
      return currentShadowBlur
    },
    set shadowBlur(val: number) {
      currentShadowBlur = val
      record.shadowBlurs.push(val)
    },
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineWidth: 1,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn((...args: unknown[]) => {
      record.drawImageCalls.push(args)
    }),
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      record.fillRectCalls.push([x, y, w, h])
    }),
  }

  const canvas: RedactCanvasLike = {
    width,
    height,
    getContext: () => ctx as unknown as CanvasRenderingContext2D,
  }
  ctx.canvas = canvas as unknown as HTMLCanvasElement
  return { canvas, record }
}

describe('redact coordinate math', () => {
  it('clamps normalized regions and enforces valid intensity ranges', () => {
    const blur = clampNormalizedRegion({
      id: 'b1',
      kind: 'blur',
      x: -0.2,
      y: 0.9,
      width: 1.5,
      height: 0.5,
      intensity: 100,
    })
    expect(blur.x).toBe(0)
    expect(blur.y).toBe(0.9)
    expect(blur.width).toBe(1)
    expect(blur.height).toBe(0.1)
    expect(blur.intensity).toBe(48)

    const spot = clampNormalizedRegion({
      id: 's1',
      kind: 'spotlight',
      x: 0.2,
      y: 0.2,
      width: 0.3,
      height: 0.3,
      intensity: 2,
    })
    expect(spot.intensity).toBe(1.25)

    const spotNoZoom = clampNormalizedRegion({ ...spot, intensity: 1 })
    expect(spotNoZoom.intensity).toBe(1)
  })

  it('normalizes forward and reversed drag boxes and rejects tiny accidental clicks', () => {
    expect(normalizeDragBox(0.5, 0.5, 0.505, 0.505)).toBeNull()

    const reversed = normalizeDragBox(0.8, 0.7, 0.2, 0.3)
    expect(reversed).toEqual({ x: 0.2, y: 0.3, width: 0.6, height: 0.4 })
  })

  it('resizes regions from all four corners while respecting minSize and 0..1 bounds', () => {
    const base: WorkspaceRedactionRegion = {
      id: 'r1',
      kind: 'pixelate',
      x: 0.2,
      y: 0.2,
      width: 0.4,
      height: 0.4,
      intensity: 12,
    }

    const nw = resizeRegionByCorner(base, 'nw', 0.1, 0.15)
    expect(nw.x).toBeCloseTo(0.1, 4)
    expect(nw.y).toBeCloseTo(0.15, 4)
    expect(nw.x + nw.width).toBeCloseTo(0.6, 4)
    expect(nw.y + nw.height).toBeCloseTo(0.6, 4)

    const se = resizeRegionByCorner(base, 'se', 0.9, 0.85)
    expect(se.x).toBeCloseTo(0.2, 4)
    expect(se.width).toBeCloseTo(0.7, 4)
    expect(se.height).toBeCloseTo(0.65, 4)

    // Pushing nw past right/bottom stops at minSize (0.03) instead of inverting.
    const clampedNw = resizeRegionByCorner(base, 'nw', 0.99, 0.99)
    expect(clampedNw.width).toBeGreaterThanOrEqual(0.03)
    expect(clampedNw.height).toBeGreaterThanOrEqual(0.03)
  })

  it('moves regions within bounds without changing dimensions', () => {
    const base: WorkspaceRedactionRegion = {
      id: 'r2',
      kind: 'blur',
      x: 0.3,
      y: 0.3,
      width: 0.25,
      height: 0.2,
      intensity: 14,
    }
    const movedRight = moveRegionByDelta(base, 0.9, -0.5)
    expect(movedRight.x).toBeCloseTo(0.75, 4)
    expect(movedRight.y).toBe(0)
    expect(movedRight.width).toBeCloseTo(0.25, 4)
    expect(movedRight.height).toBeCloseTo(0.2, 4)
  })

  it('projects stage points to normalized screenshot coordinates and back across device models', () => {
    const metrics = computeMockupStageMetrics({
      canvasWidth: 1600,
      canvasHeight: 900,
      mockup: 'browser-chrome',
      scaleFactor: 1,
      screenshotWidth: 1440,
      screenshotHeight: 900,
      screenshotFit: 'cover',
    })
    expect(metrics.screenNorm.width).toBeGreaterThan(0.4)
    expect(metrics.screenNorm.height).toBeGreaterThan(0.4)

    const centerStageX = metrics.screenNorm.x + metrics.screenNorm.width / 2
    const centerStageY = metrics.screenNorm.y + metrics.screenNorm.height / 2
    const imgPt = stagePointToImageNorm(centerStageX, centerStageY, metrics.imageNorm)
    expect(imgPt.x).toBeCloseTo(0.5, 2)
    expect(imgPt.y).toBeCloseTo(0.5, 2)

    const projected = imageNormRectToStageNorm(
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
      metrics.imageNorm,
      metrics.screenNorm,
    )
    expect(projected).not.toBeNull()
    expect(projected!.x).toBeGreaterThanOrEqual(metrics.screenNorm.x)
    expect(projected!.y).toBeGreaterThanOrEqual(metrics.screenNorm.y)
  })
})

describe('applyRedactionsToCanvas', () => {
  const dummySource = {} as unknown as CanvasImageSource

  it('draws base image cleanly when regions list is empty', () => {
    const { canvas, record } = createMockCanvas(800, 600)
    const ctx = canvas.getContext('2d')!
    applyRedactionsToCanvas(ctx, dummySource, 800, 600, [])
    expect(record.drawImageCalls).toHaveLength(1)
    expect(record.filterHistory).toHaveLength(0)
    expect(record.fillRectCalls).toHaveLength(0)
  })

  it('renders blur, pixelate (nearest-neighbor), and spotlight (40% dim + shadow + cutout)', () => {
    const { canvas, record } = createMockCanvas(1000, 600)
    const ctx = canvas.getContext('2d')!
    const tempCanvases: Array<{ width: number; height: number }> = []

    const regions: WorkspaceRedactionRegion[] = [
      { id: 'b1', kind: 'blur', x: 0.1, y: 0.1, width: 0.2, height: 0.2, intensity: 16 },
      { id: 'p1', kind: 'pixelate', x: 0.4, y: 0.1, width: 0.2, height: 0.2, intensity: 10 },
      { id: 's1', kind: 'spotlight', x: 0.3, y: 0.5, width: 0.3, height: 0.3, intensity: 1.25 },
    ]

    applyRedactionsToCanvas(ctx, dummySource, 1000, 600, regions, {
      createCanvas: (w, h) => {
        tempCanvases.push({ width: w, height: h })
        return createMockCanvas(w, h).canvas
      },
    })

    // Blur sets blur(16px) and resets to none.
    expect(record.filterHistory).toContain('blur(16px)')
    expect(record.filterHistory).toContain('none')

    // Pixelate allocates downscaled canvas (200/10 = 20 x 120/10 = 12) and disables smoothing.
    expect(tempCanvases[0]).toEqual({ width: 20, height: 12 })
    expect(record.smoothingHistory).toContain(false)

    // Spotlight dims the full canvas with 40% black, applies shadow blur, and restores smoothing for crisp cutout.
    expect(record.fillStyles).toContain('rgba(0, 0, 0, 0.4)')
    expect(record.fillRectCalls).toContainEqual([0, 0, 1000, 600])
    expect(record.shadowBlurs.some((b) => b >= 16)).toBe(true)
    expect(record.smoothingHistory).toContain(true)
    expect(record.strokeStyles).toContain('rgba(255, 255, 255, 0.85)')
  })
})
