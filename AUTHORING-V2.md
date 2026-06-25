# AUTHORING-V2.md — Lesson production spec for the v2 **Full** prose lesson

> **Use this file** when writing a `lesson.md` (the v2 Full prose version).
> **Use `AUTHORING.md`** when writing a `lesson-short.md` (the v1 analytical
> reference version). The two specs coexist; a lesson can have both, or only
> one, or only the other.
>
> **Read in this order:** `docs/lesson-v2-spec.md` (design rationale) →
> `AUTHORING-V2.md` (this file — how to write one) → `A1/01-erste-kontakte/`
> (the worked example, both files) → `CURRICULUM.md` (your topic's row +
> earlier rows) → `personas/` (if your lesson uses recurring characters).

---

## 1. Your task

For each lesson topic, produce **two source files** in `<LEVEL>/<NN-slug>/`:

1. `lesson.md` — the **Full** v2 prose lesson (this spec).
2. `lesson-short.md` — the **Short** analytical reference (per `AUTHORING.md`).

Then run the same generators as v1 (audio, gen-exercises).

Both files must agree on:

- **Dialogue text** (section 1). Same speakers, same words, same order. The
  audio pipeline reads from `lesson.md` and ignores `lesson-short.md`; if the
  two drift, the audio will be out of sync with the Short view.
- **Hörtext text** (section 8). Same. The audio file is shared.
- **Wortschatz entries** (section 4). Same nouns, same articles, same plurals.
  A noun that appears in Full but not in Short (or vice versa) is a bug.

The `review-exercises` skill now checks this drift automatically.

You may also author **only** the Full or **only** the Short:

- Only Full (no Short file) → page renders Full, no toggle shows. Acceptable
  for new B1+ lessons.
- Only Short (no Full file) → page renders Short, no toggle. The legacy A1/A2
  state until the Full versions are written.
- Both → page renders Full by default, toggle available.

---

## 2. The v2 Full lesson — section order (required)

```
# A1 · Lektion 1 — Erste Kontakte (First Contacts)

> You will learn to: …
> Grammar: …
> Builds on: …

## 1. Dialoge                       (v1 same — 1–2 model dialogues)
## 2. Einstieg                      (v2 new — 2–4 sentence lesson intro)
## 3. Redemittel                    (v1 same — phrase tables)
## 4. Wortschatz                    (v1 same — vocab tables, with Lerntipp prose line)
## 5. Mini-Geschichte                (v2 new — 200–280 word continuous prose)
## 6. Grammatik                     (v2 expanded — 6 sub-parts per point)
## 7. Lesetext                      (v1 same, slightly longer)
## 8. Hörtext                       (v1 same — 4–6 sentence listening)
## 9. Magazin — Landeskunde         (v2 new — 80–120 word cultural aside)
## 10. Lernstrategie                (v2 expanded — 3-day study plan)
## 11. Outro                        (v1 same — pointer to exercises)
```

Skipping or reordering sections is **not allowed** — the page CSS and the
learner's mental model both depend on this order.

### 2.1 Header (frontmatter blockquote)

The "Builds on" line is **required** in v2 (it was optional in v1). One-line
pointers to the 1–3 most recent lessons the current one depends on, e.g.
"Builds on: A1/00 (alphabet, A1/01 first nouns)".

### 2.2 Section 1 — Dialoge

Exactly as v1. All audio formatting rules from `AUTHORING.md` apply (trailing
double-spaces on every speaker line, `### Dialog A:` / `### Dialog B:`
sub-headers, `🎧` links added by the generator — do not hand-write them).

### 2.3 Section 2 — Einstieg (lesson intro)

A 2–4 sentence prose paragraph in English (A1–A2) or mixed (B1+) or German
(B2+) that:

- Frames the topic in a relatable situation ("Du bist neu in einer Stadt …").
- Names the lesson's main communicative goal in plain words.
- Reads like a teacher talking to a student, not a Wikipedia summary.

No headers, no lists, no tables. Just prose. Use the same `du` register the
lesson uses for the learner.

### 2.4 Section 3 — Redemittel

Exactly as v1. Grouped by function, German | English columns, `du/Sie` column
where relevant. No prose.

