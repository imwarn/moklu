import type { BrowserChromeOptions, PhoneModel } from '@/types'

export type BrowserModel = Extract<PhoneModel, 'browser-chrome' | 'browser-safari' | 'browser-minimal'>

export const DEFAULT_BROWSER_CHROME: Required<BrowserChromeOptions> = {
  title: 'Your website',
  address: 'https://example.com',
  theme: 'light',
  showAddressBar: true,
}

export function isBrowserModel(model: PhoneModel): model is BrowserModel {
  return model === 'browser-chrome' || model === 'browser-safari' || model === 'browser-minimal'
}

/** XML-escape user labels to prevent SVG markup injection. */
export function escapeBrowserLabel(input: string, limit: number): string {
  return Array.from(input.replace(/[\\u0000-\\u001f\\u007f-\\u009f]/g, '').trim())
    .slice(0, limit).join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function browserColors(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? { frame: '#19202e', top: '#252d3e', line: '#485064', address: '#151b28', text: '#d4dce9', muted: '#97a3bc', tab: '#313b4e' }
    : { frame: '#e9edf3', top: '#f4f5f8', line: '#d1d5de', address: '#ffffff', text: '#333e54', muted: '#66758b', tab: '#e8ebf1' }
}

/** Returns a HOLLOW frame: top chrome, side rails and bottom border only.
 * The screenshot is visible through the exact 1176px-wide cut-out.
 */
export function renderBrowserFrame(model: BrowserModel, options: BrowserChromeOptions = {}): string {
  const theme = options.theme ?? (model === 'browser-chrome' ? 'dark' : 'light')
  const c = browserColors(theme)
  const title = escapeBrowserLabel(options.title ?? DEFAULT_BROWSER_CHROME.title, 38)
  const address = escapeBrowserLabel(options.address ?? DEFAULT_BROWSER_CHROME.address, 72)
  const showAddress = options.showAddressBar ?? true
  const minimal = model === 'browser-minimal'
  const y = minimal ? 47 : 70
  const dotsY = minimal ? 23 : 23
  const dots = [30, 53, 76].map((x, index) =>
    '<circle cx="' + x + '" cy="' + dotsY + '" r="7" fill="' + ['#ff605b', '#ffbd45', '#00c748'][index] + '"/>'
  ).join('')
  const glass = '<path d="M19 1H1181Q1199 1 1199 19V' + y + 'H1V19Q1 1 19 1Z" fill="' + c.top + '"/>'
  const shell = '<rect x="1" y="' + y + '" width="11" height="' + (738 - y) + '" fill="' + c.frame + '"/>' +
    '<rect x="1188" y="' + y + '" width="11" height="' + (738 - y) + '" fill="' + c.frame + '"/>' +
    '<rect x="1" y="738" width="1198" height="11" fill="' + c.frame + '"/>'
  const addressText = '<text x="149" y="55" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="' + c.text + '">' + address + '</text>'
  const addressBar = '<rect x="130" y="36" width="940" height="27" rx="9" fill="' + c.address + '" stroke="' + c.line + '" stroke-width="1"/>' + addressText
  const tab = '<path d="M115 31V14Q115 9 120 9H440Q447 9 447 16V31Z" fill="' + c.tab + '"/>' +
    '<text x="130" y="25" fill="' + c.text + '" font-family="Arial,Helvetica,sans-serif" font-size="16">' + title + '</text>'
  let controls = dots
  if (minimal) {
    controls += '<text x="115" y="29" fill="' + c.text + '" font-family="Arial,Helvetica,sans-serif" font-size="18">' + title + '</text>'
    if (showAddress) controls += '<text x="810" y="28" fill="' + c.muted + '" font-family="Arial,Helvetica,sans-serif" font-size="14">' +
      escapeBrowserLabel(options.address ?? DEFAULT_BROWSER_CHROME.address, 34) + '</text>'
  } else if (model === 'browser-chrome') {
    controls += tab + '<path d="M27 51h9m-4-4-5 4 5 4M60 51h9m-4-4 4 4-4 4" stroke="' + c.muted + '" stroke-width="2" fill="none"/>'
    if (showAddress) controls += addressBar
  } else {
    controls += '<text x="115" y="28" fill="' + c.text + '" font-family="Arial,Helvetica,sans-serif" font-size="16">' + title + '</text>'
    if (showAddress) controls += '<rect x="290" y="35" width="620" height="27" rx="10" fill="' + c.address + '" stroke="' + c.line + '"/>' +
      '<text x="310" y="55" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="' + c.text + '">' + address + '</text>'
  }
  const border = '<rect x="1" y="1" width="1198" height="748" rx="19" fill="none" stroke="' + c.line + '" stroke-width="2"/>'
  const line = '<path d="M12 ' + (y - 1) + 'H1188" stroke="' + c.line + '"/>'
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">' +
    shell + glass + controls + line + border + '</svg>'
}

export const BROWSER_CHROME_SVG = renderBrowserFrame('browser-chrome')
export const BROWSER_SAFARI_SVG = renderBrowserFrame('browser-safari')
export const BROWSER_MINIMAL_SVG = renderBrowserFrame('browser-minimal')
