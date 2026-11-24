# workspace/
> L2 | Parent: ../GEMINI.md

Above-the-fold instant Quick Workspace UI for all 6 Moklu image tools, built with Dependency Inversion (`WorkspaceEngines`) and native 4-language (`en | zh | ja | ko`) light/dark presentation.

## Member list
- `types.ts`: Dependency-inverted contracts (`WorkspaceToolId`, `WorkspacePreset` with `mergeFormat`, `WorkspaceLocale`, `WorkspaceMergeFormat`, `WorkspaceMergeAlign`, `WorkspaceMergeRotation`, `WorkspaceEngines`, `StudioHandoffPayload`, `QuickWorkspaceProps`).
- `batchHelpers.ts`: Pure multi-image batch navigation, safe index clamping, single-item removal, and multi-image Studio handoff payload builder.
- `i18n.ts`: 4-language `WorkspaceStrings` contract and `getWorkspaceStrings(locale)` facade delegating to `locales/*`.
- `locales/`: Complete EN/ZH/JA/KO UI dictionaries (`en.ts`, `zh.ts`, `ja.ts`, `ko.ts`) covering tabs, errors, swatches, merge alignment/border/PDF/clipboard labels, DPI labels, and localized default ID-card watermarks.
- `themeTokens.ts`: WCAG AA light and dark Neutral Zinc + Signal Orange semantic token maps (`getWorkspaceThemeTokens`) bound to `src/index.css` variables.
- `uiPrimitives.tsx`: Shared accessible primitives (`DropZone` with invalid-file alert + drag-drop + clipboard paste, `PrivacyBadge`, `PreviewBusyOverlay`, `SegmentedControl` with roving tabIndex + arrow/Home/End keys, `SliderField`, `StudioHandoffButton`, `ColorSwatchRow` with optional native custom color picker).
- `useDebouncedValue.ts`: Shared 150ms debounce hook (`useDebouncedValue`, `WORKSPACE_DEBOUNCE_MS`) preventing full-res canvas churn during slider drags and typing.
- `demoAssets.ts`: Deterministic SVG demo screenshot and sample ID card generators (`createDemoScreenshotDataUrl`, `createDemoImageInput`).
- `canvasUtils.ts`: Memory-safe file decoding (`URL.revokeObjectURL`), blob downloads, clipboard PNG copy (`copyImageToClipboard`, `isClipboardImageSupported`), byte formatting, and full-res offscreen HTML5 Canvas mockup PNG exporter.
- `defaultEngines.ts`: Browser-native fallback `WorkspaceEngines` (`merge` with cross-axis alignment/rotation/borders/PDF, `split`, `compress`, `transform`, `idCard`, on-demand dynamic-import `packZip`) for standalone execution when `src/tools` is not injected.
- `engineAdapter.ts`: Concrete DIP adapter (`createToolsWorkspaceEngines`, `parseBackgroundFill`, `formatSuffixedFilename`) wiring `src/tools` pure canvas engines, free-aspect crop preservation, safe filename stems, and guaranteed `LoadedImageItem` disposal into `QuickWorkspace`.
- `engineAdapter.test.ts`: Vitest suite verifying free-aspect crop preservation, filename suffix/fallback safety, gradient parsing, and disposal guarantees.
- `QuickWorkspace.tsx`: Root workspace shell with keyboard-navigable 6-tool tablist (Arrow/Home/End + focus migration), locale-preserving panel keys, route preset syncing, theme resolution, and engine merging.
- `index.ts`: Barrel exporting `QuickWorkspace`, contracts, i18n helper, demo utilities, and fallback engines.
- `workspace.test.tsx`: Vitest suite verifying SSR rendering across all 6 tools, 4 locales, light/dark Neutral Zinc + Signal Orange semantic tokens, roving tabIndex, label bindings, busy overlay, `QuickDesignPreview` scaleFactor, preset propagation, demo generators, and dynamic ZIP packing.
- `tools/`: Six focused tool panels (`MockupQuickTool`, `MergeQuickTool`, `SplitQuickTool`, `CompressQuickTool`, `ResizeQuickTool`, `IdCardQuickTool`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
