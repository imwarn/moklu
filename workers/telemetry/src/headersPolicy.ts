/**
 * [INPUT]: none (zero-dependency edge HTTP header, 120-route SSG matcher, explicit /en redirector, static-asset HTML-fallback detector, CDN-Cache-Control, and crawl-hygiene contract mirrored with public/_headers and src/seo/routes.ts; verified in index.test.ts)
 * [OUTPUT]: exports EDGE_SECURITY_HEADERS, isStaticNonHtmlAssetPath, isUnexpectedHtmlAssetFallback, resolveExplicitEnRedirectPath, isKnownSsgHtmlPath, isUnknownNonAssetPath, resolveEdgeCacheControl, resolveEdgeCdnCacheControl, resolveEdgeCacheTtlSeconds, and applyMokluEdgeHeaders
 * [POS]: single edge response-header, redirect, 404-status, and cache-policy module of workers/telemetry/src; attaches CSP, COOP, bfcache-safe Cache-Control, CDN-Cache-Control, static-asset soft-200 guards, and unknown-route HTTP 404 + X-Robots-Tag onto Coolify origin responses
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export const EDGE_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://openrouter.ai https://generativelanguage.googleapis.com https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
}

const INDEXNOW_KEY_PATH = '/fb6946466b9027e3bbb1506815e0f52e.txt'
const NO_STORE_PATHS = new Set(['/healthz.txt', '/healthz', '/healthz/', '/healthz/index.html'])
const SHORT_TTL_EXACT_PATHS = new Set([
  '/logo.svg',
  '/logo-light.svg',
  '/logo-dark.svg',
  '/logo-mono.svg',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/og-image.png',
  '/theme-init.js',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
])

const LOCALIZED_PREFIXES = new Set(['zh', 'ja', 'ko'])
// Mirrors the 29 non-root slugs in src/seo/routes.ts (plus root '' across 4 locales = 120 SSG routes).
const KNOWN_ROUTE_SLUGS = new Set([
  'studio',
  'browser-mockup',
  'iphone-mockup',
  'ipad-mockup',
  'watch-mockup',
  'device-mockup',
  'app-store-screenshots',
  'redact-screenshot',
  'merge-images',
  'combine-photos-side-by-side',
  'stitch-images-vertically',
  'stitch-screenshots',
  'photo-collage-grid',
  'merge-photos-to-pdf',
  'carousel-splitter',
  'image-grid-splitter',
  'compress-image',
  'compress-image-to-200kb',
  'heic-to-jpg',
  'remove-exif',
  'convert-image-format',
  'png-to-webp',
  'resize-image',
  'crop-image',
  'add-border-to-photo',
  'id-card-watermark',
  'about',
  'privacy',
  'terms',
])

const STATIC_NON_HTML_EXTENSION_RE =
  /\.(?:js|mjs|cjs|css|map|wasm|woff|woff2|ttf|otf|png|jpg|jpeg|webp|avif|gif|svg|ico|json|xml|txt|webmanifest|pdf|zip)$/i
const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i
const EXPLICIT_EN_SLUG_RE = /^\/en\/([^/]+)\/?$/

function isNoStorePath(pathname: string): boolean {
  return NO_STORE_PATHS.has(pathname) || pathname === '/_telemetry' || pathname.startsWith('/_telemetry/')
}

function isShortTtlStaticPath(pathname: string): boolean {
  return SHORT_TTL_EXACT_PATHS.has(pathname) || pathname.startsWith('/templates/')
}

function isKnownStaticAssetPath(pathname: string): boolean {
  return pathname.startsWith('/assets/') || isShortTtlStaticPath(pathname) || pathname === INDEXNOW_KEY_PATH
}

export function isStaticNonHtmlAssetPath(pathname: string): boolean {
  if (isKnownStaticAssetPath(pathname)) {
    return true
  }
  return STATIC_NON_HTML_EXTENSION_RE.test(pathname)
}

export function isUnexpectedHtmlAssetFallback(
  pathname: string,
  contentType: string | null,
): boolean {
  return (
    isStaticNonHtmlAssetPath(pathname) &&
    typeof contentType === 'string' &&
    HTML_CONTENT_TYPE_RE.test(contentType)
  )
}

export function resolveExplicitEnRedirectPath(pathname: string): string | null {
  if (pathname === '/en' || pathname === '/en/') {
    return '/'
  }
  const match = EXPLICIT_EN_SLUG_RE.exec(pathname)
  if (!match) {
    return null
  }
  const slug = match[1]
  return KNOWN_ROUTE_SLUGS.has(slug) ? `/${slug}/` : null
}

export function isKnownSsgHtmlPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/index.html') {
    return true
  }
  if (!pathname.startsWith('/') || pathname.includes('//')) {
    return false
  }
  const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const segments = trimmed.split('/').filter(Boolean)
  if (segments.length === 1) {
    return LOCALIZED_PREFIXES.has(segments[0]) || KNOWN_ROUTE_SLUGS.has(segments[0])
  }
  if (segments.length === 2) {
    return LOCALIZED_PREFIXES.has(segments[0]) && KNOWN_ROUTE_SLUGS.has(segments[1])
  }
  return false
}

export function isUnknownNonAssetPath(pathname: string): boolean {
  return !isNoStorePath(pathname) && !isStaticNonHtmlAssetPath(pathname) && !isKnownSsgHtmlPath(pathname)
}

export function resolveEdgeCacheControl(pathname: string, status: number): string {
  if (isNoStorePath(pathname) || status >= 400) {
    return 'no-store'
  }
  if (pathname === INDEXNOW_KEY_PATH) {
    return status === 200 ? 'public, max-age=86400' : 'public, no-cache'
  }
  if (pathname.startsWith('/assets/')) {
    return status === 200 ? 'public, max-age=31536000, immutable' : 'public, no-cache'
  }
  if (isShortTtlStaticPath(pathname)) {
    return status === 200 ? 'public, max-age=3600' : 'public, no-cache'
  }
  if (isKnownSsgHtmlPath(pathname)) {
    return 'public, no-cache'
  }
  return 'no-store'
}

export function resolveEdgeCdnCacheControl(pathname: string, status: number): string | null {
  if (status !== 200 || isNoStorePath(pathname)) {
    return null
  }
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable'
  }
  if (pathname === INDEXNOW_KEY_PATH) {
    return 'public, s-maxage=86400'
  }
  if (isShortTtlStaticPath(pathname)) {
    return 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
  if (isKnownSsgHtmlPath(pathname)) {
    return 'public, s-maxage=60, stale-while-revalidate=86400'
  }
  return null
}

export function resolveEdgeCacheTtlSeconds(pathname: string): number | null {
  if (isNoStorePath(pathname)) {
    return null
  }
  if (pathname.startsWith('/assets/')) {
    return 31536000
  }
  if (pathname === INDEXNOW_KEY_PATH) {
    return 86400
  }
  if (isShortTtlStaticPath(pathname)) {
    return 3600
  }
  if (isKnownSsgHtmlPath(pathname)) {
    return 60
  }
  return null
}

export function applyMokluEdgeHeaders(upstream: Response, pathname: string): Response {
  const unknownNonAsset = isUnknownNonAssetPath(pathname)
  const shouldRewriteTo404 = unknownNonAsset && upstream.status === 200
  const status = shouldRewriteTo404 ? 404 : upstream.status
  const statusText = shouldRewriteTo404 ? 'Not Found' : upstream.statusText

  const headers = new Headers(upstream.headers)
  for (const [name, value] of Object.entries(EDGE_SECURITY_HEADERS)) {
    headers.set(name, value)
  }
  headers.set('Cache-Control', resolveEdgeCacheControl(pathname, status))

  const cdnCacheControl = resolveEdgeCdnCacheControl(pathname, status)
  if (cdnCacheControl) {
    headers.set('CDN-Cache-Control', cdnCacheControl)
  } else {
    headers.delete('CDN-Cache-Control')
  }

  if (unknownNonAsset) {
    headers.set('X-Robots-Tag', 'noindex, follow')
  }

  return new Response(upstream.body, {
    status,
    statusText,
    headers,
  })
}
