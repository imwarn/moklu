/**
 * [INPUT]: depends on Project/SlideGroup/Layer/LocaleLayerPatch/LocaleContent/CanvasFormatId/LegacyLocaleLayoutFields types from @/types, spansToMarks from @/utils/textRendering, mapLayerTree from @/utils/layerTree, canvas format helpers from @/utils/canvasFormats, factories (newId, cloneLayerWithNewIds, createBackgroundLayer, bgFromLegacy) from ./factories, and deriveLocaleAdjustDelta from ./layerPatches
 * [OUTPUT]: exports schema version constants (LOCALE_SYMMETRIC_SCHEMA_VERSION, LOCALE_ADJUST_SCHEMA_VERSION, SLIDE_KEY_SCHEMA_VERSION) and project/layer migration functions (migrateLayerSpans, foldLayerToSymmetric, migrateProjectToLocaleAdjust, migrateProjectSlideKeys, normalizeGroupFamilies, migrateProject)
 * [POS]: persisted project schema migration pipeline in src/store/; shared by project import and storage hydration so every legacy format upgrades deterministically
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type {
  Project,
  SlideGroup,
  Layer,
  LocaleLayerPatch,
  LocaleContent,
  CanvasFormatId,
  LegacyLocaleLayoutFields,
} from '@/types'
import { spansToMarks } from '@/utils/textRendering'
import { mapLayerTree } from '@/utils/layerTree'
import {
  BASE_CANVAS_FORMAT,
  getFormatFamilyKey,
  normalizeProjectFormats,
  resolveLayerLocaleAdjustBaseOnly,
  selectFamilyGroups,
  selectProjectFamilies,
} from '@/utils/canvasFormats'
import {
  bgFromLegacy,
  cloneLayerWithNewIds,
  createBackgroundLayer,
  newId,
} from './factories'
import { deriveLocaleAdjustDelta } from './layerPatches'

// ─── Schema Versions ──────────────────────────────────────────────────────────

/** Bumped by each one-time project-shape migration. See migrateProject(). */
export const LOCALE_SYMMETRIC_SCHEMA_VERSION = 1

/**
 * Bumped by the `localeAdjust` unification migration. See
 * migrateProjectToLocaleAdjust() / migrateProject(). Old project files on
 * disk may still carry the legacy `localeBaseDelta`/`localeLayoutOverrides`
 * fields (deleted from `BaseLayer`'s type in P4) — this migration folds
 * them INTO `localeAdjust`, the sole locale-layout storage since P4.
 */
export const LOCALE_ADJUST_SCHEMA_VERSION = 2

export const SLIDE_KEY_SCHEMA_VERSION = 3

// ─── Legacy Field Accessors ───────────────────────────────────────────────────

/**
 * Old (pre-0.6.0) project files, or files produced by the CLI manifest tool
 * before it fully switched over, may still have a `localeOverrides` key on a
 * layer even though the current type no longer declares it. Read it
 * defensively for one-time migration purposes only — never write it back.
 */
function getLegacyLocaleOverrides(layer: Layer): Record<string, LocaleLayerPatch> | undefined {
  return (layer as unknown as { localeOverrides?: Record<string, LocaleLayerPatch> }).localeOverrides
}

/**
 * Read the legacy pre-P4 `localeBaseDelta`/`localeLayoutOverrides` fields off
 * a RAW (pre-migration) layer. These fields were deleted from `BaseLayer`'s
 * public type in P4 — new projects never carry them — but old project files
 * saved on disk (and the frozen `legacy-4tier-project.json` migration
 * fixture) can still contain these keys in their raw JSON, and this
 * migration is the one place that still needs to read them. Explicit
 * narrow cast to `LegacyLocaleLayoutFields` (not a blanket `any` on the
 * whole layer) so this stays the single, obvious, greppable escape hatch —
 * do not delete this read or replace it with an `any` cast; that would
 * silently drop every legacy project's locale layout on load.
 */
function getLegacyLocaleLayoutFields(layer: Layer): LegacyLocaleLayoutFields {
  return layer as unknown as LegacyLocaleLayoutFields
}

