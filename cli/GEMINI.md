# cli/
> L2 | Parent: ../GEMINI.md

Headless Node.js CLI (`moklu` / `pixeldeck`) for scripted Playwright PNG export and project locale manifest round-trips.

Member list
- `index.mjs`: Executable CLI entrypoint (`parseArgs` via `indexOf('=')`, help text, and subcommand dispatch for `export`, `locale-manifest`, and `locale-import`).
- `export.mjs`: Playwright Chromium headless export runner (`runExport`, `startServer`, `closeServer`, `collectAssetRefsFromProject`, `resolveAssetAliases`); serves `dist/`, injects `window.__EXPORT_CONFIG__`, validates PNGs, and manages static server error/close lifecycles.
- `locale.mjs`: Project localization manifest extractor and importer (`buildLocaleManifest`, `applyLocaleManifest`, `runLocaleManifest`, `runLocaleImport`).
- `png-output.mjs`: Strict PNG binary decoder and IHDR dimension validator (`decodeValidatedPng`) run before writing exported files to disk.
- `batch.example.yaml`: Sample multi-job YAML configuration for `export --config=<path>`.
- `README.md`: Usage guide, flag reference, and output naming contract for the CLI.
- `index.test.mjs`: Vitest suite verifying `parseArgs` (`=` preservation, flags) and `startServer`/`closeServer` port error and release semantics.
- `export-assets.test.mjs`: Vitest suite verifying project asset reference collection and filename alias resolution.
- `locale.test.mjs`: Vitest suite verifying locale manifest extraction and re-import round-trips.
- `png-output.test.mjs`: Vitest suite verifying PNG signature, IHDR, and dimension integrity checks.

[PROTOCOL]: Update this header on change, then check GEMINI.md
