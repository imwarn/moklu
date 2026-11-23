# properties/
> L2 | Parent: ../GEMINI.md

Layer-type property editors, color/gradient/slider form controls, override badges, and shared temporal/style constants driving `PropertiesPanel`.

## Member list
- `BackgroundProperties.tsx`: Inspector panel (`BackgroundProperties`) for background fill, blurred backdrop image, tint overlay, radial accents, and procedural noise texture.
- `BrandProperties.tsx`: Inspector panel (`BrandProperties`) for app-logo upload, sizing, gap, direction, and title typography/color.
- `colorUtils.ts`: Pure color normalization and gradient-stop math (`clamp`, `rgbToHex`, `normalizeHexColor`, `sortStops`, `colorAtOffset`, `createLinearGradient`, `createRadialGradient`, `setStopOffset`, `updateStopColor`, `isEndStop`, `ensureEndStops`, `GRADIENT_PRESETS`, `SOLID_PRESETS`).
- `EmojiProperties.tsx`: Inspector panel (`EmojiProperties`) for emoji glyph selection and font-size scaling.
- `GroupProperties.tsx`: Inspector panel (`GroupProperties`) for group scale, member summary, group-edit entry, and ungrouping actions.
- `ImageProperties.tsx`: Inspector panel (`ImageProperties`) for raster image source, dimensions, and corner radius.
- `OverrideDot.tsx`: Per-property override indicator and reset menu (`OverrideDot`) visualizing composed format overrides and base/format locale layout adjustments.
- `panelConstants.ts`: Shared Zundo temporal helpers (`pauseTemporal`, `resumeTemporal`), `PanelTab` type, panel Tailwind class constants (`inputCls`, `labelCls`, `rowCls`, `fieldCls`, `panelSectionCls`, `subtleButtonCls`), and re-exported `studioTokens`.
- `PhoneProperties.tsx`: Content-tab inspector (`PhoneProperties`) for device/browser model selection, browser chrome, screenshot upload/fit/offset, status bar, and screen border.
- `PropertyControls.tsx`: Reusable fill and numeric form controls (`ColorField`, `GradientEditor`, `GradientEditorProps`, `FillControl`, `SliderField`) supporting solid colors, linear/radial gradients, presets, and brand tokens.
- `ShapeProperties.tsx`: Inspector panel (`ShapeProperties`) for shape variant, corner radius, star geometry, arrow direction, fill, and stroke controls.
- `shared.tsx`: Shared drop-shadow property section (`ShadowControls`) reused across layer style tabs.
- `TextProperties.tsx`: Inspector panel (`TextProperties`) with font-family picker (`FontPicker`), typography metrics, alignment, and `LayerTextToolbar` / canvas-edit entry.

[PROTOCOL]: Update this header on change, then check GEMINI.md
