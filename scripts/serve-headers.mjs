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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  // A SPA fallback: unknown document routes serve index.html, unknown asset
  // paths keep their 404 so a missing bundle cannot look like a soft success.
  let filePath = normalize(join(ROOT, pathname))
  if (!filePath.startsWith(normalize(ROOT))) {
    res.writeHead(403).end('forbidden')
    return
  }
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    if (extname(pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found')
      return
    }
    filePath = join(ROOT, 'index.html')
  }

  let body
  try {
    body = await readFile(filePath)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found')
    return
  }

  const headers = {}
  for (const rule of rules) {
    if (!matches(rule.pattern, pathname)) continue
    Object.assign(headers, rule.headers)
  }
  const type = MIME[extname(filePath)]
  if (type && !headers['Content-Type']) headers['Content-Type'] = type

  res.writeHead(200, headers).end(body)
})

server.listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT} with _headers applied`))
