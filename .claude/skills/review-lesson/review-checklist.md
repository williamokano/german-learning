# Review Checklist (short version of SKILL.md §4)

Use this as a quick scan. For full descriptions of each dimension, see SKILL.md.

## Pre-review

- [ ] **Level detected** from path (`A1`/`A2`/`B1`/`B2`/`C1`)
- [ ] **`guidelines-{LEVEL}.md` loaded** — every review checks against it
- [ ] **Curriculum compliance** — does not assume knowledge not yet taught, follows dependency order
- [ ] **Learning objectives** — every objective is observable, measurable, appropriate

## Review dimensions (32)

### Content alignment
- [ ] 1. CEFR alignment (loaded guidelines)
- [ ] 2. Grammar accuracy (articles, cases, conjugation, word order, …)
- [ ] 3. Syntax (V2, verb-final, question order, imperatives)

### Language quality
- [ ] 4. Vocabulary (frequency, register, false friends, collocations)
- [ ] 5. Naturalness (vs textbook-stilted German)
- [ ] 6. Native-speaker validation
- [ ] 7. Idiomatic language (greetings, fixed phrases, modal particles)
- [ ] 8. Register (formal/informal/business/academic — no mixed)

### Material quality
- [ ] 9. Pronunciation support (IPA, stress, vowel length, minimal pairs)
- [ ] 10. Listening material (rate, accent, clarity, authenticity, script match)
- [ ] 11. Reading material (difficulty, density, cohesion)
- [ ] 12. Exercises (ambiguity, answer keys, sufficient context, no guessability)
- [ ] 13. Progression (recognition → controlled → guided → free production)

### Learner-aware
- [ ] 14. Error anticipation (predict common learner errors for the lesson's topic)
- [ ] 15. Cross-language interference (L1 weighting — Portuguese/English/Spanish/French)
- [ ] 16. Consistency (terminology, formatting, vocabulary, exercise numbering)
- [ ] 17. Translation quality (literal vs natural; no false equivalence)
- [ ] 18. Cultural accuracy (currency, holidays, food, etiquette, regional customs)
- [ ] 19. Inclusivity (diverse names, occupations, family structures)

### Production quality
- [ ] 20. Visual references (captions match, no misleading illustrations)
- [ ] 21. Cognitive load (≤10 new words A1, ≤2 grammar points A1)
- [ ] 22. Memory reinforcement (≥20% review from prior lessons)
- [ ] 23. Assessment quality (coverage, difficulty, balance, distractors)
- [ ] 24. Teacher notes (clarity, timing, alternatives)

### Hygiene
- [ ] 25. Internal contradictions (page X says Y, page Z says not-Y)
- [ ] 26. Technical writing (spelling, punctuation, typography)
- [ ] 27. Pedagogical quality (simple→complex, examples, counterexamples)

### German-specific
- [ ] 28. German pitfalls (cross-reference `common-pitfalls.md`)

### Meta
- [ ] 29. AI hallucination detection (invented rules, fake exceptions, non-existent words)
- [ ] 30. Reviewer confidence rating (severity × confidence, evidence)

## Per-type schema checks (exercises.yml)

- [ ] `gap-text` — every `{n}` has an answer; no bare `___`
- [ ] `gap-bank` — `bank.length - answers.length` = "N words are not needed"
- [ ] `gap-bank` — every answer value MUST appear in bank
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

## Output

Every review produces:
1. Executive Summary + Score
2. Review Table (32 dimensions)
3. Critical / Major / Minor / Suggestion lists
4. Positive Findings
5. Recurring Patterns
6. **Suggested Memory Updates** (proposed, not auto-written)
7. Final Recommendation (ship / fix-blockers / needs-major-work)