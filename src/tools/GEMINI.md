# tools/
> L2 | Parent: ../GEMINI.md

Pure client-side HTML5 Canvas, Blob, binary EXIF/PDF, dynamic HEIC WASM, and JSZip image processing engines. Zero external network calls; every engine separates pure layout geometry from injectable Canvas 2D rendering for deterministic testing.

Member list
- `types.ts`: Shared input, option, layout, canvas abstraction, vertical seam telemetry, PDF mode, target-KB compression, and result interfaces across all processing engines.
- `canvasHelpers.ts`: Offline image loader with `URL.revokeObjectURL` lifecycle, 8192px/64MP dimension clamp, rounded-rect clipping, solid/gradient fill, Canvas format capability detection (`canEncodeCanvasFormat`, `resetCanvasFormatProbeCache`, `resolveEncodedImageFormat`), canvas-to-Blob encoding with WebKit/Safari silent WebP-to-PNG fallback re-encoding as JPEG, byte formatter, and `packBlobsToZip` via `jszip`.
- `heicDecoder.ts`: Native-first local HEIC/HEIF detector (`isHeicFile`) and decoder (`decodeHeicToBlob`) falling back to lazy dynamic `import('heic-to/csp')` (zero `eval`/`new Function`, 0 KB main-bundle impact) with injectable hooks for Node tests.
- `exifReader.ts`: Zero-dependency pure `DataView` binary EXIF & GPS inspector (`parseExifFromBuffer`, `readExifSummary`) supporting JPEG `APP1`, PNG `eXIf`, WebP `EXIF`, and ISOBMFF/HEIC `Exif` payloads without ever throwing.
- `pdfHelper.ts`: Zero-dependency single- and multi-page PDF 1.4 binary builder (`buildSinglePagePdfBytes`, `createSinglePagePdfFromJpeg`, `buildMultiPagePdfBytes`, `createMultiPagePdfFromJpegs`) supporting ISO A4 portrait/landscape, fit-to-image sizing, 36pt margins, white backgrounds, and 20-byte `xref` tables via `/DCTDecode`.
- `stitchOverlap.ts`: Pure client-side 2D pixel overlap, fixed top/bottom bar detector, and manual seam-override resolver (`computeRowProfile`, `detectPairOverlap`, `extractNormalizedRaster`, `detectVerticalStitchOverlaps`, `applySeamOverlapOverrides`) for vertical long-screenshot deduplication with safe 16px clamping and fallback when `getImageData` is unavailable.
- `mergeEngine.ts`: Horizontal side-by-side, vertical long-image stitch (with automatic `removeOverlap` deduplication, `seamOverlapOverrides`, and `seams`/`overlapRemovedPx` reporting), and 2..6 column grid collage layout solver (`computeMergeLayout`) and Canvas renderer (`mergeImages`) with cross-axis alignment, per-item 90° rotation, per-image border strokes, and PNG/JPEG/WebP/single- or multi-page PDF export.
- `splitEngine.ts`: Seamless social carousel panorama (`4:5`, `3:4`, `1:1`, `auto`) and `1..6 x 1..6` grid matrix splitter (`computeCarouselSlices`, `computeGridSlices`, `splitImage`) with ZIP export.
- `compressEngine.ts`: Local batch WebP/JPEG/PNG compressor and downscaler (`computeCompressedDimensions`, `compressImage`, `compressImages`) with 7-iteration `targetBytes` quality binary search, optional iterative width auto-downscaling (320px floor), exact byte-savings metrics, and ZIP archive.
- `transformEngine.ts`: Batch resize, normalized/preset crop, and non-cropping border/pad engine (`computeResizeGeometry`, `computeCropGeometry`, `computePadGeometry`, `transformImage`, `transformImages`) with shadow and gradient support.
- `idCardEngine.ts`: Privacy-first offline A4 (300/150 DPI) ID-1 physical card (`85.6mm x 54mm`) composer (`computeIdCardSheetLayout`, `composeIdCardSheet`) with photocopy B&W filter and tiled or across-card anti-fraud watermark.
- `index.ts`: Public barrel re-exporting all engines, HEIC decoder, EXIF inspector, overlap & seam resolver, PDF builders, helpers, constants, and types.
- `testHelpers.ts`: Deterministic recording `CanvasLike` / `CanvasContextLike` test doubles and mock image factory for Node Vitest suites.
- `canvasHelpers.test.ts`: Unit tests for dimension clamping, object-fit math, background/clipping primitives, offline image loader cleanup, and JSZip packaging.
- `heicDecoder.test.ts`: Unit tests for HEIC/HEIF detection, native-first decode fast path, and WASM fallback lifecycle transitions.
- `exifReader.test.ts`: Unit tests for JPEG (LE/BE), PNG `eXIf`, WebP `EXIF`, and ISOBMFF/HEIC EXIF & GPS parsing plus malformed/cyclic buffer safety.
- `stitchOverlap.test.ts`: Unit tests for row gradient fingerprinting, multi-frame scrolling overlap trimming, fixed top/bottom bar deduplication, manual `seamOverlapOverrides` clamping, solid/unrelated false-positive guards, mismatched-width normalization, noise/rotation handling, and missing `getImageData` fallback.
- `mergeSplit.test.ts`: Unit tests for `mergeEngine`, `pdfHelper` (single- and multi-page A4/fit PDF 1.4 xref integrity), and `splitEngine` layout geometry, vertical overlap trims, cross-axis alignment, rotation, borders, canvas draw calls, and ZIP slice archives.
- `compressTransformIdCard.test.ts`: Unit tests for `compressEngine` (including `targetBytes` binary search and auto-downscale floor), `transformEngine`, and `idCardEngine` including A4 ID-1 scaling, watermark placements, and batch ZIP exports.

[PROTOCOL]: Update this header on change, then check GEMINI.md
