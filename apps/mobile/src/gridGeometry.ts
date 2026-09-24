import type { Grid, GridWordPlacement } from "@word-wheel/core";

/** Plan.md section 8: readability floor, and a ceiling so small grids don't
 * get stretched oversized on a big screen. */
export const MIN_TILE_SIZE = 28;
export const MAX_TILE_SIZE = 46;

/** Gap between tiles in dp — must match Grid.tsx's own `gap` constant. */
export const TILE_GAP = 2;

export function tileSize(grid: Grid, availableWidth: number, availableHeight: number): number {
  // Reserve room for the (n-1) gaps between tiles before dividing, otherwise
  // rows*size + (rows-1)*gap comes out larger than availableHeight (and
  // likewise for width) by (n-1)*gap — a real overflow source on its own,
  // on top of the MIN_TILE_SIZE floor forcing an even bigger one.
  const byWidth = (availableWidth - (grid.cols - 1) * TILE_GAP) / grid.cols;
  const byHeight = (availableHeight - (grid.rows - 1) * TILE_GAP) / grid.rows;
  const size = Math.min(byWidth, byHeight);
  return Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE_SIZE, size));
}

export interface GridCell {
  x: number;
  y: number;
  letter: string;
  wordIndices: number[];
}

/** Every filled cell in the grid, keyed by "x,y", each tagged with the placements it belongs to. */
export function gridCells(grid: Grid): Map<string, GridCell> {
  const cells = new Map<string, GridCell>();
  grid.words.forEach((p, wordIndex) => {
    for (let i = 0; i < p.w.length; i++) {
      const x = p.dir === "H" ? p.x + i : p.x;
      const y = p.dir === "H" ? p.y : p.y + i;
      const key = `${x},${y}`;
      const existing = cells.get(key);
      if (existing) {
        existing.wordIndices.push(wordIndex);
      } else {
        cells.set(key, { x, y, letter: p.w[i]!, wordIndices: [wordIndex] });
      }
    }
  });
  return cells;
}

export function cellsForWord(p: GridWordPlacement): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < p.w.length; i++) {
    cells.push(p.dir === "H" ? { x: p.x + i, y: p.y } : { x: p.x, y: p.y + i });
  }
  return cells;
}
