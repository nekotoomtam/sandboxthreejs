# Foundations Lesson 02 — Position, Rotation, Scale

## Goal

Add the second available lesson inside the Foundations planet. The lesson teaches how an object's position, rotation, and scale work together, then asks the learner to match a visible target object in a real Three.js scene.

## Learning Flow

The lesson uses the same in-planet chamber and navigation pattern as Lesson 01:

1. **Position** — introduce the X, Y, and Z axes and move a box.
2. **Rotation** — rotate the box and explain degrees versus radians.
3. **Scale** — resize one axis or the whole object.
4. **Interactive lab** — match a solid learning box to a translucent target box.

Field Notes may provide deeper reference material, but the main lesson must contain enough information to complete the lab without leaving the chamber.

## Interactive Lab

The result scene contains:

- the existing solid `learning-cube`;
- a translucent, non-interactive target box;
- enough visual contrast to compare position, rotation, and scale;
- the current transform values for the learning cube.

The target transform is fixed and intentionally simple:

- values must be readable and reproducible through both the controls and code;
- the target must demonstrate all three transform concepts;
- the object must remain fully visible from the starting camera.

The learner may solve the task in either mode:

- **Controls:** edit numeric position, rotation, and scale fields.
- **Code:** edit the current transform commands and run them in the sandbox.

## Validation and Feedback

Validation compares the learning cube with the target transform using small tolerances suitable for typed values:

- position feedback identifies the axes that are still too far away;
- rotation feedback identifies the axes whose angles are still incorrect;
- scale feedback identifies the axes whose size is still incorrect;
- success requires all three transform groups to match.

The message should prioritize one actionable mismatch at a time instead of presenting a wall of numbers.

The code editor and rendered scene must not drift into contradictory states. Pressing **Check answer** in code mode first runs the latest editor contents in the worker sandbox, applies a successful snapshot, and then validates that snapshot. Syntax or runtime errors remain visible and do not complete the exercise. The separate **Run** button remains available for previewing changes before validation.

Starter code must describe an incomplete state rather than contain the finished answer.

## Completion

Passing the lab records Lesson 02 as complete. Cross-lesson and cross-planet navigation will be connected only after Lessons 02 and 03 are both implemented, so this work does not add or redesign the final progression buttons.

The existing Playground completion action is also left unchanged until that shared progression pass, when it will be removed together with the new next-lesson and next-planet navigation.

## Data and Component Boundaries

- Lesson copy, starter code, target transform, and exercise metadata belong in the lesson registry/content layer.
- Scene definitions expose the target object without making it the active editable object.
- Exercise validators compare a snapshot against lesson-specific target values.
- `SandboxWorkspace` coordinates running pending code and validating the resulting snapshot.
- Lesson completion continues through the existing progress provider.

Shared sandbox changes must remain compatible with Lesson 01.

## Validation

- Unit test the new transform validator with success and separate position, rotation, and scale failures.
- Add a regression test proving that checking edited code validates the newly run snapshot rather than stale scene state.
- Add an end-to-end flow for Lesson 02 through all three knowledge sections and the lab.
- Verify the target remains non-editable and visible.
- Run the existing Lesson 01, progress, lint, and production-build checks.

## Out of Scope

- Lesson 03 light-and-shadow content.
- Final next-lesson and next-planet navigation.
- Removing Playground before the shared progression pass.
- Random target generation.
- Drag gizmos or physics-based matching.
