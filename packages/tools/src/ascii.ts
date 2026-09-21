import type { LevelFile } from '@wordscapes/core';

export function renderAscii(level: LevelFile): string {
  const grid: string[][] = Array.from({ length: level.grid.h }, () =>
    Array(level.grid.w).fill('.'),
  );

  for (const { word, x, y, dir } of level.grid.words) {
    for (let i = 0; i < word.length; i++) {
      const cx = dir === 'H' ? x + i : x;
      const cy = dir === 'H' ? y : y + i;
      grid[cy]![cx] = word[i]!.toUpperCase();
    }
  }

  const wheel = `wheel: ${level.wheel.join('')}  (tier ${level.tier}, difficulty ${level.difficulty})`;
  const rows = grid.map((row) => row.join(' '));
  return [wheel, ...rows].join('\n');
}
