import { describe, expect, it } from 'vitest'
import { getMockupSvg } from './registry'
import { escapeBrowserLabel, isBrowserModel, renderBrowserFrame } from './browser'

describe('customizable browser mockups', () => {
  it('recognizes browser and preserves device selection', () => {
    expect(isBrowserModel('browser-chrome')).toBe(true)
    expect(isBrowserModel('browser-safari')).toBe(true)
    expect(isBrowserModel('iphone-16-pro')).toBe(false)
    expect(getMockupSvg('iphone-16-pro')).toBe(getMockupSvg('iphone-16-pro', { title: 'ignore' }))
  })
  it('keeps the screenshot viewport unobstructed by solid frame fills', () => {
    for (const model of ['browser-chrome', 'browser-safari', 'browser-minimal'] as const) {
      const xml = renderBrowserFrame(model)
      expect(xml).toContain('fill="none"')
      expect(xml).not.toMatch(/<rect x="1" y="1" width="1198" height="748" rx="19" fill="#/)
      expect(xml).toContain(model === 'browser-minimal' ? 'y="47"' : 'y="70"')
    }
  })
  it('renders custom text without allowing injected SVG nodes or attribute breaks', () => {
    const attack = '<script>alert("x")</script> & fish'
    const svg = getMockupSvg('browser-chrome', {
      title: attack, address: 'https://example.com/?q="x"&x=<img>',
    })
    expect(svg).not.toContain('<script>')
    expect(svg).not.toContain('<img>')
    expect(svg).toContain('&lt;script&gt;')
    expect(svg).toContain('&amp;')
    expect(svg).toContain('&quot;')
    expect(escapeBrowserLabel('a\u0000b\u0001c', 30)).toBe('abc')
  })
  it('toggles address and persists light/dark window chrome', () => {
    const withBar = renderBrowserFrame('browser-safari', { showAddressBar: true, theme: 'dark' })
    const withoutBar = renderBrowserFrame('browser-safari', { showAddressBar: false, theme: 'light' })
    expect(withBar).toContain('https://example.com')
    expect(withoutBar).not.toContain('https://example.com')
    expect(withBar).toContain('#252d3e')
    expect(withoutBar).toContain('#f4f5f8')
  })
})
