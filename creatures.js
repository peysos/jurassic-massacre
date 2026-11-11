/* Jurassic Massacre — creatures: models, the plaza skeleton, pathfinding and AI. */
'use strict';

// ---------- skins ----------
var raptorSkin = std(0xffffff, 0.6, { map: skinTex('#56633c', '#1b2313', '#7c8650', '#b7ab82', 8), bumpMap: scales(9, 16), bumpScale: 0.013 });
var rexSkin = std(0xffffff, 0.66, { map: skinTex('#5b4a36', '#21170e', '#7d6951', '#a9967a', 6), bumpMap: scales(11, 18), bumpScale: 0.016 });
var seaSkin = std(0xffffff, 0.24, { map: skinTex('#2b414e', '#0c161c', '#496571', '#c5cfc8', 0), bumpMap: scales(10, 16), bumpScale: 0.02, metalness: 0.15 });
var wingSkin = std(0xffffff, 0.7, { map: skinTex('#4e3d33', '#19110c', '#6d5747', '#8b7968', 0), bumpMap: scales(6, 6), bumpScale: 0.02, side: THREE.DoubleSide });
var clawMat = std(0x14130e, 0.35), toothMat = std(0xa99f82, 0.42), mouthMat = std(0x26090c, 0.42, { bumpMap: bump(4), bumpScale: 0.004 }), hornMat = std(0x8a7a5a, 0.5);
var palateMat = std(0x190608, 0.5, { bumpMap: bump(6), bumpScale: 0.006 }), throatMat = std(0x12030a, 0.6), quillMat = std(0x2a2418, 0.7, { side: THREE.DoubleSide });
var eyeMat = basic(0xffb028, { fog: false }), pupilMat = basic(0x000000);
var sphGeo = new THREE.SphereGeometry(0.5, 18, 14);
function part(geo, m, x, y, z, parent, sx, sy, sz) {
  var me = mesh(geo, m, x, y, z, parent); if (sx) me.scale.set(sx, sy, sz); me.castShadow = true; me.receiveShadow = true; return me;
}
function cone(r, h, m, x, y, z, parent, rx, rz) { var c = part(new THREE.ConeGeometry(r, h, 6), m, x, y, z, parent); if (rx) c.rotation.x = rx; if (rz) c.rotation.z = rz; return c; }
function eyeballs(head, x, y, z, r) {
  [-1, 1].forEach(function (sd) {
    mesh(new THREE.SphereGeometry(r, 10, 10), eyeMat, sd * x, y, z, head);
    var pu = mesh(new THREE.SphereGeometry(r * 0.62, 8, 8), pupilMat, sd * (x + r * 0.5), y, z + r * 0.52, head); pu.scale.set(0.42, 1.25, 0.42); pu.rotation.y = sd * 0.75;             // a slit pupil, set forward and out, the way a hunter's eye sits
    part(sphGeo, head.userData.skin, sd * x * 0.93, y + r * 1.25, z, head, r * 3.2, r * 1.3, r * 4);            // brow
  });
}

// ---------- raptor / tyrannosaur ----------
function buildDino(rex) {
  var g = new THREE.Group(), skin = rex ? rexSkin : raptorSkin, k, body = new THREE.Group(); g.add(body);
  var F = rex ? 1.32 : 1, NK = rex ? 1.42 : 1;              // the rex is built heavier everywhere, and its neck is a column of muscle
  tube([[0, 1.5, -0.78, 0.15 * F, 0.18 * F], [0, 1.5, -0.42, 0.3 * F, 0.36 * F], [0, 1.45, 0.1, 0.35 * F, 0.43 * F], [0, 1.47, 0.55, 0.31 * F, 0.39 * F],
        [0, 1.6, 0.88, 0.22 * F * NK, 0.27 * F * NK], [0, 1.88, 1.1, 0.155 * F * NK, 0.19 * F * NK], [0, 2.14, 1.22, 0.125 * F * NK, 0.15 * F * NK], [0, 2.3, 1.28, 0.11 * F * NK, 0.125 * F * NK]], skin, body, 18, 5);
  if (!rex) for (k = 0; k < 11; k++) {                       // quill crest down the neck and back
    var t = k / 10, qz = 1.2 - t * 1.9, qy = t < 0.25 ? 2.42 - t * 2.6 : 1.9 - (t - 0.25) * 0.05;
    cone(0.02, 0.2 + Math.sin(t * PI) * 0.16, hornMat, 0, qy + (t < 0.25 ? 0 : 0), qz, body, -0.7);
  }
  // head
  var head = new THREE.Group(); head.position.set(0, 2.32, 1.3); head.userData.skin = skin; body.add(head);
  if (rex) head.scale.setScalar(1.85);
  var hy = rex ? 1.28 : 1;
  tube([[0, 0.02, -0.22, 0.06, 0.06], [0, 0.04, -0.08, 0.15, 0.14 * hy], [0, 0.04, 0.1, 0.165, 0.15 * hy], [0, 0.01, 0.32, 0.13, 0.115 * hy],
        [0, -0.01, 0.52, 0.1, 0.09 * hy], [0, -0.02, 0.66, 0.075, 0.065 * hy], [0, -0.03, 0.73, 0.03, 0.03]], skin, head, 14, 4);
  var jaw = new THREE.Group(); jaw.position.set(0, -0.075, -0.04); head.add(jaw);
  tube([[0, -0.01, -0.02, 0.1, 0.045], [0, -0.05, 0.25, 0.11, 0.055 * hy], [0, -0.05, 0.5, 0.085, 0.045 * hy], [0, -0.04, 0.68, 0.035, 0.03]], skin, jaw, 12, 4);
  // the inside of the mouth: a dark throat, a ribbed palate above, the floor of the mouth and a tongue below
  part(sphGeo, throatMat, 0, -0.03, 0.03, head, 0.2, 0.17 * hy, 0.2); tube([[0, -0.064 * hy, 0.08, 0.105, 0.008], [0, -0.064 * hy, 0.32, 0.092, 0.008], [0, -0.066 * hy, 0.52, 0.058, 0.007], [0, -0.066 * hy, 0.64, 0.028, 0.005]], palateMat, head, 8, 3);
  tube([[0, -0.012, 0.06, 0.078, 0.006], [0, -0.014, 0.28, 0.082, 0.006], [0, -0.014, 0.48, 0.058, 0.006], [0, -0.012, 0.6, 0.026, 0.005]], palateMat, jaw, 8, 3);
  tube([[0, -0.004, 0.04, 0.046, 0.012], [0, 0.004, 0.22, 0.042, 0.015], [0, 0.002, 0.38, 0.028, 0.011], [0, -0.002, 0.47, 0.008, 0.005]], mouthMat, jaw, 8, 3);
  var tg = new THREE.ConeGeometry(rex ? 0.015 : 0.011, rex ? 0.078 : 0.052, 7);
  for (k = 0; k < 11; k++) [-1, 1].forEach(function (sd) {
    var tz = 0.18 + k * 0.047, w = 0.127 - k * 0.0086;
    part(tg, toothMat, sd * w, -0.085 * hy, tz, head).rotation.x = PI;
    part(tg, toothMat, sd * (w - 0.018), 0.012, tz + 0.02, jaw);
  });
  eyeballs(head, 0.132, 0.085, 0.14, 0.036);
  [-1, 1].forEach(function (sd) { mesh(new THREE.SphereGeometry(0.014, 6, 6), pupilMat, sd * 0.04, 0.012, 0.69, head); });
  if (rex) {
    [-1, 1].forEach(function (sd) { var cr = part(sphGeo, skin, sd * 0.118, 0.158, 0.1, head, 0.05, 0.05, 0.13); cr.rotation.z = sd * 0.5; });                                         // crests over the eyes
  }
  // tail in two jointed sections
  var T = rex ? 1.45 : 1;
  var tail1 = new THREE.Group(); tail1.position.set(0, 1.5, -0.72); body.add(tail1);
  tube([[0, 0, 0.08, 0.2 * T, 0.24 * T], [0, 0.02, -0.6, 0.15 * T, 0.17 * T], [0, 0.05, -1.3, 0.1 * T, 0.115 * T]], skin, tail1, 14, 4);
  var tail2 = new THREE.Group(); tail2.position.set(0, 0.05, -1.28); tail1.add(tail2);
  tube([[0, 0, 0.04, 0.1 * T, 0.115 * T], [0, 0.04, -0.9, 0.05 * T, 0.055 * T], [0, 0.08, -1.85, 0.012, 0.012]], skin, tail2, 12, 4);
  // legs: hip > knee > ankle
  var L = rex ? 1.25 : 1;
  var legs = [-1, 1].map(function (sd) {
    var hip = new THREE.Group(); hip.position.set(sd * 0.3 * F, 1.42, -0.32); body.add(hip);
    tube([[0, 0.12, -0.02, 0.1 * L, 0.15 * L], [0, -0.2, 0.08, 0.165 * L, 0.25 * L], [0, -0.5, 0.16, 0.095 * L, 0.125 * L]], skin, hip, 12, 4);
    var knee = new THREE.Group(); knee.position.set(0, -0.5, 0.16); hip.add(knee);
    tube([[0, 0.03, 0, 0.085 * L, 0.105 * L], [0, -0.3, -0.12, 0.06 * L, 0.075 * L], [0, -0.56, -0.22, 0.045 * L, 0.05 * L]], skin, knee, 10, 4);
    var ankle = new THREE.Group(); ankle.position.set(0, -0.56, -0.22); knee.add(ankle);
    tube([[0, 0.02, 0, 0.045 * L, 0.05 * L], [0, -0.28, 0.1, 0.04 * L, 0.048 * L], [0, -0.33, 0.14, 0.05 * L, 0.035 * L]], skin, ankle, 10, 3);
    [-1, 0, 1].forEach(function (tn) {
      var tx = tn * 0.075 * L;
      tube([[tx * 0.4, -0.31, 0.12, 0.034 * L, 0.03 * L], [tx * 1.2, -0.325, 0.32, 0.028 * L, 0.024 * L], [tx * 1.5, -0.33, 0.45, 0.014, 0.014]], skin, ankle, 8, 3);
      cone(0.02 * L, 0.12 * L, clawMat, tx * 1.6, -0.335, 0.5, ankle, 1.75);
    });
    if (!rex) { var sc = cone(0.026, 0.26, clawMat, -sd * 0.07, -0.2, 0.3, ankle, 0.7); sc.scale.z = 0.6; }                    // the sickle claw
    return { hip: hip, knee: knee, ankle: ankle };
  });
  // arms
  [-1, 1].forEach(function (sd) {
    var A = rex ? 0.5 : 1, arm = new THREE.Group(); arm.position.set(sd * 0.27 * F, 1.36, 0.74); arm.scale.setScalar(A); body.add(arm);
    tube([[0, 0.02, 0, 0.055, 0.06], [sd * 0.03, -0.22, -0.08, 0.045, 0.05], [sd * 0.04, -0.36, -0.1, 0.035, 0.04]], skin, arm, 8, 3);
    tube([[sd * 0.04, -0.36, -0.1, 0.035, 0.04], [sd * 0.03, -0.42, 0.14, 0.03, 0.033], [sd * 0.02, -0.5, 0.3, 0.026, 0.028]], skin, arm, 8, 3);
    for (var c = 0; c < (rex ? 2 : 3); c++) cone(0.016, 0.13, clawMat, sd * (0.02 + (c - 1) * 0.03), -0.56, 0.36, arm, 2.2);
    if (!rex) for (c = 0; c < 6; c++) { var qf = part(new THREE.ConeGeometry(0.03, 0.26 + c * 0.02, 4), quillMat, sd * 0.055, -0.4 - c * 0.012, 0.0 + c * 0.05, arm); qf.scale.z = 0.12; qf.rotation.set(-2.0, 0, sd * 0.25); }      // quills along the forearm
  });
  if (!rex) for (k = 0; k < 7; k++) { var tf = part(new THREE.ConeGeometry(0.035, 0.34, 4), quillMat, 0, 0.08, -1.7 - k * 0.02, tail2); tf.scale.z = 0.1; tf.rotation.set(-PI / 2, 0, (k - 3) * 0.3); tf.rotation.order = 'ZXY'; }      // a fan of quills at the tail tip
  g.scale.setScalar(rex ? 2.9 : 1);
  g.userData = { legs: legs, tail1: tail1, tail2: tail2, head: head, jaw: jaw, body: body };
  scene.add(g);
  return g;
}

