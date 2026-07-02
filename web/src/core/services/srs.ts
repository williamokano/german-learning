// SrsService — per-card recall-rating history for the flashcard mode (issue #338, F2).
// Deliberately dumb: records the LAST rating + a review count, no due-dates or
// intervals. Scheduling (SM-2 → FSRS) is F3's job, built on top of this data later.

import type { StorageService } from '@core/services/storage';

const KEY = 'gl:v1:srs:cards';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  lastRating: Rating;
  lastRatedAt: string; // ISO date
  reviewCount: number;
}

export class SrsService {
  constructor(private storage: StorageService) {}

  recordRating(cardKey: string, rating: Rating): void {
    const all = this.storage.get<Record<string, CardState>>(KEY) ?? {};
    const prev = all[cardKey];
    all[cardKey] = {
      lastRating: rating,
      lastRatedAt: new Date().toISOString(),
      reviewCount: (prev?.reviewCount ?? 0) + 1,
    };
    this.storage.set(KEY, all);
  }

  getCardState(cardKey: string): CardState | null {
    const all = this.storage.get<Record<string, CardState>>(KEY) ?? {};
    return all[cardKey] ?? null;
  }

  getAllCardStates(): Record<string, CardState> {
    return this.storage.get<Record<string, CardState>>(KEY) ?? {};
  }
}
