/**
 * [INPUT]: depends on clampNumber from ./canvasHelpers and PortraitFramingHints from ./types
 * [OUTPUT]: exports guidedFilterAlpha, estimateOuterBackgroundRgb, computePureBackdropAlpha, decontaminatePixelRgb, and detectPortraitFramingFromAlpha
 * [POS]: pure CPU pixel-math primitives for O(N) Guided Filter edge refinement, CIELAB border-connected studio backdrop matting, anti-halo color decontamination, and portrait framing in src/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { clampNumber } from './canvasHelpers'
import type { PortraitFramingHints } from './types'

// ============================================================================
// O(N) Separable Box Filter & Guided Filter Alpha Refinement
// ============================================================================

function boxFilter2D(
  src: Float32Array | Float64Array,
  width: number,
  height: number,
  radius: number,
): Float64Array {
  const size = width * height
  const temp = new Float64Array(size)
  const out = new Float64Array(size)
  const r = Math.max(1, Math.floor(radius))

  // Horizontal sliding window pass
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width
    let sum = 0
    const initialRight = Math.min(width - 1, r)
    for (let x = 0; x <= initialRight; x += 1) {
      sum += src[rowOffset + x]
    }
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - r)
      const right = Math.min(width - 1, x + r)
      temp[rowOffset + x] = sum / (right - left + 1)

      const nextAdd = x + r + 1
      if (nextAdd < width) sum += src[rowOffset + nextAdd]
      const prevRemove = x - r
      if (prevRemove >= 0) sum -= src[rowOffset + prevRemove]
    }
  }

  // Vertical cache-sequential sliding accumulator pass
  const colSum = new Float64Array(width)
  const initialBottom = Math.min(height - 1, r)
  for (let y = 0; y <= initialBottom; y += 1) {
    const rowOffset = y * width
    for (let x = 0; x < width; x += 1) {
      colSum[x] += temp[rowOffset + x]
    }
  }

  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - r)
    const bottom = Math.min(height - 1, y + r)
    const invCount = 1 / (bottom - top + 1)
    const rowOffset = y * width

    for (let x = 0; x < width; x += 1) {
      out[rowOffset + x] = colSum[x] * invCount
    }

    const nextAddY = y + r + 1
    if (nextAddY < height) {
      const addOffset = nextAddY * width
      for (let x = 0; x < width; x += 1) {
        colSum[x] += temp[addOffset + x]
      }
    }
    const prevRemoveY = y - r
    if (prevRemoveY >= 0) {
      const remOffset = prevRemoveY * width
      for (let x = 0; x < width; x += 1) {
        colSum[x] -= temp[remOffset + x]
      }
    }
  }

  return out
}

/**
 * Edge-preserving O(N) Guided Image Filter snapping upsampled matting alpha to full-resolution hair boundaries.
 */
export function guidedFilterAlpha(
  guideRgba: Uint8ClampedArray,
  rawAlpha: Float32Array,
  width: number,
  height: number,
  radius = 4,
  eps = 1e-3,
): Float32Array {
  const n = width * height
  const result = new Float32Array(n)
  if (n === 0) return result

  if (radius <= 0 || width < 2 || height < 2) {
    for (let i = 0; i < n; i += 1) {
      result[i] = clampNumber(rawAlpha[i] ?? 0, 0, 1)
    }
    return result
  }

  const guide = new Float64Array(n)
  const p = new Float64Array(n)
  const ii = new Float64Array(n)
  const ip = new Float64Array(n)

  for (let i = 0; i < n; i += 1) {
    const idx = i * 4
    const lum = (0.299 * guideRgba[idx] + 0.587 * guideRgba[idx + 1] + 0.114 * guideRgba[idx + 2]) / 255
    const alpha = clampNumber(rawAlpha[i] ?? 0, 0, 1)
    guide[i] = lum
    p[i] = alpha
    ii[i] = lum * lum
    ip[i] = lum * alpha
  }

  const meanI = boxFilter2D(guide, width, height, radius)
  const meanP = boxFilter2D(p, width, height, radius)
  const corrI = boxFilter2D(ii, width, height, radius)
  const corrIP = boxFilter2D(ip, width, height, radius)

  const a = new Float64Array(n)
  const b = new Float64Array(n)
  const safeEps = Math.max(1e-6, eps)

  for (let i = 0; i < n; i += 1) {
    const varI = Math.max(0, corrI[i] - meanI[i] * meanI[i])
    const covIP = corrIP[i] - meanI[i] * meanP[i]
    const coeffA = covIP / (varI + safeEps)
    a[i] = coeffA
    b[i] = meanP[i] - coeffA * meanI[i]
  }

  const meanA = boxFilter2D(a, width, height, radius)
  const meanB = boxFilter2D(b, width, height, radius)

  for (let i = 0; i < n; i += 1) {
    result[i] = clampNumber(meanA[i] * guide[i] + meanB[i], 0, 1)
  }

  return result
}

