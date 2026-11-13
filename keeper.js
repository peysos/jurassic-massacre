/* Jurassic Massacre — the head keeper, the trail he left, and the aviary trolley.
   buildKeeper() makes the body extras.js sets down behind the North Bunker.  This file also lays the blood trail from the
   aviary gate to him, the three clues along it, and Winch C: the key cage now hangs from a trolley that has to be rolled
   over the pedestal before it is lowered.  Loaded before extras.js; all static, so built before buildWorldLate(). */
'use strict';

// ---------- the body: slumped against the wall, legs out, one hand over the wound ----------
function buildKeeper(g) {
  function cloth(base, dark, stain) {
    return canvasTex(128, function (c, s) {
      c.fillStyle = base; c.fillRect(0, 0, s, s); blotch(c, s, [dark, 'rgba(255,255,255,.05)', 'rgba(40,34,20,.35)'], 60, 3, 16, 0.5);
      c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1; for (var i = 0; i < s; i += 3) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, s); c.stroke(); }
      if (stain) { for (i = 0; i < 16; i++) { var x = s * (0.15 + Math.random() * 0.7), y = s * (0.2 + Math.random() * 0.45), r = 8 + Math.random() * 20, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(46,8,6,.95)'); gr.addColorStop(0.7, 'rgba(38,9,6,.7)'); gr.addColorStop(1, 'rgba(30,10,6,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } }
    });
  }
  var shirt = std(0xffffff, 0.95, { map: cloth('#7a7350', 'rgba(50,46,28,.5)', true), bumpMap: bump(4), bumpScale: 0.012 }), sleeve = std(0xffffff, 0.95, { map: cloth('#7a7350', 'rgba(50,46,28,.5)'), bumpMap: bump(4), bumpScale: 0.012 });
  var trouser = std(0xffffff, 1, { map: cloth('#35372a', 'rgba(14,14,10,.6)'), bumpMap: bump(4), bumpScale: 0.012 }), skin = std(0x7d6b5a, 0.8, { bumpMap: bump(6), bumpScale: 0.006 }), skinD = std(0x4e4238, 0.85);
  var boot = std(0x1a1510, 0.6, { bumpMap: bump(3), bumpScale: 0.01 }), sole = std(0x0c0b0a, 0.95), hair = std(0x2b241a, 1, { bumpMap: bump(8), bumpScale: 0.03 }), wet = std(0x3a0806, 0.35), leather = std(0x2a1c10, 0.6);
  // torso, leaning back into the wall and a little to its left
  tube([[0, 0.1, 0.07, 0.17, 0.115], [0.005, 0.3, -0.03, 0.18, 0.12], [0.012, 0.5, -0.13, 0.195, 0.125], [0.02, 0.66, -0.2, 0.185, 0.105], [0.025, 0.73, -0.215, 0.075, 0.065]], shirt, g, 16, 5);
  tube([[-0.19, 0.67, -0.2, 0.03, 0.05], [0.025, 0.7, -0.205, 0.06, 0.07], [0.23, 0.67, -0.2, 0.03, 0.05]], shirt, g, 8, 4);                       // the yoke of the shoulders
  box(0.11, 0.12, 0.012, sleeve, 0.1, 0.53, -0.015, g).rotation.x = -0.45; box(0.11, 0.035, 0.016, sleeve, 0.1, 0.585, -0.04, g).rotation.x = -0.45;     // breast pocket and flap
  box(0.07, 0.022, 0.006, std(0xd8d2be, 0.5), -0.1, 0.57, -0.035, g).rotation.x = -0.45;                                                            // name strip
  mesh(new THREE.CircleGeometry(0.03, 10), std(0x2f6a3a, 0.6), -0.1, 0.52, -0.012, g).rotation.x = -0.45;                                            // park patch
  [0.16, 0.26, 0.36, 0.46].forEach(function (y) { mesh(new THREE.SphereGeometry(0.008, 6, 5), std(0x2a2416, 0.4), 0.004, y, 0.105 - (y - 0.1) * 0.46, g); });      // buttons
  [-0.04, 0, 0.04].forEach(function (o, n) { var s = box(0.012, 0.25 - n * 0.02, 0.012, wet, -0.03 + o, 0.34, 0.085 - 0.02, g); s.rotation.set(-0.45, 0, 0.55); });   // three claw cuts through the shirt
  var belt = mesh(new THREE.TorusGeometry(0.165, 0.022, 6, 18), leather, 0, 0.13, 0.05, g); belt.rotation.x = PI / 2 - 0.3; belt.scale.set(1.04, 0.72, 1); box(0.045, 0.04, 0.012, M.metal, 0, 0.14, 0.175, g);
  box(0.07, 0.1, 0.05, leather, 0.17, 0.12, 0.06, g).rotation.y = 0.2;                                                                                // the empty radio holster
  // neck and head, lolled forward onto the left shoulder
  tube([[0.025, 0.72, -0.215, 0.05, 0.05], [0.04, 0.79, -0.19, 0.045, 0.047]], skin, g, 10, 2);
  var head = new THREE.Group(); head.position.set(0.05, 0.86, -0.165); head.rotation.set(0.55, 0.25, 0.42); g.add(head);
  part(sphGeo, skin, 0, 0.02, 0, head, 0.17, 0.2, 0.2); part(sphGeo, skin, 0, -0.055, 0.03, head, 0.135, 0.13, 0.15);                                 // skull, jaw
  part(sphGeo, skin, 0, -0.01, 0.1, head, 0.03, 0.05, 0.045); part(sphGeo, skinD, 0, -0.075, 0.085, head, 0.07, 0.014, 0.03);                         // nose, slack mouth
  [-1, 1].forEach(function (sd) { part(sphGeo, skinD, sd * 0.036, 0.022, 0.082, head, 0.036, 0.022, 0.02); part(sphGeo, skin, sd * 0.036, 0.03, 0.083, head, 0.04, 0.016, 0.02); part(sphGeo, skin, sd * 0.085, 0, 0, head, 0.018, 0.055, 0.035); part(sphGeo, hair, sd * 0.036, 0.048, 0.086, head, 0.045, 0.01, 0.014); });      // sunken eyes, lids, ears, brows
  var hm = mesh(new THREE.SphereGeometry(0.103, 14, 8, 0, PI * 2, 0, PI * 0.56), hair, 0, 0.028, -0.012, head); hm.rotation.x = -0.25; hm.scale.set(0.9, 1.02, 1.03); hm.castShadow = true;
  part(sphGeo, hair, 0, -0.085, 0.05, head, 0.12, 0.06, 0.1);                                                                                        // a few days of beard
  var cut = box(0.01, 0.07, 0.006, wet, 0.05, 0.03, 0.085, head); cut.rotation.z = 0.5;
  // arms: the left hangs to the ground, the right lies across his stomach
  function arm(sd, sh, el, wr, palmRot) {
    tube([[sh[0], sh[1], sh[2], 0.058, 0.058], [lerp(sh[0], el[0], 0.55), lerp(sh[1], el[1], 0.55), lerp(sh[2], el[2], 0.55), 0.052, 0.052], [lerp(sh[0], el[0], 0.62), lerp(sh[1], el[1], 0.62), lerp(sh[2], el[2], 0.62), 0.054, 0.054]], sleeve, g, 10, 3);
    tube([[lerp(sh[0], el[0], 0.6), lerp(sh[1], el[1], 0.6), lerp(sh[2], el[2], 0.6), 0.042, 0.042], [el[0], el[1], el[2], 0.04, 0.04], [lerp(el[0], wr[0], 0.5), lerp(el[1], wr[1], 0.5), lerp(el[2], wr[2], 0.5), 0.036, 0.034], [wr[0], wr[1], wr[2], 0.027, 0.022]], skin, g, 10, 3);
    var h = new THREE.Group(); h.position.set(wr[0], wr[1], wr[2]); h.rotation.set(palmRot[0], palmRot[1], palmRot[2]); g.add(h);
    part(sphGeo, skin, 0, 0, 0.045, h, 0.075, 0.03, 0.095);
    for (var f = 0; f < 4; f++) tube([[-0.027 + f * 0.018, 0, 0.085, 0.0085, 0.0085], [-0.03 + f * 0.02, -0.008, 0.125, 0.008, 0.008], [-0.03 + f * 0.02, -0.03, 0.15 - Math.abs(f - 1.5) * 0.006, 0.0065, 0.0065]], skin, h, 5, 2);
    tube([[sd * 0.03, 0, 0.03, 0.0095, 0.0095], [sd * 0.055, -0.005, 0.065, 0.009, 0.009], [sd * 0.06, -0.015, 0.095, 0.007, 0.007]], skin, h, 5, 2);
    return h;
  }
  arm(1, [0.225, 0.65, -0.19], [0.33, 0.36, -0.1], [0.4, 0.045, 0.12], [0.1, 0.5, 0.2]);
  arm(-1, [-0.19, 0.65, -0.19], [-0.31, 0.37, -0.04], [-0.1, 0.27, 0.1], [0.7, 1.35, 0.3]);
  mesh(new THREE.TorusGeometry(0.03, 0.007, 5, 12), M.dark, 0.385, 0.075, 0.07, g).rotation.set(1.2, 0.5, 0);                                         // his watch
  // legs: the left straight out, the right drawn up and fallen outward
  function leg(hip, knee, ank, toe) {
    tube([[hip[0], hip[1], hip[2], 0.088, 0.088], [lerp(hip[0], knee[0], 0.5), lerp(hip[1], knee[1], 0.5), lerp(hip[2], knee[2], 0.5), 0.08, 0.082], [knee[0], knee[1], knee[2], 0.062, 0.064], [lerp(knee[0], ank[0], 0.5), lerp(knee[1], ank[1], 0.5), lerp(knee[2], ank[2], 0.5), 0.056, 0.058], [lerp(knee[0], ank[0], 0.9), lerp(knee[1], ank[1], 0.9), lerp(knee[2], ank[2], 0.9), 0.05, 0.05]], trouser, g, 12, 3);
    var b = new THREE.Group(); b.position.set(ank[0], ank[1], ank[2]); b.rotation.set(toe[0], toe[1], toe[2]); g.add(b);                               // boot: local +y is the toe, −z the sole
    tube([[0, -0.13, -0.01, 0.047, 0.05], [0, -0.02, -0.01, 0.048, 0.052], [0, 0.03, 0.0, 0.05, 0.06], [0, 0.13, 0.03, 0.05, 0.045], [0, 0.2, 0.035, 0.044, 0.03]], boot, b, 10, 3);
    box(0.1, 0.3, 0.025, sole, 0, 0.05, -0.058, b); box(0.1, 0.07, 0.03, sole, 0, -0.05, -0.07, b);
    for (var l = 0; l < 4; l++) box(0.05, 0.006, 0.006, M.rubber, 0, 0.04 + l * 0.03, 0.06 - l * 0.004, b);
  }
  leg([0.1, 0.12, 0.12], [0.17, 0.1, 0.6], [0.22, 0.075, 1.0], [-1.25, 0.35, 0.1]);
  leg([-0.1, 0.13, 0.12], [-0.3, 0.33, 0.46], [-0.4, 0.07, 0.74], [-1.0, -0.7, -0.35]);
  var tear = mesh(new THREE.PlaneGeometry(0.12, 0.2), wet, 0.18, 0.186, 0.42, g); tear.rotation.x = -PI / 2; tear.rotation.z = 0.2; tear.userData.noCast = true;           // the bite in his thigh, and what he tied round it
  mesh(new THREE.TorusGeometry(0.086, 0.014, 5, 14), std(0x6a6450, 1), 0.13, 0.11, 0.3, g).rotation.set(0.05, 0.14, 0);
  // what he had with him
  var hat = new THREE.Group(); hat.position.set(0.66, 0, 0.52); hat.rotation.set(0.12, 0.6, 0.05); g.add(hat);
  cyl(0.2, 0.21, 0.014, sleeve, 0, 0.012, 0, hat, 20); cyl(0.095, 0.11, 0.11, sleeve, 0, 0.07, 0, hat, 16); cyl(0.112, 0.112, 0.022, leather, 0, 0.03, 0, hat, 16); part(sphGeo, sleeve, 0, 0.125, 0, hat, 0.19, 0.03, 0.19);
  var torch = new THREE.Group(); torch.position.set(-0.52, 0.036, 0.72); torch.rotation.set(0, 0.8, PI / 2); g.add(torch);
  cyl(0.026, 0.026, 0.2, M.dark, 0, 0, 0, torch, 10); cyl(0.04, 0.03, 0.06, M.dark, 0, 0.13, 0, torch, 10); cyl(0.036, 0.036, 0.006, std(0x9aa0a0, 0.2, { metalness: 0.6 }), 0, 0.162, 0, torch, 10);
  var kit = new THREE.Group(); kit.position.set(-0.62, 0, 0.18); kit.rotation.y = -0.5; g.add(kit);                                                    // a first-aid tin, open and emptied
  box(0.26, 0.07, 0.18, std(0x9a1a14, 0.5), 0, 0.035, 0, kit); var lid = box(0.26, 0.02, 0.18, std(0x9a1a14, 0.5), 0, 0.14, -0.12, kit); lid.rotation.x = 1.1; box(0.07, 0.022, 0.025, M.white, 0, 0.142, -0.105, kit).rotation.x = 1.1; box(0.025, 0.022, 0.07, M.white, 0, 0.142, -0.105, kit).rotation.x = 1.1;
  [[-0.4, 0.3, 0.4], [-0.75, 0.42, 1.2], [-0.3, 0.62, 2.0]].forEach(function (b) { var w = mesh(new THREE.PlaneGeometry(0.09, 0.3), std(0xb8b09a, 1, { side: THREE.DoubleSide }), b[0], 0.022, b[1], g); w.rotation.set(-PI / 2, 0, b[2]); w.userData.noCast = true; });   // bandage wrappers
  // blood: down the wall where he slid, on his shirt, pooled under him
  var streak = mesh(new THREE.PlaneGeometry(0.42, 1.25), new THREE.MeshStandardMaterial({ roughness: 0.6, transparent: true, depthWrite: false, map: canvasTex(128, function (c, s) {
    c.clearRect(0, 0, s, s); for (var i = 0; i < 9; i++) { var x = s * (0.25 + Math.random() * 0.5), w = 3 + Math.random() * 9, gr = c.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(44,8,6,0)'); gr.addColorStop(0.12, 'rgba(44,8,6,.85)'); gr.addColorStop(0.85 + Math.random() * 0.1, 'rgba(36,8,6,.7)'); gr.addColorStop(1, 'rgba(30,8,6,0)'); c.fillStyle = gr; c.fillRect(x - w / 2, 0, w, s); }
    for (i = 0; i < 50; i++) { c.fillStyle = 'rgba(40,7,5,.7)'; c.beginPath(); c.arc(Math.random() * s, Math.random() * s * 0.4, 0.6 + Math.random() * 2, 0, 7); c.fill(); }
  }) }), 0.03, 0.88, -0.365, g); streak.userData.noCast = true;
  var pool = mesh(new THREE.CircleGeometry(0.95, 18), M.blood, 0.12, 0.03, 0.34, g); pool.rotation.x = -PI / 2; pool.scale.set(1, 0.72, 1); pool.userData.noCast = true;
  // the lanyard the card hangs from
  tube([[-0.03, 0.74, -0.2, 0.004, 0.004], [-0.035, 0.66, -0.1, 0.004, 0.004], [0.0, 0.6, -0.04, 0.004, 0.004], [0.04, 0.66, -0.1, 0.004, 0.004], [0.075, 0.74, -0.2, 0.004, 0.004]], std(0x1a3a6a, 0.8), g, 4, 5);
}

