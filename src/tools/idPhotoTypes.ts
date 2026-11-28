/**
 * [INPUT]: depends on BackgroundFill, EngineRuntimeOptions, ImageDrawable, and Rect from ./types
 * [OUTPUT]: exports all ID photo preset, portrait matting, anti-halo rendering, and 300 DPI print sheet interfaces
 * [POS]: dedicated ID photo & portrait matting type contract in src/tools; re-exported through ./types and ./index
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { BackgroundFill, EngineRuntimeOptions, ImageDrawable, Rect } from './types'

export type IdPhotoMattingMode = 'ai' | 'pure-backdrop'
export type IdPhotoSheetPaper = '4r-6inch' | 'a4'
export type IdPhotoOutputFormat = 'image/png' | 'image/jpeg'
export type IdPhotoSheetFormat = 'image/png' | 'application/pdf'

export interface IdPhotoBackgroundPreset {
  id: string
  hex?: string
  fill: BackgroundFill
}

export interface IdPhotoSpecPreset {
  id: string
  category: 'china' | 'passport-visa' | 'japan-korea' | 'resume-custom'
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  dpi: number
  recommendedBg: string
  allowedBgs: readonly string[]
  recommendedMaxKb?: number
  headRatioRange: readonly [number, number]
  topMarginRatio: number
  primaryLocales: readonly ('en' | 'zh' | 'ja' | 'ko')[]
}

export interface PortraitFramingHints {
  centerX: number
  centerY: number
  zoom: number
  headTopRatio: number
  headHeightRatio: number
}

export interface PortraitMatteData {
  width: number
  height: number
  sourceRgba: Uint8ClampedArray
  guidedAlpha: Float32Array
  estimatedBgRgb: readonly [number, number, number]
  modeUsed: IdPhotoMattingMode
  framing: PortraitFramingHints
}

export interface ExtractPortraitMatteOptions extends EngineRuntimeOptions {
  mode?: IdPhotoMattingMode
  modelUrl?: string
  onProgress?: (stage: 'downloading' | 'inferring' | 'refining', progress: number) => void
}

export interface RefineAndCompositeIdPhotoOptions extends EngineRuntimeOptions {
  matte: PortraitMatteData
  widthPx: number
  heightPx: number
  background: BackgroundFill
  crop?: {
    centerX: number
    centerY: number
    zoom: number
  }
  edgeShift?: number
  edgeFeather?: number
  decontaminate?: number
  format?: IdPhotoOutputFormat
  quality?: number
  targetSizeKb?: number
  includeForegroundPng?: boolean
  filenameStem?: string
}

export interface IdPhotoRenderResult {
  blob: Blob
  width: number
  height: number
  format: IdPhotoOutputFormat
  filename: string
  outputBytes: number
  targetBytesMet?: boolean
  appliedQuality?: number
  foregroundPngBlob?: Blob
}

export interface IdPhotoPrintSheetOptions extends EngineRuntimeOptions {
  photoDrawable: ImageDrawable
  photoWidthPx: number
  photoHeightPx: number
  paper: IdPhotoSheetPaper
  dpi?: 300
  gapPx?: number
  marginPx?: number
  cropMarks?: boolean
  format?: IdPhotoSheetFormat
  filenameStem?: string
}

export interface IdPhotoPrintSheetLayout {
  paperWidthPx: number
  paperHeightPx: number
  columns: number
  rows: number
  count: number
  slots: Rect[]
}

export interface IdPhotoPrintSheetResult {
  blob: Blob
  width: number
  height: number
  count: number
  columns: number
  rows: number
  format: IdPhotoSheetFormat
  filename: string
}
