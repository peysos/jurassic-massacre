/* Jurassic Massacre — world: builds the park, its props and all the puzzle hardware. */
'use strict';

var P = null;                 // puzzle progress (saved); set up in game.js
var state = 'menu';
var anim = { turn: 0, gA: 0, gB: 0, pen: 0, cage: 0, cover: 0, gate: 0, box: 0 };
var keysGot = [], batPos = [], batGot = [];
var W = { flags: [], levers: [], leverLamps: [], cranks: [], termScr: [], fuseLamps: [], route: [], mist: [], cageBoxes: [], safeViz: [], lockLamps: [], rel: {} };
var keyMeshes = [], batMeshes = [], fuseMeshes = [], lamps = [];
chainTex.minFilter = THREE.LinearFilter; chainTex.generateMipmaps = false;

// ---------- maps ----------
function drawLayout(g) {
  g.fillStyle = '#3d3a31';
  PATHS.forEach(function (p) { g.fillRect(p[0], p[2], p[1] - p[0], p[3] - p[2]); });
  g.fillStyle = '#1b3944'; g.fillRect(AQ.x1, AQ.z1, AQ.x2 - AQ.x1, AQ.z2 - AQ.z1);
  g.fillStyle = '#1d5a70'; g.fillRect(POOL.x1, POOL.z1, POOL.x2 - POOL.x1, POOL.z2 - POOL.z1);
  g.fillStyle = '#55534c'; g.fillRect(-32, -29, 20, 14); g.fillRect(17, 96, 10, 8); g.fillRect(-22, -73, 8, 6);
  g.strokeStyle = '#8a4a2a'; g.lineWidth = 1;
  g.strokeRect(-110, 55, 50, 50); g.strokeRect(58, -117, 60, 50);
  g.beginPath(); g.arc(AV.x, AV.z, AV.r, 0, 7); g.stroke();
  var esc = P && P.esc;
  [[TURN_Z, P && P.turn && (!esc || esc.turn >= 1)], [FENCE_A, P && (esc ? esc.relA >= 1 : P.gateA)], [FENCE_B, P && (esc ? esc.relB >= 1 : P.gateB)]].forEach(function (f) {
    g.strokeStyle = '#7d7a70'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-WORLD, f[0]); g.lineTo(-5, f[0]); g.moveTo(5, f[0]); g.lineTo(WORLD, f[0]); g.stroke();
    g.strokeStyle = f[1] ? '#35ff8a' : '#ff4a3a'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-5, f[0]); g.lineTo(5, f[0]); g.stroke();
  });
  SAFE.forEach(function (s) {
    g.fillStyle = esc ? 'rgba(255,70,60,.2)' : 'rgba(53,255,138,.22)'; g.beginPath(); g.arc(s.x, s.z, SAFE_R, 0, 7); g.fill();
    g.fillStyle = esc ? '#ff5a4a' : '#35ff8a'; g.beginPath(); g.arc(s.x, s.z, 2.6, 0, 7); g.fill();
  });
  if (esc) { g.fillStyle = '#ffd23a'; [RELEASE.A, RELEASE.B].forEach(function (r) { g.fillRect(r[0] - 2.5, r[1] - 2.5, 5, 5); }); }
  g.fillStyle = '#ff5a4a'; g.fillRect(-7, WORLD - 3, 14, 3);
  g.strokeStyle = '#77756e'; g.lineWidth = 1.6; g.strokeRect(-WORLD, -WORLD, WORLD * 2, WORLD * 2);
}
function drawParkMap(g, S, got, you, yaw) {
  var i, f = S / 560;
  function mx(x) { return (x + WORLD) / (WORLD * 2) * S; }
  g.fillStyle = '#12160f'; g.fillRect(0, 0, S, S);
  g.save(); g.scale(S / 300, S / 300); g.translate(WORLD, WORLD); drawLayout(g); g.restore();
  g.textAlign = 'center';
  for (i = 0; i < ZONES.length; i++) {
    var z = ZONES[i]; g.font = 'bold ' + 12 * f + 'px Trebuchet MS, sans-serif';
    g.fillStyle = got && got[i] ? '#6f6a5a' : '#e2c56a';
    g.fillText(z.name, mx(z.x), mx(z.z) - 6 * f);
    if (got) g.fillText(got[i] ? '✔ key found' : '? key piece', mx(z.x), mx(z.z) + 10 * f);
  }
  g.fillStyle = P && P.esc ? '#ff8a7a' : '#8dffc0'; g.font = 11 * f + 'px Trebuchet MS, sans-serif';
  SAFE.forEach(function (s) { g.fillText(P && P.esc ? 'OFFLINE' : 'SAFE', mx(s.x), mx(s.z) - 10 * f); });
  g.fillStyle = '#b9b3a2';
  g.fillText('SECTOR GATE A', mx(0) + 58 * f, mx(FENCE_A) - 5 * f); g.fillText('SECTOR GATE B', mx(0) + 58 * f, mx(FENCE_B) - 5 * f);
  g.fillText('TURNSTILES', mx(0) - 48 * f, mx(TURN_Z) - 5 * f);
  g.fillStyle = '#ff8a7a'; g.font = 'bold ' + 12 * f + 'px Trebuchet MS, sans-serif'; g.fillText('EXIT GATE', mx(0) + 50 * f, S - 9 * f);
  g.fillStyle = '#9a927e'; g.fillText('N', S / 2, 14 * f);
  g.strokeStyle = '#5a4d2a'; g.lineWidth = 6 * f; g.strokeRect(0, 0, S, S);
  if (you) {
    if (yaw === undefined) {
      g.fillStyle = '#ff3b2b'; g.beginPath(); g.arc(mx(you.x), mx(you.z), 9 * f, 0, 7); g.fill();
      g.font = 'bold ' + 13 * f + 'px Trebuchet MS, sans-serif'; g.fillStyle = '#fff';
      g.fillText('YOU ARE HERE', clamp(mx(you.x), 60 * f, S - 60 * f), mx(you.z) - 14 * f);
    } else {
      g.save(); g.translate(mx(you.x), mx(you.z)); g.rotate(-yaw);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
    }
  }
}
// height of the floor under a point, for someone whose feet are at `feet`
function groundAt(x, z, feet) {
  if (!inRect(x, z, POOL)) return 0;
  var g = anim.cover >= 0.98 ? 0 : POOL.swim, i, p;
  if (g < 0) {
    if (x < POOL.x1 + 4 && z < POOL.z1 + 2.75) g = Math.max(g, POOL.swim * (x - POOL.x1) / 4);
    if (x > POOL.x2 - 4 && z > POOL.z2 - 2.75) g = Math.max(g, POOL.swim * (POOL.x2 - x) / 4);
  }
  for (i = 0; i < PLATFORMS.length; i++) {
    p = PLATFORMS[i];
    if (Math.abs(x - p[0]) < p[2] / 2 + 0.2 && Math.abs(z - p[1]) < p[2] / 2 + 0.2 && p[3] <= feet + 0.5) g = Math.max(g, p[3]);
  }
  return g;
}
function jitter(geo, amt) {       // roughen a shape so it stops looking like a perfect primitive
  var p = geo.attributes.position, i, x, y, z, n, l;
  for (i = 0; i < p.count; i++) {
    x = p.getX(i); y = p.getY(i); z = p.getZ(i);
    n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; n = (n - Math.floor(n)) - 0.5;
    l = Math.hypot(x, y, z) || 1; p.setXYZ(i, x + x / l * n * amt, y + y / l * n * amt, z + z / l * n * amt);
  }
  geo.computeVertexNormals(); return geo;
}
function crossCard(w, h) {         // two upright quads at right angles, lit as if facing up — for grass and ferns
  var g = new THREE.BufferGeometry(), a = w / 2;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-a, 0, 0, a, 0, 0, a, h, 0, -a, h, 0, 0, 0, -a, 0, 0, a, 0, h, a, 0, h, -a], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); return g;
}

