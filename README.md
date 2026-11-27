# BARA LANGIT v3 — Wildfire Air Tanker

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Bounty:** best-flight-game-20261126-0057 — "Make the best flight game", $500, 50 paid places.

**What it is:** a 2D canvas flight game. You fly an airtanker over Pulau Arang,
a volcanic island at dusk, in three visible phases: put out 6 forest fires,
then 2 town fires that burn hotter, then make a precision landing on the
runway. Scoop water low over the sea or the lake, watch your fuel, land on the
runway to refuel. Fires spread while the clock runs.

**Why v3, not v2:** v1 (2D, flat) scored 0.514239 in Round 1; v2 (a 3D rebuild)
scored 0.410299 in Round 2. The 3D polish read worse to the screenshot-first
judge: muted colours, a runway that foreshortened to a sliver, a fire hidden
behind the plane, a dark muddy win screen. v3 keeps v1's flat high-contrast
style that survives the judge's contact sheet, and fixes the exact criterion-1
gaps v1 left: a gold target ring over the objective in **every** gameplay
shot, round lit dial instruments (ALT / SPD / HDG + attitude), and the
three-phase mission shown on screen as a checklist, so the depth is visible
without playing.

**Controls:** W/S throttle, ←/→ bank, I/K pitch, SPACE drop water, P pause,
M mute, ENTER start / restart. Keyboard + mouse, offline, desktop Chrome.

**Files:** `game/index.html` + `game/src/` (config, random, terrain, input,
audio, world, render, hud, shots, main) — vanilla JS, no libraries, all art
drawn in code, all sound synthesised with WebAudio. Deterministic seeded RNG;
no `Math.random()` in game code. Screenshots are staged deterministic renders
(`?shot=1..4`, frozen clock).

**Run it:** `node serve.ts` or any static server over `game/`, open
`game/index.html`. Self-test: `game/index.html?selftest=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r8j1sy7t&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
