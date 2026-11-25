/**
 * [INPUT]: depends on LocaleCode and ResolvedRoute from ./types.ts; depends on getUiLabels from ./i18n.ts; depends on buildLocalizedPath and isLocaleCode from ./routes.ts
 * [OUTPUT]: exports NotFoundCopy type, getNotFoundCopy(locale), hasExplicitLocalePrefix(pathname), inferFallbackLocale(pathname, preferredLanguages), and applyPreferredFallbackLocale(route, pathname, preferredLanguages)
 * [POS]: pure, React-free 4-locale 404 copy and fallback-locale resolver within src/seo, shared identically by NotFoundContent.tsx, useSeoHead.ts, main.tsx, App.tsx, and React-free Node SSG in ssg.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleCode, ResolvedRoute } from './types.ts'
import { getUiLabels } from './i18n.ts'
import { buildLocalizedPath, isLocaleCode } from './routes.ts'

export interface NotFoundCopy {
  title: string
  metaDescription: string
  badge: string
  h1: string
  description: string
  homeCta: string
  studioCta: string
  toolsHeading: string
}

type StaticNotFoundCopy = Omit<NotFoundCopy, 'studioCta'>

const NOT_FOUND_COPY: Readonly<Record<LocaleCode, StaticNotFoundCopy>> = {
  en: {
    title: '404 | Page Not Found | Moklu',
    metaDescription:
      'This page could not be found on Moklu. Return home or jump straight into a 100% browser-local image tool with zero uploads.',
    badge: '404 · HTTP Not Found',
    h1: 'Page not found',
    description:
      'The link you followed may be outdated or mistyped. Return home, open Moklu Studio, or pick any browser-local image tool below.',
    homeCta: 'Back to Home',
    toolsHeading: 'Jump straight into a local tool',
  },
  zh: {
    title: '404 | 页面未找到 | Moklu',
    metaDescription:
      '未找到你访问的 Moklu 页面。你可以返回首页，或直接使用下方 100% 浏览器本地运行的图片工具，无需上传。',
    badge: '404 · 页面未找到',
    h1: '页面未找到',
    description:
      '你访问的链接可能已失效或地址有误。可以返回首页、进入 Moklu Studio，或直接打开下方本地图片工具。',
    homeCta: '返回首页',
    toolsHeading: '直接打开本地图片工具',
  },
  ja: {
    title: '404 | ページが見つかりません | Moklu',
    metaDescription:
      'お探しの Moklu ページは見つかりませんでした。ホームに戻るか、ブラウザ内ローカル完結の画像ツールを直接開いてください。',
    badge: '404 · HTTP Not Found',
    h1: 'ページが見つかりません',
    description:
      'URL が変更されたか、入力に誤りがある可能性があります。ホームや Moklu Studio に戻るか、下のローカル画像ツールから直接作業を始められます。',
    homeCta: 'ホームに戻る',
    toolsHeading: 'ローカル画像ツールを直接開く',
  },
  ko: {
    title: '404 | 페이지를 찾을 수 없습니다 | Moklu',
    metaDescription:
      '요청하신 Moklu 페이지를 찾을 수 없습니다. 홈으로 돌아가거나 업로드 없이 브라우저에서 바로 실행되는 이미지 도구를 선택하세요.',
    badge: '404 · HTTP Not Found',
    h1: '페이지를 찾을 수 없습니다',
    description:
      '링크가 변경되었거나 주소가 잘못 입력되었을 수 있습니다. 홈이나 Moklu Studio로 이동하거나 아래 로컬 이미지 도구를 바로 열어 보세요.',
    homeCta: '홈으로 돌아가기',
    toolsHeading: '로컬 이미지 도구 바로 열기',
  },
}

export function getNotFoundCopy(locale: LocaleCode): NotFoundCopy {
  const base = NOT_FOUND_COPY[locale] ?? NOT_FOUND_COPY.en
  return {
    ...base,
    studioCta: getUiLabels(locale).openStudio,
  }
}

function readExplicitLocalePrefix(pathname: string): LocaleCode | null {
  const cleaned = pathname.split(/[?#]/, 1)[0].trim().toLowerCase()
  const firstSegment = cleaned.split('/').find(Boolean)
  if (!firstSegment) return null
  return isLocaleCode(firstSegment) ? firstSegment : null
}

export function hasExplicitLocalePrefix(pathname: string): boolean {
  return readExplicitLocalePrefix(pathname) !== null
}

export function inferFallbackLocale(
  pathname: string,
  preferredLanguages?: readonly string[],
): LocaleCode {
  const explicit = readExplicitLocalePrefix(pathname)
  if (explicit) {
    return explicit
  }

  const languages =
    preferredLanguages ??
    (typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : []
      : [])

  for (const entry of languages) {
    const normalized = entry.trim().toLowerCase()
    if (!normalized) continue
    if (normalized.startsWith('zh')) return 'zh'
    if (normalized.startsWith('ja')) return 'ja'
    if (normalized.startsWith('ko')) return 'ko'
    if (normalized.startsWith('en')) return 'en'
  }

  return 'en'
}

export function applyPreferredFallbackLocale(
  route: ResolvedRoute,
  pathname: string,
  preferredLanguages?: readonly string[],
): ResolvedRoute {
  if (!route.isFallback || hasExplicitLocalePrefix(pathname)) {
    return route
  }

  const locale = inferFallbackLocale(pathname, preferredLanguages)
  if (locale === route.locale) {
    return route
  }

  return {
    ...route,
    locale,
    path: buildLocalizedPath(locale, ''),
  }
}
