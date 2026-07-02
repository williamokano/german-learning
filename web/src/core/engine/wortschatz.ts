// Wortschatz counter (issue #340, F4) — pure TypeScript, no UI/DOM imports. Derived
// purely from F1 data (word identity) and F3 state (SM-2 schedule); no separate
// source of truth.

import { cardKeyFromDedupKey } from '@core/content/flashcards';

// Anki's "mature" convention — a genuinely defensible bar, not a rebrand of "seen".
export const MATURE_INTERVAL_DAYS = 21;

export interface WortschatzCount {
  seen: number;
  mastered: number;
}

// Deliberately NOT importing CardState from @core/services/srs: no file under
// core/engine/ or core/content/ imports from core/services/ anywhere in this
// codebase (services depend on engine/content, never the reverse). SrsService's
// real CardState is structurally assignable to this, so no cast is needed.
export interface CardStateLike {
  intervalDays?: number;
}

/**
 * A word is "seen" if either meaning-face card (DE→EN or EN→DE — independently
 * scheduled per F2/F3) has ever been rated; "mastered" if either has reached
 * matureIntervalDays. Article-face cards are deliberately excluded — mastery here
 * means "the word's meaning," not "its grammatical gender," a separate axis.
 */
export function countWortschatz(
  dedupKeys: string[],
  cardStates: Record<string, CardStateLike>,
  matureIntervalDays: number = MATURE_INTERVAL_DAYS,
): WortschatzCount {
  let seen = 0;
  let mastered = 0;
  for (const dedupKey of dedupKeys) {
    const states = (['meaning-de-en', 'meaning-en-de'] as const)
      .map(face => cardStates[cardKeyFromDedupKey(dedupKey, face)])
      .filter((s): s is CardStateLike => s != null);
    if (states.length === 0) continue;
    seen++;
    if (states.some(s => (s.intervalDays ?? 0) >= matureIntervalDays)) mastered++;
  }
  return { seen, mastered };
}