// ---------- plesiosaur ----------
function buildPlesiosaur() {
  var g = new THREE.Group(), k;
  tube([[0, 0, -4.7, 0.02, 0.02], [0, 0, -3.7, 0.26, 0.2], [0, 0, -2.4, 0.78, 0.5], [0, -0.03, -1, 1.18, 0.74], [0, -0.03, 0.4, 1.18, 0.76], [0, 0.03, 1.6, 0.82, 0.58], [0, 0.18, 2.35, 0.46, 0.42]], seaSkin, g, 22, 6);
  for (k = 0; k < 9; k++) cone(0.05, 0.16, seaSkin, 0, 0.72 - Math.abs(k - 4) * 0.05, -1.9 + k * 0.42, g);                       // low ridge along the spine
  var neck = new THREE.Group(); neck.position.set(0, 0.18, 2.3); g.add(neck);
  tube([[0, 0, -0.1, 0.44, 0.4], [0, 0.22, 0.9, 0.31, 0.29], [0, 0.72, 1.8, 0.24, 0.23], [0, 1.28, 2.6, 0.2, 0.2], [0, 1.62, 3.15, 0.17, 0.17]], seaSkin, neck, 16, 6);
  var head = new THREE.Group(); head.position.set(0, 1.64, 3.1); head.userData.skin = seaSkin; neck.add(head);
  tube([[0, 0, -0.2, 0.1, 0.1], [0, 0.03, 0.02, 0.24, 0.19], [0, 0.03, 0.3, 0.23, 0.17], [0, 0, 0.62, 0.15, 0.11], [0, -0.02, 0.92, 0.1, 0.07], [0, -0.03, 1.08, 0.04, 0.035]], seaSkin, head, 14, 4);
  var jaw = new THREE.Group(); jaw.position.set(0, -0.1, -0.02); head.add(jaw);
  tube([[0, 0, -0.04, 0.17, 0.06], [0, -0.04, 0.35, 0.18, 0.07], [0, -0.04, 0.72, 0.11, 0.05], [0, -0.03, 1.02, 0.04, 0.03]], seaSkin, jaw, 12, 4);
  part(sphGeo, throatMat, 0, -0.02, 0.05, head, 0.3, 0.22, 0.3); tube([[0, -0.09, 0.1, 0.19, 0.01], [0, -0.09, 0.38, 0.18, 0.01], [0, -0.085, 0.68, 0.11, 0.008], [0, -0.075, 0.96, 0.045, 0.006]], palateMat, head, 8, 3);
  tube([[0, 0.0, 0.08, 0.13, 0.008], [0, 0.0, 0.38, 0.14, 0.008], [0, 0.0, 0.7, 0.085, 0.007], [0, 0.0, 0.94, 0.03, 0.005]], palateMat, jaw, 8, 3);
  tube([[0, 0.01, 0.06, 0.08, 0.016], [0, 0.02, 0.4, 0.07, 0.02], [0, 0.014, 0.74, 0.04, 0.012], [0, 0.006, 0.9, 0.01, 0.006]], mouthMat, jaw, 8, 3);
  var tg = new THREE.ConeGeometry(0.014, 0.15, 5);                                   // long interlocking needle teeth
  for (k = 0; k < 11; k++) [-1, 1].forEach(function (sd) {
    var tz = 0.22 + k * 0.078, w = 0.2 - k * 0.015;
    var up = part(tg, toothMat, sd * w, -0.11, tz, head); up.rotation.x = PI; up.rotation.z = sd * 0.25;
    part(tg, toothMat, sd * (w - 0.01), 0.04, tz + 0.04, jaw).rotation.z = -sd * 0.25;
  });
  eyeballs(head, 0.2, 0.1, 0.12, 0.045);
  var xAxis = new THREE.Vector3(0, 0, 1);
  var flips = [[-1, 1.25, 1], [1, 1.25, 1], [-1, -1.3, 0.85], [1, -1.3, 0.85]].map(function (f) {
    var fl = new THREE.Group(); fl.position.set(f[0] * 0.95, -0.3, f[1]); fl.scale.setScalar(f[2]); g.add(fl);
    var s = f[0];
    tube([[0, 0, 0, 0.3, 0.16], [s * 0.6, -0.04, -0.08, 0.46, 0.12], [s * 1.5, -0.1, -0.3, 0.42, 0.075], [s * 2.3, -0.16, -0.62, 0.2, 0.04], [s * 2.65, -0.18, -0.8, 0.02, 0.02]], seaSkin, fl, 12, 5, xAxis);
    fl.userData.sd = s; return fl;
  });
  g.userData = { neck: neck, head: head, jaw: jaw, flips: flips };
  scene.add(g);
  return g;
}

