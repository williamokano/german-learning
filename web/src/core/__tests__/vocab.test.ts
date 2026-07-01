import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { VocabSet, CommittedVocabSet, unlockedVocab, lessonRank } from '@core/content/vocab';
import type { VocabSetType } from '@core/content/vocab';
import { parseWortschatz, parseToken } from '@core/content/wortschatz-parser';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

// ── schema ──────────────────────────────────────────────────────────────────
describe('VocabSet schema', () => {
  it('accepts a valid set and applies defaults', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [{ de: 'Apfel', article: 'der', en: 'apple', pos: 'noun' }],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const e = r.data.entries[0];
      expect(e.plural).toBeNull();
      expect(e.tags).toEqual([]);
      expect(e.core).toBe(true);
      expect(e.needsReview).toBe(false);
    }
  });

  it('rejects an invalid article', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [{ de: 'Apfel', article: 'das/der', en: 'apple', pos: 'noun' }],
    });
    expect(r.success).toBe(false);
  });

  it('accepts a noun without an article (countries, languages, proper nouns)', () => {
    // German nouns often omit the article: country names (Deutschland, Brasilien),
    // language names (Deutsch, Englisch), proper names (Anna), and mass nouns.
    const r = VocabSet.safeParse({
      lesson: 'A1/01',
      entries: [
        { de: 'Deutschland', en: 'Germany', pos: 'noun' },
        { de: 'Deutsch',     en: 'German (language)', pos: 'noun' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects a non-noun carrying an article', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [{ de: 'essen', article: 'der', en: 'to eat', pos: 'verb' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a duplicate lemma+pos (case-insensitive)', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [
        { de: 'Bank', article: 'die', en: 'bench', pos: 'noun' },
        { de: 'bank', article: 'die', en: 'bank', pos: 'noun' },
      ],
    });
    expect(r.success).toBe(false);
  });

  it('accepts gender homographs (der See / die See)', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [
        { de: 'See', article: 'der', en: 'lake', pos: 'noun' },
        { de: 'See', article: 'die', en: 'sea', pos: 'noun' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('accepts a noun/verb homograph (das Essen / essen)', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [
        { de: 'Essen', article: 'das', en: 'food', pos: 'noun' },
        { de: 'essen', en: 'to eat', pos: 'verb' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it.each(['A1/3', 'C2/01', 'a1/03', 'A1-03'])('rejects malformed lesson id %s', (lesson) => {
    const r = VocabSet.safeParse({ lesson, entries: [] });
    expect(r.success).toBe(false);
  });
});

// ── parser ──────────────────────────────────────────────────────────────────
const FIXTURE = `
## 4. Wortschatz

### Lebensmittel

> 💡 **Lerntipp:** every noun comes with its article.

| der (m) | die (f) | das (n) |
|---|---|---|
| der Apfel, – (Äpfel) | die Banane, -n | das Brot, -e |
| das Salz / der Zucker | die Milch (no pl.) | das Ei, -er |

### Getränke

das Frühstück (breakfast) · der Kaffee

### Verben

**essen** (to eat) ⚠️ · **trinken** (to drink)

---

## 5. Next section
`;

describe('parseWortschatz', () => {
  const set = parseWortschatz(FIXTURE, 'A1/03');
  const by = (de: string) => set.entries.find(e => e.de === de);

  it('parses the gender table into nouns with article + plural', () => {
    expect(by('Apfel')).toMatchObject({ article: 'der', plural: 'Äpfel', pos: 'noun' });
    expect(by('Banane')).toMatchObject({ article: 'die', plural: 'Bananen', pos: 'noun' });
    expect(by('Ei')).toMatchObject({ article: 'das', plural: 'Eier', pos: 'noun' });
    expect(by('Milch')).toMatchObject({ article: 'die', plural: null, pos: 'noun' });
  });

  it('splits "das Salz / der Zucker" into two entries', () => {
    expect(by('Salz')).toMatchObject({ article: 'das', pos: 'noun' });
    expect(by('Zucker')).toMatchObject({ article: 'der', pos: 'noun' });
  });

  it('flags table nouns (no English) as needsReview with empty gloss', () => {
    expect(by('Apfel')!.en).toBe('');
    expect(by('Apfel')!.needsReview).toBe(true);
  });

  it('parses bold verbs with their gloss and does not flag them', () => {
    expect(by('essen')).toMatchObject({ pos: 'verb', article: null, en: 'to eat', needsReview: false });
    expect(by('trinken')).toMatchObject({ pos: 'verb', en: 'to drink', needsReview: false });
  });

  it('takes a lowercase parenthetical as an English gloss', () => {
    expect(by('Frühstück')).toMatchObject({ pos: 'noun', article: 'das', en: 'breakfast' });
  });

  it('drops the horizontal rule rather than emitting a junk entry', () => {
    expect(set.entries.some(e => /^[-–]+$/.test(e.de))).toBe(false);
  });
});

// ── parseToken: plural expansion + pos routing ────────────────────────────────
describe('parseToken plural expansion', () => {
  it.each([
    ['die Tomate, -n', 'Tomaten'],
    ['das Brot, -e', 'Brote'],
    ['das Auto, -s', 'Autos'],
    ['die Lehrerin, -nen', 'Lehrerinnen'],
    ['der Apfel, – (Äpfel)', 'Äpfel'],   // umlaut code + paren → use the paren
    ['der Käse (no pl.)', null],          // explicit no-plural
  ])('%s → plural %s', (input, plural) => {
    expect(parseToken(input)).toMatchObject({ plural });
  });

  it('does a best-effort umlaut of the first vowel for a suffix code', () => {
    // V2 umlauts the FIRST vowel cluster (Sa-a-ft → Sä-fte) and flags needsReview so a
    // human confirms. Still flags the plural — even though the result is correct, the
    // parser has no way to know for sure without the paren hint.
    expect(parseToken('der Saft, –e')).toMatchObject({ plural: 'Säfte', needsReview: true });
    expect(parseToken('der Apfel, –e')).toMatchObject({ plural: 'Äpfel', needsReview: true });
    expect(parseToken('der Vater, –e')).toMatchObject({ plural: 'Väter', needsReview: true });
    expect(parseToken('der Ofen, –e')).toMatchObject({ plural: 'Öfen', needsReview: true });
  });

  it('does a best-effort umlaut-only plural (no suffix)', () => {
    // V2 umlauts the first vowel, no suffix added. Still flagged for review.
    expect(parseToken('der Apfel, –')).toMatchObject({ plural: 'Äpfel', needsReview: true });
    expect(parseToken('der Bauer, –')).toMatchObject({ plural: 'Bäuer', needsReview: true });
  });

  it('disambiguates a plural hint from an English gloss', () => {
    expect(parseToken('die Nudel, -n (usually pl.: Nudeln)')).toMatchObject({ plural: 'Nudeln', en: '' });
  });

  it('does not mistake a capitalized word in a gloss for a plural', () => {
    // No comma plural-code → the paren is a gloss, "Bayern" must not become the plural.
    expect(parseToken('die Stadt (a town in Bayern)')).toMatchObject({ plural: null, en: 'a town in Bayern' });
  });
});

describe('parseToken pos routing', () => {
  it('routes a quantity phrase to pos:phrase', () => {
    expect(parseToken('ein Kilo Äpfel')).toMatchObject({ pos: 'phrase', article: null, needsReview: true });
  });

  it('routes a bare capitalized word to a noun missing its article', () => {
    expect(parseToken('Frühstück')).toMatchObject({ pos: 'noun', article: null, needsReview: true });
  });

  it('routes a bare lowercase word to pos:adjective (the common A1/A2 case)', () => {
    // V2: bare lowercase single words are almost always predicative adjectives used
    // after `sein`. V1 routed these to `pos: other`, which left reviewers re-tagging
    // most adjectives by hand.
    // Without a gloss → needsReview (the gloss is the missing piece).
    expect(parseToken('schnell')).toMatchObject({ pos: 'adjective', tags: ['adjective'], needsReview: true });
    // With a gloss in parens → ready for human review of the pos tag, gloss itself present.
    expect(parseToken('groß (big)')).toMatchObject({ pos: 'adjective', en: 'big', needsReview: false });
  });

  it('handles reflexive "sich <verb>" with a reflexive tag', () => {
    const e = parseToken('sich anmelden');
    expect(e).toMatchObject({ de: 'anmelden', pos: 'verb', tags: ['verb', 'reflexive'] });
  });

  it('strips pipe separators in separable verbs and tags them separable', () => {
    const e = parseToken('ein|steigen');
    expect(e).toMatchObject({ de: 'einsteigen', pos: 'verb' });
  });

  it('treats a bold infinitive as a verb', () => {
    expect(parseToken('**essen** (to eat)')).toMatchObject({ pos: 'verb', en: 'to eat', needsReview: false });
  });

  it('routes a bold non-infinitive single word to adjective', () => {
    // V2: bold+wichtig → adjective (the common V1 reviewers' correction).
    expect(parseToken('**wichtig** (important)')).toMatchObject({ pos: 'adjective', en: 'important', needsReview: false });
  });
});

// ── parseWortschatz: section boundary + warnings ──────────────────────────────
describe('parseWortschatz section handling', () => {
  it('returns no entries and no warnings when there is no Wortschatz section', () => {
    const r = parseWortschatz('# Title\n\n## 1. Intro\nHallo Welt\n', 'A1/01');
    expect(r.entries).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.sectionFound).toBe(false);
  });

  it('does not leak vocab from the section after the boundary', () => {
    const md = [
      '## Wortschatz',
      '| der (m) | die (f) | das (n) |',
      '|---|---|---|',
      '| der Hund, -e | die Katze, -n | das Pferd, -e |',
      '',
      '## 2. Grammatik',
      '| der (m) | die (f) | das (n) |',
      '|---|---|---|',
      '| der Tisch, -e | die Lampe, -n | das Sofa, -s |',
    ].join('\n');
    const r = parseWortschatz(md, 'A1/01');
    expect(r.entries.map(e => e.de)).toEqual(['Hund', 'Katze', 'Pferd']);
  });

  it('extracts a 2-col bilingual table (| Deutsch | English |)', () => {
    const md = [
      '## Wortschatz',
      '| Deutsch | English |',
      '|---|---|',
      '| schnell | fast |',
      '| langsam | slow |',
    ].join('\n');
    const r = parseWortschatz(md, 'A1/01');
    expect(r.sectionFound).toBe(true);
    expect(r.warnings).toEqual([]);
    expect(r.entries.map(e => `${e.de}=${e.en}`)).toEqual(['schnell=fast', 'langsam=slow']);
  });

  it('extracts a maskulin-feminin table (| Beruf (m) | Beruf (f) | … |)', () => {
    const md = [
      '## Wortschatz',
      '| Beruf (m) | Beruf (f) | English |',
      '|---|---|---|',
      '| der Lehrer, - | die Lehrerin, -nen | teacher |',
      '| der Arzt, –e | die Ärztin, -nen | doctor |',
    ].join('\n');
    const r = parseWortschatz(md, 'A2/04');
    expect(r.warnings).toEqual([]);
    // 2 entries per row × 2 rows = 4
    const by = (de: string) => r.entries.find(e => e.de === de);
    expect(by('Lehrer')).toMatchObject({ article: 'der', pos: 'noun' });
    expect(by('Lehrerin')).toMatchObject({ article: 'die', plural: 'Lehrerinnen', pos: 'noun', en: 'teacher' });
    expect(by('Arzt')).toMatchObject({ article: 'der', plural: 'Ärzte', pos: 'noun' });
    expect(by('Ärztin')).toMatchObject({ article: 'die', pos: 'noun', en: 'doctor' });
  });

  it('extracts a noun-english table with article+plural encoded in the cell', () => {
    const md = [
      '## Wortschatz',
      '| Noun (article + plural) | English |',
      '|---|---|',
      '| der Preis, -e | price |',
      '| die Qualität, -en | quality |',
    ].join('\n');
    const r = parseWortschatz(md, 'A2/07');
    expect(r.warnings).toEqual([]);
    const by = (de: string) => r.entries.find(e => e.de === de);
    expect(by('Preis')).toMatchObject({ article: 'der', plural: 'Preise', en: 'price', pos: 'noun' });
    expect(by('Qualität')).toMatchObject({ article: 'die', plural: 'Qualitäten', en: 'quality', pos: 'noun' });
  });

  it('extracts an adj-english table (4-col with Comparative + Superlative)', () => {
    const md = [
      '## Wortschatz',
      '| Adjektiv | English | Comparative | Superlative |',
      '|---|---|---|---|',
      '| schnell | fast | schneller | am schnellsten |',
      '| groß | big | größer | am größten |',
    ].join('\n');
    const r = parseWortschatz(md, 'A2/07');
    expect(r.warnings).toEqual([]);
    const by = (de: string) => r.entries.find(e => e.de === de);
    expect(by('schnell')).toMatchObject({ pos: 'adjective', en: 'fast', tags: ['adjective'] });
    expect(by('groß')).toMatchObject({ pos: 'adjective', en: 'big', tags: ['adjective'] });
  });

  it('extracts a verb-english table with Perfekt in a Notes column', () => {
    const md = [
      '## Wortschatz',
      '| Verb | English | Perfekt |',
      '|---|---|---|',
      '| arbeiten | to work | hat gearbeitet |',
      '| vergleichen | to compare | hat verglichen |',
    ].join('\n');
    const r = parseWortschatz(md, 'A2/04');
    expect(r.warnings).toEqual([]);
    const by = (de: string) => r.entries.find(e => e.de === de);
    expect(by('arbeiten')).toMatchObject({ pos: 'verb', en: 'to work' });
    expect(by('vergleichen')).toMatchObject({ pos: 'verb', en: 'to compare' });
  });

  it('warns once for a still-untouched table shape (e.g. price/grammar)', () => {
    const md = [
      '## Wortschatz',
      '| | |',
      '|---|---|',
      '| €/hour | €/day |',
    ].join('\n');
    const r = parseWortschatz(md, 'A1/01');
    expect(r.entries).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/non-vocab/);
  });

  it('splits connector pairs (↔) into two entries', () => {
    const md = [
      '## Wortschatz',
      '',
      'kalt ↔ warm',
      '',
    ].join('\n');
    const r = parseWortschatz(md, 'A1/04');
    expect(r.entries.map(e => e.de)).toEqual(['kalt', 'warm']);
    expect(r.entries.every(e => e.pos === 'adjective')).toBe(true);
  });

  it('splits multi-option chunks (/) into individual phrases', () => {
    const md = [
      '## Wortschatz',
      '',
      'Fußball / Tennis / Karten spielen',
      '',
    ].join('\n');
    const r = parseWortschatz(md, 'A1/06');
    expect(r.entries.map(e => e.de)).toEqual(['Fußball', 'Tennis', 'Karten spielen']);
  });
});

// ── loader helper ─────────────────────────────────────────────────────────────
describe('unlockedVocab', () => {
  const mk = (lesson: string, de: string): VocabSetType => ({
    lesson,
    entries: [{ de, article: null, plural: null, en: de, pos: 'other', tags: [], core: true, needsReview: false }],
  });

  it('ranks levels then lesson numbers', () => {
    expect(lessonRank('A1/01')).toBeLessThan(lessonRank('A1/03'));
    expect(lessonRank('A1/14')).toBeLessThan(lessonRank('A2/01'));
    expect(lessonRank('B2/01')).toBeLessThan(lessonRank('C1/01'));
  });

  it('returns this lesson + earlier ones, ordered, excluding later lessons', () => {
    const sets = [mk('A2/01', 'c'), mk('A1/03', 'b'), mk('A1/01', 'a')];
    expect(unlockedVocab(sets, 'A1/03').map(e => e.de)).toEqual(['a', 'b']);
  });

  it('returns -1 / [] for malformed lesson ids', () => {
    expect(lessonRank('A1/3')).toBe(-1);
    expect(lessonRank('C2/01')).toBe(-1);
    expect(unlockedVocab([mk('A1/01', 'a')], 'nonsense')).toEqual([]);
  });
});

// ── CommittedVocabSet: the review-quality invariants ──────────────────────────
describe('CommittedVocabSet', () => {
  const entry = (over: Record<string, unknown>) => ({
    de: 'Apfel', article: 'der', plural: 'Äpfel', en: 'apple', pos: 'noun',
    tags: [], core: true, needsReview: false, ...over,
  });

  it.each([
    ['a leftover needsReview flag', entry({ needsReview: true })],
    ['an empty gloss', entry({ en: '' })],
    ['a stale reviewNote', entry({ reviewNote: 'check plural' })],
  ])('rejects %s', (_label, e) => {
    expect(CommittedVocabSet.safeParse({ lesson: 'A1/03', entries: [e] }).success).toBe(false);
  });

  it('accepts a fully-reviewed entry', () => {
    expect(CommittedVocabSet.safeParse({ lesson: 'A1/03', entries: [entry({})] }).success).toBe(true);
  });
});

// ── regression guard: committed pilot must stay clean (mirrors the CI gate) ───
describe('committed A1/03 vocab.yml', () => {
  it('passes CommittedVocabSet (validated, glossed, zero needsReview)', () => {
    const raw = parseYaml(readFileSync(`${REPO_ROOT}A1/03-essen-und-trinken/vocab.yml`, 'utf8'));
    const r = CommittedVocabSet.safeParse(raw);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.entries.length).toBeGreaterThan(0);
  });
});
