import type { PhoneModel, BrowserChromeOptions } from '@/types'
import { IPHONE_16_PRO_SVG } from './iphone-16-pro'
import { IPHONE_16_PRO_PLAIN_SVG } from './iphone-16-pro-plain'
import { PIXEL_9_SVG } from './pixel-9'
import { PIXEL_9_PLAIN_SVG } from './pixel-9-plain'
import { APPLE_WATCH_SVG } from './apple-watch'
import { WEAR_OS_SVG } from './wear-os'
import { IPAD_SVG } from './ipad'
import { ANDROID_TABLET_SVG } from './android-tablet'
import { BROWSER_CHROME_SVG, BROWSER_SAFARI_SVG, BROWSER_MINIMAL_SVG, isBrowserModel, renderBrowserFrame } from './browser'

export type MockupCategory = 'phone' | 'tablet' | 'watch' | 'screen' | 'browser'

const FRAMELESS = '<svg xmlns="http://www.w3.org/2000/svg"/>'

/** Central registration point for frame art and mockup categories.
 * Rendering, categorization and device selection no longer depend on a
 * default-iPhone switch. A new frame adds one registry entry and one spec.
 */
const REGISTRY: Record<PhoneModel, { category: MockupCategory; svg: string }> = {
  'iphone-16-pro': { category: 'phone', svg: IPHONE_16_PRO_SVG },
  'iphone-16-pro-plain': { category: 'phone', svg: IPHONE_16_PRO_PLAIN_SVG },
  'pixel-9': { category: 'phone', svg: PIXEL_9_SVG },
  'pixel-9-plain': { category: 'phone', svg: PIXEL_9_PLAIN_SVG },
  'apple-watch': { category: 'watch', svg: APPLE_WATCH_SVG },
  'wear-os': { category: 'watch', svg: WEAR_OS_SVG },
  'ipad-13': { category: 'tablet', svg: IPAD_SVG },
  'android-tablet': { category: 'tablet', svg: ANDROID_TABLET_SVG },
  'screen-16-9': { category: 'screen', svg: FRAMELESS },
  'screen-16-10': { category: 'screen', svg: FRAMELESS },
  'browser-chrome': { category: 'browser', svg: BROWSER_CHROME_SVG },
  'browser-safari': { category: 'browser', svg: BROWSER_SAFARI_SVG },
  'browser-minimal': { category: 'browser', svg: BROWSER_MINIMAL_SVG },
}

export function getMockupCategory(id: PhoneModel): MockupCategory {
  return REGISTRY[id].category
}

export function getMockupSvg(id: PhoneModel, options?: BrowserChromeOptions): string {
  if (isBrowserModel(id)) return options ? renderBrowserFrame(id, options) : REGISTRY[id].svg
  const spec = REGISTRY[id]
  if (!spec) throw new Error(`Unknown mockup model: ${id}`)
  return spec.svg
}
