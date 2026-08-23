// ContentService — loads typed exercise/lesson data
// Stub for P0; wired to Astro content collections in P2.

import type { ExerciseSetType } from '@core/content/types';

export interface ContentServiceInterface {
  getExerciseSet(lesson: string): Promise<ExerciseSetType | null>;
}

export class ContentService implements ContentServiceInterface {
  async getExerciseSet(_lesson: string): Promise<ExerciseSetType | null> {
    // Implemented in P2 when content collections are wired
    return null;
  }
}
