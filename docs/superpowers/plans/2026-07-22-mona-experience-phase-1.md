# Mona 3D Experience Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/` with a full-viewport loading-to-entry experience that loads the real Mona VRM, enables Start only when ready, and reveals Mona standing at a distance in a static neutral pose.

**Architecture:** Add an `experience` feature beside the existing sandbox rather than extending `SandboxRuntime`. React owns a small reducer-driven UI state machine and accessible overlay; a persistent `ExperienceRuntime` owns Three.js, VRM loading, the static scene, and disposal. Existing lesson routes and user-owned worktree changes remain intact.

**Tech Stack:** React 19, React Router 8, TypeScript 6, Three.js 0.185, `@pixiv/three-vrm` 3.5.5, Tailwind 4 plus project CSS, Vitest 4, Testing Library, Playwright.

## Global Constraints

- Root `/` becomes the Mona experience; `/lessons`, `/concepts`, `/playground`, and detail routes remain available.
- Phase 1 ends after Start reveals a static scene with Mona standing at a distance.
- Do not add camera choreography, animated turning, idle animation, OrbitControls, audio, lip sync, AI chat, lesson integration, post-processing, or dynamic shadows.
- Use the real `C:\Users\nekot\Desktop\Mona.vrm` without mutating or deleting it.
- Copy the runtime asset to `public/models/mona/Mona.vrm`; do not use the generated concept image as a runtime background.
- Preserve the existing ThreeLab forest, mint, amber, and off-white design language.
- Keep visible text and controls in semantic HTML; use Three.js for Mona, the world, and the amber spatial marker.
- Desktop is the primary target; reduced quality caps device pixel ratio at `1` and desktop caps it at `1.5`.
- Existing dirty files are user-owned. Never stage or commit unrelated hunks. Inspect `git diff --cached` before every commit.
- All behavior changes follow red-green-refactor: write and run the failing test before production code.
- Selected visual truth: `docs/superpowers/specs/assets/mona-experience-concept-3.png`.
- Approved design: `docs/superpowers/specs/2026-07-22-mona-experience-phase-1-design.md`.

## File Map

- `src/experience/experienceMachine.ts`: pure Phase 1 state and reducer.
- `src/experience/experienceMachine.test.ts`: reducer behavior.
- `src/experience/runtime/experienceRuntime.helpers.ts`: progress, quality, and neutral pose constants.
- `src/experience/runtime/experienceRuntime.helpers.test.ts`: pure helper tests.
- `src/experience/runtime/monaLoader.ts`: VRM-aware GLTF loader adapter.
- `src/experience/runtime/monaLoader.test.ts`: loader success, progress, missing-VRM, and error behavior.
- `src/experience/runtime/MonaController.ts`: Mona placement and static standing pose.
- `src/experience/runtime/MonaController.test.ts`: normalized-bone pose behavior.
- `src/experience/runtime/ExperienceRuntime.ts`: Three.js scene, renderer, frame loop, resize, visibility, and disposal.
- `src/experience/ExperienceCanvas.tsx`: React lifecycle adapter for the runtime.
- `src/experience/ExperienceOverlay.tsx`: loading, ready, entering, and error HTML UI.
- `src/experience/ExperienceShell.tsx`: coordinates reducer, canvas callbacks, Start, Retry, and entry timeout.
- `src/experience/ExperienceShell.test.tsx`: loading/ready/error/entry flow and persistent-canvas tests.
- `src/pages/ExperiencePage.tsx`: full-screen page entry.
- `src/app/App.tsx`: place `/` outside `AppShell` and preserve existing routes.
- `src/styles/index.css`: experience layout, overlay, progress, focus, responsive, and reduced-motion styling.
- `public/models/mona/Mona.vrm`: approved runtime copy of the real avatar.
- `tests/e2e/mona-experience.spec.ts`: real asset and primary entry flow.
- `tests/e2e/learning-flow.spec.ts`: update only the first test's navigation so lesson coverage remains valid after `/` changes.
- `design-qa.md`: required visual comparison and browser verification report.

---

### Task 1: Experience State Machine

**Files:**
- Create: `src/experience/experienceMachine.ts`
- Create: `src/experience/experienceMachine.test.ts`

**Interfaces:**
- Produces: `ExperiencePhase`, `ExperienceState`, `ExperienceEvent`, `INITIAL_EXPERIENCE_STATE`, `reduceExperience(state, event)`.
- Consumed by: `ExperienceShell` in Task 5.

- [ ] **Step 1: Write the failing state-machine tests**

```ts
import { describe, expect, it } from 'vitest'
import { INITIAL_EXPERIENCE_STATE, reduceExperience } from './experienceMachine'

describe('experience state machine', () => {
  it('tracks loading progress without moving beyond loading', () => {
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, {
        type: 'LOAD_PROGRESS',
        progress: 0.42,
      }),
    ).toMatchObject({ phase: 'loading', progress: 0.42, attempt: 0 })
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, {
        type: 'LOAD_PROGRESS',
        progress: 4,
      }).progress,
    ).toBe(0.99)
  })

  it('ignores Start until the scene is ready', () => {
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, { type: 'START_REQUESTED' }),
    ).toEqual(INITIAL_EXPERIENCE_STATE)
  })

  it('moves from ready through entering to entered', () => {
    const ready = reduceExperience(INITIAL_EXPERIENCE_STATE, {
      type: 'LOAD_SUCCEEDED',
    })
    const entering = reduceExperience(ready, { type: 'START_REQUESTED' })
    const entered = reduceExperience(entering, {
      type: 'ENTRY_TRANSITION_FINISHED',
    })

    expect(ready.phase).toBe('ready')
    expect(entering.phase).toBe('entering')
    expect(reduceExperience(entering, { type: 'START_REQUESTED' })).toBe(entering)
    expect(entered.phase).toBe('entered')
  })

  it('retries a failed load with a fresh attempt', () => {
    const failed = reduceExperience(INITIAL_EXPERIENCE_STATE, {
      type: 'LOAD_FAILED',
      message: 'โหลด Mona ไม่สำเร็จ',
    })
    const retried = reduceExperience(failed, { type: 'RETRY_REQUESTED' })

    expect(failed).toMatchObject({ phase: 'error', errorMessage: 'โหลด Mona ไม่สำเร็จ' })
    expect(retried).toEqual({ phase: 'loading', progress: 0, attempt: 1 })
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/experience/experienceMachine.test.ts`

