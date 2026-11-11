/* Jurassic Massacre — core: constants, renderer, post-processing, collision, materials, helpers, audio.
   The game is plain scripts that share globals, loaded in this order (see index.html):
     core.js      constants, renderer, collision, textures, materials, mesh and sign helpers, sound
     creatures.js the animals: models, pathfinding, behaviour
     world.js     the park: ground, walls, buildings, props, puzzle hardware; then vegetation, pickups, batching
     entrance.js  the front gate, the road outside, the plaza, the ticket lanes
     shop.js      the gift shop (first safe room) and the generator shed
     hands.js     the player's gloved hands and flashlight, and their animations
     zoonet.js    the staff computer
     cutscene.js  the opening and the escape
     scares.js    what happens when something catches you, and first encounters
     game.js      player, puzzles, interaction, lockdown, saving, input, HUD, main loop */
'use strict';

var SAVE_KEY = 'jurassicMassacreSave_v5', PREF_KEY = 'jurassicMassacrePrefs';
var WORLD = 150, SAFE_R = 7, PI = Math.PI;        // park spans -150..150; north is -z; the entrance gate is in the south wall
var START = { x: 0, z: 141.5 };
var ENTR = { x1: -27, x2: 28, z1: 112.5, z2: 150 };      // the entrance plaza: built by entrance.js, nothing else is scattered here

var DIFFS = {
  easy:   { label: 'Easy',   speed: 0.85, sight: 0.75, hear: 0.7,  fov: 1.75, react: 1.1,  search: 4,  call: 0,  flank: false, lead: 0,
            drain: 0.24, raptors: 4, stun: 6,   batteries: 18, charge: 45, levers: 3, hold: 0.8, gateOpen: 9,  ping: 14, rexStill: 0.2, path: true, cover: true },
  normal: { label: 'Normal', speed: 1.0,  sight: 1.0,  hear: 1.0,  fov: 2.3,  react: 0.55, search: 9,  call: 28, flank: true,  lead: 0.15,
            drain: 0.33, raptors: 5, stun: 4.5, batteries: 14, charge: 40, levers: 4, hold: 1.0, gateOpen: 13, ping: 8,  rexStill: 0.35 },
  hard:   { label: 'Hard',   speed: 1.0,  sight: 1.15, hear: 1.25, fov: 2.9,  react: 0.25, search: 15, call: 50, flank: true,  lead: 0.5,
            drain: 0.4,  raptors: 6, stun: 3.5, batteries: 10, charge: 35, levers: 4, hold: 1.3, gateOpen: 17, ping: 0,  rexStill: 0.8, omni: true }
};
var diffName = 'normal', DIFF = DIFFS.normal;

// ---------- layout ----------
var TURN_Z = 116, FENCE_A = 38, FENCE_B = -45;
var AQ = { x1: 74, x2: 132, z1: 46, z2: 78 };
var POOL = { x1: 93, x2: 125, z1: 46.75, z2: 77.25, water: -0.5, swim: -1.9, floor: -2.2 };
var PLATFORMS = [[96.5, 62, 2.6, 0.4], [100.5, 58.5, 2.2, 0.6], [104.5, 62.5, 2, 0.5], [108, 66.5, 2, 0.8],
                 [111.5, 63.5, 1.6, 0.6], [115, 60, 2, 0.5], [119, 61.5, 1.8, 0.8], [122.5, 62, 2, 0.4]];
var AV = { x: -100, z: -95, r: 30, h: 15 };
var COVERS = [[-76, -90], [-86, -92], [-93, -99], [-107, -91], [-118, -97], [-101, -107], [-97, -118], [-110, -106]];
var WINCH = [4, 6];
var PERCHES = [[-100, -95], [-90, -105], [-112, -88], [-108, -108], [-88, -86]];
var REX = { x1: 62, x2: 114, z1: -113, z2: -71 };
var LEVERS = [[-104, 61], [-65, 99], [-105, 99], [-66, 61]];
var FUSE_SPOTS = [[-103.5, 2.2], [103.5, -2.2], [12.6, -19.4], [-14, 14.5], [-34.4, -22]];
var RELEASE = { B: [38, -47.8], A: [-38, 35.4] };          // emergency gate releases, on the north side of each sector fence
var LOCKBOX = [65, -73];
var DUCK = [-18.6, -75.2];
var ZONES = [
  { name: 'THE AQUARIUM',   x: 103,  z: 62,  key: [128.5, 62] },
  { name: 'RAPTOR PADDOCK', x: -85,  z: 80,  key: [-85, 80] },
  { name: 'VISITOR CENTER', x: -22,  z: -22, key: [-10.6, -22] },
  { name: 'THE AVIARY',     x: -100, z: -95, key: [-100, -95] },
  { name: 'T-REX KINGDOM',  x: 88,   z: -92, key: [LOCKBOX[0], LOCKBOX[1]] }
];
/* Safe rooms are real buildings.  `rect` is the interior floor: the player is safe while standing inside it, and the animals keep clear of it.
   `tx,tz` is where the save terminal stands.  Doorways must be no wider than 1.3 m (the player fits, a raptor does not). */
var SAFE = [
  { name: 'Gift Shop',        x: 18,   z: 128,  need: 'pow0',  rect: { x1: 11.3, x2: 24.7, z1: 121.3, z2: 134.7 }, tx: 16.0, tz: 121.9 },
  { name: "Keeper's Hut",     x: -45,  z: 93,   need: 'pen',   rect: { x1: -48.6, x2: -41.4, z1: 90, z2: 96 },    tx: -45, tz: 93 },
  { name: 'West Ranger Post', x: -106, z: 0,    need: 'power', rect: { x1: -109.6, x2: -102.4, z1: -3, z2: 3 },   tx: -106, tz: 0 },
  { name: 'East Ranger Post', x: 106,  z: 0,    need: 'power', rect: { x1: 102.4, x2: 109.6, z1: -3, z2: 3 },     tx: 106, tz: 0 },
  { name: 'North Bunker',     x: 0,    z: -124, need: 'north', rect: { x1: -3.6, x2: 3.6, z1: -127, z2: -121 },   tx: 0, tz: -124 }
];
var TERMS = SAFE.concat([{ name: 'Aquarium Lobby', x: 85.5, z: 67, tx: 85.5, tz: 67, need: 'aqua', solo: true }]);
var NEED_HINT = { pow0: 'no power. Restore it from the generator shed across the plaza', turn: 'open the turnstiles first', pen: 'unlock the holding pen in the paddock first', power: 'no power. Fix the fuse box at the Visitor Center',
  north: 'recover a key piece from the Aviary or T-Rex Kingdom first', aqua: 'recover the key piece across the pool first' };
var PATHS = [[-4, 4, -118, 113.5], [-100, 100, -4, 4], [-80, 0, 76, 84], [0, 74, 56, 64], [-100, 60, -94, -86]];   // x1, x2, z1, z2
var BATTERY_SPOTS = [[12, 119], [-8, 96], [26, 93], [-45, 73], [-70, 100], [60, 70], [104, 40], [80, 72], [-14, -8], [-28, -10], [10, -36],
  [100, 9], [-106, -9], [60, 20], [-60, 22], [-22, -63], [-80, -62], [-60, -97], [40, -84], [70, -110], [-6, -108]];
var ROMAN = ['I', 'II', 'III', 'IV'];

