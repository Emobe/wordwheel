import type { Direction, Grid, GridWordPlacement } from "./types.js";

interface Cell {
  x: number;
  y: number;
}

export interface PlacedWord {
  w: string;
  x: number;
  y: number;
  dir: Direction;
}

interface LayoutResult {
  grid: Grid;
  score: number;
}

interface LayoutOptions {
  maxCols: number;
  maxRows: number;
  shapeRowsFactor: number;
  shapeColsFactor: number;
}

function cellsOf(p: PlacedWord): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < p.w.length; i++) {
    cells.push(p.dir === "H" ? { x: p.x + i, y: p.y } : { x: p.x, y: p.y + i });
  }
  return cells;
}

function letterAt(placed: PlacedWord[], x: number, y: number): string | null {
  for (const p of placed) {
    if (p.dir === "H" && y === p.y && x >= p.x && x < p.x + p.w.length) {
      return p.w[x - p.x]!;
    }
    if (p.dir === "V" && x === p.x && y >= p.y && y < p.y + p.w.length) {
      return p.w[y - p.y]!;
    }
  }
  return null;
}

/** True if placing `p` would touch (side-adjacent, non-crossing) an existing word's cell. */
export function hasIllegalAdjacency(placed: PlacedWord[], candidate: PlacedWord): boolean {
  const candidateCells = new Set(cellsOf(candidate).map((c) => `${c.x},${c.y}`));
  for (const cell of cellsOf(candidate)) {
    // A cell that already holds a crossing letter is the intersection point:
    // its side neighbors are naturally the crossed word's own body, not an
    // illegal touch, so skip the adjacency check there.
    if (letterAt(placed, cell.x, cell.y) !== null) continue;
    const neighbors: Cell[] =
      candidate.dir === "H"
        ? [
            { x: cell.x, y: cell.y - 1 },
            { x: cell.x, y: cell.y + 1 },
          ]
        : [
            { x: cell.x - 1, y: cell.y },
            { x: cell.x + 1, y: cell.y },
          ];
    // Also guard the two ends of the word so words don't butt up end-to-end.
    neighbors.push(
      candidate.dir === "H" ? { x: cell.x - 1, y: cell.y } : { x: cell.x, y: cell.y - 1 },
      candidate.dir === "H" ? { x: cell.x + 1, y: cell.y } : { x: cell.x, y: cell.y + 1 },
    );
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (candidateCells.has(key)) continue;
      if (letterAt(placed, n.x, n.y) !== null) return true;
    }
  }
  return false;
}

/**
 * Same-direction words must never share a cell: a shorter word "crossing" a
 * longer one in the same direction (e.g. MOT sitting inside MOTIVE) would be
 * indistinguishable from the longer word on the grid. Only perpendicular
 * crossings may share cells.
 */
function hasSameDirectionOverlap(placed: PlacedWord[], candidate: PlacedWord): boolean {
  const candidateCells = new Set(cellsOf(candidate).map((c) => `${c.x},${c.y}`));
  for (const p of placed) {
    if (p.dir !== candidate.dir) continue;
    for (const c of cellsOf(p)) {
      if (candidateCells.has(`${c.x},${c.y}`)) return true;
    }
  }
  return false;
}

/** True if any cell of `candidate` overlaps an existing letter that disagrees with it. */
function hasConflict(placed: PlacedWord[], candidate: PlacedWord): boolean {
  for (let i = 0; i < candidate.w.length; i++) {
    const x = candidate.dir === "H" ? candidate.x + i : candidate.x;
    const y = candidate.dir === "H" ? candidate.y : candidate.y + i;
    const existing = letterAt(placed, x, y);
    if (existing !== null && existing !== candidate.w[i]) return true;
  }
  return false;
}

function crossingsOf(placed: PlacedWord[], candidate: PlacedWord): number {
  let crossings = 0;
  for (const cell of cellsOf(candidate)) {
    if (letterAt(placed, cell.x, cell.y) !== null) crossings++;
  }
  return crossings;
}

function fitsSize(minX: number, maxX: number, minY: number, maxY: number, opts: LayoutOptions): boolean {
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  if (cols > opts.maxCols || rows > opts.maxRows) return false;
  if (rows > opts.shapeRowsFactor * cols) return false;
  if (cols > opts.shapeColsFactor * rows) return false;
  return true;
}

