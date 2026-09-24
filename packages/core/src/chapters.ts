/**
 * Plan.md section 11: level grouping for display only — level choice still
 * comes from the pools and the difficulty curve (level-selection.ts). Each
 * chapter names a paletteKey rather than colour values, since the actual
 * colours are a UI concern (apps/mobile/src/theme.ts), matching this
 * package's "no UI code" rule.
 */
export interface ChapterConfig {
  id: string;
  nameKey: string;
  startLevel: number;
  endLevel: number;
  paletteKey: string;
}

const CHAPTER_LENGTH = 25;
const CHAPTER_COUNT = 20; // covers levels 1-500; chapterForLevel() extends the pattern past this.
const PALETTE_COUNT = 5; // cycles through theme.ts's chapterPalettes

export const DEFAULT_CHAPTERS: ChapterConfig[] = Array.from({ length: CHAPTER_COUNT }, (_, i) => {
  const index = i + 1;
  const startLevel = i * CHAPTER_LENGTH + 1;
  return {
    id: `chapter-${index}`,
    nameKey: "chapter.name",
    startLevel,
    endLevel: startLevel + CHAPTER_LENGTH - 1,
    paletteKey: `palette-${(i % PALETTE_COUNT) + 1}`,
  };
});

/** Extends the same fixed-length chapter pattern past DEFAULT_CHAPTERS' precomputed list, so progression never runs out of chapters. */
export function chapterForLevel(levelNumber: number): ChapterConfig {
  const found = DEFAULT_CHAPTERS.find((c) => levelNumber >= c.startLevel && levelNumber <= c.endLevel);
  if (found) return found;
  const index = Math.floor((levelNumber - 1) / CHAPTER_LENGTH);
  const startLevel = index * CHAPTER_LENGTH + 1;
  return {
    id: `chapter-${index + 1}`,
    nameKey: "chapter.name",
    startLevel,
    endLevel: startLevel + CHAPTER_LENGTH - 1,
    paletteKey: `palette-${(index % PALETTE_COUNT) + 1}`,
  };
}
