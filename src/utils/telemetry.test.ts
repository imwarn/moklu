/**
 * [INPUT]: depends on vitest and ./telemetry
 * [OUTPUT]: unit tests verifying PII/filename/URL key stripping, safe mime/ext retention & 16-char cap, privacy-safe not_found_view bucketing, 100-event ring buffer, moklu.app same-origin default endpoint, and sendBeacon resilience
 * [POS]: deterministic unit test suite for src/utils/telemetry.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_MOKLU_TELEMETRY_ENDPOINT,
  buildNotFoundTelemetryProps,
  clearFunnelEvents,
  getRecentFunnelEvents,
  resolveAnalyticsEndpoint,
  trackFunnelEvent,
  type FunnelEventName,
} from './telemetry'

describe('telemetry', () => {
  beforeEach(() => {
    clearFunnelEvents()
  })

  it('strips sensitive filename, path, url, src, blob, data, and file keys while keeping safe mime/ext capped to 16 chars', () => {
    const record = trackFunnelEvent('image_loaded', {
      tool: 'compress',
      count: 3,
      hasExif: true,
      mime: 'image/heic-sequence-extra-long',
      ext: 'heic',
      filename: 'passport-secret.jpg',
      originalName: 'id.png',
      filePath: '/Users/alice/Desktop/secret.png',
      dataUrl: 'data:image/png;base64,AAAA',
      previewUrl: 'blob:https://moklu.app/123',
      imgSrc: 'blob:123',
      blobSize: 42000,
      fileCount: 2,
      rawData: 'secret',
      sneakyValue: 'data:image/jpeg;base64,XYZ',
      nonFinite: Number.NaN,
      nestedObj: { a: 1 },
    })

    expect(record.name).toBe('image_loaded')
    expect(record.props).toEqual({
      tool: 'compress',
      count: 3,
      hasExif: true,
      mime: 'image/heic-seque',
      ext: 'heic',
    })
  })

  it('retains only the most recent 100 events in memory and isolates returned snapshots', () => {
    for (let i = 0; i < 120; i += 1) {
      trackFunnelEvent('tool_view', { seq: i })
    }

    const events = getRecentFunnelEvents()
    expect(events).toHaveLength(100)
    expect(events[0].props.seq).toBe(20)
    expect(events[99].props.seq).toBe(119)

    events[0].props.seq = 9999
    events.pop()
    expect(getRecentFunnelEvents()).toHaveLength(100)
    expect(getRecentFunnelEvents()[0].props.seq).toBe(20)

    clearFunnelEvents()
    expect(getRecentFunnelEvents()).toHaveLength(0)
  })

  it('auto-targets same-origin /_telemetry on moklu.app while staying silent on localhost and honoring off overrides', () => {
    expect(resolveAnalyticsEndpoint(undefined, 'localhost')).toBe('')
    expect(resolveAnalyticsEndpoint(undefined, 'moklu.app')).toBe(DEFAULT_MOKLU_TELEMETRY_ENDPOINT)
    expect(resolveAnalyticsEndpoint(undefined, 'www.moklu.app')).toBe(DEFAULT_MOKLU_TELEMETRY_ENDPOINT)
    expect(resolveAnalyticsEndpoint('off', 'moklu.app')).toBe('')

    const prodBeacon = vi.fn<(url: string, data: BodyInit) => boolean>(() => true)
    trackFunnelEvent('pro_cta_clicked', { tool: 'mockup' }, { hostname: 'moklu.app', sendBeacon: prodBeacon })
    expect(prodBeacon).toHaveBeenCalledTimes(1)
    expect(prodBeacon.mock.calls[0][0]).toBe('/_telemetry')
  })

  it('only sends beacon when endpoint is non-empty and never throws on transport failure', () => {
    const beacon = vi.fn<(url: string, data: BodyInit) => boolean>(() => true)

    trackFunnelEvent('export_completed', { tool: 'merge', format: 'pdf' }, { endpoint: '', sendBeacon: beacon })
    expect(beacon).not.toHaveBeenCalled()

    trackFunnelEvent(
      'studio_handoff',
      { tool: 'merge', layerCount: 4, filename: 'should-be-stripped.png' },
      { endpoint: 'https://analytics.moklu.app/v1/events', sendBeacon: beacon },
    )
    expect(beacon).toHaveBeenCalledTimes(1)
    const [url, payload] = beacon.mock.calls[0]
    expect(url).toBe('https://analytics.moklu.app/v1/events')
    const parsed = JSON.parse(String(payload))
    expect(parsed.name).toBe('studio_handoff')
    expect(parsed.props).toEqual({ tool: 'merge', layerCount: 4 })

    const failingBeacon = vi.fn(() => {
      throw new Error('Network blocked')
    })
    const events: FunnelEventName[] = ['copy_completed', 'format_rejected', 'pro_cta_clicked']
    for (const ev of events) {
      expect(() =>
        trackFunnelEvent(ev, { tool: 'id-card' }, { endpoint: 'https://example.test/e', sendBeacon: failingBeacon }),
      ).not.toThrow()
    }
    expect(getRecentFunnelEvents()).toHaveLength(5)
  })

  it('builds privacy-safe not_found_view telemetry props with hash normalization, query stripping, and ext extraction', () => {
    expect(buildNotFoundTelemetryProps('/assets/SplitQuickTool-Tscs8uh7.js', 'en')).toEqual({
      tool: 'not-found',
      slug: 'assets-splitquicktool-hash-js',
      locale: 'en',
      ext: 'js',
    })

    expect(buildNotFoundTelemetryProps('/assets/non-existent-probe.js', 'zh')).toEqual({
      tool: 'not-found',
      slug: 'assets-non-existent-probe-js',
      locale: 'zh',
      ext: 'js',
    })

    expect(buildNotFoundTelemetryProps('/zh/missing-tool?token=secret#section', 'zh')).toEqual({
      tool: 'not-found',
      slug: 'zh-missing-tool',
      locale: 'zh',
    })

    expect(
      buildNotFoundTelemetryProps(
        '/share/550e8400-e29b-41d4-a716-446655440000/orders/123456',
        'ja',
      ),
    ).toEqual({
      tool: 'not-found',
      slug: 'share-id-orders-n',
      locale: 'ja',
    })

    const longBucket = buildNotFoundTelemetryProps(
      '/very/long/unknown/path/segment/alpha/beta/gamma/delta/epsilon/zeta',
      'ko',
    )
    expect(longBucket.slug.length).toBeLessThanOrEqual(48)
    expect(longBucket.slug.endsWith('-')).toBe(false)

    expect(buildNotFoundTelemetryProps('/???', 'en')).toEqual({
      tool: 'not-found',
      slug: 'not-found',
      locale: 'en',
    })

    const beacon = vi.fn<(url: string, data: BodyInit) => boolean>(() => true)
    const record = trackFunnelEvent(
      'not_found_view',
      buildNotFoundTelemetryProps('/assets/non-existent-probe.js?x=1', 'zh'),
      { hostname: 'moklu.app', sendBeacon: beacon },
    )
    expect(record.name).toBe('not_found_view')
    expect(record.props).toEqual({
      tool: 'not-found',
      slug: 'assets-non-existent-probe-js',
      locale: 'zh',
      ext: 'js',
    })
    expect(beacon).toHaveBeenCalledTimes(1)
    expect(beacon.mock.calls[0][0]).toBe('/_telemetry')
  })
})
