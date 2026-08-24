/**
 * instructions.ts — parse an exercise's `instructions` / `instructionsEn`
 * string into renderable blocks.
 *
 * Exercise instructions frequently embed a reading passage (Lesetext,
 * Formular, Anzeige, Forumspost …) using markdown blockquote syntax:
 *
 *     instructions: |
 *       > Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka.
 *       > Ich wohne jetzt in München und lerne Deutsch. Ich spreche
 *       > Japanisch, Englisch und ein bisschen Deutsch.
 *       >
 *       > Und du? Wer bist du?
 *
 *       Richtig (R) oder falsch (F)?
 *
 * Rendering that raw put the literal ">" markers on screen and collapsed the
 * newlines, so passages appeared as one run-on line with ">" scattered
 * mid-sentence. This module turns it into structured blocks instead.
 *
 * Two line shapes have to be told apart inside a passage, because the source
 * uses hard wrapping for YAML readability:
 *
 *   - prose continuation — a wrapped sentence; must be JOINED with the
 *     previous line so it reads as flowing text.
 *   - structured line — a form field ("Vorname: Yuki"), a bold heading, a
 *     numbered/bulleted item, or a speaker turn ("Anna: Hallo!"); must KEEP
 *     its own line, otherwise a form or dialogue collapses into a paragraph.
 *
 * Once the wrapping is undone, the text is re-broken one thought per line:
 * a paragraph of unbroken prose is hard to work through in a language the
 * reader is still learning, and a sentence is the natural unit of one piece
 * of information. Paragraph breaks in the source are preserved as such.
 */

export type Inline = { text: string; bold: boolean; italic: boolean };

/** One rendered line of a passage (already un-wrapped). */
export type PassageLine = Inline[];

/** A paragraph: consecutive lines, separated from the next by a blank line. */
export type PassageParagraph = PassageLine[];

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'passage'; paragraphs: PassageParagraph[] };

/** Whole-line bold heading: **Sprachschule Berlin-Mitte — Anmeldeformular** */
const BOLD_HEADING = /^\*\*.+\*\*[.!?]?$/;

/** Bulleted item: "- …", "• …". A bullet never starts a wrapped sentence. */
const BULLET_ITEM = /^[-–—*•]\s+\S/;

/**
 * Show a bullet as a bullet. The source marker is markdown ("- Kaffee 2,80 €")
 * and would otherwise reach the screen as a literal hyphen, since a passage
 * renders as lines of text rather than as a list.
 */
function normaliseBullet(line: string): string {
  return BULLET_ITEM.test(line) ? line.replace(/^[-–—*•]\s+/, '• ') : line;
}

/** Numbered item: "1. …", "2) …" — ambiguous with a wrapped "5. September". */
const NUMBERED_ITEM = /^\d+[.)]\s+\S/;

/**
 * Label/speaker line: a short leading label followed by a colon, e.g.
 * "Vorname: Yuki", "Kursbeginn: 5. September", "Anna: Hallo!".
 *
 * Deliberately narrow so ordinary prose that happens to contain a colon
 * ("Die Hausregeln sind einfach: Man spült …") is NOT treated as structured —
 * the label must be short, start the line, and contain no sentence-ending
 * punctuation before the colon.
 */
const LABEL_LINE = /^\*{0,2}[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß.\-/ ]{0,24}(?:\*{0,2}:|:\*{0,2})\s+\S/;

/**
 * A short whole line of emphasis — a stage direction in a dialogue:
 * "*(später)*", "(Pause)". Complete on its own line, like a heading. The
 * length cap keeps a whole italicised paragraph from matching.
 */
const ASIDE_LINE = /^(?:\*[^*]{1,40}\*|\([^)]{1,40}\))$/;

type Entry = { text: string; structured: boolean; heading: boolean; lastLen: number };

/**
 * How far short of the wrap width a line may stop and still count as wrapped.
 * Hand-wrapped YAML has a ragged edge — a long German compound easily pushes a
 * break well before the margin — so the shortfall has to be unmistakable.
 */
const WRAP_SLACK = 15;

/** Below this the passage is not hard-wrapped prose at all, so the rule is off. */
const MIN_WRAP_WIDTH = 40;

/**
 * True when the break after a line was put there on purpose rather than by
 * hard wrapping. Wrapped lines run close to the passage's wrap width, so a
 * line that stops well short of it ended deliberately — an address block, a
 * signature, a menu row — and what follows keeps its own line.
 */
