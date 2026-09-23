import { describe, expect, test } from "bun:test";
import { buildTrie } from "./trie.js";

describe("trie", () => {
  test("has() finds inserted words only", () => {
    const trie = buildTrie(["cat", "cats", "car"]);
    expect(trie.has("cat")).toBe(true);
    expect(trie.has("ca")).toBe(false);
    expect(trie.has("dog")).toBe(false);
  });

  test("wordsFromTiles respects letter multiplicity", () => {
    const trie = buildTrie(["cat", "cats", "act", "tac", "at", "car", "arc"]);
    const words = trie.wordsFromTiles(["c", "a", "t"], 2);
    expect(new Set(words)).toEqual(new Set(["cat", "act", "tac", "at"]));
  });

  test("does not find words needing more of a letter than the wheel has", () => {
    const trie = buildTrie(["moo", "mo"]);
    const words = trie.wordsFromTiles(["m", "o"], 2);
    expect(words).toEqual(["mo"]);
  });

  test("finds a word using a doubled tile", () => {
    const trie = buildTrie(["moo", "mo"]);
    const words = trie.wordsFromTiles(["m", "o", "o"], 2);
    expect(new Set(words)).toEqual(new Set(["moo", "mo"]));
  });

  test("respects minLength", () => {
    const trie = buildTrie(["at", "cat"]);
    const words = trie.wordsFromTiles(["c", "a", "t"], 3);
    expect(words).toEqual(["cat"]);
  });
});
