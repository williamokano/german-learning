# CONTENT-MODEL.md — schemas & types

This file is the **contract** between content (`exercises.yml`, `lesson.md(x)`) and
code (the generator, the Astro build, the widgets, the grading engine). It defines:

1. The `exercises.yml` shape + the Zod schema + the TS discriminated union.
2. Every exercise `type` and its fields.
3. The lesson inline-component vocabulary and the auto-enrichment model.
4. Text-answer **normalization** rules (shared by the engine and the generator).

> Everything here is validated at build time via `astro:content` collections (see
> `BUILD-PIPELINE.md`). A file that violates the schema **fails the build**.

---

## 1. `exercises.yml` — top level

One file per lesson, at `<LEVEL>/<NN-slug>/exercises.yml`.

```yaml
lesson: A1/01                     # "<LEVEL>/<NN>" — must match folder; used as content id
title: "Lektion 1 — Übungen"      # printed as the exercises.md H1
intro: >                          # optional; printed under the H1 (the "spread over
  Blocks: H → A → B → C → D ...    #   several days" advice block)
exam: null                        # null for normal lessons; an ExamGrid for NN/14 (see §5)
exercises:                        # ordered; the generator and the page preserve order
  - id: H1a
    block: H                      # one of: H A B C D  (or "exam" for mock-exam parts)
    type: true-false
    title: "Dialog Hör-Check: Dialog A (informell)"
    instructions: "Listen and decide: Richtig (R) oder Falsch (F)?"
    audio: dialog1_a.mp3          # optional; lesson-relative file in audio/
    items: [...]                  # shape depends on `type` (§4)
  - id: A1
    block: A
    type: table-fill
    ...
```

### Common fields (every exercise)

| field | type | notes |
|---|---|---|
| `id` | string | the canonical exercise id: `H1`, `H1a`, `A3`, `C2`, `D4`, … Must be unique in the file and match AUTHORING's block architecture. Drives the `## Übung <id> — …` heading in print. |
| `block` | `'H'\|'A'\|'B'\|'C'\|'D'\|'exam'` | groups exercises into the printed blocks and the page sections. |
| `type` | enum (§4) | selects the widget + the generator renderer + the engine checker. |
| `title` | string | the human title after the em-dash in the heading. |
| `instructions` | string? | rendered above the widget and in print under the heading. |
| `audio` | string? | lesson-relative mp3 (e.g. `hoertext.mp3`); adds an `AudioPlay` to the exercise header. Use this when all items in the exercise depend on the same clip. If different items need different clips, put `audio` on each item instead (supported by `single-choice` and `true-false`). |
| `recycledFrom` | string? | e.g. `"L2"`; printed as a `(L2)` tag (Block D recycling, see AUTHORING §Recycling). |
| `notes` | string? | author note; printed only in `solutions.md`, never in the widget. |

---

## 2. The gap placeholder convention

Free-fill and word-bank exercises put **numbered placeholders** in their `text`:

```
"Hallo! Ich {1} Carlos und ich {2} aus Spanien, aus Madrid."
```

- `{n}` is a gap. Numbering is 1-based and unique within the exercise.
- The **generator** renders `{n}` → `(n) ______` in `exercises.md` (matching the
  current printable style exactly — see `BUILD-PIPELINE.md §Render rules`).
- The **widget** replaces `{n}` with an input (gap-text) or a drop-slot (gap-bank).
- Answers are keyed by the same `n` (see each type below). This shared key is what
  guarantees gap↔answer alignment can never drift.

For multi-line texts use a YAML block scalar (`text: |`). Markdown inside `text`
(bold, etc.) is allowed and rendered.

---

## 3. The Zod schema (authoritative)

Lives at `web/src/core/content/schema.ts`. Sketch (tighten during implementation):

