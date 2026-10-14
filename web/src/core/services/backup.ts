// Progress backup — export every learner-data key to a JSON file and restore it.
//
// All learner state (lesson results, SRS cards, Fehlerbuch, path, study plan, pill
// settings) lives in localStorage under the `gl:` namespace (see storage.ts). That
// is the only copy: clearing site data or switching browser loses it. A backup is
// a snapshot of every `gl:` key with its raw stored string, so a restore is
// byte-identical and needs no knowledge of the individual service formats.
//
// UI preferences outside the namespace (theme, sidebar, lesson view) are skipped.

/** The subset of the Web Storage API a backup needs — `window.localStorage` fits. */
export interface KeyValueStore {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const BACKUP_APP = 'german-learning';
export const BACKUP_FORMAT = 1;
const NAMESPACE = 'gl:';

export interface Backup {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  data: Record<string, string>;
}

export class BackupError extends Error {}

function namespacedKeys(store: KeyValueStore): string[] {
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith(NAMESPACE)) keys.push(key);
  }
  return keys;
}

export function createBackup(store: KeyValueStore, now: Date = new Date()): Backup {
  const data: Record<string, string> = {};
  for (const key of namespacedKeys(store)) {
    const value = store.getItem(key);
    if (value !== null) data[key] = value;
  }
  return { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt: now.toISOString(), data };
}

/** Parses and validates a backup file's text. Throws BackupError with a learner-facing message. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('Die Datei ist kein gültiges JSON.');
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new BackupError('Die Datei ist keine Fortschrittssicherung.');
  }
  const { app, format, exportedAt, data } = raw as Record<string, unknown>;
  if (app !== BACKUP_APP) {
    throw new BackupError('Die Datei ist keine Fortschrittssicherung dieser Seite.');
  }
  if (format !== BACKUP_FORMAT) {
    throw new BackupError(`Unbekanntes Sicherungsformat (${String(format)}).`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new BackupError('Die Sicherung enthält keine Daten.');
  }
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(NAMESPACE) || typeof value !== 'string') {
      throw new BackupError(`Ungültiger Eintrag in der Sicherung: ${key}`);
    }
  }
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: typeof exportedAt === 'string' ? exportedAt : '',
    data: data as Record<string, string>,
  };
}

/**
 * Replaces all current learner data with the backup's. Existing `gl:` keys not in
 * the backup are removed, so the result matches the backed-up state exactly.
 * If a write fails midway (e.g. storage quota), the previous data is put back.
 */
export function restoreBackup(store: KeyValueStore, backup: Backup): void {
  const previous = createBackup(store).data;
  const replace = (data: Record<string, string>) => {
    for (const key of namespacedKeys(store)) store.removeItem(key);
    for (const [key, value] of Object.entries(data)) store.setItem(key, value);
  };
  try {
    replace(backup.data);
  } catch {
    replace(previous);
    throw new BackupError('Die Sicherung konnte nicht vollständig geschrieben werden. Dein bisheriger Fortschritt ist unverändert.');
  }
}

export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `deutsch-fortschritt-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
