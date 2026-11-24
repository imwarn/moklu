/**
 * [INPUT]: depends on ResolvedRoute and RouteSlug from ./types.ts; depends on ALL_ROUTES, INFO_ROUTE_DEFINITIONS, LOCALE_CODES, TOOL_ROUTE_DEFINITIONS, buildCanonicalUrl, buildLocalizedPath, getHreflangLinks, getHtmlLang, and getSiteUrl from ./routes.ts; depends on getLocaleBundle, getOgLocale, getRouteCopy, and getUiLabels from ./i18n.ts; depends on MOKLU_GITHUB_URL, buildRouteSchemaList, and serializeJsonLd from ./schema.ts
 * [OUTPUT]: exports escapeHtml, getRouteRelativeHtmlPath, renderStudioSkeleton, renderRouteHtml, generateSitemapXml, generateRobotsTxt, and generateLlmsTxt
 * [POS]: pure, Node-agnostic SSG HTML/XML/Markdown string generator within src/seo, executed at build time by scripts/prerender-seo.mjs with rendered React markup and unit-tested by src/seo/seo.test.ts and src/seo/geo.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute, RouteSlug } from './types.ts'
import {
  ALL_ROUTES,
  INFO_ROUTE_DEFINITIONS,
  LOCALE_CODES,
  TOOL_ROUTE_DEFINITIONS,
  buildCanonicalUrl,
  buildLocalizedPath,
  getHreflangLinks,
  getHtmlLang,
  getSiteUrl,
} from './routes.ts'
import {
  getLocaleBundle,
  getOgLocale,
  getRouteCopy,
  getUiLabels,
} from './i18n.ts'
import { MOKLU_GITHUB_URL, buildRouteSchemaList, serializeJsonLd } from './schema.ts'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Relative POSIX output segments inside dist/, e.g. ['index.html'] or ['zh', 'merge-images', 'index.html']. */
export function getRouteRelativeHtmlPath(route: ResolvedRoute): readonly string[] {
  const segments = route.path.split('/').filter(Boolean)
  if (segments.length === 0) {
    return ['index.html']
  }
  return [...segments, 'index.html']
}

/**
 * Styled dark Neutral Zinc Studio topbar and canvas skeleton for the 4 `/studio`
 * routes so Konva never executes in Node while initial paint matches StudioPage.
 */
export function renderStudioSkeleton(route: ResolvedRoute): string {
  const ui = getUiLabels(route.locale)
  const copy = getRouteCopy(route.locale, route.slug)
  const homeHref = buildLocalizedPath(route.locale, '')

  return [
    '<div data-testid="studio-ssg-skeleton" class="w-screen h-[100dvh] flex flex-col overflow-hidden bg-surface text-zinc-100">',
    '  <header class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-panel px-3">',
    '    <div class="flex items-center gap-3">',
    `      <a href="${escapeHtml(homeHref)}" class="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-zinc-300">← Tools</a>`,
    `      <span class="text-sm font-semibold tracking-tight text-white">${escapeHtml(ui.brandName)} <span class="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted">Studio</span></span>`,
    '    </div>',
    '    <span class="text-xs text-muted">Loading Moklu Studio…</span>',
    '  </header>',
    '  <div class="flex min-w-0 flex-1 overflow-hidden">',
    '    <aside aria-hidden="true" class="hidden w-56 shrink-0 border-r border-border bg-panel lg:block"></aside>',
    '    <main class="flex flex-1 flex-col items-center justify-center bg-surface px-6 text-center">',
    `      <h1 class="text-lg font-semibold tracking-tight text-zinc-100">${escapeHtml(copy.h1)}</h1>`,
    `      <p class="mt-2 max-w-md text-xs text-muted">${escapeHtml(copy.subtitle)}</p>`,
    '    </main>',
    '    <aside aria-hidden="true" class="hidden w-72 shrink-0 border-l border-border bg-panel lg:block"></aside>',
    '  </div>',
    '</div>',
  ].join('\n')
}

function stripManagedHeadTags(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name="(?:description|robots|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"[^>]*>\s*/gi, '')
    .replace(/<script\s+type="application\/ld\+json"[^>]*data-moklu-seo="jsonld"[^>]*>[\s\S]*?<\/script>\s*/gi, '')
}

