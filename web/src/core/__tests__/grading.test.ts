import { describe, it, expect } from 'vitest';
import { normalize, checkText, checkBank, checkOrderText } from '@core/engine/grading';

describe('normalize', () => {
  it('lowercases by default', () => {
    expect(normalize('Hallo')).toBe('hallo');
  });
  it('folds umlaut by default', () => {
    expect(normalize('heiße')).toBe('heisse');
    expect(normalize('sprichst')).toBe('sprichst');
    expect(normalize('Österreich')).toBe('oesterreich');
  });
  it('strips trailing punctuation by default', () => {
    expect(normalize('Hallo!')).toBe('hallo');
    expect(normalize('Woher kommst du?')).toBe('woher kommst du');
  });
  it('trims and collapses internal whitespace', () => {
    expect(normalize('  ich  bin  ')).toBe('ich bin');
  });
  it('preserves punctuation with keepPunctuation flag', () => {
    expect(normalize('Guten Morgen!', { keepPunctuation: true })).toBe('guten morgen!');
  });
  it('preserves case with caseSensitive flag', () => {
    expect(normalize('Deutsch', { caseSensitive: true })).toBe('Deutsch');
    expect(normalize('Berlin', { caseSensitive: true })).toBe('Berlin');
  });
  it('preserves umlauts with strictUmlaut flag (learner must type exact umlaut)', () => {
    // strictUmlaut: true → skip folding → ß and umlauts remain
    expect(normalize('heiße', { strictUmlaut: true })).toBe('heiße');
    expect(normalize('Österreich', { strictUmlaut: true })).toBe('österreich'); // still lowercased
  });
});

describe('checkText', () => {
  it('accepts exact match (A1/01 C1 gap 1)', () => {
    expect(checkText('heiße', 'heiße')).toBe(true);
  });
  it('accepts umlaut-folded match (heisse = heiße)', () => {
    expect(checkText('heiße', 'heisse')).toBe(true);
  });
  it('accepts case-insensitive match', () => {
    expect(checkText('heiße', 'HEISSE')).toBe(true);
    expect(checkText('komme', 'Komme')).toBe(true);
  });
  it('accepts any alternative in an answer array (C1 gap 8)', () => {
    expect(checkText(['heißt', 'ist'], 'heißt')).toBe(true);
    expect(checkText(['heißt', 'ist'], 'ist')).toBe(true);
    expect(checkText(['heißt', 'ist'], 'heisst')).toBe(true); // umlaut fold
  });
  it('rejects wrong answer', () => {
    expect(checkText('heiße', 'bin')).toBe(false);
    expect(checkText('komme', 'kommst')).toBe(false);
  });
  it('rejects empty string', () => {
    expect(checkText('heiße', '')).toBe(false);
  });
  it('accepts with trimmed whitespace', () => {
    expect(checkText('heiße', '  heiße  ')).toBe(true);
  });
});

describe('checkBank', () => {
  it('matches exact token (H3 gap 1)', () => {
    expect(checkBank('heiße', 'heiße')).toBe(true);
    expect(checkBank('komme', 'komme')).toBe(true);
  });
  it('rejects null (empty slot)', () => {
    expect(checkBank('heiße', null)).toBe(false);
  });
  it('rejects wrong token', () => {
    expect(checkBank('heiße', 'komme')).toBe(false);
    expect(checkBank('lerne', 'spreche')).toBe(false);
  });
  it('is case-sensitive (bank tokens must match exactly)', () => {
    expect(checkBank('BIN', 'bin')).toBe(false);
    expect(checkBank('BIN', 'BIN')).toBe(true);
  });
});

const T = ['a', 'b', 'c', 'd'];

describe('checkOrderText', () => {
  it('matches the correct order', () => {
    expect(checkOrderText(T, [0, 1, 2], [0, 1, 2])).toBe(true);
  });
  it('rejects wrong order', () => {
    expect(checkOrderText(T, [0, 1, 2], [1, 0, 2])).toBe(false);
  });
  it('accepts alternative orderings', () => {
    // B5 item 3: Ich wohne jetzt in Berlin. / Jetzt wohne ich in Berlin.
    expect(checkOrderText(T, [0, 1, 2, 3], [2, 0, 1, 3], [[2, 0, 1, 3]])).toBe(true);
    expect(checkOrderText(T, [0, 1, 2], [2, 1, 0], [[2, 1, 0]])).toBe(true);
  });
  it('rejects when neither main nor alt matches', () => {
    expect(checkOrderText(T, [0, 1, 2], [1, 2, 0], [[2, 1, 0]])).toBe(false);
  });
  it('treats duplicate tiles as interchangeable (A2/02 B4 #6, #469)', () => {
    const tiles = ['Sie', 'legt', 'den', 'Teppich', 'unter', 'den', 'Tisch'];
    // the learner picked the second "den" first — same sentence
    expect(checkOrderText(tiles, [0, 1, 2, 3, 4, 5, 6], [0, 1, 5, 3, 4, 2, 6])).toBe(true);
  });
  it('rejects an incomplete strip', () => {
    expect(checkOrderText(T, [0, 1, 2], [0, 1])).toBe(false);
  });
});

describe('#469 — answers learners can actually type', () => {
  it('accepts blank, -, – and — for a "no article" key', () => {
    for (const given of ['', '-', '–', '—', '  ']) expect(checkText('—', given)).toBe(true);
    expect(checkText('—', 'kein')).toBe(false);
  });
  it('accepts any dash for a Gedankenstrich key, but keeps hyphens inside words', () => {
    expect(checkText('—', '–')).toBe(true);
    expect(checkText('E-Mail', 'E-Mail')).toBe(true);
    expect(checkText('E-Mail', 'E — Mail')).toBe(false);
  });
  it('unifies smart apostrophes', () => {
    expect(checkText("Hans'", 'Hans’')).toBe(true);
  });
  it('NFC-normalizes decomposed umlauts', () => {
    expect(checkText('Mädchen', 'Ma\u0308dchen')).toBe(true);
  });
  it('ignores ellipses', () => {
    expect(checkText('Wegen der gestiegenen Kosten …', 'Wegen der gestiegenen Kosten')).toBe(true);
  });
  it('gap-bank accepts every listed answer', () => {
    expect(checkBank(['BRAUCHE', 'ESSE'], 'ESSE')).toBe(true);
    expect(checkBank(['BRAUCHE', 'ESSE'], 'KAUFE')).toBe(false);
  });
});
