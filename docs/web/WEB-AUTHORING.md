# WEB-AUTHORING.md — authoring lessons & exercises for the web

The companion to the existing `AUTHORING.md`. That file still governs **what** a
lesson contains (the H/A/B/C/D battery, scope discipline, German correctness). This
file governs **how** you encode exercises as `exercises.yml` and how you embed
interactive bits in `lesson.md`. From B1 onward, author this way natively.

> **Golden rule:** `exercises.yml` is the single source of truth. You never
> hand-edit `exercises.md` or `solutions.md` — they are generated. Run the
> generator, then commit all three.

---

## 1. The authoring loop

```
1. write/​update  <dir>/lesson.md       (prose + inline <AudioPlay>)
2. write/​update  <dir>/exercises.yml    (the battery, with answers)
3. generate:
     tsx build/gen-exercises.ts <dir>                    # → exercises.md + solutions.md
     python3 scripts/generate_audio.py <dir>/lesson.md   # dialog/hoerzu/hoertext mp3s
     python3 scripts/generate_audio.py <dir>/exercises.md# H4 Ansage mp3
4. preview locally (pnpm -C web dev), check the widgets
5. commit lesson.md, exercises.yml, exercises.md, solutions.md, audio/*.mp3
```

Order matters: `gen-exercises` **before** `generate_audio.py` on exercises (the
audio script reads the generated `exercises.md`).

---

## 2. Lessons — embedding audio

Lessons are markdown. Keep them prose; the only inline components you may use are:

**Inline play button with a label** (a word/phrase the learner hears):
```mdx
Say <AudioPlay src="GutenTag.mp3">Guten Tag</AudioPlay> in the morning.
→ renders:  Say Guten Tag ▶ in the morning.
```

**Bare play button** (transcript already shown; you just want a control):
```mdx
🎧 <AudioPlay src="hoertext.mp3" />
→ renders:  🎧 ▶
```

**Spoiler** (native, closed by default) — for Hörtext/Ansage transcripts, hints:
```html
<details><summary>📄 Transkript (erst nach dem Hören öffnen!)</summary>
> … transcript …
</details>
```

When **NOT** to use `<AudioPlay>`: you do *not* need it for dialogs, `Hör zu`
pronunciation lines, the `Hörtext`, or the existing `🎧 **Audio:**` links — those are
**auto-enriched** into players by the build (the same patterns `generate_audio.py`
already understands; see `CONTENT-MODEL.md §6.3`). Use `<AudioPlay>` only for
**fine-grained, inline** audio (e.g. an A1 per-word pronunciation button) that has no
existing markdown convention.

`src` is the bare filename in the lesson's `audio/` folder. Generate the MP3 with the
existing audio pipeline (or, for one-off inline words, add a `Hör zu` line so the
generator produces it, then reference that file).

---

## 3. Exercises — one worked `exercises.yml` example per type

Full field reference: `CONTENT-MODEL.md §3`. Keep ids aligned with AUTHORING's block
architecture (H1–H4, A1–A12, B1–B10, C1–C5, D1–D4). Answers may be a string or a
list of accepted alternatives.

> **Standalone rule:** the exercises page must work entirely on its own — it cannot
> direct the learner to `lesson.md` for audio, context, or anything else. Every audio
> clip that a question depends on must be embedded directly in the exercise via the
> `audio` field (exercise-level or per-item). The learner may optionally revisit the
> lesson page for deeper study, but that is never a requirement for answering.

### `gap-text` — free-fill (default `layout: inline`)
```yaml
- id: C1
  block: C
  type: gap-text
  title: "Lückentext"
  instructions: "Fill each gap with **one** word."
  text: |
    Hallo! Ich {1} Carlos und ich {2} aus Spanien, aus Madrid.
    Jetzt {3} ich in Frankfurt.
  answers: { 1: heiße, 2: komme, 3: wohne }
```
A-block drill style (numbered list): set `layout: list` and number the lines.
```yaml
- id: A2
  block: A
  type: gap-text
  layout: list
  title: "`sein`: in sentences"
  text: |
    1. Ich {1} aus Brasilien.
    2. Du {2} sehr nett.
  answers: { 1: bin, 2: bist }
```
`Finde den Fehler` is `gap-text` where the answer is the corrected sentence; use an
alternatives list for "also fine" and `notes`/`why` for the explanation.

### `table-fill` — conjugation/grid
```yaml
- id: A1
  block: A
  type: table-fill
  title: "`sein`: conjugation table"
  columns: ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"]
  rows:
    - { label: "sein", cells: [
        { gap: 1, answer: bin }, { gap: 2, answer: bist }, { gap: 3, answer: ist },
        { gap: 4, answer: sind }, { gap: 5, answer: seid }, { gap: 6, answer: sind } ] }
```

