/**
 * [INPUT]: depends on vitest, node:child_process, node:fs/promises, node:os, node:path, and node:util; depends on src/seo/* exports, ./ssg.ts, ./ssrEntry.ts, and scripts/prerender-seo.mjs
 * [OUTPUT]: automated integration test suite verifying build-time SSG HTML prerendering, 4-locale 404.html generation, 140-URL sitemap.xml, git lastmod resolution, robots.txt, llms.txt, and strict CSP zero-inline-script safety
 * [POS]: post-build SSG & artifact verification suite within src/seo alongside seo.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
  getNotFoundCopy,
  getRouteCopy,
  resolvePathname,
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

const execFileAsync = promisify(execFile)

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

  it('executes scripts/prerender-seo.mjs via Node ESM and writes all 140 static HTML files, sitemap.xml, robots.txt, and llms.txt', async () => {
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
        notFoundPath: string
        notFoundPaths: string[]
        llmsPath: string
      }

      expect(report.ok).toBe(true)
      expect(report.siteUrl).toBe('https://moklu.app')
      expect(report.routesWritten).toBe(140)
      expect(report.sitemapUrls).toBe(140)
      expect(report.notFoundPaths).toHaveLength(4)

      const spotChecks = [
        { route: resolvePathname('/'), expectedRel: 'index.html', expectedLang: 'en' },
        { route: resolvePathname('/merge-images'), expectedRel: path.join('merge-images', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/merge-photos-to-pdf'), expectedRel: path.join('merge-photos-to-pdf', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/heic-to-jpg'), expectedRel: path.join('heic-to-jpg', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/compress-image-to-200kb'), expectedRel: path.join('compress-image-to-200kb', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/redact-screenshot'), expectedRel: path.join('redact-screenshot', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/annotate-image'), expectedRel: path.join('annotate-image', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/draw-on-image'), expectedRel: path.join('draw-on-image', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/passport-photo-maker'), expectedRel: path.join('passport-photo-maker', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/studio'), expectedRel: path.join('studio', 'index.html'), expectedLang: 'en' },
        { route: resolvePathname('/zh'), expectedRel: path.join('zh', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/stitch-screenshots'), expectedRel: path.join('zh', 'stitch-screenshots', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/remove-exif'), expectedRel: path.join('zh', 'remove-exif', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/annotate-image'), expectedRel: path.join('zh', 'annotate-image', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/id-photo-background-changer'), expectedRel: path.join('zh', 'id-photo-background-changer', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/id-card-watermark'), expectedRel: path.join('zh', 'id-card-watermark', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/zh/privacy'), expectedRel: path.join('zh', 'privacy', 'index.html'), expectedLang: 'zh-CN' },
        { route: resolvePathname('/ja/ipad-mockup'), expectedRel: path.join('ja', 'ipad-mockup', 'index.html'), expectedLang: 'ja' },
        { route: resolvePathname('/ja/draw-on-image'), expectedRel: path.join('ja', 'draw-on-image', 'index.html'), expectedLang: 'ja' },
        { route: resolvePathname('/ja/id-photo-print-sheet'), expectedRel: path.join('ja', 'id-photo-print-sheet', 'index.html'), expectedLang: 'ja' },
        { route: resolvePathname('/ko/watch-mockup'), expectedRel: path.join('ko', 'watch-mockup', 'index.html'), expectedLang: 'ko' },
        { route: resolvePathname('/ko/browser-mockup'), expectedRel: path.join('ko', 'browser-mockup', 'index.html'), expectedLang: 'ko' },
        { route: resolvePathname('/ko/passport-photo-maker'), expectedRel: path.join('ko', 'passport-photo-maker', 'index.html'), expectedLang: 'ko' },
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
      expect(sitemap.match(/<url>/g)?.length).toBe(140)
      expect(sitemap).not.toContain('/404')
      expect(sitemap).not.toContain('<changefreq>')
      expect(sitemap).not.toContain('<priority>')

      const localizedNotFoundFiles = [
        { locale: 'en' as const, rel: '404.html', expectedLang: 'en' },
        { locale: 'zh' as const, rel: path.join('zh', '404.html'), expectedLang: 'zh-CN' },
        { locale: 'ja' as const, rel: path.join('ja', '404.html'), expectedLang: 'ja' },
        { locale: 'ko' as const, rel: path.join('ko', '404.html'), expectedLang: 'ko' },
      ]
      for (const { locale, rel, expectedLang } of localizedNotFoundFiles) {
        const notFoundHtml = await readFile(path.join(tmpDir, rel), 'utf8')
        const localizedNotFound = getNotFoundCopy(locale)
        expect(notFoundHtml).toContain(
          `<html lang="${expectedLang}" data-theme="light" data-surface="workspace">`,
        )
        expect(notFoundHtml).toContain(`<title>${escapeHtml(localizedNotFound.title)}</title>`)
        expect(notFoundHtml).toContain(escapeHtml(localizedNotFound.h1))
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
      }
      expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
      expect(sitemap).toContain('hreflang="zh-Hans"')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/id-card-watermark/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/privacy/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/merge-photos-to-pdf/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/heic-to-jpg/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/stitch-screenshots/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/ko/remove-exif/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/annotate-image/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/draw-on-image/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/annotate-image/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/passport-photo-maker/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/zh/id-photo-background-changer/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/ja/id-photo-print-sheet/</loc>')
      expect(sitemap).toContain('<loc>https://moklu.app/ko/passport-photo-maker/</loc>')
      for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        expect(match[1].endsWith('/'), `sitemap loc ${match[1]} must end with /`).toBe(true)
      }

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
      expect(Object.keys(gitLastmodRecord)).toHaveLength(140)
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