### 2.5 Section 4 — Wortschatz

As v1, with one change: each major vocab table is preceded by a 1–2 sentence
**Lerntipp** prose line (use `> 💡 **Lerntipp**` blockquote). The 🔊
Aussprache sub-section is unchanged (A1/01–04 only).

### 2.6 Section 5 — Mini-Geschichte

A 200–280 word continuous prose story:

- Uses **only** vocab + grammar from the current lesson and earlier lessons
  (scope discipline, same rule as v1 Lesetext).
- Is **different** from the Lesetext in §3.7 (different situation, possibly
  different characters, no dialogue).
- Reuses the lesson's personas (Anna, Bruno, etc.) so it feels like the same
  universe as the Dialog.
- May include 1–2 inline parenthetical asides in English (A1–A2 only), e.g.
  *„Das ist in Santa Catarina" (that's in Santa Catarina)*.

Preceded by a 1–2 sentence **Lese-Tipp** (use a normal paragraph, not a
blockquote). Followed by a `<details>`-spoiler **Lese-Check** with 3 short
self-check questions and answers in German.

### 2.7 Section 6 — Grammatik (the big change)

Each grammar subsection has **the same six sub-parts in the same order**.
No subsection is allowed to skip any of them.

```
### 6.N Title

**Warum?** (3–6 sentence reasoning paragraph)

[8–12 worked examples — separate paragraphs or a small table]

> ⚠️ **Häufige Fehler**
> [2–4 wrong-vs-right pairs]

> 💡 **Lerntipp**
> [mnemonic, pattern-spot, memory hook]

**Versuch es selbst.** [1–3 sentence prompt]

<details>
<summary>📝 Lösung</summary>

> [model answer in German]

</details>

> 📌 **Merkasten — [title]**
> [the existing v1 cheat-sheet, now a recap, not the main delivery]
```

**Sub-part specifications:**

