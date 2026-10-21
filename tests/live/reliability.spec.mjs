import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { normalizedProject } from './projectComparison.mjs'


function assertScreenshotAssets(bundle) {
  const assets = Object.values(bundle.assets ?? {})
  expect(assets.length, 'export should contain at least one screenshot asset').toBeGreaterThan(0)
  expect(assets.every((asset) => asset.startsWith('data:image/png;base64,'))).toBe(true)
}

async function pngPixelDigest(page, bytes) {
  // Compare the decoded RGBA pixels, not encoder-dependent PNG byte streams.
  return page.evaluate(async (base64) => {
    const binary = atob(base64)
    const png = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const bitmap = await createImageBitmap(new Blob([png], { type: 'image/png' }))
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('2D context unavailable for PNG comparison')
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data
    const sha256 = await crypto.subtle.digest('SHA-256', rgba)
    return {
      width: canvas.width,
      height: canvas.height,
      rgbaSha256: Array.from(new Uint8Array(sha256),
        (byte) => byte.toString(16).padStart(2, '0')).join(''),
    }
  }, bytes.toString('base64'))
}

// This test only uses disposable browser profiles, local synthetic images,
// and client-side project storage. No actual user account or server data is touched.
test('live project survives refresh, backs up with assets, restores in a fresh profile, and exports exact PNG', async ({ browser, baseURL }) => {
  test.skip(test.info().project.name !== 'chromium-desktop', 'Stateful reliability scenario runs in isolated Chromium')
  const origin = baseURL || 'https://moklu.tech'
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()
  page.on('dialog', (dialog) => dialog.accept())
  try {
    await page.goto(origin)
    await expect(page.getByRole('button', { name: /Quick Design/ }).first()).toBeVisible()
    await page.getByRole('button', { name: /Quick Design/ }).first().click()
    const design = page.getByRole('dialog', { name: 'Quick Design' })
    const sample = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 120
      canvas.height = 70
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#dd3311'
      ctx.fillRect(0, 0, 60, 70)
      ctx.fillStyle = '#1166dd'
      ctx.fillRect(60, 0, 60, 70)
      return canvas.toDataURL('image/png').split(',')[1]
    })
    await design.locator('input[type=file]').setInputFiles({
      name: 'moklu-live-synthetic.png', mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
    })
    await expect(design.getByRole('status')).toContainText('moklu-live-synthetic.png')
    await design.getByRole('combobox').nth(0).selectOption('wide')
    await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
    await expect(design).toBeHidden()

    const pngDownload = page.waitForEvent('download')
    await page.locator('button[title="Export the active canvas at its original size"]').click()
    const png = await pngDownload
    const pngBytes = await readFile(await png.path())
    expect(pngBytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))).toBe(true)
    expect(pngBytes.readUInt32BE(16)).toBe(1600)
    expect(pngBytes.readUInt32BE(20)).toBe(900)
    const originalPixels = await pngPixelDigest(page, pngBytes)
    await test.info().attach('original-synthetic-export.png', { body: pngBytes, contentType: 'image/png' })

    await page.locator('button[title="Manage projects"]').click()
    const firstJsonDownload = page.waitForEvent('download')
    await page.locator('button[title="Export project as JSON"]').first().click()
    const savedJsonDownload = await firstJsonDownload
    const savedJson = await readFile(await savedJsonDownload.path())
    const bundle = JSON.parse(savedJson.toString('utf8'))
    assertScreenshotAssets(bundle)
    await page.reload()
    await expect(page.locator('button[title="Manage projects"]')).toBeVisible()
    await page.locator('button[title="Manage projects"]').click()
    const afterReload = page.waitForEvent('download')
    await page.locator('button[title="Export project as JSON"]').first().click()
    const reloaded = JSON.parse((await readFile(await (await afterReload).path())).toString('utf8'))
    expect(normalizedProject(reloaded)).toEqual(normalizedProject(bundle))
    expect(reloaded.assets).toEqual(bundle.assets)

    const restored = await browser.newContext({ acceptDownloads: true })
    const restoredPage = await restored.newPage()
    const alerts = []
    restoredPage.on('dialog', async (dialog) => { alerts.push(dialog.message()); await dialog.accept() })
    try {
      await restoredPage.goto(origin)
      await restoredPage.locator('button[title="Manage projects"]').click()
      await restoredPage.locator('input[type=file][accept=".json"]').setInputFiles({
        name: 'moklu-test-backup.json', mimeType: 'application/json', buffer: savedJson,
      })
      await expect(restoredPage.locator('button[title="Manage projects"]')).toBeVisible()
      await restoredPage.locator('button[title="Manage projects"]').click()
      const importedDownload = restoredPage.waitForEvent('download')
      await restoredPage.locator('button[title="Export project as JSON"]').first().click()
      const imported = JSON.parse((await readFile(await (await importedDownload).path())).toString('utf8'))
      expect(normalizedProject(imported)).toEqual(normalizedProject(bundle))
      expect(imported.assets).toEqual(bundle.assets)
      // Close the Projects dialog after JSON export. Its backdrop intercepts
      // clicks on the editor's PNG button while the dialog is still open.
      const projectsDialog = restoredPage.getByRole('dialog').filter({
        has: restoredPage.getByRole('heading', { name: 'Projects' }),
      })
      await expect(projectsDialog).toBeVisible()
      await projectsDialog.getByRole('button', { name: '×' }).click({ timeout: 5000 })
      await expect(projectsDialog).toBeHidden()

      // A successful JSON import must restore the rendered screenshot too,
      // not merely preserve its references and embedded bytes.
      await expect(restoredPage.locator('.konvajs-content').first()).toBeVisible()
      const restoredPngDownload = restoredPage.waitForEvent('download')
      await restoredPage.locator('button[title="Export the active canvas at its original size"]').click()
      const restoredPngBytes = await readFile(await (await restoredPngDownload).path())
      await test.info().attach('restored-synthetic-export.png', { body: restoredPngBytes, contentType: 'image/png' })
      expect(await pngPixelDigest(restoredPage, restoredPngBytes)).toEqual(originalPixels)
      expect(alerts.some((message) => /missing|blank/i.test(message))).toBe(false)

      // Reopen Projects for the malformed-file check after closing it for PNG.
      await restoredPage.locator('button[title="Manage projects"]').click()
      await expect(projectsDialog).toBeVisible()
      // A malformed JSON must be rejected without replacing the current project.
      await restoredPage.locator('input[type=file][accept=".json"]').setInputFiles({
        name: 'broken-project.json', mimeType: 'application/json', buffer: Buffer.from('{malformed'),
      })
      await expect.poll(() => alerts.length, { timeout: 5000 }).toBeGreaterThan(0)
      // A rejected import leaves the Projects dialog open; do not try to
      // reopen it through the toolbar behind its backdrop.
      await expect(projectsDialog).toBeVisible()
      const safeDownload = restoredPage.waitForEvent('download')
      await restoredPage.locator('button[title="Export project as JSON"]').first().click()
      const safe = JSON.parse((await readFile(await (await safeDownload).path())).toString('utf8'))
      expect(normalizedProject(safe)).toEqual(normalizedProject(imported))
      expect(safe.assets).toEqual(imported.assets)
    } finally {
      await restored.close()
    }
  } finally {
    await context.close()
  }
})
