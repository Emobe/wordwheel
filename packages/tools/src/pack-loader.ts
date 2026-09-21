import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildTrie } from '@wordscapes/core';
import type { LanguagePack, TargetWord } from '@wordscapes/core';
import { buildEnglishPack } from './scowl/build-pack';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');

export async function loadLanguagePack(lang: string): Promise<LanguagePack> {
  if (lang !== 'en') {
    throw new Error(`No pipeline yet for lang "${lang}" (Phase 0 is English-only per PLAN.md).`);
  }

  await buildEnglishPack();

  const packDir = join(REPO_ROOT, 'data', 'build', 'packs', lang);
  const [acceptedText, targetsJson, profanityText] = await Promise.all([
    readFile(join(packDir, 'accepted.txt'), 'utf8'),
    readFile(join(packDir, 'targets.json'), 'utf8'),
    readFile(join(packDir, 'profanity.txt'), 'utf8'),
  ]);

  const acceptedWords = acceptedText.split('\n').filter(Boolean);
  const targets: TargetWord[] = JSON.parse(targetsJson);
  const profanity = new Set(profanityText.split('\n').filter(Boolean));

  return {
    lang,
    accepted: buildTrie(acceptedWords),
    targets,
    profanity,
  };
}
