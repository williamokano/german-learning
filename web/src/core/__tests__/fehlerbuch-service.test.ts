import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { SrsService } from '@core/services/srs';
import { FehlerbuchService } from '@core/services/fehlerbuch';
import { countWortschatz } from '@core/engine/wortschatz';
import type { ExerciseUnion, ItemResult } from '@core/content/types';

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

const singleChoiceExercise = {
  id: 'A1', block: 'A', title: 'Test', type: 'single-choice',
  items: [
    { q: 'Wie heißt du?', options: [{ key: 'a', text: 'gut' }, { key: 'b', text: 'Anna' }], answer: 'b' },
  ],
} as unknown as ExerciseUnion;

const gapTextExercise = {
  id: 'A2', block: 'A', title: 'Test', type: 'gap-text',
  text: 'Ich ___ Anna.', answers: { '1': 'bin', '2': 'gut' },
} as unknown as ExerciseUnion;

function result(overrides: Partial<ItemResult> = {}): ItemResult {
  return { ref: '0', correct: false, given: '', expected: '', scoreable: true, ...overrides };
}

const NOW = new Date(2026, 0, 10, 12, 0);

describe('FehlerbuchService.captureExerciseResults', () => {
  it('ignores correct results', () => {
    const svc = new FehlerbuchService(fakeStorage(), new SrsService(fakeStorage()));
    svc.captureExerciseResults('A1/03', gapTextExercise, [result({ correct: true })], NOW);
    expect(Object.keys(svc.getAll())).toHaveLength(0);
  });

  it('captures wrong results only', () => {
    const svc = new FehlerbuchService(fakeStorage(), new SrsService(fakeStorage()));
    svc.captureExerciseResults('A1/03', gapTextExercise, [
      result({ ref: '0', correct: true }),
      result({ ref: '1', correct: false, given: 'binn', expected: 'bin' }),
    ], NOW);
    const all = svc.getAll();
    expect(Object.keys(all)).toHaveLength(1);
    expect(all['A1/03:A2:1'].given).toBe('binn');
  });

  it('stores the resolved option TEXT for a single-choice mistake, not the raw key', () => {
    const svc = new FehlerbuchService(fakeStorage(), new SrsService(fakeStorage()));
    svc.captureExerciseResults('A1/03', singleChoiceExercise, [
      result({ ref: '0', correct: false, given: 'a', expected: 'Anna' }),
    ], NOW);
    const entry = svc.getAll()['A1/03:A1:0'];
    expect(entry.given).toBe('gut'); // resolved from key 'a'
  });

  it('capturing the same (lessonId, exerciseId, ref) twice upserts, not duplicates', () => {
    const svc = new FehlerbuchService(fakeStorage(), new SrsService(fakeStorage()));
    svc.captureExerciseResults('A1/03', gapTextExercise, [result({ ref: '0', given: 'binn', expected: 'bin' })], NOW);
    svc.captureExerciseResults('A1/03', gapTextExercise, [result({ ref: '0', given: 'bist', expected: 'bin' })], NOW);
    const all = svc.getAll();
    expect(Object.keys(all)).toHaveLength(1);
    expect(all['A1/03:A2:0'].timesWrong).toBe(2);
    expect(all['A1/03:A2:0'].given).toBe('bist');
  });

  it('seeds SRS via an "again" rating — reps=0, a 1-day interval (due the next day)', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);
    svc.captureExerciseResults('A1/03', gapTextExercise, [result({ ref: '0', given: 'binn', expected: 'bin' })], NOW);
    const state = srs.getCardState('fehlerbuch:A1/03:A2:0');
    expect(state?.reps).toBe(0);
    expect(state?.intervalDays).toBe(1);
    expect(srs.isDue('fehlerbuch:A1/03:A2:0', NOW)).toBe(false); // not due same-day (calendar-day granularity)
    const nextDay = new Date(2026, 0, 11, 8, 0);
    expect(srs.isDue('fehlerbuch:A1/03:A2:0', nextDay)).toBe(true);
  });
});

describe('FehlerbuchService.startReview', () => {
  it('ranks due items before not-due items and respects size', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);
    svc.captureExerciseResults('A1/03', gapTextExercise, [
      result({ ref: '0', given: 'binn', expected: 'bin' }),
      result({ ref: '1', given: 'x', expected: 'gut' }),
    ], NOW);
    // Rate one item 'easy' to push it far into the future (not due), the other stays due.
    const all = svc.getAll();
    const dueKey = Object.keys(all).find(k => all[k].ref === '0')!;
    const notDueKey = Object.keys(all).find(k => all[k].ref === '1')!;
    srs.recordRating(`fehlerbuch:${notDueKey}`, 'easy', NOW); // interval=4, not due tomorrow

    const soon = new Date(2026, 0, 11, 8, 0); // due item (interval=1) is due now; easy one (interval=4) isn't
    const reviewed = svc.startReview(10, soon);
    expect(reviewed[0].key).toBe(dueKey);
  });

  it('caps the queue at the given size', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);
    svc.captureExerciseResults('A1/03', gapTextExercise, [
      result({ ref: '0', given: 'a', expected: 'b' }),
      result({ ref: '1', given: 'c', expected: 'd' }),
    ], NOW);
    expect(svc.startReview(1, NOW)).toHaveLength(1);
  });
});

describe('FehlerbuchService.rate', () => {
  it('updates the SRS schedule for the entry', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);
    svc.captureExerciseResults('A1/03', gapTextExercise, [result({ ref: '0', given: 'binn', expected: 'bin' })], NOW);
    svc.rate('A1/03:A2:0', 'good', NOW);
    const state = srs.getCardState('fehlerbuch:A1/03:A2:0');
    expect(state?.reps).toBe(1);
  });
});

describe('FehlerbuchService.getConfusionPairs', () => {
  it('detects confusion pairs end-to-end through captured entries', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);
    const derExercise = { ...gapTextExercise, id: 'A3' } as ExerciseUnion;
    svc.captureExerciseResults('A1/03', derExercise, [result({ ref: '0', given: 'der', expected: 'das' })], NOW);
    svc.captureExerciseResults('A1/04', derExercise, [result({ ref: '0', given: 'das', expected: 'der' })], NOW);
    const pairs = svc.getConfusionPairs();
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ a: 'das', b: 'der', count: 2 });
  });
});

describe('isolation regression — Fehlerbuch cards must not contaminate F2/F3/F4', () => {
  it('countWortschatz over real vocab dedup-keys is unaffected by captured Fehlerbuch mistakes', () => {
    const storage = fakeStorage();
    const srs = new SrsService(storage);
    const svc = new FehlerbuchService(storage, srs);

    // Capture several Fehlerbuch mistakes, seeding gl:v1:srs:cards with fehlerbuch:* keys.
    svc.captureExerciseResults('A1/03', gapTextExercise, [
      result({ ref: '0', given: 'binn', expected: 'bin' }),
      result({ ref: '1', given: 'x', expected: 'gut' }),
    ], NOW);

    // A vocab dedup-key that was never touched by any flashcard rating.
    const vocabDedupKeys = ['apfel noun der', 'banane noun die'];
    const wortschatz = countWortschatz(vocabDedupKeys, srs.getAllCardStates());
    expect(wortschatz.seen).toBe(0);
    expect(wortschatz.mastered).toBe(0);
  });
});
