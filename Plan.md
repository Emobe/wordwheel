# Word Wheel Game: Plan

Working title: TBD. Do not use "Wordscapes" or a lookalike name, and do not reuse its art, level data or word lists.

Last updated 28 September 2026. Section 21 lists known gaps between this plan and the code.

## 1. Goal

A mobile word-wheel crossword game: swipe letters on a wheel to fill a crossword grid. It fixes three problems with the game it is modelled on:

1. **Too small a word pool.** Levels draw on a much wider list of real words, so the same words come up far less often.
2. **Valid words rejected.** A large dictionary accepts every real word spellable from the wheel as a bonus word.
3. **Few languages.** Each language is a separate, self-contained word pack, and languages are never mixed.

## 2. Decisions

| Area | Decision |
|---|---|
| Platform | Android first. iOS later from the same code. |
| Stack | Expo (React Native) and TypeScript. Development builds, not Expo Go. |
| Tooling | Bun for packages, scripts, workspaces, tools and tests. Node LTS installed alongside for Expo CLI and Metro. |
| Repo | Bun workspaces monorepo. |
| Connectivity | Offline first. Progress syncs to a server later, when one exists. |
| Word languages | English at launch. More added as data packs. One language per session, never mixed. |
| App languages | Menus and UI text translated separately from word packs, set up from day one. |
| Progress | Separate per language. Each language starts at level 1. Coins shared. |
| Levels | Procedurally generated offline into pools. The phone picks the next level from a pool. |
| Grid size | Hard maximum width and height, slightly larger for levels with longer words, so every level fits and stays readable on a small phone. Currently 9 columns by 6 rows (section 8). |
| Difficulty | Every level has a score. The curve is a config file, adjustable without regenerating. |
| Economy | Coins, items and prices all in config. Everything free at launch. 10 coins per level to start. |
| Visuals | Flat colours from a theme file, with animations. No textures or images yet. |
| Ads and purchases | Built in behind switches, off at launch. |
| Analytics | Undecided. An interface with a do-nothing version for now. |
| Audience | Worldwide, all ages, general players. |
| Word filtering | Words are words. A blocklist hook exists but is empty. Revisit later. |
| Verification | Deferred for sync. Tournament scoring is server-side by design (section 22). |
| Server | Later. Self-hosted Nakama, local Docker first (section 22). |

## 3. Repo layout

```
packages/core     Pure TypeScript game logic: word packs, generator, rules, scoring, level selection, economy.
packages/tools    Bun scripts run on your PC: word pipeline, level pool generation, reports.
apps/mobile       Expo app: screens, theme, translations, animations, SQLite save, platform services.
data/build        Generated packs and pools. Gitignored. Reproducible from tools.
```

`core` has no UI code so it can run on the PC (tools, tests) and inside the app. A future server can reuse it.

All native and third-party calls (ads, purchases, consent, analytics, storage, time) go through a `PlatformServices` interface, so `core` and tests never touch native code and each service can be swapped or switched off.

## 4. Word packs

Each language is a self-contained pack. Nothing crosses between packs.

- **Tiles:** the letters for that language. Each tile is a Unicode string (a letter, accented letter or digraph). Never assume A to Z. Text is stored as Unicode NFC.
- **Accepted words:** a large dictionary. Any word in it that can be spelled from the wheel counts as a bonus word.
- **Grid words:** a deliberately wide list of real, recognisable words that levels are built from, each with a commonness rank.
- **Base-word map:** links forms like "cats" to "cat", used for variety and so a grid does not hold two forms of one word.
- **Blocklist:** a hook to exclude words from grids, bonus words or both. Empty for now.
- **Version number**, bumped whenever the pack changes.
- **Licence metadata** for every source, used to generate a credits screen.

Rules:

- The player picks a word language. The wheel, dictionary checks and levels for that session come from that pack only.
- Every level is tagged with its language and belongs to one pack only.
- Progress, seen-word history and difficulty position are stored per language.

### English sources