// ---------- helpers ----------
var seed = 20261109;
function srand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function $(id) { return document.getElementById(id); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function inRect(x, z, R, m) { m = m || 0; return x > R.x1 - m && x < R.x2 + m && z > R.z1 - m && z < R.z2 + m; }
function sector(z) { return z > TURN_Z ? 3 : z > FENCE_A ? 0 : z > FENCE_B ? 1 : 2; }
function angDiff(a, b) { var d = a - b; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; return d; }
function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
function lerp(a, b, t) { return a + (b - a) * t; }
function sstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }                          // smooth 0..1
function easeIO(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   // heavy things: slow start, slow stop
function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
function easeBack(t) { t = clamp(t, 0, 1); var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }   // slight overshoot, then settles
function damp(cur, target, rate, dt) { return cur + (target - cur) * (1 - Math.exp(-rate * dt)); }   // frame-rate independent follow

// ---------- renderer / scene ----------
var canvas = $('game');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x020308);
scene.fog = new THREE.FogExp2(0x05080d, 0.03);
var camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 800);
camera.rotation.order = 'YXZ';
scene.add(camera);

var hemiLight = new THREE.HemisphereLight(0x3a4d78, 0x0b0e08, 0.09); scene.add(hemiLight);
var moonLight = new THREE.DirectionalLight(0x8ea4d6, 0.13);
moonLight.position.set(0.5, 1, -0.6); scene.add(moonLight);
var rimLight = new THREE.DirectionalLight(0x24304a, 0.1);          // faint back light so silhouettes read against the dark
rimLight.position.set(-0.6, 0.4, 0.7); scene.add(rimLight);

var flashlight = new THREE.SpotLight(0xfff0d0, 0, 62, 0.5, 0.65, 1.25);
flashlight.position.set(0.28, -0.22, 0.1);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(1024, 1024);
flashlight.shadow.camera.near = 0.4; flashlight.shadow.camera.far = 62;
flashlight.shadow.bias = -0.0012; flashlight.shadow.radius = 2;
camera.add(flashlight);
flashlight.target.position.set(0.02, -0.06, -1);
camera.add(flashlight.target);

// ---------- post-processing: bloom + filmic grade (falls back to plain rendering if the add-ons did not load) ----------
var composer = null, bloomPass = null, gradePass = null;
var GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 1.0 }, pulse: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: [
    'uniform sampler2D tDiffuse; uniform float time; uniform float exposure; uniform float pulse; varying vec2 vUv;',
    'vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 7.13) * 43758.5453); }',
    'void main(){',
    '  vec2 d = vUv - 0.5; float r2 = dot(d, d); float ca = 0.006 + pulse * 0.02;',
    '  vec3 c = vec3(texture2D(tDiffuse, vUv + d * r2 * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * r2 * ca).b);',
    '  c = aces(c * exposure);',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c = mix(vec3(l), c, 1.1);                                   // a touch more saturation',
    '  c = mix(c * vec3(0.90, 1.0, 1.10), c * vec3(1.06, 1.0, 0.94), smoothstep(0.15, 0.75, l));   // cool shadows, warm highlights',
    '  c *= 1.0 - smoothstep(0.10, 0.62, r2) * 0.78;               // vignette',
    '  c += (hash(vUv * vec2(1733.0, 977.0)) - 0.5) * 0.022;       // film grain',
    '  gl_FragColor = vec4(pow(max(c, 0.0), vec3(1.0 / 2.2)), 1.0);',
    '}'].join('\n')
};
(function setupPost() {
  if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.ShaderPass || !THREE.UnrealBloomPass) return;
  try {
    var sz = renderer.getDrawingBufferSize(new THREE.Vector2()), gl2 = renderer.capabilities.isWebGL2;
    var hdr = !!(gl2 ? renderer.extensions.get('EXT_color_buffer_float') : renderer.extensions.get('EXT_color_buffer_half_float'));
    var opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType };
    var rt = gl2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(sz.x, sz.y, opts) : new THREE.WebGLRenderTarget(sz.x, sz.y, opts);
    composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(sz.x / 2, sz.y / 2), 0.62, 0.55, 0.8);
    composer.addPass(bloomPass);
    gradePass = new THREE.ShaderPass(GradeShader);
    composer.addPass(gradePass);
    renderer.toneMapping = THREE.NoToneMapping; renderer.outputEncoding = THREE.LinearEncoding;
    document.body.classList.add('post');
  } catch (e) {
    composer = null; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding;
  }
})();
function renderFrame(t, pulse) {
  if (composer) { gradePass.uniforms.time.value = t % 100; gradePass.uniforms.pulse.value = pulse || 0; composer.render(); }
  else renderer.render(scene, camera);
}
function setPixelRatio(pr) { pixelRatio = pr; renderer.setPixelRatio(pr); if (composer) { composer.setPixelRatio(pr); composer.setSize(window.innerWidth, window.innerHeight); } }
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- collision world ----------
var boxes = [];    // {x1,x2,z1,z2,off,solid}   solid = blocks line of sight (walls, buildings)
var circles = [];  // {x,z,r,top}               top: only blocks things standing lower than this
function resolve(p, r, y) {
  var i, b, c, cx, cz, dx, dz, d;
  for (i = 0; i < boxes.length; i++) {
    b = boxes[i];
    if (b.off || p.x < b.x1 - r || p.x > b.x2 + r || p.z < b.z1 - r || p.z > b.z2 + r) continue;
    cx = clamp(p.x, b.x1, b.x2); cz = clamp(p.z, b.z1, b.z2);
    dx = p.x - cx; dz = p.z - cz; d = dx * dx + dz * dz;
    if (d >= r * r) continue;
    if (d > 1e-8) { d = Math.sqrt(d); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
    else {
      var l = p.x - b.x1, rr = b.x2 - p.x, t = p.z - b.z1, bt = b.z2 - p.z, m = Math.min(l, rr, t, bt);
      if (m === l) p.x = b.x1 - r; else if (m === rr) p.x = b.x2 + r; else if (m === t) p.z = b.z1 - r; else p.z = b.z2 + r;
    }
  }
  for (i = 0; i < circles.length; i++) {
    c = circles[i];
    if (c.top !== undefined && y >= c.top - 0.05) continue;
    dx = p.x - c.x; dz = p.z - c.z; d = dx * dx + dz * dz;
    var rs = r + c.r;
    if (d < rs * rs) { d = Math.sqrt(d) || 0.001; p.x = c.x + dx / d * rs; p.z = c.z + dz / d * rs; }
  }
  p.x = clamp(p.x, -WORLD + 1.5, WORLD - 1.5);
  p.z = clamp(p.z, -WORLD + 1.5, WORLD - 1.5);
}
// is the straight line between two points cut by a wall or building?
// `any` = true asks about anything you cannot walk through (fences, rails), not only what you cannot see through
function losBlocked(x1, z1, x2, z2, any) {
  var dx = x2 - x1, dz = z2 - z1;
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i]; if ((!any && !b.solid) || b.off) continue;
    var t0 = 0, t1 = 1, a, c, tmp;
    if (Math.abs(dx) < 1e-9) { if (x1 < b.x1 || x1 > b.x2) continue; }
    else { a = (b.x1 - x1) / dx; c = (b.x2 - x1) / dx; if (a > c) { tmp = a; a = c; c = tmp; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) continue; }
    if (Math.abs(dz) < 1e-9) { if (z1 < b.z1 || z1 > b.z2) continue; }
    else { a = (b.z1 - z1) / dz; c = (b.z2 - z1) / dz; if (a > c) { tmp = a; a = c; c = tmp; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) continue; }
    return true;
  }
  return false;
}
function onPath(x, z, m) {
  for (var k = 0; k < PATHS.length; k++) { var p = PATHS[k]; if (x > p[0] - m && x < p[1] + m && z > p[2] - m && z < p[3] + m) return true; }
  return false;
}
function inBox(x, z, m) {
  for (var k = 0; k < boxes.length; k++) { var b = boxes[k]; if (x > b.x1 - m && x < b.x2 + m && z > b.z1 - m && z < b.z2 + m) return true; }
  return false;
}
// inside a safe room (optionally grown by `extra` metres all round)
function nearSafe(x, z, extra) {
  for (var i = 0; i < SAFE.length; i++) if (inRect(x, z, SAFE[i].rect, extra || 0)) return true;
  return false;
}
function inSafe(x, z) { return nearSafe(x, z, 0); }
// keep something (an animal) at least `m` metres clear of every safe room; returns true if it had to be moved
function pushOutSafe(p, m) {
  var moved = false;
  for (var i = 0; i < SAFE.length; i++) {
    var R = SAFE[i].rect; if (!inRect(p.x, p.z, R, m)) continue;
    var l = p.x - (R.x1 - m), r = (R.x2 + m) - p.x, t = p.z - (R.z1 - m), b = (R.z2 + m) - p.z, k = Math.min(l, r, t, b);
    if (k === l) p.x = R.x1 - m; else if (k === r) p.x = R.x2 + m; else if (k === t) p.z = R.z1 - m; else p.z = R.z2 + m;
    moved = true;
  }
  return moved;
}

