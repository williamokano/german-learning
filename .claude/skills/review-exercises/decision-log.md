# Decision Log

Document **why** each new review rule was added.

**Format:**
```
## YYYY-MM-DD — <rule name>
- **Trigger:** <what was found or proposed>
- **Decision:** <what rule was added>
- **Source:** <user request, prior finding, or external reference>
- **Effect:** <what the change does to the review process>
```

---

## 2026-06-25 — Restructured the skill into three layers

- **Trigger:** User asked to apply the same level of diligence to `review-exercises` as the restructured `review-lesson`
- **Decision:** reorganised files into procedure (SKILL.md, README.md), per-level rules (exercise-guidelines-{LEVEL}.md), and append-only knowledge base
- **Source:** User request 2026-06-25 + parallel structure to `review-lesson`
- **Effect:** every review now loads SKILL.md + matching exercise-guidelines-{LEVEL}.md + ../review-lesson/guidelines-{LEVEL}.md; memory files remain append-only to prevent prompt drift

---

## 2026-06-25 — Added level detection + dual-guideline loading (SKILL.md §1)

- **Trigger:** need to load both shared scope rules (from `../review-lesson/`) and exercise-specific patterns (from `exercise-guidelines-`)
- **Decision:** SKILL.md §1 explicitly loads BOTH files for every review, with abort-on-missing
- **Source:** internal design decision during restructuring
- **Effect:** reviewer always has both scope (grammar/vocab) and pattern (exercise types) context

---

## 2026-06-25 — Created per-level exercise-guidelines (A1, A2, B1, B2, C1)

- **Trigger:** need exercise-specific patterns separate from shared grammar/vocab scope
- **Decision:** created 5 files `exercise-guidelines-{LEVEL}.md` covering exercise types, distractor styles, gap complexity, block sizes, and example pairs
- **Source:** user request 2026-06-25 + CURRICULUM.md
- **Effect:** every level now has explicit exercise-pattern rules

---

## 2026-06-25 — Defined scope split between `review-lesson` and `review-exercises`

- **Trigger:** restructuring required clarifying which skill owns which concern
- **Decision:**
  - `review-lesson` — whole lesson (lesson.md + lesson-short.md + exercises.yml) for CEFR alignment, pedagogy, naturalness, lesson structure
  - `review-exercises` — exercises.yml only for schema correctness, answer logic, grammar in exercise text, audio filename accuracy
  - **Shared:** `../review-lesson/guidelines-{LEVEL}.md` (grammar/vocab scope)
- **Source:** internal design decision
- **Effect:** no overlap; each skill has a clear scope

---

## 2026-06-25 — Integrated 32 review dimensions applied to exercises

- **Trigger:** user listed 32 review criteria in the prior session
- **Decision:** incorporated all 32 into SKILL.md §4, applied to exercises (some dimensions are weighted differently than for whole-lesson reviews)
- **Source:** user request 2026-06-25
- **Effect:** every exercise review applies the full 32-dimension checklist

---

## 2026-06-25 — Added severity × confidence rating (SKILL.md §9)

- **Trigger:** user asked for "Severity × Confidence × Evidence" output format
- **Decision:** added §9 with severity/confidence tables; every finding carries all three
- **Source:** user request 2026-06-25
- **Effect:** consistent output format across both skills

---

## 2026-06-25 — Added "Suggested Memory Updates" output format (SKILL.md §8)

- **Trigger:** user listed "Suggested Memory Updates" as part of the output
- **Decision:** added §8 #9 with explicit table format and the rule that memory files are NOT auto-edited
- **Source:** user request 2026-06-25
- **Effect:** every review proposes memory updates; user approves; knowledge grows without prompt drift

---

## 2026-06-25 — Preserved schema-specific checks (SKILL.md §5)

- **Trigger:** the original SKILL.md had detailed per-type schema checks (gap-text, gap-bank, order, etc.)
- **Decision:** preserved all per-type checks in §5 of the new SKILL.md; expanded verification algorithms
- **Source:** original SKILL.md content
- **Effect:** no loss of existing review capability

---

## 2026-06-25 — Added cross-language interference to exercise distractors (§4.11)

- **Trigger:** user listed "Cross-language Interference" as a review dimension
- **Decision:** §4.11 explicitly notes that distractors should include common learner errors by L1
- **Source:** user request 2026-06-25
- **Effect:** distractors that teach, not just test

---

## Older (from prior B1/B2 review runs)

### B1 run: Audio filename mismatch audit rule

- **Trigger:** B1/13 had `audio: b1_13_dialog_a.mp3` but file was `dialog1_a.mp3`
- **Decision:** added §4.7 "Audio filename accuracy" + cross-check command
- **Effect:** every audio reference is verified against `ls audio/` before commit

### B1 run: Genitive of "der Herr" is "des Herrn"

- **Trigger:** B1/07 D2 had `des Herren` (wrong)
- **Decision:** added to common-pitfalls.md §B1
- **Effect:** reviewer catches Genitive weak masculine noun errors

### B1 run: H4 transcript_ansage1.mp3 may not exist

- **Trigger:** H4 references `transcript_ansage1.mp3` but file missing in some lessons
- **Decision:** §4.7 "H4 references transcript_ansage1.mp3 that doesn't exist — pre-existing audio gen gap. Flag for follow-up audio regen; do NOT silently rewrite to a different filename."
- **Effect:** reviewer flags missing audio without masking the underlying issue

### A1 review run: Stricter distractor count checking

- **Trigger:** A1/02 had distractor count drift (5 claimed, 3 actual)
- **Decision:** added §5.2 "gap-bank: bank.length - answers.length = N in 'N words not needed'; all answers in bank"
- **Effect:** every H3 distractor count is verified mechanically

### A1 review run: C3 cross-gap ambiguity

- **Trigger:** A1/03 had ESSE/BRAUCHE both fit gap 1
- **Decision:** added §4.4 "Answer logic and ambiguity" + per-level check
- **Effect:** every C3 is mental-simulated: each bank word against all gaps

### A1 review run: Drift false-positives (footnote escapes, Prüfungstraining)

- **Trigger:** A1/04 and A1/10 had `\*`/`*` drift; A1/14 has 23-line intentional drift
- **Decision:** added "Drift false-positives to skip" section to §13 dual-mode drift check
- **Effect:** reviewer doesn't waste cycles on expected patterns

### B2 review run: 5-distractor pattern with duplicates

- **Trigger:** B2/11 C3 had 15 bank items with a duplicate, claim was "Five words are not needed" but actual was 4
- **Decision:** added note to §5.2 that when a word is in 2 gaps, distractor count = `bank.length - unique_answers.length`
- **Effect:** distractor count is correctly computed even with intentional duplicates

### B2 review run: Modalverb subjektiv

- **Trigger:** B2 introduced "Er soll König gewesen sein" (rumour)
- **Decision:** added to common-pitfalls.md §B2 — wrong Konjunktiv pattern
- **Effect:** reviewer catches B2-specific error