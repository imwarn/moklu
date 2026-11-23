# Moklu — Local-First Browser Mockup & Image Toolkit

React 19.2 + TypeScript 6.0 + Vite 8.3 + Tailwind CSS 4.3 + Konva 10.3 + Zustand 5.0 + JSZip 3.10 + Vitest 4.1 + Playwright 1.61

<directory>
src/ - Application source code (17 subdirectories: seo, i18n, workspace, tools, theme, bridge, commercial, pages, components, store, utils, assets, ai, hooks, types, benchmarks, test)
scripts/ - Build-time SSG prerenderer, CSP header verifier, release verification, and deployment tooling
public/ - Static assets, templates, favicon, logo, and Cloudflare/Netlify `_headers` CSP contract
tests/ - Playwright browser E2E suites (`tests/e2e/`) and deterministic export fixtures
cli/ - Headless Node CLI (`moklu` / `pixeldeck`) for scripted project export
docs/ - Operational guides and release documentation
</directory>

<config>
package.json - Project metadata (`https://moklu.app`), dependencies, and `build` pipeline (`tsc -b && vite build && node scripts/prerender-seo.mjs`)
vite.config.ts - Vite bundler config with `@` path alias and code-splitting
index.html - Base HTML shell for SPA boot and SSG prerendering (`https://moklu.app`)
playwright.config.mjs - Multi-browser Playwright E2E configuration (Chromium, Firefox, WebKit)
tsconfig.json - TypeScript project references
eslint.config.js - Flat ESLint rules for React, Hooks, and TypeScript
</config>

[PROTOCOL]: Update this header on change, then check GEMINI.md
