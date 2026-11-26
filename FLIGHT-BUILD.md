# BARA LANGIT — flight-game build report

**Game:** BARA LANGIT — Wildfire Air Tanker over Pulau Arang at dusk
**Repo slug (chosen):** `bara-langit`
**Bounty:** best-flight-game-20261126-0057 — "Make the best flight game", $500, 50 paid places
**Built:** 26 Nov 2026, ~17:50–18:35 WIB, in `~/workspace/makefun/flight-game-entry/`
**Status:** BUILD ONLY — no repo created, no push, no bundle, no submit, no `makefun record`.

## Concept — why it differs from the field

Field intel (from `/tmp/flight-comp2.json`, 5,207 submissions, verified by parent):
"courier" in 1,488 titles, "island" 737, "ring" 432, "mail" 366, "skyline" 331,
"kestrel" 290. The dominant concept is a courier/mail ring-run over an island
or canyon. This entry is none of those:

- **Mission, not a route:** 8 forest fires burn across Pulau Arang, a volcanic
  island at dusk. The player flies an airtanker, scoops water from the sea or
  the lake, and drops it on the flames. Fires spread while the clock runs.
- **Decisions, not laps:** fuel (land on the runway to refuel), water (3 drops
  per tank, scoop low and slow over water), and the volcano as a wall.
- **Title check:** exact title "Bara Langit" appears in 0 of 5,207 submissions
  (checked against `/tmp/flight-comp2.json`). "Sembur" 0, "pemadam" 0, "firefight" 0.
  Tanker entries exist (~10–13: Ashwing, TIRTA API, FIRELINE, SCOOPER 41) but the
  concept is a small minority against 1,488 couriers. No commercial game is
  copied: name, island, aircraft and art are original.

## The game

- 2D canvas, vanilla JS, no libraries. All art drawn in code; all sound is
  WebAudio synth (engine drone, drop whoosh, fire-out chime, alarms, win jingle).
- Chase view with a perspective ground renderer (log-spaced depth slices over a
  procedural island: sea, beach, grass, forest, fields, lake, volcano cone,
  runway). The aircraft is fixed in frame, banked with the roll; the world
  rolls with it.
- Controls: W/S throttle, arrows bank + pitch, SPACE drop water, P pause,
  M mute, ENTER/click start + restart. Keyboard + mouse.
- Full loop: title screen → takeoff from the runway → hunt smoke columns →
  drop (gold diamond + distance marks the fire ahead) → scoop over sea/lake →
  refuel on the runway → win (all fires out, time bonus) / lose (clock out, or
  14 fires) / crash (ground, water at speed, volcano, hard landing).
- HUD: ALT / SPD / HDG + compass strip, clock + score, minimap (island, runway,
  volcano, lake, fires, plane), artificial horizon, throttle, fuel, water tank
  (3 droplets), fires-out count, target marker, messages.
- Deterministic: one seeded RNG (mulberry32, seed 1337) for the island and the
  fires; no `Math.random()` anywhere in game code. Screenshots use a frozen
  clock (`SHOT_TIME = 8.0`).

## Files (all written by the build agent via edit/write, none copied from starter)

| File | Bytes | Job |
|---|---|---|
| game/index.html | 1,059 | canvas + script order |
| game/src/config.js | 1,439 | every tuned number |
| game/src/random.js | 1,044 | seeded RNG + value noise |
| game/src/terrain.js | 3,187 | island: type, height, colour, fire spots |
| game/src/input.js | 1,088 | keyboard + mouse |
| game/src/audio.js | 2,654 | WebAudio synth sounds |
| game/src/world.js | 6,869 | physics, fires, water, fuel, scoring, endings |
| game/src/render.js | 22,554 | sky, ground, volcano, runway, fires, plane, HUD, minimap, screens |
| game/src/shots.js | 2,561 | 4 staged deterministic screenshot states |
| game/src/main.js | 4,348 | loop, screens, self-test |
| main.ts | 1,754 | hand-in: copies game/ + screenshots/, writes dossier.json |
| vendor/makefun-game.ts | 56,282 | kit copy, UNCHANGED |
| LICENSE | 1,073 | MIT |
| README.md | 2,356 | official readme template, {owner}=armin-arlert-win, {repo}=bara-langit, referral r8j1sy7t |
| .makefun/owner.json | 57 | wallet 5xVQ2SVrL8aCFaBhcd3zpmRFHVrKFsQdSnxjnjZRQs4K |

Total source: 1,334 lines. game/ total 46,803 B, 10 files + 2 dirs (gate: ≤993, ≤48 MiB).
index.html 1,059 B (gate: ≤1 MiB).

