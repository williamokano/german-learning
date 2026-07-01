// wortschatz-parser.ts — V2 (F1 issue #337 follow-up).
//
// Parses the heterogeneous "## … Wortschatz" markdown section of a lesson.md into
// draft vocab entries. The Wortschatz markdown comes in many shapes; V2 recognises
// the ones that came up across A1–A2:
//
//   TABLES (data row → entries):
//     - 3-gender           | der (m) | die (f) | das (n) |
//     - maskulin-feminin   | Beruf (m) | Beruf (f) | (English?) |   (cell starts with der/die/das)
//     - noun-english       | Noun (article + plural) | English |   (cell starts with der/die/das)
//     - adj-english        | Adjektiv | English | Comparative | Superlative |
//     - verb-english       | Verb | English | Notes |
//     - bilingual          | Deutsch | English |   (general 2-col)
//     - middot-list        | (empty) | (empty) | … |   (data row holds middot-separated tokens)
//
//   TEXT BLOCKS (joined lines, then split):
//     "**essen** (to eat) ⚠️ · **trinken** (to drink) · …"  → verb list
//     "groß ↔ klein · alt ↔ jung"  → connector pairs (↔ → 2 entries each)
//     "Fußball / Tennis / Karten spielen"  → multi-option (/ → split)
//     "sich anmelden"  → reflexive (sich + infinitive; tag `reflexive`)
//     "ein|steigen"  → separable-verb typography (strip |; tag `separable`)
//
// Tables whose header doesn't match any of the above are still dropped (with a
// warning) — the parser prefers under-extraction with a loud signal over silent
// garbage. To extend coverage: add a branch to `classifyTableHeader()` and a
// row-parser in `parseTableDataRow()`.
//
// V2 is also DRAFT: it extracts what it can (de / article / plural / pos) and
// flags uncertain rows with `needsReview: true` + a `reviewNote`. A human pass
// fills `en` / `tags` / `example` and clears the flags.
//
// Pure module — no fs, no astro:content — so build/import-vocab.ts and vitest share it.

import type { VocabEntryType, ArticleType, PartOfSpeechType } from './vocab';

type DraftEntry = VocabEntryType;

export interface ParseResult {
  lesson: string;
  entries: DraftEntry[];
  warnings: string[];
  sectionFound: boolean; // was a "## … Wortschatz" section present at all?
}

// ─── Table classification ─────────────────────────────────────────────────

export type TableKind =
  | 'gender'
  | 'maskulin-feminin'
  | 'noun-english'
  | 'adj-english'
  | 'verb-english'
  | 'bilingual'
  | 'middot-list'
  | null;

/** Decide which kind of vocab table a header row advertises, or null to skip. */
function classifyTableHeader(headerCells: string[]): TableKind {
  const h = headerCells.map(c => c.toLowerCase().trim());

  // 1. 3-gender: every cell mentions one of der / die / das
  if (h.some(c => /\bder\b/.test(c)) && h.some(c => /\bdie\b/.test(c)) && h.some(c => /\bdas\b/.test(c))) {
    return 'gender';
  }

  // 2. Maskulin / Feminin (gendered-pair column headings). Match German (männlich /
  //    Maskuline) and English (male / masculine) variants, plus the parenthetical
  //    `(m)` / `(f)` shorthand common in B2-style tables.
  const isM = (c: string) => /\(\s*m\s*\)|\bm[äa]n?n?l?ich\b|\bmasc(uline)?\b|\bmale\b/.test(c);
  const isF = (c: string) => /\(\s*f\s*\)|\bweib?l?ich\b|\bfem(inin)?\b|\bfemale\b/.test(c);
  if (h.some(isM) && h.some(isF)) {
    return 'maskulin-feminin';
  }

  // 3. Verb (header mentions "verb" or "infinitive")
  if (h.some(c => /\b(verb|infinitive|verben|infinitiv)\b/.test(c))) {
    return 'verb-english';
  }

  // 4. Adjective (header mentions "adjektiv" or "comparative" / "superlative")
  if (h.some(c => /\b(adjektiv|comparative|superlative|komparativ|superlativ)\b/.test(c))) {
    return 'adj-english';
  }

  // 5. Noun (header mentions noun-ish keywords or an "article + plural" pattern).
  //    Sources vary English/German: "Noun (article + plural)", "Nomen (Artikel + Plural)".
  if (h.some(c => /^(noun|nomen|artikel(\s*\+?\s*plural)?|artikel.*plural|lemma|wort)$/.test(c) ||
                   /artikel\s*\+?\s*plural/.test(c) ||
                   /article\s*\+?\s*plural/.test(c))) {
    return 'noun-english';
  }

  // 6. Bilingual 2-column (Deutsch/German | English/Englisch)
  if (h.length === 2 && /^(deutsch|german|wort|german word)/.test(h[0]) && /^(english|englisch)/.test(h[1])) {
    return 'bilingual';
  }

  // 7. Empty header cells → middot-list (data row holds middot-separated tokens)
  if (h.length > 0 && h.every(c => c === '')) {
    return 'middot-list';
  }

  return null;
}

