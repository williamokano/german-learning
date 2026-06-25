# Exercise Patterns — A1

For grammar/vocabulary scope rules shared across all lesson reviews, see
`guidelines-A1.md`. **Always load both files** before reviewing.

This file defines what **exercise patterns** (types, distractor styles, gap
complexity, block sizes) are appropriate at A1.

---

## Block structure (per project convention)

| Block | Exercises | Items | Notes |
|-------|-----------|-------|-------|
| H (Hören) | H1–H4 (4 exercises) | 5–7 per clip | Recognition only; no production |
| A (Basistraining) | A1–A12 (12 exercises) | ~70 items | Recognition → controlled production |
| B (Vertiefung) | B1–B9 (9 exercises) | ~50 items | Controlled → guided production |
| C (Prüfungstraining) | C1–C5 (5 exercises) | ~30 items | Prüfungsformat (telc/Goethe) |
| D (Wiederholung) | D1–D4 (4 exercises) | ~25 items | Mixed review; ≥20% from earlier lessons |
| **Total** | **34 exercises** | **~180–220 items** | |

---

## Exercise types appropriate at A1

### ✅ Use freely

- **`gap-text`** — simple sentences, single-clause
- **`gap-bank`** — H3 only (Hörtext-Lückentext); C3 with 15-bank/10-gap/5-distractor pattern
- **`single-choice`** — H1 (Aussprache-Check); H4 (Kurze Ansage); C2 (Sprachbausteine Teil 1)
- **`true-false`** — H1a/H1b (Dialog Hör-Check); C4a (Lesen Text 1)
- **`matching`** — B4 (Frage und Antwort verbinden); ≤8 pairs
- **`order`** — B5 (Satzbau); 3–5 tiles per sentence; no subordinate clauses
- **`categorize`** — B7 (Begrüßung/Abschied, etc.); 8–12 tokens, 2–4 buckets
- **`odd-one-out`** — D2 (Wortschatz-Check); 6 groups of 4
- **`free-write`** — B9 (Contextualized writing task, A1-lighter: 3–4 sentences); C5 (Schreiben)

### ❌ Avoid at A1

- **`table-fill`** — only as conjugation tables in Block A (e.g. `sein` ich/du/er/wir/ihr/sie)
- **Complex multi-gap text** — keep each gap-text exercise to ≤3 gaps
- **Long free-write prompts** — A1-lighter is 3–4 sentences max
- **Speaking-prompt** with open-ended production — only as structured prompts

---

## Gap-text patterns

### Sentence length

- **Recommended:** 4–10 words per gap-text sentence
- **Maximum:** 12 words
- **Avoid:** sentences with subordinate clauses (use 2 sentences instead)

### Gap count per exercise

- **Recommended:** 5–10 gaps
- **Maximum:** 12 gaps

### Vocabulary in gap-text

- Use vocabulary from `lesson.md` Wortschatz
- Use vocabulary from prior lessons (recycling)
- Do NOT introduce new vocabulary in gap-text that isn't in the lesson

---

## gap-bank patterns

### H3 (Hörtext-Lückentext)

- **Bank size:** 6–9 words (1:1 with gaps + 0–3 distractors)
- **Distractor style:** same grammatical category as the gap; semantically plausible but wrong
- **Instruction format:** "Höre den Text und fülle die Lücken. **{N} Wörter passen nicht.**"
- **English mirror:** "Listen to the text and fill in the gaps. **{N} words do not fit.**"

### C3 (Sprachbausteine Teil 2)

- **Bank size:** 15 words
- **Gaps:** 10
- **Distractors:** 5
- **Bank case:** `bankCase: upper` (all caps)
- **Bank sort:** `bankSort: true` (alphabetical)
- **Instruction:** "Fill the 10 gaps from the box. **{N} words are not needed.**"
- **Each word once** — verify that no bank word fits two gaps (cross-gap ambiguity)

---

## Order-exercise patterns

### Tile count

- **A1 minimum:** 3 tiles
- **A1 maximum:** 6 tiles
- **Recommended:** 4–5 tiles

### Sentence structure

