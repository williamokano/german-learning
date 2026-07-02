import type { VocabEntryType } from './vocab';
import { vocabDedupKey } from './vocab';

// Card generation for the flashcard deck (issue #338, F2). Pure — no storage, no
// framework — so it can be unit-tested directly and reused by both a fresh session
// and a resumed one (resuming is just a lookup against possibleCards, no randomness).

export type CardFace = 'meaning-de-en' | 'meaning-en-de' | 'article';

export interface FlashCard {
  key: string;
  face: CardFace;
  entry: VocabEntryType;
}

/** Stable id for one card. No lesson component: the same headword recurring across
 *  lessons must resolve to ONE card with one rating history (see vocabDedupKey). */
export function vocabCardKey(entry: VocabEntryType, face: CardFace): string {
  return `${vocabDedupKey(entry)}|${face}`;
}

// Due-aware: DE→EN and EN→DE are independently-scheduled cards (F3), so naive random
// picking could silently skip a genuinely due card if the roll landed on its not-due
// sibling direction. Deterministic when only one direction qualifies; falls back to
// the original random 50/50 when both do (or neither is filtered, the default case).
function pickMeaningFace(
  entry: VocabEntryType,
  rng: () => number,
  isIncluded: (cardKey: string) => boolean,
): CardFace | null {
  const deEnOk = isIncluded(vocabCardKey(entry, 'meaning-de-en'));
  const enDeOk = isIncluded(vocabCardKey(entry, 'meaning-en-de'));
  if (deEnOk && enDeOk) return rng() < 0.5 ? 'meaning-de-en' : 'meaning-en-de';
  if (deEnOk) return 'meaning-de-en';
  if (enDeOk) return 'meaning-en-de';
  return null;
}

/**
 * Full lookup table of every renderable card for a set of entries — one meaning card
 * per unique word (direction unspecified; callers decide) plus an article card for
 * every noun that carries one. Deduped by vocabDedupKey, so cross-lesson recurrences
 * of the same word collapse to a single entry (last-seen entry's content wins — an
 * accepted trade-off, see F2 plan).
 */
export function possibleCards(entries: VocabEntryType[]): Map<string, FlashCard> {
  const byWord = new Map<string, VocabEntryType>();
  for (const entry of entries) byWord.set(vocabDedupKey(entry), entry);

  const cards = new Map<string, FlashCard>();
  for (const entry of byWord.values()) {
    for (const face of ['meaning-de-en', 'meaning-en-de'] as const) {
      const key = vocabCardKey(entry, face);
      cards.set(key, { key, face, entry });
    }
    if (entry.article !== null) {
      const key = vocabCardKey(entry, 'article');
      cards.set(key, { key, face: 'article', entry });
    }
  }
  return cards;
}

/** Fisher–Yates, rng injectable for deterministic tests. Does not mutate the input. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One session's shuffled card order: dedupe entries by word, pick ONE meaning
 * direction per unique word (both directions still exist as separate card identities
 * for later sessions — see possibleCards), add the article card iff the word has one.
 * `isIncluded` optionally restricts which specific cards may appear (F3's due-queue);
 * default includes everything, so legacy callers are unaffected.
 */
export function buildSessionCardKeys(
  entries: VocabEntryType[],
  rng: () => number = Math.random,
  isIncluded: (cardKey: string) => boolean = () => true,
): string[] {
  const byWord = new Map<string, VocabEntryType>();
  for (const entry of entries) byWord.set(vocabDedupKey(entry), entry);

  const keys: string[] = [];
  for (const entry of byWord.values()) {
    const face = pickMeaningFace(entry, rng, isIncluded);
    if (face) keys.push(vocabCardKey(entry, face));
    if (entry.article !== null) {
      const articleKey = vocabCardKey(entry, 'article');
      if (isIncluded(articleKey)) keys.push(articleKey);
    }
  }
  return shuffle(keys, rng);
}

export function deckKey(lesson: string, mode: 'lesson' | 'cumulative'): string {
  return `${lesson}:${mode}`;
}
