# seo/
> L2 | Parent: ../GEMINI.md

## Member list

- `types.ts`: leaf TypeScript contracts for locales, BCP-47 `HtmlLangCode`/`HreflangCode`, tool IDs, 30 route slugs (`25` tool routes + hub + studio + `about`/`privacy`/`terms`), `SecondaryToolSlug`, `GrowthRouteSlug`, intent presets (incl. `mergeFormat`, `removeOverlap`, `pdfMode`, `targetSizeKb`, `inspectExif`, `enableRedact`), route copy, UI labels, and locale bundles
- `routes.ts`: canonical 30-slug (120 trailing-slash URL) registry, `getHtmlLang` (`zh-CN`) and `getHreflangCode` (`zh-Hans`), `VITE_SITE_URL` base resolution, pathname parser, trailing-slash localized URL builder, hreflang generator, and related-route graph
- `locales/en.ts`: English (root `/`) UI dictionary and core/mockup/merge route copy (13-frame `/device-mockup` + 9 Merge FAQs), merging `enTools.ts`, `enGrowthRoutes.ts`, and `infoRoutes.ts`
- `locales/enTools.ts`: English route copy for `merge-photos-to-pdf` (Mode A Multi-Page A4 + Mode B Single-Page PDF), split, compress, resize, and ID-card routes
- `locales/enGrowthRoutes.ts`: English route copy for the 7 growth slugs (`ipad-mockup`, `watch-mockup`, `stitch-screenshots`, `heic-to-jpg`, `remove-exif`, `compress-image-to-200kb`, `redact-screenshot`)
- `locales/zh.ts`: Simplified Chinese (`/zh/...`) UI dictionary and core/mockup/merge route copy (精准命中「在线图片拼接」与 9 条拼图 FAQ), merging `zhTools.ts`, `zhGrowthRoutes.ts`, and `infoRoutes.ts`
- `locales/zhTools.ts`: Simplified Chinese route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/zhGrowthRoutes.ts`: Simplified Chinese route copy for the 7 growth slugs (`ipad-mockup`, `watch-mockup`, `stitch-screenshots`, `heic-to-jpg`, `remove-exif`, `compress-image-to-200kb`, `redact-screenshot`)
- `locales/ja.ts`: Japanese (`/ja/...`) UI dictionary and core/mockup/merge route copy (with 9 Merge FAQs), merging `jaTools.ts`, `jaGrowthRoutes.ts`, and `infoRoutes.ts`
- `locales/jaTools.ts`: Japanese route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/jaGrowthRoutes.ts`: Japanese route copy for the 7 growth slugs (`ipad-mockup`, `watch-mockup`, `stitch-screenshots`, `heic-to-jpg`, `remove-exif`, `compress-image-to-200kb`, `redact-screenshot`)
- `locales/ko.ts`: Korean (`/ko/...`) UI dictionary and core/mockup/merge route copy (with 9 Merge FAQs), merging `koTools.ts`, `koGrowthRoutes.ts`, and `infoRoutes.ts`
- `locales/koTools.ts`: Korean route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/koGrowthRoutes.ts`: Korean route copy for the 7 growth slugs (`ipad-mockup`, `watch-mockup`, `stitch-screenshots`, `heic-to-jpg`, `remove-exif`, `compress-image-to-200kb`, `redact-screenshot`)
- `locales/infoRoutes.ts`: 4-locale SEO metadata and FAQs for `/about`, `/privacy`, and `/terms`
- `locales/infoPages.ts`: 4-locale structured editorial documents for `/about`, `/privacy`, and `/terms` rendered by `InfoPageContent.tsx`
- `i18n.ts`: locale bundle facade returning localized UI strings, route copy, and Open Graph locale codes
- `quickFacts.ts`: 4-locale structured Quick Facts spec pairs and explicit capability boundaries per tool family (covering 13 frames, local redaction, Multi-Page A4 PDF, HEIC/AVIF, Target-KB, and EXIF/GPS)
- `schema.ts`: pure Schema.org JSON-LD builders (`Organization` with GitHub `sameAs`, `WebSite`, `BreadcrumbList`, `WebPage`, per-tool `WebApplication`, `HowTo`, `FAQPage`) and `<`-safe serializer shared by runtime and SSG
- `ssg.ts`: pure, Node-agnostic SSG `<head>` injector (`zh-CN` / `zh-Hans`), dark Studio skeleton renderer, multilingual `sitemap.xml`, `robots.txt`, and 4-language `llms.txt` string generators
- `ssrEntry.ts`: build-time `react-dom/server` `renderToString` entry rendering `<ToolLandingPage />` for all 116 landing/info routes and `renderStudioSkeleton` for the 4 Studio routes
- `useSeoHead.ts`: client-side `<head>` synchronizer (`applySeoHead` + `useSeoHead`) managing title, BCP-47 `lang`, canonical, OG/Twitter, hreflang, and JSON-LD without node leaks
- `navHelpers.ts`: shared SPA link-click guard, active-nav state helper (`isToolNavActive`), `INFO_ROUTE_SLUGS`, and navigation/footer route grouping constants covering all 30 routes
- `SiteHeader.tsx`: dual-theme semantic top bar with skip-to-content link, localized category nav, accessible mobile drawer, 4-locale anchor switcher (`zh-Hans`), theme toggle, Pro modal trigger, and unified Studio CTA
- `InfoPageContent.tsx`: dedicated editorial renderer for `/about`, `/privacy`, and `/terms` across all 4 locales with zero-upload architecture copy, GitHub audit CTA, and native `<details>` FAQ
- `SeoLandingSections.tsx`: below-the-fold local-privacy proof banner, Quick Facts & capability boundaries, 4/8 vertical-rail How-To timeline, 1+2 asymmetric workflow bento, unified Studio + Pro conversion strip, 2-column related-tools index, category-grouped directory, and native `<details>`/`<summary>` FAQ accordion
- `SiteFooter.tsx`: categorized internal link footer with `/about`, `/privacy`, `/terms` trust links, 4-locale alternate links (`zh-Hans`), and open-source/local-first metadata
- `index.ts`: public barrel re-exporting all SEO types, route helpers, i18n, Quick Facts, schemas, head hook, info page, and chrome components
- `seo.test.ts`: Vitest suite covering 30-slug / 120-route registry, 4-language content uniqueness, growth route presets & hreflang/JSON-LD, unified CTAs, em-dash bans, DOM head syncing, SSR chrome rendering, and real CLI SSG HTML/sitemap/robots/llms.txt output
- `geo.test.ts`: Vitest suite covering GEO deliverables (`llms.txt` non-HTML assertion & growth routes, native `<details>` FAQ parity, 9 Merge FAQs, Quick Facts, `/about`/`/privacy`/`/terms`, `Organization`/`WebSite`/`BreadcrumbList`, `zh-CN`/`zh-Hans`, `/merge-photos-to-pdf` `multipage` preset, and Studio i18n/README em-dash checks)

[PROTOCOL]: Update this header on change, then check GEMINI.md
