# Rules for working on Jurassic Massacre

These rules apply to everyone who changes the game: Petros, Daniel, Codex and Claude.

## Every change gets a Log Book entry

The game has a **Log Book** in the main menu and the pause menu. It lists every version and explains what changed. Its data is the `CHANGELOG` list at the top of `changelog.js`.

Whenever you change the game (a new feature, a fix, a tweak, anything that goes to `main`):

1. **Add a new entry at the top of `CHANGELOG`** in `changelog.js`. Never edit or delete older entries, except to fix a mistake in them.
2. **Give it a new version number, higher than the one before it.**
   - A small fix or a single change goes up by `.1`: `13.2` → `13.3`.
   - A big batch of new content starts the next whole build: `13.x` → `14`.
   - If someone else has already added an entry for this same batch and it hasn't gone to `main` yet, add to that entry instead of making a second one.
3. **Fill in every field:**
   - `v`: the version, as a string (`'13.3'`).
   - `date`: today, as `'YYYY-MM-DD'`.
   - `by`: who made the change (`'Petros'` or `'Daniel'`). Use the person's name, even when Codex or Claude did the editing.
   - `title`: a short name for the change, 2 to 6 words.
   - `notes`: one plain sentence per change, written for a player. Say what is different in the game, not which functions changed. Don't mention secret codes or the admin teleport code.
4. **Bump the cache buster** on every script tag you changed in `index.html` (`changelog.js?v=1` → `?v=2`, and the same for the other files). If you don't, players' browsers keep the old file.

The build number at the foot of the main menu is read from the newest entry, so you don't need to change it anywhere else.

## How the game is put together

- Plain three.js r128 with classic `<script>` tags that share globals. There are no modules and no build step.
- `index.html` lists the scripts in load order. Each `.js` file starts with a comment saying what it holds.
- Pushing to `main` publishes the live site on GitHub Pages about a minute later.