function bounds(placed: PlacedWord[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of placed) {
    for (const c of cellsOf(p)) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Places every word in `words` (longest first) into a crossword grid,
 * backtracking on the remaining words when a placement leaves later words
 * unable to fit. Returns null if no full placement satisfies the size
 * limits and connectivity/adjacency rules within a bounded search.
 *
 * Words are deduplicated by exact string; the caller is responsible for not
 * passing two forms of the same base word (validated separately).
 */
export function layoutGrid(words: readonly string[], opts: LayoutOptions): LayoutResult | null {
  const ordered = [...words].sort((a, b) => b.length - a.length);
  const first = ordered[0];
  if (!first) return null;

  let best: { placed: PlacedWord[] } | null = null;
  const MAX_NODES = 20000;
  let nodes = 0;

  function tryPlace(placed: PlacedWord[], remaining: string[]): boolean {
    nodes++;
    if (nodes > MAX_NODES) return false;
    if (remaining.length === 0) {
      best = { placed: placed.map((p) => ({ ...p })) };
      return true;
    }

    const word = remaining[0]!;
    const rest = remaining.slice(1);
    // `placed` always has at least the first word (layoutGrid seeds it below),
    // so every candidate here is a crossing against something already placed.
    const candidates: PlacedWord[] = [];
    for (const p of placed) {
      for (let i = 0; i < p.w.length; i++) {
        const pChar = p.w[i]!;
        for (let j = 0; j < word.length; j++) {
          if (word[j] !== pChar) continue;
          const dir: Direction = p.dir === "H" ? "V" : "H";
          const x = dir === "H" ? p.x - j : p.x + i;
          const y = dir === "H" ? p.y + i : p.y - j;
          candidates.push({ w: word, x, y, dir });
        }
      }
    }

    // Prefer placements with more crossings first (denser, more compact grids).
    candidates.sort((a, b) => crossingsOf(placed, b) - crossingsOf(placed, a));

    for (const candidate of candidates) {
      if (hasSameDirectionOverlap(placed, candidate)) continue;
      if (hasConflict(placed, candidate)) continue;
      if (crossingsOf(placed, candidate) === 0) continue; // must connect to an existing word
      if (hasIllegalAdjacency(placed, candidate)) continue;

      const trial = [...placed, candidate];
      const b = bounds(trial);
      if (!fitsSize(b.minX, b.maxX, b.minY, b.maxY, opts)) continue;

      if (tryPlace(trial, rest)) return true;
      if (nodes > MAX_NODES) return false;
    }
    return false;
  }

  const ok = tryPlace([{ w: first, x: 0, y: 0, dir: "H" }], ordered.slice(1));
  if (!ok || !best) return null;

  const placed = (best as { placed: PlacedWord[] }).placed;
  const b = bounds(placed);
  const cols = b.maxX - b.minX + 1;
  const rows = b.maxY - b.minY + 1;

  const gridWords: GridWordPlacement[] = placed.map((p) => ({
    w: p.w,
    x: p.x - b.minX,
    y: p.y - b.minY,
    dir: p.dir,
    coins: false,
  }));

  const totalCrossings = placed.reduce((sum, p, i) => {
    if (i === 0) return sum;
    return sum + crossingsOf(placed.slice(0, i), p);
  }, 0);

  const area = cols * rows;
  const filledCells = new Set(placed.flatMap((p) => cellsOf(p).map((c) => `${c.x},${c.y}`))).size;
  const compactness = filledCells / area;
  const score = compactness * 2 + totalCrossings * 3 - Math.abs(cols - rows) * 0.1;

  return { grid: { cols, rows, words: gridWords }, score };
}

/** True if every grid word's cells connect (directly or transitively via crossings) into one group. */
export function isConnected(grid: Grid): boolean {
  if (grid.words.length <= 1) return true;
  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < grid.words.length; i++) adj.set(i, new Set());

  const cellsFor = (p: GridWordPlacement): Cell[] => {
    const cells: Cell[] = [];
    for (let i = 0; i < p.w.length; i++) {
      cells.push(p.dir === "H" ? { x: p.x + i, y: p.y } : { x: p.x, y: p.y + i });
    }
    return cells;
  };

  for (let i = 0; i < grid.words.length; i++) {
    for (let j = i + 1; j < grid.words.length; j++) {
      const a = new Set(cellsFor(grid.words[i]!).map((c) => `${c.x},${c.y}`));
      const b = cellsFor(grid.words[j]!);
      if (b.some((c) => a.has(`${c.x},${c.y}`))) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
      }
    }
  }

  const visited = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const next of adj.get(cur)!) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return visited.size === grid.words.length;
}

/**
 * Scans every empty-adjacent run of filled cells (horizontal and vertical)
 * and returns any that form a word not in `intendedWords` — i.e. an
 * accidental word created by adjacent tiles, per section 7's validation.
 */
export function findAccidentalWords(
  grid: Grid,
  intendedWords: ReadonlySet<string>,
  isWord: (w: string) => boolean,
): string[] {
  const cellMap = new Map<string, string>();
  for (const p of grid.words) {
    for (let i = 0; i < p.w.length; i++) {
      const x = p.dir === "H" ? p.x + i : p.x;
      const y = p.dir === "H" ? p.y : p.y + i;
      cellMap.set(`${x},${y}`, p.w[i]!);
    }
  }

  const accidental = new Set<string>();

  function scanLine(getChar: (i: number) => string | undefined, length: number) {
    let run = "";
    for (let i = 0; i <= length; i++) {
      const ch = i < length ? getChar(i) : undefined;
      if (ch) {
        run += ch;
      } else {
        if (run.length >= 3 && !intendedWords.has(run) && isWord(run)) accidental.add(run);
        run = "";
      }
    }
  }

  for (let y = 0; y < grid.rows; y++) {
    scanLine((x) => cellMap.get(`${x},${y}`), grid.cols);
  }
  for (let x = 0; x < grid.cols; x++) {
    scanLine((y) => cellMap.get(`${x},${y}`), grid.rows);
  }

  return [...accidental];
}
