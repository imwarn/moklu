# workspace/tools/
> L2 | Parent: ../GEMINI.md

Six focused, accessible Quick Tool panels rendered inside `QuickWorkspace`, delegating image synthesis to injected `WorkspaceEngines` with 150ms parameter debouncing, `aria-busy` preview indicators, and Studio handoff.

## Member list
- `MockupQuickTool.tsx`: Shots.so-style screenshot beautifier reusing `QuickDesignPreview` (with live `scaleFactor`), draft-buffered dimension inputs, `useId` label bindings, offscreen PNG export, Pro batch CTA, and full-style Studio handoff.
- `MergeQuickTool.tsx`: Multi-image reorderable strip (≥28px touch controls) with side-by-side, vertical stitch, and grid collage layouts, debounced live preview, localized swatches, and Studio handoff.
- `SplitQuickTool.tsx`: Carousel panorama (2–10 slides) and grid matrix (3×3, 2×2, custom rows×cols) splitter with cut-line overlay preview, debounced slicing, dark-safe slice download chips, error-handled ZIP export, and Studio carousel handoff.
- `CompressQuickTool.tsx`: Batch offline PNG/JPEG/WebP compressor and format converter with debounced quality, dark-safe savings badges, per-item remove, `ModalShell`-backed focus-trapped lightbox preview, and error-handled ZIP download.
- `ResizeQuickTool.tsx`: Multi-image Resize (draft-buffered px or scale %), Crop, and non-crop Border & Pad workflows with `ResizePreviewStage` busy-aware filmstrip switcher, ≥28–32px touch controls, debounced transforms, error-handled batch ZIP export, and full-batch Studio handoff.
- `IdCardQuickTool.tsx`: Front+back ID card slots, 100% offline privacy banner, A4 300/150 DPI debounced preview, locale-tracking anti-fraud watermark, grayscale photocopy mode, and print-ready PNG export.

[PROTOCOL]: Update this header on change, then check GEMINI.md
