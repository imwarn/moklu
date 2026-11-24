/**
 * [INPUT]: depends on react (StrictMode, lazy, Suspense), react-dom/client (createRoot), ./index.css, ./App.tsx, resolvePathname from @/seo/routes, installChunkRecoveryListener from @/utils/chunkRecovery, and Studio-only dynamic imports of @/store/projects and @/utils/fonts
 * [OUTPUT]: installs Vite preloadError auto-recovery and mounts the Moklu SPA immediately on tick 0 (or headless ExportApp when window.__EXPORT_CONFIG__ is present), loading Studio project bootstrap and Google Fonts only on /studio routes
 * [POS]: browser application entry point of src/; keeps SEO landing routes completely free of Studio store and editor font bundles while avoiding FOUC on pre-rendered pages
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { resolvePathname } from '@/seo/routes'
import { installChunkRecoveryListener } from '@/utils/chunkRecovery'

declare global {
  interface Window {
    __EXPORT_CONFIG__?: unknown
  }
}

// If the CLI injected __EXPORT_CONFIG__ before page load, run in headless export mode.
// Otherwise render the SPA immediately on tick 0 without blocking on IndexedDB.
const isExportMode = !!window.__EXPORT_CONFIG__

// Lazy-load ExportApp so its rendering path (Playwright headless only) is a
// separate chunk and doesn't bloat the editor bundle.
// eslint-disable-next-line react-refresh/only-export-components
const ExportApp = lazy(() =>
  import('./pages/ExportApp.tsx').then((m) => ({ default: m.ExportApp })),
)

if (!isExportMode) {
  // Auto-recover once per cooldown if a deploy rollover invalidates a stale HTML chunk hash.
  installChunkRecoveryListener()
  // Only hydrate IndexedDB Studio projects and editor Google Fonts when entering a /studio route;
  // landing routes stay lightweight and defer Studio bootstrap until handoff or Studio navigation.
  if (resolvePathname(window.location.pathname || '/').isStudio) {
    void import('@/store/projects').then((m) => m.ensureProjectsBootstrapped())
    void import('@/utils/fonts').then((m) => m.loadGoogleFonts())
  }
}

createRoot(document.getElementById('root')!).render(
  isExportMode
    ? <Suspense><ExportApp /></Suspense>
    : (
      <StrictMode>
        <App />
      </StrictMode>
    ),
)