Expected: FAIL because `./experienceMachine` does not exist.

- [ ] **Step 3: Implement the minimal reducer**

```ts
export type ExperiencePhase = 'loading' | 'ready' | 'entering' | 'entered' | 'error'

export type ExperienceState = {
  phase: ExperiencePhase
  progress: number
  attempt: number
  errorMessage?: string
}

export type ExperienceEvent =
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'LOAD_SUCCEEDED' }
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'START_REQUESTED' }
  | { type: 'ENTRY_TRANSITION_FINISHED' }
  | { type: 'RETRY_REQUESTED' }

export const INITIAL_EXPERIENCE_STATE: ExperienceState = {
  phase: 'loading',
  progress: 0,
  attempt: 0,
}

export function reduceExperience(
  state: ExperienceState,
  event: ExperienceEvent,
): ExperienceState {
  switch (event.type) {
    case 'LOAD_PROGRESS':
      return state.phase === 'loading'
        ? { ...state, progress: Math.min(Math.max(event.progress, 0), 0.99) }
        : state
    case 'LOAD_SUCCEEDED':
      return state.phase === 'loading' ? { ...state, phase: 'ready', progress: 1 } : state
    case 'LOAD_FAILED':
      return state.phase === 'loading'
        ? { ...state, phase: 'error', errorMessage: event.message }
        : state
    case 'START_REQUESTED':
      return state.phase === 'ready' ? { ...state, phase: 'entering' } : state
    case 'ENTRY_TRANSITION_FINISHED':
      return state.phase === 'entering' ? { ...state, phase: 'entered' } : state
    case 'RETRY_REQUESTED':
      return state.phase === 'error'
        ? { phase: 'loading', progress: 0, attempt: state.attempt + 1 }
        : state
  }
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/experience/experienceMachine.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit only the new state files**

```powershell
git add -- src/experience/experienceMachine.ts src/experience/experienceMachine.test.ts
git diff --cached --check
git commit -m "feat: add Mona experience state machine"
```

---

### Task 2: Runtime Progress, Quality, and Pose Helpers

**Files:**
- Create: `src/experience/runtime/experienceRuntime.helpers.ts`
- Create: `src/experience/runtime/experienceRuntime.helpers.test.ts`

**Interfaces:**
- Produces: `resolveLoadProgress(loaded, total)`, `selectExperienceQuality(input)`, `shouldShowStartMarker(ready, entered)`, `NEUTRAL_STANDING_POSE`.
- Consumed by: `monaLoader`, `MonaController`, and `ExperienceRuntime` in Tasks 3–4.

- [ ] **Step 1: Write failing helper tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  NEUTRAL_STANDING_POSE,
  resolveLoadProgress,
  selectExperienceQuality,
  shouldShowStartMarker,
} from './experienceRuntime.helpers'

describe('experience runtime helpers', () => {
  it('reserves the final progress segment for parsing and scene preparation', () => {
    expect(resolveLoadProgress(50, 100)).toBeCloseTo(0.46)
    expect(resolveLoadProgress(100, 100)).toBeCloseTo(0.92)
    expect(resolveLoadProgress(25, 0)).toBe(0)
  })

  it('uses a reduced quality tier for narrow or coarse-pointer devices', () => {
    expect(selectExperienceQuality({ width: 390, devicePixelRatio: 3, coarsePointer: true }))
      .toEqual({ tier: 'reduced', pixelRatio: 1 })
    expect(selectExperienceQuality({ width: 1440, devicePixelRatio: 2, coarsePointer: false }))
      .toEqual({ tier: 'desktop', pixelRatio: 1.5 })
  })

  it('lowers both upper arms symmetrically from the bind T-pose', () => {
    expect(NEUTRAL_STANDING_POSE.leftUpperArm.zDegrees).toBe(-68)
    expect(NEUTRAL_STANDING_POSE.rightUpperArm.zDegrees).toBe(68)
  })

  it('shows the spatial marker only after loading and before entry', () => {
    expect(shouldShowStartMarker(false, false)).toBe(false)
    expect(shouldShowStartMarker(true, false)).toBe(true)
    expect(shouldShowStartMarker(true, true)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/experience/runtime/experienceRuntime.helpers.test.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the helpers**

```ts
export type ExperienceQuality = {
  tier: 'desktop' | 'reduced'
  pixelRatio: number
}

export function resolveLoadProgress(loaded: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0
  return Math.min(Math.max(loaded / total, 0), 1) * 0.92
}

export function selectExperienceQuality(input: {
  width: number
  devicePixelRatio: number
  coarsePointer: boolean
}): ExperienceQuality {
  const reduced = input.width < 768 || input.coarsePointer
  return {
    tier: reduced ? 'reduced' : 'desktop',
    pixelRatio: Math.min(input.devicePixelRatio, reduced ? 1 : 1.5),
  }
}

