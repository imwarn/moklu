/**
 * [INPUT]: depends on createContext, useContext from react; depends on StudioDictionary, StudioUiLocale, StudioUiLocaleOption from ./types; depends on EN_STUDIO, ZH_STUDIO, JA_STUDIO, KO_STUDIO from ./locales/*
 * [OUTPUT]: exports STUDIO_UI_LOCALES, getStudioDictionary, StudioLocaleContext, StudioLocaleContextValue, and useStudioLocale
 * [POS]: React context object and dictionary lookup helpers within src/i18n, separated from StudioLocaleContext.tsx to satisfy react-refresh component-only exports
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { createContext, useContext } from 'react'
import type { StudioDictionary, StudioUiLocale, StudioUiLocaleOption } from './types'
import { EN_STUDIO } from './locales/en'
import { ZH_STUDIO } from './locales/zh'
import { JA_STUDIO } from './locales/ja'
import { KO_STUDIO } from './locales/ko'

export const STUDIO_UI_LOCALES: readonly StudioUiLocaleOption[] = [
  { code: 'en', shortLabel: 'EN', nativeName: 'English' },
  { code: 'zh', shortLabel: '中文', nativeName: '简体中文' },
  { code: 'ja', shortLabel: '日本語', nativeName: '日本語' },
  { code: 'ko', shortLabel: '한국어', nativeName: '한국어' },
] as const

const STUDIO_DICTIONARIES: Record<StudioUiLocale, StudioDictionary> = {
  en: EN_STUDIO,
  zh: ZH_STUDIO,
  ja: JA_STUDIO,
  ko: KO_STUDIO,
}

export function getStudioDictionary(locale: StudioUiLocale): StudioDictionary {
  return STUDIO_DICTIONARIES[locale] ?? EN_STUDIO
}

export interface StudioLocaleContextValue {
  uiLocale: StudioUiLocale
  t: StudioDictionary
  onChangeLocale?: (next: StudioUiLocale) => void
}

const DEFAULT_VALUE: StudioLocaleContextValue = {
  uiLocale: 'en',
  t: EN_STUDIO,
  onChangeLocale: undefined,
}

export const StudioLocaleContext = createContext<StudioLocaleContextValue>(DEFAULT_VALUE)

export function useStudioLocale(): StudioLocaleContextValue {
  return useContext(StudioLocaleContext)
}