// ---------- pterosaur ----------
function buildPterosaur() {
  var g = new THREE.Group();
  tube([[0, -0.02, -1.0, 0.03, 0.03], [0, 0, -0.6, 0.2, 0.18], [0, 0, 0, 0.28, 0.26], [0, 0.03, 0.45, 0.2, 0.2], [0, 0.18, 0.8, 0.1, 0.11], [0, 0.38, 1.05, 0.08, 0.085]], wingSkin, g, 12, 4);
  var head = new THREE.Group(); head.position.set(0, 0.42, 1.1); head.userData.skin = wingSkin; g.add(head);
  tube([[0, 0.02, -0.18, 0.05, 0.05], [0, 0.03, 0, 0.14, 0.13], [0, 0.01, 0.25, 0.1, 0.09], [0, -0.02, 0.8, 0.05, 0.045], [0, -0.04, 1.45, 0.012, 0.012]], hornMat, head, 10, 4);
  var jaw = new THREE.Group(); jaw.position.set(0, -0.07, 0.05); head.add(jaw);
  tube([[0, 0, 0, 0.08, 0.035], [0, -0.02, 0.6, 0.045, 0.028], [0, -0.03, 1.32, 0.01, 0.01]], hornMat, jaw, 8, 3);
  tube([[0, 0.1, 0.05, 0.03, 0.07], [0, 0.26, -0.35, 0.025, 0.11], [0, 0.4, -0.85, 0.012, 0.03]], std(0x8a2a22, 0.55), head, 8, 4);       // crest
  eyeballs(head, 0.11, 0.07, 0.08, 0.034);
  var wings = [-1, 1].map(function (sd) {
    var inner = new THREE.Group(); inner.position.set(sd * 0.2, 0.06, 0.25); g.add(inner);
    function membrane(pts, idx, parent) {
      var geo = new THREE.BufferGeometry(), uv = [];
      for (var i = 0; i < pts.length; i += 3) uv.push(Math.abs(pts[i]) / 4, (pts[i + 2] + 1) / 2);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      var m = mesh(geo, wingSkin, 0, 0, 0, parent); m.castShadow = true; return m;
    }
    membrane([0, 0, 0.2, sd * 1.75, 0, 0.3, sd * 1.7, 0, -0.75, 0, 0, -1.0, sd * 0.9, 0, -0.95], [0, 1, 4, 1, 2, 4, 0, 4, 3], inner);
    tube([[0, 0, 0.2, 0.05, 0.05], [sd * 0.9, 0.02, 0.36, 0.04, 0.04], [sd * 1.75, 0, 0.3, 0.03, 0.03]], wingSkin, inner, 6, 3);
    var outer = new THREE.Group(); outer.position.set(sd * 1.75, 0, 0.3); inner.add(outer);
    membrane([0, 0, 0, sd * 2.5, 0, -0.25, sd * 1.3, 0, -0.8, -sd * 0.05, 0, -1.05], [0, 1, 2, 0, 2, 3], outer);
    tube([[0, 0, 0, 0.03, 0.03], [sd * 1.3, 0.01, -0.06, 0.02, 0.02], [sd * 2.5, 0, -0.25, 0.008, 0.008]], wingSkin, outer, 6, 3);
    for (var c = 0; c < 3; c++) cone(0.012, 0.12, clawMat, sd * 0.02, 0, 0.1 + c * 0.03, outer, 1.3);
    inner.userData = { sd: sd, outer: outer }; return inner;
  });
  [-1, 1].forEach(function (sd) {
    tube([[sd * 0.12, -0.05, -0.6, 0.05, 0.05], [sd * 0.16, -0.3, -0.85, 0.03, 0.03], [sd * 0.16, -0.5, -0.75, 0.02, 0.02]], wingSkin, g, 6, 3);
    for (var c = -1; c <= 1; c++) cone(0.012, 0.1, clawMat, sd * 0.16 + c * 0.025, -0.55, -0.72, g, PI);
  });
  g.scale.setScalar(1.35); g.rotation.order = 'YXZ';
  g.userData = { wings: wings, head: head, jaw: jaw };
  scene.add(g);
  return g;
}

// ---------- the mounted Tyrannosaurus skeleton in the plaza ----------
function buildRexSkeleton(px, pz) {
  var g = new THREE.Group(), B = M.bone, steel = M.dark, up = new THREE.Vector3(0, 1, 0), dummy = new THREE.Object3D(), i;
  function between(a, b, r, mat, parent) {              // a bone shaft between two points, with knuckle ends
    var va = new THREE.Vector3(a[0], a[1], a[2]), vb = new THREE.Vector3(b[0], b[1], b[2]), d = vb.clone().sub(va), len = d.length();
    var m = mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 8), mat || B, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, parent || g);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    if (!mat) { mesh(new THREE.SphereGeometry(r * 1.45, 8, 6), B, a[0], a[1], a[2], parent || g); mesh(new THREE.SphereGeometry(r * 1.3, 8, 6), B, b[0], b[1], b[2], parent || g); }
    return m;
  }
  // spine: tail tip > hips > shoulders > base of the skull
  var spine = new THREE.CatmullRomCurve3([[2.3, -5.7], [2.75, -4.1], [3.15, -2.5], [3.36, -1.0], [3.3, 0.4], [3.14, 1.6], [3.5, 2.45], [4.02, 3.02]].map(function (p) { return new THREE.Vector3(0, p[0], p[1]); }));
  var NV = 54, verts = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), B, NV * 3), p = new THREE.Vector3(), t = new THREE.Vector3(), n = 0;
  for (i = 0; i < NV; i++) {
    var f = i / (NV - 1); spine.getPoint(f, p); spine.getTangent(f, t);
    var big = Math.sin(Math.min(1, f * 1.5) * PI * 0.5) * (f > 0.8 ? 0.75 : 1), w = 0.07 + 0.12 * big, pitch = -Math.atan2(t.y, t.z);
    dummy.position.copy(p); dummy.rotation.set(pitch, 0, 0); dummy.scale.set(w, w, 0.17); dummy.updateMatrix(); verts.setMatrixAt(n++, dummy.matrix);            // centrum
    var sh = 0.1 + 0.36 * big * (f > 0.25 && f < 0.75 ? 1 : 0.55);
    dummy.position.set(0, p.y + w / 2 + sh / 2, p.z); dummy.scale.set(0.035, sh, 0.11); dummy.updateMatrix(); verts.setMatrixAt(n++, dummy.matrix);              // neural spine
    dummy.position.set(0, p.y - w / 2 - 0.05, p.z); dummy.scale.set(f < 0.42 ? 0.03 : 0.2 * big, f < 0.42 ? 0.22 * big : 0.035, 0.07); dummy.updateMatrix(); verts.setMatrixAt(n++, dummy.matrix);   // chevron / side process
  }
  g.add(verts);
  // rib cage
  for (i = 0; i < 11; i++) {
    var fr = 0.6 + i * 0.022; spine.getPoint(fr, p);
    var sz = 0.55 + Math.sin(i / 10 * PI) * 0.5;
    [-1, 1].forEach(function (sd) {
      var c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, p.y, p.z), new THREE.Vector3(sd * 0.62 * sz, p.y - 0.28 * sz, p.z + 0.03), new THREE.Vector3(sd * 0.68 * sz, p.y - 1.0 * sz, p.z + 0.1), new THREE.Vector3(sd * 0.3 * sz, p.y - 1.62 * sz, p.z + 0.22)]);
      mesh(new THREE.TubeGeometry(c, 10, 0.034, 5), B, 0, 0, 0, g);
    });
  }
  // pelvis
  [-1, 1].forEach(function (sd) { part(sphGeo, B, sd * 0.26, 3.42, -1.0, g, 0.16, 0.6, 1.5); });
  between([0, 3.1, -0.85], [0, 1.95, -0.25], 0.07); part(sphGeo, B, 0, 1.92, -0.12, g, 0.16, 0.2, 0.5);                 // pubis and its boot
  between([0, 3.1, -1.15], [0, 2.3, -1.95], 0.06);
  // legs: one planted forward, one pushing off
  [[1, [0.46, 3.08, -1.0], [0.52, 1.95, -0.3], [0.52, 0.98, -0.95], [0.52, 0.16, -0.4]], [-1, [-0.46, 3.08, -1.0], [-0.52, 1.92, -0.75], [-0.52, 0.95, -1.7], [-0.52, 0.2, -1.2]]].forEach(function (l) {
    between(l[1], l[2], 0.115); between(l[2], l[3], 0.09); between([l[3][0] + 0.07, l[3][1], l[3][2]], [l[3][0] + 0.07, l[3][1] - 0.45, l[3][2] + 0.12], 0.05);
    between(l[3], l[4], 0.07);
    [-1, 0, 1].forEach(function (tn) { between(l[4], [l[4][0] + tn * 0.22, 0.06, l[4][2] + 0.62 - Math.abs(tn) * 0.12], 0.045); cone(0.045, 0.2, B, l[4][0] + tn * 0.25, 0.07, l[4][2] + 0.78 - Math.abs(tn) * 0.12, g, 1.7); });
  });
  // shoulder blades and the famously small arms
  [-1, 1].forEach(function (sd) {
    between([sd * 0.42, 3.05, 1.2], [sd * 0.5, 2.5, 1.75], 0.045);
    between([sd * 0.5, 2.5, 1.75], [sd * 0.5, 2.12, 1.58], 0.04); between([sd * 0.5, 2.12, 1.58], [sd * 0.47, 1.98, 1.88], 0.032);
    cone(0.025, 0.14, B, sd * 0.45, 1.93, 1.96, g, 2.2); cone(0.025, 0.14, B, sd * 0.5, 1.93, 1.96, g, 2.2);
  });
  // skull
  var skull = new THREE.Group(); skull.position.set(0, 4.1, 3.0); skull.rotation.x = 0.16; g.add(skull);
  tube([[0, 0, -0.38, 0.1, 0.12], [0, 0.06, -0.12, 0.31, 0.31], [0, 0.05, 0.34, 0.3, 0.28], [0, -0.01, 0.85, 0.23, 0.21], [0, -0.05, 1.3, 0.165, 0.15], [0, -0.07, 1.52, 0.07, 0.07]], B, skull, 14, 4);
  var hole = basic(0x040404);
  [-1, 1].forEach(function (sd) {
    mesh(sphGeo, hole, sd * 0.262, 0.11, 0.26, skull).scale.set(0.12, 0.26, 0.22);       // orbit
    mesh(sphGeo, hole, sd * 0.245, 0.0, 0.68, skull).scale.set(0.12, 0.24, 0.36);        // antorbital window
    mesh(sphGeo, hole, sd * 0.275, 0.1, -0.06, skull).scale.set(0.1, 0.22, 0.2);         // temporal window
    mesh(sphGeo, hole, sd * 0.13, 0.0, 1.32, skull).scale.set(0.1, 0.1, 0.16);           // nostril
  });
  var mand = new THREE.Group(); mand.position.set(0, -0.14, -0.12); mand.rotation.x = 0.3; skull.add(mand);
  [-1, 1].forEach(function (sd) { tube([[sd * 0.27, 0.04, -0.06, 0.035, 0.1], [sd * 0.25, -0.03, 0.6, 0.032, 0.085], [sd * 0.12, -0.04, 1.25, 0.03, 0.065], [0, -0.03, 1.45, 0.035, 0.055]], B, mand, 8, 4); });
  var teeth = new THREE.InstancedMesh(new THREE.ConeGeometry(0.022, 0.17, 5), std(0xe8e0c6, 0.4), 60), nt = 0;
  for (i = 0; i < 15; i++) [-1, 1].forEach(function (sd) {
    var tz = 0.3 + i * 0.082, w = 0.27 - Math.max(0, i - 5) * 0.022;
    dummy.position.set(sd * w, -0.26 + (i > 10 ? 0.05 : 0), tz); dummy.rotation.set(PI, 0, sd * 0.15); dummy.scale.setScalar(1 + Math.sin(i / 14 * PI) * 0.5); dummy.updateMatrix(); teeth.setMatrixAt(nt++, dummy.matrix);
  });
  teeth.count = nt; skull.add(teeth);
  var teeth2 = new THREE.InstancedMesh(new THREE.ConeGeometry(0.02, 0.14, 5), std(0xe8e0c6, 0.4), 60); nt = 0;
  for (i = 0; i < 13; i++) [-1, 1].forEach(function (sd) {
    dummy.position.set(sd * (0.25 - Math.max(0, i - 4) * 0.024), 0.1, 0.32 + i * 0.085); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1 + Math.sin(i / 12 * PI) * 0.4); dummy.updateMatrix(); teeth2.setMatrixAt(nt++, dummy.matrix);
  });
  teeth2.count = nt; mand.add(teeth2);
  var hat = new THREE.Group(); hat.position.set(0, 0.36, 0.1); hat.rotation.x = -0.25; hat.userData.keep = true; skull.add(hat);        // only shown once the secret is found
  mesh(new THREE.ConeGeometry(0.2, 0.55, 12), std(0xffffff, 0.6, { map: canvasTex(64, function (c, S) { for (var q = 0; q < 8; q++) { c.fillStyle = q % 2 ? '#ffd23a' : '#c8102e'; c.fillRect(0, q * 8, S, 8); } }) }), 0, 0.27, 0, hat);
  mesh(new THREE.SphereGeometry(0.06, 8, 8), std(0xffffff, 0.5), 0, 0.57, 0, hat);
  // museum mount
  between([0, 0, -1.0], [0, 3.2, -1.0], 0.07, steel); between([0, 0, 1.45], [0, 3.02, 1.45], 0.06, steel); between([0, 2.6, 2.3], [0, 3.4, 2.5], 0.04, steel); between([0, 0, 2.3], [0, 2.6, 2.3], 0.05, steel);
  g.position.set(px, 0.62, pz); g.rotation.y = -0.5; g.scale.setScalar(0.92); scene.add(g);
  return { group: g, hat: hat };
}

