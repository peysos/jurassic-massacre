/* Jurassic Massacre — the two buildings on the entrance plaza.
   The gift shop is the first safe room: a looted souvenir shop with a staff computer behind the counter and the Ranger Net
   check-in panel on its north wall.  The maintenance shed across the plaza feeds it (the yellow cable protector on the
   ground joins the two): a diesel set, the distribution board whose breakers you throw by hand, a workbench.  The park's
   utility buggy is parked by the service gate with the spare diesel can in its bed.
   Walls use world-space texture coordinates (worldUV), so one texture runs unbroken across every pier, sill and lintel.
   Everything that depends on puzzle state is posed in Entrance.shopStep(); the printed clues are redrawn in Entrance.refresh(). */
'use strict';

(function buildShop() {
  var E = Entrance, EM = E.M, inst = E.inst, rt = E.rt, flat = E.flat, FONT = E.FONT, glow = WB.glow, i;
  var X1 = 11, X2 = 25, Z1 = 121, Z2 = 135, H = 3.4, DZ = 128;             // footprint, wall height, centre of the doorway
  function rep1(mat) { var m = mat.clone(); ['map', 'bumpMap', 'normalMap'].forEach(function (k) { if (mat[k]) { m[k] = mat[k].clone(); m[k].repeat.set(1, 1); m[k].needsUpdate = true; } }); return m; }
  // the shop's render: cream paint over block, flaking, streaked from the parapet down, green with damp at the foot
  var wall = std(0xffffff, 0.86, { map: canvasTex(512, function (g, S) {
    g.fillStyle = '#d2c9ab'; g.fillRect(0, 0, S, S); g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#bdb393', '#e0d8bd', '#aaa084', '#c8be9e'], 14000, 2.4)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#b2a888', '#e4dcc4', '#9c9478'], 30, 20, 90, 0.25);
    g.strokeStyle = 'rgba(120,112,92,.35)'; g.lineWidth = 1.2; for (var r = 1; r < 6; r++) { g.beginPath(); g.moveTo(0, r * S / 6); g.lineTo(S, r * S / 6); g.stroke(); }   // block courses under the paint
    g.globalAlpha = 0.55; chips(g, S, S, 16, '#a69d80'); chips(g, S, S, 5, '#7a7260'); g.globalAlpha = 1;
    streaks(g, S, S, 26, 'rgba(60,52,30,.5)', S * 0.9); grime(g, S, S, 0.9);
  }), bumpMap: bump(3), bumpScale: 0.014 });
  var brickW = rep1(EM.brick), trim = EM.green, dark = std(0x16171a, 0.85);
  function wallBox(x1, x2, z1, z2, y1, y2, mat, collide, tile) {
    var m = box(x2 - x1, y2 - y1, z2 - z1, mat || wall, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); worldUV(m, tile || (mat === brickW ? 0.9 : 2.6));
    if (collide !== false) boxes.push({ x1: x1, x2: x2, z1: z1, z2: z2, solid: true });
    return m;
  }

  // ---------- shell ----------
  wallBox(X1, X2, Z1, Z1 + 0.3, 0, H); wallBox(X1, X2, Z2 - 0.3, Z2, 0, H); wallBox(X2 - 0.3, X2, Z1 + 0.3, Z2 - 0.3, 0, H);
  // the front: piers, a brick dado and sills under the two display windows, lintels over them and the doorway
  [[Z1 + 0.3, 122.4], [126.4, DZ - 0.65], [DZ + 0.65, 129.6], [133.6, Z2 - 0.3]].forEach(function (p) { wallBox(X1, X1 + 0.3, p[0], p[1], 0, H, null, false); });
  [[122.4, 126.4], [129.6, 133.6]].forEach(function (w) {
    wallBox(X1, X1 + 0.3, w[0], w[1], 0, 0.8, brickW, false); wallBox(X1, X1 + 0.3, w[0], w[1], 2.6, H, null, false);
    var sill = box(0.42, 0.07, 4.12, EM.stone, X1 + 0.13, 0.835, (w[0] + w[1]) / 2); worldUV(sill, 1);
    box(0.36, 0.06, 4.06, trim, X1 + 0.15, 2.57, (w[0] + w[1]) / 2);                                                     // the window head
    var gp = mesh(new THREE.PlaneGeometry(4, 1.72), EM.glassDirty, X1 + 0.15, 1.71, (w[0] + w[1]) / 2); gp.rotation.y = PI / 2; gp.material.side = THREE.DoubleSide; gp.userData.noCast = true;
    [w[0] + 0.02, w[0] + 1.34, w[0] + 2.66, w[1] - 0.02].forEach(function (z) { box(0.07, 1.74, 0.06, trim, X1 + 0.15, 1.71, z); });
    box(0.07, 0.05, 4.0, trim, X1 + 0.15, 0.88, (w[0] + w[1]) / 2);
    // sun-bleached window lettering, on the inside of the glass
    var dec = mesh(new THREE.PlaneGeometry(3.4, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.55, map: canvasTex(512, function (g, S, HH) { g.clearRect(0, 0, S, HH); g.fillStyle = '#e9e2d0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 44px ' + FONT; g.fillText(w[0] < 125 ? 'SOUVENIRS · TOYS · GIFTS' : 'COLD DRINKS · FILM · ICE CREAM', S / 2, HH / 2, S - 20); g.globalCompositeOperation = 'destination-out'; for (var q = 0; q < 60; q++) { g.beginPath(); g.arc(Math.random() * S, Math.random() * HH, 1 + Math.random() * 6, 0, 7); g.fill(); } }, 1, 1, true, 76) }), X1 + 0.165, 2.3, (w[0] + w[1]) / 2);
    dec.rotation.y = -PI / 2; dec.userData.noCast = true;
  });
  wallBox(X1, X1 + 0.3, DZ - 0.65, DZ + 0.65, 2.2, H, null, false);
  boxes.push({ x1: X1, x2: X1 + 0.3, z1: Z1, z2: DZ - 0.65, solid: true }); boxes.push({ x1: X1, x2: X1 + 0.3, z1: DZ + 0.65, z2: Z2, solid: true });
  box(14.6, 0.24, 14.6, dark, 18, H + 0.12, 128); box(14.9, 0.5, 0.2, trim, 18, H + 0.3, Z1 - 0.05); box(14.9, 0.5, 0.2, trim, 18, H + 0.3, Z2 + 0.05); box(0.2, 0.5, 14.9, trim, X2 + 0.05, H + 0.3, 128); box(0.2, 0.5, 14.9, trim, X1 - 0.05, H + 0.3, 128);
  [[X1 - 0.03, Z1 + 0.15], [X1 - 0.03, Z2 - 0.15]].forEach(function (c) { box(0.1, H, 0.1, EM.stone, c[0], H / 2, c[1]); });                                         // corner quoins
  // floor: worn vinyl tiles, cream and green, scuffed into paths
  var vinyl = std(0xffffff, 0.62, { map: canvasTex(512, function (g, S) {
    for (var a = 0; a < 8; a++) for (var b = 0; b < 8; b++) { g.fillStyle = (a + b) % 2 ? '#2f4a36' : '#c9c0a2'; g.fillRect(a * 64, b * 64, 64, 64); }
    g.strokeStyle = 'rgba(20,20,16,.6)'; g.lineWidth = 1.5; for (a = 0; a <= 8; a++) { g.beginPath(); g.moveTo(a * 64, 0); g.lineTo(a * 64, S); g.moveTo(0, a * 64); g.lineTo(S, a * 64); g.stroke(); }
    g.globalAlpha = 0.16; speckle('rgba(0,0,0,0)', ['#1e1c16', '#5a5444', '#8a826a'], 3000, 1.0)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#2a2418', '#3a3424', '#141410'], 30, 20, 90, 0.4); for (var q = 0; q < 40; q++) { g.strokeStyle = 'rgba(15,14,10,.4)'; g.lineWidth = 1; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 20); g.stroke(); }
  }), bumpMap: bump(4), bumpScale: 0.006 });
  var floor = flat(13.4, 13.4, vinyl, 18, 0.04, 128); worldUV(floor, 2.4);
  // ceiling: a suspended grid of fibre tiles, stained, two of them fallen out
  var ceilTex = canvasTex(256, function (g, S) {
    g.fillStyle = '#c9c4b2'; g.fillRect(0, 0, S, S); g.globalAlpha = 0.6; speckle('rgba(0,0,0,0)', ['#b5b09e', '#d8d3c0', '#9a9584'], 3000, 1.2)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#8a7a4a', '#6a5a3a', '#4a4a3a'], 6, 14, 60, 0.35);
    g.fillStyle = '#d8d6cc'; g.fillRect(0, 0, S, 5); g.fillRect(0, S / 2 - 2, S, 5); g.fillRect(0, 0, 5, S); g.fillRect(S / 2 - 2, 0, 5, S);
  });
  var ceil = flat(13.4, 13.4, std(0xffffff, 0.95, { map: ceilTex }), 18, H - 0.01, 128); ceil.rotation.x = PI / 2; worldUV(ceil, 1.2);
  [[15.0, 125.6], [20.4, 132.2]].forEach(function (c) { var hole = flat(0.58, 0.58, basic(0x070707), c[0], H - 0.012, c[1]); hole.rotation.x = PI / 2; var tl = box(0.6, 0.015, 0.6, std(0xbab5a2, 0.95, { map: ceilTex }), c[0] + 0.5, 0.06, c[1] + 0.4); tl.rotation.set(0.05, 0.6, 0.12); });
  // sign on the roof edge and the torn awning
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
    g.globalCompositeOperation = 'destination-out';
    for (q = 0; q < 16; q++) { g.beginPath(); g.arc(q * 32 + 16, HH + 8, 15, 0, 7); g.fill(); }
    [[150, 30, 34, 70], [330, 0, 26, 110], [420, 60, 60, 44]].forEach(function (r) { g.beginPath(); g.moveTo(r[0], r[1]); g.lineTo(r[0] + r[2], r[1] + 10); g.lineTo(r[0] + r[2] * 0.7, r[1] + r[3]); g.lineTo(r[0] - 8, r[1] + r[3] * 0.8); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  }, 1, 1, true, 128) }), X1 - 0.62, 2.62, DZ);
  awn.rotation.set(0, -PI / 2, 0); awn.rotation.order = 'YXZ'; awn.rotation.x = 0.95; awn.userData.noCast = true;
  (function sag(geo) { var p = geo.attributes.position; for (var q = 0; q < p.count; q++) p.setZ(q, Math.sin(p.getX(q) * 2.1) * 0.05 + (p.getY(q) < 0 ? Math.sin(p.getX(q) * 5) * 0.04 : 0)); geo.computeVertexNormals(); })(awn.geometry);
  [-5.9, 0, 5.9].forEach(function (o) { var arm = box(1.3, 0.035, 0.035, EM.iron, X1 - 0.62, 2.62, DZ + o); arm.rotation.z = 0.62; });

  /* ---------- the doorway: a steel frame set into the opening, and the door, forced long ago, standing open into the shop ----------
     The frame's jambs line the opening to the wall's full depth; the leaf hangs on the south jamb and is swung in to 95
     degrees, where it rests clear of the window and leaves the doorway free. */
  var DJ = 0.07, OW = 1.3 - 2 * DJ, DH = 2.12;
  [DZ - 0.65 + DJ / 2, DZ + 0.65 - DJ / 2].forEach(function (z) { box(0.32, DH + DJ, DJ, trim, X1 + 0.15, (DH + DJ) / 2, z); });
  box(0.32, DJ, 1.3, trim, X1 + 0.15, DH + DJ / 2, DZ); box(0.34, 0.03, 1.24, EM.stone, X1 + 0.15, 0.036, DZ);
  [DZ - 0.65, DZ + 0.65].forEach(function (z) { box(0.04, DH + 0.16, 0.1, trim, X1 - 0.01, (DH + 0.16) / 2, z); });                                     // the outside architrave
  box(0.04, 0.1, 1.5, trim, X1 - 0.01, DH + 0.13, DZ);
  var door = new THREE.Group(); door.position.set(X1 + 0.29, 0, DZ - 0.65 + DJ); door.rotation.y = PI / 2 + 0.1; scene.add(door);        // hinge at the inner edge of the south jamb
  var LW = OW - 0.01;
  box(0.045, DH - 0.02, 0.07, trim, 0, DH / 2, 0.035, door); box(0.045, DH - 0.02, 0.07, trim, 0, DH / 2, LW - 0.035, door);                       // stiles
  box(0.045, 0.1, LW, trim, 0, DH - 0.06, LW / 2, door); box(0.045, 0.3, LW, trim, 0, 0.16, LW / 2, door); box(0.045, 0.07, LW, trim, 0, 1.0, LW / 2, door);
  var dg = mesh(new THREE.PlaneGeometry(LW - 0.14, 0.96), EM.glassDirty, 0, 1.53, LW / 2, door); dg.rotation.y = PI / 2; dg.userData.noCast = true;
  box(0.1, 0.035, 0.035, EM.steel, 0.05, 1.05, LW - 0.12, door); box(0.1, 0.035, 0.035, EM.steel, -0.05, 1.05, LW - 0.12, door);                  // push bars
  [0.25, 1.85].forEach(function (y) { cyl(0.018, 0.018, 0.12, EM.rustSteel, 0.0, y, -0.005, door, 8); });
  mesh(new THREE.PlaneGeometry(0.46, 0.3), std(0xffffff, 0.8, { map: textTex(['SORRY', "WE'RE CLOSED"], 256, 160, '#a8231c', '#f1ecdd', '#f1ecdd') }), 0.026, 1.62, LW / 2, door).rotation.y = PI / 2;
  // the open leaf, seen in plan, runs from the hinge into the shop: keep people from walking through it
  boxes.push({ x1: X1 + 0.28, x2: X1 + 0.3 + LW * Math.cos(0.1) + 0.03, z1: DZ - 0.65 + DJ - 0.03 - LW * Math.sin(0.1), z2: DZ - 0.65 + DJ + 0.06 });

  // ---------- counter and the staff side ----------
  var counterTop = std(0x3a2c20, 0.45, { map: woodTex }), CX1 = 21.2, CX2 = 22.0;
  var counterFront = std(0xffffff, 0.7, { map: canvasTex(512, function (g, S, HH) {
    g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S, HH); g.fillStyle = '#d9ae35'; g.fillRect(0, 14, S, 6); g.fillRect(0, HH - 20, S, 6);
    g.fillStyle = '#ece3c4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 40px ' + FONT; g.fillText('THANK YOU FOR VISITING', S / 2, HH / 2 - 14, S - 44); g.font = 'bold 30px ' + FONT; g.fillStyle = '#d9ae35'; g.fillText('FAMILY ZOO', S / 2, HH / 2 + 26, S - 44);
    E.chips(g, S, HH, 30, '#141611'); E.chips(g, S, HH, 10, '#6a3c20'); E.grime(g, S, HH, 1.2); E.streaks(g, S, HH, 16, 'rgba(20,16,10,.8)', HH);
  }, 1, 1, true, 160) });
  wallBox(CX1, CX2, 125, 131.4, 0, 1.0, rt(EM.green, 3, 1)); box(1.06, 0.06, 6.6, counterTop, (CX1 + CX2) / 2, 1.03, 128.2); box(1.1, 0.03, 6.64, EM.steel, (CX1 + CX2) / 2, 1.0, 128.2);
  var cf = mesh(new THREE.PlaneGeometry(2.9, 0.82), counterFront, CX1 - 0.006, 0.52, 129.6); cf.rotation.y = -PI / 2;
  wallBox(CX2, X2 - 0.3, 125, 125.7, 0, 1.0, rt(EM.green, 2, 1)); box(2.9, 0.06, 0.9, counterTop, 23.35, 1.03, 125.35);
  var hatch = box(0.9, 0.05, 1.0, counterTop, CX2 - 0.42, 1.49, 131.58); hatch.rotation.x = -1.25;           // flip-up flap, hinged on the end of the counter and left raised
  [-0.3, 0.3].forEach(function (o) { box(0.1, 0.03, 0.06, EM.steel, CX2 - 0.42 + o, 1.07, 131.44); });
  // a glass display case set into the counter: a few things nobody took, on faded velvet
  box(0.7, 0.04, 2.0, std(0x3a1a1a, 1), CX1 + 0.4, 0.62, 126.3); var cg = mesh(new THREE.PlaneGeometry(2.0, 0.42), EM.glassDirty, CX1 - 0.01, 0.82, 126.3); cg.rotation.y = -PI / 2; cg.userData.noCast = true;
  [[CX1 + 0.3, 125.7], [CX1 + 0.45, 126.4], [CX1 + 0.3, 127.0]].forEach(function (p, n) { mesh(new THREE.SphereGeometry(0.045, 14, 10), std([0x9fd8e8, 0xd9ae35, 0xe9e2d0][n], 0.15, { metalness: n === 1 ? 0.8 : 0.1, transparent: n === 0, opacity: 0.6 }), p[0], 0.69, p[1]); cyl(0.04, 0.05, 0.035, dark, p[0], 0.657, p[1], null, 12); });   // snow globes, a medal, an egg
  // cash register: drawer hanging open, empty
  var reg = new THREE.Group(); reg.position.set(21.62, 1.06, 126.5); reg.rotation.y = 0.15; scene.add(reg);
  box(0.42, 0.16, 0.44, dark, 0, 0.08, 0, reg); box(0.4, 0.18, 0.3, dark, 0, 0.24, -0.06, reg).rotation.x = -0.35; box(0.3, 0.14, 0.03, basic(0x0b140d), 0, 0.42, -0.2, reg);
  box(0.36, 0.07, 0.36, std(0x2a2b2e, 0.6), 0.05, 0.035, 0.3, reg);
  // the staff computer: beige CRT, keyboard, mouse, tower under the counter
  var PC = new THREE.Group(); PC.position.set(21.56, 1.06, 128.2); scene.add(PC);
  var beige = std(0xb9b29c, 0.7, { map: canvasTex(64, function (g, S) { g.fillStyle = '#b9b29c'; g.fillRect(0, 0, S, S); blotch(g, S, ['#7d7662', '#8f8870'], 8, 6, 30, 0.4); }) });
  box(0.3, 0.05, 0.3, beige, 0, 0.025, 0, PC); cyl(0.05, 0.08, 0.06, beige, 0, 0.08, 0, PC, 10);
  box(0.42, 0.38, 0.44, beige, -0.02, 0.3, 0, PC); box(0.3, 0.3, 0.3, beige, -0.26, 0.3, 0, PC);
  box(0.02, 0.33, 0.4, dark, 0.2, 0.3, 0, PC);
  E.screen = livePanel(0.36, 0.27, 512, 384, 0, 0, 0, 0, PC); E.screen.mesh.position.set(0.212, 0.31, 0); E.screen.mesh.rotation.y = PI / 2;
  E.screen.mesh.material = basic(0xffffff, { map: E.screen.tex, fog: false });
  E.pcLed = glow(0x0a1a0a); mesh(new THREE.CircleGeometry(0.006, 8), E.pcLed, 0.211, 0.135, 0.15, PC).rotation.y = PI / 2;
  var kb = box(0.16, 0.025, 0.42, beige, 0.46, 0.012, 0, PC); kb.rotation.z = 0.06;
  mesh(new THREE.PlaneGeometry(0.4, 0.14), std(0xffffff, 0.7, { map: canvasTex(256, function (g, S, HH) { g.fillStyle = '#a39c86'; g.fillRect(0, 0, S, HH); for (var r = 0; r < 5; r++) for (var c = 0; c < 15; c++) { g.fillStyle = (r * 3 + c) % 11 === 0 ? '#8d8670' : '#cfc8b2'; g.fillRect(6 + c * 16.4, 5 + r * 16, 14, 13); } E.grime(g, S, HH, 0.9); }, 1, 1, true, 88) }), 0.46, 0.027, 0, PC).rotation.set(-PI / 2, 0, -PI / 2);
  box(0.1, 0.03, 0.06, beige, 0.44, 0.015, 0.33, PC);
  box(0.2, 0.44, 0.46, beige, 0.7, -0.83, 0.5, PC);
  E.pc = { x: 22.85, z: 128.2, sx: 21.775, sy: 1.37, sz: 128.2 };

  /* ---------- the Ranger Net check-in point (the save terminal) on the north wall ----------
     A slim wall kiosk the keepers badged in and out on: a dark housing edged in park green, a slanted hood with a light strip,
     a 15-inch screen behind scratched glass, a badge pad that glows when the panel is live, a keypad, a printed header and a
     cable conduit up into the ceiling.  Twelve years of dust, a crack across the glass, a strip of tape. */
  var TM = new THREE.Group(); TM.position.set(SAFE[0].tx, 0, Z1 + 0.3); scene.add(TM);
  var kioskShell = std(0x23282a, 0.55, { metalness: 0.45, map: canvasTex(128, function (g, S) { g.fillStyle = '#2a2f31'; g.fillRect(0, 0, S, S); for (var q = 0; q < 200; q++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.03 + Math.random() * 0.05) + ')'; var y = Math.random() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); } blotch(g, S, ['#4a4436', '#14161a'], 10, 6, 30, 0.4); }) });
  box(0.74, 1.24, 0.1, kioskShell, 0, 1.42, 0.05, TM);                                                          // back plate
  box(0.66, 1.02, 0.07, kioskShell, 0, 1.4, 0.135, TM);                                                         // the body
  [-1, 1].forEach(function (s2) { box(0.035, 1.24, 0.13, trim, s2 * 0.37, 1.42, 0.09, TM); });                  // green edging
  box(0.78, 0.035, 0.14, trim, 0, 0.8, 0.09, TM);
  var hood = box(0.8, 0.04, 0.26, kioskShell, 0, 2.06, 0.16, TM); hood.rotation.x = 0.28;
  var strip = basic(0x0a1a10, { fog: false }); E.kioskStrip = strip; box(0.62, 0.012, 0.02, strip, 0, 2.018, 0.27, TM).userData.noCast = true;        // the light strip under the hood
  // the screen, its bezel and the glass over it
  box(0.5, 0.38, 0.02, std(0x0e1012, 0.4, { metalness: 0.3 }), 0, 1.66, 0.176, TM);
  var scrTex = canvasTex(512, function (g, S, HH) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, HH); g.fillStyle = '#000'; g.globalAlpha = 0.86; g.fillRect(0, 0, S, HH); g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.font = 'bold 34px Consolas, "Courier New", monospace'; g.textAlign = 'left'; g.fillText('RANGER NET', 26, 52); g.font = '18px Consolas, monospace'; g.fillText('FAMILY ZOO · STAFF CHECK-IN', 26, 82);
    g.fillRect(26, 98, S - 52, 2); g.font = '22px Consolas, monospace'; g.fillText('STATION 01 · GIFT SHOP', 26, 140); g.fillText('PLACE BADGE ON THE PAD', 26, 180);
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(26, 214, S - 52, 54); g.font = 'bold 26px Consolas, monospace'; g.textAlign = 'center'; g.fillText('[ E ]  LOG POSITION', S / 2, 250);
    g.textAlign = 'left'; g.font = '16px Consolas, monospace'; g.fillText('LAST CHECK-IN  08/23 21:14  A. MERCER', 26, 300); g.fillText('SHELTER DOORS: NARROW · 1.26 M', 26, 326);
    g.fillStyle = 'rgba(0,0,0,.35)'; for (var q = 0; q < HH; q += 4) g.fillRect(0, q, S, 2);
  }, 1, 1, true, 360);
  W.termScr[0] = basic(0x551010, { map: scrTex, fog: false }); mesh(new THREE.PlaneGeometry(0.46, 0.33), W.termScr[0], 0, 1.66, 0.1875, TM);
  var crack = mesh(new THREE.PlaneGeometry(0.46, 0.33), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.6, map: canvasTex(256, function (g, S, HH) { g.clearRect(0, 0, S, HH); g.strokeStyle = 'rgba(220,235,235,.85)'; g.lineWidth = 1; var cx = S * 0.72, cy = HH * 0.3; for (var q = 0; q < 11; q++) { var a = q / 11 * 6.28 + Math.random() * 0.3, r2 = 30 + Math.random() * 120, x = cx, y = cy; g.beginPath(); g.moveTo(x, y); for (var k = 0; k < 5; k++) { x += Math.cos(a) * r2 / 5 + (Math.random() - 0.5) * 8; y += Math.sin(a) * r2 / 5 + (Math.random() - 0.5) * 8; g.lineTo(x, y); } g.stroke(); } blotch(g, S, ['#8a8270'], 8, 10, 40, 0.25); }, 1, 1, true, 184) }), 0, 1.66, 0.1895, TM);
  crack.userData.noCast = true;
  // header plate
  mesh(new THREE.PlaneGeometry(0.6, 0.1), std(0xffffff, 0.6, { map: textTex(['RANGER NET · EMPLOYEE CHECK-IN'], 512, 84, '#254a30', '#e2b93b', null, false) }), 0, 1.93, 0.1705, TM);
  // badge pad (glows when live), keypad, speaker grille, status lamps
  box(0.2, 0.16, 0.025, std(0x101214, 0.35, { metalness: 0.3 }), -0.14, 1.2, 0.18, TM);
  var padMat = basic(0x0a1a10, { fog: false }); E.kioskPad = padMat; mesh(new THREE.RingGeometry(0.045, 0.052, 32), padMat, -0.14, 1.2, 0.1935, TM).userData.noCast = true;
  mesh(new THREE.PlaneGeometry(0.16, 0.03), std(0xffffff, 0.6, { map: textTex(['BADGE'], 128, 30, '#101214', '#9aa0a4', null, false) }), -0.14, 1.11, 0.1935, TM);
  var keyMat = std(0x24282a, 0.55, { metalness: 0.3 }), keyGeo = new THREE.BoxGeometry(0.034, 0.028, 0.012);
  for (i = 0; i < 12; i++) mesh(keyGeo, keyMat, 0.08 + (i % 3) * 0.045, 1.28 - Math.floor(i / 3) * 0.04, 0.178, TM);
  for (i = 0; i < 6; i++) box(0.11, 0.004, 0.004, dark, 0, 0.97 + i * 0.012, 0.172, TM);
  E.kioskLamps = [basic(0x1a0505, { fog: false }), basic(0x041a08, { fog: false })];
  E.kioskLamps.forEach(function (m, n) { mesh(new THREE.CircleGeometry(0.011, 12), m, 0.23 - n * 0.035, 1.03, 0.1715, TM); });
  box(0.07, 0.6, 0.05, kioskShell, 0.3, 2.68, 0.04, TM); cyl(0.016, 0.016, 1.2, EM.steel, -0.3, 2.65, 0.03, TM, 6);                // conduit to the ceiling
  var tape = mesh(new THREE.PlaneGeometry(0.2, 0.035), std(0xc9b878, 0.9), 0.28, 1.53, 0.1902, TM); tape.rotation.z = 0.5; tape.userData.noCast = true;
  var dust = mesh(new THREE.PlaneGeometry(0.66, 1.02), new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, map: canvasTex(256, function (g, S, HH) { g.clearRect(0, 0, S, HH); var gr = g.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, 'rgba(120,114,96,.42)'); gr.addColorStop(0.18, 'rgba(120,114,96,.08)'); gr.addColorStop(0.85, 'rgba(120,114,96,.05)'); gr.addColorStop(1, 'rgba(90,84,70,.3)'); g.fillStyle = gr; g.fillRect(0, 0, S, HH); g.strokeStyle = 'rgba(30,28,24,.35)'; g.lineWidth = 1; for (var q = 0; q < 14; q++) { var x = Math.random() * S; g.beginPath(); g.moveTo(x, Math.random() * HH * 0.3); g.lineTo(x + (Math.random() - 0.5) * 8, HH * (0.4 + Math.random() * 0.6)); g.stroke(); } }, 1, 1, true, 396) }), 0, 1.4, 0.172, TM);
  // a live edge round the screen
  var bez = basic(0x0a1a10, { fog: false }); E.kioskBezel = bez; [[0, 1.855, 0.5, 0.008], [0, 1.465, 0.5, 0.008]].forEach(function (b2) { box(b2[2], b2[3], 0.006, bez, b2[0], b2[1], 0.188, TM).userData.noCast = true; }); [-0.252, 0.252].forEach(function (x) { box(0.008, 0.39, 0.006, bez, x, 1.66, 0.188, TM).userData.noCast = true; });
  dust.userData.noCast = true;
  // a clipboard on a hook, the sign-in sheet still on it
  var cb = new THREE.Group(); cb.position.set(0.52, 1.25, 0.03); cb.rotation.z = -0.05; TM.add(cb);
  box(0.24, 0.33, 0.012, std(0x8a6a44, 0.8, { map: woodTex }), 0, 0, 0, cb); mesh(new THREE.PlaneGeometry(0.21, 0.28), std(0xffffff, 0.9, { map: canvasTex(128, function (g, S, HH) { g.fillStyle = '#ece6d4'; g.fillRect(0, 0, S, HH); g.fillStyle = '#1c2a6a'; for (var r = 0; r < 12; r++) { g.fillRect(8, 18 + r * 13, 30 + (r * 17) % 50, 1.6); g.fillRect(70, 18 + r * 13, 20 + (r * 23) % 30, 1.6); } g.fillStyle = 'rgba(60,40,20,.3)'; g.fillRect(0, 0, S, HH); }, 1, 1, true, 170) }), 0, -0.01, 0.007, cb);
  box(0.08, 0.025, 0.02, EM.steel, 0, 0.16, 0.012, cb);

  // ---------- clue boards (drawn per game) ----------
  E.eom = livePanel(0.62, 0.8, 320, 412, X2 - 0.322, 1.75, 129.6, -PI / 2); box(0.03, 0.9, 0.72, M.wood, X2 - 0.3, 1.75, 129.6);
  E.reg = livePanel(1.7, 1.15, 640, 432, 18.4, 1.7, Z1 + 0.325, 0); box(1.82, 1.27, 0.03, EM.steel, 18.4, 1.7, Z1 + 0.305);
  box(1.82, 0.05, 0.08, EM.steel, 18.4, 1.05, Z1 + 0.34);
  mesh(new THREE.PlaneGeometry(0.9, 0.62), std(0xffffff, 0.8, { map: canvasTex(256, function (g, S, HH) {
    g.fillStyle = '#b58b55'; g.fillRect(0, 0, S, HH); blotch(g, S, ['#8d6a3c', '#c9a16a'], 20, 6, 30, 0.4);
    [[14, 12, 80, 100, '#e9e2d0'], [104, 20, 60, 44, '#f3e58a'], [176, 10, 68, 88, '#e9e2d0'], [104, 74, 64, 80, '#dfe9f0'], [20, 120, 76, 44, '#f0c9c0']].forEach(function (n) { g.fillStyle = n[4]; g.fillRect(n[0], n[1], n[2], n[3]); g.fillStyle = 'rgba(30,30,40,.55)'; for (var q = 0; q < 6; q++) g.fillRect(n[0] + 6, n[1] + 10 + q * 12, n[2] - 14 - (q * 7) % 20, 2); g.fillStyle = '#a8231c'; g.beginPath(); g.arc(n[0] + n[2] / 2, n[1] + 5, 3, 0, 7); g.fill(); });
    E.grime(g, S, HH, 0.8);
  }, 1, 1, true, 176) }), X2 - 0.31, 1.75, 127.2).rotation.y = -PI / 2;
  box(0.07, 0.24, 0.1, dark, X2 - 0.34, 1.5, 131.0); box(0.05, 0.2, 0.05, dark, X2 - 0.39, 1.5, 131.0);

  // ---------- shelving and what is left of the stock ----------
  /* Gondola units: steel uprights, a pegboard spine, shelves with a lipped edge and a price strip.  On them and kicked across
     the floor: plush dinosaurs, boxed toys, mugs, snow globes, rubber figures, postcards. */
  var shelfMat = std(0x3d4440, 0.55, { metalness: 0.45, map: metalTex }), shelves = [], uprights = [];
  var UNITS = [[14.0, 124.4, 0], [16.9, 124.6, 0.06], [14.2, 131.9, 0], [17.4, 131.2, -0.5, 1], [18.9, 132.9, 0.02]];      // x, z, rotation, toppled (the last leaves a clear aisle to the counter flap)
  var spots = [], pegMat = std(0xffffff, 0.9, { map: canvasTex(128, function (g, S) { g.fillStyle = '#6b5a44'; g.fillRect(0, 0, S, S); g.fillStyle = '#2c241a'; for (var a = 0; a < 16; a++) for (var b = 0; b < 16; b++) { g.beginPath(); g.arc(a * 8 + 4, b * 8 + 4, 1.1, 0, 7); g.fill(); } E.grime(g, S, S, 1); }, 6, 3) });
  var priceStrip = std(0xffffff, 0.6, { map: canvasTex(128, function (g, S, HH) { g.fillStyle = '#d9ae35'; g.fillRect(0, 0, S, HH); g.fillStyle = '#17140e'; for (var q = 0; q < 4; q++) { g.fillRect(8 + q * 32, 4, 18, 3); g.fillRect(8 + q * 32, 10, 12, 2); } E.grime(g, S, HH, 1); }, 4, 1, true, 16) });
  UNITS.forEach(function (u) {
    var G = new THREE.Group(); G.position.set(u[0], 0, u[1]); G.rotation.y = u[2]; if (u[3]) { G.rotation.z = 1.32; G.position.y = 0.3; } scene.add(G);
    box(0.56, 0.1, 3.0, shelfMat, 0, 0.05, 0, G);
    [0.45, 0.9, 1.35].forEach(function (y) {
      box(0.5, 0.022, 3.0, shelfMat, 0, y, 0, G); [-1, 1].forEach(function (s2) { box(0.012, 0.045, 3.0, shelfMat, s2 * 0.25, y + 0.018, 0, G); mesh(new THREE.PlaneGeometry(3.0, 0.03), priceStrip, s2 * 0.257, y + 0.005, 0, G).rotation.y = s2 * PI / 2; });
      if (!u[3]) for (var q = 0; q < 7; q++) spots.push([u[0] + (srand() - 0.5) * 0.25, y + 0.012, u[1] - 1.3 + q * 0.43 + (srand() - 0.5) * 0.1]);
    });
    [-1.48, 0, 1.48].forEach(function (z) { box(0.05, 1.7, 0.05, shelfMat, 0, 0.85, z, G); });
    box(0.02, 1.6, 3.0, pegMat, 0, 0.85, 0, G); box(0.06, 0.25, 3.0, std(0x254a30, 0.6), 0, 1.82, 0, G);
    mesh(new THREE.PlaneGeometry(2.0, 0.2), std(0xffffff, 0.7, { map: textTex([['PLUSH PALS', 'DINO TOYS', 'MUGS & GIFTS', 'POSTCARDS', 'SNOW GLOBES'][UNITS.indexOf(u)]], 512, 52, '#254a30', '#e2b93b', null, false) }), 0.035, 1.82, 0, G).rotation.y = PI / 2;
    if (u[3]) boxes.push({ x1: u[0] - 1.5, x2: u[0] + 0.4, z1: u[1] - 1.5, z2: u[1] + 1.2 }); else boxes.push({ x1: u[0] - 0.29, x2: u[0] + 0.29, z1: u[1] - 1.52, z2: u[1] + 1.52 });
  });
  for (i = 0; i < 44; i++) spots.push([12.2 + srand() * 8.4, 0.045, 122 + srand() * 12, 1]);                    // and on the floor
  // one plush dinosaur shape (body, neck, head, tail, four legs) merged into one geometry and instanced in faded colours
  var plushGeo = (function () {
    var parts = [], p;
    function add(geo, x, y, z, sx, sy, sz, rx, rz) { geo.scale(sx, sy, sz); if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); geo.translate(x, y, z); parts.push(geo); }
    add(new THREE.SphereGeometry(1, 12, 9), 0, 0.11, 0, 0.09, 0.075, 0.13);                                      // body
    add(new THREE.SphereGeometry(1, 10, 8), 0, 0.2, 0.12, 0.045, 0.085, 0.05, -0.5);                             // neck
    add(new THREE.SphereGeometry(1, 10, 8), 0, 0.27, 0.17, 0.05, 0.045, 0.065);                                  // head
    add(new THREE.ConeGeometry(0.05, 0.2, 9), 0, 0.09, -0.19, 1, 1, 1, -1.35);                                   // tail
    [[-0.05, 0.07], [0.05, 0.07], [-0.05, -0.06], [0.05, -0.06]].forEach(function (l) { add(new THREE.CylinderGeometry(0.026, 0.03, 0.08, 8), l[0], 0.04, l[1], 1, 1, 1); });
    var pos = [], nor = [], uv = [], idx = [], off = 0;
    parts.forEach(function (g2) { var gi = g2.index ? g2 : g2; var P2 = gi.attributes.position, N2 = gi.attributes.normal, U2 = gi.attributes.uv; for (var q = 0; q < P2.count; q++) { pos.push(P2.getX(q), P2.getY(q), P2.getZ(q)); nor.push(N2.getX(q), N2.getY(q), N2.getZ(q)); uv.push(U2.getX(q), U2.getY(q)); } var I = gi.index.array; for (q = 0; q < I.length; q++) idx.push(I[q] + off); off += P2.count; });
    p = new THREE.BufferGeometry(); p.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); p.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); p.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); p.setIndex(idx); return p;
  })();
  var mugGeo = (function () { var a = new THREE.CylinderGeometry(0.04, 0.036, 0.09, 14), b = new THREE.TorusGeometry(0.022, 0.006, 6, 12, PI * 1.2); b.rotateZ(-PI * 0.6); b.translate(0.042, 0, 0); var g2 = THREE.BufferGeometryUtils ? null : null; var pos = [], nor = [], uv = [], idx = [], off = 0; [a, b].forEach(function (gi) { var P2 = gi.attributes.position, N2 = gi.attributes.normal, U2 = gi.attributes.uv; for (var q = 0; q < P2.count; q++) { pos.push(P2.getX(q), P2.getY(q), P2.getZ(q)); nor.push(N2.getX(q), N2.getY(q), N2.getZ(q)); uv.push(U2.getX(q), U2.getY(q)); } var I = gi.index.array; for (q = 0; q < I.length; q++) idx.push(I[q] + off); off += P2.count; }); var p = new THREE.BufferGeometry(); p.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); p.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); p.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); p.setIndex(idx); return p; })();
  var plush = [], mugs = [], cartons = [], cards = [], globes = [], figs = [], col = new THREE.Color();
  spots.forEach(function (p) {
    var r = srand(), fl = p[3], ry = srand() * 6;
    if (inBox(p[0], p[2], 0.05) && fl) return;
    if (r < 0.26) { var s = 0.9 + srand() * 0.5; plush.push([p[0], p[1] + (fl ? 0.02 : 0), p[2], s, s, s, fl ? (srand() < 0.5 ? PI / 2 : 0) : 0, ry, fl && srand() < 0.5 ? 1.2 : 0]); }
    else if (r < 0.42) mugs.push([p[0], p[1] + (fl ? 0.04 : 0.045), p[2], 1, 1, 1, fl ? PI / 2 : 0, ry, 0]);
    else if (r < 0.66) { var bs = 0.1 + srand() * 0.08; cartons.push([p[0], p[1] + bs * 0.6, p[2], bs * 1.3, bs * 1.2, bs * 0.8, 0, ry, fl && srand() < 0.5 ? PI / 2 : 0]); }
    else if (r < 0.74 && !fl) globes.push([p[0], p[1] + 0.05, p[2], 1, 1, 1, 0, ry, 0]);
    else if (r < 0.86) figs.push([p[0], p[1] + (fl ? 0.01 : 0), p[2], 0.6, 0.6, 0.6, fl ? PI / 2 : 0, ry, 0]);
    else if (fl) cards.push([p[0], 0.047, p[2], 1, 1, 1, -PI / 2, 0, ry]);
  });
  var felt = std(0xffffff, 1, { bumpMap: bump(3), bumpScale: 0.02 });
  var pb = inst(plushGeo, felt, plush); plush.forEach(function (_, n) { col.setHSL([0.3, 0.08, 0.55, 0.02, 0.75, 0.15][n % 6], 0.3, 0.22 + (n % 3) * 0.05); pb.setColorAt(n, col); });
  var mg = inst(mugGeo, std(0xffffff, 0.3), mugs); mugs.forEach(function (_, n) { col.setHex([0xe9e2d0, 0x2f5a3a, 0xe2b93b, 0xa8231c][n % 4]); mg.setColorAt(n, col); });
  var boxArt = std(0xffffff, 0.75, { map: canvasTex(256, function (g, S) {
    g.fillStyle = '#e4dcc0'; g.fillRect(0, 0, S, S); g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S, 60); g.fillStyle = '#e2b93b'; g.font = 'bold 34px ' + FONT; g.textAlign = 'center'; g.fillText('DINO EGG', S / 2, 42);
    g.fillStyle = '#c9b48a'; g.beginPath(); g.ellipse(S / 2, 150, 54, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#6a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(S / 2 - 40, 140); g.lineTo(S / 2 - 10, 160); g.lineTo(S / 2 + 10, 135); g.lineTo(S / 2 + 40, 158); g.stroke();
    g.fillStyle = '#8d1f18'; g.font = 'bold 22px ' + FONT; g.fillText('HATCH YOUR OWN!', S / 2, 238); E.grime(g, S, S, 1);
  }) });
  var ct = inst(new THREE.BoxGeometry(1, 1, 1), boxArt, cartons); cartons.forEach(function (_, n) { col.setHex([0xffffff, 0xd8c0b0, 0xb8c8d8, 0xc8d8b0][n % 4]); ct.setColorAt(n, col); });
  var gl = inst(new THREE.SphereGeometry(0.042, 14, 10), std(0x9fd8e8, 0.08, { metalness: 0.2, transparent: true, opacity: 0.55 }), globes.map(function (p) { return [p[0], p[1] + 0.035, p[2]]; }));
  gl.userData.noCast = true; inst(new THREE.CylinderGeometry(0.036, 0.042, 0.03, 12), std(0x3a2c20, 0.6), globes);
  var fg = inst(plushGeo, std(0xffffff, 0.45), figs); figs.forEach(function (_, n) { col.setHex([0x4a7a3a, 0x7a3a2a, 0x3a5a7a, 0x8a7a2a][n % 4]); fg.setColorAt(n, col); });
  var cd = inst(new THREE.PlaneGeometry(0.15, 0.1), std(0xffffff, 0.9, { side: THREE.DoubleSide }), cards); cd.userData.noCast = true; cards.forEach(function (_, n) { col.setHex([0xd8d2c2, 0x8fb0c8, 0xc8a878, 0x9ab88a][n % 4]); cd.setColorAt(n, col); });
  // postcard spinner by the door, a clothes rail of faded shirts
  var spn = new THREE.Group(); spn.position.set(13.0, 0, 129.9); spn.rotation.z = 0.06; scene.add(spn);
  cyl(0.02, 0.02, 1.7, shelfMat, 0, 0.85, 0, spn, 6); cyl(0.26, 0.3, 0.04, shelfMat, 0, 0.02, 0, spn, 10);
  var pcs = []; for (i = 0; i < 24; i++) { var a = (i % 6) / 6 * PI * 2, lv = Math.floor(i / 6); if ((i * 7) % 5 === 0) continue; pcs.push([Math.cos(a) * 0.17, 0.5 + lv * 0.34, Math.sin(a) * 0.17, 1, 1, 1, 0.12, -a + PI / 2, 0]); }
  inst(new THREE.PlaneGeometry(0.11, 0.16), std(0xc8bfa6, 0.9, { side: THREE.DoubleSide }), pcs, spn).userData.noCast = true;
  [0, 1, 2, 3].forEach(function (lv) { var y = 0.42 + lv * 0.34; mesh(new THREE.TorusGeometry(0.165, 0.006, 5, 18), shelfMat, 0, y, 0, spn).rotation.x = PI / 2; box(0.34, 0.01, 0.01, shelfMat, 0, y, 0, spn); box(0.01, 0.01, 0.34, shelfMat, 0, y, 0, spn); });
  circles.push({ x: 13.0, z: 129.9, r: 0.32 });
  var rail = new THREE.Group(); rail.position.set(12.0, 0, 124.3); scene.add(rail);
  [-0.9, 0.9].forEach(function (z) { box(0.04, 1.5, 0.04, shelfMat, 0, 0.75, z, rail); box(0.4, 0.04, 0.04, shelfMat, 0, 0.02, z, rail); }); box(0.03, 0.03, 1.84, shelfMat, 0, 1.5, 0, rail);
  var tees = []; for (i = 0; i < 7; i++) if (i !== 2 && i !== 5) tees.push([0, 1.12, -0.75 + i * 0.25, 1, 1, 1, 0, (srand() - 0.5) * 0.3, 0]);
  var teeShape = new THREE.Shape(); teeShape.moveTo(-0.16, -0.33); teeShape.lineTo(0.16, -0.33); teeShape.lineTo(0.16, 0.12); teeShape.lineTo(0.26, 0.05); teeShape.lineTo(0.3, 0.17); teeShape.lineTo(0.12, 0.3); teeShape.lineTo(0.05, 0.27); teeShape.lineTo(-0.05, 0.27); teeShape.lineTo(-0.12, 0.3); teeShape.lineTo(-0.3, 0.17); teeShape.lineTo(-0.26, 0.05); teeShape.lineTo(-0.16, 0.12); teeShape.closePath();
  var teeGeo = new THREE.ExtrudeGeometry(teeShape, { depth: 0.02, bevelEnabled: false }); teeGeo.translate(0, 0, -0.01);
  var tm = inst(teeGeo, felt, tees, rail); tees.forEach(function (_, n) { col.setHex([0x4a6a52, 0x8a7a4a, 0x6a4a44, 0x4a5a6a, 0x7a7466][n % 5]); tm.setColorAt(n, col); });
  boxes.push({ x1: 11.75, x2: 12.25, z1: 123.35, z2: 125.25 });
  // the drinks cooler against the north wall: a glass door, its light long dead, a few bottles left on the racks
  (function () {
    var CG = new THREE.Group(); CG.position.set(13.3, 0, Z1 + 0.68); scene.add(CG);
    var coolMat = std(0xb8bcb8, 0.45, { metalness: 0.3, map: metalTex });
    box(0.9, 1.95, 0.72, coolMat, 0, 0.975, 0, CG); box(0.92, 0.36, 0.05, std(0x8d1f18, 0.6), 0, 1.78, 0.37, CG);
    mesh(new THREE.PlaneGeometry(0.86, 0.3), std(0xffffff, 0.7, { map: textTex(['ICE COLD'], 256, 80, '#8d1f18', '#f1ecdd', null, false) }), 0, 1.78, 0.396, CG);
    box(0.78, 1.42, 0.02, dark, 0, 0.88, 0.352, CG);
    for (var r = 0; r < 4; r++) { box(0.72, 0.012, 0.56, coolMat, 0, 0.32 + r * 0.34, 0.06, CG); for (var b2 = 0; b2 < 7; b2++) if ((r * 7 + b2) % 3 !== 0) { var bt = cyl(0.028, 0.028, 0.2, std([0x4a2a14, 0x2a5a2a, 0xa8231c, 0xd8d2c2][b2 % 4], 0.2, { transparent: b2 % 4 < 2, opacity: 0.85 }), -0.3 + b2 * 0.1, 0.43 + r * 0.34, 0.12, CG, 10); if ((r + b2) % 5 === 0) { bt.rotation.z = PI / 2; bt.position.y -= 0.07; } } }
    var cglass = mesh(new THREE.PlaneGeometry(0.74, 1.36), EM.glassDirty, 0, 0.88, 0.366, CG); cglass.userData.noCast = true;
    box(0.04, 0.5, 0.04, EM.steel, 0.33, 0.9, 0.39, CG);
    boxes.push({ x1: 12.85, x2: 13.75, z1: Z1 + 0.3, z2: Z1 + 1.06 });
  })();
  // Dottie: the big mascot plush, slumped in the corner with one eye gone
  var dot = new THREE.Group(); dot.position.set(24.0, 0, 133.9); dot.rotation.y = -2.2; scene.add(dot);
  var dfelt = std(0x4f8a4a, 1, { bumpMap: bump(3), bumpScale: 0.03, map: canvasTex(64, function (g, S) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S); blotch(g, S, ['#6a6a5a', '#3a3a30'], 14, 6, 26, 0.5); }) });
  tube([[0, 0.3, -0.75, 0.03, 0.03], [0, 0.22, -0.45, 0.14, 0.13], [0, 0.36, -0.1, 0.36, 0.34], [0, 0.42, 0.15, 0.38, 0.38], [0, 0.6, 0.38, 0.24, 0.24], [0.05, 0.95, 0.44, 0.15, 0.15], [0.16, 1.2, 0.5, 0.13, 0.13]], dfelt, dot, 14, 5);
  tube([[0.16, 1.18, 0.48, 0.12, 0.12], [0.22, 1.2, 0.62, 0.16, 0.14], [0.27, 1.12, 0.8, 0.13, 0.1], [0.3, 1.07, 0.9, 0.05, 0.05]], dfelt, dot, 12, 4);
  [[-0.3, 0.3], [0.3, 0.3], [-0.28, -0.1], [0.28, -0.1]].forEach(function (l) { tube([[l[0], 0.3, l[1], 0.13, 0.13], [l[0] * 1.5, 0.14, l[1] + 0.22, 0.11, 0.11], [l[0] * 1.6, 0.1, l[1] + 0.42, 0.12, 0.1]], dfelt, dot, 8, 3); });
  mesh(new THREE.SphereGeometry(0.035, 8, 8), std(0x0a0a0a, 0.2), 0.15, 1.27, 0.7, dot); mesh(new THREE.CircleGeometry(0.03, 8), basic(0x1a120c), 0.345, 1.22, 0.66, dot).rotation.y = 1.3;
  circles.push({ x: 24.0, z: 133.9, r: 0.7 });
  // stock room corner: stacked boxes behind the counter return
  var crates = []; [[23.9, 122.2, 0.9], [23.0, 122.0, 0.7], [23.6, 123.3, 0.6], [22.3, 123.9, 0.5], [24.1, 124.1, 0.75]].forEach(function (c, n) { crates.push([c[0], c[2] / 2, c[1], c[2], c[2], c[2], 0, n * 0.4, 0]); if (n < 2) crates.push([c[0] + 0.05, c[2] + 0.25, c[1], 0.5, 0.5, 0.5, 0, n + 0.3, 0]); });
  inst(new THREE.BoxGeometry(1, 1, 1), std(0xffffff, 0.9, { map: canvasTex(128, function (g, S) { g.fillStyle = '#9a7a4e'; g.fillRect(0, 0, S, S); g.strokeStyle = '#6a5232'; g.lineWidth = 3; g.strokeRect(3, 3, S - 6, S - 6); g.fillStyle = '#c9b48a'; g.fillRect(0, 54, S, 20); g.fillStyle = '#3a2c1a'; g.font = 'bold 16px Arial'; g.fillText('FRAGILE', 30, 38); E.grime(g, S, S, 1.2); }) }), crates);
  boxes.push({ x1: 22.1, x2: 24.7, z1: 121.3, z2: 124.6 });
  // the mural on the south wall between the posters: the park's cartoon dinosaurs, sun-faded and peeling
  var mural = mesh(new THREE.PlaneGeometry(5.6, 1.7), std(0xffffff, 0.85, { map: canvasTex(1024, function (g, S, HH) {
    var sky = g.createLinearGradient(0, 0, 0, HH); sky.addColorStop(0, '#8fc4d8'); sky.addColorStop(0.7, '#d8e8c8'); g.fillStyle = sky; g.fillRect(0, 0, S, HH);
    g.fillStyle = '#e9c45a'; g.beginPath(); g.arc(S * 0.85, 60, 40, 0, 7); g.fill();
    g.fillStyle = '#6aa04a'; g.beginPath(); g.moveTo(0, HH); for (var x = 0; x <= S; x += 40) g.lineTo(x, HH * 0.72 + Math.sin(x * 0.01) * 18); g.lineTo(S, HH); g.fill();
    [[120, 0.74, 1], [440, 0.7, 0.8], [760, 0.73, 1.1]].forEach(function (pt) { g.fillStyle = '#5a3a1a'; g.fillRect(pt[0] - 6, HH * pt[1] - 120 * pt[2], 12, 120 * pt[2]); g.fillStyle = '#3f7a3a'; for (var q = 0; q < 6; q++) { g.save(); g.translate(pt[0], HH * pt[1] - 120 * pt[2]); g.rotate(q / 6 * PI * 2); g.beginPath(); g.ellipse(36, 0, 40, 10, 0, 0, 7); g.fill(); g.restore(); } });
    g.fillStyle = '#5c9a52'; g.beginPath(); g.ellipse(300, 240, 90, 46, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(360, 220); g.quadraticCurveTo(430, 110, 410, 80); g.quadraticCurveTo(460, 90, 420, 230); g.fill(); g.beginPath(); g.ellipse(408, 76, 32, 20, -0.3, 0, 7); g.fill();
    g.fillRect(250, 270, 22, 46); g.fillRect(330, 270, 22, 46); g.fillStyle = '#fff'; g.beginPath(); g.arc(416, 70, 7, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(418, 71, 3.5, 0, 7); g.fill();
    g.fillStyle = '#d9783a'; g.beginPath(); g.ellipse(640, 250, 70, 34, 0.1, 0, 7); g.fill(); g.beginPath(); g.moveTo(690, 240); g.lineTo(760, 200); g.lineTo(790, 214); g.lineTo(750, 250); g.fill(); g.fillRect(610, 276, 14, 36); g.fillRect(650, 276, 14, 36);
    g.fillStyle = '#254a30'; g.font = 'bold 64px ' + FONT; g.textAlign = 'center'; g.fillText('MEET THE DINOSAURS!', S / 2, 140);
    g.fillStyle = 'rgba(220,210,180,.4)'; g.fillRect(0, 0, S, HH); E.streaks(g, S, HH, 50, 'rgba(60,44,22,.8)', HH); E.grime(g, S, HH, 1.2);
    g.globalCompositeOperation = 'destination-out'; for (var q2 = 0; q2 < 14; q2++) { var px = Math.random() * S, py = Math.random() * HH; g.beginPath(); g.moveTo(px, py); for (var k2 = 0; k2 < 6; k2++) g.lineTo(px + (Math.random() - 0.5) * 60, py + (Math.random() - 0.5) * 40); g.fill(); } g.globalCompositeOperation = 'source-over';
  }, 1, 1, true, 310), transparent: false, alphaTest: 0.5 }), 18.6, 1.95, Z2 - 0.305); mural.rotation.y = PI;
  // posters, ceiling lights (two are dead for good; power brings the others back, flickering)
  [[14.6, Z2 - 0.315, PI, ["DOTTIE'S", 'DINO DAY', 'EVERY SATURDAY'], '#254a30', '#e2b93b'], [22.6, Z2 - 0.315, PI, ['PHOTO WITH', 'A REAL REX', '$5'], '#8d1f18', '#f1ecdd']].forEach(function (p) {
    var m = mesh(new THREE.PlaneGeometry(0.9, 1.25), std(0xffffff, 0.85, { map: textTex(p[3], 256, 356, p[4], p[5], p[5]) }), p[0], 1.75, p[1]); m.rotation.y = p[2];
  });
  E.shopTubes = [];
  [[14.5, 124.5, 0], [14.5, 131.5, 1], [19, 128, 2], [22.6, 128.6, 3]].forEach(function (f) {
    var G = new THREE.Group(); G.position.set(f[0], H - 0.08, f[1]); if (f[2] === 1) { G.rotation.x = 0.22; G.position.y -= 0.14; } scene.add(G);
    box(0.3, 0.07, 1.26, std(0xa8a69c, 0.7), 0, 0, 0, G); var tm2 = basic(0x1c1c1a); box(0.24, 0.02, 1.18, tm2, 0, -0.045, 0, G).userData.noCast = true;
    box(0.3, 0.02, 1.26, std(0xd8d6cc, 0.4, { transparent: true, opacity: 0.35 }), 0, -0.06, 0, G).userData.noCast = true;            // the diffuser
    if (f[2] === 1) cyl(0.004, 0.004, 0.3, dark, 0, 0.14, 0.7, G, 3); else E.shopTubes.push(tm2);
  });
  E.shopGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,244,214,.55)', 'rgba(255,236,190,.12)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  E.shopGlow.position.set(X1 + 0.1, 1.7, 128); E.shopGlow.scale.set(11, 4, 1); scene.add(dyn(E.shopGlow));
  // leaves and paper blown in at the door, glass under the windows
  var bits = []; for (i = 0; i < 46; i++) bits.push([11.6 + Math.pow(srand(), 2) * 5, 0.048, 123 + srand() * 10, 1, 1, 1, -PI / 2, 0, srand() * 6]);
  inst(new THREE.PlaneGeometry(0.1, 0.06), std(0x5a4424, 1, { side: THREE.DoubleSide }), bits).userData.noCast = true;
  var shards = []; for (i = 0; i < 40; i++) { var wz = srand() < 0.5 ? 122.6 + srand() * 3.6 : 129.8 + srand() * 3.6; shards.push([11.4 + srand() * 0.9, 0.05, wz, 0.6 + srand(), 1, 0.6 + srand(), -PI / 2, 0, srand() * 6]); }
  inst(new THREE.CircleGeometry(0.03, 3), std(0xbfd8e0, 0.05, { metalness: 0.5, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), shards).userData.noCast = true;

  // ---------- maintenance shed ----------
  /* Corrugated steel on a steel frame, a mono-pitch roof with a deep overhang and a gutter, an angle-iron door frame and a
     steel door with a louvre, a small wired-glass window on the plaza side.  Inside: the diesel set along the west wall,
     the distribution board on the north wall, a workbench, a shelf of junk, a drum, a bare bulb. */
  var SX1 = -22, SX2 = -16, SZ1 = 124, SZ2 = 130, SH = 2.7, ST = 0.12;
  function corrPaint(height) {
    return function (g, S) {
      var ribs = 20, w = S / ribs;
      for (var q = 0; q < ribs; q++) {
        var gr = g.createLinearGradient(q * w, 0, q * w + w, 0);
        if (height) { gr.addColorStop(0, '#202020'); gr.addColorStop(0.5, '#e0e0e0'); gr.addColorStop(1, '#202020'); }
        else { gr.addColorStop(0, '#3a463e'); gr.addColorStop(0.5, '#5d6b60'); gr.addColorStop(1, '#36423a'); }
        g.fillStyle = gr; g.fillRect(q * w, 0, w, S);
      }
      if (height) return;
      g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#2c3530', '#6f7d72', '#4a3a2a'], 6000, 1.4)(g, S); g.globalAlpha = 1;
      E.streaks(g, S, S, 60, 'rgba(120,64,24,.9)', S * 0.8); blotch(g, S, ['#6a3c1e', '#2a2018', '#8a4a1e'], 30, 8, 46, 0.5); E.grime(g, S, S, 1.3);
      g.fillStyle = 'rgba(60,30,14,.8)'; for (q = 0; q < 6; q++) g.fillRect(0, S - 10 - q * 2, S, 1.5);                                   // rust along the foot
    };
  }
  var tin = std(0xffffff, 0.7, { metalness: 0.35, map: canvasTex(512, corrPaint(false)), normalMap: normalTex(256, corrPaint(true), 2.5), normalScale: new THREE.Vector2(1, 1) });
  function sh(x1, x2, z1, z2, y1, y2, collide) { var m = box(x2 - x1, y2 - y1, z2 - z1, tin, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); worldUV(m, 1.52); if (collide !== false) boxes.push({ x1: x1, x2: x2, z1: z1, z2: z2, solid: true }); return m; }
  sh(SX1, SX1 + ST, SZ1, SZ2, 0, SH); sh(SX1, SX2, SZ1, SZ1 + ST, 0, SH);
  // the south wall (facing the plaza) round a small window
  var WX1 = -17.55, WX2 = -16.45, WXC = (WX1 + WX2) / 2;
  sh(SX1, WX1, SZ2 - ST, SZ2, 0, SH); sh(WX2, SX2, SZ2 - ST, SZ2, 0, SH); sh(WX1, WX2, SZ2 - ST, SZ2, 0, 1.5, false); sh(WX1, WX2, SZ2 - ST, SZ2, 2.2, SH, false);
  boxes.push({ x1: WX1, x2: WX2, z1: SZ2 - ST, z2: SZ2, solid: true });
  var wire = std(0xffffff, 0.2, { transparent: true, opacity: 0.55, depthWrite: false, metalness: 0.2, map: canvasTex(64, function (g, S) { g.fillStyle = 'rgba(90,110,100,.6)'; g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(30,30,28,.9)'; g.lineWidth = 1.4; for (var q = 0; q <= S; q += 8) { g.beginPath(); g.moveTo(q, 0); g.lineTo(q, S); g.moveTo(0, q); g.lineTo(S, q); g.stroke(); } blotch(g, S, ['#2a2a20'], 6, 6, 20, 0.5); }, 4, 2) });
  mesh(new THREE.PlaneGeometry(WX2 - WX1, 0.7), wire, WXC, 1.85, SZ2 - ST / 2).userData.noCast = true;
  [1.48, 2.22].forEach(function (y) { box(WX2 - WX1 + 0.12, 0.05, ST + 0.04, EM.rustSteel, WXC, y, SZ2 - ST / 2); });
  [WX1 - 0.03, WX2 + 0.03].forEach(function (x) { box(0.05, 0.78, ST + 0.04, EM.rustSteel, x, 1.85, SZ2 - ST / 2); });
  // the east wall round the door opening, the angle-iron frame round it
  sh(SX2 - ST, SX2, SZ1, 126.4, 0, SH); sh(SX2 - ST, SX2, 127.6, SZ2, 0, SH); sh(SX2 - ST, SX2, 126.4, 127.6, 2.1, SH, false);
  [126.4, 127.6].forEach(function (z) { box(0.06, 2.12, 0.05, EM.rustSteel, SX2 + 0.02, 1.06, z + (z < 127 ? -0.025 : 0.025)); box(ST + 0.04, 2.1, 0.03, EM.rustSteel, SX2 - ST / 2, 1.05, z + (z < 127 ? 0.015 : -0.015)); });
  box(0.06, 0.05, 1.3, EM.rustSteel, SX2 + 0.02, 2.125, 127); box(0.4, 0.06, 1.3, EM.stone, SX2 + 0.1, 0.03, 127);
  // corner posts, roof, fascia, gutter
  [[SX1, SZ1], [SX1, SZ2], [SX2, SZ1], [SX2, SZ2]].forEach(function (c) { box(0.1, SH + 0.1, 0.1, EM.rustSteel, c[0], (SH + 0.1) / 2, c[1]); });
  var roofSheet = std(0xffffff, 0.75, { metalness: 0.4, map: canvasTex(512, corrPaint(false)), normalMap: normalTex(256, corrPaint(true), 2.5) }); roofSheet.map.repeat.set(5, 1); roofSheet.normalMap.repeat.set(5, 1);
  var rf = box(6.7, 0.05, 6.8, roofSheet, -19, SH + 0.2, 127); rf.rotation.x = 0.07;
  box(6.7, 0.18, 0.05, EM.green, -19, SH + 0.08, SZ2 + 0.38).rotation.x = 0.07; box(6.7, 0.18, 0.05, EM.green, -19, SH + 0.32, SZ1 - 0.38);
  var gut = cyl(0.06, 0.06, 6.7, EM.rustSteel, -19, SH - 0.02, SZ2 + 0.43, null, 10); gut.rotation.z = PI / 2; cyl(0.04, 0.04, SH, EM.rustSteel, SX2 + 0.25, SH / 2, SZ2 + 0.43, null, 8);
  var srf = flat(5.76, 5.76, std(0x1d1e1c, 1), -19, SH - 0.02, 127); srf.rotation.x = PI / 2;
  [125.4, 128.6].forEach(function (z) { box(5.76, 0.14, 0.08, EM.rustSteel, -19, SH - 0.1, z); });
  box(6.3, 0.14, 6.3, EM.stone, -19, 0.0, 127).userData.noCast = true;
  flat(5.76, 5.76, rt(M.concrete, 2, 2), -19, 0.075, 127);
  mesh(new THREE.PlaneGeometry(1.5, 0.5), std(0xffffff, 0.8, { map: textTex(['MAINTENANCE', 'AUTHORISED STAFF ONLY'], 384, 128, '#d8cfae', '#254a30', '#254a30') }), SX2 + 0.035, 2.38, 128.55).rotation.y = PI / 2;
  // the door: a steel leaf on two hinges that swings into the shed
  E.shedDoor = dyn(new THREE.Group()); E.shedDoor.position.set(SX2 - 0.07, 0, 126.43); scene.add(E.shedDoor);
  var doorSteel = std(0xffffff, 0.6, { metalness: 0.4, map: canvasTex(256, function (g, S) { g.fillStyle = '#3a5a44'; g.fillRect(0, 0, S, S); E.chips(g, S, S, 40, '#1a1c18'); E.chips(g, S, S, 16, '#7a4a20'); E.streaks(g, S, S, 22, 'rgba(90,50,20,.9)', S); E.grime(g, S, S, 1.2); }), bumpMap: bump(2), bumpScale: 0.01 });
  box(0.05, 2.04, 1.14, doorSteel, 0, 1.03, 0.58, E.shedDoor);
  for (i = 0; i < 6; i++) { var lv2 = box(0.06, 0.03, 0.62, EM.rustSteel, 0.01, 0.22 + i * 0.055, 0.58, E.shedDoor); lv2.rotation.z = 0.5; }
  box(0.06, 0.38, 0.03, EM.rustSteel, 0.01, 0.35, 0.26, E.shedDoor); box(0.06, 0.38, 0.03, EM.rustSteel, 0.01, 0.35, 0.9, E.shedDoor);
  box(0.06, 0.18, 0.9, std(0x7a7a72, 0.5, { metalness: 0.5 }), 0.005, 0.09, 0.58, E.shedDoor);                                                  // kick plate
  [0.4, 1.7].forEach(function (y) { cyl(0.025, 0.025, 0.16, EM.rustSteel, 0, y, 0, E.shedDoor, 8); });
  box(0.12, 0.03, 0.14, EM.steel, 0.05, 1.02, 1.04, E.shedDoor); box(0.12, 0.03, 0.14, EM.steel, -0.05, 1.02, 1.04, E.shedDoor);
  mesh(new THREE.PlaneGeometry(0.42, 0.42), std(0xffffff, 0.8, { map: canvasTex(128, function (g, S) { g.fillStyle = '#e2b93b'; g.fillRect(0, 0, S, S); g.strokeStyle = '#17140e'; g.lineWidth = 7; g.beginPath(); g.moveTo(64, 12); g.lineTo(118, 108); g.lineTo(10, 108); g.closePath(); g.stroke(); g.fillStyle = '#17140e'; g.beginPath(); g.moveTo(70, 34); g.lineTo(50, 70); g.lineTo(64, 70); g.lineTo(56, 98); g.lineTo(80, 60); g.lineTo(66, 60); g.closePath(); g.fill(); E.grime(g, S, S, 1.2); E.chips(g, S, S, 8, '#6a5a2a'); }) }), 0.028, 1.5, 0.58, E.shedDoor).rotation.y = PI / 2;
  var hasp = new THREE.Group(); hasp.position.set(0.045, 1.0, 1.08); E.shedDoor.add(hasp); box(0.02, 0.05, 0.12, EM.rustSteel, 0, 0, 0, hasp); var pl2 = box(0.04, 0.06, 0.02, M.gold, 0.02, -0.07, 0.03, hasp); pl2.rotation.x = 0.4;
  W.shedDoorBox = { x1: SX2 - ST, x2: SX2, z1: 126.4, z2: 127.6, solid: true }; boxes.push(W.shedDoorBox);
  E.shedSpot = { x: SX2 + 0.9, z: 127 };

  // ---------- the diesel generating set ----------
  /* An enclosed set on a steel skid: louvred canopy, a radiator grille at the end, two service doors, the control panel and
     the rating plate on the side you stand at, and the fuel filler on top at that corner.  Its cap hangs from a hinge on the
     far side of the neck, so it flips away from you and lies clear of the canopy when open. */
  var GEN = new THREE.Group(); GEN.position.set(-20.95, 0, 127.4); scene.add(GEN);
  var genGreen = std(0xffffff, 0.55, { metalness: 0.3, map: canvasTex(256, function (g, S) { g.fillStyle = '#31513a'; g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(10,14,10,.7)'; g.lineWidth = 2; [64, 192].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }); E.chips(g, S, S, 30, '#1d1f1a'); E.chips(g, S, S, 12, '#6a3c20'); E.streaks(g, S, S, 16, 'rgba(20,16,10,.9)', S); E.grime(g, S, S, 1); }), bumpMap: bump(2), bumpScale: 0.012 });
  [-0.46, 0.46].forEach(function (x) { box(0.1, 0.14, 2.5, EM.rustSteel, x, 0.07, 0, GEN); });
  box(1.04, 0.05, 2.4, EM.rustSteel, 0, 0.13, 0, GEN);
  E.genShake = dyn(new THREE.Group()); GEN.add(E.genShake);                                                                           // the parts that tremble when it runs
  var canopy = box(1.08, 1.12, 2.3, genGreen, 0, 0.72, 0, E.genShake); box(1.1, 0.06, 2.32, genGreen, 0, 1.31, 0, E.genShake);
  var louv = []; for (i = 0; i < 9; i++) { louv.push([0.545, 0.42 + i * 0.065, -0.55, 1, 1, 1, 0, 0, 0.5]); louv.push([-0.545, 0.42 + i * 0.065, -0.55, 1, 1, 1, 0, 0, -0.5]); }
  inst(new THREE.BoxGeometry(0.02, 0.045, 0.8), EM.rustSteel, louv, E.genShake);
  box(0.9, 0.85, 0.02, std(0x1a1c1a, 0.6, { metalness: 0.5, map: canvasTex(64, function (g, S) { g.fillStyle = '#141614'; g.fillRect(0, 0, S, S); g.fillStyle = '#4a4a44'; for (var q = 0; q < S; q += 4) { g.fillRect(0, q, S, 1.5); g.fillRect(q, 0, 1.5, S); } }, 6, 6) }), 0, 0.72, -1.16, E.genShake);   // radiator grille
  [[0.546, 0.15], [0.546, -0.55]].forEach(function (d2) { box(0.012, 0.95, 0.66, genGreen, d2[0], 0.72, d2[1], E.genShake); [0.38, 1.05].forEach(function (y) { box(0.03, 0.08, 0.025, EM.rustSteel, d2[0] + 0.01, y, d2[1] - 0.34, E.genShake); }); box(0.04, 0.12, 0.03, EM.steel, d2[0] + 0.02, 0.72, d2[1] + 0.29, E.genShake); });
  [[-0.4, -0.95], [0.4, -0.95], [-0.4, 0.95], [0.4, 0.95]].forEach(function (e) { mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), EM.rustSteel, e[0], 1.38, e[1], E.genShake).rotation.y = PI / 2; });          // lifting eyes
  cyl(0.06, 0.06, 1.5, EM.rustSteel, -0.2, 2.05, -0.8, GEN, 10); cyl(0.09, 0.09, 0.3, EM.rustSteel, -0.2, 1.5, -0.8, GEN, 10); cyl(0.1, 0.1, 0.03, EM.rustSteel, -0.2, 2.82, -0.8, GEN, 10);          // exhaust up through the roof
  // the fuel filler: a raised neck with a hinged cap
  var NX = 0.38, NY = 1.34, NZ = 0.85;
  cyl(0.052, 0.06, 0.02, EM.rustSteel, NX, NY + 0.01, NZ, E.genShake, 16); cyl(0.042, 0.042, 0.08, EM.steel, NX, NY + 0.06, NZ, E.genShake, 16);
  mesh(new THREE.CircleGeometry(0.036, 16), basic(0x050505), NX, NY + 0.101, NZ, E.genShake).rotation.x = -PI / 2;
  var capG = new THREE.Group(); capG.position.set(NX - 0.05, NY + 0.105, NZ); E.genShake.add(capG); E.genCap = capG;            // hinge on the far (-x) rim
  cyl(0.052, 0.052, 0.028, std(0xa8231c, 0.5), 0.05, 0.014, 0, capG, 16); box(0.02, 0.018, 0.03, EM.rustSteel, 0.0, 0.01, 0, capG);
  mesh(new THREE.PlaneGeometry(0.28, 0.07), std(0xffffff, 0.6, { map: textTex(['DIESEL ONLY'], 256, 64, '#e2b93b', '#17140e', null, false) }), 0.2, NY + 0.035, 0.6, E.genShake).rotation.set(-PI / 2, 0, 0);
  E.genNeck = new THREE.Vector3(-20.95 + NX, NY + 0.1, 127.4 + NZ);                                                             // the mouth of the filler, in the world
  // its panel: fuel gauge, hour meter, lamp, start lever
  var PN = new THREE.Group(); PN.position.set(0.56, 1.0, 0.45); E.genShake.add(PN);
  box(0.03, 0.5, 0.8, std(0x202326, 0.6, { metalness: 0.4 }), 0, 0, 0, PN);
  mesh(new THREE.CircleGeometry(0.09, 20), std(0xffffff, 0.5, { map: canvasTex(128, function (g, S) { g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, S, S); g.strokeStyle = '#17140e'; g.lineWidth = 3; g.beginPath(); g.arc(64, 76, 44, PI * 1.15, PI * 1.85); g.stroke(); g.strokeStyle = '#a8231c'; g.lineWidth = 6; g.beginPath(); g.arc(64, 76, 44, PI * 1.15, PI * 1.3); g.stroke(); g.fillStyle = '#17140e'; g.font = 'bold 18px Arial'; g.fillText('E', 20, 66); g.fillText('F', 98, 66); g.font = 'bold 12px Arial'; g.fillText('FUEL', 50, 104); E.grime(g, S, S, 0.6); }) }), 0.017, 0.1, -0.22, PN).rotation.y = PI / 2;
  E.genNeedle = dyn(new THREE.Group()); E.genNeedle.position.set(0.02, 0.085, -0.22); PN.add(E.genNeedle); box(0.004, 0.07, 0.006, std(0xa8231c, 0.5), 0, 0.035, 0, E.genNeedle);
  E.genLamp = glow(0x1a0505); mesh(new THREE.SphereGeometry(0.022, 10, 8), E.genLamp, 0.02, 0.12, 0.02, PN);
  mesh(new THREE.PlaneGeometry(0.2, 0.06), std(0xffffff, 0.6, { map: textTex(['RUN'], 128, 40, '#202326', '#d7dadc', null, false) }), 0.017, 0.06, 0.02, PN).rotation.y = PI / 2;
  E.genLever = dyn(new THREE.Group()); E.genLever.position.set(0.03, -0.02, 0.25); PN.add(E.genLever);
  box(0.02, 0.26, 0.03, EM.steel, 0.02, 0.13, 0, E.genLever); mesh(new THREE.SphereGeometry(0.035, 10, 8), std(0xa8231c, 0.45), 0.02, 0.27, 0, E.genLever);
  mesh(new THREE.PlaneGeometry(0.22, 0.06), std(0xffffff, 0.6, { map: textTex(['START'], 128, 36, '#e2b93b', '#17140e', null, false) }), 0.017, -0.16, 0.25, PN).rotation.y = PI / 2;
  E.genPlate = livePanel(0.46, 0.24, 384, 200, 0, 0, 0, 0, E.genShake); E.genPlate.mesh.position.set(0.553, 0.42, 0.5); E.genPlate.mesh.rotation.y = PI / 2;
  E.genNote = livePanel(0.26, 0.2, 256, 196, 0, 0, 0, 0, E.genShake); E.genNote.mesh.position.set(0.556, 1.1, -0.2); E.genNote.mesh.rotation.set(0, PI / 2, 0.06);
  boxes.push({ x1: -21.6, x2: -20.35, z1: 126.15, z2: 128.65 });
  E.genSpot = { x: -19.45, z: 127.85 };
  // the diesel, falling from the spout into the neck while you pour
  E.stream = dyn(mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 1, 8, 1, true), std(0x8a6a1a, 0.08, { metalness: 0.2, transparent: true, opacity: 0.75, emissive: 0x1a1204 }), 0, 0, 0)); E.stream.visible = false; E.stream.userData.noCast = true; E.stream.userData.keep = true;
  // an empty can stood down by the set after the pour (shown once the tank is filled)

  // ---------- the distribution board on the north wall: six breakers you throw by hand ----------
  var BD = new THREE.Group(); BD.position.set(-19.0, 1.5, SZ1 + ST); scene.add(BD);
  var boardGrey = std(0x596268, 0.55, { metalness: 0.5, map: metalTex });
  box(1.3, 1.0, 0.14, boardGrey, 0, 0, 0.07, BD); box(1.36, 0.05, 0.18, EM.rustSteel, 0, 0.52, 0.09, BD);
  var bdoor = box(0.02, 1.0, 0.66, boardGrey, 0.67, 0, 0.44, BD);                                                                          // its cover hangs open
  cyl(0.02, 0.02, 1.2, EM.steel, -0.4, -1.1, 0.05, BD, 6); cyl(0.02, 0.02, 0.7, EM.steel, 0.3, 0.85, 0.05, BD, 6);
  mesh(new THREE.PlaneGeometry(0.9, 0.08), std(0xffffff, 0.6, { map: textTex(['MAIN DISTRIBUTION · 415V'], 512, 44, '#d8d2c2', '#17140e', null, false) }), 0, 0.43, 0.1415, BD);
  E.brk = []; E.brkLamps = []; E.brkLabels = []; E.brkHit = [];
  var hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for (i = 0; i < 6; i++) {
    var bx2 = -0.4 + (i % 3) * 0.4, by2 = 0.18 - Math.floor(i / 3) * 0.44;
    box(0.2, 0.22, 0.03, dark, bx2, by2, 0.155, BD); box(0.06, 0.12, 0.02, std(0x101112, 0.5), bx2, by2, 0.172, BD);                       // breaker body and the slot the toggle moves in
    var hd = dyn(new THREE.Group()); hd.position.set(bx2, by2, 0.18); BD.add(hd);
    box(0.034, 0.075, 0.034, std(0xd8d2c2, 0.45), 0, 0.03, 0.025, hd); box(0.05, 0.03, 0.05, std(0x1c1c1c, 0.5), 0, 0.072, 0.03, hd); E.brk.push(hd);
    var bl = glow(0x1a0505); mesh(new THREE.CircleGeometry(0.014, 10), bl, bx2 + 0.075, by2 + 0.08, 0.172, BD); E.brkLamps.push(bl);
    var lab = livePanel(0.34, 0.11, 256, 82, bx2, by2 - 0.165, 0.1415, 0, BD); E.brkLabels.push(lab);
    mesh(new THREE.PlaneGeometry(0.05, 0.025), std(0xffffff, 0.6, { map: textTex(['ON'], 64, 32, '#101112', '#9ad8a8', null, false) }), bx2 + 0.055, by2 + 0.045, 0.172, BD);
    mesh(new THREE.PlaneGeometry(0.05, 0.025), std(0xffffff, 0.6, { map: textTex(['OFF'], 64, 32, '#101112', '#d89a9a', null, false) }), bx2 + 0.055, by2 - 0.045, 0.172, BD);
    var hit = mesh(new THREE.BoxGeometry(0.36, 0.4, 0.12), hitMat, bx2, by2 - 0.04, 0.2, BD); hit.userData.brk = i; E.brkHit.push(hit);       // what your aim picks
  }
  E.boardSpot = { x: -19.0, z: 125.25 };
  // workbench under the window side, with a vice and tools; shelf of junk; fuel drum; the bulb
  (function () {
    var WBG = new THREE.Group(); WBG.position.set(-17.1, 0, SZ1 + ST + 0.32); scene.add(WBG);
    box(1.3, 0.06, 0.6, std(0x5a4a38, 0.8, { map: woodTex }), 0, 0.9, 0, WBG); box(1.24, 0.03, 0.54, std(0x5a4a38, 0.8, { map: woodTex }), 0, 0.3, 0, WBG);
    [[-0.6, -0.26], [0.6, -0.26], [-0.6, 0.26], [0.6, 0.26]].forEach(function (l) { box(0.06, 0.88, 0.06, EM.rustSteel, l[0], 0.44, l[1], WBG); });
    box(0.14, 0.1, 0.12, EM.iron, -0.45, 0.98, 0.22, WBG); box(0.04, 0.04, 0.2, EM.steel, -0.45, 0.98, 0.34, WBG);                               // the vice
    var tl = box(0.26, 0.025, 0.05, std(0xa8231c, 0.5), 0.1, 0.94, 0.05, WBG); tl.rotation.y = 0.4; cyl(0.012, 0.012, 0.28, EM.steel, 0.35, 0.945, -0.1, WBG, 6).rotation.z = PI / 2;   // a spanner, a screwdriver
    box(0.4, 0.2, 0.22, std(0x8d1f18, 0.5, { metalness: 0.4 }), 0.35, 0.4, 0, WBG);                                                              // toolbox on the shelf
    boxes.push({ x1: -17.75, x2: -16.45, z1: SZ1 + ST, z2: SZ1 + ST + 0.64 });
  })();
  cyl(0.29, 0.29, 0.88, std(0x7a2a22, 0.6, { map: rustTex }), -21.2, 0.52, 129.2, null, 16); circles.push({ x: -21.2, z: 129.2, r: 0.36 });
  box(2.6, 0.04, 0.4, M.wood, -19.2, 1.2, 129.62); box(2.6, 0.04, 0.4, M.wood, -19.2, 1.75, 129.62); [-20.4, -18.0].forEach(function (x) { box(0.05, 1.8, 0.36, EM.rustSteel, x, 0.9, 129.62); });
  var junk = []; for (i = 0; i < 9; i++) junk.push([-20.2 + i * 0.26, (i % 2 ? 1.83 : 1.28) + 0.03, 129.6, 0.12 + (i % 3) * 0.05, 0.12 + (i % 4) * 0.04, 0.16, 0, i, 0]); inst(new THREE.BoxGeometry(1, 1, 1), EM.rustSteel, junk);
  boxes.push({ x1: -20.5, x2: -17.9, z1: 129.4, z2: 129.84 });
  cyl(0.004, 0.004, 0.42, dark, -19, SH - 0.22, 127, null, 3); E.shedBulb = basic(0x14110a); mesh(new THREE.SphereGeometry(0.05, 10, 8), E.shedBulb, -19, SH - 0.46, 127).userData.noCast = true;
  // the cable from the board out under the door to the plaza's cable protector
  box(0.05, 0.04, 2.6, EM.rubber, -18.2, 0.1, 125.6).userData.noCast = true; box(2.2, 0.04, 0.05, EM.rubber, -17.1, 0.1, 126.2).userData.noCast = true;

  // ---------- the diesel can: a 20-litre jerrycan ----------
  /* Pressed-steel body with rounded edges and the X stamped into each broad face, three carrying handles across the top, the
     spout on its cam-locked cap at the front corner, paint worn through on the edges.  Origin at the middle of its base;
     width along x, height up y, the spout at the +x top corner.  Built for the buggy's bed, the hand and the floor alike. */
  var CW2 = 0.345, CH2 = 0.47, CD2 = 0.165, CB = 0.014;
  var canShape = (function () { var s2 = new THREE.Shape(), w = CW2 / 2, h = CH2, r = 0.03; s2.moveTo(-w + r, 0); s2.lineTo(w - r, 0); s2.quadraticCurveTo(w, 0, w, r); s2.lineTo(w, h - r); s2.quadraticCurveTo(w, h, w - r, h); s2.lineTo(-w + r, h); s2.quadraticCurveTo(-w, h, -w, h - r); s2.lineTo(-w, r); s2.quadraticCurveTo(-w, 0, -w + r, 0); return s2; })();
  var canGeo = new THREE.ExtrudeGeometry(canShape, { depth: CD2 - 2 * CB, bevelEnabled: true, bevelThickness: CB, bevelSize: CB * 0.8, bevelSegments: 3, curveSegments: 6 });
  canGeo.translate(0, 0, -(CD2 - 2 * CB) / 2); canGeo.scale(1, (CH2 - 0.02) / CH2, 1); canGeo.translate(0, 0.012, 0);
  function canPaint(face, height) {
    return function (g, S) {
      if (height) {
        g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); if (!face) return;
        g.strokeStyle = '#b0b0b0'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(S * 0.16, S * 0.14); g.lineTo(S * 0.84, S * 0.86); g.moveTo(S * 0.84, S * 0.14); g.lineTo(S * 0.16, S * 0.86); g.stroke();   // the stamped X
        g.strokeStyle = '#a0a0a0'; g.lineWidth = 14; g.strokeRect(S * 0.07, S * 0.06, S * 0.86, S * 0.88);
        return;
      }
      g.fillStyle = '#9a2318'; g.fillRect(0, 0, S, S);
      if (face) { g.strokeStyle = 'rgba(40,6,4,.45)'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(S * 0.16, S * 0.14); g.lineTo(S * 0.84, S * 0.86); g.moveTo(S * 0.84, S * 0.14); g.lineTo(S * 0.16, S * 0.86); g.stroke(); g.strokeStyle = 'rgba(220,120,100,.35)'; g.lineWidth = 10; g.beginPath(); g.moveTo(S * 0.16, S * 0.13); g.lineTo(S * 0.84, S * 0.85); g.moveTo(S * 0.84, S * 0.13); g.lineTo(S * 0.16, S * 0.85); g.stroke(); }
      g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#7a1a12', '#b02a1c', '#5a1410'], 4000, 1.6)(g, S); g.globalAlpha = 1;
      E.chips(g, S, S, face ? 22 : 40, '#4a4a46'); E.chips(g, S, S, 10, '#6a3a1e');
      if (face) { g.strokeStyle = 'rgba(60,58,54,.7)'; g.lineWidth = 5; g.strokeRect(4, 4, S - 8, S - 8); }                                 // paint worn through along the edges
      E.grime(g, S, S, 0.9); blotch(g, S, ['#2a1a10', '#4a2a14'], 10, 10, 50, 0.35);
    };
  }
  var canFace = std(0xffffff, 0.5, { metalness: 0.3, map: canvasTex(256, canPaint(true, false)), normalMap: normalTex(256, canPaint(true, true), 4), normalScale: new THREE.Vector2(1.6, 1.6) });
  [canFace.map, canFace.normalMap].forEach(function (t) { t.repeat.set(1 / CW2, 1 / CH2); t.offset.set(0.5, 0); });
  var canSide = std(0xffffff, 0.5, { metalness: 0.3, map: canvasTex(128, canPaint(false, false)) }); canSide.map.repeat.set(3, 3);
  var canMetal = std(0x5a1c14, 0.5, { metalness: 0.45 }), canDark = std(0x2a2a28, 0.6, { metalness: 0.5 });
  var dieselDecal = std(0xffffff, 0.6, { transparent: true, depthWrite: false, map: canvasTex(256, function (g, S, HH) { g.clearRect(0, 0, S, HH); g.fillStyle = 'rgba(236,228,206,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 54px Impact, "Arial Black", sans-serif'; g.fillText('DIESEL', S / 2, HH / 2 + 2); g.globalCompositeOperation = 'destination-out'; for (var q = 0; q < 40; q++) { g.beginPath(); g.arc(Math.random() * S, Math.random() * HH, 1 + Math.random() * 3, 0, 7); g.fill(); } }, 1, 1, true, 80) });
  E.buildCan = function (parent) {
    var c = new THREE.Group();
    var body = new THREE.Mesh(canGeo, [canFace, canSide]); body.castShadow = true; c.add(body);
    mesh(new THREE.PlaneGeometry(0.2, 0.062), dieselDecal, 0, 0.36, CD2 / 2 + 0.0015, c);
    // three handles across the top, each a bar on two little posts
    [-0.095, -0.03, 0.035].forEach(function (hx) {
      var bar = cyl(0.0085, 0.0085, CD2 * 0.62, canMetal, hx, CH2 + 0.034, 0, c, 8); bar.rotation.x = PI / 2;
      [-1, 1].forEach(function (e) { box(0.012, 0.036, 0.014, canMetal, hx, CH2 + 0.016, e * CD2 * 0.28, c); });
    });
    // the spout: a short neck leaning out of the front corner, the cap on its cam lever
    var sp = new THREE.Group(); sp.position.set(0.12, CH2 - 0.002, 0); sp.rotation.z = -0.5; c.add(sp);
    cyl(0.024, 0.026, 0.036, canMetal, 0, 0.018, 0, sp, 14);
    var cap = new THREE.Group(); cap.position.set(-0.026, 0.036, 0); sp.add(cap); c.userData.cap = cap;                       // hinged on the inner side of the neck
    cyl(0.029, 0.029, 0.024, canDark, 0.026, 0.012, 0, cap, 14); box(0.06, 0.008, 0.016, canMetal, 0.05, 0.022, 0, cap);
    c.userData.spout = new THREE.Vector3(0.12 + Math.sin(0.5) * 0.04, CH2 - 0.002 + Math.cos(0.5) * 0.04, 0);                // the mouth of the neck, in the can's own space
    c.userData.grip = new THREE.Vector3(-0.03, CH2 + 0.034, 0);                                                                // the middle handle
    (parent || scene).add(c); return c;
  };

  // ---------- the park's utility buggy, parked by the service gate with the can in its bed ----------
  /* A two-seat electric utility car in the park's cream and green: a curved front cowl with headlamps, a bench seat on a
     box base, a steering wheel, a fibreglass roof on four posts, a cargo bed with drop sides and its tailgate let down, a
     coil of hose and a broom in the back.  One front tyre is flat.  Front faces local +z; it is parked facing the gate. */
  var BG = new THREE.Group(); BG.position.set(-12.0, 0, 121.0); BG.rotation.y = -PI / 2; scene.add(BG);
  var livery = std(0xffffff, 0.55, { metalness: 0.25, map: canvasTex(256, function (g, S) { g.fillStyle = '#cdbb7e'; g.fillRect(0, 0, S, S); g.fillStyle = '#2f5a3a'; g.fillRect(0, S * 0.62, S, S * 0.12); E.chips(g, S, S, 30, '#6a5a32'); E.chips(g, S, S, 12, '#3a2a18'); E.streaks(g, S, S, 20, 'rgba(70,50,20,.85)', S); E.grime(g, S, S, 1.3); g.fillStyle = 'rgba(70,56,30,.6)'; g.fillRect(0, S * 0.86, S, S * 0.14); }), bumpMap: bump(2), bumpScale: 0.01 });
  var vinylSeat = std(0x2a2522, 0.7, { map: canvasTex(128, function (g, S) { g.fillStyle = '#2e2824'; g.fillRect(0, 0, S, S); for (var q = 0; q < 4; q++) g.fillRect(0, q * 32 + 30, S, 2); g.fillStyle = '#7a6a4a'; g.beginPath(); g.moveTo(40, 30); g.lineTo(76, 46); g.lineTo(58, 74); g.closePath(); g.fill(); E.grime(g, S, S, 1); }) });
  var chassis = std(0x1a1b1c, 0.7, { metalness: 0.4 }), fibre = std(0xd8d2be, 0.6, { map: canvasTex(128, function (g, S) { g.fillStyle = '#d8d2be'; g.fillRect(0, 0, S, S); blotch(g, S, ['#3a4a2a', '#6a6250', '#2a2a20'], 20, 8, 40, 0.5); E.streaks(g, S, S, 12, 'rgba(40,40,30,.8)', S); }) });
  box(1.12, 0.12, 2.55, chassis, 0, 0.34, 0, BG);
  // wheels: tyre, rim, hub; the front right one flat
  [[-0.62, 0.86, 0], [0.62, 0.86, 1], [-0.62, -0.84, 0], [0.62, -0.84, 0]].forEach(function (w) {
    var flatT = w[2], R0 = 0.26, wy = flatT ? 0.2 : R0;
    var tyre = mesh(new THREE.TorusGeometry(R0 - 0.07, 0.075, 10, 22), EM.rubber, w[0], wy, w[1], BG); tyre.rotation.y = PI / 2; if (flatT) tyre.scale.set(1, 0.78, 1);
    var rim = cyl(0.13, 0.13, 0.15, std(0x9a9a92, 0.45, { metalness: 0.6 }), w[0], wy, w[1], BG, 16); rim.rotation.z = PI / 2;
    cyl(0.05, 0.05, 0.17, chassis, w[0], wy, w[1], BG, 10).rotation.z = PI / 2;
  });
  // the front cowl and its lamps, the bumper
  var cowl = box(1.18, 0.4, 0.62, livery, 0, 0.68, 1.02, BG); cowl.rotation.x = -0.12;
  box(1.14, 0.08, 0.5, livery, 0, 0.9, 0.9, BG).rotation.x = 0.22;
  box(1.24, 0.12, 0.1, chassis, 0, 0.42, 1.36, BG);
  [-0.38, 0.38].forEach(function (x) { cyl(0.065, 0.07, 0.05, chassis, x, 0.74, 1.335, BG, 14).rotation.x = PI / 2; mesh(new THREE.CircleGeometry(0.055, 14), std(0xbfc6c0, 0.1, { metalness: 0.6 }), x, 0.74, 1.362, BG); });
  mesh(new THREE.PlaneGeometry(0.9, 0.16), std(0xffffff, 0.7, { transparent: true, map: textTex(['FAMILY ZOO', 'MAINTENANCE'], 256, 70, '#cdbb7e', '#2f5a3a', null, false) }), 0, 0.62, 1.333, BG).userData.noCast = true;
  // floor, dash, steering
  box(1.14, 0.05, 0.75, chassis, 0, 0.46, 0.42, BG);
  var dash = box(1.12, 0.42, 0.06, livery, 0, 0.74, 0.74, BG); dash.rotation.x = -0.25;
  var col2 = cyl(0.018, 0.018, 0.5, chassis, -0.28, 0.9, 0.55, BG, 8); col2.rotation.x = -0.75;
  var wheel = mesh(new THREE.TorusGeometry(0.14, 0.014, 8, 20), chassis, -0.28, 1.08, 0.38, BG); wheel.rotation.x = 0.82;
  box(0.25, 0.012, 0.012, chassis, -0.28, 1.08, 0.38, BG).rotation.x = 0.82;
  // the seat: a box base, the cushion, the backrest
  box(1.12, 0.3, 0.5, livery, 0, 0.6, 0.02, BG); box(1.08, 0.12, 0.48, vinylSeat, 0, 0.81, 0.04, BG);
  var back = box(1.08, 0.42, 0.1, vinylSeat, 0, 1.06, -0.23, BG); back.rotation.x = -0.12;
  // roof on four posts
  [[-0.56, 0.62, -0.1], [0.56, 0.62, -0.1], [-0.56, -0.3, 0], [0.56, -0.3, 0]].forEach(function (p) { var pp = cyl(0.022, 0.022, 1.12, chassis, p[0], 1.36, p[1], BG, 8); pp.rotation.x = p[2]; });
  box(1.28, 0.05, 1.2, fibre, 0, 1.93, 0.18, BG); box(1.3, 0.08, 0.04, fibre, 0, 1.9, 0.78, BG); box(1.3, 0.08, 0.04, fibre, 0, 1.9, -0.42, BG);
  // the cargo bed: floor, front panel, drop sides, the tailgate let down
  var BEDY = 0.66;
  box(1.2, 0.05, 0.98, chassis, 0, BEDY, -0.82, BG);
  var bedSide = std(0xffffff, 0.6, { map: livery.map });
  box(1.2, 0.3, 0.04, bedSide, 0, BEDY + 0.17, -0.33, BG); [-0.6, 0.6].forEach(function (x) { box(0.04, 0.28, 0.98, bedSide, x, BEDY + 0.16, -0.82, BG); });
  var tg = box(1.2, 0.28, 0.035, bedSide, 0, BEDY - 0.13, -1.33, BG); tg.rotation.x = 0.25;
  [-0.4, 0.4].forEach(function (x) { mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), basic(0x2a0606), x, 0.6, -1.32, BG); });                      // tail lamps
  // a coil of hose and a broom in the bed (the can stands on the right)
  mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20), std(0x2f5a3a, 0.6), -0.25, BEDY + 0.05, -0.95, BG).rotation.x = PI / 2;
  mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 18), std(0x2f5a3a, 0.6), -0.25, BEDY + 0.1, -0.95, BG).rotation.x = PI / 2;
  var broom = cyl(0.012, 0.012, 1.3, M.wood, -0.05, BEDY + 0.12, -0.8, BG, 6); broom.rotation.set(PI / 2 - 0.1, 0, 0.15); box(0.3, 0.06, 0.07, std(0x3a2a18, 0.9), -0.12, BEDY + 0.12, -1.42, BG).rotation.y = 0.15;
  boxes.push({ x1: -13.4, x2: -10.6, z1: 120.35, z2: 121.65 });
  E.can = dyn(E.buildCan(BG)); E.can.position.set(0.3, BEDY + 0.025, -0.78); E.can.rotation.y = 0.12;
  BG.updateMatrixWorld(true);
  E.canSpot = (function () { var v = new THREE.Vector3(); E.can.getWorldPosition(v); return { x: v.x, z: v.z }; })();
  E.canGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,90,60,.5)', 'rgba(255,60,30,.12)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
  E.canGlow.position.set(E.canSpot.x, 1.0, E.canSpot.z); E.canGlow.scale.set(0.9, 0.9, 1); scene.add(dyn(E.canGlow));
  // the empty can, stood down beside the generator once it has been poured
  E.emptyCan = dyn(E.buildCan(scene)); E.emptyCan.position.set(-20.1, 0.075, 127.45); E.emptyCan.rotation.y = 0.2; E.emptyCan.visible = false;

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
  var doorA = 0, leverA = 0, runT = 0, capA = 0, sv = new THREE.Vector3(), nv = new THREE.Vector3();
  E.shopStep = function (dt, instant) {
    var N = P.ent, n, run = !!N.run, t = playTime;
    doorA = instant ? (N.door ? 1 : 0) : doorA + clamp((N.door ? 1 : 0) - doorA, -dt * 1.1, dt * 1.1);
    E.shedDoor.rotation.y = -easeIO(doorA) * 1.75; W.shedDoorBox.off = doorA > 0.5;
    E.can.visible = N.fuel === 0 && !E.canTaken; E.canGlow.visible = N.fuel === 0 && !E.canTaken; E.canGlow.material.opacity = 0.3 + 0.2 * Math.sin(t * 2.6);
    E.emptyCan.visible = N.fuel === 2 && !E.emptyInHand;
    E.genNeedle.rotation.x = lerp(0.95, -0.95, clamp(N.fuel === 2 ? 1 : N.pour || 0, 0, 1));
    // the filler cap: flips open (away from you, on its far hinge) while the can is at the neck, shut again once it is full
    var capWant = N.fuel === 1 && E.pouring ? 1 : 0; capA = instant ? capWant : damp(capA, capWant, 7, dt);
    E.genCap.rotation.z = easeIO(capA) * 2.45;
    leverA = instant ? (run ? 1 : 0) : damp(leverA, Math.max(run ? 1 : 0, N.crank || 0), 12, dt); E.genLever.rotation.z = -leverA * 1.2;
    runT = run ? runT + dt : 0;
    E.genShake.position.set(run ? Math.sin(t * 61) * 0.0025 : 0, run ? Math.sin(t * 47) * 0.002 : 0, 0);
    E.genLamp.color.setHex(run ? 0x35ff8a : N.stall > 0 ? (Math.sin(t * 20) > 0 ? 0xff3020 : 0x1a0505) : 0x1a0505);
    for (n = 0; n < 6; n++) { var on = N.brk[n]; E.brk[n].rotation.x = on ? -0.55 : 0.55; E.brkLamps[n].color.setHex(run && on ? 0x35ff8a : on ? 0x3a2a05 : 0x1a0505); }
    // the diesel stream, from the spout to the neck, while the can is tipped
    var sp = E.pourSpout && E.pourSpout(sv);
    if (sp && E.pouring && N.fuel === 1) {
      nv.copy(E.genNeck); nv.y += 0.02; var len = sv.distanceTo(nv);
      E.stream.visible = len > 0.01 && len < 0.4; E.stream.position.copy(sv).add(nv).multiplyScalar(0.5); E.stream.scale.set(1 + Math.sin(t * 31) * 0.15, Math.max(0.01, len), 1 + Math.sin(t * 27) * 0.15);
      E.stream.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, nv.sub(sv).normalize());
    } else E.stream.visible = false;
    // the check-in panel lives when the shop has power
    var live = !!P.pow0;
    E.kioskStrip.color.setHex(live ? (Math.sin(t * 3) > -0.9 ? 0x35ff8a : 0x0a1a10) : 0x0a1a10); E.kioskPad.color.setHex(live ? 0x9dffc0 : 0x0a1a10); E.kioskBezel.color.setHex(live ? 0x1f8a4a : 0x0a1a10);
    E.kioskLamps[0].color.setHex(live ? 0x1a0505 : (Math.sin(t * 2) > 0.6 ? 0xff3020 : 0x1a0505)); E.kioskLamps[1].color.setHex(live ? 0x35ff8a : 0x041a08);
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
