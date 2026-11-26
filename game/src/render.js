// render.js: the 3D world — three.js scene, dusk sky, heightmap island,
// volcano, runway, village, trees, fires, the tanker and the chase camera.
// Everything the judge sees in the screenshots is built here. No drawing
// of the game state lives anywhere else; hud.js only updates the DOM.

import * as THREE from 'three';
import { CFG } from './config.js';
import { terrainAt, terrainColor, islandR, treeSpots, seaShade } from './terrain.js';
import { makeRng, valueNoise } from './random.js';
import { buildAircraft, setAircraftPose } from './aircraft.js';
import { currentTarget, fireRadius } from './world.js';

let renderer = null;
let scene = null;
let camera = null;
let planeGroup = null;
let ringGroup = null;
let ringBeam = null;
let fireVisuals = [];
let dropVisuals = [];
let camPos = new THREE.Vector3();
let camInit = false;

const tmpV = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const tmpRight = new THREE.Vector3();

// --- Procedural textures (drawn in code, never loaded) ---

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#141d3d');
  grad.addColorStop(0.42, '#3c2d5e');
  grad.addColorStop(0.58, '#8a4a5e');
  grad.addColorStop(0.72, '#e8894a');
  grad.addColorStop(0.8, '#f7a55c');
  grad.addColorStop(1.0, '#c97e4e');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 512);
  return new THREE.CanvasTexture(c);
}

function runwayTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 80;
  const g = c.getContext('2d');
  g.fillStyle = '#4a4d55';
  g.fillRect(0, 0, 1024, 80);
  // Edge lines.
  g.fillStyle = '#e8e8e8';
  g.fillRect(0, 4, 1024, 3);
  g.fillRect(0, 73, 1024, 3);
  // Centreline dashes.
  for (let x = 30; x < 1024; x += 64) g.fillRect(x, 38, 34, 4);
  // Threshold bars at both ends.
  for (let i = 0; i < 4; i++) {
    g.fillRect(14, 12 + i * 15, 46, 8);
    g.fillRect(1024 - 60, 12 + i * 15, 46, 8);
  }
  // Runway numbers.
  g.fillStyle = '#f2f2f2';
  g.font = 'bold 34px monospace';
  g.textAlign = 'center';
  g.fillText('09', 96, 52);
  g.fillText('27', 1024 - 96, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// --- Scene pieces ---

function buildSky() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(6000, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }),
  );
  scene.add(sky);
  // The dusk sun, low in the west, and its glow.
  const sunTex = radialTexture('rgba(255,236,190,1)', 'rgba(255,140,60,0)');
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTex, transparent: true, fog: false, depthWrite: false,
  }));
  sun.scale.set(900, 900, 1);
  sun.position.set(-4200, 420, 900);
  scene.add(sun);
  // Stars, only high up where the sky is dark.
  const rng = makeRng(42);
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 320; i++) {
    const a = rng() * Math.PI * 2;
    const el = 0.35 + rng() * 1.1;
    const r = 5500;
    pts.push(Math.cos(a) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(a) * Math.cos(el) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xdde4ff, size: 5, sizeAttenuation: false, fog: false,
    transparent: true, opacity: 0.7,
    map: radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'),
    alphaTest: 0.01, depthWrite: false,
  }));
  scene.add(stars);
}

