# workspace/
> L2 | Parent: ../GEMINI.md

Above-the-fold instant Quick Workspace UI for all 6 Moklu image tools, built with Dependency Inversion (`WorkspaceEngines`), IndexedDB local draft auto-save (`moklu-workspace-drafts`), multi-layer Studio handoff, and native 4-language (`en | zh | ja | ko`) light/dark presentation.

## Member list
- `types.ts`: Dependency-inverted contracts (`WorkspaceToolId`, `WorkspacePreset`, `WorkspaceLocale`, `WorkspaceMergeFormat`, `WorkspaceMergeAlign`, `WorkspaceMergeRotation`, `WorkspaceRect`, `WorkspaceMergePlacement`, `WorkspaceMergeLayout`, `WorkspaceMergeOutput`, `WorkspaceEngines`, `StudioHandoffLayer`, `StudioHandoffPayload`, `QuickWorkspaceProps`).
- `batchHelpers.ts`: Pure multi-image batch navigation, safe index clamping, single-item removal, and multi-image Studio handoff payload builder.
- `mergeHandoff.ts`: Multi-layer Studio handoff builder (`buildMergeStudioHandoff`, `isPartialSourceCrop`, `placementToStudioLayer`, `cropSourceRectToDataUrl`) slicing cropped `sourceRect` fragments offscreen and mapping rotated `destRect` placements to Konva center coordinates.
- `draftStorage.ts`: Zero-dependency IndexedDB draft store (`moklu-workspace-drafts`) with `tx.onabort`/`tx.onerror` safety, SSR/missing-IDB silent degradation, and strict built-in demo image exclusion (`serializeDraftImages`, `deserializeDraftImages`, `loadToolDraft`, `saveToolDraft`, `deleteToolDraft`, `clearAllToolDrafts`).
- `draftStorage.test.ts`: Vitest suite verifying IndexedDB draft round-trip, demo image exclusion, `tx.onabort`/`tx.onerror` non-hanging fallback, and SSR silent degradation.
- `useToolDraft.ts`: React hook (`useToolDraft`, `WORKSPACE_DRAFT_DEBOUNCE_MS`) driving debounced auto-save and mount-time hydration across Quick Workspace panels without persisting demo images.
- `i18n.ts`: 4-language `WorkspaceStrings` contract and `getWorkspaceStrings(locale)` facade delegating to `locales/*`.
- `locales/`: Complete EN/ZH/JA/KO UI dictionaries (`en.ts`, `zh.ts`, `ja.ts`, `ko.ts`) covering tabs, errors, swatches, merge alignment/border/overlap-removal/PDF/clipboard labels, draft status controls, DPI labels, and localized default ID-card watermarks (zero em-dashes).
- `themeTokens.ts`: WCAG AA light and dark Neutral Zinc + Signal Orange semantic token maps (`getWorkspaceThemeTokens`) bound to `src/index.css` variables.
- `uiPrimitives.tsx`: Shared accessible primitives (`DropZone`, `PrivacyBadge`, `PreviewBusyOverlay`, `SegmentedControl`, `SliderField`, `StudioHandoffButton`, `ColorSwatchRow`, `DraftStatusBar`).
- `useDebouncedValue.ts`: Shared 150ms debounce hook (`useDebouncedValue`, `WORKSPACE_DEBOUNCE_MS`) preventing full-res canvas churn during slider drags and typing.
- `demoAssets.ts`: Deterministic SVG demo screenshot and sample ID card generators (`createDemoScreenshotDataUrl`, `createDemoImageInput` tagged with `isDemo: true`).
- `canvasUtils.ts`: Memory-safe file decoding (`URL.revokeObjectURL`), blob downloads, clipboard PNG copy (`copyImageToClipboard`, `isClipboardImageSupported`), byte formatting, and full-res offscreen HTML5 Canvas mockup PNG exporter.
- `defaultEngines.ts`: Browser-native fallback `WorkspaceEngines` (`merge` returning full `WorkspaceMergeLayout` placements + PDF/rotation/borders/alignment, `split`, `compress`, `transform`, `idCard`, on-demand dynamic-import `packZip`) for standalone execution when `src/tools` is not injected.
- `engineAdapter.ts`: Concrete DIP adapter (`createToolsWorkspaceEngines`, `parseBackgroundFill`, `formatSuffixedFilename`) wiring `src/tools` pure canvas engines, merge layout + smart overlap removal forwarding, free-aspect crop preservation, safe filename stems, and guaranteed `LoadedImageItem` disposal into `QuickWorkspace`.
- `engineAdapter.test.ts`: Vitest suite verifying merge layout/overlap forwarding, free-aspect crop preservation, filename suffix/fallback safety, gradient parsing, and disposal guarantees.
- `QuickWorkspace.tsx`: Root workspace shell with keyboard-navigable 6-tool tablist (Arrow/Home/End + focus migration), locale-preserving panel keys, route preset syncing, theme resolution, and engine merging.
- `index.ts`: Barrel exporting `QuickWorkspace`, contracts, i18n helper, multi-layer merge handoff, IndexedDB draft storage/hook, demo utilities, and fallback engines.
- `workspace.test.tsx`: Vitest suite verifying SSR rendering across all 6 tools, 4 locales (zero em-dashes), light/dark semantic tokens, roving tabIndex, label bindings, busy overlay, `QuickDesignPreview` scaleFactor, vertical overlap-removal toggle, `buildMergeStudioHandoff` multi-layer geometry & cropping, `DraftStatusBar`, preset propagation, demo generators, and dynamic ZIP packing.
- `tools/`: Six focused tool panels (`MockupQuickTool`, `MergeQuickTool` + `SortableMergeThumb`, `SplitQuickTool`, `CompressQuickTool`, `ResizeQuickTool`, `IdCardQuickTool`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
