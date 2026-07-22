# Mona Experience Phase 1 — Design QA

## Evidence

- Source visual truth: `docs/superpowers/specs/assets/mona-experience-concept-3.png` (`1487 x 1058` pixels).
- Desktop implementation: `docs/superpowers/qa/mona-experience-phase-1-ready.png` (`1440 x 1024` pixels), CSS viewport `1440 x 1024`, device scale factor `1`, route `/`, ready state, one canvas.
- Mobile implementation: `docs/superpowers/qa/mona-experience-phase-1-mobile.png` (`390 x 844` pixels), CSS viewport `390 x 844`, device scale factor `1`, route `/`, ready state, one canvas.
- Browser interaction verification: authorized Chrome extension at `http://127.0.0.1:5173/`.
- Capture method: after Chrome interaction verification, the user authorized standalone Playwright Chromium solely for the exact desktop/mobile screenshots and recaptures. It was not used as a substitute for Chrome interaction, focus, console, or route verification.
- Density normalization: source and implementation are all 1x raster evidence. The source was normalized to the desktop panel size only inside the comparison board; the committed implementation screenshots retain their exact native pixels.
- Full-view combined input: `docs/superpowers/qa/mona-experience-phase-1-comparison-final.png` places the source, desktop implementation, and mobile implementation in one durable board.
- Focused combined input: `docs/superpowers/qa/mona-experience-phase-1-comparison-focus.png` places source/implementation header, marker/Thai-copy, and Mona/hair crops together. Focused evidence was required because brand weight, Thai copy, and spring-bone hair state were too small to judge reliably in the full-width board.

## Browser and State Verification

- Loading: Chrome showed `กำลังเตรียมโลก 3D`, `กำลังพา Mona เข้าสู่ฉาก`, and real progress at 52% before readiness; Start was absent.
- Ready: Chrome showed `ฉากพร้อมแล้ว` and one `เริ่ม` button only after Mona parsed; the main phase was `ready` and exactly one canvas remained mounted.
- Focus: keyboard Tab focused the Start button with a visible solid 2.4 px outline.
- Entered: keyboard Enter reached `data-experience-phase="entered"`, removed the Start button, and retained exactly one canvas.
- Console: the final Chrome reload, ready/entry interaction, `/lessons` visit, and return to `/` produced no errors or warnings. The runtime now uses `THREE.Timer`, so the previous `THREE.Clock` deprecation is gone.
- Lessons: direct `/lessons` navigation rendered the existing course map and lesson cards.

## Final Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The source concept contains plants, large architectural rings, layered platforms, a luminous floor path, and a back control that are intentionally absent from Phase 1. The approved design treats the concept as art direction and explicitly excludes complex environmental assets and navigation expansion.

## Required Fidelity Surfaces

- Fonts and typography: the implementation uses the existing Inter/system/Noto Sans Thai stack with comparable bold display weight, compact line height, and clear logo/Start hierarchy. The focused crop confirms legible Thai glyph rendering and no wrapping or truncation at either viewport.
- Spacing and layout rhythm: desktop preserves the source's left marker/right Mona composition with a quiet header and broad spatial field. Mobile keeps the brand, Mona, full marker, Start control, and credit within the viewport without overflow or clipped persistent controls.
- Colors and visual tokens: forest sky, pale-mint grounded plane/grid, warm amber marker, and off-white text now reproduce the intended forest/mint/amber balance. Contrast remains clear in ready and focus states.
- Image quality and asset fidelity: the runtime uses the real Mona VRM and a real Three.js torus marker. Final world transforms are applied before world matrices are refreshed and the spring manager is reset, so Mona's ponytail now falls naturally instead of being flung vertically from stale spring state. No concept raster, CSS/div illustration, fake SVG, emoji, or placeholder imagery is used. The simpler Phase 1 world is an approved scope constraint rather than an asset substitution.
- Copy and content: loading, ready, Start, brand, and Mona credit copy are coherent and correctly rendered in Thai/English. The ready and Start copy sit inside the spatial marker at both captured viewports.
- States, accessibility, and responsiveness: loading, ready, keyboard focus, entered, one-canvas persistence, desktop, and narrow-screen behavior were verified. The DOM button remains the accessible control aligned with the Three.js marker.

## Comparison History

### Initial comparison — blocked by three material findings

