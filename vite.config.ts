/**
 * [INPUT]: depends on vite (defineConfig, loadEnv, Plugin), @vitejs/plugin-react, @tailwindcss/vite, node:fs, node:path, node:child_process, and node:module; reads GITHUB_PAGES, PaaS commit SHA env vars, .git/HEAD, and optional VITE_CF_BEACON_TOKEN
 * [OUTPUT]: exports Vite build configuration with @ alias (using import.meta.dirname), git/version defines (env SHA -> pure-fs .git/HEAD -> git CLI -> UTC build stamp fallback), client-only Geist Latin font preload plugin, low-priority body-injected Cloudflare Web Analytics beacon, and client-only Rolldown codeSplitting isolating React, Konva, and DnD vendor chunks
 * [POS]: root Vite bundler configuration powering dev, production client builds, and temporary SSR prerender builds
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { createRequire } from 'module'

// GitHub Pages deploys to /PixelDeck/ — set GITHUB_PAGES=true in the deploy workflow.
const base = process.env.GITHUB_PAGES === 'true' ? '/PixelDeck/' : '/'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as { version: string }

function readGitHashFromDotGit(rootDir: string): string {
  try {
    let gitDir = path.join(rootDir, '.git')
    if (!fs.existsSync(gitDir)) return ''
    const stat = fs.statSync(gitDir)
    if (stat.isFile()) {
      const pointer = fs.readFileSync(gitDir, 'utf8').trim()
      const match = /^gitdir:\s*(.+)$/i.exec(pointer)
      if (!match) return ''
      gitDir = path.resolve(rootDir, match[1].trim())
    }
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim()
    if (/^[0-9a-f]{7,40}$/i.test(head)) return head.slice(0, 7)
    const refMatch = /^ref:\s*(.+)$/i.exec(head)
    if (!refMatch) return ''
    const refName = refMatch[1].trim()
    const looseRefPath = path.join(gitDir, refName)
    if (fs.existsSync(looseRefPath)) {
      const sha = fs.readFileSync(looseRefPath, 'utf8').trim()
      if (/^[0-9a-f]{7,40}$/i.test(sha)) return sha.slice(0, 7)
    }
    const packedRefsPath = path.join(gitDir, 'packed-refs')
    if (fs.existsSync(packedRefsPath)) {
      const lines = fs.readFileSync(packedRefsPath, 'utf8').split(/\r?\n/)
      for (const line of lines) {
        if (!line || line.startsWith('#') || line.startsWith('^')) continue
        const [sha, name] = line.trim().split(/\s+/)
        if (name === refName && /^[0-9a-f]{7,40}$/i.test(sha)) return sha.slice(0, 7)
      }
    }
  } catch {
    // Ignore filesystem errors in isolated BuildKit containers.
  }
  return ''
}

function getUtcBuildStamp(): string {
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `b${yyyy}${mm}${dd}`
}

function getGitHash(): string {
  const envCommit = (
    process.env.SOURCE_COMMIT ||
    process.env.COOLIFY_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_REF ||
    process.env.GIT_COMMIT ||
    process.env.VITE_GIT_SHA
  )?.trim()
  if (envCommit && envCommit !== 'unknown') return envCommit.slice(0, 7)

  const fsSha = readGitHashFromDotGit(import.meta.dirname)
  if (fsSha) return fsSha

  try {
    const cliSha = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (cliSha) return cliSha
  } catch {
    // Isolated container build without .git or SOURCE_COMMIT (e.g. Coolify cache-preserving mode).
  }
  return getUtcBuildStamp()
}

const CRITICAL_FONT_ASSET_RE = /(?:^|\/)geist-latin-wght-normal-[^/]+\.woff2$/

function criticalFontPreloadPlugin(): Plugin {
  return {
    name: 'moklu-critical-font-preload',
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return []
      const fontAsset = Object.keys(ctx.bundle).find((fileName) =>
        CRITICAL_FONT_ASSET_RE.test(fileName),
      )
      if (!fontAsset) return []
      return [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `${base}${fontAsset.replace(/^\/+/, '')}`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
          },
          injectTo: 'head',
        },
      ]
    },
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
            fetchpriority: 'low',
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            'data-cf-beacon': JSON.stringify({ token }),
          },
          injectTo: 'body',
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
    plugins: [
      react(),
      tailwindcss(),
      ...(!isSsrBuild ? [criticalFontPreloadPlugin()] : []),
      cloudflareWebAnalyticsPlugin(cfBeaconToken),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web'],
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
