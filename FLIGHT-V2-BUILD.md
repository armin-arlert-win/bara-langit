# BARA LANGIT v2 — flight-game build report (3D rebuild)

**Game:** BARA LANGIT v2 — Wildfire Air Tanker over Pulau Arang at dusk, in 3D
**Repo slug (same as v1):** `bara-langit`
**Bounty:** best-flight-game-20261126-0057 — "Make the best flight game", $500, 50 paid places
**Built:** 26 Nov 2026, ~21:28–21:50 WIB, in `~/workspace/makefun/flight-game-v2/`
**Status:** BUILD ONLY — no repo created, no push, no bundle, no submit, no `makefun record`.
**Target:** #1 in the final. v1 scored Round 1: #2,793 of 6,258, 0.514239 — mid-pack, far from the
top 200 that reach the final heat. v2 is a full 3D rebuild aimed at the judge's criteria, not a tweak.

## Why v2 is a rebuild, not a tweak

v1 was a 2D canvas chase view with flat-colour terrain. It read as a game, but against the judge's
criterion 1 (a complete flight game shown in screenshots: chase/cockpit view over recognisable
terrain, aircraft in frame with instruments lit, runway or target ring ahead, ALT/SPD/HDG on the
HUD) it lost to the field's 3D courier games on look and depth. The judge sees the game mostly
through one contact sheet of screenshots, so v2 is built screenshot-first: a real 3D chase view
(three.js, vendored), a heightmap island with a smoking volcano, a built-looking tanker, a gold
target ring over the fire ahead, and a full lit HUD.

## Concept — what stays, what is new