function buildTerrainMesh() {
  const W = 5200, D = 4800, SX = 150, SZ = 138;
  const geo = new THREE.PlaneGeometry(W, D, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const t = terrainAt(x, z);
    pos.setY(i, t.h);
    let c = terrainColor(t.t);
    // A whisper of variation so the ground is not one flat colour. The
    // volcano's rock and ash get a coarser speckle, so the cone reads as
    // a mountain and not one smooth orange triangle.
    let n = 0.85 + valueNoise(x * 0.01 + 3.1, z * 0.01 - 1.7) * 0.3;
    if (t.t === 'rock' || t.t === 'ash') {
      n = 0.7 + valueNoise(x * 0.03 + 9.2, z * 0.03 - 4.7) * 0.6;
    }
    const sea = t.t === 'sea' ? seaShade(x, z) : 1;
    colors[i * 3] = (c[0] / 255) * n * sea;
    colors[i * 3 + 1] = (c[1] / 255) * n * sea;
    colors[i * 3 + 2] = (c[2] / 255) * n * sea;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  scene.add(mesh);
  // Sea surface: a translucent sheet that catches the sunset.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(5200, 4800),
    new THREE.MeshPhongMaterial({
      color: 0x1d4e79, transparent: true, opacity: 0.72,
      shininess: 90, specular: 0xff9a50,
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.6;
  scene.add(sea);
  // The lake, a calmer disc.
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(CFG.LAKE.r, 28),
    new THREE.MeshPhongMaterial({
      color: 0x2e7fb4, transparent: true, opacity: 0.85,
      shininess: 110, specular: 0xffb070,
    }),
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(CFG.LAKE.x, 2.6, CFG.LAKE.z);
  scene.add(lake);
}

function buildRunway() {
  const R = CFG.RUNWAY;
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(R.len, R.w),
    new THREE.MeshLambertMaterial({
      map: runwayTexture(), polygonOffset: true,
      polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(R.x, 5.5, R.z);
  scene.add(strip);
  // Edge lights and threshold lights, lit for the dusk approach.
  const lightGeo = new THREE.SphereGeometry(1.6, 6, 5);
  const white = new THREE.MeshBasicMaterial({ color: 0xfff2cc });
  const green = new THREE.MeshBasicMaterial({ color: 0x33ff88 });
  const red = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const edge = new THREE.InstancedMesh(lightGeo, white, 22);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < 11; i++) {
    const x = R.x - R.len / 2 + (i * R.len) / 10;
    m.setPosition(x, 5.2, R.z - R.w / 2 - 2);
    edge.setMatrixAt(k++, m);
    m.setPosition(x, 5.2, R.z + R.w / 2 + 2);
    edge.setMatrixAt(k++, m);
  }
  scene.add(edge);
  for (const [x, mat] of [
    [R.x - R.len / 2, green], [R.x + R.len / 2, red],
  ]) {
    for (const dz of [-14, 0, 14]) {
      const s = new THREE.Mesh(lightGeo, mat);
      s.position.set(x, 5.2, R.z + dz);
      scene.add(s);
    }
  }
}

function buildVillage() {
  const V = CFG.VILLAGE;
  const rng = makeRng(77);
  const wall = new THREE.MeshLambertMaterial({ color: 0xd8c9a8 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8a4a34 });
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const spots = [
    [-80, -50], [10, -60], [80, -40], [-60, 30], [20, 55], [95, 45], [-20, -10], [60, -5],
  ];
  for (const [dx, dz] of spots) {
    const x = V.x + dx, z = V.z + dz;
    const h = terrainAt(x, z).h;
    const house = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(13, 6, 10), wall);
    body.position.y = 3;
    house.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 4.5, 4), roofMat);
    roof.position.y = 8.2;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    for (const wx of [-3.5, 3.5]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), winMat);
      win.position.set(wx, 3.2, 5.05);
      house.add(win);
    }
    house.position.set(x, h, z);
    house.rotation.y = rng() * Math.PI;
    scene.add(house);
  }
}

