# seo/
> L2 | Parent: ../GEMINI.md

## Member list

- `types.ts`: leaf TypeScript contracts for locales, tool IDs, 19 route slugs, intent presets, route copy, UI labels, and locale bundles
- `routes.ts`: canonical 19-slug (76-URL) registry, `VITE_SITE_URL` base resolution, pathname parser, localized URL builder, hreflang generator, and related-route graph
- `locales/en.ts`: English (root `/`) UI dictionary and core/mockup/merge route copy, merging `enTools.ts`
- `locales/enTools.ts`: English route copy for split, compress, resize, and ID-card routes
- `locales/zh.ts`: Simplified Chinese (`/zh/...`) UI dictionary and core/mockup/merge route copy, merging `zhTools.ts`
- `locales/zhTools.ts`: Simplified Chinese route copy for split, compress, resize, and ID-card routes
- `locales/ja.ts`: Japanese (`/ja/...`) UI dictionary and core/mockup/merge route copy, merging `jaTools.ts`
- `locales/jaTools.ts`: Japanese route copy for split, compress, resize, and ID-card routes
- `locales/ko.ts`: Korean (`/ko/...`) UI dictionary and core/mockup/merge route copy, merging `koTools.ts`
- `locales/koTools.ts`: Korean route copy for split, compress, resize, and ID-card routes
- `i18n.ts`: locale bundle facade returning localized UI strings, route copy, and Open Graph locale codes
- `schema.ts`: pure Schema.org JSON-LD builders (`WebApplication`, `HowTo`, `FAQPage`) and `<`-safe serializer shared by runtime and SSG
- `ssg.ts`: pure, Node-agnostic SSG `<head>` injector, dark Studio skeleton renderer, multilingual `sitemap.xml`, and `robots.txt` string generators
- `ssrEntry.ts`: build-time `react-dom/server` `renderToString` entry rendering `<ToolLandingPage />` for all 72 landing routes and `renderStudioSkeleton` for the 4 Studio routes
- `useSeoHead.ts`: client-side `<head>` synchronizer (`applySeoHead` + `useSeoHead`) managing title, lang, canonical, OG/Twitter, hreflang, and JSON-LD without node leaks
- `navHelpers.ts`: shared SPA link-click guard, active-nav state helper (`isToolNavActive`), and navigation/footer route grouping constants
- `SiteHeader.tsx`: dual-theme semantic top bar with skip-to-content link, localized category nav, accessible mobile drawer, 4-locale anchor switcher, theme toggle, Pro modal trigger, and Studio CTA
- `SeoLandingSections.tsx`: below-the-fold local-privacy proof banner, 4/8 vertical-rail How-To timeline, 1+2 asymmetric workflow bento, unified Studio + Pro conversion strip, 2-column related-tools index, category-grouped directory, and interactive FAQ accordion
- `SiteFooter.tsx`: categorized internal link footer with 4-locale alternate links and open-source/local-first metadata
- `index.ts`: public barrel re-exporting all SEO types, route helpers, i18n, schemas, head hook, and chrome components
- `seo.test.ts`: Vitest suite covering routing, 4-language content uniqueness, JSON-LD validity, DOM head syncing, SSR chrome rendering, and real CLI SSG HTML/sitemap/CSP output

[PROTOCOL]: Update this header on change, then check GEMINI.md
