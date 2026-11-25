/**
 * [INPUT]: depends on node:http, node:fs/promises, and node:path; reads public/_headers and serves built static files from ROOT (default dist/)
 * [OUTPUT]: local HTTP static server applying public/_headers rules with real HTTP 404 document fallback (dist/404.html or dist/index.html with no-store + X-Robots-Tag: noindex, follow), 404 text/plain for missing static assets, and MIME mapping
 * [POS]: CI and local preview static server in scripts/, exercising public/_headers and edge 404 semantics before deployment
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
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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

async function resolveDocumentFallbackFile(root) {
  const notFoundPath = join(root, '404.html')
  try {
    if ((await stat(notFoundPath)).isFile()) return notFoundPath
  } catch {
    // Fall back to SPA shell if dist/404.html has not been generated yet.
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname
  const isHead = (req.method ?? 'GET').toUpperCase() === 'HEAD'

  // Unknown document routes serve dist/404.html (falling back to dist/index.html)
  // with real HTTP 404 + no-store + X-Robots-Tag: noindex, follow; unknown static
  // asset paths return 404 text/plain so a missing bundle never looks like a 200.
  let filePath = normalize(join(ROOT, pathname))
  if (!filePath.startsWith(normalize(ROOT))) {
    res.writeHead(403).end(isHead ? undefined : 'forbidden')
    return
  }

  let isDocumentFallback = false
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    if (extname(pathname) || pathname.startsWith('/assets/')) {
      const headers = buildHeadersForPath('/*')
      delete headers['CDN-Cache-Control']
      headers['Content-Type'] = 'text/plain; charset=utf-8'
      headers['Cache-Control'] = 'no-store'
      headers['X-Robots-Tag'] = 'noindex, nofollow'
      res.writeHead(404, headers).end(isHead ? undefined : 'Not Found')
      return
    }
    isDocumentFallback = true
    filePath = await resolveDocumentFallbackFile(ROOT)
  }

  let body
  try {
    body = await readFile(filePath)
  } catch {
    if (!isDocumentFallback && !extname(pathname) && !pathname.startsWith('/assets/')) {
      isDocumentFallback = true
      filePath = await resolveDocumentFallbackFile(ROOT)
      try {
        body = await readFile(filePath)
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end(isHead ? undefined : 'Not Found')
        return
      }
    } else {
      const headers = buildHeadersForPath('/*')
      delete headers['CDN-Cache-Control']
      headers['Content-Type'] = 'text/plain; charset=utf-8'
      headers['Cache-Control'] = 'no-store'
      headers['X-Robots-Tag'] = 'noindex, nofollow'
      res.writeHead(404, headers).end(isHead ? undefined : 'Not Found')
      return
    }
  }

  const headers = buildHeadersForPath(pathname)
  const type = MIME[extname(filePath)]
  if (type && !headers['Content-Type']) headers['Content-Type'] = type

  if (isDocumentFallback) {
    headers['Cache-Control'] = 'no-store'
    delete headers['CDN-Cache-Control']
    headers['X-Robots-Tag'] = 'noindex, follow'
  }

  res.writeHead(isDocumentFallback ? 404 : 200, headers).end(isHead ? undefined : body)
})

server.listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT} with _headers applied`))
