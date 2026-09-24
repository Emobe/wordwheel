/**
 * Bundles a real slice of each band's pool (not just one level) into the
 * mobile app as static JSON, with each level's bonus-word set precomputed
 * offline using the same trie/dictionary logic the generator itself uses.
 * This avoids shipping the full 10.7 MB accepted dictionary into the app —
 * see CLAUDE.md's "Known gaps" on dictionary load time/format, which this
 * sidesteps rather than solves — while still giving Phase 2's level
 * selection (packages/core/src/level-selection.ts) a real pool to rank
 * against instead of a single fixed level per band.
 *
 * LEVELS_PER_BAND is a Phase 2 placeholder for what Plan.md section 20 flags
 * as an unverified spike ("pool size needed per band, and its download
 * size") — not solved here, just picked small enough to keep the app bundle
 * and this script's runtime reasonable.
 *
 * Usage: bun run packages/tools/src/mobile-fixtures.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { bonusWords } from "../../core/src/generator.js";
import type { Level } from "../../core/src/types.js";
import { loadPack } from "./pack-loader.js";

const BANDS = [1, 2, 3, 4, 5];
const LEVELS_PER_BAND = 100;

async function main() {
  const { pack, trie } = await loadPack();
  const repoRoot = path.resolve(import.meta.dir, "../../..");
  const outDir = path.join(repoRoot, "apps", "mobile", "src", "data");

  for (const band of BANDS) {
    const poolPath = path.join(repoRoot, "data", "build", "pools", "en", `band${band}.json`);
    const raw = await readFile(poolPath, "utf8");
    const levels = JSON.parse(raw) as Level[];
    const slice = levels.slice(0, LEVELS_PER_BAND);
    if (slice.length === 0) throw new Error(`No levels in ${poolPath}`);

    const fixtures = slice.map((level) => ({ level, bonusWords: bonusWords(pack, trie, level) }));
    const outPath = path.join(outDir, `pool-band${band}.json`);
    await writeFile(outPath, JSON.stringify(fixtures));
    const totalBonusWords = fixtures.reduce((sum, f) => sum + f.bonusWords.length, 0);
    console.log(
      `band ${band}: ${fixtures.length} levels, ${totalBonusWords} total bonus words, ` +
        `${(JSON.stringify(fixtures).length / 1024).toFixed(0)} KB -> ${outPath}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
