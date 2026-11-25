/**
 * [INPUT]: depends on createCanvas and get2dContext from ./canvasHelpers and overlap/canvas types from ./types
 * [OUTPUT]: exports computeRowProfile, detectPairOverlap, extractNormalizedRaster, detectVerticalStitchOverlaps, detectVerticalStitchOverlapsAsync, yieldToMain, applySeamOverlapOverrides, and DEFAULT_ANALYSIS_WIDTH
 * [POS]: pure client-side 2D pixel overlap, fixed top/bottom bar detector, main-thread yielding async stitch analyzer, and manual seam-override resolver for vertical long-screenshot stitching in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { createCanvas, get2dContext } from './canvasHelpers'
import type {
  CanvasFactory,
  LoadedImageItem,
  MergeRotation,
  MergeSeamInfo,
  PairOverlapMatch,
  RgbaRaster,
  RowProfile,
  VerticalItemTrim,
  VerticalOverlapOptions,
  VerticalOverlapPlan,
} from './types'

export const DEFAULT_ANALYSIS_WIDTH = 256
const MAX_ANALYSIS_HEIGHT = 1024
const MAX_FIXED_BAR_RATIO = 0.22
const MIN_FIXED_BAR_ROWS = 4
const MIN_SCROLL_BODY_ROWS = 24
const MAX_OVERLAP_RATIO = 0.88
const TEXTURE_MEAN_GRAD = 2.0
const TEXTURE_GRAD_STD = 4.0
const FIXED_ROW_MAE = 10.0
const FIXED_BAR_MEAN_MAE = 8.0
const VERTICAL_EDGE_RGB = 15.0
const COARSE_FP_LIMIT = 18.0
const COARSE_TOP_K = 24
const MAX_OVERALL_MAE = 12.0
const MAX_TEXTURED_MAE = 18.0
const ROW_MISMATCH_MAE = 28.0
const MAX_MISMATCH_RATIO = 0.2
const MIN_TEXTURED_NCC = 0.75
const EMPTY_MATCH: PairOverlapMatch = { fixedTop: 0, fixedBottom: 0, scrollOverlap: 0, mae: 0, texturedRows: 0 }

interface FixedBarProbe { height: number; stoppedBeforeCap: boolean; texturedRows: number; meanMae: number; hasEdge: boolean }
interface VerifiedCandidate { overlap: number; texturedMae: number; texturedRows: number; score: number }

// ============================================================================
// Pure Row Fingerprint & Pixel Metrics
// ============================================================================

/** Compute per-row RGB means, horizontal gradient std-dev, and textured row mask. */
export function computeRowProfile(raster: RgbaRaster): RowProfile {
  const { width, height, data } = raster
  const meanR = new Float32Array(height)
  const meanG = new Float32Array(height)
  const meanB = new Float32Array(height)
  const meanGrad = new Float32Array(height)
  const gradStd = new Float32Array(height)
  const isTextured = new Uint8Array(height)
  if (width <= 0 || height <= 0) return { meanR, meanG, meanB, meanGrad, gradStd, isTextured }

  const invW = 1 / width
  const invSpan = 1 / Math.max(1, width - 1)
  for (let y = 0; y < height; y += 1) {
    let off = y * width * 4
    let sumR = data[off], sumG = data[off + 1], sumB = data[off + 2]
    let prevR = sumR, prevG = sumG, prevB = sumB
    let sumG1 = 0, sumG2 = 0

    for (let x = 1; x < width; x += 1) {
      off += 4
      const r = data[off], g = data[off + 1], b = data[off + 2]
      sumR += r; sumG += g; sumB += b
      const grad = (Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB)) / 3
      sumG1 += grad
      sumG2 += grad * grad
      prevR = r; prevG = g; prevB = b
    }

    meanR[y] = sumR * invW
    meanG[y] = sumG * invW
    meanB[y] = sumB * invW
    const mg = width > 1 ? sumG1 * invSpan : 0
    const gs = width > 1 ? Math.sqrt(Math.max(0, sumG2 * invSpan - mg * mg)) : 0
    meanGrad[y] = mg
    gradStd[y] = gs
    isTextured[y] = mg >= TEXTURE_MEAN_GRAD || gs >= TEXTURE_GRAD_STD ? 1 : 0
  }
  return { meanR, meanG, meanB, meanGrad, gradStd, isTextured }
}

