/**
 * [INPUT]: depends on ResolvedRoute and RouteSlug from ./types.ts; depends on buildLocalizedPath from ./routes.ts; depends on SUPPORTED_LOCALES, getRouteCopy, and getUiLabels from ./i18n.ts; depends on FOOTER_LINK_GROUPS and handleSpaLinkClick from ./navHelpers.ts
 * [OUTPUT]: exports SiteFooter component and SiteFooterProps type
 * [POS]: bottom semantic footer within src/seo, exposing complete categorized internal tool links, 4-locale alternate links, local-first trust note, and open-source link
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { ResolvedRoute, RouteSlug } from './types.ts'
import { buildLocalizedPath } from './routes.ts'
import { SUPPORTED_LOCALES, getRouteCopy, getUiLabels } from './i18n.ts'
import { FOOTER_LINK_GROUPS, handleSpaLinkClick } from './navHelpers.ts'

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
        className={`text-xs font-semibold uppercase tracking-wider ${
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
                    ? isDark
                      ? 'font-medium text-violet-300'
                      : 'font-medium text-violet-700'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-950'
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
      className={`border-t transition-colors ${
        isDark
          ? 'border-white/10 bg-[#0b0b0f] text-zinc-300'
          : 'border-zinc-200 bg-zinc-50 text-zinc-700'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
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
            <p
              className={`max-w-xs text-sm leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {ui.footerDescription}
            </p>
            <p
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                isDark
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{ui.footerLocalFirstNote}</span>
            </p>
          </div>

          {renderGroup(ui.footerGroups.mockups, FOOTER_LINK_GROUPS.mockups)}
          {renderGroup(ui.footerGroups.mergeSplit, FOOTER_LINK_GROUPS.mergeSplit)}
          {renderGroup(ui.footerGroups.optimizeResize, FOOTER_LINK_GROUPS.optimizeResize)}
          {renderGroup(ui.footerGroups.documentsStudio, FOOTER_LINK_GROUPS.documentsStudio)}
        </div>

        {/* Bottom bar with language alternates & repo link */}
        <div
          className={`mt-10 flex flex-col gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${
            isDark ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{ui.footerCopyright}</span>
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
                  hrefLang={item.code}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                  className={`transition-colors ${
                    isCurrent
                      ? isDark
                        ? 'font-semibold text-violet-300'
                        : 'font-semibold text-violet-700'
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
