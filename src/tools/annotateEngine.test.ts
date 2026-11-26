/**
 * [INPUT]: depends on vitest, annotation engine APIs from ./annotateEngine, barrel exports from ./index, and createRecordingCanvasFactory from ./testHelpers
 * [OUTPUT]: verifies undo/redo history, RDP brush simplification, SVG midpoint pathing, 8-handle resize math, layer move/resize geometry, z-order hit testing, Canvas 2D vector rendering, and full-res Blob/dataUrl composition
 * [POS]: unit test suite for src/tools/annotateEngine.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { describe, expect, it } from 'vitest'
import {
  ANNOTATION_PRESET_COLORS,
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_FONT_SIZE,
  DEFAULT_ANNOTATION_STROKE_WIDTH,
  buildSmoothSvgPath,
  canRedoAnnotation,
  canUndoAnnotation,
  computeResizedBounds,
  createAnnotationHistory,
  getAnnotationBounds,
  hitTestAnnotationLayers,
  moveAnnotationLayer,
  pushAnnotationHistory,
  redoAnnotationHistory,
  renderAnnotatedImageToBlob,
  renderAnnotationsToCanvas,
  resizeAnnotationLayer,
  simplifyBrushPoints,
  undoAnnotationHistory,
  type AnnotationBounds,
  type AnnotationCanvasContext,
  type AnnotationLayer,
  type AnnotationResizeHandle,
  type ArrowAnnotationLayer,
  type BrushAnnotationLayer,
  type RectAnnotationLayer,
  type TextAnnotationLayer,
} from './annotateEngine'
import * as toolsBarrel from './index'
import { createRecordingCanvasFactory } from './testHelpers'

function makeRect(overrides: Partial<RectAnnotationLayer> = {}): RectAnnotationLayer {
  return {
    id: 'rect-1',
    type: 'rect',
    color: '#ff0000',
    strokeWidth: 0.012,
    x: 0.2,
    y: 0.2,
    width: 0.3,
    height: 0.25,
    ...overrides,
  }
}

function makeArrow(overrides: Partial<ArrowAnnotationLayer> = {}): ArrowAnnotationLayer {
  return {
    id: 'arrow-1',
    type: 'arrow',
    color: '#3a86ff',
    strokeWidth: 0.012,
    x1: 0.1,
    y1: 0.2,
    x2: 0.5,
    y2: 0.6,
    ...overrides,
  }
}

function makeBrush(overrides: Partial<BrushAnnotationLayer> = {}): BrushAnnotationLayer {
  return {
    id: 'brush-1',
    type: 'brush',
    color: '#ff2d55',
    strokeWidth: 0.014,
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.15 },
      { x: 0.3, y: 0.25 },
      { x: 0.4, y: 0.3 },
    ],
    ...overrides,
  }
}

function makeText(overrides: Partial<TextAnnotationLayer> = {}): TextAnnotationLayer {
  return {
    id: 'text-1',
    type: 'text',
    color: '#ffffff',
    strokeWidth: 0.01,
    x: 0.2,
    y: 0.3,
    width: 0.4,
    height: 0.12,
    text: 'Hello Moklu',
    fontSize: 0.055,
    ...overrides,
  }
}

interface SpyVectorRecord {
  saves: number
  restores: number
  moves: Array<[number, number]>
  lines: Array<[number, number]>
  quads: Array<[number, number, number, number]>
  arcs: Array<[number, number, number]>
  arcTos: number
  strokes: Array<{ strokeStyle: unknown; lineWidth: number; lineCap?: CanvasLineCap; lineJoin?: CanvasLineJoin }>
  fills: Array<{ fillStyle: unknown }>
  fillTexts: Array<{ text: string; x: number; y: number; fillStyle: unknown; shadowColor: string; font: string }>
  strokeTexts: Array<{ text: string; x: number; y: number; strokeStyle: unknown; lineWidth: number }>
}

function createVectorSpyContext(charWidthPx = 14): {
  ctx: AnnotationCanvasContext
  record: SpyVectorRecord
} {
  const record: SpyVectorRecord = {
    saves: 0,
    restores: 0,
    moves: [],
    lines: [],
    quads: [],
    arcs: [],
    arcTos: 0,
    strokes: [],
    fills: [],
    fillTexts: [],
    strokeTexts: [],
  }

  const ctx: AnnotationCanvasContext = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    font: '16px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    shadowColor: 'rgba(0,0,0,0)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save() {
      record.saves += 1
    },
    restore() {
      record.restores += 1
    },
    beginPath() {},
    closePath() {},
    moveTo(x, y) {
      record.moves.push([x, y])
    },
    lineTo(x, y) {
      record.lines.push([x, y])
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      record.quads.push([cpx, cpy, x, y])
    },
    arc(x, y, r) {
      record.arcs.push([x, y, r])
    },
    arcTo() {
      record.arcTos += 1
    },
    rect() {},
    fill() {
      record.fills.push({ fillStyle: ctx.fillStyle })
    },
    stroke() {
      record.strokes.push({
        strokeStyle: ctx.strokeStyle,
        lineWidth: ctx.lineWidth,
        lineCap: ctx.lineCap,
        lineJoin: ctx.lineJoin,
      })
    },
    fillText(text, x, y) {
      record.fillTexts.push({
        text,
        x,
        y,
        fillStyle: ctx.fillStyle,
        shadowColor: ctx.shadowColor,
        font: ctx.font,
      })
    },
    strokeText(text, x, y) {
      record.strokeTexts.push({
        text,
        x,
        y,
        strokeStyle: ctx.strokeStyle,
        lineWidth: ctx.lineWidth,
      })
    },
    measureText(text) {
      return { width: text.length * charWidthPx }
    },
  }

  return { ctx, record }
}

describe('annotateEngine constants & barrel exports', () => {
  it('exposes required preset palette and default constants', () => {
    expect(ANNOTATION_PRESET_COLORS).toEqual([
      '#ffcc00',
      '#ff7a00',
      '#ff2d55',
      '#ff0000',
      '#8e5cff',
      '#3a86ff',
      '#ffffff',
      '#111827',
    ])
    expect(DEFAULT_ANNOTATION_COLOR).toBe('#ff0000')
    expect(DEFAULT_ANNOTATION_STROKE_WIDTH).toBe(0.012)
    expect(DEFAULT_ANNOTATION_FONT_SIZE).toBe(0.055)
  })

  it('re-exports the full annotation API from src/tools/index.ts', () => {
    expect(toolsBarrel.createAnnotationHistory).toBe(createAnnotationHistory)
    expect(toolsBarrel.pushAnnotationHistory).toBe(pushAnnotationHistory)
    expect(toolsBarrel.undoAnnotationHistory).toBe(undoAnnotationHistory)
    expect(toolsBarrel.redoAnnotationHistory).toBe(redoAnnotationHistory)
    expect(toolsBarrel.canUndoAnnotation).toBe(canUndoAnnotation)
    expect(toolsBarrel.canRedoAnnotation).toBe(canRedoAnnotation)
    expect(toolsBarrel.simplifyBrushPoints).toBe(simplifyBrushPoints)
    expect(toolsBarrel.buildSmoothSvgPath).toBe(buildSmoothSvgPath)
    expect(toolsBarrel.getAnnotationBounds).toBe(getAnnotationBounds)
    expect(toolsBarrel.computeResizedBounds).toBe(computeResizedBounds)
    expect(toolsBarrel.moveAnnotationLayer).toBe(moveAnnotationLayer)
    expect(toolsBarrel.resizeAnnotationLayer).toBe(resizeAnnotationLayer)
    expect(toolsBarrel.hitTestAnnotationLayers).toBe(hitTestAnnotationLayers)
    expect(toolsBarrel.renderAnnotationsToCanvas).toBe(renderAnnotationsToCanvas)
    expect(toolsBarrel.renderAnnotatedImageToBlob).toBe(renderAnnotatedImageToBlob)
    expect(toolsBarrel.ANNOTATION_PRESET_COLORS).toBe(ANNOTATION_PRESET_COLORS)
  })
})

describe('annotation history reducer', () => {
  it('supports push, undo, redo, branch clearing, and maxEntries cap', () => {
    const r1 = makeRect({ id: 'r1' })
    const r2 = makeRect({ id: 'r2', x: 0.4 })
    const r3 = makeRect({ id: 'r3', x: 0.6 })

    let state = createAnnotationHistory()
    expect(state.present).toEqual([])
    expect(canUndoAnnotation(state)).toBe(false)
    expect(canRedoAnnotation(state)).toBe(false)
    expect(undoAnnotationHistory(state)).toBe(state)
    expect(redoAnnotationHistory(state)).toBe(state)

    state = pushAnnotationHistory(state, [r1])
    state = pushAnnotationHistory(state, [r1, r2])
    expect(canUndoAnnotation(state)).toBe(true)
    expect(canRedoAnnotation(state)).toBe(false)
    expect(state.present.map((l) => l.id)).toEqual(['r1', 'r2'])

    state = undoAnnotationHistory(state)
    expect(state.present.map((l) => l.id)).toEqual(['r1'])
    expect(canRedoAnnotation(state)).toBe(true)

    state = redoAnnotationHistory(state)
    expect(state.present.map((l) => l.id)).toEqual(['r1', 'r2'])
    expect(canRedoAnnotation(state)).toBe(false)

    // Pushing after undo clears future
    state = undoAnnotationHistory(state)
    state = pushAnnotationHistory(state, [r3])
    expect(state.future).toEqual([])
    expect(canRedoAnnotation(state)).toBe(false)
    expect(state.present.map((l) => l.id)).toEqual(['r3'])

    // Respects maxEntries limit (default 50, tested with 3)
    let capped = createAnnotationHistory()
    for (let i = 0; i < 6; i += 1) {
      capped = pushAnnotationHistory(capped, [makeRect({ id: `step-${i}` })], 3)
    }
    expect(capped.past).toHaveLength(3)
    expect(capped.past[0][0]?.id).toBe('step-2')
  })

  it('deep-clones brush points so external mutations never corrupt history snapshots', () => {
    const brush = makeBrush()
    const state = createAnnotationHistory([brush])
    brush.points[0].x = 0.99
    expect((state.present[0] as BrushAnnotationLayer).points[0].x).toBe(0.1)
  })
})

describe('simplifyBrushPoints and buildSmoothSvgPath', () => {
  it('handles empty, single dot, 2-point segment, collinear thinning, and corner preservation', () => {
    expect(simplifyBrushPoints([])).toEqual([])
    expect(simplifyBrushPoints([{ x: 0.5, y: 0.5 }])).toEqual([{ x: 0.5, y: 0.5 }])
    expect(
      simplifyBrushPoints([
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.9 },
      ]),
    ).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.9 },
    ])

    // Straight collinear stroke simplifies down to 2 endpoints
    const collinear = Array.from({ length: 20 }, (_, i) => ({ x: i / 20, y: i / 20 }))
    const thinned = simplifyBrushPoints(collinear, 0.002)
    expect(thinned).toHaveLength(2)
    expect(thinned[0]).toEqual(collinear[0])
    expect(thinned[1]).toEqual(collinear[collinear.length - 1])

    // L-shaped stroke preserves the sharp corner
    const cornerStroke = [
      { x: 0.1, y: 0.1 },
      { x: 0.3, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.4 },
      { x: 0.5, y: 0.7 },
    ]
    const simplifiedCorner = simplifyBrushPoints(cornerStroke, 0.005)
    expect(simplifiedCorner).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.7 },
    ])
  })

  it('builds smooth SVG paths for 0, 1, 2, and N points', () => {
    expect(buildSmoothSvgPath([], 1000, 500)).toBe('')
    expect(buildSmoothSvgPath([{ x: 0.25, y: 0.5 }], 1000, 500)).toBe('M 250 250 L 250 250')
    expect(
      buildSmoothSvgPath(
        [
          { x: 0.1, y: 0.2 },
          { x: 0.8, y: 0.4 },
        ],
        1000,
        500,
      ),
    ).toBe('M 100 100 L 800 200')

    const smooth = buildSmoothSvgPath(
      [
        { x: 0.1, y: 0.1 },
        { x: 0.3, y: 0.5 },
        { x: 0.7, y: 0.3 },
        { x: 0.9, y: 0.8 },
      ],
      100,
      100,
    )
    expect(smooth).toBe('M 10 10 Q 30 50 50 40 Q 70 30 80 55 L 90 80')
  })
})

describe('bounds, 8-handle resize, move, and resizeAnnotationLayer', () => {
  it('computes clamped safe bounds for all four layer types including single-dot brush and flat arrows', () => {
    const dotBrush = makeBrush({ points: [{ x: 0.5, y: 0.5 }], strokeWidth: 0.01 })
    const dotBounds = getAnnotationBounds(dotBrush)
    expect(dotBounds.width).toBeGreaterThanOrEqual(0.01)
    expect(dotBounds.height).toBeGreaterThanOrEqual(0.01)
    expect(dotBounds.x).toBeGreaterThanOrEqual(0)
    expect(dotBounds.x + dotBounds.width).toBeLessThanOrEqual(1)

    const flatArrow = makeArrow({ x1: 0.2, y1: 0.5, x2: 0.7, y2: 0.5 })
    const arrowBounds = getAnnotationBounds(flatArrow)
    expect(arrowBounds.x).toBeCloseTo(0.2, 5)
    expect(arrowBounds.width).toBeCloseTo(0.5, 5)
    expect(arrowBounds.height).toBeGreaterThanOrEqual(0.01)

    const negRect = makeRect({ x: 0.6, y: 0.6, width: -0.2, height: -0.1 })
    const negBounds = getAnnotationBounds(negRect)
    expect(negBounds.x).toBeCloseTo(0.4, 5)
    expect(negBounds.y).toBeCloseTo(0.5, 5)
    expect(negBounds.width).toBeCloseTo(0.2, 5)
    expect(negBounds.height).toBeCloseTo(0.1, 5)
  })

  it('supports all 8 resize handles and clamps cleanly within [0, 1] and minSize', () => {
    const start: AnnotationBounds = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }
    const cases: Array<{ handle: AnnotationResizeHandle; dx: number; dy: number; expected: AnnotationBounds }> = [
      { handle: 'nw', dx: -0.1, dy: -0.1, expected: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 } },
      { handle: 'n', dx: 0.3, dy: 0.1, expected: { x: 0.2, y: 0.3, width: 0.4, height: 0.3 } },
      { handle: 'ne', dx: 0.2, dy: -0.1, expected: { x: 0.2, y: 0.1, width: 0.6, height: 0.5 } },
      { handle: 'e', dx: -0.1, dy: 0.5, expected: { x: 0.2, y: 0.2, width: 0.3, height: 0.4 } },
      { handle: 'se', dx: 0.2, dy: 0.2, expected: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 } },
      { handle: 's', dx: -0.2, dy: -0.1, expected: { x: 0.2, y: 0.2, width: 0.4, height: 0.3 } },
      { handle: 'sw', dx: 0.1, dy: 0.2, expected: { x: 0.3, y: 0.2, width: 0.3, height: 0.6 } },
      { handle: 'w', dx: -0.1, dy: -0.4, expected: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 } },
    ]

    for (const c of cases) {
      const res = computeResizedBounds(start, c.handle, c.dx, c.dy, 0.05)
      expect(res.x).toBeCloseTo(c.expected.x, 5)
      expect(res.y).toBeCloseTo(c.expected.y, 5)
      expect(res.width).toBeCloseTo(c.expected.width, 5)
      expect(res.height).toBeCloseTo(c.expected.height, 5)
    }

    // Extreme deltas clamp to [0, 1] and enforce minSize
    const shrunk = computeResizedBounds(start, 'nw', 0.9, 0.9, 0.05)
    expect(shrunk.width).toBeCloseTo(0.05, 5)
    expect(shrunk.height).toBeCloseTo(0.05, 5)
    expect(shrunk.x).toBeCloseTo(0.55, 5)
    expect(shrunk.y).toBeCloseTo(0.55, 5)

    const overshot = computeResizedBounds(start, 'se', 5, 5, 0.05)
    expect(overshot.x + overshot.width).toBeCloseTo(1, 5)
    expect(overshot.y + overshot.height).toBeCloseTo(1, 5)
  })

  it('moves layers cleanly within image bounds without distorting geometry', () => {
    const rect = makeRect({ x: 0.7, y: 0.7, width: 0.2, height: 0.2 })
    const movedRect = moveAnnotationLayer(rect, 0.5, -1) as RectAnnotationLayer
    expect(movedRect.x).toBeCloseTo(0.8, 5)
    expect(movedRect.y).toBeCloseTo(0, 5)
    expect(movedRect.width).toBe(0.2)
    expect(movedRect.height).toBe(0.2)

    const arrow = makeArrow({ x1: 0.1, y1: 0.2, x2: 0.4, y2: 0.5 })
    const movedArrow = moveAnnotationLayer(arrow, -0.5, 0.8) as ArrowAnnotationLayer
    expect(movedArrow.x1).toBeCloseTo(0, 5)
    expect(movedArrow.x2).toBeCloseTo(0.3, 5)
    expect(movedArrow.y1).toBeCloseTo(0.7, 5)
    expect(movedArrow.y2).toBeCloseTo(1, 5)

    const brush = makeBrush()
    const movedBrush = moveAnnotationLayer(brush, 0.2, 0.1) as BrushAnnotationLayer
    expect(movedBrush.points[0].x).toBeCloseTo(0.3, 5)
    expect(movedBrush.points[0].y).toBeCloseTo(0.2, 5)
    expect(movedBrush.points[3].x).toBeCloseTo(0.6, 5)
    expect(movedBrush.points[3].y).toBeCloseTo(0.4, 5)
  })

  it('scales brush points, rect, arrow endpoints, and text fontSize cleanly on resize', () => {
    const brush = makeBrush({
      strokeWidth: 0.01,
      points: [
        { x: 0.2, y: 0.2 },
        { x: 0.4, y: 0.4 },
      ],
    })
    const startBrushBounds = getAnnotationBounds(brush)
    const nextBrushBounds = computeResizedBounds(startBrushBounds, 'se', 0.2, 0.2)
    const resizedBrush = resizeAnnotationLayer(brush, 'se', nextBrushBounds) as BrushAnnotationLayer
    const finalBrushBounds = getAnnotationBounds(resizedBrush)
    expect(finalBrushBounds.x).toBeCloseTo(nextBrushBounds.x, 4)
    expect(finalBrushBounds.y).toBeCloseTo(nextBrushBounds.y, 4)
    expect(finalBrushBounds.width).toBeCloseTo(nextBrushBounds.width, 4)
    expect(finalBrushBounds.height).toBeCloseTo(nextBrushBounds.height, 4)

    const arrow = makeArrow({ x1: 0.2, y1: 0.6, x2: 0.5, y2: 0.3 })
    const resizedArrow = resizeAnnotationLayer(arrow, 'ne', { x: 0.1, y: 0.1, width: 0.6, height: 0.6 }) as ArrowAnnotationLayer
    expect(resizedArrow.x1).toBeCloseTo(0.1, 5)
    expect(resizedArrow.y1).toBeCloseTo(0.7, 5)
    expect(resizedArrow.x2).toBeCloseTo(0.7, 5)
    expect(resizedArrow.y2).toBeCloseTo(0.1, 5)

    const text = makeText({ x: 0.2, y: 0.2, width: 0.3, height: 0.1, fontSize: 0.05 })
    const resizedText = resizeAnnotationLayer(text, 'se', { x: 0.2, y: 0.2, width: 0.5, height: 0.2 }) as TextAnnotationLayer
    expect(resizedText.width).toBeCloseTo(0.5, 5)
    expect(resizedText.height).toBeCloseTo(0.2, 5)
    expect(resizedText.fontSize).toBeCloseTo(0.1, 5)

    // Horizontal-only text resize keeps fontSize unchanged
    const widerText = resizeAnnotationLayer(text, 'e', { x: 0.2, y: 0.2, width: 0.6, height: 0.1 }) as TextAnnotationLayer
    expect(widerText.fontSize).toBeCloseTo(0.05, 5)
  })
})

describe('hitTestAnnotationLayers', () => {
  it('respects top-to-bottom z-order and accurately hits brush, rect, arrow, and text', () => {
    const rect = makeRect({ id: 'bottom-rect', x: 0.2, y: 0.2, width: 0.4, height: 0.4 })
    const arrow = makeArrow({ id: 'mid-arrow', x1: 0.1, y1: 0.8, x2: 0.5, y2: 0.8 })
    const brush = makeBrush({
      id: 'brush-layer',
      points: [
        { x: 0.7, y: 0.1 },
        { x: 0.9, y: 0.3 },
      ],
    })
    const text = makeText({ id: 'top-text', x: 0.3, y: 0.3, width: 0.2, height: 0.1 })

    const layers: AnnotationLayer[] = [rect, arrow, brush, text]

    // Overlapping rect & text -> top-most text wins
    expect(hitTestAnnotationLayers(layers, { x: 0.35, y: 0.35 })?.id).toBe('top-text')
    // Inside rect outside text -> rect wins
    expect(hitTestAnnotationLayers(layers, { x: 0.22, y: 0.22 })?.id).toBe('bottom-rect')
    // Near arrow shaft -> arrow wins
    expect(hitTestAnnotationLayers(layers, { x: 0.3, y: 0.81 })?.id).toBe('mid-arrow')
    // Near brush segment -> brush wins
    expect(hitTestAnnotationLayers(layers, { x: 0.8, y: 0.2 })?.id).toBe('brush-layer')
    // Empty space -> null
    expect(hitTestAnnotationLayers(layers, { x: 0.02, y: 0.98 })).toBeNull()
  })
})

describe('renderAnnotationsToCanvas and renderAnnotatedImageToBlob', () => {
  it('renders brush (dot & curved), rounded rect, arrow (shaft + arrowhead), and wrapped text with contrast halo', () => {
    const { ctx, record } = createVectorSpyContext(12)
    const layers: AnnotationLayer[] = [
      makeBrush({ id: 'dot', points: [{ x: 0.1, y: 0.1 }] }),
      makeBrush({
        id: 'curve',
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.3, y: 0.4 },
          { x: 0.5, y: 0.2 },
        ],
      }),
      makeRect({ id: 'box', cornerRadius: 0.02 }),
      makeArrow({ id: 'arr', x1: 0.1, y1: 0.5, x2: 0.6, y2: 0.5 }),
      makeText({
        id: 'light-text',
        color: '#ffffff',
        x: 0.1,
        y: 0.6,
        width: 0.15,
        height: 0.2,
        text: 'Long annotation headline\nSecond line',
        fontSize: 0.04,
      }),
      makeText({
        id: 'dark-text',
        color: '#111827',
        x: 0.5,
        y: 0.7,
        width: 0.3,
        height: 0.1,
        text: 'Dark Label',
        fontSize: 0.04,
      }),
    ]

    renderAnnotationsToCanvas(ctx, 1000, 1000, layers)

    // Save/restore balanced for all 6 layers
    expect(record.saves).toBe(6)
    expect(record.restores).toBe(6)
    // Single-point brush drew a circular dot via arc
    expect(record.arcs).toHaveLength(1)
    // Multi-point brush drew quadratic curve with round caps
    expect(record.quads).toHaveLength(1)
    expect(record.strokes.some((s) => s.lineCap === 'round' && s.lineJoin === 'round')).toBe(true)
    // Rounded rect traced rounded corners
    expect(record.arcTos).toBe(4)
    // Arrow filled triangular head + brush dot fill
    expect(record.fills.length).toBeGreaterThanOrEqual(2)
    // Text wrapped across multiple lines and used opposite contrast halos for #ffffff vs #111827
    const whiteTexts = record.fillTexts.filter((t) => t.fillStyle === '#ffffff')
    const darkTexts = record.fillTexts.filter((t) => t.fillStyle === '#111827')
    expect(whiteTexts.length).toBeGreaterThanOrEqual(3)
    expect(whiteTexts[0].shadowColor).toContain('17, 24, 39')
    expect(darkTexts).toHaveLength(1)
    expect(darkTexts[0].shadowColor).toContain('255, 255, 255')
    expect(record.strokeTexts.length).toBe(record.fillTexts.length)
  })

  it('composites source image and layers into a Blob and dataUrl with 8192px clamping and JPEG opaque fill', async () => {
    const factory = createRecordingCanvasFactory()
    const source = { width: 10000, height: 5000, label: 'huge.png' }

    const pngResult = await renderAnnotatedImageToBlob(
      source,
      10000,
      5000,
      [makeRect(), makeArrow(), makeText()],
      { format: 'image/png', createCanvas: factory.createCanvas },
    )

    expect(pngResult.width).toBe(8192)
    expect(pngResult.height).toBe(4096)
    expect(pngResult.mimeType).toBe('image/png')
    expect(pngResult.blob.size).toBeGreaterThan(0)
    expect(pngResult.dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(factory.canvases[0].draws).toHaveLength(1)
    expect(factory.canvases[0].fillRects).toHaveLength(0)
    expect(factory.canvases[0].strokeCount).toBeGreaterThanOrEqual(2)
    expect(factory.canvases[0].texts.length).toBeGreaterThanOrEqual(1)

    const jpegResult = await renderAnnotatedImageToBlob(
      { width: 800, height: 600, label: 'shot.png' },
      800,
      600,
      [makeBrush()],
      { format: 'image/jpeg', quality: 0.85, createCanvas: factory.createCanvas },
    )

    expect(jpegResult.width).toBe(800)
    expect(jpegResult.height).toBe(600)
    expect(jpegResult.mimeType).toBe('image/jpeg')
    expect(jpegResult.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(factory.canvases[1].fillRects).toHaveLength(1)
    expect(factory.canvases[1].fillRects[0].fillStyle).toBe('#ffffff')
    expect(factory.canvases[1].encodedQuality).toBeCloseTo(0.85, 5)
  })
})
