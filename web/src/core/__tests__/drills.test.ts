import { describe, it, expect } from 'vitest';
import { DrillSkill, GrammarTrack } from '@core/content/schema';
import type { ExerciseUnion } from '@core/content/types';
import {
  drillBank,
  drillCounts,
  trackBank,
  trackCounts,
  selectDrillSession,
  drillItemKey,
} from '@core/content/drills';
import type { ExerciseSetEntry, DrillItem } from '@core/content/drills';

function ex(id: string, skill?: string): ExerciseUnion {
  return { id, block: 'A', title: id, type: 'free-write', parts: [] } as unknown as ExerciseUnion;
}

function entry(id: string, lesson: string, exercises: ExerciseUnion[]): ExerciseSetEntry {
  return {
    id,
    data: { lesson, title: lesson, partial: false, exam: null, exercises } as ExerciseSetEntry['data'],
  };
}

describe('drillBank', () => {
  it('is empty when nothing is tagged', () => {
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [ex('A1')])];
    expect(drillBank(entries, 'article-gender')).toEqual([]);
  });

  it('filters to the requested skill only', () => {
    const tagged = { ...ex('A1'), skill: 'article-gender' } as ExerciseUnion;
    const other = { ...ex('A2'), skill: 'plural' } as ExerciseUnion;
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [tagged, other])];
    const bank = drillBank(entries, 'article-gender');
    expect(bank).toHaveLength(1);
    expect(bank[0].exercise.id).toBe('A1');
  });

  it('pairs each item with the real lessonId from data.lesson', () => {
    const tagged = { ...ex('A1'), skill: 'plural' } as ExerciseUnion;
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [tagged])];
    expect(drillBank(entries, 'plural')[0].lessonId).toBe('A1/04');
  });

  it('derives audioDir from the entry id', () => {
    const tagged = { ...ex('A1'), skill: 'plural' } as ExerciseUnion;
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [tagged])];
    expect(drillBank(entries, 'plural')[0].audioDir).toBe('audio/A1/04-wohnen/');
  });

  it('flattens across multiple lessons', () => {
    const a = { ...ex('A1'), skill: 'redemittel' } as ExerciseUnion;
    const b = { ...ex('A1'), skill: 'redemittel' } as ExerciseUnion; // same id, different lesson
    const entries = [
      entry('a1/13-aemter/exercises', 'A1/13', [a]),
      entry('b1/13-schreiben/exercises', 'B1/13', [b]),
    ];
    expect(drillBank(entries, 'redemittel')).toHaveLength(2);
  });

  it('does not mutate the input entries', () => {
    const tagged = { ...ex('A1'), skill: 'plural' } as ExerciseUnion;
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [tagged])];
    const before = JSON.stringify(entries);
    drillBank(entries, 'plural');
    expect(JSON.stringify(entries)).toBe(before);
  });
});

describe('drillCounts', () => {
  it('is 0 for every skill when nothing is tagged', () => {
    const entries = [entry('a1/04-wohnen/exercises', 'A1/04', [ex('A1')])];
    const counts = drillCounts(entries);
    for (const skill of DrillSkill.options) expect(counts[skill]).toBe(0);
  });

  it('matches drillBank(...).length for every skill (cross-check invariant)', () => {
    const entries = [
      entry('a1/04-wohnen/exercises', 'A1/04', [
        { ...ex('A1'), skill: 'article-gender' } as ExerciseUnion,
        { ...ex('A2'), skill: 'plural' } as ExerciseUnion,
        { ...ex('A3'), skill: 'plural' } as ExerciseUnion,
      ]),
    ];
    const counts = drillCounts(entries);
    for (const skill of DrillSkill.options) {
      expect(counts[skill]).toBe(drillBank(entries, skill).length);
    }
  });

  it('sums across multiple lessons', () => {
    const entries = [
      entry('a1/04-wohnen/exercises', 'A1/04', [{ ...ex('A1'), skill: 'plural' } as ExerciseUnion]),
      entry('a1/02-familie/exercises', 'A1/02', [{ ...ex('A6'), skill: 'plural' } as ExerciseUnion]),
    ];
    expect(drillCounts(entries).plural).toBe(2);
  });
});

