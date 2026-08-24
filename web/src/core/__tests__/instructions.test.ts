import { describe, it, expect } from 'vitest';
import { parseInstructions, parseInline, hasPassage } from '@core/content/instructions';
import type { Block } from '@core/content/instructions';

/** Flatten a passage paragraph back to plain strings for easy assertions. */
function lines(block: Block): string[] {
  if (block.kind !== 'passage') throw new Error('not a passage');
  return block.paragraphs.flatMap(p => p.map(l => l.map(s => s.text).join('')));
}

describe('parseInline', () => {
  it('marks bold runs', () => {
    expect(parseInline('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });

  it('returns a single plain run when there is no markup', () => {
    expect(parseInline('plain')).toEqual([{ text: 'plain', bold: false }]);
  });
});

describe('parseInstructions — plain instructions', () => {
  it('passes a simple one-liner straight through', () => {
    expect(parseInstructions('Wähle die richtige Antwort (a, b oder c).')).toEqual([
      { kind: 'text', text: 'Wähle die richtige Antwort (a, b oder c).' },
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parseInstructions('')).toEqual([]);
    expect(parseInstructions(undefined)).toEqual([]);
  });
});

describe('parseInstructions — hard-wrapped prose passage', () => {
  // Real shape from A1/01-erste-kontakte C4a (the Yuki Lesetext).
  const raw = [
    '> Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka.',
    '> Ich wohne jetzt in München und lerne Deutsch. Ich spreche',
    '> Japanisch, Englisch und ein bisschen Deutsch. Mein Deutschkurs',
    '> ist super! Die Lehrerin heißt Frau Schmidt.',
    '',
    'Richtig (R) oder falsch (F)?',
  ].join('\n');

  it('unwraps the hard line breaks into one flowing paragraph', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka. ' +
      'Ich wohne jetzt in München und lerne Deutsch. Ich spreche ' +
      'Japanisch, Englisch und ein bisschen Deutsch. Mein Deutschkurs ' +
      'ist super! Die Lehrerin heißt Frau Schmidt.',
    ]);
  });

  it('keeps the trailing instruction as a separate text block', () => {
    const blocks = parseInstructions(raw);
    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toEqual({ kind: 'text', text: 'Richtig (R) oder falsch (F)?' });
  });

  it('never leaks a ">" marker into the output', () => {
    const all = parseInstructions(raw)
      .flatMap(b => (b.kind === 'text' ? [b.text] : lines(b)))
      .join(' ');
    expect(all).not.toContain('>');
  });
});

describe('parseInstructions — paragraph breaks', () => {
  it('splits on a blank quote line', () => {
    const raw = ['> Erster Absatz.', '>', '> Zweiter Absatz.'].join('\n');
    const [passage] = parseInstructions(raw);
    if (passage.kind !== 'passage') throw new Error('expected passage');
    expect(passage.paragraphs).toHaveLength(2);
    expect(lines(passage)).toEqual(['Erster Absatz.', 'Zweiter Absatz.']);
  });
});

describe('parseInstructions — structured lines keep their own line', () => {
  // Real shape from A1/14-pruefungstraining-a1 (Anmeldeformular).
  const raw = [
    '> **Sprachschule Berlin-Mitte — Anmeldeformular**',
    '> Vorname: Yuki',
    '> Nachname: Tanaka',
    '> Geburtsdatum: 14. März 1995',
    '> Kurs: Deutsch A1.2 (Vormittag)',
  ].join('\n');

  it('does not merge form fields into a paragraph', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Sprachschule Berlin-Mitte — Anmeldeformular',
      'Vorname: Yuki',
      'Nachname: Tanaka',
      'Geburtsdatum: 14. März 1995',
      'Kurs: Deutsch A1.2 (Vormittag)',
    ]);
  });

  it('marks the bold heading', () => {
    const [passage] = parseInstructions(raw);
    if (passage.kind !== 'passage') throw new Error('expected passage');
    expect(passage.paragraphs[0][0]).toEqual([
      { text: 'Sprachschule Berlin-Mitte — Anmeldeformular', bold: true },
    ]);
  });

  it('keeps each speaker turn on its own line', () => {
    const raw = ['> Anna: Hallo! Wie heißt du?', '> Bruno: Ich bin Bruno.'].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual(['Anna: Hallo! Wie heißt du?', 'Bruno: Ich bin Bruno.']);
  });

  it('keeps numbered and bulleted items on their own lines', () => {
    const raw = ['> 1. Erste Zeile', '> 2. Zweite Zeile', '> - Ein Punkt'].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual(['1. Erste Zeile', '2. Zweite Zeile', '- Ein Punkt']);
  });
});

describe('parseInstructions — prose containing a colon is not mistaken for a label', () => {
  it('still joins a wrapped sentence whose continuation has a mid-sentence colon', () => {
    const raw = [
      '> Die Hausregeln sind einfach: Man spült das Geschirr sofort nach dem',
      '> Essen, und jeder putzt die Küche einmal pro Woche.',
    ].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Die Hausregeln sind einfach: Man spült das Geschirr sofort nach dem ' +
      'Essen, und jeder putzt die Küche einmal pro Woche.',
    ]);
  });
});

describe('hasPassage', () => {
  it('detects a quoted passage', () => {
    expect(hasPassage('> Ein Text')).toBe(true);
  });
  it('is false for plain instructions', () => {
    expect(hasPassage('Wähle a, b oder c.')).toBe(false);
  });
});
