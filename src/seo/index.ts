/**
 * [INPUT]: depends on types, routes, i18n, schema, useSeoHead, quickFacts, InfoPageContent, SiteHeader, SeoLandingSections, and SiteFooter within src/seo
 * [OUTPUT]: re-exports the complete public SEO, i18n, schema, head-management, Quick Facts, trust info page, and UI chrome API for src/App.tsx and src/pages/*
 * [POS]: sole external entry barrel for the src/seo module
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type {
  LocaleCode,
  HtmlLangCode,
  HreflangCode,
  ToolId,
  RouteCategory,
  InfoPageSlug,
  RouteSlug,
  SecondaryToolSlug,
  GrowthRouteSlug,
  RoutePreset,
  RouteDefinition,
  ResolvedRoute,
  HreflangLink,
  HowToStepCopy,
  HighlightCopy,
  FaqItemCopy,
  RouteCopy,
  UiLabels,
  LocaleBundle,
} from './types.ts'

export {
  DEFAULT_SITE_URL,
  DEFAULT_LOCALE,
  LOCALE_CODES,
  PRIMARY_TOOL_SLUGS,
  ROUTE_DEFINITIONS,
  ROUTE_SLUGS,
  TOOL_ROUTE_DEFINITIONS,
  INFO_ROUTE_DEFINITIONS,
  ALL_ROUTES,
  getHtmlLang,
  getHreflangCode,
  isLocaleCode,
  isRouteSlug,
  getSiteUrl,
  getRouteDefinition,
  buildLocalizedPath,
  buildCanonicalUrl,
  getHreflangLinks,
  resolvePathname,
  getRelatedRoutes,
} from './routes.ts'

export {
  LOCALE_BUNDLES,
  SUPPORTED_LOCALES,
  getLocaleBundle,
  getUiLabels,
  getRouteCopy,
  getOgLocale,
} from './i18n.ts'

export type {
  ApplicationCategory,
  OrganizationSchema,
  WebSiteSchema,
  BreadcrumbListSchema,
  WebPageSchema,
  WebApplicationSchema,
  HowToSchema,
  FaqPageSchema,
  RouteStructuredData,
} from './schema.ts'

export {
  MOKLU_GITHUB_URL,
  resolveApplicationCategory,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbListSchema,
  buildWebPageSchema,
  buildWebApplicationSchema,
  buildHowToSchema,
  buildFaqPageSchema,
  buildRouteSchemas,
  buildRouteSchemaList,
  serializeJsonLd,
} from './schema.ts'

export { applySeoHead, useSeoHead } from './useSeoHead.ts'

export type { QuickFactItem, ToolQuickFacts } from './quickFacts.ts'
export { getToolQuickFacts } from './quickFacts.ts'

export type { InfoPageContentProps } from './InfoPageContent.tsx'
export { InfoPageContent } from './InfoPageContent.tsx'

export type { SiteHeaderProps } from './SiteHeader.tsx'
export { SiteHeader } from './SiteHeader.tsx'

export type { SeoLandingSectionsProps } from './SeoLandingSections.tsx'
export { SeoLandingSections } from './SeoLandingSections.tsx'

export type { SiteFooterProps } from './SiteFooter.tsx'
export { SiteFooter } from './SiteFooter.tsx'
