import {
  DEFAULT_CONFIG,
  DEFAULT_DIFFICULTY_CURVE,
  bandForLevel,
  chapterForLevel,
  makeRng,
  selectNextLevel,
  targetDifficultyForLevel,
  type Level,
} from "@word-wheel/core";
import { bonusWordsFor, poolLevels } from "../data/pools";
import { getPlayedLevelIds, getProgress, getSeenHistory, recordPlayedLevel, recordSeenWords, setLevel } from "../db/repository";

export interface CurrentLevel {
  level: Level;
  levelNumber: number;
  bonusWords: string[];
  chapter: ReturnType<typeof chapterForLevel>;
}

/**
 * Plan.md section 9: level number -> target difficulty (section 10's curve)
 * -> band's pool -> ranked candidate, picked with a little randomness
 * (section 9 step 4) so two players don't get identical runs — hence a
 * fresh, non-seeded Rng per call rather than packages/core's deterministic
 * generator-only seeding rule.
 */
export function pickCurrentLevel(lang: string): CurrentLevel | null {
  const progress = getProgress(lang);
  const band = bandForLevel(DEFAULT_CONFIG.bands, progress.level);
  const target = targetDifficultyForLevel(DEFAULT_CONFIG.bands, DEFAULT_DIFFICULTY_CURVE, progress.level);
  const pool = poolLevels(band.band);
  const played = getPlayedLevelIds(lang);
  const seen = getSeenHistory(lang);
  const rng = makeRng(Math.floor(Math.random() * 2 ** 31));

  const level = selectNextLevel(pool, target, played, seen, rng);
  if (!level) return null;
  return {
    level,
    levelNumber: progress.level,
    bonusWords: bonusWordsFor(level.id, band.band),
    chapter: chapterForLevel(progress.level),
  };
}

/** Records the level as played/seen and advances the player's level number for `lang`. */
export function completeLevel(lang: string, current: CurrentLevel) {
  recordPlayedLevel(lang, current.level.id);
  const baseWords = current.level.grid.words.map((w) => w.w.toLowerCase());
  const wheelKey = [...current.level.wheel].map((t) => t.toUpperCase()).sort().join("");
  recordSeenWords(lang, baseWords, wheelKey);
  setLevel(lang, current.levelNumber + 1);
}
