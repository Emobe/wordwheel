import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { buildTrie } from './trie';

function multisetCounts(letters: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ch of letters) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return counts;
}

function isSubMultiset(word: string, letters: string[]): boolean {
  const available = multisetCounts(letters);
  for (const ch of word) {
    const count = available.get(ch) ?? 0;
    if (count <= 0) return false;
    available.set(ch, count - 1);
  }
  return true;
}

describe('Trie.wordsFromLetters', () => {
  const words = ['cat', 'cats', 'car', 'care', 'race', 'act', 'tar', 'art'];
  const trie = buildTrie(words);

  test('every returned word is spellable from the given letters (never rejects the wheel constraint)', () => {
    fc.assert(
      fc.property(fc.shuffledSubarray('cartes'.split('')), (letters) => {
        const found = trie.wordsFromLetters(letters, 1);
        for (const word of found) {
          expect(isSubMultiset(word, letters)).toBe(true);
        }
      }),
    );
  });

  test('finds every inserted word that is spellable from a given multiset', () => {
    const letters = ['c', 'a', 'r', 'e', 's'];
    const found = new Set(trie.wordsFromLetters(letters, 1));
    for (const word of words) {
      if (isSubMultiset(word, letters)) {
        expect(found.has(word)).toBe(true);
      }
    }
  });

  test('never returns a word shorter than minLength', () => {
    const found = trie.wordsFromLetters(['c', 'a', 't', 's', 'r', 'e'], 4);
    for (const word of found) {
      expect(word.length).toBeGreaterThanOrEqual(4);
    }
  });
});
