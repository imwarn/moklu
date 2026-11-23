/**
 * [INPUT]: depends on StudioUiLocale from ./types and Intl.RelativeTimeFormat runtime API
 * [OUTPUT]: exports formatMessage template interpolator, splitMessageTemplate template splitter, and formatRelativeTime Intl formatter
 * [POS]: pure formatting utilities within src/i18n consumed by localized Studio panels, modals, and localization views
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { StudioUiLocale } from './types'

const relativeTimeFormatters = new Map<StudioUiLocale, Intl.RelativeTimeFormat>()

function getRelativeTimeFormatter(locale: StudioUiLocale): Intl.RelativeTimeFormat | null {
  if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') {
    return null
  }
  const existing = relativeTimeFormatters.get(locale)
  if (existing) return existing
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'narrow',
  })
  relativeTimeFormatters.set(locale, formatter)
  return formatter
}

/**
 * Replaces `{key}` tokens in a localized message template in a single pass.
 * Single-pass replacement ensures parameter values containing `{...}` are never re-expanded.
 */
export function formatMessage(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

/**
 * Splits a template string into ordered literal and `{token}` segments so React
 * callers can wrap interpolated nodes in styled spans regardless of locale word order.
 */
export function splitMessageTemplate(
  template: string,
): Array<{ type: 'text'; value: string } | { type: 'token'; key: string }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'token'; key: string }> = []
  const regex = /\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: template.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'token', key: match[1] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < template.length) {
    parts.push({ type: 'text', value: template.slice(lastIndex) })
  }
  return parts
}

/**
 * Formats an ISO timestamp relative to `now` using `Intl.RelativeTimeFormat`.
 * Returns `justNowLabel` when under 60 seconds (or slightly in the future from clock skew).
 */
export function formatRelativeTime(
  iso: string,
  locale: StudioUiLocale,
  justNowLabel: string,
  now: number = Date.now(),
): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ''

  const diffSeconds = Math.floor((now - timestamp) / 1000)
  if (diffSeconds < 60) return justNowLabel

  const formatter = getRelativeTimeFormatter(locale)
  const minutes = Math.floor(diffSeconds / 60)
  if (minutes < 60) {
    return formatter ? formatter.format(-minutes, 'minute') : `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return formatter ? formatter.format(-hours, 'hour') : `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return formatter ? formatter.format(-days, 'day') : `${days}d ago`
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return formatter ? formatter.format(-months, 'month') : `${months}mo ago`
  }

  const years = Math.floor(days / 365)
  return formatter ? formatter.format(-years, 'year') : `${years}y ago`
}
