import type { Grid, GridWordEntry } from "./types.js";

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const RARE_LETTERS = new Set(["J", "Q", "X", "Z", "V", "K", "W"]);

export interface DifficultyInput {
  wheel: string[];
  grid: Grid;
  /** rank per grid word, aligned by word (from the pack's grid word list). */
  ranks: Map<string, number>;
  /** How many of the grid words are non-base forms (plurals, -ing, etc). */
  formCount: number;
  requiresFullWheelWord: boolean;
}

/**
 * A single numeric score per section 10: structure, word rarity, letters,
 * crossings and word forms all contribute. Weights are a starting point,
 * tunable without regenerating (the curve config maps level -> target score
 * separately; this only scores a given level).
 */
export function computeDifficulty(input: DifficultyInput): number {
  const { grid, ranks, formCount, requiresFullWheelWord } = input;
  const wheel = input.wheel.map((t) => t.toUpperCase());

  const structureScore =
    wheel.length * 3 + grid.words.length * 2 + (grid.cols * grid.rows) / 10 + (requiresFullWheelWord ? 10 : 0);

  const rankValues = grid.words.map((w) => ranks.get(w.w.toLowerCase()) ?? 50);
  const rarestRank = Math.max(...rankValues);
  const avgRank = rankValues.reduce((a, b) => a + b, 0) / rankValues.length;
  const rarityScore = rarestRank * 0.5 + avgRank * 0.3;

  const rareLetterCount = wheel.filter((t) => RARE_LETTERS.has(t)).length;
  const vowelCount = wheel.filter((t) => VOWELS.has(t)).length;
  const doubledLetters = wheel.length - new Set(wheel).size;
  const fewVowelsBonus = Math.max(0, 3 - vowelCount) * 2;
  const letterScore = rareLetterCount * 4 + doubledLetters * 2 + fewVowelsBonus;

  let totalCrossings = 0;
  for (const w of grid.words) {
    for (const other of grid.words) {
      if (w === other) continue;
      for (let i = 0; i < w.w.length; i++) {
        const x = w.dir === "H" ? w.x + i : w.x;
        const y = w.dir === "H" ? w.y : w.y + i;
        for (let j = 0; j < other.w.length; j++) {
          const ox = other.dir === "H" ? other.x + j : other.x;
          const oy = other.dir === "H" ? other.y : other.y + j;
          if (x === ox && y === oy) totalCrossings++;
        }
      }
    }
  }
  totalCrossings /= 2; // counted from both sides
  const crossingScore = Math.max(0, 20 - totalCrossings * 2); // fewer crossings = harder

  const formScore = formCount * 3;

  return Math.round((structureScore + rarityScore + letterScore + crossingScore + formScore) * 10) / 10;
}

export function buildRankMap(gridWords: readonly GridWordEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const g of gridWords) map.set(g.word, g.rank);
  return map;
}
