# Style Guide

Consistent terminology, formatting, and grammar names across all reviews.

## Terminology

Use these German grammar names in English:

| German term          | English equivalent           | Notes |
|----------------------|------------------------------|-------|
| V2-Regel             | V2 rule                      | Verb-second rule |
| Verbklammer          | Satzklammer / verb bracket   | Modal + infinitive bracket |
| Wechselpräpositionen | two-way prepositions         | in/an/auf/über + Dat or Akk |
| Konjunktiv II        | Konjunktiv II subjunctive    | Polite/unreal conditional |
| Konjunktiv I         | Konjunktiv I subjunctive     | Reported speech |
| Zustandspassiv       | state passive                | sein + Partizip II |
| Vorgangspassiv       | process passive              | werden + Partizip II |
| Funktionsverbgefüge  | light-verb construction      | in Frage stellen, etc. |
| Nominalstil          | nominal style                | das + nominalisierter Verb |
| Verbalstil           | verbal style                 | verb-led clause |
| Partizip I / II      | present / past participle    | as adjective: Partizip I/II als Attribut |

## Voice characters (audio generator)

| Speaker | Default voice | Speed |
|---------|---------------|-------|
| Anna | female | 0.95× A1, 0.90× A2, 0.90× B1 |
| Bruno | male | same as Anna |
| Frau Weber | female | same |
| Herr Steinmeyer | male | same |
| Frau Yilmaz | female | same |
| Yuki | female | same |

Audio speed config: `scripts/audio_config.json`.

## Formatting conventions

### Markdown

- **Headers** — ATX (`# Title`), never Setext
- **Lists** — `-` for bullets, `1.` for numbered
- **Emphasis** — `*italic*` for chunks (forward-references and Redemittel), `**bold**` for new terms
- **Code** — `inline code` for grammar categories and example markers; triple-backtick for transcripts and code
- **Tables** — pipe-style, alignment column not required

### German text

- **Quotes** — „…" (low 9, low 99), never " " or " "
- **Dashes** — em-dash `—` for parenthetical, en-dash `–` for ranges (e.g. `A1–A2`)
- **Apostrophe** — straight `'` for English text, German apostrophe `'` for German (e.g. `Oma's Geburtstag` is wrong; `Omas Geburtstag` — Genitiv without apostrophe)
- **ß/ss** — `ß` after long vowels and diphthongs (Straße, groß); `ss` after short vowels (radfahren → Rad fahren, but `das Glas` with `ß` for state name)

### YAML frontmatter

- `lesson: A1/01` (no slash at end)
- `title:` quoted (in case of colons)
- `intro:` block-style with `>` for multi-line

### Audio

- Filename pattern: `dialog1_a.mp3`, `dialog1_b.mp3`, `hoertext.mp3`, `hoerzu{N}.mp3`, `transcript_ansage1.mp3`
- Audio link pattern: `🎧 **Audio:** [slug.mp3](audio/slug.mp3)`
- Dialog speaker lines end with TWO trailing spaces (`  `) for CommonMark line-break; required by audio generator

## Number style

- 0–12: spelled out (null, eins, zwei, …, zwölf)
- 13+: digits or spelled out per lesson convention
- Prices: `2,50 €` (comma as decimal, space before €)
- Times: `8:30` official, `halb neun` colloquial
- Years: `1990` (no apostrophe for decades: `90er` not `90'er`)

## Cross-references

- Always cite `file:line` for findings
- Reference the source file (`SKILL.md`, `guidelines-{LEVEL}.md`,
  `common-pitfalls.md`, `AUTHORING.md`, `CURRICULUM.md`) when citing a rule