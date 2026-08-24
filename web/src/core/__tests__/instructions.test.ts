import { describe, it, expect } from 'vitest';
import {
  parseInstructions,
  parseInline,
  hasPassage,
  parsePassage,
  splitSentences,
} from '@core/content/instructions';
import type { Block, PassageParagraph } from '@core/content/instructions';

/** Flatten a passage paragraph back to plain strings for easy assertions. */
function lines(block: Block): string[] {
  if (block.kind !== 'passage') throw new Error('not a passage');
  return flatten(block.paragraphs);
}

function flatten(paragraphs: PassageParagraph[]): string[] {
  return paragraphs.flatMap(p => p.map(l => l.map(s => s.text).join('')));
}

describe('parseInline', () => {
  it('marks bold runs', () => {
    expect(parseInline('a **b** c')).toEqual([
      { text: 'a ', bold: false, italic: false },
      { text: 'b', bold: true, italic: false },
      { text: ' c', bold: false, italic: false },
    ]);
  });

  it('marks italic runs', () => {
    expect(parseInline('a *b* c')).toEqual([
      { text: 'a ', bold: false, italic: false },
      { text: 'b', bold: false, italic: true },
      { text: ' c', bold: false, italic: false },
    ]);
  });

  it('leaves a lone asterisk alone (the footnote marker)', () => {
    expect(parseInline('Erwachsene* 4,50 €')).toEqual([
      { text: 'Erwachsene* 4,50 €', bold: false, italic: false },
    ]);
  });

  it('returns a single plain run when there is no markup', () => {
    expect(parseInline('plain')).toEqual([{ text: 'plain', bold: false, italic: false }]);
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

  it('undoes the hard wrapping and re-breaks one thought per line', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Hallo! Ich heiße Yuki Tanaka. Ich komme aus Japan, aus Osaka.',
      'Ich wohne jetzt in München und lerne Deutsch.',
      'Ich spreche Japanisch, Englisch und ein bisschen Deutsch.',
      'Mein Deutschkurs ist super! Die Lehrerin heißt Frau Schmidt.',
    ]);
  });

  it('keeps it all in one paragraph — the breaks are line breaks, not gaps', () => {
    const [passage] = parseInstructions(raw);
    if (passage.kind !== 'passage') throw new Error('expected passage');
    expect(passage.paragraphs).toHaveLength(1);
    expect(passage.paragraphs[0]).toHaveLength(4);
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
      { text: 'Sprachschule Berlin-Mitte — Anmeldeformular', bold: true, italic: false },
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

  it('does not treat a wrapped continuation as a label line', () => {
    // Real shape from A1/12-termine-und-feste C4a: the wrap lands right before
    // "findet am Abend statt:", which looks exactly like a form field.
    const raw = [
      '> ich lade euch herzlich zu meiner Geburtstagsfeier ein! Ich habe am',
      '> Samstag, dem siebzehnten Juni, Geburtstag — ich werde 30! Die Feier',
      '> findet am Abend statt: am achtzehnten Juni, einem Sonntag, um achtzehn',
      '> Uhr. Die Party ist bei mir zu Hause, in der Mozartstraße 4.',
    ].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'ich lade euch herzlich zu meiner Geburtstagsfeier ein!',
      'Ich habe am Samstag, dem siebzehnten Juni, Geburtstag — ich werde 30!',
      'Die Feier findet am Abend statt: am achtzehnten Juni, einem Sonntag, ' +
      'um achtzehn Uhr.',
      'Die Party ist bei mir zu Hause, in der Mozartstraße 4.',
    ]);
  });

  it('does not treat a wrapped date as a numbered list item', () => {
    const raw = ['> Der Kurs beginnt am', '> 5. September und dauert zehn Wochen.'].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Der Kurs beginnt am 5. September und dauert zehn Wochen.',
    ]);
  });

  it('still starts a new line for a label that follows a finished sentence', () => {
    const raw = [
      '> Bitte füllen Sie das Formular aus.',
      '> Vorname: Yuki',
      '> Nachname: Tanaka',
    ].join('\n');
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Bitte füllen Sie das Formular aus.',
      'Vorname: Yuki',
      'Nachname: Tanaka',
    ]);
  });
});

describe('splitSentences', () => {
  it('splits on . ! and ?', () => {
    expect(splitSentences('Ich komme aus Japan. Wo wohnst du? Sag mal!')).toEqual([
      'Ich komme aus Japan.',
      'Wo wohnst du?',
      'Sag mal!',
    ]);
  });

  it('does not split an ordinal date', () => {
    expect(splitSentences('Der Kurs beginnt am 14. März in Berlin.')).toEqual([
      'Der Kurs beginnt am 14. März in Berlin.',
    ]);
  });

  it('does not split a spaced abbreviation', () => {
    expect(splitSentences('Nimm etwas mit, z. B. einen Kuli.')).toEqual([
      'Nimm etwas mit, z. B. einen Kuli.',
    ]);
  });

  it('does not split after a title or a known abbreviation', () => {
    expect(splitSentences('Frag bitte Dr. Schmidt oder Prof. Weber danach.')).toEqual([
      'Frag bitte Dr. Schmidt oder Prof. Weber danach.',
    ]);
    expect(splitSentences('Wir treffen uns ca. 20 Minuten später dort.')).toEqual([
      'Wir treffen uns ca. 20 Minuten später dort.',
    ]);
  });

  it('keeps a closing quote with the sentence it closes', () => {
    expect(splitSentences('Sie sagte: „Das geht schon." Danach ging sie weg.')).toEqual([
      'Sie sagte: „Das geht schon."',
      'Danach ging sie weg.',
    ]);
  });

  it('keeps a trailing parenthetical with the line it annotates', () => {
    expect(splitSentences('9. Ich spreche ein bisschen Deutsch. (language names are capitalized)')).toEqual([
      '9. Ich spreche ein bisschen Deutsch. (language names are capitalized)',
    ]);
  });

  it('does not split mid-sentence on a lowercase continuation', () => {
    expect(splitSentences('Er kommt aus Bonn bzw. aus der Nähe von Bonn.')).toEqual([
      'Er kommt aus Bonn bzw. aus der Nähe von Bonn.',
    ]);
  });

  it('splits a greeting off — folding short lines happens one level up', () => {
    expect(splitSentences('Hallo! Wie geht es dir denn heute so, Anna?')).toEqual([
      'Hallo!',
      'Wie geht es dir denn heute so, Anna?',
    ]);
  });
});

