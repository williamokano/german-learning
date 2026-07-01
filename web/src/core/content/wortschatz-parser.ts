// wortschatz-parser.ts — V3 (F1 issue #337 follow-up, post-B1 rollout).
//
// Parses the heterogeneous "## … Wortschatz" markdown section of a lesson.md into
// draft vocab entries. The Wortschatz markdown comes in many shapes; V3 recognises
// the ones that came up across A1–B1 plus the new B2 patterns:
//
//   TABLES (data row → entries):
//     - 3-gender           | der (m) | die (f) | das (n) |
//     - maskulin-feminin   | Beruf (m) | Beruf (f) | (English?) |   (cell starts with der/die/das)
//     - noun-verb-pair     | Verb | Nomen | (English/Bedeutung?) |  (B2 nominalization pairs;
//                            order varies — checked BEFORE the single-purpose verb/noun kinds)
//     - noun-english       | Noun (article + plural) | English |   (cell starts with der/die/das)
//     - adj-english        | Adjektiv | English | Comparative | Superlative |
//     - verb-english       | Verb | English | Notes |
//     - connector          | Konnektor | Funktion | Beispiel |     (fixed discourse-marker phrases)
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
// V3 plural-code fixes (all found during the B1 rollout — see #337 comments):
//   - Bare "–" (en dash, no suffix) is ambiguous in the wild: some lessons use it
//     for "umlaut, no suffix" (A1: `der Vater, –` → Väter), others for "invariant,
//     no plural at all" (B1: `der Wandel, –`). V3 resolves this via a closed-class
//     lookup of the ~20 German nouns that actually pluralize by pure umlaut
//     (UMLAUT_ONLY_PLURAL_NOUNS) instead of guessing — anything not on the list
//     defaults to "no plural" (the safer, more common case).
//   - Explicit umlaut-spelled codes ("-ä-e", "-ö-e", "-ü-e", "-äu-e") are now
//     recognized as an alternative to the terse "–e" shorthand.
//   - A full second word after the comma ("die Großstadt, die Großstädte") is now
//     recognized as a literal plural instead of being misread as a suffix code.
//
// V3 is also DRAFT: it extracts what it can (de / article / plural / pos) and
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
  | 'noun-verb-pair'
  | 'noun-english'
  | 'adj-english'
  | 'verb-english'
  | 'connector'
  | 'bilingual'
  | 'middot-list'
  | null;

const isNounHeader = (c: string) => /^(noun|nomen)$/.test(c);
const isVerbHeader = (c: string) => /\b(verb|infinitive|verben|infinitiv)\b/.test(c);

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

  // 3. Noun+Verb pair (B2 nominalization drills: "prüfen → die Prüfung"). Column
  //    order varies ("Verb | Nomen" in B2/01, "Nomen | Verb | English" in B2/02) —
  //    checked BEFORE the single-purpose verb-english/noun-english kinds below,
  //    since a header with BOTH cells would otherwise match verb-english first
  //    and silently drop the noun column (or vice versa).
  if (h.some(isNounHeader) && h.some(isVerbHeader)) {
    return 'noun-verb-pair';
  }

  // 4. Verb (header mentions "verb" or "infinitive")
  if (h.some(isVerbHeader)) {
    return 'verb-english';
  }

  // 5. Adjective (header mentions "adjektiv" or "comparative" / "superlative")
  if (h.some(c => /\b(adjektiv|comparative|superlative|komparativ|superlativ)\b/.test(c))) {
    return 'adj-english';
  }

  // 6. Noun (header mentions noun-ish keywords or an "article + plural" pattern).
  //    Sources vary English/German: "Noun (article + plural)", "Nomen (Artikel + Plural)".
  if (h.some(c => isNounHeader(c) || /^(artikel(\s*\+?\s*plural)?|artikel.*plural|lemma|wort)$/.test(c) ||
                   /artikel\s*\+?\s*plural/.test(c) ||
                   /article\s*\+?\s*plural/.test(c))) {
    return 'noun-english';
  }

  // 7. Connector / discourse-marker tables (Konnektor | Funktion | Beispiel).
  if (h.some(c => /\bkonnektor(en)?\b|\bconnector\b/.test(c))) {
    return 'connector';
  }

  // 8. Bilingual 2-column (Deutsch/German | English/Englisch)
  if (h.length === 2 && /^(deutsch|german|wort|german word)/.test(h[0]) && /^(english|englisch)/.test(h[1])) {
    return 'bilingual';
  }

  // 9. Empty header cells → middot-list (data row holds middot-separated tokens)
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
 *  Heuristic, in priority order:
 *   1. A cell starting with "to " — the infinitive-verb-gloss marker never appears in
 *      German, so this beats everything else even if a shorter German cell (Perfekt/
 *      Partizip II form, e.g. "verpasst") is also a candidate. Found by trial across
 *      several B2 lessons: 3-col `Verb | Partizip II | English` tables regularly
 *      picked the (shorter) Partizip II form instead of the real gloss.
 *   2. Otherwise, the shortest remaining cell (typical English glosses are 1–3 words)
 *      that is NOT capitalised (capitalised → likely German) and NOT the lemma column
 *      (col 0). For 2-col tables, col 1 is always English. */
