import { describe, it, expect } from 'vitest';
import { buildStudyPlan } from '@core/engine/study-plan';
import type { PathNode, LessonPillNode } from '@core/content/path';

const NODE = (n: number, kind: 'lesson-pill' | 'checkpoint-quiz' = 'lesson-pill'): PathNode => ({
  id: `${kind}:A1/${String(n).padStart(2, '0')}`,
  kind,
  lessonId: `A1/${String(n).padStart(2, '0')}`,
  slug: `${String(n).padStart(2, '0')}-lesson`,
  title: `Lesson ${n}`,
  level: 'A1',
  number: n,
  ...(kind === 'lesson-pill' ? { vocabEntryCount: 10 } : {}),
} as LessonPillNode);

const MANIFEST: PathNode[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => NODE(n, n === 10 ? 'checkpoint-quiz' : 'lesson-pill'));
const TARGET = MANIFEST[9].id; // the checkpoint-quiz node

describe('buildStudyPlan', () => {
  it('returns null for an unknown target node id', () => {
    expect(buildStudyPlan(MANIFEST, new Set(), 'checkpoint-quiz:X9/99', new Date(2026, 0, 1), new Date(2026, 0, 10))).toBeNull();
  });

  it('distributes 1 node/day when nodesRemaining === daysRemaining', () => {
    // today Jan 1, target Jan 10 -> 10 days inclusive, 10 nodes remaining (nothing completed)
    const plan = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 10));
    expect(plan).not.toBeNull();
    expect(plan!.totalNodesRemaining).toBe(10);
    expect(plan!.daysRemaining).toBe(10);
    expect(plan!.days).toHaveLength(10);
    for (const day of plan!.days) expect(day.nodes).toHaveLength(1);
    expect(plan!.days[0].date).toBe('2026-01-01');
    expect(plan!.days[9].date).toBe('2026-01-10');
  });

  it('crams multiple nodes/day when nodesRemaining > daysRemaining, no empty days', () => {
    // 10 nodes remaining, only 3 days -> ceil(10/3) = 4 on the busiest day, 0 empty days
    const plan = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 3));
    expect(plan!.daysRemaining).toBe(3);
    expect(plan!.totalNodesRemaining).toBe(10);
    const counts = plan!.days.map(d => d.nodes.length);
    expect(counts.every(c => c > 0)).toBe(true);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(10);
    expect(Math.max(...counts)).toBeLessThanOrEqual(4);
  });

  it('spreads sparse nodes across the full range when daysRemaining > nodesRemaining, not front-loaded', () => {
    // 3 nodes remaining (mark 7 of the first 9 lesson-pills complete, target still the checkpoint),
    // 10 days available -> nodes should NOT all land on day 1.
    const completed = new Set(MANIFEST.slice(0, 7).map(n => n.id));
    const plan = buildStudyPlan(MANIFEST, completed, TARGET, new Date(2026, 0, 1), new Date(2026, 0, 10));
    expect(plan!.totalNodesRemaining).toBe(3); // nodes 8, 9, and the checkpoint
    expect(plan!.daysRemaining).toBe(10);
    const nonEmptyDayIndices = plan!.days.map((d, i) => (d.nodes.length > 0 ? i : -1)).filter(i => i >= 0);
    expect(nonEmptyDayIndices).toHaveLength(3);
    // Not crammed at the very start: the last populated day should be well past day 0.
    expect(Math.max(...nonEmptyDayIndices)).toBeGreaterThan(3);
  });

  it('every node up to and including the target appears exactly once across all days, in order', () => {
    const plan = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 4));
    const flat = plan!.days.flatMap(d => d.nodes);
    expect(flat.map(n => n.id)).toEqual(MANIFEST.map(n => n.id));
  });

  it('excludes already-completed nodes from the plan', () => {
    const completed = new Set([MANIFEST[0].id, MANIFEST[1].id]);
    const plan = buildStudyPlan(MANIFEST, completed, TARGET, new Date(2026, 0, 1), new Date(2026, 0, 8));
    expect(plan!.totalNodesRemaining).toBe(8);
    const flat = plan!.days.flatMap(d => d.nodes);
    expect(flat.find(n => n.id === MANIFEST[0].id)).toBeUndefined();
  });

  it('a fully-completed target yields an empty plan, not an error', () => {
    const completed = new Set(MANIFEST.map(n => n.id));
    const plan = buildStudyPlan(MANIFEST, completed, TARGET, new Date(2026, 0, 1), new Date(2026, 0, 8));
    expect(plan!.totalNodesRemaining).toBe(0);
    expect(plan!.days.every(d => d.nodes.length === 0)).toBe(true);
  });

  it('a target date on or before today clamps to a 1-day plan, no throw', () => {
    const past = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 10), new Date(2026, 0, 1));
    expect(past!.daysRemaining).toBe(1);
    expect(past!.days).toHaveLength(1);
    expect(past!.days[0].nodes).toHaveLength(10);

    const same = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 1));
    expect(same!.daysRemaining).toBe(1);
  });

  it('averageNodesPerDay is nodesRemaining/daysRemaining rounded to 1 decimal', () => {
    const plan = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 4));
    expect(plan!.totalNodesRemaining).toBe(10);
    expect(plan!.daysRemaining).toBe(4);
    expect(plan!.averageNodesPerDay).toBe(2.5);
  });

  it('is deterministic given fixed inputs (pure, no hidden randomness)', () => {
    const a = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 7));
    const b = buildStudyPlan(MANIFEST, new Set(), TARGET, new Date(2026, 0, 1), new Date(2026, 0, 7));
    expect(a).toEqual(b);
  });

  it('does not mutate the input manifest or completedIds', () => {
    const manifestCopy = [...MANIFEST];
    const completed = new Set([MANIFEST[0].id]);
    const completedCopy = new Set(completed);
    buildStudyPlan(MANIFEST, completed, TARGET, new Date(2026, 0, 1), new Date(2026, 0, 8));
    expect(MANIFEST).toEqual(manifestCopy);
    expect(completed).toEqual(completedCopy);
  });
});
