import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { StudyPlanService } from '@core/services/study-plan-service';
import type { PathNode, LessonPillNode } from '@core/content/path';

function fakeStorage(): StorageService {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string): T | null {
      return (store.has(key) ? store.get(key) : null) as T | null;
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

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

const MANIFEST: PathNode[] = [1, 2, 3].map(n => NODE(n, n === 3 ? 'checkpoint-quiz' : 'lesson-pill'));
const TARGET = MANIFEST[2].id;

describe('StudyPlanService', () => {
  it('getTarget() returns null when nothing is stored', () => {
    expect(new StudyPlanService(fakeStorage()).getTarget()).toBeNull();
  });

  it('round-trips a valid target', () => {
    const storage = fakeStorage();
    new StudyPlanService(storage).setTarget(TARGET, '2026-10-15');
    expect(new StudyPlanService(storage).getTarget()).toEqual({ revision: 1, targetNodeId: TARGET, targetDate: '2026-10-15' });
  });

  it('clearTarget() removes the stored target', () => {
    const storage = fakeStorage();
    const svc = new StudyPlanService(storage);
    svc.setTarget(TARGET, '2026-10-15');
    svc.clearTarget();
    expect(svc.getTarget()).toBeNull();
  });

  it('getTarget() ignores malformed stored shapes rather than throwing', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:study-plan:target', { revision: 2, targetNodeId: TARGET, targetDate: '2026-10-15' });
    expect(new StudyPlanService(storage).getTarget()).toBeNull();

    storage.set('gl:v1:study-plan:target', { revision: 1, targetNodeId: TARGET, targetDate: 'not-a-date' });
    expect(new StudyPlanService(storage).getTarget()).toBeNull();

    storage.set('gl:v1:study-plan:target', 'garbage');
    expect(new StudyPlanService(storage).getTarget()).toBeNull();

    storage.set('gl:v1:study-plan:target', ['array', 'not', 'object']);
    expect(new StudyPlanService(storage).getTarget()).toBeNull();
  });

  it('computePlan() returns null when no target is set', () => {
    const svc = new StudyPlanService(fakeStorage());
    expect(svc.computePlan(MANIFEST, new Set(), new Date(2026, 0, 1))).toBeNull();
  });

  it('computePlan() returns null when the stored target no longer matches the manifest', () => {
    const storage = fakeStorage();
    const svc = new StudyPlanService(storage);
    svc.setTarget('checkpoint-quiz:X9/99', '2026-10-15');
    expect(svc.computePlan(MANIFEST, new Set(), new Date(2026, 0, 1))).toBeNull();
  });

  it('computePlan() resolves a stored target into a real StudyPlan', () => {
    const storage = fakeStorage();
    const svc = new StudyPlanService(storage);
    svc.setTarget(TARGET, '2026-01-10');
    const plan = svc.computePlan(MANIFEST, new Set(), new Date(2026, 0, 1));
    expect(plan).not.toBeNull();
    expect(plan!.targetNodeId).toBe(TARGET);
    expect(plan!.totalNodesRemaining).toBe(3);
    expect(plan!.daysRemaining).toBe(10);
  });
});
