/**
 * [INPUT]: depends on useMemo, ReactNode from react; depends on StudioUiLocale from ./types; depends on StudioLocaleContext, StudioLocaleContextValue, getStudioDictionary from ./studioLocaleStore
 * [OUTPUT]: exports StudioLocaleProvider component and StudioLocaleProviderProps type
 * [POS]: React Context provider within src/i18n separating Studio UI chrome language (uiLocale) from project slide content locale (useEditorStore.activeLocale)
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { useMemo, type ReactNode } from 'react'
import type { StudioUiLocale } from './types'
import {
  StudioLocaleContext,
  getStudioDictionary,
  type StudioLocaleContextValue,
} from './studioLocaleStore'

export interface StudioLocaleProviderProps {
  locale: StudioUiLocale
  onChangeLocale?: (next: StudioUiLocale) => void
  children: ReactNode
}

export function StudioLocaleProvider({
  locale,
  onChangeLocale,
  children,
}: StudioLocaleProviderProps) {
  const value = useMemo<StudioLocaleContextValue>(
    () => ({
      uiLocale: locale,
      t: getStudioDictionary(locale),
      onChangeLocale,
    }),
    [locale, onChangeLocale],
  )

  return (
    <StudioLocaleContext.Provider value={value}>
      {children}
    </StudioLocaleContext.Provider>
  )
}
