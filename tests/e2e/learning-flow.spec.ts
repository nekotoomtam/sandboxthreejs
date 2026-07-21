import { expect, test } from '@playwright/test'

test('opens the first lesson and renders a Three.js canvas', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /เริ่มบทแรก/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Hello, Three.js' })).toBeVisible()
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)
  await expect(page.getByTestId('camera-azimuth')).toContainText('°')
})

test('checks the rotation exercise from scene state', async ({ page }) => {
  await page.goto('/lessons/hello-threejs')
  const rotationY = page.getByRole('spinbutton', { name: 'ค่าตัวเลขการหมุนแกน Y' })

  await rotationY.fill('45')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByRole('status')).toContainText('เยี่ยมเลย')
})

test('reset restores the initial object transform', async ({ page }) => {
  await page.goto('/playground')
  const positionX = page.getByRole('spinbutton', { name: 'ค่าตัวเลขตำแหน่งแกน X' })

  await positionX.fill('2')
  await expect(positionX).toHaveValue('2')
  await page.getByRole('button', { name: /รีเซ็ต/ }).click()

  await expect(positionX).toHaveValue('0')
})

test('runs guided Three.js code and validates the resulting scene state', async ({ page }) => {
  await page.goto('/lessons/hello-threejs')
  await page.getByRole('button', { name: 'เขียนโค้ด' }).click()

  const editor = page.locator('.cm-content')
  await expect(editor).toBeVisible()
  await expect(editor).toContainText('cube.rotation.y')
  await page.getByRole('button', { name: /รันโค้ด/ }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('รันสำเร็จ')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  await expect(page.getByRole('status')).toContainText('เยี่ยมเลย')
})

test('searches the concept library and opens an interactive concept', async ({ page }) => {
  await page.goto('/concepts')
  await page.getByRole('searchbox').fill('rotation')

  await expect(page.getByRole('link', { name: /การหมุนวัตถุ/ })).toBeVisible()
  await page.getByRole('link', { name: /การหมุนวัตถุ/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'การหมุนวัตถุ' })).toBeVisible()
  await expect(page.getByRole('link', { name: /เอกสาร Three.js ทางการ/ })).toHaveAttribute(
    'href',
    /threejs\.org/,
  )
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)
})
