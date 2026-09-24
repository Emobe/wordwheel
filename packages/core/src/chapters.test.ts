import { describe, expect, test } from "bun:test";
import { DEFAULT_CHAPTERS, chapterForLevel } from "./chapters.js";

describe("chapters", () => {
  test("chapters tile the level range with no gaps or overlaps", () => {
    for (let i = 0; i < DEFAULT_CHAPTERS.length - 1; i++) {
      expect(DEFAULT_CHAPTERS[i + 1]!.startLevel).toBe(DEFAULT_CHAPTERS[i]!.endLevel + 1);
    }
  });

  test("chapterForLevel finds the right chapter within the precomputed list", () => {
    const c = chapterForLevel(30);
    expect(c.startLevel).toBeLessThanOrEqual(30);
    expect(c.endLevel).toBeGreaterThanOrEqual(30);
  });

  test("chapterForLevel extends the pattern past the precomputed list", () => {
    const lastPrecomputed = DEFAULT_CHAPTERS[DEFAULT_CHAPTERS.length - 1]!;
    const farLevel = lastPrecomputed.endLevel + 1000;
    const c = chapterForLevel(farLevel);
    expect(c.startLevel).toBeLessThanOrEqual(farLevel);
    expect(c.endLevel).toBeGreaterThanOrEqual(farLevel);
  });

  test("palette keys cycle rather than growing unbounded", () => {
    const keys = new Set(DEFAULT_CHAPTERS.map((c) => c.paletteKey));
    expect(keys.size).toBeLessThanOrEqual(5);
  });
});
