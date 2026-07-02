// Re-export schema types — the Zod schema in schema.ts is the single source of truth.
export type {
  ExerciseUnion,
  GapTextExercise,
  TableFillExercise,
  GapBankExercise,
  SingleChoiceExercise,
  TrueFalseExercise,
  MatchingExercise,
  CategorizeExercise,
  OddOneOutExercise,
  OrderExercise,
  FreeWriteExercise,
  SpeakingPromptExercise,
  ExerciseSetType,
  ExamGridType,
  ExamFormatType,
  DrillSkillType,
} from './schema';

export type Block = 'H' | 'A' | 'B' | 'C' | 'D' | 'exam';

// Per-item result returned by widget check() and consumed by BlockRunner / ScoringService.
export interface ItemResult {
  ref: string;       // gap key, item index (as string), etc.
  correct: boolean;
  given: string;     // what the learner entered/selected
  expected: string;  // the correct answer (revealed after Auswerten)
  scoreable: boolean; // false for free-write / speaking-prompt
  note?: string;     // set when answer is correct but not the preferred form
}