function findEnglishCellIndex(cells: string[]): number {
  if (cells.length === 2) return 1;
  for (let i = 1; i < cells.length; i++) {
    if (/^to\s/i.test(cells[i].trim())) return i;
  }
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

    case 'noun-verb-pair': {
      // 2 or 3 col: [Nomen-or-Verb cell, Nomen-or-Verb cell, optional meaning cell].
      // Column order varies by lesson. Each of the first two cells is independently
      // parsed via parseToken (which auto-detects noun vs. verb from the leading
      // article), producing TWO entries per row instead of the ONE that the old
      // verb-english/noun-english misclassification produced.
      const out: DraftEntry[] = [];
      for (const raw of [cells[0], cells[1]]) {
        if (!raw) continue;
        const e = parseToken(raw);
        if (e) out.push(e);
      }
      // A dedicated 3rd meaning column is authoritative and ALWAYS wins, even over
      // an `en` that parseToken already filled in from one cell's own trailing
      // annotation paren (e.g. "annehmen ⚠️ (sep.)" → parseToken misreads "sep." as
      // a gloss). Both members of a nominalization pair share essentially the same
      // core meaning anyway; a human review pass refines noun vs. "to X" verb phrasing.
      const meaning = cells.length >= 3 ? cells[2]?.trim() : undefined;
      if (meaning) {
        for (const e of out) {
          e.en = meaning;
          e.needsReview = false;
          e.reviewNote = undefined;
        }
      }
      return out;
    }

    case 'connector': {
      // cells: [connector phrase (may be `backtick`-quoted), function/meaning, example?]
      const deRaw = cells[0]?.replace(/`/g, '').trim();
      if (!deRaw) return [];
      const meaning = cells[1]?.trim() ?? '';
      const example = cells.length >= 3 ? cells[2]?.trim() : undefined;
      const isPhrase = /…|\.\.\.|\s/.test(deRaw); // multi-word or ellipsis → phrase, not a single conjunction
      const e = finalize({
        de: deRaw,
        article: null,
        plural: null,
        en: meaning,
        pos: isPhrase ? 'phrase' : 'conjunction',
        tags: ['connector'],
        needsReview: meaning === '',
        reviewNote: meaning === ''
          ? 'fill English gloss'
          : (isPhrase ? undefined : 'connector — confirm pos (conjunction/adverb)'),
      });
      if (example) e.example = example;
      return [e];
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

/** Closed class of German masculine nouns whose plural is PURE UMLAUT with no
 *  suffix (Vater → Väter, Apfel → Äpfel, …). This list is what a bare "–" plural
 *  code (no explicit suffix) should trigger against — everything else with a bare
 *  "–" is invariant / has no plural (e.g. `der Wandel, –`). The two meanings are
 *  visually identical in the source markdown; V1/V2 guessed "always umlaut" and
 *  produced false positives across the whole B1 rollout (Klimawandel→Klimäwandel,
 *  Luftverschmutzung→Lüftverschmutzung, …). The class is small and closed (Duden),
 *  so a lookup is both more accurate AND lets us drop the needsReview flag.
 */
const UMLAUT_ONLY_PLURAL_NOUNS = new Set([
  'acker', 'apfel', 'boden', 'bruder', 'faden', 'garten', 'graben', 'hafen',
  'hammer', 'kasten', 'laden', 'magen', 'mangel', 'mantel', 'mutter', 'nagel',
  'ofen', 'sattel', 'schaden', 'schnabel', 'tochter', 'vater', 'vogel',
]);

/** Pull a German plural out of a code (-n, -e, …) and/or a parenthetical hint. */
function resolvePlural(de: string, code: string | null, paren: string | null): {
  plural: string | null;
  needsReview: boolean;
} {
  // Explicit "no plural" marker
  if ((code && /no pl/i.test(code)) || (paren && /no pl/i.test(paren))) {
    return { plural: null, needsReview: false };
  }
  if (!code) return { plural: null, needsReview: true };

  // Full second word spelled out after the comma ("die Großstadt, die Großstädte",
  // "der Lebenslauf, die Lebensläufe") instead of a suffix code. All German plural
  // nouns take "die" regardless of the singular's gender, so a leading article here
  // is the reliable signal that this is a literal plural, not a suffix.
  const fullWord = code.match(/^(?:der|die|das)\s+(.+)$/i);
  if (fullWord) {
    return { plural: fullWord[1].trim(), needsReview: false };
  }

  // A capitalized parenthetical spells the plural out, e.g. "(Äpfel)", "(usually pl.:
  // Nudeln)" — but only trust it alongside a comma plural-code ("der Saft, –e (Säfte)").
  // Without a code the paren is an English gloss, and a capitalized word inside it
  // ("a town in Bavaria") must not be mistaken for a plural.
  if (paren) {
    const m = paren.match(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+)\s*$/);
    if (m) return { plural: m[1], needsReview: false };
  }

  // Explicit umlaut-spelled code: "-ä-e", "-ö-e", "-ü-e", "-äu-e", "-ä-er", etc.
  // Some lessons spell the umlaut out instead of using the terse "–e" shorthand.
  // IMPORTANT: the spelled-out vowel is NOT a reliable literal target — real lesson
  // data shows the same "-ä-e" code used for a→ä (Rückgang→Rückgänge), o→ö
  // (Ausstoß→Ausstöße, Mindestlohn→Mindestlöhne), AND au→äu (Verbrauch→Verbräuche)
  // plurals alike. Authors write "-ä-e" as a generic "there's an umlaut, plus -e"
  // marker, not a precise vowel spec. So this is treated exactly like the bare
  // "–" + suffix case: delegate to the same best-effort guesser.
  const explicit = code.match(/^-(?:ä|ö|ü|äu)-([a-zäöüß]*)$/);
  if (explicit) {
    const suffix = explicit[1];
    const stemEndsWeak = /(el|er|en|e)$/i.test(de);
    if (stemEndsWeak) return { plural: bestEffortUmlautOnly(de), needsReview: true };
    return { plural: bestEffortUmlautSuffix(de, suffix), needsReview: true };
  }

  // Suffix codes: "-n", "-e", "-er", "-s", "-nen", "-" (unchanged), "–" (umlaut only)
  const m = code.match(/^[-–]([a-zäöü]*)$/);
  if (m) {
    const suffix = m[1];
    const umlaut = code.startsWith('–');
    if (umlaut) {
      if (suffix === '') {
        // Bare "–" with no suffix is ambiguous: pure-umlaut plural (closed class,
        // see UMLAUT_ONLY_PLURAL_NOUNS) vs. invariant / no plural at all (every
        // other noun). Resolve via lookup instead of guessing.
        if (UMLAUT_ONLY_PLURAL_NOUNS.has(de.toLowerCase())) {
          return { plural: bestEffortUmlautOnly(de), needsReview: false };
        }
        return { plural: null, needsReview: false };
      }
      // Stems ending in a "weak" syllable (e/el/er/en) typically DON'T add the
      // plural suffix on top — the suffix is already part of the stem (`Apfel`
      // already ends in `-el`; plural `Äpfel` adds no letter). Detect this and
      // skip the suffix.
      const stemEndsWeak = /(el|er|en|e)$/i.test(de);
      if (stemEndsWeak) {
        return { plural: bestEffortUmlautOnly(de), needsReview: true };
      }
      return { plural: bestEffortUmlautSuffix(de, suffix), needsReview: true };
    }
    return { plural: de + suffix, needsReview: false };
  }
  return { plural: null, needsReview: true };
}

/** Umlaut the LAST vowel cluster of `de` (a → ä, o → ö, u → ü, au → äu), then append
 *  `suffix`. This is the common German plural pattern (`Apfel → Äpfel`, `Vater →
 *  Väter`, `Bauer → Bauern`). Scanning for the LAST occurrence (not the first)
 *  matters for compound nouns: German umlaut plurals affect the head noun's stem
 *  vowel, which sits at the end of the compound, not a modifier prefix earlier in
 *  the word (`CO₂-Ausstoß → CO₂-Ausstöße`, not `CO₂-Äusstoße` — the relevant vowel
 *  is the 'o' in "-stoß", not the 'Au' in "Aus-"). For simple non-compound nouns
 *  (Vater, Apfel, Saft, Ofen) there's only one candidate vowel, so first == last
 *  and this scan is unaffected by the change.
 *  Note: not every a/o/u-stem umlauts (e.g. `Bauer → Bauern`, no umlaut) — we still
 *  emit a guess and let `needsReview` flag it for human confirmation. */
function bestEffortUmlautSuffix(de: string, suffix: string): string {
  let last: RegExpExecArray | null = null;
  const re = /au|[aou]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(de)) !== null) last = m;
  if (!last) return de + suffix;

  const idx = last.index;
  const matched = last[0];
  const isUpper = /^[A-Z]/.test(matched);
  const umlaut = matched.length === 2
    ? (isUpper ? 'Äu' : 'äu')
    : (isUpper
        ? ({ A: 'Ä', O: 'Ö', U: 'Ü' } as Record<string, string>)[matched.toUpperCase()]!
        : ({ a: 'ä', o: 'ö', u: 'ü' } as Record<string, string>)[matched]!);
  return de.slice(0, idx) + umlaut + de.slice(idx + matched.length) + suffix;
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
