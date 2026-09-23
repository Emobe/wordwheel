import { buildRankMap, computeDifficulty } from "./difficulty.js";
import { findAccidentalWords, isConnected, layoutGrid } from "./layout.js";
import { resolveBaseWord } from "./lemma.js";
import { isBlocked } from "./profanity.js";
import type { Rng } from "./prng.js";
import { pick, randomInt, shuffle } from "./prng.js";
import type { Trie } from "./trie.js";
import type { DifficultyBand, GeneratorConfig, Level, WordPack } from "./types.js";

export interface GenerateLevelParams {
  pack: WordPack;
  trie: Trie;
  config: GeneratorConfig;
  band: DifficultyBand;
  rng: Rng;
  id: string;
}

export function generateLevel({ pack, trie, config, band, rng, id }: GenerateLevelParams): Level | null {
  const rankMap = buildRankMap(pack.gridWords);
  const gridWordSet = new Set(pack.gridWords.map((g) => g.word));

  const wheelWordCandidates = pack.gridWords.filter(
    (g) =>
      g.word.length >= band.wheelMin &&
      g.word.length <= band.wheelMax &&
      g.rank <= band.maxRarestRank &&
      !isBlocked(g.word),
  );
  if (wheelWordCandidates.length === 0) return null;

  const sizeLimits = config.gridSizeLimits;

  for (let attempt = 0; attempt < config.maxAttemptsPerLevel; attempt++) {
    const wheelEntry = pick(rng, wheelWordCandidates);
    const wheelWord = wheelEntry.word;
    const wheel = wheelWord.split(""); // lowercase, matches pack casing; uppercased only in the final Level

    const sizeLimit = sizeLimits.find((l) => wheel.length >= l.wheelMin && wheel.length <= l.wheelMax);
    if (!sizeLimit) continue;

    const spellable = trie.wordsFromTiles(wheel, 3);
    const candidateWords = spellable.filter((w) => gridWordSet.has(w) && !isBlocked(w));

    // Dedupe by base word, preferring the most common surface form; force the
    // wheel word itself to win its base slot so it is always in the grid.
    const baseToBest = new Map<string, { word: string; rank: number }>();
    for (const w of candidateWords) {
      const base = resolveBaseWord(w, pack.baseMap);
      const rank = rankMap.get(w) ?? 999;
      const existing = baseToBest.get(base);
      if (!existing || rank < existing.rank) baseToBest.set(base, { word: w, rank });
    }
    const wheelBase = resolveBaseWord(wheelWord, pack.baseMap);
    baseToBest.set(wheelBase, { word: wheelWord, rank: rankMap.get(wheelWord) ?? 0 });

    const unique = [...baseToBest.values()].sort((a, b) => a.rank - b.rank);
    if (unique.length < band.gridWordsMin) continue;

    const targetCount = randomInt(rng, band.gridWordsMin, Math.min(band.gridWordsMax, unique.length));
    const others = shuffle(
      rng,
      unique.filter((c) => c.word !== wheelWord),
    );
    const chosenWords = [wheelWord, ...others.slice(0, targetCount - 1).map((c) => c.word)];

    const layoutResult = layoutGrid(chosenWords, {
      maxCols: sizeLimit.maxCols,
      maxRows: sizeLimit.maxRows,
      shapeRowsFactor: config.shapeRowsFactor,
      shapeColsFactor: config.shapeColsFactor,
    });
    if (!layoutResult) continue;

    const { grid } = layoutResult;
    if (grid.cols > sizeLimit.maxCols || grid.rows > sizeLimit.maxRows) continue;
    if (!isConnected(grid)) continue;

    const intended = new Set(chosenWords);
    const accidental = findAccidentalWords(grid, intended, (w) => trie.has(w));
    if (accidental.length > 0) continue;

    const formCount = chosenWords.filter((w) => pack.baseMap[w] !== undefined).length;
    const difficulty = computeDifficulty({
      wheel,
      grid,
      ranks: rankMap,
      formCount,
      requiresFullWheelWord: true,
    });

    return {
      id,
      lang: pack.lang,
      packVersion: pack.version,
      band: band.band,
      wheel: wheel.map((t) => t.toUpperCase()),
      grid: { ...grid, words: grid.words.map((w) => ({ ...w, w: w.w.toUpperCase() })) },
      difficulty,
    };
  }

  return null;
}

/**
 * Every accepted word spellable from a level's wheel that isn't already a
 * required grid word — the bonus words shown in the app (section 7: "Bonus
 * words are worked out in the app from the accepted dictionary, not stored
 * in level files"). Uppercase, to match `Level.wheel` / `Level.grid`.
 */
export function bonusWords(pack: WordPack, trie: Trie, level: Level): string[] {
  const wheel = level.wheel.map((t) => t.toLowerCase());
  const gridWords = new Set(level.grid.words.map((w) => w.w.toLowerCase()));
  return trie
    .wordsFromTiles(wheel, 3)
    .filter((w) => !gridWords.has(w))
    .map((w) => w.toUpperCase());
}
