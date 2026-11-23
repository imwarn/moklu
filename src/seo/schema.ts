/**
 * [INPUT]: depends on ResolvedRoute and RouteCopy from ./types.ts; depends on buildCanonicalUrl and getSiteUrl from ./routes.ts; depends on getRouteCopy from ./i18n.ts
 * [OUTPUT]: exports WebApplicationSchema, HowToSchema, FaqPageSchema, RouteStructuredData, buildWebApplicationSchema, buildHowToSchema, buildFaqPageSchema, buildRouteSchemas, buildRouteSchemaList, and serializeJsonLd
 * [POS]: pure Schema.org JSON-LD generator within src/seo, shared identically between client-side useSeoHead.ts and build-time scripts/prerender-seo.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute, RouteCopy } from './types.ts'
import { buildCanonicalUrl, getSiteUrl } from './routes.ts'
import { getRouteCopy } from './i18n.ts'

export interface WebApplicationSchema {
  '@context': 'https://schema.org'
  '@type': 'WebApplication'
  name: string
  alternateName: string
  url: string
  description: string
  applicationCategory: 'DesignApplication'
  operatingSystem: 'Any'
  browserRequirements: string
  inLanguage: string
  isAccessibleForFree: true
  offers: {
    '@type': 'Offer'
    price: '0'
    priceCurrency: 'USD'
  }
  featureList: string[]
  image: string
  publisher: {
    '@type': 'Organization'
    name: 'Moklu'
    url: string
  }
}

export interface HowToSchema {
  '@context': 'https://schema.org'
  '@type': 'HowTo'
  name: string
  description: string
  inLanguage: string
  totalTime: string
  tool: {
    '@type': 'HowToTool'
    name: string
  }
  step: Array<{
    '@type': 'HowToStep'
    position: number
    name: string
    text: string
    url: string
  }>
}

export interface FaqPageSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  inLanguage: string
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

export interface RouteStructuredData {
  webApplication: WebApplicationSchema
  howTo: HowToSchema
  faqPage: FaqPageSchema
}

export function buildWebApplicationSchema(
  route: ResolvedRoute,
  copy: RouteCopy = getRouteCopy(route.locale, route.slug),
  siteUrl?: string,
): WebApplicationSchema {
  const base = getSiteUrl(siteUrl)
  const canonicalUrl = buildCanonicalUrl(route.locale, route.slug, base)

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: copy.h1,
    alternateName: `Moklu — ${copy.navLabel}`,
    url: canonicalUrl,
    description: copy.metaDescription,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires modern HTML5 Canvas browser with JavaScript enabled',
    inLanguage: route.locale,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: copy.highlights.map((item) => `${item.title}: ${item.description}`),
    image: `${base}/logo.svg`,
    publisher: {
      '@type': 'Organization',
      name: 'Moklu',
      url: `${base}/`,
    },
  }
}

export function buildHowToSchema(
  route: ResolvedRoute,
  copy: RouteCopy = getRouteCopy(route.locale, route.slug),
  siteUrl?: string,
): HowToSchema {
  const canonicalUrl = buildCanonicalUrl(route.locale, route.slug, siteUrl)

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: copy.h1,
    description: copy.subtitle,
    inLanguage: route.locale,
    totalTime: 'PT1M',
    tool: {
      '@type': 'HowToTool',
      name: `Moklu ${copy.navLabel}`,
    },
    step: copy.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
      url: `${canonicalUrl}#step-${index + 1}`,
    })),
  }
}

export function buildFaqPageSchema(
  route: ResolvedRoute,
  copy: RouteCopy = getRouteCopy(route.locale, route.slug),
): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: route.locale,
    mainEntity: copy.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildRouteSchemas(
  route: ResolvedRoute,
  siteUrl?: string,
): RouteStructuredData {
  const copy = getRouteCopy(route.locale, route.slug)
  return {
    webApplication: buildWebApplicationSchema(route, copy, siteUrl),
    howTo: buildHowToSchema(route, copy, siteUrl),
    faqPage: buildFaqPageSchema(route, copy),
  }
}

export function buildRouteSchemaList(
  route: ResolvedRoute,
  siteUrl?: string,
): readonly [WebApplicationSchema, HowToSchema, FaqPageSchema] {
  const schemas = buildRouteSchemas(route, siteUrl)
  return [schemas.webApplication, schemas.howTo, schemas.faqPage] as const
}

/** Escape `<` so JSON-LD payloads can never prematurely close a `<script>` tag. */
export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