// ---------- textures ----------
function canvasTex(size, draw, rx, ry, colour, h) {
  var c = document.createElement('canvas'); c.width = size; c.height = h || size;
  draw(c.getContext('2d'), size, h || size);
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || rx || 1);
  if (colour !== false) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}
function speckle(base, cols, n, maxSize) {
  return function (g, S, H) {
    H = H || S; g.fillStyle = base; g.fillRect(0, 0, S, H);
    for (var i = 0; i < n; i++) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      g.globalAlpha = 0.35 + Math.random() * 0.65;
      g.beginPath(); g.arc(Math.random() * S, Math.random() * H, 1 + Math.random() * (maxSize || 3), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  };
}
function blotch(g, S, cols, n, rMin, rMax, alpha) {
  for (var i = 0; i < n; i++) {
    var x = Math.random() * S, y = Math.random() * S, r = rMin + Math.random() * (rMax - rMin);
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, cols[(Math.random() * cols.length) | 0]); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
}
var bumpNoise = canvasTex(256, speckle('#808080', ['#404040', '#c0c0c0', '#606060', '#a0a0a0', '#202020'], 9000, 2), 1, 1, false);
function bump(rx, ry) { var t = bumpNoise.clone(); t.needsUpdate = true; t.repeat.set(rx, ry || rx); return t; }
var scaleBump = canvasTex(128, function (g, S) {        // pebbly reptile scales
  g.fillStyle = '#777'; g.fillRect(0, 0, S, S);
  for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
    var cx = x * 8 + (y % 2 ? 4 : 0) + 4, cy = y * 8 + 4, gr = g.createRadialGradient(cx, cy, 0.5, cx, cy, 4.6);
    gr.addColorStop(0, '#e8e8e8'); gr.addColorStop(0.7, '#8a8a8a'); gr.addColorStop(1, '#1e1e1e');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 4.6, 0, 7); g.fill();
  }
}, 1, 1, false);
function scales(rx, ry) { var t = scaleBump.clone(); t.needsUpdate = true; t.repeat.set(rx, ry || rx); return t; }
/* A tangent-space normal map from a height picture: draw(g, S, H) paints white = high, black = low on a canvas.
   Sharper and more stable up close than bumpMap.  Use as { normalMap: t, normalScale: new THREE.Vector2(k, k) }. */
