/* Jurassic Massacre — the Log Book: every version of the game and what changed in it.
   CHANGELOG is the one place the version number lives.  The newest entry (the first) is the build shown at the foot of
   the main menu, and the whole list is shown in the Log Book panel beside the main and pause menus.

   RULE (see AGENTS.md): every change that goes to main adds a new entry at the TOP of this list, with a new version
   number, the date, a short title and plain notes a player can follow.  Small fixes go up by .1 (13.1 → 13.2); a big batch
   of new content starts the next whole build (13.x → 14). */
'use strict';

var CHANGELOG = [
  { v: '13.3', date: '2026-11-17', by: 'Petros', title: 'Field Guide removed',
    notes: [
      'The Field Guide is gone from the main menu and the pause menu.'
    ] },
  { v: '13.2', date: '2026-11-17', by: 'Petros', title: 'The Log Book',
    notes: [
      'A Log Book in the main menu and the pause menu lists every version of the game and explains what changed in it.',
      'The build number at the foot of the menu now comes from the newest Log Book entry.',
      'A NEW mark appears beside the Log Book until you have read the latest entry.'
    ] },
  { v: '13.1', date: '2026-11-17', by: 'Petros', title: 'The aquarium gallery',
    notes: [
      'The tank gallery in the aquarium is filled with reconstructed prehistoric sea animals behind the glass.',
      'The plesiosaur\'s death pose stays inside her tank instead of poking through it.'
    ] },
  { v: '13', date: '2026-11-14', by: 'Daniel', title: 'Killing her, and the catwalk maze',
    notes: [
      'The aquarium catwalks are now a maze on two levels, with breaks, barriers, ladders and five refuges.',
      'Ladders are climbed hand over hand on real rungs, with your boots on the rungs below.',
      'The fall is rebuilt: you catch the edge, hang, slip as your fingers peel off, and drop into the water, then surface slowly with water on the lens.',
      'The plesiosaur swims the whole time instead of jumping about. Her strikes are telegraphed, chosen out of sight and never pass through a walkway.',
      'You can kill her in three steps under pressure: drop the isolator into the water, charge the spring with five strokes, then haul the lever. She dies by long electrocution, and there is a divers\' cage.',
      'The aquarium has its own soundscape (hall and basement echoes, hum, water through the glass, creaks, drips, pumps and her calls) and a more real-looking tank.',
      'One Ranger Net kiosk at every save point. Saving is a card swipe with a two-note beep.',
      'Real ranger boots and cargo trousers, and a door kick that drives the boot into the door.',
      'Manifold couplings with T-handles you grip and turn. The lift runs in a closed shaft.',
      'Performance brought back to Build 12 levels.'
    ] },
  { v: '12', date: '2026-11-13', by: 'Daniel', title: 'The aquarium and the Welcome Center',
    notes: [
      'The aquarium is rebuilt: a tank gallery, the ocean hall with its huge glass tank, staff stairs, a basement, a lift, catwalks, the fall and her kill.',
      'The Welcome Center opens on the plaza: guest services, first aid, lost property and a staff store, and the plaza is furnished.',
      'Kills end on the animal instead of an overlay, and nothing stands in or reaches through a wall.',
      'The battery reload is rebuilt: the tail cap flips up and the cell is pinched between finger and thumb and twisted home.',
      'The road barricade is a standing A-frame. Spare cells on the HUD are in the park\'s gold.',
      'Performance brought back to Build 11 levels.'
    ] },
  { v: '11', date: '2026-11-13', by: 'Petros', title: 'The wetland and the Spinosaurus',
    notes: [
      'The fuse hunt is replaced by the wetland behind the Visitor Center: three pools, three sluice gates, a mill turbine, a flood-control board and a Spinosaurus that follows the fish.',
      'The Visitor Center is overgrown with ivy, vines and moss.',
      'A new Pteranodon with fur, a long beak and crest, and boned wings.',
      'The dead head keeper is a proper slumped figure, with a blood trail, a clipboard, a dropped radio and handprints leading to him.',
      'In the aviary, the key cage hangs from a trolley that Winch C rolls over the pedestal before lowering it.',
      'Five more fossils for the Fossil Log: amber, a dinosaur egg, a T. rex tooth, a fern frond and a Spinosaurus claw.',
      'A tester\'s teleport for jumping to points in the game.'
    ] },
  { v: '10.5', date: '2026-11-13', by: 'Daniel', title: 'Hands, keys and the break room',
    notes: [
      'Yellow outlines show what you are aiming at (breakers, ports, buttons, leads).',
      'Keys hang on the cabinet by their rings. Picking one up spins it on your finger before it goes in your pocket.',
      'Doors are pushed open with a flat palm.',
      'The break room gets raptor prints to a torn ceiling vent, a sparking cable, claw marks and more.',
      'New yellow VOLTA batteries resting on counters, desks and tables, in 13 new spots.',
      'The diesel pour no longer twists the wrist.'
    ] },
  { v: '10', date: '2026-11-13', by: 'Daniel', title: 'The staff wing and ZooOS',
    notes: [
      'A STAFF ONLY door behind the gift shop leads to a bloody break room and the network puzzle: fix the battery backup and two loose patch leads.',
      'The staff computer is a working desktop drawn on the screen itself, with a pointer, windows, a start menu and the Entry Control program.',
      'The turnstiles are rebuilt as real units.',
      'Stamina lasts about ten seconds and running slows as it runs out, with breathing and gasps. New flashlight and stamina HUD.',
      'Recorded sound effects and voices.'
    ] },
  { v: '9', date: '2026-11-12', by: 'Daniel', title: 'Settings and a new menu',
    notes: [
      'A Settings page with Low, Medium, High and Ultra graphics, plus audio, controls and display options.',
      'The freezes are fixed.',
      'A new menu layout.',
      'A more natural intro walk, and arms with elbows instead of floating hands.',
      'The entrance plaza is rebuilt with walls, hedges, a fountain, benches and banners.',
      'An illustrated park map on the boards and on M.'
    ] },
  { v: '8', date: '2026-11-11', by: 'Petros', title: 'The aviary and the Field Guide',
    notes: [
      'The aviary\'s keycard gate and the dead keeper who still has the card.',
      'The raptor paddock kill with the pack feeding on it, and rotting raptors.',
      'Zoo details: information boards, food kiosks, portable toilets, a playground, bones and crows.',
      'The Field Guide.',
      'Blood underfoot is loud and draws dinosaurs on every difficulty. A new pterosaur kill.'
    ] },
  { v: '7', date: '2026-11-11', by: 'Petros', title: 'Fossils',
    notes: [
      'Fossils to find around the park, kept in the Fossil Log.',
      'Kill scenes end with you being eaten, then black.',
      'Simpler paddock levers, plus fixes to the plesiosaur and to flickering.'
    ] },
  { v: '6', date: '2026-11-10', by: 'Daniel', title: 'The opening',
    notes: [
      'An opening cutscene: walk up the road, swipe the staff card and watch the gate open.',
      'Gloved first-person hands holding the flashlight.',
      'A new entrance with the gift shop as the first safe room, the generator puzzle and the staff computer.',
      'Kill sequences and a new HUD with a compass.'
    ] },
  { v: '1–5', date: '2026-11-10', by: 'Petros', title: 'The park opens',
    notes: [
      'The first version put online: explore the dark dinosaur zoo with a flashlight, find the five master-key pieces and escape the lockdown.'
    ] }
];

