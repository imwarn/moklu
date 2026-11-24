/**
 * [INPUT]: depends on ResolvedRoute, RouteCategory, and RouteCopy from ./types.ts; depends on buildCanonicalUrl, getHtmlLang, and getSiteUrl from ./routes.ts; depends on getRouteCopy from ./i18n.ts
 * [OUTPUT]: exports OrganizationSchema, WebSiteSchema, BreadcrumbListSchema, WebPageSchema, WebApplicationSchema, HowToSchema, FaqPageSchema, RouteStructuredData, buildOrganizationSchema, buildWebSiteSchema, buildBreadcrumbListSchema, buildWebPageSchema, buildWebApplicationSchema, buildHowToSchema, buildFaqPageSchema, buildRouteSchemas, buildRouteSchemaList, and serializeJsonLd
 * [POS]: pure Schema.org JSON-LD generator within src/seo, shared identically between client-side useSeoHead.ts and build-time scripts/prerender-seo.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute, RouteCategory, RouteCopy } from './types.ts'
import { buildCanonicalUrl, getHtmlLang, getSiteUrl } from './routes.ts'
import { getRouteCopy } from './i18n.ts'

export const MOKLU_GITHUB_URL = 'https://github.com/imwarn/moklu'

export type ApplicationCategory =
  | 'DesignApplication'
  | 'MultimediaApplication'
  | 'UtilitiesApplication'

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  '@id': string
  name: 'Moklu'
  url: string
  logo: string
  sameAs: readonly string[]
}

export interface WebSiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  '@id': string
  name: 'Moklu'
  url: string
  inLanguage: string
  publisher: {
    '@id': string
  }
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

export interface WebPageSchema {
  '@context': 'https://schema.org'
  '@type': 'WebPage'
  name: string
  url: string
  description: string
  inLanguage: string
  isPartOf: {
    '@id': string
  }
  publisher: {
    '@id': string
  }
}

export interface WebApplicationSchema {
  '@context': 'https://schema.org'
  '@type': 'WebApplication'
  name: string
  alternateName: string
  url: string
  description: string
  applicationCategory: ApplicationCategory
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
    '@id': string
    name: 'Moklu'
    url: string
    sameAs: readonly string[]
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
  organization: OrganizationSchema
  webSite: WebSiteSchema
  breadcrumbList: BreadcrumbListSchema
  webPage: WebPageSchema
  webApplication: WebApplicationSchema
  howTo: HowToSchema
  faqPage: FaqPageSchema
}

export function resolveApplicationCategory(category: RouteCategory): ApplicationCategory {
  if (category === 'id-card') return 'UtilitiesApplication'
  if (
    category === 'merge' ||
    category === 'split' ||
    category === 'compress' ||
    category === 'resize'
  ) {
    return 'MultimediaApplication'
  }
  return 'DesignApplication'
}

export function buildOrganizationSchema(siteUrl?: string): OrganizationSchema {
  const base = getSiteUrl(siteUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: 'Moklu',
    url: `${base}/`,
    logo: `${base}/apple-touch-icon.png`,
    sameAs: [MOKLU_GITHUB_URL],
  }
}

export function buildWebSiteSchema(
  route: ResolvedRoute,
  siteUrl?: string,
): WebSiteSchema {
  const base = getSiteUrl(siteUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: 'Moklu',
    url: `${base}/`,
    inLanguage: getHtmlLang(route.locale),
    publisher: {
      '@id': `${base}/#organization`,
    },
  }
}

export function buildBreadcrumbListSchema(
  route: ResolvedRoute,
  copy: RouteCopy = getRouteCopy(route.locale, route.slug),
  siteUrl?: string,
): BreadcrumbListSchema {
  const base = getSiteUrl(siteUrl)
  const homeUrl = buildCanonicalUrl(route.locale, '', base)
  const homeCopy = getRouteCopy(route.locale, '')

  const items: BreadcrumbListSchema['itemListElement'] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: homeCopy.navLabel,
      item: homeUrl,
    },
  ]

  if (route.slug !== '') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: copy.navLabel,
      item: buildCanonicalUrl(route.locale, route.slug, base),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

export function buildWebPageSchema(
  route: ResolvedRoute,
  copy: RouteCopy = getRouteCopy(route.locale, route.slug),
  siteUrl?: string,
): WebPageSchema {
  const base = getSiteUrl(siteUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.h1,
    url: buildCanonicalUrl(route.locale, route.slug, base),
    description: copy.metaDescription,
    inLanguage: getHtmlLang(route.locale),
    isPartOf: {
      '@id': `${base}/#website`,
    },
    publisher: {
      '@id': `${base}/#organization`,
    },
  }
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
    alternateName: `Moklu | ${copy.navLabel}`,
    url: canonicalUrl,
    description: copy.metaDescription,
    applicationCategory: resolveApplicationCategory(route.category),
    operatingSystem: 'Any',
    browserRequirements: 'Requires modern HTML5 Canvas browser with JavaScript enabled',
    inLanguage: getHtmlLang(route.locale),
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: copy.highlights.map((item) => `${item.title}: ${item.description}`),
    image: `${base}/og-image.png`,
    publisher: {
      '@type': 'Organization',
      '@id': `${base}/#organization`,
      name: 'Moklu',
      url: `${base}/`,
      sameAs: [MOKLU_GITHUB_URL],
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
    inLanguage: getHtmlLang(route.locale),
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
    inLanguage: getHtmlLang(route.locale),
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
    organization: buildOrganizationSchema(siteUrl),
    webSite: buildWebSiteSchema(route, siteUrl),
    breadcrumbList: buildBreadcrumbListSchema(route, copy, siteUrl),
    webPage: buildWebPageSchema(route, copy, siteUrl),
    webApplication: buildWebApplicationSchema(route, copy, siteUrl),
    howTo: buildHowToSchema(route, copy, siteUrl),
    faqPage: buildFaqPageSchema(route, copy),
  }
}

export function buildRouteSchemaList(
  route: ResolvedRoute,
  siteUrl?: string,
): readonly (
  | OrganizationSchema
  | WebSiteSchema
  | BreadcrumbListSchema
  | WebPageSchema
  | WebApplicationSchema
  | HowToSchema
  | FaqPageSchema
)[] {
  const schemas = buildRouteSchemas(route, siteUrl)
  if (route.isInfoPage) {
    return [
      schemas.organization,
      schemas.webSite,
      schemas.breadcrumbList,
      schemas.webPage,
      schemas.faqPage,
    ] as const
  }
  return [
    schemas.organization,
    schemas.webSite,
    schemas.breadcrumbList,
    schemas.webApplication,
    schemas.howTo,
    schemas.faqPage,
  ] as const
}

/** Escape `<` so JSON-LD payloads can never prematurely close a `<script>` tag. */
export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
