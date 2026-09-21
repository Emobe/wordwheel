/**
 * Heuristic English lemmatizer. It does not need to produce a real
 * dictionary headword — only a stable key so that "cats"/"cat" and
 * "running"/"runs"/"run" collapse for the repetition cooldown. The same
 * surface form must always map to the same lemma (determinism matters more
 * than linguistic precision here).
 */

// Small irregular-form exceptions list. Extend as repetition testing turns
// up surface forms that wrongly collapse or wrongly stay separate.
const IRREGULAR: Record<string, string> = {
  men: 'man',
  women: 'woman',
  children: 'child',
  people: 'person',
  mice: 'mouse',
  geese: 'goose',
  feet: 'foot',
  teeth: 'tooth',
  went: 'go',
  gone: 'go',
  goes: 'go',
  was: 'be',
  were: 'be',
  been: 'be',
  is: 'be',
  are: 'be',
  am: 'be',
  had: 'have',
  has: 'have',
  did: 'do',
  does: 'do',
  better: 'good',
  best: 'good',
  worse: 'bad',
  worst: 'bad',
};

function stripDoubledConsonant(stem: string): string {
  // e.g. "running" -> "runn" -> "run"
  const len = stem.length;
  if (len >= 2 && stem[len - 1] === stem[len - 2] && !'aeiou'.includes(stem[len - 1]!)) {
    return stem.slice(0, -1);
  }
  return stem;
}

export function lemmatize(surface: string): string {
  const word = surface.toLowerCase();
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;

  if (word.length <= 3) return word;

  // -ies -> -y (flies -> fly), but not for short words like "ties"->"tie" territory
  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  // sibilant + es -> drop es (boxes -> box, churches -> church)
  if (word.endsWith('es') && /(?:s|x|z|ch|sh)es$/.test(word)) {
    return word.slice(0, -2);
  }

  // plain plural
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1);
  }

  if (word.endsWith('ing') && word.length > 5) {
    const stem = stripDoubledConsonant(word.slice(0, -3));
    return stem.length >= 2 ? stem : word;
  }

  if (word.endsWith('ied') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('ed') && word.length > 4) {
    const stem = stripDoubledConsonant(word.slice(0, -2));
    return stem.length >= 2 ? stem : word;
  }

  return word;
}