// ─── Layer & Project Migrations ───────────────────────────────────────────────

/** Recursively migrate legacy TextLayer.spans → marks in a layer tree. */
export function migrateLayerSpans(layer: Layer): Layer {
  if (layer.type === 'group') {
    return { ...layer, children: layer.children.map(migrateLayerSpans) }
  }
  if (layer.type === 'text') {
    let result: Layer = layer
    // Migrate base spans
    if ((layer.spans?.length ?? 0) > 0 && !layer.marks?.length) {
      const { text, marks } = spansToMarks(layer.spans!)
      result = { ...result, text, marks: marks.length ? marks : undefined, spans: undefined } as Layer
    }
    // Migrate legacy locale override patches that still carry spans.
    const legacyOverrides = getLegacyLocaleOverrides(result)
    if (legacyOverrides) {
      const migratedOverrides: Record<string, LocaleLayerPatch> = {}
      for (const [locale, patch] of Object.entries(legacyOverrides)) {
        if (patch.spans?.length && !patch.marks?.length) {
          const { text, marks } = spansToMarks(patch.spans)
          migratedOverrides[locale] = {
            ...patch,
            text: patch.text ?? text,
            marks: marks.length ? marks : undefined,
            spans: undefined,
          }
        } else {
          migratedOverrides[locale] = patch
        }
      }
      // Keep the spans-free legacy value only as a migration intermediate.
      // foldLayerToSymmetric runs next and consumes/removes this raw key.
      result = { ...result, localeOverrides: migratedOverrides } as unknown as Layer
    }
    return result
  }
  return layer
}

/**
 * v0.6.0 symmetric locale model migration.
 * Populates `layer.localeContent[defaultLocale]` from the layer's current
 * base fields, and folds each legacy `localeOverrides[locale]` entry into
 * `localeContent[locale]`. The legacy key is removed from migrated output.
 */
export function foldLayerToSymmetric(layer: Layer, defaultLocale: string): Layer {
  const legacyOverrides = getLegacyLocaleOverrides(layer)
  const { localeOverrides: _legacy, ...layerWithoutLegacy } = layer as unknown as Layer & {
    localeOverrides?: Record<string, LocaleLayerPatch>
  }
  void _legacy
  if (layer.localeContent) return layerWithoutLegacy as Layer // already migrated
  if (layer.type !== 'text' && layer.type !== 'phone' && layer.type !== 'image') return layerWithoutLegacy as Layer

  const defaultContent: LocaleContent =
    layer.type === 'text'
      ? { text: layer.text, ...(layer.marks?.length ? { marks: layer.marks } : {}) }
      : layer.type === 'phone'
        ? {
            ...(layer.screenshotPath !== undefined ? { screenshotPath: layer.screenshotPath } : {}),
            ...(layer.screenshotDataUrl !== undefined ? { screenshotDataUrl: layer.screenshotDataUrl } : {}),
          }
        : { src: layer.src }

  const localeContent: Record<string, LocaleContent> = { [defaultLocale]: defaultContent }
  if (legacyOverrides) {
    for (const [locale, patch] of Object.entries(legacyOverrides)) {
      // patch is LocaleLayerPatch; spans should already be migrated to marks
      // by migrateLayerSpans (which must run before this in migrateProject).
      // Defensively drop spans if somehow still present rather than carrying
      // a field LocaleContent doesn't declare.
      const { spans: _spans, ...rest } = patch
      void _spans
      localeContent[locale] = rest as LocaleContent
    }
  }

  return { ...layerWithoutLegacy, localeContent } as Layer
}

/**
 * Migration: fold the legacy 4-tier locale layout fields (`localeBaseDelta`,
 * `localeLayoutOverrides`) into the 3-tier `localeAdjust` field, per the
 * deepwork spec's algorithm. Reads the legacy fields defensively (see
 * `getLegacyLocaleLayoutFields`) since they no longer exist on `BaseLayer`'s
 * type — this is read-only migration input, never written back.
 *
 * Returns the migrated project plus a `dropped` counter for keys that could
 * not be expressed as a delta (multiplicative R===0 zero-guard, dead
 * base-format cells, or keys outside the 7 fork keys) — surfaced so callers
 * can assert on it directly (dropped keys can't be fixture-ized cleanly
 * through the public store API).
 */
