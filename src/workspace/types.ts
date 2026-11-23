/**
 * [INPUT]: depends on ResolvedTheme from @/theme/themeStore
 * [OUTPUT]: exports dependency-inverted workspace contracts (WorkspaceToolId, WorkspacePreset, WorkspaceLocale, WorkspaceEngines, WorkspaceQuickTheme, WorkspaceScreenshotFit, WorkspaceBrowserChromeOptions, StudioHandoffPayload, QuickWorkspaceProps)
 * [POS]: contract layer of src/workspace; isolates all UI panels from concrete image processing engines in src/tools and routing in src/seo
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { ResolvedTheme } from '@/theme/themeStore'

export type WorkspaceToolId = 'mockup' | 'merge' | 'split' | 'compress' | 'resize' | 'id-card'

export type WorkspaceLocale = 'en' | 'zh' | 'ja' | 'ko'

export type WorkspaceTheme = ResolvedTheme

export type WorkspaceImageFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export interface WorkspacePreset {
  tool: WorkspaceToolId
  mockupModel?: string
  canvasSize?: string
  mergeDirection?: 'horizontal' | 'vertical' | 'grid'
  splitMode?: 'carousel' | 'grid'
  targetFormat?: WorkspaceImageFormat
  resizeMode?: 'resize' | 'crop' | 'pad'
}

export interface StudioHandoffImage {
  dataUrl: string
  name: string
  width: number
  height: number
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
  mode?: 'mockup' | 'canvas' | 'carousel'
  mockupModel?: string
  slideWidth?: number
  slideHeight?: number
  theme?: WorkspaceQuickTheme
  screenshotFit?: WorkspaceScreenshotFit
  scaleFactor?: number
  browserChrome?: WorkspaceBrowserChromeOptions
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
}

export interface WorkspaceBlobOutput {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  filename: string
  sizeBytes: number
  mimeType: string
}

export interface WorkspaceMergeOptions {
  direction: 'horizontal' | 'vertical' | 'grid'
  normalize: 'match-min' | 'match-max' | 'original'
  columns: number
  aspectCell: 'auto' | '1:1' | '4:3' | '3:4'
  fit: 'cover' | 'contain'
  gap: number
  padding: number
  borderRadius: number
  background: string
  format: WorkspaceImageFormat
  quality: number
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
}

export interface WorkspaceCompressItem extends WorkspaceBlobOutput {
  id: string
  originalName: string
  originalBytes: number
  outputBytes: number
  savedRatio: number
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
  merge: (images: WorkspaceImageInput[], options: WorkspaceMergeOptions) => Promise<WorkspaceBlobOutput>
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
}
