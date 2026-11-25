/**
 * [INPUT]: depends on react (lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState), resolvePathname/buildLocalizedPath/useSeoHead from @/seo, applyDocumentTheme from @/theme/themeStore, ChunkErrorBoundary from @/components/common/ChunkErrorBoundary, ToolLandingPage from @/pages/ToolLandingPage, lazy-loaded StudioPage from @/pages/StudioPage, and Studio-only dynamic import of @/utils/fonts
 * [OUTPUT]: exports default App SPA router mapping '/' and localized SEO tool slugs to ToolLandingPage and '/studio' (plus '/<locale>/studio') to lazy-loaded StudioPage with pre-paint dark theme lock wrapped in ChunkErrorBoundary
 * [POS]: root router shell of src/; ensures landing routes render instantaneously without loading Konva, Studio stores, or editor font sheets
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { buildLocalizedPath, resolvePathname, useSeoHead, type ResolvedRoute } from '@/seo'
import { applyDocumentTheme } from '@/theme/themeStore'
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary'
import { ToolLandingPage } from '@/pages/ToolLandingPage'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const StudioPage = lazy(() =>
  import('@/pages/StudioPage').then((m) => ({ default: m.StudioPage })),
)

function readCurrentPathname(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
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

  useEffect(() => {
    const handlePopState = () => {
      setPathname(readCurrentPathname())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((nextPath: string) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
    if (typeof window !== 'undefined' && window.location.pathname !== normalized) {
      window.history.pushState(null, '', normalized)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    setPathname(normalized)
  }, [])

  const route = resolvePathname(pathname)

  if (route.isStudio) {
    return <StudioRouteShell route={route} onNavigate={navigate} />
  }

  return <ToolLandingPage route={route} onNavigate={navigate} />
}
