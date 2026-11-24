# workers/telemetry/
> L2 | Parent: ../GEMINI.md

Cloudflare Edge Worker (`moklu-telemetry`) routed across `moklu.app/*` that:
1. Enforces `public/_headers` `Content-Security-Policy` (including `'wasm-unsafe-eval'`), security headers, and path-scoped `Cache-Control` (`no-store` healthchecks, `immutable` `/assets/*`) at the Cloudflare edge in front of Coolify.
2. Collects same-origin privacy-sanitized funnel beacons (`POST /_telemetry`) into Cloudflare D1 (`moklu-funnel`, daily rollup table `funnel_daily` with zero cookies, zero IPs, and zero PII).

## Member list
- `wrangler.jsonc`: Wrangler configuration binding `moklu.app/*` route and D1 database `moklu-funnel` (`4674c269-6a93-4db1-bccf-a83ebe9d1058`).
- `schema.sql`: Idempotent SQLite D1 schema defining `funnel_daily` daily aggregate counter table and `(day, event)` index.
- `src/headersPolicy.ts`: Edge security header and path `Cache-Control` resolver mirrored with `public/_headers`.
- `src/index.ts`: Edge fetch handler serving `GET /_telemetry/health`, `POST /_telemetry` (`ctx.waitUntil` D1 upsert), and Coolify origin passthrough with `applyMokluEdgeHeaders`.
- `src/index.test.ts`: Vitest unit suite verifying byte-for-byte parity with `public/_headers`, origin header injection, health endpoint, D1 rollup upsert, and security guards.

[PROTOCOL]: Update this header on change, then check GEMINI.md
