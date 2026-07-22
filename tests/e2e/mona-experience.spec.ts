import { expect, test } from '@playwright/test'

test('loads Mona before enabling entry and keeps one Three.js canvas', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
  const start = page.getByRole('button', { name: 'เริ่ม' })
  await expect(start).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)

  await start.click()
  await expect(page.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered')
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)
})
