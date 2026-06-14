// Exercise and lesson content types — full Zod schema added in P2
// See docs/web/CONTENT-MODEL.md for the complete discriminated union schema

export type Block = 'H' | 'A' | 'B' | 'C' | 'D';

export type ExerciseType =
  | 'gap-text'
  | 'table-fill'
  | 'gap-bank'
  | 'single-choice'
  | 'true-false'
  | 'matching'
  | 'categorize'
  | 'odd-one-out'
  | 'order'
  | 'free-write'
  | 'speaking-prompt';

export interface BaseExercise {
  id: string;
  block: Block;
  type: ExerciseType;
  title: string;
  instructions?: string;
  audio?: string;
}

// Discriminated union — full per-type shapes added in P2
export type Exercise = BaseExercise & Record<string, unknown>;

export interface ExerciseSet {
  lesson: string;
  exercises: Exercise[];
}

export interface ExamGrid {
  skills: ExamSkill[];
  totalPass: number;
  rule: string;
}

export interface ExamSkill {
  name: string;
  exerciseIds: string[];
  maxPoints: number;
  passPoints: number;
  selfAssessed?: boolean;
}

export interface LessonFrontmatter {
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  lesson: number;
  slug: string;
}
