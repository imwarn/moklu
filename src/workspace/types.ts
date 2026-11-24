/**
 * [INPUT]: depends on ResolvedTheme from @/theme/themeStore
 * [OUTPUT]: exports dependency-inverted workspace contracts (WorkspaceToolId, WorkspacePreset, WorkspaceLocale, WorkspaceEngines, WorkspaceRect, WorkspaceMergeSeamInfo, WorkspaceMergePlacement, WorkspaceMergeLayout, WorkspaceMergeOutput, WorkspaceExifSummary, WorkspaceRedactionRegion, WorkspaceQuickTheme, WorkspaceScreenshotFit, WorkspaceBrowserChromeOptions, StudioHandoffLayer, StudioHandoffPayload, QuickWorkspaceProps, WorkspaceToolPanelProps)
 * [POS]: contract layer of src/workspace; isolates all UI panels from concrete image processing engines in src/tools and routing in src/seo
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { ResolvedTheme } from '@/theme/themeStore'

export type WorkspaceToolId = 'mockup' | 'merge' | 'split' | 'compress' | 'resize' | 'id-card'

export type WorkspaceLocale = 'en' | 'zh' | 'ja' | 'ko'

export type WorkspaceTheme = ResolvedTheme

export type WorkspaceImageFormat = 'image/png' | 'image/jpeg' | 'image/webp'
export type WorkspaceMergeFormat = WorkspaceImageFormat | 'application/pdf'
export type WorkspaceMergeAlign = 'start' | 'center' | 'end'
export type WorkspaceMergeRotation = 0 | 90 | 180 | 270

export interface WorkspacePreset {
  tool: WorkspaceToolId
  mockupModel?: string
  canvasSize?: string
  mergeDirection?: 'horizontal' | 'vertical' | 'grid'
  mergeFormat?: WorkspaceMergeFormat
  splitMode?: 'carousel' | 'grid'
  targetFormat?: WorkspaceImageFormat
  resizeMode?: 'resize' | 'crop' | 'pad'
  removeOverlap?: boolean
  pdfMode?: 'multipage' | 'single'
  targetSizeKb?: number
  inspectExif?: boolean
  enableRedact?: boolean
}

export interface WorkspaceRedactionRegion {
  id: string
  kind: 'blur' | 'pixelate' | 'spotlight'
  x: number
  y: number
  width: number
  height: number
  intensity: number
}

export interface WorkspaceExifSummary {
  hasExif: boolean
  hasSensitiveData: boolean
  tagCount: number
  gps?: { latitude: number; longitude: number }
  make?: string
  model?: string
  software?: string
  dateTimeOriginal?: string
  exposureTime?: string
  fNumber?: string
  iso?: number
  orientation?: number
}

export interface StudioHandoffImage {
  dataUrl: string
  name: string
  width: number
  height: number
}

export interface StudioHandoffLayer extends StudioHandoffImage {
  x: number
  y: number
  rotation?: number
  cornerRadius?: number
}

export type WorkspaceQuickTheme = 'aurora' | 'midnight' | 'warm'

export type WorkspaceScreenshotFit = 'cover' | 'contain' | 'fill'

export interface WorkspaceBrowserChromeOptions {
  title?: string
  address?: string
  theme?: 'light' | 'dark'
  showAddressBar?: boolean
}

export interface StudioHandoffPayload {
  images: StudioHandoffImage[]
  mode?: 'mockup' | 'canvas' | 'carousel' | 'layers'
  mockupModel?: string
  slideWidth?: number
  slideHeight?: number
  theme?: WorkspaceQuickTheme
  screenshotFit?: WorkspaceScreenshotFit
  scaleFactor?: number
  browserChrome?: WorkspaceBrowserChromeOptions
  layers?: StudioHandoffLayer[]
  background?: string
  redactions?: WorkspaceRedactionRegion[]
}

export interface WorkspaceImageInput {
  id: string
  name: string
  width: number
  height: number
  dataUrl: string
  sizeBytes: number
  mimeType?: string
  file?: File
  rotation?: WorkspaceMergeRotation
  exif?: WorkspaceExifSummary
  /** Marks built-in demo assets so local draft persistence never writes them to IndexedDB. */
  isDemo?: boolean
}

export interface WorkspaceRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WorkspaceMergeSeamInfo {
  index: number
  autoOverlapPx: number
  appliedOverlapPx: number
  fixedTopPx: number
  fixedBottomPx: number
}

export interface WorkspaceMergePlacement {
  index: number
  sourceRect: WorkspaceRect
  destRect: WorkspaceRect
  radius: number
  rotation: WorkspaceMergeRotation
  borderWidth: number
}

export interface WorkspaceMergeLayout {
  width: number
  height: number
  scaleFactor: number
  placements: WorkspaceMergePlacement[]
  overlapRemovedPx?: number
  seams?: WorkspaceMergeSeamInfo[]
}

export interface WorkspaceBlobOutput {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  filename: string
  sizeBytes: number
  mimeType: string
  /** Uniform scale factor applied when safe canvas bounds (8192px / 64MP) clamp the output (< 1 means downscaled). */
  scaleFactor?: number
}