// ---------- pathfinding: a 2 m grid over the park, searched with A* ----------
var NAV = { n: 150, cell: 2, grids: [null, null], radius: [0.9, 2.5], sig: '', gen: 0, fails: 0,
  gCost: new Float32Array(22500), from: new Int32Array(22500), seen: new Uint32Array(22500), shut: new Uint32Array(22500) };
function navCell(x, z) { return clamp(Math.floor((z + WORLD) / 2), 0, 149) * 150 + clamp(Math.floor((x + WORLD) / 2), 0, 149); }
function navSignature() { var s = (P && P.esc ? 'E' : 'N'); for (var i = 0; i < boxes.length; i++) if (boxes[i].off) s += i + ','; return s; }
function buildNav() {
  var esc = !!(P && P.esc);
  for (var k = 0; k < 2; k++) {
    var r = NAV.radius[k], grid = new Uint8Array(22500), ix, iz, i;
    for (iz = 0; iz < 150; iz++) for (ix = 0; ix < 150; ix++) {
      var x = ix * 2 - WORLD + 1, z = iz * 2 - WORLD + 1, bad = Math.abs(x) > WORLD - 2 - r || Math.abs(z) > WORLD - 2 - r || inRect(x, z, AQ, r + 0.5);
      for (i = 0; !bad && i < boxes.length; i++) { var b = boxes[i]; if (!b.off && x > b.x1 - r && x < b.x2 + r && z > b.z1 - r && z < b.z2 + r) bad = true; }
      if (!bad && !esc && nearSafe(x, z, 2.2 + r)) bad = true;
      grid[iz * 150 + ix] = bad ? 1 : 0;
    }
    /* Round obstacles are stamped in afterwards.  A raptor slips between tree trunks, so only the big ones count for it;
       the rex is four metres wide and cannot, so every trunk counts and it keeps to the paths and clearings. */
    for (i = 0; i < circles.length; i++) {
      var c = circles[i]; if (c.top !== undefined || c.r < (k ? 0.3 : 1)) continue;
      var rr = c.r + r, x0 = Math.max(0, Math.floor((c.x - rr + WORLD) / 2)), x1 = Math.min(149, Math.floor((c.x + rr + WORLD) / 2)), z0 = Math.max(0, Math.floor((c.z - rr + WORLD) / 2)), z1 = Math.min(149, Math.floor((c.z + rr + WORLD) / 2));
      for (iz = z0; iz <= z1; iz++) for (ix = x0; ix <= x1; ix++) if (dist(ix * 2 - WORLD + 1, iz * 2 - WORLD + 1, c.x, c.z) < rr) grid[iz * 150 + ix] = 1;
    }
    NAV.grids[k] = grid;
  }
  NAV.sig = navSignature();
}
function freeCell(grid, x, z) {
  var c = navCell(x, z); if (!grid[c]) return c;
  var cx = c % 150, cz = (c / 150) | 0;
  for (var r = 1; r <= 6; r++) for (var dz = -r; dz <= r; dz++) for (var dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    var nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx > 149 || nz > 149) continue;
    if (!grid[nz * 150 + nx]) return nz * 150 + nx;
  }
  return -1;
}
function gridClear(grid, x1, z1, x2, z2) {
  var d = dist(x1, z1, x2, z2), steps = Math.ceil(d / 0.9);
  for (var i = 0; i <= steps; i++) { var f = steps ? i / steps : 0; if (grid[navCell(x1 + (x2 - x1) * f, z1 + (z2 - z1) * f)]) return false; }
  return true;
}
function findPath(kind, sx, sz, tx, tz) {
  var grid = NAV.grids[kind], s = freeCell(grid, sx, sz), goal = freeCell(grid, tx, tz);
  if (s < 0 || goal < 0) return null;
  var gx = goal % 150, gz = (goal / 150) | 0, gen = ++NAV.gen, g = NAV.gCost, from = NAV.from, seen = NAV.seen, shut = NAV.shut;
  var heap = [], hf = [];                                           // binary min-heap on f
  function push(c, f) { var i = heap.length; heap.push(c); hf.push(f); while (i > 0) { var p = (i - 1) >> 1; if (hf[p] <= f) break; heap[i] = heap[p]; hf[i] = hf[p]; i = p; } heap[i] = c; hf[i] = f; }
  function pop() {
    var top = heap[0], c = heap.pop(), f = hf.pop(), n = heap.length, i = 0;
    if (n) { for (;;) { var l = i * 2 + 1; if (l >= n) break; if (l + 1 < n && hf[l + 1] < hf[l]) l++; if (hf[l] >= f) break; heap[i] = heap[l]; hf[i] = hf[l]; i = l; } heap[i] = c; hf[i] = f; }
    return top;
  }
  function h(c) { var dx = Math.abs(c % 150 - gx), dz = Math.abs(((c / 150) | 0) - gz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); }
  g[s] = 0; seen[s] = gen; from[s] = -1; push(s, h(s));
  var found = false, iter = 0, best = s, bestH = h(s);
  while (heap.length && iter++ < 23000) {
    var c = pop(); if (shut[c] === gen) continue; shut[c] = gen;
    if (c === goal) { found = true; break; }
    var hc = h(c); if (hc < bestH) { bestH = hc; best = c; }                 // remember the nearest we can get, in case the goal is walled off
    var cx = c % 150, cz = (c / 150) | 0;
    for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      var nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx > 149 || nz > 149) continue;
      var nc = nz * 150 + nx; if (grid[nc] || shut[nc] === gen) continue;
      if (dx && dz && (grid[cz * 150 + nx] || grid[nz * 150 + cx])) continue;        // no cutting corners
      var ng = g[c] + (dx && dz ? 1.414 : 1);
      if (seen[nc] !== gen || ng < g[nc]) { g[nc] = ng; seen[nc] = gen; from[nc] = c; push(nc, ng + h(nc)); }
    }
  }
  if (!found) { NAV.fails++; if (best === s) return []; goal = best; }        // unreachable: go as near as the ground allows and wait there
  var cells = []; for (var q = goal; q >= 0; q = from[q]) cells.push(q);
  cells.reverse();
  var pts = cells.map(function (c2) { return [(c2 % 150) * 2 - WORLD + 1, ((c2 / 150) | 0) * 2 - WORLD + 1]; });
  if (found && !grid[navCell(tx, tz)]) pts[pts.length - 1] = [tx, tz];
  var out = [], cur = [sx, sz], i = 1;                              // string-pull: skip waypoints we can walk straight past
  while (i < pts.length) { var j = pts.length - 1; while (j > i && !gridClear(grid, cur[0], cur[1], pts[j][0], pts[j][1])) j--; out.push(pts[j]); cur = pts[j]; i = j + 1; }
  return out.length ? out : [pts[pts.length - 1]];
}