// ============================================================================
// Background Color Estimation, CIELAB Studio Matting & Color Decontamination
// ============================================================================

function trimmedChannelMean(values: number[]): number {
  if (values.length === 0) return 255
  values.sort((a, b) => a - b)
  const trim = Math.floor(values.length * 0.2)
  const start = trim
  const end = Math.max(start + 1, values.length - trim)
  let sum = 0
  for (let i = start; i < end; i += 1) {
    sum += values[i]
  }
  return Math.round(sum / (end - start))
}

/**
 * Estimate the dominant backdrop RGB using a robust trimmed mean over background-classified pixels
 * or the outer 4% border ring (excluding bottom-center shoulder contact).
 */
export function estimateOuterBackgroundRgb(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  alpha?: Float32Array,
): [number, number, number] {
  const n = width * height
  if (n === 0) return [255, 255, 255]

  const rs: number[] = []
  const gs: number[] = []
  const bs: number[] = []

  if (alpha && alpha.length >= n) {
    const step = Math.max(1, Math.floor(n / 4096))
    for (let i = 0; i < n; i += step) {
      if (alpha[i] < 0.03) {
        const idx = i * 4
        rs.push(rgba[idx])
        gs.push(rgba[idx + 1])
        bs.push(rgba[idx + 2])
      }
    }
  }

  if (rs.length < 16) {
    rs.length = 0
    gs.length = 0
    bs.length = 0

    const borderX = Math.max(1, Math.round(width * 0.04))
    const borderY = Math.max(1, Math.round(height * 0.04))
    const sideMaxY = Math.max(borderY, Math.round(height * 0.85))
    const step = Math.max(1, Math.floor(Math.max(width, height) / 256))

    for (let y = 0; y < borderY; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4
        rs.push(rgba[idx])
        gs.push(rgba[idx + 1])
        bs.push(rgba[idx + 2])
      }
    }
    for (let y = borderY; y < sideMaxY; y += step) {
      for (let x = 0; x < borderX; x += step) {
        const leftIdx = (y * width + x) * 4
        rs.push(rgba[leftIdx])
        gs.push(rgba[leftIdx + 1])
        bs.push(rgba[leftIdx + 2])

        const rightX = width - 1 - x
        if (rightX >= borderX) {
          const rightIdx = (y * width + rightX) * 4
          rs.push(rgba[rightIdx])
          gs.push(rgba[rightIdx + 1])
          bs.push(rgba[rightIdx + 2])
        }
      }
    }
  }

  return [trimmedChannelMean(rs), trimmedChannelMean(gs), trimmedChannelMean(bs)]
}

function srgbByteToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function labPivot(t: number): number {
  return t > 0.008856451679 ? Math.cbrt(t) : 7.787037037 * t + 16 / 116
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbByteToLinear(r)
  const gl = srgbByteToLinear(g)
  const bl = srgbByteToLinear(b)

  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / 0.95047
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / 1.08883

  const fx = labPivot(x)
  const fy = labPivot(y)
  const fz = labPivot(z)

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/**
 * Zero-model studio backdrop alpha estimator combining CIELAB perceptual deltaE ramp
 * with border-connected flood fill so interior white features (eyes, teeth, shirt collars) stay opaque.
 */
export function computePureBackdropAlpha(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Float32Array {
  const n = width * height
  const alpha = new Float32Array(n)
  if (n === 0) return alpha

  const [bgR, bgG, bgB] = estimateOuterBackgroundRgb(rgba, width, height)
  const [bgL, bgA, bgLabB] = rgbToLab(bgR, bgG, bgB)

  const deltaE = new Float32Array(n)
  const low = 8
  const high = 26
  const invRange = 1 / (high - low)

  for (let i = 0; i < n; i += 1) {
    const idx = i * 4
    const [l, a, b] = rgbToLab(rgba[idx], rgba[idx + 1], rgba[idx + 2])
    const dl = l - bgL
    const da = a - bgA
    const db = b - bgLabB
    deltaE[i] = Math.sqrt(dl * dl + da * da + db * db)
  }

  const visited = new Uint8Array(n)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0

  const trySeed = (pos: number): void => {
    if (visited[pos] === 0 && deltaE[pos] < high) {
      visited[pos] = 1
      queue[tail] = pos
      tail += 1
    }
  }

  for (let x = 0; x < width; x += 1) trySeed(x)
  for (let y = 1; y < height; y += 1) {
    trySeed(y * width)
    if (width > 1) trySeed(y * width + (width - 1))
  }
  const bottomStart = (height - 1) * width
  const leftCornerEnd = Math.floor(width * 0.15)
  const rightCornerStart = Math.ceil(width * 0.85)
  for (let x = 1; x < leftCornerEnd; x += 1) trySeed(bottomStart + x)
  for (let x = rightCornerStart; x < width - 1; x += 1) trySeed(bottomStart + x)

  while (head < tail) {
    const pos = queue[head]
    head += 1
    const x = pos % width
    const y = (pos - x) / width

    if (x > 0) {
      const left = pos - 1
      if (visited[left] === 0 && deltaE[left] < high) {
        visited[left] = 1
        queue[tail] = left
        tail += 1
      }
    }
    if (x + 1 < width) {
      const right = pos + 1
      if (visited[right] === 0 && deltaE[right] < high) {
        visited[right] = 1
        queue[tail] = right
        tail += 1
      }
    }
    if (y > 0) {
      const up = pos - width
      if (visited[up] === 0 && deltaE[up] < high) {
        visited[up] = 1
        queue[tail] = up
        tail += 1
      }
    }
    if (y + 1 < height) {
      const down = pos + width
      if (visited[down] === 0 && deltaE[down] < high) {
        visited[down] = 1
        queue[tail] = down
        tail += 1
      }
    }
  }

  for (let i = 0; i < n; i += 1) {
    alpha[i] = visited[i] === 0 ? 1 : clampNumber((deltaE[i] - low) * invRange, 0, 1)
  }

  return guidedFilterAlpha(rgba, alpha, width, height, 2, 1e-3)
}

/**
 * Unmix source backdrop spill from semi-transparent portrait boundary pixels to eliminate
 * white, blue, or red hair halos when compositing onto a new ID photo background.
 */
export function decontaminatePixelRgb(
  r: number,
  g: number,
  b: number,
  alpha: number,
  bgRgb: readonly [number, number, number],
  strength = 0.88,
): [number, number, number] {
  if (alpha <= 0.015 || alpha >= 0.985 || strength <= 0) {
    return [clampNumber(r, 0, 255), clampNumber(g, 0, 255), clampNumber(b, 0, 255)]
  }

  const s = clampNumber(strength, 0, 1)
  const invAlpha = 1 - alpha
  const denom = Math.max(alpha, 0.15)

  let fr = clampNumber((r - invAlpha * bgRgb[0]) / denom, 0, 255)
  let fg = clampNumber((g - invAlpha * bgRgb[1]) / denom, 0, 255)
  let fb = clampNumber((b - invAlpha * bgRgb[2]) / denom, 0, 255)

  if (alpha < 0.65) {
    const bgLuma = 0.299 * bgRgb[0] + 0.587 * bgRgb[1] + 0.114 * bgRgb[2]
    const bcr = bgRgb[0] - bgLuma
    const bcg = bgRgb[1] - bgLuma
    const bcb = bgRgb[2] - bgLuma
    const bgChromaSq = bcr * bcr + bcg * bcg + bcb * bcb

    if (bgChromaSq > 625) {
      const fLuma = 0.299 * fr + 0.587 * fg + 0.114 * fb
      const fcr = fr - fLuma
      const fcg = fg - fLuma
      const fcb = fb - fLuma
      const proj = (fcr * bcr + fcg * bcg + fcb * bcb) / bgChromaSq
      if (proj > 0) {
        const spillFactor = Math.min(0.6, proj * invAlpha * s * 0.65)
        fr = clampNumber(fr - bcr * spillFactor, 0, 255)
        fg = clampNumber(fg - bcg * spillFactor, 0, 255)
        fb = clampNumber(fb - bcb * spillFactor, 0, 255)
      }
    }
  }

  return [
    clampNumber(r * (1 - s) + fr * s, 0, 255),
    clampNumber(g * (1 - s) + fg * s, 0, 255),
    clampNumber(b * (1 - s) + fb * s, 0, 255),
  ]
}

// ============================================================================
// Portrait Auto-Framing Heuristics From Matte Alpha
// ============================================================================

const DEFAULT_FRAMING: PortraitFramingHints = {
  centerX: 0.5,
  centerY: 0.45,
  zoom: 1,
  headTopRatio: 0.1,
  headHeightRatio: 0.58,
}

/**
 * Estimate head top, head height, horizontal centroid, and recommended ID-photo pan/zoom
 * from a foreground portrait alpha matte, falling back cleanly on uniform or degenerate masks.
 */
export function detectPortraitFramingFromAlpha(
  alpha: Float32Array,
  width: number,
  height: number,
): PortraitFramingHints {
  const n = width * height
  if (width < 4 || height < 4 || alpha.length < n) {
    return { ...DEFAULT_FRAMING }
  }

  const rowCounts = new Int32Array(height)
  const rowMinX = new Int32Array(height)
  const rowMaxX = new Int32Array(height)
  let totalFg = 0

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width
    let count = 0
    let minX = width
    let maxX = -1
    for (let x = 0; x < width; x += 1) {
      if (alpha[rowOffset + x] >= 0.5) {
        count += 1
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
    rowCounts[y] = count
    rowMinX[y] = minX
    rowMaxX[y] = maxX
    totalFg += count
  }

  const fgCoverage = totalFg / n
  if (fgCoverage < 0.005 || fgCoverage > 0.985) {
    return { ...DEFAULT_FRAMING }
  }

  const minRowFg = Math.max(2, Math.ceil(width * 0.015))
  let headTopY = -1
  for (let y = 0; y < height; y += 1) {
    if (rowCounts[y] >= minRowFg) {
      headTopY = y
      break
    }
  }
  if (headTopY < 0) return { ...DEFAULT_FRAMING }

  const scanEndY = Math.min(height - 1, headTopY + Math.round(height * 0.35))
  let peakHeadWidth = 0
  let reachedPeak = false
  for (let y = headTopY; y <= scanEndY; y += 1) {
    const span = rowMaxX[y] >= rowMinX[y] ? rowMaxX[y] - rowMinX[y] + 1 : 0
    if (span >= peakHeadWidth) {
      peakHeadWidth = span
      if (y - headTopY >= Math.max(2, Math.round(height * 0.04))) {
        reachedPeak = true
      }
    } else if (reachedPeak && span < peakHeadWidth * 0.82) {
      break
    }
  }

  if (peakHeadWidth <= 0) return { ...DEFAULT_FRAMING }

  const estimatedHeadHeightPx = peakHeadWidth * 1.28
  const headTopRatio = clampNumber(headTopY / height, 0, 0.75)
  const headHeightRatio = clampNumber(estimatedHeadHeightPx / height, 0.18, 0.72)

  const headBottomY = Math.min(height - 1, Math.round(headTopY + headHeightRatio * height))
  let sumX = 0
  let weightSum = 0
  for (let y = headTopY; y <= headBottomY; y += 1) {
    const rowOffset = y * width
    for (let x = 0; x < width; x += 1) {
      const a = alpha[rowOffset + x]
      if (a >= 0.5) {
        sumX += x * a
        weightSum += a
      }
    }
  }

  const centerX = weightSum > 0 ? clampNumber(sumX / weightSum / width, 0.15, 0.85) : 0.5
  const cropHeightFrac = clampNumber(headHeightRatio / 0.6, 0.45, 1)
  const zoom = clampNumber(1 / cropHeightFrac, 1, 2.2)
  const cropTopFrac = headTopRatio - 0.1 * cropHeightFrac
  const centerY = clampNumber(cropTopFrac + cropHeightFrac / 2, 0.2, 0.8)

  return {
    centerX,
    centerY,
    zoom,
    headTopRatio,
    headHeightRatio,
  }
}
