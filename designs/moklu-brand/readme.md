# Moklu Brand System — Neutral Zinc + Signal Orange

Moklu is a local-first browser mockup and image toolkit. This third-round brand refresh replaces the previous AI-purple (`#7c6ef6`) and magenta gradient (`#ec4899`) styling with a restrained industrial-tool identity built on **Neutral Zinc** surfaces, a single calibrated **Signal Orange** accent, and self-hosted **Geist + Geist Mono** typography.

## Color Strategy

- **Neutral Zinc base**: `#FAFAFA` / `#FFFFFF` in daylight Quick Workspace and SEO landing pages; `#09090B` / `#141417` in Dark Mode and Studio. Zero blue-slate cast and zero warm beige cast.
- **Single accent lock (Signal Orange)**: One accent family (`H 15°–16°`, saturation strictly `< 80%`) across the entire site. No secondary decorative accent, no purple-pink gradients, no ambient neon button glow.
- **Role-separated WCAG AA compliance**:
  - `accent` (`#E5541F` light / `#E76536` dark): Brand mark, display highlights, icons, dark-mode focus rings, and Konva selection strokes (`≥ 3.58:1` on light, `≥ 5.53:1` on dark).
  - `accent-strong` (`#C24217` light / `#C64519` dark): Primary CTA button fills paired with white `accent-fg` (`#FFFFFF`), clearing `5.14:1` (light) and `4.92:1` (dark).
  - `accent-text` (`#AF3B14` light / `#EB7F59` dark): Inline accent copy and active tab labels on `surface`, `panel`, and `accent-soft`, clearing `≥ 5.51:1` (light) and `≥ 6.19:1` (dark).
  - `muted` (`#52525B` light / `#A1A1AA` dark): Secondary labels clearing `7.73:1` on light panel and `7.17:1` on dark panel.
  - `success`, `warning`, `danger`: Hue-separated from Signal Orange (Emerald `142°–158°`, Amber `36°–42°`, Crimson `348°–349°`), all clearing `≥ 4.81:1`.

## Typography

- **UI & Display**: `Geist` (variable sans, tight display tracking `-0.03em`, crisp small-size legibility for Studio inspectors).
- **Coordinates, Shortcuts & Hex**: `Geist Mono` with `font-variant-numeric: tabular-nums` so canvas dimensions (`1440 × 900`), zoom percentages, and keyboard hints never jitter.
- **Offline-first delivery**: Bundled locally via Vite assets so SSG landing pages and offline sessions never depend on third-party font CDNs and require no `public/_headers` CSP relaxation.

## Code Source of Truth

- CSS tokens & Tailwind v4 `@theme static`: `src/index.css`
- JS / Konva hex token registry: `src/theme/brand.ts` (`BRAND`, `BRAND_LIGHT`, `BRAND_DARK`, `getBrandPalette`)
