# hooks/
> L2 | Parent: ../GEMINI.md

Studio React hooks for Konva layer interaction/effects/transforms, LRU image decoding and idle warming, brand color selection, and live/offscreen slide thumbnail capture.

## Member list
- `useBrandColors.ts`: Stable-reference Zustand selector (`useBrandColors`) returning project brand colors without allocating fallback arrays per render.
- `useCachedImage.ts`: Module-level LRU image decode cache and React hook (`useCachedImage`, `warmImageCache`, `getPendingImageLoadCount`, `__clearImageCacheForTests`, `CachedImageStatus`) eliminating slide-switch flash and tracking in-flight decodes.
- `useCachedImage.test.ts`: Vitest suite verifying cache hits, LRU eviction, async decode settlement, and pending load counts.
- `useImageCacheWarmer.ts`: Idle-time project image pre-decoder (`useImageCacheWarmer`) warming `useCachedImage` across all slide groups after initial load.
- `useLayerEffects.ts`: Shared Konva blur-cache binder and shadow-prop adapter (`useLayerEffects`) for canvas layer nodes.
- `useLayerInteraction.ts`: Shared pointer click/tap/drag selection and drag-end position hook (`useLayerInteraction`) for unlocked Konva layer nodes.
- `useLayerTransform.ts`: Shared Konva transform-end scale normalizer (`useLayerTransform`) resetting `scaleX`/`scaleY` to `1` before emitting geometry patches.
- `useOffscreenThumbnails.tsx`: Hidden offscreen Konva `ThumbnailStage` worker (`useOffscreenThumbnails`, `OffscreenThumbnailsApi`, `ThumbnailRequest`) rendering inactive slide-group nav thumbnails without switching the live stage.
- `useThumbnails.ts`: Central Studio thumbnail and high-res preview orchestrator (`useThumbnails`, `buildThumbnailRequests`, `getFreshThumbs`, `needsThumbnailCapture`, `getPrecacheScheduleKey`, `shouldRestoreCapturedSlideGroup`, `ThumbnailMap`, `ThumbnailEntry`, `PreviewProgress`, `PersistedThumbnailMap`) coordinating debounced live capture, IndexedDB persistence, idle offscreen precaching, visibility recovery, and exclusive high-res preview sweeps.
- `useThumbnails.test.ts`: Vitest suite verifying thumbnail freshness checks, precache schedule keys, capture request building, and active-group restore guards.

[PROTOCOL]: Update this header on change, then check GEMINI.md