Evidence: initial working comparison iteration recorded below; final durable boards supersede the non-final scratch board.

- [P1] The desktop amber marker was cropped by the left edge and the mobile marker was completely outside the viewport. The DOM Start copy sat below the marker instead of inside it.
- [P2] Mona read centered and nearly front-on on desktop instead of right-weighted at a three-quarter angle.
- [P2] The scene was almost uniformly dark forest green; the pale-mint spatial ground and forest/mint/amber balance from the source were missing.

Fixes:

- Added a test-first responsive composition contract for desktop camera target and mobile marker position/scale.
- Adjusted the desktop camera target to produce the source's left-marker/right-Mona balance.
- Increased Mona's static yaw to a clear three-quarter presentation, with the existing controller test changed before implementation and observed failing.
- Added a minimal real Three.js mint floor beneath the existing grid, tuned forest fog/background and lighting, and brightened the real torus material.
- Aligned the responsive DOM ready/Start block with the marker.
- Verified fix commit: `bdfb590 fix: refine Mona entry composition`.

### Second comparison — one mobile P1 remained

Evidence: second working comparison iteration recorded below; final durable boards supersede the non-final scratch board.

- Desktop P1/P2 findings were resolved.
- [P1] On mobile, the marker intersected the floor plane, leaving only an arc visible.

Fixes:

- Updated the responsive composition regression first and observed the focused test fail with the old mobile coordinates.
- Raised, reduced, and shifted the mobile torus so its complete circumference remains visible, then aligned the mobile Thai copy to its center.
- Added the explicit shared tuple type required by the production TypeScript build after the full gate exposed union-tuple spread inference; verified in `869ea2c fix: type Mona responsive composition`.

### Whole-branch review correction — spring-bone P1

- [P1] The previously committed ready-state evidence showed Mona's ponytail stretched vertically because spring bones were updated from stale world state after the final root transform and humanoid pose.

Fixes:

- Added a spring manager fake and strict test order for humanoid pose update → scene attachment → `updateMatrixWorld(true)` → `springBoneManager.reset()`.
- Added disposal-order coverage proving scene removal precedes deep disposal.
- Verified fix commit: `3ec6d59 fix: reset Mona spring bones after posing`.
- Replaced both exact screenshots after the fix; the focused Mona crop shows the ponytail falling behind the head/body at both ready-state viewports.

### Final comparison — passed

Evidence: `docs/superpowers/qa/mona-experience-phase-1-comparison-final.png` and `docs/superpowers/qa/mona-experience-phase-1-comparison-focus.png`.

- Desktop and mobile markers are complete, aligned with the DOM control, and retain practical breathing room.
- Mona is visible at a distance, statically posed, staged at a desktop three-quarter angle, and has natural downward spring-bone hair at both viewports.
- Typography, copy, spatial rhythm, colors, real asset quality, and responsive behavior have no actionable P0/P1/P2 drift.

## Verification

- `npm test`: 12 files, 37 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed. The eager entry fell from `1,022.12 kB` to `271.04 kB`; `ExperiencePage` (`191.25 kB`) and Three.js (`560.51 kB`) are separate chunks, so `/lessons` no longer pays the Mona runtime entry cost.
- `npx playwright test --workers=1`: the deterministic full E2E gate passed all 7 tests, including Mona and the existing guided-code flow.
- `git diff --check`: passed.
- The prior intermittent `.cm-content` timeout did not reproduce, so no editor-readiness workaround, retry, or timeout inflation was added.
- Two fresh default-parallel `npm run test:e2e` runs passed Mona but exposed the existing guided-code worker's internal 1.5-second watchdog under seven-worker load (6 passed, 1 failed). The focused guided-code case then passed 3/3, and the full sequential gate passed 7/7. This is recorded as an inherited non-Mona concurrency flake; unrelated lesson behavior and timeouts remain unchanged.
- Known non-blocking environmental output retained without scope expansion: `NO_COLOR` is ignored when `FORCE_COLOR` is set.

## Implementation Checklist

- [x] Exact ready-state desktop and mobile evidence captured.
- [x] Source and implementation compared in combined full-view and focused inputs.
- [x] Every P0/P1/P2 finding fixed and visually rechecked.
- [x] Behavior changes covered by observed failing-then-passing regression tests.
- [x] Final unit, lint, build, E2E, and diff gates passed.

final result: passed