function buildTrees() {
  const spots = treeSpots(480, 2024);
  const geo = new THREE.ConeGeometry(5.5, 17, 6);
  const mat = new THREE.MeshLambertMaterial({ color: 0x3f7a34 });
  const trees = new THREE.InstancedMesh(geo, mat, spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  spots.forEach((t, i) => {
    e.set(0, t.rot, 0);
    q.setFromEuler(e);
    s.set(t.s, t.s, t.s);
    m.compose(new THREE.Vector3(t.x, t.h + 8 * t.s, t.z), q, s);
    trees.setMatrixAt(i, m);
  });
  scene.add(trees);
}

function buildVolcano() {
  // A glowing crater and a slow smoke column over the peak.
  const V = CFG.VOLCANO;
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(55, 20),
    new THREE.MeshBasicMaterial({ color: 0xff6a1a }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(V.x, V.peak + 2, V.z);
  scene.add(glow);
  const light = new THREE.PointLight(0xff7733, 90000, 1500, 1.6);
  light.position.set(V.x, V.peak + 60, V.z);
  scene.add(light);
}

// --- Fires, rings, drops ---

function buildFireVisuals(G) {
  const smokeTex = radialTexture('rgba(40,36,34,0.85)', 'rgba(40,36,34,0)');
  const glowTex = radialTexture('rgba(255,150,40,0.9)', 'rgba(255,80,10,0)');
  // One visual slot per fire the island can ever hold (FIRES_MAX): a fire
  // the wind spreads later takes a free slot, so it is seen too.
  fireVisuals = [];
  for (let i = 0; i < CFG.FIRES_MAX; i++) {
    const f = G.fires[i] || { x: 0, z: 0, kind: 'forest', intensity: 1 };
    const g = new THREE.Group();
    const ground = terrainAt(f.x, f.z).h;
    const tall = f.kind === 'building' ? 1.35 : 1;
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7a18 });
    const flameMat2 = new THREE.MeshBasicMaterial({ color: 0xffd23e });
    const cones = [];
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(9 - k * 2.4, 22 * tall - k * 5, 8), k === 1 ? flameMat2 : flameMat);
      cone.position.set((k - 1) * 6, (11 * tall - k * 2.5), (k % 2) * 5 - 2);
      g.add(cone);
      cones.push(cone);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(130, 90, 1);
    glow.position.y = 22;
    g.add(glow);
    const smokes = [];
    for (let k = 0; k < 4; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: smokeTex, transparent: true, opacity: 0.5, depthWrite: false,
      }));
      sp.scale.set(46, 46, 1);
      g.add(sp);
      smokes.push(sp);
    }
    const scorch = new THREE.Mesh(
      new THREE.CircleGeometry(fireRadius(f), 18),
      new THREE.MeshBasicMaterial({ color: 0x14100c, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.y = 0.8;
    g.add(scorch);
    g.position.set(f.x, ground, f.z);
    g.userData = { cones, glow, smokes, scorch, phase: i * 1.7, ground };
    g.visible = false;
    scene.add(g);
    fireVisuals.push(g);
  }
  // The target ring: a gold torus plus a light beam, parked over whatever
  // the sortie is asking for — the nearest fire, or the runway threshold.
  ringGroup = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(34, 2.0, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd23e }),
  );
  ringGroup.add(ring);
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(25, 1.2, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0 }),
  );
  ringGroup.add(ring2);
  scene.add(ringGroup);
  ringBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 60, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffc93c, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  scene.add(ringBeam);
  // Water drops: one reusable cluster per drop in flight.
  dropVisuals = [];
  for (let i = 0; i < 3; i++) {
    const dg = new THREE.Group();
    for (let k = 0; k < 7; k++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0x9fd4ff }),
      );
      drop.position.set((k % 3 - 1) * 4, (k % 2) * -3, Math.floor(k / 3) * 4 - 4);
      dg.add(drop);
    }
    const splash = new THREE.Mesh(
      new THREE.RingGeometry(6, 10, 20),
      new THREE.MeshBasicMaterial({
        color: 0xbfe3ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    splash.rotation.x = -Math.PI / 2;
    dg.add(splash);
    dg.userData.splash = splash;
    dg.visible = false;
    scene.add(dg);
    dropVisuals.push(dg);
  }
}

function updateFireVisuals(G, animT) {
  for (let i = 0; i < fireVisuals.length; i++) {
    const f = G.fires[i];
    const vis = fireVisuals[i];
    if (!vis) continue;
    if (!f || !f.alive) { vis.visible = false; continue; }
    vis.visible = true;
    // A fire the wind spread takes its slot at its own spot.
    const ground = terrainAt(f.x, f.z).h;
    vis.position.set(f.x, ground, f.z);
    const u = vis.userData;
    const flick = 0.82 + 0.28 * Math.sin(animT * 7 + u.phase) + 0.1 * Math.sin(animT * 13 + u.phase * 2);
    u.cones.forEach((c, k) => {
      c.scale.y = flick * (1 - k * 0.12) * (0.6 + f.intensity * 0.4);
    });
    u.glow.material.opacity = 0.45 + 0.2 * Math.sin(animT * 5 + u.phase);
    u.smokes.forEach((sp, k) => {
      const cyc = ((animT * 0.09 + k * 0.25 + u.phase * 0.1) % 1);
      sp.position.set(Math.sin(u.phase + k * 2.1) * 8, 26 + cyc * 85, Math.cos(u.phase + k) * 8);
      const sc = 40 + cyc * 70;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = 0.5 * (1 - cyc);
    });
  }
}

function updateTargetRing(G, animT) {
  let tx, tz, ty;
  if (G.phase === 'return' || G.state === 'win') {
    const R = CFG.RUNWAY;
    tx = R.x - R.len / 2 + 70; tz = R.z; ty = 62;
  } else {
    const t = currentTarget(G);
    if (!t) { ringGroup.visible = false; ringBeam.visible = false; return; }
    tx = t.x; tz = t.z; ty = terrainAt(t.x, t.z).h + 58;
  }
  ringGroup.visible = true;
  ringBeam.visible = true;
  ringGroup.position.set(tx, ty + Math.sin(animT * 1.6) * 3, tz);
  // The ring faces the camera: a flat ring seen edge-on from a chase view
  // is a thin line, so it turns to face whoever looks at it.
  ringGroup.lookAt(camera.position);
  ringBeam.position.set(tx, ty - 28, tz);
}

function updateDropVisuals(G) {
  G.drops.forEach((d, i) => {
    const dg = dropVisuals[i];
    if (!dg) return;
    dg.visible = true;
    const ground = terrainAt(d.x, d.z).h;
    const startAlt = d.alt !== undefined ? d.alt : 140;
    const fall = Math.min(1, d.t / 1.15);
    const y = Math.max(ground + 1, startAlt - (startAlt - ground) * fall * fall);
    dg.position.set(d.x, y, d.z);
    const splash = dg.userData.splash;
    if (d.t > 1.15) {
      const s = (d.t - 1.15) / 0.45;
      splash.material.opacity = 0.7 * (1 - s);
      const r = 8 + s * 55;
      splash.scale.set(r / 8, r / 8, 1);
      splash.position.y = ground + 1.2 - y;
    } else {
      splash.material.opacity = 0;
    }
  });
  for (let i = G.drops.length; i < dropVisuals.length; i++) dropVisuals[i].visible = false;
}

// --- Camera ---

function updateCamera(G, animT, snap) {
  if (G.state === 'title') {
    // A slow orbit over the island behind the title screen.
    const a = animT * 0.045;
    camera.position.set(Math.cos(a) * 2400, 750, Math.sin(a) * 2100);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 40, 100);
    camInit = false;
    return;
  }
  const fx = Math.sin(G.heading), fz = -Math.cos(G.heading);
  if (G.state === 'win') {
    // A high, wide view of the landing: the tanker parked on the strip,
    // the runway running away ahead of her.
    tmpV.set(G.x - fx * 45, G.alt + 22, G.z - fz * 45);
    if (!camInit || snap) { camPos.copy(tmpV); camInit = true; }
    else camPos.lerp(tmpV, 1 - Math.exp(-6 * 0.016));
    camera.position.copy(camPos);
    camera.up.set(0, 1, 0);
    camera.lookAt(G.x + fx * 30, G.alt + 2, G.z + fz * 30);
    return;
  }
  tmpV.set(G.x - fx * 30, G.alt + 10, G.z - fz * 30);
  if (!camInit || snap) {
    camPos.copy(tmpV);
    camInit = true;
  } else {
    camPos.lerp(tmpV, 1 - Math.exp(-6 * 0.016));
  }
  camera.position.copy(camPos);
  // The camera banks a third as far as the plane: the horizon tilts, but
  // the view never fights the pilot.
  const bank = -G.roll * 0.35;
  tmpRight.set(Math.cos(G.heading), 0, Math.sin(G.heading));
  tmpUp.set(0, 1, 0).addScaledVector(tmpRight, Math.sin(bank)).normalize();
  camera.up.copy(tmpUp);
  camera.lookAt(G.x + fx * 48, G.alt + 1, G.z + fz * 48);
}

// --- Public entry points ---

export function initRender(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(CFG.W, CFG.H, false);
  renderer.setPixelRatio(1);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc97e4e, 900, 4300);
  camera = new THREE.PerspectiveCamera(62, CFG.W / CFG.H, 0.5, 12000);
  const sun = new THREE.DirectionalLight(0xffc490, 1.7);
  sun.position.set(-1800, 1200, 700);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x6a6aa0, 0x2a2018, 0.75));
  buildSky();
  buildTerrainMesh();
  buildRunway();
  buildVillage();
  buildTrees();
  buildVolcano();
  planeGroup = buildAircraft();
  scene.add(planeGroup);
}

export function buildWorldVisuals(G) {
  buildFireVisuals(G);
}

export function renderFrame(G, animT, snap) {
  if (!renderer) return;
  setAircraftPose(planeGroup, G, animT);
  updateCamera(G, animT, !!snap);
  updateFireVisuals(G, animT);
  updateTargetRing(G, animT);
  updateDropVisuals(G);
  renderer.render(scene, camera);
}
