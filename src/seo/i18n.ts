/**
 * [INPUT]: depends on LocaleBundle, LocaleCode, RouteCopy, RouteSlug, and UiLabels types from ./types.ts; depends on EN_LOCALE, ZH_LOCALE, JA_LOCALE, and KO_LOCALE from ./locales/*.ts
 * [OUTPUT]: exports LOCALE_BUNDLES, SUPPORTED_LOCALES, getLocaleBundle, getUiLabels, getRouteCopy, and getOgLocale
 * [POS]: central i18n lookup facade within src/seo, consumed by schema.ts, useSeoHead.ts, UI chrome components, and scripts/prerender-seo.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle, LocaleCode, RouteCopy, RouteSlug, UiLabels } from './types.ts'
import { EN_LOCALE } from './locales/en.ts'
import { ZH_LOCALE } from './locales/zh.ts'
import { JA_LOCALE } from './locales/ja.ts'
import { KO_LOCALE } from './locales/ko.ts'

export const LOCALE_BUNDLES: Record<LocaleCode, LocaleBundle> = {
  en: EN_LOCALE,
  zh: ZH_LOCALE,
  ja: JA_LOCALE,
  ko: KO_LOCALE,
}

export const SUPPORTED_LOCALES: readonly {
  code: LocaleCode
  nativeName: string
  shortLabel: string
  ogLocale: string
}[] = [
  { code: EN_LOCALE.code, nativeName: EN_LOCALE.nativeName, shortLabel: EN_LOCALE.shortLabel, ogLocale: EN_LOCALE.ogLocale },
  { code: ZH_LOCALE.code, nativeName: ZH_LOCALE.nativeName, shortLabel: ZH_LOCALE.shortLabel, ogLocale: ZH_LOCALE.ogLocale },
  { code: JA_LOCALE.code, nativeName: JA_LOCALE.nativeName, shortLabel: JA_LOCALE.shortLabel, ogLocale: JA_LOCALE.ogLocale },
  { code: KO_LOCALE.code, nativeName: KO_LOCALE.nativeName, shortLabel: KO_LOCALE.shortLabel, ogLocale: KO_LOCALE.ogLocale },
] as const

export function getLocaleBundle(locale: LocaleCode): LocaleBundle {
  return LOCALE_BUNDLES[locale] ?? EN_LOCALE
}

export function getUiLabels(locale: LocaleCode): UiLabels {
  return getLocaleBundle(locale).ui
}

export function getRouteCopy(locale: LocaleCode, slug: RouteSlug): RouteCopy {
  const bundle = getLocaleBundle(locale)
  return bundle.routes[slug] ?? EN_LOCALE.routes[slug] ?? EN_LOCALE.routes['']
}

export function getOgLocale(locale: LocaleCode): string {
  return getLocaleBundle(locale).ogLocale
}
