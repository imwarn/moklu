# ui/
> L2 | Parent: ../GEMINI.md

Accessible, zero-business-logic Studio UI primitives, dark-surface contrast tokens, and floating context-menu positioning helpers.

## Member list
- `contextMenu.ts`: Viewport clamping (`CONTEXT_MENU_MARGIN`, `MenuPosition`, `clampMenuPosition`, `placeContextMenu`, `useClampedMenuPosition`) and WAI-ARIA keyboard navigation (`useContextMenuKeyboard`) for floating menus.
- `FileUploadButton.tsx`: Forward-ref file picker primitive (`FileUploadButton`) supporting button and keyboard/drag-and-drop dropzone variants with automatic input value reset.
- `InlineEditableLabel.tsx`: Double-click or externally controlled inline-rename primitive (`InlineEditableLabel`) with Enter/Escape/blur commit handling and event propagation isolation.
- `ModalShell.tsx`: Foundational accessible dialog shell (`ModalShell`) providing focus trapping, Escape dismissal, backdrop click handling, and AA-contrast close button.
- `NumberInput.tsx`: Numeric HTML input wrapper (`NumberInput`) emitting parsed numeric and raw string values via `onValueChange`.
- `panelA11y.test.tsx`: Vitest accessibility and responsiveness suite verifying ARIA roles, keyboard interactions, AA contrast tokens, Neutral Zinc surface convergence, 3-tone canvas backdrop switcher, and narrow-screen mobile modal/drawer layout classes across Studio UI primitives and panels.
- `SegmentedControl.tsx`: Accessible segmented option toggle (`SegmentedControl`, `SegmentedOption`) with WCAG AA inactive contrast.
- `StudioIcons.tsx`: Zero-dependency monochrome SVG icon components for Studio Toolbar, Insert panel, and Layers tree plus `LayerTypeIcon` dispatcher.
- `studioTokens.ts`: Single source of truth for Studio dark-surface color constants (`STUDIO_COLORS`) and static Tailwind utility class strings (`STUDIO_TEXT_MUTED_CLS`, `STUDIO_TEXT_SUBTLE_CLS`, `STUDIO_LABEL_CLS`, `STUDIO_SECTION_LABEL_CLS`, `STUDIO_SUBTLE_SECTION_LABEL_CLS`).
- `ToggleSwitch.tsx`: Boolean toggle primitive (`ToggleSwitch`) rendering either an ARIA `role="switch"` button or a native checkbox variant.

[PROTOCOL]: Update this header on change, then check GEMINI.md
