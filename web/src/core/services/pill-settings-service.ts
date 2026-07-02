// PillSettingsService — pill-mode daily-goal preference (issue #344, F9). Tiny in
// v1: just `dailyGoal`. Carries a `revision: 1` so F10 (gamification) and later
// can extend without a schema migration. Default is `regular` — fits the project's
// "no choice paralysis, sensible starting point" UI principle.

import type { StorageService } from '@core/services/storage';
import type { DailyGoal } from '@core/engine/daily-mix';

const KEY = 'gl:v1:pill:settings';

export interface PillSettings {
  revision: 1;
  dailyGoal: DailyGoal;
}

const DEFAULT_SETTINGS: PillSettings = {
  revision: 1,
  dailyGoal: 'regular',
};

const VALID_GOALS: ReadonlySet<DailyGoal> = new Set<DailyGoal>(['casual', 'regular', 'serious']);

export class PillSettingsService {
  constructor(private storage: StorageService) {}

  get(): PillSettings {
    const raw = this.storage.get<unknown>(KEY);
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_SETTINGS };
    const obj = raw as Partial<PillSettings>;
    if (obj.revision !== 1) return { ...DEFAULT_SETTINGS };
    if (obj.dailyGoal == null || !VALID_GOALS.has(obj.dailyGoal)) return { ...DEFAULT_SETTINGS };
    return { revision: 1, dailyGoal: obj.dailyGoal };
  }

  set(goal: DailyGoal): void {
    if (!VALID_GOALS.has(goal)) return; // ignore unknown values rather than corrupt storage
    this.storage.set<PillSettings>(KEY, { revision: 1, dailyGoal: goal });
  }
}
