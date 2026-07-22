# Mona Low-Hand Idle Adjustment

## Goal

Refine `C:\Users\nekot\Documents\MonaAuthoring\idle-v1\Mona-hand-practice.blend` so Mona keeps a calm, formal idle pose with her hands lowered to the center between her legs.

## Approved Pose

- Left hand rests over the right hand.
- Fingers remain relaxed and are not interlaced.
- Hands stay centered and low, matching the current practice-file composition.
- The edit is intentionally restrained; detailed finger posing is out of scope.

## Authoring Constraints

- Preserve the source VRM and the existing `Mona-idle-v1.blend` authoring file.
- Edit and save only `Mona-hand-practice.blend`.
- Clear unsupported lower-arm translation offsets introduced with `G`.
- Recreate the hand placement using rotations on upper arms, lower arms, and hands.
- Keep non-hips animation channels rotation-only for VRMA compatibility.
- Maintain a clean five-second loop with matching start and end poses.

## Acceptance Check

- Front view: hands read as left-over-right at the low center.
- Side views: hands overlap naturally without entering the dress or floating far in front.
- Wrists do not appear sharply bent; the bright cuffs remain balanced.
- Lower-arm and hand pose locations are zero or negligible.
- Exported VRMA contains no non-hips translation tracks and re-imports successfully.