// ---------- dinosaurs: state ----------
var DINO_DEFS = [
  { kind: 'raptor', hx: -98, hz: 68,   hr: 18 }, { kind: 'raptor', hx: -52, hz: -24,  hr: 26 }, { kind: 'raptor', hx: 52, hz: 96, hr: 26 },
  { kind: 'raptor', hx: 25,  hz: -110, hr: 26 }, { kind: 'raptor', hx: -72, hz: 94,   hr: 18 }, { kind: 'raptor', hx: 48, hz: -24, hr: 28 },
  { kind: 'rex',    hx: 88,  hz: -92,  hr: 24 }
];
var dinos = DINO_DEFS.map(function (d) {
  var rex = d.kind === 'rex';
  return { kind: d.kind, rex: rex, hx: d.hx, hz: d.hz, hr: d.hr, active: true, mesh: buildDino(rex), nav: rex ? 1 : 0,
    r: rex ? 2.2 : 0.7, patrol: rex ? 3.2 : 2.4, chase: rex ? 7.9 : 7.3, vis: rex ? 36 : 28, ears: rex ? 1.3 : 1, catchD: rex ? 4.2 : 1.7,
    x: d.hx, z: d.hz, rot: Math.random() * 6, state: 'patrol', tx: d.hx, tz: d.hz, tT: 0, phase: Math.random() * 6, speedNow: 0 };
});
var rexDino = dinos[dinos.length - 1];
var ples = { x: 109, z: 62, rot: 0, state: 'patrol', ang: 0, notice: 0, stunT: 0, t: 0 }, plesMesh = buildPlesiosaur();
var ptero = { x: AV.x, y: 13, z: AV.z, state: 'perch', perch: 0, expo: 0, t: 0, stunT: 0, rot: 0, pitch: 0, warned: false }, pteroMesh = buildPterosaur();
var aiNearest = 999, aiChasing = 0, aiAlert = 0, shake = 0, sirenT = -99, pingT = 0, pingX = 0, pingZ = 0;

function domeY(x, z) { var d = dist(x, z, AV.x, AV.z) / AV.r; return AV.h * Math.sqrt(Math.max(0, 1 - d * d)); }
function underCover(x, z) { for (var i = 0; i < COVERS.length; i++) if (Math.abs(x - COVERS[i][0]) < 2.75 && Math.abs(z - COVERS[i][1]) < 2.75) return true; return false; }
function perchPos(i) { var p = PERCHES[i]; return [p[0], domeY(p[0], p[1]) - 1.5, p[1]]; }
function perchPtero() { var p = perchPos(ptero.perch); ptero.x = p[0]; ptero.y = p[1]; ptero.z = p[2]; ptero.expo = Math.min(ptero.expo, -1); ptero.warned = false; }
function pickPerch() {
  var best = 0, bd = 1e9, i;
  if (DIFF.omni) { for (i = 0; i < PERCHES.length; i++) { var d = dist(PERCHES[i][0], PERCHES[i][1], player.x, player.z); if (d < bd) { bd = d; best = i; } } }
  else { do { best = (Math.random() * PERCHES.length) | 0; } while (best === ptero.perch); }
  ptero.perch = best;
}
function pickTarget(d) {
  for (var i = 0; i < 16; i++) {
    var x, z;
    if (d.rex && !(P && P.esc)) { x = REX.x1 + Math.random() * (REX.x2 - REX.x1); z = REX.z1 + Math.random() * (REX.z2 - REX.z1); }
    else {
      var a = Math.random() * PI * 2, r = Math.sqrt(Math.random()) * d.hr;
      x = clamp(d.hx + Math.cos(a) * r, -WORLD + 6, WORLD - 6); z = clamp(d.hz + Math.sin(a) * r, -WORLD + 6, WORLD - 6);
      if (sector(z) !== sector(d.hz)) continue;
    }
    if (NAV.grids[d.nav] && NAV.grids[d.nav][navCell(x, z)]) continue;
    d.tx = x; d.tz = z; break;
  }
  d.tT = 9 + Math.random() * 9; d.pauseT = Math.random() < 0.5 ? 1 + Math.random() * 2.5 : 0;
}
function resetDinos() {
  var raptors = 0;
  buildNav();
  dinos.forEach(function (d) {
    d.active = d.rex || raptors++ < DIFF.raptors; d.mesh.visible = d.active;
    d.x = d.hx; d.z = d.hz; d.state = 'patrol'; d.stunT = 0; d.blindT = 0; d.alertT = 0; d.aware = 0; d.lostT = 0; d.path = null; d.repathT = 0;
    d.lookT = 0; d.pauseT = 0; d.stuckT = 0; d.lx = d.x; d.lz = d.z; d.lured = false; d.headYaw = 0; d.speedNow = 0;
    d.mesh.userData.head.rotation.set(0, 0, 0); pickTarget(d); d.mesh.position.set(d.x, 0, d.z);
  });
  ples.x = 109; ples.z = 62; ples.state = 'patrol'; ples.notice = 0; ples.stunT = 0;
  ptero.state = 'perch'; ptero.perch = 0; ptero.expo = 0; ptero.stunT = 0; perchPtero();
  sirenT = -99; pingT = 0; shake = 0;
}

