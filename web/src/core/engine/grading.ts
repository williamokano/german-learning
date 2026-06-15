// GradingEngine — pure TypeScript, no UI/DOM imports
// See docs/web/SCORING.md §2.

export interface GradingFlags {
  caseSensitive?: boolean;
  strictUmlaut?: boolean;
  keepPunctuation?: boolean;
}

// Re-export for convenience — canonical definition is in content/types.ts
export type { ItemResult } from '@core/content/types';

function foldUmlautAndEszett(s: string): string {
  return s
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'ae').replace(/Ö/g, 'oe').replace(/Ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

export function normalize(s: string, f: GradingFlags = {}): string {
  let t = s.trim().replace(/\s+/g, ' ');
  if (!f.keepPunctuation) t = t.replace(/[.?!,;:]+$/u, '');
  if (!f.caseSensitive)   t = t.toLowerCase();
  if (!f.strictUmlaut)    t = foldUmlautAndEszett(t);
  return t;
}

export function checkText(
  expected: string | string[],
  given: string,
  f: GradingFlags = {},
): boolean {
  const alts = (Array.isArray(expected) ? expected : [expected]).map(a => normalize(a, f));
  return alts.includes(normalize(given, f));
}

export function checkTextDetail(
  expected: string | string[],
  given: string,
  alts: Array<{ word: string; note?: string }> | undefined,
  f: GradingFlags = {},
): { correct: boolean; note?: string } {
  if (checkText(expected, given, f)) return { correct: true };
  const n = normalize(given, f);
  for (const alt of alts ?? []) {
    if (normalize(alt.word, f) === n) return { correct: true, note: alt.note };
  }
  return { correct: false };
}

export function checkBank(expectedWord: string, placedWord: string | null): boolean {
  return placedWord != null && placedWord === expectedWord;
}

export function checkOrder(answer: number[], given: number[], alt?: number[][]): boolean {
  const eq = (a: number[]) => a.length === given.length && a.every((v, i) => v === given[i]);
  return eq(answer) || (alt ?? []).some(eq);
}

export function checkEquality<T>(expected: T, given: T): boolean {
  return expected === given;
}
