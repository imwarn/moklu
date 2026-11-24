/**
 * [INPUT]: depends on react, QuickDesignPreview from @/components/panels/QuickDesignPreview, QUICK_MOCKUPS/QUICK_SIZES/QUICK_THEMES from @/utils/quickDesign, browser chrome defaults from @/assets/mockups/browser, canvas utilities from ../canvasUtils, draftStorage from ../draftStorage, useToolDraft from ../useToolDraft, UI primitives from ../uiPrimitives, theme tokens from ../themeTokens, and strings from ../i18n
 * [OUTPUT]: exports MockupQuickTool component for instant above-the-fold screenshot beautification, local IndexedDB draft auto-save (excluding built-in demos), and full-style Studio handoff
 * [POS]: primary mockup tool panel inside src/workspace/tools; reuses QuickDesignPreview and quickDesign constants
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useId, useMemo, useState } from 'react'
import { DEFAULT_BROWSER_CHROME, isBrowserModel } from '@/assets/mockups/browser'
import { QuickDesignPreview } from '@/components/panels/QuickDesignPreview'
import type { BrowserChromeOptions } from '@/types'
import {
  QUICK_MOCKUPS,
  QUICK_SIZES,
  QUICK_THEMES,
  type QuickMockup,
  type QuickScreenshotFit,
  type QuickSize,
  type QuickTheme,
} from '@/utils/quickDesign'
import {
  createDemoImageInput,
  readFileAsImageInput,
  renderMockupCanvasToPng,
  triggerBlobDownload,
} from '../canvasUtils'
import { deserializeDraftImages, type WorkspaceToolDraft } from '../draftStorage'
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type { WorkspaceImageInput, WorkspaceToolPanelProps } from '../types'
import {
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
  const [screenshot, setScreenshot] = useState<WorkspaceImageInput | null>(() =>
    createDemoImageInput(initialMockup.startsWith('browser-') ? 'saas' : 'mobile', 'moklu-demo-screenshot.svg'),
  )
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    }),
    [mockup, sizeKey, customWidth, customHeight, quickTheme, fit, scalePercent, browserTitle, browserAddress],
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
  }

  const browserChrome = useMemo<BrowserChromeOptions | undefined>(() => {
    if (!isBrowserModel(mockup)) return undefined
    return {
      title: browserTitle || DEFAULT_BROWSER_CHROME.title,
      address: browserAddress || DEFAULT_BROWSER_CHROME.address,
      theme: quickTheme === 'midnight' ? 'dark' : 'light',
      showAddressBar: true,
    }
  }, [mockup, browserTitle, browserAddress, quickTheme])

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
    try {
      const loaded = await readFileAsImageInput(file)
      setScreenshot(loaded)
    } catch {
      setExportError(s.common.decodeError)
    }
  }, [s.common.decodeError])

  const handleLoadDemo = () => {
    setExportError(null)
    const variant = mockup.startsWith('browser-') ? 'saas' : 'mobile'
    setScreenshot(createDemoImageInput(variant, `moklu-demo-${variant}.svg`))
  }

  const handleDownloadPng = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const output = await renderMockupCanvasToPng({
        width: customWidth,
        height: customHeight,
        theme: quickTheme,
        mockup,
        screenshotSrc: screenshot?.dataUrl,
        screenshotFit: fit,
        scaleFactor: scalePercent / 100,
        browserChrome,
      })
      triggerBlobDownload(output.blob, output.filename)
    } catch (err) {
      setExportError(err instanceof Error && err.message ? err.message : s.common.exportError)
    } finally {
      setIsExporting(false)
    }
  }

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
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Live Mockup Stage */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className={`rounded-2xl border p-4 ${tokens.stage}`}>
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

          <div aria-busy={isExporting} className="relative rounded-xl bg-zinc-950 p-1">
            {isExporting && <PreviewBusyOverlay theme="dark" label={s.common.downloading} />}
            <QuickDesignPreview
              width={customWidth}
              height={customHeight}
              theme={quickTheme}
              mockup={mockup}
              screenshotSrc={screenshot?.dataUrl}
              screenshotFit={fit}
              scaleFactor={scalePercent / 100}
              browserChrome={browserChrome}
            />
          </div>

          <div className="mt-4">
            <DropZone
              theme={theme}
              compact
              title={s.common.dropTitle}
              hint={screenshot ? `${screenshot.name} (${screenshot.width}×${screenshot.height})` : s.common.dropHint}
              buttonLabel={s.mockup.replaceScreenshot}
              invalidFileMessage={s.common.invalidFileError}
              onFiles={handleFiles}
            />
          </div>

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
      <div className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:col-span-5 ${tokens.card}`}>
        <div className="space-y-4">
          <SegmentedControl
            theme={theme}
            label={s.mockup.deviceLabel}
            value={mockup}
            options={QUICK_MOCKUPS.map((item) => ({ value: item.id, label: item.label }))}
            onChange={(next) => setMockup(next)}
          />

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
                <label htmlFor={widthInputId} className="sr-only">
                  {s.mockup.canvasWidthLabel}
                </label>
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
                <label htmlFor={heightInputId} className="sr-only">
                  {s.mockup.canvasHeightLabel}
                </label>
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
            <div className="grid grid-cols-3 gap-2">
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
            onChange={(next) => setFit(next)}
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
          )}
        </div>

        <div className="space-y-2.5 border-t pt-4 border-current/10">
          {exportError && (
            <p role="alert" className={`text-xs font-medium ${tokens.errorText}`}>
              {exportError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPng}
              className={`inline-flex min-h-9 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.focusRing} ${tokens.buttonPrimary}`}
            >
              {isExporting ? s.common.downloading : s.common.downloadPng}
            </button>
            <StudioHandoffButton theme={theme} label={s.common.openInStudio} onClick={handleOpenInStudio} />
          </div>
          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className={`flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${tokens.focusRing} ${tokens.buttonPro}`}
            >
              <span aria-hidden="true">✦</span>
              <span>{s.common.proBatchCta}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
