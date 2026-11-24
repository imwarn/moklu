/**
 * [INPUT]: depends on vitest, ./stitchOverlap, ./mergeEngine, ./testHelpers, and Canvas/Image types from ./types
 * [OUTPUT]: unit tests covering pixel-level scrolling overlap detection, fixed top/bottom bar deduplication, manual seamOverlapOverrides clamping, solid/unrelated false-positive guards, mismatched-dimension normalization, noise tolerance, rotation mapping, and missing getImageData fallback
 * [POS]: dedicated unit test suite for src/tools/stitchOverlap.ts and vertical overlap integration in src/tools/mergeEngine.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { describe, expect, it } from 'vitest'
import { mergeImages } from './mergeEngine'
import {
  computeRowProfile,
  detectPairOverlap,
  detectVerticalStitchOverlaps,
  extractNormalizedRaster,
} from './stitchOverlap'
import { createRecordingCanvasFactory, makeMockImageItem } from './testHelpers'
import type {
  CanvasContextLike,
  CanvasFactory,
  CanvasLike,
  ImageDrawable,
  LoadedImageItem,
  RgbaRaster,
} from './types'

interface PixelImageSource {
  readonly width: number
  readonly height: number
  readonly pixels: Uint8ClampedArray
}

// ============================================================================
// Synthetic Pixel Raster & Bilinear Software Canvas Helpers
// ============================================================================

function createRaster(width: number, height: number, fill: [number, number, number] = [255, 255, 255]): RgbaRaster {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    const off = i * 4
    data[off] = fill[0]
    data[off + 1] = fill[1]
    data[off + 2] = fill[2]
    data[off + 3] = 255
  }
  return { width, height, data }
}

function fillRect(
  raster: RgbaRaster,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: [number, number, number],
): void {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(raster.width, Math.ceil(x + w))
  const y1 = Math.min(raster.height, Math.ceil(y + h))
  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      const off = (py * raster.width + px) * 4
      raster.data[off] = rgb[0]
      raster.data[off + 1] = rgb[1]
      raster.data[off + 2] = rgb[2]
      raster.data[off + 3] = 255
    }
  }
}

/** Deterministic PRNG so synthetic document textures are unique at every vertical position. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Render a realistic scrollable article/feed document with cards, avatars, text glyphs, and whitespace. */
function createVirtualDocument(width: number, height: number, seed = 42, contrast: 'high' | 'low' = 'high'): RgbaRaster {
  const rng = makeRng(seed)
  const bg: [number, number, number] = [250, 250, 252]
  const raster = createRaster(width, height, bg)

  let y = 10
  while (y + 24 < height) {
    const blockH = 22 + Math.floor(rng() * 30)
    const accentR = contrast === 'high' ? 25 + Math.floor(rng() * 160) : 210 + Math.floor(rng() * 20)
    const accentG = contrast === 'high' ? 35 + Math.floor(rng() * 150) : 212 + Math.floor(rng() * 20)
    const accentB = contrast === 'high' ? 45 + Math.floor(rng() * 165) : 216 + Math.floor(rng() * 20)
    const textRgb: [number, number, number] = contrast === 'high' ? [30, 41, 59] : [205, 210, 218]

    // Card avatar / thumbnail on the left
    const avatarSize = Math.min(20, Math.max(10, Math.floor(width * 0.1)))
    fillRect(raster, 12, y, avatarSize, Math.min(avatarSize, blockH), [accentR, accentG, accentB])

    // Variable-length simulated text glyphs across multiple lines
    const textLeft = 18 + avatarSize
    for (let lineY = y + 2; lineY + 4 < Math.min(height - 4, y + blockH); lineY += 8) {
      let cursorX = textLeft
      const lineEnd = textLeft + Math.floor((width - textLeft - 14) * (0.45 + rng() * 0.55))
      while (cursorX + 4 < lineEnd) {
        const wordW = 5 + Math.floor(rng() * 14)
        fillRect(raster, cursorX, lineY, Math.min(wordW, lineEnd - cursorX), 4, textRgb)
        cursorX += wordW + 4 + Math.floor(rng() * 5)
      }
    }

    // Subtle divider below card
    if (y + blockH + 2 < height) {
      fillRect(raster, 12, y + blockH + 2, width - 24, 1, [220, 224, 232])
    }

    y += blockH + 10 + Math.floor(rng() * 8)
  }

  return raster
}

