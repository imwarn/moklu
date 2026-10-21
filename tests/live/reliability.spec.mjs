import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'


function normalizedProject(bundle) {
  // Migration moves inline images into the asset map and may add a default
  // locale pointer to the same screenshot. Neither changes the user's design.
  const project = structuredClone(bundle.project)
  const walk = (layers) => {
    for (const layer of layers) {
      delete layer.screenshotDataUrl
      if (layer.localeContent?.en?.screenshotPath === layer.screenshotPath &&
          Object.keys(layer.localeContent.en).length === 1) {
        delete layer.localeContent.en
        if (!Object.keys(layer.localeContent).length) delete layer.localeContent
      }
      if (layer.children) walk(layer.children)
    }
  }
  for (const group of project.slideGroups) walk(group.layers)
  return project.slideGroups
}

function assertScreenshotAssets(bundle) {
  const assets = Object.values(bundle.assets ?? {})
  expect(assets.length, 'export should contain at least one screenshot asset').toBeGreaterThan(0)
  expect(assets.every((asset) => asset.startsWith('data:image/png;base64,'))).toBe(true)
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
      expect(alerts.some((message) => /missing|blank/i.test(message))).toBe(false)

      // A malformed JSON must be rejected without replacing the current project.
      await restoredPage.locator('input[type=file][accept=".json"]').setInputFiles({
        name: 'broken-project.json', mimeType: 'application/json', buffer: Buffer.from('{malformed'),
      })
      expect(alerts.length).toBeGreaterThan(0)
      await restoredPage.locator('button[title="Manage projects"]').click()
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
