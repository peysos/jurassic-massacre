/* Jurassic Massacre — the wetland behind the Visitor Center.
   Twelve years of rain have turned the ground west of the Visitor Center into a swamp, and the creepers have taken the
   building.  The shutter over the key piece runs off an old mill turbine in there.  Three sluice gates decide which pools
   fill, where the fish go — and so where the Spinosaurus stands to catch them.  Move the fish, and it follows.
   This replaces the fuse hunt.  Built before buildWorldLate(), so the static parts are batched and trees keep out. */
'use strict';

var Swamp = (function () {
  var S = {}, SW = { x1: -66, x2: -34, z1: -43.6, z2: -6.4 }, ROAM = { x1: -78, x2: -33.4, z1: -43.4, z2: 1.5 };
  var POOLS = { N: { x: -52, z: -36, rx: 9, rz: 4.5 }, T: { x: -51, z: -24.5, rx: 7.5, rz: 4.6 }, S: { x: -49, z: -12.6, rx: 9, rz: 4.3 } };
  var WHEELS = [[-49.4, -41.2, 'NORTH WEIR'], [-36.9, -40.4, 'MILL RACE'], [-48.6, -18.3, 'SOUTH DRAIN']], CLUTCH = [-39.4, -22.6], BOARD = [-35.4, -8.6];
  var level = { N: 0.3, T: 1, S: 0.3 }, wheels = [], plates = [], lampM = [], hold = [0, 0, 0, 0], poolMesh = {}, flowMat = [], mill = null, clutch = null, board = null, boardSig = '', fishM = [], fireflies = null;
  var sp = { x: -51, z: -24.5, rot: 1.2, state: 'fish', pool: 'T', delay: 0, aware: 0, phase: 0, stunT: 0, cyc: 2, speed: 0, croakT: 3, splashT: 0, told: false }, spMesh = null;
  function gates() { if (!P.sw) P.sw = { g: [false, true, false] }; return P.sw.g; }
  function fishPool() { var g = gates(); return g[2] ? (g[0] ? 'N' : 'S') : (g[1] ? 'T' : (g[0] ? 'N' : 'T')); }     // still deep water; never a draining pool; the pool being fed if there is a choice
  function flowing() { var g = gates(); return g[1] && g[2]; }
  function inPool(x, z) { for (var k in POOLS) { var p = POOLS[k], s = 0.55 + 0.45 * level[k], dx = (x - p.x) / (p.rx * s), dz = (z - p.z) / (p.rz * s); if (dx * dx + dz * dz < 1 && level[k] > 0.25) return k; } return null; }
  function grp(x, z, rot) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  function keepOut(x, z, r) { circles.push({ x: x, z: z, r: r, top: -5 }); }                                       // a marker the tree planter respects; nothing collides with it

  // ---------- ground, water, channels ----------
  (function () {
    var i, k, mud = std(0x17140d, 0.62, { transparent: true, opacity: 0.92, map: canvasTex(256, function (g, s) { g.clearRect(0, 0, s, s); var gr = g.createRadialGradient(s / 2, s / 2, s * 0.2, s / 2, s / 2, s * 0.5); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.75, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); blotch(g, s, ['rgba(120,140,90,.5)', 'rgba(60,50,30,.6)'], 30, 8, 30, 0.6); }), bumpMap: bump(10), bumpScale: 0.08, depthWrite: false });
    var m = mesh(new THREE.PlaneGeometry(44, 48), mud, -50, 0.014, -25); m.rotation.x = -PI / 2; m.userData.noCast = true;
    var water = std(0x16241a, 0.05, { metalness: 0.8, transparent: true, opacity: 0.9, depthWrite: false, bumpMap: bump(4), bumpScale: 0.02 });
    S.waterMat = water;
    for (k in POOLS) {
      var p = POOLS[k], pm = dyn(mesh(new THREE.CircleGeometry(1, 30), water, p.x, 0.075, p.z)); pm.rotation.x = -PI / 2; pm.userData.noCast = true; poolMesh[k] = pm;
      for (i = 0; i < 9; i++) { var a = srand() * 6.3, rr = Math.sqrt(srand()) * 0.8, lp = mesh(new THREE.CircleGeometry(0.22 + srand() * 0.2, 9, 0.5, 5.6), std(0x2f5a2c, 0.8, { side: THREE.DoubleSide }), p.x + Math.cos(a) * p.rx * rr, 0.082, p.z + Math.sin(a) * p.rz * rr); lp.rotation.x = -PI / 2; lp.rotation.z = srand() * 6; lp.userData.noCast = true; }     // lily pads
    }
    function channel(x1, z1, x2, z2, w, id) {
      var len = Math.hypot(x2 - x1, z2 - z1), fm = water.clone(); fm.bumpMap = bump(1, len / 2); fm.bumpScale = 0.05;
      var c = mesh(new THREE.PlaneGeometry(w, len), fm, (x1 + x2) / 2, 0.062, (z1 + z2) / 2); c.rotation.x = -PI / 2; c.rotation.z = Math.atan2(x2 - x1, z2 - z1); c.userData.noCast = true;
      if (id !== undefined) flowMat.push([fm, id]);
      [-1, 1].forEach(function (sd) { var bk = mesh(new THREE.BoxGeometry(0.18, 0.16, len), M.plank, (x1 + x2) / 2, 0.08, (z1 + z2) / 2); bk.rotation.y = Math.atan2(x2 - x1, z2 - z1); bk.translateX(sd * (w / 2 + 0.08)); bk.userData.noCast = true; });
    }
    channel(-63, -42.6, -37.6, -42.6, 1.4);                         // the inlet ditch along the sector fence
    channel(-51, -42.4, -51, -40.2, 1.4, 0);                         // weir cut into the north pool
    channel(-38.3, -42.2, -38.3, -24.5, 1.4, 1); channel(-38.3, -24.5, -43.8, -24.5, 1.4, 1);       // the mill race
    channel(-50.2, -20.2, -50.2, -16.6, 1.4, 2);                     // drain to the south pool
    channel(-57.6, -12.6, -65, -12.6, 1.4, 2);                       // and away under the fence
    // sluice frames with a plate that lifts, and a handwheel beside each
    [[-51, -41.3, 0], [-38.3, -40.6, 0], [-50.2, -18.4, 0]].forEach(function (s, n) {
      var g = grp(s[0], s[1], s[2]);
      [-0.9, 0.9].forEach(function (x) { box(0.16, 2.0, 0.16, M.rust, x, 1.0, 0, g); }); box(2.0, 0.16, 0.2, M.rust, 0, 2.0, 0, g); cyl(0.03, 0.03, 1.3, M.metal, 0, 1.4, 0, g, 6);
      var pl = dyn(box(1.6, 1.0, 0.07, std(0x4a5a52, 0.6, { metalness: 0.5, map: metalTex }), 0, 0.5, 0, g)); plates.push(pl);
      var w = WHEELS[n], st = grp(w[0], w[1], 0);
      cyl(0.11, 0.14, 0.95, M.yellow, 0, 0.47, 0, st, 10); box(0.34, 0.26, 0.3, M.dark, 0, 1.05, 0, st);
      var wh = dyn(new THREE.Group()); wh.position.set(0, 1.1, 0.24); mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 22), M.red, 0, 0, 0, wh); [0, 1, 2].forEach(function (q) { box(0.58, 0.035, 0.035, M.red, 0, 0, 0, wh).rotation.z = q * PI / 3; }); cyl(0.05, 0.05, 0.14, M.metal, 0, 0, -0.06, wh, 8).rotation.x = PI / 2; st.add(wh); wheels.push(wh);
      var lm = basic(0xff3020, { fog: false }); lampM.push(lm); mesh(new THREE.SphereGeometry(0.055, 8, 8), lm, 0, 1.3, 0.1, st);
      mesh(new THREE.PlaneGeometry(1.0, 0.3), std(0xffffff, 0.7, { map: textTex(['GATE ' + (n + 1) + ' · ' + w[2]], 320, 96, '#17140e', '#e2b93b', '#e2b93b', false) }), 0, 1.62, 0.02, st).userData.noCast = true; box(1.06, 0.36, 0.04, M.dark, 0, 1.62, -0.01, st); cyl(0.025, 0.025, 0.5, M.metal, 0, 1.3, -0.03, st, 5);
      circles.push({ x: w[0], z: w[1], r: 0.32 }); keepOut(w[0], w[1], 2.5); keepOut(s[0], s[1], 2);
    });
    // the mill: an undershot wheel in the race, and a clutch on the pump-house wall
    var mh = grp(-40.6, -24.5, 0);
    box(0.2, 2.4, 0.2, M.wood, -0.6, 1.2, -1.15, mh); box(0.2, 2.4, 0.2, M.wood, -0.6, 1.2, 1.15, mh); cyl(0.07, 0.07, 2.6, M.metal, -0.6, 1.25, 0, mh, 8).rotation.x = PI / 2;
    mill = dyn(new THREE.Group()); mill.position.set(-0.6, 1.25, 0); mh.add(mill);
    [-0.45, 0.45].forEach(function (z) { mesh(new THREE.TorusGeometry(1.15, 0.05, 6, 26), M.wood, 0, 0, z, mill); for (var q = 0; q < 4; q++) { box(2.3, 0.06, 0.06, M.wood, 0, 0, z, mill).rotation.z = q * PI / 4; } });
    for (i = 0; i < 12; i++) { var pd = box(0.34, 0.04, 1.0, M.plank, Math.cos(i * PI / 6) * 1.15, Math.sin(i * PI / 6) * 1.15, 0, mill); pd.rotation.z = i * PI / 6; }
    box(2.4, 2.3, 2.6, retile(M.plank, 2, 1.4), 1.9, 1.15, 0, mh); box(2.8, 0.12, 3.0, M.roof, 1.9, 2.4, 0, mh).rotation.z = -0.08; mesh(new THREE.PlaneGeometry(0.9, 1.9), basic(0x050505), 3.11, 0.95, -0.4, mh).rotation.y = PI / 2;
    mesh(new THREE.PlaneGeometry(1.8, 0.4), std(0xffffff, 0.7, { map: textTex(['MILL TURBINE'], 384, 86, '#254a30', '#ece3c4', '#d9ae35', false) }), 3.115, 2.05, 0.2, mh).rotation.y = PI / 2;
    clutch = dyn(new THREE.Group()); clutch.position.set(CLUTCH[0] + 0.08, 1.05, CLUTCH[1] + 0.12); box(0.3, 0.5, 0.14, M.yellow, 0, 0, -0.1, clutch); cyl(0.03, 0.03, 0.7, M.metal, 0, 0.32, 0.02, clutch, 6); mesh(new THREE.SphereGeometry(0.07, 8, 8), M.red, 0, 0.68, 0.02, clutch); scene.add(clutch);
    solidBox(-39.9, -37.5, -25.8, -23.2); circles.push({ x: -41.2, z: -24.5, r: 1.3 }); keepOut(-40, -24.5, 4);
    // the flood-control board at the way in
    var bg = grp(BOARD[0], BOARD[1], 0.35);
    box(3.3, 2.5, 0.12, M.wood, 0, 2.0, -0.07, bg); [-1.5, 1.5].forEach(function (x) { box(0.16, 3.4, 0.16, M.wood, x, 1.7, -0.09, bg); }); box(3.8, 0.1, 0.9, M.roof, 0, 3.42, 0.05, bg).rotation.x = 0.18;
    board = livePanel(3.1, 2.3, 640, 476, 0, 2.0, 0, 0, bg); circles.push({ x: BOARD[0], z: BOARD[1], r: 1.4 }); keepOut(BOARD[0], BOARD[1], 3);
    // keep trunks out of the open swamp; reeds, stumps and fireflies go in instead
    for (var x = SW.x1 + 3; x < SW.x2; x += 5) for (var z = SW.z1 + 3; z < SW.z2; z += 5) keepOut(x, z, 1.6);
    var reed = new THREE.MeshLambertMaterial({ map: grassTex, alphaTest: 0.4, side: THREE.DoubleSide, color: 0x9aa878 }), cat = std(0x3a2a18, 0.9), stalk = std(0x556b38, 0.9);
    for (i = 0; i < 150; i++) {
      var pk = ['N', 'T', 'S'][i % 3], pp = POOLS[pk], an = srand() * 6.3, er = 0.92 + srand() * 0.3, rx2 = pp.x + Math.cos(an) * pp.rx * er, rz2 = pp.z + Math.sin(an) * pp.rz * er;
      if (dist(rx2, rz2, CLUTCH[0], CLUTCH[1]) < 3 || WHEELS.some(function (w) { return dist(rx2, rz2, w[0], w[1]) < 2; })) continue;
      var h = 1.3 + srand() * 1.2, rc = mesh(crossCard(1.1, h), reed, rx2, 0, rz2); rc.rotation.y = srand() * 6; rc.userData.noCast = true;
      if (i % 4 === 0) { cyl(0.012, 0.016, h + 0.5, stalk, rx2 + 0.3, (h + 0.5) / 2, rz2, null, 4); cyl(0.045, 0.045, 0.24, cat, rx2 + 0.3, h + 0.4, rz2, null, 6); }       // cattails
    }
    [[-60, -30, 1.2], [-44, -31, 0.9], [-58, -18, 1.4], [-43, -8.6, 1.0], [-62, -39, 1.1], [-56.5, -7.8, 0.8], [-44.5, -36.5, 0.7]].forEach(function (t) {   // drowned cypress stumps
      var g = grp(t[0], t[1], srand() * 6), s = t[2];
      cyl(0.28 * s, 0.6 * s, 2.2 * s, M.trunk, 0, 1.1 * s, 0, g, 9); mesh(new THREE.ConeGeometry(0.3 * s, 0.5 * s, 7), M.trunk, 0.05, 2.4 * s, 0, g).rotation.z = 0.5;
      for (var q = 0; q < 5; q++) { var ra = q * 1.26; tube([[0, 0.5 * s, 0, 0.1 * s, 0.1 * s], [Math.cos(ra) * 0.6 * s, 0.22 * s, Math.sin(ra) * 0.6 * s, 0.08 * s, 0.08 * s], [Math.cos(ra) * 1.2 * s, 0.0, Math.sin(ra) * 1.2 * s, 0.04 * s, 0.04 * s]], M.trunk, g, 6, 3); }
      circles.push({ x: t[0], z: t[1], r: 0.55 * s });
    });
    var fp = []; for (i = 0; i < 70; i++) fp.push(SW.x1 + srand() * 32, 0.5 + srand() * 2.2, SW.z1 + srand() * 37);
    var fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    fireflies = dyn(new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xc8ff7a, size: 0.09, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }))); fireflies.frustumCulled = false; scene.add(fireflies);
    makeSign('WETLAND WALK', -33.2, -5.2, 0.3, 3.6, 0, '#e8e2d0');
    for (i = 0; i < 4; i++) { var f = dyn(new THREE.Group()); tube([[0, 0, -0.16, 0.004, 0.02], [0, 0, -0.06, 0.03, 0.06], [0, 0, 0.1, 0.035, 0.07], [0, 0, 0.2, 0.01, 0.02]], std(0xaab4b8, 0.25, { metalness: 0.7 }), f, 6, 3); f.visible = false; scene.add(f); fishM.push({ g: f, t: i * 0.8, x: 0, z: 0, a: 0 }); }
  })();
  function solidBox(x1, x2, z1, z2) { boxes.push({ x1: x1, x2: x2, z1: z1, z2: z2, solid: true }); }

  // ---------- the creepers on the Visitor Center ----------
  (function () {
    var ivy = canvasTex(256, function (g, s) {
      g.clearRect(0, 0, s, s);
      for (var i = 0; i < 420; i++) { var x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * 9; if (Math.pow((x - s / 2) / (s / 2), 2) + Math.pow((y - s / 2) / (s / 2), 2) > 0.85 + Math.random() * 0.25) continue;
        g.fillStyle = ['#23401f', '#2f5226', '#1a3018', '#3c6230', '#2a4a22'][i % 5]; g.save(); g.translate(x, y); g.rotate(Math.random() * 6); g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r, -r * 0.5, r * 0.5, r * 0.5); g.lineTo(0, r); g.lineTo(-r * 0.5, r * 0.5); g.quadraticCurveTo(-r, -r * 0.5, 0, -r); g.fill(); g.restore(); }
    });
    var im = new THREE.MeshLambertMaterial({ map: ivy, alphaTest: 0.35, side: THREE.DoubleSide }), vine = std(0x2c2416, 1), i;
    function patch(x, y, z, ry, w, h) { var p = mesh(new THREE.PlaneGeometry(w, h), im, x, y, z); p.rotation.y = ry; p.rotation.z = (srand() - 0.5) * 0.5; p.userData.noCast = true; }
    for (i = 0; i < 9; i++) { patch(-11.9 + 0.07, 3.2 + srand() * 2.6, -28.5 + i * 1.6, PI / 2, 3 + srand() * 2, 2.6 + srand() * 2); patch(-32.08, 2 + srand() * 3.6, -28.5 + i * 1.6, -PI / 2, 3 + srand() * 2.5, 3 + srand() * 2.5); }
    for (i = 0; i < 12; i++) { patch(-31 + i * 1.7, 2 + srand() * 3.6, -14.93, 0, 3 + srand() * 2.5, 3 + srand() * 2.5); patch(-31 + i * 1.7, 2 + srand() * 3.6, -29.07, PI, 3 + srand() * 2.5, 3 + srand() * 2.5); }
    for (i = 0; i < 26; i++) {                                        // strands hanging off the roof edge, and woody stems climbing the walls
      var e = i % 4, t = srand(), x = e === 0 ? -11.5 : e === 1 ? -32.5 : -32 + t * 20, z = e === 0 || e === 1 ? -29 + t * 14 : e === 2 ? -14.5 : -29.5, len = 1.2 + srand() * 2.8;
      var st = mesh(new THREE.PlaneGeometry(0.55, len), im, x, 6.4 - len / 2, z); st.rotation.y = e < 2 ? PI / 2 : 0; st.userData.noCast = true;
      if (i % 3 === 0) tube([[x, 0, z, 0.05, 0.05], [x + (srand() - 0.5) * 0.6, 2.2, z + (srand() - 0.5) * 0.6, 0.04, 0.04], [x + (srand() - 0.5) * 0.9, 4.4, z + (srand() - 0.5) * 0.9, 0.03, 0.03], [x, 6.3, z, 0.02, 0.02]], vine, null, 5, 4);
    }
    for (i = 0; i < 8; i++) { var mo = mesh(sphGeo, std(0x2c4a26, 1, { bumpMap: bump(3), bumpScale: 0.1 }), -31 + srand() * 18, 6.95, -28 + srand() * 12); mo.scale.set(2 + srand() * 2.5, 0.25, 1.6 + srand() * 2); }      // moss banks on the roof
  })();

  // ---------- the Spinosaurus ----------
  spMesh = (function () {
    var skin = std(0xffffff, 0.5, { map: skinTex('#4a5648', '#161d18', '#6c7a62', '#b5ad8a', 7), bumpMap: scales(10, 16), bumpScale: 0.02 }), sailM = std(0xffffff, 0.7, { side: THREE.DoubleSide, map: canvasTex(128, function (g, s) { var gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#3c4436'); gr.addColorStop(0.45, '#4c3c2a'); gr.addColorStop(1, '#5e2c1e'); g.fillStyle = gr; g.fillRect(0, 0, s, s); blotch(g, s, ['rgba(16,20,14,.5)', 'rgba(120,70,40,.25)'], 26, 5, 16, 0.5); g.fillStyle = 'rgba(14,12,9,.3)'; for (var q = 0; q < 12; q++) g.fillRect(q * 11 + 4, 0, 2, s); }) });
    var g = new THREE.Group(), body = new THREE.Group(), k; g.add(body);
    tube([[0, 1.45, -0.95, 0.2, 0.26], [0, 1.48, -0.45, 0.37, 0.46], [0, 1.42, 0.15, 0.41, 0.52], [0, 1.44, 0.7, 0.35, 0.43], [0, 1.52, 1.1, 0.25, 0.29], [0, 1.66, 1.45, 0.175, 0.2], [0, 1.78, 1.76, 0.14, 0.155]], skin, body, 18, 5);
    var sv = [], si = [], su = [], NS = 13;                           // the sail: a fan of spines and the skin between
    for (k = 0; k < NS; k++) { var t = k / (NS - 1), z = 0.95 - t * 1.9, h = 1.05 * Math.pow(Math.sin(PI * (0.06 + t * 0.88)), 0.7), by = 1.9 + Math.sin(t * PI) * 0.04; sv.push(0, by, z, 0, by + h, z - 0.06); su.push(t, 1, t, 0); cyl(0.007, 0.016, h, skin, 0, by + h / 2, z - 0.03, body, 5).castShadow = true; if (k) { var a = (k - 1) * 2; si.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(si); sg.computeVertexNormals(); mesh(sg, sailM, 0, 0, 0, body).castShadow = true;
    var head = new THREE.Group(); head.position.set(0, 1.8, 1.8); head.userData.skin = skin; body.add(head);
    tube([[0, 0.02, -0.2, 0.06, 0.06], [0, 0.05, -0.05, 0.14, 0.13], [0, 0.04, 0.2, 0.13, 0.12], [0, 0.0, 0.6, 0.085, 0.075], [0, -0.02, 1.05, 0.066, 0.058], [0, -0.01, 1.3, 0.085, 0.064], [0, -0.03, 1.43, 0.03, 0.03]], skin, head, 14, 4);
    tube([[0, 0.14, 0.12, 0.02, 0.03], [0, 0.2, 0.3, 0.02, 0.05], [0, 0.14, 0.5, 0.015, 0.02]], skin, head, 6, 3);                       // the low crest before the eyes
    var jaw = new THREE.Group(); jaw.position.set(0, -0.07, -0.04); head.add(jaw);
    tube([[0, -0.01, -0.02, 0.09, 0.04], [0, -0.05, 0.5, 0.075, 0.04], [0, -0.05, 1.0, 0.058, 0.034], [0, -0.04, 1.28, 0.075, 0.04], [0, -0.03, 1.4, 0.03, 0.025]], skin, jaw, 12, 4);

    var tg = new THREE.ConeGeometry(0.011, 0.06, 5);
    for (k = 0; k < 14; k++) [-1, 1].forEach(function (sd) { var tz = 0.25 + k * 0.085, w = (k > 10 ? 0.075 : 0.066) - (k < 4 ? (4 - k) * -0.012 : 0); part(tg, toothMat, sd * (w - 0.006), -0.07, tz, head).rotation.x = PI; part(tg, toothMat, sd * (w - 0.012), 0.012, tz + 0.03, jaw); });
    eyeballs(head, 0.118, 0.085, 0.12, 0.03);
    var tail1 = new THREE.Group(); tail1.position.set(0, 1.48, -0.9); body.add(tail1);
    tube([[0, 0, 0.08, 0.24, 0.32], [0, 0.02, -0.7, 0.17, 0.26], [0, 0.04, -1.5, 0.11, 0.2]], skin, tail1, 14, 4);
    var tail2 = new THREE.Group(); tail2.position.set(0, 0.04, -1.48); tail1.add(tail2);
    tube([[0, 0, 0.04, 0.11, 0.2], [0, 0.03, -1.0, 0.06, 0.13], [0, 0.06, -2.1, 0.012, 0.02]], skin, tail2, 12, 4);
    var legs = [-1, 1].map(function (sd) {
      var hip = new THREE.Group(); hip.position.set(sd * 0.34, 1.4, -0.32); body.add(hip);
      tube([[0, 0.12, -0.02, 0.11, 0.16], [0, -0.2, 0.08, 0.18, 0.26], [0, -0.5, 0.16, 0.1, 0.13]], skin, hip, 12, 4);
      var knee = new THREE.Group(); knee.position.set(0, -0.5, 0.16); hip.add(knee);
      tube([[0, 0.03, 0, 0.09, 0.11], [0, -0.3, -0.12, 0.065, 0.08], [0, -0.56, -0.22, 0.05, 0.055]], skin, knee, 10, 4);
      var ankle = new THREE.Group(); ankle.position.set(0, -0.56, -0.22); knee.add(ankle);
      tube([[0, 0.02, 0, 0.05, 0.055], [0, -0.28, 0.1, 0.045, 0.05], [0, -0.33, 0.14, 0.055, 0.04]], skin, ankle, 10, 3);
      [-1, 0, 1].forEach(function (tn) { tube([[tn * 0.035, -0.31, 0.12, 0.036, 0.03], [tn * 0.1, -0.325, 0.34, 0.03, 0.025], [tn * 0.13, -0.33, 0.48, 0.014, 0.014]], skin, ankle, 8, 3); cone(0.022, 0.13, clawMat, tn * 0.14, -0.335, 0.53, ankle, 1.75); });
      return { hip: hip, knee: knee, ankle: ankle };
    });
    [-1, 1].forEach(function (sd) {                                      // long arms, hooked thumb claws
      var arm = new THREE.Group(); arm.position.set(sd * 0.33, 1.34, 0.92); arm.scale.setScalar(1.25); body.add(arm);
      tube([[0, 0.02, 0, 0.06, 0.065], [sd * 0.03, -0.24, -0.06, 0.05, 0.055], [sd * 0.04, -0.4, -0.06, 0.04, 0.045]], skin, arm, 8, 3);
      tube([[sd * 0.04, -0.4, -0.06, 0.04, 0.045], [sd * 0.03, -0.46, 0.2, 0.034, 0.036], [sd * 0.02, -0.54, 0.38, 0.03, 0.03]], skin, arm, 8, 3);
      for (var c = 0; c < 3; c++) cone(c ? 0.018 : 0.026, c ? 0.16 : 0.26, clawMat, sd * (0.02 + (c - 1) * 0.035), -0.62, 0.45, arm, 2.2);
    });
    g.scale.setScalar(2.2); g.userData = { legs: legs, tail1: tail1, tail2: tail2, head: head, jaw: jaw, body: body };
    var fish = new THREE.Group(); tube([[0, 0, -0.2, 0.005, 0.03], [0, 0, -0.06, 0.035, 0.08], [0, 0, 0.12, 0.04, 0.09], [0, 0, 0.24, 0.01, 0.02]], std(0xaab4b8, 0.25, { metalness: 0.7 }), fish, 6, 3); fish.position.set(0, -0.02, 0.9); fish.rotation.y = PI / 2; fish.visible = false; jaw.add(fish); g.userData.fish = fish;
    scene.add(g); return dyn(g);
  })();
  dinos[1].hx = -30; dinos[1].hz = 22; dinos[1].hr = 24;                // the raptor that used to live here has moved out

  // ---------- the board: a live schematic ----------
  function drawBoard() {
    var g = gates(), sig = g.join() + fishPool() + (P.power ? 1 : 0); if (sig === boardSig) return; boardSig = sig;
    var c = board.g, W2 = 640, H2 = 476, fp = fishPool(), fl = flowing();
    c.fillStyle = '#12201a'; c.fillRect(0, 0, W2, H2); c.strokeStyle = '#7fd6a8'; c.lineWidth = 5; c.strokeRect(4, 4, W2 - 8, H2 - 8);
    c.fillStyle = '#7fd6a8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 36px Impact, "Arial Black", sans-serif'; c.fillText('WETLAND FLOOD CONTROL', W2 / 2, 34);
    c.strokeStyle = '#3c8ea0'; c.lineWidth = 9; c.beginPath(); c.moveTo(60, 86); c.lineTo(580, 86); c.moveTo(200, 86); c.lineTo(200, 120); c.moveTo(500, 86); c.lineTo(500, 205); c.lineTo(330, 205); c.moveTo(210, 250); c.lineTo(210, 290); c.stroke();
    c.font = '15px "Trebuchet MS", Arial'; c.fillStyle = '#9fb4a8'; c.fillText('INLET', 60, 68);
    function pool(x, y, name, k) { c.fillStyle = k === fp ? '#1d6a80' : '#16303a'; c.beginPath(); c.ellipse(x, y, 104, 34, 0, 0, 7); c.fill(); c.strokeStyle = '#3c8ea0'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#d6e4e0'; c.font = 'bold 17px "Trebuchet MS", Arial'; c.fillText(name, x, y - 6); c.font = '14px "Trebuchet MS", Arial'; c.fillStyle = k === fp ? '#ffd23a' : '#7c8f88'; c.fillText(k === fp ? '◆ FISH HERE ◆' : '—', x, y + 14); }
    pool(200, 155, 'NORTH POOL', 'N'); pool(225, 215 + 8, 'TURBINE POOL', 'T'); pool(225, 322, 'SOUTH POOL', 'S');
    function gate(x, y, n) { c.fillStyle = g[n] ? '#35d07a' : '#d0402c'; c.fillRect(x - 15, y - 9, 30, 18); c.fillStyle = '#0c1410'; c.font = 'bold 13px Arial'; c.fillText(n + 1, x, y + 1); c.fillStyle = g[n] ? '#35d07a' : '#ff6a5a'; c.font = 'bold 14px "Trebuchet MS", Arial'; c.textAlign = 'left'; c.fillText('GATE ' + (n + 1) + (g[n] ? ' OPEN' : ' SHUT'), x + 22, y + 1); c.textAlign = 'center'; }
    gate(200, 104, 0); gate(500, 120, 1); gate(210, 270, 2);
    c.fillStyle = fl ? '#ffd23a' : '#5a6660'; c.beginPath(); c.arc(388, 205, 20, 0, 7); c.fill(); c.fillStyle = '#0c1410'; c.font = 'bold 12px Arial'; c.fillText('MILL', 388, 206);
    c.fillStyle = fl ? '#ffd23a' : '#9fb4a8'; c.font = '15px "Trebuchet MS", Arial'; c.fillText(P.power ? 'TURBINE RUNNING' : fl ? 'RACE FLOWING — ENGAGE CLUTCH' : 'NO FLOW THROUGH THE RACE', 470, 240, 300);
    c.textAlign = 'left'; c.fillStyle = '#e4eee4'; c.font = '17px "Trebuchet MS", Arial';
    ['Gate 1 feeds the north pool.  Gate 2 feeds the mill race.', 'Gate 3 drains the turbine pool south.  The mill only turns', 'when water runs THROUGH the race: gates 2 and 3 both open.', 'The fish keep to still, deep water and leave a draining pool;', 'given the choice they follow fresh water.  It follows the fish.'].forEach(function (l, i) { c.fillText(l, 22, 372 + i * 22, W2 - 44); });
    c.textAlign = 'center'; board.tex.needsUpdate = true;
  }

  // ---------- hooks ----------
  S.drag = function (x, z) { return inPool(x, z) ? 0.6 : inRect(x, z, SW) ? 0.92 : 1; };
  S.target = function () { var g = gates(); return !sp.told ? BOARD : !g[2] || !g[1] ? [WHEELS[g[1] ? (g[0] ? 2 : 0) : 1][0], WHEELS[g[1] ? (g[0] ? 2 : 0) : 1][1]] : CLUTCH; };
  S.objective = function () {
    var g = gates();
    if (!sp.told) return 'The Visitor Center shutter has no power. Its supply comes from the wetland behind the building.';
    if (flowing()) return 'Water is running through the mill race. Engage the turbine clutch at the pump house' + (fishPool() === 'S' ? ' — the Spinosaurus is fishing the south pool, close by.' : '.');
    return 'Wetland: get water running through the mill race (gates 2 and 3), and move the fish to draw the Spinosaurus off the turbine pool.';
  };
  S.flash = function (inBeam) { if (!inBeam(sp.x, sp.z, 32, 5)) return 0; sp.state = 'stun'; sp.stunT = DIFF.stun * 0.7; Sound.roar(true, 0.6); return 1; };
  S.interact = function (px, pz) {
    if (P.power) return null;
    var g = gates(), i;
    for (i = 0; i < 3; i++) if (dist(px, pz, WHEELS[i][0], WHEELS[i][1] + 0.5) < 1.9) return { text: '[Hold E] ' + (g[i] ? 'Close' : 'Open') + ' gate ' + (i + 1) + ' — ' + WHEELS[i][2].toLowerCase(), prog: hold[i], hold: (function (n) { return function (dt) {
      hold[n] += dt / (2.4 * DIFF.hold); holdT[n] = 0.2; wheels[n].rotation.z += dt * (g[n] ? -5 : 5); tick -= dt; if (tick <= 0) { tick = 0.3; Sound.clunk(); makeNoise(player.x, player.z, 12); }
      if (hold[n] >= 1) { hold[n] = 0; g[n] = !g[n]; sp.delay = 5; Sound.grind(); Sound.splash(); showMsg('Gate ' + (n + 1) + ' ' + (g[n] ? 'grinds open. Water moves.' : 'drops shut.') + (fishPool() !== sp.pool ? '  Out in the pools, the fish are shifting.' : ''), 5); }
    }; })(i) };
    if (dist(px, pz, CLUTCH[0] + 0.5, CLUTCH[1]) < 2) return !flowing() ? { text: 'Turbine clutch — the wheel hangs dead. No water is running through the race.', fn: function () { Sound.deny(); } }
      : { text: '[Hold E] Engage the turbine clutch', prog: hold[3], hold: function (dt) {
        hold[3] += dt / (3 * DIFF.hold); holdT[3] = 0.2; tick -= dt; if (tick <= 0) { tick = 0.3; Sound.clunk(); makeNoise(player.x, player.z, 16); }
        if (hold[3] >= 1) { hold[3] = 0; P.power = true; Sound.grind(); Sound.chime(); makeNoise(player.x, player.z, 40); showMsg('The wheel bites, the belts scream, and lights stutter on in the Visitor Center. The shutter is lifting — and that was loud.', 6); }
      } };
    return null;
  };
  var holdT = [0, 0, 0, 0], tick = 0;
  S.step = function (dt, instant) {
    var g = gates(), k, i, want = { N: g[0] ? 1 : 0.3, T: g[2] ? 0.35 : (g[1] ? 1 : 0.75), S: g[2] ? 1 : 0.3 };
    if (P.fuseGot) for (i = 0; i < P.fuseGot.length; i++) P.fuseGot[i] = true;
    for (k in POOLS) { level[k] = instant ? want[k] : level[k] + clamp(want[k] - level[k], -dt * 0.09, dt * 0.09); var sc = 0.55 + 0.45 * level[k]; poolMesh[k].scale.set(POOLS[k].rx * sc, POOLS[k].rz * sc, 1); }
    for (i = 0; i < 3; i++) { var tgt = g[i] ? 1.0 : 0; plates[i].position.y = instant ? 0.5 + tgt : plates[i].position.y + clamp(0.5 + tgt - plates[i].position.y, -dt * 0.5, dt * 0.5); lampM[i].color.setHex(g[i] ? 0x35ff8a : 0xff3020); }
    clutch.rotation.x = P.power ? 0.7 : -0.5;
    if (instant) { sp.pool = fishPool(); var p = POOLS[sp.pool]; sp.x = p.x; sp.z = p.z; sp.state = 'fish'; sp.aware = 0; sp.stunT = 0; sp.delay = 0; sp.told = !!P.power; boardSig = ''; place(0); }
    drawBoard();
  };
  function place(dt) {
    var u = spMesh.userData, run = sp.state === 'hunt', amp = clamp(sp.speed / 3, 0, 1) * (run ? 0.8 : 0.5), k;
    sp.phase += sp.speed * dt * 0.8;
    for (k = 0; k < 2; k++) { var lp = sp.phase + k * PI, lg = u.legs[k]; lg.hip.rotation.x = -Math.sin(lp) * amp; lg.knee.rotation.x = 0.12 + Math.max(0, Math.cos(lp)) * amp * 1.1; lg.ankle.rotation.x = -Math.max(0, Math.cos(lp)) * amp * 0.7; }
    u.body.position.y = Math.abs(Math.sin(sp.phase)) * 0.05 * amp; u.tail1.rotation.y = Math.sin(sp.phase - 0.6) * 0.2 * (0.4 + amp) + Math.sin(playTime * 0.7) * 0.07; u.tail2.rotation.y = Math.sin(sp.phase - 1.5) * 0.3 * (0.4 + amp);
    spMesh.position.set(sp.x, inPool(sp.x, sp.z) ? -0.25 : 0, sp.z); spMesh.rotation.y = sp.rot;
  }
  function go(tx, tz, speed, dt) {
    var dx = tx - sp.x, dz = tz - sp.z, len = Math.hypot(dx, dz); if (len < 0.01) { sp.speed = 0; return 0; }
    var diff = angDiff(Math.atan2(dx, dz), sp.rot), turn = 2.0 * dt; sp.rot += clamp(diff, -turn, turn);
    var fwd = Math.max(0.2, Math.cos(Math.min(Math.abs(diff), PI / 2))); sp.x += Math.sin(sp.rot) * speed * fwd * dt; sp.z += Math.cos(sp.rot) * speed * fwd * dt;
    sp.x = clamp(sp.x, ROAM.x1, ROAM.x2); sp.z = clamp(sp.z, ROAM.z1, ROAM.z2);
    if (sp.x > -45.5 && sp.z > -27.5 && sp.z < -21.5) sp.x = -45.5;                                   // it does not walk through the mill
    sp.speed = speed * fwd; return len;
  }
  S.update = function (dt, c, speed) {
    var px = player.x, pz = player.z, dp = dist(sp.x, sp.z, px, pz), u = spMesh.userData, i, wet = inPool(px, pz), near = inRect(px, pz, SW, 14), fl = flowing() ? 1 : 0;
    for (i = 0; i < 4; i++) { holdT[i] -= dt; if (holdT[i] <= 0) hold[i] = Math.max(0, hold[i] - dt * 1.5); }
    if (!sp.told && dist(px, pz, BOARD[0], BOARD[1]) < 7) { sp.told = true; showMsg('WETLAND FLOOD CONTROL. Three gates, three pools — and something very large standing in one of them.', 6); }
    for (i = 0; i < flowMat.length; i++) { var on = flowMat[i][1] === 0 ? gates()[0] : flowMat[i][1] === 1 ? gates()[1] : gates()[2]; if (on) flowMat[i][0].bumpMap.offset.y -= dt * 0.5; }
    S.waterMat.bumpMap.offset.set(playTime * 0.008, playTime * 0.011);
    mill.rotation.z -= dt * (P.power ? 1.6 : fl ? 0.5 : 0);
    if (near) {
      fireflies.material.opacity = 0.55 + 0.35 * Math.sin(playTime * 1.7); fireflies.position.y = Math.sin(playTime * 0.4) * 0.3;
      sp.croakT -= dt; if (sp.croakT <= 0) { sp.croakT = 2 + Math.random() * 5; var f0 = 140 + Math.random() * 90; Sound.tone(f0, f0 * 0.8, 0.09, 0.05, 'square'); Sound.tone(f0 * 1.1, f0 * 0.85, 0.11, 0.05, 'square', 0.16); }
      if (P.power && Math.random() < dt * 0.6) Sound.noise(0.3, 400, 0.05);
    }
    // wading is slow and loud
    if (wet && speed > 0.6) { sp.splashT -= dt; if (sp.splashT <= 0) { sp.splashT = 0.42; Sound.noise(0.22, 1500, 0.3); Sound.noise(0.3, 500, 0.2, 0.05); makeNoise(px, pz, 18); } }
    // the fish, wherever the water suits them
    var fpk = fishPool(), fp = POOLS[fpk];
    for (i = 0; i < fishM.length; i++) { var f = fishM[i]; f.t += dt; if (f.t > 2.6 + i * 0.7) { f.t = 0; var a = Math.random() * 6.3, r = Math.sqrt(Math.random()) * 0.7; f.x = fp.x + Math.cos(a) * fp.rx * r; f.z = fp.z + Math.sin(a) * fp.rz * r; f.a = Math.random() * 6.3; if (near && dist(px, pz, f.x, f.z) < 26) Sound.noise(0.12, 2600, 0.07); }
      var k = f.t / 0.7; f.g.visible = k < 1; if (k < 1) { f.g.position.set(f.x + Math.sin(f.a) * k * 0.9, 0.06 + Math.sin(k * PI) * 0.75, f.z + Math.cos(f.a) * k * 0.9); f.g.rotation.set(-Math.cos(k * PI) * 1.1, f.a, 0); } }
    // ----- the animal -----
    if (sp.state === 'stun') { sp.stunT -= dt; sp.speed = 0; u.head.rotation.z = Math.sin(playTime * 20) * 0.25; u.jaw.rotation.x = 0.4; if (sp.stunT <= 0) { sp.state = 'walk'; sp.aware = 0; u.head.rotation.z = 0; } place(dt); return false; }
    var noise = wet ? 30 : c.sprint ? 21 : c.moving ? (c.crouch ? 4.5 : 10.5) : 3, facing = c.light && dp < 16 && (-(sp.x - px) * Math.sin(player.yaw) - (sp.z - pz) * Math.cos(player.yaw)) / dp > 0.85;
    var sensed = !c.hidden && inRect(px, pz, ROAM, 12) && (dp < noise * DIFF.sight * (sp.state === 'fish' ? 0.85 : 1) || facing || dp < 5.5);
    if (sp.state !== 'hunt') { sp.aware = sensed ? sp.aware + dt / (DIFF.react * 1.6 + 0.4) : Math.max(0, sp.aware - dt * 0.3); if (sp.aware >= 1 || (sensed && dp < 6.5)) { sp.state = 'hunt'; Sound.roar(true, 1); shake = Math.max(shake, 0.8); showMsg('It has heard you.', 2.5); } }
    if (sp.state === 'hunt') {
      go(px, pz, 6.9 * DIFF.speed, dt); chaseHold = 4;
      var hx = sp.x + Math.sin(sp.rot) * 6.4, hz = sp.z + Math.cos(sp.rot) * 6.4;
      if (!c.hidden && player.y < 2 && (dp < 4.3 || dist(hx, hz, px, pz) < 2.6)) { die('spino'); return true; }
      if (!inRect(px, pz, ROAM, 9) || dp > 36 || c.hidden) { sp.state = 'walk'; sp.aware = 0; Sound.growl(1); }
      u.jaw.rotation.x = 0.35 + Math.sin(playTime * 8) * 0.12; u.body.rotation.x = 0.1; u.head.rotation.x = -0.05;
    } else {
      if (fpk !== sp.pool) { sp.delay -= dt; if (sp.delay <= 0) { sp.pool = fpk; sp.state = 'walk'; } }
      var tp = POOLS[sp.pool];
      if (sp.state === 'walk') { if (go(tp.x, tp.z, 3.3, dt) < 1.6) { sp.state = 'fish'; sp.cyc = 1.5; } u.body.rotation.x = 0; u.head.rotation.x = 0; u.jaw.rotation.x = 0.05; }
      else {                                                              // fishing: it stands in the pool, watches, and strikes
        sp.speed = 0; sp.cyc += dt; var cy = sp.cyc % 8.5, strike = cy > 5 && cy < 5.5 ? (cy - 5) / 0.5 : cy >= 5.5 && cy < 6.3 ? 1 : cy >= 6.3 && cy < 7.1 ? 1 - (cy - 6.3) / 0.8 : 0;
        sp.rot += Math.sin(playTime * 0.25) * dt * 0.12;
        u.body.rotation.x = 0.16 + strike * 0.3; u.head.rotation.x = 0.28 + strike * 0.5; u.head.rotation.y = strike ? 0 : Math.sin(playTime * 0.6) * 0.3; u.jaw.rotation.x = cy > 4.6 && cy < 5.4 ? 0.5 : cy > 6.6 && cy < 8 ? 0.16 + Math.max(0, Math.sin(playTime * 9)) * 0.2 : 0.04;
        u.fish.visible = cy > 5.6 && cy < 7.6;
        if (cy > 5.45 && cy - dt <= 5.45 && near) { var v = clamp(1 - dp / 40, 0.1, 1); Sound.noise(0.5, 1800, 0.4 * v); Sound.noise(0.8, 500, 0.3 * v, 0.08); }
        if (sp.aware > 0.3) { u.head.rotation.x = -0.05; u.head.rotation.y = clamp(angDiff(Math.atan2(px - sp.x, pz - sp.z), sp.rot), -0.9, 0.9); u.body.rotation.x = 0.05; }
      }
    }
    if (sp.speed > 0.5 && near) { sp.stepT = (sp.stepT || 0) - dt * (sp.state === 'hunt' ? 2.1 : 1); if (sp.stepT <= 0) { sp.stepT = 0.9; var v2 = clamp(1 - dp / 60, 0.05, 1); Sound.thud(v2 * 0.45); if (inPool(sp.x, sp.z)) Sound.noise(0.3, 900, 0.25 * v2); if (dp < 40) shake = Math.max(shake, v2 * v2 * 0.7); } }
    aiNearest = Math.min(aiNearest, dp); if (sp.aware > aiAlert) aiAlert = sp.aware;
    place(dt); return false;
  };
  // what you see when it gets you: the long jaws come down out of the dark
  S.kill = function (done) {
    var c0 = camera.position.clone(), yaw0 = camera.rotation.y, pitch0 = camera.rotation.x, T = 0, DUR = 2.5, u = spMesh.userData, ev = {}, tip = new THREE.Vector3();
    var dx = sp.x - c0.x, dz = sp.z - c0.z, dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    var yaw1 = yaw0 + angDiff(Math.atan2(-dx, -dz), yaw0), face = Math.atan2(-dx, -dz), D = 9.6, fov0 = camera.fov, CN;
    function seg(t, a, b) { return sstep((t - a) / (b - a)); }
    function once(k, t) { if (T >= t && !ev[k]) { ev[k] = 1; return true; } return false; }
    Scares.sting();
    startCine(CN = { pulse: 0, update: function (dt) {
      T += dt;
      var loom = seg(T, 0.1, 0.9), strike = seg(T, 0.95, 1.2), shakeK = seg(T, 1.2, 1.9), fin = seg(T, DUR - 0.75, DUR - 0.25), sh = 0.3 + loom * 0.3 + strike * 0.5;
      u.body.rotation.x = lerp(0.05, 0.3, loom) + strike * 0.03; u.head.rotation.set(lerp(0, -0.2, loom) + strike * 0.1, Math.sin(T * 9) * 0.22 * shakeK * (1 - fin), Math.sin(T * 9) * 0.12 * shakeK * (1 - fin));
      u.jaw.rotation.x = Math.max(lerp(0.2, 0.8, seg(T, 0.2, 0.85)) - strike * 0.5 + shakeK * 0.15, fin * 0.85);
      var want = lerp(7.5, 2.1, loom) - strike * 0.7 - fin * 0.3; D = 16;
      for (var k = 0; k < 150; k++) {                                   // bring the snout in to arm's length, never through the lens
        spMesh.position.set(c0.x + dx * D, -0.1, c0.z + dz * D); spMesh.rotation.y = face; spMesh.updateMatrixWorld(true);
        tip.set(0, -0.03, 1.43).applyMatrix4(u.head.matrixWorld); if (tip.distanceTo(c0) <= want || Math.hypot(tip.x - c0.x, tip.z - c0.z) < 0.9) break; D -= 0.1;
      }
      var cy = c0.y + shakeK * 0.9 * (1 - fin * 0.4), pitch = lerp(pitch0, clamp(Math.atan2(tip.y - cy, Math.max(0.5, Math.hypot(tip.x - c0.x, tip.z - c0.z))), -0.3, 1.1), seg(T, 0.05, 0.45));
      camera.position.set(c0.x + Math.sin(T * 41) * sh * 0.04, cy + Math.sin(T * 53) * sh * 0.04, c0.z + Math.sin(T * 37) * sh * 0.03);
      camera.rotation.set(pitch + Math.sin(T * 47) * sh * 0.02, lerp(yaw0, yaw1, easeOut(clamp(T / 0.18, 0, 1))) + Math.sin(T * 9) * 0.05 * shakeK, shakeK * 0.3 * Math.sin(T * 6));
      var punch = strike * (1 - seg(T, 1.2, 1.6)) * 14; if (Math.abs(camera.fov - (fov0 + punch)) > 0.05) { camera.fov = fov0 + punch; camera.updateProjectionMatrix(); }
      flashlight.intensity = 1.2; Hands.fill.intensity = 0.6; CN.pulse = clamp(sh, 0, 1);
      if (once('r', 0.02)) Sound.roar(true, 1); if (once('s', 0.5)) Sound.splash(); if (once('hit', 0.98)) { Scares.crunch(1); Sound.thud(1); } if (once('b2', 1.5)) Scares.crunch(1); if (once('o', DUR - 0.72)) Sound.roar(true, 0.9); if (once('last', DUR - 0.2)) { Scares.crunch(1); Sound.thud(1); }
      Scares.maw(seg(T, DUR - 0.55, DUR - 0.18)); $('fade').style.opacity = seg(T, DUR - 0.2, DUR - 0.1);
      return T >= DUR;
    }, end: function () { camera.fov = 72; camera.updateProjectionMatrix(); camera.rotation.z = 0; u.head.rotation.set(0, 0, 0); $('fade').style.opacity = 1; done(); setTimeout(function () { Scares.maw(0); $('fade').style.opacity = 0; }, 900); } });
  };
  S.sp = sp; S.gates = gates; S.fishPool = fishPool; S.POOLS = POOLS; S.WHEELS = WHEELS; S.CLUTCH = CLUTCH;
  return S;
})();
