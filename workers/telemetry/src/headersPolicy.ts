/**
 * [INPUT]: none (pure edge HTTP header & Cache-Control contract mirrored with public/_headers and verified in index.test.ts)
 * [OUTPUT]: exports EDGE_SECURITY_HEADERS, resolveEdgeCacheControl, and applyMokluEdgeHeaders
 * [POS]: single edge response-header policy module of workers/telemetry/src; attaches CSP, security headers, and path-scoped Cache-Control to Coolify origin responses
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export const EDGE_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://openrouter.ai https://generativelanguage.googleapis.com https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
}

const NO_STORE_PATHS = new Set(['/healthz.txt', '/healthz', '/healthz/', '/healthz/index.html'])
const ENTRY_HTML_PATHS = new Set(['/', '/index.html'])
const SHORT_TTL_EXACT_PATHS = new Set([
  '/logo.svg',
  '/logo-light.svg',
  '/logo-dark.svg',
  '/logo-mono.svg',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/og-image.png',
])

export function resolveEdgeCacheControl(pathname: string, status: number): string {
  if (NO_STORE_PATHS.has(pathname)) {
    return 'no-store'
  }
  if (ENTRY_HTML_PATHS.has(pathname)) {
    return 'no-cache, no-store, must-revalidate'
  }
  if (status >= 400) {
    return 'no-store'
  }
  if (pathname === '/fb6946466b9027e3bbb1506815e0f52e.txt') {
    return 'public, max-age=86400'
  }
  if (pathname.startsWith('/assets/')) {
    return status === 200 ? 'public, max-age=31536000, immutable' : 'no-cache'
  }
  if (SHORT_TTL_EXACT_PATHS.has(pathname) || pathname.startsWith('/templates/')) {
    return status === 200 ? 'public, max-age=3600' : 'no-cache'
  }
  return 'no-cache'
}

export function applyMokluEdgeHeaders(upstream: Response, pathname: string): Response {
  const headers = new Headers(upstream.headers)
  for (const [name, value] of Object.entries(EDGE_SECURITY_HEADERS)) {
    headers.set(name, value)
  }
  headers.set('Cache-Control', resolveEdgeCacheControl(pathname, upstream.status))
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
