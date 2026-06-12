# AUTHORING.md — Lesson production spec (read this before writing any lesson)

This file is the **complete, self-contained brief** for producing one lesson of
this course. An agent given only this file + `CURRICULUM.md` + the reference
lessons must be able to produce a correct lesson without any other context.

## Your task

Produce exactly three files in `<LEVEL>/<NN-slug>/` (folder name comes from the
work item in `tasks/todo.md`):

1. `lesson.md` — the class
2. `exercises.md` — the five-block exercise battery (H + A + B + C + D)
3. `solutions.md` — the full answer key

## Required reading, in this order

1. **This file**, fully.
2. **`personas/README.md`** + every persona file for any character you will use.
   The `personas/` directory is the single source of truth for character facts
   (name, nationality, origin city, family, voice). Do not invent facts that
   contradict a persona — edit the persona file first if you need a new detail.
3. **`CURRICULUM.md`** — your topic's row (grammar, vocab, can-do) **and every
   earlier row of the same and lower levels**. Earlier rows define what the
   learner already knows; your row defines what you may introduce.
4. **Reference lessons (gold standard):** `A1/01-erste-kontakte/` and
   `A1/03-essen-und-trinken/` — match their structure, tone, density, and
   formatting exactly. For B1+ topics also skim the latest completed lesson of
   your level if one exists (check `tasks/todo.md` for checkmarks).

## Recurring characters

Always use these characters consistently. Origin facts are fixed — never change
them without editing the persona file first.

| Character | Role | Origin | Voice key |
|---|---|---|---|
| **Anna** | main female student (informal scenes) | Russia, Jaroslawl | `Anna` |
| **Bruno** | main male student (informal scenes) | Brazil, Blumenau (Santa Catarina) | `Bruno` |
| **Frau Weber** | formal female interlocutor | German | `Frau Weber` |
| **Herr Friedrich Steinmeyer** | formal male interlocutor | Austria, Salzburg | `Herr Steinmeyer` |
| **Yuki Tanaka** | supporting student (A1 Hörtext) | Japan, Osaka | `Yuki` |

Additional characters: see `personas/` for Familie Yilmaz, Herr Wegner, etc.

## Hard constraints

- **Scope discipline:** use ONLY grammar and vocabulary from your curriculum row
  and earlier rows. If you genuinely need a future structure (e.g., a polite
  `Ich hätte gern…` before Konjunktiv II is taught), introduce it explicitly as
  a **chunk** with a footnote naming the lesson where it will be explained —
  see `A1/02 lesson.md` ("Chunk alert") for the pattern.
- **Recycling:** Block D must contain ≥20% review material drawn from earlier
  topics. Base review items on the earlier topics' **curriculum rows** (their
  grammar/vocab columns), not on guesses — this keeps parallel-written lessons
  consistent even when you can't read a neighbor lesson that is being written
  at the same time. Label recycled items with the source, e.g. `(L2)`.
- **Nouns always appear with article AND plural** in vocabulary tables:
  `die Schwester, -n`.
- **Instruction language by level:** A1–A2 English · B1 mixed English/German
  (German for instructions the learner has seen, English for new grammar
  explanations) · B2–C1 German only.
- **German correctness is non-negotiable.** After drafting, do a dedicated
  self-review pass over every German sentence: verb position, case endings,
  gender, capitalization of nouns, e→i stem changes. One wrong solution poisons
  the learner's memory.
- **Answer keys must be unambiguous.** If an exercise gap admits two answers,
  either fix the exercise or list both in the solution ("also fine: …"). In
  Sprachbausteine word banks, verify no bank word fits two gaps and no gap
  needs a word twice.

## File 1 — `lesson.md` structure

