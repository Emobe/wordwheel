/**
 * Blocklist hook per section 4 / section 17: words are words for now, but
 * the generator and app both check this so a list can be dropped in later
 * without code changes.
 */
export const BLOCKLIST: ReadonlySet<string> = new Set();

export function isBlocked(word: string): boolean {
  return BLOCKLIST.has(word.toLowerCase());
}
