import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { lemmatize } from './lemma';

describe('lemmatize', () => {
  test('is deterministic: same surface form always maps to the same lemma', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (word) => {
        expect(lemmatize(word)).toBe(lemmatize(word));
      }),
    );
  });

  test('collapses common plural/verb inflections onto their base form', () => {
    expect(lemmatize('cats')).toBe(lemmatize('cat'));
    expect(lemmatize('runners')).toBe(lemmatize('runner'));
    expect(lemmatize('boxes')).toBe(lemmatize('box'));
    expect(lemmatize('flies')).toBe(lemmatize('fly'));
  });

  test('irregular forms use the exceptions table', () => {
    expect(lemmatize('men')).toBe('man');
    expect(lemmatize('children')).toBe('child');
    expect(lemmatize('went')).toBe('go');
  });
});
