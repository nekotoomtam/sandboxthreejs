import { expect, test } from '@playwright/test'

async function enterLessonLab(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /เข้าสู่บทเรียน/ }).click()
  await expect(page.locator('[data-lesson-phase="hub"]')).toBeVisible()
  await page.getByRole('button', { name: /เปิดหัวข้อ ห้องทดลอง/ }).click()
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()
}

test('opens the first lesson and renders a Three.js canvas', async ({ page }) => {
  await page.goto('/lessons')
  await page
    .getByRole('article')
    .filter({ hasText: 'Hello, Three.js' })
    .getByRole('link', { name: /เปิดบทเรียน/ })
    .click()

  await expect(page.getByRole('heading', { level: 1, name: 'Hello, Three.js' })).toBeVisible()
  await expect(page.getByText('MISSION BRIEFING')).toBeVisible()
  await enterLessonLab(page)
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)
  await expect(page.getByTestId('camera-azimuth')).toContainText('°')
})

test('moves between lesson topics inside the same chamber and exits to the topic hub', async ({
  page,
}) => {
  await page.goto('/lessons/hello-threejs')
  await page.getByRole('button', { name: /เข้าสู่บทเรียน/ }).click()
  await expect(page.locator('[data-lesson-phase="hub"]')).toBeVisible()

  await page.getByRole('button', { name: /เปิดหัวข้อ สามส่วน/ }).click()
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()

  await expect(page.locator('.lesson-lab__header h1')).toHaveText('จากรูปทรงสู่กล่องหนึ่งใบ')
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()

  await page.getByRole('button', { name: /ออกจากเนื้อหา/ }).click()
  await expect(page.locator('[data-lesson-phase="hub"]')).toBeVisible()
})

test('checks the rotation exercise from scene state', async ({ page }) => {
  await page.goto('/lessons/hello-threejs')
  await enterLessonLab(page)
  await page.getByRole('button', { name: 'ปรับค่า' }).click()
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
  await enterLessonLab(page)

  const editor = page.locator('.cm-content')
  await expect(editor).toBeVisible({ timeout: 15_000 })
  await expect(editor).toContainText('cube.rotation.y')
  const codeBox = await page.getByTestId('lesson-code-pane').boundingBox()
  const resultBox = await page.getByTestId('lesson-result-pane').boundingBox()
  expect(codeBox?.x).toBeLessThan(resultBox?.x ?? 0)

  await page.getByRole('button', { name: /^▶ Run$/ }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('รันสำเร็จ')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  await expect(page.getByRole('status')).toContainText('เยี่ยมเลย')
})

test('keeps the current preview visible when edited code fails', async ({ page }) => {
  await page.goto('/lessons/hello-threejs')
  await enterLessonLab(page)

  const editor = page.locator('.cm-content')
  await editor.fill('this is not valid JavaScript')
  await expect(page.getByRole('button', { name: /Run changes/ })).toBeVisible()
  await page.getByRole('button', { name: /Run changes/ }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('SyntaxError')
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)

  await page.getByRole('button', { name: 'คืนโค้ดเริ่มต้น' }).click()
  await expect(editor).toContainText('cube.rotation.y')
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)
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

test('persists lesson completion and restores it after reload', async ({ page }) => {
  await page.goto('/lessons/hello-threejs')
  await enterLessonLab(page)
  await page.getByRole('button', { name: 'ปรับค่า' }).click()
  await page.getByRole('spinbutton', { name: 'ค่าตัวเลขการหมุนแกน Y' }).fill('45')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByTestId('lesson-complete')).toBeVisible()

  await page.reload()
  await enterLessonLab(page)
  await expect(page.getByTestId('lesson-complete')).toBeVisible()

  await page.goto('/lessons')
  await expect(
    page.getByRole('article').filter({ hasText: 'Hello, Three.js' }),
  ).toContainText('ผ่านแล้ว')
})
