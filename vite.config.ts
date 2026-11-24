/**
 * [INPUT]: depends on vite (defineConfig, loadEnv, Plugin), @vitejs/plugin-react, @tailwindcss/vite, node:path, node:child_process, and node:module; reads GITHUB_PAGES and optional VITE_CF_BEACON_TOKEN env vars
 * [OUTPUT]: exports Vite build configuration with @ alias, git/version defines, and conditional Cloudflare Web Analytics beacon injection when VITE_CF_BEACON_TOKEN is set
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

export default defineConfig(({ mode }) => {
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
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // The main chunk includes Konva + react-konva (~400kB), which is unavoidable
      // for a canvas editor. All other code-splitting opportunities have been taken.
      chunkSizeWarningLimit: 800,
    },
  }
})
