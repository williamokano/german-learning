import { describe, it, expect } from 'vitest';
import { aggregateLesson, scoreExam, PASS_THRESHOLD } from '@core/engine/scoring';
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

describe('scoreExam (#471)', () => {
  // Minimal grid shaped like B2/14: 25-point skills with fewer auto-scored items.
  const grid = {
    totalPass: 60,
    skills: [
      { key: 'hoeren', label: 'Hören', maxPoints: 25, passPoints: 14, exerciseIds: ['H1', 'H2'], selfAssessed: false },
      { key: 'lesen', label: 'Lesen', maxPoints: 25, passPoints: 14, exerciseIds: ['L1'], selfAssessed: false },
      { key: 'schreiben', label: 'Schreiben', maxPoints: 25, passPoints: 14, exerciseIds: [], selfAssessed: true },
      { key: 'sprechen', label: 'Sprechen', maxPoints: 25, passPoints: 14, exerciseIds: [], selfAssessed: true },
    ],
  } as unknown as Parameters<typeof scoreExam>[0];

  it('scales auto-scored points to maxPoints (21/21 items = 25/25)', () => {
    const r = scoreExam(grid, [score('H1', 'C', 10, 10), score('H2', 'C', 11, 11), score('L1', 'C', 9, 18)], {});
    expect(r.skills[0].points).toBe(25);
    expect(r.skills[1].points).toBe(13); // 9/18 of 25 = 12.5 → 13
  });

  it('counts self-assessed points, so a strong exam can pass', () => {
    const auto = [score('H1', 'C', 10, 10), score('H2', 'C', 11, 11), score('L1', 'C', 18, 18)];
    expect(scoreExam(grid, auto, {}).passed).toBe(false);
    expect(scoreExam(grid, auto, { schreiben: 20, sprechen: 18 }).passed).toBe(true);
  });

  it('a 0-point skill neither helps nor hurts the "all but one passed" rule', () => {
    const real = [
      { key: 'hoeren', label: 'Hören', maxPoints: 10, passPoints: 6, exerciseIds: ['H1'], selfAssessed: false },
      { key: 'lesen', label: 'Lesen', maxPoints: 10, passPoints: 6, exerciseIds: ['L1'], selfAssessed: false },
    ];
    const zero = { key: 'sprechen', label: 'Sprechen', maxPoints: 0, passPoints: 0, exerciseIds: [], selfAssessed: true };
    const withZero = { totalPass: 10, skills: [...real, zero] } as unknown as Parameters<typeof scoreExam>[0];
    const without = { totalPass: 10, skills: real } as unknown as Parameters<typeof scoreExam>[0];
    for (const scores of [
      [score('H1', 'C', 10, 10), score('L1', 'C', 0, 10)],
      [score('H1', 'C', 5, 10), score('L1', 'C', 5, 10)],
      [score('H1', 'C', 10, 10), score('L1', 'C', 10, 10)],
    ]) {
      expect(scoreExam(withZero, scores, {}).passed).toBe(scoreExam(without, scores, {}).passed);
    }
  });
});
