import type { GeneratorConfig } from "./types.js";

/** Starting values from sections 8 and 10 of the plan. Tunable without regenerating. */
export const DEFAULT_CONFIG: GeneratorConfig = {
  bands: [
    { band: 1, minLevel: 1, maxLevel: 100, wheelMin: 3, wheelMax: 4, gridWordsMin: 3, gridWordsMax: 6, maxRarestRank: 20 },
    { band: 2, minLevel: 101, maxLevel: 400, wheelMin: 4, wheelMax: 5, gridWordsMin: 6, gridWordsMax: 10, maxRarestRank: 40 },
    { band: 3, minLevel: 401, maxLevel: 1200, wheelMin: 5, wheelMax: 6, gridWordsMin: 8, gridWordsMax: 14, maxRarestRank: 60 },
    { band: 4, minLevel: 1200, maxLevel: 3000, wheelMin: 6, wheelMax: 7, gridWordsMin: 6, gridWordsMax: 9, maxRarestRank: 80 },
    { band: 5, minLevel: 3000, maxLevel: 999999, wheelMin: 7, wheelMax: 7, gridWordsMin: 7, gridWordsMax: 10, maxRarestRank: 80 },
  ],
  // Phase 1 revision: the original 10x9 / 11x10 ceilings (Plan.md section 8's
  // own numbers) assumed the grid only had to share the screen with the
  // wheel. Measured live on a real 360x640dp device (Plan.md's own design
  // target) with the actual Phase 1 chrome (header label, bonus-words line,
  // word preview, wheel, shuffle button, margins) in place: gridArea's real
  // box is 328x203dp. At the 28dp tile floor and 2dp gaps, that's a hard
  // ceiling of 9 cols x 6 rows (30*9-2=268<=328 with room to spare; a 7th
  // row needs 30*7-2=208 > 203). Both tiers share this ceiling since the
  // available box doesn't change with wheel size — only gridWordsMin/Max
  // (see `bands` above) still scale grid *usage* by band.
  //
  // Known gap: Plan.md section 8 says the limits "must allow the longest
  // wheel word (7 tiles) in either direction" — 9 cols satisfies that
  // horizontally (the wheel word is always placed horizontally first, see
  // layout.ts), but 6 rows does not vertically. In practice this only
  // matters if a second, different 7-letter word also needs placing
  // vertically, which is rare and simply gets rejected/retried rather than
  // breaking anything. Flagged rather than silently accepted — a real
  // deviation from the letter of section 8, kept because Plan.md's other
  // instruction (fit on a small phone without scrolling, stay readable)
  // takes priority for this pass. Revisit if a second device shows more
  // headroom than this one did.
  gridSizeLimits: [
    { wheelMin: 3, wheelMax: 6, maxCols: 9, maxRows: 6 },
    { wheelMin: 7, wheelMax: 7, maxCols: 9, maxRows: 6 },
  ],
  shapeRowsFactor: 1.2,
  shapeColsFactor: 1.6,
  maxAttemptsPerLevel: 200,
};
