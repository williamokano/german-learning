// ExamTimer — pure time-remaining/expiry math for ExamSimulator's countdown chrome
// (issue #348). The Svelte component owns the setInterval tick and UI state; every
// actual calculation (seconds left, expired?, MM:SS text) lives here so it's
// unit-testable without touching the DOM, mirroring how ScoringService keeps
// grading pure and lets TestRunner just render it.

/** Fallback exam length when a lesson's ExamGrid has no researched `durationMinutes`. */
export const DEFAULT_EXAM_DURATION_MINUTES = 60;

/** Seconds left before the exam auto-submits. Clamped to >= 0 — never negative. */
export function remainingSeconds(startedAt: number, durationMinutes: number, now: number): number {
  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsedSeconds);
}

/** True once the countdown has reached zero — the signal to auto-trigger grading. */
export function isExpired(startedAt: number, durationMinutes: number, now: number): boolean {
  return remainingSeconds(startedAt, durationMinutes, now) <= 0;
}

/** MM:SS display, e.g. 65 -> "01:05". Minutes aren't clamped to 2 digits — some
 *  exam grids (B2/C1) run past 3 hours, so "205:00" is expected and still readable. */
export function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
