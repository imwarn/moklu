# theme/
> L2 | Parent: ../GEMINI.md

Adaptive light/dark preference state for Moklu Quick Workspace and SEO pages, decoupled from Studio dark canvas chrome.

## Member list
- `themeStore.ts`: Zustand theme preference store (`light | dark | system`), `moklu:ui-theme` localStorage persistence, resolved theme helper, and document color-scheme applier.
- `themeStore.test.ts`: Vitest unit suite covering preference resolution, storage persistence, system sync, and workspace vs. studio chrome isolation.

[PROTOCOL]: Update this header on change, then check GEMINI.md
