import { z } from 'zod';

// ---- shared ----
const Answer = z.union([z.string(), z.array(z.string()).min(1)]);
const GapMap = z.record(z.string(), Answer); // keys: "1", "2", …

const Base = z.object({
  id: z.string().regex(/^[HABCD]\d+[a-z]?$|^exam-/),
  block: z.enum(['H', 'A', 'B', 'C', 'D', 'exam']),
  title: z.string(),
  instructions: z.string().optional(),
  instructionsEn: z.string().optional(),
  audio: z.string().optional(),
  transcript: z.string().optional(),    // H4 Kurze Ansage transcript text
  audioContext: z.string().optional(),  // hint for audio generation (e.g. "phone-filter")
  recycledFrom: z.string().optional(),
  notes: z.string().optional(),
  caseSensitive: z.boolean().optional(),
  strictUmlaut: z.boolean().optional(),
  keepPunctuation: z.boolean().optional(),
});

// ---- per type ----
const AltAnswer = z.object({ word: z.string(), note: z.string().optional() });

export const GapText = Base.extend({
  type: z.literal('gap-text'),
  text: z.string(),
  answers: GapMap,
  alts: z.record(z.string(), z.array(AltAnswer)).optional(),
  cues: z.record(z.string(), z.string()).optional(),
  listLayout: z.boolean().optional(), // true → gaps render as ______ (no "(n)" prefix)
});

export const TableFill = Base.extend({
  type: z.literal('table-fill'),
  columns: z.array(z.string()),
  rows: z.array(z.object({
    label: z.string(),
    cells: z.array(z.union([
      z.null(),
      z.object({
        gap: z.number().int().positive(),
        answer: Answer,
        given: z.string().optional(),
      }),
    ])),
  })),
});

export const GapBank = Base.extend({
  type: z.literal('gap-bank'),
  text: z.string(),
  bank: z.array(z.string()),
  answers: GapMap,
});

const Option = z.object({ key: z.string(), text: z.string() });

export const SingleChoice = Base.extend({
  type: z.literal('single-choice'),
  items: z.array(z.object({
    q: z.string(),
    audio: z.string().optional(), // per-item clip (e.g. hoerzu1.mp3)
    options: z.array(Option).min(2),
    answer: z.string(),
    why: z.string().optional(),
  })),
});

export const TrueFalse = Base.extend({
  type: z.literal('true-false'),
  positiveLabel: z.string().default('Richtig'),
  negativeLabel: z.string().default('Falsch'),
  items: z.array(z.object({
    q: z.string(),
    audio: z.string().optional(), // per-item clip
    answer: z.boolean(),
    why: z.string().optional(),
  })),
});

export const Matching = Base.extend({
  type: z.literal('matching'),
  left: z.array(z.object({ key: z.string(), text: z.string() })),
  right: z.array(z.object({ key: z.string(), text: z.string() })),
  answers: z.record(z.string(), z.string()),
});

export const Categorize = Base.extend({
  type: z.literal('categorize'),
  buckets: z.array(z.object({ key: z.string(), label: z.string() })),
  tokens: z.array(z.object({
    text: z.string(),
    bucket: z.string(),
    tag: z.string().optional(),
  })),
});

export const OddOneOut = Base.extend({
  type: z.literal('odd-one-out'),
  groups: z.array(z.object({
    items: z.array(z.string()).min(3),
    odd: z.number().int().min(0),
    why: z.string().optional(),
  })),
});

export const Order = Base.extend({
  type: z.literal('order'),
  items: z.array(z.object({
    tiles: z.array(z.string()),
    answer: z.array(z.number().int().min(0)),
    alt: z.array(z.array(z.number().int().min(0))).optional(),
    note: z.string().optional(),
  })),
});

export const FreeWrite = Base.extend({
  type: z.literal('free-write'),
  prompt: z.string(),
  genre: z.string().optional(),
  stimulus: z.string().optional(),
  minSentences: z.number().int().positive().optional(),
  use: z.array(z.string()).optional(),
  selfCheck: z.array(z.string()).optional(),
  model: z.string().optional(),
  maxScore: z.number().int().positive().optional(),
});

