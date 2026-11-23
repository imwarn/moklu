# commercial/
> L2 | Parent: ../GEMINI.md

Member list
entitlements.ts: Zustand entitlement store (`useEntitlementStore`), `ProFeature` union, pure `canAccessProFeature()` gate, Pro preview toggle, and pluggable `LicenseVerifier` seam keeping core browser tools free without watermarks.
pricingCopy.ts: Four-locale (EN/ZH/JA/KO) Free vs Moklu Studio Pro pricing copy map and `resolvePricingLabels()` merger.
PricingModal.tsx: Accessible light/dark-adaptive Free vs Moklu Studio Pro dialog built on `ModalShell` with Escape/Tab focus trapping and live Pro preview toggle.
entitlements.test.ts: Unit tests covering Free-tier guarantees, Pro preview toggling, snapshot checks, custom license verifiers, 4-locale pricing labels, and PricingModal light/dark rendering.

[PROTOCOL]: Update this header on change, then check GEMINI.md
