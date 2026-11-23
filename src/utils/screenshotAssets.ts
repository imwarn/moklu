/**
 * [INPUT]: depends on nanoid from nanoid and fileToDataUrl from ./files
 * [OUTPUT]: exports MAX_SCREENSHOT_BYTES, validateScreenshotFile, and prepareScreenshotUpload
 * [POS]: screenshot upload type/size validator and asset-key preparer in src/utils; consumed by Studio screenshot upload flows
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import { fileToDataUrl } from './files'

export const MAX_SCREENSHOT_BYTES = 25 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** Validate before reading any bytes: SVG/HTML are not accepted as screenshots. */
export function validateScreenshotFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!SUPPORTED_TYPES.has(file.type)) return 'Choose a PNG, JPEG or WebP screenshot.'
  if (file.size > MAX_SCREENSHOT_BYTES) return 'Screenshots must be smaller than 25 MB.'
  if (file.size === 0) return 'The screenshot file is empty.'
  return null
}

/** Collision-proof project-scoped asset reference. No original filename is used as a key. */
export async function prepareScreenshotUpload(file: File): Promise<{ key: string; dataUrl: string }> {
  const error = validateScreenshotFile(file)
  if (error) throw new Error(error)
  const dataUrl = await fileToDataUrl(file)
  return { key: `shot-${nanoid(14)}`, dataUrl }
}
