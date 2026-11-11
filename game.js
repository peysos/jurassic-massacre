/* Jurassic Massacre — game: puzzles, the lockdown escape, saving, input, HUD and the main loop. */
'use strict';

var player = { x: START.x, z: START.z, y: 0, vy: 0, yaw: PI, pitch: 0, battery: 100, stamina: 100, light: false, crouch: false, eye: 1.7, bob: 0, stepT: 0,
  vx: 0, vz: 0, roll: 0, cy: PI, cp: 0, grounded: true, water: false };
var playTime = 0, keysDown = {}, mapOpen = false, panel = null, fuseSel = [];
var msgT = 0, beatT = 0, danger = 0, flashA = 0, burst = 0, stunCD = 0, exhausted = false, routeT = 0, tickT = 0, noiseT = 0, escBigT = 0, duckT = 4;
var invText = '', objText = '', promptText = '', escText = '', holdProg = { winch: 0 };
var uiOpen = false, carriedCan = null, breachT = 0, beamNear = 0;        // sitting at the staff computer; the fuel can in the left hand

function countKeys() { var n = 0; for (var i = 0; i < keysGot.length; i++) if (keysGot[i]) n++; return n; }
function done(need) {
  if (!P) return false;
  return need === 'pow0' ? P.pow0 : need === 'turn' ? P.turn : need === 'pen' ? P.pen : need === 'power' ? P.power : need === 'aqua' ? !!keysGot[0] : !!(keysGot[3] || keysGot[4]);
}
function gateOpen(which) { return P.esc ? P.esc['rel' + which] >= 1 : P['gate' + which]; }
function turnOpen() { return P.turn && (!P.esc || P.esc.turn >= 1); }

// ---------- puzzle generation ----------
function permutations(n) {
  var out = [];
  (function rec(a, rest) { if (!rest.length) { out.push(a); return; } rest.forEach(function (v, i) { rec(a.concat(v), rest.slice(0, i).concat(rest.slice(i + 1))); }); })([], Array.apply(null, Array(n)).map(function (_, i) { return i; }));
  return out;
}
// A logic puzzle: the plaque gives clues that pin down exactly one pulling order
function makeLeverPuzzle(n) {
  var sol = shuffle(Array.apply(null, Array(n)).map(function (_, i) { return i; })), ORD = ['first', 'second', 'third'];
  var perms = permutations(n), cands = [], a, b, k;
  function pos(p, lever) { return p.indexOf(lever); }
  for (a = 0; a < n; a++) for (b = 0; b < n; b++) if (a !== b && pos(sol, a) < pos(sol, b))
    cands.push({ f: (function (x, y) { return function (p) { return pos(p, x) < pos(p, y); }; })(a, b), t: 'Lever ' + ROMAN[a] + ' comes some time before lever ' + ROMAN[b] + '.' });
  for (a = 0; a < n; a++) for (k = 0; k < n; k++) if (pos(sol, a) !== k)
    cands.push({ f: (function (x, y) { return function (p) { return pos(p, x) !== y; }; })(a, k), t: 'Lever ' + ROMAN[a] + ' is not pulled ' + (k === n - 1 ? 'last' : ORD[k]) + '.' });
  for (a = 0; a < n; a++) for (b = a + 1; b < n; b++) if (Math.abs(pos(sol, a) - pos(sol, b)) !== 1)
    cands.push({ f: (function (x, y) { return function (p) { return Math.abs(pos(p, x) - pos(p, y)) !== 1; }; })(a, b), t: 'Levers ' + ROMAN[a] + ' and ' + ROMAN[b] + ' are never pulled back to back.' });
  shuffle(cands);
  var chosen = [], left = perms;
  for (k = 0; k < cands.length && left.length > 1; k++) { var nl = left.filter(cands[k].f); if (nl.length < left.length) { chosen.push(cands[k]); left = nl; } }
  for (k = chosen.length - 1; k >= 0 && chosen.length > 2; k--) {        // drop clues that turned out to be redundant
    var others = chosen.filter(function (_, i) { return i !== k; });
    if (perms.filter(function (p) { return others.every(function (c) { return c.f(p); }); }).length === 1) chosen = others;
  }
  return { order: sol, clues: chosen.map(function (c) { return c.t; }) };
}
// the entrance: a generator that cannot carry every circuit, and a staff login whose password is spread across two notices
function newEntrance() {
  var max = 8 + ((Math.random() * 3) | 0), shop = 3 + ((Math.random() * 2) | 0), lanes = 2 + ((Math.random() * 2) | 0), lamps = max - shop - lanes;
  function extra() { return lamps + 1 + ((Math.random() * 3) | 0); }
  var names = shuffle(['Delilah', 'Roxie', 'Pepper', 'Juno', 'Mabel', 'Tilly', 'Clover', 'Sadie']), tags = [], rows, pet = (Math.random() * 3) | 0;
  while (tags.length < 6) { var t = String(1000 + ((Math.random() * 9000) | 0)); if (tags.indexOf(t) < 0) tags.push(t); }
  rows = shuffle([0, 1, 2, 3, 4, 5]).map(function (k, n) { var sp = [['Velociraptor', 'Raptor Paddock'], ['Velociraptor', 'Raptor Paddock'], ['Velociraptor', 'Holding Pen'], ['T. rex', 'T-Rex Kingdom'], ['Plesiosaur', 'Aquarium'], ['Pterosaur', 'Aviary']][k]; return [names[k], sp[0], sp[1], tags[k], k]; });
  return { fuel: 0, pour: 0, crank: 0, stall: 0, door: false, note: false, run: false, brk: [true, true, true, true, true, true], order: shuffle([0, 1, 2, 3, 4, 5]),
    kw: [shop, lanes, lamps, extra(), extra(), extra()], max: max, keeper: 'Marla Voss', user: 'MVOSS', pet: names[pet], pin: tags[pet],
    animals: rows.map(function (r) { return r.slice(0, 4); }), login: false, tries: 0, link: false, grid: null, mail: [] };
}
function entLoad() { var N = P.ent, s = 0; for (var i = 0; i < 6; i++) if (N.brk[i]) s += N.kw[N.order[i]]; return s; }
function entCircuit(c) { return P.ent.run && P.ent.brk[P.ent.order.indexOf(c)]; }      // 0 gift shop, 1 ticket lanes, 2 plaza lamps
function entPower() { P.pow0 = !!entCircuit(0); }
function newPuzzles() {
  var lev = makeLeverPuzzle(DIFF.levers);
  var ratings = shuffle([5, 10, 15, 20, 25, 30, 40]).slice(0, 5), pick = shuffle([0, 1, 2, 3, 4]).slice(0, 3);
  var ws = { easy: [[7, 3, 2]], normal: [[9, 4, 3], [8, 3, 2]], hard: [[9, 5, 3], [10, 4, 3]] }[diffName], w = ws[(Math.random() * ws.length) | 0];
  return { turn: false, pow0: false, ent: newEntrance(), pen: false, lever: lev.order, clues: lev.clues, pulled: [],
    fuses: ratings, fuseGot: [false, false, false, false, false], load: ratings[pick[0]] + ratings[pick[1]] + ratings[pick[2]], power: false,
    winch: { h: w[0], start: w[0], down: w[1], up: w[2] }, gateA: false, gateB: false, box: 0, inv: 0, esc: null };
}
function refreshClues() {
  var i;
  if (window.Entrance) Entrance.refresh();
  plaqueText(W.plaque, 'HOLDING PEN — RELEASE ORDER', P.clues.concat('A wrong pull sounds the alarm.'));
  plaqueText(W.fusePlaque, 'FUSE BOX', ['Required load: exactly ' + P.load + ' A', 'Three slots. Over or under trips the breaker.', 'Spare fuses were left around this sector.']);
  plaqueText(W.aviPlaque, 'KEY CAGE WINCHES', ['The cage hangs ' + P.winch.start + ' m above the pedestal.', 'Winch A lowers it ' + P.winch.down + ' m a turn.  Winch B raises it ' + P.winch.up + ' m.',
    'Land it exactly. Lower it too far and the brake', 'slams it back to the top — and it will hear.']);
  plaqueText(W.winchSigns[0], 'WINCH A', ['▼ ' + P.winch.down + ' m per turn']); plaqueText(W.winchSigns[1], 'WINCH B', ['▲ ' + P.winch.up + ' m per turn']);
  for (i = 0; i < 5; i++) { var c = W.fuseCols[P.fuses[i]]; W.fuseMats[i].color.setHex(c); W.fuseMats[i].emissive.setHex(c); }
}
function setDifficulty(name) {
  if (!DIFFS[name]) name = 'normal';
  diffName = name; DIFF = DIFFS[name]; prefs.diff = name; savePrefs();
  each('#diff button', function (b) { b.classList.toggle('sel', b.getAttribute('data-d') === name); });
  $('diffNote').textContent = {
    easy: 'Slow to notice you, quick to give up, and they hunt alone. A red line guides the final escape, and the plesiosaur is penned once you have its key.',
    normal: 'They investigate noises, search where they last saw you, call the pack and flank. No guide line.',
    hard: 'They always know roughly where you are, lead their attacks, cut you off and hunt as a pack. Longer locks, fewer batteries.'
  }[name];
}

