# bara-langit

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

BARA LANGIT — a 3D wildfire air-tanker flight game for the make.fun "Make the best flight game" bounty. Ten fires are burning across Pulau Arang, a volcanic island at dusk: eight in the forest, two in the village by the runway. Fly the airtanker in a 3D chase view, scoop water from the sea or the lake, drop it on the flames, mind the volcano and the wind — then bring her home with a precision landing on the runway.

## Run it

```sh
python3 -m http.server --directory game 8080
```

Then open http://localhost:8080 in a desktop browser.

---

## How to fly

- **W / S** — throttle up / down
- **← / →** — bank left / right (turns the nose)
- **↑ / ↓** — pitch up (climb) / down (descend)
- **SPACE** — drop water on the fire below the nose
- **P** — pause · **M** — mute · **ENTER** — start / restart

## The sortie

- **Take off** from the runway on the south coast, then hunt the smoke columns — the gold ring marks the nearest fire.
- **Drop** when the ring is under the nose — one tank holds 3 drops. Forest fires are worth 100, burning houses 150.
- **Scoop** more water by skimming low and slow over the sea or the lake.
- **Refuel** by landing gently on the runway (slow and level, or it is a crash).
- **Win** by putting out every fire, then landing on the runway before the clock runs out — the landing is scored on centreline, touchdown point, speed and sink rate. If the fire spreads to 14 blazes, the island is lost.
- The volcano is a wall, not a hill — stay clear of it. The wind pushes the ground track sideways.

Built with three.js (vendored under game/vendor/) and vanilla JavaScript, no network. All art is procedural; all sound is synthesised with WebAudio.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r8j1sy7t&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