- SCOWL for the accepted dictionary and commonness tiers. Its licence allows use and sale if the copyright notice is kept. Accept both American and British spellings.
- Current English pack: 435,493 accepted words and 66,998 grid words.

### Later languages

- Candidate sources: Hunspell dictionaries, Wiktionary extracts, frequency lists. Licences differ per source, and share-alike terms may affect distribution in a paid app. Get a licence review before shipping any non-English pack.
- Per-language decisions: accent handling, casing rules, which digraphs are tiles, and the font needed to show every tile.

## 5. App languages

The app's text is separate from the word packs. A player can have Spanish words with English menus.

- All UI text goes through a translation layer from day one. No hardcoded strings in screens.
- The UI language follows the phone's language by default, with an override in settings.
- Chapter names and item names are translated too.
- English only at launch. Adding a UI language means adding a translation file.
- Layouts must cope with longer text in other languages. Right-to-left UI languages need a layout pass before they ship.

## 6. Word pool and variety

Repeats are not banned. The goal is a large enough pool that they feel rare.

- **The grid word list is the main lever.** It is set wide on purpose. The accepted dictionary stays larger still.
- **Difficulty controls how deep into the list levels reach.** Early levels use common words, so some repetition there is expected. Harder levels reach further in, which is where variety grows.
- **Variety is a soft preference when choosing a level**, not a rule. Candidates using words the player has not seen for a while score higher.
- **Variety is judged by base word**, so "cat" and "cats" count as the same word.
- **Measured before shipping:** the generator report shows distinct grid words and distinct wheels across 1,000 levels, so pool size changes can be compared.

## 7. Level generation

Runs offline in `packages/tools`, with the logic in `packages/core`. Deterministic from a seed (seeded random number generator, never `Math.random`).

1. Pick a wheel word of 4 to 7 tiles from the grid word list. Its tiles form the wheel.
2. Find every accepted word spellable from those tiles.
3. Choose grid words to hit a target difficulty.
4. Lay out the grid within the size limits (section 8): longest word first, then crossings with backtracking. Score layouts on compactness, number of crossings and shape. (Gap: the code currently returns the first valid layout rather than the best-scoring one. See section 21.)
5. If no layout fits the size limits, retry: try a different subset of grid words from step 3, then a different wheel word from step 1, before falling back to a smaller grid word count for that band. A shared node budget caps total layout search work per level across all retries. Batch generation has no time pressure, so retrying is cheap.
6. Optionally mark one grid word as a coin word (section 13).
7. Validate: every grid word spellable from the wheel, grid connected, no accidental words formed by adjacent tiles, blocklist check, at most one form of each base word in the grid, grid within size limits.
8. Save the level into the pool for the band it was generated for, with its difficulty score attached. Levels are generated per band, not sorted into bands by score afterwards.

This is more tractable than general crossword generation, because every grid word is spelled from the same wheel, so crossing letters are common by construction, the word set is chosen rather than fixed, and sparse layouts are normal for this genre rather than a failure. The generator report (Phase 0 gate) includes the retry rate, so a band that struggles to hit its size limit shows up before any levels ship.

The output is a **pool of levels per difficulty band per language**, far larger than anyone plays through. There is no fixed level 1, level 2 sequence. More pools can be downloaded later.

Bonus words are worked out in the app from the accepted dictionary, not stored in level files.

Level file shape:

```json
{
  "id": "en-b3-000123",
  "lang": "en",
  "packVersion": 1,
  "band": 3,
  "wheel": ["T","A","R","E","S"],
  "grid": {
    "cols": 7,
    "rows": 6,
    "words": [ { "w": "STARE", "x": 0, "y": 2, "dir": "H", "coins": false } ]
  },
  "difficulty": 37.5
}
```

Level IDs never change once published. Regenerating a pool creates new IDs, so play history stays valid.

## 8. Grid size limits

Every level must fit on a small phone without scrolling and stay readable. Nothing may come out tall and thin just because the words happen to fit that way.

Design target: a 360 by 640 dp portrait screen, a common compact Android size. The wheel takes the lower part of the screen, so the grid gets roughly the top half. For comparison, a typical Wordscapes grid is around 10 columns by 8 rows.

