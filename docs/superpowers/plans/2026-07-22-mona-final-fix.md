# Mona Final Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize Mona spring bones after the final pose, reduce non-entry route cost, refresh durable visual evidence, and leave the branch release-ready except for the immutable VRM redistribution gate.

**Architecture:** `MonaController` will own final-transform ordering through world-matrix refresh and spring reset. `ExperienceRuntime` will move from deprecated `THREE.Clock` to `THREE.Timer` while retaining hidden-tab render suppression. `App` will lazy-load the root experience so lesson routes do not eagerly evaluate Three.js/VRM code.

**Tech Stack:** React 19, React Router 8, Three.js 0.185, @pixiv/three-vrm 3.5, Vitest, Playwright, Vite 8.

## Global Constraints

- Work only on `feature/mona-experience-phase-1` in the provided repository path.
- Use failing regression tests before behavioral fixes.
- Do not push, merge, rewrite history, or edit Mona's embedded permissions/metadata.
- Use Chrome for interaction/console verification; Playwright Chromium is authorized only for exact screenshot capture/recapture.
- Preserve Phase 1 non-goals and existing user work.

---

### Task 1: Spring Reset and Disposal Ordering

**Files:**
- Modify: `src/experience/runtime/MonaController.test.ts`
- Modify: `src/experience/runtime/MonaController.ts`

**Interfaces:**
- Consumes: `VRM.springBoneManager?.reset()`, `Object3D.updateMatrixWorld(true)`.
- Produces: `MonaController.attachTo(scene)` with order pose → attach → world matrices → spring reset.

- [ ] **Step 1: Add failing order regressions**

Add a spring manager fake and assert the invocation order of humanoid update, scene attachment, world-matrix refresh, and spring reset. Extend disposal coverage to assert `removeFromParent()` occurs before `VRMUtils.deepDispose()`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/experience/runtime/MonaController.test.ts`

Expected: FAIL because `updateMatrixWorld(true)` and spring reset are absent and disposal order is not yet instrumented.

- [ ] **Step 3: Implement minimal ordering fix**

After the final pose and attachment, call:

```ts
this.vrm.scene.updateMatrixWorld(true)
this.vrm.springBoneManager?.reset()
```

- [ ] **Step 4: Verify GREEN and commit**

Run the focused test and commit only controller/test paths.

---

### Task 2: Timer Migration

**Files:**
- Modify: `src/experience/runtime/ExperienceRuntime.test.ts`
- Modify: `src/experience/runtime/ExperienceRuntime.ts`

**Interfaces:**
- Consumes: `THREE.Timer.update(timestamp)`, `getDelta()`, `connect(document)`, `dispose()`.
- Produces: timestamp-driven frame deltas without `THREE.Clock` warnings.

- [ ] **Step 1: Add failing timing-order test**

Spy on `THREE.Timer.prototype.update` and `getDelta`, invoke the private frame callback through a narrow test cast, and assert update precedes delta read.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/experience/runtime/ExperienceRuntime.test.ts`

Expected: FAIL because the runtime still instantiates `THREE.Clock` and the tick callback accepts no timestamp.

- [ ] **Step 3: Implement minimal Timer lifecycle**

Instantiate `THREE.Timer`, connect it during mount, call `update(timestamp)` before `getDelta()`, and dispose it with the runtime.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused runtime tests and commit runtime/test paths.

---

### Task 3: Root Experience Route Split

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: React `lazy` and existing `RouteLoader` Suspense fallback.
- Produces: a separate root experience chunk that `/lessons` does not eagerly import.

- [ ] **Step 1: Record RED build evidence**

Run: `npm run build`

Expected: the current entry chunk is approximately 1,021 kB because `ExperiencePage` is statically imported.

- [ ] **Step 2: Implement the route split**

Replace the static import with:

```ts
const ExperiencePage = lazy(() =>
  import('../pages/ExperiencePage').then((module) => ({ default: module.ExperiencePage })),
)
```

Wrap the index element in the existing Suspense fallback and update the stale Vite comment.

- [ ] **Step 3: Verify build chunks and commit**

Run build and confirm the entry shrinks while a separate experience chunk owns Three.js/VRM code. Commit only `App.tsx` and `vite.config.ts`.

---

### Task 4: Visual QA and Final Gates

**Files:**
- Modify: `docs/superpowers/qa/mona-experience-phase-1-ready.png`
- Modify: `docs/superpowers/qa/mona-experience-phase-1-mobile.png`
- Create: `docs/superpowers/qa/mona-experience-phase-1-comparison-final.png`
- Create: `docs/superpowers/qa/mona-experience-phase-1-comparison-focus.png`
- Modify: `design-qa.md`
- Create: `.superpowers/sdd/final-fix-report.md`

**Interfaces:**
- Consumes: fixed ready state and source concept.
- Produces: durable exact evidence, passing design QA, validation report, and unresolved release-gate record.

- [ ] **Step 1: Verify Chrome behavior and console**

Check root ready/entry, one canvas, focus, `/lessons`, and local console errors.

- [ ] **Step 2: Capture exact evidence**

Use the authorized Playwright Chromium fallback only for `1440 x 1024` and `390 x 844` ready screenshots if Chrome still cannot capture exact evidence.

- [ ] **Step 3: Build combined boards and compare**

Persist full and focused comparison boards under `docs/superpowers/qa`, open the combined inputs, and fix any P0/P1/P2 drift before proceeding.

- [ ] **Step 4: Run final validation**

Run `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, `git diff --check`, exact image-dimension checks, and clean-status review.

- [ ] **Step 5: Commit reports and evidence**

Commit durable QA evidence and report updates without staging unrelated paths. Record `allowRedistribution=false` as an unresolved release gate and do not mutate the VRM.

## Self-Review

- [x] Spring transform/attach/world/reset ordering is covered test-first.
- [x] Disposal ordering is explicitly asserted.
- [x] Timer migration has integration-level timing-order coverage.
- [x] Route split is verified from production chunk output.
- [x] Chrome and authorized screenshot responsibilities remain separated.
- [x] Final/focused boards are persisted in tracked QA paths.
- [x] Immutable redistribution constraints are reported, not changed.
