/** A single wheel tile. Always a plain uppercase A-Z letter for the English pack. */
export type Tile = string;

export type Direction = "H" | "V";

export interface GridWordPlacement {
  w: string;
  x: number;
  y: number;
  dir: Direction;
  coins: boolean;
}

export interface Grid {
  cols: number;
  rows: number;
  words: GridWordPlacement[];
}

export interface Level {
  id: string;
  lang: string;
  packVersion: number;
  band: number;
  wheel: Tile[];
  grid: Grid;
  difficulty: number;
}

/** SCOWL-derived commonness tier. Lower = more common (SCOWL list size, e.g. 10, 20, 35 ... 95). */
export type CommonnessRank = number;

export interface GridWordEntry {
  word: string;
  rank: CommonnessRank;
}

export interface WordPackLicense {
  source: string;
  notice: string;
}

export interface WordPack {
  lang: string;
  version: number;
  /** All accepted (bonus-eligible) words, lowercase, letters only, length >= 3. */
  accepted: string[];
  /** Wide list of grid-eligible words with their commonness rank. */
  gridWords: GridWordEntry[];
  /** word -> base word, only present when they differ. */
  baseMap: Record<string, string>;
  license: WordPackLicense[];
}

export interface DifficultyBand {
  band: number;
  minLevel: number;
  maxLevel: number;
  wheelMin: number;
  wheelMax: number;
  gridWordsMin: number;
  gridWordsMax: number;
  /** Max SCOWL rank allowed for the rarest required grid word in this band. */
  maxRarestRank: CommonnessRank;
}

export interface GridSizeLimit {
  wheelMin: number;
  wheelMax: number;
  maxCols: number;
  maxRows: number;
}

export interface GeneratorConfig {
  bands: DifficultyBand[];
  gridSizeLimits: GridSizeLimit[];
  /** rows <= shapeRowsFactor * cols */
  shapeRowsFactor: number;
  /** cols <= shapeColsFactor * rows */
  shapeColsFactor: number;
  maxAttemptsPerLevel: number;
}
