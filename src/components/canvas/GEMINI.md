# canvas/
> L2 | Parent: ../GEMINI.md

Konva interactive stage, polymorphic layer renderer, concrete device/text/shape/image/group/background nodes, in-canvas WYSIWYG text overlay, editing-context bar, and offscreen thumbnail stage.

## Member list
- `BackgroundNode.tsx`: Multi-stage canvas background renderer (`BackgroundNode`) composing solid/gradient fill, blurred image, tint overlay, interactive radial accents, and procedural noise.
- `BrandNode.tsx`: App-icon + title lockup Konva renderer (`BrandNode`) supporting row and column layouts around a center pivot.
- `CanvasTextEditor.tsx`: Transform-aligned in-canvas WYSIWYG `contentEditable` overlay (`CanvasTextEditor`) portaling `RichTextToolbar` into `PropertiesPanel` while `TextNode` hides.
- `EditingContext.test.ts`: Vitest suite verifying format/locale context switching and scoped-editing indicator behavior.
- `EditingContext.tsx`: Persistent top canvas-context bar (`EditingContextBar`, `EditingContextAlert`) managing canvas format tabs, locale switching, sync/fork modal triggers, and scoped override banners.
- `EditingContextChrome.tsx`: Animated tab-strip layout helpers (`SlidingUnderline`, `HorizontalScrollAffordance`) extracted from `EditingContext.tsx`.
- `effects.ts`: Shared Konva shadow mapper (`getShadowProps`) and halo-free padded CSS blur filter hook (`useKonvaBlur`).
- `EmojiNode.tsx`: Offscreen-canvas Unicode emoji renderer (`EmojiNode`) normalizing Konva transform scales into `fontSize`.
- `GroupNode.geometry.test.ts`: Vitest suite verifying `estimateLayerBox` and `estimateGroupBox` bounding-box math across layer types and nested groups.
- `GroupNode.geometry.ts`: Pure bounding-box estimators (`estimateLayerBox`, `estimateGroupBox`) computing unscaled local pivots for `GroupNode`.
- `GroupNode.tsx`: Composite group renderer (`GroupNode`) managing uniform center-pivot scaling, double-click group-edit entry, and recursive child `LayerNode` rendering.
- `ImageNode.tsx`: Asset-hydrated raster image Konva renderer (`ImageNode`) baking resize transforms into explicit `width` and `height`.
- `LayerNode.tsx`: Central polymorphic dispatcher (`LayerNode`) routing any `Layer` union member to its concrete Konva node renderer.
- `PhoneNode.geometry.test.ts`: Vitest suite verifying `calcScreenshotLayout` cover, contain, fill, and offset calculations.
- `PhoneNode.geometry.ts`: Pure aspect-ratio placement helper (`calcScreenshotLayout`) fitting screenshots inside device screens.
- `PhoneNode.tsx`: Device/browser mockup renderer (`PhoneNode`) compositing clipped screenshots, screen borders, `PhoneStatusBar`, and SVG frames.
- `PhoneStatusBar.tsx`: Non-interactive vector iOS/Android status bar (`PhoneStatusBar`) rendering 9:41 time, signal bars, Wi-Fi arcs, battery, and optional solid backdrop.
- `ShapeNode.tsx`: Vector shape Konva renderer (`ShapeNode`) supporting rectangles, ellipses, arrows, and parametric polygon/star/cross/check paths with live transform vertex updates.
- `StageCanvas.tsx`: Primary Konva editing viewport (`StageCanvas`) composing `stage/` hooks, multi-drag, transformers, `CanvasTextEditor`, and `StageOverlays`.
- `TextNode.tsx`: Plain and offscreen-rasterized rich-text Konva renderer (`TextNode`) implementing box-only resizing and double-click edit activation.
- `ThumbnailStage.tsx`: Non-interactive scaled Konva stage (`ThumbnailStage`) used for offscreen slide thumbnail rasterization.
- `stage/`: `StageCanvas` interaction hooks (`useStageViewport`, `useStageGeometry`, `useSelectionTransformers`, `useRubberBandSelection`, `useAssetDropTarget`), `StageLayerItem`, `StageOverlays`, and `multiDrag`.

[PROTOCOL]: Update this header on change, then check GEMINI.md
