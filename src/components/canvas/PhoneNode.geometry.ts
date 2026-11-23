/**
 * [INPUT]: depends on none (pure numeric geometry math)
 * [OUTPUT]: exports calcScreenshotLayout computing cover/contain/fill placement and offsets for a screenshot inside a device screen rect
 * [POS]: pure geometry helper paired with PhoneNode.tsx in src/components/canvas; isolates aspect-ratio math and is unit-tested by PhoneNode.geometry.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export function calcScreenshotLayout(
  imgW: number,
  imgH: number,
  screenW: number,
  screenH: number,
  fit: 'cover' | 'contain' | 'fill',
  offsetX: number,
  offsetY: number,
) {
  if (fit === 'fill') {
    return { x: 0, y: 0, width: screenW, height: screenH }
  }
  const scaleX = screenW / imgW
  const scaleY = screenH / imgH
  const s = fit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY)
  const rW = imgW * s
  const rH = imgH * s
  return {
    x: (screenW - rW) / 2 + offsetX,
    y: (screenH - rH) / 2 + offsetY,
    width: rW,
    height: rH,
  }
}
