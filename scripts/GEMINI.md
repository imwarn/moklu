# scripts/
> L2 | Parent: ../GEMINI.md

## Member list
- `prerender-seo.mjs`: Post-build Node ESM SSG runner compiling `src/seo/ssrEntry.ts` via Vite SSR into a temporary directory, materializing all 120 localized `dist/<route>/index.html` files (30 slugs x 4 locales) with real React-rendered markup, `dist/sitemap.xml`, `dist/robots.txt`, and `dist/llms.txt`, then removing the temp SSR bundle.
- `check-headers.mjs`: Mechanical verifier asserting `public/_headers` CSP directives (including `'wasm-unsafe-eval'` for lazy HEIC WASM decoding, minimal Cloudflare Web Analytics origins, and no `unsafe-inline`/`unsafe-eval` scripts), `Cross-Origin-Opener-Policy`, bfcache-safe HTML `Cache-Control` + `CDN-Cache-Control`, short-TTL static/crawler caching, and lightweight `public/healthz*` no-store contracts match runtime requirements.
- `verify-release.mjs`: Post-build release smoke gate checking `dist/index.html` and non-empty JS/CSS build artifacts.
- `serve-headers.mjs`: Local static server applying `public/_headers` rules with SPA fallback and `.txt` MIME support for CI CSP and healthcheck testing.
- `check-deployment.mjs`: Deployment verification helper for live hosted builds.
- `license-inventory.mjs`: Dependency license inventory generator.
- `sync-cf-headers.mjs`: Zero-drift Cloudflare API deployer syncing `public/_headers` `/*` security, COOP, and CSP headers to `moklu.app`'s `http_response_headers_transform` phase ruleset.
- `query-funnel.mjs`: Zero-secret Cloudflare D1 SQL reporter querying `moklu-funnel` (`funnel_daily`) conversion funnel, top localized slugs, and rejected file extensions via local Wrangler CLI.
- `push-indexnow.mjs`: Post-deploy IndexNow notifier submitting all 120 canonical URLs from `dist/sitemap.xml` authenticated by `public/fb6946466b9027e3bbb1506815e0f52e.txt`.
- `verify-deploy.sh`: End-to-end staged deployment verification shell script.

[PROTOCOL]: Update this header on change, then check GEMINI.md
