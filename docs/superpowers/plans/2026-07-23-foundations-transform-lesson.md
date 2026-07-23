# Foundations Transform Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Foundations Lesson 02, teaching position, rotation, and scale through a translucent target-box matching exercise that works from controls or code.

**Architecture:** Keep the existing lesson chamber and sandbox runtime. Add one focused lesson definition, a reusable target transform constant, translucent material options, and a dedicated validator. Make code-mode validation run the current editor contents before grading so validation never reads a stale scene.

**Tech Stack:** React 19, TypeScript, Three.js, React Router, Vitest, Testing Library, Playwright, Vite.

## Global Constraints

- Preserve the existing in-planet lesson chamber and navigation pattern.
- The learner must be able to solve the lab through either numeric controls or code.
- `Check answer` in code mode runs the latest code before validating it.
- Syntax or runtime errors must remain visible and must not complete the exercise.
- Starter code represents an incomplete state.
- Do not add final next-lesson or next-planet navigation in this pass.
- Do not remove Playground until the shared progression pass.
- Shared sandbox changes must remain compatible with Lesson 01.

---

## File Map

- `src/components/CodeLab.tsx` — exposes a safe imperative command for running the current editor contents.
- `src/components/SandboxWorkspace.tsx` — coordinates run-then-validate behavior.
- `src/lessons/content/helloThree.ts` — changes Lesson 01 starter code from a pre-solved answer to an incomplete value.
- `src/sandbox/sandbox.types.ts` — adds optional transparent material properties.
- `src/sandbox/runtime/SandboxRuntime.ts` — maps material properties into Three.js.
- `src/exercises/transformTarget.ts` — owns the target transform and tolerances.
- `src/exercises/validator.registry.ts` — validates the target-box exercise.
- `src/lessons/content/positionRotationScale.ts` — defines Lesson 02 content, scene, code lab, and exercise.
- `src/lessons/lesson.registry.ts` — publishes Lesson 02.
- `src/worlds/world.registry.ts` — makes Foundations lesson card 02 available.
- `src/exercises/validator.registry.test.ts` — covers each validator outcome.
- `src/lessons/lesson.registry.test.ts` — covers Lesson 02 publication order.
- `src/worlds/world.registry.test.ts` — covers the new world-to-lesson link.
- `tests/e2e/learning-flow.spec.ts` — covers stale-code regression and the complete Lesson 02 journey.

---

### Task 1: Run Current Code Before Validation

**Files:**
- Modify: `src/components/CodeLab.tsx`
- Modify: `src/components/SandboxWorkspace.tsx`
- Modify: `src/lessons/content/helloThree.ts`
- Test: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- Produces: `CodeLabHandle.runCurrentCode(): Promise<CodeRunResult | undefined>`
- Consumes: existing `runSandboxCode(code, snapshot)` and `onApplySnapshot(snapshot)`
- Behavior: code-mode validation grades the returned snapshot directly after a successful worker run.

- [ ] **Step 1: Add the failing stale-scene regression test**

Add this test to `tests/e2e/learning-flow.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```powershell
npx playwright test tests/e2e/learning-flow.spec.ts -g "latest editor contents"
```

Expected: FAIL because `Check answer` validates the unchanged zero-degree scene and the code-run status never appears.

- [ ] **Step 3: Expose the current code runner from `CodeLab`**

Refactor `CodeLab.tsx` to use `forwardRef` and `useImperativeHandle`:

```ts
import { forwardRef, useImperativeHandle, useState } from 'react'

export type CodeLabHandle = {
  runCurrentCode: () => Promise<CodeRunResult | undefined>
}

export const CodeLab = forwardRef<CodeLabHandle, CodeLabProps>(function CodeLab(
  { definition, snapshot, onApplySnapshot },
  ref,
) {
  // existing state remains here

  const runCurrentCode = async () => {
    if (!snapshot || isRunning) return undefined
    setIsRunning(true)
    setResult(undefined)
    const nextResult = await runSandboxCode(code, snapshot)
    setResult(nextResult)
    setIsRunning(false)

    if (nextResult.status === 'success' && nextResult.snapshot) {
      setLastSuccessfulCode(code)
      onApplySnapshot(nextResult.snapshot)
    }

    return nextResult
  }

  useImperativeHandle(ref, () => ({ runCurrentCode }), [code, isRunning, snapshot])

  const handleRun = () => {
    void runCurrentCode()
  }

  // retain the existing JSX and close forwardRef with `})`
})
```

- [ ] **Step 4: Make `SandboxWorkspace` validate the newly run snapshot**

Import the handle type, attach the ref, and make validation asynchronous:

```ts
import type { CodeLabHandle } from './CodeLab'

