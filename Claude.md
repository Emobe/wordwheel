# Word Wheel — Phase 0

See `Plan.md` for the full product plan. This file documents the repo as it
exists after Phase 0 (generator spike, section 19.0): pack builder, level
generator, and CLI tooling. No mobile app yet.

## Verification

When asked to verify something, give current evidence in that response: real
numbers, a real command run this turn, or a fresh screenshot. Referring back
to an earlier summary is not verification. If something hasn't actually been
re-checked, say so plainly rather than treating "already covered" as done.
Never state a measurement or number without having actually derived or
measured it; if it's an estimate, say estimate.

## Layout

```
packages/core     Pure TypeScript: types, seeded RNG, trie, lemma/base-word
                   heuristic, crossword layout, difficulty scoring, generator.
packages/tools    Bun scripts: SCOWL pack builder, pool generator, ASCII
                   debug printer, variety/difficulty report.
data/build/       Generated packs and pools. Gitignored, reproducible from tools.
.tmp-scowl/       Local SCOWL checkout used as the pack builder's input. Gitignored,
                   not fetched by any script yet — see "Getting a SCOWL checkout" below.
```

`core` has no I/O and no UI code: it runs on the PC (tools, tests) today and
will run inside the Expo app later without changes.

## Commands

Run from the repo root (Bun workspaces):

```
bun install
bun run build-pack                                   # writes data/build/packs/en.json
bun run generate -- --band 3 --count 1000 --seed en-band3
                                                       # writes data/build/pools/en/band3.json
bun run report -- data/build/pools/en/band3.json      # variety + difficulty histogram
bun run ascii -- data/build/pools/en/band3.json --sample 5
bun test                                              # packages/core unit tests
bun run typecheck                                     # tsc -b, project references
```

`generate` accepts `--band` (1-5, see `packages/core/src/config.ts`), `--count`,
`--seed` (any string, hashed into the RNG seed), and `--out` (defaults to
`data/build/pools/<lang>/band<N>.json`). Same band + count + seed always
produces the same pool — the RNG is seeded (`packages/core/src/prng.ts`,
mulberry32), never `Math.random`.

### Getting a SCOWL checkout

The pack builder reads word lists from a local SCOWL "final" directory
(`.tmp-scowl/final` by default, or pass a path as the first argument). This
repo does not download SCOWL for you; get a copy from
http://wordlist.aspell.net/ (or the `scowl` package on your system) and point
`build-pack` at its `final/` subdirectory. SCOWL's license (see its
`Copyright` file) permits use, modification, distribution and sale provided
the copyright notice is kept — the pack builder copies that notice into
`data/build/packs/en.json`'s `license` field for a future credits screen.

## Word pack (`data/build/packs/en.json`)

Built from SCOWL's `english-words`, `american-words` and `british-words`
lists (both American and British spelling, per Plan.md section 4), sizes 10
through 95:

- **`accepted`** (435k words): every SCOWL size, letters-only, length ≥ 3.
  This is the bonus-word dictionary — deliberately as large as SCOWL allows.
- **`gridWords`** (67k words): sizes up to 80 only, length 3-7 (the wheel
  size range). Each entry carries its SCOWL size as a commonness `rank`
  (lower = more common); this is what the generator and difficulty scorer
  use as the rarity signal.
- Only the `-words` category of each variant is read. SCOWL also ships
  `-abbreviations`, `-proper-names`, `-upper` (capitalized common words),
  `-contractions`, `special-hacker`, `special-roman-numerals`, and several
  dialect variants (`canadian`, `australian`, `variant_1/2/3`, `british_z`,
  etc.) — none of that is pulled in. Plan.md section 4 doesn't specify which
  SCOWL categories to use, so this is a Phase 0 judgment call: proper nouns,
  abbreviations and roman numerals don't fit a common-word crossword, and
  the extra dialects are marginal for a Phase 0 spike.
- Words containing anything other than `a-z` are dropped entirely
  (`WORD_RE = /^[a-z]+$/` in `build-pack.ts`), which excludes SCOWL's
  possessives (`cat's`) and contractions outright rather than stripping the
  punctuation. A wheel has no apostrophe tile, so these could never be
  spelled anyway.
