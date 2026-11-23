/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, @/i18n exports, @/store useEditorStore, @/types, and localized Studio UI components (Toolbar, panels, property inspectors, AI settings, and localization subcomponents)
 * [OUTPUT]: Vitest verification suite for 4-language Studio UI i18n completeness, placeholder parity, Intl relative time formatting, E2E selector parity, and localized SSR rendering
 * [POS]: automated test suite within src/i18n guarding every localized Studio UI surface
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  STUDIO_UI_LOCALES,
  StudioLocaleProvider,
  formatMessage,
  formatRelativeTime,
  getStudioDictionary,
  splitMessageTemplate,
  useStudioLocale,
  type StudioUiLocale,
} from '@/i18n'
import { useEditorStore } from '@/store'
import type {
  BackgroundLayer,
  BrandLayer,
  EmojiLayer,
  GroupLayer,
  ImageLayer,
  ShapeLayer,
  SlideGroup,
  TextLayer,
} from '@/types'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { SlideNavigator } from '@/components/panels/SlideNavigator'
import { EditingContextBar } from '@/components/canvas/EditingContext'
import { QuickDesignModal } from '@/components/panels/QuickDesignModal'
import { BackgroundProperties } from '@/components/properties/BackgroundProperties'
import { BrandProperties } from '@/components/properties/BrandProperties'
import { EmojiProperties } from '@/components/properties/EmojiProperties'
import { GroupProperties } from '@/components/properties/GroupProperties'
import { ImageProperties } from '@/components/properties/ImageProperties'
import { ShapeProperties } from '@/components/properties/ShapeProperties'
import { TextProperties } from '@/components/properties/TextProperties'
import { ContentSyncModal } from '@/components/panels/ContentSyncModal'
import { CreateFormatLayoutModal } from '@/components/panels/CreateFormatLayoutModal'
import { ApiKeysModal } from '@/components/panels/ApiKeysModal'
import { AiProviderSettings } from '@/components/ai/AiProviderSettings'
import { BulkTranslateBar } from '@/pages/localization/BulkTranslateBar'
import { LocaleBar } from '@/pages/localization/LocaleBar'
import { ModeSelector } from '@/pages/localization/ModeSelector'
import { ImageOverrideCell } from '@/pages/localization/ImageOverrideCell'
import { TextOverrideCell } from '@/pages/localization/TextOverrideCell'
import { SlideGroupSection } from '@/pages/localization/SlideGroupSection'
import { PromoteLocaleDialog } from '@/pages/localization/PromoteLocaleDialog'
import type { LocalizableRow } from '@/pages/localization/types'

function collectLeafEntries(obj: unknown, prefix = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[prefix, obj]]
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).flatMap(([key, value]) =>
    collectLeafEntries(value, prefix ? `${prefix}.${key}` : key),
  )
}

