# Three-Planet Learning MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one complete path from the existing Mona introduction through a three-planet course map and chapter overview into a practical code-and-preview lesson.

**Architecture:** Keep the existing Mona runtime independent from the course UI. Add route-driven planet and chapter views backed by a typed catalog, then adapt the existing CodeMirror + Web Worker sandbox into a code-left/result-right practical workspace. Reuse the current Three.js runtime and worker timeout instead of adding another execution system.

**Tech Stack:** React 19, React Router 8, TypeScript 6, Three.js 0.185, CodeMirror 6, Vitest, Testing Library, Playwright, Tailwind/CSS.

## Global Constraints

- Preserve the existing loading, Mona reveal, camera movement, and idle experience.
- Planet artwork remains DOM images; do not create Three.js planet meshes.
- Chapter planet shows approximately one-third of its upper-left region and rotates once every 90–120 seconds.
- Preview changes only on Run or `Ctrl/Cmd + Enter`.
- Failed runs keep the latest successful preview visible.
- Only one lesson renderer and one worker run may be active at a time.
- Reduced-motion mode disables continuous planet rotation.
- Mona remains local and must not be pushed or publicly deployed while redistribution is prohibited.
- Implement one complete lesson; mark the remaining curriculum as upcoming.

---

### Task 1: Typed world and chapter catalog

**Files:**
- Create: `src/worlds/world.types.ts`
- Create: `src/worlds/world.registry.ts`
- Create: `src/worlds/world.registry.test.ts`

**Interfaces:**
- Produces: `WorldId`, `WorldDefinition`, `worldCatalog`, `getWorldById(id)`.
- Consumes: existing lesson id `hello-threejs`.

- [ ] **Step 1: Write the failing registry test**

```ts
import { describe, expect, it } from 'vitest'
import { getWorldById, worldCatalog } from './world.registry'

describe('world registry', () => {
  it('keeps the three worlds in display order', () => {
    expect(worldCatalog.map((world) => world.id)).toEqual([
      'foundations',
      'controls',
      'integration',
    ])
  })

  it('links the available foundations lesson', () => {
    expect(getWorldById('foundations')?.lessons[0]).toMatchObject({
      lessonId: 'hello-threejs',
      status: 'available',
    })
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npm test -- src/worlds/world.registry.test.ts`

Expected: FAIL because `world.registry.ts` does not exist.

- [ ] **Step 3: Add the catalog types**

```ts
export type WorldId = 'foundations' | 'controls' | 'integration'

export type WorldLessonLink = {
  readonly id: string
  readonly lessonId?: string
  readonly title: string
  readonly summary: string
  readonly status: 'available' | 'coming-soon'
}

export type WorldDefinition = {
  readonly id: WorldId
  readonly order: number
  readonly title: string
  readonly eyebrow: string
  readonly description: string
  readonly imageSrc: string
  readonly accent: string
  readonly lessons: readonly WorldLessonLink[]
}
```

- [ ] **Step 4: Add three world definitions and lookup**

```ts
import type { WorldDefinition, WorldId } from './world.types'

export const worldCatalog: readonly WorldDefinition[] = [
  {
    id: 'foundations',
    order: 1,
    title: 'พื้นฐานของโลก Three.js',
    eyebrow: 'WORLD 01 · FOUNDATIONS',
    description: 'สร้างฉาก กล้อง แสง และวัตถุชิ้นแรกให้เข้าใจจากผลลัพธ์จริง',
    imageSrc: '/assets/planets/planet-01-foundations.png',
    accent: '#c9b29a',
    lessons: [
      {
        id: 'hello-threejs',
        lessonId: 'hello-threejs',
        title: 'Scene, Camera, Renderer',
        summary: 'ประกอบองค์ประกอบหลักและทดลองแก้โค้ดกับฉากจริง',
        status: 'available',
      },
    ],
  },
  {
    id: 'controls',
    order: 2,
    title: 'การควบคุมและการเคลื่อนที่',
    eyebrow: 'WORLD 02 · CONTROLS',
    description: 'เชื่อมคีย์บอร์ด เวลา และทิศทางให้วัตถุเคลื่อนอย่างควบคุมได้',
    imageSrc: '/assets/planets/planet-02-controls.png',
    accent: '#6ca6c8',
    lessons: [
      { id: 'keyboard-state', title: 'Keyboard State', summary: 'ติดตามปุ่มที่กำลังกด', status: 'coming-soon' },
      { id: 'delta-movement', title: 'Delta-time Movement', summary: 'เคลื่อนที่เท่ากันทุกเฟรมเรต', status: 'coming-soon' },
      { id: 'camera-modes', title: 'Camera Modes', summary: 'แยกมุมกล้องออกจากอินพุต', status: 'coming-soon' },
    ],
  },
  {
    id: 'integration',
    order: 3,
    title: 'โมเดล กล้อง และแอนิเมชัน',
    eyebrow: 'WORLD 03 · INTEGRATION',
    description: 'นำโมเดลจริงเข้าฉากและทำให้โมเดล กล้อง และแอนิเมชันทำงานร่วมกัน',
    imageSrc: '/assets/planets/planet-03-integration.png',
    accent: '#a792c8',
    lessons: [
      { id: 'model-loading', title: 'Loading GLTF / VRM', summary: 'โหลดโมเดลพร้อมสถานะและข้อผิดพลาด', status: 'coming-soon' },
      { id: 'animation-state', title: 'Animation State', summary: 'สลับ Idle และการเคลื่อนที่', status: 'coming-soon' },
      { id: 'follow-camera', title: 'Follow Camera', summary: 'ให้กล้องติดตามโมเดลอย่างนุ่มนวล', status: 'coming-soon' },
    ],
  },
]

export function getWorldById(id: string | undefined) {
  return worldCatalog.find((world) => world.id === (id as WorldId))
}
```

