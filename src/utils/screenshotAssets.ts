import { nanoid } from 'nanoid'
import { fileToDataUrl } from './files'

export const MAX_SCREENSHOT_BYTES = 25 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** Collision-proof project-scoped asset reference. No original filename is used as a key. */
export async function prepareScreenshotUpload(file: File): Promise<{ key: string; dataUrl: string }> {
  if (!SUPPORTED_TYPES.has(file.type)) throw new Error('Choose a PNG, JPEG or WebP screenshot.')
  if (file.size > MAX_SCREENSHOT_BYTES) throw new Error('Screenshots must be smaller than 25 MB.')
  const dataUrl = await fileToDataUrl(file)
  return { key: `shot-${nanoid(14)}`, dataUrl }
}
