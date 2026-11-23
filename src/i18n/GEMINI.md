# i18n/
> L2 | Parent: ../GEMINI.md

## Member list

- `types.ts`: leaf TypeScript contracts for `StudioUiLocale`, `StudioUiLocaleOption`, and `StudioDictionary`
- `format.ts`: pure `formatMessage` single-pass interpolator, `splitMessageTemplate` rich-text template splitter, and `Intl.RelativeTimeFormat`-backed `formatRelativeTime`
- `studioLocaleStore.ts`: `STUDIO_UI_LOCALES` metadata, `getStudioDictionary` resolver, `StudioLocaleContext` (defaulting to `en`), and `useStudioLocale` hook
- `StudioLocaleContext.tsx`: `StudioLocaleProvider` component binding URL-driven UI locale and navigation callback independently of `useEditorStore.activeLocale`
- `locales/en.ts`: English Studio UI dictionary preserving exact Playwright E2E accessible labels and titles
- `locales/zh.ts`: Simplified Chinese Studio UI dictionary
- `locales/ja.ts`: Japanese Studio UI dictionary
- `locales/ko.ts`: Korean Studio UI dictionary
- `index.ts`: public barrel re-exporting Studio i18n types, dictionaries, provider, and hook
- `studioI18n.test.tsx`: Vitest suite verifying 4-locale dictionary parity, English E2E selector compatibility, SSR rendering of localized Studio panels/toolbar/modals, and UI-vs-content locale isolation

[PROTOCOL]: Update this header on change, then check GEMINI.md