function normalTex(size, draw, strength, rx, ry, h) {
  var c = document.createElement('canvas'); c.width = size; c.height = h || size;
  var g = c.getContext('2d'); draw(g, size, h || size);
  var W2 = c.width, H2 = c.height, src = g.getImageData(0, 0, W2, H2), out = g.createImageData(W2, H2), d = src.data, o = out.data, k = strength || 2, x, y;
  function hgt(px, py) { return d[(((py + H2) % H2) * W2 + ((px + W2) % W2)) * 4] / 255; }
  for (y = 0; y < H2; y++) for (x = 0; x < W2; x++) {
    var dx = (hgt(x - 1, y) - hgt(x + 1, y)) * k, dy = (hgt(x, y - 1) - hgt(x, y + 1)) * k, l = 1 / Math.sqrt(dx * dx + dy * dy + 1), q = (y * W2 + x) * 4;
    o[q] = (dx * l * 0.5 + 0.5) * 255; o[q + 1] = (-dy * l * 0.5 + 0.5) * 255; o[q + 2] = (l * 0.5 + 0.5) * 255; o[q + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || rx || 1); t.anisotropy = 8;
  return t;
}

var groundTex = canvasTex(512, function (g, S) {
  speckle('#33421f', ['#26331a', '#3f5226', '#2c3a1d', '#4a5a2e', '#1f2a15'], 17000, 2.5)(g, S);
  blotch(g, S, ['#4a4128', '#3a3320', '#2a3a1c', '#55603a', '#2b2416', '#3d3722'], 70, 20, 90, 0.5);
}, 60);
var gravelTex = canvasTex(256, function (g, S) {
  speckle('#766f63', ['#5e584e', '#8d867a', '#4d483f', '#9a9488', '#6a6459', '#3f3b34'], 11000, 2.2)(g, S);
  blotch(g, S, ['#4a443a', '#5a5246'], 10, 20, 60, 0.4);
}, 1);
var concreteTex = canvasTex(256, function (g, S) {
  speckle('#8a8880', ['#7c7a72', '#96948c', '#6f6d66'], 5000, 2)(g, S);
  blotch(g, S, ['#3a4030', '#2a2a26', '#4a4436'], 16, 20, 70, 0.55);
  var gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(20,24,18,.5)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,34,22,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);                         // rain streaks from the top, damp at the bottom
  g.strokeStyle = 'rgba(30,30,28,.6)'; g.lineWidth = 1;
  for (var i = 0; i < 6; i++) { g.beginPath(); var x = Math.random() * S; g.moveTo(x, 0); for (var y = 0; y < S; y += 16) { x += (Math.random() - 0.5) * 14; g.lineTo(x, y); } g.stroke(); }
}, 1);
var barkTex = canvasTex(128, function (g, S) {
  g.fillStyle = '#3d2c1e'; g.fillRect(0, 0, S, S);
  for (var i = 0; i < 110; i++) { g.strokeStyle = ['#2a1d13', '#4d3a28', '#1f150d', '#56422e'][i % 4]; g.lineWidth = 1 + Math.random() * 2.4; var x = Math.random() * S; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, S * 0.3, x - 6, S * 0.7, x + (Math.random() - 0.5) * 10, S); g.stroke(); }
  blotch(g, S, ['#3a4a2a'], 6, 8, 22, 0.35);
}, 1, 2);
var woodTex = canvasTex(128, function (g, S) {
  g.fillStyle = '#5a4230'; g.fillRect(0, 0, S, S);
  for (var i = 0; i < 70; i++) { g.strokeStyle = ['#463221', '#6b503a', '#3a2919'][i % 3]; g.lineWidth = 1 + Math.random(); var y = Math.random() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (Math.random() - 0.5) * 6); g.stroke(); }
  g.fillStyle = 'rgba(20,12,6,.7)'; for (i = 0; i < 4; i++) { g.fillRect(0, i * 32, S, 1.5); }
}, 1);
var rustTex = canvasTex(128, function (g, S) { speckle('#6a4a38', ['#7a3a1e', '#4a3226', '#8a5a34', '#3a2a22'], 2500, 3)(g, S); blotch(g, S, ['#2a1a12', '#8a4a1e'], 10, 8, 30, 0.5); }, 1);
var metalTex = canvasTex(128, function (g, S) {
  g.fillStyle = '#7b848a'; g.fillRect(0, 0, S, S);
  for (var i = 0; i < 260; i++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.04 + Math.random() * 0.08) + ')'; var y = Math.random() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
  blotch(g, S, ['#5a3a22'], 5, 6, 20, 0.35);
}, 1);
var tileTex = canvasTex(128, function (g, S) {
  for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) { g.fillStyle = (a + b) % 2 ? '#3c5a60' : '#6f8a8c'; g.fillRect(a * 32, b * 32, 32, 32); }
  g.strokeStyle = 'rgba(10,20,22,.8)'; g.lineWidth = 2; for (a = 0; a <= 4; a++) { g.beginPath(); g.moveTo(a * 32, 0); g.lineTo(a * 32, S); g.moveTo(0, a * 32); g.lineTo(S, a * 32); g.stroke(); }
  blotch(g, S, ['#1a2a22', '#23301c'], 8, 10, 40, 0.5);
}, 1);
var plankTex = canvasTex(128, function (g, S) {
  for (var a = 0; a < 4; a++) { g.fillStyle = ['#6a4f38', '#5c4330', '#73573d', '#614833'][a]; g.fillRect(0, a * 32, S, 32); g.fillStyle = 'rgba(15,8,4,.8)'; g.fillRect(0, a * 32, S, 2); }
  for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,18,10,' + (0.15 + Math.random() * 0.3) + ')'; var y = Math.random() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (Math.random() - 0.5) * 3); g.stroke(); }
}, 1);
var roofTex = canvasTex(64, function (g, S) { for (var a = 0; a < 8; a++) { var gr = g.createLinearGradient(a * 8, 0, a * 8 + 8, 0); gr.addColorStop(0, '#2a2c2e'); gr.addColorStop(0.5, '#5a5e62'); gr.addColorStop(1, '#232527'); g.fillStyle = gr; g.fillRect(a * 8, 0, 8, S); } blotch(g, S, ['#5a3018'], 5, 5, 16, 0.5); }, 2);
// alpha-tested cards
var chainTex = canvasTex(64, function (g, S) {
  g.clearRect(0, 0, S, S); g.strokeStyle = '#aab2b6'; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(-4, -4); g.lineTo(S + 4, S + 4); g.moveTo(S + 4, -4); g.lineTo(-4, S + 4); g.moveTo(-4, S - 4); g.lineTo(4, S + 4); g.moveTo(S - 4, -4); g.lineTo(S + 4, 4); g.stroke();
});
var grassTex = canvasTex(128, function (g, S) {
  g.clearRect(0, 0, S, S);
  for (var i = 0; i < 46; i++) {
    var x = 8 + Math.random() * (S - 16), h = S * (0.35 + Math.random() * 0.6), lean = (Math.random() - 0.5) * 40, w = 2 + Math.random() * 3.5;
    g.fillStyle = ['#3d5a26', '#4e6b30', '#2f4a1e', '#5b7436', '#6a7a3c'][i % 5];
    g.beginPath(); g.moveTo(x - w, S); g.quadraticCurveTo(x + lean * 0.3, S - h * 0.6, x + lean, S - h); g.quadraticCurveTo(x + lean * 0.4, S - h * 0.55, x + w, S); g.fill();
  }
});
var fernTex = canvasTex(128, function (g, S) {
  g.clearRect(0, 0, S, S);
  for (var f = 0; f < 7; f++) {
    var ang = -1.25 + f * 0.42 + (Math.random() - 0.5) * 0.1, len = S * (0.62 + Math.random() * 0.3);
    g.save(); g.translate(S / 2, S); g.rotate(ang);
    g.strokeStyle = '#2c4a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.15, -len * 0.5, 0, -len); g.stroke();
    for (var k = 3; k < 22; k++) {
      var t = k / 22, y = -len * t, x0 = len * 0.15 * 4 * t * (1 - t) * 0.5, lw = (1 - t) * 15 + 2;
      g.fillStyle = ['#35592a', '#42682f', '#2b4c22'][k % 3];
      g.beginPath(); g.ellipse(x0 + lw / 2, y, lw / 2, 2.6, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x0 - lw / 2, y, lw / 2, 2.6, 0.4, 0, 7); g.fill();
    }
    g.restore();
  }
});
var needleTex = canvasTex(256, function (g, S, H) {      // fir branch tier: solid at the top, a ragged fringe along the bottom edge
  g.clearRect(0, 0, S, H);
  g.fillStyle = '#b9c7b3'; g.fillRect(0, 0, S, H * 0.5);
  for (var i = 0; i < 46; i++) { var x = Math.random() * S, w = 5 + Math.random() * 9, d = H * (0.25 + Math.random() * 0.25); g.fillStyle = ['#a9b9a3', '#c8d4c2', '#93a58d'][i % 3]; g.beginPath(); g.moveTo(x - w, H * 0.48); g.lineTo(x + w, H * 0.48); g.lineTo(x + (Math.random() - 0.5) * 6, H * 0.5 + d); g.fill(); }
  for (i = 0; i < 900; i++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '20,40,20' : '235,245,230') + ',.35)'; var px = Math.random() * S, py = Math.random() * H * 0.6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (Math.random() - 0.5) * 5, py + 5 + Math.random() * 8); g.stroke(); }
}, 3, 1, true, 128);
var leafTex = canvasTex(128, speckle('#c4c4c4', ['#ffffff', '#8a8a8a', '#b0b0b0', '#5e5e5e', '#e6e6e6'], 3200, 2.2), 3);
function softTex(inner, mid) {
  return canvasTex(128, function (c, S) {
    var gr = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fillRect(0, 0, S, S);
  });
}
var coneGlow = canvasTex(64, function (c, S) { var gr = c.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(255,220,160,.95)'); gr.addColorStop(0.5, 'rgba(255,210,150,.25)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = gr; c.fillRect(0, 0, S, S); });
// reptile skin: the texture wraps once around the body (u: 0 side, .25 back, .5 side, .75 belly), so the back gets bands and the belly goes pale
function skinTex(base, dark, light, belly, bands) {
  return canvasTex(256, function (g, S) {
    speckle(base, [dark, light, base, base], 9000, 1.5)(g, S);
    var gr = g.createLinearGradient(0, 0, S, 0);
    gr.addColorStop(0.0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, dark); gr.addColorStop(0.47, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.5; g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
    gr = g.createLinearGradient(0, 0, S, 0);
    gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(0.75, belly); gr.addColorStop(0.95, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.85; g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
    g.fillStyle = dark;
    for (var i = 0; i < (bands || 0); i++) {      // saddle bands across the back
      var y = (i + 0.5) / bands * S + (Math.random() - 0.5) * 8, h = 7 + Math.random() * 9;
      g.globalAlpha = 0.6; g.beginPath(); g.moveTo(8, y); g.quadraticCurveTo(64, y - h, 122, y + (Math.random() - 0.5) * 10); g.quadraticCurveTo(64, y + h, 8, y); g.fill();
    }
    g.globalAlpha = 1; blotch(g, S, [dark], 22, 6, 22, 0.4);
  }, 1, 1);
}

// ---------- materials ----------
function std(color, rough, o) {
  var p = { color: color, roughness: rough === undefined ? 0.9 : rough }, k;
  if (o) for (k in o) p[k] = o[k];
  return new THREE.MeshStandardMaterial(p);
}
function basic(color, o) { var p = { color: color }, k; if (o) for (k in o) p[k] = o[k]; return new THREE.MeshBasicMaterial(p); }
function retile(mat, rx, ry) {
  var m = mat.clone(); m.map = mat.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(rx, ry);
  if (mat.bumpMap) { m.bumpMap = mat.bumpMap.clone(); m.bumpMap.needsUpdate = true; m.bumpMap.repeat.set(rx, ry); }
  return m;
}
var M = {
  ground: std(0xffffff, 1, { map: groundTex, bumpMap: bump(60), bumpScale: 0.07 }),
  concrete: std(0xffffff, 0.95, { map: concreteTex, bumpMap: bump(1), bumpScale: 0.035 }),
  dark: std(0x1c1d1f, 0.7, { metalness: 0.2 }),
  wood: std(0xffffff, 0.9, { map: woodTex, bumpMap: bump(1), bumpScale: 0.025 }),
  plank: std(0xffffff, 0.85, { map: plankTex, bumpMap: bump(1), bumpScale: 0.02 }),
  roof: std(0xffffff, 0.6, { map: roofTex, metalness: 0.5 }),
  metal: std(0xb8c0c6, 0.38, { metalness: 0.85, map: metalTex }),
  rust: std(0xffffff, 0.85, { map: rustTex, metalness: 0.35, bumpMap: bump(1), bumpScale: 0.035 }),
  trunk: std(0xffffff, 1, { map: barkTex, bumpMap: bump(1, 2), bumpScale: 0.1 }),
  leaf: std(0xffffff, 0.95, { map: leafTex, bumpMap: bump(2), bumpScale: 0.04 }),
  needle: std(0xffffff, 0.95, { map: needleTex, alphaTest: 0.5, side: THREE.DoubleSide }),
  water: std(0x06202b, 0.06, { metalness: 0.9, bumpMap: bump(4), bumpScale: 0.012 }),
  tile: std(0xffffff, 0.3, { map: tileTex, metalness: 0.12 }),
  white: std(0xd9d4c4, 0.6), bone: std(0xa89e82, 0.8, { bumpMap: bump(2), bumpScale: 0.02 }),
  binGreen: std(0x1f4a30, 0.5, { metalness: 0.4 }), paint: std(0x7a2a22, 0.6, { bumpMap: bump(2), bumpScale: 0.015 }),
  // old blood: a dried, ragged stain soaked into the ground (the shape is in the texture's alpha), not a red disc
  blood: new THREE.MeshStandardMaterial({ roughness: 0.82, transparent: true, depthWrite: false, map: canvasTex(128, function (g, S) {
    g.clearRect(0, 0, S, S);
    for (var i = 0; i < 26; i++) { var a = Math.random() * 6.283, r = Math.pow(Math.random(), 0.7) * S * 0.3, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, q = 5 + Math.random() * (S * 0.2 - r * 0.4), gr = g.createRadialGradient(x, y, 0, x, y, q);
      gr.addColorStop(0, 'rgba(38,6,5,.9)'); gr.addColorStop(0.7, 'rgba(30,7,5,.6)'); gr.addColorStop(1, 'rgba(24,8,6,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2); }
    g.fillStyle = 'rgba(30,6,5,.75)'; for (i = 0; i < 40; i++) { a = Math.random() * 6.283; r = S * (0.22 + Math.random() * 0.26); g.beginPath(); g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 0.6 + Math.random() * 2.2, 0, 7); g.fill(); }      // spatter
    g.strokeStyle = 'rgba(28,6,5,.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(S / 2, S / 2); g.quadraticCurveTo(S * 0.7, S * 0.62, S * 0.95, S * 0.58); g.stroke();                                                                              // dragged
  }) }),
  gold: std(0xc9a13a, 0.3, { metalness: 0.9 }), red: std(0xb01a14, 0.45), yellow: std(0x94700f, 0.65, { bumpMap: bump(2), bumpScale: 0.01 }),
  glass: std(0x9fd8e8, 0.04, { transparent: true, opacity: 0.16, metalness: 0.4 }),
  window: std(0x05080a, 0.06, { metalness: 0.95 }), rubber: std(0x101011, 0.95),
  chain: std(0xffffff, 0.5, { map: chainTex, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.7 })
};

// ---------- mesh helpers ----------
function mesh(geo, mat, x, y, z, parent) {
  var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); (parent || scene).add(m); return m;
}
function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
function cyl(rt, rb, h, mat, x, y, z, parent, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mat, x, y, z, parent); }
function addBox(x, z, w, d, h, mat, collide, y) {
  var m = box(w, h, d, mat, x, (y || 0) + h / 2, z);
  if (collide !== false) boxes.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, solid: h >= 2.5 });
  return m;
}
/* A smooth organic tube through a list of rings [x, y, z, radiusSide, radiusUp].  Used for bodies, necks, tails, limbs.
   `side` is the left-right axis of the cross-section (default x). */
