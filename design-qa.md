# Mona Experience Phase 1 — Design QA

## Evidence

- Source visual truth: `docs/superpowers/specs/assets/mona-experience-concept-3.png` (`1487 x 1058` pixels).
- Desktop implementation: `docs/superpowers/qa/mona-experience-phase-1-ready.png` (`1440 x 1024` pixels), CSS viewport `1440 x 1024`, device scale factor `1`, route `/`, ready state, one canvas.
- Mobile implementation: `docs/superpowers/qa/mona-experience-phase-1-mobile.png` (`390 x 844` pixels), CSS viewport `390 x 844`, device scale factor `1`, route `/`, ready state, one canvas.
- Browser interaction verification: authorized Chrome extension at `http://127.0.0.1:5173/`.
- Capture method: after Chrome interaction verification, the user authorized standalone Playwright Chromium solely for the exact desktop/mobile screenshots and recaptures. It was not used as a substitute for Chrome interaction, focus, console, or route verification.
- Density normalization: source and implementation are all 1x raster evidence. The source was normalized to the desktop panel size only inside the comparison board; the committed implementation screenshots retain their exact native pixels.
- Full-view combined input: `.superpowers/sdd/task-7-comparison-final.png` places the source, desktop implementation, and mobile implementation in one board.
- Focused combined input: `.superpowers/sdd/task-7-comparison-focus.png` places source/implementation header crops and marker/Thai-copy crops together. Focused evidence was required because brand weight and Thai copy were too small to judge reliably in the full-width board.

## Browser and State Verification

- Loading: Chrome showed `กำลังเตรียมโลก 3D`, `กำลังพา Mona เข้าสู่ฉาก`, and real progress at 52% before readiness; Start was absent.
- Ready: Chrome showed `ฉากพร้อมแล้ว` and one `เริ่ม` button only after Mona parsed; the main phase was `ready` and exactly one canvas remained mounted.
- Focus: keyboard Tab focused the Start button with a visible solid 2.4 px outline.
- Entered: keyboard Enter reached `data-experience-phase="entered"`, removed the Start button, and retained exactly one canvas.
- Console: no local application errors. Two external MSN errors predated navigation in the claimed Chrome tab and were excluded by URL. The known inherited `THREE.Clock` deprecation remains a warning only.
- Lessons: direct `/lessons` navigation rendered the existing course map and lesson cards.

## Final Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The source concept contains plants, large architectural rings, layered platforms, a luminous floor path, and a back control that are intentionally absent from Phase 1. The approved design treats the concept as art direction and explicitly excludes complex environmental assets and navigation expansion.

## Required Fidelity Surfaces

- Fonts and typography: the implementation uses the existing Inter/system/Noto Sans Thai stack with comparable bold display weight, compact line height, and clear logo/Start hierarchy. The focused crop confirms legible Thai glyph rendering and no wrapping or truncation at either viewport.
- Spacing and layout rhythm: desktop preserves the source's left marker/right Mona composition with a quiet header and broad spatial field. Mobile keeps the brand, Mona, full marker, Start control, and credit within the viewport without overflow or clipped persistent controls.
- Colors and visual tokens: forest sky, pale-mint grounded plane/grid, warm amber marker, and off-white text now reproduce the intended forest/mint/amber balance. Contrast remains clear in ready and focus states.
- Image quality and asset fidelity: the runtime uses the real Mona VRM and a real Three.js torus marker. No concept raster, CSS/div illustration, fake SVG, emoji, or placeholder imagery is used. The simpler Phase 1 world is an approved scope constraint rather than an asset substitution.
- Copy and content: loading, ready, Start, brand, and Mona credit copy are coherent and correctly rendered in Thai/English. The ready and Start copy sit inside the spatial marker at both captured viewports.
- States, accessibility, and responsiveness: loading, ready, keyboard focus, entered, one-canvas persistence, desktop, and narrow-screen behavior were verified. The DOM button remains the accessible control aligned with the Three.js marker.

## Comparison History

### Initial comparison — blocked by three material findings

Evidence: `.superpowers/sdd/task-7-comparison-initial.png`.

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

Evidence: `.superpowers/sdd/task-7-comparison-pass-2.png`.

- Desktop P1/P2 findings were resolved.
- [P1] On mobile, the marker intersected the floor plane, leaving only an arc visible.

Fixes:

- Updated the responsive composition regression first and observed the focused test fail with the old mobile coordinates.
- Raised, reduced, and shifted the mobile torus so its complete circumference remains visible, then aligned the mobile Thai copy to its center.
- Added the explicit shared tuple type required by the production TypeScript build after the full gate exposed union-tuple spread inference; verified in `869ea2c fix: type Mona responsive composition`.

### Final comparison — passed

Evidence: `.superpowers/sdd/task-7-comparison-final.png` and `.superpowers/sdd/task-7-comparison-focus.png`.

- Desktop and mobile markers are complete, aligned with the DOM control, and retain practical breathing room.
- Mona is visible at a distance, statically posed, and staged at a desktop three-quarter angle while remaining visible on mobile.
- Typography, copy, spatial rhythm, colors, real asset quality, and responsive behavior have no actionable P0/P1/P2 drift.

## Verification

- `npm test`: 12 files, 36 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; inherited >600 kB chunk warning remains non-blocking.
- `npm run test:e2e`: 7 tests passed.
- `git diff --check`: passed.
- Known non-blocking debt retained without scope expansion: large entry chunk, inherited `THREE.Clock` deprecation, and environmental `NO_COLOR`/`FORCE_COLOR` warning.

## Implementation Checklist

- [x] Exact ready-state desktop and mobile evidence captured.
- [x] Source and implementation compared in combined full-view and focused inputs.
- [x] Every P0/P1/P2 finding fixed and visually rechecked.
- [x] Behavior changes covered by observed failing-then-passing regression tests.
- [x] Final unit, lint, build, E2E, and diff gates passed.

final result: passed
