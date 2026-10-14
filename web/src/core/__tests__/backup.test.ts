import { describe, it, expect } from 'vitest';
import {
  createBackup, parseBackup, restoreBackup, backupFileName, BackupError,
  type KeyValueStore,
} from '@core/services/backup';

function fakeStore(initial: Record<string, string> = {}): KeyValueStore & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    dump: () => Object.fromEntries(map),
  };
}

const NOW = new Date(2026, 9, 15, 12, 0);

describe('createBackup', () => {
  it('captures only gl: keys, with their raw strings', () => {
    const store = fakeStore({
      'gl:v1:srs:cards': '{"Apfel":{"interval":3}}',
      'gl:v1:path:completed': '["A1/01"]',
      theme: 'dark',
      sidebarCollapsed: '1',
    });
    const backup = createBackup(store, NOW);
    expect(backup.app).toBe('german-learning');
    expect(backup.format).toBe(1);
    expect(backup.exportedAt).toBe(NOW.toISOString());
    expect(backup.data).toEqual({
      'gl:v1:srs:cards': '{"Apfel":{"interval":3}}',
      'gl:v1:path:completed': '["A1/01"]',
    });
  });
});

describe('parseBackup', () => {
  const valid = JSON.stringify({
    app: 'german-learning', format: 1, exportedAt: 'x', data: { 'gl:v1:a': '1' },
  });

  it('round-trips a created backup', () => {
    const store = fakeStore({ 'gl:v1:a': '{"b":2}' });
    const backup = createBackup(store, NOW);
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });

  it('accepts a valid file', () => {
    expect(parseBackup(valid).data).toEqual({ 'gl:v1:a': '1' });
  });

  it.each([
    ['not JSON', '{nope'],
    ['not an object', '42'],
    ['another app', JSON.stringify({ app: 'other', format: 1, data: {} })],
    ['unknown format', JSON.stringify({ app: 'german-learning', format: 2, data: {} })],
    ['missing data', JSON.stringify({ app: 'german-learning', format: 1 })],
    ['array data', JSON.stringify({ app: 'german-learning', format: 1, data: [] })],
    ['foreign key', JSON.stringify({ app: 'german-learning', format: 1, data: { theme: 'dark' } })],
    ['non-string value', JSON.stringify({ app: 'german-learning', format: 1, data: { 'gl:v1:a': 1 } })],
  ])('rejects %s', (_label, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError);
  });
});

describe('restoreBackup', () => {
  it('replaces learner data exactly and leaves UI preferences alone', () => {
    const store = fakeStore({
      'gl:v1:srs:cards': '{"old":1}',
      'gl:v1:fehlerbuch:entries': '{"stale":1}',
      theme: 'dark',
    });
    restoreBackup(store, parseBackup(JSON.stringify({
      app: 'german-learning', format: 1, exportedAt: '', data: { 'gl:v1:srs:cards': '{"new":1}' },
    })));
    expect(store.dump()).toEqual({ 'gl:v1:srs:cards': '{"new":1}', theme: 'dark' });
  });

  it('rolls back to the previous data when a write fails', () => {
    const store = fakeStore({ 'gl:v1:srs:cards': '{"old":1}' });
    const setItem = store.setItem;
    let writes = 0;
    store.setItem = (k, v) => {
      if (k === 'gl:v1:b' && writes++ === 0) throw new Error('QuotaExceededError');
      setItem(k, v);
    };
    const backup = parseBackup(JSON.stringify({
      app: 'german-learning', format: 1, exportedAt: '', data: { 'gl:v1:a': '1', 'gl:v1:b': '2' },
    }));
    expect(() => restoreBackup(store, backup)).toThrow(BackupError);
    expect(store.dump()).toEqual({ 'gl:v1:srs:cards': '{"old":1}' });
  });
});

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(NOW)).toBe('deutsch-fortschritt-2026-10-15.json');
  });
});