### `gap-bank` — word bank (drag/click)
```yaml
- id: C3
  block: C
  type: gap-bank
  title: "Sprachbausteine Teil 2 (word bank)"
  instructions: "Fill the 10 gaps. **Five words are not needed.**"
  bankCase: upper          # C3 preset; H3 uses default lowercase + paren
  bankSort: true
  text: |
    — Ich {1} Frau Müller. {2} heißen Sie?
  bank: [BIN, WIE, IST, WOHER, AUS, IN, SPRECHEN, SIND, HEISST, DANKE, BIS, BIST, IHR, NICHT, WER]
  answers: { 1: BIN, 2: WIE }   # every value MUST be in `bank`
```

### `single-choice` — MCQ (`optionLayout: inline` default; `block` for listening)

**Exercise-level audio** (one shared clip, e.g. a dialog or Ansage):
```yaml
- id: H4
  block: H
  type: single-choice
  optionLayout: block
  title: “Kurze Ansage: Anruf von Petra”
  audio: transcript_ansage1.mp3        # one clip for the whole exercise
  transcript: “Hallo, hier ist Petra. … Bitte ruf mich zurück. … Meine Nummer ist vier-sieben-eins-eins.”
  items:
    - q: “Wessen Nachricht ist das?”
      options: [ {key: a, text: “Von Petra.”}, {key: b, text: “Von Anna.”}, {key: c, text: “Von Lisa.”} ]
      answer: a
```
(`transcript` makes `gen-exercises` emit the `<details>` + `**Ansage 1 — Transcript**`
block that `generate_audio.py` needs — `BUILD-PIPELINE.md §1.1`.)

**Per-item audio** (each question depends on its own clip — e.g. Hör-zu Aussprache-Check):
```yaml
- id: H1
  block: H
  type: single-choice
  title: “Aussprache-Check”
  instructions: “Höre den Clip und wähle die passende Antwort.”
  # No exercise-level audio — each item brings its own clip
  items:
    - q: “Begrüßungen — was sagst du am Morgen?”
      audio: hoerzu1.mp3               # per-item: rendered above the question
      options: [ {key: a, text: “Guten Abend”}, {key: b, text: “Guten Morgen”}, {key: c, text: “Gute Nacht”} ]
      answer: b
    - q: “Zahlen 0–10 — welche Zahl kommt nach vier?”
      audio: hoerzu4.mp3
      options: [ {key: a, text: “fünf”}, {key: b, text: “sechs”}, {key: c, text: “sieben”} ]
      answer: a
```
Use per-item audio whenever the items reference **different** audio clips. Never send the
learner back to `lesson.md` for audio they need to answer a question.

**Reading / no audio** (Sprachbausteine, grammar fill):
```yaml
- id: C2
  block: C
  type: single-choice
  title: “Sprachbausteine Teil 1”
  items:
    - q: “(1) ______ Name ist Petra Lang.”
      options: [ {key: a, text: “Mein”}, {key: b, text: “Ich”}, {key: c, text: “Meine”} ]
      answer: a
      why: “„Mein Name” — Name is masculine.”
```

### `true-false` — Richtig/Falsch

**Shared clip** (all items about the same dialog):
```yaml
- id: H2
  block: H
  type: true-false
  title: "Dialog: Im Deutschkurs"
  audio: dialog1_a.mp3          # one player above all items
  instructions: "Richtig (R) oder Falsch (F)?"
  items:
    - { q: "Anna kommt aus Russland.", answer: true,  why: "aus Jaroslawl." }
    - { q: "Bruno wohnt in München.",  answer: false, why: "Bruno wohnt in Berlin." }
```

**Per-item clip** (each statement refers to a different clip — same `audio` key as SingleChoice):
```yaml
- id: H2
  block: H
  type: true-false
  title: "Hör-Check"
  instructions: "Höre den Clip und entscheide."
  items:
    - audio: dialog1_a.mp3
      q: "Anna kommt aus Russland."
      answer: true
    - audio: dialog1_b.mp3
      q: "Frau Weber fragt nach dem Beruf."
      answer: false
      why: "Frau Weber fragt nach der Herkunft."
```

### `matching` — connect columns (extra rights = distractors)
```yaml
- id: B4
  block: B
  type: matching
  title: "Frage und Antwort verbinden"
  left:  [ {key: "1", text: "Wie heißt du?"}, {key: "2", text: "Woher kommen Sie?"} ]
  right: [ {key: a, text: "Aus Brasilien."}, {key: d, text: "Ich heiße Paula."}, {key: x, text: "(distractor)"} ]
  answers: { "1": d, "2": a }
```

