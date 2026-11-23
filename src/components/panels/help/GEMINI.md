# help/
> L2 | Parent: ../GEMINI.md

In-app help system loading Markdown chapters from `docs/help/*.md` at build time and rendering them with Studio typography primitives inside `HelpModal`.

## Member list
- `HelpMarkdown.tsx`: GFM + raw-HTML Markdown renderer (`HelpMarkdown`) mapping headings, lists, blockquotes, inline code, and shortcut tables onto `HelpPrimitives`.
- `HelpPrimitives.tsx`: Studio help visual building blocks (`Kbd`, `SectionHeader`, `ShortcutTable`, `GuideText`, `P`, `GuideList`, `GuideItem`, `Li`, `Strong`, `Callout`).
- `loadHelpChapters.ts`: Vite `import.meta.glob` loader (`HELP_CHAPTERS`, `HelpSectionId`, `HelpGroup`, `HelpChapter`) parsing YAML frontmatter and ordering chapters from `/docs/help/*.md`.

[PROTOCOL]: Update this header on change, then check GEMINI.md
