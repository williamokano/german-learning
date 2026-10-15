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

/** Token a "no word here" gap normalizes to: answer keys write it as "—", learners
 *  type "-", "–", "—" or leave the gap empty (issue #469). */
const NO_WORD = '—';

export function normalize(s: string, f: GradingFlags = {}): string {
  let t = s.normalize('NFC')
    .replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'")   // smart / typographic apostrophes
    .replace(/\u2026|\.{3}/g, ' ')                         // ellipsis
    .replace(/(^|\s)[-\u2013\u2014](?=\s|$)/g, `$1${NO_WORD}`) // standalone dash (not hyphens in words)
    .trim().replace(/\s+/g, ' ');
  if (!f.keepPunctuation) t = t.replace(/[.?!,;:]+$/u, '');
  if (!f.caseSensitive)   t = t.toLowerCase();
  if (!f.strictUmlaut)    t = foldUmlautAndEszett(t);
  return t;
}

/** `normalize` for answer comparison: an empty answer also counts as "no word". */
function answerForm(s: string, f: GradingFlags): string {
  return normalize(s, f) || NO_WORD;
}

export function checkText(
  expected: string | string[],
  given: string,
  f: GradingFlags = {},
): boolean {
  const alts = (Array.isArray(expected) ? expected : [expected]).map(a => answerForm(a, f));
  return alts.includes(answerForm(given, f));
}

export function checkTextDetail(
  expected: string | string[],
  given: string,
  alts: Array<{ word: string; note?: string }> | undefined,
  f: GradingFlags = {},
): { correct: boolean; note?: string } {
  if (checkText(expected, given, f)) return { correct: true };
  const n = answerForm(given, f);
  for (const alt of alts ?? []) {
    if (answerForm(alt.word, f) === n) return { correct: true, note: alt.note };
  }
  return { correct: false };
}

/** Gap-bank check: the placed bank word must equal one of the listed answers. */
export function checkBank(expected: string | string[], placedWord: string | null): boolean {
  return placedWord != null && (Array.isArray(expected) ? expected : [expected]).includes(placedWord);
}

/** Order check by *text*: two tiles with the same word ("den" … "den") are
 *  interchangeable, so compare the sentence the learner built, not tile indices. */
export function checkOrderText(tiles: string[], answer: number[], given: number[], alt?: number[][]): boolean {
  const text = (seq: number[]) => seq.map(i => tiles[i]).join('\u0000');
  const built = text(given);
  return given.length === answer.length && [answer, ...(alt ?? [])].some(seq => text(seq) === built);
}


export function checkEquality<T>(expected: T, given: T): boolean {
  return expected === given;
}