function computeRowMae(a: RgbaRaster, yA: number, b: RgbaRaster, yB: number): number {
  const w = a.width
  let offA = yA * w * 4
  let offB = yB * w * 4
  let sum = 0
  for (let x = 0; x < w; x += 1) {
    sum +=
      Math.abs(a.data[offA] - b.data[offB]) +
      Math.abs(a.data[offA + 1] - b.data[offB + 1]) +
      Math.abs(a.data[offA + 2] - b.data[offB + 2])
    offA += 4
    offB += 4
  }
  return sum / (w * 3)
}

function hasVerticalEdge(p: RowProfile, start: number, end: number, totalHeight: number): boolean {
  const to = Math.min(totalHeight - 1, end)
  for (let y = Math.max(0, start); y < to; y += 1) {
    const delta = (Math.abs(p.meanR[y] - p.meanR[y + 1]) + Math.abs(p.meanG[y] - p.meanG[y + 1]) + Math.abs(p.meanB[y] - p.meanB[y + 1])) / 3
    if (delta >= VERTICAL_EDGE_RGB) return true
  }
  return false
}

// ============================================================================
// Fixed Bar & Scrolling Content Overlap Detection
// ============================================================================

function probeFixedBar(a: RgbaRaster, profA: RowProfile, b: RgbaRaster, maxRows: number, fromBottom: boolean): FixedBarProbe {
  const minH = Math.min(a.height, b.height)
  const limit = Math.min(maxRows + 1, minH)
  let matched = 0, maeSum = 0

  while (matched < limit) {
    const mae = computeRowMae(a, fromBottom ? a.height - 1 - matched : matched, b, fromBottom ? b.height - 1 - matched : matched)
    if (mae > FIXED_ROW_MAE) break
    maeSum += mae
    matched += 1
  }

  const height = Math.min(matched, maxRows)
  const startY = fromBottom ? a.height - height : 0
  const endY = fromBottom ? a.height : height
  let texturedRows = 0
  for (let y = startY; y < endY; y += 1) texturedRows += profA.isTextured[y]

  return {
    height,
    stoppedBeforeCap: matched <= maxRows && matched < minH,
    texturedRows,
    meanMae: height > 0 ? maeSum / matched : 0,
    hasEdge: height > 0 && hasVerticalEdge(profA, fromBottom ? startY - 1 : height - 2, fromBottom ? startY + 1 : height, a.height),
  }
}

function verifyScrollCandidate(
  a: RgbaRaster, profA: RowProfile, b: RgbaRaster, profB: RowProfile,
  aStart: number, bStart: number, overlap: number, minTexRows: number,
): VerifiedCandidate | null {
  const w = a.width
  let totalAbs = 0, texAbs = 0, texRows = 0, badRows = 0
  let sumA = 0, sumB = 0, sumAA = 0, sumBB = 0, sumAB = 0

  for (let k = 0; k < overlap; k += 1) {
    const yA = aStart + k, yB = bStart + k
    const rowTex = profA.isTextured[yA] === 1 || profB.isTextured[yB] === 1
    let offA = yA * w * 4, offB = yB * w * 4, rowDiff = 0

    for (let x = 0; x < w; x += 1) {
      const rA = a.data[offA], gA = a.data[offA + 1], bA = a.data[offA + 2]
      const rB = b.data[offB], gB = b.data[offB + 1], bB = b.data[offB + 2]
      rowDiff += Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB)
      if (rowTex) {
        sumA += rA + gA + bA
        sumB += rB + gB + bB
        sumAA += rA * rA + gA * gA + bA * bA
        sumBB += rB * rB + gB * gB + bB * bB
        sumAB += rA * rB + gA * gB + bA * bB
      }
      offA += 4
      offB += 4
    }

    totalAbs += rowDiff
    if (rowTex) {
      texRows += 1
      texAbs += rowDiff
      if (rowDiff / (w * 3) > ROW_MISMATCH_MAE) badRows += 1
    }
  }

  if (texRows < minTexRows || totalAbs / (overlap * w * 3) > MAX_OVERALL_MAE) return null
  const texturedMae = texAbs / (texRows * w * 3)
  if (texturedMae > MAX_TEXTURED_MAE || badRows / texRows > MAX_MISMATCH_RATIO) return null

  const n = texRows * w * 3
  const meanA = sumA / n, meanB = sumB / n
  const denom = Math.sqrt(Math.max(0, (sumAA / n - meanA * meanA) * (sumBB / n - meanB * meanB)))
  const ncc = denom > 1e-3 ? (sumAB / n - meanA * meanB) / denom : 0
  if (ncc < MIN_TEXTURED_NCC) return null

  const errorFactor = Math.max(0.05, 1 - texturedMae / (MAX_TEXTURED_MAE * 1.25))
  return { overlap, texturedMae, texturedRows: texRows, score: texRows * ncc * errorFactor }
}

