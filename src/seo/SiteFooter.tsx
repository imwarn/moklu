/**
 * [INPUT]: depends on ResolvedRoute and RouteSlug from ./types.ts; depends on buildLocalizedPath and getHreflangCode from ./routes.ts; depends on SUPPORTED_LOCALES, getRouteCopy, and getUiLabels from ./i18n.ts; depends on FOOTER_LINK_GROUPS, INFO_ROUTE_SLUGS, and handleSpaLinkClick from ./navHelpers.ts
 * [OUTPUT]: exports SiteFooter component and SiteFooterProps type
 * [POS]: bottom semantic footer within src/seo, exposing complete categorized internal tool links, /about, /privacy, /terms trust links, 4-locale alternate links, local-first trust note, and open-source link
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute, RouteSlug } from './types.ts'
import { buildLocalizedPath, getHreflangCode } from './routes.ts'
import { SUPPORTED_LOCALES, getRouteCopy, getUiLabels } from './i18n.ts'
import { FOOTER_LINK_GROUPS, INFO_ROUTE_SLUGS, handleSpaLinkClick } from './navHelpers.ts'

export interface SiteFooterProps {
  route: ResolvedRoute
  theme: 'light' | 'dark'
  onNavigate: (path: string) => void
}

export function SiteFooter({ route, theme, onNavigate }: SiteFooterProps) {
  const isDark = theme === 'dark'
  const ui = getUiLabels(route.locale)

  const renderGroup = (title: string, slugs: readonly RouteSlug[]) => (
    <div className="space-y-3">
      <h3
        className={`text-xs font-semibold tracking-tight ${
          isDark ? 'text-zinc-300' : 'text-zinc-900'
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {slugs.map((slug) => {
          const href = buildLocalizedPath(route.locale, slug)
          const itemCopy = getRouteCopy(route.locale, slug)
          const active = slug === route.slug
          return (
            <li key={slug || 'home'}>
              <a
                href={href}
                onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                className={`text-sm transition-colors ${
                  active
                    ? 'font-medium text-accent-text'
                    : isDark
                      ? 'text-muted hover:text-zinc-100'
                      : 'text-muted hover:text-zinc-950'
                }`}
              >
                {itemCopy.navLabel}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <footer
      className={`border-t border-border bg-surface transition-colors ${
        isDark ? 'text-zinc-300' : 'text-zinc-700'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-[max(3rem,calc(2rem+env(safe-area-inset-bottom,0px)))] sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand summary */}
          <div className="space-y-3 lg:col-span-2">
            <a
              href={buildLocalizedPath(route.locale, '')}
              onClick={(event) =>
                handleSpaLinkClick(event, buildLocalizedPath(route.locale, ''), onNavigate)
              }
              className={`inline-flex items-center gap-2 text-base font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-zinc-950'
              }`}
            >
              <span>{ui.brandName}</span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {ui.footerDescription}
            </p>
            <p
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                isDark
                  ? 'border-success/30 bg-success/12 text-success'
                  : 'border-success/30 bg-panel text-success'
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
              <span>{ui.footerLocalFirstNote}</span>
            </p>
          </div>

          {renderGroup(ui.footerGroups.mockups, FOOTER_LINK_GROUPS.mockups)}
          {renderGroup(ui.footerGroups.mergeSplit, FOOTER_LINK_GROUPS.mergeSplit)}
          {renderGroup(ui.footerGroups.optimizeResize, FOOTER_LINK_GROUPS.optimizeResize)}
          {renderGroup(ui.footerGroups.documentsStudio, FOOTER_LINK_GROUPS.documentsStudio)}
        </div>

        {/* Bottom bar with trust links, repo link & language alternates */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{ui.footerCopyright}</span>
            {INFO_ROUTE_SLUGS.map((slug) => {
              const href = buildLocalizedPath(route.locale, slug)
              const itemCopy = getRouteCopy(route.locale, slug)
              const active = slug === route.slug
              return (
                <a
                  key={slug}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                  className={`transition-colors ${
                    active
                      ? 'font-semibold text-accent-text'
                      : isDark
                        ? 'hover:text-zinc-200'
                        : 'hover:text-zinc-900'
                  }`}
                >
                  {itemCopy.navLabel}
                </a>
              )
            })}
            <a
              href="https://github.com/imwarn/moklu"
              target="_blank"
              rel="noreferrer"
              className={isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-900'}
            >
              {ui.footerOpenSource} ↗
            </a>
          </div>

          <nav aria-label={ui.footerLanguages} className="flex flex-wrap items-center gap-3">
            {SUPPORTED_LOCALES.map((item) => {
              const href = buildLocalizedPath(item.code, route.slug)
              const isCurrent = item.code === route.locale
              return (
                <a
                  key={item.code}
                  href={href}
                  hrefLang={getHreflangCode(item.code)}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                  className={`transition-colors ${
                    isCurrent
                      ? 'font-semibold text-accent-text'
                      : isDark
                        ? 'hover:text-zinc-100'
                        : 'hover:text-zinc-950'
                  }`}
                >
                  {item.nativeName}
                </a>
              )
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
