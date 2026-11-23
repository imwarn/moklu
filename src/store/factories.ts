/**
 * [INPUT]: depends on nanoid, Project/SlideGroup/Layer/BackgroundLayer/CanvasBackground/ProjectSettings/LocaleContent types from @/types, BASE_CANVAS_FORMAT from @/utils/canvasFormats, BRAND from @/theme/brand, and EditorSet/EditorGet from ./types
 * [OUTPUT]: exports ID/project/slide-group/background factories (newId, createBackgroundLayer, bgFromLegacy, newSlideGroup, newProject), layer cloning/scaling/key utilities (getLayerDefaultsScaleFactor, cloneLayerWithNewIds, bakeLayerScale, cloneWithNewIds, STYLE_KEYS, seedLocaleContent, pickLayerKeys), shape/persistence helpers (assertProjectShape, stripDataUrls), and immutable state mutators (touchProject, touchSettings, getActiveGroup, mutateActiveGroup)
 * [POS]: foundational pure factories and state-mutation primitives in src/store/; depended on by migrations.ts, helpers.ts, and editor slices without circular dependencies
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import type {
  Project, SlideGroup, Layer, LayerType, GroupLayer,
  BackgroundLayer, CanvasBackground, ProjectSettings,
  LocaleContent,
} from '@/types'
import { BASE_CANVAS_FORMAT } from '@/utils/canvasFormats'
import { BRAND } from '@/theme/brand'
import type { EditorSet, EditorGet } from './types'

// ─── ID & Layer Primitives ────────────────────────────────────────────────────

export function newId() { return nanoid(10) }

/**
 * Proportional shrink factor for newly-added layer defaults on non-standard
 * canvases (e.g. Apple Watch, 422×514). Clamped at 1 so it only ever shrinks
 * defaults to fit a smaller canvas — it must never enlarge them on a canvas
 * that's already >= the project's default size (this is what keeps it a
 * no-op for the common case, including fixtures that resize to a
 * same-family, slightly larger canvas like the 1320×2868 iPhone preset).
 */
export function getLayerDefaultsScaleFactor(group: SlideGroup, settings: ProjectSettings): number {
  return Math.min(
    1,
    group.slideWidth / settings.defaultSlideWidth,
    group.slideHeight / settings.defaultSlideHeight,
  )
}

/** Deep-clone a layer tree while assigning fresh IDs to every node. */
export function cloneLayerWithNewIds(layer: Layer): Layer {
  const clone = JSON.parse(JSON.stringify(layer)) as Layer
  const reId = (value: Layer): Layer => value.type === 'group'
    ? { ...value, id: newId(), children: (value as GroupLayer).children.map(reId) } as Layer
    : { ...value, id: newId() } as Layer
  return reId(clone)
}

/**
 * Bake a group's uniform scale into a child layer's own properties.
 * Used when dissolving / flattening a scaled group so the visual result is unchanged.
 */
export function bakeLayerScale(layer: Layer, s: number): Layer {
  if (s === 1) return layer
  const scaled: Layer = { ...layer, x: layer.x * s, y: layer.y * s }
  if (scaled.shadow) {
    scaled.shadow = { ...scaled.shadow, blur: scaled.shadow.blur * s, offsetX: scaled.shadow.offsetX * s, offsetY: scaled.shadow.offsetY * s }
  }
  if (scaled.blur != null) scaled.blur = scaled.blur * s
  switch (scaled.type) {
    case 'phone':
      scaled.scale *= s
      break
    case 'image':
      scaled.width *= s
      scaled.height *= s
      scaled.cornerRadius *= s
      break
    case 'shape':
      scaled.width *= s
      scaled.height *= s
      scaled.cornerRadius *= s
      if (scaled.strokeWidth != null) scaled.strokeWidth *= s
      break
    case 'text':
      scaled.fontSize *= s
      scaled.letterSpacing *= s
      if (scaled.width != null) scaled.width *= s
      if (scaled.height != null) scaled.height *= s
      break
    case 'emoji':
      scaled.fontSize *= s
      break
    case 'brand':
      scaled.logoSize *= s
      scaled.nameFontSize *= s
      scaled.gap *= s
      break
    case 'group':
      scaled.scale = (scaled.scale ?? 1) * s
      break
  }
  return scaled
}