### `categorize` — sort into buckets
```yaml
- id: B7
  block: B
  type: categorize
  title: "Begrüßung oder Abschied?"
  buckets: [ {key: gruss, label: "Begrüßung"}, {key: abschied, label: "Abschied"} ]
  tokens:
    - { text: "Hallo",          bucket: gruss,    tag: "(I)" }
    - { text: "Tschüss",        bucket: abschied, tag: "(I)" }
    - { text: "Guten Morgen",   bucket: gruss,    tag: "(F/I)" }
```

### `odd-one-out`
```yaml
- id: D2
  block: D
  type: odd-one-out
  title: "Wortschatz-Check: odd one out"
  groups:
    - { items: ["Hallo", "Guten Tag", "Tschüss", "Guten Morgen"], odd: 2, why: "farewell, not greeting" }
    - { items: ["Deutsch", "Spanien", "Englisch", "Türkisch"],    odd: 1, why: "country, not language" }
```

### `order` — word order
```yaml
- id: B5
  block: B
  type: order
  title: "Satzbau"
  items:
    - { tiles: ["heiße", "ich", "Anna"], answer: [1, 0, 2] }   # → Ich heiße Anna.
    - { tiles: ["in", "Berlin", "wohne", "ich", "jetzt"], answer: [3, 2, 4, 0, 1],
        alt: [[4, 2, 3, 0, 1]], note: "verb stays in position 2" }
```

### `free-write` — writing (self-assessed)
```yaml
- id: B9
  block: B
  type: free-write
  title: "Stell dich vor!"
  prompt: "Write 3–4 sentences introducing yourself to a new classmate."
  minSentences: 4
  use:
    - "a greeting + name"
    - "≥1 sentence with `sein`"
    - "≥1 sentence with `kommen aus`"
  selfCheck:
    - "Correct sein-forms for ich/du?"
    - "`aus` for origin, `in` for residence?"
  model: "Hallo! Ich heiße Anna. Ich komme aus Russland …"
```

### `speaking-prompt` — speaking (exam, self-assessed)
```yaml
- id: exam-teil4
  block: exam
  type: speaking-prompt
  title: "Teil 4 — Sprechen"
  parts:
    - { label: "Teil 4a — Sich vorstellen", prompt: "Introduce yourself.", bullets: ["Name", "Wohnort", "Sprachen"] }
  criteria: ["fluency", "accuracy", "task completion"]
  maxScore: 10
```

### Exam header (lesson `NN/14` only)
Add the `exam:` grid at the top of `exercises.yml` (`CONTENT-MODEL.md §5`) and use
`block: exam`, `id: exam-aufgabeN`. The grid drives both `solutions.md`'s scoring
table and the web `TestRunner` (`SCORING.md §6`).

---

## 4. Authoring checklist (web layer — additive to AUTHORING.md's DoD)

- [ ] `exercises.yml` validates (run `gen-exercises`; a schema error blocks you).
- [ ] every `{n}` has an answer; every answer references a real `{n}` (the schema
      enforces this — fix until it passes).
- [ ] gap-bank: every answer word is present in `bank`; distractors included.
- [ ] ids/blocks follow AUTHORING's architecture; H4 carries `transcript`.
- [ ] ran `gen-exercises` → `exercises.md`/`solutions.md` look right (and match the
      old printable style).
- [ ] ran `generate_audio.py` on `lesson.md` then `exercises.md`.
- [ ] inline `<AudioPlay>` only where there's no existing audio convention.
- [ ] **exercises are standalone**: no exercise instruction says "listen in lesson.md"
      or otherwise sends the learner to another page; every needed audio clip is
      embedded via `audio` (exercise-level or per-item).
- [ ] previewed the page; "Auswerten" reveals correctness only at the end.
- [ ] committed all generated files alongside the source.

---

## 5. Stub to add to `AUTHORING.md`

Add this pointer near the top of `AUTHORING.md` (under "Required reading"):

> **Authoring for the website.** Exercises are now authored as structured
> `exercises.yml` (single source of truth); `exercises.md` and `solutions.md` are
> **generated** from it — do not hand-edit them. Lessons may embed inline
> `<AudioPlay>` components. See **`docs/web/WEB-AUTHORING.md`** for the schema,
> per-type examples, and the generate/audio command order. The five-block
> architecture, scope discipline, and German-correctness rules in this file still
> apply unchanged.
