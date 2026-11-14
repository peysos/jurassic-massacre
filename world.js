/* Jurassic Massacre — world: builds the park, its props and all the puzzle hardware. */
'use strict';

var P = null;                 // puzzle progress (saved); set up in game.js
var state = 'menu';
var anim = { turn: 0, gA: 0, gB: 0, pen: 0, cage: 0, cover: 0, gate: 0, box: 0 };
var keysGot = [], batPos = [], batGot = [];
var W = { levers: [], leverLamps: [], cranks: [], termScr: [], fuseLamps: [], route: [], mist: [], cageBoxes: [], safeViz: [], lockLamps: [], rel: {} };
var keyMeshes = [], batMeshes = [], fuseMeshes = [], lamps = [];
chainTex.minFilter = THREE.LinearFilter; chainTex.generateMipmaps = false;

// ---------- maps ----------
function drawLayout(g) {
  g.fillStyle = '#3d3a31';
  PATHS.forEach(function (p) { g.fillRect(p[0], p[2], p[1] - p[0], p[3] - p[2]); });
  g.fillStyle = '#1b3944'; g.fillRect(GAL.x1 - 0.5, GAL.z1 - 0.5, GAL.x2 - GAL.x1 + 1, GAL.z2 - GAL.z1 + 1); g.fillRect(GAL.x2, 58, 5, 4); g.fillRect(HALL.x1 - 0.5, HALL.z1 - 0.5, 146.5 - HALL.x1, HALL.z2 - HALL.z1 + 1);
  g.fillStyle = '#1d5a70'; g.fillRect(POOL.x1, POOL.z1, POOL.x2 - POOL.x1, POOL.z2 - POOL.z1);
  g.fillStyle = '#55534c'; g.fillRect(-32, -29, 20, 14); g.fillRect(17, 96, 10, 8); g.fillRect(-22, -73, 8, 6);
  g.strokeStyle = '#8a4a2a'; g.lineWidth = 1;
  g.strokeRect(-110, 55, 50, 50); g.strokeRect(58, -117, 60, 50);
  g.beginPath(); g.arc(AV.x, AV.z, AV.r, 0, 7); g.stroke();
  var esc = P && P.esc;
  [[TURN_Z, P && P.turn && (!esc || esc.turn >= 1)], [FENCE_A, P && (esc ? esc.relA >= 1 : P.gateA)], [FENCE_B, P && (esc ? esc.relB >= 1 : P.gateB)]].forEach(function (f) {
    g.strokeStyle = '#7d7a70'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-WORLD, f[0]); g.lineTo(-5, f[0]); g.moveTo(5, f[0]); g.lineTo(WORLD, f[0]); g.stroke();
    g.strokeStyle = f[1] ? '#35ff8a' : '#ff4a3a'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-5, f[0]); g.lineTo(5, f[0]); g.stroke();
  });
  if (W.drawEntranceMap) W.drawEntranceMap(g);
  SAFE.forEach(function (s) {
    var R = s.rect;
    g.fillStyle = esc ? 'rgba(255,70,60,.25)' : 'rgba(53,255,138,.28)'; g.fillRect(R.x1 - 1.5, R.z1 - 1.5, R.x2 - R.x1 + 3, R.z2 - R.z1 + 3);
    g.fillStyle = esc ? '#ff5a4a' : '#35ff8a'; g.fillRect(R.x1, R.z1, R.x2 - R.x1, R.z2 - R.z1);
  });
  if (esc) { g.fillStyle = '#ffd23a'; [RELEASE.A, RELEASE.B].forEach(function (r) { g.fillRect(r[0] - 2.5, r[1] - 2.5, 5, 5); }); }
  g.fillStyle = '#ff5a4a'; g.fillRect(-7, WORLD - 3, 14, 3);
  g.strokeStyle = '#77756e'; g.lineWidth = 1.6; g.strokeRect(-WORLD, -WORLD, WORLD * 2, WORLD * 2);
}
/* The park map, drawn the way the park printed it for visitors: an illustrated plan on cream paper (lawns, tree clumps, the
   walks, each attraction in its own colour with a picture and a name, a legend), used on the visitor boards and, with the
   live state laid over it (gates, key pieces, where you are), as the map you carry.  The illustrated base is drawn once
   per size and cached; only the overlay is redrawn each frame. */
var MAPC = { cache: {} };
function mapIcon(g, kind, x, y, s, col) {      // small pictograms for the attractions and the legend
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col || '#2b2a22'; g.strokeStyle = col || '#2b2a22'; g.lineWidth = 2; g.lineJoin = g.lineCap = 'round';
  if (kind === 'raptor') { g.beginPath(); g.ellipse(-2, 0, 9, 4.5, -0.15, 0, 7); g.fill(); g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-18, -3, -22, 2); g.lineTo(-9, 3); g.fill(); g.beginPath(); g.moveTo(5, -2); g.quadraticCurveTo(9, -9, 11, -10); g.lineTo(16, -9); g.lineTo(12, -6); g.quadraticCurveTo(10, -3, 7, 2); g.fill(); g.fillRect(-4, 3, 2, 8); g.fillRect(1, 3, 2, 8); }
  else if (kind === 'rex') { g.beginPath(); g.ellipse(-3, 1, 11, 6, -0.12, 0, 7); g.fill(); g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-22, -1, -25, 4); g.lineTo(-11, 5); g.fill(); g.beginPath(); g.moveTo(6, -4); g.quadraticCurveTo(9, -10, 12, -11); g.lineTo(20, -10); g.lineTo(20, -6); g.lineTo(13, -5); g.quadraticCurveTo(11, -1, 8, 3); g.fill(); g.fillRect(-5, 5, 3, 9); g.fillRect(0, 5, 3, 9); }
  else if (kind === 'fish') { g.beginPath(); g.ellipse(0, 0, 10, 5.5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-8, 0); g.lineTo(-16, -6); g.lineTo(-16, 6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(5, -1.5, 1.4, 0, 7); g.fill(); }
  else if (kind === 'bird') { g.beginPath(); g.moveTo(-16, -2); g.quadraticCurveTo(-7, -9, 0, 0); g.quadraticCurveTo(7, -9, 16, -2); g.quadraticCurveTo(7, -4, 0, 4); g.quadraticCurveTo(-7, -4, -16, -2); g.fill(); }
  else if (kind === 'house') { g.beginPath(); g.moveTo(-9, -1); g.lineTo(0, -9); g.lineTo(9, -1); g.fill(); g.fillRect(-7, -1, 14, 9); g.fillStyle = '#f3ecd6'; g.fillRect(-2, 2, 4, 6); }
  else if (kind === 'shop') { g.fillRect(-8, -3, 16, 11); g.beginPath(); g.moveTo(-10, -3); g.lineTo(-7, -9); g.lineTo(7, -9); g.lineTo(10, -3); g.fill(); g.fillStyle = '#f3ecd6'; for (var q = -6; q < 8; q += 4) g.fillRect(q, -8, 2, 4); }
  else if (kind === 'food') { g.beginPath(); g.arc(0, 2, 7, 0, PI); g.fill(); g.fillRect(-8, 0, 16, 2); g.beginPath(); g.moveTo(-3, -2); g.quadraticCurveTo(-5, -7, -2, -10); g.moveTo(3, -2); g.quadraticCurveTo(1, -7, 4, -10); g.stroke(); }
  else if (kind === 'wc') { g.font = 'bold 13px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WC', 0, 1); }
  else if (kind === 'aid') { g.fillRect(-2.5, -8, 5, 16); g.fillRect(-8, -2.5, 16, 5); }
  else if (kind === 'info') { g.beginPath(); g.arc(0, -6.5, 2, 0, 7); g.fill(); g.fillRect(-2, -3, 4, 11); }
  else if (kind === 'ranger') { g.beginPath(); g.moveTo(0, -9); g.lineTo(8, -5); g.lineTo(7, 4); g.quadraticCurveTo(0, 10, -7, 4); g.lineTo(-8, -5); g.closePath(); g.fill(); g.fillStyle = '#f3ecd6'; g.beginPath(); g.moveTo(0, -5); g.lineTo(2, 0); g.lineTo(-2, 0); g.fill(); g.fillRect(-1, 0, 2, 4); }
  g.restore();
}
function drawMapBase(S) {
  var key = S, c = MAPC.cache[key]; if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = S; var g = c.getContext('2d'), k = S / 300, seedM = 9187;
  function rnd() { seedM = (seedM * 16807) % 2147483647; return seedM / 2147483647; }
  function X(x) { return (x + WORLD) * k; } function Y(z) { return (z + WORLD) * k; }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // paper and the park's lawn inside a rounded boundary
  g.fillStyle = '#efe6cc'; g.fillRect(0, 0, S, S);
  rr(X(-146), Y(-146), 292 * k, 292 * k, 14 * k); g.fillStyle = '#a9c483'; g.fill(); g.lineWidth = 3 * k; g.strokeStyle = '#5e7a3e'; g.stroke();
  g.save(); g.clip();
  for (var q = 0; q < 900; q++) { g.fillStyle = q % 2 ? 'rgba(120,160,80,.25)' : 'rgba(190,210,140,.25)'; g.beginPath(); g.arc(rnd() * S, rnd() * S, (2 + rnd() * 6) * k, 0, 7); g.fill(); }
  // attraction grounds
  function zone(x1, z1, x2, z2, fill, edge, r) { rr(X(x1), Y(z1), (x2 - x1) * k, (z2 - z1) * k, (r || 6) * k); g.fillStyle = fill; g.fill(); g.lineWidth = 2 * k; g.strokeStyle = edge; g.stroke(); }
  zone(-112, 53, -58, 107, '#d9c58e', '#8c6a3a');                                   // raptor paddock
  zone(56, -119, 120, -65, '#d8c487', '#8c6a3a');                                   // tyrannosaur kingdom
  zone(GAL.x1 - 1, GAL.z1 - 1, GAL.x2 + 1, GAL.z2 + 1, '#cfdde0', '#4a7a8a', 3); zone(HALL.x1 - 1, HALL.z1 - 1, 147, HALL.z2 + 1, '#cfdde0', '#4a7a8a', 3); g.fillStyle = '#cfdde0'; g.fillRect(X(GAL.x2), Y(58), 5 * k, 4 * k);   // the aquarium: tank gallery, ocean hall
  g.fillStyle = '#5aa9c4'; rr(X(POOL.x1), Y(POOL.z1), (POOL.x2 - POOL.x1) * k, (POOL.z2 - POOL.z1) * k, 3 * k); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2 * k; for (q = 0; q < 6; q++) { g.beginPath(); var wy = Y(POOL.z1 + 3 + q * 3.2); g.moveTo(X(POOL.x1 + 3), wy); for (var wx = POOL.x1 + 3; wx < POOL.x2 - 3; wx += 3) g.lineTo(X(wx), wy + Math.sin(wx) * 1.2 * k); g.stroke(); }
  g.fillStyle = '#7fb6c8'; for (q = 0; q < 4; q++) { g.fillRect(X(GAL.x1 + 3 + q * 4.6), Y(GAL.z1 + 0.6), 3 * k, 1.3 * k); g.fillRect(X(GAL.x1 + 3 + q * 4.6), Y(GAL.z2 - 1.9), 3 * k, 1.3 * k); }      // the wall tanks
  g.beginPath(); g.arc(X(AV.x), Y(AV.z), (AV.r + 2) * k, 0, 7); g.fillStyle = '#c9dcc0'; g.fill(); g.lineWidth = 2 * k; g.strokeStyle = '#5a7a6a'; g.stroke();
  g.strokeStyle = 'rgba(90,122,106,.6)'; g.lineWidth = 1 * k; for (q = 0; q < 6; q++) { g.beginPath(); g.ellipse(X(AV.x), Y(AV.z), (AV.r + 2) * k, (AV.r + 2) * k * Math.abs(Math.cos(q / 6 * PI)), 0, 0, 7); g.stroke(); }
  zone(-34, -31, -10, -13, '#e2d6b6', '#7a6a4a', 3);                                  // visitor center
  zone(-27, 113, 28, 149, '#d9d2bd', '#8a8270', 4);                                   // the entrance plaza
  // trees in clumps, kept off the walks and the attractions
  for (q = 0; q < 1300; q++) {
    var tx = (rnd() * 2 - 1) * 140, tz = (rnd() * 2 - 1) * 140;
    if (onPath(tx, tz, 5) || inRect(tx, tz, { x1: -114, x2: -56, z1: 51, z2: 109 }) || inRect(tx, tz, { x1: 54, x2: 122, z1: -121, z2: -63 }) || inRect(tx, tz, AQ, 4) || dist(tx, tz, AV.x, AV.z) < AV.r + 4 || inRect(tx, tz, { x1: -36, x2: -8, z1: -33, z2: -11 }) || tz > 110) continue;
    var tr = (2.2 + rnd() * 2.2) * k; g.fillStyle = 'rgba(40,60,30,.35)'; g.beginPath(); g.arc(X(tx) + tr * 0.25, Y(tz) + tr * 0.3, tr, 0, 7); g.fill();
    g.fillStyle = ['#5d8a45', '#6f9a50', '#4f7a3c', '#7aa458'][q % 4]; g.beginPath(); g.arc(X(tx), Y(tz), tr, 0, 7); g.fill();
  }
  // walks: cream paths with a darker edge
  PATHS.forEach(function (p2) { rr(X(p2[0] - 1.5), Y(p2[2] - 1.5), (p2[1] - p2[0] + 3) * k, (p2[3] - p2[2] + 3) * k, 3 * k); g.fillStyle = '#9a8a62'; g.fill(); });
  PATHS.forEach(function (p2) { rr(X(p2[0]), Y(p2[2]), (p2[1] - p2[0]) * k, (p2[3] - p2[2]) * k, 2.5 * k); g.fillStyle = '#f2e3b4'; g.fill(); });
  // fences and the sector gates' lines
  g.setLineDash([3 * k, 2 * k]); g.strokeStyle = '#6a5a3a'; g.lineWidth = 1.2 * k;
  [TURN_Z, FENCE_A, FENCE_B].forEach(function (fz) { g.beginPath(); g.moveTo(X(-144), Y(fz)); g.lineTo(X(144), Y(fz)); g.stroke(); });
  g.setLineDash([]);
  // buildings on the plan
  g.fillStyle = '#b8462c'; [[11, 121, 14, 14], [10.4, 137.2, 14.5, 11.5], [-22, 124, 6, 6], [-6.7, 114.8, 2.2, 2.4], [-1.1, 114.8, 2.2, 2.4], [4.5, 114.8, 2.2, 2.4]].forEach(function (b) { g.fillRect(X(b[0]), Y(b[1]), b[2] * k, b[3] * k); });
  g.beginPath(); g.arc(X(0), Y(132), 3 * k, 0, 7); g.fillStyle = '#5aa9c4'; g.fill(); g.lineWidth = 1 * k; g.strokeStyle = '#4a4a40'; g.stroke();
  SAFE.forEach(function (s2) { var R = s2.rect; g.fillStyle = '#7a5a3a'; g.fillRect(X(R.x1 - 0.4), Y(R.z1 - 0.4), (R.x2 - R.x1 + 0.8) * k, (R.z2 - R.z1 + 0.8) * k); });
  g.restore();
  // labels: a rounded tag with a picture
  function tag(text, x, z, icon, col) {
    g.font = 'bold ' + Math.round(11 * k * 1.2) / 1.2 + 'px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    var tw = g.measureText(text).width, w = tw + (icon ? 26 * k : 12 * k), h = 17 * k, x0 = clamp(X(x) - w / 2, 7 * k, S - w - 7 * k), y0 = clamp(Y(z) - h / 2, 30 * k, S - h - 16 * k);
    rr(x0 + 1.5 * k, y0 + 1.5 * k, w, h, 8 * k); g.fillStyle = 'rgba(40,30,20,.35)'; g.fill();
    rr(x0, y0, w, h, 8 * k); g.fillStyle = col || '#254a30'; g.fill(); g.lineWidth = 1.4 * k; g.strokeStyle = '#d9ae35'; g.stroke();
    if (icon) mapIcon(g, icon, x0 + 12 * k, y0 + h / 2, 0.55 * k, '#f3ecd6');
    g.fillStyle = '#f3ecd6'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x0 + (icon ? 22 * k : 6 * k), y0 + h / 2 + 0.5 * k);
  }
  tag('RAPTOR PADDOCK', -85, 63, 'raptor', '#8d5a1f'); tag('T-REX KINGDOM', 90, -108, 'rex', '#8d3a1f'); tag('THE AQUARIUM', 108, 85, 'fish', '#1d5a70');
  tag('THE AVIARY', -100, -112, 'bird', '#3a6a5a'); tag('VISITOR CENTER', -22, -6, 'house', '#5a4a2a'); tag('GIFT SHOP', 24, 104, 'shop', '#8d1f18'); tag('WELCOME CENTER', 62, 143, 'info', '#254a30');
  // little legend pictograms dotted where those things are
  [['wc', -4.8, 82], ['food', 10, 60], ['aid', 8, 2], ['aid', 21.5, 139.6], ['info', 0, 141], ['food', -40, 6], ['wc', 40, -6]].forEach(function (p2) { g.beginPath(); g.arc(X(p2[1]), Y(p2[2]), 6.5 * k, 0, 7); g.fillStyle = '#1d4a7a'; g.fill(); mapIcon(g, p2[0], X(p2[1]), Y(p2[2]), 0.36 * k, '#fff'); });
  SAFE.forEach(function (s2) { g.beginPath(); g.arc(X(s2.x), Y(s2.z), 6.5 * k, 0, 7); g.fillStyle = '#2f6a3a'; g.fill(); mapIcon(g, 'ranger', X(s2.x), Y(s2.z), 0.4 * k, '#fff'); });
  // title cartouche and the entrance
  g.font = 'bold ' + 12 * k + 'px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif'; var ttl = 'FAMILY ZOO · PARK MAP', tw2 = g.measureText(ttl).width + 22 * k;
  rr(S / 2 - tw2 / 2, 3 * k, tw2, 22 * k, 6 * k); g.fillStyle = '#254a30'; g.fill(); g.lineWidth = 2 * k; g.strokeStyle = '#d9ae35'; g.stroke();
  g.fillStyle = '#e2b93b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ttl, S / 2, 14.5 * k);
  g.fillStyle = '#8d1f18'; g.font = 'bold ' + 9 * k + 'px "Trebuchet MS", sans-serif'; g.fillText('MAIN ENTRANCE', X(0), S - 4.5 * k);
  // compass rose
  g.save(); g.translate(S - 18 * k, 34 * k); g.fillStyle = '#254a30'; g.beginPath(); g.moveTo(0, -11 * k); g.lineTo(4 * k, 0); g.lineTo(0, 11 * k); g.lineTo(-4 * k, 0); g.closePath(); g.fill(); g.fillStyle = '#d9ae35'; g.beginPath(); g.moveTo(0, -11 * k); g.lineTo(4 * k, 0); g.lineTo(-4 * k, 0); g.closePath(); g.fill(); g.fillStyle = '#254a30'; g.font = 'bold ' + 8 * k + 'px sans-serif'; g.fillText('N', 0, -16 * k); g.restore();
  MAPC.cache[key] = c; return c;
}
function drawParkMap(g, S, got, you, yaw, worn) {
  var k = S / 300, i;
  function X(x) { return (x + WORLD) * k; }
  g.drawImage(drawMapBase(S), 0, 0);
  var esc = P && P.esc;
  // the live layer: gate states, safe rooms, key pieces
  if (got !== null && got !== undefined) {
    [[TURN_Z, P && P.turn && (!esc || esc.turn >= 1), 'TURNSTILES'], [FENCE_A, P && (esc ? esc.relA >= 1 : P.gateA), 'GATE A'], [FENCE_B, P && (esc ? esc.relB >= 1 : P.gateB), 'GATE B']].forEach(function (f) {
      g.fillStyle = f[1] ? '#2f9a5a' : '#c0281e'; g.fillRect(X(-6), X(f[0]) - 2.5 * k, 12 * k, 5 * k);
      g.font = 'bold ' + 7.5 * k + 'px "Trebuchet MS", sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; var lbl2 = f[2] + (f[1] ? ' · OPEN' : ' · LOCKED'), lw2 = g.measureText(lbl2).width;
      g.fillStyle = 'rgba(239,230,204,.85)'; g.fillRect(X(-8) - lw2 - 4 * k, X(f[0]) - 5 * k, lw2 + 6 * k, 10 * k); g.fillStyle = f[1] ? '#1f6a3a' : '#8d1f18'; g.fillText(lbl2, X(-8), X(f[0]) + 0.5 * k);
    });
    for (i = 0; i < ZONES.length; i++) {
      var z = ZONES[i]; g.beginPath(); g.arc(X(z.key[0]), X(z.key[1]), 5 * k, 0, 7); g.fillStyle = got[i] ? 'rgba(80,80,70,.8)' : '#e2b93b'; g.fill(); g.lineWidth = 1.5 * k; g.strokeStyle = '#3a2a1a'; g.stroke();
      g.fillStyle = '#3a2a1a'; g.font = 'bold ' + 7 * k + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(got[i] ? '✓' : '?', X(z.key[0]), X(z.key[1]) + 0.5 * k);
    }
    if (esc) { SAFE.forEach(function (s2) { g.strokeStyle = '#c0281e'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(X(s2.x) - 6 * k, X(s2.z) - 6 * k); g.lineTo(X(s2.x) + 6 * k, X(s2.z) + 6 * k); g.stroke(); }); g.fillStyle = '#e2b93b'; [RELEASE.A, RELEASE.B].forEach(function (r) { g.fillRect(X(r[0]) - 3 * k, X(r[1]) - 3 * k, 6 * k, 6 * k); }); }
  }
  if (worn) {          // the board version: sun-faded, scratched, a cracked perspex face
    g.fillStyle = 'rgba(239,230,204,.22)'; g.fillRect(0, 0, S, S);
    streaks(g, S, S, 50, 'rgba(70,56,30,.6)', S * 0.6); blotch(g, S, ['#6a5a3a', '#3a4a2a'], 22, 10 * k, 40 * k, 0.25);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (i = 0; i < 40; i++) { var sx = Math.random() * S, sy = Math.random() * S; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (Math.random() - 0.5) * 60 * k, sy + (Math.random() - 0.5) * 12 * k); g.stroke(); }
  }
  if (you) {
    var yx = X(you.x), yy = X(you.z);
    if (yaw === undefined) {
      g.fillStyle = '#c0281e'; g.beginPath(); g.arc(yx, yy - 9 * k, 6 * k, PI * 0.85, PI * 0.15); g.lineTo(yx, yy); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(yx, yy - 9 * k, 2.4 * k, 0, 7); g.fill();
      g.font = 'bold ' + 9 * k + 'px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; var lbl = 'YOU ARE HERE', lw = g.measureText(lbl).width + 10 * k, lx = clamp(yx, lw / 2 + 4, S - lw / 2 - 4);
      g.fillStyle = '#c0281e'; g.fillRect(lx - lw / 2, yy - 31 * k, lw, 12 * k); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(lbl, lx, yy - 24.5 * k);
    } else {
      g.save(); g.translate(yx, yy); g.rotate(-yaw); g.fillStyle = 'rgba(192,40,30,.25)'; g.beginPath(); g.arc(0, 0, 11 * k, 0, 7); g.fill();
      g.fillStyle = '#c0281e'; g.strokeStyle = '#fff'; g.lineWidth = 1.5 * k; g.beginPath(); g.moveTo(0, -8 * k); g.lineTo(5.5 * k, 6 * k); g.lineTo(0, 3 * k); g.lineTo(-5.5 * k, 6 * k); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
  }
  g.strokeStyle = '#254a30'; g.lineWidth = 4 * k; g.strokeRect(0, 0, S, S);
}
// height of the floor under a point, for someone whose feet are at `feet` (the aquarium has floors above and below the ground)
function groundAt(x, z, feet) { return inRect(x, z, AQ) && window.Aqua ? Aqua.ground(x, z, feet) : 0; }
function jitter(geo, amt) {       // roughen a shape so it stops looking like a perfect primitive
  var p = geo.attributes.position, i, x, y, z, n, l;
  for (i = 0; i < p.count; i++) {
    x = p.getX(i); y = p.getY(i); z = p.getZ(i);
    n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; n = (n - Math.floor(n)) - 0.5;
    l = Math.hypot(x, y, z) || 1; p.setXYZ(i, x + x / l * n * amt, y + y / l * n * amt, z + z / l * n * amt);
  }
  geo.computeVertexNormals(); return geo;
}
function crossCard(w, h) {         // two upright quads at right angles, lit as if facing up — for grass and ferns
  var g = new THREE.BufferGeometry(), a = w / 2;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-a, 0, 0, a, 0, 0, a, h, 0, -a, h, 0, 0, 0, -a, 0, 0, a, 0, h, a, 0, h, -a], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); return g;
}

