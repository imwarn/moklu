/**
 * [INPUT]: depends on ./types, ./canvasHelpers, ./pdfHelper, ./stitchOverlap, ./heicDecoder, ./exifReader, ./mergeEngine, ./splitEngine, ./compressEngine, ./transformEngine, and ./idCardEngine
 * [OUTPUT]: re-exports all client-side image processing engines, HEIC decoder, EXIF inspector, overlap detector & seam override resolver, single-/multi-page PDF builders, helpers, constants, and TypeScript interfaces
 * [POS]: sole public barrel entry point of src/tools; imported by workspace tools and integration adapters
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type {
  AspectPreset,
  BackgroundFill,
  CanvasContextLike,
  CanvasFactory,
  CanvasGradientLike,
  CanvasLike,
  CarouselAspect,
  ClampedDimensions,
  CompressBatchResult,
  CompressOptions,
  CompressResultItem,
  Dimensions,
  EngineRuntimeOptions,
  GradientStop,
  GridCellAspect,
  IdCardDpi,
  IdCardSheetLayout,
  IdCardSheetOptions,
  IdCardSheetResult,
  IdCardSlotLayout,
  IdCardWatermarkMode,
  IdCardWatermarkOptions,
  IdCardWatermarkPlacement,
  ImageDataLike,
  ImageDrawable,
  ImageFormat,
  ImageInputSource,
  LinearGradientFill,
  LoadedImageItem,
  MergeAlign,
  MergeLayout,
  MergeLayoutItem,
  MergeMode,
  MergeNormalizeMode,
  MergeOptions,
  MergeOutputFormat,
  MergePdfMargin,
  MergePdfMode,
  MergePdfOrientation,
  MergePdfPageSize,
  MergePlacement,
  MergeResult,
  MergeRotation,
  MergeSeamInfo,
  NormalizedCropRect,
  ObjectFitMode,
  PairOverlapMatch,
  Rect,
  RgbaRaster,
  RowProfile,
  SplitMode,
  SplitOptions,
  SplitResult,
  SplitSlice,
  SplitSlicePlan,
  TransformBatchResult,
  TransformCropOptions,
  TransformGeometry,
  TransformMode,
  TransformOptions,
  TransformPadOptions,
  TransformResizeOptions,
  TransformResultItem,
  VerticalItemTrim,
  VerticalOverlapOptions,
  VerticalOverlapPlan,
  ZipFileEntry,
} from './types'

export {
  MAX_CANVAS_DIMENSION,
  MAX_CANVAS_PIXELS,
  canvasToBlob,
  clampCanvasDimensions,
  clampNumber,
  clampQuality,
  clipRoundedRect,
  computeObjectFitRects,
  createCanvas,
  dataUrlToBlob,
  disposeImageItems,
  extensionForFormat,
  fillBackground,
  formatBytes,
  get2dContext,
  loadImageItem,
  loadImageItems,
  packBlobsToZip,
  replaceFileExtension,
  sanitizeFilenameStem,
  traceRoundedRectPath,
} from './canvasHelpers'

export {
  decodeHeicToBlob,
  isHeicFile,
  type DecodeHeicOptions,
  type DecodeHeicOutputType,
  type DecodeHeicStage,
  type HeicNativeDecoder,
  type HeicWasmDecoder,
} from './heicDecoder'

export {
  parseExifFromBuffer,
  readExifSummary,
  type ExifGpsCoordinates,
  type ExifSummary,
} from './exifReader'

export { computeMergeLayout, mergeImages } from './mergeEngine'

export {
  DEFAULT_ANALYSIS_WIDTH,
  applySeamOverlapOverrides,
  computeRowProfile,
  detectPairOverlap,
  detectVerticalStitchOverlaps,
  extractNormalizedRaster,
} from './stitchOverlap'

export {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  NORMAL_MARGIN_PT,
  buildMultiPagePdfBytes,
  buildSinglePagePdfBytes,
  createMultiPagePdfFromJpegs,
  createSinglePagePdfFromJpeg,
  type MultiPagePdfOptions,
  type MultiPagePdfPageInput,
  type PdfPageOptions,
} from './pdfHelper'

export {
  CAROUSEL_PRESET_SIZES,
  computeCarouselSlices,
  computeGridSlices,
  computeSplitPlan,
  splitImage,
} from './splitEngine'

export {
  compressImage,
  compressImages,
  computeCompressedDimensions,
} from './compressEngine'

export {
  ASPECT_RATIOS,
  computeCropGeometry,
  computePadGeometry,
  computeResizeGeometry,
  computeTransformGeometry,
  transformImage,
  transformImages,
} from './transformEngine'

export {
  A4_DIMENSIONS,
  ID1_CARD_DIMENSIONS,
  composeIdCardSheet,
  computeIdCardSheetLayout,
} from './idCardEngine'
