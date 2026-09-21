import type { Rng } from './prng';
import type { GridWordPlacement } from './types';

interface Cell {
  ch: string;
}

/**
 * A crossword-style grid under construction. Coordinates are unbounded
 * integers (can go negative); normalised to a 0-based w/h box on export.
 */
export class GridBuilder {
  private cells = new Map<string, Cell>();
  private placements: GridWordPlacement[] = [];

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }

  get words(): readonly GridWordPlacement[] {
    return this.placements;
  }

  isEmpty(): boolean {
    return this.placements.length === 0;
  }

  private at(x: number, y: number): string | undefined {
    return this.cells.get(this.key(x, y))?.ch;
  }

  /** Try to place `word` crossing an already-placed word. Returns true on success. */
  tryPlaceCrossing(word: string, rng: Rng): boolean {
    const candidates: { x: number; y: number; dir: 'H' | 'V' }[] = [];

    for (let i = 0; i < word.length; i++) {
      const ch = word[i]!;
      for (const placed of this.placements) {
        for (let j = 0; j < placed.word.length; j++) {
          if (placed.word[j] !== ch) continue;
          if (placed.dir === 'H') {
            candidates.push({ x: placed.x + j, y: placed.y - i, dir: 'V' });
          } else {
            candidates.push({ x: placed.x - i, y: placed.y + j, dir: 'H' });
          }
        }
      }
    }

    for (const candidate of rng.shuffle(candidates)) {
      if (this.canPlace(word, candidate.x, candidate.y, candidate.dir)) {
        this.place(word, candidate.x, candidate.y, candidate.dir);
        return true;
      }
    }
    return false;
  }

  placeFirst(word: string, dir: 'H' | 'V' = 'H'): void {
    this.place(word, 0, 0, dir);
  }

  private canPlace(word: string, x: number, y: number, dir: 'H' | 'V'): boolean {
    const dx = dir === 'H' ? 1 : 0;
    const dy = dir === 'H' ? 0 : 1;

    // Cell immediately before the start and after the end must be empty,
    // otherwise this word would silently extend an existing word.
    const beforeX = x - dx;
    const beforeY = y - dy;
    const afterX = x + dx * word.length;
    const afterY = y + dy * word.length;
    if (this.at(beforeX, beforeY) !== undefined) return false;
    if (this.at(afterX, afterY) !== undefined) return false;

    let hasCrossing = false;
    for (let i = 0; i < word.length; i++) {
      const cx = x + dx * i;
      const cy = y + dy * i;
      const existing = this.at(cx, cy);
      if (existing !== undefined) {
        if (existing !== word[i]) return false;
        hasCrossing = true;
        continue;
      }
      // A fresh cell must not sit directly beside another letter in the
      // perpendicular direction, or two parallel words would touch without
      // an actual crossing (an accidental extra word).
      const px = cx + dy;
      const py = cy + dx;
      const nx = cx - dy;
      const ny = cy - dx;
      if (this.at(px, py) !== undefined || this.at(nx, ny) !== undefined) return false;
    }
    return hasCrossing;
  }

  private place(word: string, x: number, y: number, dir: 'H' | 'V'): void {
    const dx = dir === 'H' ? 1 : 0;
    const dy = dir === 'H' ? 0 : 1;
    for (let i = 0; i < word.length; i++) {
      this.cells.set(this.key(x + dx * i, y + dy * i), { ch: word[i]! });
    }
    this.placements.push({ word, x, y, dir });
  }

  /** Number of placements sharing at least one cell with another placement. */
  crossingCount(): number {
    let count = 0;
    for (let a = 0; a < this.placements.length; a++) {
      for (let b = a + 1; b < this.placements.length; b++) {
        if (this.share(this.placements[a]!, this.placements[b]!)) count++;
      }
    }
    return count;
  }

  private share(a: GridWordPlacement, b: GridWordPlacement): boolean {
    const cellsOf = (p: GridWordPlacement) => {
      const dx = p.dir === 'H' ? 1 : 0;
      const dy = p.dir === 'H' ? 0 : 1;
      const set = new Set<string>();
      for (let i = 0; i < p.word.length; i++) set.add(this.key(p.x + dx * i, p.y + dy * i));
      return set;
    };
    const cellsA = cellsOf(a);
    for (const c of cellsOf(b)) {
      if (cellsA.has(c)) return true;
    }
    return false;
  }

  /** True if every placed word connects to every other via shared cells. */
  isConnected(): boolean {
    if (this.placements.length <= 1) return true;
    const visited = new Set<number>([0]);
    const queue = [0];
    while (queue.length > 0) {
      const i = queue.pop()!;
      for (let j = 0; j < this.placements.length; j++) {
        if (visited.has(j)) continue;
        if (this.share(this.placements[i]!, this.placements[j]!)) {
          visited.add(j);
          queue.push(j);
        }
      }
    }
    return visited.size === this.placements.length;
  }

  /**
   * Scan every maximal horizontal/vertical run of letters and confirm it
   * matches an intended placement exactly. Catches accidental adjacent
   * words that the placement-time neighbour check might still miss (e.g.
   * runs formed purely by crossings).
   */
  hasOnlyIntendedWords(): boolean {
    const intended = new Set(this.placements.map((p) => `${p.dir}:${p.x},${p.y}:${p.word}`));

    const xs = [...this.cells.keys()].map((k) => Number.parseInt(k.split(',')[0]!, 10));
    const ys = [...this.cells.keys()].map((k) => Number.parseInt(k.split(',')[1]!, 10));
    if (xs.length === 0) return true;
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minY = Math.min(...ys) - 1;
    const maxY = Math.max(...ys) + 1;

    for (let y = minY; y <= maxY; y++) {
      let run = '';
      let startX = minX;
      for (let x = minX; x <= maxX + 1; x++) {
        const ch = this.at(x, y);
        if (ch !== undefined) {
          if (run === '') startX = x;
          run += ch;
        } else {
          if (run.length >= 2 && !intended.has(`H:${startX},${y}:${run}`)) return false;
          run = '';
        }
      }
    }
    for (let x = minX; x <= maxX; x++) {
      let run = '';
      let startY = minY;
      for (let y = minY; y <= maxY + 1; y++) {
        const ch = this.at(x, y);
        if (ch !== undefined) {
          if (run === '') startY = y;
          run += ch;
        } else {
          if (run.length >= 2 && !intended.has(`V:${x},${startY}:${run}`)) return false;
          run = '';
        }
      }
    }
    return true;
  }

  /** Export as a 0-based w/h grid, normalising placement coordinates. */
  toLevelGrid(): { w: number; h: number; words: GridWordPlacement[] } {
    const xs = this.placements.map((p) => p.x);
    const ys = this.placements.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const words = this.placements.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY }));
    const maxX = Math.max(...words.map((p) => p.x + (p.dir === 'H' ? p.word.length - 1 : 0)));
    const maxY = Math.max(...words.map((p) => p.y + (p.dir === 'V' ? p.word.length - 1 : 0)));
    return { w: maxX + 1, h: maxY + 1, words };
  }
}
