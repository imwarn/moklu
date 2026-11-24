# Moklu — Local-First Browser Mockup & Image Toolkit

React 19.2 + TypeScript 6.0 + Vite 8.3 + Tailwind CSS 4.3 + Geist 5.3 (self-hosted `@fontsource-variable/geist` & `geist-mono`) + Konva 10.3 + Zustand 5.0 + JSZip 3.10 + heic-to 1.6 (lazy WASM) + Vitest 4.1 + Playwright 1.61

<directory>
src/ - Application source code (17 subdirectories with full GEB L2/L3 coverage: seo, i18n, workspace, tools, theme, bridge, commercial, pages, components, store, utils, assets, ai, hooks, types, benchmarks, test); Signal Orange + Neutral Zinc brand tokens live in `src/index.css` (`@theme static`) and `src/theme/brand.ts` (`BRAND`, `BRAND_LIGHT`, `BRAND_DARK`, `getBrandPalette`); includes lazy `heic-to/csp` WASM `.heic`/`.avif` decoding (`src/tools/heicDecoder.ts`), zero-dependency EXIF/GPS inspector (`src/tools/exifReader.ts`), multi-page A4/fit PDF 1.4 export (`src/tools/pdfHelper.ts`), target-KB binary-search compression (`src/tools/compressEngine.ts`), vertical long-screenshot overlap removal + per-seam overrides (`src/tools/stitchOverlap.ts`), 13-device mockup frames (`src/utils/quickDesign.ts`), non-destructive Blur/Pixelate/Spotlight redaction & multi-layer Studio handoff (`src/workspace/redact.ts`, `src/bridge/studioHandoff.ts`, `src/workspace/mergeHandoff.ts`), IndexedDB Quick Workspace draft persistence (`src/workspace/draftStorage.ts`), `.moklu` project backup reminders (`src/components/toolbar/ProjectBackupBadge.tsx`), zero-key localization workflow (`src/pages/localization/KeylessTranslateModal.tsx`), and privacy-first funnel telemetry (`src/utils/telemetry.ts`)
designs/ - Brand design system artifacts (`designs/moklu-brand/`: self-contained `preview.html`, specimens, CSS tokens, self-hosted fonts, and `logo/` concepts + final Nested Mockup Frame spec)
scripts/ - Build-time SSG prerenderer (120 localized routes across 30 slugs + `sitemap.xml` + `robots.txt` + `llms.txt`), CSP & healthcheck header verifier, release verification, and deployment tooling
public/ - Static assets, templates, Nested Mockup Frame brand assets (`favicon.svg`, `logo*.svg`, `apple-touch-icon.png`, `og-image.png`), lightweight static healthcheck endpoints (`healthz.txt`, `healthz/index.html`), and Cloudflare/Netlify `_headers` CSP contract (with `'wasm-unsafe-eval'` for lazy HEIC WASM decoding, minimal Cloudflare Web Analytics allowlist, and `no-store` healthcheck rules)
tests/ - Playwright browser E2E suites (`tests/e2e/`) and deterministic export fixtures
cli/ - Headless Node CLI (`moklu` / `pixeldeck`) for scripted project export and locale manifests
docs/ - Operational guides, Cloudflare Web Analytics, Railpack/Coolify migration & HTTP Healthcheck setup (`analytics.md`, `cloudflare-response-headers.md`), and release documentation
.github/ - GitHub Actions CI, benchmark, deployment-smoke, live-reliability, and release-candidate workflows (GitHub-hosted `ubuntu-latest`, least-privilege `contents: read`, Actions v7 / Node 24 runtime; see `.github/GEMINI.md`)
</directory>

<config>
package.json - Project metadata (`https://moklu.app`), dependencies, and `build` pipeline (`tsc -b && vite build && node scripts/prerender-seo.mjs`)
vite.config.ts - Vite 8 bundler config with `import.meta.dirname` `@` alias, Rolldown client code-splitting (`vendor-react`, `vendor-konva`, `vendor-dnd`), and conditional `VITE_CF_BEACON_TOKEN` Cloudflare Web Analytics HTML injection
railpack.json - Railpack Node 22 build & deployment manifest (`npm run build` + runtime `curl` for Coolify HTTP Healthcheck)
index.html - Base HTML shell for SPA boot and SSG prerendering (`https://moklu.app`)
playwright.config.mjs - Multi-browser Playwright E2E configuration (Chromium, Firefox, WebKit)
vitest.config.ts - Vitest unit test and benchmark configuration (`import.meta.dirname` alias)
tsconfig.json - TypeScript project references
eslint.config.js - Flat ESLint rules for React, Hooks, and TypeScript
</config>

[PROTOCOL]: Update this header on change, then check GEMINI.md
