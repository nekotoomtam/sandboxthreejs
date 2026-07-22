# Mona Calm Idle VRMA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author a local-only five-second calm idle animation for Mona, export it as `idle.vrma`, and replace the Three.js procedural idle with the real clip while keeping randomized blinking independent.

**Architecture:** Blender 4.1 and the installed VRM Add-on produce a humanoid-only VRMA from a protected local copy of Mona. The web runtime adds the official `@pixiv/three-vrm-animation` loader, converts the VRMA into a Three.js `AnimationClip`, and lets `MonaController` own its mixer, fallback body motion, blink scheduler, update order, and disposal. The licensed binaries remain ignored and local; only loader/runtime code, tests, documentation, and dependency metadata are committed.

**Tech Stack:** Blender 4.1, VRM Add-on for Blender, VRMA 1.0, Three.js 0.185.1, `@pixiv/three-vrm` 3.5.5, `@pixiv/three-vrm-animation` 3.5.5, TypeScript 6, Vitest, Playwright, Vite.

## Global Constraints

- Source avatar is `C:\Users\nekot\Desktop\Mona.vrm`; never overwrite it.
- Animation duration is 5.0 seconds at 30 frames per second.
- Blender action name is `Mona_Idle_Calm`; exported filename is `idle.vrma`.
- The resting pose is left hand lightly over right hand at the lower abdomen, with no interlaced fingers.
- Feet and world root remain stationary; the runtime continues to own Mona's world position and global heading.
- The VRMA contains no blink, eye, expression, lip-sync, or spring-bone keyframes.
- Runtime blinking remains randomized and independent of the five-second body loop.
- The current avatar metadata is `avatarPermission=onlyAuthor`, `creditNotation=required`, and `allowRedistribution=false`.
- Keep Mona, the Blender working file, and `idle.vrma` local-only; do not push, publish, release, or merge those binaries publicly.
- Do not install, update, or replace Blender or the VRM Add-on without stopping and reporting the compatibility issue.
- Use the primary Codex agent for authoring and visual review; do not delegate the Blender or motion work.
- Do not push this branch.

---

## File Structure

### Local-only authoring files

- `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-source-copy.vrm`: protected working copy of the avatar.
- `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-v1.blend`: Blender authoring file.
- `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\idle.vrma`: canonical local export.
- `public/models/mona/animations/idle.vrma`: ignored local runtime copy served by Vite.

### Repository files

- `.gitignore`: excludes Mona VRMA and Blender binary authoring artifacts.
- `package.json`: adds `@pixiv/three-vrm-animation` at the same 3.5.5 version as `@pixiv/three-vrm`.
- `package-lock.json`: records the exact dependency graph.
- `src/experience/runtime/vrmaLoader.ts`: registers `VRMAnimationLoaderPlugin`, validates a parsed VRMA, and creates the Mona-targeted `AnimationClip`.
- `src/experience/runtime/vrmaLoader.test.ts`: tests plugin registration, progress, parsing, and failures.
- `src/experience/runtime/BlinkController.ts`: deterministic randomized blink state machine.
- `src/experience/runtime/BlinkController.test.ts`: tests timing, shape, and optional double blink.
- `src/experience/runtime/MonaController.ts`: owns the animation mixer, real idle action, procedural fallback, blinking, update order, and cleanup.
- `src/experience/runtime/MonaController.test.ts`: verifies real/fallback animation behavior, blink independence, and disposal.
- `src/experience/runtime/ExperienceRuntime.ts`: loads Mona and the optional local idle before reporting readiness.
- `src/experience/runtime/ExperienceRuntime.test.ts`: verifies progress mapping, successful clip attachment, recoverable animation failure, and late-disposal safety.
- `src/experience/ExperienceCanvas.tsx`: supplies the model and idle asset URLs.
- `src/experience/ExperienceCanvas.test.tsx`: verifies both URLs are passed without remounting the runtime.
- `design-qa.md`: records local Blender and browser findings without embedding protected assets.

---

### Task 1: Verify the Local Toolchain and Establish a Protected Workspace

**Files:**
- Read: `C:\Program Files\Blender Foundation\Blender 4.1\blender.exe`
- Read: `C:\Users\nekot\AppData\Roaming\Blender Foundation\Blender\4.1\scripts\addons\VRM_Addon_for_Blender-release\exporter\vrm_animation_exporter.py`
- Create locally: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-source-copy.vrm`
- Do not modify: `C:\Users\nekot\Desktop\Mona.vrm`

**Interfaces:**
- Consumes: the existing Blender installation, enabled VRM Add-on, and source avatar.
- Produces: a verified local authoring workspace and an immutable source hash for later comparison.

- [ ] **Step 1: Initialize Windows app control before opening Blender**

Load `computer-use:computer-use`, initialize the Node REPL client from:

```text
C:\Users\nekot\.codex\plugins\cache\openai-bundled\computer-use\26.715.61943\scripts\computer-use-client.mjs
```

Read `sky.documentation("guidance")`, `sky.documentation("api")`, and `sky.documentation("confirmations")` before sending input to Blender. Keep all computer-control calls in the same REPL session.

- [ ] **Step 2: Confirm Blender and VRMA export support without changing configuration**

Run:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.1\blender.exe' --background --python-expr "import bpy; print('BLENDER', bpy.app.version_string); print('VRMA_EXPORT', hasattr(bpy.ops.export_scene, 'vrma')); print('VRMA_IMPORT', hasattr(bpy.ops.import_scene, 'vrma'))"
```