export function migrateProjectToLocaleAdjust(project: Project): { project: Project; dropped: number } {
  const baseFormat = BASE_CANVAS_FORMAT
  let dropped = 0

  const slideGroups = project.slideGroups.map((group) => {
    // Step 1: fold localeBaseDelta[locale] -> localeAdjust[locale][BASE] verbatim.
    const step1Layers = mapLayerTree(group.layers, (layer) => {
      const legacyBaseDelta = getLegacyLocaleLayoutFields(layer).localeBaseDelta
      if (!legacyBaseDelta) return layer
      let localeAdjust = layer.localeAdjust
      for (const [locale, delta] of Object.entries(legacyBaseDelta)) {
        if (!delta || !Object.keys(delta).length) continue
        localeAdjust = {
          ...(localeAdjust ?? {}),
          [locale]: {
            ...(localeAdjust?.[locale] ?? {}),
            [baseFormat]: { ...delta },
          },
        }
      }
      return localeAdjust !== layer.localeAdjust ? ({ ...layer, localeAdjust } as Layer) : layer
    })
    const step1Group: SlideGroup = { ...group, layers: step1Layers }

    // Step 2: convert localeLayoutOverrides[locale][format] cells (format !== base)
    // into localeAdjust[locale][format] deltas, derived against R (the value
    // resolved via the real render path, INCLUDING the just-folded base-scoped
    // delta, EXCLUDING this cell).
    const step2Layers = mapLayerTree(step1Group.layers, (layer) => {
      const legacyLayoutOverrides = getLegacyLocaleLayoutFields(layer).localeLayoutOverrides
      if (!legacyLayoutOverrides) return layer
      let localeAdjust = layer.localeAdjust
      for (const [locale, byFormat] of Object.entries(legacyLayoutOverrides)) {
        if (!byFormat) continue
        for (const [format, patch] of Object.entries(byFormat)) {
          if (!patch) continue
          // Dead cell: no writer ever produces localeLayoutOverrides[locale][baseFormat].
          // Count keys (not cells) to match the documented "dropped counts keys" contract.
          if (format === baseFormat) {
            dropped += Object.keys(patch).length
            continue
          }
          const resolvedFormat = format as CanvasFormatId
          const R = resolveLayerLocaleAdjustBaseOnly(
            step1Group,
            layer.id,
            locale,
            resolvedFormat,
            baseFormat,
            project.settings.customFormats,
          )
          if (!R) {
            // Layer filtered out of this format's resolved view entirely
            // (ownerFormat mismatch, formatVisibility[format] === false, …) —
            // every key in this cell is unrepresentable, so count them all
            // rather than silently dropping the whole cell uncounted.
            dropped += Object.keys(patch).length
            continue
          }
          const { delta, dropped: keyDropped } = deriveLocaleAdjustDelta(patch, R)
          dropped += keyDropped
          if (!Object.keys(delta).length) continue
          localeAdjust = {
            ...(localeAdjust ?? {}),
            [locale]: {
              ...(localeAdjust?.[locale] ?? {}),
              [resolvedFormat]: {
                ...(localeAdjust?.[locale]?.[resolvedFormat] ?? {}),
                ...delta,
              },
            },
          }
        }
      }
      return localeAdjust !== layer.localeAdjust ? ({ ...layer, localeAdjust } as Layer) : layer
    })

    return { ...step1Group, layers: step2Layers }
  })

  return { project: { ...project, slideGroups }, dropped }
}

/**
 * Assign missing `slideKey`s. For legacy projects with multiple families and
 * no linkage, this is a one-time best-effort guess by position within each
 * family's group list — the same heuristic the app would otherwise redo on
 * every family switch. Once assigned it's frozen data and never recomputed.
 */
