/**
 * [INPUT]: depends on browser/Node standard navigator.sendBeacon, window.location.hostname/pathname (optional), and import.meta.env.VITE_ANALYTICS_ENDPOINT
 * [OUTPUT]: exports DEFAULT_MOKLU_TELEMETRY_ENDPOINT, FunnelEventName, FunnelEventPropValue, FunnelEventRecord, resolveAnalyticsEndpoint, trackFunnelEvent, getRecentFunnelEvents, and clearFunnelEvents
 * [POS]: privacy-first client-side funnel telemetry utility in src/utils; strips PII/filename/URL keys, keeps a bounded 100-event ring buffer, and dispatches same-origin /_telemetry beacons on moklu.app (or custom VITE_ANALYTICS_ENDPOINT)
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

export const DEFAULT_MOKLU_TELEMETRY_ENDPOINT = '/_telemetry'

export type FunnelEventName =
  | 'tool_view'
  | 'image_loaded'
  | 'export_completed'
  | 'copy_completed'
  | 'format_rejected'
  | 'studio_handoff'
  | 'pro_cta_clicked'

export type FunnelEventPropValue = string | number | boolean

export interface FunnelEventRecord {
  name: FunnelEventName
  timestamp: number
  props: Record<string, FunnelEventPropValue>
}

export interface TrackFunnelOptions {
  /** Optional override for VITE_ANALYTICS_ENDPOINT in tests or custom deployments. */
  endpoint?: string
  /** Optional hostname override for deterministic Node tests. */
  hostname?: string
  /** Optional override for navigator.sendBeacon in deterministic Node tests. */
  sendBeacon?: (url: string, data: BodyInit) => boolean
}

const MAX_RECENT_EVENTS = 100
const FORBIDDEN_KEY_RE = /name|path|url|src|blob|data|file/i
const SAFE_SHORT_KEYS = new Set(['mime', 'ext'])
const MAX_SAFE_SHORT_LEN = 16
const MAX_PROP_STRING_LEN = 64
const SENSITIVE_VALUE_RE = /^(?:data:|blob:|https?:\/\/|file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i
const DISABLED_ENV_VALUES = new Set(['off', 'false', '0', 'none', 'disabled'])
const PROD_HOSTS = new Set(['moklu.app', 'www.moklu.app'])
const KNOWN_LOCALES = new Set(['en', 'zh', 'ja', 'ko'])

const recentEvents: FunnelEventRecord[] = []

function inferRouteContextFromPathname(pathname: string): { locale: string; slug: string } {
  const segments = pathname
    .split(/[?#]/, 1)[0]
    .toLowerCase()
    .split('/')
    .map((s) => s.replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean)

  if (segments.length === 0) return { locale: 'en', slug: 'home' }
  if (KNOWN_LOCALES.has(segments[0])) {
    return {
      locale: segments[0],
      slug: segments.slice(1).join('-') || 'home',
    }
  }
  return {
    locale: 'en',
    slug: segments.join('-') || 'home',
  }
}

function sanitizeProps(raw?: Record<string, unknown>): Record<string, FunnelEventPropValue> {
  const clean: Record<string, FunnelEventPropValue> = {}
  if (raw) {
    for (const [key, value] of Object.entries(raw)) {
      const trimmedKey = key.trim()
      if (!trimmedKey) continue

      const lowerKey = trimmedKey.toLowerCase()
      const isSafeShortKey = SAFE_SHORT_KEYS.has(lowerKey)
      if (!isSafeShortKey && FORBIDDEN_KEY_RE.test(trimmedKey)) {
        continue
      }

      if (typeof value === 'boolean') {
        clean[trimmedKey] = value
      } else if (typeof value === 'number') {
        if (Number.isFinite(value)) {
          clean[trimmedKey] = value
        }
      } else if (typeof value === 'string') {
        const trimmedVal = value.trim()
        if (!trimmedVal || SENSITIVE_VALUE_RE.test(trimmedVal)) continue
        const maxLen = isSafeShortKey ? MAX_SAFE_SHORT_LEN : MAX_PROP_STRING_LEN
        clean[trimmedKey] = trimmedVal.slice(0, maxLen)
      }
    }
  }

  if (typeof window !== 'undefined' && typeof window.location?.pathname === 'string') {
    const inferred = inferRouteContextFromPathname(window.location.pathname)
    if (clean.locale === undefined) clean.locale = inferred.locale
    if (clean.slug === undefined) clean.slug = inferred.slug.slice(0, 48)
  }

  return clean
}

export function resolveAnalyticsEndpoint(override?: string, hostnameOverride?: string): string {
  if (override !== undefined) {
    const trimmedOverride = override.trim()
    return DISABLED_ENV_VALUES.has(trimmedOverride.toLowerCase()) ? '' : trimmedOverride
  }
  const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env
  const raw = env?.VITE_ANALYTICS_ENDPOINT
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim()
    return DISABLED_ENV_VALUES.has(trimmed.toLowerCase()) ? '' : trimmed
  }

  const host = (
    hostnameOverride ??
    (typeof window !== 'undefined' && typeof window.location?.hostname === 'string'
      ? window.location.hostname
      : '')
  )
    .trim()
    .toLowerCase()

  if (PROD_HOSTS.has(host)) {
    return DEFAULT_MOKLU_TELEMETRY_ENDPOINT
  }
  return ''
}

/**
 * Record a privacy-sanitized funnel event in memory (bounded to last 100 events)
 * and send it via navigator.sendBeacon on moklu.app (same-origin /_telemetry) or when VITE_ANALYTICS_ENDPOINT is set.
 */
export function trackFunnelEvent(
  name: FunnelEventName,
  props?: Record<string, unknown>,
  options?: TrackFunnelOptions,
): FunnelEventRecord {
  const record: FunnelEventRecord = {
    name,
    timestamp: Date.now(),
    props: sanitizeProps(props),
  }

  recentEvents.push(record)
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_RECENT_EVENTS)
  }

  const endpoint = resolveAnalyticsEndpoint(options?.endpoint, options?.hostname)
  if (endpoint) {
    try {
      const payload = JSON.stringify(record)
      if (options?.sendBeacon) {
        options.sendBeacon(endpoint, payload)
      } else if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const body =
          typeof Blob !== 'undefined'
            ? new Blob([payload], { type: 'application/json' })
            : payload
        navigator.sendBeacon(endpoint, body)
      }
    } catch {
      // Telemetry transport errors must never disrupt client-side tool execution.
    }
  }

  return {
    name: record.name,
    timestamp: record.timestamp,
    props: { ...record.props },
  }
}

/**
 * Return a defensive copy of up to the last 100 recorded funnel events.
 */
export function getRecentFunnelEvents(): FunnelEventRecord[] {
  return recentEvents.map((entry) => ({
    name: entry.name,
    timestamp: entry.timestamp,
    props: { ...entry.props },
  }))
}

/**
 * Clear all in-memory funnel events (useful in tests or privacy resets).
 */
export function clearFunnelEvents(): void {
  recentEvents.length = 0
}
