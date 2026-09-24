import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "./config.js";
import { DEFAULT_DIFFICULTY_CURVE, bandForLevel, targetDifficultyForLevel } from "./difficulty-curve.js";

describe("bandForLevel", () => {
  test("maps a level number to the band whose range contains it", () => {
    expect(bandForLevel(DEFAULT_CONFIG.bands, 1).band).toBe(1);
    expect(bandForLevel(DEFAULT_CONFIG.bands, 100).band).toBe(1);
    expect(bandForLevel(DEFAULT_CONFIG.bands, 101).band).toBe(2);
    // Note: band 3 ends at 1200 and band 4 starts at 1200 (an overlapping
    // boundary in DEFAULT_CONFIG.bands); bandForLevel takes the first match,
    // so 1200 itself lands in band 3 — use 1201 to test band 4 unambiguously.
    expect(bandForLevel(DEFAULT_CONFIG.bands, 1201).band).toBe(4);
    expect(bandForLevel(DEFAULT_CONFIG.bands, 5000).band).toBe(5);
  });

  test("falls back to band 1 below the lowest range and band 5 above the highest", () => {
    expect(bandForLevel(DEFAULT_CONFIG.bands, 0).band).toBe(1);
    expect(bandForLevel(DEFAULT_CONFIG.bands, 999999999).band).toBe(5);
  });
});

describe("targetDifficultyForLevel", () => {
  test("rises across a band's level range", () => {
    const early = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 401);
    const late = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 1199);
    expect(late).toBeGreaterThan(early);
  });

  test("every 5th level dips below the non-dip trend", () => {
    const dip = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 410);
    const before = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 409);
    const after = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, 411);
    expect(dip).toBeLessThan(before);
    expect(dip).toBeLessThan(after);
  });

  test("stays within the band's configured min/max target", () => {
    const curveBand = DEFAULT_DIFFICULTY_CURVE.find((c) => c.band === 3)!;
    for (let level = 401; level <= 1200; level += 37) {
      const target = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, level);
      expect(target).toBeGreaterThanOrEqual(curveBand.minTarget);
      expect(target).toBeLessThanOrEqual(curveBand.maxTarget);
    }
  });
});
