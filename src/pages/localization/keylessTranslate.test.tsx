/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, StudioLocaleProvider from @/i18n, useEditorStore from @/store, TextLayer from @/types, keylessTranslate helpers, BulkTranslateBar, and KeylessTranslateModal
 * [OUTPUT]: Vitest suite verifying Zero-Key Web AI prompt serialization with <mN> tags, JSON & fenced code block parsing, malformed-tag fallback, BulkTranslateBar non-disabled dual-track UX, KeylessTranslateModal SSR rendering, and single-undo setLocaleContentBatch commit
 * [POS]: automated test suite for Zero-Key AI dual-track translation in src/pages/localization
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { StudioLocaleProvider } from '@/i18n'
import { useEditorStore } from '@/store'
import type { TextLayer } from '@/types'
import { BulkTranslateBar } from './BulkTranslateBar'
import { KeylessTranslateModal } from './KeylessTranslateModal'
import {
  buildKeylessTranslationPrompt,
  collectKeylessTranslationItems,
  extractJsonPayload,
  parseKeylessTranslationResponse,
} from './keylessTranslate'
import { cellKey, type LocalizableRow } from './types'

function makeTextRow(overrides: Partial<TextLayer> & { id: string; text: string; slideGroupId?: string }): LocalizableRow {
  const layer: TextLayer = {
    id: overrides.id,
    name: overrides.name ?? 'Headline',
    type: 'text',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: overrides.text,
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: 700,
    fill: '#ffffff',
    letterSpacing: 0,
    lineHeight: 1.2,
    align: 'center',
    marks: overrides.marks,
    localizationMode: overrides.localizationMode,
    localeContent: overrides.localeContent,
  }
  return {
    slideGroupId: overrides.slideGroupId ?? 'sg-1',
    slideGroupName: 'Hero',
    layerId: layer.id,
    layerName: layer.name,
    layerType: 'text',
    depth: 0,
    containerGroupId: null,
    defaultText: layer.text,
    layer,
  }
}