```ts
import { z } from 'zod';

// ---- shared ----
const Base = z.object({
  id: z.string().regex(/^[HABCD]\d+[a-z]?$|^exam-/),
  block: z.enum(['H', 'A', 'B', 'C', 'D', 'exam']),
  title: z.string(),
  instructions: z.string().optional(),
  audio: z.string().optional(),
  recycledFrom: z.string().optional(),
  notes: z.string().optional(),
});

// answers may be a single string or a list of accepted alternatives
const Answer = z.union([z.string(), z.array(z.string()).min(1)]);
const GapMap = z.record(z.coerce.number().int().positive(), Answer); // { 1: "heiße", ... }

// ---- per type ----
const GapText = Base.extend({
  type: z.literal('gap-text'),
  text: z.string(),               // contains {1}, {2}, …
  answers: GapMap,
  // optional per-gap cue shown in the gap, e.g. infinitive "(heißen)"
  cues: z.record(z.coerce.number(), z.string()).optional(),
});

const TableFill = Base.extend({
  type: z.literal('table-fill'),
  columns: z.array(z.string()),   // header row (may include ⚠️ markers)
  rows: z.array(z.object({
    label: z.string(),            // row header, e.g. "ich"
    cells: z.array(z.union([      // one per column
      z.literal(null),            // pre-filled blank label cell
      z.object({ gap: z.number(), answer: Answer, given: z.string().optional() }),
    ])),
  })),
});

const GapBank = Base.extend({
  type: z.literal('gap-bank'),
  text: z.string(),               // contains {1}, {2}, …
  bank: z.array(z.string()),      // tokens incl. distractors; order = display order
  answers: GapMap,                // each value MUST be a token present in `bank`
});

const Option = z.object({ key: z.string(), text: z.string() }); // key: "a"/"b"/"c"
const SingleChoice = Base.extend({
  type: z.literal('single-choice'),
  items: z.array(z.object({
    q: z.string(),
    audio: z.string().optional(), // per-item clip (use when items reference different clips)
    options: z.array(Option).min(2),
    answer: z.string(),           // the correct option key
    why: z.string().optional(),   // printed in solutions.md
  })),
});

const TrueFalse = Base.extend({
  type: z.literal('true-false'),
  positiveLabel: z.string().default('Richtig'),
  negativeLabel: z.string().default('Falsch'),
  items: z.array(z.object({
    q: z.string(),
    audio: z.string().optional(), // per-item clip (same semantics as SingleChoice)
    answer: z.boolean(),
    why: z.string().optional(),
  })),
});

const Matching = Base.extend({
  type: z.literal('matching'),
  left: z.array(z.object({ key: z.string(), text: z.string() })),   // 1,2,3…
  right: z.array(z.object({ key: z.string(), text: z.string() })),  // a,b,c… (may exceed left = distractors)
  answers: z.record(z.string(), z.string()),                        // { "1": "d", "2": "f", … }
});

const Categorize = Base.extend({
  type: z.literal('categorize'),
  buckets: z.array(z.object({ key: z.string(), label: z.string() })),
  tokens: z.array(z.object({
    text: z.string(),
    bucket: z.string(),           // correct bucket key
    tag: z.string().optional(),   // e.g. "(F/I)" formal/informal marker
  })),
});

const OddOneOut = Base.extend({
  type: z.literal('odd-one-out'),
  groups: z.array(z.object({
    items: z.array(z.string()).min(3),
    odd: z.number().int(),        // index into items of the outlier
    why: z.string().optional(),
  })),
});

const Order = Base.extend({
  type: z.literal('order'),
  items: z.array(z.object({
    tiles: z.array(z.string()),   // shuffled-for-display word/chunk tiles
    answer: z.array(z.number()),  // permutation of indices giving correct order
    alt: z.array(z.array(z.number())).optional(), // other accepted orders (V2 variants)
    note: z.string().optional(),
  })),
});

const FreeWrite = Base.extend({
  type: z.literal('free-write'),
  prompt: z.string(),
  genre: z.string().optional(),       // "WhatsApp-Nachricht" | "E-Mail" | …
  stimulus: z.string().optional(),    // the message-you-received (B9/C5)
  minSentences: z.number().optional(),
  use: z.array(z.string()).optional(),       // the "Use:" checklist
  selfCheck: z.array(z.string()).optional(), // the "Self-check:" checklist
  model: z.string().optional(),       // model answer (revealed; NOT auto-scored)
  maxScore: z.number().optional(),    // for exam Schreiben tasks (e.g. 5 or 6)
});

const SpeakingPrompt = Base.extend({
  type: z.literal('speaking-prompt'),
  parts: z.array(z.object({
    label: z.string(),                 // "Teil 4a — Sich vorstellen"
    prompt: z.string(),
    bullets: z.array(z.string()).optional(),
  })),
  criteria: z.array(z.string()).optional(),  // self-assessment rubric
  maxScore: z.number().optional(),
});

export const Exercise = z.discriminatedUnion('type', [
  GapText, TableFill, GapBank, SingleChoice, TrueFalse,
  Matching, Categorize, OddOneOut, Order, FreeWrite, SpeakingPrompt,
]);

export const ExerciseSet = z.object({
  lesson: z.string().regex(/^[A-C][12]\/\d{2}$/),
  title: z.string(),
  intro: z.string().optional(),
  exam: ExamGrid.nullable().default(null),   // §5
  exercises: z.array(Exercise),
}).superRefine((set, ctx) => {
  // cross-field invariants that MUST fail the build:
  // 1. every {n} in a text has an entry in answers/cues, and vice versa
  // 2. gap-bank: every answer value is a member of `bank`
  // 3. ids unique; matching/categorize answer keys reference existing items
  // 4. audio filename, if present, has a plausible .mp3 extension
});
```