function buildHeadTags(route: ResolvedRoute, siteUrl?: string): string {
  const base = getSiteUrl(siteUrl)
  const copy = getRouteCopy(route.locale, route.slug)
  const canonicalUrl = buildCanonicalUrl(route.locale, route.slug, base)
  const ogImage = `${base}/og-image.png`
  const ogLocale = getOgLocale(route.locale)
  const hreflangs = getHreflangLinks(route.slug, base)
  const schemas = buildRouteSchemaList(route, base)

  const lines = [
    `<title>${escapeHtml(copy.title)}</title>`,
    `<meta name="description" content="${escapeHtml(copy.metaDescription)}" />`,
    '<meta name="robots" content="index, follow" />',
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    ...hreflangs.map(
      (alt) =>
        `<link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}" data-moklu-seo="hreflang" />`,
    ),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Moklu" />',
    `<meta property="og:locale" content="${escapeHtml(ogLocale)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(copy.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(copy.metaDescription)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(copy.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(copy.metaDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    ...schemas.map(
      (schema) =>
        `<script type="application/ld+json" data-moklu-seo="jsonld">${serializeJsonLd(schema)}</script>`,
    ),
  ]

  return lines.map((line) => `    ${line}`).join('\n')
}

export function renderRouteHtml(
  templateHtml: string,
  route: ResolvedRoute,
  siteUrl?: string,
  bodyHtml?: string,
): string {
  const themeAttr = route.isStudio ? 'dark' : 'light'
  const surfaceAttr = route.isStudio ? 'studio' : 'workspace'
  let html = templateHtml.replace(
    /<html\b[^>]*>/i,
    `<html lang="${escapeHtml(getHtmlLang(route.locale))}" data-theme="${themeAttr}" data-surface="${surfaceAttr}">`,
  )

  html = stripManagedHeadTags(html)
  const headTags = buildHeadTags(route, siteUrl)
  html = html.replace(/<\/head>/i, `${headTags}\n  </head>`)

  const innerMarkup = bodyHtml ?? renderStudioSkeleton(route)
  const wrapped = `<!--moklu-ssg:start-->${innerMarkup}<!--moklu-ssg:end-->`
  const markerPattern = /<!--moklu-ssg:start-->[\s\S]*?<!--moklu-ssg:end-->/i
  const emptyRootPattern = /<div\s+id="root">\s*<\/div>/i

  if (markerPattern.test(html)) {
    html = html.replace(markerPattern, () => wrapped)
  } else if (emptyRootPattern.test(html)) {
    html = html.replace(emptyRootPattern, () => `<div id="root">${wrapped}</div>`)
  } else {
    throw new Error('Expected <div id="root"></div> or SSG marker inside HTML template')
  }

  return html
}

export function generateSitemapXml(
  siteUrl?: string,
  lastmod = new Date().toISOString().slice(0, 10),
): string {
  const base = getSiteUrl(siteUrl)

  const urlNodes = ALL_ROUTES.map((route) => {
    const loc = buildCanonicalUrl(route.locale, route.slug, base)
    const alternates = getHreflangLinks(route.slug, base)
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}" />`,
      )
      .join('\n')

    return [
      '  <url>',
      `    <loc>${escapeHtml(loc)}</loc>`,
      `    <lastmod>${escapeHtml(lastmod)}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${route.priority.toFixed(2)}</priority>`,
      alternates,
      '  </url>',
    ].join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urlNodes,
    '</urlset>',
    '',
  ].join('\n')
}

export function generateRobotsTxt(siteUrl?: string): string {
  const base = getSiteUrl(siteUrl)
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
}

export function generateLlmsTxt(siteUrl?: string): string {
  const base = getSiteUrl(siteUrl)
  const coreSlugs: readonly RouteSlug[] = [
    '',
    ...TOOL_ROUTE_DEFINITIONS.map((def) => def.slug),
    'studio',
  ]
  const infoSlugs: readonly RouteSlug[] = INFO_ROUTE_DEFINITIONS.map((def) => def.slug)

  const lines: string[] = [
    '# Moklu',
    '',
    `> Moklu (${base}/) is an open-source, 100% browser-local screenshot mockup studio and online image toolkit supporting English, Simplified Chinese (在线图片拼接 / 截图套壳), Japanese, and Korean. Every image operation runs directly in client-side HTML5 Canvas with zero server uploads and zero forced watermarks.`,
    '',
    '## Core Capabilities & Boundaries',
    '',
    '- Privacy architecture: 100% client-side HTML5 Canvas processing; zero image bytes leave the user device; works offline once loaded.',
    '- Pricing & watermarks: All six core browser tools and standard exports are free with zero watermarks.',
    '- Online Image Merger (在线图片拼接): Horizontal side-by-side, vertical long stitching, and 2 to 6 column grid layouts (cover/contain fit, 1:1 / 4:3 / 3:4 / auto ratios), match-min / match-max / original (start/center/end) alignment, drag-and-drop reorder, Reverse order, per-image 90-degree rotation, gap (0 to 64px), padding (0 to 80px), radius (0 to 48px), per-image borders (0 to 24px), custom color picker, 1-click Copy to Clipboard (PNG), and PNG / WebP / JPEG / single-page PDF 1.4 export (50% to 100% quality).',
    '- Screenshot Mockups & Studio: Chrome, Safari, Minimal browser frames, iPhone 16 Pro, Pixel 9, App Store 9:16 layouts, plus 1-click handoff to Moklu Studio (Konva multi-layer canvas editor).',
    '- Carousel & Grid Splitter, Local Batch Compressor/Converter (PNG/JPEG/WebP), Resizer/Cropper/Border Pad, and Offline ID Card A4 Watermark Maker (ISO/IEC 7810 ID-1 physical scale).',
    '- Explicit boundaries: No fixed photo count limit, with an 8192px / 64MP canvas safety ceiling (auto-scaled with visible UI notice). PDF export creates a single-page PDF 1.4 image sheet rather than merging multi-page PDF documents. Vertical stitching does not auto-remove overlapping scroll regions.',
    `- Open-source repository: ${MOKLU_GITHUB_URL} (MIT License)`,
    `- Sitemap: ${base}/sitemap.xml`,
    '',
  ]

  for (const locale of LOCALE_CODES) {
    const bundle = getLocaleBundle(locale)
    lines.push(`## ${bundle.nativeName} (${getHtmlLang(locale)})`)
    lines.push('')
    for (const slug of coreSlugs) {
      const copy = getRouteCopy(locale, slug)
      const url = buildCanonicalUrl(locale, slug, base)
      lines.push(`- [${copy.navLabel}](${url}): ${copy.metaDescription}`)
    }
    for (const slug of infoSlugs) {
      const copy = getRouteCopy(locale, slug)
      const url = buildCanonicalUrl(locale, slug, base)
      lines.push(`- [${copy.navLabel}](${url}): ${copy.metaDescription}`)
    }
    lines.push('')
  }

  return `${lines.join('\n').trimEnd()}\n`
}
