# workspace/
> L2 | Parent: ../GEMINI.md

Above-the-fold instant Quick Workspace UI for all 6 Moklu image tools, built with Dependency Inversion (`WorkspaceEngines`) and native 4-language (`en | zh | ja | ko`) light/dark presentation.

## Member list
- `types.ts`: Dependency-inverted contracts (`WorkspaceToolId`, `WorkspacePreset`, `WorkspaceLocale`, `WorkspaceEngines`, `StudioHandoffPayload`, `QuickWorkspaceProps`).
- `i18n.ts`: Complete EN/ZH/JA/KO UI strings for tool tabs, dropzones, sliders, privacy badges, and localized default ID-card watermarks.
- `themeTokens.ts`: Crisp light and dark semantic Tailwind class token maps (`getWorkspaceThemeTokens`).
- `uiPrimitives.tsx`: Shared accessible primitives (`DropZone` with drag-drop + clipboard paste, `PrivacyBadge`, `SegmentedControl`, `SliderField`, `StudioHandoffButton`, `ColorSwatchRow`).
- `demoAssets.ts`: Deterministic SVG demo screenshot and sample ID card generators (`createDemoScreenshotDataUrl`, `createDemoImageInput`).
- `canvasUtils.ts`: Memory-safe file decoding (`URL.revokeObjectURL`), blob downloads, byte formatting, and full-res offscreen HTML5 Canvas mockup PNG exporter.
- `defaultEngines.ts`: Browser-native fallback `WorkspaceEngines` (`merge`, `split`, `compress`, `transform`, `idCard`, `packZip`) for standalone execution when `src/tools` is not injected.
- `QuickWorkspace.tsx`: Root workspace shell with accessible 6-tool tablist, route preset syncing, theme resolution, and engine merging.
- `index.ts`: Barrel exporting `QuickWorkspace`, contracts, i18n helper, demo utilities, and fallback engines.
- `workspace.test.tsx`: Vitest suite verifying SSR rendering across all 6 tools, 4 locales, light/dark themes, preset propagation, demo generators, and ZIP packing.
- `tools/`: Six focused tool panels (`MockupQuickTool`, `MergeQuickTool`, `SplitQuickTool`, `CompressQuickTool`, `ResizeQuickTool`, `IdCardQuickTool`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