The corresponding TS types are inferred (`z.infer<typeof Exercise>` →
`Exercise`, etc.) and re-exported from `core/content/types.ts` for the widgets.

> **`superRefine` is the safety net.** The placeholder/answer coverage check and
> the gap-bank membership check are what make "a gap without an answer" or "an
> answer for a non-existent gap" a **build failure**, not a runtime surprise.

---

## 4. Exercise types — quick reference

| `type` | Source fields | Graded? | Widget (COMPONENTS.md) |
|---|---|---|---|
| `gap-text` | `text` + `answers` (+`cues`) | yes | `GapText` |
| `table-fill` | `columns`,`rows[].cells[].{gap,answer,given}` | yes | `TableFill` (grid of GapText) |
| `gap-bank` | `text` + `bank` + `answers` | yes | `GapBank` (drag/click tokens) |
| `single-choice` | `items[].{q,options,answer,why}` | yes | `SingleChoice` |
| `true-false` | `items[].{q,answer,why}` | yes | `TrueFalse` |
| `matching` | `left`,`right`,`answers` | yes | `Matching` |
| `categorize` | `buckets`,`tokens[].{text,bucket}` | yes | `Categorize` |
| `odd-one-out` | `groups[].{items,odd}` | yes | `OddOneOut` |
| `order` | `items[].{tiles,answer,alt}` | yes | `Order` |
| `free-write` | `prompt`,`use`,`selfCheck`,`model`,… | **no** (self-assess) | `FreeWrite` |
| `speaking-prompt` | `parts`,`criteria` | **no** (self-assess) | `SpeakingPrompt` |

`free-write` and `speaking-prompt` contribute to scoring only via **self-marked**
points (see `SCORING.md §Self-assessed items`). All others are auto-graded.

### Coverage note
Every distinct exercise title found across A1+A2 (derived by grepping all
`## Übung` headings) maps to exactly one type above. Notable mappings:
`Finde den Fehler` → `gap-text` (the gap is the corrected sentence; `answers`
lists accepted corrections, `alt` covers the "also fine" cases). `Satzbau`/word
order → `order`. `Frage↔Antwort verbinden`, `Zuordnen`, `Anzeigen/Kurze Texte
zuordnen` (incl. exam Aufgaben with **distractor** options) → `matching` (the
right side simply has more entries than the left). `Begrüßung/Abschied`,
`Kategorien`, `der/die/das` sort → `categorize`. `Antworten mit Hinweisen`
(answer-with-cues) → `gap-text` with `cues`.

---

## 5. Exam lessons (`NN/14`) — the scoring grid