// ---------- the world follows the puzzle state ----------
function stepWorld(dt, instant) {
  function go(k, target, rate) { anim[k] = instant ? target : anim[k] + clamp(target - anim[k], -dt * rate, dt * rate); }
  var esc = P.esc, i, blink = Math.sin(playTime * 9) > 0;
  go('turn', turnOpen() ? 1 : 0, 0.8); go('gA', gateOpen('A') ? 1 : 0, esc ? 0.3 : 0.45); go('gB', gateOpen('B') ? 1 : 0, esc ? 0.3 : 0.45);
  go('pen', P.pen ? 1 : 0, 0.9); go('cage', P.power ? 1 : 0, 0.5); go('cover', keysGot[0] && DIFF.cover ? 1 : 0, 0.3); go('box', P.box >= 1 ? 1 : 0, 1.2);
  anim.gate = esc ? esc.gate : 0;
  if (window.Entrance) Entrance.step(dt, instant);
  [['A', 'gA'], ['B', 'gB']].forEach(function (q) {
    var G = W['gate' + q[0]], open = gateOpen(q[0]);
    G.set(anim[q[1]]); G.box.off = anim[q[1]] > 0.8; G.lamp.color.setHex(open ? 0x35ff8a : 0xff3020);
    var need = esc && esc['rel' + q[0]] < 1;
    G.beacon.color.setHex(need ? (blink ? 0xff3a1a : 0x401008) : esc ? 0x35ff8a : 0x1a0a06);
    G.handle.rotation.x = esc ? Math.sin(esc['rel' + q[0]] * 26) * 0.5 : 0;
  });
  W.penDoor.rotation.y = anim.pen * 1.9; W.penBox.off = anim.pen > 0.5;
  W.cage.position.y = anim.cage * 3.4; W.cageBoxes.forEach(function (b) { b.off = anim.cage > 0.6; });
  for (i = 0; i < 4; i++) {
    var down = P.pen || P.pulled.indexOf(i) >= 0;
    W.levers[i].rotation.x = down ? 1.0 : -0.6; W.leverLamps[i].color.setHex(down ? 0x35ff8a : 0xb01208); W['leverSt' + i].visible = i < P.lever.length;
  }
  for (i = 0; i < 3; i++) W.fuseLamps[i].color.setHex(P.power ? 0x35ff8a : 0x1a0e06);
  W.breaker.rotation.z = P.power ? 0 : 0.9;
  for (i = 0; i < 2; i++) W.cranks[i].rotation.x = holdProg.winchSpin || 0;
  var ch = P.winch.h * 0.8;
  W.aviCage.position.y = 1.4 + ch; W.aviCage.visible = P.winch.h !== 0 && !keysGot[3]; keyMeshes[3].position.y = W.keyY[3] + ch;
  W.boxLid.rotation.x = -anim.box * 1.9; keyMeshes[4].visible = !keysGot[4] && anim.box > 0.5;
  for (i = 0; i < TERMS.length; i++) W.termScr[i].color.setHex(!esc && done(TERMS[i].need) ? 0x35ff8a : 0x551010);
  for (i = 0; i < fuseMeshes.length; i++) fuseMeshes[i].visible = fuseMeshes[i].userData.glowG.visible = !P.fuseGot[i];
  for (i = 0; i < W.safeViz.length; i++) if (W.safeViz[i] && W.safeViz[i].set) W.safeViz[i].set(!!esc, blink);
  W.skeleton.hat.visible = prefs.duck;
}
function placeItems() {
  var i;
  for (i = 0; i < ZONES.length; i++) keyMeshes[i].visible = !keysGot[i];
  for (i = 0; i < batMeshes.length; i++) {
    batMeshes[i].visible = i < batPos.length && !batGot[i];
    if (i < batPos.length) batMeshes[i].position.set(batPos[i][0], inSafe(batPos[i][0], batPos[i][1]) ? 0.085 : 0, batPos[i][1]);
  }
  refreshClues(); stepWorld(0, true);
}
function resetPlayer() {
  player.pitch = 0; player.stamina = 100; player.light = false; player.crouch = false; player.eye = 1.7;
  exhausted = false; burst = 0; stunCD = 0; flashA = 0; closePanel(); uiOpen = false; Scares.reset(); Hands.setVisible(true); if (P) setCarry(P.ent.fuel === 1 ? 'can' : null);
  player.vx = player.vz = 0; player.vy = 0; player.y = 0; player.roll = 0; player.cy = player.yaw; player.cp = 0; player.water = false; player.grounded = true;
  camera.fov = 72; camera.updateProjectionMatrix(); invText = objText = promptText = escText = ''; holdProg = { winch: 0 };
  $('escape').classList.remove('big'); escBigT = 0;
}
function newGame() {
  setDifficulty(diffName);
  keysGot = ZONES.map(function () { return false; });
  batPos = shuffle(BATTERY_SPOTS.slice()).slice(0, DIFF.batteries); batGot = batPos.map(function () { return false; });
  P = newPuzzles(); Entrance.breach = 0; breachT = 0;
  player.x = START.x; player.z = START.z; player.yaw = PI; player.battery = 100; playTime = 0;
  resetPlayer(); placeItems(); resetDinos();
  if (!prefs.intro && !window.__jmNoIntro) {      // the first time: walk in from the road
    Sound.init(); lockPointer(); $('hud').classList.remove('show');
    Cutscene.play(function () { beginPlay(); });
  } else { player.yaw = 0; player.cy = 0; player.light = false; beginPlay(); showMsg('The gate has locked behind you.  Press F for your flashlight.', 7); }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveGame(zoneName, quiet) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ x: player.x, z: player.z, yaw: player.yaw, battery: player.battery, keysGot: keysGot,
      batPos: batPos, batGot: batGot, diff: diffName, time: playTime, where: zoneName, P: P }));
    if (!quiet) { showMsg('Game saved — ' + zoneName, 3); Sound.save(); }
  } catch (e) { if (!quiet) showMsg('Could not save (browser storage is blocked).', 4); }
  refreshMenu();
}
function loadGame() {
  var s; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { s = null; }
  if (!s || !s.keysGot || s.keysGot.length !== ZONES.length || !s.batPos || !s.P || !s.P.ent || !s.P.winch) return false;
  setDifficulty(s.diff);
  keysGot = s.keysGot; batPos = s.batPos; batGot = s.batGot || batPos.map(function () { return false; });
  P = s.P; Entrance.breach = P.esc && P.esc.lock >= 5 ? 1 : 0; breachT = 0;
  player.x = s.x; player.z = s.z; player.yaw = s.yaw || 0;
  player.battery = s.battery === undefined ? 100 : s.battery; playTime = s.time || 0;
  resetPlayer(); placeItems(); resetDinos(); beginPlay();
  showMsg(P.esc ? 'Back to the start of the lockdown.' : 'Loaded — ' + (s.where || 'last save') + ' (' + DIFF.label + ')', 3);
  return true;
}

/* Cinematics: startCine({ update: function (dt) { ...; return true when finished; }, end: function () {} }) takes over the frame loop.
   The world is not simulated while one runs; the cinematic moves the camera (and anything else) itself. */
