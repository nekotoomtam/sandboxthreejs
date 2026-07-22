# Mona Cinematic Entry — Phase 2 Design

## Context

Phase 1 proved that the root route can load the real `Mona.vrm`, preserve one Three.js canvas, expose honest progress and recovery states, and render a responsive static entry scene. Phase 2 turns that foundation into the intended opening sequence: a full-screen loader transforms into a right-side Start rail, Mona waits at a distance with her back to the viewer, and pressing Start moves the camera toward her while she turns to greet the viewer. Only after the movement finishes does the left-side headline appear.

This phase is designed and implemented by the primary Codex agent without subagent delegation. The work depends on a continuous visual understanding of the loader, camera, avatar motion, and content composition.

## Decisions Already Approved

- Use one native Three.js timeline rather than GSAP or CSS timers for camera and avatar choreography.
- Keep the existing persistent-canvas architecture.
- Start with Mona far away, full body visible, back facing the viewer.
- Begin from a low camera angle looking upward by roughly 15–30 degrees.
- Move the camera straight toward Mona while raising it toward mid-body height.
- Finish with Mona still visible full body, slightly distant, inside the right 30–40 percent region of the desktop composition.
- Reserve the left 60–70 percent for headings and future content.
- Reveal left-side mock headings only after the camera and Mona stop.
- Use a full-height right-side Start rail; the entire rail is the semantic Start button.
- Use an initial camera timeline duration of 3.2 seconds and tune it after viewing the real motion.
- Create two animation assets: a looping idle and a one-shot turn.

## Goals

- Replace the current quiet loading card with an opaque full-screen loading experience.
- Hide the Three.js scene completely until Mona has loaded, the scene has been prepared, and the first valid frame is ready.
- Transform the loading surface into an interactive right-side rail after loading.
- Make the right rail visibly respond to pointer hover, keyboard focus, press, and activation.
- Introduce a deterministic camera and avatar timeline that can be tuned without rewriting the UI.
- Support a real `idle.vrma` and `turn.vrma`, with a procedural placeholder available while the Blender clips are being authored.
- Preserve direct access to existing learning routes and keep them free of the Mona runtime entry cost.
- Preserve accessibility, reduced-motion support, resource cleanup, and the one-canvas lifecycle.

## Non-Goals

- Final production copy for the left-side content.
- AI chat, voice, lip sync, or assistant responses.
- User-controlled camera movement or OrbitControls.
- Walking toward the camera.
- A cinematic environment beyond the existing minimal floor, lighting, and color language.
- AAA-quality motion capture in the first animation pass.
- Public deployment or pushing the Mona binary while its embedded metadata continues to prohibit redistribution.

## Experience State Model

The expanded state flow is:

```text
loading -> revealing -> ready -> approaching -> revealing-content -> entered
   |
   +---------------------------> error -> loading
```

### `loading`

- An opaque HTML/CSS surface covers the entire viewport.
- A circle, square, and triangle form a simple looping CSS animation.
- A real progress bar near the bottom reports model-download and preparation progress.
- The scene may render behind the loader, but the user cannot see it.
- Progress reaching 100 percent is not sufficient by itself. The runtime must also confirm that Mona is attached, final transforms are applied, spring bones are reset, and at least one valid frame has rendered.

### `revealing`

- Duration: 700–900 ms; initial target 800 ms.
- The loading surface contracts horizontally into a full-height rail on the right.
- The rail is darkest at its left edge and fades toward its right edge.
- The real scene becomes visible as the loader contracts.
- Mona is already in her distant back-facing ready pose.
- The Start label becomes interactive only after the contraction finishes.

### `ready`

- Mona is visible full body at a distance with her back to the viewer.
- The camera is low and aims upward at roughly 22 degrees, remaining inside the approved 15–30 degree range.
- The left side contains no headline yet.
- The former loader is now the Start rail.
- The entire rail is one semantic `<button>`, not a clickable `div` surrounding a smaller button.

### `approaching`