export function shouldShowStartMarker(ready: boolean, entered: boolean) {
  return ready && !entered
}

export const NEUTRAL_STANDING_POSE = {
  leftUpperArm: { zDegrees: -68 },
  rightUpperArm: { zDegrees: 68 },
  leftLowerArm: { zDegrees: -8 },
  rightLowerArm: { zDegrees: 8 },
} as const
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/experience/runtime/experienceRuntime.helpers.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the helper slice**

```powershell
git add -- src/experience/runtime/experienceRuntime.helpers.ts src/experience/runtime/experienceRuntime.helpers.test.ts
git diff --cached --check
git commit -m "feat: define Mona runtime quality and pose helpers"
```

---

### Task 3: VRM Dependency, Runtime Asset, Loader, and Mona Controller

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `public/models/mona/Mona.vrm`
- Create: `src/experience/runtime/monaLoader.ts`
- Create: `src/experience/runtime/monaLoader.test.ts`
- Create: `src/experience/runtime/MonaController.ts`
- Create: `src/experience/runtime/MonaController.test.ts`

**Interfaces:**
- Consumes: `resolveLoadProgress`, `NEUTRAL_STANDING_POSE` from Task 2.
- Produces: `loadMonaAsset(loader, url, onProgress): Promise<VRM>`, `createVrmLoader(): GLTFLoader`, and `MonaController` with `attachTo(scene)` and `dispose()`.
- Consumed by: `ExperienceRuntime` in Task 4.

- [ ] **Step 1: Install the compatible VRM loader and copy the approved asset**

Run:

```powershell
npm install @pixiv/three-vrm@3.5.5
New-Item -ItemType Directory -Force -Path 'public\models\mona' | Out-Null
Copy-Item -LiteralPath 'C:\Users\nekot\Desktop\Mona.vrm' -Destination 'public\models\mona\Mona.vrm'
```

Verify:

```powershell
npm view @pixiv/three-vrm@3.5.5 peerDependencies --json
Get-Item -LiteralPath 'public\models\mona\Mona.vrm' | Select-Object Length
```

Expected: peer dependency accepts Three.js `>=0.137`; copied file length is approximately `15978676` bytes.

- [ ] **Step 2: Write failing loader tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import type { VRM } from '@pixiv/three-vrm'
import { loadMonaAsset } from './monaLoader'

function fakeLoader(result: { vrm?: VRM }, fail?: Error) {
  return {
    load: vi.fn((_url, onLoad, onProgress, onError) => {
      onProgress?.({ loaded: 50, total: 100 } as ProgressEvent<EventTarget>)
      if (fail) onError?.(fail)
      else onLoad({ userData: result })
      return {} as never
    }),
  }
}

describe('loadMonaAsset', () => {
  it('reports download progress and resolves the parsed VRM', async () => {
    const vrm = {} as VRM
    const onProgress = vi.fn()
    await expect(loadMonaAsset(fakeLoader({ vrm }) as never, '/Mona.vrm', onProgress))
      .resolves.toBe(vrm)
    expect(onProgress).toHaveBeenCalledWith(0.46)
  })

  it('rejects glTF data that does not contain a VRM', async () => {
    await expect(loadMonaAsset(fakeLoader({}) as never, '/Mona.vrm', vi.fn()))
      .rejects.toThrow('Loaded asset does not contain VRM data.')
  })

  it('forwards loader failures', async () => {
    await expect(
      loadMonaAsset(fakeLoader({}, new Error('network')) as never, '/Mona.vrm', vi.fn()),
    ).rejects.toThrow('network')
  })
})
```

- [ ] **Step 3: Run loader tests and verify RED**

Run: `npm test -- src/experience/runtime/monaLoader.test.ts`

Expected: FAIL because `monaLoader.ts` does not exist.

- [ ] **Step 4: Implement the VRM loader adapter**

```ts
import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { resolveLoadProgress } from './experienceRuntime.helpers'

type LoaderPort = Pick<GLTFLoader, 'load'>

export function createVrmLoader() {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))
  return loader
}

export function loadMonaAsset(
  loader: LoaderPort,
  url: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<VRM>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM | undefined
        if (!vrm) {
          reject(new Error('Loaded asset does not contain VRM data.'))
          return
        }
        resolve(vrm)
      },
      (event) => onProgress(resolveLoadProgress(event.loaded, event.total)),
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })
}
```

- [ ] **Step 5: Write failing MonaController pose tests**

```ts
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import type { VRM } from '@pixiv/three-vrm'
import { MonaController } from './MonaController'

