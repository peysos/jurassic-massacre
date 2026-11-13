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
  light('term', 0xbcd0ff, 22.2, 1.5, 128.2, 6, 1.6);
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
    /* The hanging letter: it has lost three bolts and turns on the one left in its top-right corner.  Gravity swings it until
       its middle is under that bolt (+0.64 rad), which carries it out past the end of the arch, clear of its neighbour. */
    if (hang) { grp.position.set(lx + 0.32, ly + 0.43, AZ + 0.075); grp.rotation.z = 0.6; grp.userData.rest = 0.6; E.hangLetter = grp;
      cyl(0.022, 0.022, 0.05, EM.rustSteel, 0, 0, 0.01, grp, 8).rotation.x = PI / 2; box(0.05, 0.05, 0.02, EM.rustSteel, 0, 0, -0.03, grp); }
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
  /* A vandal-resistant access unit: a charcoal steel housing with a rain hood, an LCD behind a black bezel, two status lamps
     and a low stainless keypad; beside it a separate swipe head, a block with a narrow slot down its middle that the card's
     edge runs through (the card stands out from the wall, square to it).  Years of dust lie on every face, printed on a film
     laid on the face itself (the keys stand up through it), so a hand wipes the face, not a pane in front of it. */
  var RD = new THREE.Group(); RD.position.set(4.15, 1.42, WORLD + 0.652); scene.add(RD); E.readerPos = RD.position; E.reader = RD;
  var hsg = std(0x4a4e52, 0.6, { metalness: 0.35, map: metalTex }), hsgDark = std(0x202224, 0.65, { metalness: 0.3 }), stain = std(0x8d9295, 0.38, { metalness: 0.7, map: metalTex });
  var RW = 0.23, RH = 0.39, RF = 0.056;                                                                  // housing width, height; its front face (z)
  cyl(0.014, 0.014, 1.2, EM.steel, -0.06, -0.8, 0.02, RD, 8);                                            // conduit down the pillar, into the housing's foot
  box(RW + 0.024, RH + 0.024, 0.008, hsgDark, 0, 0, 0.004, RD);                                         // back flange
  box(RW, RH, RF - 0.012, hsg, 0, 0, 0.008 + (RF - 0.012) / 2, RD);                                      // the housing
  box(RW - 0.01, RH - 0.01, 0.004, hsg, 0, 0, RF - 0.002, RD);                                           // its front, a step in from the edges
  var hood = box(RW + 0.034, 0.01, 0.1, hsg, 0, RH / 2 + 0.018, 0.05, RD); hood.rotation.x = 0.2;           // rain hood, sloping to the front
  [-1, 1].forEach(function (sd) { var ch = box(0.006, 0.034, 0.088, hsg, sd * (RW / 2 + 0.014), RH / 2 + 0.004, 0.046, RD); ch.rotation.x = 0.2; });
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (c) { cyl(0.0045, 0.0045, 0.004, stain, c[0] * (RW / 2 - 0.012), c[1] * (RH / 2 - 0.012), RF + 0.002, RD, 8).rotation.x = PI / 2; });   // tamper screws
  mesh(new THREE.PlaneGeometry(RW - 0.012, RH - 0.012), std(0xffffff, 0.55, { metalness: 0.45, map: canvasTex(256, function (g, S, H) {
    g.fillStyle = '#44484c'; g.fillRect(0, 0, S, H);
    for (var q = 0; q < 260; q++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.02 + Math.random() * 0.05) + ')'; var y = Math.random() * H; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    var sy = H / (RH - 0.012), sx = S / (RW - 0.012);
    function Y(y) { return H / 2 - y * sy; } function X(x) { return S / 2 + x * sx; }
    g.fillStyle = '#d9dcde'; g.font = 'bold 17px Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('STAFF ACCESS', X(-0.098), Y(0.165));
    g.fillStyle = '#0c0d0e'; g.fillRect(X(-0.088), Y(0.142), 0.176 * sx, 0.084 * sy);                    // display bezel
    g.fillStyle = '#e2b93b'; g.fillRect(X(-0.098), Y(-0.172), 0.196 * sx, 2);                              // the park's gold rule
    g.fillStyle = '#9aa0a4'; g.font = '11px Arial, sans-serif'; g.fillText('FAMILY ZOO  ·  GATE 1', X(-0.098), Y(-0.183));
    streaks(g, S, H, 12, 'rgba(60,40,22,.7)', H * 0.6); grime(g, S, H, 0.8);
  }, 1, 1, true, Math.round(256 * (RH - 0.012) / (RW - 0.012))) }), 0, 0, RF + 0.0002, RD);
  var lcd = livePanel(0.16, 0.068, 256, 108, 0, 0, 0, 0, RD); lcd.mesh.position.set(0, 0.1, RF + 0.0006); lcd.mesh.material = basic(0xffffff, { map: lcd.tex, fog: false });
  E.lcd = function (l1, l2, col) {
    var g = lcd.g; g.fillStyle = '#060a07'; g.fillRect(0, 0, 256, 108);
    if (l1) { g.fillStyle = col || '#39d86a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px Consolas, "Courier New", monospace'; g.fillText(l1, 128, l2 ? 36 : 54, 244); if (l2) g.fillText(l2, 128, 74, 244); }
    lcd.tex.needsUpdate = true;
  };
  E.lcd('');
  E.ledR = glow(0x1a0404); E.ledG = glow(0x041a08);
  [[E.ledR, 0.058], [E.ledG, 0.083]].forEach(function (l) { cyl(0.0075, 0.0075, 0.003, hsgDark, l[1], 0.165, RF + 0.0015, RD, 12).rotation.x = PI / 2; mesh(new THREE.CircleGeometry(0.0055, 12), l[0], l[1], 0.165, RF + 0.0032, RD); });
  // the keypad: low stainless keys, 4 mm proud of the face
  var keyGeo = new THREE.BoxGeometry(0.044, 0.032, 0.005), keys = '123456789*0#';
  E.readerKeys = [];
  for (i = 0; i < 12; i++) {
    var kx = -0.06 + (i % 3) * 0.06, ky = 0.012 - Math.floor(i / 3) * 0.045;
    mesh(keyGeo, stain, kx, ky, RF + 0.0025, RD); E.readerKeys.push([kx, ky]);
    mesh(new THREE.PlaneGeometry(0.04, 0.028), std(0xffffff, 0.35, { metalness: 0.6, map: (function (ch) { return canvasTex(64, function (g, S, H) { g.fillStyle = '#7e8387'; g.fillRect(0, 0, S, H); g.fillStyle = '#1c1e20'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px Arial, sans-serif'; g.fillText(ch, S / 2, H / 2 + 2); g.fillStyle = 'rgba(70,60,40,.28)'; g.fillRect(0, 0, S, H); }, 1, 1, true, 45); })(keys[i]) }), kx, ky, RF + 0.0051, RD);
  }
  // the swipe head, to the right of the housing: two jaws with a 4 mm slot between them, open at the top and the bottom
  var SX = RW / 2 + 0.038, SJ = 0.024, SG = 0.002, SD = 0.05, SL = 0.3;                                  // its centre, jaw width, half the gap, depth, length
  box(SJ * 2 + SG * 2 + 0.012, SL + 0.012, 0.006, hsgDark, SX, 0, 0.003, RD);
  [-1, 1].forEach(function (sd) {
    box(SJ, SL, SD - 0.006, hsg, SX + sd * (SG + SJ / 2), 0, 0.006 + (SD - 0.006) / 2, RD);
    [1, -1].forEach(function (e) { var fl = box(SJ, 0.012, SD - 0.01, hsg, SX + sd * (SG + SJ / 2 + 0.0015), e * (SL / 2 + 0.004), 0.008 + (SD - 0.01) / 2, RD); fl.rotation.z = sd * e * 0.35; });   // flared mouths
  });
  box(SG * 2, SL, 0.016, hsgDark, SX, 0, 0.014, RD);                                                     // the floor of the slot, with the read head in it
  box(SG * 2 - 0.0005, 0.03, 0.01, stain, SX, 0.02, 0.026, RD);
  mesh(new THREE.PlaneGeometry(SJ - 0.002, 0.07), std(0xffffff, 0.6, { map: textTex(['SWIPE', '▼'], 64, 192, '#2b2d2f', '#d9dcde', null, false) }), SX - SG - SJ / 2, 0.08, SD + 0.0005, RD);
  E.slot = new THREE.Vector3(4.15 + SX, 1.42, WORLD + 0.652 + SD);                                      // the mouth of the slot, half way down (world)
  E.readerFace = { x: 4.15, y: 1.42, z: WORLD + 0.652 + RF, w: RW - 0.012, h: RH - 0.012, sx: 4.15 + SX, sw: SJ * 2 + SG * 2, sh: SL, sz: WORLD + 0.652 + SD };
  /* Obstacles for checking hands against the unit (reader space boxes: x1, x2, y1, y2, z1, z2). */
  E.readerSolids = [[-RW / 2, RW / 2, -RH / 2, RH / 2, 0, RF], [SX - SG - SJ, SX - SG, -SL / 2, SL / 2, 0, SD], [SX + SG, SX + SG + SJ, -SL / 2, SL / 2, 0, SD]]
    .concat([[-RW / 2 - 0.017, RW / 2 + 0.017, RH / 2 + 0.004, RH / 2 + 0.03, 0, 0.1]])
    .concat(E.readerKeys.map(function (k) { return [k[0] - 0.022, k[0] + 0.022, k[1] - 0.016, k[1] + 0.016, 0, RF + 0.005]; }));
  // years of dust over the face: a film on the housing's front, and on the fronts of the swipe jaws (not over the slot)
  var dustC = document.createElement('canvas'); dustC.width = 256; dustC.height = 432;
  var dustG = dustC.getContext('2d'), dustTex = new THREE.CanvasTexture(dustC); dustTex.encoding = THREE.sRGBEncoding;
  var dustMat = new THREE.MeshStandardMaterial({ map: dustTex, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  var dustMesh = mesh(new THREE.PlaneGeometry(RW - 0.012, RH - 0.012), dustMat, 0, 0, RF + 0.0012, RD); dustMesh.userData.noCast = true; dustMesh.renderOrder = 2;
  var sdC = document.createElement('canvas'); sdC.width = 64; sdC.height = 256;
  var sdG = sdC.getContext('2d'), sdTex = new THREE.CanvasTexture(sdC); sdTex.encoding = THREE.sRGBEncoding;
  [-1, 1].forEach(function (sd) {
    var t = sdTex.clone(); t.needsUpdate = true; t.repeat.set(0.5, 1); t.offset.set(sd < 0 ? 0 : 0.5, 0); (E.sdTexes = E.sdTexes || []).push(t);
    var m = mesh(new THREE.PlaneGeometry(SJ, SL), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), SX + sd * (SG + SJ / 2), 0, SD + 0.0009, RD);
    m.userData.noCast = true; m.renderOrder = 2;
  });
  function dustLayer(g, W2, H2, amount, web) {
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W2, H2);
    if (amount <= 0) return;
    g.globalAlpha = 0.8 * amount; g.fillStyle = '#6c6555'; g.fillRect(0, 0, W2, H2);
    var sc = ['#857c68', '#5a5446', '#968d78', '#4a4539']; for (var q0 = 0; q0 < W2 * H2 / 20; q0++) { g.globalAlpha = (0.2 + Math.random() * 0.4) * amount; g.fillStyle = sc[q0 & 3]; g.beginPath(); g.arc(Math.random() * W2, Math.random() * H2, 0.6 + Math.random() * 1.8, 0, 7); g.fill(); }
    g.globalAlpha = 0.16 * amount; for (var q = 0; q < 10; q++) { g.fillStyle = q % 2 ? '#6a6252' : '#a8a08a'; g.beginPath(); g.ellipse(Math.random() * W2, Math.random() * H2, 6 + Math.random() * 30, 4 + Math.random() * 18, Math.random() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 0.6 * amount; g.fillStyle = 'rgba(70,58,40,.6)'; for (q = 0; q < 10; q++) g.fillRect(Math.random() * W2, 0, 1.2, H2 * (0.3 + Math.random() * 0.6));     // rain runs
    if (web) { g.globalAlpha = 0.5 * amount; g.strokeStyle = '#cfc9b8'; g.lineWidth = 0.7; for (q = 0; q < 9; q++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(60 + q * 8, 20 + q * 6, 40 + q * 22, 90 + (q % 3) * 26); g.stroke(); } }
    g.globalAlpha = 1;
  }
  E.dustFill = function (amount) {                  // 1 = untouched for years, 0 = clean
    dustLayer(dustG, 256, 432, amount, true); dustLayer(sdG, 64, 256, amount, false);
    dustTex.needsUpdate = true; E.sdTexes.forEach(function (t) { t.needsUpdate = true; });
  };
  function rub(g, W2, H2, x, y, R, strength) {
    var gr = g.createRadialGradient(x, y, R * 0.25, x, y, R);
    gr.addColorStop(0, 'rgba(0,0,0,' + (strength || 0.8) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); g.globalCompositeOperation = 'source-over';
  }
  E.dustWipe = function (u, v, r, strength) {       // rub a patch of the housing's face clean; u, v in 0..1 across it (u right, v up), r in face widths
    rub(dustG, 256, 432, u * 256, (1 - v) * 432, r * 256, strength); dustTex.needsUpdate = true;
  };
  E.slotWipe = function (v, r, strength) {          // the jaw edges either side of the slot, at height v (0 bottom .. 1 top)
    rub(sdG, 64, 256, 32, (1 - v) * 256, r * 256, strength); E.sdTexes.forEach(function (t) { t.needsUpdate = true; });
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
  /* The forecourt between the gate and the ticket lanes.  It is closed in east and west by the park's rendered walls where the
     paving ends (planted beds along them, gone wild), with a fenced service yard behind the maintenance shed and a locked
     staff alley behind the gift shop, so there is nowhere to wander round the back of anything.  The fountain is at its
     heart with the benches set round it; the walk from the gate to the ticket lanes runs straight past it. */
  var PX1 = -25.4, PX2 = 26.4, PZ1 = 116.25, PZ2 = 149.25;
  // stretcher-bond concrete pavers, 20 x 10 cm, 4 m to a repeat; weeds and moss in the joints, oil and rain stains on top
  function paverPaint(height) {
    return function (g, S) {
      var px = S / 20, py = S / 40, r, c, tones = ['#6f6b62', '#66625a', '#77736a', '#5f5b53', '#726d63', '#6a665d', '#5a574f'];
      g.fillStyle = height ? '#151515' : '#262820'; g.fillRect(0, 0, S, S);
      for (r = 0; r < 40; r++) for (c = -1; c < 20; c++) {
        var x = c * px + (r % 2 ? px / 2 : 0), y = r * py, n = (r * 13 + c * 7 + ((r * c) % 5)) % 7;
        if (height) { var v = 150 + (n * 9) % 50; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x + 1.6, y + 1.6, px - 3.2, py - 3.2); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 2.6, y + 2.6, px - 5.2, py - 5.2); }
        else { g.fillStyle = tones[n]; g.fillRect(x + 1.4, y + 1.4, px - 2.8, py - 2.8); }
      }
      if (height) return;
      g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#4f4b43', '#8f8a7f', '#5c5850', '#3d3a33', '#9a958a'], 26000, 1.3)(g, S); g.globalAlpha = 1;
      blotch(g, S, ['#1f2618', '#1a1c14', '#2e2a1c', '#283a1a', '#121410'], 70, 20, 130, 0.38);         // damp, moss, oil
      g.fillStyle = 'rgba(56,74,34,.7)';                                                                 // weeds in the joints
      for (var q = 0; q < 420; q++) { var jr = (Math.random() * 40) | 0, jx = Math.random() * S; g.fillRect(jx, jr * py - 1, 3 + Math.random() * 10, 2.4); }
      g.strokeStyle = 'rgba(16,16,13,.7)'; g.lineWidth = 1.2;
      for (q = 0; q < 12; q++) { var x0 = Math.random() * S, y0 = Math.random() * S; g.beginPath(); g.moveTo(x0, y0); for (var k2 = 0; k2 < 8; k2++) { x0 += (Math.random() - 0.5) * 50; y0 += (Math.random() - 0.5) * 50; g.lineTo(x0, y0); } g.stroke(); }
    };
  }
  var plazaPaver = std(0xffffff, 0.93, { map: canvasTex(1024, paverPaint(false)), normalMap: normalTex(1024, paverPaint(true), 1.8), normalScale: new THREE.Vector2(0.8, 0.8) });
  flat(52, 36.2, rt(plazaPaver, 13, 9.05), 0.5, 0.022, 131.3);

  // the walls: rendered blockwork on a stone plinth, pilasters every 4.6 m, a stone coping, years of rain down the face
  function renderPaint(g, S) {
    g.fillStyle = '#9b968a'; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.55; speckle('rgba(0,0,0,0)', ['#8a857a', '#aca79b', '#7e796e', '#b5b0a4', '#6f6a60'], 30000, 1.6)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#6d6a5e', '#bab4a6', '#5c5b4e'], 40, 20, 90, 0.25);
    streaks(g, S, S, 70, 'rgba(38,40,30,.85)', S * 0.9); grime(g, S, S, 1.4);
    g.fillStyle = 'rgba(52,64,34,.55)'; for (var q = 0; q < 26; q++) { var x = Math.random() * S; g.beginPath(); g.ellipse(x, S - Math.random() * 40, 10 + Math.random() * 30, 6 + Math.random() * 20, 0, 0, 7); g.fill(); }   // algae at the foot
    g.strokeStyle = 'rgba(30,30,26,.55)'; g.lineWidth = 1;
    for (q = 0; q < 5; q++) { var cx = Math.random() * S, cy = Math.random() * S; g.beginPath(); g.moveTo(cx, cy); for (var k3 = 0; k3 < 7; k3++) { cx += (Math.random() - 0.5) * 30; cy += Math.random() * 30; g.lineTo(cx, cy); } g.stroke(); }
  }
  var renderMat = std(0xffffff, 0.94, { map: canvasTex(512, renderPaint), bumpMap: bump(3), bumpScale: 0.02 }), copeMat = std(0xffffff, 0.9, { map: EM.stone.map.clone(), bumpMap: bump(2), bumpScale: 0.03 });
  copeMat.map.repeat.set(1, 1); copeMat.map.needsUpdate = true;
  var plinthMat = std(0xffffff, 0.95, { map: canvasTex(256, function (g, S) { speckle('#57534b', ['#4a463f', '#625e55', '#3d3a34'], 6000, 1.6)(g, S); blotch(g, S, ['#2a3220', '#1e211a'], 18, 10, 50, 0.5); }) });
  function sideWall(x1, x2, inner, gap) {          // gap: [z1, z2] of an opening through it (the staff wing's link, behind the shop)
    var runs = gap ? [[PZ1, gap[0]], [gap[1], PZ2]] : [[PZ1, PZ2]];
    runs.forEach(function (r) { wbox(x1, x2, 0, 3.4, r[0], r[1], renderMat, 3, null, true); wbox(x1 - 0.05, x2 + 0.05, 0, 0.32, r[0], r[1], plinthMat, 1.2); });
    if (gap) wbox(x1, x2, 2.6, 3.4, gap[0], gap[1], renderMat, 3);
    wbox(x1 - 0.07, x2 + 0.07, 3.4, 3.52, PZ1, PZ2, copeMat, 1.5);
    for (var z = PZ1 + 1.8; z < PZ2 - 1; z += 4.6) {
      if (gap && z > gap[0] - 0.4 && z < gap[1] + 0.4) continue;
      var f = inner > x1 ? x2 : x1, d = inner > x1 ? 1 : -1;
      wbox(Math.min(f, f + d * 0.14), Math.max(f, f + d * 0.14), 0, 3.62, z - 0.26, z + 0.26, renderMat, 3);
      wbox(Math.min(f, f + d * 0.2) - 0.02, Math.max(f, f + d * 0.2) + 0.02, 3.62, 3.74, z - 0.32, z + 0.32, copeMat, 1.5);
    }
  }
  sideWall(-26.0, PX1, 1); sideWall(PX2, 27.0, -1, [131.45, 132.95]);
  // overgrown hedging in a bed along each wall (not where the shed yard and the shop alley are)
  (function () {
    var clumps = [], col3 = new THREE.Color(), beds = [[PX1 + 0.65, 131.2, 148.6], [PX1 + 0.65, 117.0, 122.8], [PX2 - 0.65, 136.0, 148.6], [PX2 - 0.65, 117.0, 120.2]];
    var edge = [];
    beds.forEach(function (b) {
      flat(1.3, b[2] - b[1] + 0.6, std(0x1d1a12, 1, { map: canvasTex(128, speckle('#2a2418', ['#1c1810', '#3a301e', '#46402a', '#2f3a1e'], 3000, 2)) }), b[0], 0.03, (b[1] + b[2]) / 2);
      edge.push([b[0] + (b[0] < 0 ? 0.68 : -0.68), 0.06, (b[1] + b[2]) / 2, 0.08, 0.12, b[2] - b[1] + 0.6]);
      for (var z = b[1]; z <= b[2]; z += 0.55 + srand() * 0.25) {
        var s = 0.6 + srand() * 0.35, h = 1.0 + srand() * 0.9;
        clumps.push([b[0] + (srand() - 0.5) * 0.4, h * 0.55, z, s, h * 0.6, s * 1.1, srand() * 0.3, srand() * 6, srand() * 0.3]);
        if (srand() < 0.5) clumps.push([b[0] + (srand() - 0.5) * 0.6, 0.45 + srand() * 0.4, z + 0.25, s * 0.7, s * 0.6, s * 0.7, 0, srand() * 6, 0]);
      }
      boxes.push({ x1: b[0] - 0.65, x2: b[0] + 0.65, z1: b[1] - 0.3, z2: b[2] + 0.3 });
    });
    var hm = inst(jitter(new THREE.IcosahedronGeometry(1, 1), 0.28), M.leaf, clumps);
    clumps.forEach(function (_, n) { var dead = srand() < 0.18; col3.setHSL(dead ? 0.09 + srand() * 0.03 : 0.26 + srand() * 0.07, dead ? 0.3 : 0.42, dead ? 0.1 : 0.06 + srand() * 0.05); hm.setColorAt(n, col3); });
    inst(new THREE.BoxGeometry(1, 1, 1), EM.stone, edge);
  })();

  // service yard behind the shed: chain-link on steel posts, a padlocked gate; gas bottles, pallets and a drum inside
  (function () {
    var chain = M.chain.clone(); chain.map = chainTex.clone(); chain.map.needsUpdate = true;
    function mesh2d(x1, x2, z, h) {
      var len = x2 - x1, m2 = chain.clone(); m2.map = chain.map.clone(); m2.map.needsUpdate = true; m2.map.repeat.set(len / 0.4, h / 0.4);
      mesh(new THREE.PlaneGeometry(len, h), m2, (x1 + x2) / 2, h / 2 + 0.05, z).userData.noCast = true;
      cyl(0.03, 0.03, len, EM.steel, (x1 + x2) / 2, h + 0.05, z, null, 6).rotation.z = PI / 2;
      [x1, x2].forEach(function (x) { cyl(0.045, 0.045, h + 0.15, EM.steel, x, (h + 0.15) / 2, z, null, 8); });
      boxes.push({ x1: x1, x2: x2, z1: z - 0.08, z2: z + 0.08 });
    }
    mesh2d(PX1, -22.0, 124.1, 2.2); mesh2d(PX1, -22.0, 129.9, 2.2);
    // a padlock and chain on the south fence's gate
    var gl = new THREE.Group(); gl.position.set(-23.2, 1.05, 129.98); scene.add(gl);
    box(0.06, 0.08, 0.025, M.gold, 0, -0.08, 0, gl); mesh(new THREE.TorusGeometry(0.06, 0.007, 6, 14), EM.steel, 0, 0, 0, gl).scale.set(1, 0.5, 1);
    var yardMat = std(0xffffff, 0.9, { map: woodTex });
    [[-24.3, 125.0, 0], [-24.2, 125.0, 0.14]].forEach(function (p, n) {                     // pallets
      var G = new THREE.Group(); G.position.set(p[0], p[2] + 0.02, p[1]); G.rotation.y = n * 0.12; scene.add(G);
      for (var q = 0; q < 5; q++) box(1.2, 0.022, 0.12, yardMat, 0, 0.122, -0.4 + q * 0.2, G);
      [-0.5, 0, 0.5].forEach(function (x) { box(0.1, 0.1, 1.0, yardMat, x, 0.06, 0, G); });
    });
    [[-24.8, 128.6, 0x9a2018], [-24.4, 129.4, 0xc8b030]].forEach(function (b) {                 // gas bottles chained to the wall
      var bm = std(b[2], 0.55, { bumpMap: bump(2), bumpScale: 0.01 });
      cyl(0.15, 0.15, 1.1, bm, b[0], 0.6, b[1], null, 14); mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, PI * 2, 0, PI / 2), bm, b[0], 1.15, b[1]);
      cyl(0.03, 0.04, 0.12, EM.steel, b[0], 1.32, b[1], null, 8); circles.push({ x: b[0], z: b[1], r: 0.2 });
    });
    cyl(0.29, 0.29, 0.88, std(0x2f4a5a, 0.6, { map: rustTex }), -23.0, 0.46, 125.0, null, 16);
  })();
  // the staff alley behind the shop: a locked palisade gate at each end
  function palisade(x1, x2, z, h) {
    var bars = [], len = x2 - x1, n = Math.round(len / 0.13);
    for (var q = 0; q <= n; q++) bars.push([x1 + q * len / n, h / 2, z, 1, h, 1]);
    inst(new THREE.BoxGeometry(0.035, 1, 0.035), EM.green, bars);
    [0.25, h - 0.25].forEach(function (y) { box(len, 0.06, 0.02, EM.green, (x1 + x2) / 2, y, z + 0.03); });
    boxes.push({ x1: x1, x2: x2, z1: z - 0.08, z2: z + 0.08 });
  }
  palisade(25.0, PX2, 135.25, 2.3); palisade(25.0, PX2, 120.75, 2.3);
  mesh(new THREE.PlaneGeometry(0.62, 0.36), std(0xffffff, 0.8, { map: textTex(['STAFF ONLY', 'NO PUBLIC ACCESS'], 256, 150, '#8d1f18', '#f1ecdd', '#f1ecdd') }), 25.7, 1.4, 135.31);

  // ---------- the fountain: a dry stone basin with the park's mascot in bronze on a column ----------
  /* The basin is turned from one profile: up the outside, over the rounded coping, down the inside (that order keeps every
     face pointing out of the stone).  Inside: a dead leaf bed, a stagnant puddle with a green rim, a few coins. */
  (function () {
    var FX = 0, FZ = 132, R0 = 3.0;
    var basinStone = std(0xffffff, 0.86, { map: canvasTex(512, function (g, S) {
      speckle('#a39d8e', ['#938d7f', '#b3ad9e', '#857f72', '#c0baab', '#7a7569'], 16000, 1.8)(g, S);
      blotch(g, S, ['#5f5e50', '#3d4632', '#6d6656'], 26, 14, 70, 0.32);
      g.fillStyle = 'rgba(40,46,30,.75)'; g.fillRect(0, S * 0.62, S, S * 0.38);                                 // the old water line: stained below
      g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#2a3220', '#46502e'], 2600, 2.2)(g, S); g.globalAlpha = 1;
      streaks(g, S, S, 40, 'rgba(36,40,28,.9)', S * 0.6);
    }), bumpMap: bump(3), bumpScale: 0.03 });
    var prof = [[3.06, 0.0], [3.06, 0.4], [3.09, 0.46], [3.1, 0.52], [3.06, 0.58], [2.98, 0.615], [2.88, 0.62], [2.79, 0.6], [2.74, 0.55], [2.73, 0.48], [2.72, 0.12], [2.7, 0.1]];
    var basin = mesh(new THREE.LatheGeometry(prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 64), basinStone, FX, 0.02, FZ);
    basin.material.map.repeat.set(6, 1);
    // paved surround: a ring of granite setts and a kerb band
    var setts = std(0xffffff, 0.9, { map: canvasTex(512, function (g, S) {
      g.fillStyle = '#2a2a26'; g.fillRect(0, 0, S, S);
      for (var r = 0; r < 6; r++) for (var c = 0; c < 48; c++) { var v = 88 + ((r * 31 + c * 17) % 7) * 7; g.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 9) + ')'; g.fillRect(c * S / 48 + 1.5 + (r % 2) * 4, r * S / 6 + 2, S / 48 - 3, S / 6 - 4); }
      g.globalAlpha = 0.45; speckle('rgba(0,0,0,0)', ['#3a3a34', '#7a7a70', '#1e2018'], 9000, 1.4)(g, S); g.globalAlpha = 1; blotch(g, S, ['#1f2618', '#2c2a1c'], 30, 10, 60, 0.4);
    }) });
    var ring = mesh(new THREE.RingGeometry(R0 + 0.05, 5.6, 72, 3), setts, FX, 0.03, FZ); ring.rotation.x = -PI / 2; ring.userData.noCast = true;
    // ring UVs: u around, v across, so the setts run in courses round the basin
    (function (geo) { var P2 = geo.attributes.position, U = geo.attributes.uv; for (var q = 0; q < P2.count; q++) { var x = P2.getX(q), y = P2.getY(q), r = Math.hypot(x, y), a = Math.atan2(y, x); U.setXY(q, (a / (PI * 2) + 0.5) * 6, (r - R0) / 2.55); } U.needsUpdate = true; })(ring.geometry);
    var kerb = mesh(new THREE.RingGeometry(5.6, 5.85, 72, 1), EM.stone, FX, 0.034, FZ); kerb.rotation.x = -PI / 2; kerb.userData.noCast = true;
    // the bed inside: dry silt and leaves
    var bed = mesh(new THREE.CircleGeometry(2.71, 48), std(0xffffff, 0.92, { map: canvasTex(512, function (g, S) {
      speckle('#3b3a30', ['#2d2c24', '#4a483c', '#24231c', '#55513f'], 12000, 2)(g, S); blotch(g, S, ['#141712', '#28321c', '#3a2e1c', '#4a3a22'], 40, 14, 80, 0.55);
      for (var q = 0; q < 520; q++) { g.save(); g.translate(Math.random() * S, Math.random() * S); g.rotate(Math.random() * 6); g.globalAlpha = 0.6 + Math.random() * 0.4; g.fillStyle = ['#5a4424', '#6d5226', '#3f3018', '#75602c', '#4a3a20', '#7a5a2a'][q % 6]; g.beginPath(); g.ellipse(0, 0, 4 + Math.random() * 4, 2 + Math.random() * 2, 0, 0, 7); g.fill(); g.restore(); }
      g.globalAlpha = 1;
    }) }), FX, 0.13, FZ); bed.rotation.x = -PI / 2; bed.userData.noCast = true;
    // the puddle that never dries: dark water with a slick of algae round its edge
    var pudTex = canvasTex(256, function (g, S) { g.clearRect(0, 0, S, S); var gr = g.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2); gr.addColorStop(0, 'rgba(6,10,9,1)'); gr.addColorStop(0.78, 'rgba(10,16,10,.95)'); gr.addColorStop(0.9, 'rgba(46,64,28,.8)'); gr.addColorStop(1, 'rgba(46,64,28,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(S / 2, S / 2, S / 2, S * 0.4, 0, 0, 7); g.fill(); });
    var pud = mesh(new THREE.PlaneGeometry(2.6, 2.6), std(0xffffff, 0.05, { metalness: 0.6, map: pudTex, transparent: true, depthWrite: false }), FX + 0.7, 0.136, FZ + 0.9); pud.rotation.x = -PI / 2; pud.rotation.z = 0.5; pud.userData.noCast = true;
    var coins = []; for (var q = 0; q < 18; q++) { var a = srand() * 6.28, r2 = 1.2 + srand() * 1.4; coins.push([FX + Math.cos(a) * r2, 0.134, FZ + Math.sin(a) * r2, 1, 1, 1, 0, srand() * 6, 0]); }
    inst(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 10), std(0xb08d4a, 0.35, { metalness: 0.9 }), coins).userData.noCast = true;
    // the column: a turned stone pedestal with a basin of its own, dry spouts below its lip
    var col = [[0.0, 0.0], [0.7, 0.0], [0.7, 0.12], [0.62, 0.18], [0.55, 0.2], [0.5, 0.26], [0.47, 0.32], [0.45, 0.9], [0.47, 0.95], [0.6, 1.0], [0.74, 1.04], [0.78, 1.1], [0.74, 1.14], [0.0, 1.14]];
    mesh(new THREE.LatheGeometry(col.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 40), basinStone, FX, 0.1, FZ);
    for (q = 0; q < 4; q++) { var sa = q * PI / 2 + PI / 4, sp = cyl(0.035, 0.045, 0.22, EM.iron, FX + Math.cos(sa) * 0.52, 0.86, FZ + Math.sin(sa) * 0.52, null, 8); sp.rotation.set(Math.sin(sa) * 1.2, 0, -Math.cos(sa) * 1.2); }
    for (q = 0; q < 6; q++) { var la = srand() * 6.28; mesh(new THREE.PlaneGeometry(0.09, 0.05), std(0x5a4424, 1, { side: THREE.DoubleSide }), FX + Math.cos(la) * (0.2 + srand() * 0.4), 1.25, FZ + Math.sin(la) * (0.2 + srand() * 0.4)).rotation.set(-PI / 2, 0, srand() * 6); }
    // Dottie, in bronze gone green
    var bronze = std(0xffffff, 0.55, { metalness: 0.6, map: canvasTex(128, function (g, S) { speckle('#3d6657', ['#2e5144', '#4f7f6c', '#2a3d33', '#6a917c'], 2600, 2.4)(g, S); blotch(g, S, ['#1c241c', '#7fae98', '#3a2a18'], 16, 6, 30, 0.45); streaks(g, S, S, 14, 'rgba(150,200,175,.7)'); }), bumpMap: bump(2), bumpScale: 0.02 });
    var st = new THREE.Group(); st.position.set(FX, 1.24, FZ); st.rotation.y = 0.5; scene.add(st);
    tube([[0, 0.62, -1.15, 0.02, 0.02], [0, 0.6, -0.7, 0.1, 0.1], [0, 0.66, -0.3, 0.26, 0.27], [0, 0.7, 0.1, 0.31, 0.33], [0, 0.72, 0.42, 0.24, 0.26], [0, 0.95, 0.66, 0.13, 0.14], [0, 1.3, 0.8, 0.09, 0.095], [0, 1.62, 0.9, 0.075, 0.08]], bronze, st, 14, 5);
    tube([[0, 1.6, 0.86, 0.07, 0.07], [0, 1.68, 0.98, 0.1, 0.085], [0, 1.66, 1.14, 0.075, 0.06], [0, 1.63, 1.24, 0.03, 0.03]], bronze, st, 10, 4);
    [[-0.2, -0.22], [0.2, -0.22], [-0.19, 0.3], [0.19, 0.3]].forEach(function (l) { tube([[l[0], 0.6, l[1], 0.1, 0.11], [l[0] * 1.05, 0.3, l[1], 0.08, 0.085], [l[0] * 1.05, 0.02, l[1] + 0.02, 0.09, 0.1]], bronze, st, 8, 3); });
    [-1, 1].forEach(function (sd) { mesh(new THREE.SphereGeometry(0.016, 6, 6), basic(0x050505), sd * 0.07, 1.72, 1.04, st); });
    // the plaque, fixed to the column
    var pl = mesh(new THREE.PlaneGeometry(0.42, 0.17), std(0xffffff, 0.45, { metalness: 0.6, map: canvasTex(256, function (g, S, H2) { g.fillStyle = '#6a5a2c'; g.fillRect(0, 0, S, H2); g.strokeStyle = '#3a2e14'; g.lineWidth = 4; g.strokeRect(5, 5, S - 10, H2 - 10); g.fillStyle = '#e2cf8a'; g.textAlign = 'center'; g.font = 'bold 30px Georgia, serif'; g.fillText('"DOTTIE"', S / 2, 42); g.font = '15px Georgia, serif'; g.fillText('FAMILY ZOO · EST. 1987', S / 2, 74); blotch(g, S, ['#2e4a3c', '#1a1a10'], 10, 6, 26, 0.5); }, 1, 1, true, 104) }), 0, 0.62, 0, null);
    var pa = 0.5 + PI / 2 + 0.6; pl.position.set(FX + Math.sin(pa) * 0.452, 0.72, FZ + Math.cos(pa) * 0.452); pl.rotation.y = pa;
    circles.push({ x: FX, z: FZ, r: 3.12 });
  })();
  // rubber cable protector: the power feed from the generator shed to the gift shop (and a hint where to go)
  var ramp = box(26.6, 0.06, 0.34, std(0xffffff, 0.85, { map: canvasTex(128, function (g, S, H) { g.fillStyle = '#c9a21c'; g.fillRect(0, 0, S, H); g.fillStyle = '#17160f'; for (var q = -1; q < 9; q++) { g.beginPath(); g.moveTo(q * 16, H); g.lineTo(q * 16 + 8, H); g.lineTo(q * 16 + 20, 0); g.lineTo(q * 16 + 12, 0); g.fill(); } grime(g, S, H, 1.4); }, 40, 1, true, 24) }), -2.6, 0.05, 126.2);
  ramp.userData.noCast = true;
  box(26.6, 0.03, 0.5, EM.rubber, -2.6, 0.035, 126.2).userData.noCast = true;
  // lamp posts (their bulbs are switched by the plaza-lights breaker), each with a tattered park banner on an arm
  E.plazaBulbs = []; E.banners = [];
  var bannerTex = canvasTex(256, function (g, S, H2) {
    g.fillStyle = '#254a30'; g.fillRect(0, 0, S, H2); g.fillStyle = '#d9ae35'; g.fillRect(0, 0, S, 18); g.fillRect(0, H2 - 18, S, 18);
    g.fillStyle = '#ece3c4'; g.textAlign = 'center'; g.font = 'bold 44px ' + FONT; g.fillText('FAMILY', S / 2, 96); g.fillText('ZOO', S / 2, 146);
    g.fillStyle = '#5c9a52'; g.beginPath(); g.ellipse(S / 2, 300, 70, 36, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(S / 2 + 40, 290); g.quadraticCurveTo(S / 2 + 90, 200, S / 2 + 70, 180); g.lineTo(S / 2 + 98, 186); g.quadraticCurveTo(S / 2 + 106, 230, S / 2 + 60, 310); g.fill();
    g.fillStyle = '#ece3c4'; g.font = 'bold 26px ' + FONT; g.fillText('MEET THE', S / 2, 400); g.fillText('DINOSAURS', S / 2, 432);
    g.fillStyle = 'rgba(200,190,160,.35)'; g.fillRect(0, 0, S, H2); streaks(g, S, H2, 30, 'rgba(30,30,20,.9)', H2); grime(g, S, H2, 1.3);
    g.globalCompositeOperation = 'destination-out';
    for (var q = 0; q < 9; q++) { g.beginPath(); g.moveTo(q * 32, H2); g.lineTo(q * 32 + 16, H2 - 20 - Math.random() * 40); g.lineTo(q * 32 + 32, H2); g.fill(); }
    g.beginPath(); g.moveTo(S * 0.7, H2 * 0.55); g.lineTo(S, H2 * 0.42); g.lineTo(S, H2 * 0.8); g.fill();
    g.globalCompositeOperation = 'source-over';
  }, 1, 1, true, 512);
  [[-6.6, 139.5], [6.6, 139.5], [-6.6, 122.5], [6.6, 122.5]].forEach(function (p, n) {
    cyl(0.07, 0.11, 4.2, EM.iron, p[0], 2.1, p[1], null, 10); cyl(0.17, 0.2, 0.5, EM.iron, p[0], 0.25, p[1], null, 10); cyl(0.13, 0.17, 0.08, EM.iron, p[0], 0.54, p[1], null, 10); cyl(0.1, 0.07, 0.12, EM.iron, p[0], 4.24, p[1], null, 8);
    var bm = basic(0x16130c); E.plazaBulbs.push(bm);
    mesh(new THREE.SphereGeometry(0.2, 14, 10), bm, p[0], 4.5, p[1]).userData.noCast = true;
    var cage = mesh(new THREE.SphereGeometry(0.215, 8, 5), basic(0x0c0c0c, { wireframe: true }), p[0], 4.5, p[1]); cage.userData.noCast = true;
    mesh(new THREE.ConeGeometry(0.3, 0.16, 10), EM.iron, p[0], 4.78, p[1]);
    circles.push({ x: p[0], z: p[1], r: 0.22 });
    // banner arms (on the side away from the fountain) and the banner hanging from them
    var sx = p[0] > 0 ? 1 : -1; [3.55, 2.25].forEach(function (y) { box(0.62, 0.04, 0.04, EM.iron, p[0] + sx * 0.33, y, p[1]); cyl(0.03, 0.03, 0.05, EM.iron, p[0] + sx * 0.63, y, p[1], null, 8); });
    var bg = dyn(new THREE.Group()); bg.position.set(p[0] + sx * 0.36, 3.55, p[1]); scene.add(bg);
    var bgeo = new THREE.PlaneGeometry(0.56, 1.25, 6, 10), bmat = std(0xffffff, 0.9, { map: bannerTex, alphaTest: 0.5 });
    mesh(bgeo, bmat, 0, -0.64, 0, bg); mesh(bgeo, bmat, 0, -0.64, 0, bg).rotation.y = PI;                       // printed both sides, one cloth
    bgeo.userData = { base: bgeo.attributes.position.array.slice(), ph: n * 1.7, sx: sx }; E.banners.push(bgeo);
  });

  // ---------- benches round the fountain (on the diagonals, leaving the walks clear), bins beside two of them ----------
  [45, 135, 225, 315].forEach(function (deg) { var a = deg * PI / 180, bx = Math.cos(a) * 6.9, bz = 132 + Math.sin(a) * 6.9; WB.bench(bx, bz, Math.atan2(-bx, -(bz - 132))); });
  WB.bin(6.3, 136.6); WB.bin(-6.3, 127.4); WB.bin(-7.4, 119.4); WB.bin(8.8, 134.2, true);

  // ---------- planters: cast-stone troughs gone to dry grass and dead shrubs ----------
  var dryGrass = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.45, map: canvasTex(256, function (g, S) {
    g.clearRect(0, 0, S, S);
    for (var q = 0; q < 140; q++) {
      var x = 20 + Math.random() * (S - 40), h = S * (0.4 + Math.random() * 0.58), lean = (Math.random() - 0.5) * 90, w = 1.6 + Math.random() * 2.4;
      g.fillStyle = ['#a8925a', '#8f7a46', '#bfa86a', '#7a6838', '#c8b47a', '#6d5f36'][q % 6];
      g.beginPath(); g.moveTo(x - w, S); g.quadraticCurveTo(x + lean * 0.3, S - h * 0.6, x + lean, S - h); g.quadraticCurveTo(x + lean * 0.35, S - h * 0.55, x + w, S); g.fill();
      if (q % 5 === 0) { g.fillStyle = '#d2c08a'; g.beginPath(); g.ellipse(x + lean, S - h - 6, 3, 12, lean / 120, 0, 7); g.fill(); }                    // a seed head
    }
  }) });
  var troughMat = std(0xffffff, 0.9, { map: canvasTex(256, function (g, S) { speckle('#8d887a', ['#7d786b', '#9d9889', '#6c675b', '#a8a393'], 9000, 1.6)(g, S); blotch(g, S, ['#2f3524', '#4a4636', '#1e2118'], 16, 8, 50, 0.45); streaks(g, S, S, 22, 'rgba(30,32,22,.85)'); g.fillStyle = 'rgba(40,52,24,.5)'; g.fillRect(0, S * 0.85, S, S * 0.15); }), bumpMap: bump(2), bumpScale: 0.025 });
  var soilMat = std(0xffffff, 1, { map: canvasTex(128, function (g, S) { speckle('#2a2418', ['#1c1810', '#3a301e', '#46402a', '#5a4a2a'], 3500, 2)(g, S); for (var q = 0; q < 50; q++) { g.fillStyle = ['#5a4424', '#6d5226', '#3f3018'][q % 3]; g.beginPath(); g.ellipse(Math.random() * S, Math.random() * S, 3, 1.6, Math.random() * 3, 0, 7); g.fill(); } }) });
  var twigMat = std(0x3a2c1e, 0.95, { map: barkTex });
  function deadShrub(x, y, z, s) {        // a branching tangle of dead stems
    var G = new THREE.Group(); G.position.set(x, y, z); G.rotation.y = srand() * 6; scene.add(G);
    function branch(p, dir, len, r, depth) {
      var end = p.clone().addScaledVector(dir, len), c = cyl(r * 0.6, r, len, twigMat, (p.x + end.x) / 2, (p.y + end.y) / 2, (p.z + end.z) / 2, G, 4);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      if (depth <= 0) return;
      for (var k = 0; k < 2 + (srand() < 0.4 ? 1 : 0); k++) { var d2 = dir.clone().add(new THREE.Vector3((srand() - 0.5) * 1.3, 0.15 + srand() * 0.3, (srand() - 0.5) * 1.3)).normalize(); branch(end, d2, len * (0.55 + srand() * 0.2), r * 0.6, depth - 1); }
    }
    for (var k = 0; k < 4; k++) branch(new THREE.Vector3((srand() - 0.5) * 0.1, 0, (srand() - 0.5) * 0.1), new THREE.Vector3((srand() - 0.5) * 0.6, 1, (srand() - 0.5) * 0.6).normalize(), 0.35 * s, 0.022 * s, 3);
  }
  function planter(x, z, w, d) {
    wbox(x - w / 2, x + w / 2, 0, 0.62, z - d / 2, z + d / 2, troughMat, 1.4, null, true);
    [[0, d / 2], [0, -d / 2]].forEach(function (e) { wbox(x - w / 2 - 0.05, x + w / 2 + 0.05, 0.62, 0.7, z + e[1] - 0.09, z + e[1] + 0.09, troughMat, 1.4); });
    [[w / 2], [-w / 2]].forEach(function (e) { wbox(x + e[0] - 0.09, x + e[0] + 0.09, 0.62, 0.7, z - d / 2 + 0.09, z + d / 2 - 0.09, troughMat, 1.4); });
    flat(w - 0.18, d - 0.18, soilMat, x, 0.64, z);
    var tufts = [], n = Math.round(w * d * 4);
    for (var q = 0; q < n; q++) { var sc = 0.5 + srand() * 0.45; tufts.push([x + (srand() - 0.5) * (w - 0.4), 0.63, z + (srand() - 0.5) * (d - 0.4), sc, sc * (0.8 + srand() * 0.6), sc, 0, srand() * 6, 0]); }
    var tm = inst(crossCard(0.8, 0.75), dryGrass, tufts); tm.userData.noCast = true;
    var cc = new THREE.Color(); tufts.forEach(function (_, k) { cc.setHSL(0.1 + srand() * 0.04, 0.35, 0.42 + srand() * 0.2); tm.setColorAt(k, cc); });
    deadShrub(x + (srand() - 0.5) * (w - 0.8), 0.64, z + (srand() - 0.5) * (d - 0.8), 1.4 + srand() * 0.5);
  }
  planter(-8.4, 146.4, 3.4, 1.4); planter(8.4, 146.4, 3.4, 1.4); planter(-9.6, 135.0, 1.4, 3.2); planter(9.0, 120.2, 2.6, 1.3);

  // the visitor map, just inside the gate on the left of the walk, and a fingerpost by the fountain
  WB.mapBoard(-6.2, 142.4, PI / 2);
  (function () {
    var G = new THREE.Group(); G.position.set(3.4, 0, 139.6); G.rotation.y = 0; scene.add(G);
    cyl(0.06, 0.07, 3.0, EM.green, 0, 1.5, 0, G, 10); cyl(0.1, 0.12, 0.12, EM.green, 0, 0.06, 0, G, 10); mesh(new THREE.SphereGeometry(0.075, 10, 6), M.gold, 0, 3.05, 0, G);
    [['TICKETS & PARK', 2.62, 'n'], ['GIFT SHOP', 2.24, 'e'], ['MAINTENANCE', 1.86, 'w']].forEach(function (f) {
      var w2 = 1.3, a = f[2] === 'e' ? 0 : f[2] === 'w' ? PI : PI / 2;
      var arm = new THREE.Group(); arm.position.set(0, f[1], 0); arm.rotation.y = a; G.add(arm);
      [false, true].forEach(function (back) {          // printed both sides: the back face has the arrow drawn the other way so both point along the arm
        var tex = canvasTex(512, function (g, S, H2) {
          g.save(); if (back) { g.translate(S, 0); g.scale(-1, 1); }
          g.fillStyle = '#254a30'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S - 60, 0); g.lineTo(S, H2 / 2); g.lineTo(S - 60, H2); g.lineTo(0, H2); g.closePath(); g.fill(); g.strokeStyle = '#d9ae35'; g.lineWidth = 6; g.stroke(); g.restore();
          g.fillStyle = '#ece3c4'; g.font = 'bold 54px ' + FONT; g.textBaseline = 'middle'; g.textAlign = back ? 'right' : 'left'; g.fillText(f[0], back ? S - 26 : 26, H2 / 2 + 3, S - 110);
          E.chips(g, S, H2, 14, '#16170f'); E.streaks(g, S, H2, 16, 'rgba(40,30,20,.8)', H2);
        }, 1, 1, true, 96);
        var pnl = mesh(new THREE.PlaneGeometry(w2, w2 * 96 / 512), std(0xffffff, 0.8, { map: tex, alphaTest: 0.3 }), w2 / 2 + 0.06, 0, back ? -0.006 : 0.006, arm);
        if (back) pnl.rotation.y = PI;
      });
      box(w2 - 0.12, w2 * 96 / 512 - 0.02, 0.01, EM.green, w2 / 2, 0, 0, arm);
    });
    circles.push({ x: 3.4, z: 139.6, r: 0.15 });
  })();

  // ---------- ticket lanes ----------
  /* Three ticket booths under one canopy, with a pair of tripod turnstiles in each gap between them.  Each lane is a metre
     wide between steel cabinets, with the turnstile's arm reaching right across it and guide rails out in front and behind,
     so there is no getting round one.  The lanes stay locked until the entry system is switched on from the staff computer.
     The booths are real kiosks a person works in: a door at the back, a counter under the ticket window, a stool and a till. */
  var TZ = TURN_Z, LANES = [-3.27, -2.33, 2.33, 3.27], HOUSE = [-3.74, -2.8, -1.86, 1.86, 2.8, 3.74];
  E.lanes = LANES;
  box(16.6, 0.2, 5.8, std(0x2c2e2f, 0.7, { map: roofTex, metalness: 0.4 }), 0, 3.3, TZ);                 // canopy deck
  box(16.9, 0.5, 0.1, EM.green, 0, 3.22, TZ + 2.95); box(16.9, 0.5, 0.1, EM.green, 0, 3.22, TZ - 2.95); box(0.1, 0.5, 5.9, EM.green, -8.4, 3.22, TZ); box(0.1, 0.5, 5.9, EM.green, 8.4, 3.22, TZ);
  mesh(new THREE.PlaneGeometry(9, 0.42), std(0xffffff, 0.75, { map: canvasTex(1024, function (g, S, H) { g.fillStyle = '#d8cfae'; g.fillRect(0, 0, S, H); g.fillStyle = '#254a30'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 36px ' + FONT; g.fillText('TICKETS  ·  ADMISSIONS  ·  PLEASE HAVE YOUR TICKET READY', S / 2, H / 2 + 2, S - 30); chips(g, S, H, 40, '#7d7664'); streaks(g, S, H, 40, 'rgba(60,44,22,.85)', H); }, 1, 1, true, 48) }), 0, 3.22, TZ + 3.005);
  [[-8.1, -2.6], [8.1, -2.6], [-8.1, 2.6], [8.1, 2.6]].forEach(function (c) { box(0.16, 3.2, 0.16, EM.iron, c[0], 1.6, TZ + c[1]); box(0.34, 0.08, 0.34, EM.iron, c[0], 0.04, TZ + c[1]); circles.push({ x: c[0], z: TZ + c[1], r: 0.18 }); });
  [-4, 0, 4].forEach(function (x) { box(1.3, 0.08, 0.28, EM.plastic, x, 3.16, TZ + 0.9); box(1.2, 0.02, 0.2, std(0x8a8d86, 0.5), x, 3.115, TZ + 0.9); });   // dead strip lights
  var boothWall = std(0xffffff, 0.84, { map: EM.cream.map.clone(), bumpMap: bump(2), bumpScale: 0.012 }); boothWall.map.repeat.set(1, 1); boothWall.map.needsUpdate = true;
  var boothSign = std(0xffffff, 0.75, { map: canvasTex(256, function (g, S, H) { g.fillStyle = '#254a30'; g.fillRect(0, 0, S, H); g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 40px ' + FONT; g.fillText('TICKETS', S / 2, H / 2 + 2); chips(g, S, H, 12, '#161714'); streaks(g, S, H, 10, 'rgba(60,44,22,.85)', H); }, 1, 1, true, 64) });
  var deskTop = std(0x4a3a2a, 0.6, { map: woodTex }), floorLino = std(0xffffff, 0.8, { map: canvasTex(128, function (g, S) { for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) { g.fillStyle = (a + b) % 2 ? '#4a4438' : '#6a6252'; g.fillRect(a * 32, b * 32, 32, 32); } g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#2a2620', '#7a7262'], 1500, 1.5)(g, S); g.globalAlpha = 1; grime(g, S, S, 1.3); }, 2, 2) });
  var crackTex = canvasTex(128, function (g, S) { g.clearRect(0, 0, S, S); g.strokeStyle = 'rgba(230,240,240,.9)'; g.lineWidth = 1; for (var q = 0; q < 14; q++) { var a = q / 14 * 6.283, r2 = 20 + Math.random() * 44; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * r2 * 0.5 + (Math.random() - 0.5) * 8, 64 + Math.sin(a) * r2 * 0.5); g.lineTo(64 + Math.cos(a) * r2, 64 + Math.sin(a) * r2); g.stroke(); } });
  function booth(bx, n) {
    var G = new THREE.Group(); G.position.set(bx, 0, TZ); scene.add(G); G.updateMatrixWorld(true);
    var W2 = 1.1, D2 = 1.2, T = 0.09, FL = 0.16, SILL = 1.02, TOP = 2.42;
    function wb(x1, x2, y1, y2, z1, z2, mat, tile) { var m = box(x2 - x1, y2 - y1, z2 - z1, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, G); worldUV(m, tile || 2); return m; }
    wb(-W2 - 0.05, W2 + 0.05, 0, FL, -D2 - 0.05, D2 + 0.05, EM.stone, 1.5);                                  // plinth
    flat(2 * W2 - 2 * T, 2 * D2 - 2 * T, floorLino, 0, FL + 0.003, 0, G);
    // lower walls (front and both sides) up to the sill; the back wall runs full height round a door
    wb(-W2, W2, FL, SILL, D2 - T, D2, boothWall); wb(-W2, -W2 + T, FL, SILL, -D2 + T, D2 - T, boothWall); wb(W2 - T, W2, FL, SILL, -D2 + T, D2 - T, boothWall);
    var DX1 = -0.18, DX2 = 0.66;
    wb(-W2, DX1, FL, TOP, -D2, -D2 + T, boothWall); wb(DX2, W2, FL, TOP, -D2, -D2 + T, boothWall); wb(DX1, DX2, 2.1, TOP, -D2, -D2 + T, boothWall);
    // sills, corner posts, header band, roof
    wb(-W2 - 0.03, W2 + 0.03, SILL, SILL + 0.05, D2 - T - 0.04, D2 + 0.03, EM.green, 1); wb(-W2 - 0.03, -W2 + T + 0.03, SILL, SILL + 0.05, -D2 + T, D2 - T, EM.green, 1); wb(W2 - T - 0.03, W2 + 0.03, SILL, SILL + 0.05, -D2 + T, D2 - T, EM.green, 1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { box(0.1, TOP - SILL, 0.1, EM.green, c[0] * (W2 - 0.05), (TOP + SILL) / 2, c[1] * (D2 - 0.05), G); });
    wb(-W2 - 0.02, W2 + 0.02, TOP, TOP + 0.18, -D2 - 0.02, D2 + 0.02, EM.green, 1);
    wb(-W2 - 0.18, W2 + 0.18, TOP + 0.18, TOP + 0.26, -D2 - 0.18, D2 + 0.18, std(0x2c2e2f, 0.7, { map: roofTex, metalness: 0.4 }), 1);
    mesh(new THREE.PlaneGeometry(1.7, 0.16), boothSign, 0, TOP + 0.09, D2 + 0.021, G);
    // glazing: front with a mullion each side of the ticket window, both sides in two panes
    function pane(w, h, x, y, z, ry) { var gp = mesh(new THREE.PlaneGeometry(w, h), EM.glassDirty, x, y, z, G); gp.rotation.y = ry || 0; gp.material.side = THREE.DoubleSide; gp.userData.noCast = true; return gp; }
    var GH = TOP - SILL - 0.05, GY = (TOP + SILL + 0.05) / 2;
    pane(2 * W2 - 0.2, GH, 0, GY, D2 - 0.045);
    [-0.42, 0.42].forEach(function (x) { box(0.05, GH, 0.06, EM.green, x, GY, D2 - 0.045, G); });
    [-1, 1].forEach(function (s2) { pane(2 * D2 - 0.2, GH, s2 * (W2 - 0.045), GY, 0, PI / 2); box(0.06, GH, 0.05, EM.green, s2 * (W2 - 0.045), GY, 0, G); });
    // the ticket window: speech grille, a deal tray let into the sill, a little shelf outside
    mesh(new THREE.CircleGeometry(0.075, 18), EM.steel, 0, 1.55, D2 - 0.04, G); mesh(new THREE.RingGeometry(0.075, 0.085, 18), EM.plastic, 0, 1.55, D2 - 0.039, G);
    box(0.36, 0.04, 0.3, EM.steel, 0, SILL + 0.02, D2 - 0.02, G); box(1.0, 0.035, 0.26, EM.steel, 0, SILL - 0.02, D2 + 0.12, G);
    [-0.4, 0.4].forEach(function (x) { box(0.03, 0.12, 0.2, EM.steel, x, SILL - 0.1, D2 + 0.1, G).rotation.x = 0.5; });
    if (n === 1) mesh(new THREE.PlaneGeometry(0.9, 0.9), basic(0xffffff, { transparent: true, opacity: 0.5, map: crackTex, depthWrite: false }), 0.32, 1.78, D2 - 0.04, G).userData.noCast = true;
    // the door: a steel leaf in a green frame, shut, a padlocked hasp on it
    var dw = DX2 - DX1;
    box(dw, 1.94, 0.045, std(0x34584a, 0.6, { metalness: 0.3, map: EM.green.map }), (DX1 + DX2) / 2, FL + 0.97, -D2 - 0.005, G);
    box(0.05, 1.98, 0.07, EM.green, DX1 + 0.025, FL + 0.99, -D2 - 0.01, G); box(0.05, 1.98, 0.07, EM.green, DX2 - 0.025, FL + 0.99, -D2 - 0.01, G); box(dw, 0.05, 0.07, EM.green, (DX1 + DX2) / 2, FL + 1.96, -D2 - 0.01, G);
    box(0.12, 0.03, 0.03, EM.steel, DX2 - 0.14, 1.08, -D2 - 0.04, G); box(0.05, 0.08, 0.02, M.gold, DX2 - 0.1, 0.98, -D2 - 0.045, G);
    mesh(new THREE.PlaneGeometry(0.3, 0.16), std(0xffffff, 0.8, { map: textTex(['STAFF ONLY'], 256, 120, '#d8cfae', '#8d1f18', '#8d1f18') }), (DX1 + DX2) / 2, 1.62, -D2 - 0.03, G).rotation.y = PI;
    // inside: the counter under the window, the till, a stool, a ticket roll, a calendar left at the last month the park opened
    box(2 * W2 - 2 * T, 0.04, 0.5, deskTop, 0, 0.98, D2 - T - 0.25, G); box(2 * W2 - 2 * T, 0.8, 0.03, EM.green, 0, 0.56, D2 - T - 0.49, G);
    var till = new THREE.Group(); till.position.set(-0.32, 1.0, D2 - 0.38); till.rotation.y = 0.2; G.add(till);
    box(0.34, 0.1, 0.32, EM.plastic, 0, 0.05, 0, till); var tf = box(0.3, 0.16, 0.04, EM.plastic, 0, 0.16, -0.1, till); tf.rotation.x = -0.4;
    mesh(new THREE.PlaneGeometry(0.26, 0.1), basic(0x0b140d), 0, 0.17, -0.078, till).rotation.x = -0.4;
    cyl(0.04, 0.04, 0.09, std(0xe9e2d0, 0.8), 0.3, 1.04, D2 - 0.3, G, 12).rotation.z = PI / 2;
    cyl(0.17, 0.17, 0.05, EM.rubber, 0.25, 0.7, D2 - 0.75, G, 14); cyl(0.025, 0.025, 0.52, EM.steel, 0.25, 0.42, D2 - 0.75, G, 6); cyl(0.2, 0.22, 0.03, EM.steel, 0.25, FL + 0.015, D2 - 0.75, G, 14);
    mesh(new THREE.PlaneGeometry(0.3, 0.4), std(0xffffff, 0.9, { map: textTex(['AUGUST', '2014'], 128, 170, '#efe9d6', '#8d1f18', null) }), -0.75, 1.75, -D2 + T + 0.005, G);
    boxes.push({ x1: bx - W2 - 0.05, x2: bx + W2 + 0.05, z1: TZ - D2 - 0.05, z2: TZ + D2 + 0.05, solid: true });
  }
  [-5.6, 0, 5.6].forEach(booth);
  /* ---------- the turnstiles: waist-high tripod units, two lanes either side of the middle booth ----------
     Each cabinet is brushed stainless with rounded ends on an anchored base; its lid is a black glass panel sloping to the
     entry end, with the ticket reader (a scanner window and a slot in a chrome bezel) and a lamp that shows a red cross or a
     green arrow.  The rotor head stands out of the cabinet's side into the lane on a 45-degree axis, so one of its three
     capped arms always lies level across the lane at hip height.  Fixed glass panels close the gaps to the booths. */
  var ledX = canvasTex(64, function (g, S) { g.fillStyle = '#060606'; g.fillRect(0, 0, S, S); g.strokeStyle = '#ff2a1a'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, 18); g.lineTo(46, 46); g.moveTo(46, 18); g.lineTo(18, 46); g.stroke(); });
  var ledGo = canvasTex(64, function (g, S) { g.fillStyle = '#060606'; g.fillRect(0, 0, S, S); g.strokeStyle = '#35ff8a'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(32, 50); g.lineTo(32, 16); g.moveTo(17, 30); g.lineTo(32, 15); g.lineTo(47, 30); g.stroke(); });
  var brushed = canvasTex(256, function (g, S) { g.fillStyle = '#b9bec1'; g.fillRect(0, 0, S, S); for (var q = 0; q < 900; q++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.09)' : 'rgba(40,44,48,.08)'; g.fillRect(Math.random() * S, 0, 1, S); } blotch(g, S, ['#8e9294', '#6d7173'], 8, 6, 40, 0.18); grime(g, S, S, 0.5); }, 1, 1);
  var cabSteel = std(0xffffff, 0.3, { metalness: 0.8, map: brushed, envMap: envTex, envMapIntensity: 0.35 }), CW = 0.32, CL = 1.16, CH = 0.98;
  var blackGlass = std(0x07090a, 0.12, { metalness: 0.3, envMap: envTex, envMapIntensity: 0.6 }), chrome = std(0xd8dcdf, 0.18, { metalness: 0.95, envMap: envTex, envMapIntensity: 0.8 });
  var bodyGeo = (function () {                       // the cabinet in plan, rounded at the four corners, extruded up
    var r = 0.06, w = CW / 2, l = CL / 2, sh = new THREE.Shape(); sh.moveTo(-w + r, -l); sh.lineTo(w - r, -l); sh.quadraticCurveTo(w, -l, w, -l + r); sh.lineTo(w, l - r); sh.quadraticCurveTo(w, l, w - r, l); sh.lineTo(-w + r, l); sh.quadraticCurveTo(-w, l, -w, l - r); sh.lineTo(-w, -l + r); sh.quadraticCurveTo(-w, -l, -w + r, -l);
    var gm = new THREE.ExtrudeGeometry(sh, { depth: CH - 0.12, bevelEnabled: false, curveSegments: 6 }); gm.rotateX(-PI / 2); gm.translate(0, 0.07, 0);
    var uv = gm.attributes.uv, pos = gm.attributes.position; for (var q = 0; q < uv.count; q++) uv.setXY(q, (pos.getX(q) + pos.getZ(q)) * 1.2, pos.getY(q) * 1.2);   // brushing runs up the sides
    return gm;
  })();
  E.laneLeds = [];
  HOUSE.forEach(function (hx) {
    var G = new THREE.Group(); G.position.set(hx, 0, TZ); scene.add(G);
    var body = new THREE.Mesh(bodyGeo, cabSteel); body.castShadow = body.receiveShadow = true; G.add(body);
    box(CW + 0.05, 0.07, CL + 0.05, EM.rubber, 0, 0.035, 0, G);                                                         // base plate
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { cyl(0.013, 0.013, 0.02, chrome, c[0] * (CW / 2 + 0.008), 0.08, c[1] * (CL / 2 + 0.008), G, 8); });   // anchor bolts
    // the lid: a chrome rim and a black glass top falling 4 degrees to the entry end
    var lid = new THREE.Group(); lid.position.set(0, CH - 0.05, 0); lid.rotation.x = 0.07; G.add(lid);
    box(CW + 0.012, 0.035, CL + 0.012, chrome, 0, 0.0, 0, lid); box(CW - 0.03, 0.006, CL - 0.03, blackGlass, 0, 0.019, 0, lid);
    mesh(new THREE.PlaneGeometry(CW - 0.12, 0.08), basic(0x140404, { fog: false }), 0, 0.0225, CL / 2 - 0.16, lid).rotation.x = -PI / 2;                    // the scanner window
    box(CW - 0.14, 0.008, 0.03, chrome, 0, 0.024, CL / 2 - 0.3, lid); box(CW - 0.17, 0.009, 0.006, basic(0x020202), 0, 0.027, CL / 2 - 0.3, lid);            // the ticket slot
    // the service door on each side, a lock in it; the maker's plate
    [-1, 1].forEach(function (sd) {
      var x = sd * (CW / 2 + 0.0008), seam = basic(0x2a2c2e);                                                          // the door's seams: [y, z, width, height]
      [[0.62, -0.3, 0.0035, 0.5], [0.62, 0.3, 0.0035, 0.5], [0.37, 0, 0.6, 0.0035], [0.87, 0, 0.6, 0.0035]].forEach(function (l) {
        var ln = mesh(new THREE.PlaneGeometry(l[2], l[3]), seam, x, l[0], l[1], G); ln.rotation.y = sd * PI / 2; ln.userData.noCast = true;
      });
      cyl(0.011, 0.011, 0.006, chrome, x + sd * 0.003, 0.68, 0.22, G, 10).rotation.z = PI / 2;
    });
    mesh(new THREE.PlaneGeometry(0.16, 0.035), std(0xffffff, 0.4, { metalness: 0.6, map: textTex(['FZ ACCESS · TRI-LANE 400'], 256, 56, '#c9cdcf', '#26292b', null, false) }), 0, 0.88, CL / 2 + 0.0008, G);
    boxes.push({ x1: hx - CW / 2, x2: hx + CW / 2, z1: TZ - CL / 2, z2: TZ + CL / 2 });
  });
  E.tripods = LANES.map(function (lx, n) {
    var cx = lx + 0.47, face = cx - CW / 2, led = basic(0x555555, { map: ledX, fog: false }); E.laneLeds.push(led);
    // the lamp on the entry end of the rotor's cabinet, set in a black bezel
    box(0.11, 0.11, 0.008, blackGlass, cx, 0.82, TZ + CL / 2 + 0.004); mesh(new THREE.PlaneGeometry(0.085, 0.085), led, cx, 0.82, TZ + CL / 2 + 0.0085);
    box(0.11, 0.11, 0.008, blackGlass, cx, 0.82, TZ - CL / 2 - 0.004); mesh(new THREE.PlaneGeometry(0.085, 0.085), led, cx, 0.82, TZ - CL / 2 - 0.0085).rotation.y = PI;
    // the rotor head: a housing out of the cabinet side on a 45-degree axis, a chrome bell over the hub, three capped arms
    var tilt = new THREE.Group(); tilt.position.set(face - 0.05, 0.86, TZ); tilt.rotation.z = PI * 0.75; scene.add(tilt);
    cyl(0.09, 0.1, 0.13, cabSteel, 0, -0.07, 0, tilt, 20); cyl(0.104, 0.104, 0.015, chrome, 0, -0.005, 0, tilt, 20);
    var spin = dyn(new THREE.Group()); tilt.add(spin);
    cyl(0.07, 0.085, 0.06, chrome, 0, 0.03, 0, spin, 20); mesh(new THREE.SphereGeometry(0.07, 18, 10, 0, PI * 2, 0, PI / 2), chrome, 0, 0.06, 0, spin);
    var AL = 0.5;
    for (var q = 0; q < 3; q++) {
      var arm = new THREE.Group(); arm.rotation.y = q * PI * 2 / 3; spin.add(arm);
      var ac = new THREE.Group(); ac.position.set(0.05, 0.035, 0); ac.rotation.z = -PI / 4; arm.add(ac);               // each arm leaves the hub on the 45-degree cone
      cyl(0.019, 0.019, AL, chrome, 0, AL / 2, 0, ac, 12); cyl(0.024, 0.024, 0.035, chrome, 0, 0.02, 0, ac, 12);
      mesh(new THREE.SphereGeometry(0.022, 12, 8), EM.rubber, 0, AL + 0.005, 0, ac);
    }
    var bx = { x1: lx - 0.31, x2: lx + 0.31, z1: TZ - 0.07, z2: TZ + 0.07 }; boxes.push(bx);
    return { x: lx, spin: spin, box: bx, ang: 0, target: 0, side: 0 };
  });
  W.laneBoxes = E.tripods.map(function (t) { return t.box; });
  // guide rails out in front of and behind the lanes, on the cabinets' lines: a brushed rail at hip height on posts
  HOUSE.forEach(function (hx) {
    [-1, 1].forEach(function (e) {
      var z0 = TZ + e * CL / 2, z1 = TZ + e * (CL / 2 + 1.1);
      cyl(0.024, 0.024, 1.1, cabSteel, hx, 0.92, (z0 + z1) / 2, null, 10).rotation.x = PI / 2; cyl(0.016, 0.016, 1.1, cabSteel, hx, 0.45, (z0 + z1) / 2, null, 8).rotation.x = PI / 2;
      cyl(0.03, 0.03, 0.92, cabSteel, hx, 0.46, z1, null, 12); mesh(new THREE.SphereGeometry(0.03, 12, 6, 0, PI * 2, 0, PI / 2), chrome, hx, 0.92, z1);
      cyl(0.05, 0.05, 0.012, chrome, hx, 0.006, z1, null, 12);
      boxes.push({ x1: hx - 0.04, x2: hx + 0.04, z1: Math.min(z0, z1), z2: Math.max(z0, z1) });
    });
  });
  // fixed glass panels between the outer cabinets and the booths (nobody squeezes past)
  [[1.15, 1.7], [3.9, 4.45]].forEach(function (g2) {
    [-1, 1].forEach(function (s2) {
      var xa = s2 * g2[0], xb = s2 * g2[1], xm = (xa + xb) / 2, w = Math.abs(xb - xa);
      box(w, 0.05, 0.05, cabSteel, xm, 1.02, TZ); box(w, 0.05, 0.05, cabSteel, xm, 0.1, TZ);
      [xa, xb].forEach(function (x) { cyl(0.025, 0.025, 1.05, cabSteel, x - s2 * 0.0, 0.53, TZ, null, 10); });
      var gp = mesh(new THREE.PlaneGeometry(w - 0.04, 0.86), EM.glassDirty, xm, 0.56, TZ); gp.material.side = THREE.DoubleSide; gp.userData.noCast = true;
      boxes.push({ x1: Math.min(xa, xb), x2: Math.max(xa, xb), z1: TZ - 0.06, z2: TZ + 0.06, solid: true });
    });
  });
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
    g.fillRect(-22, 124, 6, 6); g.fillRect(11, 121, 14, 14); g.fillRect(25, 131.4, 2.1, 1.6); g.fillRect(26.9, 126.85, 6.7, 8.7); g.fillStyle = '#2a2c28'; g.beginPath(); g.arc(0, 132, 2.7, 0, 7); g.fill();
  };

  // someone walking through an open lane pushes the tripod round a third of a turn
  E.pushLane = function (x, zOld, zNew) {
    if ((zOld - TZ) * (zNew - TZ) > 0) return;
    for (var n = 0; n < E.tripods.length; n++) { var t = E.tripods[n]; if (Math.abs(x - t.x) < 0.33 && t.box.off) { t.target += (zNew < zOld ? 1 : -1) * PI * 2 / 3; Sfx.play('turnstile', { vol: 0.7, fallback: function () { Sound.clunk(); Sound.click(); } }); } }
  };
  /* ---------- the plaza moving on its own: wind in the banners, dead leaves skittering over the paving, moths at the lamps ---------- */
  var leafN = 46, leafI = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.07), std(0xffffff, 0.95, { side: THREE.DoubleSide, map: canvasTex(64, function (g, S) { g.clearRect(0, 0, S, S); g.fillStyle = '#6d5226'; g.beginPath(); g.ellipse(32, 32, 28, 15, 0, 0, 7); g.fill(); g.strokeStyle = '#3f3018'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 32); g.lineTo(58, 32); g.stroke(); }), alphaTest: 0.4 }), leafN);
  leafI.frustumCulled = false; leafI.userData.noCast = true; scene.add(dyn(leafI));
  var leaves = [], lcol = new THREE.Color();
  for (i = 0; i < leafN; i++) { leaves.push({ x: -22 + Math.random() * 46, z: 117.5 + Math.random() * 30, y: 0.03, vx: 0, vz: 0, r: Math.random() * 6, spin: 0, hop: 0, k: 0.6 + Math.random() * 0.8 }); lcol.setHSL(0.07 + Math.random() * 0.05, 0.45, 0.22 + Math.random() * 0.18); leafI.setColorAt(i, lcol); }
  var moths = [], mothMat = new THREE.SpriteMaterial({ map: softTex('rgba(235,225,200,.95)', 'rgba(200,190,160,.35)'), transparent: true, depthWrite: false, opacity: 0 });
  [[-6.6, 139.5], [6.6, 139.5], [-6.6, 122.5], [6.6, 122.5]].forEach(function (p) { for (var q = 0; q < 3; q++) { var sp = dyn(new THREE.Sprite(mothMat)); sp.scale.set(0.035, 0.035, 1); sp.position.set(p[0], 4.5, p[1]); scene.add(sp); moths.push({ s: sp, x: p[0], z: p[1], a: Math.random() * 6, r: 0.25 + Math.random() * 0.25, sp: 3 + Math.random() * 4, y: Math.random() * 6 }); } });
  var windT = 0, gust = 0, gustT = 4, dm = new THREE.Object3D();
  E.ambient = function (dt) {
    windT += dt; gustT -= dt; if (gustT <= 0) { gustT = 5 + Math.random() * 9; gust = 1; if (player.z > 110) Sound.noise(1.6, 900, 0.035); }
    gust = Math.max(0, gust - dt * 0.45);
    var w = 0.35 + 0.25 * Math.sin(windT * 0.13) + gust * 1.1, wx = Math.cos(0.7 + Math.sin(windT * 0.05) * 0.5) * w, wz = Math.sin(0.7 + Math.sin(windT * 0.05) * 0.5) * w * 0.6;
    // banners: tied at the pole edge and along the arms; the free edge and the middle ripple
    for (var n = 0; n < E.banners.length; n++) {
      var bg = E.banners[n], pa = bg.attributes.position, base = bg.userData.base, ph = bg.userData.ph, sx2 = bg.userData.sx;
      for (var k = 0; k < pa.count; k++) {
        var x = base[k * 3], y = base[k * 3 + 1], u = clamp((x * sx2 + 0.28) / 0.56, 0, 1), v = (y + 0.625) / 1.25, f = u * (0.35 + 0.65 * Math.sin(v * PI)) * (0.4 + w * 0.7);
        pa.setZ(k, Math.sin(windT * 3.1 + u * 5 + v * 2.2 + ph) * 0.03 * f + Math.sin(windT * 5.3 + v * 7 + ph) * 0.008 * f);
      }
      pa.needsUpdate = true; bg.computeVertexNormals();
    }
    if (player.z < 100 && state === 'playing') return;                        // nobody here to see the rest
    for (n = 0; n < leafN; n++) {
      var L = leaves[n];
      L.vx = damp(L.vx, wx * L.k * (gust > 0.2 ? 2.2 : 0.8) + Math.sin(windT * 1.7 + n) * 0.15, 2, dt); L.vz = damp(L.vz, wz * L.k * (gust > 0.2 ? 2.2 : 0.8) + Math.cos(windT * 1.3 + n * 2) * 0.15, 2, dt);
      var moving = Math.hypot(L.vx, L.vz); L.x += L.vx * dt; L.z += L.vz * dt; L.spin = damp(L.spin, moving * 3, 3, dt); L.r += L.spin * dt;
      if (gust > 0.6 && Math.random() < dt * 0.6) L.hop = 0.5 + Math.random() * 0.5;
      L.hop = Math.max(0, L.hop - dt * 1.5); L.y = 0.032 + Math.sin(L.hop * PI) * 0.25 * L.hop;
      if (L.x > 25 || L.x < -24.5 || L.z > 148.5 || L.z < 117 || inBox(L.x, L.z, 0.05) || inRect(L.x, L.z, { x1: -3.2, x2: 3.2, z1: 128.8, z2: 135.2 })) { L.x = -24 + Math.random() * 2; L.z = 118 + Math.random() * 30; if (inBox(L.x, L.z, 0.1)) L.x = -18; }
      dm.position.set(L.x, L.y, L.z); dm.rotation.set(-PI / 2 + Math.sin(L.r) * 0.4 * (L.hop > 0 ? 1 : 0.2), 0, L.r); dm.updateMatrix(); leafI.setMatrixAt(n, dm.matrix);
    }
    leafI.instanceMatrix.needsUpdate = true;
    var lit = E.plazaBulbs.length && E.plazaBulbs[0].color.r > 0.5;
    mothMat.opacity = damp(mothMat.opacity, lit ? 0.85 : 0, 2, dt);
    if (mothMat.opacity > 0.01) moths.forEach(function (m) { m.a += dt * m.sp; m.y += dt * 2.3; m.s.position.set(m.x + Math.cos(m.a) * m.r + Math.sin(m.a * 3.1) * 0.05, 4.5 + Math.sin(m.y) * 0.18, m.z + Math.sin(m.a * 1.3) * m.r); });
  };
  E.step = function (dt, instant) {
    E.ambient(instant ? 0 : dt);
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
