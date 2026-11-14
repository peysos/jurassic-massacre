/* Jurassic Massacre — extras: the things that make it a zoo, and a few more ways to die in one.
   Visitor information boards, the netted aviary with its keycard gate and the keeper who still has the card,
   the paddock kill and the pack feeding on it, rotting raptors, old bones, crows, portable toilets, food kiosks,
   a playground, building trim, desk computers at the save points, and the Field Guide on the menu.
   Everything static here is built before buildWorldLate(), so it is batched, shadowed and avoided by trees like the rest. */
'use strict';

var Extras = (function () {
  var E = {}, gate = 0, flocks = [], bloodT = 0, bloodTold = false, tearT = 3, guideEl = null, cardGlow = null, cardMesh = null, readerLamp = null, leaves = [], gateBox = null;
  var KEEPER = [1.4, -127.78], GATE = [-70.5, -90.0];
  function solid(x1, x2, z1, z2, sees) { var b = { x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2), solid: !sees }; boxes.push(b); return b; }
  function placed(x, z, rot, w, d, sees) { var q = Math.abs(Math.sin(rot)) > 0.7, hw = (q ? d : w) / 2, hd = (q ? w : d) / 2; return solid(x - hw, x + hw, z - hd, z + hd, sees); }
  function grp(x, z, rot) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  function label(lines, w, h, bg, fg, x, y, z, parent, rotY, pw) {
    var m = mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.75, { map: textTex(lines, pw || 256, Math.round((pw || 256) * h / w), bg, fg, null, false) }), x, y, z, parent); m.rotation.y = rotY || 0; m.userData.noCast = true; return m;
  }

  // ---------- visitor information boards ----------
  function posterTex(title, sci, lines, foot, accent) {
    return canvasTex(512, function (g, S, H) {
      g.fillStyle = '#10201a'; g.fillRect(0, 0, S, H); g.fillStyle = accent; g.fillRect(0, 0, S, 118);
      g.fillStyle = '#10201a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 62px Impact, "Arial Black", sans-serif'; g.fillText(title, S / 2, 56, S - 40);
      g.font = 'italic 21px Georgia, serif'; g.fillText(sci, S / 2, 100, S - 30);
      g.textAlign = 'left'; g.font = '25px "Trebuchet MS", Arial, sans-serif';
      lines.forEach(function (l, i) { g.fillStyle = accent; g.fillRect(34, 168 + i * 74, 9, 9); g.fillStyle = '#e4eee4'; var w = l.split(' '), row = '', y = 172 + i * 74; w.forEach(function (wd) { if (g.measureText(row + wd).width > S - 96) { g.fillText(row, 58, y); row = ''; y += 30; } row += wd + ' '; }); g.fillText(row, 58, y); });
      g.fillStyle = '#0a1410'; g.fillRect(0, H - 74, S, 74); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.font = 'bold 21px "Trebuchet MS", Arial, sans-serif'; g.fillText(foot, S / 2, H - 37, S - 30);
      g.strokeStyle = accent; g.lineWidth = 6; g.strokeRect(3, 3, S - 6, H - 6);
      blotch(g, S, ['#06100a', '#1a1408'], 9, 20, 70, 0.4);
    }, 1, 1, true, 640);
  }
  function infoBoard(x, z, rot, tex) {
    var g = grp(x, z, rot);
    box(2.3, 2.85, 0.12, M.wood, 0, 2.05, -0.07, g); mesh(new THREE.PlaneGeometry(2.1, 2.62), std(0xffffff, 0.6, { map: tex }), 0, 2.05, 0, g).userData.noCast = true;
    [-1.22, 1.22].forEach(function (px) { box(0.16, 3.6, 0.16, M.wood, px, 1.8, -0.08, g); box(0.3, 0.14, 0.3, M.dark, px, 0.07, -0.08, g); });
    var rf = box(3.0, 0.1, 0.9, M.roof, 0, 3.66, 0.05, g); rf.rotation.x = 0.18;
    circles.push({ x: x, z: z, r: 1.25 });
  }
  var P_RAPTOR = posterTex('VELOCIRAPTOR', 'Velociraptor mongoliensis  ·  Late Cretaceous, 75 million years ago', ['Fast, feathered pack hunters about the size of a wolf.', 'Each foot carries a 9 cm sickle claw, held clear of the ground.', 'Our pack hunts as a team: one holds your eye, the others flank.', 'Sharp ears. Please keep your voice down at the fence.'], 'FEEDING 11:00 & 15:30  ·  DO NOT TAP THE FENCE', '#8fc46a');
  var P_REX = posterTex('TYRANNOSAURUS', 'Tyrannosaurus rex  ·  Late Cretaceous, 68 million years ago', ['Twelve metres long and eight tonnes: the largest animal in the park.', 'Her eyes are tuned to movement. Keepers stand still when she looks.', 'She comes to the feeding call at the far platform.', 'She can hear a footstep from the other side of her kingdom.'], 'FEEDING 13:00  ·  STAY BEHIND THE YELLOW LINE', '#e0a04a');
  var P_PTERO = posterTex('PTERANODON', 'Pteranodon longiceps  ·  Late Cretaceous, 86 million years ago', ['Not a dinosaur: a flying reptile with a seven-metre wingspan.', 'She roosts high in the dome and dives on anything in the open.', 'Bright light dazzles her for a few seconds.', 'Please keep to the covered walkways at all times.'], 'KEEPER TALK 14:00  ·  STAFF KEYCARD AT THE GATE', '#7fb8e8');
  var P_PLES = posterTex('PLESIOSAUR', 'Elasmosaurus platyurus  ·  Late Cretaceous, 80 million years ago', ['A marine reptile: seventy-two vertebrae in the neck alone.', 'An ambush hunter. She waits below and strikes upward.', 'Fed by keepers from the catwalk, never from the poolside.', 'If you fall in, make for the slip ramps in the corners.'], 'FEEDING 12:00  ·  NEVER LEAN OVER THE RAIL', '#6fd0d8');
  var P_SEA = posterTex('ANCIENT SEAS', 'Life before the dinosaurs  ·  541 to 252 million years ago', ['Trilobites ruled the sea floor for 270 million years.', 'Ammonites swam by jet, like their cousins the squid.', 'Sea scorpions grew longer than a person.', 'Look for all of them in the tanks around this lobby.'], 'THE AQUARIUM  ·  PLESIOSAUR HALL AHEAD', '#6fd0d8');
  infoBoard(-53.5, 90.5, PI / 2, P_RAPTOR); infoBoard(46.5, -80.5, -PI / 2, P_REX); infoBoard(-58.5, -98.6, PI / 2, P_PTERO); infoBoard(69.5, 53.5, -PI / 2, P_PLES);
  E.posters = { ples: P_PLES, sea: P_SEA };                               // (the aquarium hangs these two inside: aquarium.js)

  // ---------- the aviary: netting all the way round, and a gate that wants a staff card ----------
  (function () {
    var gapA = Math.atan2(5, 29.6), A1 = gapA - 0.075, A2 = gapA + 0.075, i;
    function rim(a) { return [AV.x + Math.cos(a) * AV.r, AV.z + Math.sin(a) * AV.r]; }
    function net(pa, pb, y0, y1, block) {
      var dx = pb[0] - pa[0], dz = pb[1] - pa[1], len = Math.hypot(dx, dz), ry = -Math.atan2(dz, dx), m = M.chain.clone();
      m.map = chainTex.clone(); m.map.needsUpdate = true; m.map.repeat.set(len / 0.5, (y1 - y0) / 0.5);
      var p = mesh(new THREE.PlaneGeometry(len, y1 - y0), m, (pa[0] + pb[0]) / 2, (y0 + y1) / 2, (pa[1] + pb[1]) / 2); p.rotation.y = ry; p.userData.noCast = true;
      cyl(0.03, 0.03, len, M.metal, (pa[0] + pb[0]) / 2, y1, (pa[1] + pb[1]) / 2, null, 5).rotation.set(0, ry, PI / 2);
      if (block) for (var n = Math.ceil(len / 0.8), q = 0; q <= n; q++) { var x = pa[0] + dx * q / n, z = pa[1] + dz * q / n; solid(x - 0.22, x + 0.22, z - 0.22, z + 0.22, true); }
    }
    for (i = 2; i < 25; i++) net(rim(i / 26 * PI * 2), rim((i + 1) / 26 * PI * 2), 0, 7, true);
    var p1 = rim(A1), p2 = rim(A2);
    net(rim(25 / 26 * PI * 2), p1, 0, 7, true); net(p2, rim(2 / 26 * PI * 2), 0, 7, true); net(p1, p2, 3.5, 7, false);
    [p1, p2].forEach(function (p) { cyl(0.16, 0.2, 7, M.rust, p[0], 3.5, p[1], null, 8); cyl(0.4, 0.4, 0.25, M.concrete, p[0], 0.12, p[1], null, 10); circles.push({ x: p[0], z: p[1], r: 0.3 }); });
    box(0.2, 0.2, 4.7, M.rust, (p1[0] + p2[0]) / 2, 3.5, (p1[1] + p2[1]) / 2).rotation.y = -0.167;
    var th = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), gm = M.chain.clone(); gm.map = chainTex.clone(); gm.map.needsUpdate = true; gm.map.repeat.set(4.4, 6.6);
    [[p1, th, -1], [p2, th + PI, 1]].forEach(function (L) {
      var lf = dyn(new THREE.Group()); lf.position.set(L[0][0], 0, L[0][1]); lf.rotation.y = L[1]; scene.add(lf);
      mesh(new THREE.PlaneGeometry(2.2, 3.3), gm, 1.12, 1.72, 0, lf).userData.noCast = true;
      [0.07, 2.2].forEach(function (x) { box(0.07, 3.35, 0.07, M.metal, x, 1.7, 0, lf); }); [0.08, 1.7, 3.36].forEach(function (y) { box(2.2, 0.07, 0.07, M.metal, 1.12, y, 0, lf); });
      box(0.5, 0.36, 0.03, M.yellow, 1.5, 1.9, 0.045, lf); lf.userData = { base: L[1], dir: L[2] }; leaves.push(lf);
    });
    gateBox = solid(-71.35, -69.65, -92.3, -87.7, true); gateBox.off = false;
    box(0.22, 1.35, 0.22, M.dark, -69.8, 0.67, -86.9); box(0.3, 0.4, 0.12, M.metal, -69.74, 1.36, -86.9).rotation.y = PI / 2;
    readerLamp = basic(0xff3020, { fog: false }); mesh(new THREE.SphereGeometry(0.05, 8, 8), readerLamp, -69.66, 1.5, -86.9); box(0.02, 0.05, 0.16, basic(0x111111), -69.66, 1.3, -86.9);
    circles.push({ x: -69.8, z: -86.9, r: 0.3 });
    makeSign('STAFF KEYCARD REQUIRED', -68.6, -85.2, PI / 2, 3.6, 2.3, '#d9534a', true);
  })();

  // ---------- the keeper behind the north bunker ----------
  (function () {
    var g = grp(KEEPER[0], KEEPER[1], PI); buildKeeper(g);
    cardMesh = dyn(new THREE.Group()); cardMesh.position.set(KEEPER[0] - 0.02, 0.56, KEEPER[1] - 0.02); scene.add(cardMesh);
    var c = box(0.09, 0.13, 0.012, std(0xe9e6da, 0.4, { emissive: 0x666250, emissiveIntensity: 0.6 }), 0, 0, 0, cardMesh); c.rotation.x = 0.28; box(0.07, 0.03, 0.014, M.red, 0, 0.035, 0, cardMesh).rotation.x = 0.28;
    cardGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,240,200,.6)', 'rgba(255,220,150,.15)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.3 }));
    cardGlow.scale.set(0.6, 0.6, 1); cardMesh.add(cardGlow);
    circles.push({ x: KEEPER[0], z: KEEPER[1] - 0.1, r: 0.42 });
    (W.blood = W.blood || []).push([KEEPER[0], KEEPER[1] - 0.4, 0.8]);
  })();

  // ---------- the paddock kill: a Parasaurolophus, and the pack that brought it down ----------
  var CARC = [-98, 84, 0.7];
  (function () {
    var hide = std(0xffffff, 0.75, { map: skinTex('#6a6a48', '#2c2a1a', '#8a8a5e', '#b9b08a', 5), bumpMap: scales(8, 14), bumpScale: 0.02 }), meat = std(0x4a0c0c, 0.35), g = grp(CARC[0], CARC[1], CARC[2]), b = new THREE.Group(), k;
    b.rotation.z = PI / 2; b.position.set(1.3, 0.55, 0); g.add(b);                                                    // built standing, laid on its side
    tube([[0, 1.3, -3.0, 0.03, 0.03], [0, 1.34, -1.8, 0.26, 0.3], [0, 1.35, -0.5, 0.55, 0.7], [0, 1.3, 0.6, 0.5, 0.62], [0, 1.42, 1.3, 0.28, 0.33], [0, 1.72, 1.9, 0.17, 0.19], [0, 1.95, 2.32, 0.14, 0.16]], hide, b, 16, 5);
    tube([[0, 1.97, 2.2, 0.12, 0.14], [0, 1.95, 2.55, 0.13, 0.12], [0, 1.9, 2.95, 0.12, 0.07], [0, 1.88, 3.12, 0.05, 0.03]], hide, b, 12, 4);                    // the duck bill
    tube([[0, 2.06, 2.38, 0.06, 0.08], [0, 2.34, 1.95, 0.055, 0.075], [0, 2.6, 1.35, 0.04, 0.05], [0, 2.72, 0.85, 0.012, 0.012]], hide, b, 10, 5);            // the long hollow crest
    [[0.3, 0.5, 0.35], [-0.3, 0.5, -0.2], [0.34, -0.9, 0.5], [-0.34, -0.9, -0.3]].forEach(function (l) {
      var lg = new THREE.Group(); lg.position.set(l[0], 1.0, l[1]); lg.rotation.x = l[2]; b.add(lg);
      tube([[0, 0.1, 0, 0.16, 0.2], [0, -0.45, 0.05, 0.11, 0.13], [0, -0.95, 0, 0.07, 0.08], [0, -1.0, 0.12, 0.09, 0.05]], hide, lg, 10, 4);
    });
    mesh(sphGeo, meat, 0.36, 1.32, 0.05, b).scale.set(0.5, 1.0, 1.9);                                                 // the flank is open
    for (k = 0; k < 7; k++) { var rb = mesh(new THREE.TorusGeometry(0.56 - Math.abs(k - 3) * 0.035, 0.03, 5, 12, PI * 0.72), M.bone, 0, 1.36, -0.75 + k * 0.27, b); rb.rotation.z = -PI * 0.36; rb.scale.set(1, 1.2, 1); }
    mesh(new THREE.SphereGeometry(0.03, 6, 6), basic(0x0a0a0a), 0.115, 2.0, 2.42, b);
    var pool = mesh(new THREE.CircleGeometry(2.6, 18), M.blood, 0.9, 0.03, 0.2, g); pool.rotation.x = -PI / 2; pool.scale.set(1, 0.7, 1); pool.userData.noCast = true;
    for (k = 0; k < 5; k++) { var sp = mesh(new THREE.CircleGeometry(0.3 + srand() * 0.4, 9), M.blood, 2.2 + srand() * 2.6, 0.03, -1.5 + srand() * 3, g); sp.rotation.x = -PI / 2; sp.userData.noCast = true; }
    function world(lx, lz) { var c = Math.cos(CARC[2]), s = Math.sin(CARC[2]); return [CARC[0] + lx * c + lz * s, CARC[1] - lx * s + lz * c]; }
    [[0, 0, 1.25], [0.2, -1.6, 0.8], [0, 1.6, 0.9], [-0.2, 2.6, 0.5]].forEach(function (c) { var w = world(c[0], c[1]); circles.push({ x: w[0], z: w[1], r: c[2] }); });
    (W.blood = W.blood || []).push([world(1, 0.2)[0], world(1, 0.2)[1], 2.3]);
    var belly = world(0.6, 0), f1 = world(2.25, -0.5), f2 = world(2.2, 1.1);
    dinos[0].feed = [f1[0], f1[1], belly[0], belly[1]]; dinos[4].feed = [f2[0], f2[1], belly[0], belly[1]];
    dinos[0].hx = f1[0]; dinos[0].hz = f1[1]; dinos[4].hx = f2[0]; dinos[4].hz = f2[1];
  })();

  // ---------- some of the raptors have been dead a while ----------
  (function () {
    var rot = raptorSkin.clone(); rot.color.setHex(0x8f9486); var meat = std(0x3d0a0a, 0.4), sock = basic(0x050505);
    [1, 3, 5].forEach(function (ix, n) {
      var u = dinos[ix].mesh.userData, sd = n % 2 ? -1 : 1, k;
      dinos[ix].mesh.traverse(function (o) { if (o.isMesh && o.material === raptorSkin) o.material = rot; });
      part(sphGeo, meat, sd * 0.27, 1.44, 0.1, u.body, 0.2, 0.62, 0.95);                                              // a flank laid open to the ribs
      for (k = 0; k < 5; k++) { var rb = part(new THREE.TorusGeometry(0.37, 0.02, 5, 10, PI * 0.62), M.bone, 0, 1.45, -0.22 + k * 0.17, u.body); rb.rotation.z = sd > 0 ? -PI * 0.31 : PI * 0.69; rb.scale.set(1, 1.18, 1); }
      part(sphGeo, M.bone, sd * 0.12, 0.05, 0.16, u.head, 0.1, 0.24, 0.5); mesh(new THREE.SphereGeometry(0.045, 8, 8), sock, sd * 0.15, 0.085, 0.14, u.head);   // half the face is skull
      for (k = 0; k < 6; k++) part(new THREE.BoxGeometry(0.05, 0.05, 0.1), M.bone, 0, 0.06 + k * 0.006, -0.45 - k * 0.22, u.tail2);                              // and the tail is down to vertebrae
      part(new THREE.CylinderGeometry(0.03, 0.025, 0.5, 6), M.bone, 0, -0.28, -0.11, u.legs[n % 2].knee).rotation.x = -0.4;
    });
  })();

  // ---------- old bones in the grass ----------
  (function () {
    var s = 7919; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var n = 0, tries = 0; n < 22 && tries < 600; tries++) {
      var x = (r() * 2 - 1) * 138, z = (r() * 2 - 1) * 138, g, k;
      if (onPath(x, z, 2) || inBox(x, z, 1.5) || inRect(x, z, AQ, 3) || nearSafe(x, z, 4) || z > TURN_Z - 2 || dist(x, z, AV.x, AV.z) < AV.r + 2) continue;
      g = grp(x, z, r() * 6); n++;
      if (n % 3 === 0) { for (k = 0; k < 5; k++) { var rb = mesh(new THREE.TorusGeometry(0.42 - Math.abs(k - 2) * 0.05, 0.028, 5, 10, PI), M.bone, 0, 0, k * 0.24 - 0.5, g); rb.rotation.z = (r() - 0.5) * 0.3; } box(0.07, 0.07, 1.5, M.bone, 0, 0.02, 0, g); }
      else if (n % 3 === 1) { for (k = 0; k < 3; k++) { var bn = cyl(0.035, 0.045, 0.7 + r() * 0.5, M.bone, r() - 0.5, 0.04, r() - 0.5, g, 6); bn.rotation.set(0, r() * 6, PI / 2); mesh(sphGeo, M.bone, bn.position.x + Math.cos(bn.rotation.y) * 0.4, 0.05, bn.position.z - Math.sin(bn.rotation.y) * 0.4, g).scale.set(0.14, 0.11, 0.11); } }
      else { mesh(sphGeo, M.bone, 0, 0.13, 0, g).scale.set(0.36, 0.3, 0.44); var sn = cyl(0.07, 0.13, 0.42, M.bone, 0, 0.1, 0.36, g, 8); sn.rotation.x = PI / 2;
        [-1, 1].forEach(function (sd) { mesh(new THREE.SphereGeometry(0.05, 6, 6), basic(0x050505), sd * 0.13, 0.17, 0.12, g); }); for (k = 0; k < 4; k++) cyl(0.05, 0.05, 0.08, M.bone, 0, 0.05, -0.3 - k * 0.14, g, 6).rotation.x = PI / 2; }
    }
  })();

  // ---------- crows: they go up when you come near, and everything hears them go ----------
  (function () {
    var black = std(0x0c0c0f, 0.6), beak = std(0x2a2a2a, 0.5);
    [[8, 100], [-12, 62], [22, 18], [-24, -40], [30, -80], [-42, 80], [58, 56], [-70, -10], [12, -112], [-30, 30]].forEach(function (sp, f) {
      var fl = { x: sp[0], z: sp[1], birds: [], state: 0, t: 0 };
      for (var n = 0; n < 3 + (f % 3); n++) {
        var g = dyn(new THREE.Group()), bx = sp[0] + (srand() - 0.5) * 2.6, bz = sp[1] + (srand() - 0.5) * 2.6;
        mesh(sphGeo, black, 0, 0.1, 0, g).scale.set(0.15, 0.14, 0.3); mesh(sphGeo, black, 0, 0.19, 0.12, g).scale.set(0.1, 0.1, 0.12);
        mesh(new THREE.ConeGeometry(0.02, 0.09, 5), beak, 0, 0.18, 0.2, g).rotation.x = PI / 2; mesh(new THREE.ConeGeometry(0.05, 0.2, 4), black, 0, 0.09, -0.2, g).rotation.x = -PI / 2;
        var wings = [-1, 1].map(function (sd) { var w = new THREE.Group(); w.position.set(sd * 0.05, 0.13, 0); g.add(w); var m = mesh(new THREE.PlaneGeometry(0.34, 0.2), std(0x0c0c0f, 0.6, { side: THREE.DoubleSide }), sd * 0.17, 0, -0.02, w); m.rotation.x = -PI / 2; return w; });
        g.position.set(bx, 0, bz); g.rotation.y = srand() * 6; scene.add(g);
        fl.birds.push({ g: g, wings: wings, hx: bx, hz: bz, rot: g.rotation.y, delay: n * 0.12, vx: 0, vy: 0, vz: 0, ph: srand() * 6 });
      }
      flocks.push(fl);
    });
  })();

  // ---------- portable toilets ----------
  (function () {
    var shell = std(0x1f6f78, 0.45, { bumpMap: bump(2), bumpScale: 0.01 }), lid = std(0xcfd6d2, 0.6), doorM = std(0x2a8a94, 0.45);
    function potty(x, z, rot, tipped) {
      var g = grp(x, z, rot), b = new THREE.Group(); g.add(b);
      box(1.15, 2.1, 1.15, shell, 0, 1.13, 0, b); box(1.25, 0.1, 1.25, lid, 0, 2.24, 0, b); box(1.0, 0.1, 1.0, lid, 0, 2.32, 0, b); box(1.3, 0.1, 1.3, M.dark, 0, 0.05, 0, b);
      box(0.8, 1.85, 0.04, doorM, -0.04, 1.08, 0.59, b); box(0.06, 1.9, 0.06, shell, 0.4, 1.1, 0.6, b); box(0.1, 0.16, 0.05, lid, 0.3, 1.15, 0.62, b); box(0.06, 0.06, 0.03, M.red, 0.3, 1.19, 0.65, b);
      [-0.3, -0.15, 0, 0.15, 0.3].forEach(function (o) { box(0.6, 0.02, 0.02, M.dark, -0.04, 1.8 + o * 0.25, 0.615, b); });       // vent slats
      [-1, 1].forEach(function (sd) { [-0.3, 0, 0.3].forEach(function (o) { box(0.02, 1.7, 0.08, doorM, sd * 0.585, 1.15, o, b); }); });
      cyl(0.05, 0.05, 0.5, M.dark, 0.38, 2.55, -0.38, b, 8);
      label(['TOILET'], 0.5, 0.16, '#e9e6da', '#1f6f78', -0.04, 1.62, 0.615, b);
      if (tipped) { b.rotation.x = -PI / 2 + 0.06; b.position.set(0, 0.6, 1.1); circles.push({ x: x, z: z, r: 1.0 }); } else placed(x, z, rot, 1.2, 1.2);
    }
    [[44, 88, 0], [45.4, 88, 0], [46.8, 88, 0, 1], [-63, 13, PI / 2], [-63, 14.4, PI / 2], [33, -78.5, PI], [34.4, -78.5, PI], [35.8, -78.5, PI]].forEach(function (p) { potty(p[0], p[1], p[2], p[3]); });
  })();

  // ---------- food kiosks, left the way the last shift dropped them ----------
  (function () {
    var awn = canvasTex(64, function (c, S) { for (var q = 0; q < 8; q++) { c.fillStyle = q % 2 ? '#d8d2c2' : '#8f1d18'; c.fillRect(q * 8, 0, 8, S); } blotch(c, S, ['#2a2418'], 6, 6, 20, 0.5); }, 2, 1);
    var steel = std(0x8a9298, 0.35, { metalness: 0.8, map: metalTex }), slat = canvasTex(64, function (c, S) { for (var q = 0; q < 8; q++) { var gr = c.createLinearGradient(0, q * 8, 0, q * 8 + 8); gr.addColorStop(0, '#9aa2a8'); gr.addColorStop(1, '#3a4046'); c.fillStyle = gr; c.fillRect(0, q * 8, S, 8); } blotch(c, S, ['#5a3018'], 5, 5, 14, 0.5); }, 1, 2);
    function menuTex(name, rows) {
      return canvasTex(256, function (g, S) {
        g.fillStyle = '#141414'; g.fillRect(0, 0, S, S); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.font = 'bold 30px Impact, "Arial Black", sans-serif'; g.fillText(name, S / 2, 36, S - 16);
        g.font = '17px "Trebuchet MS", Arial'; rows.forEach(function (r, i) { g.textAlign = 'left'; g.fillStyle = '#efe9d8'; g.fillText(r[0], 16, 78 + i * 29); g.textAlign = 'right'; g.fillStyle = '#e2b93b'; g.fillText(r[1], S - 16, 78 + i * 29); });
        blotch(g, S, ['#3a0808'], 3, 8, 30, 0.5);
      });
    }
    function kiosk(x, z, rot, name, rows) {
      var g = grp(x, z, rot), wall = retile(M.plank, 2, 1.2), k;
      box(4.2, 0.12, 3.2, M.concrete, 0, 0.06, 0, g);
      box(4.0, 2.7, 0.14, wall, 0, 1.47, -1.43, g); [-1.93, 1.93].forEach(function (sx) { box(0.14, 2.7, 2.86, wall, sx, 1.47, 0, g); });
      box(4.0, 1.0, 0.14, wall, 0, 0.62, 1.43, g); box(4.3, 0.07, 0.6, steel, 0, 1.15, 1.6, g);                                   // counter
      box(4.0, 0.5, 0.14, wall, 0, 2.57, 1.43, g); box(0.14, 1.2, 0.14, wall, 0, 1.72, 1.43, g);                                   // header and a mullion
      mesh(new THREE.PlaneGeometry(1.85, 0.75), std(0xffffff, 0.5, { map: slat, metalness: 0.6 }), -0.98, 1.95, 1.5, g).userData.noCast = true;  // one shutter jammed half down
      box(4.5, 0.14, 3.6, M.roof, 0, 2.89, 0.1, g); var aw = box(4.4, 0.06, 1.5, std(0xffffff, 0.9, { map: awn }), 0, 2.5, 2.1, g); aw.rotation.x = 0.3;
      [-2.1, 2.1].forEach(function (sx) { cyl(0.025, 0.025, 1.4, M.metal, sx, 2.2, 2.2, g, 5).rotation.x = -0.9; });
      label([name], 3.4, 0.55, '#8f1d18', '#f6e9c0', 0, 3.25, 1.52, g, 0, 512); box(3.6, 0.7, 0.1, M.dark, 0, 3.25, 1.45, g);
      mesh(new THREE.PlaneGeometry(1.3, 1.3), std(0xffffff, 0.7, { map: menuTex(name, rows) }), 0.95, 1.9, -1.35, g).userData.noCast = true;       // menu board on the back wall
      box(0.9, 1.1, 0.7, steel, -1.3, 0.67, -0.95, g); box(0.8, 0.5, 0.6, M.dark, -1.3, 1.47, -0.95, g);                           // fryer and its hood
      box(0.6, 1.5, 0.6, std(0xb0281e, 0.5), 1.45, 0.87, -0.95, g); label(['DINO', 'COLA'], 0.5, 0.5, '#b0281e', '#ffffff', 1.45, 1.2, -0.64, g);  // drinks fridge
      box(0.24, 0.3, 0.16, steel, 1.2, 1.33, 1.55, g); [[0.7, 0xb0281e], [0.52, 0xd9a514]].forEach(function (b) { cyl(0.035, 0.04, 0.2, std(b[1], 0.5), b[0], 1.29, 1.6, g, 8); mesh(new THREE.ConeGeometry(0.02, 0.07, 6), std(b[1], 0.5), b[0], 1.42, 1.6, g); });
      for (k = 0; k < 5; k++) { var cup = cyl(0.045, 0.035, 0.12, M.white, -1.6 + k * 0.5 + srand() * 0.3, k % 2 ? 1.21 : 0.05, k % 2 ? 1.62 : 2.3 + srand(), g, 8); if (!(k % 2) || k === 3) cup.rotation.z = PI / 2; }
      var stool = new THREE.Group(); stool.position.set(2.7, 0.2, 2.3); stool.rotation.set(0, 0.6, PI / 2); g.add(stool); cyl(0.2, 0.2, 0.05, M.dark, 0, 0.38, 0, stool, 12); cyl(0.03, 0.03, 0.75, M.metal, 0, 0, 0, stool, 6); cyl(0.2, 0.2, 0.03, M.metal, 0, -0.38, 0, stool, 10);
      label(['CLOSED'], 0.7, 0.26, '#e9e6da', '#8f1d18', 0.98, 2.15, 1.52, g, 0).rotation.z = 0.12;
      var tray = box(0.5, 0.03, 0.34, std(0x7a2a22, 0.6), -0.3, 1.2, 1.62, g); tray.rotation.y = 0.3;
      placed(x, z, rot, 4.2, 3.3);
    }
    kiosk(22, 47.5, 0, 'DINO BITES', [['Raptor dog', '4.50'], ['T-Rex burger', '7.00'], ['Ptero wings', '6.00'], ['Dino nuggets', '5.00'], ['Fossil fries', '3.00'], ['Swamp slush', '2.50']]);
    kiosk(19, 13, -PI / 2, 'JURASSIC GRILL', [['Brontoburger', '8.00'], ['Tri-tip top', '9.50'], ['Meteor melt', '6.50'], ['Lava wings', '6.00'], ['Bone broth', '3.50'], ['Tar pit cola', '2.50']]);
    kiosk(24, -79.5, PI, 'ICE AGE ICES', [['Mammoth cone', '3.50'], ['Glacier float', '4.00'], ['Sabre sundae', '5.50'], ['Tundra bar', '2.50'], ['Frost bites', '3.00'], ['Meltwater', '1.50']]);
  })();

  // ---------- a playground nobody has used in twelve years ----------
  (function () {
    var g = grp(-30, 57, 0.2), red = std(0x8f2a22, 0.6), blue = std(0x2a4f8a, 0.6), k;
    mesh(new THREE.CircleGeometry(6.2, 22), std(0x5a4a34, 1, { bumpMap: bump(6), bumpScale: 0.06 }), 0, 0.03, 0, g).rotation.x = -PI / 2;
    [-1.6, 1.6].forEach(function (x) { [-0.9, 0.9].forEach(function (z) { var p = cyl(0.05, 0.05, 2.7, M.rust, x, 1.3, -2.6 + z, g, 6); p.rotation.x = z * 0.32; }); });
    cyl(0.05, 0.05, 3.4, M.rust, 0, 2.55, -2.6, g, 6).rotation.z = PI / 2;
    [-0.7, 0.7].forEach(function (x, n) { var sw = new THREE.Group(); sw.position.set(x, 2.55, -2.6); sw.rotation.x = n ? 0.22 : -0.1; g.add(sw); [-0.2, 0.2].forEach(function (o) { cyl(0.012, 0.012, n ? 1.9 : 1.2, M.metal, o, n ? -0.95 : -0.6, 0, sw, 4); }); if (n) box(0.5, 0.04, 0.2, M.rubber, 0, -1.9, 0, sw); });   // one swing has lost its seat
    box(1.2, 0.1, 1.2, M.plank, 3, 1.5, 1.5, g); [[2.45, 0.95], [3.55, 0.95], [2.45, 2.05], [3.55, 2.05]].forEach(function (p) { box(0.1, 1.5, 0.1, M.wood, p[0], 0.75, p[1], g); });
    var sl = box(0.7, 0.05, 2.9, red, 3, 0.78, -0.35, g); sl.rotation.x = -0.52; [-0.36, 0.36].forEach(function (o) { box(0.04, 0.2, 2.9, red, 3 + o, 0.88, -0.35, g).rotation.x = -0.52; });
    for (k = 0; k < 4; k++) box(0.5, 0.04, 0.06, M.metal, 3, 0.3 + k * 0.33, 2.25 + k * 0.08, g);
    var rider = new THREE.Group(); rider.position.set(-2.8, 0, 1.8); rider.rotation.set(0.1, 0.8, 0.14); g.add(rider);                    // a spring rider shaped like a triceratops
    cyl(0.1, 0.1, 0.4, M.metal, 0, 0.2, 0, rider, 8); mesh(sphGeo, blue, 0, 0.62, 0, rider).scale.set(0.4, 0.4, 0.95); mesh(sphGeo, blue, 0, 0.7, 0.5, rider).scale.set(0.36, 0.36, 0.4);
    [-1, 1].forEach(function (sd) { mesh(new THREE.ConeGeometry(0.035, 0.22, 6), M.white, sd * 0.1, 0.86, 0.62, rider).rotation.x = 0.7; }); box(0.5, 0.03, 0.03, M.metal, 0, 0.82, 0.25, rider);
    makeSign('LITTLE DIGGERS PLAY AREA', -30 + 5.6, 57 + 5.2, 0.2, 4.4, 0, '#e8e2d0');
    [[-1.4, -2.6], [1.8, -2.6], [3.2, 1.5], [3.2, -0.6], [-2.6, 2.0]].forEach(function (c) { var a = 0.2, cx = -30 + c[0] * Math.cos(a) + c[1] * Math.sin(a), cz = 57 - c[0] * Math.sin(a) + c[1] * Math.cos(a); circles.push({ x: cx, z: cz, r: 0.75 }); });
  })();

  // ---------- trim on the buildings that were bare boxes ----------
  (function () {
    var k, pipe = M.metal, planter = std(0x4a4338, 0.95, { bumpMap: bump(2), bumpScale: 0.04 }), dead = std(0x3a3222, 1), acM = std(0x8f9698, 0.5, { metalness: 0.5, map: metalTex });
    function ac(x, y, z) { box(1.3, 0.8, 0.9, acM, x, y + 0.4, z); cyl(0.3, 0.3, 0.04, M.dark, x, y + 0.82, z, null, 12); box(1.34, 0.06, 0.94, M.dark, x, y + 0.03, z); }
    function shrub(x, z, g) { for (var q = 0; q < 6; q++) { var tw = cyl(0.008, 0.02, 0.5 + srand() * 0.5, dead, x + (srand() - 0.5) * 0.5, 0.75, z + (srand() - 0.5) * 0.3, g, 4); tw.rotation.set((srand() - 0.5) * 0.9, 0, (srand() - 0.5) * 0.9); } }
    // visitor center: planters, roof plant, downpipes, opening hours, a donation dinosaur
    [-27.5, -16.5].forEach(function (z) { box(1.0, 0.5, 2.6, planter, -9.4, 0.25, z + (z < -22 ? 2.6 : -2.6)); shrub(-9.4, z + (z < -22 ? 2.6 : -2.6)); solid(-9.9, -8.9, z + (z < -22 ? 1.3 : -3.9), z + (z < -22 ? 3.9 : -1.3), true); });
    ac(-26, 7.0, -24); ac(-20, 7.0, -19); cyl(0.25, 0.25, 1.1, pipe, -29, 7.5, -20, null, 10);
    [-28.6, -15.4].forEach(function (z) { cyl(0.06, 0.06, 6, pipe, -11.92, 3, z, null, 6); box(0.2, 0.14, 0.2, pipe, -11.9, 5.95, z); });
    label(['OPEN DAILY', '9:00 — 17:30', 'LAST ENTRY 16:30'], 1.1, 0.9, '#254a30', '#ece3c4', -11.93, 1.6, -24.7, null, PI / 2);
    label(['TODAY', 'RAPTOR FEED 11:00', 'PLESIOSAUR 12:00', 'T-REX 13:00', 'KEEPER TALK 14:00'], 1.5, 1.5, '#17140e', '#e2b93b', -11.93, 1.3, -19.35, null, PI / 2, 320);
    box(0.5, 0.9, 0.5, M.dark, -9.2, 0.45, -14.2); mesh(sphGeo, std(0x4a7a3a, 0.5), -9.2, 1.1, -14.2).scale.set(0.34, 0.4, 0.6); label(['FEED THE', 'DINO FUND'], 0.44, 0.3, '#e2b93b', '#17140e', -8.94, 0.6, -14.2, null, PI / 2);
    circles.push({ x: -9.2, z: -14.2, r: 0.4 });
    // restrooms: signs on the doors, a light, a gutter, sinks you can see through the door that will not shut
    label(['WOMEN'], 0.8, 0.26, '#e9e6da', '#254a30', -20, 2.5, -66.955); label(['MEN'], 0.8, 0.26, '#e9e6da', '#254a30', -16, 2.5, -66.955);
    box(8.2, 0.12, 0.16, pipe, -18, 3.42, -66.9); cyl(0.05, 0.05, 3.4, pipe, -13.95, 1.7, -66.9, null, 6); cyl(0.05, 0.05, 3.4, pipe, -22.05, 1.7, -66.9, null, 6);
    box(0.5, 0.12, 0.2, M.dark, -18, 3.05, -66.86); mesh(new THREE.SphereGeometry(0.09, 8, 8), basic(0x3a3a30), -18, 2.95, -66.82);
    [-21.2, -14.8].forEach(function (x) { box(0.9, 0.5, 0.5, planter, x, 0.25, -66.6); shrub(x, -66.6); });
    box(1.5, 0.06, 0.5, M.white, -18, 0.85, -66.72); cyl(0.02, 0.02, 0.24, pipe, -18, 1.0, -66.82, null, 5);                           // an outside wash trough
    label(['BABY CHANGE', 'INSIDE'], 0.6, 0.3, '#2a4f8a', '#ffffff', -18, 2.2, -66.955);
    // gift-shop corner and the aquarium get roof plant; the aquarium a ticket rail and opening times
    for (k = 0; k < 4; k++) { cyl(0.04, 0.04, 1.0, pipe, 70.2 - k * 1.4, 0.5, 57.4, null, 6); cyl(0.04, 0.04, 1.0, pipe, 70.2 - k * 1.4, 0.5, 62.6, null, 6); }
    [57.4, 62.6].forEach(function (z) { box(4.3, 0.04, 0.04, std(0x8f1d18, 0.7), 68.1, 0.95, z); });                                    // queue ropes
    // drinking fountains and a first-aid point on the main path
    [[5.4, 82], [-5.4, -20], [5.4, -62]].forEach(function (p) { cyl(0.16, 0.2, 0.95, M.concrete, p[0], 0.47, p[1], null, 10); cyl(0.24, 0.16, 0.1, steelish(), p[0], 0.99, p[1], null, 12); cyl(0.015, 0.015, 0.12, pipe, p[0] + 0.08, 1.08, p[1], null, 5); circles.push({ x: p[0], z: p[1], r: 0.3 }); });
    function steelish() { return acM; }
    box(0.5, 0.6, 0.18, M.white, -5.5, 1.5, 104.5); label(['+', 'FIRST AID'], 0.44, 0.52, '#ffffff', '#b0281e', -5.4, 1.5, 104.5, null, PI / 2); cyl(0.05, 0.06, 1.9, pipe, -5.56, 0.95, 104.5, null, 6); circles.push({ x: -5.56, z: 104.5, r: 0.25 });
  })();

  // ---------- desk computers at the save points ----------
  (function () {
    var beige = std(0xb9b29c, 0.7, { bumpMap: bump(2), bumpScale: 0.01 }), HZ = 3.2;
    [[SAFE[1], 2], [SAFE[2], 1], [SAFE[3], 3], [SAFE[4], 0]].forEach(function (s) {
      var g = grp(s[0].x, s[0].z, s[1] * PI / 2);
      box(0.2, 0.44, 0.46, beige, 0.56, 1.05, -HZ + 0.62, g); box(0.16, 0.02, 0.1, M.dark, 0.56, 1.13, -HZ + 0.86, g); mesh(new THREE.SphereGeometry(0.012, 6, 6), basic(0x35ff8a), 0.52, 0.95, -HZ + 0.855, g);   // tower, drive slot, power light
      box(0.07, 0.03, 0.11, beige, 0.42, 0.85, -HZ + 1.0, g); box(0.6, 0.004, 0.32, M.rubber, 0, 0.832, -HZ + 0.98, g);                          // mouse and desk mat
      box(0.52, 0.03, 0.2, beige, 0, 0.87, -HZ + 0.98, g);                                                                                          // a proper keyboard over the old pad
      cyl(0.07, 0.09, 0.03, M.dark, -0.62, 0.845, -HZ + 0.6, g, 10); cyl(0.012, 0.012, 0.36, M.dark, -0.62, 1.02, -HZ + 0.6, g, 5); mesh(new THREE.ConeGeometry(0.1, 0.14, 10, 1, true), std(0x2f5a3a, 0.6, { side: THREE.DoubleSide }), -0.62, 1.22, -HZ + 0.64, g).rotation.x = 0.5;   // desk lamp
      label(['RANGER NET', 'SAVE POINT'], 0.5, 0.2, '#254a30', '#e2b93b', 0, 0.62, -HZ + 1.115, g);
    });
    var t = TERMS[5], g2 = grp(t.tx + 1.25, t.tz, -PI / 2);                                                                                         // aquarium lobby: a staff desk beside the terminal
    box(1.3, 0.06, 0.7, M.wood, 0, 0.78, 0, g2); [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(function (l) { box(0.06, 0.76, 0.06, M.wood, l[0], 0.38, l[1], g2); });
    box(0.5, 0.42, 0.44, beige, -0.2, 1.03, -0.05, g2); mesh(new THREE.PlaneGeometry(0.4, 0.3), basic(0x0c3020, { map: WB.termTex }), -0.2, 1.04, 0.172, g2);
    box(0.5, 0.03, 0.2, beige, -0.2, 0.83, 0.24, g2); box(0.2, 0.44, 0.46, beige, 0.42, 1.03, -0.05, g2); box(0.07, 0.03, 0.11, beige, 0.2, 0.83, 0.26, g2);
    circles.push({ x: t.tx + 1.25, z: t.tz, r: 0.7 });
  })();

  // ---------- per-frame ----------
  E.step = function (dt, instant) {
    var open = !!P.aviOpen; gate = instant ? (open ? 1 : 0) : gate + clamp((open ? 1 : 0) - gate, -dt * 0.5, dt * 0.5);
    leaves.forEach(function (l) { l.rotation.y = l.userData.base + l.userData.dir * 1.35 * easeIO(gate); });
    gateBox.off = gate > 0.75; readerLamp.color.setHex(open ? 0x35ff8a : 0xff3020);
    cardMesh.visible = !P.card;
  };
  E.update = function (dt, c, speed) {
    var px = player.x, pz = player.z, i, f, b, k;
    if (!P.card) cardGlow.material.opacity = 0.22 + 0.12 * Math.sin(playTime * 2.6);
    // blood underfoot: wet, loud, and it carries
    bloodT -= dt;
    if (speed > 0.8 && player.grounded && bloodT <= 0 && W.blood) for (i = 0; i < W.blood.length; i++) {
      b = W.blood[i]; if (dist(px, pz, b[0], b[1]) > b[2]) continue;
      bloodT = c.sprint ? 0.3 : 0.48; Sound.noise(0.16, 520, 0.38); Sound.noise(0.09, 2600, 0.2, 0.04); Sound.tone(150, 70, 0.1, 0.18, 'sine');
      makeNoise(px, pz, c.sprint ? 34 : 26);
      if (!bloodTold) { bloodTold = true; showMsg('Blood. It sucks at your boots, and the sound carries.', 4); }
      break;
    }
    // the pack at the kill
    tearT -= dt;
    if (tearT <= 0) { tearT = 1.6 + Math.random() * 2.2; if (!P.esc && dist(px, pz, CARC[0], CARC[1]) < 34 && (dinos[0].state === 'patrol' || dinos[4].state === 'patrol')) { var v = clamp(1 - dist(px, pz, CARC[0], CARC[1]) / 34, 0.1, 1); Sound.noise(0.3, 900, 0.3 * v); Sound.noise(0.16, 2600, 0.16 * v, 0.12); if (Math.random() < 0.3) Sound.growl(v * 0.7); } }
    // crows
    for (i = 0; i < flocks.length; i++) {
      f = flocks[i];
      if (f.state === 0) {
        if (dist(px, pz, f.x, f.z) < (c.crouch ? 5 : 9.5)) { f.state = 1; f.t = 0; Sound.rustle(); Sound.tone(760, 520, 0.16, 0.14, 'sawtooth'); Sound.tone(700, 480, 0.18, 0.12, 'sawtooth', 0.22); Sound.tone(820, 540, 0.14, 0.1, 'sawtooth', 0.5); makeNoise(f.x, f.z, 20); }
        else for (k = 0; k < f.birds.length; k++) { b = f.birds[k]; b.g.rotation.x = Math.max(0, Math.sin(playTime * 1.7 + b.ph * 3)) > 0.93 ? 0.5 : 0; }                // now and then one pecks
      } else if (f.state === 1) {
        f.t += dt;
        for (k = 0; k < f.birds.length; k++) {
          b = f.birds[k]; if (f.t < b.delay) continue;
          if (!b.vy) { var ax = b.hx - px, az = b.hz - pz, al = Math.hypot(ax, az) || 1, sw = (Math.sin(b.ph * 7) * 0.7); b.vx = (ax / al + sw * az / al) * 7.5; b.vz = (az / al - sw * ax / al) * 7.5; b.vy = 4.2 + (b.ph % 1.5); b.g.rotation.x = -0.35; }
          b.g.position.x += b.vx * dt; b.g.position.y += b.vy * dt; b.g.position.z += b.vz * dt; b.g.rotation.y = Math.atan2(b.vx, b.vz);
          var fl = Math.sin((f.t - b.delay) * 26 + b.ph); b.wings[0].rotation.z = -fl * 0.95; b.wings[1].rotation.z = fl * 0.95;
        }
        if (f.t > 7) { f.state = 2; f.t = 0; f.birds.forEach(function (q) { q.g.visible = false; }); }
      } else { f.t += dt; if (f.t > 55 && dist(px, pz, f.x, f.z) > 48) { f.state = 0; f.birds.forEach(function (q) { q.vy = 0; q.g.visible = true; q.g.position.set(q.hx, 0, q.hz); q.g.rotation.set(0, q.rot, 0); q.wings[0].rotation.z = q.wings[1].rotation.z = 0; }); } }
    }
  };
  E.reset = function () { bloodTold = false; flocks.forEach(function (f) { f.state = 2; f.t = 99; }); };
  E.interact = function (px, pz) {
    if (!P.card && dist(px, pz, KEEPER[0], KEEPER[1] - 0.6) < 2.1) return { text: '[E] Take the keycard from the keeper’s lanyard', fn: function () {
      P.card = true; Sound.pickup(); Sound.click(); showMsg('STAFF KEYCARD — “M. VOSS, HEAD KEEPER”.  The aviary gate will take it.', 5.5);
    } };
    if (!P.aviOpen && dist(px, pz, GATE[0], GATE[1]) < 3.6) return P.card ? { text: '[E] Scan the keycard at the aviary gate', fn: function () {
      P.aviOpen = true; Sound.tone(880, 1320, 0.14, 0.2, 'square'); Sound.clunk(); Sound.grind(); showMsg('The reader blinks green and the gate rattles open. Keep under the covers in there.', 5);
    } } : { text: 'The aviary gate is locked. The reader wants a staff keycard.', fn: function () { Sound.deny(); showMsg('ACCESS DENIED. A keeper would carry a card — the staff shelter is at the north end of this sector.', 5); } };
    return null;
  };

  // ---------- the Field Guide (menu and pause) ----------
  var GUIDE = [
    { name: 'Velociraptor', sub: 'Pack hunter · every sector', art: '<path class="f" d="M6 52q10-6 26-6 10-10 24-8l10-12q4-6 12-4l12 3q4 2 2 6l-14 2-6 4q-2 10-10 16l2 14 6 10h-8l-6-12-4-10-8 2-4 10 4 10h-8l-4-14q-12-4-20-18z"/><path class="l" d="M82 28l8 2M40 44q6-4 14-4"/>',
      tips: ['Sees in a cone ahead of it, and less well in the dark. Crouching and standing still both help.', 'Hears running from a long way off. Walks over to look at any noise, then searches where it last saw you.', 'On Normal the pack answers a call and one circles round. On Hard a third cuts you off.', 'A flash burst stuns it. Safe rooms stop it, until the lockdown.'] },
    { name: 'Tyrannosaurus', sub: 'Apex predator · T-Rex Kingdom', art: '<path class="f" d="M4 50q14-10 30-10 6-12 20-12l6-10q6-8 16-6l14 2q6 2 4 8l-4 8-16 2-6 6q2 10-6 18l2 16 8 10H60l-6-12-6-10-10 2-2 12 4 8H30l-4-14Q12 62 4 50z"/><path class="l" d="M78 22l14 3M74 32l12-2M58 40l6 4"/>',
      tips: ['Stays in its kingdom unless it sees you. If it loses you, it walks home.', 'Its eyes follow movement: stand still and it has trouble picking you out (less so on Hard).', 'The feeding call by the gate draws it to the far platform for about half a minute.', 'During the lockdown it breaks out and hunts the whole park.'] },
    { name: 'Plesiosaur', sub: 'Marine reptile · the Aquarium', art: '<path class="f" d="M6 62q14-12 34-10 10-2 18-12l10-16q4-8 12-8l10 2q4 2 0 6l-10 2q-4 2-6 8l-4 16q10 2 20 12-12 8-28 6l-8 10-6-2 4-10q-14 2-24-2l-10 8-4-4 6-8q-8-2-14-8z"/><path class="l" d="M82 20l8 2M38 58q10 2 20-2"/>',
      tips: ['She lives in the great tank of the Ocean Hall. The glass keeps her in. The keepers’ catwalk over the water does not keep her down.', 'When she rears beside the walkway, keep moving or get into a refuge cage. Standing still is how she takes you.', 'A flash burst in the face sends her back under for a moment.', 'In the water you cannot fight her and you cannot outswim her for long. Make for the amber light.'] },
    { name: 'Pteranodon', sub: 'Flying reptile · the Aviary', art: '<path class="f" d="M50 30l8-12q6-10 18-12-6 8-8 16l-2 8 30 10-34 6-4 14-6 10-4-12-4-12-38-2 34-12z"/><path class="l" d="M58 30l10-12M50 44l-30 2M54 44l28-4"/>',
      tips: ['Roosts in the top of the dome and watches the ground. Stay in the open too long and it dives.', 'The covered walkways stop it: get under a roof and it breaks off.', 'A flash burst stuns it, but you have to aim up at it.', 'The aviary gate needs a staff keycard. A keeper near the North Bunker still has one.'] }
  ];
  function buildGuide() {
    guideEl = document.createElement('div'); guideEl.id = 'guide'; guideEl.className = 'fl-over';
    guideEl.innerHTML = '<div class="fl-box"><div class="fl-head"><span>FIELD GUIDE</span><b>KNOW WHAT IS HUNTING YOU</b></div><div class="fl-grid gd-grid">' + GUIDE.map(function (c) {
      return '<div class="fl-card have gd-card"><svg viewBox="0 0 100 100">' + c.art + '</svg><h4>' + c.name + '</h4><p class="gd-sub">' + c.sub + '</p><ul>' + c.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div><button class="fl-close">Close</button></div>';
    document.body.appendChild(guideEl);
    guideEl.querySelector('.fl-close').onclick = E.closeGuide;
    guideEl.addEventListener('pointerdown', function (e) { if (e.target === guideEl) E.closeGuide(); });
    window.addEventListener('keydown', function (e) { if (guideEl.classList.contains('show') && (e.code === 'Escape' || e.code === 'KeyE')) { e.stopPropagation(); E.closeGuide(); } }, true);
  }
  E.openGuide = function () { if (!guideEl) buildGuide(); guideEl.classList.add('show'); };
  E.closeGuide = function () { if (guideEl) guideEl.classList.remove('show'); };
  return E;
})();
