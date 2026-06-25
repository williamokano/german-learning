# Exercise Reviewer — Architecture

This skill reviews the project's `exercises.yml` files for schema correctness,
answer logic, grammar accuracy, and CEFR alignment. **Read `SKILL.md` first**
— it is the procedure and the persona.

## File map

```
.claude/skills/review-exercises/
├── SKILL.md                        ← procedure + persona (READ FIRST)
├── README.md                       ← this file (architecture)
├── exercise-guidelines-A1.md       ← per-level exercise patterns (READ for A1)
├── exercise-guidelines-A2.md       ← READ for A2
├── exercise-guidelines-B1.md       ← READ for B1
├── exercise-guidelines-B2.md       ← READ for B2
├── exercise-guidelines-C1.md       ← READ for C1
├── review-checklist.md             ← short checklist version of SKILL.md §4–5
├── curriculum.md                   ← block structure per level
├── style-guide.md                  ← terminology and formatting for exercises
│
│   ── append-only knowledge base ──
│   ── proposed after each review, user approves ──
│
├── common-pitfalls.md              ← recurring schema + grammar errors
├── false-positives.md              ← acceptable constructions previously flagged
├── review-memory.md                ← recurring issues across reviews
└── decision-log.md                 ← why new review rules were added
```

**Shared with `../review-lesson/`:**
- `../review-lesson/guidelines-{LEVEL}.md` — grammar/vocabulary scope rules (loaded by every review)
- `../review-lesson/curriculum.md` — CEFR progression overview

## How to use this skill

1. The user (or another skill) names a lesson path (e.g. `review A1/03-essen-und-trinken`).
2. **Detect the CEFR level** from the path prefix (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
3. **Load 3 files** before any check:
   - `SKILL.md` — procedure + persona
   - `../review-lesson/guidelines-{LEVEL}.md` — shared grammar/vocab scope
   - `exercise-guidelines-{LEVEL}.md` — exercise patterns per level
4. Apply the §4 review dimensions in `SKILL.md`.
5. After every review, output **Suggested Memory Updates** (per `SKILL.md` §8).
   The user approves each entry; approved entries are appended to the
   appropriate append-only file.

## Self-healing strategy

The skill has three layers:

| Layer | Files | Edit policy |
|-------|-------|-------------|
| **Procedure** (how to review) | `SKILL.md`, `README.md` | Only edit when the user explicitly asks for structural changes (e.g. adding a new review dimension). |
| **Per-level rules** (what's in/out of scope) | `exercise-guidelines-{level}.md` | Edit when the curriculum changes or a new level is added. |
| **Knowledge base** (recurring patterns, false positives) | `common-pitfalls.md`, `false-positives.md`, `review-memory.md`, `decision-log.md`, `style-guide.md`, `curriculum.md`, `review-checklist.md` | **Append-only.** Reviewer proposes entries; user approves and writes them. Prevents prompt drift. |

Why this design?

- **Procedure** changes rarely and only when the review process itself
  changes (e.g. adding a new dimension or output format).
- **Per-level rules** change with curriculum updates.
- **Knowledge base** grows continuously without ever rewriting prior content —
  the reviewer can always read the full history of what was learned.

## Distinction from `../review-lesson/`

| | `review-lesson` | `review-exercises` |
|---|---|---|
| **Scope** | Whole lesson (lesson.md + lesson-short.md + exercises.yml) | exercises.yml only |
| **Focus** | CEFR alignment, pedagogy, naturalness, lesson structure | Schema correctness, answer logic, grammar in exercise text, audio filename accuracy |
| **Per-level rules** | `guidelines-{level}.md` (shared) | `exercise-guidelines-{level}.md` (exercise-specific patterns) |
| **Memory files** | `common-pitfalls.md` etc. (lesson-focused) | `common-pitfalls.md` etc. (exercise-focused) |

The two skills are complementary. `review-lesson` provides the grammar/vocab
scope; `review-exercises` provides the schema + answer-logic verification. Both
load the same `../review-lesson/guidelines-{LEVEL}.md` for shared scope.

## Suggested-memory-update format

After each review, produce a table like:

```markdown
## Suggested Memory Updates

| File | Action | Content |
|------|--------|---------|
| common-pitfalls.md | append | "**A1 H3 distractor count** — `bank.length - answers.length` must equal the 'N words not needed' claim in instructions. Example: A1/02 had bank=9, answers=6, claim=5 (wrong)." |
| false-positives.md | append | "**A1/14 dialog drift** — Prüfungstraining exam lessons intentionally skip dialogs in `lesson-short.md`. The Short is a grammar review, not a transcript." |
| review-memory.md | append | "**C3 cross-gap ambiguity** — recurring issue in A1/03 (ESSE/BRAUCHE) and A1/09 (GEFÄLLT/PASST/STEHT). Always check each bank word against all gaps." |
| decision-log.md | append | "Added §4.12 Cross-language interference per user request 2026-06-25 — reviewer must check L1-specific distractors for Portuguese (primary persona Bruno)." |
```

Do **not** auto-write to the memory files. Wait for user approval.
