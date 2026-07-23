# Foundations Light and Shadow Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Foundations Lesson 03 with a real shadow-enabled Three.js lab where learners configure the renderer, cube, floor, and directional light through controls or code.

**Architecture:** Extend the serializable sandbox snapshot with renderer, object-shadow, and light state while keeping the current object transforms compatible. The runtime and code worker both read and write the same state. Lesson-specific controls and validation operate on snapshots, so grading is deterministic and independent of rendered pixels.

**Tech Stack:** React 19, TypeScript, Three.js, React Router, Vitest, Testing Library, Playwright, Vite.

## Global Constraints

- Use real Three.js shadow maps, not a painted shadow image.
- Preserve Lessons 01 and 02.
- Keep shadow maps disabled unless a scene definition enables them.
- Support both numeric controls and code.
- `Check answer` runs current code before validation.
- Grade snapshot state rather than pixels or source text.
- Keep one sandbox render loop and dispose all scene resources.
- Keep browser journeys serialized to one worker.
- Do not add final next-lesson or next-planet navigation in this pass.

---

## File Map

- `src/sandbox/sandbox.types.ts` — defines renderer, object-shadow, and light state.
- `src/sandbox/runtime/SandboxRuntime.ts` — creates, snapshots, applies, resets, and disposes lights and shadows.
- `src/sandbox/SandboxCanvas.tsx` — keeps the existing snapshot application boundary.
- `src/sandbox/code/codeRunner.worker.ts` — exposes `renderer`, `floor`, and `light` bindings and returns their state.
- `src/sandbox/defaultScene.ts` — keeps non-shadow defaults explicit.
- `src/sandbox/controls/LightShadowControlsPanel.tsx` — edits the light lesson snapshot.
- `src/components/SandboxWorkspace.tsx` — selects transform or lighting controls for a lesson.
- `src/lessons/lesson.types.ts` — carries optional lighting-controls metadata.
- `src/exercises/lightShadowTarget.ts` — owns stable target values and tolerances.
- `src/exercises/validator.registry.ts` — validates the shadow dependency chain.
- `src/lessons/content/lightAndShadow.ts` — defines lesson copy, scene, starter code, and exercise.
- `src/lessons/lesson.registry.ts` — publishes Lesson 03.
- `src/worlds/world.registry.ts` — unlocks Foundations card 03.
- `tests/e2e/learning-flow.spec.ts` — covers controls, code, completion, and old lessons.

---

### Task 1: Extend the Serializable Sandbox State

**Files:**
- Modify: `src/sandbox/sandbox.types.ts`
- Modify: `src/sandbox/code/codeRunner.worker.ts`
- Modify: `src/sandbox/runtime/SandboxRuntime.ts`
- Modify: `src/components/CodeLab.test.tsx`
- Modify: `src/exercises/validator.registry.test.ts`
- Modify: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- Produces: `SandboxObjectState`, `SandboxLightDefinition`, `SandboxLightState`, `SandboxRendererState`.
- `SandboxSnapshot.objects` retains `position`, `rotation`, and `scale` and adds `castShadow` and `receiveShadow`.
- `SandboxSnapshot.renderer.shadowMapEnabled` and `SandboxSnapshot.lights` are always serializable.
- The worker bindings become `THREE`, `scene`, `camera`, `cube`, `renderer`, `floor`, `light`, and `console`.

- [ ] **Step 1: Add a failing worker journey**

Add this test to `tests/e2e/learning-flow.spec.ts` using a temporary Lesson 01 code snippet to prove the new bindings exist without completing the rotation exercise:

```ts
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
```

- [ ] **Step 2: Run the binding test and verify RED**

Run:

```powershell
npx playwright test tests/e2e/learning-flow.spec.ts -g "renderer, floor, and light"
```

Expected: FAIL with a reference error because the worker does not expose these bindings.

- [ ] **Step 3: Extend sandbox types**

Add the following types to `src/sandbox/sandbox.types.ts`:

```ts
export type SandboxRendererState = {
  readonly shadowMapEnabled: boolean
}

export type SandboxObjectState = ObjectTransform & {
  readonly castShadow: boolean
  readonly receiveShadow: boolean
}

export type SandboxLightDefinition =
  | {
      readonly id: string
      readonly kind: 'hemisphere'
      readonly skyColor: string
      readonly groundColor: string
      readonly intensity: number
    }
  | {
      readonly id: string
      readonly kind: 'directional'
      readonly color: string
      readonly intensity: number
      readonly position: Vector3Tuple
      readonly castShadow?: boolean
    }

export type SandboxLightState = {
  readonly kind: SandboxLightDefinition['kind']
  readonly position: Vector3Tuple
  readonly intensity: number
  readonly castShadow: boolean
}
```