it('places Mona at a distance and lowers her arms', () => {
  const bones = new Map([
    ['leftUpperArm', new THREE.Object3D()],
    ['rightUpperArm', new THREE.Object3D()],
    ['leftLowerArm', new THREE.Object3D()],
    ['rightLowerArm', new THREE.Object3D()],
  ])
  const vrm = {
    scene: new THREE.Group(),
    humanoid: {
      getNormalizedBoneNode: vi.fn((name: string) => bones.get(name) ?? null),
      update: vi.fn(),
    },
  } as unknown as VRM

  const controller = new MonaController(vrm)
  controller.applyInitialPose()

  expect(vrm.scene.position.toArray()).toEqual([1.8, 0, -4])
  expect(bones.get('leftUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(-68))
  expect(bones.get('rightUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(68))
})
```

- [ ] **Step 6: Run the pose test and verify RED**

Run: `npm test -- src/experience/runtime/MonaController.test.ts`

Expected: FAIL because `MonaController.ts` does not exist.

- [ ] **Step 7: Implement MonaController**

```ts
import * as THREE from 'three'
import { VRMUtils, type VRM, type VRMHumanBoneName } from '@pixiv/three-vrm'
import { NEUTRAL_STANDING_POSE } from './experienceRuntime.helpers'

export class MonaController {
  constructor(readonly vrm: VRM) {}

  applyInitialPose() {
    this.vrm.scene.position.set(1.8, 0, -4)
    this.vrm.scene.rotation.y = THREE.MathUtils.degToRad(-32)

    for (const [boneName, pose] of Object.entries(NEUTRAL_STANDING_POSE)) {
      const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName)
      if (bone) bone.rotation.z = THREE.MathUtils.degToRad(pose.zDegrees)
    }
    this.vrm.humanoid.update()
  }

  attachTo(scene: THREE.Scene) {
    VRMUtils.combineSkeletons(this.vrm.scene)
    VRMUtils.combineMorphs(this.vrm)
    this.applyInitialPose()
    scene.add(this.vrm.scene)
  }

  update(delta: number) {
    this.vrm.update(delta)
  }

  dispose() {
    this.vrm.scene.removeFromParent()
    VRMUtils.deepDispose(this.vrm.scene)
  }
}
```

- [ ] **Step 8: Run loader/controller tests and verify GREEN**

Run: `npm test -- src/experience/runtime/monaLoader.test.ts src/experience/runtime/MonaController.test.ts`

Expected: all loader and pose tests PASS.

- [ ] **Step 9: Stage only Mona-related package hunks and new files, then commit**

Because `package.json` and `package-lock.json` already contain user-owned CodeMirror dependency changes, stage only the `@pixiv/three-vrm` hunks using `git add -p package.json package-lock.json`. Then stage the new asset and runtime files explicitly.

```powershell
git add -p -- package.json package-lock.json
git add -- public/models/mona/Mona.vrm src/experience/runtime/monaLoader.ts src/experience/runtime/monaLoader.test.ts src/experience/runtime/MonaController.ts src/experience/runtime/MonaController.test.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "feat: load and pose Mona VRM"
```

Expected staged names: the two package manifests plus only the new Mona files. Cached package diffs must include the new VRM dependency and preserve the existing CodeMirror entries.

---

### Task 4: Persistent Three.js Experience Runtime and Canvas Adapter

**Files:**
- Create: `src/experience/runtime/ExperienceRuntime.ts`
- Create: `src/experience/ExperienceCanvas.tsx`
- Create: `src/experience/ExperienceCanvas.test.tsx`

**Interfaces:**
- Consumes: `createVrmLoader`, `loadMonaAsset`, `MonaController`, and `selectExperienceQuality`.
- Produces: `ExperienceRuntime.mount(container)`, `load(url, onProgress)`, `setEntered(entered)`, `dispose()` and `ExperienceCanvasProps`.
- Consumed by: `ExperienceShell` in Task 5.

- [ ] **Step 1: Write the failing React/runtime lifecycle test**

Mock only the WebGL boundary and verify that React mounts one runtime, loads Mona once, forwards the entered state, and disposes on unmount:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'

const runtimeSpies = vi.hoisted(() => {
  const runtime = {
    mount: vi.fn(),
    load: vi.fn(),
    setEntered: vi.fn(),
    dispose: vi.fn(),
  }
  runtime.mount.mockReturnValue(runtime)
  return { constructor: vi.fn(() => runtime), runtime }
})

vi.mock('./runtime/ExperienceRuntime', () => ({
  ExperienceRuntime: runtimeSpies.constructor,
}))

describe('ExperienceCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeSpies.runtime.mount.mockReturnValue(runtimeSpies.runtime)
    runtimeSpies.runtime.load.mockResolvedValue(undefined)
  })

  it('keeps one runtime mounted while entry state changes and disposes it on unmount', async () => {
    const onReady = vi.fn()
    const callbacks = {
      onProgress: vi.fn(),
      onReady,
      onError: vi.fn(),
    }
    const { rerender, unmount } = render(
      <ExperienceCanvas attempt={0} entered={false} {...callbacks} />,
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtimeSpies.runtime.load).toHaveBeenCalledWith(
      '/models/mona/Mona.vrm',
      callbacks.onProgress,
    )

    rerender(<ExperienceCanvas attempt={0} entered {...callbacks} />)
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtimeSpies.runtime.setEntered).toHaveBeenLastCalledWith(true)

    unmount()
    expect(runtimeSpies.runtime.dispose).toHaveBeenCalledOnce()
  })

  it('reports synchronous WebGL initialization errors through the UI callback', async () => {
    runtimeSpies.runtime.mount.mockImplementationOnce(() => {
      throw new Error('WebGL unavailable')
    })
    const onError = vi.fn()

    render(
      <ExperienceCanvas
        attempt={0}
        entered={false}
        onProgress={vi.fn()}
        onReady={vi.fn()}
        onError={onError}
      />,
    )

    await waitFor(() => expect(onError).toHaveBeenCalledWith('WebGL unavailable'))
    expect(runtimeSpies.runtime.dispose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the lifecycle test and verify RED**

Run: `npm test -- src/experience/ExperienceCanvas.test.tsx`

Expected: FAIL because `ExperienceCanvas.tsx` does not exist.

- [ ] **Step 3: Add the runtime API used by the React adapter**

Implement `ExperienceRuntime` with these exact public members:

```ts
export class ExperienceRuntime {
  mount(container: HTMLElement): this
  load(url: string, onProgress: (progress: number) => void): Promise<void>
  setEntered(entered: boolean): void
  dispose(): void
}
```

The complete implementation must:

```ts
import * as THREE from 'three'
import { createVrmLoader, loadMonaAsset } from './monaLoader'
import { MonaController } from './MonaController'
import { selectExperienceQuality, shouldShowStartMarker } from './experienceRuntime.helpers'

export class ExperienceRuntime {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  private readonly clock = new THREE.Clock()
  private renderer?: THREE.WebGLRenderer
  private container?: HTMLElement
  private resizeObserver?: ResizeObserver
  private animationFrame?: number
  private mona?: MonaController
  private startMarker?: THREE.Group
  private ready = false
  private entered = false
  private disposed = false
  private hidden = document.hidden

  mount(container: HTMLElement) {
    if (this.disposed) throw new Error('ExperienceRuntime is disposed.')
    this.container = container
    this.scene.background = new THREE.Color(0x123d34)
    this.scene.fog = new THREE.Fog(0x123d34, 8, 24)
    this.camera.position.set(0.3, 1.45, 6.4)
    this.camera.lookAt(1.3, 1.05, -3.4)

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const quality = selectExperienceQuality({
      width: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      coarsePointer,
    })
    const renderer = new THREE.WebGLRenderer({ antialias: quality.tier === 'desktop' })
    renderer.setPixelRatio(quality.pixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.dataset.experienceCanvas = 'true'
    container.replaceChildren(renderer.domElement)
    this.renderer = renderer

    this.scene.add(new THREE.HemisphereLight(0xeaf7f1, 0x173f37, 2.2))
    const key = new THREE.DirectionalLight(0xffe2a7, 3.1)
    key.position.set(-3, 6, 4)
    this.scene.add(key)
    const floor = new THREE.GridHelper(30, 30, 0x9ec8ba, 0x5f8c7e)
    this.scene.add(floor)

    const marker = new THREE.Group()
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3a83b,
      emissive: 0xc36d13,
      emissiveIntensity: 0.8,
      roughness: 0.35,
    })
    marker.add(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.08, 20, 72), markerMaterial))
    marker.position.set(-1.65, 1.05, 0.3)
    marker.rotation.x = -0.1
    marker.visible = false
    this.scene.add(marker)
    this.startMarker = marker

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.resize()
    this.tick()
    return this
  }

  async load(url: string, onProgress: (progress: number) => void) {
    const vrm = await loadMonaAsset(createVrmLoader(), url, onProgress)
    if (this.disposed) return
    this.mona?.dispose()
    this.mona = new MonaController(vrm)
    this.mona.attachTo(this.scene)
    this.ready = true
    this.updateMarkerVisibility()
    onProgress(1)
  }

  setEntered(entered: boolean) {
    this.entered = entered
    this.updateMarkerVisibility()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.resizeObserver?.disconnect()
    this.mona?.dispose()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })
    this.renderer?.dispose()
    this.renderer?.forceContextLoss()
    this.renderer?.domElement.remove()
    this.scene.clear()
  }

  private resize() {
    if (!this.container || !this.renderer) return
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private tick = () => {
    if (this.disposed) return
    const delta = this.clock.getDelta()
    if (!this.hidden) {
      this.mona?.update(delta)
      this.renderer?.render(this.scene, this.camera)
    }
    this.animationFrame = requestAnimationFrame(this.tick)
  }

  private handleVisibility = () => {
    this.hidden = document.hidden
    this.clock.getDelta()
  }

  private updateMarkerVisibility() {
    if (this.startMarker) {
      this.startMarker.visible = shouldShowStartMarker(this.ready, this.entered)
    }
  }
}
```

- [ ] **Step 4: Add the React lifecycle adapter**

```tsx
import { useEffect, useRef } from 'react'
import { ExperienceRuntime } from './runtime/ExperienceRuntime'

