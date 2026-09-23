/**
 * Variety report (distinct grid words and distinct wheels, by base word,
 * per section 6) and a difficulty histogram, over a generated pool.
 */
import { DEFAULT_CONFIG } from "../../core/src/config.js";
import { resolveBaseWord } from "../../core/src/lemma.js";
import type { Level } from "../../core/src/types.js";
import { loadLevelsFromArgs } from "./cli-shared.js";
import { loadPack } from "./pack-loader.js";

function printHistogram(values: number[], buckets = 10): void {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / buckets || 1;
  const counts = new Array(buckets).fill(0);
  for (const v of values) {
    const idx = Math.min(buckets - 1, Math.floor((v - min) / width));
    counts[idx]++;
  }
  const maxCount = Math.max(...counts);
  for (let i = 0; i < buckets; i++) {
    const lo = (min + i * width).toFixed(1);
    const hi = (min + (i + 1) * width).toFixed(1);
    const barLen = Math.round((counts[i] / maxCount) * 40);
    const bar = "#".repeat(barLen);
    console.log(`${lo.padStart(7)} - ${hi.padStart(7)} | ${bar} ${counts[i]}`);
  }
}

async function main() {
  const { levels, poolPath } = await loadLevelsFromArgs(process.argv.slice(2), 0);
  const { pack } = await loadPack();
  const baseMap = pack.baseMap;

  console.log(`Report for ${poolPath} (${levels.length} levels)\n`);

  const distinctGridWordBases = new Set<string>();
  const distinctWheels = new Set<string>();
  for (const level of levels as Level[]) {
    for (const w of level.grid.words) {
      distinctGridWordBases.add(resolveBaseWord(w.w.toLowerCase(), baseMap));
    }
    distinctWheels.add([...level.wheel].map((t) => t.toLowerCase()).sort().join(""));
  }

  console.log("=== Variety ===");
  console.log(`Distinct grid words (by base word): ${distinctGridWordBases.size}`);
  console.log(`Distinct wheels (by letter multiset): ${distinctWheels.size}`);
  console.log(`Levels: ${levels.length}\n`);

  console.log("=== Difficulty histogram ===");
  const difficulties = (levels as Level[]).map((l) => l.difficulty);
  if (difficulties.length > 0) {
    printHistogram(difficulties);
    const avg = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
    console.log(`\nmin ${Math.min(...difficulties).toFixed(1)}  max ${Math.max(...difficulties).toFixed(1)}  avg ${avg.toFixed(1)}`);
  } else {
    console.log("(no levels)");
  }

  console.log("\n=== Grid size limits check (section 8) ===");
  let violations = 0;
  for (const level of levels as Level[]) {
    const limit = DEFAULT_CONFIG.gridSizeLimits.find(
      (l) => level.wheel.length >= l.wheelMin && level.wheel.length <= l.wheelMax,
    );
    if (!limit) {
      violations++;
      console.log(`  VIOLATION: ${level.id} has wheel size ${level.wheel.length}, no matching size limit in config`);
      continue;
    }
    if (level.grid.cols > limit.maxCols || level.grid.rows > limit.maxRows) {
      violations++;
      console.log(`  VIOLATION: ${level.id} is ${level.grid.cols}x${level.grid.rows}, wheel size ${level.wheel.length}`);
    }
  }
  console.log(violations === 0 ? "All levels within size limits." : `${violations} level(s) violate size limits.`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
