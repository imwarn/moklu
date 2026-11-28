/**
 * [INPUT]: depends on node:fs/promises, vitest, ../../../src/seo/routes, ./headersPolicy, and ./index
 * [OUTPUT]: unit tests verifying byte-for-byte parity with public/_headers, 140-route SSG alignment with src/seo/routes.ts, immutable /models/* (.onnx) caching and HTML-fallback poisoning guards, HTML document navigation & 4-locale 404.html content negotiation (browser HTML 404 vs subresource 404 text/plain, never cached in moklu-edge-v3), canonical 301 /en redirects, cf.cacheEverything origin fetch options, CDN-Cache-Control, and COOP
 * [POS]: deterministic edge caching and header-policy Vitest suite inside workers/telemetry/src alongside telemetryAnd404.test.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ALL_ROUTES } from '../../../src/seo/routes'
import {
  EDGE_SECURITY_HEADERS,
  isHtmlDocumentNavigation,
  isKnownSsgHtmlPath,
  isStaticNonHtmlAssetPath,
  isUnexpectedHtmlAssetFallback,
  isUnknownNonAssetPath,
  resolveEdgeCacheControl,
  resolveEdgeCacheTtlSeconds,
  resolveEdgeCdnCacheControl,
  resolveEdgeNotFoundLocale,
  resolveExplicitEnRedirectPath,
  resolveOriginNotFoundHtmlPath,
} from './headersPolicy'
import worker from './index'

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

function createFakeCache() {
  const store = new Map<string, Response>()
  const fakeCache = {
    match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
    put: vi.fn(async (req: Request, res: Response) => {
      store.set(req.url, res.clone())
    }),
  }
  const openSpy = vi.fn(async () => fakeCache)
  vi.stubGlobal('caches', { open: openSpy })
  return { fakeCache, openSpy }
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
      ['/models/modnet-fp16.onnx', '/models/*'],
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
    expect(blocks['/models/*']['X-Content-Type-Options']).toBe('nosniff')
    expect(resolveEdgeCacheControl('/assets/missing.js', 404)).toBe('no-store')
    expect(resolveEdgeCdnCacheControl('/assets/missing.js', 404)).toBeNull()
    expect(resolveEdgeCacheControl('/models/missing.onnx', 404)).toBe('no-store')
    expect(resolveEdgeCdnCacheControl('/models/missing.onnx', 404)).toBeNull()
    expect(resolveEdgeCacheControl('/', 500)).toBe('no-store')
    expect(resolveEdgeCdnCacheControl('/', 500)).toBeNull()
  })

  it('recognizes all 140 localized SSG routes from src/seo/routes.ts with or without trailing slash', () => {
    expect(ALL_ROUTES).toHaveLength(140)

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
    expect(isUnknownNonAssetPath('/models/modnet-fp16.onnx')).toBe(false)
    expect(isUnknownNonAssetPath('/theme-init.js')).toBe(false)
    expect(isUnknownNonAssetPath('/healthz.txt')).toBe(false)
    expect(isUnknownNonAssetPath('/missing.js')).toBe(false)

    // Static non-HTML asset path detection and HTML fallback poisoning detection
    expect(isStaticNonHtmlAssetPath('/assets/missing.js')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/assets/no-ext')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/models/modnet-fp16.onnx')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/models/no-ext')).toBe(true)
    expect(isStaticNonHtmlAssetPath('/custom/model.ONNX')).toBe(true)
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
    expect(isUnexpectedHtmlAssetFallback('/models/modnet-fp16.onnx', 'text/html; charset=utf-8')).toBe(true)
    expect(isUnexpectedHtmlAssetFallback('/models/modnet-fp16.onnx', 'application/octet-stream')).toBe(false)
    expect(isUnexpectedHtmlAssetFallback('/assets/index-abc.js', 'application/javascript')).toBe(false)
    expect(isUnexpectedHtmlAssetFallback('/studio/', 'text/html; charset=utf-8')).toBe(false)
    expect(isUnexpectedHtmlAssetFallback('/healthz/index.html', 'text/html; charset=utf-8')).toBe(false)

    // Explicit /en canonical 301 redirect resolution
    expect(resolveExplicitEnRedirectPath('/en')).toBe('/')
    expect(resolveExplicitEnRedirectPath('/en/')).toBe('/')
    expect(resolveExplicitEnRedirectPath('/en/merge-images')).toBe('/merge-images/')
    expect(resolveExplicitEnRedirectPath('/en/merge-images/')).toBe('/merge-images/')
    expect(resolveExplicitEnRedirectPath('/en/passport-photo-maker')).toBe('/passport-photo-maker/')
    expect(resolveExplicitEnRedirectPath('/en/id-photo-background-changer/')).toBe('/id-photo-background-changer/')
    expect(resolveExplicitEnRedirectPath('/en/id-photo-print-sheet')).toBe('/id-photo-print-sheet/')
    expect(resolveExplicitEnRedirectPath('/en/studio')).toBe('/studio/')
    expect(resolveExplicitEnRedirectPath('/en/non-existent')).toBeNull()
    expect(resolveExplicitEnRedirectPath('/en/tools/merge-images/')).toBeNull()
    expect(resolveExplicitEnRedirectPath('/zh/merge-images/')).toBeNull()

    // HTML document navigation detection (Sec-Fetch-* + Accept fallback)
    const navCases: Array<[string, Record<string, string>, boolean]> = [
      ['GET', { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', Accept: 'text/html,*/*;q=0.8' }, true],
      ['HEAD', { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' }, true],
      ['POST', { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', Accept: 'text/html' }, false],
      ['GET', { 'Sec-Fetch-Dest': 'script', Accept: 'text/html,*/*' }, false],
      ['GET', { 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Mode': 'navigate' }, true],
      ['GET', { Accept: 'text/html,application/xhtml+xml' }, true],
      ['GET', { Accept: '*/*' }, false],
      ['GET', { 'Sec-Fetch-Mode': 'cors', Accept: 'text/html' }, false],
    ]
    for (const [method, headers, expected] of navCases) {
      expect(
        isHtmlDocumentNavigation(new Request('https://moklu.app/assets/non-existent-probe.js', { method, headers })),
      ).toBe(expected)
    }
    for (const nonDocDest of ['script', 'style', 'image', 'font', 'worker', 'manifest', 'empty']) {
      expect(
        isHtmlDocumentNavigation(
          new Request('https://moklu.app/assets/non-existent-probe.js', {
            headers: { 'Sec-Fetch-Dest': nonDocDest, 'Sec-Fetch-Mode': 'no-cors', Accept: '*/*' },
          }),
        ),
      ).toBe(false)
    }

    // 4-locale 404.html resolution (URL prefix > Accept-Language q-weight > en)
    const localeCases: Array<[string, string | null, string]> = [
      ['/zh/missing', 'ja-JP,ja;q=0.9', 'zh'],
      ['/ja/missing-tool?from=nav', 'zh-CN', 'ja'],
      ['/ko/missing', null, 'ko'],
      ['/en/non-existent', 'zh-CN,zh;q=0.9', 'en'],
      ['/assets/non-existent-probe.js', 'zh-CN,zh;q=0.9,en;q=0.8', 'zh'],
      ['/assets/non-existent-probe.js', 'en;q=0.5,ko-KR;q=0.9', 'ko'],
      ['/assets/non-existent-probe.js', 'fr-FR;q=0.9,ja-JP;q=0.8', 'ja'],
      ['/assets/non-existent-probe.js', 'ko;q=0.8,ja;q=0.8', 'ko'],
      ['/assets/non-existent-probe.js', 'zh;q=0,ja;q=0.5', 'ja'],
      ['/assets/non-existent-probe.js', 'fr-FR,de;q=0.9', 'en'],
      ['/assets/non-existent-probe.js', null, 'en'],
    ]
    for (const [path, acceptLang, expected] of localeCases) {
      expect(resolveEdgeNotFoundLocale(path, acceptLang)).toBe(expected)
    }
    expect(resolveOriginNotFoundHtmlPath('en')).toBe('/404.html')
    expect(resolveOriginNotFoundHtmlPath('zh')).toBe('/zh/404.html')
    expect(resolveOriginNotFoundHtmlPath('ja')).toBe('/ja/404.html')
    expect(resolveOriginNotFoundHtmlPath('ko')).toBe('/ko/404.html')
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

  it('caches GET and HEAD responses in isolated caches.open(moklu-edge-v3) namespace with MISS -> HIT transition', async () => {
    const { fakeCache, openSpy } = createFakeCache()

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
      expect(openSpy).toHaveBeenCalledWith('moklu-edge-v3')
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

  it('negotiates /assets/* missing responses: subresource/curl get 404 text/plain, browser navigation gets localized 404.html, never cached in moklu-edge-v3', async () => {
    const { fakeCache, openSpy } = createFakeCache()

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const targetUrl = typeof input === 'string' ? input : (input as Request).url
      const pathname = new URL(targetUrl).pathname
      if (pathname === '/assets/index-abc.js') {
        return new Response('console.log("ok")', {
          status: 200,
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        })
      }
      if (pathname === '/assets/missing.css') {
        return new Response('upstream missing', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      if (pathname === '/zh/404.html') {
        return new Response('<!doctype html><html lang="zh-CN"><body>找不到页面 404</body></html>', {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'CDN-Cache-Control': 'public, s-maxage=60',
          },
        })
      }
      if (pathname === '/404.html') {
        return new Response('<!doctype html><html lang="en"><body>English 404 Page</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
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
      // Subresource <script> to /assets/non-existent-probe.js -> 404 text/plain, NOT cached
      const scriptMissing = await worker.fetch(
        new Request('https://moklu.app/assets/non-existent-probe.js', {
          headers: { 'Sec-Fetch-Dest': 'script', Accept: '*/*' },
        }),
        {},
      )
      expect(scriptMissing.status).toBe(404)
      expect(scriptMissing.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(scriptMissing.headers.get('cache-control')).toBe('no-store')
      expect(scriptMissing.headers.get('cdn-cache-control')).toBeNull()
      expect(scriptMissing.headers.get('vary')).toBe('Accept, Sec-Fetch-Dest, Sec-Fetch-Mode')
      expect(scriptMissing.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(scriptMissing.headers.get('content-security-policy')).toContain("default-src 'self'")
      expect(scriptMissing.headers.get('x-content-type-options')).toBe('nosniff')
      expect(await scriptMissing.text()).toBe('Not Found')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // curl (Accept: */*) to /assets/non-existent-probe.js -> 404 text/plain, NOT cached
      const curlMissing = await worker.fetch(
        new Request('https://moklu.app/assets/non-existent-probe.js', {
          headers: { Accept: '*/*' },
        }),
        {},
      )
      expect(curlMissing.status).toBe(404)
      expect(curlMissing.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(curlMissing.headers.get('cache-control')).toBe('no-store')
      expect(curlMissing.headers.get('vary')).toBe('Accept, Sec-Fetch-Dest, Sec-Fetch-Mode')
      expect(curlMissing.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(await curlMissing.text()).toBe('Not Found')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Browser HTML navigation with Accept-Language: zh-CN -> fetches /zh/404.html and returns 404 text/html, NOT cached
      const browserNavMissing = await worker.fetch(
        new Request('https://moklu.app/assets/non-existent-probe.js', {
          headers: {
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          },
        }),
        {},
      )
      expect(browserNavMissing.status).toBe(404)
      expect(browserNavMissing.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(browserNavMissing.headers.get('cache-control')).toBe('no-store')
      expect(browserNavMissing.headers.get('cdn-cache-control')).toBeNull()
      expect(browserNavMissing.headers.get('vary')).toBe(
        'Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode',
      )
      expect(browserNavMissing.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(browserNavMissing.headers.get('content-security-policy')).toContain("default-src 'self'")
      expect(await browserNavMissing.text()).toContain('找不到页面 404')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Subsequent <script> request to the same URL still gets 404 text/plain (no cross-type cache pollution)
      const scriptAfterNav = await worker.fetch(
        new Request('https://moklu.app/assets/non-existent-probe.js', {
          headers: { 'Sec-Fetch-Dest': 'script', Accept: '*/*' },
        }),
        {},
      )
      expect(scriptAfterNav.status).toBe(404)
      expect(scriptAfterNav.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(await scriptAfterNav.text()).toBe('Not Found')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // HEAD on missing hashed asset (non-navigation) -> 404 text/plain with empty body, NOT cached
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

      // HEAD on missing hashed asset (browser navigation) -> 404 text/html with empty body
      const missingNavHead = await worker.fetch(
        new Request('https://moklu.app/assets/non-existent-probe.js', {
          method: 'HEAD',
          headers: { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' },
        }),
        {},
      )
      expect(missingNavHead.status).toBe(404)
      expect(missingNavHead.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(missingNavHead.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(await missingNavHead.text()).toBe('')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Upstream 404 on /assets/* -> clean 404 text/plain for subresource, NOT cached
      const missingCss = await worker.fetch(new Request('https://moklu.app/assets/missing.css'), {})
      expect(missingCss.status).toBe(404)
      expect(missingCss.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(missingCss.headers.get('cache-control')).toBe('no-store')
      expect(missingCss.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Non-/assets/ static extension returning 200 text/html -> 404 text/plain for subresource, 404 HTML for navigation
      const missingModelSubresource = await worker.fetch(
        new Request('https://moklu.app/models/missing.onnx', {
          headers: { 'Sec-Fetch-Dest': 'empty', Accept: '*/*' },
        }),
        {},
      )
      expect(missingModelSubresource.status).toBe(404)
      expect(missingModelSubresource.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(missingModelSubresource.headers.get('cache-control')).toBe('no-store')
      expect(missingModelSubresource.headers.get('cdn-cache-control')).toBeNull()
      expect(missingModelSubresource.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(fakeCache.put).not.toHaveBeenCalled()

      const rootMissingJs = await worker.fetch(new Request('https://moklu.app/missing.js'), {})
      expect(rootMissingJs.status).toBe(404)
      expect(rootMissingJs.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(rootMissingJs.headers.get('cache-control')).toBe('no-store')
      expect(rootMissingJs.headers.get('x-robots-tag')).toBe('noindex, nofollow')

      const rootMissingJsNav = await worker.fetch(
        new Request('https://moklu.app/missing.js', {
          headers: { Accept: 'text/html,application/xhtml+xml' },
        }),
        {},
      )
      expect(rootMissingJsNav.status).toBe(404)
      expect(rootMissingJsNav.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(rootMissingJsNav.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(await rootMissingJsNav.text()).toContain('English 404 Page')
      expect(fakeCache.put).not.toHaveBeenCalled()

      // Valid /assets/index-abc.js (application/javascript) -> 200 immutable + MISS -> HIT in moklu-edge-v3
      const validFirst = await worker.fetch(new Request('https://moklu.app/assets/index-abc.js'), {})
      expect(validFirst.status).toBe(200)
      expect(validFirst.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
      expect(validFirst.headers.get('cdn-cache-control')).toBe('public, max-age=31536000, immutable')
      expect(validFirst.headers.get('cf-cache-status')).toBe('MISS')
      expect(await validFirst.text()).toBe('console.log("ok")')
      expect(openSpy).toHaveBeenCalledWith('moklu-edge-v3')
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

  it('falls back from /<locale>/404.html -> /404.html -> /index.html when origin lacks localized 404 artifacts', async () => {
    const requestedPaths: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const targetUrl = typeof input === 'string' ? input : (input as Request).url
      const pathname = new URL(targetUrl).pathname
      requestedPaths.push(pathname)
      if (pathname === '/ko/404.html') {
        return new Response('missing', { status: 404, headers: { 'Content-Type': 'text/plain' } })
      }
      if (pathname === '/404.html') {
        return new Response('not html', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      }
      return new Response('<!doctype html><html><body>Fallback Index Shell</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    })

    const res = await worker.fetch(new Request('https://moklu.app/ko/missing-page'), {})
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(res.headers.get('x-robots-tag')).toBe('noindex, follow')
    expect(await res.text()).toContain('Fallback Index Shell')
    expect(requestedPaths).toEqual(['/ko/404.html', '/404.html', '/index.html'])
  })

  it('returns canonical 301 redirects for explicit /en and /en/<known-slug> before origin fetch while letting /en/non-existent fetch /404.html', async () => {
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

    // /en/non-existent fetches /404.html and returns real HTTP 404 HTML
    const invalidEn = await worker.fetch(new Request('https://moklu.app/en/non-existent'), {})
    expect(invalidEn.status).toBe(404)
    expect(invalidEn.headers.get('x-robots-tag')).toBe('noindex, follow')
    expect(invalidEn.headers.get('cache-control')).toBe('no-store')
    expect(invalidEn.headers.get('vary')).toBe(
      'Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode',
    )
    expect(await invalidEn.text()).toContain('404 UI')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(new URL((fetchSpy.mock.calls[0][0] as Request).url).pathname).toBe('/404.html')
  })

  it('passes path-matched cf.cacheEverything TTLs for /assets/*, /models/*, /theme-init.js, /sitemap.xml, and IndexNow key', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () =>
          new Response('ok', {
            status: 200,
            headers: { 'Content-Type': 'application/octet-stream' },
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
        path: '/models/modnet-fp16.onnx',
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
})
