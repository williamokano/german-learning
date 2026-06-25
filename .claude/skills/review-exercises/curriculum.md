# Curriculum — Exercise Block Structure per Level

This file documents the **expected exercise block structure** for each CEFR
level. For grammar/vocabulary scope rules, see `../review-lesson/guidelines-{LEVEL}.md`.
For exercise patterns (types, distractor styles, gap complexity), see
`exercise-guidelines-{LEVEL}.md`.

---

## Block architecture (all levels)

Every lesson has 5 blocks in this order:

| Order | Block | German | Purpose | Target exercises | Target items |
|-------|-------|--------|---------|------------------|--------------|
| 1 | H | Hören | Listening comprehension | 4 (H1–H4) | ~20 |
| 2 | A | Basistraining | Recognition → controlled production | 12 (A1–A12) | ~70 |
| 3 | B | Vertiefung | Controlled → guided production | 9 (B1–B9) | ~50 |
| 4 | C | Prüfungstraining | Exam format (telc/Goethe) | 5 (C1–C5) | ~30 |
| 5 | D | Wiederholung & Selbsttest | Review + self-test | 4 (D1–D4) | ~25 |
| **Total** | | | | **34** | **~195** |

Per-project convention: 28–32 exercises / 180–220+ items per topic (per
`AUTHORING.md`). Block H is first and **not counted in the 28–32 target**.

---

## Block H — Hören (Listening)

### Sub-block structure

| Sub-block | When | Type | Items | Notes |
|-----------|------|------|-------|-------|
| H1 / H1a+H1b | All | single-choice / true-false | 5–7 | Aussprache-Check + Dialog Hör-Check |
| H2 / H2a+H2b | A1 only (A1/01-04) | single-choice | 5–7 | Pronunciation drills |
| H3 | All | gap-bank | 6–10 | Hörtext-Lückentext |
| H4 | A1/01-13, A2/01-13, B1/01-13, B2/01-13 | single-choice | 4 | Kurze Ansage |

**Notes:**
- H1a/H1b if there are 2 dialog clips; H2a/H2b if there are 2 pronunciation clips
- H3 audio: `hoertext.mp3` (every lesson)
- H4 audio: `transcript_ansage1.mp3` (every lesson with H4)
- A1/14 and other Prüfungstraining (xx/14) skip H4

---

## Block A — Basistraining

12 exercises (A1–A12). Recognition → controlled production.

### Common exercise types

- A1–A6: gap-text (conjugation tables, simple patterns)
- A7–A8: gap-text (vocabulary-focused)
- A9–A10: gap-text (production with cues)
- A11–A12: gap-text or free-write

**Per-level variation:**
- **A1:** simple gap-text, no subordinate clauses, ≤10 words per sentence
- **A2:** add subordinate clauses (`weil`, `dass`, `wenn`), modalverb Satzklammer
- **B1:** add Präteritum, Plusquamperfekt, alle cases, relative clauses
- **B2:** add Konjunktiv I, Partizip I/II as adjective, Funktionsverbgefüge
- **C1:** add complex syntax, idioms, register shifts

---

## Block B — Vertiefung

9 exercises (B1–B9). Production tasks.

### Common exercise types

- B1–B2: gap-text (dialogs)
- B3: gap-text (Finde den Fehler — error correction)
- B4: matching (Frage und Antwort verbinden)
- B5: order (Satzbau)
- B6: categorize (categories)
- B7: odd-one-out (Was passt nicht?)
- B8: free-write (answer with cues)
- B9: free-write (Contextualized writing task — A1-lighter, A2-standard, B1-standard)

---

## Block C — Prüfungstraining

5 exercises (C1–C5). Exam format (telc/Goethe).

### Standard structure

| Sub-block | Type | Items | Notes |
|-----------|------|-------|-------|
| C1 | gap-bank (Lückentext) | 10 | Free-form listening comprehension |
| C2 | single-choice (Sprachbausteine Teil 1) | 6 | Lexical/grammatical MC |
| C3 | gap-bank (Sprachbausteine Teil 2) | 10 | 15-word bank, 10 gaps, 5 distractors; `bankCase: upper`; `bankSort: true` |
| C4a | true-false (Lesen Text 1) | 5 | Reading comprehension |
| C4b | single-choice (Lesen Text 2) | 4 | Reading comprehension |
| C5 | free-write (Schreiben) | 1 prompt | Short essay |

**Per-level variation:**
- **A1/14, A2/14, B1/14, B2/14:** full exam format (Hören + Lesen + Schreiben + Sprechen)
- **Other lessons:** simplified exam-format (C1–C5 only)

---

## Block D — Wiederholung & Selbsttest

4 exercises (D1–D4).

| Sub-block | Type | Items | Notes |
|-----------|------|-------|-------|
| D1 | gap-text (Gemischter Schnelltest) | 15 | Quick mixed test, includes L(n) review markers |
| D2 | odd-one-out (Wortschatz-Check) | 6 groups of 4 | Vocabulary review |
| D3 | gap-text (Wiederholung Lektion 1–N) | 10 | Review from earlier lessons |
| D4 | gap-text (Selbsttest) | 20 items | Pass threshold: 16/20 → next lesson |

**Recycling rule:** D exercises contain ≥20% review material from earlier
lessons. Mark these as `(L<n>)` in the question text.

---

## Audio files per lesson

Standard per-lesson audio:
- `dialog1_a.mp3` (A1-A2) or `dialog1.mp3` (A1/06+)
- `dialog1_b.mp3` (A1-A2) or `dialog2.mp3` (A1/06+)
- `hoertext.mp3`
- `hoerzu1.mp3`–`hoerzu6.mp3` (A1/01-04, A1/06 only — Aussprache-Check)
- `transcript_ansage1.mp3` (every lesson with H4)

**A1/01:** also has `hoerzu1`–`hoerzu6` (6 pronunciation clips)
**A1/02:** has `hoerzu1`–`hoerzu3`
**A1/03:** has `hoerzu1`–`hoerzu4`
**A1/04:** has `hoerzu1`–`hoerzu3`
**A1/05:** no hoerzu (no Aussprache-Check at A1/05+)
**A1/06+:** no hoerzu (Aussprache-Check discontinued after A1/04)

---

## Per-level size summary

| Level | H | A | B | C | D | Total | Items |
|-------|---|---|---|---|---|-------|-------|
| A1    | 4 | 12 | 9 | 5 | 4 | 34 | ~195 |
| A2    | 4 | 12 | 9 | 5 | 4 | 34 | ~195 |
| B1    | 4 | 12 | 9 | 5 | 4 | 34 | ~195 |
| B2    | 4 | 12 | 9 | 5 | 4 | 34 | ~195 |
| C1    | 4 | 12 | 9 | 5 | 4 | 34 | ~195 |

(Exact counts may vary ±2 exercises per lesson; the project standard is
28–32 non-H exercises, so 33–37 total.)

---

## Cross-references

- Grammar/vocabulary scope: `../review-lesson/guidelines-{LEVEL}.md`
- Exercise patterns: `exercise-guidelines-{LEVEL}.md`
- Per-topic scope: `CURRICULUM.md`
- Production spec: `AUTHORING.md` and `AUTHORING-V2.md`