export type ExperienceCanvasProps = {
  attempt: number
  entered: boolean
  onProgress: (progress: number) => void
  onReady: () => void
  onError: (message: string) => void
}

export function ExperienceCanvas({
  attempt,
  entered,
  onProgress,
  onReady,
  onError,
}: ExperienceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<ExperienceRuntime>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let active = true
    const runtime = new ExperienceRuntime()

    try {
      runtime.mount(container)
      runtimeRef.current = runtime
      runtime.load('/models/mona/Mona.vrm', onProgress).then(
        () => {
          if (active) onReady()
        },
        (error: unknown) => {
          if (active) onError(error instanceof Error ? error.message : 'โหลด Mona ไม่สำเร็จ')
        },
      )
    } catch (error: unknown) {
      runtime.dispose()
      onError(error instanceof Error ? error.message : 'ไม่สามารถเริ่มฉาก Three.js ได้')
    }

    return () => {
      active = false
      runtime.dispose()
      runtimeRef.current = null
    }
  }, [attempt, onError, onProgress, onReady])

  useEffect(() => {
    runtimeRef.current?.setEntered(entered)
  }, [entered])

  return <div ref={containerRef} className="experience-canvas" aria-label="ฉาก Three.js ของ Mona" />
}
```

- [ ] **Step 5: Run the lifecycle test and verify GREEN**

Run: `npm test -- src/experience/ExperienceCanvas.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Run type-check/build to verify installed APIs**

Run: `npm run build`

Expected: PASS with the installed Three.js 0.185 and `@pixiv/three-vrm` 3.5.5 types.

