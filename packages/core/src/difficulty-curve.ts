import type { DifficultyBand } from "./types.js";

/**
 * Plan.md section 10: "a config file that maps level number to a target
 * score... rises with easier levels mixed in after hard ones... can be
 * reshaped without regenerating levels." Per-band min/max target score is
 * taken from the real difficulty histograms measured against the actual
 * regenerated (9x6-ceiling) pools — see Claude.md's Phase 0 gate numbers —
 * not guessed. Band -> level-number range reuses `DifficultyBand.minLevel`/
 * `maxLevel`, which section 9 work (this file) is what finally reads them;
 * see Claude.md's "Decisions that deviate from Plan.md" for that history.
 */
export interface DifficultyCurveBand {
  band: number;
  minTarget: number;
  maxTarget: number;
}

export const DEFAULT_DIFFICULTY_CURVE: DifficultyCurveBand[] = [
  { band: 1, minTarget: 55, maxTarget: 117 },
  { band: 2, minTarget: 66, maxTarget: 125 },
  { band: 3, minTarget: 77, maxTarget: 131 },
  { band: 4, minTarget: 86, maxTarget: 135 },
  { band: 5, minTarget: 85, maxTarget: 135 },
];

/** Finds the band whose [minLevel, maxLevel] range contains `levelNumber`, falling back to the last band for anything past its range (band 5's maxLevel is a nominal ceiling, not a hard stop). */
export function bandForLevel(bands: readonly DifficultyBand[], levelNumber: number): DifficultyBand {
  const match = bands.find((b) => levelNumber >= b.minLevel && levelNumber <= b.maxLevel);
  if (match) return match;
  return levelNumber < (bands[0]?.minLevel ?? 1) ? bands[0]! : bands[bands.length - 1]!;
}

/**
 * Target difficulty score for a given level number: rises across the band's
 * level range, with every 5th level dipping toward the band's easy end
 * ("easier levels mixed in after hard ones") so the curve isn't a flat ramp.
 */
export function targetDifficultyForLevel(
  bands: readonly DifficultyBand[],
  curve: readonly DifficultyCurveBand[],
  levelNumber: number,
): number {
  const band = bandForLevel(bands, levelNumber);
  const curveBand = curve.find((c) => c.band === band.band) ?? curve[curve.length - 1]!;
  const span = Math.max(1, band.maxLevel - band.minLevel);
  const progress = Math.min(1, Math.max(0, (levelNumber - band.minLevel) / span));
  const base = curveBand.minTarget + (curveBand.maxTarget - curveBand.minTarget) * progress;
  const isDip = levelNumber % 5 === 0;
  return isDip ? base - (base - curveBand.minTarget) * 0.5 : base;
}
