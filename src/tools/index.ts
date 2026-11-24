/**
 * [INPUT]: depends on ./types, ./canvasHelpers, ./pdfHelper, ./mergeEngine, ./splitEngine, ./compressEngine, ./transformEngine, and ./idCardEngine
 * [OUTPUT]: re-exports all client-side image processing engines, PDF wrapper, helpers, constants, and TypeScript interfaces
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
  MergePlacement,
  MergeResult,
  MergeRotation,
  NormalizedCropRect,
  ObjectFitMode,
  Rect,
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

export { computeMergeLayout, mergeImages } from './mergeEngine'

export {
  buildSinglePagePdfBytes,
  createSinglePagePdfFromJpeg,
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