- [ ] **Step 7: Commit the runtime and adapter**

```powershell
git add -- src/experience/runtime/ExperienceRuntime.ts src/experience/ExperienceCanvas.tsx src/experience/ExperienceCanvas.test.tsx
git diff --cached --check
git commit -m "feat: add persistent Mona experience runtime"
```

---

### Task 5: Loading, Ready, Error, and Entry UI

**Files:**
- Create: `src/experience/ExperienceOverlay.tsx`
- Create: `src/experience/ExperienceShell.tsx`
- Create: `src/experience/ExperienceShell.test.tsx`
- Create: `src/pages/ExperiencePage.tsx`

**Interfaces:**
- Consumes: state machine from Task 1 and `ExperienceCanvasProps` from Task 4.
- Produces: `ExperienceShell`, `ExperiencePage`.
- Consumed by: router in Task 6.

- [ ] **Step 1: Write failing component-flow tests**

Use a dependency-injected canvas component so jsdom does not need WebGL:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ExperienceShell } from './ExperienceShell'
import type { ExperienceCanvasProps } from './ExperienceCanvas'

let latestCanvasProps: ExperienceCanvasProps | undefined
const observedErrorAttempts: number[] = []

function ManualCanvas(props: ExperienceCanvasProps) {
  latestCanvasProps = props
  return <div data-testid="fake-canvas" />
}

function ErrorCanvas({ attempt, onError }: ExperienceCanvasProps) {
  observedErrorAttempts.push(attempt)
  useEffect(() => onError('network'), [onError])
  return <div data-testid="fake-canvas" />
}

describe('ExperienceShell', () => {
  it('enables Start only after the scene is ready and keeps one canvas mounted', async () => {
    vi.useFakeTimers()
    render(<ExperienceShell CanvasComponent={ManualCanvas} entryDurationMs={400} />)

    expect(screen.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'เริ่ม' })).not.toBeInTheDocument()
    act(() => latestCanvasProps?.onProgress(0.5))
    expect(screen.getByText('50%')).toBeVisible()
    act(() => latestCanvasProps?.onReady())

    const start = await screen.findByRole('button', { name: 'เริ่ม' })
    expect(screen.getAllByTestId('fake-canvas')).toHaveLength(1)
    fireEvent.click(start)
    act(() => vi.advanceTimersByTime(400))

    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered')
    expect(screen.getAllByTestId('fake-canvas')).toHaveLength(1)
    vi.useRealTimers()
  })

  it('shows a retry action after loading fails', async () => {
    observedErrorAttempts.length = 0
    render(<ExperienceShell CanvasComponent={ErrorCanvas} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดฉากไม่สำเร็จ')
    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(observedErrorAttempts).toContain(1)
  })
})
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/experience/ExperienceShell.test.tsx`

Expected: FAIL because `ExperienceShell.tsx` does not exist.

- [ ] **Step 3: Implement the semantic overlay**

```tsx
import type { ExperienceState } from './experienceMachine'

type Props = {
  state: ExperienceState
  onStart: () => void
  onRetry: () => void
}

export function ExperienceOverlay({ state, onStart, onRetry }: Props) {
  const percent = Math.round(state.progress * 100)
  return (
    <div className={`experience-overlay experience-overlay--${state.phase}`}>
      <header className="experience-brand" aria-label="ThreeLab">
        <span className="experience-brand__mark">3D</span>
        <span>ThreeLab</span>
      </header>

      {state.phase === 'loading' && (
        <section className="experience-loading" aria-live="polite">
          <p className="experience-eyebrow">กำลังเตรียมโลก 3D</p>
          <h1>กำลังพา Mona เข้าสู่ฉาก</h1>
          <progress max="100" value={percent}>{percent}%</progress>
          <p>{percent}%</p>
        </section>
      )}

      {state.phase === 'error' && (
        <section className="experience-loading" role="alert">
          <p className="experience-eyebrow">เกิดปัญหาระหว่างเตรียมฉาก</p>
          <h1>โหลดฉากไม่สำเร็จ</h1>
          <p>{state.errorMessage}</p>
          <button type="button" onClick={onRetry}>ลองใหม่</button>
        </section>
      )}

      {state.phase === 'ready' && (
        <div className="experience-ready" aria-live="polite">
          <p>ฉากพร้อมแล้ว</p>
          <button className="experience-start" type="button" onClick={onStart}>
            เริ่ม
          </button>
        </div>
      )}

      <p className="experience-credit">Mona — Character by Puna</p>
    </div>
  )
}
```

- [ ] **Step 4: Implement the shell and page**

```tsx
import { type ComponentType, useCallback, useEffect, useReducer } from 'react'
import { ExperienceCanvas, type ExperienceCanvasProps } from './ExperienceCanvas'
import { ExperienceOverlay } from './ExperienceOverlay'
import { INITIAL_EXPERIENCE_STATE, reduceExperience } from './experienceMachine'

type Props = {
  CanvasComponent?: ComponentType<ExperienceCanvasProps>
  entryDurationMs?: number
}