function paintFixedTopBar(raster: RgbaRaster, barHeight: number, clockVariant = 0): void {
  fillRect(raster, 0, 0, raster.width, barHeight, [244, 246, 250])
  // Status clock block (changes slightly if clockVariant !== 0)
  fillRect(raster, 14, Math.floor(barHeight * 0.25), 24, 6, [24, 24, 27])
  fillRect(raster, 40, Math.floor(barHeight * 0.25), 4, 6, clockVariant === 0 ? [24, 24, 27] : [244, 246, 250])
  // Centered page title
  const titleW = Math.floor(raster.width * 0.34)
  fillRect(raster, Math.floor((raster.width - titleW) / 2), Math.floor(barHeight * 0.52), titleW, 8, [15, 23, 42])
  // Right battery icon
  fillRect(raster, raster.width - 34, Math.floor(barHeight * 0.25), 20, 7, [34, 197, 94])
  // Bottom hairline
  fillRect(raster, 0, barHeight - 2, raster.width, 2, [203, 213, 225])
}

function paintFixedBottomBar(raster: RgbaRaster, barHeight: number): void {
  const startY = raster.height - barHeight
  fillRect(raster, 0, startY, raster.width, barHeight, [248, 250, 252])
  fillRect(raster, 0, startY, raster.width, 2, [203, 213, 225])
  // Four tab bar icons
  const step = Math.floor(raster.width / 4)
  for (let i = 0; i < 4; i += 1) {
    const cx = Math.floor(step * i + step / 2 - 7)
    fillRect(raster, cx, startY + 8, 14, 12, i === 0 ? [249, 115, 22] : [100, 116, 139])
  }
  // Centered Home indicator pill
  const pillW = Math.floor(raster.width * 0.35)
  fillRect(raster, Math.floor((raster.width - pillW) / 2), raster.height - 9, pillW, 4, [30, 41, 59])
}

function sliceRaster(source: RgbaRaster, startY: number, height: number): RgbaRaster {
  const out = createRaster(source.width, height)
  for (let y = 0; y < height; y += 1) {
    const srcOff = (startY + y) * source.width * 4
    const dstOff = y * source.width * 4
    out.data.set(source.data.subarray(srcOff, srcOff + source.width * 4), dstOff)
  }
  return out
}

function composeViewportCapture(
  doc: RgbaRaster,
  scrollY: number,
  viewportH: number,
  fixedTop: number,
  fixedBottom: number,
  clockVariant = 0,
): RgbaRaster {
  const frame = createRaster(doc.width, viewportH)
  const scrollH = viewportH - fixedTop - fixedBottom
  for (let y = 0; y < scrollH; y += 1) {
    const srcOff = (scrollY + y) * doc.width * 4
    const dstOff = (fixedTop + y) * doc.width * 4
    frame.data.set(doc.data.subarray(srcOff, srcOff + doc.width * 4), dstOff)
  }
  if (fixedTop > 0) paintFixedTopBar(frame, fixedTop, clockVariant)
  if (fixedBottom > 0) paintFixedBottomBar(frame, fixedBottom)
  return frame
}

