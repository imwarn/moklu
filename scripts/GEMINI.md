# scripts/
> L2 | Parent: ../GEMINI.md

## Member list
- `prerender-seo.mjs`: Post-build Node ESM SSG runner materializing all 76 localized `dist/<route>/index.html` files, `dist/sitemap.xml`, and `dist/robots.txt`.
- `check-headers.mjs`: Mechanical verifier asserting `public/_headers` CSP directives and cache policies match browser runtime requirements.
- `verify-release.mjs`: Post-build release smoke gate checking `dist/index.html` and non-empty JS/CSS build artifacts.
- `serve-headers.mjs`: Local static server applying `public/_headers` rules for CI CSP testing.
- `check-deployment.mjs`: Deployment verification helper for live hosted builds.
- `license-inventory.mjs`: Dependency license inventory generator.
- `verify-deploy.sh`: End-to-end staged deployment verification shell script.

[PROTOCOL]: Update this header on change, then check GEMINI.md
