import type { Project, Template } from '@/types'

/** Bounds for user-supplied files, including nested JSON and embedded images. */
export const IMPORT_LIMITS = {
  fileBytes: 96 * 1024 * 1024,
  groups: 100,
  layers: 5_000,
  groupDepth: 12,
  assets: 500,
  assetDataUrlLength: 36 * 1024 * 1024,
  totalAssetLength: 92 * 1024 * 1024,
} as const

const layerTypes = new Set([
  'background', 'phone', 'text', 'image', 'shape', 'emoji', 'brand', 'group',
])
const poisonKeys = new Set(['__proto__', 'constructor', 'prototype'])
const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function fail(message: string): never {
  throw new Error(`Invalid import: ${message}`)
}

export function checkImportFileSize(bytes: number): void {
  if (bytes <= 0 || bytes > IMPORT_LIMITS.fileBytes) {
    fail(`JSON file must be 1–${Math.floor(IMPORT_LIMITS.fileBytes / 1024 / 1024)} MB.`)
  }
}

export function parseBoundedImportJson(json: string): unknown {
  checkImportFileSize(new Blob([json]).size)
  try {
    return JSON.parse(json) as unknown
  } catch {
    return fail('file is not valid JSON.')
  }
}

/** Avoid deep/malformed trees before migration, and reject prototype-polluting keys. */
function validateTreeAndFields(value: unknown): void {
  const nodes: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }]
  let visited = 0
  while (nodes.length) {
    const current = nodes.pop()!
    if (++visited > 100_000) fail('too many data fields.')
    if (current.depth > 30) fail('JSON nesting exceeds safe limit.')
    if (Array.isArray(current.value)) {
      if (current.value.length > 20_000) fail('an array exceeds the safe item limit.')
      for (const child of current.value) nodes.push({ value: child, depth: current.depth + 1 })
    } else if (isRecord(current.value)) {
      const entries = Object.entries(current.value)
      if (entries.length > 10_000) fail('an object has too many keys.')
      for (const [key, v] of entries) {
        if (poisonKeys.has(key)) fail(`reserved key "${key}" is not allowed.`)
        nodes.push({ value: v, depth: current.depth + 1 })
      }
    } else if (typeof current.value === 'number' && !Number.isFinite(current.value)) {
      fail('non-finite numeric value.')
    } else if (typeof current.value === 'string' &&
      current.value.length > IMPORT_LIMITS.assetDataUrlLength) {
      fail('a string field is too large.')
    }
  }
}

