// PathService — completion state for the F9 learning path (issue #344).
//
// A node is complete when the learner passed that lesson's exercises or exam
// (derived from ProgressService results, so finishing a lesson advances the path —
// issue #466) or marked it done by hand. Manual marks live under
// `gl:v1:path:completed` as `nodeId → true | false`: `true` marks done (also used by
// the placement test), `false` is an explicit "reset" that overrides a passed result.
//
// The orchestrator (DailyMixRunner / PathMap) uses `getCurrentNode(manifest)` to
// anchor "where is the learner right now" — see `getNextNode` for the frontier rule.
//
// Defensive against corrupt JSON in LocalStorage (ignores malformed entries rather
// than throwing, same convention LocalStorageStorage uses).

import type { StorageService } from '@core/services/storage';
import type { PathNode, PathNodeId, PathNodeKind } from '@core/content/path';
import { getNextNode as deriveNextNode, pathNodeIdFor } from '@core/content/path';

const KEY = 'gl:v1:path:completed';

/** Node kinds a passed lesson result completes (a lesson id maps to exactly one). */
const RESULT_KINDS: PathNodeKind[] = ['lesson-pill', 'checkpoint-quiz'];

export class PathService {
  /**
   * @param passedLessonIds canonical lesson ids ("A1/03") whose exercises or exam
   *   were passed. Defaults to none, which keeps the service usable standalone.
   */
  constructor(
    private storage: StorageService,
    private passedLessonIds: () => Iterable<string> = () => [],
  ) {}

  private readMarks(): Record<PathNodeId, boolean> {
    const raw = this.storage.get<unknown>(KEY);
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    // Keep only boolean values: anything else (e.g. `{ 'foo': 'bar' }` from a buggy
    // write) would otherwise silently rewind or invent progress.
    const out: Record<PathNodeId, boolean> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  }

  private setMark(nodeId: PathNodeId, done: boolean): void {
    const all = this.readMarks();
    all[nodeId] = done;
    this.storage.set(KEY, all);
  }

  markComplete(nodeId: PathNodeId): void {
    this.setMark(nodeId, true);
  }

  /** Mark a node as not done, even if its lesson result says passed. */
  unmarkComplete(nodeId: PathNodeId): void {
    this.setMark(nodeId, false);
  }

  isComplete(nodeId: PathNodeId): boolean {
    return this.getCompletedIds().has(nodeId);
  }

  getCompletedIds(): Set<PathNodeId> {
    const marks = this.readMarks();
    const done = new Set<PathNodeId>();
    for (const lessonId of this.passedLessonIds()) {
      for (const kind of RESULT_KINDS) done.add(pathNodeIdFor(lessonId, kind));
    }
    for (const [id, mark] of Object.entries(marks)) {
      if (mark) done.add(id); else done.delete(id);
    }
    return done;
  }

  /** The learner's frontier node (see `getNextNode`), or `null` iff every node is done. */
  getCurrentNode(manifest: PathNode[]): PathNode | null {
    return deriveNextNode(manifest, this.getCompletedIds());
  }
}
