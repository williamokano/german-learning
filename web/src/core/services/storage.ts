// StorageService — the single swap seam for a future backend
// See docs/web/SCORING.md §7 and docs/web/ARCHITECTURE.md §6

export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// Keys are namespaced with a schema version so format changes can migrate/clear cleanly.
// Pattern: gl:v1:<purpose>:<lesson>:<exerciseId>
// e.g.  gl:v1:answers:A1/01:C3   gl:v1:result:A1/01

export class LocalStorageStorage implements StorageService {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  }
}

// LATER: class ApiStorage implements StorageService { /* fetch /api/* */ }
