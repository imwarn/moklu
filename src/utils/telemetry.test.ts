/**
 * [INPUT]: depends on vitest and ./telemetry
 * [OUTPUT]: unit tests verifying PII/filename/URL key stripping, safe mime/ext retention & 16-char cap, 100-event ring buffer, and optional sendBeacon dispatch
 * [POS]: deterministic unit test suite for src/utils/telemetry.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearFunnelEvents,
  getRecentFunnelEvents,
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
      mime: 'image/heic-seque', // capped at 16 chars
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

    // Mutating returned array/props must not affect internal buffer
    events[0].props.seq = 9999
    events.pop()
    expect(getRecentFunnelEvents()).toHaveLength(100)
    expect(getRecentFunnelEvents()[0].props.seq).toBe(20)

    clearFunnelEvents()
    expect(getRecentFunnelEvents()).toHaveLength(0)
  })

  it('only sends beacon when endpoint is non-empty and never throws on transport failure', () => {
    const beacon = vi.fn<(url: string, data: BodyInit) => boolean>(() => true)

    // Empty endpoint -> never dispatches
    trackFunnelEvent('export_completed', { tool: 'merge', format: 'pdf' }, { endpoint: '', sendBeacon: beacon })
    expect(beacon).not.toHaveBeenCalled()

    // Non-empty endpoint -> dispatches JSON payload
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

    // Failing sendBeacon must never throw
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
})
