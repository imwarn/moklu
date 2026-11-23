/**
 * [INPUT]: depends on node:fs, node:path, vitest, react, react-dom/server, jszip, QuickDesignPreview, QuickWorkspace, batchHelpers, ResizePreviewStage, CompressPreviewModal, getWorkspaceStrings, getWorkspaceThemeTokens, canvasUtils, and workspace types
 * [OUTPUT]: Vitest suite validating all 6 Quick Workspace tools, 4 locales, light/dark violet tokens, roving tabIndex, label bindings, busy overlay, QuickDesignPreview scaleFactor, preset propagation, multi-image Resize filmstrip UX, Compress preview modal, demo generators, and dynamic ZIP packing
 * [POS]: automated verification suite for src/workspace
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import JSZip from 'jszip'
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { QuickDesignPreview } from '@/components/panels/QuickDesignPreview'
import {
  QuickWorkspace,
  buildBatchStudioHandoff,
  clampBatchIndex,
  createDefaultWorkspaceEngines,
  createDemoImageInput,
  createDemoScreenshotDataUrl,
  formatBytes,
  getWorkspaceStrings,
  getWorkspaceThemeTokens,
  removeBatchEntry,
  stepBatchIndex,
  type DemoVariant,
  type WorkspaceBlobOutput,
  type WorkspaceCompressItem,
  type WorkspaceLocale,
  type WorkspacePreset,
  type WorkspaceToolId,
} from './index'
import { CompressPreviewModal } from './tools/CompressQuickTool'
import { ResizePreviewStage } from './tools/ResizeQuickTool'

const ALL_TOOLS: WorkspaceToolId[] = ['mockup', 'merge', 'split', 'compress', 'resize', 'id-card']
const ALL_LOCALES: WorkspaceLocale[] = ['en', 'zh', 'ja', 'ko']

interface InspectableElementProps {
  children?: ReactNode
  onClick?: () => void
  'data-testid'?: string
  [key: string]: unknown
}

function findElementByTestId(node: ReactNode, testId: string): ReactElement<InspectableElementProps> | null {
  if (!isValidElement<InspectableElementProps>(node)) return null
  if (node.props['data-testid'] === testId) return node
  let found: ReactElement<InspectableElementProps> | null = null
  Children.forEach(node.props.children, (child) => {
    if (!found) found = findElementByTestId(child, testId)
  })
  return found
}

function makeMockOutput(name: string, width: number, height: number, sizeBytes: number): WorkspaceBlobOutput {
  return {
    blob: new Blob(['mock'], { type: 'image/png' }),
    dataUrl: `data:image/png;base64,${name}`,
    width,
    height,
    filename: name,
    sizeBytes,
    mimeType: 'image/png',
  }
}

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
      { preset: { tool: 'resize', resizeMode: 'resize' }, expectSnippet: 'Scale (%)' },
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

describe('ResizeQuickTool multi-image preview filmstrip UX', () => {
  const batchOutputs: WorkspaceBlobOutput[] = [
    makeMockOutput('hero-01.png', 800, 600, 12_288),
    makeMockOutput('portrait-02.png', 1080, 1350, 24_576),
    makeMockOutput('square-03.png', 1200, 1200, 18_432),
  ]

  it('renders all N thumbnails, switches main preview src and badge on thumbnail #2 click, and removes single item cleanly', () => {
    let items = [...batchOutputs]
    let selectedIndex = 0
    const downloaded: number[] = []

    const renderStageTree = () =>
      ResizePreviewStage({
        theme: 'light',
        locale: 'zh',
        outputs: items,
        selectedIndex,
        hasSourceImages: items.length > 0,
        onSelectIndex: (next) => {
          selectedIndex = next
        },
        onDownloadAt: (idx) => {
          downloaded.push(idx)
        },
        onRemoveAt: (removeIdx) => {
          const next = removeBatchEntry(items, removeIdx, selectedIndex)
          items = next.items
          selectedIndex = next.nextIndex
        },
        onClearAll: () => {
          items = []
          selectedIndex = 0
        },
        onLoadDemo: vi.fn(),
        onFiles: vi.fn(),
      })

    // Initial render: all 3 thumbnails present, item #1 shown in main preview.
    const initialHtml = renderToStaticMarkup(renderStageTree())
    expect(initialHtml).toContain('data-testid="resize-thumbnail-strip"')
    expect(initialHtml).toContain('data-testid="resize-thumb-0"')
    expect(initialHtml).toContain('data-testid="resize-thumb-1"')
    expect(initialHtml).toContain('data-testid="resize-thumb-2"')
    expect(initialHtml).toContain('1/3 · 800 × 600')
    expect(initialHtml).toContain('src="data:image/png;base64,hero-01.png"')

    // Click thumbnail #2 -> updates selectedIndex to 1, main preview src & dimension badge switch to item #2.
    const thumb2Btn = findElementByTestId(renderStageTree(), 'resize-thumb-select-1')
    expect(thumb2Btn?.props.onClick).toBeTypeOf('function')
    thumb2Btn?.props.onClick?.()
    expect(selectedIndex).toBe(1)

    const secondHtml = renderToStaticMarkup(renderStageTree())
    expect(secondHtml).toContain('2/3 · 1080 × 1350')
    expect(secondHtml).toContain('src="data:image/png;base64,portrait-02.png"')

    // Click single-item download on item #2.
    const dlBtn = findElementByTestId(renderStageTree(), 'resize-thumb-download-1')
    dlBtn?.props.onClick?.()
    expect(downloaded).toEqual([1])

    // Click single-item remove on item #2 -> count drops from 3 to 2 and selection stays valid.
    const removeBtn = findElementByTestId(renderStageTree(), 'resize-thumb-remove-1')
    removeBtn?.props.onClick?.()
    expect(items).toHaveLength(2)
    expect(selectedIndex).toBe(1)

    const afterRemoveHtml = renderToStaticMarkup(renderStageTree())
    expect(afterRemoveHtml).toContain('2/2 · 1200 × 1200')
    expect(afterRemoveHtml).toContain('src="data:image/png;base64,square-03.png"')
    expect(afterRemoveHtml).not.toContain('data-testid="resize-thumb-2"')
  })

  it('passes all processed images to Studio handoff in carousel mode when multiple items exist', () => {
    const multiPayload = buildBatchStudioHandoff(batchOutputs, 1)
    expect(multiPayload).not.toBeNull()
    expect(multiPayload?.mode).toBe('carousel')
    expect(multiPayload?.images).toHaveLength(3)
    expect(multiPayload?.images.map((img) => img.name)).toEqual([
      'hero-01.png',
      'portrait-02.png',
      'square-03.png',
    ])
    expect(multiPayload?.slideWidth).toBe(1080)
    expect(multiPayload?.slideHeight).toBe(1350)

    const singlePayload = buildBatchStudioHandoff([batchOutputs[0]], 0)
    expect(singlePayload?.mode).toBe('canvas')
    expect(singlePayload?.images).toHaveLength(1)
    expect(buildBatchStudioHandoff([], 0)).toBeNull()
  })

  it('clamps, wraps, and adjusts batch selection indices across edge cases', () => {
    expect(clampBatchIndex(5, 3)).toBe(2)
    expect(clampBatchIndex(-1, 3)).toBe(0)
    expect(clampBatchIndex(2, 0)).toBe(0)
    expect(stepBatchIndex(0, -1, 3)).toBe(2)
    expect(stepBatchIndex(2, 1, 3)).toBe(0)

    // Removing an item before the selected index shifts selectedIndex left by 1.
    const shifted = removeBatchEntry(['a', 'b', 'c'], 0, 2)
    expect(shifted.items).toEqual(['b', 'c'])
    expect(shifted.nextIndex).toBe(1)

    // Removing the last remaining item resets nextIndex to 0.
    const empty = removeBatchEntry(['only'], 0, 0)
    expect(empty.items).toEqual([])
    expect(empty.nextIndex).toBe(0)
  })
})

describe('CompressPreviewModal', () => {
  it('renders dialog preview with savings metadata and close button', () => {
    const mockItem: WorkspaceCompressItem = {
      ...makeMockOutput('banner-compressed.webp', 1200, 630, 50_000),
      id: 'c1',
      originalName: 'banner.png',
      originalBytes: 100_000,
      outputBytes: 50_000,
      savedRatio: 0.5,
    }
    const html = renderToStaticMarkup(
      <CompressPreviewModal
        item={mockItem}
        theme="dark"
        locale="en"
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    )
    expect(html).toContain('role="dialog"')
    expect(html).toContain('banner-compressed.webp')
    expect(html).toContain('1200 × 630')
    expect(html).toContain('-50%')
    expect(html).toContain('data-testid="compress-preview-close"')
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
      expect(dict.common.previousImage.trim().length).toBeGreaterThan(0)
      expect(dict.common.nextImage.trim().length).toBeGreaterThan(0)
      expect(dict.resize.byScale.trim().length).toBeGreaterThan(0)
      expect(dict.compress.clickToPreview.trim().length).toBeGreaterThan(0)
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

  it('packs files into a readable ZIP archive using default engines without static jszip import', async () => {
    const defaultEnginesSource = readFileSync(resolve(import.meta.dirname, 'defaultEngines.ts'), 'utf8')
    expect(defaultEnginesSource).not.toMatch(/^\s*import\s+JSZip\s+from\s+['"]jszip['"]/m)
    expect(defaultEnginesSource).toContain("import('jszip')")

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

  it('applies scaleFactor to QuickDesignPreview SVG group transform', () => {
    const baseHtml = renderToStaticMarkup(
      <QuickDesignPreview width={1600} height={900} theme="aurora" mockup="browser-chrome" scaleFactor={1} />,
    )
    const scaledHtml = renderToStaticMarkup(
      <QuickDesignPreview width={1600} height={900} theme="aurora" mockup="browser-chrome" scaleFactor={0.8} />,
    )
    const baseMatch = /scale\(([0-9.]+)\)/.exec(baseHtml)
    const scaledMatch = /scale\(([0-9.]+)\)/.exec(scaledHtml)
    expect(baseMatch).not.toBeNull()
    expect(scaledMatch).not.toBeNull()
    expect(Number(scaledMatch![1])).toBeCloseTo(Number(baseMatch![1]) * 0.8, 4)
  })

  it('provides accessible roving tabIndex, label bindings, busy indicator, localized copy, and violet dark-safe tokens', () => {
    // Roving tabIndex on SegmentedControl + localized tablist aria-label + bound labels in Mockup/Resize/IdCard.
    const mockupZh = renderToStaticMarkup(
      <QuickWorkspace preset={{ tool: 'mockup' }} locale="zh" theme="dark" onOpenInStudio={vi.fn()} />,
    )
    expect(mockupZh).toContain('aria-label="Moklu 快捷工具"')
    expect(mockupZh).toContain('role="radio" aria-checked="true" tabindex="0"')
    expect(mockupZh).toContain('role="radio" aria-checked="false" tabindex="-1"')
    expect(mockupZh).toMatch(/<label for="[^"]+"[^>]*>窗口标题<\/label>/)
    expect(mockupZh).toContain('柔和极光')
    expect(mockupZh).not.toContain('Soft Aurora')

    const resizeZh = renderToStaticMarkup(
      <QuickWorkspace preset={{ tool: 'resize', resizeMode: 'resize' }} locale="zh" theme="dark" onOpenInStudio={vi.fn()} />,
    )
    expect(resizeZh).toMatch(/<label for="[^"]+"[^>]*>宽度 \(px\)<\/label>/)
    expect(resizeZh).toMatch(/<label for="[^"]+"[^>]*>高度 \(px\)<\/label>/)

    const idCardJa = renderToStaticMarkup(
      <QuickWorkspace preset={{ tool: 'id-card' }} locale="ja" theme="dark" onOpenInStudio={vi.fn()} />,
    )
    expect(idCardJa).toMatch(/<label for="[^"]+"[^>]*>不正利用防止透かし<\/label>/)
    expect(idCardJa).toContain('300 DPI · 印刷向け')
    expect(idCardJa).not.toContain('300 DPI · Print')

    // Preview busy overlay & aria-busy on ResizePreviewStage.
    const busyStage = renderToStaticMarkup(
      <ResizePreviewStage
        theme="dark"
        locale="en"
        outputs={[]}
        selectedIndex={0}
        hasSourceImages={false}
        busy
        onSelectIndex={vi.fn()}
        onDownloadAt={vi.fn()}
        onRemoveAt={vi.fn()}
        onClearAll={vi.fn()}
        onLoadDemo={vi.fn()}
        onFiles={vi.fn()}
      />,
    )
    expect(busyStage).toContain('aria-busy="true"')
    expect(busyStage).toContain('data-testid="workspace-preview-busy"')

    // Violet brand unification & WCAG-safe dark contrast tokens.
    for (const theme of ['light', 'dark'] as const) {
      const tokens = getWorkspaceThemeTokens(theme)
      const joined = Object.values(tokens).join(' ')
      expect(joined).not.toContain('indigo-')
      expect(joined).toContain('violet-')
      expect(tokens.accentChip.length).toBeGreaterThan(0)
      expect(tokens.badgePositive.length).toBeGreaterThan(0)
      expect(tokens.badgeWarning.length).toBeGreaterThan(0)
      expect(tokens.dangerGhost.length).toBeGreaterThan(0)
      expect(tokens.errorText.length).toBeGreaterThan(0)
    }

    // Complete 4-locale coverage for all newly added error, swatch, and option strings.
    for (const locale of ALL_LOCALES) {
      const dict = getWorkspaceStrings(locale)
      expect(dict.common.toolsTablistLabel.trim().length).toBeGreaterThan(0)
      expect(dict.common.invalidFileError.trim().length).toBeGreaterThan(0)
      expect(dict.common.decodeError.trim().length).toBeGreaterThan(0)
      expect(dict.common.zipError.trim().length).toBeGreaterThan(0)
      expect(dict.common.auto.trim().length).toBeGreaterThan(0)
      expect(dict.idCard.dpi300.trim().length).toBeGreaterThan(0)
      expect(dict.idCard.dpi150.trim().length).toBeGreaterThan(0)
      for (const swatchLabel of Object.values(dict.swatches)) {
        expect(swatchLabel.trim().length).toBeGreaterThan(0)
      }
      for (const themeLabel of Object.values(dict.mockup.themes)) {
        expect(themeLabel.trim().length).toBeGreaterThan(0)
      }
    }
  })
})
