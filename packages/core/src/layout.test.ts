import { describe, expect, test } from "bun:test";
import { findAccidentalWords, hasIllegalAdjacency, isConnected, layoutGrid } from "./layout.js";
import type { PlacedWord } from "./layout.js";

const OPTS = { maxCols: 10, maxRows: 9, shapeRowsFactor: 1.2, shapeColsFactor: 1.6 };

describe("layoutGrid", () => {
  test("places crossing words within size limits", () => {
    const result = layoutGrid(["stare", "tars", "ears", "rate"], OPTS);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.grid.cols).toBeLessThanOrEqual(OPTS.maxCols);
    expect(result.grid.rows).toBeLessThanOrEqual(OPTS.maxRows);
    expect(result.grid.words.length).toBe(4);
    expect(isConnected(result.grid)).toBe(true);
  });

  test("a single word lays out trivially", () => {
    const result = layoutGrid(["cat"], OPTS);
    expect(result).not.toBeNull();
    expect(result?.grid.words.length).toBe(1);
  });

  test("returns null when words share no letters to cross", () => {
    const result = layoutGrid(["dog", "flea"], OPTS);
    expect(result).toBeNull();
  });

  test("respects a tight size limit", () => {
    const result = layoutGrid(["elephants", "cat"], { ...OPTS, maxCols: 3, maxRows: 3 });
    expect(result).toBeNull();
  });

  test("never places a shorter word fully inside a longer word in the same direction", () => {
    const result = layoutGrid(["motive", "mot"], OPTS);
    // "mot" cannot cross "motive" (same direction, no perpendicular word to anchor it),
    // so it must either be rejected or placed on its own line, never overlapping "motive".
    if (result) {
      const motive = result.grid.words.find((w) => w.w === "MOTIVE")!;
      const mot = result.grid.words.find((w) => w.w === "MOT")!;
      expect(mot.dir === motive.dir && mot.y === motive.y && mot.x === motive.x).toBe(false);
    }
  });

  test("never places two words with conflicting overlapping letters", () => {
    // Regression: MOTIVE's letter set previously produced VOE and VIE placed
    // at the same coordinates, which disagree at the middle letter.
    const result = layoutGrid(["motive", "vomit", "vite", "item", "voe", "tom", "vie", "vim", "met", "mot", "toe", "moi", "tie"], OPTS);
    expect(result).not.toBeNull();
    if (!result) return;
    const cellLetter = new Map<string, string>();
    for (const p of result.grid.words) {
      for (let i = 0; i < p.w.length; i++) {
        const x = p.dir === "H" ? p.x + i : p.x;
        const y = p.dir === "H" ? p.y : p.y + i;
        const key = `${x},${y}`;
        const letter = p.w[i]!;
        const existing = cellLetter.get(key);
        if (existing !== undefined) expect(existing).toBe(letter);
        cellLetter.set(key, letter);
      }
    }
  });
});

describe("hasIllegalAdjacency", () => {
  test("rejects a word placed directly beside another with no crossing", () => {
    // CAT at row 0, DOG placed on row 1 in the same columns: parallel and
    // touching, but not crossing anything - never valid in a real crossword.
    const placed: PlacedWord[] = [{ w: "cat", x: 0, y: 0, dir: "H" }];
    const candidate: PlacedWord = { w: "dog", x: 0, y: 1, dir: "H" };
    expect(hasIllegalAdjacency(placed, candidate)).toBe(true);
  });

  test("rejects a word butting end-to-end against another", () => {
    const placed: PlacedWord[] = [{ w: "cat", x: 0, y: 0, dir: "H" }];
    const candidate: PlacedWord = { w: "dog", x: 3, y: 0, dir: "H" };
    expect(hasIllegalAdjacency(placed, candidate)).toBe(true);
  });

  test("allows a perpendicular word that only touches at its crossing point", () => {
    // CAT horizontal at row 0; TIE crosses it vertically through the 'T' at (2,0).
    const placed: PlacedWord[] = [{ w: "cat", x: 0, y: 0, dir: "H" }];
    const candidate: PlacedWord = { w: "tie", x: 2, y: 0, dir: "V" };
    expect(hasIllegalAdjacency(placed, candidate)).toBe(false);
  });

  test("allows a word with no nearby placed words at all", () => {
    const candidate: PlacedWord = { w: "cat", x: 0, y: 0, dir: "H" };
    expect(hasIllegalAdjacency([], candidate)).toBe(false);
  });
});

describe("findAccidentalWords", () => {
  test("finds no accidental words in a clean layout", () => {
    const result = layoutGrid(["cat", "car"], OPTS);
    expect(result).not.toBeNull();
    if (!result) return;
    const isWord = (w: string) => ["cat", "car"].includes(w);
    expect(findAccidentalWords(result.grid, new Set(["cat", "car"]), isWord)).toEqual([]);
  });
});
