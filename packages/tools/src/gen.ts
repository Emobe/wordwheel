/**
 * Generates a pool of levels for one difficulty band and writes it to
 * data/build/pools/<lang>/band<N>.json. Deterministic: same seed + band +
 * count always produces the same pool.
 *
 * Usage: bun run generate -- --band 3 --count 1000 --seed en-band3
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CONFIG } from "../../core/src/config.js";
import { generateLevel } from "../../core/src/generator.js";
import { makeRng, seedFromString } from "../../core/src/prng.js";
import type { Level } from "../../core/src/types.js";
import { loadPack } from "./pack-loader.js";

interface Args {
  band: number;
  count: number;
  seed: string;
  out?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--band") args.band = Number(argv[++i]);
    else if (a === "--count") args.count = Number(argv[++i]);
    else if (a === "--seed") args.seed = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  return {
    band: args.band ?? 3,
    count: args.count ?? 1000,
    seed: args.seed ?? `en-band${args.band ?? 3}`,
    out: args.out,
  };
}

export async function generatePool(args: Args) {
  const { pack, trie, loadTimeMs } = await loadPack();
  const band = DEFAULT_CONFIG.bands.find((b) => b.band === args.band);
  if (!band) throw new Error(`Unknown band ${args.band}`);

  const rng = makeRng(seedFromString(args.seed));
  const levels: Level[] = [];
  const attemptTimes: number[] = [];
  let failures = 0;

  const genStart = performance.now();
  for (let i = 0; i < args.count; i++) {
    const t0 = performance.now();
    const id = `en-b${args.band}-${String(i).padStart(6, "0")}`;
    const level = generateLevel({ pack, trie, config: DEFAULT_CONFIG, band, rng, id });
    attemptTimes.push(performance.now() - t0);
    if (level) levels.push(level);
    else failures++;
  }
  const totalMs = performance.now() - genStart;

  const avgMs = attemptTimes.reduce((a, b) => a + b, 0) / attemptTimes.length;
  const successRate = (levels.length / args.count) * 100;

  console.log(`Pack load time: ${loadTimeMs.toFixed(1)} ms (${pack.accepted.length} accepted words)`);
  console.log(`Band ${args.band}: requested ${args.count}, generated ${levels.length}, failed ${failures}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%`);
  console.log(`Time per level: avg ${avgMs.toFixed(2)} ms, total ${totalMs.toFixed(0)} ms`);

  const repoRoot = path.resolve(import.meta.dir, "../../..");
  const outPath = args.out ?? path.join(repoRoot, "data", "build", "pools", "en", `band${args.band}.json`);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(levels));
  console.log(`Wrote ${levels.length} levels to ${outPath}`);

  return { levels, successRate, avgMs, outPath };
}

if (import.meta.main) {
  const args = parseArgs(process.argv.slice(2));
  generatePool(args).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
