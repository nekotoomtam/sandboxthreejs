# Mona Cinematic Entry Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved loading-to-Start-to-camera-approach experience with a synchronized procedural Mona turn, while preserving one canvas and leaving the real VRMA authoring pass for a separately calibrated Blender plan.

**Architecture:** React owns an explicit six-phase reducer and semantic overlay transitions; one persistent `ExperienceRuntime` owns readiness, the 3.2-second timeline, camera interpolation, Mona root heading, resize-safe compositions, visibility pause, and completion callbacks. Pure timeline/composition modules make motion deterministic and testable before browser calibration.

**Tech Stack:** React 19, TypeScript 6, Three.js 0.185, `@pixiv/three-vrm` 3.5.5, CSS, Vitest 4, Testing Library, Playwright 1.61.

## Global Constraints

- Approved design: `docs/superpowers/specs/2026-07-22-mona-cinematic-entry-phase-2-design.md`.
- Initial entry duration is exactly `3_200` ms and remains a calibration constant.
- Loader contraction initially uses `800` ms.
- Mona starts full-body, distant, back-facing, from a low camera angle; she finishes full-body in the right 30–40 percent region.
- The camera approaches on a straight interpolated path and rises toward the final mid-body framing; it does not orbit.
- The left headline is absent until runtime motion completes.
- The right rail is one full-area semantic `<button>`; below `768px` it becomes a bottom band at least `44px` high.
- `prefers-reduced-motion` applies the final camera and Mona state in a brief transition.
- Keep one canvas through loading, revealing, ready, approaching, content reveal, and entered.
- Keep `/lessons`, `/concepts`, and `/playground` route-split and directly reachable.
- Do not add GSAP, OrbitControls, audio, lip sync, AI chat, or new environment assets.
- Use procedural idle/turn mechanics in this foundation. Real `idle.vrma` and `turn.vrma` authoring is a separate follow-up plan after browser timing is visually calibrated.
- Do not overwrite `C:\Users\nekot\Desktop\Mona.vrm`.
- Do not push, publish, or merge the Mona binary while redistribution remains prohibited.
- Implement in the current feature branch without subagent delegation, following the user's explicit preference.
- Every behavior change follows red-green-refactor and ends in a focused commit.

## File Map

- `src/experience/experienceMachine.ts`: six-phase experience reducer and guarded events.
- `src/experience/experienceMachine.test.ts`: reducer transitions and duplicate-event protection.
- `src/experience/runtime/entryTimeline.ts`: pure normalized 3.2-second entry sampling and easing.
- `src/experience/runtime/entryTimeline.test.ts`: boundary, pause-independent, and reduced-motion samples.
- `src/experience/runtime/experienceComposition.ts`: desktop/mobile semantic camera endpoints.
- `src/experience/runtime/experienceComposition.test.ts`: endpoint and responsive composition contracts.
- `src/experience/runtime/CameraController.ts`: applies sampled positions and look targets to a Three.js camera.
- `src/experience/runtime/CameraController.test.ts`: exact camera endpoint application.
- `src/experience/runtime/MonaController.ts`: ready placement, root heading, procedural body mechanics, update order, and disposal.
- `src/experience/runtime/MonaController.test.ts`: back-facing setup, turn sampling, idle update, spring order, disposal.
- `src/experience/runtime/ExperienceRuntime.ts`: first-valid-frame readiness, entry lifecycle, visibility pause, resize resampling, and rendering.
- `src/experience/runtime/ExperienceRuntime.test.ts`: timeline start/completion, one-shot guard, hidden-tab behavior, late callback safety.
- `src/experience/ExperienceCanvas.tsx`: stable React adapter exposing `entryActive` and runtime completion.
- `src/experience/ExperienceCanvas.test.tsx`: one runtime, one play request, retry replacement, cleanup.
- `src/experience/ExperienceOverlay.tsx`: opaque loader, shape group, Start rail, content, error, and semantic transition callbacks.
- `src/experience/ExperienceShell.tsx`: reducer coordinator without entry completion timers.
- `src/experience/ExperienceShell.test.tsx`: end-to-end component state flow and accessible controls.
- `src/styles/index.css`: loading geometry, rail contraction, entered composition, mobile band, focus, and reduced motion.
- `tests/e2e/mona-experience.spec.ts`: real browser loader, rail, persistent canvas, entry, content, reduced-motion flow.
- `design-qa.md`: append Phase 2 visual evidence and calibrated values.
- `docs/superpowers/qa/mona-phase-2-*.png`: loading, ready, mid-entry, entered, and mobile evidence.

