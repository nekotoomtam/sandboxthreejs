# Three-Planet Learning Experience — MVP Design

## Goal

Turn the existing Mona introduction into the entrance to a practical Three.js course. The course should feel like travelling between three chapter planets, then switch into a focused code-and-preview workspace for each lesson.

The first implementation is a vertical slice, not the full curriculum. It proves the complete path from the existing entrance to one working lesson while keeping the remaining chapters ready for expansion.

## MVP Scope

The MVP includes:

1. Preserve the existing loading, Mona reveal, camera movement, and idle experience.
2. After the entrance, reveal a map containing three layered chapter planets.
3. Allow the learner to select a planet and transition into its chapter overview.
4. Show the selected planet at roughly one-third visibility on the right, slowly rotating.
5. Show the chapter title, description, and lesson list on the left.
6. Open a practical lesson workspace with code on the left and a Three.js result on the right.
7. Make one lesson fully runnable. Other lessons may be clearly marked as upcoming.

Accounts, cloud progress, a complete curriculum, grading, collaboration, and public deployment are outside this MVP.

## Experience Flow

```text
Loading
  → Mona introduction
  → Three-planet map
  → Chapter overview
  → Lesson workspace
  → Back to chapter or planet map
```

The transition between these states should feel continuous, but each state must remain an independent view so it can be tested and changed without breaking the others.

## Screen Design

### Planet Map

- Display all three transparent planet assets as DOM images, not Three.js meshes.
- Layer the planets at different positions and scales to create depth.
- Each planet is a large click target with a chapter name and short label.
- Hover or keyboard focus may slightly brighten and scale the selected planet.
- Selecting a planet moves the other planets away and enlarges the selected planet before entering the chapter overview.
- Motion uses only `transform` and `opacity`.

Planet order:

1. `planet-01-foundations.png` — Three.js foundations
2. `planet-02-controls.png` — input and movement
3. `planet-03-integration.png` — model and camera integration

### Chapter Overview

- Left side: chapter number, title, short description, and lesson buttons.
- Right side: a large selected planet whose center sits outside the viewport.
- Approximately one-third of the planet remains visible, showing its upper-left region.
- The planet rotates very slowly, approximately one revolution every 90–120 seconds.
- The planet does not react to pointer movement.
- Reduced-motion mode stops continuous rotation and keeps only the transition.

### Lesson Workspace

Desktop layout:

- Top bar: back, chapter/lesson title, progress, and workspace actions.
- Left pane, approximately 45%: short instruction, editable code, error output, Run, and Reset.
- Right pane, approximately 55%: live Three.js result.
- A draggable divider may resize the two panes after the core workspace works.
- Result pane supports fullscreen.

Mobile layout:

- Replace the split view with `Learn`, `Code`, and `Result` tabs.
- Keep Run and Reset reachable without opening another menu.

The planet and Mona are not permanently rendered inside the lesson workspace. Mona may return later as contextual help, but this is outside the first vertical slice.

## Code Execution

The preview updates only after the learner presses **Run** or uses `Ctrl/Cmd + Enter`.

While editing:

- Mark the lesson as having unapplied changes.
- Perform lightweight syntax validation when practical.
- Do not rebuild the Three.js scene on each keystroke.

On a successful run:

- Dispose of the previous lesson scene and renderer resources.
- Replace the preview with the new result.
- Save the code as the latest successful version for the current session.

On a failed run:

- Keep the latest successful preview visible.
- Show a readable error with the relevant line when available.
- Do not replace the preview with a blank screen.

Reset restores the lesson starter code and requires Run to apply it.

For the MVP, lesson code runs inside an isolated preview frame. Each Run creates a fresh preview environment, and the old environment is discarded. Obvious unbounded-loop patterns are rejected before execution. This is a guardrail for an educational editor, not a security boundary for hostile code.

## Course Structure

### Planet 1 — Foundations

- Scene, camera, and renderer
- Geometry and materials
- Position, rotation, and scale
- Light and shadows
- Camera types and OrbitControls
- Resize and render loop

### Planet 2 — Input and Movement

- Keyboard events and key state
- Delta-time movement
- WASD controls
- Local and world direction
- Camera modes
- Separating input, movement, and camera logic

The first examples use simple primitives so learners can focus on control logic.

### Planet 3 — Model Integration

- Loading GLTF/VRM assets
- Loading progress and errors
- Scene graph and transforms
- Animation clips and state
- Model direction and movement
- Smooth follow camera
- Resource disposal and performance

This chapter introduces Mona or another real model after the learner understands the control system.

## Component Boundaries

- `ExperienceFlow`: owns the current high-level state and transitions.
- `PlanetMap`: presents the three chapters and reports selection.
- `ChapterOverview`: presents one chapter and reports lesson selection.
- `PlanetVisual`: owns planet placement, rotation, and reduced-motion behavior.
- `LessonWorkspace`: owns layout and editor state.
- `LessonRunner`: creates, replaces, and disposes isolated preview frames.
- `LessonCatalog`: contains chapter and lesson metadata, starter code, and completion status.

Views receive data and emit navigation actions. They must not directly manipulate each other's DOM or Three.js resources.

## Risk Controls

- **Performance:** planet artwork remains normal images; only one lesson renderer is active; dispose scenes, textures, animation frames, and WebGL contexts when leaving a lesson.
- **Broken code:** Run is explicit; failed runs preserve the latest successful preview; obvious infinite-loop patterns are blocked.
- **Scope:** implement one complete lesson before adding the remaining curriculum.
- **Bundle size:** avoid Monaco for the MVP; begin with the existing stack and a lightweight editor surface.
- **Motion:** use transform/opacity and support `prefers-reduced-motion`.
- **Responsive layout:** use the desktop split view and mobile tabs rather than shrinking both panes until unusable.
- **Asset rights:** Mona remains local and must not be pushed or publicly deployed while its current VRM metadata prohibits redistribution.
- **Recovery:** navigation back to chapter/map must always be available, including after preview errors.

## Validation

- Unit tests cover experience states, chapter data, unsaved code state, Run/Reset behavior, and error preservation.
- End-to-end tests cover introduction → map → chapter → lesson, successful Run, failed Run, Reset, and back navigation.
- Verify desktop and mobile layouts.
- Verify reduced-motion behavior.
- Confirm only one active animation/render loop remains after repeated runs and navigation.

## Implementation Order

1. Add the course data model and experience states.
2. Build the three-planet map using the prepared assets.
3. Build one chapter overview with the one-third rotating planet.
4. Build the lesson workspace shell.
5. Add the isolated runner and one working Three.js lesson.
6. Add error preservation, Reset, navigation, tests, and responsive behavior.
