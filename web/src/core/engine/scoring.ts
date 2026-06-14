// ScoringService — pure TypeScript, no UI/DOM imports
// Full implementation in P2. See docs/web/SCORING.md §3–6.

import type { Block, ExamGrid } from '@core/content/types';

export interface ExerciseScore {
  id: string;
  block: Block;
  correct: number;
  scoreable: number;
}

export interface BlockScore {
  block: Block;
  correct: number;
  scoreable: number;
  pct: number;
}

export interface LessonScore {
  lesson: string;
  byExercise: ExerciseScore[];
  byBlock: BlockScore[];
  correct: number;
  scoreable: number;
  pct: number;
  passed: boolean;
}

export interface ExamSkillResult {
  name: string;
  points: number;
  maxPoints: number;
  passPoints: number;
  passed: boolean;
}

export interface ExamResult {
  lesson: string;
  skills: ExamSkillResult[];
  total: number;
  totalMax: number;
  totalPass: number;
  passed: boolean;
}

export const PASS_THRESHOLD = 0.8;

export function aggregateLesson(lesson: string, scores: ExerciseScore[]): LessonScore {
  // Stub — implemented in P2
  const correct = scores.reduce((s, e) => s + e.correct, 0);
  const scoreable = scores.reduce((s, e) => s + e.scoreable, 0);
  const pct = scoreable === 0 ? 0 : correct / scoreable;
  const byBlock = new Map<Block, { correct: number; scoreable: number }>();
  for (const e of scores) {
    const b = byBlock.get(e.block) ?? { correct: 0, scoreable: 0 };
    b.correct   += e.correct;
    b.scoreable += e.scoreable;
    byBlock.set(e.block, b);
  }
  return {
    lesson,
    byExercise: scores,
    byBlock: [...byBlock.entries()].map(([block, b]) => ({
      block,
      correct: b.correct,
      scoreable: b.scoreable,
      pct: b.scoreable === 0 ? 0 : b.correct / b.scoreable,
    })),
    correct, scoreable, pct,
    passed: pct >= PASS_THRESHOLD,
  };
}

export function scoreExam(
  _grid: ExamGrid,
  _scores: ExerciseScore[],
  _selfScores: Record<string, number>,
): ExamResult {
  // Stub — implemented in P3
  throw new Error('scoreExam not yet implemented');
}
