import { describe, expect, test } from 'bun:test';
import { GridBuilder } from './layout';
import { Rng } from './prng';

describe('GridBuilder', () => {
  test('places a crossing word and stays connected', () => {
    const grid = new GridBuilder();
    grid.placeFirst('stare', 'H');
    const placed = grid.tryPlaceCrossing('tars', new Rng('t'));
    expect(placed).toBe(true);
    expect(grid.isConnected()).toBe(true);
    expect(grid.hasOnlyIntendedWords()).toBe(true);
  });

  test('refuses a word that shares no letter with the grid', () => {
    const grid = new GridBuilder();
    grid.placeFirst('stare', 'H');
    const placed = grid.tryPlaceCrossing('bulk', new Rng('b'));
    expect(placed).toBe(false);
  });

  test('refuses a placement that would run two words directly adjacent', () => {
    const grid = new GridBuilder();
    grid.placeFirst('cat', 'H'); // (0,0)-(2,0)
    // "cats" placed vertically through the 'c' at (0,0) going down would put
    // an 'a' at (0,1) directly under 't' at (1,0) — fine — but a word placed
    // to run parallel one row below without crossing must be rejected.
    const rng = new Rng('adjacency');
    for (let i = 0; i < 20; i++) {
      grid.tryPlaceCrossing('art', rng);
    }
    expect(grid.hasOnlyIntendedWords()).toBe(true);
  });

  test('toLevelGrid normalises coordinates to start at (0,0)', () => {
    const grid = new GridBuilder();
    grid.placeFirst('stare', 'H');
    grid.tryPlaceCrossing('tars', new Rng('norm'));
    const level = grid.toLevelGrid();
    for (const w of level.words) {
      expect(w.x).toBeGreaterThanOrEqual(0);
      expect(w.y).toBeGreaterThanOrEqual(0);
    }
    expect(level.w).toBeGreaterThan(0);
    expect(level.h).toBeGreaterThan(0);
  });
});
