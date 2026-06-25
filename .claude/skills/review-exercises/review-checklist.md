# Review Checklist (short version of SKILL.md §4–5)

Use this as a quick scan. For full descriptions, see SKILL.md.

## Pre-review

- [ ] **Level detected** from path (`A1`/`A2`/`B1`/`B2`/`C1`/`C2`)
- [ ] **3 files loaded**:
  - `SKILL.md` (procedure)
  - `../review-lesson/guidelines-{LEVEL}.md` (shared scope)
  - `exercise-guidelines-{LEVEL}.md` (exercise patterns)
- [ ] **Curriculum compliance** — does not assume knowledge not yet taught
- [ ] **Learning objectives** — every objective is observable, measurable, appropriate

## Review dimensions (exercises-focused subset of 32)

### Schema and content
- [ ] 1. CEFR alignment (shared + exercise guidelines)
- [ ] 2. Schema compliance (per-type rules, §5)
- [ ] 3. Grammar accuracy in exercise text
- [ ] 4. Answer logic and ambiguity
- [ ] 5. Pedagogical progression (H → A → B → C → D)
- [ ] 6. Distractor quality
- [ ] 7. Audio filename accuracy
- [ ] 8. Exercise-type appropriateness for level
- [ ] 9. Consistency with lesson.md

### Listening-specific
- [ ] 10. H3 (Hörtext-Lückentext) integrity
- [ ] 11. H4 (Kurze Ansage) integrity

### Learner-aware
- [ ] 12. Cross-language interference (L1 distractors)
- [ ] 13. Recurring patterns from prior runs

### Hygiene
- [ ] 14. Internal contradictions (text vs answer key)
- [ ] 15. Technical writing in instructions and items

## Per-type schema checks (exercises.yml)

- [ ] `gap-text` — every `{n}` has an answer; no bare `___`
- [ ] `gap-text` — `answers:` + `alts:` correctly structured
- [ ] `gap-bank` — `bank.length - answers.length` = N in "N words not needed" (in both `instructions` and `instructionsEn`)
- [ ] `gap-bank` — every answer value appears in `bank`
- [ ] `gap-bank` — no cross-gap ambiguity (each bank word fits only one gap)
- [ ] `gap-bank` — no per-gap ambiguity (each gap has one canonical answer or alts)
- [ ] `order` — `answer.map(i => tiles[i])` reconstructs the target sentence
- [ ] `order` — `tiles.length === answer.length`
- [ ] `order` — separable verbs split (aufstehen → [stehe, auf])
- [ ] `order` — verbs conjugated (no infinitive tiles except for Futur I / Modalverb / Perfekt)
- [ ] `single-choice` — `answer` value is one of the option keys
- [ ] `single-choice` H4 — has `transcript:` field and `audio: transcript_ansage1.mp3`
- [ ] `true-false` — `answer` is boolean, not string
- [ ] `matching` — left/right use `{key, text}` objects (not bare strings)
- [ ] `matching` — every left key has an answer; every answer references a right key
- [ ] `odd-one-out` — `odd` is 0-indexed into `items`; matches the word in `why`
- [ ] `categorize` — every token's `bucket` is a valid bucket key
- [ ] `free-write` — `prompt:`, `use:`, `selfCheck:`, `model:` all present
- [ ] `table-fill` — gap numbers globally unique; answer forms match column header

## Block structure (per CEFR level)

- [ ] H3 gap-bank: `audio: hoertext.mp3`; distractor count in instructions correct
- [ ] H4 single-choice: `audio: transcript_ansage1.mp3`; `transcript:` field set
- [ ] C3 gap-bank: 15 bank items, 10 gaps, 5 distractors; `bankCase: upper`; `bankSort: true`
- [ ] D2 odd-one-out: 6 groups of 4; `odd` verified against `why`
- [ ] D4: `notes:` field with pass threshold and retry advice

## Audio integrity

```bash
# Cross-check every audio: field against actual files
for f in $(grep -h "audio:" <lesson>/exercises.yml | grep -oE '[a-z0-9_-]+\.mp3' | sort -u); do
  [ -f "<lesson>/audio/$f" ] || echo "MISSING: $f"
done
```

## Severity

Every finding: **severity × confidence × evidence (file:line)**:

| Severity | Definition |
|----------|-------------|
| Critical | Blocks shipping. Wrong answer key, schema violation, CEFR scope violation. |
| Major | Fix before next lesson. Cross-gap ambiguity, distractor-count mismatch, missing audio. |
| Minor | Fix in next batch. Typo, formatting, missing cross-reference. |
| Suggestion | Nice-to-have. Style improvement. |

| Confidence | Definition |
|------------|-------------|
| High | Verified against a source. |
| Medium | Likely correct but not verified. |
| Low | Subjective judgment. |

## Output

Every review produces:
1. Executive Summary + Score
2. Review Table (32 dimensions)
3. Critical / Major / Minor / Suggestion lists
4. Positive Findings
5. Recurring Patterns
6. **Suggested Memory Updates** (proposed, not auto-written)
7. Final Recommendation (ship / fix-blockers / needs-major-work)