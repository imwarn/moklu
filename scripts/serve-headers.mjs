/**
 * [INPUT]: depends on node:http, node:fs/promises, and node:path; reads public/_headers and serves built static files from ROOT (default dist/)
 * [OUTPUT]: local HTTP static server applying public/_headers rules with content-negotiated 4-locale 404 HTML fallback (dist/{,zh/,ja/,ko/}404.html or dist/index.html with no-store, Vary, and X-Robots-Tag), 404 text/plain for missing static subresources, and MIME mapping
 * [POS]: CI and local preview static server in scripts/, exercising public/_headers and edge 404 content-negotiation semantics before deployment
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

/**
 * Minimal static server that applies public/_headers exactly as written.
 *
 * This exists so the CSP in public/_headers is exercised against a real build
 * in CI instead of being trusted because it looks correct. Parsing is
 * intentionally narrow: it supports the subset the file uses (`/*` global block
 * plus exact paths and a trailing `*` wildcard), and it fails loudly on
 * anything it does not understand so a typo cannot silently disable a header.
 */
const ROOT = process.argv[2] ?? 'dist'
const PORT = Number(process.argv[3] ?? 4174)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
}

function parseHeaders(text) {
  const rules = []
  let current = null
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: {} }
      rules.push(current)
      continue
    }
    const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/)
    if (!match) throw new Error(`Unparsable _headers line: ${JSON.stringify(rawLine)}`)
    if (!current) throw new Error(`Header before any path block: ${JSON.stringify(rawLine)}`)
    current.headers[match[1]] = match[2]
  }
  return rules
}

function matches(pattern, pathname) {
  if (pattern.endsWith('*')) return pathname.startsWith(pattern.slice(0, -1))
  return pathname === pattern || (pattern.endsWith('/') && pathname === pattern.slice(0, -1))
}

// Always read public/_headers, never the copy Vite drops into dist/. Two
// sources drift, and a stale dist copy silently tests the previous policy.
const rules = parseHeaders(await readFile('public/_headers', 'utf8'))

const HTML_ACCEPT_RE = /\btext\/html\b/i
const ACCEPT_LANG_Q_RE = /^\s*q\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*$/i

function isHtmlDocumentNavigation(req) {
  const method = (req.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    return false
  }
  const secFetchDest = String(req.headers['sec-fetch-dest'] ?? '').trim().toLowerCase()
  const secFetchMode = String(req.headers['sec-fetch-mode'] ?? '').trim().toLowerCase()
  const accept = String(req.headers.accept ?? '')

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

function resolveNotFoundLocale(pathname, acceptLanguage) {
  const firstSegment = pathname.split(/[?#]/, 1)[0].toLowerCase().split('/').filter(Boolean)[0]
  if (
    firstSegment === 'zh' ||
    firstSegment === 'ja' ||
    firstSegment === 'ko' ||
    firstSegment === 'en'
  ) {
    return firstSegment
  }

  if (typeof acceptLanguage !== 'string' || !acceptLanguage.trim()) {
    return 'en'
  }

  const weightedTags = []
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

async function resolveDocumentFallbackFile(root, locale) {
  const candidates = locale === 'en'
    ? [join(root, '404.html'), join(root, 'index.html')]
    : [join(root, locale, '404.html'), join(root, '404.html'), join(root, 'index.html')]

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // Try next fallback file.
    }
  }
  return join(root, 'index.html')
}

function buildHeadersForPath(pathname) {
  const headers = {}
  for (const rule of rules) {
    if (!matches(rule.pattern, pathname)) continue
    Object.assign(headers, rule.headers)
  }
  return headers
}

async function sendNotFound(req, res, pathname, isHead, isStaticAsset) {
  const headers = buildHeadersForPath('/*')
  delete headers['CDN-Cache-Control']
  headers['Cache-Control'] = 'no-store'

  if (isStaticAsset && !isHtmlDocumentNavigation(req)) {
    headers['Content-Type'] = 'text/plain; charset=utf-8'
    headers['Vary'] = 'Accept, Sec-Fetch-Dest, Sec-Fetch-Mode'
    headers['X-Robots-Tag'] = 'noindex, nofollow'
    res.writeHead(404, headers).end(isHead ? undefined : 'Not Found')
    return
  }

  const locale = resolveNotFoundLocale(pathname, req.headers['accept-language'])
  const fallbackPath = await resolveDocumentFallbackFile(ROOT, locale)
  try {
    const body = await readFile(fallbackPath)
    headers['Content-Type'] = MIME[extname(fallbackPath)] ?? 'text/html; charset=utf-8'
    headers['Vary'] = 'Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode'
    headers['X-Robots-Tag'] = isStaticAsset ? 'noindex, nofollow' : 'noindex, follow'
    res.writeHead(404, headers).end(isHead ? undefined : body)
  } catch {
    headers['Content-Type'] = 'text/plain; charset=utf-8'
    headers['Vary'] = 'Accept, Sec-Fetch-Dest, Sec-Fetch-Mode'
    headers['X-Robots-Tag'] = isStaticAsset ? 'noindex, nofollow' : 'noindex, follow'
    res.writeHead(404, headers).end(isHead ? undefined : 'Not Found')
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname
  const isHead = (req.method ?? 'GET').toUpperCase() === 'HEAD'
  const isStaticAsset =
    Boolean(extname(pathname)) || pathname.startsWith('/assets/') || pathname.startsWith('/models/')

  // Unknown document routes serve localized dist/{,zh/,ja/,ko/}404.html (falling back
  // to dist/404.html -> dist/index.html) with real HTTP 404 + no-store + Vary +
  // X-Robots-Tag: noindex, follow. Missing static assets serve localized HTML 404 on
  // browser document navigations (noindex, nofollow) and 404 text/plain on subresources.
  let filePath = normalize(join(ROOT, pathname))
  if (!filePath.startsWith(normalize(ROOT))) {
    res.writeHead(403).end(isHead ? undefined : 'forbidden')
    return
  }

  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    await sendNotFound(req, res, pathname, isHead, isStaticAsset)
    return
  }

  let body
  try {
    body = await readFile(filePath)
  } catch {
    await sendNotFound(req, res, pathname, isHead, isStaticAsset)
    return
  }

  const headers = buildHeadersForPath(pathname)
  const type = MIME[extname(filePath)]
  if (type && !headers['Content-Type']) headers['Content-Type'] = type

  res.writeHead(200, headers).end(isHead ? undefined : body)
})

server.listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT} with _headers applied`))