function scaleRasterBilinear(src: RgbaRaster, dstW: number, dstH: number): RgbaRaster {
  const dst = createRaster(dstW, dstH)
  for (let dy = 0; dy < dstH; dy += 1) {
    const fy = ((dy + 0.5) * src.height) / dstH - 0.5
    const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(fy)))
    const y1 = Math.max(0, Math.min(src.height - 1, y0 + 1))
    const wy = Math.max(0, Math.min(1, fy - y0))

    for (let dx = 0; dx < dstW; dx += 1) {
      const fx = ((dx + 0.5) * src.width) / dstW - 0.5
      const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(fx)))
      const x1 = Math.max(0, Math.min(src.width - 1, x0 + 1))
      const wx = Math.max(0, Math.min(1, fx - x0))

      const o00 = (y0 * src.width + x0) * 4
      const o10 = (y0 * src.width + x1) * 4
      const o01 = (y1 * src.width + x0) * 4
      const o11 = (y1 * src.width + x1) * 4
      const outOff = (dy * dstW + dx) * 4

      for (let c = 0; c < 4; c += 1) {
        const top = src.data[o00 + c] * (1 - wx) + src.data[o10 + c] * wx
        const bot = src.data[o01 + c] * (1 - wx) + src.data[o11 + c] * wx
        dst.data[outOff + c] = Math.round(top * (1 - wy) + bot * wy)
      }
    }
  }
  return dst
}

function rotateRasterClockwise90(src: RgbaRaster): RgbaRaster {
  const dst = createRaster(src.height, src.width)
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const rx = src.height - 1 - y
      const ry = x
      const sOff = (y * src.width + x) * 4
      const dOff = (ry * dst.width + rx) * 4
      dst.data[dOff] = src.data[sOff]
      dst.data[dOff + 1] = src.data[sOff + 1]
      dst.data[dOff + 2] = src.data[sOff + 2]
      dst.data[dOff + 3] = src.data[sOff + 3]
    }
  }
  return dst
}

function addDeterministicNoise(raster: RgbaRaster, amplitude: number, seed = 99): RgbaRaster {
  const rng = makeRng(seed)
  const out = new Uint8ClampedArray(raster.data)
  for (let i = 0; i < out.length; i += 4) {
    const delta = Math.round((rng() * 2 - 1) * amplitude)
    out[i] = Math.max(0, Math.min(255, out[i] + delta))
    out[i + 1] = Math.max(0, Math.min(255, out[i + 1] + delta))
    out[i + 2] = Math.max(0, Math.min(255, out[i + 2] + delta))
  }
  return { width: raster.width, height: raster.height, data: out }
}

function isPixelSource(source: ImageDrawable): source is ImageDrawable & PixelImageSource {
  return typeof source === 'object' && source !== null && 'pixels' in source
}

function makePixelImageItem(id: string, raster: RgbaRaster): LoadedImageItem {
  const source: PixelImageSource = { width: raster.width, height: raster.height, pixels: raster.data }
  return makeMockImageItem({
    id,
    name: `${id}.png`,
    width: raster.width,
    height: raster.height,
    source: source as unknown as ImageDrawable,
  })
}

/**
 * Software 2D pixel canvas factory supporting drawImage (including 90deg rotation and bilinear scaling)
 * and getImageData so mergeImages and stitchOverlap execute real pixel analysis in Node Vitest.
 */
