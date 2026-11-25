# workers/
> L2 | Parent: ../GEMINI.md

Cloudflare Edge Workers subprojects managed with Wrangler (`wrangler.jsonc`).

## Member list
- `telemetry/`: Edge Worker (`moklu-telemetry`) routed across `moklu.app/*` enforcing `public/_headers` CSP (`'wasm-unsafe-eval'`), `Cross-Origin-Opener-Policy`, bfcache-safe `Cache-Control`, `CDN-Cache-Control` + `cf.cacheEverything` edge caching, and unknown-route `X-Robots-Tag: noindex, follow` on Coolify origin responses while collecting same-origin `/_telemetry` funnel rollups into Cloudflare D1 (`moklu-funnel`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
