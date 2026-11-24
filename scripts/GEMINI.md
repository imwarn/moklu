# scripts/
> L2 | Parent: ../GEMINI.md

## Member list
- `prerender-seo.mjs`: Post-build Node ESM SSG runner compiling `src/seo/ssrEntry.ts` via Vite SSR into a temporary directory, materializing all 92 localized `dist/<route>/index.html` files with real React-rendered markup, `dist/sitemap.xml`, `dist/robots.txt`, and `dist/llms.txt`, then removing the temp SSR bundle.
- `check-headers.mjs`: Mechanical verifier asserting `public/_headers` CSP directives (including minimal Cloudflare Web Analytics origins and no `unsafe-inline`/`unsafe-eval` scripts), cache policies, and lightweight `public/healthz*` no-store contracts match runtime requirements.
- `verify-release.mjs`: Post-build release smoke gate checking `dist/index.html` and non-empty JS/CSS build artifacts.
- `serve-headers.mjs`: Local static server applying `public/_headers` rules with SPA fallback and `.txt` MIME support for CI CSP and healthcheck testing.
- `check-deployment.mjs`: Deployment verification helper for live hosted builds.
- `license-inventory.mjs`: Dependency license inventory generator.
- `verify-deploy.sh`: End-to-end staged deployment verification shell script.

[PROTOCOL]: Update this header on change, then check GEMINI.md
