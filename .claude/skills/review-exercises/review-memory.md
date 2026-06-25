# Review Memory — Recurring Issues

Recurring issues discovered across exercise reviews. **Format:**

```
## YYYY-MM-DD — <pattern>
- Affected lessons: <list>
- Frequency: <N lessons>
- Fix applied: <description>
- See also: <cross-references>
```

When a pattern affects 5+ lessons, consider promoting it to `common-pitfalls.md`.

---

## 2026-06-25 — C3 cross-gap ambiguity (A1)

- **Affected lessons:** A1/03 (ESSE/BRAUCHE both fit gap 1), A1/09 (GEFÄLLT/PASST/STEHT cross-fit gaps 3 and 7)
- **Frequency:** 2 of 14 A1 lessons
- **Fix applied:** A1/03 added `ESSE` as alt for gap 1
- **Pattern:** when a C3 bank has verbs/nouns that can fit multiple gaps (e.g. *essen*, *trinken*, *gefallen*, *passen*, *stehen*), check each bank word against ALL gaps for canonical uniqueness
- **See also:** `common-pitfalls.md` §A1 — Exercise schema

---

## 2026-06-25 — H3 distractor count drift (A1)

- **Affected lessons:** A1/02 (instruction claimed 5 distractors; actual was 3)
- **Frequency:** 1 of 14 A1 lessons
- **Fix applied:** A1/02 instruction changed "Fünf Wörter passen nicht" → "Drei Wörter passen nicht"; same for English instructionsEn
- **Pattern:** H3 instructions hard-code the distractor count as "**N words are not needed.**" but this is computed from `bank.length - Object.keys(answers).length`. Always recompute.
- **See also:** `common-pitfalls.md` §A1 — Exercise schema

---

## 2026-06-25 — Dialog drift via footnote-marker escaping

- **Affected lessons:** A1/04 and A1/10 (`\*` escaped in lesson.md vs `*` unescaped in lesson-short.md)
- **Frequency:** 2 of 14 A1 lessons
- **Fix applied:** escape with `\*` in BOTH files for consistency
- **Pattern:** footnote markers in CommonMark require `\*` to suppress italic; not all lesson authors do this consistently. This is the most common dual-mode "drift" false positive.
- **See also:** `false-positives.md` — "Dialog drift: \* vs * escaping"

---

## 2026-06-25 — A1/14 dialog drift is intentional

- **Affected lessons:** A1/14 (Prüfungstraining) has 23-line drift between Full and Short
- **Frequency:** all Prüfungstraining lessons (xx/14)
- **Pattern:** Short is a grammar-review sheet, not a dialog transcript. Skip dialog drift check for these.
- **See also:** `false-positives.md` — "A1/14, A2/14, B1/14, B2/14 dialog drift (Prüfungstraining)"

---

## 2026-06-25 — A1/05 C1 bank duplicates "gehe" intentionally

- **Affected lessons:** A1/05 C1
- **Frequency:** 1 of 14 A1 lessons
- **Pattern:** when a word is needed in 2 different gaps, the bank can list it twice; the validator accepts duplicates
- **See also:** `false-positives.md` — "Duplicate bank entry"

---

## Older (from prior B1/B2 review runs, captured for reference)

### B1/13: Audio filename mismatch in yml vs actual files

- **Pattern:** `audio: b1_13_dialog_a.mp3` when the file is actually `dialog1_a.mp3`
- **Fix:** cross-check every `audio:` field against `ls audio/` before running gen-exercises

### B1/07: D2 incorrect "des Herren" (should be "des Herrn")

- **Pattern:** Genitive of `der Herr` is `des Herrn` (with -n, not -en)
- **Fix:** check odd-one-out items where Genitive of masculine weak nouns is involved

### B1/13: H1b "Hört zu" capitalisation

- **Pattern:** mid-sentence `hört zu` must be capitalised when it leads a quoted phrase
- **Fix:** check all H1a/H1b answer strings for proper case

### B2/11: C3 distractor count with duplicate option

- **Pattern:** A1-style C3 with 15 bank items but only 4 distractors (1 word used in 2 gaps); distractor-count claim was wrong
- **Fix:** when a word is in 2 gaps, recompute distractor count = `bank.length - unique_answers.length` not `bank.length - total_answers.length`

### B2/13: A1 instruction "Infinitiv" but exercise is fill-in-the-blank

- **Pattern:** instruction says "Schreiben Sie den Infinitiv" but the exercise provides the answer
- **Fix:** use "Fill in" not "Write down" for fill-in-the-blank exercises

### B2/13: A5 ungrammatical gaps 5/6

- **Pattern:** gap text was missing the verb slot, producing ungrammatical fragments
- **Fix:** verify every gap text reconstructs to a grammatical sentence

### B2/13: A6 duplicate bank word

- **Pattern:** `bank: [word, word, ...]` had the same word twice unintentionally
- **Fix:** intentional duplicates only when 2 gaps need the same word; otherwise remove

### B2/14: exam-L8 duplicate MC option

- **Pattern:** single-choice had two options with the same text
- **Fix:** every option key must have a unique text

### B2: Reported speech confusion (Präteritum vs Konjunktiv I)

- **Pattern:** indirect speech uses Präteritum/Indikativ instead of Konjunktiv I — `er sagt, er hat Zeit` → `er sagt, er habe Zeit` (Konjunktiv II fallback `hätte` also OK)
- **Fix:** verify every reported-speech construction shifts to Konjunktiv I (or II fallback when KI is indistinguishable from the Indikativ)

---

## Patterns observed (not yet 5+ lessons, kept here for tracking)

- **A1:** Empty H4 audio references (transcript_ansage1.mp3 missing) — flag for audio regen, do NOT silently rewrite
- **B1:** Audio clip referenced in `audio:` but file doesn't exist (H4 transcript_ansage1.mp3) — pre-existing audio gen gap; flag for follow-up
- **B2:** A10 instruction says "Write down" but exercise is fill-in-the-blank — use "Fill in"
- **A1:** D1/D4 item-count claim doesn't match actual gaps — count `{n}` placeholders manually
- **A2:** Order exercise with subordinate clause but verb not at end — verb position error
- **B1:** Two-part connector with only one gap — needs TWO gaps
- **B2:** Konjunktiv I 1st/3rd sg indistinguishable from Indikativ — pedagogical gap (use 3rd pl)