# layers/
> L2 | Parent: ../GEMINI.md

Subcomponents and drag-and-drop contracts powering the left-sidebar `LayersPanel` asset library, sortable layer hierarchy, and context menu.

## Member list
- `AssetsSection.tsx`: Project screenshot library subsection (`AssetsSection`) with drag-to-canvas assets, file import, empty guidance, and full asset browser modal.
- `constants.ts`: Shared layer-tree contracts (`LayerTypeKey`, `ContextMenu`, `ItemData`) coordinating `LayersPanel`, `SortableLayerRow`, and `LayerContextMenu`.
- `LayerContextMenu.tsx`: Viewport-clamped floating WAI-ARIA layer menu (`LayerContextMenu`) supporting keyboard navigation and Escape dismissal.
- `SortableLayerRow.tsx`: `dnd-kit` sortable tree rows and drag overlay (`SortableLayer`, `SortableChild`, `SortableGroup`, `DragPreview`, plus prop interfaces `SortableLayerProps`, `SortableChildProps`, `SortableGroupProps`) with SVG layer icons, inline renaming, and AA contrast.

[PROTOCOL]: Update this header on change, then check GEMINI.md
