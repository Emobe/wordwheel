import type { Level } from "@word-wheel/core";
import band1 from "./pool-band1.json";
import band2 from "./pool-band2.json";
import band3 from "./pool-band3.json";
import band4 from "./pool-band4.json";
import band5 from "./pool-band5.json";

export interface LevelFixture {
  level: Level;
  bonusWords: string[];
}

/**
 * A real slice of each Phase 0 pool (100 levels), precomputed by
 * packages/tools/src/mobile-fixtures.ts with real bonus-word sets, bundled
 * directly instead of downloaded — see that script's doc comment for why.
 * Keyed by band number so level-selection.ts has a real pool per band to
 * rank against, not one fixed level.
 */
export const POOLS: Record<number, LevelFixture[]> = {
  1: band1 as LevelFixture[],
  2: band2 as LevelFixture[],
  3: band3 as LevelFixture[],
  4: band4 as LevelFixture[],
  5: band5 as LevelFixture[],
};

export function poolLevels(band: number): Level[] {
  return (POOLS[band] ?? []).map((f) => f.level);
}

export function bonusWordsFor(levelId: string, band: number): string[] {
  return POOLS[band]?.find((f) => f.level.id === levelId)?.bonusWords ?? [];
}
