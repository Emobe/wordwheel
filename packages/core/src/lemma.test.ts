import { describe, expect, test } from "bun:test";
import { buildBaseWordMap, resolveBaseWord } from "./lemma.js";

describe("lemma", () => {
  test("links plurals to their base word", () => {
    const words = ["cat", "cats", "dog", "dogs", "fox", "foxes", "box", "boxes"];
    const map = buildBaseWordMap(words);
    expect(map.cats).toBe("cat");
    expect(map.dogs).toBe("dog");
    expect(map.foxes).toBe("fox");
    expect(map.boxes).toBe("box");
  });

  test("links -ing and -ed forms when the base exists", () => {
    const words = ["jump", "jumping", "jumped", "bake", "baking", "baked"];
    const map = buildBaseWordMap(words);
    expect(map.jumping).toBe("jump");
    expect(map.jumped).toBe("jump");
    expect(map.baking).toBe("bake");
    expect(map.baked).toBe("bake");
  });

  test("links -ing and -ed forms with a doubled consonant", () => {
    const words = ["run", "running", "stop", "stopped", "plan", "planning"];
    const map = buildBaseWordMap(words);
    expect(map.running).toBe("run");
    expect(map.stopped).toBe("stop");
    expect(map.planning).toBe("plan");
  });

  test("prefers the shortest valid base across all matching rules", () => {
    // "hopping" could match "hopp"+ing (not real) or, via doubled-consonant
    // stripping, "hop" - the shorter, real word must win.
    const words = ["hop", "hopping"];
    const map = buildBaseWordMap(words);
    expect(map.hopping).toBe("hop");
  });

  test("does not link a word when no base form is present", () => {
    const words = ["business", "bus"];
    const map = buildBaseWordMap(words);
    // "business" ends in "s" but "busines" is not a real word, so no link.
    expect(map.business).toBeUndefined();
  });

  test("resolveBaseWord falls back to the word itself", () => {
    const map = { cats: "cat" };
    expect(resolveBaseWord("cats", map)).toBe("cat");
    expect(resolveBaseWord("dog", map)).toBe("dog");
  });
});