// ---------- dinosaurs: movement ----------
function moveDino(d, dx, dz, speed, dt) {
  var len = Math.hypot(dx, dz); if (len < 0.001) { d.speedNow = 0; return; }
  dx /= len; dz /= len;
  // trees, posts and benches are too small for the nav grid: lean away from any that stands in the next couple of metres
  var ax = d.x + dx * (1.2 + d.r), az = d.z + dz * (1.2 + d.r), sx = 0, sz = 0;
  for (var q = 0; q < circles.length; q++) {
    var c = circles[q]; if (c.top !== undefined || c.r >= 1) continue;
    var ex = c.x - ax, ez = c.z - az, lim = c.r + d.r + 0.35; if (ex > lim || ex < -lim || ez > lim || ez < -lim || ex * ex + ez * ez > lim * lim) continue;
    var side = (c.x - d.x) * -dz + (c.z - d.z) * dx > 0 ? 1 : -1; sx += dz * side; sz += -dx * side;
  }
  if (sx || sz) { dx += sx * 0.85; dz += sz * 0.85; len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len; }
  var want = Math.atan2(dx, dz), diff = angDiff(want, d.rot), turn = (d.rex ? 2.2 : 5.5) * dt;
  d.rot += clamp(diff, -turn, turn);
  var fwd = Math.max(0.15, Math.cos(Math.min(Math.abs(diff), PI / 2)));       // slow down through tight turns instead of sliding sideways
  d.x += Math.sin(d.rot) * speed * fwd * dt; d.z += Math.cos(d.rot) * speed * fwd * dt;
  resolve(d, d.r, 0);
  for (var j = 0; j < dinos.length; j++) {                                      // they do not walk through one another
    var o = dinos[j]; if (o === d || !o.active) continue;
    var ox = d.x - o.x, oz = d.z - o.z, od = Math.hypot(ox, oz), need = (d.r + o.r) * 0.9;
    if (od < need && od > 0.001) { var push = (need - od) * (d.rex ? 0.1 : o.rex ? 0.9 : 0.5); d.x += ox / od * push; d.z += oz / od * push; if (!o.rex && o.speedNow < 0.3) { o.x -= ox / od * push; o.z -= oz / od * push; resolve(o, o.r, 0); } }
  }
  if (!(P && P.esc)) pushOutSafe(d, 2.2 + d.r);                                 // they keep clear of the safe rooms (until the lockdown)
  if (inRect(d.x, d.z, AQ, 1.2 + d.r)) d.x = AQ.x1 - 1.2 - d.r;
  d.speedNow = speed * fwd; d.phase += speed * fwd * dt * (d.rex ? 0.72 : 1.85);
}
function navigate(d, tx, tz, speed, dt) {
  var grid = NAV.grids[d.nav], diff;
  d.repathT -= dt;
  if (!d.path || d.repathT <= 0 || dist(tx, tz, d.ptx, d.ptz) > 2.5) {
    d.path = gridClear(grid, d.x, d.z, tx, tz) ? [[tx, tz]] : findPath(d.nav, d.x, d.z, tx, tz);
    d.ptx = tx; d.ptz = tz; d.repathT = 0.5 + Math.random() * 0.4;
  }
  while (d.path && d.path.length > 1 && dist(d.x, d.z, d.path[0][0], d.path[0][1]) < 1.5 + d.r * 0.4) d.path.shift();
  var endsShort = d.path && d.path.length === 1 && dist(d.path[0][0], d.path[0][1], tx, tz) > 1.5 && dist(d.x, d.z, d.path[0][0], d.path[0][1]) < 0.7 + d.r * 0.3;
  if (!d.path || !d.path.length || endsShort) {                                 // as near as it can get: stand and watch, never push at a wall
    diff = angDiff(Math.atan2(tx - d.x, tz - d.z), d.rot); d.rot += clamp(diff, -3 * dt, 3 * dt); d.speedNow = 0; d.stuckT = 0; d.lx = d.x; d.lz = d.z; return;
  }
  moveDino(d, d.path[0][0] - d.x, d.path[0][1] - d.z, speed, dt);
  d.stuckT += dt;                                                             // wedged: step out to one side (then the other) and plan again from there
  if (d.stuckT > 0.8) {
    if (dist(d.x, d.z, d.lx, d.lz) < speed * 0.2) {
      d.stuckN = (d.stuckN || 0) + 1; NAV.stuck = (NAV.stuck || 0) + 1;
      var a = d.rot + (d.stuckN % 2 ? 1 : -1) * (PI / 2 + 0.35) + (d.stuckN > 2 ? PI * 0.35 : 0), qx = d.x + Math.sin(a) * (2.5 + d.r), qz = d.z + Math.cos(a) * (2.5 + d.r);
      d.path = grid[navCell(qx, qz)] ? null : [[qx, qz]].concat(findPath(d.nav, qx, qz, tx, tz)); d.repathT = 1.4;
    } else d.stuckN = 0;
    d.stuckT = 0; d.lx = d.x; d.lz = d.z;
  }
}
function startChase(d, call) {
  if (d.state === 'chase') return;
  d.state = 'chase'; d.lostT = 0; d.path = null; d.lastX = player.x; d.lastZ = player.z; d.lastVX = player.vx; d.lastVZ = player.vz; d.roarT = d.rex ? 1.3 : 0.75;
  Sound.roar(d.rex, clamp(1.3 - dist(d.x, d.z, player.x, player.z) / 40, 0.4, 1));
  if (window.Scares && dist(d.x, d.z, player.x, player.z) < 11) Scares.sting(0.6);                 // it was close before you knew
  if (!call || d.rex || !DIFF.call) return;
  var called = 0;                                                             // the pack answers
  dinos.forEach(function (o) {
    if (o === d || !o.active || o.rex || o.state === 'chase' || o.state === 'stun' || sector(o.z) !== sector(d.z)) return;
    if (dist(o.x, o.z, d.x, d.z) > DIFF.call) return;
    called++;
    if (DIFF.omni) { o.alertT = 5; startChase(o, false); } else investigate(o, player.x, player.z, true);
  });
  if (called) Sound.bark(1);
}
function investigate(d, x, z, urgent) {
  if (d.state === 'chase' || d.state === 'stun') return;
  d.state = 'investigate'; d.ix = x; d.iz = z; d.lookT = 0; d.invT = 14; d.path = null; d.urgent = !!urgent;
}
// a sound at a place: anything close enough comes to look
function makeNoise(x, z, radius) {
  dinos.forEach(function (d) {
    if (!d.active || d.state === 'chase' || d.state === 'stun') return;
    if (d.rex && !(P && P.esc) && !inRect(x, z, REX, 14)) return;             // the rex will not leave its ground for a noise
    if (dist(d.x, d.z, x, z) < radius * d.ears * DIFF.hear && (radius > 60 || sector(d.z) === sector(z))) investigate(d, x + (Math.random() - 0.5) * 5, z + (Math.random() - 0.5) * 5, false);
  });
}