Expected output includes:

```text
BLENDER 4.1
VRMA_EXPORT True
VRMA_IMPORT True
```

If either capability is false, stop before authoring and report the installed add-on compatibility problem.

- [ ] **Step 3: Record the untouched source identity**

Run:

```powershell
Get-Item -LiteralPath 'C:\Users\nekot\Desktop\Mona.vrm' | Select-Object FullName, Length, LastWriteTime
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Users\nekot\Desktop\Mona.vrm'
```

Expected: the file exists, its length remains 15,978,676 bytes unless the user has intentionally re-exported it again, and a SHA-256 value is recorded in the execution notes.

- [ ] **Step 4: Create the local workspace and copy the avatar**

Run with the explicit paths below:

```powershell
New-Item -ItemType Directory -Force -Path 'C:\Users\nekot\Documents\MonaAuthoring\idle-v1'
Copy-Item -LiteralPath 'C:\Users\nekot\Desktop\Mona.vrm' -Destination 'C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-source-copy.vrm'
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-source-copy.vrm'
```

Expected: source and copy hashes are identical.

- [ ] **Step 5: Confirm the repository starts clean and the source was not touched**

Run:

```powershell
git status --short
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Users\nekot\Desktop\Mona.vrm'
```

Expected: no new binary is present in Git status and the source hash matches Step 3.

No commit is created for this task because its deliverable is entirely local and protected.

---

### Task 2: Author and Export `Mona_Idle_Calm` in Blender

**Files:**
- Create locally: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-v1.blend`
- Create locally: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\idle.vrma`
- Copy locally: `public/models/mona/animations/idle.vrma`

**Interfaces:**
- Consumes: the verified source copy from Task 1 and the approved five-second motion design.
- Produces: a VRMA 1.0 humanoid animation named `Mona_Idle_Calm`, ready for structural and browser validation.

- [ ] **Step 1: Open Blender and import only the protected copy**

Using the initialized Windows control session:

1. Open Blender 4.1.
2. Choose `File` → `Import` → `VRM (.vrm)`.
3. Select `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-source-copy.vrm`.
4. Wait for the avatar and armature to appear.
5. Save as `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-idle-v1.blend`.

Expected: the title bar shows `Mona-idle-v1.blend`; the Desktop source path is never used as a save target.

- [ ] **Step 2: Configure the animation range and action**

In Blender:

1. Set frame rate to `30 fps`.
2. Set Start to `1` and End to `151`, producing exactly five seconds between matching endpoints.
3. Select the VRM armature and enter Pose Mode.
4. Create an action named `Mona_Idle_Calm`.
5. Use quaternion rotation for animated humanoid pose bones where the imported rig already uses quaternion rotation.

Expected: frame 1 is time 0.0 seconds and frame 151 is time 5.0 seconds.

- [ ] **Step 3: Build the approved resting pose at frame 1**

Pose the humanoid bones until all visible conditions are satisfied:

- both feet remain flat at their imported locations;
- hips stay above the midpoint between the feet;
- spine remains upright and relaxed;
- shoulders are lowered;
- elbows bend naturally toward the front of the lower torso;
- right hand rests closest to the lower abdomen;
- left hand rests lightly above the right hand;
- fingers remain relaxed and do not interlace;
- neither hand intersects the other hand, clothing, or abdomen;
- the right forearm can later lift away without passing through the left arm;
- head faces generally forward.

Insert rotation keyframes for the necessary humanoid bones. Insert a hips location key only if required by the exporter, and keep that location identical at every keyed time.

Expected: the silhouette reads as a calm assistant from front and three-quarter views.

- [ ] **Step 4: Create the five motion poses**

Use these frames and limits:

| Frame | Time | Authoring target |
|---|---:|---|
| 1 | 0.00 s | Exact resting pose. |
| 38 | 1.23 s | Upper chest lifts approximately 0.5–0.8 degrees for inhale; hands and shoulders follow subtly. |
| 76 | 2.50 s | Weight favors one leg with no more than approximately 1 degree of pelvis roll and no foot movement. |
| 113 | 3.73 s | Body passes gently back through center during exhale. |
| 151 | 5.00 s | Exact duplicate of frame 1 for pose and rotation values. |

Keep head secondary motion within one to two degrees. Keep elbow and hand motion driven by the torso rhythm rather than forming a separate gesture. Do not key expression previews, LookAt targets, hair bones, skirt bones, or other spring-bone chains.

- [ ] **Step 5: Shape the loop curves**

In the Graph Editor:

1. Set animated humanoid rotation curves to Bezier interpolation.
2. Use Auto Clamped handles as the starting point.
3. Match the value and incoming/outgoing trend at frames 1 and 151.
4. Remove overshoot that causes hip sway, shoulder shrugging, hand sliding, or head bobbing.
5. Play at least five consecutive cycles.

