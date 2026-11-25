/**
 * [INPUT]: depends on vitest, node:child_process, node:fs/promises, node:os, node:path, node:util, react, and react-dom/server; depends on src/seo/* exports and scripts/prerender-seo.mjs
 * [OUTPUT]: automated unit and integration test suite for routing, 4-language copy uniqueness, 404 NotFoundContent & fallback head hygiene, active JSON-LD schemas, OG/Twitter head management, exact aria-current nav, subpage breadcrumbs, content-visibility sections, and SSG/404.html/sitemap output
 * [POS]: verification suite within src/seo validating both runtime SEO behavior and post-build static HTML/404.html/sitemap generation
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  ALL_ROUTES,
  DEFAULT_SITE_URL,
  LOCALE_CODES,
  NotFoundContent,
  PRIMARY_TOOL_SLUGS,
  ROUTE_DEFINITIONS,
  ROUTE_SLUGS,
  SeoLandingSections,
  SiteFooter,
  SiteHeader,
  applySeoHead,
  buildCanonicalUrl,
  buildLocalizedPath,
  buildRouteSchemaList,
  buildRouteSchemas,
  getHreflangLinks,
  getNotFoundCopy,
  getRouteCopy,
  getSiteUrl,
  getUiLabels,
  resolvePathname,
  serializeJsonLd,
} from './index.ts'
import {
  escapeHtml,
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  getRouteRelativeHtmlPath,
  renderRouteHtml,
  renderStudioSkeleton,
} from './ssg.ts'
import { renderRouteMarkup } from './ssrEntry.ts'
import { NAV_TOOL_ORDER, isToolNavActive } from './navHelpers.ts'

const execFileAsync = promisify(execFile)

describe('SEO route registry and pathname resolution', () => {
  it('defines all 30 route slugs and 120 localized static routes', () => {
    expect(ROUTE_SLUGS).toHaveLength(30)
    expect(ROUTE_DEFINITIONS).toHaveLength(30)
    expect(ALL_ROUTES).toHaveLength(120)

    const uniquePaths = new Set(ALL_ROUTES.map((r) => r.path))
    expect(uniquePaths.size).toBe(120)
  })

  it('builds root paths for English and trailing-slash paths for all subroutes', () => {
    expect(buildLocalizedPath('en', '')).toBe('/')
    expect(buildLocalizedPath('en', 'merge-images')).toBe('/merge-images/')
    expect(buildLocalizedPath('en', 'studio')).toBe('/studio/')
    expect(buildLocalizedPath('zh', '')).toBe('/zh/')
    expect(buildLocalizedPath('zh', 'id-card-watermark')).toBe('/zh/id-card-watermark/')
    expect(buildLocalizedPath('ja', 'carousel-splitter')).toBe('/ja/carousel-splitter/')
    expect(buildLocalizedPath('ko', 'browser-mockup')).toBe('/ko/browser-mockup/')

    for (const route of ALL_ROUTES) {
      expect(route.path.endsWith('/'), `${route.path} must end with /`).toBe(true)
    }
  })

  it('resolves all intent presets accurately and handles normalization/fallbacks', () => {
    const cases: Array<[string, { locale: string; slug: string; tool: string; check: (r: ReturnType<typeof resolvePathname>) => void }]> = [
      ['/', { locale: 'en', slug: '', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(false) }],
      ['/studio/', { locale: 'en', slug: 'studio', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(true) }],
      ['/zh/studio', { locale: 'zh', slug: 'studio', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(true) }],
      ['/browser-mockup', { locale: 'en', slug: 'browser-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('browser-chrome') }],
      ['/iphone-mockup', { locale: 'en', slug: 'iphone-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('iphone-16-pro') }],
      ['/ipad-mockup', { locale: 'en', slug: 'ipad-mockup', tool: 'mockup', check: (r) => { expect(r.preset.mockupModel).toBe('ipad-13'); expect(r.preset.canvasSize).toBe('landscape') } }],
      ['/watch-mockup', { locale: 'en', slug: 'watch-mockup', tool: 'mockup', check: (r) => { expect(r.preset.mockupModel).toBe('apple-watch'); expect(r.preset.canvasSize).toBe('square') } }],
      ['/device-mockup', { locale: 'en', slug: 'device-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('pixel-9') }],
      ['/app-store-screenshots', { locale: 'en', slug: 'app-store-screenshots', tool: 'mockup', check: (r) => expect(r.preset.canvasSize).toBe('story') }],
      ['/redact-screenshot', { locale: 'en', slug: 'redact-screenshot', tool: 'mockup', check: (r) => { expect(r.preset.mockupModel).toBe('browser-chrome'); expect(r.preset.canvasSize).toBe('wide'); expect(r.preset.enableRedact).toBe(true) } }],
      ['/combine-photos-side-by-side', { locale: 'en', slug: 'combine-photos-side-by-side', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('horizontal') }],
      ['/stitch-images-vertically', { locale: 'en', slug: 'stitch-images-vertically', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('vertical') }],
      ['/stitch-screenshots', { locale: 'en', slug: 'stitch-screenshots', tool: 'merge', check: (r) => { expect(r.preset.mergeDirection).toBe('vertical'); expect(r.preset.removeOverlap).toBe(true) } }],
      ['/photo-collage-grid', { locale: 'en', slug: 'photo-collage-grid', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('grid') }],
      ['/merge-photos-to-pdf', { locale: 'en', slug: 'merge-photos-to-pdf', tool: 'merge', check: (r) => { expect(r.preset.mergeFormat).toBe('application/pdf'); expect(r.preset.pdfMode).toBe('multipage') } }],
      ['/ja/carousel-splitter?ref=test', { locale: 'ja', slug: 'carousel-splitter', tool: 'split', check: (r) => expect(r.preset.splitMode).toBe('carousel') }],
      ['/ko/image-grid-splitter/', { locale: 'ko', slug: 'image-grid-splitter', tool: 'split', check: (r) => expect(r.preset.splitMode).toBe('grid') }],
      ['/heic-to-jpg', { locale: 'en', slug: 'heic-to-jpg', tool: 'compress', check: (r) => expect(r.preset.targetFormat).toBe('image/jpeg') }],
      ['/remove-exif', { locale: 'en', slug: 'remove-exif', tool: 'compress', check: (r) => { expect(r.preset.targetFormat).toBe('image/jpeg'); expect(r.preset.inspectExif).toBe(true) } }],
      ['/compress-image-to-200kb', { locale: 'en', slug: 'compress-image-to-200kb', tool: 'compress', check: (r) => { expect(r.preset.targetFormat).toBe('image/webp'); expect(r.preset.targetSizeKb).toBe(200) } }],
      ['/png-to-webp', { locale: 'en', slug: 'png-to-webp', tool: 'compress', check: (r) => expect(r.preset.targetFormat).toBe('image/webp') }],
      ['/resize-image', { locale: 'en', slug: 'resize-image', tool: 'resize', check: (r) => expect(r.preset.resizeMode).toBe('resize') }],
      ['/crop-image', { locale: 'en', slug: 'crop-image', tool: 'resize', check: (r) => expect(r.preset.resizeMode).toBe('crop') }],
      ['/add-border-to-photo', { locale: 'en', slug: 'add-border-to-photo', tool: 'resize', check: (r) => expect(r.preset.resizeMode).toBe('pad') }],
      ['/zh/id-card-watermark', { locale: 'zh', slug: 'id-card-watermark', tool: 'id-card', check: (r) => expect(r.isFallback).toBe(false) }],
    ]

    for (const [pathname, expected] of cases) {
      const resolved = resolvePathname(pathname)
      expect(resolved.locale).toBe(expected.locale)
      expect(resolved.slug).toBe(expected.slug)
      expect(resolved.tool).toBe(expected.tool)
      expect(resolved.isFallback).toBe(false)
      expected.check(resolved)
    }

    // Explicit /en prefix normalizes cleanly to root English canonical
    const enExplicit = resolvePathname('/en/merge-images/')
    expect(enExplicit.locale).toBe('en')
    expect(enExplicit.slug).toBe('merge-images')
    expect(enExplicit.path).toBe('/merge-images/')
    expect(enExplicit.isFallback).toBe(false)

    // Unknown slug falls back cleanly while preserving locale
    const fallback = resolvePathname('/ja/non-existent-route')
    expect(fallback.locale).toBe('ja')
    expect(fallback.slug).toBe('')
    expect(fallback.isFallback).toBe(true)
  })

  it('generates canonical URLs and 5 hreflang links with siteUrl override support', () => {
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
    expect(getSiteUrl('https://preview.moklu.app///')).toBe('https://preview.moklu.app')
    expect(buildCanonicalUrl('en', '', 'https://moklu.app')).toBe('https://moklu.app/')
    expect(buildCanonicalUrl('zh', 'merge-images', 'https://moklu.app')).toBe(
      'https://moklu.app/zh/merge-images/',
    )

    const links = getHreflangLinks('id-card-watermark', 'https://moklu.app')
    expect(links).toHaveLength(5)
    expect(links).toEqual([
      { hreflang: 'en', href: 'https://moklu.app/id-card-watermark/' },
      { hreflang: 'zh-Hans', href: 'https://moklu.app/zh/id-card-watermark/' },
      { hreflang: 'ja', href: 'https://moklu.app/ja/id-card-watermark/' },
      { hreflang: 'ko', href: 'https://moklu.app/ko/id-card-watermark/' },
      { hreflang: 'x-default', href: 'https://moklu.app/id-card-watermark/' },
    ])

    for (const growthSlug of [
      'ipad-mockup',
      'watch-mockup',
      'stitch-screenshots',
      'heic-to-jpg',
      'remove-exif',
      'compress-image-to-200kb',
      'redact-screenshot',
    ] as const) {
      const growthLinks = getHreflangLinks(growthSlug, 'https://moklu.app')
      expect(growthLinks).toHaveLength(5)
      expect(growthLinks.map((l) => l.hreflang)).toEqual(['en', 'zh-Hans', 'ja', 'ko', 'x-default'])
      const growthRoute = resolvePathname(`/${growthSlug}`)
      const growthSchemas = buildRouteSchemas(growthRoute, 'https://moklu.app')
      expect(growthSchemas.webApplication.url).toBe(`https://moklu.app/${growthSlug}/`)
      expect(growthSchemas.faqPage.mainEntity.length).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('4-language SEO content uniqueness and completeness', () => {
  it('provides genuinely unique title, metaDescription, h1, steps, highlights, and 4 FAQs per route in all 4 locales', () => {
    for (const locale of LOCALE_CODES) {
      const ui = getUiLabels(locale)
      expect(ui.brandName).toBe('Moklu')
      expect(ui.privacyProofPoints).toHaveLength(3)

      const titles = new Set<string>()
      const descriptions = new Set<string>()
      const h1s = new Set<string>()
      const faqQuestions = new Set<string>()

      for (const slug of ROUTE_SLUGS) {
        const copy = getRouteCopy(locale, slug)
        expect(copy.navLabel.trim().length).toBeGreaterThan(1)
        expect(copy.title.trim().length).toBeGreaterThan(12)
        expect(copy.metaDescription.trim().length).toBeGreaterThan(40)
        expect(copy.badge.trim().length).toBeGreaterThan(3)
        expect(copy.h1.trim().length).toBeGreaterThan(6)
        expect(copy.subtitle.trim().length).toBeGreaterThan(20)
        expect(copy.steps).toHaveLength(3)
        expect(copy.highlights).toHaveLength(3)
        const isInfoSlug = slug === 'about' || slug === 'privacy' || slug === 'terms'
        expect(copy.faqs.length).toBeGreaterThanOrEqual(isInfoSlug ? 2 : 4)

        expect(titles.has(copy.title)).toBe(false)
        expect(descriptions.has(copy.metaDescription)).toBe(false)
        expect(h1s.has(copy.h1)).toBe(false)

        titles.add(copy.title)
        descriptions.add(copy.metaDescription)
        h1s.add(copy.h1)

        for (const faq of copy.faqs) {
          expect(faq.question.trim().length).toBeGreaterThan(6)
          expect(faq.answer.trim().length).toBeGreaterThan(15)
          expect(faqQuestions.has(faq.question)).toBe(false)
          faqQuestions.add(faq.question)
        }
      }
    }
  })

  it('unifies duplicate-intent CTAs and eliminates em-dashes across all 4 locales', () => {
    for (const locale of LOCALE_CODES) {
      const ui = getUiLabels(locale)
      expect(ui.studioBannerAction).toBe(ui.openStudio)
      expect(ui.studioBannerProAction).toBe(ui.proUpgrade)

      const uiStrings: string[] = [
        ui.brandName,
        ui.brandTagline,
        ui.skipToContent,
        ui.openStudio,
        ui.openStudioShort,
        ui.openInStudioCta,
        ui.proBadge,
        ui.proUpgrade,
        ui.proActive,
        ui.dropzoneTitle,
        ui.dropzoneSubtitle,
        ui.privacyBadge,
        ui.privacyBannerTitle,
        ui.privacyBannerDescription,
        ...ui.privacyProofPoints,
        ui.howToHeading,
        ui.howToSubheading,
        ui.highlightsHeading,
        ui.highlightsSubheading,
        ui.relatedToolsHeading,
        ui.relatedToolsSubheading,
        ui.directoryHeading,
        ui.directorySubheading,
        ui.faqHeading,
        ui.faqSubheading,
        ui.studioBannerTitle,
        ui.studioBannerDescription,
        ui.studioBannerAction,
        ui.studioBannerProAction,
        ui.footerDescription,
        ui.footerLocalFirstNote,
        ui.footerCopyright,
      ]
      for (const value of uiStrings) {
        expect(value, `${locale} UI label contains em-dash: ${value}`).not.toContain('—')
      }

      for (const slug of ROUTE_SLUGS) {
        const copy = getRouteCopy(locale, slug)
        const routeStrings = [
          copy.navLabel,
          copy.title,
          copy.metaDescription,
          copy.badge,
          copy.h1,
          copy.subtitle,
          ...copy.steps.flatMap((s) => [s.title, s.description]),
          ...copy.highlights.flatMap((h) => [h.title, h.description]),
          ...copy.faqs.flatMap((f) => [f.question, f.answer]),
        ]
        for (const value of routeStrings) {
          expect(value, `${locale}/${slug} copy contains em-dash: ${value}`).not.toContain('—')
        }
      }
    }
  })
})

describe('Structured data JSON-LD and DOM head synchronization', () => {
  it('builds valid WebApplication, HowTo, and FAQPage schemas and escapes `<` safely', () => {
    const route = resolvePathname('/zh/id-card-watermark')
    const schemas = buildRouteSchemas(route, 'https://moklu.app')

    expect(schemas.webApplication['@type']).toBe('WebApplication')
    expect(schemas.webApplication.url).toBe('https://moklu.app/zh/id-card-watermark/')
    expect(schemas.webApplication.inLanguage).toBe('zh-CN')
    expect(schemas.webApplication.applicationCategory).toBe('UtilitiesApplication')
    expect(schemas.webApplication.offers.price).toBe('0')

    expect(schemas.howTo['@type']).toBe('HowTo')
    expect(schemas.howTo.step).toHaveLength(3)
    expect(schemas.howTo.step[0].position).toBe(1)

    expect(schemas.faqPage['@type']).toBe('FAQPage')
    expect(schemas.faqPage.mainEntity).toHaveLength(4)

    expect(buildRouteSchemaList(route, 'https://moklu.app').map((s) => s['@type'])).toEqual([
      'Organization',
      'WebSite',
      'BreadcrumbList',
      'WebApplication',
      'FAQPage',
    ])

    // Root hub omits 1-item BreadcrumbList and deprecated HowTo
    const rootHubRoute = resolvePathname('/')
    expect(buildRouteSchemaList(rootHubRoute, 'https://moklu.app').map((s) => s['@type'])).toEqual([
      'Organization',
      'WebSite',
      'WebApplication',
      'FAQPage',
    ])

    // Studio routes omit hidden FAQPage and deprecated HowTo
    const studioRoute = resolvePathname('/studio')
    expect(buildRouteSchemaList(studioRoute, 'https://moklu.app').map((s) => s['@type'])).toEqual([
      'Organization',
      'WebSite',
      'BreadcrumbList',
      'WebApplication',
    ])

    const serialized = serializeJsonLd({ danger: '</script><script>alert(1)</script>' })
    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c/script>')
  })

  it('updates document head tags cleanly across route transitions without duplicating nodes', () => {
    interface MockEl {
      tag: string
      attrs: Record<string, string>
      textContent: string
      setAttribute: (k: string, v: string) => void
      getAttribute: (k: string) => string | null
      remove: () => void
    }

    const headChildren: MockEl[] = []
    const createMockEl = (tag: string): MockEl => {
      const el: MockEl = {
        tag: tag.toLowerCase(),
        attrs: {},
        textContent: '',
        setAttribute(k, v) {
          el.attrs[k] = v
        },
        getAttribute(k) {
          return el.attrs[k] ?? null
        },
        remove() {
          const idx = headChildren.indexOf(el)
          if (idx >= 0) headChildren.splice(idx, 1)
        },
      }
      return el
    }

    const matchesSelector = (el: MockEl, selector: string): boolean => {
      if (selector === 'link[rel="canonical"]') {
        return el.tag === 'link' && el.attrs.rel === 'canonical'
      }
      if (selector === 'link[rel="alternate"][hreflang]') {
        return el.tag === 'link' && el.attrs.rel === 'alternate' && Boolean(el.attrs.hreflang)
      }
      if (selector === 'script[type="application/ld+json"][data-moklu-seo]') {
        return (
          el.tag === 'script' &&
          el.attrs.type === 'application/ld+json' &&
          Boolean(el.attrs['data-moklu-seo'])
        )
      }
      const metaMatch = selector.match(/^meta\[(name|property)="([^"]+)"\]$/)
      if (metaMatch) {
        return el.tag === 'meta' && el.attrs[metaMatch[1]] === metaMatch[2]
      }
      return false
    }

    const mockDoc = {
      title: '',
      documentElement: { lang: 'en' },
      createElement: (tag: string) => createMockEl(tag),
      head: {
        appendChild: (el: MockEl) => {
          headChildren.push(el)
          return el
        },
        querySelector: (selector: string) =>
          headChildren.find((el) => matchesSelector(el, selector)) ?? null,
        querySelectorAll: (selector: string) =>
          headChildren.filter((el) => matchesSelector(el, selector)),
      },
    } as unknown as Document

    applySeoHead(mockDoc, resolvePathname('/browser-mockup'), 'https://moklu.app')
    const enBrowserCopy = getRouteCopy('en', 'browser-mockup')
    expect(mockDoc.documentElement.lang).toBe('en')
    expect(mockDoc.title).toContain('Browser Mockup')
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(5)
    expect(headChildren.filter((el) => el.attrs.type === 'application/ld+json')).toHaveLength(5)
    expect(headChildren.find((el) => el.attrs.property === 'og:image:width')?.attrs.content).toBe('1200')
    expect(headChildren.find((el) => el.attrs.property === 'og:image:height')?.attrs.content).toBe('630')
    expect(headChildren.find((el) => el.attrs.property === 'og:image:alt')?.attrs.content).toBe(
      enBrowserCopy.title,
    )
    expect(headChildren.find((el) => el.attrs.name === 'twitter:image:alt')?.attrs.content).toBe(
      enBrowserCopy.title,
    )
    expect(
      headChildren
        .filter((el) => el.attrs.property === 'og:locale:alternate')
        .map((el) => el.attrs.content),
    ).toEqual(['zh_CN', 'ja_JP', 'ko_KR'])

    // Transition to Korean route and verify zero stale duplicates
    applySeoHead(mockDoc, resolvePathname('/ko/merge-images'), 'https://moklu.app')
    const koMergeCopy = getRouteCopy('ko', 'merge-images')
    expect(mockDoc.documentElement.lang).toBe('ko')
    expect(mockDoc.title).toBe(koMergeCopy.title)
    expect(headChildren.filter((el) => el.attrs.rel === 'canonical')).toHaveLength(1)
    expect(headChildren.find((el) => el.attrs.rel === 'canonical')?.attrs.href).toBe(
      'https://moklu.app/ko/merge-images/',
    )
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(5)
    expect(headChildren.filter((el) => el.attrs.type === 'application/ld+json')).toHaveLength(5)
    expect(
      headChildren
        .filter((el) => el.attrs.property === 'og:locale:alternate')
        .map((el) => el.attrs.content),
    ).toEqual(['en_US', 'zh_CN', 'ja_JP'])
    expect(headChildren.find((el) => el.attrs.property === 'og:image:alt')?.attrs.content).toBe(
      koMergeCopy.title,
    )
    expect(headChildren.find((el) => el.attrs.name === 'twitter:image:alt')?.attrs.content).toBe(
      koMergeCopy.title,
    )

    // Fallback route uses localized 404 metadata, removes canonical/hreflang/og:url/og:locale:alternate, and emits only Organization + WebSite JSON-LD
    applySeoHead(mockDoc, resolvePathname('/ja/non-existent-route'), 'https://moklu.app')
    const jaNotFoundCopy = getNotFoundCopy('ja')
    expect(mockDoc.documentElement.lang).toBe('ja')
    expect(mockDoc.title).toBe(jaNotFoundCopy.title)
    expect(headChildren.find((el) => el.attrs.name === 'description')?.attrs.content).toBe(
      jaNotFoundCopy.metaDescription,
    )
    expect(headChildren.find((el) => el.attrs.name === 'robots')?.attrs.content).toBe(
      'noindex, follow',
    )
    expect(headChildren.filter((el) => el.attrs.rel === 'canonical')).toHaveLength(0)
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(0)
    expect(headChildren.filter((el) => el.attrs.property === 'og:url')).toHaveLength(0)
    expect(headChildren.filter((el) => el.attrs.property === 'og:locale:alternate')).toHaveLength(0)
    expect(headChildren.find((el) => el.attrs.property === 'og:title')?.attrs.content).toBe(
      jaNotFoundCopy.title,
    )
    expect(headChildren.find((el) => el.attrs.property === 'og:description')?.attrs.content).toBe(
      jaNotFoundCopy.metaDescription,
    )
    expect(headChildren.find((el) => el.attrs.property === 'og:image:alt')?.attrs.content).toBe(
      jaNotFoundCopy.title,
    )
    expect(headChildren.find((el) => el.attrs.name === 'twitter:title')?.attrs.content).toBe(
      jaNotFoundCopy.title,
    )
    expect(headChildren.find((el) => el.attrs.name === 'twitter:description')?.attrs.content).toBe(
      jaNotFoundCopy.metaDescription,
    )
    expect(headChildren.find((el) => el.attrs.name === 'twitter:image:alt')?.attrs.content).toBe(
      jaNotFoundCopy.title,
    )
    const fallbackJsonLd = headChildren
      .filter((el) => el.attrs.type === 'application/ld+json')
      .map((el) => JSON.parse(el.textContent)['@type'] as string)
    expect(fallbackJsonLd).toEqual(['Organization', 'WebSite'])

    // Navigating back to a valid route restores canonical, hreflang, og:url, og:locale:alternate, and indexable robots
    applySeoHead(mockDoc, resolvePathname('/ja/merge-images'), 'https://moklu.app')
    expect(headChildren.find((el) => el.attrs.name === 'robots')?.attrs.content).toBe(
      'index, follow',
    )
    expect(headChildren.filter((el) => el.attrs.rel === 'canonical')).toHaveLength(1)
    expect(headChildren.find((el) => el.attrs.rel === 'canonical')?.attrs.href).toBe(
      'https://moklu.app/ja/merge-images/',
    )
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(5)
    expect(headChildren.find((el) => el.attrs.property === 'og:url')?.attrs.content).toBe(
      'https://moklu.app/ja/merge-images/',
    )
    expect(headChildren.filter((el) => el.attrs.property === 'og:locale:alternate')).toHaveLength(3)
    expect(headChildren.filter((el) => el.attrs.type === 'application/ld+json')).toHaveLength(5)
  })
})

describe('SEO UI chrome SSR rendering', () => {
  it('renders SiteHeader, SeoLandingSections, and SiteFooter cleanly in light and dark modes', () => {
    const noop = () => {}
    for (const [pathname, theme] of [
      ['/', 'light'],
      ['/zh/id-card-watermark', 'dark'],
      ['/ja/carousel-splitter', 'light'],
      ['/ko/browser-mockup', 'dark'],
    ] as const) {
      const route = resolvePathname(pathname)
      const headerHtml = renderToStaticMarkup(
        createElement(SiteHeader, {
          route,
          theme,
          onNavigate: noop,
          onToggleTheme: noop,
          onOpenProModal: noop,
        }),
      )
      const sectionsHtml = renderToStaticMarkup(
        createElement(SeoLandingSections, {
          route,
          theme,
          onNavigate: noop,
        }),
      )
      const footerHtml = renderToStaticMarkup(
        createElement(SiteFooter, {
          route,
          theme,
          onNavigate: noop,
        }),
      )

      const copy = getRouteCopy(route.locale, route.slug)
      const ui = getUiLabels(route.locale)
      expect(headerHtml).toContain('Moklu')
      expect(headerHtml).toContain(`href="#main-content"`)
      expect(headerHtml).toContain(escapeHtml(ui.skipToContent))
      expect(headerHtml).toContain(`aria-label="${escapeHtml(ui.primaryNavAria)}"`)
      expect(headerHtml).toContain('aria-controls="mobile-tool-nav"')
      expect(headerHtml).toContain(`href="${buildLocalizedPath(route.locale, 'studio')}"`)
      expect(sectionsHtml).toContain(escapeHtml(copy.steps[0].title))
      for (const faq of copy.faqs) {
        expect(sectionsHtml).toContain(escapeHtml(faq.question))
        expect(sectionsHtml).toContain(escapeHtml(faq.answer))
      }
      expect(sectionsHtml).not.toContain('uppercase tracking-wider')
      expect(sectionsHtml).not.toContain('transition-all')
      expect(headerHtml).not.toContain('transition-all')
      expect(sectionsHtml).not.toContain('dark:divide-white/10')
      expect(sectionsHtml).toContain(theme === 'dark' ? 'divide-white/10' : 'divide-zinc-200/70')
      // Every below-the-fold <section> defers off-screen rendering via content-visibility
      const sectionTags = [...sectionsHtml.matchAll(/<section\b[^>]*>/g)].map((m) => m[0])
      expect(sectionTags.length).toBeGreaterThanOrEqual(7)
      for (const tag of sectionTags) {
        expect(tag).toContain('[content-visibility:auto]')
        expect(tag).toContain('[contain-intrinsic-size:auto_420px]')
      }
      if (route.slug === '') {
        expect(sectionsHtml).not.toContain('aria-label="Breadcrumbs"')
      } else {
        expect(sectionsHtml).toContain('aria-label="Breadcrumbs"')
        expect(sectionsHtml).toContain(`href="${buildLocalizedPath(route.locale, '')}"`)
        expect(sectionsHtml).toContain(`href="${route.path}" aria-current="page"`)
      }
      expect(footerHtml).toMatch(/hreflang="en"/i)
      expect(footerHtml).toMatch(/hreflang="zh-Hans"/i)
      expect(footerHtml).toMatch(/hreflang="ja"/i)
      expect(footerHtml).toMatch(/hreflang="ko"/i)
    }
  })

  it('computes active tool navigation state consistently and emits aria-current="page" only on exact URL matches', () => {
    const noop = () => {}
    const home = resolvePathname('/')
    expect(isToolNavActive(home, 'mockup')).toBe(false)
    expect(isToolNavActive(home, 'merge')).toBe(false)

    const zhHome = resolvePathname('/zh')
    expect(isToolNavActive(zhHome, 'mockup')).toBe(false)
    expect(isToolNavActive(zhHome, 'id-card')).toBe(false)

    const merge = resolvePathname('/zh/stitch-images-vertically')
    expect(isToolNavActive(merge, 'merge')).toBe(true)
    expect(isToolNavActive(merge, 'mockup')).toBe(false)

    const studio = resolvePathname('/studio')
    expect(isToolNavActive(studio, 'mockup')).toBe(false)
    expect(isToolNavActive(studio, 'merge')).toBe(false)

    // Homepage emits zero aria-current="page" in primary nav
    const homeHeader = renderToStaticMarkup(
      createElement(SiteHeader, {
        route: home,
        theme: 'light',
        onNavigate: noop,
        onToggleTheme: noop,
      }),
    )
    expect(homeHeader).not.toContain('aria-current="page"')

    // Secondary mockup route highlights category pill visually without false aria-current="page" on /browser-mockup/
    const iphoneHeader = renderToStaticMarkup(
      createElement(SiteHeader, {
        route: resolvePathname('/iphone-mockup'),
        theme: 'light',
        onNavigate: noop,
        onToggleTheme: noop,
      }),
    )
    expect(iphoneHeader).toContain('bg-accent-soft text-accent-text')
    expect(iphoneHeader).not.toContain('aria-current="page"')

    // Primary tool route emits aria-current="page" on its exact link
    const browserHeader = renderToStaticMarkup(
      createElement(SiteHeader, {
        route: resolvePathname('/browser-mockup'),
        theme: 'light',
        onNavigate: noop,
        onToggleTheme: noop,
      }),
    )
    expect(browserHeader).toContain('href="/browser-mockup/" aria-current="page"')
  })

  it('renders below-the-fold Pro CTA in SeoLandingSections and semantic success active Pro state', () => {
    const noop = () => {}
    const route = resolvePathname('/zh/browser-mockup')
    const ui = getUiLabels('zh')

    const freeSections = renderToStaticMarkup(
      createElement(SeoLandingSections, {
        route,
        theme: 'light',
        onNavigate: noop,
        onOpenProModal: noop,
        isPro: false,
      }),
    )
    expect(freeSections).toContain(escapeHtml(ui.studioBannerProAction))
    expect(freeSections).toContain('border-warning/40')

    const proSections = renderToStaticMarkup(
      createElement(SeoLandingSections, {
        route,
        theme: 'dark',
        onNavigate: noop,
        onOpenProModal: noop,
        isPro: true,
      }),
    )
    expect(proSections).toContain(escapeHtml(ui.proActive))
    expect(proSections).toContain('border-success/40')
  })

  it('renders 4-locale NotFoundContent with 6 primary tool links, zero QuickWorkspace, and zero em-dashes', () => {
    const noop = () => {}
    for (const locale of LOCALE_CODES) {
      const route = resolvePathname(locale === 'en' ? '/non-existent-page' : `/${locale}/non-existent-page`)
      expect(route.isFallback).toBe(true)

      const copy = getNotFoundCopy(locale)
      for (const value of [
        copy.title,
        copy.metaDescription,
        copy.badge,
        copy.h1,
        copy.description,
        copy.homeCta,
        copy.studioCta,
        copy.toolsHeading,
      ]) {
        expect(value.trim().length).toBeGreaterThan(0)
        expect(value, `${locale} 404 copy contains em-dash: ${value}`).not.toContain('—')
      }
      expect(copy.studioCta).toBe(getUiLabels(locale).openStudio)

      const html = renderToStaticMarkup(
        createElement(NotFoundContent, {
          route,
          theme: locale === 'zh' || locale === 'ko' ? 'dark' : 'light',
          onNavigate: noop,
        }),
      )

      expect(html).toContain('data-testid="not-found-page"')
      expect(html).not.toContain('data-testid="quick-workspace"')
      expect(html).not.toContain('—')
      expect(html).toContain(escapeHtml(copy.h1))
      expect(html).toContain(escapeHtml(copy.homeCta))
      expect(html).toContain(escapeHtml(copy.studioCta))
      expect(html).toContain(`href="${buildLocalizedPath(locale, '')}"`)
      expect(html).toContain(`href="${buildLocalizedPath(locale, 'studio')}"`)

      for (const toolId of NAV_TOOL_ORDER) {
        const slug = PRIMARY_TOOL_SLUGS[toolId]
        const toolHref = buildLocalizedPath(locale, slug)
        const toolCopy = getRouteCopy(locale, slug)
        expect(html).toContain(`href="${toolHref}"`)
        expect(html).toContain(escapeHtml(toolCopy.navLabel))
        expect(html).toContain(escapeHtml(toolCopy.badge))
      }

      // Full page SSR via renderRouteMarkup renders NotFoundContent inside ToolLandingPage without QuickWorkspace
      const fullMarkup = renderRouteMarkup(route)
      expect(fullMarkup).toContain('data-testid="tool-landing-page"')
      expect(fullMarkup).toContain('data-testid="not-found-page"')
      expect(fullMarkup).not.toContain('data-testid="quick-workspace"')
    }
  })

  it('aligns Tailwind v4 dark variant to data-theme="dark" and defines light/dark scrollbars in src/index.css', async () => {
    const css = await readFile(path.resolve('src/index.css'), 'utf8')
    expect(css).toContain('@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));')
    expect(css).toContain('::-webkit-scrollbar-thumb { background: rgba(24, 24, 27, 0.22);')
    expect(css).toContain('html[data-theme="dark"]::-webkit-scrollbar-thumb')
  })
})

describe('Build-time SSG prerenderer, sitemap.xml, robots.txt, and CSP safety', () => {
  const SAMPLE_DIST_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Moklu | Screenshot & Mockup Studio</title>
    <meta name="description" content="Default template description" />
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-abc123.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

  it('injects localized metadata, JSON-LD, and full React-rendered markup with zero raw ssg shell or inline scripts', () => {
    const route = resolvePathname('/ja/merge-images')
    const markup = renderRouteMarkup(route)
    const rendered = renderRouteHtml(SAMPLE_DIST_TEMPLATE, route, 'https://moklu.app', markup)
    const copy = getRouteCopy('ja', 'merge-images')

    expect(rendered).toContain('<html lang="ja" data-theme="light" data-surface="workspace">')
    expect(rendered).toContain(`<title>${copy.title}</title>`)
    expect(rendered).toContain('<link rel="canonical" href="https://moklu.app/ja/merge-images/" />')
    expect(rendered).toContain('<meta property="og:image" content="https://moklu.app/og-image.png" />')
    expect(rendered).toContain('<meta property="og:image:width" content="1200" />')
    expect(rendered).toContain('<meta property="og:image:height" content="630" />')
    expect(rendered).toContain(`<meta property="og:image:alt" content="${escapeHtml(copy.title)}" />`)
    expect(rendered).toContain('<meta name="twitter:image" content="https://moklu.app/og-image.png" />')
    expect(rendered).toContain(`<meta name="twitter:image:alt" content="${escapeHtml(copy.title)}" />`)
    expect(rendered).toContain(
      '<meta property="og:locale:alternate" content="en_US" data-moklu-seo="og-locale-alt" />',
    )
    expect(rendered).toContain(
      '<meta property="og:locale:alternate" content="zh_CN" data-moklu-seo="og-locale-alt" />',
    )
    expect(rendered).toContain(
      '<meta property="og:locale:alternate" content="ko_KR" data-moklu-seo="og-locale-alt" />',
    )
    expect(rendered).not.toContain('<meta property="og:locale:alternate" content="ja_JP"')
    expect(rendered).toContain('hreflang="x-default" href="https://moklu.app/merge-images/"')
    expect(rendered).toContain(copy.h1)
    expect(rendered).toContain(copy.faqs[0].question)
    expect(rendered).toContain('data-testid="tool-landing-page"')
    expect(rendered).toContain('data-testid="quick-workspace"')
    expect(rendered).not.toContain('data-ssg-shell')
    expect(rendered).toContain('<script type="module" crossorigin src="/assets/index-abc123.js"></script>')

    // Strict CSP check: EVERY <script> tag must either have src= or type="application/ld+json"
    const scriptTags = [...rendered.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1])
    expect(scriptTags.length).toBe(6) // 1 Vite module bundle + 5 JSON-LD blocks (no deprecated HowTo)
    for (const attrs of scriptTags) {
      const isExternal = /\bsrc="/i.test(attrs)
      const isJsonLd = /\btype="application\/ld\+json"/i.test(attrs)
      expect(isExternal || isJsonLd).toBe(true)
    }

    // Studio routes emit a styled dark skeleton without loading Konva or hidden FAQ/HowTo JSON-LD
    const studioRoute = resolvePathname('/studio')
    const studioHtml = renderRouteHtml(
      SAMPLE_DIST_TEMPLATE,
      studioRoute,
      'https://moklu.app',
      renderStudioSkeleton(studioRoute),
    )
    expect(studioHtml).toContain('<html lang="en" data-theme="dark" data-surface="studio">')
    expect(studioHtml).toContain('data-testid="studio-ssg-skeleton"')
    expect(studioHtml).not.toContain('data-ssg-shell')
    expect(studioHtml).not.toContain('"@type":"FAQPage"')
    expect(studioHtml).not.toContain('"@type":"HowTo"')

    // Re-rendering an already prerendered page stays idempotent
    const rerendered = renderRouteHtml(rendered, route, 'https://moklu.app', markup)
    expect(rerendered.match(/<link rel="canonical"/g)?.length).toBe(1)
    expect(rerendered.match(/property="og:image:width"/g)?.length).toBe(1)
    expect(rerendered.match(/property="og:locale:alternate"/g)?.length).toBe(3)
    expect(rerendered.match(/data-testid="tool-landing-page"/g)?.length).toBe(1)
  })

  it('executes scripts/prerender-seo.mjs via Node ESM and writes all 120 static HTML files, sitemap.xml, robots.txt, and llms.txt', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'moklu-ssg-test-'))
    try {
      await writeFile(path.join(tmpDir, 'index.html'), SAMPLE_DIST_TEMPLATE, 'utf8')
      const { stdout } = await execFileAsync(
        process.execPath,
        [path.resolve('scripts/prerender-seo.mjs'), tmpDir],
        {
          env: {
            ...process.env,
            VITE_SITE_URL: 'https://moklu.app',
            MOKLU_SSG_LASTMOD: '2026-11-23',
          },
        },
      )
      const report = JSON.parse(stdout) as {
        ok: boolean
        siteUrl: string
        routesWritten: number
        sitemapUrls: number
        llmsPath: string
      }

      expect(report.ok).toBe(true)
      expect(report.siteUrl).toBe('https://moklu.app')
      expect(report.routesWritten).toBe(120)
      expect(report.sitemapUrls).toBe(120)

      // Spot-check key static route paths
      const spotChecks = [
        { route: resolvePathname('/'), expectedRel: 'index.html', expectedLang: 'en' },
        { route: resolvePathname('/merge-images'), expectedRel: path.join('merge-images', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/merge-photos-to-pdf'), expectedRel: path.join('merge-photos-to-pdf', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/heic-to-jpg'), expectedRel: path.join('heic-to-jpg', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/compress-image-to-200kb'), expectedRel: path.join('compress-image-to-200kb', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/redact-screenshot'), expectedRel: path.join('redact-screenshot', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/studio'), expectedRel: path.join('studio', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/zh'), expectedRel: path.join('zh', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/stitch-screenshots'), expectedRel: path.join('zh', 'stitch-screenshots', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/remove-exif'), expectedRel: path.join('zh', 'remove-exif', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/id-card-watermark'), expectedRel: path.join('zh', 'id-card-watermark', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/privacy'), expectedRel: path.join('zh', 'privacy', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/ja/ipad-mockup'), expectedRel: path.join('ja', 'ipad-mockup', 'index.html'), expectedLang: 'ja' },
        { route: resolvePathname('/ko/watch-mockup'), expectedRel: path.join('ko', 'watch-mockup', 'index.html'), expectedLang: 'ko' },
        { route: resolvePathname('/ko/browser-mockup'), expectedRel: path.join('ko', 'browser-mockup', 'index.html'), expectedLang: 'ko' },
      ]

      for (const { route, expectedRel, expectedLang } of spotChecks) {
        const outPath = path.join(tmpDir, ...getRouteRelativeHtmlPath(route))
        expect(outPath).toBe(path.join(tmpDir, expectedRel))
        const html = await readFile(outPath, 'utf8')
        expect(html).toContain(`<html lang="${expectedLang}"`)
        expect(html).toContain(escapeHtml(getRouteCopy(route.locale, route.slug).h1))
        expect(html).not.toContain('data-ssg-shell')
        if (route.isStudio) {
          expect(html).toContain('data-testid="studio-ssg-skeleton"')
        } else if (route.isInfoPage) {
          expect(html).toContain('data-testid="tool-landing-page"')
          expect(html).not.toContain('data-testid="quick-workspace"')
        } else {
          expect(html).toContain('data-testid="tool-landing-page"')
          expect(html).toContain('data-testid="quick-workspace"')
        }
      }

      const sitemap = await readFile(path.join(tmpDir, 'sitemap.xml'), 'utf8')
      expect(sitemap).toBe(generateSitemapXml('https://moklu.app', '2026-11-23'))
      expect(sitemap.match(/<url>/g)?.length).toBe(120)
      expect(sitemap).not.toContain('/404')
      expect(sitemap).not.toContain('<changefreq>')
      expect(sitemap).not.toContain('<priority>')

      // Static dist/404.html is emitted with noindex, follow, NotFoundContent markup, and clean fallback head
      const notFoundHtml = await readFile(path.join(tmpDir, '404.html'), 'utf8')
      const enNotFound = getNotFoundCopy('en')
      expect(notFoundHtml).toContain('<html lang="en" data-theme="light" data-surface="workspace">')
      expect(notFoundHtml).toContain(`<title>${escapeHtml(enNotFound.title)}</title>`)
      expect(notFoundHtml).toContain('<meta name="robots" content="noindex, follow" />')
      expect(notFoundHtml).not.toContain('<link rel="canonical"')
      expect(notFoundHtml).not.toContain('hreflang=')
      expect(notFoundHtml).not.toContain('property="og:url"')
      expect(notFoundHtml).not.toContain('property="og:locale:alternate"')
      expect(notFoundHtml).toContain('data-testid="not-found-page"')
      expect(notFoundHtml).not.toContain('data-testid="quick-workspace"')
      const notFoundJsonLd = [
        ...notFoundHtml.matchAll(
          /<script type="application\/ld\+json" data-moklu-seo="jsonld">([\s\S]*?)<\/script>/g,
        ),
      ].map((m) => JSON.parse(m[1])['@type'] as string)
      expect(notFoundJsonLd).toEqual(['Organization', 'WebSite'])
      expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
      expect(sitemap).toContain('hreflang="zh-Hans"')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/id-card-watermark/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/privacy/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/merge-photos-to-pdf/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/heic-to-jpg/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/stitch-screenshots/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/ko/remove-exif/</loc>')
      for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        expect(match[1].endsWith('/'), `sitemap loc ${match[1]} must end with /`).toBe(true)
      }

      // Per-route lastmod map support and git-derived dates in prerender-seo.mjs
      const perRouteSitemap = generateSitemapXml(
        'https://moklu.app',
        new Map([
          ['/', '2026-11-20'],
          ['/zh/merge-images/', '2026-11-21'],
        ]),
      )
      expect(perRouteSitemap).toContain(
        '<loc>https://moklu.app/</loc>\n    <lastmod>2026-11-20</lastmod>',
      )
      expect(perRouteSitemap).toContain(
        '<loc>https://moklu.app/zh/merge-images/</loc>\n    <lastmod>2026-11-21</lastmod>',
      )
      expect(perRouteSitemap).not.toContain('<changefreq>')
      expect(perRouteSitemap).not.toContain('<priority>')

      const { stdout: gitLastmodJson } = await execFileAsync(process.execPath, [
        '--input-type=module',
        '-e',
        `import { resolveRouteLastmodMap } from ${JSON.stringify(path.resolve('scripts/prerender-seo.mjs'))}; console.log(JSON.stringify(Object.fromEntries(resolveRouteLastmodMap())));`,
      ])
      const gitLastmodRecord = JSON.parse(gitLastmodJson) as Record<string, string>
      expect(Object.keys(gitLastmodRecord)).toHaveLength(120)
      for (const dateValue of Object.values(gitLastmodRecord)) {
        expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }

      const robots = await readFile(path.join(tmpDir, 'robots.txt'), 'utf8')
      expect(robots).toBe(generateRobotsTxt('https://moklu.app'))
      expect(robots).toContain('Sitemap: https://moklu.app/sitemap.xml')

      const llms = await readFile(path.join(tmpDir, 'llms.txt'), 'utf8')
      expect(llms).toBe(generateLlmsTxt('https://moklu.app'))
      expect(llms.startsWith('# Moklu')).toBe(true)
      expect(llms).not.toMatch(/<!doctype html|<html/i)
      expect(llms).toContain('在线图片拼接')
      expect(llms).toContain('https://moklu.app/zh/merge-images/')
      expect(llms).toContain('https://moklu.app/merge-photos-to-pdf/')
      expect(llms).toContain('https://github.com/imwarn/moklu')
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }, 30_000)
})
