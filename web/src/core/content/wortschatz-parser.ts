// wortschatz-parser.ts — draft importer for the F1 vocab.yml layer (issue #337).
//
// Parses the heterogeneous "## … Wortschatz" markdown section of a lesson.md into
// draft vocab entries. The Wortschatz markdown comes in several shapes:
//   - 3-gender tables   | der (m) | die (f) | das (n) |  with cells like
//                         "der Apfel, – (Äpfel)", "der Käse (no pl.)", "das Salz / der Zucker"
//   - middot `·` lists  "der Kaffee · der Tee · der Saft, –e (Säfte) · …"
//   - bold verb lists   "**essen** (to eat) ⚠️ · **trinken** (to drink) · …"
//   - quantity phrases  "ein Kilo Äpfel · ein Liter Milch · …"
//
// This is a DRAFT generator: it extracts what it can (de / article / plural / pos) and
// flags everything uncertain with `needsReview: true` + a `reviewNote` rather than
// guessing. A human review pass fills `en` / `tags` / `example` and clears the flags.
//
// Pure module — no fs, no astro:content — so build/import-vocab.ts and vitest share it.

import type { VocabEntryType, VocabSetType, ArticleType, PartOfSpeechType } from './vocab';

// A draft entry is a VocabEntry that may still carry a reviewNote.
type DraftEntry = VocabEntryType;

const ARTICLES = new Set(['der', 'die', 'das']);
const DECORATION = /[⚠️🔊✏️💡🎧✅❗❓→·]/gu;

/** Slice out the `## … Wortschatz` section (until the next `## ` heading). */
export function extractWortschatzSection(markdown: string): string | null {
  const lines = markdown.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+.*Wortschatz/i.test(lines[i])) { start = i; break; }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) && !/^###/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n');
}

/** Should this line be ignored entirely (Lerntipp, audio, prices, headings, …)? */
function isSkippable(line: string): boolean {
  const t = line.trim();
  if (t === '') return true;
  if (t.startsWith('>')) return true;            // blockquotes: Lerntipp / Hör zu / Selbsttest
  if (t.startsWith('#')) return true;            // sub-headings
  if (/^[-*_]{3,}$/.test(t)) return true;        // horizontal rules
  if (t.includes('🎧') || /\]\(audio\//.test(t)) return true; // audio links
  if (t.includes('€')) return true;             // price lines
  return false;
}

/** True for a markdown table whose header advertises der/die/das columns. */
function isGenderTableHeader(line: string): boolean {
  const cells = splitTableRow(line).map(c => c.toLowerCase());
  return cells.some(c => c.includes('der')) &&
         cells.some(c => c.includes('die')) &&
         cells.some(c => c.includes('das'));
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{2,}/.test(line.trim()) && line.includes('-');
}

/** Parse the full Wortschatz markdown into a VocabSet. */
export function parseWortschatz(markdown: string, lesson: string): VocabSetType {
  const section = extractWortschatzSection(markdown);
  const entries: DraftEntry[] = [];
  if (section === null) return { lesson, entries };

  const lines = section.split('\n');
  let i = 0;
  let inGenderTable = false;
  let textBlock: string[] = [];

  const flushTextBlock = () => {
    if (textBlock.length === 0) return;
    const joined = textBlock.join(' ');
    for (const tok of joined.split('·')) {
      const e = parseToken(tok);
      if (e) entries.push(e);
    }
    textBlock = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    // Table rows
    if (t.startsWith('|')) {
      flushTextBlock();
      if (isTableSeparator(t)) { i++; continue; }
      if (!inGenderTable) {
        // First row of a fresh table: a der/die/das header opens a vocab table.
        // (Non-gender tables stay un-flagged, so their rows are skipped below.)
        if (isGenderTableHeader(t)) inGenderTable = true;
        i++;                       // the header row itself holds no entries
        continue;
      }
      // Inside a gender table → this is a data row.
      for (const cell of splitTableRow(t)) {
        if (cell === '') continue;
        for (const part of cell.split('/')) {             // "das Salz / der Zucker"
          const e = parseToken(part);
          if (e) entries.push(e);
        }
      }
      i++;
      continue;
    }

    inGenderTable = false;

    if (isSkippable(line)) {
      flushTextBlock();           // a blank line / skippable line ends a list block
      i++;
      continue;
    }

    textBlock.push(t);
    i++;
  }
  flushTextBlock();

  return { lesson, entries };
}

/** Pull a German plural out of a code (-n, -e, …) and/or a parenthetical hint. */
function resolvePlural(de: string, code: string | null, paren: string | null): {
  plural: string | null;
  needsReview: boolean;
} {
  // Explicit "no plural" marker
  if ((code && /no pl/i.test(code)) || (paren && /no pl/i.test(paren))) {
    return { plural: null, needsReview: false };
  }
  // Parenthetical that spells the plural out, e.g. "(Äpfel)", "(usually pl.: Nudeln)"
  if (paren) {
    const m = paren.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+)\s*$/);
    if (m) return { plural: m[1], needsReview: false };
  }
  if (!code) return { plural: null, needsReview: true };

  // Suffix codes: "-n", "-e", "-er", "-s", "-nen", "-" (unchanged), "–" (umlaut only)
  const m = code.match(/^[-–]([a-zä]*)$/);
  if (m) {
    const suffix = m[1];
    const umlautOnly = code.startsWith('–') && suffix === '';
    if (umlautOnly) return { plural: de, needsReview: true }; // can't auto-umlaut safely
    return { plural: de + suffix, needsReview: code.startsWith('–') };
  }
  return { plural: null, needsReview: true };
}