(function buildWorld() {
  var i, g, k, tx, tz, s;
  var wallMat = function (len, h) { return retile(M.concrete, len / 7, (h || 7) / 7); };
  var glow = function (c) { return basic(c, { fog: false }); };

  // ----- ground (with a hole for the aquarium pool) + paths -----
  var T = 700 / 60;
  function groundPiece(x1, x2, z1, z2) {
    var w = x2 - x1, d = z2 - z1, mat = M.ground.clone();
    ['map', 'bumpMap'].forEach(function (key) { var t = M.ground[key].clone(); t.needsUpdate = true; t.repeat.set(w / T, d / T); t.offset.set(((x1 + 350) / T) % 1, ((350 - z2) / T) % 1); mat[key] = t; });
    var m = mesh(new THREE.PlaneGeometry(w, d), mat, (x1 + x2) / 2, 0, (z1 + z2) / 2); m.rotation.x = -PI / 2; m.userData.noCast = true;
  }
  groundPiece(-350, POOL.x1, -350, 350); groundPiece(POOL.x2, 350, -350, 350);
  groundPiece(POOL.x1, POOL.x2, -350, POOL.z1); groundPiece(POOL.x1, POOL.x2, POOL.z2, 350);
  var edgeMat = std(0x2a261c, 1, { transparent: true, opacity: 0.55 });
  PATHS.forEach(function (p, idx) {
    var w = p[1] - p[0], d = p[3] - p[2];
    var map = gravelTex.clone(); map.needsUpdate = true; map.repeat.set(w / 2.5, d / 2.5);
    var m = mesh(new THREE.PlaneGeometry(w, d), std(0xffffff, 1, { map: map, bumpMap: bump(w / 2.5, d / 2.5), bumpScale: 0.06 }), (p[0] + p[1]) / 2, 0.02 + idx * 0.004, (p[2] + p[3]) / 2);
    m.rotation.x = -PI / 2; m.userData.noCast = true;
    var e = mesh(new THREE.PlaneGeometry(w + 1.6, d + 1.6), edgeMat, (p[0] + p[1]) / 2, 0.012, (p[2] + p[3]) / 2); e.rotation.x = -PI / 2; e.userData.noCast = true;   // worn dirt verge
  });

  // ----- sky -----
  var skyTex = canvasTex(256, function (c, S) {
    var gr = c.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, '#010207'); gr.addColorStop(0.38, '#050a16'); gr.addColorStop(0.5, '#121c30'); gr.addColorStop(1, '#121c30');
    c.fillStyle = gr; c.fillRect(0, 0, S, S);
  });
  mesh(new THREE.SphereGeometry(600, 24, 16), basic(0xffffff, { map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  var sp = [];
  for (i = 0; i < 800; i++) { var a = Math.random() * PI * 2, e2 = Math.random() * 1.45 + 0.06, R = 520; sp.push(Math.cos(a) * Math.cos(e2) * R, Math.sin(e2) * R, Math.sin(a) * Math.cos(e2) * R); }
  g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaab8d4, size: 1.3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.45 })));
  var moonTex = canvasTex(128, function (c, S) { c.fillStyle = '#dfe7f2'; c.fillRect(0, 0, S, S); blotch(c, S, ['#9aa6b8', '#b3bfce'], 16, 6, 26, 0.7); });
  mesh(new THREE.SphereGeometry(15, 24, 24), basic(0xffffff, { map: moonTex, fog: false }), 180, 260, -330);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(170,190,230,.5)', 'rgba(120,140,190,.14)'), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(180, 260, -330); halo.scale.set(170, 170, 1); scene.add(halo);
  var cloudMat = new THREE.SpriteMaterial({ map: softTex('rgba(60,72,98,.5)', 'rgba(40,50,72,.25)'), fog: false, depthWrite: false, transparent: true });
  for (i = 0; i < 18; i++) { var cl = new THREE.Sprite(cloudMat), ca = Math.random() * PI * 2, cr = 300 + Math.random() * 150; cl.position.set(Math.cos(ca) * cr, 130 + Math.random() * 120, Math.sin(ca) * cr); cl.scale.set(220 + Math.random() * 200, 60 + Math.random() * 50, 1); scene.add(cl); }

  // ----- perimeter wall -----
  var wallH = 7;
  [[0, -WORLD, 300, 1.5], [-WORLD, 0, 1.5, 300], [WORLD, 0, 1.5, 300], [-79.6, WORLD, 140.8, 1.5], [79.6, WORLD, 140.8, 1.5]].forEach(function (w) {
    addBox(w[0], w[1], w[2], w[3], wallH, wallMat(Math.max(w[2], w[3])));
    addBox(w[0], w[1], w[2] + (w[2] > 2 ? 0 : 0.5), w[3] + (w[3] > 2 ? 0 : 0.5), 0.3, M.dark, false, wallH);                     // coping
  });

  // ----- the entrance gate: twin leaves, chained, with a five-slot lock -----
  addBox(-8.2, WORLD, 2.6, 2.6, 13.6, M.concrete); addBox(8.2, WORLD, 2.6, 2.6, 13.6, M.concrete);
  [-8.2, 8.2].forEach(function (x) { addBox(x, WORLD, 3.1, 3.1, 0.5, M.dark, false, 13.6); addBox(x, WORLD, 3.0, 3.0, 0.6, M.dark, false, 0); });
  addBox(0, WORLD, 19, 2.4, 3.9, M.dark, false, 10);
  makeSign('WELCOME TO JURASSIC ZOO', 0, WORLD - 1.25, PI, 15, 11.95, '#f0cf6a');
  W.gateLeaves = [-1, 1].map(function (sd) {
    var leaf = dyn(new THREE.Group());
    for (var q = 0; q < 7; q++) { cyl(0.12, 0.12, 9.6, M.metal, -sd * (0.5 + q * 1.0), 4.9, 0, leaf, 8); mesh(new THREE.ConeGeometry(0.2, 0.6, 6), M.metal, -sd * (0.5 + q * 1.0), 10, 0, leaf); }
    [0.6, 4.6, 8.8].forEach(function (yy) { box(6.9, 0.3, 0.3, M.metal, -sd * 3.5, yy, 0, leaf); });
    box(6.5, 0.14, 0.14, M.rust, -sd * 3.5, 2.7, 0.05, leaf).rotation.z = sd * 0.62; box(6.5, 0.14, 0.14, M.rust, -sd * 3.5, 6.7, 0.05, leaf).rotation.z = -sd * 0.62;
    leaf.position.set(sd * 7, 0, WORLD - 0.2); scene.add(leaf); return leaf;
  });
  W.lock = dyn(new THREE.Group());
  box(6.2, 0.2, 0.2, M.metal, 0, 0.4, 0, W.lock).rotation.z = 0.42; box(6.2, 0.2, 0.2, M.metal, 0, 0.4, -0.04, W.lock).rotation.z = -0.42;
  box(2.5, 1.9, 0.6, M.gold, 0, 0, -0.3, W.lock);
  mesh(new THREE.TorusGeometry(0.75, 0.15, 8, 16, PI), M.metal, 0, 0.95, -0.3, W.lock);
  for (i = 0; i < 5; i++) { var lm = basic(0x180c00); W.lockLamps.push(lm); var slot = box(0.3, 0.3, 0.1, lm, -0.84 + i * 0.42, 0.1, -0.62, W.lock); slot.rotation.z = PI / 4; }
  box(2.2, 0.36, 0.05, std(0xffffff, 0.6, { map: textTex(['FIVE KEY PIECES'], 256, 42, '#3a2c0a', '#f0cf6a', null, false) }), 0, -0.6, -0.61, W.lock).rotation.y = PI;
  W.lock.position.set(0, 2.9, WORLD - 0.3); scene.add(W.lock);
  W.gateBox = { x1: -7, x2: 7, z1: WORLD - 1.2, z2: WORLD + 1, solid: false }; boxes.push(W.gateBox);
  [-8.2, 8.2].forEach(function (x) {
    mesh(new THREE.SphereGeometry(0.35, 10, 10), glow(0xff2a1a), x, 14.5, WORLD);
    box(0.5, 0.5, 0.5, basic(0xffd9a0), x * 0.8, 7.2, WORLD - 1.5);
    var l = new THREE.PointLight(0xffc98a, 0.9, 24, 1.4); l.position.set(x * 0.75, 7, WORLD - 2.6); scene.add(l);
  });

  // ----- fences: chain-link panels on rusted posts, topped with barbed wire -----
  var posts = [];
  function fence(x1, z1, x2, z2, h) {
    h = h || 3.6;
    var horiz = z1 === z2, len = horiz ? x2 - x1 : z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    var pm = M.chain.clone(); pm.map = chainTex.clone(); pm.map.needsUpdate = true; pm.map.repeat.set(len / 0.42, h / 0.42);
    var pan = mesh(new THREE.PlaneGeometry(len, h), pm, cx, h / 2, cz); if (!horiz) pan.rotation.y = PI / 2; pan.userData.noCast = true;
    [h, h + 0.22].forEach(function (yy, q) { var r = cyl(q ? 0.018 : 0.045, q ? 0.018 : 0.045, len, q ? M.rust : M.metal, cx, yy, cz, null, 5); if (horiz) r.rotation.z = PI / 2; else r.rotation.x = PI / 2; r.userData.noCast = true; });
    for (var t = 0; t <= len + 0.01; t += 4) posts.push([horiz ? x1 + t : cx, horiz ? cz : z1 + t, h]);
    boxes.push({ x1: x1 - (horiz ? 0 : 0.2), x2: x2 + (horiz ? 0 : 0.2), z1: z1 - (horiz ? 0.2 : 0), z2: z2 + (horiz ? 0.2 : 0) });
  }
  fence(-110, 55, -94, 55); fence(-78, 55, -60, 55); fence(-110, 105, -60, 105);
  fence(-110, 55, -110, 105); fence(-60, 55, -60, 72); fence(-60, 88, -60, 105);
  fence(58, -117, 118, -117, 5); fence(118, -117, 118, -67, 5);
  fence(58, -117, 58, -99, 5); fence(58, -81, 58, -67, 5); fence(58, -67, 78, -67, 5); fence(98, -67, 118, -67, 5);
  fence(-149, TURN_Z, -12.1, TURN_Z); fence(12.1, TURN_Z, 149, TURN_Z);
  [FENCE_A, FENCE_B].forEach(function (z) { fence(-149, z, -5, z, 4.2); fence(5, z, 149, z, 4.2); });
  fence(-88, 77, -82, 77); fence(-88, 83, -82, 83); fence(-88, 77, -88, 83);          // the raptor holding pen

  function sectorGate(z, need, label, rel, relName) {
    var grp = dyn(new THREE.Group());
    for (var q = -4.6; q <= 4.61; q += 0.46) cyl(0.05, 0.05, 4.0, M.metal, q, 2.0, 0, grp, 6);
    [0.3, 2.0, 3.8].forEach(function (yy) { box(9.6, 0.16, 0.16, M.metal, 0, yy, 0, grp); });
    box(9.4, 0.5, 0.08, M.yellow, 0, 1.1, 0.06, grp); box(9.4, 0.5, 0.08, M.yellow, 0, 1.1, -0.06, grp);
    grp.position.set(0, 0, z); scene.add(grp);
    [-5, 5].forEach(function (x) { addBox(x, z, 0.6, 0.6, 4.6, M.concrete); box(0.8, 0.2, 0.8, M.dark, x, 4.7, z); });
    box(11, 0.3, 0.5, M.dark, 0, 4.45, z);                                              // gantry
    addBox(6.4, z + 1.6, 0.4, 0.4, 1.3, M.dark, false);
    box(0.5, 0.36, 0.1, M.metal, 6.4, 1.35, z + 1.82);
    var lampMat = glow(0xff3020);
    mesh(new THREE.SphereGeometry(0.14, 10, 10), lampMat, 6.4, 1.62, z + 1.6);
    mesh(new THREE.SphereGeometry(0.2, 10, 10), lampMat, 0, 4.8, z);
    makeSign(label, -9.2, z + 0.42, 0, 6.4, 2.6, '#ffd23a');
    var bx = { x1: -5, x2: 5, z1: z - 0.25, z2: z + 0.25 }; boxes.push(bx);
    // emergency release: a hand pump in a yellow cabinet on the north side of the fence
    var cab = new THREE.Group();
    box(1.1, 1.5, 0.5, M.yellow, 0, 0.95, 0, cab); box(1.2, 0.1, 0.6, M.dark, 0, 1.75, 0, cab); box(0.9, 0.2, 0.4, M.dark, 0, 0.1, 0, cab);
    mesh(new THREE.PlaneGeometry(0.95, 0.5), std(0xffffff, 0.6, { map: textTex(['EMERGENCY', 'GATE RELEASE ' + relName], 256, 128, '#101010', '#ffd23a', '#ffd23a', false) }), 0, 1.3, -0.256, cab).rotation.y = PI;
    var handle = dyn(new THREE.Group()); handle.position.set(0, 0.75, -0.3); box(0.06, 0.06, 0.7, M.metal, 0, 0, -0.3, handle); mesh(new THREE.SphereGeometry(0.08, 8, 8), M.red, 0, 0, -0.66, handle); cab.add(handle);
    var beaconMat = glow(0x331008); mesh(new THREE.SphereGeometry(0.16, 10, 10), beaconMat, 0, 1.95, 0, cab); cyl(0.05, 0.05, 0.2, M.dark, 0, 1.82, 0, cab);
    cab.position.set(rel[0], 0, rel[1]); scene.add(cab);
    circles.push({ x: rel[0], z: rel[1], r: 0.7 });
    return { mesh: grp, box: bx, lamp: lampMat, z: z, need: need, handle: handle, beacon: beaconMat };
  }
  W.gateA = sectorGate(FENCE_A, 2, 'SECTOR GATE A — 2 KEY PIECES', RELEASE.A, 'A');
  W.gateB = sectorGate(FENCE_B, 3, 'SECTOR GATE B — 3 KEY PIECES', RELEASE.B, 'B');

  // ----- signs -----
  makeSign('RAPTOR PADDOCK', -52, 74, PI / 2);
  makeSign('T-REX KINGDOM', 50, -98, -PI / 2, 7, 0, '#d9534a');
  makeSign('THE AQUARIUM', 44, 66.5, -PI / 2);
  makeSign('THE AVIARY', -56, -84.6, PI / 2);
  makeSign('IT HUNTS FROM ABOVE — STAY UNDER COVER', -64, -95.4, PI / 2, 6.4, 0, '#d9534a');
  makeSign('VISITOR CENTER', -6, -10, PI / 2);
  makeSign('KEEP OUT', -86, 54.4, PI, 5, 0, '#d9534a');
  makeSign('DANGER  10,000 VOLTS', 57.6, -74, -PI / 2, 4, 2.2, '#ffd23a');
  makeSign('DO NOT FEED THE ANIMALS', -59.6, 96, PI / 2, 5, 2.2, '#e8e2d0');
  makeSign('VELOCIRAPTOR  —  PACK HUNTER', -57, 68, PI / 2, 4.4, 0, '#cfd8c0');
  makeSign('TYRANNOSAURUS REX', 54, -79, -PI / 2, 4.4, 0, '#cfd8c0');
  makeSign('ITS EYES FOLLOW MOVEMENT', 54, -101.5, -PI / 2, 4.4, 0, '#cfd8c0');
  function signpost(x, z, rotY, lines) {
    var grp = new THREE.Group();
    cyl(0.09, 0.11, 3.9, M.wood, 0, 1.95, 0, grp, 8); mesh(new THREE.ConeGeometry(0.13, 0.22, 8), M.dark, 0, 4.0, 0, grp); box(0.36, 0.14, 0.36, M.dark, 0, 0.07, 0, grp);
    lines.forEach(function (t, q) {
      box(2.5, 0.5, 0.08, M.wood, 0, 3.5 - q * 0.6, 0.1, grp);
      mesh(new THREE.PlaneGeometry(2.5, 0.5), std(0xffffff, 0.8, { map: textTex([t], 384, 80, '#3a2c1a', '#efe2b0', null) }), 0, 3.5 - q * 0.6, 0.145, grp);
    });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.25 });
  }
  signpost(-6.5, 7, 0, ['VISITOR CENTER  ↑', '←  WEST RANGER POST', 'EAST RANGER POST  →']);
  signpost(6.5, 92, 0, ['←  RAPTOR PADDOCK', 'THE AQUARIUM  →', 'SECTOR GATE A  ↑']);
  signpost(-6.5, -80, 0, ['←  THE AVIARY', 'T-REX KINGDOM  →', 'NORTH BUNKER  ↑']);
  function mapBoard(x, z, rotY) {
    var grp = new THREE.Group();
    var c = document.createElement('canvas'); c.width = c.height = 512; drawParkMap(c.getContext('2d'), 512, null, { x: x, z: z });
    var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    box(3.2, 3.2, 0.14, M.wood, 0, 2.3, 0, grp);
    mesh(new THREE.PlaneGeometry(2.9, 2.9), std(0xffffff, 0.45, { map: tex }), 0, 2.3, 0.08, grp);
    mesh(new THREE.PlaneGeometry(3.2, 0.5), std(0xffffff, 0.8, { map: textTex(['PARK MAP'], 384, 64, '#2b2116', '#e2c56a', null) }), 0, 4.2, 0.08, grp);
    var rf = box(3.9, 0.12, 1.1, M.roof, 0, 4.6, 0.1, grp); rf.rotation.x = 0.16;
    [-1.7, 1.7].forEach(function (px) { box(0.18, 4.5, 0.18, M.wood, px, 2.25, 0, grp); box(0.3, 0.14, 0.3, M.dark, px, 0.07, 0, grp); });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 1.2 });
  }
  mapBoard(-6.5, 124, PI / 2); mapBoard(7, 9, -PI / 2); mapBoard(-6.5, 68, PI / 2);
  mapBoard(6.5, -78, -PI / 2); mapBoard(-60, -6.5, 0); mapBoard(60, 6.5, PI);

  // ----- entrance: ticket booths, turnstiles, barrier, keypad, species banners -----
  [-10.5, 10.5].forEach(function (x) {
    addBox(x, TURN_Z, 3.2, 3.2, 3.1, M.paint);
    box(3.3, 0.5, 3.3, M.dark, x, 0.25, TURN_Z); box(4.2, 0.2, 4.2, M.roof, x, 3.2, TURN_Z); box(3.6, 0.2, 3.6, M.dark, x, 3.42, TURN_Z);
    mesh(new THREE.PlaneGeometry(1.8, 1.1), M.window, x, 1.9, TURN_Z + 1.62).userData.noCast = true;
    box(2.0, 0.08, 0.3, M.wood, x, 1.3, TURN_Z + 1.72);
    makeSign('TICKETS', x, TURN_Z + 1.68, 0, 2.4, 2.85, '#f0e6c8', true);
    [4.6, 6.2, 7.8].forEach(function (o) {
      var tx2 = x < 0 ? -o : o;
      box(0.35, 1.1, 1.1, M.metal, tx2, 0.55, TURN_Z); box(0.4, 0.06, 1.16, M.dark, tx2, 1.12, TURN_Z);
      for (var q = 0; q < 3; q++) { var arm = cyl(0.035, 0.035, 0.75, M.metal, tx2 + (x < 0 ? -0.5 : 0.5), 0.9, TURN_Z, null, 6); arm.rotation.z = PI / 2; arm.rotation.x = q * 2.09; }
    });
    boxes.push({ x1: x < 0 ? -9 : 4.4, x2: x < 0 ? -4.4 : 9, z1: TURN_Z - 0.3, z2: TURN_Z + 0.3 });
  });
  var stripe = canvasTex(64, function (c, S) { for (var q = 0; q < 8; q++) { c.fillStyle = q % 2 ? '#d8d2c2' : '#a8231c'; c.fillRect(q * 8, 0, 8, S); } }, 3, 1);
  W.turnBar = dyn(new THREE.Group());
  box(8.9, 0.16, 0.16, std(0xffffff, 0.6, { map: stripe }), 4.45, 0, 0, W.turnBar); box(0.6, 0.4, 0.3, M.dark, -0.2, 0, 0, W.turnBar);
  W.turnBar.position.set(-4.5, 1.05, TURN_Z); scene.add(W.turnBar);
  box(0.36, 1.2, 0.36, M.yellow, -4.5, 0.6, TURN_Z); box(0.2, 1.0, 0.2, M.dark, 4.4, 0.5, TURN_Z);
  W.turnBox = { x1: -4.4, x2: 4.4, z1: TURN_Z - 0.25, z2: TURN_Z + 0.25 }; boxes.push(W.turnBox);
  box(0.1, 0.6, 0.44, M.dark, -8.86, 1.4, TURN_Z + 1.1);
  mesh(new THREE.PlaneGeometry(0.34, 0.46), std(0xffffff, 0.5, { map: canvasTex(64, function (c, S) { c.fillStyle = '#22262a'; c.fillRect(0, 0, S, S); c.fillStyle = '#0f3a1c'; c.fillRect(8, 4, 48, 10); c.fillStyle = '#9aa3a8'; for (var q = 0; q < 12; q++) c.fillRect(8 + (q % 3) * 18, 18 + ((q / 3) | 0) * 11, 12, 8); }) }), -8.8, 1.4, TURN_Z + 1.1).rotation.y = PI / 2;
  mesh(new THREE.SphereGeometry(0.03, 6, 6), glow(0xff3020), -8.79, 1.74, TURN_Z + 1.1);
  mesh(new THREE.PlaneGeometry(1.6, 0.56), std(0xffffff, 0.8, { map: textTex(['STAFF OVERRIDE', 'BANNER NUMBERS — OLDEST SPECIES FIRST'], 512, 180, '#1c1c1c', '#ffd23a', '#ffd23a', false) }), -8.84, 2.25, TURN_Z + 0.75).rotation.y = PI / 2;
  FLAGS.forEach(function (f) {
    cyl(0.06, 0.08, 5.2, M.metal, f[0], 2.6, f[1], null, 8); mesh(new THREE.SphereGeometry(0.1, 8, 8), M.gold, f[0], 5.25, f[1]); box(0.4, 0.16, 0.4, M.dark, f[0], 0.08, f[1]);
    var sd = f[0] < 0 ? -1 : 1;
    cyl(0.035, 0.035, 1.6, M.metal, f[0] + sd * 0.75, 4.9, f[1], null, 5).rotation.z = PI / 2;
    var fa = livePanel(1.3, 2.3, 128, 226, f[0] + sd * 0.8, 3.7, f[1] + 0.012, 0);
    var fb = mesh(new THREE.PlaneGeometry(1.3, 2.3), fa.mesh.material, f[0] + sd * 0.8, 3.7, f[1] - 0.012); fb.rotation.y = PI;
    fa.mesh.userData.noCast = fb.userData.noCast = true; W.flags.push(fa);
    circles.push({ x: f[0], z: f[1], r: 0.15 });
  });
  // "life through time" board in the entrance shelter: the key to the keypad
  (function () {
    var bx = SAFE[0].x, bz = SAFE[0].z - 2.9, rows = SPECIES.slice().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var c = document.createElement('canvas'); c.width = 512; c.height = 420; var q = c.getContext('2d');
    q.fillStyle = '#12202a'; q.fillRect(0, 0, 512, 420); q.strokeStyle = '#7fd6e8'; q.lineWidth = 6; q.strokeRect(5, 5, 502, 410);
    q.fillStyle = '#7fd6e8'; q.font = 'bold 40px Impact, "Arial Black", sans-serif'; q.textAlign = 'center'; q.fillText('LIFE THROUGH TIME', 256, 52);
    q.font = '17px "Trebuchet MS", Arial'; q.fillStyle = '#9fb4bc'; q.fillText('first appeared — million years ago', 256, 80);
    q.font = '27px "Trebuchet MS", Arial';
    rows.forEach(function (r, n) { q.textAlign = 'left'; q.fillStyle = '#e4eef0'; q.fillText(r[0], 46, 126 + n * 42); q.textAlign = 'right'; q.fillStyle = '#ffd23a'; q.fillText(r[1], 466, 126 + n * 42); });
    var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    box(2.7, 2.25, 0.1, M.wood, bx, 1.75, bz - 0.06); mesh(new THREE.PlaneGeometry(2.55, 2.1), std(0xffffff, 0.6, { map: tex }), bx, 1.75, bz);
    [-1.25, 1.25].forEach(function (o) { box(0.12, 2.9, 0.12, M.wood, bx + o, 1.45, bz - 0.08); });
    boxes.push({ x1: bx - 1.4, x2: bx + 1.4, z1: bz - 0.2, z2: bz + 0.05 });
  })();

  // ----- visitor center: columned front, shuttered entrance holding a key piece, fuse box -----
  addBox(-22, -22, 20, 14, 6, wallMat(20, 6));
  box(22.4, 0.5, 16.4, M.dark, -22, 6.25, -22); box(21, 0.6, 15, M.roof, -22, 6.7, -22); box(20.4, 0.4, 14.4, M.dark, -22, 0.2, -22);
  [-27.5, -16.5].forEach(function (z) { cyl(0.32, 0.36, 6, M.concrete, -11.2, 3, z, null, 12); box(0.9, 0.3, 0.9, M.dark, -11.2, 0.15, z); box(0.9, 0.3, 0.9, M.dark, -11.2, 5.85, z); circles.push({ x: -11.2, z: z, r: 0.42 }); });
  box(1.6, 0.5, 13, M.dark, -11.2, 6.1, -22);
  mesh(new THREE.PlaneGeometry(3, 4), basic(0x000000), -11.97, 2, -22).rotation.y = PI / 2;
  [-27, -17].forEach(function (z) { var vw = mesh(new THREE.PlaneGeometry(2.6, 2.2), M.window, -11.96, 3.3, z); vw.rotation.y = PI / 2; vw.userData.noCast = true; box(0.1, 2.36, 0.1, M.dark, -11.94, 3.3, z); box(0.1, 0.1, 2.76, M.dark, -11.94, 3.3, z); });
  makeSign('VISITOR CENTER', -11.9, -22, PI / 2, 6, 5.2, '#f0cf6a');
  W.cage = dyn(new THREE.Group());
  for (var q = -23.6; q <= -20.39; q += 0.32) cyl(0.04, 0.04, 3.2, M.metal, -8.8, 1.6, q, W.cage, 6);
  for (q = -11.8; q <= -8.81; q += 0.42) { cyl(0.04, 0.04, 3.2, M.metal, q, 1.6, -23.6, W.cage, 6); cyl(0.04, 0.04, 3.2, M.metal, q, 1.6, -20.4, W.cage, 6); }
  [0.1, 3.2].forEach(function (yy) { box(0.14, 0.14, 3.3, M.metal, -8.8, yy, -22, W.cage); box(3.2, 0.14, 0.14, M.metal, -10.4, yy, -23.6, W.cage); box(3.2, 0.14, 0.14, M.metal, -10.4, yy, -20.4, W.cage); });
  scene.add(W.cage);
  cyl(0.5, 0.6, 0.9, M.concrete, -10.6, 0.45, -22, null, 12);                                     // the key piece sits on a plinth behind the shutter
  W.cageBoxes = [{ x1: -9, x2: -8.6, z1: -23.8, z2: -20.2 }, { x1: -12, x2: -8.6, z1: -23.8, z2: -23.4 }, { x1: -12, x2: -8.6, z1: -20.6, z2: -20.2 }];
  W.cageBoxes.forEach(function (b) { boxes.push(b); });
  box(0.3, 1.3, 1.1, M.dark, -11.84, 1.5, -16.2); box(0.08, 1.2, 1.0, M.rust, -11.66, 1.5, -16.2);
  for (i = 0; i < 3; i++) { var fl = glow(0x1a0e06); W.fuseLamps.push(fl); box(0.06, 0.34, 0.14, fl, -11.6, 1.7, -16.5 + i * 0.3); }
  var brk = dyn(new THREE.Group()); brk.position.set(-11.6, 1.15, -16.2); box(0.08, 0.3, 0.1, M.red, 0, 0.12, 0, brk); scene.add(brk); W.breaker = brk;
  W.fusePlaque = livePanel(2.3, 1.15, 512, 256, -11.9, 3.1, -16.2, PI / 2); box(0.08, 1.3, 2.45, M.wood, -11.96, 3.1, -16.2);

  addBox(22, 100, 10, 8, 4, retile(M.plank, 3, 1.4)); box(11.6, 0.3, 9.6, M.roof, 22, 4.15, 100); box(10.4, 0.3, 8.4, M.dark, 22, 0.15, 100);
  mesh(new THREE.PlaneGeometry(3.2, 1.6), M.window, 16.97, 2.2, 102.2).rotation.y = -PI / 2; mesh(new THREE.PlaneGeometry(1.3, 2.4), basic(0x050505), 16.97, 1.2, 98).rotation.y = -PI / 2;
  makeSign('GIFT SHOP', 16.9, 100, -PI / 2, 5, 3.5);
  addBox(-18, -70, 8, 6, 3.5, wallMat(8, 3.5)); box(9, 0.3, 7, M.roof, -18, 3.65, -70);
  [-20, -16].forEach(function (x) { mesh(new THREE.PlaneGeometry(1.1, 2.3), basic(0x050505), x, 1.15, -66.97); });
  makeSign('RESTROOMS', -18, -66.94, 0, 3.4, 3.0, '#e8e2d0', true);
  function vending(x, z, rotY, hue) {
    var grp = new THREE.Group();
    box(1.2, 2.2, 0.9, M.dark, 0, 1.1, 0, grp);
    var tex = canvasTex(128, function (c, S) {
      c.fillStyle = hue; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(10, 30, S - 20, S - 50);
      for (var r = 0; r < 4; r++) for (var q2 = 0; q2 < 5; q2++) { c.fillStyle = ['#e33', '#3a6', '#fc3', '#39f', '#eee'][(r + q2) % 5]; c.fillRect(16 + q2 * 20, 36 + r * 18, 12, 14); }
      c.fillStyle = '#fff'; c.font = 'bold 18px Arial'; c.textAlign = 'center'; c.fillText('DINO COLA', S / 2, 22);
    });
    mesh(new THREE.PlaneGeometry(1.05, 2.0), basic(0xb0b0b0, { map: tex }), 0, 1.12, 0.46, grp);
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.8 });
  }
  vending(20, 104.6, 0, '#1b3f8a'); vending(-13.4, -70, PI / 2, '#8a1b1b');

  // ----- benches, bins, picnic tables, food carts, jeep -----
  function bench(x, z, rotY) {
    var grp = new THREE.Group();
    [-0.22, -0.07, 0.08, 0.23].forEach(function (o) { box(2, 0.06, 0.13, M.plank, 0, 0.5, o, grp); });
    [0.7, 0.88, 1.06].forEach(function (yy, n) { box(2, 0.13, 0.05, M.plank, 0, yy, -0.33 - n * 0.03, grp); });
    [-0.85, 0.85].forEach(function (px) { box(0.07, 1.15, 0.07, M.dark, px, 0.57, -0.36, grp).rotation.x = -0.08; box(0.07, 0.5, 0.07, M.dark, px, 0.25, 0.22, grp); box(0.07, 0.07, 0.66, M.dark, px, 0.46, -0.05, grp); box(0.07, 0.07, 0.5, M.dark, px, 0.72, -0.1, grp); });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.9 });
  }
  [[-5.6, 92, PI / 2], [5.6, 70, -PI / 2], [-5.6, 25, PI / 2], [5.6, -30, -PI / 2], [-5.6, -72, PI / 2], [-30, -5.6, 0], [40, 5.6, PI],
   [-75, 5.6, PI], [75, -5.6, 0], [-40, 74.4, 0], [35, 54.4, 0], [20, -95.6, 0], [-55, -84.4, PI]].forEach(function (b) { bench(b[0], b[1], b[2]); });
  var binTex = textTex(['LITTER'], 128, 40, '#143320', '#d8d2c2', null, false);
  function bin(x, z, tipped) {
    var grp = new THREE.Group();
    cyl(0.36, 0.3, 0.95, M.binGreen, 0, 0.475, 0, grp, 14); cyl(0.37, 0.37, 0.05, M.dark, 0, 0.3, 0, grp, 14); cyl(0.39, 0.39, 0.1, M.dark, 0, 1.0, 0, grp, 14); cyl(0.2, 0.32, 0.22, M.dark, 0, 1.13, 0, grp, 14);
    mesh(new THREE.PlaneGeometry(0.44, 0.14), std(0xffffff, 0.6, { map: binTex }), 0, 0.7, 0.345, grp);
    grp.position.set(x, 0, z);
    if (tipped) { grp.rotation.set(0, srand() * 6, PI / 2 - 0.05); grp.position.y = 0.36; }
    scene.add(grp); circles.push({ x: x, z: z, r: tipped ? 0.6 : 0.45 });
  }
  [[-5.6, 94.3], [5.6, 67.7], [-5.6, 27.3], [5.6, -27.6, 1], [-5.6, -69.6], [-27.6, -5.6], [42.4, 5.6], [-72.5, 5.6], [72.5, -5.6],
   [-37.6, 74.4, 1], [37.4, 54.4], [22.4, -95.6], [6.2, 119], [-6, 12], [68, 52], [-12, -37, 1], [-56, 72]].forEach(function (b) { bin(b[0], b[1], b[2]); });
  function picnic(x, z, rotY) {
    var grp = new THREE.Group();
    box(2.2, 0.07, 0.95, M.plank, 0, 0.8, 0, grp);
    [-0.85, 0.85].forEach(function (o) { box(2.2, 0.06, 0.3, M.plank, 0, 0.46, o, grp); });
    [-0.8, 0.8].forEach(function (px) { box(0.08, 0.9, 0.08, M.wood, px, 0.4, 0.45, grp).rotation.x = 0.5; box(0.08, 0.9, 0.08, M.wood, px, 0.4, -0.45, grp).rotation.x = -0.5; box(0.08, 0.08, 1.9, M.wood, px, 0.42, 0, grp); });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 1.3 });
  }
  picnic(62, 48, 0.3); picnic(60, 80, -0.5); picnic(52, 72, 1.2); picnic(-14, 12, 0.2);
  var stripes = canvasTex(64, function (c, S) { for (var q2 = 0; q2 < 8; q2++) { c.fillStyle = q2 % 2 ? '#d8d2c2' : '#a8231c'; c.fillRect(q2 * 8, 0, 8, S); } });
  function cart(x, z, rotY, label) {
    var grp = new THREE.Group();
    box(2.1, 1.1, 1.1, M.paint, 0, 0.95, 0, grp); box(2.2, 0.06, 1.2, M.metal, 0, 1.53, 0, grp);
    var cn = box(2.7, 0.08, 1.8, std(0xffffff, 0.9, { map: stripes }), 0, 2.5, 0, grp); cn.rotation.x = 0.06;
    [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(function (o) { cyl(0.03, 0.03, 1.0, M.metal, o[0], 2.0, o[1], grp, 5); });
    [-0.7, 0.7].forEach(function (px) { var wh = cyl(0.4, 0.4, 0.08, M.rubber, px, 0.4, 0.6, grp, 16); wh.rotation.x = PI / 2; cyl(0.1, 0.1, 0.1, M.metal, px, 0.4, 0.62, grp, 8).rotation.x = PI / 2; });
    box(0.06, 0.06, 0.9, M.metal, -1.3, 1.0, 0, grp);
    mesh(new THREE.PlaneGeometry(1.9, 0.5), std(0xffffff, 0.8, { map: textTex([label], 256, 64, '#a8231c', '#f6e9c0', null) }), 0, 1.05, 0.56, grp);
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 1.4 });
  }
  cart(7.2, 28, -PI / 2, 'POPCORN'); cart(11, -9, 0.4, 'ICE CREAM'); cart(58, 67.5, PI, 'HOT DOGS');
  var jeep = new THREE.Group(), jp = std(0x5a6b3a, 0.5, { metalness: 0.35, bumpMap: bump(3), bumpScale: 0.01 });
  box(2.2, 0.75, 4.4, jp, 0, 0.95, 0, jeep); box(2.2, 0.35, 1.5, jp, 0, 1.45, 1.4, jeep); box(2.05, 0.9, 1.9, jp, 0, 1.85, -0.5, jeep);
  box(1.85, 0.62, 0.05, M.window, 0, 1.9, 0.47, jeep).rotation.x = -0.25; box(0.05, 0.6, 1.3, M.window, 1.03, 1.9, -0.4, jeep); box(0.05, 0.6, 1.3, M.window, -1.03, 1.9, -0.4, jeep);
  box(2.3, 0.2, 0.2, M.dark, 0, 0.62, 2.25, jeep); box(2.3, 0.2, 0.2, M.dark, 0, 0.62, -2.25, jeep); box(1.2, 0.45, 0.06, M.dark, 0, 1.2, 2.21, jeep);
  [-0.8, 0.8].forEach(function (x) { mesh(new THREE.SphereGeometry(0.16, 10, 10), std(0xdfe6ea, 0.2, { metalness: 0.6 }), x, 1.2, 2.2, jeep).scale.z = 0.4; box(0.3, 0.14, 0.05, M.red, x, 1.1, -2.21, jeep); });
  [[-1.1, 1.45], [1.1, 1.45], [-1.1, -1.45], [1.1, -1.45]].forEach(function (w) { var wh = cyl(0.5, 0.5, 0.42, M.rubber, w[0], 0.5, w[1], jeep, 16); wh.rotation.z = PI / 2; cyl(0.22, 0.22, 0.44, M.metal, w[0], 0.5, w[1], jeep, 8).rotation.z = PI / 2; });
  cyl(0.5, 0.5, 0.36, M.rubber, 0, 1.3, -2.45, jeep, 16).rotation.x = PI / 2;
  jeep.position.set(9, 0, -22); jeep.rotation.set(0, 0.5, 0.06); scene.add(jeep); circles.push({ x: 9, z: -22, r: 2.6 });

  // ----- plaza: the mounted Tyrannosaurus skeleton -----
  cyl(3.3, 3.5, 0.62, M.concrete, 0, 0.31, 0, null, 28); cyl(3.42, 3.42, 0.1, M.dark, 0, 0.62, 0, null, 28);
  W.skeleton = buildRexSkeleton(0, 0);
  var pl = mesh(new THREE.PlaneGeometry(2.2, 0.8), std(0xffffff, 0.5, { map: infoTex('TYRANNOSAURUS REX', ['"Tyrant lizard king" — 68 million years old', 'Found 1990 · 12.3 m · bite force 35,000 N'], '#f0cf6a', 190) }), 0, 0.95, 3.56);
  pl.rotation.x = -0.5; box(2.4, 0.9, 0.1, M.dark, 0, 0.9, 3.5).rotation.x = -0.5;
  circles.push({ x: 0, z: 0, r: 3.6 });

  // ----- the aquarium -----
  (function aquarium() {
    var cz = (AQ.z1 + AQ.z2) / 2, len = AQ.x2 - AQ.x1 + 1.5;
    addBox((AQ.x1 + AQ.x2) / 2, AQ.z1, len, 1.5, 7, wallMat(len)); addBox((AQ.x1 + AQ.x2) / 2, AQ.z2, len, 1.5, 7, wallMat(len));
    addBox(AQ.x2, cz, 1.5, 33.5, 7, wallMat(33));
    [AQ.x1, 88].forEach(function (x) { addBox(x, 51.625, 1.5, 12.75, 7, wallMat(12)); addBox(x, 70.375, 1.5, 16.75, 7, wallMat(16)); addBox(x, 60, 1.5, 4, 3.4, M.concrete, false, 3.6); });
    box(len + 1, 0.5, 34.5, M.dark, (AQ.x1 + AQ.x2) / 2, 7.25, cz); box(len + 2, 0.3, 35.5, M.roof, (AQ.x1 + AQ.x2) / 2, 7.6, cz);
    [56.6, 63.4].forEach(function (z) { cyl(0.3, 0.34, 5.5, M.concrete, AQ.x1 - 2.2, 2.75, z, null, 12); circles.push({ x: AQ.x1 - 2.2, z: z, r: 0.4 }); });
    box(3.4, 0.4, 9, M.dark, AQ.x1 - 1.5, 5.7, 60);                                                 // entrance canopy
    makeSign('THE AQUARIUM', AQ.x1 - 3.25, 60, -PI / 2, 8, 6.6, '#7fd6e8');
    makeSign('PLESIOSAUR HALL', 87.2, 60, -PI / 2, 5, 4.6, '#7fd6e8');
    makeSign('DO NOT ENTER THE WATER', 92.4, 54, -PI / 2, 4, 0, '#d9534a');
    [[AQ.x1 + 0.75, POOL.x1], [POOL.x2, AQ.x2 - 0.75]].forEach(function (r) {
      var w = r[1] - r[0], fl2 = mesh(new THREE.PlaneGeometry(w, 30.5), retile(M.tile, w / 4, 30.5 / 4), (r[0] + r[1]) / 2, 0.025, cz); fl2.rotation.x = -PI / 2; fl2.userData.noCast = true;
    });
    var pw = POOL.x2 - POOL.x1, pd = POOL.z2 - POOL.z1, px = (POOL.x1 + POOL.x2) / 2, depth = -POOL.floor;
    mesh(new THREE.PlaneGeometry(pw, pd), retile(M.tile, pw / 4, pd / 4), px, POOL.floor, cz).rotation.x = -PI / 2;
    mesh(new THREE.PlaneGeometry(pw, depth), retile(M.tile, pw / 4, 0.6), px, POOL.floor / 2, POOL.z1);
    mesh(new THREE.PlaneGeometry(pw, depth), retile(M.tile, pw / 4, 0.6), px, POOL.floor / 2, POOL.z2).rotation.y = PI;
    mesh(new THREE.PlaneGeometry(pd, depth), retile(M.tile, pd / 4, 0.6), POOL.x1, POOL.floor / 2, cz).rotation.y = PI / 2;
    mesh(new THREE.PlaneGeometry(pd, depth), retile(M.tile, pd / 4, 0.6), POOL.x2, POOL.floor / 2, cz).rotation.y = -PI / 2;
    W.waterMat = std(0x0a4a5c, 0.05, { metalness: 0.75, transparent: true, opacity: 0.84, side: THREE.DoubleSide, bumpMap: bump(3), bumpScale: 0.018 });
    var wat = mesh(new THREE.PlaneGeometry(pw, pd), W.waterMat, px, POOL.water, cz); wat.rotation.x = -PI / 2; wat.userData.noCast = true;
    [POOL.x1 - 0.2, POOL.x2 + 0.2].forEach(function (x) { box(0.4, 0.06, pd, M.yellow, x, 0.04, cz); });           // hazard edging
    var rl = Math.hypot(4, -POOL.swim), ra = Math.atan2(-POOL.swim, 4);
    box(rl, 0.2, 2.75, M.rust, 95, POOL.swim / 2 - 0.1, 48.1).rotation.z = -ra; box(rl, 0.2, 2.75, M.rust, 123, POOL.swim / 2 - 0.1, 75.9).rotation.z = ra;
    PLATFORMS.forEach(function (p) {
      box(p[2], 0.25, p[2], M.concrete, p[0], p[3] - 0.125, p[1]); box(p[2] + 0.08, 0.06, p[2] + 0.08, M.yellow, p[0], p[3] - 0.02, p[1]).userData.noCast = true;
      cyl(0.22, 0.26, p[3] - 0.25 - POOL.floor, M.rust, p[0], (p[3] - 0.25 + POOL.floor) / 2, p[1]); cyl(0.4, 0.3, 0.2, M.rust, p[0], p[3] - 0.35, p[1]);
      circles.push({ x: p[0], z: p[1], r: 0.26, top: p[3] - 0.25 });
    });
    var grate = std(0x3c4347, 0.5, { metalness: 0.7, bumpMap: bump(8), bumpScale: 0.05 });
    W.covers = [dyn(box(16.2, 0.16, pd, grate, 84.6, -0.1, cz)), dyn(box(16.2, 0.16, pd, grate, 133.4, -0.1, cz))];
    function tank(x, z, face, title, lines, fill) {
      var grp = new THREE.Group();
      box(3.2, 0.9, 1.3, M.dark, 0, 0.45, 0, grp); box(3.0, 0.12, 1.1, std(0x8a7a52, 1, { bumpMap: bump(2), bumpScale: 0.05 }), 0, 0.96, 0, grp);
      mesh(new THREE.PlaneGeometry(3.0, 1.5), basic(0x0e4558), 0, 1.65, -0.54, grp); box(3.2, 0.12, 1.3, M.dark, 0, 2.46, 0, grp);
      [-1.55, 1.55].forEach(function (o) { box(0.08, 1.5, 0.08, M.metal, o, 1.65, 0.6, grp); });
      if (fill) { box(3.1, 1.5, 1.2, M.glass, 0, 1.65, 0, grp).userData.noCast = true; fill(grp); for (var w2 = 0; w2 < 5; w2++) { var wd = cyl(0.012, 0.03, 0.5 + Math.random() * 0.5, std(0x2f6a3a, 0.8), -1.3 + Math.random() * 2.6, 1.3, -0.3 + Math.random() * 0.3, grp, 5); wd.rotation.z = (Math.random() - 0.5) * 0.3; } }
      else {
        for (var s2 = 0; s2 < 7; s2++) { var sh = mesh(new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.3), M.glass, -1.4 + Math.random() * 2.8, 0.03, 0.9 + Math.random(), grp); sh.rotation.set(-PI / 2, 0, Math.random() * 6); sh.userData.noCast = true; }
        var pud = mesh(new THREE.CircleGeometry(1.3, 16), M.water, 0.3, 0.035, 1.4, grp); pud.rotation.x = -PI / 2; pud.userData.noCast = true;
      }
      mesh(new THREE.PlaneGeometry(2.9, 1.27), std(0xffffff, 0.6, { map: infoTex(title, lines, '#7fd6e8') }), 0, 3.4, -0.5, grp);
      grp.position.set(x, 0, z); grp.rotation.y = face; scene.add(grp);
      boxes.push({ x1: x - 1.6, x2: x + 1.6, z1: z - 0.65, z2: z + 0.65 });
    }
    var shell = std(0x6a5236, 0.5, { bumpMap: bump(3), bumpScale: 0.02 }), amm = std(0xb89a62, 0.4);
    tank(78.5, 47.5, 0, 'TRILOBITES', ['Armoured arthropods of the sea floor.', 'Lived 521 – 252 million years ago.', 'Among the first animals with complex eyes.'], function (grp) {
      [[-0.9, 0.2, 0.4], [0.2, -0.1, -0.9], [1.0, 0.25, 2.2]].forEach(function (t) {
        var tr = new THREE.Group();
        for (var s2 = 0; s2 < 9; s2++) { var w = 0.2 * Math.sin((s2 + 1.3) / 10.5 * PI) + 0.04; mesh(sphGeo, shell, 0, 0, 0.16 - s2 * 0.042, tr).scale.set(w * 2, 0.075, 0.065); mesh(sphGeo, shell, 0, 0.02, 0.16 - s2 * 0.042, tr).scale.set(w * 0.7, 0.09, 0.065); }
        mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, PI * 2, 0, PI / 2), shell, 0, 0, 0.2, tr).scale.set(0.4, 0.14, 0.26);
        tr.position.set(t[0], 1.05, t[1]); tr.rotation.y = t[2]; grp.add(tr);
      });
    });
    tank(84, 47.5, 0, 'AMMONITES', ['Coiled-shell cousins of squid and octopus.', 'Jet-propelled hunters of ancient seas.', 'Vanished 66 million years ago.'], function (grp) {
      [[-0.8, 1.7, 0], [0.7, 1.5, 0.15]].forEach(function (t) {
        var am = new THREE.Group();
        [[0.22, 0.09], [0.11, 0.06], [0.04, 0.035]].forEach(function (r) { mesh(new THREE.TorusGeometry(r[0], r[1], 10, 22), amm, 0, 0, 0, am); });
        for (var s2 = 0; s2 < 7; s2++) { var tn = mesh(new THREE.ConeGeometry(0.018, 0.24, 5), std(0x8a4a3a, 0.5), 0.3 + (s2 % 2) * 0.03, -0.12 + s2 * 0.028, (s2 - 3) * 0.02, am); tn.rotation.z = -PI / 2 - 0.4 + s2 * 0.1; }
        am.position.set(t[0], t[1], t[2]); grp.add(am);
      });
    });
    tank(78.5, 76.5, PI, 'HORSESHOE CRABS', ['A true living fossil.', 'Barely changed in 445 million years.', 'Closer kin to spiders than to crabs.'], function (grp) {
      [[-0.7, 0.1, 0.5], [0.8, -0.1, 2.6]].forEach(function (t) {
        var hc = new THREE.Group();
        mesh(new THREE.SphereGeometry(0.5, 14, 8, 0, PI * 2, 0, PI / 2), shell, 0, 0, 0, hc).scale.set(0.5, 0.22, 0.5);
        mesh(new THREE.ConeGeometry(0.02, 0.4, 5), shell, 0, 0.03, -0.42, hc).rotation.x = -PI / 2;
        hc.position.set(t[0], 1.03, t[1]); hc.rotation.y = t[2]; grp.add(hc);
      });
    });
    tank(84, 76.5, PI, 'SEA SCORPION', ['Eurypterid. Apex predator, 430 million years ago.', 'Some grew longer than a person.', 'TANK UNDER MAINTENANCE'], null);
    var l1 = new THREE.PointLight(0x4fc3d8, 0.9, 20, 1.4); l1.position.set(81, 3.2, 62); scene.add(l1);
    var l2 = new THREE.PointLight(0x2f9fc0, 0.8, 46, 1.2); l2.position.set(109, 5.5, 62); scene.add(l2);
    [[100, 54], [100, 70], [118, 54], [118, 70]].forEach(function (p) { box(1.6, 0.12, 0.4, glow(0x2f8fa8), p[0], 6.9, p[1]); });
    mesh(new THREE.PlaneGeometry(4.4, 1.9), std(0xffffff, 0.6, { map: infoTex('PLESIOSAUR', ['Long-necked marine reptile. Not a dinosaur.', 'Hunts by ambush from below.', 'Cross by the maintenance platforms only.'], '#ff8a7a') }), 88.78, 2.6, 68.5).rotation.y = PI / 2;
  })();

  // ----- the aviary -----
  (function aviary() {
    var gapA = Math.atan2(5, 29.6);
    for (i = 0; i < 26; i++) {
      var an = i / 26 * PI * 2, d = Math.abs(angDiff(an, gapA));
      if (d < 0.2) continue;
      var px = AV.x + Math.cos(an) * AV.r, pz = AV.z + Math.sin(an) * AV.r;
      cyl(0.4, 0.55, 7, M.rust, px, 3.5, pz, null, 10); cyl(0.7, 0.7, 0.3, M.concrete, px, 0.15, pz, null, 10); circles.push({ x: px, z: pz, r: 0.7 });
    }
    var dome = mesh(new THREE.SphereGeometry(AV.r, 36, 12, 0, PI * 2, 0, PI / 2), basic(0x59626a, { wireframe: true, transparent: true, opacity: 0.4 }), AV.x, 0, AV.z);
    dome.scale.y = AV.h / AV.r;
    COVERS.forEach(function (c, q) {
      var rf = box(5.5, 0.1, 5.5, M.roof, c[0], 2.98, c[1]); rf.rotation.z = 0.04; box(5.3, 0.14, 0.14, M.wood, c[0], 2.86, c[1] - 2.4); box(5.3, 0.14, 0.14, M.wood, c[0], 2.86, c[1] + 2.4);
      [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(function (o) { box(0.18, 2.9, 0.18, M.wood, c[0] + o[0], 1.45, c[1] + o[1]); circles.push({ x: c[0] + o[0], z: c[1] + o[1], r: 0.2 }); });
      var w = WINCH.indexOf(q); if (w < 0) return;
      box(1.1, 0.5, 0.9, M.dark, c[0], 0.25, c[1]); [-0.42, 0.42].forEach(function (o) { box(0.1, 0.9, 0.7, M.rust, c[0] + o, 0.9, c[1]); });
      cyl(0.3, 0.3, 0.7, M.rust, c[0], 0.95, c[1], null, 14).rotation.z = PI / 2; cyl(0.34, 0.34, 0.05, M.metal, c[0] - 0.3, 0.95, c[1], null, 14).rotation.z = PI / 2; cyl(0.34, 0.34, 0.05, M.metal, c[0] + 0.3, 0.95, c[1], null, 14).rotation.z = PI / 2;
      var crank = dyn(new THREE.Group()); crank.position.set(c[0] + 0.52, 0.95, c[1]);
      box(0.06, 0.5, 0.06, M.metal, 0, 0.25, 0, crank); box(0.3, 0.07, 0.07, M.red, 0.15, 0.5, 0, crank); scene.add(crank); W.cranks.push(crank);
      circles.push({ x: c[0], z: c[1], r: 0.75 });
    });
    W.winchSigns = [livePanel(2.4, 0.8, 384, 128, COVERS[WINCH[0]][0] + 2.78, 3.5, COVERS[WINCH[0]][1], PI / 2), livePanel(2.4, 0.8, 384, 128, COVERS[WINCH[1]][0] + 2.78, 3.5, COVERS[WINCH[1]][1], PI / 2)];
    W.aviPlaque = livePanel(5.4, 2.1, 640, 250, -65.9, 2.2, -84.6, PI / 2);
    box(0.1, 2.3, 5.6, M.wood, -66, 2.2, -84.6); [-87.2, -82].forEach(function (z) { box(0.18, 3.4, 0.18, M.wood, -66.05, 1.7, z); });
    cyl(0.8, 0.95, 0.5, M.concrete, AV.x, 0.25, AV.z, null, 14); cyl(0.025, 0.025, AV.h, M.metal, AV.x, AV.h / 2 + 2.2, AV.z, null, 5);
    W.aviCage = dyn(new THREE.Group());
    mesh(new THREE.BoxGeometry(1.1, 1.5, 1.1), basic(0xc8c8c8, { wireframe: true }), 0, 0, 0, W.aviCage); box(1.2, 0.08, 1.2, M.metal, 0, 0.78, 0, W.aviCage); box(1.2, 0.08, 1.2, M.metal, 0, -0.78, 0, W.aviCage);
    W.aviCage.position.set(AV.x, 1.4, AV.z); scene.add(W.aviCage);
    PERCHES.forEach(function (p) { cyl(0.06, 0.06, 2.4, M.wood, p[0], domeY(p[0], p[1]) - 0.4, p[1], null, 5).rotation.z = PI / 2; });
  })();

  // ----- t-rex kingdom: feeding platform, siren, call post, keeper's lockbox -----
  addBox(100, -108, 6, 6, 1.2, M.concrete); box(6.2, 0.1, 6.2, M.yellow, 100, 1.22, -108);
  cyl(0.1, 0.12, 5, M.metal, 100, 3.7, -108, null, 6);
  W.sirenLamp = mesh(new THREE.SphereGeometry(0.4, 10, 10), glow(0xff2a1a), 100, 6.3, -108); W.sirenLamp.visible = false;
  for (i = 0; i < 5; i++) mesh(new THREE.TorusGeometry(1.1, 0.12, 6, 12, PI), M.bone, 80 + i * 0.8, 0, -100);
  mesh(sphGeo, M.bone, 79, 0.35, -100).scale.set(1, 0.8, 1.5);
  addBox(52, -85, 0.4, 0.4, 1.3, M.yellow, false); box(0.5, 0.5, 0.3, M.dark, 52, 1.4, -85); cyl(0.14, 0.14, 0.1, M.red, 51.82, 1.4, -85, null, 12).rotation.z = PI / 2;
  circles.push({ x: 52, z: -85, r: 0.4 });
  makeSign('FEEDING CALL', 51.8, -85, -PI / 2, 2.6, 2.5, '#ffd23a'); makeSign('DRAWS THE ANIMAL TO THE FAR PLATFORM', 51.8, -85, -PI / 2, 2.6, 1.95, '#cfd8c0');
  box(1.3, 0.8, 0.9, M.dark, LOCKBOX[0], 0.4, LOCKBOX[1]); box(1.36, 0.1, 0.96, M.yellow, LOCKBOX[0], 0.8, LOCKBOX[1]);
  W.boxLid = dyn(new THREE.Group()); W.boxLid.position.set(LOCKBOX[0], 0.85, LOCKBOX[1] - 0.45);
  box(1.3, 0.14, 0.9, M.dark, 0, 0.07, 0.45, W.boxLid); box(0.2, 0.26, 0.08, M.gold, 0, -0.04, 0.92, W.boxLid); scene.add(W.boxLid);
  mesh(new THREE.PlaneGeometry(1.1, 0.4), std(0xffffff, 0.6, { map: textTex(["KEEPER'S LOCKBOX"], 256, 92, '#101010', '#ffd23a', null, false) }), LOCKBOX[0], 0.42, LOCKBOX[1] + 0.455);
  circles.push({ x: LOCKBOX[0], z: LOCKBOX[1], r: 0.8 });

  // ----- raptor paddock: holding pen door, lever stations, protocol plaque -----
  W.penDoor = dyn(new THREE.Group());
  for (var z = 0.15; z < 6; z += 0.36) cyl(0.04, 0.04, 3.4, M.metal, 0, 1.7, z, W.penDoor, 6);
  [0.3, 1.7, 3.3].forEach(function (yy) { box(0.12, 0.12, 6, M.metal, 0, yy, 3, W.penDoor); }); box(0.16, 0.5, 0.4, M.yellow, 0, 1.7, 5.7, W.penDoor);
  W.penDoor.position.set(-82, 0, 77); scene.add(W.penDoor);
  W.penBox = { x1: -82.2, x2: -81.8, z1: 77, z2: 83 }; boxes.push(W.penBox);
  cyl(0.45, 0.55, 0.7, M.concrete, -85, 0.35, 80, null, 12);
  box(0.12, 2.3, 3.7, M.wood, -80.9, 2.1, 86.2); [84.5, 87.9].forEach(function (pz) { box(0.16, 3.3, 0.16, M.wood, -81, 1.65, pz); });
  W.plaque = livePanel(3.5, 2.1, 640, 384, -80.83, 2.1, 86.2, PI / 2);
  circles.push({ x: -81, z: 86.2, r: 0.9 });
  LEVERS.forEach(function (lv, q2) {
    var st = new THREE.Group();
    box(0.9, 0.16, 0.7, M.concrete, 0, 0.08, 0, st); box(0.5, 0.9, 0.4, M.yellow, 0, 0.6, 0, st);
    cyl(0.26, 0.26, 0.42, M.dark, 0, 1.05, 0, st, 14).rotation.z = PI / 2;
    var lamp = glow(0x400a06); W.leverLamps.push(lamp); mesh(new THREE.SphereGeometry(0.07, 8, 8), lamp, 0, 0.75, 0.21, st);
    var h = dyn(new THREE.Group()); h.position.set(0, 1.05, 0);
    cyl(0.035, 0.035, 0.8, M.metal, 0, 0.4, 0, h, 6); mesh(new THREE.SphereGeometry(0.1, 10, 10), M.red, 0, 0.84, 0, h); st.add(h); W.levers.push(h);
    var tex = textTex([ROMAN[q2]], 128, 128, '#1c1c1c', '#ffd23a', '#ffd23a', false);
    cyl(0.04, 0.04, 2.6, M.metal, 0.5, 1.3, 0, st, 5); box(0.7, 0.7, 0.06, M.dark, 0.5, 2.6, 0, st);
    mesh(new THREE.PlaneGeometry(0.62, 0.62), std(0xffffff, 0.7, { map: tex }), 0.5, 2.6, 0.035, st); mesh(new THREE.PlaneGeometry(0.62, 0.62), std(0xffffff, 0.7, { map: tex }), 0.5, 2.6, -0.035, st).rotation.y = PI;
    st.position.set(lv[0], 0, lv[1]); scene.add(st); st.userData.station = q2; W['leverSt' + q2] = st;
    circles.push({ x: lv[0], z: lv[1], r: 0.5 });
  });

  // ----- stains and puddles -----
  for (i = 0; i < 18; i++) {
    var pp = PATHS[i % PATHS.length], bx = pp[0] + Math.random() * (pp[1] - pp[0]), bz = pp[2] + Math.random() * (pp[3] - pp[2]);
    if (dist(bx, bz, START.x, START.z) < 25 || inRect(bx, bz, AQ, 2)) continue;
    var stn = mesh(new THREE.CircleGeometry(0.5 + Math.random() * 1.1, 14), M.blood, bx, 0.05, bz);
    stn.rotation.x = -PI / 2; stn.scale.set(1, 0.5 + Math.random() * 0.8, 1); stn.rotation.z = Math.random() * 6; stn.userData.noCast = true;
  }
  var puddle = std(0x0a0d10, 0.03, { metalness: 0.92, transparent: true, opacity: 0.82 });
  for (i = 0; i < 30; i++) {
    pp = PATHS[i % PATHS.length]; bx = pp[0] + 1 + Math.random() * (pp[1] - pp[0] - 2); bz = pp[2] + 1 + Math.random() * (pp[3] - pp[2] - 2);
    if (inRect(bx, bz, AQ, 2)) continue;
    var pu = mesh(new THREE.CircleGeometry(0.6 + Math.random() * 1.3, 18), puddle, bx, 0.045, bz);
    pu.rotation.x = -PI / 2; pu.scale.set(1, 0.4 + Math.random() * 0.7, 1); pu.rotation.z = Math.random() * 6; pu.userData.noCast = true;
  }

  // ----- safe zones (ranger shelters) + save terminals -----
  var termTex = canvasTex(64, function (c, S) { c.fillStyle = '#eaffef'; c.fillRect(0, 0, S, S); c.fillStyle = '#1c6a3a'; for (var q2 = 0; q2 < 5; q2++) c.fillRect(6, 8 + q2 * 10, 20 + ((q2 * 37) % 30), 4); });
  function terminal(t) {
    box(0.9, 1.05, 0.6, M.dark, t.x, 0.52, t.z); box(1.0, 0.08, 0.7, M.metal, t.x, 1.08, t.z);
    var mat = basic(0x551010, { map: termTex, fog: false }); W.termScr.push(mat);
    var scr = box(0.78, 0.5, 0.06, mat, t.x, 1.42, t.z - 0.12); scr.rotation.x = -0.3; box(0.86, 0.58, 0.08, M.dark, t.x, 1.42, t.z - 0.17).rotation.x = -0.3;
    circles.push({ x: t.x, z: t.z, r: 0.6 });
  }
  SAFE.forEach(function (s2) {
    var floor = mesh(new THREE.CircleGeometry(SAFE_R, 36), M.concrete, s2.x, 0.04, s2.z); floor.rotation.x = -PI / 2; floor.userData.noCast = true;
    var ringMat = glow(0x35ff8a); ringMat.side = THREE.DoubleSide;
    mesh(new THREE.RingGeometry(SAFE_R - 0.3, SAFE_R, 56), ringMat, s2.x, 0.07, s2.z).rotation.x = -PI / 2;
    box(7.4, 0.14, 7.4, M.roof, s2.x, 3.7, s2.z).rotation.x = 0.03; box(7, 0.2, 7, M.dark, s2.x, 3.55, s2.z);
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(function (o) { box(0.26, 3.6, 0.26, M.metal, s2.x + o[0], 1.8, s2.z + o[1]); box(0.5, 0.16, 0.5, M.dark, s2.x + o[0], 0.08, s2.z + o[1]); circles.push({ x: s2.x + o[0], z: s2.z + o[1], r: 0.3 }); });
    var l = new THREE.PointLight(0x4dffa0, 1.3, 22, 1.5); l.position.set(s2.x, 3.1, s2.z); scene.add(l);
    var lampM = basic(0x9dffc8); box(0.7, 0.1, 0.7, lampM, s2.x, 3.42, s2.z);
    cyl(0.05, 0.07, 3.2, M.metal, s2.x + 3, 5.3, s2.z - 3, null, 6);                                 // radio mast
    var beacon = cyl(0.22, 0.22, 90, glow(0x35ff8a), s2.x, 49, s2.z, null, 6); beacon.material.transparent = true; beacon.material.opacity = 0.33; beacon.material.depthWrite = false;
    W.safeViz.push({ ring: ringMat, beacon: beacon, light: l, lamp: lampM });
  });
  TERMS.forEach(terminal);

  // ----- lamp posts with light cones -----
  var coneMat = basic(0xffffff, { map: coneGlow, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true });
  [[5.6, 105], [-5.6, 45], [5.6, -50], [-50, 5.6], [50, -5.6], [-40, -84.4], [30, 65.6]].forEach(function (p, idx) {
    cyl(0.08, 0.14, 5.2, M.metal, p[0], 2.6, p[1], null, 8); cyl(0.2, 0.24, 0.5, M.dark, p[0], 0.25, p[1], null, 8);
    var side = p[0] > 0 && Math.abs(p[0]) < 10 ? -1 : 1;
    cyl(0.05, 0.05, 1.2, M.metal, p[0] + side * 0.5, 5.2, p[1], null, 6).rotation.z = PI / 2; cyl(0.34, 0.1, 0.22, M.dark, p[0] + side * 1.0, 5.2, p[1], null, 10);
    var bulb = mesh(new THREE.SphereGeometry(0.2, 10, 10), basic(0xffe2b0), p[0] + side * 1.0, 5.05, p[1]);
    var cn2 = mesh(new THREE.ConeGeometry(2.6, 5.1, 18, 1, true), coneMat, p[0] + side * 1.0, 2.55, p[1]); cn2.userData.noCast = true;
    var l = new THREE.PointLight(0xffc98a, 1.15, 22, 1.4); l.position.set(p[0] + side * 1.0, 4.8, p[1]); scene.add(l);
    lamps.push({ light: l, bulb: bulb, cone: cn2, phase: idx * 1.7, flicker: idx % 2 === 0 });
    circles.push({ x: p[0], z: p[1], r: 0.25 });
  });

  // ----- the secret -----
  W.duck = dyn(new THREE.Group());
  var dy = std(0xf2c81e, 0.35), dh = std(0x8a7a52, 0.8);
  mesh(sphGeo, dy, 0, 0.16, 0, W.duck).scale.set(0.34, 0.28, 0.44); mesh(sphGeo, dy, 0, 0.22, -0.2, W.duck).scale.set(0.14, 0.14, 0.2);
  mesh(new THREE.SphereGeometry(0.13, 12, 10), dy, 0, 0.38, 0.14, W.duck);
  mesh(new THREE.ConeGeometry(0.05, 0.12, 8), std(0xe8741c, 0.4), 0, 0.36, 0.29, W.duck).rotation.x = PI / 2;
  [-0.05, 0.05].forEach(function (x) { mesh(new THREE.SphereGeometry(0.018, 6, 6), basic(0x000000), x, 0.42, 0.25, W.duck); });
  cyl(0.2, 0.2, 0.015, dh, 0, 0.49, 0.13, W.duck, 14); mesh(new THREE.SphereGeometry(0.11, 10, 8, 0, PI * 2, 0, PI / 2), dh, 0, 0.49, 0.13, W.duck); cyl(0.112, 0.112, 0.03, M.red, 0, 0.51, 0.13, W.duck, 14);
  W.duck.position.set(DUCK[0], 0, DUCK[1]); W.duck.rotation.y = 2.4; scene.add(W.duck);
  circles.push({ x: DUCK[0], z: DUCK[1], r: 0.3 });

  // ----- vegetation -----
  var propCircles = circles.slice();
  function blocked(x, z2) {
    var q2;
    if (onPath(x, z2, 2.5) || inBox(x, z2, 2) || inRect(x, z2, AQ, 4.5)) return true;
    for (q2 = 0; q2 < SAFE.length; q2++) if (dist(x, z2, SAFE[q2].x, SAFE[q2].z) < 10) return true;
    for (q2 = 0; q2 < ZONES.length; q2++) if (dist(x, z2, ZONES[q2].key[0], ZONES[q2].key[1]) < 4.5) return true;
    for (q2 = 0; q2 < BATTERY_SPOTS.length; q2++) if (dist(x, z2, BATTERY_SPOTS[q2][0], BATTERY_SPOTS[q2][1]) < 2.5) return true;
    for (q2 = 0; q2 < FUSE_SPOTS.length; q2++) if (dist(x, z2, FUSE_SPOTS[q2][0], FUSE_SPOTS[q2][1]) < 2.5) return true;
    for (q2 = 0; q2 < propCircles.length; q2++) if (dist(x, z2, propCircles[q2].x, propCircles[q2].z) < propCircles[q2].r + 2) return true;
    if (dist(x, z2, START.x, START.z) < 13 || dist(x, z2, 0, 0) < 10) return true;
    if (dist(x, z2, AV.x, AV.z) < AV.r + 2.5) return true;
    if (Math.abs(z2 - TURN_Z) < 5 && Math.abs(x) < 16) return true;
    return false;
  }
  var dummy = new THREE.Object3D(), col = new THREE.Color();
  var NP = 290, NB = 150, TIERS = 7;
  var pineTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.42, 9, 8), M.trunk, NP);
  var pineTiers = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 14, 1, true), M.needle, NP * TIERS);
  var oakTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.55, 4.6, 8), M.trunk, NB);
  var oakBlobs = new THREE.InstancedMesh(jitter(new THREE.IcosahedronGeometry(1, 2), 0.22), M.leaf, NB * 5);
  var placedP = 0, placedB = 0, guard = 0;
  while ((placedP < NP || placedB < NB) && guard++ < 40000) {
    tx = (srand() * 2 - 1) * (WORLD - 4); tz = (srand() * 2 - 1) * (WORLD - 4);
    if (blocked(tx, tz)) continue;
    s = 0.8 + srand() * 0.9; var pine = placedP < NP && (placedB >= NB || srand() < 0.66);
    dummy.rotation.set((srand() - 0.5) * 0.08, srand() * 6, (srand() - 0.5) * 0.08);
    if (pine) {
      dummy.position.set(tx, 4.5 * s, tz); dummy.scale.set(s, s, s); dummy.updateMatrix(); pineTrunks.setMatrixAt(placedP, dummy.matrix);
      for (k = 0; k < TIERS; k++) {
        var tr = (3.0 - k * 0.38) * s * (0.9 + srand() * 0.2);
        dummy.position.set(tx, (3.0 + k * 1.15) * s, tz); dummy.scale.set(tr, 2.9 * s, tr); dummy.rotation.y = srand() * 6; dummy.updateMatrix();
        pineTiers.setMatrixAt(placedP * TIERS + k, dummy.matrix);
        col.setHSL(0.34 + srand() * 0.05, 0.42, 0.1 + srand() * 0.06 + k * 0.006); pineTiers.setColorAt(placedP * TIERS + k, col);
      }
      placedP++;
    } else {
      dummy.position.set(tx, 2.3 * s, tz); dummy.scale.set(s, s, s); dummy.updateMatrix(); oakTrunks.setMatrixAt(placedB, dummy.matrix);
      for (k = 0; k < 5; k++) {
        var br = (1.5 + srand() * 1.0) * s;
        dummy.position.set(tx + (srand() - 0.5) * 2.8 * s, (4.3 + srand() * 2.0) * s, tz + (srand() - 0.5) * 2.8 * s);
        dummy.scale.set(br, br * 0.78, br); dummy.rotation.set(srand() * 6, srand() * 6, 0); dummy.updateMatrix(); oakBlobs.setMatrixAt(placedB * 5 + k, dummy.matrix);
        col.setHSL(0.27 + srand() * 0.07, 0.4, 0.09 + srand() * 0.06); oakBlobs.setColorAt(placedB * 5 + k, col);
      }
      placedB++;
    }
    circles.push({ x: tx, z: tz, r: 0.45 * s });
  }
  pineTrunks.count = placedP; pineTiers.count = placedP * TIERS; oakTrunks.count = placedB; oakBlobs.count = placedB * 5;
  [pineTrunks, pineTiers, oakTrunks, oakBlobs].forEach(function (m) { m.frustumCulled = false; scene.add(m); });
  pineTiers.userData.noCast = false;

  var NBU = 260, bushes = new THREE.InstancedMesh(jitter(new THREE.IcosahedronGeometry(1, 2), 0.3), M.leaf, NBU);
  var NR = 160, rocks = new THREE.InstancedMesh(jitter(new THREE.DodecahedronGeometry(1, 1), 0.25), std(0x6c6c64, 1, { bumpMap: bump(2), bumpScale: 0.18 }), NR);
  function freeSpot(m, noSafe) { do { tx = (Math.random() * 2 - 1) * (WORLD - 2); tz = (Math.random() * 2 - 1) * (WORLD - 2); } while (onPath(tx, tz, m) || inBox(tx, tz, m) || inRect(tx, tz, AQ, m + 0.6) || (noSafe && nearSafe(tx, tz, 0.3))); }
  for (i = 0; i < NBU; i++) {
    freeSpot(1.5, true); s = 0.5 + Math.random() * 0.8;
    dummy.position.set(tx, s * 0.4, tz); dummy.scale.set(s * 1.3, s * 0.8, s * 1.3); dummy.rotation.set(0, Math.random() * 6, 0); dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix); col.setHSL(0.28 + Math.random() * 0.08, 0.42, 0.08 + Math.random() * 0.06); bushes.setColorAt(i, col);
  }
  for (i = 0; i < NR; i++) {
    freeSpot(1, false); s = 0.15 + Math.random() * 0.5;
    dummy.position.set(tx, s * 0.3, tz); dummy.scale.set(s * (1 + Math.random()), s * 0.7, s * (1 + Math.random())); dummy.rotation.set(Math.random(), Math.random() * 6, Math.random()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
  }
  bushes.frustumCulled = rocks.frustumCulled = false; scene.add(bushes); scene.add(rocks);
  function cards(tex, count, w, h, hue, m) {
    var inst = new THREE.InstancedMesh(crossCard(w, h), new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide }), count);
    for (var n = 0; n < count; n++) {
      freeSpot(m, true); var sc = 0.6 + Math.random() * 0.9;
      dummy.position.set(tx, -0.02, tz); dummy.scale.set(sc, sc * (0.8 + Math.random() * 0.5), sc); dummy.rotation.set(0, Math.random() * 6, 0); dummy.updateMatrix();
      inst.setMatrixAt(n, dummy.matrix); col.setHSL(hue + Math.random() * 0.06, 0.25, 0.5 + Math.random() * 0.3); inst.setColorAt(n, col);
    }
    inst.frustumCulled = false; inst.userData.noCast = true; scene.add(inst);
  }
  cards(grassTex, 9500, 0.9, 0.7, 0.2, 0.25); cards(fernTex, 2200, 1.5, 1.1, 0.24, 1.2);

  var NL = 150, litter = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.26, 0.18), std(0xffffff, 0.9, { side: THREE.DoubleSide }), NL);
  var litterCols = [0xd8d2c2, 0xa8231c, 0x2c5fa8, 0xd8b23a, 0x8a8a8a];
  for (i = 0; i < NL; i++) {
    var lp = PATHS[i % PATHS.length];
    dummy.position.set(lp[0] - 3 + Math.random() * (lp[1] - lp[0] + 6), 0.045, lp[2] - 3 + Math.random() * (lp[3] - lp[2] + 6));
    dummy.rotation.set(-PI / 2 + (Math.random() - 0.5) * 0.3, 0, Math.random() * 6); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    litter.setMatrixAt(i, dummy.matrix); col.setHex(litterCols[i % litterCols.length]); litter.setColorAt(i, col);
  }
  litter.frustumCulled = false; litter.userData.noCast = true; scene.add(litter);

  // fence posts, all in one batch
  var postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.085, 1, 6), M.rust, posts.length);
  posts.forEach(function (p, n) { dummy.position.set(p[0], (p[2] + 0.3) / 2, p[1]); dummy.rotation.set((srand() - 0.5) * 0.05, 0, (srand() - 0.5) * 0.05); dummy.scale.set(1, p[2] + 0.3, 1); dummy.updateMatrix(); postMesh.setMatrixAt(n, dummy.matrix); });
  postMesh.frustumCulled = false; scene.add(postMesh);

  // ----- pickups -----
  var keyMat = std(0xffc933, 0.25, { metalness: 0.85, emissive: 0xd08a00, emissiveIntensity: 1.3 });
  var beamMat = basic(0xffc94d, { transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending });
  for (i = 0; i < ZONES.length; i++) {
    var kg = dyn(new THREE.Group()), spin = new THREE.Group();
    mesh(new THREE.TorusGeometry(0.28, 0.075, 10, 20), keyMat, 0, 0.3, 0, spin); mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 14), keyMat, 0, 0.3, 0, spin);
    box(0.1, 0.62, 0.1, keyMat, 0, -0.26, 0, spin); box(0.28, 0.1, 0.1, keyMat, 0.14, -0.47, 0, spin); box(0.2, 0.1, 0.1, keyMat, 0.1, -0.3, 0, spin);
    spin.position.y = 1.2; kg.add(spin); kg.userData.spin = spin;
    if (i !== 0 && i !== 2) mesh(new THREE.CylinderGeometry(0.12, 0.12, 26, 6), beamMat, 0, 13, 0, kg);
    kg.position.set(ZONES[i].key[0], 0, ZONES[i].key[1]); scene.add(kg); keyMeshes.push(kg);
  }
  var batBody = std(0x222428, 0.35, { metalness: 0.7 }), batBand = std(0x2bd86a, 0.4, { emissive: 0x18c04a, emissiveIntensity: 1.2 });
  for (i = 0; i < BATTERY_SPOTS.length; i++) {
    var bg = dyn(new THREE.Group());
    cyl(0.13, 0.13, 0.46, batBody, 0, 0, 0, bg, 14); cyl(0.135, 0.135, 0.16, batBand, 0, 0.02, 0, bg, 14); cyl(0.05, 0.05, 0.06, M.metal, 0, 0.26, 0, bg, 8);
    mesh(new THREE.SphereGeometry(0.045, 6, 6), glow(0x7dffb0), 0, 0.36, 0, bg);
    bg.rotation.z = 0.35; scene.add(bg); batMeshes.push(bg);
  }
  var fuseCols = { 5: 0x9a9a9a, 10: 0xc8102e, 15: 0x2c7dd8, 20: 0xe2b93b, 25: 0xeeeeee, 30: 0x2fb85a, 40: 0xff7a1a };
  W.fuseMats = [];
  FUSE_SPOTS.forEach(function (f) {
    var fg = dyn(new THREE.Group()), band = std(0xffffff, 0.4, { emissive: 0xffffff, emissiveIntensity: 0.5 }); W.fuseMats.push(band);
    cyl(0.07, 0.07, 0.36, std(0xfff4d8, 0.15, { transparent: true, opacity: 0.6 }), 0, 0, 0, fg, 12); cyl(0.074, 0.074, 0.12, band, 0, 0, 0, fg, 12);
    [-0.2, 0.2].forEach(function (yy) { cyl(0.08, 0.08, 0.08, M.metal, 0, yy, 0, fg, 12); });
    fg.rotation.z = PI / 2; fg.position.set(f[0], 0.9, f[1]); scene.add(fg); fuseMeshes.push(fg);
  });
  W.fuseCols = fuseCols;

  // ----- exit guide line (easy), drifting mist, dust in the flashlight beam -----
  W.routeMat = basic(0xff2a1a, { transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  for (i = 0; i < 5; i++) { var rs = dyn(box(1, 0.04, 1, W.routeMat, 0, 0.07, 0)); rs.visible = false; rs.userData.noCast = true; W.route.push(rs); }
  var mistMat = new THREE.SpriteMaterial({ map: softTex('rgba(150,165,190,.55)', 'rgba(120,135,160,.2)'), transparent: true, opacity: 0.055, depthWrite: false });
  for (i = 0; i < 46; i++) {
    var ms = dyn(new THREE.Sprite(mistMat));
    do { tx = (Math.random() * 2 - 1) * 140; tz = (Math.random() * 2 - 1) * 140; } while (inRect(tx, tz, AQ, 6));
    ms.position.set(tx, 1.0 + Math.random() * 0.8, tz); s = 16 + Math.random() * 14; ms.scale.set(s, s * 0.32, 1);
    ms.userData = { bx: tx, bz: tz, ph: Math.random() * 6 }; scene.add(ms); W.mist.push(ms);
  }
  var dp = [];
  for (i = 0; i < 160; i++) { var dzz = -1 - Math.random() * 9, rr = -dzz * 0.42 * Math.sqrt(Math.random()), da = Math.random() * 6.3; dp.push(Math.cos(da) * rr + 0.2, Math.sin(da) * rr - 0.15, dzz); }
  g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  W.dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff0d0, size: 0.012, transparent: true, opacity: 0.3, depthWrite: false }));
  W.dust.frustumCulled = false; W.dust.visible = false; camera.add(W.dust);

  // ----- shadows, then freeze everything that never moves -----
  scene.traverse(function (o) {
    if (!o.isMesh) return;
    var isBasic = o.material.isMeshBasicMaterial;
    o.receiveShadow = !isBasic;
    var p = o, noCast = isBasic || o.material.transparent;
    while (p && !noCast) { if (p.userData && p.userData.noCast) noCast = true; p = p.parent; }
    o.castShadow = !noCast;
  });
  scene.updateMatrixWorld(true);
  var moving = [camera, plesMesh, pteroMesh].concat(dynamic, dinos.map(function (d) { return d.mesh; }));
  scene.traverse(function (o) { if (o !== scene) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
  moving.forEach(function (root) { root.traverse(function (o) { o.matrixAutoUpdate = true; }); });
})();
