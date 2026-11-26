/**
 * [INPUT]: depends on RouteDefinition, RouteSlug, LocaleCode, HtmlLangCode, HreflangCode, ResolvedRoute, HreflangLink, and ToolId types from ./types.ts
 * [OUTPUT]: exports LOCALE_CODES, DEFAULT_LOCALE, DEFAULT_SITE_URL, ROUTE_SLUGS, ROUTE_DEFINITIONS, ALL_ROUTES, TOOL_ROUTE_DEFINITIONS, INFO_ROUTE_DEFINITIONS, PRIMARY_TOOL_SLUGS, getHtmlLang, getHreflangCode, getSiteUrl, isLocaleCode, isRouteSlug, getRouteDefinition, buildLocalizedPath, buildCanonicalUrl, getHreflangLinks, resolvePathname, and getRelatedRoutes
 * [POS]: single source of truth for all 32 intent/info slugs (128 trailing-slash localized URLs), BCP-47 lang/hreflang tags (`zh-CN`/`zh-Hans`), URL normalization, preset mapping, and internal link graphs across client routing and build-time SSG
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type {
  HreflangCode,
  HreflangLink,
  HtmlLangCode,
  LocaleCode,
  ResolvedRoute,
  RouteDefinition,
  RouteSlug,
  ToolId,
} from './types.ts'

export const DEFAULT_SITE_URL = 'https://moklu.app'
export const DEFAULT_LOCALE: LocaleCode = 'en'
export const LOCALE_CODES: readonly LocaleCode[] = ['en', 'zh', 'ja', 'ko'] as const

const HTML_LANG_MAP: Record<LocaleCode, HtmlLangCode> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
}

const HREFLANG_MAP: Record<LocaleCode, Exclude<HreflangCode, 'x-default'>> = {
  en: 'en',
  zh: 'zh-Hans',
  ja: 'ja',
  ko: 'ko',
}

export function getHtmlLang(locale: LocaleCode): HtmlLangCode {
  return HTML_LANG_MAP[locale] ?? 'en'
}

export function getHreflangCode(locale: LocaleCode): Exclude<HreflangCode, 'x-default'> {
  return HREFLANG_MAP[locale] ?? 'en'
}

const LOCALE_SET: ReadonlySet<string> = new Set(LOCALE_CODES)

export const PRIMARY_TOOL_SLUGS: Record<ToolId, RouteSlug> = {
  mockup: 'browser-mockup',
  merge: 'merge-images',
  split: 'carousel-splitter',
  compress: 'compress-image',
  resize: 'resize-image',
  annotate: 'annotate-image',
  'id-card': 'id-card-watermark',
}

export const ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
  {
    slug: '',
    category: 'hub',
    isStudio: false,
    priority: 1.0,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: [
      'browser-mockup',
      'iphone-mockup',
      'merge-images',
      'carousel-splitter',
      'compress-image',
      'id-card-watermark',
    ],
  },
  {
    slug: 'studio',
    category: 'studio',
    isStudio: true,
    priority: 0.9,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: [
      'browser-mockup',
      'iphone-mockup',
      'app-store-screenshots',
      'merge-images',
      'carousel-splitter',
      'compress-image',
    ],
  },
  // Mockup family
  {
    slug: 'browser-mockup',
    category: 'mockup',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: ['redact-screenshot', 'iphone-mockup', 'ipad-mockup', 'device-mockup', 'app-store-screenshots', 'studio'],
  },
  {
    slug: 'iphone-mockup',
    category: 'mockup',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'mockup', mockupModel: 'iphone-16-pro', canvasSize: 'portrait' },
    relatedSlugs: ['app-store-screenshots', 'ipad-mockup', 'watch-mockup', 'device-mockup', 'browser-mockup', 'studio'],
  },
  {
    slug: 'ipad-mockup',
    category: 'mockup',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'mockup', mockupModel: 'ipad-13', canvasSize: 'landscape' },
    relatedSlugs: ['iphone-mockup', 'device-mockup', 'browser-mockup', 'watch-mockup', 'app-store-screenshots', 'studio'],
  },
  {
    slug: 'watch-mockup',
    category: 'mockup',
    isStudio: false,
    priority: 0.88,
    preset: { tool: 'mockup', mockupModel: 'apple-watch', canvasSize: 'square' },
    relatedSlugs: ['iphone-mockup', 'ipad-mockup', 'device-mockup', 'app-store-screenshots', 'resize-image', 'studio'],
  },
  {
    slug: 'device-mockup',
    category: 'mockup',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'mockup', mockupModel: 'pixel-9', canvasSize: 'landscape' },
    relatedSlugs: ['browser-mockup', 'iphone-mockup', 'ipad-mockup', 'watch-mockup', 'app-store-screenshots', 'studio'],
  },
  {
    slug: 'app-store-screenshots',
    category: 'mockup',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'mockup', mockupModel: 'iphone-16-pro', canvasSize: 'story' },
    relatedSlugs: ['iphone-mockup', 'ipad-mockup', 'device-mockup', 'carousel-splitter', 'resize-image', 'studio'],
  },
  {
    slug: 'redact-screenshot',
    category: 'mockup',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide', enableRedact: true },
    relatedSlugs: ['browser-mockup', 'remove-exif', 'stitch-screenshots', 'id-card-watermark', 'iphone-mockup', 'studio'],
  },
  // Merge family
  {
    slug: 'merge-images',
    category: 'merge',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'merge', mergeDirection: 'horizontal' },
    relatedSlugs: ['combine-photos-side-by-side', 'stitch-images-vertically', 'stitch-screenshots', 'photo-collage-grid', 'merge-photos-to-pdf', 'compress-image'],
  },
  {
    slug: 'combine-photos-side-by-side',
    category: 'merge',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'merge', mergeDirection: 'horizontal' },
    relatedSlugs: ['merge-images', 'stitch-images-vertically', 'stitch-screenshots', 'photo-collage-grid', 'merge-photos-to-pdf', 'browser-mockup'],
  },
  {
    slug: 'stitch-images-vertically',
    category: 'merge',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'merge', mergeDirection: 'vertical' },
    relatedSlugs: ['stitch-screenshots', 'merge-images', 'combine-photos-side-by-side', 'photo-collage-grid', 'merge-photos-to-pdf', 'compress-image'],
  },
  {
    slug: 'stitch-screenshots',
    category: 'merge',
    isStudio: false,
    priority: 0.92,
    preset: { tool: 'merge', mergeDirection: 'vertical', removeOverlap: true },
    relatedSlugs: ['stitch-images-vertically', 'merge-images', 'merge-photos-to-pdf', 'redact-screenshot', 'compress-image', 'studio'],
  },
  {
    slug: 'photo-collage-grid',
    category: 'merge',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'merge', mergeDirection: 'grid' },
    relatedSlugs: ['merge-images', 'combine-photos-side-by-side', 'merge-photos-to-pdf', 'image-grid-splitter', 'add-border-to-photo', 'studio'],
  },
  {
    slug: 'merge-photos-to-pdf',
    category: 'merge',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'merge', mergeDirection: 'vertical', mergeFormat: 'application/pdf', pdfMode: 'multipage' },
    relatedSlugs: ['merge-images', 'stitch-screenshots', 'stitch-images-vertically', 'photo-collage-grid', 'id-card-watermark', 'compress-image-to-200kb'],
  },
  // Split family
  {
    slug: 'carousel-splitter',
    category: 'split',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'split', splitMode: 'carousel' },
    relatedSlugs: ['image-grid-splitter', 'stitch-images-vertically', 'app-store-screenshots', 'resize-image', 'compress-image', 'studio'],
  },
  {
    slug: 'image-grid-splitter',
    category: 'split',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'split', splitMode: 'grid' },
    relatedSlugs: ['carousel-splitter', 'photo-collage-grid', 'crop-image', 'resize-image', 'compress-image', 'add-border-to-photo'],
  },
  // Compress / Convert family
  {
    slug: 'compress-image',
    category: 'compress',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'compress', targetFormat: 'image/webp' },
    relatedSlugs: ['compress-image-to-200kb', 'heic-to-jpg', 'remove-exif', 'convert-image-format', 'png-to-webp', 'resize-image'],
  },
  {
    slug: 'compress-image-to-200kb',
    category: 'compress',
    isStudio: false,
    priority: 0.92,
    preset: { tool: 'compress', targetFormat: 'image/webp', targetSizeKb: 200 },
    relatedSlugs: ['compress-image', 'heic-to-jpg', 'remove-exif', 'resize-image', 'png-to-webp', 'id-card-watermark'],
  },
  {
    slug: 'heic-to-jpg',
    category: 'compress',
    isStudio: false,
    priority: 0.93,
    preset: { tool: 'compress', targetFormat: 'image/jpeg' },
    relatedSlugs: ['convert-image-format', 'compress-image', 'compress-image-to-200kb', 'remove-exif', 'png-to-webp', 'resize-image'],
  },
  {
    slug: 'remove-exif',
    category: 'compress',
    isStudio: false,
    priority: 0.92,
    preset: { tool: 'compress', targetFormat: 'image/jpeg', inspectExif: true },
    relatedSlugs: ['id-card-watermark', 'redact-screenshot', 'heic-to-jpg', 'compress-image', 'compress-image-to-200kb', 'privacy'],
  },
  {
    slug: 'convert-image-format',
    category: 'compress',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'compress', targetFormat: 'image/png' },
    relatedSlugs: ['heic-to-jpg', 'png-to-webp', 'compress-image', 'remove-exif', 'resize-image', 'crop-image'],
  },
  {
    slug: 'png-to-webp',
    category: 'compress',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'compress', targetFormat: 'image/webp' },
    relatedSlugs: ['compress-image', 'compress-image-to-200kb', 'convert-image-format', 'heic-to-jpg', 'resize-image', 'browser-mockup'],
  },
  // Resize / Crop / Pad family
  {
    slug: 'resize-image',
    category: 'resize',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'resize', resizeMode: 'resize' },
    relatedSlugs: ['crop-image', 'add-border-to-photo', 'compress-image-to-200kb', 'compress-image', 'convert-image-format', 'app-store-screenshots'],
  },
  {
    slug: 'crop-image',
    category: 'resize',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'resize', resizeMode: 'crop' },
    relatedSlugs: ['resize-image', 'add-border-to-photo', 'image-grid-splitter', 'combine-photos-side-by-side', 'iphone-mockup', 'compress-image'],
  },
  {
    slug: 'add-border-to-photo',
    category: 'resize',
    isStudio: false,
    priority: 0.9,
    preset: { tool: 'resize', resizeMode: 'pad' },
    relatedSlugs: ['resize-image', 'crop-image', 'photo-collage-grid', 'browser-mockup', 'carousel-splitter', 'studio'],
  },
  // Annotate / Markup family
  {
    slug: 'annotate-image',
    category: 'annotate',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'annotate', annotateTool: 'rect' },
    relatedSlugs: ['draw-on-image', 'redact-screenshot', 'browser-mockup', 'merge-images', 'resize-image', 'studio'],
  },
  {
    slug: 'draw-on-image',
    category: 'annotate',
    isStudio: false,
    priority: 0.92,
    preset: { tool: 'annotate', annotateTool: 'brush' },
    relatedSlugs: ['annotate-image', 'redact-screenshot', 'browser-mockup', 'crop-image', 'remove-exif', 'studio'],
  },
  // ID Card / Document family
  {
    slug: 'id-card-watermark',
    category: 'id-card',
    isStudio: false,
    priority: 0.95,
    preset: { tool: 'id-card' },
    relatedSlugs: ['remove-exif', 'redact-screenshot', 'merge-photos-to-pdf', 'compress-image-to-200kb', 'crop-image', 'resize-image'],
  },
  // Trust & architecture info pages (E-E-A-T)
  {
    slug: 'about',
    category: 'info',
    isStudio: false,
    isInfoPage: true,
    priority: 0.65,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: ['merge-images', 'browser-mockup', 'carousel-splitter', 'compress-image', 'id-card-watermark', 'privacy'],
  },
  {
    slug: 'privacy',
    category: 'info',
    isStudio: false,
    isInfoPage: true,
    priority: 0.65,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: ['about', 'terms', 'id-card-watermark', 'merge-images', 'compress-image', 'browser-mockup'],
  },
  {
    slug: 'terms',
    category: 'info',
    isStudio: false,
    isInfoPage: true,
    priority: 0.55,
    preset: { tool: 'mockup', mockupModel: 'browser-chrome', canvasSize: 'wide' },
    relatedSlugs: ['about', 'privacy', 'merge-images', 'browser-mockup', 'studio', 'id-card-watermark'],
  },
] as const

export const ROUTE_SLUGS: readonly RouteSlug[] = ROUTE_DEFINITIONS.map((def) => def.slug)

export const TOOL_ROUTE_DEFINITIONS: readonly RouteDefinition[] = ROUTE_DEFINITIONS.filter(
  (def) => !def.isStudio && !def.isInfoPage && def.slug !== '',
)

export const INFO_ROUTE_DEFINITIONS: readonly RouteDefinition[] = ROUTE_DEFINITIONS.filter(
  (def) => Boolean(def.isInfoPage),
)

const ROUTE_MAP = new Map<RouteSlug, RouteDefinition>(
  ROUTE_DEFINITIONS.map((def) => [def.slug, def]),
)

const SLUG_SET: ReadonlySet<string> = new Set(ROUTE_SLUGS)

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALE_SET.has(value)
}

export function isRouteSlug(value: string): value is RouteSlug {
  return SLUG_SET.has(value)
}

function readEnvSiteUrl(): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  const fromProcess = proc?.env?.VITE_SITE_URL
  if (fromProcess && fromProcess.trim()) return fromProcess.trim()

  const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env
  const fromImportMeta = metaEnv?.VITE_SITE_URL
  if (fromImportMeta && fromImportMeta.trim()) return fromImportMeta.trim()

  return undefined
}

export function getSiteUrl(override?: string): string {
  const candidate = (override ?? readEnvSiteUrl() ?? DEFAULT_SITE_URL).trim()
  return candidate.replace(/\/+$/, '') || DEFAULT_SITE_URL
}

export function getRouteDefinition(slug: RouteSlug): RouteDefinition {
  const found = ROUTE_MAP.get(slug)
  if (!found) {
    return ROUTE_DEFINITIONS[0]
  }
  return found
}

export function buildLocalizedPath(locale: LocaleCode, slug: RouteSlug): string {
  if (locale === DEFAULT_LOCALE) {
    return slug === '' ? '/' : `/${slug}/`
  }
  return slug === '' ? `/${locale}/` : `/${locale}/${slug}/`
}

export function buildCanonicalUrl(
  locale: LocaleCode,
  slug: RouteSlug,
  siteUrl?: string,
): string {
  const base = getSiteUrl(siteUrl)
  const path = buildLocalizedPath(locale, slug)
  return `${base}${path}`
}

export function getHreflangLinks(slug: RouteSlug, siteUrl?: string): HreflangLink[] {
  const links: HreflangLink[] = LOCALE_CODES.map((locale) => ({
    hreflang: getHreflangCode(locale),
    href: buildCanonicalUrl(locale, slug, siteUrl),
  }))
  links.push({
    hreflang: 'x-default',
    href: buildCanonicalUrl(DEFAULT_LOCALE, slug, siteUrl),
  })
  return links
}

function toResolvedRoute(
  locale: LocaleCode,
  def: RouteDefinition,
  isFallback: boolean,
): ResolvedRoute {
  return {
    locale,
    slug: def.slug,
    path: buildLocalizedPath(locale, def.slug),
    category: def.category,
    isStudio: def.isStudio,
    isInfoPage: Boolean(def.isInfoPage),
    isFallback,
    priority: def.priority,
    preset: { ...def.preset },
    tool: def.preset.tool,
    relatedSlugs: def.relatedSlugs,
  }
}

export function resolvePathname(pathname: string): ResolvedRoute {
  const cleaned = pathname.split(/[?#]/, 1)[0].trim().toLowerCase()
  const segments = cleaned.split('/').filter(Boolean)

  if (segments.length === 0) {
    return toResolvedRoute(DEFAULT_LOCALE, getRouteDefinition(''), false)
  }

  let locale: LocaleCode = DEFAULT_LOCALE
  let rest = segments

  if (segments[0] === 'en') {
    // Redirect-safe normalization for explicit /en/... paths back to root English canonical
    locale = 'en'
    rest = segments.slice(1)
  } else if (isLocaleCode(segments[0])) {
    locale = segments[0]
    rest = segments.slice(1)
  }

  if (rest.length === 0) {
    return toResolvedRoute(locale, getRouteDefinition(''), false)
  }

  const candidateSlug = rest.join('/')
  if (isRouteSlug(candidateSlug)) {
    return toResolvedRoute(locale, getRouteDefinition(candidateSlug), false)
  }

  return toResolvedRoute(locale, getRouteDefinition(''), true)
}

export function getRelatedRoutes(slug: RouteSlug, locale: LocaleCode): ResolvedRoute[] {
  const def = getRouteDefinition(slug)
  return def.relatedSlugs.map((relatedSlug) =>
    toResolvedRoute(locale, getRouteDefinition(relatedSlug), false),
  )
}

export const ALL_ROUTES: readonly ResolvedRoute[] = LOCALE_CODES.flatMap((locale) =>
  ROUTE_DEFINITIONS.map((def) => toResolvedRoute(locale, def, false)),
)
