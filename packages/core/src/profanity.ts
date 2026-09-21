export function isProfane(word: string, profanity: ReadonlySet<string>): boolean {
  return profanity.has(word.toLowerCase());
}
