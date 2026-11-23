/**
 * [INPUT]: depends on react, src/seo (SiteHeader, SeoLandingSections, SiteFooter, useSeoHead, getRouteCopy, buildLocalizedPath, ResolvedRoute), src/workspace (QuickWorkspace, StudioHandoffPayload), src/workspace/engineAdapter (createToolsWorkspaceEngines), src/bridge/studioHandoff (stageImagesIntoStudio), src/commercial (PricingModal, isEffectivePro, useEntitlementStore), src/theme/themeStore (applyDocumentTheme, useThemeStore), and PhoneModel from @/types
 * [OUTPUT]: exports ToolLandingPage component rendering the zero-splash above-the-fold QuickWorkspace, localized SEO sections, adaptive Light/Dark chrome, PricingModal, and Studio handoff
 * [POS]: primary landing page in src/pages; serves '/' and all 18 SEO tool routes across en/zh/ja/ko without loading Konva
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { stageImagesIntoStudio } from '@/bridge/studioHandoff'
import { isEffectivePro, useEntitlementStore } from '@/commercial/entitlements'
import { PricingModal } from '@/commercial/PricingModal'
import {
  SeoLandingSections,
  SiteFooter,
  SiteHeader,
  buildLocalizedPath,
  getRouteCopy,
  useSeoHead,
  type ResolvedRoute,
} from '@/seo'
import { applyDocumentTheme, useThemeStore } from '@/theme/themeStore'
import type { PhoneModel } from '@/types'
import { QuickWorkspace, type StudioHandoffPayload as WorkspaceHandoffPayload } from '@/workspace'
import { createToolsWorkspaceEngines } from '@/workspace/engineAdapter'

const VALID_PHONE_MODELS = new Set<PhoneModel>([
  'iphone-16-pro',
  'iphone-16-pro-plain',
  'pixel-9',
  'pixel-9-plain',
  'apple-watch',
  'wear-os',
  'ipad-13',
  'android-tablet',
  'screen-16-9',
  'screen-16-10',
  'browser-chrome',
  'browser-safari',
  'browser-minimal',
])

function toPhoneModel(value?: string): PhoneModel | undefined {
  if (!value) return undefined
  return VALID_PHONE_MODELS.has(value as PhoneModel) ? (value as PhoneModel) : undefined
}

export interface ToolLandingPageProps {
  route: ResolvedRoute
  onNavigate: (path: string) => void
}

export function ToolLandingPage({ route, onNavigate }: ToolLandingPageProps) {
  useSeoHead(route)

  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const syncSystemTheme = useThemeStore((s) => s.syncSystemTheme)

  const tier = useEntitlementStore((s) => s.tier)
  const proPreviewEnabled = useEntitlementStore((s) => s.proPreviewEnabled)
  const isPro = isEffectivePro({ tier, proPreviewEnabled })

  const [pricingOpen, setPricingOpen] = useState(false)
  const engines = useMemo(() => createToolsWorkspaceEngines(), [])
  const copy = getRouteCopy(route.locale, route.slug)
  const isDark = resolvedTheme === 'dark'

  // Sync Light/Dark document theme and listen to OS preference changes.
  useEffect(() => {
    applyDocumentTheme(resolvedTheme, 'workspace')
    document.documentElement.dataset.surface = 'workspace'
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => syncSystemTheme(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [syncSystemTheme])

  const handleOpenInStudio = useCallback(
    (payload: WorkspaceHandoffPayload) => {
      stageImagesIntoStudio({
        images: payload.images,
        mode: payload.mode,
        mockupModel: toPhoneModel(payload.mockupModel),
        slideWidth: payload.slideWidth,
        slideHeight: payload.slideHeight,
      })
      onNavigate(buildLocalizedPath(route.locale, 'studio'))
    },
    [onNavigate, route.locale],
  )

  return (
    <div
      data-testid="tool-landing-page"
      data-theme={resolvedTheme}
      className={`min-h-screen flex flex-col transition-colors ${
        isDark
          ? 'bg-[#0b0b10] text-zinc-100'
          : 'bg-[#f8f9fc] text-zinc-950'
      }`}
    >
      <SiteHeader
        route={route}
        theme={resolvedTheme}
        onNavigate={onNavigate}
        onToggleTheme={toggleTheme}
        onOpenProModal={() => setPricingOpen(true)}
        isPro={isPro}
      />

      <main id="main-content" className="flex-1">
        {/* Compact Above-the-Fold Hero + Instant 6-Tool Workspace */}
        <section className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-1.5">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                  isDark
                    ? 'border-violet-400/30 bg-violet-500/10 text-violet-300'
                    : 'border-violet-200 bg-violet-50 text-violet-700'
                }`}
              >
                {copy.badge}
              </span>
              <h1
                className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                  isDark ? 'text-zinc-50' : 'text-zinc-950'
                }`}
              >
                {copy.h1}
              </h1>
              <p className={`text-sm sm:text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {copy.subtitle}
              </p>
            </div>
          </div>

          <QuickWorkspace
            key={route.slug}
            preset={route.preset}
            locale={route.locale}
            theme={resolvedTheme}
            engines={engines}
            onOpenInStudio={handleOpenInStudio}
            onOpenProModal={() => setPricingOpen(true)}
          />
        </section>

        <SeoLandingSections
          route={route}
          theme={resolvedTheme}
          onNavigate={onNavigate}
          onOpenProModal={() => setPricingOpen(true)}
        />
      </main>

      <SiteFooter
        route={route}
        theme={resolvedTheme}
        onNavigate={onNavigate}
      />

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        locale={route.locale}
      />
    </div>
  )
}
