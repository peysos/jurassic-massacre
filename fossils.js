/* Jurassic Massacre — fossils.
   Five optional collectables lying about the park, each on a slab of its own rock with a faint glow.
   What you have found is remembered in the browser (not in the save), and shown in the Fossil Log on the menu and pause screens. */
'use strict';

var Fossils = (function () {
  var F = {}, items = [], logEl = null;
  var LIST = [
    { id: 'trilobite', name: 'Trilobite', at: [-13.5, 147.3], fact: '521 million years old. One of the first animals on Earth with eyes.', hint: 'Not far from where you came in.' },
    { id: 'ammonite', name: 'Ammonite', at: [86.4, 75.5], fact: 'A coiled cousin of the squid. It died out with the dinosaurs.', hint: 'The aquarium kept more than fish.' },
    { id: 'megalodon', name: 'Megalodon tooth', at: [12.6, -25.6], fact: 'From a shark as long as a bus. Its teeth reached 18 cm.', hint: 'Behind the wreck in the plaza.' },
    { id: 'claw', name: 'Raptor claw', at: [-62.8, 102.4], fact: 'The sickle claw. Held clear of the ground to keep it sharp.', hint: 'The paddock still holds one of its own.' },
    { id: 'anomalocaris', name: 'Anomalocaris', at: [-54.4, -81.4], fact: 'The “abnormal shrimp”: top predator of the Cambrian seas.', hint: 'North, by the sign for the flyers.' }
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
