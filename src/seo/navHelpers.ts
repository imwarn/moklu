/**
 * [INPUT]: depends on MouseEvent from react; depends on ResolvedRoute, RouteSlug, and ToolId from ./types.ts
 * [OUTPUT]: exports isModifiedClick, handleSpaLinkClick, isToolNavActive, NAV_TOOL_ORDER, and FOOTER_LINK_GROUPS
 * [POS]: shared navigation event, active-state, and grouping helper within src/seo, preventing duplicated link-handling logic across SiteHeader, SeoLandingSections, and SiteFooter
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { MouseEvent } from 'react'
import type { ResolvedRoute, RouteSlug, ToolId } from './types.ts'

export const NAV_TOOL_ORDER: readonly ToolId[] = [
  'mockup',
  'merge',
  'split',
  'compress',
  'resize',
  'id-card',
] as const

export const FOOTER_LINK_GROUPS: {
  mockups: readonly RouteSlug[]
  mergeSplit: readonly RouteSlug[]
  optimizeResize: readonly RouteSlug[]
  documentsStudio: readonly RouteSlug[]
} = {
  mockups: [
    'browser-mockup',
    'iphone-mockup',
    'device-mockup',
    'app-store-screenshots',
  ],
  mergeSplit: [
    'merge-images',
    'combine-photos-side-by-side',
    'stitch-images-vertically',
    'photo-collage-grid',
    'carousel-splitter',
    'image-grid-splitter',
  ],
  optimizeResize: [
    'compress-image',
    'convert-image-format',
    'png-to-webp',
    'resize-image',
    'crop-image',
    'add-border-to-photo',
  ],
  documentsStudio: [
    'id-card-watermark',
    'studio',
    '',
  ],
}

export function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
}

export function handleSpaLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate?: (path: string) => void,
): void {
  if (!onNavigate || isModifiedClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

export function isToolNavActive(
  route: Pick<ResolvedRoute, 'isStudio' | 'slug' | 'tool'>,
  toolId: ToolId,
): boolean {
  return (
    !route.isStudio &&
    ((route.slug === '' && toolId === 'mockup') ||
      (route.slug !== '' && route.tool === toolId))
  )
}
