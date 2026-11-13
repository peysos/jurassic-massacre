/* Jurassic Massacre — the menu panels (New Game, Controls, Settings) and the settings themselves.
   Panels open beside the main menu or the pause menu; Esc closes the open one.  Every setting is saved in prefs as it
   changes.  The graphics presets are defined in core.js (GFX) and applied by applyGfx(). */
'use strict';

var Settings = (function () {
  var S = { open: null };
  var SPEC = [['Resolution scale', function (G) { return Math.round(Math.min(window.devicePixelRatio || 1, G.pr) * 100) + '%'; }],
    ['Anti-aliasing', function (G) { return G.msaa ? 'MSAA 4×' : 'Off'; }],
    ['Flashlight shadows', function (G) { return G.shadow ? G.shadow + ' px' + (G.shadow >= 1024 ? ' · soft' : '') : 'Off'; }],
    ['Bloom', function (G) { return G.bloom ? 'On' : 'Off'; }],
    ['Dynamic lights', function (G) { return G.lights + ' at once'; }],
    ['Draw distance', function (G) { return G.far + ' m'; }],
    ['Undergrowth', function (G) { return Math.round(G.veg * 100) + '%'; }]];

  function panel(id) { return $(id); }
  S.show = function (id) {
    ['pNew', 'howto', 'settings'].forEach(function (p) { if (p !== id) panel(p).classList.remove('show'); });
    var el = panel(id), on = !el.classList.contains('show');
    el.classList.toggle('show', on); S.open = on ? id : null;
    each('.nav button', function (b) { b.classList.remove('on'); });
    if (on) {
      var cls = id === 'pNew' ? null : id === 'howto' ? '.btnHow' : '.btnSettings';
      if (id === 'pNew') $('btnNew').classList.add('on'); else each((state === 'paused' ? '#pause ' : '#menu ') + cls, function (b) { b.classList.add('on'); });
      if (id === 'settings') S.sync();
    }
  };
  S.close = function () { if (!S.open) return false; S.show(S.open); return true; };

  function setRange(id, v, fmt) { var r = $(id); r.value = v; r.style.setProperty('--p', ((v - r.min) / (r.max - r.min) * 100) + '%'); r.nextElementSibling.textContent = fmt(v); }
  function tgl(id, on) { $(id).classList.toggle('on', !!on); }
  S.sync = function () {
    var G = GFX[gfxName];
    each('#gfxSeg button', function (b) { b.classList.toggle('sel', b.getAttribute('data-g') === gfxName); });
    $('gfxSpec').innerHTML = SPEC.map(function (r) { return '<span>' + r[0] + '</span><b>' + r[1](G) + '</b>'; }).join('');
    setRange('sVol', Math.round(prefs.vol * 100), function (v) { return v + '%'; });
    setRange('sMusic', Math.round(prefs.music * 100), function (v) { return v + '%'; });
    setRange('sSens', Math.round(prefs.sens * 100), function (v) { return (v / 100).toFixed(2) + '×'; });
    setRange('sFov', Math.round(prefs.fov), function (v) { return v + '°'; });
    setRange('sBob', Math.round(prefs.bob * 100), function (v) { return v + '%'; });
    tgl('sMute', prefs.muted); tgl('sInvert', prefs.invert); tgl('sFull', !!document.fullscreenElement); tgl('sFps', prefs.fps);
  };

  S.init = function () {
    // tabs
    each('#settings .tabs button', function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-t');
        each('#settings .tabs button', function (o) { o.classList.toggle('sel', o === b); });
        each('#settings .tab', function (o) { o.classList.toggle('show', o.getAttribute('data-t') === t); });
      };
    });
    each('#gfxSeg button', function (b) {
      b.onclick = function () { var g = b.getAttribute('data-g'); if (g === gfxName) return; applyGfx(g); S.sync(); };
    });
    function range(id, fn) { $(id).addEventListener('input', function () { fn(+this.value); S.sync(); }); $(id).addEventListener('change', savePrefs); }
    range('sVol', function (v) { prefs.vol = v / 100; Sound.setVolume(); });
    range('sMusic', function (v) { prefs.music = v / 100; });
    range('sSens', function (v) { prefs.sens = v / 100; });
    range('sFov', function (v) { prefs.fov = v; if (state === 'playing' || state === 'paused') { camera.fov = v; camera.updateProjectionMatrix(); } });
    range('sBob', function (v) { prefs.bob = v / 100; });
    $('sMute').onclick = function () { Sound.setMuted(!prefs.muted); S.sync(); };
    $('sInvert').onclick = function () { prefs.invert = !prefs.invert; savePrefs(); S.sync(); };
    $('sFps').onclick = function () { prefs.fps = !prefs.fps; savePrefs(); document.body.classList.toggle('showfps', prefs.fps); S.sync(); };
    $('sFull').onclick = function () { toggleFullscreen(); setTimeout(S.sync, 300); };
    document.addEventListener('fullscreenchange', function () { if (S.open === 'settings') S.sync(); });
    document.body.classList.toggle('showfps', prefs.fps);
    each('.btnHow', function (b) { b.onclick = function () { S.show('howto'); }; });
    each('.btnSettings', function (b) { b.onclick = function () { S.show('settings'); }; });
    each('.panel .pclose', function (b) { b.onclick = function () { S.close(); }; });
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Escape' && S.open && (state === 'menu' || state === 'paused')) { e.preventDefault(); e.stopPropagation(); S.close(); }
    }, true);
  };
  return S;
})();