function searchScrollOverlap(
  a: RgbaRaster, profA: RowProfile, b: RgbaRaster, profB: RowProfile,
  aTop: number, aBottom: number, bTop: number, bBottom: number,
): VerifiedCandidate | null {
  const minScrollH = Math.min(aBottom - aTop, bBottom - bTop)
  if (minScrollH < MIN_SCROLL_BODY_ROWS) return null

  const minOverlap = Math.min(24, Math.max(12, Math.round(minScrollH * 0.04)))
  const maxOverlap = Math.floor(minScrollH * MAX_OVERLAP_RATIO)
  if (maxOverlap < minOverlap) return null

  const coarseHits: Array<{ overlap: number; coarseScore: number; texturedRows: number }> = []
  for (let h = minOverlap; h <= maxOverlap; h += 1) {
    const aStart = aBottom - h
    const minTex = Math.max(6, Math.min(h, Math.ceil(h * 0.12)))
    const maxBudget = COARSE_FP_LIMIT * h
    let fpSum = 0, texRows = 0

    for (let k = 0; k < h; k += 1) {
      const yA = aStart + k, yB = bTop + k
      if (profA.isTextured[yA] === 1 || profB.isTextured[yB] === 1) texRows += 1
      fpSum +=
        (Math.abs(profA.meanR[yA] - profB.meanR[yB]) +
          Math.abs(profA.meanG[yA] - profB.meanG[yB]) +
          Math.abs(profA.meanB[yA] - profB.meanB[yB]) +
          Math.abs(profA.gradStd[yA] - profB.gradStd[yB])) *
        0.25
      if (fpSum > maxBudget) break
    }
    if (fpSum <= maxBudget && texRows >= minTex) {
      coarseHits.push({ overlap: h, coarseScore: fpSum / h, texturedRows: texRows })
    }
  }

  coarseHits.sort((x, y) => x.coarseScore - y.coarseScore || y.texturedRows - x.texturedRows)
  let best: VerifiedCandidate | null = null
  const limit = Math.min(COARSE_TOP_K, coarseHits.length)
  for (let i = 0; i < limit; i += 1) {
    const h = coarseHits[i].overlap
    const minTex = Math.max(6, Math.min(h, Math.ceil(h * 0.12)))
    const verified = verifyScrollCandidate(a, profA, b, profB, aBottom - h, bTop, h, minTex)
    if (verified && (!best || verified.score > best.score)) best = verified
  }
  return best
}

