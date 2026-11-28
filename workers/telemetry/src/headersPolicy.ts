/**
 * [INPUT]: none (zero-dependency edge HTTP header, 140-route SSG matcher, explicit /en redirector, static-asset HTML-fallback detector, HTML navigation & 4-locale 404.html resolver, CDN-Cache-Control, and crawl-hygiene contract mirrored with public/_headers and src/seo/routes.ts; verified in index.test.ts)
 * [OUTPUT]: exports EdgeLocaleCode, EDGE_SECURITY_HEADERS, isStaticNonHtmlAssetPath, isUnexpectedHtmlAssetFallback, isHtmlDocumentNavigation, resolveEdgeNotFoundLocale, resolveOriginNotFoundHtmlPath, resolveExplicitEnRedirectPath, isKnownSsgHtmlPath, isUnknownNonAssetPath, resolveCanonicalStaticContentType, resolveEdgeCacheControl, resolveEdgeCdnCacheControl, resolveEdgeCacheTtlSeconds, and applyMokluEdgeHeaders
 * [POS]: single edge response-header, redirect, content-negotiated 404, MIME normalization, and cache-policy module of workers/telemetry/src; attaches CSP, COOP, strict module/WASM Content-Type fixes, bfcache-safe Cache-Control, immutable /assets/* & /models/* caching, CDN-Cache-Control, static-asset soft-200 guards, and localized 404 HTML resolution onto Coolify origin responses
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type EdgeLocaleCode = 'en' | 'zh' | 'ja' | 'ko'

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
// Mirrors the 34 non-root slugs in src/seo/routes.ts (plus root '' across 4 locales = 140 SSG routes).
const KNOWN_ROUTE_SLUGS = new Set([
  'studio',
  'browser-mockup',
  'iphone-mockup',
  'ipad-mockup',
  'watch-mockup',
  'device-mockup',
  'app-store-screenshots',
  'redact-screenshot',
  'annotate-image',
  'draw-on-image',
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
  'passport-photo-maker',
  'id-photo-background-changer',
  'id-photo-print-sheet',
  'id-card-watermark',
  'about',
  'privacy',
  'terms',
])

const STATIC_NON_HTML_EXTENSION_RE =
  /\.(?:js|mjs|cjs|css|map|wasm|onnx|woff|woff2|ttf|otf|png|jpg|jpeg|webp|avif|gif|svg|ico|json|xml|txt|webmanifest|pdf|zip)$/i
const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i
const HTML_ACCEPT_RE = /\btext\/html\b/i
const EXPLICIT_EN_SLUG_RE = /^\/en\/([^/]+)\/?$/
const ACCEPT_LANG_Q_RE = /^\s*q\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*$/i

function isNoStorePath(pathname: string): boolean {
  return NO_STORE_PATHS.has(pathname) || pathname === '/_telemetry' || pathname.startsWith('/_telemetry/')
}

function isImmutableAssetPath(pathname: string): boolean {
  return pathname.startsWith('/assets/') || pathname.startsWith('/models/')
}

function isShortTtlStaticPath(pathname: string): boolean {
  return SHORT_TTL_EXACT_PATHS.has(pathname) || pathname.startsWith('/templates/')
}

function isKnownStaticAssetPath(pathname: string): boolean {
  return isImmutableAssetPath(pathname) || isShortTtlStaticPath(pathname) || pathname === INDEXNOW_KEY_PATH
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

export function isHtmlDocumentNavigation(request: Pick<Request, 'method' | 'headers'>): boolean {
  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    return false
  }

  const secFetchDest = (request.headers.get('sec-fetch-dest') ?? '').trim().toLowerCase()
  const secFetchMode = (request.headers.get('sec-fetch-mode') ?? '').trim().toLowerCase()
  const accept = request.headers.get('accept') ?? ''

  if (secFetchDest && secFetchDest !== 'document' && secFetchDest !== 'iframe') {
    return false
  }
  if (secFetchMode === 'navigate' || secFetchDest === 'document') {
    return true
  }
  if (!secFetchMode && !secFetchDest) {
    return HTML_ACCEPT_RE.test(accept)
  }
  return false
}

export function resolveEdgeNotFoundLocale(
  pathname: string,
  acceptLanguage: string | null,
): EdgeLocaleCode {
  const firstSegment = pathname.split(/[?#]/, 1)[0].toLowerCase().split('/').filter(Boolean)[0]
  if (
    firstSegment === 'zh' ||
    firstSegment === 'ja' ||
    firstSegment === 'ko' ||
    firstSegment === 'en'
  ) {
    return firstSegment
  }

  if (!acceptLanguage) {
    return 'en'
  }

  const weightedTags: Array<{ tag: string; q: number; index: number }> = []
  const parts = acceptLanguage.split(',')
  for (let index = 0; index < parts.length; index += 1) {
    const [rawTag, ...params] = parts[index].trim().split(';')
    const tag = rawTag.trim().toLowerCase()
    if (!tag) continue
    let q = 1
    for (const param of params) {
      const match = ACCEPT_LANG_Q_RE.exec(param)
      if (match) {
        const parsed = Number(match[1])
        if (Number.isFinite(parsed)) {
          q = parsed
        }
      }
    }
    if (q <= 0) continue
    weightedTags.push({ tag, q, index })
  }

  weightedTags.sort((a, b) => b.q - a.q || a.index - b.index)

  for (const { tag } of weightedTags) {
    if (/^zh\b/i.test(tag)) return 'zh'
    if (/^ja\b/i.test(tag)) return 'ja'
    if (/^ko\b/i.test(tag)) return 'ko'
    if (/^en\b/i.test(tag)) return 'en'
  }

  return 'en'
}

export function resolveOriginNotFoundHtmlPath(locale: EdgeLocaleCode): string {
  switch (locale) {
    case 'zh':
      return '/zh/404.html'
    case 'ja':
      return '/ja/404.html'
    case 'ko':
      return '/ko/404.html'
    case 'en':
    default:
      return '/404.html'
  }
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
  if (isImmutableAssetPath(pathname)) {
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
  if (isImmutableAssetPath(pathname)) {
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
  if (isImmutableAssetPath(pathname)) {
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

export function resolveCanonicalStaticContentType(
  pathname: string,
  upstreamContentType: string | null,
): string | null {
  const cleanPath = pathname.split(/[?#]/, 1)[0].toLowerCase()
  // Module scripts (.js/.mjs/.cjs) and WebAssembly (.wasm) enforce strict MIME
  // checking in browsers (especially alongside X-Content-Type-Options: nosniff).
  // Origin static servers like Caddy/Nginx frequently serve .mjs as application/octet-stream.
  if (/\.(?:js|mjs|cjs)$/.test(cleanPath)) {
    return 'text/javascript; charset=utf-8'
  }
  if (cleanPath.endsWith('.wasm')) {
    return 'application/wasm'
  }
  if (cleanPath.endsWith('.onnx')) {
    return 'application/octet-stream'
  }

  const normalizedUpstream = (upstreamContentType ?? '').trim().toLowerCase()
  const isGenericOrMissing =
    !normalizedUpstream || normalizedUpstream.startsWith('application/octet-stream')
  if (!isGenericOrMissing) {
    return null
  }

  if (cleanPath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (cleanPath.endsWith('.json') || cleanPath.endsWith('.map')) return 'application/json; charset=utf-8'
  if (cleanPath.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8'
  if (cleanPath.endsWith('.svg')) return 'image/svg+xml'
  if (cleanPath.endsWith('.woff2')) return 'font/woff2'
  if (cleanPath.endsWith('.xml')) return 'application/xml; charset=utf-8'
  if (cleanPath.endsWith('.txt')) return 'text/plain; charset=utf-8'
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

  if (status === 200 && !unknownNonAsset) {
    const canonicalMime = resolveCanonicalStaticContentType(pathname, headers.get('content-type'))
    if (canonicalMime) {
      headers.set('Content-Type', canonicalMime)
    }
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
