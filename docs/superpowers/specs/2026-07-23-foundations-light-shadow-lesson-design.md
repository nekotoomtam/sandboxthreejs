# Foundations Lesson 03 — Light and Shadow

## Goal

Add the third Foundations lesson and teach lighting through a real shadow-enabled Three.js sandbox. The learner configures a directional light, enables the shadow pipeline, and uses the rendered shadow as visual confirmation of the code and controls.

## Learning Flow

The lesson remains inside the Foundations planet chamber and contains:

1. **Light Types** — compare broad environment lighting with a directional key light.
2. **Position and Intensity** — explain how the light position changes direction and how intensity changes contrast.
3. **Cast and Receive Shadow** — connect renderer shadow maps, shadow-casting objects, and shadow-receiving surfaces.
4. **Interactive Lab** — configure the pipeline and move the key light until the cube shadow reaches the target region.

The main lesson contains enough information to finish the exercise. Related Field Notes remain optional references.

## Shadow Sandbox

The lesson scene contains:

- a solid cube that can cast a shadow;
- a floor plane that can receive a shadow;
- a directional key light that the learner can configure;
- a low-intensity environment light so unlit surfaces remain readable;
- a visible target marker on the floor;
- a camera angle that keeps the cube, floor, target marker, and resulting shadow visible.

The renderer uses real Three.js shadow maps. The target marker is only a guide and does not receive input.

## Editable State

The sandbox snapshot expands beyond object transforms to include:

- renderer shadow-map enabled state;
- per-object `castShadow` and `receiveShadow` state;
- directional-light position, intensity, and cast-shadow state.

The light lesson exposes these code bindings:

- `THREE`
- `scene`
- `camera`
- `renderer`
- `cube`
- `floor`
- `light`
- `console`

Existing lessons continue to use their current bindings and default non-shadow behavior.

Controls mode provides focused fields for:

- light position X, Y, and Z;
- light intensity;
- renderer shadow map on/off;
- cube cast shadow on/off;
- floor receive shadow on/off.

The target marker and environment light are not editable.

## Exercise Target

The exercise uses one stable target configuration:

- renderer shadow map enabled;
- cube casts shadow;
- floor receives shadow;
- directional light casts shadow;
- light position `(-3, 6, 4)`;
- light intensity `2.5`.

The target marker is placed to make the expected shadow direction understandable from the starting camera. The validator compares configuration values rather than pixels, so grading remains deterministic across browsers and graphics hardware.

## Validation and Feedback

Feedback follows the dependency order of the shadow pipeline:

1. renderer shadow map;
2. cube cast-shadow flag;
3. floor receive-shadow flag;
4. directional-light cast-shadow flag;
5. light position;
6. light intensity;
7. success.

Only the first actionable mismatch is shown. Position and intensity use small numeric tolerances.

In code mode, **Check answer** runs the latest editor contents before validation. Syntax errors, runtime errors, or timeouts remain visible and cannot complete the exercise.

Starter code is intentionally incomplete and contains the required properties with safe initial values.

## Runtime and Resource Safety

- Shadow maps are disabled by default for lessons that do not request them.
- The shadow-enabled renderer and light resources are disposed with the existing sandbox runtime.
- The floor geometry and materials are disposed through the existing scene-disposal path.
- Shadow-map resolution remains modest for an educational preview.
- Only one sandbox render loop is active per mounted lesson.
- Browser tests run serially because concurrent WebGL pages previously exceeded worker and renderer timing limits.

## Completion

Passing the lab records Lesson 03 as complete and makes all three currently planned Foundations lessons available for the later progression pass.

This work does not yet add:

- automatic next-lesson navigation;
- automatic travel from Foundations to Controls;
- the final completion-button redesign.

Those connections will be implemented after the three Foundations lessons are verified together.

## Component Boundaries

- Lesson content owns copy, starter code, target values, and scene definition.
- Sandbox types describe renderer, object-shadow, and light state.
- `SandboxRuntime` creates, updates, snapshots, resets, and disposes the real Three.js lights and floor.
- The code worker exposes controlled renderer, object, and light bindings, then returns a serializable snapshot.
- A focused light controls panel edits the same snapshot state without touching the target marker.
- The validator grades snapshot state and does not inspect DOM, source text, or rendered pixels.

## Validation

- Unit-test snapshot defaults and shadow-state application.
- Unit-test the validator for every dependency and success.
- Regression-test Lessons 01 and 02 after extending the snapshot.
- End-to-end test all four Lesson 03 stages and completion through code.
- End-to-end test the same exercise through controls.
- Visually inspect the real shadow, target marker, and controls at desktop and mobile widths.
- Run all unit tests, lint, production build, and serialized browser journeys.

## Out of Scope

- Soft-shadow quality controls.
- Multiple editable lights.
- Point-light or spot-light exercises.
- Pixel-based shadow matching.
- Baking or exporting lighting.
- Final cross-lesson and cross-planet progression.
