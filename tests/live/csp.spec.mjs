import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

/**
 * Exercises the deployed CSP. A policy can look correct and still block a
 * feature in silence, so this captures real `securitypolicyviolation` events
 * while driving the flows that touch every protected resource class:
 * fonts (style-src + font-src), screenshots (img-src data:/blob:),
 * project import (script-src self) and PNG export (blob:).
 */
test.describe('production CSP', () => {
  test.skip(({ isMobile }) => test.info().project.name !== 'chromium-desktop', 'CSP evidence collected on isolated Chromium only')
  test.setTimeout(120_000)

  const collectViolations = (page) => {
    const violations = []
    page.on('console', (message) => {
      const text = message.text()
      if (/Content Security Policy|Refused to (load|execute|connect|apply)/i.test(text)) {
        violations.push({ kind: 'console', text })
      }
    })
    page.on('pageerror', (error) => violations.push({ kind: 'pageerror', text: error.message }))
    return violations
  }

  const installListener = (page) => page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push({
        directive: event.effectiveDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        line: event.lineNumber,
      })
    })
  })

  const readViolations = (page) => page.evaluate(() => window.__cspViolations ?? [])

  test('the editor and its core flows run without CSP violations', async ({ browser }) => {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const consoleViolations = collectViolations(page)
    await installListener(page)
    try {
      const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)

      // The response must actually carry the policy, otherwise this test proves nothing.
      const csp = response.headers()['content-security-policy']
      expect(csp, 'the deployment must serve a Content-Security-Policy').toBeTruthy()
      expect(csp).toContain("script-src 'self'")
      expect(csp).not.toContain("'unsafe-eval'")

      await expect(page.locator('.konvajs-content').first()).toBeVisible({ timeout: 30_000 })

      // Font loading goes through a runtime-injected <link> (style-src + font-src).
      const fontsLoaded = await page.evaluate(async () => {
        const links = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href)
        await document.fonts.ready
        return { stylesheetLinks: links, fontsStatus: document.fonts.status }
      })
      expect(fontsLoaded.fontsStatus).toBe('loaded')

      // Screenshot upload exercises img-src data:/blob:.
      await page.getByRole('button', { name: /Quick Design/ }).first().click()
      const design = page.getByRole('dialog', { name: 'Quick Design' })
      await expect(design).toBeVisible()
      const sample = await page.evaluate(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 120; canvas.height = 70
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#dd3311'; ctx.fillRect(0, 0, 60, 70)
        ctx.fillStyle = '#1166dd'; ctx.fillRect(60, 0, 60, 70)
        return canvas.toDataURL('image/png').split(',')[1]
      })
      await design.locator('input[type=file]').setInputFiles({
        name: 'csp-probe.png', mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
      })
      await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
      await expect(design).toBeHidden()

      // PNG export exercises blob: creation and the download link.
      const download = page.waitForEvent('download')
      await page.locator('button[title="Export the active canvas at its original size"]').click()
      const bytes = await readFile(await (await download).path())
      expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)

      const violations = await readViolations(page)
      await test.info().attach('csp-violations.json', {
        body: Buffer.from(JSON.stringify({ violations, consoleViolations, csp }, null, 2)),
        contentType: 'application/json',
      })
      expect(violations, 'no securitypolicyviolation events are allowed').toEqual([])
      expect(
        consoleViolations.filter((v) => /Content Security Policy|Refused to/i.test(v.text)),
        'no CSP refusals may be logged',
      ).toEqual([])
    } finally {
      await context.close()
    }
  })

  test('provider endpoints are permitted by connect-src', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    const csp = response.headers()['content-security-policy'] ?? ''
    const connectSrc = (csp.split(';').map((p) => p.trim()).find((p) => p.startsWith('connect-src')) ?? '')

    // These three are called straight from the browser by src/ai/providers.ts.
    for (const origin of ['https://api.openai.com', 'https://openrouter.ai', 'https://generativelanguage.googleapis.com']) {
      expect(connectSrc, `connect-src must permit ${origin}`).toContain(origin)
    }
    await expect(page.locator('.konvajs-content').first()).toBeVisible({ timeout: 30_000 })
  })
})
