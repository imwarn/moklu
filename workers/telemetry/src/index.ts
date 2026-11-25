/**
 * [INPUT]: depends on WinterCG Fetch/Cache APIs, Cloudflare D1Database interface, and ./headersPolicy (EDGE_SECURITY_HEADERS, applyMokluEdgeHeaders, resolveEdgeCacheTtlSeconds)
 * [OUTPUT]: exports D1DatabaseLike, TelemetryWorkerEnv, ExecutionContextLike, ALLOWED_FUNNEL_EVENTS, sanitizeEdgeDimension, and default Worker fetch handler
 * [POS]: edge entry point of workers/telemetry; serves moklu.app/_telemetry* zero-PII D1 funnel ingestion AND proxies Coolify origin responses with isolated Cloudflare Cache API (`caches.open`) + `cf.cacheEverything` edge caching, public/_headers CSP/COOP, CDN-Cache-Control, and unknown-route noindex hygiene
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import {
  EDGE_SECURITY_HEADERS,
  applyMokluEdgeHeaders,
  resolveEdgeCacheTtlSeconds,
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
  cacheEverything: true
  cacheTtl: number
}

interface EdgeCacheStorageLike {
  open?: (cacheName: string) => Promise<Cache>
  default?: Cache
}

type EdgeRequest = Request & { cf?: CfRequestMetadata }
type CfRequestInit = RequestInit & { cf?: CfFetchCacheOptions }

const EDGE_CACHE_NAME = 'moklu-edge-v1'

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
    const edgeCacheTtl = isReadMethod ? resolveEdgeCacheTtlSeconds(url.pathname) : null

    if (edgeCacheTtl === null) {
      const upstream = await fetch(request)
      return applyMokluEdgeHeaders(upstream, url.pathname)
    }

    const edgeCache = await openEdgeCache()
    const cacheKey = buildEdgeCacheKey(url)
    if (edgeCache) {
      const cached = await edgeCache.match(cacheKey)
      if (cached) {
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
    const upstream = await fetch(originRequest, {
      cf: {
        cacheEverything: true,
        cacheTtl: edgeCacheTtl,
      },
    } as CfRequestInit)

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
