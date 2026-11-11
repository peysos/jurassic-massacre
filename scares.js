/* Jurassic Massacre — scares.
   What you see when something catches you, and the first time each animal lets you know it is there.
   Each kill is a short first-person cinematic of its own: the raptor knocks you flat and stands over you, the rex takes you
   off the ground in its jaws, the plesiosaur drags you under, the pterosaur carries you into the dark.
   The first-encounter scares never hurt you: they exist to make you look over your shoulder afterwards. */
'use strict';

var Scares = (function () {
  var S = {}, el = null, slam = null, rise = 0;
  function tint(css, op) { el = el || $('scare'); el.style.background = css; el.style.opacity = op; }
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }
  function crunch(v) { Sound.noise(0.16, 1800, 0.5 * v); Sound.tone(150, 50, 0.22, 0.4 * v, 'sawtooth'); Sound.noise(0.1, 6000, 0.25 * v, 0.03); }
  function sting(v) { v = v === undefined ? 1 : v; Sound.tone(62, 31, 1.6, 0.55 * v, 'sine'); Sound.tone(1900, 2300, 0.5, 0.13 * v, 'sawtooth'); Sound.tone(2011, 2390, 0.5, 0.13 * v, 'sawtooth', 0.01); Sound.tone(2840, 3100, 0.35, 0.07 * v, 'square'); Sound.noise(0.5, 7000, 0.32 * v); }
  S.sting = sting;

  /* Rules every kill keeps, so the animal always looks right:
       - it starts where the animal really is and turns it smoothly: nothing snaps or slides;
       - the head only bends as far as a neck allows, and the jaw only opens as far as a jaw does; the rest comes from the body;
       - the camera never gets nearer to the snout than MIN_GAP, so you are never looking out through the inside of its head;
       - the animal moves in smooth, deliberate strokes.  Only the camera shakes, and that with a smooth tremor, not noise;
       - the first beat is the blow itself: the screen goes dark red for HIT seconds, and the animal takes up its position
         behind that, so the picture never shows it being moved. */
  var HEAD_MAX = 0.62, MIN_GAP = { raptor: 0.42, rex: 1.35 }, HIT = 0.085;
  function tremor(T, k) { return (Math.sin(T * 37 + k) + Math.sin(T * 53.3 + k * 2.1) * 0.6 + Math.sin(T * 19.7 + k * 0.7) * 0.8) / 2.4; }
  S.kill = function (kind, d, done) {
    var c0 = camera.position.clone(), yaw0 = camera.rotation.y, pitch0 = camera.rotation.x, T = 0, ev = {};
    var tx = kind === 'ples' ? ples.x : kind === 'ptero' ? ptero.x : d.x, tz = kind === 'ples' ? ples.z : kind === 'ptero' ? ptero.z : d.z;
    var dx = tx - c0.x, dz = tz - c0.z, dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;                 // from you toward it
    if (dl < 0.5) { dx = -Math.sin(yaw0); dz = -Math.cos(yaw0); }
    var yaw1 = yaw0 + angDiff(Math.atan2(-dx, -dz), yaw0), face = Math.atan2(-dx, -dz), DUR = { raptor: 2.0, rex: 2.5, ples: 2.4, ptero: 2.5 }[kind];
    var lit = flashlight.intensity > 0.3, rot0 = d ? d.rot : kind === 'ples' ? ples.rot : 0, canFall = inBox(c0.x - dx * 0.75, c0.z - dz * 0.75, 0.25) ? 0 : 1, fov0 = camera.fov, CN;
    function once(k, t) { if (T >= t && !ev[k]) { ev[k] = 1; return true; } return false; }
    function turned(k) { return rot0 + angDiff(face, rot0) * easeIO(clamp(k, 0, 1)); }
    function snap(t0, period) { var q = T < t0 ? 0 : ((T - t0) % period) / period; return q < 0.22 ? easeOut(q / 0.22) : 1 - easeIO((q - 0.22) / 0.78); }      // a bite: fast shut, slow open, 0..1
    sting();
    startCine(CN = { pulse: 0, update: function (dt) {
      T += dt;
      var whip = easeOut(clamp(T / 0.16, 0, 1)), sh = 0, cx = c0.x, cy = c0.y, cz = c0.z, yaw = lerp(yaw0, yaw1, whip), pitch = pitch0 * (1 - whip), roll = 0, red = 0, black = T > DUR - 0.16 ? 1 : 0, punch = 0, u, m, k;
      flashlight.intensity = (lit ? 1.25 : 0.6) + Math.sin(T * 50) * 0.2; Hands.fill.intensity = 0.6;       // so that you see what has you
      Hands.aim = [0.03, 0.04, 0.06, 0.12, 0.1, 0.25]; Hands.update(dt, {});                                // the torch comes up with your arm
      if (kind === 'raptor' || kind === 'rex') {
        m = d.mesh; u = m.userData; var rex = kind === 'rex', R = rex ? 2.9 : 1, SNOUT = rex ? 3.9 : 0.73;
        // where the head's pivot sits for a given forward lean of the body: [height, distance ahead of the feet]
        var headAt = function (lean) { return [(2.32 * Math.cos(lean) - 1.3 * Math.sin(lean)) * R, (2.32 * Math.sin(lean) + 1.3 * Math.cos(lean)) * R]; };
        var lean, hp, aim, D, hop = 0, jaw, bite, hd, gap, guard = 0;
        if (!rex) {
          // it rocks back, springs, hits you in the chest, and you are on your back with its mouth over your face
          var lunge = seg(T, 0.12, 0.42), down = seg(T, 0.4, 0.7); bite = T > 0.78 ? snap(0.78, 0.34) : 0; hop = Math.sin(lunge * PI) * 0.5;
          D = 2.95 - seg(T, 0.66, 1.25) * 0.6;
          lean = lerp(0.12, 0.52, down); cx -= dx * down * 0.45 * canFall; cz -= dz * down * 0.45 * canFall; cy = lerp(c0.y, 0.46, down * down);
          jaw = lerp(0.28, 0.82, seg(T, 0.15, 0.42)) - bite * 0.6;
          u.legs[0].hip.rotation.x = -0.5 * lunge; u.legs[1].hip.rotation.x = 0.4 * lunge; u.tail1.rotation.y = Math.sin(T * 6) * 0.25;
          roll = down * 0.2; sh = T < 0.4 ? 0.25 : 0.45 + bite * 0.5; red = down * (0.18 + bite * 0.5); punch = seg(T, 0.36, 0.46) * (1 - seg(T, 0.5, 0.9)) * 14 + bite * 4;
          if (once('r', 0.02)) Sound.roar(false, 1); if (once('hit', 0.41)) { Sound.thud(1); crunch(0.8); } if (once('b1', 0.8)) crunch(1); if (once('b2', 1.14)) { crunch(1); Sound.roar(false, 0.8); } if (once('b3', 1.48)) crunch(1);
        } else {
          // it does not need to move its feet: the head comes down out of the dark, closes on you, and the ground leaves
          var loom = seg(T, 0.12, 0.95), shut = seg(T, 0.95, 1.1), lift = seg(T, 1.08, 2.2), want = clamp(dl, 8.2, 10.8);
          D = want;
          lean = lerp(0.08, clamp((want - 4.6) / 11, 0.3, 0.56), loom) - lift * 0.26; cy = c0.y + lift * 3.3; cx += dx * lift * 0.5; cz += dz * lift * 0.5;
          bite = lift > 0 ? snap(1.3, 0.5) * 0.3 : 0; jaw = lerp(0.3, 0.95, seg(T, 0.15, 0.75)) - shut * 0.62 - bite;
          roll = lift * 0.6; sh = 0.3 + loom * 0.4 + lift * 0.7; red = shut * 0.5 + lift * 0.32; punch = shut * (1 - seg(T, 1.1, 1.5)) * 16;
          if (once('r', 0.02)) Sound.roar(true, 1); if (once('st', 0.35)) Sound.thud(0.9); if (once('st2', 0.7)) Sound.thud(1); if (once('hit', 0.97)) { crunch(1); Sound.thud(1); } if (once('b2', 1.4)) crunch(1); if (once('b3', 1.85)) { crunch(1); Sound.growl(1); }
        }
        // aim the head at you within what its neck allows, then make sure its snout stops short of the lens
        for (k = 0; k < 400; k++) {
          hp = headAt(lean); var Dc = D + (rex ? -Math.hypot(cx - c0.x, cz - c0.z) : Math.hypot(cx - c0.x, cz - c0.z));
          aim = Math.atan2(hp[0] + hop - cy, Math.max(0.2, Dc - hp[1])); hd = clamp(aim - lean, -HEAD_MAX, HEAD_MAX);
          gap = Math.hypot(Dc - hp[1], hp[0] + hop - cy) - SNOUT * Math.cos(aim - lean - hd);
          if (gap >= MIN_GAP[kind]) break; D += 0.008;
        }
        m.position.set(c0.x + dx * D, hop, c0.z + dz * D); m.rotation.y = face;
        u.body.rotation.x = lean; u.head.rotation.set(hd, 0, 0); u.jaw.rotation.x = clamp(jaw, 0.05, rex ? 0.95 : 0.85);
        pitch = lerp(pitch, clamp(aim, -0.3, 1.1) * 0.92, seg(T, 0.06, 0.5)) + (rex ? 0 : 0);
      } else if (kind === 'ples') {
        // it rears out of the water over you, the neck comes down like a whip, and then you are going down with it
        m = plesMesh; u = m.userData; var surge = seg(T, 0.08, 0.45), strike = seg(T, 0.5, 0.66), drag = seg(T, 0.68, 2.2), D3 = 8.7 - (1 - surge) * 0.9 - strike * 1.25 + drag * 0.5;
        m.position.set(c0.x + dx * D3, -1.25 + surge * 0.9 - drag * 1.3, c0.z + dz * D3); m.rotation.y = face; punch = strike * (1 - seg(T, 0.7, 1.2)) * 14;
        u.neck.rotation.set(lerp(0.1, -0.38, surge) + strike * 0.6, 0, 0); u.head.rotation.set(0.3, 0, 0); u.jaw.rotation.x = lerp(0.1, 0.8, surge) - seg(T, 0.64, 0.72) * 0.62;
        u.flips.forEach(function (f, i) { f.rotation.z = f.userData.sd * Math.sin(T * 6 + i) * 0.42; });
        cy = c0.y - drag * 2.6; cx += dx * drag * 1.2; cz += dz * drag * 1.2; pitch = lerp(pitch, 0.72, seg(T, 0.05, 0.4)) - strike * 0.5 + drag * 0.2; roll = Math.sin(T * 3.1) * 0.22 * drag;
        sh = 0.25 + surge * 0.3 + strike * 0.4; k = seg(T, 0.85, 1.9);
        tint('radial-gradient(ellipse at center, rgba(8,60,70,' + 0.55 * k + ') 0%, rgba(2,22,30,' + 0.95 * k + ') 100%)', 1); red = -1;
        if (once('s', 0.1)) { Sound.splash(); Sound.roar(true, 0.7); } if (once('hit', 0.66)) { crunch(1); Sound.splash(); Sound.thud(0.9); } if (once('b2', 1.2)) Sound.noise(1.2, 380, 0.5); if (once('b3', 1.7)) Sound.noise(0.8, 260, 0.5);
      } else {
        // talons, and the roof of the aviary coming down to meet you
        m = pteroMesh; u = m.userData; var grab = seg(T, 0.1, 0.5), up = seg(T, 0.5, 2.4), flap = Math.sin(T * 9);
        cy = c0.y + up * up * 11; cx += dx * up * 3; cz += dz * up * 3; pitch = lerp(pitch, 1.05, grab) - up * 0.5; roll = Math.sin(T * 3.3) * 0.25 * up;
        m.position.set(cx - dx * 0.5, cy + lerp(2.6, 1.3, grab), cz - dz * 0.5); m.rotation.set(-0.25, yaw1 + PI, 0);
        u.wings.forEach(function (w) { var sd = w.userData.sd; w.scale.x = 1; w.rotation.z = sd * flap * 0.65; w.userData.outer.rotation.z = sd * Math.sin(T * 9 - 0.9) * 0.5; });
        u.head.rotation.set(0.6, 0, 0); u.jaw.rotation.x = 0.25 + (flap * 0.5 + 0.5) * 0.25;
        sh = 0.3 + grab * 0.45; red = grab * 0.28; flashlight.angle = 1.05; punch = seg(T, 0.42, 0.52) * (1 - seg(T, 0.55, 1.0)) * 14;
        if (once('s', 0.05)) Sound.screech(); if (once('hit', 0.5)) { crunch(0.8); Sound.thud(0.7); } if (once('f1', 0.9)) Sound.noise(0.3, 900, 0.4); if (once('f2', 1.6)) Sound.noise(0.3, 900, 0.4); if (once('s2', 1.7)) Sound.screech(); if (once('f3', 2.1)) Sound.noise(0.3, 900, 0.35);
      }
      if (Math.abs(camera.fov - (fov0 + punch)) > 0.05) { camera.fov = fov0 + punch; camera.updateProjectionMatrix(); }       // the lens lurches with each blow
      CN.pulse = clamp(sh * 0.9, 0, 1);
      camera.position.set(cx + tremor(T, 1) * sh * 0.05, Math.max(-2.6, cy + tremor(T, 2.7) * sh * 0.05), cz + tremor(T, 4.1) * sh * 0.04);
      camera.rotation.set(pitch + tremor(T, 5.5) * sh * 0.022, yaw + tremor(T, 7.3) * sh * 0.022, roll);
      if (T < HIT) tint('#1a0003', 1);                                                                 // the blow
      else if (red >= 0) { red = Math.max(red, 0.9 * (1 - seg(T, HIT, HIT + 0.2))); tint('radial-gradient(ellipse at center, rgba(120,0,8,' + red * 0.5 + ') 0%, rgba(160,0,10,' + Math.min(1, red * 1.2) + ') 100%)', 1); }
      $('fade').style.opacity = black;
      if (once('last', DUR - 0.16)) { crunch(1); Sound.thud(1); }
      return T >= DUR;
    }, end: function () { tint('none', 0); Hands.aim = null; flashlight.angle = 0.6; camera.fov = 72; camera.updateProjectionMatrix(); camera.rotation.z = 0; done(); $('fade').style.opacity = 0; } });
  };

  // ---------- the first time each of them notices you ----------
  S.update = function (dt, c) {
    if (!P || P.esc) return;
    var seen = P.seen = P.seen || {}, px = player.x, pz = player.z, i, d;
    // a raptor hits the paddock fence beside you
    if (!seen.raptor && px > -59.5 && px < -54.5 && pz > 57 && pz < 103 && !aiChasing) {
      for (i = 0; i < dinos.length; i++) {
        d = dinos[i]; if (!d.active || d.rex || d.state === 'stun' || !(d.x < -60.5 && d.x > -110 && d.z > 55 && d.z < 105) || dist(d.x, d.z, px, pz) > 48) continue;
        var fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), nz = clamp(pz + 0.4, 57, 103), d1 = dist(d.x, d.z, px, pz), d2 = dist(-61.3, nz, px, pz);
        if (((d.x - px) * fx + (d.z - pz) * fz) / d1 > 0.35 || ((-61.3 - px) * fx + (nz - pz) * fz) / d2 > 0.6) continue;      // only from where you are not looking
        seen.raptor = 1; d.x = -61.3; d.z = clamp(pz + 0.4, 57, 103); d.rot = PI / 2; d.state = 'search'; d.searchT = 6; d.sx = d.x - 3; d.sz = d.z; d.lastX = d.x; d.lastZ = d.z; d.blindT = 4; d.aware = 0; d.path = null;
        slam = { d: d, t: 0 }; shake = Math.max(shake, 1); Sound.roar(false, 1); Sound.clang(); Sound.rattle(); danger = 1;
        showMsg('It was waiting on the other side of the fence.', 3.5); break;
      }
    }
    if (slam) {
      var u = slam.d.mesh.userData, k = slam.t < 0.12 ? slam.t / 0.12 : 1 - seg(slam.t, 0.3, 1.1); slam.t += dt;
      slam.d.mesh.position.x = slam.d.x + k * 0.45; u.body.rotation.x = 0.3 * k; u.jaw.rotation.x = 0.25 + k * 0.8; u.head.rotation.x = -0.15 * k;
      if (slam.t > 1.1) slam = null;
    }
    // the rex hears you coming, a long way off
    if (!seen.rex && dist(px, pz, 88, -92) < 64 && rexDino.state !== 'chase') { seen.rex = 1; Sound.roar(true, 0.8); shake = Math.max(shake, 0.9); showMsg('Something very large has heard you.', 3.5); }
    // the plesiosaur comes up beside the first pier you stand on
    if (!seen.ples && plesMesh.visible && inRect(px, pz, POOL) && player.y > 0.25 && ples.state !== 'chase') {
      seen.ples = 1; ples.x = clamp(px + 2.2, POOL.x1 + 2.6, POOL.x2 - 2.6); ples.z = clamp(pz - 4.2, POOL.z1 + 2.6, POOL.z2 - 2.6); ples.rot = Math.atan2(px - ples.x, pz - ples.z); rise = 1.6;
      Sound.splash(); Sound.thud(0.6); shake = Math.max(shake, 0.7); showMsg('The water beside the pier bulges, and something long turns over in it.', 4);
    }
    if (rise > 0) { rise -= dt; var r = Math.sin(clamp(1 - rise / 1.6, 0, 1) * PI); plesMesh.position.y += r * 0.95; plesMesh.userData.neck.rotation.x = -0.25 * r; plesMesh.userData.jaw.rotation.x = 0.1 + r * 0.5; }
    // the pterosaur marks you as you come under the dome
    if (!seen.ptero && dist(px, pz, AV.x, AV.z) < AV.r - 1.5 && ptero.state === 'perch') { seen.ptero = 1; Sound.screech(); shake = Math.max(shake, 0.5); ptero.expo = Math.max(ptero.expo, 0.3); showMsg('High in the dome, something unfolds.', 3.5); }
  };
  S.reset = function () { slam = null; rise = 0; tint('none', 0); if (window.Hands) Hands.aim = null; rexDino.mesh.rotation.x = 0; };
  return S;
})();
