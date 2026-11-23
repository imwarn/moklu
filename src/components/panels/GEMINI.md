# panels/
> L2 | Parent: ../GEMINI.md

Studio sidebars, bottom slide filmstrip, and workflow dialogs orchestrating layer management, property inspection, multi-format export, previews, templates, projects, and in-app help.

## Member list
- `ApiKeysModal.tsx`: Standalone AI configuration modal (`ApiKeysModal`) wrapping `AiProviderSettings` inside `ModalShell`.
- `CanvasSizeModal.tsx`: Non-destructive artboard dimension editor (`CanvasSizeModal`) supporting format presets and proportional layout scaling.
- `ContentSyncModal.tsx`: Cross-family content synchronization dialog (`ContentSyncModal`) launched from `EditingContextBar` to propagate text/assets across format families.
- `CreateFormatLayoutModal.tsx`: Format-family layout fork dialog (`CreateFormatLayoutModal`) launched from `EditingContextBar` to scaffold derived canvas formats.
- `ExportModal.tsx`: Batch multi-format and multi-locale PNG, ZIP, and directory export modal (`ExportModal`) coordinating offscreen stage captures.
- `HelpModal.tsx`: Interactive Moklu user guide modal (`HelpModal`) rendering grouped chapters from `help/loadHelpChapters` via `help/HelpMarkdown`.
- `LayersPanel.tsx`: Left Studio sidebar (`LayersPanel`) combining Insert layer triggers, `layers/AssetsSection`, and the `dnd-kit` sortable layer tree.
- `PreviewModal.tsx`: Full-strip slide preview modal (`PreviewModal`) comparing rendered thumbnails across canvas formats and project content locales.
- `ProjectsModal.tsx`: Local IndexedDB project manager (`ProjectsModal`) for switching, creating, renaming, importing, exporting, and deleting projects with `Intl.RelativeTimeFormat` timestamps.
- `PropertiesPanel.tsx`: Right Studio inspector (`PropertiesPanel`) hosting Layout/Style/Content tabs, alignment bar, copy/paste style, and dispatching to `src/components/properties/*`.
- `QuickDesignModal.tsx`: Guided single-canvas mockup wizard (`QuickDesignModal`) launched from `Toolbar` with live `QuickDesignPreview`.
- `QuickDesignPreview.tsx`: Lightweight live SVG mockup preview (`QuickDesignPreview`, `QuickDesignPreviewProps`) shared by `QuickDesignModal` and Quick Workspace `MockupQuickTool`.
- `SettingsModal.tsx`: Global AI provider and per-project Brand Kit / Pano preferences dialog (`SettingsModal`) embedding `AiProviderSettings` and `BrandColorList`.
- `SlideNavigator.tsx`: Bottom slide-group filmstrip (`SlideNavigator`) supporting `dnd-kit` reordering, live thumbnails, viewport-clamped context menu, and `ExportModal` launch.
- `TemplatesModal.tsx`: Template gallery, JSON/ZIP import/export, and selective appearance restyling dialog (`TemplatesModal`).
- `help/`: In-app help Markdown renderer (`HelpMarkdown`), typography primitives (`HelpPrimitives`), and build-time chapter loader (`loadHelpChapters`).
- `layers/`: `LayersPanel` subcomponents (`AssetsSection`, `SortableLayerRow`, `LayerContextMenu`) and shared drag/icon contracts (`constants`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
