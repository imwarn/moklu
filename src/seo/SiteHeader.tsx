/**
 * [INPUT]: depends on useEffect, useRef, useState from react; depends on ResolvedRoute from ./types.ts; depends on PRIMARY_TOOL_SLUGS, buildLocalizedPath, and getHreflangCode from ./routes.ts; depends on SUPPORTED_LOCALES and getUiLabels from ./i18n.ts; depends on NAV_TOOL_ORDER, handleSpaLinkClick, and isToolNavActive from ./navHelpers.ts
 * [OUTPUT]: exports SiteHeader component and SiteHeaderProps type
 * [POS]: top-level semantic site navigation bar within src/seo, rendering skip-to-content link, crawlable tool category nav (exact-URL aria-current="page" separated from category pill highlight), accessible mobile drawer, 4-locale switcher, theme toggle, Pro CTA, and Studio link
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useEffect, useRef, useState } from 'react'
import type { ResolvedRoute } from './types.ts'
import { PRIMARY_TOOL_SLUGS, buildLocalizedPath, getHreflangCode } from './routes.ts'
import { SUPPORTED_LOCALES, getUiLabels } from './i18n.ts'
import { NAV_TOOL_ORDER, handleSpaLinkClick, isToolNavActive } from './navHelpers.ts'

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
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

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

  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  const surfaceCls = isDark
    ? 'bg-surface/85 border-border text-zinc-100'
    : 'bg-panel/85 border-border text-zinc-900'

  const subtleBtnCls = isDark
    ? 'border-border bg-white/[0.04] text-zinc-200 hover:bg-white/[0.09] hover:text-white'
    : 'border-border bg-surface text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'

  const proBtnToneCls = isPro
    ? isDark
      ? 'border-success/40 bg-success/12 text-success'
      : 'border-success/35 bg-panel text-success'
    : isDark
      ? 'border-warning/35 bg-warning/12 text-warning hover:bg-warning/20'
      : 'border-warning/35 bg-panel text-warning hover:bg-warning/[0.06]'

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${surfaceCls}`}
    >
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent ${
          isDark ? 'focus:text-zinc-50' : 'focus:text-zinc-950'
        }`}
      >
        {ui.skipToContent}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <a
            href={homeHref}
            aria-label={ui.brandName}
            onClick={(event) => {
              setMobileOpen(false)
              handleSpaLinkClick(event, homeHref, onNavigate)
            }}
            className="group flex shrink-0 items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-2.5"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 32 32"
              fill="none"
              className="h-8 w-8 shrink-0"
            >
              <path
                fill="currentColor"
                d="M6 8a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4v-4h-4v4H6V12h4V8H6Z"
              />
              <rect fill="var(--color-accent)" x="12" y="2" width="18" height="18" rx="4" />
              <rect fill="var(--color-accent-fg)" x="18" y="6" width="6" height="2" rx="1" />
            </svg>
            <span className="hidden text-lg font-bold tracking-tight min-[350px]:inline">
              {ui.brandName}
            </span>
          </a>

          {/* Primary desktop tool navigation */}
          <nav
            aria-label={ui.primaryNavAria}
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_TOOL_ORDER.map((toolId) => {
              const targetSlug = PRIMARY_TOOL_SLUGS[toolId]
              const href = buildLocalizedPath(route.locale, targetSlug)
              const isActive = isToolNavActive(route, toolId)

              return (
                <a
                  key={toolId}
                  href={href}
                  aria-current={route.slug === targetSlug ? 'page' : undefined}
                  onClick={(event) => handleSpaLinkClick(event, href, onNavigate)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'bg-accent-soft text-accent-text'
                      : isDark
                        ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        : 'text-muted hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  {ui.navCategories[toolId]}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Locale switcher with real crawlable anchor links */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              aria-label={ui.languageLabel}
              className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-1.5 sm:px-2.5 ${subtleBtnCls}`}
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
                className={`absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-panel p-1 ${
                  isDark
                    ? 'text-zinc-100 shadow-[0_18px_40px_-16px_rgba(9,9,11,0.85)]'
                    : 'text-zinc-900 shadow-[0_18px_40px_-16px_rgba(24,24,27,0.16)]'
                }`}
              >
                {SUPPORTED_LOCALES.map((item) => {
                  const href = buildLocalizedPath(item.code, route.slug)
                  const active = item.code === route.locale
                  return (
                    <a
                      key={item.code}
                      href={href}
                      hrefLang={getHreflangCode(item.code)}
                      role="menuitem"
                      aria-current={active ? 'true' : undefined}
                      onClick={(event) => {
                        setLangOpen(false)
                        handleSpaLinkClick(event, href, onNavigate)
                      }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-accent-soft text-accent-text'
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
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${subtleBtnCls}`}
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
              className={`hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex ${proBtnToneCls}`}
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
            className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-accent-strong px-2.5 text-xs font-semibold text-accent-fg shadow-[0_1px_2px_rgba(24,24,27,0.1)] transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-1.5 sm:px-3.5"
          >
            <span className="hidden sm:inline">{ui.openStudio}</span>
            <span className="sm:hidden">{ui.openStudioShort}</span>
            <span aria-hidden="true">↗</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-tool-nav"
            aria-label={ui.menuToggleAria}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden ${subtleBtnCls}`}
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
          id="mobile-tool-nav"
          aria-label={ui.mobileNavAria}
          className="border-t border-border bg-panel px-3 py-3 sm:px-4 lg:hidden"
        >
          <div className="grid grid-cols-1 gap-1.5 min-[360px]:grid-cols-2">
            {NAV_TOOL_ORDER.map((toolId) => {
              const targetSlug = PRIMARY_TOOL_SLUGS[toolId]
              const href = buildLocalizedPath(route.locale, targetSlug)
              const isActive = isToolNavActive(route, toolId)
              return (
                <a
                  key={toolId}
                  href={href}
                  aria-current={route.slug === targetSlug ? 'page' : undefined}
                  onClick={(event) => {
                    setMobileOpen(false)
                    handleSpaLinkClick(event, href, onNavigate)
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'bg-accent-soft text-accent-text'
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
              className={`mt-2.5 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden ${proBtnToneCls}`}
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
              <span>{isPro ? ui.proActive : ui.proUpgrade}</span>
            </button>
          )}
        </nav>
      )}
    </header>
  )
}
