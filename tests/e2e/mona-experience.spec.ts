import { expect, test } from '@playwright/test'

test('reveals Mona through one persistent cinematic canvas', async ({ page }) => {
  test.setTimeout(60_000)

  await page.goto('/')

  await expect(page.getByTestId('loader-surface')).toBeVisible()
  await expect(page.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
  const start = page.getByRole('button', { name: 'เริ่มประสบการณ์กับ Mona' })
  await expect(start).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)

  await start.click()
  await expect(page.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered', {
    timeout: 8_000,
  })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('เรียนรู้ Three.js')
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)
})

test('honors reduced motion and reaches the stable entered state', async ({ page }) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const start = page.getByRole('button', { name: 'เริ่มประสบการณ์กับ Mona' })
  await expect(start).toBeVisible({ timeout: 30_000 })
  await start.click()

  await expect(page.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered', {
    timeout: 3_000,
  })
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)
})

test('keeps learning routes independent from the Mona canvas', async ({ page }) => {
  for (const route of ['/lessons', '/concepts', '/playground']) {
    await page.goto(route)
    await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(0)
  }
})
