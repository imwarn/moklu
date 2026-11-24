/**
 * [INPUT]: depends on react (Suspense, lazy, useCallback, useEffect, useMemo, useState), src/seo (InfoPageContent, SiteHeader, SeoLandingSections, SiteFooter, useSeoHead, getRouteCopy, buildLocalizedPath, ResolvedRoute), src/workspace (QuickWorkspace, StudioHandoffPayload), src/workspace/engineAdapter (createToolsWorkspaceEngines), dynamic import of @/bridge/studioHandoff (stageImagesIntoStudioAfterBootstrap), src/commercial/entitlements (isEffectivePro, useEntitlementStore), lazy-loaded @/commercial/PricingModal, src/theme/themeStore (applyDocumentTheme, useThemeStore), trackFunnelEvent from @/utils/telemetry, and PhoneModel from @/types
 * [OUTPUT]: exports ToolLandingPage component rendering the zero-splash above-the-fold QuickWorkspace (or editorial InfoPageContent on /about, /privacy, /terms), localized SEO sections, adaptive Light/Dark chrome, funnel telemetry, on-demand PricingModal, and lazy Studio handoff
 * [POS]: primary landing page in src/pages; serves '/', all SEO tool routes, and /about, /privacy, /terms across en/zh/ja/ko without loading Konva or Studio stores
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { isEffectivePro, useEntitlementStore } from '@/commercial/entitlements'
import {
  InfoPageContent,
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
import { trackFunnelEvent } from '@/utils/telemetry'
import { QuickWorkspace, type StudioHandoffPayload as WorkspaceHandoffPayload } from '@/workspace'
import { createToolsWorkspaceEngines } from '@/workspace/engineAdapter'

const PricingModal = lazy(() =>
  import('@/commercial/PricingModal').then((m) => ({ default: m.PricingModal })),
)

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

  useEffect(() => {
    if (route.isInfoPage) return
    trackFunnelEvent('tool_view', {
      tool: route.tool,
      slug: route.slug || 'home',
      locale: route.locale,
    })
  }, [route.isInfoPage, route.locale, route.slug, route.tool])

  const handleOpenProModal = useCallback(() => {
    trackFunnelEvent('pro_cta_clicked', {
      tool: route.tool,
      slug: route.slug || 'home',
      locale: route.locale,
    })
    setPricingOpen(true)
  }, [route.locale, route.slug, route.tool])

  const handleOpenInStudio = useCallback(
    (payload: WorkspaceHandoffPayload) => {
      trackFunnelEvent('studio_handoff', {
        tool: route.tool,
        mode: payload.mode ?? 'canvas',
        locale: route.locale,
      })
      void import('@/bridge/studioHandoff')
        .then(({ stageImagesIntoStudioAfterBootstrap }) =>
          stageImagesIntoStudioAfterBootstrap({
            ...payload,
            mockupModel: toPhoneModel(payload.mockupModel),
          }),
        )
        .then(() => {
          onNavigate(buildLocalizedPath(route.locale, 'studio'))
        })
        .catch((err) => {
          console.error('[Moklu] Studio handoff failed:', err)
        })
    },
    [onNavigate, route.locale, route.tool],
  )

  return (
    <div
      data-testid="tool-landing-page"
      data-theme={resolvedTheme}
      className={`min-h-[100dvh] flex flex-col bg-surface transition-colors ${
        isDark ? 'text-zinc-100' : 'text-zinc-950'
      }`}
    >
      <SiteHeader
        route={route}
        theme={resolvedTheme}
        onNavigate={onNavigate}
        onToggleTheme={toggleTheme}
        onOpenProModal={handleOpenProModal}
        isPro={isPro}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {route.isInfoPage ? (
          <InfoPageContent
            route={route}
            theme={resolvedTheme}
            onNavigate={onNavigate}
          />
        ) : (
          <>
            {/* Compact Above-the-Fold Hero + Instant 6-Tool Workspace */}
            <section className="mx-auto max-w-7xl px-3 pt-5 pb-8 sm:px-6 sm:pt-6 lg:px-8">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl space-y-1.5">
                  <span
                    className="inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent-text"
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
                  <p className="text-sm text-muted sm:text-base">
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
                onOpenProModal={handleOpenProModal}
              />
            </section>

            <SeoLandingSections
              route={route}
              theme={resolvedTheme}
              onNavigate={onNavigate}
              onOpenProModal={handleOpenProModal}
              isPro={isPro}
            />
          </>
        )}
      </main>

      <SiteFooter
        route={route}
        theme={resolvedTheme}
        onNavigate={onNavigate}
      />

      {pricingOpen && (
        <Suspense fallback={null}>
          <PricingModal
            open={pricingOpen}
            onClose={() => setPricingOpen(false)}
            locale={route.locale}
            theme={resolvedTheme}
          />
        </Suspense>
      )}
    </div>
  )
}