function isDeliberateBreak(prevLen: number, wrapWidth: number): boolean {
  if (wrapWidth < MIN_WRAP_WIDTH) return false;
  return prevLen < wrapWidth - WRAP_SLACK;
}

/**
 * True when the previous line finished a thought — so the next line starts
 * something new rather than continuing a hard-wrapped sentence.
 */
function endsThought(text: string): boolean {
  return /[.!?:…][)"”»›\]]?$/.test(text);
}

/**
 * Decide whether a line stands on its own.
 *
 * Bold headings and bullets are unambiguous — a wrapped sentence never
 * continues with one. Numbered items and label lines are NOT: mid-paragraph,
 * "5. September 2026" and "findet am Abend statt: am achtzehnten Juni" are
 * ordinary continuations of the line above. Those two shapes therefore only
 * count as structured when the previous line actually ended a thought (or was
 * itself structured, as in a run of form fields).
 */
function isStructuredLine(line: string, prev: Entry | undefined): boolean {
  if (BOLD_HEADING.test(line) || BULLET_ITEM.test(line) || ASIDE_LINE.test(line)) return true;
  if (!NUMBERED_ITEM.test(line) && !LABEL_LINE.test(line)) return false;
  return prev === undefined || prev.structured || endsThought(prev.text);
}

/**
 * Split "a **b** and *c*" into inline runs, marking the bold and italic ones.
 * A lone asterisk (the footnote marker in "Erwachsene* 4,50 €") matches
 * nothing and stays as written.
 */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ text: text.slice(last, m.index), bold: false, italic: false });
    }
    const bold = m[1] !== undefined;
    out.push({ text: bold ? m[1] : m[2], bold, italic: !bold });
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push({ text: text.slice(last), bold: false, italic: false });
  }
  return out.length > 0 ? out : [{ text, bold: false, italic: false }];
}

/**
 * German abbreviations that end in a period but do not end a sentence.
 * Checked case-sensitively against the token immediately before the period.
 */
const ABBREVIATIONS = new Set([
  'bzw', 'ca', 'evtl', 'ggf', 'inkl', 'exkl', 'max', 'min', 'Mio', 'Mrd',
  'Nr', 'Str', 'usw', 'vgl', 'zzgl', 'Abs', 'Art', 'Bd', 'bes', 'geb',
  'Dr', 'Prof', 'Hr', 'Fr', 'Frl', 'St', 'Jh', 'Jhd', 'Tel', 'Univ',
  'engl', 'dt', 'frz', 'span', 'ital', 'österr', 'schweiz',
]);

/**
 * Split prose into sentences, one per rendered line.
 *
 * A wall of text is hard to read in a learning context — each sentence
 * generally carries one piece of information, so giving it its own line is
 * the natural unit. German makes the naive "split on . ! ?" rule unsafe:
 *   - ordinals and dates: "am 14. März", "5. September 2026"
 *   - spaced abbreviations: "z. B.", "d. h.", "u. a."
 *   - titles and units: "Dr. Schmidt", "Nr. 7", "ca. 20"
 * so a terminator only ends a sentence when the token before it is not a
 * number, a single letter, or a known abbreviation.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    // Absorb any run of terminators plus a closing quote/bracket.
    let end = i;
    while (end + 1 < text.length && '.!?'.includes(text[end + 1])) end++;
    while (end + 1 < text.length && '"”»›)]'.includes(text[end + 1])) end++;

    const after = text.slice(end + 1);
    // A sentence ends only when whitespace then an opening character follows.
    const m = after.match(/^\s+(.)/);
    if (!m) continue;
    // "(" is deliberately not here: a trailing parenthetical hint
    // ("… Deutsch. (language names are capitalized)") belongs to the line it
    // annotates, and German sentences do not open with a bracket.
    if (!/[A-ZÄÖÜ„“«‹"\d]/.test(m[1])) continue;

    if (ch === '.') {
      const before = text.slice(start, i);
      const token = before.match(/([\wÄÖÜäöüß]+)$/)?.[1] ?? '';
      // "14." (ordinal/number), "z." (single letter), "Dr." (abbreviation)
      if (/^\d+$/.test(token)) continue;
      if (token.length === 1) continue;
      if (ABBREVIATIONS.has(token)) continue;
    }

    out.push(text.slice(start, end + 1).trim());
    start = end + 1;
  }

  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out.length > 0 ? out : [text.trim()];
}

/**
 * A greeting or a two-word question ("Hallo!", "Und du?") is not an
 * information unit of its own — stranded on its own line it just adds noise.
 * Fold anything shorter than this into its neighbour.
 */
