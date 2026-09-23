/**
 * Heuristic base-word map: links inflected forms (cats -> cat) so the
 * generator never puts two forms of the same word in one grid, and so
 * variety is measured by base word (section 6 of the plan).
 *
 * SCOWL has no lemma data, so this applies common English suffix rules and
 * only accepts a link when the resulting base word is itself in the
 * dictionary. This is a spike-quality approximation, not a full
 * morphological analyzer: irregular forms (mice -> mouse, went -> go) are
 * not caught, and a few false links are possible (e.g. "business" ending in
 * "ss" is protected explicitly below, but not every such case is).
 */

interface Rule {
  suffix: string;
  strip: number;
  add: string;
  minBaseLength: number;
}

const RULES: Rule[] = [
  { suffix: "ies", strip: 3, add: "y", minBaseLength: 2 },
  { suffix: "ied", strip: 3, add: "y", minBaseLength: 2 },
  { suffix: "sses", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "shes", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "ches", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "xes", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "es", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "s", strip: 1, add: "", minBaseLength: 3 },
  { suffix: "ing", strip: 3, add: "", minBaseLength: 3 },
  { suffix: "ing", strip: 3, add: "e", minBaseLength: 3 },
  { suffix: "ed", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "ed", strip: 2, add: "e", minBaseLength: 3 },
  { suffix: "er", strip: 2, add: "", minBaseLength: 3 },
  { suffix: "est", strip: 3, add: "", minBaseLength: 3 },
];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/** For a consonant-doubled stem like "runn" (from "running"), also try "run". */
function doubledConsonantCandidate(stem: string): string | null {
  if (stem.length < 3) return null;
  const last = stem[stem.length - 1]!;
  const secondLast = stem[stem.length - 2]!;
  if (last !== secondLast || VOWELS.has(last)) return null;
  return stem.slice(0, -1);
}

function candidatesForWord(word: string): string[] {
  const candidates: string[] = [];
  for (const rule of RULES) {
    if (!word.endsWith(rule.suffix)) continue;
    const stem = word.slice(0, word.length - rule.strip);
    const candidate = stem + rule.add;
    if (candidate.length >= rule.minBaseLength) candidates.push(candidate);

    if (rule.add === "" && (rule.suffix === "ing" || rule.suffix === "ed")) {
      const doubled = doubledConsonantCandidate(stem);
      if (doubled && doubled.length >= rule.minBaseLength) candidates.push(doubled);
    }
  }
  return candidates;
}

export function buildBaseWordMap(words: readonly string[]): Record<string, string> {
  const dict = new Set(words);
  const baseMap: Record<string, string> = {};

  for (const word of words) {
    // Try every rule's candidate (not just the first matching rule) and keep
    // the shortest one that's actually in the dictionary, so e.g. "running"
    // prefers "run" over a longer/incorrect match from an earlier rule.
    let best: string | null = null;
    for (const candidate of candidatesForWord(word)) {
      if (candidate === word) continue;
      if (!dict.has(candidate)) continue;
      if (!best || candidate.length < best.length) best = candidate;
    }
    if (best) baseMap[word] = best;
  }

  // Resolve chains (e.g. a -> b -> c) down to a root that has no base of its own.
  for (const word of Object.keys(baseMap)) {
    let base = baseMap[word]!;
    const seen = new Set([word]);
    while (baseMap[base] && !seen.has(base)) {
      seen.add(base);
      base = baseMap[base]!;
    }
    baseMap[word] = base;
  }

  return baseMap;
}

export function resolveBaseWord(word: string, baseMap: Record<string, string>): string {
  return baseMap[word] ?? word;
}