- The 435k/67k split (`ACCEPTED_MAX_SIZE = 95`, `GRID_MAX_SIZE = 80` in
  `build-pack.ts`) is also a Phase 0 choice, not specified by the plan:
  accepted takes every SCOWL size so "any real word spellable from the
  wheel counts as a bonus" (section 1's stated pain point #2), while grid
  words stop one tier short of the most obscure/archaic words so required
  words stay reasonably recognizable even at band 5.
- **`baseMap`**: word → base word (e.g. `cats` → `cat`, `running` → `run`),
  built by `packages/core/src/lemma.ts`. This is a **heuristic**
  suffix-stripping lemmatizer, not a real morphological analyzer — see the
  doc comment in that file for what it does and doesn't catch. It tries every
  matching suffix rule (including a doubled-consonant strip for `-ing`/`-ed`,
  e.g. `stopped` → `stop`) and keeps the shortest candidate that's actually
  in the dictionary; it only links a form to a base that's also in the
  dictionary, so irregular forms (mice/mouse, went/go) are not linked, and a
  handful of coincidental suffix matches are possible. Good enough for Phase
  0's "no two forms of one word in a grid" rule; revisit before relying on it
  for anything user-facing (e.g. bonus word grouping).

The word pack is currently a 10.7 MB JSON file. That's fine for tools running
on a PC but is **not** a shippable mobile format — see "Known gaps" below.

## Generator (`packages/core/src/generator.ts`)

Implements Plan.md section 7:

1. Pick a wheel word from `gridWords`, filtered to the band's wheel-size
   range and a max commonness rank.
2. Find every accepted word spellable from the wheel via
   `packages/core/src/trie.ts` — a trie DFS over the wheel's letter
   multiset, not a full dictionary scan, so this stays fast regardless of
   dictionary size.
3. Intersect with `gridWords`, dedupe by base word (keeping the most common
   surface form; the wheel word always wins its base's slot), and sample a
   count within the band's grid-word range.
4. Lay out the grid (`packages/core/src/layout.ts`): longest word first,
   then each subsequent word must cross an already-placed word (perpendicular
   only — same-direction overlap is always rejected, since two words sharing
   cells in the same direction would be indistinguishable on the grid).
   Backtracks on failure, bounded by a node-count cap so a bad seed can't
   hang. Scores layouts by compactness and crossing count.
5. Validates: every grid word spellable from the wheel (guaranteed by
   construction), grid connected, no accidental words formed by adjacent
   tiles (`findAccidentalWords`, checked against the full accepted trie),
   one form per base word (guaranteed by the dedupe in step 3), grid within
   the section 8 size limits.
6. Scores difficulty (`packages/core/src/difficulty.ts`) from wheel size,
   grid size, word count, rarity, rare/doubled letters, crossing density,
   and word-form count. Weights are a first pass — the plan's difficulty
   *curve* (level number → target score) is a separate config layer to add
   in a later phase; this only scores a single level.

Retries with a new random wheel word/selection on any validation failure, up
to `config.maxAttemptsPerLevel` (default 200).

`bonusWords(pack, trie, level)` (same file) gives the app-side half of
section 7's "bonus words are worked out in the app from the accepted
dictionary, not stored in level files": every accepted word spellable from
the level's wheel, minus the words already required in the grid.

## Results against the Phase 0 gate

Measured with `bun run generate` + `bun run report`, seeds `en-band<N>`:

| Band | Wheel | Count | Success rate | Avg time/level |
|---|---|---|---|---|
| 1 | 3-4 | 500 | 100% | 12.1 ms |
| 2 | 4-5 | 500 | 100% | 13.7 ms |
| 3 | 5-6 | 1000 | 100% | 18.0 ms |
| 4 | 6-7 | 500 | 100% | 18.0 ms |
| 5 | 7 | 500 | 100% | 40.6 ms |

Difficulty rises band-to-band as intended. Band 3 at 1000 levels: 4,313
distinct grid words by base word, 934 distinct wheels (93.4%), all levels
within their size limit, difficulty histogram roughly bell-shaped
(78-139, avg 118.3). No accidental-word or connectivity violations found in
any generated pool. Pack load (JSON parse + trie build) takes ~350-470 ms
on this machine — see "Known gaps."

Regenerate these numbers with the commands above; nothing here is cached or
hand-edited.

## Known gaps / spike-list follow-ups (section 20)

Checked in this phase:
- **SCOWL license**: permissive (use, modify, distribute, sell; keep the
  copyright notice), confirmed from `.tmp-scowl/Copyright`. Fine to ship.
- **Dictionary load time/format**: 10.7 MB JSON, ~350-400 ms to parse +
  build a trie on this PC. Not measured on-device. Before Phase 1/2 ships
  this to a phone, this needs either a smaller/tiered pack (the `accepted`
  list doesn't need to be one flat 435k-word array on-device — e.g. load a
  common-word tier eagerly and the rest lazily) or a more compact format
  than JSON (e.g. a serialized trie/DAWG, or a packed binary). Not solved
  here — flagged for whoever picks up mobile pack loading.

Not relevant yet (no mobile app): Bun workspaces + Metro resolution, EAS
Bun detection, Reanimated/gesture performance, Unicode normalization for
non-English packs.

## Decisions that deviate from, or aren't yet in, Plan.md

- **`DifficultyBand.minLevel`/`maxLevel` are defined but unused.**
  `packages/core/src/config.ts` carries the level-range shape from section
  10's band table, but nothing reads it: `generate` takes `--band` directly
  on the command line, because section 9's "choosing the next level" (level
  number → band → pool → candidate ranking) doesn't exist yet — there's no
  player or progression concept in Phase 0, just per-band pool generation.
  Wire this up when section 9 is built.