export function ExperienceShell({
  CanvasComponent = ExperienceCanvas,
  entryDurationMs = 450,
}: Props) {
  const [state, dispatch] = useReducer(reduceExperience, INITIAL_EXPERIENCE_STATE)
  const onProgress = useCallback((progress: number) => {
    dispatch({ type: 'LOAD_PROGRESS', progress })
  }, [])
  const onReady = useCallback(() => dispatch({ type: 'LOAD_SUCCEEDED' }), [])
  const onError = useCallback((message: string) => {
    dispatch({ type: 'LOAD_FAILED', message })
  }, [])

  useEffect(() => {
    if (state.phase !== 'entering') return
    const timer = window.setTimeout(
      () => dispatch({ type: 'ENTRY_TRANSITION_FINISHED' }),
      entryDurationMs,
    )
    return () => window.clearTimeout(timer)
  }, [entryDurationMs, state.phase])

  return (
    <main className="experience-shell" data-experience-phase={state.phase}>
      <CanvasComponent
        key={state.attempt}
        attempt={state.attempt}
        entered={state.phase === 'entered'}
        onProgress={onProgress}
        onReady={onReady}
        onError={onError}
      />
      <ExperienceOverlay
        state={state}
        onStart={() => dispatch({ type: 'START_REQUESTED' })}
        onRetry={() => dispatch({ type: 'RETRY_REQUESTED' })}
      />
    </main>
  )
}
```

```tsx
import { ExperienceShell } from '../experience/ExperienceShell'

export function ExperiencePage() {
  return <ExperienceShell />
}
```

- [ ] **Step 5: Run the component tests and verify GREEN**

Run: `npm test -- src/experience/ExperienceShell.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the UI behavior slice**

```powershell
git add -- src/experience/ExperienceOverlay.tsx src/experience/ExperienceShell.tsx src/experience/ExperienceShell.test.tsx src/pages/ExperiencePage.tsx
git diff --cached --check
git commit -m "feat: add Mona loading and entry experience"
```

---

### Task 6: Root Route, Faithful Styling, and Browser Flow

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/styles/index.css`
- Create: `tests/e2e/mona-experience.spec.ts`
- Modify: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- Consumes: `ExperiencePage` from Task 5.
- Produces: complete root route and browser-tested Phase 1 flow.

- [ ] **Step 1: Write the failing Mona browser test before changing the route**

```ts
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
```

- [ ] **Step 2: Run the focused E2E test and verify RED**

Run: `npx playwright test tests/e2e/mona-experience.spec.ts`

Expected: FAIL because `/` still renders the old home page.

- [ ] **Step 3: Move only the root route outside AppShell**

Replace `src/app/App.tsx` with this complete route tree:

```tsx
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '../components/AppShell'
import { ConceptsPage } from '../pages/ConceptsPage'
import { ExperiencePage } from '../pages/ExperiencePage'
import { LessonsPage } from '../pages/LessonsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

const LessonPage = lazy(() =>
  import('../pages/LessonPage').then((module) => ({ default: module.LessonPage })),
)
const PlaygroundPage = lazy(() =>
  import('../pages/PlaygroundPage').then((module) => ({ default: module.PlaygroundPage })),
)
const ConceptDetailPage = lazy(() =>
  import('../pages/ConceptDetailPage').then((module) => ({ default: module.ConceptDetailPage })),
)

function RouteLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <p className="rounded-full bg-[#e4eee9] px-4 py-2 text-sm font-bold text-[#406a5f]">
        กำลังเตรียมฉาก 3D…
      </p>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route index element={<ExperiencePage />} />
      <Route element={<AppShell />}>
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="concepts" element={<ConceptsPage />} />
        <Route
          path="concepts/:conceptId"
          element={
            <Suspense fallback={<RouteLoader />}>
              <ConceptDetailPage />
            </Suspense>
          }
        />
        <Route
          path="lessons/:lessonId"
          element={
            <Suspense fallback={<RouteLoader />}>
              <LessonPage />
            </Suspense>
          }
        />
        <Route
          path="playground"
          element={
            <Suspense fallback={<RouteLoader />}>
              <PlaygroundPage />
            </Suspense>
          }
        />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
```

Do not delete `HomePage.tsx` in this phase.

- [ ] **Step 4: Add the full-viewport visual system without CSS-drawn decorative art**

Append focused experience classes to `src/styles/index.css`. Use solid surfaces and opacity; all rings, grid, lighting, and geometry visible in the world come from Three.js.

```css
.experience-shell {
  position: relative;
  width: 100vw;
  min-height: 100svh;
  overflow: hidden;
  background: #123d34;
  color: #f7fbf9;
}

.experience-canvas,
.experience-canvas canvas,
.experience-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.experience-canvas canvas { display: block; }
.experience-overlay { pointer-events: none; transition: opacity 450ms ease; }
.experience-overlay--entering,
.experience-overlay--entered { opacity: 0; }
.experience-overlay button { pointer-events: auto; }

.experience-brand {
  position: absolute;
  top: clamp(1.25rem, 3vw, 2.25rem);
  left: clamp(1.25rem, 3vw, 2.5rem);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 850;
  font-size: clamp(1.1rem, 2vw, 1.55rem);
}

.experience-brand__mark {
  display: grid;
  place-items: center;
  width: 2.8rem;
  aspect-ratio: 1;
  border-radius: 0.8rem;
  background: #f3a83b;
  color: #123d34;
}

.experience-loading {
  position: absolute;
  left: clamp(1.5rem, 9vw, 8rem);
  top: 50%;
  width: min(34rem, calc(100vw - 3rem));
  transform: translateY(-50%);
}

.experience-loading h1 {
  max-width: 15ch;
  margin: 0.6rem 0 1.5rem;
  font-size: clamp(2rem, 5vw, 4.6rem);
  line-height: 1.05;
}

.experience-eyebrow {
  color: #f3a83b;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.experience-loading progress {
  width: min(28rem, 100%);
  height: 0.55rem;
  accent-color: #f3a83b;
}