function tubeGeo(rings, seg, sub, side) {
  seg = seg || 14; sub = sub || 4;
  var sideV = side || new THREE.Vector3(1, 0, 0), upHint = new THREE.Vector3(0, 1, 0);
  var curve = new THREE.CatmullRomCurve3(rings.map(function (r) { return new THREE.Vector3(r[0], r[1], r[2]); }));
  var n = (rings.length - 1) * sub + 1, pos = [], uv = [], idx = [], i, j;
  var c = new THREE.Vector3(), t = new THREE.Vector3(), u = new THREE.Vector3(), s = new THREE.Vector3();
  for (i = 0; i < n; i++) {
    var f = i / (n - 1), k = f * (rings.length - 1), k0 = Math.min(Math.floor(k), rings.length - 2), kt = k - k0, sm = kt * kt * (3 - 2 * kt);
    var ra = rings[k0][3] + (rings[k0 + 1][3] - rings[k0][3]) * sm, rb = rings[k0][4] + (rings[k0 + 1][4] - rings[k0][4]) * sm;
    curve.getPoint(f, c); curve.getTangent(f, t);
    s.copy(sideV).addScaledVector(t, -sideV.dot(t)).normalize(); u.crossVectors(t, s).normalize();
    if (u.dot(upHint) < 0) { u.negate(); s.negate(); }
    for (j = 0; j <= seg; j++) {
      var a = j / seg * PI * 2, ca = Math.cos(a) * ra, sa = Math.sin(a) * rb;
      pos.push(c.x + s.x * ca + u.x * sa, c.y + s.y * ca + u.y * sa, c.z + s.z * ca + u.z * sa); uv.push(j / seg, f);
    }
  }
  for (i = 0; i < n - 1; i++) for (j = 0; j < seg; j++) { var p = i * (seg + 1) + j, q = p + seg + 1; idx.push(p, p + 1, q, q, p + 1, q + 1); }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  var nr = g.attributes.normal;                         // weld the normals along the seam
  for (i = 0; i < n; i++) {
    var p0 = i * (seg + 1), p1 = p0 + seg, nx = nr.getX(p0) + nr.getX(p1), ny = nr.getY(p0) + nr.getY(p1), nz = nr.getZ(p0) + nr.getZ(p1), l = Math.hypot(nx, ny, nz) || 1;
    nr.setXYZ(p0, nx / l, ny / l, nz / l); nr.setXYZ(p1, nx / l, ny / l, nz / l);
  }
  return g;
}
function tube(rings, mat, parent, seg, sub, side) { var m = mesh(tubeGeo(rings, seg, sub, side), mat, 0, 0, 0, parent); m.castShadow = true; m.receiveShadow = true; return m; }

