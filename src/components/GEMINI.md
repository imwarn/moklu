# components/
> L2 | Parent: ../GEMINI.md

Studio React/Konva component tree covering the canvas stage, inspector panels, modals, toolbar chrome, rich-text editors, and accessible UI primitives.

## Member list
- `AppLoadingScreen.tsx`: Full-screen Studio startup splash overlay (`AppLoadingScreen`) displaying `Logo` and animated loading words before fade-out unmount.
- `ai/`: Shared AI provider, API key, and model-discovery configuration UI (`AiProviderSettings`).
- `canvas/`: Konva stage viewport (`StageCanvas`), polymorphic layer dispatcher (`LayerNode`), concrete node renderers, in-canvas WYSIWYG text editor (`CanvasTextEditor`), thumbnail stage, and `stage/` interaction hooks.
- `common/`: Cross-cutting Studio components shared across toolbar, modals, and route boundaries (`BrandColorList`, `ChunkErrorBoundary`, `ConfirmDialog`).
- `panels/`: Studio sidebars (`LayersPanel`, `PropertiesPanel`), bottom filmstrip (`SlideNavigator`), and workflow modals (export, preview, projects, templates, quick design, settings, help, format/sync).
- `properties/`: Layer-type property inspectors (`BackgroundProperties`, `PhoneProperties`, `TextProperties`, `ShapeProperties`, `ImageProperties`, `EmojiProperties`, `BrandProperties`, `GroupProperties`), color/fill controls, and override badges.
- `text/`: Shared WYSIWYG `contentEditable` rich-text engine (`useRichTextEditor`), formatting toolbar (`RichTextToolbar`), panel fallback (`LayerTextToolbar`), and localization cell editor (`LocaleRichTextEditor`).
- `toolbar/`: Top Studio chrome (`Toolbar`), brand emblem (`Logo`), `BrandKitButton`, and `ReplaceScreenshotButton`.
- `ui/`: Low-level accessible Studio primitives (`ModalShell`, `SegmentedControl`, `ToggleSwitch`, `FileUploadButton`, `InlineEditableLabel`, `NumberInput`, `contextMenu`, `studioTokens`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
