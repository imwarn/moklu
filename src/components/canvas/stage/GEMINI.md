# stage/
> L2 | Parent: ../GEMINI.md

Decomposed viewport, geometry, selection, drag-and-drop, multi-drag, and overlay modules orchestrated by `StageCanvas`.

## Member list
- `backdropPresets.ts`: Non-destructive 3-tone canvas surround presets and `localStorage` persistence helpers (`CanvasBackdropTone`, `STUDIO_BACKDROP_STORAGE_KEY`, `CANVAS_BACKDROP_PRESETS`, `loadStoredCanvasBackdrop`, `persistCanvasBackdrop`).
- `canvasInteraction.test.ts`: Vitest suite verifying multi-drag resolution, viewport transitions, fit calculations, and Space-pan target guards.
- `multiDrag.ts`: Pure multi-selection drag coordinate resolver (`MultiDragStartEntry`, `resolveMultiDragStartPositions`) computing start positions against view-resolved layers.
- `StageLayerItem.tsx`: Memoized per-layer store bridge (`StageLayerItem`) binding selection, drag/transform, group-edit, and background-accent mutations to `LayerNode`.
- `StageOverlays.tsx`: Viewport overlay chrome (`CanvasShadow`, `SeamGuides`, `StageChrome`) rendering panoramic slide seams, asset drop highlights, group-edit bar, 3-tone canvas surround switcher, and zoom/Fit controls.
- `useAssetDropTarget.ts`: Stage drag-and-drop hook (`useAssetDropTarget`, `AssetDropHighlight`) resolving dropped library assets or image files into phone/image replacements or new image layers.
- `useRubberBandSelection.ts`: Marquee drag-selection hook (`useRubberBandSelection`) selecting non-background layers fully contained within the dragged box.
- `useSelectionTransformers.ts`: Konva transformer sync hook (`useSelectionTransformers`) attaching primary selection, background-accent, and group-edit outline transformers while detaching during text edits.
- `useStageGeometry.ts`: Panoramic stage sizing helper (`useStageGeometry`) computing compensation, gap width, total logical canvas dimensions, and zoom-scaled display dimensions.
- `useStageViewport.ts`: Viewport pan/zoom/fit/resize controller (`useStageViewport`, `ViewportSnapshot`, `ViewportState`, `ViewportTransitionInput`, `computeFitViewport`, `computeViewportTransition`, `shouldIgnoreSpacePanTarget`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
