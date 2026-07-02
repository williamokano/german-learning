import { describe, it, expect } from 'vitest';
import {
  buildPathManifest,
  getNextNode,
  getProgressStats,
  isPruefungstrainingSlug,
  pathNodeIdFor,
  type PathNode,
  type PathNodeId,
  type PathManifestLessonInput,
  type PathManifestVocabSetInput,
} from '@core/content/path';

const LESSON = (overrides: { id: string; lesson: string; slug: string; title: string; level: string; number: number; }): PathManifestLessonInput =>
  ({ id: overrides.id, data: { lesson: overrides.lesson, slug: overrides.slug, title: overrides.title, level: overrides.level, number: overrides.number } });

const SET = (lesson: string, n: number): PathManifestVocabSetInput =>
  ({ id: lesson.toLowerCase() + '/vocab', lesson, entries: Array.from({ length: n }) });

describe('isPruefungstrainingSlug', () => {
  it('matches the 4 pruefungstraining-<level> patterns', () => {
    expect(isPruefungstrainingSlug('pruefungstraining-a1')).toBe(true);
    expect(isPruefungstrainingSlug('pruefungstraining-a2')).toBe(true);
    expect(isPruefungstrainingSlug('pruefungstraining-b2')).toBe(true);
    expect(isPruefungstrainingSlug('pruefungstraining-c1')).toBe(true);
  });

  it('matches the B1 wiederholung-und-pruefungstraining hybrid', () => {
    expect(isPruefungstrainingSlug('wiederholung-und-pruefungstraining-b1')).toBe(true);
  });

  it('does NOT match regular lesson slugs', () => {
    expect(isPruefungstrainingSlug('essen-und-trinken')).toBe(false);
    expect(isPruefungstrainingSlug('wohnen')).toBe(false);
    expect(isPruefungstrainingSlug('schreiben-und-sprechen-b1')).toBe(false);
    expect(isPruefungstrainingSlug('textproduktion-c1')).toBe(false);
  });

  it('does NOT match malformed inputs', () => {
    expect(isPruefungstrainingSlug('')).toBe(false);
    expect(isPruefungstrainingSlug('pruefungstraining')).toBe(false);
    expect(isPruefungstrainingSlug('pruefungstraining-x9')).toBe(false);
  });
});

describe('pathNodeIdFor', () => {
  it('produces stable ids of the form <kind>:<lesson>', () => {
    expect(pathNodeIdFor('A1/03', 'lesson-pill')).toBe('lesson-pill:A1/03');
    expect(pathNodeIdFor('C1/12', 'checkpoint-quiz')).toBe('checkpoint-quiz:C1/12');
  });
});

