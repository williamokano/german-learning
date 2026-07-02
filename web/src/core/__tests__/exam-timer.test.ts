import { describe, it, expect } from 'vitest';
import {
  remainingSeconds,
  isExpired,
  formatMMSS,
  DEFAULT_EXAM_DURATION_MINUTES,
} from '@core/engine/exam-timer';

describe('remainingSeconds', () => {
  it('returns the full duration at the start', () => {
    const start = 1_000_000;
    expect(remainingSeconds(start, 60, start)).toBe(3600);
  });

  it('counts down as time passes', () => {
    const start = 1_000_000;
    expect(remainingSeconds(start, 1, start + 30_000)).toBe(30);
  });

  it('clamps to 0 once time is up, never negative', () => {
    const start = 1_000_000;
    expect(remainingSeconds(start, 1, start + 90_000)).toBe(0);
  });

  it('handles long exam durations (B2/C1 grids run past 3 hours)', () => {
    const start = 1_000_000;
    expect(remainingSeconds(start, 205, start)).toBe(205 * 60);
  });
});

describe('isExpired', () => {
  it('is false before the duration elapses', () => {
    const start = 1_000_000;
    expect(isExpired(start, 10, start + 5_000)).toBe(false);
  });

  it('is true exactly at the duration boundary', () => {
    const start = 1_000_000;
    expect(isExpired(start, 1, start + 60_000)).toBe(true);
  });

  it('is true well past the duration', () => {
    const start = 1_000_000;
    expect(isExpired(start, 1, start + 120_000)).toBe(true);
  });

  it('is false at the very start', () => {
    const start = 1_000_000;
    expect(isExpired(start, 60, start)).toBe(false);
  });
});

describe('formatMMSS', () => {
  it('pads single-digit minutes and seconds', () => {
    expect(formatMMSS(65)).toBe('01:05');
  });

  it('formats zero as 00:00', () => {
    expect(formatMMSS(0)).toBe('00:00');
  });

  it('does not clamp minutes past 99 (long exam grids)', () => {
    expect(formatMMSS(205 * 60)).toBe('205:00');
  });

  it('formats a round number of minutes with :00 seconds', () => {
    expect(formatMMSS(600)).toBe('10:00');
  });
});

describe('DEFAULT_EXAM_DURATION_MINUTES', () => {
  it('is a sane fallback (60 minutes)', () => {
    expect(DEFAULT_EXAM_DURATION_MINUTES).toBe(60);
  });
});
