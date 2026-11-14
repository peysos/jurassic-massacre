/* Jurassic Massacre — fossils.
   Five optional collectables lying about the park, each on a slab of its own rock with a faint glow.
   What you have found is remembered in the browser (not in the save), and shown in the Fossil Log on the menu and pause screens. */
'use strict';

var Fossils = (function () {
  var F = {}, items = [], logEl = null;
  var LIST = [
    { id: 'trilobite', name: 'Trilobite', at: [-13.5, 147.3], fact: '521 million years old. One of the first animals on Earth with eyes.', hint: 'Not far from where you came in.' },
    { id: 'ammonite', name: 'Ammonite', at: [86.3, 68.1], fact: 'A coiled cousin of the squid. It died out with the dinosaurs.', hint: 'The aquarium kept more than fish.' },
    { id: 'megalodon', name: 'Megalodon tooth', at: [12.6, -25.6], fact: 'From a shark as long as a bus. Its teeth reached 18 cm.', hint: 'Behind the wreck in the plaza.' },
    { id: 'claw', name: 'Raptor claw', at: [-62.8, 102.4], fact: 'The sickle claw. Held clear of the ground to keep it sharp.', hint: 'The paddock still holds one of its own.' },
    { id: 'anomalocaris', name: 'Anomalocaris', at: [-54.4, -81.4], fact: 'The “abnormal shrimp”: top predator of the Cambrian seas.', hint: 'North, by the sign for the flyers.' },
    { id: 'amber', name: 'Amber', at: [-101.6, 4.6], fact: 'Tree resin, 99 million years old. The mosquito inside never got away.', hint: 'Somebody left it outside the West Ranger Post.' },
    { id: 'egg', name: 'Dinosaur egg', at: [101.6, 4.6], fact: 'A hadrosaur egg. Laid in a mud nest, buried by a flood, never hatched.', hint: 'Outside the East Ranger Post.' },
    { id: 'rextooth', name: 'T. rex tooth', at: [62.6, -70.2], fact: 'Thick as a banana and serrated like a steak knife. Rex grew new ones all its life.', hint: 'The king sheds them. Look near the keeper’s lockbox.' },
    { id: 'fern', name: 'Fern frond', at: [-99.4, -105.6], fact: 'Pressed in mudstone 300 million years ago. Ferns are older than any dinosaur.', hint: 'Under a shelter, where the flyers roost.' },
    { id: 'spinoclaw', name: 'Spinosaurus claw', at: [-58.6, -19.4], fact: 'The thumb claw of a fish-eater bigger than T. rex. A hook for slippery prey.', hint: 'In the wetland mud, where its owner still fishes.' }
  ];
  F.LIST = LIST; F.items = items;
  function got(id) { return !!(prefs.fossils && prefs.fossils[id]); }
  F.count = function () { var n = 0; LIST.forEach(function (f) { if (got(f.id)) n++; }); return n; };

  // ---------- models ----------
  function freeSpot(x, z) {      // nudge off anything solid
    function clear(px, pz) { if (inBox(px, pz, 0.4)) return false; for (var i = 0; i < circles.length; i++) { var c = circles[i]; if (c.top === undefined && dist(px, pz, c.x, c.z) < c.r + 0.4) return false; } return true; }
    if (clear(x, z)) return [x, z];
    for (var r = 0.5; r <= 5; r += 0.5) for (var a = 0; a < 12; a++) { var px = x + Math.cos(a * 0.524) * r, pz = z + Math.sin(a * 0.524) * r; if (clear(px, pz)) return [px, pz]; }
    return [x, z];
  }
  function model(id, bone, g) {
    var k, grp = new THREE.Group(); grp.position.y = 0.062; g.add(grp);
    function blob(x, y, z, sx, sy, sz, parent) { var m = mesh(sphGeo, bone, x, y, z, parent || grp); m.scale.set(sx, sy, sz); return m; }
    if (id === 'trilobite') {
      for (k = 0; k < 10; k++) { var w = 0.2 * Math.sin((k + 1.4) / 11.5 * PI) + 0.04; blob(0, 0.012, 0.13 - k * 0.036, w * 2, 0.06, 0.055); blob(0, 0.03, 0.13 - k * 0.036, w * 0.62, 0.07, 0.055); }
      mesh(new THREE.SphereGeometry(0.5, 14, 8, 0, PI * 2, 0, PI / 2), bone, 0, 0, 0.17, grp).scale.set(0.36, 0.12, 0.22);
      [-1, 1].forEach(function (s) { blob(s * 0.085, 0.045, 0.18, 0.06, 0.05, 0.08); });
    } else if (id === 'ammonite') {
      [[0.15, 0.062], [0.078, 0.042], [0.03, 0.028]].forEach(function (r) { mesh(new THREE.TorusGeometry(r[0], r[1], 10, 26), bone, 0, 0.03, 0, grp).rotation.x = PI / 2; });
      for (k = 0; k < 16; k++) { var a = k / 16 * PI * 2, rib = box(0.012, 0.03, 0.11, bone, Math.cos(a) * 0.15, 0.075, Math.sin(a) * 0.15, grp); rib.rotation.y = -a + PI / 2; }
    } else if (id === 'megalodon') {
      var t = mesh(new THREE.ConeGeometry(0.13, 0.27, 3), std(0x4a4d52, 0.3, { emissive: 0x16181c, emissiveIntensity: 0.6 }), 0, 0.03, 0.05, grp); t.rotation.set(PI / 2, 0, 0); t.scale.set(1, 1, 0.28);
      blob(0, 0.03, -0.11, 0.3, 0.07, 0.13); blob(-0.09, 0.03, -0.15, 0.13, 0.065, 0.11); blob(0.09, 0.03, -0.15, 0.13, 0.065, 0.11);
    } else if (id === 'claw') {
      var c = new THREE.Group(); c.rotation.z = PI / 2; c.position.set(0.04, 0.045, -0.2); grp.add(c);
      tube([[0, 0, 0, 0.05, 0.06], [0, 0.1, 0.1, 0.046, 0.056], [0, 0.17, 0.24, 0.032, 0.042], [0, 0.15, 0.36, 0.014, 0.018], [0, 0.09, 0.43, 0.003, 0.003]], bone, c, 10, 5);
      blob(0, -0.01, -0.03, 0.14, 0.14, 0.12, c);
    } else if (id === 'amber') {
      var am = std(0xd9861a, 0.12, { transparent: true, opacity: 0.78, emissive: 0x7a3c06, emissiveIntensity: 0.7, metalness: 0.1 }), ink = std(0x120c06, 0.6);
      var nug = mesh(new THREE.DodecahedronGeometry(0.15, 1), am, 0, 0.1, 0, grp); nug.scale.set(1, 0.72, 1.25); nug.rotation.set(0.3, 0.5, 0.1);
      mesh(new THREE.DodecahedronGeometry(0.06, 1), am, 0.13, 0.05, -0.1, grp); mesh(new THREE.DodecahedronGeometry(0.04, 0), am, -0.15, 0.035, 0.09, grp);
      var bug = new THREE.Group(); bug.position.set(0, 0.105, 0.01); bug.rotation.set(0.3, 0.7, 0.2); grp.add(bug);       // the mosquito inside
      mesh(sphGeo, ink, 0, 0, 0, bug).scale.set(0.018, 0.018, 0.05); mesh(sphGeo, ink, 0, 0.004, 0.034, bug).scale.set(0.02, 0.02, 0.022); cyl(0.0015, 0.0015, 0.04, ink, 0, 0, 0.065, bug, 4).rotation.x = PI / 2;
      [-1, 1].forEach(function (s) { var wg = mesh(new THREE.PlaneGeometry(0.05, 0.016), std(0x2a1c0c, 0.4, { side: THREE.DoubleSide, transparent: true, opacity: 0.6 }), s * 0.028, 0.012, 0.0, bug); wg.rotation.set(-PI / 2, 0, s * 0.5); for (k = 0; k < 3; k++) cyl(0.001, 0.001, 0.05, ink, s * 0.02, -0.012, 0.02 - k * 0.014, bug, 3).rotation.z = s * 0.9; });
    } else if (id === 'egg') {
      var shell = std(0xb5a88a, 0.85, { emissive: 0x3a3320, emissiveIntensity: 0.35, bumpMap: bump(7), bumpScale: 0.02 }), dark = std(0x17130c, 1);
      var eg = mesh(new THREE.SphereGeometry(0.5, 20, 16), shell, 0, 0.11, 0, grp); eg.scale.set(0.23, 0.21, 0.36); eg.rotation.set(0.12, 0.4, 0);
      [[0.0, 0.212, 0.02, 0.13, 0.5], [0.03, 0.208, 0.07, 0.07, -0.7], [-0.03, 0.208, -0.02, 0.08, 1.3], [0.045, 0.2, -0.04, 0.06, 2.2]].forEach(function (cr) { var l = box(cr[3], 0.004, 0.006, dark, cr[0], cr[1], cr[2], grp); l.rotation.y = cr[4]; });    // the crack across the top
      [[0.19, 0.3], [-0.2, -0.12], [0.15, -0.22]].forEach(function (sh, n) { var fr = mesh(new THREE.SphereGeometry(0.5, 7, 4, 0, 1.6, 0, 0.7), shell, sh[0], 0.0, sh[1], grp); fr.scale.set(0.13, 0.1, 0.13); fr.rotation.set(n, n * 2, 0.3); });
    } else if (id === 'rextooth') {
      var enamel = std(0x4a3524, 0.25, { emissive: 0x1a1008, emissiveIntensity: 0.5, bumpMap: bump(2, 6), bumpScale: 0.006 }), tt = new THREE.Group(); tt.rotation.set(0, 0, PI / 2); tt.position.set(-0.03, 0.06, -0.24); grp.add(tt);
      tube([[0, 0, 0, 0.05, 0.06], [0, 0.015, 0.1, 0.055, 0.07], [0, 0.03, 0.2, 0.048, 0.064]], bone, tt, 12, 3);                                         // the root: two thirds of a rex tooth is hidden in the jaw
      tube([[0, 0.03, 0.2, 0.047, 0.063], [0, 0.05, 0.3, 0.04, 0.055], [0, 0.058, 0.4, 0.026, 0.038], [0, 0.045, 0.48, 0.01, 0.014], [0, 0.03, 0.5, 0.002, 0.003]], enamel, tt, 12, 5);
      for (k = 0; k < 9; k++) box(0.003, 0.005, 0.012, bone, 0, 0.115 - k * 0.003 + Math.sin(k / 9 * PI) * 0.012, 0.24 + k * 0.026, tt);              // serrations down the back edge
    } else if (id === 'fern') {
      var leaf = std(0x26221a, 0.7, { emissive: 0x100e08, emissiveIntensity: 0.4 }), plate = mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.035, 7), std(0x7a7260, 1, { bumpMap: bump(3), bumpScale: 0.04 }), 0, 0.02, 0, grp); plate.rotation.y = 0.4;
      tube([[0, 0.042, -0.22, 0.006, 0.004], [0.012, 0.042, 0, 0.005, 0.004], [-0.01, 0.042, 0.22, 0.002, 0.002]], leaf, grp, 5, 4);
      for (k = 0; k < 11; k++) [-1, 1].forEach(function (s) { var t2 = k / 10, ln = 0.11 * Math.sin(0.25 + t2 * 2.6) + 0.015, pn = mesh(sphGeo, leaf, s * ln * 0.46, 0.041, -0.2 + t2 * 0.4 + ln * 0.2, grp); pn.scale.set(ln * 1.05, 0.006, 0.03); pn.rotation.y = -s * 0.5; });
    } else if (id === 'spinoclaw') {
      var sc = new THREE.Group(); sc.rotation.z = PI / 2; sc.position.set(0.03, 0.05, -0.27); grp.add(sc);
      tube([[0, 0, -0.02, 0.055, 0.075], [0, 0.03, 0.12, 0.05, 0.07], [0, 0.07, 0.28, 0.038, 0.055], [0, 0.09, 0.42, 0.022, 0.032], [0, 0.075, 0.53, 0.008, 0.012], [0, 0.045, 0.58, 0.002, 0.002]], bone, sc, 12, 5);
      blob(0, -0.02, -0.05, 0.13, 0.19, 0.14, sc); blob(0, 0.07, -0.03, 0.09, 0.08, 0.1, sc);                                                        // the knuckle it turned on, and the flexor knob
      tube([[0.045, 0.02, 0.05, 0.004, 0.006], [0.048, 0.06, 0.28, 0.004, 0.005], [0.03, 0.082, 0.45, 0.002, 0.003]], std(0x4a4030, 0.8), sc, 4, 4);     // the blood groove
    } else {
      blob(0, 0.03, 0, 0.17, 0.07, 0.4);
      for (k = 0; k < 7; k++) [-1, 1].forEach(function (s) { var l = blob(s * (0.1 + Math.sin((k + 1) / 8 * PI) * 0.03), 0.02, 0.13 - k * 0.045, 0.14, 0.022, 0.06); l.rotation.y = s * 0.45; });
      [-1, 1].forEach(function (s) {
        tube([[s * 0.035, 0.035, 0.17, 0.02, 0.022], [s * 0.06, 0.06, 0.27, 0.017, 0.019], [s * 0.05, 0.035, 0.34, 0.01, 0.012], [s * 0.02, 0.01, 0.33, 0.003, 0.003]], bone, grp, 8, 4);
        cyl(0.008, 0.01, 0.06, bone, s * 0.07, 0.06, 0.14, grp, 6); blob(s * 0.07, 0.095, 0.14, 0.04, 0.04, 0.04);
      });
      for (k = -1; k <= 1; k++) { var f = blob(k * 0.045, 0.03, -0.24, 0.07, 0.02, 0.11); f.rotation.y = k * 0.5; }
    }
    return grp;
  }
  F.build = function () {
    var stone = std(0x4f4b42, 1, { bumpMap: bump(2), bumpScale: 0.07 });
    var glowTex = softTex('rgba(200,225,255,.6)', 'rgba(150,190,255,.16)');
    LIST.forEach(function (f, n) {
      var p = freeSpot(f.at[0], f.at[1]), g = new THREE.Group();
      var bone = std(0x8f8262, 0.7, { emissive: 0x3a2f16, emissiveIntensity: 0.35, bumpMap: bump(3), bumpScale: 0.012 });
      var slab = mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 9), stone, 0, 0.03, 0, g); slab.rotation.y = n * 1.1; slab.receiveShadow = true;
      model(f.id, bone, g).rotation.y = n * 0.9 + 0.4;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.14 }));
      sp.position.y = 0.16; sp.scale.set(0.95, 0.95, 1); g.add(sp);
      g.position.set(p[0], 0, p[1]); scene.add(g);
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      items.push({ f: f, g: g, glow: sp, x: p[0], z: p[1] });
    });
    buildLog(); F.refresh();
  };
  F.update = function (dt) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i]; if (!it.g.visible) continue;
      it.glow.material.opacity = 0.13 + 0.06 * Math.sin(playTime * 2.2 + i * 1.9);
      if (dist(player.x, player.z, it.x, it.z) < 1.5 && Math.abs(player.y) < 1) {
        prefs.fossils = prefs.fossils || {}; prefs.fossils[it.f.id] = 1; savePrefs(); it.g.visible = false;
        Sound.chime(); Sound.tone(880, 1320, 0.35, 0.12, 'triangle', 0.3);
        showMsg('Fossil found: ' + it.f.name + '  (' + F.count() + ' / ' + LIST.length + ').  ' + (F.count() === LIST.length ? 'The collection is complete.' : 'See the Fossil Log in the pause menu.'), 5);
        F.refresh();
      }
    }
  };

  // ---------- the Fossil Log ----------
  function art(id) {
    if (id === 'trilobite') return '<ellipse class="f" cx="50" cy="54" rx="25" ry="36"/><path class="f" d="M22 40a28 22 0 0 1 56 0q-28 12-56 0z"/>' +
      '<path class="l" d="M50 30v58M28 50h44M27 58h46M28 66h44M31 74h38M35 81h30M41 30q-3 6 0 12M59 30q3 6 0 12"/>';
    if (id === 'ammonite') { var d = '', i; for (i = 0; i <= 60; i++) { var a = i / 60 * PI * 5.2, r = 3 + i * 0.5; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (52 + Math.sin(a) * r).toFixed(1); }
      return '<circle class="f" cx="50" cy="52" r="38"/><path class="l" style="stroke-width:3.2" d="' + d + '"/><path class="l" d="M50 14v9M74 22l-5 8M88 46l-9 2M84 70l-8-4M64 87l-3-9M36 87l3-9M16 70l8-4M12 46l9 2M26 22l5 8"/>'; }
    if (id === 'megalodon') return '<path class="f" d="M50 92L24 34q26-12 52 0z"/><path class="f" d="M18 34q6-22 20-20 12 8 24 0 14-2 20 20-32-12-64 0z"/><path class="l" d="M50 88V40M30 40q20-8 40 0"/>';
    if (id === 'claw') return '<path class="f" d="M22 84q-10-52 58-70-34 26-30 72-14 6-28-2z"/><path class="l" d="M28 80q-4-40 40-58M22 84q14 8 28 2"/>';
    if (id === 'amber') return '<path class="f" d="M50 8q32 12 32 46 0 34-32 38-32-4-32-38 0-34 32-46z"/><ellipse class="l" cx="50" cy="56" rx="4" ry="11"/><circle class="l" cx="50" cy="40" r="4"/>' +
      '<path class="l" d="M50 36V24M47 48l-14-10M53 48l14-10M46 56l-16 2M54 56l16 2M47 64l-12 12M53 64l12 12M40 30q-8 8-4 18M60 30q8 8 4 18"/>';
    if (id === 'egg') return '<ellipse class="f" cx="50" cy="52" rx="29" ry="39"/><path class="l" d="M24 42l11 8 8-10 9 11 10-9 13 6M38 64l8 7 9-6 7 6M30 28q6-8 14-10"/>';
    if (id === 'rextooth') return '<path class="f" d="M30 8q34-4 40 22 6 36-24 62-2-30-14-44-10-14-2-40z"/><path class="l" d="M31 40q18 8 39-6M52 44q4 24-6 46M68 38l5 1M67 46l5 0M65 54l5-1M62 62l5-2M58 70l4-2"/>';
    if (id === 'fern') { var fd = '', fi; for (fi = 0; fi < 9; fi++) { var fy = 84 - fi * 8.4, fl = 6 + Math.sin(0.3 + fi / 8 * 2.5) * 22; fd += '<path class="f" d="M50 ' + fy + 'q' + (-fl * 0.5).toFixed(1) + ' -9 ' + (-fl).toFixed(1) + ' -7 ' + (fl * 0.4).toFixed(1) + ' 7 ' + fl.toFixed(1) + ' 7zM50 ' + fy + 'q' + (fl * 0.5).toFixed(1) + ' -9 ' + fl.toFixed(1) + ' -7 ' + (-fl * 0.4).toFixed(1) + ' 7 ' + (-fl).toFixed(1) + ' 7z"/>'; }
      return fd + '<path class="l" style="stroke-width:2.6" d="M50 96V8"/>'; }
    if (id === 'spinoclaw') return '<path class="f" d="M10 74q6-46 80-64-50 28-54 74-14 6-26-10z"/><ellipse class="f" cx="22" cy="80" rx="15" ry="11"/><path class="l" d="M18 68q10-34 56-50M10 74q12 14 26 10"/>';
    return '<ellipse class="f" cx="50" cy="56" rx="15" ry="32"/><path class="f" d="M35 40l-17-3 15 9zM34 49l-19 0 18 7zM34 58l-18 4 18 4zM35 67l-15 8 17-1zM65 40l17-3-15 9zM66 49l19 0-18 7zM66 58l18 4-18 4zM65 67l15 8-17-1zM40 84l-8 10 14-5zM60 84l8 10-14-5z"/>' +
      '<path class="f" d="M43 28q-12-8-10-20 4-2 6 4 0 8 9 12zM57 28q12-8 10-20-4-2-6 4 0 8-9 12z"/><circle class="f" cx="38" cy="30" r="5"/><circle class="f" cx="62" cy="30" r="5"/><path class="l" d="M38 44h24M36 53h28M36 62h28M38 71h24"/>';
  }
  function buildLog() {
    logEl = document.createElement('div'); logEl.id = 'fossilLog';
    logEl.innerHTML = '<div class="fl-box"><div class="fl-head"><span>FOSSIL LOG</span><b id="flCount"></b></div><div class="fl-grid" id="flGrid"></div><button id="flClose">Close</button></div>';
    document.body.appendChild(logEl);
    $('flClose').onclick = F.closeLog;
    logEl.addEventListener('pointerdown', function (e) { if (e.target === logEl) F.closeLog(); });
    window.addEventListener('keydown', function (e) { if (logEl.classList.contains('show') && (e.code === 'Escape' || e.code === 'KeyE')) { e.stopPropagation(); F.closeLog(); } }, true);
  }
  F.refresh = function () {
    var n = F.count();
    items.forEach(function (it) { it.g.visible = !got(it.f.id); });
    each('.fossilCount', function (el) { el.textContent = n + ' / ' + LIST.length; });
    if (!logEl) return;
    $('flCount').textContent = n + ' / ' + LIST.length;
    $('flGrid').innerHTML = LIST.map(function (f) {
      var have = got(f.id);
      return '<div class="fl-card' + (have ? ' have' : '') + '"><svg viewBox="0 0 100 100">' + art(f.id) + '</svg><h4>' + (have ? f.name : '? ? ?') + '</h4><p>' + (have ? f.fact : f.hint) + '</p></div>';
    }).join('');
  };
  F.openLog = function () { F.refresh(); logEl.classList.add('show'); };
  F.closeLog = function () { logEl.classList.remove('show'); };
  return F;
})();
