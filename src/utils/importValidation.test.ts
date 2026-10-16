import { describe, expect, it } from 'vitest'
import { makeQuickLayers } from '@/utils/quickDesign'
import { newProject } from '@/store/helpers'
import { checkImportFileSize, parseBoundedImportJson, validateProjectImport, validateTemplateImport } from './importValidation'

const template = () => ({
  kind: 'template', schemaVersion: 1, name: 'Demo', id: 'demo', description: '',
  slideGroups: [{
    name: 'Example', numSlides: 1, slideWidth: 1200, slideHeight: 900,
    slideNames: ['slide-1'], layers: makeQuickLayers([], 'wide', 'warm', 'browser-chrome'),
  }],
})

describe('bounded import validation', () => {
  it('accepts real modern project documents and legacy templates', () => {
    expect(validateProjectImport(newProject()).project.name).toBe('Untitled Project')
    const old = template() as {kind?: string; schemaVersion?: number; [key: string]: unknown}
    delete old.kind
    delete old.schemaVersion
    expect(validateTemplateImport(old).kind).toBe('template')
  })
  it('rejects incomplete or unsupported schema before migration', () => {
    expect(() => validateProjectImport({ slideGroups: [], settings: {} })).toThrow(/Invalid import/)
    expect(() => validateTemplateImport({ ...template(), schemaVersion: 5 })).toThrow(/version/)
    expect(() => validateTemplateImport({ ...template(), slideGroups: [{ layers: null }] })).toThrow(/layers/)
  })
  it('rejects huge, nested and invalid geometry without mutating the source', () => {
    const p = newProject()
    const original = structuredClone(p)
    p.slideGroups[0].slideWidth = 999999
    expect(() => validateProjectImport(p)).toThrow(/canvas/)
    expect(original.slideGroups[0].slideWidth).toBe(1290)
    const tpl = template()
    tpl.slideGroups[0].layers[1].id = tpl.slideGroups[0].layers[0].id
    expect(() => validateTemplateImport(tpl)).toThrow(/duplicate/)
  })
  it('rejects potentially executable image references and unsupported project migrations', () => {
    const p = newProject()
    const bg = p.slideGroups[0].layers[0]
    if (bg.type !== 'background') throw new Error('missing background')
    bg.imageDataUrl = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
    expect(() => validateProjectImport(p)).toThrow(/executable/)
    const future = newProject()
    future.settings.schemaVersion = 999
    expect(() => validateProjectImport(future)).toThrow(/future project schema/)
  })

  it('rejects prototype-pollution keys and SVG asset payloads', () => {
    const pollution = JSON.parse('{"__proto__": {"isAdmin": true}, "name":"x"}') as unknown
    expect(() => validateProjectImport(pollution)).toThrow(/reserved key/)
    const project = newProject()
    const wrong = {
      kind: 'project-export', schemaVersion: 1, project,
      assets: { logo: 'data:image/svg+xml;base64,PHN2Zy8+' },
    }
    expect(() => validateProjectImport(wrong)).toThrow(/PNG, JPEG/)
  })
  it('accepts an ordinary PNG project bundle with its original references', () => {
    const project = newProject()
    const image = 'data:image/png;base64,aGVsbG8='
    const result = validateProjectImport({ kind: 'project-export', schemaVersion: 1, project, assets: { file: image } })
    expect(result.assets.file).toBe(image)
  })
  it('validates input size and JSON syntax', () => {
    expect(() => checkImportFileSize(0)).toThrow(/JSON file/)
    expect(() => parseBoundedImportJson('{not json}')).toThrow(/valid JSON/)
    expect(parseBoundedImportJson('{"name":"hello"}')).toEqual({ name: 'hello' })
  })
})