function textTex(lines, w, h, bg, fg, border, stains) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  var lh = h / (lines.length + 0.4);
  g.font = 'bold ' + lh * 0.82 + 'px Impact, "Arial Black", Arial, sans-serif';
  for (var i = 0; i < lines.length; i++) g.fillText(lines[i], w / 2, lh * (i + 0.7), w - 36);
  if (stains !== false) { g.fillStyle = 'rgba(60,0,0,.5)'; for (i = 0; i < 4; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * (h / 10), 0, 7); g.fill(); } blotch(g, w, ['#1a1a14'], 5, 10, 50, 0.35); }
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
function infoTex(title, lines, accent, h) {
  var c = document.createElement('canvas'); c.width = 512; c.height = h || 224; var g = c.getContext('2d');
  g.fillStyle = '#0e1c24'; g.fillRect(0, 0, 512, c.height); g.strokeStyle = accent; g.lineWidth = 6; g.strokeRect(5, 5, 502, c.height - 10);
  g.fillStyle = accent; g.font = 'bold 42px Impact, "Arial Black", sans-serif'; g.textAlign = 'center'; g.fillText(title, 256, 56, 470);
  g.fillStyle = '#d6e4e8'; g.font = '23px "Trebuchet MS", Arial, sans-serif';
  for (var i = 0; i < lines.length; i++) g.fillText(lines[i], 256, 104 + i * 36, 480);
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
// ---------- weathering: what twelve years outdoors does to paint ----------
function streaks(g, w, h, n, col, len) {            // rain and rust running down a surface
  for (var q = 0; q < n; q++) {
    var x = Math.random() * w, y = Math.random() * h * 0.6, l = (len || h * 0.5) * (0.4 + Math.random() * 0.6), gr = g.createLinearGradient(0, y, 0, y + l);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.globalAlpha = 0.25 + Math.random() * 0.5; g.fillRect(x, y, 1.5 + Math.random() * 5, l);
  }
  g.globalAlpha = 1;
}
function grime(g, w, h, amount) {                   // dirt gathering at the top edge and along the bottom
  var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(20,18,12,' + 0.35 * amount + ')'); gr.addColorStop(0.25, 'rgba(0,0,0,0)');
  gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(24,26,14,' + 0.6 * amount + ')'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  blotch(g, Math.max(w, h), ['#1c1a12', '#2a2c1a', '#3a3222'], Math.round(10 * amount), 10, Math.max(w, h) * 0.3, 0.35);
}
function chips(g, w, h, n, col) {                   // flaked paint
  g.fillStyle = col;
  for (var q = 0; q < n; q++) {
    var x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 9; g.beginPath();
    for (var a = 0; a < 7; a++) { var an = a / 7 * 6.283, rr = r * (0.5 + Math.random() * 0.7); g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.8); }
    g.fill();
  }
}
var ZOO_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", "Segoe UI", sans-serif';
/* Park signage.  The colour argument picks the kind of board:
     (none)  park name board: green enamel, cream lettering, mustard border
     red     a warning: red board, white lettering
     yellow  a hazard or instruction plate: yellow, black lettering
     pale    an information board: cream, green lettering
     blue    the aquarium's boards
   Every board is weathered.  It stands on two posts set in concrete unless `y` is given, in which case it is fixed to
   whatever is behind it (a wall, a fence) and gets four bolts instead.  The printed face points along local +z. */
var SIGN_STYLE = { '#d9534a': ['#8d1f18', '#f1ecdd', '#f1ecdd', 1], '#ffd23a': ['#d9ae35', '#17140e', '#17140e', 1], '#cfd8c0': ['#ded5b6', '#254a30', '#254a30', 0], '#e8e2d0': ['#ded5b6', '#254a30', '#254a30', 0],
  '#f0e6c8': ['#ded5b6', '#254a30', '#254a30', 0], '#7fd6e8': ['#1d4a58', '#e9e2d0', '#7fd6e8', 0], '#f0cf6a': ['#254a30', '#e2b93b', '#e2b93b', 0] };
var signBack = null;
function makeSign(text, x, z, rotY, w, y, color, noPosts) {
  w = w || 7;
  var st = SIGN_STYLE[color] || ['#254a30', '#ece3c4', '#d9ae35', 0], grp = new THREE.Group(), h = w / 4, by = y || 3, PW = 768, PH = 192;
  var tex = canvasTex(PW, function (g) {
    g.fillStyle = st[0]; g.fillRect(0, 0, PW, PH); g.strokeStyle = st[2]; g.lineWidth = 9; g.strokeRect(11, 11, PW - 22, PH - 22);
    g.fillStyle = st[1]; g.textAlign = 'center'; g.textBaseline = 'middle';
    var fs = 104; g.font = 'bold ' + fs + 'px ' + (st[3] ? 'Impact, "Arial Black", sans-serif' : ZOO_FONT);
    while (g.measureText(text).width > PW - 74 && fs > 30) { fs -= 4; g.font = 'bold ' + fs + 'px ' + (st[3] ? 'Impact, "Arial Black", sans-serif' : ZOO_FONT); }
    g.fillText(text, PW / 2, PH / 2 + 4);
    chips(g, PW, PH, 26, '#1b1a16'); chips(g, PW, PH, 10, '#6b3a1c'); streaks(g, PW, PH, 26, 'rgba(70,40,18,.9)', PH * 0.9); grime(g, PW, PH, 1.1);
  }, 1, 1, true, PH);
  signBack = signBack || std(0xffffff, 0.85, { metalness: 0.35, map: rustTex });
  box(w + 0.1, h + 0.1, 0.05, signBack, 0, by, -0.03, grp);
  mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.75, { map: tex, bumpMap: bump(2), bumpScale: 0.006 }), 0, by, -0.004, grp);
  if (!noPosts && !y) [-w / 2 + 0.3, w / 2 - 0.3].forEach(function (px) { box(0.16, by + h / 2 + 0.25, 0.16, M.wood, px, (by + h / 2 + 0.25) / 2, -0.14, grp); box(0.42, 0.14, 0.42, M.concrete, px, 0.07, -0.14, grp); box(0.2, 0.06, 0.2, M.dark, px, by + h / 2 + 0.28, -0.14, grp); });
  else [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { var b = cyl(0.03, 0.03, 0.03, M.rust, c[0] * (w / 2 - 0.12), by + c[1] * (h / 2 - 0.12), 0.005, grp, 6); b.rotation.x = PI / 2; });
  grp.position.set(x, 0, z); grp.rotation.y = rotY || 0; scene.add(grp);
  return grp;
}
// A panel whose picture is redrawn each game (banners, clue plaques, gauges)
function livePanel(w, h, pw, ph, x, y, z, rotY, parent) {
  var c = document.createElement('canvas'); c.width = pw; c.height = ph;
  var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
  var m = mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, 0.75, { map: tex }), x, y, z, parent); m.rotation.y = rotY || 0;
  return { canvas: c, tex: tex, mesh: m, g: c.getContext('2d') };
}
function plaqueText(P, title, lines, accent) {
  var g = P.g, w = P.canvas.width, h = P.canvas.height;
  g.fillStyle = '#161616'; g.fillRect(0, 0, w, h); g.strokeStyle = accent || '#ffd23a'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = accent || '#ffd23a';
  g.font = 'bold ' + Math.round(h * 0.13) + 'px Impact, "Arial Black", sans-serif'; g.fillText(title, w / 2, h * 0.14, w - 30);
  var lh = (h * 0.74) / Math.max(lines.length, 1), fs = Math.min(lh * 0.62, h * 0.12);
  g.fillStyle = '#f1ecdd'; g.font = fs + 'px "Trebuchet MS", Arial, sans-serif';
  for (var i = 0; i < lines.length; i++) g.fillText(lines[i], w / 2, h * 0.27 + lh * (i + 0.5), w - 30);
  P.tex.needsUpdate = true;
}