/* The world is built in two passes.  buildWorld() (run as this file loads) makes the ground, walls, buildings and props.
   Then entrance.js adds the entrance plaza.  buildWorldLate() (called from game.js) scatters vegetation and pickups around
   whatever is standing by then, sets up shadows and freezes everything that never moves.
   WB holds the builders other files may use. */
var WB = { posts: [] };
(function buildWorld() {
  var i, g, k, tx, tz, s;
  var wallMat = function (len, h) { return retile(M.concrete, len / 7, (h || 7) / 7); };
  var glow = function (c) { return basic(c, { fog: false }); };
  WB.wallMat = wallMat; WB.glow = glow;
  var instDummy = new THREE.Object3D();
  WB.inst = function (geo, mat, list, parent) {     // one draw call for many copies: [x, y, z, sx, sy, sz, rx, ry, rz]
    var m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(function (p, n) { instDummy.position.set(p[0], p[1], p[2]); instDummy.scale.set(p[3] === undefined ? 1 : p[3], p[4] === undefined ? 1 : p[4], p[5] === undefined ? 1 : p[5]); instDummy.rotation.set(p[6] || 0, p[7] || 0, p[8] || 0); instDummy.updateMatrix(); m.setMatrixAt(n, instDummy.matrix); });
    m.frustumCulled = false; (parent || scene).add(m); return m;
  };

  // ----- ground (with a hole for the aquarium pool) + paths -----
  var T = 700 / 60;
  function groundPiece(x1, x2, z1, z2) {
    var w = x2 - x1, d = z2 - z1, mat = M.ground.clone();
    ['map', 'bumpMap'].forEach(function (key) { var t = M.ground[key].clone(); t.needsUpdate = true; t.repeat.set(w / T, d / T); t.offset.set(((x1 + 350) / T) % 1, ((350 - z2) / T) % 1); mat[key] = t; });
    var m = mesh(new THREE.PlaneGeometry(w, d), mat, (x1 + x2) / 2, 0, (z1 + z2) / 2); m.rotation.x = -PI / 2; m.userData.noCast = true;
  }
  var HOLE = { x1: HALL.x1 - 0.5, x2: 147, z1: HALL.z1 - 0.5, z2: HALL.z2 + 0.5 };          // under the ocean hall: its floors, basement and tank are its own
  groundPiece(-350, HOLE.x1, -350, 350); groundPiece(HOLE.x2, 350, -350, 350);
  groundPiece(HOLE.x1, HOLE.x2, -350, HOLE.z1); groundPiece(HOLE.x1, HOLE.x2, HOLE.z2, 350);
  var edgeMat = std(0x2a261c, 1, { transparent: true, opacity: 0.55 });
  /* Paths: worn tarmac between stone kerbs, with the park's painted footprint trail down the middle of the two main walks.
     Kerbs stop where another path joins. */
  var tarmac = canvasTex(512, function (c, S) {
    speckle('#3b3a36', ['#2c2b28', '#4a4843', '#232220', '#56534c', '#34332f'], 22000, 1.6)(c, S);
    blotch(c, S, ['#1f201c', '#4c463a', '#262b1e', '#5a5547'], 46, 18, 100, 0.4);
    c.strokeStyle = 'rgba(12,12,10,.85)';
    for (var a = 0; a < 16; a++) { c.lineWidth = 0.8 + Math.random() * 2; var x = Math.random() * S, y = Math.random() * S; c.beginPath(); c.moveTo(x, y); for (var b = 0; b < 11; b++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.3) * 50; c.lineTo(x, y); } c.stroke(); }
    c.fillStyle = 'rgba(52,68,34,.5)'; for (a = 0; a < 60; a++) { c.beginPath(); c.ellipse(Math.random() * S, Math.random() * S, 2 + Math.random() * 7, 1 + Math.random() * 3, Math.random() * 3, 0, 7); c.fill(); }      // moss in the cracks
  }, 1), kerbs = [], prints = [];
  PATHS.forEach(function (p, idx) {
    var w = p[1] - p[0], d = p[3] - p[2], q, n;
    var map = tarmac.clone(); map.needsUpdate = true; map.repeat.set(w / 5, d / 5);
    var m = mesh(new THREE.PlaneGeometry(w, d), std(0xffffff, 0.96, { map: map, bumpMap: bump(w / 2.5, d / 2.5), bumpScale: 0.025 }), (p[0] + p[1]) / 2, 0.02 + idx * 0.004, (p[2] + p[3]) / 2);
    m.rotation.x = -PI / 2; m.userData.noCast = true;
    var e = mesh(new THREE.PlaneGeometry(w + 1.6, d + 1.6), edgeMat, (p[0] + p[1]) / 2, 0.012, (p[2] + p[3]) / 2); e.rotation.x = -PI / 2; e.userData.noCast = true;   // worn dirt verge
    function free(x, z) { for (var k2 = 0; k2 < PATHS.length; k2++) { if (k2 === idx) continue; var o = PATHS[k2]; if (x > o[0] - 0.3 && x < o[1] + 0.3 && z > o[2] - 0.3 && z < o[3] + 0.3) return false; } return !inRect(x, z, ENTR, 1) && !inRect(x, z, AQ, 2); }
    if (d > w) { n = Math.round(d / 2); for (q = 0; q < n; q++) { var z = p[2] + (q + 0.5) * d / n; [p[0], p[1]].forEach(function (x) { if (free(x, z)) kerbs.push([x, 0.05, z, 0.2, 0.12, d / n * 0.985, 0, 0, (srand() - 0.5) * 0.04]); }); } }
    else { n = Math.round(w / 2); for (q = 0; q < n; q++) { var x2 = p[0] + (q + 0.5) * w / n; [p[2], p[3]].forEach(function (z2) { if (free(x2, z2)) kerbs.push([x2, 0.05, z2, w / n * 0.985, 0.12, 0.2, (srand() - 0.5) * 0.04, 0, 0]); }); } }
    if (idx < 2) { var len = Math.max(w, d), steps = Math.floor(len / 1.7); for (q = 0; q < steps; q++) { if (srand() < 0.22) continue; var t = (q + 0.5) / steps, sd = q % 2 ? 0.34 : -0.34; if (d > w) prints.push([(p[0] + p[1]) / 2 + sd, 0.026 + idx * 0.004, p[3] - t * d, 1, 1, 1, -PI / 2, 0, sd * 0.5]); else prints.push([p[0] + t * w, 0.026 + idx * 0.004, (p[2] + p[3]) / 2 + sd, 1, 1, 1, -PI / 2, 0, PI / 2 + sd * 0.5]); } }
  });
  WB.inst(new THREE.BoxGeometry(1, 1, 1), std(0xffffff, 0.95, { map: concreteTex, bumpMap: bump(1), bumpScale: 0.03 }), kerbs);
  var pr = WB.inst(new THREE.PlaneGeometry(0.42, 0.5), new THREE.MeshStandardMaterial({ roughness: 1, transparent: true, opacity: 0.4, depthWrite: false, map: canvasTex(64, function (c, S) {
    c.clearRect(0, 0, S, S); c.fillStyle = '#d9ae35'; c.beginPath(); c.ellipse(32, 44, 11, 14, 0, 0, 7); c.fill();
    [[16, 22, -0.5], [32, 14, 0], [48, 22, 0.5]].forEach(function (t) { c.save(); c.translate(t[0], t[1]); c.rotate(t[2]); c.beginPath(); c.ellipse(0, 0, 5, 12, 0, 0, 7); c.fill(); c.restore(); });
    c.globalCompositeOperation = 'destination-out'; for (var a = 0; a < 26; a++) { c.beginPath(); c.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 5, 0, 7); c.fill(); } c.globalCompositeOperation = 'source-over';
  }) }), prints); pr.userData.noCast = true;

  // ----- sky -----
  var skyTex = canvasTex(256, function (c, S) {
    var gr = c.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, '#010207'); gr.addColorStop(0.38, '#050a16'); gr.addColorStop(0.5, '#121c30'); gr.addColorStop(1, '#121c30');
    c.fillStyle = gr; c.fillRect(0, 0, S, S);
  });
  /* The sky rides with the camera and is scaled to sit just inside the far plane, so the far plane can follow the
     graphics preset.  It is drawn first and writes no depth: everything in the park draws over it. */
  var skyG = W.sky = dyn(new THREE.Group()); scene.add(skyG);
  var skyDome = mesh(new THREE.SphereGeometry(600, 24, 16), basic(0xffffff, { map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }), 0, 0, 0, skyG); skyDome.renderOrder = -10;
  var sp = [];
  for (i = 0; i < 800; i++) { var a = Math.random() * PI * 2, e2 = Math.random() * 1.45 + 0.06, R = 520; sp.push(Math.cos(a) * Math.cos(e2) * R, Math.sin(e2) * R, Math.sin(a) * Math.cos(e2) * R); }
  g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  var stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaab8d4, size: 1.3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.45, depthWrite: false })); stars.renderOrder = -9; skyG.add(stars);
  var moonTex = canvasTex(128, function (c, S) { c.fillStyle = '#dfe7f2'; c.fillRect(0, 0, S, S); blotch(c, S, ['#9aa6b8', '#b3bfce'], 16, 6, 26, 0.7); });
  mesh(new THREE.SphereGeometry(11, 24, 24), basic(0xffffff, { map: moonTex, fog: false, depthWrite: false }), 180, 260, -330, skyG).renderOrder = -9;
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('rgba(170,190,230,.5)', 'rgba(120,140,190,.14)'), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(180, 260, -330); halo.scale.set(125, 125, 1); halo.renderOrder = -8; skyG.add(halo);
  var cloudMat = new THREE.SpriteMaterial({ map: softTex('rgba(60,72,98,.5)', 'rgba(40,50,72,.25)'), fog: false, depthWrite: false, transparent: true });
  for (i = 0; i < 18; i++) { var cl = new THREE.Sprite(cloudMat), ca = Math.random() * PI * 2, cr = 300 + Math.random() * 150; cl.position.set(Math.cos(ca) * cr, 130 + Math.random() * 120, Math.sin(ca) * cr); cl.scale.set(220 + Math.random() * 200, 60 + Math.random() * 50, 1); cl.renderOrder = -8; skyG.add(cl); }

  // push every sky element out onto one shell (keeping its angular size), so nothing in the sky sits closer than the dome's edge
  skyG.children.forEach(function (o) { var L = o.position.length(); if (L > 1) { var f = 560 / L; o.position.multiplyScalar(f); o.scale.multiplyScalar(f); } });
  W.skyFit = function () { skyG.position.copy(camera.position); skyG.scale.setScalar(camera.far * 0.95 / 600); };

  // ----- perimeter wall -----
  var wallH = 5;
  [[0, -WORLD, 300, 1.5], [-WORLD, 0, 1.5, 300], [WORLD, 0, 1.5, 300], [-79.6, WORLD, 140.8, 1.5], [79.6, WORLD, 140.8, 1.5]].forEach(function (w) {
    addBox(w[0], w[1], w[2], w[3], wallH, wallMat(Math.max(w[2], w[3])));
    addBox(w[0], w[1], w[2] + (w[2] > 2 ? 0 : 0.5), w[3] + (w[3] > 2 ? 0 : 0.5), 0.3, M.dark, false, wallH);                     // coping
  });

  // ----- fences: chain-link panels on rusted posts, topped with barbed wire -----
  var posts = WB.posts;
  function fence(x1, z1, x2, z2, h) {
    h = h || 3.6;
    var horiz = z1 === z2, len = horiz ? x2 - x1 : z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    var pm = M.chain.clone(); pm.map = chainTex.clone(); pm.map.needsUpdate = true; pm.map.repeat.set(len / 0.42, h / 0.42);
    var pan = mesh(new THREE.PlaneGeometry(len, h), pm, cx, h / 2, cz); if (!horiz) pan.rotation.y = PI / 2; pan.userData.noCast = true;
    [h, h + 0.22].forEach(function (yy, q) { var r = cyl(q ? 0.018 : 0.045, q ? 0.018 : 0.045, len, q ? M.rust : M.metal, cx, yy, cz, null, 5); if (horiz) r.rotation.z = PI / 2; else r.rotation.x = PI / 2; r.userData.noCast = true; });
    for (var t = 0; t <= len + 0.01; t += 4) posts.push([horiz ? x1 + t : cx, horiz ? cz : z1 + t, h]);
    boxes.push({ x1: x1 - (horiz ? 0 : 0.2), x2: x2 + (horiz ? 0 : 0.2), z1: z1 - (horiz ? 0.2 : 0), z2: z2 + (horiz ? 0.2 : 0) });
  }
  fence(-110, 55, -94, 55); fence(-78, 55, -60, 55); fence(-110, 105, -60, 105);
  fence(-110, 55, -110, 105); fence(-60, 55, -60, 72); fence(-60, 88, -60, 105);
  fence(58, -117, 118, -117, 5); fence(118, -117, 118, -67, 5);
  fence(58, -117, 58, -99, 5); fence(58, -81, 58, -67, 5); fence(58, -67, 78, -67, 5); fence(98, -67, 118, -67, 5);
  [FENCE_A, FENCE_B].forEach(function (z) { fence(-149, z, -5, z, 4.2); fence(5, z, 149, z, 4.2); });
  fence(-88, 77, -82, 77); fence(-88, 83, -82, 83); fence(-88, 77, -88, 83);          // the raptor holding pen

  /* A sector gate is a cantilever sliding gate.  Its leaf runs behind the fence line on two fixed roller carriages, is held
     upright by a guide portal over its top rail, and is driven by a motor whose pinion engages a rack along the leaf.
     Opening, it draws back east behind the fence panel; closing, its nose seats in a receiver post. */
  function sectorGate(z, need, label, rel, relName) {
    var TZ2 = z - 0.42, grp = dyn(new THREE.Group()), bars = [], q;                      // gate space: the leaf's nose is at x = -5.1, its tail at 10.1
    for (q = -4.8; q <= 4.81; q += 0.4) bars.push([q, 2.1, 0, 1, 3.3, 1]);
    WB.inst(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), M.metal, bars, grp);
    box(15.2, 0.2, 0.14, M.metal, 2.5, 0.42, 0, grp); box(10.3, 0.12, 0.12, M.metal, 0, 3.78, 0, grp); box(10.2, 0.08, 0.08, M.metal, 0, 2.1, 0, grp);
    box(0.14, 3.5, 0.14, M.metal, -5.05, 2.1, 0, grp); box(0.14, 3.5, 0.14, M.metal, 5.05, 2.1, 0, grp);
    var brace = box(6.1, 0.1, 0.1, M.metal, 7.55, 2.15, 0, grp); brace.rotation.z = -0.585;                                  // the tail: a triangle that counterbalances the leaf
    box(9.8, 0.5, 0.05, M.yellow, 0, 1.15, 0.075, grp); box(9.8, 0.5, 0.05, M.yellow, 0, 1.15, -0.075, grp);
    box(15.2, 0.05, 0.06, M.rust, 2.5, 0.56, -0.1, grp);                                                                   // rack
    grp.position.set(0, 0, TZ2); scene.add(grp);
    [-5, 5].forEach(function (x) { addBox(x, z, 0.6, 0.6, 4.6, M.concrete); box(0.8, 0.2, 0.8, M.dark, x, 4.7, z); });
    var pad = box(21.4, 0.06, 1.0, M.concrete, 5.0, 0.03, TZ2 - 0.05); pad.userData.noCast = true;                         // foundation strip
    box(0.34, 3.9, 0.12, M.rust, -5.36, 1.95, TZ2 - 0.16); box(0.34, 3.9, 0.12, M.rust, -5.36, 1.95, TZ2 + 0.16); box(0.12, 3.9, 0.44, M.rust, -5.56, 1.95, TZ2);   // receiver post
    var wheels = [];
    [6.2, 9.4].forEach(function (x) {                                                                                       // roller carriages
      box(0.7, 0.2, 0.5, M.dark, x, 0.1, TZ2);
      [-0.2, 0.2].forEach(function (o) { var w = dyn(cyl(0.11, 0.11, 0.1, M.metal, x + o, 0.215, TZ2, null, 12)); w.rotation.x = PI / 2; wheels.push(w); });
    });
    [-0.24, 0.24].forEach(function (o) { box(0.1, 4.05, 0.1, M.rust, 5.7, 2.02, TZ2 + o); var r = dyn(cyl(0.07, 0.07, 0.2, M.rubber, 5.7, 3.78, TZ2 + o * 0.6, null, 10)); wheels.push(r); });   // guide portal
    box(0.1, 0.1, 0.62, M.rust, 5.7, 4.08, TZ2);
    box(0.5, 0.75, 0.36, M.binGreen, 7.6, 0.44, TZ2 - 0.42); box(0.56, 0.05, 0.42, M.dark, 7.6, 0.84, TZ2 - 0.42);            // drive unit
    var pinion = dyn(cyl(0.09, 0.09, 0.08, M.rust, 7.6, 0.56, TZ2 - 0.2, null, 10)); pinion.rotation.x = PI / 2;
    cyl(0.02, 0.02, 0.6, M.metal, 7.82, 1.14, TZ2 - 0.42, null, 6);
    boxes.push({ x1: 5.3, x2: 20.3, z1: TZ2 - 0.16, z2: TZ2 + 0.16 });                                                     // where the leaf travels
    addBox(6.4, z + 1.6, 0.4, 0.4, 1.3, M.dark, false);
    box(0.5, 0.36, 0.1, M.metal, 6.4, 1.35, z + 1.82);
    var lampMat = glow(0xff3020);
    mesh(new THREE.SphereGeometry(0.14, 10, 10), lampMat, 6.4, 1.62, z + 1.6);
    mesh(new THREE.SphereGeometry(0.11, 10, 10), lampMat, 7.82, 1.5, TZ2 - 0.42);
    makeSign(label, -9.2, z + 0.11, 0, 6.4, 2.6, '#ffd23a', true);
    var bx = { x1: -5, x2: 5, z1: z - 0.25, z2: z + 0.25 }; boxes.push(bx);
    // emergency release: a hand pump in a yellow cabinet on the north side of the fence
    var cab = new THREE.Group();
    box(1.1, 1.5, 0.5, M.yellow, 0, 0.95, 0, cab); box(1.2, 0.1, 0.6, M.dark, 0, 1.75, 0, cab); box(0.9, 0.2, 0.4, M.dark, 0, 0.1, 0, cab);
    mesh(new THREE.PlaneGeometry(0.95, 0.5), std(0xffffff, 0.6, { map: textTex(['EMERGENCY', 'GATE RELEASE ' + relName], 256, 128, '#101010', '#ffd23a', '#ffd23a', false) }), 0, 1.3, -0.256, cab).rotation.y = PI;
    var handle = dyn(new THREE.Group()); handle.position.set(0, 0.75, -0.3); box(0.06, 0.06, 0.7, M.metal, 0, 0, -0.3, handle); mesh(new THREE.SphereGeometry(0.08, 8, 8), M.red, 0, 0, -0.66, handle); cab.add(handle);
    var beaconMat = glow(0x331008); mesh(new THREE.SphereGeometry(0.16, 10, 10), beaconMat, 0, 1.95, 0, cab); cyl(0.05, 0.05, 0.2, M.dark, 0, 1.82, 0, cab);
    cab.position.set(rel[0], 0, rel[1]); scene.add(cab);
    circles.push({ x: rel[0], z: rel[1], r: 0.7 });
    return { mesh: grp, box: bx, lamp: lampMat, z: z, need: need, handle: handle, beacon: beaconMat,
      set: function (a) { var e = easeIO(a), jud = a > 0.002 && a < 0.998 ? Math.sin(a * 170) * 0.004 : 0; grp.position.x = e * 9.9 + jud; for (var n = 0; n < wheels.length; n++) wheels[n][n < 4 ? 'rotation' : 'rotation'].y = -e * 9.9 / 0.11; pinion.rotation.y = e * 9.9 / 0.09; } };
  }
  W.gateA = sectorGate(FENCE_A, 2, 'SECTOR A  ·  STAFF ONLY', RELEASE.A, 'A');
  W.gateB = sectorGate(FENCE_B, 3, 'SECTOR B  ·  STAFF ONLY', RELEASE.B, 'B');

  // ----- signs -----
  makeSign('RAPTOR PADDOCK', -52, 74, PI / 2);
  makeSign('T-REX KINGDOM', 50, -98, -PI / 2, 7, 0, '#d9534a');
  makeSign('THE AQUARIUM', 44, 66.5, -PI / 2);
  makeSign('THE AVIARY', -56, -84.6, PI / 2);
  makeSign('IT HUNTS FROM ABOVE — STAY UNDER COVER', -64, -95.4, PI / 2, 6.4, 0, '#d9534a');
  makeSign('VISITOR CENTER', -6, -10, PI / 2);
  makeSign('KEEP OUT', -86, 54.4, PI, 5, 0, '#d9534a');
  makeSign('DANGER  10,000 VOLTS', 57.6, -74, -PI / 2, 4, 2.2, '#ffd23a');
  makeSign('DO NOT FEED THE ANIMALS', -59.6, 96, PI / 2, 5, 2.2, '#e8e2d0');
  /* Exhibit boards: who lives here.  A weathered panel on a tilted lectern frame, the way a zoo labels an enclosure. */
  function speciesBoard(x, z, rotY, name, latin, facts, shape, warn) {
    var grp = new THREE.Group(), tex = canvasTex(768, function (c) {
      var S = 768, H = 512; c.fillStyle = '#ded5b6'; c.fillRect(0, 0, S, H); c.fillStyle = '#254a30'; c.fillRect(0, 0, S, 96);
      c.fillStyle = '#e2b93b'; c.font = 'bold 54px ' + ZOO_FONT; c.textBaseline = 'middle'; c.fillText(name, 30, 52, 500); c.font = 'italic 24px Georgia, serif'; c.fillStyle = '#cfe0c8'; c.textAlign = 'right'; c.fillText(latin, S - 28, 56, 220); c.textAlign = 'left';
      c.fillStyle = '#9ab08a'; c.fillRect(30, 124, 300, 224); c.fillStyle = '#31432c'; c.save(); c.translate(180, 240); shape(c); c.restore();                            // the animal, in silhouette
      c.fillStyle = '#23201a'; c.font = '25px ' + ZOO_FONT; facts.forEach(function (f, n) { c.fillText(f, 356, 148 + n * 40, 386); });
      c.fillStyle = '#8d1f18'; c.fillRect(30, 372, S - 60, 60); c.fillStyle = '#f1ecdd'; c.font = 'bold 30px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillText(warn, S / 2, 404, S - 90);
      c.fillStyle = '#254a30'; c.font = 'bold 20px ' + ZOO_FONT; c.fillText('FAMILY ZOO  ·  PLEASE DO NOT TAP THE GLASS, THE FENCE OR THE KEEPERS', S / 2, 468, S - 60);
      chips(c, S, H, 46, '#7d7664'); streaks(c, S, H, 34, 'rgba(60,44,22,.9)', H * 0.8); grime(c, S, H, 1.2);
      c.strokeStyle = 'rgba(20,10,8,.75)'; c.lineWidth = 4; [0, 22, 44].forEach(function (o) { c.beginPath(); c.moveTo(540 + o, 110); c.lineTo(440 + o, 350); c.stroke(); });                // something has been at it
    }, 1, 1, true, 512);
    var board = new THREE.Group(); board.position.set(0, 1.18, 0); board.rotation.x = -0.5; grp.add(board);
    box(1.6, 1.08, 0.05, M.dark, 0, 0, -0.03, board); mesh(new THREE.PlaneGeometry(1.5, 1.0), std(0xffffff, 0.7, { map: tex, bumpMap: bump(2), bumpScale: 0.006 }), 0, 0, 0.001, board);
    [-0.62, 0.62].forEach(function (px) { box(0.09, 1.2, 0.09, M.wood, px, 0.6, -0.26, grp); box(0.3, 0.12, 0.3, M.concrete, px, 0.06, -0.26, grp); box(0.07, 0.07, 0.5, M.wood, px, 1.0, -0.08, grp).rotation.x = -0.5; });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.75 });
  }
  function shRaptor(c) { c.beginPath(); c.ellipse(0, 0, 70, 30, -0.1, 0, 7); c.fill(); c.beginPath(); c.moveTo(-60, -6); c.quadraticCurveTo(-130, -30, -150, -10); c.quadraticCurveTo(-110, 4, -60, 12); c.fill(); c.beginPath(); c.moveTo(50, -12); c.quadraticCurveTo(84, -60, 96, -64); c.lineTo(132, -58); c.lineTo(100, -44); c.quadraticCurveTo(84, -20, 64, 6); c.fill(); c.fillRect(-12, 20, 12, 62); c.fillRect(16, 20, 12, 62); c.fillRect(-12, 78, 30, 8); c.fillRect(16, 78, 30, 8); }
  function shRex(c) { c.beginPath(); c.ellipse(-6, 4, 84, 44, -0.12, 0, 7); c.fill(); c.beginPath(); c.moveTo(-70, -10); c.quadraticCurveTo(-140, -20, -160, 10); c.quadraticCurveTo(-110, 22, -64, 28); c.fill(); c.beginPath(); c.moveTo(50, -28); c.quadraticCurveTo(70, -70, 92, -78); c.lineTo(148, -70); c.lineTo(150, -46); c.lineTo(100, -38); c.quadraticCurveTo(86, -10, 66, 16); c.fill(); c.fillRect(-20, 36, 22, 56); c.fillRect(20, 36, 22, 56); c.fillRect(-20, 86, 42, 10); c.fillRect(20, 86, 42, 10); c.fillRect(64, 6, 20, 6); }
  speciesBoard(-57, 68, PI / 2, 'VELOCIRAPTOR', 'Velociraptor mongoliensis', ['Hunts in a pack of six.', 'Faster than you over any distance.', 'Remembers faces. Remembers keepers.', 'Tests the fence every night.'], shRaptor, 'KEEP BACK FROM THE FENCE');
  speciesBoard(54, -79, -PI / 2, 'TYRANNOSAURUS', 'Tyrannosaurus rex', ['One adult female, "Duchess".', 'Bite force 35,000 newtons.', 'Sees movement before anything else.', 'Fed at the far platform at 11 and 3.'], shRex, 'STAND STILL IF SHE LOOKS AT YOU');
  makeSign('STAY ON THE PATH  ·  NO FLASH PHOTOGRAPHY', 54, -101.5, -PI / 2, 4.4, 0, '#d9534a');
  function signpost(x, z, rotY, lines) {
    var grp = new THREE.Group();
    cyl(0.09, 0.11, 3.9, M.wood, 0, 1.95, 0, grp, 8); mesh(new THREE.ConeGeometry(0.13, 0.22, 8), M.dark, 0, 4.0, 0, grp); box(0.36, 0.14, 0.36, M.dark, 0, 0.07, 0, grp);
    lines.forEach(function (t, q) {
      box(2.5, 0.5, 0.08, M.wood, 0, 3.5 - q * 0.6, 0.1, grp);
      mesh(new THREE.PlaneGeometry(2.5, 0.5), std(0xffffff, 0.8, { map: textTex([t], 384, 80, '#3a2c1a', '#efe2b0', null) }), 0, 3.5 - q * 0.6, 0.145, grp);
    });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.25 });
  }
  signpost(-6.5, 7, 0, ['VISITOR CENTER  ↑', '←  WEST RANGER POST', 'EAST RANGER POST  →']);
  signpost(6.5, 92, 0, ['←  RAPTOR PADDOCK', 'THE AQUARIUM  →', 'SECTOR GATE A  ↑']);
  signpost(-6.5, -80, 0, ['←  THE AVIARY', 'T-REX KINGDOM  →', 'NORTH BUNKER  ↑']);
  function mapBoard(x, z, rotY) {
    var grp = new THREE.Group();
    var c = document.createElement('canvas'); c.width = c.height = 1024; drawParkMap(c.getContext('2d'), 1024, null, { x: x, z: z }, undefined, true);
    var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    var steel = std(0x2b5238, 0.55, { metalness: 0.4, map: canvasTex(128, function (g, S2) { g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, S2, S2); chips(g, S2, S2, 16, '#1a1c18'); chips(g, S2, S2, 8, '#6a3c20'); grime(g, S2, S2, 1); }) });
    box(2.86, 2.86, 0.12, steel, 0, 2.15, -0.02, grp);                                                         // the case
    [[0, 3.6], [0, 0.7]].forEach(function (b2) { box(3.0, 0.1, 0.18, steel, b2[0], b2[1], 0.02, grp); }); [-1.45, 1.45].forEach(function (bx) { box(0.1, 2.96, 0.18, steel, bx, 2.15, 0.02, grp); });
    mesh(new THREE.PlaneGeometry(2.7, 2.7), std(0xffffff, 0.5, { map: tex }), 0, 2.15, 0.045, grp);
    var glass = mesh(new THREE.PlaneGeometry(2.72, 2.72), std(0xbfd0d0, 0.12, { transparent: true, opacity: 0.12, metalness: 0.4 }), 0, 2.15, 0.075, grp); glass.userData.noCast = true;
    var hood = box(3.3, 0.08, 0.7, steel, 0, 3.82, 0.12, grp); hood.rotation.x = 0.22;
    mesh(new THREE.PlaneGeometry(2.4, 0.3), std(0xffffff, 0.75, { map: textTex(['YOU ARE HERE · PARK MAP'], 512, 64, '#254a30', '#e2b93b', null) }), 0, 3.64, 0.115, grp);
    [-1.25, 1.25].forEach(function (px) { box(0.14, 3.7, 0.14, steel, px, 1.85, -0.12, grp); box(0.36, 0.12, 0.36, M.concrete, px, 0.06, -0.12, grp); });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.8 });
    var ox = Math.sin(rotY) * 0.12, oz = Math.cos(rotY) * 0.12; circles.push({ x: x + Math.cos(rotY) * 1.25 - ox, z: z - Math.sin(rotY) * 1.25 - oz, r: 0.2 }); circles.push({ x: x - Math.cos(rotY) * 1.25 - ox, z: z + Math.sin(rotY) * 1.25 - oz, r: 0.2 });
  }
  mapBoard(7, 9, -PI / 2); mapBoard(-6.5, 68, PI / 2);
  mapBoard(6.5, -78, -PI / 2); mapBoard(-60, -6.5, 0); mapBoard(60, 6.5, PI);

  // ----- visitor center: columned front, shuttered entrance holding a key piece, fuse box -----
  addBox(-22, -22, 20, 14, 6, wallMat(20, 6));
  box(22.4, 0.5, 16.4, M.dark, -22, 6.25, -22); box(21, 0.6, 15, M.roof, -22, 6.7, -22); box(20.4, 0.4, 14.4, M.dark, -22, 0.2, -22);
  [-27.5, -16.5].forEach(function (z) { cyl(0.32, 0.36, 6, M.concrete, -11.2, 3, z, null, 12); box(0.9, 0.3, 0.9, M.dark, -11.2, 0.15, z); box(0.9, 0.3, 0.9, M.dark, -11.2, 5.85, z); circles.push({ x: -11.2, z: z, r: 0.42 }); });
  box(1.6, 0.5, 13, M.dark, -11.2, 6.1, -22);
  mesh(new THREE.PlaneGeometry(3, 4), basic(0x000000), -11.97, 2, -22).rotation.y = PI / 2;
  [-27, -17].forEach(function (z) { var vw = mesh(new THREE.PlaneGeometry(2.6, 2.2), M.window, -11.96, 3.3, z); vw.rotation.y = PI / 2; vw.userData.noCast = true; box(0.1, 2.36, 0.1, M.dark, -11.94, 3.3, z); box(0.1, 0.1, 2.76, M.dark, -11.94, 3.3, z); });
  makeSign('VISITOR CENTER', -11.9, -22, PI / 2, 6, 5.2, '#f0cf6a');
  W.cage = dyn(new THREE.Group());
  for (var q = -23.6; q <= -20.39; q += 0.32) cyl(0.04, 0.04, 3.2, M.metal, -8.8, 1.6, q, W.cage, 6);
  for (q = -11.8; q <= -8.81; q += 0.42) { cyl(0.04, 0.04, 3.2, M.metal, q, 1.6, -23.6, W.cage, 6); cyl(0.04, 0.04, 3.2, M.metal, q, 1.6, -20.4, W.cage, 6); }
  [0.1, 3.2].forEach(function (yy) { box(0.14, 0.14, 3.3, M.metal, -8.8, yy, -22, W.cage); box(3.2, 0.14, 0.14, M.metal, -10.4, yy, -23.6, W.cage); box(3.2, 0.14, 0.14, M.metal, -10.4, yy, -20.4, W.cage); });
  scene.add(W.cage);
  cyl(0.5, 0.6, 0.9, M.concrete, -10.6, 0.45, -22, null, 12);                                     // the key piece sits on a plinth behind the shutter
  W.cageBoxes = [{ x1: -9, x2: -8.6, z1: -23.8, z2: -20.2 }, { x1: -12, x2: -8.6, z1: -23.8, z2: -23.4 }, { x1: -12, x2: -8.6, z1: -20.6, z2: -20.2 }];
  W.cageBoxes.forEach(function (b) { boxes.push(b); });
  box(0.3, 1.3, 1.1, M.dark, -11.84, 1.5, -16.2); box(0.08, 1.2, 1.0, M.rust, -11.66, 1.5, -16.2);
  for (i = 0; i < 3; i++) { var fl = glow(0x1a0e06); W.fuseLamps.push(fl); box(0.06, 0.34, 0.14, fl, -11.6, 1.7, -16.5 + i * 0.3); }
  var brk = dyn(new THREE.Group()); brk.position.set(-11.6, 1.15, -16.2); box(0.08, 0.3, 0.1, M.red, 0, 0.12, 0, brk); scene.add(brk); W.breaker = brk;
  W.fusePlaque = livePanel(2.3, 1.15, 512, 256, -11.9, 3.1, -16.2, PI / 2); box(0.08, 1.3, 2.45, M.wood, -11.96, 3.1, -16.2);

  addBox(22, 100, 10, 8, 4, retile(M.plank, 3, 1.4)); box(11.6, 0.3, 9.6, M.roof, 22, 4.15, 100); box(10.4, 0.3, 8.4, M.dark, 22, 0.15, 100);
  mesh(new THREE.PlaneGeometry(3.2, 1.6), M.window, 16.97, 2.2, 102.2).rotation.y = -PI / 2; mesh(new THREE.PlaneGeometry(1.3, 2.4), basic(0x050505), 16.97, 1.2, 98).rotation.y = -PI / 2;
  makeSign('SAFARI GRILL', 16.9, 100, -PI / 2, 5, 3.5);
  addBox(-18, -70, 8, 6, 3.5, wallMat(8, 3.5)); box(9, 0.3, 7, M.roof, -18, 3.65, -70);
  [-20, -16].forEach(function (x) { mesh(new THREE.PlaneGeometry(1.1, 2.3), basic(0x050505), x, 1.15, -66.97); });
  makeSign('RESTROOMS', -18, -66.94, 0, 3.4, 3.0, '#e8e2d0', true);
  function vending(x, z, rotY, hue) {
    var grp = new THREE.Group();
    box(1.2, 2.2, 0.9, M.dark, 0, 1.1, 0, grp);
    var tex = canvasTex(128, function (c, S) {
      c.fillStyle = hue; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(10, 30, S - 20, S - 50);
      for (var r = 0; r < 4; r++) for (var q2 = 0; q2 < 5; q2++) { c.fillStyle = ['#e33', '#3a6', '#fc3', '#39f', '#eee'][(r + q2) % 5]; c.fillRect(16 + q2 * 20, 36 + r * 18, 12, 14); }
      c.fillStyle = '#fff'; c.font = 'bold 18px Arial'; c.textAlign = 'center'; c.fillText('DINO COLA', S / 2, 22);
    });
    mesh(new THREE.PlaneGeometry(1.05, 2.0), basic(0xb0b0b0, { map: tex }), 0, 1.12, 0.46, grp);
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.8 });
  }
  vending(20, 104.6, 0, '#1b3f8a'); vending(-13.4, -70, PI / 2, '#8a1b1b');

  // ----- benches, bins, picnic tables, food carts, jeep -----
  /* A park bench: two cast-iron ends (rear leg sweeping up into the back, front leg, a scrolled arm), weathered slats bolted
     across them.  Its front faces local +z.  One bench in four has lost a slat. */
  var benchIron = std(0x1d2a22, 0.55, { metalness: 0.5, map: canvasTex(64, function (g, S) { g.fillStyle = '#26352b'; g.fillRect(0, 0, S, S); chips(g, S, S, 10, '#5a3a20'); chips(g, S, S, 6, '#0e120f'); }), bumpMap: bump(2), bumpScale: 0.01 });
  var benchWood = std(0xffffff, 0.85, { map: canvasTex(128, function (g, S) { g.fillStyle = '#6d6252'; g.fillRect(0, 0, S, S); for (var q = 0; q < 70; q++) { g.strokeStyle = ['#5a5040', '#7d7260', '#4a4234', '#857a66'][q % 4]; g.lineWidth = 0.6 + Math.random(); var y = Math.random() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (Math.random() - 0.5) * 4); g.stroke(); } blotch(g, S, ['#3a3a2a', '#2e3a22'], 8, 6, 26, 0.4); }), bumpMap: bump(2), bumpScale: 0.012 });
  var benchN = 0;
  function bench(x, z, rotY) {
    var grp = new THREE.Group(), lost = (benchN++ % 4) === 2 ? 1 : -1;
    [-0.86, 0.86].forEach(function (px) {
      tube([[px, 0.0, -0.33, 0.026, 0.03], [px, 0.2, -0.3, 0.024, 0.028], [px, 0.44, -0.26, 0.024, 0.026], [px, 0.62, -0.33, 0.022, 0.026], [px, 0.86, -0.42, 0.02, 0.024], [px, 0.96, -0.44, 0.018, 0.02]], benchIron, grp, 8, 4);
      tube([[px, 0.0, 0.26, 0.026, 0.03], [px, 0.2, 0.25, 0.024, 0.028], [px, 0.43, 0.22, 0.024, 0.026]], benchIron, grp, 8, 3);
      tube([[px, 0.43, -0.27, 0.02, 0.02], [px, 0.44, 0.0, 0.022, 0.02], [px, 0.43, 0.24, 0.02, 0.02]], benchIron, grp, 8, 3);          // seat rail
      tube([[px, 0.6, -0.34, 0.02, 0.022], [px, 0.66, -0.12, 0.022, 0.024], [px, 0.66, 0.16, 0.024, 0.026], [px, 0.6, 0.28, 0.02, 0.02], [px, 0.52, 0.26, 0.016, 0.016]], benchIron, grp, 8, 3);   // the scrolled arm
      box(0.08, 0.02, 0.1, benchIron, px, 0.01, -0.33, grp); box(0.08, 0.02, 0.1, benchIron, px, 0.01, 0.26, grp);
    });
    for (var q = 0; q < 5; q++) { if (lost > 0 && q === 3) continue; box(1.9, 0.028, 0.085, benchWood, 0, 0.465 + Math.sin(q / 4 * PI) * 0.006, -0.2 + q * 0.1, grp); }
    [0.62, 0.74, 0.86].forEach(function (yy, n) { var sl = box(1.9, 0.085, 0.026, benchWood, 0, yy, -0.345 - n * 0.035, grp); sl.rotation.x = -0.28; });
    box(1.74, 0.03, 0.03, benchIron, 0, 0.4, -0.02, grp);                                                        // a stretcher under the seat
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 0.9 });
  }
  [[-5.6, 92, PI / 2], [5.6, 70, -PI / 2], [-5.6, 25, PI / 2], [5.6, -30, -PI / 2], [-5.6, -72, PI / 2], [-30, -5.6, 0], [40, 5.6, PI],
   [-75, 5.6, PI], [75, -5.6, 0], [-40, 74.4, 0], [35, 54.4, 0], [20, -95.6, 0], [-55, -84.4, PI]].forEach(function (b) { bench(b[0], b[1], b[2]); });
  var binTex = textTex(['LITTER'], 128, 40, '#143320', '#d8d2c2', null, false);
  var binLabel = null;                                    // one material for every bin's label, so the labels in a square are one draw
  function bin(x, z, tipped) {
    var grp = new THREE.Group(); binLabel = binLabel || std(0xffffff, 0.6, { map: binTex });
    cyl(0.36, 0.3, 0.95, M.binGreen, 0, 0.475, 0, grp, 14); cyl(0.37, 0.37, 0.05, M.dark, 0, 0.3, 0, grp, 14); cyl(0.39, 0.39, 0.1, M.dark, 0, 1.0, 0, grp, 14); cyl(0.2, 0.32, 0.22, M.dark, 0, 1.13, 0, grp, 14);
    mesh(new THREE.PlaneGeometry(0.44, 0.14), binLabel, 0, 0.7, 0.345, grp);
    grp.position.set(x, 0, z);
    if (tipped) { grp.rotation.set(0, srand() * 6, PI / 2 - 0.05); grp.position.y = 0.36; }
    scene.add(grp); circles.push({ x: x, z: z, r: tipped ? 0.6 : 0.45 });
  }
  [[-5.6, 94.3], [5.6, 67.7], [-5.6, 27.3], [5.6, -27.6, 1], [-5.6, -69.6], [-27.6, -5.6], [42.4, 5.6], [-72.5, 5.6], [72.5, -5.6],
   [-37.6, 74.4, 1], [37.4, 54.4], [22.4, -95.6], [-6, 12], [68, 52], [-12, -37, 1], [-56, 72]].forEach(function (b) { bin(b[0], b[1], b[2]); });
  function picnic(x, z, rotY) {
    var grp = new THREE.Group();
    box(2.2, 0.07, 0.95, M.plank, 0, 0.8, 0, grp);
    [-0.85, 0.85].forEach(function (o) { box(2.2, 0.06, 0.3, M.plank, 0, 0.46, o, grp); });
    [-0.8, 0.8].forEach(function (px) { box(0.08, 0.9, 0.08, M.wood, px, 0.4, 0.45, grp).rotation.x = 0.5; box(0.08, 0.9, 0.08, M.wood, px, 0.4, -0.45, grp).rotation.x = -0.5; box(0.08, 0.08, 1.9, M.wood, px, 0.42, 0, grp); });
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 1.3 });
  }
  picnic(62, 48, 0.3); picnic(60, 80, -0.5); picnic(52, 72, 1.2); picnic(-14, 12, 0.2);
  var stripes = canvasTex(64, function (c, S) { for (var q2 = 0; q2 < 8; q2++) { c.fillStyle = q2 % 2 ? '#d8d2c2' : '#a8231c'; c.fillRect(q2 * 8, 0, 8, S); } });
  function cart(x, z, rotY, label) {
    var grp = new THREE.Group();
    box(2.1, 1.1, 1.1, M.paint, 0, 0.95, 0, grp); box(2.2, 0.06, 1.2, M.metal, 0, 1.53, 0, grp);
    var cn = box(2.7, 0.08, 1.8, std(0xffffff, 0.9, { map: stripes }), 0, 2.5, 0, grp); cn.rotation.x = 0.06;
    [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(function (o) { cyl(0.03, 0.03, 1.0, M.metal, o[0], 2.0, o[1], grp, 5); });
    [-0.7, 0.7].forEach(function (px) { var wh = cyl(0.4, 0.4, 0.08, M.rubber, px, 0.4, 0.6, grp, 16); wh.rotation.x = PI / 2; cyl(0.1, 0.1, 0.1, M.metal, px, 0.4, 0.62, grp, 8).rotation.x = PI / 2; });
    box(0.06, 0.06, 0.9, M.metal, -1.3, 1.0, 0, grp); [-0.4, 0.4].forEach(function (o) { box(0.3, 0.04, 0.04, M.metal, -1.16, 1.0, o, grp); });      // push handle on its two brackets
    mesh(new THREE.PlaneGeometry(1.9, 0.5), std(0xffffff, 0.8, { map: textTex([label], 256, 64, '#a8231c', '#f6e9c0', null) }), 0, 1.05, 0.56, grp);
    grp.position.set(x, 0, z); grp.rotation.y = rotY; scene.add(grp); circles.push({ x: x, z: z, r: 1.4 });
  }
  cart(7.2, 28, -PI / 2, 'POPCORN'); cart(11, -9, 0.4, 'ICE CREAM'); cart(58, 67.5, PI, 'HOT DOGS');
  var jeep = new THREE.Group(), jp = std(0x5a6b3a, 0.5, { metalness: 0.35, bumpMap: bump(3), bumpScale: 0.01 });
  box(2.2, 0.75, 4.4, jp, 0, 0.95, 0, jeep); box(2.2, 0.35, 1.5, jp, 0, 1.45, 1.4, jeep); box(2.05, 0.9, 1.9, jp, 0, 1.85, -0.5, jeep);
  box(1.85, 0.62, 0.05, M.window, 0, 1.9, 0.47, jeep).rotation.x = -0.25; box(0.05, 0.6, 1.3, M.window, 1.03, 1.9, -0.4, jeep); box(0.05, 0.6, 1.3, M.window, -1.03, 1.9, -0.4, jeep);
  box(2.3, 0.2, 0.2, M.dark, 0, 0.62, 2.25, jeep); box(2.3, 0.2, 0.2, M.dark, 0, 0.62, -2.25, jeep); box(1.2, 0.45, 0.06, M.dark, 0, 1.2, 2.21, jeep);
  [-0.8, 0.8].forEach(function (x) { mesh(new THREE.SphereGeometry(0.16, 10, 10), std(0xdfe6ea, 0.2, { metalness: 0.6 }), x, 1.2, 2.2, jeep).scale.z = 0.4; box(0.3, 0.14, 0.05, M.red, x, 1.1, -2.21, jeep); });
  [[-1.1, 1.45], [1.1, 1.45], [-1.1, -1.45], [1.1, -1.45]].forEach(function (w) { var wh = cyl(0.5, 0.5, 0.42, M.rubber, w[0], 0.5, w[1], jeep, 16); wh.rotation.z = PI / 2; cyl(0.22, 0.22, 0.44, M.metal, w[0], 0.5, w[1], jeep, 8).rotation.z = PI / 2; });
  cyl(0.5, 0.5, 0.36, M.rubber, 0, 1.3, -2.45, jeep, 16).rotation.x = PI / 2;
  jeep.position.set(9, 0, -22); jeep.rotation.set(0, 0.5, 0.06); scene.add(jeep); circles.push({ x: 9, z: -22, r: 2.6 });

  // ----- plaza: the mounted Tyrannosaurus skeleton -----
  cyl(3.3, 3.5, 0.62, M.concrete, 0, 0.31, 0, null, 28); cyl(3.42, 3.42, 0.1, M.dark, 0, 0.62, 0, null, 28);
  W.skeleton = buildRexSkeleton(0, 0);
  var pl = mesh(new THREE.PlaneGeometry(2.2, 0.8), std(0xffffff, 0.5, { map: infoTex('TYRANNOSAURUS REX', ['"Tyrant lizard king" — 68 million years old', 'Found 1990 · 12.3 m · bite force 35,000 N'], '#f0cf6a', 190) }), 0, 0.95, 3.56);
  pl.rotation.x = -0.5; box(2.4, 0.9, 0.1, M.dark, 0, 0.9, 3.5).rotation.x = -0.5;
  circles.push({ x: 0, z: 0, r: 3.6 });

  // (the aquarium is built by aquarium.js)

  // ----- the aviary -----
  (function aviary() {
    var gapA = Math.atan2(5, 29.6);
    for (i = 0; i < 26; i++) {
      var an = i / 26 * PI * 2, d = Math.abs(angDiff(an, gapA));
      if (d < 0.2) continue;
      var px = AV.x + Math.cos(an) * AV.r, pz = AV.z + Math.sin(an) * AV.r;
      cyl(0.4, 0.55, 7, M.rust, px, 3.5, pz, null, 10); cyl(0.7, 0.7, 0.3, M.concrete, px, 0.15, pz, null, 10); circles.push({ x: px, z: pz, r: 0.7 });
    }
    var dome = mesh(new THREE.SphereGeometry(AV.r, 36, 12, 0, PI * 2, 0, PI / 2), basic(0x59626a, { wireframe: true, transparent: true, opacity: 0.4 }), AV.x, 0, AV.z);
    dome.scale.y = AV.h / AV.r;
    COVERS.forEach(function (c, q) {
      var rf = box(5.5, 0.1, 5.5, M.roof, c[0], 2.98, c[1]); rf.rotation.z = 0.04; box(5.3, 0.14, 0.14, M.wood, c[0], 2.86, c[1] - 2.4); box(5.3, 0.14, 0.14, M.wood, c[0], 2.86, c[1] + 2.4);
      [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(function (o) { box(0.18, 2.9, 0.18, M.wood, c[0] + o[0], 1.45, c[1] + o[1]); circles.push({ x: c[0] + o[0], z: c[1] + o[1], r: 0.2 }); });
      var w = WINCH.indexOf(q); if (w < 0) return;
      box(1.1, 0.5, 0.9, M.dark, c[0], 0.25, c[1]); [-0.42, 0.42].forEach(function (o) { box(0.1, 0.9, 0.7, M.rust, c[0] + o, 0.9, c[1]); });
      cyl(0.3, 0.3, 0.7, M.rust, c[0], 0.95, c[1], null, 14).rotation.z = PI / 2; cyl(0.34, 0.34, 0.05, M.metal, c[0] - 0.3, 0.95, c[1], null, 14).rotation.z = PI / 2; cyl(0.34, 0.34, 0.05, M.metal, c[0] + 0.3, 0.95, c[1], null, 14).rotation.z = PI / 2;
      var crank = dyn(new THREE.Group()); crank.position.set(c[0] + 0.52, 0.95, c[1]);
      box(0.06, 0.5, 0.06, M.metal, 0, 0.25, 0, crank); box(0.3, 0.07, 0.07, M.red, 0.15, 0.5, 0, crank); scene.add(crank); W.cranks.push(crank);
      circles.push({ x: c[0], z: c[1], r: 0.75 });
    });
    W.winchSigns = [livePanel(2.4, 0.8, 384, 128, COVERS[WINCH[0]][0] + 2.78, 3.5, COVERS[WINCH[0]][1], PI / 2), livePanel(2.4, 0.8, 384, 128, COVERS[WINCH[1]][0] + 2.78, 3.5, COVERS[WINCH[1]][1], PI / 2)];
    W.aviPlaque = livePanel(5.4, 2.1, 640, 250, -65.9, 2.2, -84.6, PI / 2);
    box(0.1, 2.3, 5.6, M.wood, -66, 2.2, -84.6); [-87.2, -82].forEach(function (z) { box(0.18, 3.4, 0.18, M.wood, -66.05, 1.7, z); });
    cyl(0.8, 0.95, 0.5, M.concrete, AV.x, 0.25, AV.z, null, 14);
    W.aviCage = dyn(new THREE.Group());
    mesh(new THREE.BoxGeometry(1.1, 1.5, 1.1), basic(0xc8c8c8, { wireframe: true }), 0, 0, 0, W.aviCage); box(1.2, 0.08, 1.2, M.metal, 0, 0.78, 0, W.aviCage); box(1.2, 0.08, 1.2, M.metal, 0, -0.78, 0, W.aviCage);
    W.aviCage.position.set(AV.x, 1.4, AV.z); scene.add(W.aviCage);
    PERCHES.forEach(function (p) { cyl(0.06, 0.06, 2.4, M.wood, p[0], domeY(p[0], p[1]) - 0.4, p[1], null, 5).rotation.z = PI / 2; });
  })();

  // ----- t-rex kingdom: feeding platform, siren, call post, keeper's lockbox -----
  addBox(100, -108, 6, 6, 1.2, M.concrete); box(6.2, 0.1, 6.2, M.yellow, 100, 1.22, -108);
  cyl(0.1, 0.12, 5, M.metal, 100, 3.7, -108, null, 6);
  W.sirenLamp = mesh(new THREE.SphereGeometry(0.4, 10, 10), glow(0xff2a1a), 100, 6.3, -108); W.sirenLamp.visible = false; W.sirenLamp.userData.keep = true;
  for (i = 0; i < 5; i++) mesh(new THREE.TorusGeometry(1.1, 0.12, 6, 12, PI), M.bone, 80 + i * 0.8, 0, -100);
  mesh(sphGeo, M.bone, 79, 0.35, -100).scale.set(1, 0.8, 1.5);
  addBox(52, -85, 0.4, 0.4, 1.3, M.yellow, false); box(0.5, 0.5, 0.3, M.dark, 52, 1.4, -85); cyl(0.14, 0.14, 0.1, M.red, 51.82, 1.4, -85, null, 12).rotation.z = PI / 2;
  circles.push({ x: 52, z: -85, r: 0.4 });
  box(0.12, 3.0, 0.12, M.wood, 52.02, 1.5, -86.2); box(0.12, 3.0, 0.12, M.wood, 52.02, 1.5, -83.8);
  makeSign('FEEDING CALL', 51.9, -85, -PI / 2, 2.6, 2.6, '#ffd23a', true); makeSign('DRAWS THE ANIMAL TO THE FAR PLATFORM', 51.9, -85, -PI / 2, 2.6, 1.95, '#cfd8c0', true);
  box(1.3, 0.8, 0.9, M.dark, LOCKBOX[0], 0.4, LOCKBOX[1]); box(1.36, 0.1, 0.96, M.yellow, LOCKBOX[0], 0.8, LOCKBOX[1]);
  W.boxLid = dyn(new THREE.Group()); W.boxLid.position.set(LOCKBOX[0], 0.85, LOCKBOX[1] - 0.45);
  box(1.3, 0.14, 0.9, M.dark, 0, 0.07, 0.45, W.boxLid); box(0.2, 0.26, 0.08, M.gold, 0, -0.04, 0.92, W.boxLid); scene.add(W.boxLid);
  mesh(new THREE.PlaneGeometry(1.1, 0.4), std(0xffffff, 0.6, { map: textTex(["KEEPER'S LOCKBOX"], 256, 92, '#101010', '#ffd23a', null, false) }), LOCKBOX[0], 0.42, LOCKBOX[1] + 0.455);
  circles.push({ x: LOCKBOX[0], z: LOCKBOX[1], r: 0.8 });

  // ----- raptor paddock: holding pen door, lever stations, protocol plaque -----
  W.penDoor = dyn(new THREE.Group());
  for (var z = 0.15; z < 6; z += 0.36) cyl(0.04, 0.04, 3.4, M.metal, 0, 1.7, z, W.penDoor, 6);
  [0.3, 1.7, 3.3].forEach(function (yy) { box(0.12, 0.12, 6, M.metal, 0, yy, 3, W.penDoor); }); box(0.16, 0.5, 0.4, M.yellow, 0, 1.7, 5.7, W.penDoor);
  W.penDoor.position.set(-82, 0, 77); scene.add(W.penDoor);
  W.penBox = { x1: -82.2, x2: -81.8, z1: 77, z2: 83 }; boxes.push(W.penBox);
  cyl(0.45, 0.55, 0.7, M.concrete, -85, 0.35, 80, null, 12);
  box(0.12, 2.3, 3.7, M.wood, -80.9, 2.1, 86.2); [84.5, 87.9].forEach(function (pz) { box(0.16, 3.3, 0.16, M.wood, -81, 1.65, pz); });
  W.plaque = livePanel(3.5, 2.1, 640, 384, -80.83, 2.1, 86.2, PI / 2);
  circles.push({ x: -81, z: 86.2, r: 0.9 });
  LEVERS.forEach(function (lv, q2) {
    var st = new THREE.Group();
    box(0.9, 0.16, 0.7, M.concrete, 0, 0.08, 0, st); box(0.5, 0.9, 0.4, M.yellow, 0, 0.6, 0, st);
    cyl(0.26, 0.26, 0.42, M.dark, 0, 1.05, 0, st, 14).rotation.z = PI / 2;
    var lamp = glow(0x400a06); W.leverLamps.push(lamp); mesh(new THREE.SphereGeometry(0.07, 8, 8), lamp, 0, 0.75, 0.21, st);
    var h = dyn(new THREE.Group()); h.position.set(0, 1.05, 0);
    cyl(0.035, 0.035, 0.8, M.metal, 0, 0.4, 0, h, 6); mesh(new THREE.SphereGeometry(0.1, 10, 10), M.red, 0, 0.84, 0, h); st.add(h); W.levers.push(h);
    var tex = textTex([ROMAN[q2]], 128, 128, '#1c1c1c', '#ffd23a', '#ffd23a', false);
    cyl(0.04, 0.04, 2.6, M.metal, 0.5, 1.3, 0, st, 5); box(0.7, 0.7, 0.06, M.dark, 0.5, 2.6, 0, st);
    mesh(new THREE.PlaneGeometry(0.62, 0.62), std(0xffffff, 0.7, { map: tex }), 0.5, 2.6, 0.035, st); mesh(new THREE.PlaneGeometry(0.62, 0.62), std(0xffffff, 0.7, { map: tex }), 0.5, 2.6, -0.035, st).rotation.y = PI;
    st.position.set(lv[0], 0, lv[1]); scene.add(st); st.userData.station = q2; st.userData.keep = true; W['leverSt' + q2] = st;       // easy mode hides the fourth station
    circles.push({ x: lv[0], z: lv[1], r: 0.5 });
  });

  // ----- stains and puddles -----
  for (i = 0; i < 18; i++) {
    var pp = PATHS[i % PATHS.length], bx = pp[0] + Math.random() * (pp[1] - pp[0]), bz = pp[2] + Math.random() * (pp[3] - pp[2]);
    if (inRect(bx, bz, ENTR, 4) || inRect(bx, bz, AQ, 2)) continue;
    var stn = mesh(new THREE.CircleGeometry(0.9 + Math.random() * 1.3, 14), M.blood, bx, 0.05, bz);
    stn.rotation.x = -PI / 2; stn.scale.set(1, 0.5 + Math.random() * 0.8, 1); stn.rotation.z = Math.random() * 6; stn.userData.noCast = true;
    (W.blood = W.blood || []).push([bx, bz, stn.geometry.parameters.radius * 0.85]);
  }
  var puddle = new THREE.MeshStandardMaterial({ color: 0x0c1014, roughness: 0.05, metalness: 0.85, transparent: true, depthWrite: false, envMap: null, map: canvasTex(64, function (c, S) {      // rainwater in a dip: soft, uneven edges
    c.clearRect(0, 0, S, S); for (var q = 0; q < 9; q++) { var x = S / 2 + (Math.random() - 0.5) * S * 0.36, y = S / 2 + (Math.random() - 0.5) * S * 0.36, r = S * (0.16 + Math.random() * 0.16), gr = c.createRadialGradient(x, y, r * 0.5, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }
  }) });
  for (i = 0; i < 30; i++) {
    pp = PATHS[i % PATHS.length]; bx = pp[0] + 1 + Math.random() * (pp[1] - pp[0] - 2); bz = pp[2] + 1 + Math.random() * (pp[3] - pp[2] - 2);
    if (inRect(bx, bz, AQ, 2)) continue;
    var pu = mesh(new THREE.CircleGeometry(0.6 + Math.random() * 1.3, 18), puddle, bx, 0.045, bz);
    pu.rotation.x = -PI / 2; pu.scale.set(1, 0.4 + Math.random() * 0.7, 1); pu.rotation.z = Math.random() * 6; pu.userData.noCast = true;
  }

  // ----- safe zones (ranger shelters) + save terminals -----
  var termTex = canvasTex(64, function (c, S) { c.fillStyle = '#eaffef'; c.fillRect(0, 0, S, S); c.fillStyle = '#1c6a3a'; for (var q2 = 0; q2 < 5; q2++) c.fillRect(6, 8 + q2 * 10, 20 + ((q2 * 37) % 30), 4); });
  function terminal(t, idx) {                      // W.termScr[idx] is the screen material game.js recolours (index into TERMS)
    box(0.9, 1.05, 0.6, M.dark, t.tx, 0.52, t.tz); box(1.0, 0.08, 0.7, M.metal, t.tx, 1.08, t.tz);
    var mat = basic(0x551010, { map: termTex, fog: false }); W.termScr[idx] = mat;
    var scr = box(0.78, 0.5, 0.06, mat, t.tx, 1.42, t.tz - 0.12); scr.rotation.x = -0.3; box(0.86, 0.58, 0.08, M.dark, t.tx, 1.42, t.tz - 0.17).rotation.x = -0.3;
    circles.push({ x: t.tx, z: t.tz, r: 0.6 });
  }
  WB.termTex = termTex;
  /* Ranger posts: the safe rooms.  A timber cabin on a concrete plinth with one narrow steel door.  Inside: a desk with the
     Ranger Net terminal, a cot, lockers.  The door is 1.26 m wide: a person fits, nothing that hunts here does. */
  var cabinWall = retile(M.plank, 3, 1.4), stGreen = std(0x2f5a3a, 0.7, { bumpMap: bump(2), bumpScale: 0.01 }), stSteel = std(0x596268, 0.6, { metalness: 0.5, map: metalTex });
  var blanket = std(0x4a5238, 1, { bumpMap: bump(3), bumpScale: 0.03 }), postTex = textTex(['RANGER POST'], 512, 100, '#254a30', '#e2b93b', '#e2b93b'), bunkTex = textTex(['EMERGENCY SHELTER'], 512, 100, '#8d1f18', '#f1ecdd', '#f1ecdd');
  var noteTex = textTex(['IF THEY ARE LOOSE', 'STAY INSIDE', 'LOG YOUR POSITION'], 256, 200, '#e9e2d0', '#8d1f18', '#8d1f18');
  function station(s2, si, face, bunker) {
    var k = { s: 0, e: 1, n: 2, w: 3 }[face], G = new THREE.Group(), HX = 3.8, HZ = 3.2, WH = 2.9, wm = bunker ? retile(M.concrete, 1.2, 0.5) : cabinWall, q;
    G.position.set(s2.x, 0, s2.z); G.rotation.y = k * PI / 2; scene.add(G);
    function w2(lx, lz) { return k === 0 ? [s2.x + lx, s2.z + lz] : k === 1 ? [s2.x + lz, s2.z - lx] : k === 2 ? [s2.x - lx, s2.z - lz] : [s2.x - lz, s2.z + lx]; }     // cabin space -> world
    function span(x1, x2, z1, z2) { var a = w2(x1, z1), b = w2(x2, z2); return { x1: Math.min(a[0], b[0]), x2: Math.max(a[0], b[0]), z1: Math.min(a[1], b[1]), z2: Math.max(a[1], b[1]) }; }
    function solid(x1, x2, z1, z2, sees) { var b = span(x1, x2, z1, z2); b.solid = !sees; boxes.push(b); }
    function wall(x1, x2, z1, z2, y1, y2) { y1 = y1 || 0; y2 = y2 || WH; box(x2 - x1, y2 - y1, z2 - z1, wm, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, G); }
    wall(-HX, HX, -HZ, -HZ + 0.3); wall(-HX, -HX + 0.3, -HZ + 0.3, HZ - 0.3); wall(HX - 0.3, HX, -HZ + 0.3, HZ - 0.3);
    wall(-HX, -0.63, HZ - 0.3, HZ); wall(0.63, HX, HZ - 0.3, HZ); wall(-0.63, 0.63, HZ - 0.3, HZ, 2.1, WH);
    solid(-HX, HX, -HZ, -HZ + 0.3); solid(-HX, -HX + 0.3, -HZ, HZ); solid(HX - 0.3, HX, -HZ, HZ); solid(-HX, -0.63, HZ - 0.3, HZ); solid(0.63, HX, HZ - 0.3, HZ);
    box(HX * 2 + 0.5, 0.16, HZ * 2 + 0.5, M.concrete, 0, 0.0, 0, G).userData.noCast = true; box(1.5, 0.1, 0.7, M.concrete, 0, 0.0, HZ + 0.5, G).userData.noCast = true;
    var fl = mesh(new THREE.PlaneGeometry(HX * 2 - 0.6, HZ * 2 - 0.6), retile(M.plank, 4, 3.4), 0, 0.085, 0, G); fl.rotation.x = -PI / 2; fl.userData.noCast = true;
    var cl = mesh(new THREE.PlaneGeometry(HX * 2 - 0.6, HZ * 2 - 0.6), std(0x2a2620, 1), 0, WH - 0.04, 0, G); cl.rotation.x = PI / 2; cl.userData.noCast = true;
    box(HX * 2 + 0.1, 0.18, HZ * 2 + 0.1, M.dark, 0, WH + 0.09, 0, G); var rf = box(HX * 2 + 1.1, 0.08, HZ * 2 + 1.5, M.roof, 0, WH + 0.27, 0.2, G); rf.rotation.x = 0.06;
    // door frame, and the steel door standing open against the wall
    [-0.68, 0.68].forEach(function (x) { box(0.1, 2.15, 0.36, stSteel, x, 1.07, HZ - 0.15, G); }); box(1.46, 0.1, 0.36, stSteel, 0, 2.15, HZ - 0.15, G);
    var dr = new THREE.Group(); dr.position.set(0.66, 0, HZ + 0.04); dr.rotation.y = 2.9; G.add(dr);
    box(1.24, 2.05, 0.06, stGreen, -0.62, 1.03, 0, dr); box(1.24, 0.1, 0.08, stSteel, -0.62, 1.05, 0, dr); box(0.14, 0.04, 0.14, stSteel, -1.1, 1.05, 0, dr);
    [0.35, 1.7].forEach(function (y) { cyl(0.03, 0.03, 0.18, stSteel, 0, y, 0, dr, 8); });
    // slit windows with bars in both side walls; the sign and the lamp over the door
    var wbars = [];
    [-1, 1].forEach(function (sd) {
      [HX + 0.006, HX - 0.306].forEach(function (x, inner) { var wn = mesh(new THREE.PlaneGeometry(1.7, 0.42), M.window, sd * x, 1.85, -0.3, G); wn.rotation.y = sd * (inner ? -1 : 1) * PI / 2; wn.userData.noCast = true; });
      for (q = -0.7; q <= 0.71; q += 0.28) wbars.push([sd * (HX + 0.03), 1.85, -0.3 + q, 1, 0.48, 1]);
    });
    WB.inst(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), stSteel, wbars, G);
    box(2.7, 0.56, 0.04, stSteel, 0, 2.52, HZ + 0.02, G); mesh(new THREE.PlaneGeometry(2.6, 0.5), std(0xffffff, 0.75, { map: bunker ? bunkTex : postTex }), 0, 2.52, HZ + 0.045, G);
    var lampM = basic(0x9dffc8, { fog: false }), inM = basic(0x9dffc8); box(0.2, 0.06, 0.2, stSteel, 0, 2.95, HZ + 0.1, G);
    mesh(new THREE.SphereGeometry(0.1, 10, 8), lampM, 0, 2.86, HZ + 0.14, G).userData.noCast = true; box(0.44, 0.05, 0.44, inM, 0, WH - 0.08, 0, G).userData.noCast = true;
    var wp = w2(0, 0), l = new THREE.PointLight(0x7dffb4, 1.1, 10, 1.5); l.position.set(wp[0], 2.35, wp[1]); scene.add(l);
    // desk and the Ranger Net terminal (the save point)
    box(1.8, 0.06, 0.78, M.wood, 0, 0.8, -HZ + 0.72, G); [[-0.84, -HZ + 0.4], [0.84, -HZ + 0.4], [-0.84, -HZ + 1.04], [0.84, -HZ + 1.04]].forEach(function (lg) { box(0.06, 0.78, 0.06, M.wood, lg[0], 0.39, lg[1], G); });
    box(0.56, 0.44, 0.44, M.dark, 0, 1.05, -HZ + 0.62, G); box(0.5, 0.05, 0.22, stSteel, 0, 0.855, -HZ + 0.98, G);
    var scr = basic(0x551010, { map: WB.termTex, fog: false }); W.termScr[si] = scr; mesh(new THREE.PlaneGeometry(0.46, 0.34), scr, 0, 1.06, -HZ + 0.845, G);
    cyl(0.17, 0.17, 0.05, M.rubber, 0.1, 0.5, -HZ + 1.75, G, 12); cyl(0.025, 0.025, 0.5, stSteel, 0.1, 0.25, -HZ + 1.75, G, 6); cyl(0.2, 0.2, 0.03, stSteel, 0.1, 0.015, -HZ + 1.75, G, 10);
    mesh(new THREE.PlaneGeometry(0.62, 0.48), std(0xffffff, 0.85, { map: noteTex }), 1.25, 1.7, -HZ + 0.306, G);
    // cot, lockers, a shelf of supplies
    box(0.9, 0.06, 1.98, stSteel, -HX + 0.82, 0.34, -0.7, G); box(0.84, 0.14, 1.9, blanket, -HX + 0.82, 0.44, -0.7, G); box(0.5, 0.1, 0.34, std(0xb9b29c, 1), -HX + 0.82, 0.56, -1.42, G);
    [[-HX + 0.4, -1.66], [-HX + 1.24, -1.66], [-HX + 0.4, 0.26], [-HX + 1.24, 0.26]].forEach(function (lg) { box(0.04, 0.34, 0.04, stSteel, lg[0], 0.17, lg[1], G); });
    [0, 1].forEach(function (n) { box(0.5, 1.9, 0.6, stSteel, HX - 0.58, 0.95, -HZ + 0.64 + n * 0.62, G); box(0.02, 1.7, 0.5, stGreen, HX - 0.84, 0.97, -HZ + 0.64 + n * 0.62, G); box(0.03, 0.12, 0.03, M.metal, HX - 0.86, 1.05, -HZ + 0.84 + n * 0.62, G); });
    box(0.32, 0.04, 1.6, M.wood, HX - 0.47, 1.5, 1.3, G); box(0.32, 0.04, 1.6, M.wood, HX - 0.47, 1.0, 1.3, G);
    var jars = []; for (q = 0; q < 8; q++) jars.push([HX - 0.47, (q % 2 ? 1.02 : 1.52) + 0.09, 0.65 + q * 0.18, 0.1 + (q % 3) * 0.02, 0.16 + (q % 4) * 0.03, 0.1, 0, q, 0]);
    WB.inst(new THREE.BoxGeometry(1, 1, 1), M.rust, jars, G);
    solid(-0.95, 0.95, -HZ + 0.3, -HZ + 1.12, true); solid(-HX + 0.3, -HX + 1.3, -1.72, 0.3, true); solid(HX - 0.86, HX - 0.3, -HZ + 0.3, -HZ + 1.58, true);
    s2.rect = span(-HX + 0.3, HX - 0.3, -HZ + 0.3, HZ - 0.3); var tp = w2(0, -HZ + 1.3); s2.tx = tp[0]; s2.tz = tp[1];
    W.safeViz[si] = { set: function (esc, blink) {            // game.js calls this every frame; esc = lockdown, the safe rooms are offline
      lampM.color.setHex(esc ? (blink ? 0xff3020 : 0x401008) : 0x9dffc8); inM.color.setHex(esc ? 0x401008 : 0x9dffc8); l.color.setHex(esc ? 0xff3020 : 0x7dffb4); l.intensity = esc ? (blink ? 0.7 : 0.1) : 1.1;
    } };
  }
  W.safeViz[0] = null;                              // the gift shop at the entrance is built by entrance.js
  station(SAFE[1], 1, 'n'); station(SAFE[2], 2, 'e'); station(SAFE[3], 3, 'w'); station(SAFE[4], 4, 's', true);
  terminal(TERMS[5], 5);

  // ----- lamp posts with light cones -----
  var coneMat = basic(0xffffff, { map: coneGlow, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true });
  [[5.6, 105], [-5.6, 45], [5.6, -50], [-50, 5.6], [50, -5.6], [-40, -84.4], [30, 65.6]].forEach(function (p, idx) {
    cyl(0.08, 0.14, 5.2, M.metal, p[0], 2.6, p[1], null, 8); cyl(0.2, 0.24, 0.5, M.dark, p[0], 0.25, p[1], null, 8);
    var side = p[0] > 0 && Math.abs(p[0]) < 10 ? -1 : 1;
    cyl(0.05, 0.05, 1.2, M.metal, p[0] + side * 0.5, 5.2, p[1], null, 6).rotation.z = PI / 2; cyl(0.34, 0.1, 0.22, M.dark, p[0] + side * 1.0, 5.2, p[1], null, 10);
    var bulb = mesh(new THREE.SphereGeometry(0.2, 10, 10), basic(0xffe2b0), p[0] + side * 1.0, 5.05, p[1]);
    var cn2 = mesh(new THREE.ConeGeometry(2.6, 5.1, 18, 1, true), coneMat, p[0] + side * 1.0, 2.55, p[1]); cn2.userData.noCast = true;
    var dead = idx % 2 === 1, l = null;                                                                 // every other lamp has failed for good
    if (!dead) { l = new THREE.PointLight(0xffc98a, 1.0, 20, 1.5); l.position.set(p[0] + side * 1.0, 4.8, p[1]); scene.add(l); } else { bulb.material = basic(0x15120c); cn2.visible = false; }
    bulb.userData.keep = cn2.userData.keep = true;                                                      // switched on and off as they flicker
    lamps.push({ light: l, bulb: bulb, cone: cn2, phase: idx * 1.7, flicker: true, dead: dead });
    circles.push({ x: p[0], z: p[1], r: 0.25 });
  });

  // ----- the secret -----
  W.duck = dyn(new THREE.Group());
  var dy = std(0xf2c81e, 0.35), dh = std(0x8a7a52, 0.8);
  mesh(sphGeo, dy, 0, 0.16, 0, W.duck).scale.set(0.34, 0.28, 0.44); mesh(sphGeo, dy, 0, 0.22, -0.2, W.duck).scale.set(0.14, 0.14, 0.2);
  mesh(new THREE.SphereGeometry(0.13, 12, 10), dy, 0, 0.38, 0.14, W.duck);
  mesh(new THREE.ConeGeometry(0.05, 0.12, 8), std(0xe8741c, 0.4), 0, 0.36, 0.29, W.duck).rotation.x = PI / 2;
  [-0.05, 0.05].forEach(function (x) { mesh(new THREE.SphereGeometry(0.018, 6, 6), basic(0x000000), x, 0.42, 0.25, W.duck); });
  cyl(0.2, 0.2, 0.015, dh, 0, 0.49, 0.13, W.duck, 14); mesh(new THREE.SphereGeometry(0.11, 10, 8, 0, PI * 2, 0, PI / 2), dh, 0, 0.49, 0.13, W.duck); cyl(0.112, 0.112, 0.03, M.red, 0, 0.51, 0.13, W.duck, 14);
  W.duck.position.set(DUCK[0], 0, DUCK[1]); W.duck.rotation.y = 2.4; scene.add(W.duck);
  circles.push({ x: DUCK[0], z: DUCK[1], r: 0.3 });

  WB.fence = fence; WB.signpost = signpost; WB.mapBoard = mapBoard; WB.bench = bench; WB.bin = bin; WB.vending = vending; WB.picnic = picnic; WB.cart = cart;
})();

