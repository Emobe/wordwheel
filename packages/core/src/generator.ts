import { scoreDifficulty, tierForLevel } from './difficulty';
import { GridBuilder } from './layout';
import { lemmatize } from './lemma';
import { Rng } from './prng';
import type { LanguagePack, LevelFile, TargetWord } from './types';

export interface GenerateOptions {
  seed: string | number;
  levelNumber: number;
}

/** How many (wheel word, layout) attempts before giving up on this seed's level. */
const MAX_ATTEMPTS = 12;

function letterMultiset(word: string): string[] {
  return word.toUpperCase().split('');
}

function isProfane(word: string, profanity: ReadonlySet<string>): boolean {
  return profanity.has(word.toLowerCase());
}

/**
 * One attempt: pick a wheel word, find everything spellable from it, choose
 * grid words respecting lemma uniqueness, lay out the grid, validate every
 * invariant. Returns null if this attempt fails (caller retries with a
 * different sub-seed).
 */
function attemptLevel(pack: LanguagePack, rng: Rng, levelNumber: number): LevelFile | null {
  const band = tierForLevel(levelNumber);

  const wheelCandidates = pack.targets.filter(
    (t) =>
      t.word.length >= band.wheelLen[0] &&
      t.word.length <= band.wheelLen[1] &&
      t.sizeTier <= band.maxWordSize,
  );
  if (wheelCandidates.length === 0) return null;
  const wheelEntry = rng.pick(wheelCandidates);
  const wheelWord = wheelEntry.word;
  const wheelLetters = letterMultiset(wheelWord);

  if (isProfane(wheelWord, pack.profanity)) return null;

  const spellable = pack.accepted.wordsFromLetters(
    wheelLetters.map((c) => c.toLowerCase()),
    3,
  );
  const spellableSet = new Set(spellable);

  const targetsByWord = new Map<string, TargetWord>(pack.targets.map((t) => [t.word, t]));
  const gridCandidates = spellable
    .filter((w) => targetsByWord.has(w) && targetsByWord.get(w)!.sizeTier <= band.maxWordSize)
    .filter((w) => !isProfane(w, pack.profanity));

  if (!gridCandidates.includes(wheelWord) && spellableSet.has(wheelWord)) {
    gridCandidates.push(wheelWord);
  }

  // Longest first: gives the layout algorithm the best anchor and the most
  // crossing opportunities for what follows.
  const ordered = rng.shuffle(gridCandidates).sort((a, b) => b.length - a.length);

  const chosen: string[] = [];
  const usedLemmas = new Set<string>();
  const targetCount = rng.range(band.gridWords[0], band.gridWords[1]);

  for (const word of ordered) {
    if (chosen.length >= targetCount) break;
    const lemma = lemmatize(word);
    if (usedLemmas.has(lemma)) continue;
    usedLemmas.add(lemma);
    chosen.push(word);
  }

  if (chosen.length < band.gridWords[0]) return null;

  const grid = new GridBuilder();
  grid.placeFirst(chosen[0]!, 'H');
  const placed = [chosen[0]!];
  let leftover = chosen.slice(1);

  for (let pass = 0; pass < 2 && leftover.length > 0; pass++) {
    const stillLeftover: string[] = [];
    for (const word of leftover) {
      if (grid.tryPlaceCrossing(word, rng)) {
        placed.push(word);
      } else {
        stillLeftover.push(word);
      }
    }
    leftover = stillLeftover;
  }

  if (placed.length < band.gridWords[0]) return null;
  if (!grid.isConnected()) return null;
  if (!grid.hasOnlyIntendedWords()) return null;

  const levelGrid = grid.toLevelGrid();
  const inflectedCount = placed.filter((w) => lemmatize(w) !== w.toLowerCase()).length;

  const difficulty = scoreDifficulty({
    wheelLen: wheelWord.length,
    gridWords: levelGrid.words,
    wordSizeTiers: new Map(pack.targets.map((t) => [t.word, t.sizeTier])),
    inflectedCount,
    requiresFullWheelWord: placed.includes(wheelWord),
    gridW: levelGrid.w,
    gridH: levelGrid.h,
    crossingCount: grid.crossingCount(),
  });

  return {
    id: '', // filled in by the caller, which knows the running index
    lang: pack.lang,
    seed: '', // filled in by generateLevel, which knows the attempt's exact seed
    wheel: wheelLetters,
    grid: levelGrid,
    difficulty,
    tier: band.tier,
  };
}

export function generateLevel(
  pack: LanguagePack,
  opts: GenerateOptions,
): { level: LevelFile; attempts: number } | null {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`);
    const level = attemptLevel(pack, rng, opts.levelNumber);
    if (level) {
      return { level: { ...level, seed: `${opts.seed}:${attempt}` }, attempts: attempt + 1 };
    }
  }
  return null;
}

/** Every accepted word spellable from the wheel, minus the words already placed in the grid. */
export function bonusWords(pack: LanguagePack, level: LevelFile): string[] {
  const placed = new Set(level.grid.words.map((w) => w.word));
  const spellable = pack.accepted.wordsFromLetters(
    level.wheel.map((c) => c.toLowerCase()),
    3,
  );
  return spellable.filter((w) => !placed.has(w));
}
