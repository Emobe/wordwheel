import type { GridWordPlacement, TierBand } from './types';

/** Starting bands from PLAN.md section 7. All tunable post-calibration. */
export const TIER_BANDS: TierBand[] = [
  { tier: 1, levelRange: [1, 100], wheelLen: [3, 4], gridWords: [3, 6], maxWordSize: 20 },
  { tier: 2, levelRange: [101, 400], wheelLen: [4, 5], gridWords: [6, 10], maxWordSize: 35 },
  { tier: 3, levelRange: [401, 1200], wheelLen: [5, 6], gridWords: [10, 16], maxWordSize: 35 },
  { tier: 4, levelRange: [1200, 3000], wheelLen: [6, 7], gridWords: [14, 22], maxWordSize: 35 },
  {
    tier: 5,
    levelRange: [3000, Number.POSITIVE_INFINITY],
    wheelLen: [7, 7],
    gridWords: [18, 28],
    maxWordSize: 35,
  },
];

const RARE_LETTERS = new Set(['Q', 'Z', 'X', 'J']);

/** Sawtooth mapping from level index (1-based) to a target tier: mostly climbing, with easier levels mixed back in. PLAN.md section 7. */
export function tierForLevel(levelNumber: number): TierBand {
  const band = TIER_BANDS.find(
    (b) => levelNumber >= b.levelRange[0] && levelNumber <= b.levelRange[1],
  );
  const base = band ?? TIER_BANDS[TIER_BANDS.length - 1]!;
  // Sawtooth: every 17th level within a band drops back to the previous band
  // (or tier 1) so hard runs are broken up by an easier level.
  if (levelNumber % 17 === 0 && base.tier > 1) {
    return TIER_BANDS[base.tier - 2]!;
  }
  return base;
}

export interface DifficultyInput {
  wheelLen: number;
  gridWords: GridWordPlacement[];
  wordSizeTiers: Map<string, number>;
  inflectedCount: number;
  requiresFullWheelWord: boolean;
  gridW: number;
  gridH: number;
  crossingCount: number;
}

export function scoreDifficulty(input: DifficultyInput): number {
  const {
    wheelLen,
    gridWords,
    wordSizeTiers,
    inflectedCount,
    requiresFullWheelWord,
    gridW,
    gridH,
    crossingCount,
  } = input;

  const structure =
    wheelLen * 2 + gridWords.length * 1.5 + (gridW * gridH) / 10 + (requiresFullWheelWord ? 5 : 0);

  const sizeTiers = gridWords.map((w) => wordSizeTiers.get(w.word) ?? 35);
  const rarestTier = Math.max(...sizeTiers, 0);
  const avgTier = sizeTiers.reduce((a, b) => a + b, 0) / Math.max(sizeTiers.length, 1);
  const rarity = rarestTier * 0.6 + avgTier * 0.4;

  let rareLetterHits = 0;
  let doubledLetterHits = 0;
  for (const w of gridWords) {
    const letters = w.word.toUpperCase().split('');
    for (const ch of letters) {
      if (RARE_LETTERS.has(ch)) rareLetterHits++;
    }
    for (let i = 1; i < letters.length; i++) {
      if (letters[i] === letters[i - 1]) doubledLetterHits++;
    }
  }
  const vowelPoorBonus = gridWords.filter((w) => !/[aeiou]/i.test(w.word.slice(0, -1))).length;
  const letters = rareLetterHits * 3 + doubledLetterHits * 1.5 + vowelPoorBonus * 2;

  const maxPossibleCrossings = Math.max(gridWords.length - 1, 1);
  const crossingSparsity = (1 - crossingCount / maxPossibleCrossings) * 10;

  const inflected = inflectedCount * 2;

  return Math.round((structure + rarity + letters + crossingSparsity + inflected) * 10) / 10;
}
