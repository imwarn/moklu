# seo/
> L2 | Parent: ../GEMINI.md

## Member list

- `types.ts`: leaf TypeScript contracts for locales, BCP-47 `HtmlLangCode`/`HreflangCode`, tool IDs, 23 route slugs (`19` tool/hub/studio + `merge-photos-to-pdf` + `about`/`privacy`/`terms`), intent presets (incl. `mergeFormat`), route copy, UI labels, and locale bundles
- `routes.ts`: canonical 23-slug (92-URL) registry, `getHtmlLang` (`zh-CN`) and `getHreflangCode` (`zh-Hans`), `VITE_SITE_URL` base resolution, pathname parser, localized URL builder, hreflang generator, and related-route graph
- `locales/en.ts`: English (root `/`) UI dictionary and core/mockup/merge route copy (with 9 Merge FAQs), merging `enTools.ts` and `infoRoutes.ts`
- `locales/enTools.ts`: English route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/zh.ts`: Simplified Chinese (`/zh/...`) UI dictionary and core/mockup/merge route copy (精准命中「在线图片拼接」与 9 条拼图 FAQ), merging `zhTools.ts` and `infoRoutes.ts`
- `locales/zhTools.ts`: Simplified Chinese route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/ja.ts`: Japanese (`/ja/...`) UI dictionary and core/mockup/merge route copy (with 9 Merge FAQs), merging `jaTools.ts` and `infoRoutes.ts`
- `locales/jaTools.ts`: Japanese route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/ko.ts`: Korean (`/ko/...`) UI dictionary and core/mockup/merge route copy (with 9 Merge FAQs), merging `koTools.ts` and `infoRoutes.ts`
- `locales/koTools.ts`: Korean route copy for `merge-photos-to-pdf`, split, compress, resize, and ID-card routes
- `locales/infoRoutes.ts`: 4-locale SEO metadata and FAQs for `/about`, `/privacy`, and `/terms`
- `locales/infoPages.ts`: 4-locale structured editorial documents for `/about`, `/privacy`, and `/terms` rendered by `InfoPageContent.tsx`
- `i18n.ts`: locale bundle facade returning localized UI strings, route copy, and Open Graph locale codes
- `quickFacts.ts`: 4-locale structured Quick Facts spec pairs and explicit capability boundaries per tool family
- `schema.ts`: pure Schema.org JSON-LD builders (`Organization` with GitHub `sameAs`, `WebSite`, `BreadcrumbList`, `WebPage`, per-tool `WebApplication`, `HowTo`, `FAQPage`) and `<`-safe serializer shared by runtime and SSG
- `ssg.ts`: pure, Node-agnostic SSG `<head>` injector (`zh-CN` / `zh-Hans`), dark Studio skeleton renderer, multilingual `sitemap.xml`, `robots.txt`, and 4-language `llms.txt` string generators
- `ssrEntry.ts`: build-time `react-dom/server` `renderToString` entry rendering `<ToolLandingPage />` for all 88 landing/info routes and `renderStudioSkeleton` for the 4 Studio routes
- `useSeoHead.ts`: client-side `<head>` synchronizer (`applySeoHead` + `useSeoHead`) managing title, BCP-47 `lang`, canonical, OG/Twitter, hreflang, and JSON-LD without node leaks
- `navHelpers.ts`: shared SPA link-click guard, active-nav state helper (`isToolNavActive`), `INFO_ROUTE_SLUGS`, and navigation/footer route grouping constants
- `SiteHeader.tsx`: dual-theme semantic top bar with skip-to-content link, localized category nav, accessible mobile drawer, 4-locale anchor switcher (`zh-Hans`), theme toggle, Pro modal trigger, and unified Studio CTA
- `InfoPageContent.tsx`: dedicated editorial renderer for `/about`, `/privacy`, and `/terms` across all 4 locales with zero-upload architecture copy, GitHub audit CTA, and native `<details>` FAQ
- `SeoLandingSections.tsx`: below-the-fold local-privacy proof banner, Quick Facts & capability boundaries, 4/8 vertical-rail How-To timeline, 1+2 asymmetric workflow bento, unified Studio + Pro conversion strip, 2-column related-tools index, category-grouped directory, and native `<details>`/`<summary>` FAQ accordion
- `SiteFooter.tsx`: categorized internal link footer with `/about`, `/privacy`, `/terms` trust links, 4-locale alternate links (`zh-Hans`), and open-source/local-first metadata
- `index.ts`: public barrel re-exporting all SEO types, route helpers, i18n, Quick Facts, schemas, head hook, info page, and chrome components
- `seo.test.ts`: Vitest suite covering 92-route registry, 4-language content uniqueness, unified CTAs, em-dash bans, JSON-LD validity, DOM head syncing, SSR chrome rendering, and real CLI SSG HTML/sitemap/robots/llms.txt output
- `geo.test.ts`: Vitest suite covering GEO deliverables (`llms.txt` non-HTML assertion, native `<details>` FAQ parity, 9 Merge FAQs, Quick Facts, `/about`/`/privacy`/`/terms`, `Organization`/`WebSite`/`BreadcrumbList`, `zh-CN`/`zh-Hans`, `/merge-photos-to-pdf`, and Studio i18n/README em-dash checks)

[PROTOCOL]: Update this header on change, then check GEMINI.md