// ─── Section extraction ───────────────────────────────────────────────────

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

// ─── Table row helpers ────────────────────────────────────────────────────

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

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{2,}/.test(line.trim()) && line.includes('-');
}

/** A row that looks like pricing / currency data, not vocab. Used to suppress
 *  false-positive entries from tables whose header classifies as a vocab kind
 *  but whose body carries € / EUR / per-X markers. */
function looksLikeNonVocabRow(cells: string[]): boolean {
  return cells.some(c => /€|\bEUR\b|\bUSD\b|\bGBP\b|\bpro\s+(stunde|tag|woche|monat|jahr|kilo|liter)|\b\d+\s*€|\b\$\d/i.test(c));
}

/** Identify the English cell in a data row. Returns the cell index, or -1.
 *  Heuristic: the cell whose value is the shortest (typical English glosses are 1–3 words)
 *  AND that is NOT the lemma column (col 0). For 2-col tables, col 1 is always English. */
function findEnglishCellIndex(cells: string[]): number {
  if (cells.length === 2) return 1;
  let best = -1;
  let bestLen = Infinity;
  for (let i = 1; i < cells.length; i++) {
    const c = cells[i].trim();
    if (c === '') continue;
    if (/[A-ZÄÖÜ]/.test(c)) continue;            // capitalised cell → likely German
    if (c.length < bestLen) {
      bestLen = c.length;
      best = i;
    }
  }
  return best;
}

// ─── Cell → entry parsers ─────────────────────────────────────────────────

/** Parse a cell that's known to hold a German noun (starts with der/die/das). */
function parseNounCell(cell: string, defaultEn?: string): DraftEntry | null {
  return parseToken(cell, defaultEn);
}

/** Parse a cell that's known to hold a German verb (infinitive or sich + infinitive). */
function parseVerbCell(cell: string, defaultEn?: string): DraftEntry | null {
  return parseToken(cell, defaultEn);
}

/** Parse a cell that's known to hold a German adjective (lowercase single word, no article). */
function parseAdjectiveCell(cell: string, defaultEn?: string): DraftEntry | null {
  const e = parseToken(cell, defaultEn);
  if (e && e.pos !== 'adjective') {
    e.pos = 'adjective';
    e.needsReview = e.en.trim() === '' || e.tags.length === 0;
  }
  return e;
}

