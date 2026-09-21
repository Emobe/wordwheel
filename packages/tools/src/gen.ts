import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateLevel, lemmatize } from '@wordscapes/core';
import type { LevelFile } from '@wordscapes/core';
import { renderAscii } from './ascii';
import { loadLanguagePack } from './pack-loader';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');

interface Args {
  lang: string;
  count: number;
  report: boolean;
  seed: string;
  ascii: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { lang: 'en', count: 100, report: false, seed: 'wordscapes', ascii: 0 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lang') args.lang = argv[++i]!;
    else if (arg === '--count') args.count = Number.parseInt(argv[++i]!, 10);
    else if (arg === '--report') args.report = true;
    else if (arg === '--seed') args.seed = argv[++i]!;
    else if (arg === '--ascii') args.ascii = Number.parseInt(argv[++i] ?? '3', 10);
  }
  return args;
}

function wheelKey(level: LevelFile): string {
  return level.wheel.slice().sort().join('');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Generating ${args.count} levels for lang=${args.lang} seed=${args.seed}...`);

  const pack = await loadLanguagePack(args.lang);

  const levels: LevelFile[] = [];
  let failures = 0;
  let totalAttempts = 0;
  const start = performance.now();

  for (let n = 1; n <= args.count; n++) {
    const result = generateLevel(pack, { seed: `${args.seed}-${n}`, levelNumber: n });
    if (!result) {
      failures++;
      continue;
    }
    totalAttempts += result.attempts;
    const level = {
      ...result.level,
      id: `${args.lang}-${String(levels.length + 1).padStart(6, '0')}`,
    };
    levels.push(level);
  }

  const elapsedMs = performance.now() - start;

  const outDir = join(REPO_ROOT, 'data', 'build', 'levels');
  await mkdir(outDir, { recursive: true });
  const outFile = join(outDir, `${args.lang}.json`);
  await writeFile(outFile, JSON.stringify(levels, null, 2));
  console.log(`Wrote ${levels.length} levels to ${outFile}`);

  if (args.ascii > 0) {
    console.log('\nSample grids:');
    const rng = [...levels].sort(() => 0.5 - Math.random()).slice(0, args.ascii);
    for (const level of rng) {
      console.log(`\n--- ${level.id} ---`);
      console.log(renderAscii(level));
    }
  }

  if (args.report) {
    printReport(levels, args.count, failures, totalAttempts, elapsedMs);
  }
}

function printReport(
  levels: LevelFile[],
  requested: number,
  failures: number,
  totalAttempts: number,
  elapsedMs: number,
) {
  console.log('\n=== Generation report ===');
  console.log(`Requested: ${requested}, succeeded: ${levels.length}, failed: ${failures}`);
  console.log(`Success rate: ${((levels.length / requested) * 100).toFixed(1)}%`);
  console.log(
    `Time: ${elapsedMs.toFixed(0)}ms total, ${(elapsedMs / Math.max(levels.length, 1)).toFixed(2)}ms/level`,
  );
  console.log(
    `Average attempts per successful level: ${(totalAttempts / Math.max(levels.length, 1)).toFixed(2)}`,
  );

  console.log('\n--- Variety ---');
  const wheelLastSeen = new Map<string, number>();
  const lemmaLastSeen = new Map<string, number>();
  let wheelRepeats = 0;
  let longestWheelGap = 0;
  let shortestWheelGap = Number.POSITIVE_INFINITY;
  let totalLemmaSlots = 0;
  let lemmaRepeats = 0;
  let longestLemmaGap = 0;
  let shortestLemmaGap = Number.POSITIVE_INFINITY;

  levels.forEach((level, index) => {
    const wk = wheelKey(level);
    const prevWheel = wheelLastSeen.get(wk);
    if (prevWheel !== undefined) {
      wheelRepeats++;
      const gap = index - prevWheel;
      longestWheelGap = Math.max(longestWheelGap, gap);
      shortestWheelGap = Math.min(shortestWheelGap, gap);
    }
    wheelLastSeen.set(wk, index);

    for (const word of level.grid.words) {
      totalLemmaSlots++;
      const lemma = lemmatize(word.word);
      const prevLemma = lemmaLastSeen.get(lemma);
      if (prevLemma !== undefined) {
        lemmaRepeats++;
        const gap = index - prevLemma;
        longestLemmaGap = Math.max(longestLemmaGap, gap);
        shortestLemmaGap = Math.min(shortestLemmaGap, gap);
      }
      lemmaLastSeen.set(lemma, index);
    }
  });

  const distinctWheels = wheelLastSeen.size;
  console.log(`Distinct wheels: ${distinctWheels} / ${levels.length} levels`);
  console.log(`Wheel repeats within this batch: ${wheelRepeats}`);
  if (wheelRepeats > 0) {
    console.log(`Shortest gap before a wheel repeat: ${shortestWheelGap} levels`);
    console.log(`Longest gap before a wheel repeat: ${longestWheelGap} levels`);
  }

  const distinctLemmas = lemmaLastSeen.size;
  console.log(`\nDistinct grid lemmas: ${distinctLemmas} / ${totalLemmaSlots} grid-word slots`);
  console.log(`Lemma repeats within this batch: ${lemmaRepeats}`);
  if (lemmaRepeats > 0) {
    console.log(`Shortest gap before a lemma repeat: ${shortestLemmaGap} levels`);
    console.log(`Longest gap before a lemma repeat: ${longestLemmaGap} levels`);
  }

  console.log('\n--- Difficulty histogram ---');
  const buckets = new Map<number, number>();
  for (const level of levels) {
    const bucket = Math.floor(level.difficulty / 10) * 10;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  for (const [bucket, count] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = '#'.repeat(Math.ceil((count / Math.max(levels.length, 1)) * 100));
    console.log(`${String(bucket).padStart(4)}-${bucket + 9}: ${bar} (${count})`);
  }

  console.log('\n--- Tier distribution ---');
  const tiers = new Map<number, number>();
  for (const level of levels) {
    tiers.set(level.tier, (tiers.get(level.tier) ?? 0) + 1);
  }
  for (const [tier, count] of [...tiers.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`Tier ${tier}: ${count}`);
  }
}

await main();
