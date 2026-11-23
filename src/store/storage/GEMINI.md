# storage/
> L2 | Parent: ../GEMINI.md

Dependency-inverted project persistence adapter interface and default browser `localStorage` implementation with cross-tab ETag conflict detection.

## Member list
- `index.ts`: Storage backend facade (`getProjectStorage`) resolving host-injected `ProjectStorageAdapter` or defaulting to `localStorageAdapter`, plus type re-exports.
- `types.ts`: Persistence contracts (`ProjectMeta`, `ProjectStorageAdapter`) and optimistic concurrency error (`ProjectConflictError`).
- `localStorageAdapter.ts`: Default browser `localStorage` backend (`localStorageAdapter`) implementing ETag tracking and cross-tab `storage` event invalidation.
- `localStorageAdapter.test.ts`: Vitest suite verifying `localStorageAdapter` CRUD, ETag conflict detection, and cross-tab storage event invalidation.

[PROTOCOL]: Update this header on change, then check GEMINI.md
