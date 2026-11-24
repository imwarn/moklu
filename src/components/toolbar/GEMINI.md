# toolbar/
> L2 | Parent: ../GEMINI.md

Top Studio application bar hosting project identity, Quick Design, Canvas Size, history undo/redo, `.moklu` local backup reminder, screenshot replacement, brand kit, localization toggle, export, and language switching.

## Member list
- `BrandKitButton.tsx`: Toolbar popover trigger (`BrandKitButton`) exposing project brand color swatches and rendering `BrandColorList` in a viewport-clamped `document.body` portal dialog.
- `Logo.tsx`: Pure inline-SVG Moklu Studio emblem and responsive wordmark (`Logo`) used in `Toolbar` and `AppLoadingScreen`.
- `projectBackupStorage.ts`: Pure `localStorage` (`moklu-backup-state`) edit-count tracker, threshold predicate (`>= 15` edits or `>= 3` slide groups), and `.moklu` portable bundle export helper.
- `ProjectBackupBadge.tsx`: Non-intrusive local-only storage reminder pill (`ProjectBackupBadge`) subscribing to project edits and triggering one-click `.moklu` portable bundle exports.
- `ProjectBackupBadge.test.tsx`: Vitest suite verifying backup threshold logic, `localStorage` persistence, `.moklu` bundle generation, and localized SSR rendering.
- `ReplaceScreenshotButton.tsx`: One-click screenshot replacement button (`ReplaceScreenshotButton`) consuming `useReplaceScreenshot` or externally shared state.
- `useReplaceScreenshot.ts`: Shared screenshot-replacement state hook (`useReplaceScreenshot`, `ReplaceScreenshotState`) resolving the active phone/image target and updating `useAssetStore` and `useEditorStore`.
- `Toolbar.tsx`: Primary Studio top chrome (`Toolbar`) orchestrating project controls, Quick Design, Canvas Size, undo/redo, `ProjectBackupBadge`, PNG export, Studio UI language switcher, responsive `ToolbarMoreMenu`, lazy `HelpModal` behind `ChunkErrorBoundary`, and landing-page return link.
- `ToolbarMoreMenu.tsx`: Responsive keyboard-accessible overflow trigger and portal menu (`ToolbarMoreMenu`) consolidating collapsed toolbar actions below 1600px (and mobile <640px/<768px actions).
- `Toolbar.test.tsx`: Vitest suite verifying `Toolbar` store subscription, SVG icon accessibility, absence of `overflow-x-auto` clipping, `More` menu trigger, `BrandKitButton` dialog rendering, and Emoji-free Insert/Toolbar icons.

[PROTOCOL]: Update this header on change, then check GEMINI.md
