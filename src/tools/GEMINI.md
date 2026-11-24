# tools/
> L2 | Parent: ../GEMINI.md

Pure client-side HTML5 Canvas, Blob, and JSZip image processing engines. Zero external network calls; every engine separates pure layout geometry from injectable Canvas 2D rendering for deterministic testing.

Member list
- `types.ts`: Shared input, option, layout, canvas abstraction, overlap analysis, and result interfaces across all five engines (including `MergeAlign`, `MergeRotation`, `MergeOutputFormat`, `MergeLayoutItem`, `ImageDataLike`, `PairOverlapMatch`, `VerticalItemTrim`).
- `canvasHelpers.ts`: Offline image loader with `URL.revokeObjectURL` lifecycle, 8192px/64MP dimension clamp, rounded-rect clipping, solid/gradient fill, canvas-to-Blob encoding, byte formatter, and `packBlobsToZip` via `jszip`.
- `pdfHelper.ts`: Zero-dependency single-page PDF 1.4 binary builder (`buildSinglePagePdfBytes`, `createSinglePagePdfFromJpeg`) wrapping JPEG bytes via `/DCTDecode`.
- `stitchOverlap.ts`: Pure client-side 2D pixel overlap and fixed top/bottom bar detector (`computeRowProfile`, `detectPairOverlap`, `extractNormalizedRaster`, `detectVerticalStitchOverlaps`) for vertical long-screenshot deduplication with safe fallback when `getImageData` is unavailable.
- `mergeEngine.ts`: Horizontal side-by-side, vertical long-image stitch (with optional `removeOverlap` deduplication and `overlapRemovedPx` reporting), and 2..6 column grid collage layout solver (`computeMergeLayout`) and Canvas renderer (`mergeImages`) with cross-axis alignment, per-item 90° rotation, per-image border strokes, and PNG/JPEG/WebP/PDF export.
- `splitEngine.ts`: Seamless social carousel panorama (`4:5`, `3:4`, `1:1`, `auto`) and `1..6 x 1..6` grid matrix splitter (`computeCarouselSlices`, `computeGridSlices`, `splitImage`) with ZIP export.
- `compressEngine.ts`: Local batch WebP/JPEG/PNG compressor and downscaler (`computeCompressedDimensions`, `compressImage`, `compressImages`) with exact byte-savings metrics and ZIP archive.
- `transformEngine.ts`: Batch resize, normalized/preset crop, and non-cropping border/pad engine (`computeResizeGeometry`, `computeCropGeometry`, `computePadGeometry`, `transformImage`, `transformImages`) with shadow and gradient support.
- `idCardEngine.ts`: Privacy-first offline A4 (300/150 DPI) ID-1 physical card (`85.6mm x 54mm`) composer (`computeIdCardSheetLayout`, `composeIdCardSheet`) with photocopy B&W filter and tiled or across-card anti-fraud watermark.
- `index.ts`: Public barrel re-exporting all engines, overlap detector, helpers, constants, and types.
- `testHelpers.ts`: Deterministic recording `CanvasLike` / `CanvasContextLike` test doubles and mock image factory for Node Vitest suites.
- `canvasHelpers.test.ts`: Unit tests for dimension clamping, object-fit math, background/clipping primitives, offline image loader cleanup, and JSZip packaging.
- `stitchOverlap.test.ts`: Unit tests for row gradient fingerprinting, multi-frame scrolling overlap trimming, fixed top/bottom bar deduplication, solid/unrelated false-positive guards, mismatched-width normalization, noise/rotation handling, and missing `getImageData` fallback.
- `mergeSplit.test.ts`: Unit tests for `mergeEngine`, `pdfHelper`, and `splitEngine` layout geometry, vertical overlap trims, cross-axis alignment, rotation, borders, single-page PDF 1.4 xref integrity, canvas draw calls, and ZIP slice archives.
- `compressTransformIdCard.test.ts`: Unit tests for `compressEngine`, `transformEngine`, and `idCardEngine` including A4 ID-1 scaling, watermark placements, and batch ZIP exports.

[PROTOCOL]: Update this header on change, then check GEMINI.md
