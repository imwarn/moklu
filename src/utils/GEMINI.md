# utils/
> L2 | Parent: ../GEMINI.md

Pure domain engines, canvas-format projection, localization, rich-text rendering, template instantiation, and PNG/ZIP export pipelines for Moklu Studio and Quick Workspace.

## Member list
- `alignLayers.ts`: Konva bounding-box delta alignment calculator (`getLayerBBox`, `getUnionBBox`, `computeAlignPatch`).
- `backgroundAccents.ts`: Pure background-accent opacity and render-color mutation helpers (`updateBackgroundAccentAt`, `getBackgroundAccentOpacity`, `getBackgroundAccentRenderColor`, `getNextBackgroundAccentIndex`).
- `backgroundAccents.test.ts`: Vitest suite verifying background-accent color/opacity clamping and insertion indexing.
- `brandColors.ts`: Brand color token parser and fill resolver (`isBrandToken`, `toBrandToken`, `parseBrandToken`, `resolveBrandColor`, `resolveFill`).
- `brandColors.test.ts`: Vitest suite verifying brand token syntax and fill resolution.
- `canvasFormatLayout.ts`: Locale-adjust delta composition (`applyLayoutDelta`, `applyLocaleAdjust`, `applyLocaleAdjustToGroup`, `resolveLayerLocaleAdjustBaseOnly`), combined view resolvers (`resolveGroupView`, `resolveProjectView`), and layer-tree format override/visibility/ownership helpers.
- `canvasFormatProjection.ts`: Geometric format projection engine (`rebasePhoneModelSwap`, `getFormatScaleFactor`, `scaleLayerToCanvas`, `resolveLayerFormat`, `applyCanvasFormatToGroup`, `applyCanvasFormat`, `mapLayerToAuthoringSpace`).
- `canvasFormatRegistry.ts`: Built-in format preset table (`CANVAS_FORMAT_PRESETS`), family/platform/delta constants, `FormatFamilyKey`, and pure metadata lookup helpers (`getCanvasFormat`, `getFormatLabel`, `getFormatPlatform`, `getFormatFamilyKey`, `getFormatCanvasDims`).
- `canvasFormatSelectors.ts`: Project/group format-family selectors, counterpart matching, fork-source selection, and active-format normalizers (`groupTargetsFormat`, `selectFamilyGroups`, `resolveCounterpartGroup`, `normalizeActiveFormats`, `getExportTargets`).
- `canvasFormats.ts`: Barrel facade re-exporting the complete `canvasFormatRegistry`, `canvasFormatSelectors`, `canvasFormatProjection`, and `canvasFormatLayout` API.
- `canvasFormats.test.ts`: Vitest suite covering format registry, family selectors, projection math, phone model swaps, and override lifecycle helpers.
- `canvasFormats.locale-adjust.test.ts`: Vitest suite verifying 3-tier `localeAdjust` delta composition and base/format scope separation.
- `canvasResize.ts`: Authoring canvas dimension presets, validation, and layer recenter/fit resizer (`CANVAS_PRESETS`, `validateCanvasDimensions`, `resizeCanvasLayers`).
- `canvasResize.test.ts`: Vitest suite verifying canvas dimension validation and center/fit layer resizing.
- `chunkRecovery.ts`: Deploy-rollover dynamic-import recovery guard and `vite:preloadError` + `unhandledrejection` listener (`isChunkLoadError`, `attemptChunkErrorRecovery`, `handleVitePreloadError`, `installChunkRecoveryListener`).
- `chunkRecovery.test.ts`: Vitest suite verifying chunk-error detection, leaf dynamic-import `attemptChunkErrorRecovery`, reload cooldown guards, and preload/`unhandledrejection` handling.
- `contentSync.ts`: Cross-family content synchronization planner (`CONTENT_SYNC_KEYS`, `planContentSync`) preserving layout, model, and fill independence.
- `contentSync.test.ts`: Vitest suite verifying cross-family layer pairing and content-only sync plans.
- `export.ts`: Konva stage-to-PNG rasterizer and browser download helper (`exportSlide`, `exportAllSlides`, `exportWholeGroup`, `exportGroupImages`, `downloadDataUrl`).
- `export.test.ts`: Vitest suite verifying single-slide, split-pano, and whole-pano PNG export pipelines.
- `exportPlan.ts`: Deterministic multi-format/multi-locale export planner and path sanitizer (`safeExportSegment`, `buildExportFileTarget`, `buildExportPlan`).
- `exportPlan.test.ts`: Vitest suite verifying export batching, filename sanitization, and format/locale targeting.
- `exportZip.ts`: Offline CSP-safe ZIP builder and File System Access directory writer (`decodeDataUrlToBytes`, `buildExportZipBlob`, `writeExportDirectoryFile`, `zipFileNameFor`).
- `exportZip.test.ts`: Vitest suite verifying ZIP archive creation, data-URL decoding, and directory export writes.
- `files.ts`: Minimal browser `FileReader` helper converting a `File` to a data URL (`fileToDataUrl`).
- `fonts.ts`: Curated Google Fonts catalog (`FONT_LIST`, `WEB_SAFE_FONTS`) and dynamic/custom `FontFace` loader (`loadGoogleFonts`, `ensureFontReady`, `loadCustomFont`, `registerCustomFonts`).
- `gradients.ts`: Color alpha and linear/radial gradient converters bridging `FillValue` to Konva props, CSS strings, and HTML5 Canvas gradients (`fillToKonvaProps`, `fillToCss`, `createCanvasGradient`).
- `gradients.test.ts`: Vitest suite verifying color alpha parsing and Konva/CSS/Canvas gradient conversions.
- `importValidation.ts`: Bounded JSON parser and schema validator for imported projects and templates (`IMPORT_LIMITS`, `checkImportFileSize`, `parseBoundedImportJson`, `validateProjectImport`, `validateTemplateImport`).
- `importValidation.test.ts`: Vitest suite verifying import byte limits, nesting bounds, and schema validation errors.
- `konvaFill.ts`: Brand-token-aware fill adapter translating `FillValue` to Konva shape props (`layerFillToKonvaProps`).
- `konvaFill.test.ts`: Vitest suite verifying brand-token resolution and gradient fill adaptation for Konva nodes.
- `layerTree.ts`: Recursive `Layer` tree traversal and immutable update primitives (`forEachLayerTree`, `mapLayerTree`, `findLayerInTree`, `updateLayerInTree`).
- `layerTree.test.ts`: Vitest suite verifying pre-order traversal, nested group mapping, and immutable layer updates.
- `locale.ts`: Project localization resolver (`applyLocaleToGroup`), manifest extractor/importer (`buildLocaleManifest`, `applyLocaleManifest`), and language catalog (`LANGUAGES`, `detectLocaleFromFilename`).
- `locale.test.ts`: Vitest suite verifying locale content merging, completeness checks, manifest round-trips, and filename locale detection.
- `multiFormatExport.ts`: Multi-locale/multi-format batch capture orchestrator (`exportProjectImages`, `ExportCancelledError`) coordinating store switching under capture lock.
- `multiFormatExport.test.ts`: Vitest suite verifying multi-format/locale batch export ordering, cancellation, and store restoration.
- `panoGeometry.ts`: Panoramic multi-slide width, gap-compensation, and slide offset geometry (`normalizePanoCompensationPx`, `getPanoGapPx`, `getPanoTotalWidth`, `getPanoSlideX`, `getEffectivePano`).
- `panoGeometry.test.ts`: Vitest suite verifying pano gap clamping, total width, and per-slide X offsets.
- `pngIntegrity.ts`: Fast PNG signature and IHDR dimension validator (`readPngDataUrlDimensions`, `assertPngExportDimensions`).
- `pngIntegrity.test.ts`: Vitest suite verifying PNG header signature and IHDR width/height validation.
- `previewKey.ts`: Fast FNV-1a cache key generator (`getGroupPreviewKey`) for slide thumbnail invalidation.
- `projectAssets.ts`: Project asset-key collector and portable JSON bundle serializer (`collectAssetKeys`, `buildProjectExportBundle`, `isProjectExportBundle`).
- `projectAssets.test.ts`: Vitest suite verifying recursive asset key collection and export bundle round-trips.
- `quickDesign.ts`: Quick Workspace mockup size/theme/device presets covering all 13 `PhoneModel` frames grouped by `MockupCategory`, placement calculator, and layer builder (`QUICK_SIZES`, `QUICK_THEMES`, `QUICK_MOCKUP_CATEGORIES`, `QUICK_MOCKUPS`, `getQuickMockupsByCategory`, `getQuickMockupPlacement`, `makeQuickLayers`).
- `quickDesign.test.ts`: Vitest suite verifying 13-device category coverage, Quick Workspace placement math, and generated layer trees.
- `quickPreview.ts`: Lightweight SVG mockup preview geometry and data-URL helper (`screenshotPreserveAspectRatio`, `getQuickPreviewGeometry`, `makeSvgImageDataUrl`).
- `quickPreview.test.ts`: Vitest suite verifying SVG aspect-ratio fit modes and preview geometry alignment.
- `richText.ts`: Range-based rich-text mark model and `contentEditable` DOM serializer/selection bridge (`segmentMarks`, `normalizeMarks`, `applyMarkStyle`, `marksToHtml`, `parseEditorDom`).
- `richText.test.ts`: Vitest suite verifying mark normalization, style application, and DOM round-trips.
- `scopedEditingIndicator.ts`: Active locale/format edit-scope status resolver (`getScopedEditingIndicator`) for Studio editing badges.
- `screenshotAssets.ts`: Screenshot upload type/size validator and asset-key preparer (`MAX_SCREENSHOT_BYTES`, `validateScreenshotFile`, `prepareScreenshotUpload`).
- `screenshotAssets.test.ts`: Vitest suite verifying screenshot MIME type, size bounds, and upload preparation.
- `stageCapture.ts`: Exclusive Konva stage capture lock, overlay isolation, and image/font settle synchronizer (`acquireCaptureLock`, `withHiddenEditorOverlays`, `withIdentityTransform`, `waitForStageCaptureReady`).
- `stageCapture.test.ts`: Vitest suite verifying capture lock exclusion, image classification, and stage settle synchronization.
- `stageRegistry.ts`: Singleton Konva `Stage` registry (`registerStage`, `getStage`) bridging `StageCanvas` to non-canvas panels.
- `telemetry.ts`: Privacy-first client-side funnel telemetry utility (`DEFAULT_MOKLU_TELEMETRY_ENDPOINT`, `FunnelEventName`, `NotFoundTelemetryProps`, `buildNotFoundTelemetryProps`, `resolveAnalyticsEndpoint`, `trackFunnelEvent`, `getRecentFunnelEvents`, `clearFunnelEvents`) stripping PII/filename/URL keys, bucketing `not_found_view` paths safely, retaining a bounded 100-event ring buffer, and dispatching same-origin `/_telemetry` beacons on `moklu.app` (or custom `VITE_ANALYTICS_ENDPOINT`).
- `telemetry.test.ts`: Vitest suite verifying PII/filename/URL stripping, safe metadata retention, `not_found_view` path/hash bucketing, ring-buffer bounds, `moklu.app` same-origin endpoint resolution, and `sendBeacon` resilience.
- `templateAppearance.ts`: Selective style-only template applier (`DEFAULT_APPEARANCE_PARTS`, `applyTemplateAppearance`) preserving slide content and layout.
- `templateAppearance.test.ts`: Vitest suite verifying selective background, typography, and phone appearance transfers.
- `templateSlots.ts`: Slot-preserving template applier (`findScreenshotTarget`, `applyTemplateToCanvas`) rebinding existing screenshots onto scaled template layers.
- `templateSlots.test.ts`: Vitest suite verifying screenshot slot discovery and scaled template binding.
- `templates.ts`: Template serialization, inline-image stripping, ID regeneration, and instantiation engine (`projectToTemplate`, `applyTemplate`, `extractInlineScreenshots`, `isTemplate`).
- `templates.test.ts`: Vitest suite verifying template export/import, deterministic IDs, and image extraction.
- `textRendering.ts`: Rich-text line wrapper and offscreen HTML5 Canvas span renderer (`layerToLines`, `wrapFragmentLines`, `renderSpansToCanvas`, `spansRenderKey`, `spansToMarks`).
- `textRendering.test.ts`: Vitest suite verifying line wrapping, render keys, and span-to-mark conversion.
- `thumbnailRender.ts`: Slide-navigator thumbnail capture geometry, expensive-effect stripping, and queue prioritization (`NAV_THUMB_CAPTURE_HEIGHT_PX`, `stripExpensiveEffects`, `getThumbnailStageGeometry`, `enqueueRequests`).
- `thumbnailRender.test.ts`: Vitest suite verifying effect stripping, thumbnail stage geometry, and request queueing.

[PROTOCOL]: Update this header on change, then check GEMINI.md