describe('buildPathManifest', () => {
  it('emits one lesson-pill per lesson with vocab, sorted ascending by lessonRank', () => {
    const lessons = [
      LESSON({ id: 'a1/02-familie', lesson: 'A1/02', slug: '02-familie', title: 'Familie', level: 'A1', number: 2 }),
      LESSON({ id: 'a1/01-erste',   lesson: 'A1/01', slug: '01-erste',   title: 'Erste',   level: 'A1', number: 1 }),
      LESSON({ id: 'a1/03-essen',   lesson: 'A1/03', slug: '03-essen',   title: 'Essen',   level: 'A1', number: 3 }),
    ];
    const sets = [SET('A1/01', 3), SET('A1/02', 5), SET('A1/03', 7)];
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest.map(n => n.kind)).toEqual(['lesson-pill','lesson-pill','lesson-pill']);
    expect(manifest.map(n => n.lessonId)).toEqual(['A1/01','A1/02','A1/03']);
    expect((manifest[2] as any).vocabEntryCount).toBe(7);
  });

  it('emits checkpoint-quiz for pruefungstraining lessons regardless of vocab presence', () => {
    const lessons = [
      LESSON({ id: 'a1/13-xxx', lesson: 'A1/13', slug: '13-xxx', title: 'L13', level: 'A1', number: 13 }),
      LESSON({ id: 'a1/14-pruefungstraining-a1', lesson: 'A1/14', slug: 'pruefungstraining-a1', title: 'Prüfung A1', level: 'A1', number: 14 }),
    ];
    const sets = [SET('A1/13', 8)]; // A1/14 has no vocab
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest).toHaveLength(2);
    expect(manifest[0].kind).toBe('lesson-pill');
    expect(manifest[1].kind).toBe('checkpoint-quiz');
  });

  it('treats pruefungstraining lessons WITH vocab as checkpoints (B2/14, C1/12 case)', () => {
    const lessons = [
      LESSON({ id: 'a1/13-xxx', lesson: 'A1/13', slug: '13-xxx', title: 'L13', level: 'A1', number: 13 }),
      LESSON({ id: 'b2/14-pruefungstraining-b2', lesson: 'B2/14', slug: 'pruefungstraining-b2', title: 'Prüfung B2', level: 'B2', number: 14 }),
    ];
    const sets = [SET('A1/13', 8), SET('B2/14', 50)];
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    // Only 1 lesson-pill (A1/13) and 1 checkpoint (B2/14). B2/14's vocab is NOT a pill
    // — it stays available via unlockedVocab(sets, A1/13) for vocabulary learning.
    expect(manifest).toHaveLength(2);
    expect(manifest.map(n => n.kind)).toEqual(['lesson-pill', 'checkpoint-quiz']);
  });

  it('skips lessons with no vocab and no checkpoint role', () => {
    const lessons = [
      LESSON({ id: 'a1/01-erste', lesson: 'A1/01', slug: '01-erste', title: 'E', level: 'A1', number: 1 }),
      LESSON({ id: 'a1/02-empty', lesson: 'A1/02', slug: '02-empty', title: 'Empty', level: 'A1', number: 2 }),
    ];
    const sets = [SET('A1/01', 5)]; // A1/02 has no vocab, not a checkpoint — skipped
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest).toHaveLength(1);
    expect(manifest[0].lessonId).toBe('A1/01');
  });

  it('sorts cross-level: A1 < A2 < B1 < B2 < C1', () => {
    const lessons = [
      LESSON({ id: 'c1/12-p', lesson: 'C1/12', slug: 'pruefungstraining-c1', title: 'C', level: 'C1', number: 12 }),
      LESSON({ id: 'a1/01-e', lesson: 'A1/01', slug: '01-e', title: 'A', level: 'A1', number: 1 }),
      LESSON({ id: 'b1/01-b', lesson: 'B1/01', slug: '01-b', title: 'B', level: 'B1', number: 1 }),
    ];
    const sets = [SET('A1/01', 5), SET('B1/01', 5)];
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest.map(n => n.lessonId)).toEqual(['A1/01','B1/01','C1/12']);
  });

  it('silently skips unknown-level lessons (e.g. C2 stubs)', () => {
    const lessons = [
      LESSON({ id: 'a1/01-e', lesson: 'A1/01', slug: '01-e', title: 'A', level: 'A1', number: 1 }),
      LESSON({ id: 'c2/01-x', lesson: 'C2/01', slug: '01-x', title: 'X', level: 'C2', number: 1 }),
    ];
    const sets = [SET('A1/01', 5)];
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest).toHaveLength(1);
  });

  it('skips lessons missing structural fields rather than emitting broken nodes', () => {
    const lessons: PathManifestLessonInput[] = [
      { id: 'a1/01-e', data: { lesson: 'A1/01', slug: '01-e', title: 'A', level: 'A1', number: 1 } },
      { id: 'a1/02-x', data: { /* no slug */ } },
      { id: 'a1/03-y', data: { lesson: 'A1/03', slug: '03-y', /* no title */ level: 'A1', number: 3 } },
    ];
    const sets = [SET('A1/01', 5), SET('A1/03', 5)];
    const manifest = buildPathManifest({ lessons, vocabSets: sets });
    expect(manifest).toHaveLength(1);
    expect(manifest[0].lessonId).toBe('A1/01');
  });
});

