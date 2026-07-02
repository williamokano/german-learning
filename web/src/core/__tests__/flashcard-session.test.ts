import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { VocabEntry } from '@core/content/vocab';
import type { VocabEntryType } from '@core/content/vocab';
import { FlashcardSessionService } from '@core/services/flashcard-session';

function fakeStorage(): StorageService {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string): T | null {
      return (store.has(key) ? store.get(key) : null) as T | null;
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

const apfel: VocabEntryType = VocabEntry.parse({ de: 'Apfel', article: 'der', en: 'apple', pos: 'noun' });
const banane: VocabEntryType = VocabEntry.parse({ de: 'Banane', article: 'die', en: 'banana', pos: 'noun' });
const entries = [apfel, banane];

describe('FlashcardSessionService', () => {
  it('builds a fresh session on first call', () => {
    const svc = new FlashcardSessionService(fakeStorage());
    const session = svc.getOrStart('A1/03:lesson', entries, () => 0);
    expect(session.deckKey).toBe('A1/03:lesson');
    expect(session.position).toBe(0);
    expect(session.cardKeys.length).toBeGreaterThan(0);
  });

  it('resumes the same in-progress session for the same deckKey', () => {
    const svc = new FlashcardSessionService(fakeStorage());
    const first = svc.getOrStart('A1/03:lesson', entries, () => 0);
    const resumed = svc.getOrStart('A1/03:lesson', entries, () => 0.9); // different rng — must NOT rebuild
    expect(resumed.cardKeys).toEqual(first.cardKeys);
    expect(resumed.position).toBe(first.position);
  });

  it('discards the saved session when a different deckKey is requested', () => {
    const svc = new FlashcardSessionService(fakeStorage());
    svc.getOrStart('A1/03:lesson', entries, () => 0);
    const other = svc.getOrStart('A1/05:lesson', entries, () => 0);
    expect(other.deckKey).toBe('A1/05:lesson');
    expect(other.position).toBe(0);
  });

  it('rate advances position, records the rating, and persists', () => {
    const storage = fakeStorage();
    const svc = new FlashcardSessionService(storage);
    let session = svc.getOrStart('A1/03:lesson', entries, () => 0);
    const cardKey = session.cardKeys[0];
    session = svc.rate(session, cardKey, 'good');
    expect(session.position).toBe(1);
    expect(session.sessionRatings[cardKey]).toBe('good');

    // Persisted, not just returned — a fresh getOrStart call for the same deck sees it.
    const reread = svc.getOrStart('A1/03:lesson', entries, () => 0);
    expect(reread.position).toBe(1);
  });

  it('complete clears the session only when deckKey still matches', () => {
    const storage = fakeStorage();
    const svc = new FlashcardSessionService(storage);
    svc.getOrStart('A1/03:lesson', entries, () => 0);

    svc.complete('A1/05:lesson'); // a stale/different deck — must not clear
    expect(storage.get('gl:v1:flashcards:session')).not.toBeNull();

    svc.complete('A1/03:lesson');
    expect(storage.get('gl:v1:flashcards:session')).toBeNull();
  });

  it('restart always builds a fresh session, even mid-progress', () => {
    const svc = new FlashcardSessionService(fakeStorage());
    let session = svc.getOrStart('A1/03:lesson', entries, () => 0);
    session = svc.rate(session, session.cardKeys[0], 'good');
    const restarted = svc.restart('A1/03:lesson', entries, () => 0);
    expect(restarted.position).toBe(0);
    expect(restarted.sessionRatings).toEqual({});
  });
});
