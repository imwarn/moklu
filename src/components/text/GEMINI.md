# text/
> L2 | Parent: ../GEMINI.md

Unified WYSIWYG rich-text editing engine and formatting toolbar shared across the Konva canvas overlay, properties inspector, and localization table.

## Member list
- `LayerTextToolbar.tsx`: Whole-layer fallback adapter (`LayerTextToolbar`) supplying a non-interactive `RichTextEditorApi` to `RichTextToolbar` when the in-canvas editor is closed.
- `LocaleRichTextEditor.tsx`: Click-to-edit WYSIWYG cell editor (`LocaleRichTextEditor`, `LocaleRichTextEditorProps`) editing locale-scoped text and marks via a virtual `TextLayer` with optional portaled toolbar.
- `RichTextToolbar.tsx`: Formatting toolbar (`RichTextToolbar`) providing B/I/U/S toggles, font-weight selector, solid/gradient `FillControl` popover, and clear-formatting control without stealing editor focus.
- `useRichTextEditor.ts`: Core `contentEditable` hook (`useRichTextEditor`, `RichTextEditorApi`, `UseRichTextEditorOptions`, `toggleBoolPatch`) managing DOM-mark synchronization, selection tracking, mark patching, and temporal undo/redo routing.

[PROTOCOL]: Update this header on change, then check GEMINI.md