describe('getNextNode', () => {
  const fixture = (): PathNode[] => buildPathManifest({
    lessons: [
      LESSON({ id: 'a1/01', lesson: 'A1/01', slug: '01-a', title: 'A', level: 'A1', number: 1 }),
      LESSON({ id: 'a1/02', lesson: 'A1/02', slug: '02-b', title: 'B', level: 'A1', number: 2 }),
      LESSON({ id: 'a1/03', lesson: 'A1/03', slug: '03-c', title: 'C', level: 'A1', number: 3 }),
    ],
    vocabSets: [SET('A1/01', 1), SET('A1/02', 1), SET('A1/03', 1)],
  });

  it('returns the first node when none are complete', () => {
    const manifest = fixture();
    expect(getNextNode(manifest, new Set())?.lessonId).toBe('A1/01');
  });

  it('returns the first uncompleted node when some are complete', () => {
    const manifest = fixture();
    const done = new Set<PathNodeId>([pathNodeIdFor('A1/01','lesson-pill')]);
    expect(getNextNode(manifest, done)?.lessonId).toBe('A1/02');
  });

  it('returns null when every node is complete', () => {
    const manifest = fixture();
    const done = new Set(manifest.map(n => n.id));
    expect(getNextNode(manifest, done)).toBeNull();
  });
});

describe('getProgressStats', () => {
  it('returns done: 0, total: 3, current: A1/01 when none complete', () => {
    const manifest = buildPathManifest({
      lessons: [
        LESSON({ id: 'a1/01', lesson: 'A1/01', slug: '01-a', title: 'A', level: 'A1', number: 1 }),
        LESSON({ id: 'a1/02', lesson: 'A1/02', slug: '02-b', title: 'B', level: 'A1', number: 2 }),
        LESSON({ id: 'a1/03', lesson: 'A1/03', slug: '03-c', title: 'C', level: 'A1', number: 3 }),
      ],
      vocabSets: [SET('A1/01', 1), SET('A1/02', 1), SET('A1/03', 1)],
    });
    const stats = getProgressStats(manifest, new Set());
    expect(stats.done).toBe(0);
    expect(stats.total).toBe(3);
    expect(stats.current?.lessonId).toBe('A1/01');
  });

  it('returns done: total, current: null when all complete', () => {
    const manifest = buildPathManifest({
      lessons: [
        LESSON({ id: 'a1/01', lesson: 'A1/01', slug: '01-a', title: 'A', level: 'A1', number: 1 }),
        LESSON({ id: 'a1/02', lesson: 'A1/02', slug: '02-b', title: 'B', level: 'A1', number: 2 }),
      ],
      vocabSets: [SET('A1/01', 1), SET('A1/02', 1)],
    });
    const done = new Set(manifest.map(n => n.id));
    const stats = getProgressStats(manifest, done);
    expect(stats.done).toBe(2);
    expect(stats.total).toBe(2);
    expect(stats.current).toBeNull();
  });
});

