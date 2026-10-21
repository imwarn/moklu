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

describe('default-locale screenshot data URL migration', () => {
  it('treats imported locale path plus matching inline bytes as equivalent to the original', () => {
    const before = bundle({ id: 'phone', screenshotPath: 'shot', screenshotDataUrl: 'data:image/png;base64,AAAA' })
    const imported = bundle({
      id: 'phone', screenshotPath: 'shot',
      localeContent: { en: {
        screenshotPath: 'shot', screenshotDataUrl: 'data:image/png;base64,AAAA',
      } },
    })
    expect(normalizedProject(imported)).toEqual(normalizedProject(before))
    expect(imported.project.slideGroups[0].layers[0].localeContent.en.screenshotDataUrl).toBe('data:image/png;base64,AAAA')
  })

  it('rejects a changed inline image even if its reference path is unchanged', () => {
    const original = bundle({ id: 'phone', screenshotPath: 'shot' })
    const tamperedLocale = bundle({
      id: 'phone', screenshotPath: 'shot',
      localeContent: { en: {
        screenshotPath: 'shot', screenshotDataUrl: 'data:image/png;base64,DIFFERENT',
      } },
    })
    expect(normalizedProject(tamperedLocale)).not.toEqual(normalizedProject(original))
  })

  it('does not hide a path-only locale patch when the base asset is missing', () => {
    const original = bundle({ id: 'phone', screenshotPath: 'absent' })
    const changed = bundle({
      id: 'phone', screenshotPath: 'absent',
      localeContent: { en: { screenshotPath: 'absent' } },
    })
    expect(normalizedProject(changed)).not.toEqual(normalizedProject(original))
  })

  it('does not discard unrelated language overrides or screenshot fit changes', () => {
    const original = bundle({ id: 'phone', screenshotPath: 'shot', screenshotFit: 'cover' })
    const changedLocale = bundle({
      id: 'phone', screenshotPath: 'shot', screenshotFit: 'cover',
      localeContent: { en: { screenshotPath: 'shot', screenshotDataUrl: 'data:image/png;base64,AAAA' }, fr: { screenshotPath: 'other' } },
    })
    const changedFit = bundle({ id: 'phone', screenshotPath: 'shot', screenshotFit: 'contain' })
    expect(normalizedProject(changedLocale)).not.toEqual(normalizedProject(original))
    expect(normalizedProject(changedFit)).not.toEqual(normalizedProject(original))
  })
})
