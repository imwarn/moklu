import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function assertPngHeader(bytes, width, height) {
  expect(bytes.subarray(0, 8).equals(pngSignature)).toBe(true)
  expect(bytes.readUInt32BE(16)).toBe(width)
  expect(bytes.readUInt32BE(20)).toBe(height)
}

test('real Konva export matches complete deterministic RGBA golden, excludes overlays and restores zoom', async ({ page }) => {
  await page.goto('/tests/fixtures/export-harness.html')
  await expect(page.locator('#ready')).toHaveText('ready')
  const before = await page.evaluate(() => window.mokluExportQA.state())
  expect(before).toEqual({ overlayVisible: true, x: 17, y: 13, scaleX: 0.75, scaleY: 0.75 })

  const dataUrl = await page.evaluate(() => window.mokluExportQA.capture())
  const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
  assertPngHeader(bytes, 240, 240)
  const golden = await page.evaluate(async (url) => {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(img, 0, 0)
    const pixels = context.getImageData(0, 0, 240, 240).data
    // Independent browser-generated golden: avoid committing a truncated/corrupt
    // PNG fixture and compare all RGBA channels, including true transparency.
    const referenceCanvas = document.createElement('canvas')
    referenceCanvas.width = 240
    referenceCanvas.height = 240
    const referenceContext = referenceCanvas.getContext('2d', { willReadFrequently: true })
    referenceContext.fillStyle = '#ff3300'
    referenceContext.fillRect(40, 40, 80, 80)
    referenceContext.fillStyle = '#0033ff'
    referenceContext.fillRect(160, 140, 40, 60)
    const referencePixels = referenceContext.getImageData(0, 0, 240, 240).data
    let goldenMismatches = 0
    let mismatches = 0
    let transparent = 0
    let magenta = 0
    for (let y = 0; y < 240; y++) {
      for (let x = 0; x < 240; x++) {
        const i = (y * 240 + x) * 4
        const actual = Array.from(pixels.subarray(i, i + 4))
        let expected
        if (x >= 40 && x < 120 && y >= 40 && y < 120) expected = [255, 51, 0, 255]
        else if (x >= 160 && x < 200 && y >= 140 && y < 200) expected = [0, 51, 255, 255]
        else expected = [0, 0, 0, 0]
        if (actual[3] === 0) transparent++
        if (actual[0] === 255 && actual[1] === 0 && actual[2] === 255 && actual[3] === 255) magenta++
        if (actual.some((channel, index) => channel !== expected[index])) mismatches++
        if (actual.some((channel, index) => channel !== referencePixels[i + index])) goldenMismatches++
      }
    }
    return { mismatches, goldenMismatches, transparent, magenta }
  }, dataUrl)
  expect(golden).toEqual({ mismatches: 0, goldenMismatches: 0, transparent: 48_800, magenta: 0 })
  expect(await page.evaluate(() => window.mokluExportQA.state())).toEqual(before)
})

for (const mode of ['throw', 'mismatch']) {
  test('failed export (' + mode + ') restores visibility, zoom and lets the user retry', async ({ page }) => {
    await page.goto('/tests/fixtures/export-harness.html')
    await expect(page.locator('#ready')).toHaveText('ready')
    const before = await page.evaluate(() => window.mokluExportQA.state())
    const failed = await page.evaluate((fault) => window.mokluExportQA.failCapture(fault), mode)
    expect(failed.error).toMatch(mode === 'throw' ? /Injected canvas encoder failure/ : /dimensions mismatch/)
    expect(failed.state).toEqual(before)
    const recovered = await page.evaluate(() => window.mokluExportQA.capture())
    assertPngHeader(Buffer.from(recovered.split(',')[1], 'base64'), 240, 240)
  })
}

