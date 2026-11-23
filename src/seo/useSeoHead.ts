/**
 * [INPUT]: depends on useEffect from react; depends on ResolvedRoute from ./types.ts; depends on buildCanonicalUrl, getHreflangLinks, and getSiteUrl from ./routes.ts; depends on getOgLocale and getRouteCopy from ./i18n.ts; depends on buildRouteSchemaList and serializeJsonLd from ./schema.ts
 * [OUTPUT]: exports applySeoHead and useSeoHead
 * [POS]: runtime document <head> synchronizer within src/seo, updating title, lang, meta, canonical, OG/Twitter tags, hreflang alternates, and JSON-LD scripts on SPA navigation
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEffect } from 'react'
import type { ResolvedRoute } from './types.ts'
import { buildCanonicalUrl, getHreflangLinks, getSiteUrl } from './routes.ts'
import { getOgLocale, getRouteCopy } from './i18n.ts'
import { buildRouteSchemaList, serializeJsonLd } from './schema.ts'

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
  const canonicalUrl = buildCanonicalUrl(route.locale, route.slug, base)
  const ogImage = `${base}/logo.svg`
  const ogLocale = getOgLocale(route.locale)

  doc.documentElement.lang = route.locale
  doc.title = copy.title

  // Primary meta
  upsertMeta(doc, 'name', 'description', copy.metaDescription)
  upsertMeta(doc, 'name', 'robots', route.isFallback ? 'noindex, follow' : 'index, follow')
  upsertCanonical(doc, canonicalUrl)

  // Open Graph
  upsertMeta(doc, 'property', 'og:type', 'website')
  upsertMeta(doc, 'property', 'og:site_name', 'Moklu')
  upsertMeta(doc, 'property', 'og:locale', ogLocale)
  upsertMeta(doc, 'property', 'og:url', canonicalUrl)
  upsertMeta(doc, 'property', 'og:title', copy.title)
  upsertMeta(doc, 'property', 'og:description', copy.metaDescription)
  upsertMeta(doc, 'property', 'og:image', ogImage)

  // Twitter / X Card
  upsertMeta(doc, 'name', 'twitter:card', 'summary_large_image')
  upsertMeta(doc, 'name', 'twitter:title', copy.title)
  upsertMeta(doc, 'name', 'twitter:description', copy.metaDescription)
  upsertMeta(doc, 'name', 'twitter:image', ogImage)

  // Alternate hreflang links
  replaceManagedNodes(doc, 'link[rel="alternate"][hreflang]')
  for (const alt of getHreflangLinks(route.slug, base)) {
    const link = doc.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', alt.hreflang)
    link.setAttribute('href', alt.href)
    link.setAttribute(MANAGED_ATTR, 'hreflang')
    doc.head.appendChild(link)
  }

  // Structured data JSON-LD scripts (CSP-safe: type="application/ld+json" is non-executable data)
  replaceManagedNodes(doc, `script[type="application/ld+json"][${MANAGED_ATTR}]`)
  const schemas = buildRouteSchemaList(route, base)
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
