/**
 * [INPUT]: depends on ./canvasFormatRegistry, ./canvasFormatSelectors, ./canvasFormatProjection, and ./canvasFormatLayout
 * [OUTPUT]: re-exports the complete canvas format registry, family selectors, geometric projection, and locale-layout adjustment API
 * [POS]: stable barrel facade in src/utils preserving all external import paths after splitting the 997-line canvasFormats module
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export {
  BASE_CANVAS_FORMAT,
  CANVAS_FORMAT_PRESETS,
  DEFAULT_ACTIVE_CANVAS_FORMATS,
  FAMILY_SURFACE,
  FORMAT_FAMILY,
  FORMAT_FAMILY_ANCHOR,
  FORMAT_FAMILY_LABELS,
  FORMAT_FAMILY_ORDER,
  FORMAT_FORK_KEYS,
  FORMAT_LAYOUT_KEYS,
  FORMAT_PLATFORM,
  getCanvasFormat,
  getFamilyDefaultPhoneModel,
  getFormatCanvasDims,
  getFormatFamilyKey,
  getFormatLabel,
  getFormatPlatform,
  getProjectBaseFormat,
  isCustomFormatId,
  LOCALE_DELTA_FIELDS,
  LOCALE_LAYOUT_FORK_KEYS,
  type FormatFamilyKey,
} from './canvasFormatRegistry'

export {
  appendFormatToFamilyGroups,
  getExportTargets,
  getGroupFamilyKey,
  getProjectActiveFormats,
  groupTargetsFormat,
  hasFormatLayout,
  normalizeActiveFormats,
  normalizeProjectFormats,
  resolveCounterpartGroup,
  resolveForkSourceFormat,
  selectFamilyFormats,
  selectFamilyGroups,
  selectForkSourceCandidates,
  selectForkSourceGroups,
  selectFormatViewGroups,
  selectProjectFamilies,
} from './canvasFormatSelectors'

export {
  applyCanvasFormat,
  applyCanvasFormatToGroup,
  getFormatScaleFactor,
  mapLayerToAuthoringSpace,
  rebasePhoneModelSwap,
  resolveLayerFormat,
  scaleLayerToCanvas,
} from './canvasFormatProjection'

export {
  applyLayoutDelta,
  applyLocaleAdjust,
  applyLocaleAdjustToGroup,
  countFormatAdjustments,
  countLocaleAdjustments,
  makeOwnedFormatLayersSharedInLayerTree,
  promoteFormatOverridesToSharedInLayerTree,
  resetFormatOverridesInLayerTree,
  resetFormatVisibilityInLayerTree,
  resolveGroupView,
  resolveLayerLocaleAdjustBaseOnly,
  resolveProjectView,
} from './canvasFormatLayout'
