/* Jurassic Massacre — the tester's back door.
   Type the code into the small box at the bottom of the main menu and an "Admin teleport" entry appears: pick a point in
   the game and start there with everything before it already done.  Uses whichever difficulty is selected.  A teleport
   never writes a save by itself, so a real save is only replaced if you save at a terminal afterwards. */
'use strict';

var Admin = (function () {
  var A = {}, CODE = 'adminpetros', KEY = 'jurassicMassacreAdmin', panel = null, btn = null, box = null;
  function unlocked() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }

  // ---------- what "already done" means at each point ----------
  function entranceDone() {                       // generator running, shop and lanes powered, staff wing finished, lanes open
    var N = P.ent, i;
    N.fuel = 2; N.pour = 1; N.door = true; N.note = true; N.stall = 0; N.crank = 0; N.login = true; N.link = true;
    for (i = 0; i < 6; i++) N.brk[i] = N.order[i] === 0 || N.order[i] === 1;
    N.run = true; P.pow0 = true; P.turn = true;
    var n = P.net; n.key = true; n.door = 2; n.ups = true; n.a = n.A; n.b = n.B; n.heard = true;
  }
  function sectorADone() { entranceDone(); keysGot[0] = keysGot[1] = true; P.pen = true; P.pulled = P.lever.slice(); P.gateA = true; }
  function sectorBDone() { sectorADone(); keysGot[2] = true; P.power = true; P.sw.g = [true, true, true]; P.gateB = true; }
  function allDone() { sectorBDone(); keysGot[3] = keysGot[4] = true; P.card = true; P.winch.h = 0; P.winch.stop = 3; P.box = 1; }
  var SPOTS = [
    { name: 'Front gate', note: 'The very start, without the intro.', x: null },
    { name: 'Inside the park', note: 'Generator, gift shop and staff wing done. You are through the ticket lanes.', x: 0, z: TURN_Z - 6, yaw: 0, set: entranceDone },
    { name: 'Sector 1', note: 'Aquarium and raptor paddock keys in hand, Gate A open.', x: 0, z: FENCE_A - 6, yaw: 0, set: sectorADone },
    { name: 'Wetland', note: 'Same as Sector 1, standing at the flood-control board.', x: -31.5, z: -3.5, yaw: 0.75, set: sectorADone },
    { name: 'Sector 2', note: 'Three keys, Visitor Center done, Gate B open.', x: 0, z: FENCE_B - 6, yaw: 0, set: sectorBDone },
    { name: 'Aviary gate', note: 'Same as Sector 2, outside the aviary. The keeper still has the card.', x: -63.5, z: -89.5, yaw: PI / 2, set: sectorBDone },
    { name: 'The chase', note: 'All five keys. The lockdown starts the moment you arrive.', x: 0, z: FENCE_B - 10, yaw: PI, set: allDone, chase: true }
  ];
  A.SPOTS = SPOTS;
  A.go = function (i) {
    var s = SPOTS[i]; if (!s) return;
    hide(); if (window.Settings) Settings.close();
    newGame(false);                                 // a clean game on the chosen difficulty, no cutscene
    if (s.x === null) return;
    s.set();
    player.x = s.x; player.z = s.z; player.y = 0; player.yaw = s.yaw; player.cy = s.yaw; player.pitch = 0;
    resetPlayer(); placeItems(); resetDinos(); updateHud(true);
    if (s.chase) {                                  // startEscape() without its checkpoint save
      P.esc = { relA: 0, relB: 0, turn: 0, lock: 0, gate: 0 }; Entrance.breach = 0; breachT = 0;
      Sound.alarm(); Sound.roar(true, 0.7); escBigT = 1.9; $('escape').classList.add('big');
      showMsg('LOCKDOWN.  Every gate in the park has sealed, and everything in it knows where you are.', 6);
    } else showMsg('ADMIN — ' + s.name + '.  ' + s.note, 5);
  };

  // ---------- the menu ----------
  function hide() { if (panel) panel.classList.remove('show'); if (btn) btn.classList.remove('on'); }
  function toggle() {
    var on = !panel.classList.contains('show');
    if (window.Settings) Settings.close();
    panel.classList.toggle('show', on); btn.classList.toggle('on', on);
  }
  function reveal() { btn.style.display = ''; box.style.display = 'none'; }
  (function () {
    var nav = document.querySelector('#menu .nav'), col = document.querySelector('#menu .menu-col');
    btn = document.createElement('button'); btn.id = 'btnAdmin'; btn.textContent = 'Admin teleport'; btn.style.display = 'none'; btn.onclick = toggle; nav.appendChild(btn);
    box = document.createElement('input'); box.id = 'codeBox'; box.type = 'text'; box.placeholder = 'Enter code'; box.autocomplete = 'off'; box.spellcheck = false; box.maxLength = 24;
    box.style.cssText = 'all:unset;box-sizing:border-box;display:block;width:150px;margin-top:22px;padding:6px 10px;font:500 11px var(--body);letter-spacing:.2em;text-transform:uppercase;color:#8f897a;border-bottom:1px solid rgba(233,226,208,.14);opacity:.55;';
    box.addEventListener('keydown', function (e) {
      e.stopPropagation();                          // typing here must not drive the game or the menu
      if (e.key !== 'Enter') return;
      if (box.value.trim().toLowerCase() === CODE) { try { localStorage.setItem(KEY, '1'); } catch (er) {} box.value = ''; box.blur(); reveal(); Sound.init(); Sound.chime(); toggle(); }
      else { box.value = ''; box.placeholder = 'Wrong code'; setTimeout(function () { box.placeholder = 'Enter code'; }, 1400); }
    });
    box.addEventListener('keyup', function (e) { e.stopPropagation(); });
    col.appendChild(box);
    panel = document.createElement('section'); panel.id = 'pAdmin'; panel.className = 'panel';
    panel.innerHTML = '<div class="p-head"><h3>Admin teleport</h3><small>Start from any point · uses the selected difficulty</small></div><div class="p-body">' +
      SPOTS.map(function (s, i) { return '<button class="opt" data-a="' + i + '"><i></i><b>' + s.name + '</b><span>' + s.note + '</span></button>'; }).join('') +
      '</div><div class="p-foot"><span class="hintk">Esc · Back</span><button class="pbtn" id="btnAdminLock">Lock again</button></div>';
    document.body.appendChild(panel);
    each('#pAdmin .opt', function (b) { b.onclick = function () { A.go(+b.getAttribute('data-a')); }; });
    $('btnAdminLock').onclick = function () { try { localStorage.removeItem(KEY); } catch (e) {} hide(); btn.style.display = 'none'; box.style.display = 'block'; };
    window.addEventListener('keydown', function (e) { if (e.code === 'Escape' && panel.classList.contains('show')) { e.stopPropagation(); hide(); } }, true);
    each('#menu .nav button', function (b) { if (b !== btn) b.addEventListener('click', hide); });      // opening anything else closes this
    if (unlocked()) reveal();
  })();
  return A;
})();