.experience-ready {
  position: absolute;
  left: clamp(2rem, 12vw, 11rem);
  bottom: clamp(6rem, 17vh, 11rem);
}

.experience-ready p {
  margin: 0 0 0.25rem;
  color: #f3a83b;
  font-weight: 800;
}

.experience-start {
  min-width: 9rem;
  border: 0;
  background: transparent;
  color: #fff7e8;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 900;
  cursor: pointer;
}

.experience-start:focus-visible {
  outline: 3px solid #fff7e8;
  outline-offset: 0.5rem;
}

.experience-credit {
  position: absolute;
  right: 1.25rem;
  bottom: 1rem;
  margin: 0;
  color: rgba(247, 251, 249, 0.72);
  font-size: 0.78rem;
}

@media (max-width: 767px) {
  .experience-loading { top: 45%; }
  .experience-ready { left: 50%; transform: translateX(-50%); text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .experience-overlay { transition-duration: 1ms; }
}
```

- [ ] **Step 5: Preserve the existing learning E2E flow after root changes**

In only the first test of `tests/e2e/learning-flow.spec.ts`, replace the old home CTA sequence:

```ts
await page.goto('/')
await page.getByRole('link', { name: /เริ่มบทแรก/ }).click()
```

with:

```ts
await page.goto('/lessons')
await page.getByRole('link', { name: /Hello, Three.js/ }).click()
```

Do not remove or alter the user's progress-persistence test later in the same file.

- [ ] **Step 6: Run focused browser tests and verify GREEN**

Run:

```powershell
npx playwright test tests/e2e/mona-experience.spec.ts
npx playwright test tests/e2e/learning-flow.spec.ts
```

Expected: both files PASS.

- [ ] **Step 7: Run the full automated verification suite**

Run:

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
```

Expected: all commands exit `0`; output contains no uncaught runtime errors.

- [ ] **Step 8: Commit only the root experience route, styles, and owned test hunks**

`tests/e2e/learning-flow.spec.ts` is already dirty. Stage only the first-test navigation hunk using `git add -p` and verify that the cached diff does not include the user-owned progress test.

```powershell
git add -- src/app/App.tsx src/styles/index.css tests/e2e/mona-experience.spec.ts
git add -p -- tests/e2e/learning-flow.spec.ts
git diff --cached --check
git diff --cached
git commit -m "feat: make Mona the ThreeLab entry experience"
```

---

### Task 7: Browser Design QA and Completion Gate

**Files:**
- Create: `design-qa.md`
- Create: a local implementation screenshot under `docs/superpowers/qa/`
- Reference: `docs/superpowers/specs/assets/mona-experience-concept-3.png`

**Interfaces:**
- Consumes: completed root experience from Tasks 1–6.
- Produces: browser-verified visual evidence and `design-qa.md` with `final result: passed`.

- [ ] **Step 1: Start the local app and open the root experience in the selected in-app browser**

Run: `npm run dev -- --host 127.0.0.1`

Open the local root using the Browser skill, wait for the real Start state, and verify:

- loading copy appears before ready;
- Start appears only after Mona parses;
- one canvas exists;
- Start reaches `data-experience-phase="entered"`;
- console has no errors;
- existing `/lessons` still opens.

- [ ] **Step 2: Capture matching desktop evidence**

Capture the implementation at `1440 x 1024` in the ready state and save it under:

`docs/superpowers/qa/mona-experience-phase-1-ready.png`

Capture the same ready state at `390 x 844` and save it under:

`docs/superpowers/qa/mona-experience-phase-1-mobile.png`

Record source and implementation pixel dimensions, CSS viewport, device scale factor, state, and browser in `design-qa.md`.

- [ ] **Step 3: Compare the source and implementation in one combined visual input**

Use the selected concept image and the implementation screenshot together. Evaluate:

- typography;
- spacing and layout rhythm;
- forest/mint/amber color balance;
- Mona scale, distance, and three-quarter staging;
- Three.js marker placement;
- Thai loading/start copy;
- loading, ready, focus, and entered states;
- desktop and narrow-screen behavior.

Write findings as P0–P3 with evidence and concrete fixes.

- [ ] **Step 4: Fix every P0/P1/P2 finding and repeat capture/comparison**

For every material issue, write a failing regression test when behavior is involved, apply the minimal fix, rerun the focused test, recapture at the same viewport/state, and append the comparison history to `design-qa.md`. Commit each verified QA fix with explicit file paths before continuing to the next finding.

Stop only when `design-qa.md` contains exactly:

```text
final result: passed
```

- [ ] **Step 5: Run final verification after QA fixes**

Run:

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit QA evidence and any final verified fixes**

```powershell
git add -- design-qa.md docs/superpowers/qa/mona-experience-phase-1-ready.png docs/superpowers/qa/mona-experience-phase-1-mobile.png
git diff --cached --check
git diff --cached --name-only
git commit -m "test: verify Mona entry experience"
```

Expected staged names: only the QA report and the two final comparison screenshots. Never stage unrelated user files.

## Plan Self-Review Checklist

- [x] Every Phase 1 acceptance criterion maps to a task above.
- [x] Camera movement, turn animation, idle, OrbitControls, lessons, audio, lip sync, and AI remain out of scope.
- [x] The real VRM is loaded and never mutated at its desktop source path.
- [x] State, helper, loader, controller, runtime lifecycle, shell, and browser behaviors all have a failing-test-first step.
- [x] Existing dirty user changes are preserved with partial staging where files overlap.
- [x] The selected concept is treated as art direction, not a raster background.
- [x] Design QA compares source and implementation visually and blocks handoff until passed.