test('Quick Design screenshot upload produces a real downloadable PNG at the requested resolution', async ({ page, browserName }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/')
  await page.getByRole('button', { name: /Quick Design/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Quick Design' })
  await expect(dialog).toBeVisible()

  // Synthetic data avoids retaining any user's screenshots in test artifacts.
  const source = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 70
    const context = canvas.getContext('2d')
    context.fillStyle = '#ff3300'
    context.fillRect(0, 0, 40, 70)
    context.fillStyle = '#0033ff'
    context.fillRect(40, 0, 80, 70)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'synthetic-screenshot.png', mimeType: 'image/png', buffer: Buffer.from(source, 'base64'),
  })
  await expect(dialog.getByRole('status')).toContainText('synthetic-screenshot.png')
  await dialog.getByRole('combobox').nth(0).selectOption('wide')
  await dialog.getByRole('combobox').nth(1).selectOption('browser-chrome')
  const fit = browserName === 'firefox' ? 'contain' : browserName === 'webkit' ? 'fill' : 'cover'
  await dialog.locator('input[name="quick-screenshot-fit"][value="' + fit + '"]').check({ force: true })
  await dialog.getByRole('button', { name: 'Apply & Edit Design' }).click()
  await expect(dialog).toBeHidden()

  const downloadPromise = page.waitForEvent('download')
  await page.locator('button[title="Export the active canvas at its original size"]').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('moklu.png')
  const bytes = await readFile(await download.path())
  assertPngHeader(bytes, 1600, 900)
  expect(bytes.byteLength).toBeGreaterThan(1000)
})

test('9:16 Story exports exact portrait pixels through the real application', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Portrait UI smoke runs on Chromium; all engines execute the real-canvas RGBA golden')
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/')
  await page.getByRole('button', { name: /Quick Design/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Quick Design' })
  await dialog.getByRole('combobox').nth(0).selectOption('story')
  await dialog.getByRole('button', { name: 'Start with Empty Mockup' }).click()
  await expect(dialog).toBeHidden()
  const downloadPromise = page.waitForEvent('download')
  await page.locator('button[title="Export the active canvas at its original size"]').click()
  const download = await downloadPromise
  assertPngHeader(await readFile(await download.path()), 1080, 1920)
})

test('Quick Design is keyboard dismissible and restores focus to its launcher', async ({ page }) => {
  await page.goto('/')
  const launch = page.getByRole('button', { name: /Quick Design/ })
  await launch.focus()
  await launch.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Quick Design' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: /Start with Empty Mockup|Apply & Edit Design/ })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close quick design' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(launch).toBeFocused()
})

test('Quick Design form keyboard actions cannot trigger destructive editor shortcuts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Quick Design/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Quick Design' })
  await expect(dialog).toBeVisible()
  const canvas = dialog.getByRole('combobox').first()
  await canvas.focus()
  await page.keyboard.press('Backspace')
  await expect(dialog).toBeVisible()
  await expect(canvas).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('compact toolbar retains keyboard-reachable Quick Design and PNG actions', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 760 })
  await page.goto('/')
  const quick = page.getByRole('button', { name: /Quick Design/ }).first()
  const png = page.locator('button[title="Export the active canvas at its original size"]')
  await expect(quick).toBeAttached()
  await png.focus()
  await expect(png).toBeFocused()
  await expect(png).toBeEnabled()
})

test('mobile viewport reserves usable canvas and allows sidebars to open and close', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/')
  const layersToggle = page.getByRole('button', { name: 'Toggle layers panel' })
  const propertiesToggle = page.getByRole('button', { name: 'Toggle properties panel' })
  await expect(layersToggle).toBeVisible()
  await expect(propertiesToggle).toBeVisible()
  await expect(page.getByLabel('Layers sidebar')).toBeHidden()
  await expect(page.getByLabel('Properties sidebar')).toBeHidden()
  const stage = page.locator('.konvajs-content').first()
  await expect(stage).toBeVisible()
  expect((await stage.boundingBox())?.width).toBeGreaterThan(250)
  await layersToggle.click()
  await expect(page.getByLabel('Layers sidebar')).toBeVisible()
  await propertiesToggle.click()
  await expect(page.getByLabel('Layers sidebar')).toBeHidden()
  await expect(page.getByLabel('Properties sidebar')).toBeVisible()
  await propertiesToggle.click()
  await expect(page.getByLabel('Properties sidebar')).toBeHidden()
})

test('Quick Design preserves visible canvas after portrait-sized mobile apply', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/')
  await page.getByRole('button', { name: /Quick Design/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Quick Design' })
  await dialog.getByRole('combobox').first().selectOption('story')
  await dialog.getByRole('button', { name: 'Start with Empty Mockup' }).click()
  await expect(dialog).toBeHidden()
  const canvas = page.locator('.konvajs-content').first()
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box?.width).toBeGreaterThan(250)
  const state = await page.evaluate(() => {
    const root = document.querySelector('.konvajs-content')
    return { width: root?.clientWidth ?? 0, height: root?.clientHeight ?? 0 }
  })
  expect(state.width).toBeGreaterThan(250)
  expect(state.height).toBeGreaterThan(300)
})
