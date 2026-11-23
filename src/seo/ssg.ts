/**
 * [INPUT]: depends on ResolvedRoute from ./types.ts; depends on ALL_ROUTES, TOOL_ROUTE_DEFINITIONS, buildCanonicalUrl, buildLocalizedPath, getHreflangLinks, getRelatedRoutes, and getSiteUrl from ./routes.ts; depends on SUPPORTED_LOCALES, getOgLocale, getRouteCopy, and getUiLabels from ./i18n.ts; depends on buildRouteSchemaList and serializeJsonLd from ./schema.ts
 * [OUTPUT]: exports escapeHtml, getRouteRelativeHtmlPath, renderSsgShell, renderRouteHtml, generateSitemapXml, and generateRobotsTxt
 * [POS]: pure, Node-agnostic SSG HTML/XML string generator within src/seo, executed at build time by scripts/prerender-seo.mjs and unit-tested directly by src/seo/seo.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute } from './types.ts'
import {
  ALL_ROUTES,
  TOOL_ROUTE_DEFINITIONS,
  buildCanonicalUrl,
  buildLocalizedPath,
  getHreflangLinks,
  getRelatedRoutes,
  getSiteUrl,
} from './routes.ts'
import {
  SUPPORTED_LOCALES,
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

export function renderSsgShell(route: ResolvedRoute): string {
  const ui = getUiLabels(route.locale)
  const copy = getRouteCopy(route.locale, route.slug)
  const homeHref = buildLocalizedPath(route.locale, '')
  const studioHref = buildLocalizedPath(route.locale, 'studio')
  const related = getRelatedRoutes(route.slug, route.locale)

  const stepsHtml = copy.steps
    .map(
      (step, idx) =>
        `<li id="step-${idx + 1}"><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`,
    )
    .join('')

  const highlightsHtml = copy.highlights
    .map(
      (item) =>
        `<li><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></li>`,
    )
    .join('')

  const faqsHtml = copy.faqs
    .map(
      (faq) =>
        `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`,
    )
    .join('')

  const relatedHtml = related
    .map((rel) => {
      const relCopy = getRouteCopy(rel.locale, rel.slug)
      return `<li><a href="${escapeHtml(rel.path)}">${escapeHtml(relCopy.navLabel)}</a></li>`
    })
    .join('')

  const directoryHtml = TOOL_ROUTE_DEFINITIONS.map((def) => {
    const href = buildLocalizedPath(route.locale, def.slug)
    const itemCopy = getRouteCopy(route.locale, def.slug)
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(itemCopy.navLabel)}</a></li>`
  }).join('')

  const localeLinksHtml = SUPPORTED_LOCALES.map((loc) => {
    const href = buildLocalizedPath(loc.code, route.slug)
    return `<a href="${escapeHtml(href)}" hreflang="${escapeHtml(loc.code)}">${escapeHtml(loc.nativeName)}</a>`
  }).join(' ')

  return [
    '<!--moklu-ssg:start-->',
    `<div data-ssg-shell="true" lang="${escapeHtml(route.locale)}">`,
    `<header><a href="${escapeHtml(homeHref)}">${escapeHtml(ui.brandName)}</a> <a href="${escapeHtml(studioHref)}">${escapeHtml(ui.openStudio)}</a></header>`,
    '<main>',
    `<p>${escapeHtml(copy.badge)}</p>`,
    `<h1>${escapeHtml(copy.h1)}</h1>`,
    `<p>${escapeHtml(copy.subtitle)}</p>`,
    `<p>${escapeHtml(ui.privacyBannerTitle)} — ${escapeHtml(ui.privacyBannerDescription)}</p>`,
    `<section><h2>${escapeHtml(ui.howToHeading)}</h2><ol>${stepsHtml}</ol></section>`,
    `<section><h2>${escapeHtml(ui.highlightsHeading)}</h2><ul>${highlightsHtml}</ul></section>`,
    `<section><h2>${escapeHtml(ui.faqHeading)}</h2><dl>${faqsHtml}</dl></section>`,
    `<nav aria-label="${escapeHtml(ui.relatedToolsHeading)}"><ul>${relatedHtml}</ul></nav>`,
    `<nav aria-label="${escapeHtml(ui.directoryHeading)}"><ul>${directoryHtml}</ul></nav>`,
    '</main>',
    `<footer><nav aria-label="${escapeHtml(ui.footerLanguages)}">${localeLinksHtml}</nav></footer>`,
    '</div>',
    '<!--moklu-ssg:end-->',
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
): string {
  let html = templateHtml.replace(
    /<html\b[^>]*>/i,
    `<html lang="${escapeHtml(route.locale)}">`,
  )

  html = stripManagedHeadTags(html)
  const headTags = buildHeadTags(route, siteUrl)
  html = html.replace(/<\/head>/i, `${headTags}\n  </head>`)

  const shell = renderSsgShell(route)
  const markerPattern = /<!--moklu-ssg:start-->[\s\S]*?<!--moklu-ssg:end-->/i
  const emptyRootPattern = /<div\s+id="root">\s*<\/div>/i

  if (markerPattern.test(html)) {
    html = html.replace(markerPattern, shell)
  } else if (emptyRootPattern.test(html)) {
    html = html.replace(emptyRootPattern, `<div id="root">\n${shell}\n    </div>`)
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
