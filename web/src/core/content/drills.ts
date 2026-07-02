import type { ExerciseSetType, ExerciseUnion, DrillSkillType } from './schema';
import { DrillSkill } from './schema';
import { shuffle } from './flashcards';

// Cross-lesson drill-item bank (issue #341, F5). Pure — no astro:content — so pages
// pass in getCollection('exercises') results and tests can cover it, mirroring the
// unlockedVocab()/vocab.ts pattern.

// Mirrors Astro's CollectionEntry<'exercises'> shape minimally (id + data), so this
// module stays pure/testable without importing 'astro:content'.
export interface ExerciseSetEntry {
  id: string;
  data: ExerciseSetType;
}

export interface DrillItem {
  lessonId: string;   // data.lesson, e.g. "A1/04" — real id for fehlerbuch + widget autosave
  audioDir: string;   // derived per-item from entry.id, e.g. "audio/A1/04-wohnen/"
  exercise: ExerciseUnion;
}

function audioDirFor(entryId: string): string {
  const parts = entryId.split('/');
  return `audio/${(parts[0] ?? '').toUpperCase()}/${parts[1] ?? ''}/`;
}

/** All tagged exercises matching `skill`, paired with their real source lesson and
 *  audio directory. Order follows the input entries' order (callers shuffle client-side
 *  — a build-time shuffle on a static site would freeze the same order until redeploy). */
export function drillBank(entries: ExerciseSetEntry[], skill: DrillSkillType): DrillItem[] {
  const items: DrillItem[] = [];
  for (const entry of entries) {
    const audioDir = audioDirFor(entry.id);
    for (const exercise of entry.data.exercises) {
      if (exercise.skill === skill) {
        items.push({ lessonId: entry.data.lesson, audioDir, exercise });
      }
    }
  }
  return items;
}

/** Count of tagged exercises per skill, across all entries — every DrillSkill value
 *  is present (0 if untagged), so callers don't need to special-case missing keys. */
export function drillCounts(entries: ExerciseSetEntry[]): Record<DrillSkillType, number> {
  const counts = Object.fromEntries(DrillSkill.options.map(s => [s, 0])) as Record<DrillSkillType, number>;
  for (const entry of entries) {
    for (const exercise of entry.data.exercises) {
      if (exercise.skill) counts[exercise.skill]++;
    }
  }
  return counts;
}

/** One session's shuffled, capped selection from a drill bank. rng injectable for
 *  deterministic tests, mirrors content/flashcards.ts's shuffle. */
export function selectDrillSession(items: DrillItem[], size: number, rng: () => number = Math.random): DrillItem[] {
  return shuffle(items, rng).slice(0, size);
}

/** Stable per-item identity for keying (e.g. Svelte {#key}). No bare exercise.id: that
 *  recurs across lessons (e.g. "A1" is the first Block-A id in nearly every lesson). */
export function drillItemKey(item: DrillItem): string {
  return `${item.lessonId}:${item.exercise.id}`;
}
