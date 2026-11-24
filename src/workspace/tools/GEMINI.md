# workspace/tools/
> L2 | Parent: ../GEMINI.md

Six focused, accessible Quick Tool panels rendered inside `QuickWorkspace`, delegating image synthesis to injected `WorkspaceEngines` with 150ms parameter debouncing, `aria-busy` preview indicators, local IndexedDB draft auto-save (excluding built-in demos), and Studio handoff.

## Member list
- `MockupQuickTool.tsx`: Shots.so-style screenshot beautifier reusing `QuickDesignPreview` (with live `scaleFactor`), draft-buffered dimension inputs, `useId` label bindings, offscreen PNG export, Pro batch CTA, local draft auto-save, and full-style Studio handoff.
- `SortableMergeThumb.tsx`: Draggable `@dnd-kit` thumbnail card with move, 90° rotate, and remove controls extracted from `MergeQuickTool`.
- `MergeQuickTool.tsx`: Multi-image drag-and-drop and button-reorderable strip with reverse order, 90° per-item rotation, side-by-side/vertical (with optional smart long-screenshot overlap removal toggle and trimmed-px badge)/2–6-col grid layouts, `cover`/`contain` fit, cross-axis alignment, per-image border, custom color picker, quality slider, auto-scale notice, clipboard PNG copy, single-page PDF export, local draft auto-save, and multi-layer Studio handoff (`mode: 'layers'`).
- `SplitQuickTool.tsx`: Carousel panorama (2–10 slides) and grid matrix (3×3, 2×2, custom rows×cols) splitter with cut-line overlay preview, debounced slicing, dark-safe slice download chips, local draft auto-save, error-handled ZIP export, and Studio carousel handoff.
- `CompressQuickTool.tsx`: Batch offline PNG/JPEG/WebP compressor and format converter with debounced quality, dark-safe savings badges, per-item remove, `ModalShell`-backed focus-trapped lightbox preview, local draft auto-save, and error-handled ZIP download.
- `ResizeQuickTool.tsx`: Multi-image Resize (draft-buffered px or scale %), Crop, and non-crop Border & Pad workflows with `ResizePreviewStage` busy-aware filmstrip switcher, ≥28–32px touch controls, debounced transforms, local draft auto-save, error-handled batch ZIP export, and full-batch Studio handoff.
- `IdCardQuickTool.tsx`: Front+back ID card slots, 100% offline privacy banner, A4 300/150 DPI debounced preview, locale-tracking anti-fraud watermark, grayscale photocopy mode, local draft auto-save (excluding sample mock IDs), and print-ready PNG export.

[PROTOCOL]: Update this header on change, then check GEMINI.md
