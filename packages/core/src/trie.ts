/**
 * Trie over the accepted dictionary, used to enumerate every accepted word
 * spellable from a wheel's multiset of tiles (each tile usable once per
 * occurrence in the wheel).
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isWord = false;
}

export class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.isWord = true;
  }

  has(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      const next = node.children.get(ch);
      if (!next) return false;
      node = next;
    }
    return node.isWord;
  }

  /**
   * Every dictionary word (>= minLength) whose letters are a submultiset of
   * `tiles`. DFS over the trie, branching only on letters still available in
   * the wheel, so this stays fast even though the dictionary is large.
   */
  wordsFromTiles(tiles: readonly string[], minLength = 3): string[] {
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1);

    const found: string[] = [];
    const path: string[] = [];

    const walk = (node: TrieNode) => {
      if (node.isWord && path.length >= minLength) {
        found.push(path.join(""));
      }
      for (const [letter, count] of counts) {
        if (count <= 0) continue;
        const child = node.children.get(letter);
        if (!child) continue;
        counts.set(letter, count - 1);
        path.push(letter);
        walk(child);
        path.pop();
        counts.set(letter, count);
      }
    };

    walk(this.root);
    return found;
  }
}

export function buildTrie(words: readonly string[]): Trie {
  const trie = new Trie();
  for (const w of words) trie.insert(w);
  return trie;
}