function validateGroups(groups: unknown, kind: 'project' | 'template'): void {
  if (!Array.isArray(groups) || groups.length === 0 || groups.length > IMPORT_LIMITS.groups) {
    fail(`${kind} must contain 1–${IMPORT_LIMITS.groups} slide groups.`)
  }
  let count = 0
  const seen = new Set<string>()
  for (const group of groups) {
    if (!isRecord(group) || !Array.isArray(group.layers)) fail('each slide group needs a layers array.')
    if (kind === 'project' && (typeof group.id !== 'string' || !group.id)) fail('project slide group is missing its ID.')
    if (typeof group.name !== 'string' || group.name.length > 300) fail('invalid slide group name.')
    const width = group.slideWidth, height = group.slideHeight, slides = group.numSlides
    if (!Number.isInteger(width) || !Number.isInteger(height) ||
        (width as number) < 1 || (height as number) < 1 ||
        (width as number) > 16_384 || (height as number) > 16_384 ||
        (width as number) * (height as number) > 67_108_864) fail('invalid or oversized canvas dimensions.')
    if (!Number.isInteger(slides) || (slides as number) < 1 || (slides as number) > 50) {
      fail('invalid number of slides.')
    }
    if (!Array.isArray(group.slideNames) || group.slideNames.length > 50 ||
        group.slideNames.some((name: unknown) => typeof name !== 'string' || name.length > 300)) {
      fail('invalid slide names.')
    }
    const queue: Array<{ layer: unknown; depth: number }> = group.layers.map((layer: unknown) => ({ layer, depth: 0 }))
    while (queue.length) {
      const { layer, depth } = queue.pop()!
      if (++count > IMPORT_LIMITS.layers) fail(`more than ${IMPORT_LIMITS.layers} layers.`)
      if (depth > IMPORT_LIMITS.groupDepth) fail('group nesting is too deep.')
      if (!isRecord(layer) || !layerTypes.has(String(layer.type))) fail('unknown or invalid layer type.')
      if (typeof layer.id !== 'string' || !layer.id || layer.id.length > 200) fail('invalid layer ID.')
      // Within one artboard, recursive layer identities must not collide.
      const key = `${String(group.id ?? groups.indexOf(group))}:${layer.id}`
      if (seen.has(key)) fail('duplicate layer IDs in one canvas.')
      seen.add(key)
      if (typeof layer.x !== 'number' || !Number.isFinite(layer.x) ||
          typeof layer.y !== 'number' || !Number.isFinite(layer.y)) fail('invalid layer position.')
      if (layer.type === 'group') {
        if (!Array.isArray(layer.children) || layer.children.length > IMPORT_LIMITS.layers) {
          fail('invalid group children.')
        }
        for (const child of layer.children) queue.push({ layer: child, depth: depth + 1 })
      }
    }
  }
}

/** Validate imported projects before any project-library or editor writes. */
export function validateProjectImport(value: unknown): { project: Project; assets: Record<string, string> } {
  validateTreeAndFields(value)
  if (!isRecord(value)) fail('project file must contain an object.')
  if (value.kind === 'template') fail('a template cannot be imported as a project.')
  if (value.kind === 'project-export' && value.schemaVersion !== 1) {
    fail('unsupported project bundle version.')
  }
  const isBundle = value.kind === 'project-export'
  const raw = isBundle ? value.project : value
  if (!isRecord(raw) || Array.isArray(raw.slideGroups) === false || !isRecord(raw.settings)) {
    fail('expected a project with settings and slideGroups.')
  }
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 300) {
    fail('project name is missing or too long.')
  }
  validateGroups(raw.slideGroups, 'project')
  let assets: Record<string, string> = {}
  if (isBundle) {
    if (!isRecord(value.assets) || Object.keys(value.assets).length > IMPORT_LIMITS.assets) {
      fail('invalid or excessive embedded assets.')
    }
    let combined = 0
    for (const [key, image] of Object.entries(value.assets)) {
      if (!key || key.length > 250 || poisonKeys.has(key)) fail('invalid asset key.')
      if (typeof image !== 'string' || image.length > IMPORT_LIMITS.assetDataUrlLength ||
          !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]*={0,2}$/i.test(image)) {
        fail('embedded assets must be PNG, JPEG or WebP data URLs.')
      }
      combined += image.length
      if (combined > IMPORT_LIMITS.totalAssetLength) fail('embedded assets exceed the total size limit.')
    }
    assets = value.assets as Record<string, string>
  }
  return { project: raw as unknown as Project, assets }
}

/** Keep legacy unversioned templates, but require a complete safe slide structure. */
export function validateTemplateImport(value: unknown): Template {
  validateTreeAndFields(value)
  if (!isRecord(value)) fail('template must be an object.')
  if (value.kind !== undefined && value.kind !== 'template') fail('this is not a template file.')
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1) {
    fail('unsupported template schema version.')
  }
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 300) {
    fail('template needs a valid name.')
  }
  validateGroups(value.slideGroups, 'template')
  // Only legacy unversioned documents without project timestamps may omit kind.
  if (!value.kind && (value.createdAt && value.updatedAt)) fail('project data cannot be imported as a template.')
  return { ...value, kind: 'template', schemaVersion: 1 } as unknown as Template
}
