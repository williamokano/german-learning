import { describe, it, expect } from 'vitest';
import { aggregateLesson, PASS_THRESHOLD } from '@core/engine/scoring';
import type { ExerciseScore } from '@core/engine/scoring';

const score = (id: string, block: string, correct: number, scoreable: number): ExerciseScore =>
  ({ id, block: block as ExerciseScore['block'], correct, scoreable });

describe('aggregateLesson', () => {
  it('computes totals correctly', () => {
    const result = aggregateLesson('A1/01', [
      score('H2', 'H', 3, 4),
      score('C1', 'C', 8, 10),
    ]);
    expect(result.correct).toBe(11);
    expect(result.scoreable).toBe(14);
  });

  it('computes pct correctly', () => {
    const result = aggregateLesson('A1/01', [score('C1', 'C', 8, 10)]);
    expect(result.pct).toBeCloseTo(0.8);
  });

  it('passes at exactly 80%', () => {
    const result = aggregateLesson('A1/01', [score('C1', 'C', 8, 10)]);
    expect(result.passed).toBe(true);
  });

  it('fails below 80%', () => {
    const result = aggregateLesson('A1/01', [score('H2', 'H', 3, 4)]);
    expect(result.pct).toBeCloseTo(0.75);
    expect(result.passed).toBe(false);
  });

  it('groups scores by block', () => {
    const result = aggregateLesson('A1/01', [
      score('H1', 'H', 5, 5),
      score('H2', 'H', 3, 4),
      score('C1', 'C', 9, 10),
    ]);
    const hBlock = result.byBlock.find(b => b.block === 'H');
    const cBlock = result.byBlock.find(b => b.block === 'C');
    expect(hBlock?.correct).toBe(8);
    expect(hBlock?.scoreable).toBe(9);
    expect(cBlock?.correct).toBe(9);
    expect(cBlock?.scoreable).toBe(10);
  });

  it('returns 0 pct and not passed for empty scores', () => {
    const result = aggregateLesson('A1/01', []);
    expect(result.pct).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('handles perfect score', () => {
    const result = aggregateLesson('A1/01', [
      score('C1', 'C', 10, 10),
      score('C2', 'C', 6, 6),
    ]);
    expect(result.pct).toBe(1);
    expect(result.passed).toBe(true);
  });

  it('PASS_THRESHOLD is 0.8', () => {
    expect(PASS_THRESHOLD).toBe(0.8);
  });
});
