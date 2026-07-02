// FlashcardSessionService — resumable in-progress deck state (issue #338, F2),
// now also builds due-filtered and deep-review sessions (issue #339, F3).
// Single-slot: one session at a time, adequate for a solo learner and avoids
// unbounded key growth. Immutable-update style so callers just reassign the
// returned object (mirrors how BlockRunner holds state, but framework-free here).

import type { VocabEntryType } from '@core/content/vocab';
import type { Rating } from '@core/services/srs';
import { SrsService } from '@core/services/srs';
import type { StorageService } from '@core/services/storage';
import { buildSessionCardKeys, possibleCards, shuffle } from '@core/content/flashcards';
import { selectBurst } from '@core/engine/sm2';
import type { DueCandidate } from '@core/engine/sm2';

const KEY = 'gl:v1:flashcards:session';

export const DEEP_REVIEW_DECK_KEY = 'deep-review';
export const DEFAULT_DEEP_REVIEW_SIZE = 30;

export interface FlashcardSession {
  deckKey: string;
  cardKeys: string[];
  position: number;
  sessionRatings: Record<string, Rating>;
}

function freshSession(deckKey: string, cardKeys: string[]): FlashcardSession {
  return { deckKey, cardKeys, position: 0, sessionRatings: {} };
}

export class FlashcardSessionService {
  // `srs` is optional so existing callers/tests that only need the F2 behavior keep
  // compiling; `dueOnly`/`startDeepReview` silently degrade to "include everything" /
  // "empty" without it rather than throwing.
  constructor(private storage: StorageService, private srs?: SrsService) {}

  /** Resumes the saved session if it's the same deck and still in progress;
   *  otherwise starts a fresh one (overwriting any other deck's in-progress session). */
  getOrStart(deckKey: string, entries: VocabEntryType[], rng: () => number = Math.random, dueOnly = false): FlashcardSession {
    const saved = this.storage.get<FlashcardSession>(KEY);
    if (saved && saved.deckKey === deckKey && saved.position < saved.cardKeys.length) {
      return saved;
    }
    return this.restart(deckKey, entries, rng, dueOnly);
  }

  restart(deckKey: string, entries: VocabEntryType[], rng: () => number = Math.random, dueOnly = false): FlashcardSession {
    const isIncluded = dueOnly && this.srs
      ? (cardKey: string) => this.srs!.isDue(cardKey)
      : undefined;
    const cardKeys = buildSessionCardKeys(entries, rng, isIncluded);
    const session = freshSession(deckKey, cardKeys);
    this.storage.set(KEY, session);
    return session;
  }

  /** A global recall burst over previously-rated cards only (never introduces new
   *  vocab — that's what the lesson/cumulative decks are for), ranked due-first
   *  then topped up with not-yet-due filler up to `size`. Always rebuilds fresh —
   *  no resume, bursts are short and meant to finish in one sitting. */
  startDeepReview(
    entries: VocabEntryType[],
    size: number = DEFAULT_DEEP_REVIEW_SIZE,
    rng: () => number = Math.random,
    now: Date = new Date(),
  ): FlashcardSession {
    const cardKeys = this.buildDeepReviewCardKeys(entries, size, now);
    const session = freshSession(DEEP_REVIEW_DECK_KEY, shuffle(cardKeys, rng));
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

  private buildDeepReviewCardKeys(entries: VocabEntryType[], size: number, now: Date): string[] {
    if (!this.srs) return [];
    const cardMap = possibleCards(entries);
    const reviewed = this.srs.getAllCardStates();
    const candidates: DueCandidate[] = [];
    for (const key of cardMap.keys()) {
      if (key in reviewed) {
        candidates.push({ cardKey: key, schedule: this.srs.getSchedule(key) });
      }
    }
    return selectBurst(candidates, size, now);
  }
}