/**
 * Parse one Wortschatz token (a table cell or a middot-separated item) into a draft
 * entry, or null if it carries no word. Generously sets `needsReview`.
 */
export function parseToken(rawInput: string): DraftEntry | null {
  let raw = rawInput.replace(DECORATION, '').trim();
  if (raw === '') return null;
  if (!/[A-Za-zÄÖÜäöüß]/.test(raw)) return null;  // punctuation-only (stray rules, etc.)

  const wasBold = /\*\*/.test(raw);
  raw = raw.replace(/\*\*/g, '').trim();
  if (raw === '') return null;

  // Last parenthetical (English gloss, plural hint, or "no pl.")
  let paren: string | null = null;
  const parenMatch = raw.match(/\(([^)]*)\)\s*$/);
  if (parenMatch) {
    paren = parenMatch[1].trim();
    raw = raw.slice(0, parenMatch.index).trim();
  }

  const words = raw.split(/\s+/);
  const lead = words[0]?.toLowerCase();

  // ── Noun: leading der/die/das ────────────────────────────────────────────
  if (ARTICLES.has(lead)) {
    const article = lead as ArticleType;
    const rest = words.slice(1).join(' ');
    const [head, code] = splitOnFirstComma(rest);
    const de = head.trim();
    if (de === '') return null;
    const { plural, needsReview: pluralReview } = resolvePlural(de, code, paren);

    const en = englishGloss(paren);
    const needsReview = en === '' || pluralReview;
    return finalize({
      de, article, plural, en, pos: 'noun', needsReview,
      reviewNote: en === '' ? 'fill English gloss' : pluralReview ? 'check plural' : undefined,
    });
  }

  // ── Verb: bolded item ────────────────────────────────────────────────────
  if (wasBold) {
    const de = words.join(' ').replace(/,.*$/, '').trim();
    const en = englishGloss(paren);
    return finalize({
      de, article: null, plural: null, en, pos: 'verb',
      needsReview: en === '',
      reviewNote: en === '' ? 'fill English gloss' : undefined,
    });
  }

  // ── Phrase: starts with ein/eine/… or is multi-word ──────────────────────
  if (/^(ein|eine|einen|einem|einer)$/.test(lead) || words.length > 1) {
    const en = englishGloss(paren);
    return finalize({
      de: raw, article: null, plural: null, en, pos: 'phrase',
      needsReview: true,
      reviewNote: 'phrase: confirm pos / fill English gloss',
    });
  }

  // ── Single bare word: ambiguous (verb? adjective? noun missing article?) ──
  const en = englishGloss(paren);
  const capitalized = /^[A-ZÄÖÜ]/.test(raw);
  return finalize({
    de: raw,
    article: null,
    plural: null,
    en,
    pos: capitalized ? 'noun' : 'other',
    needsReview: true,
    reviewNote: capitalized ? 'noun missing article' : 'confirm part of speech',
  });
}

/**
 * A parenthetical is an English gloss when it starts lowercase ("to eat", "breakfast").
 * Plural hints — "(Äpfel)", "(no pl.)", "(usually pl.: Nudeln)" — are not glosses, even
 * when they start lowercase, so they fall through to needsReview rather than masquerade.
 */
function englishGloss(paren: string | null): string {
  if (!paren) return '';
  const p = paren.trim();
  if (/no pl|\bpl\b|plural|usually|meist/i.test(p)) return '';
  if (/^[A-ZÄÖÜ]/.test(p)) return '';            // capitalized German plural hint
  return /^[a-z]/.test(p) ? p : '';              // lowercase → English gloss
}

function splitOnFirstComma(s: string): [string, string | null] {
  const idx = s.indexOf(',');
  if (idx === -1) return [s, null];
  return [s.slice(0, idx), s.slice(idx + 1).trim()];
}

/** Apply schema-style defaults so drafts serialize consistently. */
function finalize(e: {
  de: string;
  article: ArticleType | null;
  plural: string | null;
  en: string;
  pos: PartOfSpeechType;
  needsReview: boolean;
  reviewNote?: string;
}): DraftEntry {
  return {
    de: e.de,
    article: e.article,
    plural: e.plural,
    en: e.en,
    pos: e.pos,
    tags: [],
    core: true,
    needsReview: e.needsReview,
    ...(e.reviewNote ? { reviewNote: e.reviewNote } : {}),
  };
}