var cine = null;
function startCine(c) { cine = c; setState('cine'); }
function show(id, on) { $(id).classList.toggle('show', !!on); }
function setState(s) {
  state = s;
  show('menu', s === 'menu'); show('pause', s === 'paused'); show('dead', s === 'dead'); show('won', s === 'won');
  show('hud', s === 'playing' || s === 'paused');
  document.body.classList.toggle('cine', s === 'cine');
  if (s !== 'playing') { keysDown = {}; if (s !== 'cine' && document.pointerLockElement) document.exitPointerLock(); }
  if (s !== 'playing' && s !== 'cine') { Sound.genSet(0); Sound.klaxonSet(0); if (ZooNet.open) { uiOpen = false; ZooNet.close(); } }
  if (s === 'paused') $('pauseDiff').textContent = 'Difficulty: ' + DIFF.label;
  if (s === 'menu') $('howto').classList.remove('show');
}
function lockPointer() { try { var p = canvas.requestPointerLock(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
function beginPlay() {
  Sound.init(); danger = 0; mapOpen = false; $('map').style.display = 'none';
  $('danger').style.opacity = 0; $('flash').style.opacity = 0;
  setState('playing'); lockPointer(); updateHud(true);
}
function refreshMenu() {
  var h = hasSave(); $('btnContinue').disabled = !h; $('btnLoad').disabled = !h;
  each('.btnSound', function (b) { b.textContent = 'Sound: ' + (prefs.muted ? 'Off' : 'On'); });
  $('secret').style.display = prefs.duck ? 'inline' : 'none';
  $('btnIntro').style.display = prefs.intro ? '' : 'none';             // offered once you have seen it
}
function showMsg(t, secs) { var m = $('msg'); m.textContent = t; m.style.opacity = 1; msgT = secs || 3; }

/* Being caught.  If scares.js is loaded it plays that creature's kill sequence first (a short cinematic), then calls back.
   `d` is the dinos[] entry for a raptor or the rex; undefined for the plesiosaur and the pterosaur. */
function die(kind, d) {
  if (state !== 'playing') return;
  if (window.Scares && Scares.kill) { closePanel(); Scares.kill(kind, d, function () { showDeath(kind); }); }
  else showDeath(kind);
}
function showDeath(kind) {
  var txt = { raptor: ['YOU WERE DEVOURED', 'The raptors found you.'], rex: ['YOU WERE DEVOURED', 'The Tyrannosaurus found you.'],
    ptero: ['YOU WERE CARRIED OFF', 'The pterosaur took you from above.'], ples: ['YOU WERE DRAGGED UNDER', 'The plesiosaur was waiting in the water.'] }[kind];
  if (kind === 'ptero') Sound.screech(); else if (kind === 'ples') Sound.splash(); else Sound.roar(kind === 'rex');
  Sound.noise(0.6, 3000, 0.5, 0.1);
  $('deadTitle').textContent = txt[0];
  $('deadSub').textContent = txt[1] + ' Key pieces recovered: ' + countKeys() + ' / ' + ZONES.length + '.' + (hasSave() ? (P.esc ? ' You can retry the escape from the start of the lockdown.' : '') : ' You had no save.');
  $('btnLoad').textContent = P.esc ? 'Retry the Escape' : 'Load Last Save';
  refreshMenu(); setState('dead');
}
function win() { Sound.klaxonSet(0); Cutscene.ending(showWin); }
function showWin() {
  var m = Math.floor(playTime / 60), s = Math.floor(playTime % 60);
  $('wonSub').textContent = 'You make the truck with the gate still grinding behind you, and do not look back until the trees close over the road. Time in the park: ' + m + ':' + (s < 10 ? '0' : '') + s + ' on ' + DIFF.label + '.';
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  Sound.chime(); refreshMenu(); setState('won');
}
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    var p = document.documentElement.requestFullscreen();
    if (p && p.then) p.then(function () { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock().catch(function () {}); }).catch(function () {});
  } else document.exitFullscreen();
}

// ---------- the lockdown: taking the fifth key piece seals the park ----------
function startEscape() {
  P.esc = { relA: 0, relB: 0, turn: 0, lock: 0, gate: 0 };
  Sound.alarm(); Sound.roar(true, 0.7); Entrance.breach = 0; breachT = 0;
  showMsg('LOCKDOWN.  Every gate in the park has sealed, and everything in it knows where you are.', 6);
  saveGame('lockdown', true);                  // checkpoint, so a death restarts the escape rather than the last puzzle
  escBigT = 1.9; $('escape').classList.add('big');
}
function escapeStep() {      // [instruction, target x, target z]
  var e = P.esc, sec = sector(player.z);
  if (e.relB < 1 && sec === 2) return ['Sector Gate B has sealed. Pump the emergency release — the yellow cabinet east along the fence.', RELEASE.B[0], RELEASE.B[1] - 1.5];
  if (e.relA < 1 && (sec === 1 || sec === 2)) return ['Sector Gate A has sealed. Pump the emergency release — the yellow cabinet west along the fence.', RELEASE.A[0], RELEASE.A[1] - 1.5];
  if (e.turn < 1 && player.z < TURN_Z) return ['The ticket lanes have locked. Force a turnstile.', 2.025, TURN_Z - 2];
  if (e.lock < 5) return ['Fit the five key sections into the manual release on the gate’s left pillar.', -4.15, WORLD - 2];
  if (e.gate < 1) return ['The gate is opening. Stay alive.', 0, WORLD - 6];
  return ['RUN.', 0, WORLD - 2];
}

// flashlight burst: stuns whatever is caught in the beam
function stunBurst() {
  if (stunCD > 0 || Hands.reloading()) return;
  if (player.battery < 25) { showMsg('Not enough battery for a flash burst (needs 25%). Press R to load a spare.', 2.5); Sound.deny(); return; }
  player.battery -= 25; stunCD = 1.2; burst = 1; flashA = 0.75; Sound.zap(); Hands.burst();
  var fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), hit = 0;
  function inBeam(x, z, reach, slack) {
    var dx = x - player.x, dz = z - player.z, dp = Math.hypot(dx, dz);
    return dp <= reach && (dp < slack || (dx * fx + dz * fz) / dp > 0.74);
  }
  makeNoise(player.x, player.z, 26);           // anything nearby that is not caught in the beam comes to look at the flash
  dinos.forEach(function (d) {
    if (!d.active || !inBeam(d.x, d.z, d.rex ? 30 : 24, d.r + 1.5)) return;
    d.state = 'stun'; d.stunT = DIFF.stun * (d.rex ? 0.6 : 1); d.lastX = d.x; d.lastZ = d.z; hit++; Sound.roar(d.rex, 0.5);
  });
  if (plesMesh.visible && inBeam(ples.x + Math.sin(ples.rot) * 3, ples.z + Math.cos(ples.rot) * 3, 24, 5)) { ples.state = 'stun'; ples.stunT = DIFF.stun; hit++; }
  var cp = Math.cos(player.pitch), ex = ptero.x - player.x, ey = ptero.y - (player.y + player.eye), ez = ptero.z - player.z, ed = Math.hypot(ex, ey, ez);
  if (ed < 40 && (ed < 4 || (ex * fx * cp + ey * Math.sin(player.pitch) + ez * fz * cp) / ed > 0.8)) { ptero.state = 'stun'; ptero.stunT = DIFF.stun * 1.6; hit++; Sound.screech(); }
  if (hit) showMsg(hit > 1 ? hit + ' creatures stunned — move!' : 'Stunned — move!', 2.5);
  if (player.battery <= 0) player.light = false;
}
function loadBattery() {
  if (P.inv <= 0) { showMsg('No spare batteries.', 2); Sound.deny(); return; }
  if (player.battery >= 99) { showMsg('The flashlight is already full.', 2); return; }
  if (!Hands.reload(function () {                 // the cell goes in at the end of the animation
    player.battery = Math.min(100, player.battery + DIFF.charge); Sound.pickup();
    showMsg('Battery loaded  +' + DIFF.charge + '%   (' + P.inv + ' spare)', 2.5);
  })) return;
  P.inv--;
}
function jump() {
  if (!player.grounded || player.water) return;
  player.vy = 7; player.grounded = false; player.crouch = false; Sound.step(0.1, 500);
}

// ---------- interaction ----------
function nearGate() { return player.z > WORLD - 10 && Math.abs(player.x) < 8; }
function tryGate(G, name) {
  return function () {
    if (countKeys() >= G.need) { P[name] = true; Sound.grind(); showMsg('Sector gate unlocked.', 3); }
    else { showMsg('The reader wants ' + G.need + ' key pieces. You have ' + countKeys() + '.', 3); Sound.deny(); }
  };
}
function pullLever(i) {
  return function () {
    if (P.pulled.indexOf(i) >= 0) return;
    P.pulled.push(i); Sound.clunk();
    if (P.lever[P.pulled.length - 1] !== i) {
      P.pulled = []; Sound.buzz(); showMsg('Wrong order. The alarm has woken the paddock.', 4);
      dinos.forEach(function (d) { if (d.active && !d.rex && sector(d.z) === sector(player.z) && dist(d.x, d.z, player.x, player.z) < 90) { d.alertT = 7; startChase(d, false); } });
    } else if (P.pulled.length === P.lever.length) { P.pen = true; Sound.chime(); Sound.grind(); showMsg('Every lamp turns green. The holding pen swings open.', 4); }
    else showMsg('Lever ' + ROMAN[i] + ' locks into place. (' + P.pulled.length + ' / ' + P.lever.length + ')', 2.5);
  };
}
function carried() { var out = []; for (var i = 0; i < 5; i++) if (P.fuseGot[i]) out.push(i); return out; }
function openPanel(which) { panel = which; fuseSel = []; renderPanel(); }
function closePanel() { panel = null; $('panel').style.display = 'none'; }
function renderPanel() {
  var el = $('panel'); el.style.display = 'block';
  if (panel === 'board') {
    var N = P.ent, rows = '';
    for (var i = 0; i < 6; i++) rows += '<span class="row' + (N.brk[i] ? ' on' : '') + '"><kbd>' + (i + 1) + '</kbd> ' + Entrance.CIRCUITS[N.order[i]] + ' · ' + N.kw[N.order[i]] + ' kW · ' + (N.brk[i] ? 'ON' : 'off') + '</span>' + (i === 2 ? '<br>' : '');
    $('panelTitle').textContent = 'DISTRIBUTION BOARD' + (N.run ? ' — LIVE' : ''); $('panelBody').innerHTML = rows;
    $('panelHint').innerHTML = 'Number keys switch a circuit &nbsp;·&nbsp; <kbd>E</kbd> close';
  } else {
    var have = carried(), sum = 0, h = '';
    have.forEach(function (fi, n) { var on = fuseSel.indexOf(fi) >= 0; if (on) sum += P.fuses[fi]; h += '<span class="row' + (on ? ' on' : '') + '"><kbd>' + (n + 1) + '</kbd> ' + P.fuses[fi] + ' A</span>'; });
    $('panelTitle').textContent = 'FUSE BOX — REQUIRED LOAD ' + P.load + ' A · 3 SLOTS';
    $('panelBody').innerHTML = (h || 'You are not carrying any fuses.') + '<br>Fitted: ' + fuseSel.length + ' / 3 &nbsp; Load: ' + sum + ' A';
    $('panelHint').innerHTML = 'Number keys fit or remove a fuse &nbsp;·&nbsp; <kbd>Enter</kbd> throw the breaker &nbsp;·&nbsp; <kbd>E</kbd> close';
  }
}
function panelKey(code) {
  var m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (code === 'KeyE' || code === 'Escape') { closePanel(); return true; }
  if (panel === 'board') {
    if (m && +m[1] >= 1 && +m[1] <= 6) flipBreaker(+m[1] - 1); else return false;
  } else {
    var have = carried();
    if (m && +m[1] >= 1 && +m[1] <= have.length) {
      var fi = have[+m[1] - 1], at = fuseSel.indexOf(fi);
      if (at >= 0) fuseSel.splice(at, 1); else if (fuseSel.length < 3) fuseSel.push(fi); else Sound.deny();
      Sound.click();
    } else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
      var sum = fuseSel.reduce(function (a, f) { return a + P.fuses[f]; }, 0);
      if (fuseSel.length === 3 && sum === P.load) { P.power = true; closePanel(); Sound.clunk(); Sound.grind(); Sound.chime(); showMsg('Power restored. The shutter is lifting, and the ranger terminals are back online.', 5); return true; }
      Sound.spark(); flashA = 0.35; makeNoise(player.x, player.z, 34);
      showMsg(fuseSel.length < 3 ? 'All three slots need a fuse. The breaker trips with a bang.' : 'The breaker trips with a bang: ' + sum + ' A is ' + (sum > P.load ? 'too much.' : 'not enough.'), 4);
      fuseSel = [];
    } else return false;
  }
  renderPanel(); return true;
}
function winchTurn(i) {
  return function (dt) {
    holdProg.winchSpin = (holdProg.winchSpin || 0) + dt * 5;
    holdProg.winch = (holdProg.winch || 0) + dt / (2 * DIFF.hold);
    tickT -= dt; if (tickT <= 0) { tickT = 0.24; Sound.click(); }
    if (holdProg.winch < 1) return;
    holdProg.winch = 0;
    var w = P.winch;
    if (i === 0) {
      if (w.h - w.down < 0) { w.h = w.start; Sound.buzz(); Sound.clunk(); ptero.expo += 1.1; makeNoise(player.x, player.z, 30); showMsg('Too far — the brake slams the cage back to ' + w.start + ' m. Something stirs overhead.', 4.5); }
      else { w.h -= w.down; Sound.clunk(); if (w.h === 0) { Sound.chime(); showMsg('The cage lands exactly on the pedestal and falls open.', 4.5); } else showMsg('The cage drops to ' + w.h + ' m.', 2.5); }
    } else if (w.h >= w.start) showMsg('The cage is already at the top.', 2.5);
    else { w.h = Math.min(w.start, w.h + w.up); Sound.clunk(); showMsg('The cage rises to ' + w.h + ' m.', 2.5); }
  };
}
// ---------- the entrance: shed door, fuel, generator, distribution board, staff computer ----------
var handPt = new THREE.Vector3();
function at(obj, x, y, z) { return function () { return handPt.set(x, y, z).applyMatrix4(obj.matrixWorld); }; }     // a point that rides on a moving object, for the left hand to hold
function setCarry(what) {
  if (!carriedCan) { carriedCan = Entrance.buildCan(Hands.L.hand); carriedCan.position.set(-0.002, -0.404, -0.082); carriedCan.rotation.y = PI / 2; carriedCan.scale.x = -1; }
  carriedCan.visible = what === 'can'; Hands.carried = what === 'can' ? carriedCan : null;
}
function flipBreaker(i) {
  var N = P.ent; N.brk[i] = !N.brk[i]; Sound.clunk();
  Hands.use('brk' + i + ':' + playTime, { point: at(Entrance.brk[i], 0, 0.04, 0.06), pose: 'point', rot: [0.15, 0.1, 0.5], dur: 0.42, press: 0.02 });
  if (N.run && entLoad() > N.max) genStall('The board is asking for ' + entLoad() + ' kW. The generator bogs down and dies.');
  entPower();
}
function genStall(msg) { var N = P.ent; N.run = false; N.stall = 3; N.crank = 0; entPower(); Sound.spark(); Sound.buzz(); flashA = 0.25; showMsg(msg, 6); if (ZooNet.open) ZooNet.close(); }
function genPull(dt) {
  var N = P.ent; N.crank = Math.min(1, N.crank + dt / (1.5 * DIFF.hold));
  tickT -= dt; if (tickT <= 0) { tickT = 0.22; Sound.noise(0.12, 500, 0.3); Sound.tone(70, 50, 0.12, 0.2, 'sawtooth'); }
  Hands.use('lever', { point: at(Entrance.genLever, 0.05, 0.27, 0), pose: 'hook', tip: 'hook', rot: [0.25, 0.95, 0.15] });
  if (N.crank < 1) return;
  N.crank = 0;
  if (entLoad() > N.max) { genStall('It coughs, catches for a second, and stalls. The board is asking for ' + entLoad() + ' kW; the plate says MAX ' + N.max + '.'); return; }
  N.run = true; entPower(); Sound.grind(); Sound.thud(0.5);
  showMsg(P.pow0 ? 'The generator catches and settles into a steady rumble. Across the plaza the gift shop lights stutter on.' : 'The generator is running, but the GIFT SHOP breaker is switched off.', 6);
}
function genPour(dt) {
  var N = P.ent; N.pour = Math.min(1, N.pour + dt / 3.2);
  tickT -= dt; if (tickT <= 0) { tickT = 0.3; Sound.noise(0.28, 900, 0.16); Sound.tone(180, 240, 0.2, 0.05, 'sine'); }
  Hands.use('pour', { point: at(Entrance.genCap, 0.3, 0.42, 0.0), pose: 'fist', tip: 'fist', rot: [0.2, 0.95, 0.15], spin: -1.05 * Math.min(1, N.pour * 6) });
  if (N.pour >= 1) { N.fuel = 2; setCarry(null); Sound.clunk(); showMsg('The can runs dry. The gauge needle climbs off empty.', 4); }
}
function openComputer() { uiOpen = true; keysDown = {}; if (document.pointerLockElement) document.exitPointerLock(); ZooNet.openUp(); }
ZooNet.onClose = function () { uiOpen = false; if (state === 'playing') lockPointer(); };
ZooNet.onUnlock = function () { showMsg('Somewhere outside, four turnstiles unlatch.', 5); };