The controls and integration entries must each contain at least three named `coming-soon` lessons matching the approved design.

- [ ] **Step 5: Run the registry test**

Run: `npm test -- src/worlds/world.registry.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worlds
git commit -m "feat: add three-world course catalog"
```

---

### Task 2: Planet map and chapter overview routes

**Files:**
- Create: `src/components/worlds/PlanetVisual.tsx`
- Create: `src/pages/WorldMapPage.tsx`
- Create: `src/pages/ChapterPage.tsx`
- Create: `src/pages/WorldPages.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `worldCatalog`, `getWorldById`.
- Produces: routes `/worlds` and `/worlds/:worldId`.

- [ ] **Step 1: Write failing route/page tests**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ChapterPage } from './ChapterPage'
import { WorldMapPage } from './WorldMapPage'

it('shows all three chapter planets', () => {
  render(<MemoryRouter><WorldMapPage /></MemoryRouter>)
  expect(screen.getAllByRole('link', { name: /เปิดบท/ })).toHaveLength(3)
})

it('shows the foundations lesson and planet', () => {
  render(
    <MemoryRouter initialEntries={['/worlds/foundations']}>
      <Routes>
        <Route path="/worlds/:worldId" element={<ChapterPage />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('พื้นฐาน')
  expect(screen.getByRole('img', { name: /พื้นฐาน/ })).toBeVisible()
  expect(screen.getByRole('link', { name: /Scene, Camera, Renderer/ })).toHaveAttribute(
    'href',
    '/lessons/hello-threejs',
  )
})
```

- [ ] **Step 2: Run the tests and confirm missing component failures**

Run: `npm test -- src/pages/WorldPages.test.tsx`

Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Build the reusable planet visual**

```tsx
type PlanetVisualProps = {
  src: string
  alt: string
  variant: 'map' | 'chapter'
  className?: string
}

export function PlanetVisual({ src, alt, variant, className = '' }: PlanetVisualProps) {
  return (
    <div className={`planet-visual planet-visual--${variant} ${className}`}>
      <img src={src} alt={alt} draggable={false} />
    </div>
  )
}
```

- [ ] **Step 4: Build the map and chapter pages**

`WorldMapPage` maps `worldCatalog` to accessible chapter links at `/worlds/:id`.

`ChapterPage`:

```tsx
const { worldId } = useParams()
const world = getWorldById(worldId)
if (!world) return <Navigate to="/worlds" replace />
```

Available lessons render as links to `/lessons/:lessonId`; upcoming lessons render disabled labels. Include a visible link back to `/worlds`.

- [ ] **Step 5: Add lazy routes outside `AppShell`**

```tsx
const WorldMapPage = lazy(() =>
  import('../pages/WorldMapPage').then((module) => ({ default: module.WorldMapPage })),
)
const ChapterPage = lazy(() =>
  import('../pages/ChapterPage').then((module) => ({ default: module.ChapterPage })),
)

<Route path="worlds" element={<Suspense fallback={<RouteLoader />}><WorldMapPage /></Suspense>} />
<Route path="worlds/:worldId" element={<Suspense fallback={<RouteLoader />}><ChapterPage /></Suspense>} />
```

