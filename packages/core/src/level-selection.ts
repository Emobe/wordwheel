import type { Level } from "./types.js";
import type { Rng } from "./prng.js";
import { pick } from "./prng.js";

/** How long ago (in ms, e.g. Date.now() at call time) a base word or wheel was last seen, keyed by base word / letter-multiset. Absent = never seen. */
export interface SeenHistory {
  baseWordLastSeen: ReadonlyMap<string, number>;
  wheelLastSeen: ReadonlyMap<string, number>;
}

const TOP_K = 5;

function wheelKey(level: Level): string {
  return [...level.wheel].map((t) => t.toUpperCase()).sort().join("");
}

/**
 * Plan.md section 9: rank candidates with unplayed levels first, then by how
 * long since each was last played (oldest first). There is no separate
 * "pool exhausted" state: once every level has been played, the same ranking
 * simply surfaces replays. Within the same rank, order by closeness to the
 * target difficulty and by how long since the player last saw the grid words
 * and wheel. Then pick from the top few with a little randomness so two
 * players don't get identical runs and replays don't repeat in a fixed order.
 *
 * `lastPlayedAt` maps level id -> timestamp (ms) it was last completed;
 * absent = never played. Unplayed levels always outrank played ones, so the
 * top-few window never mixes a replay in while an unplayed level remains.
 */
export function selectNextLevel(
  pool: readonly Level[],
  targetDifficulty: number,
  lastPlayedAt: ReadonlyMap<string, number>,
  seen: SeenHistory,
  rng: Rng,
  now: number = Date.now(),
): Level | null {
  if (pool.length === 0) return null;
  const scored = pool.map((level) => {
    const difficultyGap = Math.abs(level.difficulty - targetDifficulty);
    const wheelAge = now - (seen.wheelLastSeen.get(wheelKey(level)) ?? 0);
    const baseWordAges = level.grid.words.map(
      (w) => now - (seen.baseWordLastSeen.get(w.w.toLowerCase()) ?? 0),
    );
    const avgBaseWordAge =
      baseWordAges.length > 0 ? baseWordAges.reduce((a, b) => a + b, 0) / baseWordAges.length : 0;
    // Variety score: higher is more "fresh" (longer since last seen, or never seen).
    // Combined with difficulty closeness (lower gap is better) into one rank score
    // where lower is better, normalizing the two very differently-scaled terms by
    // capping recency's contribution rather than letting raw ms dominate.
    const recencyScore = Math.min(1, (wheelAge + avgBaseWordAge) / (2 * 30 * 24 * 60 * 60 * 1000)); // saturates at ~30 days
    const rankScore = difficultyGap - recencyScore * 20;
    const playedAt = lastPlayedAt.get(level.id) ?? -Infinity;
    return { level, rankScore, playedAt };
  });

  // Primary: unplayed (-Infinity) first, then oldest-played. Secondary: difficulty/variety score.
  scored.sort((a, b) => (a.playedAt === b.playedAt ? 0 : a.playedAt < b.playedAt ? -1 : 1) || a.rankScore - b.rankScore);
  const window = scored.slice(0, Math.min(TOP_K, scored.length));
  const unplayedFirst = window[0]!.playedAt === -Infinity;
  const top = (unplayedFirst ? window.filter((s) => s.playedAt === -Infinity) : window).map((s) => s.level);
  return pick(rng, top);
}
