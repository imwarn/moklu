/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, @/i18n exports, @/store useEditorStore, and Studio UI components (Toolbar, LayersPanel, PropertiesPanel, SlideNavigator, EditingContextBar, QuickDesignModal)
 * [OUTPUT]: Vitest verification suite for 4-language Studio UI i18n completeness, E2E selector parity, and UI/content locale decoupling
 * [POS]: automated test suite within src/i18n guarding every localized Studio UI surface
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  STUDIO_UI_LOCALES,
  StudioLocaleProvider,
  getStudioDictionary,
  useStudioLocale,
  type StudioUiLocale,
} from '@/i18n'
import { useEditorStore } from '@/store'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { SlideNavigator } from '@/components/panels/SlideNavigator'
import { EditingContextBar } from '@/components/canvas/EditingContext'
import { QuickDesignModal } from '@/components/panels/QuickDesignModal'

function collectLeafEntries(obj: unknown, prefix = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[prefix, obj]]
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).flatMap(([key, value]) =>
    collectLeafEntries(value, prefix ? `${prefix}.${key}` : key),
  )
}

function DefaultLocaleProbe() {
  const { uiLocale, t } = useStudioLocale()
  return (
    <div data-locale={uiLocale}>
      <span>{t.toolbar.quickDesign}</span>
      <span>{t.modals.quickDesign.applyEdit}</span>
      <span>{t.modals.quickDesign.startEmpty}</span>
    </div>
  )
}

describe('Studio UI i18n dictionaries', () => {
  it('registers all 4 Studio UI locales with complete non-empty dictionary trees', () => {
    expect(STUDIO_UI_LOCALES.map((entry) => entry.code)).toEqual(['en', 'zh', 'ja', 'ko'])

    const enEntries = collectLeafEntries(getStudioDictionary('en'))
    expect(enEntries.length).toBeGreaterThan(200)
    const enKeys = enEntries.map(([key]) => key)

    for (const locale of ['en', 'zh', 'ja', 'ko'] as StudioUiLocale[]) {
      const dict = getStudioDictionary(locale)
      const entries = collectLeafEntries(dict)
      expect(entries.map(([key]) => key)).toEqual(enKeys)
      for (const [key, value] of entries) {
        expect(value.trim().length, `${locale}:${key} should be non-empty`).toBeGreaterThan(0)
      }
    }
  })

  it('provides genuinely localized translations for zh, ja, and ko', () => {
    const en = getStudioDictionary('en')
    const zh = getStudioDictionary('zh')
    const ja = getStudioDictionary('ja')
    const ko = getStudioDictionary('ko')

    expect(zh.toolbar.quickDesign).not.toBe(en.toolbar.quickDesign)
    expect(ja.toolbar.quickDesign).not.toBe(en.toolbar.quickDesign)
    expect(ko.toolbar.quickDesign).not.toBe(en.toolbar.quickDesign)

    expect(zh.layers.insert).toBe('插入')
    expect(ja.layers.insert).toBe('挿入')
    expect(ko.layers.insert).toBe('삽입')
  })

  it('preserves exact English Playwright E2E selector strings on en and when unmounted', () => {
    const en = getStudioDictionary('en')
    expect(en.toolbar.backToToolsTitle).toBe('Back to Home & Quick Tools')
    expect(en.toolbar.quickDesign).toBe('Quick Design')
    expect(en.toolbar.quickPngTitle).toBe('Export the active canvas at its original size')
    expect(en.modals.quickDesign.title).toBe('Quick Design')
    expect(en.modals.quickDesign.applyEdit).toBe('Apply & Edit Design')
    expect(en.modals.quickDesign.startEmpty).toBe('Start with Empty Mockup')
    expect(en.modals.quickDesign.closeAria).toBe('Close quick design')
    expect(en.studio.toggleLayersAria).toBe('Toggle layers panel')
    expect(en.studio.togglePropertiesAria).toBe('Toggle properties panel')
    expect(en.studio.layersSidebarAria).toBe('Layers sidebar')
    expect(en.studio.propertiesSidebarAria).toBe('Properties sidebar')
    expect(en.studio.editorPanelsAria).toBe('Editor panels')
    expect(en.context.canvasFormatAria).toBe('Canvas format')
    expect(en.context.addFormatTitle).toBe('Add a canvas format')
    expect(en.context.createNewLayout).toBe('Create new layout')

    const html = renderToStaticMarkup(<DefaultLocaleProbe />)
    expect(html).toContain('data-locale="en"')
    expect(html).toContain('Quick Design')
    expect(html).toContain('Apply &amp; Edit Design')
    expect(html).toContain('Start with Empty Mockup')
  })
})

