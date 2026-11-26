// aircraft.js: the airtanker itself, built from primitives so it reads
// as a machine that was put together, not a drawn picture. White fuselage,
// red wings and tail, twin floats under the wings, a belly tank, a spinning
// prop and navigation lights. Local forward is -z, so rotation.y = heading.

import * as THREE from 'three';

function lambert(color, extra) {
  return new THREE.MeshLambertMaterial({ color, ...(extra || {}) });
}

function basic(color, extra) {
  return new THREE.MeshBasicMaterial({ color, ...(extra || {}) });
}

// Builds the plane once; setAircraftPose moves it every frame. The returned
// group carries .userData.prop (the spinning blades) and .userData.lights
// (the navigation lights, for their blink).
export function buildAircraft() {
  const plane = new THREE.Group();
  const white = lambert(0xf7f2e8);
  const red = lambert(0xd9382a);
  const dark = lambert(0x2a2f38);
  const glass = new THREE.MeshPhongMaterial({
    color: 0x1d3a55, shininess: 90, specular: 0x99bbdd,
  });
  const metal = lambert(0x8b939e);

  // Fuselage: a cylinder along z, nose cone at the front (-z).
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.85, 7.2, 12), white);
  body.rotation.x = Math.PI / 2;
  plane.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.8, 12), red);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -4.5;
  plane.add(nose);
  // Belly water tank, visible from below and the side.
  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 2.6), lambert(0x3f6d8e));
  tank.position.set(0, -1.0, 0.4);
  plane.add(tank);
  // Cockpit glass: a flattened sphere on top of the nose.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), glass);
  canopy.scale.set(0.9, 0.62, 1.5);
  canopy.position.set(0, 0.75, -2.2);
  plane.add(canopy);
  // Dorsal hump behind the cockpit.
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), white);
  hump.scale.set(0.85, 0.6, 1.4);
  hump.position.set(0, 0.7, -0.6);
  plane.add(hump);

  // Main wings: one long red slab with a slight dihedral, plus tip lights.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.28, 2.7), red);
  wing.position.set(0, 0.15, -0.4);
  plane.add(wing);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.34, 2.9), red);
  wingL.position.set(-7.2, 0.35, -0.4);
  wingL.rotation.z = 0.07;
  plane.add(wingL);
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.34, 2.9), red);
  wingR.position.set(7.2, 0.35, -0.4);
  wingR.rotation.z = -0.07;
  plane.add(wingR);

  // Tail: horizontal stabiliser and a tall red fin.
  const stab = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 1.5), red);
  stab.position.set(0, 0.35, 3.4);
  plane.add(stab);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.7, 2.1), red);
  fin.position.set(0, 1.35, 3.3);
  fin.rotation.x = -0.12;
  plane.add(fin);

  // Twin floats under the wings: the tanker scoops water off the surface.
  for (const side of [-1, 1]) {
    const float = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 4.6, 10), metal);
    float.rotation.x = Math.PI / 2;
    float.position.set(side * 3.4, -1.35, -0.6);
    plane.add(float);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.5), dark);
    strut.position.set(side * 3.4, -0.8, -0.6);
    plane.add(strut);
  }

  // Prop: a translucent disc plus two blades that spin with the throttle.
  const prop = new THREE.Group();
  prop.position.set(0, 0, -5.45);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(2.3, 24),
    new THREE.MeshBasicMaterial({
      color: 0xdddddd, transparent: true, opacity: 0.13,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  prop.add(disc);
  for (const a of [0, Math.PI]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 4.4, 0.1), dark);
    blade.rotation.z = a;
    prop.add(blade);
  }
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 10), red);
  hub.rotation.x = -Math.PI / 2;
  hub.position.z = -0.25;
  prop.add(hub);
  plane.add(prop);

  // Navigation lights: red left, green right, white tail.
  const lights = {};
  const mkLight = (color, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      basic(color),
    );
    m.position.set(x, y, z);
    plane.add(m);
    return m;
  };
  lights.left = mkLight(0xff2222, -8.3, 0.2, -0.4);
  lights.right = mkLight(0x22ff66, 8.3, 0.2, -0.4);
  lights.tail = mkLight(0xffffff, 0, 0.6, 3.9);

  plane.userData.prop = prop;
  plane.userData.lights = lights;
  return plane;
}

// Puts the built plane where the world says it is. Rotation order YXZ:
// yaw (heading), then pitch, then roll — as an aircraft flies.
export function setAircraftPose(plane, G, animT) {
  plane.position.set(G.x, G.alt, G.z);
  plane.rotation.order = 'YXZ';
  // Local forward is -z: rotation.y = -heading maps it onto the world's
  // forward (sin h, 0, -cos h). (A plain +heading mirrors the nose.)
  plane.rotation.y = -G.heading;
  plane.rotation.x = G.pitch;
  plane.rotation.z = -G.roll;
  // The prop spins with the throttle; parked, it barely turns.
  plane.userData.prop.rotation.z = animT * (2 + G.throttle * 38);
  // Navigation lights blink once a second.
  const on = (animT % 1) < 0.12;
  plane.userData.lights.tail.material.color.setHex(on ? 0xffffff : 0x333333);
}