Mock-exam lessons replace the H/A/B/C/D battery with telc/Goethe parts (Teil 1–4,
Aufgabe 1–N). Use `block: 'exam'` and `id: exam-aufgabe1`, etc. The exercise
*types* are the same (mostly `single-choice`, `true-false`, `matching`,
`gap-text`/`gap-bank`, `free-write`, `speaking-prompt`). The grid lives at the top:

```ts
const ExamSkill = z.object({
  key: z.enum(['hoeren', 'lesen', 'schreiben', 'sprechen']),
  label: z.string(),
  maxPoints: z.number(),
  passPoints: z.number(),           // sub-threshold for this skill
  exerciseIds: z.array(z.string()), // which exercises sum into this skill
  selfAssessed: z.boolean().default(false),  // sprechen/schreiben
});
const ExamGrid = z.object({
  skills: z.array(ExamSkill),
  totalPass: z.number(),            // overall pass threshold
  rule: z.string().optional(),      // e.g. "≥29/55 AND sub-threshold met in ≥3 of 4 skills"
});
```

Encoded grids (from the existing solutions):

```yaml
# A1/14
exam:
  skills:
    - { key: hoeren,    label: "Teil 1 · Hören",     maxPoints: 15, passPoints: 8,  exerciseIds: [exam-aufgabe1, exam-aufgabe2, exam-aufgabe3] }
    - { key: lesen,     label: "Teil 2 · Lesen",     maxPoints: 18, passPoints: 10, exerciseIds: [exam-aufgabe4, exam-aufgabe5, exam-aufgabe6, exam-aufgabe7] }
    - { key: schreiben, label: "Teil 3 · Schreiben", maxPoints: 12, passPoints: 6,  selfAssessed: true,  exerciseIds: [exam-aufgabe8, exam-aufgabe9] }
    - { key: sprechen,  label: "Teil 4 · Sprechen",  maxPoints: 10, passPoints: 5,  selfAssessed: true,  exerciseIds: [exam-aufgabe10, exam-aufgabe11] }
  totalPass: 29   # /55
  rule: "≥29/55 AND sub-threshold met in ≥3 of 4 skills"

# A2/14
exam:
  skills:
    - { key: hoeren,    label: "Teil 1 — Hören",     maxPoints: 15, passPoints: 9,  exerciseIds: [exam-aufgabe1, exam-aufgabe2, exam-aufgabe3] }
    - { key: lesen,     label: "Teil 2 — Lesen",     maxPoints: 20, passPoints: 12, exerciseIds: [exam-aufgabe4, exam-aufgabe5, exam-aufgabe6, exam-aufgabe7] }
    - { key: schreiben, label: "Teil 3 — Schreiben", maxPoints: 10, passPoints: 6,  selfAssessed: true,  exerciseIds: [exam-aufgabe8, exam-aufgabe9] }
    - { key: sprechen,  label: "Teil 4 — Sprechen",  maxPoints: 0,  passPoints: 0,  selfAssessed: true,  exerciseIds: [exam-teil4] }
  totalPass: 27   # /45 written; Sprechen assessed separately
  rule: "≥27/45 (written) AND adequate Sprechen"
```

`ScoringService` consumes this grid for exam lessons; see `SCORING.md §Exam scoring`.

---

## 6. Lesson content model

Lessons stay markdown, authored as **`.md` rendered through `@astrojs/mdx`** (or
renamed `.mdx`). Two parts: frontmatter + body.

### 6.1 Frontmatter (validated by a `lessons` collection schema)

```yaml
---
level: A1
number: 1
slug: erste-kontakte
title: "Erste Kontakte"
titleEn: "First Contacts"           # A1–A2 only
canDo: ["greet people", "introduce yourself", …]
grammar: ["personal pronouns", "the verb sein", …]
buildsOn: ["A1/—"]                  # pointers to earlier lessons
---
```

Today's lessons carry this as a `>` blockquote header rather than YAML
frontmatter. The importer (`BUILD-PIPELINE.md §import`) lifts it into frontmatter;
going forward authors write frontmatter. The blockquote may remain in the body for
print if desired — decide once during P1 and keep consistent.

