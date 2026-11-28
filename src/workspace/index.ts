/**
 * [INPUT]: depends on QuickWorkspace, AnnotateModal, AnnotateOverlay, batchHelpers, mergeHandoff, draftStorage, useToolDraft, types, i18n, themeTokens, canvasUtils, demoAssets, and defaultEngines within src/workspace
 * [OUTPUT]: barrel re-exports for QuickWorkspace, AnnotateModal, AnnotateToolbar, AnnotateCanvas, DIP contracts, i18n dictionary, multi-layer merge handoff, IndexedDB draft storage, demo generators, and default engines
 * [POS]: public API entry point of src/workspace consumed by ToolLandingPage and engineAdapter
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export { QuickWorkspace } from './QuickWorkspace'
export { AnnotateModal, type AnnotateModalProps } from './AnnotateModal'
export {
  AnnotateCanvas,
  AnnotateToolbar,
  useAnnotateShortcuts,
  type AnnotateCanvasProps,
  type AnnotateToolbarProps,
  type UseAnnotateShortcutsOptions,
} from './AnnotateOverlay'
export {
  buildBatchStudioHandoff,
  clampBatchIndex,
  removeBatchEntry,
  stepBatchIndex,
} from './batchHelpers'
export {
  buildMergeStudioHandoff,
  cropSourceRectToDataUrl,
  isPartialSourceCrop,
  placementToStudioLayer,
  type BuildMergeHandoffOptions,
} from './mergeHandoff'
export {
  DRAFT_DB_NAME,
  DRAFT_SCHEMA_VERSION,
  DRAFT_STORE_NAME,
  clearAllToolDrafts,
  deleteToolDraft,
  deserializeDraftImages,
  isDraftStorageSupported,
  loadToolDraft,
  saveToolDraft,
  serializeDraftImages,
  type SerializedDraftImage,
  type WorkspaceToolDraft,
} from './draftStorage'
export {
  WORKSPACE_DRAFT_DEBOUNCE_MS,
  useToolDraft,
  type UseToolDraftOptions,
  type UseToolDraftResult,
} from './useToolDraft'
export { getWorkspaceStrings, type WorkspaceStrings } from './i18n'
export { getWorkspaceThemeTokens, type WorkspaceThemeTokens } from './themeTokens'
export { createDefaultWorkspaceEngines } from './defaultEngines'
export {
  createDemoImageInput,
  createDemoPortraitDataUrl,
  createDemoPortraitInput,
  createDemoScreenshotDataUrl,
  type DemoVariant,
} from './demoAssets'
export {
  copyImageToClipboard,
  formatBytes,
  isClipboardImageSupported,
  readFileAsImageInput,
  renderMockupCanvasToPng,
  triggerBlobDownload,
  type MockupRenderParams,
} from './canvasUtils'
export type {
  QuickWorkspaceProps,
  StudioHandoffImage,
  StudioHandoffLayer,
  StudioHandoffPayload,
  WorkspaceAspectPreset,
  WorkspaceBlobOutput,
  WorkspaceBrowserChromeOptions,
  WorkspaceCompressItem,
  WorkspaceCompressOptions,
  WorkspaceEngines,
  WorkspaceIdCardOptions,
  WorkspaceIdPhotoFormat,
  WorkspaceIdPhotoFraming,
  WorkspaceIdPhotoMatteHandle,
  WorkspaceIdPhotoMattingMode,
  WorkspaceIdPhotoMatteOptions,
  WorkspaceIdPhotoMattingStage,
  WorkspaceIdPhotoRenderOptions,
  WorkspaceIdPhotoRenderOutput,
  WorkspaceIdPhotoSheetFormat,
  WorkspaceIdPhotoSheetOptions,
  WorkspaceIdPhotoSheetOutput,
  WorkspaceIdPhotoSheetPaper,
  WorkspaceIdPhotoTab,
  WorkspaceIdPhotoTrioResult,
  WorkspaceImageFormat,
  WorkspaceImageInput,
  WorkspaceLocale,
  WorkspaceMergeAlign,
  WorkspaceMergeFormat,
  WorkspaceMergeLayout,
  WorkspaceMergeOptions,
  WorkspaceMergeOutput,
  WorkspaceMergePlacement,
  WorkspaceMergeRotation,
  WorkspacePreset,
  WorkspaceQuickTheme,
  WorkspaceRect,
  WorkspaceScreenshotFit,
  WorkspaceSplitOptions,
  WorkspaceSplitResult,
  WorkspaceSplitSlice,
  WorkspaceTheme,
  WorkspaceToolId,
  WorkspaceToolPanelProps,
  WorkspaceTransformOptions,
} from './types'
