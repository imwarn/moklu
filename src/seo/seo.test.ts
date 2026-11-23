/**
 * [INPUT]: depends on vitest, node:fs/promises, node:os, node:path, react, and react-dom/server; depends on src/seo/* exports and scripts/prerender-seo.mjs
 * [OUTPUT]: automated unit and integration test suite for routing, 4-language copy uniqueness, JSON-LD schemas, head management, React chrome rendering, and SSG output
 * [POS]: verification suite within src/seo validating both runtime SEO behavior and post-build static HTML/sitemap generation
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
  getRouteCopy,
  getSiteUrl,
  getUiLabels,
  resolvePathname,
  serializeJsonLd,
} from './index.ts'
import {
  escapeHtml,
  generateRobotsTxt,
  generateSitemapXml,
  getRouteRelativeHtmlPath,
  renderRouteHtml,
  renderStudioSkeleton,
} from './ssg.ts'
import { renderRouteMarkup } from './ssrEntry.ts'

const execFileAsync = promisify(execFile)

describe('SEO route registry and pathname resolution', () => {
  it('defines all 19 route slugs and 76 localized static routes', () => {
    expect(ROUTE_SLUGS).toHaveLength(19)
    expect(ROUTE_DEFINITIONS).toHaveLength(19)
    expect(ALL_ROUTES).toHaveLength(76)

    const uniquePaths = new Set(ALL_ROUTES.map((r) => r.path))
    expect(uniquePaths.size).toBe(76)
  })

  it('builds root paths for English and prefixed paths for zh/ja/ko', () => {
    expect(buildLocalizedPath('en', '')).toBe('/')
    expect(buildLocalizedPath('en', 'merge-images')).toBe('/merge-images')
    expect(buildLocalizedPath('en', 'studio')).toBe('/studio')
    expect(buildLocalizedPath('zh', '')).toBe('/zh')
    expect(buildLocalizedPath('zh', 'id-card-watermark')).toBe('/zh/id-card-watermark')
    expect(buildLocalizedPath('ja', 'carousel-splitter')).toBe('/ja/carousel-splitter')
    expect(buildLocalizedPath('ko', 'browser-mockup')).toBe('/ko/browser-mockup')
  })

  it('resolves all intent presets accurately and handles normalization/fallbacks', () => {
    const cases: Array<[string, { locale: string; slug: string; tool: string; check: (r: ReturnType<typeof resolvePathname>) => void }]> = [
      ['/', { locale: 'en', slug: '', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(false) }],
      ['/studio/', { locale: 'en', slug: 'studio', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(true) }],
      ['/zh/studio', { locale: 'zh', slug: 'studio', tool: 'mockup', check: (r) => expect(r.isStudio).toBe(true) }],
      ['/browser-mockup', { locale: 'en', slug: 'browser-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('browser-chrome') }],
      ['/iphone-mockup', { locale: 'en', slug: 'iphone-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('iphone-16-pro') }],
      ['/device-mockup', { locale: 'en', slug: 'device-mockup', tool: 'mockup', check: (r) => expect(r.preset.mockupModel).toBe('pixel-9') }],
      ['/app-store-screenshots', { locale: 'en', slug: 'app-store-screenshots', tool: 'mockup', check: (r) => expect(r.preset.canvasSize).toBe('story') }],
      ['/combine-photos-side-by-side', { locale: 'en', slug: 'combine-photos-side-by-side', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('horizontal') }],
      ['/stitch-images-vertically', { locale: 'en', slug: 'stitch-images-vertically', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('vertical') }],
      ['/photo-collage-grid', { locale: 'en', slug: 'photo-collage-grid', tool: 'merge', check: (r) => expect(r.preset.mergeDirection).toBe('grid') }],
      ['/ja/carousel-splitter?ref=test', { locale: 'ja', slug: 'carousel-splitter', tool: 'split', check: (r) => expect(r.preset.splitMode).toBe('carousel') }],
      ['/ko/image-grid-splitter/', { locale: 'ko', slug: 'image-grid-splitter', tool: 'split', check: (r) => expect(r.preset.splitMode).toBe('grid') }],
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
    expect(enExplicit.path).toBe('/merge-images')
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
      'https://moklu.app/zh/merge-images',
    )

    const links = getHreflangLinks('id-card-watermark', 'https://moklu.app')
    expect(links).toHaveLength(5)
    expect(links).toEqual([
      { hreflang: 'en', href: 'https://moklu.app/id-card-watermark' },
      { hreflang: 'zh', href: 'https://moklu.app/zh/id-card-watermark' },
      { hreflang: 'ja', href: 'https://moklu.app/ja/id-card-watermark' },
      { hreflang: 'ko', href: 'https://moklu.app/ko/id-card-watermark' },
      { hreflang: 'x-default', href: 'https://moklu.app/id-card-watermark' },
    ])
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
        expect(copy.faqs).toHaveLength(4)

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
})

describe('Structured data JSON-LD and DOM head synchronization', () => {
  it('builds valid WebApplication, HowTo, and FAQPage schemas and escapes `<` safely', () => {
    const route = resolvePathname('/zh/id-card-watermark')
    const schemas = buildRouteSchemas(route, 'https://moklu.app')

    expect(schemas.webApplication['@type']).toBe('WebApplication')
    expect(schemas.webApplication.url).toBe('https://moklu.app/zh/id-card-watermark')
    expect(schemas.webApplication.inLanguage).toBe('zh')
    expect(schemas.webApplication.offers.price).toBe('0')

    expect(schemas.howTo['@type']).toBe('HowTo')
    expect(schemas.howTo.step).toHaveLength(3)
    expect(schemas.howTo.step[0].position).toBe(1)

    expect(schemas.faqPage['@type']).toBe('FAQPage')
    expect(schemas.faqPage.mainEntity).toHaveLength(4)

    expect(buildRouteSchemaList(route, 'https://moklu.app')).toHaveLength(3)

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
    expect(mockDoc.documentElement.lang).toBe('en')
    expect(mockDoc.title).toContain('Browser Mockup')
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(5)
    expect(headChildren.filter((el) => el.attrs.type === 'application/ld+json')).toHaveLength(3)

    // Transition to Korean route and verify zero stale duplicates
    applySeoHead(mockDoc, resolvePathname('/ko/merge-images'), 'https://moklu.app')
    expect(mockDoc.documentElement.lang).toBe('ko')
    expect(mockDoc.title).toBe(getRouteCopy('ko', 'merge-images').title)
    expect(headChildren.filter((el) => el.attrs.rel === 'canonical')).toHaveLength(1)
    expect(headChildren.find((el) => el.attrs.rel === 'canonical')?.attrs.href).toBe(
      'https://moklu.app/ko/merge-images',
    )
    expect(headChildren.filter((el) => el.attrs.rel === 'alternate')).toHaveLength(5)
    expect(headChildren.filter((el) => el.attrs.type === 'application/ld+json')).toHaveLength(3)
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
      expect(headerHtml).toContain('Moklu')
      expect(headerHtml).toContain(`href="${buildLocalizedPath(route.locale, 'studio')}"`)
      expect(sectionsHtml).toContain(escapeHtml(copy.steps[0].title))
      expect(sectionsHtml).toContain(escapeHtml(copy.faqs[0].question))
      expect(footerHtml).toMatch(/hreflang="en"/i)
      expect(footerHtml).toMatch(/hreflang="zh"/i)
      expect(footerHtml).toMatch(/hreflang="ja"/i)
      expect(footerHtml).toMatch(/hreflang="ko"/i)
    }
  })
})

describe('Build-time SSG prerenderer, sitemap.xml, robots.txt, and CSP safety', () => {
  const SAMPLE_DIST_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Moklu — Screenshot & Mockup Studio</title>
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
    expect(rendered).toContain('<link rel="canonical" href="https://moklu.app/ja/merge-images" />')
    expect(rendered).toContain('hreflang="x-default" href="https://moklu.app/merge-images"')
    expect(rendered).toContain(copy.h1)
    expect(rendered).toContain(copy.faqs[0].question)
    expect(rendered).toContain('data-testid="tool-landing-page"')
    expect(rendered).toContain('data-testid="quick-workspace"')
    expect(rendered).not.toContain('data-ssg-shell')
    expect(rendered).toContain('<script type="module" crossorigin src="/assets/index-abc123.js"></script>')

    // Strict CSP check: EVERY <script> tag must either have src= or type="application/ld+json"
    const scriptTags = [...rendered.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1])
    expect(scriptTags.length).toBe(4) // 1 Vite module bundle + 3 JSON-LD blocks
    for (const attrs of scriptTags) {
      const isExternal = /\bsrc="/i.test(attrs)
      const isJsonLd = /\btype="application\/ld\+json"/i.test(attrs)
      expect(isExternal || isJsonLd).toBe(true)
    }

    // Studio routes emit a styled dark skeleton without loading Konva
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

    // Re-rendering an already prerendered page stays idempotent
    const rerendered = renderRouteHtml(rendered, route, 'https://moklu.app', markup)
    expect(rerendered.match(/<link rel="canonical"/g)?.length).toBe(1)
    expect(rerendered.match(/data-testid="tool-landing-page"/g)?.length).toBe(1)
  })

  it('executes scripts/prerender-seo.mjs via Node ESM and writes all 76 static HTML files, sitemap.xml, and robots.txt', async () => {
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
      }

      expect(report.ok).toBe(true)
      expect(report.siteUrl).toBe('https://moklu.app')
      expect(report.routesWritten).toBe(76)
      expect(report.sitemapUrls).toBe(76)

      // Spot-check key static route paths
      const spotChecks = [
        { route: resolvePathname('/'), expectedRel: 'index.html' },
        { route: resolvePathname('/merge-images'), expectedRel: path.join('merge-images', 'index.html') },
        { route: resolvePathname('/studio'), expectedRel: path.join('studio', 'index.html') },
        { route: resolvePathname('/zh'), expectedRel: path.join('zh', 'index.html') },
        { route: resolvePathname('/zh/id-card-watermark'), expectedRel: path.join('zh', 'id-card-watermark', 'index.html') },
        { route: resolvePathname('/ko/browser-mockup'), expectedRel: path.join('ko', 'browser-mockup', 'index.html') },
      ]

      for (const { route, expectedRel } of spotChecks) {
        const outPath = path.join(tmpDir, ...getRouteRelativeHtmlPath(route))
        expect(outPath).toBe(path.join(tmpDir, expectedRel))
        const html = await readFile(outPath, 'utf8')
        expect(html).toContain(`<html lang="${route.locale}"`)
        expect(html).toContain(escapeHtml(getRouteCopy(route.locale, route.slug).h1))
        expect(html).not.toContain('data-ssg-shell')
        if (route.isStudio) {
          expect(html).toContain('data-testid="studio-ssg-skeleton"')
        } else {
          expect(html).toContain('data-testid="tool-landing-page"')
          expect(html).toContain('data-testid="quick-workspace"')
        }
      }

      const sitemap = await readFile(path.join(tmpDir, 'sitemap.xml'), 'utf8')
      expect(sitemap).toBe(generateSitemapXml('https://moklu.app', '2026-11-23'))
      expect(sitemap.match(/<url>/g)?.length).toBe(76)
      expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/id-card-watermark</loc>')

      const robots = await readFile(path.join(tmpDir, 'robots.txt'), 'utf8')
      expect(robots).toBe(generateRobotsTxt('https://moklu.app'))
      expect(robots).toContain('Sitemap: https://moklu.app/sitemap.xml')
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }, 30_000)
})
