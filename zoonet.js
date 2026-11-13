/* Jurassic Massacre — the staff computer: "ZooOS", the park's office desktop of the time, drawn live on the monitor behind
   the gift shop counter (a 1024 x 768 canvas on the CRT's face, so what you see walking past is what is really on it).
   Sit at it and the view settles square onto the screen; the mouse moves an arrow pointer, clicks and drags windows, and
   the number keys type the password.  E (or Esc) stands you up.
   Start-up: BIOS lines, the boot logo, then the welcome screen with the staff accounts.  Logging on needs the FAMILYZOO
   domain, which lives on the network in the staff room: until that is patched back up the logon is refused (see staff.js).
   On the desktop: Entry Control (the ticket lanes' controller: release all four lanes, with a confirmation and a progress
   readout), Park Mail, the camera viewer, My Documents and the Trash.  What persists is in P.ent (booted, login, tries). */
'use strict';

var ZooNet = (function () {
  var Z = { open: false }, E = Entrance, SW = 1024, SH = 768, TB = 40;
  var cvs = document.createElement('canvas'); cvs.width = SW; cvs.height = SH;
  var g = cvs.getContext('2d'), tex = new THREE.CanvasTexture(cvs); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8; tex.minFilter = THREE.LinearFilter;
  // the CRT face: a gently bulged plane in place of the flat panel shop.js made, with a faint glass sheen in front
  (function () {
    var m = E.screen.mesh, geo = new THREE.PlaneGeometry(0.36, 0.27, 16, 12), p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i) / 0.18, y = p.getY(i) / 0.135; p.setZ(i, 0.007 * (1 - x * x * 0.55 - y * y * 0.55)); }
    geo.computeVertexNormals(); m.geometry.dispose(); m.geometry = geo; m.material = new THREE.MeshBasicMaterial({ map: tex, fog: false, color: 0xc2c2c2 });            // a CRT's whites are not the brightest thing in the room: kept under the bloom threshold
  })();
  E.drawScreen = function () { dirty = true; };

  // ---------- state ----------
  var phase = 'off', phT = 0, dirty = true, cur = { x: 512, y: 520 }, down = false, drag = null, wins = [], dialog = null, startOpen = false, balloon = null;
  var failT = 0, typed = '', userSel = false, note = '', lockT = 0, lastClick = { t: -9, id: null }, hover = null, busy = 0, unlockRun = null, camNoiseT = 0;
  var hits = [];                       // clickable rectangles laid out by the last draw: [x, y, w, h, action]
  var FONT = 'Tahoma, "Segoe UI", Verdana, sans-serif';
  function now() { return typeof playTime === 'number' ? playTime : performance.now() / 1000; }
  function hit(x, y, w, h, act) { hits.push([x, y, w, h, act]); return act && hover === act.id; }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
  function lin(x0, y0, x1, y1, stops) { var gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }
  function text(t, x, y, size, col, weight, align, max, shadow) {
    g.font = (weight || '') + ' ' + size + 'px ' + FONT; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
    if (shadow) { g.fillStyle = shadow; if (max) g.fillText(t, x + 1, y + 1, max); else g.fillText(t, x + 1, y + 1); }
    g.fillStyle = col; if (max) g.fillText(t, x, y, max); else g.fillText(t, x, y);
  }
  function wrap(t, x, y, w, size, col, lh, weight) {
    g.font = (weight || '') + ' ' + size + 'px ' + FONT; g.fillStyle = col; g.textAlign = 'left';
    var lines = []; t.split('\n').forEach(function (para) { var ln = ''; para.split(' ').forEach(function (wd) { var test = ln ? ln + ' ' + wd : wd; if (g.measureText(test).width > w && ln) { lines.push(ln); ln = wd; } else ln = test; }); lines.push(ln); });
    lines.forEach(function (l, i) { g.fillText(l, x, y + i * (lh || size * 1.35)); }); return lines.length;
  }
  function netUp() { return window.Staff && Staff.netUp(); }
  function lanesPowered() { return entCircuit(1); }

  // ---------- little drawn icons (32 px unless scaled) ----------
  var ICON = {
    entry: function (x, y, s) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); g.fillStyle = lin(0, 0, 0, 32, [[0, '#cfd6dc'], [1, '#7d8a94']]); rr(4, 6, 10, 22, 2); g.fill(); rr(18, 6, 10, 22, 2); g.fill(); g.strokeStyle = '#3a3f44'; g.lineWidth = 1; rr(4, 6, 10, 22, 2); g.stroke(); rr(18, 6, 10, 22, 2); g.stroke(); g.strokeStyle = '#c0c4c8'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(14, 14); g.lineTo(21, 14); g.stroke(); g.fillStyle = '#2fb85a'; g.beginPath(); g.moveTo(16, 1); g.lineTo(22, 6); g.lineTo(10, 6); g.fill(); g.restore(); },
    mail: function (x, y, s) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); g.fillStyle = lin(0, 6, 0, 28, [[0, '#ffffff'], [1, '#d9dde6']]); rr(2, 7, 28, 20, 2); g.fill(); g.strokeStyle = '#5a6a8a'; g.lineWidth = 1.2; rr(2, 7, 28, 20, 2); g.stroke(); g.beginPath(); g.moveTo(2.5, 8); g.lineTo(16, 19); g.lineTo(29.5, 8); g.stroke(); g.fillStyle = '#e2b93b'; g.beginPath(); g.arc(26, 9, 5, 0, 7); g.fill(); g.restore(); },
    cam: function (x, y, s) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); g.fillStyle = lin(0, 8, 0, 22, [[0, '#f2f2ee'], [1, '#a9aaa4']]); g.save(); g.translate(16, 14); g.rotate(-0.25); rr(-12, -6, 22, 12, 3); g.fill(); g.strokeStyle = '#555'; g.stroke(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(-12, 0, 4, 0, 7); g.fill(); g.restore(); g.fillStyle = '#777'; g.fillRect(19, 18, 3, 9); g.fillRect(14, 26, 13, 3); g.fillStyle = '#e03a2a'; g.beginPath(); g.arc(24, 11, 1.8, 0, 7); g.fill(); g.restore(); },
    docs: function (x, y, s) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); g.fillStyle = '#e8c35a'; rr(2, 9, 28, 19, 2); g.fill(); g.fillStyle = '#f6d878'; g.beginPath(); g.moveTo(2, 9); g.lineTo(12, 9); g.lineTo(15, 6); g.lineTo(2, 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(7, 11, 18, 4); g.fillStyle = lin(0, 13, 0, 28, [[0, '#ffe08a'], [1, '#e2a83a']]); rr(2, 13, 28, 15, 2); g.fill(); g.restore(); },
    trash: function (x, y, s) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); g.fillStyle = lin(8, 0, 24, 0, [[0, '#9fb4c8'], [0.5, '#e8f0f6'], [1, '#8aa2b8']]); g.beginPath(); g.moveTo(7, 9); g.lineTo(25, 9); g.lineTo(23, 29); g.lineTo(9, 29); g.closePath(); g.fill(); g.strokeStyle = '#4a6a86'; g.stroke(); g.fillStyle = '#c9d6e2'; g.fillRect(6, 6, 20, 3); g.fillStyle = '#2fb85a'; g.font = 'bold 9px Arial'; g.fillText('♻', 12, 22); g.restore(); },
    user: function (x, y, s, dim) { g.save(); g.translate(x, y); g.scale(s / 48, s / 48); g.fillStyle = dim ? '#8a9ab8' : lin(0, 0, 0, 48, [[0, '#ffb347'], [1, '#e2662a']]); rr(0, 0, 48, 48, 6); g.fill(); g.fillStyle = dim ? '#c9d2e2' : '#fff7e6'; rr(3, 3, 42, 42, 4); g.fill(); g.fillStyle = dim ? '#9aa6bc' : '#4f8a4a';           // a little green dinosaur
      g.beginPath(); g.ellipse(22, 32, 11, 7, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(28, 29); g.quadraticCurveTo(36, 18, 33, 11); g.quadraticCurveTo(39, 12, 36, 30); g.fill(); g.beginPath(); g.ellipse(35, 11, 5, 3.4, -0.3, 0, 7); g.fill(); g.fillRect(15, 36, 4, 7); g.fillRect(25, 36, 4, 7); g.beginPath(); g.moveTo(12, 31); g.lineTo(5, 36); g.lineTo(12, 35); g.fill(); if (!dim) { g.fillStyle = '#fff'; g.beginPath(); g.arc(36, 10, 1.4, 0, 7); g.fill(); } g.restore(); },
    warn: function (x, y, s, kind) { g.save(); g.translate(x, y); g.scale(s / 32, s / 32); if (kind === 'q') { g.fillStyle = lin(0, 0, 0, 32, [[0, '#7aa8ff'], [1, '#1e55d8']]); g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); text('?', 16, 25, 24, '#fff', 'bold', 'center'); } else if (kind === 'i') { g.fillStyle = lin(0, 0, 0, 32, [[0, '#7aa8ff'], [1, '#1e55d8']]); g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); text('i', 16, 25, 24, '#fff', 'bold', 'center'); } else { g.fillStyle = lin(0, 0, 0, 32, [[0, '#ff7a5a'], [1, '#c41a0c']]); g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(10, 10); g.lineTo(22, 22); g.moveTo(22, 10); g.lineTo(10, 22); g.stroke(); } g.restore(); }
  };

  // ---------- windows ----------
  var APPS = {
    entry: { title: 'FZ Entry Control 3.1 — Ticket Lanes', w: 560, h: 420, icon: 'entry' },
    mail: { title: 'Park Mail — Inbox', w: 600, h: 420, icon: 'mail' },
    cams: { title: 'CCTV Viewer — 4 cameras', w: 540, h: 400, icon: 'cam' },
    docs: { title: 'My Documents', w: 440, h: 300, icon: 'docs' },
    trash: { title: 'Trash', w: 380, h: 240, icon: 'trash' }
  };
  function openApp(id) {
    var w = wins.filter(function (o) { return o.id === id; })[0];
    if (!w) { var A = APPS[id], n = wins.length; w = { id: id, x: 150 + n * 34, y: 60 + n * 30, w: A.w, h: A.h, min: false }; if (id === 'entry') { w.x = 230; w.y = 80; } wins.push(w); Sfx.play('hdd', { vol: 0.12 }); }
    w.min = false; wins.splice(wins.indexOf(w), 1); wins.push(w); startOpen = false; dirty = true;
  }
  function closeWin(w) { wins.splice(wins.indexOf(w), 1); dirty = true; }
  function msgBox(title, body, kind, buttons, cb) { dialog = { title: title, body: body, kind: kind || 'i', buttons: buttons || ['OK'], cb: cb }; if (kind === 'x') Sound.tone(523, 523, 0.12, 0.07, 'triangle'), Sound.tone(392, 392, 0.22, 0.07, 'triangle', 0.1); else Sound.tone(784, 784, 0.1, 0.05, 'triangle'); dirty = true; }
  function frameWin(x, y, w, h, title, iconFn, active, closeAct, minAct) {
    // the frame: blue title bar with rounded top corners and a light top edge, a thin blue border, a beige client area
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = active ? '#0a4fd6' : '#7a96df'; rr(x, y, w, h, 8); g.fill(); g.restore();
    g.fillStyle = active ? lin(0, y, 0, y + 30, [[0, '#3d95ff'], [0.08, '#0a5fe8'], [0.5, '#0050e0'], [0.92, '#0a5fe8'], [1, '#0040c0']]) : lin(0, y, 0, y + 30, [[0, '#a8bff0'], [1, '#7a96df']]);
    g.save(); rr(x, y, w, 30, 8); g.clip(); g.fillRect(x, y, w, 30); g.restore();
    g.fillStyle = '#ece9d8'; g.fillRect(x + 4, y + 30, w - 8, h - 34);
    if (iconFn) iconFn(x + 7, y + 7, 16);
    text(title, x + 29, y + 20, 13, '#fff', 'bold', 'left', w - 110, active ? 'rgba(0,0,40,.6)' : null);
    // minimise and close
    var bx = x + w - 27;
    var hc = hit(bx, y + 4, 22, 22, closeAct); g.fillStyle = lin(0, y + 4, 0, y + 26, [[0, hc ? '#ff8a6a' : '#e86a4a'], [1, hc ? '#e0401c' : '#c4300c']]); rr(bx, y + 4, 22, 22, 4); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.2; rr(bx, y + 4, 22, 22, 4); g.stroke();
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(bx + 7, y + 11); g.lineTo(bx + 15, y + 19); g.moveTo(bx + 15, y + 11); g.lineTo(bx + 7, y + 19); g.stroke();
    if (minAct) { bx -= 25; var hm = hit(bx, y + 4, 22, 22, minAct); g.fillStyle = lin(0, y + 4, 0, y + 26, [[0, hm ? '#6aa8ff' : '#3c82f0'], [1, hm ? '#2a6ae8' : '#1a56d6']]); rr(bx, y + 4, 22, 22, 4); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.2; rr(bx, y + 4, 22, 22, 4); g.stroke(); g.fillStyle = '#fff'; g.fillRect(bx + 6, y + 17, 9, 3); }
  }
  function button(x, y, w, h, label, act, opts) {
    opts = opts || {}; var hv = hit(x, y, w, h, opts.disabled ? null : act);
    g.fillStyle = opts.disabled ? '#f2f1ea' : lin(0, y, 0, y + h, [[0, '#ffffff'], [0.85, hv ? '#f6e9c0' : '#ecebe6'], [1, '#d6d0c5']]); rr(x, y, w, h, 3); g.fill();
    g.strokeStyle = opts.disabled ? '#c9c7ba' : hv ? '#e8a33a' : '#003c74'; g.lineWidth = hv ? 2 : 1; rr(x + 0.5, y + 0.5, w - 1, h - 1, 3); g.stroke();
    text(label, x + w / 2, y + h / 2 + 5, opts.size || 12, opts.disabled ? '#a8a598' : '#000', opts.bold ? 'bold' : '', 'center', w - 8);
  }

  // ---------- the screens ----------
  function drawBios() {
    g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH);
    var lines = ['FZ-BIOS v2.14  (C) 1998 Westbury Systems', '', 'Pentium III 733 MHz', 'Memory Test :  262144K OK', '', 'Detecting IDE drives ...', '  Primary Master  : WDC WD200EB  20.0 GB', '  Secondary Master: CD-ROM 48X', '', 'Power source ......... AUXILIARY GENERATOR', 'Network adapter ...... 3Com EtherLink 10/100  ' + (netUp() ? 'LINK OK' : 'NO LINK'), '', 'Last shutdown was not clean.  Checking disk C: ...', '', 'Starting ZooOS ...'];
    var n = Math.min(lines.length, Math.floor(phT * 6)); for (var i = 0; i < n; i++) text(lines[i], 40, 60 + i * 26, 18, i === 10 && !netUp() ? '#ff6a5a' : '#c8c8c8', '', 'left');
    if (Math.floor(phT * 3) % 2) g.fillRect(40, 64 + n * 26, 12, 4);
  }
  function drawBoot() {
    g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH);
    // the boot logo: the park's leaf-and-footprint mark, the word mark, a progress strip of three moving blocks
    g.save(); g.translate(SW / 2 - 140, SH / 2 - 40);
    var cols = ['#e2662a', '#2fb85a', '#3d7fe8', '#e2b93b'];
    [[0, 0], [30, 0], [0, 30], [30, 30]].forEach(function (p, i) { g.save(); g.translate(p[0], p[1]); g.transform(1, 0, -0.18, 1, 0, 0); g.fillStyle = lin(0, 0, 0, 26, [[0, cols[i]], [1, '#000']]); rr(0, 0, 26, 26, 5); g.fill(); g.restore(); });
    text('ZooOS', 80, 40, 52, '#fff', 'bold italic', 'left'); text('Staff Edition', 84, 66, 18, '#e2b93b', 'italic', 'left');
    g.restore();
    g.fillStyle = '#000'; g.strokeStyle = '#b8b8b8'; g.lineWidth = 2; rr(SW / 2 - 90, SH / 2 + 70, 180, 18, 4); g.stroke();
    g.save(); rr(SW / 2 - 88, SH / 2 + 72, 176, 14, 3); g.clip();
    var off = (phT * 120) % 220 - 40; for (var b = 0; b < 3; b++) { g.fillStyle = lin(0, SH / 2 + 72, 0, SH / 2 + 86, [[0, '#9ac4ff'], [0.5, '#2a6ae8'], [1, '#0a3aa8']]); g.fillRect(SW / 2 - 88 + off + b * 12, SH / 2 + 73, 9, 12); }
    g.restore();
    text('Copyright © Family Zoo Ltd.', 30, SH - 30, 13, '#777', '', 'left');
  }
  function welcomeBg() {
    g.fillStyle = lin(0, 0, 0, SH, [[0, '#5a7edc'], [1, '#5a7edc']]); g.fillRect(0, 0, SW, SH);
    var rg = g.createRadialGradient(220, 170, 20, 220, 170, 520); rg.addColorStop(0, 'rgba(160,190,255,.55)'); rg.addColorStop(1, 'rgba(90,126,220,0)'); g.fillStyle = rg; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#00309c'; g.fillRect(0, 0, SW, 84); g.fillStyle = lin(0, 0, SW, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(160,190,255,.9)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 84, SW, 2);
    g.fillStyle = '#1d3a9c'; g.fillRect(0, SH - 90, SW, 90); g.fillStyle = lin(0, 0, SW, 0, [[0, 'rgba(255,150,60,0)'], [0.5, '#f59a3a'], [1, 'rgba(255,150,60,0)']]); g.fillRect(0, SH - 90, SW, 2);
    g.fillStyle = lin(0, 120, 0, SH - 120, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(SW / 2, 130, 1.5, SH - 260);
  }
  function drawWelcome() {
    welcomeBg();
    // left: the park's mark and the instruction
    g.save(); g.translate(150, 250); ICON.user(0, 0, 76); g.restore();
    text('Family Zoo', 242, 290, 46, '#fff', 'bold italic', 'left'); text('Staff Network', 246, 318, 18, '#dce6ff', '', 'left');
    text(phase === 'loggingIn' ? 'Welcome' : 'To begin, click your user name', 466, 410, phase === 'loggingIn' ? 30 : 17, '#fff', phase === 'loggingIn' ? 'bold italic' : '', 'right');
    if (phase === 'loggingIn') { text('Loading your personal settings...', SW / 2 + 40, 360, 16, '#fff', '', 'left'); return; }
    // right: the accounts
    var users = [['marla', 'Marla Voss', 'Head Keeper'], ['tickets', 'TICKETS1', 'Account disabled'], ['admin', 'Administrator', 'Locked by policy']];
    users.forEach(function (u, i) {
      var x = SW / 2 + 40, y = 200 + i * 96 + (userSel && i > 0 ? 70 : 0), sel = userSel && i === 0, dim = i > 0, act = i === 0 ? { id: 'user', fn: function () { if (!userSel) { userSel = true; typed = ''; note = ''; Sound.click(); } } } : { id: 'u' + i, fn: function () { msgBox('Logon', users[i][1] + ': ' + users[i][2] + '.', 'i'); } };
      var hv = hit(x - 8, y - 8, 360, sel ? 150 : 72, act);
      if (sel || hv) { g.fillStyle = sel ? lin(x, 0, x + 360, 0, [[0, '#00309c'], [1, 'rgba(0,48,156,0)']]) : 'rgba(0,48,156,.35)'; rr(x - 8, y - 8, 360, sel ? 150 : 72, 8); g.fill(); }
      ICON.user(x, y, 56, dim); if (sel || hv) { g.strokeStyle = '#ffb347'; g.lineWidth = 3; rr(x - 1, y - 1, 58, 58, 6); g.stroke(); }
      text(u[1], x + 72, y + 26, 20, dim ? '#c9d2e9' : '#fff', 'bold', 'left'); text(u[2], x + 72, y + 46, 13, dim ? '#b2bedc' : '#dce6ff', '', 'left');
      if (sel) {
        text('Type your password', x + 72, y + 76, 13, '#fff', '', 'left');
        g.fillStyle = '#fff'; rr(x + 72, y + 84, 170, 26, 4); g.fill(); g.strokeStyle = '#7a9ae8'; g.lineWidth = 1; rr(x + 72, y + 84, 170, 26, 4); g.stroke();
        for (var k = 0; k < typed.length; k++) { g.fillStyle = '#000'; g.beginPath(); g.arc(x + 86 + k * 14, y + 97, 4, 0, 7); g.fill(); }
        if (Math.floor(now() * 2) % 2 && !dialog) g.fillRect(x + 80 + typed.length * 14, y + 89, 1.5, 16);
        var ha = hit(x + 250, y + 83, 28, 28, { id: 'go', fn: submit });
        g.fillStyle = lin(0, y + 83, 0, y + 111, [[0, ha ? '#7ee07a' : '#5ccd56'], [1, '#2a8a26']]); rr(x + 250, y + 83, 28, 28, 6); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; rr(x + 250, y + 83, 28, 28, 6); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 258, y + 92); g.lineTo(x + 266, y + 92); g.lineTo(x + 266, y + 88); g.lineTo(x + 273, y + 97); g.lineTo(x + 266, y + 106); g.lineTo(x + 266, y + 102); g.lineTo(x + 258, y + 102); g.fill();
        if (lockT > 0 || note) {                                                       // the balloon under the password box
          var bx = x + 40, by = y + 124, bw = 300, bh = lockT > 0 ? 58 : 92;
          g.fillStyle = '#ffffe1'; rr(bx, by, bw, bh, 8); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; rr(bx, by, bw, bh, 8); g.stroke();
          g.fillStyle = '#ffffe1'; g.beginPath(); g.moveTo(bx + 50, by + 1); g.lineTo(bx + 60, by - 12); g.lineTo(bx + 72, by + 1); g.fill(); g.beginPath(); g.moveTo(bx + 50, by); g.lineTo(bx + 60, by - 12); g.lineTo(bx + 72, by); g.stroke();
          ICON.warn(bx + 10, by + 10, 18, 'x'); text(lockT > 0 ? 'Account locked' : 'Did you forget your password?', bx + 36, by + 24, 13, '#000', 'bold', 'left');
          wrap(lockT > 0 ? 'Too many attempts. Try again in ' + Math.ceil(lockT) + ' seconds.' : 'Please type your password again.  Password hint: “my girl’s tag number”', bx + 12, by + 44, bw - 24, 12, '#000', 16);
        }
      }
    });
    // bottom bar: turn off, and the network status
    var ho = hit(30, SH - 64, 200, 40, { id: 'off', fn: function () { msgBox('Turn off computer', 'The park’s computers are not turned off at night.  (Press E to stand up.)', 'i'); } });
    g.fillStyle = lin(0, SH - 62, 0, SH - 30, [[0, ho ? '#ff8a5a' : '#ef6a3a'], [1, '#b8320c']]); rr(34, SH - 62, 32, 32, 6); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.6; g.beginPath(); g.arc(50, SH - 45, 8, -1.1, PI + 1.1, false); g.stroke(); g.beginPath(); g.moveTo(50, SH - 57); g.lineTo(50, SH - 46); g.stroke();
    text('Turn off computer', 76, SH - 40, 15, '#fff', '', 'left');
    var up = netUp();
    text(up ? 'Domain: FAMILYZOO  ·  connected' : 'Domain: FAMILYZOO  ·  not available (network cable unplugged)', SW - 30, SH - 50, 13, up ? '#dce6ff' : '#ffb0a0', '', 'right');
    text('After you log on, Entry Control and Park Mail are on your desktop.', SW - 30, SH - 30, 12, '#b9c8f0', '', 'right');
  }
  function submit() {
    var N = P.ent;
    if (lockT > 0 || !typed.length) return;
    if (!netUp()) { P.net.tried = true; Sfx.play('hdd', { vol: 0.15 }); busy = 1.1; failT = 1.1; typed = ''; return; }
    if (typed === N.pin) { N.login = true; phase = 'loggingIn'; phT = 0; Sfx.play('hdd', { vol: 0.2 }); typed = ''; }
    else { N.tries++; typed = ''; note = 'bad'; Sound.tone(392, 392, 0.2, 0.07, 'triangle'); if (N.tries % 3 === 0) lockT = 8; }
    dirty = true;
  }
  function wallpaper() {
    g.fillStyle = lin(0, 0, 0, SH, [[0, '#2f6fd0'], [0.45, '#7fb6ee'], [0.62, '#cfe8fb'], [1, '#cfe8fb']]); g.fillRect(0, 0, SW, SH);
    g.fillStyle = 'rgba(255,255,255,.75)'; [[180, 120, 70], [260, 110, 50], [700, 90, 80], [780, 100, 55], [860, 160, 40]].forEach(function (c) { g.beginPath(); g.ellipse(c[0], c[1], c[2], c[2] * 0.35, 0, 0, 7); g.fill(); });
    g.fillStyle = lin(0, 420, 0, SH, [[0, '#57a83a'], [1, '#2d6a1e']]); g.beginPath(); g.moveTo(0, 520); g.bezierCurveTo(260, 380, 620, 400, SW, 470); g.lineTo(SW, SH); g.lineTo(0, SH); g.fill();
    g.fillStyle = lin(0, 520, 0, SH, [[0, '#3f8a2a'], [1, '#22561a']]); g.beginPath(); g.moveTo(0, 640); g.bezierCurveTo(300, 560, 640, 600, SW, 560); g.lineTo(SW, SH); g.lineTo(0, SH); g.fill();
    // Dottie on the skyline, and the park's name in the corner
    g.fillStyle = 'rgba(30,70,30,.85)'; g.save(); g.translate(640, 418); g.scale(1.2, 1.2); g.beginPath(); g.ellipse(0, 0, 46, 20, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(30, -8); g.quadraticCurveTo(60, -60, 52, -90); g.quadraticCurveTo(66, -88, 46, -6); g.fill(); g.beginPath(); g.ellipse(54, -92, 11, 6, -0.3, 0, 7); g.fill(); g.fillRect(-26, 10, 9, 22); g.fillRect(14, 10, 9, 22); g.beginPath(); g.moveTo(-40, -4); g.quadraticCurveTo(-80, 6, -96, 22); g.lineTo(-40, 8); g.fill(); g.restore();
    text('FAMILY ZOO', SW - 26, SH - TB - 22, 28, 'rgba(255,255,255,.55)', 'bold italic', 'right'); text('Where the past comes alive', SW - 28, SH - TB - 6, 12, 'rgba(255,255,255,.5)', 'italic', 'right');
  }
  var DESK = [['entry', 'Entry Control'], ['mail', 'Park Mail'], ['cams', 'CCTV Viewer'], ['docs', 'My Documents'], ['trash', 'Trash']];
  function drawDesktop() {
    wallpaper();
    DESK.forEach(function (d, i) {
      var x = 22, y = 22 + i * 86, act = { id: 'ic' + d[0], fn: function () { var t = now(); if (lastClick.id === d[0] && t - lastClick.t < 0.5) { openApp(d[0]); lastClick.id = null; } else { lastClick = { t: t, id: d[0] }; Z.sel = d[0]; } } }, sel = Z.sel === d[0];
      hit(x, y, 76, 72, act);
      ICON[APPS[d[0]].icon](x + 22, y + 4, 32);
      if (sel) { g.fillStyle = 'rgba(49,106,197,.8)'; g.font = '12px ' + FONT; var tw = g.measureText(d[1]).width; g.fillRect(x + 38 - tw / 2 - 3, y + 42, tw + 6, 17); }
      text(d[1], x + 38, y + 55, 12, '#fff', '', 'center', 80, sel ? null : 'rgba(0,0,0,.85)');
    });
    for (var i = 0; i < wins.length; i++) if (!wins[i].min) drawWin(wins[i], i === wins.length - 1 && !startOpen);
    drawTaskbar(); if (startOpen) drawStart();
  }
  function drawTaskbar() {
    var y = SH - TB;
    g.fillStyle = lin(0, y, 0, SH, [[0, '#3a81f3'], [0.06, '#2f6ae0'], [0.5, '#245edb'], [1, '#1941a5']]); g.fillRect(0, y, SW, TB);
    var hs = hit(0, y, 116, TB, { id: 'start', fn: function () { startOpen = !startOpen; Sound.click(); } });
    g.fillStyle = lin(0, y, 0, SH, [[0, hs || startOpen ? '#5fbf5f' : '#4ca64c'], [0.5, hs || startOpen ? '#3a993a' : '#318c31'], [1, '#2a7a2a']]); g.beginPath(); g.moveTo(0, y); g.lineTo(100, y); g.quadraticCurveTo(116, y, 116, y + 20); g.quadraticCurveTo(116, SH, 100, SH); g.lineTo(0, SH); g.fill();
    g.save(); g.translate(12, y + 9); [['#e2662a', 0, 0], ['#2fb85a', 11, 0], ['#3d7fe8', 0, 11], ['#e2b93b', 11, 11]].forEach(function (c) { g.fillStyle = c[0]; rr(c[1], c[2], 9.5, 9.5, 2); g.fill(); }); g.restore();
    text('start', 40, y + 27, 22, '#fff', 'bold italic', 'left', null, 'rgba(0,0,0,.5)');
    var bx = 126; wins.forEach(function (w, i) { var act = i === wins.length - 1 && !w.min, hv = hit(bx, y + 5, 160, TB - 10, { id: 'tb' + w.id, fn: function () { if (act) { w.min = true; } else openApp(w.id); } }); g.fillStyle = act ? '#1e4fb8' : hv ? '#5a96f8' : '#3c81f3'; rr(bx, y + 5, 160, TB - 10, 3); g.fill(); ICON[APPS[w.id].icon](bx + 6, y + 12, 16); text(APPS[w.id].title.split(' — ')[0], bx + 28, y + 25, 12, '#fff', '', 'left', 126); bx += 166; });
    g.fillStyle = lin(0, y, 0, SH, [[0, '#18bbff'], [0.08, '#0f9cec'], [1, '#0c7ad6']]); g.fillRect(SW - 150, y, 150, TB); g.fillStyle = '#095db8'; g.fillRect(SW - 150, y, 1, TB);
    // tray: network (two little screens), the speaker, the clock
    var nx = SW - 140, ny = y + 12, up = netUp(); g.fillStyle = '#c9d8f0'; g.fillRect(nx, ny + 2, 9, 7); g.fillRect(nx + 6, ny + 7, 9, 7); g.fillStyle = up ? '#7ad0ff' : '#5a6a8a'; g.fillRect(nx + 1, ny + 3, 7, 5); g.fillRect(nx + 7, ny + 8, 7, 5);
    if (!up) { g.fillStyle = '#e0301c'; g.beginPath(); g.arc(nx + 13, ny + 13, 4.5, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(nx + 11, ny + 11); g.lineTo(nx + 15, ny + 15); g.moveTo(nx + 15, ny + 11); g.lineTo(nx + 11, ny + 15); g.stroke(); }
    g.fillStyle = '#e6eefc'; g.beginPath(); g.moveTo(nx + 26, ny + 6); g.lineTo(nx + 30, ny + 6); g.lineTo(nx + 35, ny + 2); g.lineTo(nx + 35, ny + 15); g.lineTo(nx + 30, ny + 11); g.lineTo(nx + 26, ny + 11); g.fill();
    text('11:41 PM', SW - 14, y + 26, 13, '#fff', '', 'right');
    if (balloon) {                                                                   // a notification balloon over the tray
      var bw = 300, bh = 70, bx2 = SW - bw - 16, by2 = y - bh - 16;
      g.fillStyle = '#ffffe1'; rr(bx2, by2, bw, bh, 8); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; rr(bx2, by2, bw, bh, 8); g.stroke();
      g.beginPath(); g.moveTo(SW - 150, by2 + bh); g.lineTo(SW - 138, y + 4); g.lineTo(SW - 126, by2 + bh); g.fillStyle = '#ffffe1'; g.fill();
      ICON.warn(bx2 + 10, by2 + 10, 18, balloon.kind); text(balloon.title, bx2 + 36, by2 + 24, 13, '#000', 'bold', 'left'); wrap(balloon.text, bx2 + 12, by2 + 46, bw - 24, 12, '#000', 15);
    }
  }
  function drawStart() {
    var w = 380, h = 460, x = 0, y = SH - TB - h;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.fillStyle = '#1c5ad0'; rr(x, y, w, h, 8); g.fill(); g.restore();
    g.fillStyle = lin(0, y, 0, y + 64, [[0, '#4a90f0'], [1, '#1c5ad0']]); g.save(); rr(x, y, w, 64, 8); g.clip(); g.fillRect(x, y, w, 64); g.restore();
    ICON.user(x + 10, y + 8, 48); text('Marla Voss', x + 70, y + 40, 18, '#fff', 'bold', 'left', null, 'rgba(0,0,0,.5)');
    g.fillStyle = '#fff'; g.fillRect(x + 4, y + 64, w / 2 + 10, h - 64 - 44); g.fillStyle = '#d3e5fa'; g.fillRect(x + w / 2 + 14, y + 64, w / 2 - 18, h - 64 - 44);
    [['entry', 'Entry Control', 'Ticket lanes'], ['mail', 'Park Mail', 'Read your e-mail'], ['cams', 'CCTV Viewer', 'Park cameras']].forEach(function (it, i) {
      var iy = y + 74 + i * 52, hv = hit(x + 6, iy, w / 2 + 6, 48, { id: 'sm' + it[0], fn: function () { openApp(it[0]); } });
      if (hv) { g.fillStyle = '#316ac5'; g.fillRect(x + 6, iy, w / 2 + 6, 48); } ICON[APPS[it[0]].icon](x + 12, iy + 8, 32); text(it[1], x + 52, iy + 22, 13, hv ? '#fff' : '#000', 'bold', 'left'); text(it[2], x + 52, iy + 38, 11, hv ? '#dce6ff' : '#666', '', 'left');
    });
    [['docs', 'My Documents'], ['trash', 'Trash']].forEach(function (it, i) { var iy = y + 74 + i * 34, hv = hit(x + w / 2 + 16, iy, w / 2 - 22, 30, { id: 'sr' + it[0], fn: function () { openApp(it[0]); } }); if (hv) { g.fillStyle = '#316ac5'; g.fillRect(x + w / 2 + 16, iy, w / 2 - 22, 30); } ICON[APPS[it[0]].icon](x + w / 2 + 22, iy + 5, 20); text(it[1], x + w / 2 + 48, iy + 20, 12, hv ? '#fff' : '#0a246a', 'bold', 'left'); });
    g.fillStyle = lin(0, y + h - 44, 0, y + h, [[0, '#4a90f0'], [1, '#1c5ad0']]); g.fillRect(x, y + h - 44, w, 44);
    var lo = hit(x + w - 230, y + h - 38, 100, 32, { id: 'logoff', fn: function () { msgBox('Log Off ZooOS', 'Are you sure you want to log off?', 'q', ['Log Off', 'Cancel'], function (b) { if (b === 0) { P.ent.login = false; wins = []; startOpen = false; phase = 'welcome'; userSel = false; } }); } });
    text('Log Off', x + w - 190, y + h - 17, 13, lo ? '#ffe9a0' : '#fff', '', 'left'); g.fillStyle = '#e2b93b'; rr(x + w - 222, y + h - 33, 22, 22, 4); g.fill();
    var to = hit(x + w - 118, y + h - 38, 112, 32, { id: 'turnoff', fn: function () { startOpen = false; msgBox('Turn off computer', 'The park’s computers are not turned off at night.  (Press E to stand up.)', 'i'); } });
    text('Turn Off', x + w - 74, y + h - 17, 13, to ? '#ffe9a0' : '#fff', '', 'left'); g.fillStyle = '#e8562a'; rr(x + w - 110, y + h - 33, 22, 22, 4); g.fill();
  }
  function drawWin(w, active) {
    var A = APPS[w.id]; frameWin(w.x, w.y, w.w, w.h, A.title, function (x, y, s) { ICON[A.icon](x, y, s); }, active, { id: 'cl' + w.id, fn: function () { closeWin(w); } }, { id: 'mn' + w.id, fn: function () { w.min = true; dirty = true; } });
    hit(w.x, w.y, w.w - 60, 30, { id: 'drag' + w.id, drag: w, fn: function () { wins.splice(wins.indexOf(w), 1); wins.push(w); } });
    var cx = w.x + 4, cy = w.y + 30, cw = w.w - 8, ch = w.h - 34;
    g.save(); g.beginPath(); g.rect(cx, cy, cw, ch); g.clip();
    hit(cx, cy, cw, ch, { id: 'body' + w.id, fn: function () { wins.splice(wins.indexOf(w), 1); wins.push(w); } });
    ({ entry: appEntry, mail: appMail, cams: appCams, docs: appDocs, trash: appTrash })[w.id](cx, cy, cw, ch, w);
    g.restore();
  }

  // ---------- the programs ----------
  var LOG = [];
  function logLine(t) { LOG.push(['23:41:' + String(10 + LOG.length * 3).slice(-2), t]); if (LOG.length > 9) LOG.shift(); dirty = true; }
  function appEntry(x, y, w, h) {
    var pw = lanesPowered(), up = netUp(), open = !!P.turn;
    g.fillStyle = '#fff'; g.fillRect(x, y, w, 26); g.fillStyle = '#d6d2c2'; g.fillRect(x, y + 26, w, 1);
    text('Controller: ENTRY-CTRL  (10.0.4.12)', x + 10, y + 18, 12, '#000', 'bold', 'left');
    var st = !pw ? ['NO POWER', '#c41a0c'] : !up ? ['NO LINK', '#c41a0c'] : ['ONLINE', '#1a8a2a'];
    g.fillStyle = st[1]; g.beginPath(); g.arc(x + 290, y + 13, 5, 0, 7); g.fill(); text(st[0], x + 300, y + 18, 12, st[1], 'bold', 'left');
    // the plan: the middle booth, the cabinets and the four lanes
    var px = x + 14, py = y + 40, pwid = w - 28, ph = 170;
    g.fillStyle = '#fbfbf7'; g.fillRect(px, py, pwid, ph); g.strokeStyle = '#a5a28f'; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, pwid - 1, ph - 1);
    text('PARK  →', px + pwid / 2, py + 16, 11, '#6a6a5a', 'bold', 'center'); text('PLAZA  (entrance side)', px + pwid / 2, py + ph - 8, 11, '#6a6a5a', 'bold', 'center');
    var sx = function (wx) { return px + pwid / 2 + wx * 48; }, my = py + ph / 2;
    g.fillStyle = '#d9d2b8'; g.fillRect(sx(-1.15), my - 30, 2.3 * 48, 60); g.strokeStyle = '#8a8470'; g.strokeRect(sx(-1.15), my - 30, 2.3 * 48, 60); text('BOOTH', sx(0), my + 4, 10, '#5a5444', 'bold', 'center');
    [-3.74, -2.8, -1.86, 1.86, 2.8, 3.74].forEach(function (hx) { g.fillStyle = '#9aa6ae'; g.fillRect(sx(hx) - 7, my - 28, 14, 56); });
    [-3.27, -2.33, 2.33, 3.27].forEach(function (lx, i) {
      var rel = open || (unlockRun && unlockRun.done > i), col = rel ? '#1a9a3a' : '#c41a0c';
      g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(sx(lx) - 18, my); g.lineTo(sx(lx) + 18, my); g.stroke();
      g.fillStyle = col; rr(sx(lx) - 22, my + 32, 44, 18, 4); g.fill(); text(rel ? 'OPEN' : 'LOCKED', sx(lx), my + 45, 9, '#fff', 'bold', 'center');
      text('L' + (i + 1), sx(lx), my - 34, 11, '#333', 'bold', 'center');
      if (rel) { g.fillStyle = col; g.beginPath(); g.moveTo(sx(lx), my - 24); g.lineTo(sx(lx) - 6, my - 14); g.lineTo(sx(lx) + 6, my - 14); g.fill(); }
    });
    // the buttons and the log
    var by = py + ph + 12;
    button(x + 14, by, 190, 34, open ? 'All lanes released' : 'Release All Lanes', { id: 'release', fn: releaseLanes }, { bold: true, size: 13, disabled: open || !!unlockRun });
    button(x + 214, by, 120, 34, 'Lock All Lanes', { id: 'lockall', fn: function () { msgBox('Entry Control', 'Lane locking is disabled during an evacuation override.', 'i'); } }, { disabled: !open });
    button(x + 344, by, 100, 34, 'Diagnostics', { id: 'diag', fn: function () { msgBox('Diagnostics', 'Lane power: ' + (pw ? 'OK' : 'NO POWER') + '\nLink: ' + (up ? 'OK (FAMILYZOO)' : 'DOWN') + '\nSolenoids: 4 / 4 responding' + (open ? '\nState: RELEASED' : '\nState: LOCKED (night mode)'), 'i'); } });
    var ly = by + 46; g.fillStyle = '#fff'; g.fillRect(x + 14, ly, w - 28, h - (ly - y) - 12); g.strokeStyle = '#7f9db9'; g.strokeRect(x + 14.5, ly + 0.5, w - 29, h - (ly - y) - 13);
    (LOG.length ? LOG : [['23:40:58', 'Session restored after power failure.'], ['23:41:02', 'Lane controller in NIGHT LOCK.']]).forEach(function (l, i) { text(l[0], x + 22, ly + 17 + i * 15, 11, '#666', '', 'left'); text(l[1], x + 86, ly + 17 + i * 15, 11, '#000', '', 'left', w - 110); });
    if (unlockRun) {                                                                     // the progress panel over the plan while the release runs
      var bx = x + w / 2 - 170, by2 = y + 90, bw = 340, bh = 92;
      g.fillStyle = '#ece9d8'; g.fillRect(bx, by2, bw, bh); g.strokeStyle = '#0a4fd6'; g.lineWidth = 2; g.strokeRect(bx, by2, bw, bh);
      text(unlockRun.msg, bx + 14, by2 + 24, 12, '#000', '', 'left', bw - 28);
      g.fillStyle = '#fff'; g.fillRect(bx + 14, by2 + 40, bw - 28, 20); g.strokeStyle = '#7f9db9'; g.lineWidth = 1; g.strokeRect(bx + 14.5, by2 + 40.5, bw - 29, 19);
      var nb = Math.floor((bw - 32) / 10 * unlockRun.p); for (var b = 0; b < nb; b++) { g.fillStyle = lin(0, by2 + 42, 0, by2 + 58, [[0, '#a6f0a0'], [0.5, '#2fb85a'], [1, '#1a8a2a']]); g.fillRect(bx + 17 + b * 10, by2 + 43, 8, 14); }
      text(Math.round(unlockRun.p * 100) + '%', bx + bw - 16, by2 + 80, 11, '#333', '', 'right');
    }
  }
  function releaseLanes() {
    if (!lanesPowered()) { msgBox('Entry Control', 'ENTRY-CTRL is not responding: no power at the lane controller.\n\nCheck the TICKET LANES breaker on the board in the maintenance shed.', 'x'); return; }
    msgBox('Release ticket lanes', 'Release all four ticket lanes?\n\nThe turnstiles will turn freely in both directions until they are re-armed from this console.', 'q', ['Yes', 'No'], function (b) {
      if (b !== 0) return;
      unlockRun = { t: 0, p: 0, done: 0, msg: 'Contacting ENTRY-CTRL (10.0.4.12)...' }; logLine('Release requested by MVOSS.'); Sfx.play('hdd', { vol: 0.15 });
    });
  }
  function stepUnlock(dt) {
    if (!unlockRun) return; var u = unlockRun; u.t += dt; var T = u.t;
    if (T < 1.0) { u.p = T / 1.0 * 0.15; u.msg = 'Contacting ENTRY-CTRL (10.0.4.12)...'; }
    else if (T < 1.6) { u.p = 0.15 + (T - 1.0) / 0.6 * 0.1; u.msg = 'Authenticating MVOSS (Head Keeper)...'; }
    else { var k = Math.min(4, Math.floor((T - 1.6) / 0.7) + 1); u.p = 0.25 + Math.min(1, (T - 1.6) / 2.8) * 0.75;
      if (k > u.done) { u.done = k; logLine('Lane ' + k + ': solenoid released.'); u.msg = 'Releasing lane ' + k + ' of 4...'; Sfx.play('solenoid', { vol: 0.25, rate: 0.95 + k * 0.03, fallback: function () { Sound.clunk(); } }); }
      if (T > 4.6 && !u.fin) { u.fin = true; P.turn = true; logLine('All four lanes RELEASED.'); Sound.chime(); if (Z.onUnlock) Z.onUnlock(); }
      if (T > 5.0) { unlockRun = null; msgBox('Entry Control', 'All four ticket lanes are released.\n\nHave a wonderful day at Family Zoo!', 'i'); }
    }
    dirty = true;
  }
  var MAIL = function () {
    return [
      ['Dave Pike', 'New switch in the staff cabinet', 'Tue 14:02', 'Marla — I’m swapping the old switch in the staff-room cabinet for the new one this afternoon, so everything gets re-patched. The sheet on the cabinet door will be out of date until I print a new one. I’ll leave you a message with the new ports. Don’t let anyone unplug anything. — Dave'],
      ['Facilities', 'Generator derated again', 'Mon 09:15', 'Marla — the aux set is down to its plate rating. If the lights die, switch off what you do not need at the shed board before you pull the start lever, or it will just stall. The shop and the lanes are all you want at night.'],
      ['Director', 'Master key — reminder', 'Mon 08:30', 'The master key for the front gate release stays split in five. One section is kept at each exhibit: Aquarium, Raptor Paddock, Visitor Center, Aviary, Rex Kingdom. Nobody carries more than one. Sector Gate A wants two sections on the reader, Gate B wants three.'],
      ['Security', 'Ranger posts', 'Fri 17:40', 'All ranger posts and this shop have the narrow doors now. Nothing bigger than a person gets through them. If the animals are loose: get inside, stay inside, and log your position on the Ranger Net panel.'],
      ['M. Voss (draft)', 'they are learning the gates', 'Tue 23:38', 'I watched ' + P.ent.pet + ' try the paddock latch tonight. She waited until I looked away. If entry control drops the link again I am not staying to fix it. Release the lanes and get out.']
    ];
  };
  function appMail(x, y, w, h) {
    var M = MAIL(), sel = Z.mailSel === undefined ? 0 : Z.mailSel;
    g.fillStyle = '#fff'; g.fillRect(x, y, 120, h); g.fillStyle = '#d6d2c2'; g.fillRect(x + 120, y, 1, h);
    [['Inbox (' + M.length + ')', true], ['Sent Items', false], ['Deleted Items', false], ['Drafts (1)', false]].forEach(function (f, i) { if (f[1]) { g.fillStyle = '#316ac5'; g.fillRect(x + 4, y + 8 + i * 22, 112, 20); } text(f[0], x + 10, y + 22 + i * 22, 12, f[1] ? '#fff' : '#000', f[1] ? 'bold' : '', 'left'); });
    var lx = x + 124, lw = w - 126;
    g.fillStyle = '#ece9d8'; g.fillRect(lx, y, lw, 20); text('From', lx + 8, y + 14, 11, '#000', '', 'left'); text('Subject', lx + 140, y + 14, 11, '#000', '', 'left'); text('Received', lx + lw - 8, y + 14, 11, '#000', '', 'right');
    M.forEach(function (m, i) { var iy = y + 20 + i * 20, hv = hit(lx, iy, lw, 20, { id: 'ml' + i, fn: function () { Z.mailSel = i; (P.ent.mail.indexOf(i) < 0) && P.ent.mail.push(i); dirty = true; } }); var s2 = i === sel; g.fillStyle = s2 ? '#316ac5' : hv ? '#e8eefa' : '#fff'; g.fillRect(lx, iy, lw, 20); var unread = P.ent.mail.indexOf(i) < 0; text(m[0], lx + 8, iy + 14, 11, s2 ? '#fff' : '#000', unread ? 'bold' : '', 'left', 128); text(m[1], lx + 140, iy + 14, 11, s2 ? '#fff' : '#000', unread ? 'bold' : '', 'left', lw - 230); text(m[2], lx + lw - 8, iy + 14, 11, s2 ? '#fff' : '#333', '', 'right'); });
    var ry = y + 24 + M.length * 20; g.fillStyle = '#d6d2c2'; g.fillRect(lx, ry - 2, lw, 2); g.fillStyle = '#fff'; g.fillRect(lx, ry, lw, h - (ry - y));
    text('From: ' + M[sel][0] + '     Subject: ' + M[sel][1], lx + 10, ry + 18, 12, '#000', 'bold', 'left', lw - 20);
    wrap(M[sel][3], lx + 10, ry + 42, lw - 24, 13, '#111', 18);
  }
  function appCams(x, y, w, h) {
    var feeds = [['CAM 01  FRONT GATE', 0], ['CAM 03  RAPTOR PADDOCK', 1], ['CAM 06  AQUARIUM HALL', 0], ['CAM 09  REX KINGDOM', 0]], cw = (w - 12) / 2, ch = (h - 34) / 2;
    feeds.forEach(function (f, i) {
      var fx = x + 4 + (i % 2) * (cw + 4), fy = y + 4 + Math.floor(i / 2) * (ch + 4);
      g.fillStyle = f[1] ? '#0c120c' : '#000'; g.fillRect(fx, fy, cw, ch);
      for (var q = 0; q < (f[1] ? 900 : 1400); q++) { var v = (Math.random() * (f[1] ? 70 : 140)) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(fx + Math.random() * cw, fy + Math.random() * ch, 2, 1.5); }
      if (f[1]) { g.fillStyle = 'rgba(20,40,20,.8)'; for (var s = 0; s < 4; s++) { var sx = fx + cw * (0.2 + s * 0.18 + Math.sin(now() * 0.7 + s) * 0.03), sy = fy + ch * 0.6; g.beginPath(); g.ellipse(sx, sy, 16, 7, 0.2, 0, 7); g.fill(); g.beginPath(); g.moveTo(sx + 12, sy - 3); g.lineTo(sx + 26, sy - 12); g.lineTo(sx + 28, sy - 8); g.fill(); } if (Math.floor(now() * 2) % 2) text('● MOTION DETECTED — 4 SOURCES', fx + 8, fy + ch - 10, 11, '#ff3a2a', 'bold', 'left'); }
      else text('NO SIGNAL', fx + cw / 2, fy + ch / 2 + 6, 16, '#ddd', 'bold', 'center');
      text(f[0], fx + 6, fy + 16, 11, '#fff', 'bold', 'left', null, '#000'); text('14-10-09  23:41', fx + cw - 6, fy + 16, 10, '#fff', '', 'right', null, '#000');
    });
    text('Recording stopped 14 Oct 2009 23:41 — disk full.', x + 8, y + h - 10, 12, '#000', '', 'left');
    dirty = true;
  }
  function appDocs(x, y, w, h) {
    g.fillStyle = '#fff'; g.fillRect(x, y, w, h);
    [['Staff rota OCT.xls', 'xls'], ['Dottie Day poster.doc', 'doc'], ['Feeding schedule.xls', 'xls'], ['Incident report (draft).doc', 'doc'], ['dottie.jpg', 'jpg']].forEach(function (f, i) {
      var fx = x + 16 + (i % 3) * 136, fy = y + 14 + Math.floor(i / 3) * 96, hv = hit(fx, fy, 120, 86, { id: 'doc' + i, fn: function () { msgBox(f[0], f[1] === 'jpg' ? 'Dottie, aged 6 weeks, in the nursery.  (The picture will not open: the file is damaged.)' : 'This file was last saved during a power failure and cannot be opened.', 'x'); } });
      if (hv) { g.fillStyle = '#e8eefa'; g.fillRect(fx, fy, 120, 86); }
      g.fillStyle = '#fff'; g.strokeStyle = '#7f8a9a'; g.fillRect(fx + 42, fy + 6, 36, 44); g.strokeRect(fx + 42.5, fy + 6.5, 35, 43); g.fillStyle = f[1] === 'xls' ? '#2a8a3a' : f[1] === 'doc' ? '#2a5ad8' : '#d88a2a'; g.fillRect(fx + 46, fy + 30, 28, 14); text(f[1].toUpperCase(), fx + 60, fy + 41, 10, '#fff', 'bold', 'center');
      text(f[0], fx + 60, fy + 66, 11, '#000', '', 'center', 118);
    });
  }
  function appTrash(x, y, w, h) { g.fillStyle = '#fff'; g.fillRect(x, y, w, h); text('The Trash is empty.', x + w / 2, y + h / 2, 13, '#666', '', 'center'); }
  function drawDialog() {
    var d = dialog, w = 420, lines, bh, x, y;
    g.font = '13px ' + FONT; lines = (function () { var n = 0; d.body.split('\n').forEach(function (p) { var ln = '', c = 1; p.split(' ').forEach(function (wd) { var t = ln ? ln + ' ' + wd : wd; if (g.measureText(t).width > w - 90 && ln) { c++; ln = wd; } else ln = t; }); n += c; }); return n; })();
    bh = 110 + lines * 17; x = SW / 2 - w / 2; y = SH / 2 - bh / 2 - 20;
    frameWin(x, y, w, bh, d.title, null, true, { id: 'dlgx', fn: function () { var cb = d.cb; dialog = null; if (cb) cb(d.buttons.length - 1); } });
    ICON.warn(x + 20, y + 46, 32, d.kind); wrap(d.body, x + 66, y + 60, w - 90, 13, '#000', 17);
    d.buttons.forEach(function (b, i) { var bw = 80, bx = x + w / 2 - (d.buttons.length * 88) / 2 + i * 88 + 4; button(bx, y + bh - 42, bw, 28, b, { id: 'dlg' + i, fn: function () { var cb = d.cb; dialog = null; if (cb) cb(i); } }, { bold: i === 0 }); });
  }
  function drawCursor() {
    var x = cur.x, y = cur.y;
    if (busy > 0 || phase === 'loggingIn') {                                          // the hourglass
      g.save(); g.translate(x, y); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.lineTo(9, 11); g.lineTo(16, 22); g.lineTo(0, 22); g.lineTo(7, 11); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#c9a03a'; g.beginPath(); g.moveTo(3, 20); g.lineTo(13, 20); g.lineTo(8, 14); g.fill(); g.restore(); return;
    }
    g.save(); g.translate(x, y); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 22); g.lineTo(5, 17); g.lineTo(9, 26); g.lineTo(13, 24); g.lineTo(9, 16); g.lineTo(16, 16); g.closePath(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 3; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fill(); g.shadowColor = 'transparent'; g.stroke(); g.restore();
  }
  function crt() {                                                                      // scanlines and the tube's falloff at the corners
    g.fillStyle = 'rgba(0,0,0,.07)'; for (var y = 0; y < SH; y += 3) g.fillRect(0, y, SW, 1);
    var rg = g.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SW * 0.72); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = rg; g.fillRect(0, 0, SW, SH);
  }
  function render() {
    hits = [];
    if (phase === 'off') { g.fillStyle = '#050605'; g.fillRect(0, 0, SW, SH); }
    else if (phase === 'bios') drawBios();
    else if (phase === 'boot') drawBoot();
    else if (phase === 'welcome' || phase === 'loggingIn') drawWelcome();
    else drawDesktop();
    if (dialog) { hits = []; drawDialog(); }
    if (Z.open && phase !== 'off' && phase !== 'bios' && phase !== 'boot') drawCursor();
    if (phase !== 'off') crt();
    tex.needsUpdate = true; dirty = false;
  }

  // ---------- input ----------
  function findHit(x, y) { for (var i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (x >= h[0] && x < h[0] + h[2] && y >= h[1] && y < h[1] + h[3]) return h[4]; } return null; }
  Z.move = function (dx, dy) {
    cur.x = clamp(cur.x + dx, 0, SW - 4); cur.y = clamp(cur.y + dy, 0, SH - 4);
    if (drag) { drag.w.x = clamp(cur.x - drag.ox, -drag.w.w + 80, SW - 80); drag.w.y = clamp(cur.y - drag.oy, 0, SH - TB - 30); }
    var h = findHit(cur.x, cur.y), id = h ? h.id : null; if (id !== hover) hover = id;
    dirty = true;
  };
  Z.setPointer = function (u, v) { Z.move(u * SW - cur.x, (1 - v) * SH - cur.y); };
  Z.mouse = function (isDown) {
    if (!Z.open) return;
    if (isDown) {
      down = true; Sfx.play('mouse_click', { vol: 0.35, fallback: function () { Sound.tone(1800, 1200, 0.015, 0.05, 'square'); } });
      if (phase !== 'welcome' && phase !== 'desktop') return;
      var h = findHit(cur.x, cur.y);
      if (startOpen && !(h && (String(h.id).indexOf('sm') === 0 || String(h.id).indexOf('sr') === 0 || h.id === 'start' || h.id === 'logoff' || h.id === 'turnoff'))) startOpen = false;
      if (h) { if (h.drag && !dialog) drag = { w: h.drag, ox: cur.x - h.drag.x, oy: cur.y - h.drag.y }; if (h.fn) h.fn(); }
      else if (phase === 'desktop') Z.sel = null;
      dirty = true;
    } else { down = false; drag = null; }
  };
  Z.key = function (code) {                // returns true if the key was used
    var m = /^(?:Digit|Numpad)(\d)$/.exec(code);
    if (code === 'Escape' || code === 'KeyE') { Z.close(); return true; }
    if (dialog && (code === 'Enter' || code === 'NumpadEnter' || code === 'Space')) { var cb = dialog.cb; dialog = null; if (cb) cb(0); dirty = true; return true; }
    if (phase === 'welcome' && userSel && !dialog) {
      if (lockT > 0) return true;
      Sfx.play('keytype', { vol: 0.3, rate: 0.9 + Math.random() * 0.2, fallback: function () { Sound.click(); } });
      if (code === 'Backspace') typed = typed.slice(0, -1);
      else if (m && typed.length < 8) { typed += m[1]; note = ''; }
      else if (code === 'Enter' || code === 'NumpadEnter') submit();
      dirty = true; return true;
    }
    return true;
  };
  Z.openUp = function () {
    Z.open = true; cur.x = 512; cur.y = 560; drag = null; down = false; startOpen = false;
    if (phase === 'off') { phase = 'bios'; phT = 0; P.ent.booted = true; Sfx.play('pc_boot', { vol: 0.5 }); }
    dirty = true;
  };
  Z.close = function () { if (!Z.open) return; Z.open = false; drag = null; startOpen = false; dirty = true; if (Z.onClose) Z.onClose(); };
  Z.reset = function () {                // a new game or a load: the PC is as the save left it (on if it had been started and has power)
    wins = []; dialog = null; startOpen = false; balloon = null; unlockRun = null; LOG = []; failT = 0; busy = 0; typed = ''; userSel = false; note = ''; lockT = 0; Z.mailSel = undefined;
    phase = P && P.pow0 && P.ent.booted ? (P.ent.login ? 'desktop' : 'welcome') : 'off'; dirty = true;
  };
  var lastNet = null, frameT = 0;
  Z.tick = function (dt) {
    var pw = !!(P && P.pow0);
    if (!pw && phase !== 'off') { phase = 'off'; wins = []; dialog = null; dirty = true; if (Z.open) Z.close(); }
    if (pw && phase === 'off' && P.ent.booted) { phase = 'bios'; phT = 0; }
    phT += dt; if (lockT > 0) { var c = Math.ceil(lockT); lockT -= dt; if (Math.ceil(lockT) !== c) dirty = true; }
    if (busy > 0) busy -= dt;
    if (failT > 0) { failT -= dt; if (failT <= 0 && phase === 'welcome') msgBox('Logon Message', 'The system cannot log you on now because the domain FAMILYZOO is not available.\n\nCheck the network connection, or contact I.T. (ext. 214).', 'x'); }
    if (phase === 'bios') { dirty = true; if (phT > 2.8) { phase = 'boot'; phT = 0; Sfx.play('hdd', { vol: 0.2 }); } }
    else if (phase === 'boot') { dirty = true; if (phT > 3.2) { phase = P.ent.login ? 'desktop' : 'welcome'; phT = 0; } }
    else if (phase === 'loggingIn') { dirty = true; if (phT > 1.8) { phase = 'desktop'; phT = 0; startupChime(); } }
    if (phase === 'desktop') stepUnlock(dt);
    var nu = netUp(); if (lastNet !== null && nu !== lastNet && phase === 'desktop') { balloon = nu ? { kind: 'i', title: 'Local Area Connection', text: 'Connected to FAMILYZOO.' } : { kind: 'x', title: 'Local Area Connection', text: 'A network cable is unplugged.' }; balloon.t = 6; dirty = true; } lastNet = nu;
    if (balloon) { balloon.t -= dt; if (balloon.t <= 0) { balloon = null; dirty = true; } }
    if (Z.open && phase === 'welcome' && !userSel && P.ent.login === false) dirty = dirty || false;
    if (Z.open && Math.floor(now() * 2) !== Z.blink) { Z.blink = Math.floor(now() * 2); if (phase === 'welcome' && userSel) dirty = true; }
    // the machine's hum while it is on, and redraws (no faster than 30 a second)
    Sfx.zone('pchum', 'pc_hum', pw && phase !== 'off' ? clamp(1 - dist(player.x, player.z, E.pc.x, E.pc.z) / 5, 0, 1) * 0.22 : 0, 1.0);
    frameT += dt; if (dirty && frameT > 1 / 30) { frameT = 0; render(); }
  };
  function startupChime() { [[523.3, 0], [659.3, 0.18], [784, 0.36], [1046.5, 0.56]].forEach(function (n) { Sound.tone(n[0], n[0], 0.9, 0.05, 'sine', n[1]); Sound.tone(n[0] * 2, n[0] * 2, 0.5, 0.015, 'triangle', n[1]); }); }
  // what the screen shows from across the room: drawn now so it is never blank on the first frame
  render();
  return Z;
})();
