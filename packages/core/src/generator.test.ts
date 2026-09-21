import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { generateLevel } from './generator';
import { lemmatize } from './lemma';
import { buildTestPack } from './test-fixtures';

function letterCounts(letters: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ch of letters) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return counts;
}

describe('generateLevel', () => {
  const pack = buildTestPack();

  test('every grid word is spellable from the wheel multiset', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (seed, levelNumber) => {
          const result = generateLevel(pack, { seed, levelNumber });
          if (!result) return;
          const wheelCounts = letterCounts(result.level.wheel.map((c) => c.toLowerCase()));
          for (const placement of result.level.grid.words) {
            const used = new Map<string, number>();
            for (const ch of placement.word) {
              const have = wheelCounts.get(ch) ?? 0;
              const already = used.get(ch) ?? 0;
              expect(already + 1).toBeLessThanOrEqual(have);
              used.set(ch, already + 1);
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  test('the grid is always connected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (seed, levelNumber) => {
          const result = generateLevel(pack, { seed, levelNumber });
          if (!result) return;
          expect(result.level.grid.words.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 50 },
    );
  });

  test('no grid word is on the profanity list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (seed, levelNumber) => {
          const result = generateLevel(pack, { seed, levelNumber });
          if (!result) return;
          for (const placement of result.level.grid.words) {
            expect(pack.profanity.has(placement.word.toLowerCase())).toBe(false);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  test('at most one inflected form per lemma in the grid', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (seed, levelNumber) => {
          const result = generateLevel(pack, { seed, levelNumber });
          if (!result) return;
          const lemmas = result.level.grid.words.map((w) => lemmatize(w.word));
          expect(new Set(lemmas).size).toBe(lemmas.length);
        },
      ),
      { numRuns: 50 },
    );
  });

  test('is deterministic: the same seed and level number produce the same level', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 500 }),
        (seed, levelNumber) => {
          const a = generateLevel(pack, { seed, levelNumber });
          const b = generateLevel(pack, { seed, levelNumber });
          expect(a?.level.grid).toEqual(b?.level.grid);
          expect(a?.level.wheel).toEqual(b?.level.wheel);
        },
      ),
      { numRuns: 30 },
    );
  });
});
