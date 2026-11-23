# workspace/tools/
> L2 | Parent: ../GEMINI.md

Six focused, accessible Quick Tool panels rendered inside `QuickWorkspace`, delegating image synthesis to injected `WorkspaceEngines` and handing off compositions to `/studio`.

## Member list
- `MockupQuickTool.tsx`: Shots.so-style screenshot beautifier reusing `QuickDesignPreview` and `QUICK_MOCKUPS`/`QUICK_SIZES`/`QUICK_THEMES`, with 1-click demo preview, offscreen PNG export, Pro batch CTA, and Studio handoff.
- `MergeQuickTool.tsx`: Multi-image reorderable strip with side-by-side, vertical stitch, and grid collage layouts, live preview, and Studio handoff.
- `SplitQuickTool.tsx`: Carousel panorama (2–10 slides) and grid matrix (3×3, 2×2, custom rows×cols) splitter with cut-line overlay preview, slice downloads, ZIP export, and Studio carousel handoff.
- `CompressQuickTool.tsx`: Batch offline PNG/JPEG/WebP compressor and format converter with quality/max-width controls, per-file KB savings badges, and ZIP download.
- `ResizeQuickTool.tsx`: Resize, Crop, and non-crop Border & Pad workflows with social aspect presets, shadow/radius controls, batch ZIP export, and Studio handoff.
- `IdCardQuickTool.tsx`: Front+back ID card slots, 100% offline privacy banner, A4 300/150 DPI preview, customizable anti-fraud watermark, grayscale photocopy mode, and print-ready PNG export.

[PROTOCOL]: Update this header on change, then check GEMINI.md