function createSoftwarePixelCanvasFactory(): {
  createCanvas: CanvasFactory
  buffers: RgbaRaster[]
} {
  const buffers: RgbaRaster[] = []

  const createCanvas: CanvasFactory = (width, height): CanvasLike => {
    const buf = createRaster(width, height, [255, 255, 255])
    buffers.push(buf)

    let tx = 0
    let ty = 0
    let rot = 0
    const stack: Array<{ tx: number; ty: number; rot: number }> = []

    const ctx: CanvasContextLike = {
      fillStyle: '#ffffff',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      filter: 'none',
      shadowColor: 'rgba(0,0,0,0)',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      save() {
        stack.push({ tx, ty, rot })
      },
      restore() {
        const prev = stack.pop()
        if (prev) {
          tx = prev.tx
          ty = prev.ty
          rot = prev.rot
        }
      },
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arcTo() {},
      rect() {},
      clip() {},
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      fill() {},
      stroke() {},
      translate(x, y) {
        tx += x
        ty += y
      },
      rotate(angle) {
        rot += angle
      },
      scale() {},
      createLinearGradient() {
        return { addColorStop() {} }
      },
      drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (!isPixelSource(image) || sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return
        const cos = Math.cos(rot)
        const sin = Math.sin(rot)
        const invCos = cos
        const invSin = -sin

        for (let py = 0; py < height; py += 1) {
          for (let px = 0; px < width; px += 1) {
            const relX = px + 0.5 - tx
            const relY = py + 0.5 - ty
            const lx = relX * invCos - relY * invSin
            const ly = relX * invSin + relY * invCos
            if (lx < dx || lx >= dx + dw || ly < dy || ly >= dy + dh) continue

            const u = (lx - dx) / dw
            const v = (ly - dy) / dh
            const fx = sx + u * sw - 0.5
            const fy = sy + v * sh - 0.5
            const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(fx)))
            const x1 = Math.max(0, Math.min(image.width - 1, x0 + 1))
            const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(fy)))
            const y1 = Math.max(0, Math.min(image.height - 1, y0 + 1))
            const wx = Math.max(0, Math.min(1, fx - x0))
            const wy = Math.max(0, Math.min(1, fy - y0))

            const o00 = (y0 * image.width + x0) * 4
            const o10 = (y0 * image.width + x1) * 4
            const o01 = (y1 * image.width + x0) * 4
            const o11 = (y1 * image.width + x1) * 4
            const outOff = (py * width + px) * 4

            for (let c = 0; c < 4; c += 1) {
              const top = image.pixels[o00 + c] * (1 - wx) + image.pixels[o10 + c] * wx
              const bot = image.pixels[o01 + c] * (1 - wx) + image.pixels[o11 + c] * wx
              buf.data[outOff + c] = Math.round(top * (1 - wy) + bot * wy)
            }
          }
        }
      },
      fillText() {},
      getImageData(sx, sy, sw, sh) {
        const out = new Uint8ClampedArray(sw * sh * 4)
        for (let y = 0; y < sh; y += 1) {
          const srcY = sy + y
          if (srcY < 0 || srcY >= height) continue
          const srcOff = (srcY * width + Math.max(0, sx)) * 4
          const copyW = Math.max(0, Math.min(sw, width - sx))
          out.set(buf.data.subarray(srcOff, srcOff + copyW * 4), y * sw * 4)
        }
        return { width: sw, height: sh, data: out }
      },
    }

    return {
      width,
      height,
      getContext(contextId: '2d') {
        return contextId === '2d' ? ctx : null
      },
      async convertToBlob(blobOpts) {
        return new Blob([new Uint8Array(buf.data)], { type: blobOpts?.type ?? 'image/png' })
      },
    }
  }

  return { createCanvas, buffers }
}

// ============================================================================
// Tests
// ============================================================================

