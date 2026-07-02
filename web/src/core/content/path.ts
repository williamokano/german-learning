// Learning path manifest (issue #344, F9) — pure TypeScript, no UI/DOM imports.
// Derives the 68-node spine (63 lesson-pills + 5 Prüfungstraining checkpoints) from
// existing content collections. Three further node kinds (`vocab-set`, `drill`,
// `review/boss`) are reserved in the type union for forward-compat but NOT populated
// in v1 — `drills.ts:69-72` already invited this seam; revisit when F10 ships a real
// review/boss mode or F6's picture-association fills `vocab-set`.
//
// Pure (no astro:content) — Astro pages pass in getCollection() results and tests
// can cover the whole module directly, mirroring `vocab.ts` and `drills.ts`.

import { lessonRank } from './vocab';

export type PathNodeId = string;

// Kinds populated by v1 of buildPathManifest. The other kinds are declared in the
// union so consumers can switch over all known kinds without a stale-branch error,
// but the manifest never produces them — forward-compat only.
export type PathNodeKind =
  | 'lesson-pill'
  | 'checkpoint-quiz'
  | 'vocab-set'        // reserved for v1.5+
  | 'drill'            // reserved for v1.5+
  | 'review-boss';     // reserved for F10

const POPULATED_KINDS: ReadonlySet<PathNodeKind> = new Set(['lesson-pill', 'checkpoint-quiz']);

export interface LessonPillNode {
  id: PathNodeId;
  kind: 'lesson-pill';
  lessonId: string;   // canonical "A1/03"
  slug: string;       // folder slug, e.g. "03-essen-und-trinken"
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  number: number;
  vocabEntryCount: number;
}

export interface CheckpointQuizNode {
  id: PathNodeId;
  kind: 'checkpoint-quiz';
  lessonId: string;
  slug: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  number: number;
}

// Discriminated union. `vocab-set`, `drill`, `review-boss` are intentionally omitted
// from this union's runtime values (buildPathManifest never produces them) — when
// F10 ships a real review/boss mode or F6 fills vocab-set, add the interface here.
export type PathNode = LessonPillNode | CheckpointQuizNode;

// Minimal structural types — accepting the full Astro CollectionEntry<'lessons'> shape
// would force this module to import 'astro:content', breaking the purity invariant.
// Pages pass in pre-projected entries; tests build the same shape directly.
export interface PathManifestLessonInput {
  id: string;
  data: {
    lesson?: string;     // canonical "A1/03"
    slug?: string;
    title?: string;
    level?: string;
    number?: number;
  };
}

export interface PathManifestVocabSetInput {
  id: string;
  lesson: string;
  entries: ReadonlyArray<unknown>;
}

export interface BuildPathManifestInput {
  lessons: ReadonlyArray<PathManifestLessonInput>;
  vocabSets: ReadonlyArray<PathManifestVocabSetInput>;
}

/** Match Prüfungstraining slugs. Anchored on the slug field (not the lesson id or
 *  title) because that's the canonical content author signal — the title uses different
 *  German labels per level, but every Prüfungstraining lesson has one of these slugs. */
export function isPruefungstrainingSlug(slug: string): boolean {
  return /(pruefungstraining-[a-c][12]|wiederholung-und-pruefungstraining)/.test(slug);
}

export function pathNodeIdFor(lessonId: string, kind: PathNodeKind): PathNodeId {
  return `${kind}:${lessonId}`;
}

function projectLesson(lesson: PathManifestLessonInput): { lessonId: string; slug: string; title: string; level: 'A1'|'A2'|'B1'|'B2'|'C1'; number: number } | null {
  const data = lesson.data;
  if (!data.lesson || !data.slug || !data.title || !data.level || data.number == null) return null;
  if (!/^[A-C][12]$/.test(data.level)) return null; // unknown level (e.g. C2 stub lessons)
  return {
    lessonId: data.lesson,
    slug: data.slug,
    title: data.title,
    level: data.level as 'A1'|'A2'|'B1'|'B2'|'C1',
    number: data.number,
  };
}

/**
 * Build the linear path manifest. Sorts ascending by `lessonRank(lessonId)` so
 * A1/01 < A1/02 < ... < C1/12.
 *
 * Rule: a lesson is a `lesson-pill` if it has a matching vocab set AND is NOT a
 * Prüfungstraining. Otherwise (Prüfungstraining) it is a `checkpoint-quiz`. Vocab from
 * Prüfungstraining lessons that DO carry one (B2/14, C1/12) is still learnable via the
 * separate `unlockedVocab(sets, lastPillLesson)` path — it just doesn't gate a path
 * node in its own right. B1/13 (`schreiben-und-sprechen-b1`) and C1/08
 * (`textproduktion-c1`) are exam-adjacent but carry vocab, so they remain lesson-pills.
 *
 * V1 contract: for the real A1–C1 corpus, returns exactly 63 `lesson-pill` nodes +
 * 5 `checkpoint-quiz` nodes = 68 total. Pinned in path.test.ts so silent drift
 * (e.g. someone adding a 7th Prüfungstraining without updating the plan) is caught.
 */
export function buildPathManifest(input: BuildPathManifestInput): PathNode[] {
  const projected = input.lessons
    .map(projectLesson)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Index vocab sets by canonical lesson id — O(1) presence check. A lesson
  // "has vocab" iff a vocab.yml file exists for it, regardless of entry count.
  // (Real vocab.yml files are never empty; even an empty file is "vocab present.")
  const vocabByLesson = new Map<string, PathManifestVocabSetInput>();
  for (const set of input.vocabSets) {
    vocabByLesson.set(set.lesson, set);
  }

  const nodes: PathNode[] = [];
  for (const lesson of projected) {
    const vocabSet = vocabByLesson.get(lesson.lessonId);
    const isCheckpoint = isPruefungstrainingSlug(lesson.slug);
    const hasVocab = vocabSet != null;

    if (isCheckpoint) {
      nodes.push({
        id: pathNodeIdFor(lesson.lessonId, 'checkpoint-quiz'),
        kind: 'checkpoint-quiz',
        ...lesson,
      });
    } else if (hasVocab) {
      nodes.push({
        id: pathNodeIdFor(lesson.lessonId, 'lesson-pill'),
        kind: 'lesson-pill',
        ...lesson,
        vocabEntryCount: vocabSet!.entries.length,
      });
    }
    // Lesson with no vocab and not a checkpoint: skip (would only happen for malformed
    // content; the 68 manifest count guards against unexpected drops).
  }

  nodes.sort((a, b) => lessonRank(a.lessonId) - lessonRank(b.lessonId));
  return nodes;
}

/** First node whose id is NOT in `completedIds`. `null` iff every node is complete. */
export function getNextNode(manifest: PathNode[], completedIds: ReadonlySet<PathNodeId>): PathNode | null {
  for (const node of manifest) {
    if (!completedIds.has(node.id)) return node;
  }
  return null;
}

export interface PathProgressStats {
  done: number;
  total: number;
  current: PathNode | null;
}

export function getProgressStats(manifest: PathNode[], completedIds: ReadonlySet<PathNodeId>): PathProgressStats {
  const total = manifest.length;
  let done = 0;
  for (const node of manifest) if (completedIds.has(node.id)) done++;
  return { done, total, current: getNextNode(manifest, completedIds) };
}

/** Type guard: returns true if this kind is one buildPathManifest produces in v1. */
export function isPopulatedKind(kind: PathNodeKind): boolean {
  return POPULATED_KINDS.has(kind);
}
