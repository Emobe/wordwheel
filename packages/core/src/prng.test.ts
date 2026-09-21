import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { Rng } from './prng';

describe('Rng', () => {
  test('same seed produces the same sequence', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.integer({ min: 1, max: 50 }), (seed, count) => {
        const a = new Rng(seed);
        const b = new Rng(seed);
        const seqA = Array.from({ length: count }, () => a.next());
        const seqB = Array.from({ length: count }, () => b.next());
        expect(seqA).toEqual(seqB);
      }),
    );
  });

  test('next() stays within [0, 1)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (seed) => {
        const rng = new Rng(seed);
        for (let i = 0; i < 20; i++) {
          const v = rng.next();
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(1);
        }
      }),
    );
  });

  test('shuffle is a permutation of the input', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.array(fc.integer()), (seed, items) => {
        const rng = new Rng(seed);
        const shuffled = rng.shuffle(items);
        expect(shuffled.slice().sort()).toEqual(items.slice().sort());
      }),
    );
  });
});
