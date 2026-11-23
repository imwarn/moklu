# Moklu Logo & Icon System — Nested Mockup Frame (Concept 02)

Selected direction: **02 Nested Mockup Frame（嵌套视口框）** — an outer neutral canvas frame embracing an offset Signal Orange device screen with a centered top pill notch.

## Geometry Specification (`32×32` Grid)

All horizontal and vertical edges align to even coordinates so scaling 2:1 down to `16×16` favicon size lands on exact integer pixels with zero sub-pixel blur:

- **Outer canvas frame**: `M6 8a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4v-4h-4v4H6V12h4V8H6Z` (4-unit stroke = 2px at 16px, 2-unit gap = 1px at 16px)
- **Device screen**: `<rect x="12" y="2" width="18" height="18" rx="4"/>` (9×9px at 16px)
- **Top notch pill**: `<rect x="18" y="6" width="6" height="2" rx="1"/>` (3×1px at 16px)
- **Monochrome (`currentColor`) screen cutout**: `M16 2h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm3 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Z` (`fill-rule="evenodd"`)

## Color Tokens (`src/theme/brand.ts`)

| Variant | Frame / Wordmark | Screen Accent | Notch |
|---|---|---|---|
| Light surface | `#18181B` | `#E5541F` (`BRAND.mark`) | `#FFFFFF` |
| Dark / Studio surface | `#F4F4F5` | `#E76536` (`BRAND.dark.accent`) | `#FFFFFF` |
| Monochrome | `currentColor` | `currentColor` | transparent cutout (`evenodd`) |

## Wordmark

- Typeface: `'Geist Variable', Geist` (`700`, `-0.03em` tracking, fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Lockup viewBox: `0 0 124 40`

## Delivered Public Assets

- `public/logo.svg` — Adaptive horizontal lockup (`prefers-color-scheme` light/dark)
- `public/logo-light.svg` — Static light-surface lockup
- `public/logo-dark.svg` — Static dark-surface lockup
- `public/logo-mono.svg` — Pure 1-color `currentColor` lockup
- `public/favicon.svg` — Adaptive `32×32` favicon optimized for 16px/32px tabs
- `public/apple-touch-icon.png` — `180×180` PNG on `#09090B` dark zinc
- `public/og-image.png` — `1200×630` PNG social card rendered with Geist & Geist Mono
- `designs/moklu-brand/logo/concepts/` — 6 explored concept sheets (`01`–`06`)
- `designs/moklu-brand/logo/mark-mono.svg` — Standalone monochrome mark (`currentColor`)
- `designs/moklu-brand/logo/final-spec.png` — Final visual QA sheet
