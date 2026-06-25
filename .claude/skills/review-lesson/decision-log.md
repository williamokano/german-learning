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

- **Trigger:** User asked to improve the skill, add level-detection, create per-level guidelines, and integrate all 32 review criteria
- **Decision:** reorganised files into procedure (SKILL.md, README.md), per-level rules (guidelines-{LEVEL}.md), and append-only knowledge base (common-pitfalls, false-positives, review-memory, decision-log, style-guide, curriculum, review-checklist)
- **Source:** User request 2026-06-25
- **Effect:** every review now loads SKILL.md + matching guidelines-{LEVEL}.md; memory files remain append-only to prevent prompt drift

---

## 2026-06-25 — Added level detection + guideline loading (SKILL.md §1)

- **Trigger:** User asked the skill to identify the level and load appropriate guidelines
- **Decision:** added SKILL.md §1 "Level detection & guideline loading" with bash commands for path parsing and abort-on-missing-guidelines
- **Source:** User request 2026-06-25
- **Effect:** reviewer never runs without the matching per-level scope rules

---

## 2026-06-25 — Created per-level guidelines (A1, A2, B1, B2, C1)

- **Trigger:** User asked for guidelines-{LEVEL}.md with should/shouldn't lists
- **Decision:** created 5 files mirroring the project's CURRICULUM.md scope tables
- **Source:** User request 2026-06-25 + CURRICULUM.md
- **Effect:** every level now has explicit in-scope and out-of-scope lists with example sentence pairs

---

## 2026-06-25 — Integrated all 32 review dimensions

- **Trigger:** User listed 32 review criteria (curriculum compliance, learning objectives, CEFR alignment, grammar, syntax, vocabulary, naturalness, native-speaker validation, idiomatic language, register, pronunciation, listening, reading, exercises, progression, error anticipation, cross-language interference, consistency, translation, cultural, inclusivity, visual, cognitive load, memory reinforcement, assessment, teacher notes, internal contradictions, technical writing, pedagogical quality, German pitfalls, AI hallucination detection, reviewer confidence)
- **Decision:** incorporated all 32 into SKILL.md §4 (renumbered from prior 28 dimensions)
- **Source:** User request 2026-06-25
- **Effect:** every review now applies the full 32-dimension checklist

---

## 2026-06-25 — Added severity × confidence rating (SKILL.md §4.30)

- **Trigger:** User asked for "Severity (Critical/Major/Minor/Suggestion) × Confidence (High/Medium/Low) × Evidence (Example/Reference)"
- **Decision:** added §4.30 "Reviewer confidence" + §6 "Severity definitions" with tables
- **Source:** User request 2026-06-25
- **Effect:** every finding now carries severity, confidence, and evidence (file:line)

---

## 2026-06-25 — Added "Suggested Memory Updates" output format (SKILL.md §5)

- **Trigger:** User listed "Suggested Memory Updates" as part of the output
- **Decision:** added §5 #9 with explicit table format and the rule that memory files are NOT auto-edited
- **Source:** User request 2026-06-25 + original README's "self-healing" pattern
- **Effect:** every review proposes memory updates; user approves; knowledge grows without prompt drift

---

## 2026-06-25 — Added AI hallucination detection (SKILL.md §4.29)

- **Trigger:** User asked for "AI Hallucination Detection" as a review dimension
- **Decision:** added §4.29 with verification protocol (cross-check against Duden, AUTHORING.md, CURRICULUM.md, standard references)
- **Source:** User request 2026-06-25
- **Effect:** invented grammar rules, fake etymologies, non-existent words are caught before shipping

---

## 2026-06-25 — Renamed lowercase skill.md to SKILL.md

- **Trigger:** after restructuring, lowercase `skill.md` was redundant (Skill tool matches case-insensitively)
- **Decision:** deleted `skill.md` (105 lines, condensed persona) since SKILL.md (now 600+ lines) supersedes it
- **Source:** internal decision during restructuring
- **Effect:** no ambiguity about which file the Skill tool loads

---

## 2026-06-25 — Removed "do not edit skill.md" rule from README

- **Trigger:** the original README said "do not edit skill.md, append to memory files" — but the user explicitly asked for structural changes to skill.md
- **Decision:** updated README to reflect a three-layer architecture: procedure (editable on user request), per-level rules (editable on curriculum change), knowledge base (append-only)
- **Source:** user request + restructuring
- **Effect:** clear edit policy per file type

---

## Older (from prior B1/B2 review runs)

### B1 run: Audio filename mismatch audit rule

- **Trigger:** B1/13 had `audio: b1_13_dialog_a.mp3` but file was `dialog1_a.mp3`
- **Decision:** added §7a "Audio filename mismatch in yml vs actual files" + cross-check instruction
- **Effect:** every audio reference is verified against `ls audio/` before commit

### B1 run: Genitive of "der Herr" is "des Herrn"

- **Trigger:** B1/07 D2 had `des Herren` (wrong)
- **Decision:** added to common-pitfalls.md §B1
- **Effect:** reviewer catches Genitive weak masculine noun errors

### B1 run: H4 transcript_ansage1.mp3 may not exist

- **Trigger:** H4 references `transcript_ansage1.mp3` but file missing in some lessons
- **Decision:** §7b "H4 references transcript_ansage1.mp3 that doesn't exist — pre-existing audio gen gap. Flag for follow-up audio regen; do NOT silently rewrite to a different filename."
- **Effect:** reviewer flags missing audio without masking the underlying issue

### A1 review run: Stricter distractor count checking

- **Trigger:** A1/02 had distractor count drift (5 claimed, 3 actual)
- **Decision:** added §7c-distractor-count check + updated H3 schema check to recompute
- **Effect:** every H3 distractor count is verified mechanically

### A1 review run: C3 cross-gap ambiguity

- **Trigger:** A1/03 had ESSE/BRAUCHE both fit gap 1
- **Decision:** added §7c C3 cross-gap ambiguity + per-level check
- **Effect:** every C3 is mental-simulated: each bank word against all gaps

### A1 review run: Drift false-positives (footnote escapes, Prüfungstraining)

- **Trigger:** A1/04 and A1/10 had `\*`/`*` drift; A1/14 has 23-line intentional drift
- **Decision:** added "Drift false-positives to skip" section to dual-mode drift check
- **Effect:** reviewer doesn't waste cycles on expected patterns