Expected: there is no visible stop, pop, or reverse snap at the loop seam.

- [ ] **Step 6: Perform Blender visual checks before export**

Inspect front, side, and three-quarter views while the loop plays. Capture screenshots at frames 1, 38, 76, 113, and 151. Confirm:

- frame 1 and 151 poses are visually identical;
- feet do not slide;
- hips do not travel across the floor;
- left hand remains above right;
- hands do not separate or penetrate geometry;
- breathing is visible only when watched closely;
- Mona does not look sleepy, nervous, or continuously swaying.

If any condition fails, adjust the nearest keyframes and repeat the five-cycle review.

- [ ] **Step 7: Export the VRMA**

Choose `File` → `Export` → `VRM Animation (.vrma)`, select the Mona armature, and save to:

```text
C:\Users\nekot\Documents\MonaAuthoring\idle-v1\idle.vrma
```

Expected: the file exists, is non-zero in size, and the exporter shows no missing-humanoid errors.

- [ ] **Step 8: Validate the exported structure with `vrm-toolkit`**

Use `vrm-toolkit` on the local export and confirm:

- extension `VRMC_vrm_animation` is present;
- spec version is `1.0` or the add-on's supported `1.0-draft` with an explicit warning recorded;
- one animation exists;
- duration is approximately 5.0 seconds;
- rotation tracks target humanoid bones only;
- translation, if present, targets hips only and has no net displacement;
- expression and LookAt tracks are absent;
- no mesh, material, image, or texture payload is embedded.

If the file violates these checks, return to Blender rather than modifying the VRMA binary manually.

- [ ] **Step 9: Copy the approved export into the ignored runtime location**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'public\models\mona\animations'
Copy-Item -LiteralPath 'C:\Users\nekot\Documents\MonaAuthoring\idle-v1\idle.vrma' -Destination 'public\models\mona\animations\idle.vrma'
```

Expected: the runtime copy and canonical export have the same SHA-256 hash.

No binary commit is created for this task.

---

### Task 3: Add the Official VRMA Loader and Protect Local Assets

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/experience/runtime/vrmaLoader.ts`
- Create: `src/experience/runtime/vrmaLoader.test.ts`

**Interfaces:**
- Consumes: `VRMAnimationLoaderPlugin`, `createVRMAnimationClip`, `VRM`, `GLTFLoader`, and `resolveLoadProgress`.
- Produces: `createVrmaLoader(): GLTFLoader` and `loadVrmaClip(loader, url, vrm, onProgress): Promise<THREE.AnimationClip>`.

- [ ] **Step 1: Protect local animation and Blender binaries before dependency work**

Append these exact rules to `.gitignore`:

```gitignore
# Local licensed Mona animation authoring files
public/models/mona/animations/*.vrma
public/models/mona/animations/*.blend
public/models/mona/animations/*.blend1
```

Run:

```powershell
git check-ignore -v 'public/models/mona/animations/idle.vrma'
git status --short
```

Expected: `idle.vrma` is ignored and does not appear in Git status.

- [ ] **Step 2: Add the matching official runtime package**

Run:

```powershell
npm install @pixiv/three-vrm-animation@3.5.5
```

Expected: `package.json` and `package-lock.json` change; `@pixiv/three-vrm-animation` resolves to 3.5.5, matching `@pixiv/three-vrm`.

- [ ] **Step 3: Write the failing VRMA loader tests**

Create `src/experience/runtime/vrmaLoader.test.ts`:

```ts
import { VRMAnimation, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVrmaLoader, loadVrmaClip } from './vrmaLoader'

function emptyAnimation(duration = 5) {
  const animation = new VRMAnimation()
  animation.duration = duration
  return animation
}

function fakeLoader(result: { vrmAnimations?: VRMAnimation[] }, fail?: Error) {
  return {
    load: vi.fn((_url, onLoad, onProgress, onError) => {
      onProgress?.({ loaded: 50, total: 100 } as ProgressEvent<EventTarget>)
      if (fail) onError?.(fail)
      else onLoad({ userData: result })
      return {} as never
    }),
  }
}

describe('vrmaLoader', () => {
  afterEach(() => vi.restoreAllMocks())

  it('registers the VRM animation loader plugin', () => {
    const register = vi.spyOn(GLTFLoader.prototype, 'register')
    const loader = createVrmaLoader()
    const factory = register.mock.calls.at(-1)?.[0]

    expect(loader).toBeInstanceOf(GLTFLoader)
    expect(factory?.({ json: {} } as never)).toBeInstanceOf(VRMAnimationLoaderPlugin)
  })

  it('reports progress and creates a named five-second clip', async () => {
    const onProgress = vi.fn()
    const vrm = {
      meta: { metaVersion: '1' },
      humanoid: {},
      expressionManager: undefined,
      lookAt: undefined,
    } as unknown as VRM

    const clip = await loadVrmaClip(
      fakeLoader({ vrmAnimations: [emptyAnimation()] }) as never,
      '/models/mona/animations/idle.vrma',
      vrm,
      onProgress,
    )

    expect(onProgress).toHaveBeenCalledWith(0.46)
    expect(clip.name).toBe('Mona_Idle_Calm')
    expect(clip.duration).toBe(5)
  })

  it('rejects a file without VRM animation data', async () => {
    await expect(
      loadVrmaClip(fakeLoader({}) as never, '/idle.vrma', {} as VRM, vi.fn()),
    ).rejects.toThrow('Loaded asset does not contain VRM animation data.')
  })

  it('forwards loader failures', async () => {
    await expect(
      loadVrmaClip(
        fakeLoader({}, new Error('animation network failure')) as never,
        '/idle.vrma',
        {} as VRM,
        vi.fn(),
      ),
    ).rejects.toThrow('animation network failure')
  })
})
```

