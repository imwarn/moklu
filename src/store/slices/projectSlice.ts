/**
 * [INPUT]: depends on BrandColor/Template from @/types, canvasFormats/templates/templateSlots/templateAppearance/projectAssets utils, EditorStore/EditorSet/EditorGet from ../types, useAssetStore from ../assets, and project helpers from ../helpers
 * [OUTPUT]: exports createProjectSlice slice creator managing project metadata, settings, brand colors, JSON import/export/reset, and template export/import/application
 * [POS]: project-level lifecycle and template bridge slice in src/store/slices/; composed into useEditorStore by src/store/index.ts with undo-history clearing hook
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { BrandColor, Template } from '@/types'
import { normalizeProjectFormats, BASE_CANVAS_FORMAT, getGroupFamilyKey } from '@/utils/canvasFormats'
import { projectToTemplate, applyTemplate, extractInlineScreenshots } from '@/utils/templates'
import { applyTemplateToCanvas } from '@/utils/templateSlots'
import { applyTemplateAppearance } from '@/utils/templateAppearance'
import { isProjectExportBundle } from '@/utils/projectAssets'
import type { EditorStore, EditorSet, EditorGet } from '../types'
import { useAssetStore } from '../assets'
import {
  newId,
  newProject,
  assertProjectShape,
  migrateProject,
  touchProject,
  touchSettings,
} from '../helpers'

export const createProjectSlice = (
  set: EditorSet,
  get: EditorGet,
  clearHistory: () => void,
): Pick<
  EditorStore,
  | 'setProjectName'
  | 'updateSettings'
  | 'updateProject'
  | 'addBrandColor'
  | 'updateBrandColor'
  | 'removeBrandColor'
  | 'exportProject'
  | 'importProject'
  | 'resetProject'
  | 'exportActiveAsTemplate'
  | 'importTemplateAsNewProject'
  | 'addTemplateSlideGroups'
  | 'applyTemplateToActiveCanvas'
> => ({
  // ─ Project actions
  setProjectName: (name) =>
    set((s) => ({ project: touchProject(s.project, { name }) })),

  updateSettings: (patch) =>
    set((s) => ({ project: touchSettings(s.project, patch) })),

  updateProject: (patch) =>
    set((s) => ({ project: touchProject(s.project, patch) })),

  // ─ Brand color actions
  addBrandColor: (name, value) => {
    const color: BrandColor = { id: newId(), name, value }
    set((s) => ({
      project: touchSettings(s.project, {
        brandColors: [...(s.project.settings.brandColors ?? []), color],
      }),
    }))
  },

  updateBrandColor: (id, patch) => {
    set((s) => ({
      project: touchSettings(s.project, {
        brandColors: (s.project.settings.brandColors ?? []).map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      }),
    }))
  },

  removeBrandColor: (id) => {
    set((s) => ({
      project: touchSettings(s.project, {
        brandColors: (s.project.settings.brandColors ?? []).filter((c) => c.id !== id),
      }),
    }))
  },

  // ─ Project persistence
  exportProject: () => {
    return JSON.stringify(get().project, null, 2)
  },

  importProject: (json) => {
    const parsed: unknown = JSON.parse(json)
    const rawProject = isProjectExportBundle(parsed) ? parsed.project : parsed
    assertProjectShape(rawProject)
    const project = migrateProject(rawProject)
    set({
      project,
      activeSlideGroupId: project.slideGroups[0]?.id ?? '',
      selection: null,
      editingGroupId: null,
      selectedLayerIds: [],
      selectedAccentIndex: null,
      activeLocale: project.settings.defaultLocale ?? 'en',
      activeCanvasFormat: BASE_CANVAS_FORMAT,
      activeFamily: project.slideGroups[0] ? (getGroupFamilyKey(project.slideGroups[0]) ?? 'phone') : 'phone',
      lastFormatByFamily: {},
      lastGroupByFamily: {},
    })
    // Clear undo history — undo must not cross project boundaries
    clearHistory()
  },

  resetProject: () => {
    const project = newProject()
    set({
      project,
      activeSlideGroupId: project.slideGroups[0].id,
      selection: null,
      editingGroupId: null,
      selectedLayerIds: [],
      selectedAccentIndex: null,
      activeLocale: 'en',
      activeCanvasFormat: BASE_CANVAS_FORMAT,
      activeFamily: project.slideGroups[0] ? (getGroupFamilyKey(project.slideGroups[0]) ?? 'phone') : 'phone',
      lastFormatByFamily: {},
      lastGroupByFamily: {},
    })
    // Clear undo history — new project starts fresh
    clearHistory()
  },

  exportActiveAsTemplate: (opts) => {
    return projectToTemplate(get().project, opts)
  },

  importTemplateAsNewProject: (tpl: Template) => {
    const { slideGroups, settings } = applyTemplate(tpl)
    const extracted = extractInlineScreenshots(tpl.name, slideGroups)
    extracted.assets.forEach((asset) => useAssetStore.getState().addAsset(asset.filename, asset.dataUrl))
    const now = new Date().toISOString()
    const base = newProject()
    const project = normalizeProjectFormats({
      id: newId(),
      name: tpl.name,
      createdAt: now,
      updatedAt: now,
      settings: { ...base.settings, ...settings },
      slideGroups: extracted.slideGroups,
    })
    set({
      project,
      activeSlideGroupId: extracted.slideGroups[0]?.id ?? '',
      selection: null,
      editingGroupId: null,
      selectedLayerIds: [],
      selectedAccentIndex: null,
      activeLocale: project.settings.defaultLocale ?? 'en',
      activeCanvasFormat: BASE_CANVAS_FORMAT,
      activeFamily: project.slideGroups[0] ? (getGroupFamilyKey(project.slideGroups[0]) ?? 'phone') : 'phone',
      lastFormatByFamily: {},
      lastGroupByFamily: {},
    })
    // Clear undo history — new project starts fresh
    clearHistory()
  },

  /** Apply a template's first suitable slide onto the current artboard.
   * The canvas dimensions, ID and user screenshot remain intact.
   */
  applyTemplateToActiveCanvas: (tpl: Template, mode = 'layout', parts) => {
    const { project, activeSlideGroupId } = get()
    const current = project.slideGroups.find((g) => g.id === activeSlideGroupId)
    if (!current) throw new Error('Choose a canvas before applying a template.')
    const result = mode === 'appearance'
      ? applyTemplateAppearance(tpl, current, parts)
      : applyTemplateToCanvas(tpl, current)
    set((s) => {
      const existing = s.project.settings.brandColors ?? []
      const known = new Set(existing.map((color) => color.id))
      const incoming = (result.settings?.brandColors ?? []).filter((color) => !known.has(color.id))
      return {
        project: touchProject(s.project, {
          settings: incoming.length
            ? { ...s.project.settings, brandColors: [...existing, ...incoming] }
            : s.project.settings,
          slideGroups: s.project.slideGroups.map((group) => group.id === activeSlideGroupId
            ? { ...group, layers: result.layers, ...(mode === 'layout' ? { formats: undefined } : {}) }
            : group),
        }),
        ...(mode === 'layout' ? {
          selection: result.selectedLayerId ? { slideGroupId: activeSlideGroupId, layerId: result.selectedLayerId } : null,
          selectedLayerIds: [],
          editingGroupId: null,
          activeCanvasFormat: BASE_CANVAS_FORMAT,
        } : {}),
      }
    })
  },

  addTemplateSlideGroups: (tpl: Template) => {
    const { slideGroups, settings } = applyTemplate(tpl)
    const extracted = extractInlineScreenshots(tpl.name, slideGroups)
    extracted.assets.forEach((asset) => useAssetStore.getState().addAsset(asset.filename, asset.dataUrl))
    set((s) => {
      // Merge template brand colors into the current palette so {brand:id}
      // tokens in the appended layers resolve. Existing ids win (never
      // overwrite the user's palette); only missing entries are added.
      const existing = s.project.settings.brandColors ?? []
      const existingIds = new Set(existing.map((c) => c.id))
      const incoming = (settings?.brandColors ?? []).filter((c) => !existingIds.has(c.id))
      return {
        project: touchProject(s.project, {
          settings: incoming.length > 0
            ? { ...s.project.settings, brandColors: [...existing, ...incoming] }
            : s.project.settings,
          slideGroups: [...s.project.slideGroups, ...extracted.slideGroups],
        }),
        activeSlideGroupId: extracted.slideGroups[0]?.id ?? s.activeSlideGroupId,
      }
    })
  },
})
