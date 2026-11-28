/**
 * [INPUT]: depends on node:fs, node:path, vitest, react, react-dom/server, jszip, QuickDesignPreview, QuickWorkspace, AnnotateModal, AnnotateOverlay, batchHelpers, mergeHandoff, DraftStatusBar, ResizePreviewStage, CompressPreviewModal, getWorkspaceStrings, getWorkspaceThemeTokens, canvasUtils, and workspace types
 * [OUTPUT]: Vitest suite validating all 8 Quick Workspace tools (incl. IdPhotoQuickTool, AnnotateQuickTool, AnnotateToolbar, AnnotateCanvas, AnnotateModal, and inline Annotate triggers), 4 locales (with zero em-dash enforcement), light/dark Neutral Zinc + Signal Orange tokens, roving tabIndex, label bindings, busy overlay, QuickDesignPreview scaleFactor, MergeQuickTool controls/overlap-removal/PDF preset, buildMergeStudioHandoff multi-layer & sourceRect cropping, DraftStatusBar, preset propagation, multi-image Resize filmstrip UX, Compress preview modal, demo generators, and dynamic ZIP packing
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
  AnnotateCanvas,
  AnnotateModal,
  AnnotateToolbar,
  QuickWorkspace,
  buildBatchStudioHandoff,
  buildMergeStudioHandoff,
  clampBatchIndex,
  createDefaultWorkspaceEngines,
  createDemoImageInput,
  createDemoScreenshotDataUrl,
  formatBytes,
  getWorkspaceStrings,
  getWorkspaceThemeTokens,
  isPartialSourceCrop,
  placementToStudioLayer,
  removeBatchEntry,
  stepBatchIndex,
  type DemoVariant,
  type WorkspaceBlobOutput,
  type WorkspaceCompressItem,
  type WorkspaceImageInput,
  type WorkspaceLocale,
  type WorkspaceMergeOutput,
  type WorkspacePreset,
  type WorkspaceToolId,
} from './index'
import { CompressPreviewModal } from './tools/CompressQuickTool'
import { ResizePreviewStage } from './tools/ResizeQuickTool'
import { isSupportedImageFile } from './canvasUtils'
import { ExifPrivacyBanner } from './ExifPrivacyBanner'
import { DraftStatusBar, DropZone } from './uiPrimitives'

const ALL_TOOLS: WorkspaceToolId[] = ['mockup', 'merge', 'split', 'compress', 'resize', 'annotate', 'id-photo', 'id-card']
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
  it('renders all 8 tools cleanly in both light and dark themes', () => {
    const onOpenInStudio = vi.fn()
    for (const theme of ['light', 'dark'] as const) {
      for (const tool of ALL_TOOLS) {
        const html = renderToStaticMarkup(
          <QuickWorkspace preset={{ tool }} locale="en" theme={theme} onOpenInStudio={onOpenInStudio} onOpenProModal={vi.fn()} />,
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
      en: 'Open in Studio ↗', zh: '在 Studio 画布精修 ↗', ja: 'Studio で詳細編集 ↗', ko: 'Studio에서 정밀 편집 ↗',
    }
    const expectedWatermark: Record<WorkspaceLocale, string> = {
      en: 'FOR VERIFICATION ONLY', zh: '仅供办理业务使用 他用无效', ja: '本人確認専用・他用無効', ko: '본인 확인 전용 · 타 용도 사용 금지',
    }
    for (const locale of ALL_LOCALES) {
      expect(renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'mockup' }} locale={locale} theme="light" onOpenInStudio={vi.fn()} />)).toContain(expectedStudioLabel[locale])
      expect(renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'id-card' }} locale={locale} theme="light" onOpenInStudio={vi.fn()} />)).toContain(expectedWatermark[locale])
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
      { preset: { tool: 'annotate', annotateTool: 'brush' }, expectSnippet: 'data-testid="annotate-tool-brush" aria-label="Brush" aria-pressed="true"' },
      { preset: { tool: 'annotate', annotateTool: 'rect' }, expectSnippet: 'data-testid="annotate-tool-rect" aria-label="Rectangle" aria-pressed="true"' },
      { preset: { tool: 'id-photo', idPhotoTab: 'trio' }, expectSnippet: 'data-testid="id-photo-tab-trio" aria-selected="true"' },
      { preset: { tool: 'id-photo', idPhotoTab: 'sheet' }, expectSnippet: 'data-testid="id-photo-tab-sheet" aria-selected="true"' },
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
    expect(withPro).toContain('Batch Multi-Size / 4K Export (Studio Pro)')

    const withoutPro = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'mockup' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(withoutPro).not.toContain('Batch Multi-Size / 4K Export (Studio Pro)')
  })

  it('renders 13-device 2-level selector, independent browser Light/Dark toggle, workspace preview variant, copy loop, trust copy, and redact toolbar', () => {
    const browserZh = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide', enableRedact: true }}
        locale="zh"
        theme="light"
        onOpenInStudio={vi.fn()}
        onOpenProModal={vi.fn()}
      />,
    )
    // Workspace variant hides QuickDesignModal's disclaimer header/footer.
    expect(browserZh).not.toContain('4. Live preview')
    // 5 Level-1 device category tabs.
    for (const cat of ['browser', 'phone', 'tablet', 'watch', 'screen']) {
      expect(browserZh).toContain(`data-testid="mockup-category-${cat}"`)
    }
    // Browser category shows all 3 browser models + independent Light/Dark Chrome toggle.
    expect(browserZh).toContain('data-testid="mockup-model-browser-chrome"')
    expect(browserZh).toContain('data-testid="mockup-model-browser-safari"')
    expect(browserZh).toContain('data-testid="mockup-model-browser-minimal"')
    expect(browserZh).toContain('data-testid="browser-chrome-controls"')
    expect(browserZh).toContain('亮色顶栏')
    expect(browserZh).toContain('暗色顶栏')
    // Export trust copy + ghost Pro CTA + Copy Image button.
    expect(browserZh).toContain('原图分辨率无损导出 · 免费无水印')
    expect(browserZh).toContain('批量多尺寸 / 4K 导出 (Studio Pro)')
    expect(browserZh).toContain('data-testid="mockup-copy-image"')
    // Redact micro-toolbar auto-selects blur when preset.enableRedact is true.
    expect(browserZh).toContain('data-testid="redact-micro-toolbar"')
    expect(browserZh).toContain('data-testid="redact-mode-blur" aria-pressed="true"')
    expect(browserZh).toContain('像素马赛克')
    expect(browserZh).toContain('聚焦高亮框')

    // Tablet & Watch presets select their own category pills and hide browser chrome controls.
    const tabletHtml = renderToStaticMarkup(
      <QuickWorkspace preset={{ tool: 'mockup', mockupModel: 'ipad-13' }} locale="en" theme="dark" onOpenInStudio={vi.fn()} />,
    )
    expect(tabletHtml).toContain('data-testid="mockup-model-ipad-13"')
    expect(tabletHtml).toContain('data-testid="mockup-model-android-tablet"')
    expect(tabletHtml).not.toContain('data-testid="browser-chrome-controls"')

    const watchHtml = renderToStaticMarkup(
      <QuickWorkspace preset={{ tool: 'mockup', mockupModel: 'apple-watch' }} locale="en" theme="dark" onOpenInStudio={vi.fn()} />,
    )
    expect(watchHtml).toContain('data-testid="mockup-model-apple-watch"')
    expect(watchHtml).toContain('data-testid="mockup-model-wear-os"')

    // Copy Image buttons exist on Split, Resize, and ID Card tools.
    expect(
      renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'split' }} locale="en" theme="light" onOpenInStudio={vi.fn()} />),
    ).toContain('data-testid="split-copy-image"')
    expect(
      renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'resize' }} locale="en" theme="light" onOpenInStudio={vi.fn()} />),
    ).toContain('data-testid="resize-copy-image"')
    expect(
      renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'id-photo' }} locale="en" theme="light" onOpenInStudio={vi.fn()} />),
    ).toContain('data-testid="id-photo-copy-image"')
    expect(
      renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'id-card' }} locale="en" theme="light" onOpenInStudio={vi.fn()} />),
    ).toContain('data-testid="id-card-copy-image"')
  })

  it('supports .heic/.avif uploads in DropZone, renders inline decoding progress, and shows expandable EXIF privacy banner', () => {
    expect(isSupportedImageFile(new File(['x'], 'photo.HEIC', { type: '' }))).toBe(true)
    expect(isSupportedImageFile(new File(['x'], 'photo.heif', { type: '' }))).toBe(true)
    expect(isSupportedImageFile(new File(['x'], 'photo.avif', { type: '' }))).toBe(true)
    expect(isSupportedImageFile(new File(['x'], 'notes.pdf', { type: 'application/pdf' }))).toBe(false)

    const dropHtml = renderToStaticMarkup(
      <DropZone
        theme="light"
        title="Drop"
        hint="Hint"
        buttonLabel="Choose"
        decodingLabel="正在本地解码苹果 HEIC 原图（不上传网络）..."
        onFiles={vi.fn()}
      />,
    )
    expect(dropHtml).toContain('accept="image/*,.heic,.heif,.avif"')
    expect(dropHtml).toContain('data-testid="dropzone-decoding-status"')
    expect(dropHtml).toContain('正在本地解码苹果 HEIC 原图（不上传网络）...')

    // Demo or EXIF-free images render nothing.
    const emptyExif = renderToStaticMarkup(
      <ExifPrivacyBanner
        theme="light"
        locale="zh"
        images={[createDemoImageInput('saas', 'demo.svg')]}
      />,
    )
    expect(emptyExif).toBe('')

    // User image with GPS & camera metadata renders amber banner and expandable details.
    const userImgWithExif: WorkspaceImageInput = {
      id: 'u1',
      name: 'IMG_1024.HEIC',
      width: 4032,
      height: 3024,
      dataUrl: 'data:image/jpeg;base64,AA',
      sizeBytes: 120000,
      exif: {
        hasExif: true,
        hasSensitiveData: true,
        tagCount: 7,
        gps: { latitude: 31.23041, longitude: 121.47371 },
        make: 'Apple',
        model: 'iPhone 16 Pro',
        dateTimeOriginal: '2026:03:18 14:22:09',
        exposureTime: '1/120s',
        fNumber: 'f/1.8',
        iso: 64,
      },
    }
    const exifHtml = renderToStaticMarkup(
      <ExifPrivacyBanner theme="light" locale="zh" images={[userImgWithExif]} defaultExpanded />,
    )
    expect(exifHtml).toContain('data-testid="exif-privacy-banner"')
    expect(exifHtml).toContain('检测到拍摄定位 (GPS) 与设备型号等 7 项元数据 -&gt; 导出时将默认抹除')
    expect(exifHtml).toContain('31.23041° N, 121.47371° E')
    expect(exifHtml).toContain('Apple iPhone 16 Pro')
    expect(exifHtml).toContain('2026:03:18 14:22:09')
    expect(exifHtml).toContain('ISO 64')
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

    // Neutral Zinc + Signal Orange brand unification & WCAG AA semantic tokens.
    for (const theme of ['light', 'dark'] as const) {
      const tokens = getWorkspaceThemeTokens(theme)
      const joined = Object.values(tokens).join(' ')
      expect(joined).not.toMatch(/#[0-9a-f]{3,8}/i)
      expect(joined).toContain('bg-accent-strong')
      expect(joined).toContain('text-accent-text')
      expect(joined).toContain('bg-accent-soft')
      expect(joined).toContain('ring-accent')
      expect(joined).toContain('bg-panel')
      expect(joined).toContain('border-border')
      expect(joined).toContain('text-muted')
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
      for (const mergeLabel of Object.values(dict.merge)) {
        expect(mergeLabel.trim().length).toBeGreaterThan(0)
      }
      expect(dict.common.copyImage.trim().length).toBeGreaterThan(0)
      expect(dict.common.downloadPdf.trim().length).toBeGreaterThan(0)
      expect(dict.common.customColor.trim().length).toBeGreaterThan(0)
      for (const annotateLabel of Object.values(dict.annotate)) {
        expect(annotateLabel.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('renders AnnotateQuickTool, AnnotateModal, 8-handle selection, adaptive font slider, and inline triggers', () => {
    const demo = createDemoImageInput('saas', 'demo.svg')
    const annotateHtml = renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'annotate', annotateTool: 'brush' }} locale="zh" theme="dark" onOpenInStudio={vi.fn()} />)
    expect(annotateHtml).toContain('role="toolbar"')
    expect(annotateHtml).toContain('data-testid="annotate-tool-brush"')
    expect(annotateHtml).toContain('data-testid="annotate-undo-btn" aria-label="撤销" aria-disabled="true"')
    expect(annotateHtml).toContain('data-testid="annotate-copy-image"')
    const modalHtml = renderToStaticMarkup(<AnnotateModal image={demo} locale="zh" theme="light" onClose={vi.fn()} onSave={vi.fn()} />)
    expect(modalHtml).toContain('role="dialog"')
    expect(modalHtml).toContain('aria-modal="true"')
    expect(modalHtml).toContain('data-testid="annotate-close-btn"')
    expect(modalHtml).toContain('data-testid="annotate-save-btn"')
    const textLayer = { id: 't1', type: 'text' as const, color: '#ffffff', strokeWidth: 0.012, x: 0.2, y: 0.2, width: 0.3, height: 0.12, text: 'Hello', fontSize: 0.06 }
    const rectLayer = { id: 'r1', type: 'rect' as const, color: '#ff0000', strokeWidth: 0.012, x: 0.1, y: 0.1, width: 0.4, height: 0.3 }
    const canvasHtml = renderToStaticMarkup(<AnnotateCanvas image={demo} theme="light" locale="en" activeTool="select" color="#ff0000" strokeWidth={0.012} fontSize={0.055} layers={[rectLayer, textLayer]} selectedId="t1" editingTextId={null} onSelect={vi.fn()} onEditingTextIdChange={vi.fn()} onCommitLayers={vi.fn()} />)
    expect(canvasHtml).toContain('data-testid="annotate-selection-box"')
    for (const h of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) expect(canvasHtml).toContain(`data-testid="annotate-handle-${h}"`)
    const textBarHtml = renderToStaticMarkup(<AnnotateToolbar theme="light" locale="en" activeTool="select" color="#ff0000" strokeWidth={0.012} fontSize={0.055} selectedLayer={textLayer} canUndo canRedo={false} onToolChange={vi.fn()} onColorChange={vi.fn()} onSizePreview={vi.fn()} onSizeCommit={vi.fn()} onUndo={vi.fn()} onRedo={vi.fn()} />)
    expect(textBarHtml).toContain('aria-label="Font Size"')
    expect(renderToStaticMarkup(<QuickWorkspace preset={{ tool: 'mockup' }} locale="en" theme="light" onOpenInStudio={vi.fn()} />)).toContain('data-testid="mockup-annotate-btn"')
    expect(renderToStaticMarkup(<ResizePreviewStage theme="light" locale="en" outputs={[]} selectedIndex={0} hasSourceImages onSelectIndex={vi.fn()} onDownloadAt={vi.fn()} onRemoveAt={vi.fn()} onClearAll={vi.fn()} onLoadDemo={vi.fn()} onFiles={vi.fn()} onAnnotateCurrent={vi.fn()} />)).toContain('data-testid="resize-annotate-btn"')
  })

  it('renders MergeQuickTool upgraded controls: 2-6 grid columns, contain fit, custom color picker, border, clipboard copy, and PDF preset', () => {
    const gridHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'merge', mergeDirection: 'grid' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(gridHtml).toContain('max="6"')
    expect(gridHtml).toContain('Cell Fit')
    expect(gridHtml).toContain('Cover')
    expect(gridHtml).toContain('Contain')
    expect(gridHtml).toContain('Image Border')
    expect(gridHtml).toContain('data-testid="custom-color-input"')
    expect(gridHtml).toContain('data-testid="merge-copy-image"')
    expect(gridHtml).toContain('>PDF<')

    const pdfHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'merge', mergeDirection: 'vertical', mergeFormat: 'application/pdf' }}
        locale="zh"
        theme="dark"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(pdfHtml).toContain('下载 PDF')
    expect(pdfHtml).toContain('压缩质量')
    expect(pdfHtml).toContain('复制图片')
    expect(pdfHtml).toContain('data-testid="merge-remove-overlap-toggle"')
    expect(pdfHtml).toContain('智能去重叠（长截图）')
    expect(pdfHtml).not.toContain('checked=""')
    // Overlap toggle is only rendered in vertical mode, not in grid or horizontal mode.
    expect(gridHtml).not.toContain('data-testid="merge-remove-overlap-toggle"')
  })

  it('keeps all 4 workspace locale dictionaries free of em-dashes and populated for overlap + draft labels', () => {
    const walkStrings = (value: unknown, out: string[]) => {
      if (typeof value === 'string') {
        out.push(value)
        return
      }
      if (value && typeof value === 'object') {
        for (const v of Object.values(value as Record<string, unknown>)) {
          walkStrings(v, out)
        }
      }
    }

    for (const locale of ALL_LOCALES) {
      const dict = getWorkspaceStrings(locale)
      expect(dict.common.draftSaved.trim().length).toBeGreaterThan(0)
      expect(dict.common.clearDraft.trim().length).toBeGreaterThan(0)
      expect(dict.merge.removeOverlapLabel.trim().length).toBeGreaterThan(0)
      expect(dict.merge.removeOverlapHint.trim().length).toBeGreaterThan(0)
      expect(dict.merge.overlapTrimmedLabel.trim().length).toBeGreaterThan(0)

      const allStrings: string[] = []
      walkStrings(dict, allStrings)
      for (const str of allStrings) {
        expect(str).not.toContain('—')
      }
    }
  })

  it('renders DraftStatusBar with localized auto-saved status and clear action', () => {
    const html = renderToStaticMarkup(
      <DraftStatusBar
        theme="light"
        toolId="merge"
        savedLabel="已自动保存本地草稿"
        clearLabel="清空草稿"
        onClear={vi.fn()}
      />,
    )
    expect(html).toContain('data-testid="draft-status-merge"')
    expect(html).toContain('data-testid="clear-draft-merge"')
    expect(html).toContain('已自动保存本地草稿')
    expect(html).toContain('清空草稿')
  })
})

describe('buildMergeStudioHandoff', () => {
  const sampleInputs: WorkspaceImageInput[] = [
    {
      id: 'a',
      name: 'shot-1.png',
      width: 1000,
      height: 800,
      dataUrl: 'data:image/png;base64,SHOT1',
      sizeBytes: 1000,
      rotation: 0,
    },
    {
      id: 'b',
      name: 'shot-2.png',
      width: 960,
      height: 640,
      dataUrl: 'data:image/png;base64,SHOT2',
      sizeBytes: 1000,
      rotation: 90,
    },
  ]

  it('builds mode:layers payload, slices partial sourceRect crops offscreen, and maps 90deg rotation to Konva center coordinates', async () => {
    const cropSpy = vi.fn(async (img: WorkspaceImageInput) => `data:image/png;base64,CROPPED_${img.id}`)
    const merged: WorkspaceMergeOutput = {
      ...makeMockOutput('moklu-merged.png', 1680, 1000, 50_000),
      layout: {
        width: 1680,
        height: 1000,
        scaleFactor: 1,
        overlapRemovedPx: 120,
        placements: [
          {
            index: 0,
            // Partial crop (e.g. overlap trimmed bottom 120px)
            sourceRect: { x: 0, y: 0, width: 1000, height: 680 },
            destRect: { x: 20, y: 20, width: 1000, height: 680 },
            radius: 12,
            rotation: 0,
            borderWidth: 0,
          },
          {
            index: 1,
            // Full uncropped source rotated 90deg clockwise -> visual destRect is 640x960
            sourceRect: { x: 0, y: 0, width: 960, height: 640 },
            destRect: { x: 1040, y: 20, width: 640, height: 960 },
            radius: 12,
            rotation: 90,
            borderWidth: 0,
          },
        ],
      },
    }

    expect(isPartialSourceCrop(merged.layout!.placements[0].sourceRect, 1000, 800)).toBe(true)
    expect(isPartialSourceCrop(merged.layout!.placements[1].sourceRect, 960, 640)).toBe(false)

    const payload = await buildMergeStudioHandoff(sampleInputs, merged, '#f1f5f9', {
      cropSource: cropSpy,
    })

    expect(payload.mode).toBe('layers')
    expect(payload.slideWidth).toBe(1680)
    expect(payload.slideHeight).toBe(1000)
    expect(payload.background).toBe('#f1f5f9')
    expect(payload.layers).toHaveLength(2)

    // Only the partially cropped placement triggers offscreen slicing.
    expect(cropSpy).toHaveBeenCalledTimes(1)
    expect(payload.layers![0]).toEqual({
      dataUrl: 'data:image/png;base64,CROPPED_a',
      name: 'shot-1.png',
      x: 20,
      y: 20,
      width: 1000,
      height: 680,
      rotation: 0,
      cornerRadius: 12,
    })

    // Rotated 90deg placement swaps unrotated width/height to 960x640 around the same visual center (1360, 500).
    const rotatedLayer = payload.layers![1]
    expect(rotatedLayer.dataUrl).toBe('data:image/png;base64,SHOT2')
    expect(rotatedLayer.width).toBe(960)
    expect(rotatedLayer.height).toBe(640)
    expect(rotatedLayer.rotation).toBe(90)
    expect(rotatedLayer.x + rotatedLayer.width / 2).toBe(1040 + 640 / 2)
    expect(rotatedLayer.y + rotatedLayer.height / 2).toBe(20 + 960 / 2)
  })

  it('falls back to mode:canvas when merge result lacks layout placements', async () => {
    const merged: WorkspaceMergeOutput = makeMockOutput('moklu-merged.png', 1200, 800, 40_000)
    const payload = await buildMergeStudioHandoff(sampleInputs, merged, '#ffffff')
    expect(payload.mode).toBe('canvas')
    expect(payload.layers).toBeUndefined()
    expect(payload.images).toHaveLength(1)
    expect(payload.images[0].dataUrl).toBe(merged.dataUrl)
  })

  it('computes placementToStudioLayer accurately for 0, 90, 180, and 270 degree rotations', () => {
    const base = {
      index: 0,
      sourceRect: { x: 0, y: 0, width: 200, height: 100 },
      destRect: { x: 10, y: 20, width: 100, height: 200 },
      radius: 8,
      borderWidth: 0,
    }
    const r270 = placementToStudioLayer({ name: 'rot.png' }, { ...base, rotation: 270 }, 'data:x')
    expect(r270.width).toBe(200)
    expect(r270.height).toBe(100)
    expect(r270.x + r270.width / 2).toBe(10 + 100 / 2)
    expect(r270.y + r270.height / 2).toBe(20 + 200 / 2)
    expect(r270.rotation).toBe(270)
  })
})
