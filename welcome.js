/* Jurassic Massacre — the Welcome Center, and the rest of what makes the plaza a park entrance.
   The WELCOME CENTER stands on the right as you come through the gate, south of the gift shop: Guest Services (the long
   desk, the model of the park, the row of waiting chairs), and off it First Aid, Lost Property and a staff store.  Nothing
   in it is needed to finish the game; it is somewhere to look, and four of the places a spare cell can turn up.
   (It is not the Visitor Center: that is the columned building in Sector 1 with the key piece behind its shutter.)
   Round it the plaza gets what a zoo's forecourt has: flagpoles and welcome totems inside the gate, a photo point with the
   park's fibreglass Triceratops, a café terrace, pushchair hire, queue lines up to the ticket booths.
   Built before buildWorldLate(), so all of it is batched, shadowed and solid like the rest of the plaza.  The inside of the
   building is one group that is only drawn from where it could be seen (Welcome.step). */
'use strict';

var Welcome = (function () {
  var Wc = {}, E = Entrance, EM = E.M, flat = E.flat, inst = E.inst, FONT = E.FONT, q;
  var X1 = 10.4, X2 = 24.9, Z1 = 137.2, Z2 = 148.7, H = 3.3, T = 0.3, PX = 19.0;            // outside faces; the wall between the hall and the three rooms
  var IX1 = X1 + T, IX2 = X2 - T, IZ1 = Z1 + T, IZ2 = Z2 - T, RX1 = PX + 0.2, DZ1 = 142.0, DZ2 = 143.6, DH = 2.15, DZ = (DZ1 + DZ2) / 2;
  var WIN = [[138.5, 140.9], [144.7, 147.1]];
  Wc.rect = { x1: X1, x2: X2, z1: Z1, z2: Z2 };
  /* The small things in flat colours (cups, coats, leaflets, chair frames: sixty-odd colours) all end up on three materials:
     a palette texture, with each mesh's UVs parked on the texel of its colour.  C() hands out a stand-in per colour while
     things are being built; palette() swaps them at the end.  (Three, not one: matt, glossy, and metal.) */
  var mats = {}, palTex = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.userData = { g: c.getContext('2d'), n: 0, at: {} }; return t; })();
  var palM = [std(0xffffff, 0.82, { map: palTex }), std(0xffffff, 0.3, { map: palTex }), std(0xffffff, 0.45, { map: palTex, metalness: 0.55 })];
  function C(hex, rough, metal) { var cls = metal ? 2 : (rough || 0.8) <= 0.35 ? 1 : 0, k = hex + '|' + cls, m = mats[k]; if (!m) { m = mats[k] = std(hex, rough || 0.8, metal ? { metalness: metal } : undefined); m.userData.pal = { hex: hex, cls: cls }; } return m; }
  function palette() {
    var U = palTex.userData, seen = new Set();
    scene.traverse(function (o) {
      var p = o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.material.userData.pal; if (!p) return;
      var k = U.at[p.hex]; if (k === undefined) { k = U.at[p.hex] = U.n++; U.g.fillStyle = '#' + ('000000' + p.hex.toString(16)).slice(-6); U.g.fillRect((k % 16) * 4, ((k / 16) | 0) * 4, 4, 4); }
      if (o.geometry === sphGeo || seen.has(o.geometry)) o.geometry = o.geometry.clone(); seen.add(o.geometry);
      var uv = o.geometry.attributes.uv, u = ((k % 16) * 4 + 2) / 64, v = 1 - (((k / 16) | 0) * 4 + 2) / 64; for (var q2 = 0; q2 < uv.count; q2++) uv.setXY(q2, u, v);
      o.material = palM[p.cls]; var inside = false; for (var a = o.parent; a; a = a.parent) if (a === inner) inside = true;
      if (!inside) o.userData.noCast = true;                 // out of doors these are cups and chair legs: nothing whose shadow is missed
    });
    palTex.needsUpdate = true;
  }
  function solid(x1, x2, z1, z2, sees) { boxes.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2), solid: !sees }); }
  function ring(x, z, r) { circles.push({ x: x, z: z, r: r }); }
  function grp(x, z, rot, y) { var g = new THREE.Group(); g.position.set(x, y || 0, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  function label(lines, w, h, bg, fg, x, y, z, rotY, pw, border) { var m = mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.75, { map: textTex(lines, pw || 256, Math.round((pw || 256) * h / w), bg, fg, border || null, false) }), x, y, z); m.rotation.y = rotY || 0; m.userData.noCast = true; return m; }
  var ZAX = new THREE.Vector3(0, 0, 1), seeV = new THREE.Vector3();

  /* Every sign and sheet of paper inside is a patch of one canvas, so all of them are one material (and one draw). */
  var AW = 2048, AH = 1024, atlas = (function () {
    var c = document.createElement('canvas'); c.width = AW; c.height = AH; var g = c.getContext('2d'), x = 4, y = 4, rowH = 0, tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    g.fillStyle = '#d6cfb4'; g.fillRect(0, 0, AW, AH);
    var mat = std(0xb0b0b0, 0.85, { map: tex });                       // (paper under a torch at arm's length: keep it from burning out)
    return { mat: mat, add: function (w, h, draw) { if (x + w + 4 > AW) { x = 4; y += rowH + 8; rowH = 0; } var r = { x: x, y: y, w: w, h: h }; g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); draw(g, w, h); g.restore(); x += w + 8; rowH = Math.max(rowH, h); tex.needsUpdate = true; return r; } };
  })();
  function sheet(r, pw, ph, x, y, z, rotY, parent) {                  // a patch of the atlas on a plane pw wide (ph follows the patch unless given)
    ph = ph || pw * r.h / r.w; var m = mesh(new THREE.PlaneGeometry(pw, ph), atlas.mat, x, y, z, parent); m.rotation.y = rotY || 0; var U = m.geometry.attributes.uv;
    for (var v = 0; v < U.count; v++) U.setXY(v, (r.x + U.getX(v) * r.w) / AW, 1 - (r.y + (1 - U.getY(v)) * r.h) / AH); m.userData.noCast = true; return m;
  }
  function sign(lines, bg, fg, border) { return function (g, w, h) { g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = Math.max(3, h * 0.06); g.strokeRect(4, 4, w - 8, h - 8); } g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; var lh = (h - 12) / (lines.length + 0.25); g.font = 'bold ' + lh * 0.8 + 'px Impact, "Arial Black", Arial, sans-serif'; for (var i = 0; i < lines.length; i++) g.fillText(lines[i], w / 2, 6 + lh * (i + 0.64), w - 26); grime(g, w, h, 0.7); }; }
  function paper(title, lines, bg, o) {
    o = o || {}; var ts = o.ts || 17, fs = o.fs || 12;
    return function (g, w, h) {
      g.fillStyle = bg || '#e9e2cc'; g.fillRect(0, 0, w, h); g.fillStyle = o.head || '#1a1a1a'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = 'bold ' + ts + 'px Arial'; g.fillText(title, 10, ts + 8, w - 20); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(10, ts + 14, w - 20, 1.5);
      var hand = (o.hand ? 'italic ' : '') + fs + 'px ' + (o.hand ? '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive' : 'Arial'), lh = o.lh || fs * 1.5;
      lines.forEach(function (l, n) { var red = l.charAt(0) === '!'; g.font = (red ? 'bold ' : '') + hand; g.fillStyle = red ? '#9a1c14' : (o.ink || '#26262e'); g.fillText(red ? l.slice(1) : l, 10, ts + 34 + n * lh, w - 18); });
      if (o.blood) { g.fillStyle = 'rgba(96,10,6,.82)'; [[0.72, 0.86, 26], [0.8, 0.93, 13], [0.6, 0.94, 8], [0.9, 0.8, 6]].forEach(function (b) { g.beginPath(); g.ellipse(w * b[0], h * b[1], b[2], b[2] * 0.7, 0.4, 0, 7); g.fill(); }); }
      blotch(g, w, ['#8a7a4a', '#5a4a2a'], 6, 8, 40, 0.16);
    };
  }

  // ---------- surfaces ----------
  var wallIn = std(0xffffff, 0.9, { map: canvasTex(512, function (g, S) {              // inside: cream over a green dado, 3.3 m high
    g.fillStyle = '#d6cfb4'; g.fillRect(0, 0, S, S); var dado = S * (1 - 1.05 / 3.3); g.fillStyle = '#3c6146'; g.fillRect(0, dado, S, S - dado); g.fillStyle = '#d9ae35'; g.fillRect(0, dado - 5, S, 5);
    g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#c2bb9e', '#e6e0c8', '#b0a98c'], 9000, 1.8)(g, S); g.globalAlpha = 1;
    streaks(g, S, S, 40, 'rgba(96,76,40,.7)', S * 0.7); chips(g, S, S, 30, '#8e8a78'); grime(g, S, S, 1.2);
    blotch(g, S, ['rgba(60,70,44,.5)', 'rgba(110,96,60,.4)'], 22, 16, 80, 0.4);
  }), bumpMap: bump(3), bumpScale: 0.012 });
  var floorIn = std(0xffffff, 0.5, { map: canvasTex(512, function (g, S) {             // sheet vinyl in the park's green and cream, 4 m to a repeat
    var n = 8, c = S / n, a, b; for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = (a + b) % 2 ? ['#5f8468', '#587c60', '#668a6e'][(a * 3 + b) % 3] : ['#d8d0b6', '#cfc7ac', '#ddd6be'][(a + b * 2) % 3]; g.fillRect(a * c, b * c, c, c); }
    g.strokeStyle = 'rgba(40,46,36,.6)'; g.lineWidth = 1.4; for (a = 0; a <= n; a++) { g.beginPath(); g.moveTo(a * c, 0); g.lineTo(a * c, S); g.moveTo(0, a * c); g.lineTo(S, a * c); g.stroke(); }
    g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#5c6452', '#eeeadc', '#3c4436'], 15000, 1.4)(g, S); g.globalAlpha = 1; blotch(g, S, ['#343a2c', '#5a5440', '#2a2e24'], 50, 14, 90, 0.36);
  }), bumpMap: bump(3), bumpScale: 0.008 });
  var ceilIn = std(0xffffff, 0.95, { map: canvasTex(256, function (g, S) { var n = 4, c = S / n, a, b; g.fillStyle = '#c9c6b6'; g.fillRect(0, 0, S, S); for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = ['#c2beac', '#d0ccbc', '#bab6a4'][(a * 2 + b) % 3]; g.fillRect(a * c + 2, b * c + 2, c - 4, c - 4); } blotch(g, S, ['rgba(120,100,50,.7)', 'rgba(90,80,44,.6)'], 12, 10, 60, 0.6); }) });
  var cream = EM.cream, green = EM.green, steel = EM.steel, white = std(0xb0ada0, 0.7, { bumpMap: bump(2), bumpScale: 0.01 }), woodM = M.wood, darkM = M.dark;
  var deskM = std(0xffffff, 0.6, { map: canvasTex(128, function (g, S) { g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S, S); g.fillStyle = '#d9ae35'; g.fillRect(0, S * 0.12, S, 5); chips(g, S, S, 14, '#1a1c18'); grime(g, S, S, 1); }), bumpMap: bump(2), bumpScale: 0.01 }), topM = std(0x8f8a78, 0.5, { bumpMap: bump(2), bumpScale: 0.006 });
  var vinyl = std(0x6a2a22, 0.55, { bumpMap: bump(3), bumpScale: 0.015 }), cardM = std(0x806e48, 0.9, { bumpMap: bump(2), bumpScale: 0.01 }), linen = std(0xb4b8b4, 0.85, { bumpMap: bump(4), bumpScale: 0.02 });
  function wall(x1, x2, z1, z2, y1, y2, mat) { return wbox(x1, x2, y1 === undefined ? 0 : y1, y2 === undefined ? H : y2, z1, z2, mat || cream, mat === wallIn ? 3.3 : 3); }
  /* A wall run along x or z with openings: each [a1, a2, sill, head].  Solid between them. */
  function run(axis, at1, at2, a1, a2, holes, mat, sees) {
    var a = a1; (holes || []).forEach(function (h) {
      if (h[0] > a) { if (axis === 'x') { wall(at1, at2, a, h[0], 0, H, mat); solid(at1, at2, a, h[0], sees); } else { wall(a, h[0], at1, at2, 0, H, mat); solid(a, h[0], at1, at2, sees); } }
      if (axis === 'x') { if (h[2] > 0) { wall(at1, at2, h[0], h[1], 0, h[2], mat); solid(at1, at2, h[0], h[1], true); } wall(at1, at2, h[0], h[1], h[3], H, mat); } else { if (h[2] > 0) { wall(h[0], h[1], at1, at2, 0, h[2], mat); solid(h[0], h[1], at1, at2, true); } wall(h[0], h[1], at1, at2, h[3], H, mat); }
      a = h[1];
    });
    if (a < a2) { if (axis === 'x') { wall(at1, at2, a, a2, 0, H, mat); solid(at1, at2, a, a2, sees); } else { wall(a, a2, at1, at2, 0, H, mat); solid(a, a2, at1, at2, sees); } }
  }
  var WEST = [[WIN[0][0], WIN[0][1], 0.95, 2.35], [DZ1, DZ2, 0, DH], [WIN[1][0], WIN[1][1], 0.95, 2.35]];

  // ================= the shell: what you see from the plaza =================
  (function () {
    run('x', X1, X1 + T, Z1, Z2, WEST); run('x', X2 - T, X2, Z1, Z2); run('z', Z1, Z1 + T, X1 + T, X2 - T); run('z', Z2 - T, Z2, X1 + T, X2 - T);
    box(X2 - X1 + 0.5, 0.22, Z2 - Z1 + 0.5, darkM, (X1 + X2) / 2, H + 0.11, (Z1 + Z2) / 2); [[(X1 + X2) / 2, Z1 - 0.05, X2 - X1 + 0.7, 0.2], [(X1 + X2) / 2, Z2 + 0.05, X2 - X1 + 0.7, 0.2], [X1 - 0.05, (Z1 + Z2) / 2, 0.2, Z2 - Z1 + 0.7], [X2 + 0.05, (Z1 + Z2) / 2, 0.2, Z2 - Z1 + 0.7]].forEach(function (f) { box(f[2], 0.55, f[3], green, f[0], H + 0.3, f[1]); });
    box(X2 - X1 + 0.1, 0.1, Z2 - Z1 + 0.1, M.roof, (X1 + X2) / 2, H + 0.6, (Z1 + Z2) / 2);
    wbox(X1 - 0.06, X1, 0, 0.5, Z1, DZ1 - 0.1, EM.stone, 1.5); wbox(X1 - 0.06, X1, 0, 0.5, DZ2 + 0.1, Z2, EM.stone, 1.5);                    // a stone plinth course along the front
    // windows: dark glass in green frames, a sill, a box of dead geraniums under each
    WIN.forEach(function (w) {
      var wz = (w[0] + w[1]) / 2; mesh(new THREE.PlaneGeometry(2.4, 1.4), M.window, X1 + 0.1, 1.65, wz).rotation.y = -PI / 2;
      [w[0] + 0.03, wz, w[1] - 0.03].forEach(function (z) { box(0.34, 1.46, 0.07, green, X1 + T / 2, 1.65, z); }); box(0.36, 0.07, 2.46, green, X1 + T / 2, 2.36, wz); box(0.4, 0.07, 2.5, EM.stone, X1 + T / 2 - 0.03, 0.93, wz);
      box(0.24, 0.2, 2.2, woodM, X1 - 0.16, 0.78, wz); for (var s = 0; s < 9; s++) { var st = box(0.012, 0.22 + (s % 3) * 0.06, 0.012, C(0x6a5a2c, 0.95), X1 - 0.16 + (s % 2 ? 0.05 : -0.04), 0.98, w[0] + 0.25 + s * 0.24); st.rotation.set((s % 3 - 1) * 0.3, 0, (s % 2 ? 0.25 : -0.2)); }
    });
    // the way in: a canopy on two posts, the name over it, one door standing open and the other gone
    [DZ1 - 1.0, DZ2 + 1.0].forEach(function (z) { cyl(0.07, 0.08, 2.7, green, X1 - 1.9, 1.35, z, null, 10); box(0.28, 0.1, 0.28, M.concrete, X1 - 1.9, 0.05, z); ring(X1 - 1.9, z, 0.18); });
    box(2.3, 0.12, 4.2, green, X1 - 1.0, 2.78, DZ).rotation.z = 0.05; box(0.1, 0.5, 4.2, cream, X1 - 2.1, 2.9, DZ);
    makeSign('WELCOME CENTER', X1 - 0.03, DZ, -PI / 2, 5.6, H + 1.25, '#f0cf6a', true);
    label(['GUEST SERVICES  ·  FIRST AID  ·  LOST PROPERTY'], 3.6, 0.3, '#254a30', '#ece3c4', X1 - 2.16, 2.9, DZ, -PI / 2, 640, '#d9ae35');
    [DZ1 - 0.05, DZ2 + 0.05].forEach(function (z) { box(T + 0.06, DH + 0.1, 0.1, green, X1 + T / 2, (DH + 0.1) / 2, z); }); box(T + 0.06, 0.1, DZ2 - DZ1 + 0.2, green, X1 + T / 2, DH + 0.05, DZ);
    var dl = grp(X1 - 0.02, DZ1 + 0.02, 0); dl.rotation.y = 1.25 - PI; box(0.045, DH - 0.03, 0.78, green, 0, DH / 2, 0.39, dl); box(0.05, 0.3, 0.03, steel, -0.04, 1.05, 0.68, dl); box(0.05, 0.3, 0.03, steel, 0.04, 1.05, 0.68, dl); box(0.05, 0.9, 0.56, C(0x1c2420, 0.3, 0.4), 0, 1.45, 0.39, dl);     // one of the pair, swung out against the wall; the other is gone
    solid(X1 - 0.78, X1, DZ1 - 0.28, DZ1 + 0.02, true); [0.25, 1.9].forEach(function (y) { box(0.04, 0.12, 0.05, steel, X1 - 0.02, y, DZ2 - 0.03); });                 // the hinges it hung on
    // by the door: opening hours, a lamp over it, the downpipe at the corner
    label(['OPEN DAILY', '9 – 5', 'LAST ENTRY 4'], 0.5, 0.6, '#254a30', '#ece3c4', X1 - 0.012, 1.6, DZ2 + 0.62, -PI / 2, 160, '#d9ae35');
    box(0.14, 0.12, 0.3, darkM, X1 - 0.08, 2.5, DZ); Wc.lampM = basic(0x1c1c1a, { fog: false }); var lp = box(0.1, 0.08, 0.24, Wc.lampM, X1 - 0.1, 2.42, DZ); lp.userData.keep = true; lp.userData.noCast = true;
    cyl(0.05, 0.05, H, C(0x2a3a30, 0.6, 0.3), X1 - 0.07, H / 2, Z1 + 0.25, null, 8); box(0.16, 0.12, 0.16, C(0x2a3a30, 0.6, 0.3), X1 - 0.07, H + 0.02, Z1 + 0.25);
  })();

  // ================= inside (gathered into one group at the end) =================
  var n0 = scene.children.length;
  (function () {
    // floor, ceiling, the inside faces of the outer walls, the glass from behind
    flat(X2 - X1 - 2 * T, Z2 - Z1 - 2 * T, E.rt(floorIn, (X2 - X1) / 4, (Z2 - Z1) / 4), (X1 + X2) / 2, 0.035, (Z1 + Z2) / 2);
    var cl = mesh(new THREE.PlaneGeometry(X2 - X1 - 2 * T, Z2 - Z1 - 2 * T), E.rt(ceilIn, (X2 - X1) / 2.4, (Z2 - Z1) / 2.4), (X1 + X2) / 2, H - 0.02, (Z1 + Z2) / 2); cl.rotation.x = PI / 2; cl.userData.noCast = true;
    function lin(axis, at, dir, a1, a2, holes) {            // an inside wall face, with openings
      var a = a1, parts = []; (holes || []).forEach(function (h) { if (h[0] > a) parts.push([a, h[0], 0, H]); if (h[2] > 0) parts.push([h[0], h[1], 0, h[2]]); parts.push([h[0], h[1], h[3], H]); a = h[1]; }); if (a < a2) parts.push([a, a2, 0, H]);
      parts.forEach(function (r) { var m = mesh(new THREE.PlaneGeometry(r[1] - r[0], r[3] - r[2]), wallIn, 0, (r[2] + r[3]) / 2, 0), c = (r[0] + r[1]) / 2; if (axis === 'x') { m.position.x = at; m.position.z = c; m.rotation.y = dir > 0 ? PI / 2 : -PI / 2; } else { m.position.z = at; m.position.x = c; m.rotation.y = dir > 0 ? 0 : PI; }
        var U = m.geometry.attributes.uv; for (var v = 0; v < U.count; v++) { var hx = U.getX(v), hy = U.getY(v); U.setXY(v, (r[0] + hx * (r[1] - r[0])) / 3.3, (r[2] + hy * (r[3] - r[2])) / 3.3); } m.userData.noCast = true; });
    }
    lin('x', IX1 + 0.012, 1, IZ1, IZ2, WEST); lin('x', IX2 - 0.012, -1, IZ1, IZ2); lin('z', IZ1 + 0.012, 1, IX1, IX2); lin('z', IZ2 - 0.012, -1, IX1, IX2);
    WIN.forEach(function (w, n) {
      var wz = (w[0] + w[1]) / 2, b; mesh(new THREE.PlaneGeometry(2.4, 1.4), M.window, IX1 - 0.1, 1.65, wz).rotation.y = PI / 2; box(0.1, 0.05, 2.5, white, IX1 + 0.04, 0.95, wz);
      if (n) for (b = 0; b < 4; b++) box(0.03, 0.22, 2.5, M.plank, IX1 + 0.03, 1.15 + b * 0.36, wz).rotation.x = (b % 2 ? 0.03 : -0.04);                   // the south one boarded from inside
      else { for (b = 0; b < 12; b++) box(0.012, 1.3, 0.16, C(0xb9b6a6, 0.7), IX1 + 0.05, 1.68, w[0] + 0.14 + b * 0.19).rotation.y = 0.5 + (b === 7 ? 0.5 : 0); box(0.05, 0.05, 2.4, white, IX1 + 0.05, 2.36, wz); }            // vertical blinds, one slat twisted
    });
    // the wall down the middle, with the three doors, and the two between the rooms
    var D = [[138.75, 140.05], [142.7, 144.0], [146.15, 147.45]]; Wc.doors = D;
    run('x', PX, RX1, IZ1, IZ2, D.map(function (d) { return [d[0], d[1], 0, 2.05]; }), wallIn);
    [[141.4, 141.6], [145.0, 145.2]].forEach(function (w) { wall(RX1, IX2, w[0], w[1], 0, H, wallIn); solid(RX1, IX2, w[0], w[1]); });
    var doorSign = [sign(['FIRST AID'], '#e9e6da', '#1f7a3a', '#1f7a3a'), sign(['LOST PROPERTY'], '#254a30', '#ece3c4', '#d9ae35'), sign(['STAFF ONLY'], '#254a30', '#ece3c4', '#d9ae35')];
    D.forEach(function (d, n) {
      var L = d[1] - d[0], open = [-1.75, -1.75, -1.7][n];
      [d[0] - 0.03, d[1] + 0.03].forEach(function (z) { box(0.26, 2.08, 0.06, green, PX + 0.1, 1.04, z); }); box(0.26, 0.06, L + 0.12, green, PX + 0.1, 2.08, (d[0] + d[1]) / 2);
      var dg = grp(RX1, d[1], open); box(0.04, 2.02, L - 0.03, green, 0.02, 1.01, -L / 2, dg); cyl(0.012, 0.012, 0.12, steel, 0.02, 1.02, -L + 0.1, dg, 6).rotation.z = PI / 2; box(0.005, 0.3, L - 0.2, steel, 0.042, 0.2, -L / 2, dg);
      sheet(atlas.add(256, 60, doorSign[n]), 0.8, 0.19, PX - 0.012, 2.32, (d[0] + d[1]) / 2, -PI / 2);
    });
    solid(RX1, RX1 + 1.3, 140.05, 140.3, true); solid(RX1, RX1 + 1.3, 144.0, 144.25, true); solid(RX1, RX1 + 1.3, 147.45, 147.64, true);            // the open door leaves
    // light fittings: tubes in the hall (one down on its wire), a bulkhead in each room
    Wc.tubes = [];
    [[14.6, 140.4, 0], [14.6, 145.6, 1], [17.4, 143.0, 0]].forEach(function (t) { var tg = grp(t[0], t[1], 0, H - 0.06 - t[2] * 0.42); tg.rotation.z = t[2] * 0.5; box(1.35, 0.07, 0.22, white, 0, 0, 0, tg); var tm = basic(0x1c1c1a, { fog: false }), tb = box(1.25, 0.035, 0.05, tm, 0, -0.05, 0, tg); tb.userData.keep = true; tb.userData.noCast = true; Wc.tubes.push(tm); if (t[2]) cyl(0.004, 0.004, 0.5, darkM, -0.5, 0.26, 0, tg, 4); });
    Wc.bulbs = [];
    [[22, 139.4], [22, 143.3], [22, 146.8]].forEach(function (b) { cyl(0.14, 0.14, 0.05, white, b[0], H - 0.045, b[1], null, 12); var bm = basic(0x1c1c1a, { fog: false }), bb = cyl(0.11, 0.11, 0.05, bm, b[0], H - 0.09, b[1], null, 12); bb.userData.keep = true; bb.userData.noCast = true; Wc.bulbs.push(bm); });
  })();

  // ----- Guest Services -----
  (function () {
    // the desk: a long counter facing the door, a return at the north end
    wbox(15.2, 15.9, 0, 1.02, 139.8, 145.8, deskM, 2, null, true); wbox(15.1, 16.05, 1.02, 1.07, 139.7, 145.9, topM, 2); wbox(15.9, 17.3, 0, 1.02, 139.8, 140.4, deskM, 2, null, true); wbox(15.9, 17.4, 1.02, 1.07, 139.7, 140.5, topM, 2);
    sheet(atlas.add(512, 72, sign(['GUEST SERVICES'], '#254a30', '#ece3c4', '#d9ae35')), 2.6, 0.36, 15.19, 0.62, 142.8, -PI / 2);
    // on it: the terminal, a telephone, the bell, the visitors' book, leaflets, "back in five minutes"
    var beige = C(0x8a8474, 0.7), pc = grp(15.62, 144.7, -PI / 2 - 0.25, 1.07); box(0.36, 0.3, 0.34, beige, 0, 0.21, 0, pc); box(0.3, 0.06, 0.26, beige, 0, 0.03, 0, pc); box(0.29, 0.22, 0.01, C(0x0c1410, 0.2), 0, 0.22, 0.171, pc); box(0.42, 0.025, 0.15, beige, 0.02, 0.014, 0.36, pc).rotation.y = 0.12;
    var ph = grp(15.55, 143.75, -PI / 2 + 0.2, 1.07); box(0.2, 0.06, 0.22, C(0x2a2622, 0.5), 0, 0.03, 0, ph); box(0.05, 0.04, 0.2, C(0x2a2622, 0.5), -0.06, 0.08, 0, ph); cyl(0.004, 0.004, 0.24, C(0x2a2622, 0.5), -0.12, 0.03, 0.1, ph, 4).rotation.x = PI / 2;
    cyl(0.045, 0.05, 0.03, M.gold, 15.42, 1.085, 143.2, null, 12); mesh(new THREE.SphereGeometry(0.035, 10, 6, 0, PI * 2, 0, PI / 2), M.gold, 15.42, 1.1, 143.2);
    var bk = grp(15.5, 142.35, -PI / 2 + 0.15, 1.07); box(0.3, 0.03, 0.42, C(0x4a1814, 0.8), 0, 0.015, 0, bk); var bp = sheet(atlas.add(170, 240, paper('VISITORS’ BOOK', ['“Best day ever!!” — Katie, 7', '“The big fish looked RIGHT', '  at me.” — Sam', '“Lovely tea shop.” — Mrs. P.', '“My son will not stop', '  roaring.” — D. Okafor', '“The raptors watched us', '  the whole time.', '  All of them.” — J.', '', '“is anybody here”', '“IS ANYBODY HERE”'], '#ece6d2', { hand: true, fs: 11, ts: 13 })), 0.27, 0.38, 0, 0.032, 0, 0, bk); bp.rotation.x = -PI / 2;
    for (q = 0; q < 3; q++) { box(0.2, 0.2, 0.1, C(0x8a8f8c, 0.5), 15.55, 1.17, 140.9 + q * 0.3); box(0.17, 0.2, 0.012, C([0xd8e6ee, 0xf0e2a8, 0x9fc48a][q], 0.8), 15.55, 1.25, 140.9 + q * 0.3).rotation.z = 0.12; }
    var tent = grp(15.42, 145.3, 0, 1.07), tr = atlas.add(160, 100, sign(['BACK IN', '5 MINUTES'], '#ece6d2', '#8d1f18', '#8d1f18')); [1, -1].forEach(function (s) { var tp = new THREE.Group(); tp.rotation.z = s * 0.35; tp.position.x = s * -0.05; tent.add(tp); sheet(tr, 0.24, 0.15, 0, 0.07, 0, s > 0 ? -PI / 2 : PI / 2, tp); });
    // behind it: the park on the wall, pigeonholes with a few letters left in them, a clock that stopped
    var c = document.createElement('canvas'); c.width = c.height = 512; drawParkMap(c.getContext('2d'), 512, null, { x: 17, z: 143 }, undefined, true); var mt = new THREE.CanvasTexture(c); mt.encoding = THREE.sRGBEncoding; mt.anisotropy = 8;
    var mapM = std(0xffffff, 0.6, { map: mt }), mp = mesh(new THREE.PlaneGeometry(2.1, 2.1), mapM, PX - 0.03, 1.72, 141.42); mp.rotation.y = -PI / 2; mp.userData.noCast = true; box(0.02, 2.24, 2.24, green, PX - 0.011, 1.72, 141.42);
    for (q = 0; q < 4; q++) box(0.22, 0.02, 1.3, woodM, PX - 0.12, 1.1 + q * 0.3, 144.98); for (q = 0; q < 5; q++) box(0.22, 0.92, 0.02, woodM, PX - 0.12, 1.55, 144.34 + q * 0.32);
    [[0, 0], [2, 1], [3, 2], [1, 2]].forEach(function (s, n) { box(0.16, 0.012, 0.22, C([0xe6e0c8, 0xd8e6ee][n % 2], 0.9), PX - 0.13, 1.12 + s[1] * 0.3, 144.5 + s[0] * 0.32).rotation.y = n * 0.4; });
    cyl(0.17, 0.17, 0.04, white, PX - 0.03, 2.72, 144.98, null, 20).rotation.z = PI / 2; box(0.012, 0.012, 0.12, darkM, PX - 0.055, 2.75, 144.98).rotation.x = 0.9; box(0.012, 0.012, 0.09, darkM, PX - 0.055, 2.72, 144.94).rotation.x = -0.4;
    cyl(0.2, 0.2, 0.05, M.rubber, 17.4, 0.62, 143.0, null, 12); cyl(0.025, 0.025, 0.6, steel, 17.4, 0.3, 143.0, null, 6); cyl(0.2, 0.2, 0.03, steel, 17.4, 0.015, 143.0, null, 10); ring(17.4, 143.0, 0.24);      // the stool
    // the park in miniature under a perspex box
    var tx = 12.6, tz = 139.3; wbox(tx - 1.1, tx + 1.1, 0, 0.78, tz - 0.8, tz + 0.8, deskM, 2, null, true); wbox(tx - 1.14, tx + 1.14, 0.78, 0.82, tz - 0.84, tz + 0.84, topM, 2);
    var mm = mesh(new THREE.PlaneGeometry(2.1, 1.5), mapM, tx, 0.826, tz); mm.rotation.x = -PI / 2; mm.userData.noCast = true;
    [[0.5, 0.36, 0.2, 0.1, 0.34], [-0.45, 0.38, 0.14, 0.06, 0.12], [0.4, -0.3, 0.26, 0.05, 0.26], [-0.5, -0.25, 0.2, 0.05, 0.2], [0.02, 0.55, 0.16, 0.03, 0.1]].forEach(function (b) { box(b[2], b[3], b[4], C(0x8a4a3a, 0.8), tx + b[0], 0.83 + b[3] / 2, tz + b[1]); });
    for (q = 0; q < 14; q++) mesh(new THREE.ConeGeometry(0.03, 0.09, 6), C(0x3a6a3a, 0.9), tx - 0.95 + (q * 0.37) % 1.9, 0.875, tz - 0.62 + (q * 0.53) % 1.24);                                                 // its trees
    var pg = box(2.14, 0.34, 1.54, EM.glassDirty, tx, 1.0, tz); pg.userData.noCast = true; sheet(atlas.add(384, 40, sign(['FAMILY ZOO  ·  SCALE 1 : 150'], '#254a30', '#ece3c4')), 1.4, 0.14, tx, 0.5, tz + 0.806, 0);
    // waiting chairs along the south wall (a row of four, one over), the corner for lost children
    function chair(x, z, rot, down) { var g = grp(x, z, rot); if (down) { g.rotation.z = 1.5; g.position.y = 0.26; } box(0.46, 0.06, 0.44, vinyl, 0, 0.44, 0, g); box(0.46, 0.4, 0.05, vinyl, 0, 0.72, -0.22, g); [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(function (l) { cyl(0.014, 0.014, 0.44, steel, l[0], 0.22, l[1], g, 5); }); }
    Wc.chair = chair;
    for (q = 0; q < 4; q++) chair(11.5 + q * 0.56, IZ2 - 0.36, PI); box(2.3, 0.03, 0.04, steel, 12.34, 0.2, IZ2 - 0.36); solid(11.2, 13.5, IZ2 - 0.62, IZ2, true); chair(14.4, 146.9, 2.2, true); ring(14.4, 146.9, 0.4);
    sheet(atlas.add(256, 170, sign(['LOST CHILDREN', 'WAIT HERE', 'A KEEPER WILL COME'], '#e2b93b', '#17140e', '#17140e')), 0.9, 0.6, IX1 + 0.025, 1.9, 147.75, PI / 2);
    box(0.3, 0.05, 0.7, vinyl, IX1 + 0.2, 0.3, 147.75); box(0.3, 0.3, 0.05, steel, IX1 + 0.2, 0.15, 147.45); box(0.3, 0.3, 0.05, steel, IX1 + 0.2, 0.15, 148.05); solid(IX1, IX1 + 0.36, 147.38, 148.12, true);
    var fur = C(0x8a6a3a, 1), bear = grp(IX1 + 0.2, 147.75, 1.4, 0.33); mesh(sphGeo, fur, 0, 0.12, 0, bear).scale.set(0.22, 0.24, 0.2); mesh(sphGeo, fur, 0, 0.3, 0.01, bear).scale.set(0.17, 0.17, 0.16); [-0.07, 0.07].forEach(function (x) { mesh(sphGeo, fur, x, 0.38, 0, bear).scale.setScalar(0.07); mesh(sphGeo, fur, x * 1.7, 0.1, 0.06, bear).scale.set(0.07, 0.07, 0.14); });
    // the notice board over the chairs
    var nb = atlas.add(440, 280, function (g, w, h) {
      g.fillStyle = '#9a7a4a'; g.fillRect(0, 0, w, h); speckle('rgba(0,0,0,0)', ['#8a6a3c', '#aa8a58', '#7a5c34'], 2600, 2)(g, w); g.strokeStyle = '#3a2a1a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
      function pin(x, y, pw, ph, bg, rot, draw) { g.save(); g.translate(x + pw / 2, y + ph / 2); g.rotate(rot); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph); g.fillStyle = bg; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; draw(pw, ph); g.fillStyle = '#a8231c'; g.beginPath(); g.arc(0, -ph / 2 + 7, 4, 0, 7); g.fill(); g.restore(); }
      pin(16, 18, 150, 190, '#efe9d6', -0.03, function () { g.fillStyle = '#8d1f18'; g.font = 'bold 26px Impact, Arial'; g.fillText('MISSING', 0, -62); g.fillStyle = '#3a3a3a'; g.fillRect(-42, -52, 84, 78); g.fillStyle = '#6a6a66'; g.beginPath(); g.arc(0, -22, 17, 0, 7); g.fill(); g.fillRect(-24, -2, 48, 28); g.fillStyle = '#1a1a1a'; g.font = 'bold 12px Arial'; g.fillText('DANNY, AGE 9', 0, 42); g.font = '10px Arial'; g.fillText('Red coat. Last seen at the', 0, 57); g.fillText('raptor paddock, 3.40 pm.', 0, 70); g.fillText('Ask at this desk.', 0, 83); });
      pin(182, 14, 120, 96, '#f3e58a', 0.04, function () { g.fillStyle = '#1a1a1a'; g.font = 'bold 14px Arial'; g.fillText('FEEDING TIMES', 0, -26); g.font = '11px Arial'; g.fillText('Raptors 11.00', 0, -8); g.fillText('Ocean Hall 12.00', 0, 7); g.fillText('T. rex 1.00', 0, 22); g.fillText('(not for the squeamish)', 0, 37); });
      pin(316, 20, 108, 130, '#dfe9f0', -0.05, function () { g.fillStyle = '#1d4a7a'; g.font = 'bold 14px Arial'; g.fillText('DOTTIE DAY', 0, -42); g.fillStyle = '#5c9a52'; g.beginPath(); g.ellipse(-6, -8, 26, 13, 0, 0, 7); g.fill(); g.fillRect(12, -34, 7, 26); g.fillRect(-22, 0, 6, 14); g.fillRect(2, 0, 6, 14); g.fillStyle = '#1a1a1a'; g.font = '10px Arial'; g.fillText('Sat 17th. Face paint,', 0, 32); g.fillText('cake, half price kids', 0, 45); });
      pin(186, 124, 118, 136, '#e9e2d0', 0.02, function () { g.fillStyle = '#1a1a1a'; g.font = 'bold 12px Arial'; g.fillText('TO ALL DESK STAFF', 0, -50); g.font = '10px Arial'; ['If the siren sounds do NOT', 'send guests to the gate.', 'Safe rooms only. Count', 'them in. Lock the door.', 'Do not open it for', 'anyone who is not', 'speaking.', '            — M. Voss'].forEach(function (l, n) { g.fillText(l, 0, -32 + n * 12); }); });
      pin(318, 164, 104, 96, '#f0c9c0', 0.07, function () { g.fillStyle = '#8d1f18'; g.font = 'bold 13px Arial'; g.fillText('PARK CLOSED', 0, -24); g.fillStyle = '#1a1a1a'; g.font = '10px Arial'; g.fillText('until further notice', 0, -8); g.fillText('by order of the', 0, 6); g.fillText('County Sheriff', 0, 20); });
      pin(24, 216, 140, 50, '#efe9d6', 0.03, function () { g.fillStyle = '#1a1a1a'; g.font = '11px Arial'; g.fillText('Found: one hearing aid.', 0, -2); g.fillText('See Lost Property.', 0, 12); });
    });
    sheet(nb, 1.7, 1.08, 12.35, 1.85, IZ2 - 0.03, PI); box(1.78, 1.16, 0.03, woodM, 12.35, 1.85, IZ2 - 0.012);
    // how tall you have to be, by the door; the park's two posters on the north wall
    sheet(atlas.add(120, 420, function (g, w, h) {
      g.fillStyle = '#254a30'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9ae35'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#ece3c4'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'bold 13px Arial'; g.fillText('HOW TALL', w / 2, 24); g.fillText('ARE YOU?', w / 2, 40);
      for (var n = 0; n <= 14; n++) { var y = h - 14 - n * 25; g.fillRect(8, y, n % 2 ? 16 : 30, 2); if (n % 2 === 0) { g.font = '11px Arial'; g.textAlign = 'left'; g.fillText((0.6 + n * 0.1).toFixed(1) + ' m', 42, y + 4); } }
      g.textAlign = 'center'; g.font = 'bold 10px Arial'; g.fillStyle = '#e2b93b'; g.fillText('a raptor: 1.7 m', w / 2 + 12, h - 14 - 11 * 25 - 6); g.fillText('you must be 1.2 m', w / 2 + 10, h - 14 - 6 * 25 - 14); g.fillText('for the Jeep Safari', w / 2 + 10, h - 14 - 6 * 25 - 3); grime(g, w, h, 0.8);
    }), 0.46, 1.6, IX1 + 0.025, 1.4, 141.55, PI / 2);
    if (Extras.posters) [[16.4, Extras.posters.sea], [18.0, Extras.posters.ples]].forEach(function (p) { box(1.16, 1.46, 0.03, green, p[0], 1.85, IZ1 + 0.02); var pm = mesh(new THREE.PlaneGeometry(1.08, 1.36), std(0xffffff, 0.55, { map: p[1] }), p[0], 1.85, IZ1 + 0.04); pm.userData.noCast = true; });
    // leaflet stand by the door, a rope line to the desk (one rope unhooked)
    var rk = grp(IX1 + 0.2, 144.2, PI / 2); box(0.9, 1.4, 0.05, green, 0, 0.9, 0, rk); for (q = 0; q < 9; q++) if (q !== 4) box(0.2, 0.28, 0.012, C([0xd8e6ee, 0xf0e2a8, 0x9fc48a][q % 3], 0.8), -0.3 + (q % 3) * 0.3, 1.36 - Math.floor(q / 3) * 0.4, 0.045, rk).rotation.x = -0.16; solid(IX1, IX1 + 0.28, 143.72, 144.68, true);
    var posts = [[12.4, 141.9], [14.2, 141.9], [12.4, 143.7], [14.2, 143.7]], rope = C(0x7a1f1a, 0.8);
    posts.forEach(function (p) { cyl(0.03, 0.03, 0.95, M.gold, p[0], 0.475, p[1], null, 8); cyl(0.14, 0.16, 0.04, M.gold, p[0], 0.02, p[1], null, 12); mesh(new THREE.SphereGeometry(0.045, 8, 6), M.gold, p[0], 0.97, p[1]); ring(p[0], p[1], 0.14); });
    tube([[12.4, 0.9, 141.9, 0.016, 0.016], [12.9, 0.78, 141.9, 0.016, 0.016], [13.3, 0.74, 141.9, 0.016, 0.016], [13.7, 0.78, 141.9, 0.016, 0.016], [14.2, 0.9, 141.9, 0.016, 0.016]], rope, null, 6, 3, ZAX);
    tube([[12.4, 0.9, 143.7, 0.016, 0.016], [12.5, 0.5, 143.72, 0.016, 0.016], [12.8, 0.07, 143.8, 0.016, 0.016], [13.4, 0.055, 144.0, 0.016, 0.016], [13.9, 0.055, 144.35, 0.016, 0.016]], rope, null, 6, 3, ZAX);
    // a water cooler, a pay telephone with the receiver hanging, a donation box, two plants that died of thirst
    box(0.32, 1.0, 0.32, white, 11.0, 0.5, 137.82); cyl(0.13, 0.13, 0.36, C(0x86a8b8, 0.25), 11.0, 1.18, 137.82, null, 12); cyl(0.05, 0.13, 0.08, C(0x86a8b8, 0.25), 11.0, 1.4, 137.82, null, 12); box(0.06, 0.04, 0.05, C(0x2c5fa8, 0.5), 11.0, 0.82, 138.0); ring(11.0, 137.82, 0.26);
    var pp = grp(14.9, IZ1 + 0.1, 0, 1.45); box(0.34, 0.56, 0.18, C(0x2a3a44, 0.5, 0.4), 0, 0, 0, pp); box(0.24, 0.18, 0.02, C(0x8a8f8c, 0.4, 0.6), 0, -0.08, 0.1, pp); box(0.4, 0.05, 0.3, C(0x2a3a44, 0.5, 0.4), 0, 0.32, 0.05, pp); cyl(0.005, 0.005, 0.72, darkM, -0.2, -0.5, 0.06, pp, 4); box(0.05, 0.2, 0.05, darkM, -0.2, -0.95, 0.06, pp);
    sheet(atlas.add(120, 44, sign(['TELEPHONE'], '#2a3a44', '#ece3c4')), 0.34, 0.12, 14.9, 1.94, IZ1 + 0.03, 0);
    var db = grp(17.7, 138.05, 0.2); box(0.22, 0.95, 0.22, woodM, 0, 0.475, 0, db); box(0.3, 0.3, 0.3, EM.glassDirty, 0, 1.1, 0, db).userData.noCast = true; for (q = 0; q < 7; q++) cyl(0.014, 0.014, 0.004, M.gold, -0.08 + (q % 3) * 0.07, 0.957 + (q % 2) * 0.004, -0.06 + (q % 4) * 0.045, db, 8); ring(17.7, 138.05, 0.22);
    sheet(atlas.add(200, 70, sign(['HELP US', 'FEED THEM'], '#ece6d2', '#254a30', '#254a30')), 0.26, 0.09, 0, 0.8, 0.112, 0, db);
    [[18.45, 147.95, 0.0], [14.75, 137.9, 2.0]].forEach(function (p) { cyl(0.2, 0.15, 0.36, C(0x8a4a2e, 0.9), p[0], 0.18, p[1], null, 12); for (var s = 0; s < 7; s++) { var st = cyl(0.006, 0.01, 0.5 + (s % 3) * 0.2, C(0x5a4a26, 0.95), p[0] + Math.cos(s * 0.9 + p[2]) * 0.05, 0.6, p[1] + Math.sin(s * 0.9 + p[2]) * 0.05, null, 4); st.rotation.set(Math.sin(s * 2.1) * 0.5, 0, Math.cos(s * 1.7) * 0.5); } ring(p[0], p[1], 0.22); });
    // a wheelchair nobody came back for
    var wc = grp(17.3, 147.2, -2.2), nav = C(0x1c2a3a, 0.6); box(0.44, 0.04, 0.42, nav, 0, 0.5, 0, wc); box(0.44, 0.42, 0.03, nav, 0, 0.78, -0.21, wc); [-1, 1].forEach(function (s) { var wh = mesh(new THREE.TorusGeometry(0.29, 0.018, 6, 22), M.rubber, s * 0.27, 0.31, -0.1, wc); wh.rotation.y = PI / 2; cyl(0.03, 0.03, 0.04, steel, s * 0.27, 0.31, -0.1, wc, 8).rotation.z = PI / 2; for (var k = 0; k < 4; k++) box(0.006, 0.56, 0.006, steel, s * 0.27, 0.31, -0.1, wc).rotation.x = k * PI / 4; cyl(0.065, 0.065, 0.03, M.rubber, s * 0.2, 0.065, 0.32, wc, 10).rotation.z = PI / 2; box(0.02, 0.5, 0.02, steel, s * 0.23, 0.26, 0.2, wc); box(0.02, 0.02, 0.5, steel, s * 0.23, 0.5, 0.0, wc); box(0.02, 0.52, 0.02, steel, s * 0.23, 0.76, -0.22, wc); box(0.02, 0.02, 0.12, M.rubber, s * 0.23, 1.02, -0.27, wc); box(0.12, 0.015, 0.16, steel, s * 0.13, 0.13, 0.42, wc); }); ring(17.3, 147.2, 0.42);
    // what was dropped on the way out
    [[13.6, 145.2, 0.5], [16.9, 145.6, 2.1], [11.6, 141.0, 4.2], [17.9, 139.0, 1.0], [12.9, 146.2, 3.3], [14.6, 143.1, 0.2]].forEach(function (p, n) { var lf = mesh(new THREE.PlaneGeometry(0.21, 0.3), C([0xd8e6ee, 0xf0e2a8, 0x9fc48a][n % 3], 0.9), p[0], 0.042, p[1]); lf.rotation.set(-PI / 2, 0, p[2]); lf.userData.noCast = true; });
    box(0.09, 0.06, 0.2, C(0x8a2a22, 0.8), 13.1, 0.07, 144.9).rotation.y = 0.7;                       // one small red shoe
  })();

  // ----- First Aid, Lost Property, the staff store -----
  (function () {
    var v;
    // First Aid: a couch somebody bled on, a cabinet left open, a sink, a stretcher against the wall, the day book
    wbox(22.3, 24.3, 0.52, 0.64, 137.75, 138.5, vinyl, 1); box(1.5, 0.006, 0.6, linen, 23.0, 0.645, 138.12); box(0.4, 0.1, 0.5, linen, 24.02, 0.71, 138.12); [[22.38, 137.82], [24.22, 137.82], [22.38, 138.43], [24.22, 138.43]].forEach(function (l) { box(0.04, 0.52, 0.04, steel, l[0], 0.26, l[1]); }); box(1.86, 0.03, 0.03, steel, 23.3, 0.2, 138.43); box(1.86, 0.03, 0.03, steel, 23.3, 0.2, 137.82);
    var bl = mesh(new THREE.CircleGeometry(0.42, 14), M.blood, 23.05, 0.652, 138.12); bl.rotation.x = -PI / 2; bl.scale.set(1.5, 0.66, 1); bl.userData.noCast = true;
    solid(22.3, 24.35, IZ1, 138.52, true);
    wbox(IX2 - 0.4, IX2, 1.1, 2.0, 139.3, 140.4, white, 1); var cd = grp(IX2 - 0.4, 139.3, 0, 1.55); cd.rotation.y = -2.0; box(0.02, 0.86, 0.52, white, 0, 0, 0.26, cd); for (q = 0; q < 3; q++) box(0.34, 0.02, 1.0, steel, IX2 - 0.2, 1.3 + q * 0.26, 139.85);
    for (q = 0; q < 8; q++) cyl(0.03, 0.03, 0.09, C([0xd8d2c2, 0x8a3a2a, 0x2c5fa8][q % 3], 0.5), IX2 - 0.24 + (q % 2) * 0.1, 1.355 + (q % 3) * 0.26, 139.5 + q * 0.11, null, 8);
    sheet(atlas.add(64, 64, function (g, w, h) { g.fillStyle = '#e9e6da'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f7a3a'; g.fillRect(w * 0.4, h * 0.14, w * 0.2, h * 0.72); g.fillRect(w * 0.14, h * 0.4, w * 0.72, h * 0.2); }), 0.4, 0.4, IX2 - 0.025, 2.4, 139.85, -PI / 2);
    solid(IX2 - 0.42, IX2, 139.3, 140.4, true);
    wbox(RX1 + 0.05, RX1 + 0.65, 0.78, 0.86, 140.5, 141.3, white, 1); box(0.5, 0.78, 0.7, white, RX1 + 0.35, 0.39, 140.9); box(0.34, 0.02, 0.4, C(0x8a8f8c, 0.3, 0.6), RX1 + 0.38, 0.868, 140.9); cyl(0.012, 0.012, 0.2, steel, RX1 + 0.14, 0.96, 140.9, null, 6); box(0.14, 0.012, 0.012, steel, RX1 + 0.2, 1.06, 140.9); solid(RX1, RX1 + 0.68, 140.45, 141.4, true);
    var st = box(0.05, 1.9, 0.55, C(0xc8501e, 0.8), RX1 + 0.1, 0.98, 138.2); st.rotation.z = -0.08; [137.95, 138.45].forEach(function (z) { cyl(0.016, 0.016, 2.1, steel, RX1 + 0.08, 1.02, z, null, 6).rotation.z = -0.08; });
    cyl(0.11, 0.11, 0.7, C(0x2f5a7a, 0.5, 0.3), 24.25, 0.35, 140.95, null, 12); cyl(0.03, 0.04, 0.1, steel, 24.25, 0.75, 140.95, null, 8); ring(24.25, 140.95, 0.16);
    box(0.02, 0.02, 2.4, steel, 22.1, 2.3, 138.7); var cu = mesh(new THREE.PlaneGeometry(1.2, 1.9, 8, 1), std(0x9fc0b0, 0.9, { side: THREE.DoubleSide }), 22.1, 1.35, 138.2); cu.rotation.y = PI / 2; var CP = cu.geometry.attributes.position; for (q = 0; q < CP.count; q++) CP.setZ(q, Math.sin(CP.getX(q) * 16) * 0.06); cu.geometry.computeVertexNormals(); cu.userData.noCast = true;
    // the dressing trolley, shoved aside; a chair; the resuscitation chart; the box where the defibrillator was
    var tr = grp(21.3, 140.25, 0.5); [0.3, 0.84].forEach(function (y) { box(0.62, 0.02, 0.42, steel, 0, y, 0, tr); }); [[-0.29, -0.19], [0.29, -0.19], [-0.29, 0.19], [0.29, 0.19]].forEach(function (l) { cyl(0.012, 0.012, 0.84, steel, l[0], 0.44, l[1], tr, 5); cyl(0.03, 0.03, 0.02, M.rubber, l[0], 0.03, l[1], tr, 8).rotation.z = PI / 2; });
    cyl(0.1, 0.08, 0.035, C(0x8a8f8c, 0.3, 0.7), -0.12, 0.87, 0.02, tr, 12); for (q = 0; q < 3; q++) cyl(0.03, 0.03, 0.06, linen, 0.1 + q * 0.07, 0.88, -0.08 + (q % 2) * 0.09, tr, 8).rotation.x = q ? PI / 2 : 0; cyl(0.03, 0.03, 0.12, C(0x6a4a2a, 0.3), 0.2, 0.91, 0.12, tr, 8); box(0.2, 0.012, 0.14, linen, -0.05, 0.316, 0, tr); ring(21.3, 140.25, 0.36);
    Wc.chair(20.2, 137.95, 0); ring(20.2, 137.95, 0.3);
    sheet(atlas.add(240, 320, function (g, w, h) {
      g.fillStyle = '#e6eadf'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f7a3a'; g.fillRect(0, 0, w, 40); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'bold 19px Arial'; g.fillText('RESUSCITATION', w / 2, 27);
      ['1  DANGER — is it safe?', '2  RESPONSE — shout, shake', '3  AIRWAY — tilt the head', '4  BREATHING — look, listen', '5  30 COMPRESSIONS', '6  2 BREATHS', '7  DO NOT STOP'].forEach(function (l, n) { g.fillStyle = n === 6 ? '#8d1f18' : '#1a1a1a'; g.textAlign = 'left'; g.font = 'bold 13px Arial'; g.fillText(l, 14, 70 + n * 30); g.strokeStyle = '#1f7a3a'; g.lineWidth = 2; g.beginPath(); g.arc(w - 30, 64 + n * 30, 9, 0, 7); g.stroke(); });
      g.fillStyle = '#555'; g.font = '10px Arial'; g.fillText('Nearest telephone: Guest Services desk', 14, h - 16); blotch(g, w, ['#8a7a4a', '#5a4a2a'], 6, 8, 40, 0.16);
    }), 0.66, 0.88, 22.9, 1.75, 141.4 - 0.014, PI);
    var aed = grp(20.3, 141.4 - 0.09, PI, 1.5); box(0.42, 0.5, 0.16, white, 0, 0, 0, aed); box(0.36, 0.44, 0.02, C(0x1c2420, 0.4), 0, 0, 0.075, aed); var ad = new THREE.Group(); ad.position.set(0.21, 0, 0.08); ad.rotation.y = 1.9; aed.add(ad); box(0.42, 0.5, 0.015, white, -0.21, 0, 0, ad);
    sheet(atlas.add(120, 44, sign(['DEFIBRILLATOR'], '#1f7a3a', '#fff')), 0.42, 0.13, 20.3, 1.86, 141.4 - 0.014, PI);
    sheet(atlas.add(250, 350, paper('FIRST AID — DAY BOOK', ['09.40  Girl, 6. Wasp sting. Vinegar, sticker.', '11.15  T. Hale (keeper). Hand in the raptor', '       feed hatch again. Four stitches.', '13.05  Lady fainted in the Ocean Hall.', '       Said it looked at her. Tea, sat down.', '14.30  Boy, 9, red coat. Lost, not hurt.', '       Sent to the desk to wait for mum.', '!15.52  SIREN.  Not a drill.', '16.10  M. Voss. Forearm, to the bone.', '       Would not sit. Took the dressings', '       and all the morphine and went.', '16.25  They are in the plaza. I can hear', '       the bins going over.', '16.31  Something is trying the door', '!       handle'], '#ece6d2', { hand: true, fs: 11.5, ts: 15, lh: 19, blood: true })), 0.46, 0.64, 21.0, 1.6, IZ1 + 0.03, 0);
    box(0.5, 0.68, 0.02, C(0x6a4a2a, 0.8), 21.0, 1.6, IZ1 + 0.018); box(0.12, 0.04, 0.03, steel, 21.0, 1.93, IZ1 + 0.035);
    [[21.9, 139.2, 0.2], [22.4, 139.0, 1.4], [21.5, 138.7, 2.2]].forEach(function (p, n) { var gz = mesh(sphGeo, n === 1 ? C(0x7a1a14, 0.9) : linen, p[0], 0.06, p[1]); gz.scale.set(0.14, 0.05, 0.1); gz.rotation.y = p[2]; });
    // Lost Property: shelves of what was left behind, a desk and its ledger, coats nobody came back for
    for (q = 0; q < 4; q++) box(IX2 - RX1 - 0.3, 0.03, 0.4, woodM, (RX1 + IX2) / 2 + 0.1, 0.45 + q * 0.5, 141.82); [RX1 + 0.3, 22.0, IX2 - 0.05].forEach(function (x) { box(0.04, 2.1, 0.4, woodM, x, 1.05, 141.82); }); solid(RX1 + 0.25, IX2, 141.6, 142.05, true);
    var junk = [0x8a3a2a, 0x2c5fa8, 0xd8b23a, 0x3a6a4a, 0xb9b29c, 0x6a4a8a];
    for (q = 0; q < 28; q++) { var jx = RX1 + 0.62 + (q % 9) * 0.55 + (q % 2) * 0.06, jy = 0.47 + (q % 4) * 0.5, k = (q * 7) % 6, jc = C(junk[q % 6], 0.9), jo;
      if (k === 0) jo = box(0.3, 0.2, 0.26, cardM, jx, jy + 0.1, 141.82); else if (k === 1) { jo = mesh(sphGeo, jc, jx, jy + 0.09, 141.82); jo.scale.set(0.2, 0.18, 0.2); } else if (k === 2) jo = cyl(0.11, 0.13, 0.05, jc, jx, jy + 0.03, 141.82, null, 10); else if (k === 3) { jo = cyl(0.02, 0.03, 0.42, jc, jx, jy + 0.03, 141.82, null, 6); jo.rotation.z = PI / 2; } else if (k === 4) { jo = box(0.2, 0.08, 0.28, jc, jx, jy + 0.04, 141.82); jo.rotation.y = 0.4; } else { jo = box(0.09, 0.07, 0.24, jc, jx, jy + 0.035, 141.82); jo.rotation.y = -0.3; } }
    var dino = grp(23.9, 141.82, -0.4, 1.97), dgm = C(0x4f8a4a, 1); mesh(sphGeo, dgm, 0, 0.1, 0, dino).scale.set(0.3, 0.2, 0.18); mesh(sphGeo, dgm, 0.17, 0.2, 0, dino).scale.set(0.13, 0.12, 0.11); cyl(0.02, 0.05, 0.22, dgm, -0.2, 0.08, 0, dino, 6).rotation.z = 1.3; [-0.06, 0.08].forEach(function (x) { cyl(0.03, 0.03, 0.1, dgm, x, 0.02, 0.05, dino, 6); });
    wbox(20.6, 22.2, 0.74, 0.79, 144.3, 145.0, woodM, 1); [[20.68, 144.38], [22.12, 144.38], [20.68, 144.92], [22.12, 144.92]].forEach(function (l) { box(0.05, 0.74, 0.05, woodM, l[0], 0.37, l[1]); }); box(1.5, 0.4, 0.02, woodM, 21.4, 0.5, 144.36); solid(20.6, 22.2, 144.3, 145.0, true);
    var lg = sheet(atlas.add(190, 250, paper('LOST PROPERTY LEDGER', ['Umbrella, black  ×4', 'Child’s shoe, red, left', 'Hearing aid', 'Thermos, blue (Tilly’s?)', 'Wedding ring — SAFE', 'Glasses, bent', 'Teddy, one ear', 'Camera, film still in', 'Pushchair, empty', '', 'Not collected.', 'None of it was collected.'], '#ece6d2', { hand: true, fs: 11, ts: 13 })), 0.3, 0.4, 21.05, 0.796, 144.62, 0); lg.rotation.set(-PI / 2, 0, PI + 0.15);
    cyl(0.06, 0.08, 0.03, darkM, 21.95, 0.805, 144.82, null, 10); cyl(0.01, 0.01, 0.3, darkM, 21.95, 0.96, 144.82, null, 5); mesh(new THREE.ConeGeometry(0.1, 0.13, 10, 1, true), std(0x2f5a3a, 0.6, { side: THREE.DoubleSide }), 21.95, 1.14, 144.82);
    var rs = grp(20.85, 144.78, 0.3, 0.79), rsm = C(0x6a2620, 0.9); box(0.26, 0.26, 0.14, rsm, 0, 0.13, 0, rs); var rt2 = cyl(0.07, 0.07, 0.26, rsm, 0, 0.26, 0, rs, 10); rt2.rotation.z = PI / 2; box(0.18, 0.12, 0.04, C(0x4a1a16, 0.9), 0, 0.1, 0.085, rs); [-0.08, 0.08].forEach(function (x) { box(0.03, 0.28, 0.012, C(0x2a2622, 0.9), x, 0.14, -0.076, rs); });
    Wc.chair(21.4, 144.02, PI + 0.25); ring(21.4, 144.05, 0.2);
    cyl(0.16, 0.14, 0.5, darkM, 24.25, 0.25, 144.65, null, 12); for (q = 0; q < 4; q++) cyl(0.012, 0.012, 0.8, C(junk[q], 0.8), 24.25 + (q - 1.5) * 0.05, 0.6, 144.65 + (q % 2) * 0.06, null, 5).rotation.z = (q - 1.5) * 0.12; ring(24.25, 144.65, 0.22);
    cyl(0.012, 0.012, 1.9, steel, IX2 - 0.22, 1.72, 143.25, null, 6).rotation.x = PI / 2; [142.35, 144.15].forEach(function (z) { box(0.22, 0.02, 0.02, steel, IX2 - 0.11, 1.72, z); });
    [[142.55, 0x8a2a22, 0.95], [142.9, 0x2a3a5a, 1.1], [143.3, 0xc8b030, 0.8], [143.65, 0x4a4a44, 1.15], [143.95, 0x6a4a8a, 0.6]].forEach(function (c, n) { var ct = box(0.42, c[2], 0.09, C(c[1], 0.95), IX2 - 0.24, 1.66 - c[2] / 2, c[0]); ct.rotation.y = (n % 2 ? 0.12 : -0.1); box(0.3, 0.03, 0.02, steel, IX2 - 0.24, 1.69, c[0]); });
    [[22.95, 144.66, 0.1, 0], [23.0, 144.68, -0.12, 0.34], [23.5, 144.7, 0.3, 0]].forEach(function (b) { var bx = box(0.46, 0.34, 0.4, cardM, b[0], 0.205 + b[3], b[1]); bx.rotation.y = b[2]; box(0.47, 0.02, 0.06, C(0xb9a06a, 0.7), b[0], 0.378 + b[3], b[1]).rotation.y = b[2]; }); solid(22.68, 23.76, 144.42, 145.0, true);
    sheet(atlas.add(256, 88, sign(['LOST PROPERTY', 'HELD FOR 28 DAYS'], '#254a30', '#ece3c4', '#d9ae35')), 1.0, 0.34, IX2 - 0.025, 2.4, 143.25, -PI / 2);
    // the store: lockers (one open), shelves of paper goods, a tea counter, the fuse board, a mop in its bucket
    for (q = 0; q < 4; q++) { wbox(IX2 - 0.5, IX2, 0, 1.85, 145.4 + q * 0.5, 145.88 + q * 0.5, green, 2); if (q !== 1) box(0.02, 0.1, 0.03, steel, IX2 - 0.515, 1.0, 145.8 + q * 0.5); for (v = 0; v < 3; v++) box(0.012, 0.012, 0.3, darkM, IX2 - 0.505, 1.6 + v * 0.05, 145.64 + q * 0.5); } solid(IX2 - 0.52, IX2, 145.35, 147.42, true);
    var ld = grp(IX2 - 0.5, 145.9, 0); ld.rotation.y = -1.1; box(0.02, 1.8, 0.46, green, 0, 0.92, 0.23, ld); box(0.44, 1.7, 0.02, C(0x101412, 0.9), IX2 - 0.49, 0.9, 146.14).rotation.y = PI / 2; box(0.3, 0.7, 0.06, C(0xd8a020, 0.9), IX2 - 0.44, 1.2, 146.14).rotation.y = PI / 2;
    for (q = 0; q < 4; q++) box(2.2, 0.03, 0.4, steel, 21.0, 0.4 + q * 0.45, IZ2 - 0.24); [19.9, 22.1].forEach(function (x) { box(0.04, 1.9, 0.4, steel, x, 0.95, IZ2 - 0.24); }); solid(19.85, 22.15, IZ2 - 0.46, IZ2, true);
    for (q = 0; q < 12; q++) cyl(0.06, 0.06, 0.11, linen, 20.1 + (q % 6) * 0.14, 0.47 + Math.floor(q / 6) * 0.45, IZ2 - 0.26, null, 10); [[21.4, 1.42], [21.8, 1.42], [21.6, 1.66], [21.3, 0.97], [20.3, 1.87]].forEach(function (b) { box(0.34, 0.24, 0.3, cardM, b[0], b[1] + 0.03, IZ2 - 0.24); });
    wbox(22.5, 24.05, 0.86, 0.9, IZ2 - 0.55, IZ2, topM, 1); wbox(22.55, 24.0, 0, 0.86, IZ2 - 0.5, IZ2, white, 1, null, true); cyl(0.07, 0.085, 0.2, C(0x8a8f8c, 0.3, 0.8), 23.6, 1.0, IZ2 - 0.28, null, 12); box(0.02, 0.1, 0.1, darkM, 23.7, 1.02, IZ2 - 0.28); [[22.8, 0.1], [22.98, 0.22], [23.2, 0.12]].forEach(function (m2, n) { cyl(0.04, 0.035, 0.09, C([0xd8d2c2, 0x2c5fa8, 0x8a2a22][n], 0.5), m2[0], 0.945, IZ2 - 0.45 + m2[1], null, 10); }); box(0.26, 0.15, 0.1, C(0x2a2622, 0.6), 23.2, 0.975, IZ2 - 0.12);
    var fb = grp(23.5, 145.2 + 0.07, 0, 1.55); box(0.56, 0.74, 0.12, C(0x7a8086, 0.5, 0.5), 0, 0, 0, fb); box(0.5, 0.68, 0.01, C(0x5a6066, 0.5, 0.5), 0, 0, 0.062, fb); for (q = 0; q < 8; q++) box(0.04, 0.07, 0.02, q === 3 ? C(0x8a2a22, 0.5) : darkM, -0.175 + (q % 4) * 0.115, 0.14 - Math.floor(q / 4) * 0.26, 0.07, fb); cyl(0.02, 0.02, 1.4, C(0x7a8086, 0.5, 0.5), 0, 1.05, 0, fb, 6);
    sheet(atlas.add(200, 250, paper('DESK ROTA — OCTOBER', ['Mon   Tilly / Joan', 'Tue   Tilly / Priya', 'Wed   Joan / Priya', 'Thu   Tilly / Joan', 'Fri   ALL (inspection)', 'Sat   DOTTIE DAY — all hands', '', 'First aider on call:', '  Joan (ext. 204)', 'Keys to the day safe:', '  ask Mr. Voss'], '#efe9d6', { fs: 12, ts: 14 })), 0.44, 0.55, 21.9, 1.6, 145.2 + 0.014, 0);
    cyl(0.16, 0.13, 0.3, C(0xc8b030, 0.7), 20.0, 0.15, 145.75, null, 12); var mop = cyl(0.014, 0.014, 1.5, woodM, 20.13, 0.8, 145.52, null, 5); mop.rotation.set(-0.26, 0, 0.08); ring(20.0, 145.75, 0.2);
    var wf = grp(21.2, 145.75, 0.3), yel = C(0xd8b020, 0.6); [1, -1].forEach(function (s) { var p = new THREE.Group(); p.rotation.x = s * 0.24; p.position.z = s * -0.075; wf.add(p); box(0.3, 0.62, 0.015, yel, 0, 0.3, 0, p); }); var wl = new THREE.Group(); wl.rotation.x = -0.24; wl.position.z = 0.075; wf.add(wl); sheet(atlas.add(100, 130, sign(['CAUTION', 'WET', 'FLOOR'], '#d8b020', '#17140e')), 0.24, 0.31, 0, 0.33, 0.009, 0, wl); ring(21.2, 145.75, 0.22);
    [0, 0.13, 0.26].forEach(function (y, n) { var g = grp(22.7, 145.72, 0.1 * n, y); box(0.46, 0.06, 0.44, vinyl, 0, 0.44, 0, g); box(0.46, 0.4, 0.05, vinyl, 0, 0.72, -0.22 - n * 0.01, g); if (!n) [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(function (l) { cyl(0.014, 0.014, 0.44, steel, l[0], 0.22, l[1], g, 5); }); }); ring(22.7, 145.72, 0.34);
    var ct = box(0.5, 0.3, 0.36, cardM, 22.3, 0.185, 147.1); ct.rotation.y = 0.4; for (q = 0; q < 5; q++) { var sp = mesh(new THREE.PlaneGeometry(0.21, 0.3), C([0xd8e6ee, 0xf0e2a8, 0x9fc48a][q % 3], 0.9), 21.75 - q * 0.16, 0.042 + q * 0.001, 146.95 + (q % 2) * 0.22); sp.rotation.set(-PI / 2, 0, q * 0.9); sp.userData.noCast = true; } ring(22.3, 147.1, 0.3);
  })();

  /* The trail: somebody came in through the front door bleeding, went round the end of the desk and into First Aid.  One
     decal for the lot (x 10.7..24.7, z 137.5..144.5). */
  (function () {
    var tex = canvasTex(1024, function (g, S, HH) {
      g.clearRect(0, 0, S, HH); var k = S / 14, pts = [[10.75, 142.8], [12.4, 142.75], [13.9, 142.4], [14.55, 141.2], [14.6, 139.9], [15.2, 139.25], [16.8, 139.05], [18.3, 139.3], [19.6, 139.45], [20.8, 139.2], [21.9, 138.8], [22.6, 138.62]], sd = 7;
      function r() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
      for (var n = 0; n < pts.length - 1; n++) { var a = pts[n], b = pts[n + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.ceil(len / 0.13);
        for (var j = 0; j < m; j++) { var f = (j + r() * 0.8) / m, x = (a[0] + (b[0] - a[0]) * f - 10.7 + (r() - 0.5) * 0.3) * k, y = (a[1] + (b[1] - a[1]) * f - 137.5 + (r() - 0.5) * 0.3) * k, rad = (0.02 + r() * r() * 0.085) * k;
          g.fillStyle = 'rgba(' + (84 + r() * 34 | 0) + ',' + (8 + r() * 8 | 0) + ',6,' + (0.7 + r() * 0.3) + ')'; g.beginPath(); g.ellipse(x, y, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, 7); g.fill(); if (r() < 0.3) { g.beginPath(); g.ellipse(x + (r() - 0.5) * 16, y + (r() - 0.5) * 16, rad * 0.35, rad * 0.3, 0, 0, 7); g.fill(); } } }
      [[14.58, 140.5, 0.34, 0.12, 1.5], [19.1, 139.42, 0.3, 0.1, 0.1], [22.3, 138.75, 0.4, 0.2, -0.3]].forEach(function (s) { g.fillStyle = 'rgba(92,10,6,.6)'; g.beginPath(); g.ellipse((s[0] - 10.7) * k, (s[1] - 137.5) * k, s[2] * k, s[3] * k, s[4], 0, 7); g.fill(); });      // where a foot dragged through it
    }, 1, 1, true, 512);
    var tm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.6 }), tr = mesh(new THREE.PlaneGeometry(14, 7), tm, 17.7, 0.04, 141.0); tr.rotation.x = -PI / 2; tr.userData.noCast = true; tr.renderOrder = 1;
  })();

  // everything since the shell goes into one group that is drawn only when it could be seen; the lights stay in the scene
  var inner = new THREE.Group(); inner.userData.keep = true; inner.userData.batchInside = true; Wc.inner = inner;
  while (scene.children.length > n0) inner.add(scene.children[n0]);
  scene.add(inner);
  Wc.light = dyn(new THREE.PointLight(0xfff0d2, 0, 15, 1.5)); Wc.light.position.set(14.6, 2.6, 142.8); scene.add(Wc.light);
  Wc.light2 = dyn(new THREE.PointLight(0xdfeeff, 0, 8, 1.6)); Wc.light2.position.set(22, 2.6, 139.4); scene.add(Wc.light2);

  // ================= the plaza =================
  (function () {
    // ----- inside the gate: a welcome totem either side of the walk, and three flagpoles -----
    var totTex = canvasTex(256, function (g, S, HH) {
      g.fillStyle = '#254a30'; g.fillRect(0, 0, S, HH); g.fillStyle = '#d9ae35'; g.fillRect(0, 0, S, 26); g.fillRect(0, HH - 26, S, 26); g.strokeStyle = '#d9ae35'; g.lineWidth = 5; g.strokeRect(14, 40, S - 28, HH - 80);
      g.fillStyle = '#ece3c4'; g.textAlign = 'center'; g.font = 'bold 52px ' + FONT; 'WELCOME'.split('').forEach(function (ch, n) { g.fillText(ch, S / 2, 122 + n * 64); });
      var cx = S / 2 - 6, cy = 640; g.fillStyle = '#6aa85e';                                                                                         // Dottie, as on the banners
      g.beginPath(); g.ellipse(cx, cy, 58, 28, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(cx + 34, cy - 16); g.quadraticCurveTo(cx + 70, cy - 40, cx + 66, cy - 104); g.quadraticCurveTo(cx + 64, cy - 126, cx + 84, cy - 126); g.quadraticCurveTo(cx + 102, cy - 122, cx + 96, cy - 110); g.lineTo(cx + 82, cy - 106); g.quadraticCurveTo(cx + 90, cy - 30, cx + 50, cy + 16); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(cx - 50, cy - 12); g.quadraticCurveTo(cx - 92, cy - 14, cx - 106, cy + 26); g.quadraticCurveTo(cx - 84, cy + 8, cx - 50, cy + 14); g.closePath(); g.fill();
      g.fillRect(cx - 40, cy + 14, 17, 36); g.fillRect(cx + 14, cy + 14, 17, 36); g.fillStyle = '#254a30'; g.beginPath(); g.arc(cx + 86, cy - 117, 2.6, 0, 7); g.fill();
      g.fillStyle = '#ece3c4'; g.font = 'bold 30px ' + FONT; g.fillText('FAMILY', S / 2, 744); g.fillText('ZOO', S / 2, 780); g.font = 'bold 20px ' + FONT; g.fillStyle = '#e2b93b'; g.fillText('EST. 1987', S / 2, 824);
      chips(g, S, HH, 40, '#16170f'); chips(g, S, HH, 14, '#6b3a1c'); streaks(g, S, HH, 40, 'rgba(40,30,20,.85)', HH * 0.8); grime(g, S, HH, 1.3);
    }, 1, 1, true, 896), totM = std(0xffffff, 0.75, { map: totTex, bumpMap: bump(2), bumpScale: 0.008 });
    [-4.9, 4.9].forEach(function (x) {
      var g = grp(x, 144.6, x < 0 ? 0.35 : -0.35); box(1.0, 0.3, 0.6, M.concrete, 0, 0.15, 0, g); box(0.84, 3.9, 0.3, EM.rustSteel, 0, 2.25, 0, g);
      mesh(new THREE.PlaneGeometry(0.8, 3.8), totM, 0, 2.25, 0.152, g).userData.noCast = true; var tb = mesh(new THREE.PlaneGeometry(0.8, 3.8), totM, 0, 2.25, -0.152, g); tb.rotation.y = PI; tb.userData.noCast = true; box(0.96, 0.1, 0.42, green, 0, 4.25, 0, g);
      ring(x, 144.6, 0.5);
    });
    /* Three flags, one mesh (and one cloth: the green on the top half of the texture, the red on the bottom), blown about in
       Welcome.step. */
    var flagTex = canvasTex(128, function (g, S, HH) {
      g.clearRect(0, 0, S, HH); ['#254a30', '#8d1f18'].forEach(function (hue, n) {
        g.save(); g.translate(0, n * 80); g.fillStyle = hue; g.fillRect(0, 0, S, 80); g.fillStyle = '#ece3c4'; g.beginPath(); g.ellipse(S * 0.45, 40, 22, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(200,190,160,.35)'; g.fillRect(0, 0, S, 80); streaks(g, S, 80, 12, 'rgba(30,30,20,.8)', 80);
        g.globalCompositeOperation = 'destination-out'; for (var k = 0; k < 7; k++) { g.beginPath(); g.moveTo(S, k * 80 / 6); g.lineTo(S - 14 - Math.random() * 40, k * 80 / 6 + 80 / 12); g.lineTo(S, (k + 1) * 80 / 6); g.fill(); } g.globalCompositeOperation = 'source-over'; g.restore(); });
    }, 1, 1, true, 160);
    var fP = [], fU = [], fI = [], fL = [];                       // positions, uvs, indices; and for each vertex its distance along the cloth, where it hangs, and its flag's phase
    [[-12.6, 0], [-15.0, 1], [-17.4, 0]].forEach(function (f, n) {
      cyl(0.045, 0.07, 7.2, steel, f[0], 3.6, 147.8, null, 8); cyl(0.2, 0.24, 0.3, M.concrete, f[0], 0.15, 147.8, null, 10); mesh(new THREE.SphereGeometry(0.08, 8, 6), M.gold, f[0], 7.25, 147.8); ring(f[0], 147.8, 0.22);
      var geo = new THREE.PlaneGeometry(1.5, 0.9, 8, 4), GP = geo.attributes.position, GU = geo.attributes.uv, off = fP.length / 3, px = f[0] + 0.05, py = 6.5 - n * 0.9, v;
      for (v = 0; v < GP.count; v++) { var lx = GP.getX(v) + 0.75; fP.push(px + lx, py + GP.getY(v), 147.8); fU.push(GU.getX(v), f[1] ? GU.getY(v) * 0.5 : 0.5 + GU.getY(v) * 0.5); fL.push(lx, py + GP.getY(v), n * 2.1); }
      for (v = 0; v < geo.index.count; v++) fI.push(geo.index.getX(v) + off);
    });
    var fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fP, 3)); fgeo.setAttribute('uv', new THREE.Float32BufferAttribute(fU, 2)); fgeo.setIndex(fI); fgeo.computeVertexNormals(); fgeo.computeBoundingSphere(); fgeo.boundingSphere.radius += 0.5;
    var fm = dyn(new THREE.Mesh(fgeo, std(0xffffff, 0.9, { map: flagTex, alphaTest: 0.5, side: THREE.DoubleSide }))); fm.userData.noCast = true; fm.userData.keep = true; scene.add(fm); Wc.flags = { pos: fgeo.attributes.position, L: fL };
    // ----- the photo point: Trixie, the park's fibreglass Triceratops, on her plinth -----
    (function () {
      var x = -15.6, z = 140.6, PY = 0.36;
      var fib = std(0xffffff, 0.5, { map: canvasTex(256, function (c, S) {
        c.fillStyle = '#5a7347'; c.fillRect(0, 0, S, S); c.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#4c653c', '#688152', '#55703f'], 5000, 2.4)(c, S); c.globalAlpha = 1;
        for (var n = 0; n < 9; n++) { c.fillStyle = 'rgba(46,62,34,.5)'; c.beginPath(); c.ellipse(S * 0.75 + (n % 3 - 1) * 16, n * S / 9 + 12, 30, 9, 0, 0, 7); c.fill(); }            // dark saddle blotches down the back
        c.fillStyle = 'rgba(190,186,150,.22)'; c.fillRect(0, 0, S * 0.3, S);                                                                                                                 // the paler belly
        chips(c, S, S, 9, '#cfcab8'); chips(c, S, S, 8, '#3a342a'); streaks(c, S, S, 26, 'rgba(34,30,20,.7)', S * 0.5); blotch(c, S, ['#2c3a22', '#8a9a6c'], 14, 8, 30, 0.25);
      }), bumpMap: bump(4), bumpScale: 0.02 }), horn = C(0xb9b094, 0.55);
      wbox(x - 2.6, x + 2.6, 0, PY, z - 1.6, z + 1.6, EM.stone, 1.5); boxes.push({ x1: x - 2.6, x2: x + 2.6, z1: z - 1.6, z2: z + 1.6 });
      var g = grp(x, z, -0.3, PY);
      tube([[0, 1.20, -1.45, 0.20, 0.22], [0, 1.32, -0.95, 0.52, 0.50], [0, 1.40, -0.30, 0.68, 0.62], [0, 1.38, 0.40, 0.66, 0.60], [0, 1.30, 0.95, 0.50, 0.46], [0, 1.24, 1.38, 0.34, 0.34]], fib, g, 18, 5);
      tube([[0, 1.20, -1.38, 0.21, 0.23], [0, 1.06, -1.95, 0.13, 0.14], [0, 0.86, -2.40, 0.07, 0.075], [0, 0.72, -2.78, 0.015, 0.015]], fib, g, 12, 4);
      [[0.42, 0.8, 0.22, 0.15, 0.13, 0.17, 1.2, 0.04], [0.46, -0.75, 0.3, 0.2, 0.15, 0.2, 1.3, -0.05]].forEach(function (L) {          // x, z, radii thigh / knee / shin / foot, top, lean
        [-1, 1].forEach(function (s) {
          tube([[s * L[0], L[6], L[1], L[2] * 1.15, L[2]], [s * L[0] * 1.05, 0.78, L[1] + L[7], L[3] * 1.1, L[3]], [s * L[0] * 1.09, 0.34, L[1] + L[7] * 2, L[4] * 1.05, L[4]], [s * L[0] * 1.12, 0.03, L[1] + L[7] * 3, L[5] * 1.1, L[5]]], fib, g, 12, 4, ZAX);
          cyl(L[5] * 1.02, L[5] * 1.1, 0.1, fib, s * L[0] * 1.12, 0.05, L[1] + L[7] * 3 + 0.03, g, 12);
          for (var t = -1; t <= 1; t++) mesh(sphGeo, horn, s * L[0] * 1.12 + t * 0.09, 0.05, L[1] + L[7] * 3 + L[5] + 0.03 - Math.abs(t) * 0.03, g).scale.set(0.09, 0.09, 0.1);                 // hooves
        });
      });
      var hd = new THREE.Group(); hd.position.set(0, 1.28, 1.3); hd.rotation.x = 0.2; g.add(hd);
      tube([[0, 0.08, -0.15, 0.34, 0.34], [0, 0.04, 0.30, 0.30, 0.31], [0, -0.04, 0.70, 0.21, 0.25], [0, -0.14, 1.0, 0.12, 0.18], [0, -0.30, 1.2, 0.03, 0.05]], fib, hd, 14, 5);
      tube([[0, -0.2, 0.05, 0.24, 0.1], [0, -0.27, 0.5, 0.17, 0.08], [0, -0.33, 0.9, 0.08, 0.05], [0, -0.36, 1.08, 0.02, 0.02]], fib, hd, 10, 4);
      mesh(sphGeo, horn, 0, -0.27, 1.14, hd).scale.set(0.1, 0.16, 0.2);                                                                           // the beak
      var fr = new THREE.Group(); fr.position.set(0, 0.5, -0.3); fr.rotation.x = -0.5; hd.add(fr);
      var fs = mesh(sphGeo, fib, 0, 0, 0, fr); fs.scale.set(1.8, 1.6, 0.2); fs.castShadow = true;
      for (q = -4; q <= 4; q++) { var a = q * 0.32, sd = mesh(new THREE.ConeGeometry(0.05, 0.13, 6), horn, Math.sin(a) * 0.88, Math.cos(a) * 0.78, 0, fr); sd.rotation.z = -a; }
      var bh = mesh(new THREE.ConeGeometry(0.075, 0.9, 10), horn, -0.2, 0.5, 0.68, hd); bh.rotation.x = 1.0; mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.26, 10), horn, 0.2, 0.33, 0.41, hd).rotation.x = 1.0;      // the right brow horn snapped off
      mesh(new THREE.ConeGeometry(0.06, 0.26, 8), horn, 0, 0.1, 0.92, hd).rotation.x = 0.45;
      [-1, 1].forEach(function (s) { mesh(new THREE.SphereGeometry(0.04, 8, 8), C(0x0a0a08, 0.25), s * 0.275, 0.1, 0.36, hd); mesh(sphGeo, fib, s * 0.3, -0.08, 0.2, hd).scale.set(0.12, 0.2, 0.3); });
      var lost = mesh(new THREE.CylinderGeometry(0.0, 0.05, 0.62, 10), horn, x + 1.5, PY + 0.05, z + 1.15); lost.rotation.set(0, 0.5, PI / 2);                 // it lies on the plinth
      var pq = mesh(new THREE.PlaneGeometry(1.5, 0.5), std(0xffffff, 0.7, { map: canvasTex(384, function (c, S, HH) { c.fillStyle = '#254a30'; c.fillRect(0, 0, S, HH); c.strokeStyle = '#d9ae35'; c.lineWidth = 6; c.strokeRect(6, 6, S - 12, HH - 12); c.fillStyle = '#e2b93b'; c.textAlign = 'center'; c.font = 'bold 40px ' + FONT; c.fillText('PHOTO POINT', S / 2, 50); c.fillStyle = '#ece3c4'; c.font = '19px ' + FONT; c.fillText('“TRIXIE”  ·  Triceratops  ·  half life size', S / 2, 82); c.fillText('Please do not climb on her.', S / 2, 108); chips(c, S, HH, 14, '#16170f'); grime(c, S, HH, 1); }, 1, 1, true, 128) }), x + 1.2, 0.62, z + 1.86); pq.rotation.set(-0.5, 0, 0); pq.userData.noCast = true; box(1.56, 0.56, 0.04, darkM, x + 1.2, 0.6, z + 1.83).rotation.x = -0.5; [x + 0.6, x + 1.8].forEach(function (px) { box(0.05, 0.5, 0.05, darkM, px, 0.25, z + 1.78); });
      var ft = mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ roughness: 1, transparent: true, opacity: 0.55, depthWrite: false, map: canvasTex(128, function (c, S) { c.clearRect(0, 0, S, S); c.fillStyle = '#d9ae35'; [[44, 80], [84, 80]].forEach(function (p) { c.beginPath(); c.ellipse(p[0], p[1], 13, 26, 0, 0, 7); c.fill(); }); c.font = 'bold 15px Arial'; c.textAlign = 'center'; c.fillText('STAND HERE', S / 2, 28); c.globalCompositeOperation = 'destination-out'; for (var n = 0; n < 30; n++) { c.beginPath(); c.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 6, 0, 7); c.fill(); } }) }), x + 1.0, 0.032, z + 4.2); ft.rotation.set(-PI / 2, 0, 0.2); ft.userData.noCast = true;
    })();
    // ----- the café terrace: three tables under faded parasols, chairs every way but upright, a coffee kiosk -----
    var parTex = canvasTex(128, function (g, S) { for (var n = 0; n < 8; n++) { g.fillStyle = n % 2 ? '#d8d2c2' : '#2f6a4a'; g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S / 2, n * PI / 4, (n + 1) * PI / 4); g.fill(); } g.fillStyle = 'rgba(200,190,160,.3)'; g.fillRect(0, 0, S, S); blotch(g, S, ['#3a3a2a', '#5a5a44'], 14, 6, 26, 0.4); });
    var parGeo = new THREE.ConeGeometry(1.5, 0.5, 8, 1, true), PU = parGeo.attributes.uv, PP = parGeo.attributes.position; for (q = 0; q < PU.count; q++) { var pr = PP.getY(q) > 0 ? 0 : 0.5, pa = Math.atan2(PP.getZ(q), PP.getX(q)); PU.setXY(q, 0.5 + Math.cos(pa) * pr, 0.5 + Math.sin(pa) * pr); }
    var parM = std(0xffffff, 0.9, { map: parTex, side: THREE.DoubleSide }), tabM = C(0x9a968a, 0.5, 0.3), chM = C(0x2f5a3a, 0.6, 0.3), crock = C(0xb0ada0, 0.7);
    function cafeChair(x, z, rot, down) { var g = grp(x, z, rot); if (down) { g.rotation.x = 1.52; g.position.y = 0.22; } box(0.4, 0.03, 0.4, chM, 0, 0.44, 0, g); box(0.4, 0.38, 0.03, chM, 0, 0.66, -0.19, g); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(function (l) { cyl(0.012, 0.012, 0.44, steel, l[0], 0.22, l[1], g, 5); }); }
    [[-19.4, 134.6, 0], [-15.2, 133.6, 1], [-21.0, 138.6, 2]].forEach(function (t, n) {
      cyl(0.55, 0.55, 0.03, tabM, t[0], 0.74, t[1], null, 20); cyl(0.03, 0.03, 0.72, steel, t[0], 0.37, t[1], null, 8); cyl(0.3, 0.32, 0.03, steel, t[0], 0.015, t[1], null, 14); ring(t[0], t[1], 0.58);
      var pg = grp(t[0], t[1], n); if (n === 1) { pg.rotation.z = 1.35; pg.position.set(t[0] + 0.5, 0.4, t[1] + 0.9); } cyl(0.022, 0.022, 2.4, steel, 0, 1.2, 0, pg, 6); mesh(parGeo, parM, 0, 2.3, 0, pg);
      cafeChair(t[0] + 0.85, t[1] + 0.1, -PI / 2, n === 0); cafeChair(t[0] - 0.8, t[1] - 0.2, PI / 2 + 0.3, false); cafeChair(t[0] + 0.1, t[1] + 0.95, PI + 0.2, n === 2);
      cyl(0.035, 0.03, 0.09, crock, t[0] + 0.15, 0.8, t[1] - 0.1, null, 10); if (n !== 1) cyl(0.09, 0.09, 0.012, crock, t[0] - 0.15, 0.762, t[1] + 0.15, null, 12);
    });
    WB.cart(-22.4, 133.0, PI / 2, 'COFFEE'); WB.bin(-18.0, 136.9, true); WB.bin(-12.2, 136.4);
    // ----- pushchair and wheelchair hire: a lean-to against the wall by the gate -----
    (function () {
      var x1 = -23.6, x2 = -19.0, zb = 148.9; [x1, x2].forEach(function (x) { cyl(0.05, 0.05, 2.5, green, x, 1.25, zb - 1.9, null, 8); ring(x, zb - 1.9, 0.14); }); box(x2 - x1 + 0.4, 0.07, 2.2, M.roof, (x1 + x2) / 2, 2.62, zb - 0.95).rotation.x = -0.1;
      label(['PUSHCHAIR & WHEELCHAIR HIRE'], 3.6, 0.36, '#254a30', '#ece3c4', (x1 + x2) / 2, 2.25, zb - 2.0, PI, 640, '#d9ae35'); box(x2 - x1, 0.4, 0.04, green, (x1 + x2) / 2, 2.25, zb - 1.97);
      box(x2 - x1 - 0.2, 0.04, 0.04, steel, (x1 + x2) / 2, 0.55, zb - 0.32);                                                                                                           // the rail they were chained to
      for (var n = 0; n < 4; n++) { var g = grp(x1 + 0.6 + n * 0.95, zb - 0.8, PI + (n === 2 ? 0.5 : 0)); if (n === 3) { g.rotation.z = 1.4; g.position.y = 0.3; } var col = C([0x2c5fa8, 0x8a2a22, 0x2c5fa8, 0x3a6a4a][n], 0.9); box(0.44, 0.05, 0.6, col, 0, 0.5, 0, g); box(0.44, 0.5, 0.05, col, 0, 0.76, -0.3, g).rotation.x = -0.2; box(0.46, 0.3, 0.04, col, 0, 1.06, -0.12, g).rotation.x = 1.0; [[-0.23, 0.28], [0.23, 0.28], [-0.23, -0.28], [0.23, -0.28]].forEach(function (w) { cyl(0.09, 0.09, 0.035, M.rubber, w[0], 0.09, w[1], g, 10).rotation.z = PI / 2; cyl(0.01, 0.01, 0.42, steel, w[0], 0.3, w[1], g, 5); }); cyl(0.012, 0.012, 0.7, steel, -0.22, 0.98, -0.5, g, 5).rotation.x = -0.6; cyl(0.012, 0.012, 0.7, steel, 0.22, 0.98, -0.5, g, 5).rotation.x = -0.6; cyl(0.016, 0.016, 0.46, M.rubber, 0, 1.27, -0.7, g, 6).rotation.z = PI / 2; }
      boxes.push({ x1: x1 + 0.2, x2: x2 - 0.2, z1: zb - 1.25, z2: zb - 0.3 });
    })();
    // ----- today's times on a sandwich board, queue lines up to the booths, machines against the shop -----
    var sb = grp(-9.0, 139.4, 1.2), sbM = std(0xffffff, 0.8, { map: textTex(['TODAY', 'RAPTORS 11:00', 'OCEAN HALL 12:00', 'T. REX 13:00', 'KEEPER TALK 14:00'], 256, 392, '#17140e', '#e2b93b', null) }); [1, -1].forEach(function (s) { var p = new THREE.Group(); p.rotation.x = s * -0.28; p.position.z = s * 0.16; sb.add(p); box(0.7, 1.1, 0.03, woodM, 0, 0.55, 0, p); var f = mesh(new THREE.PlaneGeometry(0.62, 0.95), sbM, 0, 0.57, s * 0.017, p); f.rotation.y = s > 0 ? 0 : PI; f.userData.noCast = true; }); ring(-9.0, 139.4, 0.45);
    var belt = C(0x7a1f1a, 0.8);
    [-4.2, -1.4, 1.4, 4.2].forEach(function (x, n) { [118.9, 120.6, 122.3].forEach(function (z, m) { cyl(0.032, 0.032, 0.95, steel, x, 0.475, z, null, 8).userData.noCast = true; cyl(0.15, 0.17, 0.04, steel, x, 0.02, z, null, 12).userData.noCast = true; ring(x, z, 0.12); if (m < 2 && !(n === 1 && m === 1)) { var dn = n === 2 && m === 0, b = box(0.045, 0.04, dn ? 1.78 : 1.7, belt, x, dn ? 0.47 : 0.88, z + 0.85); b.rotation.x = dn ? 0.5 : 0; b.userData.noCast = true; } }); });
    WB.vending(13.2, 120.2, PI, '#1b3f8a'); WB.vending(14.8, 120.2, PI, '#8a1b1b'); WB.picnic(19.6, 118.3, 0.12); WB.bench(22.6, 117.6, 0);
    makeSign('SCHOOL PARTIES ASSEMBLE HERE', 16.6, 116.9, 0, 4.2, 2.3, '#e8e2d0', true);
    // ----- a skip in the alley behind the gift shop, a bin and a bench by the Welcome Center's door -----
    (function () {
      var sx = 14.5, sz = 136.3, geo = new THREE.BoxGeometry(2.6, 1.0, 1.12), P2 = geo.attributes.position; for (q = 0; q < P2.count; q++) if (P2.getY(q) < 0) P2.setX(q, P2.getX(q) * 0.66); geo.computeVertexNormals();
      var skM = std(0xffffff, 0.7, { map: canvasTex(128, function (g, S) { g.fillStyle = '#b08a22'; g.fillRect(0, 0, S, S); chips(g, S, S, 30, '#5a3418'); chips(g, S, S, 16, '#2a1c12'); streaks(g, S, S, 30, 'rgba(70,36,14,.85)', S * 0.8); grime(g, S, S, 1.4); }), metalness: 0.3, bumpMap: bump(2), bumpScale: 0.02 });
      mesh(geo, skM, sx, 0.58, sz); [0.56, -0.56].forEach(function (dz) { box(2.66, 0.07, 0.07, skM, sx, 1.09, sz + dz); }); [-1.3, 1.3].forEach(function (dx) { box(0.07, 0.07, 1.19, skM, sx + dx, 1.09, sz); });
      [-0.7, 0, 0.7].forEach(function (dx) { [-0.575, 0.575].forEach(function (dz) { box(0.07, 0.96, 0.03, skM, sx + dx, 0.58, sz + dz); }); }); [-1, 1].forEach(function (s) { box(0.1, 0.12, 0.1, darkM, sx + s * 1.2, 0.85, sz - 0.6); box(0.1, 0.12, 0.1, darkM, sx + s * 1.2, 0.85, sz + 0.6); box(1.5, 0.08, 0.1, darkM, sx, 0.04, sz + s * 0.4); });
      var bag = C(0x15171a, 0.5); [[-0.7, 1.12, 0.1, 0.5], [0.0, 1.18, -0.15, 0.62], [0.65, 1.1, 0.12, 0.5], [0.3, 1.3, 0.2, 0.4]].forEach(function (b) { mesh(sphGeo, bag, sx + b[0], b[1], sz + b[2]).scale.set(b[3] * 1.3, b[3], b[3] * 1.1); }); var pl = cyl(0.02, 0.02, 1.8, steel, sx - 0.4, 1.45, sz - 0.1, null, 5); pl.rotation.set(0.3, 0, 1.1); box(0.6, 0.02, 0.5, cardM, sx + 0.9, 1.3, sz - 0.2).rotation.set(0.5, 0.3, 0.2);
      boxes.push({ x1: sx - 1.32, x2: sx + 1.32, z1: sz - 0.6, z2: sz + 0.6 });
    })();
    WB.bin(X1 - 0.7, 140.95); WB.bench(X1 - 0.75, 139.5, -PI / 2);
  })();

  palette();

  // ---------- hooks ----------
  Wc.inside = function (x, z) { return x > X1 && x < X2 && z > Z1 && z < Z2; };
  /* The inside is drawn when you are in it, or when you are out in front and the doorway is in view: the windows are
     blind, so there is no other way to see in.  (Asked before every frame, so it holds in cinematics as well.) */
  var casters = null, castOn = true;
  Wc.see = function () {
    var cx = camera.position.x, cz = camera.position.z, within = Wc.inside(cx, cz);
    if (within !== castOn && W.batches !== undefined) {              // the furniture throws shadows for the torch only while you are in with it
      if (!casters) { casters = []; inner.traverse(function (o) { if (o.isMesh && o.castShadow) casters.push(o); }); }
      castOn = within; for (var n = 0; n < casters.length; n++) casters[n].castShadow = within;
    }
    if (within) inner.visible = true;
    else if (cx > X1 + 0.3 || cz < 108 || cx < -30) inner.visible = false;
    else { var ddx = X1 - cx, ddz = DZ - cz, dl = Math.hypot(ddx, ddz) || 1; camera.getWorldDirection(seeV); inner.visible = dl < 3 || ((seeV.x * ddx + seeV.z * ddz) / dl > 0.25 && (dl < 16 || ddx / dl > 0.5) && dl < 46); }      // (in view, and not a far-off sliver seen at a slant)
  };
  beforeRender.push(Wc.see);
  Wc.step = function (dt) {
    var cx = camera.position.x, cz = camera.position.z, on = !!(P && P.pow0), t = playTime; Wc.see();
    var near = inner.visible && cz > 122 && cx > -12, f = Math.sin(t * 19) + Math.sin(t * 7.3 + 1) > -1.1 ? 1 : 0.15, lit = on && near;
    Wc.light.intensity = lit ? 0.75 * (0.6 + 0.4 * f) : 0; Wc.light2.intensity = lit ? 0.42 : 0;
    Wc.tubes[0].color.setHex(on ? (f > 0.5 ? 0xf4f7ff : 0x6a6e74) : 0x1c1c1a); Wc.tubes[2].color.setHex(on ? 0xf4f7ff : 0x1c1c1a); Wc.bulbs[0].color.setHex(on ? 0xdfeeff : 0x1c1c1a); Wc.lampM.color.setHex(on ? 0xffe6b0 : 0x1c1c1a);
    if (cz > 118) { var FP = Wc.flags.pos, FL = Wc.flags.L; for (var v = 0; v < FP.count; v++) { var x = FL[v * 3], ph = FL[v * 3 + 2]; FP.setZ(v, 147.8 + Math.sin(x * 3.2 - t * 2.1 + ph) * 0.09 * x); FP.setY(v, FL[v * 3 + 1] - x * x * 0.11 + Math.sin(x * 2 - t * 1.4 + ph) * 0.03 * x); } FP.needsUpdate = true; }
  };
  return Wc;
})();