describe('trackBank', () => {
  it('is empty when nothing is tagged', () => {
    const entries = [entry('a1/09-einkaufen/exercises', 'A1/09', [ex('A1')])];
    expect(trackBank(entries, 'dativ')).toEqual([]);
  });

  it('filters to the requested track only', () => {
    const tagged = { ...ex('A1'), track: 'dativ' } as ExerciseUnion;
    const other = { ...ex('A2'), track: 'akkusativ' } as ExerciseUnion;
    const entries = [entry('a1/09-einkaufen/exercises', 'A1/09', [tagged, other])];
    const bank = trackBank(entries, 'dativ');
    expect(bank).toHaveLength(1);
    expect(bank[0].exercise.id).toBe('A1');
  });

  it('pairs each item with the real lessonId from data.lesson', () => {
    const tagged = { ...ex('A1'), track: 'vergangenheit' } as ExerciseUnion;
    const entries = [entry('a1/11-vergangenheit/exercises', 'A1/11', [tagged])];
    expect(trackBank(entries, 'vergangenheit')[0].lessonId).toBe('A1/11');
  });

  it('derives audioDir from the entry id', () => {
    const tagged = { ...ex('A1'), track: 'vergangenheit' } as ExerciseUnion;
    const entries = [entry('a1/11-vergangenheit/exercises', 'A1/11', [tagged])];
    expect(trackBank(entries, 'vergangenheit')[0].audioDir).toBe('audio/A1/11-vergangenheit/');
  });

  it('flattens across multiple lessons', () => {
    const a = { ...ex('A1'), track: 'praepositionen' } as ExerciseUnion;
    const b = { ...ex('A1'), track: 'praepositionen' } as ExerciseUnion; // same id, different lesson
    const entries = [
      entry('a2/02-zusammen-wohnen/exercises', 'A2/02', [a]),
      entry('b1/08-verben-mit-praepositionen-ii/exercises', 'B1/08', [b]),
    ];
    expect(trackBank(entries, 'praepositionen')).toHaveLength(2);
  });

  it('does not mutate the input entries', () => {
    const tagged = { ...ex('A1'), track: 'akkusativ' } as ExerciseUnion;
    const entries = [entry('a1/03-essen-und-trinken/exercises', 'A1/03', [tagged])];
    const before = JSON.stringify(entries);
    trackBank(entries, 'akkusativ');
    expect(JSON.stringify(entries)).toBe(before);
  });

  it('is independent of the `skill` axis — a track-tagged exercise with no skill still matches', () => {
    const tagged = { ...ex('A1'), track: 'adjektivdeklination' } as ExerciseUnion;
    const entries = [entry('a2/08-adjektive-ueberall/exercises', 'A2/08', [tagged])];
    expect(trackBank(entries, 'adjektivdeklination')).toHaveLength(1);
    expect(drillCounts(entries).plural).toBe(0);
  });
});

describe('trackCounts', () => {
  it('is 0 for every track when nothing is tagged', () => {
    const entries = [entry('a1/09-einkaufen/exercises', 'A1/09', [ex('A1')])];
    const counts = trackCounts(entries);
    for (const track of GrammarTrack.options) expect(counts[track]).toBe(0);
  });

  it('matches trackBank(...).length for every track (cross-check invariant)', () => {
    const entries = [
      entry('a1/09-einkaufen/exercises', 'A1/09', [
        { ...ex('A1'), track: 'dativ' } as ExerciseUnion,
        { ...ex('A2'), track: 'akkusativ' } as ExerciseUnion,
        { ...ex('A3'), track: 'akkusativ' } as ExerciseUnion,
      ]),
    ];
    const counts = trackCounts(entries);
    for (const track of GrammarTrack.options) {
      expect(counts[track]).toBe(trackBank(entries, track).length);
    }
  });

  it('sums across multiple lessons', () => {
    const entries = [
      entry('a1/03-essen-und-trinken/exercises', 'A1/03', [{ ...ex('A1'), track: 'akkusativ' } as ExerciseUnion]),
      entry('a1/13-aemter-telefon-alltag/exercises', 'A1/13', [{ ...ex('A6'), track: 'akkusativ' } as ExerciseUnion]),
    ];
    expect(trackCounts(entries).akkusativ).toBe(2);
  });
});

describe('selectDrillSession', () => {
  const items: DrillItem[] = Array.from({ length: 5 }, (_, i) => ({
    lessonId: 'A1/04', audioDir: 'audio/A1/04-wohnen/', exercise: ex(`A${i}`),
  }));

  it('caps to size when the bank is larger', () => {
    expect(selectDrillSession(items, 3, () => 0.5)).toHaveLength(3);
  });

  it('returns all items (shuffled) when the bank is smaller than size, no padding', () => {
    expect(selectDrillSession(items, 10, () => 0.5)).toHaveLength(5);
  });

  it('is deterministic under a fixed rng', () => {
    const a = selectDrillSession(items, 5, () => 0.5);
    const b = selectDrillSession(items, 5, () => 0.5);
    expect(a.map(i => i.exercise.id)).toEqual(b.map(i => i.exercise.id));
  });

  it('does not mutate the input array', () => {
    const before = items.map(i => i.exercise.id);
    selectDrillSession(items, 5, () => 0.5);
    expect(items.map(i => i.exercise.id)).toEqual(before);
  });
});

describe('drillItemKey', () => {
  it('composes lessonId:exercise.id', () => {
    const item: DrillItem = { lessonId: 'A1/04', audioDir: '', exercise: ex('A1') };
    expect(drillItemKey(item)).toBe('A1/04:A1');
  });

  it('regression: the same exercise.id from two different lessons produces different keys', () => {
    const itemA: DrillItem = { lessonId: 'A1/04', audioDir: '', exercise: ex('A1') };
    const itemB: DrillItem = { lessonId: 'B1/07', audioDir: '', exercise: ex('A1') };
    expect(drillItemKey(itemA)).not.toBe(drillItemKey(itemB));
  });
});
