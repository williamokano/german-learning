// ProgressService — tracks per-lesson answers and results
// Full implementation in P2. See docs/web/SCORING.md §7.

import type { LessonScore } from '@core/engine/scoring';
import type { ExamResult } from '@core/engine/scoring';
import type { StorageService } from '@core/services/storage';

const NS = 'gl:v1';

export interface CourseProgress {
  [lesson: string]: {
    pct: number;
    passed: boolean;
    lastAttempt: string; // ISO date
  };
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

  isUnlocked(_lesson: string): boolean {
    // Advisory — gate logic implemented in P2; always true for now
    return true;
  }
}
