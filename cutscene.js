/* Jurassic Massacre — the opening.
   First person, no cuts: walk up the road from the truck, look up at the sign, dust off the card reader, swipe the staff
   card (denied), clean the slot, swipe again (granted), watch the gate open, walk in, glance round — and turn to see it
   close and lock behind you.  It plays on a first New Game, is remembered in the browser afterwards, and can be skipped by
   holding Space (or the button in the corner).  Lines are subtitles only. */
'use strict';

var Cutscene = (function () {
  var C = { playing: false }, E = Entrance, GZ = WORLD - 0.6;
  var T = 0, done = null, skipHold = 0, skipKey = false, skipping = -1, fade = 1, subEl, skipEl, fadeEl, ringEl;
  var cam = { x: 0, y: 1.66, z: 0, yaw: 0, pitch: 0 }, bob = 0, lastX = 0, lastZ = 0, speed = 0, stepPh = 0, shakeT = 0, fired = {}, puffs = [];
  var RX = 4.15, RY = 1.42, RZ = WORLD + 0.72;                       // the face of the card reader

  // ---------- the camera's path: [time, x, y, z, yaw, pitch, ease]  (ease 0 = steady, 1 = slow in and out) ----------
  var PATH = [
    [0, 0.5, 1.66, WORLD + 39, 0.02, -0.06, 0], [3.2, 0.3, 1.66, WORLD + 31.5, -0.05, -0.02, 0], [5.4, 0.1, 1.66, WORLD + 26.2, 0.08, 0.03, 0], [8.2, 0.0, 1.66, WORLD + 19.6, 0.0, 0.16, 0],
    [10.6, 0.0, 1.66, WORLD + 14.2, 0.0, 0.31, 2], [13.6, 0.0, 1.66, WORLD + 13.6, -0.02, 0.33, 1],          // stare up at the sign
    [15.2, 0.9, 1.65, WORLD + 9.5, -0.3, 0.02, 1], [17.4, 4.0, 1.6, WORLD + 1.4, -0.05, -0.2, 1],          // down, across to the reader
    [29.2, 4.0, 1.6, WORLD + 1.4, -0.05, -0.2, 1],                                                          // the business with the card
    [31.0, 1.5, 1.64, WORLD + 4.4, 0.2, -0.02, 1], [38.2, 1.2, 1.64, WORLD + 4.9, 0.14, 0.0, 1],              // step back and watch it open
    [40.0, 0.4, 1.66, WORLD + 1.0, 0.03, -0.02, 3], [43.6, 0.0, 1.66, WORLD - 8.3, 0.0, -0.03, 2],            // through the gate
    [45.0, 0.0, 1.66, WORLD - 8.5, 0.72, -0.03, 1], [46.9, 0.0, 1.66, WORLD - 8.5, -0.78, 0.0, 1],            // left ... right
    [47.5, 0.0, 1.66, WORLD - 8.5, -0.7, 0.0, 1], [48.3, 0.0, 1.66, WORLD - 8.4, -PI, 0.0, 1],                // something moves behind you
    [50.4, -0.3, 1.66, WORLD - 5.2, -PI + 0.04, 0.0, 1], [52.3, -0.62, 1.63, WORLD - 1.34, -PI + 0.05, -0.1, 1],   // run back to it
    [55.6, -0.62, 1.63, WORLD - 1.34, -PI + 0.05, -0.1, 1], [57.6, -0.3, 1.66, WORLD - 3.4, -PI - 0.2, 0.02, 1],
    [59.6, 0.0, 1.66, START.z, -PI * 2, -0.03, 1]                                                              // turn to face the park
  ];
  var END = PATH[PATH.length - 1][0] + 0.6;
  var SUBS = [[10.9, 13.7, 'Family Zoo. Twelve years, and it still makes my skin crawl.'], [21.9, 23.6, 'Come on. Not tonight.'], [27.7, 29.4, 'There you go.'],
    [33.4, 36.2, 'Time to investigate.'], [52.9, 55.4, 'No. No, no, no — it’s locked.'], [57.2, 59.8, 'Fine. The long way round, then.']];
  function ease(k, e) { return e === 1 ? easeIO(k) : e === 2 ? easeOut(k) : e === 3 ? k * k : k; }
  function sample(t) {
    var i = 0; while (i < PATH.length - 2 && PATH[i + 1][0] <= t) i++;
    var a = PATH[i], b = PATH[i + 1], k = ease(clamp((t - a[0]) / (b[0] - a[0]), 0, 1), b[6]);
    cam.x = lerp(a[1], b[1], k); cam.y = lerp(a[2], b[2], k); cam.z = lerp(a[3], b[3], k); cam.yaw = lerp(a[4], b[4], k); cam.pitch = lerp(a[5], b[5], k);
  }
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
    E.hangLetter.rotation.z = E.hangLetter.userData.rest; Hands.aim = null; Hands.card.visible = false; Hands.release(); Sound.motorSet(0); Sound.windSet(0.06);
    puffs.forEach(function (p) { p.life = 0; p.sprite.visible = false; });
    subEl.classList.remove('show'); skipEl.classList.remove('show'); fadeEl.style.opacity = 0; document.body.classList.remove('letterbox');
  }

  // ---------- one frame ----------
  function update(dt) {
    var t0 = T; T += dt;
    // skipping: hold Space (or the button) for a second and a bit
    if (skipping < 0) { skipHold = skipKey ? skipHold + dt : Math.max(0, skipHold - dt * 2); ringEl.style.strokeDashoffset = 100 - clamp(skipHold / 1.1, 0, 1) * 100; if (skipHold >= 1.1) skipping = 0; }
    else { skipping += dt; fadeEl.style.opacity = clamp(skipping / 0.45, 0, 1); if (skipping >= 0.5) { finish(); return true; } }
    fade = T < 2.2 ? 1 - seg(T, 0.5, 2.2) : T > END - 0.01 ? 0 : 0; if (skipping < 0) fadeEl.style.opacity = fade;
    sample(T);
    // walking: bob with distance covered, a footfall every stride
    var d = Math.hypot(cam.x - lastX, cam.z - lastZ); lastX = cam.x; lastZ = cam.z; speed = damp(speed, dt > 0 ? d / dt : 0, 8, dt); bob += d * 1.9; stepPh += d;
    if (stepPh > 1.5) { stepPh = 0; var inside = cam.z < WORLD + 9; Sfx.play(inside ? 'step_stone' : 'step_road', { vol: 0.5, fallback: function () { Sound.step(inside ? 0.11 : 0.14, inside ? 700 : 480); } }); }
    var k = clamp(speed / 2.4, 0, 1.2); shakeT = Math.max(0, shakeT - dt * 2.4);
    camera.position.set(cam.x + Math.sin(bob * 0.5) * 0.02 * k + (Math.random() - 0.5) * shakeT * 0.05, cam.y + Math.sin(bob) * 0.034 * k + (Math.random() - 0.5) * shakeT * 0.05, cam.z);
    camera.rotation.set(cam.pitch + Math.sin(T * 0.7) * 0.004, cam.yaw + Math.sin(T * 0.45) * 0.006, Math.sin(bob * 0.5) * 0.006 * k);
    if (camera.fov !== 72) { camera.fov = 72; camera.updateProjectionMatrix(); }

    // --- the torch ---
    if (once('click', 1.5)) Hands.click(function () { C.lit = true; Sfx.play('torch_click', { fallback: function () { Sound.click(); } }); });
    var near = seg(T, 16.2, 17.6) * (1 - seg(T, 29.2, 30.6)) + seg(T, 51.6, 52.4) * (1 - seg(T, 55.6, 57));        // close work: the eye adjusts
    flashlight.intensity = C.lit ? lerp(2.3, 0.62, near) : 0; flashlight.angle = 0.6; Hands.fill.intensity = C.lit ? 0.42 : 0.12; Hands.setLight(!!C.lit);
    Hands.aim = win(T, 16.6, 29.6) ? [-0.03, -0.01, 0.1, 0.1, 0.16, 0] : win(T, 52.0, 56.0) ? [0.02, -0.02, 0.06, 0.0, -0.12, 0] : null;      // hold it back from things at arm's length

    // --- the sign: its loose letter stirs ---
    E.hangLetter.rotation.z = E.hangLetter.userData.rest + Math.sin(T * 1.7) * 0.035 + (win(T, 11, 14) ? Math.sin((T - 11) * 5.2) * 0.06 * (1 - (T - 11) / 3) : 0);
    if (once('creak', 11.2)) Sound.creak(0.5);

    // --- the reader ---
    if (once('wipe1', 17.5)) { Hands.use('wipe1', { point: pt(RX - 0.02, RY + 0.02, RZ), pose: 'wipe', tip: 'wipe', rot: [1.35, 0.05, 0.12], dur: 2.5, reach: 0.38, move: function (t) { var u = Math.max(0, t - 0.38); return hv2.set(Math.sin(u * 5.2) * 0.1, 0.14 - u * 0.15, 0); } }); Sound.noise(0.5, 2600, 0.07, 0.4); Sound.noise(0.5, 2200, 0.07, 1.0); Sound.noise(0.5, 2400, 0.06, 1.55); }
    if (win(T, 17.92, 19.95)) { var u1 = T - 17.92, wx = Math.sin(u1 * 5.2) * 0.1, wy = 0.14 - u1 * 0.15; E.dustWipe(0.5 + (wx - 0.02) / 0.3, 0.5 + (wy + 0.02) / 0.46, 0.3, 0.42); if (Math.random() < dt * 22) puff(RX + wx, RY + wy, RZ, 1); }
    if (once('lcd1', 20.1)) { E.lcd('SWIPE CARD', '', '#39d86a'); Sound.tone(880, 880, 0.08, 0.1, 'square'); }
    if (once('card1', 20.3)) Hands.card.visible = true;
    if (once('swipe1', 20.5)) swipe('swipe1');
    if (once('read1', 21.32)) { E.lcd('READING ...', '', '#e2b93b'); Sound.noise(0.16, 5200, 0.14); }
    if (once('deny', 21.75)) { E.lcd('ACCESS DENIED', 'CARD ERROR', '#ff3a2a'); E.ledR.color.setHex(0xff2a1a); E.lights.gate.color.setHex(0xff3020); Sound.buzz(); }
    if (win(T, 21.75, 23.6)) E.lights.gate.intensity = 0.5 * (Math.sin(T * 14) > 0 ? 1 : 0.2);
    if (once('clear', 23.6)) { E.ledR.color.setHex(0x1a0404); E.lights.gate.intensity = 0; E.lcd('SWIPE CARD', '', '#39d86a'); }
    if (once('wipe2', 23.7)) { Hands.card.visible = false; Hands.use('wipe2', { point: pt(RX + 0.1, RY + 0.02, RZ + 0.02), pose: 'point', tip: 'point', rot: [1.1, 0.3, 0.3], dur: 1.75, reach: 0.34, move: function (t) { return hv2.set(Math.sin(t * 9) * 0.006, Math.sin(Math.max(0, t - 0.34) * 7.5) * 0.15, 0); } }); Sound.noise(0.3, 3000, 0.07, 0.4); Sound.noise(0.3, 3200, 0.07, 0.8); Sound.noise(0.3, 2800, 0.06, 1.15); }
    if (win(T, 24.04, 25.45)) { var u2 = T - 24.04; E.dustWipe(0.86, 0.5 + Math.sin(u2 * 7.5) * 0.33, 0.13, 0.5); if (Math.random() < dt * 16) puff(RX + 0.1, RY + Math.sin(u2 * 7.5) * 0.15, RZ, 1); }
    if (once('card2', 25.7)) Hands.card.visible = true;
    if (once('swipe2', 25.9)) swipe('swipe2');
    if (once('read2', 26.72)) { E.lcd('READING ...', '', '#e2b93b'); Sound.noise(0.16, 5200, 0.14); }
    if (once('grant', 27.2)) { E.lcd('ACCESS GRANTED', 'WELCOME BACK', '#39d86a'); E.ledG.color.setHex(0x35ff8a); E.lights.gate.color.setHex(0x35ff8a); E.lights.gate.intensity = 0.7; Sound.tone(880, 880, 0.1, 0.16, 'square'); Sound.tone(1320, 1320, 0.16, 0.16, 'square', 0.12); Sound.clunk(); }
    if (once('cardAway', 28.9)) Hands.card.visible = false;

    // --- the gate opens ---
    var open = 0, moving = false;
    if (win(T, 30.0, 37.6)) { var g1 = (T - 30.0) / 7.6; open = easeIO(g1) + Math.sin(T * 47) * 0.004 * clamp(1 - g1 * 4, 0, 1); moving = true; }
    else if (T >= 37.6 && T < 47.6) open = 1;
    else if (win(T, 47.6, 52.0)) { var g2 = (T - 47.6) / 4.4; open = 1 - g2 * g2 * (0.6 + 0.4 * g2); moving = true; }
    E.driven = true; E.setGate(clamp(open, 0, 1));
    var bf = E.setBeacon(moving || win(T, 29.4, 30.0), T); E.ctrlLed.color.setHex(T > 52 ? 0x1a0505 : moving ? 0x35ff8a : 0x1a0505);
    if (T > 29.4 && T < 52.2) { E.lights.gate.color.setHex(0xffa030); E.lights.gate.intensity = bf * 1.5; }
    Sound.motorSet(moving ? 0.22 : 0);
    if (once('start', 30.0)) { Sound.clunk(); Sound.creak(0.6); }
    if (once('creak2', 32.4)) Sound.creak(0.5); if (once('creak3', 35.3)) Sound.creak(0.4);
    if (once('stop1', 37.6)) { Sound.clunk(); Sound.thud(0.3); }
    if (once('start2', 47.6)) { Sound.clunk(); Sound.creak(0.7); }
    if (once('creak4', 49.8)) Sound.creak(0.6);
    if (once('slam', 52.0)) { Sound.clang(); shakeT = 1; E.lights.gate.intensity = 0; }
    if (once('spark', 52.35)) { Sound.spark(); E.lights.gate.color.setHex(0xbfd8ff); }
    if (win(T, 52.35, 52.75)) E.lights.gate.intensity = Math.random() < 0.5 ? 1.6 : 0; else if (T >= 52.75 && T < 53) E.lights.gate.intensity = 0;
    // --- try the gate ---
    if (once('rattle', 52.7)) { Hands.use('rattle', { point: pt(-0.347, 1.32, GZ), pose: 'hook', tip: 'hook', rot: [0.05, 0.15, 1.4], dur: 2.6, reach: 0.3, move: function (t) { var a = t > 0.3 && t < 2.1 ? Math.sin(t * 26) * 0.014 * (1 - Math.abs(t - 1.2) / 1.1) : 0; return hv2.set(0, 0, a); } }); }
    if (win(T, 53.0, 54.8)) { var rk = Math.sin((T - 52.7) * 26) * 0.006 * (1 - Math.abs(T - 53.9) / 1.1); E.leaves[0].pivot.rotation.y = rk; E.leaves[1].pivot.rotation.y = -rk * 0.6; if (Math.random() < dt * 9) Sound.rattle(); }

    // --- subtitles, letterbox, the hands, dust ---
    var line = ''; for (var i = 0; i < SUBS.length; i++) if (win(T, SUBS[i][0], SUBS[i][1])) line = SUBS[i][2];
    if (line !== C.line) { C.line = line; if (line) subEl.textContent = line; subEl.classList.toggle('show', !!line); }
    Hands.update(dt, { speed: speed, yaw: cam.yaw, pitch: cam.pitch, bob: bob, grounded: true });
    stepPuffs(dt);
    if (T >= END) { finish(); return true; }
    return false;
  }
  var hv2 = new THREE.Vector3();
  function swipe(key) {       // the card comes down through the channel
    Hands.use(key, { point: pt(E.slot.x + 0.005, RY + 0.25, RZ + 0.045), pose: 'pinch', tip: 'pinch', rot: [0.25, 0.15, 1.35], dur: 1.75, reach: 0.42,
      move: function (t) { var u = clamp((t - 0.5) / 0.3, 0, 1); return hv2.set(0, -u * u * (3 - 2 * u) * 0.36, 0); }, onTouch: function () { Sound.noise(0.22, 4200, 0.12, 0.1); } });
  }
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }
  function finish() {
    settle(); C.playing = false; prefs.intro = true; savePrefs();
    player.x = 0; player.z = START.z; player.yaw = 0; player.cy = 0; player.pitch = -0.03; player.cp = -0.03; player.light = true; C.lit = false;
    var d = done; done = null; if (d) d();
  }

  C.play = function (cb) {
    subEl = $('subs'); skipEl = $('skip'); fadeEl = $('fade'); ringEl = $('skipRing');
    T = 0; fired = {}; done = cb; skipHold = 0; skipKey = false; skipping = -1; C.playing = true; C.lit = false; C.line = ''; bob = 0; speed = 0; stepPh = 0;
    sample(0); lastX = cam.x; lastZ = cam.z;
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
