import { describe, expect, test } from "bun:test";
import { makeRng, randomInt, seedFromString, shuffle } from "./prng.js";

describe("prng", () => {
  test("same seed produces same sequence", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  test("different seeds diverge", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toEqual(b());
  });

  test("values are in [0, 1)", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test("randomInt stays within bounds", () => {
    const rng = makeRng(99);
    for (let i = 0; i < 500; i++) {
      const v = randomInt(rng, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  test("shuffle is deterministic per seed and a permutation", () => {
    const input = [1, 2, 3, 4, 5];
    const a = shuffle(makeRng(5), input);
    const b = shuffle(makeRng(5), input);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(input);
  });

  test("seedFromString is deterministic", () => {
    expect(seedFromString("en-band3")).toEqual(seedFromString("en-band3"));
  });
});
