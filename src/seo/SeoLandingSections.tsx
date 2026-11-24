/**
 * [INPUT]: depends on ResolvedRoute from ./types.ts; depends on TOOL_ROUTE_DEFINITIONS, buildLocalizedPath, and getRelatedRoutes from ./routes.ts; depends on getRouteCopy and getUiLabels from ./i18n.ts; depends on NAV_TOOL_ORDER and handleSpaLinkClick from ./navHelpers.ts; depends on getToolQuickFacts from ./quickFacts.ts
 * [OUTPUT]: exports SeoLandingSections component and SeoLandingSectionsProps type
 * [POS]: below-the-fold crawlable editorial and conversion sections within src/seo, rendering privacy proof banner, Quick Facts & capability boundaries, 4/8 vertical-rail How-To timeline, 1+2 asymmetric workflow bento, Studio + Pro conversion strip, 2-column related-tools index, category-grouped tool directory, and native details/summary FAQ accordion
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute } from './types.ts'
import {
  TOOL_ROUTE_DEFINITIONS,
  buildLocalizedPath,
  getRelatedRoutes,
} from './routes.ts'
import { getRouteCopy, getUiLabels } from './i18n.ts'
import { NAV_TOOL_ORDER, handleSpaLinkClick } from './navHelpers.ts'
import { getToolQuickFacts } from './quickFacts.ts'

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
  const quickFacts = getToolQuickFacts(route.locale, route)
  const relatedRoutes = getRelatedRoutes(route.slug, route.locale)
  const studioHref = buildLocalizedPath(route.locale, 'studio')

  const headingCls = isDark ? 'text-zinc-50' : 'text-zinc-950'
  const mutedCls = 'text-muted'
  const cardCls = isDark
    ? 'border-border bg-panel text-zinc-100'
    : 'border-border bg-panel text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.04)]'
  const recessedCardCls = isDark
    ? 'border-border bg-surface text-zinc-100'
    : 'border-border bg-zinc-100/70 text-zinc-900'
  const spotlightCardCls = isDark
    ? 'border-accent/30 bg-gradient-to-br from-accent/15 via-panel to-panel text-zinc-100'
    : 'border-accent/25 bg-gradient-to-br from-accent-soft/80 via-panel to-panel text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.04)]'
  const interactivePillCls = isDark
    ? 'border-border bg-surface text-zinc-200 hover:border-accent/50 hover:bg-zinc-900 hover:text-white'
    : 'border-border bg-surface text-zinc-800 hover:border-accent/50 hover:bg-accent-soft/40 hover:text-zinc-950'

  const toolGroups = NAV_TOOL_ORDER.map((toolId) => ({
    toolId,
    label: ui.navCategories[toolId],
    items: TOOL_ROUTE_DEFINITIONS.filter((def) => def.preset.tool === toolId),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. Local-first Privacy Proof Banner (horizontal split callout; stacks 1-col < 768px) */}
      <section
        aria-label={ui.privacyBannerTitle}
        className={`rounded-2xl border p-6 sm:p-8 ${
          isDark
            ? 'border-success/25 bg-panel'
            : 'border-success/25 bg-panel shadow-[0_1px_3px_rgba(24,24,27,0.04)]'
        }`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                isDark
                  ? 'border-success/30 bg-success/12 text-success'
                  : 'border-success/30 bg-success/[0.06] text-success'
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-3.5 w-3.5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 2 13 4v4c0 3.1-2.1 5.3-5 6-2.9-.7-5-2.9-5-6V4l5-2Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 8.25 7.25 9.75 10.5 6.5" />
              </svg>
              <span>{ui.privacyBadge}</span>
            </div>
            <h2 className={`text-xl font-semibold tracking-tight sm:text-2xl ${headingCls}`}>
              {ui.privacyBannerTitle}
            </h2>
            <p className={`max-w-[65ch] text-sm leading-relaxed sm:text-base ${mutedCls}`}>
              {ui.privacyBannerDescription}
            </p>
          </div>

          <ul className="grid w-full shrink-0 grid-cols-1 gap-2.5 md:grid-cols-3 lg:w-auto lg:grid-cols-1">
            {ui.privacyProofPoints.map((point) => (
              <li
                key={point}
                className={`flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium sm:text-sm ${
                  isDark ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 shrink-0 text-success"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 5" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 1.5. Quick Facts & Capability Boundaries (2-col/3-col spec cards + boundary callout; 1-col < 768px) */}
      <section aria-labelledby="seo-quick-facts-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-quick-facts-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {quickFacts.heading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{quickFacts.subheading}</p>
        </div>

        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quickFacts.facts.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 ${cardCls}`}
            >
              <dt className={`text-xs font-semibold ${mutedCls}`}>{item.label}</dt>
              <dd className={`mt-1 text-sm font-medium leading-relaxed ${headingCls}`}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className={`rounded-xl border p-5 ${recessedCardCls}`}>
          <h3 className={`text-sm font-semibold ${headingCls}`}>
            {quickFacts.boundariesHeading}
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {quickFacts.boundaries.map((boundary) => (
              <li
                key={boundary}
                className={`flex items-start gap-2 text-xs leading-relaxed sm:text-sm ${mutedCls}`}
              >
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-accent-text">
                  /
                </span>
                <span>{boundary}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. 3-Step How-To Guide (asymmetric 4/8 split with vertical step rail; 1-col < 768px; matches HowTo JSON-LD verbatim) */}
      <section
        aria-labelledby="seo-howto-heading"
        className="grid grid-cols-1 gap-8 border-t border-border pt-12 md:grid-cols-12 md:gap-10"
      >
        <div className="space-y-2 md:col-span-4">
          <h2 id="seo-howto-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.howToHeading}
          </h2>
          <p className={`max-w-[42ch] text-sm leading-relaxed sm:text-base ${mutedCls}`}>
            {ui.howToSubheading}
          </p>
        </div>

        <ol className="space-y-0 md:col-span-8">
          {copy.steps.map((step, index) => {
            const isLast = index === copy.steps.length - 1
            return (
              <li
                key={step.title}
                id={`step-${index + 1}`}
                className="flex items-stretch gap-4 sm:gap-5"
              >
                <div className="flex shrink-0 flex-col items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft font-mono text-xs font-bold text-accent-text">
                    0{index + 1}
                  </span>
                  {!isLast && (
                    <span aria-hidden="true" className="my-2 w-px flex-1 bg-border" />
                  )}
                </div>
                <div className={isLast ? 'pb-1 pt-0.5' : 'pb-7 pt-0.5'}>
                  <h3 className={`text-base font-semibold ${headingCls}`}>{step.title}</h3>
                  <p className={`mt-1.5 max-w-[65ch] text-sm leading-relaxed ${mutedCls}`}>
                    {step.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 3. Scenario Highlights (asymmetric 1+2 bento showcase with surface diversity; 1-col < 768px) */}
      <section aria-labelledby="seo-highlights-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-highlights-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.highlightsHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.highlightsSubheading}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {copy.highlights.map((item, index) => {
            if (index === 0) {
              return (
                <article
                  key={item.title}
                  className={`flex flex-col justify-between gap-6 rounded-2xl border p-6 sm:p-8 md:col-span-7 md:row-span-2 ${spotlightCardCls}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-accent-text">01</span>
                    <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold tracking-tight sm:text-xl ${headingCls}`}>
                      {item.title}
                    </h3>
                    <p className={`mt-2.5 max-w-[56ch] text-sm leading-relaxed sm:text-base ${mutedCls}`}>
                      {item.description}
                    </p>
                  </div>
                </article>
              )
            }

            const tileTone = index === 1 ? cardCls : recessedCardCls
            return (
              <article
                key={item.title}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-6 md:col-span-5 ${tileTone}`}
              >
                <span className="font-mono text-xs font-medium text-muted">0{index + 1}</span>
                <div>
                  <h3 className={`text-base font-semibold ${headingCls}`}>{item.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${mutedCls}`}>{item.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* 4. Studio Multi-Layer Upgrade Banner (compact conversion strip; stacks < 768px) */}
      <section
        aria-label={ui.studioBannerTitle}
        className={`flex flex-col items-start justify-between gap-5 rounded-2xl border p-6 md:flex-row md:items-center md:p-8 ${
          isDark
            ? 'border-accent/30 bg-panel shadow-[0_12px_32px_-20px_rgba(9,9,11,0.75)]'
            : 'border-border bg-panel shadow-[0_12px_32px_-20px_rgba(24,24,27,0.1)]'
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
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 md:w-auto">
          <a
            href={studioHref}
            onClick={(event) => handleSpaLinkClick(event, studioHref, onNavigate)}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-[0_1px_2px_rgba(24,24,27,0.1)] transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{ui.studioBannerAction}</span>
            <span aria-hidden="true">↗</span>
          </a>
          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isPro
                  ? isDark
                    ? 'border-success/40 bg-success/12 text-success hover:bg-success/20'
                    : 'border-success/35 bg-panel text-success hover:bg-success/[0.06]'
                  : isDark
                    ? 'border-warning/40 bg-warning/12 text-warning hover:bg-warning/20'
                    : 'border-warning/40 bg-panel text-warning hover:bg-warning/[0.06]'
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-3.5 w-3.5 shrink-0"
              >
                {isPro ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 5" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 2.25 9.6 6.4 13.75 8 9.6 9.6 8 13.75 6.4 9.6 2.25 8 6.4 6.4 8 2.25Z"
                  />
                )}
              </svg>
              <span>{isPro ? ui.proActive : ui.studioBannerProAction}</span>
            </button>
          )}
        </div>
      </section>

      {/* 5. Related Tools Internal Cross-Links (2-column editorial link index, zero uppercase eyebrows; 1-col < 768px) */}
      <section aria-labelledby="seo-related-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-related-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.relatedToolsHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.relatedToolsSubheading}</p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {relatedRoutes.map((rel) => {
            const relCopy = getRouteCopy(rel.locale, rel.slug)
            return (
              <a
                key={rel.path}
                href={rel.path}
                onClick={(event) => handleSpaLinkClick(event, rel.path, onNavigate)}
                className={`group flex items-start justify-between gap-4 border-t border-border px-2 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-100/60'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <h3 className={`text-base font-semibold transition-colors group-hover:text-accent-text ${headingCls}`}>
                    {relCopy.navLabel}
                  </h3>
                  <p className={`line-clamp-2 text-xs leading-relaxed sm:text-sm ${mutedCls}`}>
                    {relCopy.metaDescription}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 shrink-0 text-sm transition-transform group-hover:translate-x-1 group-hover:text-accent-text ${mutedCls}`}
                >
                  →
                </span>
              </a>
            )
          })}
        </div>
      </section>

      {/* 6. Complete Tool Directory (2-column category-grouped clusters; 1-col < 768px) */}
      <section aria-labelledby="seo-directory-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-directory-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.directoryHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.directorySubheading}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {toolGroups.map((group) => (
            <div
              key={group.toolId}
              className={`rounded-2xl border p-5 ${cardCls}`}
            >
              <h3 className={`text-sm font-semibold ${headingCls}`}>{group.label}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((def) => {
                  const href = buildLocalizedPath(route.locale, def.slug)
                  const toolCopy = getRouteCopy(route.locale, def.slug)
                  const isCurrent = def.slug === route.slug
                  return (
                    <a
                      key={def.slug}
                      href={href}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                      className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isCurrent
                          ? 'border-accent/50 bg-accent-soft text-accent-text'
                          : interactivePillCls
                      }`}
                    >
                      {toolCopy.navLabel}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Native <details>/<summary> FAQ Accordion (100% answers in SSG DOM, matches FAQPage JSON-LD verbatim) */}
      <section aria-labelledby="seo-faq-heading" className="space-y-6">
        <div className="max-w-2xl space-y-1.5">
          <h2 id="seo-faq-heading" className={`text-2xl font-bold tracking-tight ${headingCls}`}>
            {ui.faqHeading}
          </h2>
          <p className={`text-sm sm:text-base ${mutedCls}`}>{ui.faqSubheading}</p>
        </div>

        <div
          className={`divide-y overflow-hidden rounded-2xl border border-border ${
            isDark ? 'divide-white/10' : 'divide-zinc-200/70'
          }`}
        >
          {copy.faqs.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="group bg-panel"
            >
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors sm:px-6 sm:text-base [&::-webkit-details-marker]:hidden ${headingCls} ${
                  isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-surface'
                }`}
              >
                <span>{faq.question}</span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-lg leading-none transition-transform group-open:rotate-45 ${mutedCls}`}
                >
                  +
                </span>
              </summary>
              <div
                id={`seo-faq-panel-${index}`}
                className={`px-5 pb-5 text-sm leading-relaxed sm:px-6 ${mutedCls}`}
              >
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