function findInteract() {
  var px = player.x, pz = player.z, i, t, n = countKeys(), esc = P.esc, N = P.ent, En = Entrance;
  if (!N.door && dist(px, pz, -15.5, 127) < 1.6) return { text: '[E] Open the shed door', fn: function () {
    Hands.use('door', { point: at(En.shedDoor, 0.06, 1.25, 0.85), pose: 'wipe', tip: 'flat', rot: [1.3, 0.25, 0.2], dur: 1.0, press: 0.05, onTouch: function () { N.door = true; Sound.grind(); Sound.noise(0.9, 700, 0.18); } });
  } };
  if (N.fuel === 0 && dist(px, pz, En.canSpot.x, En.canSpot.z) < 2.1) return { text: '[E] Take the fuel can', fn: function () {
    Hands.use('can', { point: at(En.can, 0, 0.36, 0), pose: 'hook', tip: 'hook', rot: [0.5, 0.3, 0.2], dur: 0.5, onTouch: function () { N.fuel = 1; setCarry('can'); Sound.pickup(); showMsg('Diesel. Heavy, and nearly full.', 3); } });
  } };
  if (px < -16.3 && px > -22 && pz > 124 && pz < 130) {                    // inside the shed
    if (dist(px, pz, En.genSpot.x, En.genSpot.z) < 1.35) {
      if (N.run) return { text: 'The generator is running' };
      if (N.fuel === 0) return { text: '[E] Read the note taped to the generator', fn: function () { N.note = true; showMsg('“Tank is DRY. Spare can is on the buggy by the service gate. — M.”   The fuel gauge sits on E.', 7); } };
      if (N.fuel === 1) return { text: '[Hold E] Pour the diesel into the tank', prog: N.pour, hold: genPour };
      if (N.stall > 0) return { text: 'Stalled. ' + entLoad() + ' kW on a ' + N.max + ' kW set — shed some load at the board.' };
      return { text: '[Hold E] Pull the start lever', prog: N.crank, hold: genPull };
    }
    if (dist(px, pz, En.boardSpot.x, En.boardSpot.z) < 1.25) return panel ? { text: '' } : { text: '[E] Open the distribution board', fn: function () { openPanel('board'); } };
  }
  if (px > 22.05 && dist(px, pz, En.pc.x, En.pc.z) < 1.2) return P.pow0 ? { text: '[E] Use the staff computer', fn: openComputer } : { text: 'The computer is dead. There is no power in the building.' };
  for (i = 0; i < TERMS.length; i++) {
    t = TERMS[i];
    if (dist(px, pz, t.tx, t.tz) < (t.solo ? 2.6 : 2.4)) {
      if (esc) return { text: 'Terminal offline — park lockdown' };
      return done(t.need) ? { text: '[E] Save game at the terminal', fn: (function (nm) { return function () { saveGame(nm); }; })(t.name) } : { text: 'Terminal offline — ' + NEED_HINT[t.need] };
    }
  }
  var nearRel = dist(px, pz, En.release.x, En.release.z) < 2.3, atGate = pz > WORLD - 4.6 && Math.abs(px) < 4.2;
  if (nearRel || atGate) {
    if (!esc) return nearRel ? { text: 'Emergency manual release — fits five master key sections (you have ' + n + ')', fn: function () { showMsg('It will not turn without all five sections of the master key.', 3.5); Sound.deny(); } }
      : { text: 'The gate is shut fast, and the reader outside is dead. The manual release is on the left pillar.' };
    if (esc.lock < 5) return !nearRel ? { text: 'Fit the key sections into the manual release — left pillar' } : { text: '[Hold E] Fit key section ' + (Math.floor(esc.lock) + 1) + ' of 5', prog: esc.lock % 1, hold: function (dt) {
      Hands.use('key', { point: at(En.keySlots[Math.min(4, Math.floor(esc.lock))], 0, 0.02, 0.03), pose: 'pinch', tip: 'pinch', rot: [0.2, 0.3, 1.2] });
      var before = Math.floor(esc.lock); esc.lock = Math.min(5, esc.lock + dt / (1.3 * DIFF.hold));
      if (Math.floor(esc.lock) > before) { Sound.clunk(); Sound.pickup(); if (esc.lock >= 5) { Sound.grind(); showMsg('The lock falls away. The gate starts to grind open — hold on.', 4); } }
    } };
    return esc.gate < 1 ? { text: 'The gate is opening… ' + Math.round(esc.gate * 100) + '%', prog: esc.gate } : { text: 'GO!' };
  }
  if (esc) {
    var rels = [['B', RELEASE.B], ['A', RELEASE.A]];
    for (i = 0; i < 2; i++) if (dist(px, pz, rels[i][1][0], rels[i][1][1]) < 2.8) {
      var key = 'rel' + rels[i][0];
      if (esc[key] >= 1) return { text: 'Gate ' + rels[i][0] + ' released' };
      return { text: '[Hold E] Pump the emergency release', prog: esc[key], hold: (function (k2, nm) { return function (dt) {
        esc[k2] = Math.min(1, esc[k2] + dt / (3.5 * DIFF.hold)); tickT -= dt; if (tickT <= 0) { tickT = 0.4; Sound.clunk(); makeNoise(player.x, player.z, 26); }
        if (esc[k2] >= 1) { Sound.grind(); showMsg('Sector Gate ' + nm + ' is grinding open.', 3); }
      }; })(key, rels[i][0]) };
    }
    if (esc.turn < 1 && Math.abs(px) < 4.7 && Math.abs(pz - TURN_Z) < 2.6) return { text: '[Hold E] Force the turnstile', prog: esc.turn, hold: function (dt) {
      esc.turn = Math.min(1, esc.turn + dt / (3 * DIFF.hold)); tickT -= dt; if (tickT <= 0) { tickT = 0.4; Sound.clunk(); }
      if (esc.turn >= 1) { Sound.grind(); showMsg('The ratchet shears. The lanes swing free.', 2.5); }
    } };
  } else {
    if (!P.turn && Math.abs(px) < 4.7 && Math.abs(pz - TURN_Z) < 2.4) return { text: P.pow0 ? 'The ticket lanes are locked. Entry Control runs from the staff computer in the gift shop.' : 'The ticket lanes are locked, and dead. No power.' };
    if (!P.gateA && Math.abs(pz - FENCE_A) < 5 && Math.abs(px) < 8) return { text: '[E] Sector Gate A — present ' + W.gateA.need + ' key pieces', fn: tryGate(W.gateA, 'gateA') };
    if (!P.gateB && Math.abs(pz - FENCE_B) < 5 && Math.abs(px) < 8) return { text: '[E] Sector Gate B — present ' + W.gateB.need + ' key pieces', fn: tryGate(W.gateB, 'gateB') };
    for (i = 0; i < 2; i++) { var r = i ? RELEASE.A : RELEASE.B; if (dist(px, pz, r[0], r[1]) < 2.6) return { text: 'Emergency gate release — sealed. It only arms in a lockdown.' }; }
  }
  if (!P.pen) for (i = 0; i < P.lever.length; i++) if (dist(px, pz, LEVERS[i][0], LEVERS[i][1]) < 2.3)
    return P.pulled.indexOf(i) >= 0 ? { text: 'Lever ' + ROMAN[i] + ' is already down' } : { text: '[E] Pull lever ' + ROMAN[i], fn: pullLever(i) };
  if (!P.power && dist(px, pz, -10.8, -16.2) < 2.8) return panel ? { text: '' } : { text: '[E] Open the fuse box', fn: function () { openPanel('fuse'); } };
  for (i = 0; i < 2; i++) {
    var c = COVERS[WINCH[i]];
    if (!keysGot[3] && dist(px, pz, c[0], c[1]) < 2.5) return P.winch.h === 0 ? { text: 'The cage is down. Go and take the key piece.' }
      : { text: '[Hold E] Turn winch ' + 'AB'[i] + ' — cage at ' + P.winch.h + ' m', prog: holdProg.winch, hold: winchTurn(i) };
  }
  if (!esc && dist(px, pz, 52, -85) < 2.6) return { text: '[E] Sound the feeding call', fn: function () {
    if (sirenT > -30) { showMsg('The feeding call is recharging.', 2.5); Sound.deny(); return; }
    sirenT = 28; Sound.siren(); showMsg('The feeding siren wails from the far platform.', 4);
  } };
  if (P.box < 1 && dist(px, pz, LOCKBOX[0], LOCKBOX[1]) < 2.4) return { text: "[Hold E] Break the seal on the keeper's lockbox", prog: P.box, hold: function (dt) {
    P.box = Math.min(1, P.box + dt / (4 * DIFF.hold)); tickT -= dt; if (tickT <= 0) { tickT = 0.3; Sound.click(); }
    if (P.box >= 1) { Sound.clunk(); showMsg('The lid springs open.', 2.5); }
  } };
  if (dist(px, pz, DUCK[0], DUCK[1]) < 2) return { text: '[E] Squeak', fn: function () {
    Sound.squeak(); W.duck.userData.hop = 0.5;
    if (!prefs.duck) { prefs.duck = true; savePrefs(); refreshMenu(); Sound.chime(); showMsg('Secret found: Dr. Quackosaurus. The plaza skeleton has dressed for the occasion.', 6); }
  } };
  return null;
}
function objective() {
  if (P.esc) return escapeStep()[0] + '  Safe rooms are offline.';
  var N = P.ent;
  if (!P.turn) {
    if (!N.run) return N.fuel === 2 ? 'Start the generator. It cannot carry every circuit: set the board first.' : N.fuel === 1 ? 'Carry the diesel to the generator in the maintenance shed.'
      : N.note ? 'Fetch the fuel can from the buggy by the service gate.' : 'The gate is dead and the ticket lanes are locked. Find power: a cable crosses the plaza from the gift shop.';
    if (!P.pow0) return 'The generator runs, but the gift shop is dark. Switch its breaker on at the board.';
    if (!N.login) return 'Log in to the staff computer behind the gift shop counter. The password is somewhere in the shop.';
    return 'Open Entry Control on the staff computer and unlock the ticket lanes.';
  }
  if (!keysGot[0] && !keysGot[1]) return 'Recover the key pieces in the Aquarium and the Raptor Paddock.';
  if (!keysGot[0]) return 'Recover the key piece in the Aquarium.';
  if (!keysGot[1]) return P.pen ? 'Take the key piece from the holding pen.' : 'Raptor Paddock: work out the lever order from the plaque by the pen.';
  if (!P.gateA) return 'Open Sector Gate A, north along the main path.';
  if (!keysGot[2]) return P.power ? 'Take the key piece from the Visitor Center.' : 'Visitor Center: find fuses that add up to the load on the fuse box.';
  if (!P.gateB) return 'Open Sector Gate B, further north.';
  if (!keysGot[3] && !keysGot[4]) return 'Recover the key pieces in the Aviary and T-Rex Kingdom.';
  return 'One key piece left — ' + (keysGot[3] ? 'T-Rex Kingdom. Lure it away, then open the lockbox.' : 'the Aviary. Land the cage exactly on the pedestal.');
}

