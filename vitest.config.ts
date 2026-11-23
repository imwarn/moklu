/**
 * [INPUT]: depends on defineConfig from vitest/config and path from node:path
 * [OUTPUT]: exports the Vitest Node-environment test configuration with @ path alias and fake-indexeddb setup
 * [POS]: root Vitest config; runs unit suites under src/ and cli/ while excluding Playwright browser tests
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    // The browser suites are owned by Playwright, not Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/tests/live/**'],
    setupFiles: ['./src/test/setup-idb.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