---

### Task 1: Expand the Experience State Machine

**Files:**
- Modify: `src/experience/experienceMachine.ts`
- Modify: `src/experience/experienceMachine.test.ts`

**Interfaces:**
- Produces: `ExperiencePhase = 'loading' | 'revealing' | 'ready' | 'approaching' | 'revealing-content' | 'entered' | 'error'`.
- Produces events: `SCENE_READY`, `LOADER_REVEAL_FINISHED`, `START_REQUESTED`, `ENTRY_MOTION_FINISHED`, `CONTENT_REVEAL_FINISHED`.
- Consumed by: `ExperienceShell` and `ExperienceOverlay` in Task 6.

- [ ] **Step 1: Replace the old happy-path test with the approved guarded phase sequence**

```ts
it('moves through reveal, approach, and content only on matching completion events', () => {
  const revealing = reduceExperience(INITIAL_EXPERIENCE_STATE, { type: 'SCENE_READY' })
  const ready = reduceExperience(revealing, { type: 'LOADER_REVEAL_FINISHED' })
  const approaching = reduceExperience(ready, { type: 'START_REQUESTED' })
  const content = reduceExperience(approaching, { type: 'ENTRY_MOTION_FINISHED' })
  const entered = reduceExperience(content, { type: 'CONTENT_REVEAL_FINISHED' })

  expect(revealing.phase).toBe('revealing')
  expect(ready.phase).toBe('ready')
  expect(approaching.phase).toBe('approaching')
  expect(reduceExperience(approaching, { type: 'START_REQUESTED' })).toBe(approaching)
  expect(content.phase).toBe('revealing-content')
  expect(entered.phase).toBe('entered')
})
```

- [ ] **Step 2: Run the focused reducer test and verify RED**

Run: `npm test -- src/experience/experienceMachine.test.ts`

Expected: FAIL because `SCENE_READY` and the expanded phases are not defined.

- [ ] **Step 3: Implement the expanded phase and event unions and guarded cases**

```ts
export type ExperiencePhase =
  | 'loading'
  | 'revealing'
  | 'ready'
  | 'approaching'
  | 'revealing-content'
  | 'entered'
  | 'error'

export type ExperienceEvent =
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'SCENE_READY' }
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'LOADER_REVEAL_FINISHED' }
  | { type: 'START_REQUESTED' }
  | { type: 'ENTRY_MOTION_FINISHED' }
  | { type: 'CONTENT_REVEAL_FINISHED' }
  | { type: 'RETRY_REQUESTED' }
```

Map events only from their valid source phase: `loading→revealing→ready→approaching→revealing-content→entered`. Preserve the existing progress clamp, error, and fresh-attempt behavior.

- [ ] **Step 4: Run the focused reducer test and verify GREEN**

Run: `npm test -- src/experience/experienceMachine.test.ts`

Expected: all reducer tests PASS.

- [ ] **Step 5: Commit the reducer slice**

```powershell
git add -- src/experience/experienceMachine.ts src/experience/experienceMachine.test.ts
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: expand Mona cinematic experience states"
```

---

### Task 2: Deterministic Entry Timeline

**Files:**
- Create: `src/experience/runtime/entryTimeline.ts`
- Create: `src/experience/runtime/entryTimeline.test.ts`

**Interfaces:**
- Produces: `ENTRY_DURATION_MS`, `EntryTimelineSample`, `sampleEntryTimeline(elapsedMs, reducedMotion)`.
- `EntryTimelineSample` fields: `progress`, `cameraProgress`, `turnProgress`, `railOpacity`, `complete`.
- Consumed by: `ExperienceRuntime` in Task 5.

