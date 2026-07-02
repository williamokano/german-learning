import { describe, it, expect } from 'vitest';
import { review, isDue, rankByDue, selectBurst, DEFAULT_EASE, MIN_EASE } from '@core/engine/sm2';
import type { Sm2Schedule, Rating } from '@core/engine/sm2';

const NOW = new Date(2026, 0, 10, 12, 0); // 2026-01-10 noon, arbitrary fixed instant

describe('review', () => {
  it.each<[string, Sm2Schedule | null, Rating, { reps: number; intervalDays: number; ease: number }]>([
    ['new + again', null, 'again', { reps: 0, intervalDays: 1, ease: 2.3 }],
    ['new + hard',  null, 'hard',  { reps: 1, intervalDays: 1, ease: 2.35 }],
    ['new + good',  null, 'good',  { reps: 1, intervalDays: 1, ease: 2.5 }],
    ['new + easy',  null, 'easy',  { reps: 1, intervalDays: 4, ease: 2.65 }],
    [
      'reps1,int1,ease2.5 + good',
      { reps: 1, intervalDays: 1, ease: 2.5, dueAt: '2026-01-01' },
      'good',
      { reps: 2, intervalDays: 6, ease: 2.5 },
    ],
    [
      'reps2,int6,ease2.5 + good',
      { reps: 2, intervalDays: 6, ease: 2.5, dueAt: '2026-01-01' },
      'good',
      { reps: 3, intervalDays: 15, ease: 2.5 },
    ],
    [
      'reps2,int6,ease2.5 + hard',
      { reps: 2, intervalDays: 6, ease: 2.5, dueAt: '2026-01-01' },
      'hard',
      { reps: 3, intervalDays: 7, ease: 2.35 },
    ],
    [
      'reps2,int6,ease2.5 + easy',
      { reps: 2, intervalDays: 6, ease: 2.5, dueAt: '2026-01-01' },
      'easy',
      { reps: 3, intervalDays: 20, ease: 2.65 },
    ],
    [
      'reps2,int6,ease2.5 + again',
      { reps: 2, intervalDays: 6, ease: 2.5, dueAt: '2026-01-01' },
      'again',
      { reps: 0, intervalDays: 1, ease: 2.3 },
    ],
    [
      'reps5,int60,ease1.35 + again (ease floor clamps)',
      { reps: 5, intervalDays: 60, ease: 1.35, dueAt: '2026-01-01' },
      'again',
      { reps: 0, intervalDays: 1, ease: 1.3 },
    ],
  ])('%s', (_desc, prev, rating, expected) => {
    const result = review(prev, rating, NOW);
    expect(result.reps).toBe(expected.reps);
    expect(result.intervalDays).toBe(expected.intervalDays);
    expect(result.ease).toBeCloseTo(expected.ease, 5);
  });

  it('never drops ease below MIN_EASE across repeated Again ratings', () => {
    let schedule: Sm2Schedule | null = null;
    for (let i = 0; i < 10; i++) schedule = review(schedule, 'again', NOW);
    expect(schedule!.ease).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('computes dueAt as a calendar date, intervalDays ahead of now', () => {
    const result = review(null, 'good', NOW);
    expect(result.dueAt).toBe('2026-01-11');
  });

  it('Hard lands strictly below Good, and Easy strictly above, at the same prior state', () => {
    const prev: Sm2Schedule = { reps: 2, intervalDays: 6, ease: DEFAULT_EASE, dueAt: '2026-01-01' };
    const hard = review(prev, 'hard', NOW);
    const good = review(prev, 'good', NOW);
    const easy = review(prev, 'easy', NOW);
    expect(hard.intervalDays).toBeLessThan(good.intervalDays);
    expect(good.intervalDays).toBeLessThan(easy.intervalDays);
  });
});

describe('isDue', () => {
  it('is true for a never-scheduled card (null or undefined)', () => {
    expect(isDue(null, NOW)).toBe(true);
    expect(isDue(undefined, NOW)).toBe(true);
  });

  it('is true when dueAt is today or earlier', () => {
    expect(isDue({ reps: 1, intervalDays: 1, ease: 2.5, dueAt: '2026-01-10' }, NOW)).toBe(true);
    expect(isDue({ reps: 1, intervalDays: 1, ease: 2.5, dueAt: '2026-01-05' }, NOW)).toBe(true);
  });

  it('is false when dueAt is in the future', () => {
    expect(isDue({ reps: 1, intervalDays: 1, ease: 2.5, dueAt: '2026-01-11' }, NOW)).toBe(false);
  });

  it('normalizes to calendar days regardless of time-of-day (no rolling 24h timer)', () => {
    const lateNight = new Date(2026, 0, 10, 23, 58);
    const schedule = review(null, 'good', lateNight); // interval=1 -> due 2026-01-11
    expect(schedule.dueAt).toBe('2026-01-11');

    const stillJan10 = new Date(2026, 0, 10, 23, 59);
    expect(isDue(schedule, stillJan10)).toBe(false);

    const earlyJan11 = new Date(2026, 0, 11, 0, 1);
    expect(isDue(schedule, earlyJan11)).toBe(true);
  });
});

describe('rankByDue / selectBurst', () => {
  const candidates = [
    { cardKey: 'future',  schedule: { reps: 1, intervalDays: 5, ease: 2.5, dueAt: '2026-01-15' } },
    { cardKey: 'overdue', schedule: { reps: 1, intervalDays: 5, ease: 2.5, dueAt: '2026-01-05' } },
    { cardKey: 'today',   schedule: { reps: 1, intervalDays: 5, ease: 2.5, dueAt: '2026-01-10' } },
    { cardKey: 'never',   schedule: null },
    { cardKey: 'soon',    schedule: { reps: 1, intervalDays: 5, ease: 2.5, dueAt: '2026-01-12' } },
  ];

  it('sorts due cards (most-overdue first) before not-due filler (soonest-due first); never-reviewed sorts as maximally due', () => {
    const ranked = rankByDue(candidates, NOW).map(c => c.cardKey);
    expect(ranked).toEqual(['never', 'overdue', 'today', 'soon', 'future']);
  });

  it('selectBurst caps at size while preserving the due-first order', () => {
    expect(selectBurst(candidates, 3, NOW)).toEqual(['never', 'overdue', 'today']);
  });

  it('selectBurst returns everything when size exceeds the pool', () => {
    expect(selectBurst(candidates, 100, NOW)).toHaveLength(5);
  });
});
