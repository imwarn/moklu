/**
 * [INPUT]: depends on types, format, studioLocaleStore, and StudioLocaleContext within src/i18n
 * [OUTPUT]: re-exports StudioUiLocale, StudioUiLocaleOption, StudioDictionary, formatMessage, splitMessageTemplate, formatRelativeTime, STUDIO_UI_LOCALES, getStudioDictionary, StudioLocaleProvider, StudioLocaleProviderProps, StudioLocaleContextValue, and useStudioLocale
 * [POS]: sole external barrel entry point for the src/i18n Studio UI localization subsystem
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export type { StudioUiLocale, StudioUiLocaleOption, StudioDictionary } from './types'
export { formatMessage, splitMessageTemplate, formatRelativeTime } from './format'
export {
  STUDIO_UI_LOCALES,
  getStudioDictionary,
  useStudioLocale,
  type StudioLocaleContextValue,
} from './studioLocaleStore'
export {
  StudioLocaleProvider,
  type StudioLocaleProviderProps,
} from './StudioLocaleContext'
