import type { GeneratorConfig } from "./types.js";

/** Starting values from sections 8 and 10 of the plan. Tunable without regenerating. */
export const DEFAULT_CONFIG: GeneratorConfig = {
  bands: [
    // wheelMin raised 3->4 to match Plan.md's difficulty table (band 1's
    // wheel column is now a single "4", not a "3-4" range) — no band has a
    // 3-letter wheel minimum any more.
    { band: 1, minLevel: 1, maxLevel: 100, wheelMin: 4, wheelMax: 4, gridWordsMin: 3, gridWordsMax: 6, maxRarestRank: 20 },
    { band: 2, minLevel: 101, maxLevel: 400, wheelMin: 4, wheelMax: 5, gridWordsMin: 6, gridWordsMax: 10, maxRarestRank: 40 },
    { band: 3, minLevel: 401, maxLevel: 1200, wheelMin: 5, wheelMax: 6, gridWordsMin: 8, gridWordsMax: 14, maxRarestRank: 60 },
    // gridWordsMin/Max restored per real measurement against the 11x6
    // ceiling below (see sweep numbers in that comment): band 4 fits its
    // original 10-16 range at 100% success; band 5's original 12-18 is still
    // infeasible even at 11x6 (measured near-total retry failure and
    // multi-second stalls), so it's set to 10-15 — the highest range that
    // measured 100% success at an acceptable per-level generation cost.
    { band: 4, minLevel: 1200, maxLevel: 3000, wheelMin: 6, wheelMax: 7, gridWordsMin: 10, gridWordsMax: 16, maxRarestRank: 80 },
    { band: 5, minLevel: 3000, maxLevel: 999999, wheelMin: 7, wheelMax: 7, gridWordsMin: 10, gridWordsMax: 15, maxRarestRank: 80 },
  ],
  // Re-measured live on a real 360x640dp device (adb `wm size`/`wm density`
  // override to get the exact target resolution) against the *current* UI
  // (post hint-icon/bonus-words-row rework — see git history around
  // "Move hint buttons to icon buttons beside the wheel" and "Remove now-
  // redundant bonus words text above the wheel"), via onLayout logging on
  // GameScreen's gridArea: real box is 328x196dp (previously measured
  // 328x203dp in Phase 1, before that UI rework). At the 28dp tile floor and
  // 2dp gaps, width now allows 11 cols (30*11-2=328, an exact fit with zero
  // slack — flagged since a few dp less on some other device would drop a
  // column) and height still only allows 6 rows (30*6-2=178<=196; a 7th row
  // needs 30*7-2=208 > 196, so the section 8 "7-tile word vertically" gap
  // noted below is unchanged). Both tiers share this ceiling since the
  // available box doesn't change with wheel size — only gridWordsMin/Max
  // (see `bands` above) still scale grid *usage* by band.
  //
  // Known gap: Plan.md section 8 says the limits "must allow the longest
  // wheel word (7 tiles) in either direction" — 11 cols satisfies that
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
    { wheelMin: 3, wheelMax: 6, maxCols: 11, maxRows: 6 },
    { wheelMin: 7, wheelMax: 7, maxCols: 11, maxRows: 6 },
  ],
  shapeRowsFactor: 1.2,
  shapeColsFactor: 1.6,
  maxAttemptsPerLevel: 200,
  // Caps a single generateLevel call's total backtracking work regardless of
  // maxAttemptsPerLevel. Sized from real measurement (see layout.ts's
  // nodeBudget doc comment): every observed real success needed well under
  // 2000 nodes, so 50000 total leaves generous headroom for legitimately
  // hard-but-feasible layouts while still failing a truly infeasible
  // word-count/grid-size combination in well under a second instead of
  // ~2s/attempt * up to 200 attempts.
  maxTotalLayoutNodes: 50000,
};
