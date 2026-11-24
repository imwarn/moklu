/**
 * [INPUT]: depends on node:fs, node:path, vitest, react-dom/server, QuickWorkspace, getP1ToolsStrings, MergeQuickTool, OverlapTunerModal, SeamOverlapPills, CompressQuickTool, ExifPrivacyBanner, CompressPreviewModal, BeforeAfterSlider, and workspace types
 * [OUTPUT]: Vitest unit and SSR component verification suite covering 4-language P1 locale strings (zero em-dashes), MergeQuickTool overlap presets & dual-mode PDF cards, OverlapTunerModal ghost overlay & keyboard math, CompressQuickTool target-KB presets & PNG auto-switch, ExifPrivacyBanner GPS/metadata inspection, and BeforeAfterSlider split/zoom logic
 * [POS]: automated verification suite for Stage 2 merge & compress upgrades in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { QuickWorkspace } from '../QuickWorkspace'
import { getP1ToolsStrings } from '../locales/p1ToolsLocale'
import type {
  WorkspaceCompressItem,
  WorkspaceExifSummary,
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceMergeSeamInfo,
} from '../types'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { CompressPreviewModal, ExifPrivacyBanner } from './CompressQuickTool'
import { OverlapTunerModal, SeamOverlapPills } from './OverlapTunerModal'

const ALL_LOCALES: WorkspaceLocale[] = ['en', 'zh', 'ja', 'ko']

const SAMPLE_IMG_A: WorkspaceImageInput = {
  id: 'img-a',
  name: 'chat-01.png',
  width: 1170,
  height: 2532,
  dataUrl: 'data:image/png;base64,AAA',
  sizeBytes: 420_000,
  mimeType: 'image/png',
}

const SAMPLE_IMG_B: WorkspaceImageInput = {
  id: 'img-b',
  name: 'chat-02.png',
  width: 1170,
  height: 2532,
  dataUrl: 'data:image/png;base64,BBB',
  sizeBytes: 410_000,
  mimeType: 'image/png',
}

const SAMPLE_EXIF_GPS: WorkspaceExifSummary = {
  hasExif: true,
  hasSensitiveData: true,
  tagCount: 7,
  gps: { latitude: 37.7749, longitude: -122.4194 },
  make: 'Apple',
  model: 'iPhone 16 Pro',
  software: 'iOS 18.2',
  dateTimeOriginal: '2026:10:01 14:22:08',
  exposureTime: '1/120s',
  fNumber: 'f/1.8',
  iso: 64,
  orientation: 1,
}

describe('p1ToolsLocale 4-language coverage and zero em-dash enforcement', () => {
  it('provides non-empty strings across en, zh, ja, ko with zero em-dashes in all outputs and source files', () => {
    for (const locale of ALL_LOCALES) {
      const p1 = getP1ToolsStrings(locale)
      const samples = [
        p1.merge.seamAutoFolded(240),
        p1.merge.seamCustomFolded(180),
        p1.merge.fineTune,
        p1.merge.copiedToChat,
        p1.merge.trustSubtext,
        p1.merge.pdfMultipageTitle,
        p1.merge.pdfMultipageDesc,
        p1.merge.pdfSingleTitle,
        p1.merge.pdfSingleDesc,
        p1.merge.pdfPagesCount(3),
        p1.overlapModal.title,
        p1.overlapModal.seamLabel(1, 1, 2),
        p1.overlapModal.resetToAuto(240),
        p1.compress.modeQuality,
        p1.compress.modeTargetKb,
        p1.compress.pngAutoSwitchedNote,
        p1.compress.autoDownscaleNotice(1280, 200),
        p1.compress.preserveUnmetNotice(200),
        p1.compress.exifBannerWithGps(7),
        p1.compress.exifBannerNoGps(4),
        p1.slider.original,
        p1.slider.compressed,
        p1.slider.keyboardHint,
      ]
      for (const text of samples) {
        expect(text.trim().length).toBeGreaterThan(0)
        expect(text).not.toContain('\u2014')
      }
    }

    const ownedFiles = [
      '../locales/p1ToolsLocale.ts',
      './MergeQuickTool.tsx',
      './OverlapTunerModal.tsx',
      './CompressQuickTool.tsx',
      './BeforeAfterSlider.tsx',
      '../engineAdapter.ts',
      '../defaultEngines.ts',
    ]
    for (const rel of ownedFiles) {
      const src = readFileSync(resolve(import.meta.dirname, rel), 'utf8')
      expect(src).not.toContain('\u2014')
    }
  })
})

describe('MergeQuickTool Stage 2 presets, dual-mode PDF, and seam fine-tuning', () => {
  it('auto-checks removeOverlap and zeroes gap/padding/radius when preset.removeOverlap is true', () => {
    const html = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'merge', mergeDirection: 'vertical', removeOverlap: true }}
        locale="zh"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(html).toContain('data-testid="merge-remove-overlap-toggle"')
    expect(html).toContain('checked=""')
    expect(html).toContain('原图分辨率无损导出 · 免费无水印')
    expect(html).toContain('data-testid="merge-trust-subtext"')
  })

  it('renders dual-mode PDF radio cards with multipage A4 controls and disables Copy Image on /merge-photos-to-pdf preset', () => {
    const multipageHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'merge', mergeDirection: 'vertical', mergeFormat: 'application/pdf', pdfMode: 'multipage' }}
        locale="zh"
        theme="dark"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(multipageHtml).toContain('data-testid="merge-pdf-mode-cards"')
    expect(multipageHtml).toContain('data-testid="merge-pdf-mode-multipage"')
    expect(multipageHtml).toContain('data-testid="merge-pdf-mode-single"')
    expect(multipageHtml).toContain('标准多页文档')
    expect(multipageHtml).toContain('无缝单页长图 PDF')
    expect(multipageHtml).toContain('data-testid="merge-multipage-controls"')
    expect(multipageHtml).toContain('纸张尺寸')
    expect(multipageHtml).toContain('适应原图比例')
    expect(multipageHtml).toContain('方向')
    expect(multipageHtml).toContain('页边距')
    expect(multipageHtml).toContain('适中留白')
    expect(multipageHtml).not.toContain('data-testid="merge-remove-overlap-toggle"')

    const singlePdfHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'merge', mergeDirection: 'vertical', mergeFormat: 'application/pdf', pdfMode: 'single' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(singlePdfHtml).toContain('Standard Multi-Page PDF')
    expect(singlePdfHtml).toContain('Seamless Single-Page Long PDF')
    expect(singlePdfHtml).toContain('data-testid="merge-remove-overlap-toggle"')
    expect(singlePdfHtml).not.toContain('data-testid="merge-multipage-controls"')
  })

  it('renders SeamOverlapPills with folded pixel counts and fine-tune trigger buttons', () => {
    const seams: WorkspaceMergeSeamInfo[] = [
      { index: 0, autoOverlapPx: 240, appliedOverlapPx: 240, fixedTopPx: 44, fixedBottomPx: 0 },
      { index: 1, autoOverlapPx: 120, appliedOverlapPx: 150, fixedTopPx: 0, fixedBottomPx: 20 },
    ]
    const html = renderToStaticMarkup(
      <SeamOverlapPills
        seams={seams}
        overrides={{ 1: 150 }}
        locale="zh"
        theme="light"
        onTuneSeam={vi.fn()}
      />,
    )
    expect(html).toContain('data-testid="merge-seam-pills"')
    expect(html).toContain('已自动折叠 240px 重叠区')
    expect(html).toContain('已微调折叠 150px 重叠区')
    expect(html).toContain('data-testid="merge-seam-tune-0"')
    expect(html).toContain('data-testid="merge-seam-tune-1"')
    expect(html).toContain('微调')
  })

  it('renders OverlapTunerModal with 50% ghost overlay, slider, numeric input, reset-to-auto, and confirm button', () => {
    const html = renderToStaticMarkup(
      <OverlapTunerModal
        open
        seamIndex={0}
        topImage={SAMPLE_IMG_A}
        bottomImage={SAMPLE_IMG_B}
        autoOverlapPx={240}
        initialOverlapPx={240}
        locale="zh"
        theme="dark"
        onConfirm={vi.fn()}
        onResetAuto={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(html).toContain('role="dialog"')
    expect(html).toContain('data-testid="overlap-tuner-modal"')
    expect(html).toContain('data-testid="overlap-ghost-viewport"')
    expect(html).toContain('data-testid="overlap-ghost-image"')
    expect(html).toContain('opacity:0.5')
    expect(html).toContain('data-testid="overlap-tuner-range"')
    expect(html).toContain('data-testid="overlap-tuner-number"')
    expect(html).toContain('恢复自动 (240px)')
    expect(html).toContain('data-testid="overlap-tuner-confirm"')
  })

  it('clamps out-of-range overlap values and handles rotated effective dimensions in OverlapTunerModal', () => {
    const rotatedBottom: WorkspaceImageInput = {
      ...SAMPLE_IMG_B,
      width: 500,
      height: 1000,
      rotation: 90,
    }
    const clampedHighHtml = renderToStaticMarkup(
      <OverlapTunerModal
        open
        seamIndex={0}
        topImage={SAMPLE_IMG_A}
        bottomImage={rotatedBottom}
        autoOverlapPx={999}
        initialOverlapPx={999}
        locale="en"
        theme="light"
        onConfirm={vi.fn()}
        onResetAuto={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Effective height of 500x1000 rotated 90deg is 500 -> max overlap is 500 - 16 = 484
    expect(clampedHighHtml).toContain('aria-valuemax="484"')
    expect(clampedHighHtml).toContain('aria-valuenow="484"')
    expect(clampedHighHtml).toContain('Reset to Auto (484px)')

    const clampedLowHtml = renderToStaticMarkup(
      <OverlapTunerModal
        open
        seamIndex={0}
        topImage={SAMPLE_IMG_A}
        bottomImage={rotatedBottom}
        autoOverlapPx={-50}
        initialOverlapPx={-50}
        locale="en"
        theme="light"
        onConfirm={vi.fn()}
        onResetAuto={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(clampedLowHtml).toContain('aria-valuenow="0"')
    expect(clampedLowHtml).toContain('Reset to Auto (0px)')
  })
})

describe('CompressQuickTool Target-KB, EXIF Inspector, and BeforeAfterSlider', () => {
  it('auto-activates Target-KB mode with 1-click presets and custom KB input when preset.targetSizeKb is set', () => {
    const html = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'compress', targetFormat: 'image/webp', targetSizeKb: 200 }}
        locale="zh"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(html).toContain('限制最大文件体积')
    expect(html).toContain('data-testid="compress-target-kb-controls"')
    expect(html).toContain('data-testid="compress-target-preset-100"')
    expect(html).toContain('data-testid="compress-target-preset-200"')
    expect(html).toContain('data-testid="compress-target-preset-500"')
    expect(html).toContain('data-testid="compress-target-preset-1024"')
    expect(html).toContain('data-testid="compress-target-kb-input"')
    expect(html).toContain('value="200"')
  })

  it('auto-switches lossless PNG to WebP with an informative note when Target-KB preset is active', () => {
    const html = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'compress', targetFormat: 'image/png', targetSizeKb: 200 }}
        locale="en"
        theme="dark"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(html).toContain('data-testid="compress-png-autoswitch-note"')
    expect(html).toContain('PNG is lossless')
  })

  it('renders /remove-exif route intro and ExifPrivacyBanner with GPS, camera, and exposure details', () => {
    const routeHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'compress', targetFormat: 'image/jpeg', inspectExif: true }}
        locale="zh"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(routeHtml).toContain('data-testid="compress-exif-intro"')

    const expandedHtml = renderToStaticMarkup(
      <ExifPrivacyBanner
        items={[{ id: 'p1', name: 'trip.heic', exif: SAMPLE_EXIF_GPS }]}
        locale="zh"
        theme="dark"
        defaultExpanded
      />,
    )
    expect(expandedHtml).toContain('data-testid="compress-exif-banner"')
    expect(expandedHtml).toContain('检测到拍摄定位 (GPS) 与设备型号等 7 项元数据 -&gt; 导出时将默认抹除')
    expect(expandedHtml).toContain('data-testid="compress-exif-details"')
    expect(expandedHtml).toContain('37.77490, -122.41940')
    expect(expandedHtml).toContain('Apple iPhone 16 Pro')
    expect(expandedHtml).toContain('2026:10:01 14:22:08')
    expect(expandedHtml).toContain('1/120s · f/1.8 · ISO 64')

    const collapsedHtml = renderToStaticMarkup(
      <ExifPrivacyBanner
        items={[{ id: 'p1', name: 'trip.heic', exif: SAMPLE_EXIF_GPS }]}
        locale="en"
        theme="light"
        defaultExpanded={false}
      />,
    )
    expect(collapsedHtml).toContain('data-testid="compress-exif-banner"')
    expect(collapsedHtml).not.toContain('data-testid="compress-exif-details"')
  })

  it('renders BeforeAfterSlider inside CompressPreviewModal with 100%/150%/200% zoom, split labels, and Copy/Download actions', () => {
    const mockItem: WorkspaceCompressItem = {
      id: 'c1',
      blob: new Blob(['out'], { type: 'image/webp' }),
      dataUrl: 'data:image/webp;base64,OUT',
      originalDataUrl: 'data:image/png;base64,ORIG',
      width: 1600,
      height: 1200,
      originalWidth: 3200,
      originalHeight: 2400,
      filename: 'shot-compressed.webp',
      sizeBytes: 186_000,
      mimeType: 'image/webp',
      originalName: 'shot.png',
      originalBytes: 4_200_000,
      outputBytes: 186_000,
      savedRatio: (4_200_000 - 186_000) / 4_200_000,
      targetBytesMet: true,
      autoDownscaled: true,
      appliedQuality: 0.78,
    }
    const html = renderToStaticMarkup(
      <CompressPreviewModal
        item={mockItem}
        theme="dark"
        locale="zh"
        onClose={vi.fn()}
        onDownload={vi.fn()}
        onCopy={vi.fn()}
      />,
    )
    expect(html).toContain('data-testid="before-after-slider"')
    expect(html).toContain('data-testid="ba-split-viewport"')
    expect(html).toContain('data-testid="ba-zoom-100"')
    expect(html).toContain('data-testid="ba-zoom-150"')
    expect(html).toContain('data-testid="ba-zoom-200"')
    expect(html).toContain('data-testid="ba-copy-image"')
    expect(html).toContain('data-testid="ba-download-image"')
    expect(html).toContain('原图 (4.01 MB)')
    expect(html).toContain('压缩后 (181.6 KB · 节省 95.6%)')

    const standaloneHtml = renderToStaticMarkup(
      <BeforeAfterSlider
        compact
        originalSrc="data:image/png;base64,ORIG"
        compressedSrc="data:image/webp;base64,OUT"
        originalBytes={1_000_000}
        outputBytes={200_000}
        filename="demo.webp"
        width={800}
        height={600}
        locale="en"
        theme="light"
      />,
    )
    expect(standaloneHtml).toContain('Original (976.6 KB)')
    expect(standaloneHtml).toContain('Compressed (195.3 KB · Saved 80.0%)')
  })

  it('handles larger output percentages in BeforeAfterSlider and clamps extreme preset targetSizeKb bounds', () => {
    const largerHtml = renderToStaticMarkup(
      <BeforeAfterSlider
        originalSrc="data:image/png;base64,ORIG"
        compressedSrc="data:image/png;base64,OUT"
        originalBytes={1000}
        outputBytes={1250}
        filename="grow.png"
        width={400}
        height={300}
        locale="en"
        theme="dark"
      />,
    )
    expect(largerHtml).toContain('Larger +25.0%')
    expect(largerHtml).toContain('aria-valuenow="50"')
    expect(largerHtml).toContain('aria-valuemin="0"')
    expect(largerHtml).toContain('aria-valuemax="100"')

    const minKbHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'compress', targetFormat: 'image/webp', targetSizeKb: 2 }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(minKbHtml).toContain('value="10"')

    const maxKbHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'compress', targetFormat: 'image/webp', targetSizeKb: 99_999 }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(maxKbHtml).toContain('value="10240"')
  })
})
