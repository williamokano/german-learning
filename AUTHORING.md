# AUTHORING.md — Lesson production spec (read this before writing any lesson)

This file is the **complete, self-contained brief** for producing one lesson of
this course. An agent given only this file + `CURRICULUM.md` + the reference
lessons must be able to produce a correct lesson without any other context.

## Your task

Produce exactly three files in `<LEVEL>/<NN-slug>/` (folder name comes from the
work item in `tasks/todo.md`):

1. `lesson.md` — the class
2. `exercises.md` — the four-block exercise battery
3. `solutions.md` — the full answer key

## Required reading, in this order

1. **This file**, fully.
2. **`CURRICULUM.md`** — your topic's row (grammar, vocab, can-do) **and every
   earlier row of the same and lower levels**. Earlier rows define what the
   learner already knows; your row defines what you may introduce.
3. **Reference lessons (gold standard):** `A1/01-erste-kontakte/` and
   `A1/03-essen-und-trinken/` — match their structure, tone, density, and
   formatting exactly. For B1+ topics also skim the latest completed lesson of
   your level if one exists (check `tasks/todo.md` for checkmarks).

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
## 6. Lernstrategie    — one concrete study tip tied to this topic
➡️ pointer to exercises.md
```

Include a short **pronunciation section** inside Grammatik for A1–A2 lessons
(new sounds/letters that appear in this lesson's vocabulary).

## File 2 — `exercises.md` — the four-block architecture

Target: **28–32 exercises, 180–220+ scoreable items.** Never ship below this
(rule from `tasks/lessons.md`, 2026-06-11). Open with the block table + advice
to spread blocks over several days (copy the pattern from A1/03).

| Block | Content | Size |
|---|---|---|
| **A — Basistraining** | Single-form drills: conjugation tables, fill-ins, substitution drills, transformation drills. Each new grammar point drilled 4–6 times in different formats. Repetitive on purpose. | 10–12 exercises |
| **B — Vertiefung** | Mixed application: dialogue completion, **Finde den Fehler** (build errors from real interference mistakes), question–answer matching, Satzbau (word order), categorizing, answering with cues, writing questions, EN→DE translation (A1–A2) | 8–10 exercises |
| **C — Prüfungstraining** | telc/Goethe formats: C1 Lückentext (10 gaps) · C2 Sprachbausteine Teil 1 (6 gaps, 3 options each) · C3 Sprachbausteine Teil 2 (word bank: 15 words, 10 gaps, 5 distractors) · C4 Lesen (the lesson's Lesetext with R/F + a NEW second text with multiple choice) · C5 Schreiben (guided writing; length grows with level) | 5–6 exercises |
| **D — Wiederholung & Selbsttest** | D1 mixed quick test (15 items, incl. earlier-lesson items marked `(L<n>)`) · D2 odd-one-out (6) · D3 review of earlier lessons (10) · D4 scored Selbsttest (/20) with pass threshold 16+ and concrete retry advice | 3–5 exercises |

From B1 upward, adapt formats to level (e.g., transformations Aktiv→Passiv,
Nominalstil→Verbalstil, Konnektoren rewriting; writing tasks become e-mails,
forum posts, Erörterungen; reading texts get longer and authentic-style).
Exam-training lessons (each level's last topic) replace this structure with a
full mock exam in the level's official format (Goethe/telc) — all four skills,
with an answer key and scoring grid.

## File 3 — `solutions.md`

- Mirrors every exercise number, block by block.
- Bold the answer where helpful; add a one-line explanation for every item that
  involves a trap or where learners typically err.
- Accept alternatives explicitly ("also fine: …").
- For C5 Schreiben: provide a model answer + a short self-check list.
- End with the Selbsttest threshold: **16+/20 → next Lektion**, otherwise which
  Block-A exercises to redo.

## Definition of done (check before finishing)

- [ ] All three files exist; structure matches the reference lessons
- [ ] Exercise count ≥28, item count ≥180
- [ ] Every exercise has a solution; numbering matches exactly
- [ ] Word banks verified: each word fits exactly one gap; 5 distractors
- [ ] No grammar/vocab from future topics except marked chunks
- [ ] Block D labels recycled items with source lesson numbers
- [ ] Self-review pass for German correctness done
- [ ] Checkbox ticked in `tasks/todo.md`; status line updated in `CURRICULUM.md`
      and `README.md` if you are the orchestrator (sub-agents: leave git and
      status updates to the orchestrator)

## Dispatch template (for the orchestrator)

When fanning out, give each agent a prompt like:

> Read `/…/german-learning/AUTHORING.md` and follow it exactly. Your assigned
> topic is **<LEVEL>/<NN-slug> — <title>** (see its row in `CURRICULUM.md`).
> Produce the three files in that folder. Do not modify any other files, do not
> commit. Report back: exercise count, item count, and any scope conflicts you
> noticed with neighboring topics.

Lessons within one level build on each other, but writing them **in parallel is
safe** as long as each agent respects scope discipline via the curriculum rows.
After a parallel batch, the orchestrator must do a consistency pass: check that
no lesson teaches another batch-member's new grammar as if unknown, that
recurring characters (Anna, Bruno, Familie Yilmaz…) stay consistent, then
commit the batch as one commit per lesson or one per batch.