describe('buildPathManifest real-content pin (issue #344 v1 contract)', () => {
  it('returns exactly 63 lesson-pills + 5 checkpoint-quizzes = 68 nodes for the full A1–C1 corpus', () => {
    // Hand-rolled fixture matching the real content layout: each lesson in
    // canonical lessonId order with its actual slug (so the pruefungstraining
    // predicate yields the same 5 nodes as production).
    const levelDef: Array<{ level: 'A1'|'A2'|'B1'|'B2'|'C1'; count: number; suffixes: string[] }> = [
      { level: 'A1', count: 14, suffixes: [
        'erste-kontakte','familie-und-freunde','essen-und-trinken','wohnen','mein-tag',
        'arbeitswelt','freizeit','reisen','einkaufen','gesundheit',
        'vergangenheit','zukunft','schule-und-ausbildung','pruefungstraining-a1',
      ]},
      { level: 'A2', count: 14, suffixes: [
        'begegnungen','wohnen-und-leben','alltag-und-freizeit','gesundheit-und-koerper',
        'bildung-und-beruf','reisen-und-mobilitaet','medien-und-kommunikation',
        'kultur-und-gesellschaft','arbeit-und-wirtschaft','umwelt-und-nachhaltigkeit',
        'beziehungen-und-familie','zukunft-und-technologie','feste-und-braeuche',
        'pruefungstraining-a2',
      ]},
      { level: 'B1', count: 14, suffixes: [
        'kennenlernen','arbeitsalltag','stadt-und-land','unterwegs','medien',
        'zwischenmenschliches','beruf-und-karriere','bildung-und-forschung',
        'gesellschaft','kultur-und-unterhaltung','gesundheit-und-ernaehrung',
        'reisen-und-erfahrungen','schreiben-und-sprechen-b1',
        'wiederholung-und-pruefungstraining-b1',
      ]},
      { level: 'B2', count: 14, suffixes: [
        'identitaet-und-gesellschaft','lernen-und-bildung','zusammenleben',
        'arbeitswelt-und-beruf','medien-und-digitalisierung','kultur-und-freizeit',
        'reisen-und-kultur','wirtschaft-und-politik','wissenschaft-und-technik',
        'kommunikation-und-sprache','umwelt-und-nachhaltigkeit','mensch-und-gesellschaft',
        'grafiken-und-berichte','pruefungstraining-b2',
      ]},
      { level: 'C1', count: 12, suffixes: [
        'wissenschaft-und-gesellschaft','medien-und-journalismus','politik-und-debatte',
        'wirtschaft-und-globalisierung','kultur-und-identitaet','technologie-und-zukunft',
        'recht-und-moral','textproduktion-c1','bildung-und-persoenlichkeitsentwicklung',
        'geschichte-und-erinnerungskultur','gesellschaft-politik-zukunft','pruefungstraining-c1',
      ]},
    ];
    const lessons: PathManifestLessonInput[] = [];
    const vocabSets: PathManifestVocabSetInput[] = [];
    for (const lvl of levelDef) {
      for (let i = 0; i < lvl.count; i++) {
        const n = i + 1;
        const id = `${lvl.level.toLowerCase()}/${String(n).padStart(2,'0')}-${lvl.suffixes[i]}`;
        const lesson = `${lvl.level}/${String(n).padStart(2,'0')}`;
        const slug = `${String(n).padStart(2,'0')}-${lvl.suffixes[i]}`;
        lessons.push({
          id,
          data: { lesson, slug, title: `${lvl.level}/${String(n).padStart(2,'0')}`, level: lvl.level, number: n },
        });
        // Real corpus has vocab.yml for all lessons EXCEPT A1/14, A2/14, B1/14 (3 lessons).
        const hasNoVocab =
          (lvl.level === 'A1' && n === 14) ||
          (lvl.level === 'A2' && n === 14) ||
          (lvl.level === 'B1' && n === 14);
        if (!hasNoVocab) vocabSets.push({ id: id + '/vocab', lesson, entries: Array.from({ length: 10 }) });
      }
    }
    const manifest = buildPathManifest({ lessons, vocabSets });
    const pills = manifest.filter(n => n.kind === 'lesson-pill');
    const checkpoints = manifest.filter(n => n.kind === 'checkpoint-quiz');

    expect(manifest).toHaveLength(68);
    expect(pills).toHaveLength(63);
    expect(checkpoints).toHaveLength(5);

    const ids = checkpoints.map(n => n.lessonId).sort();
    expect(ids).toEqual(['A1/14','A2/14','B1/14','B2/14','C1/12']);
  });
});
