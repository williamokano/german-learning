// StudyPlanService — persists the learner's chosen exam target (issue #347, F14).
// Tiny in v1: just `targetNodeId` + `targetDate`. Carries a `revision: 1` so this can
// extend without a migration later, mirroring PillSettingsService's pattern exactly.
// Defensive against corrupt/malformed storage, same convention as PathService.readAll.

import type { StorageService } from '@core/services/storage';
import type { PathNode, PathNodeId } from '@core/content/path';
import { buildStudyPlan, type StudyPlan } from '@core/engine/study-plan';

const KEY = 'gl:v1:study-plan:target';

export interface StudyPlanTarget {
  revision: 1;
  targetNodeId: PathNodeId;
  targetDate: string; // "YYYY-MM-DD"
}

export class StudyPlanService {
  constructor(private storage: StorageService) {}

  getTarget(): StudyPlanTarget | null {
    const raw = this.storage.get<unknown>(KEY);
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Partial<StudyPlanTarget>;
    if (obj.revision !== 1) return null;
    if (typeof obj.targetNodeId !== 'string' || typeof obj.targetDate !== 'string') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(obj.targetDate)) return null;
    return { revision: 1, targetNodeId: obj.targetNodeId, targetDate: obj.targetDate };
  }

  setTarget(targetNodeId: PathNodeId, targetDate: string): void {
    this.storage.set<StudyPlanTarget>(KEY, { revision: 1, targetNodeId, targetDate });
  }

  clearTarget(): void {
    this.storage.remove(KEY);
  }

  /** Convenience: resolves the stored target (if any) into a full StudyPlan against
   *  the given manifest/completion state. Returns null if no target is set, or if the
   *  stored target no longer matches any node in the manifest (e.g. content changed). */
  computePlan(manifest: PathNode[], completedIds: ReadonlySet<PathNodeId>, now: Date = new Date()): StudyPlan | null {
    const target = this.getTarget();
    if (target == null) return null;
    const [y, m, d] = target.targetDate.split('-').map(Number);
    return buildStudyPlan(manifest, completedIds, target.targetNodeId, now, new Date(y, m - 1, d));
  }
}