const codeLabRef = useRef<CodeLabHandle>(null)
const [isValidating, setIsValidating] = useState(false)

const handleValidate = async () => {
  if (!exercise || isValidating) return
  setIsValidating(true)

  let currentSnapshot = canvasRef.current?.getSnapshot()
  if (workspaceMode === 'code' && codeLab) {
    const codeResult = await codeLabRef.current?.runCurrentCode()
    if (codeResult?.status !== 'success' || !codeResult.snapshot) {
      setIsValidating(false)
      return
    }
    currentSnapshot = codeResult.snapshot
  }

  if (currentSnapshot) {
    const validationResult = validateExercise(exercise.validator, currentSnapshot)
    setResult(validationResult)
    if (validationResult.passed) onExercisePassed?.(exercise.id)
  }

  setIsValidating(false)
}
```

Pass `ref={codeLabRef}` to `CodeLab`. Change the check button to:

```tsx
<button
  type="button"
  onClick={() => void handleValidate()}
  disabled={isValidating}
>
  {isValidating ? 'กำลังตรวจ…' : 'ตรวจคำตอบ'}
</button>
```

- [ ] **Step 5: Make Lesson 01 starter code incomplete**

In `src/lessons/content/helloThree.ts`, replace the pre-solved line with:

```ts
starterCode: `// เปลี่ยน 0 เป็นมุมที่โจทย์ต้องการ
cube.rotation.y = THREE.MathUtils.degToRad(0)

console.log('Rotation Y:', THREE.MathUtils.radToDeg(cube.rotation.y))`,
```

- [ ] **Step 6: Verify GREEN and existing run behavior**

Run:

```powershell
npx playwright test tests/e2e/learning-flow.spec.ts -g "latest editor contents|runs guided Three.js code|keeps the current preview"
```

Expected: 3 tests PASS. Invalid code still preserves the prior preview and cannot complete the exercise.

- [ ] **Step 7: Commit the shared validation fix**

```powershell
git add src/components/CodeLab.tsx src/components/SandboxWorkspace.tsx src/lessons/content/helloThree.ts tests/e2e/learning-flow.spec.ts
git commit -m "fix: validate the latest lesson code"
```

---

### Task 2: Render a Translucent Target Object

**Files:**
- Modify: `src/sandbox/sandbox.types.ts`
- Modify: `src/sandbox/runtime/SandboxRuntime.ts`
- Create: `src/exercises/transformTarget.ts`
- Test: `src/sandbox/runtime/SandboxRuntime.test.ts`

**Interfaces:**
- Produces: optional material fields `opacity`, `transparent`, `wireframe`, and `depthWrite`.
- Produces: `MATCH_TARGET_TRANSFORM: ObjectTransform`
- Produces: `MATCH_TARGET_TOLERANCE` with position, rotation, and scale tolerances.

- [ ] **Step 1: Add a failing runtime material test**

Extend `SandboxRuntime` with an exported pure material-parameter helper and first add this test to `src/sandbox/runtime/SandboxRuntime.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { materialParameters } from './SandboxRuntime'