- Begins once and cannot be triggered repeatedly.
- The right rail acknowledges the press, then fades out during the opening portion of the timeline.
- The camera moves straight toward Mona, rises from the low opening position, and retargets toward the middle of her body.
- Mona turns from back-facing to front-facing while the camera moves.
- Camera and avatar settle at the same final moment.

### `revealing-content`

- The camera and Mona remain at their final composition.
- Mock headings on the left appear one line at a time with a short stagger.
- The idle animation resumes or continues as appropriate.

### `entered`

- Mona remains full body in the right 30–40 percent region.
- Mock content remains visible on the left.
- The runtime continues updating animation, spring bones, and rendering.

### `error`

- The error surface remains opaque and full-screen so a broken or partial scene is never exposed.
- The error message is announced accessibly.
- Retry creates a fresh loading attempt and a fresh runtime asset load.

## Loading and Ready UI

### Full-screen loader

- Use the established deep forest, mint, and amber palette.
- Use user-requested CSS geometry: one circle, one square, and one triangle.
- Animate the shapes with rotation, translation, and staggered timing without using image placeholders.
- Keep animation decorative and mark it hidden from assistive technology.
- Keep the progress label and `<progress>` element semantic.
- Place the progress group near the bottom with safe viewport padding.

### Start rail

- Desktop width: 20–25 percent of the viewport, with a minimum width that keeps the label readable.
- Height: full viewport.
- Gradient: dark on the left boundary, increasingly transparent toward the right.
- The rail contains the Start label and an understated readiness cue.
- Pointer hover brightens the amber component and increases the soft glow without flashing.
- `:focus-visible` provides a high-contrast outline or inset edge.
- Press gives immediate visual feedback before the timeline begins.
- Clicking anywhere inside the rail, or pressing Enter/Space while it is focused, starts the sequence.
- The Start action is disabled before `ready` and after the first activation.

## Desktop Composition

### Ready composition

- Mona's full-body silhouette occupies approximately 28–34 percent of viewport height.
- Mona is placed around the center-right of the open scene and remains readable beside the Start rail.
- The camera begins below the final height and looks upward at approximately 22 degrees.
- The left side remains deliberately empty.

### Entered composition

- Mona's full-body silhouette occupies approximately 58–68 percent of viewport height.
- The center of her visual mass lands around 72–80 percent of viewport width.
- Head and feet retain visible breathing room and are never cropped at the target desktop viewport.
- The left 60–70 percent remains clear enough for a headline, supporting line, and future primary action.
- Initial mock copy:
  - `เรียนรู้ Three.js ผ่านโลกที่โต้ตอบได้`
  - `ทดลอง สังเกต และสร้างด้วยตัวคุณเอง`
  - `เริ่มเรียนรู้`

The exact 3D coordinates are calibration values, not product requirements. The visible composition percentages are the acceptance target.

## Camera and Entry Timeline

The runtime owns a single normalized entry progress value from 0 to 1. A pure timeline function maps elapsed time to camera position, camera target, Mona root orientation, and animation weights.

Initial total duration: **3.2 seconds**.

| Time | Event |
|---|---|
| 0.00–0.25 s | Start rail responds and begins fading. |
| 0.15 s | Camera begins moving. |
| 0.45 s | Mona begins turning after the camera has established motion. |
| 0.45–2.85 s | Camera advances and rises while Mona turns. |
| 2.85–3.20 s | Mona settles; camera eases into the final framing. |
| After 3.20 s | Left-side mock content begins its staggered reveal. |

The camera path is a straight approach rather than an orbit. Position and look target use smooth easing, with no discontinuity at the start or finish. The end frame remains a full-body composition rather than a close-up.

## Animation Assets and Blender Workflow

Phase 2 requests two clips:

### `idle.vrma`

- Loop duration: approximately 4–6 seconds.
- Subtle breathing, weight shift, and small arm/shoulder movement.
- Must loop without a visible jump.
- Used while Mona waits back-facing and again after the turn, because global heading is owned by the runtime root transform.

### `turn.vrma`

