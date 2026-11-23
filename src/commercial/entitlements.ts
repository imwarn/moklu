/**
 * [INPUT]: depends on create from zustand
 * [OUTPUT]: exports EntitlementTier, ProFeature, PRO_FEATURES, FreeCoreTool, LicenseVerificationResult, LicenseVerifier, useEntitlementStore, canAccessProFeature, isEffectivePro, isFreeToolUnlocked, and registerLicenseVerifier
 * [POS]: Commercial Pro entitlement seam for Moklu; keeps all local/2K SEO tools free and watermark-free while exposing an extensible Pro preview and license verification boundary
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { create } from 'zustand'

export type EntitlementTier = 'free' | 'pro'

export type ProFeature =
  | 'export-4k-batch'
  | 'pro-mockup-pack'
  | 'brand-kit-presets'
  | 'cloud-ai-quota'

export const PRO_FEATURES: readonly ProFeature[] = [
  'export-4k-batch',
  'pro-mockup-pack',
  'brand-kit-presets',
  'cloud-ai-quota',
] as const

const PRO_FEATURE_SET = new Set<string>(PRO_FEATURES)

/** Core browser tools and standard 2K exports are always free without watermarks. */
export type FreeCoreTool =
  | 'mockup'
  | 'merge'
  | 'split'
  | 'compress'
  | 'resize'
  | 'id-card'
  | 'export-2k-png'

export interface LicenseVerificationResult {
  valid: boolean
  tier: EntitlementTier
  expiresAt?: string
  reason?: string
}

export type LicenseVerifier = (licenseKey: string) => Promise<LicenseVerificationResult>

export type LicenseStatus = 'idle' | 'verifying' | 'active' | 'invalid'

export interface EntitlementSnapshot {
  tier: EntitlementTier
  proPreviewEnabled: boolean
}

export interface EntitlementStoreState extends EntitlementSnapshot {
  licenseKey: string | null
  licenseStatus: LicenseStatus
  licenseMessage: string | null
  setTier: (tier: EntitlementTier) => void
  setProPreview: (enabled: boolean) => void
  toggleProPreview: () => void
  verifyLicense: (licenseKey: string) => Promise<LicenseVerificationResult>
  clearLicense: () => void
  resetEntitlements: () => void
}

const PREVIEW_STORAGE_KEY = 'moklu:pro-preview'

function readStoredPreviewFlag(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(PREVIEW_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStoredPreviewFlag(enabled: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (enabled) {
      localStorage.setItem(PREVIEW_STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(PREVIEW_STORAGE_KEY)
    }
  } catch {
    // Ignore storage quota or private-mode restrictions.
  }
}

const defaultOfflineLicenseVerifier: LicenseVerifier = async (rawKey) => {
  const trimmed = rawKey.trim()
  if (!trimmed) {
    return {
      valid: false,
      tier: 'free',
      reason: 'Enter a license key to verify.',
    }
  }
  return {
    valid: false,
    tier: 'free',
    reason: 'Online license verification is not configured in this local-first build. Use Pro Preview to evaluate Pro features.',
  }
}

let activeLicenseVerifier: LicenseVerifier = defaultOfflineLicenseVerifier

/**
 * Register a SaaS or self-hosted license verifier hook.
 * Passing `null` restores the default offline local-first verifier.
 */
export function registerLicenseVerifier(verifier: LicenseVerifier | null): void {
  activeLicenseVerifier = verifier ?? defaultOfflineLicenseVerifier
}

export const useEntitlementStore = create<EntitlementStoreState>((set, get) => ({
  tier: 'free',
  proPreviewEnabled: readStoredPreviewFlag(),
  licenseKey: null,
  licenseStatus: 'idle',
  licenseMessage: null,

  setTier: (tier) => set({ tier }),

  setProPreview: (enabled) => {
    writeStoredPreviewFlag(enabled)
    set({ proPreviewEnabled: enabled })
  },

  toggleProPreview: () => {
    const next = !get().proPreviewEnabled
    writeStoredPreviewFlag(next)
    set({ proPreviewEnabled: next })
  },

  verifyLicense: async (licenseKey) => {
    const normalized = licenseKey.trim()
    set({
      licenseKey: normalized || null,
      licenseStatus: 'verifying',
      licenseMessage: null,
    })

    try {
      const result = await activeLicenseVerifier(normalized)
      if (result.valid && result.tier === 'pro') {
        set({
          tier: 'pro',
          licenseKey: normalized,
          licenseStatus: 'active',
          licenseMessage: result.reason ?? null,
        })
      } else {
        set({
          tier: 'free',
          licenseKey: normalized || null,
          licenseStatus: 'invalid',
          licenseMessage: result.reason ?? 'License key could not be verified.',
        })
      }
      return result
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'License verification failed.'
      const failure: LicenseVerificationResult = { valid: false, tier: 'free', reason }
      set({
        tier: 'free',
        licenseStatus: 'invalid',
        licenseMessage: reason,
      })
      return failure
    }
  },

  clearLicense: () => {
    set({
      tier: 'free',
      licenseKey: null,
      licenseStatus: 'idle',
      licenseMessage: null,
    })
  },

  resetEntitlements: () => {
    writeStoredPreviewFlag(false)
    set({
      tier: 'free',
      proPreviewEnabled: false,
      licenseKey: null,
      licenseStatus: 'idle',
      licenseMessage: null,
    })
  },
}))

/** True when the user has an active Pro tier or has enabled local Pro Preview mode. */
export function isEffectivePro(snapshot?: EntitlementSnapshot): boolean {
  const current = snapshot ?? useEntitlementStore.getState()
  return current.tier === 'pro' || current.proPreviewEnabled
}

/**
 * Pure entitlement check for Pro-tier features.
 * When `snapshot` is omitted, reads the current state from `useEntitlementStore`.
 */
export function canAccessProFeature(
  feature: ProFeature,
  snapshot?: EntitlementSnapshot,
): boolean {
  if (!PRO_FEATURE_SET.has(feature)) return false
  return isEffectivePro(snapshot)
}

/**
 * Core SEO tools and standard 2K exports are permanently free and watermark-free.
 */
export function isFreeToolUnlocked(_tool?: FreeCoreTool): true {
  void _tool
  return true
}
