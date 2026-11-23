/**
 * [INPUT]: depends on CanvasFormatId, CustomCanvasFormat, Project, and SlideGroup from @/types; depends on format registry constants and lookup helpers from ./canvasFormatRegistry
 * [OUTPUT]: exports project and slide-group format/family selectors and normalizers (groupTargetsFormat, getGroupFamilyKey, selectFamilyFormats, selectFamilyGroups, resolveCounterpartGroup, hasFormatLayout, appendFormatToFamilyGroups, selectProjectFamilies, selectFormatViewGroups, selectForkSourceGroups, selectForkSourceCandidates, resolveForkSourceFormat, getProjectActiveFormats, normalizeActiveFormats, getExportTargets, normalizeProjectFormats)
 * [POS]: pure family/group query and active-format normalization layer in src/utils; consumed by canvasFormatProjection and re-exported by canvasFormats.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  CanvasFormatId,
  CustomCanvasFormat,
  Project,
  SlideGroup,
} from '@/types'
import {
  BASE_CANVAS_FORMAT,
  CANVAS_FORMAT_PRESETS,
  DEFAULT_ACTIVE_CANVAS_FORMATS,
  FORMAT_FAMILY,
  getFormatFamilyKey,
  isCustomFormatId,
  type FormatFamilyKey,
} from './canvasFormatRegistry'

const PLATFORM_FORMAT_IDS = new Set<CanvasFormatId>(CANVAS_FORMAT_PRESETS.map((format) => format.id))

/**
 * Whether a slide group participates in a format. The base sentinel always
 * targets a group's own authored dimensions, even for format-scoped groups.
 */
export function groupTargetsFormat(group: SlideGroup, format: CanvasFormatId): boolean {
  return format === BASE_CANVAS_FORMAT || group.formats === undefined || group.formats.includes(format)
}

/**
 * Resolve family membership from a group's first built-in format. Unscoped
 * groups retain the legacy/default phone family; custom-only groups are
 * deliberately singleton and therefore have no named family.
 */
export function getGroupFamilyKey(group: SlideGroup): FormatFamilyKey | null {
  if (group.formats === undefined) return 'phone'
  return group.formats.map(getFormatFamilyKey).find((family): family is FormatFamilyKey => family !== null) ?? null
}

/** Canonical preset set plus custom formats explicitly adopted by this family. */
export function selectFamilyFormats(project: Project, family: FormatFamilyKey): CanvasFormatId[] {
  const builtIns = CANVAS_FORMAT_PRESETS
    .map((format) => format.id)
    .filter((format) => FORMAT_FAMILY[format] === family)
  const customs = project.slideGroups.flatMap((group) => (
    getGroupFamilyKey(group) === family
      ? (group.formats ?? []).filter(isCustomFormatId)
      : []
  ))
  return Array.from(new Set([...builtIns, ...customs]))
}

/** All groups belonging to one named built-in family, retaining project order. */
export function selectFamilyGroups(project: Project, family: FormatFamilyKey): SlideGroup[] {
  return project.slideGroups.filter((group) => getGroupFamilyKey(group) === family)
}

/**
 * Resolve a group's counterpart in another family — the "same conceptual
 * slide". Prefers an explicit slideKey match; falls back to positional index
 * within each family's group list for legacy/unlinked data (best-effort only).
 */
export function resolveCounterpartGroup(
  project: Project,
  group: SlideGroup,
  targetFamily: FormatFamilyKey,
): SlideGroup | undefined {
  const targetGroups = selectFamilyGroups(project, targetFamily)
  if (group.slideKey) {
    const bySlideKey = targetGroups.find((candidate) => candidate.slideKey === group.slideKey)
    if (bySlideKey) return bySlideKey
    // Both sides fully keyed and disagreeing → there is genuinely no counterpart.
    // Positional fallback below is a legacy bridge only, for target families
    // that still contain unmigrated/unkeyed groups.
    if (targetGroups.every((candidate) => candidate.slideKey)) return undefined
  }
  const sourceFamily = getGroupFamilyKey(group)
  if (sourceFamily === null) return undefined
  const sourceGroups = selectFamilyGroups(project, sourceFamily)
  const index = sourceGroups.findIndex((candidate) => candidate.id === group.id)
  return index < 0 ? undefined : targetGroups[index]
}

/** Whether a format has an editor layout behind it, independent of export selection. */
export function hasFormatLayout(project: Project, formatId: CanvasFormatId): boolean {
  const family = getFormatFamilyKey(formatId)
  if (family === null) return project.slideGroups.some((group) => group.formats?.includes(formatId))

  return selectFamilyGroups(project, family).some((group) => groupTargetsFormat(group, formatId))
}

/** Add a format to every group in a family, preserving unscoped canonical membership. */
export function appendFormatToFamilyGroups(
  project: Project,
  family: FormatFamilyKey,
  formatId: CanvasFormatId,
): SlideGroup[] {
  return project.slideGroups.map((group) => (
    getGroupFamilyKey(group) !== family || group.formats?.includes(formatId)
      ? group
      : { ...group, formats: Array.from(new Set([...(group.formats ?? selectFamilyFormats(project, family)), formatId])) }
  ))
}