var dynamic = [];             // things that still move after the scenery is frozen
function dyn(o) { dynamic.push(o); return o; }

// ---------- sound (synthesized effects) ----------
var prefs = { muted: false, diff: 'normal', duck: false, intro: false, tips: {} };
try { var _pr = JSON.parse(localStorage.getItem(PREF_KEY)); if (_pr) { prefs.muted = !!_pr.muted; prefs.duck = !!_pr.duck; prefs.intro = !!_pr.intro; prefs.tips = _pr.tips || {}; if (DIFFS[_pr.diff]) prefs.diff = _pr.diff; } } catch (e) {}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }

var Sound = {
  ctx: null,
  init: function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    var ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = prefs.muted ? 0 : 0.7; this.master.connect(ctx.destination);
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.5 + last * 3; }
    this.buf = buf;
  },
  setMuted: function (m) { prefs.muted = m; savePrefs(); if (this.master) this.master.gain.value = m ? 0 : 0.7; },
  noise: function (dur, freq, vol, delay) {
    if (!this.ctx) return; var ctx = this.ctx, t = ctx.currentTime + (delay || 0);
    var s = ctx.createBufferSource(); s.buffer = this.buf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.05, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  tone: function (f1, f2, dur, vol, type, delay) {
    if (!this.ctx) return; var ctx = this.ctx, t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.06, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  roar: function (big, vol) {
    vol = vol === undefined ? 1 : vol;
    if (big) { this.tone(95, 32, 2.4, 0.5 * vol, 'sawtooth'); this.tone(140, 45, 2.0, 0.25 * vol, 'square'); this.noise(2.2, 600, 0.5 * vol); }
    else { this.tone(420, 140, 0.7, 0.22 * vol, 'sawtooth'); this.tone(610, 200, 0.5, 0.12 * vol, 'square', 0.05); this.noise(0.7, 2200, 0.3 * vol); }
  },
  bark: function (vol) { this.tone(520, 380, 0.12, 0.14 * vol, 'sawtooth'); this.tone(560, 300, 0.16, 0.12 * vol, 'sawtooth', 0.16); },      // raptor call to the pack
  growl: function (vol) { this.tone(110, 70, 0.9, 0.16 * vol, 'sawtooth'); this.noise(0.9, 500, 0.12 * vol); },
  screech: function () { this.tone(1500, 2600, 0.25, 0.22, 'sawtooth'); this.tone(2600, 900, 0.7, 0.22, 'sawtooth', 0.22); this.noise(0.9, 5000, 0.22); },
  rustle: function () { this.noise(0.5, 1800, 0.14); this.noise(0.35, 1400, 0.1, 0.3); },
  splash: function () { this.noise(0.7, 2600, 0.45); this.noise(1.1, 700, 0.3, 0.1); },
  siren: function () { for (var i = 0; i < 6; i++) { this.tone(520, 880, 0.5, 0.12, 'sawtooth', i * 1.0); this.tone(880, 520, 0.5, 0.12, 'sawtooth', i * 1.0 + 0.5); } },
  alarm: function () { for (var i = 0; i < 4; i++) { this.tone(740, 740, 0.28, 0.16, 'square', i * 0.6); this.tone(554, 554, 0.28, 0.16, 'square', i * 0.6 + 0.3); } },
  buzz: function () { this.tone(140, 110, 0.7, 0.3, 'sawtooth'); this.tone(147, 115, 0.7, 0.25, 'square'); },
  spark: function () { this.noise(0.12, 7000, 0.5); this.noise(0.2, 5000, 0.35, 0.14); this.tone(90, 60, 0.4, 0.3, 'sawtooth'); },
  grind: function () { this.noise(1.8, 300, 0.4); this.tone(70, 55, 1.8, 0.2, 'sawtooth'); },
  clunk: function () { this.tone(160, 60, 0.18, 0.35, 'square'); this.noise(0.15, 900, 0.3); },
  squeak: function () { this.tone(900, 1700, 0.09, 0.25, 'sine'); this.tone(1700, 800, 0.16, 0.25, 'sine', 0.09); },
  step: function (v, f) { this.noise(0.09, f, v); },
  thud: function (vol) { this.tone(70, 28, 0.35, vol, 'sine'); this.noise(0.25, 150, vol * 0.8); },
  beat: function (vol) { this.tone(60, 40, 0.12, vol, 'sine'); this.tone(55, 38, 0.14, vol * 0.8, 'sine', 0.18); },
  // steady sounds: wind in the trees, a gate motor.  Each is built on first use and then only its loudness changes.
  drone: function (name, v, make) {
    if (!this.ctx) return;
    this.drones = this.drones || {};
    if (!this.drones[name]) { if (v <= 0) return; var g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.master); make(this.ctx, g, this.buf); this.drones[name] = g; }
    this.drones[name].gain.setTargetAtTime(v, this.ctx.currentTime, 0.25);
  },
  windSet: function (v) {
    this.drone('wind', v, function (ctx, out, buf) {
      var n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain(); n.buffer = buf; n.loop = true; f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
      lfo.frequency.value = 0.13; lg.gain.value = 180; lfo.connect(lg); lg.connect(f.frequency); n.connect(f); f.connect(out); n.start(); lfo.start();
    });
  },
  motorSet: function (v) {
    this.drone('motor', v, function (ctx, out, buf) {
      var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), m = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = 118; o2.type = 'square'; o2.frequency.value = 236.5; n.buffer = buf; n.loop = true; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.4; m.gain.value = 0.55;
      o1.connect(m); o2.connect(m); n.connect(m); m.connect(f); f.connect(out); o1.start(); o2.start(); n.start();
    });
  },
  klaxonSet: function (v) {
    this.drone('klaxon', v, function (ctx, out) {
      var o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 560; lfo.type = 'square'; lfo.frequency.value = 0.9; lg.gain.value = 130;
      lfo.connect(lg); lg.connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.2; o.connect(f); f.connect(out); o.start(); lfo.start();
    });
  },
  creak: function (vol) { vol = vol === undefined ? 0.5 : vol; var f = 260 + Math.random() * 120; this.tone(f, f * 0.62, 0.9, 0.09 * vol, 'sawtooth'); this.tone(f * 2.02, f * 1.3, 0.7, 0.05 * vol, 'square', 0.05); this.noise(0.8, 1400, 0.05 * vol); },
  clang: function () { var me = this; [196, 523, 811, 1307, 1863, 2480].forEach(function (f, i) { me.tone(f, f * 0.985, 1.5 - i * 0.18, 0.22 - i * 0.025, i ? 'sine' : 'triangle'); }); this.thud(0.7); this.noise(0.35, 4200, 0.5); this.noise(1.2, 700, 0.25, 0.05); },
  rattle: function () { var f = 700 + Math.random() * 500; this.tone(f, f * 0.9, 0.06, 0.12, 'square'); this.noise(0.07, 3600, 0.16); },
  // the generator in the maintenance shed: a low drone whose loudness game.js sets from how far away you are
  genSet: function (v) {
    if (!this.ctx) return;
    if (!this.gen) {
      if (v <= 0) return;
      var ctx = this.ctx, g = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = 46; o2.type = 'square'; o2.frequency.value = 93.5; n.buffer = this.buf; n.loop = true; f.type = 'lowpass'; f.frequency.value = 240;
      lfo.frequency.value = 11; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(g.gain); g.gain.value = 0;
      var m = ctx.createGain(); m.gain.value = 0.5; o1.connect(m); o2.connect(m); n.connect(m); m.connect(f); f.connect(g); g.connect(this.master);
      o1.start(); o2.start(); n.start(); lfo.start(); this.gen = g;
    }
    this.gen.gain.setTargetAtTime(v, this.ctx.currentTime, 0.15);
  },
  chime: function () { this.tone(660, 660, 0.25, 0.25, 'triangle'); this.tone(990, 990, 0.3, 0.25, 'triangle', 0.12); this.tone(1320, 1320, 0.5, 0.2, 'triangle', 0.24); },
  click: function () { this.tone(900, 700, 0.04, 0.15, 'square'); },
  zap: function () { this.tone(2400, 300, 0.3, 0.2, 'square'); this.noise(0.35, 6000, 0.35); },
  pickup: function () { this.tone(520, 780, 0.12, 0.2, 'triangle'); this.tone(780, 1040, 0.15, 0.2, 'triangle', 0.1); },
  deny: function () { this.tone(120, 90, 0.2, 0.2, 'square'); },
  save: function () { this.tone(440, 440, 0.12, 0.2, 'square'); this.tone(660, 660, 0.2, 0.2, 'square', 0.13); }
};

