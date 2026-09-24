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
 * Plan.md section 9: rank candidates by closeness to the target difficulty
 * and by how long since the player last saw their grid words/wheel, then
 * pick from the top few with a little randomness so two players don't get
 * identical runs. Excludes already-played levels; if that empties the pool
 * (a player has exhausted a band), falls back to allowing replays rather
 * than refusing to return a level.
 */
export function selectNextLevel(
  pool: readonly Level[],
  targetDifficulty: number,
  playedLevelIds: ReadonlySet<string>,
  seen: SeenHistory,
  rng: Rng,
  now: number = Date.now(),
): Level | null {
  if (pool.length === 0) return null;
  const unplayed = pool.filter((l) => !playedLevelIds.has(l.id));
  const candidates = unplayed.length > 0 ? unplayed : pool;

  const scored = candidates.map((level) => {
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
    return { level, rankScore };
  });

  scored.sort((a, b) => a.rankScore - b.rankScore);
  const top = scored.slice(0, Math.min(TOP_K, scored.length)).map((s) => s.level);
  return pick(rng, top);
}
