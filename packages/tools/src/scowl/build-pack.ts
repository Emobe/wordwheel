/**
 * Builds the English word pack (section 4) from a local SCOWL checkout.
 *
 * SCOWL license (see .tmp-scowl/Copyright): "Permission to use, copy,
 * modify, distribute and sell these word lists ... for any purpose is
 * hereby granted without fee, provided that the above copyright notice
 * appears ... and that both that copyright notice and this permission
 * notice appear in supporting documentation." Permissive, use+sell
 * allowed, notice must be kept — satisfied by copying it into the pack's
 * `license` field below, to carry through to the app's credits screen later.
 *
 * Run: bun run build-pack [path-to-scowl-final-dir]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBaseWordMap } from "../../../core/src/lemma.js";
import type { GridWordEntry, WordPack } from "../../../core/src/types.js";

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");
const DEFAULT_SCOWL_DIR = path.join(REPO_ROOT, ".tmp-scowl", "final");
const OUT_DIR = path.join(REPO_ROOT, "data", "build", "packs");

// Both American and British spellings, plus the size-neutral "english" core, per section 4.
const VARIANTS = ["english", "american", "british"];
const SIZES = [10, 20, 35, 40, 50, 55, 60, 70, 80, 95];

/** Bonus-word dictionary: every size, so any real word spellable from the wheel counts. */
const ACCEPTED_MAX_SIZE = 95;
/** Grid word list: wide but stops short of the most obscure/archaic tier. */
const GRID_MAX_SIZE = 80;

const WORD_RE = /^[a-z]+$/;

async function readWordFile(filePath: string): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(filePath, "latin1");
  } catch {
    return [];
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((w) => WORD_RE.test(w) && w.length >= 3);
}

async function loadScowl(scowlDir: string): Promise<Map<string, number>> {
  const rank = new Map<string, number>();
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const file = path.join(scowlDir, `${variant}-words.${size}`);
      const words = await readWordFile(file);
      for (const w of words) {
        const existing = rank.get(w);
        if (existing === undefined || size < existing) rank.set(w, size);
      }
    }
  }
  return rank;
}

async function main() {
  const scowlDir = process.argv[2] ?? DEFAULT_SCOWL_DIR;
  console.log(`Reading SCOWL word lists from ${scowlDir} ...`);

  const rankByWord = await loadScowl(scowlDir);
  console.log(`Loaded ${rankByWord.size} distinct words across sizes ${SIZES.join(", ")}.`);

  const accepted = [...rankByWord.entries()]
    .filter(([, rank]) => rank <= ACCEPTED_MAX_SIZE)
    .map(([w]) => w)
    .sort();

  const gridWords: GridWordEntry[] = [...rankByWord.entries()]
    .filter(([w, rank]) => rank <= GRID_MAX_SIZE && w.length >= 3 && w.length <= 7)
    .map(([word, rank]) => ({ word, rank }))
    .sort((a, b) => a.word.localeCompare(b.word));

  console.log(`Accepted (bonus) dictionary: ${accepted.length} words.`);
  console.log(`Grid word list (length 3-7): ${gridWords.length} words.`);

  console.log("Building base-word map ...");
  const baseMap = buildBaseWordMap(accepted);
  console.log(`Base-word links: ${Object.keys(baseMap).length}.`);

  const copyrightPath = path.join(path.dirname(scowlDir), "Copyright");
  let copyrightNotice = "SCOWL copyright notice not found; see http://wordlist.aspell.net/";
  try {
    copyrightNotice = await readFile(copyrightPath, "utf8");
  } catch {
    // fall back to the placeholder above
  }

  const pack: WordPack = {
    lang: "en",
    version: 1,
    accepted,
    gridWords,
    baseMap,
    license: [
      {
        source: "SCOWL (Spell Checker Oriented Word Lists), by Kevin Atkinson et al.",
        notice: copyrightNotice,
      },
    ],
  };

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "en.json");
  await writeFile(outPath, JSON.stringify(pack));
  console.log(`Wrote pack to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