- [ ] **Step 1: Write boundary tests for the approved 3.2-second choreography**

```ts
import { describe, expect, it } from 'vitest'
import { ENTRY_DURATION_MS, sampleEntryTimeline } from './entryTimeline'

describe('sampleEntryTimeline', () => {
  it('honors camera, turn, settle, and completion boundaries', () => {
    expect(ENTRY_DURATION_MS).toBe(3_200)
    expect(sampleEntryTimeline(0, false)).toMatchObject({
      progress: 0,
      cameraProgress: 0,
      turnProgress: 0,
      railOpacity: 1,
      complete: false,
    })
    expect(sampleEntryTimeline(150, false).cameraProgress).toBe(0)
    expect(sampleEntryTimeline(450, false).turnProgress).toBe(0)
    expect(sampleEntryTimeline(2_850, false).turnProgress).toBe(1)
    expect(sampleEntryTimeline(3_200, false)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      railOpacity: 0,
      complete: true,
    })
  })

  it('jumps to the stable final sample for reduced motion', () => {
    expect(sampleEntryTimeline(0, true)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      railOpacity: 0,
      complete: true,
    })
  })
})
```

- [ ] **Step 2: Run the timeline test and verify RED**

Run: `npm test -- src/experience/runtime/entryTimeline.test.ts`

Expected: FAIL because `entryTimeline.ts` does not exist.

- [ ] **Step 3: Implement clamped ranges and smoothstep easing**

```ts
export const ENTRY_DURATION_MS = 3_200

export type EntryTimelineSample = {
  progress: number
  cameraProgress: number
  turnProgress: number
  railOpacity: number
  complete: boolean
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)
const smoothstep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}
const range = (elapsedMs: number, startMs: number, endMs: number) =>
  smoothstep((elapsedMs - startMs) / (endMs - startMs))

export function sampleEntryTimeline(
  elapsedMs: number,
  reducedMotion: boolean,
): EntryTimelineSample {
  if (reducedMotion) {
    return { progress: 1, cameraProgress: 1, turnProgress: 1, railOpacity: 0, complete: true }
  }
  const progress = clamp01(elapsedMs / ENTRY_DURATION_MS)
  return {
    progress,
    cameraProgress: range(elapsedMs, 150, ENTRY_DURATION_MS),
    turnProgress: range(elapsedMs, 450, 2_850),
    railOpacity: 1 - range(elapsedMs, 0, 250),
    complete: elapsedMs >= ENTRY_DURATION_MS,
  }
}
```

- [ ] **Step 4: Run the timeline test and verify GREEN**

Run: `npm test -- src/experience/runtime/entryTimeline.test.ts`

Expected: timeline tests PASS.

- [ ] **Step 5: Commit the pure timeline**

```powershell
git add -- src/experience/runtime/entryTimeline.ts src/experience/runtime/entryTimeline.test.ts
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: define Mona entry timeline"
```

---

### Task 3: Semantic Camera Compositions

**Files:**
- Create: `src/experience/runtime/experienceComposition.ts`
- Create: `src/experience/runtime/experienceComposition.test.ts`
- Create: `src/experience/runtime/CameraController.ts`
- Create: `src/experience/runtime/CameraController.test.ts`

**Interfaces:**
- Produces: `Vec3Tuple`, `ExperienceComposition`, `resolveEntryComposition(width, height)`.
- Produces: `CameraController.apply(composition, progress)`.
- Consumed by: `ExperienceRuntime` in Task 5.

- [ ] **Step 1: Write responsive endpoint and interpolation tests**