- **Statements:** simple SVO with optional adverbial
- **Yes/no questions:** verb first, subject second
- **W-questions:** W-word first, verb second, subject third
- **Avoid:** subordinate clauses, separable verbs with long prefixes, modal verb Satzklammer (defer to A2)

### Verbs in tiles

- All conjugated (no infinitive)
- Exception: Perfekt (auxiliary + past participle) — OK
- Exception: Futur I (werden + infinitive) — not at A1

### Separable verbs

- Always split: `aufstehen` → `[stehe, auf]`
- Position: conjugated verb in main-clause slot, prefix at end
- A1 examples: aufstehen, einkaufen, anrufen, fernsehen, mitkommen, ausgehen

---

## Single-choice patterns

### Distractors

- 3 options (a/b/c) is the norm at A1
- 4 options only at A1/01 and A1/14 (exam-style)
- Options should be plausible, not absurd

### H4 (Kurze Ansage)

- 3–5 questions per clip
- Distribute correct answers (not all "a")
- Include the transcript in the yml (`transcript:` field)

---

## true-false patterns

- 3–6 items per exercise
- One exercise per audio clip (never mix clips)
- `audio:` field required if based on listening

---

## Categorize patterns

- 8–12 tokens
- 2–4 buckets
- Buckets should be exclusive (no overlap)
- Common A1 categorisations: Begrüßung/Abschied, Möbel/Räume, Farben/Adjektive, Obst/Gemüse/Getränke

---

## Odd-one-out patterns

- 6 groups per exercise
- 4 items per group
- The "odd" must be the kind of word described by `why` (e.g. `Tschüss` is a farewell; `Foto` is not a person)

---

## Free-write patterns (A1-lighter)

- **Length:** 3–4 sentences
- **Prompt:** simple stimulus + 3–4 bullet checklist
- **Self-check:** 3–4 form checks (not content)
- **Model answer:** present

---

## Common A1 exercise-schema errors to flag

1. **Order exercise with more than 6 tiles** — too complex for A1
2. **Gap-text with subordinate clause in sentence** — defer to A2
3. **H3 distractor count mismatch** — instruction says "N words" but actual ≠ N
4. **C3 cross-gap ambiguity** — bank word fits multiple gaps (e.g. ESSE/BRAUCHE both fit)
5. **Single-choice with 4+ options** — only at A1/01 and A1/14
6. **Audio filename mismatch** — `audio: dialog_a.mp3` vs file `dialog1_a.mp3`

---

## CEFR-appropriate distractors

Distractors at A1 should be:

- High-frequency words from earlier lessons
- Common learner errors (e.g. *ich gehe* vs *ich gehen* in conjugation)
- Same grammatical category as the gap
- NOT abstract or low-frequency (e.g. no *die Implementierung*, *der Vorgang*)

---

## Example: acceptable vs unacceptable A1 exercises

| ❌ Unacceptable at A1 | Why | ✅ Acceptable alternative |
|------------------------|-----|--------------------------|
| Gap-text: "Ich denke, **dass** mein Bruder **kommt** heute." | Subordinate clause with V2 | Two sentences: "Ich denke, mein Bruder kommt heute." / "Ich denke, mein Bruder kommt morgen." |
| Order: [ich, gehe, weil, müde, bin, "?"] | Subordinate clause in order | Two-step: "[Warum, gehst, du, nicht, "?"]" + answer in notes |
| C3 bank: [BIN, KAFFEE, TRINKE, ...] with 5 distractors, but ESSE also in bank | Cross-gap ambiguity if ESSE fits gap 1 | Restructure gap 1 to disambiguate, or add ESSE as alt |
| Gap-text: "{1} das Auto gefällt mir sehr." with answer "weil" | Wrong conjunction for subordinate | Two-sentence version, or use "Das Auto gefällt mir sehr. {1}" with answer "Stimmt" |
| Single-choice option: "die Implementierung" | B2 vocabulary | "das Auto", "die Wohnung", "der Computer" (A1 vocab) |

---

## Cross-references

- Shared grammar/vocabulary scope: `guidelines-A1.md`
- Per-type schema rules: `SKILL.md` §5
- Common errors: `common-pitfalls.md` §A1
- Block structure overview: `curriculum.md`