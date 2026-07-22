# Mona Low-Hand Idle Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Mona's approved low, left-over-right hand pose while converting it to rotation-only humanoid animation that exports cleanly to VRMA.

**Architecture:** Treat `Mona-hand-practice.blend` as the only editable Blender file. A local authoring script will capture the approved arm targets, clear lower-arm translation offsets, rebuild the two arm chains with rotation-only transforms, apply one restrained wrist alignment, and key the result at the five existing idle poses. The existing render and VRMA validation scripts remain the review boundary before the ignored runtime copy is replaced.

**Tech Stack:** Blender 4.1.1, VRM Add-on for Blender 4.4.0, Python `bpy`/`mathutils`, VRMC_vrm_animation 1.0, `@pixiv/three-vrm-animation` runtime.

## Global Constraints

- Preserve `C:\Users\nekot\Desktop\Mona.vrm`, `Mona-idle-v1.blend`, and `Mona-idle-source-copy.vrm` byte-for-byte.
- Edit and save only `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-hand-practice.blend` plus local authoring/review outputs.
- Keep the left hand over the right hand at the low center between the legs; do not interlace fingers.
- Do not add detailed finger animation.
- Non-hips VRMA channels must be rotation-only.
- Keep the idle at 30 fps, frames 1 through 151, with matching poses at frames 1 and 151.
- Keep Mona and all derived binaries ignored and unpushed.

---

### Task 1: Rebuild the approved arm pose as rotation-only transforms

**Files:**
- Create: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\refine_low_hand_idle.py`
- Modify: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-hand-practice.blend`
- Preserve: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-hand-practice.blend1`

**Interfaces:**
- Consumes: armature `Armature`, action `Mona_Idle_Calm`, pose bones `J_Bip_[L|R]_[UpperArm|LowerArm|Hand]`.
- Produces: a saved Blender action with rotation keys at frames `1, 38, 76, 113, 151` and zero non-hips pose locations.

- [ ] **Step 1: Record safety hashes and current pose targets**

Run Blender in background against `Mona-hand-practice.blend` and print the six arm-bone heads, tails, locations, action range, and fps. Record the SHA-256 hashes of the three protected source files before editing.

- [ ] **Step 2: Create the local refinement script**

Implement the following operations in `refine_low_hand_idle.py`:

```python
FRAMES = (1, 38, 76, 113, 151)
ARM_BONES = tuple(
    f"J_Bip_{side}_{segment}"
    for side in ("L", "R")
    for segment in ("UpperArm", "LowerArm", "Hand")
)

# At frame 1, retain the user's approved wrist/head targets and hand orientation.
# Clear lower-arm/hand locations, solve the upper/lower arm chain by rotation,
# then copy the resulting six rotation quaternions to every idle key pose.
for bone_name in ARM_BONES:
    pose_bone = armature.pose.bones[bone_name]
    pose_bone.location = (0.0, 0.0, 0.0)
    pose_bone.scale = (1.0, 1.0, 1.0)
    pose_bone.rotation_mode = "QUATERNION"

for frame in FRAMES:
    scene.frame_set(frame)
    for bone_name, quaternion in solved_rotations.items():
        bone = armature.pose.bones[bone_name]
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_quaternion = quaternion.copy()
        bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone_name)

scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=PRACTICE_BLEND)
```

The two-bone solve must use the practice file's frame-1 hand-head targets and the existing elbow side as the pole direction. The hand quaternion must be recomputed after the parent-chain solve while keeping the hand location zero.

- [ ] **Step 3: Run the refinement script and verify the saved pose data**

Run Blender 4.1.1 in background with `Mona-hand-practice.blend` and `refine_low_hand_idle.py`. Re-open the saved file in a fresh background process and assert:

```text
fps = 30
frame range = 1..151
action = Mona_Idle_Calm
arm rotation keys = 1, 38, 76, 113, 151
non-hips location curves = []
six arm-bone pose locations = approximately zero
frame 1 arm rotations = frame 151 arm rotations
```

### Task 2: Perform front/side visual QA and make at most one restrained wrist correction

**Files:**
- Modify: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-hand-practice.blend`
- Reuse: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\render_idle_review.py`
- Create: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\review-low-hand\*.png`

**Interfaces:**
- Consumes: the rotation-only action from Task 1.
- Produces: front and side renders for frames `1, 38, 76, 113, 151` with an accepted low-hand pose.

- [ ] **Step 1: Render the five review frames from the front and both sides**

Render `720 x 900` PNGs with the existing Eevee review lighting and orthographic camera. Use labels `front`, `right`, and `left` in `review-low-hand`.

- [ ] **Step 2: Check the approved pose against the acceptance criteria**

Confirm that the left hand reads above the right, the hands sit at the low center, the cuffs are visually balanced, the wrists are not sharply bent, and no hand enters the dress. Compare frames 1 and 151 directly for a clean loop.

- [ ] **Step 3: Apply only a small wrist correction if required**

If the left cuff still turns outward, rotate only `J_Bip_L_Hand` in local space by no more than `5` degrees, copy that corrected quaternion to all five frames, re-render, and stop. Do not edit finger bones.

### Task 3: Export, validate, and install the revised local VRMA

**Files:**
- Modify: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\idle.vrma`
- Modify ignored runtime copy: `public/models/mona/animations/idle.vrma`
- Reuse: `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\validate_vrma_blender.py`

**Interfaces:**
- Consumes: the accepted `Mona_Idle_Calm` action from Task 2.
- Produces: a VRMC_vrm_animation 1.0 file and identical ignored runtime copy.

- [ ] **Step 1: Export the practice action as VRMA 1.0**

Use the installed Blender VRM Add-on exporter. The output must contain one five-second animation and no mesh, material, texture, expression, or LookAt payload.

- [ ] **Step 2: Validate structure and Blender re-import**

Confirm 54 humanoid bones, 39 animation channels, one hips translation channel, 38 rotation channels, and no non-hips translation tracks. Re-import with `validate_vrma_blender.py` and confirm one armature and a five-second action.

- [ ] **Step 3: Replace only the ignored runtime copy and verify hashes**

Copy the accepted `idle.vrma` to `public/models/mona/animations/idle.vrma`, verify identical SHA-256 hashes, and confirm `git check-ignore` still reports the runtime binary.

- [ ] **Step 4: Run focused runtime verification**

Run the unit tests, lint, and production build. Open the local Mona experience, observe one complete idle loop before and after entry, and confirm there is no foot drift, hand jump, console warning, or fallback activation.