// ---------- dinosaurs: brains ----------
function updateDinos(dt, c) {
  var esc = !!(P && P.esc), px = player.x, pz = player.z, i, d;
  if (navSignature() !== NAV.sig) buildNav();
  // during the lockdown the whole park is told where you are every so often (constantly on hard)
  if (esc) { pingT -= dt; if (pingT <= 0) { pingT = DIFF.ping || 0.5; pingX = px; pingZ = pz; } }
  // pack roles: nearest chaser runs you down, the next one flanks, a third cuts you off
  var chasers = dinos.filter(function (o) { return o.active && !o.rex && o.state === 'chase'; }).sort(function (a, b) { return dist(a.x, a.z, px, pz) - dist(b.x, b.z, px, pz); });
  var pv = Math.hypot(player.vx, player.vz), vx = pv > 0.5 ? player.vx / pv : -Math.sin(player.yaw), vz = pv > 0.5 ? player.vz / pv : -Math.cos(player.yaw);
  aiNearest = 999; aiChasing = 0; aiAlert = 0; shake = Math.max(0, shake - dt * 2);
  for (i = 0; i < dinos.length; i++) {
    d = dinos[i]; if (!d.active) continue;
    var dp = dist(d.x, d.z, px, pz), u = d.mesh.userData, toP = Math.atan2(px - d.x, pz - d.z);
    if (dp < aiNearest) aiNearest = dp;
    d.blindT -= dt; d.alertT -= dt; d.speedNow = 0;
    d.lured = d.rex && sirenT > 0 && !esc;
    // ----- senses -----
    var vis = 0, heard = false;
    if (!c.hidden && d.blindT <= 0 && d.state !== 'stun') {
      var vf = (c.light ? 1 : 0.55) * (c.crouch ? 0.55 : 1) * (c.moving ? 1 : (d.rex ? DIFF.rexStill : 0.75)) * DIFF.sight * (d.lured ? 0.5 : 1);
      var range = d.vis * vf;
      if (dp < 3 + d.r) vis = 1;                                                                   // right on top of it
      else if (Math.abs(angDiff(toP, d.rot + (d.headYaw || 0))) < DIFF.fov / 2 && dp < range && !losBlocked(d.x, d.z, px, pz)) vis = 1.15 - dp / range;
      if (c.light && dp < 16 * DIFF.sight && (-(d.x - px) * Math.sin(player.yaw) - (d.z - pz) * Math.cos(player.yaw)) / dp > 0.85 && !losBlocked(d.x, d.z, px, pz)) vis = Math.max(vis, 0.7);   // your beam is in its eyes
      heard = c.noiseR * d.ears * DIFF.hear > dp;
    }
    if (d.state === 'stun') {
      d.stunT -= dt; u.head.rotation.z = Math.sin(playTime * 22) * 0.3; u.jaw.rotation.x = 0.4;
      if (d.stunT <= 0) { d.state = 'search'; d.searchT = DIFF.search * 0.6; d.sx = d.x; d.sz = d.z; d.blindT = 2.2; u.head.rotation.z = 0; d.aware = 0; }
    } else if (d.state === 'chase') {
      aiChasing++;
      if (!c.hidden && (vis > 0 || dp < 9 || d.alertT > 0)) { d.lastX = px; d.lastZ = pz; d.lastVX = player.vx; d.lastVZ = player.vz; d.lostT = 0; }
      else d.lostT += dt;
      if (c.hidden || d.lostT > 0.8 + DIFF.search * 0.12) {                                        // lost you: go and look where you were heading
        d.state = 'search'; d.searchT = DIFF.search; d.path = null;
        var lead = c.hidden ? 0 : (DIFF.lead ? 2.5 : 0.8);
        d.sx = d.lastX + d.lastVX * lead; d.sz = d.lastZ + d.lastVZ * lead;
      } else {
        d.roarT = Math.max(0, (d.roarT || 0) - dt);
        var cs = d.chase * DIFF.speed * (d.roarT > 0 ? 0.25 : 1), tx = d.lastX, tz = d.lastZ, role = chasers.indexOf(d);
        if (d.lostT === 0) {
          var ld = DIFF.lead * clamp(dp / 9, 0, 1.6);                                              // aim where you will be, not where you are
          tx = px + player.vx * ld; tz = pz + player.vz * ld;
          if (DIFF.flank && role > 0 && dp > 7) {
            var sideSign = (d.x - px) * vz - (d.z - pz) * vx > 0 ? 1 : -1;
            if (role === 1) { tx = px + vx * 6 + vz * sideSign * 6; tz = pz + vz * 6 - vx * sideSign * 6; }
            else { tx = px + vx * 12; tz = pz + vz * 12; }
          }
        }
        navigate(d, tx, tz, cs * (dp < 5 ? 1.08 : 1), dt);
        var hx = d.rex ? d.x + Math.sin(d.rot) * 6.4 : d.x, hz = d.rex ? d.z + Math.cos(d.rot) * 6.4 : d.z;        // the rex's jaws are six metres ahead of its feet
        if ((dist(hx, hz, px, pz) < (d.rex ? 3.0 : d.catchD) || (d.rex && dist(d.x, d.z, px, pz) < 3.2)) && player.y < 2 && !c.hidden && !losBlocked(d.x, d.z, px, pz, true)) { die(d.kind, d); return true; }
      }
    } else {
      // ----- not hunting yet: suspicion builds while it can see you -----
      if (vis > 0) d.aware += dt * vis / DIFF.react; else d.aware = Math.max(0, d.aware - dt * 0.35);
      if (d.aware >= 1 || (vis > 0 && dp < 4.5)) startChase(d, true);
      else if (heard && d.state !== 'investigate') { investigate(d, px + (Math.random() - 0.5) * 6, pz + (Math.random() - 0.5) * 6, false); if (Math.random() < 0.5) Sound.growl(clamp(1 - dp / 30, 0.2, 0.8)); }
      if (d.aware > aiAlert) aiAlert = d.aware;
      if (d.state === 'investigate') {
        d.invT -= dt;
        if (heard) { d.ix = px; d.iz = pz; }
        if (dist(d.x, d.z, d.ix, d.iz) > 2.5 + d.r && d.invT > 0) navigate(d, d.ix, d.iz, d.patrol * (d.urgent ? 2.3 : 1.6), dt);
        else { d.lookT += dt; d.rot += Math.sin(d.lookT * 2.2) * dt * 1.6; if (d.lookT > 3 || d.invT <= 0) { d.state = d.rex && !esc ? 'return' : 'patrol'; pickTarget(d); } }
      } else if (d.state === 'search') {
        d.searchT -= dt;
        if (d.searchT <= 0) { d.state = d.rex && !esc ? 'return' : 'patrol'; pickTarget(d); }
        else if (dist(d.x, d.z, d.sx, d.sz) > 2.5 + d.r) navigate(d, d.sx, d.sz, d.chase * DIFF.speed * 0.62, dt);
        else {                                                                                      // nothing here: sniff around nearby
          d.lookT = (d.lookT || 0) + dt; d.rot += Math.sin(d.lookT * 2.5) * dt * 1.8;
          if (d.lookT > 1.4) { d.lookT = 0; var a = Math.random() * 6.3, sr = 6 + Math.random() * 9; d.sx = clamp(d.lastX + Math.cos(a) * sr, -144, 144); d.sz = clamp(d.lastZ + Math.sin(a) * sr, -144, 144); }
        }
      } else if (d.state === 'return') {                                                            // the rex walks home once it gives up
        if (inRect(d.x, d.z, REX)) { d.state = 'patrol'; pickTarget(d); } else navigate(d, 88, -92, d.patrol * 1.35, dt);
      } else {                                                                                      // patrol
        var ps = d.patrol;
        if (d.lured) { d.tx = 96; d.tz = -101; ps = d.patrol * 1.5; d.pauseT = 0; }
        else if (esc && !c.hidden) { d.tx = pingX; d.tz = pingZ; ps = d.patrol * (d.rex ? 1.9 : 1.6); d.pauseT = 0; }
        else if (DIFF.omni && !c.hidden && (d.rex || sector(d.z) === sector(pz))) {                 // hard: they always know roughly where you are
          d.tx = d.rex ? clamp(px, REX.x1, REX.x2) : px; d.tz = d.rex ? clamp(pz, REX.z1, REX.z2) : pz; ps = d.patrol * 1.15; d.pauseT = 0;
        } else if (d.feed) { d.tx = d.feed[0]; d.tz = d.feed[1]; d.pauseT = 0; }                      // the paddock pack has a kill to get back to
        else { d.tT -= dt; if (d.tT <= 0) pickTarget(d); }
        if (dist(d.x, d.z, d.tx, d.tz) > (d.feed && !esc && !d.lured ? 0.9 : 2.2 + d.r)) navigate(d, d.tx, d.tz, ps, dt);
        else if (d.feed && !esc && !(DIFF.omni && !c.hidden)) { d.feeding = true; d.rot += angDiff(Math.atan2(d.feed[2] - d.x, d.feed[3] - d.z), d.rot) * Math.min(1, dt * 4); }
        else if (d.pauseT > 0) { d.pauseT -= dt; d.rot += Math.sin(playTime * 1.3 + i) * dt * 0.5; }   // stop, look about
        else if (!d.lured && !esc) pickTarget(d);
      }
    }
    // ----- animation -----
    var sp = d.speedNow, run = d.state === 'chase', amp = clamp(sp / 3, 0, 1) * (run ? 0.85 : 0.55), ph = d.phase;
    for (var k = 0; k < 2; k++) {
      var lp = ph + k * PI, lg = u.legs[k];
      lg.hip.rotation.x = -Math.sin(lp) * amp; lg.knee.rotation.x = 0.12 + Math.max(0, Math.cos(lp)) * amp * 1.1; lg.ankle.rotation.x = -Math.max(0, Math.cos(lp)) * amp * 0.7;
    }
    u.body.position.y = Math.abs(Math.sin(ph)) * 0.05 * amp; u.body.rotation.z = Math.sin(ph) * 0.035 * amp; u.body.rotation.x = run ? 0.1 : 0;
    u.tail1.rotation.y = Math.sin(ph - 0.6) * 0.22 * (0.4 + amp) + Math.sin(playTime * 0.8 + i) * 0.06; u.tail2.rotation.y = Math.sin(ph - 1.5) * 0.35 * (0.4 + amp);
    u.tail1.rotation.x = run ? 0.12 : 0;
    var watch = d.state === 'chase' || d.aware > 0.15 || d.state === 'investigate';
    var wantYaw = d.state === 'stun' ? 0 : watch && d.state !== 'investigate' ? clamp(angDiff(toP, d.rot), -0.9, 0.9) : Math.sin(playTime * 0.7 + i * 2) * 0.35;
    d.headYaw = (d.headYaw || 0) + (wantYaw - (d.headYaw || 0)) * Math.min(1, dt * 4);
    u.head.rotation.y = d.headYaw; u.head.rotation.x = d.state === 'investigate' && d.lookT > 0 ? -0.25 : run ? -0.08 : Math.sin(playTime * 0.5 + i) * 0.06;
    var roar = run && d.roarT > 0 ? Math.sin(Math.min(1, (d.rex ? 1.3 : 0.75) - d.roarT) * PI) : 0;
    if (d.state !== 'stun') u.jaw.rotation.x = roar > 0 ? 0.3 + roar * 0.75 : run ? 0.32 + Math.sin(playTime * 9) * 0.14 : d.aware > 0.4 ? 0.18 : 0.03;
    if (roar > 0) { u.head.rotation.x = -0.1 - roar * 0.5; u.body.rotation.x = -roar * 0.14; u.head.rotation.z = Math.sin(playTime * 31) * 0.05 * roar; } else if (d.state !== 'stun') u.head.rotation.z = 0;
    if (d.feeding && d.aware < 0.2 && d.state === 'patrol') {                                                      // head down in the carcass, tearing
      var tg = Math.sin(playTime * 3.1 + i * 1.7), bite = Math.max(0, tg);
      u.body.rotation.x = 0.4 + tg * 0.05; u.head.rotation.x = 0.42 + bite * 0.26; u.head.rotation.y = Math.sin(playTime * 9 + i) * 0.14 * bite; u.head.rotation.z = Math.sin(playTime * 11 + i) * 0.1 * bite;
      u.jaw.rotation.x = 0.12 + Math.max(0, Math.sin(playTime * 6.2 + i)) * 0.42; u.tail1.rotation.x = -0.12;
    }
    d.feeding = false;
    u.body.scale.setScalar(1 + Math.sin(playTime * (run ? 5 : 1.6) + i * 2) * 0.008);                              // breathing
    d.mesh.position.set(d.x, 0, d.z); d.mesh.rotation.y = d.rot;
    if (d.rex && dp < 75 && sp > 0.5) {
      d.stepT = (d.stepT || 0) - dt * (run ? 2.2 : 1);
      if (d.stepT <= 0) { d.stepT = 0.95; var v = clamp(1 - dp / 75, 0.03, 1); Sound.thud(v * 0.5); if (dp < 45) shake = Math.max(shake, v * v * 0.9); }
    }
  }
  return false;
}