- [ ] **Step 4: Run the loader test and verify the expected failure**

Run:

```powershell
npm test -- src/experience/runtime/vrmaLoader.test.ts
```

Expected: FAIL because `vrmaLoader.ts` does not exist.

- [ ] **Step 5: Implement the VRMA loader**

Create `src/experience/runtime/vrmaLoader.ts`:

```ts
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  type VRMAnimation,
} from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { resolveLoadProgress } from './experienceRuntime.helpers'

type LoaderPort = Pick<GLTFLoader, 'load'>

export function createVrmaLoader() {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
  return loader
}

export function loadVrmaClip(
  loader: LoaderPort,
  url: string,
  vrm: VRM,
  onProgress: (progress: number) => void,
) {
  return new Promise<import('three').AnimationClip>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const animation = (gltf.userData.vrmAnimations as VRMAnimation[] | undefined)?.[0]
        if (!animation) {
          reject(new Error('Loaded asset does not contain VRM animation data.'))
          return
        }
        const clip = createVRMAnimationClip(animation, vrm)
        clip.name = 'Mona_Idle_Calm'
        resolve(clip)
      },
      (event) => onProgress(resolveLoadProgress(event.loaded, event.total)),
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })
}
```

- [ ] **Step 6: Run focused and static checks**

Run:

```powershell
npm test -- src/experience/runtime/vrmaLoader.test.ts
npm run lint
npm run build
```

Expected: all commands pass.

- [ ] **Step 7: Commit the loader boundary**

Run:

```powershell
git add -- .gitignore package.json package-lock.json src/experience/runtime/vrmaLoader.ts src/experience/runtime/vrmaLoader.test.ts
git commit -m "feat: add local Mona VRMA loading"
```

Expected: the commit contains no `.vrm`, `.vrma`, `.blend`, or `.blend1` files.

---

### Task 4: Add an Independent Randomized Blink Controller

**Files:**
- Create: `src/experience/runtime/BlinkController.ts`
- Create: `src/experience/runtime/BlinkController.test.ts`

**Interfaces:**
- Consumes: an optional `random: () => number`, defaulting to `Math.random`.
- Produces: `new BlinkController(random)` and `update(deltaSeconds): number`, returning blink weight from 0 to 1.

- [ ] **Step 1: Write the failing deterministic blink tests**

Create `src/experience/runtime/BlinkController.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BlinkController } from './BlinkController'

describe('BlinkController', () => {
  it('waits at least 2.5 seconds before closing the eyes', () => {
    const blink = new BlinkController(() => 0)

    expect(blink.update(2.49)).toBe(0)
    expect(blink.update(0.01)).toBe(0)
    expect(blink.update(0.0375)).toBeCloseTo(0.5)
  })

  it('closes, holds, and opens with bounded weights', () => {
    const blink = new BlinkController(() => 0.5)
    blink.update(4)

    const samples = [0.04, 0.04, 0.04, 0.1].map((delta) => blink.update(delta))
    expect(samples.every((weight) => weight >= 0 && weight <= 1)).toBe(true)
    expect(Math.max(...samples)).toBe(1)
    expect(samples.at(-1)).toBe(0)
  })

  it('can schedule one double blink without entering an endless chain', () => {
    const blink = new BlinkController(() => 0)
    blink.update(2.5)
    blink.update(0.075)
    blink.update(0.04)
    blink.update(0.1)

    expect(blink.update(0.119)).toBe(0)
    expect(blink.update(0.001)).toBe(0)
    expect(blink.update(0.0375)).toBeCloseTo(0.5)

    blink.update(0.0375)
    blink.update(0.04)
    expect(blink.update(0.1)).toBe(0)
    expect(blink.update(2.49)).toBe(0)
  })
})
```

- [ ] **Step 2: Run the blink test and verify it fails**

Run:

```powershell
npm test -- src/experience/runtime/BlinkController.test.ts
```

Expected: FAIL because `BlinkController.ts` does not exist.

- [ ] **Step 3: Implement the blink state machine**

Create `src/experience/runtime/BlinkController.ts`:

