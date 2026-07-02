// PathService — completion log for the F9 learning path (issue #344).
// Persistent set of completed node ids, keyed by `gl:v1:path:completed`. The
// orchestrator (DailyMixRunner / PathMap) uses `getCurrentNode(manifest)` to anchor
// "where is the learner right now" — pill mode is linear, no choice paralysis, so
// the current node is the first uncompleted one in `lessonRank` order.
//
// Mirrors SrsService / FehlerbuchService pattern — single namespace, defensive
// against corrupt JSON in LocalStorage (returns empty set rather than throwing,
// same convention LocalStorageStorage uses).

import type { StorageService } from '@core/services/storage';
import type { PathNode, PathNodeId } from '@core/content/path';
import { getNextNode as deriveNextNode } from '@core/content/path';

const KEY = 'gl:v1:path:completed';

export class PathService {
  constructor(private storage: StorageService) {}

  private readAll(): Record<PathNodeId, true> {
    const raw = this.storage.get<unknown>(KEY);
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    // Filter to well-formed entries: each key must be a string and each value must
    // be exactly `true` (the shape `markComplete` writes). A valid object with
    // arbitrary values (e.g. `{ ... , 'foo': 'bar' }` from a buggy future write)
    // would otherwise silently rewind user progress.
    const out: Record<PathNodeId, true> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof k === 'string' && v === true) out[k] = true;
    }
    return out;
  }

  private writeAll(all: Record<PathNodeId, true>): void {
    this.storage.set(KEY, all);
  }

  markComplete(nodeId: PathNodeId): void {
    const all = this.readAll();
    all[nodeId] = true;
    this.writeAll(all);
  }

  unmarkComplete(nodeId: PathNodeId): void {
    const all = this.readAll();
    delete all[nodeId];
    this.writeAll(all);
  }

  isComplete(nodeId: PathNodeId): boolean {
    return this.readAll()[nodeId] === true;
  }

  getCompletedIds(): Set<PathNodeId> {
    return new Set(Object.keys(this.readAll()));
  }

  /** First uncompleted node in `lessonRank` order, or `null` iff every node is done. */
  getCurrentNode(manifest: PathNode[]): PathNode | null {
    return deriveNextNode(manifest, this.getCompletedIds());
  }
}
