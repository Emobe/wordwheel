import type { Trie } from './trie';

/** A target/grid-eligible word with its SCOWL size tier (lower = more common). */
export interface TargetWord {
  word: string;
  sizeTier: number;
}

/**
 * Everything the generator needs for one language. Built offline by
 * packages/tools and either passed in-process (tools) or loaded from a
 * shipped pack file (mobile app, later phases).
 */
export interface LanguagePack {
  lang: string;
  /** All words a player's entry is validated against. */
  accepted: Trie;
  /** Common/curated words eligible to become a wheel word or grid word. */
  targets: TargetWord[];
  profanity: ReadonlySet<string>;
}

export interface GridWordPlacement {
  word: string;
  x: number;
  y: number;
  dir: 'H' | 'V';
}

export interface LevelGrid {
  w: number;
  h: number;
  words: GridWordPlacement[];
}

export interface LevelFile {
  id: string;
  lang: string;
  seed: string;
  wheel: string[];
  grid: LevelGrid;
  difficulty: number;
  tier: number;
}

export interface TierBand {
  tier: number;
  levelRange: [number, number];
  wheelLen: [number, number];
  gridWords: [number, number];
  /** Maximum SCOWL size tier allowed for the wheel/grid words (rarity ceiling). */
  maxWordSize: number;
}
