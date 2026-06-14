import { describe, it, expect } from 'vitest';
import { normalize, checkText, checkBank, checkOrder } from '@core/engine/grading';

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

describe('checkOrder', () => {
  it('matches the correct order', () => {
    expect(checkOrder([0, 1, 2], [0, 1, 2])).toBe(true);
  });
  it('rejects wrong order', () => {
    expect(checkOrder([0, 1, 2], [1, 0, 2])).toBe(false);
  });
  it('accepts alternative orderings', () => {
    // B5 item 3: Ich wohne jetzt in Berlin. / Jetzt wohne ich in Berlin.
    expect(checkOrder([0, 1, 2, 3], [2, 0, 1, 3], [[2, 0, 1, 3]])).toBe(true);
    expect(checkOrder([0, 1, 2], [2, 1, 0], [[2, 1, 0]])).toBe(true);
  });
  it('rejects when neither main nor alt matches', () => {
    expect(checkOrder([0, 1, 2], [1, 2, 0], [[2, 1, 0]])).toBe(false);
  });
});
