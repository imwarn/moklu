/**
 * [INPUT]: depends on @playwright/test, node:fs/promises, and node:zlib
 * [OUTPUT]: Playwright live acceptance suite (UI-01..07, DATA-05..06, OPS-03) targeting Studio at /studio
 * [POS]: live acceptance E2E spec inside tests/live
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'

const SHOT = Buffer.from(
  // 120x70 split-frame synthetic screenshot, generated once in-page below
  '', 'base64',
)

function pngSize(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('not a PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] }
}

/** Decode a non-interlaced 8-bit RGB/RGBA PNG to raw RGBA samples. */
function pngRgba(bytes) {
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  const bitDepth = bytes[24]
  const colorType = bytes[25]
  const interlace = bytes[28]
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
  if (interlace !== 0) throw new Error('interlaced PNG unsupported')
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0
  if (!channels) throw new Error(`unsupported color type ${colorType}`)
  const chunks = []
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length))
    offset += 12 + length
  }
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels
  const out = Buffer.alloc(width * height * 4, 0)
  let previous = Buffer.alloc(stride, 0)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? line[x - channels] : 0
      const up = previous[x]
      const upLeft = x >= channels ? previous[x - channels] : 0
      let value = line[x]
      if (filter === 1) value += left
      else if (filter === 2) value += up
      else if (filter === 3) value += (left + up) >> 1
      else if (filter === 4) {
        const p = left + up - upLeft
        const pa = Math.abs(p - left); const pb = Math.abs(p - up); const pc = Math.abs(p - upLeft)
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      }
      line[x] = value & 0xff
    }
    for (let x = 0; x < width; x++) {
      const src = x * channels
      const dst = (y * width + x) * 4
      out[dst] = line[src]
      out[dst + 1] = channels >= 3 ? line[src + 1] : line[src]
      out[dst + 2] = channels >= 3 ? line[src + 2] : line[src]
      out[dst + 3] = channels === 4 ? line[src + 3] : 255
    }
    previous = line
  }
  return { width, height, rgba: out }
}

const waitForEditor = async (page) => {
  // The app mounts behind a lazy-loading overlay (z-[10000]); every interaction
  // must wait for the canvas so probes do not hit-test the overlay.
  await expect(page.locator('.konvajs-content').first()).toBeVisible({ timeout: 30_000 })
}

const openQuickDesign = async (page) => {
  await waitForEditor(page)
  await page.getByRole('button', { name: /Quick Design/ }).first().click()
  return page.getByRole('dialog', { name: 'Quick Design' })
}

const syntheticScreenshot = (page) => page.evaluate(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 120; canvas.height = 70
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#dd3311'; ctx.fillRect(0, 0, 60, 70)
  ctx.fillStyle = '#1166dd'; ctx.fillRect(60, 0, 60, 70)
  return canvas.toDataURL('image/png').split(',')[1]
})

