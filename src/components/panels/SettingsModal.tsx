/**
 * [INPUT]: depends on useEditorStore from @/store; useBrandColors; AiProviderSettings, BrandColorList, ModalShell, NumberInput, ToggleSwitch; useStudioLocale from @/i18n
 * [OUTPUT]: exports SettingsModal component for global AI provider config and per-project Brand/Pano preferences
 * [POS]: settings dialog within src/components/panels, mounted by StudioPage
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useState } from 'react'
import { useEditorStore } from '@/store'
import { useBrandColors } from '@/hooks/useBrandColors'
import { AiProviderSettings } from '@/components/ai/AiProviderSettings'
import { BrandColorList } from '@/components/common/BrandColorList'
import { ModalShell } from '@/components/ui/ModalShell'
import { NumberInput } from '@/components/ui/NumberInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useStudioLocale } from '@/i18n'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

// ─── Shared style tokens ────────────────────────────────────────────────────

const labelCls = 'text-[11px] text-[#6b6b7a] mb-1 block uppercase tracking-[0.08em]'

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
      <p className="text-[12px] text-[#6b6b7a] mb-5 leading-relaxed">
        {sm.brandDesc}
      </p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#4a4a5a] uppercase tracking-[0.1em]">
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
      <p className="text-[12px] text-[#6b6b7a] mb-5 leading-relaxed">
        {sm.panoDesc}
      </p>

      <div className="space-y-5">
        {/* Gap input */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] p-4 bg-[rgba(255,255,255,0.02)]">
          <label className={labelCls}>{sm.storePreviewGap}</label>
          <p className="text-[11px] text-[#4a4a5a] mb-3 leading-relaxed">
            {sm.storePreviewGapDesc}
          </p>
          <div className="flex items-center gap-3">
            <NumberInput
              min={0}
              max={300}
              value={panoSettings.gapPx ?? 24}
              onValueChange={(value) =>
                updatePanoSettings({ gapPx: Math.max(0, Math.min(300, value)) })
              }
              className="bg-[#0f0f13] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-sm text-[#e8e8f0] w-24 focus:outline-none focus:border-[rgba(124,110,246,0.5)]"
            />
            <span className="text-xs text-[#6b6b7a]">px</span>
            <input
              type="range"
              min={0}
              max={300}
              value={panoSettings.gapPx ?? 24}
              onChange={(e) => updatePanoSettings({ gapPx: Number(e.target.value) })}
              className="flex-1 accent-[#7c6ef6]"
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
              checkboxClassName="mt-0.5 accent-[#7c6ef6] w-4 h-4 shrink-0 cursor-pointer"
            />
            <div>
              <label
                htmlFor="pano-compensate"
                className="text-xs font-medium text-[#e8e8f0] cursor-pointer"
              >
                {sm.compensateOnExport}
              </label>
              <p className="text-[11px] text-[#4a4a5a] mt-1 leading-relaxed">
                {sm.compensateOnExportDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Status summary */}
        <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] px-4 py-3">
          <p className="text-[11px] text-[#6b6b7a] leading-relaxed">
            <span className="text-[#c4b5fd]">{sm.current}</span>{' '}
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
      panelClassName="relative rounded-2xl border shadow-2xl w-full mx-4 h-[85vh] flex flex-col overflow-hidden"
      footerClassName="shrink-0 px-5 py-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-3"
      footer={(
        <>
          <span className="text-[11px] text-[#4a4a5a] font-mono select-all">v{__APP_VERSION__}</span>
          <span className="text-[#2a2a3a]">·</span>
          <span className="text-[11px] text-[#4a4a5a] font-mono select-all" title="Git commit hash">{__GIT_HASH__}</span>
          <span className="flex-1" />
          <a href="https://github.com/imwarn/moklu" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#4a4a5a] hover:text-[#7c6ef6] transition-colors">github.com/imwarn/moklu</a>
        </>
      )}
    >
        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav
            className="w-44 shrink-0 border-r border-[rgba(255,255,255,0.06)] p-3 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            {sections.map((section) => (
              <div key={section}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a5a] mb-1 mt-3 first:mt-0 px-2">
                  {sm.sections[section]}
                </p>
                {tabsBySection(section).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 ${
                      tab === item.id
                        ? 'bg-[rgba(124,110,246,0.18)] text-[#c4b5fd]'
                        : 'text-[#6b6b7a] hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{sm.tabs[item.id]}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'ai' && (
              <div>
                <h3 className="text-sm font-semibold text-[#e8e8f0] mb-1">{sm.aiTitle}</h3>
                <p className="text-[12px] text-[#6b6b7a] mb-5 leading-relaxed">
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
