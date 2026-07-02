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