/** Deep-clone a layer and assign fresh ids to it and all group children */
export function cloneWithNewIds(layer: Layer): Layer {
  const clone = JSON.parse(JSON.stringify(layer)) as Layer
  clone.id = newId()
  if (clone.type === 'group') {
    (clone as GroupLayer).children = (clone as GroupLayer).children.map(cloneWithNewIds)
  }
  return clone
}

export const STYLE_KEYS: Partial<Record<LayerType, string[]>> = {
  background: ['fill', 'accents', 'imageDataUrl', 'imageFit', 'imageBlur', 'imageOverlayColor', 'imageOverlayOpacity', 'noise', 'blur', 'shadow', 'opacity'],
  text: ['fill', 'fontFamily', 'fontSize', 'fontWeight', 'italic', 'underline', 'strikethrough', 'letterSpacing', 'lineHeight', 'align', 'width', 'height', 'verticalAlign', 'blur', 'shadow', 'opacity'],
  shape: ['fill', 'stroke', 'strokeWidth', 'cornerRadius', 'shapeType', 'width', 'height', 'blur', 'shadow', 'opacity'],
  emoji: ['emoji', 'fontSize', 'blur', 'shadow', 'opacity'],
  brand: ['nameColor', 'nameFontSize', 'nameFontFamily', 'nameFontWeight', 'logoSize', 'direction', 'gap', 'blur', 'shadow', 'opacity'],
  image: ['cornerRadius', 'blur', 'shadow', 'opacity'],
  phone: ['scale', 'screenshotFit', 'screenshotOffsetX', 'screenshotOffsetY', 'showStatusBar', 'statusBarTheme', 'statusBarBg', 'statusBarColor', 'border', 'blur', 'shadow', 'opacity'],
  group: ['blur', 'shadow', 'opacity'],
}

// ─── Project & Layer Factories ────────────────────────────────────────────────

export function createBackgroundLayer(overrides?: Partial<BackgroundLayer>): BackgroundLayer {
  return {
    id: newId(),
    name: 'Background',
    type: 'background',
    x: 0, y: 0, rotation: 0, opacity: 1, visible: true,
    locked: true,  // always locked — not moveable
    fill: {
      type: 'linear',
      angle: 160,
      stops: [
        { offset: 0, color: BRAND.panel },
        { offset: 0.58, color: BRAND.border },
        { offset: 1, color: BRAND.panel },
      ],
    },
    accents: [],
    ...overrides,
  }
}

/** Migrate a legacy CanvasBackground to a BackgroundLayer */
export function bgFromLegacy(bg: CanvasBackground): BackgroundLayer {
  return createBackgroundLayer({
    fill: bg.fill,
    accents: (bg.accents ?? []).map((a) => ({ ...a })),
  })
}

/**
 * Seed localeContent[defaultLocale] for a brand-new layer at creation time.
 * Existing project layers are handled by foldLayerToSymmetric during migration.
 */
export function seedLocaleContent(layer: Layer, defaultLocale: string): Layer {
  if (layer.localeContent) return layer
  if (layer.type !== 'text' && layer.type !== 'phone' && layer.type !== 'image') return layer
  const content: LocaleContent =
    layer.type === 'text'
      ? { text: layer.text, ...(layer.marks?.length ? { marks: layer.marks } : {}) }
      : layer.type === 'phone'
        ? {
            ...(layer.screenshotPath !== undefined ? { screenshotPath: layer.screenshotPath } : {}),
            ...(layer.screenshotDataUrl !== undefined ? { screenshotDataUrl: layer.screenshotDataUrl } : {}),
          }
        : { src: layer.src }
  return { ...layer, localeContent: { [defaultLocale]: content } } as Layer
}

export function newSlideGroup(overrides?: Partial<SlideGroup>): SlideGroup {
  const bgLayer = createBackgroundLayer()
  const { layers: overrideLayers, ...otherOverrides } = overrides ?? {}
  // Ensure background is always the first layer
  const layers: Layer[] = overrideLayers
    ? (overrideLayers.some((l) => l.type === 'background')
        ? overrideLayers
        : [bgLayer, ...overrideLayers])
    : [bgLayer]
  return {
    id: newId(),
    name: 'Slide 1',
    numSlides: 1,
    slideWidth: 1290,
    slideHeight: 2796,
    slideNames: ['slide-01'],
    slideKey: newId(),
    ...otherOverrides,
    layers,
  }
}

