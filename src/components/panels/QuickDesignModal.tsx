/**
 * [INPUT]: depends on react, SlideGroup type, useEditorStore, useAssetStore, QuickDesignPreview, screenshotAssets, quickDesign presets, and useStudioLocale from @/i18n
 * [OUTPUT]: exports QuickDesignModal guided single-canvas mockup dialog localized across EN/ZH/JA/KO
 * [POS]: guided mockup launcher modal invoked from Studio Toolbar inside src/components/panels
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
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
import { useStudioLocale } from '@/i18n'

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
  const { t } = useStudioLocale()
  const q = t.modals.quickDesign
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
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()
    return () => returnFocus?.focus()
  }, [])

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.getClientRects().length > 0)
    if (!focusable.length) {
      event.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
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
      <section ref={dialogRef} tabIndex={-1} onKeyDown={handleDialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="quick-design-title" aria-describedby="quick-design-description" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#18181f] p-6 text-[#f5f5f8] shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="quick-design-title" className="text-xl font-semibold">{q.title}</h2>
            <p id="quick-design-description" className="mt-1 text-sm text-[#aaaabc]">{q.description}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-[#aaaabc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9afff]" aria-label={q.closeAria}>×</button>
        </div>
        <div
          role="group"
          aria-label={q.step1}
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
          <div className="mb-2 font-semibold">{q.step1} <span className="font-normal text-white/50">{q.optional}</span></div>
          <div className="flex items-center gap-3">
            {previewUrl && <img src={previewUrl} alt={q.chooseScreenshot} className="h-16 w-24 shrink-0 rounded border border-white/10 bg-black/20 object-contain" />}
            <div className="min-w-0 flex-1">
              <label className="block cursor-pointer">
                <span className="inline-block rounded-md bg-[#8276e8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#9388ee]">
                  {imageFile ? q.changeScreenshot : q.chooseScreenshot}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only focus-visible:not-sr-only"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0])
                    event.currentTarget.value = ''
                  }} />
              </label>
              <p className="mt-2 text-xs text-[#a5a8bc]">{q.dropHint}</p>
              {imageFile && <p role="status" className="mt-1 truncate text-xs text-[#aee6d2]">{imageFile.name} · {(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
              {!imageFile && existingShot && <p className="mt-1 text-xs text-[#aee6d2]">{q.reuseCurrent}</p>}
            </div>
          </div>
          {uploadError && <p role="alert" className="mt-2 text-xs text-red-400">{uploadError}</p>}
        </div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">{q.step2}</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-xs text-[#aeb0c3]">{q.canvas}
            <select className={controlClass + ' mt-2'} value={size} onChange={(e) => { setSize(e.target.value as QuickSize); setCustom(false) }}>
              {Object.entries(QUICK_SIZES).map(([key, value]) => <option key={key} value={key}>{value.label} ({value.width}×{value.height})</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#aeb0c3]">{q.mockup}
            <select className={controlClass + ' mt-2'} value={mockup} onChange={(e) => setMockup(e.target.value as QuickMockup)}>
              {QUICK_MOCKUPS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-[#aeb0c3]">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> {q.useCustomDimensions}
        </label>
        {custom && <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs text-[#aeb0c3]">{q.width}<input className={controlClass + ' mt-1'} type="number" min={240} max={4096} value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} /></label>
          <label className="text-xs text-[#aeb0c3]">{q.height}<input className={controlClass + ' mt-1'} type="number" min={240} max={4096} value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} /></label>
        </div>}
        <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">{q.step3}</div>
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
          <legend className="text-xs font-semibold uppercase tracking-widest text-[#aeb0c3]">{q.screenshotFraming}</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ['cover', q.coverLabel, q.coverHint],
              ['contain', q.containLabel, q.containHint],
              ['fill', q.stretchLabel, q.stretchHint],
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
          <strong className="text-white">{q.noteHeading}</strong> {q.noteBody}
          <span className="mt-1 block text-[#9395aa]">{q.noteSub}</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm">{t.common.cancel}</button>
          <button type="button" onClick={() => { void apply() }} disabled={!activeGroup || applying} className="rounded-lg bg-[#8276e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#9388ee] disabled:opacity-50">{applying ? q.preparing : imageFile || existingShot ? q.applyEdit : q.startEmpty}</button>
        </div>
      </section>
    </div>
  )
}