```ts
type BlinkPhase = 'waiting' | 'closing' | 'closed' | 'opening' | 'double-gap'

const CLOSING_SECONDS = 0.075
const CLOSED_SECONDS = 0.04
const OPENING_SECONDS = 0.1
const DOUBLE_GAP_SECONDS = 0.12
const DOUBLE_BLINK_CHANCE = 0.12

export class BlinkController {
  private phase: BlinkPhase = 'waiting'
  private elapsed = 0
  private duration: number
  private doubleBlinkAvailable = true

  constructor(private readonly random: () => number = Math.random) {
    this.duration = this.nextWait()
  }

  update(deltaSeconds: number): number {
    this.elapsed += Math.max(0, deltaSeconds)
    while (this.elapsed >= this.duration) {
      this.elapsed -= this.duration
      this.advance()
    }

    const progress = this.duration === 0 ? 1 : this.elapsed / this.duration
    if (this.phase === 'closing') return Math.min(1, progress)
    if (this.phase === 'closed') return 1
    if (this.phase === 'opening') return Math.max(0, 1 - progress)
    return 0
  }

  private advance() {
    if (this.phase === 'waiting' || this.phase === 'double-gap') {
      this.phase = 'closing'
      this.duration = CLOSING_SECONDS
      return
    }
    if (this.phase === 'closing') {
      this.phase = 'closed'
      this.duration = CLOSED_SECONDS
      return
    }
    if (this.phase === 'closed') {
      this.phase = 'opening'
      this.duration = OPENING_SECONDS
      return
    }
    if (this.doubleBlinkAvailable && this.random() < DOUBLE_BLINK_CHANCE) {
      this.phase = 'double-gap'
      this.duration = DOUBLE_GAP_SECONDS
      this.doubleBlinkAvailable = false
      return
    }
    this.phase = 'waiting'
    this.duration = this.nextWait()
    this.doubleBlinkAvailable = true
  }

  private nextWait() {
    return 2.5 + this.random() * 3
  }
}
```

- [ ] **Step 4: Run the focused tests and confirm the timing contract**

Run:

```powershell
npm test -- src/experience/runtime/BlinkController.test.ts
```

Expected: all three blink tests pass.

- [ ] **Step 5: Commit the independent blink unit**

Run:

```powershell
git add -- src/experience/runtime/BlinkController.ts src/experience/runtime/BlinkController.test.ts
git commit -m "feat: add natural Mona blink timing"
```

---

### Task 5: Replace Mona's Body Fallback with the Real Idle Action

**Files:**
- Modify: `src/experience/runtime/MonaController.ts`
- Modify: `src/experience/runtime/MonaController.test.ts`

**Interfaces:**
- Consumes: `THREE.AnimationClip`, `BlinkController`, and the existing VRM instance.
- Produces: `MonaController.setIdleClip(clip): void`; `update(delta)` advances mixer → blink/expression → humanoid → VRM; `dispose()` stops and uncaches mixer state.

- [ ] **Step 1: Add failing tests for the real idle, blink, and cleanup**

Append tests that use an action spy and deterministic random source:

```ts
it('plays a supplied idle clip and advances its mixer before the VRM update', () => {
  const mixerUpdate = vi.spyOn(THREE.AnimationMixer.prototype, 'update')
  const action = {
    reset: vi.fn().mockReturnThis(),
    setLoop: vi.fn().mockReturnThis(),
    setEffectiveWeight: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    stop: vi.fn(),
  }
  vi.spyOn(THREE.AnimationMixer.prototype, 'clipAction').mockReturnValue(action as never)
  const vrmUpdate = vi.fn()
  const vrm = {
    scene: new THREE.Group(),
    humanoid: { getNormalizedBoneNode: vi.fn(), update: vi.fn() },
    update: vrmUpdate,
  } as unknown as VRM
  const controller = new MonaController(vrm, () => 0.5)

  controller.setIdleClip(new THREE.AnimationClip('Mona_Idle_Calm', 5, []))
  controller.update(0.25)

  expect(action.reset).toHaveBeenCalledOnce()
  expect(action.setLoop).toHaveBeenCalledWith(THREE.LoopRepeat, Infinity)
  expect(action.play).toHaveBeenCalledOnce()
  expect(mixerUpdate).toHaveBeenCalledWith(0.25)
  expect(mixerUpdate.mock.invocationCallOrder[0]).toBeLessThan(vrmUpdate.mock.invocationCallOrder[0])
})

it('keeps randomized blink expression updates separate from the body clip', () => {
  const setValue = vi.fn()
  const vrm = {
    scene: new THREE.Group(),
    humanoid: { getNormalizedBoneNode: vi.fn(), update: vi.fn() },
    expressionManager: { setValue },
    update: vi.fn(),
  } as unknown as VRM
  const controller = new MonaController(vrm, () => 0)

  controller.update(2.5375)

  expect(setValue).toHaveBeenCalledWith('blink', expect.closeTo(0.5))
})

it('stops and uncaches animation state during disposal', () => {
  const stopAllAction = vi.spyOn(THREE.AnimationMixer.prototype, 'stopAllAction')
  const uncacheRoot = vi.spyOn(THREE.AnimationMixer.prototype, 'uncacheRoot')
  const action = {
    reset: vi.fn().mockReturnThis(),
    setLoop: vi.fn().mockReturnThis(),
    setEffectiveWeight: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    stop: vi.fn(),
  }
  vi.spyOn(THREE.AnimationMixer.prototype, 'clipAction').mockReturnValue(action as never)
  const vrm = {
    scene: new THREE.Group(),
    humanoid: { getNormalizedBoneNode: vi.fn(), update: vi.fn() },
  } as unknown as VRM
  const controller = new MonaController(vrm)
  controller.setIdleClip(new THREE.AnimationClip('Mona_Idle_Calm', 5, []))

  controller.dispose()

  expect(action.stop).toHaveBeenCalledOnce()
  expect(stopAllAction).toHaveBeenCalledOnce()
  expect(uncacheRoot).toHaveBeenCalledWith(vrm.scene)
})
```

