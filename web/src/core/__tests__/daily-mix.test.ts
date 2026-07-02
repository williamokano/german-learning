import { describe, it, expect } from 'vitest';
import { VocabEntry } from '@core/content/vocab';
import type { VocabEntryType, VocabSetType } from '@core/content/vocab';
import {
  buildDailyMix,
  selectNewPillsForLesson,
  selectDueCards,
  selectInterleavedDrills,
  selectFehlerbuchItems,
  GOAL_ITEM_COUNT,
  GOAL_MINUTES,
  ITEMS_PER_MINUTE,
  DEFAULT_DAILY_MIX_BUDGET,
  type BuildDailyMixInput,
  type CardStateLike,
} from '@core/engine/daily-mix';
import type { ExerciseSetEntry } from '@core/content/drills';
import type { FehlerbuchEntry } from '@core/engine/fehlerbuch';
import type { ExerciseUnion } from '@core/content/types';

function entry(overrides: Partial<VocabEntryType> & { de: string; pos: VocabEntryType['pos'] }): VocabEntryType {
  return VocabEntry.parse(overrides);
}

const apfel  = entry({ de: 'Apfel',  article: 'der', plural: 'Äpfel', en: 'apple',  pos: 'noun' });
const banane = entry({ de: 'Banane', article: 'die', plural: 'Bananen', en: 'banana', pos: 'noun' });
const essen  = entry({ de: 'essen', en: 'to eat', pos: 'verb' });
const deutschland = entry({ de: 'Deutschland', en: 'Germany', pos: 'noun' });

function set(lesson: string, ...entries: VocabEntryType[]): VocabSetType {
  return { lesson, entries };
}

function cardKeyFor(entry: VocabEntryType, face: 'meaning-de-en' | 'meaning-en-de' | 'article'): string {
  return `${entry.de.toLowerCase()} ${entry.pos} ${entry.article ?? ''}|${face}`;
}

const NOW = new Date(2026, 0, 10, 12, 0);