- **The difficulty *curve* config (level number → target score) doesn't
  exist.** `difficulty.ts` only scores a single generated level from its
  own structure/rarity/letters/crossings/forms; mapping a level number to a
  target score, and picking pool candidates against it, is section 9/10
  territory for a later phase.
- **`requiresFullWheelWord` is hardcoded `true`.** The wheel word is always
  placed in the grid. The plan lists "whether the full-wheel word is
  required" as a structural difficulty knob that could vary by band —
  not implemented; every level currently requires it.
- **Coin words are never marked.** `GridWordPlacement.coins` is always
  `false`. Section 7 step 5 says marking one grid word as a coin word is
  optional, and section 13 says coin words are off by default in config
  anyway, so this matches the spec, but there's no code path that could
  turn it on yet either.
- **The base-word map is built over the full `accepted` list (435k words),
  not just `gridWords`.** A grid word's base can therefore resolve to a
  word that's a real dictionary word but not itself grid-eligible (e.g. too
  rare or too long) — that's fine for the "no two forms in one grid" rule
  (which only needs the base as a dedupe key), but don't assume every value
  in `baseMap` is a valid grid word if reusing it elsewhere.
- Coin words, chapters, translations, economy, save/sync, ads/purchases,
  everything in Plan.md sections 11-18 — out of scope for this phase, not
  started.

## Workspace note (Windows)

`packages/tools` imports from `packages/core` via **relative paths**
(`../../core/src/...`), not the `@word-wheel/core` package name. Bun's
workspace linking creates `node_modules/@word-wheel/core` as a symlink,
which requires Windows Developer Mode (or admin) to create; without it,
`bun install` silently succeeds but the symlink never appears and the
package-name import fails at runtime. Relative imports sidestep this
entirely. If a real npm-style workspace dependency is needed later (e.g. for
Metro resolving `@word-wheel/core` from `apps/mobile`), revisit this.

Run Android/Gradle builds with a generous timeout in the foreground rather than backgrounding them and polling for completion. Each check on a background process is a separate round trip, so blocking once and waiting for the real result is cheaper than checking repeatedly. Only background a command that genuinely needs to stay running, such as Metro or an emulator, and check on it a small, fixed number of times, not in a loop.