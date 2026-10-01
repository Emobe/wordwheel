import { describe, expect, test } from "bun:test";
import { selectNextLevel } from "./level-selection.js";
import { makeRng } from "./prng.js";
import type { Level } from "./types.js";

function makeLevel(id: string, difficulty: number, words: string[], wheel: string[]): Level {
  return {
    id,
    lang: "en",
    packVersion: 1,
    band: 1,
    wheel,
    grid: {
      cols: 5,
      rows: 5,
      words: words.map((w, i) => ({ w, x: 0, y: i, dir: "V", coins: false })),
    },
    difficulty,
  };
}

describe("selectNextLevel", () => {
  const pool: Level[] = [
    makeLevel("a", 50, ["CAT", "CAR"], ["C", "A", "T", "R"]),
    makeLevel("b", 100, ["STAR", "TARS"], ["S", "T", "A", "R"]),
    makeLevel("c", 101, ["STARE", "RATES"], ["S", "T", "A", "R", "E"]),
    makeLevel("d", 200, ["EAST", "SEAT"], ["E", "A", "S", "T"]),
  ];
  const noHistory = { baseWordLastSeen: new Map(), wheelLastSeen: new Map() };

  test("prefers levels close to the target difficulty", () => {
    // With only 4 candidates and a top-5 cutoff, ranking can't exclude any
    // of them — so this needs enough decoys that the far-off ones actually
    // get filtered out instead of asserting on the pick itself.
    const withDecoys: Level[] = [
      ...pool,
      makeLevel("e", 250, ["FOX"], ["F", "O", "X"]),
      makeLevel("f", 300, ["FOXES"], ["F", "O", "X", "E", "S"]),
      makeLevel("g", 5, ["I"], ["I"]),
    ];
    const picks = Array.from(
      { length: 12 },
      (_, i) => selectNextLevel(withDecoys, 100, new Map(), noHistory, makeRng(i))?.id,
    );
    expect(picks).not.toContain("e");
    expect(picks).not.toContain("f");
  });

  test("ranks unplayed levels ahead of played ones", () => {
    const played = new Map([["b", 1000], ["c", 2000], ["d", 3000]]);
    for (let i = 0; i < 12; i++) {
      expect(selectNextLevel(pool, 100, played, noHistory, makeRng(i))?.id).toBe("a");
    }
  });

  test("never mixes a replay into the top-few window while an unplayed level remains", () => {
    const played = new Map([["a", 1], ["b", 2], ["c", 3]]);
    for (let i = 0; i < 12; i++) {
      expect(selectNextLevel(pool, 100, played, noHistory, makeRng(i))?.id).toBe("d");
    }
  });

  test("once everything is played, surfaces the oldest-played levels", () => {
    const many: Level[] = Array.from({ length: 10 }, (_, i) => makeLevel(`m${i}`, 100, ["AAA"], ["A"]));
    // m0 is oldest ... m9 is newest.
    const played = new Map(many.map((l, i) => [l.id, 1000 + i]));
    const picks = new Set(
      Array.from({ length: 60 }, (_, i) => selectNextLevel(many, 100, played, noHistory, makeRng(i))?.id),
    );
    // A null selection would surface here as `undefined` (from `?.id`), so
    // check for it explicitly instead of letting toContain's string-only
    // signature paper over it.
    expect(picks.has(undefined)).toBe(false);
    for (const id of picks) expect(["m0", "m1", "m2", "m3", "m4"]).toContain(id as string);
    expect(picks.size).toBeGreaterThan(1); // randomness applies to replays too
  });

  test("difficulty closeness breaks ties between equally-recently-played levels", () => {
    const tied: Level[] = Array.from({ length: 8 }, (_, i) => makeLevel(`t${i}`, 100 + i * 20, ["AAA"], ["A"]));
    const played = new Map(tied.map((l) => [l.id, 5000]));
    const picks = Array.from({ length: 30 }, (_, i) => selectNextLevel(tied, 100, played, noHistory, makeRng(i))?.id);
    expect(picks).not.toContain("t7");
  });

  test("replays are always available, with no separate exhausted state", () => {
    const played = new Map(pool.map((l, i) => [l.id, i + 1]));
    expect(selectNextLevel(pool, 100, played, noHistory, makeRng(1))).not.toBeNull();
  });

  test("returns null for an empty pool", () => {
    const rng = makeRng(1);
    expect(selectNextLevel([], 100, new Map(), noHistory, rng)).toBeNull();
  });

  test("same seed picks the same level from an otherwise-tied pool", () => {
    const rngA = makeRng(99);
    const rngB = makeRng(99);
    const a = selectNextLevel(pool, 100, new Map(), noHistory, rngA);
    const b = selectNextLevel(pool, 100, new Map(), noHistory, rngB);
    expect(a?.id).toBe(b?.id);
  });

  test("a recently-seen level can be pushed out of the top-K ranking by a farther-but-fresher one", () => {
    // 6 candidates at target=100, with gaps 0,2,4,6,8,10 — the TOP_K=5 cutoff
    // sits right between the last two (L5 gap 8, L6 gap 10). Unseen, L5
    // outranks L6 on difficulty alone and is always in the top 5. Marking
    // L5's words as just-seen (age 0) drops its recency term to 0 and pushes
    // its rank score above L6's saturated-recency score, flipping which one
    // makes the cut.
    const now = 1_000_000_000_000;
    const wide: Level[] = [
      makeLevel("L1", 100, ["AAA"], ["A"]),
      makeLevel("L2", 98, ["BBB"], ["B"]),
      makeLevel("L3", 104, ["CCC"], ["C"]),
      makeLevel("L4", 94, ["DDD"], ["D"]),
      makeLevel("L5", 108, ["EEE"], ["E"]),
      makeLevel("L6", 110, ["FFF"], ["F"]),
    ];

    const picksUnseen = Array.from(
      { length: 12 },
      (_, i) => selectNextLevel(wide, 100, new Map(), noHistory, makeRng(i), now)?.id,
    );
    expect(picksUnseen).not.toContain("L6");

    const l5Seen = { baseWordLastSeen: new Map([["eee", now]]), wheelLastSeen: new Map([["E", now]]) };
    const picksL5Seen = Array.from(
      { length: 12 },
      (_, i) => selectNextLevel(wide, 100, new Map(), l5Seen, makeRng(i), now)?.id,
    );
    expect(picksL5Seen).not.toContain("L5");
    expect(picksL5Seen).toContain("L6");
  });
});