Extend `SandboxObjectDefinition` with:

```ts
readonly castShadow?: boolean
readonly receiveShadow?: boolean
```

Extend `SandboxSceneDefinition` with:

```ts
readonly renderer?: {
  readonly shadowMapEnabled?: boolean
}
readonly lights?: readonly SandboxLightDefinition[]
```

Change `SandboxSnapshot` to:

```ts
export type SandboxSnapshot = {
  readonly objects: Readonly<Record<string, SandboxObjectState>>
  readonly renderer: SandboxRendererState
  readonly lights: Readonly<Record<string, SandboxLightState>>
  readonly camera: {
    readonly position: Vector3Tuple
    readonly target: Vector3Tuple
    readonly azimuthDegrees: number
    readonly elevationDegrees: number
    readonly distance: number
  }
}
```

- [ ] **Step 4: Update existing snapshot fixtures**

Every existing object fixture adds:

```ts
castShadow: false,
receiveShadow: false,
```

Every snapshot fixture adds:

```ts
renderer: { shadowMapEnabled: false },
lights: {},
```

Update `src/components/CodeLab.test.tsx` and both snapshot helpers in `src/exercises/validator.registry.test.ts`.

- [ ] **Step 5: Extend the worker bindings and returned snapshot**

In `codeRunner.worker.ts`, add helpers:

```ts
function applyObjectState(object: THREE.Object3D, state: SandboxObjectState | undefined) {
  if (!state) return
  object.position.fromArray(state.position)
  object.rotation.set(
    state.rotation[0] * DEG_TO_RAD,
    state.rotation[1] * DEG_TO_RAD,
    state.rotation[2] * DEG_TO_RAD,
  )
  object.scale.fromArray(state.scale)
  object.castShadow = state.castShadow
  object.receiveShadow = state.receiveShadow
}

function objectState(object: THREE.Object3D): SandboxObjectState {
  return {
    position: [object.position.x, object.position.y, object.position.z],
    rotation: [
      object.rotation.x * RAD_TO_DEG,
      object.rotation.y * RAD_TO_DEG,
      object.rotation.z * RAD_TO_DEG,
    ],
    scale: [object.scale.x, object.scale.y, object.scale.z],
    castShadow: object.castShadow,
    receiveShadow: object.receiveShadow,
  }
}
```

Create safe worker-side bindings:

```ts
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.1, 10),
  new THREE.MeshStandardMaterial(),
)
const initialFloor = initialSnapshot.objects['shadow-floor']
applyObjectState(floor, initialFloor)

const initialLight = initialSnapshot.lights['key-light']
const light = new THREE.DirectionalLight(0xffffff, initialLight?.intensity ?? 1)
light.position.fromArray(initialLight?.position ?? [1, 4, 3])
light.castShadow = initialLight?.castShadow ?? false

const renderer = {
  shadowMap: {
    enabled: initialSnapshot.renderer.shadowMapEnabled,
  },
}
```

Add `renderer`, `floor`, and `light` before `console` in `new Function()` and `execute()`.

Return a snapshot that preserves untouched entries:

```ts
objects: {
  ...initialSnapshot.objects,
  'learning-cube': objectState(cube),
  ...(initialFloor ? { 'shadow-floor': objectState(floor) } : {}),
},
renderer: {
  shadowMapEnabled: renderer.shadowMap.enabled,
},
lights: {
  ...initialSnapshot.lights,
  ...(initialLight
    ? {
        'key-light': {
          kind: 'directional' as const,
          position: [light.position.x, light.position.y, light.position.z],
          intensity: light.intensity,
          castShadow: light.castShadow,
        },
      }
    : {}),
},
```

Dispose the floor geometry and material with the existing cube resources.

- [ ] **Step 6: Keep the current runtime compatible with the required snapshot**

Before Task 2 introduces explicit editable lights, update `SandboxRuntime` so its current scenes return complete snapshots:

```ts
objects[id] = {
  position: [object.position.x, object.position.y, object.position.z],
  rotation: [
    object.rotation.x * RAD_TO_DEG,
    object.rotation.y * RAD_TO_DEG,
    object.rotation.z * RAD_TO_DEG,
  ],
  scale: [object.scale.x, object.scale.y, object.scale.z],
  castShadow: object.castShadow,
  receiveShadow: object.receiveShadow,
}
```

Add to the returned snapshot:

```ts
renderer: {
  shadowMapEnabled: this.renderer?.shadowMap.enabled ?? false,
},
lights: {},
```

In `applySnapshot()`, apply object `castShadow` and `receiveShadow` and update `renderer.shadowMap.enabled`. In `reset()`, restore both flags from each object definition.

- [ ] **Step 7: Verify GREEN and regression coverage**

Run:

```powershell
npx playwright test tests/e2e/learning-flow.spec.ts -g "renderer, floor, and light|latest editor contents|transform lesson"
npm test
npm run build
```

Expected: worker binding test passes, Lessons 01–02 still pass, all TypeScript fixtures compile.

- [ ] **Step 8: Commit the snapshot extension**

```powershell
git add src/sandbox/sandbox.types.ts src/sandbox/code/codeRunner.worker.ts src/sandbox/runtime/SandboxRuntime.ts src/components/CodeLab.test.tsx src/exercises/validator.registry.test.ts tests/e2e/learning-flow.spec.ts
git commit -m "feat: extend sandbox lighting state"
```

---

### Task 2: Render and Control Real Shadows

**Files:**
- Modify: `src/sandbox/runtime/SandboxRuntime.ts`
- Modify: `src/sandbox/runtime/SandboxRuntime.test.ts`
- Modify: `src/sandbox/defaultScene.ts`
- Modify: `src/sandbox/sandbox.types.ts`
- Create: `src/sandbox/controls/LightShadowControlsPanel.tsx`
- Create: `src/sandbox/controls/LightShadowControlsPanel.test.tsx`
- Modify: `src/components/CodeLab.tsx`
- Modify: `src/components/CodeLab.test.tsx`
- Modify: `src/components/SandboxWorkspace.tsx`
- Modify: `src/components/SandboxWorkspace.test.tsx`
- Modify: `src/lessons/lesson.types.ts`
- Modify: `src/pages/LessonPage.tsx`

**Interfaces:**
- Produces optional `Lesson.sandbox.lightingControls`.
- `LightShadowControlsPanel` consumes a full snapshot and emits the next snapshot.
- The runtime creates explicit scene lights when provided and otherwise preserves its current default lighting.

- [ ] **Step 1: Add failing runtime and controls tests**

Add to `SandboxRuntime.test.ts`:

```ts
import * as THREE from 'three'
import { lightFromDefinition } from './SandboxRuntime'

it('creates a shadow-casting directional light from its definition', () => {
  const light = lightFromDefinition({
    id: 'key-light',
    kind: 'directional',
    color: '#ffffff',
    intensity: 2.5,
    position: [-3, 6, 4],
    castShadow: true,
  })

  expect(light).toBeInstanceOf(THREE.DirectionalLight)
  expect(light.position.toArray()).toEqual([-3, 6, 4])
  expect(light.intensity).toBe(2.5)
  expect(light.castShadow).toBe(true)
})
```

Create `LightShadowControlsPanel.test.tsx`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { LightShadowControlsPanel } from './LightShadowControlsPanel'