describe('parseInstructions — deliberate line breaks are kept', () => {
  // Real shape from B1/11-arbeitswelt-und-bewerbung C4a (Bewerbungsschreiben).
  const raw = [
    '> **Anna Kowalski**',
    '> Musterstraße 12, 10179 Berlin',
    '> anna.kowalski@email.de',
    '>',
    '> **TechVentures GmbH**',
    '> z. Hd. Frau Weber',
    '> Potsdamer Straße 44',
    '> 10785 Berlin',
    '>',
    '> Sehr geehrte Frau Weber,',
    '>',
    '> hiermit bewerbe ich mich um die ausgeschriebene Stelle als',
    '> Projektkoordinatorin in Ihrem Unternehmen. Ihre Anzeige habe ich mit',
    '> großem Interesse gelesen.',
  ].join('\n');

  it('keeps a letterhead address block one item per line', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage).slice(0, 7)).toEqual([
      'Anna Kowalski',
      'Musterstraße 12, 10179 Berlin',
      'anna.kowalski@email.de',
      'TechVentures GmbH',
      'z. Hd. Frau Weber',
      'Potsdamer Straße 44',
      '10785 Berlin',
    ]);
  });

  it('still un-wraps the letter body below it', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage).slice(-2)).toEqual([
      'hiermit bewerbe ich mich um die ausgeschriebene Stelle als ' +
      'Projektkoordinatorin in Ihrem Unternehmen.',
      'Ihre Anzeige habe ich mit großem Interesse gelesen.',
    ]);
  });
});

describe('parseInstructions — dialogue', () => {
  // Real shape from A1/03-essen-und-trinken C5 (Café-Dialog).
  const raw = [
    '> **Kellnerin:** Guten Tag! Was möchten Sie?',
    '> **Ich:** Ich möchte einen Kaffee, bitte.',
    '> *(später)*',
    '> **Ich:** Wir möchten zahlen, bitte!',
  ].join('\n');

  it('keeps every speaker turn and stage direction on its own line', () => {
    const [passage] = parseInstructions(raw);
    expect(lines(passage)).toEqual([
      'Kellnerin: Guten Tag! Was möchten Sie?',
      'Ich: Ich möchte einen Kaffee, bitte.',
      '(später)',
      'Ich: Wir möchten zahlen, bitte!',
    ]);
  });

  it('does not strand a short greeting alone on a line', () => {
    const [passage] = parseInstructions('> **Anna:** Hallo! Wie heißt du denn?');
    expect(lines(passage)).toEqual(['Anna: Hallo! Wie heißt du denn?']);
  });
});

describe('parsePassage — transcripts and stimuli (no ">" markers)', () => {
  it('breaks a one-line transcript into readable lines', () => {
    // Real shape from A1/01-erste-kontakte H4 (Petras Sprachnachricht).
    const raw =
      'Hallo, hier ist Petra. Ich bin deine neue Kollegin aus dem Deutschkurs. ' +
      'Bitte ruf mich zurück, wenn du Zeit hast. Ich möchte mich gerne mit dir ' +
      'treffen. Wir können zusammen einen Kaffee trinken. Meine Nummer ist ' +
      'vier-sieben-eins-eins. Vielen Dank und bis bald!';
    expect(flatten(parsePassage(raw))).toEqual([
      'Hallo, hier ist Petra. Ich bin deine neue Kollegin aus dem Deutschkurs.',
      'Bitte ruf mich zurück, wenn du Zeit hast.',
      'Ich möchte mich gerne mit dir treffen.',
      'Wir können zusammen einen Kaffee trinken.',
      'Meine Nummer ist vier-sieben-eins-eins. Vielen Dank und bis bald!',
    ]);
  });

  it('keeps a numbered transformation drill one item per line', () => {
    const raw = ['1. Ich gehe ins Kino.', '2. Du liest ein Buch.', '3. Wir fahren nach Köln.'].join('\n');
    expect(flatten(parsePassage(raw))).toEqual([
      '1. Ich gehe ins Kino.',
      '2. Du liest ein Buch.',
      '3. Wir fahren nach Köln.',
    ]);
  });

  it('strips leftover ">" markers — the whole value is already the quote', () => {
    // Real shape from B2/01-nominalstil-und-verbalstil B9 (WhatsApp stimulus).
    const raw = [
      '**WhatsApp-Nachricht von Tomáš:**',
      '> Hey, ich hab einen Brief vom Amt bekommen und versteh ihn nicht.',
      '> Kannst du mir das auf normales Deutsch übersetzen?',
    ].join('\n');
    expect(flatten(parsePassage(raw))).toEqual([
      'WhatsApp-Nachricht von Tomáš:',
      'Hey, ich hab einen Brief vom Amt bekommen und versteh ihn nicht.',
      'Kannst du mir das auf normales Deutsch übersetzen?',
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parsePassage(undefined)).toEqual([]);
    expect(parsePassage('')).toEqual([]);
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
