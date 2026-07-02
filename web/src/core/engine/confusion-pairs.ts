// Confusion-pair detection (issue #345, F12) — pure TypeScript, no UI/DOM imports.
// Forms the learner keeps swapping (der/das, seit/seid, wenn/wann...), derived purely
// from raw (given, expected) string pairs — no grammar-concept taxonomy exists yet
// (that's F5's job, not built), so this can't lean on one.

import { normalize } from '@core/engine/grading';

// Excludes multi-word given/expected (e.g. the "order" widget's assembled full
// sentences) without any per-widget-type branching — verified against real
// given/expected shapes across all 11 exercise widgets.
export const MAX_PAIRABLE_LENGTH = 20;
export const DEFAULT_MIN_OCCURRENCES = 2;

export interface ConfusionCandidate {
  given: string;
  expected: string;
}

export interface ConfusionPair {
  a: string;
  b: string;
  count: number;
  examples: ConfusionCandidate[]; // raw display forms, capped at 5
}

function isPairable(s: string): boolean {
  return s.length > 0 && s.length <= MAX_PAIRABLE_LENGTH && !/\s/.test(s);
}

export function detectConfusionPairs(
  candidates: ConfusionCandidate[],
  minOccurrences: number = DEFAULT_MIN_OCCURRENCES,
): ConfusionPair[] {
  const byPair = new Map<string, ConfusionPair>();
  for (const { given, expected } of candidates) {
    const ng = normalize(given);
    const ne = normalize(expected);
    if (!isPairable(ng) || !isPairable(ne) || ng === ne) continue;
    const [a, b] = ng < ne ? [ng, ne] : [ne, ng];
    const k = `${a} ${b}`;
    const entry = byPair.get(k) ?? { a, b, count: 0, examples: [] };
    entry.count++;
    if (entry.examples.length < 5) entry.examples.push({ given, expected });
    byPair.set(k, entry);
  }
  return [...byPair.values()]
    .filter(p => p.count >= minOccurrences)
    .sort((x, y) => y.count - x.count);
}