**Measured on device in Phase 1.** At true 360x640dp with the actual chrome (status bar, header, bonus line, word preview, shuffle button, margins) and the wheel at its 168dp floor, the grid area is 328x203dp. At the 28dp tile floor with 2dp gaps:

- 6 rows use 6 x 28 + 5 x 2 = 178dp of the 203dp, leaving 25dp spare.
- 7 rows need 208dp and clip by 5dp, so 6 rows is the hard ceiling at this screen size.
- Width is not the binding limit. 9 columns use 268dp of 328dp. 11 columns would fit the width exactly (328dp), but the shape rule below caps a 6-row grid at 9 columns, so the shape rule is what sets the column limit.

| Max columns | Max rows | Tile width on the 360 dp design target |
|---|---|---|
| 9 | 6 | about 28 dp |

One value for every wheel size, not scaled by wheel size. A single grid word placed vertically can use at most 6 tiles, so a 7-letter wheel word must be placed horizontally (9 columns comfortably covers it) and a second 7-letter word requiring vertical placement is out of scope: the generator rejects that layout and retries with a different word choice, rather than producing a grid that overflows.

Other limits:

| Setting | Value | Why |
|---|---|---|
| Shape | rows no more than 1.2 times columns, and columns no more than 1.6 times rows | Stops very tall or very wide grids. At 6 rows this caps columns at 9 |
| Min tile size | 28 dp on the design target | Readability floor |

This is smaller than the original two-tier estimate (10x9 / 11x10), which was based on tile size alone and didn't account for how much space the fixed UI chrome and the wheel actually take up. Grid size can grow later once this is tested on a second, larger device, since a bigger screen has more real budget to spend.

The grid budget must be re-measured whenever the game screen chrome changes. It has not been re-measured since the Phase 2 UI changes.

Rules:

- The generator rejects any layout outside these limits. They are checked in validation, not left to the app.
- The wheel word (4 to 7 tiles) must always be placeable horizontally, which 9 columns guarantees. A second word longer than 6 tiles placed vertically is not guaranteed to fit and is rejected rather than allowed to overflow.
- The app scales tiles to fill the available grid area on bigger screens, up to a maximum tile size so small grids do not look oversized.
- Letters on tiles scale with the tile size.
- If a limit changes, regenerate the pools. Old levels are never stretched to fit.

## 9. Choosing the next level (on the phone)

1. Work out the band from the player's level number using the band boundaries in config, and the target difficulty from the difficulty curve config.
2. Take candidates from that band's pool, ranked so unplayed levels come first, then the levels least recently played.
3. Among candidates at the same rank, rank further by closeness to the target difficulty and by how long since the player last saw their grid words and wheel.
4. Pick from the top few, with a little randomness so two players do not get identical runs and so replays do not happen in the same fixed order each lap.

The difficulty score ranks levels within a band's pool. It does not decide which band a level belongs to.

**Empty pool policy: confirmed.** There is no separate "pool exhausted" state. Once a player has played every level in a band's pool, step 2 starts surfacing the oldest-played levels instead of unplayed ones, so play continues without a break. Levels pay out coins on replay the same as on first play (section 13). Randomness in step 4 stops the replay order from being identical every lap.

This makes pool size a variety question, not a correctness one: a bigger pool delays when repeats start rather than being required to avoid a broken state. Band 4 (106-205) currently has a 100-level pool, so most players will start seeing repeats around the same time they finish the band. Worth a bigger pool for band 4 specifically once pool generation cost is checked (section 21), so repeats there feel as rare as the other bands.

## 10. Difficulty

Each level gets a numeric score from measurable features:

- **Structure:** wheel size, number of grid words, grid size, whether the full-wheel word is required.
- **Word rarity:** the rarest required word and the average rarity.
- **Letters:** rare letters, doubled letters, few vowels.
- **Crossings:** fewer crossings give away fewer letters, so harder.
- **Word forms:** how many plurals and other forms are required.

