/**
 * [INPUT]: depends on vitest, react-dom/server, QuickWorkspace, createDemoPortraitDataUrl, createDemoPortraitInput, getWorkspaceStrings from ../index, and IdPhotoPreviewStage from ./IdPhotoPreviewStage
 * [OUTPUT]: Vitest SSR and unit suite covering IdPhotoQuickTool 4-locale rendering, URL preset tab/spec syncing, IdPhotoPreviewStage single/trio/sheet/progress states, demo portrait generator, and zero em-dash verification
 * [POS]: dedicated test suite for the 8th QuickWorkspace tool (ID & Passport Photo) in src/workspace/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  QuickWorkspace,
  createDemoPortraitDataUrl,
  createDemoPortraitInput,
  getWorkspaceStrings,
  type WorkspaceIdPhotoRenderOutput,
  type WorkspaceIdPhotoSheetOutput,
  type WorkspaceLocale,
} from '../index'
import { IdPhotoPreviewStage } from './IdPhotoPreviewStage'

const ALL_LOCALES: WorkspaceLocale[] = ['en', 'zh', 'ja', 'ko']

const MOCK_RENDER: WorkspaceIdPhotoRenderOutput = {
  blob: new Blob(['jpg'], { type: 'image/jpeg' }),
  dataUrl: 'data:image/jpeg;base64,MOCKPHOTO',
  width: 295,
  height: 413,
  filename: 'portrait-cn-1inch.jpg',
  sizeBytes: 24_500,
  mimeType: 'image/jpeg',
  targetBytesMet: true,
  appliedQuality: 0.86,
  foregroundDataUrl: 'data:image/png;base64,MOCKFG',
}

const MOCK_SHEET: WorkspaceIdPhotoSheetOutput = {
  blob: new Blob(['png'], { type: 'image/png' }),
  dataUrl: 'data:image/png;base64,MOCKSHEET',
  width: 1800,
  height: 1200,
  filename: 'portrait-sheet-4r-6inch.png',
  sizeBytes: 180_000,
  mimeType: 'image/png',
  count: 8,
  columns: 4,
  rows: 2,
}

describe('IdPhotoQuickTool & IdPhotoPreviewStage', () => {
  it('renders IdPhotoQuickTool across all 4 locales and both themes with zero em-dashes', () => {
    const expectedLabels: Record<WorkspaceLocale, string> = {
      en: 'Try Demo Portrait',
      zh: '一键体验示例人像',
      ja: 'デモ人物写真で試す',
      ko: '데모 인물 사진 체험',
    }
    for (const locale of ALL_LOCALES) {
      const dict = getWorkspaceStrings(locale)
      expect(JSON.stringify(dict.idPhoto)).not.toContain('—')
      for (const theme of ['light', 'dark'] as const) {
        const html = renderToStaticMarkup(
          <QuickWorkspace preset={{ tool: 'id-photo' }} locale={locale} theme={theme} onOpenInStudio={vi.fn()} />,
        )
        expect(html).toContain('data-active-tool="id-photo"')
        expect(html).toContain(expectedLabels[locale])
        expect(html).toContain('data-testid="id-photo-download"')
        expect(html).toContain('data-testid="id-photo-trio-zip"')
        expect(html).toContain('data-testid="id-photo-copy-image"')
        expect(html).toContain('data-testid="id-photo-spec-card"')
      }
    }
  })

  it('syncs route presets for idPhotoPreset, idPhotoTab, and idPhotoBg', () => {
    const examHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'id-photo', idPhotoPreset: 'cn-exam', idPhotoTab: 'single', idPhotoBg: '#D92B2B' }}
        locale="zh"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(examHtml).toContain('data-testid="id-photo-preset-cn-exam" aria-pressed="true"')
    expect(examHtml).toContain('data-testid="id-photo-tab-single" aria-selected="true"')

    const trioHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'id-photo', idPhotoTab: 'trio' }}
        locale="en"
        theme="dark"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(trioHtml).toContain('data-testid="id-photo-tab-trio" aria-selected="true"')

    const sheetHtml = renderToStaticMarkup(
      <QuickWorkspace
        preset={{ tool: 'id-photo', idPhotoTab: 'sheet' }}
        locale="en"
        theme="light"
        onOpenInStudio={vi.fn()}
      />,
    )
    expect(sheetHtml).toContain('data-testid="id-photo-tab-sheet" aria-selected="true"')
  })

  it('renders Single, Multi-Color Trio, Print Sheet, and AI matting progress states in IdPhotoPreviewStage', () => {
    const baseProps = {
      theme: 'light' as const,
      locale: 'en' as const,
      onTabChange: vi.fn(),
      hasImage: true,
      isBusy: false,
      heicDecoding: false,
      mattingStage: 'downloading' as const,
      mattingProgress: 0.65,
      renderedPhoto: MOCK_RENDER,
      comparePreviews: {
        '#FFFFFF': MOCK_RENDER,
        '#438EDB': MOCK_RENDER,
        '#D92B2B': MOCK_RENDER,
        '#E5E7EB': MOCK_RENDER,
      },
      activeBackground: '#438EDB',
      targetWidthPx: 295,
      targetHeightPx: 413,
      targetSizeKb: 30,
      showGuides: true,
      onToggleGuides: vi.fn(),
      onPanDelta: vi.fn(),
      onAutoCenter: vi.fn(),
      onSelectBackground: vi.fn(),
      onDownloadTrioZip: vi.fn(),
      trioZipBusy: false,
      sheetPaper: '4r-6inch' as const,
      onSheetPaperChange: vi.fn(),
      cropMarks: true,
      onCropMarksChange: vi.fn(),
      sheetOutput: MOCK_SHEET,
      sheetBusy: false,
      sheetPdfBusy: false,
      onDownloadSheetPng: vi.fn(),
      onDownloadSheetPdf: vi.fn(),
      onFiles: vi.fn(),
      onTryDemo: vi.fn(),
      hasDraft: true,
      onClearDraft: vi.fn(),
    }

    const singleHtml = renderToStaticMarkup(<IdPhotoPreviewStage {...baseProps} activeTab="single" />)
    expect(singleHtml).toContain('data-testid="id-photo-matting-progress"')
    expect(singleHtml).toContain('65%')
    expect(singleHtml).toContain('data-testid="id-photo-compliance-guides"')
    expect(singleHtml).toContain('data-testid="id-photo-kb-status"')
    expect(singleHtml).toContain('data-testid="draft-status-id-photo"')

    const trioHtml = renderToStaticMarkup(<IdPhotoPreviewStage {...baseProps} activeTab="trio" mattingStage={null} />)
    expect(trioHtml).toContain('data-testid="id-photo-trio-view"')
    expect(trioHtml).toContain('data-testid="id-photo-trio-cta"')
    expect(trioHtml).toContain('data-testid="id-photo-trio-card-blue" aria-pressed="true"')

    const sheetHtml = renderToStaticMarkup(<IdPhotoPreviewStage {...baseProps} activeTab="sheet" mattingStage={null} />)
    expect(sheetHtml).toContain('data-testid="id-photo-sheet-view"')
    expect(sheetHtml).toContain('data-testid="id-photo-sheet-count"')
    expect(sheetHtml).toContain('8 photos · 300 DPI')
    expect(sheetHtml).toContain('data-testid="id-photo-sheet-png"')
    expect(sheetHtml).toContain('data-testid="id-photo-sheet-pdf"')
  })

  it('creates a deterministic 720x960 demo portrait SVG tagged with isDemo', () => {
    const url = createDemoPortraitDataUrl()
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    const input = createDemoPortraitInput()
    expect(input.width).toBe(720)
    expect(input.height).toBe(960)
    expect(input.isDemo).toBe(true)
    expect(input.dataUrl).toBe(url)
  })
})