describe('stitchOverlap', () => {
  it('marks solid and smooth-gradient rows as non-textured while flagging UI/text rows', () => {
    const white = createRaster(128, 40, [255, 255, 255])
    const black = createRaster(128, 40, [0, 0, 0])
    const smoothGrad = createRaster(128, 20, [0, 0, 0])
    for (let y = 0; y < 20; y += 1) {
      for (let x = 0; x < 128; x += 1) {
        const off = (y * 128 + x) * 4
        const v = Math.round((x / 127) * 127)
        smoothGrad.data[off] = v
        smoothGrad.data[off + 1] = v
        smoothGrad.data[off + 2] = v
      }
    }

    expect(Array.from(computeRowProfile(white).isTextured).every((v) => v === 0)).toBe(true)
    expect(Array.from(computeRowProfile(black).isTextured).every((v) => v === 0)).toBe(true)
    expect(Array.from(computeRowProfile(smoothGrad).isTextured).every((v) => v === 0)).toBe(true)

    const doc = createVirtualDocument(128, 120, 7)
    const profile = computeRowProfile(doc)
    const texturedCount = Array.from(profile.isTextured).reduce((acc, v) => acc + v, 0)
    expect(texturedCount).toBeGreaterThan(40)
  })

  it('detects and trims exact scrolling overlap across multi-frame vertical stitches', async () => {
    const doc = createVirtualDocument(200, 900, 101)
    const shot1 = sliceRaster(doc, 0, 360)
    const shot2 = sliceRaster(doc, 240, 360) // 120px overlap with shot1
    const shot3 = sliceRaster(doc, 490, 360) // 110px overlap with shot2

    const pair01 = detectPairOverlap(shot1, shot2)
    expect(pair01.fixedTop).toBe(0)
    expect(pair01.fixedBottom).toBe(0)
    expect(pair01.scrollOverlap).toBe(120)
    expect(pair01.mae).toBe(0)

    const { createCanvas, buffers } = createSoftwarePixelCanvasFactory()
    const items = [
      makePixelImageItem('s1', shot1),
      makePixelImageItem('s2', shot2),
      makePixelImageItem('s3', shot3),
    ]

    const result = await mergeImages(items, {
      mode: 'vertical',
      normalize: 'match-max',
      gap: 0,
      padding: 0,
      removeOverlap: true,
      createCanvas,
    })

    // 360 + 360 + 360 = 1080 raw; trimmed 120 + 110 = 230 -> final height 850
    expect(result.width).toBe(200)
    expect(result.height).toBe(850)
    expect(result.layout.overlapRemovedPx).toBe(230)
    expect(result.layout.placements[0].sourceRect).toEqual({ x: 0, y: 0, width: 200, height: 360 })
    expect(result.layout.placements[1].sourceRect).toEqual({ x: 0, y: 120, width: 200, height: 240 })
    expect(result.layout.placements[2].sourceRect).toEqual({ x: 0, y: 110, width: 200, height: 250 })

    // Verify rendered output buffer matches ground-truth continuous document rows 0..850
    const finalCanvas = buffers[buffers.length - 1]
    expect(finalCanvas.height).toBe(850)
    const expected = sliceRaster(doc, 0, 850)
    let maxDiff = 0
    for (let i = 0; i < expected.data.length; i += 4) {
      maxDiff = Math.max(
        maxDiff,
        Math.abs(finalCanvas.data[i] - expected.data[i]),
        Math.abs(finalCanvas.data[i + 1] - expected.data[i + 1]),
        Math.abs(finalCanvas.data[i + 2] - expected.data[i + 2]),
      )
    }
    expect(maxDiff).toBe(0)
  })

  it('deduplicates fixed top status/nav bar, fixed bottom toolbar, and middle scroll overlap across 3 screenshots', async () => {
    const width = 200
    const viewportH = 420
    const fixedTop = 48
    const fixedBottom = 42
    const doc = createVirtualDocument(width, 1200, 202)

    // Scrollable window height = 420 - 48 - 42 = 330px per capture
    // Start at scrollY = 12 so textured content begins immediately below the fixed top bar
    const cap1 = composeViewportCapture(doc, 12, viewportH, fixedTop, fixedBottom, 0)
    // Slight clock tick (clockVariant = 1) to simulate real status bar minute change
    const cap2 = composeViewportCapture(doc, 252, viewportH, fixedTop, fixedBottom, 1) // 90px scroll overlap
    const cap3 = composeViewportCapture(doc, 502, viewportH, fixedTop, fixedBottom, 1) // 80px scroll overlap

    const match01 = detectPairOverlap(cap1, cap2)
    expect(match01.fixedTop).toBeGreaterThanOrEqual(fixedTop)
    expect(match01.fixedBottom).toBeGreaterThanOrEqual(fixedBottom)
    expect(match01.scrollOverlap).toBeGreaterThan(0)
    // Even if shared blank rows near a bar boundary shift between fixedBar and scrollOverlap,
    // total seam trim (fixedTop + fixedBottom + scrollOverlap) is mathematically invariant.
    expect(match01.fixedTop + match01.fixedBottom + match01.scrollOverlap).toBe(fixedTop + fixedBottom + 90)

    const { createCanvas, buffers } = createSoftwarePixelCanvasFactory()
    const items = [
      makePixelImageItem('cap1', cap1),
      makePixelImageItem('cap2', cap2),
      makePixelImageItem('cap3', cap3),
    ]

    const result = await mergeImages(items, {
      mode: 'vertical',
      gap: 0,
      padding: 0,
      removeOverlap: true,
      createCanvas,
    })

    // cap1 keeps top bar and drops bottom bar; cap3 drops top bar + overlap and keeps bottom bar
    expect(result.layout.placements[0].sourceRect.y).toBe(0)
    expect(result.layout.placements[0].sourceRect.height).toBeLessThanOrEqual(viewportH - fixedBottom)
    expect(result.layout.placements[1].sourceRect.y).toBeGreaterThanOrEqual(fixedTop + 80)
    expect(result.layout.placements[2].sourceRect.y + result.layout.placements[2].sourceRect.height).toBe(viewportH)

    const expectedRemoved = fixedBottom + (fixedTop + 90 + fixedBottom) + (fixedTop + 80)
    expect(result.layout.overlapRemovedPx).toBe(expectedRemoved)
    expect(result.height).toBe(viewportH * 3 - expectedRemoved)

    // Verify rendered pixels reconstruct [topBar] + continuous doc[12..832) + [bottomBar] with zero seams
    const finalCanvas = buffers[buffers.length - 1]
    const expectedScroll = sliceRaster(doc, 12, 820)
    let scrollMaxDiff = 0
    for (let y = 0; y < 820; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sOff = (y * width + x) * 4
        const dOff = ((fixedTop + y) * width + x) * 4
        scrollMaxDiff = Math.max(
          scrollMaxDiff,
          Math.abs(finalCanvas.data[dOff] - expectedScroll.data[sOff]),
          Math.abs(finalCanvas.data[dOff + 1] - expectedScroll.data[sOff + 1]),
          Math.abs(finalCanvas.data[dOff + 2] - expectedScroll.data[sOff + 2]),
        )
      }
    }
    expect(scrollMaxDiff).toBe(0)
  })

  it('never falsely crops pure white, pure black, blank-margin, or unrelated images', async () => {
    const whiteA = createRaster(200, 360, [255, 255, 255])
    const whiteB = createRaster(200, 360, [255, 255, 255])
    expect(detectPairOverlap(whiteA, whiteB)).toEqual({
      fixedTop: 0,
      fixedBottom: 0,
      scrollOverlap: 0,
      mae: 0,
      texturedRows: 0,
    })

    const blackA = createRaster(200, 360, [0, 0, 0])
    const blackB = createRaster(200, 360, [0, 0, 0])
    expect(detectPairOverlap(blackA, blackB)).toEqual({
      fixedTop: 0,
      fixedBottom: 0,
      scrollOverlap: 0,
      mae: 0,
      texturedRows: 0,
    })

    // Two distinct documents that share identical 36px pure white top/bottom margins
    const docA = composeViewportCapture(createVirtualDocument(200, 400, 303), 0, 360, 0, 0)
    const docB = composeViewportCapture(createVirtualDocument(200, 400, 909), 0, 360, 0, 0)
    fillRect(docA, 0, 0, 200, 36, [255, 255, 255])
    fillRect(docA, 0, 324, 200, 36, [255, 255, 255])
    fillRect(docB, 0, 0, 200, 36, [255, 255, 255])
    fillRect(docB, 0, 324, 200, 36, [255, 255, 255])
    expect(detectPairOverlap(docA, docB).scrollOverlap).toBe(0)
    expect(detectPairOverlap(docA, docB).fixedTop).toBe(0)
    expect(detectPairOverlap(docA, docB).fixedBottom).toBe(0)

    // Two distinct low-contrast gray-on-white pages rejected by NCC verification
    const lowA = createVirtualDocument(200, 360, 511, 'low')
    const lowB = createVirtualDocument(200, 360, 877, 'low')
    expect(detectPairOverlap(lowA, lowB).scrollOverlap).toBe(0)

    // End-to-end pure white merge preserves full uncropped height
    const { createCanvas } = createSoftwarePixelCanvasFactory()
    const whiteMerge = await mergeImages(
      [makePixelImageItem('w1', whiteA), makePixelImageItem('w2', whiteB)],
      { mode: 'vertical', gap: 0, padding: 0, removeOverlap: true, createCanvas },
    )
    expect(whiteMerge.height).toBe(720)
    expect(whiteMerge.layout.overlapRemovedPx).toBe(0)
  })

  it('normalizes mismatched image widths (1x vs 2x Retina) and trims overlap accurately', async () => {
    // Master document at 2x resolution (512px wide)
    const master2x = createVirtualDocument(512, 1600, 404)
    const raw1_2x = sliceRaster(master2x, 0, 800) // 512 x 800
    const raw2_2x = sliceRaster(master2x, 560, 800) // 240px overlap in 2x space (= 120px in 1x space)

    // Downscale first capture to 1x (256 x 400) while keeping second capture at 2x (512 x 800)
    const cap1_1x = scaleRasterBilinear(raw1_2x, 256, 400)

    const { createCanvas } = createSoftwarePixelCanvasFactory()
    const result = await mergeImages(
      [makePixelImageItem('shot1x', cap1_1x), makePixelImageItem('shot2x', raw2_2x)],
      {
        mode: 'vertical',
        normalize: 'match-min',
        gap: 0,
        padding: 0,
        removeOverlap: true,
        createCanvas,
      },
    )

    // Expected trim on shot2x is ~240px in 2x coords -> ~120px removed in 256px-wide output layout
    expect(result.width).toBe(256)
    expect(result.layout.placements[1].sourceRect.y).toBeGreaterThanOrEqual(236)
    expect(result.layout.placements[1].sourceRect.y).toBeLessThanOrEqual(244)
    expect(result.layout.overlapRemovedPx).toBeGreaterThanOrEqual(118)
    expect(result.layout.overlapRemovedPx).toBeLessThanOrEqual(122)
    expect(result.height).toBe(800 - (result.layout.overlapRemovedPx ?? 0))
  })

  it('tolerates mild JPEG-like pixel noise and rotated 90deg vertical stitches', async () => {
    const doc = createVirtualDocument(200, 640, 505)
    const shot1 = sliceRaster(doc, 0, 360)
    const shot2Noisy = addDeterministicNoise(sliceRaster(doc, 260, 360), 4, 17) // 100px overlap with +/-4 noise

    const noisyMatch = detectPairOverlap(shot1, shot2Noisy)
    expect(noisyMatch.scrollOverlap).toBe(100)
    expect(noisyMatch.mae).toBeLessThan(6)

    // Store screenshots rotated 270deg (so rotating +90deg clockwise restores upright vertical orientation)
    const uprightA = sliceRaster(doc, 0, 360)
    const uprightB = sliceRaster(doc, 260, 360)
    const rawRotA = rotateRasterClockwise90(rotateRasterClockwise90(rotateRasterClockwise90(uprightA)))
    const rawRotB = rotateRasterClockwise90(rotateRasterClockwise90(rotateRasterClockwise90(uprightB)))

    const { createCanvas } = createSoftwarePixelCanvasFactory()
    const rotResult = await mergeImages(
      [makePixelImageItem('rA', rawRotA), makePixelImageItem('rB', rawRotB)],
      {
        mode: 'vertical',
        gap: 0,
        padding: 0,
        itemRotations: [90, 90],
        removeOverlap: true,
        createCanvas,
      },
    )
    expect(rotResult.width).toBe(200)
    expect(rotResult.height).toBe(620)
    expect(rotResult.layout.overlapRemovedPx).toBe(100)
    // Rotated 90deg top-trim of 100 maps to unrotated x=100, width=260
    expect(rotResult.layout.placements[1].sourceRect).toEqual({ x: 100, y: 0, width: 260, height: 200 })
  })

  it('degrades safely to zero overlap when Canvas getImageData is missing or throws', async () => {
    const items = [
      makeMockImageItem({ id: 'm1', width: 400, height: 600 }),
      makeMockImageItem({ id: 'm2', width: 400, height: 600 }),
    ]

    // 1. Recording mock canvas without getImageData
    const { createCanvas } = createRecordingCanvasFactory()
    expect(extractNormalizedRaster(items[0], 128, 0, createCanvas)).toBeNull()

    const plan = detectVerticalStitchOverlaps(items, { createCanvas })
    expect(plan.trims).toEqual([
      { trimTop: 0, trimBottom: 0 },
      { trimTop: 0, trimBottom: 0 },
    ])

    const result = await mergeImages(items, {
      mode: 'vertical',
      gap: 0,
      padding: 0,
      removeOverlap: true,
      createCanvas,
    })
    expect(result.width).toBe(400)
    expect(result.height).toBe(1200)
    expect(result.layout.overlapRemovedPx).toBe(0)

    // 2. Canvas whose getImageData throws (e.g. tainted canvas SecurityError)
    const throwingFactory: CanvasFactory = (w, h) => {
      const base = createCanvas(w, h)
      return {
        ...base,
        getContext(id) {
          const ctx = base.getContext(id)
          if (!ctx) return null
          return {
            ...ctx,
            getImageData() {
              throw new Error('SecurityError: tainted canvas')
            },
          }
        },
      }
    }

    const safeResult = await mergeImages(items, {
      mode: 'vertical',
      gap: 0,
      padding: 0,
      removeOverlap: true,
      createCanvas: throwingFactory,
    })
    expect(safeResult.height).toBe(1200)
    expect(safeResult.layout.overlapRemovedPx).toBe(0)
  })

  it('applies per-seam seamOverlapOverrides safely clamped to keep at least 16px and exposes seams metadata', async () => {
    const doc = createVirtualDocument(200, 900, 777)
    const shot1 = sliceRaster(doc, 0, 360)
    const shot2 = sliceRaster(doc, 240, 360) // auto overlap 120px
    const shot3 = sliceRaster(doc, 490, 360) // auto overlap 110px

    const { createCanvas } = createSoftwarePixelCanvasFactory()
    const items = [
      makePixelImageItem('o1', shot1),
      makePixelImageItem('o2', shot2),
      makePixelImageItem('o3', shot3),
    ]

    const result = await mergeImages(items, {
      mode: 'vertical',
      gap: 0,
      padding: 0,
      removeOverlap: true,
      seamOverlapOverrides: {
        0: 60, // override seam 0 (item 1 top trim) from 120px to 60px
        1: 9999, // extreme override clamped so item 2 keeps >= 16px (360 - 16 = 344)
      },
      createCanvas,
    })

    expect(result.seams).toHaveLength(2)
    expect(result.layout.seams).toEqual(result.seams)
    expect(result.seams?.[0]).toEqual({
      index: 0,
      autoOverlapPx: 120,
      appliedOverlapPx: 60,
      fixedTopPx: 0,
      fixedBottomPx: 0,
    })
    expect(result.seams?.[1]).toEqual({
      index: 1,
      autoOverlapPx: 110,
      appliedOverlapPx: 344,
      fixedTopPx: 0,
      fixedBottomPx: 0,
    })
    // Final height: 360 + (360 - 60) + (360 - 344) = 360 + 300 + 16 = 676
    expect(result.height).toBe(676)
    expect(result.layout.placements[1].sourceRect).toEqual({ x: 0, y: 60, width: 200, height: 300 })
    expect(result.layout.placements[2].sourceRect).toEqual({ x: 0, y: 344, width: 200, height: 16 })
  })
})
