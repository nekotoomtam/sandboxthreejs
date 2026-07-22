# Mona Calm Idle VRMA Design

## Context

The Mona cinematic entry currently uses a procedural breathing and weight-shift placeholder. The next step is to prove the local Blender-to-VRMA-to-Three.js animation pipeline with one deliberately small asset before attempting the more complex `turn.vrma` choreography.

This first clip presents Mona as a calm, friendly assistant who is waiting attentively without competing with the learning content on the left side of the screen. The animation is body-only. Blinking, eye direction, and facial expressions remain runtime behaviors so they do not repeat on the same five-second rhythm as the body loop.

## Approved Direction

- Create `idle.vrma` before `turn.vrma`.
- Use a calm, friendly assistant personality.
- Mona's left hand rests lightly over her right hand at the lower abdomen.
- Fingers do not interlace.
- Keep the right hand easy to release for future presentation gestures.
- Use a subtle five-second loop rather than a visibly expressive or near-static alternative.
- Author the motion with the primary Codex agent so visual decisions remain continuous between Blender and the Three.js scene.

## Goals

- Produce a seamless, reusable humanoid idle animation for Mona.
- Establish that the installed Blender and VRM Add-on workflow can export an animation that Three.js can load and retarget correctly.
- Keep Mona visibly alive through restrained breathing, weight transfer, and secondary upper-body motion.
- Preserve the approved folded-hand silhouette without sliding, separation, or mesh penetration.
- Validate the clip inside the actual cinematic composition rather than judging it only in Blender.

## Non-Goals

- Authoring `turn.vrma` in this pass.
- Baking blinks, eye glances, lip sync, speech, or facial expressions into the clip.
- Walking, waving, large presentation gestures, or a strong head turn.
- Rebuilding or editing Mona's mesh, textures, materials, humanoid mapping, or spring-bone setup.
- Creating a general animation editor or a production animation library.
- Pushing or publishing Mona, the Blender working file, or derived animation assets while redistribution remains prohibited.

## Resting Pose

- Both feet remain planted in a natural standing stance.
- Weight may favor one leg slightly, but the asymmetry must not read as a fashion pose or pronounced hip tilt.
- Pelvis remains near center and does not translate across the floor.
- Spine is upright and relaxed.
- Shoulders stay lowered with relaxed elbows.
- Both hands rest at the lower abdomen.
- The left hand lies lightly over the right hand.
- Fingers remain relaxed and do not interlace.
- The hands read as one calm unit while preserving enough separation to avoid visible mesh intersection.
- The head remains generally forward with only one to two degrees of secondary motion.

## Five-Second Motion Loop

The loop uses a quiet four-part rhythm. Timing values are authoring guides and may move slightly during visual tuning as long as the final duration remains approximately five seconds.

| Time | Motion |
|---|---|
| 0.00–1.25 s | A small inhale lifts the upper chest and spine. The shoulders and held hands follow by a barely perceptible amount. |
| 1.25–2.50 s | Weight transfers subtly toward one leg. Pelvis and torso respond together without moving either foot. |
| 2.50–3.75 s | Mona exhales and travels gently back through center. The hands continue to follow the torso as a unit. |
| 3.75–5.00 s | The body settles into the exact opening pose and velocity so the loop can repeat without a visible hitch. |

The motion should be legible when watched closely but nearly disappear when the viewer focuses on the page content.

## Motion Constraints

- First and final loop poses must match exactly.
- Loop tangents must avoid a pause, pop, or direction snap at the seam.
- Feet must not slide, rotate, or lift.
- Root translation must remain stationary.
- Hip travel and rotation must stay small enough that Mona does not appear to sway.
- Chest motion must suggest breathing rather than scaling or inflating the torso.
- Shoulder and elbow changes are secondary responses, not independent gestures.
- Hands remain in contact visually and do not drift, slide apart, or penetrate each other or the torso.
- Head motion remains within approximately one to two degrees.
- Hair and clothing secondary motion remain owned by the existing VRM spring-bone system, not baked into skeletal keyframes.
- The clip contains no facial or eye animation.

## Authoring Setup

