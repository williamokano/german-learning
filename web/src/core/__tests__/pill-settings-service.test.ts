import { describe, it, expect } from 'vitest';
import type { StorageService } from '@core/services/storage';
import { PillSettingsService } from '@core/services/pill-settings-service';

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

describe('PillSettingsService', () => {
  it('defaults to { revision: 1, dailyGoal: "regular" } when storage is empty', () => {
    const path = new PillSettingsService(fakeStorage());
    expect(path.get()).toEqual({ revision: 1, dailyGoal: 'regular' });
  });

  it('round-trips a valid dailyGoal', () => {
    const storage = fakeStorage();
    const path = new PillSettingsService(storage);
    path.set('casual');
    expect(new PillSettingsService(storage).get()).toEqual({ revision: 1, dailyGoal: 'casual' });
    path.set('serious');
    expect(new PillSettingsService(storage).get().dailyGoal).toBe('serious');
    path.set('regular');
    expect(new PillSettingsService(storage).get().dailyGoal).toBe('regular');
  });

  it('storage value is the literal record object (not a JSON string)', () => {
    const storage = fakeStorage();
    new PillSettingsService(storage).set('casual');
    const raw = storage.get<unknown>('gl:v1:pill:settings');
    expect(typeof raw).toBe('object');
    expect(raw).toEqual({ revision: 1, dailyGoal: 'casual' });
  });

  it('recovers gracefully from a missing or corrupt value', () => {
    for (const bad of [null, undefined, 'not-json', 42, true, [], 'casual']) {
      const storage = fakeStorage();
      storage.set('gl:v1:pill:settings', bad);
      expect(new PillSettingsService(storage).get().dailyGoal).toBe('regular');
    }
  });

  it('recovers gracefully from a wrong revision number', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:pill:settings', { revision: 2, dailyGoal: 'casual' });
    expect(new PillSettingsService(storage).get()).toEqual({ revision: 1, dailyGoal: 'regular' });
  });

  it('recovers gracefully from an unknown dailyGoal value', () => {
    const storage = fakeStorage();
    storage.set('gl:v1:pill:settings', { revision: 1, dailyGoal: 'extreme' as any });
    expect(new PillSettingsService(storage).get().dailyGoal).toBe('regular');
  });

  it('ignores set() with an invalid goal rather than corrupting storage', () => {
    const storage = fakeStorage();
    new PillSettingsService(storage).set('casual');
    new PillSettingsService(storage).set('extreme' as any);
    expect(new PillSettingsService(storage).get().dailyGoal).toBe('casual');
  });
});
