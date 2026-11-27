# BARA LANGIT v3 — flight-game assessment + build report

**Built:** 27 Nov 2026, ~13:00–14:10 WIB, in `~/workspace/makefun/flight-game-v3/`
**Status:** BUILD + VERIFY ONLY — local commit `2c1fd6d`, no remote, no push,
no bundle, no submit, no `makefun record`. The parent decides with King.
**Bounty:** best-flight-game-20261126-0057, $500, 50 places. R3 cutoff 27 Nov
19:57 WIB, final/deadline 28 Nov 07:57 WIB. Counted entry is still v1
(01a2178c, re-picked 27 Nov 09:47 WIB).

## 1. Why v2 scored lower than v1 — evidence, not guessing

Scores: v1 R1 **0.514239** (#2,793/6,258) · v2 R2 **0.410299** (#6,404/13,681).
Both rates are measured against the same four fixed house games, so the field
growing 6,258 → 13,681 does not explain the rate drop; the judge genuinely
picked v2 less often against the same opponents. (Noise caveat: 12 games each,
the judge is noisy — a 0.10 gap is meaningful but not conclusive.)

I compared all 8 screenshots side by side. Both entries tick criterion 1 on
paper (chase view, plane in frame, HUD ALT/SPD/HDG, runway in shot 2, mission
arc across 4 shots). The difference is **legibility at contact-sheet scale**
— the judge sees the cover fitted in 768×480 and the other three in small
cells:

| Element | v1 (2D flat) | v2 (3D) |
|---|---|---|
| Runway, shot 2 | bold black strip + white dashes, unmistakable | thin brown dirt strip, barely distinct from terrain (v2's own build doc admits it was "invisible from the approach… foreshortened to a sliver") |
| Fire, shot 3 | big orange flame + gold diamond + "FIRE OUT +100" + visible splash | small flame half-hidden behind the plane, water = tiny blue puff |
| Victory, shot 4 | bright sunset + huge yellow "ALL FIRES OUT" | dark muddy brown, tiny plane, low contrast |
| Palette | flat high-contrast: deep blue → orange sunset, white/red plane on green | muted purple sky, brown-green terrain, 480 cone trees = noise at small size |
| Plane | white fuselage / red wings / blue belly, reads instantly | red-cross toy look, thin black prop line |

Two more points:
- **v2's extra depth was invisible.** Building fires, precision landing and
  wind exist in code, but the judge never plays the game — depth only counts
  if it shows in screenshots or the source outline. v2 paid a legibility cost
  for depth the judge could not see.
- **Criterion 4 (look):** v1's flat sunset style is distinctive and coherent;
  v2's low-poly primitives look generic, like many three.js demos.

**Lesson: for this screenshot-first judge, legibility at small scale beats 3D
polish. v1's formula was right; v2 fixed the wrong thing.**

## 2. The v3 approach — a different lever, not more polish

v3 returns to v1's flat 2D high-contrast style (proven legibility) and fixes
the exact criterion-1 gaps v1 left, so the improvement is visible in the
screenshots themselves:

1. **Gold target ring in EVERY gameplay shot.** Criterion 1 literally asks
   for "a runway or a target ring ahead". v1 had no ring at all; v2's ring
   was a 3D object that could hide behind the plane. v3's ring is drawn in
   screen space (double gold ring + "FIRE 796 m" / "RUNWAY 1017 m" label) —
   it can never be edge-on or occluded.
2. **Lit dial instruments.** v1 had HUD text + an attitude ball. v3 adds a
   bottom instrument panel with three round glowing dials (ALT / SPD / HDG
   compass) + attitude ball + throttle bar — "instruments lit", not just text.
3. **Visible multi-phase depth.** Three phases with an on-screen checklist:
   PHASE 1 forest fires 6/6 → PHASE 2 town fires 2/2 → PHASE 3 precision
   landing, with a phase chip in the top bar. Depth the judge can SEE.
4. Everything that made v1 legible is kept: vivid sunset, bold banners,
   black runway with white dashes, big flames, bright victory screen.

**Honest odds.** Probability v3 beats v1's 0.514: **~45–55% — a coin flip with
a slight edge.** It keeps what worked and adds the missing checklist items,
but the judge is noisy and v2 proved preferences here are hard to move.
**Even if v3 scores 0.55–0.60 it almost certainly does NOT reach the top 200**
(v1 at 0.514 is #2,793; the final heat takes the top 200 of ~13,700, i.e. the
top ~1.5%). Prize EV of v3 ≈ $0 either way. Its value is optionality: a
second ticket with a better criterion-1 sheet, and a re-pickable fallback —
if v3 scores below v1, v1 can be picked back with `makefun final` before the
28 Nov 07:57 WIB deadline. **Do not sell v3 to King as a prize-zone play.**
It is a credible, cheap, reversible experiment — nothing more.

## 3. The game

Same concept as v1/v2 (our own entry's mission, Pulau Arang at dusk):
airtanker, 6 forest fires → 2 hotter town fires → precision landing, scoop
water low over sea/lake, fuel forces runway refuel, fires spread on a timer,
wind pushes the ground track, 210 s clock (+60 s for phase 3). All code
written fresh in this session (no files copied from v1/v2 — the transcript
gate counts copied lines against the author; the kit's `vendor/makefun-game.ts`
and `LICENSE` are kit copies, unchanged, as the rules require).

| File | Lines | Job |
|---|---|---|
| game/index.html | 27 | canvas + script order |
| game/src/config.js | 33 | every tuned number |
| game/src/random.js | 28 | seeded RNG + value noise (no `Math.random` string anywhere) |
| game/src/terrain.js | 79 | island type/height, fire spots, runway, lake, town |
| game/src/input.js | 27 | keyboard |
| game/src/audio.js | 47 | WebAudio synth |
| game/src/world.js | 235 | physics, fires, water, fuel, phases, scoring, endings |
| game/src/render.js | 339 | sky, ground slices, volcano, runway, fires, ring, plane |
| game/src/hud.js | 232 | HUD, lit dials, minimap, checklist, screens |
| game/src/shots.js | 96 | 4 staged deterministic screenshot states |
| game/src/main.js | 149 | loop, input edges, self-test |
| main.ts | 34 | hand-in (stdlib only, kit-starter pattern) |

## 4. Screenshots (1280×800 JPEG, real renders, frozen clock)

| File | Bytes | What it shows |
|---|---|---|
| screenshots/1-cover.jpg | 92,651 | Phase 1: ring on the forest fire dead ahead ("FIRE 796 m"), volcano + smoke right, sun left, full HUD + 4 dials + checklist, "SPACE — DROP WATER" |
| screenshots/2-approach.jpg | 96,652 | Phase 3: on final, black runway + dashes + gold ring on the threshold ("RUNWAY 1017 m"), "ON FINAL — RUNWAY AHEAD", checklist 6/6 + 2/2 |
| screenshots/3-drop.jpg | 95,835 | Phase 2: town fire going out inside the ring, "TOWN FIRE OUT +150", tank 2/3, checklist FOREST 6/6 ✓ |
| screenshots/4-victory.jpg | 82,092 | "ALL FIRES OUT — THE ISLAND IS SAFE — LANDED ON THE RUNWAY", SCORE 2,340 · time +640 · landing +320 |

A simulated judge contact sheet (cover 768×480 + 3 small cells) was viewed:
the cover reads completely at that size and all three small cells still show
their banner + ring + fire. Title screen also rendered and viewed (orbit over
the island, fires visible).

## 5. Verification (all re-run after the last edit)

- **Self-test** (`?selftest=1`, headless Chromium): **8/8 PASS** — throttle
  builds speed · bank turns heading · drop soaks a fire · sea skim refills
  tank · last forest fire advances the phase · precision landing wins ·
  terrain strike crashes · clock counts down.
- **Screenshot determinism:** each of the 4 shots captured twice → PNG pixels
  byte-identical both runs.
- **main.ts 2× byte-identical:** `MAKEFUN_OUTPUT_DIR=/tmp/v3f1` vs `/tmp/v3f2`
  → `diff -r` clean.
- **Dossier:** 549,650 B (gate ≤1.5 MiB), holds the cover, all 4 screenshots
  and every source file (spot-checked: world.js, render.js, hud.js, shots.js,
  index.html, 1-cover.jpg).
- **Gate sizes:** game/ 57,229 B / 14 entries (≤993, ≤48 MiB); index.html
  994 B (≤1 MiB); each screenshot ≤256 KiB, 1280×800 (long ≤1280, short ≥480).
- **No `Math.random`** string in any source; **no external references** in
  index.html or game/src; `node --check` passes on all 10 JS files.
- **Local git:** `2c1fd6d` "BARA LANGIT v3 — 2D tanker, three visible phases,
  ring + dials", no remote configured, clean tree.

## 6. Bugs found and fixed during the build

1. Volcano cone rendered as a flat sliver: its base was sampled at the centre
   height (the centre IS the peak). Base now uses the foot height (30 m).
2. First approach shot was staged over the lake: the whole foreground was
   water and the runway was a line at the horizon. Re-staged from the east,
   offset 120 m off the centreline so the strip reads clear of the plane.
3. First cover shot put a fire 18 m ahead and 499 m right of the plane, so
   the ring pinned to the screen edge. Fire list re-staged; the ring now sits
   dead ahead on the target.
4. Victory shot's lower half was empty: at alt 4 m the terrain ahead is
   higher than the camera, so the ground projected above the horizon. The
   chase camera now has a 55 m projection floor (also fixes the takeoff /
   landing roll view).
5. Title orbit camera aimed away from the island (heading formula wrong);
   it now aims at the volcano from a 1,800 m orbit.
6. Checklist showed "TOWN FIRES ✓ 0/0" in phase 1 because the town fires
   were not in the staged list; they are now listed alive from the start.
7. Headless Chrome's `--window-size` includes ~85 px of chrome: viewport =
   window − 85. Screenshots were taken at 1280×885 and cropped to the
   1280×800 canvas (top rows); the fixed-CSS canvas of the first attempt
   clipped the HUD, which is why the first batch lost the top bar.

## 7. Honest limits

- The win path was verified by the self-test's unit steps, **not** by a full
  210-second human playthrough. Difficulty balance (10 fires + spread in
  210 s with fuel and wind) is untested by hand.
- The judge's verdicts are pairwise and noisy: whether v3 beats 0.514 is
  unknowable before Round 3 judges it — Round 3 is the test.
- The transcript gate has not run (no bundle, no submit by design): the code
  was written fresh in this session, `main.ts` follows the kit starter's
  pattern, and no files were copied from v1/v2 — but the server-side gate is
  the parent's check at bundle time.
- No claim code, no private key, nothing secret is stored in this repo
  (`.makefun/owner.json` is NOT included — the parent adds it at submit time
  if King approves).

## For the parent (submit flow, NOT done here)

1. Decide with King: submit v3 (new commit on repo `bara-langit` OR a fresh
   repo — v1 already occupies `bara-langit` at remote HEAD `8b3f47ff`; a new
   commit on the same repo is how v1's own variants worked, but the parent
   decides) **before the R3 cutoff (27 Nov 19:57 WIB)** so the grade finishes
   in time for Round 3 judging.
2. If v3 scores below v1 in Round 3, pick v1 back as the final entry with
   `makefun final best-flight-game-20261126-0057 01a2178c-2dab-756c-bc62-68855d5210b0`
   before the deadline (28 Nov 07:57 WIB). The pick is the safety net that
   makes this experiment reversible.
3. Bundle must include this session (`fcf46597-5ddd-48cb-8f91-dab5232a13f7`,
   the one that wrote every game file) for the transcript gate.
