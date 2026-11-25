/**
 * [INPUT]: depends on react (lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState), resolvePathname/buildLocalizedPath/useSeoHead from @/seo, hasSeoLocale/preloadSeoLocale from @/seo/i18n, hasWorkspaceLocale/preloadWorkspaceLocale from @/workspace/i18n, hasWorkspaceTool/preloadWorkspaceTool from @/workspace/QuickWorkspace, applyDocumentTheme from @/theme/themeStore, ChunkErrorBoundary from @/components/common/ChunkErrorBoundary, ToolLandingPage from @/pages/ToolLandingPage, lazy-loaded StudioPage from @/pages/StudioPage, and Studio-only dynamic import of @/utils/fonts
 * [OUTPUT]: exports default App SPA router mapping '/', localized SEO/info/404 fallback slugs to ToolLandingPage and '/studio' (plus '/<locale>/studio') to lazy-loaded StudioPage with pre-navigation locale/tool chunk preloading (skipping QuickWorkspace chunks on Studio/info/404 fallback routes), race-safe transitions, and pre-paint dark theme lock wrapped in ChunkErrorBoundary
 * [POS]: root router shell of src/; ensures landing and 404 routes render instantaneously without loading Konva, Studio stores, editor font sheets, or inactive locales/tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buildLocalizedPath, resolvePathname, useSeoHead, type ResolvedRoute } from '@/seo'
import { hasSeoLocale, preloadSeoLocale } from '@/seo/i18n'
import { applyDocumentTheme } from '@/theme/themeStore'
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary'
import { ToolLandingPage } from '@/pages/ToolLandingPage'
import { hasWorkspaceLocale, preloadWorkspaceLocale } from '@/workspace/i18n'
import { hasWorkspaceTool, preloadWorkspaceTool } from '@/workspace/QuickWorkspace'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const StudioPage = lazy(() =>
  import('@/pages/StudioPage').then((m) => ({ default: m.StudioPage })),
)

function readCurrentPathname(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
}

function needsRoutePreload(route: ResolvedRoute): boolean {
  if (!hasSeoLocale(route.locale)) return true
  if (!route.isStudio && !route.isInfoPage && !route.isFallback) {
    if (!hasWorkspaceLocale(route.locale) || !hasWorkspaceTool(route.tool)) {
      return true
    }
  }
  return false
}

async function preloadRouteAssets(route: ResolvedRoute): Promise<void> {
  const tasks: Array<Promise<unknown>> = []
  if (!hasSeoLocale(route.locale)) {
    tasks.push(preloadSeoLocale(route.locale))
  }
  if (!route.isStudio && !route.isInfoPage && !route.isFallback) {
    if (!hasWorkspaceLocale(route.locale)) {
      tasks.push(preloadWorkspaceLocale(route.locale))
    }
    if (!hasWorkspaceTool(route.tool)) {
      tasks.push(preloadWorkspaceTool(route.tool))
    }
  }
  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
}

function StudioRouteShell({
  route,
  onNavigate,
}: {
  route: ResolvedRoute
  onNavigate: (path: string) => void
}) {
  useSeoHead(route)
  const homeHref = buildLocalizedPath(route.locale, '')

  useIsomorphicLayoutEffect(() => {
    applyDocumentTheme('dark', 'studio')
    document.documentElement.dataset.surface = 'studio'
  }, [])

  useEffect(() => {
    void import('@/utils/fonts').then((m) => m.loadGoogleFonts())
  }, [])

  return (
    <ChunkErrorBoundary
      locale={route.locale}
      homeHref={homeHref}
      onNavigateHome={() => onNavigate(homeHref)}
    >
      <Suspense
        fallback={
          <div className="flex h-[100dvh] w-full items-center justify-center bg-[#09090b] text-sm text-[#a1a1aa]">
            Loading Moklu Studio…
          </div>
        }
      >
        <StudioPage locale={route.locale} onNavigate={onNavigate} />
      </Suspense>
    </ChunkErrorBoundary>
  )
}

export default function App() {
  const [pathname, setPathname] = useState<string>(readCurrentPathname)
  const navSeqRef = useRef(0)

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = readCurrentPathname()
      const nextRoute = resolvePathname(nextPath)
      const seq = ++navSeqRef.current

      if (!needsRoutePreload(nextRoute)) {
        setPathname(nextPath)
        return
      }

      void preloadRouteAssets(nextRoute)
        .then(() => {
          if (navSeqRef.current === seq) {
            setPathname(nextPath)
          }
        })
        .catch((err) => {
          console.error(`[Moklu] Failed to preload route "${nextPath}":`, err)
          if (navSeqRef.current === seq) {
            setPathname(nextPath)
          }
        })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((nextPath: string) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
    const nextRoute = resolvePathname(normalized)
    const seq = ++navSeqRef.current

    const commit = () => {
      if (navSeqRef.current !== seq) return
      if (typeof window !== 'undefined' && window.location.pathname !== normalized) {
        window.history.pushState(null, '', normalized)
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
      setPathname(normalized)
    }

    if (!needsRoutePreload(nextRoute)) {
      commit()
      return
    }

    void preloadRouteAssets(nextRoute)
      .then(commit)
      .catch((err) => {
        console.error(`[Moklu] Failed to preload route "${normalized}":`, err)
        commit()
      })
  }, [])

  const route = resolvePathname(pathname)

  if (route.isStudio) {
    return <StudioRouteShell route={route} onNavigate={navigate} />
  }

  return <ToolLandingPage route={route} onNavigate={navigate} />
}