- [ ] **Step 2: Run the controller tests and verify the new API fails**

Run:

```powershell
npm test -- src/experience/runtime/MonaController.test.ts
```

Expected: FAIL because the constructor does not accept a random source and `setIdleClip` does not exist.

- [ ] **Step 3: Add mixer and blink ownership to `MonaController`**

Add the import and fields:

```ts
import { BlinkController } from './BlinkController'

private readonly blink: BlinkController
private mixer?: THREE.AnimationMixer
private idleAction?: THREE.AnimationAction

constructor(vrm: VRM, random: () => number = Math.random) {
  this.vrm = vrm
  this.blink = new BlinkController(random)
}
```

Add the real idle entry point:

```ts
setIdleClip(clip: THREE.AnimationClip) {
  this.idleAction?.stop()
  this.mixer?.stopAllAction()
  this.mixer?.uncacheRoot(this.vrm.scene)
  this.mixer = new THREE.AnimationMixer(this.vrm.scene)
  this.idleAction = this.mixer.clipAction(clip)
  this.idleAction.reset().setLoop(THREE.LoopRepeat, Infinity).play()
}
```

Replace the body portion of `update(delta)` with this order:

```ts
update(delta: number) {
  this.elapsedSeconds += delta
  const idleWeight = 1 - Math.sin(this.turnProgress * Math.PI)

  if (this.idleAction && this.mixer) {
    this.idleAction.setEffectiveWeight(idleWeight)
    this.mixer.update(delta)
  } else {
    const breath =
      Math.sin(this.elapsedSeconds * 1.4) * THREE.MathUtils.degToRad(0.7) * idleWeight
    const turnWeight = Math.sin(this.turnProgress * Math.PI)
    this.setNormalizedBoneRotation('chest', 'x', breath)
    this.setNormalizedBoneRotation('hips', 'z', turnWeight * THREE.MathUtils.degToRad(3))
    this.setNormalizedBoneRotation('chest', 'y', turnWeight * THREE.MathUtils.degToRad(-4))
  }

  this.vrm.expressionManager?.setValue('blink', this.blink.update(delta))
  this.vrm.humanoid.update()
  this.vrm.update(delta)
}
```

Start `dispose()` with:

```ts
this.idleAction?.stop()
this.mixer?.stopAllAction()
this.mixer?.uncacheRoot(this.vrm.scene)
this.idleAction = undefined
this.mixer = undefined
```

Keep the existing scene removal and deep disposal after mixer cleanup.

- [ ] **Step 4: Run controller, blink, and existing runtime tests**

Run:

```powershell
npm test -- src/experience/runtime/MonaController.test.ts src/experience/runtime/BlinkController.test.ts src/experience/runtime/ExperienceRuntime.test.ts
```

Expected: all focused tests pass; the procedural body logic remains active only when no real clip has been supplied.

- [ ] **Step 5: Commit controller integration**

Run:

```powershell
git add -- src/experience/runtime/MonaController.ts src/experience/runtime/MonaController.test.ts
git commit -m "feat: play Mona idle animation and blink"
```

---

### Task 6: Load the Idle Before Declaring the Experience Ready

**Files:**
- Modify: `src/experience/runtime/ExperienceRuntime.ts`
- Modify: `src/experience/runtime/ExperienceRuntime.test.ts`
- Modify: `src/experience/ExperienceCanvas.tsx`
- Modify: `src/experience/ExperienceCanvas.test.tsx`

**Interfaces:**
- Consumes: `createVrmaLoader`, `loadVrmaClip`, and `MonaController.setIdleClip`.
- Produces: `ExperienceRuntime.load(modelUrl, idleUrl, onProgress): Promise<void>` with model progress mapped to 0–0.9 and idle progress mapped to 0.9–1.0.

- [ ] **Step 1: Extend runtime mocks and write failing load tests**

Add a hoisted animation-loader mock beside `loaderSpies`:

```ts
const animationLoaderSpies = vi.hoisted(() => ({
  createVrmaLoader: vi.fn(),
  loadVrmaClip: vi.fn(),
}))

vi.mock('./vrmaLoader', () => animationLoaderSpies)
```

Add `setIdleClip: vi.fn()` to the controller instance type and to both controller object factories. In `beforeEach`, establish a successful default animation result so every pre-existing runtime test keeps a complete load path:

```ts
animationLoaderSpies.createVrmaLoader.mockReturnValue({})
animationLoaderSpies.loadVrmaClip.mockResolvedValue(
  new THREE.AnimationClip('Mona_Idle_Calm', 5, []),
)
```

Update the existing late-model-disposal call to the three-argument signature:

```ts
const loading = runtime.load(
  '/models/mona/Mona.vrm',
  '/models/mona/animations/idle.vrma',
  vi.fn(),
)
```

