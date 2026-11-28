/**
 * [INPUT]: depends on @playwright/test and node:fs/promises
 * [OUTPUT]: Playwright E2E test suite verifying 100% browser-local AI MODNet FP16 ID Photo Maker, zero desktop nav overflow across 8 tools, single-photo KB cap, 4-color compare & Trio ZIP download, 6-inch 300 DPI PNG/PDF print sheets, and 2-layer Studio handoff
 * [POS]: end-to-end browser verification spec for the ID Photo Maker tool inside tests/e2e
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff])
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const PDF_SIGNATURE = Buffer.from('%PDF-1.4')

test('ID Photo Maker (/zh/passport-photo-maker/) runs real local MODNet FP16 matting, Trio ZIP, 6-inch print sheet, and Studio handoff with zero console errors', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Full WASM ONNX + multi-format export flow runs once on Chromium')
  test.setTimeout(90_000)

  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // 1. Check 1024px desktop header fits all 8 tool nav pills without horizontal overflow
  await page.setViewportSize({ width: 1024, height: 820 })
  await page.goto('/zh/passport-photo-maker/')
  const headerOverflow = await page.locator('header').first().evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(headerOverflow).toBeLessThanOrEqual(1)

  await page.setViewportSize({ width: 1440, height: 920 })
  const workspace = page.getByTestId('quick-workspace')
  await expect(workspace).toHaveAttribute('data-active-tool', 'id-photo')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

  // 2. Click Try Demo Portrait -> runs real onnxruntime-web/wasm + /models/modnet-fp16.onnx in browser
  await workspace.getByTestId('id-photo-try-demo').click()
  const singleCanvas = workspace.getByTestId('id-photo-single-canvas')
  await expect(singleCanvas.locator('img')).toBeVisible({ timeout: 45_000 })
  await expect(workspace.getByTestId('id-photo-compliance-guides')).toBeVisible()
  await expect(workspace.getByTestId('id-photo-download')).toBeEnabled({ timeout: 45_000 })

  // 3. Enforce <=30KB exam cap and download single JPEG
  await workspace.getByRole('radio', { name: '<=30KB' }).click()
  await expect(workspace.getByTestId('id-photo-kb-status')).toContainText('<=30KB', { timeout: 15_000 })

  const singleDlPromise = page.waitForEvent('download')
  await workspace.getByTestId('id-photo-download').click()
  const singleDl = await singleDlPromise
  const singleBytes = await readFile(await singleDl.path())
  expect(singleBytes.subarray(0, 3).equals(JPEG_SIGNATURE)).toBe(true)
  expect(singleBytes.byteLength).toBeLessThanOrEqual(30 * 1024)

  // 4. Switch to Multi-Color Compare tab -> select Official Red -> download White/Blue/Red Trio ZIP
  await workspace.getByTestId('id-photo-tab-trio').click()
  await expect(workspace.getByTestId('id-photo-trio-view')).toBeVisible()
  await expect(workspace.getByTestId('id-photo-trio-card-red').locator('img')).toBeVisible({ timeout: 15_000 })
  await workspace.getByTestId('id-photo-trio-card-red').click()

  const trioDlPromise = page.waitForEvent('download')
  await workspace.getByTestId('id-photo-trio-cta').click()
  const trioDl = await trioDlPromise
  expect(trioDl.suggestedFilename()).toMatch(/\.zip$/i)
  const trioBytes = await readFile(await trioDl.path())
  expect(trioBytes.subarray(0, 4).equals(ZIP_SIGNATURE)).toBe(true)
  expect(trioBytes.byteLength).toBeGreaterThan(2000)

  // 5. Switch to Print Sheet tab -> verify 6-inch 4R photo count -> download PNG & 300 DPI PDF 1.4
  await workspace.getByTestId('id-photo-tab-sheet').click()
  await expect(workspace.getByTestId('id-photo-sheet-view')).toBeVisible()
  await expect(workspace.getByTestId('id-photo-sheet-preview')).toBeVisible({ timeout: 20_000 })
  await expect(workspace.getByTestId('id-photo-sheet-count')).toContainText(/(?:8|9|10)/)

  const sheetPngPromise = page.waitForEvent('download')
  await workspace.getByTestId('id-photo-sheet-png').click()
  const sheetPngDl = await sheetPngPromise
  const sheetPngBytes = await readFile(await sheetPngDl.path())
  expect(sheetPngBytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)

  const sheetPdfPromise = page.waitForEvent('download')
  await workspace.getByTestId('id-photo-sheet-pdf').click()
  const sheetPdfDl = await sheetPdfPromise
  const sheetPdfBytes = await readFile(await sheetPdfDl.path())
  expect(sheetPdfBytes.subarray(0, 8).equals(PDF_SIGNATURE)).toBe(true)

  // 6. Verify 2-layer Studio handoff navigates cleanly to /zh/studio/
  await workspace.getByRole('button', { name: /Studio/i }).click()
  await expect(page).toHaveURL(/\/zh\/studio\/?$/)

  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('Localized ID Photo route presets (/zh/id-photo-background-changer/ and /id-photo-print-sheet/) open directly on Trio and Print Sheet views', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Preset tab routing check runs once on Chromium')

  await page.goto('/zh/id-photo-background-changer/')
  const wsTrio = page.getByTestId('quick-workspace')
  await expect(wsTrio).toHaveAttribute('data-active-tool', 'id-photo')
  await expect(wsTrio.getByTestId('id-photo-tab-trio')).toHaveAttribute('aria-selected', 'true')

  await page.goto('/id-photo-print-sheet/')
  const wsSheet = page.getByTestId('quick-workspace')
  await expect(wsSheet).toHaveAttribute('data-active-tool', 'id-photo')
  await expect(wsSheet.getByTestId('id-photo-tab-sheet')).toHaveAttribute('aria-selected', 'true')
})
