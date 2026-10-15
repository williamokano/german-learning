// ProgressService — tracks per-lesson answers and results
// Full implementation in P2. See docs/web/SCORING.md §7.

import type { LessonScore } from '@core/engine/scoring';
import type { ExamResult } from '@core/engine/scoring';
import type { StorageService } from '@core/services/storage';
import type { ItemResult } from '@core/content/types';

const NS = 'gl:v1';

export interface CourseProgress {
  [lesson: string]: {
    pct: number;
    passed: boolean;
    lastAttempt: string; // ISO date
  };
}

export interface ExerciseGrading {
  results: ItemResult[];
  correct: number;
  scoreable: number;
}

export class ProgressService {
  constructor(private storage: StorageService) {}

  loadAnswers(lesson: string, exerciseId: string): unknown | null {
    return this.storage.get(`${NS}:answers:${lesson}:${exerciseId}`);
  }

  saveAnswers(lesson: string, exerciseId: string, state: unknown): void {
    this.storage.set(`${NS}:answers:${lesson}:${exerciseId}`, state);
  }

  clearAnswers(lesson: string, exerciseId: string): void {
    this.storage.remove(`${NS}:answers:${lesson}:${exerciseId}`);
  }

  /** Last per-exercise check on a lesson page (#470), so marks survive a reload and
   *  re-checking doesn't count the same mistakes twice. */
  loadGrading(lesson: string, exerciseId: string): ExerciseGrading | null {
    const g = this.storage.get<ExerciseGrading>(`${NS}:graded:${lesson}:${exerciseId}`);
    return g && Array.isArray(g.results) ? g : null;
  }

  saveGrading(lesson: string, exerciseId: string, grading: ExerciseGrading): void {
    this.storage.set(`${NS}:graded:${lesson}:${exerciseId}`, grading);
  }

  clearGrading(lesson: string, exerciseId: string): void {
    this.storage.remove(`${NS}:graded:${lesson}:${exerciseId}`);
  }

  recordResult(lesson: string, score: LessonScore | ExamResult): void {
    const existing = this.storage.get<CourseProgress>(`${NS}:progress`) ?? {};
    const pct = 'pct' in score ? score.pct : score.total / score.totalMax;
    const passed = score.passed;
    const prev = existing[lesson];
    existing[lesson] = {
      pct:   prev == null || pct > prev.pct ? pct : prev.pct,
      passed: passed || (prev?.passed ?? false),
      lastAttempt: new Date().toISOString(),
    };
    this.storage.set(`${NS}:progress`, existing);
  }

  getProgress(): CourseProgress {
    return this.storage.get<CourseProgress>(`${NS}:progress`) ?? {};
  }

  /** Canonical ids ("A1/03") of lessons whose exercises or exam were passed. */
  passedLessonIds(): string[] {
    return Object.entries(this.getProgress())
      .filter(([, r]) => r?.passed === true)
      .map(([lesson]) => lesson);
  }

  isUnlocked(_lesson: string): boolean {
    // Advisory — gate logic implemented in P2; always true for now
    return true;
  }
}