describe('sandbox material parameters', () => {
  it('preserves translucent target material options', () => {
    expect(
      materialParameters({
        color: '#8bdcff',
        opacity: 0.28,
        transparent: true,
        wireframe: true,
        depthWrite: false,
      }),
    ).toMatchObject({
      color: '#8bdcff',
      opacity: 0.28,
      transparent: true,
      wireframe: true,
      depthWrite: false,
    })
  })
})
```

- [ ] **Step 2: Run the material test and verify RED**

Run:

```powershell
npm test -- src/sandbox/runtime/SandboxRuntime.test.ts
```

Expected: FAIL because the material fields and `materialParameters` do not exist.

- [ ] **Step 3: Extend the material definition**

In `src/sandbox/sandbox.types.ts`, add:

```ts
readonly material: {
  readonly color: string
  readonly roughness?: number
  readonly metalness?: number
  readonly opacity?: number
  readonly transparent?: boolean
  readonly wireframe?: boolean
  readonly depthWrite?: boolean
}
```

- [ ] **Step 4: Map the new fields into Three.js**

In `SandboxRuntime.ts`, add:

```ts
export function materialParameters(
  material: SandboxObjectDefinition['material'],
): THREE.MeshStandardMaterialParameters {
  return {
    color: material.color,
    roughness: material.roughness ?? 0.5,
    metalness: material.metalness ?? 0,
    opacity: material.opacity ?? 1,
    transparent: material.transparent ?? false,
    wireframe: material.wireframe ?? false,
    depthWrite: material.depthWrite ?? true,
  }
}
```

Then create materials with:

```ts
const material = new THREE.MeshStandardMaterial(
  materialParameters(objectDefinition.material),
)
```

- [ ] **Step 5: Add the shared target transform**

Create `src/exercises/transformTarget.ts`:

```ts
import type { ObjectTransform } from '../sandbox/sandbox.types'

export const MATCH_TARGET_TRANSFORM: ObjectTransform = {
  position: [1.5, 1, -0.5],
  rotation: [0, 45, 0],
  scale: [1.25, 0.75, 1.25],
}

export const MATCH_TARGET_TOLERANCE = {
  position: 0.05,
  rotation: 2,
  scale: 0.05,
} as const
```

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm test -- src/sandbox/runtime/SandboxRuntime.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit target rendering support**

```powershell
git add src/sandbox/sandbox.types.ts src/sandbox/runtime/SandboxRuntime.ts src/sandbox/runtime/SandboxRuntime.test.ts src/exercises/transformTarget.ts
git commit -m "feat: support translucent sandbox targets"
```

---

### Task 3: Validate Position, Rotation, and Scale

**Files:**
- Modify: `src/exercises/validator.registry.ts`
- Modify: `src/exercises/validator.registry.test.ts`

**Interfaces:**
- Produces validator ID: `match-cube-transform`
- Consumes: `MATCH_TARGET_TRANSFORM` and `MATCH_TARGET_TOLERANCE`
- Feedback order: missing cube → position → rotation → scale → success.

- [ ] **Step 1: Add failing validator tests**

Add a snapshot helper accepting a complete transform and these tests:

```ts
import type { ObjectTransform } from '../sandbox/sandbox.types'
import { MATCH_TARGET_TRANSFORM } from './transformTarget'

function snapshotWithTransform(transform: ObjectTransform): SandboxSnapshot {
  return {
    objects: { 'learning-cube': transform },
    camera: {
      position: [4.6, 3.5, 5.4],
      target: [0, 0.5, 0],
      azimuthDegrees: 40.4,
      elevationDegrees: 25.1,
      distance: 7.1,
    },
  }
}

it('passes when the cube matches the target transform', () => {
  expect(
    validateExercise('match-cube-transform', snapshotWithTransform(MATCH_TARGET_TRANSFORM)),
  ).toMatchObject({ passed: true })
})

it.each([
  ['Position', { ...MATCH_TARGET_TRANSFORM, position: [1.2, 1, -0.5] }],
  ['Rotation', { ...MATCH_TARGET_TRANSFORM, rotation: [0, 30, 0] }],
  ['Scale', { ...MATCH_TARGET_TRANSFORM, scale: [1, 0.75, 1.25] }],
] as const)('reports the first mismatched %s group', (label, transform) => {
  const result = validateExercise(
    'match-cube-transform',
    snapshotWithTransform(transform as ObjectTransform),
  )
  expect(result.passed).toBe(false)
  expect(result.message).toContain(label)
})
```

- [ ] **Step 2: Run validator tests and verify RED**

Run:

```powershell
npm test -- src/exercises/validator.registry.test.ts
```

Expected: FAIL because `match-cube-transform` is not registered.

- [ ] **Step 3: Implement the validator**

Add helpers and the validator to `validator.registry.ts`:

```ts
import { MATCH_TARGET_TOLERANCE, MATCH_TARGET_TRANSFORM } from './transformTarget'