```ts
it('keeps desktop Mona right-weighted and defines a low opening camera', () => {
  const result = resolveEntryComposition(1440, 1024)
  expect(result.breakpoint).toBe('desktop')
  expect(result.ready.cameraPosition[1]).toBeLessThan(result.entered.cameraPosition[1])
  expect(result.ready.cameraTarget[0]).toBeGreaterThan(result.entered.cameraTarget[0])
  expect(result.monaPosition[0]).toBeGreaterThan(0)
})

it('uses the narrow composition below 768px', () => {
  expect(resolveEntryComposition(767, 844).breakpoint).toBe('narrow')
  expect(resolveEntryComposition(768, 844).breakpoint).toBe('desktop')
})
```

```ts
it('applies exact endpoints and interpolates without allocation-visible drift', () => {
  const camera = new THREE.PerspectiveCamera()
  const controller = new CameraController(camera)
  const composition = resolveEntryComposition(1440, 1024)
  controller.apply(composition, 0)
  expect(camera.position.toArray()).toEqual([...composition.ready.cameraPosition])
  controller.apply(composition, 1)
  expect(camera.position.toArray()).toEqual([...composition.entered.cameraPosition])
})
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/experience/runtime/experienceComposition.test.ts src/experience/runtime/CameraController.test.ts`

Expected: FAIL because both modules are absent.

- [ ] **Step 3: Implement semantic endpoints and the camera applier**

```ts
export type Vec3Tuple = readonly [number, number, number]
export type CameraPose = { cameraPosition: Vec3Tuple; cameraTarget: Vec3Tuple }
export type ExperienceComposition = {
  breakpoint: 'desktop' | 'narrow'
  ready: CameraPose
  entered: CameraPose
  monaPosition: Vec3Tuple
}

export function resolveEntryComposition(width: number, _height: number): ExperienceComposition {
  if (width < 768) {
    return {
      breakpoint: 'narrow',
      ready: { cameraPosition: [0.1, 0.2, 1.2], cameraTarget: [1.45, 1.5, -4] },
      entered: { cameraPosition: [0.2, 0.95, -0.15], cameraTarget: [1.05, 1.05, -4] },
      monaPosition: [1.55, 0, -4],
    }
  }
  return {
    breakpoint: 'desktop',
    ready: { cameraPosition: [0, 0.18, 1.15], cameraTarget: [1.8, 1.55, -4] },
    entered: { cameraPosition: [0.15, 0.98, -0.2], cameraTarget: [0.85, 1.04, -4] },
    monaPosition: [1.8, 0, -4],
  }
}
```

`CameraController` owns reusable `THREE.Vector3` target storage. `apply()` lerps each camera coordinate and target coordinate with `THREE.MathUtils.lerp`, then calls `camera.lookAt()` and `camera.updateMatrixWorld()`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- src/experience/runtime/experienceComposition.test.ts src/experience/runtime/CameraController.test.ts`

Expected: both test files PASS.

- [ ] **Step 5: Commit the camera slice**

```powershell
git add -- src/experience/runtime/experienceComposition.ts src/experience/runtime/experienceComposition.test.ts src/experience/runtime/CameraController.ts src/experience/runtime/CameraController.test.ts
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: add responsive Mona camera compositions"
```

---

### Task 4: Mona Back-Facing Pose and Procedural Motion

**Files:**
- Modify: `src/experience/runtime/MonaController.ts`
- Modify: `src/experience/runtime/MonaController.test.ts`

**Interfaces:**
- Produces: `setCompositionPosition(position)`, `applyEntrySample(sample)`, `update(delta)`, `dispose()`.
- Root heading: ready `Math.PI`, entered `0`.
- Consumed by: `ExperienceRuntime` in Task 5.

- [ ] **Step 1: Add failing back-facing, turn, and frame-order tests**

```ts
it('starts back-facing and reaches the front heading at turn completion', () => {
  const controller = new MonaController(vrm)
  controller.applyInitialPose()
  expect(vrm.scene.rotation.y).toBeCloseTo(Math.PI)
  controller.applyEntrySample({ turnProgress: 0.5 })
  expect(vrm.scene.rotation.y).toBeCloseTo(Math.PI / 2)
  controller.applyEntrySample({ turnProgress: 1 })
  expect(vrm.scene.rotation.y).toBeCloseTo(0)
})

