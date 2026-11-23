/**
 * [INPUT]: depends on react (StrictMode, lazy, Suspense), react-dom/client (createRoot), ./index.css, ./App.tsx, loadGoogleFonts from @/utils/fonts, installChunkRecoveryListener from @/utils/chunkRecovery, and ensureProjectsBootstrapped from @/store/projects
 * [OUTPUT]: installs Vite preloadError auto-recovery and mounts the Moklu SPA immediately on tick 0 (or headless ExportApp when window.__EXPORT_CONFIG__ is present) while kicking off non-blocking IndexedDB project hydration
 * [POS]: browser application entry point of src/; avoids blocking initial paint on IndexedDB so pre-rendered landing pages mount without FOUC
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadGoogleFonts } from '@/utils/fonts'
import { installChunkRecoveryListener } from '@/utils/chunkRecovery'
import { ensureProjectsBootstrapped } from '@/store/projects'

declare global {
  interface Window {
    __EXPORT_CONFIG__?: unknown
  }
}

// Load Google Fonts for the editor (not needed in headless export)
if (!window.__EXPORT_CONFIG__) {
  loadGoogleFonts()
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
  // Non-blocking background hydration; StudioPage and Studio handoff await this shared promise.
  void ensureProjectsBootstrapped()
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
