import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "./config.js";
import { DEFAULT_DIFFICULTY_CURVE, bandForLevel, targetDifficultyForLevel } from "./difficulty-curve.js";

describe("bandForLevel", () => {
  test("maps a level number to the band whose range contains it", () => {
    const expected: Array<[number, number]> = [
      [1, 1], [10, 1], [11, 2], [30, 2], [31, 3], [105, 3], [106, 4], [205, 4], [206, 5], [5000, 5],
    ];
    for (const [level, band] of expected) {
      expect(bandForLevel(DEFAULT_CONFIG.bands, level).band).toBe(band);
    }
  });

  test("falls back to band 1 below the lowest range and band 5 above the highest", () => {
    expect(bandForLevel(DEFAULT_CONFIG.bands, 0).band).toBe(1);
    expect(bandForLevel(DEFAULT_CONFIG.bands, 999999999).band).toBe(5);
  });
});

describe("targetDifficultyForLevel", () => {
  test("rises across a band's level range", () => {
    const early = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 31);
    const late = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 105);
    expect(late).toBeGreaterThan(early);
  });

  test("every 5th level dips below the non-dip trend", () => {
    const dip = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 45);
    const before = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 44);
    const after = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 46);
    expect(dip).toBeLessThan(before);
    expect(dip).toBeLessThan(after);
  });

  test("stays within the band's configured min/max target", () => {
    const curveBand = DEFAULT_DIFFICULTY_CURVE.find((c) => c.band === 3)!;
    for (let level = 31; level <= 105; level += 7) {
      const target = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, level);
      expect(target).toBeGreaterThanOrEqual(curveBand.minTarget);
      expect(target).toBeLessThanOrEqual(curveBand.maxTarget);
    }
  });
});
