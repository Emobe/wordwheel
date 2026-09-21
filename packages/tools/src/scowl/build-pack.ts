import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SCOWL_VERSION = '2020.12.07';
const SCOWL_URL = `https://downloads.sourceforge.net/project/wordlist/SCOWL/${SCOWL_VERSION}/scowl-${SCOWL_VERSION}.tar.gz`;

const REPO_ROOT = join(import.meta.dir, '..', '..', '..', '..');
const CACHE_DIR = join(REPO_ROOT, 'data', 'build', '.cache', `scowl-${SCOWL_VERSION}`);
const PACK_DIR = join(REPO_ROOT, 'data', 'build', 'packs', 'en');

/** Accepted-set ceiling and target-word ceiling, per the Phase 0 sign-off. */
export const ACCEPTED_MAX_SIZE = 70;
export const TARGET_MAX_SIZE = 35;
export const TARGET_MIN_SIZE = 10;

const FINAL_FILE_RE =
  /^(american|british|british_z|canadian|australian|english)-(words|contractions)\.(\d+)$/;
const ALPHA_ONLY_RE = /^[a-z]+$/;

async function ensureScowlSource(): Promise<string> {
  const extractedDir = join(CACHE_DIR, `scowl-${SCOWL_VERSION}`);
  if (existsSync(join(extractedDir, 'final'))) {
    return extractedDir;
  }

  await mkdir(CACHE_DIR, { recursive: true });
  const tarPath = join(CACHE_DIR, 'scowl.tar.gz');
  if (!existsSync(tarPath)) {
    console.log(`Downloading SCOWL ${SCOWL_VERSION}...`);
    const res = await fetch(SCOWL_URL);
    if (!res.ok) {
      throw new Error(`Failed to download SCOWL: ${res.status} ${res.statusText}`);
    }
    await writeFile(tarPath, new Uint8Array(await res.arrayBuffer()));
  }

  console.log('Extracting SCOWL...');
  // --force-local: MSYS/Git-Bash tar otherwise reads a Windows "C:\..." path
  // as a "host:path" remote-archive spec and tries to shell out to ssh.
  // Forward slashes avoid a separate MSYS backslash-escaping issue with -C.
  const proc = Bun.spawn(
    [
      'tar',
      '--force-local',
      '-xzf',
      tarPath.replaceAll('\\', '/'),
      '-C',
      CACHE_DIR.replaceAll('\\', '/'),
    ],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`tar extraction failed with exit code ${exitCode}`);
  }
  return extractedDir;
}

interface BuiltPack {
  accepted: string[];
  targets: { word: string; sizeTier: number }[];
  profanity: string[];
  licence: string;
}

async function buildFromSource(sourceDir: string): Promise<BuiltPack> {
  const finalDir = join(sourceDir, 'final');
  const files = await readdir(finalDir);

  // word -> smallest SCOWL size it appears at (size levels are cumulative
  // buckets of rarity, so the smallest size a word appears in is its
  // commonness tier).
  const minSize = new Map<string, number>();

  for (const file of files) {
    const match = FINAL_FILE_RE.exec(file);
    if (!match) continue;
    const size = Number.parseInt(match[3]!, 10);
    if (size > ACCEPTED_MAX_SIZE) continue;

    const content = await readFile(join(finalDir, file), 'latin1');
    for (const rawLine of content.split('\n')) {
      const word = rawLine.trim().toLowerCase();
      if (!word || !ALPHA_ONLY_RE.test(word)) continue;
      const existing = minSize.get(word);
      if (existing === undefined || size < existing) {
        minSize.set(word, size);
      }
    }
  }

  const accepted = [...minSize.keys()].sort();
  const targets = [...minSize.entries()]
    .filter(([, size]) => size >= TARGET_MIN_SIZE && size <= TARGET_MAX_SIZE)
    .map(([word, sizeTier]) => ({ word, sizeTier }))
    .sort((a, b) => a.word.localeCompare(b.word));

  const profanity = new Set<string>();
  for (const profaneFile of ['profane.1', 'profane.3']) {
    const path = join(sourceDir, 'misc', profaneFile);
    if (!existsSync(path)) continue;
    const content = await readFile(path, 'latin1');
    for (const rawLine of content.split('\n')) {
      const word = rawLine.trim().toLowerCase();
      if (word) profanity.add(word);
    }
  }

  const licence = await readFile(join(sourceDir, 'Copyright'), 'utf8');

  return { accepted, targets, profanity: [...profanity].sort(), licence };
}

export async function buildEnglishPack(force = false): Promise<void> {
  if (!force && existsSync(join(PACK_DIR, 'pack.json'))) {
    return;
  }

  const sourceDir = await ensureScowlSource();
  const pack = await buildFromSource(sourceDir);

  await mkdir(PACK_DIR, { recursive: true });
  await writeFile(join(PACK_DIR, 'accepted.txt'), pack.accepted.join('\n'));
  await writeFile(join(PACK_DIR, 'targets.json'), JSON.stringify(pack.targets));
  await writeFile(join(PACK_DIR, 'profanity.txt'), pack.profanity.join('\n'));
  await writeFile(join(PACK_DIR, 'LICENCE-scowl.txt'), pack.licence);
  await writeFile(
    join(PACK_DIR, 'pack.json'),
    JSON.stringify(
      {
        lang: 'en',
        source: 'SCOWL',
        sourceVersion: SCOWL_VERSION,
        sourceUrl: SCOWL_URL,
        licenceFile: 'LICENCE-scowl.txt',
        acceptedMaxSize: ACCEPTED_MAX_SIZE,
        targetMinSize: TARGET_MIN_SIZE,
        targetMaxSize: TARGET_MAX_SIZE,
        acceptedWordCount: pack.accepted.length,
        targetWordCount: pack.targets.length,
        profanityWordCount: pack.profanity.length,
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(
    `Built en pack: ${pack.accepted.length} accepted words, ${pack.targets.length} target words, ${pack.profanity.length} profanity entries.`,
  );
}

if (import.meta.main) {
  await buildEnglishPack(process.argv.includes('--force'));
}