The **difficulty curve** is a config file that maps level number to a target score. It rises with easier levels mixed in after hard ones. It can be reshaped without regenerating levels.

Band boundaries are also config. The original boundaries (1-100, 101-400, 401-1200, 1200-3000, 3000+) were too slow, reaching full difficulty at level 3000. Replacement, **confirmed**:

| Band | Levels (proposed) | Wheel | Grid words | Rarest required word |
|---|---|---|---|---|
| 1 | 1-10 | 4 | 3-6 | most common |
| 2 | 11-30 | 4-5 | 6-10 | common |
| 3 | 31-105 | 5-6 | 8-14 | mid |
| 4 | 106-205 | 6-7 | 10-16 | uncommon |
| 5 | 206+ | 7 | 10-15 configured, 10-13 in practice | rare but valid |

Grid word counts are capped by the grid size limits in section 8. At 9x6, band 5 levels produce 10-13 words, which is why the configured maximum of 15 is not reached. The wheel minimum is 4 in every band.

Band 4 spans exactly 100 levels, so a 100-level pool has no slack there. See the empty pool policy in section 9.

The general player is the target: most people should get through a level without hints most of the time.

Later: a player setting (Relaxed, Standard, Hard) that shifts the target score. The design supports it from the start even if the setting ships later.

Calibration: before launch, a simulated player that knows words based on how common they are, checked against solve time and hint use. After launch, needs analytics (section 16).

## 11. Chapters

Levels are grouped into chapters for display, for example "Chapter name 10".

- Chapter length and names are in config, per UI language.
- Each chapter has its own colour palette from the theme file. Backgrounds replace palettes later.
- Chapters are display only. Level choice still comes from the pools and the difficulty curve.

## 12. Screens

**Game screen**, top to bottom:

- Header: back, menu, chapter and level title, settings.
- Grid: empty slots, filled tiles, hinted tiles, and coin-word slots marked with a coin.
- Word preview: the word being spelled, shown above the wheel.
- Wheel: letter circles. Selected letters highlight, joined by the swipe line.
- Around the wheel: shuffle, hint button showing its cost, bonus words button, coin balance with a shop button.

**Other screens:**

- First-run tutorial: a few guided levels showing swiping, bonus words, shuffle and hints. (Currently a static walkthrough. Guided levels are not built.)
- Home: continue, language picker, settings.
- Language picker: word language, separate from UI language.
- Bonus words list: words found this level and overall.
- Shop: reads from the item catalog. Shows items and prices, all free at launch.
- Settings: UI language, sound, haptics, reduce motion, privacy and consent, credits.
- Level complete: coins earned, continue.

## 13. Economy

Everything is data, so items and prices can be decided later without code changes.

- **Wallet:** one coin balance, shared across languages.
- **Earning rules (config):** 10 coins per level completed to start, including replayed levels (section 9). Slots for bonus-word coins, coin words and daily rewards, set to 0 for now.
- **Coin words:** a grid word can be marked as worth extra coins, shown with coin symbols in its slots. Off by default in config.
- **Item catalog (config):** each item has an ID, type, coin price and an optional real-money product ID. Starting items: reveal a letter, reveal a word. Later: bees, cosmetics, remove ads.
- **Launch prices:** every coin price set to 0, so everything is free. Changing a price is a config change.
- **Inventory:** how many of each item the player owns.
- **Ledger:** every coin and item change goes through one function and is written to the change log (section 14). Nothing changes the balance directly. Rewards granted by a server (section 22) go through the same function.
- **Remote config later:** economy files can be downloaded, so prices can change without an app update.

## 14. Save, backup and future sync

- **SQLite on the phone.**
- **Current state:** per-language level number and settings, shared coins and inventory.
- **Change log:** each change (level completed, words found, coins or items gained or spent) is saved as a record with an ID, timestamp and a "synced" flag.
- **Seen history:** per language, when each base word and wheel was last seen.
- **Anonymous player ID** created on first install, so offline progress can attach to an account later.
- **Android Auto Backup:** saves app data to the user's Google Drive, up to 25 MB, including databases by default. Progress survives a reinstall or new phone before there is a server. Downloaded level pools go in a folder excluded from backup, since they can be downloaded again.
- **Versioning:** the save records which pack and pool versions the player has. Migrations run when the app updates.
- **Sync later:** upload unsynced records when online, the server merges them into the account and marks them done. Verification is designed at that point.

