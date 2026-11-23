# src/
> L2 | Parent: ../GEMINI.md

## Member list
- `main.tsx`: Tick-0 browser mount entry point, `vite:preloadError` auto-recovery (`installChunkRecoveryListener`), Google Fonts loader, non-blocking background project bootstrap (`ensureProjectsBootstrapped`), and headless ExportApp switch.
- `App.tsx`: Lightweight History API SPA router routing `/` and 18 localized SEO tool slugs to `ToolLandingPage` and `/studio` to lazy-loaded `StudioPage` wrapped in `ChunkErrorBoundary`.
- `config.ts`: Canonical site config exporting `SITE_URL` (`https://moklu.app`), `BRAND_NAME` (`Moklu`), and `getPixelDeckConfig()`.
- `index.css`: Tailwind v4 theme tokens, `@custom-variant dark` selector bound to `[data-theme="dark"]`, and adaptive Light/Dark vs Studio body/scrollbar rules.
- `globals.d.ts`: Build-time Vite constant declarations (`__APP_VERSION__`, `__GIT_HASH__`).
- `seo/`: 4-language (`en | zh | ja | ko`) 19-slug (76-URL) route registry, JSON-LD schemas, runtime `<head>` sync, SSG HTML/sitemap generators, `ssrEntry.ts`, and site chrome.
- `i18n/`: Decoupled 4-language (`en | zh | ja | ko`) Studio UI localization context (`StudioLocaleProvider`, `useStudioLocale`), message/relative-time formatters (`format.ts`), and complete dictionaries for Studio toolbar, panels, properties, modals, and localization view.
- `workspace/`: Above-the-fold 6-tool Quick Workspace UI (`QuickWorkspace`), DIP `WorkspaceEngines` contract, `engineAdapter.ts`, `useDebouncedValue.ts`, and split 4-locale UI strings (`locales/`).
- `tools/`: Pure client-side HTML5 Canvas / Blob / JSZip engines for Merge, Split, Compress, Transform (Resize/Crop/Pad), and ID Card A4 Watermark.
- `theme/`: Persistent Light/Dark/System UI theme Zustand store (`useThemeStore`) and document theme applier.
- `bridge/`: Quick-Workspace-to-Studio handoff bridge (`stageImagesIntoStudio`) staging assets and editable `SlideGroup`s.
- `commercial/`: Free vs Moklu Studio Pro entitlement store (`useEntitlementStore`) and accessible `PricingModal`.
- `pages/`: Top-level route views (`ToolLandingPage`, `StudioPage`, `LocalizationView`, `ExportApp`).
- `components/`: Konva canvas nodes (`canvas/`, `canvas/stage/`), Studio toolbar (`toolbar/`), side panels (`panels/`, `panels/help/`, `panels/layers/`), property editors (`properties/`), rich-text controls (`text/`), AI settings (`ai/`), common modals (`common/`), and shared UI primitives (`ui/`), each with L2 `GEMINI.md` maps.
- `store/`: Zustand + Zundo undoable editor state (`slices/`), IndexedDB/localStorage persistence (`storage/`), asset store, and split project helpers (`helpers.ts` barrel over `factories.ts`, `layerPatches.ts`, `migrations.ts`), with L2 `GEMINI.md` maps.
- `utils/`: Split canvas format engine (`canvasFormats.ts` barrel over `canvasFormatRegistry.ts`, `canvasFormatSelectors.ts`, `canvasFormatProjection.ts`, `canvasFormatLayout.ts`), QuickDesign presets, PNG/ZIP export pipelines, and validation helpers (`GEMINI.md`).
- `assets/`: Device/browser mockup frame SVGs, specs, and registry (`mockups/`), with L2 `GEMINI.md` maps.
- `ai/`: Direct browser AI provider clients (OpenAI, OpenRouter, Gemini), prompt/transport utilities, feature runners (`features/`), and CSP origin allowlist, with L2 `GEMINI.md` maps.
- `hooks/`: Studio thumbnail capture, image cache warmer, layer interaction/transform/effects, and brand-color hooks (`GEMINI.md`).
- `types/`: Core TypeScript domain types for projects, layers, slides, and device frames (`GEMINI.md`).
- `benchmarks/`: Core geometry and layout Vitest benchmarks.
- `test/`: Vitest test setup and helpers.

[PROTOCOL]: Update this header on change, then check GEMINI.md
