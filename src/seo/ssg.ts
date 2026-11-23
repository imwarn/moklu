/**
 * [INPUT]: depends on ResolvedRoute from ./types.ts; depends on ALL_ROUTES, buildCanonicalUrl, buildLocalizedPath, getHreflangLinks, and getSiteUrl from ./routes.ts; depends on getOgLocale, getRouteCopy, and getUiLabels from ./i18n.ts; depends on buildRouteSchemaList and serializeJsonLd from ./schema.ts
 * [OUTPUT]: exports escapeHtml, getRouteRelativeHtmlPath, renderStudioSkeleton, renderRouteHtml, generateSitemapXml, and generateRobotsTxt
 * [POS]: pure, Node-agnostic SSG HTML/XML string generator within src/seo, executed at build time by scripts/prerender-seo.mjs with rendered React markup and unit-tested by src/seo/seo.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute } from './types.ts'
import {
  ALL_ROUTES,
  buildCanonicalUrl,
  buildLocalizedPath,
  getHreflangLinks,
  getSiteUrl,
} from './routes.ts'
import {
  getOgLocale,
  getRouteCopy,
  getUiLabels,
} from './i18n.ts'
import { buildRouteSchemaList, serializeJsonLd } from './schema.ts'

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
  if (route.path === '/') {
    return ['index.html']
  }
  return [...route.path.replace(/^\/+/, '').split('/'), 'index.html']
}

/**
 * Styled dark `#0f0f13` Studio topbar and canvas skeleton for the 4 `/studio`
 * routes so Konva never executes in Node while initial paint matches StudioPage.
 */
export function renderStudioSkeleton(route: ResolvedRoute): string {
  const ui = getUiLabels(route.locale)
  const copy = getRouteCopy(route.locale, route.slug)
  const homeHref = buildLocalizedPath(route.locale, '')

  return [
    '<div data-testid="studio-ssg-skeleton" class="w-screen h-screen flex flex-col overflow-hidden bg-[#0f0f13] text-[#e8e8f0]">',
    '  <header class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#18181f] px-3">',
    '    <div class="flex items-center gap-3">',
    `      <a href="${escapeHtml(homeHref)}" class="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-[#b8b8c8]">← Tools</a>`,
    `      <span class="text-sm font-semibold tracking-tight text-white">${escapeHtml(ui.brandName)} <span class="ml-1 text-[10px] font-medium uppercase tracking-widest text-[#8f8fa3]">Studio</span></span>`,
    '    </div>',
    '    <span class="text-xs text-[#8f8fa3]">Loading Moklu Studio…</span>',
    '  </header>',
    '  <div class="flex min-w-0 flex-1 overflow-hidden">',
    '    <aside aria-hidden="true" class="hidden w-56 shrink-0 border-r border-white/10 bg-[#14141b] lg:block"></aside>',
    '    <main class="flex flex-1 flex-col items-center justify-center bg-[#111118] px-6 text-center">',
    `      <h1 class="text-lg font-semibold tracking-tight text-zinc-100">${escapeHtml(copy.h1)}</h1>`,
    `      <p class="mt-2 max-w-md text-xs text-zinc-400">${escapeHtml(copy.subtitle)}</p>`,
    '    </main>',
    '    <aside aria-hidden="true" class="hidden w-72 shrink-0 border-l border-white/10 bg-[#14141b] lg:block"></aside>',
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
  const ogImage = `${base}/logo.svg`
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
    `<html lang="${escapeHtml(route.locale)}" data-theme="${themeAttr}" data-surface="${surfaceAttr}">`,
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