it('updates procedural pose before humanoid, VRM, and spring-visible render state', () => {
  const controller = new MonaController(vrm)
  controller.update(0.016)
  expect(humanoidUpdate).toHaveBeenCalledBefore(vrmUpdate)
})
```

Use the existing fake humanoid bones and add `hips`, `spine`, `chest`, `leftFoot`, and `rightFoot` objects. Retain attach/reset and disposal assertions.

- [ ] **Step 2: Run the focused controller test and verify RED**

Run: `npm test -- src/experience/runtime/MonaController.test.ts`

Expected: FAIL because the current controller starts at `-55°` and has no entry sampler.

- [ ] **Step 3: Implement the root turn and restrained procedural mechanics**

```ts
private elapsedSeconds = 0
private turnProgress = 0

applyEntrySample(sample: { turnProgress: number }) {
  this.turnProgress = THREE.MathUtils.clamp(sample.turnProgress, 0, 1)
  this.vrm.scene.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, this.turnProgress)
}

update(delta: number) {
  this.elapsedSeconds += delta
  const idleWeight = 1 - Math.sin(this.turnProgress * Math.PI)
  const breath = Math.sin(this.elapsedSeconds * 1.4) * THREE.MathUtils.degToRad(0.7) * idleWeight
  const weightShift = Math.sin(this.turnProgress * Math.PI) * THREE.MathUtils.degToRad(3)
  this.setNormalizedBoneRotation('chest', 'x', breath)
  this.setNormalizedBoneRotation('hips', 'z', weightShift)
  this.vrm.humanoid.update()
  this.vrm.update(delta)
}
```

Keep the arm-lowering pose, attach → world-matrix update → spring reset order, and deep disposal. Add a private normalized-bone setter rather than duplicating lookup code.

- [ ] **Step 4: Run the controller test and verify GREEN**

Run: `npm test -- src/experience/runtime/MonaController.test.ts`

Expected: all Mona controller tests PASS.

- [ ] **Step 5: Commit the Mona motion slice**

```powershell
git add -- src/experience/runtime/MonaController.ts src/experience/runtime/MonaController.test.ts
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: stage Mona for cinematic entry"
```

---

### Task 5: Runtime Readiness and Entry Lifecycle

**Files:**
- Modify: `src/experience/runtime/ExperienceRuntime.ts`
- Modify: `src/experience/runtime/ExperienceRuntime.test.ts`

**Interfaces:**
- Consumes: `sampleEntryTimeline`, `resolveEntryComposition`, `CameraController`, `MonaController`.
- Produces: `playEntry(onComplete, reducedMotion): void`.
- `load()` resolves only after Mona is attached, transformed, springs reset, and one explicit valid frame renders.
- Consumed by: `ExperienceCanvas` in Task 6.

- [ ] **Step 1: Add failing lifecycle tests**

```ts
it('starts entry once and reports completion from runtime motion', () => {
  const finished = vi.fn()
  runtime.playEntry(finished, false)
  runtime.playEntry(finished, false)
  tickAt(0)
  tickAt(3_200)
  expect(controller.applyEntrySample).toHaveBeenCalled()
  expect(finished).toHaveBeenCalledOnce()
})

it('does not advance elapsed entry time while the document is hidden', () => {
  runtime.playEntry(vi.fn(), false)
  tickAt(0)
  setDocumentHidden(true)
  tickAt(2_000)
  setDocumentHidden(false)
  tickAt(2_016)
  expect(lastEntrySample.progress).toBeLessThan(0.1)
})