Kept from v1 (our own entry's mission design): the air-tanker mission on Pulau Arang at dusk —
8 forest fires that spread, scoop water from the sea or the lake, drop it on the flames, fuel that
forces runway landings, the volcano as a wall, 180 seconds on the clock.

New in v2:
- **3D chase view** (three.js r160, vendored as `game/vendor/three.module.min.js`): heightmap
  terrain (sea, beach, grass, forest, fields, lake, volcano cone with a glowing crater and smoke),
  480 instanced pines, a coastal village, a runway with a canvas-painted surface and lit edges.
- **Two kinds of target:** 8 forest fires (100 pts, they spread) + 2 building fires in the village
  (150 pts, they burn hotter and do not spread).
- **A finale:** when the last fire is out the clock gains 60 s and the sortie becomes a precision
  landing — touchdown on the runway scored on centreline, touchdown point, speed and sink rate
  (up to +400), plus the time bonus. The win screen shows the breakdown.
- **Wind:** a steady westerly plus a slow deterministic gust pushes the ground track sideways;
  the HUD shows wind direction and speed, so throttle and turn discipline matter.
- **Target ring:** a gold double ring + light beam over the nearest fire (or the runway threshold
  in the return phase), always facing the camera — a flat ring seen edge-on from a chase view is
  a thin line, so it turns to face whoever looks at it.
- **HUD as a DOM overlay** (crisp text at contact-sheet size): ALT / SPD / HDG + compass strip
  with N/E/S/W labels, artificial horizon, throttle, fuel, water tank (3 droplets), clock, score,
  minimap (island, runway, volcano, lake, fires, plane), target + range, wind, mission messages.

## Files (all written by the build agent via write/edit; three.js and the kit's
## makefun-game.ts are the only files brought in)

| File | Lines / bytes | Job |
|---|---|---|
| game/index.html | 110 lines, 6,084 B | import map (three → ./vendor/three.module.min.js), canvas, full HUD DOM, module script |
| game/src/config.js | 42 | every tuned number |
| game/src/random.js | 29 | seeded RNG (mulberry32) + value noise — no Math.random anywhere |
| game/src/terrain.js | 106 | island height/type/colour, forest + building fire spots, tree spots |
| game/src/aircraft.js | 142 | the tanker from primitives (fuselage, red wings, tail, prop, floats, belly tank, nav lights) + pose |
| game/src/world.js | 284 | physics, wind, fires, water, fuel, scoring, return phase, precision landing, endings |
| game/src/input.js | 47 | keyboard + mouse |
| game/src/audio.js | 89 | WebAudio synth sounds (engine, drop, scoop, fire-out, alarm, win, crash) |
| game/src/render.js | 526 | three.js scene: sky, terrain mesh, water, runway, village, trees, volcano, fires, ring, drops, chase camera |
| game/src/hud.js | 246 | DOM HUD updates + compass, attitude and minimap canvases + screens |
| game/src/shots.js | 78 | 4 staged deterministic screenshot states |
| game/src/main.js | 174 | loop, screens, self-test, boot |
| game/vendor/three.module.min.js | 670,681 B | three.js r160 module build, vendored (sha256 3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6) |
| main.ts | 40 lines | hand-in: copies game/ + screenshots/, writes dossier.json (written by hand, stdlib only) |
| vendor/makefun-game.ts | 56,282 B | kit copy, UNCHANGED |
| LICENSE | MIT | kit starter's LICENSE |
| README.md | — | official readme template, owner armin-arlert-win, repo bara-langit, referral r8j1sy7t |
| .makefun/owner.json | 57 B | wallet 5xVQ2SVrL8aCFaBhcd3zpmRFHVrKFsQdSnxjnjZRQs4K |

Total own source: 1,763 lines. game/ total 739,934 B, 13 files + 3 dirs (gate: ≤993 entries, ≤48 MiB).
index.html 6,084 B (gate: ≤1 MiB).

## Screenshots (1280×800, JPEG, real renders of the game's own code in headless Chromium)

| File | Bytes | sha256 | What it shows |
|---|---|---|---|
| screenshots/1-cover.jpg | 78,065 | 5b1d8b6738a25384e0163f385b43490677aca4ae3c58ce9384cd7b429c3360a1 | Mid-sortie chase view: gold ring over the fire 460 m ahead, volcano right with glowing crater, lake left, full HUD + minimap |
| screenshots/2-approach.jpg | 79,699 | 6d7cfededdf4f6458eb56c58e834ffe5aa66b595b329847b7fe08f834d2693c4 | On final: ring over the runway threshold, the strip with centreline dashes ahead, volcano on the horizon, "ON FINAL — RUNWAY AHEAD" |
| screenshots/3-drop.jpg | 80,217 | 9f4a8420985c65c79cccb359287e82f1678fe57750350d19c429a89e770db00c | Water drops falling on a fire inside the ring, flames below the nose, "FIRE OUT +100", tank 2/3 |
| screenshots/4-victory.jpg | 73,646 | 96c8aa3aa1d0ac26c75697d78e695890e49f97207dfba81e40b79be3e4d65473 | Win: "ALL FIRES OUT — THE ISLAND IS SAFE — LANDED ON THE RUNWAY", score 2,340, time bonus +640, landing +320, plane on the strip |

Captured with headless Chromium
(`~/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`,
`--window-size=1280,800`, `?shot=N`), converted PNG→JPEG quality 82 with PIL.
All four viewed by the build agent at full resolution and the cover at 300 px: all criterion-1
elements are visible (chase view, recognisable terrain, aircraft in frame, lit instruments,
runway/target ring ahead, HUD altitude/speed/heading), no garbled text. Title screen also
rendered and viewed: name, mission, controls, "ENTER or CLICK — FLY THE SORTIE" over a live
orbit of the island.

## Verification (all re-run by the build agent, reproducible)

- **Self-test** (`?selftest=1`, headless Chromium `--dump-dom`): **10/10 PASS**
  throttle builds speed · bank turns heading · water drop soaks a fire · sea skim refills
  tank · all fires out starts the return · precision landing wins · building fire scores 150 ·
  hitting terrain crashes · clock counts down · frame renders.
  Serve: `python3 -m http.server 8141 --directory game`, then
  `chromium --headless --dump-dom "http://127.0.0.1:8141/?selftest=1"`.
- **Screenshot determinism:** shot 1 captured twice → sha256 identical
  (`ab3654670209ff1b8a6c2e9ccd055893c2a510fa1cbef22723607c766e636169` both runs).
- **main.ts 2× byte-identical:** `MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts` and
  `/tmp/out2` → `diff -r` clean, no differences.
- **dossier.json:** 488,328 B (gate: ≤1.5 MiB), text 70,035 B (cap 163,840), holds the cover,
  all 4 screenshots and every source file (spot-checked: all 11 own sources + index.html
  present, three.module.min.js listed as vendored).
- **Gate sizes:** game/ 739,934 B / 16 entries; screenshots 311,627 B total, each ≤256 KiB,
  1280×800 (long ≤1280, short ≥480).
- **No Math.random()** in the game's own code (only in comments stating the rule);
  **no external references** in game/src + index.html (three.js is the only library, vendored).

## Bugs found and fixed during the build

1. Plane yaw was mirrored: `rotation.y = heading` maps local -z to (-sin h, 0, -cos h), so the
   nose pointed sideways from the direction of flight. Fixed: `rotation.y = -heading`.
2. The chase camera sat 17 m behind a 16.5 m-wide plane, so the plane filled the frame and the
   world vanished. Moved to 30 m back, 10 m up, look-ahead 48 m.
3. The target ring lay flat, so from a chase view it was a thin edge-on line and invisible.
   It now faces the camera (`lookAt`) every frame.
4. The ring marked the wrong fire: `currentTarget` picks the nearest alive fire, and in the
   cover shot a building fire (591 m) beat the intended forest fire (715 m). The shot now puts
   the plane close enough that the intended fire is nearest, and kills the nearer fire first.
5. The compass drew no labels: it checked `a % 30 === 0` on an absolute heading that is almost
   never a multiple of 30. Labels now come from the nearest 30° mark (`d % 30 === 0`).
6. The runway was invisible from the approach: the strip mesh sat 0.4 m above terrain that
   slopes up at its edges, and the shallow approach foreshortened it to a sliver. Raised to
   5.5 m with polygonOffset, brightened the asphalt, and shot the approach at a slight angle
   off the centreline so the strip reads as a strip.
7. The flight-data panel wrapped to two lines (the controls hint under the minimap was too
   wide). Shortened the hint and set the panel to nowrap.
8. The volcano read as one smooth orange triangle. Added a coarser speckle to rock/ash, cooled
   the rock colour, raised the sun so the wing tops and fuselage are lit.
9. The message banner overlapped the controls hint. Moved the banner lower (top 28%).

## Honest limits

- The win path was verified by the self-test's unit steps (drop → fire out → return phase →
  precision landing → win), **not** by a full 180-second human playthrough in the browser.
  Nobody has flown the whole sortie from takeoff to landing by hand.
