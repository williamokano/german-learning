// SrsService — per-card recall-rating history for the flashcard mode (issue #338, F2),
// now with real SM-2 scheduling (issue #339, F3) built on top.

import type { StorageService } from '@core/services/storage';
import { review, isDue as sm2IsDue, DEFAULT_EASE } from '@core/engine/sm2';
import type { Sm2Schedule } from '@core/engine/sm2';

export type { Rating } from '@core/engine/sm2';
import type { Rating } from '@core/engine/sm2';

const KEY = 'gl:v1:srs:cards';

export interface CardState {
  lastRating: Rating;
  lastRatedAt: string; // ISO date
  reviewCount: number;
  // Additive (F3) — absent on any CardState written by already-shipped F2 code.
  // A CardState missing these is treated as unscheduled: isDue() returns true (a
  // pre-F3 card is always due), and its first F3-era rating starts SM-2 fresh.
  reps?: number;
  intervalDays?: number;
  ease?: number;
  dueAt?: string;
}

export class SrsService {
  constructor(private storage: StorageService) {}

  recordRating(cardKey: string, rating: Rating, now: Date = new Date()): void {
    const all = this.storage.get<Record<string, CardState>>(KEY) ?? {};
    const prev = all[cardKey];
    const schedule = review(this.scheduleOf(prev), rating, now);
    all[cardKey] = {
      lastRating: rating,
      lastRatedAt: now.toISOString(),
      reviewCount: (prev?.reviewCount ?? 0) + 1,
      ...schedule,
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

  getSchedule(cardKey: string): Sm2Schedule | null {
    return this.scheduleOf(this.getCardState(cardKey));
  }

  isDue(cardKey: string, now: Date = new Date()): boolean {
    return sm2IsDue(this.getSchedule(cardKey), now);
  }

  getDueCards(cardKeys: string[], now: Date = new Date()): string[] {
    return cardKeys.filter(k => this.isDue(k, now));
  }

  private scheduleOf(state: CardState | null | undefined): Sm2Schedule | null {
    if (state?.dueAt == null) return null; // pre-F3 data = unscheduled = always due
    return {
      reps: state.reps ?? 0,
      intervalDays: state.intervalDays ?? 0,
      ease: state.ease ?? DEFAULT_EASE,
      dueAt: state.dueAt,
    };
  }
}
