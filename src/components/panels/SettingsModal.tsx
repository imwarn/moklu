/**
 * [INPUT]: depends on useEditorStore from @/store; useBrandColors; AiProviderSettings, BrandColorList, ModalShell, NumberInput, ToggleSwitch; shared contrast tokens from @/components/properties/panelConstants; useStudioLocale from @/i18n
 * [OUTPUT]: exports SettingsModal component for global AI provider config and per-project Brand/Pano preferences with WCAG AA contrast
 * [POS]: settings dialog within src/components/panels, mounted by StudioPage
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState } from 'react'
import { useEditorStore } from '@/store'
import { useBrandColors } from '@/hooks/useBrandColors'
import { AiProviderSettings } from '@/components/ai/AiProviderSettings'
import { BrandColorList } from '@/components/common/BrandColorList'
import {
  labelCls,
  STUDIO_SUBTLE_SECTION_LABEL_CLS,
  STUDIO_TEXT_MUTED_CLS,
  STUDIO_TEXT_SUBTLE_CLS,
} from '@/components/properties/panelConstants'
import { ModalShell } from '@/components/ui/ModalShell'
import { NumberInput } from '@/components/ui/NumberInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useStudioLocale } from '@/i18n'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

type Tab = 'ai' | 'brand' | 'pano'

interface TabMeta {
  id: Tab
  label: string
  icon: string
  section: 'GLOBAL' | 'PROJECT'
}

const TABS: TabMeta[] = [
  { id: 'ai', label: 'ai', icon: '🤖', section: 'GLOBAL' },
  { id: 'brand', label: 'brand', icon: '🎨', section: 'PROJECT' },
  { id: 'pano', label: 'pano', icon: '🖼', section: 'PROJECT' },
]

// ─── Brand tab content ────────────────────────────────────────────────────────

function BrandSettingsContent() {
  const { t } = useStudioLocale()
  const sm = t.modals.settings
  const brandColors = useBrandColors()

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#e8e8f0] mb-1">{sm.brandTitle}</h3>
      <p className={`text-[12px] ${STUDIO_TEXT_MUTED_CLS} mb-5 leading-relaxed`}>
        {sm.brandDesc}
      </p>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} uppercase tracking-[0.1em]`}>
          {brandColors.length}
        </span>
      </div>
      <BrandColorList />
    </div>
  )
}

// ─── Pano tab content ─────────────────────────────────────────────────────────

function PanoSettingsContent() {
  const { t } = useStudioLocale()
  const sm = t.modals.settings
  const panoSettings = useEditorStore(
    (s) => s.project.settings.pano ?? { gapPx: 24, compensate: false },
  )
  const updatePanoSettings = useEditorStore((s) => s.updatePanoSettings)

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#e8e8f0] mb-1">{sm.panoTitle}</h3>
      <p className={`text-[12px] ${STUDIO_TEXT_MUTED_CLS} mb-5 leading-relaxed`}>
        {sm.panoDesc}
      </p>

      <div className="space-y-5">
        {/* Gap input */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] p-4 bg-[rgba(255,255,255,0.02)]">
          <label htmlFor="pano-gap-px" className={labelCls}>{sm.storePreviewGap}</label>
          <p className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} mb-3 leading-relaxed`}>
            {sm.storePreviewGapDesc}
          </p>
          <div className="flex items-center gap-3">
            <NumberInput
              id="pano-gap-px"
              min={0}
              max={300}
              value={panoSettings.gapPx ?? 24}
              onValueChange={(value) =>
                updatePanoSettings({ gapPx: Math.max(0, Math.min(300, value)) })
              }
              className="bg-surface border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-sm text-[#e8e8f0] w-24 focus:outline-none focus:border-accent/60"
            />
            <span className={`text-xs ${STUDIO_TEXT_MUTED_CLS}`}>px</span>
            <input
              type="range"
              aria-label={sm.storePreviewGap}
              min={0}
              max={300}
              value={panoSettings.gapPx ?? 24}
              onChange={(e) => updatePanoSettings({ gapPx: Number(e.target.value) })}
              className="min-w-0 flex-1 accent-accent"
            />
          </div>
        </div>

        {/* Compensate checkbox */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] p-4 bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-start gap-3">
            <ToggleSwitch
              variant="checkbox"
              id="pano-compensate"
              checked={panoSettings.compensate ?? false}
              onChange={(checked) => updatePanoSettings({ compensate: checked })}
              checkboxClassName="mt-0.5 accent-accent w-4 h-4 shrink-0 cursor-pointer"
            />
            <div>
              <label
                htmlFor="pano-compensate"
                className="text-xs font-medium text-[#e8e8f0] cursor-pointer"
              >
                {sm.compensateOnExport}
              </label>
              <p className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} mt-1 leading-relaxed`}>
                {sm.compensateOnExportDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Status summary */}
        <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] px-4 py-3">
          <p className={`text-[11px] ${STUDIO_TEXT_MUTED_CLS} leading-relaxed`}>
            <span className="text-accent-text">{sm.current}</span>{' '}
            {panoSettings.gapPx ?? 24}px
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t } = useStudioLocale()
  const sm = t.modals.settings
  const [tab, setTab] = useState<Tab>('ai')

  const sections = ['GLOBAL', 'PROJECT'] as const
  const tabsBySection = (section: (typeof sections)[number]) =>
    TABS.filter((item) => item.section === section)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={sm.title}
      closeLabel={sm.closeAria}
      maxWidth="max-w-5xl"
      panelClassName="relative rounded-2xl border shadow-2xl w-full mx-3 sm:mx-4 h-[88dvh] max-h-[88dvh] flex flex-col overflow-hidden"
      footerClassName="shrink-0 px-4 md:px-5 py-2.5 border-t border-[rgba(255,255,255,0.06)] flex flex-wrap items-center gap-x-3 gap-y-1"
      footer={(
        <>
          <span className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} font-mono select-all`}>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}</span>
          <span className={STUDIO_TEXT_SUBTLE_CLS} aria-hidden="true">·</span>
          <span className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} font-mono select-all`} title="Git commit hash">{typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'local'}</span>
          <span className="flex-1" />
          <a href="https://github.com/imwarn/moklu" target="_blank" rel="noopener noreferrer" className={`text-[11px] ${STUDIO_TEXT_SUBTLE_CLS} hover:text-accent-text transition-colors`}>github.com/imwarn/moklu</a>
        </>
      )}
    >
        {/* Body: sidebar + content */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Sidebar */}
          <nav
            aria-label={sm.title}
            className="flex md:block items-center gap-1.5 w-full md:w-44 shrink-0 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)] p-2.5 md:p-3 overflow-x-auto md:overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            {sections.map((section) => (
              <div key={section} className="flex md:block items-center gap-1.5 shrink-0">
                <p className={`hidden md:block ${STUDIO_SUBTLE_SECTION_LABEL_CLS} mb-1 mt-3 first:mt-0 px-2`}>
                  {sm.sections[section]}
                </p>
                {tabsBySection(section).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={tab === item.id ? 'page' : undefined}
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 md:w-full whitespace-nowrap text-left px-2.5 md:px-2 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 ${
                      tab === item.id
                        ? 'bg-accent-soft text-accent-text'
                        : `${STUDIO_TEXT_MUTED_CLS} hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)]`
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{sm.tabs[item.id]}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 md:p-6">
            {tab === 'ai' && (
              <div>
                <h3 className="text-sm font-semibold text-[#e8e8f0] mb-1">{sm.aiTitle}</h3>
                <p className={`text-[12px] ${STUDIO_TEXT_MUTED_CLS} mb-5 leading-relaxed`}>
                  {sm.aiDesc}
                </p>
                <AiProviderSettings />
              </div>
            )}
            {tab === 'brand' && <BrandSettingsContent />}
            {tab === 'pano' && <PanoSettingsContent />}
          </div>
        </div>

    </ModalShell>
  )
}
