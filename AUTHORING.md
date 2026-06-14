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

### Multiple-choice option formatting

In CommonMark, lines indented under a numbered list item merge into one
paragraph unless each line ends with **two trailing spaces** (`  `). This
affects every multiple-choice exercise (H1b, H4, C2, C4, D4):

```markdown
1. Warum ruft Anna an?  
   a) Sie kann Bruno nicht abholen.  
   b) Sie kommt ein bisschen später.  
   c) Sie sucht einen Kollegen.
```

**Rule:** add `  ` (two trailing spaces) after the question line and after
every option line **except the last one** (`c)` or the final option in the
group), which is already followed by a blank line.

This applies to **every** MC exercise in exercises.md. Without the trailing
spaces, options `a)` and `b)` run on as a single paragraph.

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

Every lesson has a `## 6. Hörtext` section. The Hörtext **must be a different
scene from the Lesetext** — same character universe, different situation, so
exercises based on each text test genuinely different content.

**Design rule — Lesetext vs. Hörtext:**
- **Lesetext (§5):** longer reading text; students read and re-read at leisure.
  Used in Block C exercises (Lesen).
- **Hörtext (§6):** shorter 4–6 sentence story heard only (transcript hidden);
  different situation, possibly different characters or location from Lesetext.
  Used in Block H3 (Hörtext-Lückentext). Students listen, then open the spoiler
  to check.

**Character consistency check:** before writing, verify that any named
characters' cities and facts match their persona files in `personas/`. Do not
put Berlin-based Anna or Bruno in a München scene, or vice versa.

Write the transcript as a flowing blockquote (no trailing double-spaces).
Wrap it in a `<details>` spoiler so the student cannot read before listening:

```markdown
## 6. Hörtext

*Hör zu und mach Übung H3. Öffne das Transkript erst nach dem Hören!*

🎧 **Audio:** [hoertext.mp3](audio/hoertext.mp3)

<details>
<summary>📄 Transkript (erst nach dem Hören öffnen!)</summary>

> Sentence one. Sentence two. Sentence three.
> Sentence four. Sentence five.

</details>
```

The generator finds the blockquote inside the `<details>` tag automatically.
It reads it aloud as a single announcer voice with 1.2 s pauses between
sentences, no background, producing `hoertext.mp3`. The audio is reused in
Block H as a **Hörtext-Lückentext** (see exercises spec below).

---

## File 2 — `exercises.md` — the five-block architecture

Target: **28–32 exercises, 180–220+ scoreable items** across Blocks A–D.
Block H is additional and not counted toward that target.

Open with the block overview table + advice to spread blocks over several days
(copy the pattern from `A1/03-essen-und-trinken/exercises.md`).

### Block H — Hören (comes FIRST, before Block A; not counted in 28–32 target)

Block H contains **four exercise types** (H1, H3, H4 every lesson; H2 A1/01–04 only):

**H1 — Dialog Hör-Check** (every lesson)
One exercise per dialog clip. If the lesson has `dialog1_a` + `dialog1_b`,
write one H1a and one H1b exercise, or combine into one exercise with labeled
sub-parts. Each exercise: 3–5 comprehension items (Richtig/Falsch or
single-choice). Students listen to the MP3, then answer.

Example format:
```
## Übung H1a — Dialog Hör-Check: Dialog A (informell)

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

**H4 — Kurze Ansage** (every lesson from A1 onwards)
A short audio clip (4–6 sentences) in a realistic context — voicemail,
phone message, PA announcement, radio news snippet, recorded notice. Students
listen and answer 3–4 single-choice or Richtig/Falsch comprehension questions.
The format tests "extract specific information" — the skill the telc/Goethe
Hören Teil 1 exams directly test.

*Content rules:* the Ansage must be a different context from both Dialog and
Hörtext. Good contexts: voicemail, phone message, answerphone, PA announcement,
shop/store ad, radio programme clip. Keep it short — learners should be able to
answer all questions after one listen (maximum two).

*Audio production:* the transcript lives in exercises.md (not lesson.md) inside
a `<details>` spoiler. Use the `**Ansage 1 — Transcript**` marker so the audio
generator detects it and produces `transcript_ansage1.mp3`. Because the
generator patches the file by inserting a `🎧` link above the `**Ansage N —
Transcript**` header, you MUST pre-write a `🎧` link 2 lines before that header
(inside the spoiler) AND a matching `🎧` link at the very top of H4 (before the
questions) so the student can find the player. The two links must point to the
same filename (`transcript_ansage1.mp3`). This also suppresses the generator
from trying to patch again (it checks 3 lines back for an existing `🎧`).

To trigger the correct audio post-effect (phone filter = highpass/lowpass
telephone sound), include "Bitte ruf mich zurück" or "Anrufbeantworter" in the
voicemail text. For PA announcements include "Achtung, eine Durchsage".

Example H4 structure (copy exactly — whitespace matters for the generator):

```markdown
## Übung H4 — Kurze Ansage: [short title]

🎧 **Audio:** [transcript_ansage1.mp3](audio/transcript_ansage1.mp3)

Listen to the voice message. Then choose the correct answer (a, b, or c).

