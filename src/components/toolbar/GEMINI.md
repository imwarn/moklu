# toolbar/
> L2 | Parent: ../GEMINI.md

Top Studio application bar hosting project identity, Quick Design, Canvas Size, history undo/redo, screenshot replacement, brand kit, localization toggle, export, and language switching.

## Member list
- `BrandKitButton.tsx`: Toolbar popover trigger (`BrandKitButton`) exposing project brand color swatches and embedding `BrandColorList` in compact mode.
- `Logo.tsx`: Pure inline-SVG Moklu Studio emblem and responsive wordmark (`Logo`) used in `Toolbar` and `AppLoadingScreen`.
- `ReplaceScreenshotButton.tsx`: One-click screenshot replacement action (`ReplaceScreenshotButton`) resolving the active phone/image target and updating `useAssetStore` and `useEditorStore`.
- `Toolbar.tsx`: Primary Studio top chrome (`Toolbar`) orchestrating project controls, lightweight modals, lazy `HelpModal` behind `ChunkErrorBoundary`, PNG export, Studio UI locale switching, and landing-page return link.
- `Toolbar.test.tsx`: Vitest suite verifying `Toolbar` rendering, localized controls, and modal/action triggers.

[PROTOCOL]: Update this header on change, then check GEMINI.md
