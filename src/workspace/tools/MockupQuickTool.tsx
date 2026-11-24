/**
 * [INPUT]: depends on react, getMockupCategory from @/assets/mockups/registry, DEFAULT_BROWSER_CHROME and isBrowserModel from @/assets/mockups/browser, QuickDesignPreview from @/components/panels/QuickDesignPreview, isHeicFile from @/tools, QUICK_MOCKUP_CATEGORIES/QUICK_MOCKUPS/QUICK_SIZES/QUICK_THEMES/getQuickMockupsByCategory from @/utils/quickDesign, trackFunnelEvent from @/utils/telemetry, canvasUtils from ../canvasUtils, draftStorage from ../draftStorage, ExifPrivacyBanner from ../ExifPrivacyBanner, i18n from ../i18n, renderRedactedImageDataUrl from ../redact, RedactOverlay/RedactToolbar from ../RedactOverlay, themeTokens from ../themeTokens, UI primitives from ../uiPrimitives, useToolDraft from ../useToolDraft, and workspace types from ../types
 * [OUTPUT]: exports MockupQuickTool component with 13-device 2-level selector, independent Browser Light/Dark chrome toggle, 3-second Blur/Pixelate/Spotlight redaction micro-toolbar, EXIF privacy banner, HEIC decoding progress, clipboard Copy loop, and non-destructive Studio handoff
 * [POS]: primary mockup tool panel inside src/workspace/tools; reuses QuickDesignPreview and quickDesign constants
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_BROWSER_CHROME, isBrowserModel } from '@/assets/mockups/browser'
import { getMockupCategory } from '@/assets/mockups/registry'
import { QuickDesignPreview } from '@/components/panels/QuickDesignPreview'
import { isHeicFile } from '@/tools'
import type { BrowserChromeOptions } from '@/types'
import {
  QUICK_MOCKUP_CATEGORIES,
  QUICK_MOCKUPS,
  QUICK_SIZES,
  QUICK_THEMES,
  getQuickMockupsByCategory,
  type MockupCategory,
  type QuickMockup,
  type QuickScreenshotFit,
  type QuickSize,
  type QuickTheme,
} from '@/utils/quickDesign'
import { trackFunnelEvent } from '@/utils/telemetry'
import {
  createDemoImageInput,
  readFileAsImageInput,
  renderMockupCanvasToPng,
  triggerBlobDownload,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { ExifPrivacyBanner } from '../ExifPrivacyBanner'
import { getWorkspaceStrings } from '../i18n'
import { renderRedactedImageDataUrl } from '../redact'
import { RedactOverlay, RedactToolbar, type RedactToolMode } from '../RedactOverlay'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type {
  WorkspaceImageInput,
  WorkspaceRedactionRegion,
  WorkspaceToolPanelProps,
} from '../types'
import {
  CopyImageButton,
  DraftStatusBar,
  DropZone,
  PreviewBusyOverlay,
  SegmentedControl,
  SliderField,
  StudioHandoffButton,
} from '../uiPrimitives'
import { useToolDraft } from '../useToolDraft'

interface MockupDraftSettings {
  mockup: QuickMockup
  sizeKey: QuickSize
  customWidth: number
  customHeight: number
  quickTheme: QuickTheme
  fit: QuickScreenshotFit
  scalePercent: number
  browserTitle: string
  browserAddress: string
  browserChromeMode: 'light' | 'dark'
}

const MIN_CANVAS_PX = 240
const MAX_CANVAS_PX = 4096

function resolveInitialMockup(model?: string): QuickMockup {
  const found = QUICK_MOCKUPS.find((item) => item.id === model)
  return found ? found.id : 'browser-chrome'
}

function resolveInitialSize(sizeKey?: string): QuickSize {
  if (sizeKey && sizeKey in QUICK_SIZES) {
    return sizeKey as QuickSize
  }
  return 'wide'
}

function clampCanvasPx(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(MIN_CANVAS_PX, Math.min(MAX_CANVAS_PX, Math.round(value)))
}

function CategoryIcon({ category }: { category: MockupCategory }): ReactNode {
  switch (category) {
    case 'browser':
      return (
        <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2" y="3" width="14" height="12" rx="2" />
          <path d="M2 6.5h14" />
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="5" y="2" width="8" height="14" rx="2" />
          <path d="M8 13.5h2" strokeLinecap="round" />
        </svg>
      )
    case 'tablet':
      return (
        <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3" y="2.5" width="12" height="13" rx="2" />
          <circle cx="9" cy="13.2" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'watch':
      return (
        <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="5" y="4.5" width="8" height="9" rx="2.5" />
          <path d="M7 4.5V2.5h4v2M7 13.5v2h4v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'screen':
      return (
        <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2.5" y="4" width="13" height="10" rx="1.5" strokeDasharray="2.5 1.8" />
        </svg>
      )
  }
}

export function MockupQuickTool({
  preset,
  locale,
  theme,
  onOpenInStudio,
  onOpenProModal,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const widthInputId = useId()
  const heightInputId = useId()
  const browserTitleId = useId()
  const browserUrlId = useId()

  const initialMockup = resolveInitialMockup(preset.mockupModel)
  const initialSize = resolveInitialSize(preset.canvasSize)

  const [mockup, setMockup] = useState<QuickMockup>(initialMockup)
  const [sizeKey, setSizeKey] = useState<QuickSize>(initialSize)
  const [customWidth, setCustomWidth] = useState<number>(QUICK_SIZES[initialSize].width)
  const [customHeight, setCustomHeight] = useState<number>(QUICK_SIZES[initialSize].height)
  const [widthDraft, setWidthDraft] = useState<string>(String(QUICK_SIZES[initialSize].width))
  const [heightDraft, setHeightDraft] = useState<string>(String(QUICK_SIZES[initialSize].height))
  const [quickTheme, setQuickTheme] = useState<QuickTheme>('aurora')
  const [fit, setFit] = useState<QuickScreenshotFit>('cover')
  const [scalePercent, setScalePercent] = useState<number>(100)
  const [browserTitle, setBrowserTitle] = useState<string>(DEFAULT_BROWSER_CHROME.title)
  const [browserAddress, setBrowserAddress] = useState<string>('https://moklu.app')
  const [browserChromeMode, setBrowserChromeMode] = useState<'light' | 'dark'>('light')
  const [screenshot, setScreenshot] = useState<WorkspaceImageInput | null>(() =>
    createDemoImageInput(initialMockup.startsWith('browser-') ? 'saas' : 'mobile', 'moklu-demo-screenshot.svg'),
  )
  const [heicDecoding, setHeicDecoding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Redact & Spotlight state (kept separate from raw screenshot.dataUrl for non-destructive handoff).
  const [redactMode, setRedactMode] = useState<RedactToolMode>(preset.enableRedact ? 'blur' : null)
  const [redactIntensity, setRedactIntensity] = useState<number>(14)
  const [spotlightZoom, setSpotlightZoom] = useState<boolean>(true)
  const [redactions, setRedactions] = useState<WorkspaceRedactionRegion[]>([])
  const [selectedRedactId, setSelectedRedactId] = useState<string | null>(null)
  const [redactedPreview, setRedactedPreview] = useState<{ sourceUrl: string; url: string } | null>(null)

  const activeCategory: MockupCategory = getMockupCategory(mockup)
  const categoryModels = useMemo(() => getQuickMockupsByCategory(activeCategory), [activeCategory])

  // Render live redacted preview Data URL whenever regions or screenshot change.
  useEffect(() => {
    const sourceUrl = screenshot?.dataUrl
    if (!sourceUrl || redactions.length === 0) return
    let cancelled = false
    void renderRedactedImageDataUrl(sourceUrl, redactions)
      .then((url) => {
        if (!cancelled) setRedactedPreview({ sourceUrl, url })
      })
      .catch(() => {
        if (!cancelled) setRedactedPreview(null)
      })
    return () => {
      cancelled = true
    }
  }, [screenshot?.dataUrl, redactions])

  const effectivePreviewSrc =
    redactions.length > 0 && redactedPreview && redactedPreview.sourceUrl === screenshot?.dataUrl
      ? redactedPreview.url
      : screenshot?.dataUrl

  const draftImages = useMemo(() => (screenshot ? [screenshot] : []), [screenshot])
  const draftSettings = useMemo<MockupDraftSettings>(
    () => ({
      mockup,
      sizeKey,
      customWidth,
      customHeight,
      quickTheme,
      fit,
      scalePercent,
      browserTitle,
      browserAddress,
      browserChromeMode,
    }),
    [mockup, sizeKey, customWidth, customHeight, quickTheme, fit, scalePercent, browserTitle, browserAddress, browserChromeMode],
  )

  const handleRestoreDraft = useCallback((draft: WorkspaceToolDraft<MockupDraftSettings>) => {
    const restored = deserializeDraftImages(draft.images)
    if (restored[0]) setScreenshot(restored[0])
    const cfg = draft.settings
    if (QUICK_MOCKUPS.some((m) => m.id === cfg.mockup)) setMockup(cfg.mockup)
    if (cfg.sizeKey && cfg.sizeKey in QUICK_SIZES) setSizeKey(cfg.sizeKey)
    if (typeof cfg.customWidth === 'number' && Number.isFinite(cfg.customWidth)) {
      const w = clampCanvasPx(cfg.customWidth, QUICK_SIZES[initialSize].width)
      setCustomWidth(w)
      setWidthDraft(String(w))
    }
    if (typeof cfg.customHeight === 'number' && Number.isFinite(cfg.customHeight)) {
      const h = clampCanvasPx(cfg.customHeight, QUICK_SIZES[initialSize].height)
      setCustomHeight(h)
      setHeightDraft(String(h))
    }
    if (cfg.quickTheme && cfg.quickTheme in QUICK_THEMES) setQuickTheme(cfg.quickTheme)
    if (cfg.fit === 'cover' || cfg.fit === 'contain' || cfg.fit === 'fill') setFit(cfg.fit)
    if (typeof cfg.scalePercent === 'number' && Number.isFinite(cfg.scalePercent)) {
      setScalePercent(Math.max(70, Math.min(115, Math.round(cfg.scalePercent))))
    }
    if (typeof cfg.browserTitle === 'string') setBrowserTitle(cfg.browserTitle)
    if (typeof cfg.browserAddress === 'string') setBrowserAddress(cfg.browserAddress)
    if (cfg.browserChromeMode === 'light' || cfg.browserChromeMode === 'dark') {
      setBrowserChromeMode(cfg.browserChromeMode)
    }
  }, [initialSize])

  const { hasDraft, clearDraft } = useToolDraft<MockupDraftSettings>({
    toolId: 'mockup',
    images: draftImages,
    settings: draftSettings,
    onRestore: handleRestoreDraft,
  })

  const handleClearDraft = () => {
    void clearDraft()
    const variant = initialMockup.startsWith('browser-') ? 'saas' : 'mobile'
    setScreenshot(createDemoImageInput(variant, 'moklu-demo-screenshot.svg'))
    setRedactions([])
    setSelectedRedactId(null)
  }

  const browserChrome = useMemo<BrowserChromeOptions | undefined>(() => {
    if (!isBrowserModel(mockup)) return undefined
    return {
      title: browserTitle || DEFAULT_BROWSER_CHROME.title,
      address: browserAddress || DEFAULT_BROWSER_CHROME.address,
      theme: browserChromeMode,
      showAddressBar: true,
    }
  }, [mockup, browserTitle, browserAddress, browserChromeMode])

  const handleCategorySelect = (category: MockupCategory) => {
    const models = getQuickMockupsByCategory(category)
    if (models.length > 0 && getMockupCategory(mockup) !== category) {
      setMockup(models[0].id)
    }
  }

  const handleSizeSelect = (next: QuickSize) => {
    const nextW = QUICK_SIZES[next].width
    const nextH = QUICK_SIZES[next].height
    setSizeKey(next)
    setCustomWidth(nextW)
    setCustomHeight(nextH)
    setWidthDraft(String(nextW))
    setHeightDraft(String(nextH))
  }

  const handleWidthInputChange = (raw: string) => {
    setWidthDraft(raw)
    if (raw.trim() === '') return
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= MIN_CANVAS_PX && parsed <= MAX_CANVAS_PX) {
      setCustomWidth(Math.round(parsed))
    }
  }

  const handleWidthBlur = () => {
    const parsed = widthDraft.trim() === '' ? Number.NaN : Number(widthDraft)
    const committed = clampCanvasPx(parsed, customWidth)
    setCustomWidth(committed)
    setWidthDraft(String(committed))
  }

  const handleHeightInputChange = (raw: string) => {
    setHeightDraft(raw)
    if (raw.trim() === '') return
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= MIN_CANVAS_PX && parsed <= MAX_CANVAS_PX) {
      setCustomHeight(Math.round(parsed))
    }
  }

  const handleHeightBlur = () => {
    const parsed = heightDraft.trim() === '' ? Number.NaN : Number(heightDraft)
    const committed = clampCanvasPx(parsed, customHeight)
    setCustomHeight(committed)
    setHeightDraft(String(committed))
  }

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setExportError(null)
    const heic = isHeicFile(file)
    if (heic) setHeicDecoding(true)
    try {
      const loaded = await readFileAsImageInput(file, 'screenshot.png', {
        onHeicStage: (stage) => {
          setHeicDecoding(stage !== 'done')
        },
      })
      setScreenshot(loaded)
      setRedactions([])
      setSelectedRedactId(null)
    } catch {
      setExportError(s.common.decodeError)
    } finally {
      setHeicDecoding(false)
    }
  }, [s.common.decodeError])

  const handleLoadDemo = () => {
    setExportError(null)
    const variant = mockup.startsWith('browser-') ? 'saas' : 'mobile'
    setScreenshot(createDemoImageInput(variant, `moklu-demo-${variant}.svg`))
    setRedactions([])
    setSelectedRedactId(null)
  }

  const renderCurrentPng = useCallback(
    () =>
      renderMockupCanvasToPng({
        width: customWidth,
        height: customHeight,
        theme: quickTheme,
        mockup,
        screenshotSrc: screenshot?.dataUrl,
        screenshotFit: fit,
        scaleFactor: scalePercent / 100,
        browserChrome,
        redactions,
      }),
    [customWidth, customHeight, quickTheme, mockup, screenshot?.dataUrl, fit, scalePercent, browserChrome, redactions],
  )

  const handleDownloadPng = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const output = await renderCurrentPng()
      triggerBlobDownload(output.blob, output.filename)
      trackFunnelEvent('export_completed', { tool: 'mockup', model: mockup, redacted: redactions.length > 0 })
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : s.common.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const getCopyTarget = useCallback(async () => {
    const output = await renderCurrentPng()
    return { blob: output.blob, previewDataUrl: output.dataUrl }
  }, [renderCurrentPng])

  const handleOpenInStudio = () => {
    const target = screenshot ?? createDemoImageInput('saas', 'moklu-demo.svg')
    onOpenInStudio({
      images: [
        {
          dataUrl: target.dataUrl,
          name: target.name,
          width: target.width,
          height: target.height,
        },
      ],
      mode: 'mockup',
      mockupModel: mockup,
      slideWidth: customWidth,
      slideHeight: customHeight,
      theme: quickTheme,
      screenshotFit: fit,
      scaleFactor: scalePercent / 100,
      browserChrome,
      ...(redactions.length > 0 ? { redactions } : {}),
    })
  }

  const handleIntensityChange = (next: number) => {
    setRedactIntensity(next)
    if (selectedRedactId) {
      setRedactions((prev) =>
        prev.map((r) => (r.id === selectedRedactId && r.kind !== 'spotlight' ? { ...r, intensity: next } : r)),
      )
    }
  }

  const handleSpotlightZoomChange = (zoomed: boolean) => {
    setSpotlightZoom(zoomed)
    if (selectedRedactId) {
      setRedactions((prev) =>
        prev.map((r) => (r.id === selectedRedactId && r.kind === 'spotlight' ? { ...r, intensity: zoomed ? 1.25 : 1 } : r)),
      )
    }
  }

  const handleDeleteSelectedRedact = () => {
    if (!selectedRedactId) return
    setRedactions((prev) => prev.filter((r) => r.id !== selectedRedactId))
    setSelectedRedactId(null)
  }

  const handleClearRedactions = () => {
    setRedactions([])
    setSelectedRedactId(null)
  }

  const isBusy = isExporting || isCopying

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Live Mockup Stage + Redact Micro-Toolbar */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-3.5 sm:p-4 ${tokens.stage}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${tokens.textMuted}`}>
                {s.common.preview}
              </span>
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tokens.card} ${tokens.textSubtle}`}>
                {customWidth} × {customHeight}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              className={`min-h-8 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonSecondary}`}
            >
              {s.common.tryDemo}
            </button>
          </div>

          {/* 3-Second Redact / Pixelate / Spotlight Micro-Toolbar */}
          <RedactToolbar
            theme={theme}
            locale={locale}
            activeMode={redactMode}
            intensity={redactIntensity}
            spotlightZoom={spotlightZoom}
            regions={redactions}
            selectedId={selectedRedactId}
            onModeChange={setRedactMode}
            onIntensityChange={handleIntensityChange}
            onSpotlightZoomChange={handleSpotlightZoomChange}
            onDeleteSelected={handleDeleteSelectedRedact}
            onClearAll={handleClearRedactions}
          />

          <div aria-busy={isBusy} className="relative rounded-xl bg-zinc-950 p-1">
            {isBusy && <PreviewBusyOverlay theme="dark" label={s.common.downloading} />}
            <QuickDesignPreview
              variant="workspace"
              width={customWidth}
              height={customHeight}
              theme={quickTheme}
              mockup={mockup}
              screenshotSrc={effectivePreviewSrc}
              screenshotFit={fit}
              scaleFactor={scalePercent / 100}
              browserChrome={browserChrome}
            />
            {screenshot && (
              <RedactOverlay
                canvasWidth={customWidth}
                canvasHeight={customHeight}
                mockup={mockup}
                scaleFactor={scalePercent / 100}
                screenshotWidth={screenshot.width}
                screenshotHeight={screenshot.height}
                screenshotFit={fit}
                activeMode={redactMode}
                intensity={redactIntensity}
                spotlightZoom={spotlightZoom}
                regions={redactions}
                selectedId={selectedRedactId}
                onSelect={setSelectedRedactId}
                onChangeRegions={setRedactions}
              />
            )}
          </div>

          <div className="mt-4">
            <DropZone
              theme={theme}
              compact
              title={s.common.dropTitle}
              hint={screenshot ? `${screenshot.name} (${screenshot.width}×${screenshot.height})` : s.common.dropHint}
              buttonLabel={s.mockup.replaceScreenshot}
              invalidFileMessage={s.common.invalidFileError}
              decodingLabel={heicDecoding ? s.common.heicDecoding : null}
              onFiles={handleFiles}
            />
          </div>

          <ExifPrivacyBanner theme={theme} locale={locale} images={draftImages} className="mt-3" />

          {hasDraft && (
            <DraftStatusBar
              theme={theme}
              toolId="mockup"
              savedLabel={s.common.draftSaved}
              clearLabel={s.common.clearDraft}
              onClear={handleClearDraft}
            />
          )}
        </div>
      </div>

      {/* Right: Controls & Instant Actions */}
      <div className={`@container flex flex-col justify-between gap-5 rounded-2xl border p-4 sm:p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          {/* 2-Level 13-Device Selector: Level 1 Categories + Level 2 Model Pills */}
          <div className="space-y-2" data-testid="mockup-device-selector">
            <span className={`block text-xs font-semibold ${tokens.textMuted}`}>{s.mockup.deviceLabel}</span>
            <div role="tablist" aria-label={s.mockup.deviceLabel} className="flex flex-wrap gap-1.5">
              {QUICK_MOCKUP_CATEGORIES.map((category) => {
                const selected = category === activeCategory
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={`mockup-category-${category}`}
                    onClick={() => handleCategorySelect(category)}
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.focusRing} ${
                      selected ? tokens.pillActive : tokens.pillIdle
                    }`}
                  >
                    <CategoryIcon category={category} />
                    <span>{s.mockup.categories[category]}</span>
                  </button>
                )
              })}
            </div>
            <div
              role="radiogroup"
              aria-label={s.mockup.categories[activeCategory]}
              data-testid="mockup-model-pills"
              className="flex flex-wrap gap-1.5"
            >
              {categoryModels.map((item) => {
                const active = item.id === mockup
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    data-testid={`mockup-model-${item.id}`}
                    onClick={() => setMockup(item.id)}
                    className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${tokens.focusRing} ${
                      active ? tokens.pillActive : tokens.pillIdle
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <SegmentedControl
            theme={theme}
            label={s.mockup.canvasLabel}
            value={sizeKey}
            options={(Object.keys(QUICK_SIZES) as QuickSize[]).map((key) => ({
              value: key,
              label: QUICK_SIZES[key].label,
            }))}
            onChange={handleSizeSelect}
          />

          <div>
            <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{s.mockup.customSize}</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={widthInputId} className="sr-only">{s.mockup.canvasWidthLabel}</label>
                <input
                  id={widthInputId}
                  type="number"
                  min={MIN_CANVAS_PX}
                  max={MAX_CANVAS_PX}
                  value={widthDraft}
                  onChange={(e) => handleWidthInputChange(e.target.value)}
                  onBlur={handleWidthBlur}
                  className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                />
              </div>
              <div>
                <label htmlFor={heightInputId} className="sr-only">{s.mockup.canvasHeightLabel}</label>
                <input
                  id={heightInputId}
                  type="number"
                  min={MIN_CANVAS_PX}
                  max={MAX_CANVAS_PX}
                  value={heightDraft}
                  onChange={(e) => handleHeightInputChange(e.target.value)}
                  onBlur={handleHeightBlur}
                  className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
                />
              </div>
            </div>
          </div>

          <div>
            <span className={`mb-1.5 block text-xs font-semibold ${tokens.textMuted}`}>{s.mockup.themeLabel}</span>
            <div className="grid grid-cols-1 gap-2 @[290px]:grid-cols-3">
              {(Object.keys(QUICK_THEMES) as QuickTheme[]).map((key) => {
                const palette = QUICK_THEMES[key]
                const active = key === quickTheme
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setQuickTheme(key)}
                    className={`flex min-h-9 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-colors ${tokens.focusRing} ${
                      active ? tokens.pillActive : tokens.pillIdle
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                      style={{ background: `linear-gradient(135deg, ${palette.top}, ${palette.bottom})` }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{s.mockup.themes[key]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <SegmentedControl
            theme={theme}
            label={s.mockup.fitLabel}
            value={fit}
            options={[
              { value: 'cover', label: s.mockup.fitCover },
              { value: 'contain', label: s.mockup.fitContain },
              { value: 'fill', label: s.mockup.fitFill },
            ]}
            onChange={setFit}
          />

          <SliderField
            theme={theme}
            label={s.mockup.paddingLabel}
            value={scalePercent}
            min={70}
            max={115}
            unit="%"
            onChange={setScalePercent}
          />

          {isBrowserModel(mockup) && (
            <div className="space-y-3" data-testid="browser-chrome-controls">
              <SegmentedControl
                theme={theme}
                label={s.mockup.browserThemeLabel}
                value={browserChromeMode}
                options={[
                  { value: 'light', label: s.mockup.browserThemeLight },
                  { value: 'dark', label: s.mockup.browserThemeDark },
                ]}
                onChange={setBrowserChromeMode}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor={browserTitleId} className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                    {s.mockup.browserTitle}
                  </label>
                  <input
                    id={browserTitleId}
                    type="text"
                    value={browserTitle}
                    onChange={(e) => setBrowserTitle(e.target.value)}
                    className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${tokens.input}`}
                  />
                </div>
                <div>
                  <label htmlFor={browserUrlId} className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                    {s.mockup.browserUrl}
                  </label>
                  <input
                    id={browserUrlId}
                    type="text"
                    value={browserAddress}
                    onChange={(e) => setBrowserAddress(e.target.value)}
                    className={`min-h-8 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${tokens.input}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Loop: Download + Copy Image + Trust Subtext + Studio + Ghost Pro */}
        <div className="space-y-2.5 border-t pt-4 border-current/10">
          {exportError && (
            <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
              {exportError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDownloadPng}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {isExporting ? s.common.downloading : s.common.downloadPng}
            </button>
            <CopyImageButton
              theme={theme}
              tool="mockup"
              testId="mockup-copy-image"
              label={s.common.copyImage}
              copiedLabel={s.common.copiedToChat}
              copyErrorMessage={s.common.copyError}
              disabled={isExporting}
              getImage={getCopyTarget}
              onError={setExportError}
              onBusyChange={setIsCopying}
            />
          </div>
          <p data-testid="mockup-export-trust" className={`text-center text-[11px] font-medium ${tokens.textSubtle}`}>
            {s.common.exportTrustNote}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <StudioHandoffButton theme={theme} label={s.common.openInStudio} onClick={handleOpenInStudio} />
            {onOpenProModal && (
              <button
                type="button"
                data-testid="mockup-pro-cta"
                onClick={onOpenProModal}
                className={`flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-transparent px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface ${tokens.focusRing} ${tokens.textMuted}`}
              >
                <span aria-hidden="true">✦</span>
                <span>{s.common.proBatchCta}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
