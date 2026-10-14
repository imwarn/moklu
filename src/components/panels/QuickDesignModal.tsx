import { useState } from 'react'
import type { SlideGroup } from '@/types'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { prepareScreenshotUpload } from '@/utils/screenshotAssets'
import {
  getQuickMockupPlacement, makeQuickLayers, QUICK_MOCKUPS, QUICK_SIZES, QUICK_THEMES,
  type QuickMockup, type QuickSize, type QuickTheme,
} from '@/utils/quickDesign'

interface QuickDesignModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Shots.so-style single-canvas flow on top of the original PixelDeck editor.
 * Templates are real layers, so the result remains editable in Advanced mode.
 */
export function QuickDesignModal({ open, onClose }: QuickDesignModalProps) {
  const project = useEditorStore((s) => s.project)
  const activeGroupId = useEditorStore((s) => s.activeSlideGroupId)
  const activeGroup = project.slideGroups.find((group) => group.id === activeGroupId)
  if (!open) return null
  return <QuickDesignDialog key={activeGroup?.id ?? 'none'} activeGroup={activeGroup} onClose={onClose} />
}

function QuickDesignDialog({ activeGroup, onClose }: { activeGroup: SlideGroup | undefined; onClose: () => void }) {
  // Reopening Quick Design starts from the actual canvas rather than silently
  // reverting an existing Moklu design to the original 16:9 default.
  const hasQuickCanvas = activeGroup?.name === 'Moklu Canvas'
  const matchingSize = hasQuickCanvas
    ? (Object.entries(QUICK_SIZES).find(([, dims]) =>
        dims.width === activeGroup?.slideWidth && dims.height === activeGroup?.slideHeight)?.[0] as QuickSize | undefined)
    : undefined
  const [size, setSize] = useState<QuickSize>(matchingSize ?? 'wide')
  const [custom, setCustom] = useState(Boolean(hasQuickCanvas && !matchingSize))
  const [customWidth, setCustomWidth] = useState(String(hasQuickCanvas ? activeGroup?.slideWidth : 1600))
  const [customHeight, setCustomHeight] = useState(String(hasQuickCanvas ? activeGroup?.slideHeight : 900))
  const currentMockup = activeGroup?.layers.find((layer) => layer.type === 'phone')
  const initialMockup = QUICK_MOCKUPS.find((item) => item.id === (currentMockup?.type === 'phone' ? currentMockup.model : undefined))
  const [mockup, setMockup] = useState<QuickMockup>(initialMockup?.id ?? 'browser-chrome')
  const currentBackground = activeGroup?.layers.find((layer) => layer.type === 'background')
  const backgroundFill = currentBackground?.type === 'background' ? currentBackground.fill : null
  const initialTheme = backgroundFill && typeof backgroundFill !== 'string' && backgroundFill.type === 'linear'
    ? (Object.keys(QUICK_THEMES).find((key) =>
        QUICK_THEMES[key as QuickTheme].top === backgroundFill.stops[0]?.color) as QuickTheme | undefined)
    : undefined
  const [theme, setTheme] = useState<QuickTheme>(initialTheme ?? 'aurora')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const apply = async () => {
    if (!activeGroup) return
    const { updateSlideGroup, setActiveCanvasFormat, select } = useEditorStore.getState()
    const width = custom ? Number(customWidth) : QUICK_SIZES[size].width
    const height = custom ? Number(customHeight) : QUICK_SIZES[size].height
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 240 || height < 240 || width > 4096 || height > 4096 || width * height > 16_777_216) {
      window.alert('Canvas width and height must each be whole numbers from 240 to 4096, with a 16MP maximum.')
      return
    }
    const additionalLayers = activeGroup.layers.filter((layer) => layer.type !== 'background' && layer.type !== 'phone')
    if (additionalLayers.length > 0 && !window.confirm(
      `Apply a new Quick Design? This replaces ${additionalLayers.length} additional layer(s). For only changing the canvas ratio, choose Canvas Size instead.`,
    )) return
    const layers = makeQuickLayers(activeGroup.layers, size, theme, mockup)
    if (custom) {
      const layer = layers[1]
      if (layer.type === 'phone') Object.assign(layer, getQuickMockupPlacement(mockup, width, height))
      const sx = width / QUICK_SIZES[size].width
      const sy = height / QUICK_SIZES[size].height
      const background = layers[0]
      if (background.type === 'background') {
        background.accents = background.accents.map((accent) => ({
          ...accent, rx: accent.rx * sx, ry: accent.ry * sy,
        }))
      }
    }
    if (imageFile) {
      if (!imageFile.type.startsWith('image/') || imageFile.size > 25 * 1024 * 1024) {
        setUploadError('Choose a supported image smaller than 25 MB.')
        return
      }
      setApplying(true)
      try {
        const { key, dataUrl } = await prepareScreenshotUpload(imageFile)
        useAssetStore.getState().addAsset(key, dataUrl)
        const layer = layers[1]
        if (layer.type === 'phone') {
          layer.screenshotPath = key
          layer.screenshotDataUrl = dataUrl
        }
        setUploadError(null)
      } catch {
        setUploadError('Unable to read the selected image.')
        setApplying(false)
        return
      }
    }
    updateSlideGroup(activeGroup.id, {
      name: 'Moklu Canvas',
      numSlides: 1,
      slideNames: ['moklu'],
      slideWidth: width,
      slideHeight: height,
      formats: undefined,
      layers,
    })
    setActiveCanvasFormat('base')
    select(layers[1].id)
    setApplying(false)
    setImageFile(null)
    onClose()
  }

  const controlClass = 'w-full rounded-lg border border-white/15 bg-[#222330] px-3 py-2 text-sm text-white'
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="quick-design-title" className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#18181f] p-6 text-[#f5f5f8] shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="quick-design-title" className="text-xl font-semibold">Quick Design</h2>
            <p className="mt-1 text-sm text-[#aaaabc]">Upload → choose frame & style → apply → export.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-[#aaaabc]" aria-label="Close quick design">×</button>
        </div>
        <label className="mb-5 block rounded-xl border border-dashed border-white/20 bg-white/[0.035] p-4 text-sm text-white/90">
          <span className="mb-2 block font-semibold">1. Upload your screenshot <span className="font-normal text-white/50">(optional)</span></span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full cursor-pointer text-xs text-[#b7bad3] file:mr-3 file:rounded-md file:border-0 file:bg-[#8276e8] file:px-3 file:py-1.5 file:text-white" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setUploadError(null) }} />
          {imageFile && <span className="mt-2 block truncate text-xs text-[#aee6d2]">{imageFile.name}</span>}
          {uploadError && <span role="alert" className="mt-2 block text-xs text-red-400">{uploadError}</span>}
          <span className="mt-2 block text-xs text-white/50">Or upload later using the mockup layer properties. Existing screenshots stay when changing presets.</span>
        </label>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">2. Choose canvas and mockup</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-xs text-[#aeb0c3]">Canvas
            <select className={controlClass + ' mt-2'} value={size} onChange={(e) => { setSize(e.target.value as QuickSize); setCustom(false) }}>
              {Object.entries(QUICK_SIZES).map(([key, value]) => <option key={key} value={key}>{value.label} ({value.width}×{value.height})</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#aeb0c3]">Mockup
            <select className={controlClass + ' mt-2'} value={mockup} onChange={(e) => setMockup(e.target.value as QuickMockup)}>
              {QUICK_MOCKUPS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-[#aeb0c3]">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Use custom canvas dimensions
        </label>
        {custom && <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs text-[#aeb0c3]">Width<input className={controlClass + ' mt-1'} type="number" min={240} max={4096} value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} /></label>
          <label className="text-xs text-[#aeb0c3]">Height<input className={controlClass + ' mt-1'} type="number" min={240} max={4096} value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} /></label>
        </div>}
        <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">3. Choose a style</div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(Object.entries(QUICK_THEMES) as [QuickTheme, (typeof QUICK_THEMES)[QuickTheme]][]).map(([id, value]) =>
            <button type="button" key={id} aria-pressed={theme === id} onClick={() => setTheme(id)}
              className={`rounded-xl border p-2 text-left transition-colors ${theme === id ? 'border-[#b49eff] bg-[#b49eff]/10' : 'border-white/10 hover:border-white/30'}`}>
              <span className="block h-14 rounded-lg" style={{ background: `linear-gradient(140deg, ${value.top}, ${value.bottom})` }} />
              <span className="mt-2 block text-xs">{value.label}</span>
            </button>
          )}
        </div>
        <div role="note" className="mt-5 rounded-lg border border-[#8276e8]/25 bg-[#8276e8]/10 p-3 text-xs leading-5 text-[#bdbbd7]">
          <strong className="text-white">Want a different ratio after applying?</strong> Use <strong className="text-[#d6d1ff]">Canvas Size</strong> in the toolbar to resize without replacing your screenshot, text or layers.
          <span className="mt-1 block text-[#9395aa]">Quick Design reapplies a style and replaces the current slide layout. Existing screenshots remain attached; other slides are untouched.</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={() => { void apply() }} disabled={!activeGroup || applying} className="rounded-lg bg-[#8276e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#9388ee] disabled:opacity-50">{applying ? 'Preparing…' : 'Apply Design'}</button>
        </div>
      </section>
    </div>
  )
}