/** Pure 2D pixel-level overlap & fixed top/bottom bar detector for an equal-width screenshot pair. */
export function detectPairOverlap(topRaster: RgbaRaster, bottomRaster: RgbaRaster): PairOverlapMatch {
  if (
    topRaster.width <= 0 ||
    topRaster.height < MIN_SCROLL_BODY_ROWS ||
    bottomRaster.height < MIN_SCROLL_BODY_ROWS ||
    topRaster.width !== bottomRaster.width
  ) {
    return { ...EMPTY_MATCH }
  }

  const profA = computeRowProfile(topRaster)
  const profB = computeRowProfile(bottomRaster)
  const minH = Math.min(topRaster.height, bottomRaster.height)
  const maxFixed = Math.floor(minH * MAX_FIXED_BAR_RATIO)

  const topProbe = probeFixedBar(topRaster, profA, bottomRaster, maxFixed, false)
  const botProbe = probeFixedBar(topRaster, profA, bottomRaster, maxFixed, true)
  const isTexBar = (p: FixedBarProbe) =>
    p.height >= MIN_FIXED_BAR_ROWS && p.stoppedBeforeCap && p.texturedRows >= 2 && p.meanMae <= FIXED_BAR_MEAN_MAE
  const topTex = isTexBar(topProbe)
  const botTex = isTexBar(botProbe)

  const topCut = topTex || (topProbe.height >= MIN_FIXED_BAR_ROWS && topProbe.stoppedBeforeCap && topProbe.hasEdge) ? topProbe.height : 0
  const botCut = botTex || (botProbe.height >= MIN_FIXED_BAR_ROWS && botProbe.stoppedBeforeCap && botProbe.hasEdge) ? botProbe.height : 0

  if ((topCut > 0 || botCut > 0) && topCut + botCut <= minH - MIN_SCROLL_BODY_ROWS) {
    const withBars = searchScrollOverlap(
      topRaster, profA, bottomRaster, profB,
      topCut, topRaster.height - botCut, topCut, bottomRaster.height - botCut,
    )
    if (withBars) {
      return { fixedTop: topCut, fixedBottom: botCut, scrollOverlap: withBars.overlap, mae: withBars.texturedMae, texturedRows: withBars.texturedRows }
    }
  }

  const noBars = searchScrollOverlap(topRaster, profA, bottomRaster, profB, 0, topRaster.height, 0, bottomRaster.height)
  if (noBars) {
    return { fixedTop: 0, fixedBottom: 0, scrollOverlap: noBars.overlap, mae: noBars.texturedMae, texturedRows: noBars.texturedRows }
  }
  if (topTex || botTex) {
    return { fixedTop: topTex ? topProbe.height : 0, fixedBottom: botTex ? botProbe.height : 0, scrollOverlap: 0, mae: 0, texturedRows: 0 }
  }
  return { ...EMPTY_MATCH }
}

// ============================================================================
// Canvas Pixel Extraction & Multi-Image Chain Planner
// ============================================================================

function getEffectiveSize(width: number, height: number, rotation: MergeRotation): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: Math.max(1, height), height: Math.max(1, width) }
    : { width: Math.max(1, width), height: Math.max(1, height) }
}