export function newProject(): Project {
  const now = new Date().toISOString()
  return {
    id: newId(),
    name: 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    settings: {
      defaultSlideWidth: 1290,
      defaultSlideHeight: 2796,
      defaultLocale: 'en',
      brandName: 'My App',
      baseCanvasFormat: BASE_CANVAS_FORMAT,
      activeFormats: ['iphone-69', 'android-phone'],
      customFormats: [],
      pano: { gapPx: 24, compensate: false },
    },
    slideGroups: [newSlideGroup({ name: 'Slide 1' })],
  }
}

// ─── Shape Validation & Persistence Stripping ─────────────────────────────────

/**
 * Minimal shape guard for user-supplied project JSON. Catches malformed or
 * non-project files with a clear message instead of a deep migration crash.
 */
export function assertProjectShape(value: unknown): asserts value is Project {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid project file: expected a JSON object.')
  }
  const p = value as Partial<Project>
  if (!Array.isArray(p.slideGroups)) {
    throw new Error('Invalid project file: missing "slideGroups" array.')
  }
  if (typeof p.settings !== 'object' || p.settings === null) {
    throw new Error('Invalid project file: missing "settings" object.')
  }
  for (const sg of p.slideGroups) {
    if (typeof sg !== 'object' || sg === null || !Array.isArray((sg as SlideGroup).layers)) {
      throw new Error('Invalid project file: every slide group needs a "layers" array.')
    }
  }
}

/**
 * Strip inline base64 data URL fields from every layer in a project before
 * persisting to localStorage. Assets are stored separately in IndexedDB via
 * the asset store; stripping avoids QuotaExceededError on large projects.
 *
 * Returns a new deep-cloned project — the in-memory store is NOT mutated.
 */
export function stripDataUrls(project: Project): Project {
  const cloned: Project = JSON.parse(JSON.stringify(project))
  for (const sg of cloned.slideGroups) {
    sg.layers = sg.layers.map(stripLayerDataUrls)
  }
  return cloned
}

function stripLayerDataUrls(layer: Layer): Layer {
  // Strip per-type inline data URL fields
  if (layer.type === 'background') {
    delete (layer as { imageDataUrl?: string }).imageDataUrl
  }
  if (layer.type === 'phone') {
    delete (layer as { screenshotDataUrl?: string }).screenshotDataUrl
  }
  // Strip per-locale inline data URLs
  if (layer.localeContent) {
    for (const patch of Object.values(layer.localeContent)) {
      delete patch.screenshotDataUrl
    }
  }
  // Recurse into group children
  if (layer.type === 'group') {
    const grp = layer as GroupLayer
    grp.children = grp.children.map(stripLayerDataUrls)
  }
  return layer
}

// ─── Store Mutation Helpers ───────────────────────────────────────────────────

/**
 * Immutable project patch with an `updatedAt` bump — the single write path
 * for project mutations. Always go through this (or touchSettings) so the
 * timestamp can never be forgotten.
 */
export const touchProject = (p: Project, patch: Partial<Project>): Project => ({
  ...p,
  ...patch,
  updatedAt: new Date().toISOString(),
})

/** Same as touchProject, for nested ProjectSettings patches. */
export const touchSettings = (p: Project, patch: Partial<ProjectSettings>): Project =>
  touchProject(p, { settings: { ...p.settings, ...patch } })

/**
 * Pick a subset of keys off a layer as a patch object. This is the single
 * place where a Layer is read through dynamic string keys — the discriminated
 * union cannot be indexed directly, so the cast is contained here.
 */
export const pickLayerKeys = (layer: Layer, keys: string[]): Partial<Layer> => {
  const source = layer as unknown as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of keys) out[key] = source[key]
  return out as Partial<Layer>
}

export const getActiveGroup = (get: EditorGet) => {
  const { project, activeSlideGroupId } = get()
  return project.slideGroups.find((g) => g.id === activeSlideGroupId)
}

export const mutateActiveGroup = (set: EditorSet, fn: (g: SlideGroup) => SlideGroup) => {
  set((s) => ({
    project: touchProject(s.project, {
      slideGroups: s.project.slideGroups.map((g) => (g.id === s.activeSlideGroupId ? fn(g) : g)),
    }),
  }))
}