## 15. Visuals

- **Theme file** with named colour tokens: background, tile states, wheel, accent, text, and a palette per chapter. Light and dark versions.
- **Plain React Native views** for the grid, tiles and menus.
- **Reanimated** for animation: tiles filling when a word is found, wheel shuffle, the word moving from the preview into the grid, a shake on a wrong word, coins counting up, level complete.
- **Skia only for the swipe line** between letters.
- Tile states must not rely on colour alone. Add a reduce-motion setting.
- Fonts must cover every tile in every word pack and every UI language shipped.
- Textures, backgrounds and art come later and replace theme tokens rather than code.

Direction under consideration, nothing chosen: photo backgrounds with darkening, colours extracted per chapter, one rounded font, depth and motion in code, open-licence icons and sounds, possibly a commissioned app icon.

## 16. Ads, purchases and analytics

All behind `PlatformServices`, each with a do-nothing version, and each switched by config.

- **Ads (off at launch):** AdMob through `react-native-google-mobile-ads`. Rewarded ads for coins or hints, capped interstitials. Test ad unit IDs in development.
- **Purchases (off at launch):** RevenueCat, which also validates purchases before our own server exists. Products map to catalog items.
- **Consent:** a consent flow for EEA and UK users before the first ad request, needed once ads are on.
- **Analytics (undecided):** the game logs events such as level start, level complete, hint used, time taken and quit, through the interface. The do-nothing version discards them. Pick a provider later. Difficulty calibration after launch depends on this.

## 17. Audience and store compliance

- **All ages, worldwide.** On Google Play, any app whose target audience includes children must follow the Families Policy. For ads that means only certified ad SDKs for children and users of unknown age, or a neutral age screen, no interest-based ads to children, and ads closeable after 5 seconds. Settle this before ads are switched on. Any analytics provider must also be checked against it.
- **Privacy policy:** required by Play Console before the target audience section can be filled in. Needed before launch.
- **Content rating questionnaire:** answer it with the word list in mind, since bonus words are unfiltered for now.
- **Target API 36:** Google Play requires new apps and updates to target Android 16. Check the Expo SDK default `targetSdkVersion`. API 36 enforces edge-to-edge and changes back handling, so test on Android 16.
- **Closed test:** personal Play Console accounts created after November 13, 2023 must run a closed test with at least 12 testers opted in for 14 days before production. Recruit 14 or 15 so a dropout does not reset the clock.

## 18. Later, not now

- Server, tournaments, leagues and teams: full design in section 22.
- Pricing, item list, ads and purchases switched on.
- Analytics provider.
- Word filtering decisions.
- Meta layer: daily gift, bees as hints, tap-to-collect animals, collectibles. (Not built. Coin words and particle effects are also not built.)
- Word definitions on tap (licence check needed).
- iOS.
- Textures, backgrounds and art.
- More word languages and UI languages.

## 19. Phases

Each phase ends with a gate that must pass before the next starts.

0. **Generator spike (English).** Pack builder, generator with grid size limits, ASCII grid printout for checking (debug only), variety report, difficulty histogram over 1,000 levels. Gate: success rate, time per level, variety and difficulty curve look right, every level within limits.
1. **Feel prototype.** Expo development build on a real Android phone, ideally including a small, low-end one. Wheel, swipe line, word preview, grid, bonus words, shuffle, flat colours. Gate: smooth swipe, readable grid at the size limits, limits tuned.
2. **Game loop.** Level selection from pools, difficulty curve, chapters, SQLite save and change log, word language picker with per-language progress, translation layer, economy with free items, hints, animations, sound, haptics, tutorial, settings.
3. **Services spike.** Ads, purchases and consent working on a real device with test IDs, then switched off by config. Gate: each works end to end and each switch works. Status: ads and consent verified on a real phone. Purchases are built but unverified, blocked on a Play Console listing and a RevenueCat account.
4. **Play Store launch.** Privacy policy, target audience and content rating, listing, store graphics, data safety form, closed test if required, production. Deferred until the accounts in phase 3 exist.
5. **Then the "later" list,** in an order decided at that point. Server work follows its own gated steps S0 to S3 (section 22).