const AXES = ['X', 'Y', 'Z'] as const

function firstLinearMismatch(
  actual: readonly number[],
  target: readonly number[],
  tolerance: number,
) {
  return actual.findIndex((value, index) => Math.abs(value - target[index]) > tolerance)
}

function angleDifference(actual: number, target: number) {
  return Math.abs(((actual - target + 180) % 360 + 360) % 360 - 180)
}

const matchCubeTransform: ExerciseValidator = (snapshot) => {
  const cube = snapshot.objects['learning-cube']
  if (!cube) {
    return { passed: false, message: 'ไม่พบกล่องในฉาก ลองรีเซ็ตฉากแล้วเริ่มใหม่' }
  }

  const positionAxis = firstLinearMismatch(
    cube.position,
    MATCH_TARGET_TRANSFORM.position,
    MATCH_TARGET_TOLERANCE.position,
  )
  if (positionAxis >= 0) {
    return { passed: false, message: `Position ${AXES[positionAxis]} ยังไม่ตรงกับกล่องเงา` }
  }

  const rotationAxis = cube.rotation.findIndex(
    (value, index) =>
      angleDifference(value, MATCH_TARGET_TRANSFORM.rotation[index]) >
      MATCH_TARGET_TOLERANCE.rotation,
  )
  if (rotationAxis >= 0) {
    return { passed: false, message: `Rotation ${AXES[rotationAxis]} ยังไม่ตรงกับกล่องเงา` }
  }

  const scaleAxis = firstLinearMismatch(
    cube.scale,
    MATCH_TARGET_TRANSFORM.scale,
    MATCH_TARGET_TOLERANCE.scale,
  )
  if (scaleAxis >= 0) {
    return { passed: false, message: `Scale ${AXES[scaleAxis]} ยังไม่ตรงกับกล่องเงา` }
  }

  return {
    passed: true,
    message: 'ยอดเยี่ยม! กล่องจริงซ้อนตรงกับกล่องเงาครบทั้ง Position, Rotation และ Scale แล้ว',
  }
}
```

Register it:

```ts
const validators: Readonly<Record<string, ExerciseValidator>> = {
  'rotate-cube-y-45': rotateCubeY45,
  'match-cube-transform': matchCubeTransform,
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/exercises/validator.registry.test.ts
```

Expected: all validator tests PASS.

- [ ] **Step 5: Commit the validator**

```powershell
git add src/exercises/validator.registry.ts src/exercises/validator.registry.test.ts
git commit -m "feat: validate transform target matching"
```

---

### Task 4: Publish Foundations Lesson 02

**Files:**
- Create: `src/lessons/content/positionRotationScale.ts`
- Modify: `src/lessons/lesson.registry.ts`
- Modify: `src/worlds/world.registry.ts`
- Modify: `src/lessons/lesson.registry.test.ts`
- Modify: `src/worlds/world.registry.test.ts`
- Modify: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- Produces lesson ID: `position-rotation-scale`
- Produces one editable object: `learning-cube`
- Produces one visual-only object: `target-cube`
- Consumes validator ID: `match-cube-transform`

- [ ] **Step 1: Add failing registry tests**

Add to `src/lessons/lesson.registry.test.ts`:

```ts
it('publishes the transform lesson after Hello Three.js', () => {
  expect(getPublishedLessons().map((lesson) => lesson.id)).toEqual([
    'hello-threejs',
    'position-rotation-scale',
  ])
  expect(getLessonById('position-rotation-scale')?.sections).toHaveLength(3)
})
```

Replace the Foundations-link test in `src/worlds/world.registry.test.ts` with:

```ts
it('links the first two available foundations lessons', () => {
  expect(getWorldById('foundations')?.lessons.slice(0, 2)).toMatchObject([
    { lessonId: 'hello-threejs', status: 'available' },
    { lessonId: 'position-rotation-scale', status: 'available' },
  ])
})
```

Add the learner journey to `tests/e2e/learning-flow.spec.ts`:

```ts
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

  await page.locator('.cm-content').fill(
    `cube.position.set(1.5, 1, -0.5)
cube.rotation.set(0, THREE.MathUtils.degToRad(45), 0)
cube.scale.set(1.25, 0.75, 1.25)`,
  )
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByRole('status')).toContainText('ยอดเยี่ยม')
  await expect(page.getByTestId('lesson-complete')).toBeVisible()
})
```

- [ ] **Step 2: Run registry and journey tests and verify RED**

Run:

```powershell
npm test -- src/lessons/lesson.registry.test.ts src/worlds/world.registry.test.ts
npx playwright test tests/e2e/learning-flow.spec.ts -g "transform lesson"
```

Expected: both commands FAIL because Lesson 02 is not registered, the world card remains `coming-soon`, and the lesson route resolves to not found.

- [ ] **Step 3: Create the Lesson 02 definition**

Create `src/lessons/content/positionRotationScale.ts` with:

```ts
import { MATCH_TARGET_TRANSFORM } from '../../exercises/transformTarget'
import type { SandboxSceneDefinition } from '../../sandbox/sandbox.types'
import type { Lesson } from '../lesson.types'

