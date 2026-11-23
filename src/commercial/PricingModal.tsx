/**
 * [INPUT]: depends on ModalShell from @/components/ui/ModalShell; depends on PRO_FEATURES, ProFeature, and useEntitlementStore from ./entitlements; depends on PricingLocale, PricingModalLabels, and resolvePricingLabels from ./pricingCopy
 * [OUTPUT]: exports PricingModal component, PricingModalProps, PricingLocale, and PricingModalLabels types
 * [POS]: Accessible light/dark-adaptive Free vs Moklu Studio Pro comparison dialog with Escape/Tab focus trapping and 4-locale fallback copy
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
  theme?: 'light' | 'dark'
  highlightedFeature?: ProFeature
  labels?: PricingModalLabels
  onUpgradeClick?: () => void
}

export function PricingModal({
  open,
  onClose,
  locale = 'en',
  theme = 'dark',
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
  const isLight = theme === 'light'

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
      backdropStyle={{
        background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0,0,0,0.65)',
      }}
      panelClassName={`relative rounded-2xl border shadow-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden ${
        isLight ? 'text-zinc-900' : 'text-[#f5f5f8]'
      }`}
      panelStyle={{
        background: isLight ? '#ffffff' : '#16171f',
        borderColor: isLight ? 'rgba(228, 228, 231, 0.95)' : 'rgba(255,255,255,0.12)',
      }}
      closeButtonClassName={
        isLight
          ? 'absolute top-4 right-4 z-10 text-zinc-500 hover:text-zinc-900 transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'
          : 'absolute top-4 right-4 z-10 text-[#9494a8] hover:text-[#f5f5f8] transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9afff]'
      }
      header={
        <div
          className={`border-b px-6 py-5 pr-14 shrink-0 ${
            isLight ? 'border-zinc-200' : 'border-white/10'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              className={`text-lg font-semibold tracking-tight ${
                isLight ? 'text-zinc-950' : 'text-[#f5f5f8]'
              }`}
            >
              {copy.title}
            </h2>
            {isProTier && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
                }`}
              >
                {copy.proActiveBadge}
              </span>
            )}
            {isPreview && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  isLight
                    ? 'bg-violet-100 text-violet-700 ring-violet-300'
                    : 'bg-[#7c6ef6]/20 text-[#c8c1ff] ring-[#7c6ef6]/40'
                }`}
              >
                {copy.proPreviewActiveBadge}
              </span>
            )}
          </div>
          <p className={`mt-1.5 text-sm ${isLight ? 'text-zinc-600' : 'text-[#a6a8bc]'}`}>
            {copy.subtitle}
          </p>
        </div>
      }
      bodyClassName="overflow-y-auto px-6 py-5"
      footer={
        <div
          className={`border-t px-6 py-3.5 text-xs ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/70 text-zinc-600'
              : 'border-white/10 text-[#9496aa]'
          }`}
        >
          {copy.footerNote}
        </div>
      }
    >
      <div data-theme={theme} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-label={copy.freePlanName}
          className={`flex flex-col justify-between rounded-xl border p-5 ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/70'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={`text-base font-semibold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                {copy.freePlanName}
              </h3>
              <span className={`text-xl font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                {copy.freePlanPrice}
              </span>
            </div>
            <p className={`mt-2 text-xs leading-5 ${isLight ? 'text-zinc-600' : 'text-[#a6a8bc]'}`}>
              {copy.freePlanTagline}
            </p>
            <ul
              className={`mt-4 space-y-2.5 text-sm ${
                isLight ? 'text-zinc-700' : 'text-[#d9dbe8]'
              }`}
            >
              {copy.freeFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}
                  >
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
            className={`mt-6 w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isLight
                ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 focus-visible:outline-violet-600'
                : 'border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-[#b9afff]'
            }`}
          >
            {copy.freeCta}
          </button>
        </section>

        <section
          aria-label={copy.proPlanName}
          className={`flex flex-col justify-between rounded-xl border p-5 ${
            isLight
              ? 'border-violet-300 bg-gradient-to-b from-violet-50 via-white to-indigo-50/60'
              : 'border-[#7c6ef6]/50 bg-gradient-to-b from-[#7c6ef6]/15 via-[#1b1c28] to-[#171822]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-semibold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                  {copy.proPlanName}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isLight
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-[#7c6ef6]/25 text-[#d3ceff]'
                  }`}
                >
                  {copy.proPlanBadge}
                </span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  isLight ? 'text-violet-700' : 'text-[#c8c1ff]'
                }`}
              >
                {copy.proPlanPrice}
              </span>
            </div>
            <p className={`mt-2 text-xs leading-5 ${isLight ? 'text-zinc-600' : 'text-[#b7b9ce]'}`}>
              {copy.proPlanTagline}
            </p>
            <ul
              className={`mt-4 space-y-2.5 text-sm ${
                isLight ? 'text-zinc-800' : 'text-[#e8e9f4]'
              }`}
            >
              {PRO_FEATURES.map((feature) => {
                const highlighted = highlightedFeature === feature
                return (
                  <li
                    key={feature}
                    data-feature={feature}
                    className={`flex items-start gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                      highlighted
                        ? isLight
                          ? 'bg-violet-100/90 ring-1 ring-violet-300'
                          : 'bg-[#7c6ef6]/25 ring-1 ring-[#a99eff]/50'
                        : ''
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 ${isLight ? 'text-violet-600' : 'text-[#a99eff]'}`}
                    >
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
            className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isLight
                ? 'bg-violet-600 hover:bg-violet-500 focus-visible:outline-violet-600'
                : 'bg-[#7c6ef6] hover:bg-[#8d81f8] focus-visible:outline-[#d3ceff]'
            }`}
          >
            {proPreviewEnabled ? copy.proPreviewDisableCta : copy.proPreviewEnableCta}
          </button>
        </section>
      </div>
    </ModalShell>
  )
}