## 20. Spike list (unverified)

- Bun workspaces and Metro resolve `packages/core` correctly in the Expo app.
- EAS cloud builds detect Bun in the monorepo. A 2024 bug made EAS fall back to Yarn, so test a cloud build early.
- Reanimated and gesture handling performance on a low-end Android phone.
- Accepted dictionary load time and memory on the phone. Choose a compact format.
- Pool size needed per band, and its download size.
- Unicode normalisation and casing on the phone's JavaScript engine before any non-English pack.
- Current Expo SDK version and default `targetSdkVersion` when scaffolding.
- Licence review for every word source before shipping.
- Server spikes are listed at the end of section 22.

## 21. Known gaps between plan and code

- **Layout scoring.** Section 7 step 4 says layouts are scored, but `layoutGrid` returns the first valid layout. About 47% of band 4 and 37% of band 5 levels in a 1,000-level run had no redundant crossings (no loops). That is a shape measure, not a defect by itself. Define a bad layout first (for example a crossings floor for the word count, or a fill density threshold), then fix. Parked.
- **Pool size.** Bundled pools hold 100 levels per band, a placeholder (`mobile-fixtures.ts`). The 500 bundled levels total 395 KB, so about 2,000 band 5 levels would be about 2 MB uncompressed. With the proposed boundaries, band 4 is exactly 100 levels wide, so most players reach the pool's replay point (section 9) right around when they finish the band. Whether `packages/core` implements the replay-ranking in step 2 of section 9 is unchecked.
- **Tutorial.** Static walkthrough, not guided levels.
- **Grid budget.** Needs a re-measure after the Phase 2 UI changes.
- **Band boundaries.** Confirmed values in section 10 are not yet applied to config.
- **Grid config.** A reported change to 11 columns is not visible in generated levels. The effective ceiling is 9x6.
- **Difficulty score.** Attached after generation and used for ranking within a band, not for band assignment.
- **React warning** in GameScreen and Wheel (state set during render from onSelectionChange). Pre-existing.
- **Metro** can hang silently or serve a stale bundle after a restart. Check with curl on /status, restart with --clear.
- **Sound and haptics.** Confirmed firing for level complete and wrong selection. Word found not independently triggered.
- **Tests.** No property-based test library. Generator tests are a fixed-seed loop of 20 samples.
- **Purchases.** RevenueCat scaffold unverified.

## 22. Server and tournaments

Status: design only, nothing built. This is the first feature that needs a running server, so it adds hosting cost and operations work that the rest of the project does not have. Everything before it works offline.

### Build order

Each step ends with a gate that must pass before the next starts.

- **S0 Server foundation.** Nakama and its database running locally in Docker. Anonymous login from the app. One test call end to end. Gate: the app on the emulator and on a real phone can log in and call the server.
- **S1 Individual weekend tournament.** One tournament, one language, bucketed leaderboard, server-side scoring. Gate: a full simulated weekend runs start to finish, including bots filling sparse buckets.
- **S2 Leagues.** Persistent tiers with promotion and relegation each cycle. Gate: two full cycles run correctly with simulated players.
- **S3 Team tournaments.** Last. Needs its own design note before any work starts.

All three modes are wanted. This order puts the smallest slice first so the server, login and scoring are proven before anything with persistent state or social features is added.

### Hosting