function extractPlaceholders(template: string): string[] {
  return Array.from(template.matchAll(/\{(\w+)\}/g), (match) => match[1]).sort()
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
      for (let i = 0; i < entries.length; i += 1) {
        const [key, value] = entries[i]
        expect(value.trim().length, `${locale}:${key} should be non-empty`).toBeGreaterThan(0)
        expect(
          extractPlaceholders(value),
          `${locale}:${key} placeholders must match en`,
        ).toEqual(extractPlaceholders(enEntries[i][1]))
      }
    }
  })

  it('formats interpolated templates and Intl.RelativeTimeFormat timestamps across all 4 locales', () => {
    expect(formatMessage('Accent {index} of {total}', { index: 2, total: 5 })).toBe('Accent 2 of 5')
    expect(formatMessage('Keep {unknown} intact', { known: 'x' })).toBe('Keep {unknown} intact')
    // Single-pass safety: values containing braces are not re-expanded
    expect(formatMessage('Hello {a} {b}', { a: '{b}', b: 'world' })).toBe('Hello {b} world')

    expect(splitMessageTemplate('{action} canvas')).toEqual([
      { type: 'token', key: 'action' },
      { type: 'text', value: ' canvas' },
    ])

    const now = Date.UTC(2026, 4, 10, 12, 0, 0)
    const secsAgo = new Date(now - 30_000).toISOString()
    const minsAgo = new Date(now - 5 * 60_000).toISOString()
    const hoursAgo = new Date(now - 3 * 3_600_000).toISOString()
    const daysAgo = new Date(now - 2 * 86_400_000).toISOString()

    expect(formatRelativeTime(secsAgo, 'en', 'just now', now)).toBe('just now')
    expect(formatRelativeTime(secsAgo, 'zh', '刚刚', now)).toBe('刚刚')
    expect(formatRelativeTime('not-a-date', 'en', 'just now', now)).toBe('')

    const expectedZhMin = new Intl.RelativeTimeFormat('zh', { numeric: 'auto', style: 'narrow' }).format(-5, 'minute')
    const expectedJaHour = new Intl.RelativeTimeFormat('ja', { numeric: 'auto', style: 'narrow' }).format(-3, 'hour')
    const expectedKoDay = new Intl.RelativeTimeFormat('ko', { numeric: 'auto', style: 'narrow' }).format(-2, 'day')

    expect(formatRelativeTime(minsAgo, 'zh', '刚刚', now)).toBe(expectedZhMin)
    expect(formatRelativeTime(hoursAgo, 'ja', 'たった今', now)).toBe(expectedJaHour)
    expect(formatRelativeTime(daysAgo, 'ko', '방금 전', now)).toBe(expectedKoDay)
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

  it('renders localized property sub-panels, AI settings, sync/format modals, and localization views across zh/ja/ko', () => {
    const baseCommon = { x: 0, y: 0, rotation: 0, opacity: 1, visible: true, locked: false }
    const bgLayer: BackgroundLayer = {
      ...baseCommon,
      id: 'bg-1',
      name: 'Background',
      type: 'background',
      fill: '#18181f',
      accents: [{ color: '#7c6ef6', opacity: 0.3, cx: 50, cy: 50, rx: 300, ry: 300 }],
    }
    const brandLayer: BrandLayer = {
      ...baseCommon,
      id: 'brand-1',
      name: 'Brand',
      type: 'brand',
      appName: 'Moklu',
      logoSize: 48,
      nameColor: '#ffffff',
      nameFontSize: 24,
      nameFontFamily: 'Inter',
      nameFontWeight: 700,
      direction: 'row',
      gap: 12,
    }
    const emojiLayer: EmojiLayer = {
      ...baseCommon,
      id: 'emoji-1',
      name: 'Emoji',
      type: 'emoji',
      emoji: '🚀',
      fontSize: 64,
    }
    const imageLayer: ImageLayer = {
      ...baseCommon,
      id: 'img-1',
      name: 'Photo',
      type: 'image',
      src: 'data:image/png;base64,AAA',
      width: 200,
      height: 200,
      cornerRadius: 16,
    }
    const shapeLayer: ShapeLayer = {
      ...baseCommon,
      id: 'shape-1',
      name: 'Rect',
      type: 'shape',
      shapeType: 'rect',
      width: 200,
      height: 100,
      fill: '#7c6ef6',
      cornerRadius: 12,
    }
    const textLayer: TextLayer = {
      ...baseCommon,
      id: 'text-1',
      name: 'Headline',
      type: 'text',
      text: 'Hello',
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 700,
      fill: '#ffffff',
      letterSpacing: 0,
      lineHeight: 1.2,
      align: 'center',
      height: 120,
    }
    const groupLayer: GroupLayer = {
      ...baseCommon,
      id: 'group-1',
      name: 'Group',
      type: 'group',
      children: [textLayer],
    }
    const slideGroup: SlideGroup = {
      id: 'sg-1',
      name: 'Slide 1',
      numSlides: 1,
      slideWidth: 1320,
      slideHeight: 2868,
      layers: [bgLayer, textLayer, imageLayer],
      slideNames: ['slide-1'],
    }
    const textRow: LocalizableRow = {
      slideGroupId: slideGroup.id,
      slideGroupName: slideGroup.name,
      layerId: textLayer.id,
      layerName: textLayer.name,
      layerType: 'text',
      depth: 0,
      containerGroupId: null,
      defaultText: textLayer.text,
      layer: textLayer,
    }
    const imageRow: LocalizableRow = {
      slideGroupId: slideGroup.id,
      slideGroupName: slideGroup.name,
      layerId: imageLayer.id,
      layerName: imageLayer.name,
      layerType: 'image',
      depth: 0,
      containerGroupId: null,
      defaultImageRef: imageLayer.src,
      layer: imageLayer,
    }

    const renderSurface = (locale: StudioUiLocale) =>
      renderToStaticMarkup(
        <StudioLocaleProvider locale={locale}>
          <BackgroundProperties layer={bgLayer} />
          <BrandProperties layer={brandLayer} />
          <EmojiProperties layer={emojiLayer} />
          <GroupProperties layer={groupLayer} />
          <ImageProperties layer={imageLayer} />
          <ShapeProperties layer={shapeLayer} />
          <TextProperties layer={textLayer} />
          <ContentSyncModal open onClose={() => {}} />
          <CreateFormatLayoutModal open targetFormatId="ipad-13" onClose={() => {}} />
          <ApiKeysModal open onClose={() => {}} />
          <AiProviderSettings />
          <BulkTranslateBar
            nonDefaultLocales={['ja']}
            bulkEligibleCount={2}
            hasApiKey={false}
            isBulkRunning={false}
            overwriteExisting={false}
            setOverwriteExisting={() => {}}
            onBulkTranslate={() => {}}
            bulkCancelRef={{ current: false }}
            onOpenAiSettings={() => {}}
          />
          <LocaleBar
            locales={['en', 'ja']}
            defaultLocale="en"
            activeLocale="ja"
            progressByLocale={new Map([['ja', { complete: 1, total: 2 }]])}
            showDefaultLocalePicker={false}
            showAddLocale={false}
            defaultLocaleAnchorRef={{ current: null }}
            addLocaleAnchorRef={{ current: null }}
            onPreview={() => {}}
            onBack={() => {}}
            setActiveLocale={() => {}}
            setShowDefaultLocalePicker={() => {}}
            setShowAddLocale={() => {}}
            handleRemoveLocale={() => {}}
            handleDefaultLocaleChange={() => {}}
            addLocale={() => {}}
            setAddLocaleOpen={() => {}}
          />
          <ModeSelector layer={textLayer} onUpdate={() => {}} />
          <ImageOverrideCell
            row={imageRow}
            locale="ja"
            defaultLocale="en"
            activeLocale="ja"
            getAsset={() => undefined}
            onUpload={() => {}}
            onClear={() => {}}
          />
          <TextOverrideCell
            row={textRow}
            locale="ja"
            defaultLocale="en"
            activeLocale="ja"
            backgroundPreview={{ style: { backgroundColor: '#18181f' } }}
            cellStatus="idle"
            toolbarSlot={null}
            onEditingChange={() => {}}
            updateBaseLayer={() => {}}
            setLocaleContent={() => {}}
            clearLocaleContent={() => {}}
            onAiTranslate={() => {}}
          />
          <SlideGroupSection
            slideGroup={slideGroup}
            rows={[textRow, imageRow]}
            collapsed={false}
            onToggleCollapse={() => {}}
            activeLocale="ja"
            defaultLocale="en"
            brandColors={[]}
            locales={['en', 'ja']}
            gridTemplateColumns="260px 280px 280px"
            cellStatus={new Map()}
            cellError={new Map()}
            previewOverrides={new Map()}
            lostFormattingCells={new Set()}
            toolbarSlotEl={null}
            onSingleAiTranslate={() => {}}
            onNavigateToLayer={() => {}}
            onModeUpdate={() => {}}
            updateLayerInSlideGroup={() => {}}
            setLocaleContent={() => {}}
            clearLocaleContent={() => {}}
            getAsset={() => undefined}
            openUploadPicker={() => {}}
            setEditingTextCell={() => {}}
            scrollContainerRef={() => {}}
            onHorizontalScroll={() => {}}
          />
          <PromoteLocaleDialog
            open
            locale="ja"
            currentDefaultLocale="en"
            complete={1}
            total={2}
            incompleteLabels={['Slide 1 · Headline']}
            remainingCount={0}
            onCancel={() => {}}
            onConfirm={() => {}}
          />
        </StudioLocaleProvider>,
      )

    const zhHtml = renderSurface('zh')
    expect(zhHtml).toContain('背景类型')
    expect(zhHtml).toContain('应用名称')
    expect(zhHtml).toContain('表情符号')
    expect(zhHtml).toContain('已选中编组')
    expect(zhHtml).toContain('圆角半径')
    expect(zhHtml).toContain('形状类型')
    expect(zhHtml).toContain('水平对齐')
    expect(zhHtml).toContain('从其他布局同步内容')
    expect(zhHtml).toContain('AI 服务商')
    expect(zhHtml).toContain('批量 AI 翻译：')
    expect(zhHtml).toContain('语言列表')
    expect(zhHtml).toContain('将该语言设为默认语言')

    const jaHtml = renderSurface('ja')
    expect(jaHtml).toContain('背景タイプ')
    expect(jaHtml).toContain('図形の種類')
    expect(jaHtml).toContain('AI プロバイダ')
    expect(jaHtml).toContain('一括 AI 翻訳：')
    expect(jaHtml).toContain('この言語を既定に昇格')

    const koHtml = renderSurface('ko')
    expect(koHtml).toContain('배경 유형')
    expect(koHtml).toContain('도형 유형')
    expect(koHtml).toContain('AI 공급자')
    expect(koHtml).toContain('일괄 AI 번역:')
    expect(koHtml).toContain('기본 언어로 승격')
  })
})