it('emits a snapshot with the edited light intensity', () => {
  const onChange = vi.fn()
  render(
    <LightShadowControlsPanel
      snapshot={lightingSnapshot}
      lightId="key-light"
      casterObjectId="learning-cube"
      receiverObjectId="shadow-floor"
      onChange={onChange}
    />,
  )

  fireEvent.change(screen.getByRole('spinbutton', { name: 'ค่าความสว่างของไฟ' }), {
    target: { value: '2.5' },
  })

  expect(onChange.mock.calls[0][0].lights['key-light'].intensity).toBe(2.5)
})
```

Define the fixture in the test:

```ts
const lightingSnapshot: SandboxSnapshot = {
  objects: {
    'learning-cube': {
      position: [0, 0.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      castShadow: false,
      receiveShadow: false,
    },
    'shadow-floor': {
      position: [0, -0.05, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      castShadow: false,
      receiveShadow: false,
    },
  },
  renderer: { shadowMapEnabled: false },
  lights: {
    'key-light': {
      kind: 'directional',
      position: [1, 4, 3],
      intensity: 1,
      castShadow: false,
    },
  },
  camera: {
    position: [7, 5, 8],
    target: [0, 0.5, -0.4],
    azimuthDegrees: 40,
    elevationDegrees: 25,
    distance: 10,
  },
}
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm test -- src/sandbox/runtime/SandboxRuntime.test.ts src/sandbox/controls/LightShadowControlsPanel.test.tsx
```

Expected: FAIL because the light factory and controls panel do not exist.

- [ ] **Step 3: Add a pure light factory**

In `SandboxRuntime.ts`:

```ts
export function lightFromDefinition(definition: SandboxLightDefinition) {
  if (definition.kind === 'hemisphere') {
    return new THREE.HemisphereLight(
      definition.skyColor,
      definition.groundColor,
      definition.intensity,
    )
  }

  const light = new THREE.DirectionalLight(definition.color, definition.intensity)
  light.position.fromArray(definition.position)
  light.castShadow = definition.castShadow ?? false
  light.shadow.mapSize.set(1024, 1024)
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 30
  light.shadow.camera.left = -8
  light.shadow.camera.right = 8
  light.shadow.camera.top = 8
  light.shadow.camera.bottom = -8
  return light
}
```

- [ ] **Step 4: Extend `SandboxRuntime`**

Add `private readonly lights = new Map<string, THREE.Light>()`.

During creation:

- Use the current three hard-coded lights when `definition.lights` is absent.
- Otherwise create every light through `lightFromDefinition`, add it to the scene, and store it by ID.

After renderer construction:

```ts
renderer.shadowMap.enabled = this.definition.renderer?.shadowMapEnabled ?? false
renderer.shadowMap.type = THREE.PCFSoftShadowMap
```

When creating each mesh:

```ts
mesh.castShadow = objectDefinition.castShadow ?? false
mesh.receiveShadow = objectDefinition.receiveShadow ?? false
```

`getSnapshot()` returns:

```ts
renderer: {
  shadowMapEnabled: this.renderer?.shadowMap.enabled ??
    this.definition.renderer?.shadowMapEnabled ??
    false,
},
lights: Object.fromEntries(
  [...this.lights].map(([id, light]) => [
    id,
    {
      kind: light instanceof THREE.HemisphereLight ? 'hemisphere' : 'directional',
      position: [light.position.x, light.position.y, light.position.z],
      intensity: light.intensity,
      castShadow: light.castShadow,
    },
  ]),
),
```

Object snapshots include `castShadow` and `receiveShadow`.

`applySnapshot()` updates renderer shadow state, object flags, light position/intensity/cast-shadow, then renders.

`reset()` restores renderer, objects, and explicit lights from the scene definition.

`dispose()` clears the light map after the scene is disposed.

- [ ] **Step 5: Implement `LightShadowControlsPanel`**

Create a panel with:

- checkboxes for renderer shadow map, cube cast shadow, floor receive shadow, and light cast shadow;
- three number/range pairs for light position X/Y/Z (`-8` to `8`, step `0.1`);
- one number/range pair for intensity (`0` to `5`, step `0.1`).

Each handler creates a new snapshot:

```ts
onChange({
  ...snapshot,
  lights: {
    ...snapshot.lights,
    [lightId]: {
      ...light,
      intensity: Number(event.target.value),
    },
  },
})
```

Use accessible names:

- `เปิด Shadow Map`
- `ให้กล่องทอดเงา`
- `ให้พื้นรับเงา`
- `ให้ไฟสร้างเงา`
- `ค่าตำแหน่งไฟแกน X/Y/Z`
- `ค่าความสว่างของไฟ`

- [ ] **Step 6: Generate lighting code from control values**

Extend `CodeLabDefinition` in `sandbox.types.ts`:

```ts
readonly snapshotKind?: 'transform' | 'light-shadow'
```

Change `snapshotToCode` in `CodeLab.tsx` to accept the kind. For `light-shadow`, generate:

```ts
const light = snapshot.lights['key-light']
const cube = snapshot.objects['learning-cube']
const floor = snapshot.objects['shadow-floor']
if (!light || !cube || !floor) return ''

return `// โค้ดจากค่าแสงและเงาปัจจุบัน
renderer.shadowMap.enabled = ${snapshot.renderer.shadowMapEnabled}
cube.castShadow = ${cube.castShadow}
floor.receiveShadow = ${floor.receiveShadow}
light.castShadow = ${light.castShadow}
light.position.set(${light.position.map(number).join(', ')})
light.intensity = ${number(light.intensity)}`
```

Pass `definition.snapshotKind ?? 'transform'` when the “สร้างโค้ดจากค่าที่ปรับอยู่ตอนนี้” button runs. Add a `CodeLab.test.tsx` case that renders a lighting definition, clicks the button, and expects the editor to contain `renderer.shadowMap.enabled` and `light.intensity`.

- [ ] **Step 7: Select lighting controls per lesson**

Extend `Lesson.sandbox`:

```ts
readonly lightingControls?: {
  readonly lightId: string
  readonly casterObjectId: string
  readonly receiverObjectId: string
}
```

Add the same optional prop to `SandboxWorkspace`.

When controls mode is active:

```tsx
{lightingControls ? (
  <LightShadowControlsPanel
    snapshot={snapshot}
    {...lightingControls}
    onChange={handleApplyCodeSnapshot}
  />
) : (
  <TransformControlsPanel
    transform={snapshot?.objects[activeObjectId]}
    onChange={handleTransformChange}
  />
)}
```

Pass `lesson.sandbox.lightingControls` from `LessonPage`.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm test -- src/sandbox/runtime/SandboxRuntime.test.ts src/sandbox/controls/LightShadowControlsPanel.test.tsx src/components/SandboxWorkspace.test.tsx src/components/CodeLab.test.tsx
npm run build
```

Expected: new runtime and controls tests pass and production TypeScript compiles.

- [ ] **Step 9: Commit real shadow controls**

```powershell
git add src/sandbox/runtime/SandboxRuntime.ts src/sandbox/runtime/SandboxRuntime.test.ts src/sandbox/defaultScene.ts src/sandbox/sandbox.types.ts src/sandbox/controls/LightShadowControlsPanel.tsx src/sandbox/controls/LightShadowControlsPanel.test.tsx src/components/CodeLab.tsx src/components/CodeLab.test.tsx src/components/SandboxWorkspace.tsx src/components/SandboxWorkspace.test.tsx src/lessons/lesson.types.ts src/pages/LessonPage.tsx
git commit -m "feat: add sandbox light and shadow controls"
```

---

### Task 3: Validate the Shadow Pipeline

**Files:**
- Create: `src/exercises/lightShadowTarget.ts`
- Modify: `src/exercises/validator.registry.ts`
- Modify: `src/exercises/validator.registry.test.ts`

**Interfaces:**
- Produces validator ID `configure-light-shadow`.
- Feedback order: renderer → cube → floor → light shadow → light position → intensity → success.

- [ ] **Step 1: Add target constants**

Create `lightShadowTarget.ts`:

```ts
export const LIGHT_SHADOW_TARGET = {
  lightId: 'key-light',
  casterObjectId: 'learning-cube',
  receiverObjectId: 'shadow-floor',
  position: [-3, 6, 4] as const,
  intensity: 2.5,
} as const

export const LIGHT_SHADOW_TOLERANCE = {
  position: 0.1,
  intensity: 0.1,
} as const
```

- [ ] **Step 2: Add failing validator cases**

Build `lightingSnapshot()` in `validator.registry.test.ts`, then add:

```ts
it('passes a complete light and shadow configuration', () => {
  expect(validateExercise('configure-light-shadow', lightingSnapshot())).toMatchObject({
    passed: true,
  })
})

it.each([
  ['Shadow Map', { renderer: { shadowMapEnabled: false } }],
  ['กล่อง', { cubeCastShadow: false }],
  ['พื้น', { floorReceiveShadow: false }],
  ['ไฟ', { lightCastShadow: false }],
  ['Position', { lightPosition: [0, 6, 4] }],
  ['Intensity', { lightIntensity: 1 }],
] as const)('reports the first incomplete shadow dependency: %s', (label, patch) => {
  const result = validateExercise('configure-light-shadow', lightingSnapshot(patch))
  expect(result.passed).toBe(false)
  expect(result.message).toContain(label)
})
```

- [ ] **Step 3: Run validator tests and verify RED**

Run:

```powershell
npm test -- src/exercises/validator.registry.test.ts
```

Expected: FAIL because the validator is not registered.

- [ ] **Step 4: Implement and register the validator**

Implement `configureLightShadow` using the target IDs and tolerances. Each check returns one message:

```ts
if (!snapshot.renderer.shadowMapEnabled) {
  return { passed: false, message: 'เปิด Shadow Map ของ renderer ก่อน' }
}
if (!cube?.castShadow) {
  return { passed: false, message: 'กล่องยังไม่ได้เปิด castShadow' }
}
if (!floor?.receiveShadow) {
  return { passed: false, message: 'พื้นยังไม่ได้เปิด receiveShadow' }
}
if (!light?.castShadow) {
  return { passed: false, message: 'ไฟยังไม่ได้เปิด castShadow' }
}
```

Then compare each light-position axis and intensity. Success copy:

```ts
{
  passed: true,
  message: 'ยอดเยี่ยม! แสงและเงาทำงานครบทั้ง renderer, กล่อง, พื้น และ Directional Light แล้ว'
}
```

Register:

```ts
'configure-light-shadow': configureLightShadow,
```

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm test -- src/exercises/validator.registry.test.ts
```

Expected: all validator tests pass.

Commit:

```powershell
git add src/exercises/lightShadowTarget.ts src/exercises/validator.registry.ts src/exercises/validator.registry.test.ts
git commit -m "feat: validate light and shadow setup"
```

---

### Task 4: Publish Foundations Lesson 03

**Files:**
- Create: `src/lessons/content/lightAndShadow.ts`
- Modify: `src/lessons/lesson.registry.ts`
- Modify: `src/lessons/lesson.registry.test.ts`
- Modify: `src/worlds/world.registry.ts`
- Modify: `src/worlds/world.registry.test.ts`
- Modify: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- Produces lesson ID `light-and-shadow`.
- Produces explicit light IDs `environment-light` and `key-light`.
- Produces object IDs `learning-cube`, `shadow-floor`, and `shadow-target`.
- Consumes validator ID `configure-light-shadow`.

- [ ] **Step 1: Add failing registry and journey tests**

Registry expectation:

```ts
expect(getPublishedLessons().map((lesson) => lesson.id)).toEqual([
  'hello-threejs',
  'position-rotation-scale',
  'light-and-shadow',
])
```

World expectation:

```ts
expect(getWorldById('foundations')?.lessons[2]).toMatchObject({
  lessonId: 'light-and-shadow',
  status: 'available',
})
```

Add code-mode journey:

```ts
test('completes the light lesson by configuring real shadow state', async ({ page }) => {
  await page.goto('/lessons/light-and-shadow?topic=3')

  await page.locator('.cm-content').fill(
    `renderer.shadowMap.enabled = true
cube.castShadow = true
floor.receiveShadow = true
light.castShadow = true
light.position.set(-3, 6, 4)
light.intensity = 2.5`,
  )
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByRole('status')).toContainText('ยอดเยี่ยม')
  await expect(page.getByTestId('lesson-complete')).toBeVisible()
})
```

Add controls-mode journey:

```ts
test('completes the light lesson with the lighting controls', async ({ page }) => {
  await page.goto('/lessons/light-and-shadow?topic=3')
  await page.getByRole('button', { name: 'ปรับค่า' }).click()

  await page.getByRole('checkbox', { name: 'เปิด Shadow Map' }).check()
  await page.getByRole('checkbox', { name: 'ให้กล่องทอดเงา' }).check()
  await page.getByRole('checkbox', { name: 'ให้พื้นรับเงา' }).check()
  await page.getByRole('checkbox', { name: 'ให้ไฟสร้างเงา' }).check()
  await page.getByRole('spinbutton', { name: 'ค่าตำแหน่งไฟแกน X' }).fill('-3')
  await page.getByRole('spinbutton', { name: 'ค่าตำแหน่งไฟแกน Y' }).fill('6')
  await page.getByRole('spinbutton', { name: 'ค่าตำแหน่งไฟแกน Z' }).fill('4')
  await page.getByRole('spinbutton', { name: 'ค่าความสว่างของไฟ' }).fill('2.5')
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click()

  await expect(page.getByRole('status')).toContainText('ยอดเยี่ยม')
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm test -- src/lessons/lesson.registry.test.ts src/worlds/world.registry.test.ts
npx playwright test tests/e2e/learning-flow.spec.ts -g "light lesson"
```

Expected: registry tests and both journeys fail because Lesson 03 does not exist.

- [ ] **Step 3: Create the shadow scene and lesson**

Create `lightAndShadow.ts` with:

- camera `[7, 5, 8]`, target `[0, 0.5, -0.4]`;
- renderer shadow map initially `false`;
- cube at `[0, 0.75, 0]`, cast shadow initially `false`;
- floor as a box sized `[10, 0.1, 10]`, at `[0, -0.05, 0]`, receive shadow initially `false`;
- target marker as a thin, translucent wireframe box at `[0.45, 0.02, -0.55]`;
- hemisphere environment light at intensity `0.45`;
- directional `key-light` at `[1, 4, 3]`, intensity `1`, cast shadow `false`;
- `lightingControls` pointing to the key light, cube, and floor.
- `codeLab.snapshotKind` set to `'light-shadow'`;
- `codeLab.availableBindings` set to
  `['THREE', 'scene', 'camera', 'renderer', 'cube', 'floor', 'light', 'console']`.

Use these sections:

1. `light-types` — “เลือกชนิดแสงให้เหมาะกับหน้าที่”
2. `light-position` — “ทิศทางเกิดจากตำแหน่งของไฟ”
3. `shadow-pipeline` — “เงาต้องเปิดให้ครบทั้งสาย”

Starter code:

```ts
renderer.shadowMap.enabled = false
cube.castShadow = false
floor.receiveShadow = false
light.castShadow = false
light.position.set(1, 4, 3)
light.intensity = 1
```

Exercise instruction explicitly gives target position and intensity and asks the learner to enable all four shadow switches.

- [ ] **Step 4: Publish Lesson 03**

Add `lightAndShadowLesson` to the `lessons` array after Lesson 02.

Replace catalog order 3 with:

```ts
{
  id: 'light-and-shadow',
  order: 3,
  title: 'Light and Shadow',
  summary: 'จัด Directional Light และเปิดระบบเงาให้ครบ',
  durationMinutes: 25,
  status: 'available',
  topic: 'Lighting',
}
```

Update Foundations world card 03:

```ts
{
  id: 'light-and-shadow',
  lessonId: 'light-and-shadow',
  title: 'Light and Shadow',
  summary: 'ใช้แสงและเงาเพื่อสร้างมิติให้ฉาก',
  status: 'available',
}
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm test -- src/lessons/lesson.registry.test.ts src/worlds/world.registry.test.ts
npx playwright test tests/e2e/learning-flow.spec.ts -g "light lesson"
npm run build
```

Expected: registries, code journey, controls journey, and build pass.

- [ ] **Step 6: Commit Lesson 03**

```powershell
git add src/lessons/content/lightAndShadow.ts src/lessons/lesson.registry.ts src/lessons/lesson.registry.test.ts src/worlds/world.registry.ts src/worlds/world.registry.test.ts tests/e2e/learning-flow.spec.ts
git commit -m "feat: add foundations light and shadow lesson"
```

---

### Task 5: Visual and Full-Journey Verification

**Files:**
- Modify only if visual QA finds a focused defect: `src/styles/index.css`
- Modify only if copy is unclear: `src/lessons/content/lightAndShadow.ts`

**Interfaces:**
- Confirms the rendered shadow and marker are visible without using pixels for grading.
- Confirms Lessons 01–03 share the same chamber and remain independently completable.

- [ ] **Step 1: Inspect desktop**

At `1440 × 900`, inspect `/lessons/light-and-shadow?topic=3` in Code and Controls modes:

- cube, floor, marker, and real shadow are visible;
- the target marker does not obscure the shadow;
- lighting controls fit without horizontal clipping;
- completion feedback stays visible.

- [ ] **Step 2: Inspect mobile**

At `390 × 844`:

- Code and Result tabs work;
- controls remain reachable and readable;
- renderer/object/light checkboxes have usable tap targets;
- the Result tab shows the cube and shadow without clipping.

- [ ] **Step 3: Run fresh verification**

Run:

```powershell
npm test
npm run lint
npm run build
npx playwright test tests/e2e/learning-flow.spec.ts tests/e2e/mona-experience.spec.ts
```

Expected:

- all unit tests pass;
- lint exits with no errors or warnings;
- production build exits 0;
- serialized browser journeys all pass;
- no page errors or failed asset requests.

- [ ] **Step 4: Commit only focused QA adjustments**

If QA required a change:

```powershell
git add src/styles/index.css src/lessons/content/lightAndShadow.ts
git commit -m "style: polish light and shadow lesson"
```

Omit unchanged files and do not create an empty commit.
