/**
 * [INPUT]: depends on vitest, react, and react-dom/server; depends on entitlements, pricingCopy, and PricingModal modules in src/commercial
 * [OUTPUT]: verifies Free-tier guarantees, Pro preview toggle, extensible license verifier hook, 4-locale pricing copy, and PricingModal light/dark rendering
 * [POS]: Unit test suite for src/commercial
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PRO_FEATURES,
  canAccessProFeature,
  isEffectivePro,
  isFreeToolUnlocked,
  registerLicenseVerifier,
  useEntitlementStore,
  type FreeCoreTool,
  type ProFeature,
} from './entitlements'
import { PricingModal } from './PricingModal'
import { resolvePricingLabels, type PricingLocale } from './pricingCopy'

describe('commercial entitlements', () => {
  beforeEach(() => {
    registerLicenseVerifier(null)
    useEntitlementStore.getState().resetEntitlements()
  })

  afterEach(() => {
    registerLicenseVerifier(null)
    useEntitlementStore.getState().resetEntitlements()
  })

  it('defaults to free tier with all core tools unlocked and Pro features gated', () => {
    const state = useEntitlementStore.getState()
    expect(state.tier).toBe('free')
    expect(state.proPreviewEnabled).toBe(false)
    expect(isEffectivePro()).toBe(false)

    const freeTools: FreeCoreTool[] = [
      'mockup',
      'merge',
      'split',
      'compress',
      'resize',
      'id-card',
      'export-2k-png',
    ]
    for (const tool of freeTools) {
      expect(isFreeToolUnlocked(tool)).toBe(true)
    }

    for (const feature of PRO_FEATURES) {
      expect(canAccessProFeature(feature)).toBe(false)
    }
  })

  it('supports toggling local Pro Preview mode cleanly', () => {
    useEntitlementStore.getState().toggleProPreview()
    expect(useEntitlementStore.getState().proPreviewEnabled).toBe(true)
    expect(isEffectivePro()).toBe(true)
    for (const feature of PRO_FEATURES) {
      expect(canAccessProFeature(feature)).toBe(true)
    }

    useEntitlementStore.getState().setProPreview(false)
    expect(useEntitlementStore.getState().proPreviewEnabled).toBe(false)
    expect(canAccessProFeature('export-4k-batch')).toBe(false)
  })

  it('evaluates pure snapshots without mutating global store', () => {
    expect(canAccessProFeature('pro-mockup-pack', { tier: 'pro', proPreviewEnabled: false })).toBe(true)
    expect(canAccessProFeature('cloud-ai-quota', { tier: 'free', proPreviewEnabled: true })).toBe(true)
    expect(canAccessProFeature('brand-kit-presets', { tier: 'free', proPreviewEnabled: false })).toBe(false)
    expect(canAccessProFeature('unknown-feature' as ProFeature, { tier: 'pro', proPreviewEnabled: true })).toBe(false)
  })

  it('supports extensible license verification and graceful failure handling', async () => {
    const defaultResult = await useEntitlementStore.getState().verifyLicense('MOKLU-TEST-0001')
    expect(defaultResult.valid).toBe(false)
    expect(useEntitlementStore.getState().tier).toBe('free')
    expect(useEntitlementStore.getState().licenseStatus).toBe('invalid')

    registerLicenseVerifier(async (key) => {
      if (key === 'MOKLU-PRO-VALID') {
        return { valid: true, tier: 'pro', expiresAt: '2027-01-01T00:00:00Z' }
      }
      return { valid: false, tier: 'free', reason: 'Invalid key' }
    })

    const active = await useEntitlementStore.getState().verifyLicense('  MOKLU-PRO-VALID  ')
    expect(active.valid).toBe(true)
    expect(useEntitlementStore.getState().tier).toBe('pro')
    expect(useEntitlementStore.getState().licenseStatus).toBe('active')
    expect(canAccessProFeature('export-4k-batch')).toBe(true)

    useEntitlementStore.getState().clearLicense()
    expect(useEntitlementStore.getState().tier).toBe('free')
    expect(useEntitlementStore.getState().licenseKey).toBeNull()
    expect(useEntitlementStore.getState().licenseStatus).toBe('idle')

    registerLicenseVerifier(async () => {
      throw new Error('Network unreachable')
    })
    const crashed = await useEntitlementStore.getState().verifyLicense('ANY')
    expect(crashed.valid).toBe(false)
    expect(useEntitlementStore.getState().licenseStatus).toBe('invalid')
    expect(useEntitlementStore.getState().licenseMessage).toBe('Network unreachable')
  })

  it('provides complete localized pricing labels across EN/ZH/JA/KO with override support', () => {
    const locales: PricingLocale[] = ['en', 'zh', 'ja', 'ko']
    for (const locale of locales) {
      const copy = resolvePricingLabels(locale)
      expect(copy.title.length).toBeGreaterThan(0)
      expect(copy.freeFeatures.length).toBeGreaterThanOrEqual(3)
      for (const line of [copy.title, copy.subtitle, copy.freePlanTagline, copy.proPlanTagline, copy.footerNote, ...copy.freeFeatures]) {
        expect(line).not.toContain('—')
      }
      for (const feature of PRO_FEATURES) {
        expect(copy.proFeatureLabels[feature].length).toBeGreaterThan(0)
        expect(copy.proFeatureLabels[feature]).not.toContain('—')
      }
    }

    const custom = resolvePricingLabels('en', {
      title: 'Custom Plans',
      proFeatureLabels: {
        'export-4k-batch': 'Custom 4K Batch',
        'pro-mockup-pack': 'Pack',
        'brand-kit-presets': 'Brand',
        'cloud-ai-quota': 'AI',
      },
    })
    expect(custom.title).toBe('Custom Plans')
    expect(custom.proFeatureLabels['export-4k-batch']).toBe('Custom 4K Batch')
  })

  it('renders PricingModal with adaptive light and dark surfaces and contrast-safe controls', () => {
    const noop = () => {}

    const lightHtml = renderToStaticMarkup(
      createElement(PricingModal, {
        open: true,
        onClose: noop,
        locale: 'zh',
        theme: 'light',
        highlightedFeature: 'export-4k-batch',
      }),
    )
    expect(lightHtml).toContain('data-theme="light"')
    expect(lightHtml).toContain('background:#FFFFFF')
    expect(lightHtml).toContain('text-zinc-900')
    expect(lightHtml).toContain('bg-accent-soft')
    expect(lightHtml).not.toContain('#141417')
    expect(lightHtml).not.toContain('✦')
    expect(lightHtml).not.toContain('transition-all')
    expect(lightHtml).toContain('<svg')

    const darkHtml = renderToStaticMarkup(
      createElement(PricingModal, {
        open: true,
        onClose: noop,
        locale: 'en',
        highlightedFeature: 'brand-kit-presets',
      }),
    )
    expect(darkHtml).toContain('data-theme="dark"')
    expect(darkHtml).toContain('background:#141417')
    expect(darkHtml).toContain('text-zinc-100')
    expect(darkHtml).toContain('bg-accent-soft')
    expect(darkHtml).toContain('bg-accent-strong')
  })
})