export interface WorkspaceMergeOutput extends WorkspaceBlobOutput {
  layout?: WorkspaceMergeLayout
}

export interface WorkspaceMergeOptions {
  direction: 'horizontal' | 'vertical' | 'grid'
  normalize: 'match-min' | 'match-max' | 'original'
  align?: WorkspaceMergeAlign
  columns: number
  aspectCell: 'auto' | '1:1' | '4:3' | '3:4'
  fit: 'cover' | 'contain'
  gap: number
  padding: number
  borderRadius: number
  borderWidth?: number
  borderColor?: string
  background: string
  format: WorkspaceMergeFormat
  quality: number
  /** Enable client-side scroll overlap and fixed header/footer trimming in vertical mode. */
  removeOverlap?: boolean
  /** Optional per-seam top-trim pixel overrides indexed by seam i (between item i and item i + 1). */
  seamOverlapOverrides?: Record<number, number>
  /** Single combined page or one PDF page per input image when format === 'application/pdf'. */
  pdfMode?: 'multipage' | 'single'
  /** Target PDF page dimensions when pdfMode === 'multipage'. */
  pdfPageSize?: 'a4' | 'fit'
  /** Page orientation for A4 multipage PDF export. */
  pdfOrientation?: 'portrait' | 'landscape'
  /** Page margin preset for multipage PDF export. */
  pdfMargin?: 'none' | 'normal'
}

export interface WorkspaceSplitOptions {
  mode: 'carousel' | 'grid'
  carouselCount: number
  carouselAspect: '4:5' | '3:4' | '1:1' | 'auto'
  rows: number
  cols: number
  format: WorkspaceImageFormat
  quality: number
}

export interface WorkspaceSplitSlice extends WorkspaceBlobOutput {
  index: number
  row: number
  col: number
}

export interface WorkspaceSplitResult {
  slices: WorkspaceSplitSlice[]
  zipBlob?: Blob
}

export interface WorkspaceCompressOptions {
  format: WorkspaceImageFormat
  quality: number
  maxWidth?: number
  maxHeight?: number
  targetBytes?: number
  preserveOriginalDimensions?: boolean
}

export interface WorkspaceCompressItem extends WorkspaceBlobOutput {
  id: string
  originalName: string
  originalBytes: number
  outputBytes: number
  savedRatio: number
  originalDataUrl?: string
  originalWidth?: number
  originalHeight?: number
  targetBytesMet?: boolean
  autoDownscaled?: boolean
  appliedQuality?: number
  exif?: WorkspaceExifSummary
}

export type WorkspaceAspectPreset = 'free' | '1:1' | '4:5' | '3:4' | '16:9' | '9:16' | '3:2'

export interface WorkspaceTransformOptions {
  mode: 'resize' | 'crop' | 'pad'
  width?: number
  height?: number
  scale?: number
  lockAspect: boolean
  aspectRatio: WorkspaceAspectPreset
  borderPx: number
  background: string
  borderRadius: number
  shadow: boolean
  format: WorkspaceImageFormat
  quality: number
}

export interface WorkspaceIdCardOptions {
  dpi: 150 | 300
  grayscale: boolean
  watermarkText: string
  watermarkOpacity: number
  watermarkColor: string
  watermarkFontSize: number
  watermarkAngle: number
  watermarkMode: 'tiled' | 'across-card'
}

export interface WorkspaceEngines {
  merge: (images: WorkspaceImageInput[], options: WorkspaceMergeOptions) => Promise<WorkspaceMergeOutput>
  split: (image: WorkspaceImageInput, options: WorkspaceSplitOptions) => Promise<WorkspaceSplitResult>
  compress: (images: WorkspaceImageInput[], options: WorkspaceCompressOptions) => Promise<WorkspaceCompressItem[]>
  transform: (images: WorkspaceImageInput[], options: WorkspaceTransformOptions) => Promise<WorkspaceBlobOutput[]>
  idCard: (
    front: WorkspaceImageInput | null,
    back: WorkspaceImageInput | null,
    options: WorkspaceIdCardOptions,
  ) => Promise<WorkspaceBlobOutput>
  packZip: (files: Array<{ filename: string; blob: Blob }>) => Promise<Blob>
}

export interface QuickWorkspaceProps {
  preset?: WorkspacePreset
  locale?: WorkspaceLocale
  theme?: WorkspaceTheme
  engines?: Partial<WorkspaceEngines>
  onOpenInStudio: (payload: StudioHandoffPayload) => void
  onOpenProModal?: () => void
  onToolChange?: (tool: WorkspaceToolId) => void
  className?: string
}

export interface WorkspaceToolPanelProps {
  preset: WorkspacePreset
  locale: WorkspaceLocale
  theme: WorkspaceTheme
  engines: WorkspaceEngines
  onOpenInStudio: (payload: StudioHandoffPayload) => void
  onOpenProModal?: () => void
  onSwitchToolWithFiles?: (tool: WorkspaceToolId, files: File[]) => void
}
