import { describe, it, expect } from 'vitest';
import { VocabEntry } from '@core/content/vocab';
import type { VocabEntryType } from '@core/content/vocab';
import {
  vocabCardKey,
  possibleCards,
  buildSessionCardKeys,
  shuffle,
} from '@core/content/flashcards';

function entry(overrides: Partial<VocabEntryType> & { de: string; pos: VocabEntryType['pos'] }): VocabEntryType {
  return VocabEntry.parse(overrides);
}

const apfel = entry({ de: 'Apfel', article: 'der', plural: 'Äpfel', en: 'apple', pos: 'noun' });
const essen = entry({ de: 'essen', en: 'to eat', pos: 'verb' });
const deutschland = entry({ de: 'Deutschland', en: 'Germany', pos: 'noun' }); // no article

describe('vocabCardKey', () => {
  it('combines the word identity and the face, without a lesson component', () => {
    const key = vocabCardKey(apfel, 'meaning-de-en');
    expect(key).toBe('apfel noun der|meaning-de-en');
  });

  it('produces different keys for different faces of the same word', () => {
    const a = vocabCardKey(apfel, 'meaning-de-en');
    const b = vocabCardKey(apfel, 'meaning-en-de');
    const c = vocabCardKey(apfel, 'article');
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

describe('possibleCards', () => {
  it('generates two meaning cards plus one article card for a noun with an article', () => {
    const cards = possibleCards([apfel]);
    expect(cards.size).toBe(3);
    expect([...cards.values()].map(c => c.face).sort()).toEqual(['article', 'meaning-de-en', 'meaning-en-de']);
  });

  it('omits the article card when the entry has no article', () => {
    const cardsVerb = possibleCards([essen]);
    expect(cardsVerb.size).toBe(2);
    expect([...cardsVerb.values()].every(c => c.face !== 'article')).toBe(true);

    const cardsNounNoArticle = possibleCards([deutschland]);
    expect(cardsNounNoArticle.size).toBe(2);
  });

  it('collapses cross-lesson recurrences of the same word to one set of cards', () => {
    // Same de+pos+article as `apfel`, simulating unlockedVocab() flattening two
    // lessons that both happen to reuse the same headword.
    const apfelAgain = entry({ de: 'Apfel', article: 'der', plural: 'Äpfel', en: 'apple (again)', pos: 'noun' });
    const cards = possibleCards([apfel, apfelAgain]);
    expect(cards.size).toBe(3); // not 6
  });
});

describe('buildSessionCardKeys', () => {
  it('deterministically picks meaning-de-en when rng always returns 0', () => {
    const keys = buildSessionCardKeys([apfel], () => 0);
    expect(keys).toContain(vocabCardKey(apfel, 'meaning-de-en'));
    expect(keys).not.toContain(vocabCardKey(apfel, 'meaning-en-de'));
  });

  it('deterministically picks meaning-en-de when rng always returns just under 1', () => {
    const keys = buildSessionCardKeys([apfel], () => 0.99);
    expect(keys).toContain(vocabCardKey(apfel, 'meaning-en-de'));
    expect(keys).not.toContain(vocabCardKey(apfel, 'meaning-de-en'));
  });

  it('includes the article card for nouns with an article, and always includes one meaning card', () => {
    const keys = buildSessionCardKeys([apfel], () => 0);
    expect(keys).toContain(vocabCardKey(apfel, 'article'));
    expect(keys.length).toBe(2);
  });

  it('excludes the article card for words without one', () => {
    const keys = buildSessionCardKeys([essen], () => 0);
    expect(keys.length).toBe(1);
  });

  it('dedupes cross-lesson recurrences into a single card set', () => {
    const apfelAgain = entry({ de: 'Apfel', article: 'der', plural: 'Äpfel', en: 'apple (again)', pos: 'noun' });
    const keys = buildSessionCardKeys([apfel, apfelAgain], () => 0);
    expect(keys.length).toBe(2); // one meaning + one article, not four
  });
});

describe('shuffle', () => {
  it('preserves the same set of elements', () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = shuffle(input, () => 0.5);
    expect(shuffled.sort()).toEqual(input.sort());
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    shuffle(input, () => 0.5);
    expect(input).toEqual([1, 2, 3]);
  });
});