- One-shot motion aligned with the 3.2-second entry timeline.
- Active motion begins around 0.45 seconds and settles by 3.20 seconds.
- Provides foot pivot, weight transfer, hips, torso, shoulders, arms, and head follow-through.
- Does not own the permanent global 180-degree heading. The runtime timeline rotates Mona's root; the clip provides local body mechanics so the turn does not look like a rigid spin.

### Authoring sequence

1. Build the loader, rail, camera path, and final composition with a procedural root-turn placeholder.
2. Open a copy of Mona in Blender through the VRM Add-on.
3. Author rough idle and turn keyframes against the approved 3.2-second timing.
4. Preview and adjust weight transfer, feet, hips, torso, shoulders, arms, and head.
5. Export `idle.vrma` and `turn.vrma`.
6. Load the clips in Three.js and inspect them in the real camera sequence.
7. Iterate between Blender and the browser until the animation and camera read as one motion.

Blender work must use a copy of the avatar. The source `C:\Users\nekot\Desktop\Mona.vrm` must not be overwritten.

## Runtime Architecture

### React / HTML responsibilities

- Expanded pure experience state reducer.
- Loader, progress, full-screen error, Start rail, and mock content.
- Accessible labels, button semantics, keyboard behavior, and announcements.
- State transitions driven by narrow runtime callbacks rather than arbitrary timeouts.

### Three.js responsibilities

- Persistent renderer, scene, camera, lighting, and Mona instance.
- First-valid-frame readiness signal.
- Entry timeline and camera interpolation.
- Mona root rotation and AnimationMixer updates.
- VRMA loading, idle loop, turn action, and crossfades.
- Spring-bone updates after animation updates.
- Resize-aware camera endpoints and final composition.
- Visibility pause and deterministic disposal.

### Proposed focused units

- `entryTimeline.ts`: pure time-to-motion sampling and easing.
- `CameraController.ts`: applies sampled camera position and target.
- `MonaController.ts`: owns VRM placement, root heading, AnimationMixer, clip actions, and spring reset/update ordering.
- `vrmaLoader.ts`: loads and converts VRMA files into clips for the current VRM.
- `ExperienceRuntime.ts`: coordinates lifecycle and forwards completion callbacks.
- `ExperienceOverlay.tsx`: owns loader, Start rail, error, and content reveal UI.

These names are directional. The implementation plan may reuse existing files when that produces a smaller, clearer change.

## Data and Event Flow

1. React mounts one `ExperienceRuntime`.
2. The runtime loads Mona and animation assets while forwarding progress.
3. The runtime attaches Mona, applies the ready pose and back-facing heading, resets spring bones, and renders a valid frame.
4. `SCENE_READY` moves React from `loading` to `revealing`.
5. CSS transition completion moves React to `ready` and enables the Start rail.
6. Start dispatches once and asks the runtime to play the entry timeline.
7. Runtime progress drives camera and Mona every frame.
8. Runtime completion moves React to `revealing-content`.
9. Content transition completion moves React to `entered`.

The canvas is not recreated anywhere in this flow.

## Animation Update Order

Each visible frame uses this order:

1. Advance the shared timer.
2. Sample the entry timeline when active.
3. Apply camera position and target.
4. Apply Mona root heading.
5. Update AnimationMixer actions.
6. Update VRM components and spring bones.
7. Render the scene.

This order prevents stale spring state and keeps the camera and body motion synchronized.

## Resize, Visibility, and Reduced Motion

- Camera endpoints are stored as semantic compositions rather than one hard-coded position.
- Resizing samples new endpoints at the current normalized timeline progress; it does not restart or jump to the beginning.
- Hidden tabs pause elapsed timeline accumulation.
- On return, the timeline resumes from its previous progress instead of skipping forward.
- `prefers-reduced-motion` shortens loader contraction and entry motion to a brief transition, then applies the final camera, heading, animation state, and content directly.