// ---------- input ----------
document.addEventListener('keydown', function (e) {
  if (e.code === 'KeyP' && !e.repeat && !e.ctrlKey) { toggleFullscreen(); return; }
  if (state !== 'playing') return;
  if (uiOpen) { e.preventDefault(); ZooNet.key(e.code); return; }
  if (e.ctrlKey || e.code === 'Space' || e.code === 'Tab' || e.code === 'Backspace' || e.code === 'Enter') e.preventDefault();
  if (panel && !e.repeat && panelKey(e.code)) return;
  keysDown[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyF') {
    if (!player.light && player.battery <= 0) { showMsg(P.inv ? 'Flashlight is dead. Press R to load a spare battery.' : 'Flashlight is dead. Find a battery.', 3); Sound.deny(); }
    else if (!Hands.reloading()) Hands.click(function () { player.light = !player.light; Sfx.play('torch_click', { fallback: function () { Sound.click(); } }); });
  } else if (e.code === 'Space') jump();
  else if (e.code === 'KeyQ') stunBurst();
  else if (e.code === 'KeyR') loadBattery();
  else if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyC') { if (!player.water) player.crouch = !player.crouch; }
  else if (e.code === 'KeyE') { var it = findInteract(); if (it && it.fn) it.fn(); }
  else if (e.code === 'KeyM') { mapOpen = !mapOpen; $('map').style.display = mapOpen ? 'block' : 'none'; }
  else if (e.code === 'Escape') setState('paused');
});
document.addEventListener('keyup', function (e) { keysDown[e.code] = false; });
document.addEventListener('mousemove', function (e) {
  if (state !== 'playing' || document.pointerLockElement !== canvas) return;
  if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45);
});
canvas.addEventListener('mousedown', function (e) {
  if (state !== 'playing' || e.button !== 0 || uiOpen) return;
  if (document.pointerLockElement !== canvas) lockPointer(); else if (!panel) stunBurst();
});
document.addEventListener('pointerlockchange', function () { if (document.pointerLockElement !== canvas && state === 'playing' && !uiOpen && !window.__jmNoPause) setState('paused'); });
window.addEventListener('blur', function () { keysDown = {}; });
window.addEventListener('beforeunload', function (e) { if (state === 'playing') { e.preventDefault(); e.returnValue = ''; } });

$('btnNew').onclick = newGame; $('btnRestart').onclick = newGame;
$('btnContinue').onclick = function () { if (!loadGame()) refreshMenu(); };
$('btnLoad').onclick = function () { if (!loadGame()) refreshMenu(); };
$('btnResume').onclick = function () { Sound.init(); setState('playing'); lockPointer(); };
$('btnQuit').onclick = $('btnDeadMenu').onclick = $('btnWonMenu').onclick = function () { refreshMenu(); setState('menu'); };
$('btnHow').onclick = function () { $('howto').classList.toggle('show'); };
$('btnIntro').onclick = function () { prefs.intro = false; newGame(); };
each('.btnFS', function (b) { b.onclick = toggleFullscreen; });
each('.btnSound', function (b) { b.onclick = function () { Sound.setMuted(!prefs.muted); refreshMenu(); }; });
each('#diff button', function (b) { b.onclick = function () { setDifficulty(b.getAttribute('data-d')); }; });

