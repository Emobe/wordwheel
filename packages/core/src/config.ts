import type { GeneratorConfig } from "./types.js";

/** Starting values from sections 8 and 10 of the plan. Tunable without regenerating. */
export const DEFAULT_CONFIG: GeneratorConfig = {
  bands: [
    { band: 1, minLevel: 1, maxLevel: 100, wheelMin: 3, wheelMax: 4, gridWordsMin: 3, gridWordsMax: 6, maxRarestRank: 20 },
    { band: 2, minLevel: 101, maxLevel: 400, wheelMin: 4, wheelMax: 5, gridWordsMin: 6, gridWordsMax: 10, maxRarestRank: 40 },
    { band: 3, minLevel: 401, maxLevel: 1200, wheelMin: 5, wheelMax: 6, gridWordsMin: 8, gridWordsMax: 14, maxRarestRank: 60 },
    { band: 4, minLevel: 1200, maxLevel: 3000, wheelMin: 6, wheelMax: 7, gridWordsMin: 10, gridWordsMax: 16, maxRarestRank: 80 },
    { band: 5, minLevel: 3000, maxLevel: 999999, wheelMin: 7, wheelMax: 7, gridWordsMin: 12, gridWordsMax: 18, maxRarestRank: 80 },
  ],
  gridSizeLimits: [
    { wheelMin: 3, wheelMax: 6, maxCols: 10, maxRows: 9 },
    { wheelMin: 7, wheelMax: 7, maxCols: 11, maxRows: 10 },
  ],
  shapeRowsFactor: 1.2,
  shapeColsFactor: 1.6,
  maxAttemptsPerLevel: 200,
};
