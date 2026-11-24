# pages/
> L2 | Parent: ../GEMINI.md

## Member list
- `ToolLandingPage.tsx`: Zero-splash SEO landing page wiring `SiteHeader`, `QuickWorkspace` with `createToolsWorkspaceEngines()`, `SeoLandingSections`, `SiteFooter`, lazy-loaded `PricingModal`, and on-demand dynamic `stageImagesIntoStudio()` handoff.
- `StudioPage.tsx`: Lazy-loaded full Konva multi-layer editor containing canvas, layers/properties panels, mobile drawers, slide navigator, keyboard shortcuts, localization mode with Suspense skeleton, and `← Tools` home link.
- `studioShortcuts.ts`: Pure keyboard shortcut command resolver and locked/background layer mutability guards consumed by `StudioPage.tsx`.
- `studioShortcuts.test.ts`: Vitest unit tests covering case-insensitive shortcuts, view gating, mobile drawer Escape handling, and locked/background layer protection.
- `LocalizationView.tsx`: Embedded multi-locale copy translation and preview workspace inside Studio with both BYOK API and Zero-Key Web AI copy/paste bulk translation.
- `ExportApp.tsx`: Headless Playwright CLI export renderer triggered when `window.__EXPORT_CONFIG__` is present.
- `localization/`: Helper modules, Zero-Key dual-track translation modal/parser, and unit tests supporting `LocalizationView.tsx`.

[PROTOCOL]: Update this header on change, then check GEMINI.md
