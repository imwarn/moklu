# workers/telemetry/
> L2 | Parent: ../GEMINI.md

Cloudflare Edge Worker (`moklu-telemetry`) routed across `moklu.app/*` that:
1. Enforces `public/_headers` `Content-Security-Policy` (including `'wasm-unsafe-eval'`), `Cross-Origin-Opener-Policy`, security headers, bfcache-safe `Cache-Control` (`public, no-cache` on 120 localized SSG HTML routes, `no-store` on `/healthz*`/`/_telemetry*`/unknown fallback/errors, `immutable` on `/assets/*`), `CDN-Cache-Control` + `cf.cacheEverything` edge caching, and unknown-route `X-Robots-Tag: noindex, follow` at the Cloudflare edge in front of Coolify.
2. Collects same-origin privacy-sanitized funnel beacons (`POST /_telemetry`) into Cloudflare D1 (`moklu-funnel`, daily rollup table `funnel_daily` with zero cookies, zero IPs, and zero PII).

## Member list
- `wrangler.jsonc`: Wrangler configuration binding `moklu.app/*` route and D1 database `moklu-funnel` (`4674c269-6a93-4db1-bccf-a83ebe9d1058`).
- `schema.sql`: Idempotent SQLite D1 schema defining `funnel_daily` daily aggregate counter table and `(day, event)` index.
- `src/headersPolicy.ts`: Zero-dependency edge security header (`EDGE_SECURITY_HEADERS` incl. COOP), 120-route SSG matcher (`isKnownSsgHtmlPath`, `isUnknownNonAssetPath`), `Cache-Control`/`CDN-Cache-Control`/edge TTL resolvers, and `applyMokluEdgeHeaders` mirrored with `public/_headers`.
- `src/index.ts`: Edge fetch handler serving `GET /_telemetry/health`, `POST /_telemetry` (`ctx.waitUntil` D1 upsert), and Coolify origin passthrough with isolated Cloudflare Cache API (`caches.open('moklu-edge-v1')`) + `cf.cacheEverything` (`cf.cacheTtl`) and `applyMokluEdgeHeaders`.
- `src/index.test.ts`: Vitest unit suite verifying byte-for-byte parity with `public/_headers`, 120-route alignment with `src/seo/routes.ts`, `cf.cacheEverything` options, `CDN-Cache-Control`, COOP, unknown-route `X-Robots-Tag: noindex, follow`, health endpoint, D1 rollup upsert, and security guards.

[PROTOCOL]: Update this header on change, then check GEMINI.md