- [ ] **Step 6: Add the visual states**

CSS requirements:

```css
.world-map,
.chapter-overview {
  min-height: 100svh;
  overflow: hidden;
  background: radial-gradient(circle at 70% 35%, #23224f 0, #0b0d22 55%, #070815 100%);
  color: #f7f4ff;
}

.planet-visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.planet-visual--chapter img {
  animation: planet-orbit-drift 108s linear infinite;
}

@keyframes planet-orbit-drift {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .planet-visual--chapter img { animation: none; }
}
```

Position the chapter image so its center is beyond the bottom-right viewport and roughly one-third remains visible. Map cards use `transform` and `opacity` only for interaction.

- [ ] **Step 7: Run focused tests**

Run: `npm test -- src/pages/WorldPages.test.tsx src/worlds/world.registry.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/App.tsx src/components/worlds src/pages/WorldMapPage.tsx src/pages/ChapterPage.tsx src/pages/WorldPages.test.tsx src/styles/index.css
git commit -m "feat: add three-planet chapter navigation"
```

---

### Task 3: Connect Mona introduction to the planet map

**Files:**
- Modify: `src/experience/ExperienceOverlay.tsx`
- Modify: `src/experience/ExperienceShell.test.tsx`
- Modify: `tests/e2e/mona-experience.spec.ts`

**Interfaces:**
- Produces: entry CTA navigation to `/worlds`.
- Consumes: existing entered experience state.

- [ ] **Step 1: Change the component test expectation**

After entry completes:

```ts
expect(screen.getByRole('link', { name: 'สำรวจเส้นทางเรียน' })).toHaveAttribute(
  'href',
  '/worlds',
)
```

- [ ] **Step 2: Run the test and confirm the old CTA failure**

Run: `npm test -- src/experience/ExperienceShell.test.tsx`

Expected: FAIL because the existing link still targets `/lessons`.

- [ ] **Step 3: Update the CTA without changing Mona runtime state**

```tsx
<a href="/worlds" tabIndex={showsContent ? 0 : -1}>
  สำรวจเส้นทางเรียน
</a>
```

Do not add planet state to `experienceMachine`; routing owns the boundary.

- [ ] **Step 4: Extend the Mona E2E flow**

After the CTA is visible, click it and assert the three chapter links are visible on `/worlds`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/experience/ExperienceShell.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/ExperienceOverlay.tsx src/experience/ExperienceShell.test.tsx tests/e2e/mona-experience.spec.ts
git commit -m "feat: connect Mona entry to course worlds"
```

---

### Task 4: Practical code-left/result-right lesson workspace

**Files:**
- Modify: `src/components/CodeEditor.tsx`
- Modify: `src/components/CodeLab.tsx`
- Modify: `src/components/SandboxWorkspace.tsx`
- Modify: `src/pages/LessonPage.tsx`
- Create: `src/components/CodeLab.test.tsx`
- Modify: `tests/e2e/learning-flow.spec.ts`

**Interfaces:**
- `CodeEditor` adds optional `onRun?: () => void`.
- `SandboxWorkspace` adds optional `practical?: boolean`.
- `CodeLab` continues to consume `runSandboxCode()` and applies snapshots only on success.

- [ ] **Step 1: Write failing behavior tests**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { CodeLabDefinition, SandboxSnapshot } from '../sandbox/sandbox.types'
import { runSandboxCode } from '../sandbox/code/runSandboxCode'
import { CodeLab } from './CodeLab'

vi.mock('../sandbox/code/runSandboxCode', () => ({ runSandboxCode: vi.fn() }))
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    onRun,
  }: {
    value: string
    onChange: (value: string) => void
    onRun?: () => void
  }) => (
    <textarea
      aria-label="พื้นที่เขียนโค้ด Three.js"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') onRun?.()
      }}
    />
  ),
}))

const definition: CodeLabDefinition = {
  title: 'Rotate',
  description: 'Rotate the cube',
  starterCode: 'cube.rotation.y = 0',
  availableBindings: ['cube'],
}
const snapshot: SandboxSnapshot = {
  objects: {
    'learning-cube': {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  camera: {
    position: [4, 3, 6],
    target: [0, 0, 0],
    azimuthDegrees: 0,
    elevationDegrees: 0,
    distance: 7,
  },
}

beforeEach(() => vi.mocked(runSandboxCode).mockReset())

it('marks edited code as pending until Run succeeds', () => {
  render(<CodeLab definition={definition} snapshot={snapshot} onApplySnapshot={vi.fn()} />)
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'cube.rotation.y = 1' },
  })
  expect(screen.getByRole('button', { name: /Run changes/ })).toBeEnabled()
})

it('keeps the last preview snapshot when a run fails', async () => {
  const onApplySnapshot = vi.fn()
  vi.mocked(runSandboxCode).mockResolvedValue({
    status: 'error',
    logs: [],
    error: 'SyntaxError',
  })
  render(
    <CodeLab
      definition={definition}
      snapshot={snapshot}
      onApplySnapshot={onApplySnapshot}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /Run/ }))
  await waitFor(() => expect(screen.getByTestId('code-run-status')).toHaveTextContent('SyntaxError'))
  expect(onApplySnapshot).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the tests and confirm failures**

Run: `npm test -- src/components/CodeLab.test.tsx`

Expected: FAIL because dirty state and the Run shortcut are not implemented.

- [ ] **Step 3: Add the CodeMirror Run shortcut**

Add `onRun?: () => void`, keep it in a ref, and register:

```ts
keymap.of([
  {
    key: 'Mod-Enter',
    run: () => {
      onRunRef.current?.()
      return true
    },
  },
])
```

- [ ] **Step 4: Add explicit Run state**

`CodeLab` tracks `lastSuccessfulCode`, derives `hasPendingChanges`, and passes `handleRun` into `CodeEditor`.

```ts
const [lastSuccessfulCode, setLastSuccessfulCode] = useState(definition.starterCode)
const hasPendingChanges = code !== lastSuccessfulCode

