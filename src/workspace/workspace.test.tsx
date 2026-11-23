/**
 * [INPUT]: depends on vitest, react-dom/server, jszip, QuickWorkspace, getWorkspaceStrings, canvasUtils, and workspace types
 * [OUTPUT]: Vitest suite validating all 6 Quick Workspace tools, 4 locales, light/dark theming, preset propagation, demo generators, and ZIP packing
 * [POS]: automated verification suite for src/workspace
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import JSZip from 'jszip'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  QuickWorkspace,
  createDefaultWorkspaceEngines,
  createDemoImageInput,
  createDemoScreenshotDataUrl,
  formatBytes,
  getWorkspaceStrings,
  type DemoVariant,
  type WorkspaceLocale,
  type WorkspacePreset,
  type WorkspaceToolId,
} from './index'

const ALL_TOOLS: WorkspaceToolId[] = ['mockup', 'merge', 'split', 'compress', 'resize', 'id-card']
const ALL_LOCALES: WorkspaceLocale[] = ['en', 'zh', 'ja', 'ko']

describe('QuickWorkspace', () => {
  it('renders all 6 tools cleanly in both light and dark themes', () => {
    const onOpenInStudio = vi.fn()
    for (const theme of ['light', 'dark'] as const) {
      for (const tool of ALL_TOOLS) {
        const html = renderToStaticMarkup(
          <QuickWorkspace
            preset={{ tool }}
            locale="en"
            theme={theme}
            onOpenInStudio={onOpenInStudio}
            onOpenProModal={vi.fn()}
          />,
        )
        expect(html).toContain(`data-theme="${theme}"`)
        expect(html).toContain(`data-active-tool="${tool}"`)
        expect(html).toContain(`id="moklu-panel-${tool}"`)
        expect(html).toContain('100% Local Browser Processing')
      }
    }
  })

  it('renders localized UI copy across EN, ZH, JA, and KO', () => {
    const expectedStudioLabel: Record<WorkspaceLocale, string> = {
      en: 'Open in Studio ↗',
      zh: '在 Studio 画布精修 ↗',
      ja: 'Studio で詳細編集 ↗',
      ko: 'Studio에서 정밀 편집 ↗',
    }
    const expectedWatermark: Record<WorkspaceLocale, string> = {
      en: 'FOR VERIFICATION ONLY',
      zh: '仅供办理业务使用 他用无效',
      ja: '本人確認専用・他用無効',
      ko: '본인 확인 전용 · 타 용도 사용 금지',
    }

    for (const locale of ALL_LOCALES) {
      const mockupHtml = renderToStaticMarkup(
        <QuickWorkspace
          preset={{ tool: 'mockup' }}
          locale={locale}
          theme="light"
          onOpenInStudio={vi.fn()}
        />,
      )
      expect(mockupHtml).toContain(expectedStudioLabel[locale])

      const idCardHtml = renderToStaticMarkup(
        <QuickWorkspace
          preset={{ tool: 'id-card' }}
          locale={locale}
          theme="light"
          onOpenInStudio={vi.fn()}
        />,
      )
      expect(idCardHtml).toContain(expectedWatermark[locale])
    }
  })

  it('applies tool-specific presets accurately to initial state', () => {
    const presets: Array<{ preset: WorkspacePreset; expectSnippet: string }> = [
      { preset: { tool: 'mockup', mockupModel: 'iphone-16-pro', canvasSize: 'story' }, expectSnippet: '1080 × 1920' },
      { preset: { tool: 'merge', mergeDirection: 'grid' }, expectSnippet: 'Columns' },
      { preset: { tool: 'split', splitMode: 'grid' }, expectSnippet: '3×3 Nine-Grid' },
      { preset: { tool: 'compress', targetFormat: 'image/jpeg' }, expectSnippet: 'aria-checked="true"' },
      { preset: { tool: 'resize', resizeMode: 'pad' }, expectSnippet: 'Border Size' },
    ]

    for (const { preset, expectSnippet } of presets) {
      const html = renderToStaticMarkup(
        <QuickWorkspace preset={preset} locale="en" theme="light" onOpenInStudio={vi.fn()} />,
      )
      expect(html).toContain(expectSnippet)
    }
  })

  it('shows Pro batch CTA only when onOpenProModal hook is provided', () => {
    const withPro = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'mockup' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
        onOpenProModal={vi.fn()}
      />,
    )
    expect(withPro).toContain('4K Batch Export · Pro')

    const withoutPro = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'mockup' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(withoutPro).not.toContain('4K Batch Export · Pro')
  })
})

describe('workspace i18n and utilities', () => {
  it('provides complete non-empty dictionaries for all 4 locales', () => {
    for (const locale of ALL_LOCALES) {
      const dict = getWorkspaceStrings(locale)
      for (const tool of ALL_TOOLS) {
        expect(dict.tabs[tool].label.trim().length).toBeGreaterThan(0)
        expect(dict.tabs[tool].short.trim().length).toBeGreaterThan(0)
        expect(dict.tabs[tool].description.trim().length).toBeGreaterThan(0)
      }
      expect(dict.common.privacyBadge.trim().length).toBeGreaterThan(0)
      expect(dict.idCard.defaultWatermark.trim().length).toBeGreaterThan(0)
    }
  })

  it('synthesizes deterministic SVG data URLs for all demo variants', () => {
    const variants: DemoVariant[] = ['saas', 'mobile', 'photo-1', 'photo-2', 'photo-3', 'panorama', 'id-front', 'id-back']
    for (const variant of variants) {
      const url = createDemoScreenshotDataUrl(variant)
      expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
      const input = createDemoImageInput(variant, `${variant}.svg`)
      expect(input.width).toBeGreaterThan(0)
      expect(input.height).toBeGreaterThan(0)
      expect(input.dataUrl).toBe(url)
    }
  })

  it('formats byte sizes across B, KB, and MB ranges', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(1_572_864)).toBe('1.50 MB')
  })

  it('packs files into a readable ZIP archive using default engines', async () => {
    const engines = createDefaultWorkspaceEngines()
    const zipBlob = await engines.packZip([
      { filename: 'slide-01.txt', blob: new Blob(['hello-1'], { type: 'text/plain' }) },
      { filename: 'slide-02.txt', blob: new Blob(['hello-2'], { type: 'text/plain' }) },
    ])
    expect(zipBlob.size).toBeGreaterThan(0)
    const buffer = await zipBlob.arrayBuffer()
    const loaded = await JSZip.loadAsync(buffer)
    expect(Object.keys(loaded.files).sort()).toEqual(['slide-01.txt', 'slide-02.txt'])
    expect(await loaded.file('slide-01.txt')?.async('string')).toBe('hello-1')
  })
})
