/**
 * [INPUT]: depends on InfoPageSlug and ResolvedRoute from ./types.ts; depends on buildLocalizedPath and getRelatedRoutes from ./routes.ts; depends on getRouteCopy and getUiLabels from ./i18n.ts; depends on INFO_ROUTE_SLUGS and handleSpaLinkClick from ./navHelpers.ts; depends on getInfoPageDocument from ./locales/infoPages.ts
 * [OUTPUT]: exports InfoPageContent component and InfoPageContentProps type
 * [POS]: dedicated editorial renderer within src/seo for /about, /privacy, and /terms trust pages across all 4 locales, consumed by ToolLandingPage.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { InfoPageSlug, ResolvedRoute } from './types.ts'
import { buildLocalizedPath, getRelatedRoutes } from './routes.ts'
import { getRouteCopy, getUiLabels } from './i18n.ts'
import { INFO_ROUTE_SLUGS, handleSpaLinkClick } from './navHelpers.ts'
import { getInfoPageDocument } from './locales/infoPages.ts'

export interface InfoPageContentProps {
  route: ResolvedRoute
  theme: 'light' | 'dark'
  onNavigate: (path: string) => void
}

function toInfoSlug(slug: ResolvedRoute['slug']): InfoPageSlug {
  if (slug === 'privacy' || slug === 'terms') return slug
  return 'about'
}

export function InfoPageContent({
  route,
  theme,
  onNavigate,
}: InfoPageContentProps) {
  const isDark = theme === 'dark'
  const ui = getUiLabels(route.locale)
  const copy = getRouteCopy(route.locale, route.slug)
  const infoSlug = toInfoSlug(route.slug)
  const doc = getInfoPageDocument(route.locale, infoSlug)
  const relatedRoutes = getRelatedRoutes(route.slug, route.locale)
  const homeHref = buildLocalizedPath(route.locale, '')

  const headingCls = isDark ? 'text-zinc-50' : 'text-zinc-950'
  const bodyCls = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const mutedCls = 'text-muted'

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent-text">
            {copy.badge}
          </span>
          <time dateTime={doc.updatedDate} className={`font-mono text-xs ${mutedCls}`}>
            {doc.updatedDate}
          </time>
        </div>
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${headingCls}`}>
          {copy.h1}
        </h1>
        <p className={`max-w-[65ch] text-base leading-relaxed ${bodyCls}`}>
          {doc.summary}
        </p>

        {/* Cross-navigation between About / Privacy / Terms */}
        <nav aria-label={doc.eyebrowLabel} className="flex flex-wrap items-center gap-2 pt-2">
          {INFO_ROUTE_SLUGS.map((slug) => {
            const href = buildLocalizedPath(route.locale, slug)
            const itemCopy = getRouteCopy(route.locale, slug)
            const isCurrent = slug === infoSlug
            return (
              <a
                key={slug}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isCurrent
                    ? 'border-accent/50 bg-accent-soft text-accent-text'
                    : isDark
                      ? 'border-border bg-panel text-zinc-200 hover:border-accent/40 hover:text-white'
                      : 'border-border bg-panel text-zinc-700 hover:border-accent/40 hover:text-zinc-950'
                }`}
              >
                {itemCopy.navLabel}
              </a>
            )
          })}
        </nav>
      </header>

      {/* Main editorial sections */}
      <div className="space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className={`text-xl font-semibold tracking-tight ${headingCls}`}>
              {section.heading}
            </h2>
            <p className={`max-w-[65ch] text-sm leading-relaxed sm:text-base ${bodyCls}`}>
              {section.body}
            </p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="space-y-2 pt-1">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className={`flex items-start gap-2.5 text-sm leading-relaxed ${bodyCls}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-1 h-4 w-4 shrink-0 text-success"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 5" />
                    </svg>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Open-source verification & navigation strip */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-panel p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className={`text-base font-semibold ${headingCls}`}>
            {ui.footerOpenSource}
          </h2>
          <p className={`text-sm ${mutedCls}`}>
            https://github.com/imwarn/moklu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://github.com/imwarn/moklu"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-fg transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{doc.githubCtaLabel}</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href={homeHref}
            onClick={(event) => handleSpaLinkClick(event, homeHref, onNavigate)}
            className={`inline-flex items-center whitespace-nowrap rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isDark
                ? 'bg-surface text-zinc-200 hover:bg-zinc-900 hover:text-white'
                : 'bg-surface text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            {doc.backToToolsLabel}
          </a>
        </div>
      </section>

      {/* Native <details>/<summary> FAQ */}
      {copy.faqs.length > 0 && (
        <section aria-labelledby="info-faq-heading" className="space-y-4">
          <h2 id="info-faq-heading" className={`text-xl font-bold tracking-tight ${headingCls}`}>
            {ui.faqHeading}
          </h2>
          <div
            className={`divide-y overflow-hidden rounded-2xl border border-border ${
              isDark ? 'divide-white/10' : 'divide-zinc-200/70'
            }`}
          >
            {copy.faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0} className="group bg-panel">
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
                <div className={`px-5 pb-5 text-sm leading-relaxed sm:px-6 ${mutedCls}`}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related tools strip */}
      <section aria-labelledby="info-related-heading" className="space-y-4">
        <h2 id="info-related-heading" className={`text-lg font-semibold tracking-tight ${headingCls}`}>
          {ui.relatedToolsHeading}
        </h2>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {relatedRoutes.map((rel) => {
            const relCopy = getRouteCopy(rel.locale, rel.slug)
            return (
              <a
                key={rel.path}
                href={rel.path}
                onClick={(event) => handleSpaLinkClick(event, rel.path, onNavigate)}
                className={`group flex items-start justify-between gap-4 border-t border-border px-2 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-100/60'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <h3 className={`text-sm font-semibold transition-colors group-hover:text-accent-text ${headingCls}`}>
                    {relCopy.navLabel}
                  </h3>
                  <p className={`line-clamp-2 text-xs leading-relaxed ${mutedCls}`}>
                    {relCopy.metaDescription}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 text-sm transition-transform group-hover:translate-x-1 group-hover:text-accent-text ${mutedCls}`}
                >
                  →
                </span>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
