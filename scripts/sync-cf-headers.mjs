/**
 * [INPUT]: depends on node:fs/promises, node:os, node:path; reads public/_headers and local Wrangler OAuth config or CLOUDFLARE_API_TOKEN
 * [OUTPUT]: CLI script syncing public/_headers /* security, COOP, and CSP response headers to moklu.app Cloudflare http_response_headers_transform phase ruleset
 * [POS]: zero-drift edge security-header deployment tool inside scripts/ keeping Cloudflare Transform Rules aligned with public/_headers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const ZONE_NAME = process.env.CF_ZONE_NAME ?? 'moklu.app'
const RULE_REF = 'moklu_security_headers'
const SYNCED_HEADER_NAMES = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'X-Frame-Options',
  'Cross-Origin-Opener-Policy',
  'Permissions-Policy',
]

function parseRootHeaders(content) {
  let inGlobal = false
  const headers = {}
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      inGlobal = line.trim() === '/*'
      continue
    }
    if (!inGlobal) continue
    const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/)
    if (match) headers[match[1]] = match[2]
  }
  return headers
}

async function resolveBearerToken() {
  if (process.env.CLOUDFLARE_API_TOKEN?.trim()) {
    return process.env.CLOUDFLARE_API_TOKEN.trim()
  }
  const home = os.homedir()
  const candidates = [
    path.join(home, 'Library', 'Preferences', '.wrangler', 'config', 'default.toml'),
    path.join(home, '.wrangler', 'config', 'default.toml'),
    path.join(home, '.config', '.wrangler', 'config', 'default.toml'),
  ]
  for (const filePath of candidates) {
    try {
      const toml = await readFile(filePath, 'utf8')
      const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/)
      if (match?.[1]) return match[1].trim()
    } catch {
      // Try next candidate location.
    }
  }
  throw new Error(
    'No Cloudflare credentials found. Run `npx wrangler login` first or set CLOUDFLARE_API_TOKEN.',
  )
}

async function cfRequest(token, method, apiPath, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    const detail = (data.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ')
    throw new Error(`Cloudflare API ${method} ${apiPath} failed (HTTP ${res.status}): ${detail}`)
  }
  return data.result
}

const headersText = await readFile('public/_headers', 'utf8')
const rootHeaders = parseRootHeaders(headersText)
const headersPayload = {}
for (const name of SYNCED_HEADER_NAMES) {
  if (!rootHeaders[name]) {
    throw new Error(`Missing required header ${name} in public/_headers /* block`)
  }
  headersPayload[name] = { operation: 'set', value: rootHeaders[name] }
}

if (process.argv.includes('--dry-run')) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        zone: ZONE_NAME,
        ruleRef: RULE_REF,
        expression: `http.host eq "${ZONE_NAME}"`,
        headersSet: Object.keys(headersPayload),
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const token = await resolveBearerToken()
const zones = await cfRequest(token, 'GET', `/zones?name=${encodeURIComponent(ZONE_NAME)}`)
const zone = zones[0]
if (!zone?.id) {
  throw new Error(`Zone ${ZONE_NAME} not found in authenticated Cloudflare account`)
}

let existingRules = []
try {
  const entrypoint = await cfRequest(
    token,
    'GET',
    `/zones/${zone.id}/rulesets/phases/http_response_headers_transform/entrypoint`,
  )
  existingRules = Array.isArray(entrypoint?.rules) ? entrypoint.rules : []
} catch (err) {
  // Phase entrypoint returns 404 before its first rule is created.
  if (!String(err).includes('HTTP 404')) throw err
}

const preservedRules = existingRules
  .filter((r) => r.ref !== RULE_REF && r.description !== 'Moklu security & CSP headers (synced from public/_headers)')
  .map(({ action, action_parameters, description, enabled, expression, ref }) => ({
    action,
    action_parameters,
    description: description ?? '',
    enabled: enabled ?? true,
    expression,
    ...(ref ? { ref } : {}),
  }))

const mokluRule = {
  ref: RULE_REF,
  description: 'Moklu security & CSP headers (synced from public/_headers)',
  expression: `http.host eq "${ZONE_NAME}"`,
  action: 'rewrite',
  action_parameters: {
    headers: headersPayload,
  },
  enabled: true,
}

const updated = await cfRequest(
  token,
  'PUT',
  `/zones/${zone.id}/rulesets/phases/http_response_headers_transform/entrypoint`,
  {
    description: 'Zone response header transform rules',
    rules: [...preservedRules, mokluRule],
  },
)

console.log(
  JSON.stringify(
    {
      ok: true,
      zone: zone.name,
      zoneId: zone.id,
      rulesetId: updated.id,
      version: updated.version,
      ruleRef: RULE_REF,
      headersSynced: Object.keys(headersPayload),
    },
    null,
    2,
  ),
)