const MIN_LINE = 32;

function coalesceShort(sentences: string[]): string[] {
  const out: string[] = [];
  for (const s of sentences) {
    const prev = out[out.length - 1];
    if (prev !== undefined && prev.length < MIN_LINE) out[out.length - 1] = prev + ' ' + s;
    else out.push(s);
  }
  // A short trailing sentence has no following line to join, so it joins back.
  if (out.length > 1 && out[out.length - 1].length < MIN_LINE) {
    const last = out.pop() as string;
    out[out.length - 1] += ' ' + last;
  }
  return out;
}

/**
 * Turn the raw blockquote body (">" already stripped) into paragraphs whose
 * hard wrapping has been undone.
 */
function buildParagraphs(lines: string[]): PassageParagraph[] {
  const paragraphs: PassageParagraph[] = [];
  let current: Entry[] = [];

  // The width this passage was wrapped to, as its longest line shows.
  const wrapWidth = Math.max(0, ...lines.map(l => l.trim().length));

  const flush = () => {
    if (current.length === 0) return;
    // One thought per line. This applies to form fields and speaker turns too:
    // a turn long enough to hold several sentences reads better broken up, and
    // coalesceShort keeps a short opener attached ("Anna: Hallo! Wie heißt
    // du?" stays on one line rather than splitting after the greeting).
    const rendered = current.flatMap(e => coalesceShort(splitSentences(e.text)));
    paragraphs.push(rendered.map(parseInline));
    current = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flush();
      continue;
    }
    // The first line of a paragraph, a structured line, a line after a
    // heading or aside (those are complete on their own line), and a line
    // after a deliberate break all start a new display line. Everything else
    // is a wrapped continuation of the line above.
    const prev = current[current.length - 1];
    const structured = isStructuredLine(line, prev);
    const deliberate = prev !== undefined && isDeliberateBreak(prev.lastLen, wrapWidth);
    if (prev === undefined || structured || prev.heading || deliberate) {
      current.push({
        text: normaliseBullet(line),
        structured,
        heading: BOLD_HEADING.test(line) || ASIDE_LINE.test(line),
        lastLen: line.length,
      });
    } else {
      prev.text += ' ' + line;
      prev.lastLen = line.length;
    }
  }
  flush();
  return paragraphs;
}

/** Collapse a run of plain instruction lines into paragraph text. */
function buildText(lines: string[]): Block[] {
  const chunks: string[] = [];
  let current: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      if (current.length > 0) { chunks.push(current.join(' ')); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks.map(text => ({ kind: 'text', text }) as Block);
}

/**
 * Parse instructions into blocks. Plain single-line instructions (the common
 * case by far) come back as a single text block, unchanged.
 */
export function parseInstructions(raw: string | undefined | null): Block[] {
  if (!raw) return [];

  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let inQuote = false;

  const flush = () => {
    if (buffer.length === 0) return;
    if (inQuote) {
      const paragraphs = buildParagraphs(buffer);
      if (paragraphs.length > 0) blocks.push({ kind: 'passage', paragraphs });
    } else {
      blocks.push(...buildText(buffer));
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isQuote = trimmed === '>' || trimmed.startsWith('> ');
    if (isQuote !== inQuote) {
      flush();
      inQuote = isQuote;
    }
    buffer.push(isQuote ? trimmed.replace(/^>\s?/, '') : line);
  }
  flush();

  return blocks;
}

/** True when the instructions embed a reading passage. */
export function hasPassage(raw: string | undefined | null): boolean {
  return parseInstructions(raw).some(b => b.kind === 'passage');
}

/**
 * Parse a standalone passage body — a transcript, a writing stimulus, a model
 * answer. The whole value is already the quoted material, so any "> " markers
 * it carries are just leftover markdown and are stripped. Otherwise the same
 * rules as an embedded passage: existing line breaks are honoured for
 * structured lines, wrapped prose is un-wrapped, and long prose is broken one
 * thought per line.
 */
export function parsePassage(raw: string | undefined | null): PassageParagraph[] {
  if (!raw) return [];
  return buildParagraphs(raw.split('\n').map(l => l.trim().replace(/^>\s?/, '')));
}
