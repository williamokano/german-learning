// SM-2 spaced-repetition scheduler (issue #339, F3) — pure TypeScript, no UI/DOM imports.
// Anki's simplified 4-button mapping, not raw Wozniak SM-2 (which uses a 0-5 quality
// scale). Hard/Good/Easy each get their own interval formula rather than sharing one
// ladder, so Hard always lands strictly below Good and Easy strictly above, at every
// repetition count.

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Sm2Schedule {
  reps: number;
  intervalDays: number;
  ease: number;
  dueAt: string; // ISO date, calendar-day granularity (midnight-truncated)
}

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

// Calendar-day truncated, not a rolling 24h timer — reviewing at 23:58 must not make
// a card due again at 23:58 tomorrow. Due-ness is a stable daily concept for an app
// used once a day at varying times.
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Formats from LOCAL date components, not toISOString() (which converts to UTC and
// can shift the calendar day backward/forward depending on the runtime's timezone).
function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Advance a card's schedule by one rating. `prev` is null for a never-reviewed card.
 * Known, accepted quirk: on a card's very first rating, Again/Hard/Good all collapse
 * to a 1-day interval (only Easy differs, at 4 days) — unavoidable at day-granularity
 * with a 1-day floor and no Anki-style sub-day learning steps, and correct for
 * "simple, proven" v1 scope.
 */
export function review(prev: Sm2Schedule | null, rating: Rating, now: Date = new Date()): Sm2Schedule {
  const reps0 = prev?.reps ?? 0;
  const interval0 = prev?.intervalDays ?? 0;
  const ease0 = prev?.ease ?? DEFAULT_EASE;

  let reps: number;
  let ease: number;
  let intervalDays: number;

  switch (rating) {
    case 'again':
      reps = 0;
      ease = Math.max(MIN_EASE, ease0 - 0.2);
      intervalDays = 1;
      break;
    case 'hard':
      reps = reps0 + 1;
      ease = Math.max(MIN_EASE, ease0 - 0.15);
      intervalDays = reps0 === 0 ? 1 : Math.max(interval0 + 1, Math.round(interval0 * 1.2));
      break;
    case 'good':
      reps = reps0 + 1;
      ease = ease0;
      intervalDays = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval0 * ease0);
      break;
    case 'easy':
      reps = reps0 + 1;
      ease = ease0 + 0.15;
      intervalDays = reps === 1 ? 4 : reps === 2 ? 6 : Math.round(interval0 * ease0 * 1.3);
      break;
  }

  return { reps, intervalDays, ease, dueAt: isoDate(addDays(now, intervalDays)) };
}

/** A never-scheduled card (null/undefined) is always due — it's new. */
export function isDue(schedule: Sm2Schedule | null | undefined, now: Date = new Date()): boolean {
  if (schedule == null) return true;
  return schedule.dueAt <= isoDate(now);
}

export interface DueCandidate {
  cardKey: string;
  schedule: Sm2Schedule | null;
}

/** Due first (most-overdue first), then not-due filler (soonest-due first). A null
 *  schedule (never reviewed) sorts as maximally due. */
export function rankByDue(candidates: DueCandidate[], now: Date = new Date()): DueCandidate[] {
  const today = isoDate(now);
  return candidates.slice().sort((a, b) => {
    const aDue = a.schedule == null ? '' : a.schedule.dueAt;
    const bDue = b.schedule == null ? '' : b.schedule.dueAt;
    const aIsDue = aDue <= today;
    const bIsDue = bDue <= today;
    if (aIsDue !== bIsDue) return aIsDue ? -1 : 1;
    // Both due: most-overdue (smallest dueAt) first. Both not-due: soonest-due first.
    // Either way, ascending dueAt is the right order — a null schedule sorts first
    // ('' < any real date).
    return aDue < bDue ? -1 : aDue > bDue ? 1 : 0;
  });
}

export function selectBurst(candidates: DueCandidate[], size: number, now: Date = new Date()): string[] {
  return rankByDue(candidates, now).slice(0, size).map(c => c.cardKey);
}
