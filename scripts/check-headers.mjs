/**
 * [INPUT]: depends on node:fs/promises and node:fs; reads public/_headers, src/ai/providers.ts, and src/ai/client.ts
 * [OUTPUT]: CLI verifier exiting non-zero when required security headers, Cloudflare Web Analytics / AI provider CSP allowlists, or cache rules drift
 * [POS]: mechanical CSP and response-header consistency gate inside scripts/
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'

/**
 * Verifies that the CSP in public/_headers is consistent with what the app
 * actually needs. A CSP that is merely well-formed but blocks a provider
 * silently breaks a feature, so this is checked mechanically rather than by eye.
 */
const headersFile = await readFile('public/_headers', 'utf8')

const rules = []
let current = null
for (const rawLine of headersFile.split('\n')) {
  const line = rawLine.replace(/\s+$/, '')
  if (!line.trim() || line.trim().startsWith('#')) continue
  if (!/^\s/.test(line)) {
    current = { pattern: line.trim(), headers: {} }
    rules.push(current)
    continue
  }
  const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/)
  if (!match) throw new Error(`Unparsable line: ${rawLine}`)
  current.headers[match[1]] = match[2]
}

const globalHeaders = Object.assign({}, ...rules.filter((r) => r.pattern === '/*').map((r) => r.headers))
const csp = globalHeaders['Content-Security-Policy']
const failures = []
const notes = []

const REQUIRED_HEADERS = [
  'X-Content-Type-Options',
  'Referrer-Policy',
  'X-Frame-Options',
  'Content-Security-Policy',
]
for (const header of REQUIRED_HEADERS) {
  if (!globalHeaders[header]) failures.push(`missing required header: ${header}`)
}

if (!csp) {
  failures.push('no CSP declared on /*')
} else {
  const directives = Object.fromEntries(
    csp.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const [name, ...values] = part.split(/\s+/)
      return [name, values]
    }),
  )

  const source = (directive) => directives[directive] ?? directives['default-src'] ?? []
  const assertAllows = (directive, value) => {
    if (!source(directive).includes(value)) {
      failures.push(`${directive} does not allow ${value}`)
    }
  }

  // Evidence from the codebase, not guesses.
  assertAllows('script-src', "'self'")        // hashed bundles only, no inline/eval
  assertAllows('script-src', 'https://static.cloudflareinsights.com') // Cloudflare Web Analytics beacon script
  assertAllows('style-src', "'unsafe-inline'") // 33 components use React style props
  assertAllows('style-src', 'https://fonts.googleapis.com') // src/utils/fonts.ts injects <link>
  assertAllows('font-src', 'https://fonts.gstatic.com')
  assertAllows('font-src', 'data:')           // user-uploaded fonts via data URL
  assertAllows('img-src', 'data:')            // screenshots are embedded as data URLs
  assertAllows('img-src', 'blob:')            // object URLs for previews
  assertAllows('media-src', 'blob:')
  assertAllows('connect-src', 'https://cloudflareinsights.com') // Cloudflare Web Analytics beacon endpoint

  // Provider base URLs that the app calls directly from the browser.
  const providersFile = readFileSync('src/ai/providers.ts', 'utf8')
  const providerOrigins = [...providersFile.matchAll(/baseUrl:\s*'(https:\/\/[^']+)'/g)]
    .map((m) => new URL(m[1]).origin)
  for (const origin of new Set(providerOrigins)) {
    const allowed = source('connect-src')
    if (!allowed.includes(origin) && !allowed.includes('https:')) {
      failures.push(`connect-src does not allow provider origin ${origin} (browser calls it directly)`)
    }
  }

  // src/ai/client.ts hard-codes the same origins to explain CSP refusals in
  // plain language. If the two lists drift, users get a CS-sounding error for a
  // domain the policy actually allows (or the reverse).
  const clientSource = readFileSync('src/ai/client.ts', 'utf8')
  const clientOrigins = [...clientSource.matchAll(/'(https:\/\/[^']+)'/g)]
    .map((m) => m[1])
    .filter((value) => /^https:\/\/[a-z0-9.-]+$/.test(value))
  const connectAllowed = source('connect-src')
  const declared = clientSource.match(/CSP_CONNECT_ALLOWED_ORIGINS = \[([\s\S]*?)\]/)
  if (!declared) {
    failures.push('src/ai/client.ts must declare CSP_CONNECT_ALLOWED_ORIGINS')
  } else {
    const declaredOrigins = [...declared[1].matchAll(/'(https:\/\/[^']+)'/g)].map((m) => m[1])
    const missing = declaredOrigins.filter((origin) => !connectAllowed.includes(origin))
    if (missing.length) {
      failures.push(`CSP_CONNECT_ALLOWED_ORIGINS lists origins the CSP blocks: ${missing.join(', ')}`)
    }
    notes.push(`client explains CSP refusals for ${declaredOrigins.length} origins`)
  }
  void clientOrigins

  if (directives['script-src']?.includes("'unsafe-eval'")) {
    failures.push("script-src allows 'unsafe-eval' but the bundle contains no eval/new Function")
  }
  if (directives['script-src']?.includes("'unsafe-inline'")) {
    failures.push("script-src allows 'unsafe-inline' but the app and Cloudflare beacon load external scripts only")
  }
  if (!directives['frame-ancestors']?.includes("'none'")) {
    notes.push("frame-ancestors is not 'none'; X-Frame-Options: DENY still applies")
  }
  if (source('default-src').includes('*')) {
    failures.push("default-src uses '*' which defeats the policy")
  }
}

// Cache policy: the HTML shell must never be heuristically cached, hashed
// assets must be immutable.
const cacheFor = (pattern) => {
  const rule = rules.find((r) => r.pattern === pattern)
  return rule?.headers['Cache-Control'] ?? null
}
const htmlCache = cacheFor('/')
if (!htmlCache || !/no-(cache|store)/.test(htmlCache)) {
  failures.push(`/ must not be cached, got: ${htmlCache ?? '(none)'}`)
}
const assetCache = cacheFor('/assets/*') ?? cacheFor('/*')
if (!assetCache || !/immutable/.test(assetCache)) {
  failures.push(`/assets/* must be immutable, got: ${assetCache ?? '(none)'}`)
}

const report = {
  cspDirectives: csp ? csp.split(';').map((s) => s.trim()).filter(Boolean).length : 0,
  headersOnRoot: Object.keys(globalHeaders),
  failures,
  notes,
}
console.log(JSON.stringify(report, null, 2))
if (failures.length) {
  console.error(`\n${failures.length} header problem(s) found`)
  process.exitCode = 1
} else {
  console.log('\nheaders consistent with the app')
}
