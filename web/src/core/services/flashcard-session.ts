// FlashcardSessionService — resumable in-progress deck state (issue #338, F2).
// Single-slot: one session at a time, adequate for a solo learner and avoids
// unbounded key growth. Immutable-update style so callers just reassign the
// returned object (mirrors how BlockRunner holds state, but framework-free here).

import type { VocabEntryType } from '@core/content/vocab';
import type { Rating } from '@core/services/srs';
import type { StorageService } from '@core/services/storage';
import { buildSessionCardKeys } from '@core/content/flashcards';

const KEY = 'gl:v1:flashcards:session';

export interface FlashcardSession {
  deckKey: string;
  cardKeys: string[];
  position: number;
  sessionRatings: Record<string, Rating>;
}

function freshSession(deckKey: string, entries: VocabEntryType[], rng?: () => number): FlashcardSession {
  return {
    deckKey,
    cardKeys: buildSessionCardKeys(entries, rng),
    position: 0,
    sessionRatings: {},
  };
}

export class FlashcardSessionService {
  constructor(private storage: StorageService) {}

  /** Resumes the saved session if it's the same deck and still in progress;
   *  otherwise starts a fresh one (overwriting any other deck's in-progress session). */
  getOrStart(deckKey: string, entries: VocabEntryType[], rng?: () => number): FlashcardSession {
    const saved = this.storage.get<FlashcardSession>(KEY);
    if (saved && saved.deckKey === deckKey && saved.position < saved.cardKeys.length) {
      return saved;
    }
    return this.restart(deckKey, entries, rng);
  }

  restart(deckKey: string, entries: VocabEntryType[], rng?: () => number): FlashcardSession {
    const session = freshSession(deckKey, entries, rng);
    this.storage.set(KEY, session);
    return session;
  }

  rate(session: FlashcardSession, cardKey: string, rating: Rating): FlashcardSession {
    const next: FlashcardSession = {
      ...session,
      position: session.position + 1,
      sessionRatings: { ...session.sessionRatings, [cardKey]: rating },
    };
    this.storage.set(KEY, next);
    return next;
  }

  /** Clears the session once finished — only if it's still the current deck, so
   *  finishing an old deck can't wipe a newer one that was started meanwhile. */
  complete(deckKey: string): void {
    const saved = this.storage.get<FlashcardSession>(KEY);
    if (saved && saved.deckKey === deckKey) {
      this.storage.remove(KEY);
    }
  }
}
