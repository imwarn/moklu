/**
 * [INPUT]: depends on node:fs/promises, vitest, ./headersPolicy, and ./index
 * [OUTPUT]: unit tests verifying byte-for-byte parity with public/_headers, origin passthrough header injection, /_telemetry/health, D1 rollup upsert, and security guards
 * [POS]: deterministic Vitest suite for workers/telemetry/src
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EDGE_SECURITY_HEADERS, resolveEdgeCacheControl } from './headersPolicy'
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

describe('moklu-telemetry edge worker & CSP header parity', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stays byte-for-byte synchronized with public/_headers security & cache rules', async () => {
    const raw = await readFile('public/_headers', 'utf8')
    const blocks = parsePublicHeadersFile(raw)
    const globalHeaders = blocks['/*']

    for (const [name, value] of Object.entries(EDGE_SECURITY_HEADERS)) {
      expect(globalHeaders[name]).toBe(value)
    }
    expect(resolveEdgeCacheControl('/', 200)).toBe(blocks['/']['Cache-Control'])
    expect(resolveEdgeCacheControl('/index.html', 200)).toBe(blocks['/index.html']['Cache-Control'])
    expect(resolveEdgeCacheControl('/healthz.txt', 200)).toBe(blocks['/healthz.txt']['Cache-Control'])
    expect(resolveEdgeCacheControl('/assets/index-abc.js', 200)).toBe(blocks['/assets/*']['Cache-Control'])
    expect(resolveEdgeCacheControl('/assets/missing.js', 404)).toBe('no-store')
    expect(resolveEdgeCacheControl('/fb6946466b9027e3bbb1506815e0f52e.txt', 200)).toBe(
      blocks['/fb6946466b9027e3bbb1506815e0f52e.txt']['Cache-Control'],
    )
  })

  it('injects CSP and immutable/no-store Cache-Control onto proxied origin responses', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('<!doctype html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    )

    const res = await worker.fetch(new Request('https://moklu.app/'), {})
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-security-policy')).toContain("'wasm-unsafe-eval'")
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate')
  })

  it('responds 200 JSON with no-store and CSP on GET /_telemetry/health', async () => {
    const res = await worker.fetch(new Request('https://moklu.app/_telemetry/health'), {})
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
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