describe('Studio UI localized rendering and content-locale isolation', () => {
  it('renders localized Toolbar with language switcher and spaced Settings button across zh/ja/ko', () => {
    const initialContentLocale = useEditorStore.getState().activeLocale

    const renderToolbar = (locale: StudioUiLocale) =>
      renderToStaticMarkup(
        <StudioLocaleProvider locale={locale}>
          <Toolbar
            mode="editor"
            onSetMode={() => {}}
            homeHref={locale === 'en' ? '/' : `/${locale}/`}
            onNavigateHome={() => {}}
          />
        </StudioLocaleProvider>,
      )

    const enHtml = renderToolbar('en')
    expect(enHtml).toContain('title="Back to Home &amp; Quick Tools"')
    expect(enHtml).toContain('Quick Design')
    expect(enHtml).toContain('title="Export the active canvas at its original size"')
    expect(enHtml).toContain('aria-label="Switch Studio UI language"')
    expect(enHtml).toContain('<span aria-hidden="true">⚙</span><span class="max-[1099px]:hidden">Settings</span>')

    const zhHtml = renderToolbar('zh')
    expect(zhHtml).toContain('工具箱')
    expect(zhHtml).toContain('快速设计')
    expect(zhHtml).toContain('画布尺寸')
    expect(zhHtml).toContain('<span aria-hidden="true">⚙</span><span class="max-[1099px]:hidden">设置</span>')
    expect(zhHtml).toContain('中文')

    const jaHtml = renderToolbar('ja')
    expect(jaHtml).toContain('ツール')
    expect(jaHtml).toContain('クイック作成')
    expect(jaHtml).toContain('<span aria-hidden="true">⚙</span><span class="max-[1099px]:hidden">設定</span>')

    const koHtml = renderToolbar('ko')
    expect(koHtml).toContain('도구')
    expect(koHtml).toContain('빠른 디자인')
    expect(koHtml).toContain('<span aria-hidden="true">⚙</span><span class="max-[1099px]:hidden">설정</span>')

    // Rendering Studio in any UI locale must never mutate project content activeLocale
    expect(useEditorStore.getState().activeLocale).toBe(initialContentLocale)
  })

  it('renders localized Panels, EditingContextBar, SlideNavigator, and QuickDesignModal without mutating activeLocale', () => {
    const initialContentLocale = useEditorStore.getState().activeLocale
    const stageRef = createRef<null>()

    const zhHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <EditingContextBar />
        <LayersPanel />
        <PropertiesPanel />
        <SlideNavigator
          thumbnails={{}}
          staleGroupIds={new Set()}
          stageRef={stageRef}
          onCaptureThumbnail={() => {}}
          onOpenPreview={() => {}}
        />
        <QuickDesignModal open onClose={() => {}} />
      </StudioLocaleProvider>,
    )

    expect(zhHtml).toContain('规格')
    expect(zhHtml).toContain('插入')
    expect(zhHtml).toContain('图层')
    expect(zhHtml).toContain('属性')
    expect(zhHtml).toContain('画布页')
    expect(zhHtml).toContain('预览全部')
    expect(zhHtml).toContain('从空白样机开始')

    const jaHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="ja">
        <LayersPanel />
        <PropertiesPanel />
      </StudioLocaleProvider>,
    )
    expect(jaHtml).toContain('挿入')
    expect(jaHtml).toContain('レイヤー')
    expect(jaHtml).toContain('プロパティ')

    const koHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="ko">
        <LayersPanel />
        <PropertiesPanel />
      </StudioLocaleProvider>,
    )
    expect(koHtml).toContain('삽입')
    expect(koHtml).toContain('레이어')
    expect(koHtml).toContain('속성')

    expect(useEditorStore.getState().activeLocale).toBe(initialContentLocale)
  })
})