it('does not invoke a late completion callback after disposal', () => {
  const finished = vi.fn()
  runtime.playEntry(finished, false)
  runtime.dispose()
  tickAt(3_200)
  expect(finished).not.toHaveBeenCalled()
})
```

Expand the mocked `MonaController` with `setCompositionPosition`, `applyEntrySample`, and `update`. Stub the renderer and animation frame as existing runtime tests require.

- [ ] **Step 2: Run the runtime test and verify RED**

Run: `npm test -- src/experience/runtime/ExperienceRuntime.test.ts`

Expected: FAIL because `playEntry` and timeline coordination are absent.

- [ ] **Step 3: Implement entry state without wall-clock timeouts**

Add runtime fields:

```ts
private readonly cameraController = new CameraController(this.camera)
private entryElapsedMs = 0
private entryActive = false
private entryComplete = false
private entryReducedMotion = false
private onEntryComplete?: () => void
private composition = resolveEntryComposition(1, 1)
```

`playEntry()` returns early if active or complete. On each visible frame, add `delta * 1000`, sample the timeline, apply camera first, Mona root second, then `mona.update(delta)`, then render. When complete, clear the callback before invoking it exactly once. On resize, resolve new semantic endpoints and immediately reapply the current normalized entry sample rather than restarting. Remove the Phase 1 marker and its visibility helper.

At the end of `load()`, attach Mona, set its semantic position, apply the ready sample, reset world state through the controller, render once synchronously, call `onProgress(1)`, then resolve. If disposed at any point, dispose the late controller and do not mutate readiness.

- [ ] **Step 4: Run runtime and helper tests and verify GREEN**

Run: `npm test -- src/experience/runtime/ExperienceRuntime.test.ts src/experience/runtime/experienceRuntime.helpers.test.ts`

Expected: PASS; obsolete marker tests are removed with the marker implementation.

- [ ] **Step 5: Commit the runtime slice**

```powershell
git add -- src/experience/runtime/ExperienceRuntime.ts src/experience/runtime/ExperienceRuntime.test.ts src/experience/runtime/experienceRuntime.helpers.ts src/experience/runtime/experienceRuntime.helpers.test.ts
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: run synchronized Mona camera entry"
```

---

### Task 6: React Adapter, Loader, Start Rail, and Content Reveal

**Files:**
- Modify: `src/experience/ExperienceCanvas.tsx`
- Modify: `src/experience/ExperienceCanvas.test.tsx`
- Modify: `src/experience/ExperienceOverlay.tsx`
- Modify: `src/experience/ExperienceShell.tsx`
- Modify: `src/experience/ExperienceShell.test.tsx`
- Modify: `src/styles/index.css`

**Interfaces:**
- `ExperienceCanvasProps` replaces `entered` with `entryActive` and adds `onEntryComplete`.
- `ExperienceOverlay` adds `onRevealFinished` and `onContentRevealFinished`.
- CSS phase selectors consume `data-experience-phase` without JavaScript layout timers.

- [ ] **Step 1: Write failing component tests for the full semantic flow**

```tsx
it('contracts the opaque loader into one full-area Start button before runtime entry', () => {
  render(<ExperienceShell CanvasComponent={ManualCanvas} />)
  act(() => latestCanvasProps?.onReady())
  expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'revealing')
  expect(screen.queryByRole('button', { name: /เริ่ม/ })).not.toBeInTheDocument()
  fireEvent.transitionEnd(screen.getByTestId('loader-surface'))
  const rail = screen.getByRole('button', { name: /เริ่ม/ })
  expect(rail).toHaveClass('experience-start-rail')
  fireEvent.click(rail)
  expect(latestCanvasProps?.entryActive).toBe(true)
})

it('reveals the left headline only after runtime completion', () => {
  reachApproaching()
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  act(() => latestCanvasProps?.onEntryComplete())
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('เรียนรู้ Three.js')
  fireEvent.animationEnd(screen.getByTestId('experience-content'))
  expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered')
})
```

Update `ExperienceCanvas.test.tsx` so one `false→true` prop change calls `runtime.playEntry(onEntryComplete, reducedMotion)` once and does not remount the runtime.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm test -- src/experience/ExperienceShell.test.tsx src/experience/ExperienceCanvas.test.tsx`

Expected: FAIL because the current UI jumps directly to ready and finishes entry through a timeout.

- [ ] **Step 3: Wire runtime-driven completion in `ExperienceCanvas` and `ExperienceShell`**

