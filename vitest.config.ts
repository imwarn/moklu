import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    // The browser suites are owned by Playwright, not Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    setupFiles: ['./src/test/setup-idb.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
