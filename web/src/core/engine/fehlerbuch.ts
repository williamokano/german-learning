// Fehlerbuch (personal mistake log, issue #345, F12) — pure TypeScript, no UI/DOM
// imports. A mistake has a natural stable identity (lessonId+exerciseId+ref), so
// this is an upsert, not an append-only log — mirrors the flat-dict shape already
// used by ProgressService/SrsService, just keyed differently.

import type { ExerciseUnion, ItemResult, Block } from '@core/content/types';

export const FEHLERBUCH_CARD_PREFIX = 'fehlerbuch:';

export interface FehlerbuchEntry {
  key: string;
  lessonId: string;
  exerciseId: string;
  block: Block;
  exerciseType: string;
  ref: string;
  given: string;
  expected: string;
  note?: string;
  timesWrong: number;
  firstWrongAt: string; // ISO
  lastWrongAt: string;  // ISO
}

export function mistakeKey(lessonId: string, exerciseId: string, ref: string): string {
  return `${lessonId}:${exerciseId}:${ref}`;
}

export function fehlerbuchCardKey(key: string): string {
  return `${FEHLERBUCH_CARD_PREFIX}${key}`;
}

/**
 * SingleChoice.svelte is the one widget (of 11) where `given` (the selected
 * option's KEY, e.g. "b") and `expected` (the option's TEXT) are different
 * representations. Resolves given to text so both sides are comparable. No-op
 * for every other exercise type.
 */
export function resolveGivenText(exercise: ExerciseUnion, result: ItemResult): string {
  if (exercise.type !== 'single-choice') return result.given;
  const item = exercise.items[Number(result.ref)];
  return item?.options.find(o => o.key === result.given)?.text ?? result.given;
}

/** Pure upsert step — parallel in spirit to sm2.ts's review(prev, rating, now). */
export function recordMistake(
  prev: FehlerbuchEntry | null,
  ctx: { lessonId: string; exerciseId: string; block: Block; exerciseType: string },
  result: ItemResult, // given already resolved via resolveGivenText
  now: Date = new Date(),
): FehlerbuchEntry {
  return {
    key: mistakeKey(ctx.lessonId, ctx.exerciseId, result.ref),
    lessonId: ctx.lessonId,
    exerciseId: ctx.exerciseId,
    block: ctx.block,
    exerciseType: ctx.exerciseType,
    ref: result.ref,
    given: result.given,
    expected: result.expected,
    note: result.note,
    timesWrong: (prev?.timesWrong ?? 0) + 1,
    firstWrongAt: prev?.firstWrongAt ?? now.toISOString(),
    lastWrongAt: now.toISOString(),
  };
}