/** Dispatch a data row through the per-kind parser. */
function parseTableDataRow(row: string, kind: NonNullable<TableKind>): DraftEntry[] {
  const cells = splitTableRow(row).filter(c => c !== '');
  if (cells.length === 0) return [];

  switch (kind) {
    case 'gender': {
      // Each cell is a noun token. Some cells hold two nouns separated by `/`
      // (e.g. "das Salz / der Zucker"). Split on `/` first, then parse each.
      return cells.flatMap(c => c.split('/').map(part => parseToken(part)).filter(notNull));
    }

    case 'maskulin-feminin': {
      // cells: [m-cell (starts with der), f-cell (starts with die), optional: plural/english]
      const out: DraftEntry[] = [];
      if (cells[0]) {
        const e = parseNounCell(cells[0]);
        if (e) out.push(e);
      }
      if (cells[1]) {
        const e = parseNounCell(cells[1]);
        if (e) out.push(e);
      }
      // cells[2] is either a plural-only noun (starts with der/die/das)
      // or an English gloss. We carry the gloss onto the f-cell if the m/f
      // cells haven't been annotated yet.
      if (cells[2]) {
        const c2 = cells[2].trim();
        if (/^(der|die|das)\s/.test(c2)) {
          const e = parseNounCell(c2);
          if (e) { e.plural = null; e.needsReview = true; e.reviewNote = 'plural-only noun — confirm'; out.push(e); }
        } else if (c2.length > 0) {
          // English gloss — apply to entries that have empty `en`
          for (const e of out) {
            if (e.en.trim() === '') { e.en = c2; e.needsReview = false; e.reviewNote = undefined; }
          }
        }
      }
      return out;
    }

    case 'noun-english': {
      const nounCell = cells[0];
      const enIdx = findEnglishCellIndex(cells);
      const enCell = enIdx > 0 ? cells[enIdx] : '';
      const e = parseNounCell(nounCell, enCell);
      return e ? [e] : [];
    }

    case 'adj-english': {
      const enIdx = findEnglishCellIndex(cells);
      const enCell = enIdx > 0 ? cells[enIdx] : '';
      const e = parseAdjectiveCell(cells[0], enCell);
      return e ? [e] : [];
    }

    case 'verb-english': {
      const enIdx = findEnglishCellIndex(cells);
      const enCell = enIdx > 0 ? cells[enIdx] : '';
      const e = parseVerbCell(cells[0], enCell);
      return e ? [e] : [];
    }

    case 'bilingual': {
      // 2-col Deutsch | English
      const de = cells[0]?.trim() || '';
      const en = cells[1]?.trim() || '';
      if (de === '') return [];
      const e = parseToken(de, en);
      return e ? [e] : [];
    }

    case 'middot-list': {
      // All cells joined, then split on middot. Each token is a vocab item.
      const all = cells.join(' ');
      return all.split('·').flatMap(t => splitOnConnectors(t).map(piece => parseToken(piece)).filter(notNull));
    }
  }
}

// ─── Token parser (unchanged behaviour + new patterns) ────────────────────

const ARTICLES = new Set(['der', 'die', 'das']);
const DECORATION = /[⚠️🔊✏️💡🎧✅❗❓→·↔|/]/gu;
const ARTICLE_WORD: Record<string, RegExp> = { der: /\bder\b/, die: /\bdie\b/, das: /\bdas\b/ };

/** Split on connector pairs (↔) and multi-option (/) before tokenising, so each piece
 *  becomes its own vocab entry.  `A ↔ B` and `A / B / C` each yield 2+ entries. */
function splitOnConnectors(input: string): string[] {
  return input
    .split(/[↔/]/)
    .map(s => s.trim())
    .filter(s => s !== '');
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
  // A capitalized parenthetical spells the plural out, e.g. "(Äpfel)", "(usually pl.:
  // Nudeln)" — but only trust it alongside a comma plural-code ("der Saft, –e (Säfte)").
  // Without a code the paren is an English gloss, and a capitalized word inside it
  // ("a town in Bavaria") must not be mistaken for a plural.
  if (paren && code) {
    const m = paren.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+)\s*$/);
    if (m) return { plural: m[1], needsReview: false };
  }
  if (!code) return { plural: null, needsReview: true };

  // Suffix codes: "-n", "-e", "-er", "-s", "-nen", "-" (unchanged), "–" (umlaut only)
  const m = code.match(/^[-–]([a-zäöü]*)$/);
  if (m) {
    const suffix = m[1];
    const umlaut = code.startsWith('–');
    // Stems ending in a "weak" syllable (e/el/er/en) typically DON'T add the plural
    // suffix on top — the suffix is already part of the stem (`Apfel` already ends in
    // `-el`; plural `Äpfel` adds no letter). Common plurals: Vater → Väter, Apfel → Äpfel,
    // Bruder → Brüder, Garten → Gärten. Detect this and skip the suffix.
    const stemEndsWeak = /(el|er|en|e)$/i.test(de);
    if (umlaut) {
      if (suffix === '' || stemEndsWeak) {
        return { plural: bestEffortUmlautOnly(de), needsReview: true };
      }
      return { plural: bestEffortUmlautSuffix(de, suffix), needsReview: true };
    }
    return { plural: de + suffix, needsReview: false };
  }
  return { plural: null, needsReview: true };
}

/** Umlaut the FIRST vowel cluster of `de` (a → ä, o → ö, u → ü, au → äu). This is the
 *  common German plural pattern (`Apfel → Äpfel`, `Vater → Väter`, `Bauer → Bauern`).
 *  Note: not every a/o/u-stem umlauts (e.g. `Bauer → Bauern`, no umlaut) — we still
 *  emit a guess and let `needsReview` flag it for human confirmation. */
