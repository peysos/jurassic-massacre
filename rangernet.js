/* Jurassic Massacre — Ranger Net: the save terminals.
   Every save point in the park is the same thing: a Ranger Net check-in kiosk on a wall (a dark steel housing edged in park
   green, a hood with a light strip, a screen behind scratched glass, a keypad), with a swipe head beside it — the same
   two-jawed head as the reader on the front gate.  Saving is logging your position: the staff card comes out, goes edge-first
   into the slot and is drawn down it, the screen reads it, a clean two-note beep, POSITION LOGGED.
   RangerNet.kiosk(parent, x, z, rotY, idx, o) builds one (local frame: origin on the wall face at floor level, +z out of the
   wall, +x to the right as you face it) and sets TERMS[idx].tx/tz to where you stand to use it.
   RangerNet.frame(t, esc, done) keeps the screens and lamps right (game.js, every frame).  RangerNet.swipe(idx, name) saves. */
'use strict';

var RangerNet = (function () {
  var R = { list: [] }, V3 = THREE.Vector3;
  /* ---------- materials: one set for every kiosk ----------
     Everything solid on a kiosk is drawn from one atlas (its regions below) with two materials, metal and matte, so all six
     kiosks cost a handful of draws; the lamps and light strips of each kiosk share one tiny status texture (status()). */
  var AS = 1024, REG = {
    shell: [0, 0, 256, 256], trim: [264, 0, 128, 128], hsg: [400, 0, 128, 128], stain: [536, 0, 128, 128], header: [0, 264, 512, 84], howTo: [0, 356, 256, 96],
    swipe: [672, 0, 64, 192], hsgDark: [744, 0, 32, 32, 1], bezel: [784, 0, 32, 32, 1], key: [824, 0, 32, 32, 1], grille: [864, 0, 32, 32, 1], tape: [904, 0, 32, 32, 1], keyLbl: [264, 136, 256, 64]
  };
  var atlas = canvasTex(AS, function (g) {
    function at(r, fn) { g.save(); g.translate(r[0], r[1]); g.beginPath(); g.rect(0, 0, r[2], r[3]); g.clip(); fn(r[2], r[3]); g.restore(); }
    at(REG.shell, function (W, Hh) { g.fillStyle = '#2a2f31'; g.fillRect(0, 0, W, Hh); for (var q = 0; q < 400; q++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.03 + Math.random() * 0.05) + ')'; var y = Math.random() * Hh; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } blotch(g, W, ['#4a4436', '#14161a'], 14, 6, 30, 0.4);
      var gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(120,114,96,.28)'); gr.addColorStop(0.35, 'rgba(120,114,96,.06)'); gr.addColorStop(1, 'rgba(110,104,88,.2)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);       // twelve years of dust
      for (q = 0; q < 1200; q++) { g.fillStyle = 'rgba(130,124,104,' + (0.05 + Math.random() * 0.12) + ')'; g.fillRect(Math.random() * W, Math.random() * Hh, 1 + Math.random() * 2, 1 + Math.random() * 2); } });
    at(REG.trim, function (W, Hh) { g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, W, Hh); chips(g, W, Hh, 18, '#1a1c18'); chips(g, W, Hh, 8, '#6a3c20'); grime(g, W, Hh, 0.8); });
    at(REG.hsg, function (W, Hh) { g.drawImage(metalTex.image, 0, 0, W, Hh); g.fillStyle = 'rgba(74,78,82,.72)'; g.fillRect(0, 0, W, Hh); });
    at(REG.stain, function (W, Hh) { g.drawImage(metalTex.image, 0, 0, W, Hh); g.fillStyle = 'rgba(141,146,149,.6)'; g.fillRect(0, 0, W, Hh); });
    at(REG.header, function (W, Hh) { g.fillStyle = '#254a30'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#e2b93b'; g.font = 'bold 34px ' + ZOO_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RANGER NET · EMPLOYEE CHECK-IN', W / 2, Hh / 2 + 2, W - 24); });
    at(REG.howTo, function (W, Hh) { g.fillStyle = '#101214'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#9aa0a4'; g.font = 'bold 22px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOG YOUR POSITION', W / 2, Hh * 0.3); g.fillStyle = '#e2b93b'; g.font = 'bold 20px Arial, sans-serif'; g.fillText('SWIPE STAFF BADGE  ▶', W / 2, Hh * 0.68); });
    at(REG.swipe, function (W, Hh) { g.fillStyle = '#2b2d2f'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#d9dcde'; g.font = 'bold 20px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SWIPE', W / 2, Hh * 0.35); g.fillText('▼', W / 2, Hh * 0.65); });
    [['hsgDark', '#202224'], ['bezel', '#0e1012'], ['key', '#24282a'], ['grille', '#16171a'], ['tape', '#c9b878']].forEach(function (f) { at(REG[f[0]], function (W, Hh) { g.fillStyle = f[1]; g.fillRect(0, 0, W, Hh); }); });
  }, 1, 1, true, AS);
  atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping; atlas.repeat.set(1, 1);
  var kMetal = std(0xffffff, 0.5, { metalness: 0.42, map: atlas }), kMatte = std(0xffffff, 0.66, { map: atlas });
  var METAL = { shell: 1, hsg: 1, stain: 1, hsgDark: 1, bezel: 1, key: 1 };
  function A(m, reg) {                                                // put a mesh on its region of the atlas
    var r = REG[reg], U = m.geometry.attributes.uv; if (m.geometry.userData.atlas) { m.material = METAL[reg] ? kMetal : kMatte; return m; }
    var inset = r[4] ? r[2] / 2 : 2, x0 = r[0] + inset, y0 = r[1] + inset, w = r[2] - inset * 2, h = r[3] - inset * 2;
    for (var q = 0; q < U.count; q++) U.setXY(q, (x0 + U.getX(q) * w) / AS, 1 - (y0 + (1 - U.getY(q)) * h) / AS);
    U.needsUpdate = true; m.geometry.userData.atlas = reg; m.material = METAL[reg] ? kMetal : kMatte; return m;
  }
  var keyGeo = new THREE.BoxGeometry(0.034, 0.028, 0.012);
  var crackM = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.32, map: canvasTex(256, function (g, S, HH) { g.clearRect(0, 0, S, HH); g.strokeStyle = 'rgba(220,235,235,.85)'; g.lineWidth = 1; var cx = S * 0.72, cy = HH * 0.3; for (var q = 0; q < 11; q++) { var a = q / 11 * 6.28 + Math.random() * 0.3, r2 = 30 + Math.random() * 120, x = cx, y = cy; g.beginPath(); g.moveTo(x, y); for (var k = 0; k < 5; k++) { x += Math.cos(a) * r2 / 5 + (Math.random() - 0.5) * 8; y += Math.sin(a) * r2 / 5 + (Math.random() - 0.5) * 8; g.lineTo(x, y); } g.stroke(); } }, 1, 1, true, 184) });
  /* the status texture: one texel each for the light strip, the screen's edge, the two lamps and the swipe head's lamp */
  function status() { var c = document.createElement('canvas'); c.width = 8; c.height = 1; var t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.encoding = THREE.sRGBEncoding; return { g: c.getContext('2d'), tex: t, col: [] }; }
  function onTexel(m, i) { var U = m.geometry.attributes.uv; for (var q = 0; q < U.count; q++) U.setXY(q, (i + 0.5) / 8, 0.5); U.needsUpdate = true; return m; }
  // the swipe head: the front gate's dimensions (jaw width, half the gap, depth, length)
  var SJ = 0.024, SG = 0.002, SD = 0.05, SL = 0.3, SX = 0.43, SY = 1.42;
  R.SLOT = { x: SX, y: SY, z: SD, len: SL };

  // ---------- the screen ----------
  var SW = 512, SH = 368;
  function draw(k, mode) {
    var g = k.g, n2 = ('0' + (k.idx + 1)).slice(-2), q;
    g.fillStyle = '#030504'; g.fillRect(0, 0, SW, SH);
    if (mode === 'off' || mode === 'lock') {
      g.fillStyle = mode === 'lock' ? '#d8301e' : '#5a1c14'; g.font = 'bold 34px Consolas, "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(mode === 'lock' ? 'LOCKDOWN' : 'NO LINK', SW / 2, SH * 0.42); g.font = '19px Consolas, monospace'; g.fillText(mode === 'lock' ? 'SHELTER NETWORK OFFLINE' : 'RANGER NET · STATION ' + n2, SW / 2, SH * 0.56);
    } else {
      var col = '#3fe07a', dim = '#1f7a42';
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.font = 'bold 34px Consolas, "Courier New", monospace'; g.fillText('RANGER NET', 26, 52);
      g.font = '17px Consolas, monospace'; g.fillStyle = dim; g.fillText('FAMILY ZOO · STAFF CHECK-IN', 26, 80); g.textAlign = 'right'; g.fillText('STN ' + n2, SW - 26, 52); g.textAlign = 'left';
      g.fillStyle = col; g.fillRect(26, 96, SW - 52, 2); g.font = '21px Consolas, monospace'; g.fillText(k.name.toUpperCase(), 26, 134);
      if (mode === 'idle' || mode === 'swipe') {
        g.fillText('SWIPE STAFF BADGE TO LOG', 26, 172); g.fillText('YOUR POSITION', 26, 198);
        g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(26, 222, SW - 52, 54); g.font = 'bold 25px Consolas, monospace'; g.textAlign = 'center';
        g.fillText(mode === 'swipe' ? '▶  SWIPE NOW  ▶' : '[ E ]  LOG POSITION', SW / 2, 258); g.textAlign = 'left';
        g.font = '15px Consolas, monospace'; g.fillStyle = dim; g.fillText('LAST CHECK-IN  08/23 21:14  A. MERCER', 26, 312); g.fillText('SHELTER DOORS: NARROW · 1.26 M', 26, 336);
      } else if (mode === 'read') {
        g.fillStyle = '#ffc23a'; g.font = 'bold 30px Consolas, monospace'; g.fillText('READING BADGE …', 26, 196);
        g.strokeStyle = '#ffc23a'; g.lineWidth = 2; g.strokeRect(26, 226, SW - 52, 26); g.fillRect(30, 230, (SW - 60) * 0.62, 18);
        g.font = '15px Consolas, monospace'; g.fillText('0417-K', 26, 290);
      } else if (mode === 'ok') {
        g.font = 'bold 36px Consolas, monospace'; g.fillText('POSITION LOGGED', 26, 194); g.font = '19px Consolas, monospace'; g.fillText('A. MERCER · NIGHT KEEPER · 0417-K', 26, 232);
        g.fillStyle = '#06140a'; g.fillRect(26, 254, SW - 52, 50); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(26, 254, SW - 52, 50); g.fillStyle = col; g.font = 'bold 24px Consolas, monospace'; g.textAlign = 'center'; g.fillText('✓  GAME SAVED', SW / 2, 288); g.textAlign = 'left';
      }
    }
    g.fillStyle = 'rgba(0,0,0,.32)'; for (q = 0; q < SH; q += 4) g.fillRect(0, q, SW, 2);                         // scan lines
    k.tex.needsUpdate = true; k.mode = mode;
  }

  // ---------- one kiosk ----------
  R.kiosk = function (parent, x, z, rotY, idx, o) {
    o = o || {}; var K = new THREE.Group(), i; K.position.set(x, 0, z); K.rotation.y = rotY || 0; K.userData.noCast = true; (parent || scene).add(K);      // (flat on a wall: it casts nothing worth a shadow pass)
    var st = status(), sm = basic(0xffffff, { map: st.tex, fog: false });
    A(box(0.74, 1.24, 0.1, kMetal, 0, 1.42, 0.05, K), 'shell');                                                       // back plate
    A(box(0.66, 1.02, 0.07, kMetal, 0, 1.4, 0.135, K), 'shell');                                                      // the body
    [-1, 1].forEach(function (s2) { A(box(0.035, 1.24, 0.13, kMatte, s2 * 0.37, 1.42, 0.065, K), 'trim'); });         // green edging
    A(box(0.78, 0.035, 0.14, kMatte, 0, 0.8, 0.07, K), 'trim');
    var hood = A(box(0.8, 0.04, 0.26, kMetal, 0, 2.06, 0.16, K), 'shell'); hood.rotation.x = 0.28;
    onTexel(box(0.62, 0.012, 0.02, sm, 0, 2.018, 0.27, K), 0);                                                         // the light strip under the hood
    A(box(0.5, 0.38, 0.02, kMetal, 0, 1.66, 0.176, K), 'bezel');
    var c = document.createElement('canvas'); c.width = SW; c.height = SH; var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    var scrM = basic(0xffffff, { map: tex, fog: false }), scr = mesh(new THREE.PlaneGeometry(0.46, 0.33), scrM, 0, 1.66, 0.1875, K); scr.userData.keep = true;
    if (o.crack) mesh(new THREE.PlaneGeometry(0.46, 0.33), crackM, 0, 1.66, 0.1895, K);
    [[0, 1.855, 0.5, 0.008], [0, 1.465, 0.5, 0.008]].forEach(function (b2) { onTexel(box(b2[2], b2[3], 0.006, sm, b2[0], b2[1], 0.188, K), 1); });
    [-0.252, 0.252].forEach(function (bx) { onTexel(box(0.008, 0.39, 0.006, sm, bx, 1.66, 0.188, K), 1); });
    A(mesh(new THREE.PlaneGeometry(0.6, 0.1), kMatte, 0, 1.93, 0.1705, K), 'header');
    A(mesh(new THREE.PlaneGeometry(0.24, 0.09), kMatte, -0.14, 1.22, 0.1705, K), 'howTo');                             // how to use it, by the keypad
    for (i = 0; i < 12; i++) A(mesh(keyGeo, kMetal, 0.08 + (i % 3) * 0.045, 1.28 - Math.floor(i / 3) * 0.04, 0.178, K), 'key');
    for (i = 0; i < 6; i++) A(box(0.11, 0.004, 0.004, kMatte, 0, 0.97 + i * 0.012, 0.172, K), 'grille');              // speaker grille
    [0, 1].forEach(function (n) { onTexel(mesh(new THREE.CircleGeometry(0.011, 12), sm, 0.23 - n * 0.035, 1.03, 0.1715, K), 2 + n); });
    A(box(0.07, 0.6, 0.05, kMetal, 0.3, 2.68, 0.04, K), 'shell'); A(cyl(0.016, 0.016, 1.2, kMetal, -0.3, 2.65, 0.03, K, 6), 'stain');      // conduit up to the ceiling
    if (o.tape) { var tp = A(mesh(new THREE.PlaneGeometry(0.2, 0.035), kMatte, 0.28, 1.53, 0.1902, K), 'tape'); tp.rotation.z = 0.5; }
    // the swipe head: a flange, two jaws with a 4 mm slot between them (flared at both ends), the read head in its floor
    A(box(SJ * 2 + SG * 2 + 0.012, SL + 0.012, 0.006, kMetal, SX, SY, 0.003, K), 'hsgDark');
    [-1, 1].forEach(function (sd) {
      A(box(SJ, SL, SD - 0.006, kMetal, SX + sd * (SG + SJ / 2), SY, 0.006 + (SD - 0.006) / 2, K), 'hsg');
      [1, -1].forEach(function (e) { var fl = A(box(SJ, 0.012, SD - 0.01, kMetal, SX + sd * (SG + SJ / 2 + 0.0015), SY + e * (SL / 2 + 0.004), 0.008 + (SD - 0.01) / 2, K), 'hsg'); fl.rotation.z = sd * e * 0.35; });
    });
    A(box(SG * 2, SL, 0.016, kMetal, SX, SY, 0.014, K), 'hsgDark'); A(box(SG * 2 - 0.0005, 0.03, 0.01, kMetal, SX, SY + 0.02, 0.026, K), 'stain');
    A(mesh(new THREE.PlaneGeometry(SJ - 0.002, 0.07), kMatte, SX - SG - SJ / 2, SY + 0.08, SD + 0.0005, K), 'swipe');
    onTexel(mesh(new THREE.CircleGeometry(0.006, 12), sm, SX + SG + SJ / 2, SY + SL / 2 - 0.03, SD + 0.0006, K), 4);   // the head's own lamp: green on a good read
    A(cyl(0.007, 0.007, 0.16, kMetal, SX - 0.012, SY - SL / 2 - 0.07, 0.02, K, 6), 'hsgDark');                        // its lead, down into the wall
    K.traverse(function (m) { if (m.isMesh) { m.userData.noCast = true; m.castShadow = false; } });
    // where it stands in the world, and where you stand to use it
    (parent || scene).updateMatrixWorld(true); K.updateMatrixWorld(true);
    var org = new V3().setFromMatrixPosition(K.matrixWorld), q = new THREE.Quaternion().setFromRotationMatrix(K.matrixWorld), yaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
    var k = { idx: idx, name: o.name || TERMS[idx].name, g: c.getContext('2d'), tex: tex, org: org, yaw: yaw, st: st, mode: '', hold: 0, busy: false };
    k.w = function (lx, ly, lz, out) { var cs = Math.cos(yaw), sn = Math.sin(yaw); return (out || new V3()).set(org.x + lx * cs + lz * sn, ly, org.z - lx * sn + lz * cs); };
    var st = k.w(SX + 0.2, 0, SD + 0.62); TERMS[idx].tx = st.x; TERMS[idx].tz = st.z; k.stand = st;
    R.list[idx] = k; draw(k, 'off'); (R.mats = R.mats || [kMetal, kMatte, crackM]).push(scrM, sm);
    return k;
  };

  // ---------- every frame ----------
  function setT(k, i, css) { var S2 = k.st; if (S2.col[i] === css) return; S2.col[i] = css; S2.g.fillStyle = css; S2.g.fillRect(i, 0, 1, 1); S2.tex.needsUpdate = true; }
  R.frame = function (t, esc, done) {
    for (var i = 0; i < R.list.length; i++) {
      var k = R.list[i]; if (!k) continue;
      var live = !esc && done(TERMS[i].need), want = esc ? 'lock' : !live ? 'off' : k.busy ? k.busyMode : k.hold > t ? 'ok' : 'idle';
      if (want !== k.mode) draw(k, want);
      setT(k, 0, live ? (Math.sin(t * 3 + i) > -0.9 ? '#35ff8a' : '#0a1a10') : esc ? (Math.sin(t * 9) > 0 ? '#ff3020' : '#1a0505') : '#0a1a10');
      setT(k, 1, live ? (k.mode === 'read' ? '#4a3608' : '#1f8a4a') : '#0a1a10');
      setT(k, 2, live ? '#1a0505' : (Math.sin(t * 2 + i) > 0.6 ? '#ff3020' : '#1a0505')); setT(k, 3, live ? '#35ff8a' : '#041a08');
      setT(k, 4, k.mode === 'ok' ? '#35ff8a' : k.mode === 'read' ? '#ffb020' : '#041a08');
    }
  };

  /* ---------- saving: the card swipe ----------
     You step up square to the swipe head (the same distance and height you stood from the front gate's reader in the intro, so
     the hand, the card and the slot meet exactly as they did there), the card comes up in the left hand, goes edge-first into
     the slot and is drawn down it; READING; a clean two-note beep and POSITION LOGGED; your eyes go up to the screen; the hand
     goes back down with the card. */
  var CARD_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3(0, 1, 0), new V3(0, 0, 1), new V3(1, 0, 0)));
  var SWIPE_ROT = [0.5, -0.3, 1.5], Y0 = 0.19, Y1 = -0.25, hv = new V3(), cardP = new V3(), lk = new V3(), tq = new THREE.Quaternion(), YQ = new THREE.Quaternion(), UP = new V3(0, 1, 0);
  R.beep = function () { Sound.tone(1318.5, 1318.5, 0.11, 0.13, 'sine'); Sound.tone(1318.5, 1318.5, 0.08, 0.04, 'triangle'); Sound.tone(1975.5, 1975.5, 0.26, 0.13, 'sine', 0.115); Sound.tone(1975.5, 1975.5, 0.12, 0.035, 'triangle', 0.115); Sound.tone(3951, 3951, 0.05, 0.012, 'sine', 0.115); };
  R.swipe = function (idx, name) {
    var k = R.list[idx]; if (!k) { saveGame(name); return; }
    var c0 = camera.position.clone(), yaw0 = player.cy, pitch0 = player.cp, eye = k.w(SX + 0.2, 1.66, SD + 0.62), d0 = Math.hypot(eye.x - c0.x, eye.z - c0.z), IN = clamp(0.4 + d0 * 0.42, 0.5, 1.3);
    var T2 = 0, ev = {}, use = null, stepPh = 0, lx = c0.x, lz = c0.z, n = k.w(0, 0, 1).sub(k.org).normalize(), END = IN + 2.55, cq = new THREE.Quaternion().copy(YQ.setFromAxisAngle(UP, k.yaw)).multiply(CARD_Q);
    var LOOKS = [[0, 'cur'], [IN * 0.85, SX - 0.15, 1.38, SD + 0.02], [IN + 0.55, SX - 0.15, 1.38, SD + 0.02], [IN + 0.95, SX - 0.06, 1.29, SD + 0.02], [IN + 1.35, SX - 0.12, 1.36, SD + 0.02], [IN + 1.75, -0.02, 1.62, 0.19], [END - 0.45, -0.02, 1.62, 0.19], [END, 'free']];
    function once(key, t) { if (T2 >= t && !ev[key]) { ev[key] = 1; return true; } return false; }
    function dirTo(p, cx, cy, cz) { return [Math.atan2(-(p.x - cx), -(p.z - cz)), Math.atan2(p.y - cy, Math.hypot(p.x - cx, p.z - cz))]; }
    closePanel(); Hands.release(); k.busy = true; k.busyMode = 'idle';
    startCine({ pulse: 0, update: function (dt) {
      T2 += dt;
      var a = easeIO(clamp(T2 / IN, 0, 1)), cx = lerp(c0.x, eye.x, a), cz = lerp(c0.z, eye.z, a), cy = lerp(c0.y, eye.y, a);
      var dd = Math.hypot(cx - lx, cz - lz); lx = cx; lz = cz; stepPh += dd / 0.7 * PI; var mv = clamp(dd / Math.max(dt, 1e-3) / 1.3, 0, 1);
      cy += -((1 + Math.cos(2 * stepPh)) / 2) * 0.022 * mv + Math.sin(T2 * 1.6) * 0.003;
      // where the head points: from where it was, along the keys, back to a level look at the end
      var ki = 0; while (ki < LOOKS.length - 2 && T2 >= LOOKS[ki + 1][0]) ki++;
      var A = LOOKS[ki], B = LOOKS[ki + 1], u = sstep((T2 - A[0]) / Math.max(1e-3, B[0] - A[0]));
      function dirOf(L) { if (L[1] === 'cur') return [yaw0, pitch0]; var dA = dirTo(k.w(LOOKS[LOOKS.length - 3][1], LOOKS[LOOKS.length - 3][2], LOOKS[LOOKS.length - 3][3], lk), cx, cy, cz); if (L[1] === 'free') return [dA[0], -0.08]; return dirTo(k.w(L[1], L[2], L[3], lk), cx, cy, cz); }
      var da = dirOf(A), db = dirOf(B), yaw = da[0] + angDiff(db[0], da[0]) * u, pit = lerp(da[1], db[1], u);
      camera.position.set(cx, cy, cz); camera.rotation.set(pit, yaw, 0); if (camera.fov !== prefs.fov) { camera.fov = prefs.fov; camera.updateProjectionMatrix(); } camera.updateMatrixWorld(true);
      // the card
      if (once('card', IN - 0.25)) Hands.card.visible = true;
      if (once('swipe', IN)) {
        var top = k.w(SX, SY + Y0, SD + 0.031);
        use = Hands.use('rnSwipe' + idx + ':' + playTime, { point: function () { return hv.copy(top); }, pose: 'pinch', tip: 'pinch', rot: SWIPE_ROT, dur: 1.75, reach: 0.42,
          move: function (t) { var u2 = clamp((t - 0.5) / 0.34, 0, 1); return cardP.set(0, -u2 * u2 * (3 - 2 * u2) * (Y0 - Y1), 0); }, onTouch: function () { Sound.noise(0.22, 4200, 0.12, 0.1); } });
        Hands.cardHold = function () { if (!use || use.leaving) return null; var p = Hands.tipWorld(lk); p.addScaledVector(n, -0.019); return { p: p, q: cq }; };
      }
      if (once('prompt', 0.12)) { k.busyMode = 'swipe'; Sound.tone(880, 880, 0.07, 0.07, 'square'); }
      if (once('read', IN + 0.82)) { k.busyMode = 'read'; Sound.noise(0.16, 5200, 0.14); Sound.tone(2400, 2400, 0.03, 0.03, 'square'); }
      if (once('ok', IN + 1.3)) { k.busyMode = 'ok'; k.hold = playTime + 4; saveGame(name); Sound.clunk(); }
      if (once('away', IN + 2.25)) { Hands.card.visible = false; Hands.cardHold = null; }
      R.frame(playTime + T2, P.esc, done);
      // the torch held back out of the way, and dimmed for close work
      Hands.aim = T2 < END - 0.3 ? [0.0, -0.035, 0.08, -0.12, 0.2, 0] : null; flashlight.intensity = player.light ? lerp(2.0, 0.6, seg(T2, 0, IN) * (1 - seg(T2, END - 0.5, END))) : 0; Hands.setLight(player.light);
      Hands.fill.intensity = player.light ? 0.42 : 0.14; Hands.update(dt, { speed: mv * 1.3, yaw: yaw, pitch: pit, phase: stepPh, grounded: true });
      return T2 >= END;
    }, end: function () {
      k.busy = false; Hands.card.visible = false; Hands.cardHold = null; Hands.aim = null;
      player.x = k.stand.x; player.z = k.stand.z; player.vx = player.vz = 0; player.yaw = player.cy = camera.rotation.y; player.pitch = player.cp = camera.rotation.x; setState('playing'); lockPointer();
    } });
  };
  function seg(t, a, b) { return sstep((t - a) / (b - a)); }
  return R;
})();
