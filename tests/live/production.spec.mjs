/**
 * [INPUT]: depends on @playwright/test
 * [OUTPUT]: Playwright deployed production smoke suite verifying Studio shell, Quick Design, and mobile panels at /studio
 * [POS]: live smoke E2E spec inside tests/live
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { expect, test } from '@playwright/test'

test('deployed shell, core controls, and same-origin static bundles load', async ({ page }) => {
  const failedAssets = []
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.origin === new URL(test.info().project.use.baseURL).origin &&
        /\.(js|css|woff2?)(?:\?|$)/.test(url.pathname) &&
        response.status() >= 400) failedAssets.push(`${response.status()} ${url.pathname}`)
  })
  await page.goto('/studio/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: /Quick Design/ }).first()).toBeVisible()
  await page.getByRole('button', { name: /Quick Design/ }).first().click()
  await expect(page.getByRole('dialog', { name: 'Quick Design' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Quick Design' })).toBeHidden()
  expect(failedAssets).toEqual([])
})

test('mobile format and sidebars are accessible on the deployed site', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/studio/')
  const format = page.getByRole('combobox', { name: 'Canvas format' })
  const addFormat = page.getByRole('button', { name: 'Add a canvas format' })
  await expect(format).toBeVisible()
  await expect(addFormat).toBeVisible()
  await addFormat.click()
  await expect(addFormat).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('.konvajs-content').first()).toBeVisible()
  await page.getByRole('button', { name: 'Toggle layers panel' }).click()
  await expect(page.getByLabel('Layers sidebar')).toBeVisible()
  await page.getByRole('button', { name: 'Toggle layers panel' }).click()
  await expect(page.getByLabel('Layers sidebar')).toBeHidden()
})