function bestEffortUmlautSuffix(de: string, suffix: string): string {
  // au cluster anywhere: catches both `au` at start and inside the stem.
  // Preserves case (capital → Äu, lowercase → äu).
  const auM = de.match(/au/i);
  if (auM) {
    const idx = auM.index!;
    const isUpper = auM[0] >= 'A' && auM[0] <= 'Z' && auM[0][0] >= 'A' && auM[0][0] <= 'Z';
    const u = isUpper ? 'Äu' : 'äu';
    return de.slice(0, idx) + u + de.slice(idx + 2) + suffix;
  }
  // First single a/o/u anywhere in the stem.
  const m = de.match(/[aou]/i);
  if (m) {
    const idx = m.index!;
    const vowel = m[0];
    const isUpper = vowel >= 'A' && vowel <= 'Z';
    const u = isUpper
      ? ({ A: 'Ä', O: 'Ö', U: 'Ü' } as Record<string, string>)[vowel.toUpperCase()]!
      : ({ a: 'ä', o: 'ö', u: 'ü' } as Record<string, string>)[vowel]!;
    return de.slice(0, idx) + u + de.slice(idx + 1) + suffix;
  }
  return de + suffix;
}

function bestEffortUmlautOnly(de: string): string {
  return bestEffortUmlautSuffix(de, '');
}

/** The review note for a noun draft: an empty gloss outranks a shaky plural. */
function nounReviewNote(en: string, pluralReview: boolean): string | undefined {
  if (en === '') return 'fill English gloss';
  if (pluralReview) return 'check plural';
  return undefined;
}

/**
 * Parse one Wortschatz token (a table cell, a middot-separated item, or a
 * connector-split piece) into a draft entry, or null if it carries no word.
 * Generously sets `needsReview`. `defaultEn` lets callers pre-fill the gloss
 * when the English was found in an adjacent table cell.
 */
export function parseToken(rawInput: string, defaultEn?: string): DraftEntry | null {
  let raw = rawInput.replace(DECORATION, '').trim();
  if (raw === '') return null;
  if (!/[A-Za-zÄÖÜäöüß]/.test(raw)) return null;  // punctuation-only (stray rules, etc.)

  const wasBold = /\*\*/.test(raw);
  raw = raw.replace(/\*\*/g, '').trim();
  if (raw === '') return null;

  // Strip separable-verb pipe typography: "ein|steigen" → "einsteigen".
  raw = raw.replace(/\|/g, '');

  // Last parenthetical (English gloss, plural hint, or "no pl.")
  let paren: string | null = null;
  const parenMatch = raw.match(/\(([^)]*)\)\s*$/);
  if (parenMatch) {
    paren = parenMatch[1].trim();
    raw = raw.slice(0, parenMatch.index).trim();
  }

  // The gloss is branch-independent — it's derived from `paren`, which is now fixed.
  let en = englishGloss(paren);
  if (en === '' && defaultEn) en = defaultEn;

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
    return finalize({
      de, article, plural, en, pos: 'noun',
      needsReview: en === '' || pluralReview,
      reviewNote: nounReviewNote(en, pluralReview),
    });
  }

  // ── Reflexive: "sich <verb>" — tag the verb as reflexive ───────────────
  if (lead === 'sich' && words.length === 2) {
    const verb = words[1].trim();
    return finalize({
      de: verb, article: null, plural: null, en, pos: 'verb',
      tags: ['verb', 'reflexive'],
      needsReview: en === '',
      reviewNote: en === '' ? 'fill English gloss' : 'reflexive — confirm pos',
    });
  }

  // ── Verb: bare infinitive ───────────────────────────────────────────────
  if (/^[a-zäöü][a-zäöüß]*(en|n)$/.test(raw)) {
    return finalize({
      de: raw, article: null, plural: null, en, pos: 'verb',
      tags: wasBold ? ['verb'] : ['verb'],
      needsReview: en === '',
      reviewNote: en === '' ? 'fill English gloss' : 'verb — confirm pos',
    });
  }

  // ── Bold non-infinitive single word: assume adjective, needs review ────
  if (wasBold && words.length === 1) {
    return finalize({
      de: raw, article: null, plural: null, en, pos: 'adjective',
      tags: ['adjective'],
      needsReview: en === '',
      reviewNote: en === '' ? 'fill English gloss' : 'bold item — confirm pos',
    });
  }

  // ── Phrase: starts with ein/eine/… or is multi-word ─────────────────────
  if (/^(ein|eine|einen|einem|einer)$/.test(lead) || words.length > 1) {
    return finalize({
      de: raw, article: null, plural: null, en, pos: 'phrase',
      needsReview: true,
      reviewNote: 'phrase: confirm pos / fill English gloss',
    });
  }

  // ── Single bare word ────────────────────────────────────────────────────
  const capitalized = /^[A-ZÄÖÜ]/.test(raw);
  if (capitalized) {
    return finalize({
      de: raw,
      article: null,
      plural: null,
      en,
      pos: 'noun',
      needsReview: true,
      reviewNote: 'noun missing article',
    });
  }
  // Bare lowercase single word — V2 routes to `adjective` (V1 routed to `other`).
  // Bare lowercase German words in the Wortschatz are almost always predicative
  // adjectives used after `sein`; a reviewer can confirm.
  return finalize({
    de: raw,
    article: null,
    plural: null,
    en,
    pos: 'adjective',
    tags: ['adjective'],
    needsReview: en === '',
    reviewNote: en === '' ? 'fill English gloss' : 'adjective — confirm pos / fill gloss',
  });
}