var Keeper = (function () {
  var K = {}, NOTE = [-68.3, -86.9], RADIO = [-36.5, -107.6], PRINTS = [-4.3, -125.2], WC = COVERS[1], RAILY = 13.0, STEP = 2.6, crankC = null, chain = null, trolley = null, sign = null, signSig = '', flies = null, hissT = 0, cHold = 0, cHoldT = 0, cTick = 0, read = {};
  function grp(x, z, rot) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  function stopX(s) { return AV.x + ((s || 3) - 3) * STEP; }

  // ---------- the trail ----------
  (function () {
    var PATH = [[-68.6, -88.4], [-62, -91.5], [-52, -96.5], [-43, -103], [-36.5, -107.6], [-27, -112.5], [-17, -117.5], [-9, -121], [-5.2, -122.6], [-4.7, -125.6], [-4.1, -128.3], [-1.2, -128.5], [1.0, -128.2]];
    var drop = M.blood, smear = new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true, depthWrite: false, map: canvasTex(128, function (c, s) {
      c.clearRect(0, 0, s, s); for (var i = 0; i < 7; i++) { var y = s * (0.3 + Math.random() * 0.4), gr = c.createLinearGradient(0, 0, s, 0); gr.addColorStop(0, 'rgba(40,7,5,0)'); gr.addColorStop(0.2, 'rgba(40,7,5,.8)'); gr.addColorStop(0.8, 'rgba(34,8,6,.55)'); gr.addColorStop(1, 'rgba(30,8,6,0)'); c.fillStyle = gr; c.fillRect(0, y, s, 2 + Math.random() * 9); }
    }) }), i, k;
    function dab(x, z, r, sx, rot, m) { var d = mesh(new THREE.CircleGeometry(r, 9), m || drop, x, 0.028, z); d.rotation.x = -PI / 2; d.rotation.z = rot || 0; d.scale.set(sx || 1, 1, 1); d.userData.noCast = true; }
    for (i = 0; i < PATH.length - 1; i++) {
      var a = PATH[i], b = PATH[i + 1], len = dist(a[0], a[1], b[0], b[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]), late = i / (PATH.length - 1), gap = lerp(3.4, 1.1, late);
      for (k = 0; k < len; k += gap * (0.7 + srand() * 0.6)) {
        var x = lerp(a[0], b[0], k / len) + (srand() - 0.5) * 0.7, z = lerp(a[1], b[1], k / len) + (srand() - 0.5) * 0.7;
        dab(x, z, 0.07 + srand() * 0.11 + late * 0.08, 1 + srand() * 0.8, -ang + PI / 2);
        if (srand() < 0.5) dab(x + (srand() - 0.5) * 0.5, z + (srand() - 0.5) * 0.5, 0.03 + srand() * 0.04);
        if (late > 0.55 && srand() < 0.55) { var sm = mesh(new THREE.PlaneGeometry(1.5, 0.5), smear, x, 0.027, z); sm.rotation.x = -PI / 2; sm.rotation.z = -ang + PI / 2; sm.userData.noCast = true; }     // by the bunker he is dragging a leg
      }
    }
    [[-52, -96.5, 0.55], [-27, -112.5, 0.7], [-5.2, -122.6, 0.8]].forEach(function (p) { dab(p[0], p[1], p[2], 1.3, srand() * 3); (W.blood = W.blood || []).push([p[0], p[1], p[2]]); });      // where he stopped to rest
    // 1: the clipboard wired to a stake by the aviary gate
    var n = grp(NOTE[0], NOTE[1], PI / 2 + 0.25);
    box(0.08, 1.5, 0.08, M.wood, 0, 0.75, 0, n); box(0.3, 0.42, 0.02, std(0x4a3a24, 0.8), 0, 1.28, 0.05, n);
    mesh(new THREE.PlaneGeometry(0.26, 0.34), std(0xffffff, 0.9, { map: textTex(['GATE: CARD ONLY', 'Voss has the', 'last card.', 'N. BUNKER  — T.'], 256, 330, '#d8d0b8', '#2a2418', null, true) }), 0, 1.27, 0.062, n).userData.noCast = true;
    box(0.1, 0.03, 0.03, M.metal, 0, 1.47, 0.065, n);
    var hp = handTex(); mesh(new THREE.PlaneGeometry(0.26, 0.26), hp, 0.02, 0.95, 0.045, n).userData.noCast = true;
    circles.push({ x: NOTE[0], z: NOTE[1], r: 0.2 });
    // 2: his radio, dropped half way
    var r = grp(RADIO[0], RADIO[1], 0.9), rb = new THREE.Group(); rb.rotation.set(PI / 2 - 0.08, 0, 0.3); rb.position.y = 0.035; r.add(rb);
    box(0.075, 0.17, 0.04, M.dark, 0, 0, 0, rb); cyl(0.006, 0.008, 0.16, M.rubber, 0.022, 0.16, 0, rb, 5); box(0.05, 0.05, 0.005, std(0x30342c, 0.3), 0, 0.03, 0.021, rb); cyl(0.012, 0.012, 0.016, M.metal, -0.02, 0.092, 0, rb, 8);
    K.led = basic(0xff2a1a, { fog: false }); mesh(new THREE.SphereGeometry(0.007, 6, 6), K.led, 0.02, 0.07, 0.022, rb);
    // 3: handprints along the bunker's west wall, and the gouges in the concrete above where he sits
    [[-4.06, 1.25, -123.4, 0.2], [-4.06, 1.05, -124.5, -0.3], [-4.06, 0.85, -125.7, 0.5], [-4.06, 0.7, -126.6, -0.1]].forEach(function (h) { var m = mesh(new THREE.PlaneGeometry(0.3, 0.3), hp, h[0], h[1], h[2]); m.rotation.y = -PI / 2; m.rotation.z = h[3]; m.userData.noCast = true; var d = mesh(new THREE.PlaneGeometry(0.9, 0.3), smear, h[0], h[1] - 0.06, h[2] - 0.55); d.rotation.y = -PI / 2; d.rotation.z = 0.12; d.userData.noCast = true; });
    [0, 1, 2].forEach(function (q) { var s = box(0.03, 0.9, 0.012, std(0x0c0c0c, 1), 2.4 + q * 0.16, 1.7, -127.415); s.rotation.z = 0.5; s.userData.noCast = true; });
    // flies over the body
    var fp = []; for (i = 0; i < 14; i++) fp.push(0, 0, 0);
    var fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    flies = dyn(new THREE.Points(fg, new THREE.PointsMaterial({ color: 0x0a0a0a, size: 0.022 }))); flies.position.set(1.4, 0.7, -128.0); flies.frustumCulled = false; scene.add(flies);
  })();
  function handTex() {
    return new THREE.MeshStandardMaterial({ roughness: 0.75, transparent: true, depthWrite: false, map: canvasTex(128, function (c, s) {
      c.clearRect(0, 0, s, s); c.fillStyle = 'rgba(44,8,6,.85)'; c.beginPath(); c.ellipse(s * 0.5, s * 0.66, s * 0.17, s * 0.19, 0, 0, 7); c.fill();
      [[0.3, 0.36, -0.3], [0.42, 0.26, -0.1], [0.55, 0.25, 0.08], [0.67, 0.32, 0.25]].forEach(function (f) { c.save(); c.translate(s * f[0], s * f[1]); c.rotate(f[2]); c.beginPath(); c.ellipse(0, 0, s * 0.04, s * 0.14, 0, 0, 7); c.fill(); c.restore(); });
      c.save(); c.translate(s * 0.26, s * 0.62); c.rotate(-1.0); c.beginPath(); c.ellipse(0, 0, s * 0.045, s * 0.12, 0, 0, 7); c.fill(); c.restore();
      c.globalCompositeOperation = 'destination-out'; for (var i = 0; i < 90; i++) { c.fillStyle = 'rgba(0,0,0,' + (0.2 + Math.random() * 0.5) + ')'; c.beginPath(); c.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 4, 0, 7); c.fill(); } c.globalCompositeOperation = 'source-over';
      c.fillStyle = 'rgba(40,7,5,.7)'; for (i = 0; i < 4; i++) c.fillRect(s * (0.38 + i * 0.07), s * 0.8, 2 + Math.random() * 2, s * (0.08 + Math.random() * 0.12));
    }) });
  }

  // ---------- the aviary: a rail under the dome, a trolley on it, and Winch C to move it ----------
  (function () {
    var i, x0 = stopX(1) - 1.2, x1 = stopX(5) + 1.2;
    box(x1 - x0, 0.16, 0.12, M.rust, AV.x, RAILY, AV.z); box(x1 - x0, 0.03, 0.26, M.rust, AV.x, RAILY - 0.09, AV.z); box(x1 - x0, 0.03, 0.26, M.rust, AV.x, RAILY + 0.09, AV.z);
    [x0 + 0.2, AV.x, x1 - 0.2].forEach(function (x) { var top = AV.h * Math.sqrt(Math.max(0, 1 - Math.pow((x - AV.x) / AV.r, 2))); cyl(0.03, 0.03, top - RAILY, M.metal, x, (top + RAILY) / 2, AV.z, null, 5); });
    [x0, x1].forEach(function (x) { box(0.1, 0.4, 0.34, M.yellow, x, RAILY, AV.z); });
    trolley = dyn(new THREE.Group()); box(0.6, 0.22, 0.34, M.dark, 0, -0.2, 0, trolley); [-0.2, 0.2].forEach(function (x) { cyl(0.09, 0.09, 0.3, M.metal, x, 0.02, 0, trolley, 10).rotation.x = PI / 2; }); cyl(0.12, 0.12, 0.1, M.rust, 0, -0.36, 0, trolley, 12).rotation.x = PI / 2; scene.add(trolley);
    chain = dyn(cyl(0.02, 0.02, 1, M.metal, AV.x, 6, AV.z, null, 5));
    for (i = 1; i <= 5; i++) {                                                // numbered stops painted on the ground under the rail
      if (i !== 3) { var d = mesh(new THREE.CircleGeometry(0.62, 20), std(0xffffff, 0.9, { transparent: true, depthWrite: false, map: canvasTex(128, (function (n) { return function (c, s) { c.clearRect(0, 0, s, s); c.strokeStyle = 'rgba(226,185,59,.75)'; c.lineWidth = 9; c.beginPath(); c.arc(s / 2, s / 2, s * 0.42, 0, 7); c.stroke(); c.fillStyle = 'rgba(226,185,59,.8)'; c.font = 'bold 62px Impact, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, s / 2, s / 2 + 4); c.globalCompositeOperation = 'destination-out'; for (var q = 0; q < 60; q++) { c.beginPath(); c.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 5, 0, 7); c.fill(); } }; })(i)) }), stopX(i), 0.03, AV.z); d.rotation.x = -PI / 2; d.userData.noCast = true; }
    }
    mesh(new THREE.PlaneGeometry(0.5, 0.2), std(0xffffff, 0.7, { map: textTex(['STOP 3'], 160, 64, '#17140e', '#e2b93b', '#e2b93b', false) }), AV.x, 0.3, AV.z + 0.96).userData.noCast = true;
    // Winch C under the second shelter: a geared hand winch with its haul cable running up to the rail
    var g = grp(WC[0], WC[1], 0);
    box(1.2, 0.12, 1.0, M.yellow, 0, 0.06, 0, g); box(1.0, 0.4, 0.8, M.dark, 0, 0.32, 0, g); [-0.42, 0.42].forEach(function (o) { box(0.08, 0.95, 0.66, M.rust, o, 0.95, 0, g); });
    cyl(0.26, 0.26, 0.74, M.rust, 0, 1.0, 0, g, 16).rotation.z = PI / 2; [-0.32, 0.32].forEach(function (o) { cyl(0.36, 0.36, 0.04, M.metal, o, 1.0, 0, g, 18).rotation.z = PI / 2; });
    mesh(new THREE.TorusGeometry(0.27, 0.02, 5, 20), M.metal, 0.1, 1.0, 0, g).rotation.y = PI / 2; mesh(new THREE.TorusGeometry(0.27, 0.02, 5, 20), M.metal, -0.08, 1.0, 0, g).rotation.y = PI / 2;
    var gear = cyl(0.2, 0.2, 0.05, M.metal, 0.5, 1.0, 0, g, 14); gear.rotation.z = PI / 2; for (i = 0; i < 12; i++) { var t = box(0.05, 0.05, 0.05, M.metal, 0.5, 1.0 + Math.sin(i * PI / 6) * 0.21, Math.cos(i * PI / 6) * 0.21, g); t.rotation.x = -i * PI / 6; }
    box(0.04, 0.2, 0.04, M.red, 0.5, 1.3, 0.12, g).rotation.x = 0.5;                                                         // the pawl
    crankC = dyn(new THREE.Group()); crankC.position.set(WC[0] + 0.6, 1.0, WC[1]); box(0.06, 0.5, 0.06, M.metal, 0, 0.25, 0, crankC); box(0.3, 0.07, 0.07, M.red, 0.15, 0.5, 0, crankC); scene.add(crankC);
    var cab = cyl(0.012, 0.012, 1, M.metal, 0, 0, 0, null, 4), ax = WC[0], ay = 1.26, az = WC[1], bx = x1, by = RAILY, bz = AV.z, L = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az));
    cab.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); cab.scale.y = L; cab.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(bx - ax, by - ay, bz - az).normalize()); cab.userData.noCast = true;
    sign = livePanel(2.4, 0.8, 384, 128, WC[0] + 2.78, 3.5, WC[1], PI / 2);
    circles.push({ x: WC[0], z: WC[1], r: 0.78 });
    // a little more iron on winches A and B, to match
    WINCH.forEach(function (q) { var c = COVERS[q]; box(1.3, 0.06, 1.1, M.yellow, c[0], 0.03, c[1]); box(0.04, 0.2, 0.04, M.red, c[0] - 0.36, 1.32, c[1] + 0.14).rotation.x = 0.5; mesh(new THREE.TorusGeometry(0.31, 0.02, 5, 20), M.metal, c[0] + 0.08, 0.95, c[1]).rotation.y = PI / 2; mesh(new THREE.TorusGeometry(0.31, 0.02, 5, 20), M.metal, c[0] - 0.1, 0.95, c[1]).rotation.y = PI / 2;
      var top = AV.h * Math.sqrt(Math.max(0, 1 - (Math.pow(c[0] - AV.x, 2) + Math.pow(c[1] - AV.z, 2)) / (AV.r * AV.r))); if (top > 3.2) cyl(0.012, 0.012, top - 3.0, M.metal, c[0], (top + 3.0) / 2, c[1], null, 4).userData.noCast = true; });
  })();

  K.interact = function (px, pz) {
    if (dist(px, pz, NOTE[0] + 0.5, NOTE[1]) < 1.7) return { text: '[E] Read the clipboard', fn: function () { read.note = 1; Sound.click(); showMsg('“Gate is CARD ONLY since the breach. Voss has the last card. He was bleeding badly — said he would make the North Bunker and radio out.  — T.”', 8); } };
    if (dist(px, pz, RADIO[0], RADIO[1]) < 1.6) return { text: '[E] Listen to the radio', fn: function () { read.radio = 1; Sound.noise(0.5, 3200, 0.2); Sound.noise(0.3, 1800, 0.14, 0.55); showMsg('“…Voss, this is Control. You are leaving a trail a blind raptor could follow. Get behind the bunker and stay down. Voss? …Marcus?”', 8); makeNoise(px, pz, 14); } };
    if (dist(px, pz, PRINTS[0], PRINTS[1]) < 1.9 && !P.card) return { text: '[E] Look at the handprints', fn: function () { showMsg('Handprints, low on the wall and getting lower. He held himself up all the way round to the back.', 6); } };
    if (!keysGot[3] && dist(px, pz, WC[0], WC[1]) < 2.5) {
      var w = P.winch, st = w.stop || 3;
      if (w.h < w.start) return { text: 'Winch C — the trolley brake is locked while the cage hangs low. Raise it to the top first.', fn: function () { Sound.deny(); } };
      return { text: '[Hold E] Turn winch C — trolley at stop ' + st, prog: cHold, hold: function (dt) {
        cHold += dt / (2 * DIFF.hold); cHoldT = 0.2; crankC.rotation.x += dt * 5; cTick -= dt; if (cTick <= 0) { cTick = 0.24; Sound.click(); }
        if (cHold < 1) return; cHold = 0;
        var d = w.dir || 1; if (st + d > 5 || st + d < 1) { d = -d; Sound.clunk(); }
        w.dir = d; w.stop = st + d; Sound.grind(); ptero.expo += 0.35; makeNoise(player.x, player.z, 22);
        showMsg('The trolley rattles along the rail to stop ' + w.stop + (w.stop === 3 ? ' — right over the pedestal.' : w.stop === 1 || w.stop === 5 ? '. End of the rail: it will come back the other way.' : '.'), 4);
      } };
    }
    return null;
  };
  K.step = function (dt, instant) {
    var w = P.winch, tx = stopX(w.stop), x = instant ? tx : W.aviCage.position.x + clamp(tx - W.aviCage.position.x, -dt * 1.6, dt * 1.6);
    W.aviCage.position.x = x; keyMeshes[3].position.x = keysGot[3] ? keyMeshes[3].position.x : x; trolley.position.set(x, RAILY, AV.z);
    var top = W.aviCage.position.y + 0.8, len = Math.max(0.05, RAILY - 0.4 - top); chain.position.set(x, top + len / 2, AV.z); chain.scale.y = len; chain.visible = !keysGot[3] || true;
    var sig = (w.stop || 3) + '|' + (w.dir || 1); if (sig !== signSig) { signSig = sig; plaqueText(sign, 'WINCH C', ['TROLLEY  ' + ((w.dir || 1) > 0 ? '▶' : '◀') + '  stop ' + (w.stop || 3) + ' of 5']); }
  };
  K.update = function (dt, c) {
    var px = player.x, pz = player.z, i;
    cHoldT -= dt; if (cHoldT <= 0) cHold = Math.max(0, cHold - dt * 0.5);
    var dr = dist(px, pz, RADIO[0], RADIO[1]);
    if (dr < 22) { K.led.color.setHex(Math.sin(playTime * 5) > 0.3 ? 0xff2a1a : 0x300805); hissT -= dt; if (hissT <= 0) { hissT = 1.6 + Math.random() * 3.5; var v = clamp(1 - dr / 22, 0, 1) * 0.12; Sound.noise(0.18 + Math.random() * 0.3, 2600 + Math.random() * 1500, v); if (Math.random() < 0.4) Sound.tone(900, 860, 0.08, v * 0.5, 'square', 0.3); } }
    if (dist(px, pz, 1.4, -128) < 16) { var a = flies.geometry.attributes.position; for (i = 0; i < a.count; i++) { var t = playTime * (2.2 + i * 0.31) + i * 1.9; a.setXYZ(i, Math.sin(t) * 0.35 + Math.sin(t * 2.3) * 0.12, Math.sin(t * 1.7 + i) * 0.22 + (i % 3) * 0.08, Math.cos(t * 1.3) * 0.3); } a.needsUpdate = true; }
  };
  return K;
})();