- **Development:** Nakama and its database in Docker Compose on the dev machine. Free. The emulator and phone connect over the local network.
- **Production:** needs a host that is on all the time. A tournament runs across a whole weekend while players use the app whenever they like, so a dev machine that is sometimes off will not work. A small VPS is the realistic minimum. Not yet priced, check current prices before deciding.
- **Do not rent anything until S0 and S1 work locally.**
- **Database:** Nakama needs CockroachDB or another Postgres-compatible database. Heroic Labs publishes a Compose example using Postgres. Prefer Postgres on a small VPS to keep memory use down. Check the current Nakama docs for the supported version when starting.
- **Backups:** a scheduled database dump copied off the server. Losing tournament data mid-event is worse than not running one.
- **Managed hosting (Heroic Cloud)** is the fallback if self-hosting becomes too much work. Recurring cost.

### Server code language (open decision)

- **TypeScript:** can share code with `packages/core`. Nakama's JavaScript runtime is restricted (no Node libraries, limited language features), so shared code has to stay small and plain. Check current docs.
- **Go:** already used with Nakama in PirateTing. Compiled into a plugin built in Docker. The validator would be reimplemented in Go, which is small because it is an answer-key lookup, not the full dictionary.

Decide before S0 starts.

### Who can play (open decision)

- **Option A: unlock at full difficulty (band 5).** Everyone in a tournament has reached the same point. Cost: it hides the feature until band 5. Under the old boundaries that was level 3000. Under the proposed boundaries (band 5 from level 206, not yet confirmed) it is reached in roughly two to four weeks of daily play (estimate).
- **Option B: shared tournament levels.** Each event uses its own set of levels, identical for every entrant, generated offline like normal pools. Fairness comes from identical content, not from gating. Open to all players from the start.

Option B is recommended, since it gives an even field without any gate. Option A is more workable with the faster boundaries and could still be used to unlock leagues.

### Tournament levels and verification

- Tournament levels are generated offline and held on the server. The server sends each level when the event starts, so phones cannot solve them in advance.
- The server keeps an answer key per level: every valid word (grid words and bonus words). It does not need the full dictionary.
- The phone submits the words it found with timestamps. The server checks each against the key and works out the score itself. It never accepts a score from the phone.
- Levels have IDs, so submissions that claim more words than the level has, or completion times no person could reach, are rejected.
- Limit that cannot be removed: anyone can write an anagram solver, so this proves the words are valid, not that a person found them. Timing checks, small buckets and modest rewards limit the damage.
- Scoring rules (points per word, speed bonus) are undecided.

### Individual weekend tournament (S1)

- Fixed weekend window in UTC. One tournament per word language, since word counts differ.
- Bucketed leaderboards: players are grouped into small brackets so a new player can win. Bracket size is undecided.
- Sparse buckets are filled with simulated players, labelled as bots.
- Rewards are coins and items from the economy config, applied through the ledger (section 13). Entry is free.

### Leagues (S2)

- Persistent tiers, one cycle per week. Top players in a tier promote, bottom players relegate.
- Needs a scheduled end-of-cycle job and stored tier state per player.
- Tier count, promotion count and cycle length are undecided.

### Team tournaments (S3)

- Needs groups, invites, moderation and name filtering. Largest surface area of the three. Not scoped here.

### Accounts, names and child safety

- Anonymous login first, linkable to an account later. This is also the account the sync in section 14 attaches to. Use the anonymous player ID from section 14 as the login identity rather than a raw device ID, so both point at the same account.
- The audience is all ages worldwide. Free-text display names and any chat carry real child-safety and moderation risk. Use generated display names and no chat, at least at first.
- The server collects player ID, scores and a display name. Update the privacy policy, the data safety form and the Families Policy check (section 17) before any of it ships.
- Clearing app data creates a new anonymous account. A reinstall may restore the old ID through Auto Backup (section 14), which needs testing. Accept losing the account otherwise at first, revisit when accounts are added.

### Server spikes (unverified)

- The Nakama JavaScript client works in React Native on Hermes.
- Shared validation code runs in the server runtime, if TypeScript is chosen.
- Memory use of Nakama with Postgres on the smallest realistic VPS.
- Whether Nakama's built-in tournament and leaderboard features cover bucketed brackets, or whether brackets need custom code.
