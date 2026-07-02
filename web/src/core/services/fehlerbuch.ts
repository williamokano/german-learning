// FehlerbuchService — personal mistake log (issue #345, F12). Captures wrong
// exercise answers (not flashcard "again" ratings — F3's SrsService already tracks
// and resurfaces those) and schedules them for review by reusing SrsService directly
// with a manufactured cardKey. No new scheduling code.

import type { StorageService } from '@core/services/storage';
import { SrsService } from '@core/services/srs';
import type { ExerciseUnion, ItemResult } from '@core/content/types';
import type { Rating } from '@core/engine/sm2';
import { selectBurst } from '@core/engine/sm2';
import type { DueCandidate } from '@core/engine/sm2';
import {
  mistakeKey,
  recordMistake,
  resolveGivenText,
  fehlerbuchCardKey,
  FEHLERBUCH_CARD_PREFIX,
} from '@core/engine/fehlerbuch';
import type { FehlerbuchEntry } from '@core/engine/fehlerbuch';
import { detectConfusionPairs } from '@core/engine/confusion-pairs';
import type { ConfusionPair } from '@core/engine/confusion-pairs';

const KEY = 'gl:v1:fehlerbuch:entries';

export const DEFAULT_FEHLERBUCH_REVIEW_SIZE = 20;

export class FehlerbuchService {
  constructor(private storage: StorageService, private srs: SrsService) {}

  getAll(): Record<string, FehlerbuchEntry> {
    return this.storage.get<Record<string, FehlerbuchEntry>>(KEY) ?? {};
  }

  /** `results` should already be scoreable-filtered — both BlockRunner and
   *  TestRunner compute that filter before calling this. Seeds each new/repeated
   *  mistake into SrsService with an 'again' rating — the "extra weight": the item
   *  starts already scheduled to resurface tomorrow, not as an unscheduled card. */
  captureExerciseResults(lessonId: string, exercise: ExerciseUnion, results: ItemResult[], now: Date = new Date()): void {
    const wrong = results.filter(r => !r.correct);
    if (wrong.length === 0) return;
    const all = this.getAll();
    for (const raw of wrong) {
      const result = { ...raw, given: resolveGivenText(exercise, raw) };
      const key = mistakeKey(lessonId, exercise.id, result.ref);
      all[key] = recordMistake(all[key] ?? null,
        { lessonId, exerciseId: exercise.id, block: exercise.block, exerciseType: exercise.type },
        result, now);
      this.srs.recordRating(fehlerbuchCardKey(key), 'again', now);
    }
    this.storage.set(KEY, all);
  }

  startReview(size: number = DEFAULT_FEHLERBUCH_REVIEW_SIZE, now: Date = new Date()): FehlerbuchEntry[] {
    const all = this.getAll();
    const candidates: DueCandidate[] = Object.keys(all).map(k => ({
      cardKey: fehlerbuchCardKey(k),
      schedule: this.srs.getSchedule(fehlerbuchCardKey(k)),
    }));
    return selectBurst(candidates, size, now).map(cardKey => all[cardKey.slice(FEHLERBUCH_CARD_PREFIX.length)]);
  }

  rate(entryKey: string, rating: Rating, now: Date = new Date()): void {
    this.srs.recordRating(fehlerbuchCardKey(entryKey), rating, now);
  }

  getConfusionPairs(minOccurrences?: number): ConfusionPair[] {
    return detectConfusionPairs(
      Object.values(this.getAll()).map(e => ({ given: e.given, expected: e.expected })),
      minOccurrences,
    );
  }
}