describe('Zero-Key Web AI dual-track translation', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject()
  })

  it('collects only eligible auto text rows respecting overwriteExisting and serializes <mN> tags', () => {
    const rows: LocalizableRow[] = [
      makeTextRow({
        id: 'layer-1',
        text: 'Track your habits daily',
        marks: [{ start: 11, end: 17, fill: '#f97316', fontWeight: 800 }],
        localeContent: { ja: { text: 'すでに翻訳済み' } },
      }),
      makeTextRow({
        id: 'layer-manual',
        text: 'Manual copy',
        localizationMode: 'manual',
      }),
      makeTextRow({
        id: 'layer-skip',
        text: 'Brand',
        localizationMode: 'skip',
      }),
    ]

    const withoutOverwrite = collectKeylessTranslationItems(rows, ['ja', 'zh'], false)
    expect(withoutOverwrite).toHaveLength(1)
    expect(withoutOverwrite[0].refId).toBe('L1')
    expect(withoutOverwrite[0].taggedSource).toBe('Track your <m1>habits</m1> daily')
    expect(withoutOverwrite[0].taggable).toBe(true)
    expect(withoutOverwrite[0].pendingLocales).toEqual(['zh'])

    const withOverwrite = collectKeylessTranslationItems(rows, ['ja', 'zh'], true)
    expect(withOverwrite[0].pendingLocales).toEqual(['ja', 'zh'])

    const bundle = buildKeylessTranslationPrompt(withOverwrite, 'en', ['ja', 'zh'])
    expect(bundle.cellCount).toBe(2)
    expect(bundle.activeLocales).toEqual(['ja', 'zh'])
    expect(bundle.prompt).toContain('<m1>habits</m1>')
    expect(bundle.prompt).toContain('"L1"')
    expect(bundle.prompt).toContain('"ja"')
    expect(bundle.prompt).toContain('"zh"')
  })

  it('extracts and parses raw JSON and fenced ```json output, restoring <mN> marks and stripping malformed tags', () => {
    const rows: LocalizableRow[] = [
      makeTextRow({
        id: 'layer-1',
        text: 'Track your habits daily',
        marks: [{ start: 11, end: 17, fill: '#f97316', fontWeight: 800 }],
      }),
      makeTextRow({
        id: 'layer-2',
        text: 'Start free',
      }),
    ]
    const items = collectKeylessTranslationItems(rows, ['ja', 'zh'], false)

    const fencedReply = [
      'Sure! Here is your translated JSON:',
      '```json',
      JSON.stringify({
        zh: {
          L1: '每天追踪你的<m1>习惯</m1>',
          L2: '免费开始',
        },
        ja: {
          // Malformed unclosed tag triggers stripMarkTags fallback + formattingLost flag
          L1: '毎日<m1>習慣を記録',
          L2: '無料で始める',
        },
      }),
      '```',
      'Hope that helps!',
    ].join('\n')

    expect(extractJsonPayload(fencedReply)).toContain('"zh"')

    const parsed = parseKeylessTranslationResponse(fencedReply, items, ['ja', 'zh'])
    expect(parsed.ok).toBe(true)
    expect(parsed.appliedCount).toBe(4)

    const zh1 = parsed.entries.find((e) => e.layerId === 'layer-1' && e.locale === 'zh')!
    expect(zh1.patch.text).toBe('每天追踪你的习惯')
    expect(zh1.patch.marks).toEqual([
      { start: 6, end: 8, fill: '#f97316', fontWeight: 800, italic: undefined, underline: undefined, strikethrough: undefined },
    ])

    const ja1 = parsed.entries.find((e) => e.layerId === 'layer-1' && e.locale === 'ja')!
    expect(ja1.patch.text).toBe('毎日習慣を記録')
    expect(ja1.patch.marks).toBeUndefined()
    expect(parsed.formattingLostKeys).toEqual([cellKey('layer-1', 'ja')])

    const invalid = parseKeylessTranslationResponse('not json at all', items, ['ja', 'zh'])
    expect(invalid.ok).toBe(false)
    expect(invalid.entries).toEqual([])
  })

  it('commits parsed entries into useEditorStore via one setLocaleContentBatch call', () => {
    const store = useEditorStore.getState()
    store.addLocale('zh')
    store.addLocale('ja')
    store.addText()

    const refreshed = useEditorStore.getState()
    const group = refreshed.project.slideGroups[0]
    const textLayer = group.layers.find((l): l is TextLayer => l.type === 'text')!

    const rows = [makeTextRow({ ...textLayer, slideGroupId: group.id })]
    const items = collectKeylessTranslationItems(rows, ['zh', 'ja'], true)
    const response = JSON.stringify({
      zh: { L1: '中文标题' },
      ja: { L1: '日本語見出し' },
    })

    const parsed = parseKeylessTranslationResponse(response, items, ['zh', 'ja'])
    expect(parsed.ok).toBe(true)
    useEditorStore.getState().setLocaleContentBatch(parsed.entries)

    const updatedLayer = useEditorStore
      .getState()
      .project.slideGroups[0]
      .layers.find((l): l is TextLayer => l.id === textLayer.id)!
    expect(updatedLayer.localeContent?.zh?.text).toBe('中文标题')
    expect(updatedLayer.localeContent?.ja?.text).toBe('日本語見出し')
  })

  it('never disables bulk translate when !hasApiKey and renders explicit zero-key button even when hasApiKey is true', () => {
    const noKeyHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, {
        locale: 'zh',
        children: createElement(BulkTranslateBar, {
          nonDefaultLocales: ['ja'],
          bulkEligibleCount: 3,
          hasApiKey: false,
          isBulkRunning: false,
          overwriteExisting: false,
          setOverwriteExisting: () => {},
          onBulkTranslate: () => {},
          bulkCancelRef: { current: false },
          onOpenAiSettings: () => {},
          onOpenKeylessTranslate: () => {},
        }),
      }),
    )
    expect(noKeyHtml).toContain('data-testid="bulk-translate-btn"')
    expect(noKeyHtml).not.toMatch(/data-testid="bulk-translate-btn"[^>]*disabled=""/)
    expect(noKeyHtml).toContain('免 Key 网页翻译')

    const withKeyHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, {
        locale: 'en',
        children: createElement(BulkTranslateBar, {
          nonDefaultLocales: ['ja'],
          bulkEligibleCount: 3,
          hasApiKey: true,
          isBulkRunning: false,
          overwriteExisting: false,
          setOverwriteExisting: () => {},
          onBulkTranslate: () => {},
          bulkCancelRef: { current: false },
          onOpenAiSettings: () => {},
          onOpenKeylessTranslate: () => {},
        }),
      }),
    )
    expect(withKeyHtml).toContain('data-testid="open-keyless-translate-btn"')
    expect(withKeyHtml).toContain('Copy-Paste Translate (No Key)')
  })

  it('renders KeylessTranslateModal dual-track columns across locales', () => {
    const rows = [makeTextRow({ id: 't-1', text: 'Ship faster' })]
    const zhHtml = renderToStaticMarkup(
      createElement(StudioLocaleProvider, {
        locale: 'zh',
        children: createElement(KeylessTranslateModal, {
          open: true,
          onClose: () => {},
          rows,
          defaultLocale: 'en',
          nonDefaultLocales: ['zh'],
          overwriteExisting: false,
          hasApiKey: false,
          onOpenAiSettings: () => {},
          onRunDirectBulkTranslate: () => {},
          onCommitBatch: () => {},
        }),
      }),
    )
    expect(zhHtml).toContain('data-testid="keyless-track-byok"')
    expect(zhHtml).toContain('data-testid="keyless-track-zero-key"')
    expect(zhHtml).toContain('1. 一键复制带标记文案与翻译提示词')
    expect(zhHtml).toContain('2. 粘贴翻译结果自动回填全画布')
  })
})
