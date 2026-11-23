# tools/
> L2 | Parent: ../GEMINI.md

Pure client-side HTML5 Canvas, Blob, and JSZip image processing engines. Zero external network calls; every engine separates pure layout geometry from injectable Canvas 2D rendering for deterministic testing.

Member list
- `types.ts`: Shared input, option, layout, canvas abstraction, and result interfaces across all five engines.
- `canvasHelpers.ts`: Offline image loader with `URL.revokeObjectURL` lifecycle, 8192px/64MP dimension clamp, rounded-rect clipping, solid/gradient fill, canvas-to-Blob encoding, byte formatter, and `packBlobsToZip` via `jszip`.
- `mergeEngine.ts`: Horizontal side-by-side, vertical long-image stitch, and 2..6 column grid collage layout solver (`computeMergeLayout`) and Canvas renderer (`mergeImages`).
- `splitEngine.ts`: Seamless social carousel panorama (`4:5`, `3:4`, `1:1`, `auto`) and `1..6 x 1..6` grid matrix splitter (`computeCarouselSlices`, `computeGridSlices`, `splitImage`) with ZIP export.
- `compressEngine.ts`: Local batch WebP/JPEG/PNG compressor and downscaler (`computeCompressedDimensions`, `compressImage`, `compressImages`) with exact byte-savings metrics and ZIP archive.
- `transformEngine.ts`: Batch resize, normalized/preset crop, and non-cropping border/pad engine (`computeResizeGeometry`, `computeCropGeometry`, `computePadGeometry`, `transformImage`, `transformImages`) with shadow and gradient support.
- `idCardEngine.ts`: Privacy-first offline A4 (300/150 DPI) ID-1 physical card (`85.6mm x 54mm`) composer (`computeIdCardSheetLayout`, `composeIdCardSheet`) with photocopy B&W filter and tiled or across-card anti-fraud watermark.
- `index.ts`: Public barrel re-exporting all engines, helpers, constants, and types.
- `testHelpers.ts`: Deterministic recording `CanvasLike` / `CanvasContextLike` test doubles and mock image factory for Node Vitest suites.
- `canvasHelpers.test.ts`: Unit tests for dimension clamping, object-fit math, background/clipping primitives, offline image loader cleanup, and JSZip packaging.
- `mergeSplit.test.ts`: Unit tests for `mergeEngine` and `splitEngine` layout geometry, canvas draw calls, and ZIP slice archives.
- `compressTransformIdCard.test.ts`: Unit tests for `compressEngine`, `transformEngine`, and `idCardEngine` including A4 ID-1 scaling, watermark placements, and batch ZIP exports.

[PROTOCOL]: Update this header on change, then check GEMINI.md
