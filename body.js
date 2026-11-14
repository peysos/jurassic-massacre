/* Jurassic Massacre — the rest of you.
   Normally you are a pair of hands.  For the moments when the rest of you comes into it (kicking a door in, hanging off a
   ledge, falling) there is a body under the camera: a khaki shirt with its pockets and placket, a belt, olive cargo trousers
   (a pocket on each thigh, a double layer over the knee, folds where the cloth gathers, bloused over the boots), and a pair
   of eight-inch ranger boots: a lugged rubber sole that follows the shape of a foot (heel block, waist, toe spring) with a
   stitched welt, a leather upper lofted from heel to toe, a polished toe cap and a heel counter sewn over it, a padded
   collar with a pull tab, and laces crossing up a tongue through brass eyelets and speed hooks.
   The body hangs from a root at the hips that turns with the body, not the head.
   Body.show(on), Body.pose(side, hip, knee, ankle, [abduct], [twist]), Body.place(x, hipY, z, yaw, [lean]), Body.torso(on).
   Angles in radians: hip + lifts the thigh forward, knee - folds the shin back under it, ankle + pulls the toes up. */
'use strict';

var Body = (function () {
  var B = {}, root = sleepWhenHidden(new THREE.Group()), THIGH = 0.46, SHIN = 0.44, V3 = THREE.Vector3;
  root.visible = false; root.userData.keep = true; root.rotation.order = 'YXZ'; scene.add(dyn(root)); B.root = root;
  // ---------- cloth and leather ----------
  var cargo = canvasTex(256, function (g, S) {                       // olive drill: a diagonal weave, faded on the creases, mud at random
    g.fillStyle = '#2e3620'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? 'rgba(22,28,14,.45)' : 'rgba(92,104,66,.24)'; g.lineWidth = 1; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    blotch(g, S, ['#232a16', '#46502f', '#1d2310', '#3a3320'], 30, 10, 60, 0.3);
    g.fillStyle = 'rgba(14,18,8,.6)'; g.fillRect(0, 0, 2.5, S); g.fillStyle = '#56603e'; for (var y = 3; y < S; y += 11) g.fillRect(5, y, 2, 6);                                    // the outside seam, double stitched
  }, 2, 4);
  var cargoN = normalTex(256, function (g, S) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? '#6c6c6c' : '#9a9a9a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    for (i = 0; i < 16; i++) { var y = Math.random() * S, sl = (Math.random() - 0.5) * 30, gr = g.createLinearGradient(0, y - 12, 0, y + 12); gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(0.45, 'rgba(30,30,30,.75)'); gr.addColorStop(0.72, 'rgba(220,220,220,.6)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.save(); g.translate(0, y); g.transform(1, sl / S, 0, 1, 0, 0); g.fillRect(0, -12, S, 24); g.restore(); }      // folds across the leg, a little skewed
  }, 3.2, 2, 4);
  var cloth = new THREE.MeshStandardMaterial({ map: cargo, normalMap: cargoN, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.94 });
  var shirt = Hands.clothMat || cloth;
  var leatherMap = canvasTex(256, function (g, S) { speckle('#2a2019', ['#1c1510', '#3a2c22', '#241b15', '#46362a'], 7000, 1.6)(g, S); blotch(g, S, ['#4a3a2c', '#120e0a'], 18, 6, 30, 0.35); g.strokeStyle = 'rgba(90,74,58,.4)'; for (var i = 0; i < 40; i++) { g.lineWidth = 0.7; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 14); g.stroke(); } g.fillStyle = 'rgba(110,96,74,.25)'; for (i = 0; i < 30; i++) g.fillRect(Math.random() * S, Math.random() * S, 6 + Math.random() * 20, 1); });
  var leather = std(0xffffff, 0.55, { map: leatherMap });
  var capLeather = std(0x8a8078, 0.32, { map: leatherMap });                                      // the toe cap and heel counter: smoother, polished
  var lugTex = canvasTex(128, function (g, S) {                      // the tread: chevron lugs on dark rubber, as a bump map (0.1 m to a repeat)
    g.fillStyle = '#202020'; g.fillRect(0, 0, S, S); g.fillStyle = '#e0e0e0';
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) { var x = c * 32 + (r % 2) * 16, y = r * 32; g.beginPath(); g.moveTo(x + 2, y + 6); g.lineTo(x + 14, y + 2); g.lineTo(x + 26, y + 6); g.lineTo(x + 26, y + 16); g.lineTo(x + 14, y + 12); g.lineTo(x + 2, y + 16); g.closePath(); g.fill(); }
  }, 1, 1, false);
  lugTex.wrapS = lugTex.wrapT = THREE.RepeatWrapping; lugTex.repeat.set(10, 10);
  var sole = std(0x111112, 0.92, { bumpMap: lugTex, bumpScale: 0.025 }), welt = std(0x3a2a1c, 0.75, { map: canvasTex(64, function (g, S) { g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, S, S); g.fillStyle = '#c8b48a'; for (var x = 0; x < S; x += 8) g.fillRect(x, S * 0.45, 5, S * 0.12); }, 40, 1) });
  var lace = std(0x3a2e1e, 0.85), eyelet = std(0xa08a4a, 0.35, { metalness: 0.9 }), buckle = std(0x9a8a5a, 0.35, { metalness: 0.9 }), beltM = std(0x2a1d14, 0.6, { bumpMap: bump(3), bumpScale: 0.004 });

  // ---------- a closed loft along z: sections [z, halfWidth, yTop, yBottom, x0] with a rounded-box cross-section ----------
  function loftZ(secs, seg, mat, parent, sq) {
    var pos = [], uv = [], idx = [], N = secs.length, i, j, e = 2 / (sq || 2.8), dz = secs[N - 1][0] > secs[0][0] ? 1 : -1;      // (dz: which way along z the sections run; the faces are wound to face out either way)
    for (i = 0; i < N; i++) {
      var s = secs[i], yc = (s[2] + s[3]) / 2, hh = (s[2] - s[3]) / 2;
      for (j = 0; j <= seg; j++) { var a = j / seg * PI * 2, ca = Math.cos(a), sa = Math.sin(a); pos.push((s[4] || 0) + s[1] * Math.sign(ca) * Math.pow(Math.abs(ca), e), yc + hh * Math.sign(sa) * Math.pow(Math.abs(sa), e), s[0]); uv.push(j / seg, i / (N - 1)); }
    }
    for (i = 0; i < N - 1; i++) for (j = 0; j < seg; j++) { var p = i * (seg + 1) + j, q = p + seg + 1; if (dz < 0) idx.push(p, q, p + 1, q, q + 1, p + 1); else idx.push(p, p + 1, q, q, p + 1, q + 1); }
    [[0, -dz], [N - 1, dz]].forEach(function (cp) {                    // a fan over each end, so nothing is open (cp[1]: the way the end faces, along z)
      var s = secs[cp[0]], c0 = pos.length / 3; pos.push(s[4] || 0, (s[2] + s[3]) / 2, s[0] + cp[1] * 0.004); uv.push(0.5, cp[0] ? 1 : 0);
      for (j = 0; j < seg; j++) { var p = cp[0] * (seg + 1) + j; if (cp[1] > 0) idx.push(c0, p, p + 1); else idx.push(c0, p + 1, p); }
    });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    var m = mesh(g, mat, 0, 0, 0, parent); m.castShadow = m.receiveShadow = true; return m;
  }
  /* cloth gathered into a band: a short ring (from y1 up to y2, radius r) whose surface waves round it in folds */
  function gathered(y1, y2, rx, rz, folds, depth, mat, parent, cz) {
    var pos = [], uv = [], idx = [], seg = 48, rows = 6, i, j, ph = Math.random() * 6;
    for (i = 0; i <= rows; i++) { var v = i / rows, bul = 1 + 0.12 * Math.sin(v * PI); for (j = 0; j <= seg; j++) { var a = j / seg * PI * 2, w = 1 + depth * (Math.sin(a * folds + ph) * 0.7 + Math.sin(a * folds * 2.3 + ph * 2) * 0.3) * Math.sin(v * PI); pos.push(Math.cos(a) * rx * bul * w, y1 + (y2 - y1) * v, (cz || 0) + Math.sin(a) * rz * bul * w); uv.push(j / seg * 2, v * 0.3); } }
    for (i = 0; i < rows; i++) for (j = 0; j < seg; j++) { var p = i * (seg + 1) + j, q = p + seg + 1; idx.push(p, p + 1, q, q, p + 1, q + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    var m = mesh(g, mat, 0, 0, 0, parent); m.castShadow = true; return m;
  }
  /* the sole's outline, a right foot seen from below (x out to the little-toe side for sd = +1), in metres, toe toward +s */
  var FOOT = [[-0.092, 0, 0], [-0.08, 0.03, 0.03], [-0.055, 0.041, 0.041], [-0.02, 0.044, 0.043], [0.02, 0.046, 0.036], [0.07, 0.05, 0.04], [0.12, 0.056, 0.052], [0.165, 0.057, 0.056], [0.2, 0.053, 0.053], [0.232, 0.042, 0.041], [0.252, 0.024, 0.022], [0.262, 0, 0]];
  function footShape(sd, s0, s1, grow) {
    var sh = new THREE.Shape(), pts = [], i;
    var o = FOOT.filter(function (f) { return f[0] >= s0 - 1e-6 && f[0] <= s1 + 1e-6; });
    for (i = 0; i < o.length; i++) pts.push(new THREE.Vector2(sd * (o[i][1] + grow), o[i][0]));
    for (i = o.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(-sd * (o[i][2] + grow), o[i][0]));
    sh.moveTo(pts[0].x, pts[0].y); sh.splineThru(pts.slice(1)); sh.closePath(); return sh;
  }
  function slab(sd, s0, s1, y0, th, mat, parent, grow, spring) {        // an extruded slab of the outline, lying flat, toe toward -z
    var geo = new THREE.ExtrudeGeometry(footShape(sd, s0, s1, grow || 0), { depth: th, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 5 });
    var P = geo.attributes.position; for (var i = 0; i < P.count; i++) { var s = P.getY(i), up = spring ? Math.pow(Math.max(0, s - 0.15) / 0.11, 2) * spring : 0; P.setXYZ(i, P.getX(i), y0 + P.getZ(i) + up, -s); }
    geo.computeVertexNormals(); var m = mesh(geo, mat, 0, 0, 0, parent); m.castShadow = m.receiveShadow = true; return m;
  }

  function leg(sd) {                                      // sd: +1 right, -1 left
    var hip = new THREE.Group(), knee = new THREE.Group(), ankle = new THREE.Group(), k;
    hip.position.set(sd * 0.1, 0, 0); hip.rotation.order = 'YXZ'; root.add(hip); knee.position.set(0, -THIGH, 0); hip.add(knee); ankle.position.set(0, -SHIN, 0); knee.add(ankle);
    // thigh: roomy cargo cloth, a bellows pocket low on the outside with a flap and two snaps
    tube([[0, 0.14, 0.004, 0.106, 0.112], [0, 0.0, 0.0, 0.103, 0.108], [0, -0.2, -0.006, 0.094, 0.098], [0, -THIGH + 0.06, -0.008, 0.083, 0.086], [0, -THIGH - 0.04, 0, 0.078, 0.08]], cloth, hip, 18, 5, new V3(1, 0, 0));
    var pk = loftZ([[-0.08, 0.004, -0.17, -0.37, sd * 0.098], [-0.075, 0.012, -0.16, -0.38, sd * 0.104], [0.075, 0.012, -0.16, -0.38, sd * 0.104], [0.08, 0.004, -0.17, -0.37, sd * 0.098]], 12, cloth, hip, 6); pk.scale.set(1, 1, 1);
    var fl = loftZ([[-0.084, 0.004, -0.15, -0.21, sd * 0.106], [0.084, 0.004, -0.15, -0.21, sd * 0.106]], 10, cloth, hip, 8); fl.rotation.z = sd * 0.02;
    [-0.045, 0.045].forEach(function (z) { mesh(new THREE.SphereGeometry(0.0075, 8, 6), eyelet, sd * 0.111, -0.195, z, hip); });
    var kn = mesh(new THREE.SphereGeometry(0.084, 16, 12), cloth, 0, 0, -0.004, knee); kn.scale.set(1, 1.06, 1.08);                       // the knee: cloth pulled over it
    var kp = loftZ([[-0.092, 0.07, 0.07, -0.08, 0], [-0.088, 0.075, 0.075, -0.085, 0]], 14, cloth, knee, 4); kp.position.z = 0.005;      // a double layer sewn on over the knee
    // shin: the trouser leg, loose, then bloused over the top of the boot
    tube([[0, 0.05, 0, 0.08, 0.082], [0, -0.1, 0.004, 0.077, 0.082], [0, -0.19, 0.008, 0.076, 0.08], [0, -0.215, 0.006, 0.08, 0.083]], cloth, knee, 18, 4, new V3(1, 0, 0));
    gathered(-0.262, -0.2, 0.084, 0.086, 9, 0.08, cloth, knee, 0.004);
    // the boot's shaft: eight inches of leather up the shin, a padded collar, a pull tab at the back
    tube([[0, -0.235, 0.004, 0.061, 0.064], [0, -0.3, 0.004, 0.057, 0.062], [0, -0.38, 0.006, 0.053, 0.06], [0, -SHIN, 0.01, 0.052, 0.062], [0, -SHIN - 0.03, 0.012, 0.055, 0.068]], leather, knee, 18, 4, new V3(1, 0, 0));
    var col = mesh(new THREE.TorusGeometry(0.062, 0.01, 8, 22), leather, 0, -0.238, 0.004, knee); col.rotation.x = PI / 2; col.scale.set(1, 1.05, 1);
    box(0.026, 0.05, 0.008, leather, 0, -0.222, 0.075, knee);                                                                         // pull tab
    // the tongue and the lacing up the front of the shaft: speed hooks at the top, eyelets below, the lace crossing between them
    box(0.034, 0.2, 0.008, leather, 0, -0.33, -0.066, knee).rotation.x = -0.04;
    for (k = 0; k < 7; k++) {
      var ly = -0.255 - k * 0.026, lz = -0.071 + k * 0.0004, hook = k < 3;
      [-1, 1].forEach(function (e) { var ey = hook ? mesh(new THREE.TorusGeometry(0.0055, 0.0018, 5, 10, PI * 1.3), eyelet, e * 0.026, ly, lz - 0.002, knee) : mesh(new THREE.TorusGeometry(0.0042, 0.0016, 5, 10), eyelet, e * 0.026, ly, lz - 0.001, knee); ey.rotation.set(0, hook ? e * PI / 2 : 0, hook ? -PI / 2 : 0); });
      if (k < 6) [-1, 1].forEach(function (e) { var lc = cyl(0.0022, 0.0022, Math.hypot(0.052, 0.026), lace, 0, ly - 0.013, lz - 0.0045, knee, 5); lc.rotation.set(0, 0, PI / 2 + e * Math.atan2(0.026, 0.052)); });
    }
    // the foot: one loft from the back of the heel to the toe, the toe cap and the heel counter sewn over it, and the lacing on the instep
    var FS = [[0.088, 0.018, -0.03, -0.086], [0.08, 0.034, -0.005, -0.09], [0.06, 0.041, 0.018, -0.092], [0.02, 0.043, 0.024, -0.092], [-0.03, 0.045, 0.008, -0.092], [-0.08, 0.049, -0.016, -0.092], [-0.12, 0.052, -0.032, -0.092], [-0.16, 0.053, -0.042, -0.09], [-0.195, 0.051, -0.048, -0.088], [-0.222, 0.046, -0.052, -0.086], [-0.242, 0.036, -0.058, -0.084], [-0.256, 0.018, -0.066, -0.082]];      // [z, half width, top, bottom]: a round, roomy toe box
    loftZ(FS, 24, leather, ankle, 2.6);
    loftZ(FS.slice(7).map(function (s) { return [s[0], s[1] + 0.0025, s[2] + 0.0025, s[3] - 0.001]; }), 24, capLeather, ankle, 2.6);                                        // the toe cap
    box(0.1, 0.004, 0.003, std(0x1a1410, 0.6), 0, -0.052, -0.158, ankle).rotation.x = -0.35;                                                                                     // its stitched edge
    loftZ(FS.slice(0, 3).map(function (s) { return [s[0], s[1] + 0.0025, Math.min(s[2], -0.035) + 0.002, s[3] - 0.001]; }).concat([[0.035, 0.0445, -0.04, -0.091]]), 20, capLeather, ankle, 2.4);   // the heel counter
    for (k = 0; k < 4; k++) { var iz = -0.02 - k * 0.026, iy = 0.016 - k * 0.012; [-1, 1].forEach(function (e) { mesh(new THREE.TorusGeometry(0.004, 0.0016, 5, 10), eyelet, e * 0.022, iy + 0.002, iz, ankle).rotation.x = PI / 2 - 0.4; }); if (k < 3) [-1, 1].forEach(function (e) { var lc = cyl(0.0021, 0.0021, 0.05, lace, 0, iy - 0.002, iz - 0.013, ankle, 5); lc.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(e * 0.044, -0.0108, -0.026).normalize()); }); }      // the lace crossing to the next pair down
    // the bottom of it: a welt with its stitching, the lugged sole with its toe spring, the heel block
    slab(sd, -0.092, 0.262, -0.095, 0.006, welt, ankle, 0.005, 0.01);
    slab(sd, -0.092, 0.262, -0.118, 0.021, sole, ankle, 0.003, 0.012);
    slab(sd, -0.092, 0.02, -0.142, 0.022, sole, ankle, 0.0);
    [hip, knee, ankle].forEach(function (g2) { g2.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); });
    return { hip: hip, knee: knee, ankle: ankle, sd: sd };
  }
  B.R = leg(1); B.L = leg(-1); B.THIGH = THIGH; B.SHIN = SHIN; B.HEEL = 0.144;

  /* ---------- above the legs: the seat of the trousers, the belt, the shirt ----------
     The shoulders sit where the hands' arms come from (a little under and behind the eyes); the eyes are about 0.7 m over the hips. */
  var top = B.top = new THREE.Group(); root.add(top);
  tube([[0, -0.1, 0.0, 0.15, 0.1], [0, 0.0, 0.0, 0.168, 0.112], [0, 0.1, 0.0, 0.168, 0.11], [0, 0.135, 0.0, 0.165, 0.108]], cloth, top, 22, 4, new V3(1, 0, 0));
  loftZ([[-0.11, 0.07, -0.02, -0.12, 0], [0.11, 0.07, -0.02, -0.12, 0]], 16, cloth, top, 2.2).position.y = 0.0;                           // the crotch, between the legs
  var belt = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.042, 32, 1, true), beltM); belt.scale.set(1, 1, 0.68); belt.position.y = 0.112; top.add(belt); belt.castShadow = true;
  box(0.056, 0.048, 0.012, buckle, 0, 0.112, -0.122, top); box(0.036, 0.03, 0.013, beltM, 0, 0.112, -0.1235, top);                        // the buckle, and the belt showing through its frame
  [-0.13, -0.06, 0.06, 0.13].forEach(function (x) { box(0.014, 0.05, 0.006, cloth, x, 0.112, -0.118 + Math.abs(x) * 0.12, top).rotation.y = -x * 2.2; });                      // belt loops
  tube([[0, 0.13, 0.0, 0.162, 0.108], [0, 0.2, -0.004, 0.172, 0.114], [0, 0.32, -0.008, 0.186, 0.122], [0, 0.4, -0.006, 0.188, 0.12], [0, 0.46, 0.0, 0.184, 0.116]], shirt, top, 22, 4, new V3(1, 0, 0));      // (stops at the chest: above that is where the eyes are)
  gathered(0.125, 0.16, 0.166, 0.112, 11, 0.05, shirt, top);                                                                             // where the shirt is tucked in
  var dome = mesh(new THREE.SphereGeometry(1, 24, 10, 0, PI * 2, 0, PI / 2), shirt, 0, 0.455, 0.0, top); dome.scale.set(0.184, 0.075, 0.116);       // the top of the chest and the shoulders, rounding over
  box(0.026, 0.32, 0.006, shirt, 0, 0.3, -0.124, top); for (var b = 0; b < 3; b++) mesh(new THREE.SphereGeometry(0.0055, 8, 6), std(0x3a3426, 0.5), 0, 0.19 + b * 0.1, -0.128, top);   // the placket, its buttons
  [-1, 1].forEach(function (sd2) {                                                                                                     // chest pockets with flaps, lying on the curve of the chest
    var pk2 = loftZ([[0.0, 0.048, 0.04, -0.055, 0], [-0.006, 0.046, 0.038, -0.053, 0]], 14, shirt, top, 5); pk2.position.set(sd2 * 0.085, 0.37, -0.106); pk2.rotation.y = -sd2 * 0.31;
    var fl2 = loftZ([[0.0, 0.051, 0.014, -0.014, 0], [-0.008, 0.049, 0.012, -0.012, 0]], 14, shirt, top, 6); fl2.position.set(sd2 * 0.085, 0.418, -0.11); fl2.rotation.y = -sd2 * 0.31;
  });
  top.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  B.show = function (on) { root.visible = !!on; };
  B.torso = function (on) { top.visible = !!on; };
  B.place = function (x, hipY, z, yaw, lean) { root.position.set(x, hipY, z); root.rotation.set(lean || 0, yaw, 0); };
  B.pose = function (side, hip, knee, ankle, abduct, twist) { var L = B[side]; L.hip.rotation.set(hip, twist || 0, (abduct || 0) * L.sd); L.knee.rotation.x = knee; L.ankle.rotation.x = ankle || 0; };
  /* Where the sole of a boot is, in the world (the ball of the foot, on the tread): for making a kick land on what it kicks;
     and where the heel's tread is (for standing a boot on a rung). */
  var bv = new V3();
  B.sole = function (side, out) { var a = B[side].ankle; a.updateWorldMatrix(true, false); return (out || bv).set(0, -0.121, -0.14).applyMatrix4(a.matrixWorld); };
  B.heel = function (side, out) { var a = B[side].ankle; a.updateWorldMatrix(true, false); return (out || bv).set(0, -0.144, 0.03).applyMatrix4(a.matrixWorld); };
  B.arch = function (side, out) { var a = B[side].ankle; a.updateWorldMatrix(true, false); return (out || bv).set(0, -0.121, -0.05).applyMatrix4(a.matrixWorld); };
  return B;
})();