- **Warum?** — 3–6 sentences. Tone: explaining to a friend. Connect to English
  / Portuguese / Spanish where the contrast is illuminating. Cite the
  cognitive hook (e.g. "the verb is the spine, everything else orbits
  around it") that makes the rule stick.
- **Examples** — **8–12 minimum**. Use a mix of full sentences and short
  fragments. Vary the subject pronoun across examples. At least 2 examples
  must use a *Wortschatz* noun from §4 so the learner sees the rule applied
  to fresh vocabulary.
- **Häufige Fehler** — 2–4 wrong-vs-right pairs, formatted as a 2-column
  table or stacked `❌ … / ✅ …` lines. Built from real L1-interference
  mistakes PT / ES / EN speakers make. Cross-check the pair is a real error
  (i.e. the ✅ form is grammatically correct, not just "more idiomatic").
- **Lerntipp** — concrete and actionable. "Study hard" and "memorise the
  table" are not Lerntipps; a memory hook, a spotting pattern, or a
  collocation warning is.
- **Versuch es selbst** — 1–3 sentences asking the learner to produce
  something. The prompt should be specific enough to elicit the rule, not
  vague ("write about your family"). The model answer in the spoiler is in
  German; the prompt is in English (A1–A2) or mixed (B1+).
- **Merkasten** — the existing v1 cheat-sheet, kept as a 30-second recap at
  the end of the subsection. It is **not** the main delivery; the prose
  above is.

Sections in §6 for A1/01: 6.1 Personalpronomen · 6.2 `sein` · 6.3 Regular
verbs · 6.4 Word order (V2) · 6.5 Pronunciation survival kit.

The 6.5 pronunciation section is the only one that **may** skip the
Versuch-es-selbst and Häufige-Fehler parts (pronunciation has no L1
"grammar" interference to trap into). The Merkasten is also optional.
Warum? and Lerntipp are still required.

### 2.8 Section 7 — Lesetext

Slightly longer than v1 (200–280 words). Uses only known material. Is
**different** from the Mini-Geschichte in §5. Reused in Block C (Lesen)
C4a. The "You'll work with this text in the exercises" hint is preserved.

### 2.9 Section 8 — Hörtext

Exactly as v1. 4–6 sentences, different scene from Lesetext, `<details>`
spoiler for the transcript. The "Hör zu und mach Übung H3" hint is preserved.

### 2.10 Section 9 — Magazin — Landeskunde

80–120 words. Tone: curious, slightly opinionated, not lecturing. One topic
per lesson, tied to the lesson subject. May include one inline pull-quote in
German (formatted as a blockquote). No tables, no lists.

Suggested topics by lesson:

- A1/01 — *Sie und du: Wie Deutsche das „Sie" benutzen* (Duzen / Siezen).
- A1/02 — *Familienmodelle in Deutschland heute*.
- A1/03 — *Kaffee und Kuchen: Das deutsche Nachmittagsritual*.
- A1/04 — *Wohnen in Deutschland: Miete vs. Eigentum*.
- A1/05 — *Pünktlichkeit: Wie deutsch ist das Klischee?*
- A1/06 — *Vereine: das Rückgrat der deutschen Freizeitkultur*.
- …

### 2.11 Section 10 — Lernstrategie

A 3-day study plan with specific, time-boxed tasks:

```
### Tag 1 (30 min) — Erstkontakt
- [task 1]
- [task 2]
- [task 3]

### Tag 2 (30 min) — Vertiefung
- [task 1]
- [task 2]
- [task 3]

### Tag 3 (30 min) — Prüfungsvorbereitung
- [task 1]
- [task 2]
- [task 3]
```

Each task references a specific section of the lesson (e.g. "Dialog A laut
lesen", "Block A1–A4", "Mini-Geschichte §5"). No vague advice.

### 2.12 Section 11 — Outro

A single `➡️` line pointing to `exercises.md`. Identical to v1.

---

## 3. Frontmatter (required)

The v2 lesson file must include a frontmatter block at the top (above the
H1). This is the **lesson content collection** schema; without it, the web
build will not pick up the file properly.

```yaml
---
level: A1
number: 1
slug: erste-kontakte
title: Erste Kontakte
titleEn: First Contacts
canDo:
  - greet people and introduce yourself
  - ask others where they're from and what languages they speak
  - count from 0 to 20
grammar:
  - personal pronouns
  - the verb sein
  - regular verbs in the present
buildsOn: []
---
```

The H1 below the frontmatter is the rendered title; it can be more verbose
than `title` (e.g. include the English translation in parentheses for
A1–A2 only).

For `lesson-short.md` the same frontmatter is required (same schema,
identical values). The page uses the frontmatter from `lesson.md` if both
exist; the Short file's frontmatter is for consistency only.

### Frontmatter YAML gotcha — colons inside `buildsOn` values

YAML parses an unquoted string containing `: ` as a key-value mapping.
Any `buildsOn` entry whose lesson title contains a colon — e.g.
`B1/04 (Das Passiv: Vorgang und Zustand)` — **must be quoted**:

```yaml
buildsOn:
  - B2/01 (Nominalstil und Verbalstil)   # no colon → bare string OK
  - "B1/04 (Das Passiv: Vorgang und Zustand)"  # colon → must quote
```

Forgetting the quotes causes an `InvalidContentEntryDataError` in the
Astro build (`buildsOn.N: Expected type "string", received "object"`).
The same rule applies to `grammar` and `canDo` entries. When in doubt,
quote any list value that contains `:`.

---

## 4. Hard constraints (v2)

In addition to the constraints in `AUTHORING.md`:

- **Mini-Geschichte scope.** Only vocab + grammar from the current lesson and
  earlier lessons. No future structures, no marked chunks (mark as chunk if
  you must).
- **Lesetext and Mini-Geschichte must differ.** Different situation,
  different sentence openings, ideally different characters or location.
- **Häufige Fehler pairs must be real errors.** The ✅ form must be
  grammatically correct, not just "more idiomatic". Cross-check against a
  reference if uncertain.
- **Versuch es selbst prompts must elicit the rule.** "Schreib über deine
  Familie" is not specific enough. "Schreib 3 Sätze über deine Familie mit
  *heißen* + Name, *kommen aus* + Land, *wohnen in* + Stadt" is.
- **Magazin tone.** Not a Wikipedia summary. Not a lecture. A 100-word
  opinionated aside from someone who's lived in Germany.
- **Lernstrategie tasks must reference lesson sections by name.** No generic
  "study the grammar" advice.

---

## 5. File mapping and naming

```
<LEVEL>/<NN-slug>/
├── lesson.md            ← v2 Full prose lesson (this spec)
├── lesson-short.md      ← v1 analytical reference (AUTHORING.md)
├── exercises.yml        ← single source for the exercise battery
├── exercises.md         ← generated by gen-exercises
├── solutions.md         ← generated by gen-exercises
└── audio/*.mp3          ← generated by generate_audio.py
```

When migrating a v1 lesson directory:

1. `mv lesson.md lesson-short.md`
2. Add the frontmatter block to `lesson-short.md` (it didn't have one in v1).
3. Write a new `lesson.md` per this spec.

When authoring a brand-new B1+ lesson:

1. Write `lesson.md` per this spec.
2. If the user is an analytical learner who also wants the Short view, write
   `lesson-short.md` per `AUTHORING.md` afterwards. Otherwise skip it.

---

## 6. Web toggle — implementation notes

The web build (`web/src/pages/[level]/[lesson]/index.astro`) renders both
files on the same page. A small client-side script in
`web/src/layouts/LessonLayout.astro` controls the toggle:

- `<section data-view="full">` wraps the Full content.
- `<section data-view="short">` wraps the Short content (hidden by default).
- The toggle button (`<button data-toggle>`) flips `hidden` on the two
  sections.
- `localStorage.germanLessonView` persists the choice.
- `?view=short` URL parameter overrides `localStorage` (and the layout
  reads it on first render to set the initial visibility — SSR renders
  Full, then the inline script applies the URL override on hydration).

A lesson with **only** `lesson.md` (no `lesson-short.md`):

- The Short section is not rendered at all.
- The toggle button is hidden.
- The page is single-view Full.

A lesson with **only** `lesson-short.md` (legacy A1/A2, no Full yet):

- The Full section is not rendered.
- The toggle button is hidden.
- The page is single-view Short.

The schema for the `lessons-short` content collection is the same as
`lessons` (the loader glob pattern is `*/*/lesson-short.{md,mdx}`).

---

## 7. Definition of done (v2)

In addition to the v1 definition of done in `AUTHORING.md`:

- [ ] All 11 sections present in `lesson.md`, in order.
- [ ] Each §6 subsection has all 6 sub-parts (Warum?, Examples, Häufige
      Fehler, Lerntipp, Versuch es selbst, Merkasten). 6.5 pronunciation may
      omit Versuch es selbst and Merkasten.
- [ ] §5 Mini-Geschichte is 200–280 words and uses only known vocab/grammar.
- [ ] §5 is different from §7 Lesetext in scene / situation / characters.
- [ ] §9 Magazin is 80–120 words, opinionated tone, no Wikipedia-summary feel.
- [ ] §10 Lernstrategie is a 3-day plan with section-referencing tasks.
- [ ] Frontmatter block present and valid.
- [ ] If `lesson-short.md` also exists: dialogs, Hörtext, and Wortschatz
      agree word-for-word between the two files.

---

## 8. Dispatch template (for the orchestrator)

When fanning out Full-lesson writes, give each agent a prompt like:

> Read `/…/german-learning/AUTHORING-V2.md` and
> `/…/german-learning/docs/lesson-v2-spec.md` fully before writing anything.
> Your assigned topic is **<LEVEL>/<NN-slug> — <title>** (see its row in
> `CURRICULUM.md`). Also read `personas/README.md` and the persona files for
> any characters you will use.
>
> Produce **two** hand-authored files in that folder:
> 1. `lesson.md` (the v2 Full prose lesson, per this spec).
> 2. `lesson-short.md` (the v1 analytical reference, per `AUTHORING.md`).
>
> If only `lesson.md` is requested (or only the Short), produce just that
> one file. Do not produce both unless asked.
>
> Do not hand-write `exercises.md` or `solutions.md` — they are generated
> from `exercises.yml` by `npx tsx build/gen-exercises.ts <dir>`. Do not
> run `generate_audio.py`. Do not commit. Report back: word count for
> `lesson.md` and `lesson-short.md`, and any scope conflicts with
> neighboring topics.
