/**
 * [INPUT]: depends on WinterCG Fetch/Cache APIs, Cloudflare D1Database interface, and ./headersPolicy (EDGE_SECURITY_HEADERS, applyMokluEdgeHeaders, isHtmlDocumentNavigation, isStaticNonHtmlAssetPath, isUnexpectedHtmlAssetFallback, isUnknownNonAssetPath, resolveEdgeCacheTtlSeconds, resolveEdgeNotFoundLocale, resolveExplicitEnRedirectPath, resolveOriginNotFoundHtmlPath)
 * [OUTPUT]: exports D1DatabaseLike, TelemetryWorkerEnv, ExecutionContextLike, ALLOWED_FUNNEL_EVENTS, sanitizeEdgeDimension, and default Worker fetch handler
 * [POS]: edge entry point of workers/telemetry; serves moklu.app/_telemetry* zero-PII D1 funnel ingestion (including not_found_view), canonical 301 /en redirects, content-negotiated localized 404.html vs subresource 404 text/plain responses (never cached), and Coolify origin proxying with isolated Cloudflare Cache API (`caches.open('moklu-edge-v4')`) + `cf.cacheEverything`, strict .mjs/.wasm MIME normalization, public/_headers CSP/COOP, and CDN-Cache-Control
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  EDGE_SECURITY_HEADERS,
  applyMokluEdgeHeaders,
  isHtmlDocumentNavigation,
  isStaticNonHtmlAssetPath,
  isUnexpectedHtmlAssetFallback,
  isUnknownNonAssetPath,
  resolveEdgeCacheTtlSeconds,
  resolveEdgeNotFoundLocale,
  resolveExplicitEnRedirectPath,
  resolveOriginNotFoundHtmlPath,
} from './headersPolicy'

export interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => {
    run: () => Promise<unknown>
  }
}

export interface D1DatabaseLike {
  prepare: (query: string) => D1PreparedStatementLike
}

export interface TelemetryWorkerEnv {
  DB?: D1DatabaseLike
  ALLOWED_ORIGINS?: string
}

export interface ExecutionContextLike {
  waitUntil: (promise: Promise<unknown>) => void
}

interface CfRequestMetadata {
  country?: string
}

interface CfFetchCacheOptions {
  cacheEverything?: boolean
  cacheTtl?: number
}

interface EdgeCacheStorageLike {
  open?: (cacheName: string) => Promise<Cache>
  default?: Cache
}

type EdgeRequest = Request & { cf?: CfRequestMetadata }
type CfRequestInit = RequestInit & { cf?: CfFetchCacheOptions }

const EDGE_CACHE_NAME = 'moklu-edge-v4'
const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i

function buildStaticAssetNotFoundResponse(method: string): Response {
  return new Response(method === 'HEAD' ? null : 'Not Found', {
    status: 404,
    statusText: 'Not Found',
    headers: {
      ...EDGE_SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      Vary: 'Accept, Sec-Fetch-Dest, Sec-Fetch-Mode',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

async function serveEdgeNotFoundHtml(
  request: Request,
  url: URL,
  robotsDirective: 'noindex, follow' | 'noindex, nofollow',
): Promise<Response> {
  const method = request.method.toUpperCase()
  const locale = resolveEdgeNotFoundLocale(url.pathname, request.headers.get('accept-language'))
  const targetPath = resolveOriginNotFoundHtmlPath(locale)
  const candidates = targetPath === '/404.html'
    ? ['/404.html', '/index.html']
    : [targetPath, '/404.html', '/index.html']

  const headers: Record<string, string> = {
    ...EDGE_SECURITY_HEADERS,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode',
    'X-Robots-Tag': robotsDirective,
  }

  for (const candidatePath of candidates) {
    const res = await fetch(new Request(new URL(candidatePath, url.origin).toString(), { method: 'GET' }), {
      cf: {
        cacheEverything: true,
        cacheTtl: 60,
      },
    } as CfRequestInit)

    const contentType = res.headers.get('content-type') ?? ''
    if (res.ok && HTML_CONTENT_TYPE_RE.test(contentType)) {
      if (method === 'HEAD') {
        void res.body?.cancel()
        return new Response(null, {
          status: 404,
          statusText: 'Not Found',
          headers,
        })
      }
      return new Response(res.body, {
        status: 404,
        statusText: 'Not Found',
        headers,
      })
    }

    void res.body?.cancel()
  }

  return new Response(
    method === 'HEAD' ? null : '<!doctype html><html lang="en"><body><h1>404 Not Found</h1></body></html>',
    {
      status: 404,
      statusText: 'Not Found',
      headers,
    },
  )
}

function respondStaticAssetNotFound(
  request: Request,
  url: URL,
  method: string,
): Promise<Response> | Response {
  if (isHtmlDocumentNavigation(request)) {
    return serveEdgeNotFoundHtml(request, url, 'noindex, nofollow')
  }
  return buildStaticAssetNotFoundResponse(method)
}

function shouldRejectStaticAssetUpstream(pathname: string, upstream: Response): boolean {
  if (isUnexpectedHtmlAssetFallback(pathname, upstream.headers.get('content-type'))) {
    return true
  }
  return isStaticNonHtmlAssetPath(pathname) && upstream.status >= 400
}

async function openEdgeCache(): Promise<Cache | undefined> {
  const storage = (globalThis as { caches?: EdgeCacheStorageLike }).caches
  if (!storage) return undefined
  if (typeof storage.open === 'function') {
    return storage.open(EDGE_CACHE_NAME)
  }
  return storage.default
}

function buildEdgeCacheKey(url: URL): Request {
  const normalizedPath = url.pathname === '/' ? '/__root__' : url.pathname
  return new Request(`${url.origin}/assets/__moklu_edge_cache__${normalizedPath}`, {
    method: 'GET',
  })
}

function buildCacheStorageHeaders(source: Headers, ttlSeconds: number): Headers {
  const headers = new Headers()
  const contentType = source.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  const etag = source.get('etag')
  if (etag) headers.set('ETag', etag)
  const lastModified = source.get('last-modified')
  if (lastModified) headers.set('Last-Modified', lastModified)
  headers.set('Cache-Control', `public, max-age=${ttlSeconds}`)
  return headers
}

export const ALLOWED_FUNNEL_EVENTS = new Set<string>([
  'tool_view',
  'image_loaded',
  'export_completed',
  'copy_completed',
  'format_rejected',
  'studio_handoff',
  'pro_cta_clicked',
  'not_found_view',
])

const MAX_BODY_BYTES = 2048
const DEFAULT_ALLOWED_HOSTS = new Set(['moklu.app', 'www.moklu.app', 'localhost', '127.0.0.1'])
const SENSITIVE_VALUE_RE = /^(?:data:|blob:|https?:\/\/|file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i
const SAFE_TOKEN_RE = /[^a-zA-Z0-9._:/+-]/g

const UPSERT_FUNNEL_SQL = `
INSERT INTO funnel_daily (day, event, tool, slug, locale, format, ext, country, total, metric_sum, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?10)
ON CONFLICT (day, event, tool, slug, locale, format, ext, country)
DO UPDATE SET
  total = funnel_daily.total + 1,
  metric_sum = funnel_daily.metric_sum + excluded.metric_sum,
  updated_at = excluded.updated_at
`

function buildTelemetryHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    ...EDGE_SECURITY_HEADERS,
    'Cache-Control': 'no-store',
    ...extra,
  }
}

export function sanitizeEdgeDimension(value: unknown, maxLen = 32, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed || SENSITIVE_VALUE_RE.test(trimmed)) return fallback
  return trimmed.replace(SAFE_TOKEN_RE, '').slice(0, maxLen) || fallback
}

function resolveNumericMetric(props: Record<string, unknown>): number {
  const candidates = [props.count, props.targetKb, props.layerCount, props.savedPct]
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }
  }
  return 0
}

function isAllowedOrigin(request: Request, env: TelemetryWorkerEnv): boolean {
  const extraHosts = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  const allowedHosts = new Set([...DEFAULT_ALLOWED_HOSTS, ...extraHosts])

  const originHeader = request.headers.get('origin')
  if (originHeader) {
    try {
      const originHost = new URL(originHeader).hostname.toLowerCase()
      return allowedHosts.has(originHost)
    } catch {
      return false
    }
  }

  const refererHeader = request.headers.get('referer')
  if (refererHeader) {
    try {
      const refererHost = new URL(refererHeader).hostname.toLowerCase()
      return allowedHosts.has(refererHost)
    } catch {
      return false
    }
  }

  return false
}

async function handleTelemetryEndpoint(
  request: EdgeRequest,
  env: TelemetryWorkerEnv,
  ctx?: ExecutionContextLike,
): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === 'GET' && url.pathname === '/_telemetry/health') {
    return new Response(
      JSON.stringify({ ok: true, service: 'moklu-telemetry', storage: 'd1:moklu-funnel' }),
      {
        status: 200,
        headers: buildTelemetryHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
      },
    )
  }

  if (url.pathname !== '/_telemetry') {
    return new Response('Not Found', { status: 404, headers: buildTelemetryHeaders() })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: buildTelemetryHeaders({ Allow: 'POST' }),
    })
  }

  if (!isAllowedOrigin(request, env)) {
    return new Response('Forbidden', { status: 403, headers: buildTelemetryHeaders() })
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response('Payload Too Large', { status: 413, headers: buildTelemetryHeaders() })
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return new Response('Bad Request', { status: 400, headers: buildTelemetryHeaders() })
  }

  if (!rawText || rawText.length > MAX_BODY_BYTES) {
    return new Response(rawText.length > MAX_BODY_BYTES ? 'Payload Too Large' : 'Bad Request', {
      status: rawText.length > MAX_BODY_BYTES ? 413 : 400,
      headers: buildTelemetryHeaders(),
    })
  }

  let parsed: Record<string, unknown>
  try {
    const json: unknown = JSON.parse(rawText)
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return new Response('Bad Request', { status: 400, headers: buildTelemetryHeaders() })
    }
    parsed = json as Record<string, unknown>
  } catch {
    return new Response('Bad Request', { status: 400, headers: buildTelemetryHeaders() })
  }

  const eventName = typeof parsed.name === 'string' ? parsed.name.trim() : ''
  if (!ALLOWED_FUNNEL_EVENTS.has(eventName)) {
    return new Response('Invalid Event', { status: 400, headers: buildTelemetryHeaders() })
  }

  const props =
    parsed.props && typeof parsed.props === 'object' && !Array.isArray(parsed.props)
      ? (parsed.props as Record<string, unknown>)
      : {}

  const nowIso = new Date().toISOString()
  const day = nowIso.slice(0, 10)
  const tool = sanitizeEdgeDimension(props.tool, 24, 'unknown')
  const slug = sanitizeEdgeDimension(props.slug, 48, 'home')
  const locale = sanitizeEdgeDimension(props.locale, 8, 'en')
  const format = sanitizeEdgeDimension(props.format ?? props.mime, 24, '')
  const ext = sanitizeEdgeDimension(props.ext, 16, '')
  const country = sanitizeEdgeDimension(request.cf?.country, 4, 'XX')
  const metric = resolveNumericMetric(props)

  if (env.DB) {
    const writePromise = env.DB.prepare(UPSERT_FUNNEL_SQL)
      .bind(day, eventName, tool, slug, locale, format, ext, country, metric, nowIso)
      .run()
      .catch(() => undefined)

    if (ctx?.waitUntil) {
      ctx.waitUntil(writePromise)
    } else {
      await writePromise
    }
  }

  return new Response(null, { status: 204, headers: buildTelemetryHeaders() })
}

export default {
  async fetch(
    request: EdgeRequest,
    env: TelemetryWorkerEnv,
    ctx?: ExecutionContextLike,
  ): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/_telemetry' || url.pathname.startsWith('/_telemetry/')) {
      return handleTelemetryEndpoint(request, env, ctx)
    }

    const method = request.method.toUpperCase()
    const isReadMethod = method === 'GET' || method === 'HEAD'

    if (isReadMethod) {
      const redirectPath = resolveExplicitEnRedirectPath(url.pathname)
      if (redirectPath) {
        return new Response(null, {
          status: 301,
          statusText: 'Moved Permanently',
          headers: {
            ...EDGE_SECURITY_HEADERS,
            Location: `${url.origin}${redirectPath}${url.search}`,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }

      if (isUnknownNonAssetPath(url.pathname)) {
        return serveEdgeNotFoundHtml(request, url, 'noindex, follow')
      }
    }

    const edgeCacheTtl = isReadMethod ? resolveEdgeCacheTtlSeconds(url.pathname) : null

    if (edgeCacheTtl === null) {
      const upstream = await fetch(request)
      if (shouldRejectStaticAssetUpstream(url.pathname, upstream)) {
        void upstream.body?.cancel()
        return respondStaticAssetNotFound(request, url, method)
      }
      const edgeResponse = applyMokluEdgeHeaders(upstream, url.pathname)
      if (method === 'HEAD') {
        void edgeResponse.body?.cancel()
        return new Response(null, {
          status: edgeResponse.status,
          statusText: edgeResponse.statusText,
          headers: new Headers(edgeResponse.headers),
        })
      }
      return edgeResponse
    }

    const edgeCache = await openEdgeCache()
    const cacheKey = buildEdgeCacheKey(url)
    if (edgeCache) {
      const cached = await edgeCache.match(cacheKey)
      if (cached) {
        if (shouldRejectStaticAssetUpstream(url.pathname, cached)) {
          void cached.body?.cancel()
          return respondStaticAssetNotFound(request, url, method)
        }
        const hitResponse = applyMokluEdgeHeaders(cached, url.pathname)
        const hitHeaders = new Headers(hitResponse.headers)
        hitHeaders.set('CF-Cache-Status', 'HIT')
        if (method === 'HEAD') {
          void hitResponse.body?.cancel()
          return new Response(null, {
            status: hitResponse.status,
            statusText: hitResponse.statusText,
            headers: hitHeaders,
          })
        }
        return new Response(hitResponse.body, {
          status: hitResponse.status,
          statusText: hitResponse.statusText,
          headers: hitHeaders,
        })
      }
    }

    const originRequest =
      method === 'HEAD' ? new Request(request.url, { method: 'GET' }) : request
    let upstream = await fetch(originRequest, {
      cf: {
        cacheEverything: true,
        cacheTtl: edgeCacheTtl,
      },
    } as CfRequestInit)

    // Self-heal rolling-deploy subrequest cache poisoning: if Cloudflare's internal
    // cf.cacheEverything layer cached a pre-deploy Coolify SPA soft-200 text/html
    // fallback (CF-Cache-Status: HIT) before the new container booted, bypass that
    // stale subrequest entry once and promote the real binary into moklu-edge-v3.
    if (
      isUnexpectedHtmlAssetFallback(url.pathname, upstream.headers.get('content-type')) &&
      (upstream.headers.get('cf-cache-status') ?? '').trim().toUpperCase() === 'HIT'
    ) {
      void upstream.body?.cancel()
      const sep = url.search ? '&' : '?'
      const bypassUrl = `${url.origin}${url.pathname}${url.search}${sep}__moklu_recheck=${Date.now()}`
      upstream = await fetch(new Request(bypassUrl, { method: 'GET' }), {
        cf: {
          cacheEverything: false,
          cacheTtl: -1,
        },
      } as CfRequestInit)
    }

    if (shouldRejectStaticAssetUpstream(url.pathname, upstream)) {
      void upstream.body?.cancel()
      return respondStaticAssetNotFound(request, url, method)
    }

    const edgeResponse = applyMokluEdgeHeaders(upstream, url.pathname)

    if (edgeCache && edgeResponse.status === 200) {
      const cacheHeaders = buildCacheStorageHeaders(edgeResponse.headers, edgeCacheTtl)
      if (method === 'HEAD') {
        const bodyBytes = await edgeResponse.arrayBuffer()
        const cacheable = new Response(bodyBytes, {
          status: 200,
          headers: cacheHeaders,
        })
        await edgeCache.put(cacheKey, cacheable).catch((err) => {
          console.error('[moklu-edge-cache] HEAD put failed', String(err))
        })
        const missHeaders = new Headers(edgeResponse.headers)
        if (missHeaders.get('cf-cache-status') !== 'HIT') {
          missHeaders.set('CF-Cache-Status', 'MISS')
        }
        return new Response(null, {
          status: edgeResponse.status,
          statusText: edgeResponse.statusText,
          headers: missHeaders,
        })
      }

      const cacheable = new Response(edgeResponse.clone().body, {
        status: 200,
        headers: cacheHeaders,
      })
      const putPromise = edgeCache.put(cacheKey, cacheable).catch((err) => {
        console.error('[moklu-edge-cache] GET put failed', String(err))
      })
      if (ctx?.waitUntil) {
        ctx.waitUntil(putPromise)
      } else {
        await putPromise
      }
      const missHeaders = new Headers(edgeResponse.headers)
      if (missHeaders.get('cf-cache-status') !== 'HIT') {
        missHeaders.set('CF-Cache-Status', 'MISS')
      }
      return new Response(edgeResponse.body, {
        status: edgeResponse.status,
        statusText: edgeResponse.statusText,
        headers: missHeaders,
      })
    }

    if (method === 'HEAD') {
      void edgeResponse.body?.cancel()
      return new Response(null, {
        status: edgeResponse.status,
        statusText: edgeResponse.statusText,
        headers: new Headers(edgeResponse.headers),
      })
    }

    return edgeResponse
  },
}
