/* Jurassic Massacre — the aquarium.
   Twelve years shut.  You come in through a small door into the TANK GALLERY: a blue-and-white room of glass tanks, most of
   them still full, none of them with anything alive in it.  A short tunnel leads into the OCEAN HALL, which is one enormous
   glass tank with the Elasmosaurus in it, a viewing ramp climbing each side to a gallery behind.  The key piece is on the
   keepers' work platform over the water, and the only way up there is the service lift from the basement:
     a STAFF ONLY door on the rear gallery (chained: it has to be kicked in), stairs down, a pump room where the lift's
     hydraulic manifold has to be re-plumbed, the lift up to the catwalks, the catwalks across the water (the animal strikes
     at them), a gap that cannot be jumped — and then the water, the dark, and the only thing in the tank that can kill it.
   This file is the building and everything fixed in it.  aquaplay.js is what happens there.
   Floors: Aqua.ground(x, z, feet).  Collision boxes here may carry y1, y2 (see resolve in core.js).  State: P.aq (saved). */
'use strict';

var Aqua = (function () {
  var A = { lights: {}, mats: {}, tanks: [], anim: [] }, G = GAL, H = HALL, T = POOL, EM = Entrance.M, i, k;
  var n0 = scene.children.length, groups = {};
  /* Everything is built into the scene and then gathered, part by part, into groups that are only drawn when they could be
     seen (nothing culls a room behind a wall otherwise).  Lights stay in the scene: the light pool owns them. */
  function gather(name) {
    var g = groups[name] || (groups[name] = new THREE.Group()), keepers = [];
    g.userData.keep = true; g.userData.batchInside = true;
    while (scene.children.length > n0) { var c = scene.children[n0]; if (c.isLight) { scene.remove(c); keepers.push(c); } else g.add(c); }
    if (!g.parent) scene.add(g); keepers.forEach(function (c) { scene.add(c); }); n0 = scene.children.length; return g;
  }
  A.groups = groups;
  function solid(x1, x2, z1, z2, y1, y2, sees) { var b = { x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2), solid: !sees }; if (y1 !== undefined && y1 !== null) { b.y1 = y1; b.y2 = y2; } boxes.push(b); return b; }
  A.solid = solid;
  function light(name, color, x, y, z, range, decay) { var l = dyn(new THREE.PointLight(color, 0, range, decay || 1.4)); l.position.set(x, y, z); scene.add(l); A.lights[name] = l; l.userData.base = 0; return l; }

  // ---------- floors ----------
  /* A floor is a rectangle at one height, or a ramp (y at the low end of `axis`, y2 at the high end).  ground() gives the
     highest floor under a point that someone whose feet are at `feet` could be standing on or step up to. */
  var floors = [];
  function floor(x1, x2, z1, z2, y, y2, axis, kind) { var f = { x1: x1, x2: x2, z1: z1, z2: z2, y: y, y2: y2 === undefined || y2 === null ? y : y2, axis: axis || 'x', kind: kind || 'hard' }; floors.push(f); return f; }
  function floorY(f, x, z) { if (f.y === f.y2) return f.y; var t = f.axis === 'x' ? (x - f.x1) / (f.x2 - f.x1) : (z - f.z1) / (f.z2 - f.z1); return f.y + (f.y2 - f.y) * clamp(t, 0, 1); }
  A.floorAt = function (x, z, feet) {
    var best = null, by = -1e9, low = null, ly = 1e9;
    for (var q = 0; q < floors.length; q++) {
      var f = floors[q]; if (f.off || x < f.x1 || x > f.x2 || z < f.z1 || z > f.z2) continue;
      var y = floorY(f, x, z); if (y <= feet + 0.55 && y > by) { by = y; best = f; } if (y < ly) { ly = y; low = f; }
    }
    return best || low;
  };
  A.ground = function (x, z, feet) { var f = A.floorAt(x, z, feet); return f ? floorY(f, x, z) : 0; };
  A.floors = floors; A.floor = floor;

  // ---------- textures ----------
  /* The aquarium was sky blue and white.  It still is, under what twelve years of a leaking roof have done to it. */
  function flake(g, w, h, n, minR, maxR, plaster) {            // paint lifted off in ragged patches: bare plaster, with the edge of the paint casting a line
    for (var q = 0; q < n; q++) {
      var x = Math.random() * w, y = Math.random() * h, r = minR + Math.random() * (maxR - minR), pts = [], m = 9 + ((Math.random() * 5) | 0), a;
      for (a = 0; a < m; a++) { var an = a / m * 6.283, rr = r * (0.45 + Math.random() * 0.75); pts.push([x + Math.cos(an) * rr * (0.7 + Math.random() * 0.6), y + Math.sin(an) * rr]); }
      g.fillStyle = 'rgba(40,44,40,.55)'; g.beginPath(); pts.forEach(function (p2, n2) { if (n2) g.lineTo(p2[0] + 1.5, p2[1] + 2.5); else g.moveTo(p2[0] + 1.5, p2[1] + 2.5); }); g.fill();
      g.fillStyle = plaster[(Math.random() * plaster.length) | 0]; g.beginPath(); pts.forEach(function (p2, n2) { if (n2) g.lineTo(p2[0], p2[1]); else g.moveTo(p2[0], p2[1]); }); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); pts.forEach(function (p2, n2) { if (n2) g.lineTo(p2[0] - 1, p2[1] - 1.6); else g.moveTo(p2[0] - 1, p2[1] - 1.6); }); g.lineTo(pts[0][0], pts[0][1]); g.closePath(); g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
    }
  }
  function mould(g, w, h, y0, n) { for (var q = 0; q < n; q++) { g.fillStyle = 'rgba(' + (18 + Math.random() * 20 | 0) + ',' + (26 + Math.random() * 24 | 0) + ',' + (16 + Math.random() * 14 | 0) + ',' + (0.25 + Math.random() * 0.5) + ')'; g.beginPath(); g.arc(Math.random() * w, y0 + Math.pow(Math.random(), 2.2) * (h - y0), 0.7 + Math.random() * 2.6, 0, 7); g.fill(); } }
  function fishStamp(g, x, y, s, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 9 * s, 4.6 * s, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 7 * s, y); g.lineTo(x - 14 * s, y - 5 * s); g.lineTo(x - 14 * s, y + 5 * s); g.fill(); }
  function wave(g, w, y, amp, len, col, lw) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (var x = 0; x <= w; x += 4) { var yy = y + Math.sin(x / len * 6.283) * amp; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
  // the gallery's wallpaper: 4 m wide by 4 m high.  A sky-blue dado under a wave border; above it white paper with a faint fish print.
  var wallTex = canvasTex(1024, function (g, S) {
    var px = S / 4, dado = S - 1.15 * px, q;
    g.fillStyle = '#dfe6e4'; g.fillRect(0, 0, S, S);
    for (q = 0; q < 90; q++) fishStamp(g, (q * 137.5) % S, ((q * 71.3) % (dado - 30)) + 10, 0.8 + (q % 3) * 0.2, q % 2 ? 'rgba(134,186,214,.34)' : 'rgba(160,204,224,.26)');
    for (q = 0; q < 26; q++) { g.strokeStyle = 'rgba(150,196,220,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc((q * 211.7) % S, (q * 97.1) % dado, 3 + q % 5, 0, 7); g.stroke(); }      // bubbles
    for (q = 1; q < 8; q++) { g.fillStyle = 'rgba(120,130,128,.2)'; g.fillRect(q * S / 8 - 0.6, 0, 1.2, dado); }                                                              // the seams between the drops of paper
    var gr = g.createLinearGradient(0, dado, 0, S); gr.addColorStop(0, '#8cc0da'); gr.addColorStop(1, '#6fa6c4'); g.fillStyle = gr; g.fillRect(0, dado, S, S - dado);
    wave(g, S, dado - 9, 5, S / 8, '#3f7fa8', 5); wave(g, S, dado + 3, 5, S / 8, '#f1f4f0', 4); g.fillStyle = '#3f7fa8'; g.fillRect(0, dado + 12, S, 3);
    g.fillStyle = '#4d6f84'; g.fillRect(0, S - 0.11 * px, S, 0.11 * px); g.fillStyle = 'rgba(20,30,34,.5)'; g.fillRect(0, S - 0.11 * px, S, 2);                                 // skirting
    // what the damp has done
    g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#c9cfc8', '#f2f5f1', '#b9c4c2'], 9000, 1.6)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['rgba(150,128,72,.5)', 'rgba(120,104,60,.45)', 'rgba(96,110,84,.4)'], 30, 20, 120, 0.4);                                                               // tide marks
    streaks(g, S, S, 70, 'rgba(120,96,52,.75)', S * 0.75); streaks(g, S, S, 40, 'rgba(50,60,44,.7)', S * 0.5);
    flake(g, S, S, 30, 8, 46, ['#9a9a92', '#8b8c86', '#a5a498', '#7f8480']);
    for (q = 0; q < 7; q++) { var sx = Math.random() * S, sw = 8 + Math.random() * 22, sh = 60 + Math.random() * 260, sy = Math.random() * (dado - sh);                    // long strips of paper come away
      g.fillStyle = 'rgba(30,34,32,.5)'; g.fillRect(sx + 2, sy + 3, sw, sh); g.fillStyle = ['#8f918a', '#9c9d94'][q % 2]; g.fillRect(sx, sy, sw, sh); g.fillStyle = 'rgba(240,244,240,.8)'; g.fillRect(sx - 2, sy + sh - 3, sw + 5, 6); }
    mould(g, S, S, S * 0.55, 2600); mould(g, S, S * 0.2, 0, 700); grime(g, S, S, 1.2);
  });
  // the ocean hall's walls: 6.25 m wide by 12.5 m high.  A mural: deep sea blue at your feet, paling to white overhead.
  var hallTex = canvasTex(512, function (g, S, HH) {
    var gr = g.createLinearGradient(0, 0, 0, HH), q; gr.addColorStop(0, '#e6ebe8'); gr.addColorStop(0.42, '#cfdfe4'); gr.addColorStop(0.7, '#8fbfd6'); gr.addColorStop(0.9, '#5b97b8'); gr.addColorStop(1, '#3f7ba0'); g.fillStyle = gr; g.fillRect(0, 0, S, HH);
    [[0.66, '#b4d4e2', 9], [0.74, '#9cc6da', 12], [0.82, '#7fb1cc', 14], [0.9, '#6a9fbe', 16]].forEach(function (w2) { g.fillStyle = w2[1]; g.beginPath(); g.moveTo(0, HH); for (var x = 0; x <= S; x += 4) g.lineTo(x, HH * w2[0] + Math.sin(x / S * 6.283 * 3 + w2[2]) * w2[2]); g.lineTo(S, HH); g.fill(); });
    g.fillStyle = 'rgba(52,104,140,.5)'; g.save(); g.translate(S * 0.5, HH * 0.6); g.beginPath(); g.ellipse(0, 0, 120, 44, -0.08, 0, 7); g.fill();                              // her portrait, three storeys up, nearly gone
    g.beginPath(); g.moveTo(100, -14); g.quadraticCurveTo(200, -70, 232, -150); g.quadraticCurveTo(250, -120, 150, 10); g.fill(); g.beginPath(); g.ellipse(238, -156, 22, 10, -0.9, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-100, 0); g.quadraticCurveTo(-190, -10, -220, 30); g.quadraticCurveTo(-170, 24, -104, 22); g.fill(); [[-50, 30, 0.9], [60, 34, 0.5]].forEach(function (f) { g.save(); g.translate(f[0], f[1]); g.rotate(f[2]); g.beginPath(); g.ellipse(0, 34, 16, 46, 0, 0, 7); g.fill(); g.restore(); }); g.restore();
    for (q = 0; q < 60; q++) fishStamp(g, (q * 131.7) % S, HH * 0.5 + ((q * 53.9) % (HH * 0.45)), 0.7 + (q % 4) * 0.25, 'rgba(230,240,244,.2)');
    g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#c4ccc8', '#eef2ee', '#9fb4bc'], 8000, 1.8)(g, S, HH); g.globalAlpha = 1;
    streaks(g, S, HH, 90, 'rgba(96,84,52,.8)', HH * 0.8); streaks(g, S, HH, 60, 'rgba(40,52,40,.75)', HH * 0.6);
    blotch(g, S, ['rgba(110,100,64,.5)', 'rgba(70,84,66,.45)'], 26, 20, 110, 0.4); g.save(); g.translate(0, HH - S); blotch(g, S, ['rgba(40,60,44,.6)', 'rgba(110,100,64,.5)'], 30, 20, 110, 0.45); g.restore();
    flake(g, S, HH, 46, 6, 38, ['#8f918a', '#84877f', '#9c9b90']); mould(g, S, HH, HH * 0.8, 2600); grime(g, S, HH, 1.3);
  }, 1, 1, true, 1024);
  // vinyl floor: half-metre tiles, pale blue and white, 4 m to a repeat
  var floorTex = canvasTex(512, function (g, S) {
    var n = 8, c = S / n, a, b;
    for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = (a + b) % 2 ? ['#a9cadb', '#a2c4d6', '#b0cfde'][(a * 3 + b) % 3] : ['#dde3e0', '#d5dcd9', '#e3e8e5'][(a + b * 2) % 3]; g.fillRect(a * c, b * c, c, c); }
    g.strokeStyle = 'rgba(60,72,76,.6)'; g.lineWidth = 1.4; for (a = 0; a <= n; a++) { g.beginPath(); g.moveTo(a * c, 0); g.lineTo(a * c, S); g.moveTo(0, a * c); g.lineTo(S, a * c); g.stroke(); }
    g.globalAlpha = 0.4; speckle('rgba(0,0,0,0)', ['#6c7a7c', '#f2f4f0', '#8a9698', '#4c5658'], 16000, 1.4)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#3c4238', '#5a5440', '#2c342e', '#6e684c'], 60, 14, 90, 0.36);
    g.strokeStyle = 'rgba(24,28,26,.7)'; for (a = 0; a < 12; a++) { g.lineWidth = 0.8 + Math.random() * 1.2; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); for (b = 0; b < 7; b++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
    for (a = 0; a < 5; a++) { g.fillStyle = '#4a4e48'; g.fillRect(((Math.random() * n) | 0) * c + 2, ((Math.random() * n) | 0) * c + 2, c - 4, c - 4); }                 // tiles lifted and gone: the screed under them
  });
  // the hall's floor: big pale slabs, a blue wave border worked into every fourth course, grey with twelve years of it
  var slabTex = canvasTex(512, function (g, S) {
    var n = 4, c = S / n, a, b;
    for (a = 0; a < n; a++) for (b = 0; b < n; b++) { var v = 150 + ((a * 5 + b * 3) % 4) * 7; g.fillStyle = 'rgb(' + (v - 8) + ',' + v + ',' + (v + 4) + ')'; g.fillRect(a * c, b * c, c, c); }
    g.fillStyle = '#5d92b2'; g.fillRect(0, 0, S, 10); wave(g, S, 18, 4, S / 6, '#5d92b2', 3);
    g.strokeStyle = 'rgba(40,48,52,.7)'; g.lineWidth = 2; for (a = 0; a <= n; a++) { g.beginPath(); g.moveTo(a * c, 0); g.lineTo(a * c, S); g.moveTo(0, a * c); g.lineTo(S, a * c); g.stroke(); }
    g.globalAlpha = 0.45; speckle('rgba(0,0,0,0)', ['#5c6668', '#c8d0d0', '#7c8888', '#3c4446'], 18000, 1.5)(g, S); g.globalAlpha = 1;
    blotch(g, S, ['#2c3430', '#4c4a3a', '#243028', '#5c5a44'], 70, 16, 110, 0.4);
  });
  var ceilTex = canvasTex(256, function (g, S) {             // suspended ceiling, 0.6 m tiles in a white grid, 2.4 m to a repeat
    var n = 4, c = S / n, a, b; g.fillStyle = '#cdd2cc'; g.fillRect(0, 0, S, S);
    for (a = 0; a < n; a++) for (b = 0; b < n; b++) { g.fillStyle = ['#c4c9c2', '#d2d6d0', '#bcc2ba'][(a * 2 + b) % 3]; g.fillRect(a * c + 2, b * c + 2, c - 4, c - 4); }
    g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#9aa09a', '#e8ebe6'], 5000, 1.2)(g, S); g.globalAlpha = 1; blotch(g, S, ['rgba(120,100,50,.7)', 'rgba(90,80,44,.6)', 'rgba(50,56,40,.5)'], 16, 10, 60, 0.6);
  });
  var concTex = canvasTex(512, function (g, S) {             // the basement and the tank's shell: shuttered concrete, 4 m to a repeat
    speckle('#7d7f7a', ['#6c6e69', '#8d8f89', '#5f615c', '#989a94'], 14000, 2)(g, S);
    for (var q = 1; q < 4; q++) { g.fillStyle = 'rgba(40,42,38,.5)'; g.fillRect(0, q * S / 4, S, 2); g.fillRect(q * S / 4 + 60, 0, 2, S); }
    for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) { g.fillStyle = 'rgba(30,32,30,.7)'; g.beginPath(); g.arc(a * S / 4 + 30, b * S / 4 + S / 8, 3.5, 0, 7); g.fill(); }      // form-tie holes
    streaks(g, S, S, 60, 'rgba(120,84,40,.8)', S * 0.7); streaks(g, S, S, 50, 'rgba(220,224,214,.5)', S * 0.5); blotch(g, S, ['#3a4034', '#2a2e28', '#55503c'], 40, 16, 90, 0.45); mould(g, S, S, S * 0.7, 1800);
  });
  var grateTex = canvasTex(64, function (g, S) { g.clearRect(0, 0, S, S); g.fillStyle = '#9aa2a6'; for (var q = 0; q < 4; q++) { g.fillRect(0, q * 16, S, 3.4); g.fillRect(q * 16, 0, 1.6, S); } g.fillStyle = 'rgba(110,60,24,.55)'; for (q = 0; q < 14; q++) g.fillRect(Math.random() * S, ((Math.random() * 4) | 0) * 16, 5 + Math.random() * 12, 3.4); });
  grateTex.minFilter = THREE.LinearMipmapLinearFilter;
  var M2 = A.mats;
  M2.wall = std(0xffffff, 0.9, { map: wallTex, bumpMap: bump(3), bumpScale: 0.012 });
  M2.hall = std(0xffffff, 0.92, { map: hallTex, bumpMap: bump(4), bumpScale: 0.014 });
  M2.floor = std(0xffffff, 0.5, { map: floorTex, bumpMap: bump(3), bumpScale: 0.008 });
  M2.slab = std(0xffffff, 0.42, { map: slabTex, bumpMap: bump(3), bumpScale: 0.01, metalness: 0.08 });
  M2.ceil = std(0xffffff, 0.95, { map: ceilTex });
  M2.conc = std(0xffffff, 0.94, { map: concTex, bumpMap: bump(3), bumpScale: 0.03 });
  M2.ext = std(0xffffff, 0.93, { map: canvasTex(512, function (g, S) {       // the outside: rendered block, once white with a blue band, 5 m to a repeat
    g.fillStyle = '#c6ccc8'; g.fillRect(0, 0, S, S); g.fillStyle = '#6c9fbc'; g.fillRect(0, S * 0.62, S, S * 0.2); wave(g, S, S * 0.62, 6, S / 5, '#e4e8e4', 5); wave(g, S, S * 0.82, 6, S / 5, '#e4e8e4', 5);
    g.globalAlpha = 0.5; speckle('rgba(0,0,0,0)', ['#a8aea8', '#dfe3de', '#8f9892'], 12000, 1.8)(g, S); g.globalAlpha = 1;
    streaks(g, S, S, 90, 'rgba(46,50,36,.85)', S * 0.9); flake(g, S, S, 26, 8, 40, ['#8a8c86', '#7c7f7a']); mould(g, S, S, S * 0.6, 3000); grime(g, S, S, 1.5);
  }), bumpMap: bump(3), bumpScale: 0.02 });
  M2.grate = std(0xffffff, 0.55, { map: grateTex, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.7 });
  M2.steel = std(0x7d868a, 0.5, { metalness: 0.75, map: metalTex });
  M2.blue = std(0xffffff, 0.6, { map: canvasTex(128, function (g, S) { g.fillStyle = '#5f97b6'; g.fillRect(0, 0, S, S); chips(g, S, S, 22, '#39424a'); chips(g, S, S, 10, '#7a4a26'); grime(g, S, S, 1); }), bumpMap: bump(2), bumpScale: 0.01, metalness: 0.2 });      // painted steel and joinery
  M2.white = std(0xffffff, 0.7, { map: canvasTex(128, function (g, S) { g.fillStyle = '#d9dedb'; g.fillRect(0, 0, S, S); chips(g, S, S, 18, '#8a8c84'); grime(g, S, S, 1.2); streaks(g, S, S, 10, 'rgba(110,84,40,.6)'); }), bumpMap: bump(2), bumpScale: 0.01 });
  M2.rail = std(0xaab4b8, 0.36, { metalness: 0.85, map: metalTex });
  M2.dark = std(0x0d1012, 0.95);
  A.flake = flake; A.mould = mould; A.wave = wave; A.fishStamp = fishStamp;

  // ---------- small builders ----------
  var uvV = new THREE.Vector3();
  /* A box whose texture is laid in metres (tu wide, tv high), so every piece of one wall carries one continuous picture. */
  function wb(x1, x2, y1, y2, z1, z2, mat, tu, tv, collide, parent) {
    var m = box(x2 - x1, y2 - y1, z2 - z1, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, parent); worldUV(m, tu || 4, tv || tu || 4);
    if (collide === true) solid(x1, x2, z1, z2); else if (collide) solid(x1, x2, z1, z2, collide[0], collide[1], collide[2]);
    return m;
  }
  /* One face of a wall: a sheet lying in the plane x = at (axis 'x') or z = at ('z'), looking along +dir, spanning a1..a2 the
     other way and y1..y2 up, with rectangular openings [a1, a2, y1, y2] cut out of it.  Texture laid in metres from y = y0. */
  function sheet(axis, at, dir, a1, a2, y1, y2, mat, tu, tv, holes, y0, parent) {
    var cuts = (holes || []).slice().sort(function (p, q) { return p[0] - q[0]; }), a = a1, parts = [], out = [];
    cuts.forEach(function (h) { if (h[0] > a) parts.push([a, h[0], y1, y2]); if (h[2] > y1) parts.push([h[0], h[1], y1, h[2]]); if (h[3] < y2) parts.push([h[0], h[1], h[3], y2]); a = h[1]; });
    if (a < a2) parts.push([a, a2, y1, y2]);
    parts.forEach(function (r) {
      var w = r[1] - r[0], hh = r[3] - r[2], m = mesh(new THREE.PlaneGeometry(w, hh), mat, 0, (r[2] + r[3]) / 2, 0, parent), c = (r[0] + r[1]) / 2;
      if (axis === 'x') { m.position.x = at; m.position.z = c; m.rotation.y = dir > 0 ? PI / 2 : -PI / 2; } else { m.position.z = at; m.position.x = c; m.rotation.y = dir > 0 ? 0 : PI; }
      var U = m.geometry.attributes.uv, P2 = m.geometry.attributes.position; m.updateMatrixWorld(true);
      for (var q = 0; q < P2.count; q++) { uvV.fromBufferAttribute(P2, q).applyMatrix4(m.matrixWorld); var u = axis === 'x' ? (dir > 0 ? -uvV.z : uvV.z) : (dir > 0 ? uvV.x : -uvV.x); U.setXY(q, u / tu, (uvV.y - (y0 || 0)) / tv); }
      U.needsUpdate = true; m.userData.noCast = true; out.push(m);
    });
    return out;
  }
  function flat(x1, x2, z1, z2, y, mat, tu, up, parent) {          // a floor (or, up = false, a ceiling) with its texture laid in metres
    var m = mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat, (x1 + x2) / 2, y, (z1 + z2) / 2, parent); m.rotation.x = up === false ? PI / 2 : -PI / 2; m.updateMatrixWorld(true);
    var U = m.geometry.attributes.uv, P2 = m.geometry.attributes.position; for (var q = 0; q < P2.count; q++) { uvV.fromBufferAttribute(P2, q).applyMatrix4(m.matrixWorld); U.setXY(q, uvV.x / tu, -uvV.z / tu); }
    U.needsUpdate = true; m.userData.noCast = true; return m;
  }
  /* A guard rail from (x1, z1) to (x2, z2) at floor heights y1 → y2: posts, a top rail, a knee rail, and something to stop
     you walking through it.  Returns nothing; posts are gathered and instanced once at the end. */
  var railPosts = [], railBars = [];
  function rail(x1, z1, x2, z2, y1, y2, o) {
    o = o || {}; y2 = y2 === undefined ? y1 : y2;
    var len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(len / (o.step || 1.5))), hh = o.h || 1.06, q, ang = Math.atan2(x2 - x1, z2 - z1), pitch = Math.atan2(y2 - y1, len), L3 = Math.hypot(len, y2 - y1);
    for (q = 0; q <= n; q++) { var t = q / n; railPosts.push([lerp(x1, x2, t), lerp(y1, y2, t) + hh / 2, lerp(z1, z2, t), 1, hh, 1]); }
    [hh, hh * 0.52].concat(o.kick ? [0.09] : []).forEach(function (yy, n2) { railBars.push([(x1 + x2) / 2, (y1 + y2) / 2 + yy, (z1 + z2) / 2, n2 === 2 ? 0.4 : n2 ? 0.7 : 1, n2 === 2 ? 3.2 : n2 ? 0.7 : 1, L3, -pitch, ang, 0]); });
    if (o.collide !== false) { var w = 0.07; solid(Math.min(x1, x2) - w, Math.max(x1, x2) + w, Math.min(z1, z2) - w, Math.max(z1, z2) + w, Math.min(y1, y2) - 0.2, Math.max(y1, y2) + hh + 0.5, true); }
  }
  A.rail = rail; A.wb = wb; A.sheet = sheet; A.flat = flat;
  function label(lines, w, h, bg, fg, x, y, z, rotY, pw, border) { var m = mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.75, { map: textTex(lines, pw || 256, Math.round((pw || 256) * h / w), bg, fg, border || null, false) }), x, y, z); m.rotation.y = rotY || 0; m.userData.noCast = true; return m; }
  A.label = label;

  // ================= the shell: what you see from the park =================
  (function () {
    var x1 = G.x1 - 0.5, x2 = G.x2 + 0.5, z1 = G.z1 - 0.5, z2 = G.z2 + 0.5, GH = G.h + 0.5, HH = H.h + 0.6, hx1 = H.x1 - 0.5, hx2 = 147, hz1 = H.z1 - 0.5, hz2 = H.z2 + 0.5;
    // the gallery: four walls (the west one with the door in it), a flat roof with a parapet
    wb(x1, x2, 0, GH, z1, G.z1, M2.ext, 5, 5, true); wb(x1, x2, 0, GH, G.z2, z2, M2.ext, 5, 5, true);
    wb(x1, G.x1, 0, GH, G.z1, 59.5, M2.ext, 5, 5, true); wb(x1, G.x1, 0, GH, 60.5, G.z2, M2.ext, 5, 5, true); wb(x1, G.x1, 2.1, GH, 59.5, 60.5, M2.ext, 5, 5);
    wb(G.x2, x2, 0, GH, G.z1, 58.2, M2.ext, 5, 5, true); wb(G.x2, x2, 0, GH, 61.8, G.z2, M2.ext, 5, 5, true); wb(G.x2, x2, 3.0, GH, 58.2, 61.8, M2.ext, 5, 5);
    box(x2 - x1 + 0.5, 0.3, z2 - z1 + 0.5, M.dark, (x1 + x2) / 2, GH + 0.15, (z1 + z2) / 2); box(x2 - x1 + 0.1, 0.26, z2 - z1 + 0.1, M.roof, (x1 + x2) / 2, GH + 0.43, (z1 + z2) / 2);
    // the tunnel between the two buildings
    wb(x2, hx1, 0, 3.6, 57.7, 58.2, M2.ext, 5, 5, true); wb(x2, hx1, 0, 3.6, 61.8, 62.3, M2.ext, 5, 5, true); box(hx1 - x2, 0.4, 4.6, M.dark, (x2 + hx1) / 2, 3.4, 60);
    // the ocean hall and the plant behind it, under one roof thirteen metres up
    wb(hx1, hx2, 0, HH, hz1, H.z1, M2.ext, 5, 5, true); wb(hx1, hx2, 0, HH, H.z2, hz2, M2.ext, 5, 5, true); wb(146.5, hx2, 0, HH, H.z1, H.z2, M2.ext, 5, 5, true);
    wb(hx1, H.x1, 0, HH, H.z1, 58.2, M2.ext, 5, 5, true); wb(hx1, H.x1, 0, HH, 61.8, H.z2, M2.ext, 5, 5, true); wb(hx1, H.x1, 3.0, HH, 58.2, 61.8, M2.ext, 5, 5);
    box(hx2 - hx1 + 0.6, 0.4, hz2 - hz1 + 0.6, M.dark, (hx1 + hx2) / 2, HH + 0.2, (hz1 + hz2) / 2); box(hx2 - hx1 + 0.2, 0.3, hz2 - hz1 + 0.2, M.roof, (hx1 + hx2) / 2, HH + 0.55, (hz1 + hz2) / 2);
    // the way in: a porch on two posts, the name over it, the door's frame
    [58.2, 61.8].forEach(function (z) { cyl(0.09, 0.1, 2.9, M2.blue, x1 - 1.9, 1.45, z, null, 10); box(0.3, 0.1, 0.3, M.concrete, x1 - 1.9, 0.05, z); circles.push({ x: x1 - 1.9, z: z, r: 0.2 }); });
    var cn = box(2.5, 0.12, 4.6, M2.blue, x1 - 1.05, 2.98, 60); cn.rotation.z = 0.05; box(2.4, 0.3, 0.08, M2.white, x1 - 1.1, 2.82, 57.76); box(2.4, 0.3, 0.08, M2.white, x1 - 1.1, 2.82, 62.24);
    box(0.08, 2.2, 0.12, M2.blue, x1 - 0.03, 1.1, 59.44); box(0.08, 2.2, 0.12, M2.blue, x1 - 0.03, 1.1, 60.56); box(0.08, 0.12, 1.24, M2.blue, x1 - 0.03, 2.16, 60);
    box(0.5, 0.04, 1.3, EM.stone, x1 - 0.2, 0.02, 60).userData.noCast = true;
    // AQUARIUM, in letters a metre high that used to light up
    var word = 'AQUARIUM', lm = std(0xffffff, 0.7, { map: canvasTex(64, function (g, S) { g.fillStyle = '#e9ece8'; g.fillRect(0, 0, S, S); streaks(g, S, S, 8, 'rgba(110,80,40,.8)', S); chips(g, S, S, 6, '#7a7c76'); }) });
    var ltex = function (ch, n) { return canvasTex(128, function (g, S, HH2) { g.clearRect(0, 0, S, HH2); g.fillStyle = n === 5 ? '#9aa6a8' : '#eef1ec'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 150px ' + ZOO_FONT; g.fillText(ch, S / 2, HH2 / 2 + 8); g.globalCompositeOperation = 'source-atop'; streaks(g, S, HH2, 8, 'rgba(100,70,34,.9)', HH2); g.globalCompositeOperation = 'source-over'; }, 1, 1, true, 160); };
    for (i = 0; i < word.length; i++) { var lz = 60 + (i - 3.5) * 1.02, lt = mesh(new THREE.PlaneGeometry(0.9, 1.12), new THREE.MeshStandardMaterial({ map: ltex(word[i], i), roughness: 0.7, alphaTest: 0.5 }), x1 - 0.04, 3.72 - (i === 6 ? 0.1 : 0), lz); lt.rotation.set(0, -PI / 2, i === 6 ? 0.22 : 0); lt.userData.noCast = true; }
    box(0.06, 0.06, 8.6, M2.steel, x1 - 0.02, 3.1, 60);
    label(['OPEN 9:30 — 17:00', 'ELASMOSAURUS FEEDING 12:00'], 1.5, 0.5, '#1d4a58', '#e9e2d0', x1 - 0.02, 1.62, 57.9, -PI / 2, 384, '#7fd6e8');
    label(['CLOSED UNTIL FURTHER NOTICE', 'BY ORDER OF THE DIRECTOR'], 0.8, 0.32, '#e9e2d0', '#8d1f18', x1 - 0.02, 1.5, 61.3, -PI / 2, 320, '#8d1f18');
    makeSign('THE AQUARIUM', x1 - 6.5, 55.2, -PI / 2, 5, 0, '#7fd6e8');
    // plant on the roofs (you only ever see it from across the park)
    [[86, GH + 0.56, 54], [91, GH + 0.56, 66], [118, HH + 0.7, 56], [128, HH + 0.7, 68]].forEach(function (p) { box(1.3, 0.8, 0.9, M2.steel, p[0], p[1] + 0.4, p[2]); box(1.34, 0.06, 0.94, M.dark, p[0], p[1] + 0.83, p[2]); });
  })();
  gather('shell').userData.keep = false; groups.shell.userData.batchInside = false;       // (always drawn: let the ordinary batching have it)

  // ================= the tank gallery =================
  (function () {
    var q, GHh = G.h;
    flat(G.x1, G.x2, G.z1, G.z2, 0.03, M2.floor, 4); flat(G.x1, G.x2, G.z1, G.z2, GHh, M2.ceil, 2.4, false);
    floor(G.x1 - 0.5, G.x2 + 0.5, G.z1, G.z2, 0, null, null, 'tile'); floor(G.x2, H.x1, 58.2, 61.8, 0, null, null, 'tile');
    sheet('z', G.z1 + 0.012, 1, G.x1, G.x2, 0, GHh, M2.wall, 4, 4); sheet('z', G.z2 - 0.012, -1, G.x1, G.x2, 0, GHh, M2.wall, 4, 4);
    sheet('x', G.x1 + 0.012, 1, G.z1, G.z2, 0, GHh, M2.wall, 4, 4, [[59.5, 60.5, 0, 2.1]]); sheet('x', G.x2 - 0.012, -1, G.z1, G.z2, 0, GHh, M2.wall, 4, 4, [[58.2, 61.8, 0, 3.0]]);
    // the tunnel: dark blue, ribbed like the inside of something
    var tun = std(0xffffff, 0.8, { map: canvasTex(256, function (g, S) { var gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#16303e'); gr.addColorStop(1, '#234e64'); g.fillStyle = gr; g.fillRect(0, 0, S, S); for (var a = 0; a < 24; a++) fishStamp(g, (a * 97) % S, (a * 61) % S, 0.8, 'rgba(120,180,210,.25)'); flake(g, S, S, 12, 5, 22, ['#70746e', '#5c605a']); mould(g, S, S, S * 0.5, 600); grime(g, S, S, 1.3); }), bumpMap: bump(3), bumpScale: 0.012 });
    sheet('z', 58.2 + 0.012, 1, G.x2 - 0.02, H.x1 + 0.02, 0, 3.0, tun, 4, 3); sheet('z', 61.8 - 0.012, -1, G.x2 - 0.02, H.x1 + 0.02, 0, 3.0, tun, 4, 3);
    flat(G.x2 - 0.02, H.x1 + 0.02, 58.2, 61.8, 0.03, M2.floor, 4); flat(G.x2 - 0.02, H.x1 + 0.02, 58.2, 61.8, 3.0, tun, 4, false);
    for (q = 0; q < 5; q++) { var rx = G.x2 + 0.5 + q; box(0.12, 3.0, 0.1, M2.blue, rx, 1.5, 58.25); box(0.12, 3.0, 0.1, M2.blue, rx, 1.5, 61.75); box(0.12, 0.1, 3.6, M2.blue, rx, 2.95, 60); }
    box(0.1, 0.62, 3.2, M2.blue, G.x2 - 0.06, 3.4, 60); label(['OCEAN HALL', 'ELASMOSAURUS  ·  “THE RIBBON LIZARD”'], 3.0, 0.52, '#1d4a58', '#e9e2d0', G.x2 - 0.12, 3.4, 60, -PI / 2, 512, '#7fd6e8');
    // what is left of the ceiling: tiles down, the void and its ducts showing, two tubes that still try to light
    [[80, 53.5, 1.2, 1.8], [88.2, 62.3, 1.8, 1.2], [93, 55, 1.2, 1.2], [84.5, 67.4, 0.6, 1.8], [78.2, 61, 1.2, 0.6]].forEach(function (h) {
      var hm = mesh(new THREE.PlaneGeometry(h[2], h[3]), M2.dark, h[0], GHh - 0.012, h[1]); hm.rotation.x = PI / 2; hm.userData.noCast = true;
      var tl = box(0.58, 0.02, 0.58, M2.ceil, h[0] + 0.2, 0.05, h[1] + 0.3); tl.rotation.set(0.04, srand() * 3, 0.03);                         // one of them on the floor, broken
      box(0.3, 0.02, 0.26, M2.ceil, h[0] - 0.4, 0.045, h[1] - 0.2).rotation.y = srand() * 3;
      var hang = box(0.58, 0.02, 0.58, M2.ceil, h[0] - h[2] / 2 + 0.29, GHh - 0.3, h[1]); hang.rotation.z = -1.05;                                 // and one hanging by an edge
    });
    A.tubes = [];
    [[80.5, 57, 0], [80.5, 63, 1], [86, 60, 2], [91.5, 57, 3], [91.5, 63, 4]].forEach(function (t) {
      box(1.3, 0.07, 0.2, M2.white, t[0], GHh - 0.04, t[1]); var tm = basic(0x1c1c1a, { fog: false }); var tb = box(1.2, 0.035, 0.05, tm, t[0], GHh - 0.09, t[1]); tb.userData.keep = true; A.tubes.push(tm);
    });
    light('galA', 0xdfeeff, 80.5, 3.4, 60, 15, 1.5); light('galB', 0xdfeeff, 91.5, 3.4, 60, 15, 1.5); light('galTank', 0x4fc3d8, 86, 1.8, 60, 17, 1.3);
    // wet floor: puddles under the worst of the roof
    var pud = new THREE.MeshStandardMaterial({ color: 0x0b1418, roughness: 0.04, metalness: 0.9, transparent: true, depthWrite: false, opacity: 0.85, map: canvasTex(64, function (c, S) { c.clearRect(0, 0, S, S); for (var n = 0; n < 9; n++) { var x = S / 2 + (Math.random() - 0.5) * S * 0.36, y = S / 2 + (Math.random() - 0.5) * S * 0.36, r = S * (0.16 + Math.random() * 0.16), gr = c.createRadialGradient(x, y, r * 0.5, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } }) });
    A.puddle = pud;
    [[80.3, 54, 1.6], [88.4, 62.6, 2.1], [93.2, 55.3, 1.4], [84.4, 66.9, 1.2], [78.6, 61.2, 1.0], [95, 60, 1.5]].forEach(function (p) { var pm = mesh(new THREE.CircleGeometry(p[2], 18), pud, p[0], 0.036, p[1]); pm.rotation.x = -PI / 2; pm.rotation.z = srand() * 6; pm.scale.set(1, 0.55 + srand() * 0.4, 1); pm.userData.noCast = true; });
    // wallpaper that has come right away from the wall and hangs in curls
    var curl = std(0xe2e6e2, 0.85, { side: THREE.DoubleSide, map: wallTex });
    [[77, G.z1 + 0.05, 0], [83.6, G.z2 - 0.05, PI], [94.2, G.z1 + 0.05, 0], [G.x1 + 0.05, 54.2, PI / 2], [G.x2 - 0.05, 66.2, -PI / 2], [89, G.z2 - 0.05, PI]].forEach(function (c, n) {
      var geo = new THREE.PlaneGeometry(0.5, 1.5, 1, 10), P2 = geo.attributes.position; for (var v = 0; v < P2.count; v++) { var yy = P2.getY(v), t = (0.75 - yy) / 1.5; P2.setZ(v, Math.pow(t, 2) * 0.5 + Math.sin(t * 5) * 0.03); P2.setY(v, yy - Math.pow(t, 3) * 0.25); }
      geo.computeVertexNormals(); var cm = mesh(geo, curl, c[0], 3.1 - (n % 3) * 0.4, c[1]); cm.rotation.y = c[2]; cm.userData.noCast = true;
    });
    // the desk by the door (the save point's terminal stands on the floor beside it: world.js), a rack of leaflets, a rope line
    var tz = TERMS[5].tz;
    label(['TICKETS  ·  INFORMATION'], 2.4, 0.34, '#1d4a58', '#e9e2d0', G.x1 + 0.03, 2.5, tz, PI / 2, 512, '#7fd6e8');
    var rack = new THREE.Group(); rack.position.set(G.x1 + 0.22, 0, 63.4); rack.rotation.y = PI / 2; scene.add(rack);
    box(1.0, 1.5, 0.06, M2.blue, 0, 0.95, 0, rack); for (q = 0; q < 12; q++) { var lf = box(0.2, 0.3, 0.012, std([0xd8e6ee, 0x6fb0d0, 0xf0e2a8][q % 3], 0.8), -0.36 + (q % 4) * 0.24, 1.45 - Math.floor(q / 4) * 0.42, 0.05, rack); lf.rotation.x = -0.18; if (q === 5 || q === 10) lf.visible = false; }
    solid(G.x1, G.x1 + 0.3, 62.9, 63.9, null, null, true);
    [[76.9, 58.3], [78.9, 58.3], [76.9, 61.7], [78.9, 61.7]].forEach(function (p2) { cyl(0.03, 0.03, 0.95, M2.rail, p2[0], 0.475, p2[1], null, 8); cyl(0.14, 0.16, 0.04, M2.rail, p2[0], 0.02, p2[1], null, 12); circles.push({ x: p2[0], z: p2[1], r: 0.14 }); });
    [58.3, 61.7].forEach(function (z) { var rp = box(2.0, 0.035, 0.035, std(0x2c5f86, 0.8), 77.9, 0.86, z); rp.userData.noCast = true; });
    // benches down the middle, a mop and its bucket
    [[84.2, 60, 0], [89.8, 60, 0]].forEach(function (b) { wb(b[0] - 0.9, b[0] + 0.9, 0.36, 0.44, b[1] - 0.24, b[1] + 0.24, M2.white, 2, 2); wb(b[0] - 0.8, b[0] + 0.8, 0, 0.36, b[1] - 0.18, b[1] + 0.18, M2.blue, 2, 2); solid(b[0] - 0.9, b[0] + 0.9, b[1] - 0.24, b[1] + 0.24, null, null, true); });
    cyl(0.16, 0.13, 0.3, std(0xc8b030, 0.7), 95.6, 0.15, 51.2, null, 12); var mop = cyl(0.014, 0.014, 1.5, M.wood, 95.9, 0.78, 50.5, null, 5); mop.rotation.set(0.5, 0, 0.12); circles.push({ x: 95.6, z: 51.2, r: 0.2 });
    label(['CAUTION', 'WET FLOOR'], 0.34, 0.5, '#e2b93b', '#17140e', 94.9, 0.33, 60.9, 0.3, 128, '#17140e').rotation.x = -0.26;
    // a map of the aquarium on the wall beside the tunnel, and the two posters the park printed
    var mp = mesh(new THREE.PlaneGeometry(1.5, 1.1), std(0xffffff, 0.6, { map: canvasTex(512, function (g, S, HH) {
      g.fillStyle = '#e4ebe8'; g.fillRect(0, 0, S, HH); g.fillStyle = '#1d4a58'; g.fillRect(0, 0, S, 60); g.fillStyle = '#e9e2d0'; g.font = 'bold 34px ' + ZOO_FONT; g.textAlign = 'center'; g.fillText('YOU ARE HERE', S / 2, 42);
      g.strokeStyle = '#1d4a58'; g.lineWidth = 4; g.strokeRect(40, 110, 130, 150); g.strokeRect(205, 90, 270, 220); g.fillStyle = '#7fb6c8'; g.fillRect(260, 120, 170, 160); g.fillStyle = '#1d4a58'; g.fillRect(170, 172, 35, 26);
      g.font = 'bold 17px ' + ZOO_FONT; g.fillText('TANK', 105, 178); g.fillText('GALLERY', 105, 200); g.fillStyle = '#12323e'; g.fillText('OCEAN HALL', 345, 110); g.font = '15px ' + ZOO_FONT; g.fillText('viewing ramps both sides', 345, 302); g.fillStyle = '#c0281e'; g.beginPath(); g.arc(150, 186, 8, 0, 7); g.fill();
      g.fillStyle = '#4a5a5e'; g.font = '14px ' + ZOO_FONT; g.fillText('STAFF ONLY BEYOND THE REAR GALLERY', S / 2, 342); streaks(g, S, HH, 14, 'rgba(100,80,40,.7)', HH); grime(g, S, HH, 1.1);
    }, 1, 1, true, 372) }), G.x2 - 0.03, 1.7, 56.6); mp.rotation.y = -PI / 2; mp.userData.noCast = true; box(0.04, 1.2, 1.6, M2.blue, G.x2 - 0.012, 1.7, 56.6);
  })();
  gather('gallery');

  // ================= the ocean hall: floors, ramps, the rear gallery, the plant behind =================
  (function () {
    var q, HHh = H.h, RX1 = T.x1, RX2 = T.x2, RW = 4.5, slope = MEZ / (RX2 - RX1), ang = Math.atan(slope), rlen = Math.hypot(RX2 - RX1, MEZ), concDS = M2.conc.clone(); concDS.side = THREE.DoubleSide;
    // the public floor west of the tank, and the walls: one mural right round
    flat(H.x1, T.x1, H.z1, H.z2, 0.0, M2.slab, 8); floor(H.x1 - 0.5, T.x1, H.z1, H.z2, 0, null, null, 'tile');
    sheet('z', H.z1 + 0.012, 1, H.x1, H.x2, 0, HHh, M2.hall, 6.25, 12.5); sheet('z', H.z2 - 0.012, -1, H.x1, H.x2, 0, HHh, M2.hall, 6.25, 12.5);
    sheet('x', H.x1 + 0.012, 1, H.z1, H.z2, 0, HHh, M2.hall, 6.25, 12.5, [[58.2, 61.8, 0, 3.0]]);
    // the roof: purlins and five trusses across it, and the dark above them
    flat(H.x1, 146.5, H.z1, H.z2, HHh, M2.dark, 4, false);
    [106, 114, 122, 130, 138].forEach(function (x) { box(0.22, 0.22, H.z2 - H.z1, EM.rustSteel, x, HHh - 0.3, 60); box(0.2, 0.2, H.z2 - H.z1, EM.rustSteel, x, HHh - 1.7, 60); for (var z = H.z1 + 1.5; z < H.z2; z += 3.1) { var d = box(0.1, 1.9, 0.1, EM.rustSteel, x, HHh - 1.0, z); d.rotation.x = ((z * 10 | 0) % 2 ? 1 : -1) * 0.75; } });
    for (q = 0; q < 6; q++) box(146.5 - H.x1, 0.14, 0.14, EM.rustSteel, (H.x1 + 146.5) / 2, HHh - 0.12, H.z1 + 2.6 + q * 5.2);
    // the two ramps: concrete wedges with the mural's blue carried up them, a lean rail a pace off the glass, a handrail on the wall
    [[H.z1, T.z1, -1], [T.z2, H.z2, 1]].forEach(function (r) {
      var z1 = r[0], z2 = r[1], cz = (z1 + z2) / 2, gz = r[2] < 0 ? z2 : z1, wz = r[2] < 0 ? z1 : z2;
      var top = mesh(new THREE.PlaneGeometry(rlen, RW), M2.slab, (RX1 + RX2) / 2, MEZ / 2 + 0.002, cz);
      top.quaternion.setFromEuler(new THREE.Euler(0, 0, ang)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0))); top.userData.noCast = true;      // laid flat, then tipped up toward the east
      var U = top.geometry.attributes.uv; for (var v = 0; v < U.count; v++) U.setXY(v, U.getX(v) * rlen / 8, U.getY(v) * RW / 8); U.needsUpdate = true;
      floor(RX1, RX2, z1, z2, 0, MEZ, 'x', 'tile');
      // the wedge's face toward the tank (seen through the glass, below the ramp)
      var sh = new THREE.Shape(); sh.moveTo(RX1, 0); sh.lineTo(RX2, 0); sh.lineTo(RX2, MEZ); sh.lineTo(RX1, 0);
      var side = mesh(new THREE.ShapeGeometry(sh), concDS, 0, 0, gz + r[2] * 0.02), SU = side.geometry.attributes.uv; for (v = 0; v < SU.count; v++) SU.setXY(v, SU.getX(v) / 4, SU.getY(v) / 4); SU.needsUpdate = true; side.userData.noCast = true;
      rail(RX1 + 0.3, gz + r[2] * 0.75, RX2, gz + r[2] * 0.75, slope * 0.3, MEZ, { step: 2 });                                             // the lean rail
      box(rlen, 0.06, 0.06, M2.rail, (RX1 + RX2) / 2, MEZ / 2 + 0.95, wz - r[2] * 0.09).rotation.z = ang;                           // the handrail on the wall
      for (var p3 = 0; p3 <= 8; p3++) { var px = RX1 + p3 * 3; box(0.04, 0.04, 0.1, M2.rail, px, slope * (px - RX1) + 0.95, wz - r[2] * 0.05); }
      for (p3 = 1; p3 < 6; p3++) { var st = box(0.5, 0.012, RW - 0.9, M.yellow, RX1 + p3 * 4, slope * p3 * 4 + 0.012, cz - r[2] * 0.3); st.rotation.z = ang; st.userData.noCast = true; }     // grip strips, mostly worn off
    });
    // the rear gallery, three metres up behind the tank
    flat(T.x2, H.x2, H.z1, H.z2, MEZ, M2.slab, 8); floor(T.x2, H.x2, H.z1, H.z2, MEZ, null, null, 'tile');
    wb(T.x2 + 0.26, T.x2 + 0.3, 0, MEZ, T.z1, T.z2, M2.conc, 4, 4);                                                                  // its face toward the tank
    rail(T.x2 + 0.75, T.z1 + 0.2, T.x2 + 0.75, T.z2 - 0.2, MEZ, MEZ, { step: 2 });
    // the wall at the back of it, with STAFF ONLY in the middle: the door itself is aquaplay.js's
    var DZ1 = 58.9, DZ2 = 59.9; sheet('x', H.x2 - 0.012, -1, H.z1, H.z2, MEZ, CW - 0.3, M2.hall, 6.25, 12.5, [[DZ1, DZ2, MEZ, MEZ + 2.1], [H.z1, 47.5, MEZ, CW - 0.3]]);
    wb(H.x2, H.x2 + 0.5, 0, CW - 0.3, 47.5, DZ1, M2.conc, 4, 4, [-0.4, CW - 0.2]); wb(H.x2, H.x2 + 0.5, 0, CW - 0.3, DZ2, H.z2, M2.conc, 4, 4, [-0.4, CW - 0.2]); wb(H.x2, H.x2 + 0.5, MEZ + 2.1, CW - 0.3, DZ1, DZ2, M2.conc, 4, 4);
    wb(H.x2, H.x2 + 0.5, 0, MEZ, DZ1, DZ2, M2.conc, 4, 4, [-0.4, MEZ - 0.1]);
    A.staffDoor = { z1: DZ1, z2: DZ2, x: H.x2, y: MEZ };
  })();
  gather('hall');

  // ================= the great tank =================
  /* Water you can believe in, without rendering the scene twice.  Everything in the tank (the sand, the rock, the animal) is
     drawn with a material that works out, for each pixel, how much water lies between the glass and it along your line of
     sight, and fogs it blue-green by that; lights it from above, dimmer with depth; and lays moving caustics on whatever
     faces up.  The surface is a sheet you can look down through from the catwalks and up at, silver, from the hall. */
  var causTex = canvasTex(256, function (g, S) {              // a tile of caustic light: bright where the cells of a wrapped Voronoi pattern meet
    var img = g.createImageData(S, S), d = img.data, pts = [], n = 26, x, y, q;
    for (q = 0; q < n; q++) pts.push([Math.random() * S, Math.random() * S]);
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var d1 = 1e9, d2 = 1e9;
      var wx = x + 9 * Math.sin(y / S * 6.283 * 3 + 1.3) + 5 * Math.sin(y / S * 6.283 * 7 + x / S * 6.283 * 2), wy = y + 9 * Math.sin(x / S * 6.283 * 2 + 0.7) + 5 * Math.sin(x / S * 6.283 * 6 + 2.1); wx = ((wx % S) + S) % S; wy = ((wy % S) + S) % S;      // bend the cells: light through moving water is never straight
      for (q = 0; q < n; q++) { var dx = Math.abs(wx - pts[q][0]), dy = Math.abs(wy - pts[q][1]); if (dx > S / 2) dx = S - dx; if (dy > S / 2) dy = S - dy; var dd = Math.sqrt(dx * dx + dy * dy); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
      var e = clamp(1 - (d2 - d1) / 16, 0, 1), v = Math.pow(e, 2.0) * 200 + 14, o = (y * S + x) * 4; d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.6; g.filter = 'blur(3px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; g.globalAlpha = 1;                 // soften the web
  }, 1, 1, false);
  A.causTex = causTex;
  var WU = A.wu = { uTime: { value: 0 }, uSurf: { value: T.water }, uBoxMin: { value: new THREE.Vector3(T.x1, T.floor - 1, T.z1) }, uBoxMax: { value: new THREE.Vector3(T.x2, T.water, T.z2) },
    uWater: { value: new THREE.Color(0x0e4a54) }, uLight: { value: new THREE.Color(0.55, 0.78, 0.8) }, uDens: { value: 0.05 }, uCaus: { value: causTex } };
  var WDECL = 'varying vec3 vWPos; uniform float uTime; uniform float uSurf; uniform vec3 uBoxMin; uniform vec3 uBoxMax; uniform vec3 uWater; uniform vec3 uLight; uniform float uDens; uniform sampler2D uCaus;';
  var WFRAG = [
    '{ float sub = smoothstep(uSurf + 0.05, uSurf - 0.3, vWPos.y);',
    '  if (sub > 0.0) {',
    '    vec3 ro = cameraPosition, rd = vWPos - ro; float L = length(rd); rd /= max(L, 1e-4);',
    '    vec3 iv = 1.0 / (rd + vec3(1e-5)), t0 = (uBoxMin - ro) * iv, t1 = (uBoxMax - ro) * iv, tn = min(t0, t1); float tN = max(max(max(tn.x, tn.y), tn.z), 0.0);',
    '    float dw = max(L - tN, 0.0), depth = max(uSurf - vWPos.y, 0.0), sun = exp(-depth * 0.17);',
    '    vec3 nW = inverseTransformDirection(normalize(vNormal), viewMatrix); float up = clamp(nW.y * 0.55 + 0.45, 0.0, 1.0);',
    '    vec2 cuv = vWPos.xz * 0.12; float caus = min(texture2D(uCaus, cuv + uTime * vec2(0.021, 0.013)).r, texture2D(uCaus, cuv * 1.37 - uTime * vec2(0.017, -0.019)).r);',
    '    vec3 lit = diffuseColor.rgb * uLight * (0.26 + 0.74 * up) * sun * (0.75 + caus * 2.4 * up * sun);',
    '    vec3 col = gl_FragColor.rgb * 0.7 + lit; float f = 1.0 - exp(-dw * uDens);',
    '    col = mix(col, uWater * uLight * (0.25 + 0.75 * sun), f);',
    '    gl_FragColor.rgb = mix(gl_FragColor.rgb, col, sub);',
    '  } }'].join('\n');
  A.wet = function (m) {
    m.fog = false;
    m.onBeforeCompile = function (sh) {
      for (var u in WU) sh.uniforms[u] = WU[u];
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + WDECL).replace('#include <fog_fragment>', WFRAG);
    };
    m.customProgramCacheKey = function () { return 'aqwet'; };
    return m;
  };
  /* Her skin: slate blue over the back with darker saddles and a scatter of pale freckles, cream underneath. */
  seaSkin.map = canvasTex(512, function (g, S) {
    speckle('#3f6474', ['#2c4a58', '#527c8a', '#365866', '#466e7c'], 16000, 1.6)(g, S);
    var gr = g.createLinearGradient(0, 0, S, 0); gr.addColorStop(0.0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, 'rgba(14,30,40,.75)'); gr.addColorStop(0.47, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);                    // the dark back
    gr = g.createLinearGradient(0, 0, S, 0); gr.addColorStop(0.53, 'rgba(0,0,0,0)'); gr.addColorStop(0.66, 'rgba(226,228,208,.92)'); gr.addColorStop(0.84, 'rgba(226,228,208,.92)'); gr.addColorStop(0.97, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);      // the pale belly
    for (var b2 = 0; b2 < 11; b2++) { var y = (b2 + 0.5) / 11 * S + (Math.random() - 0.5) * 14, h2 = 12 + Math.random() * 16; g.fillStyle = 'rgba(12,26,34,.55)'; g.beginPath(); g.moveTo(20, y); g.quadraticCurveTo(S * 0.25, y - h2, S * 0.48, y + (Math.random() - 0.5) * 16); g.quadraticCurveTo(S * 0.25, y + h2, 20, y); g.fill(); }
    for (b2 = 0; b2 < 380; b2++) { g.fillStyle = 'rgba(196,214,210,' + (0.2 + Math.random() * 0.35) + ')'; g.beginPath(); g.arc(Math.random() * S * 0.55, Math.random() * S, 1 + Math.random() * 2.6, 0, 7); g.fill(); }
    blotch(g, S, ['rgba(10,22,28,.6)', 'rgba(90,130,140,.4)'], 40, 8, 40, 0.3);
    g.strokeStyle = 'rgba(190,200,190,.3)'; g.lineWidth = 1.2; for (b2 = 0; b2 < 14; b2++) { var sx = Math.random() * S * 0.5, sy = Math.random() * S; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 20 + Math.random() * 50, sy + (Math.random() - 0.5) * 30); g.stroke(); }       // old scars
  }, 1, 1);
  A.wet(seaSkin); seaSkin.roughness = 0.3; seaSkin.needsUpdate = true;                 // (her skin is lit by the tank; her mouth by your torch)
  (function () {
    var q, TW = T.x2 - T.x1, TD = T.z2 - T.z1, cx = (T.x1 + T.x2) / 2, cz = (T.z1 + T.z2) / 2, GY1 = T.glass, GY2 = T.rim, GHh = GY2 - GY1;
    var wetConc = A.wet(std(0xffffff, 0.9, { map: concTex.clone(), bumpMap: bump(3), bumpScale: 0.03 })); wetConc.map.needsUpdate = true;
    var wetSand = A.wet(std(0xffffff, 1, { map: canvasTex(256, function (g, S) { speckle('#b7a983', ['#a09270', '#c8ba92', '#8c7f60', '#d6c9a2'], 9000, 1.5)(g, S); blotch(g, S, ['#6a7a5a', '#8a8462', '#5c6a52'], 26, 10, 50, 0.4); for (var y = 0; y < S; y += 9) { g.strokeStyle = 'rgba(80,72,50,.3)'; g.lineWidth = 2; g.beginPath(); for (var x = 0; x <= S; x += 8) g.lineTo(x, y + Math.sin(x / 20 + y) * 2.5); g.stroke(); } }, 6, 5.5), bumpMap: bump(12), bumpScale: 0.04 }));
    var wetRock = A.wet(std(0x7c8478, 1, { bumpMap: bump(3), bumpScale: 0.2, map: canvasTex(128, function (g, S) { speckle('#6f776c', ['#5a6258', '#858d80', '#4a5248', '#3e5a48'], 3000, 2.5)(g, S); blotch(g, S, ['#2e4a38', '#3a5a40', '#22342a'], 22, 8, 36, 0.6); }, 2) }));
    var wetSteel = A.wet(std(0x6f6a5c, 0.8, { metalness: 0.3, map: rustTex })), wetBone = A.wet(std(0xb9b39c, 0.8, { bumpMap: bump(2), bumpScale: 0.02 }));
    A.wetMats = { conc: wetConc, sand: wetSand, rock: wetRock, steel: wetSteel, bone: wetBone };
    // the sand: dunes, deeper toward the east where the basement's windows look in
    var sg = new THREE.PlaneGeometry(TW - 0.5, TD - 0.5, 36, 33), SP = sg.attributes.position;
    for (q = 0; q < SP.count; q++) { var sx = SP.getX(q), sy = SP.getY(q), edge = Math.min(TW / 2 - Math.abs(sx), TD / 2 - Math.abs(sy)); SP.setZ(q, (Math.sin(sx * 0.55 + sy * 0.3) * 0.2 + Math.sin(sx * 0.21 - sy * 0.47) * 0.32 + Math.sin(sx * 1.3) * Math.sin(sy * 1.1) * 0.08 + 0.42) * clamp(edge / 2.2, 0, 1) - clamp((sx - 7) / 5, 0, 1) * 0.25); }
    sg.computeVertexNormals(); var sand = mesh(sg, wetSand, cx, T.floor, cz); sand.rotation.x = -PI / 2; sand.userData.noCast = true;
    // its walls below the glass (the east one has the two observation ports)
    sheet('x', T.x1 + 0.25, 1, T.z1, T.z2, T.floor - 0.3, GY1, wetConc, 4, 4); sheet('z', T.z1 + 0.25, 1, T.x1, T.x2, T.floor - 0.3, GY1, wetConc, 4, 4); sheet('z', T.z2 - 0.25, -1, T.x1, T.x2, T.floor - 0.3, GY1, wetConc, 4, 4);
    A.ports = [[54.2, 55.8], [65.2, 66.8]]; A.portY = [-2.5, -1.0];
    sheet('x', T.x2 - 0.25, -1, T.z1, T.z2, T.floor - 0.3, GY1, wetConc, 4, 4, A.ports.map(function (p) { return [p[0], p[1], A.portY[0], A.portY[1]]; }));
    A.ports.forEach(function (p) { [[p[0], 1], [p[1], -1]].forEach(function (e) { sheet('z', e[0], e[1], T.x2 - 0.25, T.x2 + 0.5, A.portY[0], A.portY[1], wetConc, 4, 4); }); [A.portY[0], A.portY[1]].forEach(function (y, n) { var fm = mesh(new THREE.PlaneGeometry(0.75, p[1] - p[0]), wetConc, T.x2 + 0.125, y, (p[0] + p[1]) / 2); fm.rotation.x = n ? PI / 2 : -PI / 2; fm.userData.noCast = true; }); });
    // rock, the wreck of a feeding cage, what she has left of twelve years of meals
    var rockG = jitter(new THREE.IcosahedronGeometry(1, 2), 0.28);
    [[113.5, 52.5, 2.2, 1.6], [115, 54.4, 1.3, 1.0], [130.5, 67, 2.6, 2.1], [128.6, 68.8, 1.5, 1.2], [131.5, 52, 1.9, 2.6], [112.6, 68.4, 1.8, 1.3], [121, 50.6, 1.4, 0.9], [123.5, 69.6, 1.6, 1.1], [118, 61, 0.9, 0.5], [126.5, 57.5, 1.1, 0.6]].forEach(function (r, n) {
      var rm = mesh(rockG, wetRock, r[0], T.floor + r[3] * 0.45, r[1]); rm.scale.set(r[2], r[3], r[2] * (0.8 + (n % 3) * 0.2)); rm.rotation.set(n * 0.7, n * 1.9, n * 0.4);
    });
    var cage = new THREE.Group(); cage.position.set(125.5, T.floor + 0.55, 63.5); cage.rotation.set(0.35, 0.6, 1.2); scene.add(cage);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { box(0.06, 2.0, 0.06, wetSteel, c[0] * 0.7, 0, c[1] * 0.7, cage); box(0.06, 0.06, 1.46, wetSteel, c[0] * 0.7, c[1], 0, cage); box(1.46, 0.06, 0.06, wetSteel, 0, c[0], c[1] * 0.7, cage); });
    for (q = 0; q < 5; q++) { box(0.03, 2.0, 0.03, wetSteel, -0.7 + q * 0.35, 0, 0.7, cage); box(0.03, 2.0, 0.03, wetSteel, 0.7, 0, -0.7 + q * 0.35, cage); }
    for (q = 0; q < 7; q++) { var rb = mesh(new THREE.TorusGeometry(0.75 - Math.abs(q - 3) * 0.07, 0.045, 5, 12, PI), wetBone, 117.4 + q * 0.34, T.floor + 0.3, 65.8); rb.rotation.set(0.2, PI / 2, 0); }      // a ribcage, half in the sand
    mesh(sphGeo, wetBone, 116.6, T.floor + 0.42, 65.9).scale.set(0.7, 0.5, 0.5); box(1.5, 0.09, 0.09, wetBone, 120.6, T.floor + 0.32, 66.3).rotation.y = 0.3;
    [[121.8, 55.2], [129, 61], [114.5, 62.3], [124, 66.5]].forEach(function (b, n) { cyl(0.05, 0.05, 0.9 + n * 0.2, wetBone, b[0], T.floor + 0.34, b[1], null, 6).rotation.set(1.5, n * 1.3, 0.2); });
    // weed: ribbons of it rooted in the rock, alive with slime
    var weedTex = canvasTex(128, function (g, S, HH2) { g.clearRect(0, 0, S, HH2); for (var w = 0; w < 9; w++) { var x = 10 + w * 13 + Math.random() * 6; g.strokeStyle = ['#3d6a34', '#2f5a2c', '#4a7a3a', '#28502a'][w % 4]; g.lineWidth = 5 + Math.random() * 5; g.beginPath(); g.moveTo(x, HH2); g.bezierCurveTo(x + 18, HH2 * 0.7, x - 18, HH2 * 0.35, x + (Math.random() - 0.5) * 20, 6 + Math.random() * 60); g.stroke(); } }, 1, 1, true, 512);
    var weed = A.wet(std(0xffffff, 0.8, { map: weedTex, alphaTest: 0.45, side: THREE.DoubleSide })), weedG = crossCard(1.5, 3.2);
    [[113.2, 53.6], [114.6, 51.8], [130, 66.2], [131.6, 68.2], [131, 53.4], [132, 50.6], [112.4, 67.4], [113.8, 69.4], [121.4, 50.4], [124, 70], [128, 69.6], [116.2, 53]].forEach(function (w2, n) { var wm = mesh(weedG, weed, w2[0], T.floor + 0.3, w2[1]); wm.rotation.y = n * 1.1; wm.scale.setScalar(0.8 + (n % 4) * 0.25); wm.userData.noCast = true; });
    // the kerb the glass stands on, the steel that holds it, and the glass
    wb(T.x1 - 0.3, T.x1 + 0.25, 0, GY1, T.z1 - 0.3, T.z2 + 0.3, M2.conc, 4, 4); box(0.62, 0.06, TD + 0.7, M2.steel, T.x1 - 0.03, GY1 + 0.03, cz);
    var glassTex = canvasTex(1024, function (g, S, HH2) {      // 8 m of glass, 4.5 m high: film, algae from the top and the bottom, a crust at the waterline, scratches, hands
      g.clearRect(0, 0, S, HH2); g.fillStyle = 'rgba(150,205,214,.085)'; g.fillRect(0, 0, S, HH2);
      var wl = HH2 * (1 - (T.water - GY1) / GHh), n2, x, y;
      g.fillStyle = 'rgba(200,214,208,.07)'; g.fillRect(0, 0, S, wl);                                                             // dry glass above the water: dusty
      for (n2 = 0; n2 < 60; n2++) { x = Math.random() * S; var l = 20 + Math.random() * (wl - 30); var gr = g.createLinearGradient(0, wl - l, 0, wl); gr.addColorStop(0, 'rgba(210,220,210,0)'); gr.addColorStop(1, 'rgba(210,220,210,.22)'); g.fillStyle = gr; g.fillRect(x, wl - l, 2 + Math.random() * 5, l); }      // old splash runs
      function film(n3, yFn, rMin, rMax, aMax) { for (n2 = 0; n2 < n3; n2++) { x = Math.random() * S; y = yFn(); var r = rMin + Math.random() * (rMax - rMin), gr2 = g.createRadialGradient(x, y, 0, x, y, r), cc = (34 + Math.random() * 36 | 0) + ',' + (74 + Math.random() * 44 | 0) + ',' + (38 + Math.random() * 26 | 0); gr2.addColorStop(0, 'rgba(' + cc + ',' + (aMax * (0.4 + Math.random() * 0.6)).toFixed(3) + ')'); gr2.addColorStop(1, 'rgba(' + cc + ',0)'); g.fillStyle = gr2; g.fillRect(x - r, y - r, r * 2, r * 2); } }
      film(420, function () { return wl + Math.pow(Math.random(), 2.6) * (HH2 - wl) * 0.5; }, 8, 46, 0.2);                       // algae hanging down from the light
      film(380, function () { return HH2 - Math.pow(Math.random(), 2.4) * HH2 * 0.26; }, 8, 50, 0.22);                            // and climbing from the sand
      [0, S].forEach(function (ex) { for (n2 = 0; n2 < 150; n2++) { x = ex + (Math.random() - 0.5) * 2 * Math.pow(Math.random(), 2) * 130; y = wl + Math.random() * (HH2 - wl); var r = 8 + Math.random() * 30, gr3 = g.createRadialGradient(x, y, 0, x, y, r); gr3.addColorStop(0, 'rgba(40,88,46,.3)'); gr3.addColorStop(1, 'rgba(40,88,46,0)'); g.fillStyle = gr3; g.fillRect(x - r, y - r, r * 2, r * 2); } });       // thick behind every mullion
      for (n2 = 0; n2 < 1600; n2++) { x = Math.random() * S; y = wl + Math.pow(Math.random(), 1.6) * (HH2 - wl); g.fillStyle = 'rgba(' + (30 + Math.random() * 30 | 0) + ',' + (64 + Math.random() * 40 | 0) + ',36,' + (0.1 + Math.random() * 0.22) + ')'; g.fillRect(x, y, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); }      // specks
      for (n2 = 0; n2 < 18; n2++) { x = Math.random() * S; y = wl + Math.random() * (HH2 - wl) * 0.8; g.strokeStyle = 'rgba(44,92,50,.22)'; g.lineWidth = 5 + Math.random() * 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y + 40, x - 14, y + 80, x + (Math.random() - 0.5) * 30, y + 90 + Math.random() * 120); g.stroke(); }
      var cg = g.createLinearGradient(0, wl - 7, 0, wl + 16); cg.addColorStop(0, 'rgba(226,232,214,0)'); cg.addColorStop(0.3, 'rgba(220,226,210,.5)'); cg.addColorStop(0.5, 'rgba(110,134,104,.42)'); cg.addColorStop(1, 'rgba(60,96,60,0)'); g.fillStyle = cg; g.fillRect(0, wl - 7, S, 23);      // the waterline: a pale crust, green under it
      g.strokeStyle = 'rgba(235,245,245,.22)'; g.lineWidth = 1; for (n2 = 0; n2 < 90; n2++) { x = Math.random() * S; y = Math.random() * HH2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 90, y + (Math.random() - 0.5) * 26); g.stroke(); }
      [[210, 0.74], [236, 0.75], [620, 0.7], [820, 0.79], [846, 0.78]].forEach(function (h) { g.fillStyle = 'rgba(225,235,235,.1)'; var hy = HH2 * h[1]; g.beginPath(); g.ellipse(h[0], hy, 5.5, 6.5, 0, 0, 7); g.fill(); for (var f = 0; f < 4; f++) { g.beginPath(); g.ellipse(h[0] - 5 + f * 3.4, hy - 10 - (f === 1 || f === 2 ? 2 : 0), 1.5, 4, (f - 1.5) * 0.12, 0, 7); g.fill(); } });      // small hands, at a child's height
    }, 1, 1, true, 576);
    function glassMat(rep) { var t = glassTex.clone(); t.needsUpdate = true; t.repeat.set(rep, 1); return new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.06, metalness: 0.0, envMap: envTex, envMapIntensity: 0.9, side: THREE.DoubleSide }); }
    A.glass = [];
    [['x', T.x1, TD, cz], ['x', T.x2, TD, cz], ['z', T.z1, TW, cx], ['z', T.z2, TW, cx]].forEach(function (w, n) {
      var gm = mesh(new THREE.PlaneGeometry(w[2], GHh), glassMat(w[2] / 8), w[0] === 'x' ? w[1] : w[3], (GY1 + GY2) / 2, w[0] === 'x' ? w[3] : w[1]); if (w[0] === 'x') gm.rotation.y = PI / 2;
      gm.renderOrder = 5; gm.userData.noCast = true; A.glass.push(gm);
      var a1 = w[0] === 'x' ? T.z1 : T.x1, len = w[2], out = n === 0 ? -1 : n === 1 ? 1 : n === 2 ? -1 : 1;
      for (var p2 = 0; p2 <= len + 0.01; p2 += 4) {                                                                                    // mullions on the dry side
        var mx = w[0] === 'x' ? w[1] + out * 0.11 : a1 + p2, mz = w[0] === 'x' ? a1 + p2 : w[1] + out * 0.11;
        box(w[0] === 'x' ? 0.2 : 0.16, GHh + 0.3, w[0] === 'x' ? 0.16 : 0.2, M2.steel, mx, (GY1 + GY2) / 2 + 0.1, mz);
      }
      box(w[0] === 'x' ? 0.3 : len + 0.3, 0.28, w[0] === 'x' ? len + 0.3 : 0.3, M2.steel, w[0] === 'x' ? w[1] : w[3], GY2 + 0.14, w[0] === 'x' ? w[3] : w[1]);      // the rim
      solid(w[0] === 'x' ? w[1] - 0.25 : T.x1, w[0] === 'x' ? w[1] + 0.25 : T.x2, w[0] === 'x' ? T.z1 : w[1] - 0.25, w[0] === 'x' ? T.z2 : w[1] + 0.25, T.floor - 0.5, GY2 + 0.5, true);
    });
    // the water's surface, from above and from below; shafts of light; things adrift in it
    var ripN = normalTex(256, function (g, S) { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); for (var r = 0; r < 260; r++) { var x = Math.random() * S, y = Math.random() * S, rr = 6 + Math.random() * 22, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(' + (Math.random() < 0.5 ? '230,230,230' : '30,30,30') + ',.5)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }, 2.4, 6, 5.5);
    A.surfMat = new THREE.MeshStandardMaterial({ color: 0x0c3a44, roughness: 0.07, metalness: 0.35, transparent: true, opacity: 0.72, depthWrite: false, normalMap: ripN, normalScale: new THREE.Vector2(0.5, 0.5), envMap: envTex, envMapIntensity: 1.3 });
    var surf = mesh(new THREE.PlaneGeometry(TW - 0.3, TD - 0.3), A.surfMat, cx, T.water, cz); surf.rotation.x = -PI / 2; surf.renderOrder = 3; surf.userData.noCast = true;
    var ct = causTex.clone(); ct.needsUpdate = true; ct.repeat.set(9, 8.2);
    A.underMat = new THREE.MeshBasicMaterial({ color: 0x5a9ca8, map: ct, transparent: true, opacity: 0.2, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
    var under = mesh(new THREE.PlaneGeometry(TW - 0.3, TD - 0.3), A.underMat, cx, T.water - 0.012, cz); under.rotation.x = PI / 2; under.renderOrder = 2; under.userData.noCast = true;
    var shaftTex = canvasTex(64, function (g, S, HH2) { var gr = g.createLinearGradient(0, 0, 0, HH2); gr.addColorStop(0, 'rgba(190,240,236,.5)'); gr.addColorStop(1, 'rgba(120,200,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, HH2); var gx = g.createLinearGradient(0, 0, S, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, S, HH2); g.globalCompositeOperation = 'source-over'; }, 1, 1, true, 256);
    A.shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.2, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    A.shafts = [];
    [[114.5, 54], [119, 64.5], [124.5, 57], [129.5, 66], [121.5, 60.5], [130.5, 53.5], [115.5, 67.5]].forEach(function (p2, n) { var sh = dyn(mesh(new THREE.PlaneGeometry(2.2 + (n % 3) * 0.8, 6.6), A.shaftMat, p2[0], T.water - 3.3, p2[1])); sh.rotation.y = n * 0.9; sh.renderOrder = 2; sh.userData.noCast = true; sh.userData.keep = true; A.shafts.push(sh); });
    var sn = [], NS = 320; for (q = 0; q < NS; q++) sn.push(T.x1 + 0.6 + Math.random() * (TW - 1.2), T.floor + 0.4 + Math.random() * (T.water - T.floor - 0.6), T.z1 + 0.6 + Math.random() * (TD - 1.2));
    var sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sn, 3));
    A.snow = dyn(new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xa8d4d0, size: 0.03, transparent: true, opacity: 0.22, depthWrite: false, fog: false }))); A.snow.frustumCulled = false; A.snow.renderOrder = 2; scene.add(A.snow);
    // the caustics the tank throws out through its front glass onto the hall floor
    var fc = causTex.clone(); fc.needsUpdate = true; fc.repeat.set(3.2, 5.5);
    A.floorCaus = new THREE.MeshBasicMaterial({ color: 0x3f8f9a, map: fc, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, alphaMap: canvasTex(64, function (g, S) { var gr = g.createLinearGradient(0, 0, S, 0); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }, 1, 1, false) });
    var fcm = mesh(new THREE.PlaneGeometry(8, TD), A.floorCaus, T.x1 - 4.3, 0.02, cz); fcm.rotation.x = -PI / 2; fcm.renderOrder = 1; fcm.userData.noCast = true;
    // where you can be in it: afloat
    floor(T.x1 + 0.25, T.x2 - 0.25, T.z1 + 0.25, T.z2 - 0.25, T.swim, null, null, 'water');
    light('tank', 0x58c6d2, T.x1 - 3.5, 2.6, cz, 26, 1.1); light('tankN', 0x4ab4c4, cx, 2.8, T.z1 - 2.2, 20, 1.2); light('tankS', 0x4ab4c4, cx, 2.8, T.z2 + 2.2, 20, 1.2); light('tankE', 0x4ab4c4, T.x2 + 2.6, 5.2, cz, 18, 1.2);
  })();
  gather('hall');

  // ================= the tanks in the gallery =================
  /* Many small pieces of glass and water.  The see-through parts of every tank (glass, the tint of the water, its surface, the
     film of algae inside the front pane, the light playing on the gravel) are gathered and baked into one mesh per kind, so
     the whole room of them costs five draws. */
  function bake(list, mat, order) {
    var pos = [], nor = [], uv = [], idx = [], vo = 0, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    list.forEach(function (m) {
      m.updateMatrixWorld(true); nm.getNormalMatrix(m.matrixWorld); var g = m.geometry, P2 = g.attributes.position, N2 = g.attributes.normal, U2 = g.attributes.uv, q;
      for (q = 0; q < P2.count; q++) { v.fromBufferAttribute(P2, q).applyMatrix4(m.matrixWorld); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N2, q).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); uv.push(U2.getX(q), U2.getY(q)); }
      if (g.index) for (q = 0; q < g.index.count; q++) idx.push(vo + g.index.getX(q)); else for (q = 0; q < P2.count; q++) idx.push(vo + q);
      vo += P2.count; if (m.parent) m.parent.remove(m);
    });
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx);
    var out = new THREE.Mesh(bg, mat); out.renderOrder = order || 0; out.userData.noCast = true; scene.add(out); return out;
  }
  A.bake = bake;
  (function () {
    var q, L = { glass: [], tint: [], surf: [], algae: [], caus: [] };
    var tGlass = new THREE.MeshStandardMaterial({ color: 0xbfe6ee, transparent: true, opacity: 0.1, roughness: 0.04, metalness: 0, depthWrite: false, envMap: envTex, envMapIntensity: 1.1, side: THREE.DoubleSide });
    var tTint = new THREE.MeshBasicMaterial({ color: 0x1c7682, transparent: true, opacity: 0.3, depthWrite: false });
    A.tSurf = new THREE.MeshStandardMaterial({ color: 0x8fd0d6, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.4, depthWrite: false, envMap: envTex, envMapIntensity: 1.4, side: THREE.DoubleSide, normalMap: normalTex(128, function (g, S) { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); for (var r = 0; r < 90; r++) { var x = Math.random() * S, y = Math.random() * S, rr = 5 + Math.random() * 16, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(' + (Math.random() < 0.5 ? '225,225,225' : '30,30,30') + ',.5)'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }, 2, 2), normalScale: new THREE.Vector2(0.4, 0.4) });
    var algTex = canvasTex(512, function (g, S, HH2) {          // the inside of a pane: green from the corners in, a scum line where the water stood, runs below it
      g.clearRect(0, 0, S, HH2); var n2, x, y;
      for (n2 = 0; n2 < 900; n2++) { var e = Math.random(), ex = Math.pow(Math.random(), 2.2); if (e < 0.3) { x = Math.random() * S; y = HH2 - ex * HH2 * 0.5; } else if (e < 0.55) { x = ex * S * 0.3; y = Math.random() * HH2; } else if (e < 0.8) { x = S - ex * S * 0.3; y = Math.random() * HH2; } else { x = Math.random() * S; y = ex * HH2 * 0.3; }
        var r = 5 + Math.random() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r), c = (36 + Math.random() * 40 | 0) + ',' + (84 + Math.random() * 50 | 0) + ',' + (40 + Math.random() * 30 | 0); gr.addColorStop(0, 'rgba(' + c + ',' + (0.18 + Math.random() * 0.3).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (n2 = 0; n2 < 2600; n2++) { g.fillStyle = 'rgba(' + (30 + Math.random() * 30 | 0) + ',' + (70 + Math.random() * 40 | 0) + ',36,' + (0.12 + Math.random() * 0.25) + ')'; g.fillRect(Math.random() * S, Math.random() * HH2, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      g.fillStyle = 'rgba(214,222,206,.4)'; g.fillRect(0, HH2 * 0.1, S, 3); g.fillStyle = 'rgba(90,120,84,.4)'; g.fillRect(0, HH2 * 0.1 + 3, S, 5);
      for (n2 = 0; n2 < 40; n2++) { x = Math.random() * S; var l = 20 + Math.random() * 110, gr2 = g.createLinearGradient(0, HH2 * 0.1, 0, HH2 * 0.1 + l); gr2.addColorStop(0, 'rgba(200,210,196,.3)'); gr2.addColorStop(1, 'rgba(200,210,196,0)'); g.fillStyle = gr2; g.fillRect(x, HH2 * 0.1, 2 + Math.random() * 4, l); }
      g.strokeStyle = 'rgba(235,245,245,.2)'; g.lineWidth = 1; for (n2 = 0; n2 < 40; n2++) { x = Math.random() * S; y = Math.random() * HH2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 22); g.stroke(); }
    }, 1, 1, true, 256);
    var tAlgae = new THREE.MeshStandardMaterial({ map: algTex, transparent: true, depthWrite: false, roughness: 0.9, side: THREE.DoubleSide });
    var cs = causTex.clone(); cs.needsUpdate = true; A.tCausTex = cs;
    var tCaus = new THREE.MeshBasicMaterial({ color: 0x5fb0b8, map: cs, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    var backTex = canvasTex(256, function (g, S) { var gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#2f8ea6'); gr.addColorStop(0.6, '#145a72'); gr.addColorStop(1, '#0a3442'); g.fillStyle = gr; g.fillRect(0, 0, S, S); g.fillStyle = 'rgba(10,40,50,.5)'; for (var r = 0; r < 7; r++) { g.beginPath(); g.ellipse(Math.random() * S, S - Math.random() * 40, 30 + Math.random() * 50, 20 + Math.random() * 50, 0, 0, 7); g.fill(); } blotch(g, S, ['rgba(40,90,50,.5)', 'rgba(8,30,38,.6)'], 20, 10, 50, 0.5); streaks(g, S, S, 18, 'rgba(180,200,190,.4)', S * 0.6); });
    var tBack = std(0xffffff, 0.9, { map: backTex }), tGravel = std(0xffffff, 1, { map: canvasTex(128, speckle('#b9ac8c', ['#a39676', '#cdbf9c', '#8a7e62', '#e0d6b8', '#6e7a66'], 2600, 2.2), 2), bumpMap: bump(6), bumpScale: 0.05 });
    var tRock = std(0x7d8278, 1, { bumpMap: bump(3), bumpScale: 0.15 }), tCoral = std(0xd9d4c2, 0.9, { bumpMap: bump(4), bumpScale: 0.04 }), tDry = std(0x6f6a50, 1, { bumpMap: bump(4), bumpScale: 0.06 }), rockG2 = jitter(new THREE.IcosahedronGeometry(1, 1), 0.3);
    var tubeOn = basic(0xbfe8f0, { fog: false }), tubeOff = basic(0x1a1c1c, { fog: false }); A.tankTube = tubeOn;
    var shardTex = canvasTex(256, function (g, S, HH2) { g.clearRect(0, 0, S, HH2); g.fillStyle = 'rgba(190,225,232,.5)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, 0); g.lineTo(S, HH2); g.lineTo(0, HH2); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); var pts = 26; for (var a = 0; a < pts; a++) { var an = a / pts * 6.283, rr = (0.3 + Math.random() * 0.2 + (a % 3 === 0 ? 0.16 : 0)); g.lineTo(S / 2 + Math.cos(an) * S * rr * 0.92, HH2 / 2 + Math.sin(an) * HH2 * rr * 0.98); } g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(240,250,250,.8)'; g.lineWidth = 1; for (a = 0; a < 18; a++) { an = a / 18 * 6.283; g.beginPath(); g.moveTo(S / 2 + Math.cos(an) * S * 0.3, HH2 / 2 + Math.sin(an) * HH2 * 0.3); g.lineTo(S / 2 + Math.cos(an + 0.1) * S * 0.6, HH2 / 2 + Math.sin(an + 0.1) * HH2 * 0.6); g.stroke(); } }, 1, 1, true, 128);
    var tShard = new THREE.MeshStandardMaterial({ map: shardTex, alphaTest: 0.3, roughness: 0.05, envMap: envTex, envMapIntensity: 1.2, side: THREE.DoubleSide, color: 0xdff2f4 });
    var stain = new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true, depthWrite: false, map: canvasTex(128, function (g, S) { g.clearRect(0, 0, S, S); for (var r = 0; r < 14; r++) { var x = S / 2 + (Math.random() - 0.5) * S * 0.4, y = S / 2 + (Math.random() - 0.5) * S * 0.4, rr = S * (0.14 + Math.random() * 0.2), gr = g.createRadialGradient(x, y, rr * 0.4, x, y, rr); gr.addColorStop(0, 'rgba(70,74,50,.5)'); gr.addColorStop(0.85, 'rgba(96,90,54,.5)'); gr.addColorStop(1, 'rgba(96,90,54,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }) });
    function plaque(name, lines, x, y, z, rot, w) { var m = mesh(new THREE.PlaneGeometry(w || 1.3, (w || 1.3) * 0.36), std(0xffffff, 0.6, { map: canvasTex(384, function (g, S, HH2) { g.fillStyle = '#12303c'; g.fillRect(0, 0, S, HH2); g.fillStyle = '#7fd6e8'; g.fillRect(0, 0, 8, HH2); g.fillStyle = '#e9e2d0'; g.font = 'bold 34px ' + ZOO_FONT; g.textBaseline = 'middle'; g.fillText(name, 22, 34, S - 40); g.fillStyle = '#a9c8d0'; g.font = '19px ' + ZOO_FONT; lines.forEach(function (l, n) { g.fillText(l, 22, 74 + n * 26, S - 40); }); streaks(g, S, HH2, 8, 'rgba(90,70,36,.7)', HH2); grime(g, S, HH2, 0.9); }, 1, 1, true, 138) }), x, y, z); m.rotation.y = rot; m.userData.noCast = true; return m; }
    /* One tank.  (x, z) the middle of its footprint, w along the wall, d deep, on a cabinet `base` high with `h` of glass;
       rot turns it (0: front faces +z).  state: full, low, dry, broken. */
    function tank(x, z, w, d, base, h, rot, state, name, lines) {
      var Gp = new THREE.Group(); Gp.position.set(x, 0, z); Gp.rotation.y = rot; scene.add(Gp);
      var lvl = state === 'full' ? 0.88 : state === 'low' ? 0.42 : 0, wet = lvl > 0, y0 = base + 0.04;
      box(w, base, d, M2.blue, 0, base / 2, 0, Gp); box(w + 0.06, 0.05, d + 0.06, M2.white, 0, base + 0.015, 0, Gp); box(w + 0.02, 0.1, d + 0.02, M2.dark, 0, 0.05, 0.01, Gp);
      box(w + 0.08, 0.16, d + 0.08, M2.blue, 0, y0 + h + 0.08, 0, Gp);                                                                     // the hood
      box(w - 0.3, 0.03, 0.06, state === 'full' ? tubeOn : tubeOff, 0, y0 + h - 0.015, -d / 2 + 0.25, Gp).userData.keep = state === 'full';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { box(0.035, h, 0.035, M2.white, c[0] * (w / 2 - 0.017), y0 + h / 2, c[1] * (d / 2 - 0.017), Gp); });
      var bk = mesh(new THREE.PlaneGeometry(w - 0.04, h), tBack, 0, y0 + h / 2, -d / 2 + 0.02, Gp); bk.userData.noCast = true;
      box(w - 0.05, 0.08, d - 0.05, wet ? tGravel : tDry, 0, y0 + 0.04, 0, Gp);
      for (var r = 0; r < 4; r++) { var rk = mesh(rockG2, tRock, (srand() - 0.5) * (w - 0.6), y0 + 0.14, (srand() - 0.5) * (d - 0.5), Gp), rs = 0.1 + srand() * 0.16; rk.scale.set(rs * 1.4, rs, rs * 1.1); rk.rotation.y = srand() * 6; }
      for (r = 0; r < 3; r++) { var cxp = (srand() - 0.5) * (w - 0.7), czp = (srand() - 0.3) * (d - 0.6) * 0.6; for (var b2 = 0; b2 < 5; b2++) { var br = cyl(0.008, 0.02, 0.2 + srand() * 0.24, tCoral, cxp + (srand() - 0.5) * 0.14, y0 + 0.18 + srand() * 0.1, czp + (srand() - 0.5) * 0.1, Gp, 5); br.rotation.set((srand() - 0.5) * 1.1, 0, (srand() - 0.5) * 1.1); } }      // dead coral, bone white
      if (state !== 'broken') L.glass.push(box(w - 0.02, h, d - 0.02, tGlass, 0, y0 + h / 2, 0, Gp));
      else {
        [[-1, 0], [1, 0]].forEach(function (c) { var sp = mesh(new THREE.PlaneGeometry(d - 0.02, h), tGlass, c[0] * (w / 2 - 0.01), y0 + h / 2, 0, Gp); sp.rotation.y = PI / 2; L.glass.push(sp); });
        mesh(new THREE.PlaneGeometry(w - 0.04, h), tShard, 0, y0 + h / 2, d / 2 - 0.012, Gp).userData.noCast = true;
        for (r = 0; r < 12; r++) { var sh = mesh(new THREE.PlaneGeometry(0.1 + srand() * 0.2, 0.08 + srand() * 0.16), tShard, (srand() - 0.5) * (w + 0.4), 0.04, d / 2 + 0.2 + srand() * 1.1, Gp); sh.rotation.set(-PI / 2, 0, srand() * 6); sh.userData.noCast = true; }
        var stn = mesh(new THREE.PlaneGeometry(w + 1.4, 2.6), stain, 0, 0.034, d / 2 + 1.1, Gp); stn.rotation.x = -PI / 2; stn.userData.noCast = true;
        box(w * 0.5, 0.04, 0.5, tDry, 0.1, 0.03, d / 2 + 0.4, Gp).rotation.y = 0.2;                                                         // the gravel that came out with the water
      }
      if (wet) {
        L.tint.push(box(w - 0.07, h * lvl, d - 0.07, tTint, 0, y0 + h * lvl / 2, 0, Gp));
        var sf = mesh(new THREE.PlaneGeometry(w - 0.06, d - 0.06), A.tSurf, 0, y0 + h * lvl, 0, Gp); sf.rotation.x = -PI / 2; L.surf.push(sf);
        var cz2 = mesh(new THREE.PlaneGeometry(w - 0.08, d - 0.08), tCaus, 0, y0 + 0.09, 0, Gp); cz2.rotation.x = -PI / 2; var CU = cz2.geometry.attributes.uv; for (r = 0; r < CU.count; r++) CU.setXY(r, CU.getX(r) * w * 0.7 + x * 0.3, CU.getY(r) * d * 0.7 + z * 0.3); L.caus.push(cz2);
      }
      var al = mesh(new THREE.PlaneGeometry(w - 0.05, h), tAlgae, 0, y0 + h / 2, d / 2 - 0.022, Gp), AU = al.geometry.attributes.uv, fl = srand() < 0.5; for (r = 0; r < AU.count; r++) AU.setXY(r, fl ? 1 - AU.getX(r) : AU.getX(r), lvl > 0 ? clamp(AU.getY(r) * (0.9 / Math.max(lvl, 0.3)), 0, 1) : AU.getY(r)); L.algae.push(al);
      plaque(name, lines, 0, base * 0.55, d / 2 + 0.006, 0, Math.min(w - 0.3, 1.5)).removeFromParent ? 0 : 0;
      var pq = scene.children[scene.children.length - 1]; scene.remove(pq); Gp.add(pq);
      var hw = Math.abs(Math.sin(rot)) > 0.7 ? d / 2 : w / 2, hd = Math.abs(Math.sin(rot)) > 0.7 ? w / 2 : d / 2; solid(x - hw - 0.03, x + hw + 0.03, z - hd - 0.03, z + hd + 0.03, null, null, true);
      A.tanks.push({ x: x, z: z, state: state }); return Gp;
    }
    var NW = G.z1 + 0.66, SW = G.z2 - 0.66;
    tank(79.2, NW, 3.4, 1.2, 0.85, 1.5, 0, 'full', 'CLOWNFISH', ['Amphiprion ocellaris  ·  coral reefs of the Pacific', 'Every one is born male.']);
    tank(83.6, NW, 3.4, 1.2, 0.85, 1.5, 0, 'low', 'MORAY EEL', ['Gymnothorax javanicus  ·  three metres, two sets of jaws', 'Feeding Tuesdays and Saturdays.']);
    tank(88.0, NW, 3.4, 1.2, 0.85, 1.5, 0, 'broken', 'LIONFISH', ['Pterois volitans  ·  eighteen venomous spines', 'Do not put your hand in the water.']);
    tank(92.4, NW, 3.4, 1.2, 0.85, 1.5, 0, 'full', 'SEAHORSES', ['Hippocampus kuda  ·  the father carries the young', 'Look for them holding on to the weed.']);
    tank(84.0, SW, 3.4, 1.2, 0.85, 1.5, PI, 'full', 'HORSESHOE CRABS', ['A living fossil: barely changed in 445 million years.', 'Closer kin to spiders than to crabs.']);
    tank(88.4, SW, 3.4, 1.2, 0.85, 1.5, PI, 'dry', 'NAUTILUS', ['Nautilus pompilius  ·  last of the shelled cephalopods', 'TANK UNDER MAINTENANCE']);
    tank(92.8, SW, 3.4, 1.2, 0.85, 1.5, PI, 'full', 'PIRANHA', ['Pygocentrus nattereri  ·  shoals of thirty', 'They are shyer than you think.']);
    tank(82.4, 56.4, 1.3, 1.3, 0.7, 1.9, 0.0, 'full', 'MOON JELLYFISH', ['Aurelia aurita  ·  no brain, no heart, no bones']);
    tank(93.4, 63.4, 1.3, 1.3, 0.7, 1.9, PI, 'low', 'CORAL NURSERY', ['Grown here, planted out at sea.']);
    tank(81.2, 64.6, 2.0, 0.9, 0.8, 1.1, 0.5, 'broken', 'ARCHERFISH', ['Toxotes jaculatrix  ·  shoots down insects with a jet of water']);
    // one that has gone over: the cabinet on its side, the glass in pieces round it, a fan of gravel
    (function () {
      var Gp = new THREE.Group(); Gp.position.set(88.2, 0, 56.0); Gp.rotation.y = -0.5; scene.add(Gp);
      var cb = box(1.3, 0.7, 1.3, M2.blue, 0, 0.65, -0.3, Gp); cb.rotation.x = PI / 2 - 0.05; var hd = box(1.38, 0.16, 1.38, M2.blue, 0.1, 0.1, 2.5, Gp); hd.rotation.set(0.1, 0.3, 0.04);
      [[-0.63, 0.08], [0.63, 0.08]].forEach(function (c) { box(0.035, 1.9, 0.035, M2.white, c[0], 0.03 + (c[0] > 0 ? 1.25 : 0.02), 1.35, Gp).rotation.x = PI / 2; });
      for (var r = 0; r < 26; r++) { var sh = mesh(new THREE.PlaneGeometry(0.12 + srand() * 0.34, 0.1 + srand() * 0.26), tShard, (srand() - 0.5) * 2.4, 0.04, 0.6 + srand() * 2.4, Gp); sh.rotation.set(-PI / 2, 0, srand() * 6); sh.userData.noCast = true; }
      var gv = mesh(new THREE.CircleGeometry(1.5, 14), tDry, 0.2, 0.036, 1.8, Gp); gv.rotation.x = -PI / 2; gv.scale.set(1, 0.7, 1); gv.userData.noCast = true;
      var stn = mesh(new THREE.PlaneGeometry(5, 4.4), stain, 0.4, 0.033, 1.6, Gp); stn.rotation.x = -PI / 2; stn.userData.noCast = true;
      for (r = 0; r < 4; r++) { var rk = mesh(rockG2, tRock, (srand() - 0.5) * 1.6, 0.1, 1 + srand() * 1.8, Gp); rk.scale.setScalar(0.1 + srand() * 0.1); }
      plaque('PUFFERFISH', ['Tetraodon mbu  ·  inflates when alarmed'], 0, 0.72, 0.36, 0, 1.0).rotation.x = -PI / 2 + 0.05; var pq = scene.children[scene.children.length - 1]; scene.remove(pq); Gp.add(pq); pq.position.set(0, 1.02, -0.3);
      solid(87.3, 89.0, 55.0, 56.5, null, null, true);
    })();
    // the rock pool by the door: a low open basin that children were let touch.  Dry: starfish like biscuits, a rim of salt.
    (function () {
      var x1 = G.x1 + 0.05, x2 = G.x1 + 1.5, z1 = 52.2, z2 = 56.4;
      wb(x1, x2, 0, 0.72, z1, z2, M2.blue, 2, 2, true); wb(x1 + 0.12, x2 - 0.12, 0.72, 0.74, z1 + 0.12, z2 - 0.12, tDry, 1, 1); [[x1, x1 + 0.12, z1, z2], [x2 - 0.12, x2, z1, z2], [x1, x2, z1, z1 + 0.12], [x1, x2, z2 - 0.12, z2]].forEach(function (r) { wb(r[0], r[1], 0.72, 0.86, r[2], r[3], M2.white, 2, 2); });
      for (var r = 0; r < 5; r++) { var sx = x1 + 0.35 + srand() * 0.8, sz = z1 + 0.4 + srand() * 3.4, st = new THREE.Group(); st.position.set(sx, 0.755, sz); st.rotation.y = srand() * 6; scene.add(st); for (var a = 0; a < 5; a++) { var arm = mesh(new THREE.ConeGeometry(0.035, 0.14, 5), std(0xa8683a, 0.9), Math.cos(a * 1.257) * 0.07, 0, Math.sin(a * 1.257) * 0.07, st); arm.rotation.set(PI / 2, 0, -a * 1.257 + PI / 2, 'YXZ'); arm.rotation.set(0, 0, 0); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a * 1.257), 0, Math.sin(a * 1.257))); arm.scale.y = 1; } }
      for (r = 0; r < 5; r++) { var rk = mesh(rockG2, tRock, x1 + 0.3 + srand() * 0.9, 0.8, z1 + 0.4 + srand() * 3.4); rk.scale.set(0.16 + srand() * 0.14, 0.1, 0.14 + srand() * 0.1); }
      plaque('ROCK POOL', ['Two fingers, gently.  Wash your hands afterwards.'], x2 + 0.008, 0.42, (z1 + z2) / 2, PI / 2, 1.5);
    })();
    // two columns of water either side of the tunnel, floor to ceiling: one still lit
    [[G.x2 - 0.75, 55.6, 'full'], [G.x2 - 0.75, 64.4, 'low']].forEach(function (c, n) {
      cyl(0.62, 0.66, 0.5, M2.blue, c[0], 0.25, c[1], null, 20); cyl(0.62, 0.62, 0.4, M2.blue, c[0], G.h - 0.2, c[1], null, 20);
      var H2 = G.h - 0.9, lv = n ? 0.4 : 0.92;
      L.glass.push(mesh(new THREE.CylinderGeometry(0.56, 0.56, H2, 22, 1, true), tGlass, c[0], 0.5 + H2 / 2, c[1])); L.tint.push(mesh(new THREE.CylinderGeometry(0.53, 0.53, H2 * lv, 18), tTint, c[0], 0.5 + H2 * lv / 2, c[1]));
      var al = mesh(new THREE.CylinderGeometry(0.545, 0.545, H2, 22, 1, true), tAlgae, c[0], 0.5 + H2 / 2, c[1]); L.algae.push(al);
      cyl(0.5, 0.5, 0.06, tGravel, c[0], 0.53, c[1], null, 18); cyl(0.3, 0.3, 0.03, n ? tubeOff : tubeOn, c[0], G.h - 0.41, c[1], null, 12).userData.keep = !n;
      circles.push({ x: c[0], z: c[1], r: 0.66 }); plaque(n ? 'SEA NETTLES' : 'COMB JELLIES', [n ? 'Chrysaora  ·  the sting lasts for hours' : 'They make their own light.'], c[0] - 0.67, 1.3, c[1], -PI / 2, 0.9);
    });
    A.tankGlass = bake(L.glass, tGlass, 4); bake(L.tint, tTint, 1); bake(L.surf, A.tSurf, 2); bake(L.algae, tAlgae, 3); bake(L.caus, tCaus, 2);
    // somebody's last word on the subject, taped to the glass of the moray's tank
    var note = mesh(new THREE.PlaneGeometry(0.3, 0.36), std(0xffffff, 0.9, { map: canvasTex(256, function (g, S, HH2) { g.fillStyle = '#e8e2c8'; g.fillRect(0, 0, S, HH2); var hand = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'; g.fillStyle = '#1b2a5a'; g.font = '22px ' + hand; ['Nobody has fed', 'these since March.', '', 'The pumps stop', 'when the diesel', 'does.  I am sorry.', '', '— do NOT go up on', 'her walkway alone.'].forEach(function (l, n) { g.fillText(l, 16, 34 + n * 30); }); grime(g, S, HH2, 0.9); }, 1, 1, true, 308) }), 83.0, 1.75, NW + 0.612); note.rotation.z = -0.06; note.userData.noCast = true;
    // the park's own posters, framed on the wall by the tunnel
    if (Extras.posters) [[G.x2 - 0.03, 52.6, Extras.posters.sea], [G.x2 - 0.03, 67.4, Extras.posters.ples]].forEach(function (p2) { box(0.05, 2.3, 1.86, M2.blue, p2[0] + 0.012, 2.05, p2[1]); var m = mesh(new THREE.PlaneGeometry(1.72, 2.15), std(0xffffff, 0.5, { map: p2[2] }), p2[0] - 0.018, 2.05, p2[1]); m.rotation.y = -PI / 2; m.userData.noCast = true; });
    // the light the tanks give
    A.tankGlow = mesh(new THREE.PlaneGeometry(18, 2.2), new THREE.MeshBasicMaterial({ color: 0x1f6f7c, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, map: softTex('rgba(255,255,255,1)', 'rgba(255,255,255,.4)') }), 86, 0.04, G.z1 + 2.2); A.tankGlow.rotation.x = -PI / 2; A.tankGlow.userData.noCast = true;
    var g2 = mesh(new THREE.PlaneGeometry(13, 2.2), A.tankGlow.material, 88.4, 0.04, G.z2 - 2.2); g2.rotation.x = -PI / 2; g2.userData.noCast = true;
  })();
  gather('gallery');

  // ================= behind the STAFF ONLY door: the stairs, and the basement =================
  (function () {
    var q, B = BASE_Y, SX1 = 140.5, SX2 = 144.98, LA1 = 58.6, LA2 = 60.2, LB1 = 60.4, LB2 = 62.0, WX = H.x2 + 0.5, EX = 146.5, CEIL = -0.5, SD = A.staffDoor;
    var bw = std(0xffffff, 0.95, { map: canvasTex(512, function (g, S) {        // basement walls: bare concrete, a cream band to shoulder height, a red line over it
      speckle('#8a8c86', ['#74766f', '#9a9c95', '#666862'], 12000, 2)(g, S); g.fillStyle = 'rgba(200,196,170,.55)'; g.fillRect(0, S * 0.52, S, S * 0.48); g.fillStyle = '#8a2a22'; g.fillRect(0, S * 0.5, S, 7);
      streaks(g, S, S, 70, 'rgba(110,76,36,.8)', S * 0.8); streaks(g, S, S, 40, 'rgba(226,228,216,.5)', S * 0.5); blotch(g, S, ['#3a4034', '#2a2e28', '#55503c'], 40, 16, 90, 0.45); flake(g, S, S, 14, 6, 26, ['#6c6e68', '#5f615c']); mould(g, S, S, S * 0.72, 2600);
    }), bumpMap: bump(3), bumpScale: 0.025 });
    var bf = std(0xffffff, 0.75, { map: canvasTex(512, function (g, S) { speckle('#5c5f5c', ['#4c4f4c', '#6c6f6a', '#424542'], 14000, 1.8)(g, S); blotch(g, S, ['#23261f', '#34301f', '#1a1c18', '#3a4438'], 60, 16, 110, 0.5); g.strokeStyle = 'rgba(16,16,14,.8)'; for (var a = 0; a < 9; a++) { g.lineWidth = 1 + Math.random() * 1.5; var x = Math.random() * S, y = Math.random() * S; g.beginPath(); g.moveTo(x, y); for (var b = 0; b < 8; b++) { x += (Math.random() - 0.5) * 70; y += (Math.random() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); } }), bumpMap: bump(4), bumpScale: 0.02, metalness: 0.1 });
    var tread = std(0x4a5054, 0.6, { metalness: 0.6, map: metalTex, bumpMap: bump(6), bumpScale: 0.02 });
    M2.bw = bw; M2.bf = bf;
    // ---- the stairs: a landing behind the door, down east to a half-landing, back west to the bottom ----
    floor(H.x2, WX, SD.z1, SD.z2, MEZ, null, null, 'hard'); floor(WX, SX1, LA1, LA2, MEZ, null, null, 'grate');
    floor(SX1, SX2, LA1, LA2, MEZ, -0.2, 'x', 'grate'); floor(SX2, EX, LA1, LB2, -0.2, null, null, 'grate'); floor(SX1, SX2, LB1, LB2, B, -0.2, 'x', 'grate'); floor(WX - 0.5, SX1, LB1, LB2, B);
    flat(WX, SX1, LA1, LA2, MEZ, tread, 2); flat(SX2, EX, LA1, LB2, -0.2, tread, 2);
    for (q = 0; q < 16; q++) {                                                                        // sixteen risers a flight
      box(0.3, 0.035, LA2 - LA1, tread, SX1 + (q + 0.5) * 0.28, MEZ - (q + 1) * 0.2, (LA1 + LA2) / 2); box(0.02, 0.2, LA2 - LA1, M2.dark, SX1 + (q + 1) * 0.28, MEZ - (q + 0.5) * 0.2 - 0.2, (LA1 + LA2) / 2);
      box(0.3, 0.035, LB2 - LB1, tread, SX2 - (q + 0.5) * 0.28, -0.2 - (q + 1) * 0.2, (LB1 + LB2) / 2); box(0.02, 0.2, LB2 - LB1, M2.dark, SX2 - (q + 1) * 0.28, -0.2 - (q + 0.5) * 0.2 - 0.2, (LB1 + LB2) / 2);
    }
    var stA = Math.atan2(3.2, 4.48), stL = Math.hypot(4.48, 3.2);
    [[LA1 + 0.07, MEZ, -1], [LA2 - 0.07, MEZ, -1], [LB1 + 0.07, -0.2, 1], [LB2 - 0.07, -0.2, 1]].forEach(function (r) { var st = box(stL, 0.22, 0.05, EM.rustSteel, (SX1 + SX2) / 2, r[1] - 1.6 - 0.14, r[0]); st.rotation.z = r[2] * stA; var hr = box(stL, 0.045, 0.045, M2.rail, (SX1 + SX2) / 2, r[1] - 1.6 + 0.95, r[0]); hr.rotation.z = r[2] * stA; });
    // the shaft the stairs run in: concrete, a wall between the two flights
    wb(WX, EX, B, 5.7, 58.4, LA1, bw, 4, 4, true); wb(WX, EX, B, 5.7, LB2, 62.2, bw, 4, 4, true); wb(SX1, SX2, B, 5.7, LA2, LB1, bw, 4, 4, true);
    sheet('x', EX - 0.012, -1, LA1, LB2, B, 5.7, bw, 4, 4); sheet('x', WX + 0.012, 1, LA1, LB2, CEIL, 5.7, bw, 4, 4, [[SD.z1, SD.z2, MEZ, MEZ + 2.1]]); sheet('x', WX + 0.262, 1, LA1, LB2, B, CEIL, bw, 4, 4, [[LB1, LB2, B, B + 2.2]]);
    wb(WX, WX + 0.25, B, CEIL, 58.4, LB1, bw, 4, 4); wb(WX, WX + 0.25, B + 2.2, CEIL, LB1, LB2, bw, 4, 4); wb(WX, WX + 0.25, B, CEIL, LB2, 62.2, bw, 4, 4);
    flat(WX, EX, LA1, LA2, 5.7, M2.dark, 4, false); flat(WX, EX, LB1, LB2, 2.5, bw, 4, false);
    solid(WX - 0.5, WX, LA1 - 0.2, LA2 + 0.2, B - 0.2, MEZ - 0.2); solid(WX - 0.5, WX, LB1, LB2, B + 2.3, CW - 0.2); solid(WX - 0.5, WX, LA2, LB1, B - 0.2, CW - 0.2);           // the wall at the head of the basement, by floor
    A.stairLamp = basic(0x221206, { fog: false }); box(0.3, 0.12, 0.2, M.dark, EX - 0.08, 1.9, 60.3); mesh(new THREE.SphereGeometry(0.1, 10, 8), A.stairLamp, EX - 0.16, 1.9, 60.3).userData.keep = true;
    light('stair', 0xffb060, EX - 0.9, 1.7, 60.3, 13, 1.5); light('stairLow', 0xff4030, 139.2, B + 2.2, 61.2, 9, 1.6);
    label(['PLANT ROOM  ↓', 'LIFT  ·  PUMPS  ·  FEED STORE'], 1.3, 0.42, '#17140e', '#e2b93b', WX + 0.02, MEZ + 1.7, 58.75, PI / 2, 384, '#e2b93b');
    // ---- the basement ----
    var bx1 = T.x2 + 0.5, bx2 = EX, bz1 = H.z1, bz2 = H.z2, PX = WX;                               // PX: the partition between the long hall under the gallery and the rooms east of it
    floor(bx1, bx2, bz1, bz2, B, null, null, 'hard'); flat(bx1, bx2, bz1, bz2, B, bf, 4);
    flat(bx1, PX + 0.25, bz1, bz2, CEIL, bw, 4, false); flat(PX + 0.25, bx2, bz1, 58.4, CEIL, bw, 4, false); flat(PX + 0.25, bx2, 62.2, bz2, CEIL, bw, 4, false);          // (no ceiling across the stairwell)
    sheet('z', bz1 + 0.012, 1, bx1, bx2, B, CEIL, bw, 4, 4); sheet('z', bz2 - 0.012, -1, bx1, bx2, B, CEIL, bw, 4, 4); sheet('x', bx2 - 0.012, -1, bz1, 58.4, B, CEIL, bw, 4, 4); sheet('x', bx2 - 0.012, -1, 62.2, bz2, B, CEIL, bw, 4, 4);
    sheet('x', bx1 + 0.012, 1, bz1, bz2, B, CEIL, bw, 4, 4, A.ports.map(function (p2) { return [p2[0], p2[1], A.portY[0], A.portY[1]]; }));
    solid(bx1 - 1, bx1, bz1, bz2, B - 0.2, CEIL); solid(bx1, bx2, bz1 - 0.5, bz1, B - 0.2, CEIL); solid(bx1, bx2, bz2, bz2 + 0.5, B - 0.2, CEIL); solid(bx2, bx2 + 0.5, bz1, bz2, B - 0.2, CEIL);
    // the partition, with the doors to the feed store (north) and the pump room (south)
    A.doorsB = [[52.0, 53.1], [66.0, 67.1]];
    [[bz1, 52.0], [53.1, 58.4], [62.2, 66.0], [67.1, bz2]].forEach(function (w) { wb(PX, PX + 0.25, B, CEIL, w[0], w[1], bw, 4, 4, [B - 0.2, CEIL]); });
    A.doorsB.forEach(function (d) { wb(PX, PX + 0.25, B + 2.1, CEIL, d[0], d[1], bw, 4, 4); box(0.3, 2.1, 0.08, M2.blue, PX + 0.125, B + 1.05, d[0] - 0.03); box(0.3, 2.1, 0.08, M2.blue, PX + 0.125, B + 1.05, d[1] + 0.03); box(0.3, 0.08, d[1] - d[0] + 0.14, M2.blue, PX + 0.125, B + 2.14, (d[0] + d[1]) / 2); });
    label(['FEED STORE'], 0.9, 0.2, '#17140e', '#e2b93b', PX - 0.012, B + 2.4, 52.55, -PI / 2, 256); label(['PUMP ROOM', 'LIFT HYDRAULICS'], 0.9, 0.3, '#17140e', '#e2b93b', PX - 0.012, B + 2.45, 66.55, -PI / 2, 256);
    // each room door: one stands open, the other hangs off a hinge
    var d1 = new THREE.Group(); d1.position.set(PX + 0.25, B, 53.1); d1.rotation.y = -1.9; scene.add(d1); box(0.05, 2.05, 1.06, M2.blue, 0, 1.03, -0.53, d1); box(0.07, 0.12, 0.03, M2.rail, 0.04, 1.0, -0.95, d1);
    var d2 = new THREE.Group(); d2.position.set(PX + 0.25, B, 66.0); d2.rotation.set(0.0, 1.35, 0.07); scene.add(d2); box(0.05, 2.05, 1.06, M2.blue, 0, 1.03, 0.53, d2); box(0.07, 0.12, 0.03, M2.rail, 0.04, 1.0, 0.95, d2);
    solid(PX + 0.3, PX + 0.75, 53.1, 54.2, B - 0.2, CEIL, true); solid(PX + 0.3, PX + 0.6, 65.0, 66.0, B - 0.2, CEIL, true);
    // the observation ports into the bottom of the tank: armoured glass in riveted steel, at the height of your face
    var portGlass = new THREE.MeshStandardMaterial({ color: 0x9fd8d8, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, depthWrite: false, envMap: envTex, envMapIntensity: 0.7, map: canvasTex(128, function (g, S) { g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); for (var n = 0; n < 300; n++) { g.fillStyle = 'rgba(50,110,60,' + (0.2 + Math.random() * 0.5) + ')'; var e = Math.random() < 0.5; g.beginPath(); g.arc(e ? Math.random() * S : (Math.random() < 0.5 ? 0 : S) + (Math.random() - 0.5) * 30, e ? (Math.random() < 0.5 ? 0 : S) + (Math.random() - 0.5) * 30 : Math.random() * S, 2 + Math.random() * 6, 0, 7); g.fill(); } }) });
    A.ports.forEach(function (p2, n) {
      var pz = (p2[0] + p2[1]) / 2, py = (A.portY[0] + A.portY[1]) / 2, pg = mesh(new THREE.PlaneGeometry(p2[1] - p2[0], A.portY[1] - A.portY[0]), portGlass, T.x2 + 0.1, py, pz); pg.rotation.y = PI / 2; pg.renderOrder = 5; pg.userData.noCast = true;
      [[0, 0.83, 1.72, 0.14], [0, -0.83, 1.72, 0.14], [0.86, 0, 0.14, 1.8], [-0.86, 0, 0.14, 1.8]].forEach(function (f) { box(0.1, f[3], f[2], EM.rustSteel, bx1 + 0.04, py + f[1], pz + f[0]); });
      for (q = 0; q < 14; q++) { var a = q / 14 * 6.283; cyl(0.018, 0.018, 0.03, M2.steel, bx1 + 0.1, py + Math.sin(a) * 0.83 * (Math.abs(Math.sin(a)) > 0.7 ? 1 : 0.99), pz + clamp(Math.cos(a) * 1.3, -0.86, 0.86), null, 6).rotation.z = PI / 2; }
      label(['OBSERVATION PORT ' + (n + 1), 'DO NOT TAP'], 0.7, 0.2, '#e2b93b', '#17140e', bx1 + 0.02, py + 1.12, pz, PI / 2, 256);
    });
    solid(bx1, bx1 + 0.02, bz1, bz2, B - 0.2, CEIL);
    // the long hall: mains along the ceiling, a cable tray, drains in the floor, a trolley left where it stopped
    [[bx1 + 0.55, 0.22, 0x3f6f8a], [bx1 + 1.15, 0.16, 0x4a7a3a], [PX - 0.5, 0.12, 0x8a8a84]].forEach(function (pp) { var pm = cyl(pp[1], pp[1], bz2 - bz1 - 3.2, std(pp[2], 0.6, { metalness: 0.4, map: rustTex }), pp[0], CEIL - pp[1] - 0.12, (bz1 + bz2) / 2 + 1.6, null, 12); pm.rotation.x = PI / 2; for (q = 0; q < 7; q++) { box(0.05, 0.14, pp[1] * 2 + 0.1, M2.steel, pp[0], CEIL - 0.07, bz1 + 5 + q * 4.2).rotation.y = PI / 2; cyl(pp[1] + 0.03, pp[1] + 0.03, 0.08, M2.steel, pp[0], CEIL - pp[1] - 0.12, bz1 + 6.2 + q * 4.2, null, 12).rotation.x = PI / 2; } });
    box(0.4, 0.05, bz2 - bz1 - 4, M2.steel, PX - 1.2, CEIL - 0.3, (bz1 + bz2) / 2 + 1.8);
    for (q = 0; q < 4; q++) { var dr = mesh(new THREE.PlaneGeometry(0.5, 0.5), M2.grate, bx1 + 2.5, B + 0.012, bz1 + 7 + q * 7); dr.rotation.x = -PI / 2; dr.userData.noCast = true; }
    [[136.2, 57.8, 1.5], [137.6, 70.2, 1.9], [138.3, 49.6, 1.1], [143.5, 72.6, 2.2], [141.2, 68.5, 1.3]].forEach(function (p2) { var pm = mesh(new THREE.CircleGeometry(p2[2], 18), A.puddle, p2[0], B + 0.016, p2[1]); pm.rotation.x = -PI / 2; pm.rotation.z = srand() * 6; pm.scale.set(1, 0.6, 1); pm.userData.noCast = true; });
    var tr = new THREE.Group(); tr.position.set(137.9, B, 63.6); tr.rotation.y = 0.4; scene.add(tr); box(0.7, 0.04, 1.1, M2.steel, 0, 0.3, 0, tr); box(0.7, 0.04, 1.1, M2.steel, 0, 0.8, 0, tr); [[-0.32, -0.5], [0.32, -0.5], [-0.32, 0.5], [0.32, 0.5]].forEach(function (c) { cyl(0.014, 0.014, 0.9, M2.rail, c[0], 0.48, c[1], tr, 5); cyl(0.05, 0.05, 0.03, M.rubber, c[0], 0.05, c[1], tr, 8).rotation.z = PI / 2; });
    cyl(0.16, 0.14, 0.3, std(0x3a5f8a, 0.6), 0.1, 0.96, 0.2, tr, 12); cyl(0.16, 0.14, 0.3, std(0x3a5f8a, 0.6), -0.12, 0.47, -0.25, tr, 12); circles.push({ x: 137.9, z: 63.6, r: 0.6, top: B + 1.2 });
    A.bTubes = [];
    [[137, 50.5], [137, 60], [137, 70.5], [143, 51], [143, 69]].forEach(function (t, n) { box(0.2, 0.07, 1.3, M2.white, t[0], CEIL - 0.04, t[1]); var tm = basic(0x1c1c1a, { fog: false }); box(0.05, 0.035, 1.2, tm, t[0], CEIL - 0.09, t[1]).userData.keep = true; A.bTubes.push(tm); });
    light('baseN', 0xdfeeff, 137, B + 2.3, 51, 13, 1.5); light('baseS', 0xdfeeff, 137, B + 2.3, 69.5, 13, 1.5); light('basePump', 0xffd9a0, 143, B + 2.3, 69, 12, 1.5); light('baseFeed', 0xdfeeff, 143, B + 2.3, 51, 12, 1.5); light('port', 0x4fc0cc, bx1 + 1.2, B + 1.7, 60, 12, 1.3);
    // ---- the feed store: freezers that stopped twelve years ago, hooks, a steel table, shelves ----
    var fz = std(0xc9cec9, 0.5, { metalness: 0.3, map: canvasTex(128, function (g, S) { g.fillStyle = '#c4cac6'; g.fillRect(0, 0, S, S); streaks(g, S, S, 16, 'rgba(110,70,30,.8)', S); mould(g, S, S, S * 0.3, 500); grime(g, S, S, 1.3); }) });
    [[141.0, 45.1], [142.9, 45.1], [144.8, 45.1]].forEach(function (f, n) { wb(f[0] - 0.85, f[0] + 0.85, B, B + 0.9, f[1] - 0.4, f[1] + 0.42, fz, 2, 2); var lid = box(1.7, 0.07, 0.82, fz, f[0], B + 0.94, f[1]); if (n === 1) { lid.rotation.x = -1.1; lid.position.set(f[0], B + 1.28, f[1] - 0.32); box(1.5, 0.02, 0.6, M2.dark, f[0], B + 0.88, f[1] + 0.02); } });
    solid(140.1, 145.7, 44.5, 45.55, B - 0.2, CEIL, true);
    wb(143.4, 146.3, B + 0.86, B + 0.9, 55.6, 56.6, M2.steel, 2, 2); [[143.5, 55.7], [146.2, 55.7], [143.5, 56.5], [146.2, 56.5]].forEach(function (l) { cyl(0.025, 0.025, 0.86, M2.rail, l[0], B + 0.43, l[1], null, 6); }); solid(143.4, 146.3, 55.6, 56.6, B - 0.2, CEIL, true);
    A.feedTable = { x: 144.8, z: 56.1, y: B + 0.9 };
    for (q = 0; q < 5; q++) { cyl(0.008, 0.008, 0.5, M2.rail, 141 + q * 1.1, CEIL - 0.25, 49.5, null, 4); var hk = mesh(new THREE.TorusGeometry(0.06, 0.01, 5, 10, 4), M2.rail, 141 + q * 1.1, CEIL - 0.55, 49.5); hk.rotation.z = -1.2; }
    box(4.8, 0.05, 0.05, M2.steel, 143.2, CEIL - 0.02, 49.5);
    [[146.3, 48], [146.3, 51.5]].forEach(function (sh2) { for (q = 0; q < 4; q++) box(0.4, 0.03, 2.6, M2.steel, sh2[0] - 0.2, B + 0.4 + q * 0.5, sh2[1]); [-1.28, 1.28].forEach(function (o) { box(0.04, 2.0, 0.04, M2.rail, sh2[0] - 0.02, B + 1.0, sh2[1] + o); box(0.04, 2.0, 0.04, M2.rail, sh2[0] - 0.38, B + 1.0, sh2[1] + o); }); });
    solid(145.85, 146.5, 46.6, 52.9, B - 0.2, CEIL, true);
    for (q = 0; q < 9; q++) { var bk = cyl(0.13, 0.11, 0.24, std([0x3a5f8a, 0xd8d2c2, 0x8a2a22][q % 3], 0.6), 146.1, B + 0.53 + (q % 3) * 0.5, 47.1 + q * 0.6, null, 10); if (q % 4 === 3) { bk.rotation.z = 1.5; bk.position.y += 0.02; } }
    label(['FEED LOG — E. PLATYURUS', 'MON  herring 40 kg', 'WED  squid 25 kg', 'FRI  half a cow', 'she is still hungry'], 0.9, 0.9, '#e9e6da', '#23201a', 140.1, B + 1.6, bz1 + 0.02, 0, 320);
    // ---- the pump room: the lift's hydraulic set, the manifold that feeds its ram, drums and filters ----
    A.pumpAt = { x: 145.3, z: 67.4 }; A.maniAt = { x: 143.0, z: bz2 - 0.12 };
    var pg2 = new THREE.Group(); pg2.position.set(A.pumpAt.x, B, A.pumpAt.z); scene.add(pg2);
    box(1.5, 0.5, 0.9, std(0x2f4a5a, 0.6, { metalness: 0.4, map: rustTex }), 0, 0.3, 0, pg2); box(1.6, 0.06, 1.0, M2.steel, 0, 0.03, 0, pg2);                                    // the oil tank
    var mot = cyl(0.2, 0.2, 0.6, std(0x35506a, 0.5, { metalness: 0.5 }), -0.3, 0.8, 0, pg2, 16); mot.rotation.z = PI / 2; for (q = 0; q < 8; q++) cyl(0.215, 0.215, 0.015, M.dark, -0.52 + q * 0.065, 0.8, 0, pg2, 16).rotation.z = PI / 2;
    A.pumpFan = dyn(new THREE.Group()); A.pumpFan.position.set(-0.64, 0.8, 0); pg2.add(A.pumpFan); for (q = 0; q < 6; q++) { var fb = box(0.012, 0.17, 0.05, M2.steel, 0, 0, 0, A.pumpFan); fb.rotation.x = q * PI / 3; fb.translateY(0.09); }
    cyl(0.12, 0.12, 0.3, M2.steel, 0.2, 0.8, 0, pg2, 12).rotation.z = PI / 2; cyl(0.04, 0.04, 0.5, M2.steel, 0.45, 1.0, 0, pg2, 8); cyl(0.11, 0.11, 0.04, M2.white, 0.45, 1.3, 0.02, pg2, 16).rotation.x = PI / 2;
    A.pumpGauge = dyn(box(0.008, 0.08, 0.004, M.red, 0.45, 1.33, 0.045, pg2)); A.pumpGauge.geometry.translate(0, 0.03, 0); A.pumpGauge.position.y = 1.3;
    solid(A.pumpAt.x - 0.85, A.pumpAt.x + 0.85, A.pumpAt.z - 0.55, A.pumpAt.z + 0.55, B - 0.2, CEIL, true);
    // its starter, on the east wall
    var stx = EX - 0.02, stz = 69.5; box(0.14, 0.6, 0.42, std(0x8a8f8c, 0.6, { metalness: 0.4 }), stx - 0.07, B + 1.4, stz); label(['HYDRAULIC PUMP', 'LIFT No. 1'], 0.36, 0.14, '#17140e', '#e2b93b', stx - 0.145, B + 1.62, stz, -PI / 2, 256);
    A.startBtn = dyn(cyl(0.035, 0.035, 0.03, std(0x1f8a3a, 0.5), stx - 0.15, B + 1.42, stz - 0.09, null, 12)); A.startBtn.rotation.z = PI / 2; cyl(0.035, 0.035, 0.03, std(0x8a1f1a, 0.5), stx - 0.15, B + 1.42, stz + 0.09, null, 12).rotation.z = PI / 2;
    A.startLamp = basic(0x1a0805, { fog: false }); mesh(new THREE.SphereGeometry(0.024, 8, 8), A.startLamp, stx - 0.15, B + 1.26, stz).userData.keep = true; A.starter = { x: stx - 0.15, y: B + 1.42, z: stz - 0.09 };
    cyl(0.03, 0.03, 1.5, M.rubber, stx - 0.1, B + 0.75, stz + 0.3, null, 6);
    // drums, a filter bank along the north wall, a sump under a grating
    [[140.4, 63.2], [141.2, 62.9], [140.6, 64.1]].forEach(function (d, n) { cyl(0.3, 0.3, 0.9, std([0x2f5a7a, 0x8a5a1a, 0x2f5a7a][n], 0.6, { metalness: 0.3, map: rustTex }), d[0], B + 0.45, d[1], null, 14); circles.push({ x: d[0], z: d[1], r: 0.34, top: B + 1.0 }); });
    for (q = 0; q < 3; q++) { var fx = 142.4 + q * 1.5; cyl(0.55, 0.55, 1.9, std(0x9aa4a6, 0.5, { metalness: 0.5, map: metalTex }), fx, B + 1.05, 63.05, null, 16); cyl(0.57, 0.57, 0.06, M2.blue, fx, B + 1.5, 63.05, null, 16); cyl(0.07, 0.07, 0.5, M2.steel, fx, B + 2.25, 63.05, null, 8); }      // sand filters
    solid(141.8, 146.0, 62.4, 63.7, B - 0.2, CEIL, true);
    solid(140.3, 141.6, 62.4, 64.5, B - 0.2, CEIL, true);
    var sump = mesh(new THREE.PlaneGeometry(2.2, 1.6), M2.grate, 141.4, B + 0.02, 70.6); sump.rotation.x = -PI / 2; sump.userData.noCast = true; mesh(new THREE.PlaneGeometry(2.2, 1.6), M2.dark, 141.4, B + 0.004, 70.6).rotation.x = -PI / 2;
    label(['LIFT RAM PRESSURE', 'ROUTE PUMP → RAM ON THE MANIFOLD', 'BEFORE CALLING THE LIFT'], 1.3, 0.42, '#e2b93b', '#17140e', 140.6, B + 2.05, bz2 - 0.02, PI, 384, '#17140e');
  })();
  gather('basement');

  // ================= the lift: a caged platform on a hydraulic ram, basement to catwalks =================
  (function () {
    var q, B = BASE_Y, x1 = 136, x2 = 139, z1 = H.z1, z2 = 47.5, cx = 137.5, cz = 46.0, meshM = M.chain.clone(); meshM.map = chainTex.clone(); meshM.map.needsUpdate = true; meshM.map.repeat.set(8, 30);
    A.liftAt = { x: cx, z: cz, door: z2 };
    // the shaft: concrete in the basement, mesh from the gallery up; four corner guides right the way
    [[x1, z1], [x2, z1], [x1, z2], [x2, z2]].forEach(function (c) { box(0.14, CW + 2.6 - B, 0.14, EM.rustSteel, c[0] + (c[0] < cx ? 0.07 : -0.07), (B + CW + 2.6) / 2, c[1] + (c[1] < cz ? 0.07 : -0.07)); });
    var pm = mesh(new THREE.PlaneGeometry(z2 - z1, CW + 2.4), meshM, x1, (CW + 2.4) / 2, cz); pm.rotation.y = PI / 2; pm.userData.noCast = true;
    var pm2 = mesh(new THREE.PlaneGeometry(x2 - x1, CW - 2.25), meshM.clone(), cx, 2.25 + (CW - 2.25) / 2, z2); pm2.material.map = meshM.map.clone(); pm2.material.map.needsUpdate = true; pm2.material.map.repeat.set(8, 16); pm2.userData.noCast = true;
    [0, 2.25, 4.4, 6.5, CW, CW + 2.4].forEach(function (y) { box(0.08, 0.08, z2 - z1, EM.rustSteel, x1, y, cz); box(x2 - x1, 0.08, 0.08, EM.rustSteel, cx, y, z2); });
    solid(x1 - 0.1, x1 + 0.1, z1, z2, -0.3, CW + 2.6, true); solid(x1, x2, z2 - 0.1, z2 + 0.1, -0.3, CW - 0.3, true);                    // you cannot walk into the shaft from the gallery
    wb(x1 - 0.25, x1, B, -0.5, z1, z2 + 0.25, M2.bw, 4, 4, [B - 0.2, -0.4]); wb(x1, x1 + 0.4, B, -0.5, z2, z2 + 0.25, M2.bw, 4, 4, [B - 0.2, -0.4]); wb(x2 - 0.4, x2 + 0.5, B, -0.5, z2, z2 + 0.25, M2.bw, 4, 4, [B - 0.2, -0.4]);
    box(x2 - x1 - 0.8, 0.5, 0.25, M2.bw, cx, -0.75, z2 + 0.125); label(['SERVICE LIFT No. 1', 'KEEPERS ONLY  ·  500 kg'], 1.5, 0.34, '#e2b93b', '#17140e', cx, B + 2.5, z2 + 0.262, 0, 384, '#17140e');
    // the ram and the car
    cyl(0.22, 0.24, 1.2, M2.steel, cx, B - 0.5, cz, null, 16); A.ram = dyn(cyl(0.11, 0.11, 1, std(0xc8ced2, 0.15, { metalness: 0.95, envMap: envTex }), cx, B, cz, null, 16)); A.ram.geometry.translate(0, 0.5, 0);
    var car = A.car = dyn(new THREE.Group()); car.position.set(cx, B, cz); scene.add(car);
    var CWd = 2.5, CH = 2.3; box(CWd, 0.08, CWd, M2.steel, 0, 0.04, 0, car); mesh(new THREE.PlaneGeometry(CWd - 0.1, CWd - 0.1), M2.grate, 0, 0.085, 0, car).rotation.x = -PI / 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { box(0.07, CH, 0.07, M.yellow, c[0] * (CWd / 2 - 0.035), CH / 2, c[1] * (CWd / 2 - 0.035), car); });
    [0.95, CH].forEach(function (y) { box(CWd, 0.06, 0.06, M.yellow, 0, y, -CWd / 2 + 0.03, car); box(0.06, 0.06, CWd, M.yellow, -CWd / 2 + 0.03, y, 0, car); box(0.06, 0.06, CWd, M.yellow, CWd / 2 - 0.03, y, 0, car); });
    box(CWd, 0.06, 0.06, M.yellow, 0, CH, CWd / 2 - 0.03, car);
    var cm = M.chain.clone(); cm.map = chainTex.clone(); cm.map.needsUpdate = true; cm.map.repeat.set(12, 11);
    [[0, -CWd / 2 + 0.03, 0], [-CWd / 2 + 0.03, 0, PI / 2], [CWd / 2 - 0.03, 0, PI / 2]].forEach(function (pn) { var m = mesh(new THREE.PlaneGeometry(CWd, CH), cm, pn[0], CH / 2, pn[1], car); m.rotation.y = pn[2]; m.userData.noCast = true; });
    mesh(new THREE.PlaneGeometry(CWd, CWd), cm, 0, CH + 0.03, 0, car).rotation.x = PI / 2;
    // its gate: two mesh leaves that part
    A.gate = [-1, 1].map(function (sd) { var gl = dyn(new THREE.Group()); gl.position.set(sd * CWd / 4, 0, CWd / 2 - 0.03); car.add(gl); box(CWd / 2, 0.05, 0.05, M.yellow, 0, 0.12, 0, gl); box(CWd / 2, 0.05, 0.05, M.yellow, 0, CH - 0.2, 0, gl); box(0.05, CH - 0.3, 0.05, M.yellow, -sd * (CWd / 4 - 0.03), CH / 2 - 0.03, 0, gl); mesh(new THREE.PlaneGeometry(CWd / 2, CH - 0.35), cm, 0, CH / 2 - 0.03, 0, gl).userData.noCast = true; gl.userData.sd = sd; return gl; });
    // the pendant: a yellow box on a stalk, UP and DOWN
    var pd = new THREE.Group(); pd.position.set(CWd / 2 - 0.16, 1.25, 0.55); car.add(pd); box(0.1, 0.3, 0.16, M.yellow, 0, 0, 0, pd); cyl(0.012, 0.012, 1.0, M.rubber, 0, 0.6, 0, pd, 5);
    A.liftBtn = [dyn(cyl(0.028, 0.028, 0.024, std(0x1f8a3a, 0.5), -0.056, 0.07, 0, pd, 12)), dyn(cyl(0.028, 0.028, 0.024, std(0x8a1f1a, 0.5), -0.056, -0.07, 0, pd, 12))]; A.liftBtn.forEach(function (b) { b.rotation.z = PI / 2; });
    A.liftLamp = basic(0x1a0805, { fog: false }); mesh(new THREE.SphereGeometry(0.016, 8, 8), A.liftLamp, -0.055, 0, 0, pd).userData.keep = true; A.pendant = pd;
    var cl = basic(0x2a1c08, { fog: false }); A.carLamp = cl; box(0.3, 0.05, 0.12, cl, 0, CH - 0.05, -CWd / 2 + 0.2, car).userData.keep = true;
    light('lift', 0xffc070, cx, B + 2, cz, 8, 1.5);
    // the call station in the basement, beside the gate
    box(0.16, 0.3, 0.1, M.yellow, x1 + 0.2, B + 1.3, z2 + 0.3); A.callLamp = basic(0x3a0a06, { fog: false }); mesh(new THREE.SphereGeometry(0.03, 8, 8), A.callLamp, x1 + 0.2, B + 1.38, z2 + 0.355).userData.keep = true;
    A.callBtn = dyn(cyl(0.03, 0.03, 0.02, std(0x1c1c1c, 0.6), x1 + 0.2, B + 1.25, z2 + 0.355, null, 10)); A.callBtn.rotation.x = PI / 2;
    A.liftFloor = floor(x1 + 0.2, x2 - 0.2, z1 + 0.2, z2 + 0.1, B, null, null, 'grate');                 // the car's floor: its height follows the car
  })();
  gather('basement');

  // ================= over the water: the keepers' deck, the catwalk, the work platform =================
  (function () {
    var q, Y = CW, plate = std(0xffffff, 0.6, { metalness: 0.5, map: canvasTex(128, function (g, S) { g.fillStyle = '#5c6468'; g.fillRect(0, 0, S, S); for (var a = 0; a < 8; a++) for (var b = 0; b < 8; b++) { g.save(); g.translate(a * 16 + 8, b * 16 + 8); g.rotate((a + b) % 2 ? 0.785 : -0.785); g.fillStyle = 'rgba(190,200,204,.5)'; g.fillRect(-5, -1.2, 10, 2.4); g.restore(); } blotch(g, S, ['#5a3a22', '#2a2c2a'], 12, 6, 26, 0.5); }, 1, 1), bumpMap: bump(4), bumpScale: 0.02 });
    function deck(x1, x2, z1, z2, mat, tile, kind) { var m = mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat, (x1 + x2) / 2, Y, (z1 + z2) / 2); m.rotation.x = -PI / 2; var U = m.geometry.attributes.uv; for (var v = 0; v < U.count; v++) U.setXY(v, U.getX(v) * (x2 - x1) / tile, U.getY(v) * (z2 - z1) / tile); m.userData.noCast = true; return floor(x1, x2, z1, z2, Y, null, null, kind || 'grate'); }
    function beam(x1, z1, x2, z2, dy, w) { var len = Math.hypot(x2 - x1, z2 - z1), b = box(w || 0.1, 0.2, len, EM.rustSteel, (x1 + x2) / 2, Y - 0.11 + (dy || 0), (z1 + z2) / 2); b.rotation.y = Math.atan2(x2 - x1, z2 - z1); return b; }
    function hanger(x, z) { cyl(0.016, 0.016, H.h - Y - 1.7, M2.rail, x, (Y + H.h - 1.7) / 2, z, null, 5); }
    A.deckFn = deck;
    // the east deck, over the rear gallery: where the lift lets you out
    deck(T.x2, H.x2 + 0.5, 47.5, H.z2, M2.grate, 0.3); deck(T.x2, 136, H.z1, 47.5, M2.grate, 0.3);
    for (q = 0; q < 8; q++) beam(T.x2, 47 + q * 4, H.x2 + 0.5, 47 + q * 4); beam(T.x2 + 0.05, H.z1, T.x2 + 0.05, H.z2); beam(H.x2 + 0.4, 47.5, H.x2 + 0.4, H.z2);
    rail(T.x2 + 0.1, H.z1, T.x2 + 0.1, 59.3, Y, Y, { kick: 1 }); rail(T.x2 + 0.1, 60.7, T.x2 + 0.1, H.z2, Y, Y, { kick: 1 });
    wb(H.x2 + 0.5, H.x2 + 0.75, Y - 0.3, H.h, 47.5, H.z2, M2.conc, 4, 4, [Y - 0.5, H.h]); wb(136, H.x2 + 0.75, Y + 2.5, H.h, H.z1, 47.5, M2.conc, 4, 4);
    solid(H.x2, H.x2 + 0.75, H.z1, 47.5, Y - 0.5, H.h, true); solid(136 - 0.1, 136 + 0.1, H.z1, 47.5, Y - 0.5, H.h, true);
    label(['PLANT ROOM', 'NO ENTRY'], 0.8, 0.3, '#8d1f18', '#f1ecdd', H.x2 + 0.48, Y + 1.7, 66, -PI / 2, 256, '#f1ecdd'); box(0.06, 2.1, 1.0, M2.blue, H.x2 + 0.49, Y + 1.05, 66);
    // the spine: a metre and a half of grating straight across the tank, hung from the trusses, in three lengths with two breaks
    A.SPINE = { z1: 59.3, z2: 60.7, segs: [[128.6, T.x2], [122.4, 127.0], [113.4, 120.6]], gaps: [[127.0, 128.6], [120.6, 122.4]], last: [T.x1, 113.4] };
    A.SPINE.segs.forEach(function (sg) {
      deck(sg[0], sg[1], 59.3, 60.7, M2.grate, 0.3); beam(sg[0], 59.34, sg[1], 59.34); beam(sg[0], 60.66, sg[1], 60.66);
      for (var x = sg[0] + 0.3; x < sg[1]; x += 2.4) { hanger(x, 59.3); hanger(x, 60.7); beam(x, 59.3, x, 60.7, -0.02, 0.06); }
    });
    // rails along it, broken wherever a refuge opens off it
    A.REFUGE = [{ x1: 130.2, x2: 131.9, z1: 57.8, z2: 59.3, side: -1 }, { x1: 116.4, x2: 118.1, z1: 60.7, z2: 62.2, side: 1 }];
    [[128.6, T.x2, 59.3, [130.2, 131.9]], [128.6, T.x2, 60.7, null], [122.4, 127.0, 59.3, null], [122.4, 127.0, 60.7, null], [113.4, 120.6, 59.3, null], [113.4, 120.6, 60.7, [116.4, 118.1]]].forEach(function (r) {
      if (r[3]) { rail(r[0], r[2], r[3][0], r[2], Y, Y, { kick: 1 }); rail(r[3][1], r[2], r[1], r[2], Y, Y, { kick: 1 }); } else rail(r[0], r[2], r[1], r[2], Y, Y, { kick: 1 });
    });
    /* A keeper's refuge: a steel cage opening off the walk, bars too close for her head.  KEEPER REFUGE on the plate over it. */
    var bars = [];
    A.REFUGE.forEach(function (R) {
      deck(R.x1, R.x2, R.z1, R.z2, plate, 1, 'grate'); var zo = R.side < 0 ? R.z1 : R.z2, zi = R.side < 0 ? R.z2 : R.z1;
      for (var x = R.x1; x <= R.x2 + 0.01; x += 0.17) bars.push([x, Y + 1.1, zo, 1, 2.2, 1]);
      for (var z = Math.min(zo, zi); z <= Math.max(zo, zi) + 0.01; z += 0.17) { bars.push([R.x1, Y + 1.1, z, 1, 2.2, 1]); bars.push([R.x2, Y + 1.1, z, 1, 2.2, 1]); }
      box(R.x2 - R.x1 + 0.1, 0.05, R.z2 - R.z1 + 0.1, plate, (R.x1 + R.x2) / 2, Y + 2.22, (R.z1 + R.z2) / 2); box(R.x2 - R.x1 + 0.1, 0.08, 0.08, M.yellow, (R.x1 + R.x2) / 2, Y + 2.2, zi);
      label(['KEEPER REFUGE'], 1.2, 0.22, '#e2b93b', '#17140e', (R.x1 + R.x2) / 2, Y + 2.38, zi + R.side * -0.02, R.side < 0 ? 0 : PI, 256, '#17140e');
      solid(R.x1 - 0.06, R.x1 + 0.06, R.z1, R.z2, Y - 0.3, Y + 2.6, true); solid(R.x2 - 0.06, R.x2 + 0.06, R.z1, R.z2, Y - 0.3, Y + 2.6, true); solid(R.x1, R.x2, zo - 0.06, zo + 0.06, Y - 0.3, Y + 2.6, true);
      hanger(R.x1, zo); hanger(R.x2, zo);
    });
    WB.inst(new THREE.CylinderGeometry(0.016, 0.016, 1, 5), M2.rail, bars);
    // the broken ends: grating torn and hanging, a rail bent down toward the water
    A.SPINE.gaps.concat([[112.2, 113.4]]).forEach(function (g2, n) {
      var h1 = mesh(new THREE.PlaneGeometry(1.0, 1.4), M2.grate, g2[1] - 0.42, Y - 0.34, 60); h1.quaternion.setFromEuler(new THREE.Euler(0, 0, 0.72)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0))); h1.userData.noCast = true;
      var br = box(0.045, 0.045, 1.3, M2.rail, g2[1] - 0.5, Y + 0.6, 59.3); br.rotation.set(0.9, PI / 2, 0, 'YXZ'); var br2 = box(0.045, 0.045, 1.1, M2.rail, g2[0] + 0.45, Y + 0.3, 60.7); br2.rotation.set(-1.1, PI / 2, 0, 'YXZ');
    });
    // the work platform over the front glass: chequer plate on two columns and brackets off the tank's frame
    var P1 = 105.5, P2 = T.x1, PZ1 = 53, PZ2 = 67; A.PLAT = { x1: P1, x2: P2, z1: PZ1, z2: PZ2 };
    deck(P1, P2, PZ1, PZ2, plate, 1, 'grate'); box(P2 - P1, 0.24, 0.1, EM.rustSteel, (P1 + P2) / 2, Y - 0.13, PZ1 + 0.05); box(P2 - P1, 0.24, 0.1, EM.rustSteel, (P1 + P2) / 2, Y - 0.13, PZ2 - 0.05); box(0.1, 0.24, PZ2 - PZ1, EM.rustSteel, P1 + 0.05, Y - 0.13, 60); box(0.1, 0.24, PZ2 - PZ1, EM.rustSteel, P2 - 0.05, Y - 0.13, 60);
    for (q = 0; q < 6; q++) box(P2 - P1, 0.18, 0.08, EM.rustSteel, (P1 + P2) / 2, Y - 0.1, PZ1 + 1.2 + q * 2.4);
    [[P1 + 0.3, PZ1 + 0.4], [P1 + 0.3, PZ2 - 0.4]].forEach(function (c) { cyl(0.13, 0.15, Y - 0.24, EM.rustSteel, c[0], (Y - 0.24) / 2, c[1], null, 12); box(0.5, 0.06, 0.5, M2.steel, c[0], 0.03, c[1]); circles.push({ x: c[0], z: c[1], r: 0.22, top: Y - 0.4 }); });
    [PZ1 + 0.4, 60, PZ2 - 0.4].forEach(function (z) { var bk = box(0.1, 0.1, 3.4, EM.rustSteel, T.x1 - 0.9, Y - 1.5, z); bk.rotation.set(0.95, PI / 2, 0, 'YXZ'); });
    rail(P1, PZ1, P2, PZ1, Y, Y, { kick: 1 }); rail(P1, PZ2, P2, PZ2, Y, Y, { kick: 1 }); rail(P1, PZ1, P1, 65.7, Y, Y, { kick: 1 }); rail(P2, PZ1, P2, 59.3, Y, Y, { kick: 1 }); rail(P2, 60.7, P2, 64.1, Y, Y, { kick: 1 }); rail(P2, 65.1, P2, PZ2, Y, Y, { kick: 1 });
    A.platGate = solid(P2 - 0.08, P2 + 0.08, 59.3, 60.7, Y - 0.3, Y + 1.6, true);                                                     // the open end where the walk used to join: you do not walk off it
    // the bench: the key piece lies on it (world.js puts it there), under a lamp on a bent arm
    var KX = ZONES[0].key[0], KZ = ZONES[0].key[1];
    wb(KX - 1.2, KX + 1.2, Y + 0.86, Y + 0.92, KZ - 0.4, KZ + 0.4, M2.steel, 1, 1); [[-1.1, -0.32], [1.1, -0.32], [-1.1, 0.32], [1.1, 0.32]].forEach(function (l) { box(0.05, 0.86, 0.05, M2.steel, KX + l[0], Y + 0.43, KZ + l[1]); }); wb(KX - 1.15, KX + 1.15, Y + 0.3, Y + 0.33, KZ - 0.36, KZ + 0.36, M2.steel, 1, 1);
    solid(KX - 1.2, KX + 1.2, KZ - 0.4, KZ + 0.4, Y - 0.3, Y + 1.4, true); A.bench = { x: KX, z: KZ, y: Y + 0.92 };
    box(0.22, 0.16, 0.14, std(0x2f4a5a, 0.6, { metalness: 0.5 }), KX - 0.95, Y + 1.0, KZ - 0.22); box(0.1, 0.1, 0.24, M2.steel, KX - 0.95, Y + 1.09, KZ - 0.2);                         // a vice
    box(0.34, 0.012, 0.24, std(0xd9d2b8, 0.9), KX + 0.75, Y + 0.928, KZ + 0.1).rotation.y = 0.2; box(0.3, 0.02, 0.04, M.dark, KX + 0.75, Y + 0.94, KZ + 0.2).rotation.y = 0.2;                 // a clipboard
    cyl(0.04, 0.035, 0.09, M2.white, KX + 0.4, Y + 0.965, KZ - 0.24, null, 10); box(0.3, 0.03, 0.035, M.red, KX - 0.4, Y + 0.935, KZ + 0.24).rotation.y = -0.3; cyl(0.012, 0.012, 0.26, M2.rail, KX - 0.25, Y + 0.932, KZ + 0.05, null, 5).rotation.set(PI / 2, 0, 0.6);
    cyl(0.07, 0.09, 0.03, M.dark, KX + 1.02, Y + 0.935, KZ - 0.28, null, 10); cyl(0.012, 0.012, 0.5, M.dark, KX + 1.02, Y + 1.18, KZ - 0.28, null, 5); var arm = cyl(0.012, 0.012, 0.42, M.dark, KX + 0.85, Y + 1.47, KZ - 0.2, null, 5); arm.rotation.set(0.5, 0, 1.0);
    A.benchLamp = basic(0x2a2008, { fog: false }); var shd = mesh(new THREE.ConeGeometry(0.1, 0.13, 10, 1, true), std(0x2f5a3a, 0.6, { side: THREE.DoubleSide }), KX + 0.66, Y + 1.5, KZ - 0.1); shd.rotation.x = 0.4; mesh(new THREE.SphereGeometry(0.04, 8, 8), A.benchLamp, KX + 0.66, Y + 1.46, KZ - 0.09).userData.keep = true;
    light('bench', 0xffd9a0, KX + 0.5, Y + 1.5, KZ + 0.4, 9, 1.5);
    // lockers, a board, buckets and poles: somebody's place of work
    for (q = 0; q < 3; q++) { wb(P1 + 0.12, P1 + 0.62, Y, Y + 1.85, 61.2 + q * 0.62, 61.78 + q * 0.62, M2.blue, 2, 2); box(0.02, 0.1, 0.03, M2.rail, P1 + 0.635, Y + 1.0, 61.7 + q * 0.62); if (q === 1) { var ld = box(0.03, 1.7, 0.56, M2.blue, P1 + 0.9, Y + 0.93, 62.44); ld.rotation.y = 1.1; } }
    solid(P1, P1 + 0.64, 61.2, 63.1, Y - 0.3, Y + 2.2, true);
    var wbd = mesh(new THREE.PlaneGeometry(1.5, 1.0), std(0xffffff, 0.5, { map: canvasTex(512, function (g, S, HH2) {
      g.fillStyle = '#e6e8e2'; g.fillRect(0, 0, S, HH2); var hand = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'; g.fillStyle = '#1b3f8f'; g.font = 'bold 34px ' + hand; g.fillText('WALKWAY RULES', 20, 44);
      g.font = '24px ' + hand; ['1. TWO keepers. Always.', '2. Feed from the REFUGE. Never the rail.', '3. If she goes quiet, get in a cage.', '4. A light in her eye buys you seconds.'].forEach(function (l, n) { g.fillStyle = n === 2 ? '#a8231c' : '#1a1a1a'; g.fillText(l, 20, 92 + n * 40); });
      g.fillStyle = '#a8231c'; g.font = 'bold 26px ' + hand; g.fillText('WEST SPAN IS OUT — DO NOT CROSS', 20, 276); g.fillStyle = '#1a1a1a'; g.font = '20px ' + hand; g.fillText('ladder is winched up. Lower it from the dive station.', 20, 312);
      g.strokeStyle = 'rgba(40,40,40,.25)'; for (var n2 = 0; n2 < 30; n2++) { g.beginPath(); var x = Math.random() * S, y = Math.random() * HH2; g.moveTo(x, y); g.lineTo(x + 30 + Math.random() * 60, y + (Math.random() - 0.5) * 10); g.stroke(); } grime(g, S, HH2, 0.8);
    }, 1, 1, true, 340) }), P1 + 0.03, Y + 1.55, 57.6); wbd.rotation.y = PI / 2; wbd.userData.noCast = true; box(0.03, 1.08, 1.58, M2.rail, P1 + 0.012, Y + 1.55, 57.6); [56.9, 58.3].forEach(function (z) { box(0.04, 1.6, 0.04, M2.rail, P1 + 0.02, Y + 0.8, z); });
    [[108.9, 54.0], [109.3, 54.5], [108.6, 54.7]].forEach(function (b, n) { cyl(0.15, 0.12, 0.28, std([0x3a5f8a, 0x8a2a22, 0xd8d2c2][n], 0.6), b[0], Y + 0.14, b[1], null, 12); }); circles.push({ x: 109, z: 54.4, r: 0.45, top: Y + 0.6 });
    [0, 1, 2].forEach(function (n) { var pl = cyl(0.016, 0.016, 2.6, M.wood, 109.75, Y + 1.25, 55.6 + n * 0.14, null, 5); pl.rotation.z = 0.12; mesh(new THREE.TorusGeometry(0.07, 0.012, 5, 10, 3.6), M2.rail, 109.6, Y + 2.56, 55.6 + n * 0.14).rotation.y = PI / 2; });
    var lr = mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 18), std(0xc8501e, 0.7), P2 - 0.1, Y + 0.72, 57.2); lr.rotation.y = PI / 2;
    label(['TWO KEEPERS ON THE WALKWAY', 'AT ALL TIMES'], 1.3, 0.34, '#e2b93b', '#17140e', P1 + 0.03, Y + 2.3, 60, PI / 2, 384, '#17140e');
    // ---- the two ladders ----
    /* Down the inside of the front glass to the water: its bottom three metres are a section that is kept winched up out of
       her reach (A.ladderDrop slides down when the tank has power).  And the keepers' way up from the hall, in a hooped cage
       with a gate at the foot that only opens from inside. */
    function ladder(x, z, y1, y2, parent, ox) { var g2 = parent || scene, n = Math.round((y2 - y1) / 0.3); box(0.045, y2 - y1, 0.045, M.yellow, (ox || 0) + x, (y1 + y2) / 2, z - 0.24, g2); box(0.045, y2 - y1, 0.045, M.yellow, (ox || 0) + x, (y1 + y2) / 2, z + 0.24, g2); for (var r = 0; r <= n; r++) cyl(0.014, 0.014, 0.48, M2.rail, (ox || 0) + x, y1 + 0.12 + r * (y2 - y1 - 0.2) / n, z, g2, 6).rotation.x = PI / 2; }
    A.L1 = { x: T.x1 + 0.42, z: 64.6, top: Y, foot: T.water - 0.6 }; ladder(A.L1.x, A.L1.z, 6.9, Y + 1.1);
    A.ladderDrop = dyn(new THREE.Group()); scene.add(A.ladderDrop); ladder(A.L1.x, A.L1.z, 0, 3.4, A.ladderDrop, 0.05); A.ladderDrop.userData.up = 6.6; A.ladderDrop.userData.down = T.water - 0.7;
    box(0.5, 0.3, 0.3, M.yellow, A.L1.x - 0.2, Y + 1.3, A.L1.z + 0.5); cyl(0.1, 0.1, 0.36, M2.steel, A.L1.x - 0.2, Y + 1.3, A.L1.z + 0.5, null, 12).rotation.x = PI / 2;                    // its winch
    A.L2 = { x: P1 - 0.3, z: 66.35, top: Y, foot: 0 }; ladder(A.L2.x, A.L2.z, 0, Y + 1.1);
    for (q = 0; q < 10; q++) { var hp = mesh(new THREE.TorusGeometry(0.38, 0.016, 5, 14, PI * 1.5), M2.rail, A.L2.x - 0.3, 2.4 + q * 0.62, A.L2.z); hp.rotation.set(PI / 2, 0, PI * 0.75); }
    for (q = 0; q < 3; q++) { var a3 = PI * 0.75 + q * PI * 0.75; box(0.02, Y - 2.2, 0.02, M2.rail, A.L2.x - 0.3 + Math.cos(a3 + PI / 2) * 0.38, (Y + 2.4) / 2, A.L2.z + Math.sin(a3 + PI / 2) * 0.38); }
    A.cageGate = dyn(new THREE.Group()); A.cageGate.position.set(A.L2.x - 0.72, 0, A.L2.z - 0.42); scene.add(A.cageGate); for (q = 0; q < 6; q++) box(0.02, 2.2, 0.02, M.yellow, 0, 1.1, q * 0.168, A.cageGate); box(0.03, 0.04, 0.86, M.yellow, 0, 2.2, 0.42, A.cageGate); box(0.03, 0.04, 0.86, M.yellow, 0, 0.1, 0.42, A.cageGate); box(0.05, 0.14, 0.08, M.gold, 0.02, 1.1, 0.8, A.cageGate);
    [[A.L2.x - 0.72, A.L2.z - 0.42], [A.L2.x - 0.72, A.L2.z + 0.42]].forEach(function (c) { box(0.05, 2.3, 0.05, M.yellow, c[0], 1.15, c[1]); });
    box(0.02, 2.2, 0.02, M.yellow, A.L2.x - 0.36, 1.1, A.L2.z - 0.42); box(0.02, 2.2, 0.02, M.yellow, A.L2.x - 0.36, 1.1, A.L2.z + 0.42); for (q = 0; q < 4; q++) { box(0.72, 0.02, 0.02, M.yellow, A.L2.x - 0.36, 0.3 + q * 0.62, A.L2.z - 0.42); box(0.72, 0.02, 0.02, M.yellow, A.L2.x - 0.36, 0.3 + q * 0.62, A.L2.z + 0.42); }
    A.cageBox = solid(A.L2.x - 0.8, A.L2.x + 0.1, A.L2.z - 0.5, A.L2.z + 0.5, -0.3, 2.6, true);
    label(['KEEPERS ONLY', 'GATE OPENS FROM INSIDE'], 0.6, 0.22, '#8d1f18', '#f1ecdd', A.L2.x - 0.74, 1.7, A.L2.z, -PI / 2, 256, '#f1ecdd');
    // the dive station: a platform at the water on the south side, an insulated mat, the cabinet with the tank's main breaker
    var D1 = 119, D2 = 123, DZ = 68.4, DY = T.water + 0.16; A.DIVE = { x1: D1, x2: D2, z1: DZ, z2: T.z2 - 0.25, y: DY };
    A.diveFloor = floor(D1, D2, DZ, T.z2 - 0.25, DY, null, null, 'grate');
    var dp = mesh(new THREE.PlaneGeometry(D2 - D1, T.z2 - 0.25 - DZ), plate, (D1 + D2) / 2, DY, (DZ + T.z2 - 0.25) / 2); dp.rotation.x = -PI / 2; dp.userData.noCast = true;
    box(D2 - D1, 0.2, 0.1, EM.rustSteel, (D1 + D2) / 2, DY - 0.11, DZ + 0.05); [D1 + 0.05, D2 - 0.05].forEach(function (x) { box(0.1, 0.2, T.z2 - 0.25 - DZ, EM.rustSteel, x, DY - 0.11, (DZ + T.z2 - 0.25) / 2); var st = box(0.1, 0.1, 3.2, A.wetMats.steel, x, DY - 1.4, DZ + 1.2); st.rotation.x = -0.9; });
    var mat2 = mesh(new THREE.PlaneGeometry(1.5, 1.3), std(0x17181a, 0.95, { bumpMap: bump(10), bumpScale: 0.03 }), D2 - 1.0, DY + 0.012, T.z2 - 1.05); mat2.rotation.x = -PI / 2; mat2.userData.noCast = true;
    label(['INSULATING MAT 1000 V'], 0.9, 0.12, '#17181a', '#e2b93b', D2 - 1.0, DY + 0.016, T.z2 - 0.5, 0, 256).rotation.x = -PI / 2;
    var cab = new THREE.Group(); cab.position.set(D2 - 1.0, DY, T.z2 - 0.42); scene.add(cab); A.cab = cab;
    box(0.9, 1.5, 0.3, std(0x8a8f8c, 0.6, { metalness: 0.4, map: rustTex }), 0, 0.95, 0, cab); box(0.96, 0.05, 0.36, M.dark, 0, 1.72, 0, cab); box(0.06, 0.4, 0.06, M2.steel, -0.3, 0.1, 0, cab); box(0.06, 0.4, 0.06, M2.steel, 0.3, 0.1, 0, cab);
    mesh(new THREE.PlaneGeometry(0.8, 0.26), std(0xffffff, 0.7, { map: textTex(['TANK LIGHTING & PLANT', 'MAIN FEEDER  480 V'], 384, 120, '#e2b93b', '#17140e', '#17140e', false) }), 0, 1.5, -0.152, cab).rotation.y = PI;
    mesh(new THREE.PlaneGeometry(0.8, 0.22), std(0xffffff, 0.7, { map: textTex(['DANGER  ISOLATE BEFORE DIVING', 'A FAULT PUTS THE WATER LIVE'], 384, 104, '#8d1f18', '#f1ecdd', '#f1ecdd', false) }), 0, 0.5, -0.152, cab).rotation.y = PI;
    A.breaker = dyn(new THREE.Group()); A.breaker.position.set(-0.12, 1.0, -0.16); cab.add(A.breaker); box(0.07, 0.07, 0.34, M.dark, 0, 0, -0.17, A.breaker); box(0.11, 0.11, 0.09, M.red, 0, 0, -0.36, A.breaker);
    box(0.2, 0.44, 0.03, M.dark, -0.12, 1.0, -0.158, cab); A.brkLamp = basic(0x3a0a06, { fog: false }); mesh(new THREE.SphereGeometry(0.03, 8, 8), A.brkLamp, 0.2, 1.2, -0.16, cab).userData.keep = true; A.ladLamp = basic(0x0a1a0c, { fog: false }); mesh(new THREE.SphereGeometry(0.03, 8, 8), A.ladLamp, 0.2, 0.86, -0.16, cab).userData.keep = true;
    mesh(new THREE.PlaneGeometry(0.26, 0.07), std(0xffffff, 0.7, { map: textTex(['LIVE'], 128, 36, '#17140e', '#e2b93b', null, false) }), 0.2, 1.3, -0.152, cab).rotation.y = PI; mesh(new THREE.PlaneGeometry(0.26, 0.07), std(0xffffff, 0.7, { map: textTex(['LADDER WINCH'], 128, 36, '#17140e', '#e2b93b', null, false) }), 0.2, 0.96, -0.152, cab).rotation.y = PI;
    solid(D2 - 1.5, D2 - 0.5, T.z2 - 0.62, T.z2 - 0.2, DY - 0.3, DY + 2, true);
    A.beacon = basic(0x402008, { fog: false }); cyl(0.03, 0.03, 0.5, M2.steel, D1 + 0.25, DY + 2.0, T.z2 - 0.4, null, 6); mesh(new THREE.SphereGeometry(0.09, 10, 8), A.beacon, D1 + 0.25, DY + 2.3, T.z2 - 0.4).userData.keep = true; box(0.05, 2.3, 0.05, M2.steel, D1 + 0.25, DY + 1.15, T.z2 - 0.34);
    light('dive', 0xffa030, (D1 + D2) / 2, DY + 1.9, T.z2 - 1.0, 13, 1.4);
    rail(D1, T.z2 - 0.3, D1, DZ + 1.0, DY, DY, { collide: false }); rail(D2, T.z2 - 0.3, D2, DZ + 1.0, DY, DY, { collide: false });
    label(['DIVE STATION', 'NO DIVER ENTERS ALONE'], 1.2, 0.3, '#1d4a58', '#e9e2d0', D1 + 1.2, DY + 1.9, T.z2 - 0.27, PI, 384, '#7fd6e8');
    // the feeder: a cable tray under the trusses down the length of the walk, and lamps hung off it
    box(T.x2 - T.x1 + 6, 0.05, 0.3, M2.steel, (T.x1 + T.x2) / 2 - 1, H.h - 1.9, 60.0); var fd = cyl(0.045, 0.045, T.x2 - T.x1 + 6, M.rubber, (T.x1 + T.x2) / 2 - 1, H.h - 1.84, 60.0, null, 8); fd.rotation.z = PI / 2;
    A.lamps = [];
    [[136.5, 55], [136.5, 68], [130.9, 60], [124.7, 60], [117.5, 60], [108, 57], [108, 64]].forEach(function (lp, n) {
      cyl(0.008, 0.008, H.h - 2 - (Y + 2.9), M.dark, lp[0], (H.h - 2 + Y + 2.9) / 2, lp[1], null, 4); mesh(new THREE.ConeGeometry(0.28, 0.22, 12, 1, true), std(0x2f5a3a, 0.6, { side: THREE.DoubleSide, metalness: 0.3 }), lp[0], Y + 2.9, lp[1]);
      var bm = basic(0x1c1508, { fog: false }); mesh(new THREE.SphereGeometry(0.075, 8, 8), bm, lp[0], Y + 2.82, lp[1]).userData.keep = true; A.lamps.push({ mat: bm, x: lp[0], z: lp[1], ph: n * 1.7 });
    });
    light('cwE', 0xffd9a0, 136.5, Y + 2.5, 60, 16, 1.4); light('cwM', 0xffd9a0, 124.7, Y + 2.5, 60, 16, 1.4); light('cwW', 0xffd9a0, 108, Y + 2.5, 60, 15, 1.4); light('emerg', 0xff2a1a, 122, Y + 2, 60, 30, 1.2);
    // the torn end of the feeder, where the last span came down: it hangs to the water (dead, while the breaker is out)
    A.cable = dyn(new THREE.Group()); scene.add(A.cable); A.cable.visible = false; A.cable.userData.keep = true;
    tube([[113.2, H.h - 1.86, 60.0, 0.045, 0.045], [112.6, H.h - 3.2, 60.2, 0.045, 0.045], [112.9, 8.2, 60.5, 0.045, 0.045], [113.4, 5.6, 60.3, 0.045, 0.045], [113.1, T.water - 0.5, 60.6, 0.045, 0.045]], M.rubber, A.cable, 6, 6);
    A.cableEnd = new THREE.Vector3(113.1, T.water, 60.6);
    A.arc = dyn(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(200,230,255,1)', 'rgba(110,170,255,.35)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }))); A.arc.position.copy(A.cableEnd); A.arc.scale.set(3, 3, 1); scene.add(A.arc);
    // the span that falls: hinged where it is still bolted (it hangs level until the moment it lets go)
    A.span = dyn(new THREE.Group()); A.span.position.set(T.x1, Y, 60); scene.add(A.span); A.span.userData.keep = true;
    var sp1 = mesh(new THREE.PlaneGeometry(0.85, 1.4), M2.grate, 0.42, 0, 0, A.span); sp1.rotation.x = -PI / 2; sp1.userData.noCast = true; box(0.85, 0.2, 0.08, EM.rustSteel, 0.42, -0.11, -0.66, A.span); box(0.85, 0.2, 0.08, EM.rustSteel, 0.42, -0.11, 0.66, A.span); A.spanEdge = box(0.08, 0.2, 1.4, EM.rustSteel, 0.82, -0.11, 0, A.span);
    A.STUB = T.x1 + 0.86;                          // the edge you catch
  })();
  gather('upper');

  // ================= finishing: every rail's posts and bars, in two draws =================
  A.finish = function () {
    var d = new THREE.Object3D(), pm, bm; d.rotation.order = 'YXZ';
    pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), M2.rail, railPosts.length);
    railPosts.forEach(function (p, n) { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, 0, 0); d.scale.set(1, p[4], 1); d.updateMatrix(); pm.setMatrixAt(n, d.matrix); });
    bm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.045, 1), M2.rail, railBars.length);
    railBars.forEach(function (p, n) { d.position.set(p[0], p[1], p[2]); d.rotation.set(p[6], p[7], 0); d.scale.set(p[3], p[4], p[5]); d.updateMatrix(); bm.setMatrixAt(n, d.matrix); });
    pm.frustumCulled = bm.frustumCulled = false; scene.add(pm); scene.add(bm); gather('rails');
  };
  A.gather = gather; A.light = light; A.mark = function () { n0 = scene.children.length; };      // (other files add to the scene in between: only what is built after mark() is gathered)
  return A;
})();
