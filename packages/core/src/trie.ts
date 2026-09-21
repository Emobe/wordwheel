/**
 * A trie over the accepted-word set. Used both to validate a player's word
 * and to enumerate every accepted word spellable from a wheel's letter
 * multiset (a bounded DFS over trie nodes, not over the whole word list).
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isWord = false;
}

export class Trie {
  private root = new TrieNode();
  private wordCount = 0;

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
    if (!node.isWord) {
      node.isWord = true;
      this.wordCount++;
    }
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

  size(): number {
    return this.wordCount;
  }

  /**
   * Every accepted word spellable from `letters` (a multiset), with length
   * at least `minLength`. Order is unspecified.
   */
  wordsFromLetters(letters: readonly string[], minLength = 3): string[] {
    const counts = new Map<string, number>();
    for (const ch of letters) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }

    const found: string[] = [];
    const path: string[] = [];

    const walk = (node: TrieNode) => {
      if (node.isWord && path.length >= minLength) {
        found.push(path.join(''));
      }
      for (const [ch, child] of node.children) {
        const available = counts.get(ch) ?? 0;
        if (available <= 0) continue;
        counts.set(ch, available - 1);
        path.push(ch);
        walk(child);
        path.pop();
        counts.set(ch, available);
      }
    };

    walk(this.root);
    return found;
  }
}

export function buildTrie(words: Iterable<string>): Trie {
  const trie = new Trie();
  for (const word of words) {
    trie.insert(word);
  }
  return trie;
}