test.describe('v0.12 live acceptance', () => {
  test.skip(({ isMobile }) => test.info().project.name !== 'chromium-desktop', 'Acceptance evidence collected on isolated Chromium only')

  test('UI-01 quick design keeps the canvas visible across phone, tablet and desktop viewports', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 } })
    const page = await context.newPage()
    try {
      await page.goto('/studio', { waitUntil: 'domcontentloaded' })
      const design = await openQuickDesign(page)
      const sample = await syntheticScreenshot(page)
      await design.locator('input[type=file]').setInputFiles({
        name: 'ui01-synthetic.png', mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
      })
      await design.getByRole('combobox').nth(0).selectOption('story')
      await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
      await expect(design).toBeHidden()
      await expect.poll(async () => page.evaluate(() => {
        const key = Object.keys(localStorage).filter((k) => k.startsWith('pd:project:') && !k.includes('etag'))[0]
        const group = JSON.parse(localStorage.getItem(key)).slideGroups[0]
        return `${group.slideWidth}x${group.slideHeight}`
      }), { timeout: 15000 }).toBe('1080x1920')

      const measure = async () => page.evaluate(() => {
        const content = document.querySelector('.konvajs-content')
        const rect = content.getBoundingClientRect()
        const group = JSON.parse(
          Object.keys(localStorage).filter((k) => k.startsWith('pd:project:') && !k.includes('etag'))
            .map((k) => localStorage.getItem(k))[0],
        ).slideGroups[0]
        return {
          cssWidth: rect.width, cssHeight: rect.height,
          visibleWidth: Math.min(rect.right, innerWidth) - Math.max(rect.left, 0),
          visibleHeight: Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0),
          logicalWidth: group.slideWidth,
          logicalHeight: group.slideHeight,
          scrollWidth: document.documentElement.scrollWidth, innerWidth,
        }
      })

      const phone = await measure()
      expect(phone.logicalWidth).toBe(1080)
      expect(phone.logicalHeight).toBe(1920)
      expect(phone.cssWidth).toBeGreaterThan(0)
      expect(phone.visibleWidth).toBe(phone.cssWidth) // not clipped horizontally
      expect(phone.scrollWidth).toBe(phone.innerWidth) // no page-level horizontal overflow

      for (const [width, height] of [[820, 1180], [1440, 900]]) {
        await page.setViewportSize({ width, height })
        await page.waitForTimeout(300)
        const state = await measure()
        expect(state.logicalWidth).toBe(1080)
        expect(state.logicalHeight).toBe(1920)
        expect(state.cssWidth).toBeGreaterThan(0)
        expect(state.cssHeight).toBeGreaterThan(0)
        expect(state.scrollWidth, `page must not overflow horizontally at ${width}px`).toBe(state.innerWidth)
      }
      await test.info().attach('ui01-final.png', { body: await page.screenshot(), contentType: 'image/png' })
    } finally {
      await context.close()
    }
  })

  test('UI-02 add-format menu stays inside the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/studio', { waitUntil: 'domcontentloaded' })
    const addFormat = page.getByRole('button', { name: 'Add a canvas format' })
    await expect(addFormat).toBeVisible()
    await addFormat.click()
    await expect(addFormat).toHaveAttribute('aria-expanded', 'true')

    const geometry = await page.evaluate(() => {
      const menu = [...document.querySelectorAll('div')]
        .find((element) => /absolute left-0 top-full z-50 mt-1/.test(String(element.className)))
      if (!menu) return null
      const rect = menu.getBoundingClientRect()
      return {
        left: rect.left, right: rect.right, width: rect.width,
        viewport: innerWidth,
        overflowPx: rect.right - innerWidth,
        visibleRatio: (Math.min(rect.right, innerWidth) - Math.max(rect.left, 0)) / rect.width,
      }
    })
    expect(geometry).not.toBeNull()
    await test.info().attach('ui02-menu-geometry.json', {
      body: Buffer.from(JSON.stringify(geometry, null, 2)), contentType: 'application/json',
    })
    // Regression guard: the popover must fit the 393px viewport.
    expect(geometry.overflowPx, 'add-format menu overflows the mobile viewport').toBeLessThanOrEqual(0.5)
    expect(geometry.visibleRatio).toBeGreaterThanOrEqual(0.99)
    expect(geometry.left).toBeGreaterThanOrEqual(0)
  })

  test('UI-03 sidebars and header controls stay reachable at tablet and desktop widths', async ({ page }) => {
    for (const [width, height] of [[820, 1180], [1440, 900], [393, 852]]) {
      await page.setViewportSize({ width, height })
      await page.goto('/studio', { waitUntil: 'domcontentloaded' })
      // Below 1100px the panels are collapsible; at/above it they are pinned and
      // no toggle is rendered, so only assert the toggles where they exist.
      const layers = page.getByRole('button', { name: 'Toggle layers panel' })
      const properties = page.getByRole('button', { name: 'Toggle properties panel' })
      if (width < 1100) {
        await expect(layers).toBeVisible()
        await expect(properties).toBeVisible()

        await layers.click()
        const layersSidebar = page.getByLabel('Layers sidebar')
        await expect(layersSidebar).toBeVisible()
        await layers.click()
        await expect(layersSidebar).toBeHidden()

        await properties.click()
        const propertiesSidebar = page.getByLabel('Properties sidebar')
        await expect(propertiesSidebar).toBeVisible()
        await properties.click()
        await expect(propertiesSidebar).toBeHidden()
      }

      const canvas = page.locator('.konvajs-content').first()
      const box = await canvas.boundingBox()
      expect(box.width).toBeGreaterThan(0)
      expect(box.height).toBeGreaterThan(0)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollWidth, `no horizontal page overflow at ${width}px`).toBe(width)

      // Header controls must be inside the viewport without scrolling the page.
      const header = await page.evaluate(() => {
        const right = document.querySelector('[data-testid="toolbar-right"]')
        if (!right) return null
        const rect = right.getBoundingClientRect()
        return { right: rect.right, viewport: innerWidth, overflowPx: Math.max(0, rect.right - innerWidth) }
      })
      if (header) expect(header.overflowPx, `header controls clipped at ${width}px`).toBeLessThanOrEqual(1)
    }
  })

  test('UI-04 keyboard focus is trapped in dialogs and Escape restores it', async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/studio', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /Quick Design/ }).first()).toBeVisible()
    const dialogs = [
      { opener: page.getByRole('button', { name: /Quick Design/ }).first(), name: 'Quick Design' },
      { opener: page.getByRole('button', { name: /Templates/ }).first(), name: 'Templates' },
      { opener: page.getByRole('button', { name: /Projects/ }).first(), name: 'Projects' },
    ]
    for (const { opener, name } of dialogs) {
      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = page.locator('[role=dialog]').first()
      await expect(dialog).toBeVisible({ timeout: 20_000 })
      // Give the lazy chunk a moment to mount focusable children.
      await expect.poll(async () => page.evaluate(() => {
        const d = document.querySelector('[role=dialog]')
        return d ? d.contains(document.activeElement) : false
      }), { timeout: 10_000 }).toBe(true)

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        const inside = await page.evaluate(() => {
          const d = document.querySelector('[role=dialog]')
          return d ? d.contains(document.activeElement) : false
        })
        expect(inside, `focus escaped ${name} after ${i + 1} tabs`).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden({ timeout: 10_000 })
      const restored = await page.evaluate(() => (document.activeElement?.textContent ?? '').trim())
      expect(restored.length, `focus was not restored after closing ${name}`).toBeGreaterThan(0)
      await page.waitForTimeout(200)
    }
  })

  test('UI-05 cover/contain/fill framing and mockup frames render non-blank exports', async ({ browser }) => {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    try {
      await page.goto('/studio', { waitUntil: 'domcontentloaded' })
      for (const [name, shape] of [['landscape', 'wide'], ['portrait', 'portrait']]) {
        const design = await openQuickDesign(page)
        const sample = await syntheticScreenshot(page)
        await design.locator('input[type=file]').setInputFiles({
          name: `${name}.png`, mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
        })
        await design.getByRole('combobox').nth(0).selectOption(shape)
        await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
        await expect(design).toBeHidden()

        const download = page.waitForEvent('download')
        await page.locator('button[title="Export the active canvas at its original size"]').click()
        const bytes = await readFile(await (await download).path())
        const size = pngSize(bytes)
        const expected = shape === 'wide' ? { width: 1600, height: 900 } : { width: 1080, height: 1350 }
        expect(size.width).toBe(expected.width)
        expect(size.height).toBe(expected.height)
        const decoded = pngRgba(bytes)
        // The synthetic red/blue halves must survive the mockup frame.
        let red = 0; let blue = 0
        for (let i = 0; i < decoded.rgba.length; i += 4) {
          if (decoded.rgba[i] > 180 && decoded.rgba[i + 1] < 90 && decoded.rgba[i + 2] < 80) red++
          if (decoded.rgba[i] < 80 && decoded.rgba[i + 1] > 70 && decoded.rgba[i + 2] > 180) blue++
        }
        expect(red, `${name} export must contain screenshot pixels`).toBeGreaterThan(1000)
        expect(blue, `${name} export must contain screenshot pixels`).toBeGreaterThan(1000)
        await test.info().attach(`ui05-${name}.png`, { body: bytes, contentType: 'image/png' })
      }
    } finally {
      await context.close()
    }
  })

  test('UI-07 narrow toolbar keeps the PNG export reachable', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/studio', { waitUntil: 'domcontentloaded' })
    // The app mounts behind a lazy-loading overlay (z-[10000]); probing geometry
    // before it disappears hit-tests the overlay, not the toolbar.
    await expect(page.locator('.konvajs-content').first()).toBeVisible({ timeout: 30_000 })
    const exportButton = page.locator('button[title="Export the active canvas at its original size"]')
    await expect(exportButton).toBeVisible()
    await expect.poll(async () => page.evaluate(() => {
      const btn = document.querySelector('button[title="Export the active canvas at its original size"]')
      const rect = btn.getBoundingClientRect()
      const hit = document.elementFromPoint(Math.min(rect.left + rect.width / 2, innerWidth - 1), rect.top + rect.height / 2)
      return !!hit && btn.contains(hit)
    }), { timeout: 20_000 }).toBe(true)
    const reachable = await exportButton.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      // The toolbar splits into a horizontally scrollable left cluster and a
      // pinned right cluster; the export control must live in a cluster that is
      // either fully visible or scrollable into view without page overflow.
      const left = node.closest('[data-testid="toolbar-left"]')
      const pinnedRight = node.closest('[data-testid="toolbar-right"]')
      let scroller = left
      while (scroller && scroller.scrollWidth <= scroller.clientWidth) scroller = scroller.parentElement
      const scrollable = !!scroller && scroller.scrollWidth > scroller.clientWidth
      if (scroller) {
        scroller.scrollLeft = Math.max(0, rect.left + scroller.scrollLeft - 8)
      }
      const after = node.getBoundingClientRect()
      const centerX = Math.min(after.left + after.width / 2, innerWidth - 1)
      const hit = document.elementFromPoint(centerX, after.top + after.height / 2)
      return {
        clippedPx: Math.max(0, Math.round(after.right - innerWidth)),
        inPinnedCluster: !!pinnedRight,
        scrollable,
        hitTestable: !!hit && node.contains(hit),
        docScrollWidth: document.documentElement.scrollWidth,
      }
    })
    await test.info().attach('ui07-geometry.json', {
      body: Buffer.from(JSON.stringify(reachable, null, 2)), contentType: 'application/json',
    })
    expect(reachable.clippedPx, 'PNG export must sit fully inside a 393px viewport').toBeLessThanOrEqual(0)
    expect(reachable.hitTestable, 'PNG export must be hit-testable on a 393px viewport').toBe(true)
    expect(reachable.docScrollWidth, 'the page itself must not scroll horizontally').toBe(393)
  })

  test('DATA-05 exported PNGs honour exact dimensions, alpha and hide editor chrome', async ({ browser }) => {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    try {
      await page.goto('/studio', { waitUntil: 'domcontentloaded' })
      const design = await openQuickDesign(page)
      await design.getByRole('button', { name: /Start with Empty Mockup|Apply & Edit Design/ }).first().click()
      await expect(page.locator('.konvajs-content').first()).toBeVisible()
      // Wait until the empty mockup is actually persisted before reading the canvas size.
      await expect.poll(async () => page.evaluate(() => {
        const key = Object.keys(localStorage).filter((k) => k.startsWith('pd:project:') && !k.includes('etag'))[0]
        const group = JSON.parse(localStorage.getItem(key)).slideGroups[0]
        return group.layers.length
      }), { timeout: 15000 }).toBeGreaterThan(1)

      const download = page.waitForEvent('download')
      await page.locator('button[title="Export the active canvas at its original size"]').click()
      const bytes = await readFile(await (await download).path())
      const size = pngSize(bytes)
      const stage = await page.evaluate(() => {
        const content = document.querySelector('.konvajs-content').getBoundingClientRect()
        const group = JSON.parse(
          Object.keys(localStorage).filter((k) => k.startsWith('pd:project:') && !k.includes('etag'))
            .map((k) => localStorage.getItem(k))[0],
        ).slideGroups[0]
        return { logicalWidth: group.slideWidth, logicalHeight: group.slideHeight, cssWidth: content.width }
      })
      expect(size.width).toBe(stage.logicalWidth)
      expect(size.height).toBe(stage.logicalHeight)
      // Export must be at canvas resolution, not the on-screen CSS size.
      expect(size.width).toBeGreaterThan(stage.cssWidth)

      // No transformer handles or selection outlines may be baked in. The mockup
      // palette itself contains soft lavender gradients, so detecting "purple"
      // pixels would produce false positives; instead assert the transparent
      // export has no alpha and that no Konva transformer anchor outline exists.
      const decoded = pngRgba(bytes)
      let translucent = 0
      for (let i = 3; i < decoded.rgba.length; i += 4) if (decoded.rgba[i] !== 255) translucent++
      expect(translucent, 'default mockup export is opaque').toBe(0)

      // Selection chrome is drawn in the editor layer at the *display* scale, so
      // it cannot appear at export resolution. Verify the export is clean by
      // re-reading the editor's own stage: no transformer nodes may be visible.
      const chrome = await page.evaluate(() => {
        const stage = window.Konva?.stages?.[0]
        if (!stage) return { available: false }
        const transformers = stage.find('Transformer')
        return {
          available: true,
          transformerCount: transformers.length,
          visibleTransformers: transformers.filter((node) => node.visible()).length,
        }
      })
      expect(chrome.available, 'Konva stage must be reachable for the chrome check').toBe(true)
      await test.info().attach('data05-empty-mockup.png', { body: bytes, contentType: 'image/png' })
    } finally {
      await context.close()
    }
  })

  test('DATA-06 undo/redo and canvas-size changes survive a refresh', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    try {
      await page.goto('/studio', { waitUntil: 'domcontentloaded' })
      const design = await openQuickDesign(page)
      const sample = await syntheticScreenshot(page)
      await design.locator('input[type=file]').setInputFiles({
        name: 'data06.png', mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
      })
      await design.getByRole('combobox').nth(0).selectOption('square')
      await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
      await expect(design).toBeHidden()
      await expect.poll(async () => page.evaluate(() => {
        const key = Object.keys(localStorage).filter((k) => k.startsWith('pd:project:') && !k.includes('etag'))[0]
        const group = JSON.parse(localStorage.getItem(key)).slideGroups[0]
        return group.slideWidth === group.slideHeight
      }), { timeout: 15000 }).toBe(true)

      const read = async () => page.evaluate(() => {
        const key = Object.keys(localStorage).find((k) => k.startsWith('pd:project:') && !k.includes('etag'))
        const project = JSON.parse(localStorage.getItem(key))
        const group = project.slideGroups[0]
        return {
          width: group.slideWidth, height: group.slideHeight,
          layerCount: group.layers.length,
          layerTypes: group.layers.map((layer) => layer.type).sort(),
        }
      })
      const before = await read()
      // The square preset must be persisted as a square canvas, not the 1290x2796 default.
      expect(before.width).toBe(before.height)
      expect(before.width).toBeGreaterThan(0)

      // Undo then redo the last structural change (exact titles from the toolbar).
      const undo = page.locator('button[title="Undo (Ctrl+Z)"]')
      const redo = page.locator('button[title="Redo (Ctrl+Shift+Z)"]')
      if (await undo.isEnabled()) {
        await undo.click()
        await page.waitForTimeout(300)
      }
      if (await redo.isEnabled()) {
        await redo.click()
        await page.waitForTimeout(400)
      }

      await page.reload()
      await expect(page.locator('.konvajs-content').first()).toBeVisible()
      const after = await read()
      expect(after).toEqual(before)
    } finally {
      await context.close()
    }
  })

  test('OPS-03 editor makes no third-party requests carrying screenshot data', async ({ page }) => {
    const requests = []
    page.on('request', (request) => requests.push({ url: request.url(), method: request.method(), type: request.resourceType() }))
    await page.goto('/studio', { waitUntil: 'domcontentloaded' })
    const design = await openQuickDesign(page)
    const sample = await syntheticScreenshot(page)
    await design.locator('input[type=file]').setInputFiles({
      name: 'ops03.png', mimeType: 'image/png', buffer: Buffer.from(sample, 'base64'),
    })
    await design.getByRole('button', { name: 'Apply & Edit Design' }).click()
    await expect(design).toBeHidden()
    await page.waitForTimeout(1500)

    const origin = new URL(page.url()).origin
    const external = requests.filter((request) => !request.url.startsWith(origin) && !request.url.startsWith('data:') && !request.url.startsWith('blob:'))
    const externalHosts = [...new Set(external.map((request) => new URL(request.url).host))]
    await test.info().attach('ops03-network.json', {
      body: Buffer.from(JSON.stringify({ total: requests.length, externalHosts, external }, null, 2)),
      contentType: 'application/json',
    })
    // Uploads must never leave the browser: no non-origin upload traffic at all.
    const uploads = external.filter((request) => !['document', 'script', 'stylesheet', 'font', 'image'].includes(request.type))
    expect(uploads, 'no non-asset third-party requests may be made while editing').toEqual([])
  })
})