if (nextResult.status === 'success' && nextResult.snapshot) {
  setLastSuccessfulCode(code)
  onApplySnapshot(nextResult.snapshot)
}
```

Reset restores starter code but does not apply it until Run. Failed runs set the error result and never call `onApplySnapshot`.

- [ ] **Step 5: Reorder the practical desktop layout**

When `practical` and code is available:

- Default to code mode.
- Code pane renders first at 45%.
- Canvas renders second at 55%.
- Add mobile `Code` and `Result` buttons that show one pane at a time.
- Keep the existing controls-first layout for Playground and concept pages.

Use CSS classes instead of duplicating `SandboxCanvas` so only one renderer mounts.

- [ ] **Step 6: Enable practical mode from `LessonPage`**

```tsx
<SandboxWorkspace
  practical
  definition={lesson.sandbox.scene}
  activeObjectId={lesson.sandbox.activeObjectId}
  exercise={lesson.exercises[0]}
  codeLab={lesson.sandbox.codeLab}
  onExercisePassed={(exerciseId) =>
    completeExercise(lesson.id, exerciseId, requiredExerciseIds)
  }
/>
```

- [ ] **Step 7: Extend E2E coverage**

Add assertions that:

- Code pane appears before the result pane on desktop.
- Editing changes the button label to `Run changes`.
- A successful Run updates status.
- Invalid code reports an error while the canvas count remains one.
- Reset restores starter code without removing the current canvas.

- [ ] **Step 8: Run focused tests**

Run: `npm test -- src/components/CodeLab.test.tsx src/experience/ExperienceShell.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/CodeEditor.tsx src/components/CodeLab.tsx src/components/SandboxWorkspace.tsx src/components/CodeLab.test.tsx src/pages/LessonPage.tsx tests/e2e/learning-flow.spec.ts
git commit -m "feat: add practical lesson workspace"
```

---

### Task 5: Full verification and visual risk check

**Files:**
- Modify only files required by failures found in this task.

**Interfaces:**
- Verifies all earlier tasks as one vertical slice.

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0 and Vite produces `dist`.

- [ ] **Step 3: Run end-to-end tests**

Run: `npm run test:e2e`

Expected: all existing and new flows pass.

- [ ] **Step 4: Inspect desktop and mobile in the user-selected in-app browser**

Check:

- Mona introduction remains visually unchanged until its CTA.
- Three planets are recognizable and never show square PNG edges.
- Chapter content remains readable while one-third of the planet is visible.
- Planet rotation is subtle.
- Lesson desktop order is code left/result right.
- Mobile Code/Result controls do not mount a second canvas.
- Failed code leaves the previous preview visible.

- [ ] **Step 5: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce` and confirm the chapter planet is stationary.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add -u src tests
git commit -m "fix: polish three-planet learning flow"
```
