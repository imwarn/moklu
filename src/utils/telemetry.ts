/**
 * [INPUT]: depends on browser/Node standard navigator.sendBeacon (optional) and import.meta.env.VITE_ANALYTICS_ENDPOINT
 * [OUTPUT]: exports FunnelEventName, FunnelEventPropValue, FunnelEventRecord, trackFunnelEvent, getRecentFunnelEvents, and clearFunnelEvents
 * [POS]: privacy-first client-side funnel telemetry utility in src/utils; strips PII/filename/URL keys, keeps a bounded 100-event ring buffer, and dispatches sendBeacon only when VITE_ANALYTICS_ENDPOINT is configured
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

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
  /** Optional override for navigator.sendBeacon in deterministic Node tests. */
  sendBeacon?: (url: string, data: BodyInit) => boolean
}

const MAX_RECENT_EVENTS = 100
const FORBIDDEN_KEY_RE = /name|path|url|src|blob|data|file/i
const SAFE_SHORT_KEYS = new Set(['mime', 'ext'])
const MAX_SAFE_SHORT_LEN = 16
const MAX_PROP_STRING_LEN = 64
const SENSITIVE_VALUE_RE = /^(?:data:|blob:|https?:\/\/|file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i

const recentEvents: FunnelEventRecord[] = []

function sanitizeProps(raw?: Record<string, unknown>): Record<string, FunnelEventPropValue> {
  const clean: Record<string, FunnelEventPropValue> = {}
  if (!raw) return clean

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

  return clean
}

function resolveAnalyticsEndpoint(override?: string): string {
  if (override !== undefined) return override.trim()
  const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env
  const raw = env?.VITE_ANALYTICS_ENDPOINT
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Record a privacy-sanitized funnel event in memory (bounded to last 100 events)
 * and optionally send it via navigator.sendBeacon when VITE_ANALYTICS_ENDPOINT is non-empty.
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

  const endpoint = resolveAnalyticsEndpoint(options?.endpoint)
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
