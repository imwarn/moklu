/**
 * [INPUT]: depends on node:fs/promises, vitest, ../../../src/seo/routes, ./headersPolicy, and ./index
 * [OUTPUT]: unit tests verifying byte-for-byte parity with public/_headers, 120-route SSG alignment with src/seo/routes.ts, static-asset soft-200 HTML fallback poisoning guard (404 text/plain, never cached in moklu-edge-v2), canonical 301 /en redirects, unknown-route HTTP 404 + X-Robots-Tag crawl hygiene, cf.cacheEverything origin fetch options, CDN-Cache-Control, COOP, /_telemetry/health, D1 rollup upsert, and security guards
 * [POS]: deterministic Vitest suite for workers/telemetry/src
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ALL_ROUTES } from '../../../src/seo/routes'
import {
  EDGE_SECURITY_HEADERS,
  isKnownSsgHtmlPath,
  isStaticNonHtmlAssetPath,
  isUnexpectedHtmlAssetFallback,
  isUnknownNonAssetPath,
  resolveEdgeCacheControl,
  resolveEdgeCacheTtlSeconds,
  resolveEdgeCdnCacheControl,
  resolveExplicitEnRedirectPath,
} from './headersPolicy'
import worker, { sanitizeEdgeDimension } from './index'

function parsePublicHeadersFile(content: string): Record<string, Record<string, string>> {
  const blocks: Record<string, Record<string, string>> = {}
  let current = ''
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      current = line.trim()
      blocks[current] = blocks[current] ?? {}
      continue
    }
    const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/)
    if (match && current) {
      blocks[current][match[1]] = match[2]
    }
  }
  return blocks
}

describe('moklu-telemetry edge worker, cache policy & CSP header parity', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stays byte-for-byte synchronized with public/_headers security, Cache-Control, and CDN-Cache-Control rules', async () => {
    const raw = await readFile('public/_headers', 'utf8')
    const blocks = parsePublicHeadersFile(raw)
    const globalHeaders = blocks['/*']

    for (const [name, value] of Object.entries(EDGE_SECURITY_HEADERS)) {
      expect(globalHeaders[name]).toBe(value)
    }
    expect(EDGE_SECURITY_HEADERS['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups')
    expect(globalHeaders['Cache-Control']).toBe('public, no-cache')

    const mirroredPaths: Array<[string, string]> = [
      ['/', '/'],
      ['/index.html', '/index.html'],
      ['/healthz.txt', '/healthz.txt'],
      ['/healthz', '/healthz'],
      ['/healthz/', '/healthz/'],
      ['/healthz/index.html', '/healthz/index.html'],
      ['/assets/index-abc.js', '/assets/*'],
      ['/fb6946466b9027e3bbb1506815e0f52e.txt', '/fb6946466b9027e3bbb1506815e0f52e.txt'],
      ['/logo.svg', '/logo.svg'],
      ['/logo-light.svg', '/logo-light.svg'],
      ['/logo-dark.svg', '/logo-dark.svg'],
      ['/logo-mono.svg', '/logo-mono.svg'],
      ['/favicon.svg', '/favicon.svg'],
      ['/apple-touch-icon.png', '/apple-touch-icon.png'],
      ['/og-image.png', '/og-image.png'],
      ['/theme-init.js', '/theme-init.js'],
      ['/sitemap.xml', '/sitemap.xml'],
      ['/robots.txt', '/robots.txt'],
      ['/llms.txt', '/llms.txt'],
      ['/templates/social-card.json', '/templates/*'],
    ]

    for (const [samplePath, blockKey] of mirroredPaths) {
      expect(resolveEdgeCacheControl(samplePath, 200)).toBe(blocks[blockKey]['Cache-Control'])
      expect(resolveEdgeCdnCacheControl(samplePath, 200)).toBe(
        blocks[blockKey]['CDN-Cache-Control'] ?? null,
      )
    }

    expect(blocks['/theme-init.js']['X-Content-Type-Options']).toBe('nosniff')
    expect(resolveEdgeCacheControl('/assets/missing.js', 404)).toBe('no-store')
    expect(resolveEdgeCdnCacheControl('/assets/missing.js', 404)).toBeNull()
    expect(resolveEdgeCacheControl('/', 500)).toBe('no-store')
    expect(resolveEdgeCdnCacheControl('/', 500)).toBeNull()
  })

  it('recognizes all 120 localized SSG routes from src/seo/routes.ts with or without trailing slash', () => {
    expect(ALL_ROUTES).toHaveLength(120)

    for (const route of ALL_ROUTES) {
      const withSlash = route.path
      const withoutSlash = withSlash.length > 1 ? withSlash.replace(/\/$/, '') : withSlash
      for (const candidate of [withSlash, withoutSlash]) {
        expect(isKnownSsgHtmlPath(candidate)).toBe(true)
        expect(isUnknownNonAssetPath(candidate)).toBe(false)
        expect(resolveEdgeCacheControl(candidate, 200)).toBe('public, no-cache')
        expect(resolveEdgeCdnCacheControl(candidate, 200)).toBe(
          'public, s-maxage=60, stale-while-revalidate=86400',
        )
        expect(resolveEdgeCacheTtlSeconds(candidate)).toBe(60)
      }
    }

    expect(isKnownSsgHtmlPath('/studio/unknown-check')).toBe(false)
    expect(isUnknownNonAssetPath('/studio/unknown-check')).toBe(true)
    expect(isKnownSsgHtmlPath('/zh//merge-images/')).toBe(false)
    expect(isUnknownNonAssetPath('/zh//merge-images/')).toBe(true)
    expect(isUnknownNonAssetPath('/ja/non-existent-tool')).toBe(true)
    expect(isUnknownNonAssetPath('/assets/index-abc.js')).toBe(false)
    expect(isUnknownNonAssetPath('/theme-init.js')).toBe(false)
    expect(isUnknownNonAssetPath('/healthz.txt')).toBe(false)
    expect(isUnknownNonAssetPath('/missing.js')).toBe(false)

    // Static non-HTML asset path detection and HTML fallback poisoning detection
    expect(isStaticNonHtmlAssetPath('/assets/missing.js')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/assets/no-ext')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/templates/social.json')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/foo/bar.WASM')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/foo/bar.webp')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/manifest.webmanifest')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/healthz')).toBe(false)
    expect(isStaticNonHtmlAssetPath('/healthz/index.html')).toBe(false)
    expect(isStaticNonHtmlAssetPath('/studio/index.html')).toBe(false)
    expect(isStaticNonHtmlAssetPath('/zh/merge-images/')).toBe(false)

    expect(isUnexpectedHtmlAssetFallback('/assets/missing.js', 'text/html; charset=utf-8')).toBe(true)
    expect(isUnexpectedHtmlAssetFallback('/assets/missing.js', '  TEXT/HTML ')).toBe(true)
    expect(isUnexpectedHtmlAssetFallback('/assets/index-abc.js', 'application/javascript')).toBe(false)
    expect(isUnexpectedHtmlAssetFallback('/studio/', 'text/html; charset=utf-8')).toBe(false)
    expect(isUnexpectedHtmlAssetFallback('/healthz/index.html', 'text/html; charset=utf-8')).toBe(false)

    // Explicit /en canonical 301 redirect resolution
    expect(resolveExplicitEnRedirectPath('/en')).toBe('/')
    expect(resolveExplicitEnRedirectPath('/en/')).toBe('/')
    expect(resolveExplicitEnRedirectPath('/en/merge-images')).toBe('/merge-images/')
    expect(resolveExplicitEnRedirectPath('/en/merge-images/')).toBe('/merge-images/')
    expect(resolveExplicitEnRedirectPath('/en/studio')).toBe('/studio/')
    expect(resolveExplicitEnRedirectPath('/en/non-existent')).toBeNull()
    expect(resolveExplicitEnRedirectPath('/en/tools/merge-images/')).toBeNull()
    expect(resolveExplicitEnRedirectPath('/zh/merge-images/')).toBeNull()
  })

  it('proxies known SSG HTML routes with bfcache-safe public, no-cache, CDN-Cache-Control, COOP, and cf.cacheEverything (60s)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () =>
          new Response('<!doctype html><html></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }),
      )

    for (const [method, url] of [
      ['GET', 'https://moklu.app/'],
      ['HEAD', 'https://moklu.app/zh/merge-images/'],
      ['GET', 'https://moklu.app/studio/'],
    ] as const) {
      const res = await worker.fetch(new Request(url, { method }), {})
      expect(res.status).toBe(200)
      expect(res.headers.get('content-security-policy')).toContain("'wasm-unsafe-eval'")
      expect(res.headers.get('x-frame-options')).toBe('DENY')
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
      expect(res.headers.get('cache-control')).toBe('public, no-cache')
      expect(res.headers.get('cdn-cache-control')).toBe(
        'public, s-maxage=60, stale-while-revalidate=86400',
      )
      expect(res.headers.get('x-robots-tag')).toBeNull()
    }

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    for (const call of fetchSpy.mock.calls) {
      expect(call[1]).toEqual({
        cf: {
          cacheEverything: true,
          cacheTtl: 60,
        },
      })
    }
    // HEAD requests normalize to GET for upstream cache warmup/hits while returning empty body
    expect((fetchSpy.mock.calls[1][0] as Request).method).toBe('GET')
  })

  it('caches GET and HEAD responses in isolated caches.open(moklu-edge-v2) namespace with MISS -> HIT transition', async () => {
    const store = new Map<string, Response>()
    const fakeCache = {
      match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
      put: vi.fn(async (req: Request, res: Response) => {
        store.set(req.url, res.clone())
      }),
    }
    const openSpy = vi.fn(async () => fakeCache)
    vi.stubGlobal('caches', { open: openSpy })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', Vary: 'Accept-Encoding' },
      }),
    )

    try {
      const first = await worker.fetch(new Request('https://moklu.app/', { method: 'HEAD' }), {})
      expect(first.status).toBe(200)
      expect(first.headers.get('cf-cache-status')).toBe('MISS')
      expect(first.headers.get('cache-control')).toBe('public, no-cache')
      expect(first.headers.get('cdn-cache-control')).toBe(
        'public, s-maxage=60, stale-while-revalidate=86400',
      )
      expect(openSpy).toHaveBeenCalledWith('moklu-edge-v2')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fakeCache.put).toHaveBeenCalledTimes(1)

      const second = await worker.fetch(new Request('https://moklu.app/', { method: 'HEAD' }), {})
      expect(second.status).toBe(200)
      expect(second.headers.get('cf-cache-status')).toBe('HIT')
      expect(second.headers.get('cache-control')).toBe('public, no-cache')
      expect(second.headers.get('cdn-cache-control')).toBe(
        'public, s-maxage=60, stale-while-revalidate=86400',
      )
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('rejects /assets/* soft-200 HTML fallbacks and upstream 4xx with 404 text/plain, no-store, and never poisons moklu-edge-v2 cache', async () => {
    const store = new Map<string, Response>()
    const fakeCache = {
      match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
      put: vi.fn(async (req: Request, res: Response) => {
        store.set(req.url, res.clone())
      }),
    }
    const openSpy = vi.fn(async () => fakeCache)
    vi.stubGlobal('caches', { open: openSpy })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const targetUrl = typeof input === 'string' ? input : (input as Request).url
      if (targetUrl.endsWith('/assets/index-abc.js')) {
        return new Response('console.log("ok")', {
          status: 200,
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        })
      }
      if (targetUrl.endsWith('/assets/missing.css')) {
        return new Response('upstream missing', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      // Simulates Coolify Caddy/Nginx SPA try_files returning 200 text/html for missing static assets
      return new Response('<!doctype html><html><body>SPA shell</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    })

    try {
      // Missing hashed asset returning 200 text/html -> 404 text/plain, NOT cached
      const missingGet = await worker.fetch(new Request('https://moklu.app/assets/missing.js'), {})
      expect(missingGet.status).toBe(404)
      expect(missingGet.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(missingGet.headers.get('cache-control')).toBe('no-store')
      expect(missingGet.headers.get('cdn-cache-control')).toBeNull()
      expect(missingGet.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(missingGet.headers.get('content-security-policy')).toContain("default-src 'self'")
      expect(missingGet.headers.get('x-content-type-options')).toBe('nosniff')
      expect(await missingGet.text()).toBe('Not Found')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // HEAD on missing hashed asset -> 404 text/plain with empty body, NOT cached
      const missingHead = await worker.fetch(
        new Request('https://moklu.app/assets/missing.js', { method: 'HEAD' }),
        {},
      )
      expect(missingHead.status).toBe(404)
      expect(missingHead.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(missingHead.headers.get('cache-control')).toBe('no-store')
      expect(missingHead.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(await missingHead.text()).toBe('')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Upstream 404 on /assets/* -> clean 404 text/plain, NOT cached
      const missingCss = await worker.fetch(new Request('https://moklu.app/assets/missing.css'), {})
      expect(missingCss.status).toBe(404)
      expect(missingCss.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(missingCss.headers.get('cache-control')).toBe('no-store')
      expect(missingCss.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Non-/assets/ static extension returning 200 text/html -> clean 404 text/plain
      const rootMissingJs = await worker.fetch(new Request('https://moklu.app/missing.js'), {})
      expect(rootMissingJs.status).toBe(404)
      expect(rootMissingJs.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(rootMissingJs.headers.get('cache-control')).toBe('no-store')
      expect(rootMissingJs.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Valid /assets/index-abc.js (application/javascript) -> 200 immutable + MISS -> HIT in moklu-edge-v2
      const validFirst = await worker.fetch(new Request('https://moklu.app/assets/index-abc.js'), {})
      expect(validFirst.status).toBe(200)
      expect(validFirst.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
      expect(validFirst.headers.get('cdn-cache-control')).toBe('public, max-age=31536000, immutable')
      expect(validFirst.headers.get('cf-cache-status')).toBe('MISS')
      expect(await validFirst.text()).toBe('console.log("ok")')
      expect(openSpy).toHaveBeenCalledWith('moklu-edge-v2')
      expect(fakeCache.put).toHaveBeenCalledTimes(1)

      const fetchCountAfterValidFirst = fetchSpy.mock.calls.length
      const validSecond = await worker.fetch(new Request('https://moklu.app/assets/index-abc.js'), {})
      expect(validSecond.status).toBe(200)
      expect(validSecond.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
      expect(validSecond.headers.get('cf-cache-status')).toBe('HIT')
      expect(fetchSpy).toHaveBeenCalledTimes(fetchCountAfterValidFirst)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('returns canonical 301 redirects for explicit /en and /en/<known-slug> before origin fetch while letting /en/non-existent 404', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html><html><body>404 UI</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    )

    const redirectCases: Array<[string, string, string]> = [
      ['GET', 'https://moklu.app/en', 'https://moklu.app/'],
      ['GET', 'https://moklu.app/en/?utm_source=test', 'https://moklu.app/?utm_source=test'],
      ['GET', 'https://moklu.app/en/merge-images', 'https://moklu.app/merge-images/'],
      ['HEAD', 'https://moklu.app/en/merge-images/?ref=nav', 'https://moklu.app/merge-images/?ref=nav'],
    ]

    for (const [method, url, expectedLocation] of redirectCases) {
      const res = await worker.fetch(new Request(url, { method }), {})
      expect(res.status).toBe(301)
      expect(res.headers.get('location')).toBe(expectedLocation)
      expect(res.headers.get('cache-control')).toBe('public, max-age=3600')
      expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
      expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
    }
    expect(fetchSpy).not.toHaveBeenCalled()

    // /en/non-existent falls through to origin and returns real HTTP 404 HTML
    const invalidEn = await worker.fetch(new Request('https://moklu.app/en/non-existent'), {})
    expect(invalidEn.status).toBe(404)
    expect(invalidEn.headers.get('x-robots-tag')).toBe('noindex, follow')
    expect(invalidEn.headers.get('cache-control')).toBe('no-store')
    expect(await invalidEn.text()).toContain('404 UI')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('passes path-matched cf.cacheEverything TTLs for /assets/*, /theme-init.js, /sitemap.xml, and IndexNow key', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () =>
          new Response('ok', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
          }),
      )

    const cases: Array<{
      path: string
      ttl: number
      cacheControl: string
      cdnCacheControl: string
    }> = [
      {
        path: '/assets/index-abc123.js',
        ttl: 31536000,
        cacheControl: 'public, max-age=31536000, immutable',
        cdnCacheControl: 'public, max-age=31536000, immutable',
      },
      {
        path: '/theme-init.js',
        ttl: 3600,
        cacheControl: 'public, max-age=3600',
        cdnCacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      {
        path: '/sitemap.xml',
        ttl: 3600,
        cacheControl: 'public, max-age=3600',
        cdnCacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      {
        path: '/fb6946466b9027e3bbb1506815e0f52e.txt',
        ttl: 86400,
        cacheControl: 'public, max-age=86400',
        cdnCacheControl: 'public, s-maxage=86400',
      },
    ]

    for (const [idx, testCase] of cases.entries()) {
      const res = await worker.fetch(new Request(`https://moklu.app${testCase.path}`), {})
      expect(res.status).toBe(200)
      expect(res.headers.get('cache-control')).toBe(testCase.cacheControl)
      expect(res.headers.get('cdn-cache-control')).toBe(testCase.cdnCacheControl)
      expect(res.headers.get('x-robots-tag')).toBeNull()
      expect(fetchSpy.mock.calls[idx][1]).toEqual({
        cf: {
          cacheEverything: true,
          cacheTtl: testCase.ttl,
        },
      })
    }
  })

  it('returns real HTTP 404 on unknown non-asset routes while preserving HTML body, X-Robots-Tag: noindex, follow, no-store, and no caching', async () => {
    const fakeCache = {
      match: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
    }
    vi.stubGlobal('caches', { open: vi.fn(async () => fakeCache) })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const targetUrl = typeof input === 'string' ? input : (input as Request).url
      if (targetUrl.endsWith('/healthz.txt')) {
        return new Response('ok\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      return new Response('<!doctype html><html><body>Moklu 404 Shell</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'CDN-Cache-Control': 'public, s-maxage=999',
        },
      })
    })

    try {
      for (const unknownUrl of [
        'https://moklu.app/studio/unknown-check',
        'https://moklu.app/zh/unknown',
        'https://moklu.app/merge-image',
      ]) {
        const unknownRes = await worker.fetch(new Request(unknownUrl), {})
        expect(unknownRes.status).toBe(404)
        expect(unknownRes.headers.get('content-type')).toBe('text/html; charset=utf-8')
        expect(unknownRes.headers.get('x-robots-tag')).toBe('noindex, follow')
        expect(unknownRes.headers.get('cache-control')).toBe('no-store')
        expect(unknownRes.headers.get('cdn-cache-control')).toBeNull()
        expect(unknownRes.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
        expect(await unknownRes.text()).toContain('Moklu 404 Shell')
      }

      const headUnknown = await worker.fetch(
        new Request('https://moklu.app/studio/unknown-check', { method: 'HEAD' }),
        {},
      )
      expect(headUnknown.status).toBe(404)
      expect(headUnknown.headers.get('x-robots-tag')).toBe('noindex, follow')
      expect(headUnknown.headers.get('cache-control')).toBe('no-store')
      expect(await headUnknown.text()).toBe('')
      expect(fakeCache.put).not.toHaveBeenCalled()
      expect(fetchSpy.mock.calls[0]).toHaveLength(1)

      const healthRes = await worker.fetch(new Request('https://moklu.app/healthz.txt'), {})
      expect(healthRes.status).toBe(200)
      expect(healthRes.headers.get('cache-control')).toBe('no-store')
      expect(healthRes.headers.get('cdn-cache-control')).toBeNull()
      expect(healthRes.headers.get('x-robots-tag')).toBeNull()
      expect(await healthRes.text()).toBe('ok\n')

      const postRes = await worker.fetch(new Request('https://moklu.app/', { method: 'POST' }), {})
      expect(postRes.status).toBe(200)
      expect(fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]).toHaveLength(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('responds 200 JSON with no-store, COOP, and CSP on GET /_telemetry/health', async () => {
    const res = await worker.fetch(new Request('https://moklu.app/_telemetry/health'), {})
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
    expect(await res.json()).toEqual({
      ok: true,
      service: 'moklu-telemetry',
      storage: 'd1:moklu-funnel',
    })
  })

  it('accepts valid same-origin POST /_telemetry and upserts daily D1 aggregate via waitUntil', async () => {
    const run = vi.fn(async () => ({}))
    const bind = vi.fn((...args: unknown[]) => {
      void args
      return { run }
    })
    const prepare = vi.fn(() => ({ bind }))
    const waitUntil = vi.fn((p: Promise<unknown>) => {
      void p
    })

    const req = Object.assign(
      new Request('https://moklu.app/_telemetry', {
        method: 'POST',
        headers: {
          Origin: 'https://moklu.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'format_rejected',
          timestamp: 1700000000000,
          props: {
            tool: 'compress',
            slug: 'heic-to-jpg',
            locale: 'zh',
            mime: 'image/vnd.adobe.photoshop',
            ext: 'psd',
            count: 2,
            filename: 'secret-client-contract.psd',
          },
        }),
      }),
      { cf: { country: 'CN' } },
    )

    const res = await worker.fetch(req, { DB: { prepare } }, { waitUntil })
    expect(res.status).toBe(204)
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(bind).toHaveBeenCalledTimes(1)
    const boundArgs = bind.mock.calls[0]
    expect(boundArgs.slice(1, 9)).toEqual([
      'format_rejected',
      'compress',
      'heic-to-jpg',
      'zh',
      'image/vnd.adobe.photosho',
      'psd',
      'CN',
      2,
    ])
    expect(waitUntil).toHaveBeenCalledTimes(1)
  })

  it('rejects missing/evil Origin, invalid methods, unknown events, and oversized bodies', async () => {
    const noOrigin = new Request('https://moklu.app/_telemetry', {
      method: 'POST',
      body: JSON.stringify({ name: 'tool_view', props: { tool: 'mockup' } }),
    })
    expect((await worker.fetch(noOrigin, {})).status).toBe(403)

    const evilOrigin = new Request('https://moklu.app/_telemetry', {
      method: 'POST',
      headers: { Origin: 'https://evil.example.com' },
      body: JSON.stringify({ name: 'tool_view', props: { tool: 'mockup' } }),
    })
    expect((await worker.fetch(evilOrigin, {})).status).toBe(403)

    expect((await worker.fetch(new Request('https://moklu.app/_telemetry'), {})).status).toBe(405)

    const unknownEvent = new Request('https://moklu.app/_telemetry', {
      method: 'POST',
      headers: { Origin: 'https://moklu.app' },
      body: JSON.stringify({ name: 'exfiltrate', props: {} }),
    })
    expect((await worker.fetch(unknownEvent, {})).status).toBe(400)

    const huge = new Request('https://moklu.app/_telemetry', {
      method: 'POST',
      headers: { Origin: 'https://moklu.app' },
      body: JSON.stringify({ name: 'tool_view', props: { pad: 'x'.repeat(3000) } }),
    })
    expect((await worker.fetch(huge, {})).status).toBe(413)

    expect(sanitizeEdgeDimension('https://moklu.app/secret', 32, 'fallback')).toBe('fallback')
    expect(sanitizeEdgeDimension('/Users/alice/id.jpg', 32, 'fallback')).toBe('fallback')
  })
})
