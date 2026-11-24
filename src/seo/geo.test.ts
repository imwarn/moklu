/**
 * [INPUT]: depends on vitest, node:fs/promises, node:path, react, react-dom/server, src/seo/* exports, and @/i18n getStudioDictionary
 * [OUTPUT]: automated GEO verification suite covering llms.txt non-HTML contract, native <details>/<summary> FAQ DOM parity, 9 Merge FAQs, Quick Facts & capability boundaries, /about /privacy /terms pages, Organization/WebSite/BreadcrumbList JSON-LD, zh-CN/zh-Hans tags, /merge-photos-to-pdf preset, and cross-file em-dash bans
 * [POS]: dedicated GEO and E-E-A-T regression test suite within src/seo alongside seo.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getStudioDictionary } from '@/i18n'
import {
  INFO_ROUTE_DEFINITIONS,
  LOCALE_CODES,
  MOKLU_GITHUB_URL,
  SeoLandingSections,
  buildRouteSchemaList,
  buildRouteSchemas,
  getHreflangCode,
  getHtmlLang,
  getRouteCopy,
  getToolQuickFacts,
  resolveApplicationCategory,
  resolvePathname,
} from './index.ts'
import { escapeHtml, generateLlmsTxt } from './ssg.ts'
import { renderRouteMarkup } from './ssrEntry.ts'

function collectLeafStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj]
  if (!obj || typeof obj !== 'object') return []
  return Object.values(obj).flatMap((v) => collectLeafStrings(v))
}

describe('GEO deliverables: llms.txt, native details FAQ, Quick Facts, trust pages, and rich JSON-LD', () => {
  it('generates structured 4-language llms.txt markdown that is never HTML and contains no em-dashes', () => {
    const llms = generateLlmsTxt('https://moklu.app')

    expect(llms.startsWith('# Moklu\n')).toBe(true)
    expect(llms).not.toMatch(/<!doctype html|<html|<body|<script/i)
    expect(llms).not.toContain('—')
    expect(llms).toContain('## English (en)')
    expect(llms).toContain('## 简体中文 (zh-CN)')
    expect(llms).toContain('## 日本語 (ja)')
    expect(llms).toContain('## 한국어 (ko)')
    expect(llms).toContain('在线图片拼接')
    expect(llms).toContain('https://moklu.app/zh/merge-images')
    expect(llms).toContain('https://moklu.app/merge-photos-to-pdf')
    expect(llms).toContain('https://moklu.app/about')
    expect(llms).toContain('https://moklu.app/zh/privacy')
    expect(llms).toContain('https://moklu.app/ja/terms')
    expect(llms).toContain(MOKLU_GITHUB_URL)
  })

  it('renders native <details>/<summary> FAQs with 100% of answers in SSG HTML and 8-10 FAQs on merge-images across all 4 locales', () => {
    const noop = () => {}
    for (const locale of LOCALE_CODES) {
      const route = resolvePathname(locale === 'en' ? '/merge-images' : `/${locale}/merge-images`)
      const copy = getRouteCopy(locale, 'merge-images')
      expect(copy.faqs.length).toBeGreaterThanOrEqual(8)
      expect(copy.faqs.length).toBeLessThanOrEqual(10)

      const html = renderToStaticMarkup(
        createElement(SeoLandingSections, {
          route,
          theme: 'light',
          onNavigate: noop,
        }),
      )

      const detailsCount = html.match(/<details\b/g)?.length ?? 0
      const summaryCount = html.match(/<summary\b/g)?.length ?? 0
      expect(detailsCount).toBe(copy.faqs.length)
      expect(summaryCount).toBe(copy.faqs.length)

      const faqSchema = buildRouteSchemas(route, 'https://moklu.app').faqPage
      expect(faqSchema.mainEntity).toHaveLength(copy.faqs.length)
      for (const item of faqSchema.mainEntity) {
        expect(html).toContain(escapeHtml(item.name))
        expect(html).toContain(escapeHtml(item.acceptedAnswer.text))
      }
    }
  })

  it('aligns /zh/merge-images to 在线图片拼接 and renders Quick Facts and capability boundaries', () => {
    const zhMerge = getRouteCopy('zh', 'merge-images')
    expect(zhMerge.title).toContain('在线图片拼接')
    expect(zhMerge.h1).toContain('在线图片拼接')
    expect(zhMerge.navLabel).toContain('在线图片拼接')

    const noop = () => {}
    for (const locale of LOCALE_CODES) {
      const route = resolvePathname(locale === 'en' ? '/merge-images' : `/${locale}/merge-images`)
      const quickFacts = getToolQuickFacts(locale, route)
      expect(quickFacts.facts.length).toBeGreaterThanOrEqual(5)
      expect(quickFacts.boundaries.length).toBeGreaterThanOrEqual(2)

      const html = renderToStaticMarkup(
        createElement(SeoLandingSections, {
          route,
          theme: 'dark',
          onNavigate: noop,
        }),
      )
      expect(html).toContain('id="seo-quick-facts-heading"')
      expect(html).toContain(escapeHtml(quickFacts.facts[0].value))
      expect(html).toContain(escapeHtml(quickFacts.boundaries[0]))
    }
  })

  it('renders /about, /privacy, and /terms trust pages in all 4 locales with GitHub link and zero QuickWorkspace', () => {
    expect(INFO_ROUTE_DEFINITIONS.map((d) => d.slug)).toEqual(['about', 'privacy', 'terms'])

    for (const locale of LOCALE_CODES) {
      for (const slug of ['about', 'privacy', 'terms'] as const) {
        const route = resolvePathname(locale === 'en' ? `/${slug}` : `/${locale}/${slug}`)
        expect(route.isInfoPage).toBe(true)
        expect(route.isFallback).toBe(false)

        const markup = renderRouteMarkup(route)
        const copy = getRouteCopy(locale, slug)
        expect(markup).toContain(escapeHtml(copy.h1))
        expect(markup).toContain(MOKLU_GITHUB_URL)
        expect(markup).toContain('<details')
        expect(markup).not.toContain('data-testid="quick-workspace"')

        const schemas = buildRouteSchemaList(route, 'https://moklu.app')
        const types = schemas.map((s) => s['@type'])
        expect(types).toEqual(['Organization', 'WebSite', 'BreadcrumbList', 'WebPage', 'FAQPage'])
      }
    }
  })

  it('emits Organization(sameAs), WebSite, BreadcrumbList, per-tool applicationCategory, and zh-CN/zh-Hans tags', () => {
    expect(getHtmlLang('zh')).toBe('zh-CN')
    expect(getHreflangCode('zh')).toBe('zh-Hans')
    expect(resolveApplicationCategory('mockup')).toBe('DesignApplication')
    expect(resolveApplicationCategory('merge')).toBe('MultimediaApplication')
    expect(resolveApplicationCategory('compress')).toBe('MultimediaApplication')
    expect(resolveApplicationCategory('id-card')).toBe('UtilitiesApplication')

    const zhMergeRoute = resolvePathname('/zh/merge-images')
    const schemas = buildRouteSchemas(zhMergeRoute, 'https://moklu.app')
    expect(schemas.organization.sameAs).toContain(MOKLU_GITHUB_URL)
    expect(schemas.organization.logo).toBe('https://moklu.app/apple-touch-icon.png')
    expect(schemas.webSite.inLanguage).toBe('zh-CN')
    expect(schemas.breadcrumbList.itemListElement).toHaveLength(2)
    expect(schemas.breadcrumbList.itemListElement[1].item).toBe('https://moklu.app/zh/merge-images')
    expect(schemas.webApplication.applicationCategory).toBe('MultimediaApplication')
    expect(schemas.webApplication.inLanguage).toBe('zh-CN')
  })

  it('resolves /merge-photos-to-pdf with application/pdf mergeFormat preset across all 4 locales', () => {
    for (const locale of LOCALE_CODES) {
      const route = resolvePathname(
        locale === 'en' ? '/merge-photos-to-pdf' : `/${locale}/merge-photos-to-pdf`,
      )
      expect(route.isFallback).toBe(false)
      expect(route.tool).toBe('merge')
      expect(route.preset.mergeDirection).toBe('vertical')
      expect(route.preset.mergeFormat).toBe('application/pdf')
    }
  })

  it('keeps Studio i18n dictionaries, index.html, and bilingual README.md free of em-dashes', async () => {
    for (const locale of LOCALE_CODES) {
      const strings = collectLeafStrings(getStudioDictionary(locale))
      for (const value of strings) {
        expect(value, `Studio i18n (${locale}) contains em-dash: ${value}`).not.toContain('—')
      }
    }

    const indexHtml = await readFile(path.resolve('index.html'), 'utf8')
    expect(indexHtml).not.toContain('—')

    const readme = await readFile(path.resolve('README.md'), 'utf8')
    expect(readme).not.toContain('—')
    expect(readme).toContain('https://moklu.app')
    expect(readme).toContain('在线图片拼接')
    expect(readme).toContain('## English')
    expect(readme).toContain('## 简体中文')
    expect(readme).toContain('https://github.com/Pr0xS/PixelDeck')
    expect(readme).toContain('THIRD_PARTY_NOTICES.md')

    const license = await readFile(path.resolve('LICENSE'), 'utf8')
    expect(license).toContain('Copyright (c) 2025-2026 PixelDeck contributors')
    expect(license).toContain('Copyright (c) 2026 Moklu contributors')
    expect(license).toContain('Permission is hereby granted, free of charge')

    const notices = await readFile(path.resolve('THIRD_PARTY_NOTICES.md'), 'utf8')
    expect(notices).not.toContain('—')
    expect(notices).toContain('https://github.com/Pr0xS/PixelDeck')
    expect(notices).toContain('OFL-1.1')
    expect(notices).toContain('konva')
    expect(notices).toContain('@dnd-kit/core')
    expect(notices).toContain('jszip')
    expect(notices).not.toContain('public/icons.svg')
    expect(notices).not.toContain('待确认')
    expect(notices).toContain('布局数据，作者署名 PixelDeck')
    expect(notices).toContain('src/assets/mockups/browser.ts')

    for (const locale of LOCALE_CODES) {
      const aboutRoute = resolvePathname(locale === 'en' ? '/about' : `/${locale}/about`)
      const aboutMarkup = renderRouteMarkup(aboutRoute)
      expect(aboutMarkup).toContain('https://github.com/Pr0xS/PixelDeck')
      expect(aboutMarkup).toContain('https://github.com/imwarn/moklu')
    }
  })
})