export const SpeakingPrompt = Base.extend({
  type: z.literal('speaking-prompt'),
  parts: z.array(z.object({
    label: z.string(),
    prompt: z.string(),
    bullets: z.array(z.string()).optional(),
  })),
  criteria: z.array(z.string()).optional(),
  maxScore: z.number().int().positive().optional(),
});

export const ExamSkill = z.object({
  key: z.enum(['hoeren', 'lesen', 'schreiben', 'sprechen']),
  label: z.string(),
  maxPoints: z.number().int().min(0),
  passPoints: z.number().int().min(0),
  exerciseIds: z.array(z.string()),
  selfAssessed: z.boolean().default(false),
});

export const ExamGrid = z.object({
  skills: z.array(ExamSkill),
  totalPass: z.number().int().min(0),
  rule: z.string().optional(),
});

export const Exercise = z.discriminatedUnion('type', [
  GapText, TableFill, GapBank, SingleChoice, TrueFalse,
  Matching, Categorize, OddOneOut, Order, FreeWrite, SpeakingPrompt,
]);

function extractGapKeys(text: string): Set<string> {
  const keys = new Set<string>();
  for (const m of text.matchAll(/\{(\d+)\}/g)) keys.add(m[1]);
  return keys;
}

export const ExerciseSet = z.object({
  lesson: z.string().regex(/^[A-C][12]\/\d{2}$/),
  title: z.string(),
  intro: z.string().optional(),
  partial: z.boolean().default(false), // true = fixture only; gen-exercises skips writing md files
  exam: ExamGrid.nullable().default(null),
  exercises: z.array(Exercise),
}).superRefine((set, ctx) => {
  const seen = new Set<string>();
  for (const ex of set.exercises) {
    if (seen.has(ex.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate exercise id: ${ex.id}` });
    }
    seen.add(ex.id);

    if ((ex.type === 'gap-text' || ex.type === 'gap-bank') && ex.text) {
      const inText = extractGapKeys(ex.text);
      const inAnswers = new Set(Object.keys(ex.answers ?? {}));
      for (const k of inText) {
        if (!inAnswers.has(k)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${ex.id}: gap {${k}} has no answer` });
        }
      }
      for (const k of inAnswers) {
        if (!inText.has(k)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${ex.id}: answer key "${k}" has no matching gap` });
        }
      }
    }

    if (ex.type === 'gap-bank' && ex.answers) {
      const bank = new Set(ex.bank);
      for (const [key, ans] of Object.entries(ex.answers)) {
        const word = Array.isArray(ans) ? ans[0] : ans;
        if (!bank.has(word)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${ex.id}: answer for gap ${key} ("${word}") not in bank` });
        }
      }
    }

    if (ex.audio && !ex.audio.endsWith('.mp3')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${ex.id}: audio "${ex.audio}" must end in .mp3` });
    }
  }
});

// Inferred types — used by widgets and grading engine
export type ExerciseUnion        = z.infer<typeof Exercise>;
export type GapTextExercise      = z.infer<typeof GapText>;
export type TableFillExercise    = z.infer<typeof TableFill>;
export type GapBankExercise      = z.infer<typeof GapBank>;
export type SingleChoiceExercise = z.infer<typeof SingleChoice>;
export type TrueFalseExercise    = z.infer<typeof TrueFalse>;
export type MatchingExercise     = z.infer<typeof Matching>;
export type CategorizeExercise   = z.infer<typeof Categorize>;
export type OddOneOutExercise    = z.infer<typeof OddOneOut>;
export type OrderExercise        = z.infer<typeof Order>;
export type FreeWriteExercise    = z.infer<typeof FreeWrite>;
export type SpeakingPromptExercise = z.infer<typeof SpeakingPrompt>;
export type ExerciseSetType      = z.infer<typeof ExerciseSet>;
export type ExamGridType         = z.infer<typeof ExamGrid>;
