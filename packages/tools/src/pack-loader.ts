import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildTrie } from "../../core/src/trie.js";
import type { Trie } from "../../core/src/trie.js";
import type { WordPack } from "../../core/src/types.js";

export interface LoadedPack {
  pack: WordPack;
  trie: Trie;
  loadTimeMs: number;
}

export async function loadPack(packPath = defaultPackPath()): Promise<LoadedPack> {
  const start = performance.now();
  const raw = await readFile(packPath, "utf8");
  const pack = JSON.parse(raw) as WordPack;
  const trie = buildTrie(pack.accepted);
  const loadTimeMs = performance.now() - start;
  return { pack, trie, loadTimeMs };
}

export function defaultPackPath(): string {
  const repoRoot = path.resolve(import.meta.dir, "../../..");
  return path.join(repoRoot, "data", "build", "packs", "en.json");
}
