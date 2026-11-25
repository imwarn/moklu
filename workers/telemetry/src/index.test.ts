/**
 * [INPUT]: depends on node:fs/promises, vitest, ../../../src/seo/routes, ./headersPolicy, and ./index
 * [OUTPUT]: unit tests verifying byte-for-byte parity with public/_headers, 120-route SSG alignment with src/seo/routes.ts, cf.cacheEverything origin fetch options, CDN-Cache-Control, COOP, unknown-route X-Robots-Tag crawl hygiene, /_telemetry/health, D1 rollup upsert, and security guards
 * [POS]: deterministic Vitest suite for workers/telemetry/src
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ALL_ROUTES } from '../../../src/seo/routes'
import {
  EDGE_SECURITY_HEADERS,
  isKnownSsgHtmlPath,
  isUnknownNonAssetPath,
  resolveEdgeCacheControl,
  resolveEdgeCacheTtlSeconds,
  resolveEdgeCdnCacheControl,
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

  it('caches GET and HEAD responses in isolated caches.open namespace with MISS -> HIT transition', async () => {
    const store = new Map<string, Response>()
    const fakeCache = {
      match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
      put: vi.fn(async (req: Request, res: Response) => {
        store.set(req.url, res.clone())
      }),
    }
    vi.stubGlobal('caches', { open: vi.fn(async () => fakeCache) })

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

  it('passes path-matched cf.cacheEverything TTLs for /assets/*, /theme-init.js, /sitemap.xml, and IndexNow key', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('ok', { status: 200 }))

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

  it('preserves 200 SPA fallback on unknown routes with X-Robots-Tag: noindex, follow, Cache-Control: no-store, and no cf.cacheEverything', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'CDN-Cache-Control': 'public, s-maxage=999',
          },
        }),
    )

    const unknownRes = await worker.fetch(new Request('https://moklu.app/studio/unknown-check'), {})
    expect(unknownRes.status).toBe(200)
    expect(unknownRes.headers.get('x-robots-tag')).toBe('noindex, follow')
    expect(unknownRes.headers.get('cache-control')).toBe('no-store')
    expect(unknownRes.headers.get('cdn-cache-control')).toBeNull()
    expect(unknownRes.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
    expect(fetchSpy.mock.calls[0]).toHaveLength(1)

    const healthRes = await worker.fetch(new Request('https://moklu.app/healthz.txt'), {})
    expect(healthRes.status).toBe(200)
    expect(healthRes.headers.get('cache-control')).toBe('no-store')
    expect(healthRes.headers.get('cdn-cache-control')).toBeNull()
    expect(healthRes.headers.get('x-robots-tag')).toBeNull()
    expect(fetchSpy.mock.calls[1]).toHaveLength(1)

    const postRes = await worker.fetch(new Request('https://moklu.app/', { method: 'POST' }), {})
    expect(postRes.status).toBe(200)
    expect(fetchSpy.mock.calls[2]).toHaveLength(1)
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