function buildWorldLate() {
  var i, g, k, tx, tz, s, glow = WB.glow, posts = WB.posts;
  // ----- vegetation -----
  var propCircles = circles.slice();
  function blocked(x, z2) {
    var q2;
    if (onPath(x, z2, 2.5) || inBox(x, z2, 2) || inRect(x, z2, AQ, 4.5) || inRect(x, z2, ENTR) || inRect(x, z2, STAFF_WING, 2)) return true;
    if (nearSafe(x, z2, 4)) return true;
    for (q2 = 0; q2 < ZONES.length; q2++) if (dist(x, z2, ZONES[q2].key[0], ZONES[q2].key[1]) < 4.5) return true;
    for (q2 = 0; q2 < BATTERY_SPOTS.length; q2++) if (dist(x, z2, BATTERY_SPOTS[q2][0], BATTERY_SPOTS[q2][1]) < 2.5) return true;
    for (q2 = 0; q2 < FUSE_SPOTS.length; q2++) if (dist(x, z2, FUSE_SPOTS[q2][0], FUSE_SPOTS[q2][1]) < 2.5) return true;
    for (q2 = 0; q2 < propCircles.length; q2++) if (dist(x, z2, propCircles[q2].x, propCircles[q2].z) < propCircles[q2].r + 2) return true;
    if (dist(x, z2, 0, 0) < 10) return true;
    if (dist(x, z2, AV.x, AV.z) < AV.r + 2.5) return true;
    return false;
  }
  var dummy = new THREE.Object3D(), col = new THREE.Color();
  var NP = 290, NB = 150, TIERS = 7;
  var pineTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.42, 9, 8), M.trunk, NP);
  var pineTiers = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 14, 1, true), M.needle, NP * TIERS);
  var oakTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.26, 0.55, 4.6, 8), M.trunk, NB);
  var oakBlobs = new THREE.InstancedMesh(jitter(new THREE.IcosahedronGeometry(1, 2), 0.22), M.leaf, NB * 5);
  var placedP = 0, placedB = 0, guard = 0;
  while ((placedP < NP || placedB < NB) && guard++ < 40000) {
    tx = (srand() * 2 - 1) * (WORLD - 4); tz = (srand() * 2 - 1) * (WORLD - 4);
    if (blocked(tx, tz)) continue;
    s = 0.8 + srand() * 0.9; var pine = placedP < NP && (placedB >= NB || srand() < 0.66);
    dummy.rotation.set((srand() - 0.5) * 0.08, srand() * 6, (srand() - 0.5) * 0.08);
    if (pine) {
      dummy.position.set(tx, 4.5 * s, tz); dummy.scale.set(s, s, s); dummy.updateMatrix(); pineTrunks.setMatrixAt(placedP, dummy.matrix);
      for (k = 0; k < TIERS; k++) {
        var tr = (3.0 - k * 0.38) * s * (0.9 + srand() * 0.2);
        dummy.position.set(tx, (3.0 + k * 1.15) * s, tz); dummy.scale.set(tr, 2.9 * s, tr); dummy.rotation.y = srand() * 6; dummy.updateMatrix();
        pineTiers.setMatrixAt(placedP * TIERS + k, dummy.matrix);
        col.setHSL(0.34 + srand() * 0.05, 0.42, 0.1 + srand() * 0.06 + k * 0.006); pineTiers.setColorAt(placedP * TIERS + k, col);
      }
      placedP++;
    } else {
      dummy.position.set(tx, 2.3 * s, tz); dummy.scale.set(s, s, s); dummy.updateMatrix(); oakTrunks.setMatrixAt(placedB, dummy.matrix);
      for (k = 0; k < 5; k++) {
        var br = (1.5 + srand() * 1.0) * s;
        dummy.position.set(tx + (srand() - 0.5) * 2.8 * s, (4.3 + srand() * 2.0) * s, tz + (srand() - 0.5) * 2.8 * s);
        dummy.scale.set(br, br * 0.78, br); dummy.rotation.set(srand() * 6, srand() * 6, 0); dummy.updateMatrix(); oakBlobs.setMatrixAt(placedB * 5 + k, dummy.matrix);
        col.setHSL(0.27 + srand() * 0.07, 0.4, 0.09 + srand() * 0.06); oakBlobs.setColorAt(placedB * 5 + k, col);
      }
      placedB++;
    }
    circles.push({ x: tx, z: tz, r: 0.45 * s });
  }
  pineTrunks.count = placedP; pineTiers.count = placedP * TIERS; oakTrunks.count = placedB; oakBlobs.count = placedB * 5;
  [pineTrunks, pineTiers, oakTrunks, oakBlobs].forEach(function (m) { m.frustumCulled = false; scene.add(m); });
  pineTiers.userData.noCast = false;

  var NBU = 260, bushes = new THREE.InstancedMesh(jitter(new THREE.IcosahedronGeometry(1, 2), 0.3), M.leaf, NBU);
  var NR = 160, rocks = new THREE.InstancedMesh(jitter(new THREE.DodecahedronGeometry(1, 1), 0.25), std(0x6c6c64, 1, { bumpMap: bump(2), bumpScale: 0.18 }), NR);
  function onProp(x, z2, m) { for (var q2 = 0; q2 < propCircles.length; q2++) { var c = propCircles[q2]; if (dist(x, z2, c.x, c.z) < c.r + m) return true; } return false; }     // signs, benches, boards, pillars: nothing is scattered onto them
  function freeSpot(m, noSafe) { do { tx = (Math.random() * 2 - 1) * (WORLD - 2); tz = (Math.random() * 2 - 1) * (WORLD - 2); } while (onPath(tx, tz, m) || inBox(tx, tz, m) || inRect(tx, tz, AQ, m + 0.6) || inRect(tx, tz, ENTR) || inRect(tx, tz, STAFF_WING) || nearSafe(tx, tz, 1.2) || onProp(tx, tz, m) || dist(tx, tz, AV.x, AV.z) < AV.r + 1 && Math.abs(dist(tx, tz, AV.x, AV.z) - AV.r) < m + 0.8); }
  for (i = 0; i < NBU; i++) {
    freeSpot(1.5, true); s = 0.5 + Math.random() * 0.8;
    dummy.position.set(tx, s * 0.4, tz); dummy.scale.set(s * 1.3, s * 0.8, s * 1.3); dummy.rotation.set(0, Math.random() * 6, 0); dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix); col.setHSL(0.28 + Math.random() * 0.08, 0.42, 0.08 + Math.random() * 0.06); bushes.setColorAt(i, col);
  }
  for (i = 0; i < NR; i++) {
    freeSpot(1, false); s = 0.15 + Math.random() * 0.5;
    dummy.position.set(tx, s * 0.3, tz); dummy.scale.set(s * (1 + Math.random()), s * 0.7, s * (1 + Math.random())); dummy.rotation.set(Math.random(), Math.random() * 6, Math.random()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
  }
  bushes.frustumCulled = rocks.frustumCulled = false; scene.add(bushes); scene.add(rocks);
  function cards(tex, count, w, h, hue, m) {
    var inst = new THREE.InstancedMesh(crossCard(w, h), new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide }), count);
    for (var n = 0; n < count; n++) {
      freeSpot(m, true); var sc = 0.6 + Math.random() * 0.9;
      dummy.position.set(tx, -0.02, tz); dummy.scale.set(sc, sc * (0.8 + Math.random() * 0.5), sc); dummy.rotation.set(0, Math.random() * 6, 0); dummy.updateMatrix();
      inst.setMatrixAt(n, dummy.matrix); col.setHSL(hue + Math.random() * 0.06, 0.25, 0.5 + Math.random() * 0.3); inst.setColorAt(n, col);
    }
    inst.frustumCulled = false; inst.userData.noCast = true; scene.add(inst); return inst;
  }
  var grassInst = cards(grassTex, 9500, 0.9, 0.7, 0.2, 0.25), fernInst = cards(fernTex, 2200, 1.5, 1.1, 0.24, 1.2);
  // the graphics preset thins the undergrowth (instances are in random order, so dropping the tail thins it evenly)
  var vegList = [[grassInst, 9500], [fernInst, 2200], [bushes, NBU], [rocks, NR]];
  W.vegScale = function (f) { vegList.forEach(function (v) { v[0].count = Math.max(1, Math.round(v[1] * f)); }); };
  W.vegScale(GFX[gfxName] ? GFX[gfxName].veg : 1);

  var NL = 150, litter = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.26, 0.18), std(0xffffff, 0.9, { side: THREE.DoubleSide }), NL);
  var litterCols = [0xd8d2c2, 0xa8231c, 0x2c5fa8, 0xd8b23a, 0x8a8a8a];
  for (i = 0; i < NL; i++) {
    var lp = PATHS[i % PATHS.length];
    dummy.position.set(lp[0] - 3 + Math.random() * (lp[1] - lp[0] + 6), 0.045, lp[2] - 3 + Math.random() * (lp[3] - lp[2] + 6));
    dummy.rotation.set(-PI / 2 + (Math.random() - 0.5) * 0.3, 0, Math.random() * 6); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    litter.setMatrixAt(i, dummy.matrix); col.setHex(litterCols[i % litterCols.length]); litter.setColorAt(i, col);
  }
  litter.frustumCulled = false; litter.userData.noCast = true; scene.add(litter);

  // fence posts, all in one batch
  var postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.085, 1, 6), M.rust, posts.length);
  posts.forEach(function (p, n) { dummy.position.set(p[0], (p[2] + 0.3) / 2, p[1]); dummy.rotation.set((srand() - 0.5) * 0.05, 0, (srand() - 0.5) * 0.05); dummy.scale.set(1, p[2] + 0.3, 1); dummy.updateMatrix(); postMesh.setMatrixAt(n, dummy.matrix); });
  postMesh.frustumCulled = false; scene.add(postMesh);

  // ----- pickups -----
  /* Nothing floats.  Each section of the master key lies on something: a keeper's key stand, a plinth, the floor of the
     aviary cage, the bottom of the lockbox.  Cells and fuses lie on the ground.  A soft glow marks them in the dark. */
  var keyMat = std(0xffc933, 0.25, { metalness: 0.85, emissive: 0xd08a00, emissiveIntensity: 0.9 });
  var glowGold = softTex('rgba(255,214,110,.75)', 'rgba(255,180,60,.2)'), glowCell = softTex('rgba(255,236,170,.8)', 'rgba(255,196,72,.26)');
  var cellPoolMat = new THREE.MeshBasicMaterial({ map: softTex('rgba(255,214,110,.42)', 'rgba(255,180,60,.12)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });   // the cells glow the warm yellow of the flashlight's charge bars
  function glowSprite(tex, size, y, parent) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })); sp.position.y = y; sp.scale.set(size, size, 1); parent.add(sp); return sp; }
  var KEY_Y = [CW + 0.945, 0.725, 0.925, 0.69, 0.47];                 // (the first lies on the keepers' workbench over the tank)
  for (i = 0; i < ZONES.length; i++) {
    var kg = dyn(new THREE.Group()), kf = new THREE.Group(); kf.rotation.y = 0.6 + i * 1.3; kg.add(kf);
    mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 18), keyMat, 0, 0, 0, kf).rotation.x = PI / 2;
    box(0.032, 0.022, 0.2, keyMat, 0, 0, 0.17, kf); for (k = 0; k <= i; k++) box(0.05, 0.022, 0.022, keyMat, 0.035, 0, 0.14 + k * 0.03, kf);
    box(0.07, 0.006, 0.1, M.metal, -0.13, -0.008, 0.02, kf).rotation.y = 0.5; mesh(new THREE.TorusGeometry(0.03, 0.004, 5, 12), M.metal, -0.08, 0, 0.0, kf).rotation.x = PI / 2;     // its numbered tag
    kg.userData.glow = glowSprite(glowGold, 0.9, 0.1, kg);
    kg.position.set(ZONES[i].key[0], KEY_Y[i], ZONES[i].key[1]); scene.add(kg); keyMeshes.push(kg);
  }
  W.keyY = KEY_Y;
  for (i = 0; i < BATTERY_SPOTS.length; i++) {
    var bg = dyn(new THREE.Group()), cell = Hands.buildBattery(bg, true); cell.scale.setScalar(1.7); cell.position.y = 0.0118 * 1.7; cell.rotation.y = srand() * 6;   // lying on its side
    /* its glow: a warm pool of light on whatever it lies on, and a small halo round the cell (a big upright sprite would be cut
       off by the counter it sits on) */
    var pool = mesh(new THREE.PlaneGeometry(0.44, 0.44), cellPoolMat.clone(), 0, 0.003, 0, bg); pool.rotation.x = -PI / 2; pool.renderOrder = 2; pool.userData.noCast = true;
    bg.userData.glow = glowSprite(glowCell, 0.13, 0.026, bg); bg.userData.glow.renderOrder = 3; bg.userData.pool = pool; scene.add(bg); batMeshes.push(bg);
  }
  var fuseCols = { 5: 0x9a9a9a, 10: 0xc8102e, 15: 0x2c7dd8, 20: 0xe2b93b, 25: 0xeeeeee, 30: 0x2fb85a, 40: 0xff7a1a };
  W.fuseMats = [];
  FUSE_SPOTS.forEach(function (f) {
    var fg = dyn(new THREE.Group()), band = std(0xffffff, 0.4, { emissive: 0xffffff, emissiveIntensity: 0.5 }); W.fuseMats.push(band);
    cyl(0.07, 0.07, 0.36, std(0xfff4d8, 0.15, { transparent: true, opacity: 0.6 }), 0, 0, 0, fg, 12); cyl(0.074, 0.074, 0.12, band, 0, 0, 0, fg, 12);
    [-0.2, 0.2].forEach(function (yy) { cyl(0.08, 0.08, 0.08, M.metal, 0, yy, 0, fg, 12); });
    fg.rotation.z = PI / 2; fg.rotation.y = srand() * 6; fg.position.set(f[0], 0.092 + (inSafe(f[0], f[1]) ? 0.085 : 0), f[1]); scene.add(fg); fuseMeshes.push(fg);
    var fgl = dyn(new THREE.Group()); fgl.position.copy(fg.position); scene.add(fgl); fg.userData.glow = glowSprite(glowGold, 0.5, 0.08, fgl); fg.userData.glowG = fgl;
  });
  W.fuseCols = fuseCols;

  // ----- exit guide line (easy), drifting mist -----
  W.routeMat = basic(0xff2a1a, { transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  for (i = 0; i < 5; i++) { var rs = dyn(box(1, 0.04, 1, W.routeMat, 0, 0.07, 0)); rs.visible = false; rs.userData.noCast = true; W.route.push(rs); }
  var mistMat = new THREE.SpriteMaterial({ map: softTex('rgba(150,165,190,.55)', 'rgba(120,135,160,.2)'), transparent: true, opacity: 0.055, depthWrite: false });
  for (i = 0; i < 46; i++) {
    var ms = dyn(new THREE.Sprite(mistMat));
    do { tx = (Math.random() * 2 - 1) * 140; tz = (Math.random() * 2 - 1) * 140; } while (inRect(tx, tz, AQ, 6));
    ms.position.set(tx, 1.0 + Math.random() * 0.8, tz); s = 16 + Math.random() * 14; ms.scale.set(s, s * 0.32, 1);
    ms.userData = { bx: tx, bz: tz, ph: Math.random() * 6 }; scene.add(ms); W.mist.push(ms);
  }
  // (the old dust motes in the beam read as white specks on screen; the beam's haze is left to the fog)

  // ----- flat decals and printed faces: never let them flicker against the surface they lie on -----
  (function () {
    var use = {}, cache = {};
    function isDecal(o) {
      var t = o.geometry.type; if (t !== 'PlaneGeometry' && t !== 'CircleGeometry' && t !== 'RingGeometry') return 0;
      for (var p = o; p; p = p.parent) if (p === camera) return 0;                                // not the hands
      var flat = Math.abs(Math.abs(o.rotation.x) - PI / 2) < 0.2;
      if (flat && Math.abs(o.position.y) > 0.3 && !o.material.map) return 0;                      // a table top or the pool floor
      return flat ? clamp(Math.ceil(Math.abs(o.position.y) / 0.012), 1, 6) : 2;
    }
    scene.traverse(function (o) {
      if (!o.isMesh || !o.geometry || Array.isArray(o.material) || o.material.isMeshBasicMaterial) return;
      var u = use[o.material.uuid] = use[o.material.uuid] || { decals: [], other: 0, rank: 0 }, r = isDecal(o);
      if (r) { u.decals.push([o, r]); u.rank = Math.max(u.rank, r); } else u.other++;
    });
    Object.keys(use).forEach(function (id) {
      var u = use[id]; if (!u.decals.length) return;
      if (!u.other) { var m = u.decals[0][0].material; m.polygonOffset = true; m.polygonOffsetFactor = -u.rank; m.polygonOffsetUnits = -u.rank * 2; return; }
      u.decals.forEach(function (d) {            // the material is also used on solid things: give the decals their own copy
        var key = id + ':' + d[1];
        if (!cache[key]) { var c = d[0].material.clone(); c.polygonOffset = true; c.polygonOffsetFactor = -d[1]; c.polygonOffsetUnits = -d[1] * 2; cache[key] = c; }
        d[0].material = cache[key];
      });
    });
  })();

  // ----- shadows, then freeze everything that never moves -----
  scene.traverse(function (o) {
    if (!o.isMesh) return;
    var isBasic = o.material.isMeshBasicMaterial;
    o.receiveShadow = !isBasic;
    var p = o, noCast = isBasic || o.material.transparent;
    while (p && !noCast) { if (p.userData && p.userData.noCast) noCast = true; p = p.parent; }
    o.castShadow = !noCast;
  });
  scene.updateMatrixWorld(true);
  var moving = [camera, plesMesh, pteroMesh].concat(dynamic, dinos.map(function (d) { return d.mesh; }));
  scene.traverse(function (o) { if (o !== scene) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
  moving.forEach(function (root) { root.traverse(function (o) { o.matrixAutoUpdate = true; }); });
  if (!/[?&]nobatch/.test(location.search)) W.batches = batchStatic();       // ?nobatch keeps every mesh separate (the float check wants them that way)
}

/* Static batching.  The park is built from thousands of small meshes; drawn one by one they cost more than their triangles.
   Once nothing more will be added, every mesh that never moves is merged with its neighbours that share its material, in
   40 m squares so that whole squares can still be culled.  Anything that moves (dyn), is instanced, is see-through, or is
   switched on and off later (userData.keep on it or on a parent) is left alone. */
function batchStatic() {
  var CH = 40, groups = {}, made = 0, gone = 0, nm = new THREE.Matrix3(), v = new THREE.Vector3();
  scene.traverse(function (o) {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.matrixAutoUpdate || Array.isArray(o.material) || o.material.transparent || o.material.wireframe) return;
    var g = o.geometry, a = g.attributes; if (!a.position || !a.normal || !a.uv || a.color) return;
    var home = null;                       // a kept group that batches inside itself (the staff wing: switched on and off whole)
    for (var p = o; p && p !== scene; p = p.parent) {
      if (p.userData && p.userData.keep) { if (p.userData.batchInside && !home && p !== o) { home = p; continue; } return; }
      if (!p.visible || (p !== o && p.matrixAutoUpdate)) return;
    }
    var e = o.matrixWorld.elements, key = (home ? home.uuid + '#' : '') + o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + Math.floor(e[12] / CH) + ',' + Math.floor(e[14] / CH) + '|' + (o.renderOrder || 0);
    (groups[key] = groups[key] || []).push(o); o.userData.batchHome = home;
  });
  Object.keys(groups).forEach(function (key) {
    var L = groups[key]; if (L.length < 2) return;
    var nv = 0, ni = 0, i, j;
    L.forEach(function (o) { var g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
    var pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), vo = 0, io = 0;
    L.forEach(function (o) {
      var g = o.geometry, P2 = g.attributes.position, N2 = g.attributes.normal, U2 = g.attributes.uv, n = P2.count, flip = o.matrixWorld.determinant() < 0;
      nm.getNormalMatrix(o.matrixWorld);
      for (i = 0; i < n; i++) {
        v.fromBufferAttribute(P2, i).applyMatrix4(o.matrixWorld); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(N2, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
        uv[(vo + i) * 2] = U2.getX(i); uv[(vo + i) * 2 + 1] = U2.getY(i);
      }
      var cnt = g.index ? g.index.count : n;
      for (j = 0; j < cnt; j += 3) { var i0 = g.index ? g.index.getX(j) : j, i1 = g.index ? g.index.getX(j + 1) : j + 1, i2 = g.index ? g.index.getX(j + 2) : j + 2; idx[io++] = vo + i0; idx[io++] = vo + (flip ? i2 : i1); idx[io++] = vo + (flip ? i1 : i2); }
      vo += n; if (o.parent) o.parent.remove(o); gone++;
    });
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
    var home = L[0].userData.batchHome;
    if (home) { home.updateMatrixWorld(true); bg.applyMatrix4(new THREE.Matrix4().copy(home.matrixWorld).invert()); }
    var m = new THREE.Mesh(bg, L[0].material); m.castShadow = L[0].castShadow; m.receiveShadow = L[0].receiveShadow; m.renderOrder = L[0].renderOrder; m.matrixAutoUpdate = false; m.updateMatrix(); (home || scene).add(m); made++;
  });
  /* Things that move keep their groups (a gate leaf, a raptor's jaw), but the parts inside one rigid group are merged in the
     same way, in that group's own space: a mouthful of teeth becomes one mesh. */
  var gone2 = 0, made2 = 0;
  dynamic.concat(dinos.map(function (d) { return d.mesh; }), [plesMesh, pteroMesh]).forEach(function (root) {
    var grps = []; root.traverse(function (o) { if (!o.isMesh && o.children.length > 1) grps.push(o); });
    grps.forEach(function (grp) {
      var by = {};
      grp.children.forEach(function (o) {
        if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.children.length || Array.isArray(o.material) || o.material.transparent || o.material.wireframe || o.userData.keep || !o.visible) return;
        var a = o.geometry.attributes; if (!a.position || !a.normal || !a.uv || a.color) return;
        var key = o.material.uuid + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0); (by[key] = by[key] || []).push(o);
      });
      Object.keys(by).forEach(function (key) {
        var L = by[key]; if (L.length < 2) return;
        var nv = 0, ni = 0, i, j; L.forEach(function (o) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; });
        var pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), vo = 0, io = 0;
        L.forEach(function (o) {
          var g = o.geometry, P2 = g.attributes.position, N2 = g.attributes.normal, U2 = g.attributes.uv, n = P2.count; o.updateMatrix(); nm.getNormalMatrix(o.matrix); var flip = o.matrix.determinant() < 0;
          for (i = 0; i < n; i++) {
            v.fromBufferAttribute(P2, i).applyMatrix4(o.matrix); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
            v.fromBufferAttribute(N2, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
            uv[(vo + i) * 2] = U2.getX(i); uv[(vo + i) * 2 + 1] = U2.getY(i);
          }
          var cnt = g.index ? g.index.count : n;
          for (j = 0; j < cnt; j += 3) { var i0 = g.index ? g.index.getX(j) : j, i1 = g.index ? g.index.getX(j + 1) : j + 1, i2 = g.index ? g.index.getX(j + 2) : j + 2; idx[io++] = vo + i0; idx[io++] = vo + (flip ? i2 : i1); idx[io++] = vo + (flip ? i1 : i2); }
          vo += n; grp.remove(o); gone2++;
        });
        var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
        var m = new THREE.Mesh(bg, L[0].material); m.castShadow = L[0].castShadow; m.receiveShadow = L[0].receiveShadow; grp.add(m); made2++;
      });
    });
  });
  return { merged: gone, into: made, movingParts: gone2, movingInto: made2 };
}
