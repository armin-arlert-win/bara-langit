# bara-langit

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/armin-arlert-win/bara-langit/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

BARA LANGIT — a wildfire air-tanker flight game for the make.fun "Make the best flight game" bounty. Eight fires are burning across Pulau Arang, a volcanic island at dusk. Fly the airtanker, scoop water from the sea, drop it on the flames, and put them all out before the clock runs out — mind the volcano, and land on the runway to refuel.

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

- **Take off** from the runway on the south coast, then hunt the smoke columns.
- **Drop** when the gold diamond marks a fire ahead — one tank holds 3 drops.
- **Scoop** more water by skimming low and slow over the sea or the lake.
- **Refuel** by landing gently on the runway (slow and level, or it is a crash).
- **Win** by putting out every fire before the 180-second clock runs out. If the fire spreads to 14 blazes, the island is lost.
- The volcano is a wall, not a hill — stay clear of it.

Built with vanilla JavaScript and canvas, no libraries, no network. All art is drawn in code; all sound is synthesised with WebAudio.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r8j1sy7t&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
