/**
 * [INPUT]: depends on @playwright/test, node:fs/promises, node:http, and node:path
 * [OUTPUT]: Playwright E2E test suite verifying zero-splash Quick Workspace, all core image tools (Mockup, Merge, Split, Compress, ID Card), 1-click Studio handoff, 4-locale SEO routes, SSG dist artifacts, and JS-disabled / hard-reload zero-FOUC parity
 * [POS]: E2E verification spec in tests/e2e alongside export.browser.spec.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { expect, test } from '@playwright/test'
import { access, readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

async function startStaticDistServer(distDir) {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = new URL(req.url || '/', 'http://127.0.0.1').pathname
      const safeRel = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\/+/, '')
      let filePath = path.join(distDir, safeRel)
      try {
        const info = await stat(filePath)
        if (info.isDirectory()) filePath = path.join(filePath, 'index.html')
      } catch {
        filePath = path.join(distDir, safeRel, 'index.html')
      }
      const data = await readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
      res.end(data)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

async function createSyntheticPngBuffer(page, width, height, color = '#4f46e5') {
  const base64 = await page.evaluate(
    ({ w, h, fill }) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = fill
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(Math.round(w * 0.15), Math.round(h * 0.15), Math.round(w * 0.7), Math.round(h * 0.7))
      return canvas.toDataURL('image/png').split(',')[1]
    },
    { w: width, h: height, fill: color },
  )
  return Buffer.from(base64, 'base64')
}

test('Home / loads Quick Workspace with zero Studio splash, Light/Dark toggle, and instant demo PNG export', async ({ page }) => {
  await page.goto('/')

  // Zero-splash: Quick Workspace is immediately visible without Studio's loading overlay.
  const workspace = page.getByTestId('quick-workspace')
  await expect(workspace).toBeVisible()
  await expect(page.locator('.moklu-loader-words')).toHaveCount(0)
  await expect(workspace).toHaveAttribute('data-active-tool', 'mockup')
  await expect(workspace).toHaveAttribute('data-theme', 'light')

  // Toggle theme from Light -> Dark and verify document + workspace state.
  await page.getByRole('button', { name: /Switch theme|Toggle theme|theme/i }).click()
  await expect(workspace).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: /Switch theme|Toggle theme|theme/i }).click()
  await expect(workspace).toHaveAttribute('data-theme', 'light')

  // Demo screenshot is preloaded; Download PNG yields a valid high-res PNG.
  const downloadPromise = page.waitForEvent('download')
  await workspace.getByRole('button', { name: 'Download PNG' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.png$/i)
  const bytes = await readFile(await download.path())
  expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  expect(bytes.byteLength).toBeGreaterThan(2000)
})

test('Merge, Split, Compress, and ID Card Watermark tools process images 100% locally in browser', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Full multi-tool matrix runs on Chromium; core home + handoff run across all engines')

  // 1. Merge tool (/merge-images)
  await page.goto('/merge-images')
  const mergeWorkspace = page.getByTestId('quick-workspace')
  await expect(mergeWorkspace).toHaveAttribute('data-active-tool', 'merge')
  await mergeWorkspace.getByRole('button', { name: 'Try 3-Image Demo' }).click()
  await expect(mergeWorkspace.locator('img[alt="Merged result preview"]')).toBeVisible()
  const mergeDlPromise = page.waitForEvent('download')
  await mergeWorkspace.getByRole('button', { name: 'Download Image' }).click()
  const mergeDl = await mergeDlPromise
  const mergeBytes = await readFile(await mergeDl.path())
  expect(mergeBytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)

  // 2. Split tool (/carousel-splitter)
  await page.goto('/carousel-splitter')
  const splitWorkspace = page.getByTestId('quick-workspace')
  await expect(splitWorkspace).toHaveAttribute('data-active-tool', 'split')
  await splitWorkspace.getByRole('button', { name: 'Try Demo Screenshot' }).click()
  await expect(splitWorkspace.locator('img[alt="Split cut-line preview"]')).toBeVisible()
  const zipBtn = splitWorkspace.getByRole('button', { name: /Download ZIP/ })
  await expect(zipBtn).toBeEnabled()
  const splitZipPromise = page.waitForEvent('download')
  await zipBtn.click()
  const splitZip = await splitZipPromise
  expect(splitZip.suggestedFilename()).toMatch(/\.zip$/i)
  const zipBytes = await readFile(await splitZip.path())
  expect(zipBytes.subarray(0, 4).equals(ZIP_SIGNATURE)).toBe(true)

  // 3. Compress tool (/compress-image)
  await page.goto('/compress-image')
  const compressWorkspace = page.getByTestId('quick-workspace')
  await expect(compressWorkspace).toHaveAttribute('data-active-tool', 'compress')
  const pngBuf = await createSyntheticPngBuffer(page, 600, 400, '#0ea5e9')
  await compressWorkspace.locator('input[type="file"]').setInputFiles({
    name: 'banner-upload.png',
    mimeType: 'image/png',
    buffer: pngBuf,
  })
  await expect(compressWorkspace).toContainText('banner-upload')
  await expect(compressWorkspace).toContainText('600×400')
  const compressDlPromise = page.waitForEvent('download')
  await compressWorkspace.getByRole('button', { name: 'Download Image' }).first().click()
  const compressDl = await compressDlPromise
  const compressedBytes = await readFile(await compressDl.path())
  expect(compressedBytes.byteLength).toBeGreaterThan(200)

  // 4. ID Card Watermark tool (/id-card-watermark)
  await page.goto('/id-card-watermark')
  const idWorkspace = page.getByTestId('quick-workspace')
  await expect(idWorkspace).toHaveAttribute('data-active-tool', 'id-card')
  await expect(idWorkspace.getByRole('status')).toBeVisible()
  await idWorkspace.getByRole('button', { name: 'Try Sample Mock ID' }).click()
  await expect(idWorkspace.locator('img[alt="A4 ID card print preview"]')).toBeVisible()
  const idDlPromise = page.waitForEvent('download')
  await idWorkspace.getByRole('button', { name: 'Download A4 Print PNG' }).click()
  const idDl = await idDlPromise
  const idBytes = await readFile(await idDl.path())
  expect(idBytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  expect(idBytes.byteLength).toBeGreaterThan(4000)
})

test('1-click Open in Studio handoff stages mockup layer into /studio and Tools link returns home', async ({ page }) => {
  await page.goto('/')
  const workspace = page.getByTestId('quick-workspace')
  await expect(workspace).toBeVisible()

  await workspace.getByRole('button', { name: /Open in Studio/i }).click()
  await expect(page).toHaveURL(/\/studio\/$/)

  // Konva stage mounts and the toolbar shows Quick Design + back-to-tools link.
  await expect(page.locator('.konvajs-content').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Quick Design/ })).toBeVisible()
  await expect(page.getByLabel('Layers sidebar')).toContainText(/Browser|Phone|Mockup|Background/i)

  // Clicking Tools link returns cleanly to Home Quick Workspace.
  await page.locator('a[title="Back to Home & Quick Tools"]').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('quick-workspace')).toBeVisible()
})

test('4-locale SEO routes sync lang, canonical, hreflang, JSON-LD, and tool presets', async ({ page }) => {
  const cases = [
    {
      path: '/zh/id-card-watermark/',
      lang: 'zh-CN',
      tool: 'id-card',
      canonical: 'https://moklu.app/zh/id-card-watermark/',
    },
    {
      path: '/ja/merge-images/',
      lang: 'ja',
      tool: 'merge',
      canonical: 'https://moklu.app/ja/merge-images/',
    },
    {
      path: '/ko/browser-mockup/',
      lang: 'ko',
      tool: 'mockup',
      canonical: 'https://moklu.app/ko/browser-mockup/',
    },
    {
      // Slashless incoming path also normalizes canonical to trailing slash
      path: '/zh/merge-images',
      lang: 'zh-CN',
      tool: 'merge',
      canonical: 'https://moklu.app/zh/merge-images/',
    },
  ]

  for (const item of cases) {
    await page.goto(item.path)
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang)
    await expect(page.getByTestId('quick-workspace')).toHaveAttribute('data-active-tool', item.tool)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical)
    const hreflangCount = await page.locator('link[rel="alternate"][hreflang]').count()
    expect(hreflangCount).toBe(5)
    const jsonLdCount = await page.locator('script[type="application/ld+json"]').count()
    expect(jsonLdCount).toBeGreaterThanOrEqual(2)
  }
})

test('Pre-rendered SSG HTML, sitemap.xml, and llms.txt contain all 92 routes with full React UI and zero inline executable scripts', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Filesystem SSG artifact check runs once on Chromium')
  const distDir = path.resolve('dist')
  try {
    await access(path.join(distDir, 'sitemap.xml'))
  } catch {
    test.skip(true, 'dist/ not built yet')
    return
  }

  const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
  const urlMatches = sitemap.match(/<url>/g) ?? []
  expect(urlMatches.length).toBe(92)
  expect(sitemap).toContain('https://moklu.app/zh/id-card-watermark/')
  expect(sitemap).toContain('https://moklu.app/ja/merge-images/')
  expect(sitemap).toContain('https://moklu.app/ko/browser-mockup/')
  expect(sitemap).toContain('https://moklu.app/merge-photos-to-pdf/')
  expect(sitemap).toContain('https://moklu.app/zh/privacy/')

  const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')
  expect(robots).toContain('Sitemap: https://moklu.app/sitemap.xml')

  const llms = await readFile(path.join(distDir, 'llms.txt'), 'utf8')
  expect(llms.startsWith('# Moklu')).toBe(true)
  expect(llms).not.toMatch(/<!doctype html|<html/i)
  expect(llms).toContain('在线图片拼接')

  const landingPages = [
    path.join(distDir, 'index.html'),
    path.join(distDir, 'zh', 'id-card-watermark', 'index.html'),
    path.join(distDir, 'ja', 'merge-images', 'index.html'),
    path.join(distDir, 'ko', 'browser-mockup', 'index.html'),
  ]

  for (const filePath of landingPages) {
    const html = await readFile(filePath, 'utf8')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('"@type":"WebApplication"')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('hreflang="x-default"')
    expect(html).toContain('data-testid="tool-landing-page"')
    expect(html).toContain('data-testid="quick-workspace"')
    expect(html).not.toContain('data-ssg-shell')

    // Strict CSP compliance: zero executable inline scripts.
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    for (const [, attrs, body] of scripts) {
      const isJsonLd = /type=["']application\/ld\+json["']/i.test(attrs)
      const hasSrc = /\bsrc=/i.test(attrs)
      expect(isJsonLd || (hasSrc && body.trim() === '')).toBe(true)
    }
  }

  const studioHtml = await readFile(path.join(distDir, 'studio', 'index.html'), 'utf8')
  expect(studioHtml).toContain('data-testid="studio-ssg-skeleton"')
  expect(studioHtml).not.toContain('data-ssg-shell')
})

test('Pre-rendered SSG renders full styled UI with JS disabled and has zero FOUC or console errors on reload', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'Static dist FOUC regression runs once on Chromium')
  const distDir = path.resolve('dist')
  try {
    await access(path.join(distDir, 'index.html'))
  } catch {
    test.skip(true, 'dist/ not built yet')
    return
  }

  const server = await startStaticDistServer(distDir)
  try {
    // 1. JS disabled: real styled header + Quick Workspace card + SEO sections, zero raw dump
    const noJsContext = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    })
    const noJsPage = await noJsContext.newPage()

    await noJsPage.goto(`${server.baseUrl}/`, { waitUntil: 'load' })
    await expect(noJsPage.locator('[data-ssg-shell]')).toHaveCount(0)
    await expect(noJsPage.locator('header')).toBeVisible()
    await expect(noJsPage.getByTestId('quick-workspace')).toBeVisible()
    await expect(noJsPage.locator('#seo-howto-heading')).toBeVisible()
    await expect(noJsPage.locator('#seo-faq-heading')).toBeVisible()

    const ssgHeaderBox = await noJsPage.locator('header').first().boundingBox()
    const ssgH1Box = await noJsPage.locator('h1').first().boundingBox()
    const ssgWsBox = await noJsPage.getByTestId('quick-workspace').boundingBox()
    expect(ssgHeaderBox).not.toBeNull()
    expect(ssgH1Box).not.toBeNull()
    expect(ssgWsBox).not.toBeNull()
    expect(ssgHeaderBox.height).toBeGreaterThanOrEqual(48)
    expect(ssgHeaderBox.height).toBeLessThanOrEqual(80)
    expect(ssgWsBox.width).toBeGreaterThan(900)

    // Verify localized /zh/id-card-watermark with JS disabled
    await noJsPage.goto(`${server.baseUrl}/zh/id-card-watermark`, { waitUntil: 'load' })
    await expect(noJsPage.locator('[data-ssg-shell]')).toHaveCount(0)
    await expect(noJsPage.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(noJsPage.getByTestId('quick-workspace')).toHaveAttribute('data-active-tool', 'id-card')
    await expect(noJsPage.locator('#seo-faq-heading')).toBeVisible()
    await noJsContext.close()

    // 2. JS enabled + hard reload (Cmd+R): header & H1 stay pixel-stable with 0 console errors
    const jsContext = await browser.newContext({
      javaScriptEnabled: true,
      viewport: { width: 1440, height: 900 },
    })
    const jsPage = await jsContext.newPage()
    const consoleErrors = []
    const pageErrors = []
    jsPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    jsPage.on('pageerror', (err) => pageErrors.push(String(err)))

    await jsPage.goto(`${server.baseUrl}/`, { waitUntil: 'networkidle' })
    await expect(jsPage.getByTestId('quick-workspace')).toBeVisible()

    const mountedHeaderBox = await jsPage.locator('header').first().boundingBox()
    const mountedH1Box = await jsPage.locator('h1').first().boundingBox()
    expect(Math.abs(mountedHeaderBox.y - ssgHeaderBox.y)).toBeLessThanOrEqual(2)
    expect(Math.abs(mountedHeaderBox.height - ssgHeaderBox.height)).toBeLessThanOrEqual(2)
    expect(Math.abs(mountedH1Box.y - ssgH1Box.y)).toBeLessThanOrEqual(2)
    expect(Math.abs(mountedH1Box.height - ssgH1Box.height)).toBeLessThanOrEqual(2)

    await jsPage.reload({ waitUntil: 'networkidle' })
    await expect(jsPage.getByTestId('quick-workspace')).toBeVisible()

    const reloadedHeaderBox = await jsPage.locator('header').first().boundingBox()
    const reloadedH1Box = await jsPage.locator('h1').first().boundingBox()
    expect(Math.abs(reloadedHeaderBox.y - ssgHeaderBox.y)).toBeLessThanOrEqual(2)
    expect(Math.abs(reloadedHeaderBox.height - ssgHeaderBox.height)).toBeLessThanOrEqual(2)
    expect(Math.abs(reloadedH1Box.y - ssgH1Box.y)).toBeLessThanOrEqual(2)
    expect(Math.abs(reloadedH1Box.height - ssgH1Box.height)).toBeLessThanOrEqual(2)

    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
    await jsContext.close()
  } finally {
    await server.close()
  }
})

test('ResizeQuickTool multi-image upload renders thumbnail filmstrip, switches preview, and removes single items', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Multi-image filmstrip regression runs once on Chromium')
  await page.goto('/resize-image')
  const workspace = page.getByTestId('quick-workspace')
  await expect(workspace).toHaveAttribute('data-active-tool', 'resize')

  const imgA = await createSyntheticPngBuffer(page, 640, 400, '#4f46e5')
  const imgB = await createSyntheticPngBuffer(page, 320, 480, '#10b981')
  await workspace.locator('input[type="file"]').setInputFiles([
    { name: 'slide-alpha.png', mimeType: 'image/png', buffer: imgA },
    { name: 'slide-beta.png', mimeType: 'image/png', buffer: imgB },
  ])

  const strip = workspace.getByTestId('resize-thumbnail-strip')
  await expect(strip).toBeVisible()
  const meta = workspace.getByTestId('resize-preview-meta')
  await expect(meta).toContainText('1/2')

  const mainPreview = workspace.getByTestId('resize-preview-image')
  await expect(mainPreview).toBeVisible()
  const firstSrc = await mainPreview.getAttribute('src')

  // Switch to image #2 via thumbnail filmstrip and verify preview src + meta badge update
  await workspace.getByTestId('resize-thumb-select-1').click()
  await expect(meta).toContainText('2/2')
  const secondSrc = await mainPreview.getAttribute('src')
  expect(secondSrc).not.toBe(firstSrc)

  // Remove first item and verify only 1 thumbnail remains and multi-index prefix clears
  await workspace.getByTestId('resize-thumb-remove-0').click()
  await expect(workspace.getByTestId('resize-thumb-1')).toHaveCount(0)
  await expect(workspace.getByTestId('resize-thumb-0')).toBeVisible()
  await expect(meta).not.toContainText('/2')
})

test('Localized /zh/studio renders Simplified Chinese Studio UI and switches UI language without losing canvas', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Localized Studio UI regression runs once on Chromium')
  await page.goto('/zh/studio')
  await expect(page.locator('.konvajs-content').first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

  // Verify Chinese toolbar, layers panel, properties panel, and slide navigator labels
  await expect(page.locator('header')).toContainText('工具箱')
  await expect(page.locator('header')).toContainText('快速设计')
  await expect(page.locator('header')).toContainText('设置')
  await expect(page.getByLabel('图层侧边栏')).toContainText('插入')
  await expect(page.getByLabel('图层侧边栏')).toContainText('图层')
  await expect(page.getByLabel('属性侧边栏')).toContainText('属性')

  // Switch Studio UI language to Japanese via Toolbar language switcher
  await page.locator('header button[data-testid="toolbar-lang-btn"]').click()
  await page.getByRole('menuitem', { name: /日本語/ }).click()
  await expect(page).toHaveURL(/\/ja\/studio\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.locator('header')).toContainText('ツール')

  // Switch back to English /studio/
  await page.locator('header button[data-testid="toolbar-lang-btn"]').click()
  await page.getByRole('menuitem', { name: /English/ }).click()
  await expect(page).toHaveURL(/\/studio\/$/)
  await expect(page.locator('header')).toContainText('Quick Design')
})

test('Built /zh/studio avoids eager modal micro-chunks on load and isolates lazy HelpModal chunk failure without blank screen', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'Built static chunk resilience test runs once on Chromium')
  const distDir = path.resolve('dist')
  try {
    await access(path.join(distDir, 'zh', 'studio', 'index.html'))
  } catch {
    test.skip(true, 'dist/ not built yet')
    return
  }

  const server = await startStaticDistServer(distDir)
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const requestedAssets = []
    page.on('request', (req) => {
      const reqUrl = req.url()
      if (reqUrl.includes('/assets/')) requestedAssets.push(reqUrl)
    })

    await page.goto(`${server.baseUrl}/zh/studio`, { waitUntil: 'networkidle' })
    await expect(page.locator('.konvajs-content').first()).toBeVisible()
    await expect(page.locator('header')).toContainText('快速设计')

    // Zero eager dynamic modal micro-chunk fetches on initial Studio load
    expect(requestedAssets.some((u) => /ProjectsModal-|TemplatesModal-|SettingsModal-|HelpModal-/i.test(u))).toBe(false)

    // Pre-seed cooldown guard so simulated offline HelpModal failure shows inline ChunkErrorBoundary
    // instead of looping reloads, and verify Studio stays interactive without blanking out.
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        'moklu:chunk-reload',
        JSON.stringify({ pathname: window.location.pathname, timestamp: Date.now() }),
      )
    })
    await page.route(/\/assets\/HelpModal-.*\.js$/, (route) => route.abort('failed'))
    await page.getByRole('button', { name: /帮助/ }).click()

    const inlineFallback = page.getByTestId('chunk-error-boundary-inline')
    await expect(inlineFallback).toBeVisible()
    await expect(inlineFallback).toContainText('Studio 资源已更新')
    await expect(inlineFallback).toContainText('刷新页面')
    // Canvas stays mounted and visible underneath!
    await expect(page.locator('.konvajs-content').first()).toBeVisible()

    // Dismissing inline fallback keeps Studio cleanly usable
    await inlineFallback.getByRole('button', { name: '关闭' }).click()
    await expect(inlineFallback).toHaveCount(0)

    await context.close()
  } finally {
    await server.close()
  }
})
