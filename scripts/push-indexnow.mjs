/**
 * [INPUT]: depends on node:fs/promises; reads public/fb6946466b9027e3bbb1506815e0f52e.txt and dist/sitemap.xml
 * [OUTPUT]: CLI script submitting all canonical URLs from dist/sitemap.xml to https://api.indexnow.org/indexnow
 * [POS]: post-deploy search engine instant-indexing notifier inside scripts/
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { readFile } from 'node:fs/promises'

const HOST = 'moklu.app'
const KEY_FILENAME = 'fb6946466b9027e3bbb1506815e0f52e.txt'
const key = (await readFile(`public/${KEY_FILENAME}`, 'utf8')).trim()
if (!/^[a-f0-9]{32}$/i.test(key)) {
  throw new Error(`Invalid IndexNow key in public/${KEY_FILENAME}`)
}

const sitemapXml = await readFile('dist/sitemap.xml', 'utf8')
const urlList = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim()).filter(Boolean)
if (urlList.length === 0) {
  throw new Error('No <loc> URLs found in dist/sitemap.xml. Run `npm run build` first.')
}

const payload = {
  host: HOST,
  key,
  keyLocation: `https://${HOST}/${KEY_FILENAME}`,
  urlList,
}

if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ dryRun: true, keyLocation: payload.keyLocation, urlCount: urlList.length }, null, 2))
  process.exit(0)
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
})
const body = await res.text()
if (res.status !== 200 && res.status !== 202) {
  throw new Error(`IndexNow submission failed with HTTP ${res.status}: ${body}`)
}
console.log(
  JSON.stringify(
    {
      ok: true,
      status: res.status,
      keyLocation: payload.keyLocation,
      urlsSubmitted: urlList.length,
    },
    null,
    2,
  ),
)
