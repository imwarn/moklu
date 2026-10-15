import { describe, expect, it } from 'vitest'
import type { GroupLayer, ImageLayer, SlideGroup, Template, TextLayer } from '@/types'
import { makeQuickLayers } from '@/utils/quickDesign'
import { applyTemplateAppearance } from './templateAppearance'

const text = (id: string, label: string): TextLayer => ({
  id, name: label, type: 'text', x: 120, y: 95, rotation: 0,
  opacity: 1, visible: true, locked: false,
  text: label, fontFamily: 'Arial', fontSize: 42, fontWeight: 400,
  fill: '#333333', lineHeight: 1.4, letterSpacing: 0, align: 'left',
  marks: [{ start: 0, end: 3, fill: '#e6e6e6' }],
  localeContent: { en: { text: label }, zh: { text: '你好' } },
})

function original(): SlideGroup {
  const layers = makeQuickLayers([], 'wide', 'aurora', 'browser-chrome')
  if (layers[1].type !== 'phone') throw new Error('expected screenshot layer')
  layers[1].screenshotPath = 'screenshot.png'
  layers[1].screenshotDataUrl = 'data:image/png;base64,MTIz'
  layers[1].localeContent = { en: { screenshotPath: 'screenshot.png' }, zh: { screenshotPath: 'zh.png' } }
  const image: ImageLayer = {
    id: 'user-image', name: 'My logo', type: 'image',
    x: 310, y: 190, rotation: 15, opacity: 1, locked: false, visible: true,
    src: 'data:image/png;base64,bG9nbw==', width: 60, height: 60, cornerRadius: 2,
  }
  const group: GroupLayer = {
    id: 'my-group', name: 'Grouped overlay', type: 'group',
    x: 240, y: 180, rotation: 0, opacity: 1, locked: false, visible: true,
    children: [text('caption', 'My caption')],
  }
  return {
    id: 'my-artboard', name: 'Moklu Canvas', numSlides: 1, slideWidth: 1600,
    slideHeight: 900, slideNames: ['moklu'], layers: [...layers, image, group],
  }
}

function styleTemplate(): Template {
  const layers = makeQuickLayers([], 'portrait', 'midnight', 'iphone-16-pro')
  layers.push({ ...text('tpl-heading', 'Template Heading'), fill: '#ffe9ac',
    fontFamily: 'Georgia', fontWeight: 700 })
  return {
    id: 'styling', kind: 'template', schemaVersion: 1, name: 'Stylish',
    description: '', slideGroups: [{
      name: 'Template', slideNames: ['template'], numSlides: 1,
      slideWidth: 1080, slideHeight: 1350, layers,
    }],
  }
}

describe('style-only template application', () => {
  it('changes colors and typography but preserves screenshot and all custom geometry', () => {
    const canvas = original()
    const template = styleTemplate()
    const before = structuredClone(canvas)
    const result = applyTemplateAppearance(template, canvas)
    expect(result.layers).toHaveLength(canvas.layers.length)
    const previousPhone = canvas.layers[1]
    const nextPhone = result.layers[1]
    expect(nextPhone).toMatchObject({
      id: previousPhone.id, x: previousPhone.x, y: previousPhone.y,
      model: 'browser-chrome', screenshotPath: 'screenshot.png',
      screenshotDataUrl: 'data:image/png;base64,MTIz',
    })
    expect(nextPhone.type === 'phone' && nextPhone.localeContent?.zh?.screenshotPath).toBe('zh.png')
    expect(result.layers[0]).not.toEqual(canvas.layers[0])
    expect(result.layers[2]).toEqual(canvas.layers[2])
    const preservedGroup = result.layers[3]
    if (preservedGroup.type !== 'group') throw new Error('group removed')
    const caption = preservedGroup.children[0]
    if (caption.type !== 'text') throw new Error('caption removed')
    expect(caption).toMatchObject({
      id: 'caption', text: 'My caption', fontFamily: 'Georgia',
      fontWeight: 700, fill: '#ffe9ac', x: 120, y: 95,
    })
    expect(caption.localeContent?.zh?.text).toBe('你好')
    expect(caption.marks).toEqual(text('caption', 'My caption').marks)
    expect(canvas).toEqual(before)
  })

  it('supports background-only styling without changing device or text', () => {
    const canvas = original()
    const before = structuredClone(canvas)
    const result = applyTemplateAppearance(styleTemplate(), canvas,
      { background: true, frame: false, typography: false })
    expect(result.layers[0]).not.toEqual(before.layers[0])
    expect(result.layers.slice(1)).toEqual(before.layers.slice(1))
    expect(canvas).toEqual(before)
  })

  it('supports typography-only styling while retaining screenshot and background exactly', () => {
    const canvas = original()
    const before = structuredClone(canvas)
    const result = applyTemplateAppearance(styleTemplate(), canvas,
      { background: false, frame: false, typography: true })
    expect(result.layers[0]).toEqual(before.layers[0])
    expect(result.layers[1]).toEqual(before.layers[1])
    expect(result.layers[2]).toEqual(before.layers[2])
    const oldGroup = before.layers[3]
    const newGroup = result.layers[3]
    if (newGroup.type !== 'group' || oldGroup.type !== 'group') throw new Error('group missing')
    const child = newGroup.children[0]
    const previousChild = oldGroup.children[0]
    if (child.type !== 'text' || previousChild.type !== 'text') throw new Error('text missing')
    expect(child.fontFamily).toBe('Georgia')
    expect(child.text).toBe(previousChild.text)
    expect(child.x).toBe(previousChild.x)
    expect(child.marks).toEqual(previousChild.marks)
  })

  it('supports frame-only styling, preserving all screenshot references and positions', () => {
    const canvas = original()
    const before = structuredClone(canvas)
    const result = applyTemplateAppearance(styleTemplate(), canvas,
      { background: false, frame: true, typography: false })
    expect(result.layers[0]).toEqual(before.layers[0])
    expect(result.layers[2]).toEqual(before.layers[2])
    expect(result.layers[3]).toEqual(before.layers[3])
    const next = result.layers[1]
    const previous = before.layers[1]
    if (next.type !== 'phone' || previous.type !== 'phone') throw new Error('phone missing')
    expect(next.screenshotPath).toBe(previous.screenshotPath)
    expect(next.localeContent).toEqual(previous.localeContent)
    expect(next.model).toBe(previous.model)
    expect(next.x).toBe(previous.x)
    expect(next.y).toBe(previous.y)
    expect(next.shadow).not.toEqual(previous.shadow)
  })

  it('rejects an empty style selection without mutating the canvas', () => {
    const canvas = original()
    const before = structuredClone(canvas)
    expect(() => applyTemplateAppearance(styleTemplate(), canvas,
      { background: false, frame: false, typography: false })).toThrow('Select at least one')
    expect(canvas).toEqual(before)
  })

  it('refuses panorama targets without changing data', () => {
    const pano = { ...original(), numSlides: 2 }
    expect(() => applyTemplateAppearance(styleTemplate(), pano)).toThrow('single-slide')
  })

  it('leaves the current background image intact', () => {
    const canvas = original()
    if (canvas.layers[0].type !== 'background') throw new Error('missing background')
    canvas.layers[0].imageDataUrl = 'data:image/png;base64,Zm9v'
    const result = applyTemplateAppearance(styleTemplate(), canvas)
    expect(result.layers[0].type === 'background' && result.layers[0].imageDataUrl)
      .toBe('data:image/png;base64,Zm9v')
  })
})
