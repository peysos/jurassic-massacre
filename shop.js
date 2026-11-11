/* Jurassic Massacre — the two buildings on the entrance plaza.
   The gift shop is the first safe room: a looted souvenir shop with a staff computer behind the counter.
   The generator shed across the plaza feeds it (the yellow cable protector on the ground joins the two).
   Everything that depends on puzzle state is posed in Entrance.shopStep(); the printed clues are redrawn in Entrance.refresh(). */
'use strict';

(function buildShop() {
  var E = Entrance, EM = E.M, inst = E.inst, rt = E.rt, flat = E.flat, FONT = E.FONT, glow = WB.glow, i;
  var X1 = 11, X2 = 25, Z1 = 121, Z2 = 135, H = 3.4, DZ = 128;             // footprint, wall height, centre of the doorway
  var wall = rt(EM.cream, 5, 1.4), trim = EM.green, dark = std(0x16171a, 0.85);
  function wallBox(x1, x2, z1, z2, y1, y2, mat, collide) {
    var m = box(x2 - x1, y2 - y1, z2 - z1, mat || wall, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    if (collide !== false) boxes.push({ x1: x1, x2: x2, z1: z1, z2: z2, solid: true });
    return m;
  }

  // ---------- shell ----------
  wallBox(X1, X2, Z1, Z1 + 0.3, 0, H); wallBox(X1, X2, Z2 - 0.3, Z2, 0, H); wallBox(X2 - 0.3, X2, Z1 + 0.3, Z2 - 0.3, 0, H);
  // the front: piers, sills and a lintel around two display windows and the doorway
  [[Z1 + 0.3, 122.4], [126.4, DZ - 0.65], [DZ + 0.65, 129.6], [133.6, Z2 - 0.3]].forEach(function (p) { wallBox(X1, X1 + 0.3, p[0], p[1], 0, H, null, false); });
  [[122.4, 126.4], [129.6, 133.6]].forEach(function (w) {
    wallBox(X1, X1 + 0.3, w[0], w[1], 0, 0.8, rt(EM.brick, 4.4, 1.3), false); wallBox(X1, X1 + 0.3, w[0], w[1], 2.6, H, null, false);
    box(0.4, 0.07, 4.1, EM.stone, X1 + 0.12, 0.83, (w[0] + w[1]) / 2);
    var gp = mesh(new THREE.PlaneGeometry(4, 1.8), EM.glassDirty, X1 + 0.15, 1.7, (w[0] + w[1]) / 2); gp.rotation.y = PI / 2; gp.material.side = THREE.DoubleSide; gp.userData.noCast = true;
    [w[0] + 1.33, w[0] + 2.67].forEach(function (z) { box(0.06, 1.8, 0.05, trim, X1 + 0.15, 1.7, z); });
  });
  wallBox(X1, X1 + 0.3, DZ - 0.65, DZ + 0.65, 2.2, H, null, false);
  boxes.push({ x1: X1, x2: X1 + 0.3, z1: Z1, z2: DZ - 0.65, solid: true }); boxes.push({ x1: X1, x2: X1 + 0.3, z1: DZ + 0.65, z2: Z2, solid: true });
  box(14.6, 0.24, 14.6, dark, 18, H + 0.12, 128); box(14.9, 0.5, 0.2, trim, 18, H + 0.3, Z1 - 0.05); box(14.9, 0.5, 0.2, trim, 18, H + 0.3, Z2 + 0.05); box(0.2, 0.5, 14.9, trim, X2 + 0.05, H + 0.3, 128); box(0.2, 0.5, 14.9, trim, X1 - 0.05, H + 0.3, 128);
  box(14.3, 0.1, 14.3, rt(EM.brick, 1, 1), 18, 0.02, 128).visible = false;
  flat(13.4, 13.4, rt(M.plank, 9, 9), 18, 0.04, 128);                                                       // floorboards
  var ceil = flat(13.4, 13.4, std(0x4a483f, 1), 18, H - 0.01, 128); ceil.rotation.x = PI / 2;               // ceiling
  // sign on the roof edge and a torn awning
  box(7.2, 1.1, 0.12, trim, X1 - 0.02, H + 1.05, DZ).rotation.y = PI / 2;
  var gs = mesh(new THREE.PlaneGeometry(7, 0.95), std(0xffffff, 0.75, { map: canvasTex(1024, function (g, S, HH) {
    g.fillStyle = '#d8cfae'; g.fillRect(0, 0, S, HH); g.strokeStyle = '#d9ae35'; g.lineWidth = 8; g.strokeRect(8, 8, S - 16, HH - 16);
    g.fillStyle = '#254a30'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 96px ' + FONT; g.fillText('GIFT  SHOP', S / 2, HH / 2 - 4);
    g.font = 'bold 20px ' + FONT; g.fillStyle = '#8d1f18'; g.fillText('SOUVENIRS  ·  TOYS  ·  FILM  ·  COLD DRINKS', S / 2, HH - 20);
    E.chips(g, S, HH, 50, '#7d7664'); E.streaks(g, S, HH, 44, 'rgba(60,44,22,.9)', HH); E.grime(g, S, HH, 1.1);
  }, 1, 1, true, 140) }), X1 - 0.09, H + 1.05, DZ); gs.rotation.y = -PI / 2;
  [-3.2, 3.2].forEach(function (o) { box(0.08, 0.6, 0.08, EM.iron, X1 + 0.1, H + 0.6, DZ + o); box(0.5, 0.06, 0.06, EM.iron, X1 + 0.3, H + 0.75, DZ + o).rotation.z = 0.6; });
  var awn = mesh(new THREE.PlaneGeometry(12.4, 1.5, 24, 3), new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.DoubleSide, alphaTest: 0.5, map: canvasTex(512, function (g, S, HH) {
    for (var q = 0; q < 16; q++) { g.fillStyle = q % 2 ? '#cfc6a8' : '#2f5a3a'; g.fillRect(q * 32, 0, 32, HH); }
    E.streaks(g, S, HH, 40, 'rgba(40,34,20,.9)', HH); E.grime(g, S, HH, 1.3);
    g.globalCompositeOperation = 'destination-out';                                                         // scalloped edge, and the rips
    for (q = 0; q < 16; q++) { g.beginPath(); g.arc(q * 32 + 16, HH + 8, 15, 0, 7); g.fill(); }
    [[150, 30, 34, 70], [330, 0, 26, 110], [420, 60, 60, 44]].forEach(function (r) { g.beginPath(); g.moveTo(r[0], r[1]); g.lineTo(r[0] + r[2], r[1] + 10); g.lineTo(r[0] + r[2] * 0.7, r[1] + r[3]); g.lineTo(r[0] - 8, r[1] + r[3] * 0.8); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  }, 1, 1, true, 128) }), X1 - 0.62, 2.62, DZ);
  awn.rotation.set(0, -PI / 2, 0); awn.rotation.order = 'YXZ'; awn.rotation.x = 0.95; awn.userData.noCast = true;
  (function sag(geo) { var p = geo.attributes.position; for (var q = 0; q < p.count; q++) p.setZ(q, Math.sin(p.getX(q) * 2.1) * 0.05 + (p.getY(q) < 0 ? Math.sin(p.getX(q) * 5) * 0.04 : 0)); geo.computeVertexNormals(); })(awn.geometry);
  [-5.9, 0, 5.9].forEach(function (o) { var arm = box(1.3, 0.035, 0.035, EM.iron, X1 - 0.62, 2.62, DZ + o); arm.rotation.z = 0.62; });
  // the door: one leaf, long since forced, standing open into the shop
  var door = new THREE.Group(); door.position.set(X1 + 0.16, 0, DZ - 0.63); door.rotation.y = 1.25; scene.add(door);
  box(0.05, 2.1, 1.22, trim, 0, 1.1, 0.63, door).visible = false;
  [[0.03, 1.1, 0.04, 2.1, 0.08], [1.19, 1.1, 0.04, 2.1, 0.08]].forEach(function (f) { box(0.05, f[3], f[4], trim, 0, f[1], f[0], door); });
  box(0.05, 0.1, 1.2, trim, 0, 2.12, 0.61, door); box(0.05, 0.28, 1.2, trim, 0, 0.16, 0.61, door); box(0.05, 0.08, 1.2, trim, 0, 1.05, 0.61, door);
  var dg = mesh(new THREE.PlaneGeometry(1.1, 1.0), EM.glassDirty, 0, 1.6, 0.61, door); dg.rotation.y = PI / 2; dg.userData.noCast = true;
  box(0.09, 0.03, 0.2, EM.steel, 0.05, 1.05, 1.05, door);
  box(0.36, 2.2, 0.08, trim, X1 + 0.15, 1.1, DZ - 0.69); box(0.36, 2.2, 0.08, trim, X1 + 0.15, 1.1, DZ + 0.69); box(0.36, 0.08, 1.46, trim, X1 + 0.15, 2.24, DZ);
  mesh(new THREE.PlaneGeometry(0.5, 0.32), std(0xffffff, 0.8, { map: textTex(['SORRY', "WE'RE CLOSED"], 256, 160, '#a8231c', '#f1ecdd', '#f1ecdd') }), 0.03, 1.55, 0.61, door).rotation.y = PI / 2;
  circles.push({ x: X1 + 0.6, z: DZ - 0.2, r: 0.12 });

  // ---------- counter and the staff side ----------
  var counterTop = std(0x3a2c20, 0.5, { map: woodTex }), CX1 = 21.2, CX2 = 22.0;
  wallBox(CX1, CX2, 125, 131.4, 0, 1.0, rt(EM.green, 3, 1)); box(1.0, 0.06, 6.6, counterTop, (CX1 + CX2) / 2, 1.03, 128.2);
  wallBox(CX2, X2 - 0.3, 125, 125.7, 0, 1.0, rt(EM.green, 2, 1)); box(2.9, 0.06, 0.9, counterTop, 23.35, 1.03, 125.35);
  var hatch = box(0.9, 0.05, 1.0, counterTop, CX2 - 0.42, 1.49, 131.58); hatch.rotation.x = -1.25;           // flip-up flap, hinged on the end of the counter and left raised
  [-0.3, 0.3].forEach(function (o) { box(0.1, 0.03, 0.06, EM.steel, CX2 - 0.42 + o, 1.07, 131.44); });
  // glass front of the counter with a few things nobody took
  var cg = mesh(new THREE.PlaneGeometry(5.6, 0.5), EM.glassDirty, CX1 - 0.01, 0.62, 128.2); cg.rotation.y = -PI / 2; cg.userData.noCast = true;
  // cash register: drawer hanging open, empty
  var reg = new THREE.Group(); reg.position.set(21.62, 1.06, 126.5); reg.rotation.y = 0.15; scene.add(reg);
  box(0.42, 0.16, 0.44, dark, 0, 0.08, 0, reg); box(0.4, 0.18, 0.3, dark, 0, 0.24, -0.06, reg).rotation.x = -0.35; box(0.3, 0.14, 0.03, basic(0x0b140d), 0, 0.42, -0.2, reg);
  box(0.36, 0.07, 0.36, std(0x2a2b2e, 0.6), 0.05, 0.035, 0.3, reg);
  // the staff computer: beige CRT, keyboard, mouse, tower under the counter
  var PC = new THREE.Group(); PC.position.set(21.56, 1.06, 128.2); scene.add(PC);
  var beige = std(0xb9b29c, 0.7, { map: canvasTex(64, function (g, S) { g.fillStyle = '#b9b29c'; g.fillRect(0, 0, S, S); blotch(g, S, ['#7d7662', '#8f8870'], 8, 6, 30, 0.4); }) });
  box(0.3, 0.05, 0.3, beige, 0, 0.025, 0, PC); cyl(0.05, 0.08, 0.06, beige, 0, 0.08, 0, PC, 10);
  box(0.42, 0.38, 0.44, beige, -0.02, 0.3, 0, PC); box(0.3, 0.3, 0.3, beige, -0.26, 0.3, 0, PC);                // case and the tube's back
  box(0.02, 0.33, 0.4, dark, 0.2, 0.3, 0, PC);                                                                // bezel
  E.screen = livePanel(0.36, 0.27, 512, 384, 0, 0, 0, 0, PC); E.screen.mesh.position.set(0.212, 0.31, 0); E.screen.mesh.rotation.y = PI / 2;
  E.screen.mesh.material = basic(0xffffff, { map: E.screen.tex, fog: false });
  E.pcLed = glow(0x0a1a0a); mesh(new THREE.CircleGeometry(0.006, 8), E.pcLed, 0.211, 0.135, 0.15, PC).rotation.y = PI / 2;
  var kb = box(0.16, 0.025, 0.42, beige, 0.46, 0.012, 0, PC); kb.rotation.z = 0.06;
  mesh(new THREE.PlaneGeometry(0.4, 0.14), std(0xffffff, 0.7, { map: canvasTex(256, function (g, S, HH) { g.fillStyle = '#a39c86'; g.fillRect(0, 0, S, HH); for (var r = 0; r < 5; r++) for (var c = 0; c < 15; c++) { g.fillStyle = (r * 3 + c) % 11 === 0 ? '#8d8670' : '#cfc8b2'; g.fillRect(6 + c * 16.4, 5 + r * 16, 14, 13); } E.grime(g, S, HH, 0.9); }, 1, 1, true, 88) }), 0.46, 0.027, 0, PC).rotation.set(-PI / 2, 0, -PI / 2);
  box(0.1, 0.03, 0.06, beige, 0.44, 0.015, 0.33, PC);
  box(0.2, 0.44, 0.46, beige, 0.7, -0.83, 0.5, PC);                                                            // tower on the floor, staff side
  E.pc = { x: 22.85, z: 128.2, sx: 21.775, sy: 1.37, sz: 128.2 };                                              // where you stand; where the screen is
  // save terminal (ranger net) on the north wall
  var TM = new THREE.Group(); TM.position.set(SAFE[0].tx, 0, Z1 + 0.3); scene.add(TM);
  box(0.7, 0.9, 0.16, EM.green, 0, 1.45, 0.08, TM); box(0.76, 0.05, 0.2, EM.rustSteel, 0, 1.92, 0.1, TM); box(0.5, 0.06, 0.26, EM.steel, 0, 1.08, 0.2, TM).rotation.x = 0.3;
  W.termScr[0] = basic(0x551010, { map: WB.termTex, fog: false }); mesh(new THREE.PlaneGeometry(0.52, 0.36), W.termScr[0], 0, 1.58, 0.165, TM);
  mesh(new THREE.PlaneGeometry(0.56, 0.12), std(0xffffff, 0.7, { map: textTex(['RANGER NET · CHECKPOINT'], 384, 80, '#1c1a16', '#e2b93b', null, false) }), 0, 1.26, 0.165, TM);
  cyl(0.014, 0.014, 1.5, EM.steel, 0.3, 2.65, 0.05, TM, 5);

  // ---------- clue boards (drawn per game) ----------
  E.eom = livePanel(0.62, 0.8, 320, 412, X2 - 0.322, 1.75, 129.6, -PI / 2); box(0.03, 0.9, 0.72, M.wood, X2 - 0.3, 1.75, 129.6);
  E.reg = livePanel(1.7, 1.15, 640, 432, 18.4, 1.7, Z1 + 0.325, 0); box(1.82, 1.27, 0.03, EM.steel, 18.4, 1.7, Z1 + 0.305);
  box(1.82, 0.05, 0.08, EM.steel, 18.4, 1.05, Z1 + 0.34);                                                      // pen tray
  // roster and a phone on the staff wall
  mesh(new THREE.PlaneGeometry(0.9, 0.62), std(0xffffff, 0.8, { map: canvasTex(256, function (g, S, HH) {
    g.fillStyle = '#b58b55'; g.fillRect(0, 0, S, HH); blotch(g, S, ['#8d6a3c', '#c9a16a'], 20, 6, 30, 0.4);
    [[14, 12, 80, 100, '#e9e2d0'], [104, 20, 60, 44, '#f3e58a'], [176, 10, 68, 88, '#e9e2d0'], [104, 74, 64, 80, '#dfe9f0'], [20, 120, 76, 44, '#f0c9c0']].forEach(function (n) { g.fillStyle = n[4]; g.fillRect(n[0], n[1], n[2], n[3]); g.fillStyle = 'rgba(30,30,40,.55)'; for (var q = 0; q < 6; q++) g.fillRect(n[0] + 6, n[1] + 10 + q * 12, n[2] - 14 - (q * 7) % 20, 2); g.fillStyle = '#a8231c'; g.beginPath(); g.arc(n[0] + n[2] / 2, n[1] + 5, 3, 0, 7); g.fill(); });
    E.grime(g, S, HH, 0.8);
  }, 1, 1, true, 176) }), X2 - 0.31, 1.75, 127.2).rotation.y = -PI / 2;
  box(0.07, 0.24, 0.1, dark, X2 - 0.34, 1.5, 131.0); box(0.05, 0.2, 0.05, dark, X2 - 0.39, 1.5, 131.0);

  // ---------- shelving and what is left of the stock ----------
  var shelfMat = std(0x3d4440, 0.6, { metalness: 0.45, map: metalTex }), shelves = [], uprights = [];
  var UNITS = [[14.0, 124.4, 0], [16.9, 124.6, 0.06], [14.2, 131.9, 0], [17.4, 131.2, -0.5, 1], [19.7, 132.6, 0.02]];      // x, z, rotation, toppled
  var spots = [], pegMat = std(0xffffff, 0.9, { map: canvasTex(128, function (g, S) { g.fillStyle = '#6b5a44'; g.fillRect(0, 0, S, S); g.fillStyle = '#2c241a'; for (var a = 0; a < 16; a++) for (var b = 0; b < 16; b++) { g.beginPath(); g.arc(a * 8 + 4, b * 8 + 4, 1.1, 0, 7); g.fill(); } E.grime(g, S, S, 1); }, 6, 3) });
  UNITS.forEach(function (u) {
    var G = new THREE.Group(); G.position.set(u[0], 0, u[1]); G.rotation.y = u[2]; if (u[3]) { G.rotation.z = 1.32; G.position.y = 0.3; } scene.add(G);
    box(0.5, 0.06, 3.0, shelfMat, 0, 0.03, 0, G);
    [0.45, 0.9, 1.35].forEach(function (y) { box(0.5, 0.025, 3.0, shelfMat, 0, y, 0, G); if (!u[3]) for (var q = 0; q < 7; q++) spots.push([u[0] + (srand() - 0.5) * 0.25, y + 0.013, u[1] - 1.3 + q * 0.43 + (srand() - 0.5) * 0.1]); });
    [-1.48, 0, 1.48].forEach(function (z) { box(0.04, 1.6, 0.04, shelfMat, 0, 0.8, z, G); });
    box(0.02, 1.6, 3.0, pegMat, 0, 0.8, 0, G);
    if (u[3]) boxes.push({ x1: u[0] - 1.5, x2: u[0] + 0.4, z1: u[1] - 1.5, z2: u[1] + 1.2 }); else boxes.push({ x1: u[0] - 0.27, x2: u[0] + 0.27, z1: u[1] - 1.52, z2: u[1] + 1.52 });
  });
  for (i = 0; i < 40; i++) spots.push([12.2 + srand() * 8.4, 0.045, 122 + srand() * 12, 1]);                    // and on the floor
  var plushB = [], plushH = [], mugs = [], cartons = [], cards = [], col = new THREE.Color();
  spots.forEach(function (p, n) {
    var r = srand(), fl = p[3], ry = srand() * 6;
    if (inBox(p[0], p[2], 0.05) && fl) return;
    if (r < 0.3) { var s = 0.11 + srand() * 0.05, tip = fl ? 1.4 : 0; plushB.push([p[0], p[1] + s * (fl ? 0.55 : 0.8), p[2], s * 0.9, s * (fl ? 0.6 : 0.8), s * 1.25, tip, ry, 0]); plushH.push([p[0] + Math.sin(ry) * s * 1.1, p[1] + s * (fl ? 0.6 : 1.5), p[2] + Math.cos(ry) * s * 1.1, s * 0.5, s * 0.5, s * 0.62, 0, ry, 0]); }
    else if (r < 0.5) mugs.push([p[0], p[1] + (fl ? 0.045 : 0.05), p[2], 1, 1, 1, fl ? PI / 2 : 0, ry, 0]);
    else if (r < 0.75) { var bs = 0.1 + srand() * 0.08; cartons.push([p[0], p[1] + bs * 0.6, p[2], bs * 1.3, bs * 1.2, bs * 0.8, 0, ry, fl && srand() < 0.5 ? PI / 2 : 0]); }
    else if (fl) cards.push([p[0], 0.047, p[2], 1, 1, 1, -PI / 2, 0, ry]);
  });
  var felt = std(0xffffff, 1, { bumpMap: bump(3), bumpScale: 0.02 });
  var pb = inst(new THREE.SphereGeometry(1, 10, 8), felt, plushB), ph = inst(new THREE.SphereGeometry(1, 10, 8), felt, plushH);
  plushB.forEach(function (_, n) { col.setHSL([0.3, 0.08, 0.55, 0.02, 0.75][n % 5], 0.26, 0.2 + (n % 3) * 0.04); pb.setColorAt(n, col); ph.setColorAt(n, col); });      // faded and dusty
  var mg = inst(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10), std(0xffffff, 0.35), mugs); mugs.forEach(function (_, n) { col.setHex([0xe9e2d0, 0x2f5a3a, 0xe2b93b, 0xa8231c][n % 4]); mg.setColorAt(n, col); });
  var ct = inst(new THREE.BoxGeometry(1, 1, 1), std(0xffffff, 0.8, { map: canvasTex(64, function (g, S) { g.fillStyle = '#d8cfae'; g.fillRect(0, 0, S, S); g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S, 18); g.fillStyle = '#5c9a52'; g.beginPath(); g.ellipse(32, 40, 16, 9, 0, 0, 7); g.fill(); g.fillRect(40, 22, 6, 18); E.grime(g, S, S, 1); }) }), cartons);
  cartons.forEach(function (_, n) { col.setHex([0xffffff, 0xd8c0b0, 0xb8c8d8][n % 3]); ct.setColorAt(n, col); });
  var cd = inst(new THREE.PlaneGeometry(0.15, 0.1), std(0xffffff, 0.9, { side: THREE.DoubleSide }), cards); cd.userData.noCast = true; cards.forEach(function (_, n) { col.setHex([0xd8d2c2, 0x8fb0c8, 0xc8a878, 0x9ab88a][n % 4]); cd.setColorAt(n, col); });
  // postcard spinner by the door, a clothes rail of faded shirts
  var spn = new THREE.Group(); spn.position.set(13.0, 0, 129.9); spn.rotation.z = 0.06; scene.add(spn);
  cyl(0.02, 0.02, 1.7, shelfMat, 0, 0.85, 0, spn, 6); cyl(0.26, 0.3, 0.04, shelfMat, 0, 0.02, 0, spn, 10);
  var pcs = []; for (i = 0; i < 24; i++) { var a = (i % 6) / 6 * PI * 2, lv = Math.floor(i / 6); if ((i * 7) % 5 === 0) continue; pcs.push([Math.cos(a) * 0.17, 0.5 + lv * 0.34, Math.sin(a) * 0.17, 1, 1, 1, 0.12, -a + PI / 2, 0]); }
  inst(new THREE.PlaneGeometry(0.11, 0.16), std(0xc8bfa6, 0.9, { side: THREE.DoubleSide }), pcs, spn).userData.noCast = true;
  [0, 1, 2, 3].forEach(function (lv) { var y = 0.42 + lv * 0.34; mesh(new THREE.TorusGeometry(0.165, 0.006, 5, 18), shelfMat, 0, y, 0, spn).rotation.x = PI / 2; box(0.34, 0.01, 0.01, shelfMat, 0, y, 0, spn); box(0.01, 0.01, 0.34, shelfMat, 0, y, 0, spn); });      // the wire tiers the cards sit in
  circles.push({ x: 13.0, z: 129.9, r: 0.32 });
  var rail = new THREE.Group(); rail.position.set(12.0, 0, 124.3); scene.add(rail);
  [-0.9, 0.9].forEach(function (z) { box(0.04, 1.5, 0.04, shelfMat, 0, 0.75, z, rail); box(0.4, 0.04, 0.04, shelfMat, 0, 0.02, z, rail); }); box(0.03, 0.03, 1.84, shelfMat, 0, 1.5, 0, rail);
  var tees = []; for (i = 0; i < 7; i++) if (i !== 2 && i !== 5) tees.push([0, 1.12, -0.75 + i * 0.25, 1, 1, 1, 0, (srand() - 0.5) * 0.3, 0]);
  var tm = inst(new THREE.BoxGeometry(0.5, 0.66, 0.03), felt, tees, rail); tees.forEach(function (_, n) { col.setHex([0x4a6a52, 0x8a7a4a, 0x6a4a44, 0x4a5a6a, 0x7a7466][n % 5]); tm.setColorAt(n, col); });
  boxes.push({ x1: 11.75, x2: 12.25, z1: 123.35, z2: 125.25 });
  // Dottie: the big mascot plush, slumped in the corner with one eye gone
  var dot = new THREE.Group(); dot.position.set(20.3, 0, 133.6); dot.rotation.y = -2.3; scene.add(dot);
  var dfelt = std(0x4f8a4a, 1, { bumpMap: bump(3), bumpScale: 0.03, map: canvasTex(64, function (g, S) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S); blotch(g, S, ['#6a6a5a', '#3a3a30'], 14, 6, 26, 0.5); }) });
  tube([[0, 0.3, -0.75, 0.03, 0.03], [0, 0.22, -0.45, 0.14, 0.13], [0, 0.36, -0.1, 0.36, 0.34], [0, 0.42, 0.15, 0.38, 0.38], [0, 0.6, 0.38, 0.24, 0.24], [0.05, 0.95, 0.44, 0.15, 0.15], [0.16, 1.2, 0.5, 0.13, 0.13]], dfelt, dot, 14, 5);
  tube([[0.16, 1.18, 0.48, 0.12, 0.12], [0.22, 1.2, 0.62, 0.16, 0.14], [0.27, 1.12, 0.8, 0.13, 0.1], [0.3, 1.07, 0.9, 0.05, 0.05]], dfelt, dot, 12, 4);
  [[-0.3, 0.3], [0.3, 0.3], [-0.28, -0.1], [0.28, -0.1]].forEach(function (l) { tube([[l[0], 0.3, l[1], 0.13, 0.13], [l[0] * 1.5, 0.14, l[1] + 0.22, 0.11, 0.11], [l[0] * 1.6, 0.1, l[1] + 0.42, 0.12, 0.1]], dfelt, dot, 8, 3); });
  mesh(new THREE.SphereGeometry(0.035, 8, 8), std(0x0a0a0a, 0.2), 0.15, 1.27, 0.7, dot); mesh(new THREE.CircleGeometry(0.03, 8), basic(0x1a120c), 0.345, 1.22, 0.66, dot).rotation.y = 1.3;
  circles.push({ x: 20.3, z: 133.6, r: 0.7 });
  // stock room corner: stacked boxes behind the counter return
  var crates = []; [[23.9, 122.2, 0.9], [23.0, 122.0, 0.7], [23.6, 123.3, 0.6], [22.3, 123.9, 0.5], [24.1, 124.1, 0.75]].forEach(function (c, n) { crates.push([c[0], c[2] / 2, c[1], c[2], c[2], c[2], 0, n * 0.4, 0]); if (n < 2) crates.push([c[0] + 0.05, c[2] + 0.25, c[1], 0.5, 0.5, 0.5, 0, n + 0.3, 0]); });
  inst(new THREE.BoxGeometry(1, 1, 1), std(0xffffff, 0.9, { map: canvasTex(128, function (g, S) { g.fillStyle = '#9a7a4e'; g.fillRect(0, 0, S, S); g.strokeStyle = '#6a5232'; g.lineWidth = 3; g.strokeRect(3, 3, S - 6, S - 6); g.fillStyle = '#c9b48a'; g.fillRect(0, 54, S, 20); g.fillStyle = '#3a2c1a'; g.font = 'bold 16px Arial'; g.fillText('FRAGILE', 30, 38); E.grime(g, S, S, 1.2); }) }), crates);
  boxes.push({ x1: 22.1, x2: 24.7, z1: 121.3, z2: 124.6 });
  // posters, ceiling lights (two are dead for good; power brings the others back, flickering)
  [[14.6, Z2 - 0.315, PI, ["DOTTIE'S", 'DINO DAY', 'EVERY SATURDAY'], '#254a30', '#e2b93b'], [22.6, Z2 - 0.315, PI, ['PHOTO WITH', 'A REAL REX', '$5'], '#8d1f18', '#f1ecdd']].forEach(function (p) {
    var m = mesh(new THREE.PlaneGeometry(0.9, 1.25), std(0xffffff, 0.85, { map: textTex(p[3], 256, 356, p[4], p[5], p[5]) }), p[0], 1.75, p[1]); m.rotation.y = p[2];
  });
  E.shopTubes = [];
  [[14.5, 124.5, 0], [14.5, 131.5, 1], [19, 128, 2], [22.6, 128.6, 3]].forEach(function (f) {
    var G = new THREE.Group(); G.position.set(f[0], H - 0.08, f[1]); if (f[2] === 1) { G.rotation.x = 0.22; G.position.y -= 0.14; } scene.add(G);
    box(0.24, 0.07, 1.4, std(0xa8a69c, 0.7), 0, 0, 0, G); var tm2 = basic(0x1c1c1a); box(0.2, 0.02, 1.3, tm2, 0, -0.045, 0, G).userData.noCast = true;
    if (f[2] === 1) cyl(0.004, 0.004, 0.3, dark, 0, 0.14, 0.7, G, 3); else E.shopTubes.push(tm2);
  });
  E.shopGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,244,214,.55)', 'rgba(255,236,190,.12)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  E.shopGlow.position.set(X1 + 0.1, 1.7, 128); E.shopGlow.scale.set(11, 4, 1); scene.add(dyn(E.shopGlow));
  // leaves and paper blown in at the door, glass under the windows
  var bits = []; for (i = 0; i < 46; i++) bits.push([11.6 + Math.pow(srand(), 2) * 5, 0.048, 123 + srand() * 10, 1, 1, 1, -PI / 2, 0, srand() * 6]);
  inst(new THREE.PlaneGeometry(0.1, 0.06), std(0x5a4424, 1, { side: THREE.DoubleSide }), bits).userData.noCast = true;

  // ---------- generator shed ----------
  var SX1 = -22, SX2 = -16, SZ1 = 124, SZ2 = 130, SH = 2.7, tin = std(0xffffff, 0.75, { metalness: 0.35, map: canvasTex(128, function (g, S) { for (var q = 0; q < 16; q++) { var gr = g.createLinearGradient(q * 8, 0, q * 8 + 8, 0); gr.addColorStop(0, '#3d4a42'); gr.addColorStop(0.5, '#6f7d72'); gr.addColorStop(1, '#34403a'); g.fillStyle = gr; g.fillRect(q * 8, 0, 8, S); } E.streaks(g, S, S, 26, 'rgba(110,60,24,.9)', S); blotch(g, S, ['#6a3c1e', '#2a2018'], 14, 6, 30, 0.5); E.grime(g, S, S, 1); }, 3, 1) });
  wallBox(SX1, SX1 + 0.16, SZ1, SZ2, 0, SH, tin); wallBox(SX1, SX2, SZ1, SZ1 + 0.16, 0, SH, tin); wallBox(SX1, SX2, SZ2 - 0.16, SZ2, 0, SH, tin);
  wallBox(SX2 - 0.16, SX2, SZ1, 126.4, 0, SH, tin); wallBox(SX2 - 0.16, SX2, 127.6, SZ2, 0, SH, tin); wallBox(SX2 - 0.16, SX2, 126.4, 127.6, 2.1, SH, tin, false);
  box(6.3, 0.14, 6.3, EM.stone, -19, 0.0, 127).userData.noCast = true;
  var rf = box(6.8, 0.07, 6.8, tin, -19, SH + 0.2, 127); rf.rotation.z = 0.07;
  var srf = flat(5.7, 5.7, std(0x1d1e1c, 1), -19, SH - 0.02, 127); srf.rotation.x = PI / 2;
  flat(5.68, 5.68, rt(M.concrete, 2, 2), -19, 0.075, 127);
  mesh(new THREE.PlaneGeometry(1.5, 0.5), std(0xffffff, 0.8, { map: textTex(['MAINTENANCE', 'AUTHORISED STAFF ONLY'], 384, 128, '#d8cfae', '#254a30', '#254a30') }), SX2 + 0.012, 2.38, 127).rotation.y = PI / 2;
  mesh(new THREE.PlaneGeometry(0.6, 0.6), std(0xffffff, 0.8, { map: canvasTex(128, function (g, S) { g.fillStyle = '#e2b93b'; g.fillRect(0, 0, S, S); g.strokeStyle = '#17140e'; g.lineWidth = 7; g.beginPath(); g.moveTo(64, 12); g.lineTo(118, 108); g.lineTo(10, 108); g.closePath(); g.stroke(); g.fillStyle = '#17140e'; g.beginPath(); g.moveTo(70, 34); g.lineTo(50, 70); g.lineTo(64, 70); g.lineTo(56, 98); g.lineTo(80, 60); g.lineTo(66, 60); g.closePath(); g.fill(); E.grime(g, S, S, 1.2); E.chips(g, S, S, 8, '#6a5a2a'); }) }), SX2 + 0.012, 1.5, 128.6).rotation.y = PI / 2;
  // the door: a steel leaf on two hinges that swings into the shed
  E.shedDoor = dyn(new THREE.Group()); E.shedDoor.position.set(SX2 - 0.08, 0, 126.42); scene.add(E.shedDoor);
  box(0.05, 2.05, 1.16, rt(EM.green, 1, 2), 0, 1.04, 0.58, E.shedDoor); box(0.07, 0.1, 1.16, EM.rustSteel, 0, 1.0, 0.58, E.shedDoor);
  [0.4, 1.7].forEach(function (y) { cyl(0.025, 0.025, 0.16, EM.rustSteel, 0, y, 0, E.shedDoor, 8); });
  box(0.12, 0.03, 0.14, EM.steel, 0.05, 1.02, 1.05, E.shedDoor); box(0.12, 0.03, 0.14, EM.steel, -0.05, 1.02, 1.05, E.shedDoor);
  W.shedDoorBox = { x1: SX2 - 0.16, x2: SX2, z1: 126.4, z2: 127.6, solid: true }; boxes.push(W.shedDoorBox);
  E.shedSpot = { x: SX2 + 0.9, z: 127 };
  // generator set against the west wall
  var GEN = new THREE.Group(); GEN.position.set(-20.95, 0, 127.4); scene.add(GEN);
  var genGreen = std(0xffffff, 0.6, { metalness: 0.3, map: canvasTex(128, function (g, S) { g.fillStyle = '#31513a'; g.fillRect(0, 0, S, S); E.chips(g, S, S, 22, '#1d1f1a'); E.chips(g, S, S, 10, '#6a3c20'); E.streaks(g, S, S, 12, 'rgba(20,16,10,.9)', S); E.grime(g, S, S, 1); }), bumpMap: bump(2), bumpScale: 0.012 });
  box(1.25, 0.12, 2.5, EM.rustSteel, 0, 0.06, 0, GEN); box(1.1, 1.2, 2.3, genGreen, 0, 0.72, 0, GEN); box(1.14, 0.05, 2.34, EM.rustSteel, 0, 1.34, 0, GEN);
  var louv = []; for (i = 0; i < 9; i++) louv.push([0.555, 0.5 + i * 0.07, -0.55, 1, 1, 1, 0, 0, 0.5]); inst(new THREE.BoxGeometry(0.02, 0.05, 0.8), EM.rustSteel, louv, GEN);
  cyl(0.06, 0.06, 1.5, EM.rustSteel, -0.2, 2.05, -0.8, GEN, 10); cyl(0.09, 0.09, 0.3, EM.rustSteel, -0.2, 1.5, -0.8, GEN, 10);          // exhaust up through the roof
  E.genShake = dyn(new THREE.Group()); GEN.add(E.genShake);                                                                           // the parts that tremble when it runs
  var capG = new THREE.Group(); capG.position.set(0.25, 1.37, 0.85); E.genShake.add(capG); cyl(0.07, 0.07, 0.05, std(0xa8231c, 0.5), 0, 0.025, 0, capG, 12); E.genCap = capG;
  // its panel: fuel gauge, hour meter, lamp, start lever
  var PN = new THREE.Group(); PN.position.set(0.56, 1.0, 0.45); GEN.add(PN);
  box(0.03, 0.5, 0.8, std(0x202326, 0.6, { metalness: 0.4 }), 0, 0, 0, PN);
  mesh(new THREE.CircleGeometry(0.09, 20), std(0xffffff, 0.5, { map: canvasTex(128, function (g, S) { g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, S, S); g.strokeStyle = '#17140e'; g.lineWidth = 3; g.beginPath(); g.arc(64, 76, 44, PI * 1.15, PI * 1.85); g.stroke(); g.strokeStyle = '#a8231c'; g.lineWidth = 6; g.beginPath(); g.arc(64, 76, 44, PI * 1.15, PI * 1.3); g.stroke(); g.fillStyle = '#17140e'; g.font = 'bold 18px Arial'; g.fillText('E', 20, 66); g.fillText('F', 98, 66); g.font = 'bold 12px Arial'; g.fillText('FUEL', 50, 104); E.grime(g, S, S, 0.6); }) }), 0.017, 0.1, -0.22, PN).rotation.y = PI / 2;
  E.genNeedle = dyn(new THREE.Group()); E.genNeedle.position.set(0.02, 0.085, -0.22); PN.add(E.genNeedle); box(0.004, 0.07, 0.006, std(0xa8231c, 0.5), 0, 0.035, 0, E.genNeedle);
  E.genLamp = glow(0x1a0505); mesh(new THREE.SphereGeometry(0.022, 10, 8), E.genLamp, 0.02, 0.12, 0.02, PN);
  mesh(new THREE.PlaneGeometry(0.2, 0.06), std(0xffffff, 0.6, { map: textTex(['RUN'], 128, 40, '#202326', '#d7dadc', null, false) }), 0.017, 0.06, 0.02, PN).rotation.y = PI / 2;
  E.genLever = dyn(new THREE.Group()); E.genLever.position.set(0.03, -0.02, 0.25); PN.add(E.genLever);
  box(0.02, 0.26, 0.03, EM.steel, 0.02, 0.13, 0, E.genLever); mesh(new THREE.SphereGeometry(0.035, 10, 8), std(0xa8231c, 0.45), 0.02, 0.27, 0, E.genLever);
  mesh(new THREE.PlaneGeometry(0.22, 0.06), std(0xffffff, 0.6, { map: textTex(['START'], 128, 36, '#e2b93b', '#17140e', null, false) }), 0.017, -0.16, 0.25, PN).rotation.y = PI / 2;
  E.genPlate = livePanel(0.46, 0.24, 384, 200, 0, 0, 0, 0, GEN); E.genPlate.mesh.position.set(0.556, 0.52, 0.5); E.genPlate.mesh.rotation.y = PI / 2;
  E.genNote = livePanel(0.26, 0.2, 256, 196, 0, 0, 0, 0, GEN); E.genNote.mesh.position.set(0.558, 1.12, -0.55); E.genNote.mesh.rotation.set(0, PI / 2, 0.06);
  boxes.push({ x1: -21.6, x2: -20.35, z1: 126.15, z2: 128.65 });
  E.genSpot = { x: -19.45, z: 127.85 };
  // distribution board on the north wall: six breakers
  var BD = new THREE.Group(); BD.position.set(-19.0, 1.5, SZ1 + 0.16); scene.add(BD);
  box(1.3, 1.0, 0.14, std(0x596268, 0.6, { metalness: 0.5, map: metalTex }), 0, 0, 0.07, BD); box(1.36, 0.05, 0.18, EM.rustSteel, 0, 0.52, 0.09, BD);
  var bdoor = box(0.02, 1.0, 0.66, std(0x596268, 0.6, { metalness: 0.5, map: metalTex }), 0.66, 0, 0.44, BD);                          // its cover hangs open
  cyl(0.02, 0.02, 1.2, EM.steel, -0.4, -1.1, 0.05, BD, 6); cyl(0.02, 0.02, 0.7, EM.steel, 0.3, 0.85, 0.05, BD, 6);
  E.brk = []; E.brkLamps = []; E.brkLabels = [];
  for (i = 0; i < 6; i++) {
    var bx2 = -0.5 + (i % 3) * 0.4, by2 = 0.24 - Math.floor(i / 3) * 0.46;
    box(0.2, 0.2, 0.03, dark, bx2, by2, 0.155, BD);
    var hd = dyn(new THREE.Group()); hd.position.set(bx2, by2, 0.17); BD.add(hd); box(0.05, 0.1, 0.05, std(0xd8d2c2, 0.5), 0, 0.04, 0.02, hd); E.brk.push(hd);
    var bl = glow(0x1a0505); mesh(new THREE.CircleGeometry(0.014, 10), bl, bx2 + 0.075, by2 + 0.075, 0.172, BD); E.brkLamps.push(bl);
    var lab = livePanel(0.34, 0.11, 256, 82, bx2, by2 - 0.165, 0.1415, 0, BD); E.brkLabels.push(lab);
  }
  E.boardSpot = { x: -19.0, z: 125.25 };
  // odds and ends: fuel drum, shelf of tools, a hanging bulb
  cyl(0.29, 0.29, 0.88, std(0x7a2a22, 0.6, { map: rustTex }), -21.2, 0.52, 129.2, null, 16); circles.push({ x: -21.2, z: 129.2, r: 0.36 });
  box(2.6, 0.04, 0.4, M.wood, -19.2, 1.2, 129.62); box(2.6, 0.04, 0.4, M.wood, -19.2, 1.75, 129.62); [-20.4, -18.0].forEach(function (x) { box(0.05, 1.8, 0.36, EM.rustSteel, x, 0.9, 129.62); });
  var junk = []; for (i = 0; i < 9; i++) junk.push([-20.2 + i * 0.26, (i % 2 ? 1.83 : 1.28) + 0.03, 129.6, 0.12 + (i % 3) * 0.05, 0.12 + (i % 4) * 0.04, 0.16, 0, i, 0]); inst(new THREE.BoxGeometry(1, 1, 1), EM.rustSteel, junk);
  boxes.push({ x1: -20.5, x2: -17.9, z1: 129.4, z2: 129.84 });
  cyl(0.004, 0.004, 0.42, dark, -19, SH - 0.22, 127, null, 3); E.shedBulb = basic(0x14110a); mesh(new THREE.SphereGeometry(0.05, 10, 8), E.shedBulb, -19, SH - 0.46, 127).userData.noCast = true;

  // ---------- maintenance buggy by the service gate, with the fuel can on its deck ----------
  var BG = new THREE.Group(); BG.position.set(-12.2, 0, 120.4); BG.rotation.y = 0.35; scene.add(BG);
  var bgMat = std(0xffffff, 0.6, { map: canvasTex(64, function (g, S) { g.fillStyle = '#c9b36a'; g.fillRect(0, 0, S, S); E.chips(g, S, S, 14, '#5a4a2a'); E.grime(g, S, S, 1.2); }) });
  box(1.2, 0.2, 2.3, EM.rustSteel, 0, 0.38, 0, BG); box(1.2, 0.34, 0.7, bgMat, 0, 0.62, 0.8, BG); box(1.2, 0.08, 1.0, bgMat, 0, 0.5, -0.65, BG); box(1.1, 0.42, 0.1, bgMat, 0, 0.75, -0.1, BG); box(1.1, 0.1, 0.5, dark, 0, 0.6, 0.18, BG);
  [-0.55, 0.55].forEach(function (x) { box(0.04, 1.1, 0.04, EM.rustSteel, x, 1.25, 0.45, BG); box(0.04, 1.1, 0.04, EM.rustSteel, x, 1.25, -0.15, BG); }); box(1.2, 0.04, 0.9, bgMat, 0, 1.8, 0.15, BG);
  [[-0.62, 0.8], [0.62, 0.8], [-0.62, -0.75], [0.62, -0.75]].forEach(function (w, n) { var wh = cyl(0.22, 0.22, 0.16, EM.rubber, w[0], n === 1 ? 0.17 : 0.22, w[1], BG, 14); wh.rotation.z = PI / 2; });
  cyl(0.015, 0.015, 0.5, dark, -0.28, 0.95, 0.5, BG, 6).rotation.x = -0.5; mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 14), dark, -0.28, 1.17, 0.36, BG).rotation.x = 1.05;
  circles.push({ x: -12.2, z: 120.4, r: 1.25 });
  E.canMat = std(0xffffff, 0.55, { map: canvasTex(64, function (g, S) { g.fillStyle = '#b3271c'; g.fillRect(0, 0, S, S); g.fillStyle = '#e2b93b'; g.fillRect(8, 26, 48, 14); g.fillStyle = '#17140e'; g.font = 'bold 11px Arial'; g.fillText('DIESEL', 12, 37); E.chips(g, S, S, 8, '#5a1a12'); E.grime(g, S, S, 0.8); }), bumpMap: bump(2), bumpScale: 0.01 });
  E.buildCan = function (parent) {
    var c = new THREE.Group(); box(0.16, 0.3, 0.3, E.canMat, 0, 0.15, 0, c); box(0.14, 0.05, 0.2, E.canMat, 0, 0.32, -0.02, c); box(0.04, 0.03, 0.16, dark, 0, 0.37, -0.02, c);
    cyl(0.025, 0.03, 0.07, dark, 0, 0.33, 0.13, c, 8).rotation.x = 0.7; (parent || scene).add(c); return c;
  };
  E.can = dyn(E.buildCan(BG)); E.can.position.set(0.2, 0.54, -0.7); E.can.rotation.y = 0.5;
  E.canSpot = (function () { var v = new THREE.Vector3(0.2, 0, -0.7).applyAxisAngle(THREE.Object3D.DefaultUp, 0.35); return { x: -12.2 + v.x, z: 120.4 + v.z }; })();
  E.canGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,90,60,.5)', 'rgba(255,60,30,.12)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
  E.canGlow.position.set(E.canSpot.x, 0.75, E.canSpot.z); E.canGlow.scale.set(0.9, 0.9, 1); scene.add(dyn(E.canGlow));

  // ---------- printed things that change from game to game ----------
  var CIRCUITS = ['GIFT SHOP', 'TICKET LANES', 'PLAZA LAMPS', 'FOUNTAIN PUMP', 'CAROUSEL', 'FREEZERS'];
  E.CIRCUITS = CIRCUITS;
  function paper(P2, bg) { var g = P2.g, w = P2.canvas.width, h = P2.canvas.height; g.fillStyle = bg; g.fillRect(0, 0, w, h); return g; }
  E.refresh = function () {
    var N = P.ent, g, w, h, n;
    // generator rating plate and the note taped beside it
    g = paper(E.genPlate, '#b9bcb6'); g.fillStyle = '#17140e'; g.textAlign = 'center'; g.font = 'bold 30px Arial, sans-serif'; g.fillText('DIESEL GENERATING SET', 192, 40);
    g.font = '22px Arial, sans-serif'; g.fillText('RATED OUTPUT (DERATED 2004)', 192, 84); g.font = 'bold 64px Arial, sans-serif'; g.fillStyle = '#8d1f18'; g.fillText('MAX ' + N.max + ' kW', 192, 152);
    g.fillStyle = '#17140e'; g.font = '18px Arial, sans-serif'; g.fillText('OVERLOAD WILL STALL THE SET', 192, 184); E.grime(g, 384, 200, 0.8); E.genPlate.tex.needsUpdate = true;
    g = paper(E.genNote, '#efe7b6'); g.fillStyle = '#1c2a6a'; g.textAlign = 'left'; g.font = 'italic 26px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
    ['Tank is DRY.', 'Spare can is on', 'the buggy by the', 'service gate.   — M.'].forEach(function (t, q) { g.fillText(t, 16, 44 + q * 40); }); E.genNote.tex.needsUpdate = true;
    for (n = 0; n < 6; n++) {
      g = paper(E.brkLabels[n], '#d8d2c2'); g.fillStyle = '#17140e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px Arial, sans-serif'; g.fillText(CIRCUITS[N.order[n]], 128, 26, 244);
      g.fillStyle = '#8d1f18'; g.font = 'bold 30px Arial, sans-serif'; g.fillText(N.kw[N.order[n]] + ' kW', 128, 60); E.grime(g, 256, 82, 0.7); E.brkLabels[n].tex.needsUpdate = true;
    }
    // employee of the month
    g = paper(E.eom, '#efe9d6'); w = 320; h = 412; g.fillStyle = '#254a30'; g.fillRect(0, 0, w, 62); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.font = 'bold 25px ' + FONT; g.fillText('EMPLOYEE OF THE MONTH', w / 2, 40, w - 16);
    g.fillStyle = '#7fa8b8'; g.fillRect(40, 80, 240, 210); g.fillStyle = '#4c6a44'; g.fillRect(40, 220, 240, 70);
    g.fillStyle = '#2a2420'; g.beginPath(); g.arc(120, 150, 24, 0, 7); g.fill(); g.fillRect(96, 172, 48, 90);                                             // the keeper
    g.fillStyle = '#56633c'; g.beginPath(); g.ellipse(214, 214, 44, 22, -0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(170, 176, 22, 11, 0.5, 0, 7); g.fill(); g.fillRect(200, 226, 8, 44); g.fillRect(226, 226, 8, 44);   // and her raptor
    g.fillStyle = '#1c1a16'; g.font = 'bold 26px ' + FONT; g.fillText(N.keeper.toUpperCase(), w / 2, 326); g.font = '19px ' + FONT; g.fillText('Head Keeper — 14 years', w / 2, 352);
    g.fillStyle = '#1c2a6a'; g.font = 'italic 21px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'; g.fillText('"Me and my girl ' + N.pet + '"', w / 2, 388, w - 20);
    E.grime(g, w, h, 0.8); E.eom.tex.needsUpdate = true;
    // keepers' whiteboard: the animal register
    g = paper(E.reg, '#e8ebe6'); w = 640; g.fillStyle = '#17140e'; g.textAlign = 'left'; g.font = 'bold 34px ' + FONT; g.fillText('ANIMAL REGISTER', 24, 46); g.font = '18px ' + FONT; g.fillStyle = '#8d1f18'; g.fillText('tags must match ZooNet — check before every shift', 330, 44);
    g.strokeStyle = '#17140e'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 60); g.lineTo(620, 60); g.stroke();
    g.font = 'bold 20px ' + FONT; g.fillStyle = '#254a30'; g.fillText('NAME', 30, 90); g.fillText('SPECIES', 200, 90); g.fillText('ENCLOSURE', 380, 90); g.fillText('TAG', 550, 90);
    N.animals.forEach(function (a, q) {
      var y = 132 + q * 44; g.fillStyle = q % 2 ? '#1c2a6a' : '#17140e'; g.font = '27px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
      g.fillText(a[0], 30, y); g.font = '21px ' + FONT; g.fillText(a[1], 200, y); g.fillText(a[2], 380, y); g.font = 'bold 27px ' + FONT; g.fillText(a[3], 546, y);
    });
    g.fillStyle = 'rgba(120,130,125,.25)'; g.fillRect(380, 220, 190, 70); E.grime(g, 640, 432, 0.5); E.reg.tex.needsUpdate = true;
    E.drawScreen();
  };
  // what the monitor shows from across the room (the working interface is the ZooNet overlay)
  E.drawScreen = function () {
    var g = E.screen.g, on = P.pow0, N = P.ent;
    g.fillStyle = on ? '#04140a' : '#050606'; g.fillRect(0, 0, 512, 384);
    if (on) {
      g.fillStyle = '#39d86a'; g.textAlign = 'center'; g.font = 'bold 44px Consolas, "Courier New", monospace'; g.fillText('ZOONET', 256, 96);
      g.font = '22px Consolas, "Courier New", monospace'; g.fillText('FAMILY ZOO STAFF NETWORK', 256, 134);
      g.fillStyle = N.login ? '#39d86a' : '#e2b93b'; g.font = 'bold 26px Consolas, "Courier New", monospace';
      g.fillText(P.turn ? 'TICKET LANES: OPEN' : N.login ? 'SESSION: ' + N.user : 'LOG IN TO CONTINUE', 256, 230); g.fillText('_', 256, 280);
      g.fillStyle = 'rgba(0,0,0,.28)'; for (var q = 0; q < 384; q += 4) g.fillRect(0, q, 512, 2);
    }
    E.screen.tex.needsUpdate = true;
  };

  // ---------- pose everything that follows the puzzle state ----------
  var doorA = 0, leverA = 0, runT = 0;
  E.shopStep = function (dt, instant) {
    var N = P.ent, n, run = !!N.run, t = playTime;
    doorA = instant ? (N.door ? 1 : 0) : doorA + clamp((N.door ? 1 : 0) - doorA, -dt * 1.1, dt * 1.1);
    E.shedDoor.rotation.y = -easeIO(doorA) * 1.75; W.shedDoorBox.off = doorA > 0.5;
    E.can.visible = N.fuel === 0; E.canGlow.visible = N.fuel === 0; E.canGlow.material.opacity = 0.3 + 0.2 * Math.sin(t * 2.6);
    E.genNeedle.rotation.x = lerp(0.95, -0.95, clamp(N.fuel === 2 ? 1 : N.pour || 0, 0, 1));
    E.genCap.rotation.z = N.pour > 0 && N.fuel === 1 ? -1.9 : 0; E.genCap.position.x = N.pour > 0 && N.fuel === 1 ? 0.33 : 0.25;
    leverA = instant ? (run ? 1 : 0) : damp(leverA, Math.max(run ? 1 : 0, N.crank || 0), 12, dt); E.genLever.rotation.z = -leverA * 1.2;
    runT = run ? runT + dt : 0;
    E.genShake.position.set(run ? Math.sin(t * 61) * 0.0025 : 0, run ? Math.sin(t * 47) * 0.002 : 0, 0);
    E.genLamp.color.setHex(run ? 0x35ff8a : N.stall > 0 ? (Math.sin(t * 20) > 0 ? 0xff3020 : 0x1a0505) : 0x1a0505);
    for (n = 0; n < 6; n++) { var on = N.brk[n]; E.brk[n].rotation.x = on ? -0.55 : 0.55; E.brkLamps[n].color.setHex(run && on ? 0x35ff8a : on ? 0x3a2a05 : 0x1a0505); }
    // light: the shed bulb, the shop tubes (one of them never settles), the monitor, the plaza lamps
    var L = E.lights, flick = run ? (Math.sin(t * 23) + Math.sin(t * 7.3) > -1.5 ? 1 : 0.25) : 0, warm = clamp(runT / 1.6, 0, 1);
    if (!E.introLight) { L.shed.intensity = run ? 1.1 * warm : 0; }
    E.shedBulb.color.setHex(run ? 0xffe2b0 : 0x14110a);
    var shopOn = P.pow0 ? warm : 0; L.shop.intensity = shopOn * (0.75 + 0.25 * flick);
    for (n = 0; n < E.shopTubes.length; n++) E.shopTubes[n].color.setHex(shopOn > 0.1 ? (n === 1 && flick < 1 ? 0x55534a : 0xfff4d6) : 0x1c1c1a);
    E.shopGlow.material.opacity = shopOn * 0.5;
    L.term.intensity = P.pow0 ? 0.55 * warm : 0; E.pcLed.color.setHex(P.pow0 ? 0x35ff8a : 0x0a1a0a);
    var lampsOn = run && N.brk[N.order.indexOf(2)] ? warm : 0; L.plaza.intensity = lampsOn * 1.25;
    for (n = 0; n < E.plazaBulbs.length; n++) E.plazaBulbs[n].color.setHex(lampsOn > 0.1 ? (n === 2 && flick < 1 ? 0x4a4030 : 0xffe2b0) : 0x16130c);
    if (E.screenOn !== !!P.pow0 || E.screenTurn !== !!P.turn || E.screenLog !== !!N.login) { E.screenOn = !!P.pow0; E.screenTurn = !!P.turn; E.screenLog = !!N.login; E.drawScreen(); }
  };
})();
