/**
 * [INPUT]: depends on node:fs/promises and MOKLU_DEPLOY_URL (default https://moklu.app)
 * [OUTPUT]: verifies live HTTPS deployment HTML shell, asset reachability, and response headers
 * [POS]: deployment smoke script inside scripts/
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { writeFile, mkdir } from 'node:fs/promises'

const target = new URL(process.env.MOKLU_DEPLOY_URL || 'https://moklu.app')
if (target.protocol !== 'https:') throw new Error('Only HTTPS deployment verification is supported')
const report = { url: target.href, timestamp: new Date().toISOString(), checks: [], warnings: [] }

function record(name, passed, detail) {
  report.checks.push({ name, passed, detail })
  if (!passed) process.exitCode = 1
}

try {
  const response = await fetch(target, { signal: AbortSignal.timeout(20000), redirect: 'follow' })
  const html = await response.text()
  record('HTTPS homepage 200', response.ok && response.url.startsWith('https:'), `${response.status} ${response.url}`)
  record('Vite document shell', /<html\b/i.test(html) && /<script\b/i.test(html), 'HTML and script markers')
  for (const header of ['x-content-type-options', 'referrer-policy', 'x-frame-options']) {
    const value = response.headers.get(header)
    if (!value) report.warnings.push(`Missing ${header} header; review production security policy`)
    else report.checks.push({ name: header, passed: true, detail: value })
  }
  const csp = response.headers.get('content-security-policy')
  if (!csp) report.warnings.push('No enforced CSP yet: staged CSP calibration needed')
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)]
    .map((match) => new URL(match[1], response.url))
    .filter((url) => url.origin === target.origin)
  record('JS/CSS bundles referenced', assetPaths.length > 0, `${assetPaths.length} references`)
  for (const asset of assetPaths.slice(0, 12)) {
    const result = await fetch(asset, { signal: AbortSignal.timeout(20000) })
    record(`static asset ${asset.pathname}`, result.ok, String(result.status))
  }
} catch (error) {
  record('network and TLS', false, error instanceof Error ? error.message : String(error))
}
await mkdir('release-evidence', { recursive: true })
await writeFile('release-evidence/deployment-smoke.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
