/* Jurassic Massacre — the staff wing behind the gift shop.
   A locked STAFF ONLY door in the shop's back wall (its key hangs in the maintenance shed) opens on a short link through
   the plaza wall into the employee break room, where something got in on the last night: lockers torn open, the table and
   chairs thrown about, a vending machine dragged across the outside door as a barricade, and blood from one end of the room
   to the other.  The staff network lives here too, in a wall cabinet: its battery backup shut itself off when the power
   failed and two patch leads hang out of the switch, unplugged.  Until that is put right the staff computer in the shop
   cannot reach the domain.  The ports they belong in are on Dave from IT's voicemail on the answering machine (the sheet
   inside the cabinet door is out of date).  Puzzle state is P.net (saved); Staff.step poses everything to match it. */
'use strict';

var Staff = (function () {
  var S = {}, E = Entrance, EM = E.M, flat = E.flat, inst = E.inst, FONT = E.FONT, i, k;
  var DZ1 = 131.75, DZ2 = 132.65, DH = 2.1, HX = 24.85;                     // the staff door: clear opening (z), height, hinge line (x)
  var LX1 = 25.0, LX2 = 27.08, LZ1 = 131.55, LZ2 = 132.85, LH = 2.5;      // the link through the plaza wall
  var RX1 = 27.08, RX2 = 33.4, RZ1 = 127.0, RZ2 = 135.4, RH = 2.7;        // the break room
  S.room = { x1: RX1, x2: RX2, z1: RZ1, z2: RZ2 }; S.link = { x1: LX1, x2: LX2, z1: LZ1, z2: LZ2 };
  /* Everything behind the shop's back wall is gathered into one group at the end, kept out of the static batching and only
     drawn when it could be seen (from inside it, or from the shop with the door open): nothing culls it behind walls. */
  var n0 = scene.children.length, wing = new THREE.Group(); wing.userData.keep = true; wing.userData.batchInside = true; S.wing = wing;

  // ---------- surfaces ----------
  // walls: painted blockwork, a dark green dado to a metre, scuffed by chairs and trolleys, grubby at hand height
  var paint = std(0xffffff, 0.9, { map: canvasTex(512, function (g, S2) {
    g.fillStyle = '#b4bba0'; g.fillRect(0, 0, S2, S2);
    g.globalAlpha = 0.35; speckle('rgba(0,0,0,0)', ['#a3aa8e', '#c4cab2', '#959c80'], 9000, 2)(g, S2); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(80,86,70,.35)'; g.lineWidth = 1.2; for (var r = 1; r < 14; r++) { g.beginPath(); g.moveTo(0, S2 - r * S2 / 13.5); g.lineTo(S2, S2 - r * S2 / 13.5); g.stroke(); }   // block courses (20 cm)
    var dado = S2 * (1.0 / 2.7);
    g.fillStyle = '#3f5643'; g.fillRect(0, S2 - dado, S2, dado); g.fillStyle = '#26352a'; g.fillRect(0, S2 - dado - 5, S2, 5);
    g.globalAlpha = 0.5; chips(g, S2, S2, 26, '#7e846c'); g.globalAlpha = 1;
    for (var q = 0; q < 40; q++) { g.strokeStyle = 'rgba(20,22,18,' + (0.15 + Math.random() * 0.25) + ')'; g.lineWidth = 1 + Math.random() * 2; var y = S2 - Math.random() * dado * 1.1, x = Math.random() * S2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + Math.random() * 50, y + (Math.random() - 0.5) * 6); g.stroke(); }   // scuffs
    g.fillStyle = 'rgba(70,60,40,.12)'; g.fillRect(0, S2 * 0.38, S2, S2 * 0.14);                                              // hands and shoulders
    grime(g, S2, S2, 1.1); streaks(g, S2, S2, 10, 'rgba(70,58,40,.35)', S2 * 0.5);
  }), bumpMap: bump(3), bumpScale: 0.01 });
  var vinyl = std(0xffffff, 0.55, { map: canvasTex(512, function (g, S2) {
    var n = 8, c = S2 / n, tones = ['#7a8389', '#727b81', '#80898e', '#6e767b'];
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) { g.fillStyle = tones[(a * 3 + b + a * b) % 4]; g.fillRect(a * c, b * c, c, c); }
    g.globalAlpha = 0.35; speckle('rgba(0,0,0,0)', ['#4a5156', '#9aa2a7', '#3a4044', '#b0b6ba'], 14000, 1.4)(g, S2); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(30,34,36,.55)'; g.lineWidth = 1.5; for (a = 0; a <= n; a++) { g.beginPath(); g.moveTo(a * c, 0); g.lineTo(a * c, S2); g.moveTo(0, a * c); g.lineTo(S2, a * c); g.stroke(); }
    blotch(g, S2, ['#3a3e38', '#2c2f2a', '#5a5a4a'], 26, 20, 80, 0.3);
    for (var q = 0; q < 60; q++) { g.strokeStyle = 'rgba(25,26,24,.35)'; g.lineWidth = 1; var x = Math.random() * S2, y = Math.random() * S2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 18); g.stroke(); }
  }), bumpMap: bump(4), bumpScale: 0.004 });
  var ceilTex = canvasTex(256, function (g, S2) {
    g.fillStyle = '#c8c6b8'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.6; speckle('rgba(0,0,0,0)', ['#b1afa2', '#d7d5c8', '#9b998c'], 3000, 1.2)(g, S2); g.globalAlpha = 1;
    blotch(g, S2, ['#8a7a4a', '#6a5a3a'], 5, 14, 60, 0.3);
    g.fillStyle = '#dcdad0'; g.fillRect(0, 0, S2, 5); g.fillRect(0, S2 / 2 - 2, S2, 5); g.fillRect(0, 0, 5, S2); g.fillRect(S2 / 2 - 2, 0, 5, S2);
  });
  var renderOut = std(0xffffff, 0.94, { map: canvasTex(256, function (g, S2) { speckle('#8f8b80', ['#7f7b70', '#a19d92', '#6f6b60'], 9000, 1.6)(g, S2); streaks(g, S2, S2, 30, 'rgba(38,40,30,.8)', S2 * 0.9); grime(g, S2, S2, 1.3); }) });
  var roofMat = std(0x232527, 0.85, { map: roofTex });
  var steelGrey = std(0x5c6366, 0.5, { metalness: 0.55, map: metalTex }), darkSteel = std(0x26292c, 0.55, { metalness: 0.5, map: metalTex }), chromeS = std(0xc9cdd0, 0.25, { metalness: 0.9, envMap: envTex, envMapIntensity: 0.5 });
  var laminate = std(0xd8d2bf, 0.5, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#d6cfba'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.25; speckle('rgba(0,0,0,0)', ['#b9b29c', '#ece6d2'], 1500, 1.2)(g, S2); g.globalAlpha = 1; blotch(g, S2, ['#8a7a5a', '#5a4a3a'], 6, 6, 26, 0.25); }) });
  function wall(x1, x2, z1, z2, y1, y2, mat, tile, collide) { return wbox(x1, x2, y1, y2, z1, z2, mat || paint, tile || 2.7, null, collide !== false); }

  // blood: old and dried to near black at the edges, still dark red where it pooled thickest
  function bloodTex(kind) {
    return canvasTex(256, function (g, S2, H2) {
      g.clearRect(0, 0, S2, H2 || S2); var Hh = H2 || S2, q, x, y, r;
      function blob(cx, cy, rad, a) { var gr = g.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad); gr.addColorStop(0, 'rgba(64,6,6,' + a + ')'); gr.addColorStop(0.65, 'rgba(48,5,5,' + a * 0.85 + ')'); gr.addColorStop(1, 'rgba(30,6,5,0)'); g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
      if (kind === 'pool') {
        for (q = 0; q < 40; q++) { var a = Math.random() * 6.283, d = Math.pow(Math.random(), 0.8) * S2 * 0.32; blob(S2 / 2 + Math.cos(a) * d, Hh / 2 + Math.sin(a) * d * 0.8, 14 + Math.random() * 40, 0.95); }
        g.fillStyle = 'rgba(36,4,4,.9)'; for (q = 0; q < 70; q++) { a = Math.random() * 6.283; d = S2 * (0.3 + Math.random() * 0.18); g.beginPath(); g.arc(S2 / 2 + Math.cos(a) * d, Hh / 2 + Math.sin(a) * d * 0.8, 1 + Math.random() * 4, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(120,20,16,.18)'; g.beginPath(); g.ellipse(S2 * 0.46, Hh * 0.45, S2 * 0.12, Hh * 0.08, 0.4, 0, 7); g.fill();     // a sheen where it was thickest
      } else if (kind === 'drag') {                                      // a long smear, wider at the start, streaked by fingers and fabric
        for (q = 0; q < 90; q++) { var t = q / 90; x = t * S2; y = Hh / 2 + Math.sin(t * 7) * Hh * 0.05; blob(x, y, (1 - t * 0.7) * Hh * 0.3, 0.28 * (1 - t * 0.5)); }
        g.strokeStyle = 'rgba(40,5,5,.45)'; for (q = 0; q < 16; q++) { g.lineWidth = 0.6 + Math.random() * 2.2; y = Hh * (0.3 + Math.random() * 0.4); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(S2 * 0.3, y + (Math.random() - 0.5) * 20, S2 * 0.7, y + (Math.random() - 0.5) * 20, S2 * (0.6 + Math.random() * 0.4), y + (Math.random() - 0.5) * 12); g.stroke(); }
      } else if (kind === 'hand') {                                      // a hand that pressed flat and slid down
        g.fillStyle = 'rgba(58,6,6,.85)';
        g.beginPath(); g.ellipse(S2 * 0.5, Hh * 0.34, S2 * 0.15, Hh * 0.13, 0, 0, 7); g.fill();
        [[-0.12, -0.2, 0.17], [-0.04, -0.27, 0.2], [0.04, -0.26, 0.19], [0.11, -0.21, 0.15]].forEach(function (f) { g.save(); g.translate(S2 * (0.5 + f[0]), Hh * (0.34 + f[1])); g.rotate(f[0] * 1.5); g.beginPath(); g.ellipse(0, 0, S2 * 0.035, Hh * f[2] * 0.5, 0, 0, 7); g.fill(); g.restore(); });
        g.save(); g.translate(S2 * 0.33, Hh * 0.42); g.rotate(-0.9); g.beginPath(); g.ellipse(0, 0, S2 * 0.035, Hh * 0.08, 0, 0, 7); g.fill(); g.restore();
        for (q = 0; q < 5; q++) { g.fillStyle = 'rgba(48,5,5,.6)'; x = S2 * (0.38 + q * 0.06); g.fillRect(x, Hh * 0.4, 5 + Math.random() * 6, Hh * (0.3 + Math.random() * 0.3)); }   // and ran
      } else {                                                           // spatter
        for (q = 0; q < 8; q++) blob(S2 * (0.3 + Math.random() * 0.4), Hh * (0.3 + Math.random() * 0.4), 10 + Math.random() * 24, 0.8);
        g.fillStyle = 'rgba(50,5,5,.8)'; for (q = 0; q < 160; q++) { a = Math.random() * 6.283; d = Math.pow(Math.random(), 0.5) * S2 * 0.48; g.beginPath(); g.arc(S2 / 2 + Math.cos(a) * d, Hh / 2 + Math.sin(a) * d, 0.6 + Math.random() * 3, 0, 7); g.fill(); }
        g.strokeStyle = 'rgba(46,5,5,.6)'; for (q = 0; q < 10; q++) { x = Math.random() * S2; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(x, Hh * 0.5); g.lineTo(x + (Math.random() - 0.5) * 6, Hh * (0.6 + Math.random() * 0.4)); g.stroke(); }
      }
    }, 1, 1, true, kind === 'drag' ? 96 : 256);
  }
  var BL = {}; ['pool', 'drag', 'hand', 'spat'].forEach(function (k2) { BL[k2] = new THREE.MeshStandardMaterial({ map: bloodTex(k2), transparent: true, depthWrite: false, roughness: k2 === 'pool' ? 0.35 : 0.7, polygonOffset: true, polygonOffsetFactor: -4 }); });
  function decal(mat, w, h, x, y, z, rx, ry, rz) { var m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0, 'YXZ'); m.userData.noCast = true; m.renderOrder = 3; return m; }
  function floorDecal(mat, w, h, x, z, rot, y) { return decal(mat, w, h, x, y || 0.047, z, -PI / 2, rot || 0, 0); }

  // ---------- the link: through the plaza wall, from the shop's back door to the break room ----------
  flat(LX2 - LX1 + 0.3, LZ2 - LZ1, vinyl, (LX1 + LX2) / 2 - 0.15, 0.045, (LZ1 + LZ2) / 2);
  var lfl = flat(LX2 - LX1 + 0.3, LZ2 - LZ1, vinyl, (LX1 + LX2) / 2 - 0.15, 0.045, (LZ1 + LZ2) / 2); worldUV(lfl, 2.4); lfl.visible = false;
  worldUV(scene.children[scene.children.length - 2], 2.4);
  wall(LX1, LX2 + 0.1, LZ1 - 0.15, LZ1, 0, LH + 0.1); wall(LX1, LX2 + 0.1, LZ2, LZ2 + 0.15, 0, LH + 0.1);
  var lc = flat(LX2 - LX1, LZ2 - LZ1, std(0xffffff, 0.95, { map: ceilTex }), (LX1 + LX2) / 2, LH, (LZ1 + LZ2) / 2); lc.rotation.x = PI / 2; worldUV(lc, 1.2);
  box(LX2 - LX1 + 0.2, 0.15, LZ2 - LZ1 + 0.4, roofMat, (LX1 + LX2) / 2, LH + 0.18, (LZ1 + LZ2) / 2);
  wbox(LX1, LX2, LH + 0.02, LH + 0.3, LZ1 - 0.2, LZ1 - 0.15, renderOut, 2); wbox(LX1, LX2, LH + 0.02, LH + 0.3, LZ2 + 0.15, LZ2 + 0.2, renderOut, 2);

  // ---------- the break room shell ----------
  var fl = flat(RX2 - RX1, RZ2 - RZ1, vinyl, (RX1 + RX2) / 2, 0.045, (RZ1 + RZ2) / 2); worldUV(fl, 2.4);
  var ce = flat(RX2 - RX1, RZ2 - RZ1, std(0xffffff, 0.95, { map: ceilTex }), (RX1 + RX2) / 2, RH, (RZ1 + RZ2) / 2); ce.rotation.x = PI / 2; worldUV(ce, 1.2);
  wall(RX1 - 0.15, RX2 + 0.15, RZ1 - 0.15, RZ1, 0, RH + 0.1); wall(RX1 - 0.15, RX2 + 0.15, RZ2, RZ2 + 0.15, 0, RH + 0.1);                     // north, south
  wall(RX1 - 0.08, RX1, RZ1, LZ1, 0, RH); wall(RX1 - 0.08, RX1, LZ2, RZ2, 0, RH); wall(RX1 - 0.08, RX1, LZ1, LZ2, LH, RH, null, null, false);   // west lining, round the link
  var EDZ1 = 129.55, EDZ2 = 130.55;                                                                                                 // the outside door, on the east wall
  wall(RX2, RX2 + 0.15, RZ1, EDZ1, 0, RH); wall(RX2, RX2 + 0.15, EDZ2, RZ2, 0, RH); wall(RX2, RX2 + 0.15, EDZ1, EDZ2, 2.15, RH, null, null, false);
  boxes.push({ x1: RX2 - 0.05, x2: RX2 + 0.15, z1: EDZ1, z2: EDZ2, solid: true });
  // outside: render, a flat roof with a parapet (it sits under the plaza wall's height; nobody sees it from the plaza)
  wbox(RX1 - 0.2, RX2 + 0.2, 0, RH + 0.4, RZ1 - 0.2, RZ1 - 0.15, renderOut, 2); wbox(RX1 - 0.2, RX2 + 0.2, 0, RH + 0.4, RZ2 + 0.15, RZ2 + 0.2, renderOut, 2); wbox(RX2 + 0.15, RX2 + 0.2, 0, RH + 0.4, RZ1 - 0.15, RZ2 + 0.15, renderOut, 2);
  box(RX2 - RX1 + 0.4, 0.15, RZ2 - RZ1 + 0.4, roofMat, (RX1 + RX2) / 2, RH + 0.18, (RZ1 + RZ2) / 2);

  // ---------- the staff door ----------
  /* A steel door painted the shop's green, in a pressed-steel frame set mid-wall: a lever handle and a key cylinder on the
     shop side, a kick plate, a closer on the far side, and a yellow STAFF ONLY plate.  It swings into the link. */
  var doorPaint = std(0xffffff, 0.62, { metalness: 0.25, map: canvasTex(256, function (g, S2) { g.fillStyle = '#3d5c47'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.3; speckle('rgba(0,0,0,0)', ['#33503d', '#4a6a54'], 2000, 1.4)(g, S2); g.globalAlpha = 1; chips(g, S2, S2, 16, '#2a2e2c'); chips(g, S2, S2, 6, '#6a3c20'); grime(g, S2, S2, 0.9); }) });
  var frameMat = std(0x2c3a31, 0.6, { metalness: 0.3 });
  box(0.3, 0.06, 1.08, frameMat, X2m(), DH + 0.03, (DZ1 + DZ2) / 2).userData.shopSide = true; [DZ1 - 0.03, DZ2 + 0.03].forEach(function (z) { box(0.3, DH + 0.06, 0.06, frameMat, X2m(), (DH + 0.06) / 2, z).userData.shopSide = true; });
  function X2m() { return 24.85; }
  var door = dyn(new THREE.Group()); door.position.set(HX, 0, DZ2); scene.add(door); S.door = door;
  var leaf = box(0.045, DH - 0.02, DZ2 - DZ1 - 0.012, doorPaint, 0, (DH - 0.02) / 2 + 0.005, -(DZ2 - DZ1) / 2, door);
  box(0.004, 0.25, DZ2 - DZ1 - 0.06, chromeS, -0.024, 0.15, -(DZ2 - DZ1) / 2, door); box(0.004, 0.25, DZ2 - DZ1 - 0.06, chromeS, 0.024, 0.15, -(DZ2 - DZ1) / 2, door);   // kick plates
  [-1, 1].forEach(function (sd) {                                                                             // lever handles, both sides
    var hz = -(DZ2 - DZ1) + 0.075; cyl(0.03, 0.03, 0.012, chromeS, sd * 0.03, 1.02, hz, door, 14).rotation.z = PI / 2;
    var lv = cyl(0.009, 0.009, 0.12, chromeS, sd * 0.06, 1.02, hz + 0.05, door, 8); lv.rotation.x = PI / 2; cyl(0.01, 0.01, 0.04, chromeS, sd * 0.045, 1.02, hz, door, 8).rotation.z = PI / 2;
  });
  var LOCKP = new THREE.Vector3(-0.026, 0.9, -(DZ2 - DZ1) + 0.075);                                             // the key cylinder (shop side), door space
  cyl(0.018, 0.018, 0.006, chromeS, LOCKP.x, LOCKP.y, LOCKP.z, door, 16).rotation.z = PI / 2; mesh(new THREE.PlaneGeometry(0.004, 0.014), basic(0x050505), LOCKP.x - 0.0035, LOCKP.y, LOCKP.z, door).rotation.y = -PI / 2;
  mesh(new THREE.PlaneGeometry(0.34, 0.2), std(0xffffff, 0.6, { map: canvasTex(256, function (g, S2, H2) { g.fillStyle = '#e2b93b'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#141414'; g.fillRect(6, 6, S2 - 12, H2 - 12); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 44px ' + FONT; g.fillText('STAFF ONLY', S2 / 2, H2 * 0.42); g.font = 'bold 20px ' + FONT; g.fillText('NO PUBLIC ACCESS', S2 / 2, H2 * 0.75); E.grime(g, S2, H2, 0.9); }, 1, 1, true, 150) }), -0.024, 1.55, -(DZ2 - DZ1) / 2, door).rotation.y = -PI / 2;
  box(0.05, 0.05, 0.32, darkSteel, 0.05, DH - 0.12, -0.25, door); box(0.02, 0.02, 0.26, darkSteel, 0.07, DH - 0.12, -0.42, door);         // the closer (link side)
  var lockKey = null;                                                                                             // the key left turned in the lock
  S.doorBox = { x1: 24.7, x2: 25.0, z1: DZ1 - 0.06, z2: DZ2 + 0.06, solid: true }; boxes.push(S.doorBox);
  S.doorOpenBox = { x1: HX, x2: HX + 0.92, z1: DZ2 - 0.08, z2: DZ2 + 0.04, off: true }; boxes.push(S.doorOpenBox);
  S.lockPoint = function (out) { door.updateMatrixWorld(true); return door.localToWorld(out.copy(LOCKP)); };
  S.pushPoint = function (out) { door.updateMatrixWorld(true); return door.localToWorld(out.set(-0.03, 1.2, -(DZ2 - DZ1) + 0.2)); };

  // ---------- lights ----------
  function light(name, color, x, y, z, range, decay) { var l = dyn(new THREE.PointLight(color, 0, range, decay || 1.4)); l.position.set(x, y, z); scene.add(l); E.lights[name] = l; return l; }
  light('staffA', 0xdfe6f2, 29.4, 2.45, 130.0, 9); light('staffB', 0xdfe6f2, 31.5, 2.45, 133.2, 8); light('staffExit', 0xff2a14, 33.2, 2.25, 130.05, 3.2, 1.8);
  S.tubes = [];
  [[29.4, 130.0, 0], [31.5, 133.2, 1], [29.6, 133.6, 2]].forEach(function (f) {                                    // ceiling troffers; the third has dropped on one chain
    var G = new THREE.Group(); G.position.set(f[0], RH - 0.04, f[1]); scene.add(G);
    if (f[2] === 2) { G.rotation.z = 0.5; G.position.y -= 0.32; G.position.x += 0.25; cyl(0.003, 0.003, 0.4, M.dark, -0.28, 0.2, 0, G, 3); }
    box(0.62, 0.08, 1.22, std(0xc9c7bc, 0.6), 0, 0, 0, G);
    var tm = basic(0x1c1c1a); box(0.5, 0.02, 1.14, tm, 0, -0.045, 0, G).userData.noCast = true; if (f[2] < 2) S.tubes.push(tm);
    box(0.62, 0.012, 1.22, std(0xe8e8e0, 0.4, { transparent: true, opacity: 0.4 }), 0, -0.058, 0, G).userData.noCast = true;
  });
  var exitSign = basic(0x330604); box(0.36, 0.14, 0.05, std(0x1a1a1a, 0.6), RX2 - 0.03, 2.28, (EDZ1 + EDZ2) / 2).userData.noCast = true;
  mesh(new THREE.PlaneGeometry(0.32, 0.11), new THREE.MeshBasicMaterial({ map: textTex(['EXIT'], 128, 44, '#2a0503', '#ff3a22', null, false), fog: false }), RX2 - 0.056, 2.28, (EDZ1 + EDZ2) / 2).rotation.y = -PI / 2;

  // ---------- lockers along the north wall ----------
  (function () {
    var lockerMat = std(0xffffff, 0.55, { metalness: 0.45, map: canvasTex(128, function (g, S2) { g.fillStyle = '#5a6b78'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.35; speckle('rgba(0,0,0,0)', ['#4a5a66', '#6a7b88'], 900, 1.2)(g, S2); g.globalAlpha = 1; chips(g, S2, S2, 10, '#2a2c2e'); grime(g, S2, S2, 0.8); }) });
    var LW = 0.4, LD = 0.48, LH2 = 1.85, x0 = 27.45;
    for (var n = 0; n < 6; n++) {
      var lx = x0 + n * LW + LW / 2, G = new THREE.Group(); G.position.set(lx, 0, RZ1 + LD / 2); scene.add(G);
      box(LW - 0.006, LH2, LD, lockerMat, 0, LH2 / 2 + 0.08, 0, G); box(LW, 0.08, LD, darkSteel, 0, 0.04, 0, G);
      var dr = new THREE.Group(); dr.position.set(-LW / 2 + 0.01, 0.1, LD / 2 + 0.008); G.add(dr);           // the door, hinged on its left
      var openA = n === 1 ? 1.9 : n === 4 ? 0.5 : 0; dr.rotation.y = -openA;
      box(LW - 0.02, LH2 - 0.04, 0.014, lockerMat, (LW - 0.02) / 2, (LH2 - 0.04) / 2, 0, dr);
      for (var v = 0; v < 5; v++) box(LW * 0.55, 0.008, 0.004, M.dark, LW / 2, LH2 - 0.2 - v * 0.035, 0.009, dr);                              // vents
      box(0.03, 0.12, 0.02, chromeS, LW - 0.06, 0.95, 0.014, dr); mesh(new THREE.PlaneGeometry(0.07, 0.04), std(0xffffff, 0.6, { map: textTex([String(n + 11)], 64, 36, '#e9e2d0', '#1a1a1a', null, false) }), LW / 2, LH2 - 0.42, 0.0075, dr);
      if (n === 4) { [[0.08, 1.2], [0.14, 1.3], [0.2, 1.24]].forEach(function (c) { var gg = box(0.008, 0.38, 0.006, M.dark, c[0], c[1], 0.012, dr); gg.rotation.z = 0.25; }); }   // claw gouges through the paint
      if (n === 1) {                                                                                         // wide open: a uniform shirt on its hook, soaked
        box(LW - 0.04, 0.012, LD - 0.04, lockerMat, 0, 1.6, 0, G);
        var shirt = box(0.3, 0.55, 0.06, std(0x77704e, 0.95, { bumpMap: bump(3), bumpScale: 0.02 }), 0, 1.22, -0.12, G); shirt.rotation.z = 0.05;
        decal(BL.spat, 0.32, 0.4, lx, 1.25, RZ1 + LD / 2 - 0.085, 0, 0, 0.3);
      }
    }
    // the sixth locker's door is off, on the floor
    var off = box(LW - 0.02, LH2 - 0.04, 0.014, lockerMat, 30.2, 0.06, RZ1 + 1.15); off.rotation.set(-PI / 2, 0, 0.35);
    decal(BL.spat, 0.9, 0.9, x0 + 1.4, 1.1, RZ1 + LD + 0.002, 0, 0, 0.6); decal(BL.hand, 0.26, 0.4, x0 + 2.05, 1.05, RZ1 + LD + 0.003, 0, 0, -0.1);
    boxes.push({ x1: x0, x2: x0 + 6 * LW, z1: RZ1, z2: RZ1 + LD + 0.02 });
  })();

  // ---------- kitchenette on the south wall: base units, worktop, sink, microwave, coffee, the answering machine ----------
  (function () {
    var KX1 = 27.6, KX2 = 31.1, KD = 0.6, kz = RZ2 - KD / 2, unitMat = std(0xffffff, 0.55, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#d4cdb6'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.25; speckle('rgba(0,0,0,0)', ['#c4bda6', '#e2dbc4'], 800, 1.2)(g, S2); g.globalAlpha = 0.6; chips(g, S2, S2, 3, '#9a927e'); g.globalAlpha = 1; grime(g, S2, S2, 0.45); }) });
    box(KX2 - KX1, 0.82, KD - 0.04, unitMat, (KX1 + KX2) / 2, 0.47, kz + 0.02); box(KX2 - KX1, 0.1, KD - 0.1, M.dark, (KX1 + KX2) / 2, 0.05, kz + 0.04);
    for (var x = KX1 + 0.3; x < KX2; x += 0.6) { box(0.58, 0.72, 0.02, unitMat, x, 0.48, RZ2 - KD + 0.01).userData.noCast = true; box(0.12, 0.015, 0.025, chromeS, x, 0.78, RZ2 - KD - 0.005); }
    var top = box(KX2 - KX1 + 0.04, 0.035, KD + 0.02, laminate, (KX1 + KX2) / 2, 0.9, kz); top.receiveShadow = true;
    box(0.5, 0.02, 0.36, chromeS, 29.0, 0.917, kz + 0.04); box(0.44, 0.1, 0.3, std(0x6a6e70, 0.3, { metalness: 0.8 }), 29.0, 0.87, kz + 0.04);   // the sink
    var tap = cyl(0.012, 0.012, 0.25, chromeS, 29.0, 1.04, kz + 0.24, null, 8); var sp2 = cyl(0.01, 0.01, 0.16, chromeS, 29.0, 1.16, kz + 0.17, null, 8); sp2.rotation.x = PI / 2;
    // wall units over it, one door hanging by a hinge
    for (x = KX1 + 0.3; x < KX2; x += 0.6) {
      box(0.58, 0.62, 0.34, unitMat, x, 1.85, RZ2 - 0.17);
      var hinge = new THREE.Group(); hinge.position.set(x - 0.28, 1.85, RZ2 - 0.35); scene.add(hinge);                         // each door on its left-hand hinge
      var dg = new THREE.Group(); dg.position.set(0, 0.3, 0); hinge.add(dg);                                                           // (the door hangs from its top hinge point)
      box(0.56, 0.6, 0.02, unitMat, 0.28, -0.3, 0, dg); box(0.1, 0.012, 0.02, chromeS, 0.48, -0.54, -0.016, dg);
      if (Math.abs(x - 29.7) < 0.1) { hinge.rotation.y = 1.95; dg.rotation.z = -0.22; }                                                // ripped off its bottom hinge: open wide, sagging from the top one
    }
    // the splashback: white tiles, grout gone grey, splashed
    mesh(new THREE.PlaneGeometry(KX2 - KX1, 0.62), std(0xffffff, 0.35, { map: canvasTex(512, function (g, S2, H2) {
      g.fillStyle = '#8a8d86'; g.fillRect(0, 0, S2, H2); var tw = S2 / 35, th = H2 / 6.2;
      for (var r = 0; r < 7; r++) for (var c = 0; c < 36; c++) { var v = 222 + ((r * 7 + c * 13) % 9) - 4; g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v - 6) + ')'; g.fillRect(c * tw + 1.2, H2 - (r + 1) * th + 1.2, tw - 2.4, th - 2.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(c * tw + 1.5, H2 - (r + 1) * th + 1.5, tw - 4, 1.5); }
      E.grime(g, S2, H2, 1.1); E.streaks(g, S2, H2, 14, 'rgba(90,70,40,.5)', H2 * 0.6);
      g.globalAlpha = 0.85; for (var q = 0; q < 26; q++) { g.fillStyle = 'rgba(70,6,6,' + (0.4 + Math.random() * 0.5) + ')'; g.beginPath(); g.arc(S2 * (0.62 + Math.random() * 0.3), H2 * (0.2 + Math.random() * 0.6), 1 + Math.random() * 4, 0, 7); g.fill(); } g.globalAlpha = 1;
    }, 1, 1, true, 90) }), (KX1 + KX2) / 2, 0.92 + 0.31, RZ2 - 0.004).rotation.y = PI;
    box(KX2 - KX1, 0.03, 0.012, std(0x9a9488, 0.5), (KX1 + KX2) / 2, 0.93, RZ2 - 0.008);                                          // the upstand along the worktop
    // microwave, door open
    var mw = new THREE.Group(); mw.position.set(30.55, 0.92, kz + 0.05); mw.rotation.y = PI + 0.08; scene.add(mw);
    box(0.48, 0.28, 0.36, std(0xd7d4c8, 0.5), 0, 0.14, 0, mw); box(0.32, 0.22, 0.3, M.dark, -0.06, 0.14, -0.02, mw);
    var mdoor = box(0.34, 0.24, 0.02, std(0x1a1c1d, 0.2, { metalness: 0.3 }), 0, 0, 0, mw); mdoor.position.set(-0.4, 0.14, -0.08); mdoor.rotation.y = 1.4;
    // coffee machine, its jug brown to the brim line; mugs; a kettle
    var cm = new THREE.Group(); cm.position.set(29.75, 0.92, kz + 0.1); cm.rotation.y = PI; scene.add(cm);
    box(0.22, 0.36, 0.26, M.dark, 0, 0.18, 0.02, cm); box(0.22, 0.05, 0.14, M.dark, 0, 0.34, -0.12, cm);
    cyl(0.07, 0.065, 0.14, std(0x3a1e0c, 0.08, { transparent: true, opacity: 0.85 }), 0, 0.08, -0.12, cm, 14); cyl(0.072, 0.072, 0.02, M.dark, 0, 0.16, -0.12, cm, 14);
    [[29.38, 0], [29.5, 1], [30.0, 2]].forEach(function (m2) { var mg = cyl(0.04, 0.036, 0.09, std([0xe9e2d0, 0x8d1f18, 0x254a30][m2[1]], 0.5), m2[0], 0.965, kz - 0.12, null, 12); if (m2[1] === 1) { mg.rotation.z = PI / 2; mg.position.y = 0.958; } });
    cyl(0.08, 0.09, 0.2, std(0xb4b8bb, 0.3, { metalness: 0.8 }), 31.0, 1.02, kz + 0.05, null, 14);
    // the answering machine and the desk phone beside it, at the end of the worktop by the door
    /* A cassette answering machine of the early nineties: a charcoal wedge (low at the front, rising to the back) with the
       micro-cassette under a smoked lid, the red message counter, a speaker grille and the row of keys, PLAY the big green
       one.  Cords for the phone line and the mains run out of the back to the wall.  Its front (+z) faces the room. */
    function wedge(w, d, hf, hb, r) {            // a rounded wedge: d deep (front at +z), hf high at the front, hb at the back, w wide
      var sh = new THREE.Shape(), f = -d / 2, bk = d / 2;
      sh.moveTo(f + r, 0); sh.lineTo(bk - r, 0); sh.quadraticCurveTo(bk, 0, bk, r); sh.lineTo(bk, hb - r); sh.quadraticCurveTo(bk, hb, bk - r, hb - r * (hb - hf) / d);
      sh.lineTo(f + r, hf + r * (hb - hf) / d); sh.quadraticCurveTo(f, hf, f, hf - r); sh.lineTo(f, r); sh.quadraticCurveTo(f, 0, f + r, 0);
      var g = new THREE.ExtrudeGeometry(sh, { depth: w - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -(w - 2 * r) / 2); g.rotateY(PI / 2); return g;        // (shape x was depth with the front negative: it becomes z with the front positive)
    }
    var amPlastic = std(0xffffff, 0.42, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#1e1f21'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#26272a', '#18191b', '#2c2d30'], 3000, 1)(g, S2); g.globalAlpha = 1; }), bumpMap: bump(6), bumpScale: 0.0015 });
    var AM = new THREE.Group(); AM.position.set(27.95, 0.918, kz - 0.06); AM.rotation.y = PI - 0.5; scene.add(AM); S.amGroup = AM;
    var AMW = 0.235, AMD = 0.17, AMF = 0.03, AMB = 0.056, AMS = Math.atan2(AMB - AMF, AMD);
    var amBody = mesh(wedge(AMW, AMD, AMF, AMB, 0.006), amPlastic, 0, 0.002, 0, AM); amBody.castShadow = true;
    box(AMW - 0.02, 0.003, AMD - 0.02, std(0x0b0b0c, 0.9), 0, 0.0015, 0, AM);                                                                     // the shadowed underside and its feet
    var TOP = new THREE.Group(); TOP.position.set(0, 0.002 + (AMF + AMB) / 2 + 0.006 * 0.6, 0); TOP.rotation.x = AMS; AM.add(TOP);                                  // the sloping top: x across, z toward the front, y out of it
    mesh(new THREE.PlaneGeometry(AMW - 0.014, AMD / Math.cos(AMS) - 0.014), std(0xffffff, 0.5, { map: canvasTex(512, function (g, S2, H2) {         // the printed top plate
      g.fillStyle = '#232427'; g.fillRect(0, 0, S2, H2); g.globalAlpha = 0.35; speckle('rgba(0,0,0,0)', ['#2a2b2e', '#1c1d1f'], 4000, 1)(g, S2); g.globalAlpha = 1;
      g.strokeStyle = '#3a3c40'; g.lineWidth = 2; g.strokeRect(14, 14, S2 - 28, H2 - 28); g.beginPath(); g.moveTo(14, H2 * 0.52); g.lineTo(S2 - 14, H2 * 0.52); g.stroke();
      g.fillStyle = '#c9cbce'; g.font = 'bold 22px Arial'; g.textAlign = 'left'; g.fillText('SONITEL', 26, H2 * 0.6); g.font = '13px Arial'; g.fillStyle = '#8a8d92'; g.fillText('TAD-210  ANSWERING SYSTEM', 26, H2 * 0.6 + 20);
      g.fillStyle = '#b8bbc0'; g.font = 'bold 12px Arial'; g.textAlign = 'center';
      [['MESSAGES', 410, 22], ['ANNC', 300, H2 * 0.95], ['MEMO', 345, H2 * 0.95], ['REW', 300, H2 * 0.6], ['FF', 345, H2 * 0.6], ['PLAY / STOP', 420, H2 * 0.6], ['ERASE', 440, H2 * 0.95]].forEach(function (l) { g.fillText(l[0], l[1], l[2]); });
      g.fillStyle = '#d23a2a'; g.beginPath(); g.arc(470, 26, 4, 0, 7); g.fill();
      E.grime(g, S2, H2, 0.6);
    }, 1, 1, true, 372) }), 0, 0.0007, 0, TOP).rotation.x = -PI / 2;
    // the cassette bay: a well with the micro-cassette in it, the smoked lid over
    mesh(new THREE.PlaneGeometry(0.088, 0.058), std(0xffffff, 0.45, { map: canvasTex(256, function (g, S2, H2) {
      g.fillStyle = '#0d0d0e'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#2a2b2e'; g.fillRect(40, 30, 176, 110); g.fillStyle = '#e9e2d0'; g.fillRect(52, 40, 152, 26); g.fillStyle = '#1a1a1a'; g.font = 'bold 13px Arial'; g.fillText('MC-60   SIDE A', 60, 58);
      g.fillStyle = '#4a3a2a'; g.fillRect(70, 84, 116, 36); [98, 158].forEach(function (x) { g.fillStyle = '#5a3c1e'; g.beginPath(); g.arc(x, 102, 22, 0, 7); g.fill(); g.fillStyle = '#e8e3d8'; g.beginPath(); g.arc(x, 102, 8, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; for (var q = 0; q < 6; q++) { g.save(); g.translate(x, 102); g.rotate(q * PI / 3); g.fillRect(-1.5, 3, 3, 4); g.restore(); } });
    }, 1, 1, true, 170) }), -0.058, 0.0012, -0.038, TOP).rotation.x = -PI / 2;
    var lid = box(0.094, 0.004, 0.064, std(0x2a1e14, 0.08, { transparent: true, opacity: 0.55, metalness: 0.3, envMap: envTex, envMapIntensity: 0.6 }), -0.058, 0.0035, -0.038, TOP); lid.userData.noCast = true;
    // the message counter in its bezel
    box(0.05, 0.003, 0.036, std(0x0a0a0b, 0.3), 0.068, 0.0016, -0.046, TOP);
    S.amLed = livePanel(0.035, 0.024, 64, 44, 0, 0, 0, 0, TOP); S.amLed.mesh.material = basic(0xffffff, { map: S.amLed.tex, fog: false }); S.amLed.mesh.position.set(0.068, 0.0034, -0.046); S.amLed.mesh.rotation.x = -PI / 2;
    // the speaker grille
    mesh(new THREE.PlaneGeometry(0.072, 0.05), std(0xffffff, 0.6, { map: canvasTex(128, function (g, S2, H2) { g.fillStyle = '#141416'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#050505'; for (var yy = 8; yy < H2 - 4; yy += 8) for (var xx = 8 + (yy % 16 ? 4 : 0); xx < S2 - 4; xx += 8) { g.beginPath(); g.arc(xx, yy, 2.4, 0, 7); g.fill(); } }, 1, 1, true, 90) }), -0.06, 0.0012, 0.045, TOP).rotation.x = -PI / 2;
    // the keys: PLAY/STOP big and green with its arrow, REW and FF, ANNC and MEMO, ERASE in red
    var keyGrey = std(0x6a6d72, 0.45), keyDark = std(0x34363a, 0.5);
    S.amPlay = box(0.036, 0.007, 0.024, std(0x2fa84a, 0.4), 0.071, 0.0045, 0.022, TOP); S.amPlay.userData.y0 = 0.0045; dyn(S.amPlay);
    mesh(new THREE.PlaneGeometry(0.014, 0.012), std(0xffffff, 0.5, { transparent: true, map: canvasTex(64, function (g, S2) { g.clearRect(0, 0, S2, S2); g.fillStyle = '#0d2a12'; g.beginPath(); g.moveTo(14, 10); g.lineTo(44, 32); g.lineTo(14, 54); g.closePath(); g.fill(); g.fillRect(48, 10, 6, 44); }) }), 0, 0.0036, 0, S.amPlay).rotation.x = -PI / 2;
    [[0.0, 0.022, keyGrey], [0.026, 0.022, keyGrey], [0.0, 0.058, keyDark], [0.026, 0.058, keyDark], [0.076, 0.058, std(0xa8231c, 0.45)]].forEach(function (kk2) { box(0.02, 0.006, 0.016, kk2[2], kk2[0], 0.003, kk2[1], TOP); });
    var wheel = cyl(0.012, 0.012, 0.008, keyDark, AMW / 2 + 0.002, 0.03, 0.03, AM, 16); wheel.rotation.z = PI / 2;                                // the volume wheel in the right-hand side
    for (k = 0; k < 10; k++) { var rib = box(0.0085, 0.0016, 0.0016, keyGrey, AMW / 2 + 0.002, 0.03 + Math.sin(k / 10 * PI * 2) * 0.012, 0.03 + Math.cos(k / 10 * PI * 2) * 0.012, AM); rib.rotation.x = -k / 10 * PI * 2; }
    S.amWorld = function (out) { S.amPlay.updateWorldMatrix(true, false); return S.amPlay.localToWorld(out.set(0, 0.0035, 0)); };
    AM.updateMatrixWorld(true);
    // its cords: the phone line and the mains, out of the back, along the worktop and up into the wall sockets
    [[-0.05, 0xd8d4c4, 0.0022, 27.7], [0.04, 0x161616, 0.0028, 27.82]].forEach(function (cd) {
      var p0 = AM.localToWorld(new THREE.Vector3(cd[0], 0.02, -AMD / 2 - 0.004)), p1 = AM.localToWorld(new THREE.Vector3(cd[0], 0.004, -AMD / 2 - 0.05));
      var c3 = new THREE.CatmullRomCurve3([p0, p1, new THREE.Vector3(cd[3] + 0.06, 0.922, RZ2 - 0.04), new THREE.Vector3(cd[3], 0.95, RZ2 - 0.012), new THREE.Vector3(cd[3], 1.08, RZ2 - 0.012)]);
      mesh(new THREE.TubeGeometry(c3, 24, cd[2], 6, false), std(cd[1], 0.6));
    });
    box(0.07, 0.11, 0.012, std(0xe6e1d2, 0.5), 27.76, 1.12, RZ2 - 0.006); [27.7, 27.82].forEach(function (x) { box(0.014, 0.03, 0.01, std(0x2a2a2a, 0.6), x, 1.1, RZ2 - 0.012); });   // the double socket
    /* The desk phone: a beige touch-tone base, its cradle empty; the handset was dropped and hangs off the end of the worktop on
       its coiled cord, a foot off the floor. */
    var phBeige = std(0xffffff, 0.45, { map: canvasTex(64, function (g, S2) { g.fillStyle = '#d6d0bd'; g.fillRect(0, 0, S2, S2); blotch(g, S2, ['#b9b29c', '#a49c84'], 6, 6, 20, 0.35); }) });
    var ph = new THREE.Group(); ph.position.set(28.27, 0.918, kz - 0.03); ph.rotation.y = PI + 0.25; scene.add(ph);
    mesh(wedge(0.19, 0.2, 0.036, 0.07, 0.008), phBeige, 0, 0.002, 0, ph).castShadow = true;
    var PTOP = new THREE.Group(); PTOP.position.set(0, 0.002 + 0.053 + 0.008 * 0.6, 0); PTOP.rotation.x = Math.atan2(0.034, 0.2); ph.add(PTOP);
    mesh(new THREE.PlaneGeometry(0.1, 0.12), std(0xffffff, 0.5, { map: canvasTex(128, function (g, S2, H2) {
      g.fillStyle = '#cfc8b4'; g.fillRect(0, 0, S2, H2);
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) { var x = 16 + c * 36, y = 14 + r * 38; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, y + 3, 28, 26); g.fillStyle = '#eeeadf'; g.fillRect(x, y, 28, 26); g.fillStyle = '#2a2a2a'; g.font = 'bold 16px Arial'; g.textAlign = 'center'; g.fillText(['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'][r * 3 + c], x + 14, y + 19); }
    }, 1, 1, true, 160) }), 0.03, 0.0008, 0.035, PTOP).rotation.x = -PI / 2;
    [-0.065, 0.065].forEach(function (x) { box(0.03, 0.022, 0.05, phBeige, x, 0.012, -0.05, PTOP); box(0.012, 0.006, 0.012, std(0x8a8678, 0.4), x, 0.026, -0.05, PTOP); });   // the cradle, its hook switches standing up: off the hook
    // the coiled cord from the base, over the edge of the worktop, down to the handset
    ph.updateMatrixWorld(true);
    var hsP = new THREE.Vector3(27.86, 0.36, kz - 0.42), cordPath = new THREE.CatmullRomCurve3([ph.localToWorld(new THREE.Vector3(-0.09, 0.02, 0.02)), new THREE.Vector3(28.12, 0.925, kz - 0.18), new THREE.Vector3(28.02, 0.9, kz - 0.33), new THREE.Vector3(27.93, 0.7, kz - 0.4), new THREE.Vector3(27.88, 0.48, kz - 0.42), hsP.clone().add(new THREE.Vector3(0.02, 0.06, 0))]);
    var coil = [], cN = 520, side = new THREE.Vector3(), up2 = new THREE.Vector3(), tg = new THREE.Vector3();
    for (k = 0; k <= cN; k++) { var u2 = k / cN; cordPath.getPointAt(u2, tg); var tn = cordPath.getTangentAt(u2); side.set(0, 1, 0).cross(tn); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize(); up2.crossVectors(tn, side); var an = u2 * PI * 2 * 62; coil.push(tg.clone().addScaledVector(side, Math.cos(an) * 0.0085).addScaledVector(up2, Math.sin(an) * 0.0085)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 1400, 0.0022, 5, false), std(0xd6d0bd, 0.55));
    var HS = new THREE.Group(); HS.position.copy(hsP); HS.rotation.set(0.3, 0.6, 1.25); scene.add(HS);                                                  // the handset: a bar with the ear and mouth cups
    tube([[-0.1, 0.0, 0, 0.026, 0.02], [-0.085, 0.006, 0, 0.03, 0.022], [-0.06, 0.012, 0, 0.018, 0.016], [0, 0.016, 0, 0.016, 0.014], [0.06, 0.012, 0, 0.018, 0.016], [0.085, 0.006, 0, 0.03, 0.022], [0.1, 0.0, 0, 0.026, 0.02]], phBeige, HS, 14, 3, new THREE.Vector3(0, 0, 1));
    [-0.092, 0.092].forEach(function (x) { var cup = cyl(0.026, 0.024, 0.008, phBeige, x, -0.012, 0, HS, 16); mesh(new THREE.CircleGeometry(0.019, 14), std(0x3a3830, 0.7), x, -0.0165, 0, HS).rotation.x = PI / 2; });
    boxes.push({ x1: KX1, x2: KX2, z1: RZ2 - KD, z2: RZ2 });
    // the fridge, door ajar, the light inside still on a fraction
    var FG = new THREE.Group(); FG.position.set(31.55, 0, RZ2 - 0.34); scene.add(FG);
    var fridgeMat = std(0xffffff, 0.5, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#b8b5aa'; g.fillRect(0, 0, S2, S2); blotch(g, S2, ['#8a8576', '#6a6658'], 12, 6, 30, 0.3); grime(g, S2, S2, 1.2); }) });
    box(0.62, 1.72, 0.64, fridgeMat, 0, 0.86, 0, FG); box(0.56, 1.6, 0.02, std(0x9a988e, 0.4), 0, 0.88, -0.3, FG);
    S.fridgeLight = basic(0x1a1a14); box(0.5, 0.02, 0.5, S.fridgeLight, 0, 1.55, -0.02, FG);
    var fd = new THREE.Group(); fd.position.set(0.31, 0, -0.33); fd.rotation.y = 0.55; FG.add(fd);
    box(0.62, 1.72, 0.05, fridgeMat, -0.31, 0.86, -0.025, fd); box(0.02, 0.4, 0.04, chromeS, -0.58, 1.1, -0.06, fd);
    [0.6, 0.95, 1.3].forEach(function (y) { box(0.5, 0.01, 0.4, std(0xd8e0e0, 0.2, { transparent: true, opacity: 0.6 }), 0, y, 0, FG); });
    boxes.push({ x1: 31.24, x2: 31.86, z1: RZ2 - 0.66, z2: RZ2 });
  })();

  // ---------- the table and chairs, thrown about ----------
  (function () {
    var TX = 30.1, TZ = 131.3;
    var T = new THREE.Group(); T.position.set(TX, 0, TZ); T.rotation.y = 0.18; scene.add(T);
    var tt = box(1.6, 0.03, 0.9, laminate, 0, 0.74, 0, T); tt.castShadow = true; box(1.62, 0.025, 0.92, chromeS, 0, 0.72, 0, T);
    [[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]].forEach(function (l) { cyl(0.02, 0.02, 0.72, chromeS, l[0], 0.36, l[1], T, 8); });
    // what was on it: mugs, a sandwich, cards, the rota, a radio on its side
    var cardMat = std(0xf1ecdd, 0.6); for (k = 0; k < 14; k++) { var c = box(0.063, 0.002, 0.088, cardMat, -0.3 + srand() * 0.7, 0.757 + k * 0.0004, -0.25 + srand() * 0.5, T); c.rotation.y = srand() * 6; }
    cyl(0.04, 0.036, 0.09, std(0xe9e2d0, 0.5), 0.45, 0.8, 0.2, T, 12); var m2 = cyl(0.04, 0.036, 0.09, std(0x2c4a7a, 0.5), -0.55, 0.795, -0.15, T, 12); m2.rotation.z = PI / 2;
    box(0.12, 0.04, 0.1, std(0xc9a36a, 0.9), 0.1, 0.775, 0.28, T).rotation.y = 0.4;
    for (k = 0; k < 4; k++) { var pp = box(0.21, 0.002, 0.297, std(0xf2efe6, 0.9), -0.1 + k * 0.08, 0.758, -0.05 + k * 0.03, T); pp.rotation.y = 0.2 * k - 0.3; }
    decal(BL.spat, 0.9, 0.7, TX + 0.15, 0.762, TZ - 0.05, -PI / 2, 0.4, 0);
    boxes.push({ x1: TX - 0.82, x2: TX + 0.82, z1: TZ - 0.5, z2: TZ + 0.5 });
    // chairs: moulded shells on steel frames
    var shellMat = std(0xffffff, 0.42, { map: canvasTex(64, function (g, S2) { g.fillStyle = '#8d2a1c'; g.fillRect(0, 0, S2, S2); blotch(g, S2, ['#6a1e14', '#a8432c'], 8, 6, 20, 0.3); E.chips(g, S2, S2, 6, '#3a1a12'); }) });
    function shell(w, h, d, r) { var sh = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r; sh.moveTo(-x, -h / 2); sh.lineTo(x, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); sh.lineTo(w / 2, y); sh.quadraticCurveTo(w / 2, h / 2, x, h / 2); sh.lineTo(-x, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); sh.lineTo(-w / 2, -y); sh.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
      var g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: d * 0.4, bevelSize: d * 0.4, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -d / 2); return g; }
    var chairSeat = shell(0.42, 0.4, 0.012, 0.07); chairSeat.rotateX(-PI / 2); var chairBack = shell(0.4, 0.3, 0.012, 0.06);
    function chair(x, z, ry, fallen) {
      var C = new THREE.Group(); C.position.set(x, 0, z); C.rotation.y = ry; scene.add(C);
      var B = new THREE.Group(); C.add(B); if (fallen) { B.rotation.x = fallen; B.position.y = 0.42 * Math.sin(Math.abs(fallen)) * 0.2; }
      mesh(chairSeat, shellMat, 0, 0.455, 0.01, B).castShadow = true; var bk = mesh(chairBack, shellMat, 0, 0.67, -0.215, B); bk.rotation.x = -0.14; bk.castShadow = true;
      [-1, 1].forEach(function (sx) {                                                                                  // a bent chrome frame each side: front leg, seat rail, back leg up into the back
        tube([[sx * 0.19, 0.0, 0.19, 0.011, 0.011], [sx * 0.19, 0.4, 0.18, 0.011, 0.011], [sx * 0.19, 0.44, 0.1, 0.011, 0.011], [sx * 0.19, 0.44, -0.12, 0.011, 0.011], [sx * 0.19, 0.42, -0.19, 0.011, 0.011], [sx * 0.19, 0.0, -0.2, 0.011, 0.011]], chromeS, B, 6, 4);
        tube([[sx * 0.19, 0.44, -0.19, 0.01, 0.01], [sx * 0.2, 0.62, -0.215, 0.01, 0.01], [sx * 0.2, 0.78, -0.235, 0.01, 0.01]], chromeS, B, 6, 3);
        cyl(0.014, 0.014, 0.012, M.dark, sx * 0.19, 0.006, 0.19, B, 8); cyl(0.014, 0.014, 0.012, M.dark, sx * 0.19, 0.006, -0.2, B, 8);       // feet
      });
      return C;
    }
    chair(TX - 0.4, TZ - 0.75, 0.1); chair(TX + 0.55, TZ - 0.7, -0.3);
    var f1 = chair(TX + 1.15, TZ + 0.9, 2.2, 0); f1.children[0].rotation.set(-PI / 2, 0, 0); f1.children[0].position.set(0, 0.22, -0.45);
    var f2 = chair(TX - 1.25, TZ + 0.55, -0.9, 0); f2.children[0].rotation.set(0, 0, PI / 2); f2.children[0].position.set(0.47, 0.22, 0);
    circles.push({ x: TX + 1.15, z: TZ + 1.1, r: 0.35 }, { x: TX - 1.0, z: TZ + 0.55, r: 0.35 });
  })();

  // ---------- the sofa against the east wall, the TV over it, the barricade at the outside door ----------
  (function () {
    var vinylBrown = std(0xffffff, 0.42, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#3a1712'; g.fillRect(0, 0, S2, S2); blotch(g, S2, ['#2a0f0c', '#4c2219', '#1e0b09'], 18, 8, 34, 0.45); g.strokeStyle = 'rgba(200,170,150,.12)'; g.lineWidth = 1; for (var q = 0; q < 30; q++) { var x = Math.random() * S2, y = Math.random() * S2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30); g.stroke(); } }), bumpMap: bump(3), bumpScale: 0.012 }), foam = std(0xc9b77a, 1);
    function rbox(w, h, d, r) { var sh3 = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r; sh3.moveTo(-x, -h / 2); sh3.lineTo(x, -h / 2); sh3.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); sh3.lineTo(w / 2, y); sh3.quadraticCurveTo(w / 2, h / 2, x, h / 2); sh3.lineTo(-x, h / 2); sh3.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); sh3.lineTo(-w / 2, -y); sh3.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2); var g3 = new THREE.ExtrudeGeometry(sh3, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.9, bevelSegments: 3, curveSegments: 5 }); g3.translate(0, 0, -(d - 2 * r) / 2); return g3; }
    var SF = new THREE.Group(); SF.position.set(RX2 - 0.45, 0, 133.0); SF.rotation.y = -PI / 2; scene.add(SF);
    mesh(rbox(1.86, 0.3, 0.78, 0.04), vinylBrown, 0, 0.27, 0, SF); var sb = mesh(rbox(1.86, 0.5, 0.2, 0.06), vinylBrown, 0, 0.66, -0.31, SF); sb.rotation.x = -0.1;
    [-1, 1].forEach(function (e) { mesh(rbox(0.18, 0.58, 0.8, 0.07), vinylBrown, e * 1.0, 0.34, 0, SF); });
    [0.06, 0.06, 0.06, 0.06].forEach(function (_, q) { cyl(0.025, 0.02, 0.1, std(0x1a1a1a, 0.6), (q % 2 ? 0.9 : -0.9), 0.05, (q < 2 ? 0.32 : -0.32), SF, 8); });
    [-0.6, 0, 0.6].forEach(function (cx, n) { var cu = mesh(rbox(0.58, 0.13, 0.62, 0.05), vinylBrown, cx, 0.48, 0.06, SF); if (n === 1) { cu.rotation.set(0.35, 0.2, 0.1); cu.position.set(0.1, 0.46, 0.42); } });
    [-0.6, 0.6].forEach(function (cx) { var bc = mesh(rbox(0.56, 0.4, 0.13, 0.05), vinylBrown, cx, 0.72, -0.18, SF); bc.rotation.x = -0.18; });
    var tear = box(0.36, 0.02, 0.24, foam, -0.55, 0.545, 0.1, SF); tear.rotation.y = 0.3;                                                       // gashed open, foam showing
    decal(BL.spat, 0.9, 0.7, RX2 - 0.55, 0.555, 132.6, -PI / 2, 0.8, 0);
    boxes.push({ x1: RX2 - 0.9, x2: RX2, z1: 132.0, z2: 134.0 });
    // the TV on its bracket in the corner, its screen caved in
    var TVG = new THREE.Group(); TVG.position.set(RX2 - 0.3, 2.05, RZ2 - 0.35); TVG.rotation.y = -PI * 0.75; scene.add(TVG);
    box(0.06, 0.06, 0.3, darkSteel, 0, 0.0, 0.2, TVG); box(0.5, 0.4, 0.42, std(0x1a1b1c, 0.5), 0, 0, -0.1, TVG);
    var scr = mesh(new THREE.PlaneGeometry(0.42, 0.32), std(0x0a0c0c, 0.15, { metalness: 0.5 }), 0, 0, -0.312, TVG); scr.rotation.y = PI;
    mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, function (g, S2) { g.clearRect(0, 0, S2, S2); g.strokeStyle = 'rgba(220,230,230,.8)'; g.lineWidth = 1; for (var q = 0; q < 16; q++) { var a = q / 16 * 6.283; g.beginPath(); g.moveTo(70, 60); g.lineTo(70 + Math.cos(a) * (30 + Math.random() * 50), 60 + Math.sin(a) * (30 + Math.random() * 50)); g.stroke(); } g.fillStyle = '#000'; g.beginPath(); g.arc(70, 60, 12, 0, 7); g.fill(); }), transparent: true, depthWrite: false }), 0, 0, -0.314, TVG).rotation.y = PI;
    // the outside door: steel, bent in at the top corner where something hit it; the vending machine dragged across it
    var OD = new THREE.Group(); OD.position.set(RX2 + 0.04, 0, EDZ1 + 0.02); scene.add(OD);
    var od = box(0.05, 2.08, 0.96, std(0x4a4f52, 0.6, { metalness: 0.4, map: metalTex }), 0, 1.04, 0.48, OD); od.rotation.set(0.0, 0.0, 0.035);
    var dent = box(0.05, 0.7, 0.5, std(0x3e4245, 0.6, { metalness: 0.4, map: metalTex }), -0.07, 1.75, 0.68, OD); dent.rotation.set(0.15, -0.25, 0.12);
    [[0.42, 1.5], [0.5, 1.45], [0.58, 1.4]].forEach(function (c) { var gg = box(0.01, 0.55, 0.008, M.dark, -0.03, c[1], c[0], OD); gg.rotation.x = 0.2; });     // gouged right through the paint
    box(0.06, 0.04, 0.24, chromeS, -0.04, 1.0, 0.15, OD);                                                                                     // push bar
    var VM = new THREE.Group(); VM.position.set(RX2 - 0.48, 0, 130.05); VM.rotation.y = -PI / 2 + 0.12; scene.add(VM);
    var vmBody = std(0xffffff, 0.5, { map: canvasTex(256, function (g, S2, H2) { g.fillStyle = '#8d1f18'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#e2b93b'; g.font = 'bold 30px ' + FONT; g.textAlign = 'center'; g.save(); g.translate(S2 * 0.86, H2 / 2); g.rotate(-PI / 2); g.fillText('SNACKS · DRINKS', 0, 10); g.restore(); E.chips(g, S2, H2, 30, '#3a1210'); E.grime(g, S2, H2, 1); }, 1, 1, true, 512) });
    box(0.9, 1.85, 0.8, vmBody, 0, 0.93, 0, VM); box(0.62, 1.3, 0.04, M.dark, -0.1, 1.1, 0.4, VM);
    for (var r2 = 0; r2 < 5; r2++) for (var c2 = 0; c2 < 4; c2++) if ((r2 * 4 + c2) % 3) box(0.1, 0.12, 0.08, std([0xd9ae35, 0x2f5a8a, 0xe9e2d0, 0x3a7a3a][c2], 0.6), -0.33 + c2 * 0.15, 0.6 + r2 * 0.24, 0.32, VM);
    var gl = mesh(new THREE.PlaneGeometry(0.62, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, function (g, S2, H2) { g.clearRect(0, 0, S2, H2); g.fillStyle = 'rgba(180,200,200,.18)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S2, 0); g.lineTo(S2, H2 * 0.3); g.lineTo(S2 * 0.6, H2 * 0.42); g.lineTo(S2 * 0.2, H2 * 0.25); g.lineTo(0, H2 * 0.35); g.fill(); g.strokeStyle = 'rgba(230,240,240,.7)'; g.beginPath(); g.moveTo(S2, H2 * 0.3); g.lineTo(S2 * 0.6, H2 * 0.42); g.lineTo(S2 * 0.2, H2 * 0.25); g.lineTo(0, H2 * 0.35); g.stroke(); }, 1, 1, true, 256), transparent: true, depthWrite: false }), -0.1, 1.1, 0.425, VM);
    gl.userData.noCast = true;
    decal(BL.hand, 0.24, 0.38, RX2 - 0.48 - 0.46, 1.25, 130.3, 0, -PI / 2 + 0.12, 0.2);                                                    // a hand dragged down its side
    boxes.push({ x1: RX2 - 0.95, x2: RX2, z1: 129.5, z2: 130.6 });
    // glass from the machine on the floor
    var sh = []; for (k = 0; k < 30; k++) sh.push([RX2 - 1.2 + srand() * 0.7, 0.05, 129.6 + srand() * 1.0, 0.5 + srand(), 1, 0.5 + srand(), -PI / 2, 0, srand() * 6]);
    inst(new THREE.CircleGeometry(0.02, 3), std(0xbfd8e0, 0.05, { metalness: 0.5, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), sh).userData.noCast = true;
  })();

  // ---------- the notice board, the clock, posters ----------
  (function () {
    var nb = mesh(new THREE.PlaneGeometry(1.2, 0.85), std(0xffffff, 0.85, { map: canvasTex(512, function (g, S2, H2) {
      g.fillStyle = '#b58b55'; g.fillRect(0, 0, S2, H2); blotch(g, S2, ['#8d6a3c', '#c9a16a'], 30, 6, 30, 0.4);
      function note(x, y, w, h, bg, title, lines, rot) {
        g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot || 0); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h); g.fillStyle = bg; g.fillRect(-w / 2, -h / 2, w, h);
        g.fillStyle = '#1a1a1a'; g.textAlign = 'left'; g.font = 'bold 15px Arial'; g.fillText(title, -w / 2 + 8, -h / 2 + 20, w - 16); g.font = '11px Arial'; g.fillStyle = '#333';
        (lines || []).forEach(function (l, n2) { g.fillText(l, -w / 2 + 8, -h / 2 + 38 + n2 * 14, w - 16); });
        g.fillStyle = '#a8231c'; g.beginPath(); g.arc(0, -h / 2 + 6, 4, 0, 7); g.fill(); g.restore();
      }
      note(18, 20, 170, 150, '#efe9d6', 'STAFF ROTA — OCTOBER', ['Mon  M.Voss / D.Pike', 'Tue  M.Voss / A.Mercer', 'Wed  T.Hale / D.Pike', 'Thu  A.Mercer / T.Hale', 'Fri  ALL HANDS (inspection)', 'Sat  Dottie Day!'], -0.03);
      note(205, 18, 140, 110, '#f3e58a', 'CODE RED', ['If an animal is loose:', 'go to the nearest SAFE', 'ROOM and STAY THERE.', 'Do not try to recapture.'], 0.04);
      note(360, 30, 130, 160, '#e9e2d0', 'EMPLOYEE OF', ['THE MONTH', '', '   Dave Pike (I.T.)', '"Turned it off and', ' on again." — M.V.'], 0.02);
      note(30, 190, 150, 90, '#dfe9f0', 'STAFF BBQ', ['Sat 17th after close', 'bring a plate!'], 0.05);
      note(200, 150, 170, 120, '#f0c9c0', 'NETWORK', ['Comms cabinet: DO NOT', 'unplug ANYTHING.', 'Ask Dave first.', 'ext. 214'], -0.04);
      note(385, 210, 110, 80, '#efe9d6', 'LOST', ['blue thermos', 'ask Tilly'], 0.1);
      E.grime(g, S2, H2, 0.8);
    }, 1, 1, true, 362) }), RX1 + 0.022, 1.55, 129.0); nb.rotation.y = PI / 2;
    box(0.03, 0.91, 1.26, M.wood, RX1 + 0.005, 1.55, 129.0);
    var ck = new THREE.Group(); ck.position.set(RX1 + 0.03, 2.2, 130.75); ck.rotation.y = PI / 2; scene.add(ck);                                // the clock over the doorway, stopped
    cyl(0.15, 0.15, 0.04, std(0x1a1a1a, 0.5), 0, 0, 0, ck, 24).rotation.x = PI / 2;
    mesh(new THREE.CircleGeometry(0.135, 24), std(0xffffff, 0.5, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, S2, S2); g.fillStyle = '#1a1a1a'; for (var q = 0; q < 12; q++) { var a = q / 12 * 6.283; g.fillRect(64 + Math.sin(a) * 52 - 2, 64 - Math.cos(a) * 52 - 5, 4, 10); } g.strokeStyle = '#1a1a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(11.68 / 12 * 6.283) * 30, 64 - Math.cos(11.68 / 12 * 6.283) * 30); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(41 / 60 * 6.283) * 44, 64 - Math.cos(41 / 60 * 6.283) * 44); g.stroke(); }) }), 0, 0, 0.021, ck);
    [[RX1 + 0.012, 1.5, 134.2, PI / 2, ['WASH', 'YOUR', 'HANDS'], '#254a30', '#e2b93b'], [RX2 - 0.012, 1.55, 128.2, -PI / 2, ['WORK', 'SAFE', 'HOME SAFE'], '#8d1f18', '#f1ecdd']].forEach(function (p) {
      var m = mesh(new THREE.PlaneGeometry(0.42, 0.58), std(0xffffff, 0.85, { map: textTex(p[4], 160, 220, p[5], p[6], p[6]) }), p[0], p[1], p[2]); m.rotation.y = p[3];
    });
  })();

  // ---------- the blood: where it started, where it was dragged, where it ended ----------
  floorDecal(BL.pool, 2.2, 1.8, 30.6, 131.9, 0.5);                                     // under the end of the table
  floorDecal(BL.pool, 1.1, 0.9, 31.5, 130.9, 1.2);
  for (k = 0; k < 4; k++) floorDecal(BL.drag, 0.95, 0.38, 31.55 + k * 0.42, 130.55 - k * 0.12, -0.28 - k * 0.04, 0.048 + k * 0.0005);   // dragged to the barricade
  floorDecal(BL.spat, 1.2, 1.2, 28.6, 128.6, 0.3); floorDecal(BL.drag, 1.4, 0.4, 27.9, 132.3, 0.05);   // tracked out through the link
  floorDecal(BL.spat, 0.8, 0.8, 26.2, 132.1, 1.0);
  decal(BL.spat, 1.4, 1.1, 31.9, 1.25, RZ1 + 0.003, 0, 0, 0.2);                       // sprayed up the wall beside the cabinet
  decal(BL.hand, 0.25, 0.4, LX1 + 0.35, 1.2, LZ2 - 0.003, 0, PI, 0.15);                // a hand on the link wall, the first thing you see
  decal(BL.hand, 0.24, 0.38, LX1 + 0.62, 1.05, LZ2 - 0.003, 0, PI, -0.2);
  decal(BL.spat, 1.0, 0.8, RX2 - 0.003, 1.3, 131.2, 0, -PI / 2, 0.5);
  (W.blood = W.blood || []).push([30.6, 131.9, 1.4]);
  // a boot and a torn shirt sleeve, the radio, a ceiling tile come down
  var boot = new THREE.Group(); boot.position.set(32.3, 0.05, 131.6); boot.rotation.set(0, 1.1, PI / 2.2); scene.add(boot);
  box(0.11, 0.14, 0.26, std(0x17130f, 0.7), 0, 0.07, 0, boot); box(0.11, 0.1, 0.14, std(0x17130f, 0.7), 0, 0.17, -0.06, boot);
  var rag = box(0.35, 0.01, 0.22, std(0x77704e, 0.95, { bumpMap: bump(3), bumpScale: 0.02 }), 29.2, 0.055, 132.6); rag.rotation.y = 0.7;
  var rad = new THREE.Group(); rad.position.set(28.9, 0.08, 130.6); rad.rotation.set(0, 0.6, PI / 2); scene.add(rad);
  box(0.07, 0.18, 0.04, M.dark, 0, 0, 0, rad); cyl(0.005, 0.005, 0.12, M.dark, 0.02, 0.15, 0, rad, 5); box(0.05, 0.04, 0.005, std(0x333a33, 0.3), 0, 0.03, 0.022, rad);
  var tl2 = box(0.6, 0.015, 0.6, std(0xbab5a2, 0.95, { map: ceilTex }), 28.4, 0.06, 133.9); tl2.rotation.set(0.04, 0.5, 0.08);
  var hole = flat(0.58, 0.58, basic(0x070707), 28.4, RH - 0.012, 133.5); hole.rotation.x = PI / 2;
  var papers = []; for (k = 0; k < 18; k++) papers.push([28 + srand() * 4.6, 0.048, 128 + srand() * 6.5, 1, 1, 1, -PI / 2, 0, srand() * 6]);
  inst(new THREE.PlaneGeometry(0.21, 0.297), std(0xf2efe6, 0.9, { side: THREE.DoubleSide }), papers).userData.noCast = true;

  // ---------- the staff room key: on the key cabinet inside the maintenance shed door ----------
  /* A brass cylinder key with a steel split ring through its bow and a red tag on the ring.  The key's own space: the bow is
     at the origin, the blade runs along +x, the faces look along z, the hole is at H.  The ring always passes through the
     hole square to the key's face (that is how a ring threads a key), and the tag hangs on the ring with its face the same
     way as the key's.  hang(d, hung) lays them along d (the way gravity pulls, in key space): held, the ring and tag dangle
     below the key; hung (from a hook or a finger through the ring), the ring is above the key and the tag hangs beside it. */
  var keyBrass = std(0xb8913a, 0.32, { metalness: 0.9, envMap: envTex, envMapIntensity: 0.5 }), ringSteel = std(0xa0a4a6, 0.3, { metalness: 0.9, envMap: envTex, envMapIntensity: 0.5 }), tagRed = std(0xa8231c, 0.55);
  var keyGeo = (function () {
    var sh2 = new THREE.Shape();                                                                         // the key in profile: bow, shoulder, blade with its cuts
    sh2.absarc(0, 0, 0.0125, 0.6, PI * 2 - 0.6, false);
    var bl = [[0.012, -0.0045], [0.017, -0.0045], [0.017, -0.006], [0.058, -0.006], [0.058, -0.0042], [0.054, -0.0042], [0.051, -0.0012], [0.047, -0.0042], [0.043, -0.0042], [0.04, -0.0008], [0.036, -0.0042], [0.031, -0.0042], [0.028, -0.0015], [0.024, -0.0042], [0.02, -0.0042], [0.02, 0.0042], [0.06, 0.0042], [0.062, 0.002], [0.062, -0.003]];
    sh2.lineTo(0.012, -0.0045); for (var q = 1; q < bl.length; q++) sh2.lineTo(bl[q][0], bl[q][1]);
    sh2.lineTo(0.06, 0.0045); sh2.lineTo(0.017, 0.0045); sh2.lineTo(0.017, 0.006); sh2.lineTo(0.0105, 0.0068);
    var hole2 = new THREE.Path(); hole2.absarc(-0.003, 0, 0.0042, 0, PI * 2, true); sh2.holes.push(hole2);
    var kg = new THREE.ExtrudeGeometry(sh2, { depth: 0.0022, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0004, bevelSegments: 1, curveSegments: 12 }); kg.translate(0, 0, -0.0011); return kg;
  })();
  var tagGeo = (function () {                                                                           // the tag, its hole at the origin, hanging along +x
    var tsh = new THREE.Shape(); tsh.moveTo(-0.007, -0.008); tsh.lineTo(0.032, -0.008); tsh.quadraticCurveTo(0.04, -0.008, 0.04, 0); tsh.quadraticCurveTo(0.04, 0.008, 0.032, 0.008); tsh.lineTo(-0.007, 0.008); tsh.quadraticCurveTo(-0.0085, 0.008, -0.0085, 0.0055); tsh.lineTo(-0.0085, -0.0055); tsh.quadraticCurveTo(-0.0085, -0.008, -0.007, -0.008);
    var th = new THREE.Path(); th.absarc(-0.003, 0, 0.0022, 0, PI * 2, true); tsh.holes.push(th);
    var tg = new THREE.ExtrudeGeometry(tsh, { depth: 0.0016, bevelEnabled: false, curveSegments: 6 }); tg.translate(0.003, 0, -0.0008); return tg;
  })();
  var tagLabel = {};
  function tagLabelMat(mirror, text) {
    var id = text + (mirror ? '|m' : '');
    return tagLabel[id] || (tagLabel[id] = std(0xffffff, 0.6, { map: canvasTex(128, function (g, S2, H2) { g.fillStyle = '#f1ecdd'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#1a1a1a'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; if (mirror) { g.translate(S2, 0); g.scale(-1, 1); } g.fillText(text, S2 / 2, H2 / 2 + 1, S2 - 10); }, 1, 1, true, 40) }));
  }
  S.buildKey = function (mirrorText, label) {
    label = label || 'STAFF RM';
    var G = new THREE.Group(), RR = 0.0125, H0 = new THREE.Vector3(-0.003, 0, 0);
    var km = new THREE.Mesh(keyGeo, keyBrass); km.castShadow = true; G.add(km);
    box(0.036, 0.0012, 0.0026, std(0x8a6a28, 0.4, { metalness: 0.8 }), 0.04, 0.0015, 0, G);              // the warding groove
    var ringG = new THREE.Group(); G.add(ringG); mesh(new THREE.TorusGeometry(RR, 0.0011, 6, 28), ringSteel, RR, 0, 0, ringG);
    var tagG = new THREE.Group(); G.add(tagG); mesh(tagGeo, tagRed, 0, 0, 0, tagG);
    [1, -1].forEach(function (sd) { var lb = mesh(new THREE.PlaneGeometry(0.03, 0.0105), tagLabelMat(sd > 0 ? mirrorText : !mirrorText, label), 0.019, 0, sd * 0.00085, tagG); if (sd < 0) lb.rotation.y = PI; });
    var X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), m4 = new THREE.Matrix4(), dd = new THREE.Vector3();
    G.userData.hang = function (d, hung) {
      dd.copy(d); dd.z = 0; if (dd.lengthSq() < 1e-6) dd.set(1, 0, 0); dd.normalize();
      X.copy(dd).multiplyScalar(hung ? -1 : 1); Y.copy(Z); ringG.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, new THREE.Vector3().crossVectors(X, Y))); ringG.position.copy(H0);
      tagG.quaternion.setFromRotationMatrix(m4.makeBasis(dd, new THREE.Vector3().crossVectors(Z, dd), Z));
      tagG.position.copy(H0); if (hung) tagG.position.z += 0.0032; else tagG.position.addScaledVector(dd, 2 * RR);
    };
    var inv = new THREE.Matrix4(), dn = new THREE.Vector3();
    G.userData.hangWorld = function (hung) { G.updateWorldMatrix(true, false); inv.copy(G.matrixWorld).invert(); G.userData.hang(dn.set(0, -1, 0).transformDirection(inv), hung); };
    G.userData.support = function (out) { return out.copy(H0).addScaledVector(dd.lengthSq() ? dd : dd.set(1, 0, 0), -2 * RR); };   // the top of the ring when it is hung (where a hook or a finger carries it)
    G.userData.hang(new THREE.Vector3(1, 0, 0), false);
    G.userData.RR = RR; G.userData.H = H0;
    return G;
  };
  /* The cabinet: a pressed-steel box (an open front, so you see into it), its door standing open on the right-hand hinge so it
     swings clear of the wall and of your reaching arm.  Inside, twelve brass hooks in three rows, each under a printed label
     sized to fit; most hooks empty. */
  var KW = 0.34, KH = 0.5, KD = 0.08;
  var KB = new THREE.Group(); KB.position.set(-16.12, 1.45, 128.55); KB.rotation.y = -PI / 2; scene.add(KB);    // on the shed's east wall, facing in
  var keyPaint = std(0xffffff, 0.5, { metalness: 0.35, map: canvasTex(128, function (g, S2) { g.fillStyle = '#4f5e55'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.3; speckle('rgba(0,0,0,0)', ['#43514a', '#5f6e64'], 900, 1.2)(g, S2); g.globalAlpha = 1; E.chips(g, S2, S2, 10, '#2a2c2a'); E.chips(g, S2, S2, 4, '#7a4a22'); E.grime(g, S2, S2, 0.7); }) });
  box(KW, KH, 0.006, keyPaint, 0, 0, 0.003, KB);                                                                   // back
  [-1, 1].forEach(function (e) { box(KW, 0.008, KD, keyPaint, 0, e * (KH / 2 - 0.004), KD / 2, KB); box(0.008, KH, KD, keyPaint, e * (KW / 2 - 0.004), 0, KD / 2, KB); });   // top, bottom, sides
  [-1, 1].forEach(function (e) { box(KW + 0.006, 0.012, 0.004, keyPaint, 0, e * (KH / 2 - 0.006), KD + 0.002, KB); box(0.012, KH, 0.004, keyPaint, e * (KW / 2 - 0.006), 0, KD + 0.002, KB); });   // the folded lip round the opening
  var KLAB = ['SHED', 'BUGGY', 'GATE 1', 'STAFF RM', 'AVIARY', 'PADDOCK', 'BUNKER', 'SPARE', 'PUMP', 'V.C.', 'TICKETS', 'OFFICE'];
  var hookP = []; for (k = 0; k < 12; k++) hookP.push([-0.1125 + (k % 4) * 0.075, 0.15 - Math.floor(k / 4) * 0.15]);
  var IW = KW - 0.016, IH = KH - 0.016, PXM = 1100;                                                                 // the printed back panel, PXM pixels a metre
  mesh(new THREE.PlaneGeometry(IW, IH), std(0xffffff, 0.75, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, map: canvasTex(Math.round(IW * PXM), function (g, S2, H2) {
    function X(x) { return (x + IW / 2) * PXM; } function Y(y) { return (IH / 2 - y) * PXM; }
    g.fillStyle = '#d9d4c4'; g.fillRect(0, 0, S2, H2); g.globalAlpha = 0.25; speckle('rgba(0,0,0,0)', ['#c9c3b0', '#e6e1d2'], 2500, 1.4)(g, S2); g.globalAlpha = 1;
    function fit(t, max, size, weight) { var f = size; do { g.font = weight + ' ' + f + 'px Arial, Helvetica, sans-serif'; f -= 1; } while (g.measureText(t).width > max && f > 8); }
    // the header strip
    g.fillStyle = '#2b3a31'; g.fillRect(0, 0, S2, Y(0.198)); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fit('KEY CABINET', S2 - 30, 30, 'bold'); g.fillText('KEY CABINET', S2 / 2, Y(0.222)); g.fillStyle = '#efe9d6'; fit('SIGN EVERY KEY OUT IN THE BOOK', S2 - 30, 14, 'bold'); g.fillText('SIGN EVERY KEY OUT IN THE BOOK', S2 / 2, Y(0.204) - 1);
    hookP.forEach(function (h, n2) {
      var lx = X(h[0]), ly = Y(h[1] + 0.026), lw = 0.066 * PXM, lh = 0.02 * PXM;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(lx - lw / 2 + 1.5, ly - lh / 2 + 1.5, lw, lh);
      g.fillStyle = '#f4efe0'; g.fillRect(lx - lw / 2, ly - lh / 2, lw, lh); g.strokeStyle = '#8a8270'; g.lineWidth = 1.2; g.strokeRect(lx - lw / 2 + 0.5, ly - lh / 2 + 0.5, lw - 1, lh - 1);
      g.fillStyle = n2 === 3 ? '#8d1f18' : '#1a1a1a'; fit(KLAB[n2], lw - 10, 15, 'bold'); g.fillText(KLAB[n2], lx, ly + 1);
      g.fillStyle = '#6a6458'; g.font = 'bold 9px Arial'; g.fillText(String(n2 + 1), lx - lw / 2 - 7, ly);
      g.fillStyle = 'rgba(40,36,28,.35)'; g.beginPath(); g.arc(lx, Y(h[1]), 5.5, 0, PI * 2); g.fill();                          // the hook's rosette shadow
    });
    E.grime(g, S2, H2, 0.6);
  }, 1, 1, true, Math.round(IH * PXM)) }), 0, 0, 0.0065, KB);
  var hookMat = std(0xb8913a, 0.35, { metalness: 0.9 });
  hookP.forEach(function (h) {                                                                                    // a brass cup hook: a rosette, the shank out of the panel, the upturned tip
    cyl(0.0045, 0.0045, 0.002, hookMat, h[0], h[1], 0.0075, KB, 10).rotation.x = PI / 2;
    cyl(0.0019, 0.0019, 0.024, hookMat, h[0], h[1], 0.019, KB, 6).rotation.x = PI / 2;
    cyl(0.0017, 0.0017, 0.007, hookMat, h[0], h[1] + 0.0032, 0.0305, KB, 6);
  });
  /* A key hung on hook n: the peg runs through the ring, so the ring hangs from the peg and the key from the ring.  A ring cannot
     hang square to the wall from a peg and also thread a key that faces you, so the key turns a little to the side (as they do). */
  var supV = new THREE.Vector3();
  function hangOnHook(kk, n2, yaw) {
    var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, -PI / 2, 'YXZ'));                       // blade down, turned `yaw` off square
    kk.userData.hang(new THREE.Vector3(1, 0, 0), true); kk.quaternion.copy(q);
    var sp = kk.userData.support(supV).applyQuaternion(q);
    kk.position.set(hookP[n2][0] - sp.x, hookP[n2][1] + 0.0019 + 0.0011 - sp.y, 0.025 - sp.z);                  // the top of the ring on the top of the peg
  }
  [[6, 0.45], [11, -0.6]].forEach(function (h) { var kk = S.buildKey(false, KLAB[h[0]]); KB.add(kk); hangOnHook(kk, h[0], h[1]); });          // two more nobody came back for
  S.hookKey = S.buildKey(false); KB.add(dyn(S.hookKey)); hangOnHook(S.hookKey, 3, 0.62);
  S.keyGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,220,140,.5)', 'rgba(255,200,100,.1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.3 }));
  S.keyGlow.scale.set(0.16, 0.16, 1); S.keyGlow.position.set(0.035, 0, 0.012); S.hookKey.add(S.keyGlow);
  // the door, open on its hinge
  var KDR = new THREE.Group(); KDR.position.set(KW / 2, 0, KD + 0.004); KDR.rotation.y = 1.72; KB.add(KDR);
  box(KW - 0.004, KH - 0.004, 0.01, keyPaint, -(KW - 0.004) / 2, 0, 0.005, KDR);
  box(KW - 0.03, KH - 0.03, 0.003, keyPaint, -(KW - 0.004) / 2, 0, -0.0015, KDR);                                  // the stiffening panel on its inside
  [0.17, -0.17].forEach(function (y) { cyl(0.004, 0.004, 0.05, M.dark, 0.002, y, 0.004, KDR, 8); });                // hinge knuckles
  cyl(0.009, 0.009, 0.012, chromeS, -KW + 0.03, 0.02, 0.014, KDR, 14).rotation.x = PI / 2; box(0.002, 0.008, 0.002, M.dark, -KW + 0.03, 0.02, 0.021, KDR);   // the lock
  mesh(new THREE.PlaneGeometry(0.2, 0.07), std(0xffffff, 0.6, { map: textTex(['KEYS'], 256, 90, '#e2b93b', '#17140e', null, false) }), -(KW - 0.004) / 2, 0.12, 0.0106, KDR);
  S.keyBoard = KB; KB.updateMatrixWorld(true);
  // where the index finger goes to lift it: through the ring, a little past its middle
  S.keyPoint = function (out) { S.hookKey.updateWorldMatrix(true, false); var R0 = S.hookKey.userData.RR; return S.hookKey.localToWorld(out.copy(S.hookKey.userData.H).addScaledVector(supV.set(1, 0, 0), -R0)); };
  S.keySpot = { x: -16.75, z: 128.55 };
  // the key the hand carries (its tag printed in mirror: the left hand's frame is mirrored), and the one left turned in the door
  S.handKey = S.buildKey(true); S.handKey.visible = false;
  lockKey = S.buildKey(false); lockKey.visible = false; door.add(lockKey);
  S.lockKey = lockKey;

  // ---------- the comms cabinet on the north wall ----------
  /* A 9U wall cabinet, its smoked-glass door standing open: a 12-port patch panel at the top, a cable bar, the 8-port
     switch, a shelf with the router on it, and a 2U battery backup in the bottom.  Six of the switch ports are patched up to
     the panel; the two that matter (GIFT-01, the shop till and staff PC; ENTRY-CTRL, the ticket lanes) hang loose. */
  var CAB = new THREE.Group(); CAB.position.set(31.35, 1.16, RZ1); scene.add(CAB); S.cab = CAB;
  var cabPaint = std(0x2b2e31, 0.55, { metalness: 0.4, map: metalTex }), CWd = 0.6, CHt = 0.6, CDp = 0.45;
  box(CWd, CHt, 0.015, cabPaint, 0, CHt / 2, 0.0075, CAB);
  [-1, 1].forEach(function (sd) { box(0.015, CHt, CDp, cabPaint, sd * (CWd / 2 - 0.0075), CHt / 2, CDp / 2, CAB); });
  box(CWd, 0.015, CDp, cabPaint, 0, CHt - 0.0075, CDp / 2, CAB); box(CWd, 0.015, CDp, cabPaint, 0, 0.0075, CDp / 2, CAB);
  for (k = 0; k < 6; k++) box(0.4, 0.004, 0.012, M.dark, 0, CHt + 0.001, 0.08 + k * 0.05, CAB);                              // the vent slots in its top
  [-0.232, 0.232].forEach(function (x) { box(0.018, CHt - 0.03, 0.02, darkSteel, x, CHt / 2, 0.41, CAB); });                   // 19-inch rails
  var gd = new THREE.Group(); gd.position.set(-CWd / 2, 0, CDp); gd.rotation.y = -1.85; CAB.add(gd);                            // the door, hinged left, open
  box(CWd, CHt, 0.018, cabPaint, CWd / 2, CHt / 2, 0.009, gd).material = cabPaint;
  var smoke = mesh(new THREE.PlaneGeometry(CWd - 0.08, CHt - 0.08), std(0x1a2226, 0.1, { transparent: true, opacity: 0.55, metalness: 0.5, side: THREE.DoubleSide }), CWd / 2, CHt / 2, 0.019, gd); smoke.userData.noCast = true;
  var sheet = mesh(new THREE.PlaneGeometry(0.19, 0.27), std(0xffffff, 0.9, { map: canvasTex(256, function (g, S2, H2) {
    g.fillStyle = '#efeadb'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#1a1a1a'; g.font = 'bold 17px Arial'; g.textAlign = 'left'; g.fillText('PATCH PANEL — STAFF CAB', 12, 26);
    g.font = '15px "Courier New", monospace';
    ['01  OFFICE PC', '02  TICKETS L', '03  TICKETS R', '04  GIFT-01 (TILL)', '05  CAM NVR', '06  VC LINK', '07  PRINTER', '08  KIOSK', '09  PHONE', '10  ENTRY-CTRL', '11  SPARE', '12  SPARE'].forEach(function (l, n2) { g.fillText(l, 14, 56 + n2 * 22); });
    g.font = 'italic 13px Arial'; g.fillStyle = '#555'; g.fillText('updated 03/2008  — D.P.', 14, H2 - 14); g.fillStyle = 'rgba(200,190,120,.5)'; g.fillRect(S2 / 2 - 30, 0, 60, 12);
    E.grime(g, S2, H2, 0.6);
  }, 1, 1, true, 360) }), CWd / 2, CHt / 2, -0.004, gd); sheet.rotation.y = PI;
  // the patch panel (top), a cable bar, the switch, the router shelf, the UPS (bottom)
  var PP_Y = 0.495, SW_Y = 0.385, PORTX = function (n) { return -0.187 + (n - 1) * 0.034; }, SWX = function (j) { return 0.02 + j * 0.026; };
  box(0.482, 0.044, 0.03, darkSteel, 0, PP_Y, 0.405, CAB);
  mesh(new THREE.PlaneGeometry(0.46, 0.042), std(0xffffff, 0.5, { metalness: 0.3, map: canvasTex(512, function (g, S2, H2) {
    g.fillStyle = '#22252a'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#d7dadc'; g.font = 'bold 13px Arial'; g.textAlign = 'center';
    for (var n2 = 1; n2 <= 12; n2++) { var x = (PORTX(n2) + 0.23) / 0.46 * S2; g.fillStyle = '#d7dadc'; g.fillText((n2 < 10 ? '0' : '') + n2, x, 13); g.fillStyle = '#060606'; g.fillRect(x - 12, 18, 24, 22); g.fillStyle = '#3a3d40'; g.fillRect(x - 12, 18, 24, 3); }
    g.fillStyle = '#8a8d90'; g.font = '10px Arial'; g.textAlign = 'left'; g.fillText('CAT5e', 6, 40);
  }, 1, 1, true, 46) }), 0, PP_Y, 0.4205, CAB);
  for (k = 0; k < 5; k++) { var ring = mesh(new THREE.TorusGeometry(0.014, 0.003, 4, 10, PI), darkSteel, -0.18 + k * 0.09, 0.45, 0.43, CAB); ring.rotation.x = PI / 2; }
  box(0.44, 0.044, 0.26, std(0x30353a, 0.45, { metalness: 0.5 }), 0, SW_Y, 0.29, CAB);
  mesh(new THREE.PlaneGeometry(0.43, 0.04), std(0xffffff, 0.45, { metalness: 0.3, map: canvasTex(512, function (g, S2, H2) {
    g.fillStyle = '#353b41'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#d7dadc'; g.font = 'bold 12px Arial'; g.fillText('NETLINK  8-PORT 10/100 SWITCH', 8, 16);
    for (var j = 0; j < 8; j++) { var x = (SWX(j) + 0.215) / 0.43 * S2; g.fillStyle = '#060606'; g.fillRect(x - 11, 20, 22, 18); g.fillStyle = '#c9cdd0'; g.font = '9px Arial'; g.fillText(String(j + 1), x - 3, 15); }
  }, 1, 1, true, 48) }), 0, SW_Y, 0.4205, CAB);
  S.swLeds = []; for (var j = 0; j < 8; j++) { var lm = basic(0x0a0a0a); S.swLeds.push(lm); mesh(new THREE.PlaneGeometry(0.004, 0.003), lm, SWX(j) - 0.008, SW_Y + 0.016, 0.421, CAB); }
  box(0.44, 0.008, 0.3, darkSteel, 0, 0.17, 0.27, CAB);
  var RT = new THREE.Group(); RT.position.set(-0.08, 0.174, 0.3); CAB.add(RT);
  box(0.23, 0.036, 0.15, std(0xd9dad4, 0.5), 0, 0.018, 0, RT); [-1, 1].forEach(function (sd) { cyl(0.004, 0.004, 0.12, M.dark, sd * 0.09, 0.09, -0.06, RT, 6).rotation.x = -0.2; });   // aerials
  mesh(new THREE.PlaneGeometry(0.22, 0.03), std(0xffffff, 0.5, { map: canvasTex(256, function (g, S2, H2) { g.fillStyle = '#d9dad4'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#2a2c2e'; g.font = 'bold 9px Arial'; ['PWR', 'SYS', 'WAN', 'LAN'].forEach(function (t, n2) { g.fillText(t, 112 + n2 * 34, 30); }); g.font = 'bold 12px Arial'; g.fillText('FZ-GATEWAY 2', 8, 22); }, 1, 1, true, 36) }), 0, 0.018, 0.0755, RT);
  S.rtLeds = []; for (k = 0; k < 4; k++) { var rl = basic(0x0a0a0a); S.rtLeds.push(rl); mesh(new THREE.CircleGeometry(0.0022, 8), rl, -0.006 + k * 0.0292, 0.024, 0.0758, RT); }
  var UPS = new THREE.Group(); UPS.position.set(0, 0.02, 0.27); CAB.add(UPS);
  box(0.44, 0.088, 0.3, std(0x1d1f22, 0.5, { metalness: 0.3 }), 0, 0.044, 0, UPS);
  S.upsLcd = livePanel(0.07, 0.03, 128, 56, 0, 0, 0, 0, UPS); S.upsLcd.mesh.material = basic(0xffffff, { map: S.upsLcd.tex, fog: false }); S.upsLcd.mesh.position.set(0.05, 0.05, 0.1505);
  var upsBtn = cyl(0.011, 0.011, 0.008, std(0x2a2c2e, 0.4), 0.15, 0.05, 0.152, UPS, 16); upsBtn.rotation.x = PI / 2; S.upsBtn = upsBtn;
  S.upsBtnLed = basic(0x0a0a0a); mesh(new THREE.RingGeometry(0.0075, 0.0095, 16), S.upsBtnLed, 0.15, 0.05, 0.1565, UPS);
  mesh(new THREE.PlaneGeometry(0.16, 0.02), std(0xffffff, 0.5, { map: textTex(['BACK-UPS 1000'], 256, 32, '#1d1f22', '#c9cdd0', null, false) }), -0.12, 0.05, 0.1505, UPS);
  boxes.push({ x1: 31.35 - CWd / 2, x2: 31.35 + CWd / 2, z1: RZ1, z2: RZ1 + CDp });
  CAB.updateMatrixWorld(true);
  S.portWorld = function (n, out) { return CAB.localToWorld(out.set(PORTX(n), PP_Y - 0.004, 0.4205)); };
  S.swWorld = function (j, out) { return CAB.localToWorld(out.set(SWX(j), SW_Y - 0.004, 0.4205)); };
  S.upsWorld = function (out) { upsBtn.updateWorldMatrix(true, false); return upsBtn.localToWorld(out.set(0, 0.006, 0)); };
  S.amWorld = function (out) { S.amPlay.updateWorldMatrix(true, false); return S.amPlay.localToWorld(out.set(0, 0.004, 0)); };
  // a patch lead: the cable is a tube rebuilt as its end moves; the plug is a clear RJ45 with a coloured boot
  var plugBody = std(0xdfe8ea, 0.1, { transparent: true, opacity: 0.65 }), gold = std(0xd9ae35, 0.3, { metalness: 0.9 });
  var colMats = {}; function colMat(col) { return colMats[col] || (colMats[col] = std(col, 0.6)); }
  function buildPlug(col) { var G = new THREE.Group(); box(0.0118, 0.0085, 0.021, plugBody, 0, 0, 0, G); box(0.008, 0.001, 0.006, gold, 0, 0.0035, -0.0075, G); box(0.004, 0.003, 0.01, plugBody, 0, 0.006, -0.002, G); box(0.0128, 0.0105, 0.016, colMat(col), 0, 0, 0.018, G); return G; }
  function cable(curve, mat, r) { return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r || 0.0027, 6, false), mat); }
  var deco = [[0, 1], [1, 2], [3, 5], [4, 8], [6, 9], [7, 11]];             // switch port -> patch port (the variants leave 3/4/6/7/9/10/11/12 as needed: see S.layout)
  S.layout = function (A, B) {                                               // which patch ports are taken, for this game's two ports
    var free = [A, B, 4, 10, 7], used = [];
    for (var n2 = 1; n2 <= 12; n2++) if (free.indexOf(n2) < 0) used.push(n2);
    return used;
  };
  var decoG = dyn(new THREE.Group()), cv1 = new THREE.Vector3(); scene.add(decoG);
  S.buildDeco = function (A, B) {
    while (decoG.children.length) { var c = decoG.children[0]; decoG.remove(c); c.traverse(function (o) { if (o.geometry && o.geometry.type === 'TubeGeometry') o.geometry.dispose(); }); }
    var used = S.layout(A, B), sw = [0, 1, 3, 4, 6, 7], cols = [0x6a7a8a, 0x8a8f94, 0x2f5a8a, 0x8a8f94, 0x6a7a8a, 0xa8231c, 0x8a8f94];
    used.forEach(function (n2, idx) {
      var a = S.portWorld(n2, new THREE.Vector3()).clone(), mat = colMat(cols[idx % cols.length]);
      if (idx < sw.length) {
        var b = S.swWorld(sw[idx], new THREE.Vector3()).clone(), mid = a.clone().lerp(b, 0.5); mid.z += 0.06; mid.y = Math.min(a.y, b.y) - 0.02;
        decoG.add(cable(new THREE.CatmullRomCurve3([a.clone().setZ(a.z + 0.012), a.clone().setZ(a.z + 0.04), mid, b.clone().setZ(b.z + 0.04), b.clone().setZ(b.z + 0.012)]), mat));
      } else decoG.add(cable(new THREE.CatmullRomCurve3([a.clone().setZ(a.z + 0.012), a.clone().setZ(a.z + 0.04).setY(a.y + 0.03), a.clone().setZ(a.z - 0.05).setY(a.y + 0.09)]), mat));
      var pl = buildPlug(cols[idx % cols.length]); pl.position.copy(a).setZ(a.z + 0.004); decoG.add(pl);
      if (idx < sw.length) { var pl2 = buildPlug(cols[idx % cols.length]); pl2.position.copy(S.swWorld(sw[idx], cv1)).setZ(cv1.z + 0.004); decoG.add(pl2); }
    });
    decoG.traverse(function (o) { o.castShadow = false; });
  };
  // the two loose leads: GIFT-01 from switch port 3 (yellow), ENTRY-CTRL from switch port 6 (blue)
  S.leads = { a: { sw: 2, col: 0xe2b93b, name: 'GIFT-01' }, b: { sw: 5, col: 0x2f6ad8, name: 'ENTRY-CTRL' } };
  var KEYLOCAL = new THREE.Matrix4(), PLUGLOCAL = new THREE.Matrix4();
  (function () {                                                             // how the key and a plug sit in the left hand's pinch (hand space)
    var tip = new THREE.Vector3(-0.05, -0.03, -0.122), bd = new THREE.Vector3(-0.25, -0.1, -0.96).normalize(), nd = new THREE.Vector3(0.96, 0, -0.25);
    nd.addScaledVector(bd, -nd.dot(bd)).normalize();
    var xA = bd.clone().negate(), zA = nd, yA = new THREE.Vector3().crossVectors(zA, xA), q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA));
    KEYLOCAL.compose(tip.clone().addScaledVector(bd, -0.009), q, new THREE.Vector3(-1, 1, 1));
    var pz = bd.clone().negate(), py = new THREE.Vector3(0, 1, 0).addScaledVector(pz, -pz.y).normalize(), px = new THREE.Vector3().crossVectors(py, pz);
    PLUGLOCAL.compose(tip.clone().addScaledVector(bd, 0.004), new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(px, py, pz)), new THREE.Vector3(-1, 1, 1));
  })();
  S.KEYLOCAL = KEYLOCAL; S.PLUGLOCAL = PLUGLOCAL;
  function inHand(obj, local) { if (obj.parent !== Hands.L.hand) Hands.L.hand.add(obj); local.decompose(obj.position, obj.quaternion, obj.scale); obj.visible = true; }
  ['a', 'b'].forEach(function (id) { var L2 = S.leads[id]; L2.plug = buildPlug(L2.col); scene.add(dyn(L2.plug)); L2.cab = null; L2.last = new THREE.Vector3(1e9, 0, 0); L2.mat = std(L2.col, 0.6); L2.sway = Math.random() * 6;
    L2.tag = mesh(new THREE.PlaneGeometry(0.05, 0.016), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, map: textTex([L2.name], 128, 40, '#e8dfb8', '#1a1a1a', null, false) })); L2.tag.userData.noCast = true; dyn(L2.tag); });
  // the targets the middle of the view can rest on at the cabinet (invisible boxes the ray is tested against)
  S.hits = []; var hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for (var n3 = 1; n3 <= 12; n3++) { var hb = mesh(new THREE.BoxGeometry(0.03, 0.034, 0.03), hitMat, 0, 0, 0); S.portWorld(n3, hb.position); hb.userData = { kind: 'port', n: n3 }; S.hits.push(hb); }
  var upsHit = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), hitMat, 0, 0, 0); S.upsWorld(upsHit.position); upsHit.userData = { kind: 'ups' }; S.hits.push(upsHit);
  ['a', 'b'].forEach(function (id) { var h2 = dyn(mesh(new THREE.BoxGeometry(0.045, 0.06, 0.045), hitMat, 0, 0, 0)); h2.userData = { kind: 'lead', id: id }; S.leads[id].hit = h2; S.hits.push(h2); });
  // the yellow edges for what the middle of the view rests on: a frame round each port's opening, the UPS button, each loose lead's plug
  S.portOutline = []; for (n3 = 1; n3 <= 12; n3++) S.portOutline[n3] = Outline.frame(CAB, 0.027, 0.025, 0.0024, PORTX(n3), PP_Y - 0.0055, 0.4216);
  S.upsOutline = Outline.make(upsBtn);
  ['a', 'b'].forEach(function (id) { S.leads[id].outline = Outline.make(S.leads[id].plug); });
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(0, 0);
  S.aim = function () { ray.setFromCamera(ndc, camera); ray.far = 1.7; var h3 = ray.intersectObjects(S.hits, false); return h3.length ? h3[0].object.userData : null; };
  S.cabSpot = { x: 31.35, z: RZ1 + 0.95 };
  S.amSpot = { x: 28.2, z: RZ2 - 0.95 };
  S.doorSpot = { x: 24.15, z: 132.15 };

  // ---------- what the room tells you: it came down through the ceiling, and went back up ----------
  (function () {
    var HOLE = { x: 28.4, z: 133.5 };
    // raptor prints in blood: three toes, the sickle claw held up off the ground (a dot), from the pool under the table to under the hole
    function printTex(left) {
      return canvasTex(128, function (g, S2, H2) {
        g.clearRect(0, 0, S2, H2); if (left) { g.translate(S2, 0); g.scale(-1, 1); }
        g.fillStyle = 'rgba(70,4,4,.97)'; g.strokeStyle = 'rgba(70,4,4,.97)'; g.lineCap = 'round';
        [[64, 22, 64, 100, 24], [30, 50, 54, 106, 20], [98, 54, 74, 108, 20]].forEach(function (t) { g.lineWidth = t[4]; g.beginPath(); g.moveTo(t[0], t[1]); g.quadraticCurveTo((t[0] + t[2]) / 2 + (t[0] < 64 ? -4 : t[0] > 64 ? 4 : 0), (t[1] + t[3]) / 2, t[2], t[3]); g.stroke(); g.beginPath(); g.moveTo(t[0] - 3, t[1] + 2); g.lineTo(t[0], t[1] - 12); g.lineTo(t[0] + 3, t[1] + 2); g.fill(); });
        g.beginPath(); g.ellipse(64, 118, 27, 20, 0, 0, PI * 2); g.fill();                                                   // the heel pad
        g.beginPath(); g.arc(24, 126, 8, 0, PI * 2); g.fill();                                                               // the sickle claw's tip, touching down
        g.globalCompositeOperation = 'destination-out'; for (var q = 0; q < 30; q++) { g.globalAlpha = Math.random() * 0.35; g.beginPath(); g.arc(Math.random() * S2, Math.random() * H2, 1 + Math.random() * 4, 0, 7); g.fill(); }
      }, 1, 1, true, 150);
    }
    var pr = [printTex(false), printTex(true)];
    var from = new THREE.Vector2(30.25, 132.2), to = new THREE.Vector2(HOLE.x + 0.15, HOLE.z - 0.15), dir = to.clone().sub(from), len = dir.length(); dir.normalize();
    var side = new THREE.Vector2(dir.y, -dir.x), rot = Math.atan2(-dir.x, -dir.y), nP = Math.floor(len / 0.5) + 1;
    for (k = 0; k < nP; k++) {
      var at = from.clone().addScaledVector(dir, k * 0.5).addScaledVector(side, (k % 2 ? 1 : -1) * 0.1);
      var pm = new THREE.MeshStandardMaterial({ map: pr[k % 2], transparent: true, depthWrite: false, roughness: 0.3, metalness: 0.1, opacity: 1 - k * 0.12, polygonOffset: true, polygonOffsetFactor: -4 });
      var fp = floorDecal(pm, 0.24, 0.28, at.x, at.y, rot + (k % 2 ? 0.12 : -0.12), 0.049 + k * 0.0003); fp.renderOrder = 4;
    }
    // claw gouges: four torn lines through the paint, the plaster showing white and the cores dark
    var clawTex = canvasTex(128, function (g, S2) {
      g.clearRect(0, 0, S2, S2); g.lineCap = 'round';
      for (var q = 0; q < 4; q++) { var x0 = 22 + q * 26, bend = (q - 1.5) * 4; [[10, 'rgba(232,226,210,.9)'], [4, 'rgba(20,16,12,.95)']].forEach(function (L) { g.lineWidth = L[0] * (q === 0 || q === 3 ? 0.75 : 1); g.strokeStyle = L[1]; g.beginPath(); g.moveTo(x0, 10 + q * 3); g.quadraticCurveTo(x0 + 8 + bend, 64, x0 + 2 + bend * 2, 118 - q * 4); g.stroke(); }); }
    });
    var clawMat = new THREE.MeshStandardMaterial({ map: clawTex, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4 });
    decal(clawMat, 0.32, 0.36, HOLE.x + 0.45, RH - 0.004, HOLE.z, PI / 2, 0, 0.6).renderOrder = 4;                                   // on the ceiling round the hole
    decal(clawMat, 0.3, 0.34, HOLE.x - 0.1, RH - 0.004, HOLE.z - 0.42, PI / 2, 0, -0.9).renderOrder = 4;
    decal(clawMat, 0.4, 0.5, RX1 + 0.004, 1.35, 133.7, 0, PI / 2, 0.35).renderOrder = 4;                                           // down the west wall by the link
    decal(clawMat, 0.36, 0.45, 32.6, 1.5, RZ1 + 0.004, 0, 0, -0.2).renderOrder = 4;                                                // beside the comms cabinet
    // the hole itself: shards of tile hanging off its edges, the flexible duct pulled down out of it, a live cable that still sparks
    var tileMat = std(0xbab5a2, 0.95, { map: ceilTex });
    [[-0.27, 0, 0.18, 0.5, 0.0, 0.8], [0.1, 0.28, 0.3, 0.16, -0.7, 0.2], [0.27, -0.1, 0.12, 0.28, 0.0, -0.9]].forEach(function (t) { var sh = box(t[2], 0.012, t[3], tileMat, HOLE.x + t[0], RH - 0.06, HOLE.z + t[1]); sh.rotation.set(t[4], 0.2, t[5]); });
    var duct = []; for (k = 0; k <= 16; k++) { var u = k / 16; duct.push([HOLE.x - 0.1 + u * 0.35, RH + 0.15 - Math.sin(u * PI * 0.9) * 0.7, HOLE.z + 0.05 - u * 0.15, 0.085, 0.085]); }
    var ductM = tube(duct, std(0xc8ccd0, 0.35, { metalness: 0.8, envMap: envTex, envMapIntensity: 0.4, map: canvasTex(64, function (g, S2) { for (var q = 0; q < S2; q += 4) { g.fillStyle = q % 8 ? '#9aa0a6' : '#e3e6e8'; g.fillRect(0, q, S2, 4); } }, 6, 1) }), null, 12, 2, new THREE.Vector3(0, 0, 1));
    var cab = new THREE.CatmullRomCurve3([new THREE.Vector3(HOLE.x + 0.18, RH + 0.1, HOLE.z + 0.15), new THREE.Vector3(HOLE.x + 0.2, RH - 0.3, HOLE.z + 0.18), new THREE.Vector3(HOLE.x + 0.12, RH - 0.75, HOLE.z + 0.1), new THREE.Vector3(HOLE.x + 0.16, RH - 0.95, HOLE.z + 0.16)]);
    mesh(new THREE.TubeGeometry(cab, 16, 0.006, 6, false), std(0x1a1a1a, 0.6));
    S.sparkAt = cab.getPointAt(1).clone();
    S.spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,250,230,1)', 'rgba(140,190,255,.5)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
    S.spark.position.copy(S.sparkAt); S.spark.scale.set(0.12, 0.12, 1); scene.add(S.spark);
    // FEEDING TONIGHT: the keepers' whiteboard
    var WBX = 30.45;
    box(0.98, 0.66, 0.02, std(0xb0b4b8, 0.3, { metalness: 0.7 }), WBX, 1.58, RZ1 + 0.011); box(0.9, 0.025, 0.05, std(0xb0b4b8, 0.3, { metalness: 0.7 }), WBX, 1.235, RZ1 + 0.035);   // frame, marker tray
    mesh(new THREE.PlaneGeometry(0.94, 0.62), std(0xffffff, 0.2, { map: canvasTex(512, function (g, S2, H2) {
      g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, S2, H2); g.fillStyle = 'rgba(150,150,170,.08)'; for (var q = 0; q < 8; q++) g.fillRect(Math.random() * S2, Math.random() * H2, 80 + Math.random() * 120, 14);   // ghosts of old writing
      var hand = '"Marker Felt", "Bradley Hand", "Comic Sans MS", cursive';
      g.fillStyle = '#1b3f8f'; g.font = 'bold 34px ' + hand; g.fillText('FEEDING TONIGHT', 22, 46); g.fillRect(22, 54, 300, 3);
      g.font = '22px ' + hand; var L = [['#a8231c', 'RAPTORS  6pm  -  2 KEEPERS MIN!!'], ['#1a1a1a', 'T-REX  -  goat  (Dave\'s turn)'], ['#1a1a1a', 'PTEROS  -  40kg herring'], ['#1b3f8f', 'PLESIO  -  check the pool filter'], ['#1a1a1a', 'Tilly\'s bday Fri - cake in fridge :)']];
      L.forEach(function (l, i) { g.fillStyle = l[0]; g.fillText(l[1], 26, 96 + i * 36, S2 - 60); });
      g.strokeStyle = '#a8231c'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, 102); g.lineTo(380, 104); g.stroke();
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(400, 250); g.quadraticCurveTo(430, 205, 470, 222); g.lineTo(495, 236); g.lineTo(468, 240); g.quadraticCurveTo(450, 262, 412, 268); g.stroke(); g.beginPath(); g.arc(462, 228, 3, 0, 7); g.stroke();   // somebody's raptor doodle
      g.fillStyle = '#1a1a1a'; g.font = '15px ' + hand; g.fillText('"clever girl"', 404, 292);
    }, 1, 1, true, 340) }), WBX, 1.58, RZ1 + 0.0225);
    decal(BL.hand, 0.22, 0.36, WBX + 0.3, 1.48, RZ1 + 0.024, 0, 0, 0.5).renderOrder = 4;                                           // dragged across it
    [[-0.3, 0x1b3f8f], [-0.2, 0xa8231c], [-0.12, 0x1a1a1a]].forEach(function (m3) { var mk = cyl(0.008, 0.008, 0.12, std(m3[1], 0.5), WBX + m3[0], 1.255, RZ1 + 0.04, null, 8); mk.rotation.z = PI / 2; });
    // the safety board: DAYS WITHOUT AN INCIDENT, and the flip cards turned back to nought
    var SB = mesh(new THREE.PlaneGeometry(0.62, 0.46), std(0xffffff, 0.6, { map: canvasTex(512, function (g, S2, H2) {
      g.fillStyle = '#254a30'; g.fillRect(0, 0, S2, H2); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.font = 'bold 34px ' + FONT; g.fillText('FAMILY ZOO', S2 / 2, 46);
      g.fillStyle = '#efe9d6'; g.font = 'bold 24px ' + FONT; g.fillText('THIS SITE HAS GONE', S2 / 2, 86);
      [-1, 1].forEach(function (e) { var x = S2 / 2 + e * 52 - 46; g.fillStyle = '#0d0d0d'; g.fillRect(x - 3, 104, 98, 152); g.fillStyle = '#f4f1e6'; g.fillRect(x, 107, 92, 146); g.fillStyle = '#121212'; g.font = 'bold 128px Arial'; g.fillText('0', x + 46, 226); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 178, 92, 3); });
      g.fillStyle = '#efe9d6'; g.font = 'bold 24px ' + FONT; g.fillText('DAYS WITHOUT AN', S2 / 2, 298); g.fillText('ANIMAL INCIDENT', S2 / 2, 328);
      g.fillStyle = '#e2b93b'; g.font = '16px ' + FONT; g.fillText('Report every incident to your supervisor.', S2 / 2, 360); E.grime(g, S2, H2, 0.9);
    }, 1, 1, true, 380) }), RX2 - 0.018, 1.62, 131.35); SB.rotation.y = -PI / 2;
    box(0.02, 0.5, 0.66, std(0x2a2c2a, 0.5, { metalness: 0.4 }), RX2 - 0.006, 1.62, 131.35);
    // the first-aid box on the west wall, its door open, gone through in a hurry
    var FA = new THREE.Group(); FA.position.set(RX1 + 0.06, 1.5, 127.68); FA.rotation.y = PI / 2; scene.add(FA);
    var faGreen = std(0x2f7a45, 0.45); box(0.32, 0.32, 0.1, faGreen, 0, 0, -0.01, FA); box(0.3, 0.3, 0.004, std(0xe9e6da, 0.6), 0, 0, 0.0385, FA);
    var faD = new THREE.Group(); faD.position.set(-0.16, 0, 0.042); faD.rotation.y = -1.25; FA.add(faD); box(0.32, 0.32, 0.012, faGreen, 0.16, 0, 0, faD);
    mesh(new THREE.PlaneGeometry(0.2, 0.2), std(0xffffff, 0.5, { map: canvasTex(64, function (g, S2) { g.fillStyle = '#2f7a45'; g.fillRect(0, 0, S2, S2); g.fillStyle = '#f4f1e6'; g.fillRect(24, 8, 16, 48); g.fillRect(8, 24, 48, 16); }) }), 0.16, 0, 0.0065, faD);
    cyl(0.03, 0.03, 0.07, std(0xf2efe6, 0.9), 0.06, -0.08, 0.0, FA, 10).rotation.z = PI / 2;                                         // one bandage left on its shelf
    var bnd = cyl(0.03, 0.03, 0.07, std(0xf2efe6, 0.9), RX1 + 0.45, 0.08, 127.95, null, 10); bnd.rotation.set(PI / 2, 0.5, 0); decal(BL.spat, 0.25, 0.25, RX1 + 0.45, 0.049, 127.95, -PI / 2, 0, 0);
    // the extinguisher by the link, on its bracket under its sign
    var EX = new THREE.Group(); EX.position.set(RX1 + 0.1, 0, 131.2); scene.add(EX);
    cyl(0.072, 0.072, 0.5, std(0xb01a12, 0.35, { metalness: 0.3, envMap: envTex, envMapIntensity: 0.4 }), 0, 0.62, 0, EX, 18); mesh(new THREE.SphereGeometry(0.072, 18, 8, 0, PI * 2, 0, PI / 2), std(0xb01a12, 0.35, { metalness: 0.3 }), 0, 0.87, 0, EX);
    cyl(0.02, 0.025, 0.06, M.dark, 0, 0.95, 0, EX, 10); box(0.14, 0.012, 0.03, M.dark, 0.03, 1.0, 0, EX).rotation.z = 0.15; box(0.12, 0.012, 0.03, M.dark, 0.03, 0.97, 0, EX).rotation.z = -0.05;
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.02, 0.94, 0.03), new THREE.Vector3(0.06, 0.8, 0.07), new THREE.Vector3(0.07, 0.55, 0.075), new THREE.Vector3(0.05, 0.42, 0.07)]), 12, 0.009, 6, false), M.dark, 0, 0, 0, EX);
    mesh(new THREE.PlaneGeometry(0.13, 0.08), std(0xffffff, 0.6, { map: textTex(['LIFT PIN', 'AIM AT BASE'], 128, 80, '#efe9d6', '#1a1a1a', null, false) }), 0.0, 0.62, 0.0725, EX).userData.noCast = true;
    box(0.1, 0.04, 0.04, darkSteel, -0.06, 0.75, 0, EX); mesh(new THREE.PlaneGeometry(0.18, 0.18), std(0xffffff, 0.6, { map: textTex(['FIRE', 'EXT.'], 128, 128, '#b01a12', '#ffffff', null, false) }), RX1 + 0.004, 1.32, 131.2).rotation.y = PI / 2;
    // coat hooks on the west wall: two ranger jackets and a bush hat, nobody came back for them
    box(0.04, 0.08, 1.0, M.wood, RX1 + 0.02, 1.74, 130.35);
    var khaki = std(0xffffff, 0.92, { map: canvasTex(64, function (g, S2) { g.fillStyle = '#6e6a48'; g.fillRect(0, 0, S2, S2); g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#5a5638', '#807a56'], 900, 1.2)(g, S2); g.globalAlpha = 1; }), bumpMap: bump(3), bumpScale: 0.01 });
    [[129.98, 0.0], [130.3, 0.12], [130.62, -0.1], [130.82, 0]].forEach(function (h, n2) { var hk = cyl(0.006, 0.006, 0.07, chromeS, RX1 + 0.06, 1.76, h[0], null, 6); hk.rotation.z = PI / 2; });
    [[130.0, 0.08], [130.32, -0.15]].forEach(function (j) {
      var J = new THREE.Group(); J.position.set(RX1 + 0.12, 1.74, j[0]); J.rotation.set(0, PI / 2, j[1]); scene.add(J);
      tube([[0, 0.0, 0, 0.05, 0.03], [0, -0.06, 0, 0.17, 0.06], [0, -0.3, 0.01, 0.2, 0.07], [0, -0.62, 0.0, 0.21, 0.065], [0, -0.72, -0.005, 0.2, 0.06]], khaki, J, 14, 3, new THREE.Vector3(1, 0, 0));   // the body, hung by its collar
      [-1, 1].forEach(function (sx) { tube([[sx * 0.16, -0.1, 0.0, 0.05, 0.045], [sx * 0.19, -0.38, 0.03, 0.045, 0.04], [sx * 0.18, -0.62, 0.05, 0.04, 0.036]], khaki, J, 10, 3, new THREE.Vector3(1, 0, 0)); });   // sleeves
      mesh(new THREE.PlaneGeometry(0.09, 0.05), std(0xffffff, 0.8, { map: textTex(['FZ RANGER'], 128, 64, '#254a30', '#e2b93b', null, false) }), -0.09, -0.2, 0.072, J);
    });
    var hat = new THREE.Group(); hat.position.set(RX1 + 0.14, 1.72, 130.66); hat.rotation.set(0.3, 0, 1.2); scene.add(hat);
    cyl(0.17, 0.17, 0.01, khaki, 0, 0, 0, hat, 20); cyl(0.09, 0.1, 0.09, khaki, 0, 0.05, 0, hat, 16); cyl(0.102, 0.102, 0.025, std(0x3a2a1a, 0.7), 0, 0.02, 0, hat, 16);
    // the water cooler in the far corner, its bottle knocked off and emptied across the floor
    var WC = new THREE.Group(); WC.position.set(33.05, 0, 134.95); WC.rotation.y = -PI * 0.75; scene.add(WC);
    box(0.3, 0.95, 0.3, std(0xd8d6ce, 0.5), 0, 0.475, 0, WC); box(0.26, 0.2, 0.02, std(0x9a9a92, 0.4), 0, 0.72, 0.15, WC); box(0.2, 0.02, 0.1, std(0x4a4a48, 0.4), 0, 0.6, 0.16, WC);
    [[-0.05, 0x2f6ad8], [0.05, 0xc8102e]].forEach(function (tp) { box(0.03, 0.04, 0.04, std(tp[1], 0.4), tp[0], 0.78, 0.17, WC); });
    cyl(0.06, 0.08, 0.05, std(0x9a9a92, 0.4), 0, 0.975, 0, WC, 14);
    var BT = new THREE.Group(); BT.position.set(32.35, 0.19, 134.45); BT.rotation.set(0, 0.6, PI / 2); scene.add(BT);
    var bottleMat = std(0x9fc8e8, 0.05, { transparent: true, opacity: 0.45, metalness: 0.1, envMap: envTex, envMapIntensity: 0.8 });
    cyl(0.135, 0.135, 0.38, bottleMat, 0, 0, 0, BT, 20); mesh(new THREE.SphereGeometry(0.135, 20, 8, 0, PI * 2, 0, PI / 2), bottleMat, 0, 0.19, 0, BT); cyl(0.03, 0.03, 0.08, bottleMat, 0, 0.3, 0, BT, 10);
    [-0.1, 0.0, 0.1].forEach(function (y) { var rg = mesh(new THREE.TorusGeometry(0.136, 0.006, 4, 24), bottleMat, 0, y, 0, BT); rg.rotation.x = PI / 2; });
    var puddle = floorDecal(new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.55, depthWrite: false, envMap: envTex, envMapIntensity: 1.2, alphaMap: softTex('rgba(255,255,255,1)', 'rgba(255,255,255,.85)'), polygonOffset: true, polygonOffsetFactor: -4 }), 1.4, 1.0, 32.3, 134.4, 0.4, 0.0485);
    puddle.renderOrder = 3; circles.push({ x: 32.35, z: 134.45, r: 0.25 }, { x: 33.05, z: 134.95, r: 0.25 });
    // the bin by the lockers, tipped over and spilled
    var BN = new THREE.Group(); BN.position.set(27.62, 0.17, 128.05); BN.rotation.set(0, 0.4, PI / 2 - 0.05); scene.add(BN);
    var binM = std(0x3a4a3e, 0.6, { side: THREE.DoubleSide }); mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.36, 16, 1, true), binM, 0, 0, 0, BN); cyl(0.13, 0.13, 0.008, binM, 0, -0.18, 0, BN, 16);
    var trash = []; for (k = 0; k < 9; k++) trash.push([27.62 + 0.25 + srand() * 0.5, 0.075, 128.05 + (srand() - 0.5) * 0.5, 0.8 + srand() * 0.5, 0.8 + srand() * 0.5, 0.8 + srand() * 0.5, srand() * 3, srand() * 3, 0]);
    inst(new THREE.IcosahedronGeometry(0.04, 0), std(0xe9e6dc, 0.95), trash).userData.noCast = true;                                // crumpled paper
    var can = cyl(0.033, 0.033, 0.12, std(0xb0281e, 0.3, { metalness: 0.8 }), 28.2, 0.083, 128.3, null, 12); can.rotation.set(0, 0.8, PI / 2);
  })();

  // gather the wing (not the door and its frame, the key cabinet in the shed, or the lights, which the light pool wants at the top)
  scene.children.slice(n0).forEach(function (o) { if (o === door || o === KB || o.isLight || (o.userData && o.userData.shopSide)) return; wing.add(o); });
  scene.add(wing);

  // ---------- poses that change: leads, the door, lamps, the key; sounds ----------
  var lv = new THREE.Vector3(), lv2 = new THREE.Vector3(), lq = new THREE.Quaternion(), lm4 = new THREE.Matrix4(), doorA = 0, seq = [], amT = -1, amSubs = [];
  S.after = function (sec, fn) { seq.push({ at: playTime + sec, fn: fn }); };
  function plugPose(L2, id, t) {                                               // where a lead's plug is: in the hand, in a port, or hanging
    var N = P.net;
    if (S.held === id) { L2.plug.updateWorldMatrix(true, false); return L2.plug.matrixWorld; }
    if (L2.plug.parent !== wing) { wing.add(L2.plug); }
    if (N[id]) { S.portWorld(N[id], lv); lm4.compose(lv.setZ(lv.z + 0.004), lq.identity(), lv2.set(1, 1, 1)); }
    else { S.swWorld(L2.sw, lv); lv.y -= 0.36 + Math.sin(t * 0.9 + L2.sway) * 0.004; lv.z += 0.07; lv.x += 0.01 * (id === 'a' ? -1 : 1) + Math.sin(t * 0.7 + L2.sway) * 0.006; lm4.compose(lv, lq.setFromAxisAngle(XA, -PI / 2), lv2.set(1, 1, 1)); }
    lm4.decompose(L2.plug.position, L2.plug.quaternion, L2.plug.scale); L2.plug.updateMatrixWorld(true); return L2.plug.matrixWorld;
  }
  var XA = new THREE.Vector3(1, 0, 0), tailV = new THREE.Vector3(), tailD = new THREE.Vector3(), swV = new THREE.Vector3();
  function stepLead(id, t) {
    var L2 = S.leads[id], m = plugPose(L2, id, t);
    tailV.set(0, 0, 0.026).applyMatrix4(m); tailD.set(0, 0, 1).transformDirection(m);
    L2.hit.position.copy(L2.plug.position);
    if (tailV.distanceTo(L2.last) < 0.0008) return; L2.last.copy(tailV);
    S.swWorld(L2.sw, swV); var s0 = swV.clone().setZ(swV.z + 0.012), s1 = swV.clone().setZ(swV.z + 0.05), e1 = tailV.clone().addScaledVector(tailD, 0.04);
    var len = s1.distanceTo(e1), mid = s1.clone().lerp(e1, 0.5); mid.y -= Math.max(0.02, 0.35 - len * 0.5) * 0.6;
    var curve = new THREE.CatmullRomCurve3([s0, s1, mid, e1, tailV.clone()]);
    if (L2.cab) { L2.cab.geometry.dispose(); L2.cab.geometry = new THREE.TubeGeometry(curve, 28, 0.0028, 6, false); } else { L2.cab = dyn(cable(curve, L2.mat)); wing.add(L2.cab); }
    L2.tag.position.copy(curve.getPointAt(0.8)); L2.tag.lookAt(camera.position); L2.tag.position.y -= 0.012;
  }
  S.netUp = function () { var N = P.net; return !!(P.pow0 && N.ups && N.a === N.A && N.b === N.B); };
  S.reset = function () {                                                     // a new game or a load: put everything back as the state says
    var N = P.net; S.held = null; seq = []; amT = -1; S.subs('');
    S.handKey.visible = false; if (S.handKey.parent) S.handKey.parent.remove(S.handKey); keySpin = null; if (spinG.parent) spinG.parent.remove(spinG);
    S.hookKey.visible = !N.key; lockKey.visible = N.door >= 1;
    if (lockKey.visible) { lockKey.position.set(LOCKP.x - 0.003 - 0.017, LOCKP.y, LOCKP.z); lockKey.rotation.set(-PI, 0, 0); lockKey.userData.hangWorld(false); }
    doorA = N.door >= 2 ? 1 : 0; S.buildDeco(N.A, N.B);
    ['a', 'b'].forEach(function (id) { S.leads[id].last.set(1e9, 0, 0); });
  };
  S.subs = function (t) { var el = $('subs'); if (!t) { el.classList.remove('show'); return; } el.textContent = t; el.classList.add('show'); };
  S.step = function (dt) {
    var N = P.net, t = playTime, i2;
    for (i2 = seq.length - 1; i2 >= 0; i2--) if (t >= seq[i2].at) { var f = seq[i2].fn; seq.splice(i2, 1); f(); }
    var inShop = player.x > 11 && player.x < 25 && player.z > 121 && player.z < 135; wing.visible = player.x > 24.6 || (inShop && doorA > 0.02) || state === 'cine';
    // the door
    var want = N.door >= 2 ? 1 : 0; doorA = clamp(doorA + clamp(want - doorA, -dt / 2.2, dt / 2.2), 0, 1);
    door.rotation.y = -1.62 * (1 - Math.pow(1 - doorA, 2.2)); S.doorBox.off = doorA > 0.25; S.doorOpenBox.off = doorA < 0.9;
    // the leads
    stepLead('a', t); stepLead('b', t);
    if (S.held && dist(player.x, player.z, S.cabSpot.x, S.cabSpot.z) > 2.4) { S.drop(); showMsg('The lead pulls out of your fingers and drops back.', 2.5); }
    if (S.held && (!Hands.hold || Hands.hold.kind === 'lead')) {                // holding a lead: the hand keeps it up in front of you, the cable running back to the switch
      if (!Hands.hold) { var hm = new THREE.Matrix4(), hp = new THREE.Vector3(), hq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), qc = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0.35, 0.2));
        Hands.hold = { kind: 'lead', inv: PLUGLOCAL.clone().invert(), want: 1, speed: 1 / 0.35, posK: easeIO, pose: Hands.POSE.pinch,
          world: function () { camera.updateMatrixWorld(true); hp.set(-0.15, -0.165, -0.41).applyMatrix4(camera.matrixWorld); hq.copy(camera.quaternion).multiply(qc); return hm.compose(hp, hq, one); } }; }
    } else if (!S.held && Hands.hold && Hands.hold.kind === 'lead') Hands.hold.want = 0;
    // power: the room's lights come on with the shop's circuit; the UPS and the network behind it
    var pw = !!P.pow0, up = pw && N.ups, net = S.netUp(), fl = pw ? (Math.sin(t * 17) + Math.sin(t * 6.1 + 1) + Math.sin(t * 41) * 0.5 > -1.2 ? 1 : 0) : 0, fl2 = pw ? ((Math.sin(t * 3.3) > 0.2 && Math.sin(t * 29) > -0.6) || Math.sin(t * 0.7) > 0.85 ? 1 : 0) : 0;
    var seen = player.x > LX1 - 0.3 || (doorA > 0.2 && player.x > 11 && player.x < 25 && player.z > 121 && player.z < 135);    // only light the room when it can be seen
    E.lights.staffA.intensity = seen && pw ? 0.66 * (0.8 + 0.2 * fl) : 0; E.lights.staffB.intensity = seen ? 0.55 * fl2 : 0;
    // the cable hanging out of the ceiling: while there is power it arcs now and then, a blue-white spit and a crackle
    if (pw && seen) { S.sparkT = (S.sparkT || 0) - dt; if (S.sparkT <= 0) { S.sparkT = 1.2 + Math.random() * 3.5; S.sparkK = 1; Sfx.play('spark', { vol: 0.25, rate: 0.9 + Math.random() * 0.3, fallback: function () { Sound.noise(0.08, 4000, 0.06); } }); } }
    S.sparkK = Math.max(0, (S.sparkK || 0) - dt * 7); S.spark.material.opacity = S.sparkK > 0 ? S.sparkK * (0.6 + Math.random() * 0.4) : 0; S.spark.scale.setScalar(0.06 + S.sparkK * 0.12 * (0.7 + Math.random() * 0.6)); E.lights.staffExit.intensity = seen ? 0.35 + (pw ? 0.15 : 0) : 0;
    S.tubes[0].color.setHex(pw ? (fl ? 0xf4f7ff : 0x9aa0a8) : 0x1c1c1a); S.tubes[1].color.setHex(fl2 ? 0xf4f7ff : 0x1c1c1a);
    S.fridgeLight.color.setHex(pw ? (Math.sin(t * 11) > 0.7 ? 0x3a3a30 : 0x8a8a7a) : 0x1a1a14);
    S.upsBtnLed.color.setHex(up ? 0x35ff8a : pw ? (Math.sin(t * 4) > 0 ? 0x5a1a10 : 0x1a0805) : 0x0a0a0a);
    if (S.upsLcdState !== (up ? 1 : pw ? 2 : 0)) { S.upsLcdState = up ? 1 : pw ? 2 : 0; var g = S.upsLcd.g; g.fillStyle = up ? '#0f2a12' : '#060806'; g.fillRect(0, 0, 128, 56); if (S.upsLcdState) { g.fillStyle = up ? '#7dff9a' : '#3a4a3a'; g.font = 'bold 18px Consolas, monospace'; g.textAlign = 'center'; g.fillText(up ? 'ONLINE' : 'OFF', 64, 24); g.font = '12px Consolas, monospace'; g.fillText(up ? 'LOAD 18%  230V' : 'press to start', 64, 44); } S.upsLcd.tex.needsUpdate = true; }
    S.rtLeds[0].color.setHex(up ? 0x35ff8a : 0x0a0a0a); S.rtLeds[1].color.setHex(up ? (Math.sin(t * 3) > 0 ? 0x35ff8a : 0x0a2a10) : 0x0a0a0a); S.rtLeds[2].color.setHex(up ? 0xffa020 : 0x0a0a0a); S.rtLeds[3].color.setHex(net ? (Math.sin(t * 13) > -0.3 ? 0x35ff8a : 0x0a2a10) : 0x0a0a0a);
    for (i2 = 0; i2 < 8; i2++) {
      var on = 0; if (up) { if (i2 === S.leads.a.sw) on = N.a ? (N.a === N.A ? 1 : 2) : 0; else if (i2 === S.leads.b.sw) on = N.b ? (N.b === N.B ? 1 : 2) : 0; else on = 1; }
      S.swLeds[i2].color.setHex(on === 1 ? (Math.sin(t * 9 + i2 * 1.7) > -0.5 ? 0x35ff8a : 0x0a2a10) : on === 2 ? 0xffa020 : 0x0a0a0a);
    }
    // the key on its hook, and on the finger
    S.keyGlow.material.opacity = 0.18 + 0.12 * Math.sin(t * 2.6);
    spinStep(dt);
    // the answering machine's counter: a red 1 blinking until the message has been heard; and its playback
    var led = N.heard ? (amT >= 0 ? '1' : '0') : (Math.sin(t * 5) > 0 ? '1' : ' ');
    if (led !== S.amLedState) { S.amLedState = led; var g2 = S.amLed.g; g2.fillStyle = '#120202'; g2.fillRect(0, 0, 64, 44); g2.fillStyle = led === ' ' ? '#200404' : '#ff2a14'; g2.font = 'bold 38px Consolas, monospace'; g2.textAlign = 'center'; g2.fillText(led === ' ' ? '8' : led, 32, 38); S.amLed.tex.needsUpdate = true; }
    if (S.amPressT !== undefined) { var pk = clamp((t - S.amPressT) / 0.2, 0, 1); S.amPlay.position.y = S.amPlay.userData.y0 - Math.sin(pk * PI) * 0.0028; }   // the key goes down under the finger and springs back
    if (amT >= 0) { amT += dt; var line = ''; for (i2 = 0; i2 < amSubs.length; i2++) if (amT >= amSubs[i2][0] && amT < amSubs[i2][1]) line = amSubs[i2][2]; if (line !== S.amLine) { S.amLine = line; S.subs(line); } if (amT > amSubs[amSubs.length - 1][1] + 0.3) { amT = -1; S.subs(''); } }
    // sounds of the room: flies over the blood, the tube that will not settle
    var dp = dist(player.x, player.z, 30.6, 131.9), inRoom = player.x > LX1 - 0.5;
    Sfx.zone('flies', 'flies', inRoom || doorA > 0.3 ? clamp(1 - dp / 6, 0, 1) * 0.32 : 0);
    Sfx.zone('fluoro', 'fluoro', pw && (inRoom || doorA > 0.3) ? clamp(1 - dist(player.x, player.z, 31.5, 133.2) / 7, 0, 1) * 0.16 * (0.4 + fl2 * 0.6) : 0);
    Sfx.zone('fridge', 'pc_hum', pw && inRoom ? clamp(1 - dist(player.x, player.z, 31.55, 135.0) / 4, 0, 1) * 0.14 : 0, 0.55);
  };

  // ---------- doing things ----------
  var tmpV = new THREE.Vector3(), XV = new THREE.Vector3(1, 0, 0);
  /* Taking the key: the index finger goes through the ring and lifts it off its hook; the hand draws back and the key swings
     on the finger, then the wrist starts a small circle and the key spins round the finger, three or four turns; the fingers
     close over it to catch it and the hand drops it into the left trouser pocket.  The key rides on a pivot on the finger's
     middle bone (spinG): turned about the finger so the key hangs the way gravity pulls, plus the spin. */
  var spinG = new THREE.Group(), keySpin = null, spinV = new THREE.Vector3(), spinInv = new THREE.Matrix4(), SPIN_Q = new THREE.Quaternion(), ZAX = new THREE.Vector3(0, 0, 1);
  (function () {                                                                // the key's place on the pivot: ring round the finger, blade pointing out from it
    var q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0)));
    SPIN_Q.copy(q);
  })();
  var FIN_R = 0.0108;                                                           // the ring rests on the top of the finger: the finger's radius plus the wire's
  function spinStep(dt) {
    var K = keySpin; if (!K) return;
    var u = playTime - K.t0, b1 = Hands.L.F[0][1];
    if (spinG.parent !== b1) { b1.add(spinG); }
    spinG.position.set(0, 0, lerp(-0.034, -0.008, sstep((u - 0.45) / 0.4)));                   // the ring slides down the finger toward the knuckle as it is lifted
    // gravity: which way is down, in the finger bone's own frame, round the finger
    b1.updateWorldMatrix(true, false); spinInv.copy(b1.matrixWorld).invert(); spinV.set(0, -1, 0).transformDirection(spinInv);
    var phiG = Math.atan2(spinV.x, -spinV.y);
    // the spin: wound up, carried round, stopped dead by the catch; before it, a pendulum swing from being lifted off the hook
    var w = u < 2.36 ? 21 * sstep((u - 1.02) / 0.32) : 0; K.spin += w * dt;
    var swing = u < 1.2 ? 0.7 * Math.exp(-3.2 * Math.max(0, u - 0.42)) * Math.sin(Math.max(0, u - 0.42) * 8.5) : 0;
    K.ang = phiG + K.spin + swing;
    spinG.quaternion.setFromAxisAngle(ZAX, K.ang);
    var turns = Math.floor(K.spin / (PI * 2)); if (turns > K.turns) { K.turns = turns; Sfx.play('keys_pick', { vol: 0.12, rate: 1.4 + Math.random() * 0.2, fallback: function () {} }); }   // the keys chink each time round
    if (u >= 2.42 && S.handKey.parent === spinG) { S.handKey.visible = false; spinG.remove(S.handKey); Sfx.play('keys_pick', { vol: 0.4, rate: 1.1, fallback: function () { Sound.pickup(); } }); }   // caught in the palm
    if (u >= 2.9 && !K.pocketed) { K.pocketed = true; Sfx.play('keys_pick', { vol: 0.25, rate: 0.75, fallback: function () {} }); }   // into the pocket
    if (u > 3.4) { keySpin = null; if (spinG.parent) spinG.parent.remove(spinG); }
  }
  S.takeKey = function () {
    var t0 = playTime, kp = S.keyPoint(new THREE.Vector3()), into = new THREE.Vector3(1, 0, 0);                        // into the wall the cabinet hangs on
    stepTo(-16.72, 128.55, kp, 0.35);
    var target = kp.clone().addScaledVector(into, 0.012); target.y -= 0.002;
    var spinCam = new THREE.Vector3(-0.1, -0.085, -0.31), pv = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), hip = new THREE.Vector3(), mv = new THREE.Vector3();
    var R0 = [0.08, 0.0, 0.05], R1 = [0.12, -1.12, 0.22], R2 = [0.9, 0.35, 0.9], rr = [0, 0, 0], ps = [];
    keySpin = null;
    Hands.use('keyTake', { pose: 'point', tip: 'point', rot: R0, dur: 3.05, reach: 0.44, outT: 0.45,
      point: function () {
        var u = playTime - t0, w1 = sstep((u - 0.78) / 0.32), w2 = sstep((u - 2.42) / 0.42);
        a.copy(target).addScaledVector(into, -0.04 * sstep((u - 0.5) / 0.3)); a.y += 0.03 * sstep((u - 0.44) / 0.22) - 0.05 * sstep((u - 0.62) / 0.3);          // lifted off the hook, drawn back
        camera.updateMatrixWorld(true); b.copy(spinCam).applyMatrix4(camera.matrixWorld);                                         // held up in front of you
        hip.set(player.x + Math.cos(player.yaw) * -0.24 - Math.sin(player.yaw) * 0.08, player.y + 1.0, player.z + Math.sin(player.yaw) * 0.24 - Math.cos(player.yaw) * 0.08);   // the left trouser pocket
        return pv.copy(a).lerp(b, w1).lerp(hip, w2);
      },
      rotAt: function (t) {
        var u = playTime - t0, w1 = sstep((u - 0.78) / 0.32), w2 = sstep((u - 2.42) / 0.42);
        for (var i = 0; i < 3; i++) rr[i] = lerp(lerp(R0[i], R1[i], w1), R2[i], w2);
        return rr;
      },
      poseAt: function () { var u = playTime - t0; return Hands.mixPose(Hands.POSE.point, Hands.POSE.fist, sstep((u - 2.33) / 0.1), ps); },
      move: function () {                                                                 // the wrist's small circle that drives the spin
        var u = playTime - t0, k = sstep((u - 0.95) / 0.3) * (1 - sstep((u - 2.3) / 0.12));
        if (!keySpin || k <= 0) return mv.set(0, 0, 0);
        var al = keySpin.spin + 1.6; mv.set(Math.cos(al) * 0.007 * k, Math.sin(al) * 0.007 * k, 0).applyQuaternion(camera.quaternion);
        return mv;
      },
      onTouch: function () {
        P.net.key = true; S.hookKey.visible = false; Sfx.play('keys_pick', { vol: 0.6, fallback: function () { Sound.pickup(); } });
        var k2 = S.handKey; if (k2.parent) k2.parent.remove(k2); spinG.add(k2); k2.visible = true; k2.userData.hang(new THREE.Vector3(1, 0, 0), true);
        k2.quaternion.copy(SPIN_Q); var sp = k2.userData.support(spinV).applyQuaternion(SPIN_Q); k2.position.set(-sp.x, FIN_R - sp.y, -sp.z); k2.scale.set(1, 1, 1);
        keySpin = { t0: t0, spin: 0, turns: 0, ang: 0 };
        S.after(0.6, function () { showMsg('The staff room key. STAFF RM — the door behind the gift shop counter.', 4); });
      } });
  };
  S.tryDoor = function () {
    stepTo(24.2, 132.05, S.pushPoint(new THREE.Vector3()), 0.3);
    Hands.use('tryDoor', { point: function () { door.updateMatrixWorld(true); return door.localToWorld(tmpV.set(-0.07, 1.02, -(DZ2 - DZ1) + 0.13)); }, pose: 'hook', tip: 'hook', rot: [0.1, 0.2, 1.4], dur: 0.9, reach: 0.35,
      move: function (t) { return lv2.set(0, t > 0.4 ? -Math.sin((t - 0.4) * 22) * 0.008 * (1 - (t - 0.4) / 0.5) : 0, 0); },
      onTouch: function () { Sfx.play('locked_handle', { vol: 0.6, fallback: function () { Sound.rattle(); Sound.clunk(); } }); showMsg(P.net.key ? '' : 'Locked. STAFF ONLY. Its key will be with the others.', 3.5); } });
  };
  S.unlockDoor = function () {                                                 // the key into the cylinder, a quarter turn, then a palm on the door
    var t0 = playTime, lf = new THREE.Vector3(), km = new THREE.Matrix4(), kq = new THREE.Quaternion(), qz = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), done = false;
    stepTo(24.18, 132.12, S.lockPoint(new THREE.Vector3()), 0.45); inHand(S.handKey, KEYLOCAL);
    S.unlockT = 0;
    Hands.hold = { kind: 'unlock', inv: KEYLOCAL.clone().invert(), want: 1, speed: 1 / 0.6, posK: easeIO, pose: Hands.POSE.pinch,
      world: function () {
        if (S.handKey.parent === Hands.L.hand) S.handKey.userData.hangWorld(false);
        var u = playTime - t0, ins = sstep((u - 0.62) / 0.32), turn = sstep((u - 1.05) / 0.28) * PI / 2;
        door.updateMatrixWorld(true); door.localToWorld(lf.set(LOCKP.x - 0.003, LOCKP.y, LOCKP.z));
        lf.x -= 0.017 + (1 - ins) * 0.05;
        kq.setFromAxisAngle(XV, -PI / 2 - turn);                                // blade into the door (+x), its flat upright, turned a quarter
        return km.compose(lf, kq, one);
      } };
    S.after(1.2, function () { P.net.door = 1; Sfx.play('door_unlock', { vol: 0.7, fallback: function () { Sound.clunk(); } }); });
    S.after(1.5, function () { lockKey.position.set(LOCKP.x - 0.003 - 0.017, LOCKP.y, LOCKP.z); lockKey.rotation.set(-PI / 2 - PI / 2, 0, 0); lockKey.visible = true; lockKey.userData.hangWorld(false); S.handKey.visible = false; if (Hands.hold && Hands.hold.kind === 'unlock') { Hands.hold.want = 0; Hands.hold.speed = 1 / 0.35; } });
    S.after(1.9, function () {
      Hands.pushDoor('doorPush', door, new THREE.Vector3(-0.0225, 1.15, -(DZ2 - DZ1) + 0.22), new THREE.Vector3(-1, 0, 0),
        function () { P.net.door = 2; Sfx.play('door_open', { vol: 0.75, fallback: function () { Sound.creak(0.7); } }); }, { reach: 0.36, hold: 0.24 });
    });
  };
  S.playMessage = function () {
    stepTo(S.amSpot.x, S.amSpot.z, S.amWorld(new THREE.Vector3()), 0.35);
    Hands.use('amPlay', { point: function () { return S.amWorld(tmpV); }, pose: 'point', tip: 'point', rot: [0.95, 0.25, 0.35], dur: 0.55, reach: 0.35, press: 0.006,
      onTouch: function () {
        var N = P.net, v = N.vm || 1, A = N.A, B = N.B, words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'], aw = words[A], bw = words[B];
        Sound.click(); amT = 0; N.heard = true; S.amPressT = playTime;
        var D = Sfx.dur('vm_dave' + v) || 26.3, t1 = 6.0, tE = t1 + D + 0.5;
        Sfx.play('vm_intro', { vol: 0.9 }); Sound.tone(1000, 1000, 0.32, 0.12, 'sine', 5.55); Sfx.play('vm_dave' + v, { vol: 1.0, delay: t1 }); Sound.tone(1000, 1000, 0.32, 0.12, 'sine', tE - 0.4); Sfx.play('vm_end', { vol: 0.9, delay: tE });
        var dave = ["“Hey, Marla, it's Dave, from I.T.  Uh... listen, I swapped the old switch out in the cabinet in here this afternoon,", '“so everything’s been re-patched. The sheet taped on the door is wrong now, so ignore it.', '“The gift shop till goes in port ' + aw + '... and entry control is port ' + bw + '.  Okay?  ' + aw.charAt(0).toUpperCase() + aw.slice(1) + ' and ' + bw + '.', '“And if the power drops again, the battery backup shuts itself right off. Just press the button on the front.', '“Alright. Cheers.”'];
        var lens = dave.map(function (l) { return l.length; }), tot = lens.reduce(function (a2, b2) { return a2 + b2; }, 0), at = t1 + 0.3;
        amSubs = [[0.2, 5.4, 'ANSWERING MACHINE: “You have one new message. Message one. Received Tuesday, 10:52 P.M.”']];
        dave.forEach(function (l, n2) { var d2 = (D - 0.6) * lens[n2] / tot; amSubs.push([at, at + d2, 'DAVE (I.T.): ' + l]); at += d2; });
        amSubs.push([tE, tE + 1.3, 'ANSWERING MACHINE: “End of messages.”']);
      } });
  };
  S.pressUps = function () {
    stepTo(S.cabSpot.x, S.cabSpot.z, S.upsWorld(new THREE.Vector3()), 0.3);
    Hands.use('ups', { point: function () { return S.upsWorld(tmpV); }, pose: 'point', tip: 'point', rot: [0.25, 0.05, 0.5], dur: 0.6, reach: 0.34, press: 0.006,
      onTouch: function () {
        if (!P.pow0) { Sound.click(); showMsg('Nothing. The battery backup has no mains power either.', 3); return; }
        P.net.ups = !P.net.ups; Sfx.play('rocker', { vol: 0.6, fallback: function () { Sound.click(); } });
        if (P.net.ups) { Sound.tone(2200, 2200, 0.12, 0.06, 'square', 0.15); Sfx.play('hdd', { vol: 0.25, delay: 0.6 }); showMsg('The battery backup beeps and its fans spin up. The router and the switch start to blink.', 4); }
        else showMsg('The battery backup clicks off. Everything in the cabinet goes dark.', 3);
      } });
  };
  S.takeLead = function (id) {
    var L2 = S.leads[id], from = P.net[id];
    Hands.use('lead' + id, { point: function () { return L2.plug.getWorldPosition(tmpV); }, pose: 'pinch', tip: 'pinch', rot: [0.05, 0.1, 1.15], dur: 0.5, reach: 0.32,
      onTouch: function () { S.held = id; P.net[id] = 0; inHand(L2.plug, PLUGLOCAL); L2.last.set(1e9, 0, 0); if (from) Sfx.play('rj45', { vol: 0.5, rate: 0.85 }); else Sound.tone(500, 380, 0.06, 0.05, 'triangle'); } });
  };
  S.plugInto = function (n) {
    var id = S.held, L2 = S.leads[id], t0 = playTime, pm = new THREE.Matrix4(), pp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), q0 = new THREE.Quaternion(), clicked = false;
    stepTo(S.cabSpot.x, S.cabSpot.z, S.portWorld(n, new THREE.Vector3()), 0.25);
    Hands.hold = { kind: 'plug', inv: PLUGLOCAL.clone().invert(), want: 1, speed: 1 / 0.42, posK: easeIO, pose: Hands.POSE.pinch,
      world: function () { var u = playTime - t0, ins = sstep((u - 0.44) / 0.18); S.portWorld(n, pp); pp.z += 0.004 + (1 - ins) * 0.03; return pm.compose(pp, q0, one); } };
    S.after(0.64, function () {
      P.net[id] = n; S.held = null; wing.add(L2.plug); L2.last.set(1e9, 0, 0); Sfx.play('rj45', { vol: 0.6, fallback: function () { Sound.click(); } });
      if (Hands.hold && Hands.hold.kind === 'plug') { Hands.hold.want = 0; Hands.hold.speed = 1 / 0.38; }
      if (P.net.ups && P.pow0) S.after(0.4, function () { if (P.net[id] === n) { if (n === (id === 'a' ? P.net.A : P.net.B)) Sound.tone(880, 880, 0.08, 0.05, 'sine'); else Sound.tone(300, 260, 0.12, 0.05, 'square'); } });
      if (S.netUp()) S.after(0.9, function () { if (S.netUp()) { Sound.chime(); showMsg('Every light on the switch goes green, and the router’s LAN light starts to flicker. The staff network is back.', 5); } });
    });
  };
  S.drop = function () { var id = S.held; if (!id) return; S.held = null; wing.add(S.leads[id].plug); S.leads[id].last.set(1e9, 0, 0); Sound.tone(300, 200, 0.05, 0.04, 'triangle'); };

  /* What E does here (game.js asks each frame).  Returns a prompt or null. */
  S.interact = function (px, pz) {
    var N = P.net;
    if (!N) return null;
    // the key cabinet in the shed
    if (!N.key && px < -16.0 && px > -18.2 && pz > 127.6 && pz < 129.6) {
      if (Hands.carried || (Hands.hold && Hands.hold.kind !== 'key')) return { text: 'A key cabinet, its door hanging open. The STAFF RM key is still on its hook.  (your left hand is full)' };
      return { text: '[E] Take the STAFF RM key', fn: S.takeKey };
    }
    // the staff door, from the shop
    if (N.door < 2 && px > 23.2 && px < 24.75 && pz > 131.3 && pz < 133.1) {
      if (Hands.hold && (Hands.hold.kind === 'unlock')) return { text: '' };
      if (N.door === 1) return { text: '' };
      if (!N.key) return { text: '[E] Try the staff door', fn: S.tryDoor };
      if (Hands.carried) return { text: 'The staff door. Your hands are full.' };
      return { text: '[E] Unlock the staff door', fn: S.unlockDoor };
    }
    if (px < RX1 - 0.1 || px > RX2 || pz < RZ1 || pz > RZ2) return null;
    // the answering machine
    if (dist(px, pz, S.amSpot.x, S.amSpot.z) < 1.25) return amT >= 0 ? { text: '' } : { text: N.heard ? '[E] Play the message again' : '[E] Play the message on the answering machine', fn: S.playMessage };
    // the comms cabinet: whatever the middle of the view is on
    if (dist(px, pz, S.cabSpot.x, S.cabSpot.z) < 1.4) {
      if (Hands.hold && Hands.hold.kind === 'plug') return { text: '' };
      var a = S.aim();
      if (S.held) {
        var nm = S.leads[S.held].name;
        if (a && a.kind === 'port') {
          var taken = S.layout(N.A, N.B).indexOf(a.n) >= 0 || N.a === a.n || N.b === a.n;
          return taken ? { text: 'Port ' + a.n + ' is in use.', outline: S.portOutline[a.n] } : { text: '[E] Plug the ' + nm + ' lead into port ' + a.n, outline: S.portOutline[a.n], fn: (function (n4) { return function () { S.plugInto(n4); }; })(a.n) };
        }
        return { text: 'Holding the ' + nm + ' lead: aim at a port on the patch panel.   [E] Let go of it', fn: S.drop };
      }
      if (a && a.kind === 'lead') { var L3 = S.leads[a.id]; return { text: N[a.id] ? '[E] Unplug the ' + L3.name + ' lead from port ' + N[a.id] : '[E] Take the loose ' + L3.name + ' lead', outline: L3.outline, fn: (function (id2) { return function () { S.takeLead(id2); }; })(a.id) }; }
      if (a && a.kind === 'ups') return N.ups ? { text: '[E] Switch the battery backup off', outline: S.upsOutline, fn: S.pressUps } : { text: '[E] Press the power button on the battery backup', outline: S.upsOutline, fn: S.pressUps };
      if (a && a.kind === 'port') return { text: 'Patch panel, port ' + a.n + '.', outline: S.portOutline[a.n] };
      return { text: 'The staff network cabinet. ' + (N.ups ? '' : 'Everything in it is dark. ') + (N.a && N.b ? '' : 'Two leads hang loose from the switch.') };
    }
    return null;
  };

  return S;
})();