Then add:

```ts
it('loads and attaches the idle clip before reaching full progress', async () => {
  const vrm = { scene: new THREE.Group() } as unknown as VRM
  const clip = new THREE.AnimationClip('Mona_Idle_Calm', 5, [])
  loaderSpies.loadMonaAsset.mockImplementationOnce(async (_loader, _url, progress) => {
    progress(1)
    return vrm
  })
  animationLoaderSpies.loadVrmaClip.mockImplementationOnce(
    async (_loader, _url, _vrm, progress) => {
      progress(1)
      return clip
    },
  )
  const progress = vi.fn()
  const runtime = new ExperienceRuntime()

  await runtime.load('/Mona.vrm', '/idle.vrma', progress)

  expect(animationLoaderSpies.loadVrmaClip).toHaveBeenCalledWith(
    animationLoaderSpies.createVrmaLoader.mock.results[0].value,
    '/idle.vrma',
    vrm,
    expect.any(Function),
  )
  expect(controllerSpies.instances[0].setIdleClip).toHaveBeenCalledWith(clip)
  expect(progress).toHaveBeenCalledWith(0.9)
  expect(progress).toHaveBeenLastCalledWith(1)
  runtime.dispose()
})

it('keeps the procedural idle when the local animation is unavailable', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  loaderSpies.loadMonaAsset.mockResolvedValueOnce({ scene: new THREE.Group() } as VRM)
  animationLoaderSpies.loadVrmaClip.mockRejectedValueOnce(new Error('404'))
  const progress = vi.fn()
  const runtime = new ExperienceRuntime()

  await expect(runtime.load('/Mona.vrm', '/idle.vrma', progress)).resolves.toBeUndefined()

  expect(controllerSpies.instances[0].setIdleClip).not.toHaveBeenCalled()
  expect(warning).toHaveBeenCalledWith('Mona idle animation unavailable; using fallback.', expect.any(Error))
  expect(progress).toHaveBeenLastCalledWith(1)
  runtime.dispose()
})
```

- [ ] **Step 2: Update the canvas expectation first**

Change the existing `ExperienceCanvas.test.tsx` load expectation to:

```ts
expect(runtime.load).toHaveBeenCalledWith(
  '/models/mona/Mona.vrm',
  '/models/mona/animations/idle.vrma',
  expect.any(Function),
)
```

- [ ] **Step 3: Run focused tests and verify the signature mismatch**

Run:

```powershell
npm test -- src/experience/runtime/ExperienceRuntime.test.ts src/experience/ExperienceCanvas.test.tsx
```

Expected: FAIL because runtime load accepts only model URL and progress, and the controller mock has no real idle wiring.

- [ ] **Step 4: Implement combined model and animation loading**

Import the animation loader:

```ts
import { createVrmaLoader, loadVrmaClip } from './vrmaLoader'
```

Replace the `load` method with:

```ts
async load(
  modelUrl: string,
  idleUrl: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  const vrm = await loadMonaAsset(createVrmLoader(), modelUrl, (progress) => {
    onProgress(progress * 0.9)
  })
  const mona = new MonaController(vrm)
  if (this.disposed) {
    mona.dispose()
    return
  }

  this.mona?.dispose()
  this.mona = mona
  this.mona.attachTo(this.scene)
  this.mona.setCompositionPosition(this.composition.monaPosition)
  this.mona.applyEntrySample(this.entrySample)

  try {
    const idleClip = await loadVrmaClip(createVrmaLoader(), idleUrl, vrm, (progress) => {
      onProgress(0.9 + progress * 0.1)
    })
    if (this.disposed) return
    this.mona.setIdleClip(idleClip)
  } catch (error) {
    if (!this.disposed) {
      console.warn('Mona idle animation unavailable; using fallback.', error)
    }
  }

  if (this.disposed) return
  this.mona.update(0)
  this.renderer?.render(this.scene, this.camera)
  onProgress(1)
}
```

This deliberately keeps a missing local VRMA recoverable while model-loading errors remain fatal.

- [ ] **Step 5: Supply the local idle URL from `ExperienceCanvas`**

Replace the runtime load call with:

```ts
runtime.load(
  '/models/mona/Mona.vrm',
  '/models/mona/animations/idle.vrma',
  (progress) => {
    if (active) onProgress(progress)
  },
).then(
  () => {
    if (active) onReady()
  },
  (error: unknown) => {
    if (active) onError(error instanceof Error ? error.message : 'โหลด Mona ไม่สำเร็จ')
  },
)
```

- [ ] **Step 6: Run focused and full automated checks**

Run:

```powershell
npm test -- src/experience/runtime/vrmaLoader.test.ts src/experience/runtime/BlinkController.test.ts src/experience/runtime/MonaController.test.ts src/experience/runtime/ExperienceRuntime.test.ts src/experience/ExperienceCanvas.test.tsx
npm test
npm run lint
npm run build
```

Expected: focused tests, full Vitest suite, lint, and build all pass.

- [ ] **Step 7: Commit runtime orchestration without the binary**

Run:

