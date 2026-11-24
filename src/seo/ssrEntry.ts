/**
 * [INPUT]: depends on react (createElement), react-dom/server (renderToString), ToolLandingPage from @/pages/ToolLandingPage, renderStudioSkeleton from ./ssg.ts, and ResolvedRoute from ./types.ts
 * [OUTPUT]: exports renderRouteMarkup(route) returning full Tailwind-styled React HTML for all 116 landing and trust info routes and a dark Studio skeleton for the 4 studio routes
 * [POS]: build-time SSR entry point within src/seo, temporarily bundled by scripts/prerender-seo.mjs to materialize zero-FOUC static HTML
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ToolLandingPage } from '@/pages/ToolLandingPage'
import { renderStudioSkeleton } from './ssg.ts'
import type { ResolvedRoute } from './types.ts'

const NOOP_NAVIGATE = () => {}

/**
 * Renders the static inner markup for `<div id="root">`.
 * Non-studio routes render the real `<ToolLandingPage />` in Light theme (matching
 * `body { background: #f8f9fc }`) so byte-0 HTML is visually identical to the
 * mounted React application. Studio routes emit a styled dark `#0f0f13` shell
 * without loading Konva in Node.
 */
export function renderRouteMarkup(route: ResolvedRoute): string {
  if (route.isStudio) {
    return renderStudioSkeleton(route)
  }

  return renderToString(
    createElement(ToolLandingPage, {
      route,
      onNavigate: NOOP_NAVIGATE,
    }),
  )
}
