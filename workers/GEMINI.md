# workers/
> L2 | Parent: ../GEMINI.md

Cloudflare Edge Workers subprojects managed with Wrangler (`wrangler.jsonc`).

## Member list
- `telemetry/`: Edge Worker (`moklu-telemetry`) routed across `moklu.app/*` enforcing `public/_headers` CSP (`'wasm-unsafe-eval'`), `Cross-Origin-Opener-Policy`, bfcache-safe `Cache-Control`, `CDN-Cache-Control` + `cf.cacheEverything` (`moklu-edge-v3`), content-negotiated static-asset missing handling (browser HTML navigations receive localized `/404.html` or `/{zh,ja,ko}/404.html` with `404 text/html` + `noindex, nofollow`; subresources/`curl` receive `404 text/plain`, uncached), canonical `301` `/en` redirects, and real HTTP `404` localized `404.html` + `X-Robots-Tag: noindex, follow` on unknown non-asset routes while collecting same-origin `/_telemetry` funnel rollups (including `not_found_view`) into Cloudflare D1 (`moklu-funnel`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
