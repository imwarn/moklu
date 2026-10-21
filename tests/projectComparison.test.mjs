import { describe, expect, it } from 'vitest'
import { normalizedProject } from './live/projectComparison.mjs'

const bundle = (...layers) => ({
  project: { slideGroups: [{ id: 'group', layers }] },
  assets: { shot: 'data:image/png;base64,AAAA' },
})

describe('live project persistence normalization', () => {
  it('does not crash on layers without screenshotPath or localeContent', () => {
    const plain = bundle({ id: 'text', type: 'text', text: 'hello' })
    expect(normalizedProject(plain)).toEqual(plain.project.slideGroups)
  })

  it('treats default locale duplicate of base screenshot as equivalent', () => {
    const original = bundle({ id: 'phone', type: 'phone', screenshotPath: 'shot', screenshotDataUrl: 'data:image/png;base64,AAAA' })
    const restored = bundle({ id: 'phone', type: 'phone', screenshotPath: 'shot', localeContent: { en: { screenshotPath: 'shot' } } })
    expect(normalizedProject(restored)).toEqual(normalizedProject(original))
    expect(original.project.slideGroups[0].layers[0].screenshotDataUrl).toBeTruthy()
    expect(restored.project.slideGroups[0].layers[0].localeContent.en).toBeTruthy()
  })

  it('preserves non-redundant locale overrides and other edits', () => {
    const original = bundle({ id: 'phone', screenshotPath: 'shot', name: 'A' })
    const changedLocale = bundle({ id: 'phone', screenshotPath: 'shot', name: 'A', localeContent: { en: { screenshotPath: 'other' } } })
    const changedName = bundle({ id: 'phone', screenshotPath: 'shot', name: 'B' })
    expect(normalizedProject(changedLocale)).not.toEqual(normalizedProject(original))
    expect(normalizedProject(changedName)).not.toEqual(normalizedProject(original))
  })

  it('retains nested layer semantics without dereferencing missing locale overrides', () => {
    const original = bundle({ id: 'group', children: [{ id: 'x', type: 'text' }, { id: 'phone', screenshotPath: 'shot' }] })
    const restored = bundle({ id: 'group', children: [{ id: 'x', type: 'text' }, { id: 'phone', screenshotPath: 'shot', localeContent: { en: { screenshotPath: 'shot' } } }] })
    expect(normalizedProject(restored)).toEqual(normalizedProject(original))
  })

  it('does not discard meaningful default-locale fields besides the screenshot pointer', () => {
    const original = bundle({ id: 'phone', screenshotPath: 'shot' })
    const changed = bundle({ id: 'phone', screenshotPath: 'shot', localeContent: { en: { screenshotPath: 'shot', text: 'edit' } } })
    expect(normalizedProject(changed)).not.toEqual(normalizedProject(original))
  })
})
