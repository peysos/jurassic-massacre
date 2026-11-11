/* Jurassic Massacre — entrance: the front gate and its sign, the approach road outside, the plaza and the ticket lanes.
   (The gift shop and the generator shed, which stand on the plaza, are in shop.js.)

   The gate is an ordinary pair of swing leaves between brick pillars.  Each leaf hangs on three hinges, is pushed by a linear
   ram bolted to its pillar, and carries its free end on a wheel that rolls along a steel quadrant set in the paving, so
   every part of the motion can be inspected and makes sense.  Entrance.setGate(0..1) poses all of it. */
'use strict';

var Entrance = (function () {
  var E = { open: 0, driven: false, lights: {} }, i, k;
  var GZ = WORLD - 0.6, HX = 3.45;                 // plane of the leaves (flush with the inside face of the pillars); hinge x
  var FONT = '"Arial Rounded MT Bold", "Trebuchet MS", "Segoe UI", sans-serif';
  var glow = WB.glow, dummy = new THREE.Object3D();

  // ---------- small builders ----------
  function inst(geo, mat, list, parent) {          // one draw call for many copies: [x, y, z, sx, sy, sz, rx, ry, rz]
    var m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(function (p, n) {
      dummy.position.set(p[0], p[1], p[2]); dummy.scale.set(p[3] === undefined ? 1 : p[3], p[4] === undefined ? 1 : p[4], p[5] === undefined ? 1 : p[5]);
      dummy.rotation.set(p[6] || 0, p[7] || 0, p[8] || 0); dummy.updateMatrix(); m.setMatrixAt(n, dummy.matrix);
    });
    m.frustumCulled = false; (parent || scene).add(m); return m;
  }
  function rt(mat, rx, ry) {                        // the same material tiled differently
    var m = mat.clone();
    ['map', 'normalMap', 'bumpMap'].forEach(function (key) { if (mat[key]) { m[key] = mat[key].clone(); m[key].needsUpdate = true; m[key].repeat.set(rx, ry); } });
    return m;
  }
  function flat(w, d, mat, x, y, z, parent) { var m = mesh(new THREE.PlaneGeometry(w, d), mat, x, y, z, parent); m.rotation.x = -PI / 2; m.userData.noCast = true; return m; }
  // ---------- materials ----------
  function brickPaint(height) {
    return function (g, S) {
      var rows = 8, cols = 4, bh = S / rows, bw = S / cols, r, c, cols2 = ['#6d3b2a', '#7a4530', '#5e3325', '#844b33', '#693a2c', '#74402b', '#553024'];
      g.fillStyle = height ? '#3c3c3c' : '#5d574c'; g.fillRect(0, 0, S, S);
      for (r = 0; r < rows; r++) for (c = -1; c < cols; c++) {
        var x = c * bw + (r % 2 ? bw / 2 : 0) + 2, y = r * bh + 2, n = (r * 7 + (c + 1) * 13 + r * (c + 2)) % 7;
        if (height) { var v = 165 + n * 11; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; } else g.fillStyle = cols2[n];
        g.fillRect(x, y, bw - 4, bh - 4);
      }
      if (height) { g.globalAlpha = 0.35; speckle('rgba(0,0,0,0)', ['#606060', '#d0d0d0', '#909090'], 2600, 1.6)(g, S); g.globalAlpha = 1; }
      else { g.globalAlpha = 0.28; speckle('rgba(0,0,0,0)', ['#4a2a1e', '#8d5a40', '#5a3324'], 1600, 1.2)(g, S); g.globalAlpha = 1; blotch(g, S, ['#1d1f16', '#2c2a1c', '#cfc8b4'], 14, 12, 60, 0.2); }
    };
  }
  var EM = {
    brick: std(0xffffff, 0.94, { map: canvasTex(256, brickPaint(false)), normalMap: normalTex(256, brickPaint(true), 2.4), normalScale: new THREE.Vector2(0.9, 0.9) }),
    stone: std(0xffffff, 0.9, { map: canvasTex(128, function (g, S) { speckle('#8f8a7c', ['#7d7869', '#a09a8b', '#6c675b', '#b0aa9a'], 2600, 2)(g, S); blotch(g, S, ['#2f3524', '#4a4636', '#1e2118'], 12, 8, 40, 0.5); streaks(g, S, S, 10, 'rgba(30,32,22,.8)'); }),
      bumpMap: bump(2), bumpScale: 0.03 }),
    iron: std(0xffffff, 0.62, { metalness: 0.55, map: canvasTex(128, function (g, S) { speckle('#17181a', ['#101112', '#222426', '#1c1d1f'], 1500, 2)(g, S); blotch(g, S, ['#5a2e16', '#74401e', '#3a1e10'], 16, 4, 20, 0.6); }), bumpMap: bump(3), bumpScale: 0.02 }),
    rustSteel: std(0xffffff, 0.8, { metalness: 0.45, map: canvasTex(128, function (g, S) { speckle('#4b4037', ['#6a3c20', '#3a332e', '#7d4a26', '#2c2622', '#58483c'], 2600, 2.5)(g, S); blotch(g, S, ['#8a4a1e', '#2a1a12'], 12, 6, 28, 0.5); }), bumpMap: bump(2), bumpScale: 0.03 }),
    steel: std(0xb4babd, 0.42, { metalness: 0.8, map: metalTex }),
    paver: std(0xffffff, 0.95, {
      map: canvasTex(512, function (g, S) {
        var n = 8, c = S / n, a, b, tones = ['#77736a', '#6c685f', '#817c72', '#646057', '#7b766b'];
        g.fillStyle = '#2b2d22'; g.fillRect(0, 0, S, S);
        for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = tones[(a * 3 + b * 5 + a * b) % 5]; g.fillRect(a * c + 2, b * c + 2, c - 4, c - 4); }
        g.globalAlpha = 0.45; speckle('rgba(0,0,0,0)', ['#4f4b43', '#8f8a7f', '#5c5850', '#3d3a33'], 9000, 1.6)(g, S); g.globalAlpha = 1;
        blotch(g, S, ['#23301a', '#1a1c14', '#34301f', '#2c3a1e'], 46, 14, 90, 0.42);
        g.strokeStyle = 'rgba(20,20,16,.75)'; g.lineWidth = 1.4;                                   // cracks
        for (a = 0; a < 9; a++) { var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); for (b = 0; b < 9; b++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 30; g.lineTo(x, y); } g.stroke(); }
      }),
      normalMap: normalTex(256, function (g, S) { var n = 4, c = S / n, a, b; g.fillStyle = '#202020'; g.fillRect(0, 0, S, S); for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = '#b0b0b0'; g.fillRect(a * c + 2, b * c + 2, c - 4, c - 4); } g.globalAlpha = 0.3; speckle('rgba(0,0,0,0)', ['#606060', '#e0e0e0'], 3000, 1.5)(g, S); g.globalAlpha = 1; }, 1.6, 2), normalScale: new THREE.Vector2(0.7, 0.7) }),
    asphalt: std(0xffffff, 0.96, {
      map: canvasTex(512, function (g, S) {
        speckle('#232425', ['#1a1b1c', '#2e2f31', '#141516', '#383a3c', '#262728'], 26000, 1.5)(g, S);
        blotch(g, S, ['#101112', '#35322c', '#1b2016'], 40, 20, 110, 0.4);
        g.strokeStyle = 'rgba(6,6,6,.9)';
        for (var a = 0; a < 14; a++) { g.lineWidth = 0.8 + Math.random() * 2; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); for (var b = 0; b < 12; b++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.3) * 50; g.lineTo(x, y); } g.stroke(); }
      }), bumpMap: bump(10), bumpScale: 0.012 }),
    cream: std(0xffffff, 0.82, { map: canvasTex(256, function (g, S) { g.fillStyle = '#cfc6a8'; g.fillRect(0, 0, S, S); g.globalAlpha = 0.3; speckle('rgba(0,0,0,0)', ['#b8ae90', '#ddd5ba', '#a89e82'], 2200, 3)(g, S); g.globalAlpha = 1; chips(g, S, S, 26, '#6f6a5c'); streaks(g, S, S, 22, 'rgba(48,40,22,.9)'); grime(g, S, S, 1); }), bumpMap: bump(2), bumpScale: 0.012 }),
    green: std(0xffffff, 0.7, { map: canvasTex(128, function (g, S) { g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S, S); chips(g, S, S, 18, '#1a1c18'); chips(g, S, S, 8, '#6a3c20'); grime(g, S, S, 0.8); }), bumpMap: bump(2), bumpScale: 0.01 }),
    glassDirty: std(0x5d7372, 0.62, { transparent: true, opacity: 0.2, metalness: 0.1, depthWrite: false }),      // filmed with dirt: no mirror glare
    rubber: std(0x0c0c0d, 0.9), plastic: std(0x2a2c2e, 0.55), amber: basic(0x241200, { fog: false })
  };
  E.M = EM; E.inst = inst; E.rt = rt; E.flat = flat; E.streaks = streaks; E.grime = grime; E.chips = chips; E.FONT = FONT;

  // ---------- lights owned by the entrance (their number never changes; they are faded, recoloured and, for the intro, moved) ----------
  function light(name, color, x, y, z, range, decay) { var l = dyn(new THREE.PointLight(color, 0, range, decay || 1.4)); l.position.set(x, y, z); scene.add(l); E.lights[name] = l; l.userData.home = [x, y, z, range]; return l; }
  light('gate', 0xffb060, 4.15, 3.2, GZ - 1.4, 16);        // status glow at the gate (amber beacon, red/green reader)
  light('plaza', 0xffc98a, -5.4, 4.6, 133, 26);
  light('shop', 0xfff0d2, 18, 2.9, 128, 17);
  light('term', 0x8dffb8, 22.2, 1.5, 128.2, 6, 1.6);
  light('shed', 0xffd9a0, -19, 2.5, 127, 11);

  // ---------- the wall around the gate ----------
  [-1, 1].forEach(function (s) {
    addBox(s * 4.15, WORLD, 1.3, 1.3, 4.3, rt(EM.brick, 1.44, 7.2));                                  // gate pillar
    box(1.56, 0.16, 1.56, EM.stone, s * 4.15, 4.38, WORLD); box(1.36, 0.14, 1.36, EM.stone, s * 4.15, 4.52, WORLD);   // stepped cap
    box(1.5, 0.3, 1.5, EM.stone, s * 4.15, 0.15, WORLD);                                              // plinth
    addBox(s * 7.0, WORLD, 4.4, 0.5, 3.3, rt(EM.brick, 4.9, 5.5));                                    // wing wall
    box(4.4, 0.14, 0.66, EM.stone, s * 7.0, 3.37, WORLD);
    addBox(s * 9.75, WORLD, 1.3, 1.9, 5.5, rt(EM.brick, 1.5, 9.2));                                   // pier that ends the tall perimeter wall
    box(1.5, 0.2, 2.1, EM.stone, s * 9.75, 5.6, WORLD);
    // iron railing along the top of the wing wall
    var bars = [], tips = [];
    for (var q = 0; q < 16; q++) { var x = s * (5.0 + q * 0.27); bars.push([x, 3.84, WORLD, 1, 0.8, 1]); tips.push([x, 4.31, WORLD]); }
    inst(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), EM.iron, bars); inst(new THREE.ConeGeometry(0.03, 0.14, 4), EM.iron, tips);
    box(4.3, 0.035, 0.035, EM.iron, s * 7.0, 4.2, WORLD); box(4.3, 0.035, 0.035, EM.iron, s * 7.0, 3.5, WORLD);
  });
  box(9.6, 0.1, 2.3, EM.stone, 0, 0.0, WORLD - 0.1).userData.noCast = true;                           // threshold slab

  // ---------- the arch and its letters ----------
  function archY(x, base) { var t = x / 4.15; return base + 1.05 * (1 - t * t); }
  function rail(base, r, z) {
    var pts = []; for (var q = -10; q <= 10; q++) { var x = q / 10 * 4.15; pts.push(new THREE.Vector3(x, archY(x, base), z)); }
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 8), EM.iron);
  }
  var AZ = WORLD + 0.18;                                                                               // the sign stands toward the road
  rail(4.66, 0.06, AZ); rail(5.84, 0.06, AZ); rail(4.66, 0.03, AZ - 0.36);                           // two face rails and a rear stay rail
  [-1, 1].forEach(function (s) { box(0.3, 0.07, 0.6, EM.iron, s * 4.15, 4.62, AZ - 0.16); cyl(0.05, 0.05, 1.18, EM.iron, s * 4.15, 5.25, AZ, null, 8); });
  var struts = [];
  for (i = -5; i <= 4; i++) { var sx = i * 0.8 + 0.4; struts.push([sx, archY(sx, 5.25), AZ, 1, 1.18, 1]); struts.push([sx, archY(sx, 4.66), AZ - 0.18, 1, 0.37, 1, PI / 2, 0, 0]); }
  inst(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), EM.iron, struts);
  function letterTex(ch, seed) {
    return canvasTex(128, function (g, S, H) {
      g.fillStyle = '#254a30'; g.fillRect(0, 0, S, H);
      g.strokeStyle = '#d9ae35'; g.lineWidth = 6; g.strokeRect(7, 7, S - 14, H - 14);
      g.fillStyle = '#ece3c4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 122px ' + FONT; g.fillText(ch, S / 2, H / 2 + 6);
      chips(g, S, H, 9 + seed % 5, '#1b1a16'); chips(g, S, H, 5, '#6b3a1c');
      streaks(g, S, H, 9, 'rgba(92,48,20,.95)', H * 0.8); grime(g, S, H, 1.1);
      g.fillStyle = '#18140e'; [[13, 13], [S - 13, 13], [13, H - 13], [S - 13, H - 13]].forEach(function (b) { g.beginPath(); g.arc(b[0], b[1], 3.6, 0, 7); g.fill(); });
    }, 1, 1, true, 160);
  }
  var plateBack = EM.rustSteel, word = 'FAMILY ZOO';
  E.letters = [];
  for (i = 0; i < word.length; i++) {
    var lx = (i - 4.5) * 0.8, ly = archY(lx, 5.25), slope = Math.atan(-2 * 1.05 * lx / (4.15 * 4.15));
    if (word[i] === ' ') {                                                                              // a footprint medallion fills the gap
      var med = mesh(new THREE.CircleGeometry(0.25, 20), std(0xffffff, 0.8, { map: canvasTex(64, function (g, S) { g.fillStyle = '#d9ae35'; g.fillRect(0, 0, S, S); g.fillStyle = '#254a30'; g.beginPath(); g.ellipse(32, 40, 11, 13, 0, 0, 7); g.fill(); [[18, 22], [32, 15], [46, 22]].forEach(function (t) { g.beginPath(); g.ellipse(t[0], t[1], 5, 8, (t[0] - 32) / 30, 0, 7); g.fill(); }); grime(g, S, S, 1.2); }) }), lx, ly, AZ + 0.062);
      cyl(0.25, 0.25, 0.03, plateBack, lx, ly, AZ + 0.045, null, 20).rotation.x = PI / 2; continue;
    }
    var hang = i === word.length - 1;                                                                   // the last letter has lost a bolt and hangs by one corner
    var grp = hang ? dyn(new THREE.Group()) : new THREE.Group();
    var plate = box(0.72, 0.94, 0.025, plateBack, hang ? -0.32 : 0, hang ? -0.43 : 0, 0, grp);
    mesh(new THREE.PlaneGeometry(0.72, 0.94), std(0xffffff, 0.72, { map: letterTex(word[i], i * 7 + 3), bumpMap: bump(2), bumpScale: 0.006 }), plate.position.x, plate.position.y, 0.0135, grp);
    if (hang) { grp.position.set(lx + 0.32, ly + 0.43, AZ + 0.075); grp.rotation.z = slope - 0.5; grp.userData.rest = slope - 0.5; E.hangLetter = grp; }
    else { grp.position.set(lx, ly, AZ + 0.075); grp.rotation.z = slope + (i === 1 ? 0.06 : i === 6 ? -0.04 : 0); }
    scene.add(grp); E.letters.push(grp);
  }
  // dead lamps that once lit the sign
  [-2.2, 2.2].forEach(function (x) { var y = archY(x, 5.84); cyl(0.02, 0.02, 0.7, EM.iron, x, y + 0.3, AZ + 0.25, null, 6).rotation.x = 0.8; mesh(new THREE.ConeGeometry(0.13, 0.2, 10, 1, true), EM.iron, x, y + 0.5, AZ + 0.55).rotation.x = -2.2; });

  // ---------- gate leaves ----------
  /* Leaf space: x runs from the hinge (0) to the meeting edge (3.42), z points out toward the road.  The east leaf is the
     mirror image.  Each sits in a pivot group at its hinge line; the pivot turns to swing it into the park. */
  var LEAF = 3.42, ironBar = new THREE.CylinderGeometry(0.013, 0.013, 1, 6);
  function topY(x) { return 2.5 + 0.55 * Math.pow(x / LEAF, 1.6); }
  E.leaves = [-1, 1].map(function (s) {
    var pivot = dyn(new THREE.Group()); pivot.position.set(s * HX, 0, GZ); scene.add(pivot);
    var leaf = new THREE.Group(); leaf.scale.x = -s; pivot.add(leaf);
    function bar(x1, y1, x2, y2, t, z) {              // a flat rectangular section between two points in the leaf plane
      var len = Math.hypot(x2 - x1, y2 - y1), b = box(len, t, 0.045, EM.iron, (x1 + x2) / 2, (y1 + y2) / 2, z || 0, leaf); b.rotation.z = Math.atan2(y2 - y1, x2 - x1); return b;
    }
    box(0.07, topY(0.06) - 0.12, 0.07, EM.iron, 0.06, (topY(0.06) + 0.12) / 2, 0, leaf);                 // hinge stile
    box(0.07, topY(LEAF - 0.04) - 0.12, 0.07, EM.iron, LEAF - 0.04, (topY(LEAF - 0.04) + 0.12) / 2, 0, leaf);   // meeting stile
    bar(0.06, 0.18, LEAF - 0.04, 0.18, 0.07); bar(0.06, 1.18, LEAF - 0.04, 1.18, 0.06);                 // bottom and lock rails
    for (var q = 0; q < 8; q++) bar(0.06 + q * 0.42, topY(0.06 + q * 0.42), 0.06 + (q + 1) * 0.42, topY(0.06 + (q + 1) * 0.42), 0.06);   // rising top rail
    bar(0.1, 0.24, LEAF - 0.1, 2.3, 0.035, -0.03);                                                       // diagonal brace on the inside
    var bars = [], tips = [], short = [];
    for (q = 1; q <= 23; q++) {
      var x = 0.06 + q * (LEAF - 0.1) / 24, ty = topY(x);
      bars.push([x, (ty + 0.18) / 2, 0, 1, ty - 0.18 + 0.16, 1]); tips.push([x, ty + 0.2, 0]);
      short.push([x + 0.07, 0.68, 0, 1, 1.0, 1]);                                                        // extra pales in the lower panel (keeps small animals in)
    }
    inst(ironBar, EM.iron, bars.concat(short), leaf); inst(new THREE.ConeGeometry(0.03, 0.18, 4), EM.iron, tips, leaf);
    [0.42, 1.5, 2.36].forEach(function (y) {                                                             // hinges: barrel on the stile, strap to the pillar
      cyl(0.04, 0.04, 0.2, EM.rustSteel, 0, y, 0, leaf, 10); box(0.16, 0.12, 0.02, EM.rustSteel, 0.1, y, 0.04, leaf);
      box(0.02, 0.16, 0.26, EM.rustSteel, s * (HX + 0.045), y, GZ + 0.13);
    });
    // wheel under the free end
    box(0.05, 0.1, 0.12, EM.rustSteel, LEAF - 0.14, 0.2, 0, leaf);
    var wheel = cyl(0.085, 0.085, 0.045, EM.rubber, LEAF - 0.14, 0.085, 0, leaf, 16); wheel.rotation.z = PI / 2; wheel.userData.keep = true;      // it turns on its own
    cyl(0.03, 0.03, 0.06, EM.steel, LEAF - 0.14, 0.085, 0, leaf, 8).rotation.z = PI / 2;
    // ram bracket on the leaf, drop bolt, lock housing
    box(0.1, 0.07, 0.12, EM.rustSteel, 0.9, 0.95, -0.07, leaf);
    box(0.03, 0.5, 0.03, EM.steel, LEAF - 0.1, 0.42, -0.06, leaf); box(0.06, 0.1, 0.05, EM.rustSteel, LEAF - 0.1, 0.5, -0.05, leaf);
    box(0.1, 0.3, 0.09, EM.rustSteel, LEAF - 0.1, 1.2, -0.07, leaf);
    return { pivot: pivot, leaf: leaf, wheel: wheel, s: s };
  });
  // "closed" notice wired to the west leaf (it faces the road)
  var notice = new THREE.Group(); notice.position.set(1.75, 1.72, 0.05); notice.rotation.z = -0.045; E.leaves[0].leaf.add(notice);
  box(0.92, 0.62, 0.012, EM.rustSteel, 0, 0, 0, notice);
  mesh(new THREE.PlaneGeometry(0.9, 0.6), std(0xffffff, 0.8, { map: canvasTex(256, function (g, S, H) {
    g.fillStyle = '#d6cfb8'; g.fillRect(0, 0, S, H); g.strokeStyle = '#8d1f18'; g.lineWidth = 8; g.strokeRect(8, 8, S - 16, H - 16);
    g.textAlign = 'center'; g.fillStyle = '#8d1f18'; g.font = 'bold 44px Impact, "Arial Black", sans-serif'; g.fillText('ZOO CLOSED', S / 2, 60);
    g.fillStyle = '#24211b'; g.font = 'bold 19px Arial, sans-serif'; g.fillText('BY ORDER OF THE COUNTY', S / 2, 92); g.fillText('NO ENTRY · PREMISES UNSAFE', S / 2, 118);
    g.font = '13px Arial, sans-serif'; g.fillText('Trespassers enter at their own risk', S / 2, 144);
    streaks(g, S, H, 12, 'rgba(70,40,18,.9)', H); grime(g, S, H, 1.2); chips(g, S, H, 10, '#5a5446');
  }, 1, 1, true, 170) }), 0, 0, 0.0075, notice);
  [[-0.4, 0.27], [0.4, 0.27]].forEach(function (p) { mesh(new THREE.TorusGeometry(0.025, 0.004, 4, 8), EM.steel, p[0], p[1] + 0.03, 0, notice).rotation.y = PI / 2; });

  // rams: the body pivots on a bracket bolted to the pillar, the rod end is pinned to the leaf
  E.rams = [-1, 1].map(function (s) {
    var A = new THREE.Vector3(s * (HX + 0.28), 0.95, GZ - 0.2);
    box(0.14, 0.1, 0.2, EM.rustSteel, A.x, A.y, GZ - 0.05);                                              // bracket on the pillar's inner face
    var ram = dyn(new THREE.Group()); ram.position.copy(A); scene.add(ram);
    var body = cyl(0.046, 0.046, 0.62, EM.green, 0, 0, 0.31, ram, 12); body.rotation.x = PI / 2;
    cyl(0.055, 0.055, 0.1, EM.rustSteel, 0, 0, 0.05, ram, 12).rotation.x = PI / 2;                       // motor end
    cyl(0.05, 0.05, 0.03, EM.steel, 0, 0, 0.62, ram, 12).rotation.x = PI / 2;                            // gland
    var rod = cyl(0.02, 0.02, 0.66, EM.steel, 0, 0, 0.5, ram, 8); rod.rotation.x = PI / 2;
    var eye = box(0.05, 0.06, 0.06, EM.rustSteel, 0, 0, 0.8, ram); rod.userData.keep = eye.userData.keep = true;                 // these slide along the ram
    // armoured cable from the ram down into the ground
    cyl(0.012, 0.012, 0.9, EM.rubber, A.x + s * 0.06, 0.45, GZ - 0.05, null, 5);
    return { ram: ram, rod: rod, eye: eye, A: A, s: s, B: new THREE.Vector3() };
  });
  // quadrant tracks for the wheels, let into the paving
  [-1, 1].forEach(function (s) {
    var tr = mesh(new THREE.RingGeometry(LEAF - 0.2, LEAF - 0.08, 40, 1, s < 0 ? 0 : PI / 2, PI / 2), EM.rustSteel, s * HX, 0.058, GZ);
    tr.rotation.x = -PI / 2; tr.userData.noCast = true;
    box(0.2, 0.1, 0.12, EM.rustSteel, s * (HX - 0.02), 0.09, GZ - LEAF + 0.02);                           // open-stop at the end of each track
  });
  box(0.24, 0.07, 0.2, EM.rustSteel, 0, 0.085, GZ - 0.02);                                               // centre stop / drop-bolt keeper
  // control cabinet and warning beacon (inside face of the east pillar)
  box(0.5, 0.7, 0.2, EM.green, 4.15, 1.75, GZ - 0.16); box(0.54, 0.04, 0.24, EM.rustSteel, 4.15, 2.12, GZ - 0.16);
  cyl(0.02, 0.02, 1.4, EM.steel, 4.3, 0.7, GZ - 0.1, null, 6);
  mesh(new THREE.PlaneGeometry(0.36, 0.2), std(0xffffff, 0.7, { map: textTex(['GATE DRIVE', 'KEEP CLEAR'], 256, 128, '#d9ae35', '#17140e', '#17140e', false) }), 4.15, 1.84, GZ - 0.262).rotation.y = PI;
  E.ctrlLed = glow(0x1a0505); mesh(new THREE.SphereGeometry(0.02, 8, 8), E.ctrlLed, 4.02, 1.56, GZ - 0.262);
  cyl(0.02, 0.02, 0.5, EM.steel, 4.15, 4.84, GZ + 0.25, null, 6); cyl(0.09, 0.1, 0.05, EM.plastic, 4.15, 5.1, GZ + 0.25, null, 12);
  E.beaconMat = EM.amber; mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 12), E.beaconMat, 4.15, 5.19, GZ + 0.25).userData.noCast = true;
  E.beaconGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,170,40,.9)', 'rgba(255,120,10,.25)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  E.beaconGlow.position.set(4.15, 5.19, GZ + 0.25); E.beaconGlow.scale.set(2.4, 2.4, 1); scene.add(dyn(E.beaconGlow));

  // ---------- manual release cabinet: where the five key pieces go (inside face of the west pillar) ----------
  var MR = new THREE.Group(); MR.position.set(-4.15, 1.45, GZ - 0.05); MR.rotation.y = PI; scene.add(MR);    // local +z now faces into the park
  box(0.78, 0.92, 0.16, std(0x8d1f18, 0.6, { bumpMap: bump(2), bumpScale: 0.01 }), 0, 0, 0.08, MR); box(0.84, 0.05, 0.2, EM.rustSteel, 0, 0.485, 0.09, MR);
  mesh(new THREE.PlaneGeometry(0.7, 0.2), std(0xffffff, 0.7, { map: textTex(['EMERGENCY MANUAL RELEASE'], 512, 110, '#e9e2d0', '#8d1f18', null, false) }), 0, 0.33, 0.163, MR);
  mesh(new THREE.PlaneGeometry(0.7, 0.14), std(0xffffff, 0.7, { map: textTex(['FIT ALL FIVE MASTER KEY SECTIONS'], 512, 80, '#1c1a16', '#e2b93b', null, false) }), 0, -0.33, 0.163, MR);
  W.lockLamps = []; E.keySlots = [];
  for (i = 0; i < 5; i++) {
    var sx2 = -0.26 + i * 0.13; box(0.09, 0.3, 0.02, EM.rustSteel, sx2, -0.04, 0.165, MR); box(0.022, 0.2, 0.03, EM.rubber, sx2, -0.06, 0.168, MR);   // key way
    var lm = glow(0x180c00); W.lockLamps.push(lm); mesh(new THREE.SphereGeometry(0.018, 8, 8), lm, sx2, 0.16, 0.172, MR);
    var kp = dyn(box(0.016, 0.16, 0.05, M.gold, sx2, -0.04, 0.19, MR)); kp.visible = false; E.keySlots.push(kp);                                         // a fitted key section
  }
  E.release = { x: -4.15, z: GZ - 0.3 };

  // ---------- staff card reader with a keypad, on the road face of the east pillar ----------
  var RD = new THREE.Group(); RD.position.set(4.15, 1.42, WORLD + 0.652); scene.add(RD); E.readerPos = RD.position;
  cyl(0.016, 0.016, 1.2, EM.steel, 0, -0.82, 0.02, RD, 6);                                               // conduit down the pillar
  box(0.3, 0.46, 0.06, EM.steel, 0, 0, 0.03, RD);                                                        // body
  var hood = box(0.34, 0.03, 0.14, EM.steel, 0, 0.245, 0.07, RD); hood.rotation.x = 0.16;                // rain hood
  box(0.012, 0.44, 0.1, EM.steel, -0.157, 0, 0.05, RD); box(0.012, 0.44, 0.1, EM.steel, 0.157, 0, 0.05, RD);
  mesh(new THREE.PlaneGeometry(0.276, 0.436), std(0xffffff, 0.5, { metalness: 0.5, map: canvasTex(256, function (g, S, H) {
    g.fillStyle = '#5d6468'; g.fillRect(0, 0, S, H);
    for (var q = 0; q < 300; q++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.03 + Math.random() * 0.07) + ')'; var y = Math.random() * H; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    g.fillStyle = '#16181a'; g.fillRect(18, 44, 174, 74);                                                // display bezel
    g.fillStyle = '#d7dadc'; g.font = 'bold 15px Arial, sans-serif'; g.textAlign = 'left'; g.fillText('STAFF ACCESS', 20, 30);
    g.fillStyle = '#16181a'; g.fillRect(206, 18, 32, H - 36);                                             // card channel
    g.fillStyle = '#d7dadc'; g.font = 'bold 11px Arial, sans-serif'; g.save(); g.translate(200, H - 60); g.rotate(-PI / 2); g.fillText('SWIPE CARD  ▶', 0, 0); g.restore();
    g.fillStyle = '#8b9296'; g.font = '10px Arial, sans-serif'; g.fillText('FAMILY ZOO · GATE 1', 20, H - 14);
    streaks(g, S, H, 14, 'rgba(60,40,22,.8)', H * 0.7); grime(g, S, H, 0.9);
  }, 1, 1, true, 404) }), 0, 0, 0.0612, RD);
  var lcd = livePanel(0.176, 0.07, 256, 104, 0, 0, 0, 0, RD); lcd.mesh.position.set(-0.026, 0.132, 0.0625); lcd.mesh.material = basic(0xffffff, { map: lcd.tex, fog: false });
  E.lcd = function (l1, l2, col) {
    var g = lcd.g; g.fillStyle = '#060a07'; g.fillRect(0, 0, 256, 104);
    if (l1) { g.fillStyle = col || '#39d86a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px Consolas, "Courier New", monospace'; g.fillText(l1, 128, l2 ? 34 : 52, 244); if (l2) g.fillText(l2, 128, 72, 244); }
    lcd.tex.needsUpdate = true;
  };
  E.lcd('');
  E.ledR = glow(0x1a0404); E.ledG = glow(0x041a08);
  mesh(new THREE.CircleGeometry(0.008, 10), E.ledR, 0.03, 0.19, 0.0626, RD); mesh(new THREE.CircleGeometry(0.008, 10), E.ledG, 0.055, 0.19, 0.0626, RD);
  var keyGeo = new THREE.BoxGeometry(0.04, 0.034, 0.012), keys = '123456789*0#';
  for (i = 0; i < 12; i++) {
    var kx = -0.086 + (i % 3) * 0.058, ky = 0.045 - Math.floor(i / 3) * 0.052;
    mesh(keyGeo, EM.plastic, kx, ky, 0.066, RD);
    mesh(new THREE.PlaneGeometry(0.036, 0.03), std(0xffffff, 0.6, { map: (function (ch) { return canvasTex(64, function (g, S, H) { g.fillStyle = '#2b2e30'; g.fillRect(0, 0, S, H); g.fillStyle = '#c9cdcf'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 34px Arial, sans-serif'; g.fillText(ch, S / 2, H / 2 + 2); g.fillStyle = 'rgba(20,16,10,.35)'; g.fillRect(0, 0, S, H); }, 1, 1, true, 52); })(keys[i]) }), kx, ky, 0.0722, RD);
  }
  // the card channel: a slot down the right-hand side with raised guides
  box(0.006, 0.4, 0.016, EM.steel, 0.086, 0, 0.068, RD); box(0.006, 0.4, 0.016, EM.steel, 0.12, 0, 0.068, RD); box(0.028, 0.4, 0.004, EM.rubber, 0.103, 0, 0.0625, RD);
  E.slot = new THREE.Vector3(4.15 + 0.102, 1.42, WORLD + 0.652 + 0.085);                                // centre line of the channel (world)
  // years of dust over the face; the intro wipes it off
  var dustC = document.createElement('canvas'); dustC.width = 256; dustC.height = 400;
  var dustG = dustC.getContext('2d'), dustTex = new THREE.CanvasTexture(dustC); dustTex.encoding = THREE.sRGBEncoding;
  var dustMesh = mesh(new THREE.PlaneGeometry(0.3, 0.46), new THREE.MeshStandardMaterial({ map: dustTex, transparent: true, roughness: 1, depthWrite: false }), 0, 0, 0.0935, RD);
  dustMesh.userData.noCast = true; dustMesh.renderOrder = 2;
  E.dustFill = function (amount) {                  // 1 = untouched for years, 0 = clean
    var g = dustG; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 256, 400);
    if (amount > 0) {
      g.globalAlpha = 0.95 * amount; g.fillStyle = '#8f8672'; g.fillRect(0, 0, 256, 400);
      g.globalAlpha = 0.5 * amount; speckle('rgba(0,0,0,0)', ['#a39a84', '#6f6858', '#b5ad98', '#5a5448'], 5000, 2.2)(g, 256, 400);
      g.globalAlpha = 0.5 * amount; g.strokeStyle = '#cfc9b8'; g.lineWidth = 0.7;                        // cobweb in the top corner
      for (var q = 0; q < 9; q++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(60 + q * 8, 20 + q * 6, 40 + q * 22, 90 + (q % 3) * 26); g.stroke(); }
      g.globalAlpha = 1;
    }
    dustTex.needsUpdate = true;
  };
  E.dustWipe = function (u, v, r, strength) {       // rub a patch clean; u,v in 0..1 across the face (u right, v up)
    var g = dustG, x = u * 256, y = (1 - v) * 400, R = r * 256, gr = g.createRadialGradient(x, y, R * 0.25, x, y, R);
    gr.addColorStop(0, 'rgba(0,0,0,' + (strength || 0.8) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); g.globalCompositeOperation = 'source-over';
    dustTex.needsUpdate = true;
  };
  E.dustFill(0);

  // ---------- boards on the wing walls (road side) ----------
  function wallBoard(x, y, w, h, tex) {
    box(w + 0.1, h + 0.1, 0.05, EM.green, x, y, WORLD + 0.275); mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.78, { map: tex, bumpMap: bump(2), bumpScale: 0.008 }), x, y, WORLD + 0.302);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { cyl(0.018, 0.018, 0.02, EM.rustSteel, x + c[0] * (w / 2 - 0.02), y + c[1] * (h / 2 - 0.02), WORLD + 0.305, null, 6).rotation.x = PI / 2; });
  }
  wallBoard(-7.0, 1.95, 2.6, 1.7, canvasTex(512, function (g, S, H) {
    g.fillStyle = '#ded5b6'; g.fillRect(0, 0, S, H); g.fillStyle = '#254a30'; g.fillRect(0, 0, S, 84);
    g.textAlign = 'center'; g.fillStyle = '#e2b93b'; g.font = 'bold 50px ' + FONT; g.fillText('ADMISSION', S / 2, 60);
    g.fillStyle = '#23201a'; g.font = 'bold 30px ' + FONT; g.textAlign = 'left';
    [['Adults', '$12.00'], ['Children 3–12', '$6.00'], ['Under 3', 'FREE'], ['Family of four', '$30.00']].forEach(function (r, n) { g.textAlign = 'left'; g.fillText(r[0], 44, 138 + n * 46); g.textAlign = 'right'; g.fillText(r[1], S - 44, 138 + n * 46); });
    g.textAlign = 'center'; g.fillStyle = '#8d1f18'; g.font = 'bold 24px ' + FONT; g.fillText('OPEN DAILY 9 – 5  ·  FEEDING SHOWS AT 11 & 3', S / 2, 312);
    chips(g, S, H, 30, '#77705f'); streaks(g, S, H, 26, 'rgba(60,44,22,.9)', H); grime(g, S, H, 1.2);
  }, 1, 1, true, 336));
  wallBoard(7.4, 1.95, 2.2, 1.7, canvasTex(512, function (g, S, H) {       // the mascot, sun-bleached
    g.fillStyle = '#d8cfae'; g.fillRect(0, 0, S, H);
    g.fillStyle = '#5c9a52'; g.beginPath(); g.ellipse(250, 250, 120, 66, 0, 0, 7); g.fill();                                   // body
    g.beginPath(); g.moveTo(310, 220); g.quadraticCurveTo(380, 110, 352, 70); g.quadraticCurveTo(410, 80, 372, 240); g.fill(); // neck
    g.beginPath(); g.ellipse(346, 66, 44, 30, -0.3, 0, 7); g.fill();                                                           // head
    g.beginPath(); g.moveTo(140, 240); g.quadraticCurveTo(50, 250, 30, 310); g.quadraticCurveTo(90, 290, 160, 290); g.fill();  // tail
    [[200, 300], [300, 300]].forEach(function (l) { g.fillRect(l[0] - 18, l[1], 36, 60); });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(356, 58, 9, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(358, 59, 4.5, 0, 7); g.fill();
    g.strokeStyle = '#1d3a22'; g.lineWidth = 4; g.beginPath(); g.arc(340, 70, 22, 0.3, 1.5); g.stroke();                       // the smile
    g.textAlign = 'center'; g.fillStyle = '#254a30'; g.font = 'bold 46px ' + FONT; g.fillText('MEET OUR', 150, 70); g.fillText('DINOSAURS!', 172, 122);
    g.fillStyle = 'rgba(216,207,174,.45)'; g.fillRect(0, 0, S, H);                                                             // bleached by the sun
    chips(g, S, H, 44, '#7d7664'); streaks(g, S, H, 30, 'rgba(60,44,22,.9)', H); grime(g, S, H, 1.3);
    g.strokeStyle = 'rgba(20,10,8,.8)'; g.lineWidth = 3; [[300, 180], [318, 176], [336, 184]].forEach(function (c) { g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[0] - 150, c[1] + 190); g.stroke(); });   // three claw marks
  }, 1, 1, true, 396));

  // ---------- the approach road outside ----------
  flat(9, 86, rt(EM.asphalt, 2.2, 21), 0, 0.025, WORLD + 43.6);
  flat(19, 9, rt(EM.paver, 9.5, 4.5), 0, 0.03, WORLD + 5.1);                                             // forecourt
  var edge = std(0x8f8a78, 0.9, { transparent: true, opacity: 0.5 }), dash = std(0xa58c2e, 0.9, { transparent: true, opacity: 0.45 });
  for (i = 0; i < 12; i++) flat(0.14, 2.2, dash, 0, 0.034, WORLD + 12 + i * 6.2).rotation.z = (srand() - 0.5) * 0.01;
  flat(0.12, 76, edge, -4.1, 0.033, WORLD + 48); flat(0.12, 76, edge, 4.1, 0.033, WORLD + 48);
  [[-5.2, 5.5], [5.2, 5.5], [-5.2, 9], [5.2, 9]].forEach(function (b, n) {                                // bollards (one knocked flat)
    var bl = cyl(0.11, 0.13, 0.9, EM.cream, b[0], 0.45, WORLD + b[1], null, 10), cap = mesh(new THREE.SphereGeometry(0.115, 10, 6, 0, PI * 2, 0, PI / 2), EM.green, b[0], 0.9, WORLD + b[1]);
    if (n === 2) { bl.rotation.z = PI / 2 - 0.08; bl.position.set(b[0] - 0.5, 0.13, WORLD + b[1]); cap.rotation.z = PI / 2 - 0.08; cap.position.set(b[0] - 0.95, 0.15, WORLD + b[1]); }
  });
  // a sawhorse barrier dragged aside long ago
  var saw = new THREE.Group(); box(2.2, 0.2, 0.04, std(0xffffff, 0.8, { map: canvasTex(128, function (g, S, H) { for (var q = 0; q < 8; q++) { g.fillStyle = q % 2 ? '#d8d2c2' : '#b3541c'; g.beginPath(); g.moveTo(q * 20 - 20, H); g.lineTo(q * 20, 0); g.lineTo(q * 20 + 20, 0); g.lineTo(q * 20, H); g.fill(); } grime(g, S, H, 1.4); }, 1, 1, true, 16) }), 0, 0.82, 0, saw);
  [-0.9, 0.9].forEach(function (x) { box(0.05, 0.95, 0.05, EM.rustSteel, x, 0.45, 0.2, saw).rotation.x = 0.36; box(0.05, 0.95, 0.05, EM.rustSteel, x, 0.45, -0.2, saw).rotation.x = -0.36; });
  saw.position.set(-6.4, 0, WORLD + 12.5); saw.rotation.y = 0.9; scene.add(saw);
  // the truck you came in: parked up the road with its lights left on
  (function () {
    var T = new THREE.Group(), paint = std(0xffffff, 0.5, { metalness: 0.4, map: canvasTex(64, function (g, S) { g.fillStyle = '#3d4a3a'; g.fillRect(0, 0, S, S); chips(g, S, S, 10, '#2a2f28'); grime(g, S, S, 1.2); }), bumpMap: bump(3), bumpScale: 0.01 }), dk = std(0x111214, 0.7);
    box(1.95, 0.55, 5.1, paint, 0, 0.82, 0, T); box(1.9, 0.5, 1.55, paint, 0, 1.3, -1.72, T); box(1.86, 0.78, 1.7, paint, 0, 1.72, 0.1, T); box(1.95, 0.5, 1.9, paint, 0, 1.25, 1.55, T).visible = false;
    box(1.7, 0.6, 0.05, M.window, 0, 1.78, -0.74, T).rotation.x = 0.3; box(0.05, 0.5, 1.2, M.window, 0.94, 1.8, 0.1, T); box(0.05, 0.5, 1.2, M.window, -0.94, 1.8, 0.1, T);
    box(1.8, 0.06, 1.9, dk, 0, 1.08, 1.6, T); box(0.06, 0.42, 1.9, paint, 0.92, 1.3, 1.6, T); box(0.06, 0.42, 1.9, paint, -0.92, 1.3, 1.6, T); box(1.9, 0.42, 0.06, paint, 0, 1.3, 2.52, T);
    box(2.05, 0.2, 0.22, dk, 0, 0.6, -2.6, T); box(2.05, 0.2, 0.22, dk, 0, 0.6, 2.6, T); box(1.3, 0.34, 0.06, dk, 0, 1.12, -2.56, T);
    [[-1, -1.6], [1, -1.6], [-1, 1.6], [1, 1.6]].forEach(function (w) { var wh = cyl(0.42, 0.42, 0.3, EM.rubber, w[0] * 0.92, 0.42, w[1], T, 16); wh.rotation.z = PI / 2; cyl(0.2, 0.2, 0.32, EM.steel, w[0] * 0.92, 0.42, w[1], T, 8).rotation.z = PI / 2; });
    [-0.72, 0.72].forEach(function (x) {
      mesh(new THREE.CircleGeometry(0.13, 14), basic(0xfff4d6, { fog: false }), x, 1.12, -2.561, T).rotation.y = PI;
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,244,214,.95)', 'rgba(255,230,170,.22)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85, fog: false })); gl.position.set(x, 1.12, -2.62); gl.scale.set(1.5, 1.5, 1); T.add(gl);
    });
    T.position.set(2.3, 0, WORLD + 47.5); T.rotation.y = -0.03; scene.add(T);
  })();
  // pines and scrub crowding the road
  (function () {
    var spots = [], guard = 0;
    while (spots.length < 64 && guard++ < 4000) {
      var x = (srand() * 2 - 1) * 58, z = WORLD + 3 + srand() * 82; if (Math.abs(x) < 6.6 + srand() * 3) continue;
      if (z < WORLD + 11 && Math.abs(x) < 12) continue;
      spots.push([x, z, 0.8 + srand() * 1.0]);
    }
    var trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.42, 9, 8), M.trunk, spots.length), tiers = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 14, 1, true), M.needle, spots.length * 7), col = new THREE.Color();
    spots.forEach(function (p, n) {
      var s = p[2]; dummy.rotation.set((srand() - 0.5) * 0.08, srand() * 6, (srand() - 0.5) * 0.08); dummy.position.set(p[0], 4.5 * s, p[1]); dummy.scale.set(s, s, s); dummy.updateMatrix(); trunks.setMatrixAt(n, dummy.matrix);
      for (var q = 0; q < 7; q++) { var tr = (3.0 - q * 0.38) * s * (0.9 + srand() * 0.2); dummy.position.set(p[0], (3.0 + q * 1.15) * s, p[1]); dummy.scale.set(tr, 2.9 * s, tr); dummy.rotation.y = srand() * 6; dummy.updateMatrix(); tiers.setMatrixAt(n * 7 + q, dummy.matrix); col.setHSL(0.34 + srand() * 0.05, 0.42, 0.1 + srand() * 0.06); tiers.setColorAt(n * 7 + q, col); }
    });
    trunks.frustumCulled = tiers.frustumCulled = false; scene.add(trunks); scene.add(tiers);
    var scrub = [], col2 = new THREE.Color();
    for (var q2 = 0; q2 < 70; q2++) { var bx = (srand() * 2 - 1) * 30, bz = WORLD + 2.5 + srand() * 80; if (Math.abs(bx) < 5.2) bx = (bx < 0 ? -1 : 1) * (5.2 + srand() * 3); if (bz < WORLD + 10.5 && Math.abs(bx) < 10.5) continue; var bs = 0.4 + srand() * 0.9; scrub.push([bx, bs * 0.35, bz, bs * 1.3, bs * 0.8, bs * 1.3, 0, srand() * 6, 0]); }
    var sm = inst(new THREE.IcosahedronGeometry(1, 1), M.leaf, scrub); scrub.forEach(function (p, n) { col2.setHSL(0.27 + srand() * 0.08, 0.4, 0.07 + srand() * 0.05); sm.setColorAt(n, col2); });
  })();

  // ---------- posing the gate ----------
  var Bv = new THREE.Vector3();
  E.setGate = function (a) {                        // a: 0 shut .. 1 fully open (the caller eases it)
    E.open = a;
    for (var n = 0; n < 2; n++) {
      var L = E.leaves[n], th = a * 1.53, R = E.rams[n];
      L.pivot.rotation.y = -L.s * th;                                                                      // both swing north, into the park
      L.wheel.rotation.x = th * (LEAF - 0.14) / 0.085;
      Bv.set(-L.s * 0.9, 0.95, -0.1).applyAxisAngle(THREE.Object3D.DefaultUp, L.pivot.rotation.y).add(L.pivot.position);
      R.ram.lookAt(Bv); var len = R.A.distanceTo(Bv); R.rod.position.z = len - 0.33; R.eye.position.z = len;
    }
    W.gateBox.off = a > 0.86; W.leafBoxes[0].off = W.leafBoxes[1].off = a < 0.5;
  };
  E.setBeacon = function (on, t) {                  // the amber warning light turns while the leaves move
    var f = on ? 0.5 + 0.5 * Math.sin(t * 9) : 0; f = f * f;
    E.beaconMat.color.setRGB(0.14 + f * 1.6, 0.07 + f * 0.75, f * 0.08); E.beaconGlow.material.opacity = f * 0.9;
    return f;
  };

  // ---------- collision ----------
  W.gateBox = { x1: -HX, x2: HX, z1: GZ - 0.14, z2: GZ + 0.14 }; boxes.push(W.gateBox);
  W.leafBoxes = [-1, 1].map(function (s) { var b = { x1: s * HX - 0.12, x2: s * HX + 0.12, z1: GZ - LEAF, z2: GZ, off: true }; boxes.push(b); return b; });
  circles.push({ x: 4.15, z: GZ - 0.2, r: 0.3 });

  // ---------- plaza ----------
  flat(52, 36.2, rt(EM.paver, 26, 18.1), 0.5, 0.022, 131.3);
  // the fountain: a dry basin and the park's mascot in bronze
  (function () {
    var FX = 0, FZ = 132, pts = [[2.2, 0.06], [2.2, 0.46], [2.28, 0.54], [2.58, 0.56], [2.66, 0.5], [2.7, 0.3], [2.76, 0]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    mesh(new THREE.LatheGeometry(pts, 40), rt(EM.stone, 10, 1), FX, 0.02, FZ);
    var bed = mesh(new THREE.CircleGeometry(2.2, 40), std(0xffffff, 0.5, { map: canvasTex(256, function (g, S) { speckle('#3d4038', ['#2c2f29', '#4c4f45', '#23261f'], 4000, 2)(g, S); blotch(g, S, ['#141712', '#28321c', '#3a2e1c'], 30, 14, 70, 0.6); g.fillStyle = '#5a4424'; for (var q = 0; q < 160; q++) { g.save(); g.translate(Math.random() * S, Math.random() * S); g.rotate(Math.random() * 6); g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillStyle = ['#5a4424', '#6d5226', '#3f3018', '#75602c'][q % 4]; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, 7); g.fill(); g.restore(); } g.globalAlpha = 1; }) }), FX, 0.085, FZ);
    bed.rotation.x = -PI / 2; bed.userData.noCast = true;
    var pud = mesh(new THREE.CircleGeometry(1.25, 24), std(0x06090a, 0.04, { metalness: 0.9, transparent: true, opacity: 0.85 }), FX + 0.5, 0.092, FZ + 0.6); pud.rotation.x = -PI / 2; pud.scale.y = 0.6; pud.userData.noCast = true;
    cyl(0.52, 0.62, 0.95, rt(EM.stone, 3, 1), FX, 0.5, FZ, null, 20); cyl(0.66, 0.6, 0.1, EM.stone, FX, 1.0, FZ, null, 20);
    var bronze = std(0xffffff, 0.55, { metalness: 0.6, map: canvasTex(128, function (g, S) { speckle('#3d6657', ['#2e5144', '#4f7f6c', '#2a3d33', '#6a917c'], 2600, 2.4)(g, S); blotch(g, S, ['#1c241c', '#7fae98', '#3a2a18'], 16, 6, 30, 0.45); streaks(g, S, S, 14, 'rgba(150,200,175,.7)'); }), bumpMap: bump(2), bumpScale: 0.02 });
    var st = new THREE.Group(); st.position.set(FX, 1.05, FZ); st.rotation.y = 0.5; scene.add(st);
    tube([[0, 0.62, -1.15, 0.02, 0.02], [0, 0.6, -0.7, 0.1, 0.1], [0, 0.66, -0.3, 0.26, 0.27], [0, 0.7, 0.1, 0.31, 0.33], [0, 0.72, 0.42, 0.24, 0.26], [0, 0.95, 0.66, 0.13, 0.14], [0, 1.3, 0.8, 0.09, 0.095], [0, 1.62, 0.9, 0.075, 0.08]], bronze, st, 14, 5);
    tube([[0, 1.6, 0.86, 0.07, 0.07], [0, 1.68, 0.98, 0.1, 0.085], [0, 1.66, 1.14, 0.075, 0.06], [0, 1.63, 1.24, 0.03, 0.03]], bronze, st, 10, 4);
    [[-0.2, -0.22], [0.2, -0.22], [-0.19, 0.3], [0.19, 0.3]].forEach(function (l) { tube([[l[0], 0.6, l[1], 0.1, 0.11], [l[0] * 1.05, 0.3, l[1], 0.08, 0.085], [l[0] * 1.05, 0.02, l[1] + 0.02, 0.09, 0.1]], bronze, st, 8, 3); });
    [-1, 1].forEach(function (sd) { mesh(new THREE.SphereGeometry(0.016, 6, 6), basic(0x050505), sd * 0.07, 1.72, 1.04, st); });
    mesh(new THREE.PlaneGeometry(0.5, 0.2), std(0xffffff, 0.6, { map: textTex(['"DOTTIE"  ·  EST. 1987'], 256, 100, '#3a3a2c', '#c9b46a', null) }), FX, 0.55, FZ + 0.585).rotation.x = -0.1;
    circles.push({ x: FX, z: FZ, r: 2.85 });
  })();
  // rubber cable protector: the power feed from the generator shed to the gift shop (and a hint where to go)
  var ramp = box(26.6, 0.06, 0.34, std(0xffffff, 0.85, { map: canvasTex(128, function (g, S, H) { g.fillStyle = '#c9a21c'; g.fillRect(0, 0, S, H); g.fillStyle = '#17160f'; for (var q = -1; q < 9; q++) { g.beginPath(); g.moveTo(q * 16, H); g.lineTo(q * 16 + 8, H); g.lineTo(q * 16 + 20, 0); g.lineTo(q * 16 + 12, 0); g.fill(); } grime(g, S, H, 1.4); }, 40, 1, true, 24) }), -2.6, 0.05, 126.2);
  ramp.userData.noCast = true;
  box(26.6, 0.03, 0.5, EM.rubber, -2.6, 0.035, 126.2).userData.noCast = true;
  // lamp posts (their bulbs are switched by the plaza-lights breaker)
  E.plazaBulbs = [];
  [[-6.6, 139.5], [6.6, 139.5], [-6.6, 122.5], [6.6, 122.5]].forEach(function (p) {
    cyl(0.07, 0.11, 4.2, EM.iron, p[0], 2.1, p[1], null, 8); cyl(0.17, 0.2, 0.5, EM.iron, p[0], 0.25, p[1], null, 8); cyl(0.1, 0.07, 0.12, EM.iron, p[0], 4.24, p[1], null, 8);
    var bm = basic(0x16130c); E.plazaBulbs.push(bm);
    mesh(new THREE.SphereGeometry(0.2, 12, 10), bm, p[0], 4.5, p[1]).userData.noCast = true;
    var cage = mesh(new THREE.SphereGeometry(0.22, 6, 4), basic(0x0c0c0c, { wireframe: true }), p[0], 4.5, p[1]); cage.userData.noCast = true;
    mesh(new THREE.ConeGeometry(0.3, 0.16, 8), EM.iron, p[0], 4.78, p[1]);
    circles.push({ x: p[0], z: p[1], r: 0.22 });
  });
  // planters with dead shrubs, benches, bins, the park map
  [[-9.5, 146.5], [9.5, 146.5], [-9.2, 120.2], [9.4, 137.2], [-12, 133]].forEach(function (p, n) {
    box(1.5, 0.6, 1.5, rt(EM.stone, 2, 1), p[0], 0.3, p[1]); box(1.3, 0.05, 1.3, std(0x241c12, 1), p[0], 0.6, p[1]);
    for (var q = 0; q < 9; q++) { var tw = cyl(0.008, 0.02, 0.5 + srand() * 0.7, M.wood, p[0] + (srand() - 0.5) * 0.7, 0.95, p[1] + (srand() - 0.5) * 0.7, null, 4); tw.rotation.set((srand() - 0.5) * 0.9, 0, (srand() - 0.5) * 0.9); }
    circles.push({ x: p[0], z: p[1], r: 1.0 });
  });
  WB.bench(-9.2, 141.5, PI / 2); WB.bench(9.2, 142.5, -PI / 2); WB.bench(-4.3, 126.9, 0.4); WB.bench(4.6, 137.4, PI);
  WB.bin(-9.2, 143.3); WB.bin(8.2, 131.2, 1); WB.bin(-7.2, 119.6);
  WB.mapBoard(-8.6, 130.2, PI / 2);

  // ---------- ticket lanes ----------
  /* Three ticket booths under one canopy, with a pair of tripod turnstiles in each gap between them.  The lanes stay locked
     until the entry system is switched on from the staff computer. */
  var TZ = TURN_Z, LANES = [-3.575, -2.025, 2.025, 3.575], HOUSE = [-4.35, -2.8, -1.25, 1.25, 2.8, 4.35];
  E.lanes = LANES;
  box(16.6, 0.2, 5.8, std(0x2c2e2f, 0.7, { map: roofTex, metalness: 0.4 }), 0, 3.3, TZ);                 // canopy deck
  box(16.9, 0.5, 0.1, EM.green, 0, 3.22, TZ + 2.95); box(16.9, 0.5, 0.1, EM.green, 0, 3.22, TZ - 2.95); box(0.1, 0.5, 5.9, EM.green, -8.4, 3.22, TZ); box(0.1, 0.5, 5.9, EM.green, 8.4, 3.22, TZ);
  mesh(new THREE.PlaneGeometry(9, 0.42), std(0xffffff, 0.75, { map: canvasTex(1024, function (g, S, H) { g.fillStyle = '#d8cfae'; g.fillRect(0, 0, S, H); g.fillStyle = '#254a30'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 36px ' + FONT; g.fillText('TICKETS  ·  ADMISSIONS  ·  PLEASE HAVE YOUR TICKET READY', S / 2, H / 2 + 2, S - 30); chips(g, S, H, 40, '#7d7664'); streaks(g, S, H, 40, 'rgba(60,44,22,.85)', H); }, 1, 1, true, 48) }), 0, 3.22, TZ + 3.005);
  [[-8.1, -2.6], [8.1, -2.6], [-8.1, 2.6], [8.1, 2.6]].forEach(function (c) { box(0.16, 3.2, 0.16, EM.iron, c[0], 1.6, TZ + c[1]); box(0.34, 0.08, 0.34, EM.iron, c[0], 0.04, TZ + c[1]); circles.push({ x: c[0], z: TZ + c[1], r: 0.18 }); });
  [-4, 0, 4].forEach(function (x) { box(1.3, 0.08, 0.28, EM.plastic, x, 3.16, TZ + 0.9); box(1.2, 0.02, 0.2, std(0x8a8d86, 0.5), x, 3.115, TZ + 0.9); });   // dead strip lights
  var glassMat = EM.glassDirty, boothSign = std(0xffffff, 0.75, { map: canvasTex(256, function (g, S, H) { g.fillStyle = '#254a30'; g.fillRect(0, 0, S, H); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 40px ' + FONT; g.fillText('TICKETS', S / 2, H / 2 + 2); chips(g, S, H, 12, '#161714'); streaks(g, S, H, 10, 'rgba(60,44,22,.85)', H); }, 1, 1, true, 64) });
  [-5.6, 0, 5.6].forEach(function (bx, n) {
    var G = new THREE.Group(); G.position.set(bx, 0, TZ); scene.add(G);
    box(2.2, 1.05, 2.4, rt(EM.cream, 2, 1), 0, 0.525, 0, G); box(2.3, 0.1, 2.5, EM.green, 0, 0.05, 0, G); box(2.3, 0.07, 2.5, EM.green, 0, 1.08, 0, G);
    [[-1.04, -1.14], [1.04, -1.14], [-1.04, 1.14], [1.04, 1.14]].forEach(function (c) { box(0.1, 1.4, 0.1, EM.green, c[0], 1.8, c[1], G); });
    box(2.36, 0.16, 2.56, EM.green, 0, 2.56, 0, G); box(2.5, 0.06, 2.7, std(0x2c2e2f, 0.7, { map: roofTex, metalness: 0.4 }), 0, 2.67, 0, G);
    [[0, 1.17, 2.0, 0], [0, -1.17, 2.0, 0], [-1.07, 0, 2.2, PI / 2], [1.07, 0, 2.2, PI / 2]].forEach(function (w, q) {                                   // glazing
      var gp = mesh(new THREE.PlaneGeometry(w[2], 1.38), glassMat, w[0], 1.8, w[1], G); gp.rotation.y = w[3]; gp.material.side = THREE.DoubleSide; gp.userData.noCast = true;
    });
    box(1.1, 0.04, 0.34, EM.steel, 0, 1.13, 1.3, G);                                                      // ticket shelf and speech grille (road side)
    mesh(new THREE.CircleGeometry(0.09, 14), EM.steel, 0, 1.62, 1.176, G);
    mesh(new THREE.PlaneGeometry(1.7, 0.42), boothSign, 0, 2.3, 1.185, G);
    box(0.34, 0.5, 0.34, EM.plastic, 0.3, 1.3, 0.4, G); cyl(0.17, 0.17, 0.05, EM.rubber, -0.35, 0.72, -0.2, G, 12); cyl(0.03, 0.03, 0.7, EM.steel, -0.35, 0.36, -0.2, G, 6);   // till and stool inside
    if (n === 1) { var crack = mesh(new THREE.PlaneGeometry(0.9, 0.9), basic(0xffffff, { transparent: true, opacity: 0.5, map: canvasTex(128, function (g, S) { g.clearRect(0, 0, S, S); g.strokeStyle = 'rgba(230,240,240,.9)'; g.lineWidth = 1; for (var q = 0; q < 14; q++) { var a = q / 14 * 6.283, r2 = 20 + Math.random() * 44; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * r2 * 0.5 + (Math.random() - 0.5) * 8, 64 + Math.sin(a) * r2 * 0.5); g.lineTo(64 + Math.cos(a) * r2, 64 + Math.sin(a) * r2); g.stroke(); } }), depthWrite: false }), 0.2, 1.75, 1.176, G); crack.userData.noCast = true; }
    boxes.push({ x1: bx - 1.1, x2: bx + 1.1, z1: TZ - 1.2, z2: TZ + 1.2, solid: true });
  });
  // turnstile cabinets and tripods
  var ledX = canvasTex(64, function (g, S) { g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#ff2a1a'; g.lineWidth = 9; g.beginPath(); g.moveTo(16, 16); g.lineTo(48, 48); g.moveTo(48, 16); g.lineTo(16, 48); g.stroke(); });
  var ledGo = canvasTex(64, function (g, S) { g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#35ff8a'; g.lineWidth = 9; g.beginPath(); g.moveTo(32, 50); g.lineTo(32, 16); g.moveTo(16, 30); g.lineTo(32, 14); g.lineTo(48, 30); g.stroke(); });
  E.laneLeds = [];
  HOUSE.forEach(function (hx) {
    box(0.26, 0.94, 1.25, EM.steel, hx, 0.47, TZ); box(0.3, 0.05, 1.3, EM.plastic, hx, 0.965, TZ); box(0.3, 0.06, 1.3, EM.rubber, hx, 0.03, TZ);
    boxes.push({ x1: hx - 0.14, x2: hx + 0.14, z1: TZ - 0.64, z2: TZ + 0.64 });
  });
  E.tripods = LANES.map(function (lx, n) {
    var hx = lx + 0.775, led = basic(0x555555, { map: ledX, fog: false }); E.laneLeds.push(led);
    mesh(new THREE.PlaneGeometry(0.15, 0.15), led, hx, 0.72, TZ + 0.627);
    var tilt = new THREE.Group(); tilt.position.set(hx - 0.14, 0.86, TZ); tilt.rotation.z = PI / 4; scene.add(tilt);
    cyl(0.07, 0.09, 0.12, EM.plastic, 0, -0.02, 0, tilt, 12);
    var spin = dyn(new THREE.Group()); tilt.add(spin);
    cyl(0.06, 0.06, 0.1, EM.steel, 0, 0.07, 0, spin, 12);
    for (var q = 0; q < 3; q++) {
      var arm = new THREE.Group(); arm.rotation.y = PI + q * PI * 2 / 3; spin.add(arm);
      var a = cyl(0.02, 0.02, 0.6, EM.steel, 0.3 * Math.SQRT1_2 + 0.03, 0.3 * Math.SQRT1_2 + 0.09, 0, arm, 8); a.rotation.z = -PI / 4;
      mesh(new THREE.SphereGeometry(0.024, 8, 6), EM.rubber, 0.6 * Math.SQRT1_2 + 0.03, 0.6 * Math.SQRT1_2 + 0.09, 0, arm);
    }
    var bx = { x1: lx - 0.66, x2: lx + 0.66, z1: TZ - 0.07, z2: TZ + 0.07 }; boxes.push(bx);
    return { x: lx, spin: spin, box: bx, ang: 0, target: 0, side: 0 };
  });
  W.laneBoxes = E.tripods.map(function (t) { return t.box; });
  // railings closing the gaps beside the outer booths, and the fence on either side
  [-1, 1].forEach(function (s) { box(0.5, 1.05, 0.06, EM.steel, s * 6.9, 0.55, TZ); });
  WB.fence(-149, TZ, -16.6, TZ); WB.fence(-10.4, TZ, -6.9, TZ); WB.fence(6.9, TZ, 149, TZ);
  // service gate for vehicles (west of the lanes): chained shut, until something large comes through it
  E.svc = [-1, 1].map(function (s) {
    var hingeX = -13.5 + s * 3.1, pv = dyn(new THREE.Group()); pv.position.set(hingeX, 0, TZ); scene.add(pv);
    var lf = new THREE.Group(); lf.scale.x = -s; pv.add(lf);
    box(0.07, 2.5, 0.07, EM.iron, 0.04, 1.3, 0, lf); box(0.07, 2.5, 0.07, EM.iron, 3.02, 1.3, 0, lf); box(3.0, 0.07, 0.07, EM.iron, 1.53, 0.1, 0, lf); box(3.0, 0.07, 0.07, EM.iron, 1.53, 2.5, 0, lf);
    var dg = box(3.9, 0.05, 0.05, EM.iron, 1.53, 1.3, 0, lf); dg.rotation.z = 0.68;
    var cm = M.chain.clone(); cm.map = chainTex.clone(); cm.map.needsUpdate = true; cm.map.repeat.set(7, 5.6);
    mesh(new THREE.PlaneGeometry(2.95, 2.36), cm, 1.53, 1.3, 0, lf).userData.noCast = true;
    cyl(0.1, 0.1, 2.9, EM.iron, hingeX - s * 0.14, 1.45, TZ, null, 8); circles.push({ x: hingeX - s * 0.14, z: TZ, r: 0.16 });
    return { pivot: pv, s: s };
  });
  var chainG = dyn(new THREE.Group()); chainG.position.set(-13.5, 1.25, TZ + 0.06); scene.add(chainG); E.svcChain = chainG;
  mesh(new THREE.TorusGeometry(0.12, 0.014, 6, 14), EM.steel, 0, 0, 0, chainG).scale.set(1.4, 0.6, 1); box(0.07, 0.09, 0.03, M.gold, 0, -0.1, 0.01, chainG);
  var svcSign = new THREE.Group(); svcSign.position.set(0.9, 1.7, 0.05); E.svc[0].pivot.children[0].add(svcSign);
  box(1.02, 0.5, 0.012, EM.rustSteel, 0, 0, 0, svcSign); mesh(new THREE.PlaneGeometry(1.0, 0.48), std(0xffffff, 0.8, { map: textTex(['SERVICE VEHICLES', 'ONLY'], 256, 124, '#d8cfae', '#8d1f18', '#8d1f18') }), 0, 0, 0.008, svcSign);
  W.svcBox = { x1: -16.6, x2: -10.4, z1: TZ - 0.2, z2: TZ + 0.2 }; boxes.push(W.svcBox);
  E.breach = 0;                                    // 0 intact .. 1 burst open (set going by game.js in the finale)

  W.drawEntranceMap = function (g) {
    g.fillStyle = '#4a4840'; g.fillRect(-25.5, 113.2, 52, 36.2);
    g.fillStyle = '#55534c'; [-5.6, 0, 5.6].forEach(function (x) { g.fillRect(x - 1.1, TZ - 1.2, 2.2, 2.4); });
    g.fillRect(-22, 124, 6, 6); g.fillRect(11, 121, 14, 14); g.fillStyle = '#2a2c28'; g.beginPath(); g.arc(0, 132, 2.7, 0, 7); g.fill();
  };

  // someone walking through an open lane pushes the tripod round a third of a turn
  E.pushLane = function (x, zOld, zNew) {
    if ((zOld - TZ) * (zNew - TZ) > 0) return;
    for (var n = 0; n < E.tripods.length; n++) { var t = E.tripods[n]; if (Math.abs(x - t.x) < 0.66 && t.box.off) { t.target += (zNew < zOld ? 1 : -1) * PI * 2 / 3; Sfx.play('turnstile', { vol: 0.7, fallback: function () { Sound.clunk(); Sound.click(); } }); } }
  };
  E.step = function (dt, instant) {
    var esc = P.esc, open = P.turn && (!esc || esc.turn >= 1), n;
    for (n = 0; n < E.tripods.length; n++) {
      var t = E.tripods[n]; t.box.off = !!open;
      t.ang = instant ? t.target : damp(t.ang, t.target, 9, dt); t.spin.rotation.y = t.ang;
      E.laneLeds[n].map = open ? ledGo : ledX; E.laneLeds[n].color.setHex(P.pow0 && !esc ? 0xffffff : esc ? (Math.sin(playTime * 9) > 0 ? 0xffffff : 0x333333) : 0x1a1a1a);
    }
    if (!E.driven) E.setGate(easeIO(anim.gate));
    for (n = 0; n < 5; n++) { var on = !!(esc && esc.lock >= n + 1); W.lockLamps[n].color.setHex(on ? 0xffc933 : 0x180c00); E.keySlots[n].visible = on; }
    // the service gate: shut and chained, until the finale bursts it inward
    var b = E.breach; W.svcBox.off = b > 0.3; E.svcChain.visible = b <= 0;
    for (n = 0; n < 2; n++) { var sv = E.svc[n], sw = easeBack(Math.min(1, b * 1.15)) * (n ? 1.75 : 1.5); sv.pivot.rotation.y = sv.s * sw; sv.pivot.rotation.x = n ? 0 : -Math.min(1, b) * 0.1; }
    if (E.shopStep) E.shopStep(dt, instant);
  };
  return E;
})();
