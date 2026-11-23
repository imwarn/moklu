# localization/
> L2 | Parent: ../GEMINI.md

## Member list

- `types.ts`: shared TypeScript contracts (`LocalizableRow`, `UploadTarget`, `CellStatus`, `CellKey`) and `cellKey` builder
- `helpers.ts`: pure utilities for slide background preview, row collection, override completeness, locale asset keys, file label formatting, and platform badges
- `helpers.test.ts`: Vitest unit suite for `buildLocaleAssetKey` and `getFileLabel`
- `LocaleBar.tsx`: project language switcher bar, default-language picker trigger, preview button, and editor return action localized via `useStudioLocale`
- `LanguagePopover.tsx`: portal-anchored searchable language combobox supporting custom BCP-47 codes localized via `useStudioLocale`
- `BulkTranslateBar.tsx`: bulk AI translation control bar with overwrite toggle, progress/stop actions, and API-key CTA localized via `useStudioLocale`
- `ModeSelector.tsx`: per-layer localization mode (`auto`/`manual`/`skip`) segmented toggle localized via `useStudioLocale`
- `SlideGroupSection.tsx`: collapsible slide group localization matrix showing layer rows and locale columns localized via `useStudioLocale`
- `TextOverrideCell.tsx`: text layer translation cell with rich-text editor, AI translate/retry states, and formatting drift alerts localized via `useStudioLocale`
- `ImageOverrideCell.tsx`: phone/image layer screenshot override cell with upload/clear actions localized via `useStudioLocale`
- `PromoteLocaleDialog.tsx`: confirmation modal reviewing coverage and affected layers before promoting a language to default, localized via `useStudioLocale`

[PROTOCOL]: Update this header on change, then check GEMINI.md