const transformScene: SandboxSceneDefinition = {
  background: '#e7edf2',
  camera: {
    position: [5.4, 4.2, 6.6],
    target: [0.6, 0.8, -0.2],
    fieldOfView: 45,
  },
  helpers: { grid: true, axes: true },
  objects: [
    {
      id: 'learning-cube',
      label: 'Learning cube',
      geometry: { kind: 'box', size: [1.45, 1.45, 1.45] },
      material: { color: '#f3a83b', roughness: 0.48, metalness: 0.05 },
      position: [0, 0.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    {
      id: 'target-cube',
      label: 'Target cube',
      geometry: { kind: 'box', size: [1.45, 1.45, 1.45] },
      material: {
        color: '#8bdcff',
        roughness: 0.35,
        opacity: 0.28,
        transparent: true,
        wireframe: true,
        depthWrite: false,
      },
      ...MATCH_TARGET_TRANSFORM,
    },
  ],
}

export const positionRotationScaleLesson: Lesson = {
  id: 'position-rotation-scale',
  order: 2,
  title: 'Position, Rotation, Scale',
  eyebrow: 'บทที่ 02 · ควบคุมวัตถุ',
  summary: 'ย้าย หมุน และปรับขนาดกล่องให้ตรงกับเป้าหมายในฉากจริง',
  durationMinutes: 20,
  difficulty: 'พื้นฐาน',
  objectives: [
    'อ่านตำแหน่งบนแกน X, Y และ Z ได้',
    'หมุนวัตถุด้วยองศาและแปลงเป็นเรเดียนได้',
    'ปรับขนาดวัตถุแยกแต่ละแกนได้',
  ],
  sections: [
    {
      id: 'position',
      heading: 'ย้ายวัตถุด้วย Position',
      paragraphs: [
        'Position กำหนดตำแหน่งของวัตถุบนแกน X, Y และ Z โดย X คือซ้าย–ขวา Y คือขึ้น–ลง และ Z คือหน้า–หลัง',
      ],
      code: `cube.position.set(1.5, 1, -0.5)`,
      conceptIds: ['position'],
    },
    {
      id: 'rotation',
      heading: 'หมุนวัตถุให้ถูกแกน',
      paragraphs: [
        'Rotation หมุนวัตถุรอบแกนของตัวเอง Three.js ใช้เรเดียน จึงควรแปลงค่าจากองศาที่อ่านง่ายก่อน',
      ],
      code: `cube.rotation.y = THREE.MathUtils.degToRad(45)`,
      conceptIds: ['rotation'],
    },
    {
      id: 'scale',
      heading: 'กำหนดสัดส่วนด้วย Scale',
      paragraphs: [
        'Scale คูณขนาดเดิมของวัตถุ ค่า 1 คือขนาดปกติ ค่ามากกว่า 1 ทำให้ใหญ่ขึ้น และค่าระหว่าง 0 ถึง 1 ทำให้เล็กลง',
      ],
      code: `cube.scale.set(1.25, 0.75, 1.25)`,
      conceptIds: ['scale'],
    },
  ],
  sandbox: {
    scene: transformScene,
    activeObjectId: 'learning-cube',
    codeLab: {
      title: 'จัดกล่องให้ตรงเป้าหมาย',
      description: 'แก้ Position, Rotation และ Scale แล้วทำให้กล่องสีส้มซ้อนตรงกล่องเงาสีฟ้า',
      starterCode: `cube.position.set(0, 0.75, 0)
cube.rotation.set(0, 0, 0)
cube.scale.set(1, 1, 1)`,
      availableBindings: ['THREE', 'scene', 'camera', 'cube', 'console'],
    },
  },
  exercises: [
    {
      id: 'match-target-transform',
      title: 'ภารกิจ: ซ้อนกล่องให้ตรงเงา',
      instruction:
        'เป้าหมาย Position (1.5, 1, -0.5), Rotation Y 45° และ Scale (1.25, 0.75, 1.25)',
      hint: 'ปรับทีละกลุ่ม เริ่มจาก Position แล้วตามด้วย Rotation และ Scale',
      validator: 'match-cube-transform',
    },
  ],
}
```

- [ ] **Step 4: Register and publish the lesson**

In `src/lessons/lesson.registry.ts`:

```ts
import { positionRotationScaleLesson } from './content/positionRotationScale'

const lessons: readonly Lesson[] = [helloThreeLesson, positionRotationScaleLesson]
```

Change the `position-basics` catalog item to:

```ts
{
  id: 'position-rotation-scale',
  order: 2,
  title: 'Position, Rotation, Scale',
  summary: 'ย้าย หมุน และปรับขนาดให้ตรงกับเป้าหมาย',
  durationMinutes: 20,
  status: 'available',
  topic: 'Transform',
},
```

In `src/worlds/world.registry.ts`, change card 02 to:

```ts
{
  id: 'position-rotation-scale',
  lessonId: 'position-rotation-scale',
  title: 'Position, Rotation, Scale',
  summary: 'ควบคุมตำแหน่ง การหมุน และขนาดของวัตถุ',
  status: 'available',
},
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm test -- src/lessons/lesson.registry.test.ts src/worlds/world.registry.test.ts
npx playwright test tests/e2e/learning-flow.spec.ts -g "transform lesson"
```

Expected: all registry tests and the Lesson 02 journey PASS.

- [ ] **Step 6: Commit Lesson 02 content**

```powershell
git add src/lessons/content/positionRotationScale.ts src/lessons/lesson.registry.ts src/worlds/world.registry.ts src/lessons/lesson.registry.test.ts src/worlds/world.registry.test.ts tests/e2e/learning-flow.spec.ts
git commit -m "feat: add foundations transform lesson"
```

---

### Task 5: Verify the Complete Learner Journey

**Files:**
- Modify only if visual QA reveals a defect: `src/styles.css`

**Interfaces:**
- Consumes route: `/lessons/position-rotation-scale`
- Confirms the target stays visual-only while `learning-cube` remains the active editable object.

- [ ] **Step 1: Manually inspect desktop and narrow layouts**

Open `/lessons/position-rotation-scale` at:

- `1440 × 900`: knowledge sections, target box, split lab, and completion card remain readable.
- `390 × 844`: Code and Result tabs switch correctly; target and solid cube remain visible.

Confirm:

- the target box is translucent and cannot be edited;
- the orange box remains the only object affected by controls and code;
- failed code remains visible and cannot pass;
- `Check answer` succeeds without a separate Run click;
- Lesson 01 still works.

- [ ] **Step 2: Run the complete verification suite**

Run:

```powershell
npm test
npm run lint
npm run build
npx playwright test tests/e2e/learning-flow.spec.ts tests/e2e/mona-experience.spec.ts
```

Expected: all commands exit with code 0, no browser console errors, and no failed asset requests.

- [ ] **Step 3: Commit a focused visual adjustment if one was necessary**

```powershell
git add src/styles.css
git commit -m "style: polish transform target lesson"
```

If `src/styles.css` was not changed, do not create an empty commit.
