/**
 * [INPUT]: depends on useEffect, useRef, useState from react; depends on ResolvedRoute from ./types.ts; depends on PRIMARY_TOOL_SLUGS and buildLocalizedPath from ./routes.ts; depends on SUPPORTED_LOCALES and getUiLabels from ./i18n.ts; depends on NAV_TOOL_ORDER and handleSpaLinkClick from ./navHelpers.ts
 * [OUTPUT]: exports SiteHeader component and SiteHeaderProps type
 * [POS]: top-level semantic site navigation bar within src/seo, rendering crawlable tool category links, 4-locale switcher, theme toggle, Pro CTA, and Studio link
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEffect, useRef, useState } from 'react'
import type { ResolvedRoute } from './types.ts'
import { PRIMARY_TOOL_SLUGS, buildLocalizedPath } from './routes.ts'
import { SUPPORTED_LOCALES, getUiLabels } from './i18n.ts'
import { NAV_TOOL_ORDER, handleSpaLinkClick } from './navHelpers.ts'

export interface SiteHeaderProps {
  route: ResolvedRoute
  theme: 'light' | 'dark'
  onNavigate: (path: string) => void
  onToggleTheme: () => void
  onOpenProModal?: () => void
  isPro?: boolean
}

export function SiteHeader({
  route,
  theme,
  onNavigate,
  onToggleTheme,
  onOpenProModal,
  isPro = false,
}: SiteHeaderProps) {
  const ui = getUiLabels(route.locale)
  const isDark = theme === 'dark'
  const [langOpen, setLangOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const langRef = useRef<HTMLDivElement | null>(null)

  const homeHref = buildLocalizedPath(route.locale, '')
  const studioHref = buildLocalizedPath(route.locale, 'studio')
  const activeLocaleMeta =
    SUPPORTED_LOCALES.find((item) => item.code === route.locale) ?? SUPPORTED_LOCALES[0]

  useEffect(() => {
    if (!langOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLangOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [langOpen])

  const surfaceCls = isDark
    ? 'bg-[#0f0f13]/85 border-white/10 text-zinc-100'
    : 'bg-white/85 border-zinc-200/80 text-zinc-900'

  const subtleBtnCls = isDark
    ? 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.09] hover:text-white'
    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${surfaceCls}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <a
            href={homeHref}
            onClick={(event) => {
              setMobileOpen(false)
              handleSpaLinkClick(event, homeHref, onNavigate)
            }}
            className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 36 36"
              fill="none"
              className="h-8 w-8 shrink-0"
            >
              <defs>
                <linearGradient id="moklu-header-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect
                x="2.5"
                y="5"
                width="29"
                height="26"
                rx="6.5"
                stroke="url(#moklu-header-grad)"
                strokeWidth="2.8"
              />
              <path
                d="M9.5 24.5V15l7.5 5.5 7.5-11v15"
                stroke="url(#moklu-header-grad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="29" cy="7.5" r="3" fill="#f59e0b" />
            </svg>
            <span className="text-lg font-bold tracking-tight">
              {ui.brandName}
            </span>
          </a>

          {/* Primary desktop tool navigation */}
          <nav
            aria-label="Primary tools"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_TOOL_ORDER.map((toolId) => {
              const targetSlug = PRIMARY_TOOL_SLUGS[toolId]
              const href = buildLocalizedPath(route.locale, targetSlug)
              const isActive =
                !route.isStudio &&
                ((route.slug === '' && toolId === 'mockup') ||
                  (route.slug !== '' && route.tool === toolId))

              return (
                <a
                  key={toolId}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-violet-500/20 text-violet-200'
                        : 'bg-violet-50 text-violet-700'
                      : isDark
                        ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  {ui.navCategories[toolId]}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Locale switcher with real crawlable anchor links */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              aria-label={ui.languageLabel}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${subtleBtnCls}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4 opacity-75"
              >
                <circle cx="10" cy="10" r="7.5" />
                <path d="M2.8 10h14.4M10 2.5c2.2 2.2 3.2 4.8 3.2 7.5s-1 5.3-3.2 7.5c-2.2-2.2-3.2-4.8-3.2-7.5S7.8 4.7 10 2.5Z" />
              </svg>
              <span>{activeLocaleMeta.shortLabel}</span>
            </button>

            {langOpen && (
              <div
                role="menu"
                aria-label={ui.languageLabel}
                className={`absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border p-1 shadow-xl ${
                  isDark
                    ? 'border-white/10 bg-[#18181f] text-zinc-100'
                    : 'border-zinc-200 bg-white text-zinc-900'
                }`}
              >
                {SUPPORTED_LOCALES.map((item) => {
                  const href = buildLocalizedPath(item.code, route.slug)
                  const active = item.code === route.locale
                  return (
                    <a
                      key={item.code}
                      href={href}
                      hrefLang={item.code}
                      role="menuitem"
                      aria-current={active ? 'true' : undefined}
                      onClick={(event) => {
                        setLangOpen(false)
                        handleSpaLinkClick(event, href, onNavigate)
                      }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? isDark
                            ? 'bg-violet-500/20 text-violet-200'
                            : 'bg-violet-50 text-violet-700'
                          : isDark
                            ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                      }`}
                    >
                      <span>{item.nativeName}</span>
                      <span className="text-[10px] uppercase opacity-60">{item.code}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={ui.toggleThemeAria}
            title={isDark ? ui.themeLight : ui.themeDark}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${subtleBtnCls}`}
          >
            {isDark ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <circle cx="10" cy="10" r="3.5" />
                <path
                  strokeLinecap="round"
                  d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.2 12.6A6.5 6.5 0 0 1 7.4 3.8a6.8 6.8 0 1 0 8.8 8.8Z"
                />
              </svg>
            )}
          </button>

          {/* Pro button */}
          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className={`hidden h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors sm:inline-flex ${
                isPro
                  ? isDark
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : isDark
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
                    : 'border-amber-300/80 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              <span>{isPro ? ui.proActive : ui.proUpgrade}</span>
            </button>
          )}

          {/* Studio CTA */}
          <a
            href={studioHref}
            onClick={(event) => {
              setMobileOpen(false)
              handleSpaLinkClick(event, studioHref, onNavigate)
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <span className="hidden sm:inline">{ui.openStudio}</span>
            <span className="sm:hidden">{ui.openStudioShort}</span>
            <span aria-hidden="true">↗</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={ui.menuToggleAria}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border lg:hidden ${subtleBtnCls}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" d="M5 5l10 10M15 5 5 15" />
              ) : (
                <path strokeLinecap="round" d="M3.5 6h13M3.5 10h13M3.5 14h13" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile tools"
          className={`border-t px-4 py-3 lg:hidden ${
            isDark ? 'border-white/10 bg-[#14141b]' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_TOOL_ORDER.map((toolId) => {
              const href = buildLocalizedPath(route.locale, PRIMARY_TOOL_SLUGS[toolId])
              const isActive = !route.isStudio && route.tool === toolId && route.slug !== ''
              return (
                <a
                  key={toolId}
                  href={href}
                  onClick={(event) => {
                    setMobileOpen(false)
                    handleSpaLinkClick(event, href, onNavigate)
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? isDark
                        ? 'bg-violet-500/20 text-violet-200'
                        : 'bg-violet-100 text-violet-800'
                      : isDark
                        ? 'text-zinc-200 hover:bg-white/[0.06]'
                        : 'text-zinc-700 hover:bg-zinc-200/70'
                  }`}
                >
                  {ui.navCategories[toolId]}
                </a>
              )
            })}
          </div>
          {onOpenProModal && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                onOpenProModal()
              }}
              className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:hidden ${
                isDark
                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}
            >
              <span>{isPro ? ui.proActive : ui.proUpgrade}</span>
            </button>
          )}
        </nav>
      )}
    </header>
  )
}
