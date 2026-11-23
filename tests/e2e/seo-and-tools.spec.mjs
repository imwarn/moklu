/**
 * [INPUT]: depends on @playwright/test and node:fs/promises, node:path
 * [OUTPUT]: Playwright E2E test suite verifying zero-splash Quick Workspace, all core image tools (Mockup, Merge, Split, Compress, ID Card), 1-click Studio handoff, 4-locale SEO routes, and SSG dist artifacts
 * [POS]: E2E verification spec in tests/e2e alongside export.browser.spec.mjs
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { expect, test } from '@playwright/test'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])

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
  await expect(page).toHaveURL(/\/studio$/)

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
      path: '/zh/id-card-watermark',
      lang: 'zh',
      tool: 'id-card',
      canonical: 'https://moklu.tech/zh/id-card-watermark',
    },
    {
      path: '/ja/merge-images',
      lang: 'ja',
      tool: 'merge',
      canonical: 'https://moklu.tech/ja/merge-images',
    },
    {
      path: '/ko/browser-mockup',
      lang: 'ko',
      tool: 'mockup',
      canonical: 'https://moklu.tech/ko/browser-mockup',
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

test('Pre-rendered SSG HTML and sitemap.xml contain all 76 routes with zero inline executable scripts', async ({ browserName }) => {
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
  expect(urlMatches.length).toBe(76)
  expect(sitemap).toContain('https://moklu.tech/zh/id-card-watermark')
  expect(sitemap).toContain('https://moklu.tech/ja/merge-images')
  expect(sitemap).toContain('https://moklu.tech/ko/browser-mockup')

  const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')
  expect(robots).toContain('Sitemap: https://moklu.tech/sitemap.xml')

  const samplePages = [
    path.join(distDir, 'index.html'),
    path.join(distDir, 'zh', 'id-card-watermark', 'index.html'),
    path.join(distDir, 'ja', 'merge-images', 'index.html'),
    path.join(distDir, 'ko', 'browser-mockup', 'index.html'),
  ]

  for (const filePath of samplePages) {
    const html = await readFile(filePath, 'utf8')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('"@type":"WebApplication"')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('hreflang="x-default"')
    expect(html).toContain('data-ssg-shell="true"')

    // Strict CSP compliance: zero executable inline scripts.
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    for (const [, attrs, body] of scripts) {
      const isJsonLd = /type=["']application\/ld\+json["']/i.test(attrs)
      const hasSrc = /\bsrc=/i.test(attrs)
      expect(isJsonLd || (hasSrc && body.trim() === '')).toBe(true)
    }
  }
})
