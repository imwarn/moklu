/**
 * [INPUT]: depends on useEffect from react; depends on ResolvedRoute from ./types.ts; depends on LOCALE_CODES, buildCanonicalUrl, getHreflangLinks, getHtmlLang, and getSiteUrl from ./routes.ts; depends on getOgLocale and getRouteCopy from ./i18n.ts; depends on getNotFoundCopy from ./notFoundCopy.ts; depends on buildOrganizationSchema, buildRouteSchemaList, buildWebSiteSchema, and serializeJsonLd from ./schema.ts
 * [OUTPUT]: exports applySeoHead and useSeoHead
 * [POS]: runtime document <head> synchronizer within src/seo, updating title, lang (`zh-CN`), meta, fallback 404 hygiene (removing canonical, og:url, hreflang, and og:locale:alternate while emitting Organization + WebSite JSON-LD only), and full OG/Twitter/hreflang/JSON-LD tags on indexable routes without node leaks
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEffect } from 'react'
import type { ResolvedRoute } from './types.ts'
import {
  LOCALE_CODES,
  buildCanonicalUrl,
  getHreflangLinks,
  getHtmlLang,
  getSiteUrl,
} from './routes.ts'
import { getOgLocale, getRouteCopy } from './i18n.ts'
import { getNotFoundCopy } from './notFoundCopy.ts'
import {
  buildOrganizationSchema,
  buildRouteSchemaList,
  buildWebSiteSchema,
  serializeJsonLd,
} from './schema.ts'

const MANAGED_ATTR = 'data-moklu-seo'

function upsertMeta(
  doc: Document,
  keyAttr: 'name' | 'property',
  keyValue: string,
  content: string,
): void {
  let meta = doc.head.querySelector(`meta[${keyAttr}="${keyValue}"]`) as HTMLMetaElement | null
  if (!meta) {
    meta = doc.createElement('meta')
    meta.setAttribute(keyAttr, keyValue)
    doc.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function upsertCanonical(doc: Document, href: string): void {
  let link = doc.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = doc.createElement('link')
    link.setAttribute('rel', 'canonical')
    doc.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function replaceManagedNodes(doc: Document, selector: string): void {
  const existing = doc.head.querySelectorAll(selector)
  existing.forEach((node) => node.remove())
}

export function applySeoHead(
  doc: Document,
  route: ResolvedRoute,
  siteUrl?: string,
): void {
  const base = getSiteUrl(siteUrl)
  const copy = getRouteCopy(route.locale, route.slug)
  const notFoundCopy = route.isFallback ? getNotFoundCopy(route.locale) : null
  const headTitle = notFoundCopy ? notFoundCopy.title : copy.title
  const headDescription = notFoundCopy ? notFoundCopy.metaDescription : copy.metaDescription
  const canonicalUrl = buildCanonicalUrl(route.locale, route.slug, base)
  const ogImage = `${base}/og-image.png`
  const ogLocale = getOgLocale(route.locale)

  doc.documentElement.lang = getHtmlLang(route.locale)
  doc.title = headTitle

  // Primary meta
  upsertMeta(doc, 'name', 'description', headDescription)
  upsertMeta(doc, 'name', 'robots', route.isFallback ? 'noindex, follow' : 'index, follow')
  if (route.isFallback) {
    doc.head.querySelector('link[rel="canonical"]')?.remove()
  } else {
    upsertCanonical(doc, canonicalUrl)
  }

  // Open Graph
  upsertMeta(doc, 'property', 'og:type', 'website')
  upsertMeta(doc, 'property', 'og:site_name', 'Moklu')
  upsertMeta(doc, 'property', 'og:locale', ogLocale)
  replaceManagedNodes(doc, 'meta[property="og:locale:alternate"]')
  if (!route.isFallback) {
    for (const altLocale of LOCALE_CODES) {
      if (altLocale === route.locale) continue
      const meta = doc.createElement('meta')
      meta.setAttribute('property', 'og:locale:alternate')
      meta.setAttribute('content', getOgLocale(altLocale))
      meta.setAttribute(MANAGED_ATTR, 'og-locale-alt')
      doc.head.appendChild(meta)
    }
    upsertMeta(doc, 'property', 'og:url', canonicalUrl)
  } else {
    doc.head.querySelector('meta[property="og:url"]')?.remove()
  }
  upsertMeta(doc, 'property', 'og:title', headTitle)
  upsertMeta(doc, 'property', 'og:description', headDescription)
  upsertMeta(doc, 'property', 'og:image', ogImage)
  upsertMeta(doc, 'property', 'og:image:width', '1200')
  upsertMeta(doc, 'property', 'og:image:height', '630')
  upsertMeta(doc, 'property', 'og:image:alt', headTitle)

  // Twitter / X Card
  upsertMeta(doc, 'name', 'twitter:card', 'summary_large_image')
  upsertMeta(doc, 'name', 'twitter:title', headTitle)
  upsertMeta(doc, 'name', 'twitter:description', headDescription)
  upsertMeta(doc, 'name', 'twitter:image', ogImage)
  upsertMeta(doc, 'name', 'twitter:image:alt', headTitle)

  // Alternate hreflang links
  replaceManagedNodes(doc, 'link[rel="alternate"][hreflang]')
  if (!route.isFallback) {
    for (const alt of getHreflangLinks(route.slug, base)) {
      const link = doc.createElement('link')
      link.setAttribute('rel', 'alternate')
      link.setAttribute('hreflang', alt.hreflang)
      link.setAttribute('href', alt.href)
      link.setAttribute(MANAGED_ATTR, 'hreflang')
      doc.head.appendChild(link)
    }
  }

  // Structured data JSON-LD scripts (CSP-safe: type="application/ld+json" is non-executable data)
  replaceManagedNodes(doc, `script[type="application/ld+json"][${MANAGED_ATTR}]`)
  const schemas = route.isFallback
    ? [buildOrganizationSchema(base), buildWebSiteSchema(route, base)]
    : buildRouteSchemaList(route, base)
  for (const schema of schemas) {
    const script = doc.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute(MANAGED_ATTR, 'jsonld')
    script.textContent = serializeJsonLd(schema)
    doc.head.appendChild(script)
  }
}

export function useSeoHead(route: ResolvedRoute, siteUrl?: string): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    applySeoHead(document, route, siteUrl)
  }, [route, siteUrl])
}
