/**
 * [INPUT]: depends on browser DOM CanvasImageSource, Blob, and File built-in types
 * [OUTPUT]: exports all shared option, layout, runtime, vertical overlap analysis, and result interfaces for src/tools engines
 * [POS]: foundational type contract of src/tools; imported by canvasHelpers, stitchOverlap, and all five processing engines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export type ImageInputSource = File | Blob | string

export interface GradientStop {
  offset: number
  color: string
}

export interface LinearGradientFill {
  type: 'linear'
  /** CSS linear-gradient angle in degrees (0 = bottom-to-top, 90 = left-to-right, 135 = diagonal). */
  angle?: number
  stops: GradientStop[]
}

export type BackgroundFill = string | LinearGradientFill

export interface Dimensions {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Drawable image representation accepted by Canvas 2D drawImage.
 * Allows real browser CanvasImageSource values and deterministic mock drawables in Node tests.
 */
export type ImageDrawable =
  | CanvasImageSource
  | {
      readonly width: number
      readonly height: number
      readonly label?: string
    }

export interface CanvasGradientLike {
  addColorStop(offset: number, color: string): void
}

export interface ImageDataLike {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

export interface CanvasContextLike {
  fillStyle: string | CanvasGradientLike
  strokeStyle: string | CanvasGradientLike
  lineWidth: number
  globalAlpha: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  filter: string
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  imageSmoothingEnabled: boolean
  imageSmoothingQuality?: ImageSmoothingQuality
  save(): void
  restore(): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  rect(x: number, y: number, w: number, h: number): void
  clip(): void
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  strokeRect(x: number, y: number, w: number, h: number): void
  fill(): void
  stroke(): void
  translate(x: number, y: number): void
  rotate(angle: number): void
  scale(x: number, y: number): void
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradientLike
  drawImage(
    image: ImageDrawable,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void
  fillText(text: string, x: number, y: number, maxWidth?: number): void
  getImageData?(sx: number, sy: number, sw: number, sh: number): ImageDataLike
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasContextLike | null
  convertToBlob?: (options?: { type?: string; quality?: number }) => Promise<Blob>
  toBlob?: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void
  toDataURL?: (type?: string, quality?: number) => string
}

export type CanvasFactory = (width: number, height: number) => CanvasLike

export interface EngineRuntimeOptions {
  createCanvas?: CanvasFactory
}

export interface LoadedImageItem {
  id: string
  name: string
  width: number
  height: number
  source: ImageDrawable
  originalBytes: number
  mimeType: string
  /** Present only when a blob: object URL was allocated during load. */
  objectUrl?: string
  /** Idempotent resource cleanup releasing any allocated object URL or ImageBitmap. */
  dispose: () => void
}

export interface ClampedDimensions extends Dimensions {
  scaleFactor: number
  clamped: boolean
}

export interface ZipFileEntry {
  filename: string
  blob: Blob | Uint8Array
}

// ============================================================================
// Merge Engine Types
// ============================================================================

export type MergeMode = 'horizontal' | 'vertical' | 'grid'
export type MergeNormalizeMode = 'match-min' | 'match-max' | 'original'
export type MergeAlign = 'start' | 'center' | 'end'
export type MergeRotation = 0 | 90 | 180 | 270
export type MergeOutputFormat = ImageFormat | 'application/pdf'
export type GridCellAspect = 'auto' | '1:1' | '4:3' | '3:4'
export type ObjectFitMode = 'cover' | 'contain'

export interface MergeLayoutItem extends Dimensions {
  /** Clockwise quarter-turn rotation applied before layout sizing and rendering. */
  rotation?: MergeRotation
}

export interface MergeOptions extends EngineRuntimeOptions {
  mode: MergeMode
  /** Height normalization in horizontal mode or width normalization in vertical mode. */
  normalize?: MergeNormalizeMode
  /** Cross-axis alignment when normalize === 'original' (horizontal: top/middle/bottom, vertical: left/center/right). */
  align?: MergeAlign
  /** Grid column count (clamped to 2..6). Used only when mode === 'grid'. */
  columns?: number
  /** Grid cell aspect ratio. Used only when mode === 'grid'. */
  aspectCell?: GridCellAspect
  /** Image fit behavior inside each grid cell. Used only when mode === 'grid'. */
  fit?: ObjectFitMode
  gap?: number
  padding?: number
  borderRadius?: number
  /** Per-image border stroke width in pixels (0 disables border). */
  borderWidth?: number
  /** Per-image border stroke color (CSS color string). */
  borderColor?: string
  /** Optional per-item clockwise rotation overrides indexed alongside items. */
  itemRotations?: ReadonlyArray<MergeRotation>
  /** Automatically detect and trim overlapping scroll regions and fixed top/bottom bars in vertical mode. */
  removeOverlap?: boolean
  background?: BackgroundFill
  format?: MergeOutputFormat
  quality?: number
  maxDimension?: number
  filename?: string
}

export interface MergePlacement {
  index: number
  sourceRect: Rect
  destRect: Rect
  radius: number
  rotation: MergeRotation
  borderWidth: number
}

export interface MergeLayout extends Dimensions {
  scaleFactor: number
  placements: MergePlacement[]
  /** Cumulative duplicate vertical pixel height trimmed across seams (0 when disabled or undetected). */
  overlapRemovedPx?: number
}

export interface RgbaRaster {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface RowProfile {
  meanR: Float32Array
  meanG: Float32Array
  meanB: Float32Array
  meanGrad: Float32Array
  gradStd: Float32Array
  isTextured: Uint8Array
}

export interface PairOverlapMatch {
  fixedTop: number
  fixedBottom: number
  scrollOverlap: number
  mae: number
  texturedRows: number
}

export interface VerticalItemTrim {
  trimTop: number
  trimBottom: number
}

export interface VerticalOverlapPlan {
  trims: VerticalItemTrim[]
  seams: PairOverlapMatch[]
}

export interface VerticalOverlapOptions {
  itemRotations?: ReadonlyArray<MergeRotation>
  createCanvas?: CanvasFactory
  maxAnalysisWidth?: number
}

export interface MergeResult {
  blob: Blob
  /** Raster JPEG preview blob populated when format === 'application/pdf' for <img> preview and clipboard export. */
  previewBlob?: Blob
  width: number
  height: number
  format: MergeOutputFormat
  bytes: number
  filename: string
  layout: MergeLayout
}

// ============================================================================
// Split Engine Types
// ============================================================================

export type SplitMode = 'carousel' | 'grid'
export type CarouselAspect = '4:5' | '3:4' | '1:1' | 'auto'

export interface SplitOptions extends EngineRuntimeOptions {
  mode: SplitMode
  /** Slide count for carousel mode (clamped to 2..10). */
  count?: number
  /** Target slide aspect preset for carousel mode. */
  carouselAspect?: CarouselAspect
  /** Row count for grid mode (clamped to 1..6). */
  rows?: number
  /** Column count for grid mode (clamped to 1..6). */
  cols?: number
  format?: ImageFormat
  quality?: number
  filenamePrefix?: string
  includeZip?: boolean
}

export interface SplitSlicePlan {
  index: number
  row: number
  col: number
  sourceRect: Rect
  outputWidth: number
  outputHeight: number
}

export interface SplitSlice {
  index: number
  row: number
  col: number
  width: number
  height: number
  blob: Blob
  bytes: number
  filename: string
  sourceRect: Rect
}

export interface SplitResult {
  mode: SplitMode
  slices: SplitSlice[]
  zipBlob?: Blob
  zipFilename: string
  totalWidth: number
  totalHeight: number
}

// ============================================================================
// Compress Engine Types
// ============================================================================

export interface CompressOptions extends EngineRuntimeOptions {
  format: ImageFormat
  /** Compression quality in [0.05, 1]. Ignored for lossless PNG. */
  quality?: number
  maxWidth?: number
  maxHeight?: number
  /** Fill color behind transparent pixels when encoding to image/jpeg. */
  background?: string
  includeZip?: boolean
  zipFilename?: string
}

export interface CompressResultItem {
  id: string
  originalName: string
  filename: string
  format: ImageFormat
  originalWidth: number
  originalHeight: number
  width: number
  height: number
  originalBytes: number
  outputBytes: number
  savedBytes: number
  /** Fraction saved relative to originalBytes (e.g. 0.4 means 40% smaller). */
  savedRatio: number
  blob: Blob
}

export interface CompressBatchResult {
  items: CompressResultItem[]
  totalOriginalBytes: number
  totalOutputBytes: number
  totalSavedRatio: number
  zipBlob?: Blob
  zipFilename: string
}

// ============================================================================
// Transform Engine Types
// ============================================================================

export type TransformMode = 'resize' | 'crop' | 'pad'
export type AspectPreset = 'original' | '1:1' | '4:5' | '3:4' | '16:9' | '9:16' | '3:2' | '4:3'

export interface NormalizedCropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface TransformResizeOptions {
  width?: number
  height?: number
  /** Uniform scale multiplier (e.g. 0.5 for 50%, 2 for 200%). */
  scale?: number
  lockAspect?: boolean
}

export interface TransformCropOptions {
  /** Explicit normalized crop rect with coordinates in [0, 1]. */
  rect?: NormalizedCropRect
  /** Centered aspect preset when rect is omitted. */
  aspect?: Exclude<AspectPreset, 'original'>
  outputWidth?: number
  outputHeight?: number
}

export interface TransformPadOptions {
  aspect?: AspectPreset
  /** Minimum outer border thickness in pixels around the source image. */
  border?: number
  background?: BackgroundFill
  borderRadius?: number
  shadow?: boolean
  shadowBlur?: number
  shadowColor?: string
  shadowOffsetY?: number
  outputWidth?: number
  outputHeight?: number
}

export interface TransformOptions extends EngineRuntimeOptions {
  mode: TransformMode
  resize?: TransformResizeOptions
  crop?: TransformCropOptions
  pad?: TransformPadOptions
  format?: ImageFormat
  quality?: number
  includeZip?: boolean
  zipFilename?: string
}

export interface TransformGeometry {
  outputWidth: number
  outputHeight: number
  sourceRect: Rect
  destRect: Rect
  radius: number
  shadow: boolean
  scaleFactor: number
}

export interface TransformResultItem {
  id: string
  originalName: string
  filename: string
  mode: TransformMode
  format: ImageFormat
  originalWidth: number
  originalHeight: number
  width: number
  height: number
  bytes: number
  blob: Blob
  geometry: TransformGeometry
}

export interface TransformBatchResult {
  items: TransformResultItem[]
  zipBlob?: Blob
  zipFilename: string
}

// ============================================================================
// ID Card Sheet Engine Types
// ============================================================================

export type IdCardDpi = 150 | 300
export type IdCardWatermarkMode = 'tiled' | 'across-card'

export interface IdCardWatermarkOptions {
  text: string
  /** Text alpha opacity clamped to [0.05, 0.8]. */
  opacity?: number
  color?: string
  /** Font size in px at 300 DPI (automatically scaled at 150 DPI). */
  fontSize?: number
  /** Rotation angle in degrees (default -30). */
  angle?: number
  mode?: IdCardWatermarkMode
  /** Horizontal repeat step in px at 300 DPI for tiled mode. */
  spacingX?: number
  /** Vertical repeat step in px at 300 DPI for tiled mode. */
  spacingY?: number
}

export interface IdCardSheetOptions extends EngineRuntimeOptions {
  dpi?: IdCardDpi
  /** Apply high-contrast black-and-white photocopy filter to card images. */
  grayscale?: boolean
  /** Card corner radius in px at 300 DPI (default 36, scaled for 150 DPI). */
  cardBorderRadius?: number
  cardBorderColor?: string
  /** Card border stroke width in px at 300 DPI (default 2). */
  cardBorderWidth?: number
  pageBackground?: string
  /** Vertical spacing between front & back cards in px at 300 DPI (default 180). */
  cardGap?: number
  fit?: ObjectFitMode
  watermark?: IdCardWatermarkOptions
  format?: ImageFormat
  quality?: number
  filename?: string
}

export interface IdCardSlotLayout {
  index: number
  cardRect: Rect
  imageSourceRect: Rect
  imageDestRect: Rect
  radius: number
}

export interface IdCardWatermarkPlacement {
  text: string
  x: number
  y: number
  angleDeg: number
  fontSize: number
  opacity: number
  color: string
  /** Card slot index if clipped to a single card in 'across-card' mode. */
  slotIndex?: number
}

export interface IdCardSheetLayout {
  pageWidth: number
  pageHeight: number
  dpi: IdCardDpi
  cardWidth: number
  cardHeight: number
  slots: IdCardSlotLayout[]
  watermarks: IdCardWatermarkPlacement[]
}

export interface IdCardSheetResult {
  blob: Blob
  width: number
  height: number
  dpi: IdCardDpi
  format: ImageFormat
  bytes: number
  filename: string
  layout: IdCardSheetLayout
}