describe('goal sizing', () => {
  it('ITEMS_PER_MINUTE × GOAL_MINUTES = GOAL_ITEM_COUNT', () => {
    for (const goal of ['casual', 'regular', 'serious'] as const) {
      expect(GOAL_ITEM_COUNT[goal]).toBe(GOAL_MINUTES[goal] * ITEMS_PER_MINUTE);
    }
  });

  it('locked sizes: casual 15, regular 30, serious 60', () => {
    expect(GOAL_ITEM_COUNT.casual).toBe(15);
    expect(GOAL_ITEM_COUNT.regular).toBe(30);
    expect(GOAL_ITEM_COUNT.serious).toBe(60);
  });

  it('default budget ratios sum to 1.0', () => {
    const sum = DEFAULT_DAILY_MIX_BUDGET.newPills + DEFAULT_DAILY_MIX_BUDGET.dueCards
              + DEFAULT_DAILY_MIX_BUDGET.interleavedDrills + DEFAULT_DAILY_MIX_BUDGET.fehlerbuch;
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe('buildDailyMix — empty state', () => {
  it('returns empty-state shape when currentLessonId is null', () => {
    const r = buildDailyMix({
      currentLessonId: null,
      vocabSets: [],
      cardStates: {},
      exerciseEntries: [],
      fehlerbuchEntries: [],
      goal: 'regular',
    });
    expect(r.empty).toBe(true);
    expect(r.items).toEqual([]);
    expect(r.stats.total).toBe(0);
  });
});

describe('buildDailyMix — fresh user on A1/01', () => {
  const vocabSets = [
    set('A1/01', apfel, banane, essen, deutschland, apfel /* cross-lesson dup */),
  ];

  function fresh(goal: 'casual' | 'regular' | 'serious'): BuildDailyMixInput {
    return {
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      exerciseEntries: [],
      fehlerbuchEntries: [],
      goal,
      rng: () => 0, // determinism
    };
  }

  it('fresh user has no due cards, no fehlerbuch, no interleaved (A1/01 is the oldest lesson)', () => {
    const r = buildDailyMix(fresh('regular'));
    // 3 unique fresh entries (apfel dedups with itself) × 1 card each = 3 candidates
    expect(r.stats.newPills).toBeGreaterThanOrEqual(3);
    expect(r.stats.newPills).toBeLessThanOrEqual(GOAL_ITEM_COUNT.regular);
    expect(r.stats.dueCards).toBe(0);
    expect(r.stats.interleavedDrills).toBe(0);
    expect(r.stats.fehlerbuch).toBe(0);
  });

  it('items list contains only vocab-card items, all source: new', () => {
    const r = buildDailyMix(fresh('casual'));
    expect(r.items.every(it => it.kind === 'vocab-card')).toBe(true);
    for (const it of r.items) {
      if (it.kind === 'vocab-card') expect(it.source).toBe('new');
    }
  });

  it('stat math: newPills + dueCards + interleavedDrills + fehlerbuch === total', () => {
    const r = buildDailyMix(fresh('serious'));
    expect(r.stats.newPills + r.stats.dueCards + r.stats.interleavedDrills + r.stats.fehlerbuch)
      .toBe(r.stats.total);
  });
});

describe('buildDailyMix — determinism', () => {
  const vocabSets = [set('A1/03', apfel, banane, essen)];
  const cardStates: Record<string, CardStateLike> = {
    [cardKeyFor(apfel, 'meaning-de-en')]: { intervalDays: 1, dueAt: '2026-01-09' }, // overdue
  };
  const exerciseEntries: ExerciseSetEntry[] = [];

  it('produces identical output for identical inputs', () => {
    const a = buildDailyMix({
      currentLessonId: 'A1/03',
      vocabSets, cardStates, exerciseEntries, fehlerbuchEntries: [],
      goal: 'regular', rng: () => 0.7, now: NOW,
    });
    const b = buildDailyMix({
      currentLessonId: 'A1/03',
      vocabSets, cardStates, exerciseEntries, fehlerbuchEntries: [],
      goal: 'regular', rng: () => 0.7, now: NOW,
    });
    expect(a.items.map(it => JSON.stringify(it))).toEqual(b.items.map(it => JSON.stringify(it)));
    expect(a.stats).toEqual(b.stats);
  });
});

describe('selectNewPillsForLesson', () => {
  it('returns one vocab-card item per fresh entry, sized to input.size', () => {
    const vocabSets = [set('A1/01', apfel, banane, essen)];
    const r = selectNewPillsForLesson({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      size: 2,
      rng: () => 0.5,
    });
    expect(r).toHaveLength(2);
    expect(r.every(it => it.kind === 'vocab-card' && it.source === 'new')).toBe(true);
  });

  it('excludes entries that already have a rating on either meaning face', () => {
    const vocabSets = [set('A1/01', apfel, banane, essen)];
    const cardStates: Record<string, CardStateLike> = {
      [cardKeyFor(apfel, 'meaning-de-en')]: { dueAt: '2026-01-12' }, // apfel rated
    };
    const r = selectNewPillsForLesson({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates,
      size: 10,
      rng: () => 0.5,
    });
    // apfel is excluded — only banane, essen remain (2 candidates)
    expect(r).toHaveLength(2);
    const selectedEntries = r.map(p => p.entry.de);
    expect(selectedEntries).not.toContain('Apfel');
    expect(selectedEntries).toContain('Banane');
    expect(selectedEntries).toContain('essen');
  });

  it('treats a one-face-rated entry as "not new" (due wins over new)', () => {
    const vocabSets = [set('A1/01', apfel)];
    const cardStates: Record<string, CardStateLike> = {
      // only meaning-de-en is rated; meaning-en-de still has no state
      [cardKeyFor(apfel, 'meaning-de-en')]: { dueAt: '2026-01-12' },
    };
    const r = selectNewPillsForLesson({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates,
      size: 5,
      rng: () => 0.5,
    });
    expect(r).toHaveLength(0);
  });

  it('item.face and item.cardKey always agree (no rng double-call bug)', () => {
    // Regression guard: an earlier version of this code called pickNewEntryFace(rng)
    // twice — once for `face`, again for `cardKey` — which produced silent desync
    // when rng() returned different values on consecutive calls (e.g. alternating
    // 0.4 / 0.9). With a stateful rng that flips its return, the bug surfaces
    // immediately: face is one direction, cardKey encodes the OTHER direction,
    // and the SRS schedules a card the learner never actually saw.
    const vocabSets = [set('A1/01', apfel, banane, essen)];
    let i = 0;
    const alternating = () => (i++ % 2 === 0 ? 0.4 : 0.9);
    const r = selectNewPillsForLesson({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      size: 10,
      rng: alternating,
    });
    for (const it of r) {
      // The cardKey must encode the same face as `face`. If they disagree, the
      // rendered card and the SRS-updated card differ — silent data corruption.
      const encodedFace = it.cardKey.split('|')[1]; // "apfel noun der|meaning-de-en" → "meaning-de-en"
      expect(encodedFace).toBe(it.face);
    }
  });
});

describe('selectDueCards', () => {
  it('returns due vocab-card items, surface rankByDue ordering (overdue first)', () => {
    const vocabSets = [set('A1/01', apfel, banane, essen)];
    const cardStates: Record<string, CardStateLike> = {
      // apfel is overdue (3 days ago), banane is due today, essen has no state
      [cardKeyFor(apfel, 'meaning-de-en')]: { intervalDays: 1, dueAt: '2026-01-07' },
      [cardKeyFor(banane, 'meaning-de-en')]: { intervalDays: 1, dueAt: '2026-01-10' },
    };
    const r = selectDueCards({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates,
      size: 5,
      now: NOW,
    });
    expect(r.length).toBeGreaterThanOrEqual(2);
    // first item is the most-overdue (apfel)
    expect(r[0].entry.de).toBe('Apfel');
    for (const it of r) expect(it.source).toBe('due');
  });

  it('caps at one card per word (same-word dedup) when many cards for the same entry are due', () => {
    const vocabSets = [set('A1/01', apfel)]; // apfel produces 3 cards
    const cardStates: Record<string, CardStateLike> = {
      // mark all 3 apfel cards due so they ALL rank as "due" — without same-word
      // dedup, selectDueCards would return all 3.
      [cardKeyFor(apfel, 'meaning-de-en')]: { dueAt: '2026-01-08' },
      [cardKeyFor(apfel, 'meaning-en-de')]: { dueAt: '2026-01-09' },
      [cardKeyFor(apfel, 'article')]: { dueAt: '2026-01-07' },
    };
    const r = selectDueCards({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates,
      size: 10,
      now: NOW,
    });
    // apfel appears exactly once even though 3 cards are due
    const apfelHits = r.filter(it => it.entry.de === 'Apfel');
    expect(apfelHits).toHaveLength(1);
    // The chosen face is the one with the most-overdue dueAt (smallest date string)
    // — article dueAt=2026-01-07 < meaning-de-en=2026-01-08 < meaning-en-de=2026-01-09.
    expect(apfelHits[0].face).toBe('article');
  });

  it('a never-rated word surfaces as exactly one due item (most-overdue null = null itself)', () => {
    const vocabSets = [set('A1/01', essen)];
    const r = selectDueCards({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {}, // empty — both meaning directions are due (null schedule)
      size: 5,
      now: NOW,
    });
    // essen has 2 meaning cards; same-word dedup keeps ONE
    expect(r).toHaveLength(1);
    expect(r[0].entry.de).toBe('essen');
  });
});

describe('selectInterleavedDrills — oldest-lesson edge', () => {
  const taggedExercise = (id: string, lesson: string, skill: string): ExerciseSetEntry => ({
    id: lesson.toLowerCase() + '/exercises',
    data: {
      lesson,
      title: '',
      partial: false,
      exam: null,
      exercises: [{ id, block: 'A', title: 'x', skill, type: 'single-choice', items: [{ q: 'q', options: [{ key: 'a', text: 'A' }, { key: 'b', text: 'B' }], answer: 'a' }] }] as unknown as ExerciseUnion[],
    },
  });

  it('returns [] for A1/01 (nothing older)', () => {
    const exerciseEntries: ExerciseSetEntry[] = [
      taggedExercise('H1', 'A1/02', 'article-gender'),
      taggedExercise('H1', 'A1/03', 'article-gender'),
    ];
    const r = selectInterleavedDrills({ currentLessonId: 'A1/01', exerciseEntries, size: 5, rng: () => 0.5 });
    expect(r).toEqual([]);
  });

  it('returns [] when currentLessonId is null', () => {
    const exerciseEntries: ExerciseSetEntry[] = [
      taggedExercise('H1', 'A1/02', 'article-gender'),
    ];
    const r = selectInterleavedDrills({ currentLessonId: null, exerciseEntries, size: 5, rng: () => 0.5 });
    expect(r).toEqual([]);
  });

  it('returns only drills from older lessons than current', () => {
    const exerciseEntries: ExerciseSetEntry[] = [
      taggedExercise('H1', 'A1/02', 'article-gender'),
      taggedExercise('H1', 'A1/03', 'plural'),
      taggedExercise('H1', 'A1/04', 'conjugation'),
      taggedExercise('H1', 'A1/05', 'word-order'),
    ];
    const r = selectInterleavedDrills({ currentLessonId: 'A1/04', exerciseEntries, size: 10, rng: () => 0.5 });
    const lessonIds = r.map(it => it.item.lessonId);
    expect(lessonIds).not.toContain('A1/04'); // current excluded
    expect(lessonIds).not.toContain('A1/05'); // newer excluded
    // every result must be older (A1/02, A1/03)
    for (const id of lessonIds) expect(['A1/02','A1/03']).toContain(id);
  });

  it('returns at most `size` items, each tagged source: interleaved', () => {
    const exerciseEntries: ExerciseSetEntry[] = Array.from({ length: 20 }, (_, i) =>
      taggedExercise('H1', `A1/${String(i + 1).padStart(2, '0')}`, 'article-gender'));
    const r = selectInterleavedDrills({ currentLessonId: 'A1/15', exerciseEntries, size: 7, rng: () => 0.5 });
    expect(r).toHaveLength(7);
    for (const it of r) expect(it.source).toBe('interleaved');
  });
});

describe('selectFehlerbuchItems', () => {
  function fehl(overrides: Partial<FehlerbuchEntry> = {}): FehlerbuchEntry {
    return {
      key: 'A1/03:H1:0',
      lessonId: 'A1/03',
      exerciseId: 'H1',
      block: 'H',
      exerciseType: 'gap-text',
      ref: '0',
      given: 'a',
      expected: 'b',
      timesWrong: 1,
      firstWrongAt: NOW.toISOString(),
      lastWrongAt: NOW.toISOString(),
      ...overrides,
    };
  }

  it('slices the curated input to at most `size` items', () => {
    const r = selectFehlerbuchItems([fehl({ key: 'k1' }), fehl({ key: 'k2' }), fehl({ key: 'k3' })], 2);
    expect(r).toHaveLength(2);
    expect(r.every(it => it.kind === 'fehlerbuch')).toBe(true);
  });

  it('returns [] when entries are empty', () => {
    expect(selectFehlerbuchItems([], 5)).toEqual([]);
  });
});

describe('buildDailyMix — fehlerbuch min-1 bump', () => {
  const vocabSets = [set('A1/01', apfel)];
  const fehl: FehlerbuchEntry = {
    key: 'A1/03:H1:0',
    lessonId: 'A1/03',
    exerciseId: 'H1',
    block: 'H',
    exerciseType: 'gap-text',
    ref: '0',
    given: 'a',
    expected: 'b',
    timesWrong: 1,
    firstWrongAt: NOW.toISOString(),
    lastWrongAt: NOW.toISOString(),
  };

  it('casual user with 1 fehlerbuch entry still sees at least 1 fehlerbuch item (min-1 bump)', () => {
    const r = buildDailyMix({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      exerciseEntries: [],
      fehlerbuchEntries: [fehl],
      goal: 'casual',
      rng: () => 0,
    });
    expect(r.stats.fehlerbuch).toBeGreaterThanOrEqual(1);
  });

  it('fehlerbuch stays at 0 when none exist (no min-1 bump without content)', () => {
    const r = buildDailyMix({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      exerciseEntries: [],
      fehlerbuchEntries: [],
      goal: 'casual',
      rng: () => 0,
    });
    expect(r.stats.fehlerbuch).toBe(0);
  });
});

describe('buildDailyMix — cross-pool dedup', () => {
  it('a never-rated entry appearing in both new and due pools shows up once, not twice', () => {
    // essen has no rating anywhere → it's "new" by selectNewPillsForLesson.
    // It also has a null schedule → selectDueCards may pick it (rankByDue puts null
    // schedules first). The buildDailyMix cross-pool dedup should drop it from due.
    const vocabSets = [set('A1/01', essen, apfel)];
    // apfel rated (so apfel is "due", not "new")
    const cardStates: Record<string, CardStateLike> = {
      [cardKeyFor(apfel, 'meaning-de-en')]: { dueAt: '2026-01-10' },
    };
    const r = buildDailyMix({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates,
      exerciseEntries: [],
      fehlerbuchEntries: [],
      goal: 'regular',
      now: NOW,
      rng: () => 0,
    });
    const seenApfel = r.items.filter(it => it.kind === 'vocab-card' && it.entry.de === 'Apfel').length;
    const seenEssen = r.items.filter(it => it.kind === 'vocab-card' && it.entry.de === 'essen').length;
    expect(seenApfel).toBeLessThanOrEqual(1);
    expect(seenEssen).toBeLessThanOrEqual(1);
    // Whatever shows up should not be both at the same time
    const entryKeys = r.items
      .filter(it => it.kind === 'vocab-card')
      .map(it => `${it.entry.de}|${it.face}`);
    expect(new Set(entryKeys).size).toBe(entryKeys.length);
  });

  it('when a never-rated word is eligible in both pools, new-pills wins (precedence pinned)', () => {
    // Pin the asymmetric dedup: never-rated (null schedule) entries are eligible
    // in BOTH the new and the due pool. The cross-pool dedup says new wins —
    // a future refactor that flips the precedence would silently change the user
    // experience (fresh users see no "Neu" badge on first run).
    const vocabSets = [set('A1/01', essen)]; // verb, never-rated, eligible for both
    const r = buildDailyMix({
      currentLessonId: 'A1/01',
      vocabSets,
      cardStates: {},
      exerciseEntries: [],
      fehlerbuchEntries: [],
      goal: 'regular',
      now: NOW,
      rng: () => 0,
    });
    const essenItems = r.items.filter(it => it.kind === 'vocab-card' && it.entry.de === 'essen');
    expect(essenItems).toHaveLength(1);
    if (essenItems[0]?.kind === 'vocab-card') {
      expect(essenItems[0].source).toBe('new');
    }
  });
});