/** Render an image onto an equal-width analysis canvas and read RGBA pixels; returns null safely if unsupported. */
export function extractNormalizedRaster(
  item: LoadedImageItem,
  targetWidth: number,
  rotation: MergeRotation = 0,
  createCanvasFn?: CanvasFactory,
): RgbaRaster | null {
  const eff = getEffectiveSize(item.width, item.height, rotation)
  const sampleW = Math.max(1, Math.round(targetWidth))
  const sampleH = Math.max(1, Math.round(sampleW * (eff.height / eff.width)))

  try {
    const canvas = createCanvas(sampleW, sampleH, createCanvasFn)
    const ctx = get2dContext(canvas)
    if (typeof ctx.getImageData !== 'function') return null

    ctx.save()
    if (rotation === 0) {
      ctx.drawImage(item.source, 0, 0, item.width, item.height, 0, 0, sampleW, sampleH)
    } else {
      const swapped = rotation === 90 || rotation === 270
      const drawW = swapped ? sampleH : sampleW
      const drawH = swapped ? sampleW : sampleH
      ctx.translate(sampleW / 2, sampleH / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(item.source, 0, 0, item.width, item.height, -drawW / 2, -drawH / 2, drawW, drawH)
    }
    ctx.restore()

    const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
    if (!imageData?.data || imageData.data.length < sampleW * sampleH * 4) return null
    return { width: sampleW, height: sampleH, data: imageData.data }
  } catch {
    return null
  }
}

const MIN_REMAINING_HEIGHT_PX = 16
const LONG_TASK_BUDGET_MS = 50

interface SchedulerWithYield {
  yield?: () => Promise<void>
}

interface YieldDeadline {
  deadline: number
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/**
 * Yield control back to the browser main thread so input handling and rendering stay responsive
 * during multi-frame pixel analysis (INP / break-up-long-tasks). Prefers `scheduler.yield()`
 * when supported and falls back to `setTimeout(..., 0)` in browsers without it.
 */
export function yieldToMain(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const sched = (globalThis as { scheduler?: SchedulerWithYield }).scheduler
  if (typeof sched?.yield === 'function') {
    return sched.yield()
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

async function yieldIfOverBudget(budget: YieldDeadline): Promise<void> {
  if (typeof window === 'undefined') return
  if (nowMs() >= budget.deadline) {
    await yieldToMain()
    budget.deadline = nowMs() + LONG_TASK_BUDGET_MS
  }
}

function emptyPlan(count: number): VerticalOverlapPlan {
  const seamCount = Math.max(0, count - 1)
  return {
    trims: Array.from({ length: count }, () => ({ trimTop: 0, trimBottom: 0 })),
    seams: Array.from({ length: seamCount }, () => ({ ...EMPTY_MATCH })),
    seamInfos: Array.from({ length: seamCount }, (_, index) => ({
      index,
      autoOverlapPx: 0,
      appliedOverlapPx: 0,
      fixedTopPx: 0,
      fixedBottomPx: 0,
    })),
  }
}

/**
 * Apply optional manual per-seam top-trim overrides onto vertical stitch trims,
 * clamping every item safely so at least 16px (or full height if <= 16px) remains.
 */
export function applySeamOverlapOverrides(
  effectiveHeights: ReadonlyArray<number>,
  baseTrims?: ReadonlyArray<VerticalItemTrim>,
  baseSeamInfos?: ReadonlyArray<MergeSeamInfo>,
  overrides?: Readonly<Record<number, number>>,
): { trims: VerticalItemTrim[]; seams: MergeSeamInfo[] } {
  const count = effectiveHeights.length
  const trims: VerticalItemTrim[] = Array.from({ length: count }, (_, idx) => ({
    trimTop: Math.max(0, Math.round(baseTrims?.[idx]?.trimTop ?? 0)),
    trimBottom: Math.max(0, Math.round(baseTrims?.[idx]?.trimBottom ?? 0)),
  }))

  const seams: MergeSeamInfo[] = []
  for (let i = 0; i < count - 1; i += 1) {
    const autoOverlapPx = baseSeamInfos?.[i]?.autoOverlapPx ?? trims[i + 1].trimTop
    const fixedTopPx = baseSeamInfos?.[i]?.fixedTopPx ?? 0
    const fixedBottomPx = baseSeamInfos?.[i]?.fixedBottomPx ?? trims[i].trimBottom

    const rawOverride = overrides?.[i]
    if (rawOverride !== undefined && Number.isFinite(rawOverride)) {
      const effH = Math.max(1, Math.round(effectiveHeights[i + 1]))
      const minKept = Math.min(MIN_REMAINING_HEIGHT_PX, effH)
      const safeBottom = Math.min(trims[i + 1].trimBottom, Math.max(0, effH - minKept))
      trims[i + 1].trimBottom = safeBottom
      const maxTop = Math.max(0, effH - safeBottom - minKept)
      trims[i + 1].trimTop = Math.max(0, Math.min(Math.round(rawOverride), maxTop))
    }

    seams.push({
      index: i,
      autoOverlapPx,
      appliedOverlapPx: trims[i + 1].trimTop,
      fixedTopPx,
      fixedBottomPx,
    })
  }

  return { trims, seams }
}

function resolveAnalysisSetup(
  items: ReadonlyArray<LoadedImageItem>,
  options: VerticalOverlapOptions,
): {
  rotations: MergeRotation[]
  sizes: Array<{ width: number; height: number }>
  sampleWidth: number
} {
  const rotations: MergeRotation[] = items.map((_, idx) => options.itemRotations?.[idx] ?? 0)
  const sizes = items.map((item, idx) => getEffectiveSize(item.width, item.height, rotations[idx]))
  const maxW = Math.max(16, Math.min(DEFAULT_ANALYSIS_WIDTH, Math.round(options.maxAnalysisWidth ?? DEFAULT_ANALYSIS_WIDTH)))
  const minEffW = Math.min(...sizes.map((s) => s.width))
  const maxAspect = Math.max(...sizes.map((s) => s.height / s.width))

  let sampleWidth = Math.max(1, Math.min(maxW, Math.round(minEffW)))
  if (sampleWidth * maxAspect > MAX_ANALYSIS_HEIGHT) {
    sampleWidth = Math.max(16, Math.floor(MAX_ANALYSIS_HEIGHT / maxAspect))
  }

  return { rotations, sizes, sampleWidth }
}

function finalizeVerticalOverlapPlan(
  sizes: ReadonlyArray<{ width: number; height: number }>,
  rasters: ReadonlyArray<RgbaRaster>,
  seams: ReadonlyArray<PairOverlapMatch>,
): VerticalOverlapPlan {
  const count = sizes.length
  const trims: VerticalItemTrim[] = Array.from({ length: count }, () => ({ trimTop: 0, trimBottom: 0 }))
  const rawFixedTopPx: number[] = []
  const rawFixedBottomPx: number[] = []

  for (let i = 0; i < count - 1; i += 1) {
    const match = seams[i]
    const fixedBottomPx =
      match.fixedBottom > 0 ? Math.round(match.fixedBottom * (sizes[i].height / rasters[i].height)) : 0
    const fixedTopPx =
      match.fixedTop > 0 ? Math.round(match.fixedTop * (sizes[i + 1].height / rasters[i + 1].height)) : 0
    rawFixedTopPx.push(fixedTopPx)
    rawFixedBottomPx.push(fixedBottomPx)

    if (fixedBottomPx > 0) trims[i].trimBottom = fixedBottomPx
    if (match.fixedTop > 0 || match.scrollOverlap > 0) {
      trims[i + 1].trimTop = Math.round((match.fixedTop + match.scrollOverlap) * (sizes[i + 1].height / rasters[i + 1].height))
    }
  }

  for (let i = 0; i < count; i += 1) {
    const effH = sizes[i].height
    const maxTotal = Math.max(0, effH - Math.max(1, Math.min(16, Math.floor(effH * 0.1))))
    const total = trims[i].trimTop + trims[i].trimBottom
    if (total > maxTotal && total > 0) {
      const ratio = maxTotal / total
      trims[i].trimTop = Math.floor(trims[i].trimTop * ratio)
      trims[i].trimBottom = Math.floor(trims[i].trimBottom * ratio)
    }
  }

  const seamInfos: MergeSeamInfo[] = seams.map((_, i) => ({
    index: i,
    autoOverlapPx: trims[i + 1].trimTop,
    appliedOverlapPx: trims[i + 1].trimTop,
    fixedTopPx: Math.min(rawFixedTopPx[i], trims[i + 1].trimTop),
    fixedBottomPx: Math.min(rawFixedBottomPx[i], trims[i].trimBottom),
  }))

  return { trims, seams: [...seams], seamInfos }
}

/** Analyze adjacent pairs in a vertical stitch sequence and compute safe per-item pixel trims. */
export function detectVerticalStitchOverlaps(
  items: ReadonlyArray<LoadedImageItem>,
  options: VerticalOverlapOptions = {},
): VerticalOverlapPlan {
  const count = items.length
  if (count < 2) return emptyPlan(count)

  const { rotations, sizes, sampleWidth } = resolveAnalysisSetup(items, options)

  const rasters: RgbaRaster[] = []
  for (let i = 0; i < count; i += 1) {
    const raster = extractNormalizedRaster(items[i], sampleWidth, rotations[i], options.createCanvas)
    if (!raster) return emptyPlan(count)
    rasters.push(raster)
  }

  const seams: PairOverlapMatch[] = []
  for (let i = 0; i < count - 1; i += 1) {
    seams.push(detectPairOverlap(rasters[i], rasters[i + 1]))
  }

  return finalizeVerticalOverlapPlan(sizes, rasters, seams)
}

/**
 * Async variant of `detectVerticalStitchOverlaps` that periodically yields to the main thread
 * (50ms task budget via `scheduler.yield()` / `setTimeout`) between raster extraction and pair
 * matching so multi-screenshot stitches never trigger INP long-task freezes.
 */
export async function detectVerticalStitchOverlapsAsync(
  items: ReadonlyArray<LoadedImageItem>,
  options: VerticalOverlapOptions = {},
): Promise<VerticalOverlapPlan> {
  const count = items.length
  if (count < 2) return emptyPlan(count)

  const { rotations, sizes, sampleWidth } = resolveAnalysisSetup(items, options)
  const budget: YieldDeadline = { deadline: nowMs() + LONG_TASK_BUDGET_MS }

  const rasters: RgbaRaster[] = []
  for (let i = 0; i < count; i += 1) {
    await yieldIfOverBudget(budget)
    const raster = extractNormalizedRaster(items[i], sampleWidth, rotations[i], options.createCanvas)
    if (!raster) return emptyPlan(count)
    rasters.push(raster)
  }

  const seams: PairOverlapMatch[] = []
  for (let i = 0; i < count - 1; i += 1) {
    await yieldIfOverBudget(budget)
    seams.push(detectPairOverlap(rasters[i], rasters[i + 1]))
  }

  return finalizeVerticalOverlapPlan(sizes, rasters, seams)
}