```powershell
git add -- src/experience/runtime/ExperienceRuntime.ts src/experience/runtime/ExperienceRuntime.test.ts src/experience/ExperienceCanvas.tsx src/experience/ExperienceCanvas.test.tsx
git diff --cached --name-only
git commit -m "feat: integrate Mona idle animation locally"
```

Expected staged names are only the four TypeScript files; `idle.vrma` is absent.

---

### Task 7: Verify the Real Animation in the Existing Experience

**Files:**
- Modify: `design-qa.md`
- Read locally: `public/models/mona/animations/idle.vrma`
- Do not commit: any `.vrm`, `.vrma`, `.blend`, or `.blend1` file.

**Interfaces:**
- Consumes: the complete local animation pipeline and the existing in-app browser experience.
- Produces: visual acceptance evidence, QA notes, and a verified code-only branch.

- [ ] **Step 1: Start the verified local preview**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the resulting local URL in the user's already selected in-app browser. Load `browser:control-in-app-browser` before interacting with the page.

- [ ] **Step 2: Confirm loading and fallback boundaries**

With `idle.vrma` present:

- the full-screen loader remains until both Mona and the idle are ready;
- the Start rail appears normally;
- no VRMA loader warning appears;
- one canvas persists.

Temporarily rename only the ignored runtime copy to `idle.vrma.disabled`, reload, and confirm the procedural fallback reaches ready state with the expected warning. Restore the exact filename immediately afterward.

- [ ] **Step 3: Review at least five idle cycles before and after entry**

At the distant back-facing ready composition and the front-facing entered composition, observe at least 25 seconds each. Confirm:

- the loop seam is not visible;
- feet and world position do not drift;
- the left hand remains above the right;
- hand meshes do not penetrate;
- breathing and weight transfer stay restrained;
- hair and clothing spring bones remain natural;
- blinks occur independently rather than once every body loop;
- the left-side content remains the visual priority.

- [ ] **Step 4: Review the current mobile composition**

Use the existing mobile viewport used by the Phase 2 QA. Confirm:

- head and feet remain uncropped;
- body motion does not create content overlap;
- hands remain readable;
- no horizontal overflow appears;
- reduced-motion entry remains usable while the settled idle still behaves safely.

- [ ] **Step 5: Tune only the source of the failing behavior**

- If body pose, seam, feet, hands, or weight transfer fail, return to `Mona-idle-v1.blend`, correct the curves, re-export, validate, and copy the new local VRMA.
- If retargeting, loading, mixing, blinking, progress, or disposal fail, correct the focused TypeScript unit and its test.
- Do not compensate for a bad Blender pose by adding avatar-specific bone offsets in the loader.
- Do not compensate for a runtime bug by manually editing the exported binary.

Repeat Steps 2–4 after every correction.

- [ ] **Step 6: Record final QA without protected screenshots or binaries**

Append a `Mona Calm Idle VRMA` section to `design-qa.md` containing:

```markdown
## Mona Calm Idle VRMA

- Blender: 4.1 with the installed VRM Add-on VRMA exporter.
- Clip: `Mona_Idle_Calm`, 5.0 seconds, 30 fps authoring timeline.
- Pose: left hand over right at the lower abdomen, fingers not interlaced.
- Structure: humanoid animation only; no embedded mesh, texture, expression, or LookAt data.
- Browser: verified in distant ready, entered desktop, mobile, and reduced-motion states.
- Runtime: real idle loops through `AnimationMixer`; randomized blink remains independent; procedural body motion remains the missing-asset fallback.
- Safety: source VRM, Blender file, and VRMA remain local and were not staged or pushed.
```

- [ ] **Step 7: Run final verification**

Run:

```powershell
npm test
npm run lint
npm run build
npm run test:e2e -- --workers=1
git diff --check
git status --short
git diff --cached --name-only
```

Expected:

- all unit/component tests pass;
- lint passes;
- production build passes;
- existing sequential Playwright suite passes;
- no whitespace errors;
- no protected binary is staged;
- the ignored local VRMA may exist on disk but does not appear in Git status.

- [ ] **Step 8: Commit the QA record**

Run:

```powershell
git add -- design-qa.md
git commit -m "docs: verify Mona calm idle animation"
git status --short --branch
```

Expected: the branch is clean except for ignored local authoring assets and remains unpushed.

---

## Execution Checkpoints

1. Stop after Task 1 if Blender or the add-on lacks working VRMA operators.
2. Stop after Task 2 for visual review if the folded-hand pose cannot be made stable without rig or mesh changes.
3. Stop after Task 2 if structural validation finds expression, LookAt, mesh, texture, or invalid non-hips translation data.
4. Review in the browser after Task 6 before treating the Blender loop as accepted.
5. Keep the procedural body fallback until all Task 7 checks pass.
6. Never push the branch while the Mona redistribution gate remains unresolved.

## References

- Official VRM Add-on export flow: `File` → `Export` → `VRM Animation (.vrma)`, exporting humanoid bone rotation, hips translation, expression preview, and LookAt target values: https://vrm-addon-for-blender.info/en-us/ui/export_scene.vrma/
- Official three-vrm animation package exports `VRMAnimationLoaderPlugin` and `createVRMAnimationClip`: https://github.com/pixiv/three-vrm/tree/release/packages/three-vrm-animation
