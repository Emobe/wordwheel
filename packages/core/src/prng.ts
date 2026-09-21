/**
 * Deterministic seeded PRNG (mulberry32). No dependency on Math.random, so
 * every generator run is reproducible from its seed alone.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string seed down to a 32-bit int (FNV-1a). */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class Rng {
  private next32: () => number;

  constructor(seed: number | string) {
    const numericSeed = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
    this.next32 = mulberry32(numericSeed);
  }

  /** Float in [0, 1). */
  next(): number {
    return this.next32();
  }

  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** Integer in [min, max]. */
  range(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Rng.pick: empty array');
    }
    return items[this.int(items.length)]!;
  }

  /** Fisher-Yates shuffle, returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = result[i]!;
      result[i] = result[j]!;
      result[j] = tmp;
    }
    return result;
  }
}
