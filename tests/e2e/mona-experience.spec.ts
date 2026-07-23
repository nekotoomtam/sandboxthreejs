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

  await page.getByRole('button', { name: 'สำรวจเส้นทางเรียน' }).click()
  await expect(page).toHaveURL(/\/worlds\/foundations$/, { timeout: 5_000 })
  await expect(page.locator('[data-world-journey-canvas="true"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('พื้นฐาน')
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
  for (const route of ['/worlds', '/lessons', '/concepts', '/playground']) {
    await page.goto(route)
    await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(0)
  }
})

test('travels from one chapter planet to the next on one journey canvas', async ({ page }) => {
  await page.goto('/worlds/foundations')
  await expect(page.locator('[data-world-journey-canvas="true"]')).toHaveCount(1)

  await page.getByRole('button', { name: /ดาวถัดไป/ }).click()

  await expect(page).toHaveURL(/\/worlds\/controls$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('การควบคุม')
  await expect(page.locator('[data-world-journey-canvas="true"]')).toHaveCount(1)
})

test('hands the foundations planet into the first lesson topic', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/worlds/foundations')
  await expect(
    page.locator('main.world-journey:not(.world-journey--sweeping)'),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByRole('link', { name: /Scene, Camera, Renderer/ }).click()

  await expect(page).toHaveURL(/\/lessons\/hello-threejs$/)
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()
  await expect(page.locator('.lesson-section-view__planet-horizon')).toBeVisible()
})
