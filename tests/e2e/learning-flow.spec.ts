import { expect, test } from '@playwright/test'

async function enterLessonLab(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()
  await expect(page.locator('.lesson-section-view__practice')).toBeVisible()
}

test('opens the first lesson and renders a Three.js canvas', async ({ page }) => {
  await page.goto('/lessons')
  await page
    .getByRole('article')
    .filter({ hasText: 'Hello, Three.js' })
    .getByRole('link', { name: /เปิดบทเรียน/ })
    .click()

  await expect(page.locator('.lesson-lab__header h1')).toHaveText('สามส่วนที่ทำให้ฉากปรากฏ')
  await expect(page.locator('.lesson-section-view__planet-horizon')).toBeVisible()
  await enterLessonLab(page)
  await expect(page.locator('[data-sandbox-canvas="true"]')).toHaveCount(1)
  await expect(page.getByTestId('camera-azimuth')).toContainText('°')
})

test('moves between lesson topics inside the same chamber and exits to the world', async ({
  page,
}) => {
  await page.goto('/lessons/hello-threejs')
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()

  await expect(page.locator('.lesson-lab__header h1')).toHaveText('จากรูปทรงสู่กล่องหนึ่งใบ')
  await expect(page.locator('[data-lesson-phase="section"]')).toBeVisible()

  await page.getByRole('link', { name: /ออกจากบทเรียน/ }).click()
  await expect(page).toHaveURL(/\/worlds\/foundations$/)
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
  await editor.fill(
    `cube.rotation.y = THREE.MathUtils.degToRad(45)
console.log('Rotation Y:', THREE.MathUtils.radToDeg(cube.rotation.y))`,
  )
  const codeBox = await page.getByTestId('lesson-code-pane').boundingBox()
  const resultBox = await page.getByTestId('lesson-result-pane').boundingBox()
  expect(codeBox?.x).toBeLessThan(resultBox?.x ?? 0)

  await page.getByRole('button', { name: /Run changes/ }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('รันสำเร็จ')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()
  await expect(page.getByRole('status')).toContainText('เยี่ยมเลย')
})

test('runs renderer, floor, and light bindings inside the worker sandbox', async ({
  page,
}) => {
  await page.goto('/lessons/hello-threejs')
  await enterLessonLab(page)

  await page.locator('.cm-content').fill(
    `renderer.shadowMap.enabled = true
light.position.set(-3, 6, 4)
light.intensity = 2.5
floor.receiveShadow = true
console.log(renderer.shadowMap.enabled, light.intensity, floor.receiveShadow)`,
  )
  await page.getByRole('button', { name: /Run changes/ }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('true 2.5 true')
})

test('checks the latest editor contents without requiring a separate Run click', async ({
  page,
}) => {
  await page.goto('/lessons/hello-threejs')
  await enterLessonLab(page)

  const editor = page.locator('.cm-content')
  await editor.fill(
    `cube.rotation.y = THREE.MathUtils.degToRad(45)
console.log('Rotation Y:', THREE.MathUtils.radToDeg(cube.rotation.y))`,
  )

  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByTestId('code-run-status')).toContainText('รันสำเร็จ')
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
  await expect(
    page.getByTestId('lesson-complete').getByRole('link', {
      name: 'ฝึกต่อใน Playground',
    }),
  ).toHaveCount(0)

  await page.reload()
  await enterLessonLab(page)
  await expect(page.getByTestId('lesson-complete')).toBeVisible()

  await page.goto('/lessons')
  await expect(
    page.getByRole('article').filter({ hasText: 'Hello, Three.js' }),
  ).toContainText('ผ่านแล้ว')
})

test('completes the transform lesson by matching the target box with code', async ({
  page,
}) => {
  await page.goto('/lessons/position-rotation-scale')

  await expect(page.locator('.lesson-lab__header h1')).toHaveText(
    'ย้ายวัตถุด้วย Position',
  )
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()
  await expect(page.locator('.lesson-lab__header h1')).toHaveText(
    'หมุนวัตถุให้ถูกแกน',
  )
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()
  await expect(page.locator('.lesson-lab__header h1')).toHaveText(
    'กำหนดสัดส่วนด้วย Scale',
  )
  await page.getByRole('button', { name: 'ไปเนื้อหาถัดไป' }).click()
  await expect(page.locator('.lesson-section-view__practice-intro p')).toContainText(
    'STEP 04',
  )

  await page.locator('.cm-content').fill(
    `cube.position.set(1.5, 1, -0.5)
cube.rotation.set(0, THREE.MathUtils.degToRad(45), 0)
cube.scale.set(1.25, 0.75, 1.25)`,
  )
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByRole('status')).toContainText('ยอดเยี่ยม')
  await expect(page.getByTestId('lesson-complete')).toBeVisible()
})
