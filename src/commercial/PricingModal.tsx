/**
 * [INPUT]: depends on ModalShell from @/components/ui/ModalShell; depends on PRO_FEATURES, ProFeature, and useEntitlementStore from ./entitlements; depends on PricingLocale, PricingModalLabels, and resolvePricingLabels from ./pricingCopy
 * [OUTPUT]: exports PricingModal component and PricingModalProps type
 * [POS]: Accessible Free vs Moklu Studio Pro comparison dialog with Escape/Tab focus trapping and 4-locale fallback copy
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { ModalShell } from '@/components/ui/ModalShell'
import { PRO_FEATURES, useEntitlementStore, type ProFeature } from './entitlements'
import { resolvePricingLabels, type PricingLocale, type PricingModalLabels } from './pricingCopy'

export type { PricingLocale, PricingModalLabels }

export interface PricingModalProps {
  open: boolean
  onClose: () => void
  locale?: PricingLocale
  highlightedFeature?: ProFeature
  labels?: PricingModalLabels
  onUpgradeClick?: () => void
}

export function PricingModal({
  open,
  onClose,
  locale = 'en',
  highlightedFeature,
  labels,
  onUpgradeClick,
}: PricingModalProps) {
  const tier = useEntitlementStore((s) => s.tier)
  const proPreviewEnabled = useEntitlementStore((s) => s.proPreviewEnabled)
  const toggleProPreview = useEntitlementStore((s) => s.toggleProPreview)

  const copy = resolvePricingLabels(locale, labels)
  const isProTier = tier === 'pro'
  const isPreview = !isProTier && proPreviewEnabled

  const handleProAction = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
      return
    }
    toggleProPreview()
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={copy.title}
      closeLabel={copy.closeLabel}
      panelClassName="relative rounded-2xl border shadow-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden text-[#f5f5f8]"
      panelStyle={{
        background: '#16171f',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
      header={
        <div className="border-b border-white/10 px-6 py-5 pr-14 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-[#f5f5f8]">
              {copy.title}
            </h2>
            {isProTier && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                {copy.proActiveBadge}
              </span>
            )}
            {isPreview && (
              <span className="rounded-full bg-[#7c6ef6]/20 px-2.5 py-0.5 text-xs font-medium text-[#c8c1ff] ring-1 ring-[#7c6ef6]/40">
                {copy.proPreviewActiveBadge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-[#a6a8bc]">{copy.subtitle}</p>
        </div>
      }
      bodyClassName="overflow-y-auto px-6 py-5"
      footer={
        <div className="border-t border-white/10 px-6 py-3.5 text-xs text-[#9496aa]">
          {copy.footerNote}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-label={copy.freePlanName}
          className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-white">{copy.freePlanName}</h3>
              <span className="text-xl font-bold text-white">{copy.freePlanPrice}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#a6a8bc]">{copy.freePlanTagline}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#d9dbe8]">
              {copy.freeFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 text-emerald-400">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9afff]"
          >
            {copy.freeCta}
          </button>
        </section>

        <section
          aria-label={copy.proPlanName}
          className="flex flex-col justify-between rounded-xl border border-[#7c6ef6]/50 bg-gradient-to-b from-[#7c6ef6]/15 via-[#1b1c28] to-[#171822] p-5"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{copy.proPlanName}</h3>
                <span className="rounded-full bg-[#7c6ef6]/25 px-2 py-0.5 text-[11px] font-semibold text-[#d3ceff]">
                  {copy.proPlanBadge}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#c8c1ff]">{copy.proPlanPrice}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#b7b9ce]">{copy.proPlanTagline}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#e8e9f4]">
              {PRO_FEATURES.map((feature) => {
                const highlighted = highlightedFeature === feature
                return (
                  <li
                    key={feature}
                    data-feature={feature}
                    className={`flex items-start gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                      highlighted ? 'bg-[#7c6ef6]/25 ring-1 ring-[#a99eff]/50' : ''
                    }`}
                  >
                    <span aria-hidden="true" className="mt-0.5 text-[#a99eff]">
                      ✦
                    </span>
                    <span>{copy.proFeatureLabels[feature]}</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <button
            type="button"
            onClick={handleProAction}
            aria-pressed={!onUpgradeClick ? proPreviewEnabled : undefined}
            className="mt-6 w-full rounded-lg bg-[#7c6ef6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8d81f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3ceff]"
          >
            {proPreviewEnabled ? copy.proPreviewDisableCta : copy.proPreviewEnableCta}
          </button>
        </section>
      </div>
    </ModalShell>
  )
}
