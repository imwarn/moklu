/**
 * [INPUT]: depends on react (lazy, Suspense, useCallback, useEffect, useState), resolvePathname/buildLocalizedPath/useSeoHead from @/seo, ChunkErrorBoundary from @/components/common/ChunkErrorBoundary, ToolLandingPage from @/pages/ToolLandingPage, and lazy-loaded StudioPage from @/pages/StudioPage
 * [OUTPUT]: exports default App SPA router mapping '/' and 18 localized SEO tool slugs to ToolLandingPage and '/studio' (plus '/<locale>/studio') to lazy-loaded StudioPage wrapped in ChunkErrorBoundary
 * [POS]: root router shell of src/; ensures landing routes render instantaneously without loading Konva or triggering the Studio splash screen
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { buildLocalizedPath, resolvePathname, useSeoHead, type ResolvedRoute } from '@/seo'
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary'
import { ToolLandingPage } from '@/pages/ToolLandingPage'

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
  return (
    <ChunkErrorBoundary
      locale={route.locale}
      homeHref={homeHref}
      onNavigateHome={() => onNavigate(homeHref)}
    >
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-surface text-sm text-muted">
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
