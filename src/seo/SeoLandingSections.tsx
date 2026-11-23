/**
 * [INPUT]: depends on useState from react; depends on ResolvedRoute from ./types.ts; depends on TOOL_ROUTE_DEFINITIONS, buildLocalizedPath, and getRelatedRoutes from ./routes.ts; depends on getRouteCopy and getUiLabels from ./i18n.ts; depends on handleSpaLinkClick from ./navHelpers.ts
 * [OUTPUT]: exports SeoLandingSections component and SeoLandingSectionsProps type
 * [POS]: below-the-fold crawlable editorial and conversion sections within src/seo, rendering privacy proof banner, 3-step How-To guide, scenario highlights, Studio + Pro conversion banner, related tool cross-links, full tool directory, and interactive FAQ accordion
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useState } from 'react'
import type { ResolvedRoute } from './types.ts'
import {
  TOOL_ROUTE_DEFINITIONS,
  buildLocalizedPath,
  getRelatedRoutes,
} from './routes.ts'
import { getRouteCopy, getUiLabels } from './i18n.ts'
import { handleSpaLinkClick } from './navHelpers.ts'

export interface SeoLandingSectionsProps {
  route: ResolvedRoute
  theme: 'light' | 'dark'
  onNavigate: (path: string) => void
  onOpenProModal?: () => void
  isPro?: boolean
}

export function SeoLandingSections({
  route,
  theme,
  onNavigate,
  onOpenProModal,
  isPro = false,
}: SeoLandingSectionsProps) {
  const isDark = theme === 'dark'
  const ui = getUiLabels(route.locale)
  const copy = getRouteCopy(route.locale, route.slug)
  const relatedRoutes = getRelatedRoutes(route.slug, route.locale)
  const studioHref = buildLocalizedPath(route.locale, 'studio')

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const headingCls = isDark ? 'text-zinc-50' : 'text-zinc-950'
  const mutedCls = isDark ? 'text-zinc-400' : 'text-zinc-600'
  const cardCls = isDark
    ? 'border-white/10 bg-[#15151c] text-zinc-100'
    : 'border-zinc-200/90 bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
  const interactiveCardCls = isDark
    ? 'border-white/10 bg-[#15151c] text-zinc-100 hover:border-violet-400/50 hover:bg-[#1a1a24]'
    : 'border-zinc-200/90 bg-white text-zinc-900 hover:border-violet-400/70 hover:bg-violet-50/30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. Local-first Privacy Proof Banner */}
      <section
        aria-label={ui.privacyBannerTitle}
        className={`rounded-2xl border p-6 sm:p-8 ${
          isDark
            ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-[#15151c] to-violet-500/10'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-violet-50/60'
        }`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                isDark
                  ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-100/80 text-emerald-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{ui.privacyBadge}</span>
            </div>
            <h2 className={`text-xl font-semibold tracking-tight sm:text-2xl ${headingCls}`}>
              {ui.privacyBannerTitle}
            </h2>
            <p className={`text-sm leading-relaxed sm:text-base ${mutedCls}`}>
              {ui.privacyBannerDescription}
            </p>
          </div>

          <ul className="grid shrink-0 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {ui.privacyProofPoints.map((point) => (
              <li
                key={point}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-medium sm:text-sm ${
                  isDark
                    ? 'border-white/10 bg-black/25 text-zinc-200'
                    : 'border-zinc-200/80 bg-white/90 text-zinc-800'
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 shrink-0 text-emerald-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 5" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. 3-Step How-To Guide (matches HowTo JSON-LD verbatim) */}
      <section aria-labelledby="seo-howto-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-howto-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.howToHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.howToSubheading}</p>
        </div>

        <ol className="grid gap-5 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li
              key={step.title}
              id={`step-${index + 1}`}
              className={`rounded-2xl border p-6 ${cardCls}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    isDark
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className={`text-base font-semibold ${headingCls}`}>{step.title}</h3>
              </div>
              <p className={`text-sm leading-relaxed ${mutedCls}`}>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Scenario Highlights */}
      <section aria-labelledby="seo-highlights-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-highlights-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.highlightsHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.highlightsSubheading}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {copy.highlights.map((item) => (
            <article key={item.title} className={`rounded-2xl border p-6 ${cardCls}`}>
              <h3 className={`text-base font-semibold ${headingCls}`}>{item.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${mutedCls}`}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Studio Multi-Layer Upgrade Banner */}
      <section
        aria-label={ui.studioBannerTitle}
        className={`flex flex-col items-start justify-between gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:p-8 ${
          isDark
            ? 'border-violet-500/30 bg-gradient-to-r from-violet-600/20 via-[#181826] to-fuchsia-600/15'
            : 'border-violet-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50'
        }`}
      >
        <div className="max-w-2xl space-y-1.5">
          <h2 className={`text-lg font-bold tracking-tight sm:text-xl ${headingCls}`}>
            {ui.studioBannerTitle}
          </h2>
          <p className={`text-sm leading-relaxed ${mutedCls}`}>
            {ui.studioBannerDescription}
          </p>
        </div>
        <div className="flex flex-wrap shrink-0 items-center gap-2.5">
          <a
            href={studioHref}
            onClick={(event) => handleSpaLinkClick(event, studioHref, onNavigate)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span>{ui.studioBannerAction}</span>
            <span aria-hidden="true">↗</span>
          </a>
          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                isPro
                  ? isDark
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : isDark
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
                    : 'border-amber-300/90 bg-amber-50/90 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              <span>{isPro ? ui.proActive : ui.studioBannerProAction}</span>
            </button>
          )}
        </div>
      </section>

      {/* 5. Related Tools Internal Cross-Links */}
      <section aria-labelledby="seo-related-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-related-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.relatedToolsHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.relatedToolsSubheading}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatedRoutes.map((rel) => {
            const relCopy = getRouteCopy(rel.locale, rel.slug)
            return (
              <a
                key={rel.path}
                href={rel.path}
                onClick={(event) => handleSpaLinkClick(event, rel.path, onNavigate)}
                className={`group flex flex-col justify-between rounded-2xl border p-5 transition-colors ${interactiveCardCls}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                      {relCopy.badge}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xs opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </div>
                  <h3 className={`mt-2 text-base font-semibold ${headingCls}`}>
                    {relCopy.navLabel}
                  </h3>
                  <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed sm:text-sm ${mutedCls}`}>
                    {relCopy.metaDescription}
                  </p>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* 6. Complete Tool Directory Cards */}
      <section aria-labelledby="seo-directory-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-directory-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.directoryHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.directorySubheading}</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {TOOL_ROUTE_DEFINITIONS.map((def) => {
            const href = buildLocalizedPath(route.locale, def.slug)
            const toolCopy = getRouteCopy(route.locale, def.slug)
            const isCurrent = def.slug === route.slug
            return (
              <a
                key={def.slug}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  isCurrent
                    ? isDark
                      ? 'border-violet-400/60 bg-violet-500/15 text-violet-200'
                      : 'border-violet-300 bg-violet-50 text-violet-800'
                    : interactiveCardCls
                }`}
              >
                <span className="truncate">{toolCopy.navLabel}</span>
                <span
                  className={`ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    isDark ? 'bg-white/[0.06] text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {ui.navCategories[def.preset.tool]}
                </span>
              </a>
            )
          })}
        </div>
      </section>

      {/* 7. Interactive FAQ Accordion (matches FAQPage JSON-LD verbatim) */}
      <section aria-labelledby="seo-faq-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-faq-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.faqHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.faqSubheading}</p>
        </div>

        <div
          className={`divide-y overflow-hidden rounded-2xl border ${
            isDark
              ? 'divide-white/10 border-white/10'
              : 'divide-zinc-200/70 border-zinc-200/90'
          }`}
        >
          {copy.faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index
            const panelId = `seo-faq-panel-${index}`
            return (
              <div
                key={faq.question}
                className={isDark ? 'bg-[#15151c]' : 'bg-white'}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors sm:px-6 sm:text-base ${headingCls} ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <span>{faq.question}</span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 text-lg leading-none transition-transform ${mutedCls} ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={panelId}
                    className={`px-5 pb-5 text-sm leading-relaxed sm:px-6 ${mutedCls}`}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
