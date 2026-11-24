# Third-Party Notices & Asset Provenance / 第三方许可声明与素材来源盘点

Moklu (`https://moklu.app`, `https://github.com/imwarn/moklu`) is distributed under the MIT License (see [`LICENSE`](./LICENSE)). This document records upstream attribution, runtime dependency licenses, and provenance for static and visual assets under `public/` and `src/assets/`.

---

## 1. Upstream Base Project: PixelDeck (MIT License)

Moklu Studio's multi-layer canvas editor is built on the MIT-licensed open-source project **PixelDeck** (`https://github.com/Pr0xS/PixelDeck`). Moklu retains PixelDeck's original copyright notice and MIT license text in full below and in [`LICENSE`](./LICENSE):

```text
MIT License

Copyright (c) 2025-2026 PixelDeck contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Runtime Dependencies (`package.json` `dependencies`)

License metadata below is verified against each installed package's `package.json` and `LICENSE` file in `node_modules/`.

| Package | Version Spec | License | Upstream / Notes |
| --- | --- | --- | --- |
| `@fontsource-variable/geist` | `^5.3.0` | `OFL-1.1` | Geist variable sans font by The Geist Project Authors (`https://github.com/vercel/geist-font`), packaged via Fontsource (`https://github.com/fontsource/font-files`). Copyright 2024 The Geist Project Authors. |
| `@fontsource-variable/geist-mono` | `^5.3.0` | `OFL-1.1` | Geist Mono variable font by The Geist Project Authors (`https://github.com/vercel/geist-font`), packaged via Fontsource (`https://github.com/fontsource/font-files`). |
| `konva` | `^10.3.0` | `MIT` | HTML5 2D Canvas framework (`https://github.com/konvajs/konva`). |
| `react-konva` | `^19.2.4` | `MIT` | React bindings for Konva (`https://github.com/konvajs/react-konva`). |
| `use-image` | `^1.1.4` | `MIT` | React image loader hook (`https://github.com/konvajs/use-image`). |
| `@dnd-kit/core` | `^6.3.1` | `MIT` | Accessible drag-and-drop toolkit (`https://github.com/clauderic/dnd-kit`). |
| `@dnd-kit/sortable` | `^10.0.0` | `MIT` | Sortable preset for dnd-kit (`https://github.com/clauderic/dnd-kit`). |
| `@dnd-kit/utilities` | `^3.2.2` | `MIT` | Utility helpers for dnd-kit (`https://github.com/clauderic/dnd-kit`). |
| `jszip` | `^3.10.1` | `(MIT OR GPL-3.0-or-later)` | Client-side ZIP archive generator (`https://github.com/Stuk/jszip`); used by Moklu under the **MIT** license option. |
| `heic-to` | `^1.6.7` | `LGPL-3.0` | Client-side HEIC/HEIF decoder (`https://github.com/hoppergee/heic-to`), bundling Emscripten-compiled `libheif` 1.23.7 (`https://github.com/strukturag/libheif`, LGPL-3.0) and `libde265` (LGPL-3.0). Dynamically loaded via `import('heic-to/csp')` (zero `eval`/`new Function`) only when native browser HEIC decoding is unavailable. |
| `react` | `^19.2.6` | `MIT` | UI runtime (`https://github.com/facebook/react`). |
| `react-dom` | `^19.2.6` | `MIT` | React DOM & SSR renderer (`https://github.com/facebook/react`). |
| `zustand` | `^5.0.14` | `MIT` | State management (`https://github.com/pmndrs/zustand`). |
| `zundo` | `^2.3.0` | `MIT` | Undo/redo middleware for Zustand (`https://github.com/charkour/zundo`). |
| `js-yaml` | `^4.3.1` | `MIT` | YAML parser/serializer (`https://github.com/nodeca/js-yaml`). |
| `nanoid` | `^5.1.16` | `MIT` | Compact ID generator (`https://github.com/ai/nanoid`). |
| `react-markdown` | `10.1.0` | `MIT` | Markdown renderer (`https://github.com/remarkjs/react-markdown`). |
| `rehype-raw` | `7.0.0` | `MIT` | Raw HTML rehype plugin (`https://github.com/rehypejs/rehype-raw`). |
| `remark-gfm` | `4.0.1` | `MIT` | GitHub Flavored Markdown plugin (`https://github.com/remarkjs/remark-gfm`). |
| `@playwright/test` | `^1.61.1` | `Apache-2.0` | Headless browser runner for CLI export & E2E tests (`https://github.com/microsoft/playwright`). |

---

## 3. Asset Provenance Inventory (`public/` and `src/assets/`)

All files currently tracked under `public/` and `src/assets/` were audited against git history and upstream `pixeldeck/main`.

### 3.1 `public/`

