import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { SrsService } from '@core/services/srs';

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

describe('SrsService', () => {
  it('returns null for a card that has never been rated', () => {
    const srs = new SrsService(fakeStorage());
    expect(srs.getCardState('some-card')).toBeNull();
  });

  it('records a fresh rating with reviewCount 1', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('card-a', 'good');
    const state = srs.getCardState('card-a');
    expect(state?.lastRating).toBe('good');
    expect(state?.reviewCount).toBe(1);
    expect(typeof state?.lastRatedAt).toBe('string');
  });

  it('increments reviewCount and updates lastRating on repeated ratings', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('card-a', 'again');
    srs.recordRating('card-a', 'easy');
    const state = srs.getCardState('card-a');
    expect(state?.lastRating).toBe('easy');
    expect(state?.reviewCount).toBe(2);
  });

  it('getAllCardStates returns every rated card, keyed by cardKey', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('card-a', 'good');
    srs.recordRating('card-b', 'hard');
    const all = srs.getAllCardStates();
    expect(Object.keys(all).sort()).toEqual(['card-a', 'card-b']);
  });
});

describe('SrsService scheduling (F3)', () => {
  const NOW = new Date(2026, 0, 10, 12, 0);

  it('recordRating populates schedule fields consistent with the SM-2 engine', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('card-a', 'good', NOW);
    const state = srs.getCardState('card-a');
    expect(state?.reps).toBe(1);
    expect(state?.intervalDays).toBe(1);
    expect(state?.ease).toBeCloseTo(2.5, 5);
    expect(state?.dueAt).toBe('2026-01-11');
  });

  it('a never-rated card is due', () => {
    const srs = new SrsService(fakeStorage());
    expect(srs.isDue('never-rated', NOW)).toBe(true);
  });

  it('a card with an established multi-day interval is not due the next morning', () => {
    const srs = new SrsService(fakeStorage());
    // First "good" collapses to a 1-day interval (documented sm2.ts quirk); the
    // second establishes reps=2 -> a 6-day interval, which is the case worth testing.
    srs.recordRating('card-a', 'good', NOW);
    const nextDay = new Date(2026, 0, 11, 12, 0);
    srs.recordRating('card-a', 'good', nextDay);
    const dueAtAfterSecondGood = srs.getCardState('card-a')?.dueAt;
    expect(dueAtAfterSecondGood).toBe('2026-01-17'); // nextDay + 6 days

    const stillTooSoon = new Date(2026, 0, 12, 8, 0);
    expect(srs.isDue('card-a', stillTooSoon)).toBe(false);
  });

  it('a card becomes due once "now" advances past its dueAt', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('card-a', 'good', NOW); // due 2026-01-11
    const dueDay = new Date(2026, 0, 11, 9, 0);
    expect(srs.isDue('card-a', dueDay)).toBe(true);
  });

  it('getDueCards filters a candidate list down to the due ones', () => {
    const srs = new SrsService(fakeStorage());
    srs.recordRating('rated-good', 'good', NOW); // due tomorrow, not due yet
    const due = srs.getDueCards(['rated-good', 'never-rated'], NOW);
    expect(due.sort()).toEqual(['never-rated']);
  });

  it('a legacy F2-shape CardState (no schedule fields) is treated as due', () => {
    const storage = fakeStorage();
    // Simulate data written by pre-F3 code: lastRating/lastRatedAt/reviewCount only.
    storage.set('gl:v1:srs:cards', {
      'legacy-card': { lastRating: 'good', lastRatedAt: NOW.toISOString(), reviewCount: 3 },
    });
    const srs = new SrsService(storage);
    expect(srs.isDue('legacy-card', NOW)).toBe(true);
    expect(srs.getSchedule('legacy-card')).toBeNull();
  });
});
