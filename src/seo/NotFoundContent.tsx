/**
 * [INPUT]: depends on ResolvedRoute from ./types.ts; depends on PRIMARY_TOOL_SLUGS and buildLocalizedPath from ./routes.ts; depends on getRouteCopy from ./i18n.ts; depends on NAV_TOOL_ORDER and handleSpaLinkClick from ./navHelpers.ts; depends on getNotFoundCopy and NotFoundCopy from ./notFoundCopy.ts
 * [OUTPUT]: exports NotFoundContent component, NotFoundContentProps type, and re-exports getNotFoundCopy and NotFoundCopy
 * [POS]: dedicated 4-locale Light/Dark 404 Not Found view within src/seo, offering Home/Studio navigation and an 8-tool local directory grid, consumed by ToolLandingPage.tsx and build-time dist/404.html SSG
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute } from './types.ts'
import { PRIMARY_TOOL_SLUGS, buildLocalizedPath } from './routes.ts'
import { getRouteCopy } from './i18n.ts'
import { NAV_TOOL_ORDER, handleSpaLinkClick } from './navHelpers.ts'
import { getNotFoundCopy, type NotFoundCopy } from './notFoundCopy.ts'

// eslint-disable-next-line react-refresh/only-export-components
export { getNotFoundCopy, type NotFoundCopy }

export interface NotFoundContentProps {
  route: ResolvedRoute
  theme: 'light' | 'dark'
  onNavigate: (path: string) => void
}

export function NotFoundContent({
  route,
  theme,
  onNavigate,
}: NotFoundContentProps) {
  const isDark = theme === 'dark'
  const copy = getNotFoundCopy(route.locale)
  const homeHref = buildLocalizedPath(route.locale, '')
  const studioHref = buildLocalizedPath(route.locale, 'studio')

  const headingCls = isDark ? 'text-zinc-50' : 'text-zinc-950'
  const bodyCls = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const mutedCls = 'text-muted'

  return (
    <div
      data-testid="not-found-page"
      className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6 lg:px-8"
    >
      {/* 404 Status Card */}
      <header className="space-y-5 rounded-2xl border border-border bg-panel p-6 sm:p-8">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-xs font-semibold tracking-wide text-accent-text">
            {copy.badge}
          </span>
        </div>

        <div className="space-y-2.5">
          <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${headingCls}`}>
            {copy.h1}
          </h1>
          <p className={`max-w-[65ch] text-base leading-relaxed ${bodyCls}`}>
            {copy.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={homeHref}
            onClick={(event) => handleSpaLinkClick(event, homeHref, onNavigate)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-fg transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {copy.homeCta}
          </a>
          <a
            href={studioHref}
            onClick={(event) => handleSpaLinkClick(event, studioHref, onNavigate)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isDark
                ? 'bg-surface text-zinc-200 hover:bg-zinc-900 hover:text-white'
                : 'bg-surface text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            {copy.studioCta}
          </a>
        </div>
      </header>

      {/* Primary Local Tools Grid */}
      <section aria-labelledby="not-found-tools-heading" className="space-y-4">
        <h2
          id="not-found-tools-heading"
          className={`text-lg font-semibold tracking-tight ${headingCls}`}
        >
          {copy.toolsHeading}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_TOOL_ORDER.map((toolId) => {
            const slug = PRIMARY_TOOL_SLUGS[toolId]
            const href = buildLocalizedPath(route.locale, slug)
            const toolCopy = getRouteCopy(route.locale, slug)
            return (
              <a
                key={toolId}
                href={href}
                onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                className={`group flex flex-col justify-between gap-2 rounded-xl border border-border bg-panel p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isDark
                    ? 'hover:border-accent/40 hover:bg-white/[0.03]'
                    : 'hover:border-accent/40 hover:bg-zinc-100/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm font-semibold transition-colors group-hover:text-accent-text ${headingCls}`}
                  >
                    {toolCopy.navLabel}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-sm transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text ${mutedCls}`}
                  >
                    →
                  </span>
                </div>
                <span className={`text-xs leading-relaxed ${mutedCls}`}>
                  {toolCopy.badge}
                </span>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
