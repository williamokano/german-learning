import { describe, it, expect } from 'vitest';
import type { ExerciseUnion, ItemResult } from '@core/content/types';
import {
  mistakeKey,
  fehlerbuchCardKey,
  resolveGivenText,
  recordMistake,
} from '@core/engine/fehlerbuch';
import type { FehlerbuchEntry } from '@core/engine/fehlerbuch';

const singleChoiceExercise = {
  id: 'A1', block: 'A', title: 'Test', type: 'single-choice',
  items: [
    { q: 'Wie heißt du?', options: [{ key: 'a', text: 'gut' }, { key: 'b', text: 'Anna' }], answer: 'b' },
  ],
} as unknown as ExerciseUnion;

const gapTextExercise = {
  id: 'A2', block: 'A', title: 'Test', type: 'gap-text',
  text: 'Ich ___ Anna.', answers: { '1': 'bin' },
} as unknown as ExerciseUnion;

function itemResult(overrides: Partial<ItemResult> = {}): ItemResult {
  return { ref: '0', correct: false, given: '', expected: '', scoreable: true, ...overrides };
}

describe('mistakeKey / fehlerbuchCardKey', () => {
  it('composes lessonId:exerciseId:ref', () => {
    expect(mistakeKey('A1/03', 'A1', '0')).toBe('A1/03:A1:0');
  });

  it('prefixes for the SRS card key', () => {
    expect(fehlerbuchCardKey('A1/03:A1:0')).toBe('fehlerbuch:A1/03:A1:0');
  });
});

describe('resolveGivenText', () => {
  it('passes given through unchanged for non-single-choice types', () => {
    const result = itemResult({ given: 'binn', expected: 'bin' });
    expect(resolveGivenText(gapTextExercise, result)).toBe('binn');
  });

  it('resolves a single-choice option KEY to its TEXT', () => {
    const result = itemResult({ ref: '0', given: 'a', expected: 'Anna' });
    expect(resolveGivenText(singleChoiceExercise, result)).toBe('gut');
  });

  it('falls back to the raw given if the key does not match any option', () => {
    const result = itemResult({ ref: '0', given: 'z', expected: 'Anna' });
    expect(resolveGivenText(singleChoiceExercise, result)).toBe('z');
  });

  it('falls back to the raw given if the ref does not resolve to an item', () => {
    const result = itemResult({ ref: '99', given: 'a', expected: 'Anna' });
    expect(resolveGivenText(singleChoiceExercise, result)).toBe('a');
  });
});

describe('recordMistake', () => {
  const ctx = { lessonId: 'A1/03', exerciseId: 'A1', block: 'A' as const, exerciseType: 'gap-text' };
  const now = new Date(2026, 0, 10);

  it('creates a fresh entry with timesWrong=1', () => {
    const result = itemResult({ ref: '0', given: 'binn', expected: 'bin' });
    const entry = recordMistake(null, ctx, result, now);
    expect(entry.timesWrong).toBe(1);
    expect(entry.firstWrongAt).toBe(now.toISOString());
    expect(entry.lastWrongAt).toBe(now.toISOString());
    expect(entry.key).toBe('A1/03:A1:0');
  });

  it('increments timesWrong on repeat, preserves firstWrongAt, updates lastWrongAt/given/expected', () => {
    const first = recordMistake(null, ctx, itemResult({ ref: '0', given: 'binn', expected: 'bin' }), now);
    const later = new Date(2026, 0, 15);
    const second = recordMistake(first, ctx, itemResult({ ref: '0', given: 'bist', expected: 'bin' }), later);
    expect(second.timesWrong).toBe(2);
    expect(second.firstWrongAt).toBe(now.toISOString());
    expect(second.lastWrongAt).toBe(later.toISOString());
    expect(second.given).toBe('bist');
  });

  it('carries the note field through when present', () => {
    const entry = recordMistake(null, ctx, itemResult({ note: 'accepted but not preferred' }), now);
    expect(entry.note).toBe('accepted but not preferred');
  });

  it('satisfies the FehlerbuchEntry shape', () => {
    const entry: FehlerbuchEntry = recordMistake(null, ctx, itemResult(), now);
    expect(entry.lessonId).toBe('A1/03');
    expect(entry.exerciseId).toBe('A1');
    expect(entry.block).toBe('A');
    expect(entry.exerciseType).toBe('gap-text');
  });
});
