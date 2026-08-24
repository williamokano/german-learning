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
 */

export type Inline = { text: string; bold: boolean };

/** One rendered line of a passage (already un-wrapped). */
export type PassageLine = Inline[];

/** A paragraph: consecutive lines, separated from the next by a blank line. */
export type PassageParagraph = PassageLine[];

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'passage'; paragraphs: PassageParagraph[] };

/** Whole-line bold heading: **Sprachschule Berlin-Mitte — Anmeldeformular** */
const BOLD_HEADING = /^\*\*.+\*\*[.!?]?$/;

/** Numbered or bulleted item: "1. …", "2) …", "- …", "• …" */
const LIST_ITEM = /^(?:\d+[.)]|[-–—*•])\s+\S/;

/**
 * Label/speaker line: a short leading label followed by a colon, e.g.
 * "Vorname: Yuki", "Kursbeginn: 5. September", "Anna: Hallo!".
 *
 * Deliberately narrow so ordinary prose that happens to contain a colon
 * ("Die Hausregeln sind einfach: Man spült …") is NOT treated as structured —
 * the label must be short, start the line, and contain no sentence-ending
 * punctuation before the colon.
 */
const LABEL_LINE = /^\*{0,2}[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß.\-/ ]{0,24}\*{0,2}:\s+\S/;

function isStructuredLine(line: string): boolean {
  return BOLD_HEADING.test(line) || LIST_ITEM.test(line) || LABEL_LINE.test(line);
}

/** Split "a **b** c" into inline runs, marking the bold ones. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out.length > 0 ? out : [{ text, bold: false }];
}

/**
 * Turn the raw blockquote body (">" already stripped) into paragraphs whose
 * hard wrapping has been undone.
 */
function buildParagraphs(lines: string[]): PassageParagraph[] {
  const paragraphs: PassageParagraph[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      paragraphs.push(current.map(parseInline));
      current = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flush();
      continue;
    }
    // A structured line always starts a new display line. So does the first
    // line of a paragraph. Everything else is a wrapped continuation.
    if (current.length === 0 || isStructuredLine(line)) {
      current.push(line);
    } else {
      current[current.length - 1] += ' ' + line;
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