```tsx
export type ExperienceCanvasProps = {
  attempt: number
  entryActive: boolean
  onProgress: (progress: number) => void
  onReady: () => void
  onEntryComplete: () => void
  onError: (message: string) => void
}
```

Use a callback ref for `onEntryComplete`. When `entryActive` becomes true, call:

```ts
runtimeRef.current?.playEntry(
  () => onEntryCompleteRef.current(),
  window.matchMedia('(prefers-reduced-motion: reduce)').matches,
)
```

Remove `entryDurationMs` and the `setTimeout` effect from `ExperienceShell`. Dispatch `SCENE_READY`, `LOADER_REVEAL_FINISHED`, `ENTRY_MOTION_FINISHED`, and `CONTENT_REVEAL_FINISHED` only from their corresponding callbacks.

- [ ] **Step 4: Replace the overlay with semantic phase surfaces**

The loading surface contains exactly three decorative children (`circle`, `square`, `triangle`) inside an `aria-hidden="true"` shape group, a Thai loading heading, a native `<progress>`, and numeric progress. The `revealing` phase keeps the same `data-testid="loader-surface"` element mounted so its width transition can finish. The `ready` phase renders:

```tsx
<button
  className="experience-start-rail"
  type="button"
  onClick={onStart}
  aria-label="เริ่มประสบการณ์กับ Mona"
>
  <span>ฉากพร้อมแล้ว</span>
  <strong>เริ่ม</strong>
</button>
```

The `revealing-content` and `entered` phases render `data-testid="experience-content"` with the three approved mock lines. Ignore bubbled transition/animation events whose `target !== currentTarget` so child animations cannot advance the machine early.

- [ ] **Step 5: Implement phase styling and responsive/reduced-motion rules**

Replace the Phase 1 `.experience-*` block with focused styles that satisfy:

```css
.experience-loader-surface {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: auto;
  background: #123d34;
  transition: width 800ms cubic-bezier(.77, 0, .18, 1);
}

.experience-overlay--revealing .experience-loader-surface {
  right: 0;
  left: auto;
  width: clamp(18rem, 23vw, 26rem);
  background: linear-gradient(90deg, rgba(8, 35, 30, .98), rgba(18, 61, 52, .42));
}

.experience-start-rail {
  position: absolute;
  inset: 0 0 0 auto;
  width: clamp(18rem, 23vw, 26rem);
  min-height: 100%;
}

@media (max-width: 767px) {
  .experience-overlay--revealing .experience-loader-surface,
  .experience-start-rail {
    inset: auto 0 0;
    width: 100%;
    min-height: 7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .experience-loader-surface { transition-duration: 80ms; }
  .experience-loader-shapes { animation: none; }
}
```

Add hover/focus-visible/active rail states, an opaque error state, CSS-only shape motion, left content stagger, full-body breathing room, no horizontal overflow, and a 44px minimum interactive size.

- [ ] **Step 6: Run component tests, lint, and build**

Run:

