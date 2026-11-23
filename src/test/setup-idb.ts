/**
 * [INPUT]: depends on fake-indexeddb/auto side-effect polyfill
 * [OUTPUT]: installs global IndexedDB globals for Vitest suites
 * [POS]: Vitest setup entrypoint of src/test/ referenced by vitest.config.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import 'fake-indexeddb/auto'
