# store/
> L2 | Parent: ../GEMINI.md

Zustand + Zundo state management, project/asset/font persistence, schema migrations, and pure layer-patching utilities for the Moklu Studio editor.

## Member list
- `index.ts`: Composition root exporting `useEditorStore` (zundo-wrapped across 9 slices with post-undo navigation reconciliation) and `useUndoRedo`.
- `types.ts`: Central `EditorStore` state-and-action contract plus `EditorSet` and `EditorGet` slice aliases.
- `helpers.ts`: Stable barrel re-exporting all factories, layer-patching utilities, schema migrations, and `layerTree` traversal functions.
- `factories.ts`: Pure ID/project/slide-group/background factories (`newId`, `newProject`, `newSlideGroup`, `createBackgroundLayer`, `bgFromLegacy`), layer cloning/scaling (`getLayerDefaultsScaleFactor`, `cloneLayerWithNewIds`, `cloneWithNewIds`, `bakeLayerScale`, `STYLE_KEYS`, `seedLocaleContent`, `pickLayerKeys`), shape guard (`assertProjectShape`), persistence stripping (`stripDataUrls`), and immutable mutators (`touchProject`, `touchSettings`, `getActiveGroup`, `mutateActiveGroup`).
- `layerPatches.ts`: Pure patch routing and override math (`deriveLocaleAdjustDelta`, `splitFormatPatch`, `splitLocaleFormatLayoutPatch`, `LOCALE_CONTENT_KEYS`, `splitLocalePatch`, `patchLayerForLocale`, `withFormatOverride`, `patchLayerForLocaleAdjust`, `withoutLocaleAdjust`, `withoutLocaleAdjustKey`, `resetLocaleAdjustsInLayerTree`, `withoutFormatOverride`, `patchLayerForFormat`).
- `migrations.ts`: Schema version constants (`LOCALE_SYMMETRIC_SCHEMA_VERSION`, `LOCALE_ADJUST_SCHEMA_VERSION`, `SLIDE_KEY_SCHEMA_VERSION`) and deterministic legacy project/layer migrations (`migrateLayerSpans`, `foldLayerToSymmetric`, `migrateProjectToLocaleAdjust`, `migrateProjectSlideKeys`, `normalizeGroupFamilies`, `migrateProject`).
- `projects.ts`: Multi-project library store (`useProjectsStore`), optimistic conflict signaling (`notifyProjectConflict`), and shared non-blocking hydration (`bootstrapProjects`, `ensureProjectsBootstrapped`, `abandonBootstrap`).
- `assets.ts`: Per-project binary image asset store (`useAssetStore`, `AssetEntry`) with debounced IndexedDB write-through and File/Directory import.
- `fontStore.ts`: Persisted custom font registry (`useFontStore`, `FontAssetEntry`) backed by IndexedDB under `pixeldeck-fonts`.
- `idb-storage.ts`: Low-level IndexedDB key-value adapter (`idbStorage`) compatible with Zustand `persist` and resilient to transaction errors/aborts.
- `apiKeys.ts`: Client-side AI provider credential and model store (`useApiKeysStore`, `ApiKeysState`, `AiProvider`) persisted in localStorage.
- `templates.ts`: Built-in template catalog store (`useTemplatesStore`, `TemplateManifestEntry`, `toAbsolute`) fetching and validating template manifests and JSON files.
- `previewCache.ts`: Ephemeral in-memory slide-group JPEG thumbnail cache (`usePreviewCache`, `PreviewCacheEntry`) keyed by content hash.
- `slices/`: Nine domain-focused Zustand slice creators composed into `useEditorStore` (see `slices/GEMINI.md`).
- `storage/`: Dependency-inverted `ProjectStorageAdapter` contract and browser `localStorageAdapter` backend (see `storage/GEMINI.md`).
- `__fixtures__/`: Frozen legacy project JSON fixtures (`legacy-4tier-project.json`) for migration regression tests.
- `assets.test.ts`: Vitest suite verifying project-scoped IndexedDB asset persistence, flushing, and hydration.
- `backgroundAccents.test.ts`: Vitest suite verifying background accent selection and mutation invariants.
- `clipboardSlice.test.ts`: Vitest suite verifying layer copy/cut/paste, style clipboard, and cross-slide paste behavior.
- `formatSlice.test.ts`: Vitest suite verifying multi-format switching, overrides, custom formats, and per-format visibility.
- `helpers.persistence.test.ts`: Vitest suite verifying schema migrations, `migrateProject`, `assertProjectShape`, and `stripDataUrls`.
- `hydration.test.ts`: Vitest suite verifying project hydration and bootstrap lifecycle.
- `idb-storage.test.ts`: Vitest suite verifying `idbStorage` read/write/delete and error/abort resilience.
- `index.test.ts`: Vitest suite covering `useEditorStore`, slices integration, and zundo undo/redo navigation reconciliation.
- `localeLayoutIntegration.test.ts`: Vitest suite verifying end-to-end locale layout authoring and resolution flows.
- `localeLayoutInvariants.test.ts`: Vitest suite verifying 3-tier `localeAdjust` algebraic and migration invariants against legacy fixtures.
- `localeLayoutSlice.test.ts`: Vitest suite verifying `clearLayerLocaleAdjust`, `clearLayerLocaleAdjustKey`, and `resetActiveLocaleAdjust`.
- `projectPersistence.test.ts`: Vitest suite verifying project export/import bundles and persistence round-trips.
- `projects.test.ts`: Vitest suite verifying `useProjectsStore` CRUD, save serialization, conflict handling, and bootstrap behavior.
- `selectionSlice.test.ts`: Vitest suite verifying single/multi-selection, group-edit mode, inline text editing, and viewport state.
- `slideGroupSlice.test.ts`: Vitest suite verifying slide-group CRUD, resizing, family forking, and cross-family content sync.

[PROTOCOL]: Update this header on change, then check GEMINI.md
