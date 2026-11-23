/**
 * [INPUT]: depends on layerTree utilities from @/utils/layerTree, ./factories, ./layerPatches, and ./migrations
 * [OUTPUT]: re-exports all store helper factories, layer-patching utilities, schema migrations, and layerTree traversal functions
 * [POS]: stable barrel facade in src/store/ preserving legacy import paths for slices, tests, and external callers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export { findLayerInTree, mapLayerTree, updateLayerInTree } from '@/utils/layerTree'

export {
  newId,
  getLayerDefaultsScaleFactor,
  cloneLayerWithNewIds,
  bakeLayerScale,
  cloneWithNewIds,
  STYLE_KEYS,
  createBackgroundLayer,
  bgFromLegacy,
  seedLocaleContent,
  newSlideGroup,
  newProject,
  assertProjectShape,
  stripDataUrls,
  touchProject,
  touchSettings,
  pickLayerKeys,
  getActiveGroup,
  mutateActiveGroup,
} from './factories'

export {
  deriveLocaleAdjustDelta,
  splitFormatPatch,
  splitLocaleFormatLayoutPatch,
  LOCALE_CONTENT_KEYS,
  splitLocalePatch,
  patchLayerForLocale,
  withFormatOverride,
  patchLayerForLocaleAdjust,
  withoutLocaleAdjust,
  withoutLocaleAdjustKey,
  resetLocaleAdjustsInLayerTree,
  withoutFormatOverride,
  patchLayerForFormat,
} from './layerPatches'

export {
  LOCALE_SYMMETRIC_SCHEMA_VERSION,
  LOCALE_ADJUST_SCHEMA_VERSION,
  SLIDE_KEY_SCHEMA_VERSION,
  migrateLayerSpans,
  foldLayerToSymmetric,
  migrateProjectToLocaleAdjust,
  migrateProjectSlideKeys,
  normalizeGroupFamilies,
  migrateProject,
} from './migrations'