// ---------- recorded effects and voice ----------
/* Optional audio files, listed in audio/manifest.js as  SFX_FILES = { name: 'audio/sfx/name.mp3', ... }.
   Sfx.play(name, { vol, rate, pan, loop, delay, fallback })  plays the recording if it has loaded, otherwise calls `fallback`
   (normally one of the synthesized Sound.* effects), so the game sounds right with or without the files.
   A name with numbered takes (step_1, step_2 ...) is played as `step` and a take is picked at random. */
var SFX_FILES = window.SFX_FILES || {};
var Sfx = {
  buf: {}, takes: {}, started: false, loops: {},
  loadAll: function (done) {
    var me = this, names = Object.keys(SFX_FILES), left = names.length;
    if (!Sound.ctx || this.started) { if (done) done(); return; }
    this.started = true;
    if (!left && done) done();
    names.forEach(function (n) {
      fetch(SFX_FILES[n]).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (res, rej) { Sound.ctx.decodeAudioData(ab, res, rej); }); })
        .then(function (b) { me.buf[n] = b; var m = /^(.*)_\d+$/.exec(n); if (m) (me.takes[m[1]] = me.takes[m[1]] || []).push(n); })
        .catch(function () {}).then(function () { if (--left === 0 && done) done(); });
    });
  },
  pick: function (n) { if (this.buf[n]) return this.buf[n]; var t = this.takes[n]; return t && t.length ? this.buf[t[(Math.random() * t.length) | 0]] : null; },
  has: function (n) { return !!this.pick(n); },
  dur: function (n) { var b = this.pick(n); return b ? b.duration : 0; },
  play: function (n, o) {
    o = o || {};
    var b = Sound.ctx ? this.pick(n) : null;
    if (!b) { if (o.fallback) o.fallback(); return null; }
    var ctx = Sound.ctx, t = ctx.currentTime + (o.delay || 0), s = ctx.createBufferSource(), g = ctx.createGain(), last = g;
    s.buffer = b; s.loop = !!o.loop; s.playbackRate.value = o.rate || 1;
    g.gain.value = o.vol === undefined ? 1 : o.vol; s.connect(g);
    if (o.pan && ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); last = p; }
    last.connect(o.bus || this.bus || Sound.master); s.start(t, o.offset || 0);
    return { src: s, gain: g, stop: function (fade) { try { if (fade) { g.gain.setTargetAtTime(0, ctx.currentTime, fade / 3); s.stop(ctx.currentTime + fade); } else s.stop(); } catch (e) {} } };
  },
  // a sound at a place in the park: quieter with distance, panned by where it is relative to the way you face
  at: function (n, x, z, o) {
    o = o || {};
    var dx = x - player.x, dz = z - player.z, d = Math.hypot(dx, dz), reach = o.reach || 60, v = clamp(1 - d / reach, 0, 1);
    if (v <= 0) return null;
    var right = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
    var q = {}; for (var k in o) q[k] = o[k];
    q.vol = (o.vol === undefined ? 1 : o.vol) * v * v; q.pan = d > 0.5 ? clamp(right / d, -1, 1) * 0.8 : 0;
    return this.play(n, q);
  }
};

// ---------- music (mp3 files in the music folder) ----------
var chaseHold = 0;
var Music = {
  tracks: {}, started: false,
  vol: { menu: 0.5, explore: 0.38, escape: 0.55, chase: 0.6, intro: 0.55 },
  init: function () {
    var me = this;
    ['menu', 'explore', 'escape', 'chase', 'intro'].forEach(function (n) { var a = new Audio('music/' + n + '.mp3'); a.loop = true; a.volume = 0; a.preload = 'auto'; me.tracks[n] = a; });
  },
  want: function () {
    if (state === 'menu') return 'menu';
    if (state === 'cine') return cine && cine.music ? cine.music : chaseHold > 0 ? 'chase' : null;
    if (state !== 'playing' && state !== 'paused') return null;
    if (P && P.esc) return 'escape';
    return chaseHold > 0 && state === 'playing' ? 'chase' : 'explore';
  },
  tick: function (dt) {
    if (!this.started) return;
    dt = Math.min(dt, 0.1);
    var w = this.want(), n, a, target;
    for (n in this.tracks) {
      a = this.tracks[n];
      target = n === w && !prefs.muted ? this.vol[n] * (state === 'paused' ? 0.45 : 1) : 0;
      a.volume = clamp(a.volume + clamp(target - a.volume, -dt * 0.6, dt * 0.9), 0, 1);
      if (target > 0 && a.paused) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
      else if (target === 0 && a.volume <= 0.001 && !a.paused) { a.pause(); if (n === 'chase' || n === 'intro') a.currentTime = 0; }
    }
  }
};
Music.init();
['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { Music.started = true; }, true); });
