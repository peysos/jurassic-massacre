/* Jurassic Massacre — the rest of you.
   Normally you are a pair of hands.  For the moments when your legs come into it (kicking a door in, hanging off a ledge
   with them swinging under you) there are two of them: green cargo trousers bloused into laced ranger boots.  They hang
   from a root that stands where your hips are and turns with your body, not with your head.
   Body.show(on), Body.pose(side, hip, knee, ankle, [abduct]), Body.place(x, hipY, z, yaw).  Angles in radians: hip + lifts the
   thigh forward, knee - folds the shin back under it, ankle + pulls the toes up toward the shin. */
'use strict';

var Body = (function () {
  var B = {}, root = new THREE.Group(), THIGH = 0.46, SHIN = 0.44;
  root.visible = false; root.userData.keep = true; scene.add(dyn(root)); B.root = root;
  // ---------- cloth and leather ----------
  var cargo = canvasTex(256, function (g, S) {                       // olive drill: a diagonal weave, faded on the creases, mud at random
    g.fillStyle = '#4f5d36'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? 'rgba(40,50,26,.4)' : 'rgba(130,146,96,.26)'; g.lineWidth = 1; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    blotch(g, S, ['#35401f', '#6a7848', '#2b3419', '#58482c'], 30, 10, 60, 0.3);
    g.fillStyle = 'rgba(30,36,18,.6)'; g.fillRect(0, 0, 2.5, S); g.fillStyle = '#7a8758'; for (var y = 3; y < S; y += 11) g.fillRect(5, y, 2, 6);                                    // the outside seam, double stitched
  }, 2, 4);
  var cargoN = normalTex(256, function (g, S) {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (var i = -S; i < S; i += 3) { g.strokeStyle = i % 6 ? '#6c6c6c' : '#9a9a9a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
    for (i = 0; i < 12; i++) { var y = Math.random() * S, gr = g.createLinearGradient(0, y - 10, 0, y + 10); gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(0.5, 'rgba(40,40,40,.7)'); gr.addColorStop(0.78, 'rgba(214,214,214,.55)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(0, y - 10, S, 20); }      // folds across the leg
  }, 2.4, 2, 4);
  var cloth = new THREE.MeshStandardMaterial({ map: cargo, normalMap: cargoN, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.93 });
  var leather = std(0xffffff, 0.56, { map: canvasTex(128, function (g, S) { speckle('#2a2019', ['#1c1510', '#3a2c22', '#241b15', '#46362a'], 3000, 1.6)(g, S); blotch(g, S, ['#5a4838', '#14100c'], 16, 6, 30, 0.35); g.strokeStyle = 'rgba(90,74,58,.4)'; for (var i = 0; i < 26; i++) { g.lineWidth = 0.7; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 14); g.stroke(); } }), bumpMap: bump(4), bumpScale: 0.012 });
  var sole = std(0x0d0d0e, 0.95, { bumpMap: bump(6), bumpScale: 0.03 }), lace = std(0x6a5a3a, 0.9), eyelet = std(0xa08a4a, 0.4, { metalness: 0.9 }), toeCap = std(0x1c1612, 0.36, { map: leather.map, bumpMap: bump(4), bumpScale: 0.008 });

  function leg(sd) {                                      // sd: +1 right, -1 left
    var hip = new THREE.Group(), knee = new THREE.Group(), ankle = new THREE.Group(), k;
    hip.position.set(sd * 0.105, 0, 0); hip.rotation.order = 'YXZ'; root.add(hip); knee.position.set(0, -THIGH, 0); hip.add(knee); ankle.position.set(0, -SHIN, 0); knee.add(ankle);
    // thigh: roomy, with the cargo pocket low on the outside
    tube([[0, 0.12, 0.0, 0.1, 0.105], [0, 0.0, 0.0, 0.098, 0.104], [0, -0.2, -0.004, 0.09, 0.094], [0, -THIGH + 0.06, -0.006, 0.08, 0.082], [0, -THIGH - 0.04, 0, 0.076, 0.078]], cloth, hip, 16, 4, new THREE.Vector3(1, 0, 0));
    var pk = box(0.022, 0.19, 0.15, cloth, sd * 0.094, -0.27, -0.005, hip); pk.rotation.z = sd * 0.03; var fl = box(0.026, 0.06, 0.16, cloth, sd * 0.097, -0.19, -0.005, hip); fl.rotation.z = sd * -0.1;
    mesh(new THREE.SphereGeometry(0.008, 8, 6), eyelet, sd * 0.111, -0.205, -0.005, hip);
    var kn = mesh(new THREE.SphereGeometry(0.082, 14, 10), cloth, 0, 0, -0.004, knee); kn.scale.set(1, 1.05, 1.08);                                    // the knee: cloth pulled over it
    box(0.13, 0.12, 0.012, cloth, 0, -0.01, -0.086, knee);                                                                                           // a double layer sewn on over the knee
    // shin: the trouser leg, gathered where it is tucked into the boot
    tube([[0, 0.05, 0, 0.078, 0.08], [0, -0.1, 0.004, 0.074, 0.08], [0, -0.2, 0.008, 0.072, 0.078], [0, -0.245, 0.006, 0.076, 0.08], [0, -0.262, 0.004, 0.066, 0.068]], cloth, knee, 16, 4, new THREE.Vector3(1, 0, 0));
    // the boot: an eight-inch shaft laced up the front, a stitched toe cap, a lugged sole with a heel
    tube([[0, -0.25, 0.004, 0.064, 0.068], [0, -0.3, 0.004, 0.062, 0.068], [0, -0.38, 0.006, 0.058, 0.066], [0, -SHIN, 0.008, 0.056, 0.066], [0, -SHIN - 0.03, 0.006, 0.058, 0.07]], leather, knee, 16, 4, new THREE.Vector3(1, 0, 0));
    mesh(new THREE.TorusGeometry(0.064, 0.008, 6, 18), leather, 0, -0.252, 0.004, knee).rotation.x = PI / 2;                                         // the padded collar
    for (k = 0; k < 7; k++) { var ly = -0.275 - k * 0.027, lz = -0.066 + k * 0.0006; box(0.052, 0.006, 0.006, lace, 0, ly, lz, knee).rotation.z = (k % 2 ? 1 : -1) * 0.28; [-1, 1].forEach(function (e) { mesh(new THREE.SphereGeometry(0.0048, 6, 5), eyelet, e * 0.027, ly, lz + 0.002, knee); }); }
    box(0.016, 0.2, 0.01, leather, 0, -0.35, -0.062, knee);                                                                                          // the tongue under the laces
    tube([[0, -0.005, 0.07, 0.05, 0.05], [0, -0.022, 0.03, 0.054, 0.056], [0, -0.03, -0.05, 0.054, 0.05], [0, -0.04, -0.13, 0.052, 0.042], [0, -0.046, -0.185, 0.045, 0.034]], leather, ankle, 14, 4, new THREE.Vector3(1, 0, 0));
    var cap = mesh(new THREE.SphereGeometry(0.05, 14, 10), toeCap, 0, -0.05, -0.2, ankle); cap.scale.set(1.0, 0.72, 1.1);
    box(0.104, 0.022, 0.012, toeCap, 0, -0.03, -0.158, ankle).rotation.x = -0.5;                                                                     // the cap's seam
    box(0.108, 0.026, 0.33, sole, 0, -0.092, -0.085, ankle); box(0.104, 0.03, 0.09, sole, 0, -0.112, 0.03, ankle); box(0.11, 0.012, 0.34, std(0x3a2c1e, 0.8), 0, -0.076, -0.085, ankle);      // sole, heel, welt
    for (k = 0; k < 6; k++) box(0.1, 0.012, 0.022, sole, 0, -0.108, -0.225 + k * 0.036, ankle);                                                     // lugs
    [hip, knee, ankle].forEach(function (g2) { g2.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); });
    return { hip: hip, knee: knee, ankle: ankle, sd: sd };
  }
  B.R = leg(1); B.L = leg(-1); B.THIGH = THIGH; B.SHIN = SHIN;
  B.show = function (on) { root.visible = !!on; };
  B.place = function (x, hipY, z, yaw) { root.position.set(x, hipY, z); root.rotation.y = yaw; };
  B.pose = function (side, hip, knee, ankle, abduct, twist) { var L = B[side]; L.hip.rotation.set(hip, twist || 0, (abduct || 0) * L.sd); L.knee.rotation.x = knee; L.ankle.rotation.x = ankle || 0; };
  /* Where the sole of a boot is, in the world (the ball of the foot): for making a kick land on what it kicks. */
  var bv = new THREE.Vector3();
  B.sole = function (side, out) { var a = B[side].ankle; a.updateWorldMatrix(true, false); return (out || bv).set(0, -0.1, -0.12).applyMatrix4(a.matrixWorld); };
  return B;
})();