### 6.2 Inline component vocabulary (the only non-prose constructs allowed)

| Construct | Renders to | Print-strip result |
|---|---|---|
| `<AudioPlay src="x.mp3">Guten Tag</AudioPlay>` | `Guten Tag ▶` (text + inline play button) | `Guten Tag` |
| `<AudioPlay src="x.mp3" />` | `▶` (bare play button) | removed (or a `🎧` glyph, configurable) |
| `<details><summary>…</summary>…</details>` | `Spoiler` (closed by default) | left as-is (native; pandoc-safe) |

`<AudioPlay>` props: `src` (required, lesson-relative), children = optional inline
label. The component is the same `AudioPlay` Svelte island used everywhere; in a
lesson it hydrates `client:visible`.

> **No other custom tags** without adding them here first. The vocabulary is
> deliberately tiny to keep lessons printable and GitHub-readable.

### 6.3 Auto-enrichment (no markup needed)

The lesson build runs a remark/rehype pass that recognizes the existing markdown
conventions and upgrades them, **reusing the exact regex semantics already proven
in `scripts/generate_audio.py`** (cite them so behavior matches the audio the page
plays):

| Markdown pattern (from AUTHORING.md) | `generate_audio.py` anchor | Rendered as |
|---|---|---|
| `## N. Dialog` / `### Dialog A:` + `> **Speaker:** …  ` | `DIALOG_SECTION`, `DIALOG_SUB`, `DIALOG_LINE` | `DialogBlock` (speaker turns) + `AudioPlay(dialog{n}[_x].mp3)` |
| `🎧 **Audio:** [file.mp3](audio/file.mp3)` | `AUDIO_TAG` / `AUDIO_REF_RE` | `AudioPlay(file.mp3)` (replaces the raw link) |
| `> **Hör zu N — Label:** a · b · c` | `HOERZU_LINE` | word list + `AudioPlay(hoerzuN.mp3)` |
| `## N. Hörtext` + `<details>` transcript | `HOERTEXT_SECTION` | `AudioPlay(hoertext.mp3)` + `Spoiler` transcript |
| `> 📌 **Merkasten — …**` blockquote | (convention) | `Merkasten` callout |
| vocab / Redemittel tables | (markdown tables) | styled `VocabTable` / `RedemittelTable` |

Filename derivation (e.g. `dialog1_a.mp3`, `hoerzu2.mp3`, `hoertext.mp3`) must
match `generate_audio.py`'s slugging so the page references real files. The
enrichment is **rendering-only**; it never edits the source.

---

## 7. Text-answer normalization (shared contract)

Used by **both** `GradingEngine.checkText()` and any generator equality checks, so
"what counts as correct" is defined once. Default normalization for a learner's
free-text answer vs. an accepted answer:

1. trim; collapse internal whitespace to single spaces.
2. case-insensitive **by default** — BUT see the German caveat below.
3. strip surrounding punctuation that the gap context already implies (trailing
   `.`/`?`/`!`) — configurable per exercise.
4. treat `ß`≈`ss` and umlaut≈digraph (`ä`≈`ae`, `ö`≈`oe`, `ü`≈`ue`) as **equal by
   default** so a learner without a German keyboard isn't wrongly failed; a
   per-exercise `strictUmlaut: true` flag disables this where the umlaut is the
   teaching point.
5. accept any member of the answer's alternatives list (`answers` value may be a
   string array; `alt` for `order`).

**German caveat — capitalization matters sometimes.** Noun capitalization and the
language-name capitalization (`Deutsch` not `deutsch`) are real teaching points
(see A1/01 B3 #9). Provide a per-exercise `caseSensitive: true` flag for those
items; default remains case-insensitive for low-stakes drills. The engine exposes
both; authors opt into strictness where the lesson teaches it. Document the chosen
default prominently in `SCORING.md` so graders and authors agree.

> Normalization options live on the exercise (or per gap) as optional flags:
> `caseSensitive`, `strictUmlaut`, `keepPunctuation`. Defaults as above. Keep the
> set small and documented; do not invent per-gap regexes.