## Screenshots (1280×800, JPEG, all ≤256 KiB)

| File | Bytes | sha256 | What it shows |
|---|---|---|---|
| screenshots/1-cover.jpg | 62,578 | 9460f0b7943aec1326c1c54318fd0c3832bb19ccb461d29b51df262005fc7f38 | Mid-sortie chase view: fires + smoke ahead, volcano right, "SPACE — DROP WATER", full HUD + minimap |
| screenshots/2-approach.jpg | 62,915 | bd10607f3be3c8e98c16d3e03729779204205d98eb7822b4fb962de995df78ba | Low final approach: runway + centreline dashes ahead, beach + sea, fire marker |
| screenshots/3-drop.jpg | 64,782 | 85d26701593a9adcacaad289629f1009db313a6ac7b038f111cbea8f53673c4d | Water drop falling on a fire, "FIRE OUT +100", tank 2/3 |
| screenshots/4-victory.jpg | 53,690 | f2beed93d608abacb42338a92409a65a2f24560d65ac87eed94c5030b5164f1f | Win screen: "ALL FIRES OUT", score 2,340, time bonus +640 |

Captured with headless Chromium
(`~/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`,
`--window-size=1280,800`, `?shot=N`), converted PNG→JPEG quality 82 with PIL.
All four viewed by the build agent at full resolution: all criterion-1 elements
are visible (chase view, recognisable terrain, aircraft in frame, lit
instruments, runway/target ahead, HUD altitude/speed/heading). Title screen
also rendered and viewed: name, mission, controls, "ENTER or CLICK — FLY THE SORTIE".

## Verification (all re-run by the build agent, reproducible)

- **Self-test** (`?selftest=1`, headless Chromium `--dump-dom`): **8/8 PASS**
  throttle builds speed · bank turns heading · water drop soaks a fire ·
  sea skim refills tank · all fires out wins · hitting terrain crashes ·
  clock counts down · frame renders.
  Serve: `python3 -m http.server 8123 --directory game`, then
  `chromium --headless --dump-dom "http://127.0.0.1:8123/?selftest=1"`.
- **Screenshot determinism:** shot 1 captured twice → sha256 identical
  (`037b4eedfa264229…` both runs).
- **main.ts 2× byte-identical:** `MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts` and
  `/tmp/out2` → `diff -r` clean, no differences.
- **dossier.json:** 374,813 B (gate: ≤1.5 MiB), contains the cover, all 4
  screenshots and every source file (spot-checked: "BARA LANGIT",
  "1-cover.jpg", "game/src/world.js", "game/src/render.js", "game/index.html").
- **Gate sizes:** game/ 46,803 B / 12 entries; screenshots 243,965 B total,
  each ≤256 KiB, 1280×800 (long ≤1280, short ≥480); dossier 374,813 B.

## Bugs found and fixed during the build

1. Start position was 40 m past the west end of the runway, on rough ground —
   the plane crashed on step 1 (caught by self-test 1–3 failing). Moved onto
   the strip (RUNWAY.x − 250).
2. Runway "speed > 72" crash check fired while rolling at takeoff speed.
   Now only a fast touchdown *from the air* counts as a hard landing.
3. Smoke phase used JS `%` on a negative number → negative arc radius
   (IndexSizeError). Phase is now wrapped into [0, 1).
4. Compass strip drew a label every 15° — the numbers merged into one long
   digit string. Now one label every 30°.
5. Water-drop splash was a giant pale ellipse dominating the frame. Shrunk
   and faded.
6. Shot 2's runway was a speck at 950 m. Moved to a 500 m final.

## Honest limits

- Terrain is stylised flat-colour patches (one consistent style, but blocky
  up close); the volcano is a shaded projected triangle, not a mesh.
- One aircraft, one island, one mission type (8 fires + spread). No gear,
  flaps, or weather beyond the dusk light.
- The win path was verified by the self-test (all fires out → win) and the
  drop/scoop/refuel mechanics by unit steps, not by a full 180-second human
  playthrough in the browser.

## For the parent (submit flow, NOT done here)

1. Create GitHub repo `armin-arlert-win/bara-langit` (after 26 Nov 00:57 UTC).
2. Push this tree, set About (website https://make.fun/bounty/best-flight-game-20261126-0057, topics ai-agents, bounties, makefun).
3. Bundle with prompt file `Ya, bangun flight game` (`--prompt-origin handed-off`).
4. Local `makefun check`, then submit with `--keypair` before the R1 cutoff
   (26 Nov 19:57 WIB) so the grade finishes in time for round judging.
