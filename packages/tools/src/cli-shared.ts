import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Level } from "../../core/src/types.js";

/** Parses `[poolPath] [--sample N]` shared by the ascii and report CLIs. */
export async function loadLevelsFromArgs(
  argv: string[],
  defaultSample: number,
): Promise<{ levels: Level[]; sampleSize: number; poolPath: string }> {
  let poolPath: string | undefined;
  let sampleSize = defaultSample;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sample") sampleSize = Number(argv[++i]);
    else if (!argv[i]!.startsWith("--")) poolPath = argv[i];
  }

  const repoRoot = path.resolve(import.meta.dir, "../../..");
  const resolvedPath = poolPath ?? path.join(repoRoot, "data", "build", "pools", "en", "band3.json");
  const raw = await readFile(resolvedPath, "utf8");
  const levels = JSON.parse(raw) as Level[];
  return { levels, sampleSize, poolPath: resolvedPath };
}
