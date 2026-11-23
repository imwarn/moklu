# slices/
> L2 | Parent: ../GEMINI.md

Modular Zustand slice creators composed into `useEditorStore` by `../index.ts`, each owning a single editor domain.

## Member list
- `clipboardSlice.ts`: Layer and style copy/cut/paste actions (`createClipboardSlice`).
- `formatSlice.ts`: Multi-format canvas switching, custom format CRUD, format overrides, and per-format visibility (`createFormatSlice`).
- `groupSlice.ts`: Layer grouping, dissolving, hierarchy moves, and child-layer mutations (`createGroupSlice`).
- `layerSlice.ts`: Layer CRUD, z-ordering, lock/visibility toggles, and typed layer factories (`createLayerSlice`).
- `localeLayoutSlice.ts`: Resetting 3-tier `localeAdjust` deltas at key, layer, or slide-group scope (`createLocaleLayoutSlice`).
- `localeSlice.ts`: Active locale switching, locale lifecycle (add/remove/relabel/promote), and single or batched `localeContent` updates (`createLocaleSlice`).
- `projectSlice.ts`: Project metadata/settings/brand-color updates, JSON import/export/reset, and template conversion/application (`createProjectSlice`).
- `selectionSlice.ts`: Transient selection, multi-selection, accent focus, inline text editing, group-edit mode, and viewport controls (`createSelectionSlice`).
- `slideGroupSlice.ts`: Slide-group CRUD, ordering, resizing, family forking, background updates, and cross-family content sync (`createSlideGroupSlice`, `resolveContentSyncSourceGroup`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
