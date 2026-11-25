# common/
> L2 | Parent: ../GEMINI.md

Cross-cutting resilient boundaries, confirmation dialogs, and brand-palette editors reused across Studio routes, toolbars, and modals.

## Member list
- `BrandColorList.tsx`: Reusable CRUD palette editor (`BrandColorList`) for project brand color tokens; supports compact popover mode in `BrandKitButton` and full mode in `SettingsModal`.
- `ChunkErrorBoundary.tsx`: React error boundary (`ChunkErrorBoundary`, `ChunkErrorBoundaryProps`) triggering one-shot `attemptChunkErrorRecovery` and rendering localized EN/ZH/JA/KO recovery UI for both `studio` and theme-adaptive `workspace` surfaces without blanking the app.
- `ChunkErrorBoundary.test.tsx`: Vitest suite verifying lazy-chunk error fallback rendering, localized copy, and reload recovery hooks.
- `ConfirmDialog.tsx`: Accessible confirmation modal (`ConfirmDialog`, `ConfirmDialogProps`) built on `ModalShell` with danger styling, disabled state, and localized defaults.
- `ConfirmDialog.test.tsx`: Vitest suite verifying `ConfirmDialog` keyboard dismissal, confirm/cancel callbacks, and ARIA semantics.

[PROTOCOL]: Update this header on change, then check GEMINI.md