| Asset Path | Origin / Source | License / Status | Notes |
| --- | --- | --- | --- |
| `public/favicon.svg`, `public/logo.svg`, `public/logo-dark.svg`, `public/logo-light.svg`, `public/logo-mono.svg`, `public/apple-touch-icon.png`, `public/og-image.png` | Moklu contributors (original Nested Mockup Frame brand mark & OG card, commit `80d16ed`) | `MIT` (Moklu) | Original vector & raster brand assets created for Moklu. |
| `public/_headers` | Moklu contributors | `MIT` (Moklu) | Cloudflare Pages / Netlify HTTP security & CSP header configuration. |
| `public/templates/index.json`, `public/templates/deep-focus.template.json`, `public/templates/ledger-dark.template.json`, `public/templates/nutrition-coach.template.json`, `public/templates/wanderlight.template.json` | 布局数据，作者署名 PixelDeck（0 embedded bitmap images, `assets: {}`） | `MIT`（按 MIT 授权保留） | Pure vector/text JSON layout data (`Flowly`, `Ledgr`, `NutriCoach`, `Wander` placeholder copy); zero third-party photographs or copyrighted screenshots embedded. |
| `public/templates/thumbs/.gitkeep` | PixelDeck / Moklu | `MIT` | Empty directory placeholder. |

### 3.2 `src/assets/`

| Asset Path | Origin / Source | License / Status | Notes |
| --- | --- | --- | --- |
| `src/assets/mockups/browser.ts`, `src/assets/mockups/browser.test.ts`, `src/assets/mockups/registry.ts` | Moklu contributors (original hollow browser window SVGs: Chrome, Safari, Minimal) | `MIT` (Moklu) | Original geometric SVG chrome generators. Browser names (Chrome, Safari) are trademarks of their respective owners, used solely to describe frame layout styles. |
| `src/assets/mockups/iphone-16-pro.ts`, `src/assets/mockups/iphone-16-pro-plain.ts`, `src/assets/mockups/pixel-9.ts`, `src/assets/mockups/pixel-9-plain.ts`, `src/assets/mockups/apple-watch.ts`, `src/assets/mockups/wear-os.ts`, `src/assets/mockups/ipad.ts`, `src/assets/mockups/android-tablet.ts`, `src/assets/mockups/specs.ts` | Inherited from PixelDeck (`https://github.com/Pr0xS/PixelDeck`) | `MIT` (PixelDeck) | Pure vector SVG bezel silhouettes and geometry specs (`390x844`, `380x820`, etc.); zero photographic hardware renders or vendor trademarked logos. Device names (iPhone, iPad, Apple Watch, Pixel, Wear OS, Android) are trademarks of their respective owners. |
| `src/assets/GEMINI.md`, `src/assets/mockups/GEMINI.md` | Moklu contributors | `MIT` (Moklu) | GEB architecture documentation maps. |

---

## 4. Font Licensing Summary (SIL OFL 1.1)

Moklu self-hosts **Geist** and **Geist Mono** (`.woff2` variable fonts via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`) under the **SIL Open Font License, Version 1.1 (OFL-1.1)**. In compliance with OFL-1.1:
- The fonts are bundled and served strictly as part of the Moklu web application and are not sold standalone.
- Full OFL-1.1 license text is included in `node_modules/@fontsource-variable/geist/LICENSE` and `node_modules/@fontsource-variable/geist-mono/LICENSE`.

---

## 5. Dynamic LGPL-3.0 HEIC Decoder Provenance (`heic-to` / `libheif`)

Moklu supports local, zero-upload HEIC/HEIF decoding in browsers that lack native HEIC support (e.g., Chromium and Firefox) by dynamically importing the CSP-safe `heic-to/csp` chunk (`heic-to@^1.6.7`, **GNU Lesser General Public License v3.0**):

- **Upstream Repository**: `https://github.com/hoppergee/heic-to` (wrapping `libheif` v1.23.7 from `https://github.com/strukturag/libheif` and `libde265`, both LGPL-3.0).
- **Dynamic Separation**: `src/tools/heicDecoder.ts` attempts native browser decoding (`createImageBitmap` / `HTMLImageElement`) first and only loads `import('heic-to/csp')` as a separate lazy ESM chunk on demand. The main application bundle carries 0 KB of `heic-to` code.
- **CSP Compliance**: Moklu strictly uses the `heic-to/csp` entry point (compiled with `USE_UNSAFE_EVAL=0`, containing zero `eval` or `new Function` calls) alongside `'wasm-unsafe-eval'` in `public/_headers` while keeping `'unsafe-eval'` forbidden.
- **LGPL-3.0 Compliance**: Full LGPL-3.0 license text is distributed in `node_modules/heic-to/LICENSE`. Because Moklu is open-source (MIT) and dynamically imports `heic-to` as a replaceable npm package, users may freely inspect, modify, or relink `heic-to` / `libheif` via `package.json` and `npm run build`.