export function migrateProjectSlideKeys(project: Project): Project {
  if (project.slideGroups.every((g) => g.slideKey)) return project
  const families = selectProjectFamilies(project)
  const byFamily = new Map(families.map((f) => [f, selectFamilyGroups(project, f)] as const))
  const maxLen = Math.max(0, ...Array.from(byFamily.values()).map((groups) => groups.length))
  const indexKeys = Array.from({ length: maxLen }, () => newId())
  const keyByGroupId = new Map<string, string>()
  for (const groups of byFamily.values()) {
    groups.forEach((group, i) => {
      if (!group.slideKey) keyByGroupId.set(group.id, indexKeys[i])
    })
  }
  return {
    ...project,
    slideGroups: project.slideGroups.map((group) => (
      group.slideKey ? group : { ...group, slideKey: keyByGroupId.get(group.id) ?? newId() }
    )),
  }
}

/**
 * Split persisted pre-family-split desktop groups into one group per new family.
 * A legacy desktop group could own mac, Apple TV, and Vision Pro simultaneously;
 * those formats are now incompatible families and must not remain first-ID-wins.
 */
export function normalizeGroupFamilies<T extends Project>(project: T): T {
  const legacyDesktopFormats = new Set<CanvasFormatId>(['mac', 'appletv', 'visionpro'])
  const slideGroups = project.slideGroups.flatMap((group) => {
    const formats = group.formats
    if (!formats?.length) return [group]
    const legacy = formats.filter((format) => legacyDesktopFormats.has(format))
    if (legacy.length < 2) return [group]
    const customs = formats.filter((format) => !legacyDesktopFormats.has(format))

    const byFamily = new Map<string, CanvasFormatId[]>()
    for (const format of legacy) {
      const family = getFormatFamilyKey(format)
      if (!family) continue
      byFamily.set(family, [...(byFamily.get(family) ?? []), format])
    }
    if (byFamily.size <= 1) return [group]

    return Array.from(byFamily.values()).map((familyFormats, index) => (
      index === 0
        ? { ...group, formats: [...familyFormats, ...customs], slideNames: [...group.slideNames] }
        : { ...group, id: newId(), formats: familyFormats, layers: group.layers.map(cloneLayerWithNewIds), slideNames: [...group.slideNames] }
    ))
  })
  return { ...project, slideGroups }
}

/**
 * Normalize + migrate a parsed project: canvas formats, legacy CanvasBackground
 * → BackgroundLayer, and legacy TextLayer.spans → marks. Shared by import and
 * localStorage hydration so both paths produce the same shape.
 */
export function migrateProject(raw: Project): Project {
  const project = normalizeGroupFamilies(normalizeProjectFormats(raw))
  for (const sg of project.slideGroups) {
    if (!sg.layers.some((l) => l.type === 'background')) {
      const migrated = sg.background ? bgFromLegacy(sg.background) : createBackgroundLayer()
      sg.layers = [migrated, ...sg.layers]
    }
    sg.layers = sg.layers.map(migrateLayerSpans)
    sg.layers = mapLayerTree(sg.layers, (l) => foldLayerToSymmetric(l, project.settings.defaultLocale))
    // Legacy field — fully superseded by the BackgroundLayer in layers[0]
    delete sg.background
  }
  if (!project.settings.pano) {
    project.settings = { ...project.settings, pano: { gapPx: 24, compensate: false } }
  }
  if ((project.settings.schemaVersion ?? 0) < LOCALE_SYMMETRIC_SCHEMA_VERSION) {
    project.settings = { ...project.settings, schemaVersion: LOCALE_SYMMETRIC_SCHEMA_VERSION }
  }
  if ((project.settings.schemaVersion ?? 0) < LOCALE_ADJUST_SCHEMA_VERSION) {
    const { project: migrated } = migrateProjectToLocaleAdjust(project)
    project.slideGroups = migrated.slideGroups
    project.settings = { ...project.settings, schemaVersion: LOCALE_ADJUST_SCHEMA_VERSION }
  }
  if ((project.settings.schemaVersion ?? 0) < SLIDE_KEY_SCHEMA_VERSION) {
    project.slideGroups = migrateProjectSlideKeys(project).slideGroups
    project.settings = { ...project.settings, schemaVersion: SLIDE_KEY_SCHEMA_VERSION }
  }
  return project
}
