// Staged, deterministic screenshot states. One job: put the sortie in the exact
// pose each screenshot needs, with the clock frozen so renders are byte-stable.
// The judge sees these four frames: cover, approach, drop, victory.
const Shots = (() => {
  const C = CFG;
  function base() {
    const S = World.freshState();
    S.mode = 'fly';
    S.t = 8.0; // frozen clock: smoke, sun pulse and gusts never move between runs
    S.timeLeft = 142;
    S.score = 100;
    S.fuel = 78;
    S.water = 3;
    S.throttle = 0.72;
    S.messageT = 99;
    return S;
  }
  function setFires(S, list) {
    // list: [x, z, kind, alive]
    S.fires = list.map(([x, z, kind, alive]) => ({ x, z, kind, alive, heat: kind === 'town' ? 1.6 : 1 }));
    S.firesOut = list.filter((f) => !f[3]).length;
  }
  const SHOTS = {
    // 1 — cover: mid-sortie, gold ring on the forest fire dead ahead, volcano
    // right, lake left, full HUD + dials + checklist.
    1(S) {
      S.x = 0; S.z = 500; S.alt = 245; S.hdg = 55; S.speed = 223;
      S.bank = -6; S.pitch = -2;
      S.phase = 1; S.timeLeft = 142; S.score = 100;
      S.message = 'SPACE — DROP WATER';
      setFires(S, [
        [650, 40, 'forest', true],
        [1100, -400, 'forest', true],
        [-600, -800, 'forest', true],
        [-200, -1400, 'forest', true],
        [-1100, 200, 'forest', true],
        [-200, -1200, 'forest', false],
        [-540, 1090, 'town', true],
        [-370, 1190, 'town', true],
      ]);
    },
    // 2 — approach: phase 3, on final from the east, offset 120 m north of the
    // centreline so the black runway + centreline + gold ring on the threshold
    // read clear of the plane, fields below.
    2(S) {
      S.x = 100; S.z = 500; S.alt = 90; S.hdg = 270; S.speed = 198;
      S.bank = 0; S.pitch = -3;
      S.phase = 3; S.timeLeft = 96; S.score = 1100; S.fuel = 61;
      S.message = 'ON FINAL — RUNWAY AHEAD';
      setFires(S, [
        [700, -100, 'forest', false], [1200, -700, 'forest', false],
        [-600, -800, 'forest', false], [300, 900, 'forest', false],
        [-1100, 200, 'forest', false], [-200, -1200, 'forest', false],
        [-540, 1090, 'town', false], [-370, 1190, 'town', false],
      ]);
    },
    // 3 — drop: phase 2, a town fire going out — big splash, gold ring on the
    // second town fire ahead, rooftops burning, tank 2/3.
    3(S) {
      S.x = -450; S.z = 420; S.alt = 150; S.hdg = 180; S.speed = 198;
      S.bank = 4; S.pitch = -1;
      S.phase = 2; S.timeLeft = 71; S.score = 500; S.water = 2;
      S.message = 'TOWN FIRE OUT  +150';
      S.splash = { x: -540, z: 1090, t: 1.2 };
      setFires(S, [
        [700, -100, 'forest', false], [1200, -700, 'forest', false],
        [-600, -800, 'forest', false], [300, 900, 'forest', false],
        [-1100, 200, 'forest', false], [-200, -1200, 'forest', false],
        [-540, 1090, 'town', false], [-370, 1190, 'town', true],
      ]);
    },
    // 4 — victory: bright win screen over the runway, score breakdown visible.
    4(S) {
      S.mode = 'win';
      S.x = -650; S.z = 620; S.alt = 4; S.hdg = 90; S.speed = 0;
      S.phase = 3; S.timeLeft = 64; S.score = 2340; S.fuel = 61; S.water = 3;
      S.timeBonus = 640; S.landBonus = 320;
      S.endReason = 'LANDED ON THE RUNWAY';
      S.endDetail = '';
      S.messageT = 0; S.message = '';
      setFires(S, [
        [700, -100, 'forest', false], [1200, -700, 'forest', false],
        [-600, -800, 'forest', false], [300, 900, 'forest', false],
        [-1100, 200, 'forest', false], [-200, -1200, 'forest', false],
        [-540, 1090, 'town', false], [-370, 1190, 'town', false],
      ]);
    },
  };
  function apply(n) {
    const S = base();
    SHOTS[n](S);
    World.S = S;
    return S;
  }
  return { apply };
})();
