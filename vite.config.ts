/**
 * [INPUT]: depends on vite (defineConfig, loadEnv, Plugin), @vitejs/plugin-react, @tailwindcss/vite, node:path, node:child_process, and node:module; reads GITHUB_PAGES, SOURCE_COMMIT/COOLIFY_GIT_COMMIT_SHA/GITHUB_SHA/COMMIT_REF, and optional VITE_CF_BEACON_TOKEN env vars
 * [OUTPUT]: exports Vite build configuration with @ alias (using import.meta.dirname), git/version defines (with CI/Coolify env SHA fallback), conditional Cloudflare Web Analytics beacon injection, and client-only Rolldown codeSplitting isolating React, Konva, and DnD vendor chunks
 * [POS]: root Vite bundler configuration powering dev, production client builds, and temporary SSR prerender builds
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'
import { createRequire } from 'module'

// GitHub Pages deploys to /PixelDeck/ — set GITHUB_PAGES=true in the deploy workflow.
const base = process.env.GITHUB_PAGES === 'true' ? '/PixelDeck/' : '/'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as { version: string }

function getGitHash(): string {
  const envCommit = (
    process.env.SOURCE_COMMIT ||
    process.env.COOLIFY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_REF
  )?.trim()
  if (envCommit) return envCommit.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function cloudflareWebAnalyticsPlugin(token: string): Plugin {
  return {
    name: 'moklu-cloudflare-web-analytics',
    transformIndexHtml() {
      if (!token) return []
      return [
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            'data-cf-beacon': JSON.stringify({ token }),
          },
          injectTo: 'head',
        },
      ]
    },
  }
}

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const cfBeaconToken = (env.VITE_CF_BEACON_TOKEN ?? process.env.VITE_CF_BEACON_TOKEN ?? '').trim()

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __GIT_HASH__: JSON.stringify(getGitHash()),
    },
    plugins: [react(), tailwindcss(), cloudflareWebAnalyticsPlugin(cfBeaconToken)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      ...(isSsrBuild
        ? {}
        : {
            rolldownOptions: {
              output: {
                codeSplitting: {
                  groups: [
                    {
                      name: 'vendor-react',
                      test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                      priority: 40,
                    },
                    {
                      name: 'vendor-konva',
                      test: /node_modules[\\/](konva|react-konva|react-reconciler|use-image)[\\/]/,
                      priority: 30,
                    },
                    {
                      name: 'vendor-dnd',
                      test: /node_modules[\\/]@dnd-kit[\\/]/,
                      priority: 20,
                    },
                  ],
                },
              },
            },
          }),
    },
  }
})
