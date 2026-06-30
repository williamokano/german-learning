import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { VocabSet, unlockedVocab, lessonRank } from '@core/content/vocab';
import type { VocabSetType } from '@core/content/vocab';
import { parseWortschatz } from '@core/content/wortschatz-parser';

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

  it('rejects a noun without an article', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [{ de: 'Apfel', en: 'apple', pos: 'noun' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a non-noun carrying an article', () => {
    const r = VocabSet.safeParse({
      lesson: 'A1/03',
      entries: [{ de: 'essen', article: 'der', en: 'to eat', pos: 'verb' }],
    });
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
});

// ── regression guard: committed pilot must stay clean (mirrors the CI gate) ───
describe('committed A1/03 vocab.yml', () => {
  it('validates against the schema with zero needsReview', () => {
    const raw = parseYaml(readFileSync(`${REPO_ROOT}A1/03-essen-und-trinken/vocab.yml`, 'utf8'));
    const r = VocabSet.safeParse(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.entries.every(e => !e.needsReview)).toBe(true);
      expect(r.data.entries.length).toBeGreaterThan(0);
    }
  });
});
