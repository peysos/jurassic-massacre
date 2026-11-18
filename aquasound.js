/* Jurassic Massacre — the aquarium mix. Source recordings come from ElevenLabs (see the sound manifest).
   The player hears the tank through glass, through air, or from underwater. The shared master handles menu volume. */
'use strict';

var AquaSound = (function () {
  var S = { on: false }, submerged = 0, drip = 3.2, call = 7.5, strain = 11;
  function source(name, x, z, volume, range, rate) {
    return Sfx.at(name, x, z, { vol: volume, reach: range, rate: rate });
  }
  var loops = { aqAmbHall: 'aq_hall', aqAmbBase: 'aq_plant', aqAmbWater: 'aq_water', aqAmbPump: 'aq_motor', aqAmbLeak: 'aq_hiss', aqlift: 'aq_lift' };
  S.stop = function () {
    for (var id in loops) {
      var loop = Sfx.loops[id];
      if (loop) { loop.stop(0.12); delete Sfx.loops[id]; }
    }
    S.on = false; submerged = 0; Sound.muffle(0); Music.duck = 1;
  };
  S.step = function (dt, inCine) {
    if (!Sound.ctx) return;
    var c = camera.position, t = POOL, st = P.aq;
    S.on = (inCine || state === 'playing') && inRect(c.x, c.z, AQ, 1.5);
    var base = S.on && c.y < 1.7 && c.x > 134.45, hall = S.on && !base;
    var wet = hall && c.x > t.x1 && c.x < t.x2 && c.z > t.z1 && c.z < t.z2;
    submerged = damp(submerged, wet ? clamp((t.water + 0.16 - c.y) / 0.48, 0, 1) : 0, 7, dt);
    Sound.muffle(submerged); Music.duck = 1 - submerged * 0.72 - (hall || base ? 0.16 : 0);
    Sfx.zone('aqAmbHall', 'aq_hall', hall ? 0.31 * (1 - submerged) : 0);
    Sfx.zone('aqAmbBase', 'aq_plant', base ? 0.38 : 0);
    Sfx.zone('aqAmbWater', 'aq_water', wet ? 0.49 * submerged : 0);
    var pump = base && st.pump ? clamp(1 - dist(c.x, c.z, Aqua.pumpAt.x, Aqua.pumpAt.z) / 10, 0, 1) : 0;
    var leak = pump && !Aqua.ready() ? clamp(1 - dist(c.x, c.z, Aqua.maniAt.x, Aqua.maniAt.z) / 7, 0, 1) : 0;
    Sfx.zone('aqAmbPump', 'aq_motor', pump * pump * 0.46);
    Sfx.zone('aqAmbLeak', 'aq_hiss', leak * leak * 0.41);
    if (!S.on) return;
    drip -= dt; call -= dt; strain -= dt;
    if (drip <= 0) {
      drip = 3.5 + Math.random() * 5;
      source('aq_drip', c.x + 2.5, c.z - 4.5, base ? 0.35 : 0.21, 20, 0.9 + Math.random() * 0.16);
    }
    if (!st.dead && call <= 0 && c.x > HALL.x1) {
      call = 8 + Math.random() * 9;
      source('aq_call', ples.x, ples.z, wet ? 0.62 : base ? 0.32 : 0.56, 34, 0.89 + Math.random() * 0.13);
    }
    if (strain <= 0) {
      strain = 11 + Math.random() * 9;
      source('aq_strain', c.x - 4, c.z + 1, base ? 0.4 : 0.18, 24, 0.87 + Math.random() * 0.18);
    }
  };
  return S;
})();
