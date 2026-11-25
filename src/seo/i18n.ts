/**
 * [INPUT]: depends on LocaleBundle, LocaleCode, RouteCopy, RouteSlug, and UiLabels types from ./types.ts; dynamically imports ./locales/{en,zh,ja,ko}.ts on demand (with automatic top-level eager preload in SSR, Node SSG, and Vitest)
 * [OUTPUT]: exports LOCALE_BUNDLES, SUPPORTED_LOCALES, hasSeoLocale, preloadSeoLocale, preloadAllSeoLocales, getLocaleBundle, getUiLabels, getRouteCopy, and getOgLocale
 * [POS]: central code-split i18n registry and lookup facade within src/seo, consumed by schema.ts, useSeoHead.ts, UI chrome components, src/main.tsx, src/App.tsx, and scripts/prerender-seo.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle, LocaleCode, RouteCopy, RouteSlug, UiLabels } from './types.ts'

export const SUPPORTED_LOCALES: readonly {
  code: LocaleCode
  nativeName: string
  shortLabel: string
  ogLocale: string
}[] = [
  { code: 'en', nativeName: 'English', shortLabel: 'EN', ogLocale: 'en_US' },
  { code: 'zh', nativeName: '简体中文', shortLabel: '中文', ogLocale: 'zh_CN' },
  { code: 'ja', nativeName: '日本語', shortLabel: '日本語', ogLocale: 'ja_JP' },
  { code: 'ko', nativeName: '한국어', shortLabel: '한국어', ogLocale: 'ko_KR' },
] as const

const OG_LOCALE_BY_CODE: Readonly<Record<LocaleCode, string>> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
  ko: 'ko_KR',
}

const ALL_SEO_LOCALE_CODES: readonly LocaleCode[] = ['en', 'zh', 'ja', 'ko']

const seoLocaleRegistry = new Map<LocaleCode, LocaleBundle>()
const pendingSeoLocaleLoads = new Map<LocaleCode, Promise<LocaleBundle>>()

// Populated incrementally on client routes and eagerly in SSR/Node/Vitest.
export const LOCALE_BUNDLES = {} as Record<LocaleCode, LocaleBundle>

function registerSeoLocale(locale: LocaleCode, bundle: LocaleBundle): LocaleBundle {
  seoLocaleRegistry.set(locale, bundle)
  LOCALE_BUNDLES[locale] = bundle
  return bundle
}

function importSeoLocale(locale: LocaleCode): Promise<LocaleBundle> {
  switch (locale) {
    case 'zh':
      return import('./locales/zh.ts').then((m) => m.ZH_LOCALE)
    case 'ja':
      return import('./locales/ja.ts').then((m) => m.JA_LOCALE)
    case 'ko':
      return import('./locales/ko.ts').then((m) => m.KO_LOCALE)
    case 'en':
    default:
      return import('./locales/en.ts').then((m) => m.EN_LOCALE)
  }
}

export function hasSeoLocale(locale: LocaleCode): boolean {
  return seoLocaleRegistry.has(locale)
}

export function preloadSeoLocale(locale: LocaleCode): Promise<LocaleBundle> {
  const cached = seoLocaleRegistry.get(locale)
  if (cached) return Promise.resolve(cached)

  const pending = pendingSeoLocaleLoads.get(locale)
  if (pending) return pending

  const promise = importSeoLocale(locale)
    .then((bundle) => registerSeoLocale(locale, bundle))
    .finally(() => {
      pendingSeoLocaleLoads.delete(locale)
    })

  pendingSeoLocaleLoads.set(locale, promise)
  return promise
}

export async function preloadAllSeoLocales(): Promise<void> {
  await Promise.all(ALL_SEO_LOCALE_CODES.map((locale) => preloadSeoLocale(locale)))
}

// Eagerly register all 4 locales in Node SSG, Vite SSR, and Vitest; Rolldown
// dead-code-eliminates this branch (and its top-level await) in client builds.
if (typeof import.meta.env === 'undefined' || import.meta.env.SSR || import.meta.env.MODE === 'test') {
  await preloadAllSeoLocales()
}

export function getLocaleBundle(locale: LocaleCode): LocaleBundle {
  const bundle =
    seoLocaleRegistry.get(locale) ??
    seoLocaleRegistry.get('en') ??
    seoLocaleRegistry.values().next().value
  if (!bundle) {
    throw new Error(`SEO locale "${locale}" is not loaded yet. Call preloadSeoLocale("${locale}") before rendering.`)
  }
  return bundle
}

export function getUiLabels(locale: LocaleCode): UiLabels {
  return getLocaleBundle(locale).ui
}

export function getRouteCopy(locale: LocaleCode, slug: RouteSlug): RouteCopy {
  const bundle = getLocaleBundle(locale)
  const fallbackEn = seoLocaleRegistry.get('en')
  return bundle.routes[slug] ?? fallbackEn?.routes[slug] ?? bundle.routes[''] ?? fallbackEn?.routes['']
}

export function getOgLocale(locale: LocaleCode): string {
  return OG_LOCALE_BY_CODE[locale] ?? OG_LOCALE_BY_CODE.en
}
