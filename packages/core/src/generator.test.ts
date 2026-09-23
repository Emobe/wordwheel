import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "./config.js";
import { bonusWords, generateLevel } from "./generator.js";
import { findAccidentalWords, isConnected } from "./layout.js";
import { buildBaseWordMap, resolveBaseWord } from "./lemma.js";
import { makeRng } from "./prng.js";
import { buildTrie } from "./trie.js";
import type { GeneratorConfig, GridWordEntry, WordPack } from "./types.js";

// A small but real-word dictionary, dense enough in overlapping letters that
// the generator can actually find crossing candidates for every band.
const DICTIONARY = [
  "cat",
  "cats",
  "car",
  "cars",
  "art",
  "arts",
  "rat",
  "rats",
  "tar",
  "tars",
  "at",
  "star",
  "stars",
  "stare",
  "stares",
  "stared",
  "staring",
  "rate",
  "rates",
  "rated",
  "rating",
  "tare",
  "tares",
  "tears",
  "tear",
  "east",
  "eats",
  "eat",
  "seat",
  "seats",
  "sear",
  "sears",
  "sea",
  "seas",
  "ate",
  "era",
  "eras",
  "are",
  "ear",
  "ears",
  "art",
];

function makePack(): WordPack {
  const gridWords: GridWordEntry[] = DICTIONARY.map((word, i) => ({ word, rank: 10 + (i % 5) * 10 }));
  const baseMap = buildBaseWordMap(DICTIONARY);
  return {
    lang: "en",
    version: 1,
    accepted: DICTIONARY,
    gridWords,
    baseMap,
    license: [],
  };
}

function makeConfig(): GeneratorConfig {
  return {
    ...DEFAULT_CONFIG,
    bands: DEFAULT_CONFIG.bands.map((b) => ({ ...b, gridWordsMin: 2, gridWordsMax: 4, maxRarestRank: 90 })),
    maxAttemptsPerLevel: 500,
  };
}

describe("generateLevel", () => {
  test("produces a level respecting every section 7 validation rule", () => {
    const pack = makePack();
    const trie = buildTrie(pack.accepted);
    const config = makeConfig();
    const band = config.bands[0]!;
    const rng = makeRng(123);

    let successCount = 0;
    for (let i = 0; i < 20; i++) {
      const level = generateLevel({ pack, trie, config, band, rng, id: `t-${i}` });
      if (!level) continue;
      successCount++;

      // Grid within the section 8 size limits for this wheel size.
      const limit = config.gridSizeLimits.find(
        (l) => level.wheel.length >= l.wheelMin && level.wheel.length <= l.wheelMax,
      )!;
      expect(level.grid.cols).toBeLessThanOrEqual(limit.maxCols);
      expect(level.grid.rows).toBeLessThanOrEqual(limit.maxRows);

      // Every grid word spellable from the wheel (submultiset of wheel letters).
      const wheelCounts = new Map<string, number>();
      for (const t of level.wheel) wheelCounts.set(t, (wheelCounts.get(t) ?? 0) + 1);
      for (const w of level.grid.words) {
        const counts = new Map<string, number>();
        for (const ch of w.w) counts.set(ch, (counts.get(ch) ?? 0) + 1);
        for (const [ch, count] of counts) {
          expect(count).toBeLessThanOrEqual(wheelCounts.get(ch) ?? 0);
        }
      }

      // Grid connected.
      expect(isConnected(level.grid)).toBe(true);

      // No accidental words.
      const intended = new Set(level.grid.words.map((w) => w.w.toLowerCase()));
      const accidental = findAccidentalWords(level.grid, intended, (w) => trie.has(w));
      expect(accidental).toEqual([]);

      // One form per base word.
      const bases = level.grid.words.map((w) => resolveBaseWord(w.w.toLowerCase(), pack.baseMap));
      expect(new Set(bases).size).toBe(bases.length);
    }

    expect(successCount).toBeGreaterThan(0);
  });
});

describe("bonusWords", () => {
  test("returns spellable words minus the required grid words, uppercased", () => {
    const pack = makePack();
    const trie = buildTrie(pack.accepted);
    const config = makeConfig();
    const band = config.bands[0]!;
    const rng = makeRng(7);

    const level = generateLevel({ pack, trie, config, band, rng, id: "bonus-test" });
    expect(level).not.toBeNull();
    if (!level) return;

    const bonus = bonusWords(pack, trie, level);
    const gridWords = new Set(level.grid.words.map((w) => w.w));

    for (const word of bonus) {
      expect(word).toBe(word.toUpperCase());
      expect(gridWords.has(word)).toBe(false);
      expect(trie.has(word.toLowerCase())).toBe(true);
    }
  });
});
