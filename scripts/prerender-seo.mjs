/**
 * [INPUT]: depends on node:child_process, node:fs/promises, node:path, node:url, vite (build); depends on ALL_ROUTES and getSiteUrl from ../src/seo/routes.ts; depends on getRouteRelativeHtmlPath, renderRouteHtml, generateSitemapXml, generateRobotsTxt, and generateLlmsTxt from ../src/seo/ssg.ts; builds temporary SSR bundle from ../src/seo/ssrEntry.ts
 * [OUTPUT]: exports getRouteOutputPath, resolveRouteLastmodMap, and prerenderSeoDist; runs as post-build CLI writing 120 static localized index.html pages with full React-rendered markup, git-derived lastmod sitemap.xml, robots.txt, and llms.txt into dist/
 * [POS]: post-build Node ESM SSG runner in scripts/, invoked after `vite build` to materialize zero-FOUC static HTML via react-dom/server renderToString
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build as viteBuild } from 'vite'
import { ALL_ROUTES, getSiteUrl } from '../src/seo/routes.ts'
import {
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  getRouteRelativeHtmlPath,
  renderRouteHtml,
} from '../src/seo/ssg.ts'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const GROWTH_ROUTE_SLUGS = new Set([
  'ipad-mockup',
  'watch-mockup',
  'stitch-screenshots',
  'heic-to-jpg',
  'remove-exif',
  'compress-image-to-200kb',
  'redact-screenshot',
])

const SECONDARY_TOOL_SLUGS = new Set([
  'merge-photos-to-pdf',
  'carousel-splitter',
  'image-grid-splitter',
  'compress-image',
  'convert-image-format',
  'png-to-webp',
  'resize-image',
  'crop-image',
  'add-border-to-photo',
  'id-card-watermark',
])

function getRouteLocaleSourceFiles(route) {
  if (route.isInfoPage) {
    return ['src/seo/locales/infoRoutes.ts', 'src/seo/locales/infoPages.ts']
  }
  if (GROWTH_ROUTE_SLUGS.has(route.slug)) {
    return [`src/seo/locales/${route.locale}GrowthRoutes.ts`]
  }
  if (SECONDARY_TOOL_SLUGS.has(route.slug)) {
    return [`src/seo/locales/${route.locale}Tools.ts`]
  }
  return [`src/seo/locales/${route.locale}.ts`]
}

function readGitCommitDate(relativePaths, fallbackDate) {
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...relativePaths],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(output)) {
      return output
    }
  } catch {
    // Shallow clone or isolated container without git history; fall back to today's UTC date.
  }
  return fallbackDate
}

export function resolveRouteLastmodMap(routes = ALL_ROUTES) {
  const fallbackDate = new Date().toISOString().slice(0, 10)
  const fileGroupCache = new Map()
  const result = new Map()

  for (const route of routes) {
    const files = getRouteLocaleSourceFiles(route)
    const cacheKey = files.join('|')
    let date = fileGroupCache.get(cacheKey)
    if (!date) {
      date = readGitCommitDate(files, fallbackDate)
      fileGroupCache.set(cacheKey, date)
    }
    result.set(route.path, date)
  }

  return result
}

export function getRouteOutputPath(distDir, route) {
  return path.join(distDir, ...getRouteRelativeHtmlPath(route))
}

async function compileAndLoadSsrRenderer() {
  // Place temporary SSR output under REPO_ROOT so Node ESM resolves project node_modules,
  // and always remove it in finally so the workspace and dist/ stay spotless.
  const ssrTmpDir = await mkdtemp(path.join(REPO_ROOT, '.moklu-ssr-'))
  try {
    await viteBuild({
      root: REPO_ROOT,
      configFile: path.join(REPO_ROOT, 'vite.config.ts'),
      logLevel: 'silent',
      build: {
        ssr: path.join(REPO_ROOT, 'src', 'seo', 'ssrEntry.ts'),
        outDir: ssrTmpDir,
        emptyOutDir: true,
        copyPublicDir: false,
        minify: false,
        rollupOptions: {
          output: {
            entryFileNames: 'ssrEntry.mjs',
            format: 'es',
          },
        },
      },
    })

    const entryUrl = `${pathToFileURL(path.join(ssrTmpDir, 'ssrEntry.mjs')).href}?t=${Date.now()}`
    const mod = await import(entryUrl)
    if (typeof mod.renderRouteMarkup !== 'function') {
      throw new Error('SSR entry bundle did not export renderRouteMarkup(route)')
    }
    return {
      renderRouteMarkup: mod.renderRouteMarkup,
      cleanup: () => rm(ssrTmpDir, { recursive: true, force: true }),
    }
  } catch (error) {
    await rm(ssrTmpDir, { recursive: true, force: true })
    throw error
  }
}

export async function prerenderSeoDist({
  distDir = path.resolve(process.argv[2] ?? 'dist'),
  siteUrl = getSiteUrl(),
  lastmod = process.env.MOKLU_SSG_LASTMOD || undefined,
  renderRouteMarkup: customRenderer,
} = {}) {
  const templatePath = path.join(distDir, 'index.html')
  const templateHtml = await readFile(templatePath, 'utf8')
  const normalizedBase = getSiteUrl(siteUrl)

  const compiled = customRenderer ? null : await compileAndLoadSsrRenderer()
  const renderMarkup = customRenderer ?? compiled.renderRouteMarkup

  try {
    const writtenFiles = []
    for (const route of ALL_ROUTES) {
      const bodyHtml = renderMarkup(route)
      const html = renderRouteHtml(templateHtml, route, normalizedBase, bodyHtml)
      const outputPath = getRouteOutputPath(distDir, route)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html, 'utf8')
      writtenFiles.push(outputPath)
    }

    const sitemapPath = path.join(distDir, 'sitemap.xml')
    const resolvedLastmod = lastmod ?? resolveRouteLastmodMap(ALL_ROUTES)
    await writeFile(sitemapPath, generateSitemapXml(normalizedBase, resolvedLastmod), 'utf8')

    const robotsPath = path.join(distDir, 'robots.txt')
    await writeFile(robotsPath, generateRobotsTxt(normalizedBase), 'utf8')

    const llmsPath = path.join(distDir, 'llms.txt')
    await writeFile(llmsPath, generateLlmsTxt(normalizedBase), 'utf8')

    return {
      ok: true,
      siteUrl: normalizedBase,
      routesWritten: writtenFiles.length,
      sitemapUrls: ALL_ROUTES.length,
      sitemapPath,
      robotsPath,
      llmsPath,
    }
  } finally {
    if (compiled) {
      await compiled.cleanup()
    }
  }
}

const isMainEntry =
  typeof process !== 'undefined' &&
  typeof process.argv?.[1] === 'string' &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMainEntry) {
  const report = await prerenderSeoDist()
  console.log(JSON.stringify(report, null, 2))
}
