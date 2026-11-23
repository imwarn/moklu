/**
 * [INPUT]: none (leaf domain contract for the SEO, i18n, and SSG subsystem)
 * [OUTPUT]: exports LocaleCode, ToolId, RouteSlug, RoutePreset, RouteDefinition, ResolvedRoute, HreflangLink, RouteCopy, UiLabels, and LocaleBundle types
 * [POS]: foundational type contract within src/seo, imported by routes.ts, locales/*.ts, i18n.ts, schema.ts, useSeoHead.ts, UI chrome, and prerender-seo.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type LocaleCode = 'en' | 'zh' | 'ja' | 'ko'

export type ToolId = 'mockup' | 'merge' | 'split' | 'compress' | 'resize' | 'id-card'

export type RouteCategory = 'hub' | 'studio' | ToolId

export type RouteSlug =
  | ''
  | 'studio'
  | 'browser-mockup'
  | 'iphone-mockup'
  | 'device-mockup'
  | 'app-store-screenshots'
  | 'merge-images'
  | 'combine-photos-side-by-side'
  | 'stitch-images-vertically'
  | 'photo-collage-grid'
  | 'carousel-splitter'
  | 'image-grid-splitter'
  | 'compress-image'
  | 'convert-image-format'
  | 'png-to-webp'
  | 'resize-image'
  | 'crop-image'
  | 'add-border-to-photo'
  | 'id-card-watermark'

export type SecondaryToolSlug = Extract<
  RouteSlug,
  | 'carousel-splitter'
  | 'image-grid-splitter'
  | 'compress-image'
  | 'convert-image-format'
  | 'png-to-webp'
  | 'resize-image'
  | 'crop-image'
  | 'add-border-to-photo'
  | 'id-card-watermark'
>

export interface RoutePreset {
  tool: ToolId
  mockupModel?: string
  canvasSize?: string
  mergeDirection?: 'horizontal' | 'vertical' | 'grid'
  splitMode?: 'carousel' | 'grid'
  targetFormat?: 'image/png' | 'image/jpeg' | 'image/webp'
  resizeMode?: 'resize' | 'crop' | 'pad'
}

export interface RouteDefinition {
  slug: RouteSlug
  category: RouteCategory
  isStudio: boolean
  priority: number
  preset: RoutePreset
  relatedSlugs: readonly RouteSlug[]
}

export interface ResolvedRoute {
  locale: LocaleCode
  slug: RouteSlug
  path: string
  category: RouteCategory
  isStudio: boolean
  isFallback: boolean
  priority: number
  preset: RoutePreset
  tool: ToolId
  relatedSlugs: readonly RouteSlug[]
}

export interface HreflangLink {
  hreflang: LocaleCode | 'x-default'
  href: string
}

export interface HowToStepCopy {
  title: string
  description: string
}

export interface HighlightCopy {
  title: string
  description: string
}

export interface FaqItemCopy {
  question: string
  answer: string
}

export interface RouteCopy {
  navLabel: string
  title: string
  metaDescription: string
  badge: string
  h1: string
  subtitle: string
  steps: readonly [HowToStepCopy, HowToStepCopy, HowToStepCopy]
  highlights: readonly [HighlightCopy, HighlightCopy, HighlightCopy]
  faqs: readonly [FaqItemCopy, FaqItemCopy, FaqItemCopy, FaqItemCopy]
}

export interface UiLabels {
  brandName: string
  brandTagline: string
  skipToContent: string
  openStudio: string
  openStudioShort: string
  openInStudioCta: string
  proBadge: string
  proUpgrade: string
  proActive: string
  themeLight: string
  themeDark: string
  toggleThemeAria: string
  languageLabel: string
  menuToggleAria: string
  primaryNavAria: string
  mobileNavAria: string
  navCategories: Record<ToolId, string>
  dropzoneTitle: string
  dropzoneSubtitle: string
  privacyBadge: string
  privacyBannerTitle: string
  privacyBannerDescription: string
  privacyProofPoints: readonly [string, string, string]
  howToHeading: string
  howToSubheading: string
  highlightsHeading: string
  highlightsSubheading: string
  relatedToolsHeading: string
  relatedToolsSubheading: string
  directoryHeading: string
  directorySubheading: string
  faqHeading: string
  faqSubheading: string
  studioBannerTitle: string
  studioBannerDescription: string
  studioBannerAction: string
  studioBannerProAction: string
  footerDescription: string
  footerGroups: {
    mockups: string
    mergeSplit: string
    optimizeResize: string
    documentsStudio: string
  }
  footerLanguages: string
  footerOpenSource: string
  footerLocalFirstNote: string
  footerCopyright: string
}

export interface LocaleBundle {
  code: LocaleCode
  nativeName: string
  shortLabel: string
  ogLocale: string
  ui: UiLabels
  routes: Record<RouteSlug, RouteCopy>
}