// ---------- plesiosaur ----------
function updatePles(dt) {
  plesMesh.visible = !(keysGot[0] && anim.cover >= 0.98);
  if (!plesMesh.visible) return false;
  ples.t += dt;
  var tx, tz, sp, u = plesMesh.userData;
  if (ples.state === 'stun') { ples.stunT -= dt; if (ples.stunT <= 0) ples.state = 'patrol'; }
  else if (player.water) { ples.notice += dt; if (ples.notice > (DIFF.omni ? 0.35 : DIFF.react + 0.25) && ples.state !== 'chase') { ples.state = 'chase'; Sound.thud(0.4); } }
  else { ples.notice = 0; if (ples.state === 'chase') ples.state = 'patrol'; }
  if (ples.state === 'chase') { tx = player.x; tz = player.z; sp = 4.6 * DIFF.speed; }
  else if (ples.state === 'patrol') {
    if (DIFF.omni && inRect(player.x, player.z, POOL)) { tx = player.x; tz = player.z; sp = 1.7; }       // hard: it shadows you from below
    else { ples.ang += dt * 0.2; tx = 109 + Math.cos(ples.ang) * 10.5; tz = 62 + Math.sin(ples.ang) * 9; sp = 2.2; }
  }
  if (ples.state !== 'stun') {
    var dx = tx - ples.x, dz = tz - ples.z, len = Math.hypot(dx, dz);
    if (len > 0.6) { ples.x += dx / len * sp * dt; ples.z += dz / len * sp * dt; ples.rot += angDiff(Math.atan2(dx, dz), ples.rot) * Math.min(1, dt * 2.5); }
    // it swims round the pier columns rather than through them
    // (the whole length of it: shoulders, belly, hips and tail are each kept clear, not just its middle)
    var BODY = [[-3.7, 0.5], [-2.5, 0.95], [-1.2, 1.4], [0, 1.5], [1.2, 1.3], [2.2, 0.85]], bsn = Math.sin(ples.rot), bcs = Math.cos(ples.rot);
    for (var pass = 0; pass < 2; pass++) for (var pi = 0; pi < PLATFORMS.length; pi++) for (var bi = 0; bi < BODY.length; bi++) {
      var pp = PLATFORMS[pi], sxp = ples.x + bsn * BODY[bi][0], szp = ples.z + bcs * BODY[bi][0], pdx = sxp - pp[0], pdz = szp - pp[1], pd = Math.hypot(pdx, pdz) || 0.01, keep = BODY[bi][1] + 0.32;
      if (pd < keep) { ples.x += pdx / pd * (keep - pd); ples.z += pdz / pd * (keep - pd); }
    }
    ples.x = clamp(ples.x, POOL.x1 + 2.4, POOL.x2 - 2.4); ples.z = clamp(ples.z, POOL.z1 + 2.4, POOL.z2 - 2.4);
    var hx = ples.x + Math.sin(ples.rot) * 5.4, hz = ples.z + Math.cos(ples.rot) * 5.4;
    if (player.water && (dist(hx, hz, player.x, player.z) < 1.8 || dist(ples.x, ples.z, player.x, player.z) < 2.5)) { die('ples'); return true; }
  }
  var hunting = ples.state === 'chase';
  plesMesh.position.set(ples.x, -1.25 + Math.sin(ples.t * 1.3) * 0.08, ples.z); plesMesh.rotation.y = ples.rot;
  u.flips.forEach(function (f, i) { f.rotation.z = f.userData.sd * Math.sin(ples.t * (hunting ? 5 : 2) + (i > 1 ? 1.5 : 0)) * 0.42; f.rotation.y = Math.cos(ples.t * (hunting ? 5 : 2) + (i > 1 ? 1.5 : 0)) * 0.15; });
  u.neck.rotation.y = ples.state === 'stun' ? Math.sin(ples.t * 20) * 0.12 : Math.sin(ples.t * 0.8) * 0.14;
  // the neck and head ride above the water, so they duck under whenever a pier deck is overhead
  var under = 0, sn = Math.sin(ples.rot), cs = Math.cos(ples.rot);
  for (var q = 0; q < 7 && !under; q++) {
    var nx = ples.x + sn * (1.6 + q * 0.75), nz = ples.z + cs * (1.6 + q * 0.75);
    for (var pj = 0; pj < PLATFORMS.length; pj++) { var pl = PLATFORMS[pj]; if (Math.abs(nx - pl[0]) < pl[2] / 2 + 1.25 && Math.abs(nz - pl[1]) < pl[2] / 2 + 1.25) { under = 1; break; } }
  }
  ples.duck = damp(ples.duck || 0, under, under ? 9 : 2.2, dt);
  u.neck.rotation.x = (hunting ? 0.28 : Math.sin(ples.t * 0.5) * 0.05) * (1 - ples.duck) + ples.duck * 0.78; u.head.rotation.x = (hunting ? -0.1 : 0.12) - ples.duck * 0.45;
  plesMesh.position.y -= ples.duck * 0.22;                                 // and it sinks a little as it goes under a deck
  u.jaw.rotation.x = hunting ? 0.55 : 0.05;
  return false;
}

// ---------- pterosaur ----------
function updatePtero(dt, c) {
  var inAv = dist(player.x, player.z, AV.x, AV.z) < AV.r - 0.5;
  var exposed = inAv && !c.hidden && !underCover(player.x, player.z);
  var u = pteroMesh.userData, tx, ty, tz, dx, dy, dz, d = 99, sp, p;
  ptero.t += dt;
  if (ptero.state === 'perch') {
    if (exposed) ptero.expo += dt * (player.light ? 1.6 : 1) * (player.crouch ? 0.55 : 1) * (c.sprint ? 1.4 : 1) * DIFF.sight * (DIFF.omni ? 1.4 : 1);
    else ptero.expo = Math.max(-1, ptero.expo - dt * 0.7);
    if (ptero.expo > 0.55 && !ptero.warned) { ptero.warned = true; Sound.rustle(); }
    if (ptero.expo < 0.2) ptero.warned = false;
    if (ptero.expo > 1.3) { ptero.state = 'swoop'; ptero.t = 0; Sound.screech(); showMsg('ABOVE YOU — GET UNDER COVER', 2.5); }
  } else if (ptero.state === 'stun') {
    ptero.y = Math.max(0.8, ptero.y - 13 * dt); ptero.stunT -= dt;
    if (ptero.stunT <= 0) { ptero.state = 'climb'; pickPerch(); }
  }
  if (ptero.state === 'swoop' || ptero.state === 'climb') {
    if (ptero.state === 'swoop') { var ld = DIFF.lead * 0.6; tx = player.x + player.vx * ld; ty = player.y + 1.3; tz = player.z + player.vz * ld; sp = 15 * DIFF.speed; }
    else { p = perchPos(ptero.perch); tx = p[0]; ty = p[1]; tz = p[2]; sp = 9; }
    dx = tx - ptero.x; dy = ty - ptero.y; dz = tz - ptero.z; d = Math.hypot(dx, dy, dz) || 0.001;
    ptero.x += dx / d * sp * dt; ptero.y = Math.max(0.8, ptero.y + dy / d * sp * dt); ptero.z += dz / d * sp * dt;
    ptero.rot = Math.atan2(dx, dz); ptero.pitch = -Math.atan2(dy, Math.hypot(dx, dz));
    if (ptero.state === 'swoop') {
      if (Math.hypot(player.x - ptero.x, player.y + 1.3 - ptero.y, player.z - ptero.z) < 1.6 && exposed) { die('ptero'); return true; }
      if ((!exposed && d < 7) || ptero.t > 6 || !inAv) { if (d < 7 && inAv) { Sound.thud(0.5); showMsg('It slams into the roof and wheels away.', 2.5); } ptero.state = 'climb'; pickPerch(); }
    } else if (d < 1) { ptero.state = 'perch'; perchPtero(); }
  }
  var flying = ptero.state === 'swoop' || ptero.state === 'climb', open = flying || ptero.state === 'stun';
  pteroMesh.position.set(ptero.x, ptero.y, ptero.z);
  if (ptero.state === 'perch') { pteroMesh.rotation.set(PI, ptero.perch * 1.3, 0); u.head.rotation.x = -0.9 + Math.sin(ptero.t * 0.7) * 0.2; }
  else if (ptero.state === 'stun') { pteroMesh.rotation.set(0, ptero.rot, Math.sin(ptero.t * 14) * 0.5); u.head.rotation.x = 0; }
  else { pteroMesh.rotation.set(ptero.pitch, ptero.rot, 0); u.head.rotation.x = 0; }
  var fl = ptero.state === 'swoop' ? 0.12 + Math.sin(ptero.t * 4) * 0.08 : Math.sin(ptero.t * (ptero.state === 'stun' ? 16 : 7)) * 0.6;
  var fl2 = ptero.state === 'swoop' ? 0.1 : Math.sin(ptero.t * (ptero.state === 'stun' ? 16 : 7) - 0.9) * 0.5;
  u.jaw.rotation.x = ptero.state === 'swoop' ? 0.4 : 0.03;
  u.wings.forEach(function (w) {
    var sd = w.userData.sd;
    w.scale.x = open ? 1 : 0.3; w.rotation.z = sd * (open ? fl : -1.15); w.userData.outer.rotation.z = sd * (open ? fl2 : -0.9);
  });
  return false;
}
