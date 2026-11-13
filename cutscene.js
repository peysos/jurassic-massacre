/* Jurassic Massacre — the opening.
   First person, no cuts: walk up the road from the truck, look up at the sign, dust off the card reader, swipe the staff
   card (denied), clean the slot, swipe again (granted), watch the gate open, walk in, glance round — and turn to see it
   close and lock behind you.  It plays on a first New Game, is remembered in the browser afterwards, and can be skipped by
   holding Space (or the button in the corner).  Lines are subtitles only. */
'use strict';

var Cutscene = (function () {
  var C = { playing: false }, E = Entrance, GZ = WORLD - 0.6;
  var T = 0, done = null, skipHold = 0, skipKey = false, skipping = -1, fade = 1, subEl, skipEl, fadeEl, ringEl;
  var cam = { x: 0, y: 1.66, z: 0, yaw: 0, pitch: 0 }, lastX = 0, lastZ = 0, speed = 0, stepPh = 0, shakeT = 0, fired = {}, puffs = [];
  var RX = 4.15, RY = 1.42, RZ = WORLD + 0.72;                       // the face of the card reader

  /* ---------- the walk ----------
     The body moves along smooth paths at a person's pace (about 1.3 m/s walking, 5 m/s in the sprint back to the gate),
     speeding up and slowing down over most of a second rather than sliding; where the head points is keyed separately, so
     looking about never drags the feet with it.  Segment: [t0, t1, points (x, z from the gate line), accel s, decel s]. */
  function Z(z) { return WORLD + z; }
  var SEGS = [
    [0.0, 9.6, [[0.55, 21.5], [0.35, 15.0], [0.2, 9.2]], 0, 1.1],                                        // up the road (already walking)
    [13.8, 21.0, [[0.2, 9.2], [1.6, 6.3], [3.65, 2.9], [4.5, 1.32]], 0.8, 1.0],                           // across to the card reader
    [33.0, 36.6, [[4.5, 1.32], [3.7, 2.4], [2.8, 3.3]], 0.6, 0.9],                                      // step back to watch it open
    [41.8, 54.8, [[2.8, 3.3], [1.1, 1.6], [0.3, -0.5], [0.0, -5.0], [0.2, -10.0], [0.3, -12.0]], 0.9, 0.7],   // in through the gate, looking about
    [55.3, 57.9, [[0.3, -12.0], [-0.1, -6.0], [-0.44, -0.99]], 0.5, 0.55],                                  // the sprint back, right up to the bars
    [60.9, 63.2, [[-0.44, -0.99], [-0.38, -2.3], [-0.3, -3.2]], 0.55, 0.7],                                // backing off from it
    [63.6, 67.6, [[-0.3, -3.2], [-0.15, -6.0], [0.0, START.z - WORLD]], 0.8, 1.0]                         // and into the plaza
  ].map(function (sg) {
    var pts = sg[2].map(function (p) { return new THREE.Vector3(p[0], 0, Z(p[1])); });
    var cv = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : new THREE.LineCurve3(pts[0], pts[1]);
    return { t0: sg[0], t1: sg[1], curve: cv, len: cv.getLength(), a: sg[3], b: sg[4], end: pts[pts.length - 1] };
  });
  // distance fraction covered at time fraction u, for a trapezoid speed profile (accelerate over a, cruise, decelerate over b; fractions of the segment)
  function travel(u, a, b) {
    u = clamp(u, 0, 1); var v = 1 / (1 - a / 2 - b / 2);
    if (a > 0 && u < a) return v * u * u / (2 * a);
    if (b > 0 && u > 1 - b) return 1 - v * (1 - u) * (1 - u) / (2 * b);
    return v * (a / 2 + (u - a));
  }
  var segV = new THREE.Vector3();
  function bodyAt(t) {
    var last = SEGS[0].curve.getPointAt(0, segV).clone();
    for (var i = 0; i < SEGS.length; i++) {
      var S2 = SEGS[i];
      if (t < S2.t0) return last;
      if (t <= S2.t1) { var T2 = S2.t1 - S2.t0; return S2.curve.getPointAt(clamp(travel((t - S2.t0) / T2, S2.a / T2, S2.b / T2), 0, 1), segV).clone(); }
      last = S2.end.clone();
    }
    return last;
  }
  /* Where the head points: [t, yaw, pitch].  Between keys it turns with an ease in and out (a head turn), and holds after. */
  var GY = 0.70;                                                                                         // toward the gate, from where you watch it open
  var LOOK = [
    [0, 0.02, -0.05], [3.5, -0.03, 0.0], [7.0, 0.02, 0.1], [9.6, 0.0, 0.22], [11.0, -0.03, 0.4], [13.2, 0.02, 0.38],      // the sign
    [14.8, 'at', 4.15, 1.2, 0.7], [20.2, 'at', 4.15, 1.42, 0.7], [21.2, 'at', 4.12, 1.36, 0.72],                           // to the reader, eyes on it
    [24.2, 'at', 4.12, 1.36, 0.72], [24.95, 'at', 4.2, 1.3, 0.72], [25.9, 'at', 4.14, 1.38, 0.72],                         // following the card down the slot
    [29.6, 'at', 4.14, 1.38, 0.72], [30.35, 'at', 4.2, 1.3, 0.72], [31.2, 'at', 4.12, 1.39, 0.72],
    [33.1, 'at', 4.12, 1.36, 0.72], [34.4, GY, -0.04], [36.6, GY - 0.05, 0.02], [41.6, GY - 0.02, 0.0],                              // watch it open
    [43.4, 0.35, -0.03], [45.4, 0.02, -0.02], [47.0, 0.0, 0.0], [48.4, 0.8, 0.02], [49.6, 0.78, -0.06],                    // through, then a look left (the shed)
    [51.0, -0.05, 0.0], [52.2, -0.9, -0.03], [53.6, -0.86, 0.0], [54.3, -0.4, 0.0],                                       // and right (the shop)
    [54.5, -0.38, 0.02], [55.35, -PI + 0.04, -0.02], [57.5, -PI + 0.08, -0.16], [58.1, -PI + 0.1, -0.3], [59.4, -PI + 0.06, -0.22],   // the screech: turn round, to the bar in your hand
    [60.9, -PI + 0.04, -0.12], [62.9, -PI - 0.15, 0.0], [64.6, -PI * 2, -0.03], [67.6, -PI * 2, -0.03]                       // back off, and face the park
  ];
  var END = 68.2;
  var SUBS = [[10.4, 13.2, 'Family Zoo. Twelve years, and it still makes my skin crawl.'], [25.9, 27.6, 'Come on. Not tonight.'], [31.7, 33.4, 'There you go.'],
    [37.4, 40.0, 'Right. Let’s see what’s left of the place.'], [58.4, 61.0, 'No. No, no, no — it’s locked.'], [64.0, 66.8, 'Fine. The long way round, then.']];
  /* A key may instead name a point to look at ([t, 'at', x, y, z from the gate line]): its yaw and pitch are worked out from
     wherever the body is at that moment, so the head stays on the thing you are walking up to. */
  function keyDir(k, t, p) {
    if (k[1] !== 'at') return [k[1], k[2]];
    var dx = k[2] - p.x, dz = Z(k[4]) - p.z, dy = k[3] - 1.66, hd = Math.hypot(dx, dz);
    return [Math.atan2(-dx, -dz), Math.atan2(dy, hd)];
  }
  function lookAt(t, p) {
    var i = 0; while (i < LOOK.length - 2 && LOOK[i + 1][0] <= t) i++;
    var a = LOOK[i], b = LOOK[i + 1], k = easeIO(clamp((t - a[0]) / (b[0] - a[0]), 0, 1)), da = keyDir(a, t, p), db = keyDir(b, t, p);
    cam.yaw = lerp(da[0], da[0] + angDiff(db[0], da[0]), k); cam.pitch = lerp(da[1], db[1], k);
  }
  function sample(t) { var p = bodyAt(t); cam.x = p.x; cam.z = p.z; cam.y = 1.66; lookAt(t, p); }
  function once(key, t) { if (T >= t && !fired[key]) { fired[key] = true; return true; } return false; }
  function win(t, a, b) { return t >= a && t < b; }

  // ---------- small effects ----------
  function puff(x, y, z, n) {
    for (var i = 0; i < n; i++) {
      var s = puffs.filter(function (p) { return p.life <= 0; })[0]; if (!s) return;
      s.sprite.position.set(x + (Math.random() - 0.5) * 0.08, y + (Math.random() - 0.5) * 0.08, z + 0.02); s.vx = (Math.random() - 0.5) * 0.1; s.vy = -0.05 - Math.random() * 0.12; s.vz = 0.05 + Math.random() * 0.16; s.life = s.max = 0.9 + Math.random() * 0.9; s.sprite.visible = true;
    }
  }
  var dustTex = softTex('rgba(190,178,150,.55)', 'rgba(170,158,130,.18)');
  for (var q = 0; q < 26; q++) { var sp = dyn(new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, transparent: true, depthWrite: false, opacity: 0 }))); sp.visible = false; sp.scale.set(0.07, 0.07, 1); scene.add(sp); puffs.push({ sprite: sp, life: 0, max: 1 }); }
  function stepPuffs(dt) { puffs.forEach(function (p) { if (p.life <= 0) return; p.life -= dt; var k = p.life / p.max; p.sprite.position.x += p.vx * dt; p.sprite.position.y += p.vy * dt; p.sprite.position.z += p.vz * dt; p.sprite.material.opacity = k * 0.5; var s = 0.05 + (1 - k) * 0.14; p.sprite.scale.set(s, s, 1); if (p.life <= 0) p.sprite.visible = false; }); }
  var hv = new THREE.Vector3();
  function pt(x, y, z) { return function () { return hv.set(x, y, z); }; }

  // ---------- the scene's fixed state at any moment (so a skip lands in exactly the same place as watching) ----------
  function settle() {
    E.driven = false; E.setGate(0); E.setBeacon(false, 0); E.dustFill(0.1); E.lcd(''); E.ledR.color.setHex(0x1a0404); E.ledG.color.setHex(0x041a08); E.ctrlLed.color.setHex(0x1a0505);
    E.lights.gate.intensity = 0; E.introLight = false; var L = E.lights.shed, h = L.userData.home; L.position.set(h[0], h[1], h[2]); L.distance = h[3]; L.decay = 1.4; L.color.setHex(0xffd9a0); L.intensity = 0;
    E.hangLetter.rotation.z = E.hangLetter.userData.rest; Hands.aim = null; Hands.cardHold = null; if (Hands.hold && Hands.hold.kind === 'bar') Hands.hold = null; E.leaves[0].pivot.rotation.y = 0; E.leaves[1].pivot.rotation.y = 0; Hands.card.visible = false; Hands.release(); Sound.motorSet(0); Sound.windSet(0.06);
    puffs.forEach(function (p) { p.life = 0; p.sprite.visible = false; });
    subEl.classList.remove('show'); skipEl.classList.remove('show'); fadeEl.style.opacity = 0; document.body.classList.remove('letterbox');
  }

  // ---------- one frame ----------
  var GOPEN = [34.0, 41.6], GCLOSE = [49.5, 56.5];                       // the gate: opens for you, then shuts behind you
  var tipW = new THREE.Vector3(), RF = E.readerFace, RD_FACE = RF.z;       // the face of the card reader (its dust film)
  function update(dt) {
    T += dt;
    // skipping: hold Space (or the button) for a second and a bit
    if (skipping < 0) { skipHold = skipKey ? skipHold + dt : Math.max(0, skipHold - dt * 2); ringEl.style.strokeDashoffset = 100 - clamp(skipHold / 1.1, 0, 1) * 100; if (skipHold >= 1.1) skipping = 0; }
    else { skipping += dt; fadeEl.style.opacity = clamp(skipping / 0.45, 0, 1); if (skipping >= 0.5) { finish(); return true; } }
    fade = T < 2.2 ? 1 - seg(T, 0.5, 2.2) : 0; if (skipping < 0) fadeEl.style.opacity = fade;
    sample(T);
    var tugB = 0; for (var yb = 0; yb < YANKS.length; yb++) tugB += yank(T - YANKS[yb][0] - 0.03) * YANKS[yb][1];
    cam.z -= tugB * 0.016; cam.pitch -= tugB * 0.012;
    /* the head on a walking body: lowest as each foot lands (one step = PI of phase), riding side to side over the stance leg,
       and a slow breath when standing.  Footfalls are heard as they land. */
    var d = Math.hypot(cam.x - lastX, cam.z - lastZ); lastX = cam.x; lastZ = cam.z; speed = damp(speed, dt > 0 ? d / dt : 0, 10, dt);
    var run = clamp((speed - 2.2) / 2.4, 0, 1), stride = lerp(0.74, 1.7, run), ph0 = stepPh; stepPh += d / stride * PI;
    if (Math.floor(stepPh / PI) !== Math.floor(ph0 / PI) && speed > 0.4) { var inside = cam.z < WORLD + 0.5; Sfx.play(run > 0.5 ? 'run_concrete' : 'step_concrete', { vol: (0.22 + run * 0.2) * (inside ? 0.9 : 1), rate: 0.94 + Math.random() * 0.12, fallback: function () { Sound.step((inside ? 0.1 : 0.13) + run * 0.08, inside ? 700 : 480); } }); }
    var wk = clamp(speed / 1.4, 0, 1), dip = (1 + Math.cos(2 * stepPh)) / 2, s1 = Math.sin(stepPh), br = Math.sin(T * 1.6);
    var bobY = -dip * (0.026 * wk * (1 - run) + 0.05 * run), bobX = s1 * (0.022 * wk * (1 - run) + 0.02 * run);
    shakeT = Math.max(0, shakeT - dt * 2.4);
    camera.position.set(cam.x + bobX * Math.cos(cam.yaw) + (Math.random() - 0.5) * shakeT * 0.04, cam.y + bobY + br * 0.004 * (1 - wk) - run * 0.06 + (Math.random() - 0.5) * shakeT * 0.04, cam.z - bobX * Math.sin(cam.yaw));
    camera.rotation.set(cam.pitch + br * 0.004 * (1 - wk) - dip * (0.004 * wk + 0.014 * run) - run * 0.03 + Math.sin(T * 0.7) * 0.002, cam.yaw + Math.sin(T * 0.45) * 0.004 + s1 * 0.006 * run, s1 * (0.005 * wk + 0.01 * run));
    if (camera.fov !== 72) { camera.fov = 72; camera.updateProjectionMatrix(); }

    // --- the torch ---
    if (once('click', 1.5)) Hands.click(function () { C.lit = true; Sfx.play('torch_click', { fallback: function () { Sound.click(); } }); });
    var near = seg(T, 20.4, 21.6) * (1 - seg(T, 33.2, 34.6)) + seg(T, 57.6, 58.3) * (1 - seg(T, 60.8, 62));        // close work: the eye adjusts
    flashlight.intensity = C.lit ? lerp(2.3, 0.55, near) : 0; flashlight.angle = 0.6; Hands.fill.intensity = C.lit ? 0.42 : 0.12; Hands.setLight(!!C.lit);
    Hands.aim = win(T, 20.6, 33.4) ? [0.0, -0.035, 0.08, -0.12, 0.2, 0] : win(T, 57.4, 61.0) ? [0.05, -0.09, 0.15, 0.3, -0.35, 0.1] : null;      // hold it back from things at arm's length

    // --- the sign: its loose letter stirs ---
    E.hangLetter.rotation.z = E.hangLetter.userData.rest + Math.sin(T * 1.7) * 0.03 + (win(T, 10.5, 14) ? Math.sin((T - 10.5) * 5.2) * 0.05 * (1 - (T - 10.5) / 3.5) : 0);
    if (once('creak', 10.7)) Sound.creak(0.5);

    // --- the reader: wipe the dust off with a flat palm, top to bottom in overlapping strokes ---
    /* fingers flat on the face, the heel of the hand lifted off it, side to side across the display and the lettering over it
       (never down over the keys, which stand proud of the face) */
    if (once('wipe1', 21.5)) { Hands.use('wipe1', { point: pt(RX - 0.01, RY + 0.105, RD_FACE + WIPE_Z), pose: 'wipeFlat', tip: 'wipe', rot: WIPE_ROT, dur: 2.7, reach: 0.5,
      move: function (t) { var u = Math.max(0, t - 0.5); return hv2.set(Math.sin(u * 4.6) * 0.06, 0.022 - Math.min(u, 1.9) * 0.025, 0); } });
      Sound.noise(0.5, 2600, 0.07, 0.55); Sound.noise(0.5, 2200, 0.07, 1.25); Sound.noise(0.5, 2400, 0.06, 1.9); }
    if (once('lcd1', 24.1)) { E.lcd('SWIPE CARD', '', '#39d86a'); Sound.tone(880, 880, 0.08, 0.1, 'square'); }
    if (once('card1', 24.25)) Hands.card.visible = true;
    if (once('swipe1', 24.5)) swipe('swipe1');
    if (once('read1', 25.32)) { E.lcd('READING ...', '', '#e2b93b'); Sound.noise(0.16, 5200, 0.14); }
    if (once('deny', 25.75)) { E.lcd('ACCESS DENIED', 'CARD ERROR', '#ff3a2a'); E.ledR.color.setHex(0xff2a1a); E.lights.gate.color.setHex(0xff3020); Sound.buzz(); }
    if (win(T, 25.75, 27.6)) E.lights.gate.intensity = 0.5 * (Math.sin(T * 14) > 0 ? 1 : 0.2);
    if (once('clear', 27.6)) { E.ledR.color.setHex(0x1a0404); E.lights.gate.intensity = 0; E.lcd('SWIPE CARD', '', '#39d86a'); }
    // a fingertip run up and down the card slot to clear the grit out of it
    if (once('wipe2', 27.7)) { Hands.card.visible = false; Hands.use('wipe2', { point: pt(E.slot.x, RY + 0.0, RF.sz + SLOT_Z), pose: 'point', tip: 'point', rot: SLOT_ROT, dur: 1.9, reach: 0.4,
      move: function (t) { return hv2.set(0, Math.sin(Math.max(0, t - 0.4) * 7.2) * 0.12, 0); } });
      Sound.noise(0.3, 3000, 0.07, 0.45); Sound.noise(0.3, 3200, 0.07, 0.85); Sound.noise(0.3, 2800, 0.06, 1.25); }
    // dust comes off exactly where the palm or fingertip is touching the face
    if ((win(T, 21.9, 24.2) || win(T, 28.05, 29.5)) && Hands.contact()) {
      Hands.tipWorld(tipW); var palm = T < 25;
      if (palm) { var lx = tipW.x - RX, ly = tipW.y - RY;
        if (Math.abs(tipW.z - RD_FACE) < 0.03 && Math.abs(lx) < RF.w / 2 + 0.02 && Math.abs(ly) < RF.h / 2) {
          E.dustWipe(0.5 + lx / RF.w, 0.5 + ly / RF.h, 0.2, 0.32); E.dustWipe(0.5 + lx / RF.w, 0.5 + (ly + 0.045) / RF.h, 0.17, 0.25);     // finger pads, and the length of the fingers above
          if (Math.random() < dt * 20) puff(tipW.x, tipW.y, RD_FACE + 0.02, 1);
        }
      } else if (Math.abs(tipW.z - RF.sz) < 0.03 && Math.abs(tipW.x - RF.sx) < 0.03 && Math.abs(tipW.y - RY) < RF.sh / 2 + 0.02) {
        E.slotWipe(0.5 + (tipW.y - RY) / RF.sh, 0.07, 0.45);
        if (Math.random() < dt * 12) puff(tipW.x, tipW.y, RF.sz + 0.02, 1);
      }
    }
    if (once('card2', 29.7)) Hands.card.visible = true;
    if (once('swipe2', 29.9)) swipe('swipe2');
    if (once('read2', 30.72)) { E.lcd('READING ...', '', '#e2b93b'); Sound.noise(0.16, 5200, 0.14); }
    if (once('grant', 31.2)) { E.lcd('ACCESS GRANTED', 'WELCOME BACK', '#39d86a'); E.ledG.color.setHex(0x35ff8a); E.lights.gate.color.setHex(0x35ff8a); E.lights.gate.intensity = 0.7; Sound.tone(880, 880, 0.1, 0.16, 'square'); Sound.tone(1320, 1320, 0.16, 0.16, 'square', 0.12); Sound.clunk(); }
    if (once('cardAway', 32.9)) Hands.card.visible = false;

    // --- the gate: opens for you; then, once you are well inside, the auto-close shuts it behind you ---
    var open = 0, moving = false;
    if (win(T, GOPEN[0], GOPEN[1])) { var g1 = (T - GOPEN[0]) / (GOPEN[1] - GOPEN[0]); open = easeIO(g1) + Math.sin(T * 47) * 0.004 * clamp(1 - g1 * 4, 0, 1); moving = true; }
    else if (T >= GOPEN[1] && T < GCLOSE[0]) open = 1;
    else if (win(T, GCLOSE[0], GCLOSE[1])) { var g2 = (T - GCLOSE[0]) / (GCLOSE[1] - GCLOSE[0]); open = 1 - Math.pow(g2, 1.45); moving = true; }      // the drive speeds up as it goes, and slams
    E.driven = true; E.setGate(clamp(open, 0, 1));
    var bf = E.setBeacon(moving || win(T, 33.4, GOPEN[0]), T); E.ctrlLed.color.setHex(T > GCLOSE[1] ? 0x1a0505 : moving ? 0x35ff8a : 0x1a0505);
    if (T > 33.4 && T < GCLOSE[1] + 0.1) { E.lights.gate.color.setHex(0xffa030); E.lights.gate.intensity = bf * 1.5; }
    var farK = clamp(1 - dist(cam.x, cam.z, 0, WORLD) / 22, 0.15, 1);
    Sound.motorSet(moving ? (T > GCLOSE[0] ? 0.09 * farK + 0.03 : 0.22) : 0);
    if (once('start', GOPEN[0])) { Sound.clunk(); Sound.creak(0.6); }
    if (once('creak2', 36.4)) Sound.creak(0.5); if (once('creak3', 39.3)) Sound.creak(0.4);
    if (once('stop1', GOPEN[1])) { Sound.clunk(); Sound.thud(0.3); }
    if (once('start2', GCLOSE[0])) { Sound.tone(160, 60, 0.18, 0.12, 'square'); Sound.noise(0.15, 900, 0.1); }                    // far behind you, and quiet under the wind
    if (once('creak4', 51.6)) Sound.creak(0.25);
    if (once('screech', GCLOSE[1] - 2.95)) Sfx.play('gate_close', { vol: 0.9, fallback: function () { Sound.creak(1); Sound.creak(0.8); Sound.noise(0.6, 1800, 0.18); } });   // the hinge shrieks, and the slam lands as it shuts
    if (once('slam', GCLOSE[1])) { if (!Sfx.has('gate_close')) Sound.clang(); else Sound.thud(0.6); shakeT = 0.45; E.lights.gate.intensity = 0; }
    if (once('spark', GCLOSE[1] + 0.35)) { Sound.spark(); E.lights.gate.color.setHex(0xbfd8ff); }
    if (win(T, GCLOSE[1] + 0.35, GCLOSE[1] + 0.75)) E.lights.gate.intensity = Math.random() < 0.5 ? 1.6 : 0; else if (T >= GCLOSE[1] + 0.75 && T < GCLOSE[1] + 1) E.lights.gate.intensity = 0;
    /* --- try the gate: one hand holds the light, so the free one closes round a pale at chest height and yanks it, three times,
       hard, the body rocking back with each pull; the leaf jumps on its latch and clanks back against the stop --- */
    if (once('grip', 57.55)) { Hands.hold = Hands.barGrip({ r: 0.013, at: function () { return E.leaves[0].leaf.localToWorld(barW.set(BAR_LX, 1.44, 0)); }, axis: function () { return barA; }, from: function () { return camera.position; }, twist: -0.25, dur: 0.6 }); }
    if (once('ungrip', 60.3) && Hands.hold && Hands.hold.kind === 'bar') { Hands.hold.want = 0; Hands.hold.speed = 1 / 0.55; }
    var tug = 0; for (var yi = 0; yi < YANKS.length; yi++) tug += yank(T - YANKS[yi][0]) * YANKS[yi][1];
    if (win(T, 58.0, 60.6)) { E.leaves[0].pivot.rotation.y = tug * 0.0058; E.leaves[1].pivot.rotation.y = -tug * 0.0032; }
    else if (once('leafRest', 60.6)) { E.leaves[0].pivot.rotation.y = 0; E.leaves[1].pivot.rotation.y = 0; }
    for (yi = 0; yi < YANKS.length; yi++) if (once('yank' + yi, YANKS[yi][0] + 0.1)) { Sfx.play('gate_rattle', { vol: 0.42 * YANKS[yi][1], rate: 0.95 + yi * 0.04, fallback: function () { Sound.rattle(); Sound.clunk(); } }); if (yi === 0) Sfx.play('grunt', { vol: 0.28 }); if (yi === 2) Sfx.play('grunt', { vol: 0.22, rate: 1.06 }); }

    // --- subtitles, letterbox, the hands, dust ---
    var line = ''; for (var i = 0; i < SUBS.length; i++) if (win(T, SUBS[i][0], SUBS[i][1])) line = SUBS[i][2];
    if (line !== C.line) { C.line = line; if (line) subEl.textContent = line; subEl.classList.toggle('show', !!line); }
    Hands.update(dt, { speed: speed, yaw: cam.yaw, pitch: cam.pitch, phase: stepPh, sprint: run > 0.3, grounded: true });
    stepPuffs(dt);
    if (T >= END) { finish(); return true; }
    return false;
  }
  var hv2 = new THREE.Vector3();
  // the wipe: rotation of the hand (camera space) and how far the tip of the fingers stands off the face
  var WIPE_ROT = [1.54, -0.5, 0.2], WIPE_Z = 0.006, SLOT_ROT = [1.25, 0.32, 0.25], SLOT_Z = 0.008;
  // the gate pale the hand grips (leaf space x of the 22nd pale, a pull's shape and the three pulls [time, strength])
  var BAR_LX = 0.06 + 22 * (3.42 - 0.1) / 24, barW = new THREE.Vector3(), barA = new THREE.Vector3(0, 1, 0), YANKS = [[58.1, 1], [58.75, 1.15], [59.45, 1.25], [60.0, 0.45]];
  function yank(u) { if (u <= 0) return 0; if (u < 0.13) return sstep(u / 0.13); if (u < 0.2) return 1; return Math.exp(-(u - 0.2) * 13) * Math.cos((u - 0.2) * 34); }
  /* The swipe: the card goes edge-first into the channel down the right side of the reader (its face toward you, its long
     side vertical, a centimetre of it in the slot), is drawn down the length of the channel and comes back out. */
  var CARD_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
  var cardP = new THREE.Vector3(), swipeU = null, SWIPE_ROT = [0.5, -0.3, 1.5], SWIPE_Y0 = 0.19, SWIPE_Y1 = -0.25;
  function swipe(key) {
    swipeU = Hands.use(key, { point: pt(E.slot.x, RY + SWIPE_Y0, RF.sz + 0.031), pose: 'pinch', tip: 'pinch', rot: SWIPE_ROT, dur: 1.75, reach: 0.42,
      move: function (t) { var u = clamp((t - 0.5) / 0.34, 0, 1); return hv2.set(0, -u * u * (3 - 2 * u) * (SWIPE_Y0 - SWIPE_Y1), 0); }, onTouch: function () { Sound.noise(0.22, 4200, 0.12, 0.1); } });
    Hands.cardHold = function () {                // held upright between finger and thumb, from the moment the hand sets off until it lets go of the swipe
      var u = swipeU; if (!u || u.leaving) return null;
      Hands.tipWorld(cardP); cardP.z -= 0.019; return { p: cardP, q: CARD_Q };
    };
  }
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }
  function finish() {
    settle(); C.playing = false; prefs.intro = true; savePrefs();
    player.x = 0; player.z = START.z; player.yaw = 0; player.cy = 0; player.pitch = -0.03; player.cp = -0.03; player.light = true; C.lit = false;
    var d = done; done = null; if (d) d();
  }

  C.play = function (cb) {
    subEl = $('subs'); skipEl = $('skip'); fadeEl = $('fade'); ringEl = $('skipRing');
    T = 0; fired = {}; done = cb; skipHold = 0; skipKey = false; skipping = -1; C.playing = true; C.lit = false; C.line = ''; speed = 1.36; stepPh = 0;
    sample(0); lastX = cam.x; lastZ = cam.z + 1.36 / 60;
    E.dustFill(1); E.lcd(''); E.driven = true; E.setGate(0); E.introLight = true;
    var L = E.lights.shed; L.position.set(2.2, 1.05, WORLD + 45.4); L.distance = 100; L.decay = 1.1; L.color.setHex(0xfff1d6); L.intensity = 2.3;        // the truck's headlights
    fadeEl.style.opacity = 1; skipEl.classList.add('show'); document.body.classList.add('letterbox'); Sound.windSet(0.12);
    Hands.setVisible(true); player.light = false;
    startCine({ update: update, music: 'intro' });
  };
  /* The way out: through the gate at a run, up the road to the truck's headlights, one look back at what has reached the gate. */
  C.ending = function (cb) {
    var t = 0, x0 = camera.position.x, z0 = Math.max(camera.position.z, WORLD - 2), yaw0 = camera.rotation.y, b = 0, lx = x0, lz = z0, st = 0;
    subEl = $('subs'); fadeEl = $('fade'); document.body.classList.add('letterbox'); Hands.aim = null;
    startCine({ music: 'escape', update: function (dt) {
      t += dt;
      var run = easeIO(clamp(t / 4.2, 0, 1)), x = lerp(x0, 1.4, run), z = lerp(z0, WORLD + 33, run), look = seg(t, 4.0, 4.9), d = Math.hypot(x - lx, z - lz); lx = x; lz = z; b += d * 1.9; st += d;
      if (st > 1.9) { st = 0; Sound.step(0.2, 520); }
      camera.position.set(x + Math.sin(b * 0.5) * 0.03, 1.66 + Math.sin(b) * 0.05, z); camera.rotation.set(-0.04 + look * 0.06, lerp(yaw0 + angDiff(PI, yaw0), 0, look), Math.sin(b * 0.5) * 0.012);
      if (camera.fov !== 76) { camera.fov = 76; camera.updateProjectionMatrix(); }
      flashlight.intensity = 2.3; Hands.fill.intensity = 0.42; Hands.update(dt, { speed: dt > 0 ? d / dt : 0, yaw: camera.rotation.y, pitch: camera.rotation.x, bob: b, sprint: t < 4, grounded: true });
      E.driven = true; E.setGate(1); E.setBeacon(true, t);
      if (t > 4.3 && !C.endRoar) { C.endRoar = true; Sound.roar(true, 0.9); }
      var line = t > 0.6 && t < 3.2 ? 'Go. Go, go, go.' : t > 5.0 && t < 6.9 ? 'Never again.' : ''; if (line) subEl.textContent = line; subEl.classList.toggle('show', !!line);
      fadeEl.style.opacity = seg(t, 6.2, 7.2);
      return t > 7.3;
    }, end: function () { C.endRoar = false; E.driven = false; E.setBeacon(false, 0); subEl.classList.remove('show'); document.body.classList.remove('letterbox'); camera.fov = 72; camera.updateProjectionMatrix(); cb(); fadeEl.style.opacity = 0; } });
  };
  window.addEventListener('keydown', function (e) { if (C.playing && e.code === 'Space') { skipKey = true; e.preventDefault(); } });
  window.addEventListener('keyup', function (e) { if (e.code === 'Space') skipKey = false; });
  window.addEventListener('load', function () { var b = $('skip'); if (!b) return; b.addEventListener('pointerdown', function () { skipKey = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, function () { skipKey = false; }); }); });
  return C;
})();