Phase 2 remains desktop-first. At widths below 768 px, the full-screen loader contracts into a full-width bottom Start band instead of a narrow right rail. The same 3.2-second timeline is used unless the user requests reduced motion. Mona remains full body and shifts toward the lower-right after entry, while the mock heading uses a compact upper-left column. Mobile acceptance requires no cropped head or feet, no heading/avatar overlap, no horizontal overflow, and a Start target at least 44 px high. The desktop left-content/right-Mona percentages do not apply to this narrow layout.

## Failure Handling

- Model or animation-load failure keeps the full-screen error surface visible.
- A missing idle or turn clip is recoverable in local development through the procedural fallback, but production readiness requires both approved clips.
- Repeated Start activation is ignored after the first accepted event.
- Runtime disposal cancels animation frames, disconnects observers, stops and uncaches mixer actions, disposes VRM and scene resources, and removes the canvas.
- A late load or late timeline callback after disposal must not mutate the scene or React state.

## Testing and Visual Verification

### Unit tests

- Expanded state-transition rules and ignored duplicate events.
- Timeline samples at start, camera start, Mona turn start, settle, and completion.
- Camera and Mona reach exact semantic endpoints.
- Animation action and crossfade ordering.
- Pause/resume behavior for hidden tabs.
- Resize preserves normalized progress.
- Reduced-motion final-state behavior.
- Disposal and late-callback safety.

### Component tests

- Loader stays visible until first-frame readiness.
- Start rail appears only after revealing completes.
- The full rail is one semantic button and supports keyboard activation.
- Hover/focus/pressed class and state behavior.
- Content appears only after runtime completion.
- Error and retry return to a fresh loading attempt.

### Browser tests

- Full-screen loader precedes the ready scene.
- Exactly one canvas persists through all phases.
- Clicking the rail once starts the entry sequence.
- Camera and Mona reach the expected final state.
- Existing `/lessons`, `/concepts`, and `/playground` routes still open.
- Reduced-motion flow remains usable.

### Visual QA

- Capture desktop loading, ready, mid-approach, and entered states.
- Confirm ready Mona is distant, full body, and back-facing.
- Confirm entered Mona is full body in the right 30–40 percent region without cropped head or feet.
- Confirm the left content does not overlap Mona.
- Confirm the Start rail visibly brightens on hover and focus.
- Compare animation previews across Blender and the browser at the same timeline moments.

## Performance

- Continue lazy-loading the root experience so learning routes do not pay the Three.js/VRM cost.
- Load Mona and both small VRMA assets under the full-screen loader.
- Avoid adding a general animation framework.
- Keep the entry timeline allocation-free inside the render loop.
- Preserve the reduced quality tier and pixel-ratio cap for narrow/coarse-pointer devices.

## Asset and Release Safety

- The current Mona binary reports `avatarPermission=onlyAuthor`, `creditNotation=required`, and `allowRedistribution=false`.
- Keep this work local. Do not push, publish, or merge the avatar into the public remote until authorization is documented or the avatar is replaced.
- Do not rewrite embedded metadata to manufacture permission.
- Keep visible credit in the experience.
- Blender working files are local authoring artifacts and must not overwrite the source VRM.

## Acceptance Criteria

Phase 2 is locally complete when:

1. A full-screen CSS loader hides the scene until Mona, animations, and a first valid frame are ready.
2. The loader contracts into an accessible right-side Start rail.
3. Hovering or focusing the rail brightens it; clicking anywhere in it starts the sequence once.
4. Mona waits far away, full body, back-facing, viewed from a low upward angle.
5. The 3.2-second timeline moves and raises the camera while Mona turns.
6. Mona settles full body inside the desktop right 30–40 percent region.
7. Mock headings reveal on the left only after motion finishes.
8. A looping idle and one-shot turn VRMA play with correct crossfades and spring-bone behavior.
9. One canvas persists across all experience phases.
10. Resize, visibility pause, reduced motion, error, retry, and disposal behave safely.
11. Existing learning routes remain directly reachable and route-split.
12. Unit, component, build, lint, browser, and visual checks pass.
13. Nothing is pushed or publicly released while the Mona redistribution gate remains unresolved.