- Source avatar: `C:\Users\nekot\Desktop\Mona.vrm`.
- Never overwrite the source avatar.
- Import a working copy into Blender 4.1 using the installed VRM Add-on.
- Store the Blender working file outside the tracked public repository, or in an explicitly ignored local authoring location.
- Name the Blender action `Mona_Idle_Calm`.
- Author at 30 frames per second.
- Target duration: 5.0 seconds, or 150 frames of elapsed animation.
- Use a deliberate loop-boundary convention so the exported clip does not play a duplicated terminal frame.
- Key only the humanoid bones necessary to describe the motion.
- Avoid keying the avatar object or global root in a way that would conflict with the runtime's placement and 180-degree entry heading.

Before authoring begins, verify locally that the installed add-on version exposes VRMA import/export for the current Blender version. If it does not, stop and report the compatibility issue before installing, replacing, or updating any software.

## Runtime Responsibilities

The VRMA clip owns:

- restrained breathing;
- subtle weight transfer;
- small spine, shoulder, elbow, hand, and head follow-through;
- the stable folded-hand waiting pose.

The Three.js runtime owns:

- randomized blinking, initially spaced around 2.5–5.5 seconds with occasional natural variation;
- optional rare double blinks;
- VRM LookAt or equivalent eye targeting;
- facial expressions;
- Mona's global position and heading;
- animation crossfades;
- spring-bone updates after skeletal animation updates.

Separating these responsibilities prevents the eyes and body from repeating as one obvious loop and allows the same body clip to support later assistant states.

## Export and Integration

1. Save the Blender working copy without modifying the original VRM.
2. Preview the loop repeatedly in Blender from front, side, and three-quarter views.
3. Check foot stability, the loop seam, hand contact, and mesh penetration.
4. Export only the approved humanoid animation as `idle.vrma`.
5. Keep the exported file local while the avatar redistribution gate remains unresolved.
6. Load the clip through the existing VRMA path in the Mona Three.js runtime.
7. Crossfade from the procedural placeholder into the real clip without recreating the canvas or avatar.
8. Observe the animation in the ready and entered camera compositions.
9. Tune in Blender and re-export until the motion reads correctly in the browser.

The procedural idle remains available as a development fallback until the VRMA has passed local integration checks.

## Validation

### Blender validation

- The loop runs continuously without a pop at its boundary.
- Feet remain fixed against the floor.
- Root position does not drift over repeated loops.
- The left hand remains visibly above the right hand.
- Hands do not separate, slide, or visibly intersect.
- Breathing does not deform the character unnaturally.
- Head, shoulders, and elbows remain restrained.
- The clip contains only the intended animation data.

### Three.js validation

- `idle.vrma` loads without warnings or retargeting failure.
- Mona keeps the intended world position, scale, and heading.
- The idle loops without a visible seam for at least five consecutive cycles.
- The back-facing ready state and front-facing entered state both remain usable because global heading stays runtime-owned.
- Spring bones update naturally after skeletal animation.
- Randomized blinking remains independent of the body loop.
- The browser frame rate and scene-loading behavior do not regress materially.
- Reduced-motion behavior remains usable.

### Visual review

- Review the same loop from the entered desktop camera, the distant ready camera, and the current mobile composition.
- Mona should look calm and attentive, not frozen, sleepy, nervous, or continuously swaying.
- The motion should support rather than distract from the left-side content.

## Asset and Release Safety

- Mona currently reports `avatarPermission=onlyAuthor`, `creditNotation=required`, and `allowRedistribution=false`.
- The source VRM, imported Blender file, and `idle.vrma` remain local-only unless authorization is documented or the avatar is replaced.
- Do not push, publish, attach to a release, or merge these binaries into a public branch.
- Do not alter embedded metadata to manufacture permission.
- Documentation and code may be committed separately as long as they do not contain or redistribute the protected binary data.

## Acceptance Criteria

The idle animation pass is complete locally when:

1. A five-second `Mona_Idle_Calm` humanoid animation exists as `idle.vrma`.
2. Mona holds the approved left-hand-over-right lower-abdomen pose.
3. Breathing and weight transfer are subtle, calm, and loop seamlessly.
4. Feet and world position do not drift.
5. Hands remain stable without visible sliding or penetration.
6. The clip excludes blink, eye, facial, lip-sync, root-placement, and global-heading animation.
7. The real clip loads and loops correctly in the existing Three.js experience.
8. Runtime blinking remains separately controlled and non-periodic.
9. The result passes Blender and browser visual review in ready, entered, and mobile compositions.
10. No protected avatar or derived binary is pushed or publicly distributed.