// ---------- HUD ----------
var icons = [];
(function () { var c = $('keyIcons'); for (var i = 0; i < ZONES.length; i++) { var el = document.createElement('i'); c.appendChild(el); icons.push(el); } })();
function keycaps(t) { return t.replace(/\[([^\]]+)\]/g, '<kbd>$1</kbd>'); }
var cellEls = null, compassCtx = null, hudCache = {};
function updateHud(force) {
  var i;
  if (force) { $('keyCount').textContent = countKeys() + ' / ' + ZONES.length; for (i = 0; i < icons.length; i++) icons[i].classList.toggle('got', !!keysGot[i]); hudCache = {}; }
  if (!cellEls) { cellEls = []; each('#cell i b', function (b) { cellEls.push(b); }); compassCtx = $('compass').getContext('2d'); }
  var pct = Math.round(player.battery);
  if (pct !== hudCache.pct) { hudCache.pct = pct; $('batPct').textContent = pct + '%'; for (i = 0; i < 5; i++) cellEls[i].style.width = clamp(player.battery / 20 - i, 0, 1) * 100 + '%'; }
  var tc = (player.light ? 'on ' : '') + (player.battery < 25 ? 'low' : ''); if (tc !== hudCache.tc) { hudCache.tc = tc; $('torch').className = tc; }
  if (P.inv !== hudCache.sp) { hudCache.sp = P.inv; var h = ''; for (i = 0; i < Math.min(P.inv, 8); i++) h += '<i></i>'; $('spares').innerHTML = P.inv ? h + (P.inv > 8 ? ' +' + (P.inv - 8) : '') + '<kbd>R</kbd>' : '<span class="none">NO SPARE CELLS</span>'; }
  var st = Math.round(player.stamina); if (st !== hudCache.st) { hudCache.st = st; $('staFill').style.width = st + '%'; $('stamina').style.opacity = st >= 100 ? 0 : 1; }
  if (exhausted !== hudCache.ex) { hudCache.ex = exhausted; $('stamina').classList.toggle('spent', exhausted); }
  if (player.crouch !== hudCache.cr) { hudCache.cr = player.crouch; $('stance').style.display = player.crouch ? 'block' : 'none'; }
  var have = carried(), inv = P.ent.fuel === 1 ? 'CARRYING <b>DIESEL CAN</b><br>' : '';
  if (have.length && !P.power) inv += 'FUSES <b>' + have.map(function (f) { return P.fuses[f] + 'A'; }).join(' · ') + '</b>';
  if (inv !== invText) { invText = inv; $('inv').innerHTML = inv; }
  var ob = objective();
  if (ob !== objText) { var o = $('objective'), first = !objText; objText = ob; o.textContent = ob; o.classList.remove('new'); void o.offsetWidth; o.classList.add('new'); if (!first && !force) Sound.tone(660, 990, 0.16, 0.05, 'triangle'); }
  drawCompass();
}
// where the current objective is, for the marker on the compass
function objectiveTarget() {
  var N = P.ent, En = Entrance, best = null, bd = 1e9;
  if (P.esc) { var st = escapeStep(); return [st[1], st[2]]; }
  if (!P.turn) {
    if (!N.run) return N.fuel > 0 ? [En.genSpot.x, En.genSpot.z] : N.note ? [En.canSpot.x, En.canSpot.z] : N.door ? [En.genSpot.x, En.genSpot.z] : [-15.4, 127];
    return P.pow0 ? [En.pc.x, En.pc.z] : [En.boardSpot.x, En.boardSpot.z];
  }
  function nearest(list) { list.forEach(function (k) { if (keysGot[k]) return; var d = dist(player.x, player.z, ZONES[k].x, ZONES[k].z); if (d < bd) { bd = d; best = [ZONES[k].x, ZONES[k].z]; } }); return best; }
  if (!keysGot[0] || !keysGot[1]) return nearest([0, 1]);
  if (!P.gateA) return [0, FENCE_A + 2];
  if (!keysGot[2]) return P.power ? [ZONES[2].key[0], ZONES[2].key[1]] : [-10.8, -16.2];
  if (!P.gateB) return [0, FENCE_B + 2];
  return nearest([3, 4]);
}
function drawCompass() {
  var g = compassCtx, CW = 1040, head = -player.cy, span = PI * 0.6, d, x, rel;
  g.clearRect(0, 0, CW, 68); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (d = 0; d < 24; d++) {
    rel = angDiff(d * PI / 12, head); if (Math.abs(rel) > span) continue; x = CW / 2 + rel / span * CW / 2;
    if (d % 6 === 0) { g.font = '600 26px Bahnschrift, "DIN Alternate", "Segoe UI", sans-serif'; g.fillStyle = d ? 'rgba(233,226,208,.82)' : '#fff'; g.fillText('NESW'[d / 6], x, 24); }
    else { g.fillStyle = 'rgba(233,226,208,' + (d % 3 ? 0.3 : 0.55) + ')'; g.fillRect(x - 1, d % 3 ? 19 : 14, 2, d % 3 ? 11 : 20); }
  }
  g.fillStyle = 'rgba(233,226,208,.3)'; g.fillRect(0, 46, CW, 2);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(CW / 2, 50); g.lineTo(CW / 2 - 8, 64); g.lineTo(CW / 2 + 8, 64); g.fill();
  var tg = objectiveTarget(), txt = '';
  if (tg) {
    var m = dist(player.x, player.z, tg[0], tg[1]); rel = clamp(angDiff(Math.atan2(tg[0] - player.x, -(tg[1] - player.z)), head), -span * 0.93, span * 0.93); x = CW / 2 + rel / span * CW / 2;
    if (m > 2.5) { g.save(); g.translate(x, 26); g.rotate(PI / 4); g.shadowColor = '#ffc933'; g.shadowBlur = 16; g.fillStyle = '#e2b93b'; g.fillRect(-10, -10, 20, 20); g.fillStyle = '#1a1304'; g.fillRect(-3.5, -3.5, 7, 7); g.restore(); }
    txt = m > 2.5 ? Math.round(m) + ' m' : '';
  }
  if (txt !== hudCache.dist) { hudCache.dist = txt; $('objDist').textContent = txt; }
}
// one-off tips for a first playthrough (remembered in the browser)
var tipQ = [], tipT = 0, tipGap = 0;
function tip(id, html, secs) { if (prefs.tips[id]) return; prefs.tips[id] = 1; savePrefs(); tipQ.push([html, secs || 8]); }
function tickTips(dt) {
  var el = $('tip');
  if (tipT > 0) { tipT -= dt; if (tipT <= 0) { el.classList.remove('show'); tipGap = 0.8; } }
  else if (tipGap > 0) tipGap -= dt;
  else if (tipQ.length) { var t = tipQ.shift(); el.innerHTML = '<b>TIP</b>' + keycaps(t[0]); el.classList.add('show'); tipT = t[1]; Sound.tone(520, 700, 0.1, 0.05, 'triangle'); }
}
var mapCtx = $('map').getContext('2d'), miniCtx = $('mini').getContext('2d'), miniShown = false;
function drawMini() {
  var g = miniCtx, S = 190, C = S / 2, sc = C / 55, a = player.cy, i;
  function pt(x, z) { var dx = (x - player.x) * sc, dz = (z - player.z) * sc; return [C + dx * Math.cos(a) - dz * Math.sin(a), C + dx * Math.sin(a) + dz * Math.cos(a)]; }
  function edge(p, max) { var dx = p[0] - C, dy = p[1] - C, d = Math.hypot(dx, dy); return d > max ? [C + dx / d * max, C + dy / d * max, true] : [p[0], p[1], false]; }
  g.clearRect(0, 0, S, S);
  g.save(); g.beginPath(); g.arc(C, C, C - 2, 0, 7); g.clip();
  g.fillStyle = 'rgba(14,18,12,.88)'; g.fillRect(0, 0, S, S);
  g.translate(C, C); g.rotate(a); g.scale(sc, sc); g.translate(-player.x, -player.z); drawLayout(g); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 13px Trebuchet MS, sans-serif';
  for (i = 0; i < ZONES.length; i++) {
    if (keysGot[i]) continue;
    var p = edge(pt(ZONES[i].x, ZONES[i].z), C - 14);
    g.fillStyle = p[2] ? 'rgba(232,185,48,.75)' : '#ffd24a'; g.beginPath(); g.arc(p[0], p[1], p[2] ? 5 : 8, 0, 7); g.fill();
    if (!p[2]) { g.fillStyle = '#201800'; g.fillText('?', p[0], p[1] + 1); }
  }
  if (P.esc) { var st = escapeStep(), ep = edge(pt(st[1], st[2]), C - 14); g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(ep[0], ep[1], 6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
  var gp = edge(pt(0, WORLD), C - 14);
  g.fillStyle = '#ff5a4a'; g.fillRect(gp[0] - 6, gp[1] - 3, 12, 6);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(C, C - 9); g.lineTo(C + 6, C + 7); g.lineTo(C, C + 3); g.lineTo(C - 6, C + 7); g.closePath(); g.fill();
  g.fillStyle = '#d8d2c0'; g.font = 'bold 12px Trebuchet MS, sans-serif'; g.fillText('N', C + Math.sin(a) * (C - 10), C - Math.cos(a) * (C - 10));
  g.strokeStyle = '#5a4d2a'; g.lineWidth = 3; g.beginPath(); g.arc(C, C, C - 2, 0, 7); g.stroke();
}
// easy mode, during the lockdown: a red line on the ground to the next thing you have to do
function updateRoute() {
  var i; for (i = 0; i < W.route.length; i++) W.route[i].visible = false;
  if (!DIFF.path || !P.esc) return;
  var st = escapeStep(), px = player.x, pz = player.z, best = null, bd = 1e9;
  [[0, 0, -118, 148], [-100, 100, 0, 0], [-80, 0, 80, 80], [0, 74, 60, 60], [-100, 60, -90, -90]].forEach(function (b) {
    var nx = clamp(px, b[0], b[1]), nz = clamp(pz, b[2], b[3]), d = dist(px, pz, nx, nz); if (d < bd) { bd = d; best = [nx, nz]; }
  });
  var pts = [[px, pz]];
  if (dist(px, pz, st[1], st[2]) > 14) { pts.push(best); if (Math.abs(best[0]) > 0.01) pts.push([0, best[1]]); pts.push([0, st[2]]); }
  pts.push([st[1], st[2]]);
  for (i = 0; i < pts.length - 1 && i < W.route.length; i++) {
    var a = pts[i], b = pts[i + 1], len = dist(a[0], a[1], b[0], b[1]); if (len < 0.3) continue;
    var m = W.route[i]; m.visible = true; m.position.set((a[0] + b[0]) / 2, 0.07, (a[1] + b[1]) / 2); m.scale.set(0.4, 1, len); m.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
  }
}

// ---------- update ----------
function update(dt) {
  playTime += dt;
  var esc = P.esc, i, inAq = inRect(player.x, player.z, AQ), inZone = inSafe(player.x, player.z);
  var hidden = (inZone && !esc) || inAq;
  stepWorld(dt, false);

  // movement
  var f = (keysDown.KeyW || keysDown.ArrowUp ? 1 : 0) - (keysDown.KeyS || keysDown.ArrowDown ? 1 : 0);
  var r = (keysDown.KeyD || keysDown.ArrowRight ? 1 : 0) - (keysDown.KeyA || keysDown.ArrowLeft ? 1 : 0);
  if (uiOpen) {                                   // sitting at the staff computer: settle onto the stool and face the screen
    f = r = 0; player.x = damp(player.x, Entrance.pc.x, 7, dt); player.z = damp(player.z, Entrance.pc.z, 7, dt);
    player.yaw += angDiff(PI / 2, player.yaw) * Math.min(1, dt * 7); player.pitch = damp(player.pitch, -0.22, 7, dt); player.crouch = false;
  }
  ZooNet.tick(dt);
  if (P.ent.stall > 0) P.ent.stall -= dt;
  Sound.genSet(P.ent.run ? clamp(1 - dist(player.x, player.z, -19, 127) / 36, 0.04, 1) * 0.45 : 0);
  var moving = f !== 0 || r !== 0;
  if (player.stamina <= 0) exhausted = true; else if (player.stamina > 25) exhausted = false;
  var sprint = moving && (keysDown.ShiftLeft || keysDown.ShiftRight) && !exhausted && !player.water;
  if (sprint && player.crouch) player.crouch = false;
  if (player.water) player.crouch = false;
  var crouch = player.crouch;
  if (sprint) player.stamina = Math.max(0, player.stamina - dt * 16);
  else player.stamina = Math.min(100, player.stamina + dt * (crouch ? (moving ? 16 : 28) : (moving ? 7 : 12)));
  var lk = 1 - Math.exp(-dt * 38);
  player.cy += (player.yaw - player.cy) * lk; player.cp += (player.pitch - player.cp) * lk;
  var sp = player.water ? 2.6 : sprint ? 8.6 : crouch ? 2.2 : 4.4, wx = 0, wz = 0;
  if (moving) { var len = Math.hypot(f, r), sy = Math.sin(player.cy), cy = Math.cos(player.cy); wx = ((-sy) * f + cy * r) / len * sp; wz = ((-cy) * f + (-sy) * r) / len * sp; }
  var ak = 1 - Math.exp(-dt * (player.grounded ? (moving ? 10 : 13) : 2.5));
  player.vx += (wx - player.vx) * ak; player.vz += (wz - player.vz) * ak;
  var ox = player.x, oz = player.z;
  player.x += player.vx * dt; player.z += player.vz * dt;
  resolve(player, 0.45, player.y);
  Entrance.pushLane(player.x, oz, player.z);
  if (player.y < -0.3 && inRect(ox, oz, POOL)) { player.x = clamp(player.x, POOL.x1 + 0.45, POOL.x2 - 0.45); player.z = clamp(player.z, POOL.z1 + 0.45, POOL.z2 - 0.45); }
  if (dt > 0) { player.vx = (player.x - ox) / dt; player.vz = (player.z - oz) / dt; }
  var speedNow = Math.hypot(player.vx, player.vz);
  if (speedNow < 0.02) { player.vx = player.vz = 0; speedNow = 0; }

  // height: jumping, falling, platforms, water
  var gh = groundAt(player.x, player.z, player.y), landed = false;
  if (player.vy > 0 || player.y > gh + 0.02) {
    player.vy -= 20 * dt; player.y += player.vy * dt; player.grounded = false;
    if (player.y <= gh) { if (player.vy < -3 && gh > POOL.swim + 0.3) { Sound.step(0.2, 500); landed = true; } player.y = gh; player.vy = 0; player.grounded = true; }
  } else { player.y += (gh - player.y) * (1 - Math.exp(-dt * 16)); player.vy = 0; player.grounded = true; }
  var wasWater = player.water;
  player.water = inRect(player.x, player.z, POOL) && player.y < POOL.water - 0.5;
  if (player.water && !wasWater) { Sound.splash(); showMsg('You are in the water. Swim for a ramp in the corner!', 3); }
  if (player.grounded) { player.bob += dt * speedNow * 1.7; player.stepT -= dt * speedNow; }
  if (player.stepT <= 0 && speedNow > 0.8) { player.stepT = 2.6; if (player.water) Sound.noise(0.25, 1200, 0.15); else Sound.step(sprint ? 0.22 : crouch ? 0.04 : 0.12, sprint ? 900 : 600); }
  moving = speedNow > 0.6;
  player.eye += ((crouch ? 0.95 : 1.7) - player.eye) * (1 - Math.exp(-dt * 9));
  var fovT = sprint && moving ? 79 : crouch ? 70 : 72;
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * (1 - Math.exp(-dt * 6)); camera.updateProjectionMatrix(); }

  // flashlight + battery
  if (stunCD > 0) stunCD -= dt;
  if (burst > 0) burst = Math.max(0, burst - dt * 3.5);
  if (flashA > 0) { flashA = Math.max(0, flashA - dt * 2.2); $('flash').style.opacity = flashA.toFixed(3); }
  if (player.light) {
    player.battery = Math.max(0, player.battery - dt * DIFF.drain);
    if (player.battery <= 0) { player.light = false; showMsg(P.inv ? 'Your flashlight died. Press R to load a spare battery.' : 'Your flashlight died. Find a battery.', 3.5); }
  }
  var flick = (player.battery < 15 && Math.random() < 0.12) ? 0.25 : 1, relo = Hands.reloading();
  // the eye adjusts: when the beam lands on something close (a wall ahead, the ground at your feet) it is not left blown out
  var bfx = -Math.sin(player.cy), bfz = -Math.cos(player.cy), bHit = player.cp < -0.06 ? player.eye / Math.sin(-player.cp) : 9, bt, bi;
  for (bt = 0.7; bt < Math.min(bHit, 7.5); bt += 0.55) { var bx2 = player.x + bfx * bt, bz2 = player.z + bfz * bt; for (bi = 0; bi < boxes.length; bi++) { var bb = boxes[bi]; if (!bb.off && bx2 > bb.x1 && bx2 < bb.x2 && bz2 > bb.z1 && bz2 < bb.z2) { bHit = bt; break; } } if (bHit === bt) break; }
  beamNear = damp(beamNear, clamp((7.5 - bHit) / 6.8, 0, 1), 4, dt);
  flashlight.intensity = (player.light && !relo ? 2.3 * flick * (1 - 0.6 * beamNear) : 0) + burst * 14; flashlight.angle = 0.6 + burst * 0.3;
  Hands.fill.intensity = relo ? 0.5 : player.light ? 0.42 * flick : 0.1; Hands.setLight(player.light);      // enough to see your own hands by
  W.dust.visible = player.light; if (player.light) W.dust.rotation.z += dt * 0.04;

  // camera
  var bobAmt = Math.min(1, speedNow / 4.4) * (crouch ? 0.03 : 0.05), sh = shake * 0.06;
  camera.position.set(player.x + (Math.random() - 0.5) * sh, player.y + player.eye + Math.sin(player.bob) * bobAmt + (player.water ? Math.sin(playTime * 2.2) * 0.06 : 0) + (Math.random() - 0.5) * sh, player.z);
  camera.rotation.y = player.cy; camera.rotation.x = player.cp;
  var side = player.vx * Math.cos(player.cy) - player.vz * Math.sin(player.cy);
  player.roll += (-side * 0.0022 - player.roll) * (1 - Math.exp(-dt * 8));
  camera.rotation.z = player.roll + Math.sin(player.bob * 0.5) * 0.003 * Math.min(1, speedNow / 4.4);
  Hands.update(dt, { speed: speedNow, yaw: player.cy, pitch: player.cp, bob: player.bob, sprint: sprint && moving, crouch: crouch, grounded: player.grounded, landed: landed, x: player.x, z: player.z });

  // key pieces
  for (i = 0; i < keyMeshes.length; i++) {
    if (keysGot[i]) continue;
    var k = keyMeshes[i]; k.userData.glow.material.opacity = 0.42 + 0.22 * Math.sin(playTime * 2.6 + i);
    if ((i === 3 && P.winch.h !== 0) || (i === 4 && P.box < 1)) continue;
    if (dist(player.x, player.z, k.position.x, k.position.z) < 1.75 && Math.abs(player.y) < 1) {
      keysGot[i] = true; k.visible = false; Sound.chime(); updateHud(true);
      var n = countKeys();
      if (n >= ZONES.length) { startEscape(); esc = P.esc; }
      else showMsg(i === 0 ? 'Key piece found (' + n + ' / 5). ' + (DIFF.cover ? 'A feeding gate drops somewhere under the water, and the pool goes still. The lobby terminal is online.' : 'Now get back across the pool. The lobby terminal is online.')
        : 'Key piece found (' + n + ' / ' + ZONES.length + ') — ' + ZONES[i].name, 5);
      if (i === 0 && DIFF.cover) Sound.grind();
    }
  }
  // batteries and fuses
  for (i = 0; i < batPos.length; i++) {
    if (batGot[i]) continue;
    var b = batMeshes[i]; b.userData.glow.material.opacity = 0.3 + 0.2 * Math.sin(playTime * 3 + i * 1.7);
    if (dist(player.x, player.z, batPos[i][0], batPos[i][1]) < 1.7 && Math.abs(player.y) < 1) {
      batGot[i] = true; b.visible = false; Sound.pickup();
      if (player.battery <= 100 - DIFF.charge * 0.75) { player.battery = Math.min(100, player.battery + DIFF.charge); showMsg('Battery found  +' + DIFF.charge + '%', 2.5); }
      else { P.inv++; showMsg('Spare battery stowed (' + P.inv + '). Press R to load one.', 3); }
    }
  }
  for (i = 0; i < fuseMeshes.length; i++) {
    if (P.fuseGot[i]) continue;
    if (dist(player.x, player.z, FUSE_SPOTS[i][0], FUSE_SPOTS[i][1]) < 1.6) { P.fuseGot[i] = true; Sound.pickup(); showMsg(P.fuses[i] + ' A fuse taken. (' + carried().length + ' of 5 in this sector)', 3.5); if (panel === 'fuse') renderPanel(); }
  }

  // interaction prompt and held actions
  var it = findInteract();
  if (it && it.hold && keysDown.KeyE) it.hold(dt); else holdProg.winch = Math.max(0, (holdProg.winch || 0) - dt * 0.5);
  if (panel && (!it || it.text !== '')) closePanel();
  var ptxt = it ? keycaps(it.text) + (it.prog !== undefined ? '<span class="prog"><i style="width:' + Math.round(clamp(it.prog, 0, 1) * 100) + '%"></i></span>' : '') : '';
  if (ptxt !== promptText) { promptText = ptxt; $('prompt').innerHTML = ptxt; }

  // the lockdown
  if (esc) {
    if (escBigT > 0) { escBigT -= dt; if (escBigT <= 0) $('escape').classList.remove('big'); }
    var step = escapeStep(); if (step[0] !== escText) { escText = step[0]; $('escSub').textContent = escText; }
    Sound.klaxonSet(0.035);
    if (esc.lock >= 5 && Entrance.breach < 1) {                             // the gate drive is the loudest thing for a mile: something large answers it through the service gate
      breachT += dt;
      if (breachT > 2.2) {
        if (Entrance.breach === 0) { Sound.clang(); Sound.roar(true, 1); Sound.thud(1); shake = Math.max(shake, 1.2); showMsg('The service gate bursts off its chain.', 3.5); }
        Entrance.breach = Math.min(1, Entrance.breach + dt * 2.2);
      }
    }
    if (esc.lock >= 5 && esc.gate < 1) {
      esc.gate = Math.min(1, esc.gate + dt / DIFF.gateOpen);
      noiseT -= dt; if (noiseT <= 0) { noiseT = 2.4; Sound.grind(); makeNoise(0, WORLD - 6, 400); }       // the whole park hears that gate
    }
    if (esc.gate >= 1 && player.z > WORLD - 2.2 && Math.abs(player.x) < 3.3) { win(); return; }
  }
  $('hud').classList.toggle('esc', !!esc);

  // the feeding siren
  if (sirenT > -99) { sirenT -= dt; W.sirenLamp.visible = sirenT > 0 && Math.sin(playTime * 9) > 0; }

  // creatures
  var ctx = { hidden: hidden, sprint: sprint, crouch: crouch, moving: moving, light: player.light,
    noiseR: player.water ? 10 : sprint ? 24 : moving ? (crouch ? 2.5 : 9) : 0 };
  if (landed) ctx.noiseR = Math.max(ctx.noiseR, 12);
  if (updateDinos(dt, ctx)) return;
  if (updatePles(dt)) return;
  if (updatePtero(dt, ctx)) return;
  Scares.update(dt, ctx);
  var chasing = aiChasing + (ptero.state === 'swoop' ? 1 : 0) + (ples.state === 'chase' ? 1 : 0);
  chaseHold = chasing > 0 ? 4 : Math.max(0, chaseHold - dt);

  // tension feedback
  var target = chasing > 0 ? 0.55 + 0.35 * Math.sin(playTime * 7) : Math.max(clamp((22 - aiNearest) / 22, 0, 1) * 0.25, aiAlert * 0.45, clamp(ptero.expo, 0, 1.3) * 0.3);
  danger += (target - danger) * Math.min(1, dt * 4);
  $('danger').style.opacity = danger.toFixed(3);
  if (aiNearest < 34 || chasing > 0) { beatT -= dt; if (beatT <= 0) { beatT = chasing > 0 ? 0.45 : clamp(aiNearest / 30, 0.5, 1.2); Sound.beat(chasing > 0 ? 0.5 : 0.28); } }

  // lamps, water, mist, the secret, guide line
  for (i = 0; i < lamps.length; i++) {
    var L = lamps[i], on = esc ? Math.sin(playTime * 9 + L.phase) > -0.2 : (Math.sin(playTime * 13 + L.phase) + Math.sin(playTime * 5.3 + L.phase * 2)) > (P.power ? -1.5 : -0.5);
    if (L.dead) continue;
    L.light.intensity = on ? 1.0 : 0.04; L.bulb.visible = on; L.cone.visible = on; L.light.color.setHex(esc ? 0xff5a3a : 0xffc98a);
  }
  W.waterMat.bumpMap.offset.set(playTime * 0.012, playTime * 0.018);
  for (i = 0; i < W.mist.length; i++) { var ms = W.mist[i], md = ms.userData; ms.position.x = md.bx + Math.sin(playTime * 0.05 + md.ph) * 9; ms.position.z = md.bz + Math.cos(playTime * 0.04 + md.ph) * 9; }
  var dk = W.duck; if (dk.userData.hop > 0) { dk.userData.hop -= dt; dk.position.y = Math.sin((0.5 - dk.userData.hop) * PI * 2) * 0.12; dk.rotation.y += dt * 12; } else dk.position.y = 0;
  if (!prefs.duck && dist(player.x, player.z, DUCK[0], DUCK[1]) < 9) { duckT -= dt; if (duckT <= 0) { duckT = 5 + Math.random() * 4; Sound.squeak(); } }
  routeT -= dt; if (routeT <= 0) { routeT = 0.2; updateRoute(); }
  W.routeMat.opacity = 0.55 + 0.3 * Math.sin(playTime * 4);

  // HUD
  var sb = $('safe');
  if (inZone && esc) { sb.style.display = 'block'; sb.classList.add('off'); sb.textContent = 'SAFE ROOM OFFLINE'; }
  else if (hidden && !player.water) { sb.style.display = 'block'; sb.classList.remove('off'); sb.textContent = inAq ? 'OUT OF SIGHT' : 'SAFE ROOM'; }
  else sb.style.display = 'none';
  $('hint').style.opacity = playTime > 70 ? 0 : playTime > 30 ? 0.35 : 1;
  tickTips(dt);
  if (!player.light && playTime > 2.5) tip('light', 'Press [F] for your flashlight. The cell drains while it is lit; spares are lying around the park.');
  if (P.turn) { tip('sprint', 'Hold [Shift] to sprint. Running is loud, and they hear it.'); tip('map', '[M] opens the park map. Hold [Tab] for the minimap.', 7); }
  if (aiNearest < 30 && !chasing) tip('crouch', 'Something is close. Tap [Ctrl] to crouch: you are quieter and harder to see, and standing still helps too.');
  if (chasing) tip('burst', '[LMB] fires a flash burst: it stuns whatever is caught in the beam and costs a quarter of a charge. Then run for a safe room.');
  if (P.inv > 0) tip('spare', '[R] loads a spare cell into the flashlight.');
  if (inZone && !esc) tip('safe', 'Safe room. Nothing bigger than you fits through the door. Save at the green Ranger Net terminal.');
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').style.opacity = 0; }
  updateHud(false);
  if (mapOpen) drawParkMap(mapCtx, 560, keysGot, player, player.yaw);
  var miniOn = !!keysDown.Tab && !mapOpen;
  if (miniOn !== miniShown) { miniShown = miniOn; $('hud').classList.toggle('mini', miniOn); }
  if (miniOn) drawMini();
}

// ---------- main loop ----------
var lastT = performance.now(), menuT = 0, slowAcc = 0, slowN = 0, warm = 0, clock = 0;
function tuneQuality(raw) {      // if the machine cannot keep up, trade sharpness and effects for a steady frame rate
  if (raw > 0.25 || document.hidden) return;
  if (warm < 3) { warm += raw; return; }
  slowAcc += raw; slowN++;
  if (slowN < 90) return;
  var avg = slowAcc / slowN; slowAcc = 0; slowN = 0;
  if (avg < 1 / 42) return;
  if (pixelRatio > 0.81) setPixelRatio(Math.max(0.8, pixelRatio - 0.2));
  else if (bloomPass && bloomPass.enabled) bloomPass.enabled = false;
  else if (flashlight.castShadow) flashlight.castShadow = false;
  else if (pixelRatio > 0.61) setPixelRatio(0.6);
}
function frame(now) {
  requestAnimationFrame(frame);
  var raw = (now - lastT) / 1000, dt = Math.min(0.05, raw); lastT = now; clock += dt;
  if (state === 'playing') { if (!window.__jmFreeze) { tuneQuality(raw); update(dt); } }      // __jmFreeze: tests step the game by hand
  else if (state === 'cine' && cine) { if (!window.__jmFreeze && cine.update(dt)) { var c = cine; cine = null; if (c.end) c.end(); } }
  else if (state === 'menu') {      // a slow pan across the gate
    menuT += dt;
    camera.position.set(1.2 + Math.sin(menuT * 0.11) * 1.6, 1.8, WORLD + 13.5); camera.rotation.set(0.24 + Math.sin(menuT * 0.07) * 0.03, 0.1 + Math.sin(menuT * 0.13) * 0.12, 0);      // on the road, looking up at the sign
    flashlight.angle = 0.6; flashlight.intensity = 2.0 + (Math.random() < 0.03 ? -1.4 : 0); Hands.update(dt, { menu: true });
  }
  Music.tick(raw);
  renderFrame(clock, state === 'playing' ? clamp(danger, 0, 1) : state === 'cine' && cine ? cine.pulse || 0 : 0);
}

// ---------- start ----------
setDifficulty(prefs.diff);
keysGot = ZONES.map(function () { return false; });
batPos = BATTERY_SPOTS.slice(0, DIFF.batteries); batGot = batPos.map(function () { return false; });
P = newPuzzles();
buildWorldLate();
placeItems(); resetDinos(); refreshMenu();
window.__jm = { player: player, dinos: dinos, ples: ples, ptero: ptero, anim: anim, update: update, music: Music, W: W, NAV: NAV,
  P: function () { return P; }, keys: function () { return keysGot; }, getState: function () { return state; },
  batches: function () { return W.batches; }, batPos: function () { return batPos; }, diff: function () { return diffName; }, info: function () { return renderer.info.render; }, post: function () { return !!composer; } };
requestAnimationFrame(frame);
setTimeout(function () { var l = $('loading'); l.style.opacity = 0; setTimeout(function () { l.style.display = 'none'; }, 700); }, 150);
