/* Jurassic Massacre — what the aquarium sounds like.
   One small mixing desk, built when you go in and taken down when you leave:
     every sound here goes into IN; IN goes to the speakers dry and into two reverbs (the Ocean Hall: a long, dark, three-
     storey tail; the basement: short and hard, concrete and pipe); how much of each is decided by where you are standing.
     GLASS is the tank wall: what happens in the water reaches the hall through it, low and thick (a lowpass before IN).
   Beds that never stop (each faded in and out by place): the building's hum and air, the water moving behind the glass,
   the open water lapping under the catwalks, the plant behind the hall, the pumps in the basement, and the world as it is
   under the surface.  Things that happen now and then: drips (and their echo), the glass taking the weight of the water,
   pipes knocking, the catwalk's hangers, her: turning past the glass, nudging it, and calling.
   Under the surface the whole mix is pressed down (Sound.muffle) and the music ducks away (Music.duck). */
'use strict';

var AquaSound = (function () {
  var S = { on: false }, T = POOL, H = HALL, ctx = null, N = {}, beds = {}, srcs = [], off = 0, t = 0, ev = {}, lastB = null, zoneMix = { hall: 0, base: 0, gal: 0, upper: 0, under: 0 };
  // ---------- impulse responses: decaying noise, darker as it dies away ----------
  function ir(sec, decay, damp, pre) {
    var r = ctx.sampleRate, n = Math.round(sec * r), b = ctx.createBuffer(2, n, r);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var u = i / n, k = Math.min(0.98, 0.25 + u * damp), w = Math.random() * 2 - 1; lp = lp * k + w * (1 - k);                 // the highs go first
        d[i] = (i < pre * r ? 0 : 1) * lp * Math.pow(1 - u, decay) * (1.8 + u * 1.4);
      }
      for (var e = 0; e < 7; e++) { var at = Math.round((pre + 0.01 + Math.random() * 0.09) * r); if (at < n) d[at] += (Math.random() < 0.5 ? -1 : 1) * (0.5 - e * 0.05); }      // a few early reflections off the glass and the walls
    }
    return b;
  }
  function noiseSrc(dest) { var s = ctx.createBufferSource(); s.buffer = Sound.buf; s.loop = true; s.loopStart = Math.random(); s.connect(dest); s.start(0, Math.random() * 1.5); srcs.push(s); return s; }
  function osc(type, f, dest) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(); srcs.push(o); return o; }
  function gain(v, dest) { var g = ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; }
  function filt(type, f, q, dest) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; if (dest) b.connect(dest); return b; }
  function set(param, v, tc) { param.setTargetAtTime(v, ctx.currentTime, tc || 0.25); }

  function build() {
    ctx = Sound.ctx; var M = Sound.master;
    N.out = gain(0, M); set(N.out.gain, 1, 0.6);
    N.in = gain(1); N.dry = gain(1, N.out); N.in.connect(N.dry);
    N.hallC = ctx.createConvolver(); N.hallC.buffer = ir(5.2, 1.7, 1.5, 0.035); N.hallS = gain(0, N.hallC); N.in.connect(N.hallS); N.hallW = gain(1.15, N.out); N.hallC.connect(N.hallW);
    N.baseC = ctx.createConvolver(); N.baseC.buffer = ir(1.5, 3.0, 0.9, 0.008); N.baseS = gain(0, N.baseC); N.in.connect(N.baseS); N.baseW = gain(0.8, N.out); N.baseC.connect(N.baseW);
    N.glass = filt('lowpass', 360, 0.9, N.in); N.glassG = filt('peaking', 160, 1.2); N.glassG.gain.value = 5; N.glassG.connect(N.glass);       // thick glass and a lot of water: the lows come through, nothing else
    N.wet = filt('lowpass', 900, 0.7, N.in);                                                                                          // the open water, heard from above it
    // the building: mains hum, and air moving in a big empty volume
    var hum = beds.hum = gain(0, N.in), hf = filt('lowpass', 420, 0.7, hum);
    osc('sine', 50, gain(0.5, hf)); osc('triangle', 100, gain(0.22, hf)); osc('sawtooth', 150, gain(0.035, hf));
    var air = filt('bandpass', 380, 0.5, gain(0.55, hum)); noiseSrc(air);
    // the water behind the glass: a slow, heavy movement
    var wtr = beds.water = gain(0, N.glassG), wf = filt('bandpass', 210, 0.9, wtr); noiseSrc(wf);
    // the open water under the walk: lapping against the glass and the hangers
    var lap = beds.lap = gain(0, N.wet), lf = filt('bandpass', 620, 1.1, lap); noiseSrc(lf); var lh = filt('highpass', 1800, 0.7, gain(0.12, lap)); noiseSrc(lh);
    // the plant room behind the hall: a deep, slow churn
    var pl = beds.plant = gain(0, N.in), plI = gain(0.6, pl), pf = filt('lowpass', 130, 0.8, plI); osc('sawtooth', 31, gain(0.5, pf)); osc('sine', 62.4, gain(0.35, pf)); var plN = filt('lowpass', 160, 0.6, gain(0.6, plI)); noiseSrc(plN);
    osc('sine', 0.21, gain(0.3, plI.gain));                                                                                           // it breathes (inside the bed's own level)
    // the pumps in the basement: a piston thump and a motor's whine (their own level follows the pump: S.pump)
    var pu = beds.pump = gain(0, N.in), puf = filt('lowpass', 190, 1.4, pu), puA = gain(0.3, puf); osc('sawtooth', 39, puA); var lfo = osc('sine', 1.15, gain(0.28, puA.gain));
    osc('triangle', 236, gain(0.03, filt('bandpass', 236, 6, pu))); var puN = filt('bandpass', 900, 0.8, gain(0.12, pu)); noiseSrc(puN);
    // under the surface: pressure, a roar of nothing, and the building as a thud through the water
    var un = beds.under = gain(0, N.out), uf = filt('lowpass', 240, 0.8, un); noiseSrc(uf); osc('sine', 41, gain(0.12, un));
    S.on = true; off = 0; S.N = N; S.beds = beds; if (S.tap) N.out.connect(S.tap);
  }
  function teardown() {
    srcs.forEach(function (s) { try { s.stop(); } catch (e) {} }); srcs = [];
    try { N.out.disconnect(); } catch (e) {}
    N = {}; beds = {}; S.on = false; Sound.muffle(0); Music.duck = 1;
  }

  // ---------- things that happen: little voices into a destination ----------
  function pan(x, z, dest) {
    if (!ctx.createStereoPanner) return dest; var p = ctx.createStereoPanner(), yaw = camera.rotation.y, dx = x - camera.position.x, dz = z - camera.position.z, l = Math.hypot(dx, dz) || 1;
    p.pan.value = clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / l, -1, 1) * 0.85; p.connect(dest); return p;
  }
  function tone(dest, f1, f2, dur, vol, type, delay, att) {
    var t0 = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || Math.min(0.02, dur / 4))); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function hiss(dest, dur, type, f, q, vol, delay, att, f2) {
    var t0 = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = Sound.buf; b.type = type; b.frequency.setValueAtTime(f, t0); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t0 + dur); b.Q.value = q || 0.7;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || Math.min(0.05, dur / 4))); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(b); b.connect(g); g.connect(dest); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  S.drip = function (x, z, vol, intoWater) {                       // a drop: off the roof onto the floor (a tick and a ping), or into open water (a bloop)
    var d = pan(x, z, N.in), f = 1000 + Math.random() * 1500;
    if (intoWater) { tone(d, f * 0.55, f * 1.15, 0.05, 0.05 * vol, 'sine'); tone(d, f * 0.9, f * 1.6, 0.03, 0.025 * vol, 'sine', 0.035); }
    else { tone(d, f, f * 0.62, 0.05, 0.045 * vol, 'sine'); hiss(d, 0.03, 'highpass', 3500, 0.7, 0.02 * vol); if (Math.random() < 0.35) tone(d, f * 1.3, f * 0.7, 0.04, 0.02 * vol, 'sine', 0.13); }
  };
  S.creak = function (x, z, vol) {                                  // the glass under the weight of the water: a groan you feel more than hear, and ticks
    var d = pan(x, z, N.in), bp = filt('bandpass', 120 + Math.random() * 60, 4, d), f = 52 + Math.random() * 14, dur = 1.2 + Math.random() * 1.4;
    tone(bp, f, f * 0.9, dur, 0.22 * vol, 'sawtooth', 0, dur * 0.4); tone(bp, f * 2.01, f * 1.78, dur * 0.8, 0.07 * vol, 'sawtooth', 0.1, dur * 0.3);
    for (var q = 0, n = 2 + (Math.random() * 4 | 0); q < n; q++) tone(d, 2600 + Math.random() * 2600, 2200, 0.018, 0.035 * vol, 'sine', Math.random() * dur);
  };
  S.knock = function (x, z, vol) {                                  // a pipe in the basement, cooling or under load
    var d = pan(x, z, N.in), f = 180 + Math.random() * 120; [1, 2.76, 5.4, 8.9].forEach(function (m, i) { tone(d, f * m, f * m * 0.99, 0.5 - i * 0.1, (0.07 - i * 0.014) * vol, i ? 'sine' : 'triangle'); }); hiss(d, 0.08, 'bandpass', 1800, 1, 0.05 * vol);
  };
  S.hanger = function (x, z, vol) {                                 // the catwalk's hangers: steel on steel, a long thin complaint
    var d = pan(x, z, N.in), f = 600 + Math.random() * 700, dur = 0.5 + Math.random() * 0.6;
    tone(filt('bandpass', f, 8, d), f, f * (0.93 + Math.random() * 0.1), dur, 0.05 * vol, 'sawtooth', 0, dur * 0.3); tone(d, f * 3.1, f * 3.0, 0.2, 0.012 * vol, 'sine', 0.05);
  };
  S.call = function (x, z, vol, through) {                          // her: a long low moan, the breath behind it.  through: 'glass' | 'air' | 'water'
    var dest = through === 'glass' ? N.glassG : through === 'water' ? N.out : N.wet, d = pan(x, z, dest), f = 58 + Math.random() * 16, dur = 2.2 + Math.random() * 1.3;
    if (through === 'water') d = filt('lowpass', 520, 0.8, d);
    tone(d, f, f * 0.74, dur, 0.34 * vol, 'sine', 0, dur * 0.35); tone(d, f * 2, f * 1.42, dur * 0.9, 0.16 * vol, 'triangle', 0.08, dur * 0.3); tone(d, f * 3.02, f * 2.2, dur * 0.7, 0.05 * vol, 'sawtooth', 0.15, dur * 0.3);
    hiss(d, dur * 0.8, 'bandpass', 300, 1.5, 0.12 * vol, 0.1, dur * 0.3, 160);
  };
  S.pass = function (x, z, vol, through) {                          // her bulk going by: the water pushed in front of her
    var dest = through === 'glass' ? N.glassG : through === 'water' ? N.out : N.wet, d = pan(x, z, dest), dur = 1.4 + Math.random() * 0.8;
    hiss(d, dur, 'lowpass', 180, 0.8, 0.5 * vol, 0, dur * 0.45, 420); hiss(d, dur * 0.7, 'bandpass', 700, 0.9, 0.08 * vol, dur * 0.2, dur * 0.3);
  };
  S.bump = function (x, z, vol) {                                   // her nose against the glass: a dull knock, and the glass rings low after it
    var d = pan(x, z, N.in); tone(d, 70, 38, 0.5, 0.4 * vol, 'sine'); hiss(d, 0.3, 'lowpass', 220, 0.8, 0.3 * vol); tone(filt('bandpass', 140, 5, d), 140, 128, 1.6, 0.06 * vol, 'sawtooth', 0.04, 0.2);
  };
  S.slap = function (x, z, vol) {                                   // water slapping on steel and glass under the walk
    var d = pan(x, z, N.in); hiss(d, 0.18, 'bandpass', 900 + Math.random() * 700, 1.2, 0.12 * vol); hiss(d, 0.4, 'lowpass', 500, 0.7, 0.06 * vol, 0.05);
  };
  S.bubbles = function (vol, n) {                                    // under the surface: air going up past your ears
    for (var q = 0; q < (n || 6); q++) { var f = 300 + Math.random() * 700; tone(N.out, f, f * (1.6 + Math.random()), 0.04 + Math.random() * 0.05, 0.05 * vol, 'sine', Math.random() * 0.6); }
  };
  S.plunge = function () {                                           // going in from a height: the hit, the roar of it closing over you
    if (!S.on) return; hiss(N.out, 0.35, 'lowpass', 2400, 0.7, 0.6, 0, 0.005, 400); hiss(N.out, 1.6, 'lowpass', 300, 0.8, 0.5, 0.05, 0.05, 120); tone(N.out, 60, 30, 0.8, 0.35, 'sine'); S.bubbles(1.4, 14);
  };
  S.surface = function () { if (!S.on) return; hiss(N.in, 0.5, 'bandpass', 1400, 0.8, 0.18, 0, 0.01); hiss(N.in, 0.9, 'highpass', 2600, 0.7, 0.07, 0.05); S.bubbles(0.6, 4); };

  // ---------- every frame ----------
  var V = function (k, v, tc) { if (beds[k]) set(beds[k].gain, v, tc); };
  function rnd(k, a, b) { ev[k] = a + Math.random() * (b - a); }
  S.step = function (dt, inCine) {
    if (!Sound.ctx) return;
    var cp = camera.position, inAQ = inRect(cp.x, cp.z, AQ, 1) && !(state === 'menu');
    if (!inAQ) { if (S.on) { off += dt; if (off < 0.05) { set(N.out.gain, 0, 0.3); Sound.muffle(0); Music.duck = 1; } if (off > 2.5) teardown(); } return; }
    if (!S.on) build(); off = 0; t += dt;
    var st = P && P.aq, B = ples, y = cp.y, inTank = cp.x > T.x1 && cp.x < T.x2 && cp.z > T.z1 && cp.z < T.z2, under = inTank && y < T.water - 0.08;
    var zone = under ? 'under' : y < -0.6 || (cp.x > 139.4 && y < 2.6 && y > -9) ? 'base' : cp.x < 99.5 ? 'gal' : y > 6 ? 'upper' : 'hall';
    for (var z in zoneMix) zoneMix[z] = damp(zoneMix[z], z === zone ? 1 : 0, 2.2, dt);
    var hallK = zoneMix.hall + zoneMix.upper, near = clamp(1 - (cp.x - T.x1 + 2) / 14, 0, 1), dead = st && st.dead, pumpOn = st && st.pump, powerOut = st && st.fell && !st.power;
    // the reverbs: the hall's for the hall and the catwalks (and a little of it for the gallery, through the tunnel); the basement's for the basement
    set(N.hallS.gain, hallK * 0.62 + zoneMix.gal * 0.2, 0.4); set(N.baseS.gain, zoneMix.base * 0.5, 0.4);
    // the beds
    var bd = dist(cp.x, cp.z, (T.x1 + T.x2) / 2, 60), wv = 0.6 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1);
    V('hum', (zoneMix.hall * 0.05 + zoneMix.gal * 0.04 + zoneMix.base * 0.075 + zoneMix.upper * 0.045) * (powerOut ? 0.35 : 1));
    V('water', (zoneMix.hall * (0.14 + near * 0.16) + zoneMix.gal * 0.05 + zoneMix.base * 0.1) * wv, 0.6);
    V('lap', (zoneMix.upper * 0.06 + (st && inTank && !under && y < T.water + 2 ? 0.08 : 0)) * (0.55 + 0.45 * Math.sin(t * 0.9 + Math.sin(t * 0.31) * 2)), 0.3);
    V('plant', zoneMix.hall * 0.08 + zoneMix.upper * 0.06 + zoneMix.base * 0.12);
    V('pump', zoneMix.base * (pumpOn ? clamp(1.2 - dist(cp.x, cp.z, Aqua.pumpAt.x, Aqua.pumpAt.z) / 16, 0.18, 1) * 0.32 : 0.0));
    V('under', zoneMix.under * 0.3, 0.08);
    Sound.muffle(zoneMix.under); Music.duck = 1 - zoneMix.under * 0.85 - (hallK + zoneMix.base) * 0.3;
    if (under && !ev.wasUnder) S.bubbles(0.8, 5); if (!under && ev.wasUnder && inTank) S.surface(); ev.wasUnder = under;
    // the things that happen
    ev.drip = (ev.drip === undefined ? 1 : ev.drip) - dt;
    if (ev.drip <= 0 && !under) {
      rnd('drip', zone === 'base' ? 0.7 : 1.0, zone === 'gal' ? 3.2 : 2.6);
      var a = Math.random() * 6.28, r = 3 + Math.random() * 9, dx = cp.x + Math.cos(a) * r, dz = cp.z + Math.sin(a) * r;
      S.drip(dx, dz, 0.6 + Math.random() * 0.6, zone === 'upper' && Math.random() < 0.7);
    }
    ev.creak = (ev.creak === undefined ? 4 : ev.creak) - dt;
    if (ev.creak <= 0 && (zone === 'hall' || zone === 'base' || zone === 'gal')) { rnd('creak', 9, 22); S.creak(zone === 'hall' ? T.x1 : cp.x + 4, zone === 'hall' ? clamp(cp.z, T.z1, T.z2) : cp.z, zone === 'gal' ? 0.35 : zone === 'base' ? 0.7 : 0.6 + near * 0.5); }
    ev.knock = (ev.knock === undefined ? 3 : ev.knock) - dt;
    if (ev.knock <= 0 && zone === 'base') { rnd('knock', 5, 14); S.knock(cp.x + (Math.random() - 0.5) * 14, cp.z + (Math.random() - 0.5) * 14, 0.5 + Math.random() * 0.6); }
    ev.hang = (ev.hang === undefined ? 2 : ev.hang) - dt;
    if (ev.hang <= 0 && zone === 'upper') { rnd('hang', 3, 9); S.hanger(cp.x + (Math.random() - 0.5) * 10, cp.z + (Math.random() - 0.5) * 6, 0.6 + Math.random() * 0.6); if (Math.random() < 0.5) S.slap(cp.x + (Math.random() - 0.5) * 6, cp.z + (Math.random() - 0.5) * 6, 0.7); }
    // her
    if (B && !dead && plesMesh.visible) {
      var bdist = Math.hypot(B.x - cp.x, B.z - cp.z), thr = under ? 'water' : zone === 'upper' || inTank ? 'air' : 'glass', loud = clamp(1 - bdist / 26, 0.08, 1), sp = B.sp || 0;
      ev.call = (ev.call === undefined ? 6 : ev.call) - dt;
      if (ev.call <= 0 && zone !== 'base' && zone !== 'gal') { rnd('call', B.state === 'patrol' ? 13 : 7, B.state === 'patrol' ? 28 : 15); S.call(B.x, B.z, loud * (thr === 'glass' ? 1.4 : 0.9), thr); }
      else if (ev.call <= 0) { rnd('call', 16, 30); S.call(B.x, B.z, 0.5, 'glass'); }
      ev.pass = (ev.pass === undefined ? 0 : ev.pass) - dt;
      if (ev.pass <= 0 && sp > 1.2 && bdist < 13 && zone !== 'gal') { rnd('pass', 2.2, 4.5); S.pass(B.x, B.z, loud * clamp(sp / 3, 0.4, 1.2), thr); if (thr === 'air' && B.y > T.water - 1.6) S.slap(B.x, B.z, loud); }
      // her nose against the glass when she comes to look at you
      var gd = Math.min(Math.abs(B.x - T.x1), Math.abs(B.x - T.x2), Math.abs(B.z - T.z1), Math.abs(B.z - T.z2));
      ev.bump = (ev.bump === undefined ? 0 : ev.bump) - dt;
      if (ev.bump <= 0 && gd < 4.2 && bdist < 10 && zone === 'hall' && B.state === 'patrol') { rnd('bump', 7, 15); S.bump(B.x, B.z, 0.7); }
    }
  };
  return S;
})();
