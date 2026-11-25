/**
 * [INPUT]: depends on react (StrictMode, lazy, Suspense), react-dom/client (createRoot), ./index.css, ./App.tsx, resolvePathname from @/seo/routes, preloadSeoLocale from @/seo/i18n, preloadWorkspaceLocale from @/workspace/i18n, preloadWorkspaceTool from @/workspace/QuickWorkspace, installChunkRecoveryListener from @/utils/chunkRecovery, and Studio-only dynamic imports of @/store/projects and @/utils/fonts
 * [OUTPUT]: installs Vite preloadError auto-recovery, preloads only the active route's locale dictionary (and QuickWorkspace locale/tool chunks on tool routes, skipping them on Studio/info/404 fallback routes) before mounting the Moklu SPA (or headless ExportApp when window.__EXPORT_CONFIG__ is present), and loads Studio project bootstrap and Google Fonts only on /studio routes
 * [POS]: browser application entry point of src/; keeps initial landing and 404 JS free of inactive locales, unused tool panels, Studio stores, and editor font bundles while preventing hydration flash on pre-rendered SSG pages
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadSeoLocale } from '@/seo/i18n'
import { resolvePathname } from '@/seo/routes'
import { installChunkRecoveryListener } from '@/utils/chunkRecovery'
import { preloadWorkspaceLocale } from '@/workspace/i18n'
import { preloadWorkspaceTool } from '@/workspace/QuickWorkspace'

declare global {
  interface Window {
    __EXPORT_CONFIG__?: unknown
  }
}

// If the CLI injected __EXPORT_CONFIG__ before page load, run in headless export mode.
// Otherwise preload only the active route's locale & tool chunk while SSG HTML stays painted.
const isExportMode = !!window.__EXPORT_CONFIG__

// Lazy-load ExportApp so its rendering path (Playwright headless only) is a
// separate chunk and doesn't bloat the editor bundle.
// eslint-disable-next-line react-refresh/only-export-components
const ExportApp = lazy(() =>
  import('./pages/ExportApp.tsx').then((m) => ({ default: m.ExportApp })),
)

async function bootstrapClientApp(): Promise<void> {
  const initialRoute = resolvePathname(window.location.pathname || '/')
  const tasks: Array<Promise<unknown>> = [preloadSeoLocale(initialRoute.locale)]

  if (initialRoute.isStudio) {
    // Only hydrate IndexedDB Studio projects and editor Google Fonts when entering a /studio route;
    // landing routes stay lightweight and defer Studio bootstrap until handoff or Studio navigation.
    void import('@/store/projects').then((m) => m.ensureProjectsBootstrapped())
    void import('@/utils/fonts').then((m) => m.loadGoogleFonts())
  } else if (!initialRoute.isInfoPage && !initialRoute.isFallback) {
    tasks.push(
      preloadWorkspaceLocale(initialRoute.locale),
      preloadWorkspaceTool(initialRoute.tool),
    )
  }

  await Promise.all(tasks)
}

const rootEl = document.getElementById('root')!

if (isExportMode) {
  createRoot(rootEl).render(
    <Suspense>
      <ExportApp />
    </Suspense>,
  )
} else {
  // Auto-recover once per cooldown if a deploy rollover invalidates a stale HTML chunk hash.
  installChunkRecoveryListener()
  void bootstrapClientApp()
    .catch((err) => {
      console.error('[Moklu] Failed to preload initial route chunks:', err)
      return preloadSeoLocale('en')
    })
    .then(() => {
      createRoot(rootEl).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    })
}
