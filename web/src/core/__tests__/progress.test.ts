import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { ProgressService } from '@core/services/progress';
import type { LessonScore } from '@core/engine/scoring';

function fakeStorage(): StorageService {
  const store = new Map<string, unknown>();
  return {
    get: <T>(key: string) => (store.has(key) ? store.get(key) : null) as T | null,
    set: <T>(key: string, value: T) => { store.set(key, value); },
    remove: (key: string) => { store.delete(key); },
  };
}

const score = (pct: number, passed: boolean) => ({ pct, passed }) as unknown as LessonScore;

describe('ProgressService.recordResult', () => {
  it('keeps the best score and never un-passes a lesson', () => {
    const p = new ProgressService(fakeStorage());
    p.recordResult('A1/01', score(0.9, true));
    p.recordResult('A1/01', score(0.4, false));
    expect(p.getProgress()['A1/01']).toMatchObject({ pct: 0.9, passed: true });
  });
});

describe('ProgressService.passedLessonIds', () => {
  it('lists only passed lessons', () => {
    const p = new ProgressService(fakeStorage());
    p.recordResult('A1/01', score(0.85, true));
    p.recordResult('A1/02', score(0.5, false));
    expect(p.passedLessonIds()).toEqual(['A1/01']);
  });

  it('tolerates malformed stored entries', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:progress', { 'A1/01': null, 'A1/02': { pct: 1, passed: true } });
    expect(new ProgressService(storage).passedLessonIds()).toEqual(['A1/02']);
  });
});
