# src/
> L2 | Parent: ../GEMINI.md

## Member list
- `main.tsx`: Browser mount entry point, Google Fonts loader, project bootstrap, and headless ExportApp switch.
- `App.tsx`: Lightweight History API SPA router routing `/` and 18 localized SEO tool slugs to `ToolLandingPage` and `/studio` to lazy-loaded `StudioPage`.
- `config.ts`: Canonical site config exporting `SITE_URL` (`https://moklu.tech`), `BRAND_NAME` (`Moklu`), and `getPixelDeckConfig()`.
- `index.css`: Tailwind v4 theme tokens and adaptive Light/Dark workspace vs locked dark Studio body surface rules.
- `globals.d.ts`: Build-time Vite constant declarations (`__APP_VERSION__`, `__GIT_HASH__`).
- `seo/`: 4-language (`en | zh | ja | ko`) 19-slug (76-URL) route registry, JSON-LD schemas, runtime `<head>` sync, SSG HTML/sitemap generators, and site chrome.
- `workspace/`: Above-the-fold 6-tool Quick Workspace UI (`QuickWorkspace`), DIP `WorkspaceEngines` contract, `engineAdapter.ts`, and 4-locale UI strings.
- `tools/`: Pure client-side HTML5 Canvas / Blob / JSZip engines for Merge, Split, Compress, Transform (Resize/Crop/Pad), and ID Card A4 Watermark.
- `theme/`: Persistent Light/Dark/System UI theme Zustand store (`useThemeStore`) and document theme applier.
- `bridge/`: Quick-Workspace-to-Studio handoff bridge (`stageImagesIntoStudio`) staging assets and editable `SlideGroup`s.
- `commercial/`: Free vs Moklu Studio Pro entitlement store (`useEntitlementStore`) and accessible `PricingModal`.
- `pages/`: Top-level route views (`ToolLandingPage`, `StudioPage`, `LocalizationView`, `ExportApp`).
- `components/`: Konva canvas nodes, Studio toolbar, side panels, modals, and shared UI primitives.
- `store/`: Zustand + Zundo undoable editor state, IndexedDB project persistence, and asset store.
- `utils/`: Canvas formats, QuickDesign presets, PNG/ZIP export pipelines, and validation helpers.
- `assets/`: Device/browser mockup frame SVGs, specs, and registry.
- `ai/`: Direct browser AI provider clients (OpenAI, OpenRouter, Gemini) and CSP origin allowlist.
- `hooks/`: Studio thumbnail capture, image cache warmer, and viewport hooks.
- `types/`: Core TypeScript domain types for projects, layers, slides, and device frames.
- `benchmarks/`: Core geometry and layout Vitest benchmarks.
- `test/`: Vitest test setup and helpers.

[PROTOCOL]: Update this header on change, then check GEMINI.md