/** Named built-in families currently represented by at least one group. */
export function selectProjectFamilies(project: Project): FormatFamilyKey[] {
  return Array.from(new Set(project.slideGroups.flatMap((group) => {
    const family = getGroupFamilyKey(group)
    return family === null ? [] : [family]
  })))
}

/** Select groups displayed by a family-scoped format tab. */
export function selectFormatViewGroups(
  project: Project,
  format: CanvasFormatId,
  family: FormatFamilyKey,
): SlideGroup[] {
  return format === BASE_CANVAS_FORMAT
    ? selectFamilyGroups(project, family)
    : selectFamilyGroups(project, family).filter((group) => groupTargetsFormat(group, format))
}

/**
 * Select source groups that participate in a source format but do not already
 * have a dedicated target-format layout. Unscoped groups are only sources from
 * the base view so creating a format family cannot duplicate another family.
 */
export function selectForkSourceGroups(
  project: Project,
  sourceFormat: CanvasFormatId,
  targetFormatId: CanvasFormatId,
): SlideGroup[] {
  return project.slideGroups.filter((group) => (
    (sourceFormat === BASE_CANVAS_FORMAT
      ? group.formats === undefined
      : groupTargetsFormat(group, sourceFormat))
    && !(group.formats !== undefined && groupTargetsFormat(group, targetFormatId))
  ))
}

/** All non-empty source families available for creating a target layout. */
export function selectForkSourceCandidates(project: Project, targetFormatId: CanvasFormatId): CanvasFormatId[] {
  return Array.from(new Set([
    ...(project.slideGroups.some((group) => group.formats === undefined) ? [BASE_CANVAS_FORMAT] : []),
    ...getProjectActiveFormats(project),
    ...project.slideGroups.flatMap((group) => group.formats ?? []),
  ])).filter((format) => (
    format !== targetFormatId && selectForkSourceGroups(project, format, targetFormatId).length > 0
  ))
}

/**
 * Choose a viable source family when the Base tab has no remaining unscoped
 * groups. This keeps source selection explicit in the UI while providing a
 * useful default after a project has already been forked once.
 */
export function resolveForkSourceFormat(
  project: Project,
  activeCanvasFormat: CanvasFormatId,
  activeSlideGroupId: string,
  targetFormatId: CanvasFormatId,
): CanvasFormatId {
  const candidates = selectForkSourceCandidates(project, targetFormatId)
  if (candidates.length === 0) return BASE_CANVAS_FORMAT
  if (candidates.includes(activeCanvasFormat)) return activeCanvasFormat
  if (candidates.includes(BASE_CANVAS_FORMAT)) return BASE_CANVAS_FORMAT

  const activeGroup = project.slideGroups.find((group) => group.id === activeSlideGroupId)
  const activeGroupFormat = activeGroup?.formats?.find((format) => candidates.includes(format))
  if (activeGroupFormat) return activeGroupFormat

  return candidates[0]!
}

export function getProjectActiveFormats(project: Pick<Project, 'settings'>): CanvasFormatId[] {
  return normalizeActiveFormats(
    project.settings.activeFormats,
    project.settings.baseCanvasFormat,
    project.settings.customFormats,
  )
}

export function normalizeActiveFormats(
  activeFormats?: CanvasFormatId[],
  legacyBaseFormat?: CanvasFormatId,
  customFormats?: CustomCanvasFormat[],
): CanvasFormatId[] {
  const formats = (activeFormats ?? []).filter((format) =>
    format !== BASE_CANVAS_FORMAT && (
      PLATFORM_FORMAT_IDS.has(format)
      || (isCustomFormatId(format) && customFormats?.some((customFormat) => customFormat.id === format))
    ),
  )

  if (activeFormats !== undefined && activeFormats.length === 0) return []

  // Legacy projects used iphone-69 as the "base". A saved activeFormats list of
  // only iphone-69 therefore means "base only", not "the user removed Android".
  if (
    formats.length === 0 ||
    (legacyBaseFormat === 'iphone-69' && formats.length === 1 && formats[0] === 'iphone-69')
  ) {
    return [...DEFAULT_ACTIVE_CANVAS_FORMATS]
  }

  return Array.from(new Set(formats))
}

export function getExportTargets(project: Pick<Project, 'settings'>): CanvasFormatId[] {
  const formats = getProjectActiveFormats(project)
  return formats.length > 0 ? formats : [BASE_CANVAS_FORMAT]
}

export function normalizeProjectFormats<T extends Project>(project: T): T {
  return {
    ...project,
    settings: {
      ...project.settings,
      baseCanvasFormat: BASE_CANVAS_FORMAT,
      activeFormats: getProjectActiveFormats(project),
    },
  }
}
