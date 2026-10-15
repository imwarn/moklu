import { useEffect, useRef, useState } from 'react'
import type { SlideGroup } from '@/types'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import { QuickDesignPreview } from '@/components/panels/QuickDesignPreview'
import { prepareScreenshotUpload, validateScreenshotFile } from '@/utils/screenshotAssets'
import {
  getQuickMockupPlacement, makeQuickLayers, QUICK_MOCKUPS, QUICK_SIZES, QUICK_THEMES,
  type QuickMockup, type QuickSize, type QuickTheme, type QuickScreenshotFit,
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
  const [screenshotFit, setScreenshotFit] = useState<QuickScreenshotFit>(
    currentMockup?.type === 'phone' ? (currentMockup.screenshotFit ?? 'cover') : 'cover',
  )
  const currentBackground = activeGroup?.layers.find((layer) => layer.type === 'background')
  const backgroundFill = currentBackground?.type === 'background' ? currentBackground.fill : null
  const initialTheme = backgroundFill && typeof backgroundFill !== 'string' && backgroundFill.type === 'linear'
    ? (Object.keys(QUICK_THEMES).find((key) =>
        QUICK_THEMES[key as QuickTheme].top === backgroundFill.stops[0]?.color) as QuickTheme | undefined)
    : undefined
  const [theme, setTheme] = useState<QuickTheme>(initialTheme ?? 'aurora')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const existingShot = currentMockup?.type === 'phone' && Boolean(
    currentMockup.screenshotPath || currentMockup.screenshotDataUrl,
  )

  useEffect(() => () => {
    // Never leak object URLs when users reopen this dialog repeatedly.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const chooseFile = (file: File | undefined) => {
    if (!file) return
    const validation = validateScreenshotFile(file)
    if (validation) {
      setUploadError(validation)
      return
    }
    const url = URL.createObjectURL(file)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setImageFile(file)
    setUploadError(null)
  }
  const screenshotAssets = useAssetStore((s) => s.assets)
  const existingSrc = currentMockup?.type === 'phone'
    ? (currentMockup.screenshotPath ? screenshotAssets[currentMockup.screenshotPath]?.dataUrl : undefined)
      ?? currentMockup.screenshotDataUrl
    : undefined
  const screenshotSrc = previewUrl ?? existingSrc
  const activeWidth = custom ? Number(customWidth) : QUICK_SIZES[size].width
  const activeHeight = custom ? Number(customHeight) : QUICK_SIZES[size].height
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
    const layers = makeQuickLayers(activeGroup.layers, size, theme, mockup, screenshotFit)
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
      const validation = validateScreenshotFile(imageFile)
      if (validation) {
        setUploadError(validation)
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
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Unable to read the selected image.')
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
      <section role="dialog" aria-modal="true" aria-labelledby="quick-design-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#18181f] p-6 text-[#f5f5f8] shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="quick-design-title" className="text-xl font-semibold">Quick Design</h2>
            <p className="mt-1 text-sm text-[#aaaabc]">Upload → choose frame & style → apply → export.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-[#aaaabc]" aria-label="Close quick design">×</button>
        </div>
        <div
          role="group"
          aria-label="Add screenshot"
          onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setDragActive(false)
            chooseFile(event.dataTransfer.files?.[0])
          }}
          className={`mb-5 rounded-xl border border-dashed p-4 text-sm text-white/90 transition-colors ${dragActive
            ? 'border-[#b9afff] bg-[#8276e8]/15'
            : 'border-white/20 bg-white/[0.035]'}`}
        >
          <div className="mb-2 font-semibold">1. Start with a screenshot <span className="font-normal text-white/50">(optional)</span></div>
          <div className="flex items-center gap-3">
            {previewUrl && <img src={previewUrl} alt="Screenshot selected for your design" className="h-16 w-24 shrink-0 rounded border border-white/10 bg-black/20 object-contain" />}
            <div className="min-w-0 flex-1">
              <label className="block cursor-pointer">
                <span className="inline-block rounded-md bg-[#8276e8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#9388ee]">
                  {imageFile ? 'Change screenshot' : 'Choose screenshot'}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0])
                    event.currentTarget.value = ''
                  }} />
              </label>
              <p className="mt-2 text-xs text-[#a5a8bc]">Or drop a PNG, JPEG or WebP image here · 25 MB maximum</p>
              {imageFile && <p role="status" className="mt-1 truncate text-xs text-[#aee6d2]">{imageFile.name} · {(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
              {!imageFile && existingShot && <p className="mt-1 text-xs text-[#aee6d2]">Your current screenshot will be reused.</p>}
            </div>
          </div>
          {uploadError && <p role="alert" className="mt-2 text-xs text-red-400">{uploadError}</p>}
        </div>
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
        <fieldset className="mt-5">
          <legend className="text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">Screenshot framing</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ['cover', 'Cover', 'Fill screen; crop edges'],
              ['contain', 'Contain', 'Keep full screenshot'],
              ['fill', 'Stretch', 'Fill without cropping'],
            ] as const).map(([value, label, hint]) => (
              <label key={value} className={`cursor-pointer rounded-lg border px-2 py-2.5 text-center text-xs ${screenshotFit === value
                ? 'border-[#b49eff] bg-[#b49eff]/10 text-white'
                : 'border-white/10 text-[#aeb0c3] hover:border-white/30'}`}>
                <input type="radio" name="quick-screenshot-fit" className="sr-only"
                  value={value} checked={screenshotFit === value}
                  onChange={() => setScreenshotFit(value)} />
                <strong className="block text-xs">{label}</strong>
                <span className="mt-1 block text-[10px] leading-4">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <QuickDesignPreview
          width={activeWidth} height={activeHeight}
          theme={theme} mockup={mockup} screenshotSrc={screenshotSrc} screenshotFit={screenshotFit}
          browserChrome={currentMockup?.type === 'phone' ? currentMockup.browserChrome : undefined}
        />
        <div role="note" className="mt-5 rounded-lg border border-[#8276e8]/25 bg-[#8276e8]/10 p-3 text-xs leading-5 text-[#bdbbd7]">
          <strong className="text-white">Want a different ratio after applying?</strong> Use <strong className="text-[#d6d1ff]">Canvas Size</strong> in the toolbar to resize without replacing your screenshot, text or layers.
          <span className="mt-1 block text-[#9395aa]">Quick Design reapplies a style and replaces the current slide layout. Existing screenshots remain attached; other slides are untouched.</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={() => { void apply() }} disabled={!activeGroup || applying} className="rounded-lg bg-[#8276e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#9388ee] disabled:opacity-50">{applying ? 'Preparing…' : imageFile || existingShot ? 'Apply & Edit Design' : 'Start with Empty Mockup'}</button>
        </div>
      </section>
    </div>
  )
}
