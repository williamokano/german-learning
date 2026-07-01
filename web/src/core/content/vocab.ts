import { z } from 'zod';

// ---- vocab.yml schema ----
// Structured, per-lesson vocabulary. The keystone data layer (issue #337) that
// feeds flashcards (F2), SRS (F3), the Wortschatz counter (F4), and drills.
// Mirrors the exercises.yml pattern in ./schema.ts.

export const Article = z.enum(['der', 'die', 'das']);

export const PartOfSpeech = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
  'preposition',
  'conjunction',
  'pronoun',
  'number',
  'other',
]);

export const VocabEntry = z.object({
  de: z.string().min(1),                       // the German word/lemma (without article)
  article: Article.nullable().default(null),   // der/die/das, or null for non-nouns
  plural: z.string().nullable().default(null), // plural form, or null (no plural / "no pl.")
  en: z.string(),                              // English gloss (importer may leave "" + needsReview)
  pos: PartOfSpeech,
  tags: z.array(z.string()).default([]),       // "concrete" => picture-association eligible (F6)
  core: z.boolean().default(true),             // counts toward the Wortschatz total (F4)
  example: z.string().optional(),              // optional; cloze + listening source
  needsReview: z.boolean().default(false),     // importer flag; must be absent/false once committed
  reviewNote: z.string().optional(),           // importer hint to the human reviewer (why flagged)
});

export const VocabSet = z.object({
  // Levels A1–C1 only — kept in lockstep with LEVEL_ORDER below (used by lessonRank).
  lesson: z.string().regex(/^(A1|A2|B1|B2|C1)\/\d{2}$/),
  entries: z.array(VocabEntry),
}).superRefine((set, ctx) => {
  const seen = new Set<string>();
  for (const e of set.entries) {
    // Nouns MAY omit the article (country names: Deutschland; languages: Deutsch; mass
    // nouns; proper names). The reciprocal check below is the one that catches real
    // schema misuse: a verb/adjective with der/die/das is almost certainly a typo.
    if (e.pos !== 'noun' && e.article !== null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${e.de}": only nouns may have an article (pos=${e.pos})` });
    }

    // Flag accidental duplicates. Article is part of the key so legitimate gender
    // homographs (der See "lake" vs die See "sea") are not treated as duplicates.
    const key = `${e.de.toLowerCase()} ${e.pos} ${e.article ?? ''}`;
    if (seen.has(key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate entry: ${e.de} (${e.pos})` });
    }
    seen.add(key);
  }
});

// A committed vocab.yml carries the review-quality invariants on top of the structural
// ones: every draft flag resolved and every gloss filled. Both the Astro content
// collection (content.config.ts) and the CI gate (build/import-vocab.ts) consume THIS, so
// the deployed site can never include unreviewed vocabulary — it isn't left to CI step
// order. (Drafts, which intentionally violate these, are validated against neither.)
export const CommittedVocabSet = VocabSet.superRefine((set, ctx) => {
  for (const e of set.entries) {
    if (e.needsReview) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${e.de}": needsReview must be cleared before commit` });
    }
    if (e.en.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${e.de}": missing English gloss` });
    }
    if (e.reviewNote) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${e.de}": remove reviewNote once needsReview is false` });
    }
  }
});

// ---- inferred types ----
export type ArticleType         = z.infer<typeof Article>;
export type PartOfSpeechType    = z.infer<typeof PartOfSpeech>;
export type VocabEntryType      = z.infer<typeof VocabEntry>;
export type VocabSetType        = z.infer<typeof VocabSet>;
export type CommittedVocabSetType = z.infer<typeof CommittedVocabSet>;

// ---- loader helpers ----
// Lesson ids sort by level (A1 < A2 < B1 < B2 < C1), then by lesson number.
const LEVEL_ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };

/** Map a lesson id ("A1/03") to a comparable integer; -1 for a malformed id. */
export function lessonRank(lesson: string): number {
  const m = lesson.match(/^([A-C][12])\/(\d{2})$/);
  if (!m) return -1;
  const level = LEVEL_ORDER[m[1]];
  if (level === undefined) return -1;
  return level * 100 + Number(m[2]);
}

/**
 * Filter loaded vocab sets down to the words a learner has unlocked: everything
 * from `uptoLesson` and all earlier lessons. Pure (no astro:content), so the
 * Astro page passes in getCollection('vocab') results and tests can cover it.
 */
export function unlockedVocab(sets: VocabSetType[], uptoLesson: string): VocabEntryType[] {
  const cutoff = lessonRank(uptoLesson);
  if (cutoff < 0) return [];
  return sets
    .filter(s => {
      const r = lessonRank(s.lesson);
      return r >= 0 && r <= cutoff;
    })
    .sort((a, b) => lessonRank(a.lesson) - lessonRank(b.lesson))
    .flatMap(s => s.entries);
}