/**
 * A parenthetical is an English gloss when it starts lowercase ("to eat", "breakfast").
 * Two kinds of plural hint are rejected instead: capitalized ones ("(Äpfel)") via the
 * uppercase guard, and lowercase-but-not-a-gloss ones ("(no pl.)", "(usually pl.:
 * Nudeln)") via the keyword guard — both fall through to needsReview rather than
 * masquerade as an English translation.
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

function finalize(e: {
  de: string;
  article: ArticleType | null;
  plural: string | null;
  en: string;
  pos: PartOfSpeechType;
  tags?: string[];
  needsReview: boolean;
  reviewNote?: string;
}): DraftEntry {
  const out: DraftEntry = {
    de: e.de,
    article: e.article,
    plural: e.plural,
    en: e.en,
    pos: e.pos,
    tags: e.tags ?? [],
    core: true,
    needsReview: e.needsReview,
  };
  if (e.reviewNote) out.reviewNote = e.reviewNote;
  return out;
}

function notNull<T>(x: T | null): x is T { return x !== null; }

// ─── Main entry point ─────────────────────────────────────────────────────

/** Parse the full Wortschatz markdown into draft entries + parse warnings. */
export function parseWortschatz(markdown: string, lesson: string): ParseResult {
  const section = extractWortschatzSection(markdown);
  const entries: DraftEntry[] = [];
  const warnings: string[] = [];
  const sectionFound = section !== null;
  if (section === null) return { lesson, entries, warnings, sectionFound };

  const lines = section.split('\n');
  let i = 0;
  // A contiguous table block is in one of these states.
  let tableKind: TableKind = null;
  let textBlock: string[] = [];
  let nonVocabWarned = false;  // warn at most once per (skipped-row) table block

  const flushTextBlock = () => {
    if (textBlock.length === 0) return;
    const joined = textBlock.join(' ');
    for (const tok of joined.split('·')) {
      for (const piece of splitOnConnectors(tok)) {
        const e = parseToken(piece);
        if (e) entries.push(e);
      }
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
      if (tableKind === null) {
        // First row of a fresh table block. Classify the header to decide the
        // table kind; null means we'll skip this table with a warning.
        const headerCells = splitTableRow(t);
        tableKind = classifyTableHeader(headerCells);
        if (tableKind === null) {
          warnings.push(`skipped non-vocab table (first row: ${t.slice(0, 60)})`);
        }
        i++;
        continue;
      }
      // Data row. Only a classified table yields entries; an unrecognised
      // table's rows are dropped (already warned at the header).
      if (tableKind !== null) {
        const rowCells = splitTableRow(t).filter(c => c !== '');
        if (looksLikeNonVocabRow(rowCells)) {
          if (!nonVocabWarned) {
            warnings.push(`skipped non-vocab row(s) (price/currency markers in ${tableKind} table)`);
            nonVocabWarned = true;
          }
          i++;
          continue;
        }
        for (const e of parseTableDataRow(t, tableKind)) {
          entries.push(e);
        }
      }
      i++;
      continue;
    }

    tableKind = null;          // leaving the table; a later table is classified afresh
    nonVocabWarned = false;     // reset for the next table block

    if (isSkippable(line)) {
      flushTextBlock();           // a blank line / skippable line ends a list block
      i++;
      continue;
    }

    textBlock.push(t);
    i++;
  }
  flushTextBlock();

  return { lesson, entries, warnings, sectionFound };
}