```powershell
npm test -- src/experience/ExperienceShell.test.tsx src/experience/ExperienceCanvas.test.tsx
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 7: Commit the React and CSS slice**

```powershell
git add -- src/experience/ExperienceCanvas.tsx src/experience/ExperienceCanvas.test.tsx src/experience/ExperienceOverlay.tsx src/experience/ExperienceShell.tsx src/experience/ExperienceShell.test.tsx src/styles/index.css
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "feat: add cinematic Mona loading and Start rail"
```

---

### Task 7: Browser Flow, Calibration, and Visual QA

**Files:**
- Modify: `tests/e2e/mona-experience.spec.ts`
- Modify: `design-qa.md`
- Create: `docs/superpowers/qa/mona-phase-2-loading.png`
- Create: `docs/superpowers/qa/mona-phase-2-ready.png`
- Create: `docs/superpowers/qa/mona-phase-2-mid-entry.png`
- Create: `docs/superpowers/qa/mona-phase-2-entered.png`
- Create: `docs/superpowers/qa/mona-phase-2-mobile.png`

**Interfaces:**
- Consumes: the complete foundation from Tasks 1–6.
- Produces: verified browser behavior, calibrated camera constants, and durable visual evidence.

- [ ] **Step 1: Extend the browser test before visual calibration**

```ts
test('reveals Mona through one persistent cinematic canvas', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('loader-surface')).toBeVisible()
  await expect(page.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
  const rail = page.getByRole('button', { name: 'เริ่มประสบการณ์กับ Mona' })
  await expect(rail).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)
  await rail.click()
  await expect(page.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered', {
    timeout: 8_000,
  })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('เรียนรู้ Three.js')
  await expect(page.locator('[data-experience-canvas="true"]')).toHaveCount(1)
})
```

Add a reduced-motion test using `page.emulateMedia({ reducedMotion: 'reduce' })` and a route test proving `/lessons`, `/concepts`, and `/playground` still open without the experience canvas.

- [ ] **Step 2: Run the focused browser test and fix behavior-only failures**

Run: `npx playwright test tests/e2e/mona-experience.spec.ts --workers=1`

Expected: PASS after only behavior fixes; do not tune camera values from test assertions.

- [ ] **Step 3: Capture the five approved states in the selected in-app browser**

At `1440×1024`, capture loading, ready, approximately `1.65s` into entry, and entered. At `390×844`, capture entered. Save exact screenshots to the paths above and record viewport, device scale, phase, elapsed entry time, and browser in `design-qa.md`.

- [ ] **Step 4: Compare the captures together and calibrate composition**

Review the five captures as one comparison input. Check loader opacity, rail contraction, hover/focus glow, ready silhouette height `28–34%`, entered silhouette height `58–68%`, Mona center `72–80%` viewport width, full head/feet, empty left ready space, post-motion headline timing, mobile non-overlap, and natural turn readability.

For every P0/P1/P2 finding, change only constants in `experienceComposition.ts`, `entryTimeline.ts`, or focused CSS; add a regression test when the issue is behavioral; rerun its focused test; recapture the same state and viewport.

- [ ] **Step 5: Run the complete local verification gate**

Run:

```powershell
npm test
npm run lint
npm run build
npx playwright test --workers=1
git diff --check
```

Expected: unit/component tests PASS, lint/build exit `0`, all sequential browser tests PASS, and no whitespace errors.

- [ ] **Step 6: Record the foundation boundary and commit QA**

Append Phase 2 findings and verification to `design-qa.md`. State explicitly that real `idle.vrma` and `turn.vrma` remain the next local Blender plan and that the current procedural motion is not the final animation acceptance gate.

```powershell
git add -- tests/e2e/mona-experience.spec.ts design-qa.md docs/superpowers/qa/mona-phase-2-loading.png docs/superpowers/qa/mona-phase-2-ready.png docs/superpowers/qa/mona-phase-2-mid-entry.png docs/superpowers/qa/mona-phase-2-entered.png docs/superpowers/qa/mona-phase-2-mobile.png
git diff --cached --check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git commit -m "test: verify Mona cinematic entry foundation"
```

Do not push the branch.

## Plan Self-Review Checklist

- [x] Loader, first-valid-frame readiness, rail contraction, semantic Start control, approach, turn, content reveal, error, retry, reduced motion, resize, hidden-tab pause, one-canvas lifecycle, and disposal each map to an implementation task.
- [x] Exact timing constants match the approved design: 800ms contraction and 3.2s entry with camera at 0.15s, turn at 0.45s, settle at 2.85s, completion at 3.20s.
- [x] Desktop and narrow-screen layouts have explicit acceptance checks.
- [x] Runtime completion replaces the Phase 1 React timeout.
- [x] Type and method names remain consistent across state, canvas, controller, runtime, and tests.
- [x] No animation framework, orbit controls, new environment asset, or public release enters scope.
- [x] Real VRMA creation is deliberately isolated as the next plan because it depends on visual calibration of this working foundation.
- [x] Every production-code task begins with an observed failing test and ends with a focused commit.
