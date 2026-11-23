/**
 * [INPUT]: depends on react, QuickDesignPreview from @/components/panels/QuickDesignPreview, QUICK_MOCKUPS/QUICK_SIZES/QUICK_THEMES from @/utils/quickDesign, browser chrome defaults from @/assets/mockups/browser, canvas utilities from ../canvasUtils, UI primitives from ../uiPrimitives, theme tokens from ../themeTokens, and strings from ../i18n
 * [OUTPUT]: exports MockupQuickTool component for instant above-the-fold screenshot beautification and Studio handoff
 * [POS]: primary mockup tool panel inside src/workspace/tools; reuses read-only QuickDesignPreview and quickDesign constants
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useMemo, useState } from 'react'
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
import { getWorkspaceStrings } from '../i18n'
import { getWorkspaceThemeTokens } from '../themeTokens'
import type { WorkspaceImageInput, WorkspaceToolPanelProps } from '../types'
import { DropZone, SegmentedControl, SliderField, StudioHandoffButton } from '../uiPrimitives'

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

export function MockupQuickTool({
  preset,
  locale,
  theme,
  onOpenInStudio,
  onOpenProModal,
}: WorkspaceToolPanelProps) {
  const s = getWorkspaceStrings(locale)
  const tokens = getWorkspaceThemeTokens(theme)

  const initialMockup = resolveInitialMockup(preset.mockupModel)
  const initialSize = resolveInitialSize(preset.canvasSize)

  const [mockup, setMockup] = useState<QuickMockup>(initialMockup)
  const [sizeKey, setSizeKey] = useState<QuickSize>(initialSize)
  const [customWidth, setCustomWidth] = useState<number>(QUICK_SIZES[initialSize].width)
  const [customHeight, setCustomHeight] = useState<number>(QUICK_SIZES[initialSize].height)
  const [quickTheme, setQuickTheme] = useState<QuickTheme>('aurora')
  const [fit, setFit] = useState<QuickScreenshotFit>('cover')
  const [scalePercent, setScalePercent] = useState<number>(100)
  const [browserTitle, setBrowserTitle] = useState<string>(DEFAULT_BROWSER_CHROME.title)
  const [browserAddress, setBrowserAddress] = useState<string>('https://moklu.tech')
  const [screenshot, setScreenshot] = useState<WorkspaceImageInput | null>(() =>
    createDemoImageInput(initialMockup.startsWith('browser-') ? 'saas' : 'mobile', 'moklu-demo-screenshot.svg'),
  )
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    setSizeKey(next)
    setCustomWidth(QUICK_SIZES[next].width)
    setCustomHeight(QUICK_SIZES[next].height)
  }

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setExportError(null)
    try {
      const loaded = await readFileAsImageInput(file)
      setScreenshot(loaded)
    } catch {
      setExportError('Unable to read image file.')
    }
  }, [])

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
      setExportError(err instanceof Error ? err.message : 'Export failed')
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
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${tokens.buttonSecondary}`}
            >
              {s.common.tryDemo}
            </button>
          </div>

          <div className="rounded-xl bg-[#111119] p-1">
            <QuickDesignPreview
              width={customWidth}
              height={customHeight}
              theme={quickTheme}
              mockup={mockup}
              screenshotSrc={screenshot?.dataUrl}
              screenshotFit={fit}
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
              onFiles={handleFiles}
            />
          </div>
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
              <input
                type="number"
                aria-label="Canvas width"
                min={240}
                max={4096}
                value={customWidth}
                onChange={(e) => setCustomWidth(Math.max(240, Math.min(4096, Number(e.target.value) || 240)))}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
              />
              <input
                type="number"
                aria-label="Canvas height"
                min={240}
                max={4096}
                value={customHeight}
                onChange={(e) => setCustomHeight(Math.max(240, Math.min(4096, Number(e.target.value) || 240)))}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs tabular-nums outline-none ${tokens.input}`}
              />
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
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-all ${
                      active ? tokens.pillActive : tokens.pillIdle
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                      style={{ background: `linear-gradient(135deg, ${palette.top}, ${palette.bottom})` }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{palette.label}</span>
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
                <label className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                  {s.mockup.browserTitle}
                </label>
                <input
                  type="text"
                  value={browserTitle}
                  onChange={(e) => setBrowserTitle(e.target.value)}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${tokens.input}`}
                />
              </div>
              <div>
                <label className={`mb-1 block text-[11px] font-semibold ${tokens.textMuted}`}>
                  {s.mockup.browserUrl}
                </label>
                <input
                  type="text"
                  value={browserAddress}
                  onChange={(e) => setBrowserAddress(e.target.value)}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${tokens.input}`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2.5 border-t pt-4 border-current/10">
          {exportError && (
            <p role="alert" className="text-xs font-medium text-rose-500">
              {exportError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPng}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tokens.buttonPrimary}`}
            >
              {isExporting ? s.common.downloading : s.common.downloadPng}
            </button>
            <StudioHandoffButton theme={theme} label={s.common.openInStudio} onClick={handleOpenInStudio} />
          </div>
          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${tokens.buttonPro}`}
            >
              <span>✦</span>
              <span>{s.common.proBatchCta}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