```
# <LEVEL> · Lektion <N> — <German title> (<English title, A1–A2 only>)

> You will learn to: … (can-do list from curriculum row)
> Grammar: …
> Builds on: … (explicit pointers to earlier lessons)

## 1. Dialog(e)        — 1–2 model dialogues introducing the topic in context;
                         informal AND formal variant where relevant
## 2. Redemittel       — ready-made phrase tables (German | English), grouped by function
## 3. Wortschatz       — thematic vocabulary tables; nouns with article + plural;
                         verbs marked ⚠️ if irregular
## 4. Grammatik        — each grammar point from scratch: rule, table, examples,
                         ⚠️ warnings for traps and L1-interference errors
                         (Portuguese/Spanish/English interference especially)
## 5. Lesetext         — short reading text using ONLY known material
                         (it is reused in exercises Block C — Lesen)
## 6. Hörtext          — 4–6 sentence story (see Tier 3 below); reused in Block H
## 7. Lernstrategie    — one concrete study tip tied to this topic
➡️ pointer to exercises.md
```

Include a short **pronunciation section** inside `## 4. Grammatik` for A1–A2
lessons (new sounds/letters that appear in this lesson's vocabulary).

### Dialog formatting rules

Every `> **Speaker:** Text` line **must end with two trailing spaces** (`  `)
to produce a line-break in CommonMark renderers. Exception: `Hör zu` word-list
lines and flowing Hörtext paragraph lines (no trailing spaces needed there).

```markdown
> **Anna:** Hallo! Ich heiße Anna. Und wie heißt du?  
> **Bruno:** Hallo, Anna. Ich bin Bruno.  
> **Anna:** Woher kommst du, Bruno?  
```

When a `## 1. Dialog` section contains **two distinct conversations** (e.g.
informal + formal variant), use `### Dialog A:` / `### Dialog B:` sub-headers
instead of a flat layout. The audio generator detects these and produces
separate `dialog1_a.mp3` / `dialog1_b.mp3` clips:

```markdown
## 1. Dialog: Im Deutschkurs

### Dialog A: Informell — du

> **Anna:** Hallo! …  
> **Bruno:** Hallo, Anna. …  

### Dialog B: Formell — Sie

> **Frau Weber:** Guten Tag! …  
> **Herr Steinmeyer:** Guten Tag, Frau Weber. …  
```

### Audio in lesson.md

Every lesson ships audio generated by `scripts/generate_audio.py`. Authors write
the source markers; the generator creates the MP3s and patches in the 🎧 links.
**Do not write 🎧 links yourself** — the generator adds them automatically.

After writing (or editing) a lesson file, run:

```bash
python3 scripts/generate_audio.py A1/NN-slug/lesson.md
# For exercises with Transcript blocks:
python3 scripts/generate_audio.py A1/NN-slug/exercises.md
```

The generator skips files that already have an MP3 on disk. To force
regeneration (e.g. after editing dialog text), delete the relevant MP3 first:

```bash
rm A1/NN-slug/audio/dialog1_a.mp3
python3 scripts/generate_audio.py A1/NN-slug/lesson.md
```

**Speaking speed is configured per level** in `scripts/audio_config.json`
under `level_speeds`: A1 = 0.85×, A2 = 0.90×, B1/B2 = 1.00×, C1 = 1.05×.
The generator infers the level from the file path automatically.

---

**Tier 1 — Pronunciation clips (A1/01–A1/04 only)**

Add a `### 🔊 Aussprache` sub-section inside `## 3. Wortschatz`. One `Hör zu`
line per thematic group, items separated by ` · `:

```markdown
### 🔊 Aussprache

> **Hör zu 1 — Begrüßungen:** Guten Morgen · Guten Tag · Guten Abend · Gute Nacht
> **Hör zu 2 — Zahlen 0–10:** null · eins · zwei · drei · vier · fünf · sechs · sieben · acht · neun · zehn
```

The generator produces one MP3 per group (announcer voice, 400 ms pause between
items, no background noise) and patches lesson.md with 🎧 links.
Stop at A1/04 — by then pronunciation is assumed to be established.

---

**Tier 2 — Dialogue audio (all lessons, all levels)**

The model dialogues use `> **Speaker:** Text  ` blockquote format (trailing
double-space mandatory — see above). The generator auto-detects `## 1. Dialog`
headers (and `### Dialog A/B` sub-headers), collects speaker turns, and
produces `dialog1.mp3` or `dialog1_a.mp3` / `dialog1_b.mp3` with per-speaker
voices and context-appropriate background ambience.

Minimum 2 turns required for a clip to be generated (the guard prevents
written artefacts like emails or notices from being mistaken for dialogs).

---

**Tier 3 — Hörtext (all lessons, all levels)**

Every lesson has a `## 6. Hörtext` section: a 4–6 sentence story on the lesson
topic, using **only** known material. Write it as a flowing blockquote paragraph
(no trailing double-spaces — it flows as one continuous text):

```markdown
## 6. Hörtext

> Anna kommt aus Russland, aus Jaroslawl. Sie wohnt jetzt in Berlin und
> lernt Deutsch. Ihr Kurs hat zwanzig Studenten. Die Lehrerin heißt Frau
> Schmidt. Anna findet den Kurs super.
```

The generator reads it aloud as a single announcer voice with 1.2 s pauses
between sentences, no background, producing `hoertext.mp3`. The audio is
reused in Block H as a **Hörtext-Lückentext** (see exercises spec below).

---

## File 2 — `exercises.md` — the five-block architecture

Target: **28–32 exercises, 180–220+ scoreable items** across Blocks A–D.
Block H is additional and not counted toward that target.

Open with the block overview table + advice to spread blocks over several days
(copy the pattern from `A1/03-essen-und-trinken/exercises.md`).

### Block H — Hören (comes FIRST, before Block A; not counted in 28–32 target)

Block H contains **up to three exercise types**, mixed as fits the lesson:

**H1 — Dialog Hör-Check** (every lesson)
One exercise per dialog clip. If the lesson has `dialog1_a` + `dialog1_b`,
write one H1a and one H1b exercise, or combine into one exercise with labeled
sub-parts. Each exercise: 2–4 comprehension items (Richtig/Falsch or
single-choice). Students listen to the MP3, then answer.

Example format:
```
### H1 — Dialog Hör-Check

🎧 **Audio:** [dialog1_a.mp3](audio/dialog1_a.mp3)

Listen and decide: **Richtig (R)** oder **Falsch (F)**?

1. Anna kommt aus Russland. ___
2. Bruno wohnt in München. ___
```

**H2 — Aussprache-Check** (A1/01–04 only, Tier 1 lessons)
Match-the-sound or circle-the-word exercises anchored on the `Hör zu` clips.

**H3 — Hörtext-Lückentext** (every lesson)
Students listen to `hoertext.mp3` and fill 5–8 gaps from a small word bank
(correct words + 2–3 distractors). The gap text is the Hörtext with key
content words blanked out.

### Block A — Basistraining (10–12 exercises)

Single-form drills: conjugation tables, fill-ins, substitution drills,
transformation drills. Each new grammar point drilled 4–6 times in different
formats. Repetitive on purpose — automatization requires ≥50 encounters.

### Block B — Vertiefung (8–10 exercises)

Mixed application: dialogue completion, **Finde den Fehler** (built from real
L1-interference mistakes), question–answer matching, Satzbau (word order),
categorizing, answering with cues, writing questions, EN→DE translation (A1–A2).

### Block C — Prüfungstraining (5–6 exercises)

Strictly telc/Goethe exam formats:

| Sub-exercise | Format | Items |
|---|---|---|
| C1 Lückentext | 10 gaps, free fill | 10 |
| C2 Sprachbausteine Teil 1 | 6 gaps, 3 options each (a/b/c) | 6 |
| C3 Sprachbausteine Teil 2 | word bank: 15 words, 10 gaps, 5 distractors | 10 |
| C4 Lesen | lesson Lesetext (R/F) + a NEW second text (multiple choice) | 8–10 |
| C5 Schreiben | guided writing task; length grows with level | 1 |

### Block D — Wiederholung & Selbsttest (3–5 exercises)

| Sub-exercise | Format | Items |
|---|---|---|
| D1 Schnelltest | mixed quick test incl. ≥20% earlier-lesson items marked `(L<n>)` | 15 |
| D2 Odd-one-out | groups of 4 words, circle the one that doesn't belong | 6 |
| D3 Rückblick | review items from 2–3 earlier lessons | 10 |
| D4 Selbsttest | scored /20, pass threshold 16+, concrete retry advice | 20 |

From B1 upward, adapt formats to level (transformations Aktiv→Passiv,
Nominalstil→Verbalstil, Konnektoren rewriting; writing tasks become e-mails,
forum posts, Erörterungen; reading texts get longer and authentic-style).

**Exam-training lessons** (each level's last topic, e.g. `A1/14`) replace this
entire structure with a full-length mock exam in the level's official format
(Goethe/telc) — all four skills (Hören, Lesen, Schreiben, Sprechen), full
scoring grid, and a detailed answer key. Do these solo, not in a parallel batch.

---

## File 3 — `solutions.md`

- Mirrors every exercise number and block, in order — Block H first, then A–D.
- Bold the answer where helpful; add a one-line explanation for every item that
  involves a trap or where learners typically err.
- Accept alternatives explicitly ("also fine: …").
- For C5 Schreiben: provide a model answer + a short self-check list.
- End with the Selbsttest threshold: **16+/20 → next Lektion**, otherwise which
  Block-A exercises to redo.

---

## Definition of done (check before finishing)

- [ ] All three files exist; structure matches the reference lessons
- [ ] Recurring characters match their persona files (origin, name, voice)
- [ ] Block H present in exercises.md and solutions.md
  - [ ] H1 Dialog Hör-Check: one sub-exercise per dialog clip (1_a / 1_b if split)
  - [ ] H3 Hörtext-Lückentext: 5–8 gaps, word bank with 2–3 distractors
  - [ ] H2 Aussprache-Check: A1/01–04 only
- [ ] Tier 1 only (A1/01–04): `### 🔊 Aussprache` with `Hör zu` lines in Wortschatz
- [ ] Tier 3 (all lessons): `## 6. Hörtext` with 4–6 sentence flowing blockquote
- [ ] All `> **Speaker:** Text` dialog lines end with two trailing spaces (`  `)
- [ ] Multi-dialog sections use `### Dialog A:` / `### Dialog B:` sub-headers
- [ ] Audio generated: run `python3 scripts/generate_audio.py lesson.md exercises.md`
- [ ] Exercise count ≥28, item count ≥180 (Block H not counted)
- [ ] Every exercise has a solution; numbering matches exactly
- [ ] C3 word bank verified: each word fits exactly one gap; 5 distractors present
- [ ] No grammar/vocab from future topics except marked chunks
- [ ] Block D labels recycled items with source lesson numbers (`(L<n>)`)
- [ ] Self-review pass for German correctness done
- [ ] Checkbox ticked in `tasks/todo.md`; status updated in `CURRICULUM.md` + `README.md`
      (sub-agents: leave git and status updates to the orchestrator)

---

## Dispatch template (for the orchestrator)

When fanning out, give each agent a prompt like:

> Read `/…/german-learning/AUTHORING.md` fully before writing anything. Your
> assigned topic is **<LEVEL>/<NN-slug> — <title>** (see its row in
> `CURRICULUM.md`). Also read `personas/README.md` and the persona files for
> any characters you will use. Produce the three files in that folder. Do not
> modify any other files, do not run `generate_audio.py`, do not commit.
> Report back: exercise count, item count, and any scope conflicts with
> neighboring topics.

Lessons within one level build on each other, but writing them **in parallel is
safe** as long as each agent respects scope discipline via the curriculum rows.
After a parallel batch, the orchestrator must:
1. Do a consistency pass (no cross-batch scope leaks, recurring characters
   consistent across all new lessons, exercise numbering/solutions match).
2. Run `python3 scripts/generate_audio.py` on each new `lesson.md` and
   `exercises.md` to generate all audio clips.
3. Tick checkboxes in `tasks/todo.md`, update status lines in `CURRICULUM.md`
   and `README.md`.
4. Commit the batch (one commit per lesson or one per batch) and push.