var LogBook = (function () {
  var L = {}, SEEN_KEY = 'jm_logbook_seen';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(d) { var p = d.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function seen() { try { return localStorage.getItem(SEEN_KEY); } catch (e) { return null; } }

  L.latest = CHANGELOG[0].v;

  function badge() {
    var fresh = seen() !== L.latest;
    var els = document.querySelectorAll('.logNew');
    for (var i = 0; i < els.length; i++) els[i].textContent = fresh ? 'New' : '';
  }

  L.render = function () {
    var box = document.getElementById('logList'); if (!box) return;
    box.innerHTML = CHANGELOG.map(function (e, i) {
      return '<article class="lb-entry' + (i === 0 ? ' latest' : '') + '">' +
        '<header><b>Build ' + esc(e.v) + '</b>' + (i === 0 ? '<i>Latest</i>' : '') +
        '<span>' + esc(fmtDate(e.date)) + (e.by ? ' · ' + esc(e.by) : '') + '</span></header>' +
        '<h4>' + esc(e.title) + '</h4>' +
        '<ul>' + e.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></article>';
    }).join('');
  };

  // called by Settings.show when the panel opens
  L.opened = function () {
    var b = document.querySelector('#pLog .p-body'); if (b) b.scrollTop = 0;
    try { localStorage.setItem(SEEN_KEY, L.latest); } catch (e) {}
    badge();
  };

  L.init = function () {
    var n = document.getElementById('buildNo'); if (n) n.textContent = 'Build ' + L.latest;
    var c = document.getElementById('logCount'); if (c) c.textContent = CHANGELOG.length + ' versions';
    L.render(); badge();
    var btns = document.querySelectorAll('.btnLog');
    for (var i = 0; i < btns.length; i++) btns[i].onclick = function () { Settings.show('pLog'); };
  };
  return L;
})();
LogBook.init();
