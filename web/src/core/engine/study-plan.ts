// Exam-date study plan backplanner (issue #347, F14). Pure TypeScript, no UI/DOM/
// storage imports — mirrors sm2.ts's shape: given a target and a deadline, compute a
// dated daily schedule. Placement testing (the other half of #347) is deferred to a
// follow-up issue; this covers only "pick an exam + date → backplanned daily dose."

import type { PathNode, PathNodeId } from '@core/content/path';

export interface StudyPlanDay {
  date: string;        // "YYYY-MM-DD", local calendar day
  nodes: PathNode[];   // nodes to tackle this day — may be empty (light pace) or >1 (cram pace)
}

export interface StudyPlan {
  targetNodeId: PathNodeId;
  targetDate: string;          // "YYYY-MM-DD"
  totalNodesRemaining: number;
  daysRemaining: number;
  averageNodesPerDay: number;  // totalNodesRemaining / daysRemaining, rounded to 1 decimal
  days: StudyPlanDay[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Backplan a dated daily schedule from `today` to `targetDate` covering every
 * not-yet-completed node up to and including `targetNodeId` (the chosen checkpoint).
 *
 * Returns `null` if `targetNodeId` isn't in `manifest` — the caller should treat that
 * as "no valid target selected," not throw.
 *
 * A `targetDate` on or before `today` clamps to a 1-day plan (cram everything today)
 * rather than throwing or producing a negative-length schedule — an exam date that's
 * already passed is a real (if unfortunate) state the UI should be able to render.
 *
 * Distribution is as-even-as-possible via a running-total bucket split (not "cram
 * the front, leave the tail empty"): day `d` of `daysRemaining` gets nodes in index
 * range `[floor(d*len/daysRemaining), floor((d+1)*len/daysRemaining))`. This handles
 * both directions correctly — more nodes than days (multiple/day, no empty days) and
 * fewer nodes than days (single nodes spread across the full range, not front-loaded).
 */
export function buildStudyPlan(
  manifest: PathNode[],
  completedIds: ReadonlySet<PathNodeId>,
  targetNodeId: PathNodeId,
  today: Date,
  targetDate: Date,
): StudyPlan | null {
  const targetIndex = manifest.findIndex(n => n.id === targetNodeId);
  if (targetIndex < 0) return null;

  const remaining = manifest.slice(0, targetIndex + 1).filter(n => !completedIds.has(n.id));
  const daysRemaining = Math.max(1, daysBetween(today, targetDate) + 1);

  const days: StudyPlanDay[] = [];
  const len = remaining.length;
  for (let d = 0; d < daysRemaining; d++) {
    const start = Math.floor((d * len) / daysRemaining);
    const end = Math.floor(((d + 1) * len) / daysRemaining);
    days.push({ date: isoDate(addDays(today, d)), nodes: remaining.slice(start, end) });
  }

  return {
    targetNodeId,
    targetDate: isoDate(targetDate),
    totalNodesRemaining: len,
    daysRemaining,
    averageNodesPerDay: Math.round((len / daysRemaining) * 10) / 10,
    days,
  };
}
