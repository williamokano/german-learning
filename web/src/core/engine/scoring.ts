// ScoringService — pure TypeScript, no UI/DOM imports

import type { Block, ExamGridType } from '@core/content/types';

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

/**
 * Score an exam against its grid. Auto-scored skills are scaled to the grid's
 * `maxPoints` (B2/C1 grids give 25 points for 18–21 items; issue #471), rounded to
 * whole points. A skill with `maxPoints: 0` is shown but doesn't count toward the
 * "all but one skill passed" rule — it can't be failed, so it mustn't help pass.
 */
export function scoreExam(
  grid: ExamGridType,
  scores: ExerciseScore[],
  selfScores: Record<string, number>,
): ExamResult {
  const byId = new Map(scores.map(s => [s.id, s]));
  const skills: ExamSkillResult[] = grid.skills.map(skill => {
    let points: number;
    if (skill.selfAssessed) {
      points = selfScores[skill.key] ?? 0;
    } else {
      let correct = 0, scoreable = 0;
      for (const id of skill.exerciseIds) {
        correct += byId.get(id)?.correct ?? 0;
        scoreable += byId.get(id)?.scoreable ?? 0;
      }
      points = scoreable === 0 ? 0 : Math.round((correct / scoreable) * skill.maxPoints);
    }
    return {
      name: skill.label,
      points,
      maxPoints: skill.maxPoints,
      passPoints: skill.passPoints,
      passed: points >= skill.passPoints,
    };
  });
  const total = skills.reduce((s, sk) => s + sk.points, 0);
  const totalMax = grid.skills.reduce((s, sk) => s + sk.maxPoints, 0);
  const counted = skills.filter(sk => sk.maxPoints > 0);
  const passedCount = counted.filter(sk => sk.passed).length;
  const passed = total >= grid.totalPass && passedCount >= counted.length - 1;
  return { lesson: '', skills, total, totalMax, totalPass: grid.totalPass, passed };
}