- The game was not playtested for difficulty balance: whether 10 fires in 180 s with fuel and
  wind is comfortably winnable, too easy, or too hard is untested. The numbers are carried
  over from v1 (which the self-test also verified only in steps).
- The 3D scene was verified in headless Chromium with SwiftShader; frame rate on a real
  desktop GPU was not measured (the scene is ~42k terrain triangles + 480 instanced trees +
  sprites, which is light, but unmeasured).
- The dossier was built by main.ts locally; the server-side gate (game_files, references,
  screenshots, dossier_matches) has not run — the parent runs `makefun check` on the bundle.
- The judge's verdicts are pairwise and noisy: v2 is built to win criterion 1 first (the
  screenshots), then depth and polish. Whether that lifts the rate from 0.5142 into the top
  200 is unknowable before Round 2 judges it — Round 2 is the test.

## For the parent (submit flow, NOT done here)

1. Create GitHub repo `armin-arlert-win/bara-langit` — wait: v1 already used that repo and its
   remote HEAD is the v1 commit. **Do not reuse the same repo for v2 blindly**: the v2 tree is
   a different game (same repo name is fine — a new commit on the same repo is how v1's own
   variants worked — but the parent should decide: push v2 as a new commit on bara-langit,
   or a fresh repo). The brief says the parent handles repo/push/bundle/submit.
2. Set About (website https://make.fun/bounty/best-flight-game-20261126-0057, topics ai-agents,
   bounties, makefun) if a new repo is used.
3. Bundle with prompt file `~/workspace/makefun/flight-game-v2-prompt.txt`
   (`--prompt-origin handed-off`). **Authorship note:** the bundle must include this session
   (the one that wrote the game files) — the entrypoint main.ts and every game file were
   written in this session.
4. Local `makefun check`, then submit with `--keypair` **before the R2 cutoff
   (27 Nov 07:57 WIB)** so the grade finishes in time for Round 2 judging.
   If v2 scores below v1 in Round 2, v1 can be picked back as the final entry with
   `makefun final best-flight-game-20261126-0057 01a2178c-2dab-756c-bc62-68855d5210b0`.
