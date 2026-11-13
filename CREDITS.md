# Credits

## Music

- **Intro** (`music/intro.mp3`): "Lightless Dawn" by Kevin MacLeod (incompetech.com).
  Licensed under Creative Commons: By Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
  Trimmed to 96 seconds with fades; loudness normalised.

## Sound effects and voices

- The recorded sound effects in `audio/sfx/` (footsteps, breathing, the generator, doors, keys, the staff computer, the
  turnstiles, the gate and so on) and the voicemail on the break-room answering machine were generated with
  [ElevenLabs](https://elevenlabs.io) (sound effects and text-to-speech), then trimmed, filtered and levelled for the game.
  Every one has a synthesized fallback, so the game still sounds right if a file is missing.

## Code and art

Everything else in the game (models, textures, the synthesized sounds) is generated in code at load time.
three.js r128 is loaded from a CDN (MIT licence).
