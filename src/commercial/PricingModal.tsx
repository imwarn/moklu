/**
 * [INPUT]: depends on ModalShell from @/components/ui/ModalShell; depends on getBrandPalette from @/theme/brand; depends on PRO_FEATURES, ProFeature, and useEntitlementStore from ./entitlements; depends on PricingLocale, PricingModalLabels, and resolvePricingLabels from ./pricingCopy
 * [OUTPUT]: exports PricingModal component, PricingModalProps, PricingLocale, and PricingModalLabels types
 * [POS]: Accessible light/dark-adaptive Free vs Moklu Studio Pro comparison dialog with Escape/Tab focus trapping and 4-locale fallback copy
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { ModalShell } from '@/components/ui/ModalShell'
import { getBrandPalette } from '@/theme/brand'
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
  const palette = getBrandPalette(theme)

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
        background: isLight ? 'rgba(24, 24, 27, 0.42)' : 'rgba(9, 9, 11, 0.72)',
      }}
      panelClassName={`relative rounded-2xl border w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden ${
        isLight
          ? 'text-zinc-900 shadow-[0_24px_60px_-20px_rgba(24,24,27,0.2)]'
          : 'text-zinc-100 shadow-[0_24px_60px_-20px_rgba(9,9,11,0.85)]'
      }`}
      panelStyle={{
        background: palette.panel,
        borderColor: palette.border,
      }}
      closeButtonClassName={
        isLight
          ? 'absolute top-4 right-4 z-10 text-muted hover:text-zinc-900 transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
          : 'absolute top-4 right-4 z-10 text-muted hover:text-zinc-100 transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
      }
      header={
        <div className="border-b border-border px-6 py-5 pr-14 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              className={`text-lg font-semibold tracking-tight ${
                isLight ? 'text-zinc-950' : 'text-zinc-50'
              }`}
            >
              {copy.title}
            </h2>
            {isProTier && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  isLight
                    ? 'bg-panel text-success ring-success/30'
                    : 'bg-success/12 text-success ring-success/30'
                }`}
              >
                {copy.proActiveBadge}
              </span>
            )}
            {isPreview && (
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-text ring-1 ring-accent/35">
                {copy.proPreviewActiveBadge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {copy.subtitle}
          </p>
        </div>
      }
      bodyClassName="overflow-y-auto px-6 py-5"
      footer={
        <div
          className={`border-t border-border px-6 py-3.5 text-xs text-muted ${
            isLight ? 'bg-surface' : ''
          }`}
        >
          {copy.footerNote}
        </div>
      }
    >
      <div data-theme={theme} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-label={copy.freePlanName}
          className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5"
        >
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={`text-base font-semibold ${isLight ? 'text-zinc-950' : 'text-zinc-50'}`}>
                {copy.freePlanName}
              </h3>
              <span className={`text-xl font-bold ${isLight ? 'text-zinc-950' : 'text-zinc-50'}`}>
                {copy.freePlanPrice}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              {copy.freePlanTagline}
            </p>
            <ul
              className={`mt-4 space-y-2.5 text-sm ${
                isLight ? 'text-zinc-700' : 'text-zinc-200'
              }`}
            >
              {copy.freeFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 text-success">
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
            className={`mt-6 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] ${
              isLight
                ? 'bg-panel text-zinc-900 hover:bg-zinc-100'
                : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            {copy.freeCta}
          </button>
        </section>

        <section
          aria-label={copy.proPlanName}
          className="flex flex-col justify-between rounded-xl border border-accent/40 bg-panel p-5"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-semibold ${isLight ? 'text-zinc-950' : 'text-zinc-50'}`}>
                  {copy.proPlanName}
                </h3>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                  {copy.proPlanBadge}
                </span>
              </div>
              <span className="text-sm font-semibold text-accent-text">
                {copy.proPlanPrice}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              {copy.proPlanTagline}
            </p>
            <ul
              className={`mt-4 space-y-2.5 text-sm ${
                isLight ? 'text-zinc-800' : 'text-zinc-100'
              }`}
            >
              {PRO_FEATURES.map((feature) => {
                const highlighted = highlightedFeature === feature
                return (
                  <li
                    key={feature}
                    data-feature={feature}
                    className={`flex items-start gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                      highlighted ? 'bg-accent-soft ring-1 ring-accent/40' : ''
                    }`}
                  >
                    <span aria-hidden="true" className="mt-0.5 text-accent-text">
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
            className="mt-6 w-full rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-fg transition-all hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {proPreviewEnabled ? copy.proPreviewDisableCta : copy.proPreviewEnableCta}
          </button>
        </section>
      </div>
    </ModalShell>
  )
}