1. Warum ruft [X] an?
   a) ...   b) ...   c) ...

2. ...

3. ...

<details>
<summary>📄 Transkript (erst nach dem Hören öffnen!)</summary>

🎧 **Audio:** [transcript_ansage1.mp3](audio/transcript_ansage1.mp3)

**Ansage 1 — Transcript**

> [The 4–6 sentence transcript. Include "Bitte ruf mich zurück" for phone filter.]

</details>
```

After writing H4, run: `python3 scripts/generate_audio.py <lesson>/exercises.md`
(separate from the lesson.md run — exercises.md audio is generated independently).

### Block A — Basistraining (10–12 exercises)

Single-form drills: conjugation tables, fill-ins, substitution drills,
transformation drills. Each new grammar point drilled 4–6 times in different
formats. Repetitive on purpose — automatization requires ≥50 encounters.

### Block B — Vertiefung (8–10 exercises)

Mixed application: dialogue completion, **Finde den Fehler** (built from real
L1-interference mistakes), question–answer matching, Satzbau (word order),
categorizing, answering with cues, writing questions, EN→DE translation (A1–A2).

**B9 — Contextualized writing task** (last exercise in Block B; replaces
the older free-form "write 4–5 sentences" prompt). B9 is the low-stakes
rehearsal for C5 Schreiben: same communicative goal, less structure,
no model answer.

*Format (copy exactly):*

```markdown
## Übung B9 — [short situation title]

**[Genre]** *(one of: WhatsApp-Nachricht / E-Mail / Chatnachricht / Forenbeitrag / Kurze Notiz)*:
> [2–4 sentence stimulus — a message you received, a photo description,
> a forum post, a news snippet, a colleague's email. Sets up the writing
> task by giving concrete content the student reacts to.]

**Your task:** Write **[N]** sentences in German in reply. [One-sentence
description of what the reply should accomplish — e.g. "Tell them about
your own plans", "Describe the new colleague", "Recommend what to do".]

Use:
- [ ] [Structure 1 — e.g. "2 sentences with `werden` + Infinitiv"]
- [ ] [Structure 2 — e.g. "1 sentence with a `wenn`-clause"]
- [ ] [Structure 3 — e.g. "1 polite closing phrase"]

**Self-check before moving on:**
- [ ] [Form check 1 — e.g. "Did I put the verb at the end of each
      subordinate clause?"]
- [ ] [Form check 2 — e.g. "Did I use a comma before each subordinate
      clause?"]
```

*Content rules:*

- **Length:** A1 = 3–4 sentences. A2 = 4–5 sentences. B1+ = 5–6 sentences.
- **Genre** should fit the lesson topic (WhatsApp for personal topics,
  E-Mail for workplace topics, etc.) and the level (A1 = very informal
  chat; A2 = WhatsApp or short email; B1+ = fuller email or forum post).
- **The stimulus** is the key element: it must be a *different* voice
  than the lesson's Dialog A/B speakers (so students don't just
  paraphrase). Reuse lesson personas as the writer of the stimulus if
  it fits (e.g. a classmate sending a WhatsApp about plans).
- **Required structures** in the "Use" list pull from the lesson's
  grammar/vocab — at least 2 structures from the current lesson, 1
  from an earlier lesson. The list is the self-imposed constraint
  that turns "write sentences" into a targeted production task.
- **Self-check** checks *form* (did you do the grammar right?), not
  *content* (did you say something sensible?). Form checks should be
  specific to the structures the lesson taught.
- **A1 lessons** drop the stimulus and use a simpler prompt: "Write
  [N] sentences about [topic]. Use: [list]. Self-check: [form checks]."
  A1 students aren't ready for full email/chat conventions yet.

*Why this format:* students who only get "write 4 sentences" produce
vague, low-retention output. A concrete stimulus + a structure checklist
+ a self-check convert B9 into a *targeted* production task that
rehearses lesson grammar in a real communicative context.

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
  - [ ] H2 Aussprache-Check: A1/01–04 only
  - [ ] H3 Hörtext-Lückentext: 5–8 gaps, word bank with 2–3 distractors
  - [ ] H4 Kurze Ansage: 3–4 MC/R-F questions, `**Ansage 1 — Transcript**` in `<details>`,
        pre-written `🎧` link both at exercise top AND 2 lines before transcript header
- [ ] Tier 1 only (A1/01–04): `### 🔊 Aussprache` with `Hör zu` lines in Wortschatz
- [ ] Tier 3 (all lessons): `## 6. Hörtext` with `<details>` spoiler, 4–6 sentences
  - [ ] Hörtext scene is DIFFERENT from the Lesetext scene
  - [ ] Named characters' cities/facts verified against `personas/`
- [ ] All `> **Speaker:** Text` dialog lines end with two trailing spaces (`  `)
- [ ] Multi-dialog sections use `### Dialog A:` / `### Dialog B:` sub-headers
- [ ] Audio generated: run `python3 scripts/generate_audio.py lesson.md` THEN
      `python3 scripts/generate_audio.py exercises.md` (H4 Ansage is in exercises.md)
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
