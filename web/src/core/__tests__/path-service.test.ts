import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { PathService } from '@core/services/path-service';
import { buildPathManifest, type PathNode, type PathNodeId, type PathManifestLessonInput, type PathManifestVocabSetInput } from '@core/content/path';

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

function lesson(overrides: { id: string; lesson: string; slug: string; title: string; level: string; number: number; }): PathManifestLessonInput {
  return { id: overrides.id, data: { lesson: overrides.lesson, slug: overrides.slug, title: overrides.title, level: overrides.level, number: overrides.number } };
}

function set(lesson: string): PathManifestVocabSetInput {
  return { id: lesson.toLowerCase() + '/vocab', lesson, entries: [] };
}

function fixtureManifest(): PathNode[] {
  return buildPathManifest({
    lessons: [
      lesson({ id: 'a1/01-a', lesson: 'A1/01', slug: '01-a', title: 'A', level: 'A1', number: 1 }),
      lesson({ id: 'a1/02-b', lesson: 'A1/02', slug: '02-b', title: 'B', level: 'A1', number: 2 }),
      lesson({ id: 'a1/03-c', lesson: 'A1/03', slug: '03-c', title: 'C', level: 'A1', number: 3 }),
    ],
    vocabSets: [set('A1/01'), set('A1/02'), set('A1/03')],
  });
}

describe('PathService — completion log', () => {
  it('starts empty and reports the first manifest node as current', () => {
    const storage = fakeStorage();
    const path = new PathService(storage);
    const manifest = fixtureManifest();

    const completed = path.getCompletedIds();
    expect(completed.size).toBe(0);

    const current = path.getCurrentNode(manifest);
    expect(current?.lessonId).toBe('A1/01');
  });

  it('markComplete advances getCurrentNode to the next uncompleted node', () => {
    const storage = fakeStorage();
    const path = new PathService(storage);
    const manifest = fixtureManifest();

    path.markComplete('lesson-pill:A1/01');
    expect(path.isComplete('lesson-pill:A1/01')).toBe(true);
    expect(path.getCurrentNode(manifest)?.lessonId).toBe('A1/02');
  });

  it('markComplete on the current node makes the next one current', () => {
    const storage = fakeStorage();
    const path = new PathService(storage);
    const manifest = fixtureManifest();

    path.markComplete('lesson-pill:A1/01');
    path.markComplete('lesson-pill:A1/02');
    expect(path.getCurrentNode(manifest)?.lessonId).toBe('A1/03');
  });

  it('markComplete on every node sets getCurrentNode to null', () => {
    const storage = fakeStorage();
    const path = new PathService(storage);
    const manifest = fixtureManifest();

    for (const n of manifest) path.markComplete(n.id);
    expect(path.getCurrentNode(manifest)).toBeNull();
    expect(path.getCompletedIds().size).toBe(3);
  });

  it('unmarkComplete pulls a node out of the completed set', () => {
    const storage = fakeStorage();
    const path = new PathService(storage);
    const manifest = fixtureManifest();

    path.markComplete('lesson-pill:A1/01');
    path.markComplete('lesson-pill:A1/02');
    path.unmarkComplete('lesson-pill:A1/01');

    const completed = path.getCompletedIds();
    expect(completed.has('lesson-pill:A1/01')).toBe(false);
    expect(completed.has('lesson-pill:A1/02')).toBe(true);
    expect(path.getCurrentNode(manifest)?.lessonId).toBe('A1/01');
  });

  it('round-trips across separate service instances (storage persistence)', () => {
    const storage = fakeStorage();
    new PathService(storage).markComplete('lesson-pill:A1/01');

    const path2 = new PathService(storage);
    const completed = path2.getCompletedIds();
    expect(completed.has('lesson-pill:A1/01')).toBe(true);
  });
});

describe('PathService — defensive against corrupt storage', () => {
  it('treats corrupt JSON as an empty completion set, does not throw', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:path:completed', 'not json at all');
    const path = new PathService(storage);
    expect(() => path.getCompletedIds()).not.toThrow();
    expect(path.getCompletedIds().size).toBe(0);
  });

  it('treats a non-object value as an empty completion set', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:path:completed', 42);
    const path = new PathService(storage);
    expect(path.getCompletedIds().size).toBe(0);
    // markComplete after the bad data overwrites cleanly
    path.markComplete('lesson-pill:A1/01');
    expect(path.isComplete('lesson-pill:A1/01')).toBe(true);
  });

  it('treats a JSON array as an empty completion set', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:path:completed', ['lesson-pill:A1/01']);
    const path = new PathService(storage);
    expect(path.getCompletedIds().size).toBe(0);
  });

  it('getCompletedIds returns a Set of the persisted object keys', () => {
    const storage = fakeStorage();
    storage.set<Record<PathNodeId, true>>('gl:v1:path:completed', {
      'lesson-pill:A1/01': true,
      'checkpoint:C1/12': true,
    });
    const path = new PathService(storage);
    const ids = path.getCompletedIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.has('lesson-pill:A1/01')).toBe(true);
    expect(ids.has('checkpoint:C1/12')).toBe(true);
    expect(ids.size).toBe(2);
  });
});
