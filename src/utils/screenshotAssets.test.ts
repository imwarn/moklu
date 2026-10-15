import { describe, expect, it } from 'vitest'
import { MAX_SCREENSHOT_BYTES, validateScreenshotFile } from './screenshotAssets'

describe('screenshot quick-start validation', () => {
  const file = (type: string, size: number) => ({ type, size })
  it('allows only the supported raster screenshots', () => {
    expect(validateScreenshotFile(file('image/png', 1024))).toBeNull()
    expect(validateScreenshotFile(file('image/jpeg', 1024))).toBeNull()
    expect(validateScreenshotFile(file('image/webp', 1024))).toBeNull()
    expect(validateScreenshotFile(file('image/svg+xml', 1024))).toContain('PNG')
    expect(validateScreenshotFile(file('text/html', 1024))).not.toBeNull()
  })
  it('rejects oversized and zero-byte uploads before decoding', () => {
    expect(validateScreenshotFile(file('image/png', MAX_SCREENSHOT_BYTES + 1))).toContain('25 MB')
    expect(validateScreenshotFile(file('image/png', 0))).toContain('empty')
    expect(validateScreenshotFile(file('image/png', MAX_SCREENSHOT_BYTES))).toBeNull()
  })
})
