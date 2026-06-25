# Style Guide — Exercise YML

Consistent terminology, formatting, and German names across all exercise reviews.

## Exercise type terminology

Use these English names (with German in parens on first use):

| Type | German equivalent | Notes |
|------|-------------------|-------|
| `gap-text` | Lückentext | Single gap, no bank |
| `gap-bank` | Lückentext mit Bank / Auswahl | Multiple gaps, with bank |
| `order` | Satzbau / Wortstellung | Tiles in correct order |
| `table-fill` | Konjugationstabelle | Conjugation table |
| `single-choice` | Multiple Choice / Auswahl | Pick one option |
| `true-false` | Richtig / Falsch | Boolean |
| `matching` | Zuordnung | Left-right pairing |
| `categorize` | Kategorisierung / Sortieren | Sort into buckets |
| `odd-one-out` | Was passt nicht? | Identify outlier |
| `free-write` | Freies Schreiben | Open production |
| `speaking-prompt` | Sprechaufgabe | Speaking task |

## Block naming

| Block | German | Notes |
|-------|--------|-------|
| H | Hören | Listening; comes FIRST |
| A | Basistraining | Recognition → controlled production |
| B | Vertiefung | Production tasks |
| C | Prüfungstraining | Exam format |
| D | Wiederholung & Selbsttest | Review + self-test |

Block items: H1, H2, H3, H4 (A1-A2 only); H1a/H1b if 2 dialog clips; C4a/C4b if 2 reading texts.

## Exercise IDs

- Format: `<block><number>` (e.g. `H1`, `A3`, `B5`, `C2`, `D1`)
- Sub-items: `<block><number><letter>` (e.g. `H1a`, `H1b`, `C4a`, `C4b`)
- Prüfungstraining sub-items: `exam-A1`, `exam-B12`, etc.

## German grammar names (English equivalents)

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
| Partizip I / II      | present / past participle    | as adjective |

## Format conventions

### YAML

- `id: H1` (string, no quotes unless containing colon)
- `block: H` (single letter)
- `type: gap-text` (kebab-case)
- `title: "..."` (quoted, in case of colons)
- `instructions: "..."` (German default; English as `instructionsEn`)
- `text: |` (block-style for multi-line text)
- `bank: [word1, word2, ...]` (flow-style for short lists)
- `answers: { 1: ans1, 2: ans2 }` (block-style keys to avoid YAML 1.1 parsing as integers)

### German in YAML strings

- `„…"` German quotes — escape with single-quoted field
- Em-dash `—` — used directly, or escape with backslash
- En-dash `–` — used for ranges (A1–A2)
- Eszett `ß` — used directly

### Exercise instructions

- **German** (default) — short, direct, no unnecessary politeness
- **English** (instructionsEn) — mirror of German, no "Please" unless A1 (model sentences)

### Item text

- Sentence-initial capitalisation (standard German)
- Proper noun capitalisation
- Verbs conjugated (no infinitive in statements)
- Pronouns capitalised even mid-sentence (`ich`, `du`, `er`, etc.)
- `Sie` (formal you) and `Ihr` (formal your) always capitalised

## Audio file naming

| Pattern | Example | Notes |
|---------|---------|-------|
| `dialog1_a.mp3` | Dialog A (informal du) | A1-A2 |
| `dialog1_b.mp3` | Dialog B (formal Sie) | A1-A2 |
| `dialog1.mp3`, `dialog2.mp3` | sequential dialogs | A1/06+ |
| `hoertext.mp3` | Hörtext | per lesson |
| `hoerzu{N}.mp3` | Aussprache clips | A1/01-04, A1/06 |
| `transcript_ansage1.mp3` | H4 Kurze Ansage | per lesson (if H4 exists) |

## Answer key style

- `answers: { 1: "ich" }` (quoted if it could be mis-parsed)
- `answers: { 1: ich }` (unquoted when unambiguous)
- For multiple valid answers, use `alts:`:
  ```yaml
  answers:
    "1": komme
  alts:
    "1":
      - word: bin
        note: "Correct, but 'heiße' is the target verb here."
  ```

## Cross-references

- Always cite `file:line` for findings
- Reference the source file (`SKILL.md`, `exercise-guidelines-{LEVEL}.md`,
  `guidelines-{LEVEL}.md`, `AUTHORING.md`, `CURRICULUM.md`)
  when citing a rule