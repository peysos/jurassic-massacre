/* Jurassic Massacre — ZooNet: the staff computer behind the gift shop counter.
   A small working desktop drawn over the view while you sit at it: log in (the password is on two notices in the shop),
   then use Entry Control to repair the link to the ticket lanes — a routing board whose tiles turn when clicked — and
   unlock them.  Its state lives in P.ent so it is saved with the game. */
'use strict';

var ZooNet = (function () {
  var Z = { open: false }, el = null, view = 'login', typed = '', bootT = 0, lockT = 0, note = '', timer = null;
  var N_ = 1, E_ = 2, S_ = 4, W_ = 8, COLS = 5, ROWS = 4;

  // ---------- the routing board ----------
  function turn(m) { return ((m << 1) & 15) | (m >> 3); }                 // a quarter turn clockwise
  function makeGrid() {
    var rs = (Math.random() * ROWS) | 0, rt = (Math.random() * ROWS) | 0, t = [], seen = {}, path = [], i;
    (function walk(c, r) {                                                // a wandering route from the left edge to the right
      seen[c + ',' + r] = 1; path.push([c, r]);
      if (c === COLS - 1 && r === rt) return true;
      var dirs = shuffle([[1, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]);
      for (var k = 0; k < dirs.length; k++) { var nc = c + dirs[k][0], nr = r + dirs[k][1]; if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || seen[nc + ',' + nr]) continue; if (walk(nc, nr)) return true; }
      path.pop(); return false;
    })(0, rs);
    for (i = 0; i < COLS * ROWS; i++) t.push([N_ | S_, N_ | E_, N_ | E_ | S_, N_ | E_][(Math.random() * 4) | 0]);
    function side(a, b) { return b[0] > a[0] ? E_ : b[0] < a[0] ? W_ : b[1] > a[1] ? S_ : N_; }
    path.forEach(function (p, k) { var m = (k ? side(p, path[k - 1]) : W_) | (k < path.length - 1 ? side(p, path[k + 1]) : E_); t[p[1] * COLS + p[0]] = m; });
    do { for (i = 0; i < t.length; i++) { var q = (Math.random() * 4) | 0; while (q--) t[i] = turn(t[i]); } } while (powered({ rs: rs, rt: rt, t: t }).done);
    return { rs: rs, rt: rt, t: t };
  }
  function powered(G) {                                                   // which tiles the signal reaches, and whether it gets out
    var on = {}, done = false, stack = [], t = G.t;
    if (t[G.rs * COLS] & W_) stack.push([0, G.rs]);
    while (stack.length) {
      var p = stack.pop(), k = p[1] * COLS + p[0]; if (on[k]) continue; on[k] = 1;
      var m = t[k]; if (p[0] === COLS - 1 && p[1] === G.rt && (m & E_)) done = true;
      [[N_, 0, -1, S_], [E_, 1, 0, W_], [S_, 0, 1, N_], [W_, -1, 0, E_]].forEach(function (d) {
        var c = p[0] + d[1], r = p[1] + d[2]; if (!(m & d[0]) || c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
        if (t[r * COLS + c] & d[3]) stack.push([c, r]);
      });
    }
    return { on: on, done: done };
  }

  // ---------- drawing ----------
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function frame(title, body, foot) {
    return '<div class="zn-bar"><b>ZOONET</b> · FAMILY ZOO STAFF NETWORK<span>TERMINAL 01 · 14 OCT 2009 · 23:41</span></div>' +
      '<div class="zn-body">' + (title ? '<h3>' + title + '</h3>' : '') + body + '</div><div class="zn-foot">' + (foot || '') + '<span><kbd>Esc</kbd> stand up</span></div>';
  }
  function draw() {
    var N = P.ent, h = '';
    if (view === 'boot') {
      var lines = ['FZ-BIOS 2.14  (C) 1998', 'MEMORY TEST ........ 640K OK', 'POWER SOURCE ....... AUXILIARY GENERATOR', 'NETWORK ............ ZOONET LOCAL RING', '  node GIFT-01 ..... UP', '  node ENTRY-CTRL .. ' + (entCircuit(1) ? 'NO LINK' : 'NO POWER'), '  node CAMERAS ..... NO SIGNAL', '  node SECTOR-A/B .. UNREACHABLE', '', 'Last session ended abnormally.', 'Starting ZooNet ...'];
      h = '<div class="zn-body zn-boot"><pre>' + lines.slice(0, Math.max(1, Math.floor(bootT * 5))).join('\n') + '<i>█</i></pre></div>';
    } else if (view === 'login') {
      var boxes = ''; for (var i = 0; i < 4; i++) boxes += '<b class="' + (i === typed.length ? 'cur' : '') + '">' + (typed[i] ? '●' : '') + '</b>';
      h = frame('', '<div class="zn-login"><div class="zn-avatar">MV</div><div><div class="zn-name">MVOSS</div><div class="zn-sub">Marla Voss · Head Keeper</div>' +
        '<div class="zn-pass">' + boxes + '</div><div class="zn-sub">' + (lockT > 0 ? '<em>Too many attempts. Wait ' + Math.ceil(lockT) + ' s.</em>' : note ? '<em>' + note + '</em>' : 'Enter the 4-digit password') + '</div>' +
        '<div class="zn-hint">Password hint: “my girl’s tag number”</div></div></div>' +
        '<div class="zn-users"><span>AMERCER — account disabled</span><span>TICKETS1 — account disabled</span><span>ADMIN — locked</span></div>', 'Type the digits on your keyboard');
    } else if (view === 'desk') {
      var unread = 4 - N.mail.length;
      h = frame('Welcome back, Marla.', '<div class="zn-icons">' +
        '<button data-v="entry"><i>⛩</i>Entry Control<small>' + (P.turn ? 'lanes open' : 'attention') + '</small></button>' +
        '<button data-v="mail"><i>✉</i>Mail<small>' + (unread > 0 ? unread + ' unread' : 'inbox') + '</small></button>' +
        '<button data-v="cams"><i>◉</i>Cameras<small>no signal</small></button></div>' +
        '<div class="zn-sub" style="margin-top:22px">Session restored after power loss. Unsaved keeper notes were lost.</div>', 'Click an icon');
    } else if (view === 'entry') {
      var pw = entCircuit(1), G = N.grid, st = '<div class="zn-rows"><div>Lane controller power<b class="' + (pw ? 'ok' : 'bad') + '">' + (pw ? 'OK' : 'NO POWER') + '</b></div>' +
        '<div>Link to ENTRY-CTRL<b class="' + (N.link ? 'ok' : 'bad') + '">' + (N.link ? 'OK' : 'DOWN') + '</b></div><div>Ticket lanes<b class="' + (P.turn ? 'ok' : 'bad') + '">' + (P.turn ? 'UNLOCKED' : 'LOCKED') + '</b></div></div>';
      if (!pw) st += '<p class="zn-sub"><em>The lane controller has no power. Check the TICKET LANES breaker on the distribution board in the maintenance shed.</em></p>';
      else if (!N.link) {
        var pwr = powered(G), cells = '';
        for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
          var k = r * COLS + c, m = G.t[k], seg = '';
          if (m & N_) seg += '<line x1="20" y1="20" x2="20" y2="0"/>'; if (m & E_) seg += '<line x1="20" y1="20" x2="40" y2="20"/>';
          if (m & S_) seg += '<line x1="20" y1="20" x2="20" y2="40"/>'; if (m & W_) seg += '<line x1="20" y1="20" x2="0" y2="20"/>';
          cells += '<button class="zn-tile' + (pwr.on[k] ? ' on' : '') + '" data-k="' + k + '"><svg viewBox="0 0 40 40">' + seg + '<circle cx="20" cy="20" r="3.4"/></svg></button>';
        }
        st += '<p class="zn-sub">Signal route corrupted. Turn the relays until the server reaches the lane controller.</p>' +
          '<div class="zn-board"><div class="zn-end" style="grid-row:' + (G.rs + 1) + '">SERVER ▶</div><div class="zn-grid">' + cells + '</div><div class="zn-end zn-out" style="grid-row:' + (G.rt + 1) + '">▶ LANES</div></div>';
      } else if (!P.turn) st += '<p class="zn-sub">Link restored.</p><button class="zn-go" data-a="unlock">UNLOCK TICKET LANES</button>';
      else st += '<p class="zn-sub">All four turnstiles are released. Have a wonderful day at Family Zoo.</p>';
      h = frame('Entry Control', st, '<button data-v="desk">◀ Back</button>' + (pw && !N.link ? ' Click a relay to turn it' : ''));
    } else if (view === 'mail') {
      var M = mails(), open = Z.mail === undefined ? -1 : Z.mail, list = '';
      M.forEach(function (m, i2) { list += '<button class="zn-mail' + (N.mail.indexOf(i2) < 0 ? ' new' : '') + (open === i2 ? ' sel' : '') + '" data-m="' + i2 + '"><b>' + esc(m[0]) + '</b>' + esc(m[1]) + '</button>'; });
      h = frame('Mail', '<div class="zn-mailbox"><div class="zn-list">' + list + '</div><div class="zn-read">' + (open >= 0 ? '<b>' + esc(M[open][1]) + '</b><p>' + M[open][2] + '</p>' : '<span class="zn-sub">Select a message.</span>') + '</div></div>', '<button data-v="desk">◀ Back</button>');
    } else if (view === 'cams') {
      var feeds = ['CAM 01 · FRONT GATE', 'CAM 03 · RAPTOR PADDOCK', 'CAM 06 · AQUARIUM HALL', 'CAM 09 · REX KINGDOM'];
      h = frame('Cameras', '<div class="zn-cams">' + feeds.map(function (f, i3) { return '<div class="zn-cam"><span>' + f + '</span><em>' + (i3 === 1 ? 'MOTION DETECTED — 4 SOURCES' : 'NO SIGNAL') + '</em></div>'; }).join('') + '</div>' +
        '<p class="zn-sub">Recording stopped 14 OCT 2009 23:41. Storage full.</p>', '<button data-v="desk">◀ Back</button>');
    }
    el.innerHTML = '<div class="zn-screen">' + h + '</div>';
  }
  function mails() {
    return [
      ['Facilities', 'Generator derated again', 'Marla — the aux set is down to its plate rating. If the lights die, <u>switch off what you do not need</u> at the shed board before you pull the start lever or it will just stall. The shop and the lanes are all you want at night.'],
      ['Director', 'Master key — reminder', 'The master key for the front gate release stays split in five. One section is kept at <u>each exhibit</u>: Aquarium, Raptor Paddock, Visitor Center, Aviary, Rex Kingdom. Nobody carries more than one. Sector Gate A wants two sections on the reader, Gate B wants three.'],
      ['Security', 'Ranger posts', 'All ranger posts and this shop have been fitted with the narrow doors. <u>Nothing bigger than a person gets through them</u>. If the animals are loose: get inside, stay inside, and log your position on the Ranger Net terminal.'],
      ['M. Voss (draft, unsent)', 'they are learning the gates', 'I watched ' + esc(P.ent.pet) + ' try the paddock latch tonight. She waited until I looked away. If entry control drops the link again I am not staying to fix it. Run the repair from Entry Control and <u>get out through the lanes</u>.']
    ];
  }

  // ---------- input ----------
  function click(e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    var N = P.ent;
    if (b.dataset.v) { view = b.dataset.v; Z.mail = undefined; Sound.click(); }
    else if (b.dataset.k !== undefined) {
      var k = +b.dataset.k; N.grid.t[k] = turn(N.grid.t[k]); Sound.click();
      if (powered(N.grid).done) { N.link = true; Sound.chime(); }
    } else if (b.dataset.m !== undefined) { Z.mail = +b.dataset.m; if (N.mail.indexOf(Z.mail) < 0) N.mail.push(Z.mail); Sound.click(); }
    else if (b.dataset.a === 'unlock') { P.turn = true; Sound.chime(); Sound.grind(); Z.onUnlock && Z.onUnlock(); }
    draw();
  }
  Z.key = function (code) {             // returns true if the key was used
    var N = P.ent, m = /^(?:Digit|Numpad)(\d)$/.exec(code);
    if (code === 'Escape') { Z.close(); return true; }
    if (view === 'boot') return true;
    if (view === 'login') {
      if (lockT > 0) return true;
      if (code === 'Backspace') typed = typed.slice(0, -1);
      else if (m && typed.length < 4) {
        typed += m[1]; Sound.click(); note = '';
        if (typed.length === 4) {
          if (typed === N.pin) { N.login = true; view = 'desk'; Sound.chime(); }
          else { N.tries++; typed = ''; Sound.buzz(); note = 'Password incorrect.'; if (N.tries % 3 === 0) lockT = 8; }
        }
      }
      draw(); return true;
    }
    if (code === 'Backspace' && view !== 'desk') { view = 'desk'; draw(); }
    return true;
  };
  Z.openUp = function () {
    var N = P.ent;
    if (!el) { el = $('zoonet'); el.addEventListener('click', click); }
    if (!N.grid) N.grid = makeGrid();
    Z.open = true; typed = ''; note = ''; el.classList.add('show');
    if (!N.booted) { N.booted = true; view = 'boot'; bootT = 0; } else view = N.login ? 'desk' : 'login';
    draw();
  };
  Z.close = function () { if (!Z.open) return; Z.open = false; el.classList.remove('show'); if (Z.onClose) Z.onClose(); };
  Z.tick = function (dt) {
    if (!Z.open) return;
    if (!P.pow0) { Z.close(); return; }                                   // the power went
    if (view === 'boot') { var b = Math.floor(bootT * 5); bootT += dt; if (Math.floor(bootT * 5) !== b) { draw(); Sound.click(); } if (bootT > 2.6) { view = P.ent.login ? 'desk' : 'login'; draw(); } }
    if (lockT > 0) { var c = Math.ceil(lockT); lockT -= dt; if (Math.ceil(lockT) !== c) draw(); }
  };
  return Z;
})();
