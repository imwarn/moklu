/**
 * [INPUT]: depends on QuickWorkspace, types, i18n, themeTokens, canvasUtils, demoAssets, and defaultEngines within src/workspace
 * [OUTPUT]: barrel re-exports for QuickWorkspace, DIP contracts, i18n dictionary, demo generators, and default engines
 * [POS]: public API entry point of src/workspace consumed by ToolLandingPage and engineAdapter
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export { QuickWorkspace } from './QuickWorkspace'
export {
  buildBatchStudioHandoff,
  clampBatchIndex,
  removeBatchEntry,
  stepBatchIndex,
} from './batchHelpers'
export { getWorkspaceStrings, type WorkspaceStrings } from './i18n'
export { getWorkspaceThemeTokens, type WorkspaceThemeTokens } from './themeTokens'
export { createDefaultWorkspaceEngines } from './defaultEngines'
export {
  createDemoImageInput,
  createDemoScreenshotDataUrl,
  type DemoVariant,
} from './demoAssets'
export {
  formatBytes,
  readFileAsImageInput,
  renderMockupCanvasToPng,
  triggerBlobDownload,
  type MockupRenderParams,
} from './canvasUtils'
export type {
  QuickWorkspaceProps,
  StudioHandoffImage,
  StudioHandoffPayload,
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceCompressItem,
  WorkspaceCompressOptions,
  WorkspaceEngines,
  WorkspaceIdCardOptions,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceMergeOptions,
  WorkspacePreset,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceSplitSlice,
  WorkspaceTheme,
  WorkspaceToolId,
  WorkspaceToolPanelProps,
  WorkspaceTransformOptions,
} from './types'
