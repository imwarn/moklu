/**
 * [INPUT]: depends on react, zustand useShallow, useEditorStore, useAssetStore, PhoneLayer/Layer types, screenshotAssets, PropertyControls, OverrideDot, ToggleSwitch, SegmentedControl, FileUploadButton, mockup specs/browser, panelConstants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports PhoneProperties inspector with localized device/browser, chrome, composition, status bar, screenshot fit, and border controls
 * [POS]: Content-tab inspector for phone and browser mockup layers inside src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store'
import { useAssetStore } from '@/store/assets'
import type { PhoneLayer, Layer } from '@/types'
import { prepareScreenshotUpload } from '@/utils/screenshotAssets'
import { ColorField, SliderField } from '@/components/properties/PropertyControls'
import { OverrideDot } from '@/components/properties/OverrideDot'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { FileUploadButton } from '@/components/ui/FileUploadButton'
import { computePhoneFitScale, PHONE_MODELS, getPhoneSpec } from '@/assets/mockups/specs'
import { isBrowserModel } from '@/assets/mockups/browser'
import {
  inputCls,
  labelCls,
  panelSectionCls,
  pauseTemporal,
  resumeTemporal,
} from '@/components/properties/panelConstants'
import { useStudioLocale } from '@/i18n'

// ─── Locale Screenshot Row ────────────────────────────────────────────────────

function LocaleScreenshotRow({
  locale,
  previewSrc,
  onUpload,
  onClear,
}: {
  locale: string
  previewSrc?: string
  onUpload: (file: File) => Promise<void>
  onClear: () => void
}) {
  const { t } = useStudioLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#6b6b7a] uppercase w-8 shrink-0 font-mono">{locale}</span>
      {previewSrc ? (
        <>
          <img src={previewSrc} alt={locale} className="h-8 w-5 rounded object-cover border border-[rgba(255,255,255,0.12)] shrink-0" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 text-left text-[10px] text-[#7c6ef6] hover:text-[#9d90f8] transition-colors"
          >
            {t.properties.change}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-[#f87171] hover:text-[#fca5a5] transition-colors shrink-0"
          >
            ✕
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 text-left text-[10px] text-[#6b6b7a] hover:text-[#e8e8f0] border border-dashed border-[rgba(255,255,255,0.1)] rounded px-2 py-1 transition-colors hover:border-[rgba(124,110,246,0.4)]"
        >
          {t.properties.uploadFor} {locale}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          await onUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── PhoneProperties ──────────────────────────────────────────────────────────

export function PhoneProperties({ layer }: { layer: PhoneLayer }) {
  const { t } = useStudioLocale()
  const { updateLayer, project, activeSlideGroupId, setLocaleContent, clearLocaleContent } = useEditorStore(
    useShallow((s) => ({
      updateLayer: s.updateLayer,
      project: s.project,
      activeSlideGroupId: s.activeSlideGroupId,
      setLocaleContent: s.setLocaleContent,
      clearLocaleContent: s.clearLocaleContent,
    }))
  )
  const upd = (patch: Partial<PhoneLayer>) => updateLayer(layer.id, patch as Partial<Layer>)
  const screenshotInputRef = useRef<HTMLInputElement>(null)
  const addAsset = useAssetStore((s) => s.addAsset)
  const assets = useAssetStore((s) => s.assets)  // reactive to IDB hydration
  const [screenshotError, setScreenshotError] = useState<string | null>(null)

  const handleScreenshotFile = async (file: File) => {
    try {
      const { key, dataUrl } = await prepareScreenshotUpload(file)
      addAsset(key, dataUrl)
      upd({ screenshotPath: key, screenshotDataUrl: dataUrl })
      setScreenshotError(null)
    } catch (error) {
      setScreenshotError(error instanceof Error ? error.message : 'Could not read screenshot.')
    }
  }

  const previewSrc = layer.screenshotPath ? assets[layer.screenshotPath]?.dataUrl ?? layer.screenshotDataUrl : layer.screenshotDataUrl
  const screenshotLabel = layer.screenshotPath ? layer.screenshotPath : layer.screenshotDataUrl ? 'Inline (legacy)' : null

  // Only phone-shaped devices have a status bar. Watches (round/squircle screens) and
  // frameless screens have `statusBar.height === 0` in their spec — the properties UI
  // should not offer controls that render nothing.
  const hasStatusBar = getPhoneSpec(layer.model).statusBar.height > 0
  const isBrowser = isBrowserModel(layer.model)
  const chrome = layer.browserChrome ?? {}
  const updChrome = (patch: Partial<NonNullable<PhoneLayer['browserChrome']>>) =>
    upd({ browserChrome: { ...chrome, ...patch } })

  return (
    <div className="space-y-4">
      <div className={panelSectionCls}>
        <div className="flex items-center mb-1">
          <label className={labelCls + ' !mb-0'}>{t.properties.deviceBrowserModel}</label>
          <OverrideDot layerId={layer.id} propKey="model" />
        </div>
        <select
          value={layer.model}
          onChange={(e) => {
            const nextModel = e.target.value as PhoneLayer['model']
            const activeGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)
            const nextSpec = getPhoneSpec(nextModel)
            const nextScale = activeGroup ? computePhoneFitScale(activeGroup.slideHeight, nextSpec) : layer.scale
            upd({
              model: nextModel,
              scale: nextScale,
              ...(nextSpec.statusBar.height === 0
                ? { showStatusBar: undefined, statusBarBg: undefined, statusBarTheme: undefined, statusBarColor: undefined }
                : {}),
            })
          }}
          className={inputCls}
        >
          {PHONE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {isBrowser && (
        <div className={panelSectionCls}>
          <label className={labelCls}>{t.properties.browserWindow}</label>
          <div className="space-y-3">
            <label className="block text-xs text-[#a0a0b0]">{t.properties.windowTitle}
              <input type="text" maxLength={120} className={inputCls + ' mt-1'}
                value={chrome.title ?? 'Your website'}
                onChange={(event) => updChrome({ title: event.target.value })}
                placeholder="My product" />
            </label>
            <label className="block text-xs text-[#a0a0b0]">{t.properties.addressBarText}
              <input type="text" maxLength={240} className={inputCls + ' mt-1'}
                value={chrome.address ?? 'https://example.com'}
                onChange={(event) => updChrome({ address: event.target.value })}
                placeholder="https://moklu.tech" />
            </label>
            <div>
              <label className={labelCls}>{t.properties.appearance}</label>
              <SegmentedControl
                value={chrome.theme ?? (layer.model === 'browser-chrome' ? 'dark' : 'light')}
                options={[{ value: 'light', label: t.common.light }, { value: 'dark', label: t.common.dark }]}
                onChange={(theme) => updChrome({ theme })}
                className="grid grid-cols-2 gap-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className={labelCls + ' !mb-0'}>{t.properties.showAddress}</label>
              <ToggleSwitch checked={chrome.showAddressBar ?? true}
                onChange={(showAddressBar) => updChrome({ showAddressBar })}
                ariaLabel={t.properties.showAddress} />
            </div>
            <p className="text-[10px] leading-4 text-[#7f849a]">
              {t.properties.browserChromeNote}
            </p>
          </div>
        </div>
      )}

      {/* Position presets */}
      {(() => {
        const activeGroup = project.slideGroups.find((g) => g.id === activeSlideGroupId)
        const slideWidth = activeGroup?.slideWidth ?? 1290
        const slideHeight = activeGroup?.slideHeight ?? 2796
        const spec = getPhoneSpec(layer.model)
        const fw = spec.frameWidth * layer.scale
        const fh = spec.frameHeight * layer.scale
        const cx = (slideWidth - fw) / 2

        const presets = [
          { label: t.properties.compositionPresets.center,   patch: { x: cx, y: (slideHeight - fh) / 2, rotation: 0 } },
          { label: t.properties.compositionPresets.hero,     patch: { x: cx, y: Math.round(slideHeight * 0.05), rotation: 0 } },
          { label: t.properties.compositionPresets.bleed,    patch: { x: cx, y: Math.round(slideHeight * 0.38), rotation: 0 } },
          { label: t.properties.compositionPresets.tiltLeft, patch: { x: cx, y: Math.round(slideHeight * 0.18), rotation: -10 } },
          { label: t.properties.compositionPresets.tiltRight, patch: { x: cx, y: Math.round(slideHeight * 0.18), rotation: 10 } },
        ]

        return (
          <div className={panelSectionCls}>
            <label className={labelCls}>{t.properties.composition}</label>
            <div className="grid grid-cols-5 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => upd(preset.patch as Partial<PhoneLayer>)}
                  className="rounded border border-[rgba(255,255,255,0.1)] px-1 py-1.5 text-[10px] text-[#8f90a3] hover:border-[rgba(124,110,246,0.5)] hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.04)] transition-colors leading-tight text-center"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {hasStatusBar && (
        <div className={panelSectionCls}>
          {/* Status bar toggle */}
          <div className="mb-3 flex items-center justify-between">
            <label className={labelCls + ' !mb-0'}>{t.properties.statusBar}</label>
            <ToggleSwitch
              checked={layer.showStatusBar ?? true}
              onChange={(checked) => upd({ showStatusBar: checked })}
              ariaLabel={t.properties.statusBar}
            />
          </div>
          {/* Controls — only shown when status bar is on */}
          {(layer.showStatusBar ?? true) && (
            <div className="space-y-3">
              {/* Background type */}
              <div>
                <label className={labelCls}>{t.properties.background}</label>
                <SegmentedControl
                  value={layer.statusBarBg ?? 'transparent'}
                  options={[
                    { value: 'transparent', label: t.properties.transparent },
                    { value: 'solid', label: t.properties.solid },
                  ]}
                  onChange={(b) => upd({ statusBarBg: b })}
                  className="grid grid-cols-2 gap-2"
                  optionClassName="rounded-lg border px-3 py-2 text-xs transition-colors"
                />
              </div>

              {/* Colour picker — only for solid */}
              {(layer.statusBarBg ?? 'transparent') === 'solid' && (
                <div>
                  <label className={labelCls}>{t.properties.color}</label>
                  <ColorField
                    value={layer.statusBarColor ?? '#000000'}
                    onChange={(v) => upd({ statusBarColor: v })}
                    onInteractionStart={pauseTemporal}
                    onInteractionEnd={resumeTemporal}
                  />
                </div>
              )}

              {/* Icon theme */}
              <div>
                <label className={labelCls}>{t.properties.icons}</label>
                <SegmentedControl
                  value={layer.statusBarTheme ?? 'dark'}
                  options={[
                    { value: 'dark', label: `🌙 ${t.common.dark}` },
                    { value: 'light', label: `☀️ ${t.common.light}` },
                  ]}
                  onChange={(themeVal) => upd({ statusBarTheme: themeVal })}
                  className="grid grid-cols-2 gap-2"
                  optionClassName="rounded-lg border px-3 py-2 text-xs transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={panelSectionCls}>
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls + ' !mb-0'}>{t.properties.scale}</label>
          <span className="text-xs text-[#e8e8f0]">{layer.scale.toFixed(2)}×</span>
        </div>
        <input type="range" min={0.5} max={4} step={0.05} value={layer.scale} onChange={(e) => upd({ scale: Number(e.target.value) })} onMouseDown={pauseTemporal} onMouseUp={resumeTemporal} className="w-full accent-[#7c6ef6]" />
      </div>

      <div className={panelSectionCls}>
        <label className={labelCls}>{t.properties.screenshot}</label>
        <FileUploadButton
          ref={screenshotInputRef}
          variant="dropzone"
          accept="image/*"
          ariaLabel={t.properties.screenshot}
          className="rounded-xl border border-dashed border-[rgba(255,255,255,0.14)] bg-[#0f0f13] p-4 text-center transition-colors hover:border-[rgba(124,110,246,0.55)] cursor-pointer"
          onFiles={async (files) => {
            const file = files[0]
            if (!file) return
            await handleScreenshotFile(file)
          }}
        >
          {previewSrc ? <img src={previewSrc} alt={t.properties.screenshot} className="mx-auto max-h-24 rounded-lg object-contain" /> : <span className="text-xs text-[#6b6b7a]">{t.properties.uploadScreenshotHint}</span>}
        </FileUploadButton>
        {screenshotLabel && <p className="mt-2 truncate text-[10px] text-[#6b6b7a]">{screenshotLabel}</p>}
        {screenshotError && <p role="alert" className="mt-2 text-[10px] text-red-400">{screenshotError}</p>}
      </div>

      <div className={panelSectionCls}>
        <label className={labelCls}>{t.properties.fit}</label>
        <SegmentedControl
          value={layer.screenshotFit}
          options={(['cover', 'contain', 'fill'] as const).map((fit) => ({
            value: fit,
            label: t.properties.fitOptions[fit],
          }))}
          onChange={(fit) => upd({ screenshotFit: fit })}
        />
      </div>

      <div className={panelSectionCls}>
        <SliderField label={t.properties.offsetX} value={layer.screenshotOffsetX} min={-500} max={500} unit="px" onChange={(v) => upd({ screenshotOffsetX: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
        <SliderField label={t.properties.offsetY} value={layer.screenshotOffsetY} min={-500} max={500} unit="px" onChange={(v) => upd({ screenshotOffsetY: v })} onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
      </div>

      {/* Screenshot border */}
      <div className={panelSectionCls}>
        <div className="mb-3 flex items-center justify-between">
          <label className={labelCls + ' !mb-0'}>{t.properties.border}</label>
          <ToggleSwitch
            checked={Boolean(layer.border)}
            onChange={(checked) => upd({ border: checked ? { color: '#FFFFFF', width: 2, opacity: 0.5 } : undefined })}
            ariaLabel={t.properties.border}
          />
        </div>
        {layer.border && (
          <div className="space-y-3">
            <ColorField
              value={layer.border.color}
              onChange={(v) => upd({ border: { ...layer.border!, color: v } })}
              onInteractionStart={pauseTemporal}
              onInteractionEnd={resumeTemporal}
            />
            <SliderField label={t.properties.width} value={layer.border.width} min={1} max={30} unit="px"
              onChange={(v) => upd({ border: { ...layer.border!, width: v } })}
              onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} />
            <SliderField label={t.properties.opacity} value={Math.round(layer.border.opacity * 100)} min={0} max={100} unit="%"
              onChange={(v) => upd({ border: { ...layer.border!, opacity: v / 100 } })}
              onInteractionStart={pauseTemporal} onInteractionEnd={resumeTemporal} className="!mb-0" />
          </div>
        )}
      </div>

      {/* Per-locale screenshots */}
      {(() => {
        const locales = project.settings.locales ?? [project.settings.defaultLocale]
        const nonDefaultLocales = locales.filter((l) => l !== project.settings.defaultLocale)
        if (nonDefaultLocales.length === 0) return null
        return (
          <div className={panelSectionCls}>
            <label className={labelCls}>{t.properties.localizedScreenshots}</label>
            <div className="space-y-2">
              {nonDefaultLocales.map((locale) => {
                const override = layer.localeContent?.[locale]
                const path = override?.screenshotPath
                const previewSrc = path ? assets[path]?.dataUrl ?? override?.screenshotDataUrl : override?.screenshotDataUrl
                return (
                  <LocaleScreenshotRow
                    key={locale}
                    locale={locale}
                    previewSrc={previewSrc}
                    onUpload={async (file) => {
                      try {
                        const { key, dataUrl } = await prepareScreenshotUpload(file)
                        addAsset(key, dataUrl)
                        setLocaleContent(activeSlideGroupId, layer.id, locale, { screenshotPath: key, screenshotDataUrl: dataUrl })
                        setScreenshotError(null)
                      } catch (error) {
                        setScreenshotError(error instanceof Error ? error.message : 'Could not read screenshot.')
                      }
                    }}
                    onClear={() => clearLocaleContent(activeSlideGroupId, layer.id, locale)}
                  />
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
