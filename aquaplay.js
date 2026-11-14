/* Jurassic Massacre — the aquarium: what happens there.
   aquarium.js built the place; this is its doors, its machinery, the animal in the tank and the set pieces.
   Everything that has happened is in P.aq (saved):
     door   the way in has been pushed open            staff  kicks landed on the STAFF ONLY door (3: it is down)
     pump   the hydraulic pump is running              mani   the manifold: source and sink rows, each coupling's kind and turn
     lift   where the car is (0 basement, 1 catwalks)  top    you have been up once (the checkpoint)
     fell   you have been in the water                 dead   she is dead        power  the tank's feeder is back on
     ladder the keepers' ladder is down in the water   gate   the cage at the foot of the hall ladder is open */
'use strict';
(function () {
  var A = Aqua, G = GAL, H = HALL, T = POOL, M2 = A.mats, EM = Entrance.M, groups = A.groups, Lt = A.lights, V3 = THREE.Vector3, Q4 = THREE.Quaternion;
  var tmpV = new V3(), tmpV2 = new V3(), tmpQ = new Q4(), seq = [], i, k;
  function S() { return P.aq; }
  function after(t, fn) { seq.push({ at: playTime + t, fn: fn }); }
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }
  function hump(t, a, b, c, d) { return t <= a || t >= d ? 0 : t < b ? sstep((t - a) / (b - a)) : t < c ? 1 : 1 - sstep((t - c) / (d - c)); }
  function at(obj, x, y, z) { var v = new V3(); return function () { obj.updateWorldMatrix(true, false); return v.set(x, y, z).applyMatrix4(obj.matrixWorld); }; }
  function facing(x, z) { return Math.atan2(-(x - player.x), -(z - player.z)); }
  A.mark();
  A.finish();
  A.newState = function (done) {
    var s = { door: !!done, staff: done ? 3 : 0, pump: !!done, mani: newMani(), lift: done ? 1 : 0, top: !!done, fell: !!done, dead: !!done, power: !!done, ladder: !!done, gate: !!done, seen: {} };
    if (done) solveMani(s.mani);
    return s;
  };
  A.started = function () { return !!S().door || inRect(player.x, player.z, AQ, 14); };

  // ================= the way in =================
  var door = dyn(new THREE.Group()), doorA = 0, doorJ = 0, handleG = dyn(new THREE.Group());
  (function () {
    door.position.set(G.x1 - 0.045, 0, 59.52); scene.add(door);
    box(0.05, 2.06, 0.96, M2.blue, 0, 1.03, 0.48, door);
    [-1, 1].forEach(function (sd) { mesh(new THREE.TorusGeometry(0.17, 0.024, 8, 22), M2.steel, sd * 0.026, 1.52, 0.48, door).rotation.y = PI / 2; var w = mesh(new THREE.CircleGeometry(0.165, 22), M.window, sd * 0.0262, 1.52, 0.48, door); w.rotation.y = sd * PI / 2; w.userData.noCast = true; box(0.006, 0.26, 0.9, M2.steel, sd * 0.028, 0.17, 0.48, door); });
    box(0.006, 0.34, 0.12, M2.steel, -0.028, 1.2, 0.83, door);                                      // push plate
    handleG.position.set(-0.03, 1.02, 0.86); door.add(handleG); cyl(0.012, 0.012, 0.05, M2.rail, -0.02, 0, 0, handleG, 8).rotation.z = PI / 2; box(0.022, 0.022, 0.14, M2.rail, -0.045, 0, -0.06, handleG);
    [0.25, 1.05, 1.85].forEach(function (y) { cyl(0.016, 0.016, 0.12, M2.steel, 0.01, y, -0.012, door, 8); });
    var pl = mesh(new THREE.PlaneGeometry(0.34, 0.1), std(0xffffff, 0.7, { map: textTex(['PUSH'], 128, 38, '#e9e2d0', '#1d4a58', null, false) }), -0.0265, 1.42, 0.83, door); pl.rotation.y = -PI / 2; pl.userData.noCast = true;
  })();
  var doorBox = A.solid(G.x1 - 0.5, G.x1, 59.5, 60.5), doorLeafBox = A.solid(G.x1, G.x1 + 0.96, 59.4, 59.56, null, null, true); doorLeafBox.off = true;
  A.gather('shell');
  function openDoor() {
    stepTo(G.x1 - 1.02, 60.12, new V3(G.x1 - 0.1, 1.1, 60.3), 0.4);
    Hands.use('aqHandle', { point: at(handleG, -0.045, 0, -0.07), pose: 'hook', tip: 'hook', rot: [0.2, 0.5, 0.25], dur: 0.62, reach: 0.34, press: 0.0, onTouch: function () { Sfx.play('locked_handle', { vol: 0.5, rate: 1.2, fallback: function () { Sound.clunk(); } }); handleT = 0.4; } });
    after(0.72, function () {
      Hands.pushDoor('aqPush', door, new V3(-0.027, 1.22, 0.74), new V3(-1, 0, 0), function () { S().door = true; doorJ = 1; Sfx.play('door_open', { vol: 0.8, rate: 0.82, fallback: function () { Sound.creak(0.9); } }); Sound.creak(0.7); Sound.noise(0.9, 500, 0.12); }, { reach: 0.36, hold: 0.34 });
    });
    after(1.5, function () { showMsg('It gives, scraping. The air that comes out is cold, and smells of salt and weed.', 5); });
  }
  var handleT = 0;

  // ================= STAFF ONLY: a door that has to be kicked in =================
  var SD = A.staffDoor, sdFall = dyn(new THREE.Group()), sdHinge = new THREE.Group(), sdJ = 0, sdJv = 0, sdDown = 0, hasp = dyn(new THREE.Group()), lockG = dyn(new THREE.Group()), dust = [];
  (function () {
    var zc = (SD.z1 + SD.z2) / 2, dm = std(0xffffff, 0.7, { map: canvasTex(256, function (g, S2, HH) { g.fillStyle = '#7d8a84'; g.fillRect(0, 0, S2, HH); chips(g, S2, HH, 40, '#4a4e4a'); chips(g, S2, HH, 16, '#7a4a26'); streaks(g, S2, HH, 20, 'rgba(90,60,30,.8)', HH * 0.7); grime(g, S2, HH, 1.3); g.fillStyle = 'rgba(20,20,18,.45)'; g.beginPath(); g.ellipse(S2 * 0.56, HH * 0.52, 30, 40, 0, 0, 7); g.fill(); }, 1, 1, true, 512), bumpMap: bump(2), bumpScale: 0.012, metalness: 0.2 });
    sdFall.position.set(SD.x + 0.08, SD.y, zc); scene.add(sdFall); sdHinge.position.set(0, 0, 0.48); sdFall.add(sdHinge);
    box(0.05, 2.06, 0.96, dm, 0, 1.03, -0.48, sdHinge); box(0.006, 0.26, 0.9, M2.steel, -0.028, 0.17, -0.48, sdHinge);
    var pl = mesh(new THREE.PlaneGeometry(0.62, 0.3), std(0xffffff, 0.7, { map: textTex(['STAFF ONLY', 'NO PUBLIC ACCESS'], 256, 124, '#8d1f18', '#f1ecdd', '#f1ecdd') }), -0.0265, 1.6, -0.48, sdHinge); pl.rotation.y = -PI / 2; pl.userData.noCast = true;
    cyl(0.02, 0.02, 0.07, M2.rail, -0.05, 1.02, -0.86, sdHinge, 8).rotation.z = PI / 2; mesh(new THREE.SphereGeometry(0.032, 10, 8), M2.rail, -0.09, 1.02, -0.86, sdHinge);                 // a knob
    [0.25, 1.05, 1.85].forEach(function (y) { cyl(0.016, 0.016, 0.12, M2.steel, 0.012, y, 0.012, sdHinge, 8); });
    // the hasp across the gap, and the padlock through it
    hasp.position.set(-0.03, 1.22, -0.93); sdHinge.add(hasp); box(0.008, 0.05, 0.16, EM.rustSteel, 0, 0, -0.03, hasp); box(0.012, 0.07, 0.05, EM.rustSteel, 0, 0, 0.04, hasp);
    lockG.position.set(-0.012, -0.03, -0.09); hasp.add(lockG); mesh(new THREE.TorusGeometry(0.022, 0.005, 6, 12), M2.rail, 0, 0.0, 0, lockG).rotation.y = PI / 2; box(0.022, 0.05, 0.045, M.gold, 0, -0.045, 0, lockG);
    // the frame, and what holds the staple
    box(0.14, 2.14, 0.07, M2.blue, SD.x + 0.02, SD.y + 1.07, SD.z1 - 0.03); box(0.14, 2.14, 0.07, M2.blue, SD.x + 0.02, SD.y + 1.07, SD.z2 + 0.03); box(0.14, 0.08, SD.z2 - SD.z1 + 0.14, M2.blue, SD.x + 0.02, SD.y + 2.14, zc);
    A.staple = dyn(box(0.014, 0.06, 0.05, EM.rustSteel, SD.x - 0.05, SD.y + 1.22, SD.z1 - 0.04));
    var dt2 = softTex('rgba(196,188,170,.6)', 'rgba(170,162,140,.2)'); for (var q = 0; q < 14; q++) { var sp = dyn(new THREE.Sprite(new THREE.SpriteMaterial({ map: dt2, transparent: true, depthWrite: false, opacity: 0 }))); sp.visible = false; scene.add(sp); dust.push({ s: sp, life: 0, max: 1, v: new V3() }); }
  })();
  A.staffBox = A.solid(SD.x - 0.06, SD.x + 0.5, SD.z1, SD.z2, MEZ - 0.3, MEZ + 2.5);
  A.gather('hall');
  function puff(x, y, z, n, spread, up) { for (var q = 0; q < n; q++) { var d = dust.filter(function (p) { return p.life <= 0; })[0]; if (!d) return; d.s.position.set(x + (Math.random() - 0.5) * spread, y + (Math.random() - 0.5) * spread, z + (Math.random() - 0.5) * spread); d.v.set((Math.random() - 0.7) * 0.9, (up || 0.2) + Math.random() * 0.5, (Math.random() - 0.5) * 0.9); d.life = d.max = 0.8 + Math.random() * 1.1; d.s.visible = true; } }
  function stepDust(dt) { dust.forEach(function (d) { if (d.life <= 0) return; d.life -= dt; var kk = d.life / d.max; d.s.position.addScaledVector(d.v, dt); d.v.multiplyScalar(1 - dt * 1.6); d.s.material.opacity = kk * 0.5; var sc = 0.12 + (1 - kk) * 0.7; d.s.scale.set(sc, sc, 1); if (d.life <= 0) d.s.visible = false; }); }
  /* The kick.  You square up to the door, the knee comes up to the chest, and the boot goes into the door beside the lock with
     the whole leg behind it.  Twice the hasp holds.  The third time the screws come out of the frame and the door goes in
     flat, off its hinges, and slides down the stairs behind it. */
  var K_HIP = 1.66, K_KNEE = -0.2, K_ANK = 0.42;
  function kick() {
    var st = S(), n = st.staff, T2 = 0, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, DUR = 1.3, ev = {}, YAW = -PI / 2, CN;
    var faceX = SD.x - 0.03 - 0.02 * n, kz = (SD.z1 + SD.z2) / 2 - 0.13, fy = MEZ, sole = new V3();
    Body.place(0, fy + 0.93, 0, YAW); Body.pose('R', K_HIP, K_KNEE, K_ANK); Body.root.updateMatrixWorld(true); Body.sole('R', sole);
    var sx = faceX - sole.x - 0.004, sz = kz - sole.z, yawS = yaw0 + angDiff(YAW, yaw0);
    function once(k2, t) { if (T2 >= t && !ev[k2]) { ev[k2] = 1; return true; } return false; }
    closePanel(); Hands.over = { L: { pos: new V3(), q: new Q4(), pose: Hands.POSE.relax, k: 0 } };
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt;
      var inK = easeIO(clamp(T2 / 0.3, 0, 1)), ch = seg(T2, 0.14, 0.42), th = seg(T2, 0.44, 0.535), rc = seg(T2, 0.6, 0.86), dn = seg(T2, 0.86, 1.2), hit = hump(T2, 0.52, 0.535, 0.56, 0.74);
      var hip = lerp(lerp(lerp(0, 1.92, ch), K_HIP, th), lerp(1.25, 0, dn), rc), knee = lerp(lerp(lerp(0, -2.05, ch), K_KNEE, th), lerp(-1.55, 0, dn), rc), ank = lerp(0, K_ANK, ch) * (1 - dn);
      Body.show(true); Body.place(lerp(c0.x, sx, inK) - ch * 0.05 * (1 - th) + th * 0.07 * (1 - rc), fy + 0.93 - ch * 0.03 * (1 - dn), lerp(c0.z, sz, inK), YAW);
      Body.pose('R', hip, knee, ank, 0.03); Body.pose('L', -0.1 * ch * (1 - dn), -0.16 * ch * (1 - dn), 0, 0.05);
      var sh = hit * (n === 2 ? 1.3 : 0.9);
      camera.position.set(Body.root.position.x - 0.1 - ch * 0.07 * (1 - rc) + th * 0.05 * (1 - rc) + (Math.random() - 0.5) * sh * 0.03, fy + 1.7 - ch * 0.05 * (1 - dn) + (Math.random() - 0.5) * sh * 0.03, Body.root.position.z - 0.02 + ch * 0.04 * (1 - dn));
      camera.rotation.set(lerp(pitch0, -0.42 + ch * 0.1 - th * 0.06, inK) * (1 - dn) + dn * -0.05 + hit * 0.03, lerp(yaw0, yawS, inK) + ch * 0.06 * (1 - dn), ch * -0.03 * (1 - dn));
      if (camera.fov !== prefs.fov) { camera.fov = prefs.fov; camera.updateProjectionMatrix(); }
      // the left arm comes out to balance; the torch hand comes up with the lean
      var o = Hands.over.L; o.k = ch * (1 - dn); o.pos.set(-0.36 - th * 0.05, -0.34 + ch * 0.04, -0.2); o.q.setFromEuler(new THREE.Euler(0.5, 0.5, 1.0, 'YXZ'));
      Hands.aim = [0.03, 0.03 * ch, 0.03, 0.1 * ch, -0.1 * ch, 0.12 * ch]; flashlight.intensity = player.light ? 2.0 : 0; Hands.fill.intensity = 0.5;
      Hands.update(dt, { speed: 0, yaw: camera.rotation.y, pitch: camera.rotation.x, phase: 0, grounded: true });
      if (once('grunt', 0.36)) Sfx.play('grunt', { vol: 0.34, rate: 0.95 + n * 0.06 });
      if (once('hit', 0.53)) {
        Sound.thud(1); Sound.noise(0.18, 1400, 0.6); Sound.tone(190, 70, 0.3, 0.4, 'square'); Sfx.play('gate_rattle', { vol: 0.5, rate: 0.7 + n * 0.1 }); makeNoise(player.x, player.z, 30);
        puff(SD.x, fy + 1.1, kz, n === 2 ? 9 : 4, 0.5, 0.1); puff(SD.x, fy + 2.1, kz, 3, 0.8, -0.2);
        if (n < 2) { sdJv = -2.6 - n * 1.2; st.staff = n + 1; if (n === 1) { Sound.clang(); } }
        else { st.staff = 3; sdDown = 0.0001; Sound.clang(); Sound.noise(0.5, 2400, 0.5); }
      }
      stepDoors(dt); stepDust(dt); CN.pulse = hit * 0.6;
      return T2 >= DUR;
    }, end: function () {
      Body.show(false); Hands.over = null; Hands.aim = null; player.x = sx - 0.1; player.z = sz - 0.02; player.y = fy; player.yaw = player.cy = YAW; player.pitch = player.cp = -0.05; setState('playing'); lockPointer();
      showMsg(st.staff === 1 ? 'It jumps in its frame. The hasp holds.' : st.staff === 2 ? 'Wood splits round the staple. Once more.' : 'The door goes in flat and slides away down the stairs. Something below is still dripping.', st.staff === 3 ? 5.5 : 3);
    } });
  }
  function stepDoors(dt) {
    var st = S();
    // the way in: stiff, then it swings
    var want = st.door ? 1 : 0; doorA = clamp(doorA + clamp(want - doorA, -dt / 1.9, dt / 1.9), 0, 1); doorJ = Math.max(0, doorJ - dt * 1.4);
    door.rotation.y = 1.42 * (1 - Math.pow(1 - doorA, 2.4)) + Math.sin(doorJ * 40) * 0.006 * doorJ; doorBox.off = doorA > 0.3; doorLeafBox.off = doorA < 0.8;
    handleT = Math.max(0, handleT - dt); handleG.rotation.x = -Math.sin(clamp(handleT / 0.4, 0, 1) * PI) * 0.6;
    // STAFF ONLY: ajar on its hasp; each kick opens the gap a little; then down
    sdJv += (-sdJ * 160 - sdJv * 9) * dt; sdJ += sdJv * dt;
    var ajar = st.staff >= 3 ? 0 : -(0.085 + st.staff * 0.05) + clamp(sdJ, -0.3, 0.08);
    if (st.staff >= 3 && sdDown < 1) sdDown = Math.min(1, (sdDown || 0.0001) + dt / 1.5);
    var f = st.staff >= 3 ? sdDown : 0, fall = clamp(f / 0.42, 0, 1), slide = clamp((f - 0.42) / 0.58, 0, 1), fa = fall * fall;
    sdHinge.rotation.y = ajar; sdFall.rotation.z = -(fa * (PI / 2 + 0.02) + (1 - Math.pow(1 - slide, 2)) * 0.56) + (fall >= 1 && slide < 0.25 ? Math.sin(slide * 40) * 0.02 : 0);
    sdFall.position.x = SD.x + 0.08 + fa * 0.3 + (1 - Math.pow(1 - slide, 2)) * 1.3; sdFall.position.y = SD.y + fa * 0.03 - (1 - Math.pow(1 - slide, 2)) * 0.2;
    if (f > 0.42 && !sdFall.userData.hit && f < 1) { sdFall.userData.hit = 1; Sound.clang(); Sound.thud(1); shake = Math.max(shake, 0.9); puff(SD.x + 1.2, SD.y + 0.2, 59.4, 10, 1.2, 0.2); makeNoise(player.x, player.z, 40); }
    hasp.rotation.x = st.staff >= 2 ? 1.2 : 0; lockG.rotation.z = st.staff >= 2 ? 0.5 : 0; A.staple.visible = st.staff < 2;
    A.staffBox.off = st.staff >= 3;
  }

  // ================= the pump and the manifold =================
  /* The lift is hydraulic.  Its pump is in the basement, and between the pump and the ram is a manifold of twelve swivel
     couplings on the pump room wall, every one of them left turned the wrong way.  Each is a straight or an elbow; aim at one
     and turn it a quarter.  With the pump running you can see how far the oil gets: it sprays from the first open end.
     Run it from FROM PUMP on the left to TO LIFT RAM on the right. */
  var COLS = 4, ROWS = 3, TS = 0.44, MX = A.maniAt.x, MZ = A.maniAt.z, MY = BASE_Y + 2.1, tiles = [], hitList = [], srcStub, snkStub, sprays = [], gaugeN = null, maniFlow = null, leakP = new V3(), leakD = new V3(), pumpV = 0, hissT = 0;
  var OPEN = { I: [10, 5, 10, 5], L: [3, 6, 12, 9] }, DXY = { 1: [0, -1], 2: [1, 0], 4: [0, 1], 8: [-1, 0] }, OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  function newMani() {
    var m, tries = 0;
    do {
      var sr = (Math.random() * ROWS) | 0, tr = (Math.random() * ROWS) | 0, types = [], rot = [], want = [], r = sr, c, q;
      for (q = 0; q < COLS * ROWS; q++) { types.push(Math.random() < 0.5 ? 'I' : 'L'); rot.push((Math.random() * 4) | 0); want.push(-1); }
      for (c = 0; c < COLS; c++) {
        var ro = c === COLS - 1 ? tr : (Math.random() < 0.3 ? r : (Math.random() * ROWS) | 0);
        if (ro === r) { types[r * COLS + c] = 'I'; want[r * COLS + c] = 0; }
        else {
          var down = ro > r; types[r * COLS + c] = 'L'; want[r * COLS + c] = down ? 2 : 3;
          for (q = r + (down ? 1 : -1); q !== ro; q += down ? 1 : -1) { types[q * COLS + c] = 'I'; want[q * COLS + c] = 1; }
          types[ro * COLS + c] = 'L'; want[ro * COLS + c] = down ? 0 : 1;
        }
        r = ro;
      }
      var keep = DIFF.levers === 3 ? 0.4 : diffName === 'hard' ? 0 : 0.15;                 // easy leaves some of them right
      for (q = 0; q < want.length; q++) if (want[q] >= 0) rot[q] = Math.random() < keep ? want[q] : want[q] + 1 + ((Math.random() * (types[q] === 'I' ? 1 : 3)) | 0);
      m = { sr: sr, tr: tr, types: types, rot: rot, want: want };
    } while (flowOf(m).solved && tries++ < 20);
    return m;
  }
  function solveMani(m) { for (var q = 0; q < m.want.length; q++) if (m.want[q] >= 0) m.rot[q] = m.want[q]; }
  function flowOf(m) {
    var live = [], c = 0, r = m.sr, from = 8, guard = 0;
    while (guard++ < 40) {
      if (c < 0 || r < 0 || r >= ROWS || c >= COLS) return { live: live, solved: false, c: c - DXY[OPP[from]][0], r: r - DXY[OPP[from]][1], side: OPP[from] };
      var idx = r * COLS + c, o = OPEN[m.types[idx]][m.rot[idx] % 4];
      if (!(o & from)) return { live: live, solved: false, c: c, r: r, side: from, blocked: true };
      live.push(idx); var out = o & ~from;
      if (out === 2 && c === COLS - 1) return r === m.tr ? { live: live, solved: true } : { live: live, solved: false, c: c, r: r, side: 2 };
      c += DXY[out][0]; r += DXY[out][1]; from = OPP[out];
    }
    return { live: live, solved: false, c: 0, r: m.sr, side: 8 };
  }
  function tileXY(c, r) { return [MX + (1.5 - c) * TS, MY - r * TS]; }
  A.ready = function () { var st = S(); return !!(st.pump && maniFlow && maniFlow.solved); };
  (function () {
    var q, plateM = std(0x596268, 0.6, { metalness: 0.5, map: metalTex }), pipeM = std(0x8a7a3a, 0.5, { metalness: 0.6, map: rustTex }), flangeM = std(0x9aa0a4, 0.4, { metalness: 0.8, map: metalTex });
    box(COLS * TS + 0.3, ROWS * TS + 0.3, 0.05, plateM, MX, MY - TS, MZ + 0.075);
    for (q = 0; q < COLS * ROWS; q++) {
      var c = q % COLS, r = (q / COLS) | 0, xy = tileXY(c, r), Gp = new THREE.Group(), inner = dyn(new THREE.Group()); Gp.position.set(xy[0], xy[1], MZ + 0.03); Gp.rotation.y = PI; scene.add(Gp); Gp.add(inner);
      var fl = cyl(0.175, 0.175, 0.045, flangeM, 0, 0, 0, inner, 20); fl.rotation.x = PI / 2; fl.userData.tile = q; hitList.push(fl);
      for (var b = 0; b < 6; b++) cyl(0.014, 0.014, 0.02, M.dark, Math.cos(b * 1.047 + 0.5) * 0.145, Math.sin(b * 1.047 + 0.5) * 0.145, 0.03, inner, 6).rotation.x = PI / 2;
      var pI = new THREE.Group(), pL = new THREE.Group(); inner.add(pI); inner.add(pL);
      cyl(0.052, 0.052, TS, pipeM, 0, 0, 0.07, pI, 12).rotation.z = PI / 2; [-1, 1].forEach(function (e) { cyl(0.066, 0.066, 0.03, flangeM, e * (TS / 2 - 0.015), 0, 0.07, pI, 12).rotation.z = PI / 2; });
      cyl(0.052, 0.052, TS / 2, pipeM, TS / 4, 0, 0.07, pL, 12).rotation.z = PI / 2; cyl(0.052, 0.052, TS / 2, pipeM, 0, TS / 4, 0.07, pL, 12); mesh(new THREE.SphereGeometry(0.06, 12, 10), pipeM, 0, 0, 0.07, pL);
      cyl(0.066, 0.066, 0.03, flangeM, TS / 2 - 0.015, 0, 0.07, pL, 12).rotation.z = PI / 2; cyl(0.066, 0.066, 0.03, flangeM, 0, TS / 2 - 0.015, 0.07, pL, 12);
      var gl = basic(0x10181a, { fog: false }); mesh(new THREE.SphereGeometry(0.026, 10, 8), gl, 0, 0, 0.125, inner).userData.keep = true;                // a sight glass: it shows oil when the coupling is under pressure
      tiles.push({ g: inner, I: pI, L: pL, glass: gl, a: 0, ol: null });
    }
    tiles.forEach(function (t) { t.ol = Outline.make(t.g); });
    function stub(txt) { var g2 = dyn(new THREE.Group()); scene.add(g2); cyl(0.052, 0.052, 0.5, pipeM, 0, 0, 0, g2, 12).rotation.z = PI / 2; cyl(0.07, 0.07, 0.04, flangeM, 0.23, 0, 0, g2, 12).rotation.z = PI / 2; cyl(0.07, 0.07, 0.04, flangeM, -0.23, 0, 0, g2, 12).rotation.z = PI / 2;
      var lb = mesh(new THREE.PlaneGeometry(0.46, 0.13), std(0xffffff, 0.7, { map: textTex([txt], 256, 72, '#e2b93b', '#17140e', '#17140e', false) }), 0, 0.16, 0.0, g2); lb.rotation.y = PI; lb.userData.noCast = true; return g2; }
    srcStub = stub('FROM PUMP'); snkStub = stub('TO LIFT RAM');
    // the ram's pressure gauge, over the manifold
    cyl(0.16, 0.16, 0.05, M2.white, MX, MY + 0.62, MZ + 0.04, null, 20).rotation.x = PI / 2; var gf = mesh(new THREE.CircleGeometry(0.145, 20), std(0xffffff, 0.5, { map: canvasTex(128, function (g, S2) { g.fillStyle = '#e9e6da'; g.fillRect(0, 0, S2, S2); g.strokeStyle = '#17140e'; g.lineWidth = 3; for (var n = 0; n <= 10; n++) { var a = PI * 0.75 + n / 10 * PI * 1.5; g.beginPath(); g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); g.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); g.stroke(); } g.strokeStyle = '#2f9a5a'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 51, PI * 1.9, PI * 2.25); g.stroke(); g.fillStyle = '#17140e'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText('RAM  bar', 64, 96); }) }), MX, MY + 0.62, MZ + 0.012); gf.rotation.y = PI; gf.userData.noCast = true;
    gaugeN = dyn(box(0.01, 0.12, 0.004, M.red, MX, MY + 0.62, MZ + 0.006)); gaugeN.geometry.translate(0, 0.045, 0);
    var st2 = softTex('rgba(226,216,170,.8)', 'rgba(200,180,110,.25)'); for (q = 0; q < 6; q++) { var sp = dyn(new THREE.Sprite(new THREE.SpriteMaterial({ map: st2, transparent: true, depthWrite: false, opacity: 0 }))); sp.visible = false; scene.add(sp); sprays.push(sp); }
  })();
  A.gather('basement');
  function stepMani(dt, instant) {
    var st = S(), m = st.mani, q; maniFlow = flowOf(m);
    for (q = 0; q < tiles.length; q++) {
      var t = tiles[q], want = -m.rot[q] * PI / 2; t.a = instant ? want : damp(t.a, want, 14, dt); t.g.rotation.z = t.a; t.I.visible = m.types[q] === 'I'; t.L.visible = m.types[q] === 'L';
      t.glass.color.setHex(st.pump && maniFlow.live.indexOf(q) >= 0 ? 0xffc04a : 0x10181a);
    }
    srcStub.position.set(MX + 1.5 * TS + TS / 2 + 0.27, MY - m.sr * TS, MZ - 0.04); snkStub.position.set(MX - 1.5 * TS - TS / 2 - 0.27, MY - m.tr * TS, MZ - 0.04);
    pumpV = instant ? (st.pump ? 1 : 0) : damp(pumpV, st.pump ? 1 : 0, 1.6, dt);
    A.pumpFan.rotation.x += dt * 38 * pumpV; A.pumpGauge.rotation.x = -pumpV * 2.2 + (st.pump ? Math.sin(playTime * 31) * 0.03 : 0);
    var prs = st.pump ? (maniFlow.solved ? 1 : 0.12 + maniFlow.live.length * 0.035) : 0; gaugeN.userData.a = instant ? prs : damp(gaugeN.userData.a || 0, prs, 2.5, dt); gaugeN.rotation.z = -(PI * 0.25 - PI) - 0 + (0.75 - gaugeN.userData.a * 1.5) * PI - PI * 0.5 + (st.pump ? Math.sin(playTime * 27) * 0.012 : 0);
    A.startLamp.color.setHex(st.pump ? 0x35ff8a : 0x1a0805);
    // where the oil gets out
    var leak = st.pump && !maniFlow.solved;
    if (leak) { var xy = tileXY(clamp(maniFlow.c, 0, COLS - 1), clamp(maniFlow.r, 0, ROWS - 1)), d = DXY[maniFlow.side]; leakD.set(-d[0], -d[1], -0.5).normalize(); leakP.set(xy[0] - d[0] * TS / 2, xy[1] - d[1] * TS / 2, MZ - 0.05); }
    for (q = 0; q < sprays.length; q++) { var sp = sprays[q], ph = ((playTime * 1.9 + q / sprays.length) % 1); sp.visible = leak && groups.basement.visible; if (!leak) continue; sp.position.copy(leakP).addScaledVector(leakD, ph * 0.7); sp.position.y -= ph * ph * 0.5; sp.position.x += Math.sin(q * 7 + playTime * 9) * 0.03; var sc = 0.08 + ph * 0.34; sp.scale.set(sc, sc, 1); sp.material.opacity = (1 - ph) * 0.5; }
  }
  function aimTile() { aimRay.setFromCamera(aimNDC, camera); aimRay.far = 2.4; var h = aimRay.intersectObjects(hitList, false); return h.length ? h[0].object.userData.tile : -1; }
  function turnTile(q) {
    var st = S(), m = st.mani, t = tiles[q], t0 = null; m.rot[q]++;
    Sfx.play('rocker', { vol: 0.5, rate: 0.6 + Math.random() * 0.1, fallback: function () { Sound.clunk(); } }); Sound.noise(0.16, 900, 0.14); makeNoise(player.x, player.z, 8);
    Hands.use('mani' + q + ':' + playTime, { point: at(t.g.parent, 0.02, 0.0, 0.1), pose: 'hook', tip: 'hook', dur: 0.5, reach: 0.22, rot: [0.25, 0.25, 0.6], rotAt: function (tt) { return [0.25, 0.25, 0.6 - easeIO(clamp((tt - 0.2) / 0.26, 0, 1)) * 0.9]; } });
    var was = maniFlow && maniFlow.solved, now = flowOf(m);
    if (now.solved && !was) after(0.3, function () {
      if (st.pump) { Sound.chime(); Sound.grind(); showMsg('The spray stops. The needle climbs into the green, and somewhere up the corridor the lift clunks awake.', 6); }
      else showMsg('That is the run from the pump to the ram. Nothing is in it yet: the pump is not running.', 5);
    });
  }
  function startPump() {
    var st = S(); stepTo(145.55, 69.5, new V3(A.starter.x, A.starter.y, A.starter.z), 0.4);
    Hands.use('aqPump', { point: at(A.startBtn, 0, 0.018, 0), pose: 'point', tip: 'point', rot: [0.15, -0.95, 0.35], dur: 0.6, reach: 0.34, press: 0.012, onTouch: function () {
      st.pump = true; Sfx.play('breaker', { vol: 0.6, fallback: function () { Sound.clunk(); } }); Sfx.play('gen_start', { vol: 0.5, rate: 1.5, fallback: function () { Sound.grind(); } }); makeNoise(player.x, player.z, 20);
      after(0.9, function () { showMsg(flowOf(st.mani).solved ? 'The pump winds up and the gauge on the manifold swings into the green.' : 'The pump winds up — and oil sprays off the manifold on the back wall. It is not plumbed through to the ram.', 6); });
    } });
  }

  // ================= the lift =================
  var liftY = BASE_Y, gateK = 1, liftBusy = false, CARH = 2.3, CARW = 2.5;
  var blockLow = A.solid(136.3, 138.7, 47.35, 47.8, BASE_Y - 0.3, -0.4, true), blockTop = A.solid(136, 139, 47.38, 47.62, CW - 0.3, CW + 2.5, true), gateBlock = A.solid(136.2, 138.8, 47.2, 47.34, null, null, true);
  function stepLift(dt, instant) {
    var st = S(); if (!liftBusy) { liftY = st.lift ? CW : BASE_Y; gateK = instant ? 1 : damp(gateK, 1, 4, dt); }
    A.car.position.y = liftY; A.ram.scale.y = Math.max(0.02, liftY - BASE_Y); A.liftFloor.y = A.liftFloor.y2 = liftY;
    A.gate.forEach(function (gl) { gl.position.x = gl.userData.sd * (CARW / 4 + gateK * CARW * 0.47); });
    blockLow.off = !liftBusy && st.lift === 0; blockTop.off = !liftBusy && st.lift === 1; gateBlock.off = !liftBusy; gateBlock.y1 = liftY - 0.3; gateBlock.y2 = liftY + 2.5;
    var rdy = A.ready(); A.liftLamp.color.setHex(rdy ? 0x35ff8a : 0x3a0a06); A.callLamp.color.setHex(rdy ? 0x35ff8a : (Math.sin(playTime * 4) > 0 ? 0x8a1408 : 0x2a0604)); A.carLamp.color.setHex(rdy ? 0xffe0a0 : 0x2a1c08);
    Lt.lift.position.y = liftY + 2.0;
  }
  /* The ride.  You step up into the cage (it takes your weight with a boom), turn to the pendant, put a finger on the green
     button; the gate rattles across; the car drops a hand's breadth and then climbs, slow, past the basement wall, up through
     the floor of the rear gallery with the tank's glass sliding down beside you, over the rim — and the water is under you. */
  function ride(up) {
    var st = S(), T2 = 0, ev = {}, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, y0 = up ? BASE_Y : CW, y1 = up ? CW : BASE_Y, inCar = Math.abs(player.x - A.liftAt.x) < 1.2 && player.z < 47.4;
    var IN = inCar ? 0.3 : 1.7, PRESS = IN + 0.75, GATE = PRESS + 0.5, GO = GATE + 0.95, RUN = 7.2, STOP = GO + RUN, OPENT = STOP + 0.5, END = OPENT + 0.9;
    var sp = new V3(137.75, 0, 46.55), bp = new V3(), CN, hum = 0, stepPh = 0, lx = c0.x, lz = c0.z;
    function once(k2, t) { if (T2 >= t && !ev[k2]) { ev[k2] = 1; return true; } return false; }
    closePanel(); liftBusy = true; A.liftNow = { up: up, k: 0 };
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt;
      var inK = easeIO(clamp(T2 / IN, 0, 1)), run = clamp((T2 - GO) / RUN, 0, 1), trav = run < 0.12 ? run * run / 0.24 : run > 0.88 ? 1 - (1 - run) * (1 - run) / 0.24 : (run - 0.06) / 0.88, drop = hump(T2, GO - 0.3, GO - 0.12, GO - 0.06, GO + 0.3) * 0.045, settle = T2 > STOP ? Math.exp(-(T2 - STOP) * 7) * Math.sin((T2 - STOP) * 22) * 0.02 : 0;
      trav = clamp(trav / (1 - 0.12), 0, 1); liftY = lerp(y0, y1, trav) - drop + settle; A.liftNow.k = trav;
      gateK = T2 < GATE ? 1 : T2 < STOP + 0.3 ? 1 - seg(T2, GATE, GATE + 0.6) : seg(T2, OPENT, OPENT + 0.6);
      // the body: in over the sill (two steps, the second one up), then standing by the pendant
      var px = lerp(c0.x, sp.x, inK), pz = inCar ? lerp(c0.z, sp.z, inK) : lerp(c0.z, sp.z, easeIO(clamp((T2 - 0.1) / (IN - 0.1), 0, 1)));
      var d = Math.hypot(px - lx, pz - lz); lx = px; lz = pz; stepPh += d / 0.72 * PI; var dip = (1 + Math.cos(2 * stepPh)) / 2, mv = clamp(d / Math.max(dt, 1e-3) / 1.3, 0, 1);
      var sill = inCar ? 0 : hump(T2, IN * 0.42, IN * 0.56, IN * 0.62, IN * 0.86), boom = inCar ? 0 : Math.max(0, T2 - IN * 0.62) < 0.6 ? Math.exp(-Math.max(0, T2 - IN * 0.62) * 9) * Math.sin(Math.max(0, T2 - IN * 0.62) * 34) * 0.02 : 0;
      var rattle = run > 0 && run < 1 ? (Math.sin(T2 * 31) * 0.0035 + Math.sin(T2 * 47.3) * 0.0025) : 0;
      camera.position.set(px + rattle, liftY + 1.7 - dip * 0.03 * mv + sill * 0.06 + boom + rattle, pz);
      // the eyes: the pendant, then out through the mesh at the tank as it goes by, then the gate
      var yP = facing(138.6, 46.55), yT = up ? PI / 2 + 0.5 : PI / 2 + 0.2, yG = PI, a1 = seg(T2, IN * 0.5, IN + 0.25), a2 = seg(T2, GO - 0.2, GO + 1.6), a3 = seg(T2, STOP - 1.5, STOP + 0.2);
      var yaw = yaw0 + angDiff(yP, yaw0) * a1; yaw += angDiff(yT, yaw) * a2; yaw += angDiff(yG, yaw) * a3;
      var pit = lerp(pitch0, -0.14, a1); pit = lerp(pit, up ? lerp(0.05, -0.42, seg(trav, 0.35, 0.9)) : -0.1, a2); pit = lerp(pit, -0.04, a3);
      camera.rotation.set(pit + rattle * 2, yaw + Math.sin(T2 * 0.7) * 0.01, rattle * 3);
      if (camera.fov !== prefs.fov) { camera.fov = prefs.fov; camera.updateProjectionMatrix(); }
      player.x = px; player.z = pz; player.y = liftY; player.yaw = player.cy = yaw; player.pitch = player.cp = pit;
      if (once('grab', inCar ? 99 : IN * 0.3)) Hands.use('liftPost', { point: function () { return bp.set(138.72, liftY + 1.25, 47.42); }, pose: 'hook', tip: 'hook', rot: [0.1, -0.2, -0.2], dur: IN * 0.5, reach: 0.3 });
      if (once('boom', inCar ? 99 : IN * 0.62)) { Sound.thud(0.6); Sound.tone(96, 60, 0.5, 0.2, 'triangle'); Sound.noise(0.2, 2400, 0.14); }
      if (once('step1', inCar ? 99 : IN * 0.3)) Sound.step(0.14, 600);
      if (once('press', PRESS - 0.42)) Hands.use('liftBtn', { point: at(A.liftBtn[up ? 0 : 1], 0, 0.016, 0), pose: 'point', tip: 'point', rot: [0.1, -0.85, 0.3], dur: 0.75, reach: 0.4, press: 0.014, onTouch: function () { Sfx.play('rocker', { vol: 0.6, fallback: function () { Sound.click(); } }); Sfx.play('solenoid', { vol: 0.5, fallback: function () { Sound.clunk(); } }); pressT = 0.3; } });
      if (once('gate', GATE)) { Sfx.play('gate_rattle', { vol: 0.5, rate: 1.3, fallback: function () { Sound.rattle(); } }); Sound.noise(0.6, 2600, 0.12); }
      if (once('gateShut', GATE + 0.6)) Sound.clunk();
      if (once('go', GO - 0.25)) { Sound.clunk(); Sound.thud(0.5); Sound.tone(60, 44, 0.6, 0.25, 'sawtooth'); }
      if (once('arr', STOP)) { Sound.clunk(); Sound.thud(0.7); Sound.noise(0.3, 1800, 0.2); }
      if (once('gate2', OPENT)) { Sfx.play('gate_rattle', { vol: 0.5, rate: 1.2, fallback: function () { Sound.rattle(); } }); }
      hum = damp(hum, run > 0 && run < 1 ? 1 : 0, 3, dt); Sound.drone('aqlift', hum * 0.12, liftDrone);
      if (run > 0 && run < 1 && Math.random() < dt * 2.2) Sound.tone(900 + Math.random() * 900, 500, 0.08, 0.03, 'triangle');                // the guides tick and squeal
      pressT = Math.max(0, pressT - dt); A.liftBtn[up ? 0 : 1].position.x = -0.056 + Math.sin(clamp(pressT / 0.3, 0, 1) * PI) * 0.01;
      flashlight.intensity = player.light ? 2.0 : 0; Hands.fill.intensity = player.light ? 0.42 : 0.14; Hands.setLight(player.light);
      Hands.update(dt, { speed: d / Math.max(dt, 1e-3), yaw: yaw, pitch: pit, phase: stepPh, grounded: true });
      stepLift(dt); A.step(dt, false, true); A.beastRide(dt, up, trav, T2 - GO); stepDust(dt); CN.pulse = 0;
      return T2 >= END;
    }, end: function () {
      liftBusy = false; A.liftNow = null; st.lift = up ? 1 : 0; liftY = y1; Sound.drone('aqlift', 0, liftDrone); player.y = y1; setState('playing'); lockPointer(); stepLift(0, true);
      if (up && !st.top) { st.top = true; saveGame('the service lift', true); showMsg('The catwalks. The key piece is on the keepers’ platform, the far side of the water — and she knows the sound of this lift.', 7); }
    } });
  }
  var pressT = 0;
  function liftDrone(ctx, out, buf) {
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), m = ctx.createGain(); o1.type = 'sawtooth'; o1.frequency.value = 74; o2.type = 'triangle'; o2.frequency.value = 148.6; n.buffer = buf; n.loop = true; f.type = 'lowpass'; f.frequency.value = 520; m.gain.value = 0.6;
    o1.connect(m); o2.connect(m); n.connect(m); m.connect(f); f.connect(out); o1.start(); o2.start(); n.start();
  }

  // ================= the animal =================
  /* An Elasmosaurus, sixteen metres of her.  Until you fall in she is an exhibit: she swims her round, comes to the glass to
     look at you, slides past the basement ports.  Up on the catwalk you are over her water: she follows underneath, and every
     so often rears and strikes at where you are.  In the water she simply comes for you. */
  var SC = 1.45, B = ples, U = plesMesh.userData, NECK = 7, headW = new V3(), strikeP = new V3(), lashT = 5, phT = 0, way = 0, portCD = 0, deadT = 0, whereDied = '', exposedT = 0, sinkT = 0, chaseDelay = 0, siegeT = 0, hitFx = 0;
  var WAY = [[116, 55.5, 0.4], [120.5, 63, 1.6], [127, 65.5, 2.3], [130.4, 60, 1.2], [127, 54.6, 0.2], [120.5, 57, 1.5], [116, 64.6, 2.2], [113.8, 60, 0.9]];
  plesMesh.scale.setScalar(SC); plesMesh.rotation.order = 'YXZ';
  function swimTo(tx, ty, tz, speed, dt, turn) {
    var dx = tx - B.x, dz = tz - B.z, d = Math.hypot(dx, dz), df = angDiff(Math.atan2(dx, dz), B.rot), tr = (turn || 0.8) * dt, step = clamp(df, -tr, tr);
    B.rot += step; B.turn = damp(B.turn || 0, dt > 0 ? step / dt : 0, 3, dt);
    var fwd = Math.max(0.3, Math.cos(Math.min(Math.abs(df), PI / 2)));
    B.sp = damp(B.sp || 0, d > 0.6 ? speed * fwd : 0, 2.0, dt);
    B.x = clamp(B.x + Math.sin(B.rot) * B.sp * dt, T.x1 + 3.3, T.x2 - 3.3); B.z = clamp(B.z + Math.cos(B.rot) * B.sp * dt, T.z1 + 3.3, T.z2 - 3.3); B.y = damp(B.y, ty, 1.1, dt);
    return d;
  }
  function neckPose(yawT, pitT, curl, k) {            // total yaw and pitch spread along the neck (k eases it in), plus a swan curve
    k = k === undefined ? 1 : k;
    for (var q = 0; q < NECK; q++) { var w = q < 2 ? 0.75 : 1.1, sg = U.segs[q]; sg.rotation.y = lerp(sg.rotation.y, yawT / NECK * w, k); sg.rotation.x = lerp(sg.rotation.x, -pitT / NECK * w + (curl || 0) * (q < 3 ? -0.17 : q < 6 ? 0.15 : 0.07), k); }
  }
  function neckAim(tx, ty, tz, k, curl, gain) {       // bend the neck toward a point in the world
    plesMesh.updateMatrixWorld(true); tmpV.set(tx, ty, tz); plesMesh.worldToLocal(tmpV); tmpV.y -= 0.18; tmpV.z -= 2.42;
    var yawT = Math.atan2(tmpV.x, tmpV.z), pitT = Math.atan2(tmpV.y, Math.hypot(tmpV.x, tmpV.z));
    neckPose(clamp(yawT * (gain || 1.7), -2.7, 2.7), clamp(pitT * (gain || 1.7), -1.6, 2.4), curl, k);
    U.head.rotation.set(clamp(-pitT * 0.25, -0.5, 0.5), clamp(yawT * 0.2, -0.5, 0.5), 0);
  }
  function headPos(out) { U.head.updateWorldMatrix(true, false); return (out || headW).set(0, 0, 0.75).applyMatrix4(U.head.matrixWorld); }
  function keepNeckIn() {                              // never let her head go through the glass: curl the neck until it is inside
    for (var it = 0; it < 8; it++) {
      headPos(tmpV2); if (tmpV2.y > T.rim + 0.2) return;
      var ox = tmpV2.x < T.x1 + 0.9 ? 1 : tmpV2.x > T.x2 - 0.9 ? -1 : 0, oz = tmpV2.z < T.z1 + 0.9 ? 1 : tmpV2.z > T.z2 - 0.9 ? -1 : 0; if (!ox && !oz) return;
      var side = (ox * Math.cos(B.rot) - oz * Math.sin(B.rot)) >= 0 ? 1 : -1;              // which way (in her own frame) is back into the tank
      for (var q = 0; q < NECK; q++) U.segs[q].rotation.y = clamp(U.segs[q].rotation.y + side * 0.07, -0.6, 0.6);
    }
  }
  function poseBeast(dt, speedK) {
    B.t += dt; var hunting = speedK > 1.3, w = (hunting ? 4.6 : 1.9) * (0.5 + 0.5 * clamp(B.sp / 2, 0.2, 1.6));
    phT += dt * w;
    plesMesh.position.set(B.x, B.y + Math.sin(B.t * 1.1) * 0.06, B.z); plesMesh.rotation.set(-(B.pitch || 0), B.rot, B.roll !== undefined ? B.roll : -clamp(B.turn || 0, -0.8, 0.8) * 0.3);
    U.flips.forEach(function (f, n) { var ph = phT + (n > 1 ? 1.5 : 0); f.rotation.z = f.userData.sd * Math.sin(ph) * 0.42; f.rotation.y = Math.cos(ph) * 0.22 * f.userData.sd; f.rotation.x = Math.cos(ph) * 0.3; });
    U.tail1.rotation.y = Math.sin(phT * 0.9 - 0.7) * 0.16 - clamp(B.turn || 0, -0.8, 0.8) * 0.35; U.tail2.rotation.y = Math.sin(phT * 0.9 - 1.6) * 0.24 - clamp(B.turn || 0, -0.8, 0.8) * 0.3;
  }
  function onWalk(x, z, y) { return y > CW - 0.6 && x > T.x1 + 0.2 && x < T.x2 - 0.1 && z > T.z1 && z < T.z2; }          // out over her water
  function inRefuge(x, z) { for (var q = 0; q < A.REFUGE.length; q++) { var R = A.REFUGE[q]; if (x > R.x1 && x < R.x2 && z > R.z1 - 0.1 && z < R.z2 + 0.1) return true; } return false; }
  function onDive(x, z, y) { var D = A.DIVE; return x > D.x1 - 0.2 && x < D.x2 + 0.2 && z > D.z1 - 0.2 && y > D.y - 0.4 && y < D.y + 1.5; }
  function startRise(kind) { B.state = 'rise'; B.kind = kind; B.riseT = 0; B.locked = false; B.hit = false; B.side = Math.abs(B.z - 60) < 1.2 ? (Math.random() < 0.5 ? 1 : -1) : B.z > 60 ? 1 : -1; Sound.noise(0.9, 900, 0.3); Sound.noise(1.2, 4200, 0.12, 0.2); Sound.tone(180, 90, 0.9, 0.12, 'sawtooth'); }          // (she comes up beside the walk, never through it)
  A.resetBeast = function () {
    var st = S(); B.x = 122; B.y = 0.9; B.z = 60; B.rot = 0.6; B.pitch = 0; B.roll = undefined; B.sp = 0; B.turn = 0; B.state = st.dead ? 'dead' : 'patrol'; B.stunT = 0; B.hit = false; way = 0; lashT = 5; portCD = 0; deadT = st.dead ? 99 : 0; hitFx = 0; chaseDelay = 0; plesMesh.visible = true;
    for (var q = 0; q < NECK; q++) U.segs[q].rotation.set(0, 0, 0); U.head.rotation.set(0, 0, 0); U.jaw.rotation.x = 0.06;
    if (st.dead) { B.x = 124; B.z = 57; B.rot = 2.2; } poseBeast(0, 1); if (st.dead) poseDead(0);
  };
  function poseDead(dt) {
    deadT += dt; var k = clamp(deadT / 5, 0, 1);
    B.y = damp(B.y, T.water - 0.55, 0.6, dt); B.roll = easeIO(k) * 2.9; B.pitch = 0; B.sp = 0; B.turn = 0; B.x += Math.sin(deadT * 0.05) * dt * 0.05; B.rot += dt * 0.012;
    plesMesh.position.set(B.x, B.y + Math.sin(B.t * 0.7) * 0.04, B.z); plesMesh.rotation.set(0, B.rot, B.roll); B.t += dt;
    neckPose(0.9, -1.5, 0, 0.03); U.head.rotation.set(0.3, 0.2, 0.4); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.5, 1, dt);
    U.flips.forEach(function (f, n) { f.rotation.z = damp(f.rotation.z, f.userData.sd * -0.5, 1, dt); f.rotation.y = 0; f.rotation.x = 0; }); U.tail1.rotation.y = damp(U.tail1.rotation.y, 0.3, 1, dt); U.tail2.rotation.y = damp(U.tail2.rotation.y, 0.4, 1, dt);
  }
  A.updateBeast = function (dt) {
    var st = S(), px = player.x, pz = player.z, py = player.y, inAQ = inRect(px, pz, AQ, 2), d, q, speedK = 1;
    A.wu.uTime.value = playTime;
    if (!inAQ) { B.state = st.dead ? 'dead' : 'patrol'; return false; }
    if (st.dead) { B.state = 'dead'; poseDead(dt); return false; }
    var exposed = onWalk(px, pz, py) && !inRefuge(px, pz), inWater = player.water, dive = onDive(px, pz, py), dp = dist(B.x, B.z, px, pz), ld = diffName === 'easy' ? 0 : diffName === 'hard' ? 0.75 : 0.3;
    var TEL = diffName === 'easy' ? 1.9 : diffName === 'hard' ? 1.2 : 1.5, LOCK = 0.46, HITR = diffName === 'hard' ? 1.7 : 1.5;
    hitFx = Math.max(0, hitFx - dt);
    if (B.state === 'stun') {
      B.stunT -= dt; B.sp = damp(B.sp, 0, 2, dt); B.y = damp(B.y, 1.4, 0.8, dt); neckPose(Math.sin(B.t * 13) * 1.2, -0.6, 0, 0.2); U.head.rotation.z = Math.sin(B.t * 21) * 0.4; U.jaw.rotation.x = 0.5 + Math.sin(B.t * 17) * 0.2;
      if (B.stunT <= 0) { B.state = inWater ? 'chase' : 'patrol'; lashT = 4 + Math.random() * 2; siegeT = 2.2; U.head.rotation.z = 0; }
      poseBeast(dt, 2); return false;
    }
    if (B.state === 'rise' || B.state === 'strike') {
      // --- the strike: rear out of the water on a coiled neck, fix on where you are (or will be), and hit it ---
      var ty = py + 1.45;
      if (B.state === 'rise') {
        B.riseT += dt; var rk = seg(B.riseT, 0, 0.7);
        if (B.kind === 'walk') swimTo(clamp(px, T.x1 + 3.3, T.x2 - 3.3), T.water - 0.7, 60 + B.side * 5.7, 3.6, dt, 1.8); else swimTo(clamp(px, T.x1 + 3.3, T.x2 - 3.3), T.water - 0.7, A.DIVE.z1 - 5.6, 3.6, dt, 1.8);
        B.pitch = damp(B.pitch || 0, 0.28, 2, dt);
        B.rot += angDiff(Math.atan2(px - B.x, pz - B.z), B.rot) * Math.min(1, dt * 2.4);
        if (!B.locked) strikeP.set(px + player.vx * ld * LOCK, ty, pz + player.vz * ld * LOCK);
        if (B.riseT >= TEL - LOCK && !B.locked) { B.locked = true; if (B.kind === 'walk' && inRefuge(px, pz)) strikeP.set(px, ty, pz); Sound.tone(520, 180, 0.35, 0.16, 'sawtooth'); }
        neckAim(strikeP.x, strikeP.y + 1.3 + (1 - rk) * -2.0, strikeP.z, 0.12 + rk * 0.2, 1.6 * rk, 1.25); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.62, 5, dt);
        if (B.riseT >= TEL) { B.state = 'strike'; B.sT = 0; Sound.noise(0.3, 2600, 0.4); }
        if (B.kind === 'walk' && !onWalk(px, pz, py) && !B.locked) { B.state = 'patrol'; lashT = 2.5; }                    // you got off the walk in time
        if (B.kind === 'dive' && !dive && !B.locked) { B.state = inWater ? 'chase' : 'patrol'; }
      } else {
        B.sT += dt; var sk = clamp(B.sT / 0.2, 0, 1);
        B.x += Math.sin(B.rot) * dt * 5 * (1 - sk); B.z += Math.cos(B.rot) * dt * 5 * (1 - sk);
        neckAim(strikeP.x, strikeP.y - 0.5 * sk, strikeP.z, 0.5 + sk * 0.5, 1.6 * (1 - sk), 1.9); U.jaw.rotation.x = B.sT < 0.2 ? 0.8 : damp(U.jaw.rotation.x, 0.1, 22, dt);
        if (B.sT >= 0.2 && !B.hit) {
          B.hit = true; var miss = dist(px, pz, strikeP.x, strikeP.z), safe = B.kind === 'walk' ? (!onWalk(px, pz, py) || inRefuge(px, pz)) : !dive;
          if (miss < HITR && !safe && Math.abs(py + 1.45 - strikeP.y) < 2) { whereDied = B.kind; die('ples'); return true; }
          Sound.clang(); Sound.thud(0.9); Sound.noise(0.4, 3000, 0.5); shake = Math.max(shake, 1.1); hitFx = 0.5; makeNoise(px, pz, 20);
          puff(strikeP.x, strikeP.y - 1.3, strikeP.z, 6, 0.9, 0.3);
          if (miss < HITR + 2.2) showMsg(B.kind === 'walk' && inRefuge(px, pz) ? 'She hits the bars a hand from your face and the whole walk rings.' : 'Her head goes through the place you were standing.', 3);
        }
        if (B.sT > 0.75) { B.state = 'sink'; sinkT = 1.3; B.hit = false; lashT = (diffName === 'easy' ? 8 : diffName === 'hard' ? 4.2 : 5.6) + Math.random() * 2.4; siegeT = 3.2 + Math.random() * 1.4; }
      }
      keepNeckIn(); poseBeast(dt, 2); return false;
    }
    if (B.state === 'sink') { sinkT -= dt; B.pitch = damp(B.pitch || 0, -0.2, 2, dt); swimTo(B.x + Math.sin(B.rot) * 4, 1.6, B.z + Math.cos(B.rot) * 4, 2.6, dt, 0.5); neckPose(0, 0.2, 0.2, 0.06); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.08, 3, dt); if (sinkT <= 0) B.state = 'patrol'; keepNeckIn(); poseBeast(dt, 1.4); return false; }
    B.pitch = damp(B.pitch || 0, 0, 1.5, dt);
    if (inWater && st.fell) {
      // --- in the water with her ---
      if (chaseDelay > 0) { chaseDelay -= dt; B.state = 'startle'; swimTo(129.5, 2.4, 53 + Math.sin(B.t * 3) * 2, 3.2, dt, 2.4); neckPose(Math.sin(B.t * 6) * 1.4, 0.8, 1, 0.1); U.jaw.rotation.x = 0.4; if (chaseDelay <= 0) { Sound.roar(true, 0.8); Sound.noise(0.8, 700, 0.4); } }
      else {
        B.state = 'chase'; speedK = 2; d = swimTo(px, T.water - 1.15, pz, (diffName === 'easy' ? 3.3 : diffName === 'hard' ? 4.5 : 3.95), dt, 1.5);
        neckAim(px, T.water + 0.15, pz, 0.14, 0.5, 1.5); U.jaw.rotation.x = damp(U.jaw.rotation.x, dp < 8 ? 0.7 : 0.25, 4, dt);
        headPos(); if (dist(headW.x, headW.z, px, pz) < 1.55 || dp < 2.6) { whereDied = 'water'; die('ples'); return true; }
      }
    } else if (dive && st.fell) {
      // --- you are out on the dive station: she works the edge of it ---
      B.state = 'siege'; siegeT -= dt; speedK = 1.6;
      swimTo(121 + Math.sin(B.t * 0.45) * 5.5, T.water - 1.0, 62.6 + Math.cos(B.t * 0.6) * 1.6, 2.8, dt, 1.0); neckAim(px, py + 1.2, pz, 0.05, 0.9, 1.1); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.3, 3, dt);
      if (siegeT <= 0) startRise('dive');
    } else if (onWalk(px, pz, py)) {
      // --- you are on the catwalk: she keeps under you ---
      B.state = 'stalk'; exposedT += dt; speedK = 1.4;
      swimTo(px + Math.sin(B.t * 0.5) * 3, T.water - 1.5, 60 + (B.z > 60 ? 1 : -1) * (4.6 + Math.cos(B.t * 0.4) * 1.2), 2.9, dt, 1.1); neckAim(px, T.water - 0.3, pz, 0.04, 0.3, 1.0); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.12, 3, dt);
      if (exposed) lashT -= dt; else lashT = Math.max(lashT, 1.6);
      if (lashT <= 0 && dp < 11 && !st.fell) startRise('walk');
    } else {
      // --- an exhibit: her round of the tank, a look at whoever is at the glass, a pass by the basement ports ---
      B.state = 'patrol'; portCD -= dt;
      var W = WAY[way], tx = W[0], tz = W[1], ty2 = W[2], spd = 1.9;
      if (A.showT > 0) { A.showT -= dt; var sp = A.showP; tx = sp[0]; tz = sp[1] + (A.showT > 5 ? 6 : A.showT > 2.5 ? 0 : -7) * sp[3]; ty2 = sp[2]; spd = 2.6; }
      else if (py < -1 && px < 139.4 && portCD <= 0) { for (q = 0; q < 2; q++) { var pc = (A.ports[q][0] + A.ports[q][1]) / 2; if (Math.abs(pz - pc) < 3.5) { A.showT = 9; A.showP = [130.6, pc, -1.75, pz > pc ? 1 : -1]; portCD = 26; B.x = 129; B.z = pc + 8 * A.showP[3]; B.y = -1.4; B.rot = A.showP[3] > 0 ? PI : 0; after(1.6, function () { Sound.thud(0.5); Sound.tone(70, 40, 1.6, 0.14, 'sine'); showMsg('The light in the port goes out. Something is passing it, and goes on passing.', 4.5); }); } } }
      d = swimTo(tx, ty2, tz, spd, dt, 0.75); if (d < 2.4 && !(A.showT > 0)) way = (way + 1) % WAY.length;
      var look = px > H.x1 && px < T.x1 && py < 2 && dp < 16;                               // somebody at the front glass
      if (look) neckAim(px, 1.6, pz, 0.03, 0.4, 1.0); else { neckPose(-clamp(B.turn || 0, -0.8, 0.8) * 2.2 + Math.sin(B.t * 0.5) * 0.3, 0.25 + Math.sin(B.t * 0.37) * 0.2, 0.5, 0.03); U.head.rotation.set(0.06, 0, 0); }
      U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.06 + Math.max(0, Math.sin(B.t * 0.3) - 0.9) * 2, 2, dt);
    }
    keepNeckIn(); poseBeast(dt, speedK);
    if (B.state === 'chase' || B.state === 'siege') chaseHold = 4;
    return false;
  };
  A.flash = function (inBeam) {
    var st = S(); if (st.dead || !inRect(player.x, player.z, AQ)) return 0;
    if (['rise', 'strike', 'chase', 'siege', 'stalk'].indexOf(B.state) < 0) return 0;
    headPos(); if (!inBeam(headW.x, headW.z, 20, 4) && !inBeam(B.x, B.z, 14, 4)) return 0;
    B.state = 'stun'; B.stunT = DIFF.stun * 0.8; B.hit = false; Sound.roar(true, 0.6); Sound.screech(); Sound.noise(1.0, 800, 0.4); return 1;
  };
  /* While the lift goes up she comes to the corner to see what is making the noise. */
  A.beastRide = function (dt, up, trav, t) {
    var st = S(); if (st.dead) { poseDead(dt); return; }
    A.wu.uTime.value = playTime; B.pitch = damp(B.pitch || 0, up ? 0.2 * seg(trav, 0.6, 1) : 0, 2, dt);
    swimTo(128.6, up ? lerp(0.6, T.water - 0.9, seg(trav, 0.25, 0.9)) : 1.2, 54.2 + Math.sin(B.t * 0.6) * 1.2, 2.6, dt, 1.3);
    if (up && trav > 0.55) { neckAim(camera.position.x, camera.position.y - 0.4, camera.position.z, 0.05, 1.3, 1.25); U.jaw.rotation.x = damp(U.jaw.rotation.x, 0.3, 2, dt); } else neckPose(0.2, 0.3, 0.5, 0.03);
    keepNeckIn(); poseBeast(dt, 1.3);
  };
  /* What you see when she gets you: the head, the open mouth, and then you are going over the rail and down with her. */
  A.kill = function (done) {
    var T2 = 0, DUR = 2.9, ev = {}, c0 = camera.position.clone(), yaw0 = camera.rotation.y, pitch0 = camera.rotation.x, fov0 = camera.fov, CN, sc = $('scare'), hp = new V3();
    function once(k2, t) { if (T2 >= t && !ev[k2]) { ev[k2] = 1; return true; } return false; }
    var dx = B.x - c0.x, dz = B.z - c0.z, dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl; var yaw1 = yaw0 + angDiff(Math.atan2(-dx, -dz), yaw0), wet = whereDied === 'water';
    Scares.sting(); Hands.over = null;
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt; A.wu.uTime.value += dt;
      var whip = easeOut(clamp(T2 / 0.2, 0, 1)), loom = seg(T2, 0.05, 0.5), bite = seg(T2, 0.55, 0.7), drag = seg(T2, 0.72, 2.3), fin = seg(T2, DUR - 0.75, DUR - 0.25), sh = 0.3 + loom * 0.4 + bite * 0.5;
      var cx = c0.x + dx * drag * 3.4, cz = c0.z + dz * drag * 3.4, cy = lerp(c0.y, T.water - 2.2, drag * drag) + Math.sin(drag * PI) * (wet ? 0 : 0.5);
      // her body off where it was, the neck brought round so the mouth stops just short of the lens
      B.x = clamp(c0.x + dx * lerp(6.2, 5.2, loom), T.x1 + 3.3, T.x2 - 3.3); B.z = clamp(c0.z + dz * lerp(6.2, 5.2, loom), T.z1 + 3.3, T.z2 - 3.3); B.rot = Math.atan2(c0.x - B.x, c0.z - B.z); B.y = lerp(T.water - 0.8, T.water - 2.6, drag); B.pitch = 0.25 * (1 - drag);
      poseBeast(dt, 2); var want = lerp(3.2, 1.25, loom) - bite * 0.2;
      for (var it = 0; it < 14; it++) { neckAim(cx - dx * want, cy - 0.1, cz - dz * want, 1, 1.2 * (1 - loom), 1.3 + it * 0.05); headPos(hp); if (hp.distanceTo(tmpV2.set(cx, cy, cz)) < want + 0.25) break; }
      U.jaw.rotation.x = Math.max(lerp(0.3, 0.85, loom) - bite * 0.6 + Math.sin(T2 * 11) * 0.08 * drag, fin * 0.85); U.head.rotation.z = Math.sin(T2 * 9) * 0.2 * drag * (1 - fin);
      camera.position.set(cx + Math.sin(T2 * 41) * sh * 0.04, cy + Math.sin(T2 * 53) * sh * 0.04, cz + Math.sin(T2 * 37) * sh * 0.03);
      headPos(hp); var pit = Math.atan2(hp.y - cy, Math.max(0.6, Math.hypot(hp.x - cx, hp.z - cz)));
      camera.rotation.set(lerp(pitch0, clamp(pit, -0.9, 1.0), seg(T2, 0.04, 0.4)) + Math.sin(T2 * 47) * sh * 0.02, lerp(yaw0, yaw1, whip) + Math.sin(T2 * 7) * 0.06 * drag, Math.sin(T2 * 3.1) * 0.3 * drag);
      var punch = bite * (1 - seg(T2, 0.75, 1.2)) * 14; if (Math.abs(camera.fov - (fov0 + punch)) > 0.05) { camera.fov = fov0 + punch; camera.updateProjectionMatrix(); }
      flashlight.intensity = 1.2; Hands.fill.intensity = 0.6; Hands.aim = [0.03, 0.04, 0.06, 0.12, 0.1, 0.25]; Hands.update(dt, {});
      var uw = seg(cy, T.water + 0.1, T.water - 0.5) > 0 ? clamp((T.water + 0.1 - cy) / 0.6, 0, 1) : 0;
      sc.style.background = T2 < 0.085 ? '#1a0003' : uw > 0 ? 'radial-gradient(ellipse at center, rgba(8,60,70,' + 0.55 * uw + ') 0%, rgba(2,22,30,' + 0.95 * uw + ') 100%)' : 'radial-gradient(ellipse at center, rgba(120,0,8,' + bite * 0.3 + ') 0%, rgba(160,0,10,' + bite * 0.7 + ') 100%)'; sc.style.opacity = 1;
      if (once('r', 0.02)) { Sound.roar(true, 0.9); Sound.splash(); } if (once('hit', 0.66)) { Scares.crunch(1); Sound.thud(1); } if (once('sp', wet ? 0.7 : 1.5)) Sound.splash(); if (once('b2', 1.9)) Sound.noise(1.0, 320, 0.5); if (once('o', DUR - 0.72)) Sound.roar(true, 0.8); if (once('last', DUR - 0.2)) { Scares.crunch(1); Sound.thud(1); }
      Scares.maw(seg(T2, DUR - 0.55, DUR - 0.18)); $('fade').style.opacity = seg(T2, DUR - 0.2, DUR - 0.1); CN.pulse = clamp(sh, 0, 1);
      return T2 >= DUR;
    }, end: function () { sc.style.background = 'none'; sc.style.opacity = 0; Hands.aim = null; camera.fov = prefs.fov; camera.updateProjectionMatrix(); camera.rotation.z = 0; U.head.rotation.z = 0; $('fade').style.opacity = 1; done(); setTimeout(function () { Scares.maw(0); $('fade').style.opacity = 0; }, 900); } });
  };
  A.deathLine = function () { return whereDied === 'water' ? 'She is faster in the water than you are.' : whereDied === 'dive' ? 'She took you off the dive station.' : 'She took you off the walkway.'; };

  // ================= hands and eyes for the set pieces =================
  var hQa = new THREE.Matrix4(), hX = new V3(), hY = new V3(0, 1, 0), hZ = new V3(), camQ = new Q4();
  /* A hand hooked over an edge or a rung in front of you: fingers going away along (fx, fz), the back of the hand up, the
     wrist dropped by `tilt`.  (The same turn serves both hands: the left is the right, mirrored.) */
  function gripQ(fx, fz, tilt, out) { hZ.set(-fx, 0, -fz).normalize(); hX.crossVectors(hY, hZ); out.setFromRotationMatrix(hQa.makeBasis(hX, hY, hZ)); return out.multiply(tmpQ.setFromAxisAngle(tmpV.set(1, 0, 0), tilt || 0)); }
  function toCam(pw, qw, o) { o.pos.copy(pw); camera.worldToLocal(o.pos); o.q.copy(camQ.copy(camera.quaternion).invert()).multiply(qw); }
  function newOver() { return { R: { pos: new V3(), q: new Q4(), pose: Hands.POSE.hook, k: 0 }, L: { pos: new V3(), q: new Q4(), pose: Hands.POSE.hook, k: 0 }, noTorch: false }; }
  function setCam(x, y, z, pit, yaw, roll) { camera.position.set(x, y, z); camera.rotation.set(pit, yaw, roll || 0); if (camera.fov !== prefs.fov) { camera.fov = prefs.fov; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(true); }
  var HANG = Hands.barPose(0.02), OPENH = Hands.POSE.barOpen, FLAT = Hands.POSE.push, blackout = 0, spanSag = 0, spanGone = false, brkK = 0, brkT = 0, zapK = 0, sc = null;
  function tint(css, op) { sc = sc || $('scare'); sc.style.background = css; sc.style.opacity = op; }

  // ================= the fall =================
  /* The last span is down.  You go for it anyway: three strides, the rail, air — and your hands come down on the stub of
     grating left bolted to the platform.  You hang.  You very nearly get up.  Then the stub lets go. */
  function fall(scripted) {
    var st = S(), T2 = scripted ? 0 : 4.55, ev = {}, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, CN, YAW = PI / 2, Z0 = clamp(player.z, 59.8, 60.2), EY = CW;
    var hang = new V3(A.STUB + 0.42, CW - 0.31, Z0), land = scripted ? new V3(112.4, 0, Z0 + 0.5) : new V3(clamp(player.x, T.x1 + 1.2, T.x2 - 1.2), 0, clamp(player.z, T.z1 + 1.2, T.z2 - 1.2));
    var O = Hands.over = newOver(), gq = new Q4(), fq = new Q4(), hR = new V3(), hL = new V3(), pR = new V3(), pL = new V3(), cy = c0.y, cx = c0.x, cz = c0.z, pit = pitch0, yaw = yaw0, roll = 0, slipR = 0, slipL = 0, END = 6.7, yawEnd = 0;
    function once(k2, t) { if (T2 >= t && !ev[k2]) { ev[k2] = 1; return true; } return false; }
    function grips() { A.span.rotation.z = -spanSag; A.span.updateMatrixWorld(true); hR.set(0.8, 0.03, Z0 - 60 - 0.21).applyMatrix4(A.span.matrixWorld); hL.set(0.8, 0.03, Z0 - 60 + 0.21).applyMatrix4(A.span.matrixWorld); }
    closePanel(); yawEnd = Math.atan2(-(121 - land.x), -(69.6 - land.z));
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt; A.wu.uTime.value += dt; var sh = 0, uw = 0, legs = false;
      if (T2 < 0.3) {                                   // three strides
        var r = easeIO(T2 / 0.3); cx = lerp(c0.x, 113.2, r); cz = lerp(c0.z, Z0, r); cy = CW + 1.7 - Math.sin(r * PI) * 0.07 - r * 0.08; pit = lerp(pitch0, -0.1, r); yaw = yaw0 + angDiff(YAW, yaw0) * r;
      } else if (T2 < 0.86) {                            // the leap
        var u = (T2 - 0.3) / 0.56; cx = lerp(113.2, hang.x, u); cy = CW + 1.62 + 0.42 * Math.sin(u * PI * 0.8) - 2.09 * Math.pow(u, 2.2); cz = Z0; pit = lerp(-0.1, 0.2, u); yaw = YAW;
        O.noTorch = T2 > 0.36; O.R.k = O.L.k = seg(T2, 0.34, 0.5); O.R.pose = O.L.pose = Hands.mixPose(OPENH, HANG, seg(u, 0.85, 1), []);
      } else if (T2 < 3.92) {                            // hanging
        var h = T2 - 0.86, swing = Math.exp(-h * 1.9) * Math.cos(h * 5.6), pull1 = hump(T2, 1.45, 1.95, 2.0, 2.12), pull2 = hump(T2, 3.25, 3.6, 3.62, 3.9), down = hump(T2, 2.35, 2.6, 3.0, 3.25);
        slipR = hump(T2, 1.98, 2.06, 2.2, 2.42); slipL = seg(T2, 3.6, 3.7); spanSag = 0.05 * seg(T2, 0.86, 0.95) + 0.05 * seg(T2, 1.98, 2.06) + 0.13 * seg(T2, 3.58, 3.66) + Math.sin(h * 23) * 0.004 * Math.exp(-h);
        cx = hang.x - 0.26 * swing + pull1 * -0.14 + pull2 * -0.1; cy = hang.y - spanSag * 0.8 + pull1 * 0.46 + pull2 * 0.34 - slipR * 0.1 + Math.sin(T2 * 9) * 0.006; cz = Z0 + Math.sin(h * 2.3) * 0.03 * Math.exp(-h * 0.6);
        pit = lerp(lerp(0.2, 0.62, seg(T2, 0.86, 1.1)), 0.1, pull1) * (1 - down) + down * -1.05; pit = lerp(pit, 0.42, pull2 * (1 - down)); yaw = YAW + Math.sin(h * 2.3) * 0.05 + down * 0.22; roll = Math.sin(h * 2.9) * 0.04 * Math.exp(-h * 0.5) + slipR * 0.1;
        sh = hump(T2, 0.86, 0.88, 0.92, 1.2) + hump(T2, 1.98, 2.0, 2.04, 2.3) * 0.7 + hump(T2, 3.58, 3.6, 3.64, 3.9) * 0.8; legs = true; O.R.k = O.L.k = 1; O.noTorch = true; O.R.pose = O.L.pose = HANG;
      } else if (T2 < 4.72) {                            // gone
        var f = T2 - 3.92; cy = hang.y - 0.22 - 4.9 * f * f * 1.18; cx = hang.x + f * 0.9; cz = Z0 + f * 0.3; pit = lerp(0.55, 1.25, seg(f, 0, 0.35)); yaw = YAW + f * 0.5; roll = f * 0.5; legs = true;
        O.R.k = O.L.k = 1; O.noTorch = true; O.R.pose = O.L.pose = OPENH; if (cy < T.water + 0.25) cy = T.water + 0.25;
      } else {                                           // the water
        var w = T2 - 4.72, under = hump(T2, 4.72, 4.8, 5.5, 6.0); if (!ev.cap) { ev.cap = 1; if (!scripted) { cx = c0.x; cz = c0.z; yaw = yaw0; } ev.sx = cx; ev.sz = cz; ev.sy = yaw; }
        cx = lerp(ev.sx, land.x, easeIO(clamp(w / 1.4, 0, 1))); cz = lerp(ev.sz, land.z, easeIO(clamp(w / 1.4, 0, 1))); cy = T.swim + 1.7 - under * 1.75 + Math.sin(w * 2.2) * 0.05 * (1 - under);
        yaw = ev.sy + angDiff(yawEnd, ev.sy) * easeIO(clamp((w - 0.3) / 1.4, 0, 1)); pit = lerp(0.6, -0.02, seg(w, 0, 1.2)) + under * 0.25 * Math.sin(w * 3); roll = (1 - seg(w, 0, 1.3)) * 0.5 * Math.cos(w * 2.4);
        uw = clamp((T.water + 0.12 - cy) / 0.3, 0, 1); sh = hump(T2, 4.72, 4.74, 4.8, 5.2); O.R.k = O.L.k = 1 - seg(T2, 5.9, 6.5); O.noTorch = T2 < 6.25; O.R.pose = O.L.pose = OPENH;
      }
      setCam(cx + (Math.random() - 0.5) * sh * 0.05, cy + (Math.random() - 0.5) * sh * 0.05, cz, pit, yaw, roll);
      // the hands: reaching, on the edge (one slips and catches again), then nothing to hold
      grips(); gripQ(-1, 0, 0.55, gq); gripQ(-1, 0, -0.5, fq);
      if (T2 < 0.86) { var uu = clamp((T2 - 0.34) / 0.52, 0, 1), e2 = uu * uu; camera.localToWorld(pR.set(0.2, -0.05 + uu * 0.2, -0.46)); camera.localToWorld(pL.set(-0.2, -0.05 + uu * 0.2, -0.46)); pR.lerp(hR, e2); pL.lerp(hL, e2); toCam(pR, gq, O.R); toCam(pL, gq, O.L); }
      else if (T2 < 3.92) {
        pR.copy(hR); pL.copy(hL); pR.x += slipR * 0.16; pR.y -= slipR * 0.24; pR.z -= slipR * 0.1; pL.x += slipL * 0.2; pL.y -= slipL * 0.4;
        toCam(pR, tmpQ.copy(gq).slerp(fq, slipR), O.R); toCam(pL, tmpQ.copy(gq).slerp(fq, slipL), O.L); O.R.pose = Hands.mixPose(HANG, OPENH, slipR, []); O.L.pose = Hands.mixPose(HANG, OPENH, slipL, []);
      } else { var fl = T2 * 9; O.R.pos.set(0.3 + Math.sin(fl) * 0.08, 0.02 + Math.cos(fl * 1.3) * 0.12, -0.38); O.L.pos.set(-0.3 + Math.cos(fl * 0.9) * 0.08, 0.06 + Math.sin(fl * 1.1) * 0.12, -0.36); O.R.q.setFromEuler(new THREE.Euler(0.9, -0.3, -0.5, 'YXZ')); O.L.q.setFromEuler(new THREE.Euler(0.9, 0.3, 0.5, 'YXZ')); }
      // the legs, swinging under you
      Body.show(legs && T2 > 0.9); if (legs) { var sw = Math.sin(T2 * 3.1), kk = T2 > 3.92 ? 1 : 0; Body.place(cx - 0.04, cy - 0.82, cz, YAW); Body.pose('R', 0.5 + sw * 0.3 + kk * 0.4, -0.55 - Math.max(0, sw) * 0.4 - kk * 0.4, -0.25, 0.04); Body.pose('L', 0.42 - sw * 0.32 + kk * 0.2, -0.5 - Math.max(0, -sw) * 0.45 - kk * 0.7, -0.25, 0.06); }      // kicking for a foothold that is not there
      // her, passing under you while you hang
      if (!st.dead && T2 > 1.6 && T2 < 3.95) { B.x = 113.8 + Math.sin(T2 * 0.4) * 0.8; B.z = lerp(52.5, 66.5, clamp((T2 - 1.9) / 2.0, 0, 1)); B.y = T.water - 1.25; B.rot = 0.12; B.pitch = 0; B.sp = 2.6; neckAim(cx, cy - 1.5, cz, 0.06, 0.5, 1.0); U.jaw.rotation.x = 0.2; poseBeast(dt, 1.4); }
      else if (!st.dead) { B.sp = 1; swimTo(129, 2, 54, 3, dt, 1.5); neckPose(0.2, 0.3, 0.5, 0.05); poseBeast(dt, 1.5); }
      // the lights go, from the west end, as the span rips the feeder out of its tray
      if (T2 > 3.95) blackout = clamp((T2 - 3.95) / 0.75, blackout, 1);
      if (T2 > 3.92 && !spanGone) { A.span.position.y -= dt * (T2 - 3.9) * 14; A.span.rotation.z -= dt * 3; A.span.rotation.x += dt * 1.2; if (A.span.position.y < T.water - 0.5) { spanGone = true; A.span.visible = false; } }
      if (T2 > 4.05) st.fell = true;
      flashlight.intensity = O.noTorch ? 0 : 2.0; Hands.fill.intensity = 0.5 * (1 - blackout * 0.5) + (uw ? 0.2 : 0); Hands.aim = null;
      Hands.update(dt, { speed: 0, yaw: yaw, pitch: pit, phase: 0, grounded: false });
      tint(uw > 0 ? 'radial-gradient(ellipse at center, rgba(6,40,48,' + 0.6 * uw + ') 0%, rgba(1,12,18,' + 0.96 * uw + ') 100%)' : 'none', uw > 0 ? 1 : 0);
      if (once('go', 0.02) && scripted) { Sound.step(0.2, 700); Sfx.play('grunt', { vol: 0.25, rate: 1.1 }); }
      if (once('catch', 0.86) && scripted) { Sound.clang(); Sound.thud(0.9); Sfx.play('grunt', { vol: 0.5, rate: 0.9 }); Sfx.play('gate_rattle', { vol: 0.5, rate: 0.8 }); }
      if (once('creak', 1.5) && scripted) Sound.creak(0.8); if (once('slip', 2.0) && scripted) { Sound.noise(0.12, 3000, 0.2); Sfx.play('gasp', { vol: 0.4 }); Sound.creak(1); }
      if (once('down', 2.6) && scripted) Sound.tone(60, 40, 1.4, 0.16, 'sine'); if (once('pull2', 3.25) && scripted) Sfx.play('grunt', { vol: 0.45, rate: 0.85 });
      if (once('shear', 3.6) && scripted) { Sound.clang(); Sound.spark(); Sound.noise(0.2, 5000, 0.4); }
      for (var q = 0; q < 6; q++) if (once('pop' + q, 4.0 + q * 0.11)) { Sound.spark(); flashA = 0.3; $('flash').style.opacity = 0.3; }
      if (once('splash', 4.72)) { Sound.splash(); Sound.thud(1); Sound.noise(1.6, 500, 0.5); A.cable.visible = true; }
      if (once('bub', 5.1)) Sound.noise(0.9, 300, 0.4); if (once('gasp', 5.95)) { Sfx.play('gasp', { vol: 0.6 }); Sound.noise(0.5, 2400, 0.3); }
      if (flashA > 0) { flashA = Math.max(0, flashA - dt * 2.5); $('flash').style.opacity = flashA.toFixed(3); }
      A.step(dt, false, true); stepDust(dt); CN.pulse = clamp(sh, 0, 1);
      return T2 >= END;
    }, end: function () {
      tint('none', 0); Hands.over = null; Body.show(false); st.fell = true; blackout = 1; spanGone = true; A.span.visible = false; A.cable.visible = true;
      player.x = land.x; player.z = land.z; player.y = T.swim; player.vy = 0; player.water = true; player.grounded = true; player.yaw = player.cy = yawEnd; player.pitch = player.cp = -0.02; player.light = player.battery > 0; player.stamina = Math.max(player.stamina, 60);
      chaseDelay = diffName === 'easy' ? 5.2 : diffName === 'hard' ? 2.4 : 3.7; B.x = 129.5; B.z = 53.5; B.y = 2; B.state = 'startle'; setState('playing'); lockPointer();
      showMsg('Dark. She is at the far end, thrashing at the sparks.  The amber light on the south side is the dive station — SWIM.', 6.5);
    } });
  }
  A.splashIn = function () { var st = S(); if (!st.fell && state === 'playing' && !st.dead) fall(false); else Sound.splash(); };

  // ================= out of the water, and the breaker =================
  function haul() {
    var st = S(), D = A.DIVE, T2 = 0, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, hx = clamp(player.x, D.x1 + 0.5, D.x2 - 0.5), O = Hands.over = newOver(), q = new Q4(), pR = new V3(), pL = new V3(), ev = {}, CN, DUR = 1.9;
    closePanel();
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt; A.wu.uTime.value += dt;
      var a = easeIO(clamp(T2 / 0.4, 0, 1)), up = easeIO(clamp((T2 - 0.45) / 0.75, 0, 1)), on = easeIO(clamp((T2 - 1.15) / 0.7, 0, 1));
      var cx = lerp(c0.x, hx, a), cz = lerp(lerp(c0.z, D.z1 - 0.42, a), D.z1 + 0.85, on * 0.9 + up * 0.1), cy = lerp(lerp(c0.y, D.y + 0.2 + up * 1.0, Math.max(a * 0.2, up)), D.y + 1.7, on);
      setCam(cx, cy + Math.sin(T2 * 30) * 0.004 * up * (1 - on), cz, lerp(lerp(pitch0, -0.25, a), -0.75, up) * (1 - on) - 0.03 * on, yaw0 + angDiff(PI, yaw0) * a, 0);
      gripQ(0, 1, 0.1, q); pR.set(hx - 0.27, D.y + 0.03, D.z1 + 0.16); pL.set(hx + 0.27, D.y + 0.03, D.z1 + 0.16); toCam(pR, q, O.R); toCam(pL, q, O.L); O.R.pose = O.L.pose = FLAT; O.R.k = O.L.k = a * (1 - seg(T2, 1.3, 1.7)); O.noTorch = T2 < 1.55;
      flashlight.intensity = O.noTorch ? 0 : 2.0; Hands.fill.intensity = 0.4; Hands.update(dt, { speed: 0, yaw: camera.rotation.y, pitch: camera.rotation.x, phase: 0, grounded: true });
      if (!ev.a && T2 > 0.38) { ev.a = 1; Sound.thud(0.5); Sound.noise(0.2, 2600, 0.2); } if (!ev.b && T2 > 0.5) { ev.b = 1; Sfx.play('grunt', { vol: 0.4 }); Sound.noise(0.9, 1500, 0.35); } if (!ev.c && T2 > 1.5) { ev.c = 1; Sound.step(0.2, 500); Sound.tone(1700, 900, 0.07, 0.05, 'triangle'); }
      A.beastHold(dt); A.step(dt, false, true); return T2 >= DUR;
    }, end: function () { Hands.over = null; player.x = hx; player.z = D.z1 + 0.85; player.y = D.y; player.water = false; player.yaw = player.cy = PI; player.pitch = player.cp = -0.03; siegeT = diffName === 'easy' ? 3.4 : 2.0; setState('playing'); lockPointer(); showMsg('Steel under you, and a rubber mat. The cabinet on the wall is the tank’s main breaker — and its feeder is lying in her water.', 6.5); } });
  }
  A.beastHold = function (dt) { var st = S(); if (st.dead) { poseDead(dt); return; } swimTo(121 + Math.sin(B.t * 0.5) * 5, T.water - 1.1, 61.5, 3, dt, 1.2); neckAim(camera.position.x, camera.position.y, camera.position.z, 0.05, 0.8, 1.1); keepNeckIn(); poseBeast(dt, 1.6); };
  /* The kill.  The breaker goes in against its spring; four hundred and eighty volts go down the torn feeder into the water
     she is lying in; and you are standing on a rubber mat. */
  var arcs = [];
  (function () { var at2 = softTex('rgba(215,235,255,1)', 'rgba(120,170,255,.4)'); for (var q = 0; q < 10; q++) { var sp = dyn(new THREE.Sprite(new THREE.SpriteMaterial({ map: at2, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }))); sp.visible = false; scene.add(sp); arcs.push(sp); } A.gather('upper'); })();
  function zap() {
    var st = S(), T2 = 0, ev = {}, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, CN, DUR = 6.4, bx = clamp(player.x - 0.6, 119.5, 122.5), bz = 63.0, hp = new V3();
    function once(k2, t) { if (T2 >= t && !ev[k2]) { ev[k2] = 1; return true; } return false; }
    closePanel(); Hands.release(); B.state = 'dying'; B.hit = false;
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt; A.wu.uTime.value += dt;
      var live = T2 < 2.9 ? 1 : 0, rear = seg(T2, 0.1, 0.7), topple = seg(T2, 3.1, 4.0), jit = live * (0.6 + 0.4 * Math.sin(T2 * 43));
      // her: up out of the water, rigid, then down across it
      B.x = damp(B.x, bx, 3, dt); B.z = damp(B.z, bz, 3, dt); B.rot += angDiff(Math.atan2(c0.x - B.x, c0.z - B.z) + 0.5, B.rot) * Math.min(1, dt * 3); B.y = lerp(T.water - 1.0, T.water - 0.5, rear) - topple * 0.3; B.pitch = lerp(0, 0.5, rear) * (1 - topple) - topple * 0.1; B.roll = topple * 1.2; B.sp = 0;
      neckPose(Math.sin(T2 * 37) * 0.5 * jit + topple * 1.4, lerp(0.4, 2.0, rear) * (1 - topple) - topple * 0.9, 1.4 * rear * (1 - topple), 0.3); U.head.rotation.set(-0.5 * rear * (1 - topple), Math.sin(T2 * 29) * 0.4 * jit, Math.sin(T2 * 41) * 0.5 * jit); U.jaw.rotation.x = lerp(0.3, 0.85, rear) * (1 - topple * 0.5);
      poseBeast(dt, 2); U.flips.forEach(function (f, n) { f.rotation.z = f.userData.sd * (0.4 + Math.sin(T2 * 31 + n) * 0.5 * jit); }); headPos(hp);
      // you: from the handle to her
      var look = seg(T2, 0.05, 0.45), lookY = lerp(T.water + 0.4, hp.y, 0.42), ty = Math.atan2(-(lerp(B.x, hp.x, 0.5) - c0.x), -(lerp(B.z, hp.z, 0.5) - c0.z)), tp = Math.atan2(lookY - c0.y, Math.hypot(B.x - c0.x, B.z - c0.z)), sh = live * 0.5 + hump(T2, 3.72, 3.75, 3.85, 4.3);      // (eyes on the water she is standing in, not her head)
      setCam(c0.x + (Math.random() - 0.5) * sh * 0.03, c0.y + (Math.random() - 0.5) * sh * 0.03 - hump(T2, 0, 0.08, 0.12, 0.4) * 0.05, c0.z, lerp(pitch0, clamp(tp, -0.35, 0.42), look), yaw0 + angDiff(ty, yaw0) * look, 0);
      // the current: off the end of the feeder, across the water, over her
      arcs.forEach(function (sp, n) { sp.visible = live > 0; if (!live) return; var u = n / arcs.length, r = Math.random(); if (n < 3) sp.position.set(A.cableEnd.x + (r - 0.5) * 1.5, T.water + Math.random() * 0.7, A.cableEnd.z + (Math.random() - 0.5) * 1.5); else if (n < 6) sp.position.set(lerp(A.cableEnd.x, B.x, Math.random()), T.water + 0.05, lerp(A.cableEnd.z, B.z, Math.random())); else sp.position.copy(hp).lerp(tmpV.set(B.x, T.water, B.z), Math.random()); var s2 = 0.4 + Math.random() * (n < 3 ? 2.6 : 1.4); sp.scale.set(s2, s2, 1); sp.material.opacity = Math.random() < 0.7 ? 0.9 : 0.1; });
      zapK = live * (0.5 + Math.random() * 0.7); if (once('lights', 0.3)) blackout = 0;
      if (once('slam', 0.0)) { Sound.clunk(); Sound.spark(); Sound.clang(); flashA = 0.7; st.power = true; Sound.roar(true, 1); }
      if (live && Math.random() < dt * 14) { Sound.spark(); if (Math.random() < 0.4) Sound.zap(); } if (once('scr', 0.5)) { Sound.screech(); Sound.roar(true, 0.9); } if (once('scr2', 1.7)) { Sound.screech(); Sound.roar(true, 0.7); }
      if (once('blow', 2.9)) { Sound.spark(); Sound.thud(1); Sound.noise(0.5, 5000, 0.6); flashA = 0.5; A.cable.visible = false; A.arc.material.opacity = 0; }
      if (once('fallS', 3.75)) { Sound.splash(); Sound.thud(1); Sound.noise(1.8, 600, 0.6); }
      if (once('dead', 4.3)) { st.dead = true; deadT = 0; } if (T2 > 4.3) poseDead(dt);
      if (once('winch', 4.7)) { st.ladder = true; Sound.grind(); Sfx.play('gate_rattle', { vol: 0.4, rate: 0.6 }); }
      if (flashA > 0) { flashA = Math.max(0, flashA - dt * 2.2); $('flash').style.opacity = flashA.toFixed(3); }
      flashlight.intensity = player.light ? 2.0 : 0; Hands.fill.intensity = 0.4 + zapK * 0.5; Hands.update(dt, { speed: 0, yaw: camera.rotation.y, pitch: camera.rotation.x, phase: 0, grounded: true });
      A.step(dt, false, true); CN.pulse = clamp(sh, 0, 1);
      return T2 >= DUR;
    }, end: function () { zapK = 0; arcs.forEach(function (sp) { sp.visible = false; }); st.dead = true; st.power = true; st.ladder = true; B.state = 'dead'; setState('playing'); lockPointer(); showMsg('She does not come up again.  Across the tank the keepers’ ladder is running down into the water.', 7); } });
  }

  // ================= ladders =================
  /* Climbing: hand over hand, a rung at a time.  o: { x, z } where the ladder is, fx, fz which way you face it, y0, y1 your
     feet at the start and the end, then(): where you are put afterwards. */
  function climb(o) {
    var T2 = 0, c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, up = o.y1 > o.y0, hgt = Math.abs(o.y1 - o.y0), RUNG = 0.3, n = Math.round(hgt / RUNG), per = 0.31, IN = 0.45, CL = n * per, OUT = 0.7, O = Hands.over = newOver(), q = new Q4(), pR = new V3(), pL = new V3(), CN, last = -1;
    var sx = o.x - o.fx * 0.44, sz = o.z - o.fz * 0.44, YAW = Math.atan2(-o.fx, -o.fz), rx = -o.fz, rz = o.fx;       // where you hang off it; your right
    closePanel();
    startCine(CN = { pulse: 0, update: function (dt) {
      T2 += dt; A.wu.uTime.value += dt;
      var a = easeIO(clamp(T2 / IN, 0, 1)), c = clamp((T2 - IN) / CL, 0, 1), st2 = c * n, k2 = Math.floor(Math.min(st2, n - 0.001)), fr = st2 - k2, e = easeIO(fr), feet = o.y0 + (up ? 1 : -1) * (k2 + e) * RUNG, out = easeIO(clamp((T2 - IN - CL) / OUT, 0, 1));
      var cx = lerp(c0.x, sx, a), cz = lerp(c0.z, sz, a), cy = lerp(c0.y, feet + 1.62, a) + Math.sin(fr * PI) * 0.02;
      if (out > 0 && o.end) { cx = lerp(sx, o.end[0], out); cz = lerp(sz, o.end[1], out); cy = lerp(feet + 1.62, o.y1 + 1.7, out) + Math.sin(out * PI) * (up ? 0.12 : 0); }
      setCam(cx + Math.sin(st2 * PI) * 0.018 * rx, cy, cz + Math.sin(st2 * PI) * 0.018 * rz, lerp(lerp(pitch0, up ? 0.34 : -0.5, a), -0.05, out), yaw0 + angDiff(o.end && out > 0 ? lerp(YAW, o.endYaw === undefined ? YAW : YAW + angDiff(o.endYaw, YAW), out) : YAW, yaw0) * a, Math.sin(st2 * PI) * 0.014);
      // hands: each takes every second rung, the one that is moving opens as it goes
      gripQ(o.fx, o.fz, 0.35, q); var yb = Math.min(o.y0, o.y1), sR = clamp((feet - yb) / RUNG, 0, n - 0.001), kr = Math.floor(sR), er = easeIO(sR - kr), movR = kr % 2 === 0;
      var yR = Math.min(yb + 1.6 + 0.6 * (Math.floor(kr / 2) + (movR ? er : 1)), o.top + 1.05), yL = Math.min(yb + 1.9 + 0.6 * (Math.floor((kr - 1) / 2) + (movR ? 1 : er)), o.top + 1.05); fr = sR - kr;
      pR.set(o.x + rx * 0.15 - o.fx * 0.03, yR, o.z + rz * 0.15 - o.fz * 0.03); pL.set(o.x - rx * 0.15 - o.fx * 0.03, yL, o.z - rz * 0.15 - o.fz * 0.03);
      toCam(pR, q, O.R); toCam(pL, q, O.L); var lift = Math.sin(fr * PI); O.R.pose = movR ? Hands.mixPose(HANG, OPENH, lift * 0.8, []) : HANG; O.L.pose = movR ? HANG : Hands.mixPose(HANG, OPENH, lift * 0.8, []);
      O.R.k = O.L.k = a * (1 - out); O.noTorch = T2 > 0.25 && out < 0.6;
      if (k2 !== last && c > 0 && c < 1) { last = k2; Sound.tone(1500 + Math.random() * 500, 800, 0.06, 0.05, 'triangle'); Sound.noise(0.06, 2600, 0.12); if (o.wet && k2 < 4) Sound.noise(0.3, 1800, 0.12); }
      flashlight.intensity = O.noTorch ? 0 : (player.light ? 2.0 : 0); Hands.fill.intensity = 0.45; Hands.update(dt, { speed: 0, yaw: camera.rotation.y, pitch: camera.rotation.x, phase: 0, grounded: true });
      if (S().dead) poseDead(dt); A.step(dt, false, true); if (o.tick) o.tick(T2, IN + CL + OUT);
      return T2 >= IN + CL + (o.end ? OUT : 0.1);
    }, end: function () { Hands.over = null; var e2 = o.end || [sx, sz]; player.x = e2[0]; player.z = e2[1]; player.y = o.y1; player.vy = 0; player.yaw = player.cy = camera.rotation.y; player.pitch = player.cp = -0.05; player.water = !!o.toWater; setState('playing'); lockPointer(); if (o.then) o.then(); } });
  }
  function climbL1(up) { var L = A.L1; climb({ x: L.x, z: L.z, fx: -1, fz: 0, y0: up ? T.swim + 0.35 : CW, y1: up ? CW : T.swim + 0.35, top: CW, wet: up, end: up ? [T.x1 - 0.75, L.z] : null, toWater: !up, then: up ? function () { showMsg('The platform. The bench lamp is still on.', 4); } : function () { player.y = T.swim; } }); }
  function climbL2(up) { var L = A.L2, st = S(); climb({ x: L.x, z: L.z, fx: 1, fz: 0, y0: up ? 0 : CW, y1: up ? CW : 0, top: CW, end: up ? [A.PLAT.x1 + 0.7, L.z] : [L.x - 1.25, L.z], endYaw: up ? -PI / 2 : 0.5,
    tick: function (t, tot) { if (!up && t > tot - 0.75 && !st.gate) { st.gate = true; Sfx.play('door_unlock', { vol: 0.6, fallback: function () { Sound.clunk(); } }); Sound.creak(0.5); } } }); }

  // ================= every frame: what is drawn, what is lit, what moves =================
  var fogD = 0.03, LAMP_ORDER = null, tankL = 1, dripT = 3, groanT = 10;
  A.step = function (dt, instant, inCine) {
    var st = S(), px = player.x, pz = player.z, py = inCine ? camera.position.y - 1.7 : player.y, cx = inCine ? camera.position.x : px, inAQ = inRect(px, pz, AQ, 3) || !!inCine, t = playTime + (inCine ? clock : 0), q;
    var nearDoor = doorA > 0.02 && px < G.x1 + 0.5 && px > 44 && Math.abs(pz - 60) < 15;
    groups.gallery.visible = (inAQ && cx < 114) || nearDoor; groups.hall.visible = groups.upper.visible = groups.rails.visible = inAQ && cx > 79; groups.basement.visible = inAQ && cx > 131 && (py < 4.5 || liftBusy);
    plesMesh.visible = inAQ && cx > 79;
    stepDoors(dt); stepMani(dt, instant); stepLift(dt, instant); if (A.calling) A.calling(dt);
    // the ladder's lower half on its winch, the cage gate, the stub, the feeder
    var ld = A.ladderDrop, want = st.ladder ? ld.userData.down : ld.userData.up; ld.position.y = instant ? want : ld.position.y + clamp(want - ld.position.y, -dt * 1.3, dt * 1.3);
    A.cageGate.rotation.y = instant ? (st.gate ? -1.45 : 0) : damp(A.cageGate.rotation.y, st.gate ? -1.45 : 0, 3, dt); A.cageBox.off = !!st.gate;
    if (!inCine) { A.span.visible = !st.fell; if (!st.fell) { A.span.position.set(T.x1, CW, 60); A.span.rotation.set(0, 0, 0); spanSag = 0; spanGone = false; } A.cable.visible = st.fell && !st.power; blackout = st.fell && !st.power ? 1 : 0; }
    A.breaker.rotation.x = -(st.power ? 1 : brkK) * 1.1; A.brkLamp.color.setHex(st.power ? 0xff3a1a : 0x3a0a06); A.ladLamp.color.setHex(st.ladder ? 0x35ff8a : 0x0a1a0c);
    // light
    var zone = !inAQ ? 'out' : py < -0.6 || (cx > 139.4 && py < 2.6) ? 'base' : cx < 99.5 ? 'gal' : py > 6 ? 'upper' : 'hall', on = function (z2) { return zone === z2 ? 1 : 0; };
    var f1 = Math.sin(t * 17) + Math.sin(t * 6.1 + 1) + Math.sin(t * 41) * 0.5 > -1.2 ? 1 : 0.12, f2 = (Math.sin(t * 3.3) > 0.2 && Math.sin(t * 29) > -0.6) || Math.sin(t * 0.7) > 0.85 ? 1 : 0.05, out = blackout;
    tankL = instant ? (out ? 0.06 : 1) : damp(tankL, 1 - out * 0.94, 5, dt);
    Lt.galA.intensity = on('gal') * 0.5 * f1; Lt.galB.intensity = on('gal') * 0.4 * f2; Lt.galTank.intensity = on('gal') * 0.95;
    A.tubes[0].color.setHex(f1 > 0.5 ? 0xf4f7ff : 0x6a6e74); A.tubes[4].color.setHex(f2 > 0.5 ? 0xf4f7ff : 0x1c1c1a); A.tubes[2].color.setHex(0x3a3c40);
    var hallish = on('hall') + on('upper') * 0.6 + (zone === 'gal' && cx > 92 ? 0.6 : 0);
    Lt.tank.intensity = hallish * (1.5 * tankL + zapK * 3); Lt.tankN.intensity = (on('hall') + on('upper') * 0.5) * 0.95 * tankL; Lt.tankS.intensity = Lt.tankN.intensity; Lt.tankE.intensity = on('hall') * 0.9 * tankL;
    var lampK = (1 - out) * (st.power ? 0.72 : 1);
    Lt.cwE.intensity = (on('upper') + on('hall') * 0.5) * 0.95 * lampK * (0.85 + 0.15 * f1); Lt.cwM.intensity = (on('upper') + on('hall') * 0.4) * 0.9 * lampK * (st.power ? f1 : 1); Lt.cwW.intensity = (on('upper') + on('hall') * 0.5) * 0.9 * lampK;
    Lt.emerg.intensity = (on('upper') + on('hall')) * (out > 0.5 && !st.power ? 0.5 + 0.35 * Math.sin(t * 5) : 0); Lt.bench.intensity = (on('upper') + on('hall') * 0.5) * 0.75;
    var bl = Math.sin(t * 3.6) > 0 ? 1 : 0.1; Lt.dive.intensity = (on('upper') + on('hall')) * (st.fell && !st.dead ? 1.3 : 0.5) * bl; A.beacon.color.setHex(bl > 0.5 ? 0xffa030 : 0x402008);
    Lt.stair.intensity = on('base') * 0.6 * (0.7 + 0.3 * f1); Lt.stairLow.intensity = on('base') * 0.45; A.stairLamp.color.setHex(f1 > 0.5 ? 0xffb060 : 0x6a4018);
    Lt.baseN.intensity = on('base') * 0.5 * f1; Lt.baseS.intensity = on('base') * 0.44; Lt.basePump.intensity = on('base') * (st.pump ? 0.62 : 0.24); Lt.baseFeed.intensity = on('base') * 0.34 * f2; Lt.port.intensity = on('base') * 0.85 * tankL; Lt.lift.intensity = (on('base') + on('upper')) * (A.ready() ? 0.6 : 0.14);
    A.bTubes[0].color.setHex(f1 > 0.5 ? 0xf4f7ff : 0x6a6e74); A.bTubes[1].color.setHex(0x1c1c1a); A.bTubes[2].color.setHex(0xc8ccd4); A.bTubes[3].color.setHex(f2 > 0.5 ? 0xe4e7ee : 0x1c1c1a); A.bTubes[4].color.setHex(st.pump ? 0xe8d8b0 : 0x3a342a);
    if (!LAMP_ORDER) LAMP_ORDER = A.lamps.map(function (l, n) { return n; }).sort(function (a2, b2) { return A.lamps[a2].x - A.lamps[b2].x; });
    LAMP_ORDER.forEach(function (li, n) { var L = A.lamps[li], dead = out * LAMP_ORDER.length > n + 0.3, fl = Math.sin(t * 13 + L.ph) + Math.sin(t * 5.3 + L.ph * 2) > (st.power ? -0.6 : -1.7); L.mat.color.setHex(dead ? 0x1c1508 : fl ? (zapK > 0.3 ? 0xffffff : 0xffe2b0) : 0x4a3a1c); });
    A.benchLamp.color.setHex(0xffe6b0); A.tankTube.color.setHex(f2 > 0.3 || Math.sin(t * 0.9) > -0.6 ? 0xbfe8f0 : 0x6a8a90);
    // the water's own light: day-blue with the lamps, nearly nothing without them, and the colour of a welding arc when the feeder is live
    var uL = A.wu.uLight.value; uL.setRGB(0.55 * tankL + 0.035, 0.78 * tankL + 0.03, 0.8 * tankL + 0.04); if (out > 0.5 && !st.power) { var rp = 0.5 + 0.5 * Math.sin(t * 5); uL.r += 0.1 * rp; } if (zapK > 0) uL.setRGB(0.7 + zapK, 0.9 + zapK * 1.2, 1.1 + zapK * 1.6);
    A.underMat.opacity = 0.2 * tankL + 0.02; A.shaftMat.opacity = 0.2 * tankL; A.floorCaus.opacity = 0.5 * tankL; A.surfMat.envMapIntensity = 0.3 + tankL;
    A.arc.material.opacity = st.fell && !st.power && Math.random() < 0.04 ? 0.5 : A.arc.material.opacity * 0.8;
    // moving water: the caustics in the little tanks and on the hall floor, the shafts, the drift
    A.tCausTex.offset.set(t * 0.012, t * 0.017); A.floorCaus.map.offset.set(t * 0.02, t * 0.013); A.underMat.map.offset.set(t * 0.016, -t * 0.011); A.surfMat.normalMap.offset.set(t * 0.012, t * 0.018); A.tSurf.normalMap.offset.set(t * 0.02, t * 0.012);
    A.shafts.forEach(function (sh, n) { sh.rotation.y = n * 0.9 + Math.sin(t * 0.13 + n) * 0.5; sh.position.x += Math.sin(t * 0.21 + n * 2) * dt * 0.08; }); A.snow.position.y = Math.sin(t * 0.11) * 0.25; A.snow.position.x = Math.sin(t * 0.07) * 0.4;
    // the air: thinner fog indoors, so the hall reads as big as it is
    var fogT = zone === 'out' ? 0.03 : zone === 'gal' ? 0.021 : zone === 'base' ? 0.024 : 0.012; fogD = instant ? fogT : damp(fogD, fogT, 1.5, dt); scene.fog.density = fogD;
  };
  A.reset = function () {
    var st = S(); seq = []; liftBusy = false; A.calling = null; A.showT = 0; A.liftNow = null; Hands.over = null; Body.show(false); doorA = st.door ? 1 : 0; doorJ = 0; sdDown = st.staff >= 3 ? 1 : 0; sdFall.userData.hit = st.staff >= 3; sdJ = sdJv = 0; brkK = 0; zapK = 0; chaseDelay = 0; whereDied = ''; tint('none', 0);
    arcs.forEach(function (sp) { sp.visible = false; }); dust.forEach(function (d) { d.life = 0; d.s.visible = false; }); Sound.drone('aqlift', 0, liftDrone); Sound.drone('aqpump', 0, liftDrone);
    A.step(0, true);
  };
  A.checkpoint = false;
  A.dbg = { delay: function (v) { chaseDelay = v; }, siege: function (v) { siegeT = v; }, lash: function (v) { lashT = v; }, flow: function () { return maniFlow; }, turn: function (q) { turnTile(q); } };      // (for the frame checks in .dev)
  A.inside = function (x, z) { return inRect(x, z, AQ, -1.3); };
  A.overWater = function (x, z, y) { if (x < T.x1 || x > T.x2 || z < T.z1 || z > T.z2) return false; var f = A.floorAt(x, z, y); return !!f && f.kind === 'water'; };
  A.surface = function (x, z) { if (!inRect(x, z, AQ)) return null; var f = A.floorAt(x, z, player.y); return f && f.kind !== 'water' ? f.kind : null; };
  A.keyFree = function () { return true; };

  // ================= what E does here =================
  A.interact = function (px, pz) {
    if (!inRect(px, pz, AQ, 3)) return null;
    var st = S(), py = player.y, D = A.DIVE, q;
    if (!st.door && px < G.x1 && dist(px, pz, G.x1 - 0.9, 60) < 1.8) return { text: '[E] Push the door open', fn: openDoor };
    if (st.staff < 3 && py > 2 && py < 5 && px < SD.x && dist(px, pz, SD.x - 0.8, 59.4) < 1.7) return { text: st.staff ? '[E] Kick it again' : '[E] Kick the door in   ·   it stands ajar on a padlocked hasp', fn: kick };
    if (py < -1) {
      if (dist(px, pz, 145.6, 69.5) < 1.5) return st.pump ? { text: 'The hydraulic pump is running.' } : { text: '[E] Start the hydraulic pump', fn: startPump };
      if (pz > 73.2 && px > 141.4 && px < 144.6) { q = aimTile(); var fl = maniFlow || flowOf(st.mani); return q >= 0 ? { text: '[E] Turn the coupling a quarter', outline: tiles[q].ol, fn: (function (n) { return function () { turnTile(n); }; })(q) } : { text: fl.solved ? 'The manifold is plumbed through: FROM PUMP to TO LIFT RAM.' : 'Manifold: aim at a coupling and turn it.  Run the oil from FROM PUMP (left) through to TO LIFT RAM (right).' }; }
      if (!liftBusy && (dist(px, pz, 137.5, 48.4) < 1.7 || (Math.abs(px - 137.5) < 1.3 && pz < 47.6))) {
        if (st.lift === 1) return A.ready() ? { text: '[E] Call the lift', fn: function () { sendLift(0); } } : { text: 'The lift is up at the catwalks, and there is no pressure to bring it down.' };
        return A.ready() ? { text: '[E] Take the lift up', fn: function () { ride(true); } } : { text: st.pump ? 'SERVICE LIFT — the lamp on the call station blinks red: LIFT RAM, NO PRESSURE. The manifold in the pump room is not plumbed through.' : 'SERVICE LIFT — dead. It is hydraulic: its pump is in the pump room, south along this corridor.', fn: function () { Sound.deny(); Sfx.play('rocker', { vol: 0.4 }); } };
      }
    }
    if (py > CW - 0.6) {
      if (!liftBusy && (dist(px, pz, 137.5, 48.2) < 1.7 || (px > 136 && px < 139 && pz < 47.6))) return st.lift === 1 ? { text: '[E] Take the lift down', fn: function () { ride(false); } } : { text: '[E] Call the lift', fn: function () { sendLift(1); } };
      if (!st.fell && px < 115.2 && px > T.x1 && Math.abs(pz - 60) < 0.9) return { text: 'The last span is down. The stub of it on the platform is a long jump away —  [Space] go for it' };
      if (dist(px, pz, T.x1 - 0.6, A.L1.z) < 1.25) return st.dead && st.ladder ? { text: '[E] Climb down to the water', fn: function () { climbL1(false); } } : { text: 'The tank ladder. Its lower half is winched up out of the water: the winch is run from the dive station.' };
      if (dist(px, pz, A.PLAT.x1 + 0.6, A.L2.z) < 1.3) return { text: '[E] Climb down to the hall', fn: function () { climbL2(false); } };
    }
    if (player.water && st.fell) {
      if (pz > D.z1 - 1.5 && px > D.x1 - 0.5 && px < D.x2 + 0.5) return { text: '[E] Haul yourself out onto the dive station', fn: haul };
      if (dist(px, pz, A.L1.x + 0.6, A.L1.z) < 1.7) return st.ladder ? { text: '[E] Climb the ladder', fn: function () { climbL1(true); } } : { text: st.dead ? 'The ladder is still coming down.' : 'The keepers’ ladder: its bottom rung is a body’s length over your head. It is winched down from the dive station.' };
    }
    if (onDive(px, pz, py) && dist(px, pz, D.x2 - 1.0, POOL.z2 - 1.15) < 1.25) {
      if (st.power) return { text: 'MAIN FEEDER — LIVE.   LADDER WINCH — DOWN.' };
      return { text: '[Hold E] Force the main breaker in', prog: brkK, reset: function () { }, hold: function (dt) {
        brkK = Math.min(1, brkK + dt / (1.5 * DIFF.hold)); brkT = 0.2; Hands.use('aqBrk', { point: at(A.breaker, 0, 0, -0.36), pose: 'hook', tip: 'hook', rot: [0.5, 0.1, 0.9] });
        tickT -= dt; if (tickT <= 0) { tickT = 0.25; Sound.noise(0.1, 700, 0.3); Sound.tone(80, 60, 0.12, 0.2, 'sawtooth'); }
        if (brkK >= 1) zap();
      } };
    }
    if (py < 1 && px < T.x1 && dist(px, pz, A.L2.x - 1.15, A.L2.z) < 1.5) return st.gate ? { text: '[E] Climb the keepers’ ladder', fn: function () { climbL2(true); } } : { text: 'A caged ladder up to the keepers’ platform. The gate at its foot only opens from inside.' };
    return null;
  };
  function sendLift(to) { var st = S(), y0 = liftY, y1 = to ? CW : BASE_Y, t0 = playTime; liftBusy = true; Sound.clunk(); A.calling = function (dt) { var u = clamp((playTime - t0) / 6.5, 0, 1); liftY = lerp(y0, y1, easeIO(u)); gateK = u < 0.9 ? Math.max(0, gateK - dt * 2) : Math.min(1, gateK + dt * 2); Sound.drone('aqlift', u < 1 ? 0.07 : 0, liftDrone); if (u >= 1 && gateK >= 1) { st.lift = to; liftBusy = false; A.calling = null; Sound.clunk(); } }; }

  // ================= while you are in there =================
  A.update = function (dt, c, speed) {
    var st = S(), px = player.x, pz = player.z, py = player.y, n;
    for (n = seq.length - 1; n >= 0; n--) if (playTime >= seq[n].at) { var f = seq[n].fn; seq.splice(n, 1); f(); }
    if (!inRect(px, pz, AQ, 3)) return false;
    stepDust(dt); brkT -= dt; if (brkT <= 0 && !st.power) brkK = Math.max(0, brkK - dt * 1.4);
    A.checkpoint = !!st.top && !st.dead;
    // the first sight of her
    if (!st.seen.hall && px > H.x1 + 0.6 && py < 2) { st.seen.hall = 1; A.showT = 10; A.showP = [113.9, clamp(pz, 54, 66), 1.25, -1]; if (!st.dead) { B.x = 126; B.z = clamp(pz, 54, 66) + 7; B.y = 1.6; B.rot = -2.2; } Sound.tone(52, 36, 2.6, 0.2, 'sine'); Sound.tone(78, 50, 2.0, 0.08, 'triangle', 0.3); showMsg('The whole end of the hall is water. Something in it turns, and goes on turning.', 6); }
    if (!st.seen.staff && py > 2.4 && px > T.x2 + 0.6 && Math.abs(pz - 59.4) < 5 && st.staff < 3) { st.seen.staff = 1; showMsg('STAFF ONLY. The door stands a hand’s width open on a padlocked hasp.', 5); }
    if (!st.seen.base && py < -3 && px < 139.5) { st.seen.base = 1; showMsg('The basement. Pipes, the smell of old fish — and windows into the bottom of her tank.', 6); }
    if (!st.seen.walk && onWalk(px, pz, py) && !st.fell) { st.seen.walk = 1; showMsg('Open grating, and her water under it. The cages off the walk are KEEPER REFUGES.', 6); tip('aqwalk', 'When she rears, do not stand still: she strikes where you are. A [LMB] flash in her face stops her; a refuge cage stops her too.', 10); }
    // the last span: however you leave the end of the walk, you are jumping for the platform
    if (!st.fell && py > CW - 1.6 && px < 113.36 && px > T.x1 + 0.9 && Math.abs(pz - 60) < 1.2 && !st.dead) { fall(true); return true; }
    // sounds of the place
    var inHall = px > H.x1 && py > -0.6; dripT -= dt; if (dripT <= 0) { dripT = 1.2 + Math.random() * 3.6; var fq = 900 + Math.random() * 900; Sound.tone(fq, fq * 0.5, 0.05, 0.03, 'sine'); if (Math.random() < 0.3) Sound.tone(fq * 1.3, fq * 0.6, 0.05, 0.02, 'sine', 0.12); }
    groanT -= dt; if (groanT <= 0 && inHall && !st.dead && B.state === 'patrol') { groanT = 13 + Math.random() * 14; Sound.tone(58, 40, 2.4, 0.09, 'sine'); Sound.tone(87, 62, 1.8, 0.04, 'triangle', 0.2); }
    Sound.drone('aqpump', st.pump && py < 0 ? clamp(1 - dist(px, pz, A.pumpAt.x, A.pumpAt.z) / 24, 0.02, 1) * 0.16 : 0, liftDrone);
    if (st.pump && maniFlow && !maniFlow.solved && py < -1 && dist(px, pz, MX, MZ) < 9) { hissT -= dt; if (hissT <= 0) { hissT = 0.35; Sound.noise(0.4, 5200, 0.07 * clamp(1 - dist(px, pz, MX, MZ) / 9, 0, 1)); } }
    return false;
  };
  A.objective = function () {
    var st = S(), py = player.y;
    if (!st.door) return 'The Aquarium: the way in is the small door under the sign.';
    if (!st.seen.hall) return 'Find the Aquarium’s key piece. Go on through the tank gallery.';
    if (!st.top) {
      if (st.staff < 3) return 'The key piece is on the keepers’ platform, up over the tank, and there is no way up from the hall. Staff had their own: try the rear gallery, at the top of the ramps.';
      if (!st.pump) return 'A service lift goes up from the basement, and it is dead. It is hydraulic: find its pump.';
      if (!A.ready()) return 'Pump room: re-plumb the manifold on the back wall, from FROM PUMP through to TO LIFT RAM. The oil sprays from wherever the run is broken.';
      return 'The lift has pressure. Take it up to the catwalks.';
    }
    if (!st.fell) return 'Cross the catwalk to the keepers’ platform. When she rears, keep moving — or be in a refuge cage.';
    if (!st.dead) return onDive(player.x, player.z, py) ? 'The torn feeder is lying in her water, and you are on a rubber mat. Force the main breaker in — between her strikes.' : 'SWIM for the dive station: the amber light on the south side of the tank.';
    if (py < CW - 1 && (player.water || onDive(player.x, player.z, py))) return 'She is dead. Swim to the keepers’ ladder on the west wall and climb out.';
    return 'Take the key piece from the keepers’ bench.';
  };
  A.target = function () {
    var st = S();
    if (!st.door) return [G.x1 - 1, 60]; if (!st.seen.hall) return [H.x1 + 2, 60];
    if (!st.top) { if (st.staff < 3) return [SD.x - 0.8, 59.4]; if (!st.pump) return [145.6, 69.5]; if (!A.ready()) return [MX, MZ - 0.8]; return [137.5, 48.4]; }
    if (!st.fell) return [T.x1 - 1.5, 60]; if (!st.dead) return [121, 69.6];
    return player.y < CW - 1 && (player.water || onDive(player.x, player.z, player.y)) ? [A.L1.x + 0.6, A.L1.z] : [ZONES[0].key[0], ZONES[0].key[1]];
  };
})();
