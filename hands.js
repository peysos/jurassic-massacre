/* Jurassic Massacre — hands: the player's gloved hands, the flashlight they hold, and everything those hands do.

   Each hand is one skinned mesh (palm, four fingers, thumb, glove cuff) lofted from elliptical rings and bound to a small
   skeleton, so the joints bend smoothly with no gaps.  The right hand carries the flashlight; the left does the work:
   wiping, swiping the staff card, flipping breakers, loading batteries.  Poses are plain arrays of joint angles, clips are
   lists of keyframes, and Hands.update() blends them with sway, bob and breathing every frame. */
'use strict';

var Hands = (function () {
  var H = { visible: true }, V = THREE.Vector3, Q = THREE.Quaternion;
  var lin = function (hex) { return new THREE.Color(hex).convertSRGBToLinear(); };

  // ---------- materials ----------
  var gloveMap = canvasTex(256, function (g, S) {                       // pale leather grain; vertex colours give each panel its hue
    g.fillStyle = '#e4e0d8'; g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#cfcac0', '#f4f1ea', '#bdb7ab', '#dedad0'], 5200, 1.5)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#a8a294', '#fffdf6'], 20, 8, 40, 0.16);
    [0, S / 2].forEach(function (x0) {                                   // a stitched seam down each side of every finger
      g.fillStyle = 'rgba(60,44,28,.55)'; g.fillRect(x0 + (x0 ? -2.5 : 0), 0, 2.5, S); if (!x0) g.fillRect(S - 2.5, 0, 2.5, S);
      g.fillStyle = '#efe6cf';
      for (var y = 3; y < S; y += 13) { g.fillRect(x0 ? x0 + 4.5 : 6.5, y, 2.2, 7); g.fillRect(x0 ? x0 - 9 : S - 9, y + 6, 2.2, 7); }
    });
  }, 1, 1);
  var gloveNormal = normalTex(256, function (g, S) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (var i = 0; i < 2600; i++) {                                     // pebbled grain
      var x = Math.random() * S, y = Math.random() * S, r = 1.5 + Math.random() * 3.2, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(210,210,210,.5)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = 'rgba(40,40,40,.5)'; g.lineWidth = 1;                // fine creases running round the finger
    for (i = 0; i < 26; i++) { var yy = Math.random() * S; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(S * 0.3, yy + (Math.random() - 0.5) * 9, S * 0.7, yy + (Math.random() - 0.5) * 9, S, yy); g.stroke(); }
    [0, S / 2].forEach(function (x0) { g.fillStyle = '#383838'; g.fillRect(x0 - 2, 0, 4, S); if (!x0) g.fillRect(S - 2, 0, 2, S); g.fillStyle = '#e8e8e8'; for (var y = 3; y < S; y += 13) { g.fillRect(x0 ? x0 + 4.5 : 6.5, y, 2.2, 7); g.fillRect(x0 ? x0 - 9 : S - 9, y + 6, 2.2, 7); } });
  }, 2.2, 1, 1);
  var gloveMat = new THREE.MeshStandardMaterial({ map: gloveMap, normalMap: gloveNormal, normalScale: new THREE.Vector2(0.75, 0.75), roughness: 0.74, vertexColors: true, skinning: true });
  var clothMap = canvasTex(256, function (g, S) {                        // khaki drill: a fine diagonal weave
    g.fillStyle = '#77704c'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? 'rgba(70,64,40,.35)' : 'rgba(170,160,116,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    blotch(g, S, ['#4e4a30', '#8f8760', '#3e3c28'], 26, 10, 60, 0.26);
  }, 2, 5);
  var clothNormal = normalTex(256, function (g, S) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? '#6a6a6a' : '#9c9c9c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    for (i = 0; i < 9; i++) { var y = Math.random() * S, gr = g.createLinearGradient(0, y - 9, 0, y + 9); gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(0.5, 'rgba(40,40,40,.7)'); gr.addColorStop(0.75, 'rgba(210,210,210,.55)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(0, y - 9, S, 18); }   // folds
  }, 2.5, 2, 5);
  var clothMat = new THREE.MeshStandardMaterial({ map: clothMap, normalMap: clothNormal, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.92 });
  var brass = std(0xb08d4a, 0.38, { metalness: 0.9 }), strapMat = std(0x3d2a1a, 0.6, { bumpMap: bump(3), bumpScale: 0.004 });

  // a small studio environment so the flashlight's metal has something to reflect (applied only to its materials)
  function metal(color, rough, extra) { var o = { metalness: 0.92, envMap: envTex, envMapIntensity: 0.55 }, k; if (extra) for (k in extra) o[k] = extra[k]; return std(color, rough, o); }

  // ---------- lofting skinned shapes ----------
  /* A shape is a run of rings.  Each ring: centre c, side axis ex, up axis ey, half-width a, half-height b, squareness n,
     bone weights, and a colour function of the angle round the ring.  Rings are joined into a tube and capped. */
  function Builder() { this.pos = []; this.uv = []; this.col = []; this.si = []; this.sw = []; this.idx = []; this.n = 0; this.lofts = []; }
  Builder.prototype.loft = function (rings, seg, capStart, capEnd) {
    var me = this, base = this.n, R = rings.length, i, j;
    function ring(r, scale, shift) {
      for (j = 0; j <= seg; j++) {
        var th = j / seg * PI * 2, cs = Math.cos(th), sn = Math.sin(th), e = 2 / (r.n || 2);
        var x = Math.sign(cs) * Math.pow(Math.abs(cs), e) * r.a * scale, y = Math.sign(sn) * Math.pow(Math.abs(sn), e) * r.b * scale * (sn < 0 && r.belly ? r.belly : 1);
        var p = r.c.clone().addScaledVector(r.ex, x).addScaledVector(r.ey, y); if (shift) p.addScaledVector(r.ez, shift);
        var c = r.color(th, sn);
        me.pos.push(p.x, p.y, p.z); me.uv.push(j / seg, r.v); me.col.push(c.r, c.g, c.b);
        me.si.push(r.bone[0], r.bone[1], 0, 0); me.sw.push(r.w, 1 - r.w, 0, 0); me.n++;
      }
    }
    var rows = [];
    if (capStart) [[0.02, -1], [0.5, -0.86], [0.86, -0.5]].forEach(function (k) { rows.push([rings[0], k[0], k[1] * capStart]); });
    for (i = 0; i < R; i++) rows.push([rings[i], 1, 0]);
    if (capEnd) [[0.86, 0.5], [0.5, 0.86], [0.02, 1]].forEach(function (k) { rows.push([rings[R - 1], k[0], k[1] * capEnd]); });
    rows.forEach(function (q) { ring(q[0], q[1], q[2]); });
    this.lofts.push([base, rows.length, seg]);
    for (i = 0; i < rows.length - 1; i++) for (j = 0; j < seg; j++) { var a = base + i * (seg + 1) + j, b = a + seg + 1; this.idx.push(a, b, a + 1, b, b + 1, a + 1); }
  };
  Builder.prototype.geometry = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx); g.computeVertexNormals();
    var nr = g.attributes.normal;                                         // weld the normals along each tube's seam
    this.lofts.forEach(function (lf) {
      for (var r = 0; r < lf[1]; r++) { var a = lf[0] + r * (lf[2] + 1), b = a + lf[2], x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1; nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l); }
    });
    return g;
  };

  // glove panels
  var C_BACK = lin(0xa58a62), C_PALM = lin(0x5e4028), C_TIP = lin(0x4a3220), C_CUFF = lin(0x6b6a45), C_PAD = lin(0x45301e), C_CREASE = lin(0x33221a);
  function panel(sn, tip, crease) {       // sn = sine of the angle round the ring: +1 back of the hand, -1 palm
    var t = sstep((sn + 0.28) / 0.5), c = C_PALM.clone().lerp(C_BACK, t);
    if (tip > 0) c.lerp(C_TIP, tip * (1 - t * 0.55));
    if (crease > 0) c.lerp(C_CREASE, crease * (1 - t) * 0.6);
    return c;
  }

  var FINGERS = [   // x, z of the knuckle; lengths of the three bones; base radius; rest splay (rad, + toward the little finger)
    { x: -0.0305, z: -0.0915, y: 0.001, L: [0.043, 0.026, 0.0235], r: 0.0108, sp: -0.075 },
    { x: -0.0090, z: -0.0975, y: 0.002, L: [0.047, 0.030, 0.0245], r: 0.0110, sp: -0.012 },
    { x: 0.0125, z: -0.0935, y: 0.001, L: [0.043, 0.028, 0.0235], r: 0.0105, sp: 0.055 },
    { x: 0.0315, z: -0.0845, y: -0.001, L: [0.033, 0.021, 0.0215], r: 0.0094, sp: 0.14 }
  ];
  var THUMB = { c: new V(-0.0265, -0.0075, -0.018), L: [0.041, 0.033, 0.028], rest: new THREE.Euler(-0.3, 0.86, 0.95, 'YXZ') };

  function buildHand(mirror) {
    var B = new Builder(), SEG = 14, X = new V(1, 0, 0), Y = new V(0, 1, 0), Z = new V(0, 0, 1), bones = [], i, k;
    function bone(parent, x, y, z) { var b = new THREE.Bone(); b.position.set(x, y, z); b.rotation.order = 'YXZ'; if (parent) parent.add(b); b.userData.index = bones.length; bones.push(b); return b; }
    var arm = bone(null, 0, 0, 0), hand = bone(arm, 0, 0, 0);
    // --- cuff and palm ---
    function pr(z, a, b, n, w, v, extra) {
      return { c: new V(extra && extra.x || 0, extra && extra.y || 0, z), ex: X, ey: Y, ez: Z.clone().negate(), a: a, b: b, n: n, bone: [arm.userData.index, hand.userData.index], w: w, v: v, belly: extra && extra.belly,
        color: function (th, sn) { if (extra && extra.cuff) return extra.strap ? C_PAD.clone() : C_CUFF.clone().lerp(C_PALM, sn < -0.3 ? 0.25 : 0); return panel(sn, 0, extra && extra.crease || 0); } };
    }
    B.loft([
      pr(0.072, 0.0375, 0.0300, 2.1, 1, 0, { cuff: 1 }), pr(0.070, 0.0400, 0.0325, 2.1, 1, 0.05, { cuff: 1 }), pr(0.064, 0.0405, 0.0330, 2.1, 1, 0.15, { cuff: 1 }),      // rolled edge
      pr(0.050, 0.0380, 0.0300, 2.15, 1, 0.5, { cuff: 1 }), pr(0.040, 0.0362, 0.0280, 2.2, 1, 0.8, { cuff: 1 }),
      pr(0.036, 0.0372, 0.0290, 2.2, 1, 0.9, { cuff: 1, strap: 1 }), pr(0.022, 0.0362, 0.0275, 2.2, 1, 1.25, { cuff: 1, strap: 1 }), pr(0.018, 0.0345, 0.0258, 2.2, 1, 1.35, { cuff: 1 }),   // strap band
      pr(0.008, 0.0325, 0.0232, 2.25, 0.8, 1.6, { crease: 0.5 }), pr(0.000, 0.0318, 0.0218, 2.3, 0.5, 1.8, { crease: 0.9 }), pr(-0.010, 0.0335, 0.0212, 2.4, 0.15, 2.05, { belly: 1.08 }),
      pr(-0.030, 0.0392, 0.0196, 2.55, 0, 2.55, { belly: 1.16 }), pr(-0.052, 0.0432, 0.0176, 2.7, 0, 3.1, { belly: 1.12 }), pr(-0.074, 0.0448, 0.0158, 2.8, 0, 3.65, { belly: 1.05 }),
      pr(-0.090, 0.0446, 0.0145, 2.8, 0, 4.05, { y: 0.0005 }), pr(-0.098, 0.0430, 0.0128, 2.6, 0, 4.25, { y: 0.001 })
    ], 22, 0, 0.0065);
    // padded strip across the knuckles
    var padRings = []; for (i = 0; i <= 8; i++) { var px = -0.039 + i * 0.0098, pz = -0.0915 - Math.sin(i / 8 * PI) * 0.007 + (i > 6 ? 0.004 : 0); padRings.push({ c: new V(px, 0.0135, pz), ex: Z, ey: Y, ez: X, a: 0.0085, b: 0.0048, n: 2.4, bone: [hand.userData.index, hand.userData.index], w: 1, v: i * 0.3, color: function () { return C_PAD.clone(); } }); }
    B.loft(padRings, 10, 0.004, 0.004);
    // --- fingers ---
    var F = FINGERS.map(function (f) {
      var dir = new V(Math.sin(f.sp), 0, -Math.cos(f.sp)), ex = new V(Math.cos(f.sp), 0, Math.sin(f.sp)), o = new V(f.x, f.y, f.z);
      var b0 = bone(hand, f.x, f.y, f.z); b0.rotation.y = -f.sp; var b1 = bone(b0, 0, 0, -f.L[0]), b2 = bone(b1, 0, 0, -f.L[1]);
      var J1 = f.L[0], J2 = J1 + f.L[1], T = J2 + f.L[2], r = f.r, rings = [];
      function at(s, rad, flat) {
        var w, ba, bb;
        if (s < J1 - 0.012) { ba = hand.userData.index; bb = b0.userData.index; w = 1 - sstep((s + 0.011) / 0.02); }
        else if (s < (J1 + J2) / 2) { ba = b0.userData.index; bb = b1.userData.index; w = 1 - sstep((s - J1 + 0.0065) / 0.013); }
        else { ba = b1.userData.index; bb = b2.userData.index; w = 1 - sstep((s - J2 + 0.006) / 0.012); }
        var tip = sstep((s - J2 - 0.004) / 0.008), cr = Math.max(0, 1 - Math.abs(s - J1) / 0.0045, 1 - Math.abs(s - J2) / 0.004, 1 - Math.abs(s) / 0.006);
        rings.push({ c: o.clone().addScaledVector(dir, s), ex: ex, ey: Y, ez: dir, a: rad, b: rad * (flat || 0.93), n: 2.12, bone: [ba, bb], w: w, v: s / 0.034, belly: 1.06,
          color: function (th, sn) { return panel(sn, tip, cr); } });
      }
      at(-0.016, r * 1.0); at(-0.008, r * 1.04); at(0, r * 1.06); at(0.008, r * 1.0); at(J1 * 0.5, r * 0.97); at(J1 - 0.008, r * 0.965);
      at(J1 - 0.003, r * 1.0); at(J1 + 0.003, r * 0.99); at(J1 + 0.009, r * 0.93); at((J1 + J2) / 2, r * 0.91); at(J2 - 0.007, r * 0.9);
      at(J2 - 0.002, r * 0.925); at(J2 + 0.003, r * 0.91); at(J2 + 0.009, r * 0.875); at(J2 + f.L[2] * 0.62, r * 0.84, 0.9); at(T - r * 0.62, r * 0.76, 0.86);
      B.loft(rings, SEG, 0, r * 0.62);
      return [b0, b1, b2];
    });
    // --- thumb ---
    var tq = new Q().setFromEuler(THUMB.rest), tdir = new V(0, 0, -1).applyQuaternion(tq), tex = new V(1, 0, 0).applyQuaternion(tq), tey = new V(0, 1, 0).applyQuaternion(tq);
    var t0 = bone(hand, THUMB.c.x, THUMB.c.y, THUMB.c.z); t0.userData.rest = tq.clone(); t0.quaternion.copy(tq);
    var t1 = bone(t0, 0, 0, -THUMB.L[0]), t2 = bone(t1, 0, 0, -THUMB.L[1]);
    (function () {
      var J1 = THUMB.L[0], J2 = J1 + THUMB.L[1], T = J2 + THUMB.L[2], rings = [];
      function at(s, rad, flat) {
        var w, ba, bb;
        if (s < J1 - 0.012) { ba = hand.userData.index; bb = t0.userData.index; w = 1 - sstep((s + 0.016) / 0.03); }
        else if (s < (J1 + J2) / 2) { ba = t0.userData.index; bb = t1.userData.index; w = 1 - sstep((s - J1 + 0.007) / 0.014); }
        else { ba = t1.userData.index; bb = t2.userData.index; w = 1 - sstep((s - J2 + 0.006) / 0.012); }
        var tip = sstep((s - J2 - 0.004) / 0.008), cr = Math.max(0, 1 - Math.abs(s - J1) / 0.005, 1 - Math.abs(s - J2) / 0.0045);
        rings.push({ c: THUMB.c.clone().addScaledVector(tdir, s), ex: tex, ey: tey, ez: tdir, a: rad, b: rad * (flat || 0.92), n: 2.12, bone: [ba, bb], w: w, v: s / 0.034, belly: 1.05,
          color: function (th, sn) { return panel(sn, tip, cr); } });
      }
      at(-0.02, 0.0150); at(-0.01, 0.0172); at(0, 0.0178); at(0.012, 0.0166); at(0.026, 0.0146); at(J1 - 0.006, 0.0128);
      at(J1, 0.0131); at(J1 + 0.007, 0.0124); at((J1 + J2) / 2, 0.0118); at(J2 - 0.006, 0.0115); at(J2, 0.0119); at(J2 + 0.007, 0.0114); at(J2 + THUMB.L[2] * 0.6, 0.0108, 0.86); at(T - 0.0068, 0.0096, 0.8);
      B.loft(rings, SEG, 0.012, 0.0068);
    })();
    var geo = B.geometry();
    var mesh = new THREE.SkinnedMesh(geo, gloveMat); mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
    var root = new THREE.Group(); root.add(mesh); mesh.add(arm); mesh.bind(new THREE.Skeleton(bones));
    // sleeve, strap buckle
    // the forearm's sleeve runs back to the elbow (FORE metres); the upper arm is a separate piece posed from the shoulder each frame
    var sleeve = tube([[0, 0.001, 0.058, 0.0375, 0.0300], [0, 0.001, 0.066, 0.0420, 0.0345], [0, 0.0, 0.080, 0.0440, 0.0365], [0, -0.001, 0.110, 0.0428, 0.0352], [0, -0.002, 0.17, 0.0450, 0.0385], [0, -0.002, 0.23, 0.0485, 0.0425], [0, 0, 0.262, 0.0500, 0.0450], [0, 0, 0.275, 0.040, 0.036], [0, 0, 0.28, 0.01, 0.01]], clothMat, arm, 18, 4);
    box(0.014, 0.004, 0.012, brass, 0.004, 0.0292, 0.029, arm); mesh2(new THREE.SphereGeometry(0.0042, 10, 8), brass, 0.004, 0.0318, 0.029, arm);
    box(0.02, 0.0016, 0.03, strapMat, -0.012, 0.0286, 0.029, arm).rotation.y = 0.0;
    cyl(0.0042, 0.0042, 0.002, brass, 0.02, 0.0365, 0.083, arm, 10);                                                 // sleeve button
    if (mirror) root.scale.x = -1;
    return { root: root, mesh: mesh, arm: arm, hand: hand, F: F, T: [t0, t1, t2], mirror: !!mirror, pose: null };
  }
  function mesh2(geo, mat, x, y, z, parent) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); m.castShadow = true; return m; }

  /* A pose is 21 angles: thumb [swing across the palm, lift away from it, twist, knuckle, tip], then for index, middle, ring
     and little finger [knuckle, middle joint, end joint], then the four splays. */
  function applyPose(h, p) {
    var e = new THREE.Euler(-p[1], p[0], p[2], 'YXZ');
    h.T[0].quaternion.copy(h.T[0].userData.rest).multiply(new Q().setFromEuler(e)); h.T[1].rotation.x = -p[3]; h.T[2].rotation.x = -p[4];
    for (var f = 0; f < 4; f++) { var b = h.F[f]; b[0].rotation.x = -p[5 + f * 3]; b[0].rotation.y = -FINGERS[f].sp - p[17 + f]; b[1].rotation.x = -p[6 + f * 3]; b[2].rotation.x = -p[7 + f * 3]; }
    h.pose = p;
  }
  var POSE = {
    flat:  [0, 0, 0, 0.05, 0.05,   0.04, 0.06, 0.04,  0.04, 0.06, 0.04,  0.05, 0.07, 0.05,  0.07, 0.1, 0.06,   0, 0, 0, 0],
    relax: [0.15, -0.1, 0, 0.2, 0.25,  0.3, 0.45, 0.3,  0.38, 0.55, 0.35,  0.46, 0.62, 0.4,  0.52, 0.66, 0.42,   0, 0, 0, 0],
    grip:  [0.1, 0.1, 0, 0.25, 0.35,  0.8, 1.25, 0.7,  1.25, 1.5, 0.85,  1.4, 1.55, 0.9,  1.5, 1.55, 0.9,   0.02, 0, 0, -0.04]
  };

  /* Curl the four fingers round a bar (a point on its axis, its direction and radius, in hand space), as far as each can
     reach: every finger bone is laid tangent to the bar where its own plane cuts it.  Returns the 12 finger angles. */
  var CURL_MAX = [1.55, 1.75, 1.15];
  function wrapFingers(P0, dir, rb) {
    var out = [];
    FINGERS.forEach(function (f) {
      var fd = new V(Math.sin(f.sp), 0, -Math.cos(f.sp)), n = new V(Math.cos(f.sp), 0, Math.sin(f.sp)), o = new V(f.x, f.y, f.z);
      var gn = dir.dot(n), t = Math.abs(gn) > 0.05 ? o.clone().sub(P0).dot(n) / gn : 0, C = P0.clone().addScaledVector(dir, t).sub(o);
      var cu = C.dot(fd), cv = -C.y, R = rb * (0.5 + 0.5 / Math.max(0.35, Math.abs(gn))) + f.r * 0.86, px = 0, py = 0, ang = 0;
      for (var k = 0; k < 3; k++) {
        var dx = cu - px, dy = cv - py, D = Math.hypot(dx, dy), beta = Math.atan2(dy, dx), curl;
        if (D <= R * 1.02) curl = k ? 0.9 : 0.6;
        else {
          var gam = Math.asin(R / D), c1 = angDiff(beta - gam, ang), c2 = angDiff(beta + gam, ang);
          curl = k === 0 ? c1 : (c1 > 0.03 && c1 < 2.6 ? c1 : (Math.abs(c1) <= 0.03 ? 0 : c2));
        }
        curl = clamp(curl, k ? 0.05 : 0.0, CURL_MAX[k]); ang += curl; out.push(curl);
        px += Math.cos(ang) * f.L[k]; py += Math.sin(ang) * f.L[k];
      }
    });
    return out;
  }
  H.wrapFingers = wrapFingers;

  // ---------- the flashlight ----------
  function buildFlashlight() {
    var G = new THREE.Group(), body = metal(0x1b1c1f, 0.44, { normalMap: normalTex(64, function (g, S) { g.fillStyle = '#404040'; g.fillRect(0, 0, S, S); g.strokeStyle = '#e0e0e0'; g.lineWidth = 2.2; for (var i = -S; i < S * 2; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.moveTo(i, 0); g.lineTo(i - S, S); g.stroke(); } }, 2.6, 14, 6), normalScale: new THREE.Vector2(0.9, 0.9) });
    var smooth = metal(0x1e1f22, 0.34), accent = metal(0x8a3a1c, 0.3);
    function lathe(pts, mat, seg) { var m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 28), mat); m.rotation.x = -PI / 2; m.castShadow = true; G.add(m); return m; }   // lathe axis (y) laid along -z
    // z = 0 is the tail, the lens is at z = -0.158
    /* The tail is a flip-top breech.  A knurled locking ring turns a quarter to free the lid, which then springs open on a
       hinge at the rim and stands out sideways, clear of the bore: the cell loads from the tail.  Under the lid are the
       bore, its rim and the contact spring.  (capPivot is put on the rim by fitHinge() below, once the grip is known.) */
    var capPivot = new THREE.Group(); G.add(capPivot); var capG = new THREE.Group(); capPivot.add(capG); var ring = new THREE.Group(); capG.add(ring);
    G.userData.cap = capG; G.userData.capPivot = capPivot; G.userData.ring = ring;
    var capMesh = lathe([[0.0001, 0], [0.0118, 0], [0.0142, 0.002], [0.0146, 0.004], [0.0146, 0.021], [0.0136, 0.023]], body); ring.add(capMesh);
    var bore = std(0x0a0a0b, 0.55, { metalness: 0.7, side: THREE.BackSide }), boreIn = std(0x0a0a0b, 0.6, { metalness: 0.6 }), white = std(0xd8d4c8, 0.6);
    function inG(m, parent) { m.castShadow = false; parent.add(m); return m; }
    var b1 = inG(new THREE.Mesh(new THREE.CylinderGeometry(0.0127, 0.0127, 0.07, 22, 1, true), bore), G); b1.rotation.x = PI / 2; b1.position.z = -0.058;                 // the bore
    inG(new THREE.Mesh(new THREE.RingGeometry(0.0127, 0.0137, 24), smooth), G).position.z = -0.02295;                                                               // its rim
    var b2 = inG(new THREE.Mesh(new THREE.CircleGeometry(0.0127, 18), boreIn), G); b2.position.z = -0.093;
    [0, 2.1, 4.2].forEach(function (a) { var lug = inG(new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0012, 0.0022), smooth), G); lug.position.set(Math.cos(a) * 0.0131, Math.sin(a) * 0.0131, -0.0218); lug.rotation.z = a + PI / 2; });   // bayonet lugs
    var c1 = inG(new THREE.Mesh(new THREE.CylinderGeometry(0.0128, 0.0128, 0.019, 22, 1, true), bore), capG); c1.rotation.x = PI / 2; c1.position.z = -0.0135;            // inside the lid
    var c2 = inG(new THREE.Mesh(new THREE.CircleGeometry(0.0128, 18), boreIn), capG); c2.position.z = -0.004; c2.rotation.y = PI;
    var c3 = inG(new THREE.Mesh(new THREE.RingGeometry(0.0128, 0.0137, 24), std(0x1d1e21, 0.7, { metalness: 0.3 })), capG); c3.position.z = -0.02305; c3.rotation.y = PI;
    var sp = []; for (var q = 0; q <= 44; q++) { var st = q / 44, sa = st * PI * 2 * 3.5, sr = 0.0038 + st * 0.0042; sp.push(new THREE.Vector3(Math.cos(sa) * sr, Math.sin(sa) * sr, -0.0045 - st * 0.0125)); }
    inG(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 88, 0.00055, 5), metal(0xc9a13a, 0.3)), capG);                                       // the contact spring
    inG(new THREE.Mesh(new THREE.BoxGeometry(0.0014, 0.0005, 0.008), white), ring).position.set(0, 0.01463, -0.011);                                                // lock mark on the ring...
    inG(new THREE.Mesh(new THREE.BoxGeometry(0.0014, 0.0005, 0.004), white), G).position.set(0, 0.01345, -0.0262);                                                  // ...and the one it lines up with
    lathe([[0.0136, 0.023], [0.0128, 0.0245], [0.0128, 0.026], [0.0134, 0.027], [0.0134, 0.094], [0.0128, 0.0955]], body);                          // grip
    lathe([[0.0128, 0.0955], [0.0139, 0.097], [0.0139, 0.101], [0.0128, 0.1025]], accent);                                                           // anodised ring
    lathe([[0.0128, 0.1025], [0.0132, 0.104], [0.0132, 0.117], [0.0150, 0.121], [0.0186, 0.129], [0.0196, 0.131], [0.0196, 0.1345], [0.0190, 0.1352], [0.0190, 0.1372], [0.0196, 0.1379], [0.0196, 0.1414], [0.0190, 0.1421], [0.0190, 0.1441], [0.0196, 0.1448], [0.0196, 0.1555], [0.0188, 0.158], [0.0176, 0.1585], [0.0170, 0.156]], smooth);   // neck, flare and finned head
    lathe([[0.0170, 0.1565], [0.0100, 0.147], [0.0040, 0.143], [0.0001, 0.1428]], metal(0xdfe3e6, 0.12, { envMapIntensity: 1.2, side: THREE.DoubleSide }), 20);   // reflector
    H.lensMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.35, fog: false });
    var lens = new THREE.Mesh(new THREE.CircleGeometry(0.0171, 24), H.lensMat); lens.position.z = -0.1572; lens.rotation.y = PI; G.add(lens);
    H.ledMat = new THREE.MeshBasicMaterial({ color: 0x6a5a20, fog: false }); var led = new THREE.Mesh(new THREE.CircleGeometry(0.0032, 10), H.ledMat); led.position.z = -0.1432; led.rotation.y = PI; G.add(led);
    H.flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(255,244,214,1)', 'rgba(255,230,170,.3)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
    H.flare.position.z = -0.159; H.flare.scale.set(0.11, 0.11, 1); G.add(H.flare);
    // switch on the neck (under the thumb), tail button, pocket clip, lanyard ring
    box(0.0105, 0.0022, 0.016, smooth, 0, 0.0134, -0.111, G); H.button = box(0.0072, 0.0026, 0.011, std(0x0d0d0e, 0.85), 0, 0.0152, -0.111, G); H.button.castShadow = false;
    cyl(0.0082, 0.0076, 0.004, std(0x0d0d0e, 0.85), 0, 0, 0.002, capG, 12).rotation.x = PI / 2;
    box(0.0058, 0.0009, 0.05, metal(0x9aa0a4, 0.3), 0, -0.0147, -0.05, G); box(0.0058, 0.003, 0.004, metal(0x9aa0a4, 0.3), 0, -0.0138, -0.026, G);
    var lany = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0008, 6, 14), metal(0x9aa0a4, 0.3)); lany.position.set(0.0125, -0.007, -0.004); lany.rotation.y = PI / 2; capG.add(lany);      // (on the lid: it swings with it)
    return G;
  }

  // ---------- rig ----------
  var rig = new THREE.Group(); camera.add(rig); H.rig = rig;
  var R = buildHand(false), L = buildHand(true); rig.add(R.root); rig.add(L.root); H.R = R; H.L = L;
  var torch = buildFlashlight(); R.hand.add(torch); H.torch = torch; var tailCap = torch.userData.cap;
  /* The arms.  Each forearm (wrist to elbow, FORE m) is rigid and part of the hand's rig; the elbow is found by two-bone IK
     from the shoulder, and the upper arm is a sleeve posed from the elbow back to the shoulder (behind the near plane), so a
     hand always has an arm attached to it however far it reaches. */
  var FORE = 0.262, UPPER = 0.3, SHO = { L: new V(-0.19, -0.27, 0.06), R: new V(0.19, -0.27, 0.06) }, POLE = { L: new V(-0.6, -1, 0.2).normalize(), R: new V(0.6, -1, 0.2).normalize() };
  function upperArm() {
    var g = new THREE.Group(); rig.add(g);
    var m = tube([[0, 0, -0.02, 0.046, 0.042], [0, 0, 0.02, 0.05, 0.046], [0, 0, 0.3, 0.056, 0.052], [0, 0, 0.62, 0.066, 0.06], [0, 0, 1.0, 0.07, 0.064]], clothMat, g, 16, 3);
    m.castShadow = true; var el = mesh2(new THREE.SphereGeometry(0.049, 14, 10), clothMat, 0, 0, 0, g); el.scale.set(1, 0.92, 1.05);
    g.userData.tube = m; return g;
  }
  var UA = { L: upperArm(), R: upperArm() };
  /* How the flashlight lies in the right hand.  PHI is the angle between the barrel and the straight fingers (the head leaves
     the hand on the thumb side); the barrel runs under the knuckle of the index finger, which meets it IDX metres from the tail. */
  var PHI = 1.05, IDX = 0.08, RB = 0.0147, GRIP_DIR = new V(), WRIST = new THREE.Euler(0.12, -1.0, 0, 'YXZ'), GRIP_P = new V();
  H.setGrip = function (phi, idx, zb, yb) {
    PHI = phi; IDX = idx; GRIP_DIR.set(-Math.sin(phi), 0, -Math.cos(phi));
    GRIP_P.set(FINGERS[0].x, yb === undefined ? -0.034 : yb, zb === undefined ? -0.082 : zb);
    var z = GRIP_DIR.clone().negate(), y = new V(0, 1, 0), x = new V().crossVectors(y, z).normalize();                 // torch space: -z is the beam
    torch.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); torch.scale.setScalar(1.1);
    torch.position.copy(GRIP_P).addScaledVector(GRIP_DIR, -idx);
    var w = wrapFingers(GRIP_P, GRIP_DIR, RB), g = POSE.grip; for (var k = 0; k < 12; k++) g[5 + k] = w[k];
    return w.map(function (v) { return +v.toFixed(2); });
  };
  H.setGrip(PHI, IDX);
  // the light itself rides in the head of the torch
  torch.add(flashlight); flashlight.position.set(0, 0, -0.15); torch.add(flashlight.target); flashlight.target.position.set(0, 0, -1.15);
  flashlight.angle = 0.6; flashlight.penumbra = 1; flashlight.distance = 70; flashlight.decay = 1.1; flashlight.shadow.camera.near = 0.3;
  H.fill = new THREE.PointLight(0xffe9c4, 0, 1.6, 1.6); H.fill.position.set(0.06, -0.06, -0.28); camera.add(H.fill);

  // ---------- where the hands are (camera space) ----------
  /* The forearm's rotation that points the torch along `aim` with the back of the hand toward `back` (both in camera space).
     The wrist's own bend is carried by the hand bone, so it is taken out here. */
  function holdQuat(aim, back) {
    var a = aim.clone().normalize(), b = back.clone(); b.addScaledVector(a, -b.dot(a)).normalize();
    var c = new V().crossVectors(a, b), d = GRIP_DIR.clone(), e = new V(0, 1, 0), f = new V().crossVectors(d, e);
    var A = new THREE.Matrix4().makeBasis(a, b, c), D = new THREE.Matrix4().makeBasis(d, e, f);
    return new Q().setFromRotationMatrix(A.multiply(D.transpose())).multiply(new Q().setFromEuler(WRIST).invert());
  }
  H.holdQuat = holdQuat;
  H.WRIST = WRIST;
  var HOLD = { pos: new V(0.18, -0.185, -0.34), q: holdQuat(new V(-0.03, 0.03, -1), new V(0.8, -0.6, 0)) };
  R.root.position.copy(HOLD.pos); R.root.quaternion.copy(HOLD.q); R.hand.rotation.copy(WRIST); applyPose(R, POSE.grip);

  // ---------- things the hands hold ----------
  /* A VOLTA alkaline C cell, lying along z (button end toward -z); 50 mm long.  Gold-yellow gloss wrap (the colour of the
     flashlight's charge bars), a black band round the + end, the spark bolt in a black roundel, and the brand running along
     the length so it reads from above, printed twice round the cell.  Crimped steel ends, the + nub.  `glow` (pickups in the
     world) lets the spark and the band's pinstripe give off a faint warm light. */
  var batWrapMap = null, batGlowMap = null, batNormal = null;
  function batteryMaps() {
    if (batWrapMap) return;
    var W2 = 512, H2 = 316, BAND = 0.24;                           // canvas: x runs round the cell (72 mm), y along it (44.5 mm: square pixels); top = the flat - end, bottom = the + end
    function bolt(g, cx, cy, s) {                                    // the spark: a lightning bolt pointing along the cell, toward the + end
      g.beginPath(); g.moveTo(cx + 0.18 * s, cy - 0.5 * s); g.lineTo(cx - 0.3 * s, cy + 0.06 * s); g.lineTo(cx - 0.02 * s, cy + 0.06 * s); g.lineTo(cx - 0.2 * s, cy + 0.5 * s);
      g.lineTo(cx + 0.32 * s, cy - 0.1 * s); g.lineTo(cx + 0.04 * s, cy - 0.1 * s); g.lineTo(cx + 0.22 * s, cy - 0.5 * s); g.closePath();
    }
    function along(g, x, y, fn) { g.save(); g.translate(x, y); g.rotate(-PI / 2); fn(); g.restore(); }    // text running along the cell
    batWrapMap = canvasTex(W2, function (g) {
      var gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#f6cf43'); gr.addColorStop(0.5, '#efbd2c'); gr.addColorStop(1, '#e6aa22');
      g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
      g.globalAlpha = 0.18; speckle('rgba(0,0,0,0)', ['#d99a1a', '#fff0a8'], 2600, 1.1)(g, W2); g.globalAlpha = 1;
      var by = H2 * (1 - BAND);
      g.fillStyle = '#121213'; g.fillRect(0, by, W2, H2 - by);                                                  // the + end band
      g.fillStyle = '#ffd75a'; g.fillRect(0, by - 5, W2, 3); g.fillStyle = '#7a5410'; g.fillRect(0, by - 2, W2, 2);   // gold pinstripe and its shadow
      [0, W2 / 2].forEach(function (x0) {
        // roundel with the spark
        var cx = x0 + 64, cy = by * 0.5;
        g.fillStyle = '#121213'; g.beginPath(); g.arc(cx, cy, 46, 0, PI * 2); g.fill();
        g.strokeStyle = '#ffd75a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 40, 0, PI * 2); g.stroke();
        g.fillStyle = '#ffd23a'; bolt(g, cx, cy, 62); g.fill();
        // the brand and the small print, along the cell
        along(g, x0 + 150, by - 10, function () { g.fillStyle = '#121213'; g.font = 'italic 900 64px "Arial Black", Impact, sans-serif'; g.textBaseline = 'alphabetic'; g.fillText('VOLTA', 0, 0, by - 20); });
        along(g, x0 + 176, by - 10, function () { g.fillStyle = '#3a2a0a'; g.font = 'bold 19px Arial, sans-serif'; g.fillText('ALKALINE  ·  LONG LIFE', 0, 0, by - 20); });
        along(g, x0 + 206, by - 10, function () { g.fillStyle = '#5a4210'; g.font = '14px Arial, sans-serif'; g.fillText('C · LR14 · 1.5 V', 0, 0, by - 20); });
        // + in the band, and a power meter row of little cells
        g.fillStyle = '#ffd23a'; g.font = 'bold 40px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', cx, by + (H2 - by) / 2 + 2); g.textAlign = 'left';
        for (var q = 0; q < 5; q++) { g.fillStyle = q < 4 ? '#ffd23a' : '#5a4a20'; g.fillRect(x0 + 140 + q * 15, by + 16, 11, 26); }
        g.fillStyle = '#9aa0a4'; g.font = 'bold 13px Arial, sans-serif'; g.fillText('POWER CHECK', x0 + 222, by + 34);
      });
      g.globalAlpha = 0.5; g.fillStyle = 'rgba(70,40,10,.35)'; for (var s2 = 0; s2 < 30; s2++) g.fillRect(Math.random() * W2, Math.random() * H2, 6 + Math.random() * 30, 1);   // handling scuffs
      g.globalAlpha = 1;
    }, 1, 1, true, H2);
    batGlowMap = canvasTex(W2, function (g) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W2, H2); var by = H2 * (1 - BAND);
      g.fillStyle = '#6a5010'; g.fillRect(0, by - 5, W2, 3);
      [0, W2 / 2].forEach(function (x0) { var cx = x0 + 64, cy = by * 0.5; g.fillStyle = '#ffcf50'; bolt(g, cx, cy, 62); g.fill(); g.strokeStyle = '#5a4210'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 40, 0, PI * 2); g.stroke(); for (var q = 0; q < 4; q++) { g.fillStyle = '#8a6a18'; g.fillRect(x0 + 140 + q * 15, by + 16, 11, 26); } });
    }, 1, 1, true, H2);
    batNormal = normalTex(128, function (g, S) { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); var by = S * (1 - BAND); g.fillStyle = '#5a5a5a'; g.fillRect(0, by - 2, S, 2); g.fillStyle = '#a8a8a8'; g.fillRect(0, by, S, 1.5); }, 1.5, 1, 1);
  }
  var batCapMat = null;
  H.buildBattery = function (parent, glow) {
    batteryMaps();
    var G = new THREE.Group();
    var wrap = std(0xffffff, 0.3, { metalness: 0.15, envMap: envTex, envMapIntensity: 0.55, map: batWrapMap, normalMap: batNormal, normalScale: new THREE.Vector2(0.6, 0.6),
      emissive: glow ? 0xffc040 : 0x000000, emissiveMap: glow ? batGlowMap : null, emissiveIntensity: glow ? 0.9 : 0 });
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.0445, 28, 1, true), wrap); b.rotation.z = PI / 2; b.rotation.y = PI / 2; G.add(b);
    var cap = batCapMat || (batCapMat = metal(0xc4c7ca, 0.26, { envMapIntensity: 0.8 }));
    // the ends: a lathe from the + nub round the crimped shoulder, and the flat - end with its crimp
    var plus = new THREE.Mesh(new THREE.LatheGeometry([[0.0001, -0.0268], [0.0044, -0.0268], [0.0047, -0.0262], [0.0047, -0.0246], [0.0068, -0.0243], [0.0102, -0.0238], [0.0112, -0.0232], [0.0117, -0.0224], [0.0117, -0.0218]].map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 28), cap);
    plus.rotation.x = PI / 2; G.add(plus);
    var minus = new THREE.Mesh(new THREE.LatheGeometry([[0.0117, 0.0218], [0.0117, 0.0228], [0.0111, 0.0236], [0.0098, 0.024], [0.0084, 0.0236], [0.0001, 0.0236]].map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 28), cap);
    minus.rotation.x = PI / 2; G.add(minus);
    G.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); if (parent) parent.add(G); return G;
  };
  function buildCard() {                           // the staff pass, 86 x 54 mm
    var front = std(0xffffff, 0.45, { map: canvasTex(512, function (g, S, HH) {
      g.fillStyle = '#e9e4d2'; g.fillRect(0, 0, S, HH); g.fillStyle = '#254a30'; g.fillRect(0, 0, S, 86);
      g.fillStyle = '#e2b93b'; g.font = 'bold 44px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif'; g.fillText('FAMILY ZOO', 24, 58); g.font = 'bold 20px Arial, sans-serif'; g.fillText('STAFF', S - 96, 56);
      g.fillStyle = '#8fa8b0'; g.fillRect(28, 112, 150, 178); g.fillStyle = '#3a342c'; g.beginPath(); g.arc(103, 176, 38, 0, 7); g.fill(); g.beginPath(); g.ellipse(103, 290, 66, 62, 0, PI, 0); g.fill();   // the photo
      g.fillStyle = '#1c1a16'; g.font = 'bold 30px Arial, sans-serif'; g.fillText('A. MERCER', 204, 150); g.font = '22px Arial, sans-serif'; g.fillText('Night Keeper', 204, 184); g.fillText('ID  0417-K', 204, 216);
      g.fillStyle = '#8d1f18'; g.font = 'bold 20px Arial, sans-serif'; g.fillText('ACCESS: ALL SECTORS', 204, 262);
      g.fillStyle = 'rgba(40,30,16,.3)'; for (var q = 0; q < 40; q++) g.fillRect(Math.random() * S, Math.random() * HH, 30 + Math.random() * 80, 1);                        // scratches
      blotch(g, S, ['#5a5038'], 10, 10, 60, 0.22);
    }, 1, 1, true, 322) });
    var back = std(0xffffff, 0.5, { map: canvasTex(256, function (g, S, HH) { g.fillStyle = '#d9d4c2'; g.fillRect(0, 0, S, HH); g.fillStyle = '#17120e'; g.fillRect(0, 18, S, 34); g.fillStyle = '#6a6458'; for (var q = 0; q < 5; q++) g.fillRect(14, 74 + q * 13, 150 - q * 16, 3); blotch(g, S, ['#5a5038'], 8, 8, 40, 0.25); }, 1, 1, true, 160) });
    var edge = std(0xd9d4c2, 0.5), m = new THREE.Mesh(new THREE.BoxGeometry(0.0856, 0.054, 0.0009), [edge, edge, edge, edge, front, back]); m.castShadow = true;
    return m;
  }
  // battery tube pieces that come apart when reloading: the tail cap is a separate part of the torch, plus a spent and a fresh cell
  H.spare = H.buildBattery(camera); H.spare.visible = false; H.spent = H.buildBattery(camera); H.spent.visible = false; H.spare.scale.setScalar(1.1); H.spent.scale.setScalar(1.1);      // placed by the reload, frame by frame (camera space)
  H.card = buildCard(); L.hand.add(H.card); H.card.visible = false; H.card.position.set(-0.062, -0.022, -0.118); H.card.rotation.set(0.2, 0.25, 1.45);
  H.carried = null;                                // an object in the left hand (the fuel can)

  // ---------- poses ----------
  POSE.point = [0.5, 0.3, 0.2, 0.5, 0.6,   0.06, 0.08, 0.05,  1.35, 1.6, 0.9,  1.42, 1.62, 0.92,  1.5, 1.6, 0.9,   0, 0, 0, 0];
  POSE.fist  = [0.45, 0.35, 0.2, 0.55, 0.7,  1.3, 1.55, 0.85,  1.38, 1.6, 0.9,  1.44, 1.62, 0.92,  1.5, 1.6, 0.9,   0, 0, 0, 0];
  POSE.hook  = [0.3, 0.2, 0.1, 0.4, 0.5,   0.85, 1.3, 0.7,  0.9, 1.34, 0.72,  0.94, 1.36, 0.74,  1.0, 1.36, 0.74,   0, 0, 0, 0];      // round a bar or a lever
  POSE.pinch = [0.62, 0.42, 0.3, 0.3, 0.42,  0.72, 0.7, 0.35,  0.82, 0.78, 0.4,  1.2, 1.45, 0.8,  1.34, 1.5, 0.85,   0.03, 0, 0, 0];   // thumb against the first two fingers
  POSE.carry = [0.4, 0.3, 0.15, 0.55, 0.7,  1.0, 1.45, 0.8,  1.05, 1.5, 0.82,  1.1, 1.52, 0.84,  1.15, 1.52, 0.84,   0.02, 0, 0, -0.03];   // fingers round a carry handle, thumb over them
  POSE.wipe  = [0.1, 0.05, 0, 0.1, 0.12,   0.12, 0.16, 0.1,  0.14, 0.18, 0.1,  0.14, 0.18, 0.12,  0.18, 0.2, 0.12,   0.02, 0, 0, -0.03];
  POSE.barOpen = [-0.6, -0.3, 0, 0.15, 0.15,   0.18, 0.22, 0.12,  0.16, 0.2, 0.12,  0.18, 0.22, 0.12,  0.22, 0.24, 0.14,   0.02, 0, 0, -0.04];   // fingers open, ready to close round something
  POSE.wipeFlat = [-0.3, -0.3, 0, 0.1, 0.12,   -0.58, 0.05, 0.03,  -0.55, 0.05, 0.03,  -0.52, 0.06, 0.04,  -0.46, 0.08, 0.05,   0.02, 0, 0, -0.03];   // fingers flat on a surface, the palm lifted off it (bent back at the knuckles), thumb laid out to the side   // fingers flat on a surface, bent back a little at the knuckles
  POSE.push = [-0.38, -0.22, 0.05, 0.06, 0.06,   0.13, 0.03, 0.01,  0.12, 0.03, 0.01,  0.12, 0.04, 0.02,  0.14, 0.05, 0.03,   -0.05, -0.015, 0.03, 0.08];   // flat on a door: fingers spread a little and just touching, thumb out
  POSE.grip[0] = 0.05; POSE.grip[1] = 0.22; POSE.grip[2] = 0.1; POSE.grip[3] = 0.3; POSE.grip[4] = 0.4;
  var GRIP_PRESS = POSE.grip.slice(); GRIP_PRESS[1] = 0.34; GRIP_PRESS[3] = 0.52; GRIP_PRESS[4] = 0.86;
  function mixPose(a, b, t, out) { out = out || []; for (var i = 0; i < 21; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; }
  // where each pose touches things, in hand space (right-hand coordinates; x is mirrored for the left)
  var TIP = { palm: new V(0.0, -0.021, -0.058), point: new V(-0.037, -0.008, -0.186), wipe: new V(-0.004, -0.014, -0.13), flat: new V(0, -0.02, -0.07), hook: new V(-0.002, -0.036, -0.088), fist: new V(-0.002, -0.034, -0.082), pinch: new V(-0.05, -0.03, -0.122) };

  // ---------- the left hand at work ----------
  /* H.use(key, o) sends the left hand to a point in the world and keeps it there while the call is repeated (or for o.dur
     seconds).  o.point() returns that point each frame, so the hand stays on a door as it swings or a crank as it turns.
     o.pose names the hand shape, o.rot is the hand's rotation in camera space [x, y, z], o.move(t) may add a small motion
     (world space) and o.onTouch fires once when the hand arrives. */
  var use = null, Lcur = { pos: new V(-0.3, -0.7, -0.2), q: new Q(), wq: new Q(), pose: POSE.relax.slice() }, SHOULDER_L = new V(-0.21, -0.3, 0.12), ID = new Q(), FWD = new V(0, 0, -1), REST_L = { pos: new V(-0.3, -0.72, -0.2), q: new Q().setFromEuler(new THREE.Euler(0.5, 0.2, 0.7, 'YXZ')) };
  var tmpV = new V(), tmpQ = new Q(), tmpE = new THREE.Euler(0, 0, 0, 'YXZ'), tmpP = [];
  H.use = function (key, o) {
    if (use && use.key === key && !use.leaving) { use.alive = o && o.dur ? use.alive : 0.16; if (o && o.spin !== undefined) use.spin = o.spin; return use; }
    use = { key: key, t: 0, alive: o.dur || 0.16, oneShot: !!o.dur, point: o.point, pose: POSE[o.pose] || POSE.point, tip: TIP[o.tip || o.pose] || TIP.point, rot: o.rot || [0.1, 0.25, 0.4],
      move: o.move, onTouch: o.onTouch, touched: false, leaving: false, out: 0, press: o.press || 0, spin: 0, body: !!o.body, poseAt: o.poseAt, rotAt: o.rotAt, outT: o.outT || 0.34, from: { pos: Lcur.pos.clone(), q: Lcur.q.clone(), wq: Lcur.wq.clone(), pose: Lcur.pose.slice() }, reach: o.reach || 0.24, prop: o.prop };
    return use;
  };
  /* Pushing a door open with the flat of the left hand.  lp is a point on the door's face and ln the face's outward normal
     (toward you), both in the door's own space.  The palm comes to rest flat on the face, square to it however the door is
     turned, fingers up and leaning out a little; the door starts to swing as the hand lands, the hand goes with it for `hold`
     seconds (the first few degrees, while an arm can follow), then lets the door carry on and comes back. */
  var dpN = new V(), dpF = new V(), dpX = new V(), dpL = new V(), dpM = new THREE.Matrix4(), dpQ = new Q(), dpC = new Q(), dpE = new THREE.Euler(0, 0, 0, 'YXZ');
  H.pushDoor = function (key, door, lp, ln, onTouch, o) {
    o = o || {};
    var reach = o.reach || 0.34, hold = o.hold || 0.3, t0 = null, frozen = null, pt = new V(), rot = [0, 0, 0], P0 = lp.clone(), N0 = ln.clone();
    function place() {
      door.updateMatrixWorld(true); pt.copy(P0).applyMatrix4(door.matrixWorld); dpN.copy(N0).transformDirection(door.matrixWorld); pt.addScaledVector(dpN, 0.004);
      dpL.set(-Math.cos(player.yaw), 0, Math.sin(player.yaw));                                   // your left
      dpF.set(0, 1, 0).addScaledVector(dpL, 0.3); dpF.addScaledVector(dpN, -dpF.dot(dpN)).normalize();   // fingers up the door, leaning out to the left
      dpX.crossVectors(dpF, dpN);                                                                 // the thumb's side
      dpQ.setFromRotationMatrix(dpM.makeBasis(dpX, dpN, dpF.negate()));                         // (left hand: thumb +x, back +y, fingers -z)
      dpQ.premultiply(dpC.copy(camera.quaternion).invert()); dpE.setFromQuaternion(dpQ, 'YXZ'); rot[0] = dpE.x; rot[1] = dpE.y; rot[2] = dpE.z;
    }
    return H.use(key, { pose: 'push', tip: 'palm', rot: rot, dur: reach + hold, reach: reach, outT: o.outT || 0.45, onTouch: onTouch,
      point: function () {
        if (t0 === null) t0 = H.time;
        if (H.time - t0 < reach + hold || !frozen) { place(); if (H.time - t0 >= reach + hold) frozen = pt.clone(); }
        else pt.copy(frozen);                                                                     // let go: the door swings on without the hand
        return pt;
      },
      rotAt: function () { return rot; } });
  };
  H.busy = function () { return !!(use && !use.leaving) || clipT >= 0; };
  H.current = function () { return use; };            // (the frame checks in .dev look at the action in progress)
  H.release = function () { if (use) use.alive = 0; };

  // ---------- flashlight click, burst and reload ----------
  var clickT = -1, clickFn = null, burstT = -1, clipT = -1, clip = null, lightOn = false, offBlend = 1;
  H.click = function (fn) { clickT = 0; clickFn = fn; };
  H.burst = function () { burstT = 0; };
  /* Reloading: the right hand turns the torch tail-first toward the left hand, which unscrews the cap, lets the dead cell
     drop out, comes back with a fresh one, pushes it home and screws the cap back on.  Everything the left hand touches is
     keyed in the torch's own space, so the pieces line up however the view is moving. */
  var RELOAD = 3.1;
  H.reload = function (done) { if (clipT >= 0) return false; clipT = 0; clip = { done: done, ev: {} }; return true; };
  /* A true pinch.  The thumb and the index finger close on a cylinder of radius rc until the pads of both lie on its surface,
     exactly opposite one another.  The joint angles are found once by walking the hand's real bones (not guessed), so
     whatever is pinched is touched.  Returns the pose and where the cylinder then sits in the hand (right-hand space):
     c a point on its axis between the pads, a its axis (pointing away from the palm), d from the thumb's pad to the index's. */
  var PAD_T = new V(0, -0.0097, -0.0165), PAD_I = new V(0, -0.0087, -0.0135), fkInv = new THREE.Matrix4(), fkM = new THREE.Matrix4();
  function fkPad(bone, lp, out) { fkM.multiplyMatrices(fkInv, bone.matrixWorld); out.p.copy(lp).applyMatrix4(fkM); out.n.set(0, -1, 0).transformDirection(fkM); out.f.set(0, 0, -1).transformDirection(fkM); return out; }
  function fk(pose, t, i) { applyPose(R, pose); R.hand.updateWorldMatrix(true, true); fkInv.copy(R.hand.matrixWorld).invert(); fkPad(R.T[2], PAD_T, t); fkPad(R.F[0][2], PAD_I, i); }
  function solvePinch(rc, prior) {
    var t = { p: new V(), n: new V(), f: new V() }, i = { p: new V(), n: new V(), f: new V() }, d = new V(), VAR = [0, 1, 2, 3, 4, 5, 6, 7, 17];
    var LIM = { 0: [0, 1.15], 1: [-0.3, 0.9], 2: [-0.3, 0.9], 3: [0, 0.9], 4: [0, 0.9], 5: [0, 1.5], 6: [0.05, 1.6], 7: [0.05, 1.1], 17: [-0.12, 0.12] };
    function cost(p) {
      fk(p, t, i); d.subVectors(i.p, t.p); var L = d.length() || 1e-6; d.multiplyScalar(1 / L);
      var e = (L - 2 * rc) * 1000, c = e * e * 6 + Math.pow(1 - d.dot(t.n), 2) * 70 + Math.pow(1 + d.dot(i.n), 2) * 70;
      for (var k = 0; k < VAR.length; k++) c += Math.pow(p[VAR[k]] - prior[VAR[k]], 2) * 1.2;
      return c;
    }
    var p = prior.slice(), best = cost(p), step = 0.16, it, k, sg;
    for (it = 0; it < 90 && step > 0.0008; it++) {
      var moved = false;
      for (k = 0; k < VAR.length; k++) for (sg = -1; sg <= 1; sg += 2) {
        var q = p.slice(), v = VAR[k]; q[v] = clamp(q[v] + sg * step, LIM[v][0], LIM[v][1]); var c = cost(q);
        if (c < best - 1e-9) { best = c; p = q; moved = true; }
      }
      if (!moved) step *= 0.5;
    }
    fk(p, t, i); d.subVectors(i.p, t.p); var gap = d.length(); d.normalize();
    var a = t.f.clone().add(i.f); a.addScaledVector(d, -a.dot(d)).normalize();
    return { pose: p, c: t.p.clone().add(i.p).multiplyScalar(0.5), a: a, d: d.clone(), gap: gap, err: best };
  }
  /* The reload, as it is seen:
       the torch is turned across the view, tail to the left and a little high; the left hand takes the locking ring between
       thumb and forefinger and gives it a quarter turn; the lid springs open; a flick of the right wrist tips the dead cell
       out; the left hand comes back with a fresh cell held between the pads of the thumb and the forefinger, slides it down
       the bore with a quarter twist and presses it home against the spring; a jerk of the torch throws the lid shut, and the
       ring is turned back to lock it.  Then the torch goes back where it was.
     Everything is placed from the torch itself: the cell is carried rigidly in the solved pinch, and from the moment it is on
     the bore's axis the hand is put wherever that pinch puts the cell there, so the pads never leave it. */
  var RL = { h: new V(0.80, -0.30, -0.52).normalize(), tail: new V(-0.012, -0.124, -0.345), back: new V(0.30, -0.72, 0.62), slip: 0.026 };      // slip: the torch is let slide back through the fist, to bring more of the tail out of it
  var CELL_R = 0.0115 * 1.1, CELL_OFF = 0.016 * 1.1, RING_R = 0.0146 * 1.1, CELL_SEAT = -0.030, CELL_FROM = 0.075, PINCH_REST = POSE.pinch.slice();
  [8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(function (k, n) { PINCH_REST[k] = [0.74, 0.9, 0.5, 0.86, 0.98, 0.54, 0.94, 1.02, 0.56][n]; }); PINCH_REST[18] = 0.02; PINCH_REST[19] = 0.02; PINCH_REST[20] = 0.0;   // the other three fingers fan out of the way
  (function () {
    RL.q = holdQuat(RL.h, RL.back); RL.hq = RL.q.clone().multiply(new Q().setFromEuler(WRIST));
    RL.pos = RL.tail.clone().sub(GRIP_P.clone().addScaledVector(GRIP_DIR, -(IDX + RL.slip)).applyQuaternion(RL.hq));
    var tq = RL.hq.clone().multiply(torch.quaternion), inv = tq.clone().invert();
    // where the hinge sits round the rim (up and away from the eye, so the open lid never hides the bore), and where the forefinger goes
    /* Seen from the eye the pinch is a claw in the plane of the picture: the thumb under the cell, the forefinger hooked over
       it, the palm facing the bore and the wrist below.  The lid stands open on the far side, where neither finger goes
       and it hides nothing of the bore. */
    var u0 = new V(0, 0.966, 0.259); u0.addScaledVector(RL.h, -u0.dot(RL.h)).normalize().applyAxisAngle(RL.h, -0.62);
    var rad = new V().crossVectors(u0, RL.h).normalize();                         // a quarter round from both fingers, on the side away from the eye
    RL.radL = rad.clone().applyQuaternion(inv); RL.radL.z = 0; RL.radL.normalize(); RL.uL = u0.clone().applyQuaternion(inv); RL.uL.z = 0; RL.uL.normalize();
    var HP = RL.radL.clone().multiplyScalar(0.0158); HP.z = -0.0232;
    var cp = torch.userData.capPivot; cp.position.copy(HP); torch.userData.cap.position.copy(HP).negate();
    RL.hinge = new V().crossVectors(new V(0, 0, 1), RL.radL).normalize();
    var hm = metal(0x9aa0a4, 0.32), ang = Math.atan2(RL.radL.y, RL.radL.x);
    function part(geo, parent, x, y, z) { var m = new THREE.Mesh(geo, hm); m.position.set(x, y, z); m.rotation.z = ang; m.castShadow = false; parent.add(m); return m; }
    part(new THREE.BoxGeometry(0.0034, 0.0062, 0.0052), torch, RL.radL.x * 0.0148, RL.radL.y * 0.0148, -0.0262);                 // the lug on the body
    var pin = part(new THREE.CylinderGeometry(0.0011, 0.0011, 0.0074, 8), torch, HP.x, HP.y, HP.z);                               // the pin (along the rim)
    part(new THREE.BoxGeometry(0.003, 0.0048, 0.0046), torch.userData.cap, RL.radL.x * 0.0149, RL.radL.y * 0.0149, -0.0204);     // the strap on the lid
    RL.cell = solvePinch(CELL_R, PINCH_REST); RL.ring = solvePinch(RING_R, RL.cell.pose);
    RL.open = RL.cell.pose.slice(); RL.open[1] -= 0.2; RL.open[3] -= 0.12; RL.open[5] -= 0.26; RL.open[6] -= 0.12;                // the same hand, opened a finger's width
    RL.ringOpen = RL.ring.pose.slice(); RL.ringOpen[1] -= 0.18; RL.ringOpen[3] -= 0.1; RL.ringOpen[5] -= 0.22; RL.ringOpen[6] -= 0.1;
    applyPose(R, POSE.grip);
  })();
  H.RL = RL;
  var rlM = new THREE.Matrix4(), rlTP = new V(), rlTQ = new Q(), rlTS = new V(), rlAx = new V(), rlU = new V(), rlN = new V(), rlP = new V(), rlC = new V(), rlA = new V(), rlD = new V(), rlN2 = new V(), rlM1 = new THREE.Matrix4(), rlM2 = new THREE.Matrix4(), rlQ = new Q(), rlQ2 = new Q(), rlS = new V(1.1, 1.1, 1.1), rlG = new V(), rlPrev = new V(), rlVel = new V(), rlFall = null, rlHand = { pos: new V(), q: new Q() }, rlHand2 = { pos: new V(), q: new Q() }, rlRoll = new Q(), ZAXIS = new V(0, 0, 1);
  /* Where the left hand must be (camera space) for the pinch G to hold a cylinder whose axis runs through P along ax, with the
     forefinger's pad on the side u.  (The left hand is the right-hand model mirrored in x.) */
  function pinchHand(G, P, ax, u, out) {
    rlC.set(-G.c.x, G.c.y, G.c.z); rlA.set(-G.a.x, G.a.y, G.a.z); rlD.set(-G.d.x, G.d.y, G.d.z); rlN.crossVectors(rlA, rlD);
    rlM1.makeBasis(rlA, rlD, rlN); rlN2.crossVectors(ax, u); rlM2.makeBasis(ax, u, rlN2); rlM2.multiply(rlM1.transpose());
    out.q.setFromRotationMatrix(rlM2); out.pos.copy(P).sub(rlC.applyQuaternion(out.q)); return out;
  }
  var coX = new V(), coY = new V(), coZ = new V(), coM = new THREE.Matrix4();
  function cellOnAxis(cell, zl, roll) {              // a cell on the bore's axis, its middle at torch z = zl, turned by roll (the same turn the pinch makes)
    rlP.copy(rlTP).addScaledVector(rlAx, -zl * 1.1);
    coX.copy(RL.uL).applyQuaternion(rlTQ).applyAxisAngle(rlAx, roll || 0); coZ.copy(rlAx).negate(); coY.crossVectors(coZ, coX);
    rlQ.setFromRotationMatrix(coM.makeBasis(coX, coY, coZ)); cell.position.copy(rlP); cell.quaternion.copy(rlQ);
  }
  function bump3(t, a, b, c, d) { return t <= a || t >= d ? 0 : t < b ? sstep((t - a) / (b - a)) : t < c ? 1 : 1 - sstep((t - c) / (d - c)); }
  H.relDbg = function () {          // (the frame checks in .dev measure how far each pad is from what it should be touching, in mm)
    if (clipT < 0) return null;
    var out = { t: +clipT.toFixed(3) }, tp2 = new V(), ip2 = new V(), c = new V(), ax = new V(), v = new V();
    L.hand.updateWorldMatrix(true, true); tp2.copy(PAD_T).applyMatrix4(L.T[2].matrixWorld); ip2.copy(PAD_I).applyMatrix4(L.F[0][2].matrixWorld);
    function off(obj, lz, r) { obj.updateWorldMatrix(true, false); c.set(0, 0, lz).applyMatrix4(obj.matrixWorld); ax.set(0, 0, 1).transformDirection(obj.matrixWorld);
      return [tp2, ip2].map(function (p2) { v.subVectors(p2, c); var al = v.dot(ax); v.addScaledVector(ax, -al); return [+((v.length() - r) * 1000).toFixed(2), +(al * 1000).toFixed(1)]; }); }
    if (H.spare.visible) out.cell = off(H.spare, 0, CELL_R); out.ring = off(torch.userData.ring, -0.0125, RING_R); return out;
  };
  H.reloading = function () { return clipT >= 0; };
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }

  // ---------- the right hand at work (pushing a door with the torch still in it, while the left carries something) ----------
  var useR = null;
  H.useR = function (key, o) {
    if (useR && useR.key === key && !useR.leaving) return useR;
    useR = { key: key, t: 0, alive: o.dur || 0.5, point: o.point, rot: o.rot || [0.25, -0.5, -1.3], tip: o.tip ? TIP[o.tip] : TIP.fist, reach: o.reach || 0.32, onTouch: o.onTouch, touched: false, leaving: false, out: 0, press: o.press || 0, move: o.move };
    return useR;
  };

  /* Arm solving: given where a wrist must be (camera space) and the forearm orientation it would have if nothing else
     mattered (`base`), aim the forearm at the elbow two-bone IK finds from the shoulder (within what a wrist can bend),
     then lay the upper arm from that elbow back to the shoulder.  Writes the forearm's root rotation and the hand bone's
     local rotation (mirrored for the left hand, whose rig is flipped in x). */
  var aV1 = new V(), aV2 = new V(), aV3 = new V(), aV4 = new V(), aQ1 = new Q(), aQ2 = new Q(), ZP = new V(0, 0, 1), ZN = new V(0, 0, -1);
  function solveArm(side, W, handQ, baseQ, maxBend, rootOut, wristOut) {
    var S = SHO[side], pole = POLE[side], d = aV1.copy(W).sub(S), L = d.length(); d.multiplyScalar(1 / (L || 1));
    var Lc = clamp(L, 0.12, FORE + UPPER - 0.002), x = (UPPER * UPPER - FORE * FORE + Lc * Lc) / (2 * Lc), h = Math.sqrt(Math.max(0, UPPER * UPPER - x * x));
    var pp = aV2.copy(pole).addScaledVector(d, -pole.dot(d)); if (pp.lengthSq() < 1e-6) pp.set(side === 'L' ? -1 : 1, 0, 0); pp.normalize();
    var E = aV3.copy(S).addScaledVector(d, x).addScaledVector(pp, h);          // the elbow IK would like
    var f = aV4.copy(W).sub(E).normalize();                                     // elbow -> wrist
    var bf = aV2.copy(ZN).applyQuaternion(baseQ), ang = Math.acos(clamp(bf.dot(f), -1, 1));
    if (ang > maxBend) { aQ2.setFromUnitVectors(bf, f); aQ1.identity().slerp(aQ2, maxBend / ang); f.copy(bf).applyQuaternion(aQ1); }
    rootOut.copy(aQ1.setFromUnitVectors(bf, f)).multiply(baseQ);
    var rel = aQ2.copy(rootOut).invert().multiply(handQ);
    if (side === 'L') wristOut.set(rel.x, -rel.y, -rel.z, rel.w); else wristOut.copy(rel);
    // the upper arm: from the elbow the forearm actually ends at, back to the shoulder
    var Ea = aV3.copy(W).addScaledVector(f, -FORE), g = UA[side], to = aV1.copy(S).sub(Ea), len = to.length();
    g.position.copy(Ea); g.quaternion.setFromUnitVectors(ZP, to.multiplyScalar(1 / (len || 1))); g.userData.tube.scale.z = Math.max(0.05, len);
  }

  // ---------- every frame ----------
  var aimCur = [0, 0, 0, 0, 0, 0], sway = { x: 0, y: 0, vx: 0, vy: 0 }, lastYaw = null, lastPitch = 0, bobK = 0, runK = 0, block = 0, landT = 0, RQ = new Q(), RP = new V(), tailW = new V();
  var leanW = new V(), leanWant = new V(), lv = new V(), lq = new Q(), carryK = 0, carrySw = 0, carryV = 0, freeK = 0;
  var hQ = new Q(), bQ = new Q(), rootQ = new Q(), wristQ = new Q(), pitchQ = new Q(), XAX = new V(1, 0, 0), WRISTQ = new Q().setFromEuler(WRIST);
  var lastHold = null, hM = new THREE.Matrix4(), camInv = new THREE.Matrix4(), MIRX = new THREE.Matrix4().makeScale(-1, 1, 1), hP = new V(), hQ2 = new Q(), hS = new V();
  H.lean = leanW; H.tipCam = new V();
  // where the left hand's working point is right now, in the world (the cinematic wipes dust off exactly where the palm is)
  H.tipWorld = function (out) { return camera.localToWorld((out || new V()).copy(Lcur.tip || H.tipCam)); };
  H.contact = function () { return !!(use && !use.leaving && use.t >= use.reach); };
  H.update = function (dt, c) {
    if (!H.visible) return;
    c = c || {};
    var t = (H.time = (H.time || 0) + dt), speed = c.speed || 0, mv = clamp(speed / 4.4, 0, 1.6);
    /* the stride: one step is PI of phase.  Callers that only know a distance-based bob value get a phase made from it. */
    var ph = c.phase !== undefined ? c.phase : (c.bob || 0) * 1.25, wk = clamp(speed / 4.4, 0, 1), sprinting = c.sprint ? 1 : 0;
    // --- sway: the torch lags a little behind the view ---
    if (lastYaw === null) { lastYaw = c.yaw || 0; lastPitch = c.pitch || 0; }
    var dy = dt > 0 ? clamp(angDiff(c.yaw || 0, lastYaw) / dt, -5, 5) : 0, dp = dt > 0 ? clamp(((c.pitch || 0) - lastPitch) / dt, -5, 5) : 0; lastYaw = c.yaw || 0; lastPitch = c.pitch || 0;
    sway.x = damp(sway.x, -dy * 0.03, 9, dt); sway.y = damp(sway.y, dp * 0.03, 9, dt);
    bobK = damp(bobK, c.grounded === false ? 0 : wk, 7, dt); runK = damp(runK, sprinting && c.grounded !== false ? clamp((speed - 4.6) / 3.4, 0, 1) : 0, 6, dt);
    if (c.landed) landT = 0.3; landT = Math.max(0, landT - dt);
    // --- walls: draw the torch in rather than let it poke through ---
    var bl = 0; if (c.x !== undefined) { var fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw); bl = inBox(c.x + fx * 0.74, c.z + fz * 0.74, 0.02) ? 1 : inBox(c.x + fx * 0.6, c.z + fz * 0.6, 0.02) ? 1 : 0; }
    block = damp(block, bl, 10, dt);
    offBlend = damp(offBlend, lightOn || clipT >= 0 ? 0 : 1, 6, dt);

    /* --- leaning in: when a hand is sent somewhere beyond arm's length, the body bends toward it (the camera moves) --- */
    leanWant.set(0, 0, 0);
    var act = use && !use.leaving ? use : useR && !useR.leaving ? useR : H.hold && H.hold.want > 0.5 && H.hold.reach ? { point: H.hold.reach } : null;
    if (act && act.point && clipT < 0) {                                  // (the camera arrives here where the body stands, not yet leaned)
      camera.updateMatrixWorld(true);
      lv.copy(act.point()); camera.worldToLocal(lv);
      var sh = act === use ? SHO.L : SHO.R, reachD = lv.distanceTo(sh), excess = reachD - (FORE + UPPER - 0.1);
      if (excess > 0) { lv.sub(sh).normalize().multiplyScalar(Math.min(excess, act === use || act === useR || !H.hold.leanMax ? 0.55 : H.hold.leanMax)); lv.applyQuaternion(camera.quaternion); if (lv.y > 0) lv.y = 0; leanWant.copy(lv); }
    }
    // ease into the lean and out of it at the pace of a body bending (never faster than ~0.6 m/s)
    lv.copy(leanWant).sub(leanW); var lstep = lv.length(), lmax = 0.6 * dt; lv.multiplyScalar(lstep > 0 ? Math.min(1, (1 - Math.exp(-dt * 3.5)) , lmax / lstep) : 0); leanW.add(lv);
    camera.position.add(leanW); camera.updateMatrixWorld(true);

    // --- right hand: held out in front, the beam bobbing with the stride ---
    RP.copy(HOLD.pos); RQ.copy(HOLD.q);
    var s1 = Math.sin(ph), dip = (1 + Math.cos(2 * ph)) / 2, rk = runK;          // dip: 1 at each footfall, 0 mid-stride
    var px = s1 * (0.0065 * bobK + 0.016 * rk) + sway.x * 0.35;
    var py = -dip * (0.009 * bobK + 0.026 * rk) + Math.sin(t * 1.3) * 0.0022 - sway.y * 0.3 - offBlend * 0.035 - landT * 0.12 - rk * 0.03 + (c.crouch ? 0.012 : 0);
    var pz = block * 0.13 + rk * (0.02 + Math.cos(ph) * 0.035) + offBlend * 0.02;
    if (c.menu) py -= 0.3;                                               // title screen: keep the light, drop the hand out of shot
    var rx = sway.y * 0.9 - offBlend * 0.16 + Math.sin(t * 1.3 + 1) * 0.004 - landT * 0.5 - dip * (0.014 * bobK + 0.05 * rk) - rk * 0.1 + s1 * 0.04 * rk;
    var ry = sway.x * 0.9 + offBlend * 0.1 + s1 * (0.012 * bobK + 0.05 * rk), rz = sway.x * -0.6 + s1 * (0.02 * bobK + 0.07 * rk) + rk * 0.12;
    var pose = POSE.grip;
    if (H.aim) for (var ai = 0; ai < 6; ai++) aimCur[ai] = damp(aimCur[ai], H.aim[ai], 5, dt); else for (ai = 0; ai < 6; ai++) aimCur[ai] = damp(aimCur[ai], 0, 5, dt);
    px += aimCur[0]; py += aimCur[1]; pz += aimCur[2]; rx += aimCur[3]; ry += aimCur[4]; rz += aimCur[5];              // H.aim: a cinematic asking for the torch to be held differently
    // click: thumb down on the switch, a tiny kick, thumb back
    if (clickT >= 0) {
      var k = clickT < 0.07 ? clickT / 0.07 : 1 - seg(clickT, 0.1, 0.26); pose = mixPose(POSE.grip, GRIP_PRESS, clamp(k, 0, 1), tmpP); py -= k * 0.004; rx -= k * 0.02; H.button.position.y = 0.0152 - k * 0.0012;
      var was = clickT; clickT += dt; if (was < 0.07 && clickT >= 0.07 && clickFn) { var f0 = clickFn; clickFn = null; f0(); }
      if (clickT > 0.3) clickT = -1;
    }
    if (burstT >= 0) { var bk = burstT < 0.05 ? burstT / 0.05 : 1 - seg(burstT, 0.05, 0.5); pz -= bk * 0.05; rx += bk * 0.05; py += bk * 0.012; burstT += dt; if (burstT > 0.5) burstT = -1; }
    // reload: turn the tail to the left hand
    var rl = 0, T = clipT;
    if (T >= 0) rl = easeIO(clamp(T / 0.36, 0, 1)) * (1 - easeIO(clamp((T - (RELOAD - 0.36)) / 0.34, 0, 1)));
    tmpE.set(rx, ry, rz, 'YXZ'); tmpQ.setFromEuler(tmpE); bQ.copy(tmpQ).multiply(RQ);              // the forearm as the hold would have it
    var rW = tmpV.set(RP.x + px, RP.y + py, RP.z + pz);
    if (rl > 0) {
      /* turned across the view for the left hand; then two motions of the wrist: a roll that drops the tail so the dead cell
         slides out, and a short jerk that throws the open lid shut */
      var dumpK = bump3(T, 0.80, 0.97, 1.05, 1.3), jerk = bump3(T, 2.04, 2.13, 2.15, 2.24) * 0.3 - bump3(T, 2.2, 2.27, 2.28, 2.4) * 0.1;
      rlQ.copy(RL.q).premultiply(rlQ2.setFromAxisAngle(ZAXIS, dumpK * 1.12)).premultiply(rlQ2.setFromAxisAngle(XAX, jerk * 0.5 - dumpK * 0.1)).premultiply(rlQ2.setFromAxisAngle(ZAXIS, jerk * 0.6));
      rlP.copy(RL.pos); rlP.x += dumpK * 0.03 + sway.x * 0.2; rlP.y += dumpK * 0.035 - jerk * 0.02 + Math.sin(t * 1.3) * 0.0015 - sway.y * 0.2; rlP.z += dumpK * 0.01;
      rW.lerp(rlP, rl); bQ.slerp(rlQ, rl);
    }
    if (rl > 0 || torch.userData.slip) { torch.userData.slip = rl; torch.position.copy(GRIP_P).addScaledVector(GRIP_DIR, -(IDX + RL.slip * rl)); }
    // the right hand pushing something (a door) with the torch still in its grip
    if (useR) {
      var u2 = useR; u2.t += dt; u2.alive -= dt; if (u2.alive <= 0 && !u2.leaving) { u2.leaving = true; u2.out = 0; }
      lv.copy(u2.point()); camera.worldToLocal(lv);
      tmpE.set(u2.rot[0], u2.rot[1], u2.rot[2], 'YXZ'); lq.setFromEuler(tmpE);                       // the forearm's rotation for the push
      var lqh = lq.clone().multiply(WRISTQ), tipR = u2.tip.clone().applyQuaternion(lqh), inR = easeIO(clamp(u2.t / u2.reach, 0, 1)), prR = u2.press ? Math.sin(clamp((u2.t - u2.reach) / 0.25, 0, 1) * PI) * u2.press : 0;
      lv.sub(tipR); lv.z -= prR;
      if (!u2.touched && u2.t >= u2.reach) { u2.touched = true; if (u2.onTouch) u2.onTouch(); }
      var wR = u2.leaving ? 1 - easeIO(clamp((u2.out += dt) / 0.35, 0, 1)) : inR;
      rW.lerp(lv, wR); hQ.copy(bQ).multiply(WRISTQ); hQ.slerp(lqh, wR); bQ.slerp(lq, wR);
      if (u2.leaving && u2.out >= 0.35) useR = null;
    } else hQ.copy(bQ).multiply(WRISTQ);
    solveArm('R', rW, hQ, bQ, 0.75, rootQ, wristQ);
    R.root.position.copy(rW); R.root.quaternion.copy(rootQ); R.hand.quaternion.copy(wristQ); applyPose(R, pose);
    // --- the torch itself: lens, flare, the pieces that come apart ---
    var lit = flashlight.intensity > 0.05; H.lensMat.color.setHex(lit ? 0xfff6dd : 0x0a0a0a); H.lensMat.opacity = lit ? 1 : 0.35; H.ledMat.color.setHex(lit ? 0xffffff : 0x6a5a20);
    H.flare.material.opacity = lit ? clamp(flashlight.intensity / 6, 0.2, 1) * 0.4 : 0;

    // --- left hand ---
    var tp = REST_L.pos, tq = REST_L.q, tPose = POSE.relax;
    pitchQ.setFromAxisAngle(XAX, -(c.pitch || 0));                        // body space -> camera space (the body does not pitch with the head)
    // running with nothing in it: the free arm pumps, the fist swinging up into the lower left of the view
    freeK = damp(freeK, !H.carried && !use && T < 0 ? rk : 0, 6, dt);
    if (freeK > 0.02) {
      var swg = Math.sin(ph + 0.4);
      var fp = new V(-0.24 - swg * 0.02, -0.5 + Math.max(0, swg) * 0.16, -0.22 - swg * 0.17).applyQuaternion(pitchQ);
      tmpE.set(0.9 - swg * 0.5, 0.3, 0.5 + swg * 0.2, 'YXZ'); var fq = new Q().setFromEuler(tmpE).premultiply(pitchQ);
      tp = REST_L.pos.clone().lerp(fp, freeK); tq = REST_L.q.clone().slerp(fq, freeK); tPose = mixPose(POSE.relax, POSE.fist, freeK, []);
    }
    // carrying: the can hangs from the hand at the side, swinging a little with the stride; the hand sits at the lower left edge of the view
    carryK = damp(carryK, H.carried ? 1 : 0, 8, dt);
    if (H.carried) {
      var acc = (speed - (H._lastSpeed || 0)) / Math.max(dt, 1e-3); H._lastSpeed = speed;
      carryV += (-carrySw * 38 - carryV * 4.2 - clamp(acc, -20, 20) * 0.02 + Math.sin(ph) * 0.9 * wk) * dt; carrySw += carryV * dt; carrySw = clamp(carrySw, -0.35, 0.35);
      var cp = new V(-0.3 + Math.sin(ph) * 0.006 * wk, -0.4 - dip * 0.012 * wk + sway.y * -0.2, -0.43 + sway.x * 0.1).applyQuaternion(pitchQ);
      tmpE.set(-0.06 + carrySw, 0.0, 0.16 + Math.sin(ph) * 0.03 * wk, 'YXZ'); var cq = new Q().setFromEuler(tmpE).premultiply(pitchQ);
      tp = cp; tq = cq; tPose = POSE.carry;
    }
    if (T >= 0) {
      var ev = clip.ev, cap = torch.userData.capPivot, ringG = torch.userData.ring, hp = null, hq = null, hPose = null, hk = 0;
      function once(k2, at) { if (T >= at && !ev[k2]) { ev[k2] = 1; return true; } return false; }
      // --- the lid: the ring's quarter turn, the lid on its sprung hinge ---
      var turn = -1.05 * (seg(T, 0.50, 0.72) - seg(T, 2.42, 2.66)), sw = T - 0.735, lidA = 0;
      if (T < 2.1) lidA = sw > 0 ? 1.83 * (1 - Math.exp(-sw * 11) * Math.cos(sw * 24)) : 0;
      else { var cl = clamp((T - 2.1) / 0.17, 0, 1); lidA = 1.83 * (1 - cl * cl) + (T > 2.27 ? Math.exp(-(T - 2.27) * 30) * Math.sin((T - 2.27) * 50) * 0.05 : 0); }
      ringG.rotation.z = turn; cap.quaternion.setFromAxisAngle(RL.hinge, lidA);
      torch.updateWorldMatrix(true, false); camInv.copy(camera.matrixWorld).invert(); rlM.multiplyMatrices(camInv, torch.matrixWorld); rlM.decompose(rlTP, rlTQ, rlTS);
      rlAx.set(0, 0, -1).applyQuaternion(rlTQ);                                   // the bore, from the tail toward the head (camera space)
      // --- the dead cell: nudged out by the spring as the lid opens, then down the bore and away as the tail drops ---
      if (T < 0.74) H.spent.visible = false;
      else if (!rlFall) {
        var sl = Math.max(0, T - 0.9), zs = CELL_SEAT + seg(T, 0.735, 0.78) * 0.004 + sl * sl * 3.6;
        H.spent.visible = true; cellOnAxis(H.spent, zs, sl * 5); rlG.copy(rlP);
        if (zs > 0.03) { rlFall = { p: rlG.clone(), v: rlVel.subVectors(rlG, rlPrev).multiplyScalar(1 / Math.max(dt, 1e-3)).clone(), q: rlQ.clone(), s: 0 }; rlFall.v.clampLength(0, 1.6); }
        rlPrev.copy(rlG);
      } else {                                                                    // clear of the torch: it falls
        rlG.set(0, -9.8, 0).applyQuaternion(rlQ2.copy(camera.quaternion).invert()); rlFall.v.addScaledVector(rlG, dt); rlFall.p.addScaledVector(rlFall.v, dt); rlFall.s += dt * 9;
        rlQ.copy(rlFall.q).multiply(rlQ2.setFromAxisAngle(XAX, rlFall.s)); H.spent.position.copy(rlFall.p); H.spent.quaternion.copy(rlQ); H.spent.visible = rlFall.p.y > -0.9;
      }
      // --- the left hand ---
      rlU.copy(RL.uL).applyQuaternion(rlTQ);                                      // the side of the bore the forefinger works from
      if (T < 1.1 || T >= 2.12) {
        // on the locking ring: pinched across it, turning with it (the wrist starts wound back so the turn ends comfortable)
        var first = T < 1.1, roll = turn + 0.5;
        rlU.applyAxisAngle(rlAx, roll); rlP.copy(rlTP).addScaledVector(rlAx, 0.0125 * 1.1);
        if (first && T > 0.76 && clip.hp) { hp = clip.hp; hq = clip.hq; }                    // let go: the hand stays where it was as the lid flies up
        else { pinchHand(RL.ring, rlP, rlAx, rlU, rlHand); hp = rlHand.pos; hq = rlHand.q; if (first) { clip.hp = hp.clone(); clip.hq = hq.clone(); } }
        hPose = first ? mixPose(RL.ringOpen, RL.ring.pose, seg(T, 0.36, 0.5) * (1 - seg(T, 0.73, 0.8)), []) : mixPose(RL.ringOpen, RL.ring.pose, seg(T, 2.33, 2.42) * (1 - seg(T, 2.67, 2.74)), []);
        hk = first ? seg(T, 0.14, 0.5) * (1 - seg(T, 0.78, 1.08)) : (1 - seg(T, 2.7, 3.02));
        if (!first) {                                                             // coming across from the cell: back off the bore first, then onto the ring
          var w2 = clip.hp2 ? easeIO(clamp((T - 2.12) / 0.3, 0, 1)) : 1; if (!clip.hp2) { clip.hp2 = hp; clip.hq2 = hq; } hp = clip.hp2.clone().lerp(hp, w2); hq = clip.hq2.clone().slerp(hq, w2); hPose = mixPose(RL.open, hPose, w2, hPose);
        }
        H.spare.visible = T >= 2.12; if (T >= 2.12) cellOnAxis(H.spare, CELL_SEAT, 0);
      } else if (T >= 1.18) {
        // the fresh cell, between the pads of the thumb and the forefinger: up from the pouch, onto the bore's axis, in with a quarter twist, pressed home
        var inK = easeIO(clamp((T - 1.6) / 0.36, 0, 1)), press = bump3(T, 1.9, 1.965, 1.975, 2.03) * 0.0028, zc = lerp(CELL_FROM, CELL_SEAT, inK) - press, tw = (1 - easeIO(clamp((T - 1.62) / 0.36, 0, 1))) * 0.85;
        var arrive = easeIO(clamp((T - 1.2) / 0.4, 0, 1)), held = T < 2.0;
        rlU.applyAxisAngle(rlAx, tw); rlP.copy(rlTP).addScaledVector(rlAx, -zc * 1.1 - CELL_OFF);
        pinchHand(RL.cell, rlP, rlAx, rlU, rlHand);
        if (!held) {                                                              // open the fingers and draw the hand straight back off the cell
          var back = seg(T, 2.0, 2.12); rlHand.pos.addScaledVector(rlAx, -back * 0.028); clip.hp2 = rlHand.pos.clone(); clip.hq2 = rlHand.q.clone();
        }
        hp = rlHand.pos; hq = rlHand.q; hk = arrive; hPose = held ? RL.cell.pose : mixPose(RL.cell.pose, RL.open, seg(T, 2.0, 2.08), []);
        H.spare.visible = true;
        if (arrive >= 1) cellOnAxis(H.spare, zc, tw);
        else {                                                                    // still on its way: the cell goes wherever the pinch is
          var cpos = tp.clone().lerp(hp, hk), cq = tq.clone().slerp(hq, hk);
          rlC.set(-RL.cell.c.x, RL.cell.c.y, RL.cell.c.z).applyQuaternion(cq).add(cpos); rlA.set(-RL.cell.a.x, RL.cell.a.y, RL.cell.a.z).applyQuaternion(cq); rlD.set(-RL.cell.d.x, RL.cell.d.y, RL.cell.d.z).applyQuaternion(cq);
          rlC.addScaledVector(rlA, CELL_OFF); rlN.copy(rlA).negate(); rlN2.crossVectors(rlN, rlD); rlM1.makeBasis(rlD, rlN2, rlN); rlQ.setFromRotationMatrix(rlM1);
          H.spare.position.copy(rlC); H.spare.quaternion.copy(rlQ);
        }
      } else H.spare.visible = false;
      if (hp) { tp = tp.clone().lerp(hp, hk); tq = tq.clone().slerp(hq, hk); tPose = mixPose(tPose, hPose, T >= 1.18 && T < 2.12 ? 1 : clamp(hk * 1.6, 0, 1), []); }      // (the cell is pinched from the moment it leaves the pouch)
      // --- what it sounds like ---
      if (once('grip', 0.5)) Sound.noise(0.05, 3200, 0.05);
      if (once('unlock', 0.7)) Sfx.play('rocker', { vol: 0.45, rate: 1.25, fallback: function () { Sound.tone(1500, 900, 0.03, 0.1, 'square'); } });
      if (once('lid', 0.75)) { Sound.tone(2100, 1400, 0.04, 0.07, 'triangle'); Sound.noise(0.05, 5200, 0.08); }
      if (once('slide', 0.93)) Sound.noise(0.16, 3600, 0.07);
      if (once('drop', 1.5)) { Sound.tone(950, 520, 0.05, 0.07, 'square'); Sound.noise(0.06, 3000, 0.07, 0.07); Sound.tone(820, 480, 0.04, 0.04, 'square', 0.16); }
      if (once('in', 1.64)) Sound.noise(0.3, 2600, 0.06);
      if (once('seat', 1.95)) { Sound.tone(420, 260, 0.05, 0.12, 'triangle'); Sound.noise(0.04, 1800, 0.1); }
      if (once('shut', 2.27)) { Sfx.play('rocker', { vol: 0.5, rate: 0.85, fallback: function () { Sound.clunk(); } }); Sound.noise(0.04, 2400, 0.12); }
      if (once('lock', 2.64)) Sfx.play('rocker', { vol: 0.55, rate: 1.1, fallback: function () { Sound.tone(1300, 800, 0.03, 0.12, 'square'); } });
      clipT += dt;
      if (clipT >= RELOAD) { clipT = -1; H.spare.visible = H.spent.visible = false; ringG.rotation.z = 0; cap.quaternion.identity(); rlFall = null; var cd = clip.done; clip = null; if (cd) cd(); }
    } else if (use) {
      var u = use; u.t += dt; u.alive -= dt;
      if (u.alive <= 0 && !u.leaving) { u.leaving = true; u.out = 0; }
      if (u.poseAt) u.pose = u.poseAt(u.t, u);                                     // a long move may change the hand's shape and turn as it goes
      if (u.rotAt) u.rot = u.rotAt(u.t, u);
      var pt = u.point ? u.point() : null;
      if (pt) {
        var hv = new V().copy(pt); if (u.move) hv.add(u.move(u.t, u)); camera.worldToLocal(hv);
        tmpE.set(u.rot[0], u.rot[1], u.rot[2] + (u.spin || 0), 'YXZ'); var uq = new Q().setFromEuler(tmpE); if (u.body) uq.premultiply(pitchQ);
        var to = u.tip.clone(); to.x = -to.x; to.applyQuaternion(uq);
        var inn = easeIO(clamp(u.t / u.reach, 0, 1)), pr = u.press ? Math.sin(clamp((u.t - u.reach) / 0.16, 0, 1) * PI) * u.press : 0;
        hv.sub(to); hv.z -= pr;
        if (!u.touched && u.t >= u.reach) { u.touched = true; if (u.onTouch) u.onTouch(); }
        if (u.leaving) { u.out += dt; var o2 = easeIO(clamp(u.out / u.outT, 0, 1)); tp = hv.clone().lerp(tp, o2); tq = uq.clone().slerp(tq, o2); tPose = mixPose(u.pose, tPose, o2, []); if (u.out >= u.outT) use = null; }
        else { tp = u.from.pos.clone().lerp(hv, inn); tq = u.from.q.clone().slerp(uq, inn); tPose = mixPose(u.from.pose, u.pose, inn, []); }
        H.tipCam.copy(u.tip); H.tipCam.x = -H.tipCam.x; H.tipCam.applyQuaternion(tq).add(tp);          // where the working part of the hand is now (camera space)
      } else use = null;
    }
    /* Holding an object exactly: H.hold = { inv: inverse of the object's matrix in the left hand's frame, world(): where the
       object must be (a world matrix), want: 0..1, rate }.  The hand goes wherever puts the object there; k blends it in and out. */
    if (H.hold) {
      var Ho = H.hold;
      if (Ho.k === undefined && lastHold && lastHold.k > 0.4 && lastHold.ho !== Ho) Ho.base = { pos: lastHold.pos.clone(), q: lastHold.q.clone(), pose: lastHold.pose.slice() };   // one hold straight into the next
      if (Ho.base && Ho.want === 0) Ho.base = null;
      if (Ho.base) { tp = Ho.base.pos; tq = Ho.base.q; tPose = Ho.base.pose; }
      if (Ho.speed) { var kd = Ho.want - (Ho.k || 0); Ho.k = (Ho.k || 0) + clamp(kd, -Ho.speed * dt, Ho.speed * dt); }          // a fixed-length move (grips: arrive open, then close)
      else { Ho.k = damp(Ho.k || 0, Ho.want, Ho.rate || 5, dt); if (Math.abs(Ho.k - Ho.want) < 0.004) Ho.k = Ho.want; }
      if (Ho.k > 0.001) {
        var Wm = Ho.world(); hM.copy(Wm).multiply(Ho.invAt ? Ho.invAt(Wm, Ho.k) : Ho.inv);          // invAt: the held thing may turn in the hand
        camInv.copy(camera.matrixWorld).invert(); hM.premultiply(camInv).multiply(MIRX); hM.decompose(hP, hQ2, hS);
        var kp = Ho.posK ? Ho.posK(Ho.k) : Ho.k;
        tp = tp.clone().lerp(hP, kp); tq = tq.clone().slerp(hQ2, kp); tPose = mixPose(tPose, (Ho.poseAt && Ho.poseAt(Ho.k)) || Ho.pose || POSE.carry, kp, []);
      }
      lastHold = { pos: tp.clone(), q: tq.clone(), pose: tPose.slice(), k: Ho.k, ho: Ho };
      if (Ho.k === 0 && Ho.want === 0 && Ho.done) { var dn = Ho.done; H.hold = null; dn(); } else if (Ho.k === 0 && Ho.want === 0) H.hold = null;
    } else lastHold = null;
    Lcur.pos.copy(tp); Lcur.q.copy(tq); Lcur.pose = tPose;
    solveArm('L', tp, tq, tq, 0.95, rootQ, wristQ);
    L.root.position.copy(tp); L.root.quaternion.copy(rootQ); L.hand.quaternion.copy(wristQ); applyPose(L, tPose);
    UA.L.visible = UA.R.visible = true;
    /* A cinematic can take the staff card out of the hand's frame and place it exactly (in the swipe slot): it rides on the
       camera for that time (never on the mirrored left hand's frame, which would flip its printing). */
    var cw = H.cardHold && H.card.visible ? H.cardHold() : null;
    if (cw) {
      if (H.card.parent !== camera) camera.add(H.card);
      H.card.position.copy(cw.p); camera.worldToLocal(H.card.position); H.card.quaternion.copy(camera.quaternion).invert().multiply(cw.q);
    } else if (H.card.parent !== L.hand) { L.hand.add(H.card); H.card.position.set(-0.062, -0.022, -0.118); H.card.rotation.set(0.2, 0.25, 1.45); }
    H.block = block;
  };
  H.setLight = function (on) { lightOn = on; };

  H.applyPose = applyPose; H.POSE = POSE; H.mixPose = mixPose;
  /* Gripping a bar with the left hand (a gate pale, a rail, a lever): the knuckle line runs along the bar, the index finger
     uppermost, the back of the hand turned out, and every finger laid round the bar at its real radius (wrapFingers).
     o.at() is a point on the bar's axis (world), o.axis() its direction pointing up the bar, o.from() where the arm comes from
     (world; the camera will do).  Returns an H.hold: set H.hold to it; want 0 lets go. */
  var BAR_P = new V(0.0, -0.035, -0.079), BAR_D = new V(1, 0, 0);
  H.thumbArc = -0.8; H.thumbArc2 = 0.4;
  H.barPose = function (r) {
    var w = wrapFingers(BAR_P, BAR_D, r), p = POSE.grip.slice(); for (var k = 0; k < 12; k++) p[5 + k] = w[k];
    p[0] = 0.32; p[1] = 0.3; p[2] = 0.35; p[3] = 0.42; p[4] = 0.5;                       // the thumb closes over the front of the bar
    return p;
  };
  H.barGrip = function (o) {
    var M = new THREE.Matrix4(), ex = new V(), ey = new V(), ez = new V(), bp = new V(), F = new V();
    var closed = H.barPose(o.r || 0.013), open = POSE.barOpen, tmpPose = [];
    return { kind: 'bar', inv: new THREE.Matrix4(), want: 1, speed: 1 / (o.dur || 0.6), reach: o.at, leanMax: o.leanMax || 0.12,
      posK: function (k) { return easeIO(clamp(k / 0.72, 0, 1)); },                                       // the open hand travels to the bar...
      poseAt: function (k) { var u = sstep((k - 0.72) / 0.28); mixPose(open, closed, u, tmpPose); tmpPose[1] += H.thumbArc * Math.sin(u * PI); tmpPose[0] += H.thumbArc2 * Math.sin(u * PI); return tmpPose; },   // ...then the fingers close round it (the thumb arcs over the bar)
      world: function () {
        var P = o.at(), A = o.axis(); F.copy(P).sub(o.from());
        ex.copy(A).negate();
        ez.copy(F).negate(); ez.addScaledVector(ex, -ez.dot(ex)).normalize();
        if (o.twist) ez.applyAxisAngle(ex, o.twist);                                    // turn the hand round the bar (knuckles more up or more out)
        ey.crossVectors(ex, ez);
        M.makeBasis(ex, ey, ez); bp.copy(BAR_P).applyMatrix4(M);
        var back = 0.075 * (1 - sstep(((this.k || 0) - 0.45) / 0.35));                                // short of the bar while the hand is open
        M.setPosition(P.x - bp.x + ez.x * back, P.y - bp.y + ez.y * back, P.z - bp.z + ez.z * back);
        return M;
      } };
  };
  H.setVisible = function (v) { H.visible = v; rig.visible = v; };
  H.update(0, {});
  return H;
})();
