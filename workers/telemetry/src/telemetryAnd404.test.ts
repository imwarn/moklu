/**
 * [INPUT]: depends on vitest and ./index
 * [OUTPUT]: unit tests verifying unknown-route localized 404.html + X-Robots-Tag crawl hygiene, /healthz.txt no-store passthrough, /_telemetry/health, D1 rollup upsert (format_rejected + not_found_view), and Origin/body security guards
 * [POS]: 404 fallback and D1 funnel ingestion Vitest suite inside workers/telemetry/src alongside index.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { sanitizeEdgeDimension } from './index'

describe('moklu-telemetry unknown-route 404 & D1 funnel ingestion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serves localized 404.html with real HTTP 404, X-Robots-Tag: noindex, follow, no-store, and no edge caching on unknown non-asset routes', async () => {
    const fakeCache = {
      match: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
    }
    vi.stubGlobal('caches', { open: vi.fn(async () => fakeCache) })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const targetUrl = typeof input === 'string' ? input : (input as Request).url
      const pathname = new URL(targetUrl).pathname
      if (pathname === '/healthz.txt') {
        return new Response('ok\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      if (pathname === '/ja/404.html') {
        return new Response('<!doctype html><html lang="ja"><body>ページが見つかりません 404</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      if (pathname === '/zh/404.html') {
        return new Response('<!doctype html><html lang="zh-CN"><body>找不到页面 404</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      return new Response('<!doctype html><html lang="en"><body>Moklu 404 Shell</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'CDN-Cache-Control': 'public, s-maxage=999',
        },
      })
    })

    try {
      const unknownCases: Array<{ url: string; expectedOriginPath: string; expectedBody: string }> = [
        {
          url: 'https://moklu.app/ja/missing-tool',
          expectedOriginPath: '/ja/404.html',
          expectedBody: 'ページが見つかりません 404',
        },
        {
          url: 'https://moklu.app/zh/unknown',
          expectedOriginPath: '/zh/404.html',
          expectedBody: '找不到页面 404',
        },
        {
          url: 'https://moklu.app/studio/unknown-check',
          expectedOriginPath: '/404.html',
          expectedBody: 'Moklu 404 Shell',
        },
        {
          url: 'https://moklu.app/404.html',
          expectedOriginPath: '/404.html',
          expectedBody: 'Moklu 404 Shell',
        },
      ]

      for (const testCase of unknownCases) {
        const beforeCalls = fetchSpy.mock.calls.length
        const unknownRes = await worker.fetch(new Request(testCase.url), {})
        expect(unknownRes.status).toBe(404)
        expect(unknownRes.headers.get('content-type')).toBe('text/html; charset=utf-8')
        expect(unknownRes.headers.get('x-robots-tag')).toBe('noindex, follow')
        expect(unknownRes.headers.get('cache-control')).toBe('no-store')
        expect(unknownRes.headers.get('cdn-cache-control')).toBeNull()
        expect(unknownRes.headers.get('vary')).toBe(
          'Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode',
        )
        expect(unknownRes.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups')
        expect(await unknownRes.text()).toContain(testCase.expectedBody)
        expect(new URL((fetchSpy.mock.calls[beforeCalls][0] as Request).url).pathname).toBe(
          testCase.expectedOriginPath,
        )
        expect(fetchSpy.mock.calls[beforeCalls][1]).toEqual({
          cf: { cacheEverything: true, cacheTtl: 60 },
        })
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

    const notFoundReq = Object.assign(
      new Request('https://moklu.app/_telemetry', {
        method: 'POST',
        headers: {
          Origin: 'https://moklu.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'not_found_view',
          timestamp: 1700000000001,
          props: {
            tool: 'not-found',
            slug: 'assets/non-existent-probe.js',
            locale: 'zh',
            ext: 'js',
          },
        }),
      }),
      { cf: { country: 'JP' } },
    )

    const notFoundRes = await worker.fetch(notFoundReq, { DB: { prepare } }, { waitUntil })
    expect(notFoundRes.status).toBe(204)
    expect(bind).toHaveBeenCalledTimes(2)
    expect(bind.mock.calls[1].slice(1, 9)).toEqual([
      'not_found_view',
      'not-found',
      'assets/non-existent-probe.js',
      'zh',
      '',
      'js',
      'JP',
      0,
    ])
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
